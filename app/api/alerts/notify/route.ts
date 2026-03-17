// Dispatch alert notification for an org-level event.
// Called internally from scan/drift/task workflows — not directly by the user.
//
// POST body: { event: AlertEventType, orgId: string, payload: Record<string, unknown> }
// Auth: requires valid session (or internal server-to-server call with same cookie)

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import {
  readAlertPreferences,
  type AlertEventType,
} from "@/lib/server/alert-preferences-store"
import { sendEmailAlert } from "@/lib/server/email-alerts"

type NotifyRequestBody = {
  event: AlertEventType
  orgId: string
  payload?: Record<string, unknown>
}

type DispatchResult = {
  dispatched: boolean
  channels: string[]
  skipped: string[]
}

async function dispatchWebhook(
  webhookUrl: string,
  event: AlertEventType,
  orgId: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const body = JSON.stringify({
      event,
      orgId,
      timestamp: new Date().toISOString(),
      ...payload,
    })

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "CompliAI-Alerts/1.0",
      },
      body,
      signal: AbortSignal.timeout(8_000),
    })

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "fetch failed" }
  }
}

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as Partial<NotifyRequestBody>

    if (!body.event || !body.orgId) {
      return jsonError("Campuri obligatorii: event, orgId.", 400, "MISSING_FIELDS")
    }

    const VALID_EVENTS: AlertEventType[] = ["drift.detected", "task.overdue", "alert.critical"]
    if (!VALID_EVENTS.includes(body.event)) {
      return jsonError(`Eveniment necunoscut: ${body.event}`, 400, "UNKNOWN_EVENT")
    }

    const prefs = await readAlertPreferences(body.orgId)
    const eventEnabled = prefs.events[body.event] ?? false
    const payload = body.payload ?? {}

    const result: DispatchResult = { dispatched: false, channels: [], skipped: [] }

    if (!eventEnabled) {
      result.skipped.push("event-disabled")
      return NextResponse.json(result)
    }

    // ── Email ──────────────────────────────────────────────────────────────────
    if (prefs.emailEnabled && prefs.emailAddress) {
      const emailResult = await sendEmailAlert(prefs.emailAddress, body.event, body.orgId, payload)
      if (emailResult.ok) {
        result.channels.push(emailResult.channel === "resend" ? "email:resend" : "email:console")
        result.dispatched = true
      } else {
        result.skipped.push(`email-error:${emailResult.error ?? "unknown"}`)
      }
    } else {
      result.skipped.push("email-disabled")
    }

    // ── Webhook ────────────────────────────────────────────────────────────────
    if (prefs.webhookEnabled && prefs.webhookUrl) {
      const wh = await dispatchWebhook(prefs.webhookUrl, body.event, body.orgId, payload)
      if (wh.ok) {
        result.channels.push("webhook")
        result.dispatched = true
      } else {
        result.skipped.push(`webhook-error:${wh.error ?? "unknown"}`)
      }
    } else {
      result.skipped.push("webhook-disabled")
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la trimiterea notificarii.", 500, "NOTIFY_FAILED")
  }
}
