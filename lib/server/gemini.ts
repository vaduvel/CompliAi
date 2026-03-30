const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite"

type GeminiContext = {
  score: number
  riskLabel: string
  alerts: number
  redAlerts: number
  highRisk: number
  gdprProgress: number
  syncedAt: string
  lastFindings: Array<{
    title: string
    detail: string
    legalReference?: string
    ruleId?: string
    excerpt?: string
  }>
}

export async function generateComplianceAnswer(
  userMessage: string,
  context: GeminiContext
) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY lipsă.")
  }

  const systemInstruction = [
    "Ești agent AI pentru CompliScan.ro (România).",
    "Domeniu permis: EU AI Act, GDPR, e-Factura și pași practici operaționali de conformitate.",
    "Interzis: sfaturi juridice finale, promisiuni de conformitate totală.",
    "Nu folosi niciodată expresia '100% compliant'.",
    "Folosește formularea 'recomandare AI' doar când chiar propui un pas următor.",
    "Nu repeta aceeași propoziție sub titluri diferite.",
    "Dacă ai context despre finding-uri, fii specific: spune ce s-a detectat, de ce contează, unde apare și ce trebuie făcut concret acum.",
    "Când există excerpt sau ruleId, citează-le scurt.",
    "Răspunde în română, clar, scurt și orientat pe acțiuni, în 4 secțiuni: 'Ce am detectat', 'De ce contează', 'Ce verifici acum', 'Remediere concretă'.",
    "Păstrează disclaimerul legal o singură dată, scurt, la final: 'Verifică uman înainte de decizii oficiale.'",
  ].join(" ")

  const contextualData = [
    `Scor de risc curent: ${context.score}% (${context.riskLabel}).`,
    `Alerte active: ${context.alerts} (roșii: ${context.redAlerts}).`,
    `Fluxuri high-risk: ${context.highRisk}.`,
    `GDPR checklist: ${context.gdprProgress}%.`,
    `e-Factura sincronizat: ${formatSyncLabel(context.syncedAt)}.`,
    `Constatări recente:\n${
      context.lastFindings.length > 0
        ? context.lastFindings
            .map(
              (finding, index) =>
                `${index + 1}. ${finding.title} | regulă: ${finding.ruleId ?? "n/a"} | lege: ${finding.legalReference ?? "n/a"} | excerpt: ${finding.excerpt ?? finding.detail}`
            )
            .join("\n")
        : "n/a"
    }`,
  ].join("\n")

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemInstruction}\n\nContext:\n${contextualData}\n\nÎntrebarea utilizatorului:\n${userMessage}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.9,
      maxOutputTokens: 500,
    },
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${text}`)
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }

  const text =
    json.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? ""

  if (!text) {
    throw new Error("Gemini a răspuns gol.")
  }

  return text
}

export async function classifyCompanySector(params: {
  companyName: string
  caenDescription: string | null
  websiteContent?: string
}): Promise<{ sector: OrgSector; confidence: "high" | "medium"; reason: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY lipsă.")
  }

  const sectors = [
    "energy", "transport", "banking", "health", "digital-infrastructure",
    "public-admin", "finance", "retail", "manufacturing", "professional-services", "other"
  ]

  const prompt = `
    Ești un expert în clasificarea companiilor din România pentru conformitate legală (NIS2, GDPR, e-Factura).
    Analizează datele de mai jos și alege cel mai potrivit SECTOR din această listă: [${sectors.join(", ")}].

    Date firmă:
    - Nume: "${params.companyName}"
    - Descriere CAEN: "${params.caenDescription ?? "n/a"}"
    ${params.websiteContent ? `- Conținut Site: "${params.websiteContent.slice(0, 1000)}"` : ""}

    Reguli de clasificare:
    - "digital-infrastructure": software, IT, cloud, data centers, telecom.
    - "energy": petrol, gaze, electricitate, utilități.
    - "transport": logistică, curierat, transport marfă/pasageri.
    - "health": clinici, farmacii, spitale, producție med.
    - "manufacturing": fabrici, producție bunuri, construcții mari.
    - "professional-services": contabilitate, avocatură, consultanță, arhitectură, servicii pt firme.
    - "retail": magazine, comerț online, showroom-uri.
    - "banking" / "finance": bănci, IFN, asigurări, brokeri.

    Răspunde DOAR cu un obiect JSON valid:
    {
      "sector": "un_singur_id_din_lista",
      "confidence": "high" | "medium",
      "reason": "o explicatie scurtă în română"
    }
  `

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) return { sector: "other", confidence: "medium", reason: "Eroare AI la clasificare" }

  const json = await response.json()
  try {
    const result = JSON.parse(json.candidates[0].content.parts[0].text)
    return {
      sector: sectors.includes(result.sector) ? result.sector : "other",
      confidence: result.confidence ?? "medium",
      reason: result.reason ?? "Identificat prin analiză semantică AI."
    }
  } catch {
    return { sector: "other", confidence: "medium", reason: "Nu am putut parsa răspunsul AI" }
  }
}

import type { OrgSector } from "@/lib/compliance/applicability"

function formatSyncLabel(iso: string) {
  if (!iso) return "neefectuat"

  const timestamp = new Date(iso).getTime()
  if (!Number.isFinite(timestamp)) return "neefectuat"

  return new Date(iso).toLocaleString("ro-RO")
}
