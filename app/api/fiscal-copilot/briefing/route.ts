import { NextResponse } from "next/server";
import { generateDailyBriefing } from "@/lib/fiscal-copilot/daily-briefing";
import {
  DEMO_CABINET_ID,
  DEMO_CABINET_NAME,
  DEMO_CLIENTS,
  generateDemoEvents,
} from "@/lib/fiscal-copilot/demo-portfolio";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * GET /api/fiscal-copilot/briefing
 *
 * MVP: returnează briefing-ul demo (5 clienți seed).
 * v2: ia portofoliul real al cabinetului din DB (per orgId).
 */
export async function GET() {
  const today = new Date();
  const events = generateDemoEvents(today);

  const clients = DEMO_CLIENTS.map((profile) => ({
    profile,
    events: events.filter((e) => e.clientId === profile.id),
  }));

  const briefing = await generateDailyBriefing(
    {
      cabinetId: DEMO_CABINET_ID,
      cabinetName: DEMO_CABINET_NAME,
      clients,
    },
    today
  );

  return NextResponse.json(briefing);
}
