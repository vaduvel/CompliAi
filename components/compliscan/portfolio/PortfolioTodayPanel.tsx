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
import { toast } from "sonner"
import {
  AlertTriangle,
  Calendar as CalIcon,
  CheckCircle2,
  CreditCard,
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

type BankItem = {
  clientOrgId: string
  clientOrgName: string
  title: string
  kind: "unmatched-debit" | "unmatched-credit" | "invoice-unpaid" | "invoice-uncollected"
  amountRON: number
  severity: "critic" | "important"
  dateISO: string
  narrative: string
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
    bank: {
      totalFirms: number
      unmatchedDebitsCount: number
      unmatchedCreditsCount: number
      unpaidInvoicesCount: number
      uncollectedInvoicesCount: number
      totalSuspiciousAmountRON: number
      firmsWithoutData: number
      items: BankItem[]
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
  // [FC-12 fix 2026-05-14] Maria: "Click → nu se întâmplă nimic". Cauza era alert()
  // silențios în Chrome Preview MCP + fail silențios când partner/clients return
  // empty. Fix: toast pentru feedback vizibil + fallback la navigare directă chiar
  // dacă membership lookup eșuează (router.push merge la /dashboard/fiscal — user
  // poate folosi sidebar pentru switch dacă context-ul nu se schimbă automat).
  const openClient = async (orgId: string, focusId: string) => {
    const focusUrl = `/dashboard/fiscal?focus=${encodeURIComponent(focusId)}`
    try {
      // Try to switch-org via membership lookup. Best-effort.
      const m = await fetch("/api/partner/clients", { cache: "no-store" }).then((r) => r.json())
      const client = m.clients?.find((c: { orgId: string }) => c.orgId === orgId)
      if (client?.membershipId) {
        const swRes = await fetch("/api/auth/switch-org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ membershipId: client.membershipId }),
        })
        if (!swRes.ok) {
          toast.warning("Nu am putut comuta automat firma. Te ducem pe pagină — alege firma din sidebar.")
        } else {
          toast.success("Am intrat în firmă. Te ducem la item-ul respectiv...")
        }
      } else {
        // Fallback: navigăm oricum (user în mod solo sau cabinet fără membership înregistrat)
        toast.message("Te ducem pe pagina fiscală. Folosește sidebar dacă vrei altă firmă.")
      }
      router.push(focusUrl)
    } catch (err) {
      console.error("openClient error:", err)
      // Fallback: încearcă oricum router.push — userul nu rămâne blocat
      toast.error("Eroare la comutare firmă. Te ducem oricum pe pagina fiscală.")
      router.push(focusUrl)
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
      <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-200">
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
              Portofoliu cabinet · azi
            </p>
            <h2
              data-display-text="true"
              className="mt-1 font-display text-[24px] font-semibold tracking-[-0.025em] text-eos-text md:text-[28px]"
            >
              {snapshot.totalClients} {pluralRO(snapshot.totalClients, "firmă", "firme")}
              {" · "}
              <span className="text-emerald-300">{snapshot.greenCount} {pluralRO(snapshot.greenCount, "verde", "verzi")}</span>
              {" · "}
              <span className="text-amber-300">{snapshot.yellowCount} {pluralRO(snapshot.yellowCount, "galbenă", "galbene")}</span>
              {" · "}
              <span className="text-red-300">{snapshot.redCount} {pluralRO(snapshot.redCount, "roșie", "roșii")}</span>
            </h2>
            <p className="mt-1 text-[12.5px] leading-[1.55] text-eos-text-muted">
              Total risc fiscal estimat: <strong className="font-mono tabular-nums text-eos-text">{snapshot.totalRiskRON.toLocaleString("ro-RO")} RON</strong>{" "}
              · Total ore cabinet/lună estimate: <strong className="font-mono tabular-nums text-eos-text">{snapshot.totalCabinetHoursPerMonth}h</strong>{" "}
              · {snapshot.totalSpvSyncedCount} {pluralRO(snapshot.totalSpvSyncedCount, "client", "clienți")} cu SPV activ
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md border border-eos-border bg-eos-surface px-2.5 py-1.5 text-[11.5px] font-medium text-eos-text-muted hover:bg-eos-surface-hover disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
            Actualizează
          </button>
        </div>
      </header>

      {/* 6 cards grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* CARD 1: DECLARAȚII */}
        <Card
          icon={<FileWarning className="size-4 text-amber-300" strokeWidth={2} />}
          title="Declarații de depus / rectificat"
          summary={`${cards.declarations.totalFirms} ${pluralRO(cards.declarations.totalFirms, "firmă", "firme")} · ${cards.declarations.totalImpactRON.toLocaleString("ro-RO")} RON impact`}
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
          icon={<CalIcon className="size-4 text-blue-300" strokeWidth={2} />}
          title="Termene urgente (7 zile)"
          summary={`${cards.calendar.totalFirms} ${pluralRO(cards.calendar.totalFirms, "firmă", "firme")} · ${cards.calendar.totalDeadlines} ${pluralRO(cards.calendar.totalDeadlines, "termen", "termene")}`}
          empty={cards.calendar.items.length === 0}
          emptyText="✓ Liber săptămâna asta. Vezi calendarul lunii viitoare →"
          emptyHref="/dashboard/fiscal/calendar"
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
          icon={<ShieldAlert className="size-4 text-red-300" strokeWidth={2} />}
          title="Certificate & împuterniciri"
          summary={`${cards.certificates.totalFirms} ${pluralRO(cards.certificates.totalFirms, "firmă", "firme")} · ${cards.certificates.expiredCount} ${pluralRO(cards.certificates.expiredCount, "expirat", "expirate")} · ${cards.certificates.expiringSoonCount} expiră`}
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
          icon={<Mail className="size-4 text-violet-300" strokeWidth={2} />}
          title="Cereri documente lipsă"
          summary={`${cards.evidence.totalFirms} ${pluralRO(cards.evidence.totalFirms, "firmă", "firme")} · ${cards.evidence.overdueCount} întârziate · ${cards.evidence.pendingClientCount} pendente client`}
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
          icon={<Target className="size-4 text-orange-300" strokeWidth={2} />}
          title="Risc Pre-ANAF iminent"
          summary={`${cards.preAnaf.totalFirms} ${pluralRO(cards.preAnaf.totalFirms, "firmă", "firme")} · ${cards.preAnaf.imminentCount} IMINENT · ${cards.preAnaf.highCount} RIDICAT · ${cards.preAnaf.totalExposureMaxRON.toLocaleString("ro-RO")} RON expunere`}
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
          icon={<AlertTriangle className="size-4 text-red-300" strokeWidth={2} />}
          title="Probleme prioritare"
          summary={`${cards.exceptions.totalFirms} ${pluralRO(cards.exceptions.totalFirms, "firmă", "firme")} · ${cards.exceptions.criticCount} ${pluralRO(cards.exceptions.criticCount, "CRITICĂ", "CRITICE")} · Total ${cards.exceptions.totalImpactRON.toLocaleString("ro-RO")} RON`}
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

        {/* CARD 7: BANK RECONCILIATION */}
        <Card
          icon={<CreditCard className="size-4 text-emerald-300" strokeWidth={2} />}
          title="Reconciliere plăți (Bank ↔ SPV)"
          summary={
            cards.bank.totalFirms === 0 && cards.bank.firmsWithoutData > 0
              ? `0 firme cu extras încărcat · ${cards.bank.firmsWithoutData} ${pluralRO(cards.bank.firmsWithoutData, "client", "clienți")} fără date bancare`
              : `${cards.bank.totalFirms} ${pluralRO(cards.bank.totalFirms, "firmă", "firme")} · ${cards.bank.unmatchedDebitsCount + cards.bank.unmatchedCreditsCount} suspecte · Total ${cards.bank.totalSuspiciousAmountRON.toLocaleString("ro-RO")} RON neacoperite`
          }
          empty={cards.bank.items.length === 0}
          emptyText={
            cards.bank.firmsWithoutData > 0
              ? "📂 Cere clienților extras MT940/CSV din IB → încarcă pe per-client pentru reconciliere automată."
              : "✓ Toate plățile și încasările au factură corespondentă."
          }
        >
          {cards.bank.items.map((item) => {
            const kindLabel =
              item.kind === "unmatched-debit"
                ? "PLATĂ FĂRĂ FACTURĂ"
                : item.kind === "unmatched-credit"
                  ? "ÎNCASARE FĂRĂ FACTURĂ"
                  : item.kind === "invoice-unpaid"
                    ? "Factură neplătită"
                    : "Factură neîncasată"
            return (
              <ItemRow
                key={item.focusId}
                onClick={() => openClient(item.clientOrgId, item.focusId)}
                clientName={item.clientOrgName}
                title={item.title}
                meta={`${kindLabel} · ${new Date(item.dateISO).toLocaleDateString("ro-RO")} · ${item.narrative}`}
                badge={item.severity}
              />
            )
          })}
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
  emptyHref,
}: {
  icon: React.ReactNode
  title: string
  summary: string
  children: React.ReactNode
  empty: boolean
  emptyText: string
  emptyHref?: string
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
        emptyHref ? (
          <a
            href={emptyHref}
            className="mt-3 block rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11.5px] text-emerald-200 transition hover:border-emerald-500/50 hover:bg-emerald-500/15"
          >
            {emptyText}
          </a>
        ) : (
          <p className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11.5px] text-emerald-200">{emptyText}</p>
        )
      ) : (
        <ul className="mt-3 space-y-1.5">{children}</ul>
      )}
    </section>
  )
}

// Helper plural RO: 1 → singular, 0/2+ → plural.
// [FC-12 fix 2026-05-14] Maria: "1 firme" e gramatical greșit. Folosim pluralizare RO.
function pluralRO(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural
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
      ? "bg-red-500/15 text-red-300 border-red-500/30"
      : badge === "important"
        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
        : "bg-blue-500/15 text-blue-300 border-blue-500/30"
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
            {/* [FC-11 fix vizibilitate 2026-05-14] Firma mai evidentă:
                pastilă cu border + bold + mărimea mai mare ca să sară în ochi
                la triage cross-client. Înainte era 10px text-tertiary subtil. */}
            <span className="inline-flex items-center gap-1 rounded-md border border-eos-primary/30 bg-eos-primary-soft px-1.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-eos-primary">
              <span className="size-1.5 rounded-full bg-eos-primary" />
              {clientName}
            </span>
            <p className="mt-1.5 text-[12.5px] font-semibold leading-[1.35] text-eos-text">
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
