/**
 * Diritto all'oblio (GDPR art. 17), condiviso tra l'autoservizio (privacy.functions.ts)
 * e la cancellazione da parte di un admin (admin/users.functions.ts): leads ed
 * email_sends non sono coperte dalla cascade FK su auth.users (leads è legata per
 * email, non per user_id; email_sends mantiene l'indirizzo come testo libero anche
 * dopo che recipient_user_id viene azzerato dalla cascade) — vanno ripulite qui,
 * SOLO dopo che la cancellazione dell'account su auth.users è già andata a buon fine.
 */
export async function eraseUserMarketingData(
  supabaseAdmin: typeof import("@/integrations/supabase/client.server").supabaseAdmin,
  userId: string,
  email: string | null,
): Promise<void> {
  if (email) {
    await supabaseAdmin.from("leads").delete().eq("email", email.toLowerCase());
  }
  await supabaseAdmin
    .from("email_sends")
    .update({ recipient_email: `deleted-${userId}@erased.invalid` })
    .eq("recipient_user_id", userId);
}
