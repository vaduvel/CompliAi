import { NextResponse } from "next/server"

import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { generateContractsBaselinePack, type ContractsPackKind } from "@/lib/compliance/contracts-drafts"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { logRouteError } from "@/lib/server/operational-logger"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/contracts/pack")

  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "încărcarea pachetului contractual"
    )

    const requestedKind = new URL(request.url).searchParams.get("kind")
    if (requestedKind && requestedKind !== "contracts-baseline") {
      return jsonError(
        "Tipul de pachet contractual nu este suportat.",
        400,
        "CONTRACTS_PACK_KIND_INVALID",
        undefined,
        context
      )
    }

    const state =
      (await readFreshStateForOrg(session.orgId, session.orgName)) ??
      normalizeComplianceState(initialComplianceState)
    const orgProfile = state.orgProfile
    const packInput = {
      orgName: session.orgName || session.orgId,
      sector: orgProfile?.sector ?? null,
      employeeCount: orgProfile?.employeeCount ?? null,
      hasAiTools: Boolean(orgProfile?.usesAITools),
    }

    const packKind: ContractsPackKind = "contracts-baseline"
    const pack = generateContractsBaselinePack(packInput)

    return NextResponse.json({ kind: packKind, pack }, withRequestIdHeaders(undefined, context))
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code, undefined, context)
    await logRouteError(context, error, {
      code: "CONTRACTS_PACK_READ_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError(
      "Nu am putut încărca pachetul contractual.",
      500,
      "CONTRACTS_PACK_READ_FAILED",
      undefined,
      context
    )
  }
}
