CompliScan — Automation Layer: Super Prompt de Implementare
Versiunea Finală — Combinat din toate documentele
Pentru Claude Code / Codex / Cursor / Windsurf
Citește TOT documentul înainte să scrii orice linie de cod.

CE ESTE COMPLISCAN ȘI CE NU ESTE
CompliScan ESTE:

un compliance operations system
un intake + scan + gap analysis + remediation + evidence + output system
un produs care reduce drastic munca repetitivă a consultantului / DPO-ului
un produs cu human-in-the-loop obligatoriu
un produs care pregătește cazul pentru validare și audit

CompliScan NU ESTE:

avocat automat
opinie juridică finală
certificare automată
garant de conformitate
înlocuitor total pentru specialist în cazurile sensibile
motor care auto-decide orice fără praguri și guardrails

Formula corectă:

CompliScan automatizează pregătirea, trierea, remedierea și dovada.
Specialistul rămâne pe excepții, risc fin și asumare finală.


PRINCIPIILE CARE GUVERNEAZĂ TOT CODUL
P1 — Prefill, nu verdict final
CUI / CAEN / documente / vendori = context și probabilitate, nu adevăr juridic final.
Orice valoare inferată este marcată explicit ca: suggested / candidate / likely.
Userul confirmă sau corectează. Niciodată nu pornim de la zero, dar niciodată nu impunem.
P2 — Human gates obligatorii per nivel de risc
low-risk + high-confidence (>90%)  → auto-apply permis, logat complet
medium-risk                         → draft + confirmare business
high-risk / legal-sensitive         → specialist validation obligatoriu
P3 — Lanțul obligatoriu: Fact → Law → Gap → Action → Evidence
Nicio funcționalitate nu sare peste acest lanț.
Finding fără sursă = invalid. Task fără finding = invalid. Close fără evidence = invalid.
P4 — Nu introducem magie
Nu promitem intern "95% prefill" sau "100% automat" până nu avem date reale.
Folosim limbaj corect în UI și logs:

suggested — propus de sistem, neconfirmat
candidate — probabil relevant, necesită verificare
likely — inferență cu confidence mare
confirmed — validat de user
requires review — sistemul nu e sigur

P5 — Auditabilitate peste tot
Orice auto-acțiune are obligatoriu:

source — de unde vine decizia
confidence — cât de sigur e sistemul
timestamp — când s-a întâmplat
reason — de ce s-a decis asta
userOverride — dacă userul a modificat
log entry în operational-logger.ts

P6 — Nu reconstruim produsul
Nu schimbăm stack-ul și nu rescriem ce există.
Construim deasupra modulelor existente.
Keyword matching rămâne ca fallback pentru Gemini.
P7 — Main path-ul rămâne simplu
Orice automatizare nouă trebuie să servească acest drum și nimic altceva:
Dashboard → Intake → Scan → Findings → Remediere → Evidence → Output → Revalidare
Dacă o automatizare nu întărește acest drum → nu intră în nucleu.

CE EȘTI TU (pentru Claude Code / Codex)
Ești un inginer senior full-stack care adaugă un strat de automatizare
peste un SaaS de compliance existent în Next.js App Router + TypeScript.
Reguli absolute — nu le încalcă niciodată:

NU rescrii nimic existent
NU schimbi API routes existente
NU modifici schema Supabase fără instrucțiuni explicite
NU trimiți automat acte oficiale la autorități
NU promiți închidere legală automată
NU auto-închizi finding-uri critice sau high-risk
ADAUGI module noi și CONECTEZI ce există dar nu e conectat
PĂSTREZI keyword matching ca fallback pentru Gemini


STACK TEHNIC (confirmat 2026)

Next.js App Router (TypeScript)
Supabase (PostgreSQL + Storage + Auth + RLS)
Resend (email)
Google Vision API (OCR — deja integrat)
Gemini API Flash + Pro (în lib/gemini.ts — deja integrat)
Vercel (cron jobs în vercel.json)
lib/http-client.ts existent — folosește-l pentru TOATE cererile externe


FIȘIERE EXISTENTE — NU ATINGI
lib/gemini.ts
lib/http-client.ts
lib/compliance/rule-library.ts
lib/compliance/llm-scan-analysis.ts
lib/compliance/efactura-validator.ts
lib/compliance/nis2-rules.ts
lib/compliance/dnsc-wizard.ts
lib/compliance/dnsc-report.ts
lib/compliance/document-generator.ts
lib/compliance/task-validation.ts
lib/compliance/audit-quality-gates.ts
lib/compliance/ai-act-timeline.ts
lib/agents/agent-regulatory-radar.ts
lib/agents/agent-vendor-risk.ts
lib/agents/agent-document.ts
lib/agents/agent-compliance-monitor.ts
lib/agents/agent-rail-fiscal-sensor.ts
email/email-alerts.ts
email/weekly-digest.ts
email/onboarding-emails.ts
app/api/scan/route.ts
app/api/nis2/vendors/import-efactura/route.ts
app/api/nis2/incidents/route.ts
app/api/nis2/assessment/route.ts
app/api/nis2/dnsc-status/route.ts
app/api/agent/run/route.ts
app/api/cron/agent-orchestrator/route.ts
app/api/cron/weekly-digest/route.ts
app/api/exports/audit-pack/route.ts
app/api/inspector/route.ts
app/api/findings/route.ts
app/api/notifications/route.ts
app/api/alerts/notify/route.ts

MIGRĂRI SUPABASE — RULEAZĂ ÎNAINTE DE ORICE
sql-- Score snapshots zilnice
CREATE TABLE IF NOT EXISTS score_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id text NOT NULL,
  date date NOT NULL,
  score integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, date)
);
CREATE INDEX idx_score_snapshots_org_date
  ON score_snapshots(org_id, date DESC);

