/**
 * Smoke test for fiscal-verifiers + ai-expert integration.
 *
 * Run: npx tsx lib/fiscal-copilot/__test-verifiers__.ts
 */
import {
  runVerifiers,
  collectMissingData,
  formatVerdictsForPrompt,
  verifyMicroEligibility,
  verifyTvaIncasare,
  verifyANC,
} from "./fiscal-verifiers";

console.log("\n=== TEST 1: Micro 2026 — fără date (cere clarificare) ===");
const t1 = runVerifiers("Pot fi micro în 2026?");
console.log(`Aplicabili: ${t1.length}`);
console.log(`Date necesare:`, collectMissingData(t1));

console.log("\n=== TEST 2: Micro 2026 — cu date complete ===");
const t2 = runVerifiers("Sunt micro în 2026 cu plafonul nou?", {
  cifraAfaceri2025: 350_000,
  areSalariat: true,
  intreprinderiLegateCa: [],
});
console.log(t2[0].verdict);

console.log("\n=== TEST 3: Micro 2026 — depășire prag (întreprinderi legate) ===");
const t3 = runVerifiers("Pot rămâne micro?", {
  cifraAfaceri2025: 80_000,
  areSalariat: true,
  intreprinderiLegateCa: [450_000], // alt SRL al asociatului cu CA 450K
});
console.log(t3[0].verdict);

console.log("\n=== TEST 4: TVA la încasare 2026 — depășire plafon 2025 ===");
const t4 = runVerifiers("Pot aplica TVA la încasare în 2026?", {
  caTvaIncasarePrec: 5_200_000, // > 4.5M (plafon 2025)
  anCurent: 2026,
});
console.log(t4[0].verdict);

console.log("\n=== TEST 5: ANC negativ + Legea 239/2025 ===");
const t5 = runVerifiers("Activul net contabil e negativ, ce restricții am?", {
  activNetContabil: -50_000,
  capitalSocial: 200,
});
console.log(t5[0].verdict);

console.log("\n=== TEST 6: Diurnă plafon dublu — limitare 33% activă ===");
const t6 = runVerifiers("Calcul diurnă sofer cu 20 zile UE", {
  salariuBrutLunar: 5_000,
  zileDeplsare: 20,
  tipDeplasare: "UE",
});
console.log(t6[0].verdict);

console.log("\n=== TEST 7: Plafon numerar — depășire B2B ===");
const t7 = runVerifiers("Pot plăti 15.000 lei numerar către firmă?", {
  sumaIncasare: 15_000,
  tipBeneficiar: "PJ",
});
console.log(t7[0].verdict);

console.log("\n=== TEST 8: Format pentru injectare în prompt ===");
const formatted = formatVerdictsForPrompt(t2);
console.log(formatted.slice(0, 800));

console.log("\n=== DONE ===\n");
