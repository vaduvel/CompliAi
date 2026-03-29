// lib/compliance/vendor-review-engine.ts
// V5 — Vendor Review Workbench engine
// Branching logic, context evaluation, asset generation.

// ── Types ─────────────────────────────────────────────────────────────────────

export type VendorReviewStatus =
  | "detected"
  | "needs-context"
  | "review-generated"
  | "awaiting-human-validation"
  | "awaiting-evidence"
  | "closed"
  | "overdue-review"

export type VendorReviewUrgency = "critical" | "high" | "medium" | "info"

export type VendorReviewCase = "A" | "B" | "C" | "D"

export type ContextAnswer = "yes" | "no" | "unknown"
export type ProcessorAnswer = "processor" | "tool" | "unknown"
export type TransferAnswer = "dpf" | "scc" | "other" | "unknown"
export type UsageAnswer = "active" | "historic"

export type VendorReviewContext = {
  /** 1. Se trimit date personale către acest vendor? */
  sendsPersonalData: ContextAnswer
  /** 2. Se trimit date confidențiale sau interne? */
  sendsConfidentialData: ContextAnswer
  /** 3. Vendorul procesează date în numele firmei sau este doar un tool? */
  vendorProcessesData: ProcessorAnswer
  /** 4. Există deja DPA / termeni / documentație de privacy? */
  hasDpaOrTerms: ContextAnswer
  /** 5. Există deja un mecanism de transfer identificat? */
  hasTransferMechanism: TransferAnswer
  /** 6. Vendorul este activ folosit acum sau doar facturat istoric? */
  isActivelyUsed: UsageAnswer
}

export type VendorReviewAssetType =
  | "privacy-review-checklist"
  | "dpa-request-checklist"
  | "transfer-review-checklist"
  | "ai-use-review-checklist"
  | "internal-approval-note"
  | "response-summary"
  | "finding-resolution-steps"

export type VendorReviewAsset = {
  id: string
  type: VendorReviewAssetType
  title: string
  content: string // Markdown
  generatedAtISO: string
}

export type VendorGovernancePack = {
  title: string
  summary: string
  assets: VendorReviewAsset[]
  completionChecklist: string[]
}

// ── V5.3 — Audit trail & evidence ──────────────────────────────────────────

export type AuditAction =
  | "created"
  | "context-submitted"
  | "review-generated"
  | "approved"
  | "rejected"
  | "evidence-added"
  | "closed"
  | "reopened"
  | "revalidation-triggered"

export type AuditEntry = {
  action: AuditAction
  by: string // email
  atISO: string
  note?: string
}

export type EvidenceType =
  | "dpa-signed"
  | "checklist-completed"
  | "internal-approval"
  | "link"
  | "note"
  | "other"

export type EvidenceItem = {
  id: string
  type: EvidenceType
  description: string
  addedBy: string
  addedAtISO: string
}

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  "dpa-signed": "DPA semnat",
  "checklist-completed": "Checklist completat",
  "internal-approval": "Aprobare internă",
  link: "Link / URL",
  note: "Notă internă",
  other: "Altele",
}

// ── V5.4 — Revalidation history ─────────────────────────────────────────────

export type PastClosure = {
  closedAtISO: string
  closedBy: string
  evidenceItems: EvidenceItem[]
  reviewCase: VendorReviewCase
  nextReviewDueISO: string
}

export type VendorReview = {
  id: string
  vendorId: string
  vendorName: string
  status: VendorReviewStatus
  urgency: VendorReviewUrgency
  category: "ai" | "cloud" | "tech" | "possible-processor" | "unknown"
  confidence: "high" | "medium" | "low"
  detectionSource: "efactura" | "ai-inventory" | "vendor-registry" | "manual" | "site-scan"

  // Context capture (V5.2)
  context?: VendorReviewContext
  reviewCase?: VendorReviewCase

  // Generated assets (V5.2)
  generatedAssets?: VendorReviewAsset[]

  // Finding link
  findingId?: string

  // Closure (V5.3)
  closedAtISO?: string
  closureEvidence?: string // legacy text field
  closureApprovedBy?: string
  evidenceItems?: EvidenceItem[]

  // Audit trail (V5.3)
  auditTrail?: AuditEntry[]

  // Revalidation (V5.4)
  nextReviewDueISO?: string
  reviewReason?: string
  reviewCount?: number // how many times this vendor was reviewed
  pastClosures?: PastClosure[]

  // Timestamps
  createdAtISO: string
  updatedAtISO: string
  ownerId?: string
}

