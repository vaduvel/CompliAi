import { NextResponse } from "next/server"

import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { getOrgContext } from "@/lib/server/org-context"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import {
  createExtractedScan,
  type ExtractionResult,
  validateScanInputPayload,
} from "@/lib/server/scan-workflow"
import { RequestValidationError } from "@/lib/server/request-validation"

export async function POST(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "extragerea textului din scan")
    const baseWorkspace = await getOrgContext({ request })
    const workspace = {
      ...baseWorkspace,
      orgId: session.orgId,
      orgName: session.orgName ?? baseWorkspace.orgName,
      workspaceLabel: session.orgName ?? baseWorkspace.workspaceLabel,
      workspaceOwner: session.email,
      userRole: session.role,
    }
    const body = validateScanInputPayload(await request.json())
    const actor = await resolveOptionalEventActor(request)
    let extractionResult: ExtractionResult | undefined

    const nextState = await mutateStateForOrg(workspace.orgId, async (current) => {
      const extracted = await createExtractedScan(current, body, actor)
      extractionResult = extracted.result
      return extracted.nextState
    }, workspace.orgName)

    if (!extractionResult) {
      throw new Error("Extragerea s-a terminat fara rezultat utilizabil.")
    }

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState, workspace)),
      scan: extractionResult.scan,
      ocrUsed: extractionResult.ocrUsed,
      ocrWarning: extractionResult.ocrWarning,
      extractedTextPreview: extractionResult.extractedTextPreview,
      message: "Textul a fost extras. Revizuieste-l si porneste analiza.",
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json(
        { error: error.message, code: error.code, ocrWarning: null, extractionStatus: "needs_review" },
        { status: error.status }
      )
    }
    const err = error as Error & { ocrWarning?: string | null }
    const message = err instanceof Error ? err.message : "Eroare la extragere."
    const status =
      error instanceof RequestValidationError
        ? error.status
        : message.includes("Nu am extras")
          ? 422
          : 400
    return NextResponse.json(
      {
        error: message,
        code: error instanceof RequestValidationError ? error.code : "SCAN_EXTRACT_FAILED",
        ocrWarning: err.ocrWarning ?? null,
        extractionStatus: "needs_review",
      },
      { status }
    )
  }
}
