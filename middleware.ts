import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { isWorkspaceRouteMemoryCandidate, sanitizeInternalRoute } from "@/lib/compliscan/internal-route"
import { isModuleAllowed, type AccessMode, type SubFlag } from "@/lib/compliscan/icp-modules"
import type { DashboardNavId } from "@/components/compliscan/navigation"
import type { IcpSegment } from "@/lib/server/white-label"

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

// ── URL → NavId mapping (Layer 4 din IA spec) ────────────────────────────────
// Dacă URL-ul mapează la un NavId restricted, middleware redirect la /dashboard
// cu banner cross-sell. Defensive layer — chiar dacă cineva forțează URL direct,
// nu poate accesa modulul.

const URL_TO_NAV_ID: Array<{ pattern: RegExp; navId: DashboardNavId }> = [
  // GDPR / DPO
  { pattern: /^\/dashboard\/dpia(\/|$|\?)/, navId: "dpia" },
  { pattern: /^\/dashboard\/ropa(\/|$|\?)/, navId: "ropa" },
  { pattern: /^\/dashboard\/dsar(\/|$|\?)/, navId: "dsar" },
  { pattern: /^\/dashboard\/breach(\/|$|\?)/, navId: "breach" },
  { pattern: /^\/dashboard\/training(\/|$|\?)/, navId: "training" },
  { pattern: /^\/dashboard\/vendor-review(\/|$|\?)/, navId: "vendor-review" },
  { pattern: /^\/dashboard\/cabinet\/templates(\/|$|\?)/, navId: "cabinet-templates" },
  { pattern: /^\/dashboard\/migration(\/|$|\?)/, navId: "dpo-migration" },
  { pattern: /^\/dashboard\/magic-links(\/|$|\?)/, navId: "magic-links" },
  { pattern: /^\/dashboard\/approvals(\/|$|\?)/, navId: "approvals" },
  { pattern: /^\/dashboard\/generator(\/|$|\?)/, navId: "generator" },
  // NIS2 + DORA
  { pattern: /^\/dashboard\/nis2(\/|$|\?)/, navId: "nis2" },
  { pattern: /^\/dashboard\/dora(\/|$|\?)/, navId: "dora" },
  // Fiscal
  { pattern: /^\/dashboard\/fiscal(\/|$|\?)/, navId: "fiscal" },
  // HR
  { pattern: /^\/dashboard\/pay-transparency(\/|$|\?)/, navId: "pay-transparency" },
  { pattern: /^\/dashboard\/whistleblowing(\/|$|\?)/, navId: "whistleblowing" },
  // Workflows
  { pattern: /^\/dashboard\/review(\/|$|\?)/, navId: "review-cycles" },
  { pattern: /^\/dashboard\/agents(\/|$|\?)/, navId: "agenti" },
  // Politici (RO id-ul existent în nav)
  { pattern: /^\/dashboard\/reports\/policies(\/|$|\?)/, navId: "politici" },
  // Universal — NU intră în mapping (home/scan/resolve/dosar/settings/calendar)
]

function getNavIdForPath(pathname: string): DashboardNavId | null {
  for (const { pattern, navId } of URL_TO_NAV_ID) {
    if (pattern.test(pathname)) return navId
  }
  return null
}

async function verifyToken(
  token: string
): Promise<{
  userId: string
  orgId: string
  email: string
  orgName: string
  workspaceMode: string
  icpSegment: IcpSegment | null
  subFlag: SubFlag | null
  accessMode: AccessMode
} | null> {
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
      // Layer 4 ICP filtering — optional pentru backward compat (utilizatori vechi
      // fără aceste fields în JWT primesc null = no filter aplicat = behavior actual)
      icpSegment?: string
      subFlag?: string
      accessMode?: string
    }
    if (payload.exp < Date.now()) return null
    const workspaceMode = payload.workspaceMode === "portfolio" ? "portfolio" : "org"
    // Validate icpSegment dacă e prezent
    const validIcps = new Set([
      "solo",
      "cabinet-dpo",
      "cabinet-fiscal",
      "cabinet-hr",
      "imm-internal",
      "imm-hr",
      "enterprise",
    ])
    const icpSegment =
      payload.icpSegment && validIcps.has(payload.icpSegment)
        ? (payload.icpSegment as IcpSegment)
        : null
    const validSubFlags = new Set(["legal-only", "cabinet-cyber", "ai-gov", "banking"])
    const subFlag =
      payload.subFlag && validSubFlags.has(payload.subFlag) ? (payload.subFlag as SubFlag) : null
    const validAccessModes = new Set(["owner", "patron", "auditor-token"])
    const accessMode =
      payload.accessMode && validAccessModes.has(payload.accessMode)
        ? (payload.accessMode as AccessMode)
        : "owner"
    return {
      userId: payload.userId,
      orgId: payload.orgId,
      email: payload.email,
      orgName: payload.orgName,
      workspaceMode,
      icpSegment,
      subFlag,
      accessMode,
    }
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
  const isPublicSharedApprovalRoute = /^\/api\/shared\/[^/]+\/(?:approve|reject|comment)$/.test(
    pathname
  )

  if (
    isDemoBootRoute ||
    isStripeWebhookRoute ||
    isPublicWhistleblowingSubmit ||
    isPublicSharedApprovalRoute
  ) {
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

  // ── Layer 4 ICP route guard (defensive) ──────────────────────────────────
  // Dacă URL-ul mapează la un modul restricted pentru icpSegment-ul user-ului,
  // redirect la /dashboard cu banner cross-sell.
  // Behavior backward compat: dacă session.icpSegment e null, NU se aplică filter
  // (utilizatori vechi NU sunt afectați — fallback safe).
  if (!isApiRoute && session.icpSegment !== null) {
    const navId = getNavIdForPath(pathname)
    if (
      navId &&
      !isModuleAllowed(navId, session.icpSegment, session.subFlag, session.accessMode)
    ) {
      const redirectUrl = new URL("/dashboard", request.url)
      redirectUrl.searchParams.set("cross-sell", navId)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // ── API route ICP permission guard (defensive — Layer 5 client-side) ──────
  // Pentru API routes care accesează module restricted, returnăm 403.
  // Map URL pattern → navId în URL_TO_NAV_ID NU e fiecare path posibil — pentru
  // API guard concret per endpoint, vezi lib/server/icp-permissions.ts (Layer 5).
  // Aici doar block pentru UI direct hits care s-ar mapa.

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-compliscan-org-id", session.orgId)
  requestHeaders.set("x-compliscan-user-id", session.userId)
  requestHeaders.set("x-compliscan-user-email", session.email)
  requestHeaders.set("x-compliscan-org-name", session.orgName)
  requestHeaders.set("x-compliscan-workspace-mode", session.workspaceMode)
  // Layer 4/5 — propagate icpSegment în request headers pentru API routes care
  // au nevoie de check server-side per request
  if (session.icpSegment) {
    requestHeaders.set("x-compliscan-icp-segment", session.icpSegment)
  }
  if (session.subFlag) {
    requestHeaders.set("x-compliscan-sub-flag", session.subFlag)
  }
  if (session.accessMode !== "owner") {
    requestHeaders.set("x-compliscan-access-mode", session.accessMode)
  }

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
    "/api/((?!auth|demo|stripe/webhook|whistleblowing/submit|free-tools/).*)",
  ],
}
