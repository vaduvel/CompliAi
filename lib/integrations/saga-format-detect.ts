// Saga export format detection.
//
// Saga generează DOUĂ formate XML diferite (NU UBL standard!):
//   1. SAGA NATIVE XML — schema proprie cu tag-uri RO (FurnizorNume,
//      ClientCIF, FacturaNumar etc.). File pattern: F_<cif>_<num>_<date>.xml.
//      Folosit pentru import/export între Saga și aplicații externe.
//      Documentație: https://manual.sagasoft.ro/sagac/topic-76-import-date.html
//   2. UBL CIUS-RO XML — generat de Saga când printezi factura cu opțiunea
//      „Formular PDF" (apare în TEMP\Facturi). E standard UBL e-Factura.
//   3. SAF-T D406 XML — export periodic pentru ANAF.
//   4. DBF accounting registers (legacy, nu suportăm încă).
//
// Detectorul folosește filename + primii ~4KB de XML ca să rutezi corect.

import { isSagaInvoiceXml } from "@/lib/integrations/saga-xml-parser"

export type SagaExportType =
  | "saga_native_invoice"     // Schema Saga proprie (FurnizorNume etc.)
  | "saga_efactura_ubl"       // UBL CIUS-RO generat din Saga (TEMP\Facturi)
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
    | "saga-native-parser"
    | "efactura-validator"
    | "saft-parser"
    | "manual-review"
    | "not-supported"
  hint?: string
}

// Patternuri de fișier Saga — convenții oficiale + observate:
//   - F_<cif>_<numar>_<data>.xml — SCHEMA SAGA NATIVĂ (canonic, documentat)
//   - factura{numar}_{seria}_{cui}.xml — UBL e-Factura din Saga (TEMP\Facturi)
//   - SAFT_{cui}_{perioada}.xml — SAF-T D406
//   - NOTE.DBF, JURNAL.DBF (registre)
//   - export_saga_*.xml — generic Saga export
const SAGA_NATIVE_FILENAME = /^F_\d{2,10}_[^_]+_(\d{4}-\d{2}-\d{2}|\d{8})\.xml$/i

const SAGA_FILENAME_PATTERNS = [
  SAGA_NATIVE_FILENAME,
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

  // PRIMARY: Saga native invoice XML (FurnizorNume, ClientCIF etc.)
  // Detectăm fie după filename pattern F_<cif>_<num>_<date>.xml, fie după conținut.
  const isNativeFilename = SAGA_NATIVE_FILENAME.test(fileName)
  const isNativeContent = xmlContent ? isSagaInvoiceXml(xmlContent) : false

  if (isNativeFilename || isNativeContent) {
    return {
      type: "saga_native_invoice",
      confidence: isNativeFilename && isNativeContent ? "high" : "medium",
      isSagaSpecific: true,
      recommendedHandler: "saga-native-parser",
      hint:
        "Schema Saga proprie (Antet/Detalii/Sumar). Trimite la /api/integrations/saga/upload pentru parser dedicat + conversie UBL + validare.",
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

    // UBL CIUS-RO (Saga generează când exporti cu „Formular PDF")
    if (head.includes("<invoice") || head.includes("<creditnote")) {
      const isSaga = SAGA_XML_MARKERS.some((m) => head.includes(m.toLowerCase()))
      const isFilenameSaga = SAGA_FILENAME_PATTERNS.some((p) => p.test(lower))
      return {
        type: isSaga || isFilenameSaga ? "saga_efactura_ubl" : "ubl_generic",
        confidence: isSaga ? "high" : isFilenameSaga ? "medium" : "low",
        isSagaSpecific: isSaga || isFilenameSaga,
        recommendedHandler: "efactura-validator",
        hint:
          "UBL CIUS-RO. Trimite la /api/efactura/validate (single) sau /api/efactura/bulk-upload (ZIP).",
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
    title: 'Pentru factură individuală — "Formular PDF" la tipărire',
    detail:
      'În Saga: ecran "Ieșiri" → selectează factura → "Tipărire" → "Formular PDF". Saga salvează XML UBL CIUS-RO în C:\\SAGA\\TEMP\\Facturi.',
  },
  {
    step: 2,
    title: "Pentru bulk export — Saga XML nativ",
    detail:
      "Meniu: Diverse → Export date XML. Rezultatul: F_<cif>_<numar>_<data>.xml în format Saga propriu (Antet/Detalii/Sumar). Pentru SAF-T D406: ecran SAF-T → Generare pe perioadă.",
  },
  {
    step: 3,
    title: "Salvează fișierele într-un ZIP (sau drag-drop direct)",
    detail:
      "Maximum 200 fișiere / 6 MB. Acceptăm Saga native (F_*.xml), UBL CIUS-RO și SAF-T D406 într-un singur upload.",
  },
  {
    step: 4,
    title: "Trage ZIP-ul sau XML individual în CompliScan",
    detail:
      "Detectăm automat tipul (Saga native după FurnizorNume/CIF, UBL după <Invoice> tag, SAF-T după <AuditFile>) și rulăm parser-ul corect.",
  },
]
