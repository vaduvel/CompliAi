import { describe, expect, it } from "vitest"
import { NextRequest } from "next/server"

import { config, middleware } from "./middleware"

function makeRequest(url: string) {
  return new NextRequest(url)
}

describe("middleware", () => {
  it("lasă liber demo boot route", async () => {
    const response = await middleware(makeRequest("http://localhost/api/demo/imm"))

    expect(response.status).toBe(200)
    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it("lasă liber webhook-ul Stripe fără sesiune", async () => {
    const response = await middleware(makeRequest("http://localhost/api/stripe/webhook"))

    expect(response.status).toBe(200)
    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it("lasă liber flow-ul public magic link fără sesiune", async () => {
    const approve = await middleware(makeRequest("http://localhost/api/shared/signed.token/approve"))
    const reject = await middleware(makeRequest("http://localhost/api/shared/signed.token/reject"))
    const comment = await middleware(makeRequest("http://localhost/api/shared/signed.token/comment"))

    expect(approve.status).toBe(200)
    expect(approve.headers.get("x-middleware-next")).toBe("1")
    expect(reject.status).toBe(200)
    expect(reject.headers.get("x-middleware-next")).toBe("1")
    expect(comment.status).toBe(200)
    expect(comment.headers.get("x-middleware-next")).toBe("1")
  })

  it("continuă să protejeze alte rute API fără sesiune", async () => {
    const response = await middleware(makeRequest("http://localhost/api/health"))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Unauthorized" })
  })

  it("nu deschide alte rute shared API fără sesiune", async () => {
    const response = await middleware(makeRequest("http://localhost/api/shared/signed.token"))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Unauthorized" })
  })

  it("menține matcher-ul corect pentru auth și demo", () => {
    expect(config.matcher).toContain("/dashboard/:path*")
    expect(config.matcher).toContain("/api/((?!auth|demo|stripe/webhook|whistleblowing/submit).*)")
  })
})
