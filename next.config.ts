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
    "/api/exports/diagnostic/[orgId]": [
      "./node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf",
      "./node_modules/pdfkit/js/data/**/*",
    ],
    "/api/exports/anspdcp-pack/[orgId]": [
      "./node_modules/next/dist/compiled/@vercel/og/noto-sans-v27-latin-regular.ttf",
      "./node_modules/pdfkit/js/data/**/*",
    ],
  },
  env: {
    NEXT_PUBLIC_SENTRY_RELEASE: sentryRelease,
  },
  async redirects() {
    // Faza 1 cleanup — apply DESTINATION §3.6 redirects ONLY where target exists today.
    // Remaining ~20 redirects deferred to Faza 3-4 when canonical RO targets are built
    // (/dashboard/scaneaza, /dashboard/actiuni/*, /dashboard/monitorizare/*).
    return [
      {
        source: "/dashboard/settings",
        destination: "/dashboard/setari",
        permanent: true,
      },
      {
        source: "/dashboard/settings/abonament",
        destination: "/dashboard/setari/abonament",
        permanent: true,
      },
      {
        source: "/dashboard/reports",
        destination: "/dashboard/rapoarte",
        permanent: true,
      },
      {
        source: "/dashboard/partner",
        destination: "/portfolio",
        permanent: true,
      },
      {
        source: "/dashboard/partner/:orgId",
        destination: "/portfolio/client/:orgId",
        permanent: true,
      },
      // /dashboard/asistent — DELETED per DESTINATION §11 anti-patterns (chat not in scope).
      // Redirect legacy bookmarks to /dashboard so users land on a real page after auth.
      {
        source: "/dashboard/asistent",
        destination: "/dashboard",
        permanent: true,
      },
    ];
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
