// GET /api/findings/[id]  — Returns a single ScanFinding
// PATCH /api/findings/[id] — Update finding status (confirm/dismiss/resolve)
//   B2: Auto-generates task candidate on confirmation
//   B3: Auto-triggers document generation when confirmed + suggestedDocumentType

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { getOrgContext } from "@/lib/server/org-context"
import { readState, writeState } from "@/lib/server/mvp-store"
import { createNotification } from "@/lib/server/notifications-store"
import { mapFindingToTask } from "@/lib/finding-to-task-mapper"
import { generateDocument } from "@/lib/server/document-generator"
import type { DocumentType } from "@/lib/server/document-generator"

const VALID_DOC_TYPES: DocumentType[] = [
  "privacy-policy",
  "cookie-policy",
  "dpa",
  "nis2-incident-response",
  "ai-governance",
]

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const state = await readState()
    const finding = state.findings.find((f) => f.id === id)

    if (!finding) {
      return jsonError("Finding inexistent.", 404, "NOT_FOUND")
    }

    return NextResponse.json({ finding })
  } catch {
    return jsonError("Eroare la citirea finding-ului.", 500)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: findingId } = await params
    const { orgId, orgName } = await getOrgContext()
    const state = await readState()

    const findingIdx = state.findings.findIndex((f) => f.id === findingId)
    if (findingIdx === -1) {
      return jsonError("Finding-ul nu a fost găsit.", 404, "FINDING_NOT_FOUND")
    }

    const body = (await request.json()) as { status?: string }
    const newStatus = body.status

    if (!newStatus || !["confirmed", "dismissed", "resolved"].includes(newStatus)) {
      return jsonError(
        "Status invalid. Opțiuni: confirmed, dismissed, resolved.",
        400,
        "INVALID_STATUS"
      )
    }

    const finding = state.findings[findingIdx]

    // Update finding status (B2)
    const updatedFinding = {
      ...finding,
      findingStatus: newStatus as "confirmed" | "dismissed" | "resolved",
      findingStatusUpdatedAtISO: new Date().toISOString(),
    }

    const updatedFindings = [...state.findings]
    updatedFindings[findingIdx] = updatedFinding
    const updatedState = { ...state, findings: updatedFindings }

    // B2: On confirmation, generate task candidate + notify
    if (newStatus === "confirmed") {
      const taskCandidate = mapFindingToTask(updatedFinding)

      await createNotification(orgId, {
        type: "info",
        title: `Task generat: ${taskCandidate.title}`,
        message:
          `Finding "${finding.title}" confirmat → task candidat creat ` +
          `(${taskCandidate.suggestedOwner}, deadline ${new Date(taskCandidate.deadline).toLocaleDateString("ro-RO")}).`,
        linkTo: "/dashboard/resolve",
      }).catch(() => {})

      // B3: Auto-trigger document generation if suggestedDocumentType
      if (finding.suggestedDocumentType) {
        const docType = finding.suggestedDocumentType as DocumentType
        if (VALID_DOC_TYPES.includes(docType)) {
          // Fire-and-forget — don't block the response
          generateDocument({ documentType: docType, orgName })
            .then(async (doc) => {
              if (!doc) return

              const currentState = await readState()
              const generatedDocuments = currentState.generatedDocuments ?? []
              const docRecord = {
                id: `doc-${Math.random().toString(36).slice(2, 10)}`,
                documentType: doc.documentType,
                title: doc.title,
                generatedAtISO: new Date().toISOString(),
                llmUsed: true,
              }

              await writeState({
                ...currentState,
                generatedDocuments: [docRecord, ...generatedDocuments].slice(0, 50),
              })

              await createNotification(orgId, {
                type: "info",
                title: "Draft document generat",
                message: `${doc.title} generat ca draft pentru "${finding.title}". Verifică și semnează.`,
                linkTo: "/dashboard/resolve",
              }).catch(() => {})
            })
            .catch((err) => console.error("[B3] Document auto-generate failed:", err))
        }
      }
    }

    await writeState(updatedState)

    return NextResponse.json({ ok: true, findingId, status: newStatus })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Eroare la actualizarea finding-ului.",
      500,
      "FINDING_UPDATE_FAILED"
    )
  }
}
