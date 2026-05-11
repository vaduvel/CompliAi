// app/api/demo/[scenario]/route.ts
// GET — pornire demo org: seed state + sesiune temporară → redirect /dashboard
//
// Parametri acceptați: imm | nis2 | partner | revalidation | dpo-consultant
// Sesiunea demo expiră în 2 ore. Datele demo sunt resetate la fiecare vizita.

import { NextResponse } from "next/server"
import {
  createOrganizationForExistingUser,
  createSessionToken,
  getSessionCookieOptions,
  registerUser,
  SESSION_COOKIE,
  setUserMode,
} from "@/lib/server/auth"
import {
  buildDemoState,
  buildDemoPortfolioClientStates,
  buildDemoNis2State,
  DEMO_ORG,
  DEMO_SCENARIOS,
  type DemoScenario,
} from "@/lib/server/demo-seed"
import { writeStateForOrg } from "@/lib/server/mvp-store"
import { seedNis2State } from "@/lib/server/nis2-store"
import { seedDsarState } from "@/lib/server/dsar-store"
import { saveWhiteLabelConfig } from "@/lib/server/white-label"
import { saveCabinetTemplate } from "@/lib/server/cabinet-templates-store"

const DPO_DEMO_WHITE_LABEL = {
  partnerName: "DPO Complet",
  tagline: "Cabinet DPO pentru IMM-uri",
  logoUrl: null,
  brandColor: "#4f46e5",
  aiEnabled: false,
  signatureUrl: null,
  signerName: "Diana Popescu, CIPP/E",
  icpSegment: "cabinet-dpo",
  aiProvider: null,
} as const

const DPO_DEMO_TEMPLATES = [
  {
    documentType: "dpa" as const,
    name: "DPA vendor — DPO Complet",
    description: "Template cabinet pentru procesatori SaaS / payroll / plăți.",
    sourceFileName: "DPO_Complet_DPA_vendor_v2026.docx",
    content: `# DPA vendor — {{ORG_NAME}}

Pregătit de {{PREPARED_BY}} pentru clientul {{ORG_NAME}}.

## Obiect
Procesatorul va prelucra datele personale strict conform instrucțiunilor operatorului.

## Dovadă
Documentul se trimite prin magic link, iar aprobarea / respingerea intră în evidence ledger.`,
  },
  {
    documentType: "deletion-attestation" as const,
    name: "Răspuns DSAR pacient — DPO Complet",
    description: "Template pentru cereri de acces / răspuns DSAR în termen legal.",
    sourceFileName: "DPO_Complet_DSAR_raspuns_pacient.docx",
    content: `# Răspuns DSAR — {{ORG_NAME}}

Stimate/Stimată [nume],

Confirmăm primirea cererii și documentăm verificarea identității, sistemele verificate, excepțiile aplicabile și dovada transmiterii răspunsului final.

Document de lucru pregătit de {{PREPARED_BY}}.`,
  },
  {
    documentType: "ropa" as const,
    name: "RoPA procesatori — DPO Complet",
    description: "Template pentru actualizarea registrului RoPA cu furnizori noi.",
    sourceFileName: "DPO_Complet_RoPA_procesatori.md",
    content: `# RoPA procesatori — {{ORG_NAME}}

## Activitate
[completează activitatea]

## Procesator / furnizor
[completează furnizorul, rolul, categoriile de date și temeiul]

## Dovadă
Atașează DPA-ul aprobat și confirmarea internă în dosarul clientului.`,
  },
]

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
  if (demo === "dpo-consultant") {
    return startDpoConsultantDemo(request)
  }

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

async function startDpoConsultantDemo(request: Request) {
  const runId = Date.now().toString(36)
  const externalUserId = `demo-user-dpo-consultant-${runId}`
  const email = `diana.${runId}@demo-dpo-consultant.compliscan.ro`

  const user = await registerUser(email, "", "DPO Complet SRL", {
    externalUserId,
  })
  await setUserMode(user.id, "partner")

  const cabinetState = buildDemoState("dpo-consultant")
  await writeStateForOrg(user.orgId, cabinetState, user.orgName)
  await saveWhiteLabelConfig(user.orgId, DPO_DEMO_WHITE_LABEL)
  for (const template of DPO_DEMO_TEMPLATES) {
    await saveCabinetTemplate(user.orgId, {
      ...template,
      versionLabel: "v2026.1",
      active: true,
    })
  }

  for (const client of buildDemoPortfolioClientStates("dpo-consultant")) {
    const membership = await createOrganizationForExistingUser(
      user.id,
      client.orgName,
      "partner_manager"
    )
    await writeStateForOrg(membership.orgId, client.state, membership.orgName)
    await saveWhiteLabelConfig(membership.orgId, DPO_DEMO_WHITE_LABEL)
    if (client.nis2State) {
      await seedNis2State(membership.orgId, client.nis2State)
    }
    if (client.dsarState) {
      await seedDsarState(membership.orgId, {
        ...client.dsarState,
        requests: client.dsarState.requests.map((entry) => ({
          ...entry,
          orgId: membership.orgId,
        })),
      })
    }
  }

  const token = createSessionToken({
    userId: user.id,
    orgId: user.orgId,
    email: user.email,
    orgName: user.orgName,
    role: user.role,
    userMode: "partner",
    membershipId: user.membershipId,
    workspaceMode: "portfolio",
  })

  const requestOrigin = new URL(request.url).origin
  const response = NextResponse.redirect(new URL("/dashboard/partner", requestOrigin))
  response.cookies.set(SESSION_COOKIE, token, {
    ...getSessionCookieOptions(),
    maxAge: 2 * 60 * 60,
  })

  return response
}
