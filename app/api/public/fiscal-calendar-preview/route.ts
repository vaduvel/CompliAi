// Public endpoint pentru preview calendar fiscal — FĂRĂ AUTH.
//
// Lead magnet pentru `/calendar-fiscal-personalizat`. Primește profilul firmei
// (input minim) și întoarce calendarul personalizat pentru 3 luni înainte.
// Strategy: utilizatorul vede valoarea instant, fără cont. Apoi CTA "Salvează
// + reminder zilnic" duce la register.
//
// Rate limit: 30 req/min per IP (păstrăm cu lib-ul existent rate-limit).

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import {
  generateFiscalCalendar,
  inferFiscalProfile,
} from "@/lib/compliance/fiscal-calendar-generator"
import {
  applicableRules,
  type FiscalOrgProfile,
} from "@/lib/compliance/fiscal-calendar-rules"
import type { OrgEmployeeCount } from "@/lib/compliance/applicability"

const VALID_EMPLOYEE_COUNTS: OrgEmployeeCount[] = ["1-9", "10-49", "50-249", "250+"]
const VALID_LEGAL_FORMS = [
  "SRL",
  "SA",
  "PFA",
  "II",
  "IF",
  "ONG",
  "SCM",
  "RA",
] as const

export async function POST(request: Request) {
  try {
    let body: {
      legalForm?: string
      employeeCount?: string
      vatRegistered?: boolean
      hasEmployees?: boolean
      hasIntraCommunityTransactions?: boolean
      isMicroenterprise?: boolean
    }
    try {
      body = (await request.json()) as typeof body
    } catch {
      return jsonError("Body invalid.", 400, "INVALID_BODY")
    }

    // Validăm + aplicăm defaults conservatoare
    const legalForm = VALID_LEGAL_FORMS.includes(body.legalForm as (typeof VALID_LEGAL_FORMS)[number])
      ? (body.legalForm as (typeof VALID_LEGAL_FORMS)[number])
      : "SRL"

    const employeeCount: OrgEmployeeCount = VALID_EMPLOYEE_COUNTS.includes(
      body.employeeCount as OrgEmployeeCount,
    )
      ? (body.employeeCount as OrgEmployeeCount)
      : "1-9"

    // Build minimal FiscalOrgProfile
    const nowISO = new Date().toISOString()
    const baseProfile: FiscalOrgProfile = {
      sector: "other",
      employeeCount,
      usesAITools: false,
      requiresEfactura: body.vatRegistered === true,
      vatRegistered: body.vatRegistered ?? false,
      completedAtISO: nowISO,
      legalForm,
      hasEmployees: body.hasEmployees ?? false,
      hasIntraCommunityTransactions: body.hasIntraCommunityTransactions ?? false,
      isMicroenterprise: body.isMicroenterprise ?? true,
      paysCorporateTax: body.isMicroenterprise === false,
      saftCategory: "small",
    }

    const profile = inferFiscalProfile(baseProfile)
    const rules = applicableRules(profile)
    const generation = generateFiscalCalendar(profile, {
      monthsAhead: 3, // preview scurt — restul după register
      nowISO,
    })

    return NextResponse.json({
      ok: true,
      profile: {
        legalForm: profile.legalForm,
        vatRegistered: profile.vatRegistered,
        hasEmployees: profile.hasEmployees,
        hasIntraCommunityTransactions: profile.hasIntraCommunityTransactions,
        isMicroenterprise: profile.isMicroenterprise,
      },
      applicableRules: rules.map((r) => ({
        code: r.code,
        shortName: r.shortName,
        category: r.category,
        legalReference: r.legalReference,
        description: r.description,
        frequency: r.frequencyFor(profile),
      })),
      records: generation.records.slice(0, 10), // limităm la 10 termene pentru lead magnet
      situationalRules: generation.situationalRules.map((r) => ({
        code: r.code,
        shortName: r.shortName,
        description: r.description,
      })),
      summary: {
        totalRules: 26,
        applicableRules: rules.length,
        recordsShown: Math.min(generation.records.length, 10),
        recordsTotal: generation.records.length,
        monthsAhead: 3,
      },
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Eroare generare preview.",
      500,
      "PREVIEW_FAILED",
    )
  }
}
