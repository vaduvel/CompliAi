"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight } from "lucide-react"

import { RemediationBoard } from "@/components/compliscan/remediation-board"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SectionBoundary } from "@/components/evidence-os/SectionBoundary"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import type { TaskPriority } from "@/components/compliscan/types"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"

type TaskFilter = "ALL" | TaskPriority | "DONE" | "RAPID" | "STRUCTURAL"

export default function RemediationPage() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL")

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const openTasks = cockpit.tasks.filter((task) => task.status !== "done")
  const doneTasks = cockpit.tasks.filter((task) => task.status === "done")
  const evidenceAttached = cockpit.tasks.filter((task) => Boolean(task.attachedEvidence))
  const items: SummaryStripItem[] = [
    {
      label: "Task-uri deschise",
      value: `${openTasks.length}`,
      hint: "actiuni care inca cer executie sau dovada",
      tone: openTasks.length > 0 ? "warning" : "success",
    },
    {
      label: "Task-uri inchise",
      value: `${doneTasks.length}`,
      hint: "trecute prin executie si inchise operational",
      tone: doneTasks.length > 0 ? "success" : "neutral",
    },
    {
      label: "Dovezi atasate",
      value: `${evidenceAttached.length}`,
      hint: "dovezi adaugate in timpul executiei, nu doar la final",
      tone: evidenceAttached.length > 0 ? "accent" : "neutral",
    },
  ]

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Dovada / Remediere"
        title="Aici se face executia reala"
        description="Inchizi task-uri, atasezi dovada si rulezi rescan. Livrabilul si ledger-ul audit-ready raman in paginile lor dedicate."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              executie
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              validare umana obligatorie
            </Badge>
          </>
        }
        aside={
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Snapshot dovada
            </p>
            <p className="text-2xl font-semibold text-eos-text">{cockpit.data.summary.score}</p>
            <p className="text-sm text-eos-text-muted">{cockpit.data.summary.riskLabel}</p>
          </div>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/dashboard/rapoarte/auditor-vault">
                Auditor Vault
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/rapoarte">
                Audit si export
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Link>
            </Button>
          </>
        }
      />

      <PillarTabs sectionId="dovada" />

      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Remediere"
            title="Executie cu dovada, nu doar status update"
            description="Task-ul nu este cu adevarat inchis pana nu ai si dovada, si validarea potrivita prin rescan sau review uman."
            items={items}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <SectionBoundary
          eyebrow="Flux canonic"
          title="Remedierea este locul unde lucrezi, nu locul unde exporti"
          description="Aici prioritizezi, inchizi si probezi actiunile reale. Dupa executie, sari in Vault sau in Audit si export pentru verificare si livrabil."
          support={
            <div className="grid gap-4 md:grid-cols-3">
              <FlowHint
                title="1. Lucrezi pe task"
                detail="Prioritizezi, completezi si inchizi actiunile reale care reduc riscul."
              />
              <FlowHint
                title="2. Atasezi dovada"
                detail="Pastrezi fisierul, captura sau extrasul care sustine remedierea."
              />
              <FlowHint
                title="3. Verifici audit-ready"
                detail="Dupa executie, sari in Vault sau Audit si export pentru verificare si livrabil."
              />
            </div>
          }
        />
        <HandoffCard
          title="Dupa executie continui in paginile read-only"
          description="Remediere ramane pagina de actiune. Auditor Vault iti arata ledger-ul si trasabilitatea, iar Audit si export iti pregateste livrabilul final."
          destinationLabel="vault / audit pack"
          checklist={[
            "executi si inchizi task-ul aici",
            "atasezi dovada inainte sa declari inchiderea reala",
            "verifici separat ledger-ul si livrabilul",
          ]}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/dashboard/rapoarte/auditor-vault">Auditor Vault</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/rapoarte">Audit si export</Link>
              </Button>
            </>
          }
        />
      </div>

      <RemediationBoard
        tasks={cockpit.tasks}
        activeFilter={taskFilter}
        onFilterChange={setTaskFilter}
        onMarkDone={cockpitActions.handleMarkDone}
        onAttachEvidence={cockpitActions.attachEvidence}
        onExport={cockpitActions.handleTaskExport}
      />
    </div>
  )
}

function FlowHint({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
      <p className="text-sm font-medium text-[var(--color-on-surface)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">{detail}</p>
    </div>
  )
}
