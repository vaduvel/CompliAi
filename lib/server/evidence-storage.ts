import { promises as fs } from "node:fs"
import path from "node:path"

import type { TaskEvidenceAttachment, TaskEvidenceKind } from "@/lib/compliance/types"
import {
  createSignedSupabaseObjectUrl,
  deleteSupabaseObject,
  downloadSupabaseObject,
  ensureSupabaseBucket,
  hasSupabaseStorageConfig,
  uploadSupabaseObject,
} from "@/lib/server/supabase-storage"
import { loadEvidenceObjectFromSupabase } from "@/lib/server/supabase-evidence-read"
import { getConfiguredDataBackend } from "@/lib/server/supabase-tenancy"

const LOCAL_PRIVATE_EVIDENCE_ROOT = path.join(process.cwd(), ".data", "evidence-uploads")
const SUPABASE_PRIVATE_EVIDENCE_BUCKET =
  process.env.COMPLISCAN_SUPABASE_EVIDENCE_BUCKET?.trim() || "compliscan-evidence-private"

type StoreEvidenceInput = {
  orgId: string
  taskId: string
  evidenceId: string
  originalFileName: string
  safeFileName: string
  mimeType: string
  sizeBytes: number
  uploadedAtISO: string
  kind: TaskEvidenceKind
  bytes: Buffer
}

export async function storePrivateEvidenceFile(
  input: StoreEvidenceInput
): Promise<TaskEvidenceAttachment> {
  const safeOrgId = sanitizeSegment(input.orgId)
  const safeTaskId = sanitizeSegment(input.taskId)
  const storedFileName = `${Date.now()}-${input.evidenceId}-${input.safeFileName}`
  const storageKey = path.posix.join(safeOrgId, safeTaskId, storedFileName)

  if (shouldUseSupabasePrivateEvidenceStorage()) {
    await ensureSupabaseBucket(SUPABASE_PRIVATE_EVIDENCE_BUCKET)
    await uploadSupabaseObject(
      SUPABASE_PRIVATE_EVIDENCE_BUCKET,
      storageKey,
      input.bytes,
      input.mimeType || "application/octet-stream"
    )

    return {
      id: input.evidenceId,
      fileName: input.originalFileName,
      mimeType: input.mimeType || "application/octet-stream",
      sizeBytes: input.sizeBytes,
      uploadedAtISO: input.uploadedAtISO,
      kind: input.kind,
      storageProvider: "supabase_private",
      storageKey,
      accessPath: `/api/tasks/${encodeURIComponent(input.taskId)}/evidence/${encodeURIComponent(
        input.evidenceId
      )}`,
    }
  }

  const absolutePath = resolveLocalPrivateEvidencePath(storageKey)
  await fs.mkdir(path.dirname(absolutePath), { recursive: true })
  await fs.writeFile(absolutePath, input.bytes)

  return {
    id: input.evidenceId,
    fileName: input.originalFileName,
    mimeType: input.mimeType || "application/octet-stream",
    sizeBytes: input.sizeBytes,
    uploadedAtISO: input.uploadedAtISO,
    kind: input.kind,
    storageProvider: "local_private",
    storageKey,
    accessPath: `/api/tasks/${encodeURIComponent(input.taskId)}/evidence/${encodeURIComponent(
      input.evidenceId
    )}`,
  }
}

