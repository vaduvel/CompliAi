"use client"

import type {
  DashboardRuntimeMembership as DashboardShellUserMembership,
  DashboardRuntimeUser as DashboardShellCurrentUser,
} from "@/components/compliscan/dashboard-runtime"
import { DashboardShell } from "@/components/compliscan/dashboard-shell"

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
