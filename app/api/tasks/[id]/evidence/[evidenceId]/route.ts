import { NextResponse } from "next/server"

import { getPersistableTaskIds } from "@/lib/compliance/task-ids"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { getStoredEvidenceSignedUrl, readStoredEvidenceFile } from "@/lib/server/evidence-storage"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { loadTaskEvidenceObjectFromSupabase } from "@/lib/server/supabase-evidence-read"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; evidenceId: string }> }
) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer", "viewer"],
      "vizualizarea dovezilor de remediere"
    )

    const { id, evidenceId } = await context.params
    const state = await readFreshStateForOrg(session.orgId, session.orgName)

    if (!state) {
      return jsonError(
        "Nu am găsit starea organizației pentru acest task.",
        404,
        "ORG_STATE_NOT_FOUND"
      )
    }

    if (!getPersistableTaskIds(state).has(id)) {
      return jsonError("Task-ul nu mai există în starea curentă.", 404, "TASK_NOT_FOUND")
    }

    const stateEvidence = state.taskState[id]?.attachedEvidenceMeta
    const cloudEvidence = await loadTaskEvidenceObjectFromSupabase({
      orgId: session.orgId,
      taskId: id,
      attachmentId: evidenceId,
    })
    const evidence =
      stateEvidence?.id === evidenceId
        ? cloudEvidence
          ? {
              ...stateEvidence,
              ...cloudEvidence,
              accessPath: cloudEvidence.accessPath ?? stateEvidence.accessPath,
              publicPath: cloudEvidence.publicPath ?? stateEvidence.publicPath,
            }
          : stateEvidence
        : cloudEvidence

    if (!evidence) {
      return jsonError("Dovada cerută nu mai există pentru acest task.", 404, "EVIDENCE_NOT_FOUND")
    }

    const url = new URL(request.url)
    const delivery = url.searchParams.get("delivery")
    const shouldDownload = url.searchParams.get("download") === "1"

    if (delivery === "redirect") {
      const signedUrl = await getStoredEvidenceSignedUrl(evidence, { orgId: session.orgId })
      if (signedUrl) {
        return NextResponse.redirect(signedUrl, {
          status: 307,
          headers: {
            "Cache-Control": "private, no-store",
            "Referrer-Policy": "no-referrer",
          },
        })
      }
    }

    const { buffer } = await readStoredEvidenceFile(evidence, { orgId: session.orgId })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": evidence.mimeType || "application/octet-stream",
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${sanitizeHeaderValue(
          evidence.fileName
        )}"`,
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    if (error instanceof Error && error.message === "EVIDENCE_STORAGE_UNAVAILABLE") {
      return jsonError(
        "Dovada există în stare, dar nu mai poate fi citită din storage.",
        410,
        "EVIDENCE_STORAGE_UNAVAILABLE"
      )
    }

    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return jsonError("Fișierul de dovadă nu mai există în storage.", 404, "EVIDENCE_FILE_MISSING")
    }

    return jsonError(
      error instanceof Error ? error.message : "Dovada nu a putut fi deschisă.",
      500,
      "EVIDENCE_READ_FAILED"
    )
  }
}

function sanitizeHeaderValue(value: string) {
  return value.replace(/[\r\n"]/g, "").trim() || "evidence.bin"
}
