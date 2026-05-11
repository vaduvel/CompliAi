// Cross-border e-Factura guidance — pain #13 din research:
// "Cross-border PFA/SRL → non-resident services — incertitudine aplicare e-Factura".
//
// Pure-function lib care primește detalii tranzacție și returnează:
//  - Verdict: "obligation" | "exempt" | "optional" | "investigate"
//  - Bază legală
//  - Acțiune recomandată
//
// Sprint 5 EXTEND (2026-05-11): aliniat cu OUG 89/2025 (extindere e-Factura
// la livrări către clienți nerezidenți cu VAT-ID UE) + advisor mode cu pași
// concreți + checklist documentare (CMR, declarație vamală, VIES verify).

export type CrossBorderInput = {
  supplierCountry: string   // ISO 3166-1 alpha-2 (ex: "RO", "DE", "GB")
  supplierVatRegistered: boolean
  customerCountry: string   // ISO 3166-1 alpha-2
  customerType: "b2b" | "b2c"
  customerHasEuVat: boolean
  /** Tranzacție de bunuri sau servicii. */
  transactionKind: "goods" | "services"
  /** Suma RON (pentru praguri specifice). */
  amountRON?: number
}

export type CrossBorderVerdict = {
  efacturaObligation: "obligation" | "exempt" | "optional" | "investigate"
  reasoning: string
  legalReference: string
  recommendedAction: string
  warnings: string[]
}

const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
])

/**
 * Decide aplicabilitatea e-Factura pentru tranzacții cross-border.
 *
 * Reguli (per OUG 120/2021 + Cod Fiscal Art. 319-329):
 *   1. Furnizor RO + Client RO → e-Factura OBLIGATORIE (toate cazurile)
 *   2. Furnizor RO + Client UE B2B cu VAT → e-Factura **OPȚIONALĂ** (recomandată
 *      pentru evidență; obligatorie doar dacă clientul UE e identificat fiscal în RO)
 *   3. Furnizor RO + Client UE B2C → e-Factura OPȚIONALĂ (OSS la TVA UE)
 *   4. Furnizor RO + Client non-UE → EXEMPT (NU se aplică e-Factura RO)
 *   5. Furnizor non-RO + Client RO B2B → OBLIGAȚIE pe furnizor doar dacă e
 *      înregistrat fiscal în RO; altfel "investigate" (reverse charge la importer)
 */
