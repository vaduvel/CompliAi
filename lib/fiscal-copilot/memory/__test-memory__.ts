/**
 * Smoke test pentru memory module (Episodic + Semantic + Procedural + Consolidation).
 * Rulează: npx tsx lib/fiscal-copilot/memory/__test-memory__.ts
 */
import { logEpisode, queryEpisodes, recentClientHistory } from "./episodic";
import { upsertFact, queryFacts, clientFacts, factsAsContext } from "./semantic";
import { upsertProcedure, seedDefaultProcedures, getProcedure } from "./procedural";
import { consolidate } from "./consolidation";

const TEST_ORG = "org-test-fiscal-copilot";

async function main() {
  console.log("=".repeat(70));
  console.log("FiscCopilot Memory — Smoke Test");
  console.log("=".repeat(70));

  // ── 1. Episodic ────────────────────────────────────────────────────────
  console.log("\n[1] Logging episodes...");
  await logEpisode({
    orgId: TEST_ORG,
    kind: "ai_query",
    payload: { question: "Care e amenda pentru D205?" },
    outcome: "success",
  });
  await logEpisode({
    orgId: TEST_ORG,
    kind: "ai_query",
    payload: { question: "Când se depune D205 dividende?" },
    outcome: "success",
  });
  await logEpisode({
    orgId: TEST_ORG,
    kind: "ai_query",
    payload: { question: "Cum se calculează amenda D205?" },
    outcome: "success",
  });
  await logEpisode({
    orgId: TEST_ORG,
    kind: "alert_fired",
    clientId: "client-marcel",
    payload: { pathId: "d205-deadline", severity: "urgent" },
    outcome: "info",
  });
  await logEpisode({
    orgId: TEST_ORG,
    kind: "alert_fired",
    clientId: "client-marcel",
    payload: { pathId: "d205-deadline", severity: "urgent" },
    outcome: "info",
  });
  await logEpisode({
    orgId: TEST_ORG,
    kind: "alert_fired",
    clientId: "client-marcel",
    payload: { pathId: "d205-deadline", severity: "high" },
    outcome: "info",
  });

  const allEps = await queryEpisodes(TEST_ORG);
  console.log(`  Total episodes logged: ${allEps.length}`);

  const marcelHistory = await recentClientHistory(TEST_ORG, "client-marcel");
  console.log(`  Marcel history: ${marcelHistory.length} episodes`);

  // ── 2. Semantic ────────────────────────────────────────────────────────
  console.log("\n[2] Upserting facts...");
  await upsertFact({
    orgId: TEST_ORG,
    subject: "client-marcel",
    predicate: "preferă_email_la_ora",
    object: "08:00",
    confidence: 0.7,
  });
  // Re-upsert same fact (should reinforce, not duplicate)
  await upsertFact({
    orgId: TEST_ORG,
    subject: "client-marcel",
    predicate: "preferă_email_la_ora",
    object: "08:00",
    confidence: 0.8,
  });

  const facts = await clientFacts(TEST_ORG, "client-marcel");
  console.log(`  Marcel facts: ${facts.length}`);
  console.log(`  Context: ${factsAsContext(facts)}`);

  // ── 3. Procedural ──────────────────────────────────────────────────────
  console.log("\n[3] Seeding default procedures...");
  await seedDefaultProcedures(TEST_ORG);
  const divProc = await getProcedure(TEST_ORG, "distribuire_dividende");
  console.log(`  Procedure 'distribuire_dividende': ${divProc?.steps.length} steps`);
  divProc?.steps.forEach((s, i) => console.log(`    ${i + 1}. ${s.action}: ${s.description}`));

  // ── 4. Consolidation ──────────────────────────────────────────────────
  console.log("\n[4] Running consolidation...");
  const report = await consolidate(TEST_ORG);
  console.log(`  ${JSON.stringify(report, null, 2)}`);

  // Verify Rule 1 derived fact about Marcel D205
  const marcelFactsAfter = await clientFacts(TEST_ORG, "client-marcel");
  console.log(`\n  Marcel facts AFTER consolidation: ${marcelFactsAfter.length}`);
  marcelFactsAfter.forEach((f) =>
    console.log(`    ${f.predicate} ${f.object} (conf: ${(f.confidence * 100).toFixed(0)}%, sources: ${f.sourceEpisodeIds.length})`)
  );

  // Verify Rule 2 derived fact about cabinet querying D205
  const cabinetFacts = await queryFacts(TEST_ORG, { subject: "cabinet" });
  console.log(`\n  Cabinet facts AFTER consolidation: ${cabinetFacts.length}`);
  cabinetFacts.forEach((f) =>
    console.log(`    ${f.predicate} ${f.object} (conf: ${(f.confidence * 100).toFixed(0)}%, sources: ${f.sourceEpisodeIds.length})`)
  );

  console.log("\n" + "=".repeat(70));
  console.log("Memory smoke test PASSED.");
  console.log("File: .data/fiscal-copilot-memory-org-test-fiscal-copilot.json");
  console.log("=".repeat(70));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
