import { headers } from "next/headers"

import type { WorkspaceContext } from "@/lib/compliance/types"

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

  try {
    const h = await headers()
    orgId = h.get("x-compliscan-org-id") ?? undefined
    orgName = h.get("x-compliscan-org-name") ?? undefined
    userEmail = h.get("x-compliscan-user-email") ?? undefined
  } catch {
    // Outside request context (e.g. build time)
  }

  const resolvedOrgName =
    orgName || process.env.COMPLISCAN_ORG_NAME?.trim() || "Magazin Online S.R.L."
  const workspaceOwner =
    userEmail || process.env.COMPLISCAN_WORKSPACE_OWNER?.trim() || "Ion Popescu"

  return {
    orgId: orgId || process.env.COMPLISCAN_ORG_ID?.trim() || "org-demo-ion-popescu",
    orgName: resolvedOrgName,
    workspaceLabel: process.env.COMPLISCAN_WORKSPACE_LABEL?.trim() || "Workspace activ",
    workspaceOwner,
    workspaceInitials:
      process.env.COMPLISCAN_WORKSPACE_INITIALS?.trim() || initialsFromName(workspaceOwner),
  }
}
