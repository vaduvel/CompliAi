import { NextResponse } from "next/server";
import { getOrgContext } from "@/lib/server/org-context";
import { generateDailyBriefing } from "@/lib/fiscal-copilot/daily-briefing";
import { listClients, listEvents, isPortfolioEmpty } from "@/lib/fiscal-copilot/portfolio-store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * GET /api/fiscal-copilot/briefing
 *
 * Generează briefing-ul zilnic pentru cabinetul logat (per orgId).
 * Folosește portofoliul REAL (din DB), NU DEMO_CLIENTS hardcoded.
 */
export async function GET() {
  const ctx = await getOrgContext();
  const orgId = ctx.orgId;
  const cabinetName = ctx.workspaceLabel || ctx.orgName || "Cabinetul tău";

  if (await isPortfolioEmpty(orgId)) {
    return NextResponse.json(
      {
        error: "portfolio_empty",
        hint: "Adaugă clienți sau seed demo înainte de a genera briefing.",
      },
      { status: 422 }
    );
  }

  const today = new Date();
  const clients = await listClients(orgId);
  const allEvents = await listEvents(orgId);

  const briefingInput = clients.map((profile) => ({
    profile,
    events: allEvents.filter((e) => e.clientId === profile.id),
  }));

  const briefing = await generateDailyBriefing(
    {
      cabinetId: orgId,
      cabinetName,
      clients: briefingInput,
    },
    today
  );

  return NextResponse.json(briefing);
}
