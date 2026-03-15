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
  SettingsTabIntro,
  SettingsTile,
  type RepoSyncStatus,
  type SupabaseOperationalStatus,
} from "@/components/compliscan/settings/settings-shared"

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
    </div>
  )
}
