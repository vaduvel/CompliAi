"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Cloud, Database, FileCode2, KeyRound, ShieldCheck, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { LoadingScreen, PageHeader } from "@/components/compliscan/route-sections"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"

type RepoSyncStatus = {
  headerName: string
  requiresKey: boolean
  localAllowedWithoutKey: boolean
  genericEndpoint: string
  githubEndpoint: string
  gitlabEndpoint: string
  curlExample: string
} | null

type CurrentUser = {
  email: string
  orgId: string
  orgName: string
  role: "owner" | "compliance" | "reviewer" | "viewer"
  membershipId: string | null
} | null

type OrganizationMember = {
  membershipId: string
  userId: string
  email: string
  role: "owner" | "compliance" | "reviewer" | "viewer"
  createdAtISO: string
  orgId: string
  orgName: string
}

type MembersResponse = {
  members: OrganizationMember[]
  actorRole: NonNullable<CurrentUser>["role"]
  orgId: string
  orgName: string
} | null

type SupabaseOperationalStatus = {
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

type ApplicationHealthStatus = {
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

type ReleaseReadinessStatus = {
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

type SettingsSummaryResponse = {
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

const DRIFT_OVERRIDE_OPTIONS = [
  { value: "default", label: "Default policy" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const

const DRIFT_OVERRIDE_FIELDS = [
  { change: "model_changed", label: "Model schimbat" },
  { change: "provider_changed", label: "Provider schimbat" },
  { change: "human_review_removed", label: "Review uman eliminat" },
  { change: "personal_data_detected", label: "Date personale detectate" },
  { change: "data_residency_changed", label: "Rezidenta datelor schimbata" },
] as const

const MEMBER_ROLE_OPTIONS = [
  { value: "owner", label: "Administrator" },
  { value: "compliance", label: "Responsabil conformitate" },
  { value: "reviewer", label: "Revizor" },
  { value: "viewer", label: "Vizualizator" },
] as const

const SETTINGS_SUMMARY_ENDPOINT = "/api/settings/summary"

const SETTINGS_VIEW_TABS = [
  {
    value: "workspace",
    label: "Workspace",
    description: "Org, baseline si configuratie locala de lucru.",
  },
  {
    value: "integrari",
    label: "Integrari",
    description: "Supabase, repo sync si traseele tehnice conectate.",
  },
  {
    value: "acces",
    label: "Acces",
    description: "Membri, roluri si separarea responsabilitatilor.",
  },
  {
    value: "operational",
    label: "Operational",
    description: "Health check si verdictul de release readiness.",
  },
  {
    value: "avansat",
    label: "Avansat",
    description: "Politici locale de drift si reset de workspace.",
  },
] as const

export default function SetariPage() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const [repoSyncStatus, setRepoSyncStatus] = useState<RepoSyncStatus>(null)
  const [driftOverrides, setDriftOverrides] = useState<Record<string, (typeof DRIFT_OVERRIDE_OPTIONS)[number]["value"]>>({})
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null)
  const [currentUserResolved, setCurrentUserResolved] = useState(false)
  const [membersData, setMembersData] = useState<MembersResponse>(null)
  const [membersLoading, setMembersLoading] = useState(true)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [updatingMembershipId, setUpdatingMembershipId] = useState<string | null>(null)
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseOperationalStatus>(null)
  const [supabaseStatusLoading, setSupabaseStatusLoading] = useState(true)
  const [supabaseStatusError, setSupabaseStatusError] = useState<string | null>(null)
  const [appHealth, setAppHealth] = useState<ApplicationHealthStatus>(null)
  const [appHealthLoading, setAppHealthLoading] = useState(true)
  const [appHealthError, setAppHealthError] = useState<string | null>(null)
  const [releaseReadiness, setReleaseReadiness] = useState<ReleaseReadinessStatus>(null)
  const [releaseReadinessLoading, setReleaseReadinessLoading] = useState(true)
  const [releaseReadinessError, setReleaseReadinessError] = useState<string | null>(null)
  const canViewReleaseReadiness =
    currentUser?.role === "owner" || currentUser?.role === "compliance"

  useEffect(() => {
    let active = true

    const loadSummary = async () => {
      setRepoSyncStatus(null)
      setCurrentUser(null)
      setCurrentUserResolved(false)
      setMembersData(null)
      setMembersError(null)
      setMembersLoading(true)
      setSupabaseStatus(null)
      setSupabaseStatusError(null)
      setSupabaseStatusLoading(true)
      setAppHealth(null)
      setAppHealthError(null)
      setAppHealthLoading(true)
      setReleaseReadiness(null)
      setReleaseReadinessError(null)
      setReleaseReadinessLoading(true)

      try {
        const response = await fetch(SETTINGS_SUMMARY_ENDPOINT, { cache: "no-store" })
        const payload = (await response.json()) as SettingsSummaryResponse | { error?: string }

        if (!response.ok) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "Nu am putut incarca sumarul de setari."
          )
        }

        if (!active) return

        const summary = payload as SettingsSummaryResponse

        setRepoSyncStatus(summary.repoSyncStatus ?? null)
        setCurrentUser(summary.currentUser ?? null)
        setMembersData(summary.members ?? null)
        setMembersError(summary.membersError ?? null)
        setSupabaseStatus(summary.supabaseStatus ?? null)
        setSupabaseStatusError(summary.supabaseStatusError ?? null)
        setAppHealth(summary.appHealth ?? null)
        setAppHealthError(summary.appHealthError ?? null)
        setReleaseReadiness(summary.releaseReadiness ?? null)
        setReleaseReadinessError(summary.releaseReadinessError ?? null)
      } catch (error) {
        if (!active) return

        setRepoSyncStatus(null)
        setCurrentUser(null)
        setMembersData(null)
        setSupabaseStatus(null)
        setAppHealth(null)
        setReleaseReadiness(null)

        setMembersError(
          error instanceof Error ? error.message : "Nu am putut incarca membrii."
        )
        setSupabaseStatusError(
          error instanceof Error ? error.message : "Nu am putut verifica statusul Supabase."
        )
        setAppHealthError(
          error instanceof Error ? error.message : "Nu am putut verifica health check-ul aplicației."
        )
        setReleaseReadinessError(
          error instanceof Error ? error.message : "Nu am putut verifica release readiness."
        )
      } finally {
        if (!active) return
        setCurrentUserResolved(true)
        setMembersLoading(false)
        setSupabaseStatusLoading(false)
        setAppHealthLoading(false)
        setReleaseReadinessLoading(false)
      }
    }

    void loadSummary()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!cockpit.data) return

    const nextOverrides = Object.fromEntries(
      DRIFT_OVERRIDE_FIELDS.map((item) => [
        item.change,
        cockpit.data?.state.driftSettings?.severityOverrides?.[item.change] ?? "default",
      ])
    ) as Record<string, (typeof DRIFT_OVERRIDE_OPTIONS)[number]["value"]>
    setDriftOverrides(nextOverrides)
  }, [cockpit.data])

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const activeSnapshot = cockpit.data.state.snapshotHistory[0]
  const validatedBaseline = cockpit.data.state.snapshotHistory.find(
    (snapshot) => snapshot.snapshotId === cockpit.data?.state.validatedBaselineSnapshotId
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Setari"
        description="Workspace, integrari, acces si readiness operational pentru organizatia activa"
        score={cockpit.data.summary.score}
        riskLabel={cockpit.data.summary.riskLabel}
      />

      <Tabs defaultValue="workspace" className="space-y-6">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Zone Setari
          </p>
          <div className="overflow-x-auto pb-1">
            <TabsList className="min-w-max gap-0 border-b border-[var(--color-border)] text-[var(--color-on-surface-muted)]">
              {SETTINGS_VIEW_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="min-h-14 min-w-[152px] items-start px-4 py-3 text-left data-[state=active]:border-[var(--color-primary)] data-[state=active]:text-[var(--color-on-surface)]"
                >
                  <span className="text-sm font-medium">{tab.label}</span>
                  <span className="mt-1 whitespace-normal text-xs font-normal leading-5 text-[var(--color-muted)]">
                    {tab.description}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <TabsContent value="workspace" className="space-y-6">
          <SettingsTabIntro
            title="Workspace"
            description="Aici fixezi contextul local de lucru: organizația activă, baseline-ul validat și rezumatul operațional de bază."
          />

          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader>
              <CardTitle className="text-xl">Setari workspace</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                <p className="text-sm text-[var(--color-muted)]">Workspace activ</p>
                <p className="mt-2 text-lg font-semibold">
                  {cockpit.data.workspace.workspaceOwner} · {cockpit.data.workspace.orgName}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                <p className="text-sm text-[var(--color-muted)]">Motor OCR</p>
                <p className="mt-2 text-lg font-semibold">Google Vision API</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                <p className="text-sm text-[var(--color-muted)]">Scor de risc curent</p>
                <p className="mt-2 text-lg font-semibold">{cockpit.data.summary.score}%</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                <p className="text-sm text-[var(--color-muted)]">Ultimul scan</p>
                <p className="mt-2 text-lg font-semibold">{cockpit.lastScanLabel}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4 md:col-span-2">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-[var(--color-muted)]">Baseline validat pentru drift</p>
                    <p className="mt-2 text-lg font-semibold">
                      {validatedBaseline
                        ? `Snapshot validat din ${new Date(validatedBaseline.generatedAt).toLocaleString("ro-RO")}`
                        : "Inca nu exista baseline validat"}
                    </p>
                    <div className="mt-3">
                      <Badge variant={validatedBaseline ? "success" : "warning"}>
                        {validatedBaseline ? "Baseline activ" : "Cere baseline"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {validatedBaseline
                        ? "Drift-ul compara starea curenta cu acest snapshot pana il schimbi sau il elimini."
                        : activeSnapshot
                          ? "Poti valida snapshot-ul curent ca baseline stabil pentru comparatiile viitoare."
                          : "Scaneaza mai intai un document sau un manifest ca sa generam primul snapshot."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      disabled={cockpit.busy || !activeSnapshot}
                      className="h-11 rounded-xl px-5"
                      onClick={() => void cockpitActions.setValidatedBaseline()}
                    >
                      Valideaza snapshot-ul curent
                    </Button>
                    <Button
                      variant="outline"
                      disabled={cockpit.busy || !validatedBaseline}
                      className="h-11 rounded-xl px-5"
                      onClick={() => void cockpitActions.clearValidatedBaseline()}
                    >
                      Elimina baseline-ul
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrari" className="space-y-6">
          <SettingsTabIntro
            title="Integrari"
            description="Aici vezi dacă traseele externe sunt conectate și pregătite: Supabase pentru auth/data/storage și repo sync pentru engineering."
          />

          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-xl">Status operational Supabase</CardTitle>
                  <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                    Verificare rapida pentru backend-ul de identitate, date si storage. Ne ajuta sa vedem daca Sprint 5 este cu adevarat pregatit operational, nu doar configurat.
                  </p>
                </div>
                <Badge
                  variant={
                    supabaseStatusLoading ? "outline" : supabaseStatus?.summary.ready ? "success" : "warning"
                  }
                  className="gap-1.5"
                >
                  {supabaseStatusLoading
                    ? "Se verifica"
                    : supabaseStatus?.summary.ready
                      ? "Pregatit operational"
                      : "Cere revizuire"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {supabaseStatusLoading ? (
                <OperationalLoadingCard>
                  Verificam traseul Supabase pentru auth, data si storage...
                </OperationalLoadingCard>
              ) : supabaseStatusError ? (
                <div className="rounded-2xl border border-[var(--color-warning)] bg-[var(--color-warning-muted)] p-4 text-sm text-[var(--color-warning)]">
                  {supabaseStatusError}
                </div>
              ) : supabaseStatus ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <SettingsTile
                      icon={ShieldCheck}
                      label="Backend auth"
                      value={formatBackendLabel(supabaseStatus.authBackend)}
                    />
                    <SettingsTile
                      icon={Database}
                      label="Backend date"
                      value={formatBackendLabel(supabaseStatus.dataBackend)}
                    />
                    <SettingsTile
                      icon={Cloud}
                      label="Supabase REST"
                      value={supabaseStatus.restConfigured ? "Configurat" : "Lipseste"}
                    />
                    <SettingsTile
                      icon={Cloud}
                      label="Storage privat"
                      value={supabaseStatus.storageConfigured ? "Configurat" : "Lipseste"}
                    />
                    <SettingsTile
                      icon={FileCode2}
                      label="Bucket dovezi"
                      value={supabaseStatus.bucket?.ok ? "Prezent" : "Lipseste"}
                    />
                    <SettingsTile
                      icon={ShieldCheck}
                      label="Fallback local"
                      value={supabaseStatus.localFallbackAllowed ? "Permis" : "Blocat"}
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                      <p className="text-sm font-medium text-[var(--color-on-surface)]">
                        Stare tabele critice
                      </p>
                      <div className="mt-4 space-y-3">
                        {Object.entries(supabaseStatus.tables).map(([table, status]) => (
                          <div
                            key={table}
                            className="rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-medium text-[var(--color-on-surface)]">
                                {table}
                              </span>
                              <Badge variant={status.ok ? "success" : "warning"}>
                                {status.ok
                                  ? "ok"
                                  : status.state === "missing_schema"
                                    ? "schema lipsa"
                                    : "degradat"}
                              </Badge>
                            </div>
                            {status.error ? (
                              <p className="mt-2 text-xs text-[var(--color-warning)]">{status.error}</p>
                            ) : (
                              <p className="mt-2 text-xs text-[var(--color-on-surface-muted)]">
                                Tabelul raspunde la verificarea operationala.
                              </p>
                            )}
                          </div>
                        ))}
                        {supabaseStatus.bucket ? (
                          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-medium text-[var(--color-on-surface)]">
                                bucket:{supabaseStatus.bucket.name}
                              </span>
                              <Badge variant={supabaseStatus.bucket.ok ? "success" : "warning"}>
                                {supabaseStatus.bucket.ok ? "ok" : "lipsa / invalid"}
                              </Badge>
                            </div>
                            <p className="mt-2 text-xs text-[var(--color-on-surface-muted)]">
                              {supabaseStatus.bucket.ok
                                ? "Bucket-ul privat pentru evidence este disponibil."
                                : supabaseStatus.bucket.error || "Bucket-ul nu este pregatit."}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                      <p className="text-sm font-medium text-[var(--color-on-surface)]">
                        Rezumat readiness
                      </p>
                      <div className="mt-4 space-y-3 text-sm text-[var(--color-on-surface-muted)]">
                        <p>
                          Tabele sanatoase:{" "}
                          <span className="font-semibold text-[var(--color-on-surface)]">
                            {supabaseStatus.summary.healthyTables}/{supabaseStatus.summary.totalTables}
                          </span>
                        </p>
                        <p>
                          Schema Sprint 5:{" "}
                          <span className="font-semibold text-[var(--color-on-surface)]">
                            {supabaseStatus.summary.schemaReady ? "aplicata" : "incompleta"}
                          </span>
                        </p>
                        <p>
                          Bucket dovezi:{" "}
                          <span className="font-semibold text-[var(--color-on-surface)]">
                            {supabaseStatus.summary.bucketReady ? "pregatit" : "lipseste / invalid"}
                          </span>
                        </p>
                        <p>
                          Auth ruleaza pe{" "}
                          <span className="font-semibold text-[var(--color-on-surface)]">
                            {formatBackendLabel(supabaseStatus.authBackend)}
                          </span>
                          , iar state-ul de date foloseste{" "}
                          <span className="font-semibold text-[var(--color-on-surface)]">
                            {formatBackendLabel(supabaseStatus.dataBackend)}
                          </span>
                          .
                        </p>
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3 text-xs">
                          {supabaseStatus.summary.ready
                            ? "Traseul Supabase este pregatit operational pentru auth, metadata si storage controlat."
                            : "Mai exista piese de configurat sau verificat in Supabase inainte sa tratam traseul cloud ca fundatie finala."}
                        </div>
                        {supabaseStatus.summary.blockers.length > 0 ? (
                          <div className="rounded-xl border border-[var(--color-warning)] bg-[var(--color-warning-muted)] p-3 text-xs text-[var(--color-warning)]">
                            <p className="font-semibold text-[var(--color-on-surface)]">
                              Blocaje Sprint 5
                            </p>
                            <ul className="mt-2 space-y-1">
                              {supabaseStatus.summary.blockers.map((blocker) => (
                                <li key={blocker}>• {blocker}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        <p className="text-xs text-[var(--color-muted)]">
                          Endpoint intern: <code>/api/integrations/supabase/status</code>
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          SQL Editor: <code>supabase/apply-sprint5-complete.sql</code>
                        </p>
                        <Button asChild variant="outline" className="h-10 rounded-xl px-4">
                          <Link href="/supabase-rls-verification-runbook.md" target="_blank">
                            Deschide runbook RLS
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-xl">Repo sync pentru engineering</CardTitle>
                  <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                    Endpoint-uri dedicate pentru `compliscan.yaml` si manifests relevante. Folosesti CI sync, nu scan complet de repository.
                  </p>
                </div>
                <Badge variant={repoSyncBadgeVariant(repoSyncStatus)}>
                  {repoSyncBadgeLabel(repoSyncStatus)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" className="h-11 rounded-xl px-5">
                  <Link href="/ghid-engineering-compliscan.md" target="_blank">
                    Deschide ghidul de engineering
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SettingsTile
                  icon={ShieldCheck}
                  label="Status"
                  value={
                    repoSyncStatus
                      ? repoSyncStatus.requiresKey
                        ? "Protejat cu cheie"
                        : repoSyncStatus.localAllowedWithoutKey
                          ? "Local fara cheie"
                          : "Disponibil"
                      : "Se incarca"
                  }
                />
                <SettingsTile
                  icon={KeyRound}
                  label="Header"
                  value={repoSyncStatus?.headerName || "x-compliscan-sync-key"}
                />
                <SettingsTile
                  icon={FileCode2}
                  label="GitHub adapter"
                  value={repoSyncStatus ? "/api/integrations/repo-sync/github" : "Se incarca"}
                />
                <SettingsTile
                  icon={FileCode2}
                  label="GitLab adapter"
                  value={repoSyncStatus ? "/api/integrations/repo-sync/gitlab" : "Se incarca"}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                  <p className="text-sm font-medium text-[var(--color-on-surface)]">
                    Endpoint-uri disponibile
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-[var(--color-on-surface-muted)]">
                    <EndpointRow
                      label="Generic"
                      value={repoSyncStatus?.genericEndpoint || "Se incarca"}
                      badge="manual / generic"
                    />
                    <EndpointRow
                      label="GitHub"
                      value={repoSyncStatus?.githubEndpoint || "Se incarca"}
                      badge="adapter dedicat"
                    />
                    <EndpointRow
                      label="GitLab"
                      value={repoSyncStatus?.gitlabEndpoint || "Se incarca"}
                      badge="adapter dedicat"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                  <p className="text-sm font-medium text-[var(--color-on-surface)]">
                    Exemplu rapid de curl
                  </p>
                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3 text-xs leading-6 text-[var(--color-on-surface)]">
                    {repoSyncStatus?.curlExample ||
                      'curl -X POST http://localhost:3001/api/integrations/repo-sync \\\n  -H "Content-Type: application/json" \\\n  -H "x-compliscan-sync-key: ${COMPLISCAN_SYNC_KEY}" \\\n  -d @repo-sync.json'}
                  </pre>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4 text-sm text-[var(--color-on-surface-muted)]">
                <p className="font-medium text-[var(--color-on-surface)]">Cum il folosesti</p>
                <ul className="mt-3 space-y-2">
                  <li>Trimiti doar `compliscan.yaml` si manifests relevante din CI.</li>
                  <li>CompliScan genereaza scan-uri, findings, sisteme detectate si drift fata de baseline.</li>
                  <li>Dupa primul sync, validezi snapshot-ul bun ca baseline si confirmi sistemele AI reale.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acces" className="space-y-6">
          <SettingsTabIntro
            title="Acces"
            description="Aici vezi cine are acces în organizație și cum sunt împărțite rolurile de control și validare."
          />

          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-xl">Membri si roluri</CardTitle>
                  <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                    Owner-ul poate ajusta rolurile. Compliance vede lista pentru audit si separarea responsabilitatilor.
                  </p>
                </div>
                {currentUser?.role && (
                  <Badge variant="outline">
                    Rolul tau: {formatMemberRole(currentUser.role)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {membersLoading ? (
                <OperationalLoadingCard>Incarcam membrii organizatiei...</OperationalLoadingCard>
              ) : membersError ? (
                <div className="rounded-2xl border border-[var(--color-error)] bg-[var(--color-error-muted)] p-4 text-sm text-[var(--color-error)]">
                  {membersError}
                </div>
              ) : membersData?.members.length ? (
                <div className="space-y-3">
                  {membersData.members.map((member) => {
                    const isSelf = member.membershipId === currentUser?.membershipId
                    const canManageRoles = currentUser?.role === "owner"

                    return (
                      <div
                        key={member.membershipId}
                        className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4 lg:grid-cols-[1.3fr_0.8fr_0.8fr]"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                            {member.email}
                          </p>
                          <p className="mt-1 text-xs text-[var(--color-muted)]">
                            Adaugat pe {new Date(member.createdAtISO).toLocaleString("ro-RO")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {formatMemberRole(member.role)}
                          </Badge>
                          {isSelf && (
                            <Badge variant="secondary">
                              Tu
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-start lg:justify-end">
                          {canManageRoles ? (
                            <select
                              className="h-11 min-w-[180px] rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] px-3 text-sm text-[var(--color-on-surface)] outline-none disabled:cursor-not-allowed disabled:opacity-60"
                              value={member.role}
                              disabled={isSelf || updatingMembershipId === member.membershipId}
                              onChange={(event) =>
                                void handleRoleChange(member.membershipId, event.target.value as OrganizationMember["role"])
                              }
                            >
                              {MEMBER_ROLE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-xs text-[var(--color-muted)]">
                              Doar owner-ul poate schimba rolurile.
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  title="Nu exista membri suplimentari"
                  label="Organizatia curenta are doar utilizatorii deja inregistrati in workspace."
                  className="rounded-2xl"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-6">
          <SettingsTabIntro
            title="Operational"
            description="Aici decizi dacă instalația este sănătoasă și dacă build-ul poate fi promovat controlat."
          />

          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-xl">Health check aplicatie</CardTitle>
                  <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                    Rezumat rapid pentru starea de operare: sesiune, backend-uri, fallback și traseul cloud principal.
                  </p>
                </div>
                <Badge variant={healthBadgeVariant(appHealth?.state, appHealthLoading)}>
                  {appHealthLoading
                    ? "Se verifica"
                    : appHealth?.state === "healthy"
                      ? "Sanatos"
                      : appHealth?.state === "blocked"
                        ? "Blocat"
                        : "Degradat"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {appHealthLoading ? (
                <OperationalLoadingCard>
                  Verificam starea aplicatiei si preflight-ul operational...
                </OperationalLoadingCard>
              ) : appHealthError ? (
                <div className="rounded-2xl border border-[var(--color-error)] bg-[var(--color-error-muted)] p-4 text-sm text-[var(--color-error)]">
                  {appHealthError}
                </div>
              ) : appHealth ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {appHealth.checks.map((check) => (
                      <SettingsTile
                        key={check.key}
                        icon={check.key === "session_secret" ? KeyRound : check.key === "supabase_operational" ? Cloud : ShieldCheck}
                        label={check.label}
                        value={formatHealthCheckSummary(check.state, check.summary)}
                      />
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                      <p className="text-sm font-medium text-[var(--color-on-surface)]">
                        Rezumat operational
                      </p>
                      <div className="mt-4 space-y-3 text-sm text-[var(--color-on-surface-muted)]">
                        <p>{appHealth.summary}</p>
                        <p>
                          Auth:{" "}
                          <span className="font-semibold text-[var(--color-on-surface)]">
                            {formatBackendLabel(appHealth.config.authBackend)}
                          </span>
                        </p>
                        <p>
                          Date:{" "}
                          <span className="font-semibold text-[var(--color-on-surface)]">
                            {formatBackendLabel(appHealth.config.dataBackend)}
                          </span>
                        </p>
                        <p>
                          Fallback local:{" "}
                          <span className="font-semibold text-[var(--color-on-surface)]">
                            {appHealth.config.localFallbackAllowed ? "Permis" : "Blocat"}
                          </span>
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          Endpoint intern: <code>/api/health</code>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {appHealth.blockers.length > 0 ? (
                        <div className="rounded-2xl border border-[var(--color-error)] bg-[var(--color-error-muted)] p-4 text-sm text-[var(--color-error)]">
                          <p className="font-semibold text-[var(--color-on-surface)]">Blocaje active</p>
                          <ul className="mt-2 space-y-1">
                            {appHealth.blockers.map((blocker) => (
                              <li key={blocker}>• {blocker}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {appHealth.warnings.length > 0 ? (
                        <div className="rounded-2xl border border-[var(--color-warning)] bg-[var(--color-warning-muted)] p-4 text-sm text-[var(--color-warning)]">
                          <p className="font-semibold text-[var(--color-on-surface)]">Avertismente</p>
                          <ul className="mt-2 space-y-1">
                            {appHealth.warnings.map((warning) => (
                              <li key={warning}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[var(--color-success)] bg-[var(--color-primary-muted)] p-4 text-sm text-[var(--color-success)]">
                          Aplicatia trece health check-ul curent fara blocaje sau avertismente operationale majore.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-xl">Pregatire release</CardTitle>
                  <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                    Rezumat clar pentru a decide daca build-ul poate fi promovat ca release controlat.
                  </p>
                </div>
                <Badge
                  variant={
                    currentUserResolved && !canViewReleaseReadiness
                      ? "outline"
                      : releaseBadgeVariant(releaseReadiness?.state, releaseReadinessLoading)
                  }
                >
                  {currentUserResolved && !canViewReleaseReadiness
                    ? "Restrictionat"
                    : releaseReadinessLoading
                      ? "Se verifica"
                      : releaseReadiness?.state === "ready"
                        ? "Pregatit"
                        : releaseReadiness?.state === "blocked"
                          ? "Blocat"
                          : "Revizuire"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!currentUserResolved ? (
                <OperationalLoadingCard>
                  Verificam sesiunea curenta pentru a decide ce diagnostice operationale poti vedea...
                </OperationalLoadingCard>
              ) : !canViewReleaseReadiness ? (
                <EmptyState
                  title="Acces restrictionat"
                  label="Verdictul complet de release readiness este vizibil doar pentru rolurile Owner si Responsabil conformitate."
                  className="rounded-2xl"
                />
              ) : releaseReadinessLoading ? (
                <OperationalLoadingCard>Verificam release readiness...</OperationalLoadingCard>
              ) : releaseReadinessError ? (
                <div className="rounded-2xl border border-[var(--color-error)] bg-[var(--color-error-muted)] p-4 text-sm text-[var(--color-error)]">
                  {releaseReadinessError}
                </div>
              ) : releaseReadiness ? (
                <>
                  {releaseReadiness.state === "blocked" ? (
                    <div className="rounded-2xl border border-[var(--color-error)] bg-[var(--color-error-muted)] p-4 text-sm text-[var(--color-error)]">
                      <p className="font-semibold text-[var(--color-on-surface)]">Release blocat</p>
                      <p className="mt-2 text-[var(--color-error)]">
                        Build-ul nu trebuie promovat pana cand blocajele operationale sunt inchise.
                      </p>
                      <p className="mt-3 text-xs text-[var(--color-on-surface-muted)]">
                        Ruleaza <code>npm run preflight:release</code> si verifica <code>/api/release-readiness</code> dupa fixuri.
                      </p>
                    </div>
                  ) : null}
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {releaseReadiness.checks.map((check) => (
                      <SettingsTile
                        key={check.key}
                        icon={check.key.includes("supabase") ? Cloud : check.key === "session_secret" ? KeyRound : ShieldCheck}
                        label={check.label}
                        value={formatHealthCheckSummary(check.state, check.summary)}
                      />
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                      <p className="text-sm font-medium text-[var(--color-on-surface)]">Rezumat</p>
                      <div className="mt-4 space-y-3 text-sm text-[var(--color-on-surface-muted)]">
                        <p>{releaseReadiness.summary}</p>
                        <p className="text-xs text-[var(--color-muted)]">
                          Endpoint intern: <code>/api/release-readiness</code>
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          Preflight local: <code>npm run preflight:release</code>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {releaseReadiness.blockers.length > 0 ? (
                        <div className="rounded-2xl border border-[var(--color-error)] bg-[var(--color-error-muted)] p-4 text-sm text-[var(--color-error)]">
                          <p className="font-semibold text-[var(--color-on-surface)]">Blocaje active</p>
                          <ul className="mt-2 space-y-1">
                            {releaseReadiness.blockers.map((blocker) => (
                              <li key={blocker}>• {blocker}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {releaseReadiness.warnings.length > 0 ? (
                        <div className="rounded-2xl border border-[var(--color-warning)] bg-[var(--color-warning-muted)] p-4 text-sm text-[var(--color-warning)]">
                          <p className="font-semibold text-[var(--color-on-surface)]">Avertismente</p>
                          <ul className="mt-2 space-y-1">
                            {releaseReadiness.warnings.map((warning) => (
                              <li key={warning}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[var(--color-success)] bg-[var(--color-primary-muted)] p-4 text-sm text-[var(--color-success)]">
                          Release readiness nu raporteaza avertismente majore.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avansat" className="space-y-6">
          <SettingsTabIntro
            title="Avansat"
            description="Aici pui politici locale de drift și acțiuni destructive care nu ar trebui să stea în același flux cu operational sau acces."
          />

          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-xl">Drift severity policy</CardTitle>
                  <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                    Override-uri de workspace pentru drift-urile care contează cel mai mult. Politica implicită rămâne activă pentru tot ce nu configurezi aici.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  disabled={cockpit.busy}
                  className="h-11 rounded-xl px-5"
                  onClick={() => void cockpitActions.updateDriftSeverityOverrides(driftOverrides)}
                >
                  Salvează severitatea drift
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {DRIFT_OVERRIDE_FIELDS.map((item) => (
                <label
                  key={item.change}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
                >
                  <span className="text-sm font-medium text-[var(--color-on-surface)]">{item.label}</span>
                  <select
                    className="mt-3 h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] px-3 text-sm text-[var(--color-on-surface)] outline-none"
                    value={driftOverrides[item.change] ?? "default"}
                    onChange={(event) =>
                      setDriftOverrides((current) => ({
                        ...current,
                        [item.change]: event.target.value as (typeof DRIFT_OVERRIDE_OPTIONS)[number]["value"],
                      }))
                    }
                  >
                    {DRIFT_OVERRIDE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Schimbi doar severitatea. Impactul, dovada cerută și acțiunea recomandată rămân unificate în politica de drift.
                  </p>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[var(--color-error)] bg-[var(--color-surface)]">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-xl text-[var(--color-error)]">Reset workspace local</CardTitle>
                <Badge variant="destructive">Actiune destructiva</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-[var(--color-error)] bg-[var(--color-error-muted)] p-4 text-sm text-[var(--color-on-surface-muted)]">
                Acest buton sterge starea de lucru din workspace-ul curent: scanari, findings, drift,
                task-uri, dovezi atasate si activitate salvata. Sesiunea de autentificare ramane activa.
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-on-surface)]">
                    Vrei sa vezi exact experienta unui utilizator nou?
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Dupa reset, dashboard-ul revine la starea initiala de onboarding.
                  </p>
                </div>

                <Button
                  variant="destructive"
                  disabled={cockpit.busy}
                  className="h-11 rounded-xl px-5"
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Resetezi complet workspace-ul curent? Toate scanarile si task-urile salvate vor fi sterse."
                      )
                    ) {
                      return
                    }

                    void cockpitActions.resetWorkspaceState()
                  }}
                >
                  <Trash2 className="size-4" strokeWidth={2.25} />
                  Sterge scanarile si reseteaza workspace-ul
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  async function handleRoleChange(
    membershipId: string,
    role: OrganizationMember["role"]
  ) {
    setUpdatingMembershipId(membershipId)
    setMembersError(null)

    try {
      const response = await fetch(`/api/auth/members/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      const payload = (await response.json()) as {
        ok?: boolean
        error?: string
        member?: OrganizationMember
      }

      if (!response.ok || !payload.member) {
        throw new Error(payload.error || "Rolul nu a putut fi actualizat.")
      }

      setMembersData((current) => {
        if (!current) return current
        return {
          ...current,
          members: current.members.map((member) =>
            member.membershipId === membershipId ? payload.member! : member
          ),
        }
      })

      toast.success("Rol actualizat", {
        description: `${payload.member.email} este acum ${formatMemberRole(payload.member.role)}.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rolul nu a putut fi actualizat."
      setMembersError(message)
      toast.error("Actualizarea a esuat", { description: message })
    } finally {
      setUpdatingMembershipId(null)
    }
  }
}

function SettingsTabIntro({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-muted)]">
        {title}
      </p>
      <p className="max-w-3xl text-sm text-[var(--color-on-surface-muted)]">{description}</p>
    </div>
  )
}

function SettingsTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileCode2
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
      <div className="flex items-center gap-2 text-[var(--color-muted)]">
        <Icon className="size-4" strokeWidth={2.25} />
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">{value}</p>
    </div>
  )
}

function EndpointRow({
  label,
  value,
  badge,
}: {
  label: string
  value: string
  badge: string
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-[var(--color-on-surface)]">{label}</span>
        <Badge variant="outline">
          {badge}
        </Badge>
      </div>
      <p className="mt-2 break-all text-xs text-[var(--color-on-surface-muted)]">{value}</p>
    </div>
  )
}

function OperationalLoadingCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4 text-sm text-[var(--color-muted)]"
    >
      {children}
    </div>
  )
}

function formatMemberRole(role: OrganizationMember["role"]) {
  switch (role) {
    case "owner":
      return "Administrator"
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

function formatBackendLabel(backend: "local" | "supabase" | "hybrid") {
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

function repoSyncBadgeVariant(status: RepoSyncStatus) {
  if (!status) return "outline" as const
  if (status.requiresKey) return "success" as const
  if (status.localAllowedWithoutKey) return "warning" as const
  return "secondary" as const
}

function repoSyncBadgeLabel(status: RepoSyncStatus) {
  if (!status) return "Se incarca"
  if (status.requiresKey) return "Protejat cu cheie"
  if (status.localAllowedWithoutKey) return "Local fara cheie"
  return "Disponibil"
}

function healthBadgeVariant(
  state?: "healthy" | "degraded" | "blocked",
  loading?: boolean
) {
  if (loading) {
    return "outline" as const
  }

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

function releaseBadgeVariant(
  state?: "ready" | "review" | "blocked",
  loading?: boolean
) {
  if (loading) {
    return "outline" as const
  }

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

function formatHealthCheckSummary(
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
