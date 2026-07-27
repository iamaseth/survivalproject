// Team-shared creator workspace persistence.
// Backing table: public.creator_workspace (one row per creator_id).
// All fields on the CreatorWorkspace type are stored here so that Rena,
// Vina, Seth, and Perry see the same operational state on every device.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// The DB row shape mirrors CreatorWorkspace with snake_case columns.
// We keep this file client-safe (no server-only static imports at module scope).

export type WorkspacePatchDTO = Record<string, unknown> & {
  creator_id: string;
};

export const listWorkspaces = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("creator_workspace")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as Array<Record<string, unknown>> };
  });

export const upsertWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { patch: WorkspacePatchDTO }) => {
    if (!data?.patch?.creator_id) throw new Error("creator_id required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const row = { ...data.patch };
    const { data: out, error } = await context.supabase
      .from("creator_workspace")
      .upsert(row, { onConflict: "creator_id" })
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { row: out };
  });

export const appendActivityFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { creator_id: string; activity: Record<string, unknown> }) => {
    if (!data?.creator_id) throw new Error("creator_id required");
    if (!data?.activity) throw new Error("activity required");
    return data;
  })
  .handler(async ({ data, context }) => {
    // Read current activity array, append, write back — small array, one round trip is fine.
    const { data: existing, error: exErr } = await context.supabase
      .from("creator_workspace")
      .select("activity")
      .eq("creator_id", data.creator_id)
      .maybeSingle();
    if (exErr) throw new Error(exErr.message);
    const current = Array.isArray(existing?.activity) ? (existing!.activity as unknown[]) : [];
    const nextActivity = [...current, data.activity];
    const { error: upErr } = await context.supabase
      .from("creator_workspace")
      .upsert(
        { creator_id: data.creator_id, activity: nextActivity },
        { onConflict: "creator_id" },
      );
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });

// One-time migration: uploads a localStorage-derived overrides map into the
// DB, but only fills fields that are currently NULL / default in DB so we
// never silently overwrite another teammate's later edits.
export const migrateLocalWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { overrides: Record<string, Record<string, unknown>> }) => {
    if (!data?.overrides || typeof data.overrides !== "object") {
      throw new Error("overrides required");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const ids = Object.keys(data.overrides);
    if (ids.length === 0) return { merged: 0, conflicted: [], skipped: 0 };

    const { data: existingRows, error: exErr } = await context.supabase
      .from("creator_workspace")
      .select("*")
      .in("creator_id", ids);
    if (exErr) throw new Error(exErr.message);

    const existingMap = new Map<string, Record<string, unknown>>();
    for (const r of existingRows ?? []) existingMap.set((r as Record<string, unknown>).creator_id as string, r as Record<string, unknown>);

    const conflicts: Array<{ creatorId: string; field: string; local: unknown; db: unknown }> = [];
    const toUpsert: Array<Record<string, unknown>> = [];

    // Simple "fill only if empty" merge: DB wins on any populated field.
    // Fields we consider "empty": null, undefined, "", false, 0, [] (for jsonb arrays).
    const isEmpty = (v: unknown): boolean => {
      if (v === null || v === undefined) return true;
      if (typeof v === "string" && v === "") return true;
      if (Array.isArray(v) && v.length === 0) return true;
      return false;
    };

    for (const id of ids) {
      const local = data.overrides[id];
      const db = existingMap.get(id);
      const merged: Record<string, unknown> = { creator_id: id, ...(db ?? {}) };
      let changed = false;
      for (const [k, v] of Object.entries(local)) {
        if (k === "creator_id") continue;
        const dbVal = db?.[k];
        if (isEmpty(dbVal) && !isEmpty(v)) {
          merged[k] = v;
          changed = true;
        } else if (!isEmpty(dbVal) && !isEmpty(v) && JSON.stringify(dbVal) !== JSON.stringify(v)) {
          conflicts.push({ creatorId: id, field: k, local: v, db: dbVal });
        }
      }
      // Merge activity as union (dedup by id).
      if (Array.isArray(local.activity) && local.activity.length > 0) {
        const existingActivity = Array.isArray(db?.activity) ? (db!.activity as Array<Record<string, unknown>>) : [];
        const byId = new Map<string, Record<string, unknown>>();
        for (const a of existingActivity) byId.set(String(a.id ?? Math.random()), a);
        for (const a of local.activity as Array<Record<string, unknown>>) {
          const key = String(a.id ?? Math.random());
          if (!byId.has(key)) byId.set(key, a);
        }
        const mergedActivity = [...byId.values()].sort((a, b) => String(a.at ?? "").localeCompare(String(b.at ?? "")));
        if (JSON.stringify(mergedActivity) !== JSON.stringify(existingActivity)) {
          merged.activity = mergedActivity;
          changed = true;
        }
      }
      if (changed) toUpsert.push(merged);
    }

    if (toUpsert.length > 0) {
      const { error: upErr } = await context.supabase
        .from("creator_workspace")
        .upsert(toUpsert, { onConflict: "creator_id" });
      if (upErr) throw new Error(upErr.message);
    }

    return { merged: toUpsert.length, conflicted: conflicts, skipped: ids.length - toUpsert.length };
  });
