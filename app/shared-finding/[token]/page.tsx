// Sprint 6 follow-up — public read-only page pentru finding partajat cu
// contabilul intern al clientului. Token HMAC-validat, fără auth.

import type { Metadata } from "next"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, ShieldCheck } from "lucide-react"

import { resolveSignedShareToken } from "@/lib/server/share-token-store"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { loadOrganizations } from "@/lib/server/auth"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { ClientPortalActions } from "@/components/compliscan/fiscal/ClientPortalActions"

export const metadata: Metadata = {
  title: "Finding partajat — CompliScan",
  description: "Finding fiscal partajat de cabinetul tău contabil pentru revizuire.",
  robots: { index: false, follow: false },
}

const SEVERITY_TONE: Record<string, { bg: string; border: string; fg: string; label: string }> = {
  critical: { bg: "bg-eos-error-soft", border: "border-eos-error/30", fg: "text-eos-error", label: "Critic" },
  high: { bg: "bg-eos-error-soft", border: "border-eos-error/30", fg: "text-eos-error", label: "Ridicat" },
  medium: { bg: "bg-eos-warning-soft", border: "border-eos-warning/30", fg: "text-eos-warning", label: "Mediu" },
  low: { bg: "bg-eos-success-soft", border: "border-eos-success/30", fg: "text-eos-success", label: "Scăzut" },
}

function formatExpiry(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

export default async function SharedFindingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const payload = resolveSignedShareToken(token)

  if (!payload) {
    return (
      <div className="min-h-screen bg-eos-bg text-eos-text">
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 px-6 py-24 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-eos-error/30 bg-eos-error-soft">
            <AlertTriangle className="size-5 text-eos-error" strokeWidth={2} />
          </div>
          <h1
            data-display-text="true"
            className="font-display text-[24px] font-semibold tracking-[-0.025em] text-eos-text"
          >
            Link invalid sau expirat
          </h1>
          <p className="text-[13.5px] leading-[1.6] text-eos-text-muted">
            Acest link de partajare nu mai este valid. Roagă cabinetul contabil să genereze un nou link
            (linkurile expiră după 72 ore).
          </p>
          <Link
            href="/"
            className="mt-2 inline-flex items-center gap-2 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-4 py-2 text-[12.5px] text-eos-text-muted hover:text-eos-text"
          >
            Spre pagina principală
          </Link>
        </div>
      </div>
    )
  }

  if (!payload.documentId) {
    return (
      <div className="min-h-screen bg-eos-bg text-eos-text px-6 py-12 text-center">
        <p className="text-[13.5px] text-eos-text-muted">Link invalid: nu este atașat de un finding.</p>
      </div>
    )
  }

  const state = await readStateForOrg(payload.orgId)
  const finding = state?.findings?.find((f) => f.id === payload.documentId)
  const orgs = await loadOrganizations()
  const orgName = orgs.find((o) => o.id === payload.orgId)?.name ?? "Cabinet contabil"

  if (!finding) {
    return (
      <div className="min-h-screen bg-eos-bg text-eos-text px-6 py-12 text-center">
        <p className="text-[13.5px] text-eos-text-muted">
          Finding-ul nu mai este disponibil. Cabinetul l-a eliminat sau rezolvat.
        </p>
      </div>
    )
  }

  const severityTone = SEVERITY_TONE[finding.severity] ?? SEVERITY_TONE.medium

  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      <header className="border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <CompliScanLogoLockup variant="flat" size="sm" />
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Read-only · expiră {formatExpiry(payload.expiresAtISO)}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <section>
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            {orgName} · finding fiscal partajat
          </p>
          <div className="mt-3 flex items-start gap-3">
            <span
              className={`inline-flex shrink-0 rounded-eos-sm border px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] ${severityTone.bg} ${severityTone.border} ${severityTone.fg}`}
            >
              {severityTone.label}
            </span>
            <h1
              data-display-text="true"
              className="font-display text-[24px] font-semibold leading-[1.2] tracking-[-0.025em] text-eos-text"
            >
              {finding.title}
            </h1>
          </div>
        </section>

        <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Detalii
          </p>
          <p className="mt-2 text-[13.5px] leading-[1.65] text-eos-text">{finding.detail}</p>

          {finding.legalReference && (
            <div className="mt-4 rounded-eos-sm border border-eos-border-subtle bg-eos-surface-elevated px-3 py-2">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
                Bază legală
              </p>
              <p className="mt-0.5 text-[12.5px] text-eos-text">{finding.legalReference}</p>
            </div>
          )}

          {finding.sourceDocument && (
            <div className="mt-2 rounded-eos-sm border border-eos-border-subtle bg-eos-surface-elevated px-3 py-2">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
                Sursă
              </p>
              <p className="mt-0.5 text-[12.5px] text-eos-text">{finding.sourceDocument}</p>
            </div>
          )}
        </section>

        {finding.remediationHint && (
          <section className="rounded-eos-lg border border-eos-warning/30 bg-eos-warning-soft p-5">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-eos-warning" strokeWidth={2} />
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
                  Recomandare cabinet
                </p>
                <p className="mt-1 text-[13px] leading-[1.6] text-eos-text">
                  {finding.remediationHint}
                </p>
              </div>
            </div>
          </section>
        )}

        {finding.resolution && (
          <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Plan de rezolvare
            </p>
            <ul className="mt-3 space-y-3 text-[13px] leading-[1.6] text-eos-text">
              {finding.resolution.problem && (
                <li className="flex gap-2">
                  <Clock className="mt-0.5 size-3.5 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
                  <span>
                    <strong className="text-eos-text">Problemă:</strong> {finding.resolution.problem}
                  </span>
                </li>
              )}
              {finding.resolution.impact && (
                <li className="flex gap-2">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-eos-error" strokeWidth={2} />
                  <span>
                    <strong className="text-eos-text">Impact:</strong> {finding.resolution.impact}
                  </span>
                </li>
              )}
              {finding.resolution.action && (
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-eos-success" strokeWidth={2} />
                  <span>
                    <strong className="text-eos-text">Acțiune:</strong> {finding.resolution.action}
                  </span>
                </li>
              )}
              {finding.resolution.humanStep && (
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-eos-primary" strokeWidth={2} />
                  <span>
                    <strong className="text-eos-text">Pas uman:</strong> {finding.resolution.humanStep}
                  </span>
                </li>
              )}
            </ul>
          </section>
        )}

        <ClientPortalActions token={token} />

        <footer className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-elevated p-4 text-center">
          <p className="text-[11.5px] leading-[1.55] text-eos-text-muted">
            Acest link este read-only. Întreabă cabinetul {orgName} pentru clarificări sau acțiuni
            (răspuns ANAF, rectificare D300, etc.). Nu necesită cont CompliScan.
          </p>
          <Link
            href="/register?utm_source=shared_finding"
            className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-eos-primary hover:underline"
          >
            Vrei propriul tău CompliScan? Cont gratuit
            <ExternalLink className="size-3" strokeWidth={2} />
          </Link>
        </footer>
      </main>
    </div>
  )
}
