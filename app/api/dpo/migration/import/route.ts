export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, type UserRole } from "@/lib/server/auth"
import {
  applyDpoMigrationImport,
  DPO_MIGRATION_IMPORT_KINDS,
} from "@/lib/server/dpo-migration-import"

const WRITE_ROLES: UserRole[] = ["owner", "partner_manager", "compliance", "reviewer"]

export async function GET() {
  return NextResponse.json({
    ok: true,
    kinds: DPO_MIGRATION_IMPORT_KINDS,
    maxRows: 500,
    acceptedFormats: [".xlsx", ".xls", ".csv"],
    note:
      "Import istoric DPO: DSAR, RoPA, vendor/DPA, training GDPR, breach ANSPDCP, aprobări email/Word și arhive evidence.",
  })
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      WRITE_ROLES,
      "importul istoricului DPO pentru client"
    )
    const form = await request.formData()
    const kind = String(form.get("kind") ?? "")
    const uploaded = form.get("file")

    if (!DPO_MIGRATION_IMPORT_KINDS.includes(kind as (typeof DPO_MIGRATION_IMPORT_KINDS)[number])) {
      return jsonError("Tip import DPO invalid.", 400, "INVALID_DPO_MIGRATION_KIND")
    }
    if (!(uploaded instanceof File) || uploaded.size === 0) {
      return jsonError("Încarcă un fișier .xlsx/.xls/.csv.", 400, "MIGRATION_FILE_REQUIRED")
    }
    if (uploaded.size > 8 * 1024 * 1024) {
      return jsonError("Fișierul este prea mare. Limita pentru import istoric este 8 MB.", 400, "MIGRATION_FILE_TOO_LARGE")
    }

    const result = await applyDpoMigrationImport({
      orgId: session.orgId,
      orgName: session.orgName,
      actor: {
        userId: session.userId,
        email: session.email,
        role: session.role,
      },
      kind: kind as (typeof DPO_MIGRATION_IMPORT_KINDS)[number],
      fileName: uploaded.name || "dpo-migration-import.csv",
      buffer: Buffer.from(await uploaded.arrayBuffer()),
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError(
      error instanceof Error ? error.message : "Importul istoric DPO a eșuat.",
      500,
      "DPO_MIGRATION_IMPORT_FAILED"
    )
  }
}
