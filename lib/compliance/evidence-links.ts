import type { TaskEvidenceAttachment } from "@/lib/compliance/types"

export function resolveEvidenceHref(evidence: TaskEvidenceAttachment | null | undefined) {
  if (!evidence) return null
  if (typeof evidence.accessPath === "string" && evidence.accessPath.trim()) {
    return evidence.accessPath.trim()
  }
  if (typeof evidence.publicPath === "string" && evidence.publicPath.trim()) {
    return evidence.publicPath.trim()
  }
  return null
}
