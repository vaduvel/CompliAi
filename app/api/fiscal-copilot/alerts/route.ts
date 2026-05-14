import { NextResponse } from "next/server";
import { runAllPaths } from "@/lib/fiscal-copilot/match-paths/paths";
import { DEMO_CLIENTS, generateDemoEvents } from "@/lib/fiscal-copilot/demo-portfolio";

export const dynamic = "force-dynamic";

/**
 * GET /api/fiscal-copilot/alerts
 *
 * Returnează toate alertele active pe demo portfolio.
 * Fast (no LLM). Util pentru polling UI.
 */
export async function GET() {
  const today = new Date();
  const allEvents = generateDemoEvents(today);

  const allAlerts = DEMO_CLIENTS.flatMap((profile) => {
    const events = allEvents.filter((e) => e.clientId === profile.id);
    return runAllPaths(profile, events, today);
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    count: allAlerts.length,
    alerts: allAlerts,
  });
}
