// Creators roster — team-wide table replacing the hardcoded CREATORS array.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CreatorDBRow = Record<string, unknown> & {
  id: string;
  name: string;
};

export const listCreators = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("creators")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as CreatorDBRow[] };
  });

// Insert-only seed from the static SEED_CREATORS list. Called once from
// client bootstrap; idempotent thanks to onConflict/ignoreDuplicates on id.
export const seedCreatorsFromStatic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { rows: CreatorDBRow[] }) => {
    if (!data || !Array.isArray(data.rows)) throw new Error("rows required");
    return data;
  })
  .handler(async ({ data, context }) => {
    if (data.rows.length === 0) return { inserted: 0, existing: 0 };
    const { count: beforeCount } = await context.supabase
      .from("creators")
      .select("id", { count: "exact", head: true });
    // Only seed when the table is empty — protects against accidental re-imports
    // overwriting fields that have already been edited via the UI.
    if ((beforeCount ?? 0) > 0) return { inserted: 0, existing: beforeCount ?? 0 };

    const { error } = await context.supabase
      .from("creators")
      .upsert(data.rows, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return { inserted: data.rows.length, existing: 0 };
  });

// Insert-only import from CSV/TSV paste; dedup key = code (if present) else normalized website domain.
export type CreatorImportRow = {
  code: string | null;
  normalized_domain: string | null;
  name: string;
  segment: string | null;
  primary_platforms: string | null;
  email: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  priority: string | null;
  amazon: string | null;
  research_notes: string | null;
  outreach_owner: string | null;
};

export const importCreators = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { rows: CreatorImportRow[] }) => {
    if (!data || !Array.isArray(data.rows)) throw new Error("rows required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const incoming = data.rows.filter((r) => (r.code && r.code.trim()) || (r.normalized_domain && r.normalized_domain.trim()));
    if (incoming.length === 0) return { inserted: 0, skipped: 0, total: 0 };

    const codes = incoming.map((r) => (r.code ?? "").trim().toLowerCase()).filter(Boolean);
    const domains = incoming.map((r) => (r.normalized_domain ?? "").trim()).filter(Boolean);

    // Load existing rows that could collide.
    const [{ data: existingByCode }, { data: existingByDomain }] = await Promise.all([
      codes.length > 0
        ? context.supabase.from("creators").select("id, code, normalized_domain").in("code", codes)
        : Promise.resolve({ data: [] as Array<{ id: string; code: string | null; normalized_domain: string | null }> } as never),
      domains.length > 0
        ? context.supabase.from("creators").select("id, code, normalized_domain").in("normalized_domain", domains)
        : Promise.resolve({ data: [] as Array<{ id: string; code: string | null; normalized_domain: string | null }> } as never),
    ]);

    const existingCodes = new Set(((existingByCode ?? []) as Array<{ code: string | null }>).map((r) => (r.code ?? "").toLowerCase()));
    const existingDomains = new Set(((existingByDomain ?? []) as Array<{ normalized_domain: string | null }>).map((r) => r.normalized_domain ?? ""));

    let skipped = 0;
    const toInsert: Array<Record<string, unknown>> = [];
    const seenCodes = new Set<string>();
    const seenDomains = new Set<string>();

    for (const r of incoming) {
      const codeLower = (r.code ?? "").trim().toLowerCase();
      const dom = (r.normalized_domain ?? "").trim();
      if (codeLower && existingCodes.has(codeLower)) { skipped++; continue; }
      if (dom && existingDomains.has(dom)) { skipped++; continue; }
      if (codeLower && seenCodes.has(codeLower)) { skipped++; continue; }
      if (dom && seenDomains.has(dom)) { skipped++; continue; }
      if (codeLower) seenCodes.add(codeLower);
      if (dom) seenDomains.add(dom);
      const id = codeLower ? `IMP-${codeLower.toUpperCase().replace(/[^A-Z0-9]/g, "")}` : `IMP-${dom.replace(/[^a-z0-9]/g, "").toUpperCase()}`;
      toInsert.push({
        id,
        code: r.code,
        name: r.name || (r.code ?? dom) || "Unnamed",
        segment: r.segment,
        primary_platforms: r.primary_platforms,
        email: r.email,
        facebook: r.facebook,
        instagram: r.instagram,
        tiktok: r.tiktok,
        youtube: r.youtube,
        priority: r.priority,
        amazon: r.amazon,
        research_notes: r.research_notes,
        outreach_owner: r.outreach_owner,
        normalized_domain: dom || null,
        imported_by: context.userId,
      });
    }

    if (toInsert.length > 0) {
      const { error } = await context.supabase
        .from("creators")
        .upsert(toInsert, { onConflict: "id", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }

    return { inserted: toInsert.length, skipped, total: incoming.length };
  });

// AI research helper — insert-if-new. Returns the resolved id.
export const upsertCreatorFromResearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { row: CreatorImportRow }) => {
    if (!data?.row) throw new Error("row required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const res = await importCreators({ data: { rows: [data.row] } } as never);
    return res;
  });
