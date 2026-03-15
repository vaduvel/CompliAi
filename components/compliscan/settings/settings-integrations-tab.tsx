"use client"

import Link from "next/link"
import { Cloud, Database, FileCode2, KeyRound, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import {
  EndpointRow,
  formatBackendLabel,
  OperationalLoadingCard,
  repoSyncBadgeLabel,
  repoSyncBadgeVariant,
  SettingsDisclosure,
  SettingsSignalCard,
  SettingsStatusBlock,
  SettingsTabIntro,
  SettingsTile,
  type RepoSyncStatus,
  type SupabaseOperationalStatus,
} from "@/components/compliscan/settings/settings-shared"

function formatRepoSyncOperationalState(repoSyncStatus: RepoSyncStatus) {
  if (!repoSyncStatus) return "Se incarca"
  if (repoSyncStatus.requiresKey) return "Protejat cu cheie"
  if (repoSyncStatus.localAllowedWithoutKey) return "Local fara cheie"
  return "Disponibil"
}

export function SettingsIntegrationsTab({
  repoSyncStatus,
  supabaseStatus,
  supabaseStatusLoading,
  supabaseStatusError,
}: {
  repoSyncStatus: RepoSyncStatus
  supabaseStatus: SupabaseOperationalStatus
  supabaseStatusLoading: boolean
  supabaseStatusError: string | null
}) {
  return (
    <div className="space-y-6">
      <SettingsTabIntro
        title="Integrari"
        description="Status operational pentru traseele externe si actiunile utile de administrare."
      />

      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-xl">Status operational Supabase</CardTitle>
                <Badge
                  variant={
                    supabaseStatusLoading
                      ? "outline"
                      : supabaseStatus?.summary.ready
                        ? "success"
                        : "warning"
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
              <p className="max-w-2xl text-sm text-[var(--color-on-surface-muted)]">
                Verificare pentru auth, date si storage. Aici conteaza starea reala, nu doar configurarea.
              </p>
            </div>
            <Button asChild variant="outline" className="h-10 rounded-xl px-4">
              <Link href="/supabase-rls-verification-runbook.md" target="_blank">
                Deschide runbook RLS
              </Link>
            </Button>
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

              <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <SettingsStatusBlock
                  eyebrow="Stare curenta"
                  title={
                    supabaseStatus.summary.ready
                      ? "Traseul Supabase este pregatit operational."
                      : "Traseul Supabase cere revizuire."
                  }
                  description={supabaseStatus.summary.ready
                    ? "Auth, metadata si storage pot sustine fluxul controlat curent."
                    : "Mai exista piese de configurat sau verificat inainte sa tratezi traseul cloud ca fundatie finala."}
                >
                  <div className="space-y-2 text-sm text-[var(--color-on-surface-muted)]">
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
                      Auth:{" "}
                      <span className="font-semibold text-[var(--color-on-surface)]">
                        {formatBackendLabel(supabaseStatus.authBackend)}
                      </span>
                      {" · "}
                      Date:{" "}
                      <span className="font-semibold text-[var(--color-on-surface)]">
                        {formatBackendLabel(supabaseStatus.dataBackend)}
                      </span>
                    </p>
                  </div>
                </SettingsStatusBlock>

                <div className="space-y-4">
                  <SettingsStatusBlock
                    eyebrow="Actiune recomandata"
                    title={
                      supabaseStatus.summary.blockers.length > 0
                        ? "Inchide blocajele de configurare."
                        : "Nu este nevoie de o actiune imediata."
                    }
                    description={
                      supabaseStatus.summary.blockers.length > 0
                        ? "Rezolva mai intai punctele care opresc readiness-ul cloud."
                        : "Poti continua cu operarea normala si verifici doar la schimbari de infrastructura."
                    }
                  >
                    <div className="space-y-2 text-xs text-[var(--color-muted)]">
                      <p>
                        Endpoint intern: <code>/api/integrations/supabase/status</code>
                      </p>
                      <p>
                        SQL Editor: <code>supabase/apply-sprint5-complete.sql</code>
                      </p>
                    </div>
                  </SettingsStatusBlock>

                  {supabaseStatus.summary.blockers.length > 0 ? (
                    <SettingsSignalCard
                      title="Blocaje active"
                      items={supabaseStatus.summary.blockers}
                      tone="warning"
                    />
                  ) : (
                    <SettingsSignalCard
                      title="Fara blocaje active"
                      items={[]}
                      tone="success"
                      emptyMessage="Nu exista blocaje operationale majore pe traseul Supabase."
                    />
                  )}
                </div>
              </div>

              <SettingsDisclosure
                eyebrow="Detalii tehnice"
                title="Tabele, bucket si verificari de infrastructura"
                description="Deschizi aceasta zona doar cand diagnostichezi configurarea sau storage-ul."
              >
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
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
                          <p className="mt-2 text-xs text-[var(--color-on-surface-muted)]">
                            {status.error || "Tabelul raspunde la verificarea operationala."}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {supabaseStatus.bucket ? (
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                        <p className="text-sm font-medium text-[var(--color-on-surface)]">
                          Bucket dovezi
                        </p>
                        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
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
                      </div>
                    ) : null}
                  </div>
                </div>
              </SettingsDisclosure>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-xl">Repo sync pentru engineering</CardTitle>
                <Badge variant={repoSyncBadgeVariant(repoSyncStatus)}>
                  {repoSyncBadgeLabel(repoSyncStatus)}
                </Badge>
              </div>
              <p className="max-w-2xl text-sm text-[var(--color-on-surface-muted)]">
                Sincronizare dedicata pentru `compliscan.yaml` si manifests relevante, nu pentru scan complet de repository.
              </p>
            </div>
            <Button asChild variant="outline" className="h-10 rounded-xl px-4">
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
              value={formatRepoSyncOperationalState(repoSyncStatus)}
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
            <SettingsStatusBlock
              eyebrow="Stare curenta"
              title={
                repoSyncStatus?.requiresKey
                  ? "Repo sync este protejat si pregatit pentru CI."
                  : repoSyncStatus?.localAllowedWithoutKey
                    ? "Repo sync merge local fara cheie."
                    : "Repo sync este disponibil."
              }
              description="Folosesti acest traseu pentru manifests si snapshoturi controlate venite din engineering."
            >
              <div className="space-y-2 text-sm text-[var(--color-on-surface-muted)]">
                <p>
                  Header activ:{" "}
                  <span className="font-semibold text-[var(--color-on-surface)]">
                    {repoSyncStatus?.headerName || "x-compliscan-sync-key"}
                  </span>
                </p>
                <p>
                  Endpoint generic:{" "}
                  <span className="font-semibold text-[var(--color-on-surface)]">
                    {repoSyncStatus?.genericEndpoint || "Se incarca"}
                  </span>
                </p>
              </div>
            </SettingsStatusBlock>

            <SettingsStatusBlock
              eyebrow="Actiune recomandata"
              title="Trimite doar manifests relevante."
              description="Pornesti sync-ul din CI si validezi apoi snapshot-ul bun ca baseline."
            >
              <ul className="space-y-1.5 text-sm text-[var(--color-on-surface-muted)]">
                <li>Trimiti `compliscan.yaml` si fisierele de manifest relevante.</li>
                <li>Dupa primul sync, confirmi sistemele AI reale si snapshot-ul bun.</li>
              </ul>
            </SettingsStatusBlock>
          </div>

          <SettingsDisclosure
            eyebrow="Detalii tehnice"
            title="Endpoint-uri si exemplu de apel"
            description="Deschizi aceasta zona cand configurezi adapterele sau debughezi integrarea."
          >
            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
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

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <p className="text-sm font-medium text-[var(--color-on-surface)]">
                  Exemplu rapid de curl
                </p>
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3 text-xs leading-6 text-[var(--color-on-surface)]">
                  {repoSyncStatus?.curlExample ||
                    'curl -X POST http://localhost:3001/api/integrations/repo-sync \\\n  -H "Content-Type: application/json" \\\n  -H "x-compliscan-sync-key: ${COMPLISCAN_SYNC_KEY}" \\\n  -d @repo-sync.json'}
                </pre>
              </div>
            </div>
          </SettingsDisclosure>
        </CardContent>
      </Card>
    </div>
  )
}