export async function readStoredEvidenceFile(
  evidence: TaskEvidenceAttachment,
  options?: { orgId?: string }
) {
  const resolvedEvidence = await resolveOperationalEvidenceAttachment(evidence, options)

  if (resolvedEvidence.storageProvider === "supabase_private" && resolvedEvidence.storageKey) {
    return {
      buffer: await downloadSupabaseObject(
        SUPABASE_PRIVATE_EVIDENCE_BUCKET,
        resolvedEvidence.storageKey
      ),
    }
  }

  if (resolvedEvidence.storageProvider === "local_private" && resolvedEvidence.storageKey) {
    const absolutePath = resolveLocalPrivateEvidencePath(resolvedEvidence.storageKey)
    return {
      buffer: await fs.readFile(absolutePath),
      absolutePath,
    }
  }

  if (resolvedEvidence.publicPath) {
    const absolutePath = path.join(
      process.cwd(),
      "public",
      resolvedEvidence.publicPath.replace(/^\//, "")
    )
    return {
      buffer: await fs.readFile(absolutePath),
      absolutePath,
    }
  }

  throw new Error("EVIDENCE_STORAGE_UNAVAILABLE")
}

export async function getStoredEvidenceSignedUrl(
  evidence: TaskEvidenceAttachment,
  options?: { expiresInSeconds?: number; orgId?: string }
) {
  const resolvedEvidence = await resolveOperationalEvidenceAttachment(evidence, options)

  if (resolvedEvidence.storageProvider !== "supabase_private" || !resolvedEvidence.storageKey) {
    return null
  }

  return createSignedSupabaseObjectUrl(
    SUPABASE_PRIVATE_EVIDENCE_BUCKET,
    resolvedEvidence.storageKey,
    options?.expiresInSeconds ?? getEvidenceSignedUrlTtlSeconds()
  )
}

export async function deleteStoredEvidenceFile(
  evidence: TaskEvidenceAttachment,
  options?: { orgId?: string }
) {
  const resolvedEvidence = await resolveOperationalEvidenceAttachment(evidence, options)

  if (resolvedEvidence.storageProvider === "supabase_private" && resolvedEvidence.storageKey) {
    return deleteSupabaseObject(SUPABASE_PRIVATE_EVIDENCE_BUCKET, resolvedEvidence.storageKey)
  }

  if (resolvedEvidence.storageProvider === "local_private" && resolvedEvidence.storageKey) {
    const absolutePath = resolveLocalPrivateEvidencePath(resolvedEvidence.storageKey)
    try {
      await fs.unlink(absolutePath)
      return { deleted: true }
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
        return { deleted: false }
      }
      throw error
    }
  }

  return { deleted: false }
}

export async function copyStoredEvidenceFile(
  evidence: TaskEvidenceAttachment,
  destinationAbsolutePath: string,
  options?: { orgId?: string }
) {
  const stored = await readStoredEvidenceFile(evidence, options)

  if (stored.absolutePath) {
    await fs.copyFile(stored.absolutePath, destinationAbsolutePath)
    return
  }

  await fs.mkdir(path.dirname(destinationAbsolutePath), { recursive: true })
  await fs.writeFile(destinationAbsolutePath, stored.buffer)
}

async function resolveOperationalEvidenceAttachment(
  evidence: TaskEvidenceAttachment,
  options?: { orgId?: string }
) {
  if (!options?.orgId || !evidence.id) {
    return evidence
  }

  try {
    const cloudEvidence = await loadEvidenceObjectFromSupabase({
      orgId: options.orgId,
      attachmentId: evidence.id,
    })

    return cloudEvidence ?? evidence
  } catch {
    return evidence
  }
}

function resolveLocalPrivateEvidencePath(storageKey: string) {
  const normalized = storageKey
    .split("/")
    .filter(Boolean)
    .map((segment) => sanitizeSegment(segment))
    .join(path.sep)

  return path.join(LOCAL_PRIVATE_EVIDENCE_ROOT, normalized)
}

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 128) || "segment"
}

function shouldUseSupabasePrivateEvidenceStorage() {
  const backend = getConfiguredDataBackend()
  return hasSupabaseStorageConfig() && (backend === "supabase" || backend === "hybrid")
}

function getEvidenceSignedUrlTtlSeconds() {
  const value = Number.parseInt(
    process.env.COMPLISCAN_EVIDENCE_SIGNED_URL_TTL_SECONDS ?? "90",
    10
  )

  if (!Number.isFinite(value)) {
    return 90
  }

  return Math.max(15, Math.min(900, value))
}
