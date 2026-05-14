/**
 * FiscCopilot — Smoke test (manual, nu vitest)
 *
 * Rulează: npx tsx lib/fiscal-copilot/__smoke-test__.ts
 *
 * Verifică:
 * 1. Gemma e disponibil
 * 2. RAG retrieval funcționează
 * 3. AI Expert returnează răspunsuri grounded
 */

import { retrieveRelevant } from "./rag";
import { askExpert, checkExpertHealth } from "./ai-expert";

const TEST_QUESTIONS = [
  "Care e amenda pentru D205 depus târziu?",
  "Cum se înregistrează diurna ca să se ducă și în D112?",
  "Când e termenul pentru SAF-T D406?",
  "Dividende — cum se distribuie și ce declarație depun?",
  "Casa de marcat — de la ce prag e obligatorie pentru PFA?",
];

async function main() {
  console.log("=".repeat(70));
  console.log("FiscCopilot — Smoke Test");
  console.log("=".repeat(70));

  // 1. Health
  console.log("\n[1] Health check...");
  const health = await checkExpertHealth();
  console.log(JSON.stringify(health, null, 2));
  if (!health.ok) {
    console.error("STOP: Gemma indisponibil. Pornește Ollama.");
    process.exit(1);
  }

  // 2. RAG (offline test, no LLM call)
  console.log("\n[2] RAG retrieval test...");
  for (const q of TEST_QUESTIONS) {
    const results = retrieveRelevant(q, 2);
    console.log(`\n  Q: "${q}"`);
    results.forEach((r) =>
      console.log(`    → ${r.score.toFixed(1)} — ${r.entry.id} — ${r.entry.title.slice(0, 60)}`)
    );
  }

  // 3. Full AI Expert (slow — ~15s/întrebare)
  console.log("\n[3] AI Expert full pipeline (slow, please wait)...");
  for (const q of TEST_QUESTIONS.slice(0, 2)) {
    // doar 2 din 5 ca să nu dureze prea mult
    console.log("\n" + "-".repeat(70));
    console.log(`Q: ${q}`);
    console.log("-".repeat(70));
    const t0 = Date.now();
    const answer = await askExpert(q);
    console.log(`A: ${answer.answer}`);
    console.log(
      `\n[meta] confidence=${answer.confidence} retrieved=${answer.retrievedEntries} latency=${Date.now() - t0}ms model=${answer.model}`
    );
    console.log(
      `[sources] ${answer.sources
        .slice(0, 3)
        .map((s) => s.label)
        .join("; ")}`
    );
  }

  console.log("\n" + "=".repeat(70));
  console.log("Smoke test complete.");
  console.log("=".repeat(70));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
