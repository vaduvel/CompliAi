import type {
  ComplianceState,
  EvidenceQualityAssessment,
  TaskEvidenceAttachment,
  TaskEvidenceKind,
} from "@/lib/compliance/types"
import { hasSupabaseConfig, supabaseSelect } from "@/lib/server/supabase-rest"
import { getConfiguredDataBackend } from "@/lib/server/supabase-tenancy"

type EvidenceObjectRow = {
  attachment_id: string
  task_id?: string
  file_name: string
  mime_type: string
  size_bytes: number
  kind: string
  storage_provider: string
  storage_key: string
  uploaded_at?: string
  metadata?: {
    accessPath?: string | null
    publicPath?: string | null
    quality?: EvidenceQualityAssessment | null
  } | null
}

export function shouldReadEvidenceRegistryFromSupabase() {
  const backend = getConfiguredDataBackend()
  return hasSupabaseConfig() && (backend === "supabase" || backend === "hybrid")
}

export async function loadEvidenceObjectFromSupabase(input: {
  orgId: string
  attachmentId: string
}): Promise<TaskEvidenceAttachment | null> {
  if (!shouldReadEvidenceRegistryFromSupabase()) {
    return null
  }

  const rows = await supabaseSelect<EvidenceObjectRow>(
    "evidence_objects",
    `select=attachment_id,file_name,mime_type,size_bytes,kind,storage_provider,storage_key,uploaded_at,metadata&org_id=eq.${input.orgId}&attachment_id=eq.${input.attachmentId}&limit=1`,
    "public"
  )

  const row = rows[0]
  if (!row) {
    return null
  }

  return mapEvidenceObjectRow(row)
}

export async function loadTaskEvidenceObjectFromSupabase(input: {
  orgId: string
  taskId: string
  attachmentId: string
}): Promise<TaskEvidenceAttachment | null> {
  if (!shouldReadEvidenceRegistryFromSupabase()) {
    return null
  }

  const rows = await supabaseSelect<EvidenceObjectRow>(
    "evidence_objects",
    `select=attachment_id,task_id,file_name,mime_type,size_bytes,kind,storage_provider,storage_key,uploaded_at,metadata&org_id=eq.${input.orgId}&task_id=eq.${input.taskId}&attachment_id=eq.${input.attachmentId}&limit=1`,
    "public"
  )

  const row = rows[0]
  if (!row) {
    return null
  }

  return mapEvidenceObjectRow(row)
}

export async function hydrateEvidenceAttachmentsFromSupabase(
  state: ComplianceState,
  orgId: string
): Promise<ComplianceState> {
  if (!shouldReadEvidenceRegistryFromSupabase()) {
    return state
  }

  const attachmentIds = unique(
    Object.values(state.taskState)
      .map((entry) => entry.attachedEvidenceMeta?.id)
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
  )

  if (attachmentIds.length === 0) {
    return state
  }

  const rows = await loadEvidenceObjectsFromSupabase({ orgId, attachmentIds })
  if (rows.length === 0) {
    return state
  }

  const evidenceById = new Map(rows.map((row) => [row.id, row] as const))
  let changed = false
  const nextTaskState = Object.fromEntries(
    Object.entries(state.taskState).map(([taskId, entry]) => {
      const currentEvidence = entry.attachedEvidenceMeta
      if (!currentEvidence?.id) {
        return [taskId, entry]
      }

      const cloudEvidence = evidenceById.get(currentEvidence.id)
      if (!cloudEvidence) {
        return [taskId, entry]
      }

      changed = true
      return [
        taskId,
        {
          ...entry,
          attachedEvidenceMeta: {
            ...currentEvidence,
            ...cloudEvidence,
            accessPath: cloudEvidence.accessPath ?? currentEvidence.accessPath,
            publicPath: cloudEvidence.publicPath ?? currentEvidence.publicPath,
          },
        },
      ]
    })
  )

  if (!changed) {
    return state
  }

  return {
    ...state,
    taskState: nextTaskState,
  }
}

async function loadEvidenceObjectsFromSupabase(input: {
  orgId: string
  attachmentIds: string[]
}): Promise<TaskEvidenceAttachment[]> {
  if (!shouldReadEvidenceRegistryFromSupabase() || input.attachmentIds.length === 0) {
    return []
  }

  const rows = await supabaseSelect<EvidenceObjectRow>(
    "evidence_objects",
    `select=attachment_id,file_name,mime_type,size_bytes,kind,storage_provider,storage_key,uploaded_at,metadata&org_id=eq.${input.orgId}&attachment_id=in.(${input.attachmentIds.join(",")})`,
    "public"
  )

  return rows.map(mapEvidenceObjectRow)
}

function mapEvidenceObjectRow(row: EvidenceObjectRow): TaskEvidenceAttachment {
  return {
    id: row.attachment_id,
    fileName: row.file_name,
    mimeType: row.mime_type || "application/octet-stream",
    sizeBytes: typeof row.size_bytes === "number" ? row.size_bytes : 0,
    uploadedAtISO: row.uploaded_at || new Date().toISOString(),
    kind: isTaskEvidenceKind(row.kind) ? row.kind : "other",
    storageProvider: isStorageProvider(row.storage_provider) ? row.storage_provider : "local_private",
    storageKey: typeof row.storage_key === "string" && row.storage_key.trim() ? row.storage_key : undefined,
    accessPath:
      typeof row.metadata?.accessPath === "string" && row.metadata.accessPath.trim()
        ? row.metadata.accessPath
        : undefined,
    publicPath:
      typeof row.metadata?.publicPath === "string" && row.metadata.publicPath.trim()
        ? row.metadata.publicPath
        : undefined,
    quality: isEvidenceQualityAssessment(row.metadata?.quality) ? row.metadata?.quality : undefined,
  }
}

function unique(values: string[]) {
  return [...new Set(values)]
}

function isTaskEvidenceKind(value: string): value is TaskEvidenceKind {
  return (
    value === "screenshot" ||
    value === "policy_text" ||
    value === "log_export" ||
    value === "yaml_evidence" ||
    value === "document_bundle" ||
    value === "other"
  )
}

function isStorageProvider(
  value: string
): value is NonNullable<TaskEvidenceAttachment["storageProvider"]> {
  return value === "public_local" || value === "local_private" || value === "supabase_private"
}

function isEvidenceQualityAssessment(value: unknown): value is EvidenceQualityAssessment {
  if (!value || typeof value !== "object") return false
  const candidate = value as EvidenceQualityAssessment
  return (
    (candidate.status === "sufficient" || candidate.status === "weak") &&
    typeof candidate.summary === "string" &&
    Array.isArray(candidate.reasonCodes) &&
    typeof candidate.checkedAtISO === "string"
  )
}
