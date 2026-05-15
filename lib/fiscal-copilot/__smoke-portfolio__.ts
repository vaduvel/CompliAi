/**
 * Smoke test END-TO-END:
 *   seedDemoPortfolio → ask cu clientId → verifier auto-extract → Gemma 3 4B verbalize
 *
 * Run: cd worktrees/fiscal-mature && npx tsx lib/fiscal-copilot/__smoke-portfolio__.ts
 */
import { askExpert } from "./ai-expert";
import { seedDemoPortfolio, listClients } from "./portfolio-store";

async function main() {
  const orgId = "smoke-test-org";

  // 1. Seed demo portfolio (5 clienți)
  console.log("Seeding demo portfolio...");
  await seedDemoPortfolio(orgId);
  const clients = await listClients(orgId);
  console.log(`✓ ${clients.length} clienți încărcați:`);
  for (const c of clients) {
    console.log(`  - ${c.name} (${c.cui}) — ${c.type} — CA est: ${c.estimatedAnnualRevenueEUR ?? "?"} EUR`);
  }

  // Pick primul SRL_MICRO
  const microClient = clients.find((c) => c.type === "SRL_MICRO") ?? clients[0];
  console.log(`\nTesting cu client: ${microClient.name} (${microClient.id})\n`);

  // 2. Test 1: Întrebare micro 2026 — DATELE TREBUIE SĂ FIE AUTO-EXTRASE din portfolio
  console.log("=".repeat(80));
  console.log(`TEST: "Pot transforma ${microClient.name} în micro 2026?"`);
  console.log("Așteptăm: verifier rulează cu date auto-extrase, Gemma 3 4B verbalizează");
  console.log("=".repeat(80));

  const start = Date.now();
  try {
    const r = await askExpert(`Pot transforma ${microClient.name} în micro 2026?`, {
      orgId,
      clientId: microClient.id,
    });

    console.log(`\n[Model: ${r.model} | Latency: ${r.latencyMs}ms | Confidence: ${r.confidence}]`);
    console.log(`[Retrieved: ${r.retrievedEntries} entries | Verdicts: ${r.verdicts?.length ?? 0}]`);
    if (r.clarifyingQuestions) {
      console.log(`[Clarifying needed: ${r.clarifyingQuestions.length} întrebări]`);
      for (const q of r.clarifyingQuestions) {
        console.log(`  - ${q.prompt}`);
      }
    }
    console.log("\nRĂSPUNS:");
    console.log(r.answer);
    if (r.verdicts && r.verdicts.length > 0) {
      console.log("\nVERDICTE DETERMINISTE:");
      for (const v of r.verdicts) {
        if (v.verdict) {
          console.log(`  [${v.name}] ${v.verdict.label}`);
          console.log(`    Reason: ${v.verdict.reason.slice(0, 200)}`);
        } else if (v.needsData) {
          console.log(`  [${v.name}] Need data: ${v.needsData.map((d) => d.key).join(", ")}`);
        }
      }
    }
  } catch (err) {
    console.error("ERROR:", err);
  }
  console.log(`\nTotal: ${Date.now() - start}ms\n`);
}

main().catch(console.error);
