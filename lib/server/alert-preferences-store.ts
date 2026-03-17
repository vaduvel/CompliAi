import { promises as fs } from "node:fs"
import path from "node:path"

const DATA_DIR = path.join(process.cwd(), ".data")

export type AlertEventType = "drift.detected" | "task.overdue" | "alert.critical"

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
  },
  weeklyDigestEnabled: true,  // Default activat
}

function getPrefsFile(orgId: string): string {
  return path.join(DATA_DIR, `alert-prefs-${orgId}.json`)
}

export async function readAlertPreferences(orgId: string): Promise<AlertPreferences> {
  try {
    const raw = await fs.readFile(getPrefsFile(orgId), "utf8")
    return JSON.parse(raw) as AlertPreferences
  } catch {
    return {
      ...DEFAULT_ALERT_PREFERENCES,
      events: { ...DEFAULT_ALERT_PREFERENCES.events },
      updatedAtISO: new Date().toISOString(),
    }
  }
}

export async function writeAlertPreferences(
  orgId: string,
  prefs: AlertPreferences
): Promise<AlertPreferences> {
  const updated: AlertPreferences = { ...prefs, updatedAtISO: new Date().toISOString() }
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(getPrefsFile(orgId), JSON.stringify(updated, null, 2), "utf8")
  return updated
}
