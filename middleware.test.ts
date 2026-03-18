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

  it("continuă să protejeze alte rute API fără sesiune", async () => {
    const response = await middleware(makeRequest("http://localhost/api/health"))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Unauthorized" })
  })

  it("menține matcher-ul corect pentru auth și demo", () => {
    expect(config.matcher).toContain("/dashboard/:path*")
    expect(config.matcher).toContain("/api/((?!auth|demo).*)")
  })
})
