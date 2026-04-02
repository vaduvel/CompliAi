import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { getOrgContext } from "@/lib/server/org-context"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { analyzeExtractedScan } from "@/lib/server/scan-workflow"
import { asTrimmedString, requirePlainObject, RequestValidationError } from "@/lib/server/request-validation"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "analiza scanului revizuit")
    const baseWorkspace = await getOrgContext({ request })
    const workspace = {
      ...baseWorkspace,
      orgId: session.orgId,
      orgName: session.orgName ?? baseWorkspace.orgName,
      workspaceLabel: session.orgName ?? baseWorkspace.workspaceLabel,
      workspaceOwner: session.email,
      userRole: session.role,
    }
    const { id } = await context.params
    const body = requirePlainObject(await request.json())
    const reviewedContent = asTrimmedString(body.reviewedContent, 50_000)
    const actor = await resolveOptionalEventActor(request)

    const nextState = await mutateStateForOrg(
      workspace.orgId,
      async (current) => analyzeExtractedScan(current, id, reviewedContent, actor),
      workspace.orgName
    )

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState, workspace)),
      message: "Analiza a fost rulata pe textul revizuit.",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare la analiza."

    if (error instanceof AuthzError) {
      return jsonError(message, error.status, error.code)
    }

    if (message === "SCAN_NOT_FOUND") {
      return jsonError("Scan-ul nu exista.", 404, "SCAN_NOT_FOUND")
    }

    if (message === "SCAN_ALREADY_ANALYZED") {
      return jsonError("Acest scan a fost deja analizat.", 409, "SCAN_ALREADY_ANALYZED")
    }

    if (message === "SCAN_EMPTY_CONTENT") {
      return jsonError(
        "Textul revizuit este gol. Corecteaza continutul inainte de analiza.",
        422,
        "SCAN_EMPTY_CONTENT"
      )
    }

    if (error instanceof RequestValidationError) {
      return jsonError(message, error.status, error.code)
    }

    return jsonError(message, 400, "SCAN_ANALYZE_FAILED")
  }
}
