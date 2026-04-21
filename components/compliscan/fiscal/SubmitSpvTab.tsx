"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Plus,
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

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted"><Loader2 className="size-4 animate-spin" /> Se încarcă...</div>

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-eos-md border border-eos-primary/20 bg-eos-primary/5 px-4 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-eos-primary" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium text-eos-text">Transmitere ANAF cu dublu aprobare</p>
          <p className="mt-0.5 text-xs text-eos-text-muted">
            {fromCockpit
              ? "Transmiterea rămâne legată de cazul fiscal din care ai venit. Poți aproba, respinge și trimite direct din acest tab, fără să pierzi contextul."
              : <>Orice transmitere necesită aprobare manuală înainte de upload. Poți aproba direct din acest tab sau din{" "}
                  <a href="/dashboard/approvals" className="text-eos-primary hover:underline">pagina Aprobări</a>.
                </>}
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
                  href={anafConnectHref}
                  className="inline-flex items-center gap-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-1.5 text-xs font-medium text-eos-text hover:bg-eos-surface-hover"
                >
                  <ShieldCheck className="size-3" />
                  {integrationStatus.tokenState === "missing" ? "Conectează ANAF" : "Reautentifică ANAF"}
                </a>
                <a
                  href="/dashboard/setari"
                  className="inline-flex items-center gap-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-1.5 text-xs font-medium text-eos-text hover:bg-eos-surface-hover"
                >
                  <ExternalLink className="size-3" />
                  Setări
                </a>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-eos-text-muted">Token</p>
                <p className="mt-1 text-sm font-medium text-eos-text">
                  {integrationStatus.tokenState === "present"
                    ? integrationStatus.operationalState === "reauth_required"
                      ? "Prezent, dar respins"
                      : "Prezent"
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
                <p className="mt-1 text-xs text-eos-text-muted">
                  Persistență: {integrationStatus.persistenceBackend === "supabase" ? "durabilă (Supabase)" : "fallback local"}
                </p>
              </div>
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-eos-text-muted">
                  Stare operațională
                </p>
                <p className="mt-1 text-sm font-medium text-eos-text">{integrationStatus.statusLabel}</p>
                <p className="mt-1 text-xs text-eos-text-muted">{integrationStatus.statusDetail}</p>
              </div>
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-eos-text-muted">Ultim sync</p>
                <p className="mt-1 text-sm font-medium text-eos-text">
                  {integrationStatus.syncedAtISO
                    ? new Date(integrationStatus.syncedAtISO).toLocaleString("ro-RO")
                    : "Încă nu există"}
                </p>
                {integrationStatus.lastSubmissionStatus && (
                  <p className="mt-1 text-xs text-eos-text-muted">
                    Ultima execuție: {SPV_STATUS_LABELS[integrationStatus.lastSubmissionStatus]}
                    {integrationStatus.lastSubmissionAtISO
                      ? ` · ${new Date(integrationStatus.lastSubmissionAtISO).toLocaleString("ro-RO")}`
                      : ""}
                  </p>
                )}
                {integrationStatus.missingConfig.length > 0 && (
                  <p className="mt-1 text-xs text-eos-text-muted">
                    Lipsesc: {integrationStatus.missingConfig.join(", ")}
                  </p>
                )}
                {integrationStatus.lastSubmissionError && (
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-eos-error">{integrationStatus.lastSubmissionError}</p>
                    {integrationStatus.lastSubmissionNextStep && (
                      <p className="text-xs text-eos-warning">
                        Următorul pas: {integrationStatus.lastSubmissionNextStep}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {integrationStatus.lastSubmissionErrorCategory && integrationStatus.lastSubmissionNextStep && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-eos-md border border-eos-warning/30 bg-eos-warning/5 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-eos-text">Ultima execuție ANAF cere intervenție clară</p>
                  <p className="mt-1 text-xs text-eos-text-muted">
                    {integrationStatus.lastSubmissionNextStep}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {integrationStatus.lastSubmissionErrorCategory === "reauth_required" && (
                    <a
                      href={anafConnectHref}
                      className="inline-flex items-center gap-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-1.5 text-xs font-medium text-eos-text hover:bg-eos-surface-hover"
                    >
                      <ShieldCheck className="size-3" />
                      Reautentifică acum
                    </a>
                  )}
                  {(integrationStatus.lastSubmissionErrorCategory === "draft_missing" ||
                    integrationStatus.lastSubmissionErrorCategory === "payload_rejected") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={toggleNewDraftForm}
                    >
                      <Upload className="size-3.5" />
                      Creează draft nou
                    </Button>
                  )}
                  {integrationStatus.lastSubmissionErrorCategory === "service_unavailable" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => void refreshTab(true)}
                    >
                      <RefreshCw className="size-3.5" />
                      Reîncarcă starea
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="normal-case tracking-normal">
            {submissions.filter((s) => s.status === "pending_approval").length} așteaptă aprobare
          </Badge>
          {fromCockpit && sourceFindingId && (
            <Badge variant="secondary" className="normal-case tracking-normal">
              Legat de cazul fiscal
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {fromCockpit && returnToFindingHref && (
            <a
              href={returnToFindingHref}
              className="flex items-center gap-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-1.5 text-xs font-medium text-eos-text hover:bg-eos-surface-hover"
            >
              <ArrowLeft className="size-3" />
              Înapoi la finding
            </a>
          )}
          <Button size="sm" className="gap-1.5" onClick={toggleNewDraftForm}>
            <Upload className="size-3.5" /> Transmite factură
          </Button>
        </div>
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
            {fromCockpit && sourceFindingId && (
              <p className="text-xs text-eos-text-muted">
                Draftul nou va rămâne legat de cazul fiscal curent și îl poți redeschide direct din această listă după aprobare sau verdict.
              </p>
            )}
            {!fromCockpit && draftSourceFindingId && (
              <p className="text-xs text-eos-text-muted">
                Draftul nou păstrează legătura cu cazul fiscal inițial, pentru ca verdictul și dovada să revină în același cockpit.
              </p>
            )}
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
            const hasFinalVerdict = s.status === "ok" || s.status === "nok"
            const submissionErrorCategory = diagnoseSubmissionError(s.errorDetail)
            const linkedFindingHref = s.sourceFindingId ? `/dashboard/actiuni/remediere/${encodeURIComponent(s.sourceFindingId)}` : null
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
                  {s.status === "approved" && integrationStatus?.canAttemptUpload !== true && (
                    <p className="text-xs text-eos-warning">
                      Uploadul este blocat până când conexiunea ANAF devine operațională. Verifică starea de mai sus și reautentifică doar dacă este cerut explicit.
                    </p>
                  )}
                  {hasFinalVerdict && linkedFindingHref && (
                    <p className={`text-xs ${s.status === "ok" ? "text-eos-success" : "text-eos-warning"}`}>
                      {s.status === "ok"
                        ? "Verdict final primit. Cazul fiscal legat a fost mutat în monitorizare, iar dovada finală este salvată în rezoluția cazului."
                        : "Verdict final primit. Cazul fiscal legat a fost redeschis cu eroarea ANAF și așteaptă corecție."}
                    </p>
                  )}
                  {hasFinalVerdict && !linkedFindingHref && (
                    <p className={`text-xs ${s.status === "ok" ? "text-eos-success" : "text-eos-warning"}`}>
                      {s.status === "ok"
                        ? "ANAF a acceptat transmiterea. Păstrează indexul și mesajul pentru audit."
                        : "ANAF a respins transmiterea. Corectează factura și retransmite."}
                    </p>
                  )}

                  {s.indexDescarcare && (
                    <p className="font-mono text-xs text-eos-text-muted">
                      Index ANAF: {s.indexDescarcare}
                    </p>
                  )}
                  {s.downloadId && (
                    <p className="font-mono text-xs text-eos-text-muted">
                      Download ANAF: {s.downloadId}
                    </p>
                  )}
                  {s.anafMessage && (
                    <p className="text-xs text-eos-text-muted">{s.anafMessage}</p>
                  )}
                  {s.errorDetail && (
                    <div className="space-y-1">
                      <p className="text-xs text-eos-error">{s.errorDetail}</p>
                      {integrationStatus?.lastSubmissionStatus === s.status && integrationStatus.lastSubmissionNextStep && (
                        <p className="text-xs text-eos-warning">
                          Următorul pas: {integrationStatus.lastSubmissionNextStep}
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-eos-text-muted">
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
                          {approving === s.id
                            ? <Loader2 className="size-3.5 animate-spin" />
                            : <ShieldCheck className="size-3.5" />}
                          Aprobă acum
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={rejecting === s.id}
                          onClick={() => void handleReject(s)}
                          className="gap-1.5"
                        >
                          {rejecting === s.id
                            ? <Loader2 className="size-3.5 animate-spin" />
                            : <AlertTriangle className="size-3.5" />}
                          Respinge
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
                        disabled={executing === s.id || integrationStatus?.canAttemptUpload !== true}
                        onClick={() => void handleExecute(s.id)}
                        className="gap-1.5 shadow-sm"
                      >
                        {executing === s.id
                          ? <Loader2 className="size-3.5 animate-spin" />
                          : <Send className="size-3.5" />}
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
                        {executing === s.id
                          ? <Loader2 className="size-3.5 animate-spin" />
                          : <Send className="size-3.5" />}
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
                        {polling === s.id
                          ? <Loader2 className="size-3.5 animate-spin" />
                          : <RefreshCw className="size-3.5" />}
                        Verifică status
                      </Button>
                    )}
                    {(s.status === "error" || s.status === "rejected" || s.status === "nok") &&
                      (submissionErrorCategory === "draft_missing" || submissionErrorCategory === "payload_rejected") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => openRetryDraft(s)}
                        >
                          <Upload className="size-3.5" />
                          Creează draft nou
                        </Button>
                      )}
                    {(s.status === "error" || s.status === "submitted") &&
                      submissionErrorCategory === "reauth_required" && (
                        <a
                          href={anafConnectHref}
                          className="flex items-center gap-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-1.5 text-xs font-medium text-eos-text hover:bg-eos-surface-hover"
                        >
                          <ShieldCheck className="size-3" />
                          Reautentifică acum
                        </a>
                      )}
                    {(s.status === "error" || s.status === "submitted") &&
                      submissionErrorCategory === "service_unavailable" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => void refreshTab(true)}
                        >
                          <RefreshCw className="size-3.5" />
                          Reîncarcă starea
                        </Button>
                      )}
                    {linkedFindingHref && (
                      <a
                        href={linkedFindingHref}
                        className="flex items-center gap-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-1.5 text-xs font-medium text-eos-text hover:bg-eos-surface-hover"
                      >
                        <ExternalLink className="size-3" />
                        Deschide cazul fiscal
                      </a>
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
