"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Users,
} from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"
import type { PartnerClientSummary } from "@/app/api/partner/clients/route"

// ── Client row ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-400" : "bg-red-500"
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-eos-bg-inset">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  )
}

function ClientRow({ client }: { client: PartnerClientSummary }) {
  const c = client.compliance
  const hasData = c?.hasData ?? false

  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-3.5">
      {/* Org */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-eos-text">{client.orgName}</p>
          <Badge
            variant={client.role === "owner" ? "default" : "secondary"}
            className="shrink-0 text-[10px] normal-case tracking-normal"
          >
            {client.role}
          </Badge>
        </div>
        <p className="text-xs text-eos-text-muted">{client.orgId}</p>
      </div>

      {/* Score */}
      <div className="w-28 shrink-0">
        {hasData && c ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-eos-text">{c.score}%</span>
              <span className="text-[10px] text-eos-text-muted">{c.riskLabel}</span>
            </div>
            <ScoreBar score={c.score} />
          </div>
        ) : (
          <span className="text-xs text-eos-text-muted">fără date</span>
        )}
      </div>

      {/* Stats */}
      <div className="hidden w-32 shrink-0 sm:block">
        {c && hasData ? (
          <div className="space-y-0.5 text-xs text-eos-text-muted">
            <div className="flex items-center gap-1.5">
              {c.redAlerts > 0 ? (
                <AlertTriangle className="size-3 text-red-500" strokeWidth={2} />
              ) : (
                <CheckCircle2 className="size-3 text-emerald-500" strokeWidth={2} />
              )}
              {c.openAlerts} alert{c.openAlerts !== 1 ? "e" : "ă"}
            </div>
            <div>{c.scannedDocuments} doc scamate</div>
          </div>
        ) : null}
      </div>

      {/* Status pills */}
      <div className="flex shrink-0 items-center gap-2">
        {c?.efacturaConnected && (
          <Badge variant="success" className="text-[10px] normal-case tracking-normal">
            e-Factura
          </Badge>
        )}
        {c && c.gdprProgress >= 70 && (
          <Badge variant="success" className="text-[10px] normal-case tracking-normal">
            GDPR
          </Badge>
        )}
        {c && c.highRisk === 0 ? null : c && c.highRisk > 0 ? (
          <Badge variant="destructive" className="text-[10px] normal-case tracking-normal">
            {c.highRisk} high-risk AI
          </Badge>
        ) : null}
      </div>

      {/* Link to trust profile */}
      <a
        href={`/trust/${client.orgId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-eos-md border border-eos-border bg-eos-surface p-1.5 text-eos-text-muted transition hover:bg-eos-surface-variant hover:text-eos-text"
        title="Trust Profile"
      >
        <ExternalLink className="size-3.5" strokeWidth={2} />
      </a>
    </div>
  )
}

// ── Summary strip ─────────────────────────────────────────────────────────────

function PortalSummary({ clients }: { clients: PartnerClientSummary[] }) {
  const active = clients.filter((c) => c.status === "active")
  const withData = active.filter((c) => c.compliance?.hasData)
  const redClients = active.filter((c) => (c.compliance?.redAlerts ?? 0) > 0)
  const avgScore =
    withData.length > 0
      ? Math.round(withData.reduce((sum, c) => sum + (c.compliance?.score ?? 0), 0) / withData.length)
      : 0

  const stats = [
    { label: "Total clienți", value: active.length },
    { label: "Cu date", value: withData.length },
    { label: "Scor mediu", value: withData.length > 0 ? `${avgScore}%` : "—" },
    { label: "Alerte critice", value: redClients.length },
  ]

  return (
    <div className="grid grid-cols-2 divide-x divide-eos-border-subtle overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-0.5 px-5 py-3.5">
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
            {s.label}
          </span>
          <span className="text-lg font-semibold text-eos-text">{s.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PartnerPage() {
  const [clients, setClients] = useState<PartnerClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchClients() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/partner/clients", { cache: "no-store" })
      if (!res.ok) throw new Error("Nu am putut incarca lista de clienți.")
      const data = (await res.json()) as { clients: PartnerClientSummary[] }
      setClients(data.clients)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchClients() }, [])

  if (loading) return <LoadingScreen variant="section" />
  if (error) return <ErrorScreen message={error} variant="section" />

  const activeClients = clients.filter((c) => c.status === "active")
  const alertClients = activeClients.filter((c) => (c.compliance?.redAlerts ?? 0) > 0)

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Partner Portal"
        title="Dashboard multi-client"
        description="Vizualizare centralizată a tuturor organizațiilor unde ești înregistrat. Monitorizează conformitatea clienților tăi dintr-un singur loc."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {activeClients.length} clienți activi
            </Badge>
            {alertClients.length > 0 && (
              <Badge variant="destructive" dot className="normal-case tracking-normal">
                {alertClients.length} cu alerte critice
              </Badge>
            )}
          </>
        }
        actions={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void fetchClients()}
            className="gap-2"
          >
            <RefreshCw className="size-3.5" strokeWidth={2} />
            Actualizează
          </Button>
        }
      />

      <PortalSummary clients={activeClients} />

      <Card className="divide-y divide-eos-border-subtle overflow-hidden border-eos-border bg-eos-surface">
        {activeClients.length === 0 ? (
          <EmptyState
            title="Niciun client activ"
            label="Adaugă organizații sau acceptă invitații pentru a vedea clienții."
            icon={Users}
            className="px-5 py-10"
          />
        ) : (
          <>
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-4 bg-eos-bg-inset px-5 py-2">
              <p className="flex-1 text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
                Organizație
              </p>
              <p className="w-28 shrink-0 text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
                Scor
              </p>
              <p className="hidden w-32 shrink-0 text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary sm:block">
                Status
              </p>
              <p className="hidden w-20 shrink-0 text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary sm:block">
                Module
              </p>
              <div className="size-7 shrink-0" />
            </div>

            {/* Alert clients first */}
            {[
              ...alertClients,
              ...activeClients.filter((c) => (c.compliance?.redAlerts ?? 0) === 0),
            ].map((client) => (
              <ClientRow key={client.orgId} client={client} />
            ))}
          </>
        )}
      </Card>

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <Building2 className="mb-1.5 size-4 text-eos-text-tertiary" strokeWidth={1.5} />
        <p className="font-medium text-eos-text">Contabil sau DPO consultant?</p>
        <p className="mt-0.5">
          Adaugă clienți noi invitându-i direct din pagina Setări → Echipă a fiecărei organizații.
          Ei primesc un email de invitație și acceptă accesul.
        </p>
      </div>
    </div>
  )
}
