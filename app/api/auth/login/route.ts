import { NextResponse } from "next/server"

import {
  createSessionToken,
  findUserByEmail,
  getSessionCookieOptions,
  hashPassword,
  SESSION_COOKIE,
} from "@/lib/server/auth"

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string }

  if (!body.email?.trim() || !body.password) {
    return NextResponse.json({ error: "Email si parola sunt obligatorii." }, { status: 400 })
  }

  const user = await findUserByEmail(body.email)
  if (!user || hashPassword(body.password, user.salt) !== user.passwordHash) {
    return NextResponse.json({ error: "Email sau parola incorecta." }, { status: 401 })
  }

  const token = createSessionToken({
    userId: user.id,
    orgId: user.orgId,
    email: user.email,
    orgName: user.orgName,
  })

  const response = NextResponse.json({ ok: true, orgId: user.orgId, orgName: user.orgName })
  response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions())
  return response
}
