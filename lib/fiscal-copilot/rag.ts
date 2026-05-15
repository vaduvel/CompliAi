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
import { loadSagaManualCorpus } from "./corpus/saga-manual";

export interface RetrievalResult {
  entry: KnowledgeEntry;
  score: number;
  source: "seed" | "saga-manual";
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
 * Caută top N entries relevante pentru query — SEED corpus ONLY (fast, sync).
 *
 * Pentru retrieval extins cu SAGA Manual corpus, folosește retrieveRelevantAsync().
 */
export function retrieveRelevant(query: string, topN = 3): RetrievalResult[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const scored = FISCAL_CORPUS.map((entry) => ({
    entry,
    score: scoreEntry(entry, tokens),
    source: "seed" as const,
  }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored;
}

/**
 * Caută top N entries în AMBELE corpus-uri: seed (15 entries) + SAGA Manual (97 topics).
 *
 * Seed prioritizat (curated): +20% boost la scor.
 * SAGA Manual = expansiune masivă pentru întrebări pe operații specifice (jurnal TVA,
 * intrari valută, închidere lună, etc.).
 */
export async function retrieveRelevantAsync(
  query: string,
  topN = 5
): Promise<RetrievalResult[]> {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const seedResults: RetrievalResult[] = FISCAL_CORPUS.map((entry) => ({
    entry,
    score: scoreEntry(entry, tokens) * 1.2, // 20% boost for curated seed
    source: "seed" as const,
  })).filter((r) => r.score > 0);

  const saga = await loadSagaManualCorpus();
  const sagaResults: RetrievalResult[] = saga
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, tokens),
      source: "saga-manual" as const,
    }))
    .filter((r) => r.score > 0);

  return [...seedResults, ...sagaResults]
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/**
 * Maximum caractere pentru body în prompt context (per entry).
 * SAGA Manual entries pot fi 20-35KB; trunchiem ca să nu saturăm Gemma's context window.
 */
const MAX_BODY_CHARS_PER_ENTRY = 2_500;

function truncateBody(body: string, max = MAX_BODY_CHARS_PER_ENTRY): string {
  if (body.length <= max) return body;
  // Truncă la cea mai apropiată propoziție pentru naturalețe
  const truncated = body.slice(0, max);
  const lastPeriod = truncated.lastIndexOf(". ");
  return (lastPeriod > max * 0.7 ? truncated.slice(0, lastPeriod + 1) : truncated) + "\n[...truncat pentru concizie prompt...]";
}

/**
 * Formatează rezultatele RAG ca context pentru LLM prompt.
 * Trunchează automat entries lungi (SAGA Manual) pentru a respecta context budget.
 */
export function formatContextForPrompt(results: RetrievalResult[]): string {
  if (results.length === 0) {
    return "[Nu s-au găsit articole relevante în corpus. Răspunde cu precauție și recomandă verificare oficială.]";
  }

  return results
    .map(
      (r, i) => `### Articol ${i + 1}: ${r.entry.title}

${truncateBody(r.entry.body)}

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
