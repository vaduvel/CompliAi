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
  | "anaf_signal"          // Phase A — ANAF fiscal signal
  | "anaf_deadline"        // Phase A — ANAF response deadline
  | "fiscal_alert"         // Phase A — fiscal urgency alert

/** ANAF notification lifecycle status */
export type AnafNotificationStatus =
  | "primit"               // received from ANAF
  | "in_analiza"           // under internal review
  | "raspuns_trimis"       // response sent
  | "overdue"              // past deadline without response
  | "inchis"               // resolved / closed

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  message: string
  linkTo?: string
  readAt?: string          // ISO — undefined = unread
  createdAt: string        // ISO
  // ── Phase A: ANAF lifecycle fields (optional — only for anaf_* types) ────
  dueAtISO?: string        // deadline for response
  ownerId?: string         // assigned owner (email)
  anafStatus?: AnafNotificationStatus
  anafStatusUpdatedAtISO?: string
  sourceSignalId?: string  // links back to the originating signal
}

type NotificationsState = {
  notifications: AppNotification[]
}

const notifStorage = createAdaptiveStorage<NotificationsState>("notifications", "notifications_state")

const LEGACY_AGENT_PREFIX: Record<string, string> = {
  compliance_monitor: "Am verificat pentru tine",
  fiscal_sensor: "Compli a verificat facturile",
  document: "Ți-am pregătit un document",
  vendor_risk: "Am verificat furnizorii",
  regulatory_radar: "Schimbare legislativă detectată",
}

const STALE_ROUTE_MAP: Record<string, string> = {
  "/dashboard/scanari": "/dashboard/scan",
}

function uid() {
  return `notif-${Math.random().toString(36).slice(2, 10)}`
}

function stripLegacyPrefix(text: string): {
  prefix: string | null
  content: string
} {
  const trimmed = text.trim()
  const match = trimmed.match(/^\[([^\]]+)\]\s*(.+)$/)
  if (!match) {
    return { prefix: null, content: trimmed }
  }

  return {
    prefix: match[1]?.trim() ?? null,
    content: match[2]?.trim() ?? trimmed,
  }
}

function normalizeNotificationLink(linkTo: string | undefined, rawText: string): string | undefined {
  const normalizedLink = linkTo ? (STALE_ROUTE_MAP[linkTo] ?? linkTo) : undefined
  const text = rawText.toLowerCase()

  if (/f[aă]r[aă].*dovad[aă]/i.test(text)) {
    return "/dashboard/resolve"
  }

  if (/scor.+declin/i.test(text) || /problemele deschise/i.test(text)) {
    return normalizedLink ?? "/dashboard"
  }

  return normalizedLink
}

export function normalizeNotificationForDisplay(notification: AppNotification): AppNotification {
  const titleMeta = stripLegacyPrefix(notification.title)
  const messageMeta = stripLegacyPrefix(notification.message)
  const legacyLabel = titleMeta.prefix ? LEGACY_AGENT_PREFIX[titleMeta.prefix] : undefined

  const title =
    legacyLabel ??
    (titleMeta.prefix && titleMeta.content ? titleMeta.content : notification.title.trim())

  const message =
    legacyLabel
      ? messageMeta.content || titleMeta.content || notification.message.trim()
      : messageMeta.content || notification.message.trim()

  return {
    ...notification,
    title,
    message,
    linkTo: normalizeNotificationLink(notification.linkTo, `${notification.title} ${notification.message}`),
  }
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
    .map(normalizeNotificationForDisplay)
}

export async function safeListNotifications(orgId: string): Promise<AppNotification[]> {
  try {
    return await listNotifications(orgId)
  } catch {
    // Notifications are additive; missing storage should not break dashboard reads.
    return []
  }
}

export async function countUnread(orgId: string): Promise<number> {
  const state = await readState(orgId)
  return state.notifications.filter((n) => !n.readAt).length
}

