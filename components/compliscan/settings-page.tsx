"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Bell, Download, Loader2, MailWarning, ShieldX, Trash2, Webhook } from "lucide-react"
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
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { ActionCluster } from "@/components/evidence-os/ActionCluster"
import type { AlertPreferences, AlertEventType } from "@/lib/server/alert-preferences-store"

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
    value: "notificari",
    label: "Notificari",
    description: "Email si webhook la evenimente.",
  },
  {
    value: "avansat",
    label: "Avansat",
    description: "Politici locale si reset.",
  },
] as const

export function SettingsPageSurface() {
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

  // ── GDPR rights state ──────────────────────────────────────────────────────
  const [gdprExporting, setGdprExporting] = useState(false)
  const [gdprDeleting, setGdprDeleting] = useState(false)
  const [gdprRequestingDeletion, setGdprRequestingDeletion] = useState(false)
  const [gdprDeletionReason, setGdprDeletionReason] = useState("")
  const [gdprShowDeletionForm, setGdprShowDeletionForm] = useState(false)

  // ── Alert preferences state ────────────────────────────────────────────────
  const [alertPrefs, setAlertPrefs] = useState<AlertPreferences | null>(null)
  const [alertPrefsLoading, setAlertPrefsLoading] = useState(true)
  const [alertPrefsSaving, setAlertPrefsSaving] = useState(false)

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

  useEffect(() => {
    setAlertPrefsLoading(true)
    fetch("/api/alerts/preferences", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { prefs: AlertPreferences }) => setAlertPrefs(data.prefs))
      .catch(() => setAlertPrefs(null))
      .finally(() => setAlertPrefsLoading(false))
  }, [])

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const activeSnapshot = cockpit.data.state.snapshotHistory[0]
  const validatedBaseline = cockpit.data.state.snapshotHistory.find(
    (snapshot) => snapshot.snapshotId === cockpit.data?.state.validatedBaselineSnapshotId
  )
  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Setari"
        title="Administrezi contextul operational"
        description="Context, acces si operare. Executia ramane in Scaneaza, De rezolvat si Rapoarte."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              operational admin
            </Badge>
          </>
        }
      />

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
                  className="min-h-14 min-w-[152px] flex-col items-start whitespace-normal px-4 py-3 text-left data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
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
                      aria-label="Email utilizator nou"
                      className="h-9 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                    />
                    <select
                      className="h-9 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                      value={newMemberRole}
                      aria-label="Rol utilizator nou"
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
                              aria-label={`Rol pentru ${member.email}`}
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

        <TabsContent value="notificari" className="space-y-6">
          <SettingsTabIntro
            title="Notificari"
            description="Configurezi canalele de alertare proactiva: email si webhook la evenimente de drift, task expirat sau alerta critica."
          />

          {alertPrefsLoading ? (
            <OperationalLoadingCard>Incarcam preferintele de notificare...</OperationalLoadingCard>
          ) : (
            <div className="space-y-4">
              {/* ── Email ─────────────────────────────────────────────────── */}
              <Card className="border-eos-border bg-eos-surface">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="size-4 text-eos-text-muted" strokeWidth={1.8} />
                    <CardTitle className="text-base">Email</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-eos-border accent-eos-primary"
                      checked={alertPrefs?.emailEnabled ?? false}
                      onChange={(e) =>
                        setAlertPrefs((p) => p ? { ...p, emailEnabled: e.target.checked } : p)
                      }
                    />
                    <span className="text-sm text-eos-text">Activează notificari email</span>
                  </label>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-eos-text-muted">
                      Adresa email destinatar
                    </label>
                    <input
                      type="email"
                      className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none disabled:opacity-50"
                      placeholder="alerte@companie.ro"
                      value={alertPrefs?.emailAddress ?? ""}
                      disabled={!alertPrefs?.emailEnabled}
                      onChange={(e) =>
                        setAlertPrefs((p) => p ? { ...p, emailAddress: e.target.value } : p)
                      }
                    />
                  </div>
                  {/* ── Digest săptămânal (Sprint 13) ──────────────────── */}
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-eos-border accent-eos-primary"
                      checked={alertPrefs?.weeklyDigestEnabled ?? true}
                      disabled={!alertPrefs?.emailEnabled}
                      onChange={(e) =>
                        setAlertPrefs((p) => p ? { ...p, weeklyDigestEnabled: e.target.checked } : p)
                      }
                    />
                    <div>
                      <span className="text-sm text-eos-text">Primesc digest săptămânal</span>
                      <p className="text-xs text-eos-text-muted">
                        Email automat luni 08:00 — scor, alerte, deadline-uri iminente.
                      </p>
                    </div>
                  </label>
                </CardContent>
              </Card>

              {/* ── Webhook ───────────────────────────────────────────────── */}
              <Card className="border-eos-border bg-eos-surface">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Webhook className="size-4 text-eos-text-muted" strokeWidth={1.8} />
                    <CardTitle className="text-base">Webhook</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-eos-border accent-eos-primary"
                      checked={alertPrefs?.webhookEnabled ?? false}
                      onChange={(e) =>
                        setAlertPrefs((p) => p ? { ...p, webhookEnabled: e.target.checked } : p)
                      }
                    />
                    <span className="text-sm text-eos-text">Activează webhook la evenimente</span>
                  </label>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-eos-text-muted">
                      URL webhook (POST JSON)
                    </label>
                    <input
                      type="url"
                      className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none disabled:opacity-50"
                      placeholder="https://hooks.slack.com/..."
                      value={alertPrefs?.webhookUrl ?? ""}
                      disabled={!alertPrefs?.webhookEnabled}
                      onChange={(e) =>
                        setAlertPrefs((p) => p ? { ...p, webhookUrl: e.target.value } : p)
                      }
                    />
                    <p className="mt-1 text-xs text-eos-text-tertiary">
                      Compatibil cu Slack, Teams, Make, Zapier sau orice endpoint HTTP.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* ── Events ────────────────────────────────────────────────── */}
              <Card className="border-eos-border bg-eos-surface">
                <CardHeader>
                  <CardTitle className="text-base">Evenimente monitorizate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(
                    [
                      { id: "drift.detected" as AlertEventType, label: "Drift detectat", hint: "Schimbare fata de baseline validat" },
                      { id: "task.overdue" as AlertEventType, label: "Task expirat", hint: "Task de remediere cu termen depasit" },
                      { id: "alert.critical" as AlertEventType, label: "Alerta critica", hint: "Finding de severitate ridicata sau critica" },
                    ] as const
                  ).map((ev) => (
                    <label key={ev.id} className="flex cursor-pointer items-start gap-3 rounded-eos-md border border-eos-border bg-eos-surface-variant p-3">
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 rounded border-eos-border accent-eos-primary"
                        checked={alertPrefs?.events[ev.id] ?? true}
                        onChange={(e) =>
                          setAlertPrefs((p) =>
                            p ? { ...p, events: { ...p.events, [ev.id]: e.target.checked } } : p
                          )
                        }
                      />
                      <div>
                        <p className="text-sm font-medium text-eos-text">{ev.label}</p>
                        <p className="text-xs text-eos-text-muted">{ev.hint}</p>
                      </div>
                    </label>
                  ))}
                </CardContent>
              </Card>

              <Button
                disabled={alertPrefsSaving || !alertPrefs}
                onClick={() => void handleSaveAlertPrefs()}
                className="gap-2"
              >
                {alertPrefsSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Se salvează…
                  </>
                ) : (
                  "Salvează preferintele de notificare"
                )}
              </Button>
            </div>
          )}
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

          {/* ── GDPR Rights ──────────────────────────────────────────────── */}
          <div className="border-t border-eos-border-subtle pt-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-muted">GDPR · Drepturile tale</p>
            <p className="mt-1 text-sm text-eos-text-muted">Export, ștergere date de conformitate și solicitare ștergere cont. Aceste acțiuni sunt ireversibile.</p>
          </div>

          {/* Art. 20 — Export date */}
          <Card className="border-eos-border bg-eos-surface">
            <CardHeader>
              <CardTitle className="text-xl">Exportă datele personale</CardTitle>
              <p className="mt-1 text-sm text-eos-text-muted">
                GDPR Art. 20 — Dreptul la portabilitatea datelor. Descarcă toate datele tale într-un fișier JSON structurat.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-eos-text-muted">
                  Include: profil, findings, scanări, documente generate, furnizori, incidente, alerte și activitate.
                </p>
                <Button
                  variant="outline"
                  disabled={gdprExporting}
                  className="gap-2"
                  onClick={() => void handleGdprExport()}
                >
                  {gdprExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  Descarcă datele mele
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Art. 17 — Ștergere date conformitate */}
          <Card className="border-eos-error-border bg-eos-surface">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-xl text-eos-error">Șterge datele de conformitate</CardTitle>
                <Badge variant="destructive">GDPR Art. 17</Badge>
              </div>
              <p className="mt-1 text-sm text-eos-text-muted">
                Dreptul la ștergere — resetează complet toate datele de conformitate din workspace. Contul rămâne activ.
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-eos-md border border-eos-error-border bg-eos-error-soft p-4 text-sm text-eos-text-muted">
                Această acțiune șterge permanent: scanări, findings, documente generate, alerte, sisteme AI înregistrate și toată activitatea. Nu poate fi anulată.
              </div>
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-medium text-eos-text">
                  Sesiunea și contul rămân active după ștergere.
                </p>
                <Button
                  variant="destructive"
                  disabled={gdprDeleting || currentUser?.role !== "owner"}
                  className="gap-2"
                  onClick={() => void handleGdprDeleteData()}
                >
                  {gdprDeleting ? <Loader2 className="size-4 animate-spin" /> : <ShieldX className="size-4" />}
                  Șterge toate datele
                </Button>
              </div>
              {currentUser?.role !== "owner" && (
                <p className="mt-2 text-xs text-eos-text-muted">Doar administratorul poate șterge datele.</p>
              )}
            </CardContent>
          </Card>

          {/* Art. 17 — Solicită ștergere cont */}
          <Card className="border-eos-error-border bg-eos-surface">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-xl text-eos-error">Solicită ștergerea contului</CardTitle>
                <Badge variant="destructive">GDPR Art. 17</Badge>
              </div>
              <p className="mt-1 text-sm text-eos-text-muted">
                Trimite o solicitare echipei CompliAI pentru ștergerea completă a contului. Procesarea durează maxim 30 de zile.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!gdprShowDeletionForm ? (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-eos-text-muted">
                    Vei primi un email de confirmare când cererea este procesată.
                  </p>
                  <Button
                    variant="destructive"
                    disabled={currentUser?.role !== "owner"}
                    className="gap-2"
                    onClick={() => setGdprShowDeletionForm(true)}
                  >
                    <MailWarning className="size-4" />
                    Solicită ștergerea contului
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-eos-text">
                    Motivul ștergerii (opțional)
                  </label>
                  <textarea
                    className="h-20 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                    placeholder="Spune-ne de ce dorești ștergerea contului..."
                    value={gdprDeletionReason}
                    onChange={(e) => setGdprDeletionReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setGdprShowDeletionForm(false)
                        setGdprDeletionReason("")
                      }}
                    >
                      Anulează
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={gdprRequestingDeletion}
                      className="gap-2"
                      onClick={() => void handleGdprRequestDeletion()}
                    >
                      {gdprRequestingDeletion ? <Loader2 className="size-4 animate-spin" /> : <MailWarning className="size-4" />}
                      Confirmă solicitarea
                    </Button>
                  </div>
                </div>
              )}
              {currentUser?.role !== "owner" && (
                <p className="text-xs text-eos-text-muted">Doar administratorul poate solicita ștergerea contului.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  async function handleGdprExport() {
    setGdprExporting(true)
    try {
      const res = await fetch("/api/account/export-data", { cache: "no-store" })
      if (!res.ok) throw new Error("Exportul a eșuat.")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "compliai-export.json"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("Export descărcat", { description: "Fișierul JSON cu datele tale a fost descărcat." })
    } catch (err) {
      toast.error("Eroare la export", {
        description: err instanceof Error ? err.message : "Nu am putut exporta datele.",
      })
    } finally {
      setGdprExporting(false)
    }
  }

  async function handleGdprDeleteData() {
    if (
      !window.confirm(
        "Ești sigur că vrei să ștergi TOATE datele de conformitate? Această acțiune este ireversibilă."
      )
    ) {
      return
    }
    setGdprDeleting(true)
    try {
      const res = await fetch("/api/account/delete-data", { method: "POST" })
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string }
      if (!res.ok) throw new Error(data.error ?? "Ștergerea a eșuat.")
      toast.success("Date șterse", { description: data.message ?? "Toate datele de conformitate au fost șterse." })
      window.location.reload()
    } catch (err) {
      toast.error("Eroare la ștergere", {
        description: err instanceof Error ? err.message : "Nu am putut șterge datele.",
      })
    } finally {
      setGdprDeleting(false)
    }
  }

  async function handleGdprRequestDeletion() {
    setGdprRequestingDeletion(true)
    try {
      const res = await fetch("/api/account/request-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: gdprDeletionReason || undefined }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string }
      if (!res.ok) throw new Error(data.error ?? "Solicitarea a eșuat.")
      toast.success("Solicitare trimisă", {
        description: data.message ?? "Cererea de ștergere a contului a fost trimisă. Vei fi contactat în maxim 30 de zile.",
      })
      setGdprShowDeletionForm(false)
      setGdprDeletionReason("")
    } catch (err) {
      toast.error("Eroare la solicitare", {
        description: err instanceof Error ? err.message : "Nu am putut trimite solicitarea.",
      })
    } finally {
      setGdprRequestingDeletion(false)
    }
  }

  async function handleSaveAlertPrefs() {
    if (!alertPrefs) return
    setAlertPrefsSaving(true)
    try {
      const res = await fetch("/api/alerts/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertPrefs),
      })
      const data = (await res.json()) as { prefs?: AlertPreferences; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Salvarea a eșuat.")
      setAlertPrefs(data.prefs ?? alertPrefs)
      toast.success("Preferinte salvate", { description: "Configuratia de notificari a fost actualizata." })
    } catch (err) {
      toast.error("Eroare la salvare", {
        description: err instanceof Error ? err.message : "Încearcă din nou.",
      })
    } finally {
      setAlertPrefsSaving(false)
    }
  }

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
