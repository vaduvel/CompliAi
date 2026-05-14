/**
 * Test Match Paths cu demo portfolio.
 * Rulează: npx tsx lib/fiscal-copilot/__test-match-paths__.ts
 */
import { DEMO_CLIENTS, generateDemoEvents } from "./demo-portfolio";
import { runAllPaths } from "./match-paths/paths";

const today = new Date();
const events = generateDemoEvents(today);

console.log("=".repeat(70));
console.log(`Match Path Engine — Demo run (today: ${today.toISOString().slice(0, 10)})`);
console.log("=".repeat(70));

let totalAlerts = 0;
for (const client of DEMO_CLIENTS) {
  const clientEvents = events.filter((e) => e.clientId === client.id);
  const alerts = runAllPaths(client, clientEvents, today);

  console.log(`\n📋 ${client.name} (${client.type}, ${client.cui})`);
  console.log(`   Events: ${clientEvents.length}, Alerts: ${alerts.length}`);
  if (alerts.length === 0) {
    console.log("   ✓ Nu sunt probleme detectate.");
    continue;
  }
  for (const a of alerts) {
    totalAlerts++;
    const sevIcon = { urgent: "🚨", high: "⚠️", medium: "⚡", low: "💡", info: "ℹ️" }[a.severity];
    console.log(`\n   ${sevIcon} [${a.severity.toUpperCase()}] ${a.title}`);
    console.log(`      Path: ${a.pathName}`);
    console.log(`      ${a.explanation}`);
    if (a.deadlineDate) console.log(`      Deadline: ${a.deadlineDate.slice(0, 10)}`);
    if (a.estimatedImpactRON) console.log(`      Impact estimat: ${a.estimatedImpactRON} RON`);
    console.log(`      Pași: ${a.actionSteps.length} acțiuni de urmat.`);
  }
}

console.log(`\n${"=".repeat(70)}`);
console.log(`TOTAL: ${totalAlerts} alerte pe ${DEMO_CLIENTS.length} clienți`);
console.log("=".repeat(70));
