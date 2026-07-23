// Gmail App User Connector server functions.
// Called from client via useServerFn — Supabase bearer is attached automatically.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CREATOR_GMAIL_LABELS, labelForStage } from "./gmail-labels";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
const CONNECTOR_ID = "google_mail";

// ---------- Connect / status / disconnect ----------

export const getGmailConnectionStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!key) return { connected: false as const };
    // Look up cached email address if any.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("gmail_poll_state").select("email_address, last_polled_at")
      .eq("user_id", context.userId).maybeSingle();
    return { connected: true as const, emailAddress: data?.email_address ?? null, lastPolledAt: data?.last_polled_at ?? null };
  });

export const startGmailConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { targetOrigin: string }) => input)
  .handler(async ({ data, context }) => {
    const clientKey = process.env.GOOGLE_MAIL_APP_USER_CONNECTOR_CLIENT_API_KEY;
    if (!clientKey) throw new Error("Gmail client is not configured for this project.");
    const { authorizeAppUserOAuth } = await import("@/integrations/lovable/appUserConnector");
    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: CONNECTOR_ID,
      appUserId: context.userId,
      clientAPIKey: clientKey,
      returnUrl: data.targetOrigin,
      responseMode: "web_message",
      webMessageTargetOrigin: data.targetOrigin,
      credentialsConfiguration: {
        scopes: [
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.compose",
          "https://www.googleapis.com/auth/gmail.modify",
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.labels",
        ],
      },
    });
    return { authorizationUrl };
  });

export const saveGmailConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { connectionAPIKey: string }) => input)
  .handler(async ({ data, context }) => {
    const { saveConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    await saveConnectionKeyForUser(context.userId, CONNECTOR_ID, data.connectionAPIKey);

    // Fetch profile email + ensure labels exist.
    try {
      const { callAsAppUser } = await import("@/integrations/lovable/appUserConnector");
      const profileRes = await callAsAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: data.connectionAPIKey,
        connectorId: CONNECTOR_ID, path: "/gmail/v1/users/me/profile",
      });
      const profile = profileRes.ok ? (await profileRes.json()) as { emailAddress?: string } : null;

      const labelIds = await ensureLabelsExist(data.connectionAPIKey);

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("gmail_poll_state").upsert(
        {
          user_id: context.userId,
          email_address: profile?.emailAddress ?? null,
          label_ids: labelIds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      return { ok: true, emailAddress: profile?.emailAddress ?? null };
    } catch (e) {
      // Save succeeded; label / profile pre-fill is best effort.
      return { ok: true, emailAddress: null, warning: e instanceof Error ? e.message : String(e) };
    }
  });

export const disconnectGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getConnectionKeyForUser, deleteConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (key) {
      try {
        const { disconnectAppUser } = await import("@/integrations/lovable/appUserConnector");
        await disconnectAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: key, connectorId: CONNECTOR_ID });
      } catch { /* ignore — still remove locally */ }
    }
    await deleteConnectionKeyForUser(context.userId, CONNECTOR_ID);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("gmail_poll_state").delete().eq("user_id", context.userId);
    return { ok: true };
  });

// ---------- Label helpers ----------

async function ensureLabelsExist(connectionAPIKey: string): Promise<Record<string, string>> {
  const { callAsAppUser } = await import("@/integrations/lovable/appUserConnector");
  const listRes = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey, connectorId: CONNECTOR_ID,
    path: "/gmail/v1/users/me/labels",
  });
  if (!listRes.ok) return {};
  const listData = await listRes.json() as { labels?: Array<{ id: string; name: string }> };
  const existing = new Map((listData.labels ?? []).map((l) => [l.name, l.id]));
  const out: Record<string, string> = {};
  for (const name of CREATOR_GMAIL_LABELS) {
    const found = existing.get(name);
    if (found) { out[name] = found; continue; }
    const createRes = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey, connectorId: CONNECTOR_ID,
      path: "/gmail/v1/users/me/labels",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, labelListVisibility: "labelShow", messageListVisibility: "show" }),
      },
    });
    if (createRes.ok) {
      const created = await createRes.json() as { id: string };
      out[name] = created.id;
    }
  }
  return out;
}

// ---------- Send email ----------

function encodeBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildRawEmail(opts: {
  to: string; cc?: string; subject: string; body: string; from?: string; inReplyTo?: string; references?: string;
}): string {
  const lines = [
    `To: ${opts.to}`,
    opts.cc ? `Cc: ${opts.cc}` : "",
    opts.from ? `From: ${opts.from}` : "",
    `Subject: ${opts.subject}`,
    opts.inReplyTo ? `In-Reply-To: ${opts.inReplyTo}` : "",
    opts.references ? `References: ${opts.references}` : "",
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    opts.body,
  ].filter(Boolean);
  return encodeBase64Url(lines.join("\r\n"));
}

