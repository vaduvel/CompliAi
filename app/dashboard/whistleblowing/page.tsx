"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Clock, Copy, ExternalLink, Flag, Loader2, Plus, Shield, User } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { V3PageHero } from "@/components/compliscan/v3/page-hero"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import type { WhistleblowingReport, WhistleblowingStatus, WhistleblowingCategory } from "@/lib/server/whistleblowing-store"

const CATEGORY_LABELS: Record<WhistleblowingCategory, string> = {
  fraud: "Fraudă",
  corruption: "Corupție",
  safety: "Securitate / Siguranță",
  privacy: "Confidențialitate date",
  harassment: "Hărțuire",
  financial: "Nereguli financiare",
  other: "Altele",
}

const STATUS_LABELS: Record<WhistleblowingStatus, string> = {
  received: "Primită",
  under_investigation: "În investigare",
  resolved: "Rezolvată",
  closed: "Închisă",
}

const STATUS_BADGE: Record<WhistleblowingStatus, "warning" | "default" | "success" | "outline"> = {
  received: "warning",
  under_investigation: "default",
  resolved: "success",
  closed: "outline",
}

function daysLeft(deadlineISO: string) {
  const diff = new Date(deadlineISO).getTime() - Date.now()
  const days = Math.ceil(diff / 86_400_000)
  if (days < 0) return { label: `Depășit cu ${Math.abs(days)} zile`, urgent: true }
  if (days <= 14) return { label: `${days} zile rămase`, urgent: true }
  return { label: `${days} zile rămase`, urgent: false }
}

