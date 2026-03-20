import { NextResponse } from "next/server"

import type { OrgProfilePrefill } from "@/lib/compliance/org-profile-prefill"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { lookupOrgProfilePrefillByCui } from "@/lib/server/anaf-company-lookup"
import { mutateState } from "@/lib/server/mvp-store"
import { validateCUI } from "@/lib/server/request-validation"

type PrefillRequestBody = {
  cui?: string
}

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as PrefillRequestBody
    const cui = validateCUI(body?.cui)
    if (!cui) return jsonError("CUI invalid.", 400, "INVALID_CUI")

    const prefill = await lookupOrgProfilePrefillByCui(cui)
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
