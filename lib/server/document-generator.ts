// LLM-powered compliance document generator.
// Generates: Privacy Policy, Cookie Policy, DPA, Retention Policy, NIS2 Incident Response Plan,
// AI Governance Policy, Job Description, HR Internal Procedures, REGES Correction Brief,
// Contract Template, Deletion Attestation.
// Uses Gemini API. Falls back to a static skeleton when GEMINI_API_KEY is absent.

import { fetchWithOperationalGuard } from "@/lib/server/http-client"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite"

export type DocumentType =
  | "privacy-policy"
  | "cookie-policy"
  | "dpa"
  | "retention-policy"
  | "nis2-incident-response"
  | "ai-governance"
  | "annex-iv"
  | "job-description"
  | "hr-internal-procedures"
  | "reges-correction-brief"
  | "contract-template"
  | "nda"
  | "supplier-contract"
  | "deletion-attestation"
  | "pay-gap-report"
  | "ropa"

export type DocumentGenerationInput = {
  documentType: DocumentType
  orgName: string
  orgWebsite?: string
  orgSector?: string
  orgCui?: string
  dpoEmail?: string
  /** Short description of main data flows / services */
  dataFlows?: string
  counterpartyName?: string
  counterpartyReferenceUrl?: string
  /** Cabinet / partner name that prepared the draft for the client. */
  preparedBy?: string
  // ── Sprint 16/16 — Extended fields ──────────────────────────────────────
  /** Job description: title of the position */
  jobTitle?: string
  /** Job description: department */
  department?: string
  /** Job description: contract type (full-time, part-time, etc.) */
  contractType?: string
  /** Job description: specific duties (optional — AI fills gaps) */
  specificDuties?: string
  /** HR procedures: standard work schedule */
  workSchedule?: string
  /** HR procedures: employee count */
  employeeCount?: number
  /** REGES: accountant contact for briefing */
  accountantContact?: string
  /** Contracts: type of services provided */
  serviceDescription?: string
  /** Contracts: payment terms */
  paymentTerms?: string
  /** Deletion attestation: target system */
  targetSystem?: string
  /** Deletion attestation: data category */
  dataCategory?: string
  /**
   * S1.3 — AI ON/OFF toggle per client (Issue 4 DPO follow-up).
   * Default `true` (AI enabled). Cand `false`, generatorul ocoleste apelul Gemini
   * si returneaza direct template-ul determinist (`buildFallbackDocument`).
   * Setat din `WhiteLabelConfig.aiEnabled` per org de catre cabinet.
   */
  aiEnabled?: boolean
}

export type GeneratedDocument = {
  documentType: DocumentType
  title: string
  /** Markdown content — ready for preview or download */
  content: string
  generatedAtISO: string
  llmUsed: boolean
  // E1 — Expiry management
  expiresAtISO: string
  nextReviewDateISO: string
}

// ── Document metadata ─────────────────────────────────────────────────────────

// E1 — Expiry rules per document type
const DOC_EXPIRY_MONTHS: Record<DocumentType, number> = {
  "privacy-policy": 24,
  "cookie-policy": 24,
  dpa: 12,
  "retention-policy": 24,
  "nis2-incident-response": 12,
  "ai-governance": 24,
  "annex-iv": 12,
  "job-description": 12,
  "hr-internal-procedures": 24,
  "reges-correction-brief": 6,
  "contract-template": 24,
  nda: 24,
  "supplier-contract": 24,
  "deletion-attestation": 6,
  "pay-gap-report": 12,
  ropa: 12,
}

// Review date = 30 days before expiry
function calculateExpiryDates(documentType: DocumentType, generatedAtISO: string) {
  const expiryMonths = DOC_EXPIRY_MONTHS[documentType]
  const generatedAt = new Date(generatedAtISO)

  const expiresAt = new Date(generatedAt)
  expiresAt.setMonth(expiresAt.getMonth() + expiryMonths)

  const nextReviewDate = new Date(expiresAt)
  nextReviewDate.setDate(nextReviewDate.getDate() - 30)

  return {
    expiresAtISO: expiresAt.toISOString(),
    nextReviewDateISO: nextReviewDate.toISOString(),
  }
}

const DOC_META: Record<DocumentType, { title: string; legalBasis: string }> = {
  "privacy-policy": {
    title: "Politică de Confidențialitate",
    legalBasis: "GDPR Art. 13–14 (Regulamentul UE 2016/679)",
  },
  "cookie-policy": {
    title: "Politică de Cookies",
    legalBasis: "Directiva ePrivacy 2002/58/CE + GDPR",
  },
  dpa: {
    title: "Acord de Prelucrare a Datelor (DPA)",
    legalBasis: "GDPR Art. 28",
  },
  "retention-policy": {
    title: "Politică și Matrice de Retenție a Datelor",
    legalBasis: "GDPR Art. 5(1)(e)",
  },
  "nis2-incident-response": {
    title: "Plan de Răspuns la Incidente de Securitate (NIS2)",
    legalBasis: "Directiva NIS2 (UE 2022/2555) + GDPR Art. 33–34",
  },
  "ai-governance": {
    title: "Politică de Guvernanță AI",
    legalBasis: "EU AI Act (Regulamentul UE 2024/1689) Art. 9, 17",
  },
  "annex-iv": {
    title: "Documentație tehnică Annex IV",
    legalBasis: "EU AI Act Annex IV",
  },
  "job-description": {
    title: "Fișă de Post",
    legalBasis: "Codul Muncii Art. 17, 39 (Legea 53/2003)",
  },
  "hr-internal-procedures": {
    title: "Regulament Intern",
    legalBasis: "Codul Muncii Art. 241–246 (Legea 53/2003)",
  },
  "reges-correction-brief": {
    title: "Brief Corecție REGES/Revisal",
    legalBasis: "HG 905/2017, Codul Muncii Art. 34",
  },
  "contract-template": {
    title: "Contract-Cadru Prestări Servicii",
    legalBasis: "Codul Civil Art. 1166–1323, GDPR Art. 28",
  },
  nda: {
    title: "Acord de Confidențialitate (NDA)",
    legalBasis: "Codul Civil Art. 1169–1170, GDPR Art. 28, 32",
  },
  "supplier-contract": {
    title: "Contract-Cadru Furnizor",
    legalBasis: "Codul Civil Art. 1166–1323, GDPR Art. 28",
  },
  "deletion-attestation": {
    title: "Atestare Ștergere/Anonimizare Date",
    legalBasis: "GDPR Art. 5(1)(e), Art. 17",
  },
  "pay-gap-report": {
    title: "Raport Pay Transparency",
    legalBasis: "Directiva (UE) 2023/970",
  },
  ropa: {
    title: "Registru de Prelucrări (RoPA)",
    legalBasis: "GDPR Art. 30",
  },
}

export function getGeneratedDocumentTitle(input: DocumentGenerationInput) {
  const meta = DOC_META[input.documentType]

  if (input.documentType === "dpa" && input.counterpartyName?.trim()) {
    return `${meta.title} — ${input.orgName} × ${input.counterpartyName.trim()}`
  }

  return meta.title
}

const DOCUMENT_DATE_TIMEZONE = "Europe/Bucharest"

function formatDocumentDateRo(generatedAtISO: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: DOCUMENT_DATE_TIMEZONE,
  }).format(new Date(generatedAtISO))
}

function normalizeWebsiteForDocument(value?: string) {
  if (!value) return null
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
}

function getPreferredDocumentDateLabel(documentType: DocumentType) {
  switch (documentType) {
    case "privacy-policy":
    case "cookie-policy":
    case "retention-policy":
      return "Ultima actualizare"
    default:
      return "Data generării"
  }
}

