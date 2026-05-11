import type { SpvMessage } from "@/lib/anaf-spv-client"
import type {
  EFacturaInvoiceSignal,
  EFacturaSignalStatus,
} from "@/lib/compliance/efactura-risk"
import type { ScanFinding } from "@/lib/compliance/types"

function parseAnafDate(dataCreare: string | undefined | null): string {
  if (!dataCreare) return new Date().toISOString().slice(0, 10)
  const match = String(dataCreare).match(/^(\d{4})(\d{2})(\d{2})/)
  if (!match) return new Date().toISOString().slice(0, 10)
  return `${match[1]}-${match[2]}-${match[3]}`
}

function classifySpvStatus(tip: string): EFacturaSignalStatus {
  const lower = tip.toLowerCase()
  if (lower.includes("erori")) return "xml-error"
  if (lower.includes("respins") || lower.includes("nok")) return "rejected"
  if (lower.includes("prelucrare")) return "processing-delayed"
  return "unsubmitted"
}

export function spvMessageToInvoiceSignal(msg: SpvMessage): EFacturaInvoiceSignal {
  return {
    id: `spv-${msg.id}`,
    vendorName: "Furnizor SPV (din ANAF)",
    invoiceNumber: msg.id,
    date: parseAnafDate(msg.dataCreare),
    status: classifySpvStatus(msg.tip),
    reason: msg.detalii?.slice(0, 240) ?? msg.tip,
    isTechVendor: false,
  }
}

export function spvMessageToFinding(msg: SpvMessage, nowISO: string): ScanFinding {
  const isRejected =
    msg.tip.toLowerCase().includes("erori") || msg.tip.toLowerCase().includes("respins")
  const severity = isRejected ? "high" : "medium"

  return {
    id: `spv-${msg.id}`,
    title: isRejected
      ? `Factură respinsă ANAF — ${msg.detalii.slice(0, 80)}`
      : `Semnal SPV: ${msg.tip} — ${msg.detalii.slice(0, 80)}`,
    detail: `Mesaj SPV din ${msg.dataCreare}: ${msg.detalii}`,
    category: "E_FACTURA",
    severity,
    risk: severity === "high" ? "high" : "low",
    principles: [],
    createdAtISO: nowISO,
    sourceDocument: "ANAF SPV",
    scanId: `spv-${nowISO.split("T")[0]}`,
    impactSummary: isRejected
      ? "Factura a fost respinsă de ANAF. Corectează eroarea și retrimite din programul de facturare."
      : `Semnal ${msg.tip} detectat în SPV. Verifică și acționează conform regulilor ANAF.`,
    remediationHint: isRejected
      ? "Corectează eroarea XML/UBL în programul de facturare și retrimite factura. Confirmă manual în CompliAI după rezolvare."
      : "Verifică mesajul în SPV și acționează dacă este necesar.",
  }
}

export function buildMissingSpvFinding(cui: string, nowISO: string): ScanFinding {
  return {
    id: `spv-missing-${cui}`,
    title: "Înregistrare SPV lipsă",
    detail: `Organizația cu CUI ${cui} nu pare a fi înregistrată în Spațiul Privat Virtual ANAF. Înregistrarea este obligatorie pentru e-Factura.`,
    category: "E_FACTURA",
    severity: "high",
    risk: "high",
    principles: [],
    createdAtISO: nowISO,
    sourceDocument: "SPV Check",
    scanId: `spv-${nowISO.split("T")[0]}`,
    impactSummary: "Fără SPV nu poți primi/trimite e-Facturi conform obligațiilor ANAF.",
    remediationHint:
      "Accesează https://www.anaf.ro/anaf/internet/ANAF/despre_anaf/servicii_online/SPV și înregistrează-te cu certificatul digital calificat.",
  }
}

export function pickRejectionMessages(messages: SpvMessage[]): SpvMessage[] {
  return messages.filter(
    (m) =>
      m.tip.toLowerCase().includes("erori") || m.tip.toLowerCase().includes("respins")
  )
}
