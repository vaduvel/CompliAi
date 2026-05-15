/**
 * FiscCopilot — AI Expert Fiscal
 *
 * Orchestrator: Întrebare → RAG retrieval → Gemma cu context → Răspuns cu citation
 *
 * Privacy: rulează 100% local (Ollama + Gemma). Datele NU pleacă.
 * Quality: RAG injectează context corect → Gemma nu mai halucinează pe topic-uri cunoscute.
 */

import { askGemma, checkGemmaAvailable, type GemmaResponse } from "./gemma-client";
import {
  retrieveRelevant,
  retrieveRelevantAsync,
  formatContextForPrompt,
  type RetrievalResult,
} from "./rag";
import { logEpisode } from "./memory/episodic";
import { clientFacts, factsAsContext } from "./memory/semantic";

export interface AIAnswer {
  question: string;
  answer: string;
  sources: Array<{ label: string; ref: string; entry_id: string }>;
  confidence: "high" | "medium" | "low";
  retrievedEntries: number;
  /** Facts despre client folosite ca context suplimentar */
  factsUsed: number;
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
 *
 * @param opts.orgId — dacă e furnizat, log episode + use memory facts
 * @param opts.clientId — dacă e furnizat, injectează facts despre acest client în context
 */
export async function askExpert(
  question: string,
  opts: {
    model?: "gemma4:e2b";
    topN?: number;
    orgId?: string;
    clientId?: string;
  } = {}
): Promise<AIAnswer> {
  const start = Date.now();
  const topN = opts.topN ?? 3;

  // 1. RAG retrieval — seed (curated 15) + SAGA Manual (97 topics)
  void retrieveRelevant; // sync fallback kept for callers care doresc fast path
  const retrieved = await retrieveRelevantAsync(question, topN);
  const context = formatContextForPrompt(retrieved);

  // 1b. Semantic memory facts (if client context is provided)
  let factsContext = "";
  let factsCount = 0;
  if (opts.orgId && opts.clientId) {
    const facts = await clientFacts(opts.orgId, opts.clientId, 0.4);
    factsCount = facts.length;
    if (facts.length > 0) {
      factsContext = `

## Context specific despre client (din memoria istorică):

${factsAsContext(facts)}

Foloseste aceste informații DOAR ca background — răspunde la întrebare cu informația din "Context fiscal" de mai sus.`;
    }
  }

  // 2. Build prompt
  const userPrompt = `Context fiscal (din baza de cunoștințe verificată):

${context}
${factsContext}

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
    // Log error episode
    if (opts.orgId) {
      await logEpisode({
        orgId: opts.orgId,
        kind: "ai_query",
        clientId: opts.clientId,
        payload: {
          question,
          error: err instanceof Error ? err.message : String(err),
        },
        outcome: "error",
      }).catch(() => undefined);
    }
    return {
      question,
      answer: `[Eroare: nu am putut contacta modelul local. Verifică Ollama. Detalii: ${err instanceof Error ? err.message : String(err)}]`,
      sources: [],
      confidence: "low",
      retrievedEntries: retrieved.length,
      factsUsed: factsCount,
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

  // 6. Log episode (audit trail + future consolidation)
  if (opts.orgId) {
    await logEpisode({
      orgId: opts.orgId,
      kind: "ai_query",
      clientId: opts.clientId,
      payload: {
        question,
        answer_excerpt: gemma.text.slice(0, 200),
        confidence,
        retrievedEntries: retrieved.length,
        factsUsed: factsCount,
        latencyMs: Date.now() - start,
      },
      outcome: "success",
    }).catch(() => undefined);
  }

  return {
    question,
    answer: gemma.text,
    sources,
    confidence,
    retrievedEntries: retrieved.length,
    factsUsed: factsCount,
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
