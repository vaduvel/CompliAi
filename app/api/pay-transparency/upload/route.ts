import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { parseSalaryCSV } from "@/lib/server/pay-transparency-csv"
import { saveSalaryRecords, type SalaryRecordInput } from "@/lib/server/pay-transparency-store"

export async function POST(request: Request) {
  try {
    const session = requireRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer"],
      "încărcarea datelor salariale"
    )

    const body = (await request.json()) as {
      csvContent?: string
      records?: SalaryRecordInput[]
    }

    const parsedRecords =
      typeof body.csvContent === "string" && body.csvContent.trim()
        ? parseSalaryCSV(body.csvContent)
        : Array.isArray(body.records)
          ? body.records
          : []

    if (parsedRecords.length === 0) {
      return jsonError("Nu am găsit înregistrări salariale valide.", 400, "PAY_TRANSPARENCY_EMPTY_UPLOAD")
    }

    const saved = await saveSalaryRecords(session.orgId, parsedRecords)
    return NextResponse.json({
      ok: true,
      recordsSaved: saved.length,
      records: saved,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError("Nu am putut salva datele salariale.", 500, "PAY_TRANSPARENCY_UPLOAD_FAILED")
  }
}
