# Sprint 6 - Audit Quality Gates

## Obiectiv

Sprint 6 crește defensibilitatea Audit Pack-ului. Nu schimbă promisiunea produsului: aplicația oferă suport și structură, iar omul validează. În schimb, produsul devine mai strict când:

- dovada lipsește
- dovada este slabă
- dovada este veche
- controlul este afectat de drift nerezolvat
- verdictul se bazează doar pe semnale inferate

## Quality gates introduse

- `missing_evidence` -> `blocked`
- `weak_evidence` -> `review`
- `stale_evidence` -> `review`
- `unresolved_drift` -> `blocked`
- `inferred_only_finding` -> `review`

## Efect în produs

- `Audit Pack` primește:
  - `auditQualityDecision`
  - `blockedQualityGates`
  - `reviewQualityGates`
  - lista completă `auditQualityGates`
- `Task Card` arată dacă dovada este suficientă sau slabă
- `family reuse` nu mai tratează dovada ca simplu fișier, ci ca registru cu metadata hidratată din cloud

## Regula sănătoasă

Audit Pack-ul poate fi considerat `audit_ready` doar dacă:

- nu există findings deschise relevante
- nu există drift-uri active care blochează auditul
- nu lipsesc dovezi validate
- `auditQualityDecision === pass`

## Ce rămâne pentru pașii următori

- fixtures mai multe pe documente reale
- quality gates pentru pachetele de evidence reutilizate pe familii
- evaluare mai bună a legăturii dintre dovadă și control
