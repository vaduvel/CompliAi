import {
  extractEF004State,
  extractEF005State,
  type FiscalOperationalExplainability,
} from "@/lib/compliscan/finding-kernel"
import type { ScanFinding } from "@/lib/compliance/types"

export type FiscalStatusInterpreterGuide = {
  findingTypeId: "EF-004" | "EF-005"
  eyebrow: string
  title: string
  explanation: string
  steps: string[]
  evidenceItems: string[]
  cockpitNote: string
  primarySurface: "spv" | "validator"
  primaryLabel: string
  secondarySurface?: "spv" | "validator"
  secondaryLabel?: string
}

function buildEF004CockpitNote(state: FiscalOperationalExplainability) {
  const target = [state.invoiceRef ? `factura ${state.invoiceRef}` : "factura", state.entityRef ? `de la ${state.entityRef}` : ""]
    .filter(Boolean)
    .join(" ")

  return [
    `Am verificat ${target} în SPV ANAF la [data și ora].`,
    "Status găsit: [în prelucrare / ok / respinsă].",
    "Acțiune aplicată: [monitorizare 24h / retransmisă / escaladată la ANAF].",
    "Urma păstrată: [screenshot SPV / număr mesaj / referință internă].",
  ].join(" ")
}

function buildEF005CockpitNote(state: FiscalOperationalExplainability) {
  const target = [state.invoiceRef ? `Factura ${state.invoiceRef}` : "Factura", state.entityRef ? `pentru ${state.entityRef}` : ""]
    .filter(Boolean)
    .join(" ")

  return [
    `${target} a fost verificată înainte de transmitere.`,
    "XML validat / reparat în CompliScan la [data și ora], apoi transmis în SPV ANAF la [data și ora].",
    "Confirmare ANAF: [număr mesaj / status ok / status respinsă].",
    "Urma păstrată: [screenshot SPV / recipisă / export ERP].",
  ].join(" ")
}

export function buildFiscalStatusInterpreterGuide(
  findingTypeId: string,
  record: ScanFinding,
): FiscalStatusInterpreterGuide | null {
  if (findingTypeId === "EF-004") {
    const state = extractEF004State(record)
    return {
      findingTypeId: "EF-004",
      eyebrow: "Protocol pentru factură blocată în prelucrare",
      title: "Înțelegi ce înseamnă statusul și ce faci acum",
      explanation: state.description,
      steps: [
        "Deschide verificarea SPV și confirmă statusul exact al facturii în portalul ANAF.",
        "Dacă statusul rămâne \"în prelucrare\" sub 72h, documentează verificarea și reia controlul la 24h.",
        "Dacă a depășit pragul și nu se mișcă, retransmite factura sau escaladează cazul către ANAF / contabil.",
        "Salvează screenshot-ul sau referința ANAF și revino în cockpit cu nota completată.",
      ],
      evidenceItems: [
        state.evidenceNote,
        "Data și ora ultimei verificări în SPV ANAF.",
        "Referința retransmiterii sau a escaladării, dacă a fost necesară.",
      ],
      cockpitNote: buildEF004CockpitNote(state),
      primarySurface: "spv",
      primaryLabel: "Deschide verificarea SPV",
    }
  }

  if (findingTypeId === "EF-005") {
    const state = extractEF005State(record)
    return {
      findingTypeId: "EF-005",
      eyebrow: "Protocol pentru factură netransmisă în SPV",
      title: "Pregătești transmiterea și păstrezi dovada corectă",
      explanation: state.description,
      steps: [
        "Verifică XML-ul înainte de upload. Dacă există îndoieli, rulează validatorul și repair-ul în CompliScan.",
        "Transmite XML-ul către SPV ANAF din ERP sau din fluxul tău fiscal.",
        "Confirmă în SPV că factura a fost primită și păstrează numărul mesajului sau statusul final.",
        "Revino în cockpit cu nota completată și dovada transmisiei.",
      ],
      evidenceItems: [
        state.evidenceNote,
        "Data și ora transmiterii în SPV ANAF.",
        "Numărul mesajului ANAF sau statusul final după transmitere.",
      ],
      cockpitNote: buildEF005CockpitNote(state),
      primarySurface: "validator",
      primaryLabel: "Deschide validatorul XML",
      secondarySurface: "spv",
      secondaryLabel: "Deschide SPV Check",
    }
  }

  return null
}
