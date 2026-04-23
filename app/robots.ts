import type { MetadataRoute } from "next"

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.compliscan.ro"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/dashboard/",
        "/portfolio",
        "/portfolio/",
        "/onboarding/",
        "/login",
        "/register",
        "/claim",
        "/claim/",
        "/reset-password",
        "/account/",
        "/shared/",
        "/whistleblowing/",
        "/demo",
        "/demo/",
      ],
    },
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  }
}
