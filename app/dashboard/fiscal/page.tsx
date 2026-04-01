"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCode2,
  FileText,
  Loader2,
  Plus,
  Radio,
  RefreshCw,
  Send,
  ShieldCheck,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
import { FiscalExecutionLogCard } from "@/components/compliscan/fiscal-execution-log-card"
import { FiscalStatusInterpreterCard } from "@/components/compliscan/fiscal-status-interpreter-card"
import { EFacturaValidatorCard } from "@/components/compliscan/efactura-validator-card"
import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"
import type { ETVADiscrepancy, ETVADiscrepancyType } from "@/lib/compliance/etva-discrepancy"
import { ETVA_TYPE_LABELS, ETVA_STATUS_LABELS } from "@/lib/compliance/etva-discrepancy"
import type { FilingRecord, FilingType, FilingStatus, FilingDisciplineScore } from "@/lib/compliance/filing-discipline"
import { FILING_TYPE_LABELS, FILING_STATUS_LABELS } from "@/lib/compliance/filing-discipline"
import { buildFiscalStatusInterpreterGuide } from "@/lib/compliance/efactura-status-interpreter"
import type { EFacturaValidationRecord, EFacturaXmlRepairRecord, ScanFinding } from "@/lib/compliance/types"
import { SPV_STATUS_LABELS, type SPVSubmission } from "@/lib/fiscal/spv-submission"

type EFacturaIntegrationStatus = {
  mode: "mock" | "test" | "real"
  environment: "test" | "prod"
  productionUnlocked: boolean
  connected: boolean
  syncedAtISO: string | null
  tokenState: "missing" | "active" | "expired"
  tokenExpiresAtISO: string | null
  ready: boolean
  productionReady: boolean
  missingConfig: string[]
  message: string
}

// ── Severity badge helpers ───────────────────────────────────────────────────

const SEVERITY_VARIANT: Record<string, "destructive" | "default" | "secondary"> = {
  critical: "destructive",
  high: "destructive",
  medium: "default",
}

const STATUS_VARIANT: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  detected: "destructive",
  acknowledged: "default",
  explanation_drafted: "secondary",
  response_sent: "secondary",
  awaiting_anaf: "outline",
  resolved: "default",
  overdue: "destructive",
}

// ── Discrepancies Tab ────────────────────────────────────────────────────────

