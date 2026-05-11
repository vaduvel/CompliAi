// Sprint 0 — sub-rută IA fiscal pentru "Deadline urgent" (PFA Form 082 + Calendar).

import { redirect } from "next/navigation"

export default function FiscalDeadlinesPage() {
  redirect("/dashboard/fiscal?tab=pfa")
}
