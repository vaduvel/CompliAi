"use client"

import * as React from "react"
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  LayoutTemplate,
  Loader2,
  Scale,
  ShieldAlert,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { CommitSummaryCard } from "@/components/evidence-os/CommitSummaryCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { ReviewPolicyCard } from "@/components/evidence-os/ReviewPolicyCard"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/evidence-os/Separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
import { IntakeSystemCard } from "@/lib/compliance/IntakeSystemCard"
import { FindingProposalCard } from "@/lib/compliance/FindingProposalCard"
import { DriftProposalCard } from "@/lib/compliance/DriftProposalCard"
import type {
  AgentProposalBundle,
  SourceEnvelope,
} from "@/lib/compliance/agent-os"

interface AgentWorkspaceProps {
  sourceEnvelope: SourceEnvelope
  bundle: AgentProposalBundle | null
  loading: boolean
  onRunAgents: () => void
  onCommit: (bundle: AgentProposalBundle) => void | Promise<void>
  onCancel: () => void
}

export function AgentWorkspace({
  sourceEnvelope,
  bundle,
  loading,
  onRunAgents,
  onCommit,
  onCancel,
}: AgentWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState("intake")
  const [rejectedIds, setRejectedIds] = React.useState<Set<string>>(new Set())

  const toggleRejection = (id: string) => {
    const next = new Set(rejectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setRejectedIds(next)
  }

  const handleCommit = () => {
    if (!bundle) return

    // Filtrăm pachetul pentru a exclude elementele respinse
    const finalBundle: AgentProposalBundle = {
      ...bundle,
      intake: bundle.intake ? {
        ...bundle.intake,
        proposedSystems: bundle.intake.proposedSystems.filter(s => !rejectedIds.has(s.tempId))
      } : bundle.intake,
      findings: bundle.findings?.filter(f => !rejectedIds.has(f.findingId)) ?? [],
      drifts: bundle.drifts?.filter(d => !rejectedIds.has(d.driftId)) ?? [],
      // Evidence rămâne momentan ca un tot unitar
      evidence: bundle.evidence
    }

    void onCommit(finalBundle)
  }

  // Dacă nu avem încă un bundle, afișăm starea de start sau loading
  if (!bundle && !loading) {
    return (
      <Card className="border-dashed border-2 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--bg-inset)]">
          <Bot className="size-6 text-[var(--color-primary)]" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Agent Evidence OS</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Rulează suita de agenți pentru a analiza <strong>{sourceEnvelope.sourceName}</strong>. 
          Sistemul va propune inventarul, riscurile și dovezile necesare.
        </p>
        <Button onClick={onRunAgents} className="mt-6" size="lg">
          <Sparkles className="mr-2 size-4" />
          Activează Agenții
        </Button>
      </Card>
    )
  }

  return (
    <div className="grid h-[calc(100vh-140px)] grid-cols-[300px_1fr_300px] gap-6 overflow-hidden">
      {/* Coloana Stânga: Context */}
      <div className="flex flex-col gap-4 overflow-hidden rounded-eos-xl border border-eos-border bg-eos-bg-panel p-4">
        <div>
          <Badge variant="outline" className="mb-2">Source Context</Badge>
          <h3 className="font-semibold text-lg truncate" title={sourceEnvelope.sourceName}>
            {sourceEnvelope.sourceName}
          </h3>
          <p className="text-xs text-muted-foreground uppercase mt-1 tracking-wider">
            {sourceEnvelope.sourceType}
          </p>
        </div>
        
        <Separator />

        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            <div>
              <p className="text-xs font-medium mb-2 text-eos-text-muted">Semnale detectate</p>
              <div className="flex flex-wrap gap-2">
                {sourceEnvelope.sourceSignals.length > 0 ? (
                  sourceEnvelope.sourceSignals.map((sig, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {sig}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-eos-text-muted italic">Niciun semnal brut</span>
                )}
              </div>
            </div>
            
            {sourceEnvelope.rawText && (
              <div>
                <p className="text-xs font-medium mb-2 text-eos-text-muted">Preview conținut</p>
                <div className="rounded-eos-md bg-eos-bg-inset p-2 text-[10px] font-mono text-eos-text-muted line-clamp-[10]">
                  {sourceEnvelope.rawText}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Coloana Centru: Agent Proposals */}
      <div className="flex flex-col overflow-hidden rounded-eos-xl border border-eos-border bg-eos-bg shadow-sm">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <Loader2 className="size-8 animate-spin text-eos-primary" />
            <p className="text-sm text-eos-text-muted animate-pulse">Agenții analizează sursa...</p>
          </div>
        ) : bundle ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
            <div className="border-b border-eos-border px-4 py-2 bg-eos-bg-inset">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="intake">Intake</TabsTrigger>
                <TabsTrigger value="findings">Findings</TabsTrigger>
                <TabsTrigger value="drift">Drift</TabsTrigger>
                <TabsTrigger value="evidence">Evidence</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden p-4">
              <ScrollArea className="h-full pr-4">
                <TabsContent value="intake" className="m-0 space-y-4">
                  <ProposalHeader 
                    title="Intake Agent" 
                    description="Sisteme AI identificate și propuneri de clasificare."
                    icon={LayoutTemplate}
                  />
                  {bundle.intake?.proposedSystems.map((system, i) => (
                    <IntakeSystemCard 
                      key={i} 
                      system={system} 
                      isRejected={rejectedIds.has(system.tempId)} 
                      onToggleRejection={toggleRejection} 
                    />
                  ))}
                  {!bundle.intake?.proposedSystems.length && <EmptyState label="Nu au fost detectate sisteme AI." />}
                </TabsContent>

                <TabsContent value="findings" className="m-0 space-y-4">
                  <ProposalHeader 
                    title="Findings Agent" 
                    description="Probleme de conformitate detectate și reguli încălcate."
                    icon={AlertTriangle}
                  />
                  {bundle.findings?.map((finding, i) => (
                    <FindingProposalCard 
                      key={i} 
                      finding={finding} 
                      isRejected={rejectedIds.has(finding.findingId)} 
                      onToggleRejection={toggleRejection} 
                    />
                  ))}
                  {!bundle.findings?.length && <EmptyState label="Nu au fost detectate probleme de conformitate." />}
                </TabsContent>

                <TabsContent value="drift" className="m-0 space-y-4">
                  <ProposalHeader 
                    title="Drift Agent" 
                    description="Schimbări față de baseline-ul aprobat."
                    icon={Scale}
                  />
                  {bundle.drifts?.map((drift, i) => (
                    <DriftProposalCard 
                      key={i} 
                      drift={drift} 
                      isRejected={rejectedIds.has(drift.driftId)} 
                      onToggleRejection={toggleRejection} 
                    />
                  ))}
                  {!bundle.drifts?.length && <EmptyState label="Nu au fost detectate schimbări față de baseline." />}
                </TabsContent>

                <TabsContent value="evidence" className="m-0 space-y-4">
                  <ProposalHeader 
                    title="Evidence Agent" 
                    description="Starea documentară și pregătirea pentru audit."
                    icon={ShieldAlert}
                  />
                  {bundle.evidence && (
                    <div className="space-y-4">
                      <Card>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between mb-4">
                            <span className="font-medium">Audit Readiness</span>
                            <Badge variant={bundle.evidence.auditReadiness === "ready" ? "success" : "secondary"}>
                              {bundle.evidence.auditReadiness.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-eos-text-muted mb-4">{bundle.evidence.executiveSummaryDraft}</p>
                          
                          {bundle.evidence.missingEvidence.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold mb-3 text-red-600">Dovezi Lipsă:</p>
                              <ul className="list-disc list-inside text-sm space-y-1 text-eos-text-muted">
                                {bundle.evidence.missingEvidence.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      {bundle.evidence.stakeholderChecklist.length > 0 && (
                        <Card>
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm">Checklist Acțiuni</CardTitle>
                          </CardHeader>
                          <CardContent className="py-3 px-4">
                            <ul className="space-y-2">
                              {bundle.evidence.stakeholderChecklist.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <CheckCircle2 className="size-4 mt-0.5 text-eos-text-muted" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </div>
          </Tabs>
        ) : null}
      </div>

      {/* Coloana Dreapta: Review Gate */}
      <div className="flex flex-col gap-4 overflow-hidden rounded-eos-xl border border-eos-border bg-eos-bg-panel p-4">
        <div>
          <Badge variant="outline" className="mb-2">Human Review Gate</Badge>
          <h3 className="font-semibold text-lg">Decizie Finală</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Confirmi propunerile agenților? Acestea vor intra în starea oficială a sistemului.
          </p>
        </div>

        <Separator />

        <div className="flex-1 space-y-4">
          <CommitSummaryCard 
            systemsCount={bundle?.intake?.proposedSystems.filter(s => !rejectedIds.has(s.tempId)).length || 0}
            findingsCount={bundle?.findings?.filter(f => !rejectedIds.has(f.findingId)).length || 0}
            driftsCount={bundle?.drifts?.filter(d => !rejectedIds.has(d.driftId)).length || 0}
          />

          <ReviewPolicyCard />
        </div>

        <div className="mt-auto space-y-3">
          <Button
            className="w-full"
            size="lg"
            disabled={!bundle || loading}
            onClick={handleCommit}
          >
            Confirmă & Aplică
            <ArrowRight className="ml-2 size-4" />
          </Button>
          <Button variant="outline" className="w-full" onClick={onCancel} disabled={loading}>
            Respinge / Anulează
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProposalHeader({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex size-8 items-center justify-center rounded-eos-lg bg-eos-bg-inset">
        <Icon className="size-4 text-eos-primary" />
      </div>
      <div>
        <h4 className="font-medium leading-none">{title}</h4>
        <p className="text-xs text-eos-text-muted mt-1">{description}</p>
      </div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center text-eos-text-muted">
      <FileText className="size-8 mb-2 opacity-20" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