export default function WhistleblowingPage() {
  const [reports, setReports] = useState<WhistleblowingReport[]>([])
  const [publicToken, setPublicToken] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/whistleblowing", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setReports(d.reports ?? [])
        setPublicToken(d.publicToken ?? "")
      })
      .catch(() => toast.error("Eroare la încărcare"))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/whistleblowing/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    if (!res.ok) { toast.error("Eroare la actualizare"); return }
    const { report } = await res.json()
    setReports((prev) => prev.map((r) => (r.id === id ? report : r)))
    toast.success("Sesizare actualizată")
  }

  const publicUrl = publicToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/whistleblowing/${publicToken}`
    : ""

  if (loading) return <LoadingScreen />

  const active = reports.filter((r) => !["resolved", "closed"].includes(r.status))

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <V3PageHero
        breadcrumbs={[{ label: "Dashboard" }, { label: "Whistleblowing", current: true }]}
        title="Canal sesizări"
        description="Obligatoriu pentru organizații cu peste 50 de angajați. Gestionează sesizările interne anonim sau nominativ — termen de răspuns: 3 luni."
        eyebrowBadges={
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Sesizări · Directiva UE 2019/1937
          </span>
        }
        actions={
          <Link
            href="/dashboard/resolve"
            className="inline-flex items-center gap-1.5 text-xs text-eos-text-muted transition-colors hover:text-eos-text"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2} />
            Înapoi la De rezolvat
          </Link>
        }
      />

      {/* Public link */}
      {publicToken && (
        <Card className="border-eos-primary/30 bg-eos-primary/5">
          <CardContent className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-eos-text">Link public sesizări</p>
              <p className="mt-0.5 text-xs text-eos-text-muted">Distribuie angajaților. Permite sesizări anonime fără autentificare.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <code className="rounded-eos-md border border-eos-border bg-eos-surface px-2 py-1 text-[10px] text-eos-text max-w-[200px] truncate">
                /whistleblowing/{publicToken}
              </code>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  void navigator.clipboard.writeText(publicUrl)
                  toast.success("Link copiat")
                }}
              >
                <Copy className="size-3.5" />
                Copiază
              </Button>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <ExternalLink className="size-3.5" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {active.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">{active.length} sesizări active</Badge>
          {active.filter((r) => daysLeft(r.deadlineISO).urgent).length > 0 && (
            <Badge variant="destructive">
              {active.filter((r) => daysLeft(r.deadlineISO).urgent).length} deadline urgent
            </Badge>
          )}
        </div>
      )}

      {reports.length === 0 && (
        <EmptyState
          icon={Flag}
          title="Nicio sesizare"
          label="Distribuie link-ul public angajaților. Sesizările primite vor apărea aici."
        />
      )}

      {reports.map((r) => (
        <ReportRow key={r.id} report={r} onUpdate={handleUpdate} />
      ))}
    </div>
  )
}

function ReportRow({
  report: r,
  onUpdate,
}: {
  report: WhistleblowingReport
  onUpdate: (id: string, patch: Record<string, unknown>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(r.internalNotes ?? "")
  const dl = daysLeft(r.deadlineISO)
  const isClosed = r.status === "resolved" || r.status === "closed"

  const nextStatuses: WhistleblowingStatus[] = {
    received: ["under_investigation", "closed"],
    under_investigation: ["resolved", "closed"],
    resolved: [],
    closed: [],
  }[r.status] as WhistleblowingStatus[]

  const wbBorderL =
    r.status === "resolved"
      ? "border-l-eos-success"
      : r.status === "closed"
        ? "border-l-eos-border-subtle"
        : r.status === "under_investigation"
          ? "border-l-eos-primary"
          : "border-l-eos-warning"

  return (
    <Card className={`border border-l-[3px] ${wbBorderL} ${dl.urgent && !isClosed ? "border-eos-warning/30 bg-eos-warning-soft/30" : "border-eos-border"}`}>
      <CardContent className="px-5 py-4 space-y-3">
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2 min-w-0">
            {expanded ? <ChevronDown className="size-3.5 shrink-0 text-eos-text-muted" /> : <ChevronRight className="size-3.5 shrink-0 text-eos-text-muted" />}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_BADGE[r.status]} className="text-[10px] normal-case tracking-normal">
                  {STATUS_LABELS[r.status]}
                </Badge>
                <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                  {CATEGORY_LABELS[r.category]}
                </Badge>
                {r.anonymous ? (
                  <span className="text-xs text-eos-text-muted flex items-center gap-1"><Shield className="size-3" /> Anonim</span>
                ) : (
                  <span className="text-xs text-eos-text-muted flex items-center gap-1"><User className="size-3" /> Nominativ</span>
                )}
                {!isClosed && (
                  <Badge variant={dl.urgent ? "destructive" : "outline"} className="text-[10px] normal-case tracking-normal gap-1">
                    <Clock className="size-2.5" />
                    {dl.label}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-eos-text-muted">
                Primită: {new Date(r.submittedAtISO).toLocaleDateString("ro-RO")}
                {r.resolvedAtISO && ` · Rezolvată: ${new Date(r.resolvedAtISO).toLocaleDateString("ro-RO")}`}
              </p>
            </div>
          </div>
        </button>

        {expanded && (
          <div className="space-y-3 border-t border-eos-border-subtle pt-3">
            <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-eos-text-muted">Descriere sesizare</p>
              <p className="mt-1 text-sm text-eos-text whitespace-pre-wrap">{r.description}</p>
            </div>
            {r.contactInfo && (
              <p className="text-xs text-eos-text-muted">Contact: {r.contactInfo}</p>
            )}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-eos-text-muted">Note interne</label>
              <textarea
                className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notițe vizibile doar intern..."
              />
              <Button
                size="sm"
                variant="outline"
                className="mt-1 gap-1.5 text-xs"
                onClick={() => onUpdate(r.id, { internalNotes: notes })}
              >
                Salvează note
              </Button>
            </div>
            {nextStatuses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === "resolved" ? "default" : "outline"}
                    className="text-xs gap-1.5"
                    onClick={() => onUpdate(r.id, { status: s })}
                  >
                    {s === "resolved" && <CheckCircle2 className="size-3.5" />}
                    {s === "under_investigation" && <AlertTriangle className="size-3.5" />}
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