-- Hashes pentru monitorizare legislație
CREATE TABLE IF NOT EXISTS legislation_hashes (
  url text PRIMARY KEY,
  hash text NOT NULL,
  last_checked timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tokens ANAF OAuth2 (doar pentru Faza F — implementează ultimul)
CREATE TABLE IF NOT EXISTS anaf_tokens (
  org_id text PRIMARY KEY,
  access_token text,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE anaf_tokens ENABLE ROW LEVEL SECURITY;


FAZA A — INTAKE & APPLICABILITY CORE
Scop: Reduce masiv fricțiunea inițială, crește calitatea contextului firmei

A1 — ANAF CUI Unified Input + NIS2 Classifier
Ce face

Un singur câmp CUI/CIF în onboarding
La blur/enter: fetch ANAF → auto-completează profil firmă
Din CAEN: clasificare automată sector și obligații NIS2
Toate valorile marcate ca suggested — userul confirmă

Fișier nou: lib/anaf-cui-client.ts
typescriptimport { httpClient } from '@/lib/http-client' // folosești ce există

const ANAF_BASE = 'https://webserviced.anaf.ro/SPVWS2/rest/cerere'
const ANAF_FALLBACK = 'https://webservicesp.anaf.ro/SPVWS2/rest/cerere'

export interface ANAFFirmaData {
  cui: string
  nume: string
  adresa: string
  judet: string
  localitate: string
  codCaen: string
  tvaPlatitor: boolean
  activa: boolean
  dataInregistrare: string
}

export async function fetchFirmaByCUI(cui: string): Promise<ANAFFirmaData | null> {
  const cuiCurat = cui.replace(/^RO/i, '').replace(/\s/g, '').trim()
  if (!cuiCurat || isNaN(Number(cuiCurat))) return null

  const url = `${ANAF_BASE}?tip=DATE IDENTIFICARE&cui=${cuiCurat}`

  try {
    // Folosești http-client.ts existent pentru retry automat
    const data = await httpClient.get(url, {
      next: { revalidate: 3600 }, // cache 1 ora
    })

    if (!data || data.cod !== 200) {
      // Fallback la endpoint alternativ
      const fallbackData = await httpClient.get(
        `${ANAF_FALLBACK}?tip=DATE IDENTIFICARE&cui=${cuiCurat}`
      )
      if (!fallbackData?.found?.[0]) return null
      return mapANAFResponse(cuiCurat, fallbackData.found[0])
    }

    const firma = data.found?.[0]
    if (!firma) return null
    return mapANAFResponse(cuiCurat, firma)
  } catch {
    return null
  }
}

function mapANAFResponse(cui: string, firma: any): ANAFFirmaData {
  return {
    cui,
    nume: firma.denumire ?? '',
    adresa: firma.adresa ?? '',
    judet: firma.judet ?? '',
    localitate: firma.localitate ?? '',
    codCaen: firma.cod_caen ?? '',
    tvaPlatitor: firma.tva_platitor === true,
    activa: firma.stare_inregistrare === 'INREGISTRAT',
    dataInregistrare: firma.data_inregistrare ?? '',
  }
}

// Clasificare NIS2 din CAEN — returnează candidate, nu verdict final
export function clasificareSectorNIS2(codCaen: string): {
  nis2Candidat: boolean
  tipEntitate: 'esentiala' | 'importanta' | 'niciuna'
  sector: string
  confidence: 'high' | 'medium' | 'low'
} {
  const prefix2 = codCaen.substring(0, 2)
  const prefix4 = codCaen.substring(0, 4)

  // Sectoare esențiale NIS2 (Directiva 2022/2555 + transpunere RO)
  const esentialMap: Record<string, string> = {
    '35': 'Energie', '36': 'Energie',
    '49': 'Transport', '50': 'Transport', '51': 'Transport', '52': 'Transport',
    '61': 'Infrastructura digitala', '62': 'Infrastructura digitala', '63': 'Infrastructura digitala',
    '64': 'Servicii financiare', '65': 'Servicii financiare', '66': 'Servicii financiare',
    '86': 'Sanatate', '87': 'Sanatate', '88': 'Sanatate',
  }

  // Sectoare importante NIS2
  const importantMap: Record<string, string> = {
    '10': 'Alimentar', '11': 'Alimentar',
    '20': 'Chimic', '21': 'Farmaceutic',
    '26': 'Echipamente digitale', '27': 'Echipamente digitale', '28': 'Echipamente digitale',
    '29': 'Automotive', '72': 'Cercetare', '84': 'Administratie publica',
  }

  // CAEN-uri IT specifice
  const caenIT = ['6201', '6202', '6203', '6209', '6311', '6312', '6391', '6399']
  if (caenIT.includes(prefix4)) {
    return { nis2Candidat: true, tipEntitate: 'importanta', sector: 'IT si software', confidence: 'high' }
  }

  if (esentialMap[prefix2]) {
    return { nis2Candidat: true, tipEntitate: 'esentiala', sector: esentialMap[prefix2], confidence: 'high' }
  }

  if (importantMap[prefix2]) {
    return { nis2Candidat: true, tipEntitate: 'importanta', sector: importantMap[prefix2], confidence: 'medium' }
  }

  return { nis2Candidat: false, tipEntitate: 'niciuna', sector: 'Alt sector', confidence: 'low' }
}
API route nou: app/api/org/cui-lookup/route.ts
typescriptimport { NextRequest, NextResponse } from 'next/server'
import { fetchFirmaByCUI, clasificareSectorNIS2 } from '@/lib/anaf-cui-client'

export async function GET(req: NextRequest) {
  const cui = req.nextUrl.searchParams.get('cui')
  if (!cui) return NextResponse.json({ error: 'CUI lipsă' }, { status: 400 })

  const firma = await fetchFirmaByCUI(cui)
  if (!firma) return NextResponse.json({ error: 'CUI negăsit în ANAF' }, { status: 404 })

  const nis2 = clasificareSectorNIS2(firma.codCaen)

  // Marcăm explicit că sunt valori sugerate, nu confirmate
  return NextResponse.json({
    firma,
    nis2,
    meta: {
      source: 'anaf-public-api',
      status: 'suggested', // userul trebuie să confirme
      timestamp: new Date().toISOString(),
    }
  })
}
Modificare UI în ApplicabilityWizard
typescript// In ApplicabilityWizard.tsx, la câmpul CUI:
// - La onBlur: fetch /api/org/cui-lookup?cui=XXX
// - Dacă success: auto-fill cu badge "✓ Sugerat din ANAF — confirmă"
// - Câmpurile rămân editabile
// - Dacă ANAF nu răspunde: câmpurile rămân goale, nu blochezi flow-ul
// - Afișezi spinner mic în câmp în timpul fetch-ului
Test A1
1. Mergi la onboarding
2. Scrie CUI: 40355364
3. Verifici: denumire, adresă, județ auto-completate cu badge "Sugerat din ANAF"
4. Verifici că poți modifica manual orice câmp
5. Verifici că CAEN determină automat sectorul NIS2

A2 — Adaptive Intake (maximum 7 întrebări)
Principiu
Întrebăm doar ce schimbă findings / document requests / next best action.
Niciodată nu pornim de la câmp gol dacă avem context din CUI/CAEN.
Reguli de supresie întrebări
typescript// lib/compliance/adaptive-intake.ts (FIȘIER NOU)

export function buildAdaptiveIntakeQuestions(
  orgContext: {
    codCaen: string
    numarAngajati: number
    nis2Candidat: boolean
    tipEntitate: string
  }
): IntakeQuestion[] {

  const questions: IntakeQuestion[] = []

  // Întrebare 1 — MEREU (confirmare sector)
  questions.push({
    id: 'sector_confirm',
    text: 'Activitatea principală a firmei este corect identificată?',
    type: 'confirm',
    suggested: orgContext.codCaen,
    required: true,
  })

  // Întrebare 2 — Doar dacă CAEN nu clasifică clar NIS2
  if (orgContext.nis2Candidat === false) {
    questions.push({
      id: 'nis2_manual',
      text: 'Firma furnizează servicii critice (IT, energie, transport, sănătate)?',
      type: 'yes_no',
      required: true,
    })
  }

  // Întrebare 3 — Doar dacă >10 angajați (prag GDPR DPO)
  if (orgContext.numarAngajati > 10) {
    questions.push({
      id: 'dpo_exists',
      text: 'Există un responsabil cu protecția datelor (DPO) desemnat?',
      type: 'yes_no',
      suggested: null,
    })
  }

  // Întrebare 4 — Doar dacă sector IT sau CAEN 62xx
  if (orgContext.codCaen.startsWith('62') || orgContext.codCaen.startsWith('63')) {
    questions.push({
      id: 'ai_systems',
      text: 'Firma folosește sisteme AI în activitatea sa (ChatGPT, Copilot, etc.)?',
      type: 'yes_no',
      suggested: 'yes', // sectorul IT sugerează da
    })
  }

  // Maxim 7 întrebări totale
  return questions.slice(0, 7)
}

A3 — Score Snapshot + Alertă Scor Scăzut
Fișier nou: lib/score-snapshot.ts
typescriptimport { createClient } from '@/lib/supabase/server'

export async function saveScoreSnapshot(orgId: string, score: number) {
  const supabase = createClient()
  const azi = new Date().toISOString().split('T')[0]

  await supabase
    .from('score_snapshots')
    .upsert({ org_id: orgId, date: azi, score }, { onConflict: 'org_id,date' })
}

export async function getScoreDelta(orgId: string): Promise<{
  scoreAzi: number | null
  scoreIeri: number | null
  delta: number | null
  ascazut: boolean
}> {
  const supabase = createClient()
  const azi = new Date()
  const ieri = new Date(azi)
  ieri.setDate(ieri.getDate() - 1)

  const { data } = await supabase
    .from('score_snapshots')
    .select('date, score')
    .eq('org_id', orgId)
    .in('date', [
      azi.toISOString().split('T')[0],
      ieri.toISOString().split('T')[0],
    ])
    .order('date', { ascending: false })

  if (!data || data.length === 0) {
    return { scoreAzi: null, scoreIeri: null, delta: null, ascazut: false }
  }

  const scoreAzi = data.find(
    d => d.date === azi.toISOString().split('T')[0]
  )?.score ?? null

  const scoreIeri = data.find(
    d => d.date === ieri.toISOString().split('T')[0]
  )?.score ?? null

  const delta = scoreAzi !== null && scoreIeri !== null
    ? scoreAzi - scoreIeri
    : null

  return {
    scoreAzi,
    scoreIeri,
    delta,
    ascazut: delta !== null && delta < 0,
  }
}
API route nou: app/api/cron/score-snapshot/route.ts
typescriptimport { NextRequest, NextResponse } from 'next/server'
import { saveScoreSnapshot, getScoreDelta } from '@/lib/score-snapshot'
import { getAllOrgs } from '@/lib/org-utils'
import { sendScoreAlert } from '@/email/email-alerts'

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orgs = await getAllOrgs()

  for (const org of orgs) {
    try {
      const score = await calculateOrgScore(org.id) // funcție existentă
      await saveScoreSnapshot(org.id, score)

      const { ascazut, delta, scoreIeri } = await getScoreDelta(org.id)

      // Alertă doar dacă scorul a scăzut cu cel puțin 3 puncte
      if (ascazut && delta !== null && delta <= -3) {
        await sendScoreAlert({
          orgId: org.id,
          orgName: org.name,
          ownerEmail: org.ownerEmail,
          scoreAzi: score,
          scoreIeri: scoreIeri!,
          delta,
        })
      }
    } catch (err) {
      console.error(`Score snapshot failed for org ${org.id}:`, err)
    }
  }

  return NextResponse.json({ ok: true })
}
Adaugă în email/email-alerts.ts
typescriptexport async function sendScoreAlert({ orgId, orgName, ownerEmail, scoreAzi, scoreIeri, delta }: {
  orgId: string; orgName: string; ownerEmail: string
  scoreAzi: number; scoreIeri: number; delta: number
}) {
  await resend.emails.send({
    from: 'CompliScan <alerte@compliscan.ro>',
    to: ownerEmail,
    subject: `⚠ Scorul tău a scăzut: ${scoreIeri} → ${scoreAzi}`,
    html: `
      <p>Scorul de conformitate al <strong>${orgName}</strong> a scăzut cu
      <strong>${Math.abs(delta)} puncte</strong> față de ieri.</p>
      <p>Cel mai probabil: finding nou nerezolvat sau document expirat.</p>
      <a href="${process.env.NEXT_PUBLIC_URL}/dashboard/resolve"
         style="background:#34D399;color:#111;padding:10px 20px;
                border-radius:8px;text-decoration:none;font-weight:600">
        Vezi ce s-a schimbat →
      </a>
    `,
  })
}

A4 — Email Zilnic Condițional (Anti-Spam)
Regula de aur: nu trimite dacă nu e nimic nou
typescript// app/api/cron/daily-digest/route.ts (FIȘIER NOU)
import { NextRequest, NextResponse } from 'next/server'
import { getScoreDelta } from '@/lib/score-snapshot'
import { getAllOrgs } from '@/lib/org-utils'
import { resend } from '@/lib/resend'

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orgs = await getAllOrgs()
  let trimise = 0, sarite = 0

  for (const org of orgs) {
    const state = await getOrgState(org.id)
    const { scoreAzi, delta } = await getScoreDelta(org.id)

    // Findings noi din ultimele 24h
    const findingNoi = state.findings?.filter(f => {
      const creat = new Date(f.createdAt)
      return creat > new Date(Date.now() - 24 * 60 * 60 * 1000)
    }).length ?? 0

    // Deadlines în 7 zile
    const deadlineUrgente = getDeadlinesIn7Days(state)

    // REGULA ANTI-SPAM: nu trimite dacă nu e nimic nou
    const existaCevaNou = (
      (delta !== null && delta <= -3) ||
      findingNoi > 0 ||
      deadlineUrgente.length > 0
    )

    if (!existaCevaNou) { sarite++; continue }

    await resend.emails.send({
      from: 'CompliScan <digest@compliscan.ro>',
      to: org.ownerEmail,
      subject: `CompliScan · Scor ${scoreAzi}${delta && delta < 0 ? ` ↓${Math.abs(delta)}` : ''} · ${new Date().toLocaleDateString('ro-RO')}`,
      html: buildDailyEmailHtml(org.name, { scoreAzi: scoreAzi ?? 0, delta, findingNoi, deadlineUrgente }),
    })

    trimise++
  }

  return NextResponse.json({ trimise, sarite })
}

