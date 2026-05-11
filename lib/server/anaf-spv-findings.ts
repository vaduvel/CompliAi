import type { SpvMessage } from "@/lib/anaf-spv-client"
import type { ScanFinding } from "@/lib/compliance/types"

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
