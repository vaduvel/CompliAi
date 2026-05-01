// Pay Transparency — Anti-confidentiality contract checker endpoint
// POST /api/contracts/check-confidentiality
// Body: { text: string } — text contract de scanat
// Response: { findings, severity, directiveCompliant }

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { checkContractConfidentiality } from "@/lib/compliance/contract-confidentiality-checker"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer"] as const

type Body = {
  text?: string
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, [...READ_ROLES], "scan contract confidențialitate")
    const body = (await request.json()) as Body
    const text = (body.text ?? "").trim()
    if (!text) {
      return jsonError("text required", 400, "INVALID_BODY")
    }
    if (text.length > 100_000) {
      return jsonError("text too long (max 100K chars)", 400, "TEXT_TOO_LONG")
    }
    const result = checkContractConfidentiality(text)
    return NextResponse.json({
      ok: true,
      orgId: session.orgId,
      ...result,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la scanarea contractului.", 500, "CONTRACT_CHECK_FAILED")
  }
}
