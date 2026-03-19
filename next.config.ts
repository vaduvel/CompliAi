import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const sentryRelease = process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA;

const nextConfig: NextConfig = {
  experimental: {
    devtoolSegmentExplorer: false,
  },
  env: {
    NEXT_PUBLIC_SENTRY_RELEASE: sentryRelease,
  },
};

export default withSentryConfig(nextConfig, {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  release: sentryRelease
    ? {
        name: sentryRelease,
      }
    : undefined,
  silent: !process.env.CI,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
