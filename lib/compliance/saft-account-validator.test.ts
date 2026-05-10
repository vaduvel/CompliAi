import { describe, it, expect } from "vitest"
import { validateSaftAccountStructure } from "./saft-account-validator"

describe("validateSaftAccountStructure", () => {
  it("flagheaza AccountID cu format invalid", () => {
    const xml = `<AuditFile><GeneralLedgerAccounts>
      <Account><AccountID>442</AccountID></Account>
      <Account><AccountID>4423</AccountID></Account>
      <Account><AccountID>ABC</AccountID></Account>
    </GeneralLedgerAccounts></AuditFile>`
    const findings = validateSaftAccountStructure(xml)
    const sa001 = findings.filter((f) => f.code === "SA-001")
    expect(sa001.length).toBe(1)  // ABC e invalid
    expect(sa001[0].context).toBe("ABC")
  })

  it("flagheaza cont 442 trunchiat fără 4423/4426/4427", () => {
    const xml = `<AuditFile><GeneralLedgerAccounts>
      <Account><AccountID>442</AccountID></Account>
    </GeneralLedgerAccounts></AuditFile>`
    const findings = validateSaftAccountStructure(xml)
    expect(findings.some((f) => f.code === "SA-002")).toBe(true)
  })

  it("flagheaza TaxRegistrationNumber invalid", () => {
    const xml = `<AuditFile><Customer>
      <Name>Acme</Name>
      <TaxRegistrationNumber>XX-NOT-VALID</TaxRegistrationNumber>
    </Customer></AuditFile>`
    const findings = validateSaftAccountStructure(xml)
    expect(findings.some((f) => f.code === "SA-004")).toBe(true)
  })

  it("flagheaza Product fără ProductCode", () => {
    const xml = `<AuditFile>
      <Product><Name>Item 1</Name></Product>
      <Product><Name>Item 2</Name></Product>
      <Product><Name>Item 3</Name></Product>
      <Product><Name>Item 4</Name></Product>
      <Product><Name>Item 5</Name></Product>
      <Product><Name>Item 6</Name></Product>
    </AuditFile>`
    const findings = validateSaftAccountStructure(xml)
    const sa005 = findings.find((f) => f.code === "SA-005")
    expect(sa005).toBeDefined()
    expect(sa005?.severity).toBe("error")  // > 5 missing → error
  })

  it("flagheaza dezechilibru debit/credit", () => {
    const xml = `<AuditFile><Transaction>
      <DebitAmount>100</DebitAmount>
      <CreditAmount>90</CreditAmount>
    </Transaction></AuditFile>`
    const findings = validateSaftAccountStructure(xml)
    expect(findings.some((f) => f.code === "SA-006")).toBe(true)
  })

  it("nu produce false positives pe SAF-T curat", () => {
    const xml = `<AuditFile>
      <GeneralLedgerAccounts>
        <Account><AccountID>4423</AccountID></Account>
        <Account><AccountID>4426</AccountID></Account>
        <Account><AccountID>4427</AccountID></Account>
      </GeneralLedgerAccounts>
      <Customer><TaxRegistrationNumber>RO12345678</TaxRegistrationNumber></Customer>
    </AuditFile>`
    const findings = validateSaftAccountStructure(xml)
    expect(findings.length).toBe(0)
  })
})
