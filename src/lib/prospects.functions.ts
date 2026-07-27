// Sales prospects import — insert-only, dedup by normalized website domain.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProspectImportRow = {
  normalized_domain: string;
  company_name: string | null;
  website: string | null;
  contact_name: string | null;
  contact_email: string | null;
  phone: string | null;
  stage: string | null;
  source: string | null;
  notes: string | null;
  raw_row: Record<string, string>;
};

export const importProspects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { rows: ProspectImportRow[] }) => {
    if (!data || !Array.isArray(data.rows)) throw new Error("rows required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Dedup incoming rows by normalized_domain (last-write within batch wins;
    // existing DB rows will be preserved regardless).
    const seen = new Map<string, ProspectImportRow>();
    for (const r of data.rows) {
      const d = (r.normalized_domain || "").trim().toLowerCase();
      if (!d) continue;
      seen.set(d, { ...r, normalized_domain: d });
    }
    const incoming = [...seen.values()];
    if (incoming.length === 0) return { inserted: 0, skipped: 0, total: 0 };

    const domains = incoming.map((r) => r.normalized_domain);
    const { data: existing, error: exErr } = await supabaseAdmin
      .from("sales_prospects")
      .select("normalized_domain")
      .in("normalized_domain", domains);
    if (exErr) throw new Error(exErr.message);

    const existingSet = new Set((existing ?? []).map((r) => r.normalized_domain));
    const toInsert = incoming
      .filter((r) => !existingSet.has(r.normalized_domain))
      .map((r) => ({ ...r, imported_by: context.userId }));

    if (toInsert.length > 0) {
      // ignoreDuplicates guards against a race with a concurrent import.
      const { error: insErr } = await supabaseAdmin
        .from("sales_prospects")
        .upsert(toInsert, { onConflict: "normalized_domain", ignoreDuplicates: true });
      if (insErr) throw new Error(insErr.message);
    }

    return {
      inserted: toInsert.length,
      skipped: incoming.length - toInsert.length,
      total: incoming.length,
    };
  });

export const countProspects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("sales_prospects")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return { count: count ?? 0 };
  });
