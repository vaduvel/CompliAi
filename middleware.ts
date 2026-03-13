import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SESSION_COOKIE = "compliscan_session"

async function verifyToken(
  token: string
): Promise<{ userId: string; orgId: string; email: string; orgName: string } | null> {
  try {
    const secret = process.env.COMPLISCAN_SESSION_SECRET || "dev-secret-change-me-in-production"
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
      exp: number
    }
    if (payload.exp < Date.now()) return null
    return { userId: payload.userId, orgId: payload.orgId, email: payload.email, orgName: payload.orgName }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith("/api/")

  const sessionCookie = request.cookies.get(SESSION_COOKIE)
  if (!sessionCookie?.value) {
    if (isApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const session = await verifyToken(sessionCookie.value)
  if (!session) {
    if (isApiRoute) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      response.cookies.delete(SESSION_COOKIE)
      return response
    }
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete(SESSION_COOKIE)
    return response
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-compliscan-org-id", session.orgId)
  requestHeaders.set("x-compliscan-user-id", session.userId)
  requestHeaders.set("x-compliscan-user-email", session.email)
  requestHeaders.set("x-compliscan-org-name", session.orgName)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/((?!auth).*)"],
}
