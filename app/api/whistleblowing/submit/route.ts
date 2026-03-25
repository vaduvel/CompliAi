// POST /api/whistleblowing/submit — public endpoint, no auth required
// Allows anonymous/named submissions via public token

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadOrganizations } from "@/lib/server/auth"
import { resolveOrgByToken, createReport } from "@/lib/server/whistleblowing-store"
import type { WhistleblowingCategory } from "@/lib/server/whistleblowing-store"

const VALID_CATEGORIES: WhistleblowingCategory[] = [
  "fraud", "corruption", "safety", "privacy", "harassment", "financial", "other",
]

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      token?: string
      category?: WhistleblowingCategory
      description?: string
      anonymous?: boolean
      contactInfo?: string
    }

    if (!body.token?.trim()) return jsonError("Token lipsă.", 400, "MISSING_TOKEN")
    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      return jsonError("Categorie invalidă.", 400, "INVALID_CATEGORY")
    }
    if (!body.description?.trim() || body.description.trim().length < 20) {
      return jsonError("Descrierea trebuie să aibă cel puțin 20 caractere.", 400, "MISSING_DESCRIPTION")
    }

    const orgs = await loadOrganizations()
    const orgId = await resolveOrgByToken(body.token, orgs.map((o) => o.id))
    if (!orgId) return jsonError("Token invalid sau organizație inexistentă.", 404, "INVALID_TOKEN")

    const report = await createReport(orgId, {
      category: body.category,
      description: body.description.trim(),
      anonymous: body.anonymous ?? true,
      contactInfo: body.contactInfo?.trim(),
    })

    return NextResponse.json({
      ok: true,
      reportId: report.id,
      message: "Sesizarea a fost înregistrată. Vei primi un răspuns în termen de 3 luni.",
    }, { status: 201 })
  } catch {
    return jsonError("Nu am putut înregistra sesizarea.", 500, "WB_SUBMIT_FAILED")
  }
}