export function normalizeGeneratedDocumentContent(
  content: string,
  documentType: DocumentType,
  generatedAtISO: string
) {
  const formattedDate = formatDocumentDateRo(generatedAtISO)
  const preferredLabel = getPreferredDocumentDateLabel(documentType)
  const replacementLine = `**${preferredLabel}:** ${formattedDate}`
  const dateLinePattern =
    /^(?:\*\*)?\s*(Ultima actualizare|Data ultimei actualizări|Data actualizării|Data generării)(?:\*\*)?\s*:\s*.*$/im

  if (dateLinePattern.test(content)) {
    return content.replace(dateLinePattern, replacementLine)
  }

  const lines = content.split("\n")
  const firstHeadingIndex = lines.findIndex((line) => line.startsWith("# "))
  if (firstHeadingIndex === -1) {
    return [replacementLine, "", content].filter(Boolean).join("\n")
  }

  lines.splice(firstHeadingIndex + 1, 0, "", replacementLine)
  return lines.join("\n").replace(/\n{3,}/g, "\n\n")
}

// ── Prompts ───────────────────────────────────────────────────────────────────

function buildPrompt(input: DocumentGenerationInput, generatedAtISO: string): string {
  const meta = DOC_META[input.documentType]
  const generatedDate = formatDocumentDateRo(generatedAtISO)
  const preferredDateLabel = getPreferredDocumentDateLabel(input.documentType)
  const orgLine = `Organizație: ${input.orgName}${input.orgCui ? ` (CUI: ${input.orgCui})` : ""}${input.orgWebsite ? `, website: ${input.orgWebsite}` : ""}${input.orgSector ? `, sector: ${input.orgSector}` : ""}.`
  const dpoLine = input.dpoEmail ? `Responsabil protecția datelor (DPO): ${input.dpoEmail}.` : ""
  const flowsLine = input.dataFlows ? `Fluxuri de date / servicii principale: ${input.dataFlows}.` : ""
  const dateLine = `**${preferredDateLabel}:** ${generatedDate}`

  const contextBlock = [
    orgLine,
    dpoLine,
    flowsLine,
    input.counterpartyName ? `Procesator / furnizor vizat: ${input.counterpartyName}.` : "",
    input.counterpartyReferenceUrl ? `Referință publică utilă: ${input.counterpartyReferenceUrl}.` : "",
    `Data exactă a documentului (fus orar România): ${generatedDate}.`,
  ]
    .filter(Boolean)
    .join("\n")

  const prompts: Record<DocumentType, string> = {
    "privacy-policy": `
Generează o Politică de Confidențialitate completă în română pentru organizația de mai jos.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}

Cerințe:
- Structură conformă GDPR Art. 13 + Art. 14 (toate punctele obligatorii)
- Include imediat sub titlu linia exactă: ${dateLine}
- Categorii de date colectate, scopul prelucrării, temeiul juridic, durata păstrării
- Drepturile persoanelor vizate (acces, rectificare, ștergere, portabilitate, opoziție)
- Transferuri internaționale (dacă e cazul)
- Date de contact DPO sau persoană responsabilă
- Clauza de actualizare
- Nu inventa altă dată pentru câmpurile de actualizare sau generare
- Ton profesional, limbaj clar pentru publicul larg
- Format Markdown cu titluri clare (# ## ###)
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    "cookie-policy": `
Generează o Politică de Cookies completă în română pentru organizația de mai jos.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}

Cerințe:
- Ce sunt cookies-urile și de ce sunt folosite
- Include imediat sub titlu linia exactă: ${dateLine}
- Categorii de cookies: strict necesare, funcționale, analitice, de marketing
- Durata de valabilitate pentru fiecare categorie
- Parteneri terți (ex. Google Analytics, Facebook Pixel — dacă e relevant din context)
- Cum poate utilizatorul să gestioneze/retragă consimțământul
- Link spre Politica de Confidențialitate
- Nu inventa altă dată pentru câmpurile de actualizare sau generare
- Format Markdown cu titluri clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    dpa: `
Generează un Acord de Prelucrare a Datelor (DPA) complet în română conform GDPR Art. 28.
Baza legală: ${meta.legalBasis}.

Context (Operator de date):
${contextBlock}

Cerințe:
- Denumire contract, operator și procesator (${input.counterpartyName ? `folosește ${input.counterpartyName} ca procesator principal` : "folosim [PROCESATOR] ca placeholder"})
- Include imediat sub titlu linia exactă: ${dateLine}
- Obiectul prelucrării: categorii de date, scopul, durata
- Obligațiile procesatorului (Art. 28.3 a-h GDPR): confidențialitate, securitate, subcontractare, audit, ștergere
- Obligațiile operatorului
- Sub-procesatori: clauze și notificare prealabilă
- Drepturile persoanelor vizate — asistare
- Notificare breșe de date (fără întârziere nejustificată)
- Transferuri internaționale — clauze contractuale standard
- Durata și rezilierea acordului
- Nu inventa altă dată pentru câmpurile de actualizare sau generare
- Format Markdown cu titluri clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    "retention-policy": `
Generează o Politică și Matrice de Retenție a Datelor completă în română conform GDPR Art. 5(1)(e).
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}

Cerințe:
- Include imediat sub titlu linia exactă: ${dateLine}
- Separă clar politica generală de matricea practică de retenție
- Include categorii tipice de date: clienți, lead-uri, HR, contracte, facturi, suport, marketing, loguri operaționale
- Pentru fiecare categorie: scop, temei, termen orientativ de retenție, trigger de ștergere sau anonimizare
- Explică cine aprobă termenele și cine execută ștergerea
- Include pași de dovadă operațională: log de ștergere, export control, verificare periodică
- Include secțiune despre excepții: litigii, obligații legale, investigații, arhivare contabilă
- Nu inventa altă dată pentru câmpurile de actualizare sau generare
- Format Markdown cu titluri clare și o tabelare lizibilă pentru matrice
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    "nis2-incident-response": `
Generează un Plan de Răspuns la Incidente de Securitate în română conform NIS2 și GDPR.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}

Cerințe:
- Scopul și domeniul de aplicare
- Include imediat sub titlu linia exactă: ${dateLine}
- Clasificarea incidentelor (P1/P2/P3 cu criterii clare)
- Echipa de răspuns: roluri și responsabilități
- Pași detaliați: Detectare → Evaluare → Conținere → Eradicare → Recuperare → Post-mortem
- Timeline-uri NIS2: alerta timpurie 24h, raport complet 72h, raport final 30 zile
- Timeline-uri GDPR: notificare ANSPDCP 72h, notificare persoane vizate dacă e cazul
- Template de raport incident (câmpuri de completat)
- Canale de escaladare și comunicare
- Lista contacte externe: DNSC, ANSPDCP, CERT-RO
- Nu inventa altă dată pentru câmpurile de actualizare sau generare
- Format Markdown cu titluri clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    "ai-governance": `
Generează o Politică de Guvernanță AI completă în română conform EU AI Act.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}

Cerințe:
- Scopul și domeniul de aplicare al politicii
- Include imediat sub titlu linia exactă: ${dateLine}
- Clasificarea sistemelor AI utilizate (risc minim / limitat / ridicat / inacceptabil)
- Obligații pentru sisteme de risc ridicat: sistem de management al riscului, date de antrenament, documentație tehnică, logare, transparență, supraveghere umană
- Obligații de transparență pentru sisteme limitate (chatbots etc.)
- Procesul de evaluare conformitate înainte de deployment
- Roluri: AI Officer, responsabil conformitate, utilizatori
- Post-market monitoring: cum se urmăresc incidentele AI
- Registrul sistemelor AI (trimitere spre inventarul CompliScan)
- Politica de utilizare acceptabilă a AI generativ intern
- Nu inventa altă dată pentru câmpurile de actualizare sau generare
- Format Markdown cu titluri clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    "annex-iv": `
Generează o documentație tehnică Annex IV în română pentru un sistem AI high-risk.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}

Cerințe:
- Include imediat sub titlu linia exactă: ${dateLine}
- Structură tehnică pentru scop, risc, date folosite, monitorizare, human oversight și limitări
- Ton formal, orientat spre audit și review de conformitate
- Format Markdown cu titluri clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    "job-description": `
Generează o Fișă de Post completă în română conform Codului Muncii.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}
${input.jobTitle ? `Titlul postului: ${input.jobTitle}.` : ""}
${input.department ? `Departament: ${input.department}.` : ""}
${input.contractType ? `Tip contract: ${input.contractType}.` : ""}
${input.specificDuties ? `Atribuții specifice menționate: ${input.specificDuties}.` : ""}

