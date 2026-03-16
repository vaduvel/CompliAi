"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export function RiskScoreCircle({
  score,
  label,
  className,
}: {
  score: number
  label: string
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const stroke = 10
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className={cn("relative grid place-items-center", className)}>
      <svg
        width="112"
        height="112"
        viewBox="0 0 112 112"
        className="drop-shadow-[0_12px_36px_rgba(72,99,255,0.16)]"
        role="img"
        aria-label={`Scor de risc general ${clamped}% (${label})`}
      >
        <defs>
          <linearGradient id="riskGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--eos-accent-primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--eos-accent-primary-hover)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="transparent"
          stroke="var(--eos-border-default)"
          strokeWidth={stroke}
        />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="transparent"
          stroke="url(#riskGradient)"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform="rotate(-90 56 56)"
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-semibold tabular-nums text-eos-text">
            {clamped}%
          </div>
          <div className="text-[11px] font-medium text-eos-text-muted">
            {label}
          </div>
          <div className="mt-1 text-[10px] text-eos-text-tertiary">Scor de risc</div>
        </div>
      </div>
    </div>
  )
}
