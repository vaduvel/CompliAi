"use client"

// Pay Transparency — HR-side requests dashboard
// Lista cereri + countdown + acțiuni Process / Answer / Escalate

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Clock, Loader2, MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"

type Question =
  | "own_salary"
  | "average_salary_role"
  | "gender_pay_gap"
  | "promotion_criteria"
  | "other"

type Status = "received" | "processing" | "answered" | "escalated"

type Request = {
  id: string
  token: string
  jobRole: string
  question: Question
  detail?: string | null
  employeeName?: string | null
  contactEmail?: string | null
  status: Status
  receivedAtISO: string
  deadlineISO: string
  daysRemaining: number
  answer?: string | null
}

const QUESTION_LABELS: Record<Question, string> = {
  own_salary: "Salariu propriu",
  average_salary_role: "Salariu mediu rol",
  gender_pay_gap: "Ecart salarial gen",
  promotion_criteria: "Criterii promovare",
  other: "Altă întrebare",
}

const STATUS_VARIANT: Record<Status, "default" | "secondary" | "outline" | "destructive"> = {
  received: "destructive",
  processing: "default",
  answered: "secondary",
  escalated: "outline",
}

const STATUS_LABELS: Record<Status, string> = {
  received: "Primită",
  processing: "În lucru",
  answered: "Răspuns trimis",
  escalated: "Escaladată",
}

export function PayTransparencyRequestsTab() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [answerForm, setAnswerForm] = useState<{ id: string; text: string } | null>(null)
  const [escalateForm, setEscalateForm] = useState<{ id: string; reason: string } | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/pay-transparency/requests", { cache: "no-store" })
      const d = await r.json()
      if (r.ok) setRequests(d.requests ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function transition(id: string, body: Record<string, unknown>) {
    setBusy(id)
    try {
      const r = await fetch(`/api/pay-transparency/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? "Eroare")
      toast.success("Status actualizat")
      await load()
      setAnswerForm(null)
      setEscalateForm(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare")
    } finally {
      setBusy(null)
    }
  }

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "received" || r.status === "processing").length,
      urgent: requests.filter(
        (r) => r.daysRemaining <= 7 && r.status !== "answered" && r.status !== "escalated",
      ).length,
      answered: requests.filter((r) => r.status === "answered").length,
    }
  }, [requests])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" /> Se încarcă...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="În lucru" value={stats.pending} tone={stats.pending > 0 ? "default" : "muted"} />
        <StatCard label="Urgente (≤7 zile)" value={stats.urgent} tone={stats.urgent > 0 ? "warning" : "muted"} />
        <StatCard label="Rezolvate" value={stats.answered} tone="success" />
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Nicio cerere încă"
          label="Când angajații folosesc portalul public, cererile apar aici."
        />
      ) : (
        <div className="space-y-2">
          {requests.map((req) => {
            const overdue = req.daysRemaining < 0
            const urgent = req.daysRemaining <= 7 && req.daysRemaining >= 0
            const borderClass = overdue
              ? "border-l-eos-error"
              : urgent
                ? "border-l-eos-warning"
                : req.status === "answered"
                  ? "border-l-eos-success"
                  : "border-l-eos-border-subtle"
            return (
              <Card key={req.id} className={`border border-l-[3px] ${borderClass} border-eos-border bg-eos-surface`}>
                <CardContent className="space-y-3 py-3 px-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-eos-text">
                      {QUESTION_LABELS[req.question]}
                    </p>
                    <Badge variant={STATUS_VARIANT[req.status]} className="text-[10px] normal-case tracking-normal">
                      {STATUS_LABELS[req.status]}
                    </Badge>
                    <span className="text-xs text-eos-text-muted">Rol: {req.jobRole}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-eos-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      Termen: {new Date(req.deadlineISO).toLocaleDateString("ro-RO")}
                      {overdue ? (
                        <span className="ml-1 text-eos-error">({Math.abs(req.daysRemaining)} zile depășit)</span>
                      ) : (
                        <span className={`ml-1 ${urgent ? "text-eos-warning" : ""}`}>
                          ({req.daysRemaining} zile rămase)
                        </span>
                      )}
                    </span>
                    {req.employeeName && <span>De la: {req.employeeName}</span>}
                    {req.contactEmail && <span>Email: {req.contactEmail}</span>}
                  </div>

                  {req.detail && (
                    <p className="rounded-eos-md bg-eos-bg-inset p-2 text-xs text-eos-text-muted">
                      {req.detail}
                    </p>
                  )}

                  {req.status === "answered" && req.answer && (
                    <div className="rounded-eos-md border border-eos-success/30 bg-eos-success/5 p-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-eos-success">
                        Răspuns trimis
                      </p>
                      <pre className="mt-1 whitespace-pre-wrap text-xs text-eos-text">{req.answer}</pre>
                    </div>
                  )}

                  {/* Actions */}
                  {req.status !== "answered" && req.status !== "escalated" && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {req.status === "received" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === req.id}
                          onClick={() => void transition(req.id, { action: "process" })}
                        >
                          Procesează
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={busy === req.id}
                        className="gap-1.5"
                        onClick={() => setAnswerForm({ id: req.id, text: "" })}
                      >
                        <Send className="size-3.5" /> Răspunde
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === req.id}
                        onClick={() => setEscalateForm({ id: req.id, reason: "" })}
                      >
                        Escaladează
                      </Button>
                    </div>
                  )}

                  {/* Answer form inline */}
                  {answerForm?.id === req.id && (
                    <div className="space-y-2 rounded-eos-md border border-eos-primary/30 bg-eos-primary/5 p-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-eos-primary">
                        Răspuns către angajat
                      </p>
                      <textarea
                        rows={6}
                        className="w-full rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-xs text-eos-text"
                        placeholder="Compune răspunsul (Markdown ok). GDPR: agregat la nivel de rol/categorie."
                        value={answerForm.text}
                        onChange={(e) => setAnswerForm({ ...answerForm, text: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={!answerForm.text.trim() || busy === req.id}
                          onClick={() =>
                            void transition(req.id, { action: "answer", answer: answerForm.text })
                          }
                        >
                          {busy === req.id && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                          Trimite răspuns
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setAnswerForm(null)}>
                          Anulează
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Escalate form inline */}
                  {escalateForm?.id === req.id && (
                    <div className="space-y-2 rounded-eos-md border border-eos-warning/30 bg-eos-warning/5 p-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-eos-warning">
                        Motiv escaladare
                      </p>
                      <input
                        type="text"
                        className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface px-3 text-xs text-eos-text"
                        placeholder="ex: Trimis la legal pentru analiză"
                        value={escalateForm.reason}
                        onChange={(e) => setEscalateForm({ ...escalateForm, reason: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!escalateForm.reason.trim() || busy === req.id}
                          onClick={() =>
                            void transition(req.id, { action: "escalate", reason: escalateForm.reason })
                          }
                        >
                          Confirmă escaladare
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEscalateForm(null)}>
                          Anulează
                        </Button>
                      </div>
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

function StatCard({
  label,
  value,
  tone = "muted",
}: {
  label: string
  value: number
  tone?: "muted" | "default" | "warning" | "success"
}) {
  const toneClass =
    tone === "warning"
      ? "text-eos-warning"
      : tone === "success"
        ? "text-eos-success"
        : tone === "default"
          ? "text-eos-text"
          : "text-eos-text-muted"
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-eos-text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  )
}