// ── Context questions (for UI) ────────────────────────────────────────────────

export const CONTEXT_QUESTIONS = [
  {
    key: "sendsPersonalData" as const,
    label: "Se trimit date personale către acest vendor?",
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    key: "sendsConfidentialData" as const,
    label: "Se trimit date confidențiale sau interne?",
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    key: "vendorProcessesData" as const,
    label: "Vendorul procesează date în numele firmei sau este doar un tool?",
    options: [
      { value: "processor", label: "Procesează în numele firmei" },
      { value: "tool", label: "Tool folosit intern" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    key: "hasDpaOrTerms" as const,
    label: "Există deja DPA / termeni / documentație de privacy?",
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    key: "hasTransferMechanism" as const,
    label: "Există deja un mecanism de transfer identificat?",
    options: [
      { value: "dpf", label: "DPF (Data Privacy Framework)" },
      { value: "scc", label: "SCC (Standard Contractual Clauses)" },
      { value: "other", label: "Alt mecanism" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    key: "isActivelyUsed" as const,
    label: "Vendorul este activ folosit acum sau doar facturat istoric?",
    options: [
      { value: "active", label: "Activ" },
      { value: "historic", label: "Istoric / neclar" },
    ],
  },
] as const

// ── Branching logic ───────────────────────────────────────────────────────────

/**
 * Determină cazul de review pe baza contextului capturat.
 *
 * Caz A — software intern, fără date personale → review simplu
 * Caz B — vendor extern + date personale + processor possibility → privacy/vendor review
 * Caz C — AI vendor + usage intern + date sensibile necunoscute → AI use review
 * Caz D — lipsă informație → review incomplete
 */
export function determineReviewCase(
  context: VendorReviewContext,
  category: VendorReview["category"],
): VendorReviewCase {
  const unknowns = [
    context.sendsPersonalData,
    context.sendsConfidentialData,
    context.vendorProcessesData,
    context.hasDpaOrTerms,
    context.hasTransferMechanism,
  ].filter((v) => v === "unknown").length

  // Caz D — prea multe necunoscute (≥3)
  if (unknowns >= 3) return "D"

  // Caz C — AI vendor + unknown data sensitivity
  if (
    category === "ai" &&
    (context.sendsPersonalData === "unknown" ||
      context.sendsConfidentialData === "unknown")
  ) {
    return "C"
  }

  // Caz B — date personale + processor + lipsă DPA/transfer
  if (
    context.sendsPersonalData === "yes" &&
    (context.vendorProcessesData === "processor" ||
      context.vendorProcessesData === "unknown") &&
    (context.hasDpaOrTerms !== "yes" || context.hasTransferMechanism === "unknown")
  ) {
    return "B"
  }

  // Caz A — fără date personale SAU tool intern simplu
  if (
    context.sendsPersonalData === "no" ||
    (context.vendorProcessesData === "tool" && context.sendsConfidentialData === "no")
  ) {
    return "A"
  }

  // Caz B ca fallback pentru orice situație cu date personale
  if (context.sendsPersonalData === "yes") return "B"

  // Fallback D — insuficientă informație
  return "D"
}

/**
 * Determină urgența review-ului pe baza cazului și contextului.
 */
export function determineUrgency(
  reviewCase: VendorReviewCase,
  context: VendorReviewContext,
  category: VendorReview["category"],
): VendorReviewUrgency {
  if (reviewCase === "D") return "high" // lipsa info = urgență
  if (reviewCase === "A") {
    return context.isActivelyUsed === "historic" ? "info" : "medium"
  }
  if (reviewCase === "C") return "high" // AI vendor nedocumentat
  // Caz B
  if (
    context.sendsPersonalData === "yes" &&
    context.hasDpaOrTerms === "no" &&
    category !== "unknown"
  ) {
    return "critical"
  }
  return "high"
}

// ── Asset generation ──────────────────────────────────────────────────────────

let assetCounter = 0
function assetId(): string {
  return `vra-${Date.now().toString(36)}-${(++assetCounter).toString(36)}`
}

function generateCaseAAssets(vendorName: string): VendorReviewAsset[] {
  const now = new Date().toISOString()
  return [
    {
      id: assetId(),
      type: "internal-approval-note",
      title: `Notă internă — ${vendorName}`,
      content: `# Notă internă de aprobare — ${vendorName}

## Clasificare
Software intern / tool fără transfer de date personale.

## Concluzie review
Review simplu finalizat. Nu sunt identificate riscuri semnificative de privacy sau conformitate.

## Acțiuni recomandate
- [ ] Confirmă că nu se trimit date personale prin acest vendor
- [ ] Verifică dacă termenii de utilizare sunt acceptabili
- [ ] Marchează review-ul ca finalizat

## Următorul review
**12 luni** de la data curentă sau la schimbarea modului de utilizare.

---
*Generat automat de CompliScan — nu constituie aviz juridic.*`,
      generatedAtISO: now,
    },
  ]
}

function generateCaseBAssets(
  vendorName: string,
  context: VendorReviewContext,
): VendorReviewAsset[] {
  const now = new Date().toISOString()
  const assets: VendorReviewAsset[] = []

  // Privacy / vendor review checklist
  assets.push({
    id: assetId(),
    type: "privacy-review-checklist",
    title: `Checklist Privacy/Vendor Review — ${vendorName}`,
    content: `# Privacy & Vendor Review Checklist — ${vendorName}

## 1. Identificare relație de procesare
- [ ] Vendorul acționează ca **processor** (Art. 28 GDPR)?
- [ ] Există date personale transferate? **${context.sendsPersonalData === "yes" ? "DA — confirmat" : "De verificat"}**
- [ ] Ce categorii de date sunt transferate? _(completează manual)_

## 2. Bază legală transfer
- [ ] Transfer UE/SEE: verifică locația procesării
- [ ] Transfer extra-UE: mecanism identificat? **${context.hasTransferMechanism !== "unknown" ? context.hasTransferMechanism.toUpperCase() : "LIPSEȘTE"}**
- [ ] DPF activ pentru vendor? Verifică [dataprivacyframework.gov](https://dataprivacyframework.gov)
- [ ] SCC semnate? Data: ___________

## 3. DPA (Data Processing Agreement)
- [ ] DPA existent? **${context.hasDpaOrTerms === "yes" ? "DA" : "NU"}**
- [ ] DPA include clauze Art. 28(3) GDPR?
- [ ] DPA include drept de audit?
- [ ] DPA include notificare breach < 48h?
- [ ] DPA include sub-processor list?

## 4. Măsuri tehnice și organizatorice
- [ ] Vendorul oferă documentație TOMs (Technical & Organizational Measures)?
- [ ] Certificări relevante? (SOC 2, ISO 27001, etc.)
- [ ] Criptare date în tranzit și la repaus?

## 5. Acțiuni necesare
${context.hasDpaOrTerms === "no" ? "- [ ] **URGENT:** Solicită DPA de la vendor\n" : ""}\
${context.hasTransferMechanism === "unknown" ? "- [ ] **URGENT:** Identifică mecanismul de transfer\n" : ""}\
- [ ] Completează evaluarea de impact (dacă date sensibile)
- [ ] Documentează decizia și baza legală
- [ ] Setează reminder review la 6 luni

---
*Generat automat de CompliScan — nu constituie aviz juridic.*`,
    generatedAtISO: now,
  })

  // DPA request checklist
  if (context.hasDpaOrTerms !== "yes") {
    assets.push({
      id: assetId(),
      type: "dpa-request-checklist",
      title: `Checklist Solicitare DPA — ${vendorName}`,
      content: `# Checklist Solicitare DPA — ${vendorName}

## Template email solicitare DPA

> Către: [privacy@${vendorName.toLowerCase().replace(/\s+/g, "")}.com]
>
> Subiect: Data Processing Agreement Request — [Numele companiei]
>
> Bună ziua,
>
> Suntem [Numele companiei], client activ al serviciilor dumneavoastră.
> În conformitate cu Art. 28 GDPR, solicităm încheierea unui Data Processing Agreement (DPA)
> care să acopere procesarea datelor cu caracter personal efectuată prin serviciile dumneavoastră.
>
> Vă rugăm să ne furnizați:
> 1. DPA standard sau template pentru semnare
> 2. Lista sub-procesatorilor actuali
> 3. Documentația măsurilor tehnice și organizatorice (TOMs)
> 4. Certificările de securitate relevante (SOC 2, ISO 27001, etc.)
>
> Termen solicitat: 30 zile lucrătoare.
>
> Cu stimă,
> [Numele și funcția]

## Pași de urmărire
- [ ] Email trimis la data: ___________
- [ ] Follow-up la 14 zile dacă nu răspund
- [ ] DPA primit: DA / NU
- [ ] DPA revizuit juridic: DA / NU
- [ ] DPA semnat: DA / NU — Data: ___________

---
*Generat automat de CompliScan — nu constituie aviz juridic.*`,
      generatedAtISO: now,
    })
  }

  // Transfer review checklist
  if (context.hasTransferMechanism === "unknown") {
    assets.push({
      id: assetId(),
      type: "transfer-review-checklist",
      title: `Checklist Transfer Review — ${vendorName}`,
      content: `# Transfer Review Checklist — ${vendorName}

## 1. Localizare procesare
- [ ] Unde procesează vendorul datele? _(UE/SEE, SUA, altul)_
- [ ] Există sub-procesatori în afara UE/SEE?

## 2. Mecanism de transfer aplicabil
- [ ] **DPF (Data Privacy Framework):** Verifică dacă vendorul este certificat DPF
  - [dataprivacyframework.gov/list](https://dataprivacyframework.gov/list)
- [ ] **SCC (Standard Contractual Clauses):** Verifică dacă sunt incluse în contract/DPA
- [ ] **BCR (Binding Corporate Rules):** Aplicabil doar pentru grupuri corporate
- [ ] **Derogări Art. 49 GDPR:** Consimțământ explicit, necesitate contractuală

## 3. Transfer Impact Assessment (TIA)
- [ ] Evaluare legislație țară terță (Schrems II)
- [ ] Măsuri suplimentare identificate?
- [ ] Documentare decizie transfer

## 4. Acțiune
- [ ] Mecanism de transfer identificat și documentat
- [ ] TIA completat (dacă extra-UE)
- [ ] Evidență salvată în CompliScan

---
*Generat automat de CompliScan — nu constituie aviz juridic.*`,
      generatedAtISO: now,
    })
  }

  return assets
}

function generateCaseCAssets(vendorName: string): VendorReviewAsset[] {
  const now = new Date().toISOString()
  return [
    {
      id: assetId(),
      type: "ai-use-review-checklist",
      title: `Checklist AI Use Review — ${vendorName}`,
      content: `# AI Use Review Checklist — ${vendorName}

## 1. Clasificare utilizare AI
- [ ] Ce tip de AI oferă vendorul? _(LLM, ML model, predictive analytics, etc.)_
- [ ] Ce date sunt introduse în sistemul AI? _(text, imagini, date personale, date business)_
- [ ] Output-ul AI este folosit pentru decizii automate?
- [ ] Există supervizare umană a output-ului AI?

## 2. EU AI Act — Clasificare risc
- [ ] Sistemul AI cade sub **risc ridicat** (Annex III)?
  - Recrutare / HR
  - Credit scoring
  - Aplicarea legii
  - Infrastructură critică
- [ ] Sistemul AI cade sub **risc limitat** (Art. 52)?
  - Chatbot / interfață conversațională
  - Generare de conținut (deepfake, text)
- [ ] Sistemul AI este **uz general** (GPAI)?

## 3. Privacy & date
- [ ] Se trimit date personale către AI? **De verificat**
- [ ] Datele sunt folosite pentru antrenare model?
- [ ] Există DPA specific pentru procesare AI?
- [ ] Opt-out din training disponibil și activat?

## 4. Politică internă
- [ ] Utilizarea este aprobată de management?
- [ ] Există politică internă de utilizare AI?
- [ ] Angajații sunt instruiți pe riscurile AI?

## 5. Acțiuni necesare
- [ ] Confirmă clasificarea de risc AI Act
- [ ] Verifică dacă se trimit date personale
- [ ] Solicită DPA/AI Addendum de la vendor
- [ ] Documentează decizia de utilizare aprobată/respinsă
- [ ] Adaugă în inventarul AI CompliScan

---
*Generat automat de CompliScan — nu constituie aviz juridic.*`,
      generatedAtISO: now,
    },
  ]
}

function generateCaseDAssets(vendorName: string): VendorReviewAsset[] {
  const now = new Date().toISOString()
  return [
    {
      id: assetId(),
      type: "finding-resolution-steps",
      title: `Pași clarificare — ${vendorName}`,
      content: `# Review Incomplet — ${vendorName}

## Informații lipsă
Review-ul nu poate fi finalizat deoarece lipsesc informații critice.
Completează contextul minim necesar pentru a continua.

## Întrebări prioritare
1. **Se trimit date personale către acest vendor?**
   - Fără acest răspuns, nu putem determina dacă este necesar DPA.
2. **Vendorul procesează date în numele firmei?**
   - Distincția controller/processor determină obligațiile legale.
3. **Există DPA sau termeni de privacy?**
   - Lipsa DPA + date personale = non-conformitate Art. 28 GDPR.

## Acțiuni imediate
- [ ] Contactează responsabilul intern care folosește acest vendor
- [ ] Solicită informații de la vendor (privacy policy, DPA, TOMs)
- [ ] Completează răspunsurile contextuale în CompliScan
- [ ] Re-evaluează review-ul după completare

## Important
Acest finding **nu se poate închide** până nu există răspunsuri minime.
Review-ul rămâne deschis cu urgență ridicată.

---
*Generat automat de CompliScan — nu constituie aviz juridic.*`,
      generatedAtISO: now,
    },
  ]
}

export function generateVendorGovernancePack(params: {
  orgName: string
  knownVendorCount?: number
}): VendorGovernancePack {
  const now = new Date().toISOString()
  const orgLabel = params.orgName.trim() || "Organizația ta"
  const vendorCountLabel =
    typeof params.knownVendorCount === "number" && params.knownVendorCount > 0
      ? `${params.knownVendorCount} furnizori deja detectați în registru`
      : "furnizorii activi identificați intern"

  return {
    title: "Pachet minim Vendor Review",
    summary:
      "Pachetul pregătește solicitarea către furnizori, checklistul de verificare și urma internă de follow-up pentru cazurile cu documentație vendor lipsă.",
    assets: [
      {
        id: assetId(),
        type: "dpa-request-checklist",
        title: "Template solicitare documentație vendor",
        content: `# Solicitare documentație vendor — ${orgLabel}

## Scop
Folosește acest mesaj când furnizorul procesează date, oferă servicii cloud/SaaS sau păstrează informații confidențiale pentru firmă.

## Template email

> Subiect: Solicitare documentație GDPR / securitate — ${orgLabel}
>
> Bună ziua,
>
> În cadrul revizuirii noastre interne de conformitate, avem nevoie de documentația actualizată pentru serviciile furnizate către ${orgLabel}.
>
> Vă rugăm să ne transmiteți:
> 1. DPA sau anexa contractuală pentru procesare date
> 2. Lista subprocesatorilor / subcontractorilor relevanți
> 3. Politica de securitate sau documentația TOMs
> 4. Certificări relevante (ISO 27001, SOC 2, etc.), dacă există
> 5. Mecanismul de transfer internațional aplicabil, dacă datele ies din UE/SEE
>
> Termen recomandat: 10 zile lucrătoare.
>
> Mulțumim,
> [Nume / rol]

## Checklist follow-up
- [ ] Furnizorul și persoana de contact au fost identificați
- [ ] Solicitarea a fost trimisă
- [ ] Follow-up planificat dacă nu răspunde în 10 zile

---
*Generat automat de CompliScan — nu constituie consultanță juridică.*`,
        generatedAtISO: now,
      },
      {
        id: assetId(),
        type: "privacy-review-checklist",
        title: "Checklist vendor governance",
        content: `# Checklist Vendor Governance — ${orgLabel}

## Inventar minim
- [ ] Avem lista cu ${vendorCountLabel}
- [ ] Pentru fiecare vendor știm dacă trimitem date personale
- [ ] Pentru fiecare vendor știm dacă trimitem date confidențiale / interne

## Documente minime de urmărit
- [ ] DPA / anexă contractuală
- [ ] Termeni de privacy / security
- [ ] Mecanism de transfer (DPF / SCC / altul)
- [ ] Certificări sau TOMs relevante

## Decizie per vendor
- [ ] Păstrăm vendorul
- [ ] Cerem documente suplimentare
- [ ] Limităm datele transmise
- [ ] Oprim utilizarea dacă riscul rămâne neacoperit

---
*Generat automat de CompliScan — nu constituie consultanță juridică.*`,
        generatedAtISO: now,
      },
      {
        id: assetId(),
        type: "finding-resolution-steps",
        title: "Plan intern de remediere vendor",
        content: `# Plan intern de remediere — Vendor Governance

## Pașii recomandați
1. Pornește review pentru furnizorii principali sau critici
2. Trimite pachetul de solicitare către furnizorii fără documente
3. Atașează în review dovada primită sau nota internă de follow-up
4. Închide review-ul numai când există urmă clară
5. Revino în cockpit și notează ce ai acoperit deja

## Rezultat minim acceptabil
- cel puțin un review vendor pornit
- solicitarea de documentație pregătită
- checklistul intern completat

---
*Generat automat de CompliScan — nu constituie consultanță juridică.*`,
        generatedAtISO: now,
      },
    ],
    completionChecklist: [
      "Am revizuit pachetul de solicitare și checklistul vendor.",
      "Am pornit cel puțin un vendor review pentru un furnizor relevant.",
      "Știu ce dovadă trebuie să adaug în review și ce voi confirma în cockpit.",
    ],
  }
}

/**
 * Generează assets potrivite pentru cazul de review determinat.
 */
export function generateReviewAssets(
  vendorName: string,
  reviewCase: VendorReviewCase,
  context: VendorReviewContext,
): VendorReviewAsset[] {
  switch (reviewCase) {
    case "A":
      return generateCaseAAssets(vendorName)
    case "B":
      return generateCaseBAssets(vendorName, context)
    case "C":
      return generateCaseCAssets(vendorName)
    case "D":
      return generateCaseDAssets(vendorName)
  }
}

/**
 * Determină statusul următoarei etape pe baza cazului de review.
 */
export function nextStatusAfterReview(reviewCase: VendorReviewCase): VendorReviewStatus {
  if (reviewCase === "D") return "needs-context" // rămâne deschis
  return "review-generated"
}

/**
 * Calculează data următorului review pe baza cazului.
 */
export function computeNextReviewDue(reviewCase: VendorReviewCase): string {
  const months = reviewCase === "A" ? 12 : reviewCase === "B" ? 6 : reviewCase === "C" ? 6 : 3
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}

// ── Audit trail helper ───────────────────────────────────────────────────────

export function appendAudit(
  existing: AuditEntry[] | undefined,
  action: AuditAction,
  by: string,
  note?: string,
): AuditEntry[] {
  const entry: AuditEntry = { action, by, atISO: new Date().toISOString(), note }
  return [...(existing ?? []), entry]
}

// ── Evidence helper ──────────────────────────────────────────────────────────

let evidenceCounter = 0
export function createEvidenceId(): string {
  return `evi-${Date.now().toString(36)}-${(++evidenceCounter).toString(36)}`
}

// ── Revalidation helpers ─────────────────────────────────────────────────────

/**
 * Check if a review is overdue based on its nextReviewDueISO.
 */
export function isReviewOverdue(review: VendorReview): boolean {
  if (!review.nextReviewDueISO) return false
  if (review.status !== "closed") return false
  return new Date(review.nextReviewDueISO) <= new Date()
}

/**
 * Build a PastClosure record from a review that's about to be reopened.
 */
export function buildPastClosure(review: VendorReview): PastClosure | null {
  if (!review.closedAtISO || !review.reviewCase) return null
  return {
    closedAtISO: review.closedAtISO,
    closedBy: review.closureApprovedBy ?? "unknown",
    evidenceItems: review.evidenceItems ?? [],
    reviewCase: review.reviewCase,
    nextReviewDueISO: review.nextReviewDueISO ?? "",
  }
}

// ── Review case labels ────────────────────────────────────────────────────────

export const REVIEW_CASE_LABELS: Record<VendorReviewCase, string> = {
  A: "Review simplu — software intern, fără date personale",
  B: "Privacy/Vendor review — date personale + processor",
  C: "AI use review — vendor AI, date sensibile necunoscute",
  D: "Review incomplet — informație insuficientă",
}

export const REVIEW_STATUS_LABELS: Record<VendorReviewStatus, string> = {
  detected: "Detectat",
  "needs-context": "Necesită context",
  "review-generated": "Review generat",
  "awaiting-human-validation": "Așteaptă validare",
  "awaiting-evidence": "Așteaptă dovadă",
  closed: "Închis",
  "overdue-review": "Review depășit",
}

export const URGENCY_LABELS: Record<VendorReviewUrgency, string> = {
  critical: "Critic",
  high: "Ridicat",
  medium: "Mediu",
  info: "Informativ",
}
