import { redirect } from "next/navigation"

export default function LegacyAuditorVaultPage() {
  redirect("/dashboard/reports/vault")
}
