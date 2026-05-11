import { describe, it, expect } from "vitest"

import {
  checkModuleAccess,
  ensureModuleOrDeny,
  getIcpContextFromRequest,
  IcpPermissionError,
  requireModuleAccess,
} from "./icp-permissions"

function mockRequest(
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: new Headers(headers),
  })
}

describe("getIcpContextFromRequest", () => {
  it("returns null/owner when headers absent (backward compat)", () => {
    const ctx = getIcpContextFromRequest(mockRequest())
    expect(ctx.icpSegment).toBeNull()
    expect(ctx.subFlag).toBeNull()
    expect(ctx.accessMode).toBe("owner")
  })

  it("parses valid icpSegment from header", () => {
    const ctx = getIcpContextFromRequest(
      mockRequest({ "x-compliscan-icp-segment": "cabinet-fiscal" }),
    )
    expect(ctx.icpSegment).toBe("cabinet-fiscal")
  })

  it("ignores invalid icpSegment value", () => {
    const ctx = getIcpContextFromRequest(
      mockRequest({ "x-compliscan-icp-segment": "hackerz-mode" }),
    )
    expect(ctx.icpSegment).toBeNull()
  })

  it("parses subFlag and accessMode", () => {
    const ctx = getIcpContextFromRequest(
      mockRequest({
        "x-compliscan-icp-segment": "enterprise",
        "x-compliscan-sub-flag": "cabinet-cyber",
        "x-compliscan-access-mode": "owner",
      }),
    )
    expect(ctx.icpSegment).toBe("enterprise")
    expect(ctx.subFlag).toBe("cabinet-cyber")
    expect(ctx.accessMode).toBe("owner")
  })

  it("ignores invalid subFlag and accessMode", () => {
    const ctx = getIcpContextFromRequest(
      mockRequest({
        "x-compliscan-sub-flag": "evil-flag",
        "x-compliscan-access-mode": "god-mode",
      }),
    )
    expect(ctx.subFlag).toBeNull()
    expect(ctx.accessMode).toBe("owner")
  })
})

describe("checkModuleAccess — backward compat (icpSegment null)", () => {
  it("permits all modules when icpSegment header absent", () => {
    const req = mockRequest()
    expect(checkModuleAccess(req, "dpia")).toBe(true)
    expect(checkModuleAccess(req, "fiscal")).toBe(true)
    expect(checkModuleAccess(req, "ropa")).toBe(true)
  })
})

describe("checkModuleAccess — cabinet-fiscal restrictions", () => {
  function fiscalReq() {
    return mockRequest({ "x-compliscan-icp-segment": "cabinet-fiscal" })
  }

  it("permits fiscal modules for cabinet-fiscal", () => {
    expect(checkModuleAccess(fiscalReq(), "fiscal")).toBe(true)
    expect(checkModuleAccess(fiscalReq(), "home")).toBe(true)
    expect(checkModuleAccess(fiscalReq(), "dosar")).toBe(true)
  })

  it("blocks DPO modules for cabinet-fiscal", () => {
    expect(checkModuleAccess(fiscalReq(), "dpia")).toBe(false)
    expect(checkModuleAccess(fiscalReq(), "ropa")).toBe(false)
    expect(checkModuleAccess(fiscalReq(), "dsar")).toBe(false)
    expect(checkModuleAccess(fiscalReq(), "breach")).toBe(false)
  })

  it("blocks NIS2/DORA/AI Act for cabinet-fiscal", () => {
    expect(checkModuleAccess(fiscalReq(), "nis2")).toBe(false)
    expect(checkModuleAccess(fiscalReq(), "dora")).toBe(false)
    expect(checkModuleAccess(fiscalReq(), "pay-transparency")).toBe(false)
  })
})

describe("checkModuleAccess — cabinet-dpo restrictions", () => {
  function dpoReq() {
    return mockRequest({ "x-compliscan-icp-segment": "cabinet-dpo" })
  }

  it("permits DPO modules", () => {
    expect(checkModuleAccess(dpoReq(), "dpia")).toBe(true)
    expect(checkModuleAccess(dpoReq(), "ropa")).toBe(true)
    expect(checkModuleAccess(dpoReq(), "dsar")).toBe(true)
    expect(checkModuleAccess(dpoReq(), "magic-links")).toBe(true)
  })

  it("blocks Fiscal/HR modules", () => {
    expect(checkModuleAccess(dpoReq(), "fiscal")).toBe(false)
    expect(checkModuleAccess(dpoReq(), "pay-transparency")).toBe(false)
  })
})

