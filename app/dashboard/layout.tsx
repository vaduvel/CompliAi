import { cookies } from "next/headers"

import { CockpitProvider } from "@/components/compliscan/use-cockpit"
import { DashboardShell } from "@/components/compliscan/dashboard-shell"
import { SESSION_COOKIE, listUserMemberships, verifySessionToken } from "@/lib/server/auth"
import { buildDashboardCorePayload } from "@/lib/server/dashboard-response"
import { readState } from "@/lib/server/mvp-store"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, cookieStore] = await Promise.all([readState(), cookies()])
  const corePayload = await buildDashboardCorePayload(state)
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
  const session = sessionToken ? verifySessionToken(sessionToken) : null
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
      }
    : null

  return (
    <CockpitProvider initialData={initialCockpitData}>
      <DashboardShell initialUser={initialUser} initialMemberships={memberships}>
        {children}
      </DashboardShell>
    </CockpitProvider>
  )
}
