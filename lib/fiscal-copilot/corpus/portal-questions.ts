/**
 * FiscCopilot — Portal Questions Corpus Loader
 *
 * 1474 întrebări REALE ale cabinetelor contabile RO, scraped public din
 * portalcontabilitate.ro (sitemap, accesibil fără login).
 *
 * ROL ÎN RAG: context examples (×1.0 boost — NU autoritate, ci PATTERN).
 *
 * AI Expert le folosește pentru:
 * - Înțelegerea jargon-ului real al contabililor
 * - Recunoaștere edge cases similare ("acesta-i exact cazul X de pe Portal")
 * - Pattern matching pentru întrebări similare în viitor
 *
 * NU sunt răspunsuri reproduce — răspunsurile rămân la Portal (paywall).
 * Folosim DOAR întrebarea + metadata + categorii pentru triggering corect
 * al articolelor de lege din Cod Fiscal.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { KnowledgeEntry } from "./seed-fiscal-ro";

const PORTAL_PATH = path.join(
  process.cwd(),
  "docs",
  "portal-cabinet-questions-2026-05-15",
  "corpus.json"
);

interface PortalRawEntry {
  id: string;
  url: string;
  title: string;
  question: string;
  tags: string[];
  date_validity?: string;
  expert?: string;
  expert_role?: string;
  society?: {
    type?: string;
    employees?: string;
    vat_payer?: boolean | string;
    caen?: string;
  };
  scraped_at?: string;
}

let cache: KnowledgeEntry[] | null = null;
let loadPromise: Promise<KnowledgeEntry[]> | null = null;

function toKnowledgeEntry(raw: PortalRawEntry): KnowledgeEntry {
  // Body construit: întrebare + metadata societate (NU răspuns, paywall)
  const socStr = raw.society
    ? `Tip societate: ${raw.society.type ?? "?"} · CAEN ${raw.society.caen ?? "?"} · TVA ${typeof raw.society.vat_payer === "boolean" ? (raw.society.vat_payer ? "Da" : "Nu") : raw.society.vat_payer ?? "?"} · Angajați ${raw.society.employees ?? "?"}`
    : "";

  const body = `Întrebare cabinet contabil (caz real, ${raw.date_validity ?? "data ?"}):

${raw.question}

${socStr ? `Context: ${socStr}` : ""}`.trim();

  return {
    id: `pq-${raw.id}`,
    title: raw.title,
    body,
    tags: ["portal-question", "speță-reală", ...raw.tags],
    sources: [
      {
        label: `Caz real cabinet — ${raw.expert ?? "expert"} (${raw.date_validity ?? "n/a"})`,
        ref: raw.url,
      },
    ],
    last_verified: raw.scraped_at ?? "2026-05-15",
  };
}

/**
 * Lazy load 1474 portal questions corpus.
 */
export async function loadPortalQuestionsCorpus(): Promise<KnowledgeEntry[]> {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const buf = await fs.readFile(PORTAL_PATH, "utf-8");
      const raw = JSON.parse(buf) as PortalRawEntry[];
      // Filter out entries without proper question text
      const valid = raw.filter(
        (e) =>
          e.question &&
          e.question.length > 20 &&
          e.title &&
          !e.question.includes("?...") // skip truncated entries
      );
      const converted = valid.map(toKnowledgeEntry);
      cache = converted;
      return converted;
    } catch {
      cache = [];
      return [];
    }
  })();

  return loadPromise;
}

/**
 * Stats pentru health endpoint.
 */
export async function portalQuestionsStats(): Promise<{
  count: number;
  totalChars: number;
  topTags: Array<{ tag: string; count: number }>;
  topSocietyTypes: Array<{ type: string; count: number }>;
}> {
  const corpus = await loadPortalQuestionsCorpus();
  const totalChars = corpus.reduce((sum, e) => sum + e.body.length, 0);

  const tagCounts = new Map<string, number>();
  corpus.forEach((e) => {
    e.tags.forEach((t) => {
      if (t === "portal-question" || t === "speță-reală") return;
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    });
  });
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag, count]) => ({ tag, count }));

  // Society types from body parsing
  const socCounts = new Map<string, number>();
  corpus.forEach((e) => {
    const match = e.body.match(/Tip societate:\s*([A-Z\.]+)/);
    if (match) {
      socCounts.set(match[1], (socCounts.get(match[1]) ?? 0) + 1);
    }
  });
  const topSocietyTypes = [...socCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }));

  return { count: corpus.length, totalChars, topTags, topSocietyTypes };
}
