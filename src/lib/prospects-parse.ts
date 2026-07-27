// Parse pasted CSV or TSV (Google Sheets copy) into ProspectImportRow[].
// Dedup key = normalized website domain (lowercase, strip protocol + "www.").
import type { ProspectImportRow } from "./prospects.functions";

export function normalizeDomain(input: string | null | undefined): string {
  if (!input) return "";
  let s = String(input).trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/^https?:\/\//, "").replace(/^\/\//, "");
  s = s.split("/")[0].split("?")[0].split("#")[0];
  s = s.replace(/^www\./, "");
  // If it looks like an email, take the domain part.
  if (s.includes("@")) s = s.split("@").pop() ?? "";
  return s.trim();
}

function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === delim && !inQ) {
      out.push(cur); cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function pick(row: Record<string, string>, keys: string[]): string | null {
  for (const k of keys) {
    const found = Object.keys(row).find((h) => h.toLowerCase().trim() === k.toLowerCase());
    if (found && row[found]) return row[found].trim();
  }
  return null;
}

export type ParseResult = {
  rows: ProspectImportRow[];
  skippedNoDomain: number;
  headers: string[];
};

export function parseProspectsPaste(text: string): ParseResult {
  const raw = text.replace(/\r\n/g, "\n").trim();
  if (!raw) return { rows: [], skippedNoDomain: 0, headers: [] };
  const lines = raw.split("\n").filter((l) => l.length > 0);
  if (lines.length < 2) return { rows: [], skippedNoDomain: 0, headers: [] };

  const delim = lines[0].includes("\t") ? "\t" : ",";
  const headers = splitLine(lines[0], delim).map((h) => h.replace(/^"|"$/g, ""));

  const rows: ProspectImportRow[] = [];
  let skippedNoDomain = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delim).map((c) => c.replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] ?? ""; });

    const websiteRaw = pick(row, ["website", "url", "domain", "site", "company website"]);
    const emailRaw = pick(row, ["email", "contact email", "contact_email"]);
    const domain = normalizeDomain(websiteRaw ?? emailRaw ?? "");
    if (!domain) { skippedNoDomain++; continue; }

    rows.push({
      normalized_domain: domain,
      company_name: pick(row, ["company", "company name", "name", "business", "organization"]),
      website: websiteRaw,
      contact_name: pick(row, ["contact", "contact name", "first name", "full name"]),
      contact_email: emailRaw,
      phone: pick(row, ["phone", "telephone", "mobile"]),
      stage: pick(row, ["stage", "status"]),
      source: pick(row, ["source", "origin", "list"]),
      notes: pick(row, ["notes", "note", "comments", "description"]),
      raw_row: row,
    });
  }

  return { rows, skippedNoDomain, headers };
}
