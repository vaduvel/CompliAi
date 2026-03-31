/**
 * Baseline Scan — runs ANAF lookup + intake findings for one imported org.
 * Called sequentially by the import wizard after org creation.
 *
 * POST /api/partner/import/baseline-scan
 * Body: { orgId: string, cui?: string | null }
 * Returns: { ok, findingsCount, sector?, companyName? }
 */
import { NextResponse } from "next/server"

import { evaluateApplicability } from "@/lib/compliance/applicability"
import type { OrgProfile } from "@/lib/compliance/applicability"
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

    // Phase B: Generate initial findings from intake engine
    if (updatedProfile) {
      const intakeAnswers = buildInitialIntakeAnswers(updatedProfile, prefill)
      const findings = buildInitialFindings(intakeAnswers)

      console.log("[baseline-scan] Generated findings:", findings.length, "for org:", body.orgId)
      console.log("[baseline-scan] Profile:", JSON.stringify(updatedProfile))
      console.log("[baseline-scan] Intake answers:", JSON.stringify(intakeAnswers).slice(0, 500))

      if (findings.length > 0) {
        // Merge findings — don't duplicate if already exist
        const existingIds = new Set(state.findings.map((f) => f.id))
        const newFindings = findings.filter((f) => !existingIds.has(f.id))
        console.log("[baseline-scan] New findings (no duplicates):", newFindings.length)
        state.findings = [...state.findings, ...newFindings]
      }
    } else {
      console.log("[baseline-scan] No updatedProfile, skipping findings generation")
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