Cerințe:
- Include imediat sub titlu linia exactă: ${dateLine}
- Structura obligatorie Art. 17 Codul Muncii: identificare post, loc de muncă, felul muncii
- Atribuțiile și responsabilitățile principale (minim 8-10 puncte concrete)
- Competențe profesionale și personale cerute
- Studii și experiență necesare
- Relații ierarhice: subordonare, coordonare, colaborare
- Condiții de muncă, program, eventuale deplasări
- Criterii de evaluare a performanței (minim 4-5 criterii)
- Clauza privind modificarea fișei de post
- Semnături: angajat, șef direct, HR
- Nu inventa altă dată pentru câmpurile de actualizare sau generare
- Format Markdown cu titluri clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    "hr-internal-procedures": `
Generează un Regulament Intern complet în română conform Codului Muncii Art. 241-246.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}
${input.employeeCount ? `Număr angajați: ${input.employeeCount}.` : ""}
${input.workSchedule ? `Program standard: ${input.workSchedule}.` : ""}

Cerințe:
- Include imediat sub titlu linia exactă: ${dateLine}
- Cap. I: Dispoziții generale — scopul, domeniul, baza legală
- Cap. II: Drepturile și obligațiile angajatorului (Art. 40 Codul Muncii)
- Cap. III: Drepturile și obligațiile angajaților (Art. 39 Codul Muncii)
- Cap. IV: Programul de lucru — durata, pauze, ore suplimentare, telemuncă
- Cap. V: Concedii — de odihnă, medicale, evenimente familiale, formare (Art. 139-158)
- Cap. VI: Disciplina muncii — abateri, sancțiuni, procedura cercetării (Art. 247-252)
- Cap. VII: Sănătate și securitate în muncă — obligații SSM
- Cap. VIII: Protecția datelor angajaților — GDPR, drepturile angajaților ca persoane vizate
- Cap. IX: Protecția maternității — conform OUG 96/2003
- Cap. X: Egalitate de șanse — nediscriminare, hărțuire (Legea 202/2002)
- Cap. XI: Semnalarea neregulilor — whistleblowing (Legea 361/2022)
- Cap. XII: Dispoziții finale — modificare, afișare, confirmare luare la cunoștință
- Nu inventa altă dată pentru câmpurile de actualizare sau generare
- Format Markdown cu titluri clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    "reges-correction-brief": `
Generează un Brief de Corecție REGES/Revisal în română — un document structurat de instrucțiuni pentru contabilul sau responsabilul HR al organizației.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}
${input.employeeCount ? `Număr angajați: ${input.employeeCount}.` : ""}
${input.accountantContact ? `Contact contabil: ${input.accountantContact}.` : ""}

Cerințe:
- Include imediat sub titlu linia exactă: ${dateLine}
- Secțiunea 1: Scop — ce trebuie verificat și de ce
- Secțiunea 2: Checklist de verificare REGES:
  - [ ] Toate contractele de muncă sunt înregistrate în Revisal
  - [ ] Datele de început/sfârșit contract sunt corecte
  - [ ] Funcțiile/posturile corespund cu COR (Clasificarea Ocupațiilor din România)
  - [ ] Salariile de bază sunt actualizate
  - [ ] Modificările contractuale (acte adiționale) sunt transmise
  - [ ] Suspendările/încetările sunt înregistrate la termen (3 zile lucrătoare)
- Secțiunea 3: Termene legale — HG 905/2017 Art. 4 (3 zile lucrătoare pt transmitere)
- Secțiunea 4: Consecințe neconformitate — amenzi ITM (5.000-10.000 RON/angajat)
- Secțiunea 5: Pași de acțiune imediată cu prioritizare
- Secțiunea 6: Ce dovadă trebuie adusă înapoi (export Revisal, confirmare transmitere)
- Ton direct, operațional, adresat contabilului/HR-ului
- Nu inventa altă dată pentru câmpurile de actualizare sau generare
- Format Markdown cu titluri clare și checklist-uri
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    "contract-template": `
Generează un Contract-Cadru de Prestări Servicii complet în română.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}
${input.counterpartyName ? `Beneficiar/Prestator vizat: ${input.counterpartyName}.` : ""}
${input.serviceDescription ? `Descriere servicii: ${input.serviceDescription}.` : ""}
${input.paymentTerms ? `Condiții de plată: ${input.paymentTerms}.` : ""}

Cerințe:
- Include imediat sub titlu linia exactă: ${dateLine}
- Art. 1: Părțile contractante (cu placeholdere pentru date: nume, CUI, adresă, reprezentant)
- Art. 2: Obiectul contractului — descrierea serviciilor
- Art. 3: Durata contractului — perioadă, prelungire automată/tacită
- Art. 4: Prețul și modalitatea de plată — valoare, termen, penalități
- Art. 5: Obligațiile prestatorului
- Art. 6: Obligațiile beneficiarului
- Art. 7: Confidențialitate — clauză NDA integrată
- Art. 8: Protecția datelor personale — trimitere la DPA dacă se procesează date
- Art. 9: Proprietate intelectuală
- Art. 10: Răspunderea părților — limitare, forță majoră
- Art. 11: Rezilierea — condiții, notificare prealabilă
- Art. 12: Litigii — tentativă amiabilă, instanță competentă
- Art. 13: Dispoziții finale — modificări prin act adițional, exemplare
- Câmpuri de semnătură: Prestator, Beneficiar, Data, Semnătura
- Nu inventa altă dată pentru câmpurile de actualizare sau generare
- Format Markdown cu titluri clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    nda: `
Generează un Acord de Confidențialitate (NDA) bilateral complet în română.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}
${input.counterpartyName ? `Contrapartidă vizată: ${input.counterpartyName}.` : ""}
${input.serviceDescription ? `Context colaborare: ${input.serviceDescription}.` : ""}

Cerințe:
- Include imediat sub titlu linia exactă: ${dateLine}
- Art. 1: Părțile — placeholdere pentru ambele părți (Partea Divulgantă, Partea Receptoare)
- Art. 2: Definiții — Informație Confidențială (include: date tehnice, comerciale, financiare, liste clienți, strategii, date personale)
- Art. 3: Excepții — informații publice, dezvoltate independent, primite legal de la terți, impuse de lege
- Art. 4: Obligații — nedivulgare, restricție de utilizare (doar scopul colaborării), protecție rezonabilă, limitare acces la "need to know"
- Art. 5: Durata confidențialității — minim 3 ani după încetarea acordului
- Art. 6: Restituirea/distrugerea informațiilor la cerere sau la încetarea acordului
- Art. 7: Proprietate intelectuală — NDA nu transferă drepturi de PI
- Art. 8: Protecția datelor personale — trimitere la GDPR dacă informațiile conțin date personale
- Art. 9: Penalități pentru încălcare — clauză penală orientativă
- Art. 10: Legea aplicabilă și jurisdicția — legea română, instanțele competente
- Art. 11: Dispoziții finale — modificări doar prin act adițional scris, limba oficială, exemplare
- Câmpuri de semnătură: Partea 1, Partea 2, Reprezentant, Data, Semnătura
- Bilateral: protejează ambele părți, nu doar una
- Nu inventa altă dată pentru câmpurile de actualizare sau generare
- Format Markdown cu titluri clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    "supplier-contract": `
Generează un Contract-Cadru cu Furnizorul complet în română — perspectiva beneficiarului care primește servicii/produse.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}
${input.counterpartyName ? `Furnizor vizat: ${input.counterpartyName}.` : ""}
${input.serviceDescription ? `Servicii/produse furnizate: ${input.serviceDescription}.` : ""}
${input.paymentTerms ? `Condiții de plată: ${input.paymentTerms}.` : ""}

Cerințe:
- Include imediat sub titlu linia exactă: ${dateLine}
- Art. 1: Părțile — Beneficiar (organizația) și Furnizor (cu placeholdere: CUI, adresă, reprezentant)
- Art. 2: Obiectul contractului — serviciile/produsele furnizate
- Art. 3: Durata — perioadă, condiții de prelungire sau încetare
- Art. 4: Prețul și plata — valoare, termen de plată, monedă, penalități de întârziere
- Art. 5: Obligațiile furnizorului — calitate, termen de livrare, garanție, SLA dacă e cazul
- Art. 6: Obligațiile beneficiarului — plata la termen, furnizare informații, acces
- Art. 7: Confidențialitate — clauză de confidențialitate integrată
- Art. 8: Protecția datelor personale — dacă furnizorul procesează date personale, trimite la DPA
- Art. 9: Sub-contractarea — condiții în care furnizorul poate folosi sub-contractanți
- Art. 10: Răspundere — limitarea răspunderii, forță majoră, caz fortuit
- Art. 11: Reziliere — neexecutare, notificare prealabilă (minim 30 zile)
- Art. 12: Proprietate intelectuală — ce rămâne la cine
- Art. 13: Litigii — tentativă amiabilă, instanța competentă
- Art. 14: Dispoziții finale — modificări prin act adițional, exemplare
- Câmpuri de semnătură: Beneficiar, Furnizor, Data, Semnătura
- Perspectiva este a beneficiarului care își protejează interesele
- Nu inventa altă dată pentru câmpurile de actualizare sau generare
- Format Markdown cu titluri clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    "deletion-attestation": `
Generează o Atestare de Ștergere/Anonimizare a Datelor Personale în română.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}
${input.targetSystem ? `Sistem vizat: ${input.targetSystem}.` : ""}
${input.dataCategory ? `Categorie date: ${input.dataCategory}.` : ""}

