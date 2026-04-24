"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"
import { SPV_STATUS_LABELS, type SPVSubmission } from "@/lib/fiscal/spv-submission"

export type EFacturaIntegrationStatus = {
  mode: "mock" | "test" | "real"
  environment: "test" | "prod"
  productionUnlocked: boolean
  connected: boolean
  syncedAtISO: string | null
  tokenState: "missing" | "present" | "expired"
  tokenExpiresAtISO: string | null
  persistenceBackend: "supabase" | "local"
  lastSubmissionStatus: keyof typeof SPV_STATUS_LABELS | null
  lastSubmissionAtISO: string | null
  lastSubmissionError: string | null
  lastSubmissionErrorCategory:
    | "reauth_required"
    | "draft_missing"
    | "service_unavailable"
    | "payload_rejected"
    | "unknown"
    | null
  lastSubmissionNextStep: string | null
  operationalState:
    | "demo_only"
    | "not_configured"
    | "connect_required"
    | "reauth_required"
    | "authorized_pending_sync"
    | "attention_required"
    | "operational"
  statusLabel: string
  statusDetail: string
  ready: boolean
  productionReady: boolean
  canAttemptUpload: boolean
  missingConfig: string[]
  message: string
}

type SubmissionErrorCategory =
  | "reauth_required"
  | "draft_missing"
  | "service_unavailable"
  | "payload_rejected"
  | "unknown"

function diagnoseSubmissionError(errorDetail: string | null | undefined): SubmissionErrorCategory | null {
  if (!errorDetail) return null
  if (/401|unauthorized|token anaf expirat|reconectează contul anaf/i.test(errorDetail)) {
    return "reauth_required"
  }
  if (/xml-ul nu mai este disponibil|xml no longer cached/i.test(errorDetail)) {
    return "draft_missing"
  }
  if (/fetch failed|network|timeout|503|502|service unavailable/i.test(errorDetail.toLowerCase())) {
    return "service_unavailable"
  }
  if (/upload failed 4|xml_erori|nok|payload/i.test(errorDetail.toLowerCase())) {
    return "payload_rejected"
  }
  return "unknown"
}

// ── Submit ANAF Tab ───────────────────────────────────────────────────────────

const SUBMIT_STATUS_TONE: Record<string, string> = {
  pending_approval: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
  approved: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  rejected: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  submitting: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
  submitted: "border-eos-primary/30 bg-eos-primary/10 text-eos-primary",
  ok: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  nok: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  error: "border-eos-error/30 bg-eos-error-soft text-eos-error",
}

const MODE_TONE: Record<string, string> = {
  real: "border-eos-primary/30 bg-eos-primary/10 text-eos-primary",
  test: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
  mock: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
}

