// GET /api/anaf/lookup?cui=... — single CUI lookup, returns JSON always
// Fix #5: alias toward the ANAF company lookup used by import wizard

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { lookupOrgProfilePrefillByCui } from "@/lib/server/anaf-company-lookup"

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { searchParams } = new URL(request.url)
    const cui = searchParams.get("cui")?.trim()
    if (!cui) return jsonError("Parametrul 'cui' este obligatoriu.", 400, "MISSING_CUI")

    const prefill = await lookupOrgProfilePrefillByCui(cui)
    if (!prefill) return jsonError("CUI-ul nu a fost găsit în baza de date ANAF.", 404, "CUI_NOT_FOUND")

    return NextResponse.json({ cui, prefill })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la interogarea ANAF.", 500, "ANAF_LOOKUP_FAILED")
  }
}
