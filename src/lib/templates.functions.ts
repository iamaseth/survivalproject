// Server functions for approved email templates.
// All authenticated; RLS enforces team-member scope. Approval verifies role
// server-side and stamps via the admin client (bypasses RLS but keeps the
// role check in-process).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { EmailTemplate } from "./templates";

function rowToTemplate(r: Record<string, unknown>): EmailTemplate {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    segment: (r.segment as string | null) ?? null,
    subject: String(r.subject ?? ""),
    body: String(r.body ?? ""),
    createdBy: String(r.created_by ?? ""),
    approvedBy: (r.approved_by as string | null) ?? null,
    approvedAt: (r.approved_at as string | null) ?? null,
    active: Boolean(r.active),
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
  };
}

export const listEmailTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { activeOnly?: boolean } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("email_templates")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data.activeOnly) q = q.eq("active", true);
    const { data: rows, error } = await q;
    if (error) throw error;
    return { templates: (rows ?? []).map(rowToTemplate) };
  });

export const upsertEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id?: string;
    name: string;
    segment?: string | null;
    subject: string;
    body: string;
  }) => {
    if (!input.name?.trim()) throw new Error("Template name is required");
    if (input.name.trim().length > 120) throw new Error("Template name is too long");
    return {
      id: input.id,
      name: input.name.trim(),
      segment: input.segment?.trim() || null,
      subject: input.subject ?? "",
      body: input.body ?? "",
    };
  })
  .handler(async ({ data, context }) => {
    if (data.id) {
      // Trigger auto-unapproves when name/segment/subject/body change.
      const { data: row, error } = await context.supabase
        .from("email_templates")
        .update({
          name: data.name,
          segment: data.segment,
          subject: data.subject,
          body: data.body,
        })
        .eq("id", data.id)
        .select("*")
        .single();
      if (error) throw error;
      return { template: rowToTemplate(row) };
    } else {
      const { data: row, error } = await context.supabase
        .from("email_templates")
        .insert({
          name: data.name,
          segment: data.segment,
          subject: data.subject,
          body: data.body,
          created_by: context.userId,
        })
        .select("*")
        .single();
      if (error) throw error;
      return { template: rowToTemplate(row) };
    }
  });

