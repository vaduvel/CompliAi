// app/api/analytics/track/route.ts
// Client-side analytics endpoint. Client components POST here;
// this calls the server-side trackEvent() with the session's orgId.

import { NextResponse } from "next/server"
import { readSessionFromRequest } from "@/lib/server/auth"
import { trackEvent, type AnalyticsEvent } from "@/lib/server/analytics"

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return NextResponse.json({ ok: false }, { status: 401 })

    const body = (await request.json()) as { event?: string; properties?: Record<string, string | number | boolean> }
    if (!body.event) return NextResponse.json({ ok: false }, { status: 400 })

    void trackEvent(session.orgId, body.event as AnalyticsEvent, body.properties)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
