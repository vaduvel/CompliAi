// Generator raport incident DNSC — template-based, client-safe, fără LLM.
// Aliniat cu cerințele de raportare NIS2 Art. 23 și formularul oficial DNSC.

import type { Nis2Incident, Nis2AttackType, Nis2OperationalImpact } from "@/lib/server/nis2-store"

export const ATTACK_TYPE_LABELS: Record<Nis2AttackType, string> = {
  ransomware: "Ransomware",
  ddos: "Atac DDoS (Denial of Service)",
  phishing: "Phishing / Inginerie socială",
  "supply-chain": "Compromitere lanț de aprovizionare",
  insider: "Amenințare internă",
  "unauthorized-access": "Acces neautorizat",
  "data-breach": "Breșă de date / Exfiltrare",
  unknown: "Tip necunoscut",
  other: "Alt tip de incident",
}

export const OPERATIONAL_IMPACT_LABELS: Record<Nis2OperationalImpact, string> = {
  none: "Niciun impact operațional",
  partial: "Impact parțial (servicii degradate)",
  full: "Impact total (servicii indisponibile)",
}

/**
 * Generează un raport de incident aliniat cu cerințele DNSC (NIS2 Art. 23).
 * Returnează Markdown gata de descărcat sau trimis la incidents@dnsc.ro.
 * Funcție pură — fără LLM, fără I/O, funcționează și în browser.
 */
export function buildDNSCReport(incident: Nis2Incident, orgName?: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })

  const now = fmt(new Date().toISOString())
  const detected = fmt(incident.detectedAtISO)
  const deadline24 = fmt(incident.deadline24hISO)
  const deadline72 = fmt(incident.deadline72hISO)
  const deadlineFinal = incident.deadlineFinalISO ? fmt(incident.deadlineFinalISO) : "—"

  const sla24Passed = Date.now() > new Date(incident.deadline24hISO).getTime()
  const sla72Passed = Date.now() > new Date(incident.deadline72hISO).getTime()
  const slaFinalPassed = incident.deadlineFinalISO
    ? Date.now() > new Date(incident.deadlineFinalISO).getTime()
    : false

  const attackLabel = incident.attackType
    ? ATTACK_TYPE_LABELS[incident.attackType]
    : "Nespecificat"
  const impactLabel = incident.operationalImpact
    ? OPERATIONAL_IMPACT_LABELS[incident.operationalImpact]
    : "Nespecificat"

  return `# Raport de Incident de Securitate Cibernetică
## Formular de raportare NIS2 — Directiva (UE) 2022/2555, Art. 23
### Destinatar: DNSC — Directoratul Național de Securitate Cibernetică

---

**Data generării raportului:** ${now}
**Generat de:** ${orgName ?? "Organizație"} — CompliScan

---

## Secțiunea 1 — Date de identificare

| Câmp | Valoare |
|---|---|
| Organizație raportoare | ${orgName ?? "—"} |
| Data și ora detectării | ${detected} |
| Data și ora raportării | ${incident.reportedToDNSCAtISO ? fmt(incident.reportedToDNSCAtISO) : "Neprecizat"} |
| ID intern incident | \`${incident.id}\` |

---

## Secțiunea 2 — Descrierea incidentului

**Titlu:** ${incident.title}

**Descriere:**
${incident.description || "Descriere necompletată."}

**Severitate evaluată:** ${incident.severity.toUpperCase()}

---

## Secțiunea 3 — Clasificarea incidentului

| Câmp | Valoare |
|---|---|
| Tip incident | ${attackLabel} |
| Vector de atac | ${incident.attackVector || "Neidentificat"} |
| Sisteme afectate | ${incident.affectedSystems.length > 0 ? incident.affectedSystems.join(", ") : "Nespecificate"} |

---

## Secțiunea 4 — Impactul operațional

**Nivel impact:** ${impactLabel}

**Detalii impact:**
${incident.operationalImpactDetails || "Detalii necompletate."}

---

## Secțiunea 5 — Măsuri luate

${incident.measuresTaken || "Măsurile luate nu au fost documentate încă."}

---

## Secțiunea 6 — Obligații SLA (NIS2 Art. 23)

| Termen | Deadline | Status |
|---|---|---|
| Alertă inițială 24h | ${deadline24} | ${sla24Passed ? "⚠️ DEPĂȘIT" : "✓ În termen"} |
| Raport complet 72h | ${deadline72} | ${sla72Passed ? "⚠️ DEPĂȘIT" : "✓ În termen"} |
| Raport final (30 zile de la raport 72h) | ${deadlineFinal} | ${incident.deadlineFinalISO ? (slaFinalPassed ? "⚠️ DEPĂȘIT" : "✓ În termen") : "—"} |

**Status curent incident:** ${incident.status}
${incident.resolvedAtISO ? `**Rezolvat la:** ${fmt(incident.resolvedAtISO)}` : "**Incident activ** — în curs de remediere."}

---

## Secțiunea 7 — Date de contact

| Câmp | Valoare |
|---|---|
| Persoana de contact | De completat |
| Telefon | De completat |
| Email | De completat |

---

> ⚠️ **Notă legală:** Acest document a fost generat automat de CompliScan pe baza datelor introduse.
> Verificați și completați toate câmpurile marcate cu "De completat" sau "Nespecificat" înainte de transmitere.
> Raportul se trimite la: **incidents@dnsc.ro** sau prin portalul DNSC.
`
}
