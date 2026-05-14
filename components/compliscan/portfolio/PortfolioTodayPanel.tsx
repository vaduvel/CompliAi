"use client"

// FC-11 (2026-05-14) — Portfolio "AZI" panel.
//
// Home page-ul cabinetului. Cele 6 carduri pe tip de necesitate:
//   1. 📋 Declarații de depus / rectificat
//   2. 📅 Termene urgente (7 zile)
//   3. ⚠️ Certificate & împuterniciri
//   4. 📨 Cereri documente lipsă
//   5. 🚨 Pre-ANAF iminent
//   6. 💼 Excepții CRITIC Master Queue
//
// Click pe item: switch-org la firma respectivă + redirect cu ?focus= pentru
// a evidenția exact item-ul în /dashboard/fiscal.

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Calendar as CalIcon,
  CheckCircle2,
  FileWarning,
  Loader2,
  Mail,
  RefreshCw,
  ShieldAlert,
  Target,
  TrendingUp,
} from "lucide-react"

type DeclarationItem = {
  clientOrgId: string
  clientOrgName: string
  title: string
  severity: "critic" | "important" | "atentie"
  impactRON: number
  daysOverdue: number
  period: string
  focusId: string
}

type CalendarItem = {
  clientOrgId: string
  clientOrgName: string
  type: string
  period: string
  dueISO: string
  daysLeft: number
  focusId: string
}

type CertificateItem = {
  clientOrgId: string
  clientOrgName: string
  title: string
  severity: "critical" | "warning"
  daysUntilExpiry: number
  expiresAtISO: string
  category: "certificate" | "mandate"
  focusId: string
}

type EvidenceItem = {
  clientOrgId: string
  clientOrgName: string
  title: string
  status: "overdue" | "sent" | "client-acknowledged" | "requested"
  daysToDeadline: number
  type: string
  focusId: string
}

type PreAnafItem = {
  clientOrgId: string
  clientOrgName: string
  title: string
  probability: "imminent" | "high" | "medium" | "low"
  exposureMaxRON: number
  rankingScore: number
  focusId: string
}

type ExceptionItem = {
  clientOrgId: string
  clientOrgName: string
  title: string
  severity: "critic" | "important"
  impactRON: number
  category: string
  focusId: string
}

type Snapshot = {
  totalClients: number
  greenCount: number
  yellowCount: number
  redCount: number
  totalRiskRON: number
  totalCabinetHoursPerMonth: number
  toxicClientsCount: number
  totalSpvSyncedCount: number
}

type TodayResponse = {
  ok: true
  generatedAtISO: string
  snapshot: Snapshot
  cards: {
    declarations: { totalFirms: number; totalImpactRON: number; items: DeclarationItem[] }
    calendar: { totalFirms: number; totalDeadlines: number; items: CalendarItem[] }
    certificates: {
      totalFirms: number
      expiredCount: number
      expiringSoonCount: number
      items: CertificateItem[]
    }
    evidence: {
      totalFirms: number
      overdueCount: number
      pendingClientCount: number
      items: EvidenceItem[]
    }
    preAnaf: {
      totalFirms: number
      imminentCount: number
      highCount: number
      totalExposureMaxRON: number
      items: PreAnafItem[]
    }
    exceptions: {
      totalFirms: number
      criticCount: number
      totalImpactRON: number
      items: ExceptionItem[]
    }
  }
}

