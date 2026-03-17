"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export type EvidenceCoreState =
  | "dormant"
  | "scanning"
  | "reviewing"
  | "drifting"
  | "stable"
  | "blocked"

export type AuditDecision = "not-started" | "in-progress" | "ready" | "weak" | "blocked"

export interface EvidenceCoreProps {
  state: EvidenceCoreState
  readinessScore: number          // 0–100
  auditDecision?: AuditDecision
  activeDrifts?: number
  reviewRequiredCount?: number
  weakEvidenceCount?: number
  reasons?: string[]
  compact?: boolean
  className?: string
  "aria-label"?: string
}

// ─── Blob Morph Paths ─────────────────────────────────────────────────────────
// All paths share identical structure: M + 4×cubic-bezier + Z
// Required for SMIL path interpolation (calcMode="spline")

const B = {
  // Calm — minimal deformation (stable, dormant)
  cA: "M 100,41 C 132,41 159,68 159,100 C 159,132 132,159 100,159 C 68,159 41,132 41,100 C 41,68 68,41 100,41 Z",
  cB: "M 101,41 C 133,40 160,67 160,100 C 159,133 132,159 100,160 C 67,159 40,132 40,100 C 41,67 67,41 101,41 Z",
  cC: "M 100,42 C 132,42 158,69 158,100 C 158,131 132,158 100,158 C 68,158 42,131 42,100 C 42,69 68,42 100,42 Z",
  // Active — moderate deformation (scanning, reviewing)
  aA: "M 100,40 C 133,40 160,67 160,100 C 160,133 133,160 100,160 C 67,160 40,133 40,100 C 40,67 67,40 100,40 Z",
  aB: "M 103,38 C 137,39 162,68 161,102 C 160,136 132,162 98,161 C 65,160 38,132 39,98 C 40,65 69,37 103,38 Z",
  aC: "M 97,41 C 131,39 161,66 162,99 C 163,133 135,162 101,163 C 68,164 39,135 38,101 C 37,67 63,43 97,41 Z",
  // Tense — high deformation (drifting, blocked)
  tA: "M 100,38 C 135,37 163,65 164,100 C 165,135 136,164 100,165 C 65,165 36,136 36,100 C 36,65 65,39 100,38 Z",
  tB: "M 104,36 C 140,36 166,64 167,100 C 168,136 139,166 103,167 C 68,167 36,138 35,102 C 34,67 69,36 104,36 Z",
  tC: "M 96,42 C 130,40 165,66 165,101 C 165,136 131,165 96,164 C 62,163 37,133 37,99 C 37,65 62,44 96,42 Z",
}

// ─── Visual Mapping ───────────────────────────────────────────────────────────

interface StateVisual {
  label: string
  primary: string
  secondary: string
  pulseDur: string
  paths: readonly [string, string, string]
  filamentAlpha: number
  nucleusPulse: string   // SMIL values string: "r0;r1;r0"
  haloPulse: string      // SMIL values string: "r0;r1;r0"
}

