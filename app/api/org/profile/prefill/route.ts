import { NextResponse } from "next/server"

import type { OrgProfilePrefill } from "@/lib/compliance/org-profile-prefill"
import { jsonError } from "@/lib/server/api-response"
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
    const cui = validateCUI(body?.cui)
    const website = normalizeWebsiteUrl(body?.website)
    if (!cui && !website) {
      return hasCuiInput
        ? jsonError("CUI invalid.", 400, "INVALID_CUI")
        : jsonError("Introdu un CUI valid sau website-ul public al firmei.", 400, "INVALID_PREFILL_INPUT")
    }

    const state = await readState()
    const basePrefill = cui ? await lookupOrgProfilePrefillByCui(cui) : null
    const websitePrefill = await enrichOrgProfilePrefillWithWebsiteSignals(basePrefill, { website })
    const vendorPrefill = enrichOrgProfilePrefillWithVendorSignals(websitePrefill, state.efacturaValidations)
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
    return jsonError("Nu am putut interoga ANAF acum.", 502, "ANAF_PREFILL_FAILED")
  }
}
