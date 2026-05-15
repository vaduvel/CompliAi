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
import {
  runVerifiers,
  collectMissingData,
  formatVerdictsForPrompt,
  type VerifierData,
  type VerifierResult,
} from "./fiscal-verifiers";

export interface AIAnswer {
  question: string;
  answer: string;
  sources: Array<{ label: string; ref: string; entry_id: string }>;
  confidence: "high" | "medium" | "low";
  retrievedEntries: number;
  /** Facts despre client folosite ca context suplimentar */
  factsUsed: number;
  /** Dacă au lipsit date pentru verificare deterministă → întrebări clarificare */
  clarifyingQuestions?: Array<{ key: string; prompt: string; example?: string }>;
  /** Verdict-uri deterministe aplicate (dacă datele au fost furnizate) */
  verdicts?: VerifierResult[];
  latencyMs: number;
  model: string;
}

const SYSTEM_PROMPT = `Ești "FiscCopilot" — asistent fiscal AI pentru contabili și cabinete din România.

ABORDAREA TA:
Contabilul ESTE profesionist. Tu îi dai LEGEA aplicabilă pe cazul lui + PAȘI concreti + CIFRE verificate. NU-l înveți contabilitate de la zero — îi economisești 3 ore de săpat prin Cod Fiscal.

FLUX OBLIGATORIU pentru orice întrebare fiscală:
1. IDENTIFICĂ articolele aplicabile din contextul retrievat (Cod Fiscal art. X, OMFP, OUG)
2. VERIFICĂ modificările recente (OUG 8/2026, L 239/2025, OUG 156/2024, L 245/2025, OUG 107/2024)
3. DACĂ există VERDICT DETERMINIST în context (secțiunea "VERIFICARE DETERMINISTĂ") — îl FOLOSEȘTI ca fapt sigur, NU îl contrazici
4. APLICĂ praguri concret pe datele specifice ale userului (DACĂ ai datele)
5. RĂSPUNDE structurat: (a) verdict scurt, (b) bază legală, (c) pași concreti, (d) monografie dacă aplicabil

REGULI:
1. Răspunzi DOAR în limba română, profesional, clar.
2. Folosești DOAR informația din context + verdicte deterministe. NU inventezi cifre/termene/articole.
3. Citezi sursele la final: "Surse: [Cod Fiscal art. X]; [OUG Y/2026]; ..."
4. Răspuns CONCIS dar COMPLET (5-15 propoziții pentru întrebări complexe).
5. La PAȘI/PROCEDURĂ — listă numerotată clară.
6. Pentru praguri/termene — EXACT cifrele din context (NU aproximezi).
7. La final, dacă cazul are particularități: "Verifică pe cazul tău particular: [aspect specific]".
8. NU pretinzi că ești contabil autorizat — ești ASISTENT pentru ACCELERAREA muncii.

STIL:
- Direct. NU prefață cu "Înțeleg întrebarea ta..." — răspunde direct.
- Concret. "Plafonul este 100.000 EUR conform OUG 8/2026" NU "există un plafon care..."
- Practic. Pași > teorie. "Depune D700 cu secțiunea X" NU "trebuie să modifici vector fiscal".

DACĂ CONTEXTUL NU ACOPERĂ:
Spui: "Nu am informații suficiente pentru această întrebare specifică. Verifică ANAF.ro sau consultă consultant fiscal autorizat." Dar OFERĂ totuși ce există în context (parțial).`;

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
    /** Date deterministe pe care userul le furnizează (după prompt) */
    verifierData?: VerifierData;
    /** Dacă true, returnează clarifying questions în loc să forțeze LLM (default true) */
    askClarifying?: boolean;
  } = {}
): Promise<AIAnswer> {
  const start = Date.now();
  const topN = opts.topN ?? 3;
  const askClarifying = opts.askClarifying ?? true;

  // 0. DETERMINISTIC VERIFIERS — pre-LLM
  // Trecem întrebarea prin verifierii deterministi. Dacă unul detectează aplicabilitate:
  //   - Are toate datele → verdict injectat în prompt
  //   - Lipsesc date → scurt-circuit LLM, returnăm clarifying questions
  const verifierResults = runVerifiers(question, opts.verifierData);
  const missingData = collectMissingData(verifierResults);
  const hasAnyApplicableVerifier = verifierResults.length > 0;

  if (askClarifying && hasAnyApplicableVerifier && missingData && missingData.length > 0) {
    // Scurt-circuit — cere date înainte să răspundă
    const verifierTopics = verifierResults.map((v) => v.topic).join(", ");
    const answer = `Pentru a răspunde precis pe cazul tău (${verifierTopics}), am nevoie de câteva date concrete:\n\n${missingData
      .map((m, i) => `${i + 1}. ${m.prompt}${m.example ? ` (ex: ${m.example})` : ""}`)
      .join("\n")}\n\nFurnizează datele și aplic verificarea pe situația ta exactă.`;
    return {
      question,
      answer,
      sources: [],
      confidence: "high", // deterministic — sigur că trebuie aceste date
      retrievedEntries: 0,
      factsUsed: 0,
      clarifyingQuestions: missingData.map((m) => ({
        key: m.key as string,
        prompt: m.prompt,
        example: m.example,
      })),
      verdicts: verifierResults,
      latencyMs: Date.now() - start,
      model: "deterministic-clarify",
    };
  }

  // 1. RAG retrieval
  void retrieveRelevant;
  const retrieved = await retrieveRelevantAsync(question, topN);
  const context = formatContextForPrompt(retrieved);

  // 1a. Verdicts deterministe (dacă datele au fost furnizate)
  const verdictsContext = formatVerdictsForPrompt(verifierResults);

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

  // 2. Build prompt — include verdicts deterministe DACĂ există
  const userPrompt = `Context fiscal (din baza de cunoștințe verificată):

${context}
${verdictsContext}
${factsContext}

---

Întrebarea contabilului:
${question}

---

Răspunde conform regulilor din SYSTEM_PROMPT. Folosește DOAR informațiile din context + verdictele deterministe. Citează sursele.`;

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
    verdicts: verifierResults.length ? verifierResults : undefined,
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
