import { NextResponse, type NextRequest } from "next/server";
import { getOrgContext } from "@/lib/server/org-context";
import { queryFacts } from "@/lib/fiscal-copilot/memory/semantic";

export const dynamic = "force-dynamic";

/**
 * GET /api/fiscal-copilot/memory/facts?subject=client-id&minConfidence=0.5
 */
export async function GET(req: NextRequest) {
  const ctx = await getOrgContext();
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject") ?? undefined;
  const predicate = url.searchParams.get("predicate") ?? undefined;
  const minConf = url.searchParams.get("minConfidence");

  const facts = await queryFacts(ctx.orgId, {
    subject,
    predicate,
    minEffectiveConfidence: minConf ? parseFloat(minConf) : undefined,
  });

  return NextResponse.json({
    count: facts.length,
    facts,
  });
}
