// AI-assisted creator research drafting.
// Takes a free-text blob (URL, bio, notes) and returns a structured draft
// matching ResearchCreatorInput. The user reviews before submitting to
// upsertCreatorFromResearch — the AI never writes to the DB itself.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";

const DraftSchema = z.object({
  name: z.string().nullable(),
  code: z.string().nullable(),
  normalized_domain: z.string().nullable(),
  segment: z.string().nullable(),
  primary_platforms: z.string().nullable(),
  email: z.string().nullable(),
  facebook: z.string().nullable(),
  instagram: z.string().nullable(),
  tiktok: z.string().nullable(),
  youtube: z.string().nullable(),
  priority: z.string().nullable(),
  amazon: z.string().nullable(),
  recommended_offer: z.string().nullable(),
  research_notes: z.string().nullable(),
});
export type ResearchDraft = z.infer<typeof DraftSchema>;

export const researchCreatorDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { input: string }) => {
    if (!data?.input || !data.input.trim()) throw new Error("input required");
    if (data.input.length > 8000) throw new Error("input too long (max 8000 chars)");
    return data;
  })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");

    const prompt = `You are helping Survival Tabs' partnership team research a new creator.
Given the raw text below (a URL, bio, a note from Seth, or scraped page content), extract a draft
creator record. Rules:
- If a field is not confidently derivable, return null (do not guess emails or handles).
- "normalized_domain" is the creator's canonical website hostname, lowercase, no protocol, no www.
- "primary_platforms" is a short comma-separated list (e.g. "Instagram, YouTube").
- "priority" is one of: "High", "Medium", "Low" or null.
- "amazon" is "Yes", "No", or null (mentions of Amazon storefront / affiliate link => Yes).
- "recommended_offer" is a short phrase (max ~80 chars) suggesting the deal type.
- "research_notes" is <= 400 characters — a plain-English 2-3 sentence summary of fit and signals.
- "code" is a short kebab-case slug from the creator's name if obvious, otherwise null.

Raw input:
"""
${data.input}
"""`;

    try {
      const result = await generateText({
        model,
        output: Output.object({ schema: DraftSchema }),
        prompt,
      });
      const out = result.output as ResearchDraft;
      // Clamp research_notes length in code, not in schema.
      if (out.research_notes && out.research_notes.length > 500) {
        out.research_notes = out.research_notes.slice(0, 500);
      }
      return { draft: out };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return {
          draft: {
            name: null, code: null, normalized_domain: null, segment: null,
            primary_platforms: null, email: null, facebook: null, instagram: null,
            tiktok: null, youtube: null, priority: null, amazon: null,
            recommended_offer: null,
            research_notes: (error.text ?? "").slice(0, 500) || null,
          } satisfies ResearchDraft,
        };
      }
      throw error;
    }
  });
