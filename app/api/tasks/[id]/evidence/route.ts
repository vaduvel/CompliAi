import { randomUUID } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"

import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { getPersistableTaskIds } from "@/lib/compliance/task-ids"
import type { TaskEvidenceAttachment, TaskEvidenceKind } from "@/lib/compliance/types"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { getOrgContext } from "@/lib/server/org-context"
import { mutateState } from "@/lib/server/mvp-store"

export const runtime = "nodejs"

const EVIDENCE_ROOT = path.join(process.cwd(), "public", "evidence-uploads")
const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const formData = await request.formData()
    const uploaded = formData.get("file")
    const rawKind = formData.get("kind")

    if (!(uploaded instanceof File) || uploaded.size === 0) {
      return NextResponse.json({ error: "Încarcă un fișier înainte să trimiți dovada." }, { status: 400 })
    }

    if (uploaded.size > MAX_EVIDENCE_BYTES) {
      return NextResponse.json(
        { error: "Fișierul este prea mare. Limita curentă este 10 MB." },
        { status: 400 }
      )
    }

    const kind = isTaskEvidenceKind(rawKind) ? rawKind : "other"
    const nowISO = new Date().toISOString()
    const { orgId } = await getOrgContext()
    const safeOrgId = sanitizeSegment(orgId)
    const evidenceId = `evidence-${randomUUID()}`
    const safeFileName = sanitizeFileName(uploaded.name || `${kind}.bin`)
    const storedFileName = `${Date.now()}-${evidenceId}-${safeFileName}`
    const absoluteDir = path.join(EVIDENCE_ROOT, safeOrgId)
    const absolutePath = path.join(absoluteDir, storedFileName)
    const publicPath = path.posix.join("/evidence-uploads", safeOrgId, storedFileName)

    await fs.mkdir(absoluteDir, { recursive: true })
    const bytes = Buffer.from(await uploaded.arrayBuffer())
    await fs.writeFile(absolutePath, bytes)

    const evidence: TaskEvidenceAttachment = {
      id: evidenceId,
      fileName: uploaded.name || safeFileName,
      mimeType: uploaded.type || "application/octet-stream",
      sizeBytes: uploaded.size,
      uploadedAtISO: nowISO,
      kind,
      publicPath,
    }

    const nextState = await mutateState((current) => {
      if (!getPersistableTaskIds(current).has(id)) {
        throw new Error("TASK_NOT_FOUND")
      }

      const previous =
        current.taskState[id] ?? {
          status: "todo" as const,
          updatedAtISO: nowISO,
        }

      return {
        ...current,
        taskState: {
          ...current.taskState,
          [id]: {
            ...previous,
            attachedEvidence: evidence.fileName,
            attachedEvidenceMeta: evidence,
            updatedAtISO: nowISO,
          },
        },
        events: appendComplianceEvents(current, [
          createComplianceEvent({
            type: "task.evidence-attached",
            entityType: "task",
            entityId: id,
            message: `Dovada a fost încărcată pentru ${id}.`,
            createdAtISO: nowISO,
            metadata: {
              status: previous.status,
              fileName: evidence.fileName,
              kind: evidence.kind,
              publicPath: evidence.publicPath || "n/a",
            },
          }),
        ]),
      }
    })

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      message: "Dovada a fost încărcată.",
      evidence,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "TASK_NOT_FOUND") {
      return NextResponse.json(
        { error: "Task-ul nu mai există în starea curentă." },
        { status: 404 }
      )
    }

    throw error
  }
}

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "org"
}

function sanitizeFileName(value: string) {
  const extension = path.extname(value).toLowerCase().replace(/[^a-z0-9.]/g, "")
  const baseName = path.basename(value, extension)
  const safeBaseName =
    baseName
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "evidence"

  return `${safeBaseName}${extension.slice(0, 12)}`
}

function isTaskEvidenceKind(value: FormDataEntryValue | null): value is TaskEvidenceKind {
  return (
    value === "screenshot" ||
    value === "policy_text" ||
    value === "log_export" ||
    value === "yaml_evidence" ||
    value === "document_bundle" ||
    value === "other"
  )
}
