// GET  /api/org/profile — returnează profilul org + applicability result
// POST /api/org/profile — salvează profilul și calculează applicability

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { mutateState, readState } from "@/lib/server/mvp-store"
import {
  evaluateApplicability,
  type OrgProfile,
  type OrgSector,
  type OrgEmployeeCount,
} from "@/lib/compliance/applicability"

const VALID_SECTORS: OrgSector[] = [
  "energy", "transport", "banking", "health", "digital-infrastructure",
  "public-admin", "finance", "retail", "manufacturing", "professional-services", "other",
]

const VALID_EMPLOYEE_COUNTS: OrgEmployeeCount[] = ["1-9", "10-49", "50-249", "250+"]

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const state = await readState()
    return NextResponse.json({
      orgProfile: state.orgProfile ?? null,
      applicability: state.applicability ?? null,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca profilul org.", 500, "ORG_PROFILE_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as Partial<OrgProfile>

    if (!body.sector || !VALID_SECTORS.includes(body.sector)) {
      return jsonError("Câmp invalid: sector.", 400, "INVALID_SECTOR")
    }
    if (!body.employeeCount || !VALID_EMPLOYEE_COUNTS.includes(body.employeeCount)) {
      return jsonError("Câmp invalid: employeeCount.", 400, "INVALID_EMPLOYEE_COUNT")
    }
    if (typeof body.usesAITools !== "boolean") {
      return jsonError("Câmp obligatoriu: usesAITools (boolean).", 400, "MISSING_USES_AI_TOOLS")
    }
    if (typeof body.requiresEfactura !== "boolean") {
      return jsonError("Câmp obligatoriu: requiresEfactura (boolean).", 400, "MISSING_REQUIRES_EFACTURA")
    }

    const orgProfile: OrgProfile = {
      sector: body.sector,
      employeeCount: body.employeeCount,
      usesAITools: body.usesAITools,
      requiresEfactura: body.requiresEfactura,
      completedAtISO: new Date().toISOString(),
    }

    const applicability = evaluateApplicability(orgProfile)

    await mutateState((current) => ({ ...current, orgProfile, applicability }))

    return NextResponse.json({ orgProfile, applicability })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut salva profilul org.", 500, "ORG_PROFILE_SAVE_FAILED")
  }
}