A5 — Cron Audit Pack Lunar + Inspector Mode Săptămânal
typescript// app/api/cron/audit-pack-monthly/route.ts (FIȘIER NOU)
// Doar pentru orgs cu plan Pro sau Partner
// Folosești generateAuditPack() existent + email cu link download

// app/api/cron/inspector-weekly/route.ts (FIȘIER NOU)
// Rulezi runInspectorMode() existent
// Trimiți email doar dacă verdict !== 'ready'
// Conținut: verdict + critical gaps + link /dashboard/resolve

A6 — Timer Incident Alertă la 50% și 80%
typescript// Adaugă în agent-orchestrator.ts existent, în bucla per org:

async function checkIncidentTimers(orgId: string, incidents: any[]) {
  for (const incident of incidents) {
    if (['resolved', 'closed'].includes(incident.status)) continue

    const slaOre = incident.severity === 'critical' ? 24 : 72
    const oreScurse = (Date.now() - new Date(incident.createdAt).getTime()) / 3_600_000
    const procent = (oreScurse / slaOre) * 100

    if (procent >= 50 && procent < 55 && !incident.alert50Sent) {
      await sendIncidentUrgentAlert(orgId, incident, 50, slaOre - oreScurse)
      await markAlertSent(orgId, incident.id, '50')
    }

    if (procent >= 80 && procent < 85 && !incident.alert80Sent) {
      await sendIncidentUrgentAlert(orgId, incident, 80, slaOre - oreScurse)
      await markAlertSent(orgId, incident.id, '80')
    }
  }
}


