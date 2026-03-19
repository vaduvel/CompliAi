# Testing Backlog - Real Flows - 2026-03-15

Acest backlog aduna ce a iesit din:

- flow-ul real `Document -> Control -> Dovada -> Audit si export`
- matricea noua pentru `Text manual`, `Repo / manifest`, `compliscan.yaml`, `e-Factura`, exporturi
- verificarea automata:
  - `npm test`
  - `npm run lint`
  - `npm run build`

## Confirmat ca merge

- auth local si creare org de test
- scan document cu PDF + fallback text
- atasare dovezi pe task-uri
- rescan si validare task-uri
- `Repo / manifest` autodiscovery pentru `package.json`
- `Repo / manifest` autodiscovery pentru `requirements.txt`
- confirmarea unui sistem detectat in inventar
- validare `e-Factura XML` pe caz valid si invalid
- exporturi:
  - `CompliScan JSON`
  - `CompliScan YAML`
  - `Audit Pack JSON`
  - `Audit Pack client HTML`
  - `Annex IV lite HTML`
  - `Audit Pack bundle ZIP`
- suita automata trece:
  - `69` fisiere de test
  - `243` teste verzi
- `lint` trece
- `build` trece

## Backlog prioritar

### P1 - False positive pe `Text manual` pentru caz limitat de suport clienti

- Scenariu:
  - `public/flow-test-kit-rest-scenarios-2026-03-15/01-text-manual-customer-support.txt`
- Rezultat:
  - scor `80`
  - `Risc Mediu`
  - finding `EUAI-001`
  - task `high-risk-flow`
- De ce e problema:
  - cazul descrie un asistent de suport cu sampling review, nu un flux evident high-risk
  - produsul pare sa suprascrie prea agresiv pe `EUAI-001`
- Impact:
  - user nou poate primi imediat task structural fals
  - `Scanare` si `Control` devin mai putin credibile

### P1 - Ingestia YAML este legata strict de numele canonic `compliscan.yaml`

- Scenarii:
  - `05-compliscan-customer-support.yaml`
  - `06-compliscan-recruitment-high-risk.yaml`
- Rezultat:
  - daca fisierul nu se numeste exact `compliscan.yaml` sau `compliscan.yml`, intra pe calea de `manifest`
- De ce e problema:
  - userul poate incarca un YAML valid cu nume descriptiv si produsul nu il trateaza ca sursa canonica YAML
  - distinctia de sursa devine fragila si dependenta de numele fisierului, nu de continut

### P1 - YAML cu nume necanonic produce mapping gresit pentru ca pica pe fallback de `manifest`

- Scenariu limitat:
  - `Customer Support Assistant`
- Scenariu high-risk:
  - `Recruitment Screening Assistant`
- Rezultat in ambele cazuri:
  - candidat detectat ca `Fraud detection · OpenAI`
  - `purpose = fraud-detection`
  - `riskLevel = limited`
- De ce e problema:
  - nu este un bug al parserului YAML real, ci efectul fallback-ului pe autodiscovery de `manifest`
  - produsul poate induce in eroare daca utilizatorul nu cunoaste conventia de nume
- Impact:
  - `Control` poate porni de la un inventar fals
  - `AI Compliance Pack` si exporturile pot deveni slab defensibile

### P1 - `Report / remediation plan` ramane nealiniat dupa validarea task-urilor

- Scenariu:
  - flow complet pe `03-recruitment-high-risk-bundle.pdf`
- Rezultat:
  - ambele validari au trecut cu mesaj de `Confirmare puternică`
  - `gdprProgress = 100`
  - dar raportul final ramane:
    - scor `71`
    - `Risc Ridicat`
    - `openAlerts = 1`
    - `remediationTitles = ["Actualizare politică de retenție date"]`
- De ce e problema:
  - starea de remediere si raportarea nu sunt complet sincronizate
  - planul pare sa fie reconstruit din semnale istorice sau mapping prea larg

### P2 - Rescan-ul dubleaza semnalele istorice in flow-ul de document

- Scenariu:
  - acelasi document rescannat dupa atasarea dovezilor
- Rezultat:
  - in payload-ul de rescan apar duplicate:
    - `EUAI-001`
    - `GDPR-RET-001`
  - `openAlerts` urca la `6` inainte de validare
- De ce e problema:
  - UX-ul pare instabil
  - userul vede mai multe probleme dupa remediere, nu mai putine

### P2 - `baseline` poate fi resetat chiar si cand drift-ul activ spune `blocksBaseline = true`

- Scenariu:
  - drift real pe `compliscan.yaml`, dupa baseline validat
- Rezultat:
  - drift-urile critice generate au `blocksBaseline = true`
  - `POST /api/state/baseline` permite totusi setarea snapshot-ului curent ca baseline nou
- De ce e problema:
  - produsul transmite in policy si audit ca drift-ul blocheaza baseline-ul
  - dar API-ul de baseline nu aplica aceeasi regula
- Impact:
  - operatorul poate ingheta un baseline nou peste schimbari inca deschise sau doar `waived`

## Watchlist

### W1 - `Text manual high-risk` nu produce explicit `GDPR-RET-001`, dar da task de retenție

- Scenariu:
  - `02-text-manual-high-risk-review-gap.txt`
- Rezultat:
  - findings:
    - `EUAI-001`
    - `GDPR-INT-001`
    - `GDPR-PD-001`
  - task-uri:
    - `high-risk-flow`
    - `retention-policy`
- Interpretare:
  - posibil acceptabil daca task-ul vine din semnal compus
  - merita verificat daca lipseste finding-ul sau daca task-ul e prea generos

### W2 - Exporturile merg, dar merita verificat si continutul semantic, nu doar contractul

- Contractele tehnice trec
- Urmatorul pas util este audit pe continut:
  - severitati
  - controale
  - trasabilitate
  - statusuri inchise vs deschise

### W3 - Drift-ul YAML produce doua `high_risk_signal_detected` distincte in acelasi schimb

- Scenariu:
  - `compliscan.yaml` baseline limitat -> varianta high-risk fara review uman
- Rezultat:
  - pe langa drift-urile structurale apar doua drift-uri separate de `high_risk_signal_detected`
- Interpretare:
  - poate fi corect daca findings-urile sunt distincte
  - dar merita verificat daca nu supraincarca inutil `Control` si `Rapoarte`

## Recomandare de prioritizare

1. Fix ingestia stricta pentru `compliscan.yaml`:
   - recunoastere pe continut si nu doar pe nume
   - sau UX clar care cere explicit numele canonic
2. Fix false positive-ul pe `Text manual` limited-support
3. Fix rebuild-ul `remediation plan / report` dupa validare
4. Fix poluarea istorica la `rescan`
5. Decide si aplica regula reala pentru `blocksBaseline`

## Nota operationala

Matricea aceasta a creat org-uri locale de test in store-ul local. Sunt deliberate si pot fi ignorate sau curatate separat daca vrem un workspace complet curat.