function DiscrepanciesTab() {
  const [items, setItems] = useState<ETVADiscrepancy[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    type: "sum_mismatch" as ETVADiscrepancyType,
    period: "",
    description: "",
    amountDifference: "",
  })

  useEffect(() => {
    fetch("/api/fiscal/etva-discrepancies", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { discrepancies?: ETVADiscrepancy[] }) => setItems(data.discrepancies ?? []))
      .catch(() => toast.error("Nu am putut încărca discrepanțele."))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!form.period || !form.description) return
    setCreating(true)
    try {
      const res = await fetch("/api/fiscal/etva-discrepancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          period: form.period,
          description: form.description,
          amountDifference: form.amountDifference ? Number(form.amountDifference) : undefined,
        }),
      })
      const data = (await res.json()) as { discrepancy?: ETVADiscrepancy; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la creare.")
      if (data.discrepancy) setItems((prev) => [data.discrepancy!, ...prev])
      setForm({ type: "sum_mismatch", period: "", description: "", amountDifference: "" })
      setShowForm(false)
      toast.success("Discrepanță creată.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la creare.")
    } finally {
      setCreating(false)
    }
  }

  async function handleTransition(id: string, transition: string) {
    try {
      const res = await fetch("/api/fiscal/etva-discrepancies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, transition }),
      })
      const data = (await res.json()) as { discrepancy?: ETVADiscrepancy; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la actualizare.")
      if (data.discrepancy) {
        setItems((prev) => prev.map((d) => (d.id === id ? data.discrepancy! : d)))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la actualizare.")
    }
  }

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted"><Loader2 className="size-4 animate-spin" /> Se încarcă...</div>

  const open = items.filter((d) => d.status !== "resolved")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="normal-case tracking-normal">
          {open.length} deschise
        </Badge>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-3.5" /> Adauga discrepanta
        </Button>
      </div>

      {showForm && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="space-y-3 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-eos-text">Tip</span>
                <select
                  className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ETVADiscrepancyType }))}
                >
                  {(Object.entries(ETVA_TYPE_LABELS) as [ETVADiscrepancyType, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-eos-text">Perioada</span>
                <input
                  className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  placeholder="ex: 2026-Q1"
                  value={form.period}
                  onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-eos-text">Descriere</span>
              <textarea
                className="mt-1 h-16 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-eos-text">Diferenta suma (RON, optional)</span>
              <input
                type="number"
                className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                value={form.amountDifference}
                onChange={(e) => setForm((f) => ({ ...f, amountDifference: e.target.value }))}
              />
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Anuleaza</Button>
              <Button size="sm" disabled={creating || !form.period || !form.description} onClick={() => void handleCreate()}>
                {creating && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                Salveaza
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          label="Nicio discrepanta e-TVA. Adauga o discrepanta cand detectezi diferente intre declaratii si e-TVA precompletata."
        />
      ) : (
        <div className="space-y-2">
          {items.map((d) => {
            const discrepancyBorderL =
              d.severity === "critical" || d.severity === "high"
                ? "border-l-eos-error"
                : d.severity === "medium"
                  ? "border-l-eos-warning"
                  : "border-l-eos-border-subtle"
            return (
            <Card key={d.id} className={`border border-l-[3px] ${discrepancyBorderL} ${d.status === "resolved" ? "border-eos-border bg-eos-surface opacity-70" : "border-eos-border bg-eos-surface"}`}>
            <CardContent className="space-y-2 py-3 px-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-eos-text">{ETVA_TYPE_LABELS[d.type]}</p>
                <Badge variant={SEVERITY_VARIANT[d.severity] ?? "default"} className="text-[10px] normal-case tracking-normal">
                  {d.severity}
                </Badge>
                <Badge variant={STATUS_VARIANT[d.status] ?? "outline"} className="text-[10px] normal-case tracking-normal">
                  {ETVA_STATUS_LABELS[d.status]}
                </Badge>
                <span className="text-xs text-eos-text-muted">Perioada: {d.period}</span>
              </div>
              <p className="text-xs text-eos-text-muted">{d.description}</p>
              {d.amountDifference != null && (
                <p className="text-xs text-eos-text-muted">
                  Diferenta: <span className="font-semibold text-eos-text">{d.amountDifference.toLocaleString("ro-RO")} RON</span>
                </p>
              )}
              {d.deadlineISO && (
                <p className="flex items-center gap-1 text-xs text-eos-text-muted">
                  <Clock className="size-3" /> Termen: {new Date(d.deadlineISO).toLocaleDateString("ro-RO")}
                </p>
              )}
              {d.status !== "resolved" && (
                <div className="flex gap-2 pt-1">
                  {d.status === "detected" && (
                    <Button size="sm" variant="outline" onClick={() => void handleTransition(d.id, "acknowledge")}>Confirma</Button>
                  )}
                  {d.status === "acknowledged" && (
                    <Button size="sm" variant="outline" onClick={() => void handleTransition(d.id, "draft_explanation")}>Redacteaza explicatie</Button>
                  )}
                  {(d.status === "explanation_drafted" || d.status === "response_sent") && (
                    <Button size="sm" variant="outline" onClick={() => void handleTransition(d.id, "resolve")}>Marcheaza rezolvat</Button>
                  )}
                </div>
              )}
            </CardContent>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Filing Records Tab ───────────────────────────────────────────────────────

function FilingRecordsTab() {
  const [records, setRecords] = useState<FilingRecord[]>([])
  const [score, setScore] = useState<FilingDisciplineScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    type: "d300_tva" as FilingType,
    period: "",
    status: "on_time" as FilingStatus,
    dueISO: "",
  })

  useEffect(() => {
    fetch("/api/fiscal/filing-records", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { records?: FilingRecord[]; disciplineScore?: FilingDisciplineScore }) => {
        setRecords(data.records ?? [])
        setScore(data.disciplineScore ?? null)
      })
      .catch(() => toast.error("Nu am putut încărca depunerile."))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!form.period || !form.dueISO) return
    setCreating(true)
    try {
      const res = await fetch("/api/fiscal/filing-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as { record?: FilingRecord; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la creare.")
      if (data.record) setRecords((prev) => [data.record!, ...prev])
      setForm({ type: "d300_tva", period: "", status: "on_time", dueISO: "" })
      setShowForm(false)
      toast.success("Depunere adăugată.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la creare.")
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted"><Loader2 className="size-4 animate-spin" /> Se încarcă...</div>

  const FILING_STATUS_VARIANT: Record<FilingStatus, "default" | "destructive" | "secondary" | "outline"> = {
    on_time: "default",
    late: "destructive",
    missing: "destructive",
    rectified: "secondary",
    upcoming: "outline",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {score && (
          <Badge variant={score.score >= 80 ? "default" : score.score >= 50 ? "secondary" : "destructive"} className="normal-case tracking-normal">
            Disciplina: {score.score}/100 ({score.label})
          </Badge>
        )}
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-3.5" /> Adauga depunere
        </Button>
      </div>

      {showForm && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="space-y-3 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-eos-text">Tip declaratie</span>
                <select
                  className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as FilingType }))}
                >
                  {(Object.entries(FILING_TYPE_LABELS) as [FilingType, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-eos-text">Perioada</span>
                <input
                  className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  placeholder="ex: 2026-02"
                  value={form.period}
                  onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-eos-text">Status</span>
                <select
                  className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FilingStatus }))}
                >
                  {(Object.entries(FILING_STATUS_LABELS) as [FilingStatus, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-eos-text">Termen limita</span>
                <input
                  type="date"
                  className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.dueISO.split("T")[0]}
                  onChange={(e) => setForm((f) => ({ ...f, dueISO: new Date(e.target.value).toISOString() }))}
                />
              </label>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Anuleaza</Button>
              <Button size="sm" disabled={creating || !form.period || !form.dueISO} onClick={() => void handleCreate()}>
                {creating && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                Salveaza
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {records.length === 0 ? (
        <EmptyState
          icon={FileText}
          label="Nicio depunere inregistrata. Adauga declaratiile si depunerile fiscale pentru a calcula scorul de disciplina."
        />
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const filingBorderL =
              r.status === "late" || r.status === "missing"
                ? "border-l-eos-error"
                : r.status === "upcoming"
                  ? "border-l-eos-warning"
                  : r.status === "on_time" || r.status === "rectified"
                    ? "border-l-eos-success"
                    : "border-l-eos-border-subtle"
            return (
              <Card key={r.id} className={`border border-l-[3px] ${filingBorderL} border-eos-border bg-eos-surface`}>
                <CardContent className="space-y-1 py-3 px-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-eos-text">{FILING_TYPE_LABELS[r.type]}</p>
                    <Badge variant={FILING_STATUS_VARIANT[r.status]} className="text-[10px] normal-case tracking-normal">
                      {FILING_STATUS_LABELS[r.status]}
                    </Badge>
                    <span className="text-xs text-eos-text-muted">Perioada: {r.period}</span>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-eos-text-muted">
                    <Clock className="size-3" /> Termen: {new Date(r.dueISO).toLocaleDateString("ro-RO")}
                    {r.filedAtISO && <> · Depus: {new Date(r.filedAtISO).toLocaleDateString("ro-RO")}</>}
                  </p>
                  {r.note && <p className="text-xs text-eos-text-muted">{r.note}</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── SPV Check Tab ────────────────────────────────────────────────────────────

type SpvSignal = { messageId: string; type: string; date: string; detail: string; converted: boolean }
type SpvCheckResult = {
  cui: string
  spvRegistered: boolean | null
  tokenAvailable: boolean
  messagesChecked: number
  newFindings: number
  signals: SpvSignal[]
}

function SpvCheckTab() {
  const [result, setResult] = useState<SpvCheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runCheck() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/fiscal/spv-check", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Eroare la verificare.")
      setResult(data as SpvCheckResult)
      if (data.newFindings > 0) toast.success(`${data.newFindings} finding(s) noi create din semnale SPV.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscuta.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-eos-text-muted">
          Verifica daca firma e inregistrata in SPV si citeste semnalele de eroare ANAF.
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => void runCheck()} disabled={loading}>
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
          Verifica SPV
        </Button>
      </div>

      {error && (
        <Card className="border-eos-error/30 bg-eos-error-soft">
          <CardContent className="py-3">
            <p className="text-sm text-eos-error">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Rezultat verificare SPV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-eos-text-muted">CUI:</span>
                <span className="font-mono text-eos-text">{result.cui}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-eos-text-muted">SPV:</span>
                {result.spvRegistered === true && (
                  <Badge variant="default" className="gap-1 bg-eos-success-soft text-eos-success">
                    <CheckCircle2 className="size-3" /> Inregistrat
                  </Badge>
                )}
                {result.spvRegistered === false && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="size-3" /> Neinregistrat
                  </Badge>
                )}
                {result.spvRegistered === null && (
                  <Badge variant="outline" className="gap-1">
                    Nu s-a putut determina
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-eos-text-muted">Token ANAF:</span>
                <Badge variant={result.tokenAvailable ? "default" : "outline"}>
                  {result.tokenAvailable ? "Conectat" : "Neconectat"}
                </Badge>
              </div>
              {result.messagesChecked > 0 && (
                <p className="text-sm text-eos-text-muted">
                  {result.messagesChecked} mesaje verificate · {result.newFindings} findings noi
                </p>
              )}
            </CardContent>
          </Card>

          {result.signals.length > 0 && (
            <Card className="border-eos-border bg-eos-surface">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Semnale detectate</CardTitle>
              </CardHeader>
              {result.signals.map((s) => (
                <CardContent key={s.messageId} className="border-t border-eos-border py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-eos-text">{s.type}</p>
                      <p className="text-xs text-eos-text-muted">{s.detail}</p>
                      <p className="mt-1 text-xs text-eos-text-muted">{s.date}</p>
                    </div>
                    {s.converted && (
                      <Badge variant="default" className="shrink-0 bg-eos-primary/20 text-eos-primary">
                        Finding creat
                      </Badge>
                    )}
                  </div>
                </CardContent>
              ))}
            </Card>
          )}

          {result.signals.length === 0 && result.spvRegistered && (
            <EmptyState
              icon={CheckCircle2}
              title="Fără semnale de eroare"
              label="Nu au fost detectate facturi respinse sau erori XML în ultimele 30 de zile."
            />
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <EmptyState
          icon={ShieldCheck}
          title="Verificare SPV"
          label="Apasa butonul pentru a verifica inregistrarea SPV si a citi semnalele ANAF."
        />
      )}
    </div>
  )
}

// ── eFactura Signals Tab with Filters ────────────────────────────────────────

type EFSignal = {
  id: string
  vendorName: string
  invoiceNumber?: string
  date: string
  status: "rejected" | "xml-error" | "processing-delayed" | "unsubmitted"
  amount?: number
  currency?: string
  reason?: string
  isTechVendor?: boolean
}

type SignalFilter = "all" | "rejected" | "xml-error" | "processing-delayed" | "unsubmitted"

const SIGNAL_FILTER_LABELS: Record<SignalFilter, string> = {
  all: "Toate",
  rejected: "Respinse",
  "xml-error": "Erori XML",
  "processing-delayed": "Blocate",
  unsubmitted: "Netransmise",
}

const SIGNAL_STATUS_VARIANT: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  rejected: "destructive",
  "xml-error": "destructive",
  "processing-delayed": "default",
  unsubmitted: "secondary",
}

const SIGNAL_STATUS_LABELS: Record<string, string> = {
  rejected: "Respinsa ANAF",
  "xml-error": "Eroare XML",
  "processing-delayed": "Blocat prelucrare",
  unsubmitted: "Netransmisa",
}

function EFacturaSignalsTab() {
  const [signals, setSignals] = useState<EFSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<SignalFilter>("all")
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch("/api/efactura/signals", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { signals?: EFSignal[] }) => setSignals(data.signals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleGenerateFindings() {
    setGenerating(true)
    try {
      const res = await fetch("/api/efactura/signals", { method: "POST" })
      const data = (await res.json()) as { generated: number }
      if (data.generated > 0) {
        toast.success(`${data.generated} finding(s) generate din semnale.`)
      }
    } catch {
      toast.error("Eroare la generare findings.")
    } finally {
      setGenerating(false)
    }
  }

  const filtered = filter === "all" ? signals : signals.filter((s) => s.status === filter)
  const counts: Record<SignalFilter, number> = {
    all: signals.length,
    rejected: signals.filter((s) => s.status === "rejected").length,
    "xml-error": signals.filter((s) => s.status === "xml-error").length,
    "processing-delayed": signals.filter((s) => s.status === "processing-delayed").length,
    unsubmitted: signals.filter((s) => s.status === "unsubmitted").length,
  }

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted"><Loader2 className="size-4 animate-spin" /> Se încarcă...</div>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SIGNAL_FILTER_LABELS) as SignalFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-eos-md px-3 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? "bg-eos-primary text-eos-text"
                  : "bg-eos-bg-inset text-eos-text-muted hover:text-eos-text"
              }`}
            >
              {SIGNAL_FILTER_LABELS[f]}
              {counts[f] > 0 && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  {counts[f]}
                </span>
              )}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => void handleGenerateFindings()}
          disabled={generating}
          className="gap-1.5"
        >
          {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Radio className="size-3.5" />}
          Genereaza findings
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Fără semnale"
          label={filter === "all" ? "Nu sunt semnale e-Factura active." : `Niciun semnal de tip ${SIGNAL_FILTER_LABELS[filter]}.`}
        />
      ) : (
        <Card className="divide-y divide-eos-border-subtle border-eos-border bg-eos-surface">
          {filtered.map((signal) => (
            <CardContent key={signal.id} className="space-y-1.5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-eos-text">{signal.vendorName}</p>
                <Badge
                  variant={SIGNAL_STATUS_VARIANT[signal.status] ?? "outline"}
                  className="text-[10px] normal-case tracking-normal"
                >
                  {SIGNAL_STATUS_LABELS[signal.status]}
                </Badge>
                {signal.isTechVendor && (
                  <Badge variant="secondary" className="text-[10px] normal-case tracking-normal">
                    Tech vendor
                  </Badge>
                )}
                {signal.invoiceNumber && (
                  <span className="text-xs text-eos-text-muted">#{signal.invoiceNumber}</span>
                )}
              </div>
              {signal.reason && (
                <p className="text-xs text-eos-text-muted">{signal.reason}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-eos-text-muted">
                <span>{new Date(signal.date).toLocaleDateString("ro-RO")}</span>
                {signal.amount != null && (
                  <span className="font-semibold text-eos-text">
                    {signal.amount.toLocaleString("ro-RO")} {signal.currency ?? "RON"}
                  </span>
                )}
              </div>
            </CardContent>
          ))}
        </Card>
      )}
    </div>
  )
}

// ── Submit ANAF Tab ───────────────────────────────────────────────────────────

const SUBMIT_STATUS_VARIANT: Record<string, "destructive" | "default" | "secondary" | "outline" | "success"> = {
  pending_approval: "outline",
  approved: "success",
  rejected: "destructive",
  submitting: "secondary",
  submitted: "default",
  ok: "default",
  nok: "destructive",
  error: "destructive",
}

function SubmitSpvTab() {
  const [submissions, setSubmissions] = useState<SPVSubmission[]>([])
  const [integrationStatus, setIntegrationStatus] = useState<EFacturaIntegrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)
  const [executing, setExecuting] = useState<string | null>(null)
  const [polling, setPolling] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [xml, setXml] = useState("")
  const [invoiceId, setInvoiceId] = useState("")

  const refreshTab = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [submissionsRes, statusRes] = await Promise.all([
        fetch("/api/fiscal/submit-spv", { cache: "no-store" }),
        fetch("/api/integrations/efactura/status", { cache: "no-store" }),
      ])

      const submissionsData = (await submissionsRes.json()) as { submissions?: SPVSubmission[] }
      if (!submissionsRes.ok) {
        throw new Error("Nu am putut încărca transmisiile.")
      }
      setSubmissions(submissionsData.submissions ?? [])

      if (statusRes.ok) {
        const statusData = (await statusRes.json()) as EFacturaIntegrationStatus
        setIntegrationStatus(statusData)
      }
    } catch (error) {
      if (!silent) {
        toast.error(error instanceof Error ? error.message : "Nu am putut încărca transmisiile.")
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshTab()

    const handleFocusRefresh = () => {
      void refreshTab(true)
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshTab(true)
      }
    }

    window.addEventListener("focus", handleFocusRefresh)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      window.removeEventListener("focus", handleFocusRefresh)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [refreshTab])

  async function handleInitiate() {
    if (!xml.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/fiscal/submit-spv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xmlContent: xml, invoiceId: invoiceId || undefined }),
      })
      const data = (await res.json()) as { ok?: boolean; submission?: SPVSubmission; error?: string; message?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la inițierea transmiterii.")
      if (data.submission) setSubmissions((prev) => [data.submission!, ...prev])
      setXml("")
      setInvoiceId("")
      setShowForm(false)
      toast.success("Transmitere creată", {
        description: "Poți aproba direct aici sau din pagina Aprobări.",
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare necunoscută.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApprove(submission: SPVSubmission) {
    setApproving(submission.id)
    try {
      const res = await fetch(`/api/approvals/${encodeURIComponent(submission.approvalActionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "approved" }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Nu am putut aproba transmiterea.")

      await refreshTab(true)
      toast.success("Transmitere aprobată", {
        description: "Poți trimite acum factura la ANAF.",
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nu am putut aproba transmiterea.")
    } finally {
      setApproving(null)
    }
  }

  async function handleExecute(submissionId: string) {
    setExecuting(submissionId)
    try {
      const res = await fetch("/api/fiscal/submit-spv/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      })
      const data = (await res.json()) as { ok?: boolean; submission?: SPVSubmission; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la transmitere.")
      if (data.submission) {
        setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? data.submission! : s)))
        toast.success("Transmis la ANAF", {
          description: data.submission.indexDescarcare
            ? `Index: ${data.submission.indexDescarcare}`
            : "Verifică statusul în câteva minute.",
        })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la transmitere.")
    } finally {
      setExecuting(null)
    }
  }

  async function handlePollStatus(submissionId: string) {
    setPolling(submissionId)
    try {
      const res = await fetch(`/api/fiscal/submit-spv/${encodeURIComponent(submissionId)}/status`, { cache: "no-store" })
      const data = (await res.json()) as { submission?: SPVSubmission; changed?: boolean }
      if (!res.ok) throw new Error("Eroare la verificarea statusului.")
      if (data.submission) {
        setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? data.submission! : s)))
        if (data.changed) {
          const s = data.submission
          if (s.status === "ok") toast.success("Acceptat ANAF!", { description: s.anafMessage ?? "" })
          if (s.status === "nok") toast.error("Respins ANAF", { description: s.anafMessage ?? "" })
        } else {
          toast.info("Status neschimbat — mai încearcă în câteva minute.")
        }
      }
    } catch {
      toast.error("Nu am putut verifica statusul.")
    } finally {
      setPolling(null)
    }
  }

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted"><Loader2 className="size-4 animate-spin" /> Se încarcă...</div>

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-eos-md border border-eos-primary/20 bg-eos-primary/5 px-4 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-eos-primary" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium text-eos-text">Transmitere ANAF cu dublu aprobare</p>
          <p className="mt-0.5 text-xs text-eos-text-muted">
            Orice transmitere necesită aprobare manuală înainte de upload. Poți aproba direct din acest tab sau din{" "}
            <a href="/dashboard/approvals" className="text-eos-primary hover:underline">pagina Aprobări</a>.
          </p>
        </div>
      </div>

      {integrationStatus && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="space-y-3 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-eos-text">Conexiune ANAF pentru transmitere</p>
                  <Badge
                    variant={
                      integrationStatus.mode === "real"
                        ? "default"
                        : integrationStatus.mode === "test"
                          ? "outline"
                          : "secondary"
                    }
                    className="text-[10px] normal-case tracking-normal"
                  >
                    {integrationStatus.mode === "real"
                      ? "Producție"
                      : integrationStatus.mode === "test"
                        ? "Sandbox ANAF"
                        : "Demo local"}
                  </Badge>
                </div>
                <p className="text-xs text-eos-text-muted">{integrationStatus.message}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/api/anaf/connect?returnTo=/dashboard/fiscal?tab=transmitere"
                  className="inline-flex items-center gap-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-1.5 text-xs font-medium text-eos-text hover:bg-eos-surface-hover"
                >
                  <ShieldCheck className="size-3" />
                  {integrationStatus.tokenState === "active" ? "Reautentifică ANAF" : "Conectează ANAF"}
                </a>
                <a
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-1.5 text-xs font-medium text-eos-text hover:bg-eos-surface-hover"
                >
                  <ExternalLink className="size-3" />
                  Setări
                </a>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-eos-text-muted">Token</p>
                <p className="mt-1 text-sm font-medium text-eos-text">
                  {integrationStatus.tokenState === "active"
                    ? "Activ"
                    : integrationStatus.tokenState === "expired"
                      ? "Expirat"
                      : "Lipsă"}
                </p>
                {integrationStatus.tokenExpiresAtISO && (
                  <p className="mt-1 text-xs text-eos-text-muted">
                    Expiră: {new Date(integrationStatus.tokenExpiresAtISO).toLocaleString("ro-RO")}
                  </p>
                )}
              </div>
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-eos-text-muted">Mediu</p>
                <p className="mt-1 text-sm font-medium text-eos-text">
                  {integrationStatus.environment === "prod" ? "ANAF prod" : "ANAF test"}
                </p>
                <p className="mt-1 text-xs text-eos-text-muted">
                  {integrationStatus.productionUnlocked
                    ? "Producția este deblocată explicit."
                    : "Submitul real rămâne blocat."}
                </p>
              </div>
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-eos-text-muted">Ultim sync</p>
                <p className="mt-1 text-sm font-medium text-eos-text">
                  {integrationStatus.syncedAtISO
                    ? new Date(integrationStatus.syncedAtISO).toLocaleString("ro-RO")
                    : "Încă nu există"}
                </p>
                {integrationStatus.missingConfig.length > 0 && (
                  <p className="mt-1 text-xs text-eos-text-muted">
                    Lipsesc: {integrationStatus.missingConfig.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="normal-case tracking-normal">
          {submissions.filter((s) => s.status === "pending_approval").length} așteaptă aprobare
        </Badge>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <Upload className="size-3.5" /> Transmite factură
        </Button>
      </div>

      {/* Submit form */}
      {showForm && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="space-y-3 py-4">
            <label className="block">
              <span className="text-xs font-medium text-eos-text">ID factură (opțional)</span>
              <input
                className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                placeholder="ex: FAC-2026-001"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-eos-text">XML UBL factură</span>
              <textarea
                className="mt-1 h-40 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 font-mono text-xs text-eos-text outline-none"
                placeholder="<?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?>&#10;<Invoice xmlns=&quot;urn:oasis:names:specification:ubl:schema:xsd:Invoice-2&quot;>..."
                value={xml}
                onChange={(e) => setXml(e.target.value)}
              />
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Anulează</Button>
              <Button
                size="sm"
                disabled={submitting || !xml.trim()}
                onClick={() => void handleInitiate()}
                className="gap-1.5"
              >
                {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                Inițiază transmitere
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions list */}
      {submissions.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Nicio transmitere"
          label="Apasă «Transmite factură» pentru a iniția un submit ANAF cu aprobare obligatorie."
        />
      ) : (
        <div className="space-y-2">
          {submissions.map((s) => {
            const isOk = s.status === "ok"
            const isNok = s.status === "nok" || s.status === "error"
            const borderColor = isOk
              ? "border-l-eos-success"
              : s.status === "approved"
                ? "border-l-eos-success"
              : isNok
                ? "border-l-eos-error"
                : s.status === "pending_approval"
                  ? "border-l-eos-warning"
                  : "border-l-eos-primary"

            return (
              <Card key={s.id} className={`border border-l-[3px] ${borderColor} border-eos-border bg-eos-surface`}>
                <CardContent className="space-y-2 py-3 px-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-eos-text">{s.invoiceId}</p>
                    <Badge
                      variant={SUBMIT_STATUS_VARIANT[s.status] ?? "outline"}
                      className={`text-[10px] normal-case tracking-normal ${(isOk || s.status === "approved") ? "bg-eos-success-soft text-eos-success" : ""}`}
                    >
                      {SPV_STATUS_LABELS[s.status]}
                    </Badge>
                    <span className="text-xs text-eos-text-muted">CIF: {s.cif}</span>
                  </div>

                  {s.status === "approved" && (
                    <p className="text-xs font-medium text-eos-success">
                      Aprobarea este gata. Următorul pas este trimiterea efectivă la ANAF.
                    </p>
                  )}

                  {s.indexDescarcare && (
                    <p className="font-mono text-xs text-eos-text-muted">
                      Index ANAF: {s.indexDescarcare}
                    </p>
                  )}
                  {s.anafMessage && (
                    <p className="text-xs text-eos-text-muted">{s.anafMessage}</p>
                  )}
                  {s.errorDetail && (
                    <p className="text-xs text-eos-error">{s.errorDetail}</p>
                  )}
                  <p className="text-xs text-eos-text-muted">
                    {new Date(s.createdAtISO).toLocaleString("ro-RO")}
                    {s.submittedAtISO && <> · Transmis: {new Date(s.submittedAtISO).toLocaleString("ro-RO")}</>}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {s.status === "pending_approval" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={approving === s.id}
                          onClick={() => void handleApprove(s)}
                          className="gap-1.5"
                        >
                          {approving === s.id
                            ? <Loader2 className="size-3.5 animate-spin" />
                            : <ShieldCheck className="size-3.5" />}
                          Aprobă acum
                        </Button>
                        <a
                          href="/dashboard/approvals"
                          className="flex items-center gap-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-1.5 text-xs font-medium text-eos-text hover:bg-eos-surface-hover"
                        >
                          <ExternalLink className="size-3" /> Deschide aprobări
                        </a>
                      </>
                    )}
                    {s.status === "approved" && (
                      <Button
                        size="default"
                        variant="default"
                        disabled={executing === s.id || integrationStatus?.tokenState !== "active" || integrationStatus?.mode === "mock"}
                        onClick={() => void handleExecute(s.id)}
                        className="gap-1.5 shadow-sm"
                      >
                        {executing === s.id
                          ? <Loader2 className="size-3.5 animate-spin" />
                          : <Send className="size-3.5" />}
                        Trimite la ANAF
                      </Button>
                    )}
                    {s.status === "submitted" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={polling === s.id}
                        onClick={() => void handlePollStatus(s.id)}
                        className="gap-1.5"
                      >
                        {polling === s.id
                          ? <Loader2 className="size-3.5 animate-spin" />
                          : <RefreshCw className="size-3.5" />}
                        Verifică status
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function FiscalPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const findingIdParam = searchParams.get("findingId")
  const anafStatusParam = searchParams.get("anaf")
  const anafModeParam = searchParams.get("mode")
  const [validatorBusy, setValidatorBusy] = useState(false)
  const [repairBusy, setRepairBusy] = useState(false)
  const [validations, setValidations] = useState<EFacturaValidationRecord[]>([])
  const [statusFinding, setStatusFinding] = useState<ScanFinding | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const fromCockpit = (tabParam === "spv" || tabParam === "validator" || tabParam === "status") && Boolean(findingIdParam)
  const defaultTab =
    tabParam === "spv" ||
    tabParam === "validator" ||
    tabParam === "status" ||
    tabParam === "transmitere" ||
    tabParam === "semnale"
      ? tabParam
      : "discrepante"

  useEffect(() => {
    if (!anafStatusParam) return
    if (anafStatusParam === "connected") {
      toast.success("ANAF conectat", {
        description:
          anafModeParam === "real"
            ? "Conexiunea a fost autorizată pentru producție."
            : "Conexiunea a fost autorizată pentru sandbox-ul oficial ANAF.",
      })
      return
    }

    const descriptions: Record<string, string> = {
      "missing-config": "Lipsesc variabilele ANAF pentru a porni conectarea.",
      "missing-code": "ANAF nu a returnat codul de autorizare.",
      "missing-org": "Nu am putut lega autorizarea de organizația curentă.",
      "token-failed": "Schimbul de token ANAF a eșuat.",
      "oauth-error": "Autorizarea a fost anulată sau respinsă în portalul ANAF.",
    }
    toast.error("Conectare ANAF eșuată", {
      description: descriptions[anafStatusParam] ?? "Autorizarea ANAF nu a putut fi finalizată.",
    })
  }, [anafModeParam, anafStatusParam])

  useEffect(() => {
    if (tabParam !== "status" || !findingIdParam) {
      setStatusFinding(null)
      return
    }

    setStatusLoading(true)
    fetch(`/api/findings/${encodeURIComponent(findingIdParam)}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Nu am putut încărca finding-ul fiscal.")
        return response.json() as Promise<{ finding: ScanFinding }>
      })
      .then((payload) => {
        setStatusFinding(payload.finding)
      })
      .catch(() => {
        setStatusFinding(null)
        toast.error("Nu am putut încărca protocolul fiscal.")
      })
      .finally(() => setStatusLoading(false))
  }, [findingIdParam, tabParam])

  async function handleValidateXml(input: { documentName: string; xml: string }) {
    setValidatorBusy(true)
    try {
      const response = await fetch("/api/efactura/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const payload = (await response.json()) as {
        error?: string
        message?: string
        validation?: EFacturaValidationRecord
      }
      if (!response.ok) throw new Error(payload.error || "Validarea XML a eșuat.")
      if (payload.validation) {
        setValidations((current) => [payload.validation!, ...current.filter((item) => item.id !== payload.validation!.id)].slice(0, 10))
      }
      toast.success(payload.validation?.valid ? "XML validat" : "XML cu probleme", {
        description:
          payload.message ||
          (payload.validation?.valid
            ? "Factura trece validarea structurală de bază."
            : "Corectează XML-ul și validează din nou înainte de transmitere."),
      })
      return payload.validation ?? null
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la validarea XML."
      toast.error("Validare eșuată", { description: message })
      throw error
    } finally {
      setValidatorBusy(false)
    }
  }

  async function handleRepairXml(input: {
    documentName: string
    xml: string
    errorCodes?: string[]
  }) {
    setRepairBusy(true)
    try {
      const response = await fetch("/api/efactura/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const payload = (await response.json()) as {
        error?: string
        message?: string
        repair?: EFacturaXmlRepairRecord
      }
      if (!response.ok) throw new Error(payload.error || "Nu am putut genera corecțiile XML.")
      toast.success(
        payload.repair && payload.repair.appliedFixes.length > 0 ? "Corecții XML pregătite" : "Nu există fixuri automate sigure",
        {
          description:
            payload.message ||
            (payload.repair && payload.repair.appliedFixes.length > 0
              ? "Revizuiește XML-ul reparat și retransmite-l manual."
              : "Corecția rămâne manuală în ERP sau în exportul XML."),
        }
      )
      return payload.repair ?? null
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la generarea corecțiilor XML."
      toast.error("Reparare eșuată", { description: message })
      throw error
    } finally {
      setRepairBusy(false)
    }
  }

  const statusRecipe = statusFinding ? buildCockpitRecipe(statusFinding) : null
  const statusGuide =
    statusFinding && statusRecipe
      ? buildFiscalStatusInterpreterGuide(statusRecipe.findingTypeId, statusFinding)
      : null

  return (
    <div className="space-y-8">
      {fromCockpit && (
        <div className="flex items-start gap-3 rounded-eos-md border border-eos-warning/30 bg-eos-warning/5 px-4 py-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-eos-warning" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-eos-text">
              Vii din cockpit pentru un finding fiscal
            </p>
            <p className="mt-0.5 text-xs text-eos-text-muted">
              {tabParam === "validator"
                ? "Validează sau repară XML-ul de mai jos, apoi folosește nota pregătită de CompliAI când revii în finding cu confirmarea retransmiterii și statusul SPV."
                : tabParam === "status"
                  ? "Urmează protocolul fiscal de mai jos, apoi revino în cockpit cu nota pregătită și dovada finală din SPV."
                : "Rulează verificarea SPV de mai jos pentru a confirma statusul. Dovada obținută o poți adăuga direct în finding."}
            </p>
          </div>
          <a
            href={`/dashboard/resolve/${findingIdParam}`}
            className="flex shrink-0 items-center gap-1 text-xs text-eos-primary hover:underline"
          >
            <ArrowLeft className="size-3" />
            Înapoi la finding
          </a>
        </div>
      )}

      <PageIntro
        eyebrow="Fiscal"
        title="Monitorizezi conformitatea fiscala"
        description="Discrepante e-TVA, depuneri fiscale si scor de disciplina. Urmaresti termenele ANAF si documentezi raspunsurile."
        badges={
          <Badge variant="outline" className="normal-case tracking-normal">
            ANAF · e-TVA · SAF-T
          </Badge>
        }
      />

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="gap-0 border-b border-eos-border text-eos-text-muted">
          <TabsTrigger
            value="discrepante"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <AlertTriangle className="mr-1.5 size-3.5" />
            Discrepante e-TVA
          </TabsTrigger>
          <TabsTrigger
            value="depuneri"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <FileText className="mr-1.5 size-3.5" />
            Depuneri fiscale
          </TabsTrigger>
          <TabsTrigger
            value="spv"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <ShieldCheck className="mr-1.5 size-3.5" />
            SPV Check
          </TabsTrigger>
          <TabsTrigger
            value="status"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <Clock className="mr-1.5 size-3.5" />
            Protocol fiscal
          </TabsTrigger>
          <TabsTrigger
            value="validator"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <FileCode2 className="mr-1.5 size-3.5" />
            Validator XML
          </TabsTrigger>
          <TabsTrigger
            value="semnale"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <Radio className="mr-1.5 size-3.5" />
            Semnale e-Factura
          </TabsTrigger>
          <TabsTrigger
            value="transmitere"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <Send className="mr-1.5 size-3.5" />
            Transmitere ANAF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discrepante">
          <DiscrepanciesTab />
        </TabsContent>

        <TabsContent value="depuneri">
          <FilingRecordsTab />
        </TabsContent>

        <TabsContent value="spv">
          <SpvCheckTab />
        </TabsContent>

        <TabsContent value="status">
          {statusLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted">
              <Loader2 className="size-4 animate-spin" />
              Se încarcă protocolul fiscal...
            </div>
          ) : !findingIdParam ? (
            <EmptyState
              icon={Clock}
              title="Deschide protocolul fiscal dintr-un finding"
              label="Tab-ul acesta se folosește când vii din cockpit pentru EF-004 sau EF-005."
            />
          ) : !statusGuide ? (
            <EmptyState
              icon={AlertTriangle}
              title="Protocol indisponibil pentru finding-ul curent"
              label="Protocolul fiscal din această suprafață este disponibil momentan pentru cazurile EF-004 și EF-005."
            />
          ) : (
            <div className="space-y-4">
              <FiscalStatusInterpreterCard guide={statusGuide} findingId={findingIdParam} />
              <FiscalExecutionLogCard
                findingId={findingIdParam}
                findingTypeId={statusGuide.findingTypeId}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="validator">
          <EFacturaValidatorCard
            validations={validations}
            busy={validatorBusy}
            repairBusy={repairBusy}
            onValidate={handleValidateXml}
            onRepair={handleRepairXml}
          />
        </TabsContent>

        <TabsContent value="semnale">
          <EFacturaSignalsTab />
        </TabsContent>

        <TabsContent value="transmitere">
          <SubmitSpvTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
