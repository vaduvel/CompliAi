// Unit tests pentru helpers ONRC snapshot.

import { describe, expect, it } from "vitest"

import {
  computeSnapshotDerived,
  findOnrcSnapshot,
  isValidCui,
  normalizeCui,
  summarizeOnrcSnapshots,
  upsertOnrcSnapshot,
  type OnrcSnapshotRecord,
} from "./onrc-snapshot"

function mkSnapshot(
  override: Partial<OnrcSnapshotRecord> = {},
): OnrcSnapshotRecord {
  return computeSnapshotDerived({
    cui: "12345678",
    companyName: "ACME SRL",
    mainCaen: "6202",
    legalForm: "SRL",
    registeredAddress: "Str. Test 1",
    fiscalStatus: "ACTIVĂ",
    vatRegistered: true,
    efacturaRegistered: true,
    registrationNumber: "J40/1234/2020",
    associates: [],
    sources: ["anaf-v9"],
    anafFetchedAtISO: new Date().toISOString(),
    associatesConfirmedAtISO: null,
    parsedAtISO: new Date().toISOString(),
    errors: [],
    warnings: [],
    ...({
      // not passed through, recomputed
    } as Record<string, never>),
  }).constructor === Object
    ? {
        ...computeSnapshotDerived({
          cui: override.cui ?? "12345678",
          companyName: override.companyName ?? "ACME SRL",
          mainCaen: override.mainCaen ?? "6202",
          legalForm: override.legalForm ?? "SRL",
          registeredAddress: override.registeredAddress ?? "Str. Test 1",
          fiscalStatus: override.fiscalStatus ?? "ACTIVĂ",
          vatRegistered: override.vatRegistered ?? true,
          efacturaRegistered: override.efacturaRegistered ?? true,
          registrationNumber: override.registrationNumber ?? "J40/1234/2020",
          associates: override.associates ?? [],
          sources: override.sources ?? ["anaf-v9"],
          anafFetchedAtISO: override.anafFetchedAtISO ?? new Date().toISOString(),
          associatesConfirmedAtISO: override.associatesConfirmedAtISO ?? null,
          parsedAtISO: override.parsedAtISO ?? new Date().toISOString(),
          errors: override.errors ?? [],
          warnings: override.warnings ?? [],
        }),
        id: override.id ?? `snap-${Math.random().toString(36).slice(2, 8)}`,
      }
    : ({} as OnrcSnapshotRecord)
}

describe("normalizeCui & isValidCui", () => {
  it("elimină prefix RO și whitespace", () => {
    expect(normalizeCui("RO12345678")).toBe("12345678")
    expect(normalizeCui(" ro12345678 ")).toBe("12345678")
    expect(normalizeCui("12345678")).toBe("12345678")
  })

  it("validează format CUI 2-10 cifre", () => {
    expect(isValidCui("RO12345678")).toBe(true)
    expect(isValidCui("12345678")).toBe(true)
    expect(isValidCui("12")).toBe(true)
    expect(isValidCui("1")).toBe(false) // prea scurt
    expect(isValidCui("12345678901")).toBe(false) // prea lung
    expect(isValidCui("abc")).toBe(false)
    expect(isValidCui("")).toBe(false)
  })
})

describe("computeSnapshotDerived", () => {
  const base = {
    cui: "12345678",
    companyName: "ACME SRL",
    mainCaen: null,
    legalForm: null,
    registeredAddress: null,
    fiscalStatus: null,
    vatRegistered: false,
    efacturaRegistered: false,
    registrationNumber: null,
    sources: ["anaf-v9"] as const,
    anafFetchedAtISO: null,
    associatesConfirmedAtISO: null,
    parsedAtISO: new Date().toISOString(),
    errors: [],
    warnings: [],
    id: "snap-a",
  }

  it("calculează totalOwnership corect", () => {
    const result = computeSnapshotDerived({
      ...base,
      sources: ["anaf-v9"],
      associates: [
        { idType: "CNP", id: "1850101123456", name: "A", ownershipPercent: 60 },
        { idType: "CNP", id: "2900202234567", name: "B", ownershipPercent: 40 },
      ],
    })
    expect(result.totalOwnershipPercent).toBe(100)
    expect(result.isComplete).toBe(true)
  })

  it("detectează asociat majoritar (>50%)", () => {
    const result = computeSnapshotDerived({
      ...base,
      sources: ["anaf-v9"],
      associates: [
        { idType: "CNP", id: "1", name: "A", ownershipPercent: 70 },
        { idType: "CNP", id: "2", name: "B", ownershipPercent: 30 },
      ],
    })
    expect(result.majorityOwner?.name).toBe("A")
  })

  it("nu există majoritar la 50/50", () => {
    const result = computeSnapshotDerived({
      ...base,
      sources: ["anaf-v9"],
      associates: [
        { idType: "CNP", id: "1", name: "A", ownershipPercent: 50 },
        { idType: "CNP", id: "2", name: "B", ownershipPercent: 50 },
      ],
    })
    expect(result.majorityOwner).toBeNull()
  })

  it("asociat unic (100%) e considerat majoritar", () => {
    const result = computeSnapshotDerived({
      ...base,
      sources: ["anaf-v9"],
      associates: [
        { idType: "CUI", id: "RO99", name: "HOLDING SA", ownershipPercent: 100 },
      ],
    })
    expect(result.majorityOwner?.name).toBe("HOLDING SA")
  })

  it("isComplete=false dacă ownership ≠ 100%", () => {
    const result = computeSnapshotDerived({
      ...base,
      sources: ["anaf-v9"],
      associates: [
        { idType: "CNP", id: "1", name: "A", ownershipPercent: 60 },
        { idType: "CNP", id: "2", name: "B", ownershipPercent: 30 }, // total 90%
      ],
    })
    expect(result.isComplete).toBe(false)
    expect(result.totalOwnershipPercent).toBe(90)
  })
})

