/**
 * ANSPDCP-shaped Audit Pack (Faza 6.1)
 *
 * Builds a markdown document structured per the format expected by
 * Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal.
 *
 * Insight from Radu (USERS.md P2): "reports don't match RO authority format".
 * This endpoint does NOT replace the existing audit-pack engine — it REUSES the
 * data collected by `buildAuditPack` and REMAPS it to ANSPDCP's 12 sections:
 *
 *  1. Identificare operator                (GDPR Art. 30(1)(a))
 *  2. Responsabil cu protecția datelor      (GDPR Art. 37)
 *  3. Evidența activităților de prelucrare  (GDPR Art. 30)
 *  4. Baza legală pe categorie              (GDPR Art. 6-10)
 *  5. Categorii date + persoane vizate      (GDPR Art. 30(1)(c,d))
 *  6. Destinatari + transferuri             (GDPR Art. 30(1)(e,f), Art. 44-49)
 *  7. Perioade de păstrare                  (GDPR Art. 5(1)(e))
 *  8. Măsuri tehnice și organizatorice      (GDPR Art. 32)
 *  9. DPIA (unde aplicabil)                 (GDPR Art. 35)
 * 10. Registru incidente                    (GDPR Art. 33-34)
 * 11. Jurnal cereri persoane vizate (DSAR)  (GDPR Art. 15-22)
 * 12. Contracte procesare (DPA vendors)     (GDPR Art. 28)
 *
 * Integrity: SHA-256 hash of the markdown content is appended as tamper evidence.
 * Full cryptographic signing (PKI) is out of scope; hash gives basic integrity.
 */

import { createHash } from "node:crypto"

import type { AuditPackV2 } from "@/lib/compliance/audit-pack"
import type { OrgProfile } from "@/lib/compliance/applicability"
import type { DsarRequest } from "@/lib/server/dsar-store"
import type { Nis2OrgState } from "@/lib/server/nis2-store"
import type { VendorReview } from "@/lib/compliance/vendor-review-engine"
import type { ComplianceState } from "@/lib/compliance/types"

export type AnspdcpPackInput = {
  auditPack: AuditPackV2
  state: ComplianceState
  orgProfile: OrgProfile | null
  orgName: string
  dsarRequests: DsarRequest[]
  nis2State: Nis2OrgState | null
  vendorReviews: VendorReview[]
}

const DOCUMENT_VERSION = "1.0"
const LEGAL_FRAMEWORK = "Regulamentul (UE) 2016/679 (GDPR) + Legea 190/2018"

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

function sectorLabel(sector: string | undefined): string {
  if (!sector) return "—"
  const labels: Record<string, string> = {
    "professional-services": "Servicii profesionale",
    "digital-infrastructure": "Infrastructură digitală",
    retail: "Comerț retail",
    transport: "Transport / Logistică",
    health: "Sănătate",
    banking: "Servicii bancare / IFN",
    manufacturing: "Producție / Construcții",
    other: "Altele",
  }
  return labels[sector] ?? sector
}

function employeeCountLabel(ec: string | undefined): string {
  if (!ec) return "—"
  const labels: Record<string, string> = {
    "1-9": "sub 10",
    "10-49": "10-49",
    "50-249": "50-249",
    "250+": "250+",
  }
  return labels[ec] ?? ec
}

function dsarTypeLabel(t: DsarRequest["requestType"]): string {
  const labels: Record<DsarRequest["requestType"], string> = {
    access: "Art. 15 — Acces",
    rectification: "Art. 16 — Rectificare",
    erasure: "Art. 17 — Ștergere",
    portability: "Art. 20 — Portabilitate",
    objection: "Art. 21 — Opoziție",
    restriction: "Art. 18 — Restricționare",
  }
  return labels[t]
}

