import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import { LegacyWorkspaceBridge } from "@/components/compliscan/legacy-workspace-bridge"
import { PortfolioShell } from "@/components/compliscan/portfolio-shell"
import {
  SESSION_COOKIE,
  listUserMemberships,
  refreshSessionPayload,
  resolveUserMode,
  verifySessionToken,
} from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { getWhiteLabelConfig } from "@/lib/server/white-label"

export const dynamic = "force-dynamic"

export default async function PortfolioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
  const verifiedSession = sessionToken ? verifySessionToken(sessionToken) : null
  const session = verifiedSession ? await refreshSessionPayload(verifiedSession) : null

  if (!session) {
    redirect("/login")
  }

  const userMode = await resolveUserMode(session)

  if (userMode !== "partner") {
    redirect("/dashboard")
  }

  if (session.workspaceMode !== "portfolio") {
    return (
      <LegacyWorkspaceBridge
        title="Comutăm sesiunea în Portofoliu"
        description="Pregătim workspace-ul de cabinet ca să vezi toți clienții într-un singur loc."
        requestBody={{ workspaceMode: "portfolio" }}
        destinationHref="/portfolio"
        preserveCurrentPath
        fallbackHref="/dashboard"
        fallbackLabel="Înapoi la dashboard"
      />
    )
  }

  const memberships = await listUserMemberships(session.userId)

  // Sprint cleanup fiscal-first (2026-05-11): include icpSegment în initialUser
  // ca DashboardShell să poată aplica filter cabinet-fiscal pe sidebar/labels.
  // Mircea fix: pentru partner, ICP-ul vine din CABINET's own org (owner
  // membership), nu din session.orgId care e clientul curent.
  let icpSegment: import("@/lib/server/white-label").IcpSegment | null = null
  let cabinetOrgId = session.orgId
  try {
    if (userMode === "partner") {
      const ownerMembership = memberships.find((m) => m.role === "owner")
      if (ownerMembership) cabinetOrgId = ownerMembership.orgId
    }
    const wl = await getWhiteLabelConfig(cabinetOrgId)
    icpSegment = wl.icpSegment ?? null
  } catch {
    icpSegment = null
  }

  // Faza 1.5c (2026-05-12): routing guard cabinet-fiscal incomplete →
  // /onboarding/setup-fiscal. Mircea NU vede portofoliu gol fără context;
  // setup-fiscal îl duce prin import → ANAF → scan → wow moment.
  //
  // Trigger doar dacă URL-ul NU are deja `?skip=setup` (escape hatch din
  // footer-ul setup-fiscal pentru cazuri rare când user-ul vrea explicit
  // să vadă portofoliul gol).
  if (icpSegment === "cabinet-fiscal") {
    const requestHeaders = await headers()
    const referer = requestHeaders.get("referer") ?? ""
    const isSkipSetup = referer.includes("skip=setup") ||
      requestHeaders.get("x-compliscan-skip-setup") === "true"
    if (!isSkipSetup) {
      const portfolioClientCount = memberships.filter(
        (m) =>
          m.status === "active" && m.role === "partner_manager" && m.orgId !== cabinetOrgId,
      ).length
      const cabinetState = await readStateForOrg(cabinetOrgId).catch(() => null)
      const hasAnafToken = cabinetState?.efacturaConnected === true
      const scanCompleted = Boolean(
        cabinetState?.events?.some(
          (evt) =>
            typeof evt === "object" &&
            evt !== null &&
            "type" in evt &&
            (evt as { type?: string }).type === "fiscal.setup.scan.completed",
        ),
      )
      const setupComplete = portfolioClientCount > 0 && hasAnafToken && scanCompleted
      if (!setupComplete) {
        redirect("/onboarding/setup-fiscal")
      }
    }
  }

  const initialUser = {
    email: session.email,
    orgName: session.orgName,
    orgId: session.orgId,
    role: session.role,
    membershipId: session.membershipId ?? null,
    userMode,
    workspaceMode: session.workspaceMode ?? "org",
    icpSegment,
  }

  return (
    <PortfolioShell initialUser={initialUser} initialMemberships={memberships}>
      {children}
    </PortfolioShell>
  )
}
