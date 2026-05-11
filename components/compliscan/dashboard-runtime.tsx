"use client"

import { createContext, useContext } from "react"

import type { UserMode, UserRole, WorkspaceMode } from "@/lib/server/auth"
import type { IcpSegment } from "@/lib/server/white-label"
import type { AccessMode, SubFlag } from "@/lib/compliscan/icp-modules"

export type DashboardRuntimeUser = {
  email: string
  orgName: string
  orgId: string
  role: UserRole
  membershipId: string | null
  userMode: UserMode | null
  workspaceMode: WorkspaceMode
  // ICP filtering (Layer 3 din IA spec) — populat din white-label config la load.
  // null = fallback safe (no filter aplicat, sidebar vede tot ca acum).
  icpSegment?: IcpSegment | null
  subFlag?: SubFlag | null
  accessMode?: AccessMode
} | null

export type DashboardRuntimeMembership = {
  membershipId: string
  orgId: string
  orgName: string
  role: UserRole
  createdAtISO: string
  status: "active" | "inactive"
}

const DashboardRuntimeContext = createContext<DashboardRuntimeUser>(null)

export function DashboardRuntimeProvider({
  user,
  children,
}: {
  user: DashboardRuntimeUser
  children: React.ReactNode
}) {
  return <DashboardRuntimeContext.Provider value={user}>{children}</DashboardRuntimeContext.Provider>
}

export function useDashboardRuntime() {
  return useContext(DashboardRuntimeContext)
}
