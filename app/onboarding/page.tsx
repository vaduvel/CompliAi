import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_COOKIE, refreshSessionPayload, resolveUserMode, verifySessionToken } from "@/lib/server/auth"
import { OnboardingForm } from "@/components/compliscan/onboarding-form"
import { resolveOnboardingDestination } from "@/lib/compliscan/onboarding-destination"
import { loadOnboardingGateStateForOrg } from "@/lib/server/onboarding-gate"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  const verifiedSession = token ? verifySessionToken(token) : null
  const session = verifiedSession ? await refreshSessionPayload(verifiedSession) : null

  if (!session) {
    redirect("/login")
  }

  const userMode = await resolveUserMode(session)
  const { hasCompletedOnboarding } = await loadOnboardingGateStateForOrg(session.orgId)

  if (userMode === "viewer") {
    redirect("/dashboard")
  }

  if (userMode && hasCompletedOnboarding) {
    redirect(resolveOnboardingDestination(userMode).serverHref)
  }

  return <OnboardingForm initialUserMode={userMode ?? null} orgName={session.orgName} />
}
