// ANAF SPV e-Factura error code map — Romanian plain language + concrete fix.
// Source: ANAF RO-eFact API documentation + CIUS-RO standard.

export type AnafErrorEntry = {
  code: string
  title: string
  description: string
  fix: string
  severity: "error" | "warning"
}

export const ANAF_ERROR_MAP: Record<string, AnafErrorEntry> = {
  // ── Autentificare / Autorizare ───────────────────────────────────────────────
  E001: {
    code: "E001",
    title: "Certificat digital invalid",
    description: "Certificatul digital folosit pentru autentificare nu este valid sau a expirat.",
    fix: "Reînnoiește certificatul calificat la un furnizor autorizat (ex. certSIGN, DigiSign) și reimportă-l în SPV.",
    severity: "error",
  },
  E002: {
    code: "E002",
    title: "CUI neatribuit în SPV",
    description: "CUI-ul nu are drepturi de acces la SPV sau nu este înregistrat.",
    fix: "Accesează portalul ANAF și înregistrează CUI-ul în Spațiul Privat Virtual. Necesită semnătură digitală calificată.",
    severity: "error",
  },
  E003: {
    code: "E003",
    title: "Token de acces expirat",
    description: "Token-ul OAuth2 de acces la API ANAF a expirat.",
    fix: "Solicită un nou token de acces folosind refresh_token. Verifică că flow-ul de reînnoire automată funcționează.",
    severity: "error",
  },

  // ── Validare XML / CIUS-RO ───────────────────────────────────────────────────
  V001: {
    code: "V001",
    title: "XML invalid — structură neconformă CIUS-RO",
    description: "Fișierul XML nu respectă schema CIUS-RO (UBL 2.1 Invoice).",
    fix: "Validează XML-ul față de schema oficială CIUS-RO înainte de transmitere. Verifică namespace-urile și elementele obligatorii.",
    severity: "error",
  },
  V002: {
    code: "V002",
    title: "CustomizationID lipsă sau greșit",
    description: "Elementul CustomizationID nu conține valoarea corectă pentru CIUS-RO.",
    fix: 'Setează CustomizationID la "urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1".',
    severity: "error",
  },
  V003: {
    code: "V003",
    title: "InvoiceTypeCode lipsă sau invalid",
    description: "Codul tipului de factură (InvoiceTypeCode) lipsește sau nu este acceptat.",
    fix: 'Folosește "380" pentru factura obișnuită sau "381" pentru factură de credit (storno). Valori conform EN16931.',
    severity: "error",
  },
  V004: {
    code: "V004",
    title: "ID factură lipsă",
    description: "Numărul facturii (ID) este absent sau gol.",
    fix: "Completează elementul <ID> cu numărul unic al facturii (ex. FAC-2024-001).",
    severity: "error",
  },
  V005: {
    code: "V005",
    title: "IssueDate lipsă sau format incorect",
    description: "Data emiterii facturii lipsește sau nu respectă formatul ISO 8601.",
    fix: 'Completează elementul <IssueDate> cu data în format YYYY-MM-DD (ex. "2024-03-15").',
    severity: "error",
  },
  V006: {
    code: "V006",
    title: "DocumentCurrencyCode lipsă",
    description: "Codul monedei de decontare este absent.",
    fix: 'Adaugă <DocumentCurrencyCode>RON</DocumentCurrencyCode> sau codul ISO 4217 al monedei folosite.',
    severity: "error",
  },
  V007: {
    code: "V007",
    title: "Date furnizor incomplete",
    description: "Informațiile despre furnizor (AccountingSupplierParty) sunt incomplete sau lipsesc.",
    fix: "Completează: CompanyID (CUI), RegistrationName, PostalAddress. CUI-ul trebuie să corespundă celui înregistrat la ANAF.",
    severity: "error",
  },
  V008: {
    code: "V008",
    title: "Date client incomplete",
    description: "Informațiile despre client (AccountingCustomerParty) sunt incomplete sau lipsesc.",
    fix: "Completează: CompanyID (CUI sau CNP), RegistrationName, PostalAddress pentru clientul destinatar.",
    severity: "error",
  },
  V009: {
    code: "V009",
    title: "TaxTotal lipsă sau incorect",
    description: "Totalul TVA (TaxTotal) lipsește sau sumele nu se potrivesc cu liniile de factură.",
    fix: "Verifică că suma TaxAmount din TaxTotal corespunde cu suma TVA calculată pe toate liniile. Toleranță: 0 RON.",
    severity: "error",
  },
  V010: {
    code: "V010",
    title: "LegalMonetaryTotal incorect",
    description: "Totalul monetar legal nu corespunde cu suma liniilor de factură.",
    fix: "Recalculează LineExtensionAmount, TaxExclusiveAmount, TaxInclusiveAmount, PayableAmount. Suma liniilor trebuie să corespundă.",
    severity: "error",
  },
  V011: {
    code: "V011",
    title: "Linie de factură invalidă",
    description: "Una sau mai multe linii de factură (InvoiceLine) conțin date invalide sau lipsă.",
    fix: "Fiecare InvoiceLine trebuie să aibă: ID, InvoicedQuantity cu unitCode, LineExtensionAmount, Item/Name, Price/PriceAmount.",
    severity: "error",
  },

  // ── Duplicate / Perioadă ──────────────────────────────────────────────────────
  D001: {
    code: "D001",
    title: "Factură duplicată",
    description: "O factură cu același număr a fost deja transmisă cu succes.",
    fix: "Verifică în portalul e-Factura dacă factura există deja. Dacă retransmiți, folosește un număr de factură diferit.",
    severity: "error",
  },
  D002: {
    code: "D002",
    title: "Perioadă fiscală închisă",
    description: "Perioada fiscală pentru data facturii este deja închisă sau depășit termenul de transmitere.",
    fix: "Transmite facturile în termen de 5 zile lucrătoare de la emitere. Contactează ANAF pentru transmitere tardivă.",
    severity: "error",
  },

  // ── Semnătură digitală ────────────────────────────────────────────────────────
  S001: {
    code: "S001",
    title: "Semnătură digitală invalidă",
    description: "Semnătura digitală aplicată pe fișier nu este validă sau a fost coruptă.",
    fix: "Resemnează fișierul XML cu certificatul calificat valid. Asigură-te că XML-ul nu a fost modificat după semnare.",
    severity: "error",
  },
  S002: {
    code: "S002",
    title: "Certificat semnătură expirat",
    description: "Certificatul folosit la semnare a expirat.",
    fix: "Reînnoiește certificatul calificat de semnătură și re-semnează documentul.",
    severity: "error",
  },

  // ── CUI / Identificare ────────────────────────────────────────────────────────
  C001: {
    code: "C001",
    title: "CUI furnizor neidentificat în ANAF",
    description: "CUI-ul furnizorului nu există în baza de date ANAF sau este inactiv.",
    fix: "Verifică CUI-ul la anaf.ro/verificare-cif. Dacă entitatea este nouă, asigură-te că înregistrarea fiscală este finalizată.",
    severity: "error",
  },
  C002: {
    code: "C002",
    title: "CUI client neidentificat în ANAF",
    description: "CUI-ul clientului destinatar nu există sau nu este activ în ANAF.",
    fix: "Verifică CUI-ul clientului. Dacă este persoană fizică, asigură-te că folosești CNP, nu CUI.",
    severity: "warning",
  },
  C003: {
    code: "C003",
    title: "Furnizor neinregistrat pentru e-Factura",
    description: "Furnizorul nu este înscris în Registrul RO e-Factura.",
    fix: "Înscrie-te în Registrul RO e-Factura prin portalul ANAF. Obligatoriu din 2024 pentru tranzacțiile B2B.",
    severity: "error",
  },

  // ── Sistem / Tehnice ────────────────────────────────────────────────────────
  T001: {
    code: "T001",
    title: "Serviciu ANAF temporar indisponibil",
    description: "API-ul ANAF e-Factura nu răspunde sau returnează eroare internă.",
    fix: "Retransmite după 15-30 minute. Verifică statusul serviciilor ANAF la status.anaf.ro. Dacă persistă, contactează helpdesk ANAF.",
    severity: "error",
  },
  T002: {
    code: "T002",
    title: "Fișier prea mare",
    description: "Dimensiunea fișierului XML depășește limita acceptată de ANAF (5 MB).",
    fix: "Reduce numărul de linii de factură pe document sau elimină datele inutile. Limita ANAF este de 5 MB per fișier.",
    severity: "error",
  },
  T003: {
    code: "T003",
    title: "Encoding XML incorect",
    description: "Fișierul XML nu folosește encoding-ul UTF-8 declarat.",
    fix: 'Salvează fișierul XML cu encoding UTF-8 (fără BOM). Adaugă <?xml version="1.0" encoding="UTF-8"?> la prima linie.',
    severity: "error",
  },
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

export function lookupAnafError(code: string): AnafErrorEntry | null {
  return ANAF_ERROR_MAP[code.toUpperCase()] ?? null
}

export type EnrichedAnafError = {
  original: string
  entry: AnafErrorEntry | null
}

/** Given a raw ANAF error message string, find all matching codes and enrich them. */
export function enrichAnafErrors(rawErrors: string[]): EnrichedAnafError[] {
  return rawErrors.map((raw) => {
    // Try to extract a code pattern like E001, V002, D001, etc.
    const match = raw.match(/\b([A-Z]\d{3})\b/)
    const entry = match ? lookupAnafError(match[1]) : null
    return { original: raw, entry }
  })
}
