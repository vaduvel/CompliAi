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

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const cardBase =
  "bg-zinc-800 border-zinc-700/60 ring-1 ring-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"

export function DashboardCards() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
      <Card className={cn(cardBase, "motion-safe:duration-500")}>
        <CardHeader className="border-b border-zinc-700/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-zinc-50">
                <ShieldCheckIcon className="size-4 text-emerald-300" />
                EU AI Act Status
              </CardTitle>
              <CardDescription className="mt-1">
                Rezumat pe baza documentelor scanate.
              </CardDescription>
            </div>
            <div className="grid place-items-center">
              <div className="grid size-12 place-items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-200">
                <span className="text-sm font-semibold">OK</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700/50 bg-zinc-950/30 px-3 py-2">
            <span className="text-sm text-zinc-200">High-risk systems</span>
            <Badge className="border border-rose-500/25 bg-rose-500/10 text-rose-200">
              2 detectate
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700/50 bg-zinc-950/30 px-3 py-2">
            <span className="text-sm text-zinc-200">Low-risk</span>
            <Badge className="border border-emerald-500/25 bg-emerald-500/10 text-emerald-200">
              8 OK
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="border-t border-zinc-700/40">
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
        <CardHeader className="border-b border-zinc-700/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-zinc-50">
                <FileTextIcon className="size-4 text-sky-300" />
                e-Factura Integration
              </CardTitle>
              <CardDescription className="mt-1">
                Simulare integrare SPV / ANAF.
              </CardDescription>
            </div>
            <Badge className="border border-sky-500/25 bg-sky-500/10 text-sky-200">
              Conectat
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-zinc-200">
            <CircleCheckIcon className="size-4 text-sky-300" />
            Conectat la ANAF SPV
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-700/50 bg-zinc-950/30 px-3 py-2">
            <span className="text-sm text-zinc-200">
              Ultimele 12 facturi validate
            </span>
            <CheckCircle2Icon className="size-4 text-emerald-300" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Stare sincronizare</span>
              <span className="tabular-nums text-zinc-300">100%</span>
            </div>
            <Progress value={100} className="h-2 bg-zinc-950/40" />
          </div>
        </CardContent>
        <CardFooter className="border-t border-zinc-700/40">
          <Button
            className="w-full"
            onClick={() => toast.success("Actualizat")}
          >
            Actualizează acum
          </Button>
        </CardFooter>
      </Card>

      <Card className={cn(cardBase, "motion-safe:duration-900")}>
        <CardHeader className="border-b border-zinc-700/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-zinc-50">
                <CheckCircle2Icon className="size-4 text-emerald-300" />
                GDPR Checklist
              </CardTitle>
              <CardDescription className="mt-1">
                Status pe baza recomandării AI.
              </CardDescription>
            </div>
            <Badge className="border border-emerald-500/25 bg-emerald-500/10 text-emerald-200">
              Completat
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Progres</span>
              <span className="tabular-nums text-zinc-300">100%</span>
            </div>
            <Progress value={100} className="h-2 bg-zinc-950/40" />
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
                className="flex items-start gap-2 rounded-lg border border-zinc-700/50 bg-zinc-950/30 px-3 py-2 text-sm text-zinc-200"
              >
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="border-t border-zinc-700/40">
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
        <CardHeader className="border-b border-zinc-700/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-zinc-50">
                <TriangleAlertIcon className="size-4 text-amber-300" />
                Drift activ
              </CardTitle>
              <CardDescription className="mt-1">
                Prioritizează înainte de raport oficial.
              </CardDescription>
            </div>
            <Badge className="border border-amber-500/25 bg-amber-500/10 text-amber-200">
              2
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="border-rose-500/25 bg-rose-500/10 text-rose-100">
            <TriangleAlertIcon className="text-rose-200" />
            <AlertTitle>Acțiune necesară</AlertTitle>
            <AlertDescription className="text-rose-100/80">
              Actualizează documentația AI până la 2 august 2026
            </AlertDescription>
          </Alert>

          <Alert className="border-amber-500/25 bg-amber-500/10 text-amber-50">
            <TriangleAlertIcon className="text-amber-200" />
            <AlertTitle>Verificare recomandată</AlertTitle>
            <AlertDescription className="text-amber-100/80">
              Chatbot-ul tău are risc mediu – verifică
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="border-t border-zinc-700/40">
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
