"use client"

// S2A.1 — ICP-aware billing tiers panel.
// Afișat în settings-billing-page (sub planul curent). Listează tier-urile
// din STRIPE_TIER_REGISTRY relevante pentru ICP-ul cabinetului (din white-label).
// Default: dacă icpSegment lipsește, afișează toate tier-urile cu badge ICP.

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { V3Panel } from "@/components/compliscan/v3/panel"
import {
  STRIPE_TIER_REGISTRY,
  isAccountScopedTier,
  listTiersForIcp,
  type TierDefinition,
} from "@/lib/server/stripe-tier-config"
import type { IcpSegment } from "@/lib/server/white-label"

type WhiteLabelResponse = {
  ok: boolean
  config?: { icpSegment?: IcpSegment | null }
}

const ICP_LABEL: Record<IcpSegment, string> = {
  solo: "Solo (Owner/Manager)",
  "cabinet-dpo": "Cabinet DPO",
  "cabinet-fiscal": "Cabinet Fiscal (Contabil)",
  "imm-internal": "IMM Internal Compliance",
  enterprise: "Enterprise (Sales-led)",
}

const ICP_TONE: Record<IcpSegment, { ring: string; chip: string; chipText: string }> = {
  solo: {
    ring: "border-eos-primary/30",
    chip: "bg-eos-primary/10",
    chipText: "text-eos-primary",
  },
  "cabinet-dpo": {
    ring: "border-violet-500/30",
    chip: "bg-violet-500/10",
    chipText: "text-violet-300",
  },
  "cabinet-fiscal": {
    ring: "border-amber-500/30",
    chip: "bg-amber-500/10",
    chipText: "text-amber-300",
  },
  "imm-internal": {
    ring: "border-emerald-500/30",
    chip: "bg-emerald-500/10",
    chipText: "text-emerald-300",
  },
  enterprise: {
    ring: "border-indigo-500/30",
    chip: "bg-indigo-500/10",
    chipText: "text-indigo-300",
  },
}

function tierToScope(tier: TierDefinition): "org" | "account" {
  return tier.billingScope
}

export function IcpBillingTiersPanel() {
  const [icpSegment, setIcpSegment] = useState<IcpSegment | null | undefined>(undefined)
  const [busyTier, setBusyTier] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/partner/white-label")
      .then((r) => (r.ok ? (r.json() as Promise<WhiteLabelResponse>) : null))
      .then((data) => {
        if (cancelled) return
        setIcpSegment(data?.config?.icpSegment ?? null)
      })
      .catch(() => {
        if (!cancelled) setIcpSegment(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const tiers = useMemo(() => {
    if (icpSegment) return listTiersForIcp(icpSegment)
    // Fallback: arată toate ICP tiers (excluzând legacy partner_*/pro alias-uri)
    return Object.values(STRIPE_TIER_REGISTRY).filter(
      (t) => !t.id.startsWith("partner_") && t.id !== "pro" && t.id !== "partner"
    )
  }, [icpSegment])

  async function handleCheckout(tier: TierDefinition) {
    setBusyTier(tier.id)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPlan: tier.id,
          billingScope: tierToScope(tier),
        }),
      })
      const data = (await res.json()) as { url?: string; demo?: boolean; error?: string }
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Checkout a eșuat.")
        return
      }
      if (data.demo) {
        toast.info("Stripe nu este configurat — mod demo")
        return
      }
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la checkout.")
    } finally {
      setBusyTier(null)
    }
  }

  if (icpSegment === undefined) {
    return (
      <V3Panel title="Tier-uri pentru segmentul tău" eyebrow="Loading">
        <div className="flex items-center justify-center p-6">
          <Loader2 className="size-5 animate-spin text-eos-text-tertiary" strokeWidth={2} />
        </div>
      </V3Panel>
    )
  }

  if (tiers.length === 0) {
    return null
  }

  return (
    <V3Panel
      eyebrow={icpSegment ? "Plan-uri ICP" : "Plan-uri disponibile"}
      title={icpSegment ? `Plan-uri pentru ${ICP_LABEL[icpSegment]}` : "Toate plan-urile ICP"}
    >
      <p className="mb-4 text-[12.5px] leading-[1.6] text-eos-text-tertiary">
        {icpSegment
          ? "Pricing transparent self-serve pentru segmentul tău. Stripe Checkout direct."
          : "Setează ICP segment-ul în onboarding pentru a vedea doar plan-urile relevante."}
      </p>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            busy={busyTier === tier.id}
            onSelect={() => void handleCheckout(tier)}
          />
        ))}
      </div>
      {tiers.some((t) => t.icpSegment === "enterprise") && (
        <p className="mt-4 text-[12px] text-eos-text-tertiary">
          Pentru Enterprise (CISO/multi-framework) contactează echipa CompliScan pentru pricing custom.
        </p>
      )}
    </V3Panel>
  )
}

function TierCard({
  tier,
  busy,
  onSelect,
}: {
  tier: TierDefinition
  busy: boolean
  onSelect: () => void
}) {
  const tone = ICP_TONE[tier.icpSegment]
  const accountScoped = isAccountScopedTier(tier.id)
  return (
    <div
      className={[
        "rounded-eos-lg border bg-eos-surface p-4 transition-colors",
        tone.ring,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span
            className={[
              "inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em]",
              tone.chip,
              tone.chipText,
            ].join(" ")}
          >
            {ICP_LABEL[tier.icpSegment]}
          </span>
          <h3
            data-display-text="true"
            className="mt-2 font-display text-[15px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            {tier.label}
          </h3>
          <p className="mt-1 font-mono text-[20px] font-semibold tracking-[-0.02em] text-eos-text">
            €{tier.priceLabelEur}
            <span className="ml-1 text-[11px] font-medium text-eos-text-tertiary">/lună</span>
          </p>
          <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.04em] text-eos-text-tertiary">
            scope: {accountScoped ? "cont cabinet" : "per organizație"}
          </p>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5">
        {tier.features.slice(0, 5).map((feat, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[12.5px] leading-[1.5] text-eos-text-muted">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-eos-success" strokeWidth={2} />
            <span>{feat}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onSelect}
        disabled={busy}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-eos-sm bg-eos-primary px-3 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-eos-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
        ) : (
          <ExternalLink className="size-3.5" strokeWidth={2} />
        )}
        Activează prin Stripe
      </button>
    </div>
  )
}
