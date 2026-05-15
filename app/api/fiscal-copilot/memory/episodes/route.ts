import { NextResponse, type NextRequest } from "next/server";
import { getOrgContext } from "@/lib/server/org-context";
import { queryEpisodes } from "@/lib/fiscal-copilot/memory/episodic";
import type { EpisodeKind } from "@/lib/fiscal-copilot/memory/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/fiscal-copilot/memory/episodes?clientId=&kind=&limit=50
 */
export async function GET(req: NextRequest) {
  const ctx = await getOrgContext();
  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") ?? undefined;
  const kind = url.searchParams.get("kind") as EpisodeKind | null;
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

  const episodes = await queryEpisodes(ctx.orgId, {
    clientId,
    kinds: kind ? [kind] : undefined,
    limit,
  });

  return NextResponse.json({ count: episodes.length, episodes });
}
