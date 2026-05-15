import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FiscalCopilotDashboard } from "@/components/fiscal-copilot/fiscal-copilot-dashboard";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "FiscCopilot — Asistent fiscal AI privat",
  description:
    "Asistent fiscal AI care rulează local pe serverul tău. Datele NU pleacă din EU. GDPR + secret profesional CECCAR-compliant by design.",
};

/**
 * Rută top-level FiscCopilot (în afara /dashboard/* layout-ului standard).
 *
 * Necesită doar session validă — NU cere onboarding complet ca /dashboard/*.
 * Util pentru beta testers care vor să încerce produsul rapid.
 */
export default async function FiscalCopilotStandalonePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  const session = sessionToken ? verifySessionToken(sessionToken) : null;

  if (!session) {
    redirect("/login?next=/fiscal-copilot");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/30 px-6 py-3">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <a href="/" className="text-sm font-semibold">
            CompliScan
          </a>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{session.email}</span>
            <span>·</span>
            <span>{session.orgName}</span>
            <a href="/api/auth/logout" className="hover:underline">
              logout
            </a>
          </div>
        </div>
      </header>
      <FiscalCopilotDashboard />
    </div>
  );
}