Cerințe:
- Include imediat sub titlu linia exactă: ${dateLine}
- Document scurt, de tip formular/atestare (1-2 pagini maximum)
- Secțiune 1: Informații generale — organizație, data execuției, executant
- Secțiune 2: Date despre acțiune:
  - Sistemul/baza de date vizată
  - Categoria de date personale afectate
  - Număr estimat de înregistrări
  - Metoda aplicată: ștergere definitivă / anonimizare / pseudonimizare
  - Baza legală a acțiunii (expirare retenție, cerere ștergere, etc.)
- Secțiune 3: Verificare (câmpuri de completat manual):
  - [ ] Datele au fost șterse/anonimizate conform procedurii
  - [ ] Back-up-urile sunt curățate sau programate pentru curățare
  - [ ] Procesatorii/sub-procesatorii au fost notificați (dacă e cazul)
  - [ ] Log de execuție sau export de control este atașat
- Secțiune 4: Semnături — executant, verificator, data
- Ton formal, operațional
- Nu inventa altă dată pentru câmpurile de actualizare sau generare
- Format Markdown cu titluri clare și checkbox-uri
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    "pay-gap-report": `
Generează un raport Pay Transparency în română.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}

Cerințe:
- Include imediat sub titlu linia exactă: ${dateLine}
- Rezumat executiv, gap general, gap pe roluri, recomandări și pași următori
- Ton formal și orientat spre aprobare internă
- Format Markdown cu titluri clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    ropa: `
Generează un Registru de Prelucrări (RoPA - Record of Processing Activities) complet în română conform GDPR Art. 30.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}

Cerințe:
- Include imediat sub titlu linia exactă: ${dateLine}
- Tabel structurat cu coloane: Activitate, Scop, Categorii date, Temei legal, Persoane vizate, Destinatari, Transfer terțe țări, Perioadă retenție, Măsuri securitate
- Pentru fiecare activitate de prelucrare:
  * Denumire clară (ex: Facturare clienți, Newsletter marketing, Cookies site web)
  * Scopul prelucrării (de ce)
  * Categoriile de date personale (ce date)
  * Temeiul legal GDPR (Art. 6(1)(a) consimțământ, (b) contract, (c) obligații legale, (f) interes legitim)
  * Categoriile de persoane vizate (angajați, clienți, furnizori, vizitatori)
  * Destinatarii sau categoriile de destinatari (interni și externi)
  * Transferuri în țări terțe (da/nu, dacă da - care țară și ce garanții)
  * Perioada de păstrare (cu criterii sau termen specific)
  * Descrierea generală a măsurilor tehnice și organizatorice de securitate
- Include secțiuni pentru: Operator, Reprezentant, Persoană de contact, DPO (dacă e desemnat)
- Activitățile tipice pentru o firmă românească: Facturare, Contabilitate, HR/Angajări, Marketing (newsletter), Cookies site web, Relații clienți/Suport
- Format Markdown cu tabele clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
  }

  return `Ești un expert juridic în conformitate europeană pentru companii românești.\n${prompts[input.documentType].trim()}`
}

// ── Static fallback templates ─────────────────────────────────────────────────

