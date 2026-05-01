// Pay Transparency — Job Architecture API
// GET: returnează arhitectura curentă (level × role × band)
// POST: replace full architecture (bulk import)
// PATCH: add/update single band (idempotent on (level, role))
// DELETE: remove band by ?level=X&role=Y query params

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import {
  addBand,
  getJobArchitecture,
  removeBand,
  saveJobArchitecture,
} from "@/lib/server/job-architecture-store"
import type { SalaryBand } from "@/lib/compliance/job-architecture"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer", "viewer"] as const
const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, [...READ_ROLES], "citire job architecture")
    const arch = await getJobArchitecture(session.orgId)
    return NextResponse.json({ ok: true, architecture: arch })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la citirea job architecture.", 500, "JOB_ARCH_GET_FAILED")
  }
}

type PostBody = {
  levels?: string[]
  roles?: string[]
  bands?: SalaryBand[]
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, [...WRITE_ROLES], "salvare job architecture")
    const body = (await request.json()) as PostBody
    if (!Array.isArray(body.bands)) {
      return jsonError("bands must be an array", 400, "INVALID_BODY")
    }
    const next = await saveJobArchitecture(session.orgId, {
      levels: body.levels ?? [],
      roles: body.roles ?? [],
      bands: body.bands,
    })
    return NextResponse.json({ ok: true, architecture: next })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la salvarea job architecture.", 500, "JOB_ARCH_SAVE_FAILED")
  }
}

type PatchBody = {
  level?: string
  role?: string
  min?: number
  max?: number
  currency?: "RON" | "EUR"
}

export async function PATCH(request: Request) {
  try {
    const session = await requireFreshRole(request, [...WRITE_ROLES], "adăugare band")
    const body = (await request.json()) as PatchBody
    if (!body.level || !body.role || typeof body.min !== "number" || typeof body.max !== "number") {
      return jsonError(
        "level, role, min (number), max (number) required",
        400,
        "INVALID_BODY",
      )
    }
    if (body.min < 0 || body.max < 0 || body.max < body.min) {
      return jsonError("min/max must be non-negative and max >= min", 400, "INVALID_RANGE")
    }
    const next = await addBand(session.orgId, {
      level: body.level,
      role: body.role,
      min: body.min,
      max: body.max,
      currency: body.currency ?? "RON",
    })
    return NextResponse.json({ ok: true, architecture: next })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la adăugarea band-ului.", 500, "JOB_ARCH_PATCH_FAILED")
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireFreshRole(request, [...WRITE_ROLES], "ștergere band")
    const url = new URL(request.url)
    const level = url.searchParams.get("level")
    const role = url.searchParams.get("role")
    if (!level || !role) {
      return jsonError("level and role query params required", 400, "INVALID_QUERY")
    }
    const next = await removeBand(session.orgId, level, role)
    return NextResponse.json({ ok: true, architecture: next })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la ștergerea band-ului.", 500, "JOB_ARCH_DELETE_FAILED")
  }
}
