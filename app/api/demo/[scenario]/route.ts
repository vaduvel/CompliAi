// app/api/demo/[scenario]/route.ts
// GET — pornire demo org: seed state + sesiune temporară → redirect /dashboard
//
// Parametri acceptați: imm | nis2 | partner
// Sesiunea demo expiră în 2 ore. Datele demo sunt resetate la fiecare vizita.

import { NextResponse } from "next/server"
import { promises as fs } from "node:fs"
import path from "node:path"
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/server/auth"
import {
  buildDemoState,
  DEMO_ORG,
  DEMO_SCENARIOS,
  type DemoScenario,
} from "@/lib/server/demo-seed"

const DATA_DIR = path.join(process.cwd(), ".data")

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

export async function GET(
  _request: Request,
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
  await ensureDataDir()
  await fs.writeFile(
    path.join(DATA_DIR, `state-${orgConfig.orgId}.json`),
    JSON.stringify(state, null, 2),
    "utf8"
  )

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

  const response = NextResponse.redirect(
    new URL(redirectUrl, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
  )

  response.cookies.set(SESSION_COOKIE, token, {
    ...getSessionCookieOptions(),
    maxAge: 2 * 60 * 60, // 2 ore (override default mai lung)
  })

  return response
}