FAZA B — SEMANTIC SCAN ENGINE 2.0
Scop: De la scanare utilă la scanare operațională

B1 — Gemini ca Engine Principal (înlocuiește keyword matching ca primar)
Principiu de implementare
Gemini devine engine primar. Keyword matching rămâne fallback.
Fiecare finding generat are confidenceScore obligatoriu.
Findings cu confidence < 80 → afișate cu overlay "Necesită revizuire umană".
Modificare în lib/compliance/llm-scan-analysis.ts
typescript// Extinzi funcția principală de analiză cu aceste prompts specializate

const PROMPTS = {
  GDPR: `
    Ești un expert GDPR cu 10 ani experiență în drept european.
    Analizează textul și identifică problemele de conformitate GDPR.

    Pentru fiecare problemă returnează JSON:
    {
      "title": "titlul problemei în română",
      "description": "descriere clară",
      "article": "articolul GDPR (ex: Art. 28)",
      "severity": "critical | high | medium | low",
      "confidence": număr 0-100,
      "reasoning": "de ce ai identificat această problemă",
      "sourceParagraph": "fragmentul exact din text",
      "recommendation": "ce trebuie făcut concret",
      "suggestedDocumentType": "dpa | privacy-policy | cookie-policy | null",
      "requiresHumanReview": true dacă confidence < 80 sau severity critical
    }

    Returnează DOAR array JSON valid, fără text suplimentar.
    Dacă nu există probleme returnează [].

    Text:
  `,

  NIS2: `
    Ești expert NIS2 (Directiva 2022/2555) și securitate cibernetică.
    Verifică în special: politici securitate, incident response, gestiunea riscurilor,
    criptografie, continuitate activitate, securitate furnizori.

    Returnează același format JSON ca mai sus.
    Câmpul "article" = articolul NIS2 (ex: Art. 21(2)(a)).

    Text:
  `,

  AI_ACT: `
    Ești expert EU AI Act (Regulamentul 2024/1689).
    Identifică: sisteme AI nedeclarate, potențial high-risk, lipsă transparență,
    lipsă human oversight documentat.

    Returnează același format JSON.
    Câmpul "article" = articolul AI Act relevant.

    Text:
  `,

  EFACTURA: `
    Ești expert e-Factura și fiscalitate română.
    Verifică: structura UBL CIUS-RO, câmpuri obligatorii, CUI/CIF, TVA, termene.

    Returnează același format JSON.

    Text:
  `,
}

export async function analyzeWithGemini(
  text: string,
  frameworks: string[]
): Promise<Finding[]> {
  const allFindings: Finding[] = []

  for (const framework of frameworks) {
    const prompt = PROMPTS[framework as keyof typeof PROMPTS]
    if (!prompt) continue

    try {
      const response = await gemini.generateContent(prompt + text)
      const raw = response.response.text()
      const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(clean) as any[]

      for (const f of parsed) {
        allFindings.push({
          ...f,
          framework,
          source: 'gemini-semantic',
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        })
      }
    } catch (err) {
      console.error(`Gemini analysis failed for ${framework}, falling back to keyword matching`)
      // Fallback la keyword matching existent — nu bloca flow-ul
    }
  }

  return deduplicateFindings(allFindings)
}
Modificare în app/api/scan/route.ts
typescript// După OCR/extract, înlocuiești ordinea:
// 1. Gemini (primar)
const geminiFindings = await analyzeWithGemini(extractedText, activeFrameworks)

// 2. Keyword matching (fallback/complement pentru ce Gemini a ratat)
const keywordFindings = detectComplianceSignals(extractedText, rules)

// 3. Merge cu prioritate Gemini
const finalFindings = mergeAndDeduplicateFindings(geminiFindings, keywordFindings)

B2 — Finding → Task → Evidence Linkage Automat
Principiu
Orice finding confirmat produce automat:

task candidate (marcat suggested)
owner candidate (bazat pe tip finding)
evidence expectation (ce dovadă se așteaptă)
document trigger (dacă se aplică)

Fișier nou: lib/finding-to-task-mapper.ts
typescriptexport function mapFindingToTask(finding: Finding, orgContext: OrgContext): TaskCandidate {
  const ownerMap: Record<string, string> = {
    'GDPR': 'DPO / Responsabil conformitate',
    'NIS2': 'CISO / Responsabil securitate',
    'AI_ACT': 'CTO / Manager AI',
    'EFACTURA': 'Contabil / FinOps',
  }

  return {
    title: `Rezolvă: ${finding.title}`,
    findingId: finding.id,
    suggestedOwner: ownerMap[finding.framework] ?? 'Responsabil general',
    effort: finding.severity === 'critical' ? 'high' : 'medium',
    deadline: calculateDeadline(finding.severity),
    evidenceNeeded: finding.evidenceRequired ?? 'Document justificativ',
    documentTrigger: finding.suggestedDocumentType ?? null,
    scoreDelta: estimateScoreDelta(finding.severity),
    status: 'candidate', // nu 'todo' — userul confirmă
    source: 'auto-generated',
    confidence: finding.confidence,
  }
}

