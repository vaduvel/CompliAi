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
  SettingsDisclosure,
  SettingsSignalCard,
  SettingsStatusBlock,
  SettingsTabIntro,
  SettingsTile,
  type ApplicationHealthStatus,
  type ReleaseReadinessStatus,
} from "@/components/compliscan/settings/settings-shared"

function recommendedHealthAction(appHealth: ApplicationHealthStatus) {
  if (!appHealth) return "Se verifica starea aplicatiei."
  if (appHealth.blockers.length > 0) return "Inchide blocajele inainte de operare critica."
  if (appHealth.warnings.length > 0) return "Revizuieste avertismentele si confirma traseul cloud."
  return "Nu este nevoie de actiune imediata."
}

function recommendedReleaseAction(releaseReadiness: ReleaseReadinessStatus) {
  if (!releaseReadiness) return "Se verifica verdictul de release."
  if (releaseReadiness.state === "blocked") return "Nu promova build-ul pana cand blocajele sunt inchise."
  if (releaseReadiness.warnings.length > 0 || releaseReadiness.state === "review") {
    return "Verifica avertismentele inainte de promovare."
  }
  return "Build-ul poate fi promovat controlat."
}

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
        description="Aici verifici starea instalatiei si decizi daca build-ul poate fi promovat controlat."
      />

      <Card className="border-eos-border bg-eos-surface">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-xl">Health check aplicatie</CardTitle>
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
              <p className="max-w-2xl text-sm text-eos-text-muted">
                Semnal operational pentru sesiune, backend-uri, fallback si traseul cloud principal.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {appHealthLoading ? (
            <OperationalLoadingCard>
              Verificam starea aplicatiei si preflight-ul operational...
            </OperationalLoadingCard>
          ) : appHealthError ? (
            <div className="rounded-eos-md border border-eos-error-border bg-eos-error-soft p-4 text-sm text-eos-error">
              {appHealthError}
            </div>
          ) : appHealth ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {appHealth.checks.map((check) => (
                  <SettingsTile
                    key={check.key}
                    icon={
                      check.key === "session_secret"
                        ? KeyRound
                        : check.key === "supabase_operational"
                          ? Cloud
                          : ShieldCheck
                    }
                    label={check.label}
                    value={formatHealthCheckSummary(check.state, check.summary)}
                  />
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <SettingsStatusBlock
                  eyebrow="Stare curenta"
                  title={appHealth.summary}
                  description="Acesta este verdictul agregat pentru operarea curenta a aplicatiei."
                >
                  <div className="space-y-2 text-sm text-eos-text-muted">
                    <p>
                      Auth:{" "}
                      <span className="font-semibold text-eos-text">
                        {formatBackendLabel(appHealth.config.authBackend)}
                      </span>
                    </p>
                    <p>
                      Date:{" "}
                      <span className="font-semibold text-eos-text">
                        {formatBackendLabel(appHealth.config.dataBackend)}
                      </span>
                    </p>
                    <p>
                      Fallback local:{" "}
                      <span className="font-semibold text-eos-text">
                        {appHealth.config.localFallbackAllowed ? "Permis" : "Blocat"}
                      </span>
                    </p>
                  </div>
                </SettingsStatusBlock>

                <div className="space-y-4">
                  <SettingsStatusBlock
                    eyebrow="Actiune recomandata"
                    title={recommendedHealthAction(appHealth)}
                    description="Starea si urmatorul pas bat explicatia detaliata."
                  >
                    <p className="text-xs text-eos-text-muted">
                      Endpoint intern: <code>/api/health</code>
                    </p>
                  </SettingsStatusBlock>

                  {appHealth.blockers.length > 0 ? (
                    <SettingsSignalCard
                      title="Blocaje active"
                      items={appHealth.blockers}
                      tone="destructive"
                    />
                  ) : appHealth.warnings.length > 0 ? (
                    <SettingsSignalCard
                      title="Avertismente"
                      items={appHealth.warnings}
                      tone="warning"
                    />
                  ) : (
                    <SettingsSignalCard
                      title="Fara semnale majore"
                      items={[]}
                      tone="success"
                      emptyMessage="Aplicatia trece health check-ul curent fara blocaje sau avertismente operationale majore."
                    />
                  )}
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-eos-border bg-eos-surface">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-xl">Pregatire release</CardTitle>
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
              <p className="max-w-2xl text-sm text-eos-text-muted">
                Verdictul care spune daca build-ul poate fi promovat ca release controlat.
              </p>
            </div>
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
              className="rounded-eos-md"
            />
          ) : releaseReadinessLoading ? (
            <OperationalLoadingCard>Verificam release readiness...</OperationalLoadingCard>
          ) : releaseReadinessError ? (
            <div className="rounded-eos-md border border-eos-error-border bg-eos-error-soft p-4 text-sm text-eos-error">
              {releaseReadinessError}
            </div>
          ) : releaseReadiness ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {releaseReadiness.checks.map((check) => (
                  <SettingsTile
                    key={check.key}
                    icon={
                      check.key.includes("supabase")
                        ? Cloud
                        : check.key === "session_secret"
                          ? KeyRound
                          : ShieldCheck
                    }
                    label={check.label}
                    value={formatHealthCheckSummary(check.state, check.summary)}
                  />
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <SettingsStatusBlock
                  eyebrow="Stare curenta"
                  title={releaseReadiness.summary}
                  description="Acesta este verdictul agregat pentru promovarea build-ului."
                />

                <div className="space-y-4">
                  <SettingsStatusBlock
                    eyebrow="Actiune recomandata"
                    title={recommendedReleaseAction(releaseReadiness)}
                    description="Promovezi doar dupa ce verdictul si semnalele sunt curate."
                  >
                    <div className="space-y-1.5 text-xs text-eos-text-muted">
                      <p>
                        Endpoint intern: <code>/api/release-readiness</code>
                      </p>
                      <p>
                        Preflight local: <code>npm run preflight:release</code>
                      </p>
                    </div>
                  </SettingsStatusBlock>

                  {releaseReadiness.blockers.length > 0 ? (
                    <SettingsSignalCard
                      title="Blocaje active"
                      items={releaseReadiness.blockers}
                      tone="destructive"
                    />
                  ) : releaseReadiness.warnings.length > 0 ? (
                    <SettingsSignalCard
                      title="Avertismente"
                      items={releaseReadiness.warnings}
                      tone="warning"
                    />
                  ) : (
                    <SettingsSignalCard
                      title="Fara semnale majore"
                      items={[]}
                      tone="success"
                      emptyMessage="Release readiness nu raporteaza avertismente majore."
                    />
                  )}
                </div>
              </div>

              {releaseReadiness.state === "blocked" ? (
                <SettingsSignalCard
                  title="Release blocat"
                  items={[
                    "Build-ul nu trebuie promovat pana cand blocajele operationale sunt inchise.",
                  ]}
                  tone="destructive"
                />
              ) : null}

              <SettingsDisclosure
                eyebrow="Detalii suport"
                title="Semnale si verificari de readiness"
                description="Deschizi aceasta zona cand ai nevoie de context suplimentar pentru verdict."
              >
                <div className="space-y-3 text-sm text-eos-text-muted">
                  <p>{releaseReadiness.summary}</p>
                  {releaseReadiness.warnings.length > 0 ? (
                    <div className="rounded-eos-md border border-eos-border bg-eos-surface p-3">
                      <p className="text-sm font-medium text-eos-text">
                        Avertismente curente
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm text-eos-text-muted">
                        {releaseReadiness.warnings.map((warning) => (
                          <li key={warning}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </SettingsDisclosure>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
