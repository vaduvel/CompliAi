"use client"

import { createContext, useContext } from "react"

import type { UserMode, UserRole, WorkspaceMode } from "@/lib/server/auth"

export type DashboardRuntimeUser = {
  email: string
  orgName: string
  orgId: string
  role: UserRole
  membershipId: string | null
  userMode: UserMode | null
  workspaceMode: WorkspaceMode
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
