// GOLD 6 — ANSPDCP Breach Notification Rescue Finding
// Când un incident NIS2 implică date cu caracter personal, se injectează automat
// un finding separat în coada De rezolvat: „Notifică ANSPDCP în 72h (GDPR Art. 33)"

import type { ScanFinding } from "@/lib/compliance/types"
import type { AnspdcpNotificationStatus } from "@/lib/server/nis2-store"

export const ANSPDCP_FINDING_PREFIX = "anspdcp-breach-"

export function anspdcpFindingId(incidentId: string) {
  return `${ANSPDCP_FINDING_PREFIX}${incidentId}`
}

/**
 * Construiește finding-ul de urgență ANSPDCP pentru un incident cu date personale.
 * Returnează null dacă notificarea ANSPDCP a fost deja confirmată (acknowledged).
 */
export function buildAnspdcpBreachFinding(
  incidentId: string,
  incidentTitle: string,
  detectedAtISO: string,
  anspdcpStatus: AnspdcpNotificationStatus | undefined,
  nowISO: string
): ScanFinding | null {
  if (anspdcpStatus === "acknowledged") return null

  const deadline72h = new Date(new Date(detectedAtISO).getTime() + 72 * 3_600_000)
  const hoursLeft = Math.round((deadline72h.getTime() - Date.now()) / 3_600_000)
  const expired = hoursLeft <= 0
  const urgent = !expired && hoursLeft <= 24
  const severity = expired ? "critical" : urgent ? "high" : "high"

  const deadlineLabel = expired
    ? `Termenul de 72h a expirat cu ${Math.abs(hoursLeft)}h în urmă`
    : `${hoursLeft}h rămase din 72h`

  return {
    id: anspdcpFindingId(incidentId),
    title: `Notificare ANSPDCP obligatorie — ${incidentTitle}`,
    detail: [
      `Incidentul NIS2 "${incidentTitle}" implică date cu caracter personal.`,
      `GDPR Art. 33 impune notificarea ANSPDCP în **72h de la descoperire**. ${deadlineLabel}.`,
      "",
      "Această notificare este **separată** de raportarea DNSC și trebuie depusă independent.",
      "",
      "Conținut obligatoriu (GDPR Art. 33(3)):",
      "• Natura încălcării + categorii de date afectate",
      "• Număr aproximativ de persoane vizate",
      "• Date de contact DPO / responsabil conformitate",
      "• Consecințe probabile ale încălcării",
      "• Măsuri luate sau propuse",
    ].join("\n"),
    category: "GDPR",
    severity,
    risk: "high",
    principles: ["accountability", "transparency"],
    createdAtISO: nowISO,
    sourceDocument: "Incident NIS2 cu date personale",
    legalReference: "GDPR Art. 33 — notificare autoritate de supraveghere în 72h",
    impactSummary: `Nenotificarea ANSPDCP în 72h atrage amenzi GDPR de până la 10M€ sau 2% din cifra de afaceri globală.`,
    remediationHint: `Completează formularul de notificare ANSPDCP din panoul incidentului NIS2 \u2192 sec\u021Biunea \u201ENotificare ANSPDCP \u2014 GDPR Art. 33\u201D.`,
    readyTextLabel: "Notificare trimisă la ANSPDCP",
    readyText: `Am notificat ANSPDCP conform GDPR Art. 33 pentru incidentul "${incidentTitle}". Nr. de înregistrare primit și arhivat.`,
  }
}
