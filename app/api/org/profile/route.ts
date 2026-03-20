// GET  /api/org/profile — returnează profilul org + applicability result
// POST /api/org/profile — salvează profilul și calculează applicability

import { NextResponse } from "next/server"

import {
  buildDocumentRequests,
  buildInitialFindings,
  buildNextBestAction,
  type FullIntakeAnswers,
  type IntakeAnswer,
} from "@/lib/compliance/intake-engine"
import type { OrgProfilePrefill } from "@/lib/compliance/org-profile-prefill"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { mutateState, readState } from "@/lib/server/mvp-store"
import { normalizeWebsiteUrl } from "@/lib/server/request-validation"
import {
  evaluateApplicability,
  type OrgProfile,
  type OrgSector,
  type OrgEmployeeCount,
} from "@/lib/compliance/applicability"
import { trackEvent } from "@/lib/server/analytics"

const VALID_SECTORS: OrgSector[] = [
  "energy", "transport", "banking", "health", "digital-infrastructure",
  "public-admin", "finance", "retail", "manufacturing", "professional-services", "other",
]

const VALID_EMPLOYEE_COUNTS: OrgEmployeeCount[] = ["1-9", "10-49", "50-249", "250+"]
const VALID_INTAKE_ANSWERS: IntakeAnswer[] = [
  "yes",
  "no",
  "probably",
  "unknown",
  "partial",
  "collaborators",
  "mixed",
]

type OrgProfileRequestBody = Partial<OrgProfile> & {
  intakeAnswers?: Partial<FullIntakeAnswers>
}

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const state = await readState()
    return NextResponse.json({
      orgProfile: state.orgProfile ?? null,
      applicability: state.applicability ?? null,
      intakeAnswers: state.intakeAnswers ?? null,
      orgProfilePrefill: state.orgProfilePrefill ?? null,
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

    const body = (await request.json()) as OrgProfileRequestBody

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

    // CUI: opțional, validare permisivă
    const cuiRaw = typeof body.cui === "string" ? body.cui.trim() : undefined
    const cui = cuiRaw && /^(RO)?\d{2,10}$/i.test(cuiRaw) ? cuiRaw.toUpperCase() : undefined
    const website = normalizeWebsiteUrl(body.website)

    const orgProfile: OrgProfile = {
      sector: body.sector,
      employeeCount: body.employeeCount,
      usesAITools: body.usesAITools,
      requiresEfactura: body.requiresEfactura,
      ...(cui ? { cui } : {}),
      ...(website ? { website } : {}),
      completedAtISO: new Date().toISOString(),
    }

    const applicability = evaluateApplicability(orgProfile)
    const intakeAnswers = normalizeIntakeAnswers(body.intakeAnswers)
    const initialFindings = intakeAnswers ? buildInitialFindings(intakeAnswers) : []
    const documentRequests = intakeAnswers ? buildDocumentRequests(intakeAnswers) : []
    const nextBestAction = intakeAnswers ? buildNextBestAction(initialFindings) : null
    const intakeCompletedAtISO = intakeAnswers ? new Date().toISOString() : undefined

    await mutateState((current) => {
      const previousFindings = (current.findings ?? []).filter((finding) => !finding.id.startsWith("intake-"))
      const currentPrefill = current.orgProfilePrefill as OrgProfilePrefill | undefined
      const matchingPrefill = doesPrefillMatchProfile(currentPrefill, cui, website)
        ? currentPrefill
        : undefined

      return {
        ...current,
        orgProfile,
        applicability,
        orgProfilePrefill: matchingPrefill,
        findings: intakeAnswers ? [...previousFindings, ...initialFindings] : previousFindings,
        intakeAnswers,
        intakeCompletedAtISO,
      }
    })

    void trackEvent(session.orgId, "completed_applicability", {
      sector: orgProfile.sector,
      employeeCount: orgProfile.employeeCount,
      ...(intakeAnswers
        ? {
            findingsCount: initialFindings.length,
            requiredDocs: documentRequests.filter((item) => item.priority === "required").length,
          }
        : {}),
    })

    return NextResponse.json({
      orgProfile,
      applicability,
      intakeAnswers,
      initialFindings,
      documentRequests,
      nextBestAction,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut salva profilul org.", 500, "ORG_PROFILE_SAVE_FAILED")
  }
}

function doesPrefillMatchProfile(
  prefill: OrgProfilePrefill | undefined,
  cui: string | undefined,
  website: string | null | undefined
) {
  if (!prefill) return false
  if (prefill.source === "ai_compliance_pack" && !prefill.normalizedCui && !prefill.normalizedWebsite) {
    return true
  }
  if (prefill.normalizedCui && prefill.normalizedCui !== cui) return false
  if (prefill.normalizedWebsite && prefill.normalizedWebsite !== website) return false
  return Boolean(prefill.normalizedCui || prefill.normalizedWebsite)
}

function normalizeIntakeAnswers(raw: Partial<FullIntakeAnswers> | undefined): FullIntakeAnswers | undefined {
  if (!raw || typeof raw !== "object") return undefined

  const normalized: Partial<FullIntakeAnswers> = {}

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== "string") continue
    const trimmed = value.trim()
    if (!trimmed) continue

    if (VALID_INTAKE_ANSWERS.includes(trimmed as IntakeAnswer)) {
      ;(normalized as Record<string, string | undefined>)[key] = trimmed
      continue
    }

    ;(normalized as Record<string, string | undefined>)[key] = trimmed
  }

  return Object.keys(normalized).length > 0 ? (normalized as FullIntakeAnswers) : undefined
}
