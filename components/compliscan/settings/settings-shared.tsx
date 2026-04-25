"use client"

import { type LucideIcon } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"

export type RepoSyncStatus = {
  headerName: string
  requiresKey: boolean
  localAllowedWithoutKey: boolean
  genericEndpoint: string
  githubEndpoint: string
  gitlabEndpoint: string
  curlExample: string
} | null

export type CurrentUser = {
  email: string
  orgId: string
  orgName: string
  role: "owner" | "partner_manager" | "compliance" | "reviewer" | "viewer"
  membershipId: string | null
} | null

export type OrganizationMember = {
  membershipId: string
  userId: string
  email: string
  role: "owner" | "partner_manager" | "compliance" | "reviewer" | "viewer"
  createdAtISO: string
  orgId: string
  orgName: string
}

export type MembersResponse = {
  members: OrganizationMember[]
  actorRole: NonNullable<CurrentUser>["role"]
  orgId: string
  orgName: string
} | null

export type SupabaseOperationalStatus = {
  authBackend: "local" | "supabase" | "hybrid"
  dataBackend: "local" | "supabase" | "hybrid"
  restConfigured: boolean
  storageConfigured: boolean
  localFallbackAllowed: boolean
  bucket: {
    ok: boolean
    name: string
    state?: "present" | "missing_bucket" | "error"
    error?: string
  } | null
  tables: Record<string, { ok: boolean; state?: "healthy" | "missing_schema" | "error"; error?: string }>
  summary: {
    healthyTables: number
    totalTables: number
    schemaReady: boolean
    bucketReady: boolean
    blockers: string[]
    ready: boolean
  }
} | null

export type ApplicationHealthStatus = {
  state: "healthy" | "degraded" | "blocked"
  summary: string
  blockers: string[]
  warnings: string[]
  checks: Array<{
    key: string
    label: string
    state: "healthy" | "degraded" | "blocked"
    summary: string
  }>
  config: {
    authBackend: "local" | "supabase" | "hybrid"
    dataBackend: "local" | "supabase" | "hybrid"
    localFallbackAllowed: boolean
    production: boolean
  }
} | null

export type ReleaseReadinessStatus = {
  state: "ready" | "review" | "blocked"
  summary: string
  blockers: string[]
  warnings: string[]
  checks: Array<{
    key: string
    label: string
    state: "healthy" | "degraded" | "blocked"
    summary: string
  }>
} | null

export type SettingsSummaryResponse = {
  repoSyncStatus: RepoSyncStatus
  currentUser: CurrentUser
  members: MembersResponse
  membersError?: string | null
  supabaseStatus: SupabaseOperationalStatus
  supabaseStatusError?: string | null
  appHealth: ApplicationHealthStatus
  appHealthError?: string | null
  releaseReadiness: ReleaseReadinessStatus
  releaseReadinessError?: string | null
}

export function SettingsTabIntro({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="space-y-1.5">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-muted">
        {title}
      </p>
      <p className="max-w-2xl text-sm leading-6 text-eos-text-muted">
        {description}
      </p>
    </div>
  )
}

export function SettingsTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-3.5">
      <div className="flex items-center gap-2 text-eos-text-muted">
        <span className="grid size-7 place-items-center rounded-eos-md border border-eos-border bg-eos-bg-inset">
          <Icon className="size-3.5" strokeWidth={2} />
        </span>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em]">{label}</p>
      </div>
      <p className="mt-3 text-sm font-semibold leading-5 text-eos-text">{value}</p>
    </div>
  )
}

export function EndpointRow({
  label,
  value,
  badge,
}: {
  label: string
  value: string
  badge: string
}) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-eos-text">{label}</span>
        <Badge variant="outline">{badge}</Badge>
      </div>
      <p className="mt-2 break-all text-xs leading-5 text-eos-text-muted">{value}</p>
    </div>
  )
}

export function OperationalLoadingCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 text-sm text-eos-text-muted"
    >
      {children}
    </div>
  )
}

export function SettingsStatusBlock({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-eos-text-muted">{eyebrow}</p>
      <p className="mt-2 text-sm font-semibold text-eos-text">{title}</p>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-eos-text-muted">{description}</p>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  )
}

export function SettingsSignalCard({
  title,
  items,
  tone,
  emptyMessage,
}: {
  title: string
  items: string[]
  tone: "success" | "warning" | "destructive"
  emptyMessage?: string
}) {
  const toneClass =
    tone === "destructive"
      ? "border-eos-error-border bg-eos-error-soft text-eos-error"
      : tone === "warning"
        ? "border-eos-warning-border bg-eos-warning-soft text-eos-warning"
        : "border-eos-border bg-eos-primary-soft text-eos-success"

  return (
    <div className={`rounded-eos-md border p-4 text-sm ${toneClass}`}>
      <p className="font-semibold text-eos-text">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      ) : emptyMessage ? (
        <p className="mt-2">{emptyMessage}</p>
      ) : null}
    </div>
  )
}

export function SettingsDisclosure({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-eos-text-muted">
          {eyebrow}
        </p>
        <p className="mt-1 text-sm font-medium text-eos-text">{title}</p>
        <p className="mt-1 text-xs leading-5 text-eos-text-muted">
          {description}
        </p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

export function formatMemberRole(role: OrganizationMember["role"]) {
  switch (role) {
    case "owner":
      return "Administrator"
    case "partner_manager":
      return "Consultant portofoliu"
    case "compliance":
      return "Responsabil conformitate"
    case "reviewer":
      return "Revizor"
    case "viewer":
      return "Vizualizator"
    default:
      return role
  }
}

export function formatBackendLabel(backend: "local" | "supabase" | "hybrid") {
  switch (backend) {
    case "local":
      return "Local"
    case "supabase":
      return "Supabase"
    case "hybrid":
      return "Hibrid"
    default:
      return backend
  }
}

export function repoSyncBadgeVariant(status: RepoSyncStatus) {
  if (!status) return "outline" as const
  if (status.requiresKey) return "success" as const
  if (status.localAllowedWithoutKey) return "warning" as const
  return "secondary" as const
}

export function repoSyncBadgeLabel(status: RepoSyncStatus) {
  if (!status) return "Se incarca"
  if (status.requiresKey) return "Protejat cu cheie"
  if (status.localAllowedWithoutKey) return "Local fara cheie"
  return "Disponibil"
}

export function healthBadgeVariant(
  state?: "healthy" | "degraded" | "blocked",
  loading?: boolean
) {
  if (loading) return "outline" as const

  switch (state) {
    case "healthy":
      return "success" as const
    case "blocked":
      return "destructive" as const
    case "degraded":
    default:
      return "warning" as const
  }
}

export function releaseBadgeVariant(
  state?: "ready" | "review" | "blocked",
  loading?: boolean
) {
  if (loading) return "outline" as const

  switch (state) {
    case "ready":
      return "success" as const
    case "blocked":
      return "destructive" as const
    case "review":
    default:
      return "warning" as const
  }
}

export function formatHealthCheckSummary(
  state: "healthy" | "degraded" | "blocked",
  summary: string
) {
  switch (state) {
    case "healthy":
      return `OK · ${summary}`
    case "blocked":
      return `Blocat · ${summary}`
    case "degraded":
    default:
      return `Revizuire · ${summary}`
  }
}
