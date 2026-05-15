import { NextResponse } from "next/server";
import { getOrgContext } from "@/lib/server/org-context";
import { runAlertsForCabinet } from "@/lib/fiscal-copilot/run-alerts";
import { isPortfolioEmpty, seedDemoPortfolio } from "@/lib/fiscal-copilot/portfolio-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/fiscal-copilot/alerts
 *
 * Rulează Match Paths pe portofoliul REAL al cabinetului logat (per orgId).
 * Fast (~50ms): no LLM, just deterministic rules.
 *
 * Dacă portofoliul e gol → returnează empty array + flag pentru UI să sugereze seed demo.
 */
export async function GET() {
  const ctx = await getOrgContext();
  const orgId = ctx.orgId;

  if (await isPortfolioEmpty(orgId)) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      count: 0,
      alerts: [],
      portfolioEmpty: true,
      hint: "Portofoliul tău e gol. POST /api/fiscal-copilot/portfolio/seed-demo pentru seed demo, sau POST /api/fiscal-copilot/clients pentru adăugare client real.",
    });
  }

  // No logEpisodes on GET polling — only on explicit "refresh"
  const result = await runAlertsForCabinet(orgId, new Date(), { logEpisodes: false });

  return NextResponse.json({
    generatedAt: result.generatedAt,
    count: result.totalAlerts,
    alerts: result.alerts,
    portfolioEmpty: false,
  });
}
