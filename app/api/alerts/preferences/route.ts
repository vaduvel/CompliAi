// Alert notification preferences — per-org GET/POST
// Stored in .data/alert-prefs-{orgId}.json

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import {
  readAlertPreferences,
  writeAlertPreferences,
  type AlertPreferences,
} from "@/lib/server/alert-preferences-store"

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "citirea preferințelor de alertă")
    const prefs = await readAlertPreferences(session.orgId)
    return NextResponse.json({ prefs })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut incarca preferintele de notificare.", 500, "ALERT_PREFS_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "salvarea preferințelor de alertă")

    const body = (await request.json()) as Partial<AlertPreferences>

    // Validate webhook URL when enabled
    if (body.webhookEnabled && body.webhookUrl) {
      try {
        const parsed = new URL(body.webhookUrl)
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return jsonError("URL webhook invalid — necesita http sau https.", 400, "INVALID_WEBHOOK_URL")
        }
      } catch {
        return jsonError("URL webhook invalid.", 400, "INVALID_WEBHOOK_URL")
      }
    }

    const current = await readAlertPreferences(session.orgId)
    const merged: AlertPreferences = {
      emailEnabled: body.emailEnabled ?? current.emailEnabled,
      emailAddress: (body.emailAddress ?? current.emailAddress).trim(),
      webhookEnabled: body.webhookEnabled ?? current.webhookEnabled,
      webhookUrl: (body.webhookUrl ?? current.webhookUrl).trim(),
      events: { ...current.events, ...body.events },
      updatedAtISO: new Date().toISOString(),
    }

    const saved = await writeAlertPreferences(session.orgId, merged)
    return NextResponse.json({ prefs: saved })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut salva preferintele de notificare.", 500, "ALERT_PREFS_WRITE_FAILED")
  }
}
