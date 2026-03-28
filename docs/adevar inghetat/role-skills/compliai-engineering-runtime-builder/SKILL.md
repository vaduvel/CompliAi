---
name: compliai-engineering-runtime-builder
description: Use when acting as Engineering for CompliAI: implement or refactor runtime so it matches the frozen truth stack, keeps cockpit-first execution, preserves dossier truth, and avoids module drift.
---

# CompliAI Engineering Runtime Builder

## Overview

Use this skill when changing code in `/Users/vaduvageorge/Desktop/CompliAI` to make runtime match the product spine.

Build from structure toward runtime truth.

## Source of truth order

1. `/Users/vaduvageorge/Desktop/CompliAI/docs/adevar inghetat/compliai_frozen_truth_governance_and_sprint_map.md`
2. `/Users/vaduvageorge/Desktop/CompliAI/docs/adevar inghetat/compliai-user-flow-1to1-runtime-audit.md`
3. `/Users/vaduvageorge/Desktop/CompliAI/docs/adevar inghetat/compliai_final_user_matrix_bible.md`
4. `/Users/vaduvageorge/Downloads/compliai_smart_resolve_cockpit_bible.md`

## Workflow

1. Identify the broken runtime claim.
2. Map it to one route family:
   - entry
   - onboarding
   - home
   - resolve
   - cockpit
   - dosar
   - monitoring
   - specialist depth
3. Fix the smallest slice that restores truth.
4. Preserve these invariants:
   - cockpit-first execution
   - evidence must reach Dosar
   - monitoring must keep reentry alive
5. Validate with the lightest safe matrix, then update the runtime audit if the truth changed.

## Guardrails

- Do not refactor broad surfaces without a route-family reason.
- Do not solve UX drift by hiding primary execution.
- Do not push execution into specialist pages unless the handoff is controlled and returns to the same case.
- Do not claim a fix is done until runtime behavior matches the matrix for that screen.

## Output standard

Return only:
- route family touched
- broken truth fixed
- files changed
- validation run
- runtime effect