export function evaluateCrossBorderEfactura(input: CrossBorderInput): CrossBorderVerdict {
  const warnings: string[] = []
  const supRO = input.supplierCountry === "RO"
  const cusRO = input.customerCountry === "RO"
  const cusEU = EU_COUNTRIES.has(input.customerCountry)
  const supEU = EU_COUNTRIES.has(input.supplierCountry)

  // Case 1: pură domestică RO → RO
  if (supRO && cusRO) {
    return {
      efacturaObligation: "obligation",
      reasoning: "Tranzacție internă România → e-Factura obligatorie (toate B2B + B2C + B2G).",
      legalReference: "OUG 120/2021 Art. 10, modif. OUG 89/2025 — 5 zile lucrătoare",
      recommendedAction: "Transmite XML în SPV ANAF în 5 zile lucrătoare de la emitere.",
      warnings,
    }
  }

  // Case 2: RO → UE B2B
  if (supRO && cusEU && !cusRO && input.customerType === "b2b") {
    if (input.customerHasEuVat) {
      return {
        efacturaObligation: "optional",
        reasoning: "Furnizor RO + client UE B2B cu VAT-ID valid → livrare intracomunitară. e-Factura NU e obligatorie în SPV ANAF, dar se poate transmite voluntar pentru evidență internă.",
        legalReference: "Cod Fiscal Art. 294 alin. (2) + OUG 120/2021 Art. 4",
        recommendedAction: "Emite factură cu mențiunea „scutire cu drept de deducere — livrare intracomunitară (Art. 294 alin. 2)\". Raportează în VIES (declarația D390). NU e nevoie de SPV.",
        warnings: cusRO ? [] : ["Verifică VAT-ID UE prin VIES înainte de emitere."],
      }
    }
    warnings.push("Client UE B2B FĂRĂ VAT-ID valid — tratează ca B2C UE (TVA RO).")
    return {
      efacturaObligation: "obligation",
      reasoning: "Furnizor RO + client UE B2B fără VAT-ID → tratare similar B2C; TVA RO se aplică.",
      legalReference: "Cod Fiscal Art. 311 + OUG 120/2021",
      recommendedAction: "Aplică TVA RO. Dacă vânzări UE B2C cumulate >10.000 EUR/an, înregistrare OSS recomandată.",
      warnings,
    }
  }

  // Case 3: RO → UE B2C
  if (supRO && cusEU && !cusRO && input.customerType === "b2c") {
    return {
      efacturaObligation: "optional",
      reasoning: "Furnizor RO + client UE B2C → TVA loc client (regim OSS) sau TVA RO dacă <10K EUR/an.",
      legalReference: "Cod Fiscal Art. 278 alin. (5) lit. h) + Reg. UE 282/2011",
      recommendedAction: "Verifică cifra vânzări UE B2C: <10K EUR/an = TVA RO + e-Factura opțională; ≥10K EUR/an = OSS obligatoriu (TVA țară client).",
      warnings: ["Pragul 10K EUR include TOATE vânzările B2C UE cumulate, nu doar către această țară."],
    }
  }

  // Case 4: RO → non-UE
  if (supRO && !cusEU) {
    return {
      efacturaObligation: "exempt",
      reasoning: "Furnizor RO + client non-UE (export) → e-Factura RO NU se aplică. Factură export cu TVA 0%.",
      legalReference: "Cod Fiscal Art. 294 alin. (1) + OUG 120/2021",
      recommendedAction: "Emite factură export cu TVA 0% + mențiune „scutire cu drept de deducere — export\". Documentația vamală EX A este obligatorie.",
      warnings: input.transactionKind === "services" ? ["Pentru servicii non-UE: TVA loc client (Art. 278) — verifică dacă există PE în RO."] : [],
    }
  }

  // Case 5: non-RO furnizor → client RO
  if (!supRO && cusRO) {
    if (input.supplierVatRegistered && supRO) {
      // Imposibil (supRO=false), dar pentru completitudine
      return {
        efacturaObligation: "obligation",
        reasoning: "Furnizor înregistrat fiscal în RO → e-Factura obligatorie.",
        legalReference: "OUG 120/2021 Art. 10",
        recommendedAction: "Transmite XML în SPV ANAF.",
        warnings,
      }
    }
    if (supEU) {
      return {
        efacturaObligation: "investigate",
        reasoning: "Furnizor UE → reverse charge la clientul RO (B2B). Furnizorul UE NU transmite în SPV ANAF.",
        legalReference: "Cod Fiscal Art. 307 + Reg. UE 282/2011",
        recommendedAction: "Clientul RO aplică reverse charge în D300 (rd. 28, 31). Furnizorul UE emite factură comercială (NU e-Factura RO).",
        warnings: ["Verifică VAT-ID furnizor UE prin VIES."],
      }
    }
    return {
      efacturaObligation: "exempt",
      reasoning: "Furnizor non-UE non-RO → import. e-Factura RO NU se aplică (vama gestionează TVA).",
      legalReference: "Cod Fiscal Art. 286 alin. (4) + Codul Vamal",
      recommendedAction: "Declarație vamală IM A (import) + TVA pe vamă. Înregistrare în jurnal cumpărări.",
      warnings,
    }
  }

  // Fallback: cazuri rare / ambigue
  warnings.push("Combinație țări/tip neacoperită standard — solicită consultanță CECCAR / fiscalist.")
  return {
    efacturaObligation: "investigate",
    reasoning: "Tranzacție cross-border atipică — necesită analiză specifică.",
    legalReference: "Cod Fiscal Art. 282 + OUG 120/2021",
    recommendedAction: "Consultă un fiscalist CECCAR specializat pe tranzacții internaționale.",
    warnings,
  }
}

export const SUPPORTED_COUNTRY_CODES = Array.from(EU_COUNTRIES).sort()

// ── Sprint 5 EXTEND — Advisor mode cu checklist documente + verificări ──────

export type CrossBorderAdvisorInput = CrossBorderInput & {
  /** Suma RON (pentru praguri OSS 10K EUR/an). */
  amountRON?: number
  /** Pentru transport: indicare dacă bunul are risc fiscal ridicat (NC8 special). */
  isHighRiskGoods?: boolean
}

export type CrossBorderAdvisor = {
  verdict: CrossBorderVerdict
  /** Checklist concret pentru contabil cu pași actionable. */
  documentationChecklist: Array<{
    item: string
    required: boolean
    legalBasis?: string
  }>
  /** Verificări externe (VIES VAT, OSS registration, e-Transport UIT). */
  externalChecks: Array<{
    label: string
    url?: string
    note: string
  }>
  /** Update post-OUG 89/2025 explicit (când aplică). */
  oug89Note?: string
}

