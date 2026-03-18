// V3 P0.2 — Late NIS2 Rescue + Mesaj Urgență
// Generează un finding de urgență când entitatea NIS2 nu are înregistrarea DNSC confirmată.
// Formulare juridică prudentă: nu promitem reducere de sancțiuni, ci demonstrare de bună-credință.

import type { ScanFinding } from "@/lib/compliance/types"
import type { DnscRegistrationStatus } from "@/lib/server/nis2-store"
import type { Nis2EntityType } from "@/lib/compliance/nis2-rules"
import { makeResolution } from "@/lib/compliance/finding-resolution"

export const DNSC_RESCUE_FINDING_ID = "nis2-rescue-dnsc-registration"

const ENTITY_LABELS: Record<Exclude<Nis2EntityType, "not-applicable">, string> = {
  essential: "esențială",
  important: "importantă",
}

const STATUS_LABELS: Record<DnscRegistrationStatus, string> = {
  "not-started": "nu a început",
  "in-progress": "este în curs, dar neconfirmată",
  submitted: "a fost transmisă, dar neconfirmată",
  confirmed: "confirmată",
}

/**
 * Builds a rescue ScanFinding for NIS2-applicable entities without confirmed DNSC registration.
 * Returns null if the entity is not applicable or already confirmed.
 *
 * NOTE: Formulare prudentă juridic — nu se promite reducere de sancțiuni.
 * Se menționează că înregistrarea tardivă poate demonstra buna-credință.
 */
export function buildDnscRescueFinding(
  entityType: Nis2EntityType,
  registrationStatus: DnscRegistrationStatus,
  nowISO: string
): ScanFinding | null {
  if (entityType === "not-applicable" || registrationStatus === "confirmed") return null

  const entityLabel = ENTITY_LABELS[entityType]
  const statusLabel = STATUS_LABELS[registrationStatus]
  const severity = registrationStatus === "not-started" ? "high" : "medium"

  return {
    id: DNSC_RESCUE_FINDING_ID,
    title: "Înregistrare DNSC incompletă — entitate NIS2",
    detail: [
      `Organizația este clasificată ca entitate ${entityLabel} NIS2, iar înregistrarea la DNSC ${statusLabel}.`,
      "",
      "Înregistrarea tardivă este preferabilă lipsei totale de acțiune și poate demonstra buna-credință / atitudine proactivă la un eventual control.",
      "",
      "NIS2 / OUG 155/2024 impune notificarea DNSC și înscrierea în registrul entităților. CompliAI nu garantează rezultate juridice — verifică cu un consultant specializat.",
    ].join("\n"),
    category: "NIS2",
    severity,
    risk: "high",
    principles: ["accountability", "oversight"],
    createdAtISO: nowISO,
    sourceDocument: "Registru DNSC",
    legalReference: "NIS2 Art. 27 / OUG 155/2024 Art. 22",
    remediationHint:
      "Finalizează înregistrarea DNSC prin portalul oficial. Folosește Expertul de Înregistrare din CompliAI pentru draft-ul notificării.",
    resolution: makeResolution(
      `Entitate NIS2 ${entityLabel} fără înregistrare DNSC confirmată (status: ${registrationStatus})`,
      "Lipsa înregistrării expune organizația la sancțiuni administrative și la un control neașteptat fără documentație pregătită.",
      "Finalizează înregistrarea DNSC. Documentează data transmiterii și arhivează confirmarea.",
      {
        generatedAsset: "Draft notificare DNSC generat de CompliAI prin Expertul de Înregistrare",
        humanStep:
          "Transmite formularul completat pe portalul DNSC (registru.dnsc.ro) și arhivează confirmarea / numărul de înregistrare.",
        closureEvidence: "Screenshot confirmare DNSC sau număr de înregistrare primit",
        revalidation:
          "Verifică anual dacă datele de înregistrare sunt actualizate și că statusul rămâne 'confirmed'.",
      }
    ),
  }
}
