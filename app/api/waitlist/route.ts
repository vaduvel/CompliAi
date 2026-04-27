// S3.3 — Waitlist signup public API.
// NU cere auth (e public, designed pentru ICP segments coming-soon).
// Rate-limit basic prin IP (max 5 signup/oră per IP) ca să prevină abuz.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { signupForWaitlist } from "@/lib/server/waitlist-store"
import type { IcpSegment } from "@/lib/server/white-label"

const VALID_ICP: readonly IcpSegment[] = [
  "solo",
  "cabinet-dpo",
  "cabinet-fiscal",
  "imm-internal",
  "enterprise",
] as const

function parseIcp(value: unknown): IcpSegment | null {
  if (typeof value !== "string") return null
  return (VALID_ICP as readonly string[]).includes(value) ? (value as IcpSegment) : null
}

// Simple in-memory rate limit (per process). Pentru producție serioasă →
// înlocuiește cu Upstash Redis sau Vercel KV.
const ipSignupCounts = new Map<string, { count: number; windowStartMs: number }>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 ora

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const real = request.headers.get("x-real-ip")
  if (real) return real
  return "unknown"
}

function checkRateLimit(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now()
  const existing = ipSignupCounts.get(ip)
  if (!existing || now - existing.windowStartMs > RATE_LIMIT_WINDOW_MS) {
    ipSignupCounts.set(ip, { count: 1, windowStartMs: now })
    return { ok: true }
  }
  if (existing.count >= RATE_LIMIT_MAX) {
    return {
      ok: false,
      retryAfter: Math.ceil((existing.windowStartMs + RATE_LIMIT_WINDOW_MS - now) / 1000),
    }
  }
  ipSignupCounts.set(ip, { ...existing, count: existing.count + 1 })
  return { ok: true }
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const limit = checkRateLimit(ip)
  if (!limit.ok) {
    return new NextResponse(
      JSON.stringify({
        ok: false,
        error: `Prea multe cereri. Reîncearcă în ${limit.retryAfter} secunde.`,
        code: "RATE_LIMITED",
      }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(limit.retryAfter ?? 60) } }
    )
  }

  let body: { email?: string; icpSegment?: string; source?: string; context?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return jsonError("JSON invalid.", 400, "INVALID_REQUEST_BODY")
  }

  if (typeof body.email !== "string") {
    return jsonError("Email obligatoriu.", 400, "EMAIL_REQUIRED")
  }

  const result = await signupForWaitlist({
    email: body.email,
    icpSegment: parseIcp(body.icpSegment),
    source: typeof body.source === "string" ? body.source : "/",
    context: typeof body.context === "string" ? body.context.slice(0, 500) : undefined,
  })

  if (!result.ok) {
    return jsonError(result.error, 400, "WAITLIST_REJECTED")
  }

  return NextResponse.json({
    ok: true,
    alreadyOnList: result.alreadyOnList,
    message: result.alreadyOnList
      ? "Adresa ta era deja pe listă — am actualizat timestamp-ul."
      : "Te-am adăugat pe listă. Te anunțăm când deschidem.",
  })
}
