// GET /api/notifications — list + unread count
// POST /api/notifications/mark-all-read — mark all as read
// Sprint 3.2 + fiscal events synthesizer (N1, 2026-05-11): cron jobs write to
// state.events not to notifications-store, so we merge the most recent fiscal
// compliance events into the response so the bell + notificari page surface them.

import { NextResponse } from "next/server"

import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import {
  safeListNotifications,
  safeCountUnread,
  safeMarkAllRead,
  type AppNotification,
  type NotificationType,
} from "@/lib/server/notifications-store"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

const FISCAL_EVENT_PREFIXES = [
  "fiscal.",
  "anaf.",
  "spv.",
  "efactura.",
  "integration.efactura",
] as const

function isFiscalEvent(type: string): boolean {
  return FISCAL_EVENT_PREFIXES.some((prefix) => type.startsWith(prefix))
}

function notificationFromEvent(event: {
  id?: string
  type?: string
  message?: string
  entityType?: string
  entityId?: string
  createdAtISO?: string
}): AppNotification | null {
  if (!event.type || !isFiscalEvent(event.type)) return null
  const lower = event.type.toLowerCase()
  const notifType: NotificationType =
    lower.includes("deadline") || lower.includes("expir")
      ? "anaf_deadline"
      : lower.includes("alert") || lower.includes("error") || lower.includes("respins")
        ? "fiscal_alert"
        : "anaf_signal"

  const linkBase = lower.includes("cert.spv")
    ? "/dashboard/fiscal/integrari"
    : lower.includes("pfa.form082")
      ? "/pentru/pfa-form-082"
      : lower.includes("p300") || lower.includes("etva")
        ? "/dashboard/fiscal/tva-declaratii"
        : lower.includes("retry_queue") || lower.includes("efactura")
          ? "/dashboard/fiscal/transmitere"
          : "/dashboard/fiscal"

  return {
    id: event.id ?? `fiscal-evt-${Math.random().toString(36).slice(2, 10)}`,
    type: notifType,
    title: humanizeEventType(event.type),
    message: event.message ?? "(eveniment fiscal fără descriere)",
    linkTo: linkBase,
    createdAt: event.createdAtISO ?? new Date().toISOString(),
  }
}

function humanizeEventType(type: string): string {
  return type
    .replace(/^fiscal\./, "")
    .replace(/^anaf\./, "ANAF: ")
    .replace(/^spv\./, "SPV: ")
    .replace(/^efactura\./, "e-Factura: ")
    .replace(/^integration\.efactura/, "e-Factura")
    .replace(/[._]/g, " ")
    .replace(/^./, (s) => s.toUpperCase())
}

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/notifications")

  try {
    const session = await requireFreshAuthenticatedSession(request, "citirea notificărilor")
    const [baseNotifications, unread, state] = await Promise.all([
      safeListNotifications(session.orgId),
      safeCountUnread(session.orgId),
      readFreshStateForOrg(session.orgId, session.orgName).catch(() => null),
    ])

    // Fiscal events synthesizer — pull most recent fiscal events from state.events
    const fiscalSynth: AppNotification[] = (state?.events ?? [])
      .filter((evt) => evt && typeof evt === "object" && "type" in evt)
      .map((evt) =>
        notificationFromEvent({
          id: (evt as { id?: string }).id,
          type: (evt as { type?: string }).type,
          message: (evt as { message?: string }).message,
          entityType: (evt as { entityType?: string }).entityType,
          entityId: (evt as { entityId?: string }).entityId,
          createdAtISO: (evt as { createdAtISO?: string }).createdAtISO,
        }),
      )
      .filter((n): n is AppNotification => n !== null)
      .slice(0, 50)

    // De-dupe: prefer base notification if same id already exists
    const baseIds = new Set(baseNotifications.map((n) => n.id))
    const merged = [...baseNotifications, ...fiscalSynth.filter((n) => !baseIds.has(n.id))]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 100)
    const mergedUnread = unread + fiscalSynth.filter((n) => !n.readAt).length

    return NextResponse.json(
      { notifications: merged, unread: mergedUnread },
      withRequestIdHeaders(undefined, context),
    )
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code, undefined, context)
    await logRouteError(context, error, {
      code: "NOTIFICATIONS_READ_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError("Nu am putut încărca notificările.", 500, "NOTIFICATIONS_READ_FAILED", undefined, context)
  }
}

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/notifications")

  try {
    const session = await requireFreshAuthenticatedSession(request, "actualizarea notificărilor")

    const body = (await request.json()) as { action?: string }
    if (body.action !== "mark-all-read") {
      return jsonError("Acțiune necunoscută.", 400, "INVALID_ACTION", undefined, context)
    }

    await safeMarkAllRead(session.orgId)
    return NextResponse.json({ ok: true }, withRequestIdHeaders(undefined, context))
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code, undefined, context)
    await logRouteError(context, error, {
      code: "NOTIFICATIONS_UPDATE_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError("Nu am putut actualiza notificările.", 500, "NOTIFICATIONS_UPDATE_FAILED", undefined, context)
  }
}
