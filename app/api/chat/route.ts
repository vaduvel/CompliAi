import { NextResponse } from "next/server"

import { computeDashboardSummary, initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import type { ChatMessage } from "@/lib/compliance/types"
import { readSessionFromRequest } from "@/lib/server/auth"
import { generateComplianceAnswer } from "@/lib/server/gemini"
import { mutateStateForOrg, readStateForOrg } from "@/lib/server/mvp-store"

type ChatPayload = {
  message?: string
}

export async function POST(request: Request) {
  const session = readSessionFromRequest(request)
  if (!session) {
    return NextResponse.json(
      { error: "Autentificarea este obligatorie." },
      { status: 401 }
    )
  }

  const body = (await request.json()) as ChatPayload
  const message = (body.message ?? "").trim()
  if (!message) {
    return NextResponse.json(
      { error: "Mesajul este obligatoriu." },
      { status: 400 }
    )
  }

  const state =
    (await readStateForOrg(session.orgId)) ??
    normalizeComplianceState(initialComplianceState)
  const summary = computeDashboardSummary(state)
  const context = {
    score: summary.score,
    riskLabel: summary.riskLabel,
    alerts: summary.openAlerts,
    redAlerts: summary.redAlerts,
    highRisk: state.highRisk,
    gdprProgress: state.gdprProgress,
    syncedAt: state.efacturaSyncedAtISO,
    lastFindings: state.findings.slice(0, 3).map((f) => ({
      title: f.title,
      detail: f.detail,
      legalReference: f.legalReference,
      ruleId: f.provenance?.ruleId,
      excerpt: f.provenance?.excerpt,
    })),
  }

  let answer = ""
  try {
    answer = await generateComplianceAnswer(message, context)
  } catch {
    answer = buildAssistantAnswer(message, context)
  }

  await mutateStateForOrg(
    session.orgId,
    (current) => {
      const now = new Date().toISOString()
      const userEntry: ChatMessage = {
        id: `chat-${crypto.randomUUID()}`,
        role: "user",
        content: message,
        createdAtISO: now,
      }
      const assistantEntry: ChatMessage = {
        id: `chat-${crypto.randomUUID()}`,
        role: "assistant",
        content: answer,
        createdAtISO: now,
      }

      return {
        ...current,
        chat: [...current.chat, userEntry, assistantEntry].slice(-20),
      }
    },
    session.orgName
  )
  return NextResponse.json({ answer })
}

function buildAssistantAnswer(
  message: string,
  context: {
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
) {
  const lower = message.toLowerCase()
  const leadFinding = context.lastFindings[0]

  if (lower.includes("ce fac") || lower.includes("priorit")) {
    return [
      `Ce am detectat`,
      `${leadFinding?.title ?? "Există semnale active care cer prioritate operațională."}`,
      ``,
      `De ce contează`,
      `${leadFinding?.excerpt ?? `Ai ${context.redAlerts} semnale roșii deschise, iar acestea trag în jos scorul de risc (${context.score}% - ${context.riskLabel}).`}`,
      ``,
      `Ce verifici acum`,
      `1) Închide mai întâi semnalele roșii (${context.redAlerts}).`,
      `2) Confirmă fluxurile high-risk (${context.highRisk}) și controlul uman.`,
      `3) Re-rulează scanarea după remediere și regenerează raportul.`,
      ``,
      `Remediere concretă`,
      `Începe cu task-ul P1 din checklist și pregătește dovada de închidere pentru acel flux.`,
      ``,
      `Verifică uman înainte de decizii oficiale.`,
    ].join("\n")
  }

  if (lower.includes("gdpr")) {
    return [
      `Ce am detectat`,
      `${leadFinding?.title ?? "Există semnale GDPR care cer verificare."}`,
      ``,
      `De ce contează`,
      `${leadFinding?.detail ?? `GDPR checklist este la ${context.gdprProgress}%, deci încă există zone fără dovadă completă de bază legală sau consimțământ.`}`,
      ``,
      `Ce verifici acum`,
      `Baza legală, dovada consimțământului, retenția și versiunea textelor legale pentru fluxurile active.`,
      ``,
      `Remediere concretă`,
      `Blochează prelucrările non-esențiale până la accept explicit și păstrează timestamp + preferințe + versiunea notice-ului.`,
      ``,
      `Verifică uman înainte de decizii oficiale.`,
    ].join("\n")
  }

  if (lower.includes("e-factura") || lower.includes("efactura")) {
    return [
      `Ce am detectat`,
      `Statusul e-Factura indică ultima sincronizare la ${formatSyncLabel(context.syncedAt)}.`,
      ``,
      `De ce contează`,
      `Faptul că fluxul apare în sistem nu dovedește singur că XML-ul a fost validat, transmis și arhivat corect.`,
      ``,
      `Ce verifici acum`,
      `XML-ul facturii, răspunsul de transmitere și dovada de arhivare.`,
      ``,
      `Remediere concretă`,
      `Rulează validarea XML și păstrează răspunsul ANAF împreună cu artefactele de export.`,
      ``,
      `Verifică uman înainte de decizii oficiale.`,
    ].join("\n")
  }

  const findings =
    context.lastFindings.length > 0
      ? `Ultimele constatări: ${context.lastFindings.map((finding) => finding.title).join(", ")}.`
      : "Nu există constatări recente."

  return [
    `Ce am detectat`,
    `${findings}`,
    ``,
    `De ce contează`,
    `Scorul de risc este ${context.score}% (${context.riskLabel}) și ai ${context.alerts} semnale active.`,
    ``,
    `Ce verifici acum`,
    `Identifică finding-ul cu prioritatea cea mai mare și verifică excerptul care l-a declanșat.`,
    ``,
    `Remediere concretă`,
    `Pot să-ți propun pașii următori pentru un finding anume, dacă îmi spui titlul lui.`,
    ``,
    `Verifică uman înainte de decizii oficiale.`,
  ].join("\n")
}

function formatSyncLabel(iso: string) {
  if (!iso) return "neefectuată"

  const timestamp = new Date(iso).getTime()
  if (!Number.isFinite(timestamp)) return "neefectuată"

  return new Date(iso).toLocaleString("ro-RO")
}
