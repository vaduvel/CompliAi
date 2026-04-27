import type { MetadataRoute } from "next"

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.compliscan.ro"

const routes = [
  {
    path: "/",
    priority: 1,
    changeFrequency: "weekly" as const,
  },
  {
    path: "/pricing",
    priority: 0.9,
    changeFrequency: "weekly" as const,
  },
  {
    path: "/trust",
    priority: 0.7,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/genereaza-politica-gdpr",
    priority: 0.8,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/genereaza-dpa",
    priority: 0.8,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/terms",
    priority: 0.4,
    changeFrequency: "yearly" as const,
  },
  {
    path: "/privacy",
    priority: 0.5,
    changeFrequency: "yearly" as const,
  },
  {
    path: "/dpa",
    priority: 0.5,
    changeFrequency: "yearly" as const,
  },
  // S3.2 — ICP landing pages public (4 segmente Faza 1 Doc 06)
  {
    path: "/dpo",
    priority: 0.95,
    changeFrequency: "weekly" as const,
  },
  {
    path: "/fiscal",
    priority: 0.9,
    changeFrequency: "weekly" as const,
  },
  {
    path: "/imm",
    priority: 0.9,
    changeFrequency: "weekly" as const,
  },
  {
    path: "/nis2",
    priority: 0.85,
    changeFrequency: "weekly" as const,
  },
  // S3.3 — Waitlist pentru segmente coming-soon
  {
    path: "/waitlist",
    priority: 0.6,
    changeFrequency: "monthly" as const,
  },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return routes.map((route) => ({
    url: `${appUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
