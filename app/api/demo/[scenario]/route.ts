// app/api/demo/[scenario]/route.ts
// GET — pornire demo org: seed state + sesiune temporară → redirect /dashboard
//
// Parametri acceptați: imm | nis2 | partner
// Sesiunea demo expiră în 2 ore. Datele demo sunt resetate la fiecare vizita.

import { NextResponse } from "next/server"
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/server/auth"
import {
  buildDemoState,
  buildDemoNis2State,
  DEMO_ORG,
  DEMO_SCENARIOS,
  type DemoScenario,
} from "@/lib/server/demo-seed"
import { writeStateForOrg } from "@/lib/server/mvp-store"
import { seedNis2State } from "@/lib/server/nis2-store"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ scenario: string }> }
) {
  const { scenario } = await params

  if (!DEMO_SCENARIOS.includes(scenario as DemoScenario)) {
    return NextResponse.json(
      { error: `Scenariu invalid. Acceptat: ${DEMO_SCENARIOS.join(", ")}` },
      { status: 400 }
    )
  }

  const demo = scenario as DemoScenario
  const orgConfig = DEMO_ORG[demo]

  // Seed state (suprascrie la fiecare vizită — demo-ul pornește curat)
  const state = buildDemoState(demo)
  await writeStateForOrg(orgConfig.orgId, state, orgConfig.orgName)

  // Seed NIS2 separate store (vendors, incidents, maturity, board)
  const nis2State = buildDemoNis2State(demo)
  if (nis2State) {
    await seedNis2State(orgConfig.orgId, nis2State)
  }

  // Creare sesiune demo (2 ore)
  const token = createSessionToken({
    userId: `demo-user-${demo}`,
    orgId: orgConfig.orgId,
    email: orgConfig.email,
    orgName: orgConfig.orgName,
    role: orgConfig.role,
    membershipId: undefined,
  })

  const redirectUrl =
    demo === "partner" ? "/dashboard/partner" : "/dashboard"
  const requestOrigin = new URL(request.url).origin

  const response = NextResponse.redirect(
    new URL(redirectUrl, requestOrigin)
  )

  response.cookies.set(SESSION_COOKIE, token, {
    ...getSessionCookieOptions(),
    maxAge: 2 * 60 * 60, // 2 ore (override default mai lung)
  })

  return response
}
