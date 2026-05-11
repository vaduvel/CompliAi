import { describe, expect, it } from "vitest"
import {
  enrichErrorExplain,
  enrichErrorList,
  extractErrorCode,
  findMemorizedFix,
  recordApprovedFix,
  type RepairMemoryEntry,
} from "./efactura-error-ai-explain"

describe("extractErrorCode", () => {
  it("extrage cod din mesaj prefixat", () => {
    expect(extractErrorCode("V002 Lipseste cbc:CustomizationID")).toBe("V002")
    expect(extractErrorCode("T003 Continutul nu pare XML")).toBe("T003")
  })

  it("extrage cod din mesaj middle-of-text", () => {
    expect(extractErrorCode("Error code: E001 - cert invalid")).toBe("E001")
  })

  it("returnează input ca-i dacă nu match cod", () => {
    expect(extractErrorCode("unknown stuff")).toBe("UNKNOWN STUFF")
  })

  it("returnează gol pentru input gol", () => {
    expect(extractErrorCode("")).toBe("")
  })
})

describe("enrichErrorExplain", () => {
  it("returnează enriched pentru cod cunoscut V002", () => {
    const result = enrichErrorExplain({ errorCode: "V002" })
    expect(result.code).toBe("V002")
    expect(result.title).toBeDefined()
    expect(result.staticDescription).toBeDefined()
    expect(result.legalReference).toContain("CustomizationID")
    expect(result.autoFixSafe).toBe(true)
  })

  it("returnează enriched pentru cod cunoscut E001", () => {
    const result = enrichErrorExplain({ errorCode: "E001" })
    expect(result.code).toBe("E001")
    expect(result.legalReference).toContain("OUG 120/2021")
    expect(result.autoFixSafe).toBe(false)
  })

  it("autoFixSafe doar pentru codurile safe (V002, V003, V005, V006, T003)", () => {
    expect(enrichErrorExplain({ errorCode: "V002" }).autoFixSafe).toBe(true)
    expect(enrichErrorExplain({ errorCode: "V003" }).autoFixSafe).toBe(true)
    expect(enrichErrorExplain({ errorCode: "T003" }).autoFixSafe).toBe(true)
    expect(enrichErrorExplain({ errorCode: "V007" }).autoFixSafe).toBe(false)
    expect(enrichErrorExplain({ errorCode: "T001" }).autoFixSafe).toBe(false)
  })

  it("fallback pentru cod necunoscut", () => {
    const result = enrichErrorExplain({ errorCode: "Z999" })
    expect(result.code).toBe("Z999")
    expect(result.title).toBe("Cod eroare necunoscut")
    expect(result.autoFixSafe).toBe(false)
  })

  it("extrage codul din message complex", () => {
    const result = enrichErrorExplain({ errorCode: "V002 Lipseste cbc:CustomizationID." })
    expect(result.code).toBe("V002")
  })
})

describe("enrichErrorList", () => {
  it("batch enrichment", () => {
    const result = enrichErrorList(["V002 Missing X", "T003 Encoding", "E001 Cert"])
    expect(result).toHaveLength(3)
    expect(result[0].code).toBe("V002")
    expect(result[1].code).toBe("T003")
    expect(result[2].code).toBe("E001")
  })
})

describe("findMemorizedFix + recordApprovedFix", () => {
  it("recordApprovedFix adaugă nou", () => {
    const memory = recordApprovedFix(
      [],
      { errorCode: "V002", appliedFix: "Adaugă CustomizationID", approvedByEmail: "test@ex.com" },
      "2026-05-11T10:00:00Z",
    )
    expect(memory).toHaveLength(1)
    expect(memory[0].approvalCount).toBe(1)
  })

  it("recordApprovedFix incrementează count dacă există match exact", () => {
    let memory: RepairMemoryEntry[] = []
    for (let i = 0; i < 3; i++) {
      memory = recordApprovedFix(
        memory,
        { errorCode: "V002", appliedFix: "Adaugă CustomizationID", approvedByEmail: "test@ex.com" },
        "2026-05-11T10:00:00Z",
      )
    }
    expect(memory).toHaveLength(1)
    expect(memory[0].approvalCount).toBe(3)
  })

  it("findMemorizedFix returnează cel mai aprobat fix", () => {
    let memory: RepairMemoryEntry[] = []
    memory = recordApprovedFix(
      memory,
      { errorCode: "V002", appliedFix: "Fix A", approvedByEmail: "x@y" },
      "2026-05-11T10:00:00Z",
    )
    memory = recordApprovedFix(
      memory,
      { errorCode: "V002", appliedFix: "Fix B", approvedByEmail: "x@y" },
      "2026-05-11T10:00:00Z",
    )
    memory = recordApprovedFix(
      memory,
      { errorCode: "V002", appliedFix: "Fix B", approvedByEmail: "x@y" },
      "2026-05-11T10:00:00Z",
    )
    const found = findMemorizedFix(memory, "V002")
    expect(found?.appliedFix).toBe("Fix B")
    expect(found?.approvalCount).toBe(2)
  })

  it("findMemorizedFix returnează undefined pentru cod necunoscut", () => {
    expect(findMemorizedFix([], "V999")).toBeUndefined()
  })
})
