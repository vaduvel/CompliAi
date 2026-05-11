import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { LegacyWorkspaceBridge } from "@/components/compliscan/legacy-workspace-bridge"
import { PortfolioShell } from "@/components/compliscan/portfolio-shell"
import {
  SESSION_COOKIE,
  listUserMemberships,
  refreshSessionPayload,
  resolveUserMode,
  verifySessionToken,
} from "@/lib/server/auth"
import { getWhiteLabelConfig } from "@/lib/server/white-label"

export const dynamic = "force-dynamic"

export default async function PortfolioLayout({
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

  const userMode = await resolveUserMode(session)

  if (userMode !== "partner") {
    redirect("/dashboard")
  }

  if (session.workspaceMode !== "portfolio") {
    return (
      <LegacyWorkspaceBridge
        title="Comutăm sesiunea în Portofoliu"
        description="Pregătim workspace-ul de cabinet ca să vezi toți clienții într-un singur loc."
        requestBody={{ workspaceMode: "portfolio" }}
        destinationHref="/portfolio"
        preserveCurrentPath
        fallbackHref="/dashboard"
        fallbackLabel="Înapoi la dashboard"
      />
    )
  }

  const memberships = await listUserMemberships(session.userId)

  // Sprint cleanup fiscal-first (2026-05-11): include icpSegment în initialUser
  // ca DashboardShell să poată aplica filter cabinet-fiscal pe sidebar/labels.
  let icpSegment: import("@/lib/server/white-label").IcpSegment | null = null
  try {
    const wl = await getWhiteLabelConfig(session.orgId)
    icpSegment = wl.icpSegment ?? null
  } catch {
    icpSegment = null
  }

  const initialUser = {
    email: session.email,
    orgName: session.orgName,
    orgId: session.orgId,
    role: session.role,
    membershipId: session.membershipId ?? null,
    userMode,
    workspaceMode: session.workspaceMode ?? "org",
    icpSegment,
  }

  return (
    <PortfolioShell initialUser={initialUser} initialMemberships={memberships}>
      {children}
    </PortfolioShell>
  )
}
