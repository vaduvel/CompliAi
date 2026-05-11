# ANAF e-Factura Validation Rules — Complete Reference

**Source**: Research extracted from official EU CEN/CENELEC EN16931 Schematron + phive-rules CIUS-RO 1.0.9 XSLT compiled Schematron, 2026-05-11. See Section F for verbatim source URLs.

**Status**: ANAF currently enforces CIUS-RO 1.0.9 (since 2024-06-05). Our validator V012-V020 covers a subset; gaps to close are listed at the bottom.

## Section A: BR-XX (EN 16931 Base Rules) — 65 base + VAT category families

| Code | Description | When | Severity |
|------|-------------|------|----------|
| BR-01 | CustomizationID required | Always | error |
| BR-02 | Invoice number required | Always | error |
| BR-03 | IssueDate required | Always | error |
| BR-04 | InvoiceTypeCode required | Always | error |
| BR-05 | DocumentCurrencyCode required | Always | error |
| BR-06 | Seller name required | Always | error |
| BR-07 | Buyer name required | Always | error |
| BR-08 | Seller postal address required | Always | error |
| BR-09 | Seller country code required | Always | error |
| BR-10 | Buyer postal address required | Always | error |
| BR-11 | Buyer country code required | Always | error |
| BR-12 | Sum of line net amounts (BT-106) required | Always | error |
| BR-13 | Total without VAT (BT-109) required | Always | error |
| BR-14 | Total with VAT (BT-112) required | Always | error |
| BR-15 | PayableAmount (BT-115) required | Always | error |
| BR-16 | At least one InvoiceLine | Always | error |
| BR-17–BR-20 | Payee + TaxRep cardinality | Conditional | error |
| BR-21–BR-25 | Per-line basics (ID, qty, unit, net amount, item name) | Per line | error |
| BR-26 | Each line shall have Item net price | Per line | error |
| BR-27/BR-28 | Item prices shall not be negative | Per line | error |
| BR-29/BR-30 | Period end ≥ start | Conditional | error |
| BR-31–BR-44 | Doc-level + line-level allowance/charge basics | Conditional | error |
| BR-45–BR-48 | VAT breakdown basics (taxable amount, tax amount, category, rate) | Per TaxSubtotal | error |
| BR-49–BR-50 | Payment means basics | Conditional | error |
| BR-52–BR-65 | Misc references, electronic addresses, item ids | Conditional | error |

**VAT-category families** (`BR-AE/E/G/IC/AF/AG/O/S/Z/B-01..10`): each enforces cardinality + rate constraints + sum match for the given category code.

**Decimal precision**: `BR-DEC-01..28` — every monetary field ≤ 2 fraction digits.

**Code-list checks**: `BR-CL-01..26` — see Section E.

## Section B: BR-CO-XX (Cross-Validation / Math)

| Code | Condition |
|------|-----------|
| BR-CO-03 | TaxPointDate and InvoicePeriod/DescriptionCode are mutually exclusive |
| BR-CO-04 | Each line Item must have ClassifiedTaxCategory |
| BR-CO-09 | VAT identifiers prefixed with ISO 3166-1 alpha-2 (except "EL" for Greece) |
| BR-CO-10 | `LegalMonetaryTotal/LineExtensionAmount = Σ InvoiceLine/LineExtensionAmount` |
| BR-CO-11 | `AllowanceTotalAmount = Σ doc-level allowances` |
| BR-CO-12 | `ChargeTotalAmount = Σ doc-level charges` |
| BR-CO-13 | `TaxExclusiveAmount = LineExtensionAmount − AllowanceTotal + ChargeTotal` |
| BR-CO-14 | `TaxTotal/TaxAmount = Σ TaxSubtotal/TaxAmount` |
| BR-CO-15 | `TaxInclusiveAmount = TaxExclusiveAmount + TaxTotal/TaxAmount` |
| BR-CO-16 | `PayableAmount = TaxInclusiveAmount − PrepaidAmount + PayableRoundingAmount` |
| BR-CO-17 | `TaxAmount = round(TaxableAmount × Percent / 100, 2)` per TaxSubtotal |
| BR-CO-18 | At least one TaxSubtotal |
| BR-CO-19/BR-CO-20 | If period present, at least one of start/end date |
| BR-CO-21–BR-CO-24 | Allowance/charge must have reason or reason code |
| BR-CO-25 | If PayableAmount > 0, DueDate or PaymentTerms required |
| BR-CO-26 | Seller must have at least one identifier (PartyID OR legal CompanyID OR VAT ID) |