describe("upsertOnrcSnapshot & findOnrcSnapshot", () => {
  it("înlocuiește snapshot cu același CUI", () => {
    const s1 = computeSnapshotDerived({
      cui: "12345678",
      companyName: "OLD NAME",
      mainCaen: null,
      legalForm: null,
      registeredAddress: null,
      fiscalStatus: null,
      vatRegistered: false,
      efacturaRegistered: false,
      registrationNumber: null,
      associates: [],
      sources: ["anaf-v9"],
      anafFetchedAtISO: null,
      associatesConfirmedAtISO: null,
      parsedAtISO: "2026-01-01T00:00:00Z",
      errors: [],
      warnings: [],
      id: "a",
    } as Omit<OnrcSnapshotRecord, "totalOwnershipPercent" | "majorityOwner" | "isComplete">)
    const s2 = computeSnapshotDerived({
      cui: "12345678",
      companyName: "NEW NAME",
      mainCaen: null,
      legalForm: null,
      registeredAddress: null,
      fiscalStatus: null,
      vatRegistered: false,
      efacturaRegistered: false,
      registrationNumber: null,
      associates: [],
      sources: ["anaf-v9"],
      anafFetchedAtISO: null,
      associatesConfirmedAtISO: null,
      parsedAtISO: "2026-05-01T00:00:00Z",
      errors: [],
      warnings: [],
      id: "b",
    } as Omit<OnrcSnapshotRecord, "totalOwnershipPercent" | "majorityOwner" | "isComplete">)
    const result = upsertOnrcSnapshot([s1], s2)
    expect(result).toHaveLength(1)
    expect(result[0]?.companyName).toBe("NEW NAME")
  })

  it("findOnrcSnapshot normalizează CUI", () => {
    const s = computeSnapshotDerived({
      cui: "12345678",
      companyName: null,
      mainCaen: null,
      legalForm: null,
      registeredAddress: null,
      fiscalStatus: null,
      vatRegistered: false,
      efacturaRegistered: false,
      registrationNumber: null,
      associates: [],
      sources: ["anaf-v9"],
      anafFetchedAtISO: null,
      associatesConfirmedAtISO: null,
      parsedAtISO: new Date().toISOString(),
      errors: [],
      warnings: [],
      id: "x",
    } as Omit<OnrcSnapshotRecord, "totalOwnershipPercent" | "majorityOwner" | "isComplete">)
    expect(findOnrcSnapshot([s], "RO12345678")?.cui).toBe("12345678")
    expect(findOnrcSnapshot([s], "99999")).toBeNull()
  })
})

describe("summarizeOnrcSnapshots", () => {
  it("contorizează complete + RECOM + outdated", () => {
    const complete = computeSnapshotDerived({
      cui: "1",
      companyName: null,
      mainCaen: null,
      legalForm: null,
      registeredAddress: null,
      fiscalStatus: null,
      vatRegistered: false,
      efacturaRegistered: false,
      registrationNumber: null,
      associates: [
        { idType: "CNP", id: "1", name: "A", ownershipPercent: 100 },
      ],
      sources: ["anaf-v9", "manual"],
      anafFetchedAtISO: new Date().toISOString(),
      associatesConfirmedAtISO: new Date().toISOString(),
      parsedAtISO: new Date().toISOString(),
      errors: [],
      warnings: [],
      id: "c",
    } as Omit<OnrcSnapshotRecord, "totalOwnershipPercent" | "majorityOwner" | "isComplete">)

    const old = computeSnapshotDerived({
      cui: "2",
      companyName: null,
      mainCaen: null,
      legalForm: null,
      registeredAddress: null,
      fiscalStatus: null,
      vatRegistered: false,
      efacturaRegistered: false,
      registrationNumber: null,
      associates: [],
      sources: ["recom-soap"],
      anafFetchedAtISO: "2024-01-01T00:00:00Z",
      associatesConfirmedAtISO: null,
      parsedAtISO: "2024-01-01T00:00:00Z",
      errors: [],
      warnings: [],
      id: "d",
    } as Omit<OnrcSnapshotRecord, "totalOwnershipPercent" | "majorityOwner" | "isComplete">)

    const summary = summarizeOnrcSnapshots([complete, old])
    expect(summary.total).toBe(2)
    expect(summary.complete).toBe(1)
    expect(summary.withRecomSoap).toBe(1)
    expect(summary.outdatedAnaf).toBe(1)
  })
})
