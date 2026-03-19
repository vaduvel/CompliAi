// GET /api/notifications — list + unread count
// POST /api/notifications/mark-all-read — mark all as read
// Sprint 3.2

import { NextResponse } from "next/server"

import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { listNotifications, countUnread, markAllRead } from "@/lib/server/notifications-store"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/notifications")

  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED", undefined, context)

    const { orgId } = await getOrgContext()
    const [notifications, unread] = await Promise.all([
      listNotifications(orgId),
      countUnread(orgId),
    ])

    return NextResponse.json({ notifications, unread }, withRequestIdHeaders(undefined, context))
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
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED", undefined, context)

    const body = (await request.json()) as { action?: string }
    if (body.action !== "mark-all-read") {
      return jsonError("Acțiune necunoscută.", 400, "INVALID_ACTION", undefined, context)
    }

    const { orgId } = await getOrgContext()
    await markAllRead(orgId)
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
