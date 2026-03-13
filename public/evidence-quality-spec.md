# Evidence Quality Spec

## Scop

Sprint 6 introduce un filtru minim de calitate pentru dovezile încărcate în CompliScan. Scopul nu este să "certifice" legal dovada, ci să marcheze rapid situațiile în care pachetul de audit are nevoie de review uman suplimentar.

## Rezultate posibile

- `sufficient`: dovada pare adecvată pentru tipul selectat și poate intra în Audit Pack fără blocaj automat
- `weak`: dovada există, dar cere review înainte de export sau înainte de a fi tratată ca suport solid pentru control

## Heuristici curente

CompliScan marchează o dovadă drept `weak` când apare cel puțin unul dintre semnalele de mai jos:

- tip generic de dovadă (`other`)
- MIME necunoscut sau `application/octet-stream`
- nume de fișier prea generic (`proof`, `document`, `attachment`, `scan`)
- fișier foarte mic pentru tipul selectat
- payload text prea mic pentru `policy_text`, `log_export`, `yaml_evidence`
- bundle prea mic pentru `document_bundle`

## Ce NU face încă

- nu validează conținutul semantic al fișierului
- nu confirmă dacă screenshot-ul chiar aparține controlului vizat
- nu înlocuiește validarea umană

## Cum se folosește în produs

- `Task Card`: arată dacă dovada este `sufficient` sau `weak`
- `Audit Quality Gates`: transformă dovezile slabe sau vechi în `review` / `blocked`
- `Audit Pack`: expune calitatea dovezii în `controlsMatrix`, `evidenceLedger` și `executiveSummary`

## Direcție ulterioară

După Sprint 6, următorul nivel sănătos este:

- matching între tipul de dovadă și controlul așteptat
- verificare a actualității dovezii față de drift-uri noi
- fixtures reale pentru cazurile cu verdict fals pozitiv / fals negativ