function calculateDeadline(severity: string): string {
  const days = { critical: 7, high: 14, medium: 30, low: 60 }
  const d = new Date()
  d.setDate(d.getDate() + (days[severity as keyof typeof days] ?? 30))
  return d.toISOString()
}

B3 — Auto-trigger Document Generator din Finding
Modificare în app/api/findings/[id]/route.ts
typescript// În PATCH handler, când finding devine 'confirmed':

if (newStatus === 'confirmed' && finding.suggestedDocumentType) {
  // Fire-and-forget — nu bloca răspunsul
  generateDocumentForFinding(finding, org)
    .then(async (doc) => {
      if (!doc) return

      // Auto-atașează la finding
      await attachDocumentToFinding(finding.id, doc.id, org.id)

      // Notifică userul — documentul e draft, nu final
      await createNotification(org.id, {
        type: 'document_generated',
        title: 'Draft document generat',
        message: `${doc.name} generat ca draft pentru "${finding.title}". Verifică și semnează.`,
        link: `/dashboard/resolve/${finding.id}`,
        meta: { status: 'draft', requiresReview: true },
      })
    })
    .catch(err => console.error('Document auto-generate failed:', err))
}

B4 — AutoApply Tasks — Doar pe Low-Risk
Reguli stricte pentru auto-apply
typescript// lib/compliance/task-auto-apply.ts (FIȘIER NOU)

export function canAutoApply(task: Task, finding: Finding): {
  allowed: boolean
  reason: string
} {
  // Lista neagră — NICIODATĂ auto-apply
  if (finding.severity === 'critical') {
    return { allowed: false, reason: 'Severity critic — necesită aprobare umană' }
  }
  if (finding.requiresSignature) {
    return { allowed: false, reason: 'Necesită semnătură juridică' }
  }
  if (finding.affectsLegalSubmission) {
    return { allowed: false, reason: 'Implică trimitere la autoritate' }
  }
  if (finding.framework === 'NIS2' && finding.severity === 'high') {
    return { allowed: false, reason: 'NIS2 high-risk — necesită specialist' }
  }

  // Auto-apply permis DOAR dacă toate condițiile sunt îndeplinite
  const allowed = (
    finding.confidence >= 90 &&
    finding.severity === 'low' &&
    task.type === 'documentation' &&
    task.evidenceAttached === true
  )

  return {
    allowed,
    reason: allowed
      ? `Confidence ${finding.confidence}% + low severity + evidence atașată`
      : `Confidence ${finding.confidence}% sau severity ${finding.severity} — necesită confirmare`,
  }
}

B5 — Cron Import Furnizori Lunar + Diff Furnizori Noi
typescript// app/api/cron/vendor-sync-monthly/route.ts (FIȘIER NOU)
// Rulezi importVendorsFromEFactura() existent
// Compari cu snapshot anterior (Set de CUI-uri)
// Pentru fiecare furnizor NOU:
//   - Creezi finding candidate 'missing-dpa' dacă tip serviciu IT
//   - Trimiți alertă "furnizor nou detectat — evaluează riscul"
//   - Marchezi finding ca 'candidate', nu 'confirmed'

B6 — Digest Săptămânal Partner Hub
typescript// Adaugă în email/weekly-digest.ts existent o funcție nouă:
// sendPartnerWeeklyDigest(consultantEmail, clients[])
// Sortează clienții: urgente first (alerte deschise + score scăzut)
// Format: tabel simplu cu fiecare client + scor + nr alerte + deadline urgent
// Opțional white-label: "Trimis de [Nume Cabinet]" în footer


FAZA C — VENDOR REVIEW AUTOMATION CORE
Scop: Vendor Review = cea mai puternică zonă a produsului

C1 — Vendor Intake Prefill
typescript// lib/compliance/vendor-prefill.ts (FIȘIER NOU)
// La adăugarea unui furnizor:
// 1. Fetch ANAF CUI → denumire, adresă, CAEN automată
// 2. Din CAEN → clasificare tip vendor (software/cloud/processor/AI/unknown)
// 3. Din e-Factura history → istoricul tranzacțiilor
// 4. Din org AI systems → verifică dacă furnizorul e și AI vendor
// Toate valorile marcate ca 'suggested' — userul confirmă

C2 — DPA / Transfer Basis Candidate Generation
typescript// Când vendor e clasificat ca 'processor':
// Propune automat:
//   - "DPA needed? → suggested: yes" (dacă procesează date personale)
//   - "Transfer basis?" (dacă vendor e în afara UE)
//   - "Evidence needed?" (ce dovadă se așteaptă)
// Marchezi toate ca 'candidate' — userul decide

C3 — Vendor Revalidation Lifecycle
typescript// În agent-vendor-risk.ts existent, extinzi cu:
// - nextReviewDue calculat la 12 luni de la ultima validare
// - Alertă la 30 zile înainte de expirare
// - Alertă imediată dacă DPA expirat
// - Queue "overdue vendor reviews" vizibil în dashboard


FAZA D — REMEDIATION & CLOSURE AUTOMATION
Scop: Reduce follow-up fără a falsifica rezolvarea

D1 — Evidence Quality Rules
typescript// lib/compliance/evidence-quality.ts (FIȘIER NOU)
// Validare dovadă atașată:
// - tipul fișierului corespunde cu ce se cere? (PDF pentru DPA, nu imagine)
// - fișierul are dimensiune reală? (nu fișier gol)
// - data documentului e recentă față de finding?
// - legătura cu finding-ul e documentată?
// Returnează: passed | needs_review | failed + reason

D2 — Re-open Rules
typescript// În task-validation.ts existent, adaugi:
// Task se redeschide automat dacă:
// - evidence atașată expiră (DPA la 12 luni, politici la 24 luni)
// - apare drift relevant pe același control
// - apare o modificare legislativă care afectează finding-ul
// Marchezi re-deschiderea cu sursa și motivul


FAZA E — DOCUMENT & POLICY AUTO-UPDATE
Scop: Generatorul devine sistem viu, nu buton one-off

E1 — Expiry Management
typescript// Extinzi document-generator.ts existent cu:
// - câmp expiresAt per document generat (DPA: +12 luni, politici: +24 luni)
// - câmp nextReviewDate
// - alertă la 30 zile înainte de expirare
// - Adaugi în ai-act-timeline.ts existent și documentele proprii firmei

E2 — Drift-linked Document Regeneration
typescript// Când apare drift relevant pe un control:
// 1. Identifici documentele legate de controlul respectiv
// 2. Marchezi documentele ca 'refresh-candidate'
// 3. Notifici userul: "Documentul X poate necesita actualizare"
// NU regenerezi automat — propui, userul decide


