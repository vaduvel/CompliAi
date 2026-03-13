import { randomUUID } from "node:crypto"
import path from "node:path"

import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { assessEvidenceQuality } from "@/lib/compliance/evidence-quality"
import { getPersistableTaskIds } from "@/lib/compliance/task-ids"
import type { TaskEvidenceAttachment, TaskEvidenceKind } from "@/lib/compliance/types"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { eventActorFromSession } from "@/lib/server/event-actor"
import { storePrivateEvidenceFile } from "@/lib/server/evidence-storage"
import { getOrgContext } from "@/lib/server/org-context"
import { mutateState } from "@/lib/server/mvp-store"
import {
  shouldUseSupabaseEvidenceAsRequired,
  syncEvidenceObjectToSupabase,
} from "@/lib/server/supabase-evidence"

export const runtime = "nodejs"

const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024
const DANGEROUS_EXTENSIONS = new Set([
  ".html",
  ".htm",
  ".js",
  ".mjs",
  ".cjs",
  ".svg",
  ".exe",
  ".sh",
  ".bat",
  ".cmd",
  ".php",
  ".dmg",
  ".app",
])
const GENERIC_ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".pdf",
  ".txt",
  ".md",
  ".json",
  ".yaml",
  ".yml",
  ".csv",
  ".log",
  ".zip",
  ".doc",
  ".docx",
])
const GENERIC_ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/yaml",
  "application/x-yaml",
  "text/yaml",
  "text/x-yaml",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

const KIND_ALLOWED_EXTENSIONS: Record<TaskEvidenceKind, Set<string>> = {
  screenshot: new Set([".png", ".jpg", ".jpeg", ".webp", ".pdf"]),
  policy_text: new Set([".pdf", ".txt", ".md", ".doc", ".docx"]),
  log_export: new Set([".txt", ".log", ".csv", ".json"]),
  yaml_evidence: new Set([".yaml", ".yml", ".json", ".txt"]),
  document_bundle: new Set([".pdf", ".zip", ".txt", ".md", ".doc", ".docx"]),
  other: GENERIC_ALLOWED_EXTENSIONS,
}

const KIND_ALLOWED_MIME_TYPES: Record<TaskEvidenceKind, Set<string>> = {
  screenshot: new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]),
  policy_text: new Set([
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  log_export: new Set(["text/plain", "text/csv", "application/json"]),
  yaml_evidence: new Set([
    "text/plain",
    "application/json",
    "application/yaml",
    "application/x-yaml",
    "text/yaml",
    "text/x-yaml",
  ]),
  document_bundle: new Set([
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "text/plain",
    "text/markdown",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  other: GENERIC_ALLOWED_MIME_TYPES,
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = requireRole(
      request,
      ["owner", "compliance", "reviewer"],
      "incarcarea dovezilor pentru remediere"
    )
    const actor = eventActorFromSession(session)
    const formData = await request.formData()
    const uploaded = formData.get("file")
    const rawKind = formData.get("kind")

    if (!(uploaded instanceof File) || uploaded.size === 0) {
      return jsonError("Încarcă un fișier înainte să trimiți dovada.", 400, "EVIDENCE_FILE_REQUIRED")
    }

    if (uploaded.size > MAX_EVIDENCE_BYTES) {
      return jsonError("Fișierul este prea mare. Limita curentă este 10 MB.", 400, "EVIDENCE_FILE_TOO_LARGE")
    }

    const kind = isTaskEvidenceKind(rawKind) ? rawKind : "other"
    const validationError = validateEvidenceFile(uploaded, kind)
    if (validationError) {
      return jsonError(validationError, 400, "EVIDENCE_FILE_INVALID")
    }

    const nowISO = new Date().toISOString()
    const { orgId } = await getOrgContext()
    const evidenceId = `evidence-${randomUUID()}`
    const safeFileName = sanitizeFileName(uploaded.name || `${kind}.bin`)
    const bytes = Buffer.from(await uploaded.arrayBuffer())
    const storedEvidence = await storePrivateEvidenceFile({
      orgId,
      taskId: id,
      evidenceId,
      originalFileName: uploaded.name || safeFileName,
      safeFileName,
      mimeType: uploaded.type || "application/octet-stream",
      sizeBytes: uploaded.size,
      uploadedAtISO: nowISO,
      kind,
      bytes,
    })
    const evidence: TaskEvidenceAttachment = {
      ...storedEvidence,
      quality: assessEvidenceQuality({
        fileName: storedEvidence.fileName,
        mimeType: storedEvidence.mimeType,
        sizeBytes: storedEvidence.sizeBytes,
        kind: storedEvidence.kind,
        uploadedAtISO: storedEvidence.uploadedAtISO,
      }),
    }

    try {
      await syncEvidenceObjectToSupabase({
        orgId,
        taskId: id,
        evidence,
        uploadedByUserId: session.userId,
      })
    } catch (error) {
      if (shouldUseSupabaseEvidenceAsRequired()) {
        throw error
      }
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
              accessPath: evidence.accessPath || evidence.publicPath || "n/a",
            },
          }, actor),
        ]),
      }
    })

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      message: "Dovada a fost încărcată.",
      evidence,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    if (error instanceof Error && error.message === "TASK_NOT_FOUND") {
      return jsonError("Task-ul nu mai există în starea curentă.", 404, "TASK_NOT_FOUND")
    }

    return jsonError(
      error instanceof Error ? error.message : "Dovada nu a putut fi incarcata.",
      500,
      "EVIDENCE_UPLOAD_FAILED"
    )
  }
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

function validateEvidenceFile(uploaded: File, kind: TaskEvidenceKind) {
  const extension = path.extname(uploaded.name || "").toLowerCase()
  const mimeType = normalizeMimeType(uploaded.type)

  if (!extension) {
    return "Fisierul incarcat trebuie sa aiba o extensie valida."
  }

  if (DANGEROUS_EXTENSIONS.has(extension)) {
    return "Tipul acestui fisier nu este permis pentru dovezi."
  }

  const allowedExtensions = KIND_ALLOWED_EXTENSIONS[kind]
  if (!allowedExtensions.has(extension)) {
    return `Extensia ${extension} nu este permisa pentru tipul de dovada selectat.`
  }

  if (mimeType && !GENERIC_ALLOWED_MIME_TYPES.has(mimeType)) {
    return "Fisierul incarcat are un MIME type care nu este permis."
  }

  const allowedMimeTypes = KIND_ALLOWED_MIME_TYPES[kind]
  if (mimeType && !allowedMimeTypes.has(mimeType)) {
    return "Fisierul nu corespunde tipului de dovada selectat."
  }

  return null
}

function normalizeMimeType(value: string) {
  return value.trim().toLowerCase()
}
