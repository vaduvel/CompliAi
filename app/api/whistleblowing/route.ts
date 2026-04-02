// GET  /api/whistleblowing  → list reports (authenticated)
// POST /api/whistleblowing  → create report (authenticated — pentru admin)

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { readWhistleblowingState, createReport } from "@/lib/server/whistleblowing-store"
import { WRITE_ROLES } from "@/lib/server/rbac"
import type { WhistleblowingCategory } from "@/lib/server/whistleblowing-store"

const VALID_CATEGORIES: WhistleblowingCategory[] = [
  "fraud", "corruption", "safety", "privacy", "harassment", "financial", "other",
]

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "vizualizarea sesizărilor")
    const state = await readWhistleblowingState(session.orgId)
    return NextResponse.json({ reports: state.reports, publicToken: state.publicToken })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca sesizările.", 500, "WB_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "crearea unei sesizări")
    const body = await request.json() as {
      category?: WhistleblowingCategory
      description?: string
      anonymous?: boolean
      contactInfo?: string
    }
    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      return jsonError("Categorie invalidă.", 400, "INVALID_CATEGORY")
    }
    if (!body.description?.trim() || body.description.trim().length < 20) {
      return jsonError("Descrierea trebuie să aibă cel puțin 20 caractere.", 400, "MISSING_DESCRIPTION")
    }
    const report = await createReport(session.orgId, {
      category: body.category,
      description: body.description.trim(),
      anonymous: body.anonymous ?? true,
      contactInfo: body.contactInfo?.trim(),
    })
    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut crea sesizarea.", 500, "WB_CREATE_FAILED")
  }
}