function buildFallbackDocument(input: DocumentGenerationInput): GeneratedDocument {
  const meta = DOC_META[input.documentType]
  const now = new Date().toISOString()
  const title = getGeneratedDocumentTitle(input)
  const preferredDateLabel = getPreferredDocumentDateLabel(input.documentType)
  const formattedDate = formatDocumentDateRo(now)
  const websiteHost = normalizeWebsiteForDocument(input.orgWebsite)
  const reviewWarning =
    "⚠️ DRAFT — necesită validarea consultantului înainte de utilizare oficială."
  const serviceFallbackNote =
    "Draft pregătit cu CompliScan pentru revizia consultantului. Completează câmpurile operaționale înainte de utilizare oficială."
  const preparedBy = input.preparedBy?.trim() || "DPO Complet"

  const contentMap: Record<DocumentType, string> = {
    "privacy-policy": [
      `# ${title}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Organizație:** ${input.orgName}`,
      ...(websiteHost ? [`**Website:** ${websiteHost}`] : []),
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Cine suntem",
      `${input.orgName} prelucrează date personale în legătură cu activitatea comercială și cu operațiunile derulate prin ${websiteHost ?? "canalele sale digitale și operaționale"}. Această politică explică ce date folosim, de ce le folosim și ce drepturi au persoanele vizate.`,
      "",
      "## Ce date prelucrăm",
      "Date de identificare și contact, date despre clienți și potențiali clienți, date transmise prin formulare, date necesare pentru contractare, suport și obligații legale sau fiscale.",
      "",
      "## Identitatea operatorului",
      `Operatorul de date personale este ${input.orgName}, cu sediu social conform informațiilor din registrul ANAF.`,
      "",
      "## De ce le prelucrăm",
      "Executarea contractelor, administrarea relației cu clienții, răspuns la solicitări, conformare legală, securitate operațională și îmbunătățirea serviciilor. Fiecare scop trebuie confirmat intern înainte de utilizare oficială. Temeiul juridic poate fi consimțământul, executarea contractului sau interesul legitim al operatorului.",
      "",
      "## Destinatari",
      "Datele pot fi împărtășite cu furnizori tehnici (hosting, e-mail, plăți), parteneri contractuali sau terți implicați în executarea serviciilor, sub obligație de confidențialitate și, unde e cazul, pe baza unui DPA.",
      "",
      "## Cât timp le păstrăm",
      "Păstrăm datele doar atât cât este necesar pentru scopul declarat, pentru obligațiile legale și pentru apărarea drepturilor noastre. Termenele concrete trebuie corelate cu politica internă de retenție.",
      "",
      "## Transferuri internaționale",
      "Dacă datele sunt transferate în afara SEE, transferul se face doar cu garanții adecvate (clauze contractuale standard, decizie de adecvare sau alt mecanism legal).",
      "",
      "## Drepturile persoanelor vizate",
      "Persoanele vizate pot solicita acces, rectificare, ștergere, restricționare, portabilitate sau opoziție, în condițiile GDPR. Dacă prelucrarea se bazează pe consimțământ, acesta poate fi retras în orice moment (dreptul de retragere). Solicitările trebuie documentate și urmărite în workflow-ul DSAR.",
      "",
      "## Plângeri",
      "Aveți dreptul de a depune o plângere la ANSPDCP (Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal) dacă considerați că prelucrarea datelor dumneavoastră încalcă GDPR.",
      "",
      "## Contact",
      input.dpoEmail
        ? `Pentru întrebări privind protecția datelor, ne poți contacta la ${input.dpoEmail}.`
        : `Pentru întrebări privind protecția datelor, ${input.orgName} trebuie să desemneze și să publice un contact responsabil.`,
      "",
      reviewWarning,
    ].join("\n"),
    "cookie-policy": [
      `# ${title}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Organizație:** ${input.orgName}`,
      ...(websiteHost ? [`**Website:** ${websiteHost}`] : []),
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Ce sunt cookies-urile",
      `Pe ${websiteHost ?? "site-ul organizației"} folosim cookies și tehnologii similare pentru funcționarea serviciului, măsurarea performanței și gestionarea preferințelor utilizatorilor.`,
      "",
      "## Categorii de cookies",
      "Cookies strict necesare, cookies funcționale, cookies analitice și, dacă sunt activate cu consimțământ valid, cookies de marketing. Fiecare categorie trebuie corelată cu bannerul și cu consimțământul real din site scan.",
      "",
      "## Durata și controlul consimțământului",
      "Durata fiecărui cookie trebuie verificată în configurarea tehnică a site-ului. Utilizatorii trebuie să poată accepta, refuza sau retrage consimțământul fără fricțiune inutilă.",
      "",
      "## Parteneri terți și setări browser",
      "Dacă folosim servicii terțe de analiză sau marketing, acestea trebuie enumerate explicit și corelate cu consimțământul colectat. Utilizatorii pot controla suplimentar cookies-urile din browser.",
      "",
      reviewWarning,
    ].join("\n"),
    dpa: [
      `# ${title}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Client / Operator:** ${input.orgName}`,
      `**Furnizor / Procesator:** ${input.counterpartyName ?? "[Completează procesatorul]"}`,
      `**Pregătit de:** ${preparedBy}`,
      `**Contact consultant / DPO:** ${input.dpoEmail ?? "[Completează email consultant]"}`,
      `**Baza legală:** ${meta.legalBasis}`,
      `**Status:** DRAFT — necesită validare înainte de utilizare oficială`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Obiectul acordului",
      `${input.orgName} acționează ca operator de date și stabilește prin prezentul acord regulile minime pentru prelucrarea realizată de ${input.counterpartyName ?? "procesatorul desemnat"}, în numele și la instrucțiunile operatorului.`,
      "",
      "## Date, scop și durată",
      "Acordul trebuie să descrie categoriile de date, persoanele vizate, scopul prelucrării și durata estimată. Aceste elemente trebuie verificate înainte de semnare și corelate cu serviciul furnizorului.",
      "",
      "## Obligațiile procesatorului",
      "Procesatorul prelucrează datele doar la instrucțiunea operatorului, asigură confidențialitatea personalului, implementează măsuri de securitate, notifică incidentele fără întârziere nejustificată și sprijină operatorul la exercitarea drepturilor persoanelor vizate.",
      "",
      "## Sub-procesatori, audit și încetare",
      "Sub-procesatorii trebuie autorizați și documentați, operatorul trebuie să poată obține informații de audit rezonabile, iar la încetarea relației datele trebuie returnate sau șterse conform instrucțiunilor operatorului și obligațiilor legale.",
      "",
      reviewWarning,
    ].join("\n"),
    "retention-policy": [
      `# ${title}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Organizație:** ${input.orgName}`,
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Principiu general",
      `${input.orgName} păstrează datele doar atât cât este necesar pentru scopul declarat, pentru obligațiile legale și pentru apărarea drepturilor sale. Orice prelungire a retenției trebuie justificată și documentată.`,
      "",
      "## Matrice orientativă de retenție",
      "| Categorie | Scop | Termen orientativ | Trigger de ștergere |",
      "| --- | --- | --- | --- |",
      "| Clienți activi | executarea contractului | pe durata relației + termen legal | încetare relație și expirare obligații |",
      "| Lead-uri | ofertare și vânzări | 12 luni | lipsă conversie / retragere consimțământ |",
      "| HR | raporturi de muncă | conform cerințelor legale | expirare obligații legale |",
      "| Facturi și contabilitate | conformare fiscală | conform legii fiscale | expirare obligații de arhivare |",
      "| Loguri operaționale | securitate și suport | termen intern limitat | expirare termen + verificare |",
      "",
      "## Execuție și dovadă operațională",
      "Ștergerea sau anonimizarea trebuie să lase urmă: job executat, export de control, verificare periodică și persoană responsabilă. Excepțiile pentru litigii, investigații sau arhivare legală trebuie notate separat.",
      "",
      reviewWarning,
    ].join("\n"),
    "nis2-incident-response": [
      `# ${title}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Organizație:** ${input.orgName}`,
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Scop și domeniu",
      `${input.orgName} trebuie să poată detecta, evalua, limita și raporta incidentele de securitate într-un mod documentat, cu responsabilități clare și cu aliniere la termenele NIS2 și GDPR.`,
      "",
      "## Pașii de răspuns",
      "Detectare, evaluare inițială, conținere, eradicare, recuperare și lecții învățate. Fiecare etapă trebuie legată de un responsabil, o urmă de timp și o decizie documentată.",
      "",
      "## Timeline minim",
      "Alertă timpurie în 24h, raport complet în 72h, raport final sau post-incident în 30 de zile, plus notificări GDPR dacă incidentul afectează date personale.",
      "",
      "## Comunicare și evidență",
      "Canalele de escaladare, referințele DNSC și ANSPDCP, dovada notificărilor și deciziile critice trebuie păstrate în același dosar al incidentului.",
      "",
      reviewWarning,
    ].join("\n"),
    "ai-governance": [
      `# ${title}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Organizație:** ${input.orgName}`,
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Scop și aplicare",
      `${input.orgName} stabilește prin această politică regulile minime pentru utilizarea sistemelor AI, inclusiv AI generativ, astfel încât utilizarea să rămână controlată, documentată și aliniată la EU AI Act.`,
      "",
      "## Clasificare și aprobări",
      "Sistemele AI trebuie clasificate după nivelul de risc, iar înainte de utilizare trebuie documentate scopul, datele folosite, persoanele afectate și măsurile de supraveghere umană.",
      "",
      "## Reguli operaționale",
      "Utilizatorii nu introduc date confidențiale fără aprobare, verifică ieșirile generate, păstrează trasabilitatea deciziilor și escaladează orice folosire cu impact ridicat sau sensibil.",
      "",
      "## Monitoring și registru",
      "Organizația trebuie să mențină un registru al sistemelor AI, să urmărească incidentele și să revizuiască periodic politica, trainingul și controalele aplicate.",
      "",
      reviewWarning,
    ].join("\n"),
    "annex-iv": [
      `# ${title}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Organizație:** ${input.orgName}`,
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Descriere sistem",
      "Completează denumirea sistemului, scopul urmărit, utilizatorii afectați și contextul operațional.",
      "",
      "## Date și guvernanță",
      "Descrie sursele de date, controalele de calitate, limitările și rolurile care validează folosirea sistemului.",
      "",
      "## Human oversight",
      "Documentează cine poate opri, corecta sau revizui deciziile generate de sistemul AI.",
      "",
      "## Monitorizare și incidente",
      "Păstrează jurnalul incidentelor, reviziile periodice și măsurile de remediere pentru schimbări de risc.",
      "",
      reviewWarning,
    ].join("\n"),
    "job-description": [
      `# ${title}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Organizație:** ${input.orgName}`,
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Identificare post",
      `**Titlul postului:** ${input.jobTitle ?? "[Completează titlul postului]"}`,
      `**Departament:** ${input.department ?? "[Completează departamentul]"}`,
      `**Tip contract:** ${input.contractType ?? "Nedeterminat, normă întreagă"}`,
      `**Subordonare directă:** [Completează șeful direct]`,
      "",
      "## Atribuții și responsabilități principale",
      "- [ ] [Descrie atribuția principală #1]",
      "- [ ] [Descrie atribuția principală #2]",
      "- [ ] [Descrie atribuția principală #3]",
      "- [ ] Respectă regulamentul intern și procedurile organizației",
      "- [ ] Raportează neregulile conform procedurilor interne",
      "- [ ] Participă la instruiri și sesiuni de formare profesională",
      "",
      "## Competențe cerute",
      "**Studii:** [Completează nivelul minim de studii]",
      "**Experiență:** [Completează experiența minimă cerută]",
      "**Competențe profesionale:** Cunoașterea domeniului, capacitate de analiză, comunicare",
      "**Competențe personale:** Responsabilitate, lucru în echipă, organizare",
      "",
      "## Criterii de evaluare a performanței",
      "1. Calitatea și promptitudinea realizării sarcinilor",
      "2. Respectarea termenelor și procedurilor",
      "3. Inițiativă și contribuție la obiectivele echipei",
      "4. Dezvoltarea profesională continuă",
      "",
      "## Semnături",
      "| Angajat | Șef direct | HR |",
      "| --- | --- | --- |",
      "| Nume: _________ | Nume: _________ | Nume: _________ |",
      "| Data: _________ | Data: _________ | Data: _________ |",
      "| Semnătura: _____ | Semnătura: _____ | Semnătura: _____ |",
      "",
      reviewWarning,
    ].join("\n"),
    "hr-internal-procedures": [
      `# ${title}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Organizație:** ${input.orgName}`,
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Cap. I — Dispoziții generale",
      `Prezentul regulament intern stabilește regulile de organizare și funcționare a ${input.orgName}, drepturile și obligațiile angajatorului și ale angajaților, conform Codului Muncii (Legea 53/2003).`,
      "",
      "## Cap. II — Drepturile și obligațiile angajatorului",
      "Angajatorul are dreptul de a stabili organizarea și funcționarea unității, de a exercita controlul și de a constata abateri disciplinare. Are obligația de a asigura condiții de muncă, plata salariului, respectarea legii și protecția datelor angajaților.",
      "",
      "## Cap. III — Drepturile și obligațiile angajaților",
      "Angajații au dreptul la salariu, concediu, securitate în muncă, protecția datelor și demnitate. Au obligația de a respecta disciplina, secretul profesional, regulamentul intern și procedurile de lucru.",
      "",
      "## Cap. IV — Programul de lucru",
      `Programul standard: ${input.workSchedule ?? "[Completează: ex. Luni-Vineri 09:00-17:00]"}. Orele suplimentare se prestează doar cu acordul angajatului și se compensează conform legii.`,
      "",
      "## Cap. V — Disciplina muncii",
      "Abaterile disciplinare se constată prin cercetare disciplinară prealabilă. Sancțiunile aplicabile: avertisment scris, reducere salariu, retrogradare, desfacere contract. Angajatul are dreptul de a fi ascultat și asistat.",
      "",
      "## Cap. VI — Sănătate și securitate în muncă",
      "Angajatorul asigură instruirea periodică SSM, echipamentul de protecție și evaluarea riscurilor. Angajații respectă procedurile SSM și raportează incidentele.",
      "",
      "## Cap. VII — Protecția datelor angajaților",
      "Datele personale ale angajaților sunt prelucrate conform GDPR. Angajații au dreptul de acces, rectificare și ștergere. Cererile se adresează responsabilului de protecția datelor.",
      "",
      "## Cap. VIII — Dispoziții finale",
      "Regulamentul se aduce la cunoștința fiecărui angajat, cu confirmare scrisă. Modificările se fac cu consultarea reprezentanților angajaților.",
      "",
      reviewWarning,
    ].join("\n"),
    "reges-correction-brief": [
      `# ${title}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Organizație:** ${input.orgName}`,
      `**Destinatar:** ${input.accountantContact ?? "[Contabil / Responsabil HR]"}`,
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Scop",
      `Acest brief solicită verificarea și corectarea înregistrărilor din Revisal (REGES) pentru ${input.orgName}. Conformitatea REGES este obligatorie și supusă control ITM.`,
      "",
      "## Checklist de verificare",
      "- [ ] Toate contractele de muncă active sunt înregistrate în Revisal",
      "- [ ] Datele de început/sfârșit contract sunt corecte",
      "- [ ] Funcțiile corespund cu codurile COR",
      "- [ ] Salariile de bază sunt actualizate (inclusiv indexări)",
      "- [ ] Actele adiționale sunt transmise în termen",
      "- [ ] Suspendările/încetările sunt înregistrate (termen: 3 zile lucrătoare)",
      "- [ ] Programul de lucru este corect înregistrat",
      "",
      "## Termene legale",
      "**HG 905/2017 Art. 4:** Transmiterea se face în termen de **3 zile lucrătoare** de la încheierea/modificarea/suspendarea/încetarea contractului.",
      "",
      "## Consecințe neconformitate",
      "Amenzi ITM: **5.000 — 10.000 RON per angajat** pentru netransmiterea sau transmiterea eronată a datelor în Revisal.",
      "",
      "## Dovada necesară",
      "După verificare, trimite înapoi: export Revisal actualizat + confirmare că toate înregistrările sunt la zi.",
      "",
      reviewWarning,
    ].join("\n"),
    "contract-template": [
      `# ${title}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Prestator:** ${input.orgName}`,
      `**Beneficiar:** ${input.counterpartyName ?? "[Completează beneficiarul]"}`,
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Art. 1 — Părțile contractante",
      `**Prestatorul:** ${input.orgName}, CUI: ${input.orgCui ?? "________"}, cu sediul în ________, reprezentat prin ________.`,
      `**Beneficiarul:** ${input.counterpartyName ?? "[Nume beneficiar]"}, CUI: ________, cu sediul în ________, reprezentat prin ________.`,
      "",
      "## Art. 2 — Obiectul contractului",
      `${input.serviceDescription ?? "Prestatorul se obligă să furnizeze serviciile descrise în [Anexa 1 / specificațiile tehnice]."}`,
      "",
      "## Art. 3 — Durata",
      "Contractul intră în vigoare la data semnării și este valabil pe o perioadă de _____ luni/ani, cu posibilitate de prelungire prin act adițional.",
      "",
      "## Art. 4 — Preț și plată",
      `${input.paymentTerms ?? "Prețul este de _______ RON + TVA. Plata se face în termen de 30 de zile de la emiterea facturii."} Penalități de întârziere: 0.1% pe zi din suma restantă.`,
      "",
      "## Art. 5 — Confidențialitate",
      "Părțile se obligă să păstreze confidențialitatea informațiilor primite în cadrul prezentului contract pe toată durata acestuia și 2 ani după încetare.",
      "",
      "## Art. 6 — Protecția datelor",
      "Dacă în cadrul prestării serviciilor se procesează date personale, părțile încheie un Acord de Prelucrare a Datelor (DPA) separat, conform GDPR Art. 28.",
      "",
      "## Art. 7 — Reziliere",
      "Contractul poate fi reziliat de oricare parte cu o notificare prealabilă de 30 de zile. Rezilierea pentru neexecutare operează de drept după punerea în întârziere.",
      "",
      "## Art. 8 — Litigii",
      "Litigiile se rezolvă pe cale amiabilă. În caz contrar, competența revine instanțelor de la sediul prestatorului.",
      "",
      "## Semnături",
      "| Prestator | Beneficiar |",
      "| --- | --- |",
      "| Nume: _________ | Nume: _________ |",
      "| Data: _________ | Data: _________ |",
      "| Semnătura: _____ | Semnătura: _____ |",
      "",
      reviewWarning,
    ].join("\n"),
    nda: [
      `# Acord de Confidențialitate (NDA) — ${input.orgName}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Partea 1:** ${input.orgName}`,
      `**Partea 2:** ${input.counterpartyName ?? "[Completează contrapartida]"}`,
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Art. 1 — Părțile",
      `**Partea 1 (Divulgantă/Receptoare):** ${input.orgName}, CUI: ${input.orgCui ?? "________"}, cu sediul în ________, reprezentat prin ________.`,
      `**Partea 2 (Divulgantă/Receptoare):** ${input.counterpartyName ?? "[Completează]"}, CUI: ________, cu sediul în ________, reprezentat prin ________.`,
      "",
      "## Art. 2 — Definiții",
      "**Informație Confidențială** înseamnă orice informație transmisă de o Parte celeilalte, incluzând dar fără a se limita la: date tehnice, comerciale, financiare, liste de clienți, strategii de business, date personale, know-how, software, procese interne.",
      "",
      "## Art. 3 — Excepții",
      "Nu constituie Informație Confidențială informațiile care: (a) erau publice la momentul divulgării; (b) au fost dezvoltate independent; (c) au fost primite legal de la terți fără obligație de confidențialitate; (d) trebuie divulgate în baza unei obligații legale.",
      "",
      "## Art. 4 — Obligații de confidențialitate",
      "Fiecare Parte se obligă să: (a) nu divulge Informația Confidențială niciunui terț; (b) o utilizeze exclusiv în scopul colaborării; (c) o protejeze cu cel puțin aceeași diligență cu care își protejează propriile informații; (d) limiteze accesul doar la persoanele care au nevoie reală ('need to know').",
      "",
      "## Art. 5 — Durata confidențialității",
      "Obligațiile de confidențialitate rămân în vigoare pe toată durata acordului și 3 (trei) ani după încetarea acestuia.",
      "",
      "## Art. 6 — Restituire/distrugere",
      "La cererea oricărei Părți sau la încetarea acordului, Partea Receptoare restituie sau distruge toate materialele care conțin Informații Confidențiale, cu excepția copiilor impuse de lege.",
      "",
      "## Art. 7 — Proprietate intelectuală",
      "Prezentul NDA nu transferă niciun drept de proprietate intelectuală. Fiecare Parte rămâne titulară a propriilor drepturi.",
      "",
      "## Art. 8 — Protecția datelor personale",
      "Dacă Informațiile Confidențiale includ date personale, Părțile se obligă să respecte GDPR și legislația națională aplicabilă.",
      "",
      "## Art. 9 — Penalități",
      "Încălcarea obligațiilor de confidențialitate dă dreptul Părții prejudiciate la daune-interese. Clauza penală orientativă: _______ EUR per incident, fără a limita dreptul la despăgubiri suplimentare.",
      "",
      "## Art. 10 — Legea aplicabilă și jurisdicția",
      "Prezentul acord este guvernat de legea română. Litigiile se soluționează pe cale amiabilă. În caz contrar, competența revine instanțelor de la sediul Părții 1.",
      "",
      "## Art. 11 — Dispoziții finale",
      "Modificări doar prin act adițional scris, semnat de ambele Părți. Prezentul acord se încheie în 2 exemplare originale.",
      "",
      "## Semnături",
      "| Partea 1 | Partea 2 |",
      "| --- | --- |",
      "| Reprezentant: _________ | Reprezentant: _________ |",
      "| Data: _________ | Data: _________ |",
      "| Semnătura: _____ | Semnătura: _____ |",
      "",
      reviewWarning,
    ].join("\n"),
    "supplier-contract": [
      `# Contract-Cadru cu Furnizorul — ${input.orgName}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Beneficiar:** ${input.orgName}`,
      `**Furnizor:** ${input.counterpartyName ?? "[Completează furnizorul]"}`,
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Art. 1 — Părțile contractante",
      `**Beneficiarul:** ${input.orgName}, CUI: ${input.orgCui ?? "________"}, cu sediul în ________, reprezentat prin ________.`,
      `**Furnizorul:** ${input.counterpartyName ?? "[Completează]"}, CUI: ________, cu sediul în ________, reprezentat prin ________.`,
      "",
      "## Art. 2 — Obiectul contractului",
      `${input.serviceDescription ?? "Furnizorul se obligă să livreze serviciile/produsele descrise în [Anexa 1 / specificațiile tehnice]."}`,
      "",
      "## Art. 3 — Durata",
      "Contractul intră în vigoare la data semnării și este valabil pe o perioadă de _____ luni/ani.",
      "",
      "## Art. 4 — Preț și plată",
      `${input.paymentTerms ?? "Prețul este de _______ RON + TVA. Plata se face în termen de 30 de zile de la recepția facturii."} Penalități de întârziere: 0.1% pe zi din suma restantă.`,
      "",
      "## Art. 5 — Obligațiile furnizorului",
      "Furnizorul se obligă să: (a) livreze serviciile/produsele la calitatea convenită; (b) respecte termenele de livrare; (c) acorde garanție conform legislației și specificațiilor; (d) comunice imediat orice întârziere sau impediment.",
      "",
      "## Art. 6 — Obligațiile beneficiarului",
      "Beneficiarul se obligă să: (a) achite prețul la termen; (b) furnizeze informațiile necesare executării; (c) asigure accesul necesar la locații/sisteme.",
      "",
      "## Art. 7 — Confidențialitate",
      "Părțile păstrează confidențialitatea informațiilor primite pe durata contractului și 2 ani după încetare.",
      "",
      "## Art. 8 — Protecția datelor",
      "Dacă Furnizorul procesează date personale ale Beneficiarului, se încheie un DPA conform GDPR Art. 28.",
      "",
      "## Art. 9 — Sub-contractare",
      "Furnizorul nu poate sub-contracta fără acordul scris prealabil al Beneficiarului.",
      "",
      "## Art. 10 — Răspundere",
      "Răspunderea fiecărei părți se limitează la daunele directe, previzibile. Forța majoră exonerează de răspundere.",
      "",
      "## Art. 11 — Reziliere",
      "Rezilierea: (a) de drept, în caz de neexecutare substanțială, după notificare de 15 zile; (b) prin acord, cu notificare de 30 zile.",
      "",
      "## Art. 12 — Litigii",
      "Litigiile se rezolvă amiabil. În caz contrar, competența revine instanțelor de la sediul Beneficiarului.",
      "",
      "## Semnături",
      "| Beneficiar | Furnizor |",
      "| --- | --- |",
      "| Reprezentant: _________ | Reprezentant: _________ |",
      "| Data: _________ | Data: _________ |",
      "| Semnătura: _____ | Semnătura: _____ |",
      "",
      reviewWarning,
    ].join("\n"),
    "deletion-attestation": [
      `# ${title}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Organizație:** ${input.orgName}`,
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Informații generale",
      `**Organizația:** ${input.orgName}`,
      "**Data execuției:** _______________",
      "**Executant:** _______________",
      "",
      "## Detalii acțiune",
      `**Sistem/bază de date vizat(ă):** ${input.targetSystem ?? "_______________"}`,
      `**Categorie date personale:** ${input.dataCategory ?? "_______________"}`,
      "**Nr. estimat înregistrări afectate:** _______________",
      "**Metoda aplicată:** ☐ Ștergere definitivă ☐ Anonimizare ☐ Pseudonimizare",
      "**Baza legală:** ☐ Expirare retenție ☐ Cerere persoană vizată ☐ Altă bază: _______",
      "",
      "## Verificare",
      "- [ ] Datele au fost șterse/anonimizate conform procedurii interne",
      "- [ ] Back-up-urile sunt curățate sau programate pentru curățare",
      "- [ ] Procesatorii/sub-procesatorii au fost notificați (dacă aplicabil)",
      "- [ ] Log de execuție sau export de control este atașat",
      "",
      "## Semnături",
      "| Executant | Verificator |",
      "| --- | --- |",
      "| Nume: _________ | Nume: _________ |",
      "| Data: _________ | Data: _________ |",
      "| Semnătura: _____ | Semnătura: _____ |",
      "",
      reviewWarning,
    ].join("\n"),
    "pay-gap-report": [
      `# ${title}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Organizație:** ${input.orgName}`,
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Rezumat executiv",
      "Acest draft rezumă ecartul salarial de gen și recomandările de remediere conform Directivei (UE) 2023/970.",
      "",
      "## Gap general",
      "Completează media salariilor brute și gap-ul calculat pe eșantionul intern validat.",
      "",
      "## Gap pe roluri",
      "Documentează rolurile unde ecartul este material și explică criteriile obiective de remunerare.",
      "",
      "## Recomandări",
      "- revizuire criterii salariale",
      "- documentare metodologie",
      "- traseu de aprobare și publicare internă",
      "",
      reviewWarning,
    ].join("\n"),
    ropa: [
      `# ${title}`,
      "",
      `**${preferredDateLabel}:** ${formattedDate}`,
      `**Organizație:** ${input.orgName}`,
      `**Baza legală:** ${meta.legalBasis}`,
      "",
      `> ${serviceFallbackNote}`,
      "",
      "## Informații despre Operator",
      `**Denumire:** ${input.orgName}`,
      `**CUI:** ${input.orgCui ?? "_______________"}`,
      `**Adresă:** _______________`,
      `**Contact DPO:** ${input.dpoEmail ?? "Nu este desemnat DPO"}`,
      "",
      "## Registru de Prelucrări",
      "",
      "| # | Activitate | Scop | Categorii date | Temei legal | Persoane vizate | Destinatari | Transfer | Retenție | Măsuri |",
      "|---|-----------|------|--------------|-------------|----------------|------------|---------|---------|--------|",
      "| 1 | Facturare clienți | Executarea contractelor | Nume, adresă, CUI, IBAN | Art. 6(1)(b) | Clienți | Contabil, ANAF, Bancă | Nu | 10 ani | Criptare, acces restrict |",
      "| 2 | Newsletter marketing | Informare oferte | Email, nume | Art. 6(1)(a) | Clienți, Lead-uri | Platforma email | DA (SUA-SCC) | Până la retragere | Criptare, double opt-in |",
      "| 3 | Cookies site web | Funcționare site, analiză | IP, cookies | Art. 6(1)(a) | Vizitatori | Analytics | DA (SUA-SCC) | Conform cookie | Anonimizare IP |",
      "| 4 | Relații clienți | Suport | Nume, email, telefon | Art. 6(1)(b) | Clienți | Personal intern | Nu | 5 ani | Acces restrict, log |",
      "",
      "## Legenda",
      "**Temei legal:** Art. 6(1)(a) Consimțământ, (b) Contract, (c) Obligație legală, (f) Interes legitim",
      "**Transfer:** DA/NU, țara dacă e cazul",
      "**Retenție:** Termenul sau criteriul de determinare",
      "**Măsuri:** Descrierea generală a măsurilor de securitate",
      "",
      "## Notă",
      "Completează tabelul cu activitățile specifice organizației tale. Fiecare rând reprezintă o activitate distinctă de prelucrare a datelor personale.",
      "",
      reviewWarning,
    ].join("\n"),
  }

  const content = contentMap[input.documentType]

  const expiry = calculateExpiryDates(input.documentType, now)

  return {
    documentType: input.documentType,
    title,
    content,
    generatedAtISO: now,
    llmUsed: false,
    ...expiry,
  }
}

