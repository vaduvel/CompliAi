import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_COOKIE, resolveUserMode, verifySessionToken } from "@/lib/server/auth"
import { readState } from "@/lib/server/mvp-store"
import { OnboardingForm } from "@/components/compliscan/onboarding-form"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  const session = token ? verifySessionToken(token) : null

  if (!session) {
    redirect("/login")
  }

  const userMode = await resolveUserMode(session)
  const state = await readState()
  const hasCompletedOnboarding = Boolean(state.orgProfile && state.applicability)

  if (userMode === "viewer") {
    redirect("/dashboard")
  }

  if (userMode && hasCompletedOnboarding) {
    if (session.workspaceMode === "portfolio" && userMode === "partner") {
      redirect("/portfolio")
    }
    redirect("/dashboard")
  }

  return <OnboardingForm initialUserMode={userMode ?? null} orgName={session.orgName} />
}
