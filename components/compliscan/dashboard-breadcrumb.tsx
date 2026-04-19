"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, LayoutDashboard } from "lucide-react"

type Crumb = {
  label: string
  href?: string
}

type Entry = {
  test: (p: string) => boolean
  crumbs: (p: string) => Crumb[]
}

const ENTRIES: Entry[] = [
  // ── Resolve ───────────────────────────────────────────────────────────────
  {
    test: (p) => p.startsWith("/dashboard/resolve/support"),
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "De rezolvat", href: "/dashboard/resolve" },
      { label: "Suport" },
    ],
  },
  {
    test: (p) => /^\/dashboard\/resolve\/[^/]+/.test(p),
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "De rezolvat", href: "/dashboard/resolve" },
      { label: "Caz" },
    ],
  },
  {
    test: (p) => p === "/dashboard/resolve",
    crumbs: () => [{ label: "Acasă", href: "/dashboard" }, { label: "De rezolvat" }],
  },

  // ── Scan ──────────────────────────────────────────────────────────────────
  {
    test: (p) => p.startsWith("/dashboard/scan/results/"),
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Scanează", href: "/dashboard/scan" },
      { label: "Rezultate" },
    ],
  },
  {
    test: (p) => p === "/dashboard/scan/history",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Scanează", href: "/dashboard/scan" },
      { label: "Istoric" },
    ],
  },
  {
    test: (p) => p === "/dashboard/scan",
    crumbs: () => [{ label: "Acasă", href: "/dashboard" }, { label: "Scanează" }],
  },

  // ── NIS2 ──────────────────────────────────────────────────────────────────
  {
    test: (p) => p === "/dashboard/nis2/eligibility",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "De rezolvat", href: "/dashboard/resolve" },
      { label: "NIS2", href: "/dashboard/nis2" },
      { label: "Eligibilitate" },
    ],
  },
  {
    test: (p) => p === "/dashboard/nis2/maturitate",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "De rezolvat", href: "/dashboard/resolve" },
      { label: "NIS2", href: "/dashboard/nis2" },
      { label: "Maturitate" },
    ],
  },
  {
    test: (p) => p === "/dashboard/nis2/inregistrare-dnsc",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "De rezolvat", href: "/dashboard/resolve" },
      { label: "NIS2", href: "/dashboard/nis2" },
      { label: "Înregistrare DNSC" },
    ],
  },
  {
    test: (p) => p === "/dashboard/nis2/governance",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "De rezolvat", href: "/dashboard/resolve" },
      { label: "NIS2", href: "/dashboard/nis2" },
      { label: "Guvernanță" },
    ],
  },
  {
    test: (p) => p.startsWith("/dashboard/nis2/"),
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "De rezolvat", href: "/dashboard/resolve" },
      { label: "NIS2", href: "/dashboard/nis2" },
    ],
  },
  {
    test: (p) => p === "/dashboard/nis2",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "De rezolvat", href: "/dashboard/resolve" },
      { label: "NIS2" },
    ],
  },

  // ── Dosar / Reports ───────────────────────────────────────────────────────
  {
    test: (p) => p === "/dashboard/reports/vault",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Dosar", href: "/dashboard/dosar" },
      { label: "Vault" },
    ],
  },
  {
    test: (p) => p === "/dashboard/reports/audit-log",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Dosar", href: "/dashboard/dosar" },
      { label: "Jurnal audit" },
    ],
  },
  {
    test: (p) => p === "/dashboard/reports/policies",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Dosar", href: "/dashboard/dosar" },
      { label: "Politici" },
    ],
  },
  {
    test: (p) => p === "/dashboard/reports/trust-center",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Dosar", href: "/dashboard/dosar" },
      { label: "Trust Center" },
    ],
  },
  {
    test: (p) => p.startsWith("/dashboard/reports"),
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Dosar", href: "/dashboard/dosar" },
      { label: "Rapoarte" },
    ],
  },
  {
    test: (p) => p === "/dashboard/generator",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Dosar", href: "/dashboard/dosar" },
      { label: "Generator" },
    ],
  },
  {
    test: (p) => p === "/dashboard/documente",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Dosar", href: "/dashboard/dosar" },
      { label: "Documente" },
    ],
  },
  {
    test: (p) => p === "/dashboard/audit-log",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Dosar", href: "/dashboard/dosar" },
      { label: "Jurnal audit" },
    ],
  },
  {
    test: (p) => p === "/dashboard/politici",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Dosar", href: "/dashboard/dosar" },
      { label: "Politici" },
    ],
  },
  {
    test: (p) => p === "/dashboard/dosar",
    crumbs: () => [{ label: "Acasă", href: "/dashboard" }, { label: "Dosar" }],
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  {
    test: (p) => p === "/dashboard/settings/abonament",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Setări", href: "/dashboard/settings" },
      { label: "Abonament" },
    ],
  },
  {
    test: (p) => p.startsWith("/dashboard/settings"),
    crumbs: () => [{ label: "Acasă", href: "/dashboard" }, { label: "Setări" }],
  },

  // ── Sisteme AI ────────────────────────────────────────────────────────────
  {
    test: (p) => p.startsWith("/dashboard/sisteme/eu-db-wizard"),
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Sisteme AI", href: "/dashboard/sisteme" },
      { label: "Înregistrare EU DB" },
    ],
  },
  {
    test: (p) => p.startsWith("/dashboard/sisteme/"),
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Sisteme AI", href: "/dashboard/sisteme" },
    ],
  },
  {
    test: (p) => p === "/dashboard/sisteme",
    crumbs: () => [{ label: "Acasă", href: "/dashboard" }, { label: "Sisteme AI" }],
  },
  {
    test: (p) => p === "/dashboard/conformitate",
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "Sisteme AI", href: "/dashboard/sisteme" },
      { label: "Conformitate" },
    ],
  },

  // ── Module specialist ─────────────────────────────────────────────────────
  {
    test: (p) => p.startsWith("/dashboard/dsar"),
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "De rezolvat", href: "/dashboard/resolve" },
      { label: "DSAR" },
    ],
  },
  {
    test: (p) => p.startsWith("/dashboard/dora"),
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "De rezolvat", href: "/dashboard/resolve" },
      { label: "DORA" },
    ],
  },
  {
    test: (p) => p.startsWith("/dashboard/fiscal"),
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "De rezolvat", href: "/dashboard/resolve" },
      { label: "Fiscal" },
    ],
  },
  {
    test: (p) => p.startsWith("/dashboard/vendor-review"),
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "De rezolvat", href: "/dashboard/resolve" },
      { label: "Vendor Review" },
    ],
  },
  {
    test: (p) => p.startsWith("/dashboard/whistleblowing"),
    crumbs: () => [
      { label: "Acasă", href: "/dashboard" },
      { label: "De rezolvat", href: "/dashboard/resolve" },
      { label: "Whistleblowing" },
    ],
  },

  // ── Altele ────────────────────────────────────────────────────────────────
  {
    test: (p) => p === "/dashboard/alerte",
    crumbs: () => [{ label: "Acasă", href: "/dashboard" }, { label: "Alerte" }],
  },
  {
    test: (p) => p === "/dashboard/calendar",
    crumbs: () => [{ label: "Acasă", href: "/dashboard" }, { label: "Calendar" }],
  },
  {
    test: (p) => p === "/dashboard/checklists",
    crumbs: () => [{ label: "Acasă", href: "/dashboard" }, { label: "Checklists" }],
  },
  {
    test: (p) => p === "/dashboard/agents",
    crumbs: () => [{ label: "Acasă", href: "/dashboard" }, { label: "Agenți" }],
  },
]

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const clean = pathname.split("?")[0]

  // Nu afișăm pe Acasă
  if (clean === "/dashboard") return null

  const entry = ENTRIES.find((e) => e.test(clean))
  if (!entry) return null

  const crumbs = entry.crumbs(clean)
  if (crumbs.length <= 1) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 flex min-w-0 items-center gap-0.5 overflow-hidden text-[11px]"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={i} className="flex min-w-0 shrink-0 items-center gap-0.5">
            {i === 0 && (
              <LayoutDashboard
                className="mr-0.5 h-3 w-3 shrink-0 text-eos-text-tertiary"
                strokeWidth={2}
              />
            )}
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                className="truncate text-eos-text-tertiary transition-colors duration-100 hover:text-eos-text-muted"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? "truncate font-medium text-eos-text-muted"
                    : "truncate text-eos-text-tertiary"
                }
              >
                {crumb.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight className="h-3 w-3 shrink-0 text-eos-border-strong" strokeWidth={2} />
            )}
          </span>
        )
      })}
    </nav>
  )
}
