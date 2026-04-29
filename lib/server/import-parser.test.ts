import { describe, expect, it } from "vitest"

import { parseImportFile } from "@/lib/server/import-parser"

describe("parseImportFile", () => {
  it("acceptă CSV-uri românești cu diacritice și mapează sectorul/angajații Dianei", () => {
    const csv = [
      "Denumire firmă,CUI,Sector,Nr. angajați,Email contact",
      "Medica Plus SRL,RO12345678,Sănătate,42,office@medica.test",
      "TransRapid SRL,RO87654321,Transport și logistică,85,office@transrapid.test",
      "FinCore SA,RO99887766,Servicii financiare,260,office@fincore.test",
    ].join("\n")

    const result = parseImportFile(Buffer.from(csv, "utf8"), "portofoliu-diana.csv")

    expect(result.mapping.orgName).not.toBeNull()
    expect(result.mapping.employeeCount).not.toBeNull()
    expect(result.mappingConfidence).toBe("high")
    expect(result.rows.map((row) => row.sector)).toEqual(["health", "transport", "finance"])
    expect(result.rows.map((row) => row.employeeCount)).toEqual(["10-49", "50-249", "250+"])
    expect(result.rows.flatMap((row) => row.warnings)).not.toContain(
      expect.stringContaining("nu a fost recunoscut")
    )
  })
})