export const sendGmailToCreator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    creatorId: string;
    creatorEmail: string;
    creatorName?: string;
    subject: string;
    body: string;
    cc?: string;
    threadId?: string;
    inReplyTo?: string;
    stage?: string; // to pick which label to apply
  }) => input)
  .handler(async ({ data, context }) => {
    const { getConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    const connectionAPIKey = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!connectionAPIKey) throw new Error("Gmail is not connected. Connect your Gmail in Settings first.");

    const { callAsAppUser } = await import("@/integrations/lovable/appUserConnector");
    const raw = buildRawEmail({
      to: data.creatorName ? `${data.creatorName} <${data.creatorEmail}>` : data.creatorEmail,
      cc: data.cc,
      subject: data.subject,
      body: data.body,
      inReplyTo: data.inReplyTo,
      references: data.inReplyTo,
    });
    const sendRes = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey, connectorId: CONNECTOR_ID,
      path: "/gmail/v1/users/me/messages/send",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw, ...(data.threadId ? { threadId: data.threadId } : {}) }),
      },
    });
    if (!sendRes.ok) {
      const err = await sendRes.text();
      throw new Error(`Gmail send failed (${sendRes.status}): ${err}`);
    }
    const sent = await sendRes.json() as { id: string; threadId: string; labelIds?: string[] };

    // Apply the workflow-stage label + parent "Creator Partnerships".
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: state } = await supabaseAdmin
      .from("gmail_poll_state").select("label_ids, email_address").eq("user_id", context.userId).maybeSingle();
    const labels = (state?.label_ids ?? {}) as Record<string, string>;
    const stageLabel = labelForStage(data.stage);
    const addLabelIds = [labels["Creator Partnerships"], labels[stageLabel]].filter(Boolean) as string[];
    if (addLabelIds.length > 0) {
      await callAsAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey, connectorId: CONNECTOR_ID,
        path: `/gmail/v1/users/me/messages/${sent.id}/modify`,
        init: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addLabelIds }),
        },
      });
    }

    // Cache the sent message so the conversation history shows it immediately.
    await supabaseAdmin.from("gmail_messages").upsert({
      user_id: context.userId,
      creator_id: data.creatorId,
      gmail_message_id: sent.id,
      gmail_thread_id: sent.threadId,
      direction: "sent",
      from_email: state?.email_address ?? null,
      to_emails: [data.creatorEmail],
      subject: data.subject,
      snippet: data.body.slice(0, 200),
      body_text: data.body,
      label_ids: addLabelIds,
      sent_at: new Date().toISOString(),
    }, { onConflict: "user_id,gmail_message_id" });

    return { ok: true, messageId: sent.id, threadId: sent.threadId };
  });

// ---------- AI drafter (Gemini 2.5 Flash) ----------

export type DraftMode =
  | "Initial Outreach" | "Follow-up" | "Thank You" | "Shipping"
  | "Campaign Invitation" | "Collaboration Proposal"
  | "Rewrite" | "Shorter" | "Friendlier" | "More Professional";

const SYSTEM_PROMPT = `You write short, warm, professional emails on behalf of the Survival Tabs Creator Partnerships team to influencers and content creators. Survival Tabs makes emergency food ration bars (~1200 calories/tab, 25-year shelf life) beloved by prepper, camping, hunting, EDC, homestead and off-grid creators. Voice: confident, respectful of the creator's audience, no hype, no emojis. Length: 90-140 words unless asked for shorter. Always include a subject line as the FIRST line prefixed exactly "Subject: ". Then a blank line. Then the body. Do not include salutation placeholders like [Name] — use the provided creator name. Sign off with the sender's first name only.`;

function draftInstruction(mode: DraftMode, existing?: string): string {
  const rewriteBase = existing ? `\n\nExisting draft to modify:\n---\n${existing}\n---` : "";
  switch (mode) {
    case "Initial Outreach": return "Write a first-contact email introducing Survival Tabs and offering a free sample pack in exchange for honest feedback. Reference their content niche.";
    case "Follow-up": return `Write a light, no-pressure follow-up to a previous unanswered email.${rewriteBase}`;
    case "Thank You": return "Write a thank-you email after the creator posted content featuring Survival Tabs.";
    case "Shipping": return "Write a short shipping-notification email with tracking placeholder [TRACKING] and expected delivery placeholder [ETA].";
    case "Campaign Invitation": return "Write an invitation to a paid campaign — mention a compensated collaboration and ask for their rate.";
    case "Collaboration Proposal": return "Write a longer collaboration proposal outlining deliverables (1 video + 2 stories) and a paid partnership.";
    case "Rewrite": return `Rewrite this email keeping the same intent but with a fresh angle.${rewriteBase}`;
    case "Shorter": return `Rewrite this email in 60 words or fewer while keeping the ask.${rewriteBase}`;
    case "Friendlier": return `Rewrite this email in a warmer, more casual tone.${rewriteBase}`;
    case "More Professional": return `Rewrite this email in a more formal, business tone.${rewriteBase}`;
  }
}

