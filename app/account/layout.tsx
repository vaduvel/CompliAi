import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { DashboardShell } from "@/components/compliscan/dashboard-shell"
import {
  SESSION_COOKIE,
  getUserMode,
  listUserMemberships,
  refreshSessionPayload,
  verifySessionToken,
} from "@/lib/server/auth"

export const dynamic = "force-dynamic"

export default async function AccountLayout({
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

  const userMode = await getUserMode(session.userId)
  if (!userMode) {
    redirect("/onboarding")
  }

  const memberships = await listUserMemberships(session.userId)
  const initialUser = {
    email: session.email,
    orgName: session.orgName,
    orgId: session.orgId,
    role: session.role,
    membershipId: session.membershipId ?? null,
    userMode,
    workspaceMode: session.workspaceMode ?? "org",
  }

  return (
    <DashboardShell initialUser={initialUser} initialMemberships={memberships}>
      {children}
    </DashboardShell>
  )
}