export function PortfolioTodayPanel() {
  const [data, setData] = useState<TodayResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/partner/portfolio/today", { cache: "no-store" })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? "Eroare la încărcare.")
      }
      const json = (await res.json()) as TodayResponse
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  /** Click pe item: switch-org + redirect cu ?focus= */
  const openClient = async (orgId: string, focusId: string) => {
    try {
      // Find membership for orgId via memberships API
      const m = await fetch("/api/partner/clients", { cache: "no-store" }).then((r) => r.json())
      const client = m.clients?.find((c: { orgId: string }) => c.orgId === orgId)
      if (!client?.membershipId) {
        alert("Nu am găsit membership-ul.")
        return
      }
      const swRes = await fetch("/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: client.membershipId }),
      })
      if (!swRes.ok) {
        alert("Switch org eșuat.")
        return
      }
      // Navigate to per-client fiscal dashboard with focus param
      router.push(`/dashboard/fiscal?focus=${encodeURIComponent(focusId)}`)
    } catch (err) {
      console.error("openClient error:", err)
      alert("Eroare la navigare.")
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} />
        Încarc dashboard portofoliu...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-300/50 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return null

  const { snapshot, cards } = data

  return (
    <div className="space-y-4">
      {/* Header snapshot */}
      <header className="rounded-2xl border border-eos-border bg-eos-surface p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              📊 Portofoliu cabinet · azi
            </p>
            <h2
              data-display-text="true"
              className="mt-1 font-display text-[24px] font-semibold tracking-[-0.025em] text-eos-text md:text-[28px]"
            >
              {snapshot.totalClients} firme · {snapshot.greenCount} verzi · {snapshot.yellowCount} galbene · {snapshot.redCount} roșii
            </h2>
            <p className="mt-1 text-[12.5px] leading-[1.55] text-eos-text-muted">
              Σ risc fiscal expus: <strong className="text-eos-text">{snapshot.totalRiskRON.toLocaleString("ro-RO")} RON</strong>{" "}
              · Σ ore cabinet/lună estimate: <strong className="text-eos-text">{snapshot.totalCabinetHoursPerMonth}h</strong>{" "}
              · {snapshot.totalSpvSyncedCount} clienți cu SPV activ
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md border border-eos-border bg-eos-surface px-2.5 py-1.5 text-[11.5px] font-medium text-eos-text-muted hover:bg-eos-surface-hover disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
            Refresh
          </button>
        </div>
      </header>

      {/* 6 cards grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* CARD 1: DECLARAȚII */}
        <Card
          icon={<FileWarning className="size-4 text-amber-600" strokeWidth={2} />}
          title="Declarații de depus / rectificat"
          summary={`${cards.declarations.totalFirms} firme · ${cards.declarations.totalImpactRON.toLocaleString("ro-RO")} RON impact`}
          empty={cards.declarations.items.length === 0}
          emptyText="✓ Niciun client cu declarații întârziate."
        >
          {cards.declarations.items.map((item) => (
            <ItemRow
              key={item.focusId}
              onClick={() => openClient(item.clientOrgId, item.focusId)}
              clientName={item.clientOrgName}
              title={item.title}
              meta={`${item.period} · ${item.impactRON.toLocaleString("ro-RO")} RON`}
              badge={item.severity}
            />
          ))}
        </Card>

        {/* CARD 2: CALENDAR */}
        <Card
          icon={<CalIcon className="size-4 text-blue-600" strokeWidth={2} />}
          title="Termene urgente (7 zile)"
          summary={`${cards.calendar.totalFirms} firme · ${cards.calendar.totalDeadlines} termene`}
          empty={cards.calendar.items.length === 0}
          emptyText="✓ Niciun termen în următoarele 7 zile."
        >
          {cards.calendar.items.map((item) => (
            <ItemRow
              key={item.focusId}
              onClick={() => openClient(item.clientOrgId, item.focusId)}
              clientName={item.clientOrgName}
              title={`${item.type} ${item.period}`}
              meta={`${item.daysLeft === 0 ? "AZI" : `în ${item.daysLeft} zile`} · ${new Date(item.dueISO).toLocaleDateString("ro-RO")}`}
              badge={item.daysLeft <= 2 ? "critic" : "important"}
            />
          ))}
        </Card>

        {/* CARD 3: CERTIFICATE */}
        <Card
          icon={<ShieldAlert className="size-4 text-red-600" strokeWidth={2} />}
          title="Certificate & împuterniciri"
          summary={`${cards.certificates.totalFirms} firme · ${cards.certificates.expiredCount} expirate · ${cards.certificates.expiringSoonCount} expiră`}
          empty={cards.certificates.items.length === 0}
          emptyText="✓ Toate certificatele și împuternicirile sunt valide."
        >
          {cards.certificates.items.map((item) => (
            <ItemRow
              key={item.focusId}
              onClick={() => openClient(item.clientOrgId, item.focusId)}
              clientName={item.clientOrgName}
              title={item.title}
              meta={
                item.daysUntilExpiry < 0
                  ? `EXPIRAT de ${Math.abs(item.daysUntilExpiry)} zile`
                  : `expiră în ${item.daysUntilExpiry} zile`
              }
              badge={item.severity === "critical" ? "critic" : "important"}
            />
          ))}
        </Card>

        {/* CARD 4: EVIDENCE */}
        <Card
          icon={<Mail className="size-4 text-violet-600" strokeWidth={2} />}
          title="Cereri documente lipsă"
          summary={`${cards.evidence.totalFirms} firme · ${cards.evidence.overdueCount} overdue · ${cards.evidence.pendingClientCount} pendente client`}
          empty={cards.evidence.items.length === 0}
          emptyText="✓ Nicio cerere documente în așteptare."
        >
          {cards.evidence.items.map((item) => (
            <ItemRow
              key={item.focusId}
              onClick={() => openClient(item.clientOrgId, item.focusId)}
              clientName={item.clientOrgName}
              title={item.title}
              meta={
                item.status === "overdue"
                  ? `OVERDUE de ${Math.abs(item.daysToDeadline)} zile`
                  : item.status === "sent"
                    ? `Trimis · așteaptă client`
                    : item.status === "client-acknowledged"
                      ? "Client a confirmat primirea"
                      : `Solicitat · ${item.daysToDeadline} zile rămase`
              }
              badge={item.status === "overdue" ? "critic" : "important"}
            />
          ))}
        </Card>

        {/* CARD 5: PRE-ANAF */}
        <Card
          icon={<Target className="size-4 text-orange-600" strokeWidth={2} />}
          title="Risc Pre-ANAF iminent"
          summary={`${cards.preAnaf.totalFirms} firme · ${cards.preAnaf.imminentCount} IMINENT · ${cards.preAnaf.highCount} HIGH · ${cards.preAnaf.totalExposureMaxRON.toLocaleString("ro-RO")} RON expunere`}
          empty={cards.preAnaf.items.length === 0}
          emptyText="✓ Niciun risc iminent în portofoliu."
        >
          {cards.preAnaf.items.map((item) => (
            <ItemRow
              key={item.focusId}
              onClick={() => openClient(item.clientOrgId, item.focusId)}
              clientName={item.clientOrgName}
              title={item.title}
              meta={`score ${item.rankingScore} · ${item.exposureMaxRON.toLocaleString("ro-RO")} RON`}
              badge={item.probability === "imminent" ? "critic" : "important"}
            />
          ))}
        </Card>

        {/* CARD 6: EXCEPȚII */}
        <Card
          icon={<AlertTriangle className="size-4 text-red-700" strokeWidth={2} />}
          title="Excepții CRITIC Master Queue"
          summary={`${cards.exceptions.totalFirms} firme · ${cards.exceptions.criticCount} CRITICE · Σ ${cards.exceptions.totalImpactRON.toLocaleString("ro-RO")} RON`}
          empty={cards.exceptions.items.length === 0}
          emptyText="✓ Nicio excepție critică."
        >
          {cards.exceptions.items.map((item) => (
            <ItemRow
              key={item.focusId}
              onClick={() => openClient(item.clientOrgId, item.focusId)}
              clientName={item.clientOrgName}
              title={item.title}
              meta={`${item.category} · ${item.impactRON.toLocaleString("ro-RO")} RON`}
              badge={item.severity}
            />
          ))}
        </Card>
      </div>

      <p className="text-center text-[11px] text-eos-text-tertiary">
        Click pe orice item → te ducem direct în firma respectivă pe rezolvat
      </p>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Card({
  icon,
  title,
  summary,
  children,
  empty,
  emptyText,
}: {
  icon: React.ReactNode
  title: string
  summary: string
  children: React.ReactNode
  empty: boolean
  emptyText: string
}) {
  return (
    <section className="rounded-2xl border border-eos-border bg-eos-surface p-4 shadow-sm">
      <header className="flex items-start gap-2">
        {icon}
        <div className="min-w-0 flex-1">
          <h3
            data-display-text="true"
            className="font-display text-[14px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            {title}
          </h3>
          <p className="mt-0.5 text-[11.5px] leading-[1.45] text-eos-text-muted">{summary}</p>
        </div>
      </header>
      {empty ? (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-[11.5px] text-emerald-700">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-1.5">{children}</ul>
      )}
    </section>
  )
}

function ItemRow({
  onClick,
  clientName,
  title,
  meta,
  badge,
}: {
  onClick: () => void
  clientName: string
  title: string
  meta: string
  badge: "critic" | "important" | "atentie"
}) {
  const badgeCls =
    badge === "critic"
      ? "bg-red-100 text-red-700 border-red-300/50"
      : badge === "important"
        ? "bg-amber-100 text-amber-700 border-amber-300/50"
        : "bg-blue-100 text-blue-700 border-blue-300/50"
  const badgeLabel = badge === "critic" ? "CRITIC" : badge === "important" ? "IMPORTANT" : "ATENȚIE"
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-lg border border-eos-border bg-eos-surface-subtle p-2.5 text-left transition hover:border-eos-primary/50 hover:bg-eos-surface"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-wide text-eos-text-tertiary">
              {clientName}
            </p>
            <p className="mt-0.5 text-[12.5px] font-semibold leading-[1.35] text-eos-text">
              {title}
            </p>
            <p className="mt-0.5 text-[11px] text-eos-text-muted">{meta}</p>
          </div>
          <span
            className={`inline-flex shrink-0 rounded border px-1.5 py-px font-mono text-[9.5px] font-semibold uppercase ${badgeCls}`}
          >
            {badgeLabel}
          </span>
        </div>
      </button>
    </li>
  )
}
