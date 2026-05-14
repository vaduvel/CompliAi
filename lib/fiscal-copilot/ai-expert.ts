/**
 * FiscCopilot — AI Expert Fiscal
 *
 * Orchestrator: Întrebare → RAG retrieval → Gemma cu context → Răspuns cu citation
 *
 * Privacy: rulează 100% local (Ollama + Gemma). Datele NU pleacă.
 * Quality: RAG injectează context corect → Gemma nu mai halucinează pe topic-uri cunoscute.
 */

import { askGemma, checkGemmaAvailable, type GemmaResponse } from "./gemma-client";
import { retrieveRelevant, formatContextForPrompt, type RetrievalResult } from "./rag";

export interface AIAnswer {
  question: string;
  answer: string;
  sources: Array<{ label: string; ref: string; entry_id: string }>;
  confidence: "high" | "medium" | "low";
  retrievedEntries: number;
  latencyMs: number;
  model: string;
}

const SYSTEM_PROMPT = `Ești "FiscCopilot" — un asistent fiscal AI privat pentru contabili și cabinete din România.

REGULI CRITICE:
1. Răspunzi DOAR în limba română.
2. Răspunzi DOAR pe baza articolelor din context (RAG). DACĂ contextul nu acoperă întrebarea, spui clar: "Nu am informații suficiente în baza mea. Verifică direct sursa oficială ANAF sau consultă un consultant fiscal autorizat."
3. NICIODATĂ nu inventezi cifre, articole de lege, OUG-uri sau termene. Folosește DOAR ce e în context.
4. La sfârșitul răspunsului, CITEZI sursele din context. Format: "Surse: [Sursa 1]; [Sursa 2]."
5. Răspunsul e CONCIS (3-8 propoziții pentru întrebări simple, max 15 pentru complexe).
6. NU dai sfaturi medicale, juridice penale, sau care depășesc dreptul fiscal contabil.
7. NU pretinzi că ești contabil autorizat sau expert contabil — ești ASISTENT.
8. Pentru întrebări sensibile (poprire, control fiscal, dispute ANAF) sugerezi consultare cu contabil sau consultant fiscal autorizat.

TONUL: profesional, prietenos, clar. NU folosi jargon excesiv. NU folosi emoticoane.`;

/**
 * Răspunde la o întrebare fiscală.
 */
export async function askExpert(
  question: string,
  opts: { model?: "gemma4:e2b"; topN?: number } = {}
): Promise<AIAnswer> {
  const start = Date.now();
  const topN = opts.topN ?? 3;

  // 1. RAG retrieval
  const retrieved = retrieveRelevant(question, topN);
  const context = formatContextForPrompt(retrieved);

  // 2. Build prompt
  const userPrompt = `Context fiscal (din baza de cunoștințe verificată):

${context}

---

Întrebarea contabilului:
${question}

---

Răspunde conform regulilor de mai sus. Folosește DOAR informațiile din context. Citează sursele.`;

  // 3. Call Gemma
  let gemma: GemmaResponse;
  try {
    gemma = await askGemma(userPrompt, {
      model: opts.model,
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.15,
      maxTokens: 600,
      thinking: false,
      timeoutMs: 90_000,
    });
  } catch (err) {
    return {
      question,
      answer: `[Eroare: nu am putut contacta modelul local. Verifică Ollama. Detalii: ${err instanceof Error ? err.message : String(err)}]`,
      sources: [],
      confidence: "low",
      retrievedEntries: retrieved.length,
      latencyMs: Date.now() - start,
      model: "error",
    };
  }

  // 4. Compute confidence: high dacă top retrieval score >= 5, medium dacă >= 2, low altfel
  const topScore = retrieved[0]?.score ?? 0;
  const confidence: AIAnswer["confidence"] = topScore >= 5 ? "high" : topScore >= 2 ? "medium" : "low";

  // 5. Aggregate sources
  const sources = retrieved.flatMap((r) =>
    r.entry.sources.map((s) => ({ label: s.label, ref: s.ref, entry_id: r.entry.id }))
  );

  return {
    question,
    answer: gemma.text,
    sources,
    confidence,
    retrievedEntries: retrieved.length,
    latencyMs: Date.now() - start,
    model: gemma.model,
  };
}

/**
 * Health check pentru AI Expert.
 */
export async function checkExpertHealth(): Promise<{
  ok: boolean;
  reason?: string;
  corpus: number;
}> {
  const gemma = await checkGemmaAvailable();
  return {
    ok: gemma.available,
    reason: gemma.reason,
    corpus: (await import("./corpus/seed-fiscal-ro")).FISCAL_CORPUS.length,
  };
}
