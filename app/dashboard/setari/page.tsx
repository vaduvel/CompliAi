"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { LoadingScreen } from "@/components/compliscan/route-sections"
import {
  CurrentUser,
  formatMemberRole,
  MembersResponse,
  OperationalLoadingCard,
  OrganizationMember,
  ReleaseReadinessStatus,
  RepoSyncStatus,
  SettingsSummaryResponse,
  SettingsTabIntro,
  SupabaseOperationalStatus,
  ApplicationHealthStatus,
} from "@/components/compliscan/settings/settings-shared"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SectionBoundary } from "@/components/evidence-os/SectionBoundary"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { ActionCluster } from "@/components/evidence-os/ActionCluster"

const DRIFT_OVERRIDE_OPTIONS = [
  { value: "default", label: "Politica implicita" },
  { value: "low", label: "Scazut" },
  { value: "medium", label: "Mediu" },
  { value: "high", label: "Ridicat" },
  { value: "critical", label: "Critic" },
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

const SettingsIntegrationsTab = dynamic(
  () =>
    import("@/components/compliscan/settings/settings-integrations-tab").then(
      (mod) => mod.SettingsIntegrationsTab
    ),
  {
    loading: () => (
      <OperationalLoadingCard>Incarcam zona de integrari si diagnosticele externe...</OperationalLoadingCard>
    ),
  }
)

const SettingsOperationalTab = dynamic(
  () =>
    import("@/components/compliscan/settings/settings-operational-tab").then(
      (mod) => mod.SettingsOperationalTab
    ),
  {
    loading: () => (
      <OperationalLoadingCard>Incarcam health check-ul si verdictul operational...</OperationalLoadingCard>
    ),
  }
)

const SETTINGS_VIEW_TABS = [
  {
    value: "workspace",
    label: "Workspace",
    description: "Org, baseline si context local.",
  },
  {
    value: "integrari",
    label: "Integrari",
    description: "Conexiuni si status extern.",
  },
  {
    value: "acces",
    label: "Acces",
    description: "Membri, roluri si ownership.",
  },
  {
    value: "operational",
    label: "Operational",
    description: "Health check si stare operationala.",
  },
  {
    value: "avansat",
    label: "Avansat",
    description: "Politici locale si reset.",
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
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState<OrganizationMember["role"]>("reviewer")
  const [creatingMember, setCreatingMember] = useState(false)
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
  const releaseReadinessLabel = canViewReleaseReadiness
    ? releaseReadiness?.state === "ready"
      ? "pregatit"
      : releaseReadiness?.state === "blocked"
        ? "blocat"
        : releaseReadiness?.state === "review"
          ? "review"
          : releaseReadinessLoading
            ? "in verificare"
            : releaseReadinessError
              ? "indisponibil"
              : "in verificare"
    : "rol fara acces"
  const summaryItems: SummaryStripItem[] = [
    {
      label: "Workspace activ",
      value: cockpit.data.workspace.orgName,
      hint: "organizatia activa si contextul operational curent",
      tone: "neutral",
    },
    {
      label: "Baseline",
      value: validatedBaseline ? "validat" : "lipseste",
      hint: validatedBaseline
        ? "drift-ul are un reper stabil"
        : "fara baseline, comparatia si drift-ul raman mai slabe",
      tone: validatedBaseline ? "success" : "warning",
    },
    {
      label: "Acces curent",
      value: currentUser ? formatMemberRole(currentUser.role) : "in verificare",
      hint: currentUser
        ? "rolul tau defineste ce poti valida, modifica sau exporta"
        : "sesiunea si rolul se verifica in sumarul operational",
      tone: currentUser ? "accent" : "neutral",
    },
    {
      label: "Stare operationala",
      value: releaseReadinessLabel,
      hint: canViewReleaseReadiness
        ? releaseReadiness?.summary ?? "release readiness-ul ramane checkpoint separat de configurare"
        : "health si readiness raman vizibile doar rolurilor administrative potrivite",
      tone:
        releaseReadiness?.state === "ready"
          ? "success"
          : releaseReadiness?.state === "blocked"
            ? "danger"
            : "warning",
    },
  ]

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Setari"
        title="Administrezi contextul operational"
        description="Context, acces si operare. Executia ramane in Scanare, Control si Dovada."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              operational admin
            </Badge>
          </>
        }
        aside={
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Snapshot admin
            </p>
            <p className="text-2xl font-semibold text-eos-text">{cockpit.data.workspace.orgName}</p>
            <p className="text-sm text-eos-text-muted">
              {currentUser ? formatMemberRole(currentUser.role) : "rol in verificare"}
            </p>
          </div>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/sisteme">Control</Link>
            </Button>
          </>
        }
      />

      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Setari"
            title="Vezi rapid starea administrativa"
            description="Context, baseline, acces si readiness."
            items={summaryItems}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <SectionBoundary
          eyebrow="Handoff"
          title="Configurezi aici, lucrezi in produs"
          description="Setari ramane zona administrativa. Dupa context si acces revii in Dashboard, Control sau Dovada."
        />
        <HandoffCard
          title="Setari nu inlocuieste fluxul principal"
          description="Dupa configurare si verificare operationala, revii in zona potrivita de lucru."
          destinationLabel="dashboard / control / dovada"
          checklist={[
            "nu tratezi Setari ca overview executiv",
            "folosesti Setari pentru context, acces si operare",
          ]}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/dashboard">Deschide Dashboard</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/checklists">Deschide Dovada</Link>
              </Button>
            </>
          }
        />
      </div>

      <Tabs defaultValue="workspace" className="space-y-6">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-muted">
            Zone Setari
          </p>
          <div className="overflow-x-auto pb-1">
            <TabsList className="min-w-max gap-0 border-b border-eos-border text-eos-text-muted">
              {SETTINGS_VIEW_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="min-h-14 min-w-[152px] items-start px-4 py-3 text-left data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
                >
                  <span className="text-sm font-medium">{tab.label}</span>
                  <span className="mt-1 whitespace-normal text-xs font-normal leading-5 text-eos-text-muted">
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

          <Card className="border-eos-border bg-eos-surface">
            <CardHeader>
              <CardTitle className="text-xl">Setari workspace</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
                <p className="text-sm text-eos-text-muted">Workspace activ</p>
                <p className="mt-2 text-lg font-semibold">
                  {cockpit.data.workspace.workspaceOwner} · {cockpit.data.workspace.orgName}
                </p>
              </div>
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
                <p className="text-sm text-eos-text-muted">Motor OCR</p>
                <p className="mt-2 text-lg font-semibold">Google Vision API</p>
              </div>
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
                <p className="text-sm text-eos-text-muted">Scor de risc curent</p>
                <p className="mt-2 text-lg font-semibold">{cockpit.data.summary.score}%</p>
              </div>
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
                <p className="text-sm text-eos-text-muted">Ultimul scan</p>
                <p className="mt-2 text-lg font-semibold">{cockpit.lastScanLabel}</p>
              </div>
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 md:col-span-2">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-eos-text-muted">Baseline validat pentru drift</p>
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
                    {!validatedBaseline && (
                      <p className="mt-1 text-sm text-eos-text-muted">
                        {activeSnapshot
                          ? "Poti valida snapshot-ul curent ca reper stabil pentru drift."
                          : "Scaneaza mai intai un document sau un manifest ca sa generam primul snapshot."}
                      </p>
                    )}
                  </div>
                  <ActionCluster
                    eyebrow="Actiuni"
                    title="Baseline"
                    actions={
                      <>
                        <Button
                          variant="secondary"
                          disabled={cockpit.busy || !activeSnapshot}
                          size="default"
                          onClick={() => void cockpitActions.setValidatedBaseline()}
                        >
                          Valideaza snapshot-ul curent
                        </Button>
                        <Button
                          variant="outline"
                          disabled={cockpit.busy || !validatedBaseline}
                          size="default"
                          onClick={() => void cockpitActions.clearValidatedBaseline()}
                        >
                          Elimina baseline-ul
                        </Button>
                      </>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrari" className="space-y-6">
          <SettingsIntegrationsTab
            repoSyncStatus={repoSyncStatus}
            supabaseStatus={supabaseStatus}
            supabaseStatusLoading={supabaseStatusLoading}
            supabaseStatusError={supabaseStatusError}
          />
        </TabsContent>

        <TabsContent value="acces" className="space-y-6">
          <SettingsTabIntro
            title="Acces"
            description="Aici vezi cine are acces în organizație și cum sunt împărțite rolurile de control și validare."
          />

          <Card className="border-eos-border bg-eos-surface">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-xl">Membri si roluri</CardTitle>
                  <p className="mt-2 text-sm text-eos-text-muted">
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
              {currentUser?.role === "owner" ? (
                <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-eos-text">
                        Adauga utilizator existent din workspace
                      </p>
                      <p className="mt-1 text-xs leading-6 text-eos-text-muted">
                        Aici adaugi doar utilizatori care au deja cont in workspace-ul local. Invitatiile externe raman pas separat.
                      </p>
                    </div>
                    <Badge variant="outline">owner-only</Badge>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_220px_auto]">
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(event) => setNewMemberEmail(event.target.value)}
                      placeholder="coleg@companie.ro"
                      className="h-9 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                    />
                    <select
                      className="h-9 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                      value={newMemberRole}
                      onChange={(event) => setNewMemberRole(event.target.value as OrganizationMember["role"])}
                    >
                      {MEMBER_ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="default"
                      disabled={creatingMember || !newMemberEmail.trim()}
                      onClick={() => void handleAddMember()}
                    >
                      Adauga membru
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 text-sm text-eos-text-muted">
                  Doar owner-ul poate adauga membri noi. Lista de mai jos ramane read-only pentru audit si separarea responsabilitatilor.
                </div>
              )}

              {membersLoading ? (
                <OperationalLoadingCard>Incarcam membrii organizatiei...</OperationalLoadingCard>
              ) : membersError ? (
                <div className="rounded-eos-md border border-eos-error-border bg-eos-error-soft p-4 text-sm text-eos-error">
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
                        className="grid gap-4 rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 lg:grid-cols-[1.3fr_0.8fr_0.8fr]"
                      >
                        <div>
                          <p className="text-sm font-semibold text-eos-text">
                            {member.email}
                          </p>
                          <p className="mt-1 text-xs text-eos-text-muted">
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
                              className="h-9 min-w-[180px] rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
                            <p className="text-xs text-eos-text-muted">
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
                  className="rounded-eos-md"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-6">
          <SettingsOperationalTab
            currentUserResolved={currentUserResolved}
            canViewReleaseReadiness={canViewReleaseReadiness}
            appHealth={appHealth}
            appHealthLoading={appHealthLoading}
            appHealthError={appHealthError}
            releaseReadiness={releaseReadiness}
            releaseReadinessLoading={releaseReadinessLoading}
            releaseReadinessError={releaseReadinessError}
          />
        </TabsContent>

        <TabsContent value="avansat" className="space-y-6">
          <SettingsTabIntro
            title="Avansat"
            description="Aici pui politici locale de drift și acțiuni destructive care nu ar trebui să stea în același flux cu operational sau acces."
          />

          <Card className="border-eos-border bg-eos-surface">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-xl">Drift severity policy</CardTitle>
                  <p className="mt-2 text-sm text-eos-text-muted">
                    Schimbi doar severitatea per tip de schimbare. Impactul, dovada ceruta si actiunea recomandata raman in politica de drift. Politica implicita ramane activa pentru tot ce nu configurezi.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  disabled={cockpit.busy}
                  size="default"
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
                  className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4"
                >
                  <span className="text-sm font-medium text-eos-text">{item.label}</span>
                  <select
                    className="mt-3 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
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
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="border-eos-error-border bg-eos-surface">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-xl text-eos-error">Reset workspace local</CardTitle>
                <Badge variant="destructive">Actiune destructiva</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-eos-md border border-eos-error-border bg-eos-error-soft p-4 text-sm text-eos-text-muted">
                Acest buton sterge starea de lucru din workspace-ul curent: scanari, findings, drift,
                task-uri, dovezi atasate si activitate salvata. Sesiunea de autentificare ramane activa.
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-eos-text">
                    Vrei sa vezi exact experienta unui utilizator nou?
                  </p>
                  <p className="mt-1 text-sm text-eos-text-muted">
                    Dupa reset, dashboard-ul revine la starea initiala de onboarding.
                  </p>
                </div>

                <Button
                  variant="destructive"
                  disabled={cockpit.busy}
                  size="lg"
                  className="gap-2"
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
                  <Trash2 className="size-5" strokeWidth={2} />
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

  async function handleAddMember() {
    const email = newMemberEmail.trim().toLowerCase()
    if (!email) return

    setCreatingMember(true)
    setMembersError(null)

    try {
      const response = await fetch("/api/auth/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: newMemberRole }),
      })

      const payload = (await response.json()) as {
        ok?: boolean
        error?: string
        member?: OrganizationMember
      }

      if (!response.ok || !payload.member) {
        throw new Error(payload.error || "Membrul nu a putut fi adaugat.")
      }

      setMembersData((current) => {
        if (!current) return current
        return {
          ...current,
          members: [
            payload.member!,
            ...current.members.filter((member) => member.membershipId !== payload.member!.membershipId),
          ],
        }
      })
      setNewMemberEmail("")
      setNewMemberRole("reviewer")

      toast.success("Membru adaugat", {
        description: `${payload.member.email} a fost adaugat ca ${formatMemberRole(payload.member.role)}.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Membrul nu a putut fi adaugat."
      setMembersError(message)
      toast.error("Adaugarea a esuat", { description: message })
    } finally {
      setCreatingMember(false)
    }
  }
}
