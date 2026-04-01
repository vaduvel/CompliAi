/**
 * Baseline Scan — runs ANAF lookup + intake findings for one imported org.
 * Called sequentially by the import wizard after org creation.
 *
 * POST /api/partner/import/baseline-scan
 * Body: { orgId: string, cui?: string | null, website?: string | null }
 * Returns: { ok, findingsCount, sector?, companyName? }
 */
import { NextResponse } from "next/server"

import { evaluateApplicability } from "@/lib/compliance/applicability"
import type { OrgProfile } from "@/lib/compliance/applicability"
import type { FullIntakeAnswers } from "@/lib/compliance/intake-engine"
import {
  buildInitialFindings,
  buildInitialIntakeAnswers,
} from "@/lib/compliance/intake-engine"
import { lookupOrgProfilePrefillByCui } from "@/lib/server/anaf-company-lookup"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, resolveUserMode } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { getConfiguredDataBackend } from "@/lib/server/supabase-tenancy"
import { hasSupabaseConfig } from "@/lib/server/supabase-rest"
import { shouldUseSupabaseOrgStateAsPrimary } from "@/lib/server/supabase-org-state"
import { isLocalFallbackAllowedForCloudPrimary } from "@/lib/server/cloud-fallback-policy"

type BaselineScanBody = {
  orgId: string
  cui?: string | null
  website?: string | null
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager"], "baseline-scan")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("Baseline scan disponibil doar în modul partner.", 403, "PORTFOLIO_FORBIDDEN")
    }

    // Debug: log Supabase configuration
    const dataBackend = getConfiguredDataBackend()
    const supabaseConfig = hasSupabaseConfig()
    const supabasePrimary = shouldUseSupabaseOrgStateAsPrimary()
    const localFallback = isLocalFallbackAllowedForCloudPrimary()
    console.log("[baseline-scan] Config:", {
      dataBackend,
      supabaseConfig,
      supabasePrimary,
      localFallback,
      nodeEnv: process.env.NODE_ENV
    })

    const body = (await request.json()) as BaselineScanBody
    if (!body.orgId) {
      return jsonError("orgId lipsă.", 400, "MISSING_ORG_ID")
    }

    const state = await readStateForOrg(body.orgId)
    console.log("[baseline-scan] Loaded state for", body.orgId, "exists:", !!state)
    if (!state) {
      return jsonError("Organizația nu a fost găsită.", 404, "ORG_NOT_FOUND")
    }
    console.log("[baseline-scan] Initial findings count:", state.findings?.length ?? 0)

    let prefill = state.orgProfilePrefill ?? null
    let updatedProfile = state.orgProfile

    // Store website in profile if provided and not already set
    if (body.website && updatedProfile && !updatedProfile.website) {
      updatedProfile = { ...updatedProfile, website: body.website }
      state.orgProfile = updatedProfile
    }

    // Phase A: ANAF lookup if CUI provided
    if (body.cui) {
      try {
        const anafPrefill = await lookupOrgProfilePrefillByCui(body.cui)
        if (anafPrefill) {
          prefill = anafPrefill
          state.orgProfilePrefill = anafPrefill

          // Update org profile with better ANAF data
          if (updatedProfile) {
            const anafSector = anafPrefill.suggestions?.sector
            if (anafSector && anafSector.confidence === "high") {
              updatedProfile = { ...updatedProfile, sector: anafSector.value }
            }
            if (anafPrefill.normalizedCui) {
              updatedProfile = { ...updatedProfile, cui: anafPrefill.normalizedCui }
            }
            state.orgProfile = updatedProfile

            // Re-run applicability with better sector
            state.applicability = evaluateApplicability(updatedProfile)
          }
        }
      } catch {
        // ANAF lookup failed — continue without it
      }
    }

    // Phase B: Generate findings — use conservative assumptions for partner import
    // For imported firms, assume worst-case: every company needs compliance review.
    // The partner will then verify/dismiss each finding with the client.
    if (updatedProfile) {
      const hasWebsite = !!(updatedProfile.website || body.website)
      const hasEmployees = updatedProfile.employeeCount !== "1-9"

      // Build aggressive intake answers: assume "no" for all compliance artifacts
      // so that findings are generated for everything that needs checking.
      const conservativeAnswers: FullIntakeAnswers = {
        // Core questions — assume positive (company does these things)
        sellsToConsumers: "unknown",
        hasEmployees: hasEmployees ? "yes" : "unknown",
        processesPersonalData: "probably",
        usesAITools: updatedProfile.usesAITools ? "yes" : "no",
        usesExternalVendors: "probably",
        hasSiteWithForms: hasWebsite ? "probably" : "unknown",
        hasStandardContracts: "probably",
        // Conditional answers — assume "no" / missing (generates findings)
        hasJobDescriptions: hasEmployees ? "no" : undefined,
        hasEmployeeRegistry: hasEmployees ? "no" : undefined,
        hasInternalProcedures: hasEmployees ? "no" : undefined,
        hasPrivacyPolicy: "no",
        hasDsarProcess: "no",
        hasRopaRegistry: "no",
        hasVendorDpas: "no",
        hasRetentionSchedule: "no",
        hasAiPolicy: updatedProfile.usesAITools ? "no" : undefined,
        hasVendorDocumentation: "no",
        vendorsSendPersonalData: "probably",
        hasSitePrivacyPolicy: hasWebsite ? "no" : undefined,
        hasCookiesConsent: hasWebsite ? "no" : undefined,
      }

      // Also generate from prefill-aware engine for any ANAF-enriched suggestions
      const prefillAnswers = buildInitialIntakeAnswers(updatedProfile, prefill)

      // Merge: conservative answers take precedence (more findings)
      const mergedAnswers = { ...prefillAnswers, ...conservativeAnswers }
      const findings = buildInitialFindings(mergedAnswers)

      console.log("[baseline-scan] Generated findings:", findings.length, "for org:", body.orgId)

      if (findings.length > 0) {
        // Merge findings — don't duplicate if already exist
        const existingIds = new Set(state.findings.map((f) => f.id))
        const newFindings = findings.filter((f) => !existingIds.has(f.id))
        state.findings = [...state.findings, ...newFindings]
      }
    }

    await writeStateForOrg(body.orgId, state)

    console.log("[baseline-scan] State saved successfully. Findings count:", state.findings.length)

    return NextResponse.json({
      ok: true,
      findingsCount: state.findings.length,
      sector: updatedProfile?.sector ?? null,
      companyName: prefill?.companyName ?? null,
    })
  } catch (error) {
    console.error("[baseline-scan] Error:", error)
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la baseline scan.", 500, "BASELINE_SCAN_FAILED")
  }
}
