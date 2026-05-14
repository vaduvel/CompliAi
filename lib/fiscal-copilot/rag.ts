/**
 * FiscCopilot — RAG (Retrieval Augmented Generation)
 *
 * MVP: simple keyword + tag scoring pe corpus seed.
 * v2: înlocuiește cu Qdrant + embedding-uri reale (text-embedding-3-small sau bge-m3).
 *
 * De ce simplu acum:
 * - Corpus seed are doar ~15 entries, retrieval keyword e suficient
 * - Zero dependențe externe (no vector DB needed)
 * - Latență sub 5ms vs ~50-200ms cu Qdrant
 * - Migrarea la vector DB este 1 zi de muncă când corpus depășește 200+ entries
 */

import { FISCAL_CORPUS, type KnowledgeEntry } from "./corpus/seed-fiscal-ro";

export interface RetrievalResult {
  entry: KnowledgeEntry;
  score: number;
}

const STOP_WORDS = new Set([
  "și",
  "sau",
  "pentru",
  "din",
  "este",
  "un",
  "o",
  "a",
  "cu",
  "ce",
  "la",
  "pe",
  "să",
  "de",
  "în",
  "the",
  "is",
  "a",
  "an",
  "and",
  "or",
  "for",
]);

/**
 * Normalizează un text: lowercase + diacritice (păstrăm ROfor că tag-urile sunt cu diacritice) + tokenize.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,;:!?()'"]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

/**
 * Scor: 3 pt match exact tag (case-insensitive), 1 pt match in title, 0.3 pt match in body.
 */
function scoreEntry(entry: KnowledgeEntry, queryTokens: string[]): number {
  let score = 0;
  const titleTokens = new Set(tokenize(entry.title));
  const bodyTokens = new Set(tokenize(entry.body));
  const tagLower = entry.tags.map((t) => t.toLowerCase());

  for (const qt of queryTokens) {
    // Tag match (case-insensitive substring within any tag)
    if (tagLower.some((tag) => tag.toLowerCase().includes(qt))) {
      score += 3;
    }
    // Title match
    if (titleTokens.has(qt)) {
      score += 1;
    }
    // Body match
    if (bodyTokens.has(qt)) {
      score += 0.3;
    }
    // Specific declaration ID match (D205, D300, D406, etc.)
    if (/^d\d{3}$/i.test(qt) && (entry.title.toLowerCase().includes(qt) || tagLower.includes(qt))) {
      score += 5; // Strong boost for declaration codes
    }
  }
  return score;
}

/**
 * Caută top N entries relevante pentru query.
 */
export function retrieveRelevant(query: string, topN = 3): RetrievalResult[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const scored = FISCAL_CORPUS.map((entry) => ({
    entry,
    score: scoreEntry(entry, tokens),
  }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored;
}

/**
 * Formatează rezultatele RAG ca context pentru LLM prompt.
 */
export function formatContextForPrompt(results: RetrievalResult[]): string {
  if (results.length === 0) {
    return "[Nu s-au găsit articole relevante în corpus. Răspunde cu precauție și recomandă verificare oficială.]";
  }

  return results
    .map(
      (r, i) => `### Articol ${i + 1}: ${r.entry.title}

${r.entry.body}

**Surse:** ${r.entry.sources.map((s) => `${s.label} (${s.ref})`).join("; ")}
**Verificat:** ${r.entry.last_verified}`
    )
    .join("\n\n---\n\n");
}

/**
 * Helper: returnează doar entries care conțin un anumit tag (exact match).
 */
export function getByTag(tag: string): KnowledgeEntry[] {
  const tagLower = tag.toLowerCase();
  return FISCAL_CORPUS.filter((e) => e.tags.some((t) => t.toLowerCase() === tagLower));
}

/**
 * Helper: returnează entry by id sau null.
 */
export function getById(id: string): KnowledgeEntry | null {
  return FISCAL_CORPUS.find((e) => e.id === id) ?? null;
}