// ── Main function ─────────────────────────────────────────────────────────────

export async function generateDocument(
  input: DocumentGenerationInput
): Promise<GeneratedDocument> {
  const now = new Date().toISOString()
  const title = getGeneratedDocumentTitle(input)

  // S1.3 — AI ON/OFF toggle per client.
  // Cand cabinet-ul a dezactivat AI pentru acest client (ex: client sensibil),
  // returnam template-ul determinist fara apel la Gemini. `llmUsed: false`
  // ramane vizibil in metadata generated document, deci dosarul stie ca
  // documentul a fost construit doar din sablon.
  if (input.aiEnabled === false) {
    return buildFallbackDocument(input)
  }

  if (!GEMINI_API_KEY) {
    return buildFallbackDocument(input)
  }

  const prompt = buildPrompt(input, now)

  try {
    const response = await fetchWithOperationalGuard(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
        }),
        cache: "no-store",
        timeoutMs: 55_000,
        retries: 2,
        retryDelayMs: 800,
        label: `document-generator:${input.documentType}`,
      }
    )

    if (!response.ok) {
      const text = await response.text()

      if ([408, 429, 500, 502, 503, 504].includes(response.status)) {
        return buildFallbackDocument(input)
      }

      throw new Error(`Gemini API error ${response.status}: ${text.slice(0, 200)}`)
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const content =
      json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() ?? ""

    if (!content) {
      throw new Error("Gemini a returnat un document gol.")
    }

    const normalizedContent = normalizeGeneratedDocumentContent(content, input.documentType, now)

    const expiry = calculateExpiryDates(input.documentType, now)

    return {
      documentType: input.documentType,
      title,
      content: normalizedContent,
      generatedAtISO: now,
      llmUsed: true,
      ...expiry,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (
      message.includes("HTTP_TIMEOUT") ||
      message.includes("Gemini API error 408") ||
      message.includes("Gemini API error 429") ||
      message.includes("Gemini API error 500") ||
      message.includes("Gemini API error 502") ||
      message.includes("Gemini API error 503") ||
      message.includes("Gemini API error 504")
    ) {
      return buildFallbackDocument(input)
    }
    throw error
  }
}

