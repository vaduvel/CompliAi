// FC-9 (2026-05-14) — Missing Evidence Workflow.
//
// Doc 09 cap 7 + Doc 08 cap 6: cabinetul trebuie să poată cere documente
// lipsă (contracte, anexe, AGA dividende, balanțe, soldurile conturilor) de la
// client, cu tracking pe status (cerută → trimisă → primită → verificată),
// timeline, email template, deadline + escalation.
//
// Acest module gestionează workflow-ul cererilor de documente:
//   - createEvidenceRequest
//   - updateEvidenceStatus
//   - generateEmailTemplate (per tip document)
//   - detect overdue requests
//   - aggregate per client

// ── Types ────────────────────────────────────────────────────────────────────

/** Tipuri standard de documente care lipsesc frecvent în compliance fiscal RO. */
export type EvidenceType =
  | "contract-servicii"
  | "aga-dividende"
  | "decizie-cae"
  | "balanta-cont"
  | "factura-conexa"
  | "extras-cont-bancar"
  | "registru-acte-constitutive"
  | "imputernicire-spv"
  | "raport-z-casa-marcat"
  | "saft-export"
  | "alt-document"

export type EvidenceStatus =
  | "requested" // cabinet a creat cererea
  | "sent" // emailul a fost trimis clientului
  | "client-acknowledged" // clientul a confirmat că a primit
  | "received" // documentul a sosit (atașat sau încărcat)
  | "verified" // cabinetul a verificat și e OK
  | "overdue" // deadline depășit fără răspuns
  | "rejected" // documentul primit nu corespunde
  | "cancelled" // anulat de cabinet

export type EvidenceUrgency = "low" | "normal" | "high" | "critical"

export type EvidenceTimelineEntry = {
  atISO: string
  fromStatus: EvidenceStatus | null
  toStatus: EvidenceStatus
  /** Cine a făcut tranziția — "cabinet" | "client" | "system". */
  actor: "cabinet" | "client" | "system"
  note?: string
}

export type EvidenceRequest = {
  id: string
  clientOrgId: string
  clientOrgName: string
  /** Email destinatar pentru client. */
  clientEmail: string
  /** Tip de evidence cerut. */
  type: EvidenceType
  /** Titlul cererii (ex: "Contract servicii Furnizor X pe luna aprilie"). */
  title: string
  /** Context detaliat: de ce e nevoie de el (ex: cross-correlation R1 finding ID f-r1-abc). */
  reasonDetail: string
  /** Period afectat (YYYY-MM sau YYYY-Qn). */
  period: string | null
  /** Status curent. */
  status: EvidenceStatus
  /** Urgency level — afectează escalation. */
  urgency: EvidenceUrgency
  /** Deadline ISO (când trebuie primit). */
  dueISO: string
  /** Data creării. */
  createdAtISO: string
  /** Data ultimei actualizări. */
  updatedAtISO: string
  /** Legătură către finding-ul care a generat această cerere (FC-3+4+5). */
  linkedFindingId?: string
  /** Legătură către exception queue item (FC-7). */
  linkedExceptionId?: string
  /** Timeline / log tranziții status. */
  timeline: EvidenceTimelineEntry[]
  /** Cabinet user care a creat cererea (email pentru audit). */
  createdByEmail: string
}

export type EvidenceTemplate = {
  subject: string
  body: string
  /** Cu cât în avans (zile) să trimită cabinetul reminder înainte de deadline. */
  reminderDaysBefore: number
}

// ── Email templates per tip document ─────────────────────────────────────────

