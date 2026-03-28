"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Bell, Download, Loader2, MailWarning, ShieldX, Trash2, Webhook } from "lucide-react"
import { toast } from "sonner"

import { LoadingScreen } from "@/components/compliscan/route-sections"
import { useDashboardRuntime } from "@/components/compliscan/dashboard-runtime"
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
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
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
  { value: "partner_manager", label: "Consultant portofoliu" },
  { value: "compliance", label: "Responsabil conformitate" },
  { value: "reviewer", label: "Revizor" },
  { value: "viewer", label: "Vizualizator" },
] as const

const SETTINGS_SUMMARY_ENDPOINT = "/api/settings/summary"

type ClaimInviteSummary = {
  id: string
  invitedEmail: string
  createdAtISO: string
  expiresAtISO: string
  claimUrl: string
}

type ClaimStatusResponse = {
  orgId: string
  orgName: string
  role: NonNullable<CurrentUser>["role"]
  ownership:
    | {
        ownerState: "system"
        owner: {
          type: "system"
          label: "system"
        }
      }
    | {
        ownerState: "claimed"
        owner: {
          type: "user"
          membershipId: string
          userId: string
          email: string
          createdAtISO: string
        }
      }
  pendingInvite: ClaimInviteSummary | null
} | null

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

const OrgKnowledgePanelLazy = dynamic(
  () => import("@/components/compliscan/org-knowledge-panel").then((m) => m.OrgKnowledgePanel),
  { ssr: false }
)

