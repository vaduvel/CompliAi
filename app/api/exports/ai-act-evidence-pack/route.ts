import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { buildAIActEvidencePack } from "@/lib/server/ai-act-evidence-pack"

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer", "viewer"],
      "exportul AI Act Evidence Pack"
    )

    const pack = await buildAIActEvidencePack(session.orgId)
    const fileName = `ai-act-evidence-pack-${slugify(session.orgName)}-${pack.generatedAtISO.slice(0, 10)}.json`

    return new NextResponse(JSON.stringify(pack, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut genera AI Act Evidence Pack.",
      500,
      "AI_ACT_EVIDENCE_PACK_FAILED"
    )
  }
}
