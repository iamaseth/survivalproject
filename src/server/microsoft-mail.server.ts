const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function getAccessToken(): Promise<string> {
  const tenantId = requiredEnv("MICROSOFT_TENANT_ID");
  const clientId = requiredEnv("MICROSOFT_CLIENT_ID");
  const clientSecret = requiredEnv("MICROSOFT_CLIENT_SECRET");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default",
  });

  const res = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Microsoft token request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json() as { access_token?: string };
  if (!data.access_token) throw new Error("Microsoft token response did not include an access token.");
  return data.access_token;
}

export type MicrosoftSendResult =
  | { ok: true; sentAt: string }
  | { ok: false; status: number; reason: string; retryAfterSeconds: number | null };

export async function sendMicrosoftMail(input: {
  to: string;
  toName?: string | null;
  subject: string;
  bodyText: string;
}): Promise<MicrosoftSendResult> {
  const sender = requiredEnv("MICROSOFT_SENDER_EMAIL");
  const token = await getAccessToken();

  const res = await fetch(`${GRAPH_BASE}/users/${encodeURIComponent(sender)}/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: input.subject,
        body: { contentType: "Text", content: input.bodyText },
        toRecipients: [
          {
            emailAddress: {
              address: input.to,
              ...(input.toName ? { name: input.toName } : {}),
            },
          },
        ],
      },
      // Deliberately avoid creating Sent Items or drafts in the mailbox.
      saveToSentItems: false,
    }),
  });

  if (res.status === 202) {
    return { ok: true, sentAt: new Date().toISOString() };
  }

  const retryHeader = res.headers.get("Retry-After");
  const retryAfterSeconds = retryHeader && /^\d+$/.test(retryHeader) ? Number(retryHeader) : null;
  const text = await res.text();
  return {
    ok: false,
    status: res.status,
    reason: text.slice(0, 500) || `Microsoft Graph returned ${res.status}`,
    retryAfterSeconds,
  };
}