FAZA F — CONTINUOUS MONITORING & AGENTS
Scop: Sistem operational zilnic, controlat

F1 — Radar Legislativ (diferențiatorul principal)
Surse oficiale confirmate (URL-uri verificate 2026)
typescript// lib/legislation-monitor.ts (FIȘIER NOU)

import { createHash } from 'crypto'
import { gemini } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'

const SURSE_MONITORIZATE = [
  {
    url: 'https://www.dataprotection.ro/?page=allnews',
    framework: 'GDPR',
    sursa: 'ANSPDCP',
  },
  {
    url: 'https://www.dnsc.ro/citeste/stirile-saptamanii-din-cybersecurity',
    framework: 'NIS2',
    sursa: 'DNSC',
  },
  {
    url: 'https://www.anaf.ro/anaf/internet/ANAF/asistenta_contribuabili/legislatie/noutati_legislative',
    framework: 'EFACTURA',
    sursa: 'ANAF',
  },
]

export async function checkLegislationChanges() {
  const supabase = createClient()
  const changes = []

  for (const sursa of SURSE_MONITORIZATE) {
    try {
      const res = await fetch(sursa.url, {
        headers: { 'User-Agent': 'CompliScan/1.0 (compliance monitoring)' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue

      const html = await res.text()
      const hash = createHash('sha256').update(html).digest('hex')

      const { data: prev } = await supabase
        .from('legislation_hashes')
        .select('hash')
        .eq('url', sursa.url)
        .single()

      if (prev?.hash === hash) {
        await supabase.from('legislation_hashes')
          .upsert({ url: sursa.url, hash, last_checked: new Date().toISOString() })
        continue
      }

      await supabase.from('legislation_hashes')
        .upsert({ url: sursa.url, hash, last_checked: new Date().toISOString() })

      // Rezumă modificarea cu Gemini
      const summary = await summarizeLegislationChange(html, sursa.sursa)
      if (!summary) continue // Gemini a spus FARA_SCHIMBARI relevante

      changes.push({ ...sursa, summary, detectedAt: new Date().toISOString() })
    } catch (err) {
      console.error(`Legislation monitor failed for ${sursa.url}:`, err)
    }
  }

  return changes
}

async function summarizeLegislationChange(html: string, sursa: string): Promise<string | null> {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 8000)

  try {
    const res = await gemini.generateContent(`
      Ești expert în legislație română de conformitate.
      Analizează conținutul paginii ${sursa}.

      IMPORTANT: Ignoră complet:
      - Mesaje de Paște, Crăciun, sărbători
      - Anunțuri de mentenanță site
      - Modificări cosmetice de text
      - Comunicări fără impact legal

      Alertează DOAR dacă există:
      - Proceduri noi sau modificate
      - Amenzi sau sancțiuni
      - Termene legale noi
      - Obligații noi pentru firme
      - Ghiduri sau instrucțiuni noi

      Dacă nu există nimic important: răspunde exact "FARA_SCHIMBARI"
      Dacă există ceva important: 3-5 propoziții în română, limbaj simplu.

      Conținut: ${text}
    `)

    const result = res.response.text().trim()
    if (result === 'FARA_SCHIMBARI') return null
    return result
  } catch {
    return null
  }
}
Cron route: app/api/cron/legislation-monitor/route.ts
typescript// Rulezi checkLegislationChanges()
// Pentru fiecare change: notifici orgs cu framework-ul activ
// Email + notificare in-app
// Nu creezi finding automat — doar alertezi, userul decide

F2 — Import NIS2@RO Tool Oficial (OCR + Prefill)
typescript// lib/compliance/nis2-tool-importer.ts (FIȘIER NOU)
// Source type nou în scan pipeline: 'nis2-official-tool'
// Flow:
// 1. Google Vision OCR extrage textul din Excel/PDF
// 2. Gemini mapează câmpurile la structura wizard-ului intern
// 3. Cross-check CUI cu ANAF (din A1)
// 4. Pre-fill wizard cu confidence score per câmp
// 5. Câmpurile sub 70% confidence → marcate "completează manual"
// 6. Niciun câmp nu se aplică fără confirmare user

F3 — Matrix Cron-uri
json// vercel.json FINAL
{
  "crons": [
    { "path": "/api/cron/agent-orchestrator",   "schedule": "0 6 * * *"  },
    { "path": "/api/cron/score-snapshot",        "schedule": "50 7 * * *" },
    { "path": "/api/cron/daily-digest",          "schedule": "0 8 * * *"  },
    { "path": "/api/cron/legislation-monitor",   "schedule": "0 7 * * *"  },
    { "path": "/api/cron/inspector-weekly",      "schedule": "0 8 * * 1"  },
    { "path": "/api/cron/weekly-digest",         "schedule": "30 8 * * 1" },
    { "path": "/api/cron/audit-pack-monthly",    "schedule": "0 9 1 * *"  },
    { "path": "/api/cron/vendor-sync-monthly",   "schedule": "0 10 1 * *" }
  ]
}

F4 — ANAF OAuth2 + SPV (implementează ULTIMUL)
typescript// lib/anaf-spv-client.ts (FIȘIER NOU — doar după ce A-E sunt stabile)
// OAuth2 endpoints:
//   Authorization: logincert.anaf.ro/anaf-oauth2/v1/authorize
//   Token: logincert.anaf.ro/anaf-oauth2/v1/token
// SPV endpoint: api.anaf.ro/prod/FCTEL/rest/listaMesajeFactura?cif=X&zile=1
// Stochezi tokens în tabela anaf_tokens (encrypted)
// Notifici userul cu 7 zile și 24h înainte de expirare token
// NOTĂ: necesită că userul să aibă certificat digital calificat


FAZA G — OUTPUT LAYER MATURITY
Scop: Output-ul devine avantaj comercial

G1 — One-Page Report îmbunătățit
typescript// one-page-report.ts existent + îmbunătățiri:
// - limbaj orientat pe business, nu jargon tehnic
// - scor vizual prominent
// - top 3 riscuri în română simplă
// - "Pregătit pentru control: Da / Parțial / Nu"
// - timestamp + hash pentru dovadă autenticitate

G2 — Partner / Counsel Pack
typescript// Adaugă în response-pack.ts existent:
// - "Share with accountant" → link securizat cu expirare 72h
// - "Counsel brief" → rezumat juridic pentru avocatul extern
// - Delta față de luna anterioară (ce s-a schimbat)
// Toate marcate: "Generated by CompliScan — requires professional review"


ENVIRONMENT VARIABLES NECESARE
bash# Existente — verifică că sunt setate
GEMINI_API_KEY=
GOOGLE_VISION_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_URL=https://compliscan.ro
CRON_SECRET=

# Noi pentru Faza F4 (ANAF OAuth2 — ultimul de implementat)
ANAF_CLIENT_ID=        # din portal.anaf.ro după înregistrare
ANAF_CLIENT_SECRET=    # din portal.anaf.ro după înregistrare

ORDINEA FINALĂ DE IMPLEMENTARE PE SPRINT-URI
Sprint 1 (2 săptămâni):
  A1 (CUI prefill) → A2 (adaptive intake) → A3 (score snapshot) → A4 (daily digest)

Sprint 2 (2 săptămâni):
  A5 (cron-uri automate) → A6 (timer incident) → B1 (Gemini engine)

Sprint 3 (2 săptămâni):
  B2 (finding→task linkage) → B3 (auto-trigger document) → B4 (auto-apply low-risk)

Sprint 4 (2 săptămâni):
  B5 (vendor sync) → B6 (partner digest) → C1 (vendor prefill) → C2 (DPA suggestions)

Sprint 5 (2 săptămâni):
  D1 (evidence quality) → D2 (re-open rules) → E1 (expiry management) → E2 (drift-regen)

Sprint 6 (2 săptămâni):
  F1 (Radar legislativ) → F2 (NIS2@RO tool) → F3 (cron matrix)

Sprint 7 (2 săptămâni):
  G1 (one-page report) → G2 (partner pack) → F4 (ANAF OAuth2 — ultimul)

DEFINITION OF DONE — când știi că ai terminat

 Intake-ul cere maxim 7 întrebări, restul e pre-completat din CUI/CAEN
 Findings au confidence score + reasoning chain vizibil
 Findings cu confidence < 80 arată overlay "Necesită revizuire umană"
 Orice finding confirmat produce automat un task candidate (nu confirmed)
 Task-urile low-risk + evidence atașată se pot auto-închide
 Documentele au expiresAt și alertă la 30 zile
 Cron-urile rulează fără erori 7 zile consecutiv
 Email-ul zilnic se trimite DOAR când există ceva nou
 Radar legislativ detectează modificări reale pe ANSPDCP/DNSC/ANAF
 Orice auto-acțiune are log complet cu source + confidence + reason
 Produsul nu pretinde opinie juridică finală nicăieri în UI
 Toate valorile inițiale sunt marcate 'suggested', nu 'confirmed'


 # extra add on pentru acest document 


 # CompliScan — Addon la Super Prompt
# Atașează acest document împreună cu compliscan-super-prompt.md
# Implementează DUPĂ ce Faza A din super prompt e stabilă

---

## ADDON 1 — Smart Prefill din Facturi e-Factura

### Ce face
Dacă userul are ANAF OAuth2 conectat (Faza F4 din super prompt),
analizezi denumirile produselor din ultimele 20 facturi cu Gemini
și pre-completezi automat câmpurile despre tool-uri, cloud, antivirus.

Userul nu mai răspunde la întrebări despre ce tool-uri folosește —
CompliScan le deduce din ce a cumpărat.

### Fișier nou: `lib/compliance/efactura-prefill-inference.ts`

```typescript
import { gemini } from '@/lib/gemini'

export const PREFILL_INFERENCE_PROMPT = `
Ești expert senior în conformitate GDPR/NIS2 cu acces la date de facturare.
Analizează denumirile produselor/serviciilor din facturile următoare
și deduce ce tool-uri și servicii folosește firma.

Returnează DOAR JSON valid:
{
  "cloudProviders": ["AWS", "Microsoft 365", "Google Cloud"] sau [],
  "securityTools": ["Bitdefender", "Kaspersky", "CrowdStrike"] sau [],
  "productivityTools": ["Microsoft 365", "Slack", "Zoom"] sau [],
  "aiTools": ["ChatGPT", "GitHub Copilot", "Cursor"] sau [],
  "dataCategories": ["date contact", "date financiare", "date clienți"] sau [],
  "serverLocations": ["România", "UE", "SUA"] sau [],
  "confidencePerField": {
    "cloudProviders": 85,
    "securityTools": 70,
    "aiTools": 90
  }
}

Reguli:
- Returnează doar ce poți deduce cu certitudine rezonabilă
- Nu inventa ce nu e în text
- Toate valorile sunt 'suggested' — userul confirmă

Denumiri produse din facturi:
`

export async function inferPrefillFromInvoices(
  invoiceItems: string[]
): Promise<InferencePrefill | null> {
  if (!invoiceItems || invoiceItems.length === 0) return null

  const text = invoiceItems.slice(0, 20).join('\n')

  try {
    const response = await gemini.generateContent(
      PREFILL_INFERENCE_PROMPT + text
    )
    const raw = response.response.text()
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean)

    return {
      ...parsed,
      source: 'efactura-inference',
      status: 'suggested', // mereu suggested — userul confirmă
      timestamp: new Date().toISOString(),
    }
  } catch {
    return null
  }
}
```

### Unde se apelează

```typescript
// În onboarding, după ANAF CUI lookup (A1 din super prompt):
// Dacă userul are ANAF OAuth2 conectat:
const invoiceItems = await getRecentInvoiceItems(org.id, 20)
const prefill = await inferPrefillFromInvoices(invoiceItems)

if (prefill) {
  // Pre-completează câmpurile cu badge "Dedus din facturi"
  // Userul confirmă sau corectează
  // NU aplică automat în AI Inventory sau Shadow AI
}
```

### Reguli de implementare
- Toate valorile inițiale = `suggested`, niciodată `confirmed`
- Afișezi badge "Dedus din facturile tale" lângă fiecare câmp pre-completat
- Userul poate reseta prefill-ul oricând
- Nu stochezi denumirile produselor din facturi — doar rezultatul JSON
- Fallback silențios dacă Gemini eșuează — câmpurile rămân goale

---

## ADDON 2 — Compliance Streak (Daily Use Retention)

### Ce face
Un contor vizibil care arată câte zile consecutiv firma a menținut
scorul peste un prag (default 70/100).
Psihologic ține userii activi zilnic să nu "rupă seria".

### Modificare în state per org

```typescript
// Adaugă în structura org state existentă:
interface OrgState {
  // ... câmpuri existente ...
  complianceStreak: {
    currentDays: number        // zile consecutive peste prag
    longestStreak: number      // recordul personal
    lastUpdated: string        // data ultimei actualizări
    threshold: number          // pragul (default 70)
    brokenAt: string | null    // când s-a rupt ultima dată
  }
}
```

### Logică în cron score-snapshot (A3 din super prompt)

```typescript
// Adaugă în app/api/cron/score-snapshot/route.ts
// după ce salvezi snapshot-ul zilnic:

async function updateComplianceStreak(orgId: string, scoreAzi: number) {
  const state = await getOrgState(orgId)
  const streak = state.complianceStreak ?? {
    currentDays: 0, longestStreak: 0,
    threshold: 70, lastUpdated: '', brokenAt: null
  }

  if (scoreAzi >= streak.threshold) {
    // Scorul e peste prag — incrementează seria
    streak.currentDays += 1
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentDays)
    streak.brokenAt = null
  } else {
    // Scorul a scăzut sub prag — rupe seria
    if (streak.currentDays > 0) {
      streak.brokenAt = new Date().toISOString()
    }
    streak.currentDays = 0
  }

  streak.lastUpdated = new Date().toISOString()
  await updateOrgState(orgId, { complianceStreak: streak })
}
```

### UI — unde și cum afișezi

```typescript
// Pe pagina Acasă (/dashboard), sub scorul global:
// Afișezi discret, nu agresiv:

// Dacă streak > 0:
// 🔥 23 zile consecutive peste 70 · Record: 45 zile

// Dacă streak = 0 și brokenAt e recent:
// Seria ta s-a întrerupt acum 2 zile · Repornește azi →

// Dacă streak = 0 și prima dată:
// Nu afișezi nimic — apare după prima zi peste prag
```

### Reguli de afișare
- Nu gamifici agresiv — nu confetti, nu popup-uri
- Afișezi discret sub scor, nu ca element principal
- Nu trimite email pentru streak — e informație pasivă în UI
- Dacă scorul e 0 zile — nu afișezi componenta deloc

---

## ADDON 3 — Benchmark Sector (Weekly Motivation)

### Ce face
Arată userului cum se compară față de media firmelor
din același sector (anonimizat).
"Ești în top 20% din sectorul IT" — motivație să mențină scorul.

### Logică simplă

```typescript
// lib/sector-benchmark.ts (FIȘIER NOU)

export async function getSectorBenchmark(
  orgId: string,
  codCaen: string,
  scoreOrg: number
): Promise<SectorBenchmark | null> {
  const supabase = createClient()

  // Fetch scoruri anonimizate din același sector
  // Folosești primele 2 cifre CAEN pentru grupare
  const prefix = codCaen.substring(0, 2)

  const { data } = await supabase
    .from('score_snapshots')
    .select('score')
    .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .in('org_id',
      await getOrgIdsBySector(prefix) // fetch org IDs din același sector
    )

  if (!data || data.length < 5) return null // minim 5 firme pentru benchmark

  const scoruri = data.map(d => d.score).sort((a, b) => a - b)
  const medie = scoruri.reduce((a, b) => a + b, 0) / scoruri.length
  const pozitie = scoruri.filter(s => s < scoreOrg).length
  const percentil = Math.round((pozitie / scoruri.length) * 100)

  return {
    medie: Math.round(medie),
    percentil,           // ex: 78 = ești mai bun decât 78% din sector
    nrFirme: scoruri.length,
    sector: getSectorName(prefix),
  }
}
```

### UI — pe pagina Acasă

```typescript
// Afișezi doar dacă percentil > 50 (nu descurajezi firmele slabe)
// Format discret sub Framework Readiness:
// "Scorul tău e mai mare decât 78% din firmele IT din România (bazat pe 43 firme)"
// Nu afișezi niciodată date individuale — doar agregat anonim
```

### Reguli GDPR pentru benchmark
- Folosești doar scoruri agregate, niciodată date individuale
- Minim 5 firme în grup înainte să afișezi benchmark
- Nu identifici firmele din comparație
- Menționezi în Privacy Policy că se face benchmarking anonim

---

## Ordinea de implementare a addon-urilor

| # | Addon | Efort | Când |
|---|---|---|---|
| 1 | Compliance Streak | 1 zi | După A3 din super prompt |
| 2 | Sector Benchmark | 2 zile | După ce ai 20+ orgs active |
| 3 | Smart Prefill din Facturi | 3 zile | După F4 (ANAF OAuth2) |

---

## De ce aceste 3 lucruri rezolvă daily use

**Streak** — Creează un habit zilnic pasiv. Userii verifică scorul
ca să nu rupă seria, chiar dacă nu au nimic urgent de rezolvat.

**Benchmark** — Motivație continuă. "Ești în top 20%" e un motiv
să revii săptămânal să verifici că ai menținut poziția.

**Smart Prefill** — Nu aduce direct daily use dar reduce
fricțiunea la onboarding atât de mult încât mai mulți useri
ajung la faza în care streak-ul și benchmark-ul îi țin activi.


# alt extra add on pentru acest document


Aceste fisiere fac deja parte din fluxurile active ale produsului si nu trebuie refactorizate agresiv.

Reguli:

modifica-le doar punctual, acolo unde acest document cere explicit

nu schimba contractele publice deja folosite de frontend sau de alte module

nu rupe compatibilitatea existenta

nu muta responsabilitati intre fisiere fara motiv puternic

nu rescrie logica existenta daca poate fi extinsa incremental

prefera patch-uri mici, reversibile si usor de auditat

Scop:

pastram stabilitatea produsului actual

adaugam automatizare fara sa rupem ce functioneaza deja

2. In loc de „NU schimbi API routes existente”
Varianta finala buna

API ROUTES EXISTENTE — FARA BREAKING CHANGES

Nu schimba contractul extern al API routes existente.

Este permis:

sa extinzi logica interna

sa adaugi campuri noi optionale in raspunsuri

sa adaugi validari, logs, provenance, confidence si metadata

sa legi route-urile existente de servicii noi sau de module noi

Nu este permis:

sa schimbi forma raspunsului in mod incompatibil

sa elimini campuri deja folosite

sa schimbi semantic request/response fara backward compatibility

sa rupi flow-urile existente din frontend

Regula:

daca ai nevoie de comportament nou major, adauga-l compatibil peste fluxul existent sau creeaza extensii noi fara sa strici contractul actual

3. Sectiune noua pentru integrari externe
Varianta finala buna

INTEGRARI EXTERNE — VALIDARE TEHNICA OBLIGATORIE

Orice integrare externa mentionata in acest document trebuie tratata ca intentie functionala, nu ca adevar tehnic absolut, pana la validarea in implementare.

Reguli:

valideaza tehnic endpointurile, auth flow-urile, formatele de raspuns si restrictiile reale inainte de productie

daca integrarea reala difera de presupunerea din document, pastreaza intentia functionala a modulului, nu stringurile sau detaliile presupuse

nu bloca implementarea nucleului produsului din cauza unei integrari externe instabile sau incomplete

foloseste fallback-uri, mock-uri controlate sau import manual acolo unde integrarea oficiala nu este suficient de stabila

orice integrare externa trebuie sa aiba error handling, logging si degradare controlata

Scop:

produsul ramane executabil chiar daca sursele externe sunt limitate, manuale sau se schimba

automatizarea nu depinde fragil de presupuneri neverificate



