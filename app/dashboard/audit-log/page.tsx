import { redirect } from "next/navigation"

export default function LegacyAuditLogPage() {
  redirect("/dashboard/reports/audit-log")
}