export function SubmitSpvTab({
  sourceFindingId,
  fromCockpit,
  returnToFindingHref,
}: {
  sourceFindingId?: string | null
  fromCockpit?: boolean
  returnToFindingHref?: string | null
}) {
  const [submissions, setSubmissions] = useState<SPVSubmission[]>([])
  const [integrationStatus, setIntegrationStatus] = useState<EFacturaIntegrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [approving, setApproving] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [executing, setExecuting] = useState<string | null>(null)
  const [polling, setPolling] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [xml, setXml] = useState("")
  const [invoiceId, setInvoiceId] = useState("")
  const [draftSourceFindingId, setDraftSourceFindingId] = useState(sourceFindingId ?? "")
  const anafConnectHref = sourceFindingId
    ? `/api/anaf/connect?returnTo=${encodeURIComponent(`/dashboard/fiscal?tab=transmitere&findingId=${sourceFindingId}`)}`
    : "/api/anaf/connect?returnTo=/dashboard/fiscal?tab=transmitere"

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
    setDraftSourceFindingId(sourceFindingId ?? "")
  }, [sourceFindingId])

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
        body: JSON.stringify({
          xmlContent: xml,
          invoiceId: invoiceId || undefined,
          sourceFindingId: draftSourceFindingId || undefined,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; submission?: SPVSubmission; error?: string; message?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la inițierea transmiterii.")
      if (data.submission) setSubmissions((prev) => [data.submission!, ...prev])
      setXml("")
      setInvoiceId("")
      setShowForm(false)
      toast.success("Transmitere creată", {
        description: fromCockpit
          ? "Draftul rămâne legat de cazul fiscal curent și îl poți aproba direct aici."
          : "Poți aproba direct aici sau din pagina Aprobări.",
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

  async function handleReject(submission: SPVSubmission) {
    setRejecting(submission.id)
    try {
      const res = await fetch(`/api/approvals/${encodeURIComponent(submission.approvalActionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "rejected" }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Nu am putut respinge transmiterea.")

      await refreshTab(true)
      toast.info("Transmitere respinsă", {
        description: "Draftul a rămas în istoric și poți crea imediat unul nou din acest tab.",
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nu am putut respinge transmiterea.")
    } finally {
      setRejecting(null)
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
        await refreshTab(true)
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
        await refreshTab(true)
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

  function openRetryDraft(submission: SPVSubmission) {
    setInvoiceId(`${submission.invoiceId}-retry`)
    setXml("")
    setDraftSourceFindingId(submission.sourceFindingId ?? sourceFindingId ?? "")
    setShowForm(true)
  }

  function toggleNewDraftForm() {
    setDraftSourceFindingId(sourceFindingId ?? "")
    setShowForm((current) => !current)
  }

  if (loading)
    return (
      <div className="flex items-center gap-2 py-8 text-[12.5px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Se incarca...
      </div>
    )

  const pendingCount = submissions.filter((s) => s.status === "pending_approval").length

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <section className="flex items-start gap-3 overflow-hidden rounded-eos-lg border border-eos-primary/25 bg-eos-primary/5 px-4 py-3.5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-eos-primary" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <p
            data-display-text="true"
            className="font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Transmitere ANAF cu dublu aprobare
          </p>
          <p className="mt-1 text-[12px] leading-[1.55] text-eos-text-muted">
            {fromCockpit ? (
              "Transmiterea ramane legata de cazul fiscal din care ai venit. Poti aproba, respinge si trimite direct din acest tab, fara sa pierzi contextul."
            ) : (
              <>
                Orice transmitere necesita aprobare manuala inainte de upload. Poti aproba direct din acest tab sau din{" "}
                <a href="/dashboard/approvals" className="text-eos-primary hover:underline">
                  pagina Aprobari
                </a>
                .
              </>
            )}
          </p>
        </div>
      </section>

      {integrationStatus && (
        <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
          <header className="border-b border-eos-border-subtle px-4 py-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h3
                    data-display-text="true"
                    className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
                  >
                    Conexiune ANAF pentru transmitere
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium ${MODE_TONE[integrationStatus.mode] ?? MODE_TONE.mock}`}
                  >
                    {integrationStatus.mode === "real"
                      ? "Productie"
                      : integrationStatus.mode === "test"
                        ? "Sandbox ANAF"
                        : "Demo local"}
                  </span>
                </div>
                <p className="text-[12px] leading-[1.55] text-eos-text-muted">{integrationStatus.message}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={anafConnectHref}
                  className="inline-flex h-[30px] items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 font-mono text-[11px] font-medium text-eos-text transition-colors hover:border-eos-border-strong hover:text-eos-text"
                >
                  <ShieldCheck className="size-3" strokeWidth={2} />
                  {integrationStatus.tokenState === "missing" ? "Conecteaza ANAF" : "Reautentifica ANAF"}
                </a>
                <a
                  href="/dashboard/settings"
                  className="inline-flex h-[30px] items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 font-mono text-[11px] font-medium text-eos-text transition-colors hover:border-eos-border-strong hover:text-eos-text"
                >
                  <ExternalLink className="size-3" strokeWidth={2} />
                  Setari
                </a>
              </div>
            </div>
          </header>

          <div className="grid gap-3 px-4 py-4 md:grid-cols-4">
            <div className="rounded-eos-sm border border-eos-border-subtle bg-white/[0.02] p-3">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Token
              </p>
              <p className="mt-1.5 text-[13px] font-semibold text-eos-text">
                {integrationStatus.tokenState === "present"
                  ? integrationStatus.operationalState === "reauth_required"
                    ? "Prezent, dar respins"
                    : "Prezent"
                  : integrationStatus.tokenState === "expired"
                    ? "Expirat"
                    : "Lipsa"}
              </p>
              {integrationStatus.tokenExpiresAtISO && (
                <p className="mt-1 font-mono text-[11px] text-eos-text-muted">
                  Expira: {new Date(integrationStatus.tokenExpiresAtISO).toLocaleString("ro-RO")}
                </p>
              )}
            </div>
            <div className="rounded-eos-sm border border-eos-border-subtle bg-white/[0.02] p-3">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Mediu
              </p>
              <p className="mt-1.5 text-[13px] font-semibold text-eos-text">
                {integrationStatus.environment === "prod" ? "ANAF prod" : "ANAF test"}
              </p>
              <p className="mt-1 font-mono text-[11px] text-eos-text-muted">
                {integrationStatus.productionUnlocked
                  ? "Productia este deblocata explicit."
                  : "Submitul real ramane blocat."}
              </p>
              <p className="mt-1 font-mono text-[11px] text-eos-text-muted">
                Persistenta:{" "}
                {integrationStatus.persistenceBackend === "supabase" ? "durabila (Supabase)" : "fallback local"}
              </p>
            </div>
            <div className="rounded-eos-sm border border-eos-border-subtle bg-white/[0.02] p-3">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Stare operationala
              </p>
              <p className="mt-1.5 text-[13px] font-semibold text-eos-text">{integrationStatus.statusLabel}</p>
              <p className="mt-1 font-mono text-[11px] text-eos-text-muted">{integrationStatus.statusDetail}</p>
            </div>
            <div className="rounded-eos-sm border border-eos-border-subtle bg-white/[0.02] p-3">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Ultim sync
              </p>
              <p className="mt-1.5 text-[13px] font-semibold text-eos-text">
                {integrationStatus.syncedAtISO
                  ? new Date(integrationStatus.syncedAtISO).toLocaleString("ro-RO")
                  : "Inca nu exista"}
              </p>
              {integrationStatus.lastSubmissionStatus && (
                <p className="mt-1 font-mono text-[11px] text-eos-text-muted">
                  Ultima executie: {SPV_STATUS_LABELS[integrationStatus.lastSubmissionStatus]}
                  {integrationStatus.lastSubmissionAtISO
                    ? ` · ${new Date(integrationStatus.lastSubmissionAtISO).toLocaleString("ro-RO")}`
                    : ""}
                </p>
              )}
              {integrationStatus.missingConfig.length > 0 && (
                <p className="mt-1 font-mono text-[11px] text-eos-text-muted">
                  Lipsesc: {integrationStatus.missingConfig.join(", ")}
                </p>
              )}
              {integrationStatus.lastSubmissionError && (
                <div className="mt-1 space-y-1">
                  <p className="text-[11px] leading-[1.45] text-eos-error">{integrationStatus.lastSubmissionError}</p>
                  {integrationStatus.lastSubmissionNextStep && (
                    <p className="text-[11px] leading-[1.45] text-eos-warning">
                      Urmatorul pas: {integrationStatus.lastSubmissionNextStep}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {integrationStatus.lastSubmissionErrorCategory && integrationStatus.lastSubmissionNextStep && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-eos-border-subtle bg-eos-warning/5 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p
                  data-display-text="true"
                  className="font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
                >
                  Ultima executie ANAF cere interventie clara
                </p>
                <p className="mt-1 text-[12px] leading-[1.55] text-eos-text-muted">
                  {integrationStatus.lastSubmissionNextStep}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {integrationStatus.lastSubmissionErrorCategory === "reauth_required" && (
                  <a
                    href={anafConnectHref}
                    className="inline-flex h-[30px] items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 font-mono text-[11px] font-medium text-eos-text transition-colors hover:border-eos-border-strong hover:text-eos-text"
                  >
                    <ShieldCheck className="size-3" strokeWidth={2} />
                    Reautentifica acum
                  </a>
                )}
                {(integrationStatus.lastSubmissionErrorCategory === "draft_missing" ||
                  integrationStatus.lastSubmissionErrorCategory === "payload_rejected") && (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={toggleNewDraftForm}>
                    <Upload className="size-3.5" strokeWidth={2} />
                    Creeaza draft nou
                  </Button>
                )}
                {integrationStatus.lastSubmissionErrorCategory === "service_unavailable" && (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void refreshTab(true)}>
                    <RefreshCw className="size-3.5" strokeWidth={2} />
                    Reincarca starea
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
            {pendingCount} asteapta aprobare
          </span>
          {fromCockpit && sourceFindingId && (
            <span className="inline-flex items-center rounded-sm border border-eos-primary/25 bg-eos-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-primary">
              Legat de cazul fiscal
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {fromCockpit && returnToFindingHref && (
            <a
              href={returnToFindingHref}
              className="inline-flex h-[30px] items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 font-mono text-[11px] font-medium text-eos-text transition-colors hover:border-eos-border-strong hover:text-eos-text"
            >
              <ArrowLeft className="size-3" strokeWidth={2} />
              Inapoi la finding
            </a>
          )}
          <Button size="sm" className="gap-1.5" onClick={toggleNewDraftForm}>
            <Upload className="size-3.5" strokeWidth={2} /> Transmite factura
          </Button>
        </div>
      </div>

      {/* Submit form */}
      {showForm && (
        <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
          <header className="border-b border-eos-border-subtle px-4 py-3.5">
            <h3
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Transmite factura la ANAF
            </h3>
          </header>
          <div className="space-y-3 px-4 py-4">
            <label className="block">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                ID factura (optional)
              </span>
              <input
                className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-border-strong"
                placeholder="ex: FAC-2026-001"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                XML UBL factura
              </span>
              <textarea
                className="mt-1.5 h-40 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2 font-mono text-[11px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-border-strong"
                placeholder='<?xml version="1.0" encoding="UTF-8"?>&#10;<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">...'
                value={xml}
                onChange={(e) => setXml(e.target.value)}
              />
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Anuleaza
              </Button>
              <Button
                size="sm"
                disabled={submitting || !xml.trim()}
                onClick={() => void handleInitiate()}
                className="gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                ) : (
                  <Send className="size-3.5" strokeWidth={2} />
                )}
                Initiaza transmitere
              </Button>
            </div>
            {fromCockpit && sourceFindingId && (
              <p className="text-[12px] leading-[1.5] text-eos-text-muted">
                Draftul nou va ramane legat de cazul fiscal curent si il poti redeschide direct din aceasta lista dupa aprobare sau verdict.
              </p>
            )}
            {!fromCockpit && draftSourceFindingId && (
              <p className="text-[12px] leading-[1.5] text-eos-text-muted">
                Draftul nou pastreaza legatura cu cazul fiscal initial, pentru ca verdictul si dovada sa revina in acelasi cockpit.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Submissions list */}
      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-eos-lg border border-dashed border-eos-border bg-eos-surface/40 px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full border border-eos-border bg-eos-surface">
            <Send className="size-4 text-eos-text-tertiary" strokeWidth={1.8} />
          </div>
          <div className="max-w-md space-y-1">
            <p
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Nicio transmitere
            </p>
            <p className="text-[12.5px] leading-[1.55] text-eos-text-muted">
              Apasa «Transmite factura» pentru a initia un submit ANAF cu aprobare obligatorie.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((s) => {
            const isOk = s.status === "ok"
            const isNok = s.status === "nok" || s.status === "error"
            const hasFinalVerdict = s.status === "ok" || s.status === "nok"
            const submissionErrorCategory = diagnoseSubmissionError(s.errorDetail)
            const linkedFindingHref = s.sourceFindingId
              ? `/dashboard/resolve/${encodeURIComponent(s.sourceFindingId)}`
              : null
            const severityBar = isOk
              ? "bg-eos-success"
              : s.status === "approved"
                ? "bg-eos-success"
                : isNok
                  ? "bg-eos-error"
                  : s.status === "pending_approval"
                    ? "bg-eos-warning"
                    : "bg-eos-primary"
            const statusTone = SUBMIT_STATUS_TONE[s.status] ?? SUBMIT_STATUS_TONE.pending_approval

            return (
              <article
                key={s.id}
                className="relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface"
              >
                <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${severityBar}`} aria-hidden />
                <div className="space-y-2 py-3 pl-5 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text">
                      {s.invoiceId}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium ${statusTone}`}
                    >
                      {SPV_STATUS_LABELS[s.status]}
                    </span>
                    <span className="font-mono text-[11px] text-eos-text-muted">CIF: {s.cif}</span>
                  </div>

                  {s.status === "approved" && (
                    <p className="text-[12px] font-medium leading-[1.5] text-eos-success">
                      Aprobarea este gata. Urmatorul pas este trimiterea efectiva la ANAF.
                    </p>
                  )}
                  {s.status === "approved" && integrationStatus?.canAttemptUpload !== true && (
                    <p className="text-[12px] leading-[1.5] text-eos-warning">
                      Uploadul este blocat pana cand conexiunea ANAF devine operationala. Verifica starea de mai sus si reautentifica doar daca este cerut explicit.
                    </p>
                  )}
                  {hasFinalVerdict && linkedFindingHref && (
                    <p className={`text-[12px] leading-[1.5] ${s.status === "ok" ? "text-eos-success" : "text-eos-warning"}`}>
                      {s.status === "ok"
                        ? "Verdict final primit. Cazul fiscal legat a fost mutat in monitorizare, iar dovada finala este salvata in rezolutia cazului."
                        : "Verdict final primit. Cazul fiscal legat a fost redeschis cu eroarea ANAF si asteapta corectie."}
                    </p>
                  )}
                  {hasFinalVerdict && !linkedFindingHref && (
                    <p className={`text-[12px] leading-[1.5] ${s.status === "ok" ? "text-eos-success" : "text-eos-warning"}`}>
                      {s.status === "ok"
                        ? "ANAF a acceptat transmiterea. Pastreaza indexul si mesajul pentru audit."
                        : "ANAF a respins transmiterea. Corecteaza factura si retransmite."}
                    </p>
                  )}

                  {s.indexDescarcare && (
                    <p className="font-mono text-[11px] text-eos-text-muted">Index ANAF: {s.indexDescarcare}</p>
                  )}
                  {s.downloadId && (
                    <p className="font-mono text-[11px] text-eos-text-muted">Download ANAF: {s.downloadId}</p>
                  )}
                  {s.anafMessage && <p className="text-[12px] leading-[1.5] text-eos-text-muted">{s.anafMessage}</p>}
                  {s.errorDetail && (
                    <div className="space-y-1">
                      <p className="text-[12px] leading-[1.5] text-eos-error">{s.errorDetail}</p>
                      {integrationStatus?.lastSubmissionStatus === s.status && integrationStatus.lastSubmissionNextStep && (
                        <p className="text-[12px] leading-[1.5] text-eos-warning">
                          Urmatorul pas: {integrationStatus.lastSubmissionNextStep}
                        </p>
                      )}
                    </div>
                  )}
                  <p className="font-mono text-[11px] text-eos-text-muted">
                    {new Date(s.createdAtISO).toLocaleString("ro-RO")}
                    {s.submittedAtISO && <> · Transmis: {new Date(s.submittedAtISO).toLocaleString("ro-RO")}</>}
                    {s.resolvedAtISO && <> · Verdict: {new Date(s.resolvedAtISO).toLocaleString("ro-RO")}</>}
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
                          {approving === s.id ? (
                            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                          ) : (
                            <ShieldCheck className="size-3.5" strokeWidth={2} />
                          )}
                          Aproba acum
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={rejecting === s.id}
                          onClick={() => void handleReject(s)}
                          className="gap-1.5"
                        >
                          {rejecting === s.id ? (
                            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                          ) : (
                            <AlertTriangle className="size-3.5" strokeWidth={2} />
                          )}
                          Respinge
                        </Button>
                        <a
                          href="/dashboard/approvals"
                          className="inline-flex h-[30px] items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 font-mono text-[11px] font-medium text-eos-text transition-colors hover:border-eos-border-strong hover:text-eos-text"
                        >
                          <ExternalLink className="size-3" strokeWidth={2} /> Deschide aprobari
                        </a>
                      </>
                    )}
                    {s.status === "approved" && (
                      <Button
                        size="default"
                        variant="default"
                        disabled={executing === s.id || integrationStatus?.canAttemptUpload !== true}
                        onClick={() => void handleExecute(s.id)}
                        className="gap-1.5 shadow-sm"
                      >
                        {executing === s.id ? (
                          <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                        ) : (
                          <Send className="size-3.5" strokeWidth={2} />
                        )}
                        Trimite la ANAF
                      </Button>
                    )}
                    {s.status === "error" && submissionErrorCategory !== "draft_missing" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={executing === s.id || integrationStatus?.canAttemptUpload !== true}
                        onClick={() => void handleExecute(s.id)}
                        className="gap-1.5"
                      >
                        {executing === s.id ? (
                          <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                        ) : (
                          <Send className="size-3.5" strokeWidth={2} />
                        )}
                        Retrimite la ANAF
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
                        {polling === s.id ? (
                          <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                        ) : (
                          <RefreshCw className="size-3.5" strokeWidth={2} />
                        )}
                        Verifica status
                      </Button>
                    )}
                    {(s.status === "error" || s.status === "rejected" || s.status === "nok") &&
                      (submissionErrorCategory === "draft_missing" || submissionErrorCategory === "payload_rejected") && (
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openRetryDraft(s)}>
                          <Upload className="size-3.5" strokeWidth={2} />
                          Creeaza draft nou
                        </Button>
                      )}
                    {(s.status === "error" || s.status === "submitted") &&
                      submissionErrorCategory === "reauth_required" && (
                        <a
                          href={anafConnectHref}
                          className="inline-flex h-[30px] items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 font-mono text-[11px] font-medium text-eos-text transition-colors hover:border-eos-border-strong hover:text-eos-text"
                        >
                          <ShieldCheck className="size-3" strokeWidth={2} />
                          Reautentifica acum
                        </a>
                      )}
                    {(s.status === "error" || s.status === "submitted") &&
                      submissionErrorCategory === "service_unavailable" && (
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void refreshTab(true)}>
                          <RefreshCw className="size-3.5" strokeWidth={2} />
                          Reincarca starea
                        </Button>
                      )}
                    {linkedFindingHref && (
                      <a
                        href={linkedFindingHref}
                        className="inline-flex h-[30px] items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 font-mono text-[11px] font-medium text-eos-text transition-colors hover:border-eos-border-strong hover:text-eos-text"
                      >
                        <ExternalLink className="size-3" strokeWidth={2} />
                        Deschide cazul fiscal
                      </a>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
