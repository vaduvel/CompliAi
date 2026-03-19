import * as Sentry from "@sentry/nextjs";

const sentryRelease = process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.SENTRY_RELEASE;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.SENTRY_ENVIRONMENT,
  release: sentryRelease,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
