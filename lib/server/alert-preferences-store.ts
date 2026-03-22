import { createAdaptiveStorage } from "@/lib/server/storage-adapter"

export type AlertEventType = "drift.detected" | "task.overdue" | "alert.critical" | "score.dropped"

export type AlertPreferences = {
  emailEnabled: boolean
  emailAddress: string
  webhookEnabled: boolean
  webhookUrl: string
  events: Record<AlertEventType, boolean>
  updatedAtISO: string
  weeklyDigestEnabled?: boolean  // Sprint 13 — opțional, backward-safe
}

export const DEFAULT_ALERT_PREFERENCES: Omit<AlertPreferences, "updatedAtISO"> = {
  emailEnabled: false,
  emailAddress: "",
  webhookEnabled: false,
  webhookUrl: "",
  events: {
    "drift.detected": true,
    "task.overdue": true,
    "alert.critical": true,
    "score.dropped": true,
  },
  weeklyDigestEnabled: true,  // Default activat
}

const alertPrefsStorage = createAdaptiveStorage<AlertPreferences>("alert-prefs", "alert_preferences")

export async function readAlertPreferences(orgId: string): Promise<AlertPreferences> {
  try {
    const stored = await alertPrefsStorage.read(orgId)
    if (stored) return stored
  } catch (err) {
    // Storage backend unavailable (e.g. Supabase table missing) — return defaults
    console.warn(`[alert-prefs] Read failed for ${orgId}, using defaults:`, err instanceof Error ? err.message : err)
  }
  return {
    ...DEFAULT_ALERT_PREFERENCES,
    events: { ...DEFAULT_ALERT_PREFERENCES.events },
    updatedAtISO: new Date().toISOString(),
  }
}

export async function writeAlertPreferences(
  orgId: string,
  prefs: AlertPreferences
): Promise<AlertPreferences> {
  const updated: AlertPreferences = { ...prefs, updatedAtISO: new Date().toISOString() }
  try {
    await alertPrefsStorage.write(orgId, updated)
  } catch (err) {
    // Storage backend unavailable — log but don't crash, prefs will reset next read
    console.warn(`[alert-prefs] Write failed for ${orgId}:`, err instanceof Error ? err.message : err)
  }
  return updated
}
