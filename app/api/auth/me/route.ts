import { NextResponse } from "next/server"

import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/auth"

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || ""
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))
  if (!match) return NextResponse.json({ user: null })

  const session = verifySessionToken(match[1])
  if (!session) return NextResponse.json({ user: null })

  return NextResponse.json({
    user: {
      email: session.email,
      orgId: session.orgId,
      orgName: session.orgName,
    },
  })
}
