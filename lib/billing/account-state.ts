// S3.4 — Account state derivation from plan + trial dates.
// Pure function: no I/O. Used by API, middleware, and UI.

import type { OrgPlan } from "@/lib/shared/plan-constants"

export type AccountState =
  | "trial_active"     // day 1-10
  | "trial_expiring"   // day 11-14, progressive warning
  | "trial_expired"    // day 15+, no upgrade, read-only 90 days
  | "pro_active"
  | "pro_grace"        // failed payment, 7 days grace
  | "partner_active"
  | "free"

export type AccountStateInfo = {
  state: AccountState
  daysRemaining: number | null
  trialEndsAtISO: string | null
  isReadOnly: boolean
  canExport: boolean
  showBanner: boolean
  bannerSeverity: "info" | "warning" | "error" | null
  bannerMessage: string | null
}

export function deriveAccountState(
  plan: OrgPlan,
  trialEndsAtISO: string | null | undefined,
  nowISO?: string
): AccountStateInfo {
  const now = nowISO ? new Date(nowISO) : new Date()

  // Active paid plans
  if (plan === "partner") {
    return {
      state: "partner_active",
      daysRemaining: null,
      trialEndsAtISO: trialEndsAtISO ?? null,
      isReadOnly: false,
      canExport: true,
      showBanner: false,
      bannerSeverity: null,
      bannerMessage: null,
    }
  }

  if (plan === "pro") {
    // Could be a real pro subscription or an active trial
    if (trialEndsAtISO) {
      const trialEnd = new Date(trialEndsAtISO)
      const msRemaining = trialEnd.getTime() - now.getTime()
      const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000))

      if (daysRemaining > 10) {
        return {
          state: "trial_active",
          daysRemaining,
          trialEndsAtISO,
          isReadOnly: false,
          canExport: true,
          showBanner: false,
          bannerSeverity: null,
          bannerMessage: null,
        }
      }
      if (daysRemaining > 0) {
        return {
          state: "trial_expiring",
          daysRemaining,
          trialEndsAtISO,
          isReadOnly: false,
          canExport: true,
          showBanner: true,
          bannerSeverity: daysRemaining <= 3 ? "error" : "warning",
          bannerMessage:
            daysRemaining === 1
              ? "Perioada de trial expiră mâine. Fă upgrade pentru a păstra accesul complet."
              : `Mai ai ${daysRemaining} zile de trial. Fă upgrade pentru a păstra accesul complet.`,
        }
      }
    }

    // Pro without trial = paid pro
    if (!trialEndsAtISO) {
      return {
        state: "pro_active",
        daysRemaining: null,
        trialEndsAtISO: null,
        isReadOnly: false,
        canExport: true,
        showBanner: false,
        bannerSeverity: null,
        bannerMessage: null,
      }
    }
  }

  // Free plan — check if expired trial
  if (plan === "free" && trialEndsAtISO) {
    const trialEnd = new Date(trialEndsAtISO)
    const msExpired = now.getTime() - trialEnd.getTime()
    const daysExpired = Math.floor(msExpired / (24 * 60 * 60 * 1000))
    const dataRetentionDays = 90

    if (daysExpired >= 0 && daysExpired < dataRetentionDays) {
      return {
        state: "trial_expired",
        daysRemaining: dataRetentionDays - daysExpired,
        trialEndsAtISO,
        isReadOnly: true,
        canExport: true,
        showBanner: true,
        bannerSeverity: "error",
        bannerMessage: `Perioada de trial a expirat. Datele tale sunt accesibile read-only încă ${dataRetentionDays - daysExpired} zile. Exportă datele sau fă upgrade.`,
      }
    }
  }

  // Plain free
  return {
    state: "free",
    daysRemaining: null,
    trialEndsAtISO: trialEndsAtISO ?? null,
    isReadOnly: false,
    canExport: true,
    showBanner: false,
    bannerSeverity: null,
    bannerMessage: null,
  }
}
