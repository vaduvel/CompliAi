/**
 * FiscCopilot — Cod Fiscal Corpus Loader
 *
 * 645 articole din Codul Fiscal RO (Legea 227/2015 consolidată).
 * Sursa: legislatie.just.ro/Public/DetaliiDocument/171282 (scraped 2026-05-15)
 *
 * AUTORITATEA MAXIMĂ în RAG (boost ×1.5). Răspunsurile AI Expert citează
 * articole concrete cu URL direct la legea oficială.
 *
 * Acoperă TOATĂ legea fiscală relevantă pentru orice profil de firmă:
 * - Titlul I: Dispoziții generale
 * - Titlul II: Impozit pe profit (SRL, SA)
 * - Titlul III: Microîntreprinderi (SRL micro)
 * - Titlul IV: Impozit pe venit (PFA, PFI, II, CMI, drepturi autor, agricol)
 * - Titlul V: Contribuții sociale (CAS, CASS, salarii, D112)
 * - Titlul VI: Impozit pe veniturile nerezidenților
 * - Titlul VII: TVA (D300, D394, e-Factura, intracomunitar)
 * - Titlul VIII: Accize
 * - Titlul IX: Impozite locale
 * - Titlul X: Impozit specific
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { KnowledgeEntry } from "./seed-fiscal-ro";

const COD_FISCAL_PATH = path.join(
  process.cwd(),
  ".data",
  "cod-fiscal-corpus.json"
);

interface CodFiscalRawEntry {
  id: string;
  article_number: string;
  title: string;
  body: string;
  size_chars: number;
  tags: string[];
  source_url: string;
  source_label: string;
  law_id: string;
  scraped_at: string;
}

let cache: KnowledgeEntry[] | null = null;
let loadPromise: Promise<KnowledgeEntry[]> | null = null;

function toKnowledgeEntry(raw: CodFiscalRawEntry): KnowledgeEntry {
  return {
    id: raw.id,
    title: `${raw.article_number} — ${raw.title}`,
    body: raw.body,
    tags: ["cod-fiscal", "L227-2015", ...raw.tags],
    sources: [
      {
        label: raw.source_label,
        ref: raw.source_url,
      },
    ],
    last_verified: raw.scraped_at,
  };
}

/**
 * Lazy load Cod Fiscal corpus. 645 articole, ~1MB.
 */
export async function loadCodFiscalCorpus(): Promise<KnowledgeEntry[]> {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const buf = await fs.readFile(COD_FISCAL_PATH, "utf-8");
      const raw = JSON.parse(buf) as CodFiscalRawEntry[];
      const converted = raw.map(toKnowledgeEntry);
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
export async function codFiscalStats(): Promise<{
  count: number;
  totalChars: number;
  topTags: Array<{ tag: string; count: number }>;
}> {
  const corpus = await loadCodFiscalCorpus();
  const totalChars = corpus.reduce((sum, e) => sum + e.body.length, 0);

  const tagCounts = new Map<string, number>();
  corpus.forEach((e) => {
    e.tags.forEach((t) => {
      if (t === "cod-fiscal" || t === "L227-2015") return; // skip universal tags
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    });
  });
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag, count]) => ({ tag, count }));

  return { count: corpus.length, totalChars, topTags };
}

/**
 * Helper: găsește articol după număr exact ("Articolul 105").
 */
export async function findArticleByNumber(articleNumber: string): Promise<KnowledgeEntry | null> {
  const corpus = await loadCodFiscalCorpus();
  return corpus.find((e) => e.title.startsWith(articleNumber)) ?? null;
}
