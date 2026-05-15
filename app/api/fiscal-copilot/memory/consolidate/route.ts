import { NextResponse } from "next/server";
import { getOrgContext } from "@/lib/server/org-context";
import { consolidate } from "@/lib/fiscal-copilot/memory/consolidation";

export const dynamic = "force-dynamic";

/**
 * POST /api/fiscal-copilot/memory/consolidate
 *
 * Rulează consolidarea memory: derivă semantic facts din episodes recurente.
 * Idempotent: re-rulează ok (reîntărește facts existente).
 *
 * Util pentru:
 *  - Buton manual în UI ("Învață din istorie")
 *  - Cron daily după briefing
 */
export async function POST() {
  const ctx = await getOrgContext();
  const report = await consolidate(ctx.orgId);
  return NextResponse.json(report);
}
