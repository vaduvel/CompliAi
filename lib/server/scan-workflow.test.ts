import { describe, expect, it } from "vitest"

import { RequestValidationError } from "./request-validation"
import { validateScanInputPayload } from "./scan-workflow"

describe("validateScanInputPayload", () => {
  it("accepta text manual simplu", () => {
    const payload = validateScanInputPayload({
      documentName: "Politica.pdf",
      content: "Text relevant pentru analiza",
    })

    expect(payload.documentName).toBe("Politica.pdf")
    expect(payload.content).toBe("Text relevant pentru analiza")
  })

  it("respinge payload gol", () => {
    expect(() => validateScanInputPayload({})).toThrow(RequestValidationError)
  })

  it("respinge imagine si pdf simultan", () => {
    expect(() =>
      validateScanInputPayload({
        imageBase64: "YWJjZA==",
        pdfBase64: "YWJjZA==",
      })
    ).toThrow("Trimite ori imagine, ori PDF la acelasi request.")
  })

  it("respinge base64 invalid", () => {
    expect(() =>
      validateScanInputPayload({
        imageBase64: "%%%invalid%%%",
      })
    ).toThrow("Imaginea incarcata nu are format base64 valid.")
  })
})
