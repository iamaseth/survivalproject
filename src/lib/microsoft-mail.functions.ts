import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MIN_SEND_INTERVAL_SECONDS = 60;
const MAX_BATCH_SIZE = 100;

type StageMessage = {
  creatorId: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  bodyText: string;
};

export const stageMicrosoftMailBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; messages: StageMessage[] }) => input)
  .handler(async ({ data, context }) => {
    if (!data.name.trim()) throw new Error("Batch name is required.");
    if (!Array.isArray(data.messages) || data.messages.length === 0) throw new Error("At least one message is required.");
    if (data.messages.length > MAX_BATCH_SIZE) throw new Error(`A batch may contain at most ${MAX_BATCH_SIZE} messages.`);

    for (const m of data.messages) {
      if (!m.creatorId || !m.recipientEmail || !m.subject.trim() || !m.bodyText.trim()) {
        throw new Error("Every staged message requires creator, recipient, subject, and body.");
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: batch, error: batchError } = await supabaseAdmin
      .from("microsoft_mail_batches")
      .insert({ created_by: context.userId, name: data.name.trim(), status: "staged" })
      .select("id, name, status, created_at")
      .single();
    if (batchError || !batch) throw new Error(batchError?.message ?? "Could not create staged batch.");

    const rows = data.messages.map((m) => ({
      batch_id: batch.id,
      creator_id: m.creatorId,
      recipient_email: m.recipientEmail.trim(),
      recipient_name: m.recipientName?.trim() || null,
      subject: m.subject.trim(),
      body_text: m.bodyText.trim(),
      status: "staged",
    }));
    const { error: queueError } = await supabaseAdmin.from("microsoft_mail_queue").insert(rows);
    if (queueError) {
      await supabaseAdmin.from("microsoft_mail_batches").update({ status: "cancelled" }).eq("id", batch.id);
      throw new Error(queueError.message);
    }

    return { batch, count: rows.length, sendsStarted: false };
  });

export const approveMicrosoftMailBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { batchId: string; confirmRecipientCount: number }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: batch } = await supabaseAdmin
      .from("microsoft_mail_batches")
      .select("id, created_by, status")
      .eq("id", data.batchId)
      .single();
    if (!batch || batch.created_by !== context.userId) throw new Error("Batch not found.");
    if (batch.status !== "staged" && batch.status !== "paused") throw new Error("Only staged or paused batches can be approved.");

    const { count } = await supabaseAdmin
      .from("microsoft_mail_queue")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", data.batchId)
      .eq("status", "staged");
    if ((count ?? 0) !== data.confirmRecipientCount) {
      throw new Error(`Confirmation count mismatch. Expected ${count ?? 0} recipients.`);
    }

    const approvedAt = new Date().toISOString();
    const { error: queueError } = await supabaseAdmin
      .from("microsoft_mail_queue")
      .update({ status: "approved", approved_at: approvedAt, updated_at: approvedAt })
      .eq("batch_id", data.batchId)
      .eq("status", "staged");
    if (queueError) throw new Error(queueError.message);

    const { error: batchError } = await supabaseAdmin
      .from("microsoft_mail_batches")
      .update({ status: "approved", approved_at: approvedAt, approved_by: context.userId, updated_at: approvedAt })
      .eq("id", data.batchId);
    if (batchError) throw new Error(batchError.message);

    return { ok: true, approvedCount: count ?? 0, intervalSeconds: MIN_SEND_INTERVAL_SECONDS };
  });

export const pauseMicrosoftMailBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { batchId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("microsoft_mail_batches")
      .update({ status: "paused", updated_at: new Date().toISOString() })
      .eq("id", data.batchId)
      .eq("created_by", context.userId)
      .eq("status", "approved");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// This processes AT MOST one message. It never stages or approves messages.
// Call from a trusted scheduler no more than once per minute. The database RPC
// independently enforces the 60-second minimum interval, so concurrent calls do
// not turn into a blast.
export async function processOneApprovedMicrosoftMail(): Promise<{
  processed: boolean;
  sent?: boolean;
  queueId?: string;
  retryAfterSeconds?: number | null;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: claimed, error } = await supabaseAdmin.rpc("claim_next_microsoft_mail", {
    min_interval_seconds: MIN_SEND_INTERVAL_SECONDS,
  });
  if (error) throw new Error(error.message);
  const item = Array.isArray(claimed) ? claimed[0] : null;
  if (!item) return { processed: false };

  const { sendMicrosoftMail } = await import("@/server/microsoft-mail.server");
  let result;
  try {
    result = await sendMicrosoftMail({
      to: item.recipient_email,
      toName: item.recipient_name,
      subject: item.subject,
      bodyText: item.body_text,
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    await supabaseAdmin.from("microsoft_mail_queue").update({
      status: "failed", last_error: reason, updated_at: new Date().toISOString(),
    }).eq("id", item.id);
    return { processed: true, sent: false, queueId: item.id };
  }

  if (!result.ok) {
    const throttled = result.status === 429 || result.status === 503;
    await supabaseAdmin.from("microsoft_mail_queue").update({
      status: throttled ? "approved" : "failed",
      claimed_at: throttled ? null : item.claimed_at,
      last_error: `HTTP ${result.status}: ${result.reason}`,
      updated_at: new Date().toISOString(),
    }).eq("id", item.id);
    return { processed: true, sent: false, queueId: item.id, retryAfterSeconds: result.retryAfterSeconds };
  }

  await supabaseAdmin.from("microsoft_mail_queue").update({
    status: "sent", sent_at: result.sentAt, last_error: null, updated_at: result.sentAt,
  }).eq("id", item.id);
  await supabaseAdmin.from("microsoft_mail_send_state").update({
    last_successful_send_at: result.sentAt, updated_at: result.sentAt,
  }).eq("singleton", true);

  return { processed: true, sent: true, queueId: item.id };
}
