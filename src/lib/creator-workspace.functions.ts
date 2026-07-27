// Team-shared creator workspace persistence.
// Backing table: public.creator_workspace (one row per creator_id).
// All fields on the CreatorWorkspace type are stored here so that Rena,
// Vina, Seth, and Perry see the same operational state on every device.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WorkspacePatchDTO = { creator_id: string; [k: string]: unknown };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

export const listWorkspaces = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("creator_workspace")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as Array<Record<string, Json>> };
  });

export const upsertWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { patch: WorkspacePatchDTO }) => {
    if (!data?.patch?.creator_id) throw new Error("creator_id required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const row = { ...data.patch } as never;
    const { data: out, error } = await context.supabase
      .from("creator_workspace")
      .upsert(row, { onConflict: "creator_id" })
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { row: (out ?? null) as Record<string, Json> | null };
  });

export const appendActivityFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { creator_id: string; activity: Record<string, Json> }) => {
    if (!data?.creator_id) throw new Error("creator_id required");
    if (!data?.activity) throw new Error("activity required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: existing, error: exErr } = await context.supabase
      .from("creator_workspace")
      .select("activity")
      .eq("creator_id", data.creator_id)
      .maybeSingle();
    if (exErr) throw new Error(exErr.message);
    const current = Array.isArray(existing?.activity) ? (existing!.activity as unknown[]) : [];
    const nextActivity = [...current, data.activity] as unknown as Json;
    const payload = { creator_id: data.creator_id, activity: nextActivity } as never;
    const { error: upErr } = await context.supabase
      .from("creator_workspace")
      .upsert(payload, { onConflict: "creator_id" });
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });

// One-time migration: uploads a localStorage-derived overrides map into the
// DB. Only fills fields currently empty in DB — never overwrites teammates'
// later edits. Conflicts (both sides populated and different) are returned
// for manual review, not silently resolved.
export const migrateLocalWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { overrides: Record<string, Record<string, Json>> }) => {
    if (!data?.overrides || typeof data.overrides !== "object") {
      throw new Error("overrides required");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const ids = Object.keys(data.overrides);
    if (ids.length === 0) return { merged: 0, conflicted: [] as Array<{ creatorId: string; field: string; local: Json; db: Json }>, skipped: 0 };

    const { data: existingRows, error: exErr } = await context.supabase
      .from("creator_workspace")
      .select("*")
      .in("creator_id", ids);
    if (exErr) throw new Error(exErr.message);

    const existingMap = new Map<string, Record<string, Json>>();
    for (const r of (existingRows ?? []) as Array<Record<string, Json>>) {
      existingMap.set(r.creator_id as string, r);
    }

    const conflicts: Array<{ creatorId: string; field: string; local: Json; db: Json }> = [];
    const toUpsert: Array<Record<string, Json>> = [];

    const isEmpty = (v: unknown): boolean => {
      if (v === null || v === undefined) return true;
      if (typeof v === "string" && v === "") return true;
      if (Array.isArray(v) && v.length === 0) return true;
      return false;
    };

    for (const id of ids) {
      const local = data.overrides[id];
      const db = existingMap.get(id);
      const merged: Record<string, Json> = { creator_id: id, ...(db ?? {}) };
      let changed = !db;
      for (const [k, v] of Object.entries(local)) {
        if (k === "creator_id" || k === "activity") continue;
        const dbVal = db?.[k];
        if (isEmpty(dbVal) && !isEmpty(v)) {
          merged[k] = v as Json;
          changed = true;
        } else if (!isEmpty(dbVal) && !isEmpty(v) && JSON.stringify(dbVal) !== JSON.stringify(v)) {
          conflicts.push({ creatorId: id, field: k, local: v as Json, db: dbVal as Json });
        }
      }
      if (Array.isArray(local.activity) && (local.activity as unknown[]).length > 0) {
        const existingActivity = Array.isArray(db?.activity) ? (db!.activity as Array<Record<string, Json>>) : [];
        const byId = new Map<string, Record<string, Json>>();
        for (const a of existingActivity) byId.set(String(a.id ?? Math.random()), a);
        for (const a of local.activity as Array<Record<string, Json>>) {
          const key = String(a.id ?? Math.random());
          if (!byId.has(key)) byId.set(key, a);
        }
        const mergedActivity = [...byId.values()].sort((a, b) => String(a.at ?? "").localeCompare(String(b.at ?? "")));
        if (JSON.stringify(mergedActivity) !== JSON.stringify(existingActivity)) {
          merged.activity = mergedActivity as unknown as Json;
          changed = true;
        }
      }
      if (changed) toUpsert.push(merged);
    }

    if (toUpsert.length > 0) {
      const { error: upErr } = await context.supabase
        .from("creator_workspace")
        .upsert(toUpsert as never, { onConflict: "creator_id" });
      if (upErr) throw new Error(upErr.message);
    }

    return { merged: toUpsert.length, conflicted: conflicts, skipped: ids.length - toUpsert.length };
  });
