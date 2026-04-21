/**
 * Quick-add 1 client — Faza 5.1
 *
 * POST /api/partner/clients/quick-add
 * Body: { cui: string, website?: string }
 *
 * Single-shot flow: ANAF lookup → create org → profile + applicability → baseline scan.
 * Target: <30s from click to client visible in portfolio.
 *
 * Returns: { ok, orgId, orgName, cui, findingsCount, criticalCount, score, message }
 */
import { NextResponse } from "next/server"

import {
  evaluateApplicability,
  type OrgEmployeeCount,
  type OrgProfile,
  type OrgSector,
} from "@/lib/compliance/applicability"
import {
  buildInitialFindings,
  buildInitialIntakeAnswers,
} from "@/lib/compliance/intake-engine"
import type { FullIntakeAnswers } from "@/lib/compliance/intake-engine"
import { buildNis2Findings, readNis2State } from "@/lib/server/nis2-store"
import { lookupOrgProfilePrefillByCui } from "@/lib/server/anaf-company-lookup"
import { buildWebsitePrefillSignals } from "@/lib/server/website-prefill-signals"
import { normalizeWebsiteUrl } from "@/lib/server/request-validation"
import { jsonError } from "@/lib/server/api-response"
import {
  AuthzError,
  createOrganizationForExistingUser,
  listUserMemberships,
  requireFreshRole,
  resolveUserMode,
} from "@/lib/server/auth"
import { getPartnerAccountPlanStatus, hasLegacyPartnerOrgPlan } from "@/lib/server/plan"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"

