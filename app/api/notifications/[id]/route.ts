// PATCH /api/notifications/[id] — mark notification as read
// Sprint 3.2

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { markNotificationRead } from "@/lib/server/notifications-store"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "marcarea notificării ca citită")

    const { id } = await params
    const notif = await markNotificationRead(session.orgId, id)
    if (!notif) return jsonError("Notificarea nu a fost găsită.", 404, "NOT_FOUND")

    return NextResponse.json({ notification: notif })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut actualiza notificarea.", 500, "NOTIFICATION_UPDATE_FAILED")
  }
}
