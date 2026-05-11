import { describe, expect, it } from "vitest"

import { parseImportFile } from "@/lib/server/import-parser"

describe("parseImportFile", () => {
  it("acceptă CSV-uri românești cu diacritice și mapează sectorul/angajații Dianei", () => {
    const csv = [
      "Denumire firmă,CUI,Sector,Nr. angajați,Email contact,Persoană contact,Telefon,Oraș,Contract DPO,Observații",
      "Medica Plus SRL,RO12345678,Sănătate,42,office@medica.test,Ana Medica,+40722111222,Ploiești,abonament lunar,clinic nou cu DSAR istoric",
      "TransRapid SRL,RO87654321,Transport și logistică,85,office@transrapid.test,Mihai Transport,+40722333444,Brașov,pilot 30 zile,are DPA-uri în Drive",
      "FinCore SA,RO99887766,Servicii financiare,260,office@fincore.test,Ioana Fin,+40722555666,București,contract activ,AI OFF",
    ].join("\n")

    const result = parseImportFile(Buffer.from(csv, "utf8"), "portofoliu-diana.csv")

    expect(result.mapping.orgName).not.toBeNull()
    expect(result.mapping.employeeCount).not.toBeNull()
    expect(result.mappingConfidence).toBe("high")
    expect(result.rows.map((row) => row.sector)).toEqual(["health", "transport", "finance"])
    expect(result.rows.map((row) => row.employeeCount)).toEqual(["10-49", "50-249", "250+"])
    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        contactName: "Ana Medica",
        phone: "+40722111222",
        city: "Ploiești",
        dpoContract: "abonament lunar",
        notes: "clinic nou cu DSAR istoric",
      })
    )
    expect(result.rows.flatMap((row) => row.warnings)).not.toContain(
      expect.stringContaining("nu a fost recunoscut")
    )
  })

  it("acceptă sectorul servicii profesionale / consultanță pentru cabinete și contabili", () => {
    const csv = [
      "Client,CUI,Domeniu,Nr angajati,Email",
      "Legal Privacy Advisory SRL,RO11223344,servicii profesionale,14,office@legalprivacy.test",
      "Audit GDPR Boutique SRL,RO44332211,consultanta,8,office@auditgdpr.test",
      "Pro Services Hub SRL,RO55667788,professional-services,51,office@proservices.test",
    ].join("\n")

    const result = parseImportFile(Buffer.from(csv, "utf8"), "portofoliu-servicii.csv")

    expect(result.mappingConfidence).toBe("high")
    expect(result.rows.map((row) => row.sector)).toEqual([
      "professional-services",
      "professional-services",
      "professional-services",
    ])
    expect(result.rows.flatMap((row) => row.warnings)).not.toContain(
      expect.stringContaining("Sectorul")
    )
  })
})
