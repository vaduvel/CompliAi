"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProcedureRecord } from "@/lib/fiscal-copilot/memory/types";

interface Props {
  /** Match Path ID to fetch procedure for */
  pathId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ProcedureModal({ pathId, open, onClose }: Props) {
  const [procedure, setProcedure] = useState<ProcedureRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open || !pathId) return;
    setLoading(true);
    setError(null);
    setProcedure(null);
    setCompletedSteps(new Set());

    fetch(`/api/fiscal-copilot/procedures/${pathId}`)
      .then(async (r) => {
        if (r.status === 404) {
          setError(
            "Nu există procedură configurată pentru această alertă. Trimite feedback ca să adăugăm."
          );
          return null;
        }
        if (!r.ok) {
          setError(`Eroare server: ${r.status}`);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setProcedure(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Eroare rețea");
        setLoading(false);
      });
  }, [open, pathId]);

  if (!open) return null;

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const totalSteps = procedure?.steps.length ?? 0;
  const progress = totalSteps > 0 ? Math.round((completedSteps.size / totalSteps) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-12"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-lg bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-6 py-4 backdrop-blur">
          <div>
            <h2 className="text-lg font-bold">
              {procedure?.title ?? "Procedura"}
            </h2>
            {procedure?.intent && (
              <p className="mt-0.5 text-sm text-muted-foreground">{procedure.intent}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </header>

        {/* Body */}
        <div className="space-y-6 px-6 py-5">
          {loading && <p className="text-sm text-muted-foreground">Se încarcă...</p>}

          {error && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
              {error}
            </div>
          )}

          {procedure && (
            <>
              {/* Stats bar */}
              <div className="flex flex-wrap gap-3">
                {procedure.estimatedTimeManualMin && procedure.estimatedTimeWithCopilotMin && (
                  <div className="rounded-md border bg-muted/50 px-3 py-1.5 text-xs">
                    Manual: <strong>{procedure.estimatedTimeManualMin} min</strong>
                    {" → cu copilot: "}
                    <strong className="text-green-700">
                      {procedure.estimatedTimeWithCopilotMin} min
                    </strong>
                  </div>
                )}
                <div className="rounded-md border bg-muted/50 px-3 py-1.5 text-xs">
                  Pași: <strong>{totalSteps}</strong>
                </div>
                <div className="rounded-md border bg-green-50 px-3 py-1.5 text-xs">
                  Progres: <strong>{progress}%</strong>
                </div>
              </div>

              {/* Documente necesare */}
              {procedure.documentsRequired && procedure.documentsRequired.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    📋 Documente necesare ÎNAINTE de start
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {procedure.documentsRequired.map((d, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-blue-600">›</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Întrebări pentru client */}
              {procedure.questionsToAskClient && procedure.questionsToAskClient.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    💬 De cerut de la client
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {procedure.questionsToAskClient.map((q, i) => (
                      <li key={i} className="rounded-md bg-blue-50 px-2 py-1">
                        "{q}"
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Validări preventive */}
              {procedure.preventiveChecks && procedure.preventiveChecks.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-700">
                    ⚠️ Verifică înainte (preveni amenzi/erori)
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {procedure.preventiveChecks.map((c, i) => (
                      <li key={i} className="rounded-md border-l-4 border-amber-400 bg-amber-50 px-3 py-2">
                        <div className="font-medium">Dacă: <code className="text-xs">{c.check}</code></div>
                        <div className="text-amber-900">→ {c.ifTrueAdvise}</div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Pași */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  🔄 Pași de urmat (bifează pe măsură ce avansezi)
                </h3>
                <ol className="space-y-2">
                  {procedure.steps.map((s, i) => {
                    const done = completedSteps.has(i);
                    return (
                      <li
                        key={i}
                        className={`rounded-lg border p-3 transition-all ${
                          done
                            ? "border-green-300 bg-green-50/50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => toggleStep(i)}
                            className="mt-1 h-4 w-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span
                                className={`font-medium ${done ? "line-through opacity-60" : ""}`}
                              >
                                {i + 1}. {s.description ?? s.action}
                              </span>
                              {s.estimatedMinutes && (
                                <span className="shrink-0 text-xs text-muted-foreground">
                                  ~{s.estimatedMinutes}min
                                </span>
                              )}
                            </div>
                            {s.requires && s.requires.length > 0 && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                <span className="font-medium">Necesită:</span>{" "}
                                {s.requires.join(", ")}
                              </div>
                            )}
                            {s.produces && s.produces.length > 0 && (
                              <div className="mt-0.5 text-xs text-green-700">
                                <span className="font-medium">Produce:</span> {s.produces.join(", ")}
                              </div>
                            )}
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ol>
              </section>

              {/* Output-uri */}
              {procedure.outputs && procedure.outputs.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    📦 Output final (ce vei avea la sfârșit)
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {procedure.outputs.map((o, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-green-600">✓</span>
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Legi de referință */}
              {procedure.legalReferences && procedure.legalReferences.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    📖 Surse legale (citează în răspunsul către client)
                  </h3>
                  <ul className="space-y-1 text-xs">
                    {procedure.legalReferences.map((r, i) => (
                      <li key={i}>
                        <span className="font-medium">{r.article}</span> · {r.law}
                        {r.url && (
                          <>
                            {" "}
                            ·{" "}
                            <a
                              className="text-blue-600 hover:underline"
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {new URL(r.url).hostname}
                            </a>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Tags */}
              {procedure.tags.length > 0 && (
                <section className="border-t pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {procedure.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
