// Batch action types and constants shared between API and UI.

export type BatchActionType =
  | "generate_ropa"
  | "run_baseline_scan"
  | "export_audit_pack"
  | "send_compliance_summary"

export const BATCH_ACTION_RISK: Record<BatchActionType, "low" | "medium" | "high"> = {
  generate_ropa: "low",
  run_baseline_scan: "medium",
  export_audit_pack: "low",
  send_compliance_summary: "medium",
}

export const BATCH_ACTION_LABELS: Record<BatchActionType, string> = {
  generate_ropa: "Generare RoPA",
  run_baseline_scan: "Baseline scan",
  export_audit_pack: "Export audit pack",
  send_compliance_summary: "Sumar conformitate",
}

export const VALID_BATCH_ACTIONS: BatchActionType[] = [
  "generate_ropa",
  "run_baseline_scan",
  "export_audit_pack",
  "send_compliance_summary",
]

export type BatchResult = {
  orgId: string
  orgName: string
  status: "success" | "pending_approval" | "failed"
  pendingActionId?: string
  detail?: string
  error?: string
  nextStep?: string
  summary?: Record<string, string | number | boolean>
}
