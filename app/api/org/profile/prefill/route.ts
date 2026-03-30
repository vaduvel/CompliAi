import { NextResponse } from "next/server"

import type { OrgProfilePrefill } from "@/lib/compliance/org-profile-prefill"
import { jsonError } from "@/lib/server/api-response"
import { enrichOrgProfilePrefillWithAICompliancePack } from "@/lib/server/ai-compliance-pack-prefill-signals"
import { enrichOrgProfilePrefillWithAiSignals } from "@/lib/server/ai-prefill-signals"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { lookupOrgProfilePrefillByCui } from "@/lib/server/anaf-company-lookup"
import { enrichOrgProfilePrefillWithDocumentSignals } from "@/lib/server/document-prefill-signals"
import { enrichOrgProfilePrefillWithVendorSignals } from "@/lib/server/efactura-vendor-signals"
import { mutateState, readState } from "@/lib/server/mvp-store"
import { normalizeWebsiteUrl, validateCUI } from "@/lib/server/request-validation"
import { enrichOrgProfilePrefillWithWebsiteSignals } from "@/lib/server/website-prefill-signals"

type PrefillRequestBody = {
  cui?: string
  website?: string
}

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as PrefillRequestBody
    const hasCuiInput = typeof body?.cui === "string" && body.cui.trim().length > 0
    const hasWebsiteInput = typeof body?.website === "string" && body.website.trim().length > 0
    const cui = validateCUI(body?.cui)
    const website = normalizeWebsiteUrl(body?.website)
    if (!cui && !website && (hasCuiInput || hasWebsiteInput)) {
      return hasCuiInput && !hasWebsiteInput
        ? jsonError("CUI invalid.", 400, "INVALID_CUI")
        : jsonError("Introdu un CUI valid sau website-ul public al firmei.", 400, "INVALID_PREFILL_INPUT")
    }

    const state = await readState()
    // Run ANAF lookup and website crawl in parallel — they're independent.
    const [cuiPrefill, websiteOnlyPrefill] = await Promise.all([
      cui ? lookupOrgProfilePrefillByCui(cui) : Promise.resolve(null),
      enrichOrgProfilePrefillWithWebsiteSignals(null, { website }),
    ])
    // Merge: CUI data takes precedence; website signals are preserved from the website result.
    const websitePrefill: OrgProfilePrefill | null =
      cuiPrefill && websiteOnlyPrefill
        ? {
            ...websiteOnlyPrefill,
            ...cuiPrefill,
            normalizedWebsite: websiteOnlyPrefill.normalizedWebsite,
            websiteSignals: websiteOnlyPrefill.websiteSignals,
            suggestions: {
              ...websiteOnlyPrefill.suggestions,
              ...cuiPrefill.suggestions,
              hasSiteWithForms:
                cuiPrefill.suggestions.hasSiteWithForms ?? websiteOnlyPrefill.suggestions.hasSiteWithForms,
              processesPersonalData:
                cuiPrefill.suggestions.processesPersonalData ??
                websiteOnlyPrefill.suggestions.processesPersonalData,
              hasPrivacyPolicy:
                cuiPrefill.suggestions.hasPrivacyPolicy ?? websiteOnlyPrefill.suggestions.hasPrivacyPolicy,
              hasSitePrivacyPolicy:
                cuiPrefill.suggestions.hasSitePrivacyPolicy ??
                websiteOnlyPrefill.suggestions.hasSitePrivacyPolicy,
              hasCookiesConsent:
                cuiPrefill.suggestions.hasCookiesConsent ?? websiteOnlyPrefill.suggestions.hasCookiesConsent,
            },
          }
        : websiteOnlyPrefill ?? cuiPrefill
    const packPrefill = await enrichOrgProfilePrefillWithAICompliancePack(websitePrefill, state)
    const vendorPrefill = enrichOrgProfilePrefillWithVendorSignals(packPrefill, state.efacturaValidations)
    const aiPrefill = enrichOrgProfilePrefillWithAiSignals(vendorPrefill, {
      aiSystems: state.aiSystems ?? [],
      detectedAISystems: state.detectedAISystems ?? [],
    })
    const prefill = enrichOrgProfilePrefillWithDocumentSignals(aiPrefill, {
      generatedDocuments: state.generatedDocuments ?? [],
      scans: state.scans ?? [],
    })
    await mutateState((current) => ({
      ...current,
      orgProfilePrefill: prefill ?? undefined,
    }))

    return NextResponse.json({
      prefill: prefill ?? null,
    } satisfies { prefill: OrgProfilePrefill | null })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut pregăti prefill-ul automat acum.", 502, "PREFILL_FAILED")
  }
}
