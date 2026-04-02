import { cookies, headers } from "next/headers"

import type { WorkspaceContext } from "@/lib/compliance/types"
import { readSessionFromRequest, SESSION_COOKIE, verifySessionToken } from "@/lib/server/auth"

function initialsFromName(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) return "CS"
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "CS"
}

export type GetOrgContextOptions = {
  request?: Request | null
  allowHeaderFallback?: boolean
}

export async function getOrgContext(
  options: GetOrgContextOptions = {}
): Promise<WorkspaceContext> {
  const allowHeaderFallback = options.allowHeaderFallback === true
  let headerOrgId: string | undefined
  let headerOrgName: string | undefined
  let headerUserEmail: string | undefined
  let sessionOrgId: string | undefined
  let sessionOrgName: string | undefined
  let sessionEmail: string | undefined
  let sessionRole: WorkspaceContext["userRole"] = undefined  // Sprint 6

  try {
    let session = options.request ? readSessionFromRequest(options.request) : null
    if (!session) {
      const cookieStore = await cookies()
      const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
      session = sessionToken ? verifySessionToken(sessionToken) : null
    }
    sessionOrgId = session?.orgId
    sessionOrgName = session?.orgName
    sessionEmail = session?.email
    sessionRole = session?.role ?? undefined

    if (allowHeaderFallback) {
      const h = options.request ? options.request.headers : await headers()
      headerOrgId = h.get("x-compliscan-org-id") ?? undefined
      headerOrgName = h.get("x-compliscan-org-name") ?? undefined
      headerUserEmail = h.get("x-compliscan-user-email") ?? undefined
    }
  } catch {
    // Outside request context (e.g. build time)
  }

  const resolvedOrgName =
    sessionOrgName ||
    headerOrgName ||
    process.env.COMPLISCAN_ORG_NAME?.trim() ||
    (process.env.NODE_ENV === "production"
      ? "Organizatie neconfigurata"
      : "Magazin Online S.R.L.")
  const workspaceOwner =
    sessionEmail ||
    headerUserEmail ||
    process.env.COMPLISCAN_WORKSPACE_OWNER?.trim() ||
    (process.env.NODE_ENV === "production" ? "Owner neconfigurat" : "Ion Popescu")

  return {
    orgId:
      sessionOrgId ||
      headerOrgId ||
      process.env.COMPLISCAN_ORG_ID?.trim() ||
      (process.env.NODE_ENV === "production" ? "org-unconfigured" : "org-local-workspace"),
    orgName: resolvedOrgName,
    workspaceLabel:
      process.env.COMPLISCAN_WORKSPACE_LABEL?.trim() ||
      (process.env.NODE_ENV === "production" ? "Workspace neconfigurat" : "Workspace local"),
    workspaceOwner,
    workspaceInitials:
      process.env.COMPLISCAN_WORKSPACE_INITIALS?.trim() || initialsFromName(workspaceOwner),
    userRole: sessionRole,  // Sprint 6 — expune rolul în WorkspaceContext
  }
}
