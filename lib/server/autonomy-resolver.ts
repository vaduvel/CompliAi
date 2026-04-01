/**
 * Autonomy Resolver — determines whether an action should be
 * auto-executed, semi-auto (24h window), or manual approval.
 *
 * Reads from user_autonomy_settings table in Supabase.
 * Falls back to sensible defaults when no settings exist.
 */
import type { PendingActionType, RiskLevel } from "./approval-queue"
import { hasSupabaseConfig, supabaseSelect, supabaseUpsert } from "./supabase-rest"

// ── Types ────────────────────────────────────────────────────────────────────

export type AutonomyPolicy = "auto" | "semi" | "manual"

export type AutonomySettings = {
  lowRiskPolicy: AutonomyPolicy
  mediumRiskPolicy: AutonomyPolicy
  highRiskPolicy: AutonomyPolicy
  criticalRiskPolicy: AutonomyPolicy
  categoryOverrides: Partial<Record<PendingActionType, AutonomyPolicy>>
}

type AutonomySettingsRow = {
  id: string
  user_id: string
  org_id: string
  low_risk_policy: string
  medium_risk_policy: string
  high_risk_policy: string
  critical_risk_policy: string
  category_overrides: Record<string, string>
  updated_at: string
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AutonomySettings = {
  lowRiskPolicy: "auto",
  mediumRiskPolicy: "semi",
  highRiskPolicy: "manual",
  criticalRiskPolicy: "manual",
  categoryOverrides: {},
}

// Hardcoded overrides that cannot be changed by the user
const LOCKED_OVERRIDES: Partial<Record<PendingActionType, AutonomyPolicy>> = {
  submit_anaf: "manual", // NEVER auto-submit to ANAF
}

// These action types cannot be set to "auto" regardless of risk level
const NEVER_AUTO: PendingActionType[] = ["submit_anaf"]

// ── Local fallback ───────────────────────────────────────────────────────────

const localSettings = new Map<string, AutonomySettings>()

function localKey(userId: string, orgId: string): string {
  return `${userId}:${orgId}`
}

// ── Core functions ───────────────────────────────────────────────────────────

export async function getAutonomySettings(
  userId: string,
  orgId: string
): Promise<AutonomySettings> {
  if (hasSupabaseConfig()) {
    const rows = await supabaseSelect<AutonomySettingsRow>(
      "user_autonomy_settings",
      `select=*&user_id=eq.${userId}&org_id=eq.${orgId}&limit=1`,
      "public"
    )

    if (rows[0]) {
      return {
        lowRiskPolicy: rows[0].low_risk_policy as AutonomyPolicy,
        mediumRiskPolicy: rows[0].medium_risk_policy as AutonomyPolicy,
        highRiskPolicy: rows[0].high_risk_policy as AutonomyPolicy,
        criticalRiskPolicy: rows[0].critical_risk_policy as AutonomyPolicy,
        categoryOverrides: (rows[0].category_overrides ?? {}) as Partial<
          Record<PendingActionType, AutonomyPolicy>
        >,
      }
    }
  }

  return localSettings.get(localKey(userId, orgId)) ?? { ...DEFAULT_SETTINGS }
}

export async function saveAutonomySettings(
  userId: string,
  orgId: string,
  settings: Partial<AutonomySettings>
): Promise<AutonomySettings> {
  const current = await getAutonomySettings(userId, orgId)
  const merged: AutonomySettings = {
    lowRiskPolicy: settings.lowRiskPolicy ?? current.lowRiskPolicy,
    mediumRiskPolicy: settings.mediumRiskPolicy ?? current.mediumRiskPolicy,
    highRiskPolicy: settings.highRiskPolicy ?? current.highRiskPolicy,
    criticalRiskPolicy: "manual", // Always locked
    categoryOverrides: {
      ...current.categoryOverrides,
      ...settings.categoryOverrides,
      ...LOCKED_OVERRIDES, // Always override locked values
    },
  }

  // Enforce: critical can never be "auto"
  if (merged.criticalRiskPolicy === "auto") merged.criticalRiskPolicy = "manual"

  // Enforce: NEVER_AUTO types can never be "auto"
  for (const type of NEVER_AUTO) {
    if (merged.categoryOverrides[type] === "auto") {
      merged.categoryOverrides[type] = "manual"
    }
  }

  if (hasSupabaseConfig()) {
    await supabaseUpsert(
      "user_autonomy_settings",
      {
        user_id: userId,
        org_id: orgId,
        low_risk_policy: merged.lowRiskPolicy,
        medium_risk_policy: merged.mediumRiskPolicy,
        high_risk_policy: merged.highRiskPolicy,
        critical_risk_policy: merged.criticalRiskPolicy,
        category_overrides: merged.categoryOverrides,
        updated_at: new Date().toISOString(),
      },
      "public"
    )
  } else {
    localSettings.set(localKey(userId, orgId), merged)
  }

  return merged
}

/**
 * Core resolver: given an action type and risk level,
 * returns the autonomy policy that should apply.
 */
export async function resolvePolicy(params: {
  userId: string
  orgId: string
  actionType: PendingActionType
  riskLevel: RiskLevel
}): Promise<AutonomyPolicy> {
  // Check locked overrides first (e.g., submit_anaf is always manual)
  if (LOCKED_OVERRIDES[params.actionType]) {
    return LOCKED_OVERRIDES[params.actionType]!
  }

  const settings = await getAutonomySettings(params.userId, params.orgId)

  // Check category overrides
  const categoryOverride = settings.categoryOverrides[params.actionType]
  if (categoryOverride) return categoryOverride

  // Fall back to risk level policy
  switch (params.riskLevel) {
    case "low":
      return settings.lowRiskPolicy
    case "medium":
      return settings.mediumRiskPolicy
    case "high":
      return settings.highRiskPolicy
    case "critical":
      return settings.criticalRiskPolicy
    default:
      return "manual"
  }
}

/**
 * Semi-auto expiry: hours before a "semi" action auto-approves.
 */
export const SEMI_AUTO_EXPIRY_HOURS = 24
