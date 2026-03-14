"use client"

import { Sparkles, User2 } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/lib/compliance/types"

interface AssistantMessageBubbleProps {
  message: ChatMessage
}

export function AssistantMessageBubble({ message }: AssistantMessageBubbleProps) {
  const isUser = message.role === "user"
  const createdAt = new Date(message.createdAtISO)
  const timeLabel = Number.isNaN(createdAt.getTime())
    ? null
    : createdAt.toLocaleTimeString("ro-RO", {
        hour: "2-digit",
        minute: "2-digit",
      })

  return (
    <div className={cn("flex min-w-0 items-start gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset text-eos-primary">
          <Sparkles className="size-4" strokeWidth={2} aria-hidden="true" />
        </div>
      )}

      <div
        className={cn(
          "min-w-0 max-w-[92%] overflow-hidden rounded-eos-lg border px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[78%]",
          isUser
            ? "border-eos-primary bg-eos-primary text-eos-primary-text"
            : "border-eos-border-subtle bg-eos-surface text-eos-text"
        )}
        role="article"
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge
            variant={isUser ? "outline" : "secondary"}
            className={cn(isUser && "border-eos-primary-text/20 bg-eos-primary/20 text-eos-primary-text")}
          >
            {isUser ? (
              <>
                <User2 className="size-3" aria-hidden="true" />
                Tu
              </>
            ) : (
              <>
                <Sparkles className="size-3" aria-hidden="true" />
                Asistent
              </>
            )}
          </Badge>
          {timeLabel ? (
            <span
              className={cn(
                "text-[11px]",
                isUser ? "text-eos-primary-text/70" : "text-eos-text-tertiary"
              )}
            >
              {timeLabel}
            </span>
          ) : null}
        </div>

        <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.content}</p>
      </div>
    </div>
  )
}