const TEMPLATES: Record<EvidenceType, (req: EvidenceRequest) => EvidenceTemplate> = {
  "contract-servicii": (req) => ({
    subject: `[CompliAI] Solicitare contract servicii — perioada ${req.period ?? "curentă"}`,
    body: `Bună ziua,

În cadrul auditului fiscal pentru ${req.clientOrgName}, avem nevoie de copia contractului de prestări servicii cu furnizorul/clientul menționat.

Context: ${req.reasonDetail}

Vă rog să trimiteți documentul până la data de ${formatDateISO(req.dueISO)}.

Cu stimă,
Cabinet`,
    reminderDaysBefore: 3,
  }),
  "aga-dividende": (req) => ({
    subject: `[CompliAI] Solicitare hotărâre AGA dividende — ${req.period ?? "exercițiu curent"}`,
    body: `Bună ziua,

Avem nevoie de copia hotărârii AGA pentru distribuirea de dividende ${req.period ? `în exercițiul ${req.period}` : ""}.

Context: ${req.reasonDetail}

Termen limită: ${formatDateISO(req.dueISO)}.

Atenție: depunerea D205 fără hotărârea AGA poate genera contestații ANAF (Art. 97 Cod Fiscal).

Cu stimă,
Cabinet`,
    reminderDaysBefore: 2,
  }),
  "decizie-cae": (req) => ({
    subject: `[CompliAI] Solicitare decizie cesionare părți sociale — ${req.period ?? ""}`,
    body: `Bună ziua,

Avem nevoie de copia deciziei AGA / hotărârii ONRC pentru cesionarea părților sociale.

Context: ${req.reasonDetail}

Termen limită: ${formatDateISO(req.dueISO)}.

Cu stimă,
Cabinet`,
    reminderDaysBefore: 5,
  }),
  "balanta-cont": (req) => ({
    subject: `[CompliAI] Solicitare balanță analitică — ${req.period ?? "luna curentă"}`,
    body: `Bună ziua,

Vă rog să ne trimiteți balanța analitică pe conturi pentru ${req.period ?? "luna curentă"}.

Context: ${req.reasonDetail}

Termen: ${formatDateISO(req.dueISO)}.

Cu stimă,
Cabinet`,
    reminderDaysBefore: 2,
  }),
  "factura-conexa": (req) => ({
    subject: `[CompliAI] Solicitare factură conexă — ${req.period ?? ""}`,
    body: `Bună ziua,

Avem nevoie de copia facturii conexe (anexă, factură proformă etc.) menționată în context.

Context: ${req.reasonDetail}

Termen: ${formatDateISO(req.dueISO)}.

Cu stimă,
Cabinet`,
    reminderDaysBefore: 2,
  }),
  "extras-cont-bancar": (req) => ({
    subject: `[CompliAI] Solicitare extras de cont — ${req.period ?? "luna curentă"}`,
    body: `Bună ziua,

Vă rog să ne trimiteți extrasul de cont bancar pentru ${req.period ?? "luna curentă"}.

Context: ${req.reasonDetail}

Termen: ${formatDateISO(req.dueISO)}.

Cu stimă,
Cabinet`,
    reminderDaysBefore: 2,
  }),
  "registru-acte-constitutive": (req) => ({
    subject: `[CompliAI] Solicitare actualizare acte constitutive`,
    body: `Bună ziua,

Avem nevoie de copia ultimei modificări a actelor constitutive (act adițional, hotărâre AGA, etc.).

Context: ${req.reasonDetail}

Termen: ${formatDateISO(req.dueISO)}.

Cu stimă,
Cabinet`,
    reminderDaysBefore: 5,
  }),
  "imputernicire-spv": (req) => ({
    subject: `[CompliAI] Solicitare împuternicire SPV ANAF`,
    body: `Bună ziua,

Pentru a putea acționa în numele dumneavoastră în Spațiul Privat Virtual ANAF, avem nevoie de actualizarea împuternicirii.

Context: ${req.reasonDetail}

Termen: ${formatDateISO(req.dueISO)}.

Cu stimă,
Cabinet`,
    reminderDaysBefore: 7,
  }),
  "raport-z-casa-marcat": (req) => ({
    subject: `[CompliAI] Solicitare raport Z casă de marcat — ${req.period ?? ""}`,
    body: `Bună ziua,

Vă rog să ne trimiteți rapoartele Z (zilnice) și raportul lunar pentru casa de marcat ${req.period ?? "în luna curentă"}.

Context: ${req.reasonDetail}

Termen: ${formatDateISO(req.dueISO)}.

Cu stimă,
Cabinet`,
    reminderDaysBefore: 2,
  }),
  "saft-export": (req) => ({
    subject: `[CompliAI] Solicitare export SAF-T — ${req.period ?? ""}`,
    body: `Bună ziua,

Vă rog să ne trimiteți export SAF-T (D406) din software-ul de contabilitate pentru ${req.period ?? "perioada curentă"}.

Context: ${req.reasonDetail}

Termen: ${formatDateISO(req.dueISO)}.

Cu stimă,
Cabinet`,
    reminderDaysBefore: 3,
  }),
  "alt-document": (req) => ({
    subject: `[CompliAI] Solicitare document — ${req.title}`,
    body: `Bună ziua,

Avem nevoie de următorul document: ${req.title}

Context: ${req.reasonDetail}

Termen: ${formatDateISO(req.dueISO)}.

Cu stimă,
Cabinet`,
    reminderDaysBefore: 3,
  }),
}

