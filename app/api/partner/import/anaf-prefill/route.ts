/**
 * GOLD 1 — ANAF batch prefill: lookup multiple CUIs at once.
 * Rate-limited to 1 batch per second (ANAF fair-use).
 * Returns prefill data per CUI for the import wizard progress view.
 */
import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { lookupOrgProfilePrefillByCui } from "@/lib/server/anaf-company-lookup"
import { AuthzError, requireFreshRole, resolveUserMode } from "@/lib/server/auth"
import type { OrgProfilePrefill } from "@/lib/compliance/org-profile-prefill"

type PrefillResult = {
  cui: string
  status: "ok" | "not_found" | "error"
  prefill: OrgProfilePrefill | null
  error?: string
}

// Simple rate limiter: 1 ANAF call per second
let lastCallMs = 0

async function rateLimitedLookup(cui: string): Promise<PrefillResult> {
  const now = Date.now()
  const elapsed = now - lastCallMs
  if (elapsed < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed))
  }
  lastCallMs = Date.now()

  try {
    const prefill = await lookupOrgProfilePrefillByCui(cui)
    if (!prefill) {
      return { cui, status: "not_found", prefill: null }
    }
    return { cui, status: "ok", prefill }
  } catch (err) {
    return {
      cui,
      status: "error",
      prefill: null,
      error: err instanceof Error ? err.message : "Eroare ANAF",
    }
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager"], "ANAF batch prefill")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("Prefill disponibil doar în modul partner.", 403, "PORTFOLIO_FORBIDDEN")
    }

    const body = (await request.json()) as { cuis: string[] }
    if (!body.cuis?.length) {
      return jsonError("Lista de CUI-uri lipsă.", 400, "NO_CUIS")
    }
    if (body.cuis.length > 50) {
      return jsonError("Maximum 50 de CUI-uri per cerere.", 400, "TOO_MANY_CUIS")
    }

    // Deduplicate and normalize
    const uniqueCuis = Array.from(new Set(
      body.cuis.map((c) => c.trim().toUpperCase().replace(/\s/g, "")).filter(Boolean)
    ))

    const results: PrefillResult[] = []
    for (const cui of uniqueCuis) {
      const result = await rateLimitedLookup(cui)
      results.push(result)
    }

    const found = results.filter((r) => r.status === "ok").length
    const notFound = results.filter((r) => r.status === "not_found").length

    return NextResponse.json({
      results,
      summary: {
        total: uniqueCuis.length,
        found,
        notFound,
        errors: results.filter((r) => r.status === "error").length,
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la ANAF batch prefill.", 500, "ANAF_PREFILL_FAILED")
  }
}
