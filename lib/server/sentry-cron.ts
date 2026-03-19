import * as Sentry from "@sentry/nextjs"

type CronErrorDetails = {
  cron: string
  metadata?: Record<string, unknown>
  orgId?: string
  step?: string
}

export function captureCronError(error: unknown, details: CronErrorDetails) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return false

  const normalizedError =
    error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown cron error")

  Sentry.withScope((scope) => {
    scope.setLevel("error")
    scope.setTag("event", "cron.error")
    scope.setTag("cron", details.cron)

    if (details.orgId) {
      scope.setTag("orgId", details.orgId)
    }

    if (details.step) {
      scope.setTag("cron_step", details.step)
    }

    scope.setContext("cron_error", {
      cron: details.cron,
      errorName: normalizedError.name,
      message: normalizedError.message,
      metadata: details.metadata,
      orgId: details.orgId,
      step: details.step,
    })

    Sentry.captureException(normalizedError)
  })

  return true
}

export async function flushCronTelemetry(timeoutMs = 1500) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
  await Sentry.flush(timeoutMs)
}
