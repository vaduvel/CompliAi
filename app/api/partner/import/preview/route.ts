/**
 * GOLD 1 — Import preview: parse Excel/CSV, detect mapping, return rows with warnings.
 * Accepts multipart/form-data with a `file` field.
 * Returns parsed rows, column mapping, per-row warnings/errors, duplicate detection.
 */
import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, listUserMemberships, requireFreshRole, resolveUserMode } from "@/lib/server/auth"
import { parseImportFile } from "@/lib/server/import-parser"
import { readStateForOrg } from "@/lib/server/mvp-store"

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager"], "preview import")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("Import disponibil doar în modul partner.", 403, "PORTFOLIO_FORBIDDEN")
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return jsonError("Fișier lipsă.", 400, "MISSING_FILE")

    const fileName = file.name
    if (!/\.(xlsx|xls|csv)$/i.test(fileName)) {
      return jsonError("Format nesuportat. Acceptăm .xlsx, .xls sau .csv.", 400, "UNSUPPORTED_FORMAT")
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Gather existing org names/CUIs for duplicate detection
    const memberships = (await listUserMemberships(session.userId)).filter(
      (m) => m.status === "active"
    )
    const existingOrgNames: string[] = []
    const existingCUIs: string[] = []
    for (const m of memberships) {
      existingOrgNames.push(m.orgName)
      const state = await readStateForOrg(m.orgId)
      const cui = state?.orgProfile?.cui
      if (cui) existingCUIs.push(cui)
    }

    const result = parseImportFile(buffer, fileName, existingOrgNames, existingCUIs)

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    if (error instanceof Error) return jsonError(error.message, 400, "PARSE_ERROR")
    return jsonError("Eroare la preview.", 500, "PREVIEW_FAILED")
  }
}
