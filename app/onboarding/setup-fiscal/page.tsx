// Setup Fiscal — onboarding pas 2 pentru cabinet-fiscal (Mircea persona).
//
// Pagina secvențială care duce Mircea de la 0 → portofoliu cu findings reale:
//
//   step=import → 4 căi import clienți (CSV / Oblio / SmartBill / SAGA)
//   step=anaf   → ANAF SPV OAuth (după ce avem CUI-uri)
//   step=scan   → animație live progress SPV pull per client
//   → redirect /portfolio cu findings reale (wow moment)
//
// Step e auto-detectat din state (portfolio clients count + efacturaConnected
// flag + scan timestamp). User-ul nu poate sări pași.
//
// Refs Faza 1 REVISED din fiscal-module-final-sprint-2026-05-12.md.

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  SESSION_COOKIE,
  listUserMemberships,
  refreshSessionPayload,
  verifySessionToken,
} from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { getWhiteLabelConfig } from "@/lib/server/white-label"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { SetupFiscalShell } from "@/components/compliscan/onboarding/SetupFiscalShell"

export const dynamic = "force-dynamic"

export default async function SetupFiscalPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  const verifiedSession = token ? verifySessionToken(token) : null
  const session = verifiedSession ? await refreshSessionPayload(verifiedSession) : null

  if (!session) {
    redirect("/login")
  }

  // ICP-ul vine din white-label config pe cabinet's own org (owner membership).
  // În modul partner, session.orgId poate fi clientul curent, NU cabinetul.
  const memberships = await listUserMemberships(session.userId).catch(() => [])
  let lookupOrgId = session.orgId
  if (session.userMode === "partner") {
    const ownerMembership = memberships.find((m) => m.role === "owner")
    if (ownerMembership) lookupOrgId = ownerMembership.orgId
  }
  let icpSegment: string | null = null
  try {
    const wl = await getWhiteLabelConfig(lookupOrgId)
    icpSegment = wl.icpSegment ?? null
  } catch {
    icpSegment = null
  }

  // Defensive: doar cabinet-fiscal aterizează aici. Restul ICP-urilor sunt
  // redirected la /dashboard sau onboarding-ul lor propriu.
  if (icpSegment !== "cabinet-fiscal") {
    redirect(dashboardRoutes.home)
  }

  const state = await readStateForOrg(lookupOrgId).catch(() => null)
  // Lista clienților = membership-urile partner_manager active (excl. propriul
  // org al cabinetului).
  const portfolioClients = memberships.filter(
    (m) => m.status === "active" && m.role === "partner_manager" && m.orgId !== lookupOrgId,
  )

  const hasClients = portfolioClients.length > 0
  const hasAnafToken = state?.efacturaConnected === true
  // Scan completat = orice client a fost scanat (timestamp pe state.events
  // sau presence findings fiscal). Folosim un flag explicit ca fiind:
  // există minim 1 client cu cel puțin 1 finding e-Factura SAU absent ANAF.
  const scanCompleted = Boolean(
    state?.events?.some(
      (evt) =>
        typeof evt === "object" &&
        evt !== null &&
        "type" in evt &&
        typeof (evt as { type: string }).type === "string" &&
        (evt as { type: string }).type === "fiscal.setup.scan.completed",
    ),
  )

  // Routing logic: dacă setup-ul e complet (clienți + ANAF + scan), redirect
  // la cockpit fiscal — wow moment.
  if (hasClients && hasAnafToken && scanCompleted) {
    redirect("/dashboard/fiscal")
  }

  // Determinăm pasul curent:
  //   0 clienți          → step=import
  //   N clienți + !ANAF  → step=anaf
  //   N + ANAF + !scan   → step=scan
  const currentStep: "import" | "anaf" | "scan" =
    !hasClients ? "import" : !hasAnafToken ? "anaf" : "scan"

  return (
    <SetupFiscalShell
      currentStep={currentStep}
      clientsCount={portfolioClients.length}
      anafConnected={hasAnafToken}
    />
  )
}
