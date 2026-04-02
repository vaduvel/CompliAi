// app/api/feedback/route.ts
// V4.4.6 — Micro-feedback endpoint.
// Stores thumbs up/down + context in analytics_events.

import { NextResponse } from "next/server"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { trackEvent } from "@/lib/server/analytics"

export async function POST(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "trimiterea feedback-ului")

    const body = (await request.json()) as { context?: string; value?: string }
    const context = typeof body.context === "string" ? body.context : "general"
    const value = body.value === "up" || body.value === "down" ? body.value : "up"

    void trackEvent(session.orgId, "submitted_feedback", {
      feedbackContext: context,
      feedbackValue: value,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ ok: false, code: error.code }, { status: error.status })
    }
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
