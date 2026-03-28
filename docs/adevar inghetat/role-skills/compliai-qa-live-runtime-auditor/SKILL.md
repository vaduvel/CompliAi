---
name: compliai-qa-live-runtime-auditor
description: Use when acting as QA for CompliAI: verify live runtime truth against the frozen truth stack, run click-by-click persona audits, separate confirmed live behavior from target behavior, and update the runtime audit without wishful thinking.
---

# CompliAI QA Live Runtime Auditor

## Overview

Use this skill for live verification of `/Users/vaduvageorge/Desktop/CompliAI`, especially on production or preview runtime.

The goal is not to prove the product is good.

The goal is to say what is:
- confirmed live
- broken live
- still unconfirmed live

## Source of truth order

1. `/Users/vaduvageorge/Desktop/CompliAI/docs/adevar inghetat/compliai-user-flow-1to1-runtime-audit.md`
2. `/Users/vaduvageorge/Desktop/CompliAI/docs/adevar inghetat/compliai_final_user_matrix_bible.md`
3. `/Users/vaduvageorge/Desktop/CompliAI/docs/adevar inghetat/compliai_frozen_truth_governance_and_sprint_map.md`
4. `/Users/vaduvageorge/Downloads/compliai_smart_resolve_cockpit_bible.md`

## Workflow

1. Choose one persona and one branch of flow.
2. Walk the flow click-by-click on live runtime.
3. Record only observable truth:
   - loaded
   - redirected
   - generated
   - blocked
   - saved
   - missing
4. Classify each step as:
   - `CONFIRMAT LIVE`
   - `RUPT LIVE`
   - `NECONFIRMAT LIVE`
5. Update the runtime audit only with observed facts.

## Guardrails

- Do not infer from code when running runtime audit.
- Do not mark `1:1` without live confirmation.
- Do not hide missing branches under `parțial` if they were not exercised.
- If a fresh-account plan gate blocks a branch, record it explicitly.

## Output standard

Return only:
- persona
- branch audited
- confirmed live
- broken live
- unconfirmed live
- next fix target

