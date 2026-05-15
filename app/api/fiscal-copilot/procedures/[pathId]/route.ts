import { NextResponse, type NextRequest } from "next/server";
import { getOrgContext } from "@/lib/server/org-context";
import { getProcedureByPathId } from "@/lib/fiscal-copilot/memory/procedural";

export const dynamic = "force-dynamic";

/**
 * GET /api/fiscal-copilot/procedures/:pathId
 *
 * Returnează procedura asociată unui Match Path id.
 * Folosit pentru butonul "Vezi procedura" pe fiecare alert.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ pathId: string }> }) {
  const { pathId } = await ctx.params;
  const org = await getOrgContext();
  const proc = await getProcedureByPathId(org.orgId, pathId);
  if (!proc) {
    return NextResponse.json(
      { error: "No procedure linked to this path", pathId },
      { status: 404 }
    );
  }
  return NextResponse.json(proc);
}
