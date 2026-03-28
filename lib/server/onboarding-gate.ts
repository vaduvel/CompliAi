import type { ComplianceState } from "@/lib/compliance/types"
import { readFreshState } from "@/lib/server/mvp-store"

type OnboardingGateState = Pick<ComplianceState, "orgProfile" | "applicability">

export function hasCompletedOnboarding(state: OnboardingGateState) {
  return Boolean(state.orgProfile && state.applicability)
}

export async function loadOnboardingGateState(
  loadState: () => Promise<ComplianceState> = readFreshState
) {
  const state = await loadState()
  return {
    state,
    hasCompletedOnboarding: hasCompletedOnboarding(state),
  }
}