function formatDateISO(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" })
  } catch {
    return iso
  }
}

// ── Engine ───────────────────────────────────────────────────────────────────

let _idCounter = 0
function generateId(): string {
  _idCounter++
  return `evidence-${Date.now().toString(36)}-${_idCounter}-${Math.random().toString(36).slice(2, 6)}`
}

export type CreateEvidenceRequestInput = {
  clientOrgId: string
  clientOrgName: string
  clientEmail: string
  type: EvidenceType
  title: string
  reasonDetail: string
  period?: string
  dueDaysFromNow?: number // default 7
  urgency?: EvidenceUrgency
  linkedFindingId?: string
  linkedExceptionId?: string
  createdByEmail: string
  /** ISO override pentru data de creare (pentru teste). */
  nowISO?: string
}

export function createEvidenceRequest(
  input: CreateEvidenceRequestInput,
): EvidenceRequest {
  const nowISO = input.nowISO ?? new Date().toISOString()
  const due = new Date(nowISO)
  due.setDate(due.getDate() + (input.dueDaysFromNow ?? 7))
  const dueISO = due.toISOString()

  const req: EvidenceRequest = {
    id: generateId(),
    clientOrgId: input.clientOrgId,
    clientOrgName: input.clientOrgName,
    clientEmail: input.clientEmail,
    type: input.type,
    title: input.title,
    reasonDetail: input.reasonDetail,
    period: input.period ?? null,
    status: "requested",
    urgency: input.urgency ?? "normal",
    dueISO,
    createdAtISO: nowISO,
    updatedAtISO: nowISO,
    linkedFindingId: input.linkedFindingId,
    linkedExceptionId: input.linkedExceptionId,
    createdByEmail: input.createdByEmail,
    timeline: [
      {
        atISO: nowISO,
        fromStatus: null,
        toStatus: "requested",
        actor: "cabinet",
        note: "Cerere creată",
      },
    ],
  }

  return req
}

export function generateEmailTemplate(req: EvidenceRequest): EvidenceTemplate {
  const fn = TEMPLATES[req.type] ?? TEMPLATES["alt-document"]
  return fn(req)
}

export function updateEvidenceStatus(
  req: EvidenceRequest,
  newStatus: EvidenceStatus,
  actor: "cabinet" | "client" | "system",
  note?: string,
  nowISO?: string,
): EvidenceRequest {
  const now = nowISO ?? new Date().toISOString()
  return {
    ...req,
    status: newStatus,
    updatedAtISO: now,
    timeline: [
      ...req.timeline,
      {
        atISO: now,
        fromStatus: req.status,
        toStatus: newStatus,
        actor,
        note,
      },
    ],
  }
}

