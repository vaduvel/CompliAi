import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const sentryRelease = process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA;

const nextConfig: NextConfig = {
  experimental: {
    devtoolSegmentExplorer: false,
  },
  outputFileTracingIncludes: {
    "/api/reports/pdf": [
      "./node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf",
      "./node_modules/pdfkit/js/data/**/*",
    ],
    "/api/documents/export-pdf": [
      "./node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf",
      "./node_modules/pdfkit/js/data/**/*",
    ],
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
  _experimental: {
    vercelCronsMonitoring: true,
  },
  silent: !process.env.CI,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
