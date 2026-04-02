import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { isWorkspaceRouteMemoryCandidate, sanitizeInternalRoute } from "@/lib/compliscan/internal-route"

const SESSION_COOKIE = "compliscan_session"
const LAST_ROUTE_COOKIE = "compliscan_last_route"

// ── Rate limiting (in-memory, per Edge Runtime instance) ──────────────────────
// NOTE: Multi-instance deployments need Redis/Upstash for cross-instance limiting.
// For single-instance MVP this is sufficient.

type RateBucket = { count: number; windowStart: number }
const rateBuckets = new Map<string, RateBucket>()

const RATE_LIMITS: { pattern: RegExp; maxPerMin: number; methods: string[] }[] = [
  // Expensive generation routes — tight limit
  { pattern: /^\/api\/documents\/generate/, maxPerMin: 10, methods: ["POST"] },
  { pattern: /^\/api\/scan\/extract/, maxPerMin: 10, methods: ["POST"] },
  // Sensitive read-heavy routes
  {
    pattern: /^\/api\/(findings\/|shadow-ai$|org\/profile$|exports\/audit-pack(?:\/bundle|\/client)?$)/,
    maxPerMin: 120,
    methods: ["GET"],
  },
  // All other mutating routes
  { pattern: /^\/api\//, maxPerMin: 60, methods: ["POST", "PATCH", "PUT", "DELETE"] },
]

function checkRateLimit(orgId: string, pathname: string, method: string): boolean {
  const limit = RATE_LIMITS.find((r) => r.pattern.test(pathname) && r.methods.includes(method))
  if (!limit) return true

  const key = `${orgId}:${pathname.replace(/\/[a-z0-9-]{8,}/gi, "/:id")}`
  const now = Date.now()
  const bucket = rateBuckets.get(key)

  if (!bucket || now - bucket.windowStart > 60_000) {
    rateBuckets.set(key, { count: 1, windowStart: now })
    return true
  }

  if (bucket.count >= limit.maxPerMin) return false

  bucket.count++
  return true
}

function getSessionSecret() {
  const explicit = process.env.COMPLISCAN_SESSION_SECRET?.trim()
  if (explicit) return explicit

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "COMPLISCAN_SESSION_SECRET lipseste. Configureaza secretul de sesiune in productie."
    )
  }

  return "dev-secret-change-me-in-production"
}

async function verifyToken(
  token: string
): Promise<{ userId: string; orgId: string; email: string; orgName: string; workspaceMode: string } | null> {
  try {
    const secret = getSessionSecret()
    const dotIndex = token.lastIndexOf(".")
    if (dotIndex === -1) return null
    const encoded = token.slice(0, dotIndex)
    const sig = token.slice(dotIndex + 1)

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(encoded))
    const uint8 = new Uint8Array(signatureBuffer)
    let binary = ""
    for (const byte of uint8) binary += String.fromCharCode(byte)
    const expectedSig = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

    if (sig !== expectedSig) return null

    const pad = encoded.length % 4
    const paddedFixed = pad ? encoded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(4 - pad) : encoded.replace(/-/g, "+").replace(/_/g, "/")
    const payload = JSON.parse(atob(paddedFixed)) as {
      userId: string
      orgId: string
      email: string
      orgName: string
      workspaceMode?: string
      exp: number
    }
    if (payload.exp < Date.now()) return null
    const workspaceMode = payload.workspaceMode === "portfolio" ? "portfolio" : "org"
    return { userId: payload.userId, orgId: payload.orgId, email: payload.email, orgName: payload.orgName, workspaceMode }
  } catch {
    return null
  }
}

function buildLoginRedirectUrl(request: NextRequest) {
  const loginUrl = new URL("/login", request.url)
  const returnTo = sanitizeInternalRoute(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    "/dashboard"
  )
  if (returnTo !== "/login") {
    loginUrl.searchParams.set("next", returnTo)
  }
  return loginUrl
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith("/api/")
  const isDemoBootRoute = pathname.startsWith("/api/demo/")
  const isStripeWebhookRoute = pathname === "/api/stripe/webhook"
  const isPublicWhistleblowingSubmit = pathname === "/api/whistleblowing/submit"

  if (isDemoBootRoute || isStripeWebhookRoute || isPublicWhistleblowingSubmit) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE)
  if (!sessionCookie?.value) {
    if (isApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.redirect(buildLoginRedirectUrl(request))
  }

  const session = await verifyToken(sessionCookie.value)
  if (!session) {
    if (isApiRoute) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      response.cookies.delete(SESSION_COOKIE)
      return response
    }
    const response = NextResponse.redirect(buildLoginRedirectUrl(request))
    response.cookies.delete(SESSION_COOKIE)
    return response
  }

  // Rate limiting check
  if (!checkRateLimit(session.orgId, pathname, request.method)) {
    return NextResponse.json(
      { error: "Prea multe cereri. Încearcă din nou în câteva secunde.", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      }
    )
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-compliscan-org-id", session.orgId)
  requestHeaders.set("x-compliscan-user-id", session.userId)
  requestHeaders.set("x-compliscan-user-email", session.email)
  requestHeaders.set("x-compliscan-org-name", session.orgName)
  requestHeaders.set("x-compliscan-workspace-mode", session.workspaceMode)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  if (!isApiRoute) {
    const currentRoute = sanitizeInternalRoute(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      ""
    )
    if (isWorkspaceRouteMemoryCandidate(currentRoute)) {
      response.cookies.set(LAST_ROUTE_COOKIE, currentRoute, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      })
    }
  }

  return response
}

export const config = {
  matcher: [
    "/account/:path*",
    "/dashboard/:path*",
    "/portfolio/:path*",
    "/onboarding",
    "/api/((?!auth|demo|stripe/webhook|whistleblowing/submit).*)",
  ],
}