/** Detectează cereri overdue (deadline depășit) și actualizează status. */
export function markOverdueRequests(
  requests: EvidenceRequest[],
  nowISO?: string,
): EvidenceRequest[] {
  const now = nowISO ?? new Date().toISOString()
  const nowT = new Date(now).getTime()
  return requests.map((r) => {
    if (
      r.status === "requested" ||
      r.status === "sent" ||
      r.status === "client-acknowledged"
    ) {
      const dueT = new Date(r.dueISO).getTime()
      if (dueT < nowT) {
        return updateEvidenceStatus(r, "overdue", "system", "Deadline depășit", now)
      }
    }
    return r
  })
}

// ── Aggregations ─────────────────────────────────────────────────────────────

export type EvidenceQueueSummary = {
  total: number
  byStatus: Record<EvidenceStatus, number>
  byClient: Map<string, number>
  overdueCount: number
  dueIn3DaysCount: number
  verifiedThisMonth: number
  /** Items pending action de la cabinet (sent → primesc răspunsul). */
  pendingClientResponse: number
}

export function summarizeEvidenceQueue(
  requests: EvidenceRequest[],
  nowISO?: string,
): EvidenceQueueSummary {
  const now = new Date(nowISO ?? new Date().toISOString()).getTime()
  const byStatus: Record<EvidenceStatus, number> = {
    requested: 0,
    sent: 0,
    "client-acknowledged": 0,
    received: 0,
    verified: 0,
    overdue: 0,
    rejected: 0,
    cancelled: 0,
  }
  const byClient = new Map<string, number>()
  let overdueCount = 0
  let dueIn3DaysCount = 0
  let verifiedThisMonth = 0
  let pendingClientResponse = 0
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const startMonthT = startOfMonth.getTime()

  for (const r of requests) {
    byStatus[r.status]++
    byClient.set(r.clientOrgName, (byClient.get(r.clientOrgName) ?? 0) + 1)
    const dueT = new Date(r.dueISO).getTime()
    if (r.status === "overdue" || (dueT < now && r.status !== "verified" && r.status !== "received" && r.status !== "cancelled" && r.status !== "rejected")) {
      overdueCount++
    } else if (
      dueT - now < 3 * 86400000 &&
      dueT >= now &&
      (r.status === "requested" || r.status === "sent" || r.status === "client-acknowledged")
    ) {
      dueIn3DaysCount++
    }
    if (r.status === "verified" && new Date(r.updatedAtISO).getTime() >= startMonthT) {
      verifiedThisMonth++
    }
    if (r.status === "sent" || r.status === "client-acknowledged") {
      pendingClientResponse++
    }
  }

  return {
    total: requests.length,
    byStatus,
    byClient,
    overdueCount,
    dueIn3DaysCount,
    verifiedThisMonth,
    pendingClientResponse,
  }
}

// ── Utility ──────────────────────────────────────────────────────────────────

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  "contract-servicii": "Contract servicii",
  "aga-dividende": "Hotărâre AGA dividende",
  "decizie-cae": "Decizie cesionare CAE",
  "balanta-cont": "Balanță contabilă",
  "factura-conexa": "Factură conexă",
  "extras-cont-bancar": "Extras de cont",
  "registru-acte-constitutive": "Acte constitutive",
  "imputernicire-spv": "Împuternicire SPV",
  "raport-z-casa-marcat": "Raport Z casă marcat",
  "saft-export": "Export SAF-T (D406)",
  "alt-document": "Alt document",
}

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  requested: "Solicitat",
  sent: "Email trimis",
  "client-acknowledged": "Client a confirmat",
  received: "Document primit",
  verified: "Verificat OK",
  overdue: "Întârziat",
  rejected: "Respins",
  cancelled: "Anulat",
}
