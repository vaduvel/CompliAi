"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  meta?: {
    confidence?: "high" | "medium" | "low";
    sources?: Array<{ label: string; ref: string }>;
    latencyMs?: number;
    model?: string;
  };
}

const EXAMPLE_QUESTIONS = [
  "Care e amenda pentru D205 depus târziu?",
  "Cum se înregistrează diurna ca să se ducă și în D112?",
  "Când e termenul pentru SAF-T D406 pentru o firmă cu TVA lunară?",
  "Dividende — cum se calculează impozitul și ce declarație depun?",
  "PFA cu rulaj 90.000 EUR — îmi trebuie casă de marcat?",
  "Ce e Regula 98 din DUKIntegrator?",
];

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Bună. Sunt FiscCopilot. Rulez local pe serverul tău — datele NU pleacă de aici. Pune-mi o întrebare fiscală sau dă click pe una din exemplele de mai jos.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;

    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/fiscal-copilot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.answer || "(răspuns gol)",
          meta: {
            confidence: data.confidence,
            sources: data.sources,
            latencyMs: data.latencyMs,
            model: data.model,
          },
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Eroare: ${err instanceof Error ? err.message : "necunoscută"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-[500px] overflow-y-auto rounded-lg border bg-muted/20 p-4">
        {messages.map((m, i) => (
          <MessageBubble key={i} msg={m} />
        ))}
        {loading && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <span className="inline-block animate-pulse">Gemma se gândește...</span>
            <span className="ml-2 text-xs opacity-60">(30-60s pentru răspuns local)</span>
          </div>
        )}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Întreabă o chestie fiscală..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          Trimite
        </Button>
      </form>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Exemple</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              disabled={loading}
              className="rounded-full border border-input bg-background px-3 py-1 text-xs hover:bg-accent disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-background border whitespace-pre-wrap"
        }`}
      >
        {msg.content}
        {msg.meta && (
          <div className="mt-2 space-y-1 border-t border-current/10 pt-2 text-xs opacity-70">
            <div className="flex items-center gap-2">
              {msg.meta.confidence && (
                <Badge variant="outline" className="text-[10px]">
                  Confidence: {msg.meta.confidence}
                </Badge>
              )}
              {msg.meta.latencyMs && <span>{(msg.meta.latencyMs / 1000).toFixed(1)}s</span>}
              {msg.meta.model && <span>· {msg.meta.model}</span>}
            </div>
            {msg.meta.sources && msg.meta.sources.length > 0 && (
              <div>
                <span className="font-semibold">Surse:</span>{" "}
                {msg.meta.sources
                  .slice(0, 3)
                  .map((s) => s.label)
                  .join("; ")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
