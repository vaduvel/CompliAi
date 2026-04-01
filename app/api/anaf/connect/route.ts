import { NextResponse } from "next/server"

import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { buildAuthorizeUrl } from "@/lib/anaf-spv-client"
import { encodeAnafOauthState, sanitizeInternalReturnTo } from "@/lib/server/anaf-oauth-state"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const returnTo = sanitizeInternalReturnTo(url.searchParams.get("returnTo"))

  try {
    const session = await requireFreshAuthenticatedSession(request, "conectarea ANAF")
    const state = encodeAnafOauthState({
      orgId: session.orgId,
      returnTo,
      issuedAtISO: new Date().toISOString(),
    })

    const authorizeUrl = buildAuthorizeUrl(session.orgId, state)
    if (!authorizeUrl) {
      return NextResponse.redirect(new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}anaf=missing-config`, request.url))
    }

    return NextResponse.redirect(authorizeUrl)
  } catch {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", returnTo)
    return NextResponse.redirect(loginUrl)
  }
}
