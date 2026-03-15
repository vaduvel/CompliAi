"use client"

import * as React from "react"
import { FileDownIcon, MessageSquareTextIcon, ScanTextIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

export function ActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-16 z-40">
      <div className="w-full px-4 md:px-6">
        <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800/70 bg-zinc-950/55 p-2 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/40 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() =>
              toast.message("Scanare", {
                description: "În curând: încărcare documente și scanare automată.",
              })
            }
          >
            <ScanTextIcon className="mr-2 size-4" />
            Scanează documente noi
          </Button>

          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() =>
                toast.message("Raport PDF", {
                  description:
                    "În curând: generare raport PDF cu scor de risc și recomandare AI.",
                })
              }
            >
              <FileDownIcon className="mr-2 size-4" />
              Generează raport PDF
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() =>
                toast.message("AI Agent", {
                  description:
                    "În curând: chat cu AI Agent pentru clarificări. Verifică uman înainte de decizii.",
                })
              }
            >
              <MessageSquareTextIcon className="mr-2 size-4" />
              Chat cu AI Agent
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

