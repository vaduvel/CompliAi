import type { Metadata } from "next";
import { FiscalCopilotDashboard } from "@/components/fiscal-copilot/fiscal-copilot-dashboard";

export const metadata: Metadata = {
  title: "FiscCopilot Demo — Asistent fiscal AI privat",
  description:
    "Demo public FiscCopilot. Asistent fiscal AI care rulează local pe serverul nostru. Datele NU pleacă din EU.",
};

export default function FiscalCopilotDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30 px-6 py-3">
        <div className="container mx-auto max-w-7xl">
          <p className="text-xs text-muted-foreground">
            <strong>Demo public.</strong> Foloseste portofoliu fictiv (5 clienti seed).
            Pentru a folosi cu portofoliul tau real, autentifica-te in dashboard.
          </p>
        </div>
      </div>
      <FiscalCopilotDashboard />
    </div>
  );
}
