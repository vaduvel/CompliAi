"use client"

import { DashboardShell, type DashboardShellCurrentUser, type DashboardShellUserMembership } from "@/components/compliscan/dashboard-shell"

export function PortfolioShell({
  children,
  initialUser,
  initialMemberships,
}: {
  children: React.ReactNode
  initialUser: DashboardShellCurrentUser
  initialMemberships: DashboardShellUserMembership[]
}) {
  return (
    <DashboardShell initialUser={initialUser} initialMemberships={initialMemberships}>
      {children}
    </DashboardShell>
  )
}
