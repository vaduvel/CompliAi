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
import { loadOnboardingGateState } from "@/lib/server/onboarding-gate"

function isDemoSession(session: { userId: string; orgId: string }) {
  return session.userId.startsWith("demo-user-") || session.orgId.startsWith("org-demo-")
}

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [{ state, hasCompletedOnboarding }, cookieStore] = await Promise.all([
    loadOnboardingGateState(),
    cookies(),
  ])
  const corePayload = await buildDashboardCorePayload(state)
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
  const verifiedSession = sessionToken ? verifySessionToken(sessionToken) : null
  const session = verifiedSession ? await refreshSessionPayload(verifiedSession) : null

  const userMode = session && !isDemoSession(session) ? await resolveUserMode(session) : null
  const onboardingDone = Boolean(userMode && hasCompletedOnboarding)

  if (session && !isDemoSession(session)) {
    if (!onboardingDone) {
      redirect("/onboarding")
    }
    if (session.workspaceMode === "portfolio" && userMode === "partner") {
      redirect("/portfolio")
    }
  }
  const memberships = session ? await listUserMemberships(session.userId) : []
  const initialCockpitData = {
    state: corePayload.state,
    summary: corePayload.summary,
    remediationPlan: corePayload.remediationPlan,
    workspace: corePayload.workspace,
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
