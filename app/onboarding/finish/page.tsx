import { redirect } from "next/navigation"

// Ecranul "Primul snapshot este gata" a fost eliminat (2026-03-27).
// Onboarding-ul trimite direct la /dashboard după completare.
// Orice link vechi sau bookmark spre /onboarding/finish aterizează direct pe snapshotul real.
export default function OnboardingFinishPage() {
  redirect("/dashboard")
}
