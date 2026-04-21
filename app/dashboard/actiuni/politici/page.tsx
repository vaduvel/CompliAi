import { redirect } from "next/navigation"

export default function LegacyPoliciesPage() {
  redirect("/dashboard/reports/policies")
}