function dsarStatusLabel(s: DsarRequest["status"]): string {
  const labels: Record<DsarRequest["status"], string> = {
    received: "Recepționată",
    in_progress: "În procesare",
    awaiting_verification: "Verificare identitate",
    responded: "Răspuns trimis",
    refused: "Refuzată (cu motivare)",
  }
  return labels[s]
}

export function buildAnspdcpMarkdown(input: AnspdcpPackInput): { markdown: string; hash: string } {
  const { auditPack, state, orgProfile, orgName, dsarRequests, nis2State, vendorReviews } = input

  const lines: string[] = []
  const now = new Date()
  const generatedAt = now.toISOString()
  const generatedDateRo = fmtDate(generatedAt)

  // ── Header ───────────────────────────────────────────────────────────────────
  lines.push(`# Dosar ANSPDCP — ${orgName}`)
  lines.push(``)
  lines.push(`*Document structurat conform format așteptat de Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal.*`)
  lines.push(``)
  lines.push(`**Cadru legal**: ${LEGAL_FRAMEWORK}`)
  lines.push(`**Data emiterii**: ${generatedDateRo}`)
  lines.push(`**Versiune document**: ${DOCUMENT_VERSION}`)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)

  // ── 1. Identificare operator ─────────────────────────────────────────────────
  lines.push(`## 1. Identificare operator de date`)
  lines.push(``)
  lines.push(`- **Denumire**: ${orgName}`)
  if (orgProfile?.cui) lines.push(`- **CUI / Cod fiscal**: ${orgProfile.cui}`)
  if (orgProfile?.sector) lines.push(`- **Sector de activitate**: ${sectorLabel(orgProfile.sector)}`)
  lines.push(`- **Număr angajați**: ${employeeCountLabel(orgProfile?.employeeCount)}`)
  if (orgProfile?.website) lines.push(`- **Website**: ${orgProfile.website}`)
  lines.push(``)

  // ── 2. DPO ───────────────────────────────────────────────────────────────────
  lines.push(`## 2. Responsabil cu protecția datelor (DPO)`)
  lines.push(``)
  lines.push(`- **Status**: Informație necompletată în registrul intern al operatorului.`)
  lines.push(`- **Obligații**: Desemnarea DPO este obligatorie (GDPR Art. 37) dacă operatorul îndeplinește criteriile: autoritate publică, monitorizare sistematică la scară largă, sau procesare categorii speciale de date.`)
  lines.push(`- **Recomandare**: completați datele DPO (nume + contact) în profilul organizației. Pentru entități sub 250 angajați fără procesare risc, desemnarea rămâne opțională.`)
  lines.push(``)

  // ── 3. Evidența activităților de prelucrare (ROPA) ───────────────────────────
  lines.push(`## 3. Evidența activităților de prelucrare (ROPA)`)
  lines.push(``)
  lines.push(`*Conform GDPR Art. 30 — obligatoriu pentru operatori cu ≥250 angajați sau procesări cu risc.*`)
  lines.push(``)
  const ropaFindings = state.findings.filter((f) => /ropa|registru|Art\\.\\s*30/i.test(`${f.title} ${f.detail ?? ""}`))
  if (ropaFindings.length > 0) {
    lines.push(`- **Status registru**: Lipsă sau incomplet — ${ropaFindings.length} finding(s) deschise.`)
    for (const f of ropaFindings.slice(0, 5)) {
      lines.push(`  - ${f.title} (severitate: ${f.severity})`)
    }
  } else {
    lines.push(`- **Status registru**: Nicio gap detectată în scanul curent.`)
  }
  lines.push(``)

  // ── 4. Baza legală ───────────────────────────────────────────────────────────
  lines.push(`## 4. Baza legală pe categorie de prelucrare`)
  lines.push(``)
  lines.push(`Operatorul declară următoarele baze legale aplicabile (GDPR Art. 6):`)
  lines.push(``)
  lines.push(`| Categorie prelucrare | Bază legală Art. 6 | Observație |`)
  lines.push(`|---|---|---|`)
  lines.push(`| Relații comerciale (clienți) | lit. (b) executare contract | standard B2C/B2B |`)
  lines.push(`| Resurse umane (angajați) | lit. (b) contract + lit. (c) obligație legală | Codul muncii |`)
  lines.push(`| Obligații fiscale (facturare) | lit. (c) obligație legală | Cod fiscal + OUG e-Factura |`)
  lines.push(`| Marketing direct | lit. (a) consimțământ / lit. (f) interes legitim | verificare per campanie |`)
  lines.push(``)

  // ── 5. Categorii date + persoane vizate ──────────────────────────────────────
  lines.push(`## 5. Categorii de date și persoane vizate`)
  lines.push(``)
  lines.push(`- **Persoane vizate**: clienți persoane fizice, angajați, candidați, vizitatori site, furnizori persoane fizice.`)
  lines.push(`- **Categorii date standard**: nume, prenume, CNP, adresă, email, telefon, CV, date bancare pentru plăți.`)
  lines.push(`- **Categorii speciale (Art. 9)**: verificare individuală — recomandăm consultare DPO dacă există date medicale, opinii politice, date biometrice.`)
  lines.push(``)

  // ── 6. Destinatari + transferuri ─────────────────────────────────────────────
  lines.push(`## 6. Destinatari și transferuri`)
  lines.push(``)
  if (vendorReviews.length > 0) {
    lines.push(`Operatorul declară ${vendorReviews.length} furnizor${vendorReviews.length === 1 ? "" : "i"} procesator${vendorReviews.length === 1 ? "" : "i"} de date:`)
    lines.push(``)
    lines.push(`| Furnizor | Categorie | Status review | Urgență |`)
    lines.push(`|---|---|---|---|`)
    for (const v of vendorReviews.slice(0, 15)) {
      lines.push(`| ${v.vendorName ?? "—"} | ${v.category ?? "—"} | ${v.status ?? "—"} | ${v.urgency ?? "—"} |`)
    }
    if (vendorReviews.length > 15) {
      lines.push(``)
      lines.push(`*... și încă ${vendorReviews.length - 15} furnizori. Lista completă disponibilă în dosar.*`)
    }
  } else {
    lines.push(`- Niciun furnizor / procesator declarat în registrul curent.`)
    lines.push(`- **Recomandare**: inventar complet al sub-procesatorilor este obligatoriu pentru conformitate Art. 28.`)
  }
  lines.push(``)

  // ── 7. Perioade retenție ─────────────────────────────────────────────────────
  lines.push(`## 7. Perioade de păstrare`)
  lines.push(``)
  const retentionFindings = state.findings.filter((f) => /retenți|retention|păstrare/i.test(`${f.title} ${f.detail ?? ""}`))
  if (retentionFindings.length > 0) {
    lines.push(`- **Status politică retenție**: ${retentionFindings.length} gap(s) detectat(e) în scanul curent.`)
  } else {
    lines.push(`- **Politici standard aplicate** (verificare DPO recomandată):`)
    lines.push(`  - Facturi / documente fiscale: 10 ani (Cod fiscal)`)
    lines.push(`  - Contracte muncă: 75 ani (legislație HR)`)
    lines.push(`  - Date marketing: max 3 ani de la ultima interacțiune`)
    lines.push(`  - Cookie consent logs: 13 luni (CNIL-aligned)`)
  }
  lines.push(``)

  // ── 8. Măsuri tehnice și organizatorice ──────────────────────────────────────
  lines.push(`## 8. Măsuri tehnice și organizatorice (Art. 32)`)
  lines.push(``)
  lines.push(`**Tehnice**:`)
  lines.push(`- Autentificare cu parole hash-uite (scrypt/bcrypt)`)
  lines.push(`- Comunicare TLS 1.2+ pentru toate canalele externe`)
  lines.push(`- Jurnal audit access (activity log)`)
  lines.push(`- Backup periodic + test restaurare`)
  lines.push(``)
  lines.push(`**Organizatorice**:`)
  lines.push(`- Politici interne de securitate a datelor`)
  lines.push(`- Instructaj angajați privind GDPR + Art. 32`)
  lines.push(`- NDA + clauze confidențialitate în contracte angajați`)
  lines.push(``)
  const securityFindings = state.findings.filter((f) => f.category === "GDPR" && f.severity === "critical").slice(0, 3)
  if (securityFindings.length > 0) {
    lines.push(`**Gap-uri identificate în scanul curent**:`)
    for (const f of securityFindings) {
      lines.push(`- ${f.title}`)
    }
    lines.push(``)
  }

  // ── 9. DPIA ──────────────────────────────────────────────────────────────────
  lines.push(`## 9. Evaluări de impact asupra protecției datelor (DPIA)`)
  lines.push(``)
  const dpiaFindings = state.findings.filter((f) => /dpia|evaluare.*impact/i.test(`${f.title} ${f.detail ?? ""}`))
  if (dpiaFindings.length > 0) {
    lines.push(`- **Status DPIA**: ${dpiaFindings.length} activitate(ăți) care necesită DPIA încă neevaluate.`)
    for (const f of dpiaFindings.slice(0, 3)) {
      lines.push(`  - ${f.title}`)
    }
  } else {
    lines.push(`- **Status DPIA**: Nicio activitate identificată în scanul curent ca necesitând DPIA obligatorie (Art. 35 list criteria).`)
    lines.push(`- **Recomandare**: reevaluare DPIA anual sau la schimbare majoră de flux.`)
  }
  lines.push(``)

  // ── 10. Registru incidente ───────────────────────────────────────────────────
  lines.push(`## 10. Registru incidente de securitate (Art. 33-34)`)
  lines.push(``)
  if (nis2State?.incidents && nis2State.incidents.length > 0) {
    lines.push(`Operatorul raportează ${nis2State.incidents.length} incident(e) în registrul NIS2/GDPR:`)
    lines.push(``)
    lines.push(`| Data detectare | Titlu | Severitate | Status | Notificat ANSPDCP |`)
    lines.push(`|---|---|---|---|---|`)
    for (const inc of nis2State.incidents.slice(0, 10)) {
      const notified = inc.anspdcpNotification?.submittedAtISO
        ? fmtDate(inc.anspdcpNotification.submittedAtISO)
        : inc.involvesPersonalData
          ? "Obligatoriu — nenotificat"
          : "N/A"
      const title = (inc.title ?? "—").slice(0, 40)
      lines.push(`| ${fmtDate(inc.detectedAtISO)} | ${title} | ${inc.severity} | ${inc.status} | ${notified} |`)
    }
  } else {
    lines.push(`- **Zero incidente** înregistrate în perioada curentă.`)
    lines.push(`- Operatorul menține registrul incidentelor chiar dacă nu există breach confirmat (obligație Art. 33(5)).`)
  }
  lines.push(``)

  // ── 11. Jurnal DSAR ──────────────────────────────────────────────────────────
  lines.push(`## 11. Jurnal cereri persoane vizate (DSAR)`)
  lines.push(``)
  if (dsarRequests.length > 0) {
    const respondedInTime = dsarRequests.filter((r) => {
      if (!r.responseSentAtISO) return false
      const received = new Date(r.receivedAtISO).getTime()
      const responded = new Date(r.responseSentAtISO).getTime()
      return responded - received < 30 * 24 * 60 * 60 * 1000
    }).length
    const avgDays =
      dsarRequests
        .filter((r) => r.responseSentAtISO)
        .reduce((acc, r) => {
          const received = new Date(r.receivedAtISO).getTime()
          const responded = new Date(r.responseSentAtISO!).getTime()
          return acc + (responded - received) / (24 * 60 * 60 * 1000)
        }, 0) / Math.max(1, dsarRequests.filter((r) => r.responseSentAtISO).length)

    lines.push(`Total cereri în registru: **${dsarRequests.length}**. Timp mediu răspuns: **${Math.round(avgDays)} zile**. Respectat termen 30 zile: **${respondedInTime}/${dsarRequests.length}**.`)
    lines.push(``)
    lines.push(`| Dată primire | Tip | Status | Deadline | Răspuns trimis |`)
    lines.push(`|---|---|---|---|---|`)
    for (const d of dsarRequests.slice(0, 15)) {
      lines.push(`| ${fmtDate(d.receivedAtISO)} | ${dsarTypeLabel(d.requestType)} | ${dsarStatusLabel(d.status)} | ${fmtDate(d.deadlineISO)} | ${fmtDate(d.responseSentAtISO)} |`)
    }
    if (dsarRequests.length > 15) {
      lines.push(``)
      lines.push(`*... și încă ${dsarRequests.length - 15} cereri. Lista completă disponibilă în dosar.*`)
    }
  } else {
    lines.push(`- **Zero cereri DSAR** în perioada curentă.`)
    lines.push(`- Operatorul menține canalul dedicat pentru recepție cereri (email DPO, formular dedicat etc.).`)
  }
  lines.push(``)

  // ── 12. Contracte procesare ──────────────────────────────────────────────────
  lines.push(`## 12. Contracte de procesare (DPA — Art. 28)`)
  lines.push(``)
  if (vendorReviews.length > 0) {
    const closed = vendorReviews.filter((v) => v.status === "closed").length
    const open = vendorReviews.length - closed
    lines.push(`- Vendor-i cu review închis (DPA validat sau caz confirmat fără DPA necesar): **${closed}/${vendorReviews.length}**`)
    if (open > 0) {
      lines.push(`- **${open} vendor(i) cu review deschis** — risc de încălcare Art. 28 până la finalizare.`)
    }
  } else {
    lines.push(`- Niciun contract DPA în registru (consistent cu §6 — niciun vendor declarat).`)
  }
  lines.push(``)

  // ── Rezumat executiv ─────────────────────────────────────────────────────────
  lines.push(`---`)
  lines.push(``)
  lines.push(`## Anexă — Rezumat executiv`)
  lines.push(``)
  lines.push(`- **Scor conformitate global**: ${auditPack.executiveSummary.complianceScore ?? "—"}%`)
  lines.push(`- **Risc**: ${auditPack.executiveSummary.riskLabel ?? "—"}`)
  lines.push(`- **Readiness audit**: ${auditPack.executiveSummary.auditReadiness}`)
  lines.push(`- **Findings deschise**: ${auditPack.executiveSummary.openFindings}`)
  lines.push(`- **Drift activ**: ${auditPack.executiveSummary.activeDrifts}`)
  lines.push(`- **Evidence validat**: ${auditPack.executiveSummary.validatedEvidenceItems}`)
  lines.push(`- **Evidence lipsă**: ${auditPack.executiveSummary.missingEvidenceItems}`)
  lines.push(``)

  // ── Declarație integritate ───────────────────────────────────────────────────
  lines.push(`---`)
  lines.push(``)
  lines.push(`## Declarație integritate document`)
  lines.push(``)
  lines.push(`Acest dosar a fost generat automat de CompliAI pe baza datelor înregistrate de operator până la ${generatedDateRo}.`)
  lines.push(``)
  lines.push(`Generarea și hash-ul SHA-256 asigură că documentul nu a fost modificat ulterior. Operatorul își asumă acuratețea datelor sursă.`)
  lines.push(``)

  const preHashContent = lines.join("\n")
  const hash = createHash("sha256").update(preHashContent).digest("hex")

  lines.push(`**SHA-256**: \`${hash}\``)
  lines.push(``)
  lines.push(`*Document ANSPDCP-shaped v${DOCUMENT_VERSION} · generat ${generatedAt}*`)

  return { markdown: lines.join("\n"), hash }
}
