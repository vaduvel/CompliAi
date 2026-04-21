"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardCheck,
  Download,
  FileText,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import type { Nis2Vendor, Nis2VendorRiskLevel } from "@/lib/server/nis2-store"
import { computeVendorRisk } from "@/lib/compliance/vendor-risk"

// ── Vendors tab ────────────────────────────────────────────────────────────────

const RISK_SCORE_COLORS: Record<string, string> = {
  high: "text-eos-error bg-eos-error-soft border-eos-error/30",
  medium: "text-eos-warning bg-eos-warning-soft border-eos-warning/30",
  low: "text-eos-success bg-eos-success-soft border-eos-success/30",
}

export function VendorRow({
  vendor,
  onDelete,
  onPatch,
  highlighted = false,
}: {
  vendor: Nis2Vendor
  onDelete: (id: string) => void
  onPatch: (id: string, patch: Partial<Nis2Vendor>) => Promise<void>
  highlighted?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [patching, setPatching] = useState<string | null>(null)

  const { riskScore, riskLevel, factors } = computeVendorRisk(vendor)

  const clauses = [
    { ok: vendor.hasSecurityClause, label: "Clauze securitate" },
    { ok: vendor.hasIncidentNotification, label: "Notificare incident" },
    { ok: vendor.hasAuditRight, label: "Drept audit" },
  ]

  async function markField(field: "hasDPA" | "hasSecuritySLA" | "lastReviewDate", value: boolean | string) {
    setPatching(field)
    try {
      await onPatch(vendor.id, { [field]: value })
    } finally {
      setPatching(null)
    }
  }

  const nis2VendorBorderL =
    riskLevel === "high"
      ? "border-l-[3px] border-l-eos-error"
      : riskLevel === "medium"
        ? "border-l-[3px] border-l-eos-warning"
        : "border-l-[3px] border-l-eos-border-subtle"

  return (
    <div
      id={`vendor-${vendor.id}`}
      className={highlighted ? "scroll-mt-24 rounded-eos-lg bg-eos-primary-soft/20 ring-1 ring-eos-primary/30" : ""}
    >
      <div className={`flex flex-wrap items-start gap-4 px-5 py-4 ${nis2VendorBorderL}`}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-eos-text">{vendor.name}</p>
            {/* Computed risk score badge */}
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${RISK_SCORE_COLORS[riskLevel]}`}>
              risc {riskLevel} ({riskScore}/100)
            </span>
            {vendor.techConfidence === "high" && (
              <span className="rounded bg-eos-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-eos-primary">
                tech ✓ certitudine ridicată
              </span>
            )}
            {vendor.techConfidence === "low" && (
              <span className="rounded bg-eos-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-eos-warning" title={vendor.techDetectionReason}>
                posibil tech — verifică manual
              </span>
            )}
          </div>
          {vendor.service && <p className="text-xs text-eos-text-muted">{vendor.service}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {clauses.map((c) => (
            <span
              key={c.label}
              className={`flex items-center gap-1 text-xs ${c.ok ? "text-eos-success" : "text-eos-text-muted line-through"}`}
            >
              {c.ok ? (
                <CheckCircle2 className="size-3" strokeWidth={2} />
              ) : (
                <XCircle className="size-3" strokeWidth={2} />
              )}
              {c.label}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-eos-md border border-eos-border bg-eos-surface p-1.5 text-eos-text-muted hover:bg-eos-bg-inset"
          aria-label="Detalii risc"
        >
          {expanded ? <ChevronUp className="size-3.5" strokeWidth={2} /> : <ChevronDown className="size-3.5" strokeWidth={2} />}
        </button>
        <button
          type="button"
          onClick={() => onDelete(vendor.id)}
          className="shrink-0 rounded-eos-md border border-eos-border bg-eos-surface p-1.5 text-eos-text-muted hover:bg-eos-error-soft hover:text-eos-error"
          aria-label="Șterge vendor"
        >
          <Trash2 className="size-3.5" strokeWidth={2} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-eos-border-subtle bg-eos-bg-inset px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-eos-text-muted">
            Factori de risc NIS2 Art. 21(2)(d)
          </p>
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <div className={`flex items-center gap-2 rounded-eos-md border px-3 py-2 text-xs ${factors.isTechVendor ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning" : "border-eos-border bg-eos-surface text-eos-text-muted"}`}>
              {factors.isTechVendor ? <ShieldAlert className="size-3.5 shrink-0" strokeWidth={2} /> : <CheckCircle2 className="size-3.5 shrink-0 text-eos-success" strokeWidth={2} />}
              Furnizor tech/cloud {factors.isTechVendor ? "(+30 pct risc)" : "— nedetectat"}
            </div>
            <div className={`flex items-center gap-2 rounded-eos-md border px-3 py-2 text-xs ${!factors.hasDPA && factors.isTechVendor ? "border-eos-error/30 bg-eos-error-soft text-eos-error" : "border-eos-border bg-eos-surface text-eos-text-muted"}`}>
              {factors.hasDPA ? <CheckCircle2 className="size-3.5 shrink-0 text-eos-success" strokeWidth={2} /> : <XCircle className="size-3.5 shrink-0" strokeWidth={2} />}
              DPA (Acord procesare date) {!factors.hasDPA && factors.isTechVendor ? "(+25 pct risc)" : factors.hasDPA ? "— bifat" : ""}
            </div>
            <div className={`flex items-center gap-2 rounded-eos-md border px-3 py-2 text-xs ${!factors.hasSecuritySLA && factors.isTechVendor ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning" : "border-eos-border bg-eos-surface text-eos-text-muted"}`}>
              {factors.hasSecuritySLA ? <CheckCircle2 className="size-3.5 shrink-0 text-eos-success" strokeWidth={2} /> : <XCircle className="size-3.5 shrink-0" strokeWidth={2} />}
              SLA securitate {!factors.hasSecuritySLA && factors.isTechVendor ? "(+15 pct risc)" : factors.hasSecuritySLA ? "— bifat" : ""}
            </div>
            <div className={`flex items-center gap-2 rounded-eos-md border px-3 py-2 text-xs ${factors.dataProcessingVolume === "high" ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning" : "border-eos-border bg-eos-surface text-eos-text-muted"}`}>
              <Shield className="size-3.5 shrink-0" strokeWidth={2} />
              Date procesate: {factors.dataProcessingVolume === "high" ? "volum ridicat (+20 pct)" : factors.dataProcessingVolume === "low" ? "volum scăzut" : "necunoscut"}
            </div>
          </div>

          {/* Scor bar */}
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs text-eos-text-muted">
              <span>Scor risc</span>
              <span className="font-semibold">{riskScore}/100</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-eos-border">
              <div
                className={`h-full rounded-full transition-all ${riskLevel === "high" ? "bg-eos-error" : riskLevel === "medium" ? "bg-eos-warning" : "bg-eos-success"}`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
          </div>

          {/* Acțiuni remediere */}
          <div className="flex flex-wrap gap-2">
            {!factors.hasDPA && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                disabled={patching === "hasDPA"}
                onClick={() => void markField("hasDPA", true)}
              >
                {patching === "hasDPA" ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" strokeWidth={2} />}
                Marchează DPA existent
              </Button>
            )}
            {!factors.hasSecuritySLA && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                disabled={patching === "hasSecuritySLA"}
                onClick={() => void markField("hasSecuritySLA", true)}
              >
                {patching === "hasSecuritySLA" ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" strokeWidth={2} />}
                Marchează SLA verificat
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              disabled={patching === "lastReviewDate"}
              onClick={() => void markField("lastReviewDate", new Date().toISOString())}
            >
              {patching === "lastReviewDate" ? <Loader2 className="size-3 animate-spin" /> : <ClipboardCheck className="size-3" strokeWidth={2} />}
              Marchează revizuire azi
            </Button>
          </div>
          {vendor.lastReviewDate && (
            <p className="mt-2 text-xs text-eos-text-muted">
              Ultima revizuire: {new Date(vendor.lastReviewDate).toLocaleDateString("ro-RO")}
              {vendor.nextReviewDue && ` · Scadentă: ${new Date(vendor.nextReviewDue).toLocaleDateString("ro-RO")}`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function VendorsTab({
  highlightedVendorId,
  highlightedVendorName,
  focusMode,
  sourceFindingId,
  returnTo,
}: {
  highlightedVendorId?: string
  highlightedVendorName?: string
  focusMode?: "vendor"
  sourceFindingId?: string
  returnTo?: string
}) {
  const router = useRouter()
  const [vendors, setVendors] = useState<Nis2Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: "",
    service: "",
    riskLevel: "medium" as Nis2VendorRiskLevel,
    hasSecurityClause: false,
    hasIncidentNotification: false,
    hasAuditRight: false,
    notes: "",
  })

  useEffect(() => {
    fetch("/api/nis2/vendors", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { vendors: Nis2Vendor[] }) => setVendors(d.vendors ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const normalizeVendorName = (value: string) =>
    value.toLowerCase().replace(/corporation|emea sarl|services|web|amazon/g, "").replace(/\s+/g, " ").trim()

  const highlightedVendor =
    (highlightedVendorId ? vendors.find((vendor) => vendor.id === highlightedVendorId) ?? null : null) ??
    (highlightedVendorName
      ? vendors.find((vendor) => {
          const current = normalizeVendorName(vendor.name)
          const target = normalizeVendorName(highlightedVendorName)
          return current.includes(target) || target.includes(current)
        }) ?? null
      : null)

  useEffect(() => {
    if (loading || !highlightedVendor) return
    const row = document.getElementById(`vendor-${highlightedVendor.id}`)
    if (!row) return
    row.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [highlightedVendor, loading, vendors.length])

  async function handleCreate() {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/nis2/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as { vendor?: Nis2Vendor; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la creare.")
      setVendors((prev) => [data.vendor!, ...prev])
      setForm({ name: "", service: "", riskLevel: "medium", hasSecurityClause: false, hasIncidentNotification: false, hasAuditRight: false, notes: "" })
      setShowForm(false)
      toast.success("Furnizor adăugat")
    } catch (err) {
      toast.error("Eroare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    } finally {
      setCreating(false)
    }
  }

  async function handleImportFromEfactura() {
    setImporting(true)
    try {
      const res = await fetch("/api/nis2/vendors/import-efactura", { method: "POST" })
      const data = (await res.json()) as { added: number; skipped: number; message: string; demoMode?: boolean }
      if (!res.ok) throw new Error(data.message ?? "Import eșuat.")
      if (data.added > 0) {
        // reload vendors
        const updated = await fetch("/api/nis2/vendors", { cache: "no-store" }).then((r) => r.json()) as { vendors: Nis2Vendor[] }
        setVendors(updated.vendors ?? [])
        if (data.demoMode) {
          toast.warning(data.message, {
            description: "Conectează contul ANAF din Setări pentru date reale.",
            duration: 6000,
          })
        } else {
          toast.success(data.message)
        }
      } else {
        toast.info(data.message)
      }
    } catch (err) {
      toast.error("Eroare la import", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    } finally {
      setImporting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Ștergi acest furnizor din registru?")) return
    try {
      const res = await fetch(`/api/nis2/vendors/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setVendors((prev) => prev.filter((v) => v.id !== id))
      toast.success("Furnizor șters")
    } catch {
      toast.error("Eroare la ștergere")
    }
  }

  async function handlePatch(id: string, patch: Partial<Nis2Vendor>) {
    try {
      const res = await fetch(`/api/nis2/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const data = (await res.json()) as { vendor?: Nis2Vendor; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la actualizare.")
      setVendors((prev) => prev.map((v) => (v.id === id ? data.vendor! : v)))
      toast.success("Furnizor actualizat")
      if (
        sourceFindingId &&
        returnTo &&
        highlightedVendor?.id === id &&
        typeof patch.lastReviewDate === "string"
      ) {
        const evidenceNote = [
          `Revizuire furnizor salvată pentru ${data.vendor!.name}.`,
          data.vendor!.hasDPA ? "DPA verificat." : "DPA încă lipsă.",
          data.vendor!.hasSecuritySLA ? "SLA de securitate verificat." : "SLA de securitate încă lipsă.",
          data.vendor!.lastReviewDate
            ? `Ultima revizuire: ${new Date(data.vendor!.lastReviewDate).toLocaleDateString("ro-RO")}.`
            : null,
        ]
          .filter(Boolean)
          .join(" ")
        const params = new URLSearchParams({
          vendorFlow: "done",
          evidenceNote,
        })
        router.push(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${params.toString()}`)
        return
      }
    } catch (err) {
      toast.error("Eroare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    }
  }

  const highRiskCount = vendors.filter((v) => computeVendorRisk(v).riskLevel === "high").length
  const missingClausesCount = vendors.filter((v) => !v.hasSecurityClause || !v.hasIncidentNotification).length

  return (
    <div className="space-y-4">
      {highlightedVendor && focusMode === "vendor" ? (
        <Card className="border-sky-300 bg-sky-50">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sky-950">Registrul furnizorilor este deschis din cockpit</p>
              <p className="mt-1 text-xs text-sky-900/80">
                Furnizorul „{highlightedVendor.name}” este deja selectat mai jos. Verifică DPA-ul, clauzele de securitate și marchează revizuirea contractuală; după salvare, revii automat în cockpit.
              </p>
            </div>
            {sourceFindingId ? (
              <Link
                href={returnTo || `/dashboard/actiuni/remediere/${encodeURIComponent(sourceFindingId)}`}
                className="inline-flex shrink-0 items-center gap-1 text-xs text-sky-950 hover:underline"
              >
                <ArrowLeft className="size-3" strokeWidth={2} />
                Înapoi la finding
              </Link>
            ) : (
              <Badge variant="outline" className="shrink-0 normal-case tracking-normal border-sky-300 bg-white text-sky-950">
                NIS2 Art. 21(2)(d)
              </Badge>
            )}
          </CardContent>
        </Card>
      ) : sourceFindingId && focusMode === "vendor" ? (
        <Card className="border-sky-300 bg-sky-50">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sky-950">Alege furnizorul corect din cockpit</p>
              <p className="mt-1 text-xs text-sky-900/80">
                Nu am putut selecta automat furnizorul potrivit. Alege vendorul afectat din registru, marchează revizuirea și apoi revii automat în același finding.
              </p>
            </div>
            <Link
              href={returnTo || `/dashboard/actiuni/remediere/${encodeURIComponent(sourceFindingId)}`}
              className="inline-flex shrink-0 items-center gap-1 text-xs text-sky-950 hover:underline"
            >
              <ArrowLeft className="size-3" strokeWidth={2} />
              Înapoi la finding
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {highRiskCount > 0 && (
            <Badge variant="destructive" className="normal-case tracking-normal">
              {highRiskCount} scor risc ridicat
            </Badge>
          )}
          {missingClausesCount > 0 && (
            <Badge variant="warning" className="normal-case tracking-normal">
              {missingClausesCount} fără clauze complete
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => void handleImportFromEfactura()}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileText className="size-3.5" strokeWidth={2} />
            )}
            Importă din e-Factura
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setShowForm((v) => !v)}>
            <Plus className="size-3.5" strokeWidth={2} />
            Adaugă furnizor
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader>
            <CardTitle className="text-sm">Furnizor ICT nou</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Nume furnizor *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-9 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
              />
              <input
                type="text"
                placeholder="Serviciu (ex: hosting, ERP, email)"
                value={form.service}
                onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                className="h-9 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-eos-text-muted">Nivel risc</label>
              <select
                className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none sm:w-48"
                value={form.riskLevel}
                onChange={(e) => setForm((f) => ({ ...f, riskLevel: e.target.value as Nis2VendorRiskLevel }))}
              >
                {(["low", "medium", "high", "critical"] as Nis2VendorRiskLevel[]).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { key: "hasSecurityClause" as const, label: "Clauze securitate în contract" },
                { key: "hasIncidentNotification" as const, label: "Notificare incidente" },
                { key: "hasAuditRight" as const, label: "Drept de audit" },
              ].map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2 text-sm text-eos-text">
                  <input
                    type="checkbox"
                    checked={form[c.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.checked }))}
                    className="size-4 accent-eos-primary"
                  />
                  {c.label}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Anulează
              </Button>
              <Button
                size="sm"
                disabled={creating || !form.name.trim()}
                onClick={() => void handleCreate()}
                className="gap-2"
              >
                {creating && <Loader2 className="size-3.5 animate-spin" />}
                Salvează furnizor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <LoadingScreen variant="section" />
      ) : vendors.length === 0 ? (
        <div className="rounded-eos-md border border-eos-border bg-eos-surface p-8 text-center">
          <Shield className="mx-auto mb-3 size-10 text-eos-text-muted" strokeWidth={1.5} />
          <p className="font-semibold text-eos-text">Niciun furnizor ICT înregistrat</p>
          <p className="mt-1 text-sm text-eos-text-muted">
            Adaugă furnizorii IT și cloud care procesează date sau susțin sisteme critice ale organizației tale.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-2"
            onClick={() => void handleImportFromEfactura()}
            disabled={importing}
          >
            {importing ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <Download className="size-4" strokeWidth={2} />}
            Importă automat din e-Factura
          </Button>
        </div>
      ) : (
        <Card className="divide-y divide-eos-border-subtle border-eos-border bg-eos-surface">
          {vendors.map((v) => (
            <VendorRow
              key={v.id}
              vendor={v}
              onDelete={handleDelete}
              onPatch={handlePatch}
              highlighted={v.id === highlightedVendor?.id}
            />
          ))}
        </Card>
      )}

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <p className="font-medium text-eos-text">De ce registrul furnizorilor ICT?</p>
        <p className="mt-1">
          NIS2 Art. 21(2)(d) obligă evaluarea riscurilor din lanțul de aprovizionare. La audit, DNSC verifică dacă ai clauze de securitate,
          notificare incidente și drept de audit în contractele cu furnizorii critici.
        </p>
      </div>
    </div>
  )
}