## Section C: BR-RO-XXX (Romania-specific, CIUS-RO 1.0.9)

| Code | Rule |
|------|------|
| BR-RO-001 | CustomizationID = `urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1` |
| BR-RO-010 | Invoice number must contain at least one digit |
| BR-RO-020 | InvoiceTypeCode ∈ {380, 384, 389, 751}; CreditNote ∈ {381} |
| BR-RO-030 | If DocumentCurrencyCode ≠ RON, TaxCurrencyCode must = RON |
| BR-RO-040 | InvoicePeriod/DescriptionCode ∈ {3, 35, 432} |
| BR-RO-065 | Seller or TaxRep must have VAT ID |
| BR-RO-080/081/082 | StreetName required (Seller / Buyer / both) |
| BR-RO-090/091/092 | CityName required |
| BR-RO-100/101 | If country=RO and subentity=RO-B, CityName ∈ {SECTOR1..SECTOR6} |
| BR-RO-110/111 | If country=RO, CountrySubentity matches `RO-[A-Z]{1,2}` |
| BR-RO-120 | Buyer must have legal-reg-ID or VAT ID |
| BR-RO-140/150/160/170 | TaxRep equivalents |
| BR-RO-180/201/202/211/212 | Delivery address equivalents |
| BR-RO-A020 | Max 20 `cbc:Note` per invoice |
| BR-RO-A052 | Max 50 `AdditionalItemProperty` per line |
| BR-RO-DT001..006 | Dates strictly `YYYY-MM-DD` |
| BR-RO-Lxxx | Length constraints — see length table below |

### Length constraints (BR-RO-Lxxx)

| Field | Max |
|-------|-----|
| Invoice number, Contract/Order references, party names | 200 |
| Street name (address line 1) | 150 |
| Address line 2/3, contact info, accounting cost | 100 |
| CityName | 50 |
| PostalZone | 20 |
| PaymentID | 140 |
| Item Name | 100 |
| Item Description, Note | 200 / 300 |

## Section D: UBL Syntax / Data Type / Conformance

- **UBL-SR-01..56** — cardinality constraints (e.g., max one PartyName/Name, max one InvoicePeriod, exactly one ClassifiedTaxCategory per item)
- **UBL-DT-01..28** — amounts ≤ 2 fraction digits, binary attachments must have @mimeCode + @filename, list of forbidden attributes
- **UBL-CR-001..682** — 682 warning-level rules forbidding optional UBL elements outside EN 16931 (do not block ANAF submission)

## Section E: Code lists summary

| Field | Codes |
|-------|-------|
| **InvoiceTypeCode** (RO-restricted) | 380, 384, 389, 751 (+ 381 for CreditNote) |
| **PaymentMeansCode** common | 30 (credit transfer), 31 (debit), 42 (PaymentToBankAccount), 48 (card), 49 (direct debit), 58 (SEPA credit), 59 (SEPA debit) |
| **TaxCategory ID** (UNCL 5305) | S, Z, E, AE, K, G, O, L, M, B |
| **DescriptionCode** (period, RO-restricted) | 3, 35, 432 |
| **Country code** (BR-CL-14) | ISO 3166-1 alpha-2 (RO, FR, DE, ...) |
| **Country subentity** (BR-RO-110/111) | ISO 3166-2:RO codes (see below) |
| **CityName when RO-B** | SECTOR1, SECTOR2, SECTOR3, SECTOR4, SECTOR5, SECTOR6 (exact, case-sensitive) |
| **Quantity unit code** common | C62, EA, H87, KGM, LTR, MTR, HUR, DAY, MON, ANN, PCE, SET |
| **MIME types allowed** | application/pdf, image/png, image/jpeg, text/csv, .xlsx, .ods |

### ISO 3166-2:RO codes (full list)

