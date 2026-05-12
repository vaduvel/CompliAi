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
import type { FullIntakeAnswers } from "@/lib/compliance/intake-engine"
import type { ScanRecord } from "@/lib/compliance/types"
import {
  buildInitialFindings,
  buildInitialIntakeAnswers,
} from "@/lib/compliance/intake-engine"
import { buildNis2Findings, readNis2State } from "@/lib/server/nis2-store"
import { lookupOrgProfilePrefillByCui } from "@/lib/server/anaf-company-lookup"
import { buildWebsitePrefillSignals } from "@/lib/server/website-prefill-signals"
import { buildRomanianPrivacyFindings } from "@/lib/compliance/romanian-privacy-findings"
import { buildImportBaselineAnswers } from "@/lib/compliance/import-baseline-profile"
import { normalizeWebsiteUrl } from "@/lib/server/request-validation"
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

    // Faza 3.5g fix (2026-05-12): scope baseline findings by cabinet ICP.
    // Pentru cabinet-fiscal, SKIP findings DPO/GDPR/NIS2 — Mircea nu vrea zgomot
    // non-fiscal pe clienții lui. Findings fiscal vin din Faza 2 scan orchestrator
    // care apelează ANAF SPV real per CUI.
    const cabinetIcpSegment = request.headers.get("x-compliscan-icp-segment")
    const isCabinetFiscal = cabinetIcpSegment === "cabinet-fiscal"
    if (isCabinetFiscal) {
      console.log("[baseline-scan] Cabinet-fiscal detected — skipping DPO/GDPR/NIS2 findings.")
    }

    let prefill = state.orgProfilePrefill ?? null
    let updatedProfile = state.orgProfile
    const nowISO = new Date().toISOString()

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

    // Phase A.5: Website signals scrape (NEW — Faza 2 engine fix)
    // Replaces pessimistic guesses with real evidence from client's public site.
    // If site has privacy policy / cookie banner / forms, we DON'T generate
    // findings claiming those are missing.
    let websiteSuggestions: Awaited<ReturnType<typeof buildWebsitePrefillSignals>>["suggestions"] = {}
    const websiteUrl = normalizeWebsiteUrl(updatedProfile?.website || body.website)
    if (websiteUrl) {
      try {
        const signals = await buildWebsitePrefillSignals(websiteUrl)
        websiteSuggestions = signals.suggestions
        if (signals.websiteSignals && state.orgProfilePrefill) {
          state.orgProfilePrefill = {
            ...state.orgProfilePrefill,
            normalizedWebsite: websiteUrl,
            websiteSignals: signals.websiteSignals,
          }
        }
        console.log(
          "[baseline-scan] Website signals:",
          Object.keys(websiteSuggestions).length,
          "suggestions for",
          websiteUrl
        )
      } catch (err) {
        console.warn("[baseline-scan] Website scan failed, continuing:", (err as Error).message)
      }
    }

    // Phase B: Generate findings — pessimistic baseline OVERRIDDEN by real signals.
    // Where website scrape detected real compliance evidence (privacy policy, cookies,
    // forms), we mark that as "yes" instead of pessimistic "no". Where ANAF lookup
    // confirmed e-Factura registration, we skip e-Factura missing findings.
    // Partner verifies/dismisses what remains in cockpit.
    if (updatedProfile) {
      const hasWebsite = !!websiteUrl
      const efacturaActive = prefill?.efacturaRegistered === true

      const conservativeAnswers: FullIntakeAnswers = buildImportBaselineAnswers(updatedProfile, {
        hasWebsite,
        websiteSignals: {
          processesPersonalData: websiteSuggestions.processesPersonalData?.value === true,
          hasSiteWithForms: websiteSuggestions.hasSiteWithForms?.value === true,
          hasPrivacyPolicy: websiteSuggestions.hasPrivacyPolicy?.value === true,
          hasSitePrivacyPolicy: websiteSuggestions.hasSitePrivacyPolicy?.value === true,
          hasCookiesConsent: websiteSuggestions.hasCookiesConsent?.value === true,
        },
      })

      // Also generate from prefill-aware engine for any ANAF-enriched suggestions
      const prefillAnswers = buildInitialIntakeAnswers(updatedProfile, prefill)

      // Merge: conservative answers take precedence — but they now include real signals
      const mergedAnswers = { ...prefillAnswers, ...conservativeAnswers }
      state.intakeAnswers = mergedAnswers
      state.intakeCompletedAtISO = nowISO
      console.log("[baseline-scan] efacturaActive (from ANAF):", efacturaActive)

      // Faza 3.5g fix: pentru cabinet-fiscal SKIP findings DPO/GDPR/NIS2/privacy.
      // Mircea (contabil CECCAR) NU vrea zgomot non-fiscal pe clienții lui.
      // Findings fiscal vin separat din /api/portfolio/fiscal-scan (Faza 2) care
      // apelează ANAF SPV real per CUI.
      let findings: typeof state.findings = []
      let romanianPrivacyFindings: typeof state.findings = []

      if (!isCabinetFiscal) {
        const nis2State = await readNis2State(body.orgId)
        const nis2Findings = buildNis2Findings(nis2State, new Date().toISOString())
        romanianPrivacyFindings = buildRomanianPrivacyFindings(updatedProfile, nowISO)
        findings = buildInitialFindings(mergedAnswers, {
          supplementalFindings: [...nis2Findings, ...romanianPrivacyFindings],
        })
      }

      console.log(
        "[baseline-scan] Generated findings:",
        findings.length,
        "for org:",
        body.orgId,
        "(cabinet-fiscal scoping:",
        isCabinetFiscal,
        ")",
      )

      if (findings.length > 0) {
        // Merge findings — don't duplicate if already exist
        const existingIds = new Set(state.findings.map((f) => f.id))
        const newFindings = findings.filter((f) => !existingIds.has(f.id))
        state.findings = [...state.findings, ...newFindings]
      }

      if (
        !isCabinetFiscal &&
        romanianPrivacyFindings.some((finding) => finding.id === "intake-gdpr-training-tracker")
      ) {
        const hasDefaultTraining = (state.gdprTrainingRecords ?? []).some(
          (record) => record.id === "gdpr-training-baseline-required"
        )
        if (!hasDefaultTraining) {
          const due = new Date(nowISO)
          due.setDate(due.getDate() + 30)
          state.gdprTrainingRecords = [
            {
              id: "gdpr-training-baseline-required",
              title: "Training GDPR inițial pentru angajați",
              audience: "all_staff",
              participantCount: 0,
              status: "evidence_required",
              dueAtISO: due.toISOString(),
              evidenceNote:
                "Creat automat la baseline pentru că organizația are angajați. Consultantul DPO completează participanții și atașează dovada comunicării.",
              createdAtISO: nowISO,
              updatedAtISO: nowISO,
            },
            ...(state.gdprTrainingRecords ?? []),
          ]
        }
      }
    }

    const baselineScan: ScanRecord = {
      id: `baseline-import-${body.orgId}-${Date.now()}`,
      documentName: "Baseline import portofoliu",
      contentPreview:
        "Scan automat rulat după importul firmei în portofoliu: ANAF, profil organizație, website și intake GDPR.",
      createdAtISO: nowISO,
      analyzedAtISO: nowISO,
      findingsCount: state.findings.length,
      sourceKind: "manifest",
      extractionMethod: "manual",
      extractionStatus: "completed",
      analysisStatus: "completed",
    }
    state.scans = [baselineScan, ...(state.scans ?? [])].slice(0, 100)

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
