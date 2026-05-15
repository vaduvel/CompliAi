import { NextResponse, type NextRequest } from "next/server";
import { getOrgContext } from "@/lib/server/org-context";
import {
  listEvents,
  logFiscalEvent,
  type LogFiscalEventInput,
} from "@/lib/fiscal-copilot/portfolio-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/fiscal-copilot/events?clientId=...&type=...&sinceDays=30
 */
export async function GET(req: NextRequest) {
  const ctx = await getOrgContext();
  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") ?? undefined;
  const type = (url.searchParams.get("type") as LogFiscalEventInput["type"]) ?? undefined;
  const sinceDaysRaw = url.searchParams.get("sinceDays");
  const sinceDays = sinceDaysRaw ? parseInt(sinceDaysRaw, 10) : undefined;

  const events = await listEvents(ctx.orgId, { clientId, type, sinceDays });
  return NextResponse.json({ count: events.length, events });
}

/**
 * POST /api/fiscal-copilot/events
 *
 * Body: LogFiscalEventInput
 */
export async function POST(req: NextRequest) {
  const ctx = await getOrgContext();
  const body = (await req.json()) as Partial<LogFiscalEventInput>;

  if (!body.clientId || !body.type) {
    return NextResponse.json(
      { error: "Missing required: clientId, type" },
      { status: 400 }
    );
  }

  const event = await logFiscalEvent(ctx.orgId, {
    clientId: body.clientId,
    type: body.type,
    date: body.date,
    amountRON: body.amountRON,
    refDoc: body.refDoc,
    meta: body.meta,
  });

  return NextResponse.json(event, { status: 201 });
}
