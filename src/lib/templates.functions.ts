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
