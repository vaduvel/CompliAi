import { describe, expect, it } from "vitest"

import {
  RequestValidationError,
  asTrimmedString,
  estimateBase64Size,
  normalizeOptionalNote,
  requirePlainObject,
} from "./request-validation"

describe("request-validation", () => {
  it("trimite string-uri curate si limitate", () => {
    expect(asTrimmedString("  exemplu  ", 50)).toBe("exemplu")
    expect(asTrimmedString("abcdef", 3)).toBe("abc")
    expect(asTrimmedString("   ", 10)).toBeUndefined()
    expect(asTrimmedString(123, 10)).toBeUndefined()
  })

  it("accepta doar obiecte JSON plain", () => {
    expect(requirePlainObject({ ok: true })).toEqual({ ok: true })
    expect(() => requirePlainObject(null)).toThrow(RequestValidationError)
    expect(() => requirePlainObject(["nu"])).toThrow("Payload-ul trebuie sa fie un obiect JSON valid.")
  })

  it("normalizeaza note optionale si opreste valorile invalide", () => {
    expect(normalizeOptionalNote("  nota scurta  ", 50)).toBe("nota scurta")
    expect(normalizeOptionalNote("   ", 50)).toBeNull()
    expect(normalizeOptionalNote(null, 50)).toBeNull()
    expect(() => normalizeOptionalNote(42, 50)).toThrow("Nota trebuie sa fie text simplu.")
    expect(() => normalizeOptionalNote("x".repeat(51), 50)).toThrow("Nota este prea lunga.")
  })

  it("estimeaza dimensiunea base64 corect", () => {
    expect(estimateBase64Size("YWJj")).toBe(3)
    expect(estimateBase64Size("YQ==")).toBe(1)
  })
})