export const generateEmailDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    mode: DraftMode;
    creatorName: string;
    creatorHandle?: string;
    creatorNiche?: string;
    senderFirstName: string;
    existingDraft?: string;
    extraContext?: string;
  }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    const userMsg = [
      `Creator name: ${data.creatorName}`,
      data.creatorHandle ? `Creator handle: ${data.creatorHandle}` : null,
      data.creatorNiche ? `Creator niche: ${data.creatorNiche}` : null,
      `Sender first name: ${data.senderFirstName}`,
      data.extraContext ? `Extra context: ${data.extraContext}` : null,
      "",
      draftInstruction(data.mode, data.existingDraft),
    ].filter(Boolean).join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI draft failed (${res.status}): ${t.slice(0, 300)}`);
    }
    const body = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = body.choices?.[0]?.message?.content?.trim() ?? "";
    // Split "Subject: ..." first line from body.
    const match = raw.match(/^Subject:\s*(.+?)\r?\n\r?\n?([\s\S]*)$/);
    if (match) return { subject: match[1].trim(), body: match[2].trim() };
    return { subject: "", body: raw };
  });

// ---------- Poll for replies ----------

interface GmailListMessage { id: string; threadId: string }
interface GmailMessage {
  id: string; threadId: string; snippet?: string; labelIds?: string[]; internalDate?: string;
  payload?: { headers?: Array<{ name: string; value: string }>; parts?: unknown; body?: { data?: string } };
}

function headerValue(headers: Array<{ name: string; value: string }> | undefined, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseFromHeader(from: string): { name: string; email: string } {
  const m = from.match(/^(.*?)<(.+?)>$/);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, ""), email: m[2].trim() };
  return { name: "", email: from.trim() };
}

export const pollGmailForReplies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    const connectionAPIKey = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!connectionAPIKey) return { polled: false as const, reason: "not_connected" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: state } = await supabaseAdmin
      .from("gmail_poll_state").select("last_polled_at").eq("user_id", context.userId).maybeSingle();
    // Search for messages since last poll (or last 24h on first poll).
    const sinceUnix = Math.floor(
      (state?.last_polled_at ? new Date(state.last_polled_at).getTime() : Date.now() - 24 * 3600_000) / 1000,
    );

    const { callAsAppUser } = await import("@/integrations/lovable/appUserConnector");
    const listRes = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey, connectorId: CONNECTOR_ID,
      path: `/gmail/v1/users/me/messages?q=${encodeURIComponent(`after:${sinceUnix} -from:me`)}&maxResults=25`,
    });
    if (!listRes.ok) {
      return { polled: false as const, reason: `list_failed_${listRes.status}` };
    }
    const listData = await listRes.json() as { messages?: GmailListMessage[] };
    const ids = (listData.messages ?? []).map((m) => m.id);

    // Preload known creator emails so we can map replies to creators.
    const { CREATORS } = await import("./creator-partnerships");
    const emailToCreator = new Map<string, { id: string; name: string }>();
    for (const c of CREATORS) {
      if (c.email) emailToCreator.set(c.email.toLowerCase(), { id: c.id, name: c.name });
    }

    let stored = 0;
    for (const id of ids) {
      // Skip if already stored.
      const { data: existing } = await supabaseAdmin
        .from("gmail_messages").select("id").eq("user_id", context.userId).eq("gmail_message_id", id).maybeSingle();
      if (existing) continue;

      const msgRes = await callAsAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey, connectorId: CONNECTOR_ID,
        path: `/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=To`,
      });
      if (!msgRes.ok) continue;
      const msg = await msgRes.json() as GmailMessage;
      const from = parseFromHeader(headerValue(msg.payload?.headers, "From"));
      const subject = headerValue(msg.payload?.headers, "Subject");
      const toRaw = headerValue(msg.payload?.headers, "To");
      const creator = emailToCreator.get(from.email.toLowerCase()) ?? null;

      await supabaseAdmin.from("gmail_messages").upsert({
        user_id: context.userId,
        creator_id: creator?.id ?? null,
        gmail_message_id: msg.id,
        gmail_thread_id: msg.threadId,
        direction: "received",
        from_email: from.email,
        from_name: from.name || creator?.name || null,
        to_emails: toRaw ? [toRaw] : [],
        subject,
        snippet: msg.snippet ?? null,
        label_ids: msg.labelIds ?? [],
        sent_at: msg.internalDate ? new Date(Number(msg.internalDate)).toISOString() : new Date().toISOString(),
      }, { onConflict: "user_id,gmail_message_id" });
      stored += 1;
    }

    await supabaseAdmin.from("gmail_poll_state").upsert({
      user_id: context.userId,
      last_polled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return { polled: true as const, checked: ids.length, stored };
  });

// ---------- Read cached messages ----------

export const listCreatorMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { creatorId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("gmail_messages")
      .select("id, gmail_message_id, gmail_thread_id, direction, from_email, from_name, to_emails, subject, snippet, sent_at, label_ids")
      .eq("creator_id", data.creatorId)
      .order("sent_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    // Also flag viewer's ownership (whether they sent it or received it).
    return { messages: rows ?? [], viewerId: context.userId };
  });

export const listRecentMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("gmail_messages")
      .select("id, gmail_message_id, creator_id, direction, from_email, from_name, subject, snippet, sent_at, user_id")
      .order("sent_at", { ascending: false })
      .limit(50);
    return { messages: rows ?? [], viewerId: context.userId };
  });