export const deleteEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input.id) throw new Error("Template id is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("email_templates")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const approveEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input.id) throw new Error("Template id is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    // Verify approver role using the user-scoped client (RLS + role table
    // read via user_roles own-row policy).
    const { data: roleRows, error: roleErr } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (roleErr) throw roleErr;
    const roles = (roleRows ?? []).map((r) => r.role);
    const canApprove =
      roles.includes("executive") || roles.includes("partnership_manager");
    if (!canApprove) {
      throw new Error("Only Executives or Partnership Managers can approve templates.");
    }

    // Approval-only update: does NOT change name/segment/subject/body, so
    // the unapprove-on-edit trigger does not fire.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("email_templates")
      .update({
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
        active: true,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw error;
    return { template: rowToTemplate(row) };
  });

// ---------- Starter templates: AI-generated drafts for the 6 categories ----------

const STARTER_CATEGORIES: Array<{
  name: string;
  mode:
    | "Initial Outreach" | "Follow-up" | "Thank You" | "Shipping"
    | "Campaign Invitation" | "Collaboration Proposal";
}> = [
  { name: "Initial Outreach (starter)", mode: "Initial Outreach" },
  { name: "Follow-up (starter)", mode: "Follow-up" },
  { name: "Thank You (starter)", mode: "Thank You" },
  { name: "Shipping (starter)", mode: "Shipping" },
  { name: "Campaign Invitation (starter)", mode: "Campaign Invitation" },
  { name: "Collaboration Proposal (starter)", mode: "Collaboration Proposal" },
];

const STARTER_SYSTEM_PROMPT = `You write short, warm, professional email TEMPLATES on behalf of the Survival Tabs Creator Partnerships team to influencers and content creators. Survival Tabs makes emergency food ration bars (~1200 calories/tab, 25-year shelf life) beloved by prepper, camping, hunting, EDC, homestead and off-grid creators. Voice: confident, respectful of the creator's audience, no hype, no emojis. Length: 90-140 words unless asked for shorter.

IMPORTANT — this is a REUSABLE TEMPLATE, not a personalized email. Do NOT use any specific creator's name, handle, or niche. Instead, use these Handlebars merge tokens VERBATIM wherever a personalized value would go:
  {{creator_name}}   — the creator's display name
  {{platform}}       — their primary platform (YouTube, TikTok, Instagram, etc.)
  {{handle}}         — their handle on that platform
  {{sender_first_name}} — the sender's first name (use in the sign-off)

Always include a subject line as the FIRST line prefixed exactly "Subject: ". Then a blank line. Then the body. The body must open with a greeting to {{creator_name}} and sign off with {{sender_first_name}}. Do not invent any other tokens. Do not use square-bracket placeholders like [Name].`;

function starterInstruction(mode: (typeof STARTER_CATEGORIES)[number]["mode"]): string {
  switch (mode) {
    case "Initial Outreach":
      return "Write a first-contact template introducing Survival Tabs and offering a free sample pack in exchange for honest feedback. Reference their content niche generically via {{platform}} and {{handle}}.";
    case "Follow-up":
      return "Write a light, no-pressure follow-up template for a previous unanswered outreach email.";
    case "Thank You":
      return "Write a thank-you template for after the creator posted content featuring Survival Tabs on {{platform}}.";
    case "Shipping":
      return "Write a short shipping-notification template. Use tracking placeholder [TRACKING] and expected delivery placeholder [ETA] (these are NOT merge fields; the team fills them in per send).";
    case "Campaign Invitation":
      return "Write an invitation template for a paid campaign — mention a compensated collaboration and ask for the creator's rate.";
    case "Collaboration Proposal":
      return "Write a longer collaboration proposal template outlining deliverables (1 video + 2 stories) and a paid partnership.";
  }
}

async function generateStarterDraft(
  apiKey: string,
  mode: (typeof STARTER_CATEGORIES)[number]["mode"],
): Promise<{ subject: string; body: string }> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: STARTER_SYSTEM_PROMPT },
        { role: "user", content: starterInstruction(mode) },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI draft failed (${res.status}): ${t.slice(0, 300)}`);
  }
  const body = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const raw = body.choices?.[0]?.message?.content?.trim() ?? "";
  const match = raw.match(/^Subject:\s*(.+?)\r?\n\r?\n?([\s\S]*)$/);
  if (match) return { subject: match[1].trim(), body: match[2].trim() };
  return { subject: "", body: raw };
}

export const seedStarterEmailTemplates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Check which starter templates already exist (by name) so this action is idempotent.
    const existingNames = new Set(
      STARTER_CATEGORIES.map((c) => c.name),
    );
    const { data: existingRows, error: existingErr } = await context.supabase
      .from("email_templates")
      .select("name")
      .in("name", Array.from(existingNames));
    if (existingErr) throw existingErr;
    const already = new Set((existingRows ?? []).map((r) => String(r.name)));

    const toCreate = STARTER_CATEGORIES.filter((c) => !already.has(c.name));
    const created: string[] = [];
    const skipped: string[] = STARTER_CATEGORIES
      .filter((c) => already.has(c.name))
      .map((c) => c.name);

    for (const cat of toCreate) {
      const draft = await generateStarterDraft(apiKey, cat.mode);
      const { error: insErr } = await context.supabase
        .from("email_templates")
        .insert({
          name: cat.name,
          segment: null,
          subject: draft.subject || cat.name,
          body: draft.body,
          created_by: context.userId,
          // active defaults to false; approved_by/approved_at stay null.
        });
      if (insErr) throw insErr;
      created.push(cat.name);
    }

    return { created, skipped };
  });
