import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_COOKIE, resolveUserMode, verifySessionToken } from "@/lib/server/auth"
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
  if (userMode) {
    redirect("/dashboard")
  }

  return <OnboardingForm />
}
