import type { TaskEvidenceAttachment } from "@/lib/compliance/types"
import { hasSupabaseConfig, supabaseDelete, supabaseUpsert } from "@/lib/server/supabase-rest"
import { getConfiguredDataBackend } from "@/lib/server/supabase-tenancy"

export function shouldMirrorEvidenceToSupabase() {
  const backend = getConfiguredDataBackend()
  return hasSupabaseConfig() && (backend === "supabase" || backend === "hybrid")
}

export function shouldUseSupabaseEvidenceAsRequired() {
  return hasSupabaseConfig() && getConfiguredDataBackend() === "supabase"
}

export async function syncEvidenceObjectToSupabase(input: {
  orgId: string
  taskId: string
  evidence: TaskEvidenceAttachment
  uploadedByUserId?: string | null
}) {
  if (!shouldMirrorEvidenceToSupabase()) {
    return { synced: false, reason: "DATA_BACKEND_LOCAL" as const }
  }

  await supabaseUpsert(
    "evidence_objects",
    [
      {
        attachment_id: input.evidence.id,
        org_id: input.orgId,
        task_id: input.taskId,
        file_name: input.evidence.fileName,
        mime_type: input.evidence.mimeType,
        size_bytes: input.evidence.sizeBytes,
        kind: input.evidence.kind,
        storage_provider: input.evidence.storageProvider ?? "local_private",
        storage_key: input.evidence.storageKey ?? "",
        uploaded_by: input.uploadedByUserId ?? null,
        uploaded_at: input.evidence.uploadedAtISO,
        metadata: {
          accessPath: input.evidence.accessPath ?? null,
          publicPath: input.evidence.publicPath ?? null,
          quality: input.evidence.quality ?? null,
        },
      },
    ],
    "public",
    "on_conflict=attachment_id"
  )

  return {
    synced: true,
    attachmentId: input.evidence.id,
    orgId: input.orgId,
    taskId: input.taskId,
  }
}

export async function deleteEvidenceObjectFromSupabase(input: {
  orgId: string
  taskId: string
  attachmentId: string
}) {
  if (!shouldMirrorEvidenceToSupabase()) {
    return { deleted: false, reason: "DATA_BACKEND_LOCAL" as const }
  }

  await supabaseDelete(
    "evidence_objects",
    `org_id=eq.${input.orgId}&task_id=eq.${input.taskId}&attachment_id=eq.${input.attachmentId}`,
    "public"
  )

  return {
    deleted: true,
    attachmentId: input.attachmentId,
    orgId: input.orgId,
    taskId: input.taskId,
  }
}
