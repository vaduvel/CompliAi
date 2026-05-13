// Endpoint generare calendar fiscal auto pe baza profilului firmei.
//
// GET → preview reguli aplicabile + termene viitoare (fără persist).
// POST → genereze + persistă în state.filingRecords cu merge idempotent.
//
// IMPORTANT: NU inventăm date. Aplicăm regulile fiscale RO publice (CF,
// OUG-uri, Ordine ANAF) pe profilul concret al firmei. Sursele legale sunt
// citate în fiecare regulă.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import {
  generateFiscalCalendar,
  inferFiscalProfile,
  mergeAutoCalendarWithExisting,
} from "@/lib/compliance/fiscal-calendar-generator"
import {
  applicableRules,
  groupRulesByCategory,
  type FiscalOrgProfile,
} from "@/lib/compliance/fiscal-calendar-rules"
import type { ComplianceState } from "@/lib/compliance/types"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer", "viewer"] as const
const WRITE_ROLES = ["owner", "partner_manager", "compliance", "reviewer"] as const

type StateWithFiscal = ComplianceState & {
  filingRecords?: FilingRecord[]
}

export async function GET(request: Request) {
  try {
    const session = requireRole(request, [...READ_ROLES], "preview calendar fiscal")
    const state = (await readStateForOrg(session.orgId)) as StateWithFiscal | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")
    if (!state.orgProfile) {
      return jsonError(
        "Profilul organizației nu este configurat. Completează onboarding-ul mai întâi.",
        400,
        "NO_PROFILE",
      )
    }

    const url = new URL(request.url)
    const monthsAhead = clampMonths(url.searchParams.get("monthsAhead"))

    const profile = inferFiscalProfile(state.orgProfile as FiscalOrgProfile)
    const rules = applicableRules(profile)
    const groupedRules = groupRulesByCategory(rules)

    const generation = generateFiscalCalendar(profile, {
      monthsAhead,
      nowISO: new Date().toISOString(),
    })

    return NextResponse.json({
      ok: true,
      persisted: false,
      profile: {
        legalForm: profile.legalForm ?? "SRL",
        vatRegistered: profile.vatRegistered ?? false,
        hasEmployees: profile.hasEmployees ?? false,
        hasIntraCommunityTransactions: profile.hasIntraCommunityTransactions ?? false,
        isMicroenterprise: profile.isMicroenterprise ?? false,
        saftCategory: profile.saftCategory ?? "small",
      },
      applicableRules: rules.map((r) => ({
        code: r.code,
        shortName: r.shortName,
        category: r.category,
        legalReference: r.legalReference,
        description: r.description,
        frequency: r.frequencyFor(profile),
      })),
      groupedRules: Object.fromEntries(
        Object.entries(groupedRules).map(([cat, list]) => [
          cat,
          list.map((r) => ({
            code: r.code,
            shortName: r.shortName,
            frequency: r.frequencyFor(profile),
          })),
        ]),
      ),
      records: generation.records,
      situationalRules: generation.situationalRules.map((r) => ({
        code: r.code,
        shortName: r.shortName,
        description: r.description,
      })),
      summary: generation.summary,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare generare calendar.", 500, "CALENDAR_GENERATE_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "generare calendar fiscal")

    let body: {
      monthsAhead?: number
      overrides?: Partial<FiscalOrgProfile>
    } = {}
    try {
      body = (await request.json()) as typeof body
    } catch {
      // Empty body OK
    }

    const state = (await readStateForOrg(session.orgId)) as StateWithFiscal | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")
    if (!state.orgProfile) {
      return jsonError(
        "Profilul organizației nu este configurat. Completează onboarding-ul mai întâi.",
        400,
        "NO_PROFILE",
      )
    }

    const monthsAhead = clampMonths(body.monthsAhead ?? 12)
    const nowISO = new Date().toISOString()
    const profile = inferFiscalProfile(
      state.orgProfile as FiscalOrgProfile,
      body.overrides,
    )

    const generation = generateFiscalCalendar(profile, {
      monthsAhead,
      nowISO,
    })

    const existingFilings: FilingRecord[] = state.filingRecords ?? []
    const mergeResult = mergeAutoCalendarWithExisting(
      existingFilings,
      generation.records,
      nowISO,
    )

    const nextState: StateWithFiscal = {
      ...state,
      filingRecords: mergeResult.merged,
    }
    await writeStateForOrg(session.orgId, nextState, session.orgName)

    return NextResponse.json({
      ok: true,
      persisted: true,
      summary: {
        ...generation.summary,
        newCount: mergeResult.newCount,
        refreshedCount: mergeResult.refreshedCount,
        preservedManualCount: mergeResult.preservedManualCount,
        preservedFiledCount: mergeResult.preservedFiledCount,
      },
      records: mergeResult.merged.filter((r) => r.id.startsWith("auto-cal-")),
      situationalRules: generation.situationalRules.map((r) => ({
        code: r.code,
        shortName: r.shortName,
        description: r.description,
      })),
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare generare calendar.", 500, "CALENDAR_GENERATE_FAILED")
  }
}

function clampMonths(raw: number | string | null): number {
  const n = typeof raw === "number" ? raw : raw ? Number(raw) : 12
  if (!Number.isFinite(n) || n < 1) return 12
  if (n > 24) return 24
  return Math.floor(n)
}
