import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import {
  analyzeExtractedScan,
  createExtractedScan,
  type ExtractionResult,
  validateScanInputPayload,
} from "@/lib/server/scan-workflow"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { getOrgContext } from "@/lib/server/org-context"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { RequestValidationError } from "@/lib/server/request-validation"
import { executeAgent } from "@/lib/server/agent-orchestrator"

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/scan")

  try {
    const session = await requireFreshAuthenticatedSession(request, "scanarea documentelor")
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
      return await analyzeExtractedScan(extracted.nextState, extracted.result.scan.id, body.content, actor)
    }, workspace.orgName)

    if (!extractionResult) {
      throw new Error("Extragerea s-a terminat fara rezultat utilizabil.")
    }

    // Event trigger: run compliance_monitor after scan completes (fire-and-forget)
    // New findings may change compliance score — agent updates notifications asynchronously.
    void executeAgent(workspace.orgId, "compliance_monitor").catch(() => {/* non-blocking */})

    return jsonWithRequestContext(
      {
        ...(await buildDashboardPayload(nextState, workspace)),
        ocrUsed: extractionResult.ocrUsed,
        ocrWarning: extractionResult.ocrWarning,
        extractedTextPreview: extractionResult.extractedTextPreview,
        message:
          "Scanare finalizată. Acesta este un scor de risc și o recomandare AI. Verifică uman înainte de raport oficial.",
      },
      context
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare la scanare."
    const status =
      error instanceof AuthzError
        ? error.status
        : error instanceof RequestValidationError
          ? error.status
          : message.includes("Nu am extras")
            ? 422
            : 400
    const code =
      error instanceof AuthzError
        ? error.code
        : error instanceof RequestValidationError
          ? error.code
          : "SCAN_FAILED"

    await logRouteError(context, error, {
      code,
      durationMs: getRequestDurationMs(context),
      status,
    })

    return jsonError(message, status, code, undefined, context)
  }
}