export function evaluateCrossBorderAdvisor(input: CrossBorderAdvisorInput): CrossBorderAdvisor {
  const verdict = evaluateCrossBorderEfactura(input)
  const documentationChecklist: CrossBorderAdvisor["documentationChecklist"] = []
  const externalChecks: CrossBorderAdvisor["externalChecks"] = []
  let oug89Note: string | undefined

  const supRO = input.supplierCountry === "RO"
  const cusEU = EU_COUNTRIES.has(input.customerCountry)
  const cusRO = input.customerCountry === "RO"

  // Documentation checklist
  documentationChecklist.push({
    item: "Factură emisă cu CIF furnizor + denumire + adresă completă",
    required: true,
    legalBasis: "Cod Fiscal Art. 319",
  })

  if (supRO && cusEU && !cusRO) {
    documentationChecklist.push({
      item: "VAT-ID UE valid al clientului (verificat VIES)",
      required: input.customerType === "b2b" && input.customerHasEuVat,
      legalBasis: "Reg. UE 282/2011 Art. 18",
    })
    documentationChecklist.push({
      item: "Document transport (CMR) sau dovadă electronică livrare",
      required: input.transactionKind === "goods",
      legalBasis: "Cod Fiscal Art. 294 alin. (2)",
    })

    externalChecks.push({
      label: "Verifică VAT-ID UE în VIES",
      url: "https://ec.europa.eu/taxation_customs/vies/",
      note: "Obligatoriu înainte de emitere factură intracom. Print/screenshot pentru dosar.",
    })

    if (input.customerType === "b2b" && input.customerHasEuVat) {
      documentationChecklist.push({
        item: "Declarația D390 VIES depusă lunar până la 25 a lunii următoare",
        required: true,
        legalBasis: "Cod Fiscal Art. 325",
      })
      oug89Note =
        "OUG 89/2025 (din 1 ian 2026): facturile către clienți UE B2B cu VAT-ID valid pot fi transmise în SPV RO e-Factura voluntar (înainte erau EXCLUSE). Pentru evidență internă, recomandat. Termen unificat 5 zile lucrătoare."
    }

    if (input.customerType === "b2c") {
      documentationChecklist.push({
        item: "Verificare cifră vânzări UE B2C cumulat (prag OSS 10.000 EUR/an)",
        required: true,
        legalBasis: "Cod Fiscal Art. 311^1",
      })
      externalChecks.push({
        label: "Înregistrare OSS (One Stop Shop)",
        url: "https://anaf.ro/spv/",
        note: "Necesar dacă vânzări B2C UE cumulat > 10.000 EUR/an. TVA țară client.",
      })
    }
  }

  if (supRO && !cusEU) {
    // Export non-UE
    documentationChecklist.push({
      item: "Declarație vamală EX A (export) ștampilată de Vamă",
      required: true,
      legalBasis: "Codul Vamal + Cod Fiscal Art. 294 alin. (1)",
    })
    documentationChecklist.push({
      item: "Mențiune pe factură: 'Scutire cu drept de deducere — export Art. 294 alin. (1)'",
      required: true,
      legalBasis: "Cod Fiscal Art. 294",
    })
    if (input.transactionKind === "services") {
      documentationChecklist.push({
        item: "Determinare loc prestare servicii (regula generală vs derogări B2C/B2B)",
        required: true,
        legalBasis: "Cod Fiscal Art. 278",
      })
    }
  }

  if (!supRO && cusRO) {
    documentationChecklist.push({
      item: "Mențiune reverse charge pe factura primită",
      required: input.customerType === "b2b",
      legalBasis: "Cod Fiscal Art. 307",
    })
    documentationChecklist.push({
      item: "Înregistrare în D300 rd. 28 (achiziții intracom) + rd. 31 (TVA reverse charge)",
      required: input.customerType === "b2b",
      legalBasis: "Cod Fiscal Art. 311",
    })
  }

  // e-Transport (dacă bunuri cu risc fiscal ridicat)
  if (input.transactionKind === "goods" && input.isHighRiskGoods) {
    documentationChecklist.push({
      item: "Cod UIT obținut din e-Transport ÎNAINTE de începerea transportului",
      required: true,
      legalBasis: "OUG 41/2022 + Ordin 802/2022 (lista NC8 bunuri risc fiscal ridicat)",
    })
    externalChecks.push({
      label: "Generare cod UIT în e-Transport",
      url: "https://etransport.anaf.ro/",
      note: "Sancțiuni LIVE din 1 ian 2026: 20.000 RON pentru lipsa GPS + transport fără cod UIT.",
    })
  }

  return {
    verdict,
    documentationChecklist,
    externalChecks,
    oug89Note,
  }
}