RO-AB Alba, RO-AR Arad, RO-AG Argeș, RO-BC Bacău, RO-BH Bihor, RO-BN Bistrița-Năsăud, RO-BT Botoșani, RO-BR Brăila, RO-BV Brașov, RO-B București, RO-BZ Buzău, RO-CL Călărași, RO-CS Caraș-Severin, RO-CJ Cluj, RO-CT Constanța, RO-CV Covasna, RO-DB Dâmbovița, RO-DJ Dolj, RO-GL Galați, RO-GR Giurgiu, RO-GJ Gorj, RO-HR Harghita, RO-HD Hunedoara, RO-IL Ialomița, RO-IS Iași, RO-IF Ilfov, RO-MM Maramureș, RO-MH Mehedinți, RO-MS Mureș, RO-NT Neamț, RO-OT Olt, RO-PH Prahova, RO-SJ Sălaj, RO-SM Satu Mare, RO-SB Sibiu, RO-SV Suceava, RO-TR Teleorman, RO-TM Timiș, RO-TL Tulcea, RO-VL Vâlcea, RO-VS Vaslui, RO-VN Vrancea

### ANAF operational limits

- Max XML upload size: 10 MB (current; historic docs say 3 MB)
- Max attachments per invoice: 50
- Retention online: 60 days, then archive
- Auth: OAuth2 + qualified digital certificate registered in SPV

## Section F: Authoritative sources

- EN 16931 base UBL Schematron: https://raw.githubusercontent.com/ConnectingEurope/eInvoicing-EN16931/master/ubl/schematron/abstract/EN16931-model.sch
- UBL syntax rules: https://raw.githubusercontent.com/ConnectingEurope/eInvoicing-EN16931/master/ubl/schematron/UBL/EN16931-UBL-syntax.sch
- UBL code list checks: https://raw.githubusercontent.com/ConnectingEurope/eInvoicing-EN16931/master/ubl/schematron/codelist/EN16931-UBL-codes.sch
- CIUS-RO 1.0.9 compiled XSLT: https://raw.githubusercontent.com/phax/phive-rules/master/phive-rules-cius-ro/src/main/resources/external/schematron/1.0.9/ROeFactura-UBL-validation-Invoice_v1.0.9.xslt
- phive-rules repo: https://github.com/phax/phive-rules/tree/master/phive-rules-cius-ro/src/main/resources/external/schematron
- MF official tech page: https://mfinante.gov.ro/en/web/efactura/informatii-tehnice
- ANAF live validator (public): https://www.anaf.ro/uploadxmi/
- Lege5 mirror of Ordin 1366/2021: https://lege5.ro/Gratuit/he3dcobrgq2a/specificatii-tehnice-...-ordin-1366-2021
- VATupdate English translation of ANAF guide: https://www.vatupdate.com/2023/12/17/guide-on-the-use-of-the-national-electronic-invoicing-system-ro-e-invoice-english-translation/
- EN16931 Peppol mirror: https://docs.peppol.eu/poacc/billing/3.0/

## Status — what CompliAI's validator already covers (V012–V020)

| V-code | Maps to |
|--------|---------|
| V012 | UBL-SR-48 + BR-25 |
| V013 | BR-25 |
| V014 | BR-RO-001 |
| V015 | BR-08 + BR-10 |
| V016 | BR-RO-080/081/082 |
| V017 | BR-RO-090/091/092 |
| V018 | BR-RO-100/101 (+ SECTOR-RO code list) |
| V019 | BR-CO-04 + UBL-SR-48 |
| V020 | BR-26 |

## Highest-leverage gaps to close next

In order of empirical impact on ANAF rejections:

1. **Math sums (BR-CO-10..17)** — pure arithmetic; catches majority of post-structural rejections.
2. **BR-RO-020** — InvoiceTypeCode restricted set.
3. **BR-RO-010** — invoice number must contain digit.
4. **BR-RO-110/111** — RO subentity ISO 3166-2 format.
5. **BR-RO-120** — Buyer ID required.
6. **BR-CO-09** — VAT ID ISO prefix.
7. **BR-CL-14** — country codes ISO 3166-1 alpha-2.
8. **BR-RO-DT001..006** — date format strict.
9. **BR-RO-Lxxx** — length constraints.

Verified live against ANAF sandbox 2026-05-11; full circuit closed with `stare=ok` (correlation ids `c9f3a6055626d963441f25ec37ee8e34`, `6106b764421235b9dace53662ff4ffa1`).
