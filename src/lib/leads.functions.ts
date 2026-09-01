import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { enforceRateLimit } from "@/lib/rateLimit.server";
import { isLocale } from "@/lib/i18n/config";

const submitInput = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().max(200).optional(),
  locale: z.string().max(10).optional(),
  consent: z.literal(true),
});

/**
 * Iscrizione alla newsletter dalla landing page: pubblica, nessuna autenticazione
 * richiesta (stesso pattern di getPublicStatus in status.functions.ts). Il
 * consenso esplicito è obbligatorio a livello di schema (letterale `true`),
 * non solo di UI — richiesto per l'invio promozionale sotto GDPR.
 */
export const submitNewsletterLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitInput.parse(data))
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase();
    await enforceRateLimit(`newsletter-signup:${email}`, { maxHits: 5, windowSeconds: 3600 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("leads")
      .select("status")
      .eq("email", email)
      .maybeSingle();
    const alreadySubscribed = existing?.status === "subscribed";

    const { data: lead, error } = await supabaseAdmin.rpc("capture_lead", {
      _email: email,
      ...(data.name ? { _name: data.name } : {}),
      ...(isLocale(data.locale) ? { _locale: data.locale } : {}),
      _source: "landing_newsletter",
    });
    if (error) throw new Error(error.message);

    if (!alreadySubscribed) {
      const { sendPromotionalEmail } = await import("@/lib/email/send.server");
      const { data: template } = await supabaseAdmin
        .from("email_templates")
        .select("id, subject, body_html")
        .eq("key", "welcome_lead")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (template && lead) {
        await sendPromotionalEmail({
          to: email,
          recipientLeadId: lead.id,
          subject: template.subject,
          bodyHtml: template.body_html,
          variables: { name_optional: data.name ? `, ${data.name}` : "" },
          templateId: template.id,
        });
      }

      const { dispatchNotification } = await import("@/services/notifications.server");
      await dispatchNotification({ event: "lead_captured", email });
    }

    return { ok: true, alreadySubscribed };
  });
