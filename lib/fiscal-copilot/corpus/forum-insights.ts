/**
 * FiscCopilot — Forum Insights Corpus
 *
 * 20 KnowledgeEntries derivate din research forum SAGA + Reddit + comunități RO
 * (2.443 posturi analizate, 120 thread-uri SAGA, 25 Reddit, 5 ani 2021-2026).
 *
 * Sursa: docs/saga-forum-research-2026-05-15/06-corpus-additions.json
 * Date generare: 2026-05-15
 *
 * Vendor-neutral. Conține pain points reali + soluții bazate pe community
 * workarounds + recomandări FiscCopilot.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { KnowledgeEntry } from "./seed-fiscal-ro";

const FORUM_CORPUS_PATH = path.join(
  process.cwd(),
  "docs",
  "saga-forum-research-2026-05-15",
  "06-corpus-additions.json"
);

let cache: KnowledgeEntry[] | null = null;
let loadPromise: Promise<KnowledgeEntry[]> | null = null;

interface ForumRawEntry {
  id: string;
  title: string;
  tags: string[];
  body: string;
  sources?: Array<{ label: string; ref: string }>;
  last_verified?: string;
}

function toKnowledgeEntry(raw: ForumRawEntry): KnowledgeEntry {
  return {
    id: `forum-${raw.id}`,
    title: raw.title,
    body: raw.body,
    tags: raw.tags,
    sources: raw.sources ?? [
      {
        label: "Research comunități RO (forum SAGA + Reddit)",
        ref: "docs/saga-forum-research-2026-05-15/",
      },
    ],
    last_verified: raw.last_verified ?? "2026-05-15",
  };
}

/**
 * Lazy load 20 entries din research forum.
 * Returnează [] dacă fișierul lipsește (cazul Vercel deploy fără docs/).
 */
export async function loadForumInsightsCorpus(): Promise<KnowledgeEntry[]> {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const buf = await fs.readFile(FORUM_CORPUS_PATH, "utf-8");
      const raw = JSON.parse(buf) as ForumRawEntry[];
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
 * Stats pentru health endpoint / debugging.
 */
export async function forumInsightsStats(): Promise<{
  count: number;
  totalChars: number;
  topTags: Array<{ tag: string; count: number }>;
}> {
  const corpus = await loadForumInsightsCorpus();
  const totalChars = corpus.reduce((sum, e) => sum + e.body.length, 0);

  const tagCounts = new Map<string, number>();
  corpus.forEach((e) => {
    e.tags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1));
  });
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  return { count: corpus.length, totalChars, topTags };
}
