// LLM-powered compliance document generator.
// Generates: Privacy Policy, Cookie Policy, DPA, NIS2 Incident Response Plan, AI Governance Policy.
// Uses Gemini API. Falls back to a static skeleton when GEMINI_API_KEY is absent.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite"

export type DocumentType =
  | "privacy-policy"
  | "cookie-policy"
  | "dpa"
  | "nis2-incident-response"
  | "ai-governance"

export type DocumentGenerationInput = {
  documentType: DocumentType
  orgName: string
  orgWebsite?: string
  orgSector?: string
  orgCui?: string
  dpoEmail?: string
  /** Short description of main data flows / services */
  dataFlows?: string
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
  "dpa": 12,
  "nis2-incident-response": 12,
  "ai-governance": 24,
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
  "nis2-incident-response": {
    title: "Plan de Răspuns la Incidente de Securitate (NIS2)",
    legalBasis: "Directiva NIS2 (UE 2022/2555) + GDPR Art. 33–34",
  },
  "ai-governance": {
    title: "Politică de Guvernanță AI",
    legalBasis: "EU AI Act (Regulamentul UE 2024/1689) Art. 9, 17",
  },
}

// ── Prompts ───────────────────────────────────────────────────────────────────

function buildPrompt(input: DocumentGenerationInput): string {
  const meta = DOC_META[input.documentType]
  const orgLine = `Organizație: ${input.orgName}${input.orgCui ? ` (CUI: ${input.orgCui})` : ""}${input.orgWebsite ? `, website: ${input.orgWebsite}` : ""}${input.orgSector ? `, sector: ${input.orgSector}` : ""}.`
  const dpoLine = input.dpoEmail ? `Responsabil protecția datelor (DPO): ${input.dpoEmail}.` : ""
  const flowsLine = input.dataFlows ? `Fluxuri de date / servicii principale: ${input.dataFlows}.` : ""

  const contextBlock = [orgLine, dpoLine, flowsLine].filter(Boolean).join("\n")

  const prompts: Record<DocumentType, string> = {
    "privacy-policy": `
Generează o Politică de Confidențialitate completă în română pentru organizația de mai jos.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}

Cerințe:
- Structură conformă GDPR Art. 13 + Art. 14 (toate punctele obligatorii)
- Categorii de date colectate, scopul prelucrării, temeiul juridic, durata păstrării
- Drepturile persoanelor vizate (acces, rectificare, ștergere, portabilitate, opoziție)
- Transferuri internaționale (dacă e cazul)
- Date de contact DPO sau persoană responsabilă
- Clauza de actualizare
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
- Categorii de cookies: strict necesare, funcționale, analitice, de marketing
- Durata de valabilitate pentru fiecare categorie
- Parteneri terți (ex. Google Analytics, Facebook Pixel — dacă e relevant din context)
- Cum poate utilizatorul să gestioneze/retragă consimțământul
- Link spre Politica de Confidențialitate
- Format Markdown cu titluri clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    dpa: `
Generează un Acord de Prelucrare a Datelor (DPA) complet în română conform GDPR Art. 28.
Baza legală: ${meta.legalBasis}.

Context (Operator de date):
${contextBlock}

Cerințe:
- Denumire contract, operator și procesator (folosim [PROCESATOR] ca placeholder)
- Obiectul prelucrării: categorii de date, scopul, durata
- Obligațiile procesatorului (Art. 28.3 a-h GDPR): confidențialitate, securitate, subcontractare, audit, ștergere
- Obligațiile operatorului
- Sub-procesatori: clauze și notificare prealabilă
- Drepturile persoanelor vizate — asistare
- Notificare breșe de date (fără întârziere nejustificată)
- Transferuri internaționale — clauze contractuale standard
- Durata și rezilierea acordului
- Format Markdown cu titluri clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
    "nis2-incident-response": `
Generează un Plan de Răspuns la Incidente de Securitate în română conform NIS2 și GDPR.
Baza legală: ${meta.legalBasis}.

Context:
${contextBlock}

Cerințe:
- Scopul și domeniul de aplicare
- Clasificarea incidentelor (P1/P2/P3 cu criterii clare)
- Echipa de răspuns: roluri și responsabilități
- Pași detaliați: Detectare → Evaluare → Conținere → Eradicare → Recuperare → Post-mortem
- Timeline-uri NIS2: alerta timpurie 24h, raport complet 72h, raport final 30 zile
- Timeline-uri GDPR: notificare ANSPDCP 72h, notificare persoane vizate dacă e cazul
- Template de raport incident (câmpuri de completat)
- Canale de escaladare și comunicare
- Lista contacte externe: DNSC, ANSPDCP, CERT-RO
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
- Clasificarea sistemelor AI utilizate (risc minim / limitat / ridicat / inacceptabil)
- Obligații pentru sisteme de risc ridicat: sistem de management al riscului, date de antrenament, documentație tehnică, logare, transparență, supraveghere umană
- Obligații de transparență pentru sisteme limitate (chatbots etc.)
- Procesul de evaluare conformitate înainte de deployment
- Roluri: AI Officer, responsabil conformitate, utilizatori
- Post-market monitoring: cum se urmăresc incidentele AI
- Registrul sistemelor AI (trimitere spre inventarul CompliScan)
- Politica de utilizare acceptabilă a AI generativ intern
- Format Markdown cu titluri clare
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
`,
  }

  return `Ești un expert juridic în conformitate europeană pentru companii românești.\n${prompts[input.documentType].trim()}`
}

// ── Static fallback skeleton ──────────────────────────────────────────────────

function buildFallbackDocument(input: DocumentGenerationInput): GeneratedDocument {
  const meta = DOC_META[input.documentType]
  const now = new Date().toISOString()

  const content = [
    `# ${meta.title}`,
    ``,
    `**Organizație:** ${input.orgName}`,
    `**Data generării:** ${new Date(now).toLocaleDateString("ro-RO")}`,
    `**Baza legală:** ${meta.legalBasis}`,
    ``,
    `---`,
    ``,
    `> ⚠️ **Generare AI indisponibilă.** Configurează \`GEMINI_API_KEY\` pentru a genera documentul complet.`,
    `> Aceasta este o schiță cu structura documentului care trebuie completată manual.`,
    ``,
    `## Structura documentului`,
    ``,
    `1. [ ] Completează secțiunea 1`,
    `2. [ ] Completează secțiunea 2`,
    `3. [ ] Verifică cu un specialist înainte de utilizare`,
    ``,
    `---`,
    ``,
    `⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială.`,
  ].join("\n")

  const expiry = calculateExpiryDates(input.documentType, now)

  return {
    documentType: input.documentType,
    title: meta.title,
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
  const meta = DOC_META[input.documentType]
  const now = new Date().toISOString()

  if (!GEMINI_API_KEY) {
    return buildFallbackDocument(input)
  }

  const prompt = buildPrompt(input)

  const response = await fetch(
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
    }
  )

  if (!response.ok) {
    const text = await response.text()
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

  const expiry = calculateExpiryDates(input.documentType, now)

  return {
    documentType: input.documentType,
    title: meta.title,
    content,
    generatedAtISO: now,
    llmUsed: true,
    ...expiry,
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
]
