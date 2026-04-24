"use client"

import { Cloud, KeyRound, ShieldCheck } from "lucide-react"

import {
  formatBackendLabel,
  formatHealthCheckSummary,
  healthBadgeVariant,
  OperationalLoadingCard,
  releaseBadgeVariant,
  SettingsDisclosure,
  SettingsPill,
  SettingsSignalCard,
  SettingsStatusBlock,
  SettingsTabIntro,
  SettingsTile,
  type ApplicationHealthStatus,
  type ReleaseReadinessStatus,
} from "@/components/compliscan/settings/settings-shared"

function recommendedHealthAction(appHealth: ApplicationHealthStatus) {
  if (!appHealth) return "Se verifică starea aplicației."
  if (appHealth.blockers.length > 0) return "Închide blocajele înainte de operare critică."
  if (appHealth.warnings.length > 0) return "Revizuiește avertismentele și confirmă traseul cloud."
  return "Nu este nevoie de acțiune imediată."
}

function recommendedReleaseAction(releaseReadiness: ReleaseReadinessStatus) {
  if (!releaseReadiness) return "Se verifică verdictul de release."
  if (releaseReadiness.state === "blocked") return "Nu promova build-ul până când blocajele sunt închise."
  if (releaseReadiness.warnings.length > 0 || releaseReadiness.state === "review") {
    return "Verifică avertismentele înainte de promovare."
  }
  return "Build-ul poate fi promovat controlat."
}

function Panel({
  title,
  pill,
  description,
  children,
}: {
  title: string
  pill?: React.ReactNode
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
      <header className="border-b border-eos-border-subtle px-4 py-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                data-display-text="true"
                className="font-display text-[14.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
              >
                {title}
              </h3>
              {pill}
            </div>
            {description ? (
              <p className="max-w-2xl text-[12.5px] text-eos-text-muted">{description}</p>
            ) : null}
          </div>
        </div>
      </header>
      <div className="space-y-4 px-4 py-4">{children}</div>
    </section>
  )
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
        title="Operațional"
        description="Aici verifici starea instalației și decizi dacă build-ul poate fi promovat controlat."
      />

      <Panel
        title="Health check aplicație"
        pill={
          <SettingsPill tone={healthBadgeVariant(appHealth?.state, appHealthLoading)}>
            {appHealthLoading
              ? "Se verifica"
              : appHealth?.state === "healthy"
                ? "Sanatos"
                : appHealth?.state === "blocked"
                  ? "Blocat"
                  : "Degradat"}
          </SettingsPill>
        }
        description="Semnal operational pentru sesiune, backend-uri, fallback si traseul cloud principal."
      >
        {appHealthLoading ? (
          <OperationalLoadingCard>
            Verificăm starea aplicației și diagnosticul operațional...
          </OperationalLoadingCard>
        ) : appHealthError ? (
          <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft p-4 text-[12.5px] text-eos-error">
            {appHealthError}
          </div>
        ) : appHealth ? (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
                <div className="space-y-1.5 text-[12.5px] text-eos-text-muted">
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
                  <p className="font-mono text-[11px] text-eos-text-muted">
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
                    emptyMessage="Aplicația trece verificarea curentă fără blocaje sau avertismente operaționale majore."
                  />
                )}
              </div>
            </div>
          </>
        ) : null}
      </Panel>

      <Panel
        title="Pregătire release"
        pill={
          <SettingsPill
            tone={
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
          </SettingsPill>
        }
        description="Verdictul care spune daca build-ul poate fi promovat ca release controlat."
      >
        {!currentUserResolved ? (
          <OperationalLoadingCard>
            Verificăm sesiunea curentă pentru a decide ce diagnostice operaționale poți vedea...
          </OperationalLoadingCard>
        ) : !canViewReleaseReadiness ? (
          <div className="flex flex-col items-center gap-2 rounded-eos-sm border border-eos-border bg-eos-surface py-8 text-center">
            <p className="text-[13px] font-semibold text-eos-text">Acces restrictionat</p>
            <p className="max-w-md text-[12.5px] text-eos-text-muted">
              Verdictul complet de pregătire lansare este vizibil doar pentru rolurile Owner și Responsabil conformitate.
            </p>
          </div>
        ) : releaseReadinessLoading ? (
          <OperationalLoadingCard>Verificăm pregătirea de lansare...</OperationalLoadingCard>
        ) : releaseReadinessError ? (
          <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft p-4 text-[12.5px] text-eos-error">
            {releaseReadinessError}
          </div>
        ) : releaseReadiness ? (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                  <div className="space-y-1 font-mono text-[11px] text-eos-text-muted">
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
                  "Build-ul nu trebuie promovat până când blocajele operaționale sunt închise.",
                ]}
                tone="destructive"
              />
            ) : null}

            <SettingsDisclosure
              eyebrow="Detalii suport"
              title="Semnale si verificari de readiness"
              description="Deschizi aceasta zona cand ai nevoie de context suplimentar pentru verdict."
            >
              <div className="space-y-3 text-[12.5px] text-eos-text-muted">
                <p>{releaseReadiness.summary}</p>
                {releaseReadiness.warnings.length > 0 ? (
                  <div className="rounded-eos-sm border border-eos-border bg-eos-surface p-3">
                    <p className="text-[13px] font-medium text-eos-text">
                      Avertismente curente
                    </p>
                    <ul className="mt-2 space-y-1.5 text-[12.5px] text-eos-text-muted">
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
      </Panel>
    </div>
  )
}
