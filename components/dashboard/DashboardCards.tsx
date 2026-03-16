"use client"

import * as React from "react"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleCheckIcon,
  FileTextIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/evidence-os/Alert"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/evidence-os/Card"
import { Progress } from "@/components/evidence-os/Progress"
import { cn } from "@/lib/utils"

const cardBase =
  "bg-eos-surface-variant border-eos-border-subtle ring-1 ring-white/5 shadow-[var(--eos-shadow-lg)] backdrop-blur motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"

export function DashboardCards() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
      <Card className={cn(cardBase, "motion-safe:duration-500")}>
        <CardHeader className="border-b border-eos-border-subtle">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-eos-text">
                <ShieldCheckIcon className="size-4 text-eos-success" />
                EU AI Act Status
              </CardTitle>
              <CardDescription className="mt-1">
                Rezumat pe baza documentelor scanate.
              </CardDescription>
            </div>
            <div className="grid place-items-center">
              <div className="grid size-12 place-items-center rounded-full border border-eos-border bg-eos-success-soft text-eos-success">
                <span className="text-sm font-semibold">OK</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-eos-border bg-eos-surface px-3 py-2">
            <span className="text-sm text-eos-text">High-risk systems</span>
            <Badge className="border border-eos-error-border bg-eos-error-soft text-eos-error">
              2 detectate
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-eos-border bg-eos-surface px-3 py-2">
            <span className="text-sm text-eos-text">Low-risk</span>
            <Badge className="border border-eos-border bg-eos-success-soft text-eos-success">
              8 OK
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="border-t border-eos-border-subtle">
          <Button
            className="w-full"
            variant="secondary"
            onClick={() =>
              toast.message("Detalii", {
                description:
                  "Detaliile EU AI Act vor fi disponibile după conectarea fluxului de scanare.",
              })
            }
          >
            Vezi detalii
            <ArrowRightIcon className="ml-2 size-4" />
          </Button>
        </CardFooter>
      </Card>

      <Card className={cn(cardBase, "motion-safe:duration-700")}>
        <CardHeader className="border-b border-eos-border-subtle">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-eos-text">
                <FileTextIcon className="size-4 text-eos-accent-secondary" />
                e-Factura Integration
              </CardTitle>
              <CardDescription className="mt-1">
                Simulare integrare SPV / ANAF.
              </CardDescription>
            </div>
            <Badge className="border border-eos-border bg-eos-primary-soft text-eos-primary">
              Conectat
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-eos-text">
            <CircleCheckIcon className="size-4 text-eos-accent-secondary" />
            Conectat la ANAF SPV
          </div>
          <div className="flex items-center justify-between rounded-lg border border-eos-border bg-eos-surface px-3 py-2">
            <span className="text-sm text-eos-text">
              Ultimele 12 facturi validate
            </span>
            <CheckCircle2Icon className="size-4 text-eos-success" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-eos-text-muted">
              <span>Stare sincronizare</span>
              <span className="tabular-nums text-eos-text">100%</span>
            </div>
            <Progress value={100} className="h-2 bg-eos-surface" />
          </div>
        </CardContent>
        <CardFooter className="border-t border-eos-border-subtle">
          <Button
            className="w-full"
            onClick={() => toast.success("Actualizat")}
          >
            Actualizează acum
          </Button>
        </CardFooter>
      </Card>

      <Card className={cn(cardBase, "motion-safe:duration-900")}>
        <CardHeader className="border-b border-eos-border-subtle">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-eos-text">
                <CheckCircle2Icon className="size-4 text-eos-success" />
                GDPR Checklist
              </CardTitle>
              <CardDescription className="mt-1">
                Status pe baza recomandării AI.
              </CardDescription>
            </div>
            <Badge className="border border-eos-border bg-eos-success-soft text-eos-success">
              Completat
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-eos-text-muted">
              <span>Progres</span>
              <span className="tabular-nums text-eos-text">100%</span>
            </div>
            <Progress value={100} className="h-2 bg-eos-surface" />
          </div>

          <ul className="space-y-2">
            {[
              "Politică de confidențialitate publicată",
              "Acord de prelucrare (DPA) cu furnizori",
              "Drepturi persoană vizată – procedură",
              "Registru activități de prelucrare",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-lg border border-eos-border bg-eos-surface px-3 py-2 text-sm text-eos-text"
              >
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-eos-success" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="border-t border-eos-border-subtle">
          <Button
            className="w-full"
            variant="secondary"
            onClick={() =>
              toast.message("Checklist", {
                description: "Checklist-ul GDPR este o sugestie. Verifică uman.",
              })
            }
          >
            Vezi checklist
            <ArrowRightIcon className="ml-2 size-4" />
          </Button>
        </CardFooter>
      </Card>

      <Card className={cn(cardBase, "motion-safe:duration-1100")}>
        <CardHeader className="border-b border-eos-border-subtle">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-eos-text">
                <TriangleAlertIcon className="size-4 text-eos-warning" />
                Drift activ
              </CardTitle>
              <CardDescription className="mt-1">
                Prioritizează înainte de raport oficial.
              </CardDescription>
            </div>
            <Badge className="border border-eos-warning-border bg-eos-warning-soft text-eos-warning">
              2
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="border-eos-error-border bg-eos-error-soft text-eos-text">
            <TriangleAlertIcon className="text-eos-error" />
            <AlertTitle>Acțiune necesară</AlertTitle>
            <AlertDescription className="text-eos-text-muted">
              Actualizează documentația AI până la 2 august 2026
            </AlertDescription>
          </Alert>

          <Alert className="border-eos-warning-border bg-eos-warning-soft text-eos-text">
            <TriangleAlertIcon className="text-eos-warning" />
            <AlertTitle>Verificare recomandată</AlertTitle>
            <AlertDescription className="text-eos-text-muted">
              Chatbot-ul tău are risc mediu – verifică
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="border-t border-eos-border-subtle">
          <Button
            className="w-full"
            variant="secondary"
            onClick={() =>
              toast.message("Drift", {
                description: "Semnalele sunt sugestii. Verifică uman înainte de raport.",
              })
            }
          >
            Gestionează driftul
            <ArrowRightIcon className="ml-2 size-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
