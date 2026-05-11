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
    if (!onboardingDone) {
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
  let icpSegment: import("@/lib/server/white-label").IcpSegment | null = null
  if (session) {
    try {
      const wl = await getWhiteLabelConfig(session.orgId)
      icpSegment = wl.icpSegment ?? null
    } catch {
      icpSegment = null
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
