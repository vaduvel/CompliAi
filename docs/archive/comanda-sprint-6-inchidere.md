# CompliScan - Comanda Sprint 6 (Audit defensibility) - Inchidere

Data: 2026-03-14
Status tinta: inchidere operationala

## Context
- Sprint 7 este inchis operational. Acest document NU redeschide Sprint 7.
- Sprint 6 este in progress in board; scopul este inchidere finala, nu extindere de features.
- Sursa de adevar ramane:
  - public/sprinturi-maturizare-compliscan.md
  - public/log-sprinturi-maturizare.md
  - public/status-arhitectura.md
  - public/task-breakdown-tehnic.md

## Principii
- Pastram firul de produs: Scanare -> Control -> Dovada, Remediere, Audit si export.
- Nu introducem concepte noi de produs fara update in documentele de status.
- Fara rewrite, doar inchidere defensibila a backlog-ului Sprint 6.

## Scop
1. Audit Pack si traceability devin mai greu de contestat.
2. Quality gates si evidence quality sunt propagate complet in UI si exporturi.
3. Eliminam orice interpretare de "verdict legal automat".

## In scope
- Verificare si completare propagare pentru:
  - evidenceQuality (sufficient / weak)
  - auditQualityDecision + blocked/review gates
  - traceability matrix + evidence ledger
- Revalidare puncte critice raportate anterior (doar daca sunt confirmate in codul curent):
  - IDOR pe header x-compliscan-org-id (agent commit)
  - OCR empty -> false "risc redus"
  - task id nevalidat la PATCH /api/tasks/:id
  - idempotency lipsa la POST /api/scan
- Fixuri minimale doar pentru bug-uri reale confirmate in codul curent.

## Out of scope
- Performance cleanup cockpit
- Split major de useCockpit
- Refactor masiv de storage/auth
- Features noi

## Checklist de lucru
- [ ] Audit punctual pe codepath-urile de audit: Audit Pack, traceability, evidence upload/read
- [ ] Verificare UI: Auditor Vault + Audit Pack client (gates si evidence quality vizibile)
- [ ] Fixuri minimale pentru bug-uri confirmate ca active
- [ ] Update documente de control dupa inchidere

## Definition of Done
- Audit Pack + traceability nu pot raporta audit_ready cand gates sunt active
- evidence quality este vizibila in UI si export (minim sufficient/weak)
- orice bug critic confirmat este fixat sau logat explicit in risk register
- validare trece: npm test + npm run lint + npm run build

## Validare
- Route logic / audit: npm test + npm run lint + npm run build

## Reporting (dupa inchidere)
- public/log-sprinturi-maturizare.md
- public/sprinturi-maturizare-compliscan.md
- public/status-arhitectura.md
- public/task-breakdown-tehnic.md
