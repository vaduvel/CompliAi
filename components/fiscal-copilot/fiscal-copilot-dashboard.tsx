"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ChatPanel } from "./chat-panel";
import { BriefingCard } from "./briefing-card";
import { AlertsList } from "./alerts-list";
import type { DailyBriefing } from "@/lib/fiscal-copilot/daily-briefing";
import type { MatchPathAlert } from "@/lib/fiscal-copilot/match-paths/types";

interface HealthStatus {
  ok: boolean;
  reason?: string;
  corpus: number;
  model: string;
}

export function FiscalCopilotDashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [alerts, setAlerts] = useState<MatchPathAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [briefingLoading, setBriefingLoading] = useState(false);

  useEffect(() => {
    // 1. Health check (fast)
    fetch("/api/fiscal-copilot/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false, reason: "Network error", corpus: 0, model: "?" }));

    // 2. Alerts (fast — no LLM)
    fetch("/api/fiscal-copilot/alerts")
      .then((r) => r.json())
      .then((data: { alerts: MatchPathAlert[] }) => {
        setAlerts(data.alerts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchBriefing = async () => {
    setBriefingLoading(true);
    try {
      const res = await fetch("/api/fiscal-copilot/briefing");
      const data = await res.json();
      setBriefing(data);
    } finally {
      setBriefingLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">FiscCopilot</h1>
          <Badge variant="secondary">beta</Badge>
          <HealthIndicator health={health} />
        </div>
        <p className="text-sm text-muted-foreground">
          Asistent fiscal AI privat. Rulează local pe serverul tău. Datele clienților NU pleacă din EU.
          GDPR + secret profesional CECCAR by design.
        </p>
      </header>

      <Tabs defaultValue="briefing" className="w-full">
        <TabsList>
          <TabsTrigger value="briefing">Briefing azi</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerte portofoliu{" "}
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="chat">Întreabă expertul</TabsTrigger>
        </TabsList>

        <TabsContent value="briefing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Daily Briefing</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchBriefing}
                  disabled={briefingLoading}
                >
                  {briefingLoading ? "Se generează..." : briefing ? "Regenerează" : "Generează briefing"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {briefingLoading ? (
                <BriefingLoadingState />
              ) : briefing ? (
                <BriefingCard briefing={briefing} />
              ) : (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Click pe <strong>"Generează briefing"</strong> pentru a obține rezumatul de azi.
                  </p>
                  <p className="text-xs">
                    Briefing-ul agregă toate alertele din portofoliu (Match Paths) și folosește
                    Gemma local (rulează pe device-ul tău) pentru un headline conversațional.
                    Generarea durează ~60s la primul request (cold start), apoi ~30s.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alerte active pe portofoliu</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Se încarcă...</p>
              ) : (
                <AlertsList alerts={alerts} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Întreabă expertul fiscal</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <footer className="space-y-2 text-xs text-muted-foreground">
        <p>
          <strong>Privacy:</strong> Toate interogările rulează pe Gemma local (Ollama). Datele NU se
          trimit la OpenAI / Anthropic / Google. Corpus fiscal: {health?.corpus ?? "?"} articole.
          Model: {health?.model ?? "?"}.
        </p>
        <p>
          <strong>Disclaimer:</strong> FiscCopilot este un asistent. NU înlocuiește un contabil
          autorizat sau consultant fiscal. Răspunsurile se verifică cu sursa oficială ANAF înainte
          de depunere.
        </p>
      </footer>
    </div>
  );
}

function HealthIndicator({ health }: { health: HealthStatus | null }) {
  if (!health) {
    return <Badge variant="outline">verific...</Badge>;
  }
  if (health.ok) {
    return (
      <Badge className="bg-green-100 text-green-900 hover:bg-green-100">● AI local OK</Badge>
    );
  }
  return (
    <Badge variant="destructive" title={health.reason}>
      ● AI offline
    </Badge>
  );
}

function BriefingLoadingState() {
  return (
    <div className="space-y-3 py-6 text-center text-sm text-muted-foreground">
      <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-muted" />
      <p>Gemma rulează local. Generez briefing-ul...</p>
      <p className="text-xs">Asta durează 30-60s. Datele rămân pe serverul tău.</p>
    </div>
  );
}
