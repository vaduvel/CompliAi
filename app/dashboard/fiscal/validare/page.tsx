// Sprint 0 — sub-rută IA fiscal pentru secțiunea "Validare & emitere".
// Redirecționează la pagina principală cu tab-ul Validator activat.

import { redirect } from "next/navigation"

export default function FiscalValidationPage() {
  redirect("/dashboard/fiscal?tab=validator")
}
