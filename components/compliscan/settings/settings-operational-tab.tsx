"use client"

import { Cloud, KeyRound, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import {
  formatBackendLabel,
  formatHealthCheckSummary,
  healthBadgeVariant,
  OperationalLoadingCard,
  releaseBadgeVariant,
  SettingsTabIntro,
  SettingsTile,
  type ApplicationHealthStatus,
  type ReleaseReadinessStatus,
} from "@/components/compliscan/settings/settings-shared"

export function SettingsOperationalTab({
  currentUserResolved,
  canViewReleaseReadiness,
  appHealth,
  appHealthLoading,
  appHealthError,
  releaseReadiness,
  releaseReadinessLoading,
  releaseReadinessError,
}: {
  currentUserResolved: boolean
  canViewReleaseReadiness: boolean
  appHealth: ApplicationHealthStatus
  appHealthLoading: boolean
  appHealthError: string | null
  releaseReadiness: ReleaseReadinessStatus
  releaseReadinessLoading: boolean
  releaseReadinessError: string | null
}) {
  return (
    <div className="space-y-6">
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
    </div>
  )
}
