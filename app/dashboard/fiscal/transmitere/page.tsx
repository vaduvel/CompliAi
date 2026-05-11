// Sprint 0 — sub-rută IA fiscal pentru "Transmitere & SPV".

import { redirect } from "next/navigation"

export default function FiscalTransmissionPage() {
  redirect("/dashboard/fiscal?tab=transmitere")
}
