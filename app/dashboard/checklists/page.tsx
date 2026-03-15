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
        title="Executi, atasezi dovada si validezi"
        description="Remedierea ramane pagina de lucru. Ledger-ul si livrabilul final se verifica separat, dupa ce ai inchis task-ul corect."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              executie
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
      />

      <PillarTabs sectionId="dovada" />

      <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Snapshot de executie"
            title="Intri direct in board"
            description="Folosesti board-ul pentru triere, dovada si inchidere. Vault si Audit si export raman pasi de verificare, nu primul ecran de lucru."
            items={items}
          />
        </CardContent>
      </Card>

      <RemediationBoard
        tasks={cockpit.tasks}
        activeFilter={taskFilter}
        onFilterChange={setTaskFilter}
        onMarkDone={cockpitActions.handleMarkDone}
        onAttachEvidence={cockpitActions.attachEvidence}
        onExport={cockpitActions.handleTaskExport}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
          <CardContent className="px-5 py-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Ritm de lucru
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <FlowHint
                title="1. Triage rapid"
                detail="Gasesti task-ul deschis si clarifici daca este remediere rapida sau structurala."
              />
              <FlowHint
                title="2. Dovada minima"
                detail="Atasezi fisierul, captura sau extrasul care sustine inchiderea reala."
              />
              <FlowHint
                title="3. Verificare separata"
                detail="Abia dupa executie sari in Vault sau in Audit si export pentru ledger si livrabil."
              />
            </div>
          </CardContent>
        </Card>

        <HandoffCard
          title="Cand termini board-ul, mergi in paginile read-only"
          description="Remedierea ramane pagina de actiune. Vault si Audit si export te ajuta sa verifici ce este audit-ready, fara sa concureze cu executia."
          destinationLabel="vault / audit pack"
          checklist={[
            "inchizi task-ul si atasezi dovada aici",
            "verifici ledger-ul separat in Auditor Vault",
            "pregatesti livrabilul final in Audit si export",
          ]}
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
      </div>
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
