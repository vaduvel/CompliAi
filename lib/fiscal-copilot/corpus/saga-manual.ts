/**
 * FiscCopilot — SAGA Manual Corpus Loader
 *
 * Lazy-load la primul access: 97 topics SAGA C. parsed → 602KB clean text.
 * Source: https://manual.sagasoft.ro/sagac/ (scraped 2026-05-15)
 *
 * Fiecare entry are aceeași formă ca seed-fiscal-ro.ts → poate fi
 * combinat în RAG fără modificări de schema.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { KnowledgeEntry } from "./seed-fiscal-ro";

const SAGA_CORPUS_PATH = path.join(
  process.cwd(),
  ".data",
  "saga-manual-corpus.json"
);

interface SagaRawEntry {
  id: string;
  topic_number: number;
  title: string;
  slug: string;
  body: string;
  size_chars: number;
  tags: string[];
  internal_links: string[];
  source_url: string;
  scraped_at: string;
}

let cache: KnowledgeEntry[] | null = null;
let loadPromise: Promise<KnowledgeEntry[]> | null = null;

/**
 * Convertește un raw SAGA entry la KnowledgeEntry compatible cu RAG.
 */
function toKnowledgeEntry(raw: SagaRawEntry): KnowledgeEntry {
  return {
    id: raw.id,
    title: raw.title,
    body: raw.body,
    tags: raw.tags,
    sources: [
      {
        label: `SAGA Manual — ${raw.title}`,
        ref: raw.source_url,
      },
    ],
    last_verified: raw.scraped_at,
  };
}

/**
 * Încarcă SAGA Manual corpus din JSON pe disk (lazy, cached).
 * Returnează array gol dacă fișierul lipsește (cazul Vercel fără .data/ deployed).
 */
export async function loadSagaManualCorpus(): Promise<KnowledgeEntry[]> {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const buf = await fs.readFile(SAGA_CORPUS_PATH, "utf-8");
      const raw = JSON.parse(buf) as SagaRawEntry[];
      const converted = raw.map(toKnowledgeEntry);
      cache = converted;
      return converted;
    } catch (err) {
      // File missing (e.g., on Vercel without scraped data) → return empty
      cache = [];
      return [];
    }
  })();

  return loadPromise;
}

/**
 * Helper: sync access după primul load. NU folosi înainte de await loadSagaManualCorpus().
 */
export function getSagaCorpusCached(): KnowledgeEntry[] {
  return cache || [];
}

/**
 * Stats pentru debugging/UI.
 */
export async function sagaCorpusStats(): Promise<{
  count: number;
  totalChars: number;
  topTopics: Array<{ title: string; chars: number }>;
}> {
  const corpus = await loadSagaManualCorpus();
  const totalChars = corpus.reduce((sum, e) => sum + e.body.length, 0);
  const topTopics = corpus
    .slice()
    .sort((a, b) => b.body.length - a.body.length)
    .slice(0, 10)
    .map((e) => ({ title: e.title, chars: e.body.length }));
  return { count: corpus.length, totalChars, topTopics };
}
