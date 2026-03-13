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
        className="drop-shadow-[0_12px_36px_rgba(16,185,129,0.12)]"
        role="img"
        aria-label={`Scor de risc general ${clamped}% (${label})`}
      >
        <defs>
          <linearGradient id="riskGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="transparent"
          stroke="rgba(63,63,70,0.8)"
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
          <div className="text-2xl font-semibold tabular-nums text-emerald-200">
            {clamped}%
          </div>
          <div className="text-[11px] font-medium text-emerald-200/90">
            {label}
          </div>
          <div className="mt-1 text-[10px] text-zinc-400">Scor de risc</div>
        </div>
      </div>
    </div>
  )
}