export async function safeCountUnread(orgId: string): Promise<number> {
  try {
    return await countUnread(orgId)
  } catch {
    return 0
  }
}

export async function createNotification(
  orgId: string,
  input: Pick<AppNotification, "type" | "title" | "message"> & { linkTo?: string }
): Promise<AppNotification> {
  const state = await readState(orgId)
  const now = new Date().toISOString()
  const notif = normalizeNotificationForDisplay({
    id: uid(),
    type: input.type,
    title: input.title,
    message: input.message,
    ...(input.linkTo !== undefined && { linkTo: input.linkTo }),
    createdAt: now,
  })
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

export async function safeMarkAllRead(orgId: string): Promise<void> {
  try {
    await markAllRead(orgId)
  } catch {
    // Best-effort UX action; storage gaps should not block the route.
  }
}

// ── Phase A: ANAF notification lifecycle ──────────────────────────────────────

/**
 * Update ANAF notification status (lifecycle transition).
 */
export async function updateAnafNotificationStatus(
  orgId: string,
  notifId: string,
  newStatus: AnafNotificationStatus,
  ownerId?: string,
): Promise<AppNotification | null> {
  const state = await readState(orgId)
  const idx = state.notifications.findIndex((n) => n.id === notifId)
  if (idx === -1) return null

  const now = new Date().toISOString()
  const updated: AppNotification = {
    ...state.notifications[idx],
    anafStatus: newStatus,
    anafStatusUpdatedAtISO: now,
    ...(ownerId !== undefined && { ownerId }),
  }
  const notifications = [...state.notifications]
  notifications[idx] = updated
  await writeState(orgId, { notifications })
  return updated
}

/**
 * List ANAF notifications (filtered by anaf_* types).
 */
export async function listAnafNotifications(orgId: string): Promise<AppNotification[]> {
  const state = await readState(orgId)
  return state.notifications
    .filter((n) => n.type === "anaf_signal" || n.type === "anaf_deadline" || n.type === "fiscal_alert")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/**
 * List overdue ANAF notifications (past dueAtISO without response).
 */
export async function listOverdueAnafNotifications(orgId: string): Promise<AppNotification[]> {
  const state = await readState(orgId)
  const now = new Date().toISOString()
  return state.notifications
    .filter(
      (n) =>
        (n.type === "anaf_signal" || n.type === "anaf_deadline") &&
        n.dueAtISO &&
        n.dueAtISO < now &&
        n.anafStatus !== "raspuns_trimis" &&
        n.anafStatus !== "inchis",
    )
    .sort((a, b) => (a.dueAtISO ?? "").localeCompare(b.dueAtISO ?? ""))
}

/**
 * Create an ANAF notification with lifecycle fields.
 */
export async function createAnafNotification(
  orgId: string,
  input: {
    type: "anaf_signal" | "anaf_deadline" | "fiscal_alert"
    title: string
    message: string
    linkTo?: string
    dueAtISO?: string
    ownerId?: string
    sourceSignalId?: string
  },
): Promise<AppNotification> {
  return createNotification(orgId, {
    type: input.type,
    title: input.title,
    message: input.message,
    linkTo: input.linkTo,
  }).then(async (notif) => {
    // Patch in ANAF fields
    const state = await readState(orgId)
    const idx = state.notifications.findIndex((n) => n.id === notif.id)
    if (idx !== -1) {
      state.notifications[idx] = {
        ...state.notifications[idx],
        anafStatus: "primit",
        anafStatusUpdatedAtISO: new Date().toISOString(),
        ...(input.dueAtISO !== undefined && { dueAtISO: input.dueAtISO }),
        ...(input.ownerId !== undefined && { ownerId: input.ownerId }),
        ...(input.sourceSignalId !== undefined && { sourceSignalId: input.sourceSignalId }),
      }
      await writeState(orgId, state)
      return state.notifications[idx]
    }
    return notif
  })
}