export const DOCUMENT_TYPES: Array<{
  id: DocumentType
  label: string
  description: string
  free: boolean
  legalBasis: string
}> = [
  {
    id: "privacy-policy",
    label: "Politică de Confidențialitate",
    description: "Informează utilizatorii despre prelucrarea datelor personale conform GDPR Art. 13–14.",
    free: true,
    legalBasis: "GDPR Art. 13–14",
  },
  {
    id: "cookie-policy",
    label: "Politică de Cookies",
    description: "Reglementează utilizarea cookie-urilor conform Directivei ePrivacy și GDPR.",
    free: true,
    legalBasis: "Directiva ePrivacy + GDPR",
  },
  {
    id: "dpa",
    label: "Acord de Prelucrare Date (DPA)",
    description: "Contract obligatoriu cu procesatorii de date conform GDPR Art. 28.",
    free: false,
    legalBasis: "GDPR Art. 28",
  },
  {
    id: "retention-policy",
    label: "Politică și Matrice de Retenție",
    description: "Definește termenele de păstrare, regulile de ștergere și dovada operațională conform GDPR Art. 5(1)(e).",
    free: false,
    legalBasis: "GDPR Art. 5(1)(e)",
  },
  {
    id: "nis2-incident-response",
    label: "Plan de Răspuns Incidente NIS2",
    description: "Procedura de răspuns la incidente conform NIS2 și GDPR Art. 33–34.",
    free: false,
    legalBasis: "NIS2 + GDPR Art. 33",
  },
  {
    id: "ai-governance",
    label: "Politică de Guvernanță AI",
    description: "Cadrul de guvernanță pentru sistemele AI conform EU AI Act Art. 9, 17.",
    free: false,
    legalBasis: "EU AI Act Art. 9, 17",
  },
  {
    id: "job-description",
    label: "Fișă de Post",
    description: "Document obligatoriu conform Codului Muncii Art. 17. Definește atribuțiile, competențele și criteriile de evaluare.",
    free: false,
    legalBasis: "Codul Muncii Art. 17, 39",
  },
  {
    id: "hr-internal-procedures",
    label: "Regulament Intern",
    description: "Regulamentul intern obligatoriu conform Codului Muncii Art. 241-246: drepturi, obligații, disciplină, SSM, protecția datelor.",
    free: false,
    legalBasis: "Codul Muncii Art. 241–246",
  },
  {
    id: "reges-correction-brief",
    label: "Brief Corecție REGES/Revisal",
    description: "Protocol de acțiune pentru contabil cu checklist verificare Revisal, termene ITM și consecințe.",
    free: false,
    legalBasis: "HG 905/2017, Codul Muncii Art. 34",
  },
  {
    id: "contract-template",
    label: "Contract-Cadru Prestări Servicii",
    description: "Contract standard B2B cu clauze de confidențialitate, GDPR și protecție proprietate intelectuală.",
    free: false,
    legalBasis: "Codul Civil Art. 1166–1323",
  },
  {
    id: "nda",
    label: "Acord de Confidențialitate (NDA)",
    description: "NDA bilateral cu definiții, excepții, penalități și protecție GDPR — gata de semnat.",
    free: false,
    legalBasis: "Codul Civil Art. 1169–1170",
  },
  {
    id: "supplier-contract",
    label: "Contract-Cadru Furnizor",
    description: "Contract din perspectiva beneficiarului — obligații furnizor, sub-contractare, reziliere, DPA.",
    free: false,
    legalBasis: "Codul Civil Art. 1166–1323",
  },
  {
    id: "deletion-attestation",
    label: "Atestare Ștergere/Anonimizare Date",
    description: "Formular de atestare a execuției ștergerii sau anonimizării datelor personale conform GDPR.",
    free: false,
    legalBasis: "GDPR Art. 5(1)(e), Art. 17",
  },
  {
    id: "ropa",
    label: "Registru de Prelucrări (RoPA)",
    description: "Registru obligatoriu conform GDPR Art. 30 cu toate activitățile de prelucrare a datelor personale.",
    free: true,
    legalBasis: "GDPR Art. 30",
  },
]
