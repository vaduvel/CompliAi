// Sprint 0 — sub-rută IA fiscal pentru "TVA & declarații".

import { redirect } from "next/navigation"

export default function FiscalTvaPage() {
  redirect("/dashboard/fiscal?tab=discrepante")
}
