import { logger } from "@/lib/logger.server";

import { renderTemplate } from "./templates";
import { sendViaProvider } from "./provider.server";

function statusFromProviderResult(ok: boolean, error: string | null | undefined): string {
  if (ok) return "sent";
  return error === "NO_PROVIDER_CONFIGURED" ? "skipped_no_provider" : "failed";
}

function toTemplateVariables(data: Record<string, unknown> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!data) return out;
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    out[key] =
      typeof value === "string" || typeof value === "number"
        ? String(value)
        : JSON.stringify(value);
  }
  return out;
}

export interface TransactionalEmailInput {
  /** Coincide con NotificationEvent e con email_templates.key per gli eventi di ciclo vita. */
  event: string;
  userId?: string | null;
  email?: string | null;
  data?: Record<string, unknown> | undefined;
}

/**
 * Invio di un'email di ciclo vita (benvenuto, pagamento fallito, rinnovo,
 * ecc.), chiamata da notifications.server.ts. Non controlla marketing_opt_out:
 * sono comunicazioni dovute legate al servizio, non promozionali. Non lancia
 * mai eccezioni verso il chiamante (fail-open, come dispatchNotification).
 */
export async function sendTransactionalEmail(input: TransactionalEmailInput): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let email = input.email ?? null;
    let name: string | null = null;
    let planName: string | null = null;

    if (input.userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, name")
        .eq("id", input.userId)
        .maybeSingle();
      email = email ?? profile?.email ?? null;
      name = profile?.name ?? null;

      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("plans(name)")
        .eq("user_id", input.userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      planName = (sub?.plans as { name?: string } | null)?.name ?? null;
    }

    if (!email) {
      logger.warn("email: transazionale saltata, nessuna email destinataria", {
        event: input.event,
        userId: input.userId ?? null,
      });
      return;
    }
    const emailLower = email.toLowerCase();

    const { data: template } = await supabaseAdmin
      .from("email_templates")
      .select("id, subject, body_html")
      .eq("key", input.event)
      .eq("category", "transactional")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const variables: Record<string, string> = {
      name: name ?? "",
      plan_name: planName ?? "",
      ...toTemplateVariables(input.data),
    };

    const subject = template
      ? renderTemplate(template.subject, variables)
      : `InkForgeKdp — ${input.event}`;
    const html = template ? renderTemplate(template.body_html, variables) : `<p>${input.event}</p>`;

    const result = await sendViaProvider({ to: emailLower, subject, html });

    await supabaseAdmin.from("email_sends").insert({
      recipient_email: emailLower,
      recipient_user_id: input.userId ?? null,
      kind: "transactional",
      event: input.event,
      template_id: template?.id ?? null,
      subject,
      status: statusFromProviderResult(result.ok, result.error),
      error: result.error ?? null,
      sent_at: result.ok ? new Date().toISOString() : null,
    });

    // Il benvenuto è il momento naturale in cui un lead diventa abbonato: collega
    // le due righe per poter misurare il tasso di conversione, best-effort.
    if (input.event === "welcome" && input.userId) {
      await supabaseAdmin.rpc("link_lead_to_user", { _email: emailLower, _user_id: input.userId });
    }
  } catch (error) {
    logger.error("email: invio transazionale fallito", {
      event: input.event,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export interface PromotionalEmailInput {
  to: string;
  recipientUserId?: string | null;
  recipientLeadId?: string | null;
  subject: string;
  bodyHtml: string;
  variables?: Record<string, string | number | null | undefined>;
  campaignId?: string | null;
  templateId?: string | null;
}

/**
 * Invio promozionale (campagna broadcast o benvenuto lead): a differenza di
 * sendTransactionalEmail, controlla SEMPRE la soppressione (lead disiscritto
 * o profiles.marketing_opt_out) prima di procedere, e inietta il link di
 * disiscrizione in {{unsubscribe_url}}. Ritorna lo stato scritto in
 * email_sends, utile al chiamante per aggiornare i contatori di una campagna.
 */
export async function sendPromotionalEmail(
  input: PromotionalEmailInput,
): Promise<{ status: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const emailLower = input.to.trim().toLowerCase();

  let suppressed = false;
  let unsubscribeToken: string | null = null;

  if (input.recipientLeadId) {
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("status, unsubscribe_token")
      .eq("id", input.recipientLeadId)
      .maybeSingle();
    suppressed = lead?.status === "unsubscribed";
    unsubscribeToken = lead?.unsubscribe_token ?? null;
  } else if (input.recipientUserId) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("marketing_opt_out, email_unsubscribe_token")
      .eq("id", input.recipientUserId)
      .maybeSingle();
    suppressed = profile?.marketing_opt_out === true;
    unsubscribeToken = profile?.email_unsubscribe_token ?? null;
  } else {
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("status, unsubscribe_token")
      .eq("email", emailLower)
      .maybeSingle();
    if (lead) {
      suppressed = lead.status === "unsubscribed";
      unsubscribeToken = lead.unsubscribe_token;
    } else {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("marketing_opt_out, email_unsubscribe_token")
        .eq("email", emailLower)
        .maybeSingle();
      if (profile) {
        suppressed = profile.marketing_opt_out === true;
        unsubscribeToken = profile.email_unsubscribe_token;
      }
    }
  }

  const appUrl = process.env["PUBLIC_APP_URL"] ?? "";
  const variables: Record<string, string | number | null | undefined> = {
    ...(input.variables ?? {}),
    app_url: appUrl,
    unsubscribe_url: unsubscribeToken ? `${appUrl}/unsubscribe/${unsubscribeToken}` : "",
  };
  const subject = renderTemplate(input.subject, variables);
  const html = renderTemplate(input.bodyHtml, variables);

  const baseRow = {
    recipient_email: emailLower,
    recipient_user_id: input.recipientUserId ?? null,
    recipient_lead_id: input.recipientLeadId ?? null,
    kind: "promotional" as const,
    campaign_id: input.campaignId ?? null,
    template_id: input.templateId ?? null,
    subject,
  };

  if (suppressed) {
    await supabaseAdmin.from("email_sends").insert({ ...baseRow, status: "skipped_suppressed" });
    return { status: "skipped_suppressed" };
  }

  const result = await sendViaProvider({ to: emailLower, subject, html });
  const status = statusFromProviderResult(result.ok, result.error);

  await supabaseAdmin.from("email_sends").insert({
    ...baseRow,
    status,
    error: result.error ?? null,
    sent_at: result.ok ? new Date().toISOString() : null,
  });

  return { status };
}

export interface ManualEmailInput {
  recipientUserId: string;
  subject: string;
  html: string;
  sentByAdminId: string;
}

/**
 * Corrispondenza 1:1 dall'admin verso un abbonato specifico (non un invio di
 * massa): nessun controllo di soppressione, è comunicazione diretta attesa
 * dall'utente, non promozionale.
 */
export async function sendManualEmail(input: ManualEmailInput): Promise<{ status: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("id", input.recipientUserId)
    .maybeSingle();
  if (!profile?.email) throw new Error("L'utente non ha un'email associata");
  const emailLower = profile.email.toLowerCase();

  const result = await sendViaProvider({
    to: emailLower,
    subject: input.subject,
    html: input.html,
  });
  const status = statusFromProviderResult(result.ok, result.error);

  await supabaseAdmin.from("email_sends").insert({
    recipient_email: emailLower,
    recipient_user_id: input.recipientUserId,
    kind: "manual",
    subject: input.subject,
    status,
    error: result.error ?? null,
    sent_by: input.sentByAdminId,
    sent_at: result.ok ? new Date().toISOString() : null,
  });

  return { status };
}
