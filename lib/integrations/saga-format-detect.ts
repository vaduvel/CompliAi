// Saga export format detection — Saga nu are REST API, doar export fișiere.
//
// Saga generează:
//   - XML UBL CIUS-RO per factură (e-Factura) — folosim validator existent
//   - SAF-T D406 XML — folosim parser-ul existent
//   - DBF accounting registers (legacy, nu suportăm încă)
//
// Helper-ul ăsta detectează formatul din numele fișierului + primii bytes
// XML, ca să putem ruta corect spre validator/parser.

export type SagaExportType =
  | "saga_efactura_xml"      // UBL Invoice generat din Saga
  | "saga_saft_d406"          // SAF-T D406 export Saga
  | "saga_dbf"                // DBF (nu suportat)
  | "ubl_generic"             // UBL Invoice de la alt ERP
  | "saft_generic"            // SAF-T generic
  | "unknown"

export type SagaDetection = {
  type: SagaExportType
  confidence: "high" | "medium" | "low"
  isSagaSpecific: boolean
  recommendedHandler:
    | "efactura-validator"
    | "saft-parser"
    | "manual-review"
    | "not-supported"
  hint?: string
}

// Patternuri de fișier Saga — convenții observate:
//   - factura{numar}_{seria}_{cui}.xml
//   - SAFT_{cui}_{perioada}.xml
//   - NOTE.DBF, JURNAL.DBF (registre)
//   - export_saga_*.xml
const SAGA_FILENAME_PATTERNS = [
  /^factura[_-]?\d+/i,
  /^export[_-]saga/i,
  /saga[_-]export/i,
  /^saft[_-]/i,
]

const SAGA_XML_MARKERS = [
  "saga",
  "sagasoft",
  "creator>Saga",
  "applicationName>Saga",
]

export function detectSagaExport(fileName: string, xmlContent: string | null): SagaDetection {
  const lower = fileName.toLowerCase()

  // DBF — not supported yet
  if (lower.endsWith(".dbf")) {
    return {
      type: "saga_dbf",
      confidence: "high",
      isSagaSpecific: true,
      recommendedHandler: "not-supported",
      hint:
        "Format DBF — nu îl putem parsa încă. Exportează din Saga ca XML SAF-T sau UBL e-Factura pentru analiză.",
    }
  }

  // SAF-T detection (header XML)
  if (xmlContent) {
    const head = xmlContent.slice(0, 2000).toLowerCase()
    if (head.includes("<auditfile") || head.includes("auditfilecountry")) {
      const isSaga = SAGA_XML_MARKERS.some((m) => head.includes(m.toLowerCase()))
      return {
        type: isSaga ? "saga_saft_d406" : "saft_generic",
        confidence: "high",
        isSagaSpecific: isSaga,
        recommendedHandler: "saft-parser",
        hint: "Trimite la /api/fiscal/d406-upload pentru calcul scor de igienă SAF-T.",
      }
    }

    if (head.includes("<invoice") || head.includes("<creditnote")) {
      const isSaga = SAGA_XML_MARKERS.some((m) => head.includes(m.toLowerCase()))
      const isFilenameSaga = SAGA_FILENAME_PATTERNS.some((p) => p.test(lower))
      return {
        type: isSaga || isFilenameSaga ? "saga_efactura_xml" : "ubl_generic",
        confidence: isSaga ? "high" : isFilenameSaga ? "medium" : "low",
        isSagaSpecific: isSaga || isFilenameSaga,
        recommendedHandler: "efactura-validator",
        hint:
          "Trimite la /api/efactura/validate (single) sau /api/efactura/bulk-upload (ZIP) pentru validare UBL CIUS-RO.",
      }
    }
  }

  // Filename-only fallback
  if (SAGA_FILENAME_PATTERNS.some((p) => p.test(lower))) {
    return {
      type: "unknown",
      confidence: "low",
      isSagaSpecific: true,
      recommendedHandler: "manual-review",
      hint: "Fișier care pare Saga, dar nu am putut identifica formatul. Verifică conținutul.",
    }
  }

  return {
    type: "unknown",
    confidence: "low",
    isSagaSpecific: false,
    recommendedHandler: "manual-review",
    hint: "Format nerecunoscut. Asigură-te că exporti XML SAF-T sau UBL e-Factura din Saga.",
  }
}

// ── Workflow guide pentru contabil ───────────────────────────────────────────

export const SAGA_EXPORT_STEPS: Array<{ step: number; title: string; detail: string }> = [
  {
    step: 1,
    title: "Deschide modulul de raportare în Saga",
    detail:
      "Meniu: Salarizare/Contabilitate → Rapoarte → e-Factura SAF-T. Selectează perioada (luna sau trimestrul).",
  },
  {
    step: 2,
    title: "Exportă în format XML",
    detail:
      'Pentru e-Factura: alege "UBL CIUS-RO XML" per factură sau în lot. Pentru SAF-T D406: alege "SAF-T XML standard 2.4.7".',
  },
  {
    step: 3,
    title: "Salvează fișierele într-un ZIP",
    detail:
      "Pune toate XML-urile (e-Factura sau SAF-T) într-un singur fișier .zip. Maximum 200 facturi sau 6 MB.",
  },
  {
    step: 4,
    title: "Trage ZIP-ul în CompliScan",
    detail:
      "Drag-drop direct în zona de upload de mai jos. Detectăm automat formatul și rulăm validatorul corect (UBL pentru facturi, scor de igienă pentru SAF-T).",
  },
]
