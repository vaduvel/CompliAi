/**
 * Test Daily Briefing cu demo portfolio.
 */
import { generateDailyBriefing } from "./daily-briefing";
import { DEMO_CABINET_ID, DEMO_CABINET_NAME, DEMO_CLIENTS, generateDemoEvents } from "./demo-portfolio";

async function main() {
  const today = new Date();
  const allEvents = generateDemoEvents(today);

  const clients = DEMO_CLIENTS.map((profile) => ({
    profile,
    events: allEvents.filter((e) => e.clientId === profile.id),
  }));

  console.log("Generating daily briefing...\n");
  const briefing = await generateDailyBriefing(
    { cabinetId: DEMO_CABINET_ID, cabinetName: DEMO_CABINET_NAME, clients },
    today
  );

  console.log("=".repeat(70));
  console.log(`DAILY BRIEFING — ${briefing.date}`);
  console.log("=".repeat(70));
  console.log("\n" + briefing.headline + "\n");
  console.log("-".repeat(70));
  console.log("STATS:");
  console.log(`  Clienți: ${briefing.stats.clientsWithAlerts}/${briefing.stats.totalClients} cu alerte`);
  console.log(`  🚨 Urgent: ${briefing.stats.urgentCount}`);
  console.log(`  ⚠️  High:   ${briefing.stats.highCount}`);
  console.log(`  ⚡ Medium: ${briefing.stats.mediumCount}`);
  console.log(`  💡 Low:    ${briefing.stats.lowCount}`);
  console.log(`  Risc estimat cumulat: ${briefing.stats.estimatedRiskRON} RON`);
  console.log("\nTOP 5 ACȚIUNI PENTRU AZI:");
  briefing.topActions.forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.severity.toUpperCase()}] ${a.clientName} — ${a.title}`);
    console.log(`     → ${a.firstStep}`);
    if (a.deadlineDate) console.log(`     Deadline: ${a.deadlineDate.slice(0, 10)}`);
  });
  console.log(`\nGenerated in ${briefing.generationLatencyMs}ms\n`);
}

main().catch(console.error);
