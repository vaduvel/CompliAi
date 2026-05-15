/**
 * REAL end-to-end smoke test cu Gemma.
 * Run: npx tsx lib/fiscal-copilot/__smoke-real__.ts
 */
import { askExpert } from "./ai-expert";

const tests: Array<{ q: string; data?: any; label: string }> = [
  {
    label: "TEST 1: Micro 2026 FĂRĂ date — așteptăm clarifying questions",
    q: "Pot fi microîntreprindere în 2026?",
  },
  {
    label: "TEST 2: Micro 2026 CU date — așteptăm verdict + bază legală",
    q: "Pot fi microîntreprindere în 2026?",
    data: {
      cifraAfaceri2025: 350_000,
      areSalariat: true,
      intreprinderiLegateCa: [],
    },
  },
  {
    label: "TEST 3: TVA la încasare 2026 — depășire plafon 2025",
    q: "Pot aplica TVA la încasare în 2026 dacă în 2025 am avut CA 5.200.000 lei?",
    data: { caTvaIncasarePrec: 5_200_000, anCurent: 2026 },
  },
  {
    label: "TEST 4: Generic — fără verifier, doar RAG + Gemma",
    q: "Cum se înregistrează contabil o factură de stornare în luna ulterioară?",
  },
];

async function main() {
  for (const t of tests) {
    console.log("\n" + "=".repeat(80));
    console.log(t.label);
    console.log("Întrebare:", t.q);
    if (t.data) console.log("Date furnizate:", t.data);
    console.log("-".repeat(80));

    const start = Date.now();
    try {
      const r = await askExpert(t.q, { verifierData: t.data });
      console.log(`\n[Model: ${r.model} | Latency: ${r.latencyMs}ms | Confidence: ${r.confidence}]`);
      console.log(`[Retrieved: ${r.retrievedEntries} entries | Verdicts: ${r.verdicts?.length ?? 0}]`);
      if (r.clarifyingQuestions) {
        console.log(`[Clarifying needed: ${r.clarifyingQuestions.length} întrebări]`);
      }
      console.log("\nRĂSPUNS:");
      console.log(r.answer);
      if (r.sources.length > 0) {
        console.log("\nSurse:", r.sources.slice(0, 3).map((s) => s.label).join(" | "));
      }
    } catch (err) {
      console.log("EROARE:", err instanceof Error ? err.message : String(err));
    }
    console.log(`\nTotal: ${Date.now() - start}ms`);
  }
}

main().catch(console.error);
