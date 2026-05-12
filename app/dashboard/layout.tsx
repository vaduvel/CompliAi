import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { CockpitProvider } from "@/components/compliscan/use-cockpit"
import { DashboardShell } from "@/components/compliscan/dashboard-shell"
import { TooltipProvider } from "@/components/evidence-os"
import {
  SESSION_COOKIE,
  listUserMemberships,
  refreshSessionPayload,
  resolveUserMode,
  verifySessionToken,
} from "@/lib/server/auth"
import { buildDashboardCorePayload } from "@/lib/server/dashboard-response"
import { getOrgContext } from "@/lib/server/org-context"
import { loadOnboardingGateState, loadOnboardingGateStateForOrg } from "@/lib/server/onboarding-gate"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { getWhiteLabelConfig } from "@/lib/server/white-label"

function isDemoSession(session: { userId: string; orgId: string }) {
  return session.userId.startsWith("demo-user-") || session.orgId.startsWith("org-demo-")
}

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
  const verifiedSession = sessionToken ? verifySessionToken(sessionToken) : null
  const session = verifiedSession ? await refreshSessionPayload(verifiedSession) : null

  const onboardingGate =
    session && !isDemoSession(session)
      ? await loadOnboardingGateStateForOrg(session.orgId)
      : await loadOnboardingGateState()
  // Demo partner sessions still need their real mode so Diana can move between
  // portfolio triage and client execution while we skip only the onboarding gate.
  const userMode = session ? await resolveUserMode(session) : null
  const onboardingDone = Boolean(userMode && onboardingGate.hasCompletedOnboarding)

  if (session && !isDemoSession(session)) {
    // Mircea cabinet-fiscal fix (2026-05-11): partner mode entering client org
    // nu trebuie să facă onboarding pentru fiecare client. Onboarding-ul cabinet
    // s-a făcut deja; clienții importați via CSV pot fi accesați direct.
    // Solo/compliance/enterprise rămân pe gate-ul standard.
    const isPartnerEnteringClient =
      userMode === "partner" && session.workspaceMode === "org"
    if (!onboardingDone && !isPartnerEnteringClient) {
      redirect("/onboarding")
    }
    if (session.workspaceMode === "portfolio" && userMode === "partner") {
      redirect("/portfolio")
    }
  }

  const workspaceOverride =
    session == null
      ? undefined
      : {
          ...(await getOrgContext()),
          orgId: session.orgId,
          orgName: session.orgName,
          workspaceOwner: session.email,
          userRole: session.role,
        }
  const corePayload = await buildDashboardCorePayload(onboardingGate.state, workspaceOverride)
  const memberships = session ? await listUserMemberships(session.userId) : []
  const initialCockpitData = {
    state: corePayload.state,
    summary: corePayload.summary,
    remediationPlan: corePayload.remediationPlan,
    workspace: corePayload.workspace,
  }
  // Layer 3 ICP filtering — icpSegment vine din white-label config per org.
  // Fără el, sidebar-ul cade pe fallback DPO chiar și pentru cabinet-fiscal.
  //
  // Mircea fix (2026-05-11): pentru partner, ICP-ul vine din CABINET's own org
  // (membership cu role owner), NU din client org curent. Altfel, cabinet-fiscal
  // intrând în client org vede "Instrumente DPO" pentru că client org n-are
  // white-label configurat.
  let icpSegment: import("@/lib/server/white-label").IcpSegment | null = null
  let cabinetOrgId: string | null = null
  if (session) {
    try {
      // Try cabinet's home org first (owner role membership)
      let lookupOrgId = session.orgId
      if (userMode === "partner") {
        const memberships = await listUserMemberships(session.userId)
        const ownerMembership = memberships.find((m) => m.role === "owner")
        if (ownerMembership) lookupOrgId = ownerMembership.orgId
      }
      cabinetOrgId = lookupOrgId
      const wl = await getWhiteLabelConfig(lookupOrgId)
      icpSegment = wl.icpSegment ?? null
    } catch {
      icpSegment = null
    }
  }

  // Faza 1.5c (2026-05-12): routing guard cabinet-fiscal incomplete →
  // /onboarding/setup-fiscal. Mircea NU vede dashboard fiscal gol fără context;
  // setup-fiscal îl duce prin import → ANAF → scan → wow moment cu findings reale.
  if (session && icpSegment === "cabinet-fiscal" && cabinetOrgId) {
    try {
      const memberships = await listUserMemberships(session.userId)
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
    } catch {
      // Defensive fallback — dacă state lookup eșuează, lasă request-ul să
      // treacă (mai bine să vadă dashboard gol decât să fie blocat).
    }
  }

  const initialUser = session
    ? {
        email: session.email,
        orgName: session.orgName,
        orgId: session.orgId,
        role: session.role,
        membershipId: session.membershipId ?? null,
        userMode: userMode ?? null,
        workspaceMode: (session.workspaceMode ?? "org") as "org" | "portfolio",
        icpSegment,
      }
    : null

  return (
    <TooltipProvider delayDuration={150}>
      <CockpitProvider initialData={initialCockpitData}>
        <DashboardShell initialUser={initialUser} initialMemberships={memberships}>
          {children}
        </DashboardShell>
      </CockpitProvider>
    </TooltipProvider>
  )
}