describe("checkModuleAccess — patron access mode", () => {
  it("blocks technical modules even within ICP", () => {
    const req = mockRequest({
      "x-compliscan-icp-segment": "imm-internal",
      "x-compliscan-access-mode": "patron",
    })
    // Patron sees: home, approvals, dosar, settings (intersection)
    expect(checkModuleAccess(req, "home")).toBe(true)
    expect(checkModuleAccess(req, "approvals")).toBe(true)
    expect(checkModuleAccess(req, "dosar")).toBe(true)
    // Technical detail HIDDEN even though imm-internal would normally see them
    expect(checkModuleAccess(req, "ropa")).toBe(false)
    expect(checkModuleAccess(req, "fiscal")).toBe(false)
    expect(checkModuleAccess(req, "nis2")).toBe(false)
  })
})

describe("checkModuleAccess — auditor token mode", () => {
  it("permits ONLY dosar regardless of icpSegment", () => {
    const req = mockRequest({
      "x-compliscan-icp-segment": "cabinet-dpo",
      "x-compliscan-access-mode": "auditor-token",
    })
    expect(checkModuleAccess(req, "dosar")).toBe(true)
    expect(checkModuleAccess(req, "home")).toBe(false)
    expect(checkModuleAccess(req, "ropa")).toBe(false)
    expect(checkModuleAccess(req, "scan")).toBe(false)
  })
})

describe("requireModuleAccess — throws on deny", () => {
  it("returns context on allow", () => {
    const req = mockRequest({ "x-compliscan-icp-segment": "cabinet-fiscal" })
    const ctx = requireModuleAccess(req, "fiscal")
    expect(ctx.icpSegment).toBe("cabinet-fiscal")
  })

  it("throws IcpPermissionError on deny", () => {
    const req = mockRequest({ "x-compliscan-icp-segment": "cabinet-fiscal" })
    expect(() => requireModuleAccess(req, "dpia")).toThrow(IcpPermissionError)
  })

  it("includes moduleId and icpSegment în error", () => {
    const req = mockRequest({ "x-compliscan-icp-segment": "cabinet-dpo" })
    try {
      requireModuleAccess(req, "fiscal")
      expect.fail("should have thrown")
    } catch (err) {
      expect(err).toBeInstanceOf(IcpPermissionError)
      const e = err as IcpPermissionError
      expect(e.moduleId).toBe("fiscal")
      expect(e.icpSegment).toBe("cabinet-dpo")
      expect(e.status).toBe(403)
      expect(e.code).toBe("ICP_MODULE_FORBIDDEN")
    }
  })

  it("backward compat: NU throws când icpSegment absent", () => {
    const req = mockRequest()
    expect(() => requireModuleAccess(req, "dpia")).not.toThrow()
  })
})

describe("ensureModuleOrDeny — Response or null", () => {
  it("returns null on allow", () => {
    const req = mockRequest({ "x-compliscan-icp-segment": "cabinet-fiscal" })
    const result = ensureModuleOrDeny(req, "fiscal")
    expect(result).toBeNull()
  })

  it("returns 403 Response on deny", async () => {
    const req = mockRequest({ "x-compliscan-icp-segment": "cabinet-fiscal" })
    const result = ensureModuleOrDeny(req, "dpia")
    expect(result).not.toBeNull()
    expect(result!.status).toBe(403)
    const body = await result!.json()
    expect(body.code).toBe("ICP_MODULE_FORBIDDEN")
    expect(body.moduleId).toBe("dpia")
    expect(body.icpSegment).toBe("cabinet-fiscal")
  })

  it("backward compat returns null when icpSegment absent", () => {
    const req = mockRequest()
    const result = ensureModuleOrDeny(req, "dpia")
    expect(result).toBeNull()
  })
})
