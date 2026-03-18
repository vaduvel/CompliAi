// Notifications store — per-org in-app notifications
// Sprint 3.2

import { createAdaptiveStorage } from "@/lib/server/storage-adapter"

export type NotificationType =
  | "finding_new"
  | "incident_deadline"
  | "document_generated"
  | "drift_detected"
  | "vendor_risk"
  | "info"

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  message: string
  linkTo?: string
  readAt?: string   // ISO — undefined = unread
  createdAt: string // ISO
}

type NotificationsState = {
  notifications: AppNotification[]
}

const notifStorage = createAdaptiveStorage<NotificationsState>("notifications", "notifications_state")

function uid() {
  return `notif-${Math.random().toString(36).slice(2, 10)}`
}

async function readState(orgId: string): Promise<NotificationsState> {
  return (await notifStorage.read(orgId)) ?? { notifications: [] }
}

async function writeState(orgId: string, state: NotificationsState): Promise<void> {
  await notifStorage.write(orgId, state)
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function listNotifications(orgId: string): Promise<AppNotification[]> {
  const state = await readState(orgId)
  // Sorted by createdAt desc, limit 50
  return [...state.notifications]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50)
}

export async function countUnread(orgId: string): Promise<number> {
  const state = await readState(orgId)
  return state.notifications.filter((n) => !n.readAt).length
}

export async function createNotification(
  orgId: string,
  input: Pick<AppNotification, "type" | "title" | "message"> & { linkTo?: string }
): Promise<AppNotification> {
  const state = await readState(orgId)
  const now = new Date().toISOString()
  const notif: AppNotification = {
    id: uid(),
    type: input.type,
    title: input.title,
    message: input.message,
    ...(input.linkTo !== undefined && { linkTo: input.linkTo }),
    createdAt: now,
  }
  // Keep max 100 notifications, discard oldest
  const notifications = [notif, ...state.notifications].slice(0, 100)
  await writeState(orgId, { notifications })
  return notif
}

export async function markNotificationRead(
  orgId: string,
  notifId: string
): Promise<AppNotification | null> {
  const state = await readState(orgId)
  const idx = state.notifications.findIndex((n) => n.id === notifId)
  if (idx === -1) return null
  const updated: AppNotification = {
    ...state.notifications[idx],
    readAt: new Date().toISOString(),
  }
  const notifications = [...state.notifications]
  notifications[idx] = updated
  await writeState(orgId, { notifications })
  return updated
}

export async function markAllRead(orgId: string): Promise<void> {
  const state = await readState(orgId)
  const now = new Date().toISOString()
  const notifications = state.notifications.map((n) =>
    n.readAt ? n : { ...n, readAt: now }
  )
  await writeState(orgId, { notifications })
}
