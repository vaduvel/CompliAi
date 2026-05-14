import type { Metadata } from "next";
import { FiscalCopilotDashboard } from "@/components/fiscal-copilot/fiscal-copilot-dashboard";

export const metadata: Metadata = {
  title: "FiscCopilot — Asistent fiscal AI privat",
  description:
    "Asistent fiscal AI care rulează local pe serverul tău. Datele NU pleacă din EU. GDPR + secret profesional CECCAR-compliant by design.",
};

export default function FiscalCopilotPage() {
  return <FiscalCopilotDashboard />;
}