const SettingsBillingEmbed = dynamic(
  () =>
    import("@/components/compliscan/settings-billing-page").then(
      (mod) => mod.SettingsBillingPageSurface
    ),
  {
    loading: () => (
      <OperationalLoadingCard>Incarcam datele de facturare...</OperationalLoadingCard>
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
    value: "facturare",
    label: "Plan & Facturare",
    description: "Abonament, upgrade si facturi.",
  },
  {
    value: "avansat",
    label: "Avansat",
    description: "Politici locale si reset.",
  },
] as const

export function SettingsPageSurface() {
  const runtime = useDashboardRuntime()
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
    currentUser?.role === "owner" || currentUser?.role === "partner_manager" || currentUser?.role === "compliance"
  const [claimStatus, setClaimStatus] = useState<ClaimStatusResponse>(null)
  const [claimStatusLoading, setClaimStatusLoading] = useState(true)
  const [claimStatusError, setClaimStatusError] = useState<string | null>(null)
  const [claimInviteEmail, setClaimInviteEmail] = useState("")
  const [creatingClaimInvite, setCreatingClaimInvite] = useState(false)
  const [removingMembershipId, setRemovingMembershipId] = useState<string | null>(null)
  const canViewClaimStatus =
    currentUser?.role === "owner" || currentUser?.role === "partner_manager" || currentUser?.role === "compliance"
  const isSolo = runtime?.userMode === "solo"
  const visibleTabs = SETTINGS_VIEW_TABS.filter((tab) =>
    isSolo ? ["workspace", "acces", "notificari", "facturare"].includes(tab.value) : true
  )

  // ── GDPR rights state ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string>("workspace")
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
    let active = true

    if (!currentUserResolved || !currentUser?.orgId || !canViewClaimStatus) {
      setClaimStatus(null)
      setClaimStatusError(null)
      setClaimStatusLoading(false)
      return () => {
        active = false
      }
    }

    const loadClaimStatus = async () => {
      setClaimStatusLoading(true)
      setClaimStatusError(null)

      try {
        const response = await fetch(`/api/auth/claim-status/${currentUser.orgId}`, { cache: "no-store" })
        const payload = (await response.json()) as ClaimStatusResponse | { error?: string }

        if (!response.ok) {
          throw new Error(
            payload && typeof payload === "object" && "error" in payload && payload.error
              ? payload.error
              : "Nu am putut incarca ownership-ul."
          )
        }

        if (!active) return
        setClaimStatus(payload as ClaimStatusResponse)
      } catch (error) {
        if (!active) return
        setClaimStatus(null)
        setClaimStatusError(error instanceof Error ? error.message : "Nu am putut incarca ownership-ul.")
      } finally {
        if (active) {
          setClaimStatusLoading(false)
        }
      }
    }

    void loadClaimStatus()

    return () => {
      active = false
    }
  }, [canViewClaimStatus, currentUser?.orgId, currentUserResolved])

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
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-eos-text-tertiary">Setări</p>
        <h1 className="mt-1.5 text-2xl font-bold text-eos-text">
          {isSolo ? "Administrezi organizația și planul" : "Administrezi contextul operational"}
        </h1>
        <p className="mt-1 text-sm text-eos-text-tertiary">
          {isSolo
            ? "Aici rămân doar organizația, membrii, notificările și drumul către planul de facturare."
            : "Context, acces si operare. Executia ramane in Scaneaza, De rezolvat si Rapoarte."}
        </p>
        <div className="mt-3">
          <span className="rounded-full border border-eos-border bg-eos-surface-variant px-3 py-1 text-xs font-medium text-eos-text-tertiary">
            {isSolo ? "admin firmă" : "operational admin"}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tab navigation */}
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">Zone Setari</p>
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max gap-0 border-b border-eos-border-subtle">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={[
                    "inline-flex min-h-[56px] min-w-[152px] flex-col items-start whitespace-normal border-b-2 px-4 py-3 text-left transition-colors",
                    activeTab === tab.value
                      ? "border-b-2 border-eos-primary text-eos-text"
                      : "border-transparent text-eos-text-tertiary hover:text-eos-text-muted",
                  ].join(" ")}
                >
                  <span className="text-sm font-medium">{tab.label}</span>
                  <span className={`mt-1 whitespace-normal text-xs font-normal leading-5 ${activeTab === tab.value ? "text-eos-text-tertiary" : "text-eos-text-tertiary"}`}>
                    {tab.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab: Workspace */}
        {activeTab === "workspace" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-eos-text-muted">Workspace</h2>
              <p className="mt-1 text-sm text-eos-text-tertiary">Aici fixezi contextul local de lucru: organizația activă, baseline-ul validat și rezumatul operațional de bază.</p>
            </div>

            <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant">
              <div className="border-b border-eos-border-subtle px-5 pt-5 pb-4">
                <h2 className="text-lg font-semibold text-eos-text-muted">Setari workspace</h2>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4">
                    <p className="text-sm text-eos-text-tertiary">Workspace activ</p>
                    <p className="mt-2 text-lg font-semibold text-eos-text-muted">
                      {cockpit.data.workspace.workspaceOwner} · {cockpit.data.workspace.orgName}
                    </p>
                  </div>
                  <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4">
                    <p className="text-sm text-eos-text-tertiary">Motor OCR</p>
                    <p className="mt-2 text-lg font-semibold text-eos-text-muted">Google Vision API</p>
                  </div>
                  <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4">
                    <p className="text-sm text-eos-text-tertiary">Scor de risc curent</p>
                    <p className="mt-2 text-lg font-semibold text-eos-text-muted">{cockpit.data.summary.score}%</p>
                  </div>
                  <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4">
                    <p className="text-sm text-eos-text-tertiary">Ultimul scan</p>
                    <p className="mt-2 text-lg font-semibold text-eos-text-muted">{cockpit.lastScanLabel}</p>
                  </div>
                  <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4 md:col-span-2">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm text-eos-text-tertiary">Baseline validat pentru drift</p>
                        <p className="mt-2 text-lg font-semibold text-eos-text-muted">
                          {validatedBaseline
                            ? `Snapshot validat din ${new Date(validatedBaseline.generatedAt).toLocaleString("ro-RO")}`
                            : "Inca nu exista baseline validat"}
                        </p>
                        <div className="mt-3">
                          {validatedBaseline ? (
                            <span className="rounded-full bg-eos-success-soft px-2.5 py-0.5 text-xs font-semibold text-eos-success">Baseline activ</span>
                          ) : (
                            <span className="rounded-full bg-eos-warning-soft px-2.5 py-0.5 text-xs font-semibold text-eos-warning">Cere baseline</span>
                          )}
                        </div>
                        {!validatedBaseline && (
                          <p className="mt-1 text-sm text-eos-text-tertiary">
                            {activeSnapshot
                              ? "Poti valida snapshot-ul curent ca reper stabil pentru drift."
                              : "Scaneaza mai intai un document sau un manifest ca sa generam primul snapshot."}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          disabled={cockpit.busy || !activeSnapshot}
                          onClick={() => void cockpitActions.setValidatedBaseline()}
                          className="inline-flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface-variant px-4 py-2 text-sm font-medium text-eos-text-muted transition hover:text-eos-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Valideaza snapshot-ul curent
                        </button>
                        <button
                          type="button"
                          disabled={cockpit.busy || !validatedBaseline}
                          onClick={() => void cockpitActions.clearValidatedBaseline()}
                          className="inline-flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface-variant px-4 py-2 text-sm font-medium text-eos-text-muted transition hover:text-eos-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Elimina baseline-ul
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Integrari */}
        {activeTab === "integrari" && (
          <div className="space-y-6">
            <SettingsIntegrationsTab
              repoSyncStatus={repoSyncStatus}
              supabaseStatus={supabaseStatus}
              supabaseStatusLoading={supabaseStatusLoading}
              supabaseStatusError={supabaseStatusError}
            />
          </div>
        )}

        {/* Tab: Acces */}
        {activeTab === "acces" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-eos-text-muted">Acces</h2>
              <p className="mt-1 text-sm text-eos-text-tertiary">Aici vezi cine are acces în organizație și cum sunt împărțite rolurile de control și validare.</p>
            </div>

            {canViewClaimStatus ? (
              <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant">
                <div className="border-b border-eos-border-subtle px-5 pt-5 pb-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-eos-text-muted">Ownership și claim</h2>
                      <p className="mt-2 text-sm text-eos-text-tertiary">
                        Consultantul poate opera firma ca <strong>partner_manager</strong>, dar ownership-ul final
                        rămâne la client. Aici vezi dacă organizația este deja revendicată și poți pregăti transferul.
                      </p>
                    </div>
                    {claimStatus?.ownership.ownerState === "claimed" ? (
                      <span className="rounded-full bg-eos-success-soft px-2.5 py-0.5 text-xs font-semibold text-eos-success">owner revendicat</span>
                    ) : (
                      <span className="rounded-full bg-eos-warning-soft px-2.5 py-0.5 text-xs font-semibold text-eos-warning">owner placeholder system</span>
                    )}
                  </div>
                </div>
                <div className="px-5 py-5 space-y-4">
                  {claimStatusLoading ? (
                    <OperationalLoadingCard>Incarcam statusul de ownership...</OperationalLoadingCard>
                  ) : claimStatusError ? (
                    <div className="rounded-eos-lg border border-eos-error-border bg-eos-error-soft p-4 text-sm text-eos-error">
                      {claimStatusError}
                    </div>
                  ) : claimStatus ? (
                    <>
                      <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-eos-text-muted">Status curent</p>
                            {claimStatus.ownership.ownerState === "claimed" ? (
                              <p className="mt-1 text-sm leading-6 text-eos-text-tertiary">
                                Owner-ul curent este <strong>{claimStatus.ownership.owner.email}</strong>. Acesta
                                poate controla membrii, billing-ul și poate elimina consultantul din organizație.
                              </p>
                            ) : (
                              <p className="mt-1 text-sm leading-6 text-eos-text-tertiary">
                                Organizația nu are încă un owner real. Consultantul operează firma ca{" "}
                                <strong>partner_manager</strong> până când clientul acceptă claim-ul.
                              </p>
                            )}
                          </div>
                          {claimStatus.pendingInvite ? (
                            <span className="rounded-full border border-eos-border bg-eos-surface-variant px-2.5 py-0.5 text-xs font-medium text-eos-text-tertiary">claim activ</span>
                          ) : (
                            <span className="rounded-full bg-eos-surface-active px-2.5 py-0.5 text-xs font-medium text-eos-text-tertiary">fără claim activ</span>
                          )}
                        </div>
                      </div>

                      {claimStatus.pendingInvite ? (
                        <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4">
                          <p className="text-sm font-semibold text-eos-text-muted">
                            Claim pregătit pentru {claimStatus.pendingInvite.invitedEmail}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-eos-text-tertiary">
                            Expiră la {new Date(claimStatus.pendingInvite.expiresAtISO).toLocaleString("ro-RO")}. Linkul
                            de mai jos poate fi trimis manual clientului.
                          </p>
                          <input
                            readOnly
                            value={claimStatus.pendingInvite.claimUrl}
                            className="mt-3 h-9 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-xs text-eos-text outline-none"
                            aria-label="Link claim ownership"
                          />
                        </div>
                      ) : null}

                      {currentUser?.role === "partner_manager" && claimStatus.ownership.ownerState === "system" ? (
                        <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-eos-text-muted">Trimite claim ownership</p>
                              <p className="mt-1 text-xs leading-5 text-eos-text-tertiary">
                                Introdu emailul clientului care trebuie să devină owner. Dacă persoana nu are cont,
                                își va seta parola direct din linkul de claim.
                              </p>
                            </div>
                            <span className="rounded-full border border-eos-border bg-eos-surface-variant px-2.5 py-0.5 text-xs font-medium text-eos-text-tertiary">partner-only</span>
                          </div>
                          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                            <input
                              type="email"
                              value={claimInviteEmail}
                              onChange={(event) => setClaimInviteEmail(event.target.value)}
                              placeholder="owner@client.ro"
                              aria-label="Email pentru claim ownership"
                              className="h-9 rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-eos-border-strong transition-all"
                            />
                            <button
                              type="button"
                              disabled={creatingClaimInvite || !claimInviteEmail.trim()}
                              onClick={() => void handleCreateClaimInvite()}
                              className="inline-flex items-center gap-2 rounded-eos-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-eos-text transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Trimite claim
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant">
              <div className="border-b border-eos-border-subtle px-5 pt-5 pb-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-eos-text-muted">Membri si roluri</h2>
                    <p className="mt-2 text-sm text-eos-text-tertiary">
                      Owner-ul poate ajusta rolurile si poate elimina consultantul. Compliance si partner manager vad lista
                      pentru audit si separarea responsabilitatilor.
                    </p>
                  </div>
                  {currentUser?.role && (
                    <span className="rounded-full border border-eos-border bg-eos-surface-variant px-2.5 py-0.5 text-xs font-medium text-eos-text-tertiary">
                      Rolul tau: {formatMemberRole(currentUser.role)}
                    </span>
                  )}
                </div>
              </div>
              <div className="px-5 py-5 space-y-4">
                {currentUser?.role === "owner" ? (
                  <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-eos-text-muted">
                          Adauga utilizator existent din workspace
                        </p>
                        <p className="mt-1 text-xs leading-6 text-eos-text-tertiary">
                          Aici adaugi doar utilizatori care au deja cont in workspace-ul local. Invitatiile externe raman pas separat.
                        </p>
                      </div>
                      <span className="rounded-full border border-eos-border bg-eos-surface-variant px-2.5 py-0.5 text-xs font-medium text-eos-text-tertiary">owner-only</span>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_220px_auto]">
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(event) => setNewMemberEmail(event.target.value)}
                        placeholder="coleg@companie.ro"
                        aria-label="Email utilizator nou"
                        className="h-9 rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-eos-border-strong transition-all"
                      />
                      <select
                        className="h-9 rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text outline-none focus:border-eos-border-strong transition-all"
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
                      <button
                        type="button"
                        disabled={creatingMember || !newMemberEmail.trim()}
                        onClick={() => void handleAddMember()}
                        className="inline-flex items-center gap-2 rounded-eos-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-eos-text transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Adauga membru
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4 text-sm text-eos-text-tertiary">
                    Doar owner-ul poate adauga membri noi. Lista de mai jos ramane read-only pentru audit si separarea responsabilitatilor.
                  </div>
                )}

                {membersLoading ? (
                  <OperationalLoadingCard>Incarcam membrii organizatiei...</OperationalLoadingCard>
                ) : membersError ? (
                  <div className="rounded-eos-lg border border-eos-error-border bg-eos-error-soft p-4 text-sm text-eos-error">
                    {membersError}
                  </div>
                ) : membersData?.members.length ? (
                  <div className="space-y-3">
                    {membersData.members.map((member) => {
                      const isSelf = member.membershipId === currentUser?.membershipId
                      const canManageRoles = currentUser?.role === "owner"
                      const canRemoveConsultant =
                        currentUser?.role === "owner" &&
                        !isSelf &&
                        member.role === "partner_manager"

                      return (
                        <div
                          key={member.membershipId}
                          className="grid gap-4 rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4 lg:grid-cols-[1.3fr_0.8fr_0.8fr]"
                        >
                          <div>
                            <p className="text-sm font-semibold text-eos-text-muted">
                              {member.email}
                            </p>
                            <p className="mt-1 text-xs text-eos-text-tertiary">
                              Adaugat pe {new Date(member.createdAtISO).toLocaleString("ro-RO")}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded-full border border-eos-border bg-eos-surface-variant px-2.5 py-0.5 text-xs font-medium text-eos-text-tertiary">
                              {formatMemberRole(member.role)}
                            </span>
                            {isSelf && (
                              <span className="rounded-full bg-eos-surface-active px-2.5 py-0.5 text-xs font-medium text-eos-text-tertiary">
                                Tu
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-start gap-2 lg:justify-end">
                            {canManageRoles ? (
                              <>
                                <select
                                  className="h-9 min-w-[180px] rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:border-eos-border-strong transition-all"
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
                                {canRemoveConsultant ? (
                                  <button
                                    type="button"
                                    disabled={removingMembershipId === member.membershipId}
                                    onClick={() => void handleRemoveMember(member.membershipId, member.email)}
                                    className="inline-flex items-center gap-2 rounded-eos-lg px-4 py-2 text-sm font-medium text-eos-text-tertiary transition hover:text-eos-text-muted disabled:opacity-50"
                                  >
                                    <Trash2 className="size-3.5" strokeWidth={2} />
                                    Elimină
                                  </button>
                                ) : null}
                              </>
                            ) : (
                              <p className="text-xs text-eos-text-tertiary">
                                Doar owner-ul poate schimba rolurile.
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-5 py-10 text-center">
                    <p className="text-sm font-medium text-eos-text-tertiary">Nu exista membri suplimentari</p>
                    <p className="mt-1 text-xs text-eos-text-tertiary">Organizatia curenta are doar utilizatorii deja inregistrati in workspace.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Operational */}
        {activeTab === "operational" && (
          <div className="space-y-6">
            <OrgKnowledgePanelLazy />
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
          </div>
        )}

        {/* Tab: Notificari */}
        {activeTab === "notificari" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-eos-text-muted">Notificari</h2>
              <p className="mt-1 text-sm text-eos-text-tertiary">Configurezi canalele de alertare proactiva: email si webhook la evenimente de drift, task expirat sau alerta critica.</p>
            </div>

            {alertPrefsLoading ? (
              <OperationalLoadingCard>Incarcam preferintele de notificare...</OperationalLoadingCard>
            ) : (
              <div className="space-y-4">
                {/* ── Email ─────────────────────────────────────────────────── */}
                <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant">
                  <div className="border-b border-eos-border-subtle px-5 pt-5 pb-4">
                    <div className="flex items-center gap-2">
                      <Bell className="size-4 text-eos-text-tertiary" strokeWidth={1.8} />
                      <h2 className="text-lg font-semibold text-eos-text-muted">Email</h2>
                    </div>
                  </div>
                  <div className="px-5 py-5 space-y-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        className="size-4 accent-blue-500"
                        checked={alertPrefs?.emailEnabled ?? false}
                        onChange={(e) =>
                          setAlertPrefs((p) => p ? { ...p, emailEnabled: e.target.checked } : p)
                        }
                      />
                      <span className="text-sm text-eos-text-muted">Activează notificari email</span>
                    </label>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-eos-text-tertiary">
                        Adresa email destinatar
                      </label>
                      <input
                        type="email"
                        className="h-9 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-eos-border-strong transition-all disabled:opacity-50"
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
                        className="size-4 accent-blue-500"
                        checked={alertPrefs?.weeklyDigestEnabled ?? true}
                        disabled={!alertPrefs?.emailEnabled}
                        onChange={(e) =>
                          setAlertPrefs((p) => p ? { ...p, weeklyDigestEnabled: e.target.checked } : p)
                        }
                      />
                      <div>
                        <span className="text-sm text-eos-text-muted">Primesc digest săptămânal</span>
                        <p className="text-xs text-eos-text-tertiary">
                          Email automat luni 08:00 — scor, alerte, deadline-uri iminente.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* ── Webhook ───────────────────────────────────────────────── */}
                <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant">
                  <div className="border-b border-eos-border-subtle px-5 pt-5 pb-4">
                    <div className="flex items-center gap-2">
                      <Webhook className="size-4 text-eos-text-tertiary" strokeWidth={1.8} />
                      <h2 className="text-lg font-semibold text-eos-text-muted">Webhook</h2>
                    </div>
                  </div>
                  <div className="px-5 py-5 space-y-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        className="size-4 accent-blue-500"
                        checked={alertPrefs?.webhookEnabled ?? false}
                        onChange={(e) =>
                          setAlertPrefs((p) => p ? { ...p, webhookEnabled: e.target.checked } : p)
                        }
                      />
                      <span className="text-sm text-eos-text-muted">Activează webhook la evenimente</span>
                    </label>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-eos-text-tertiary">
                        URL webhook (POST JSON)
                      </label>
                      <input
                        type="url"
                        className="h-9 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-eos-border-strong transition-all disabled:opacity-50"
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
                  </div>
                </div>

                {/* ── Events ────────────────────────────────────────────────── */}
                <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant">
                  <div className="border-b border-eos-border-subtle px-5 pt-5 pb-4">
                    <h2 className="text-lg font-semibold text-eos-text-muted">Evenimente monitorizate</h2>
                  </div>
                  <div className="px-5 py-5 space-y-3">
                    {(
                      [
                        { id: "drift.detected" as AlertEventType, label: "Drift detectat", hint: "Schimbare fata de baseline validat" },
                        { id: "task.overdue" as AlertEventType, label: "Task expirat", hint: "Task de remediere cu termen depasit" },
                        { id: "alert.critical" as AlertEventType, label: "Alerta critica", hint: "Finding de severitate ridicata sau critica" },
                        { id: "score.dropped" as AlertEventType, label: "Scor scăzut", hint: "Scorul de conformitate a scăzut față de ziua anterioară" },
                      ] as const
                    ).map((ev) => (
                      <label key={ev.id} className="flex cursor-pointer items-start gap-3 rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-3">
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 accent-blue-500"
                          checked={alertPrefs?.events[ev.id] ?? true}
                          onChange={(e) =>
                            setAlertPrefs((p) =>
                              p ? { ...p, events: { ...p.events, [ev.id]: e.target.checked } } : p
                            )
                          }
                        />
                        <div>
                          <p className="text-sm font-medium text-eos-text-muted">{ev.label}</p>
                          <p className="text-xs text-eos-text-tertiary">{ev.hint}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={alertPrefsSaving || !alertPrefs}
                  onClick={() => void handleSaveAlertPrefs()}
                  className="inline-flex items-center gap-2 rounded-eos-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-eos-text transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {alertPrefsSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Se salvează…
                    </>
                  ) : (
                    "Salvează preferintele de notificare"
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Facturare */}
        {activeTab === "facturare" && (
          <div className="space-y-6">
            <SettingsBillingEmbed />
          </div>
        )}

        {/* Tab: Avansat */}
        {activeTab === "avansat" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-eos-text-muted">Avansat</h2>
              <p className="mt-1 text-sm text-eos-text-tertiary">Aici pui politici locale de drift și acțiuni destructive care nu ar trebui să stea în același flux cu operational sau acces.</p>
            </div>

            <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant">
              <div className="border-b border-eos-border-subtle px-5 pt-5 pb-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-eos-text-muted">Drift severity policy</h2>
                    <p className="mt-2 text-sm text-eos-text-tertiary">
                      Schimbi doar severitatea per tip de schimbare. Impactul, dovada ceruta si actiunea recomandata raman in politica de drift. Politica implicita ramane activa pentru tot ce nu configurezi.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={cockpit.busy}
                    onClick={() => void cockpitActions.updateDriftSeverityOverrides(driftOverrides)}
                    className="inline-flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface-variant px-4 py-2 text-sm font-medium text-eos-text-muted transition hover:text-eos-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Salvează severitatea drift
                  </button>
                </div>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {DRIFT_OVERRIDE_FIELDS.map((item) => (
                    <label
                      key={item.change}
                      className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4"
                    >
                      <span className="text-sm font-medium text-eos-text-muted">{item.label}</span>
                      <select
                        className="mt-3 h-9 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text outline-none focus:border-eos-border-strong transition-all"
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
                </div>
              </div>
            </div>

            <div className="rounded-eos-xl border border-eos-error-border bg-eos-surface-variant">
              <div className="border-b border-eos-border-subtle px-5 pt-5 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-eos-error">Reset workspace local</h2>
                  <span className="rounded-full bg-eos-error-soft px-2.5 py-0.5 text-xs font-semibold text-eos-error">Actiune destructiva</span>
                </div>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="rounded-eos-lg border border-eos-error-border bg-eos-error-soft p-4 text-sm text-eos-text-tertiary">
                  Acest buton sterge starea de lucru din workspace-ul curent: scanari, findings, drift,
                  task-uri, dovezi atasate si activitate salvata. Sesiunea de autentificare ramane activa.
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-eos-text-muted">
                      Vrei sa vezi exact experienta unui utilizator nou?
                    </p>
                    <p className="mt-1 text-sm text-eos-text-tertiary">
                      Dupa reset, dashboard-ul revine la starea initiala de onboarding.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={cockpit.busy}
                    className="inline-flex items-center gap-2 rounded-eos-lg bg-red-600/80 px-4 py-2 text-sm font-semibold text-eos-text transition hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  </button>
                </div>
              </div>
            </div>

            {/* ── GDPR Rights ──────────────────────────────────────────────── */}
            <div className="border-t border-eos-border-subtle pt-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">GDPR · Drepturile tale</p>
              <p className="mt-1 text-sm text-eos-text-tertiary">Export, ștergere date de conformitate și solicitare ștergere cont. Aceste acțiuni sunt ireversibile.</p>
            </div>

            {/* Art. 20 — Export date */}
            <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant">
              <div className="border-b border-eos-border-subtle px-5 pt-5 pb-4">
                <h2 className="text-lg font-semibold text-eos-text-muted">Exportă datele personale</h2>
                <p className="mt-1 text-sm text-eos-text-tertiary">
                  GDPR Art. 20 — Dreptul la portabilitatea datelor. Descarcă toate datele tale într-un fișier JSON structurat.
                </p>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-eos-text-tertiary">
                    Include: profil, findings, scanări, documente generate, furnizori, incidente, alerte și activitate.
                  </p>
                  <button
                    type="button"
                    disabled={gdprExporting}
                    className="inline-flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface-variant px-4 py-2 text-sm font-medium text-eos-text-muted transition hover:text-eos-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => void handleGdprExport()}
                  >
                    {gdprExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                    Descarcă datele mele
                  </button>
                </div>
              </div>
            </div>

            {/* Art. 17 — Ștergere date conformitate */}
            <div className="rounded-eos-xl border border-eos-error-border bg-eos-surface-variant">
              <div className="border-b border-eos-border-subtle px-5 pt-5 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-eos-error">Șterge datele de conformitate</h2>
                  <span className="rounded-full bg-eos-error-soft px-2.5 py-0.5 text-xs font-semibold text-eos-error">GDPR Art. 17</span>
                </div>
                <p className="mt-1 text-sm text-eos-text-tertiary">
                  Dreptul la ștergere — resetează complet toate datele de conformitate din workspace. Contul rămâne activ.
                </p>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="rounded-eos-lg border border-eos-error-border bg-eos-error-soft p-4 text-sm text-eos-text-tertiary">
                  Această acțiune șterge permanent: scanări, findings, documente generate, alerte, sisteme AI înregistrate și toată activitatea. Nu poate fi anulată.
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-medium text-eos-text-muted">
                    Sesiunea și contul rămân active după ștergere.
                  </p>
                  <button
                    type="button"
                    disabled={gdprDeleting || currentUser?.role !== "owner"}
                    className="inline-flex items-center gap-2 rounded-eos-lg bg-red-600/80 px-4 py-2 text-sm font-semibold text-eos-text transition hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => void handleGdprDeleteData()}
                  >
                    {gdprDeleting ? <Loader2 className="size-4 animate-spin" /> : <ShieldX className="size-4" />}
                    Șterge toate datele
                  </button>
                </div>
                {currentUser?.role !== "owner" && (
                  <p className="mt-2 text-xs text-eos-text-tertiary">Doar administratorul poate șterge datele.</p>
                )}
              </div>
            </div>

            {/* Art. 17 — Solicită ștergere cont */}
            <div className="rounded-eos-xl border border-eos-error-border bg-eos-surface-variant">
              <div className="border-b border-eos-border-subtle px-5 pt-5 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-eos-error">Solicită ștergerea contului</h2>
                  <span className="rounded-full bg-eos-error-soft px-2.5 py-0.5 text-xs font-semibold text-eos-error">GDPR Art. 17</span>
                </div>
                <p className="mt-1 text-sm text-eos-text-tertiary">
                  Trimite o solicitare echipei CompliAI pentru ștergerea completă a contului. Procesarea durează maxim 30 de zile.
                </p>
              </div>
              <div className="px-5 py-5 space-y-4">
                {!gdprShowDeletionForm ? (
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-eos-text-tertiary">
                      Vei primi un email de confirmare când cererea este procesată.
                    </p>
                    <button
                      type="button"
                      disabled={currentUser?.role !== "owner"}
                      className="inline-flex items-center gap-2 rounded-eos-lg bg-red-600/80 px-4 py-2 text-sm font-semibold text-eos-text transition hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setGdprShowDeletionForm(true)}
                    >
                      <MailWarning className="size-4" />
                      Solicită ștergerea contului
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-eos-text-muted">
                      Motivul ștergerii (opțional)
                    </label>
                    <textarea
                      className="h-20 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 py-2 text-sm text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-eos-border-strong transition-all"
                      placeholder="Spune-ne de ce dorești ștergerea contului..."
                      value={gdprDeletionReason}
                      onChange={(e) => setGdprDeletionReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-eos-lg px-4 py-2 text-sm font-medium text-eos-text-tertiary transition hover:text-eos-text-muted disabled:opacity-50"
                        onClick={() => {
                          setGdprShowDeletionForm(false)
                          setGdprDeletionReason("")
                        }}
                      >
                        Anulează
                      </button>
                      <button
                        type="button"
                        disabled={gdprRequestingDeletion}
                        className="inline-flex items-center gap-2 rounded-eos-lg bg-red-600/80 px-4 py-2 text-sm font-semibold text-eos-text transition hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => void handleGdprRequestDeletion()}
                      >
                        {gdprRequestingDeletion ? <Loader2 className="size-4 animate-spin" /> : <MailWarning className="size-4" />}
                        Confirmă solicitarea
                      </button>
                    </div>
                  </div>
                )}
                {currentUser?.role !== "owner" && (
                  <p className="text-xs text-eos-text-tertiary">Doar administratorul poate solicita ștergerea contului.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
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

  async function handleCreateClaimInvite() {
    const email = claimInviteEmail.trim().toLowerCase()
    if (!email || !currentUser?.orgId) return

    setCreatingClaimInvite(true)
    setClaimStatusError(null)

    try {
      const response = await fetch("/api/auth/claim-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const payload = (await response.json()) as {
        ok?: boolean
        error?: string
        invite?: ClaimInviteSummary
      }

      if (!response.ok || !payload.invite) {
        throw new Error(payload.error || "Invitatia de claim nu a putut fi generata.")
      }

      setClaimStatus((current) =>
        current
          ? {
              ...current,
              pendingInvite: payload.invite ?? null,
            }
          : current
      )
      setClaimInviteEmail("")
      toast.success("Claim pregatit", {
        description: `Linkul pentru ${payload.invite.invitedEmail} este gata de trimis.`,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invitatia de claim nu a putut fi generata."
      setClaimStatusError(message)
      toast.error("Claim nereusit", { description: message })
    } finally {
      setCreatingClaimInvite(false)
    }
  }

  async function handleRemoveMember(membershipId: string, email: string) {
    setRemovingMembershipId(membershipId)
    setMembersError(null)

    try {
      const response = await fetch(`/api/auth/members/${membershipId}`, {
        method: "DELETE",
      })
      const payload = (await response.json()) as {
        ok?: boolean
        error?: string
      }

      if (!response.ok) {
        throw new Error(payload.error || "Membrul nu a putut fi eliminat.")
      }

      setMembersData((current) => {
        if (!current) return current
        return {
          ...current,
          members: current.members.filter((member) => member.membershipId !== membershipId),
        }
      })

      toast.success("Consultant eliminat", {
        description: `${email} nu mai are acces operational la aceasta organizatie.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Membrul nu a putut fi eliminat."
      setMembersError(message)
      toast.error("Eliminarea a esuat", { description: message })
    } finally {
      setRemovingMembershipId(null)
    }
  }
}
