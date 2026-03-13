import { cookies, headers } from "next/headers"

import type { WorkspaceContext } from "@/lib/compliance/types"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/auth"

function initialsFromName(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) return "CS"
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "CS"
}

export async function getOrgContext(): Promise<WorkspaceContext> {
  let orgId: string | undefined
  let orgName: string | undefined
  let userEmail: string | undefined
  let sessionOrgId: string | undefined
  let sessionOrgName: string | undefined
  let sessionEmail: string | undefined

  try {
    const h = await headers()
    orgId = h.get("x-compliscan-org-id") ?? undefined
    orgName = h.get("x-compliscan-org-name") ?? undefined
    userEmail = h.get("x-compliscan-user-email") ?? undefined

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
    const session = sessionToken ? verifySessionToken(sessionToken) : null
    sessionOrgId = session?.orgId
    sessionOrgName = session?.orgName
    sessionEmail = session?.email
  } catch {
    // Outside request context (e.g. build time)
  }

  const resolvedOrgName =
    orgName ||
    sessionOrgName ||
    process.env.COMPLISCAN_ORG_NAME?.trim() ||
    (process.env.NODE_ENV === "production"
      ? "Organizatie neconfigurata"
      : "Magazin Online S.R.L.")
  const workspaceOwner =
    userEmail ||
    sessionEmail ||
    process.env.COMPLISCAN_WORKSPACE_OWNER?.trim() ||
    (process.env.NODE_ENV === "production" ? "Owner neconfigurat" : "Ion Popescu")

  return {
    orgId:
      orgId ||
      sessionOrgId ||
      process.env.COMPLISCAN_ORG_ID?.trim() ||
      (process.env.NODE_ENV === "production" ? "org-unconfigured" : "org-local-workspace"),
    orgName: resolvedOrgName,
    workspaceLabel:
      process.env.COMPLISCAN_WORKSPACE_LABEL?.trim() ||
      (process.env.NODE_ENV === "production" ? "Workspace neconfigurat" : "Workspace local"),
    workspaceOwner,
    workspaceInitials:
      process.env.COMPLISCAN_WORKSPACE_INITIALS?.trim() || initialsFromName(workspaceOwner),
  }
}
