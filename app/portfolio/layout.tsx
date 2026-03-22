import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  SESSION_COOKIE,
  getUserMode,
  refreshSessionPayload,
  verifySessionToken,
} from "@/lib/server/auth"

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

  const userMode = await getUserMode(session.userId)

  if (userMode !== "partner" || session.workspaceMode !== "portfolio") {
    redirect("/dashboard")
  }

  return <>{children}</>
}
