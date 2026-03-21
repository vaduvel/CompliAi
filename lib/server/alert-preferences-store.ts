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
  const stored = await alertPrefsStorage.read(orgId)
  if (stored) return stored
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
  await alertPrefsStorage.write(orgId, updated)
  return updated
}
