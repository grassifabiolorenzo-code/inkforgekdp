import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requirePermission, requireStepUpMfa } from "@/lib/admin/adminMiddleware";

const AUDIENCES = [
  "all_leads",
  "all_subscribers",
  "plan_starter",
  "plan_pro",
  "plan_business",
  "all_contacts",
] as const;

/** Limite di sicurezza per singola esecuzione: evita un invio a tempo indeterminato su una funzione server. */
const MAX_RECIPIENTS = 5000;

const listInput = z.object({
  status: z.string().max(40).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export const listEmailCampaigns = createServerFn({ method: "GET" })
  .middleware([requirePermission("marketing", "read")])
  .inputValidator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const offset = (data.page - 1) * data.pageSize;

    const { data: rows, error } = await supabaseAdmin.rpc("admin_list_email_campaigns", {
      ...(data.status ? { _status: data.status } : {}),
      _limit: data.pageSize,
      _offset: offset,
    });
    if (error) throw new Error(error.message);

    const totalCount = rows?.[0]?.total_count ?? 0;
    return {
      campaigns: (rows ?? []).map(({ total_count: _totalCount, ...row }) => row),
      totalCount,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

const createInput = z.object({
  name: z.string().trim().min(1).max(200),
  subject: z.string().trim().min(1).max(300),
  bodyHtml: z.string().trim().min(1),
  audience: z.enum(AUDIENCES),
  scheduledAt: z.string().datetime().optional(),
});

export const createEmailCampaign = createServerFn({ method: "POST" })
  .middleware([requirePermission("marketing", "write")])
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { data: row, error } = await supabaseAdmin
      .from("email_campaigns")
      .insert({
        name: data.name,
        subject: data.subject,
        body_html: data.bodyHtml,
        audience: data.audience,
        status: data.scheduledAt ? "scheduled" : "draft",
        scheduled_at: data.scheduledAt ?? null,
        created_by: context.userId,
      })
      .select("id")
      .single();

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "EMAIL_CAMPAIGN_CREATED",
      targetType: "email_campaign",
      targetId: row?.id ?? null,
      result: error ? "failure" : "success",
      metadata: { audience: data.audience },
    });
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

const campaignIdInput = z.object({ campaignId: z.string().uuid() });

export const deleteEmailCampaign = createServerFn({ method: "POST" })
  .middleware([requirePermission("marketing", "delete")])
  .inputValidator((data: unknown) => campaignIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    // Solo le bozze/programmate possono essere eliminate: una campagna già inviata resta come
    // storico immutabile (stesso principio degli audit_logs, mai cancellabili da UI).
    const { error } = await supabaseAdmin
      .from("email_campaigns")
      .delete()
      .eq("id", data.campaignId)
      .in("status", ["draft", "scheduled", "cancelled"]);

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "EMAIL_CAMPAIGN_DELETED",
      targetType: "email_campaign",
      targetId: data.campaignId,
      result: error ? "failure" : "success",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

interface Recipient {
  email: string;
  userId?: string | null;
  leadId?: string | null;
}

async function resolveAudience(
  supabaseAdmin: typeof import("@/integrations/supabase/client.server").supabaseAdmin,
  audience: (typeof AUDIENCES)[number],
): Promise<Recipient[]> {
  const recipients: Recipient[] = [];

  if (audience === "all_leads" || audience === "all_contacts") {
    const { data: leads } = await supabaseAdmin
      .from("leads")
      .select("id, email")
      .eq("status", "subscribed")
      .limit(MAX_RECIPIENTS);
    for (const lead of leads ?? []) recipients.push({ email: lead.email, leadId: lead.id });
  }

  if (audience === "all_subscribers" || audience === "all_contacts") {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .not("email", "is", null)
      .limit(MAX_RECIPIENTS);
    for (const profile of profiles ?? []) {
      if (profile.email) recipients.push({ email: profile.email, userId: profile.id });
    }
  }

  if (audience === "plan_starter" || audience === "plan_pro" || audience === "plan_business") {
    const slug = audience.replace("plan_", "");
    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, status, plans!inner(slug), profiles!inner(id, email)")
      .eq("plans.slug", slug)
      .in("status", ["active", "on_trial"])
      .limit(MAX_RECIPIENTS);
    for (const sub of subs ?? []) {
      const profile = sub.profiles as unknown as { id: string; email: string | null };
      if (profile?.email) recipients.push({ email: profile.email, userId: profile.id });
    }
  }

  // Dedup per email (rilevante soprattutto per all_contacts, dove un lead può aver poi anche
  // sottoscritto un abbonamento): tiene la prima occorrenza.
  const seen = new Set<string>();
  return recipients.filter((r) => {
    const key = r.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Invio immediato: risolve l'audience, invia (sendPromotionalEmail applica da
 * solo la soppressione per ciascun destinatario) e aggiorna i contatori.
 * Azione irreversibile su potenzialmente molti destinatari: richiede 2FA
 * attivo, come le altre azioni distruttive del back office.
 */
export const sendEmailCampaignNow = createServerFn({ method: "POST" })
  .middleware([requireStepUpMfa("marketing", "write")])
  .inputValidator((data: unknown) => campaignIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");
    const { sendPromotionalEmail } = await import("@/lib/email/send.server");

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("email_campaigns")
      .select("*")
      .eq("id", data.campaignId)
      .maybeSingle();
    if (campaignError || !campaign) throw new Error("Campagna non trovata");
    if (campaign.status === "sent" || campaign.status === "sending") {
      throw new Error("Questa campagna è già stata inviata o è in corso di invio");
    }

    await supabaseAdmin
      .from("email_campaigns")
      .update({ status: "sending" })
      .eq("id", data.campaignId);

    const recipients = await resolveAudience(
      supabaseAdmin,
      campaign.audience as (typeof AUDIENCES)[number],
    );

    let sent = 0;
    let failed = 0;
    for (const recipient of recipients) {
      const result = await sendPromotionalEmail({
        to: recipient.email,
        recipientUserId: recipient.userId ?? null,
        recipientLeadId: recipient.leadId ?? null,
        subject: campaign.subject,
        bodyHtml: campaign.body_html,
        campaignId: campaign.id,
      });
      if (result.status === "sent") sent += 1;
      else failed += 1;
    }

    const { error } = await supabaseAdmin
      .from("email_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        recipients_total: recipients.length,
        recipients_sent: sent,
        recipients_failed: failed,
      })
      .eq("id", data.campaignId);

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "EMAIL_CAMPAIGN_SENT",
      targetType: "email_campaign",
      targetId: data.campaignId,
      result: error ? "failure" : "success",
      metadata: { audience: campaign.audience, recipients: recipients.length, sent, failed },
    });
    if (error) throw new Error(error.message);
    return { recipientsTotal: recipients.length, sent, failed };
  });