type QuickAddBody = {
  cui?: string
  website?: string
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager"], "quick-add client")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("Quick-add disponibil doar în modul partner.", 403, "PORTFOLIO_FORBIDDEN")
    }

    const body = (await request.json()) as QuickAddBody
    const cui = body.cui?.trim()
    if (!cui) return jsonError("CUI obligatoriu.", 400, "MISSING_CUI")

    const websiteUrl = body.website ? normalizeWebsiteUrl(body.website) : null

    // Plan capacity check
    const activeMemberships = (await listUserMemberships(session.userId)).filter(
      (m) => m.status === "active" && m.role === "partner_manager"
    )
    const activeOrgIds = Array.from(new Set(activeMemberships.map((m) => m.orgId)))
    const planStatus = await getPartnerAccountPlanStatus({
      userId: session.userId,
      currentOrgs: activeOrgIds.length,
      legacyPartnerEnabled: await hasLegacyPartnerOrgPlan(activeOrgIds),
    })
    const remaining = Math.max((planStatus.maxOrgs ?? 0) - planStatus.currentOrgs, 0)
    if (remaining <= 0) {
      throw new AuthzError(
        `Ai atins limita planului (${planStatus.maxOrgs} firme). Upgrade din Setări cont.`,
        403,
        "PARTNER_PLAN_LIMIT_REACHED"
      )
    }

    // Phase 1 — ANAF lookup
    const prefill = await lookupOrgProfilePrefillByCui(cui).catch(() => null)
    if (!prefill) {
      return jsonError(
        "CUI invalid sau firmă inactivă în ANAF. Verifică și încearcă din nou.",
        400,
        "ANAF_NOT_FOUND"
      )
    }

    // Phase 2 — Create org
    const orgName = prefill.companyName || `Firmă ${cui}`
    const newOrg = await createOrganizationForExistingUser(
      session.userId,
      orgName,
      "partner_manager"
    )

    // Phase 3 — Build profile + applicability
    const sectorSuggestion = prefill.suggestions?.sector
    const sector: OrgSector =
      (sectorSuggestion?.value as OrgSector | undefined) ?? "professional-services"
    const employeeCount: OrgEmployeeCount = "10-49"
    const profile: OrgProfile = {
      sector,
      employeeCount,
      usesAITools: false,
      requiresEfactura: Boolean(prefill.suggestions?.requiresEfactura?.value),
      completedAtISO: new Date().toISOString(),
      cui: prefill.normalizedCui ?? undefined,
      ...(websiteUrl ? { website: websiteUrl } : {}),
    }
    const applicability = evaluateApplicability(profile)

    // Phase 4 — Load freshly-provisioned state + enrich with ANAF prefill
    const state = await readStateForOrg(newOrg.orgId)
    if (!state) {
      return jsonError("Stare organizație inaccesibilă.", 500, "STATE_NOT_READY")
    }
    state.orgProfile = profile
    state.applicability = applicability
    state.orgProfilePrefill = prefill

    // Phase 5 — Website signals (inline, best-effort)
    let websiteSuggestions: Awaited<
      ReturnType<typeof buildWebsitePrefillSignals>
    >["suggestions"] = {}
    if (websiteUrl) {
      try {
        const signals = await buildWebsitePrefillSignals(websiteUrl)
        websiteSuggestions = signals.suggestions
        if (signals.websiteSignals) {
          state.orgProfilePrefill = {
            ...state.orgProfilePrefill,
            normalizedWebsite: websiteUrl,
            websiteSignals: signals.websiteSignals,
          }
        }
      } catch (err) {
        console.warn("[quick-add] website signals failed:", (err as Error).message)
      }
    }

    // Phase 6 — Conservative intake answers (reuse baseline-scan logic)
    const hasEmployees = profile.employeeCount !== "1-9"
    const hasWebsite = Boolean(websiteUrl)
    const sigYes = (key: keyof typeof websiteSuggestions): "yes" | undefined =>
      websiteSuggestions[key]?.value === true ? "yes" : undefined

    const conservativeAnswers: FullIntakeAnswers = {
      sellsToConsumers: "unknown",
      hasEmployees: hasEmployees ? "yes" : "unknown",
      processesPersonalData: sigYes("processesPersonalData") ?? "probably",
      usesAITools: profile.usesAITools ? "yes" : "no",
      usesExternalVendors: "probably",
      hasSiteWithForms: sigYes("hasSiteWithForms") ?? (hasWebsite ? "probably" : "unknown"),
      hasStandardContracts: "probably",
      hasJobDescriptions: hasEmployees ? "no" : undefined,
      hasEmployeeRegistry: hasEmployees ? "no" : undefined,
      hasInternalProcedures: hasEmployees ? "no" : undefined,
      hasPrivacyPolicy: sigYes("hasPrivacyPolicy") ?? "no",
      hasDsarProcess: "no",
      hasRopaRegistry: "no",
      hasVendorDpas: "no",
      hasRetentionSchedule: "no",
      hasAiPolicy: profile.usesAITools ? "no" : undefined,
      hasVendorDocumentation: "no",
      vendorsSendPersonalData: "probably",
      hasSitePrivacyPolicy: sigYes("hasSitePrivacyPolicy") ?? (hasWebsite ? "no" : undefined),
      hasCookiesConsent: sigYes("hasCookiesConsent") ?? (hasWebsite ? "no" : undefined),
    }

    const prefillAnswers = buildInitialIntakeAnswers(profile, prefill)
    const mergedAnswers: FullIntakeAnswers = { ...prefillAnswers, ...conservativeAnswers }

    // Phase 7 — NIS2 + baseline findings
    const nis2State = await readNis2State(newOrg.orgId)
    const nis2Findings = buildNis2Findings(nis2State, new Date().toISOString())
    const findings = buildInitialFindings(mergedAnswers, { supplementalFindings: nis2Findings })

    state.findings = findings
    state.intakeAnswers = mergedAnswers

    await writeStateForOrg(newOrg.orgId, state)

    // Score heuristic: % findings not critical
    const total = findings.length || 1
    const critical = findings.filter((f) => f.severity === "critical").length
    const score = Math.max(0, Math.min(100, Math.round(((total - critical) / total) * 100)))

    return NextResponse.json({
      ok: true,
      orgId: newOrg.orgId,
      orgName: newOrg.orgName,
      cui: prefill.normalizedCui,
      vatRegistered: prefill.vatRegistered,
      efacturaRegistered: prefill.efacturaRegistered,
      sector,
      findingsCount: findings.length,
      criticalCount: critical,
      score,
      tags: applicability.tags,
      message: `Firma ${orgName} adăugată cu ${findings.length} findings.`,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    console.error("[quick-add] failed", error)
    return jsonError(
      error instanceof Error ? error.message : "Eroare la quick-add.",
      500,
      "QUICK_ADD_FAILED"
    )
  }
}