export function getStateVisual(state: EvidenceCoreState): StateVisual {
  const map: Record<EvidenceCoreState, StateVisual> = {
    dormant: {
      label: "Inactiv",
      primary: "hsl(220 14% 40%)",
      secondary: "hsl(220 14% 58%)",
      pulseDur: "5s",
      paths: [B.cA, B.cB, B.cC],
      filamentAlpha: 0.15,
      nucleusPulse: "12;14;12",
      haloPulse: "82;86;82",
    },
    scanning: {
      label: "Scanare activă",
      primary: "hsl(230 80% 62%)",
      secondary: "hsl(230 60% 76%)",
      pulseDur: "1.6s",
      paths: [B.aA, B.aC, B.aB],
      filamentAlpha: 0.9,
      nucleusPulse: "14;21;14",
      haloPulse: "80;94;80",
    },
    reviewing: {
      label: "În review",
      primary: "hsl(265 65% 65%)",
      secondary: "hsl(265 50% 78%)",
      pulseDur: "2.4s",
      paths: [B.aB, B.aA, B.aC],
      filamentAlpha: 0.55,
      nucleusPulse: "13;18;13",
      haloPulse: "82;90;82",
    },
    drifting: {
      label: "Drift detectat",
      primary: "hsl(45 90% 55%)",
      secondary: "hsl(45 80% 69%)",
      pulseDur: "2.0s",
      paths: [B.tA, B.tC, B.tB],
      filamentAlpha: 0.78,
      nucleusPulse: "13;20;13",
      haloPulse: "80;96;80",
    },
    stable: {
      label: "Control stabil",
      primary: "hsl(145 60% 48%)",
      secondary: "hsl(145 50% 64%)",
      pulseDur: "3.5s",
      paths: [B.cA, B.cC, B.cB],
      filamentAlpha: 0.28,
      nucleusPulse: "14;17;14",
      haloPulse: "83;88;83",
    },
    blocked: {
      label: "Blocat",
      primary: "hsl(0 72% 62%)",
      secondary: "hsl(0 60% 74%)",
      pulseDur: "2.8s",
      paths: [B.tB, B.tA, B.tC],
      filamentAlpha: 0.88,
      nucleusPulse: "15;22;15",
      haloPulse: "78;96;78",
    },
  }
  return map[state]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EvidenceCore({
  state,
  readinessScore,
  auditDecision,
  activeDrifts = 0,
  reviewRequiredCount = 0,
  weakEvidenceCount = 0,
  reasons = [],
  compact = false,
  className,
  "aria-label": ariaLabel,
}: EvidenceCoreProps) {
  // Unique ID prefix prevents SVG defs conflicts when multiple instances exist
  const uid = useId().replace(/:/g, "ec")
  const v = getStateVisual(state)

  // SMIL path animation: A → B → C → B → A (symmetric ping-pong)
  const pathValues = `${v.paths[0]};${v.paths[1]};${v.paths[2]};${v.paths[1]};${v.paths[0]}`

  const computedAriaLabel =
    ariaLabel ??
    `EvidenceCore: ${v.label}, readiness ${readinessScore}%` +
      (activeDrifts > 0 ? `, ${activeDrifts} drift-uri active` : "") +
      (weakEvidenceCount > 0 ? `, ${weakEvidenceCount} dovezi slabe` : "") +
      (reviewRequiredCount > 0 ? `, ${reviewRequiredCount} necesită review` : "")

  const orbSize = compact ? 128 : 200

  return (
    <div
      className={cn("flex flex-col items-center", compact ? "gap-0" : "gap-5", className)}
      aria-label={computedAriaLabel}
      role="img"
    >
      {/* ── Orb SVG ─────────────────────────────────────────────────────── */}
      <svg
        viewBox="0 0 200 200"
        width={orbSize}
        height={orbSize}
        aria-hidden="true"
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
            <stop offset="50%" stopColor={v.primary} stopOpacity={0} />
            <stop offset="100%" stopColor={v.primary} stopOpacity={0.18} />
          </radialGradient>

          <radialGradient id={`${uid}-membrane`} cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor={v.secondary} stopOpacity={0.38} />
            <stop offset="55%" stopColor={v.primary} stopOpacity={0.18} />
            <stop offset="100%" stopColor={v.primary} stopOpacity={0.04} />
          </radialGradient>

          <radialGradient id={`${uid}-nucleus`} cx="42%" cy="38%" r="60%">
            <stop offset="0%" stopColor={v.secondary} />
            <stop offset="100%" stopColor={v.primary} />
          </radialGradient>

          {/* Soft glow applied to membrane */}
          <filter id={`${uid}-glow`} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Tight glow applied to nucleus */}
          <filter id={`${uid}-nglow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Outer halo (breathing ring) ── */}
        <circle cx="100" cy="100" fill={`url(#${uid}-halo)`}>
          <animate
            attributeName="r"
            values={v.haloPulse}
            dur={v.pulseDur}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.5;1"
            keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
          />
          <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur={v.pulseDur}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.5;1"
            keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
          />
        </circle>

        {/* ── Filaments (radial signal strands) ── */}
        <g opacity={v.filamentAlpha}>
          {([30, 82, 148, 204, 262, 318] as const).map((angle, i) => {
            const rad = (angle * Math.PI) / 180
            const r1 = 23
            const r2 = 44 + (i % 3) * 7
            const r2e = r2 * 1.18
            const x1 = +(100 + Math.cos(rad) * r1).toFixed(2)
            const y1 = +(100 + Math.sin(rad) * r1).toFixed(2)
            const x2 = +(100 + Math.cos(rad) * r2).toFixed(2)
            const y2 = +(100 + Math.sin(rad) * r2).toFixed(2)
            const x2e = +(100 + Math.cos(rad) * r2e).toFixed(2)
            const y2e = +(100 + Math.sin(rad) * r2e).toFixed(2)
            const phase = i % 2 === 0
            const dur = `${(parseFloat(v.pulseDur) * 0.65 + i * 0.18).toFixed(2)}s`
            return (
              <line
                key={angle}
                x1={x1}
                y1={y1}
                stroke={v.primary}
                strokeWidth={1 + (i % 2) * 0.5}
                strokeLinecap="round"
              >
                <animate
                  attributeName="x2"
                  values={`${x2};${x2e};${x2}`}
                  dur={dur}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                />
                <animate
                  attributeName="y2"
                  values={`${y2};${y2e};${y2}`}
                  dur={dur}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                />
                <animate
                  attributeName="opacity"
                  values={phase ? "0.4;1;0.4" : "1;0.35;1"}
                  dur={dur}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                />
              </line>
            )
          })}
        </g>

        {/* ── Membrane fill (organic breathing blob) ── */}
        <path fill={`url(#${uid}-membrane)`} filter={`url(#${uid}-glow)`}>
          <animate
            attributeName="d"
            values={pathValues}
            dur={v.pulseDur}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.25;0.5;0.75;1"
            keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1"
          />
        </path>

        {/* ── Membrane stroke (outline) ── */}
        <path fill="none" stroke={v.primary} strokeWidth="1.5" opacity={0.5}>
          <animate
            attributeName="d"
            values={pathValues}
            dur={v.pulseDur}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.25;0.5;0.75;1"
            keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1"
          />
        </path>

        {/* ── Dashed orbit ring ── */}
        <circle
          cx="100"
          cy="100"
          r="26"
          fill="none"
          stroke={v.primary}
          strokeWidth="0.75"
          opacity={0.22}
          strokeDasharray="4 9"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 100 100"
            to="360 100 100"
            dur={`${parseFloat(v.pulseDur) * 5}s`}
            repeatCount="indefinite"
          />
        </circle>

        {/* ── Nucleus (core dot) ── */}
        <circle cx="100" cy="100" fill={`url(#${uid}-nucleus)`} filter={`url(#${uid}-nglow)`}>
          <animate
            attributeName="r"
            values={v.nucleusPulse}
            dur={v.pulseDur}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.5;1"
            keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
          />
        </circle>

        {/* ── Score ── */}
        <text
          x="100"
          y="100"
          textAnchor="middle"
          dominantBaseline="central"
          fill={v.secondary}
          fontSize={compact ? 20 : 24}
          fontWeight="600"
          fontFamily="inherit"
          style={{ userSelect: "none" }}
        >
          {readinessScore}%
        </text>

        {/* ── State label (full size only) ── */}
        {!compact && (
          <text
            x="100"
            y="120"
            textAnchor="middle"
            fill={v.primary}
            fontSize="8.5"
            fontWeight="500"
            fontFamily="inherit"
            letterSpacing="0.12em"
            opacity={0.85}
            style={{ userSelect: "none", textTransform: "uppercase" }}
          >
            {v.label}
          </text>
        )}
      </svg>

      {/* ── Metrics panel (full size only) ── */}
      {!compact && (
        <div className="w-full space-y-2 rounded-eos-md border border-eos-border bg-eos-surface-variant px-4 py-3">
          {activeDrifts > 0 && (
            <MetricRow label="Drift-uri active" value={`${activeDrifts}`} tone="warning" />
          )}
          {weakEvidenceCount > 0 && (
            <MetricRow label="Dovezi slabe" value={`${weakEvidenceCount}`} tone="warning" />
          )}
          {reviewRequiredCount > 0 && (
            <MetricRow label="Necesită review" value={`${reviewRequiredCount}`} tone="info" />
          )}
          {auditDecision && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-eos-text-tertiary">Decizie audit</span>
              <AuditDecisionBadge decision={auditDecision} />
            </div>
          )}
          {reasons.length > 0 && (
            <ul className="space-y-1 pt-1">
              {reasons.slice(0, 3).map((reason, i) => (
                <li key={i} className="text-[11px] leading-[1.4] text-eos-text-tertiary">
                  · {reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Internal sub-components ──────────────────────────────────────────────────

function MetricRow({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "warning" | "danger" | "info" | "success"
}) {
  const colorClass = {
    warning: "text-eos-warning",
    danger: "text-eos-error",
    info: "text-eos-info",
    success: "text-eos-success",
  }[tone]
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-eos-text-tertiary">{label}</span>
      <span className={cn("text-[11px] font-medium tabular-nums", colorClass)}>{value}</span>
    </div>
  )
}

function AuditDecisionBadge({ decision }: { decision: AuditDecision }) {
  const config: Record<AuditDecision, { label: string; colorClass: string }> = {
    "not-started": { label: "Neînceput", colorClass: "text-eos-text-tertiary" },
    "in-progress": { label: "În curs", colorClass: "text-eos-primary" },
    ready:         { label: "Pregătit", colorClass: "text-eos-success" },
    weak:          { label: "Dovadă slabă", colorClass: "text-eos-warning" },
    blocked:       { label: "Blocat", colorClass: "text-eos-error" },
  }
  const { label, colorClass } = config[decision]
  return <span className={cn("text-[11px] font-medium", colorClass)}>{label}</span>
}
