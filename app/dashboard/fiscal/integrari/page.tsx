// Sprint 0 — sub-rută IA fiscal pentru "Integrări ERP".

import { redirect } from "next/navigation"

export default function FiscalIntegrationsPage() {
  redirect("/dashboard/fiscal?tab=integrari")
}
