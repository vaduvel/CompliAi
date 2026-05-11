import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { exchangeCodeForTokens, markTokenUsed, probeAnafToken } from "@/lib/anaf-spv-client"
import { readFreshSessionFromRequest } from "@/lib/server/auth"
import { decodeAnafOauthState, sanitizeInternalReturnTo } from "@/lib/server/anaf-oauth-state"
import { systemEventActor, eventActorFromSession } from "@/lib/server/event-actor"
import { getAnafMode } from "@/lib/server/efactura-anaf-client"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"

export async function GET(request: Request) {
  const callbackUrl = new URL(request.url)
  const session = await readFreshSessionFromRequest(request)
  const oauthState = decodeAnafOauthState(callbackUrl.searchParams.get("state"))
  const returnTo = sanitizeInternalReturnTo(oauthState?.returnTo)
  const redirectBase = new URL(returnTo, request.url)

  const error = callbackUrl.searchParams.get("error")
  if (error) {
    redirectBase.searchParams.set("anaf", "oauth-error")
    redirectBase.searchParams.set("reason", error)
    return NextResponse.redirect(redirectBase)
  }

  const code = callbackUrl.searchParams.get("code")
  if (!code) {
    redirectBase.searchParams.set("anaf", "missing-code")
    return NextResponse.redirect(redirectBase)
  }

  const orgId = session?.orgId ?? oauthState?.orgId
  if (!orgId) {
    redirectBase.searchParams.set("anaf", "missing-org")
    return NextResponse.redirect(redirectBase)
  }

  const nowISO = new Date().toISOString()
  const token = await exchangeCodeForTokens(code, orgId, nowISO).catch(() => null)
  if (!token) {
    redirectBase.searchParams.set("anaf", "token-failed")
    return NextResponse.redirect(redirectBase)
  }

  const currentState = (await readStateForOrg(orgId)) ?? normalizeComplianceState(initialComplianceState)
  const cif = currentState.orgProfile?.cui?.replace(/^RO/i, "") ?? ""

  const probe = cif ? await probeAnafToken(token.accessToken, cif) : null
  if (probe && probe.status === 401) {
    redirectBase.searchParams.set("anaf", "token-invalid")
    redirectBase.searchParams.set("reason", "anaf-rejected-token")
    return NextResponse.redirect(redirectBase)
  }
  if (probe?.valid) {
    await markTokenUsed(orgId, nowISO)
  }

  const actor = session ? eventActorFromSession(session) : systemEventActor("ANAF OAuth callback")
  await writeStateForOrg(
    orgId,
    {
      ...currentState,
      efacturaConnected: true,
      efacturaSyncedAtISO: nowISO,
      events: appendComplianceEvents(currentState, [
        createComplianceEvent(
          {
            type: "integration.efactura-connected",
            entityType: "integration",
            entityId: "efactura",
            message:
              getAnafMode() === "real"
                ? "Conexiunea ANAF SPV a fost autorizată în producție."
                : "Conexiunea ANAF SPV a fost autorizată în sandbox-ul oficial.",
            createdAtISO: nowISO,
            metadata: {
              mode: getAnafMode(),
              tokenType: token.tokenType,
              expiresAtISO: token.expiresAtISO,
              probeStatus: probe?.status ?? 0,
              probeValid: probe?.valid ?? false,
              probed: probe !== null,
            },
          },
          actor
        ),
      ]),
    },
    session?.orgName
  )

  redirectBase.searchParams.set("anaf", "connected")
  redirectBase.searchParams.set("mode", getAnafMode())
  if (probe && !probe.valid) {
    redirectBase.searchParams.set("probe", "unverified")
  }
  return NextResponse.redirect(redirectBase)
}
