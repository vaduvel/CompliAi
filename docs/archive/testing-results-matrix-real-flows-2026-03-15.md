# Testing Results Matrix - Real Flows - 2026-03-15

## Scope

Am rulat doua tipuri de verificari:

1. QA real pe localhost, pe org-uri noi de test, cu fisiere locale
2. suita automata completa:
   - `npm test`
   - `npm run lint`
   - `npm run build`

Kituri folosite:

- `public/flow-test-kit-user-nou-document-2026-03-15/*`
- `public/flow-test-kit-rest-scenarios-2026-03-15/*`

## Rezultat scurt

- contractele tehnice principale sunt vii
- exporturile merg
- `e-Factura` merge pe caz valid si invalid
- autodiscovery pe manifeste simple merge
- problemele reale ies acum mai ales in:
  - semantica `Text manual`
  - semantica `compliscan.yaml`
  - sincronizarea `rescan -> validate -> report`

## Matricea reala

### 1. Document full flow

- Scenariu:
  - `03-recruitment-high-risk-bundle.pdf`
  - `05-evidence-human-review-procedure.txt`
  - `06-evidence-retention-and-transfer-register.txt`
- Pasii rulati:
  - scan PDF cu fallback text
  - upload dovezi
  - rescan cu text remediat
  - `mark_done_and_validate`
  - `reports`
  - toate exporturile principale
- Rezultat:
  - scan initial:
    - scor `26`
    - `Risc Ridicat`
    - findings:
      - `EUAI-001`
      - `GDPR-RET-001`
      - `GDPR-INT-001`
      - `GDPR-PD-001`
      - `EUAI-HO-001`
  - dovezi:
    - ambele upload-uri `200`
    - calitate `sufficient`
  - validare:
    - `high-risk-flow` cu mesaj `Confirmare puternică`
    - `retention-policy` cu mesaj `Confirmare puternică`
  - raport final:
    - scor `71`
    - `Risc Ridicat`
    - `openAlerts = 1`
    - `gdprProgress = 100`
    - remediation title ramas:
      - `Actualizare politică de retenție date`
  - exporturi:
    - `CompliScan JSON` `200`
    - `CompliScan YAML` `200`
    - `Audit Pack JSON` `200`
    - `Audit Pack client HTML` `200`
    - `Annex IV lite HTML` `200`
    - `Audit Pack bundle ZIP` `200`
- Verdict:
  - flow-ul tehnic merge
  - sincronizarea semantica finala nu este inca complet curata

### 2. Text manual - customer support limited

- Fisier:
  - `01-text-manual-customer-support.txt`
- Rezultat:
  - scor `80`
  - `Risc Mediu`
  - `openAlerts = 1`
  - finding:
    - `EUAI-001`
  - task:
    - `high-risk-flow`
- Verdict:
  - probabil false positive
  - cazul pare supraescalat

### 3. Text manual - recruitment high-risk

- Fisier:
  - `02-text-manual-high-risk-review-gap.txt`
- Rezultat:
  - scor `53`
  - `Risc Ridicat`
  - `openAlerts = 3`
  - findings:
    - `EUAI-001`
    - `GDPR-INT-001`
    - `GDPR-PD-001`
  - task-uri:
    - `high-risk-flow`
    - `retention-policy`
- Verdict:
  - directia generala este buna
  - merita verificat de ce task-ul de retenție apare fara finding explicit de retenție

### 4. Repo / manifest - package.json

- Fisier:
  - `03-manifest-package-openai.json`
- Rezultat:
  - `sourceKind = manifest`
  - candidat detectat:
    - `Support assistant · OpenAI`
    - `purpose = support-chatbot`
    - `confidence = high`
    - `riskLevel = limited`
  - finding:
    - `EUAI-TR-001`
  - confirmare in inventar: `200`
- Verdict:
  - bun
  - acesta este scenariul cel mai curat din autodiscovery

### 5. Repo / manifest - requirements.txt

- Fisier:
  - `04-manifest-requirements-openai.txt`
- Rezultat:
  - `sourceKind = manifest`
  - candidati detectati:
    - `AI workflow · OpenAI`
    - `AI workflow · Anthropic`
  - finding:
    - `EUAI-TR-001`
  - confirmare primul candidat: `200`
- Verdict:
  - bun ca contract tehnic
  - purpose-ul `other` e acceptabil, dar generic

### 6. compliscan.yaml - customer support

- Fisier:
  - `05-compliscan-customer-support.yaml`
- Rezultat:
  - `sourceKind = manifest`
  - candidat detectat:
    - `Fraud detection · OpenAI`
    - `purpose = fraud-detection`
    - `riskLevel = limited`
  - findings:
    - `GDPR-RET-001`
    - `EUAI-TR-001`
- Verdict:
  - contractul ruleaza
  - mapping-ul semantic este gresit

### 7. compliscan.yaml - recruitment high-risk

- Fisier:
  - `06-compliscan-recruitment-high-risk.yaml`
- Rezultat:
  - `sourceKind = manifest`
  - candidat detectat:
    - `Fraud detection · OpenAI`
    - `purpose = fraud-detection`
    - `riskLevel = limited`
  - findings:
    - `EUAI-001`
    - `GDPR-RET-001`
    - `EUAI-TR-001`
    - `GDPR-INT-001`
- Verdict:
  - rule engine-ul vede semnale relevante
  - dar candidate identity este clar gresita pentru un YAML de recrutare high-risk

### 8. e-Factura XML - valid

- Fisier:
  - `07-efactura-valid-minimal.xml`
- Rezultat:
  - `valid = true`
  - `invoiceNumber = INV-2026-0001`
  - fara erori
  - fara warning-uri
- Verdict:
  - bun

### 9. e-Factura XML - invalid

- Fisier:
  - `08-efactura-invalid-minimal.xml`
- Rezultat:
  - `valid = false`
  - erori structurale multiple:
    - root invalid
    - lipsa `CustomizationID`
    - lipsa `ID`
    - lipsa `IssueDate`
    - lipsa `DocumentCurrencyCode`
    - lipsa parti
    - lipsa totaluri
  - warning-uri:
    - lipsa `ProfileID`
    - lipsa `PaymentMeans`
    - lipsa `CompanyID`
- Verdict:
  - bun
  - validatorul separa corect erorile de warning-uri

## Verificare automata

### `npm test`

- rezultat:
  - `69` fisiere de test trecute
  - `243` teste verzi

### `npm run lint`

- rezultat:
  - trece
  - fara erori ESLint

### `npm run build`

- rezultat:
  - trece
  - build de productie finalizat cu succes

## Concluzie

Produsul este functional la nivel de contracte si flow-uri reale, dar nu toate sursele sunt la acelasi nivel de incredere semantica.

Zona buna:

- document flow real
- evidence upload
- validation
- exporturi
- e-Factura
- manifest autodiscovery simplu

Zona inca sensibila:

- `Text manual` limited vs high-risk
- `compliscan.yaml` parsing / purpose mapping
- rebuild-ul de `report / remediation` dupa rescan si validare
