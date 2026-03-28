import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { resolveOnboardingDestination } from "@/lib/compliscan/onboarding-destination"
import { SESSION_COOKIE, resolveUserMode, verifySessionToken } from "@/lib/server/auth"

// Ecranul "Primul snapshot este gata" a fost eliminat.
// Linkurile vechi aterizează direct în suprafața corectă pentru rolul curent.
export default async function OnboardingFinishPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  const session = token ? verifySessionToken(token) : null

  if (!session) {
    redirect("/login")
  }

  const userMode = await resolveUserMode(session)
  redirect(resolveOnboardingDestination(userMode ?? null).serverHref)
}
