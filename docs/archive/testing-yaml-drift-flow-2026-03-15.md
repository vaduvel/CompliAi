# Testing YAML Drift Flow - 2026-03-15

## Scope

Am rulat un test real pentru `compliscan.yaml` pe flow-ul:

`scan YAML -> set baseline -> schimbare YAML -> drift -> lifecycle drift`

Scenariile folosite:

- [09-compliscan-drift-baseline.yaml](/Users/vaduvageorge/Desktop/CompliAI/public/flow-test-kit-rest-scenarios-2026-03-15/09-compliscan-drift-baseline.yaml)
- [10-compliscan-drift-change.yaml](/Users/vaduvageorge/Desktop/CompliAI/public/flow-test-kit-rest-scenarios-2026-03-15/10-compliscan-drift-change.yaml)

Observatie importanta:

- parserul YAML real intra in joc doar daca `documentName` este exact `compliscan.yaml` sau `compliscan.yml`
- pentru testul asta am trimis intentionat `documentName = "compliscan.yaml"`

## Ce am rulat

1. am creat un org nou de test
2. am rulat `POST /api/ai-systems/discover` cu varianta baseline
3. am setat baseline prin `POST /api/state/baseline`
4. am rulat din nou `POST /api/ai-systems/discover` cu varianta schimbata
5. am luat un drift real si i-am rulat lifecycle-ul:
   - `acknowledge`
   - `start`
   - `resolve`
   - `reopen`
   - `waive`
6. am verificat:
   - `reports`
   - `exports/compliscan`
   - un nou `set baseline`

## Rezultatul principal

### Baseline YAML

- `sourceKind = yaml`
- candidat detectat:
  - `Customer Support Assistant`
  - `purpose = support-chatbot`
  - `riskLevel = limited`
  - `hasHumanReview = true`
- fara drift-uri initiale

### Baseline set

- `POST /api/state/baseline` a mers
- `validatedBaselineSnapshotId` a fost setat pe snapshot-ul YAML initial

### YAML schimbat

Am schimbat aceleasi coordonate de sistem:

- acelasi `system_id`
- acelasi `provider`
- acelasi `model`

Dar am schimbat:

- `risk_class`: `limited -> high`
- `personal_data_processed`: `false -> true`
- `human_oversight.required`: `true -> false`
- `data_residency`: `eu-central-1 -> us-east-1`

### Drift-uri generate

Au fost generate `6` drift-uri:

1. `human_review_removed`
   - severitate `critical`
   - `blocksAudit = true`
   - `blocksBaseline = true`

2. `personal_data_detected`
   - severitate `critical`
   - `blocksAudit = true`
   - `blocksBaseline = true`

3. `risk_class_changed`
   - severitate `critical`
   - `blocksAudit = true`
   - `blocksBaseline = true`

4. `data_residency_changed`
   - severitate `critical`
   - `blocksAudit = true`
   - `blocksBaseline = true`

5. `high_risk_signal_detected`
   - severitate `high`

6. `high_risk_signal_detected`
   - severitate `high`

`comparedToSnapshotId` a fost baseline-ul validat, deci comparația a fost corect legată.

## Lifecycle drift

Am rulat lifecycle complet pe drift-ul `human_review_removed`.

### `acknowledge`

- status `200`
- drift-ul a trecut in `acknowledged`
- `acknowledgedBy` a fost setat corect cu userul owner

### `start`

- status `200`
- drift-ul a trecut in `in_progress`
- `inProgressAtISO` a fost setat

### `resolve`

- status `200`
- drift-ul a trecut in `resolved`
- `open = false`
- `resolvedAtISO` a fost setat

### `reopen`

- status `200`
- drift-ul a revenit in `open`
- `lifecycleStatus = open`

### `waive`

- status `200`
- drift-ul a trecut in `waived`
- `open = false`
- `waivedReason` a fost salvat corect

## Reports si export

### Reports

- `score = 0`
- `riskLabel = Risc Ridicat`
- `openAlerts = 7`
- remediation titles includ:
  - `Control pentru fluxurile AI high-risk`
  - `Revizuieste impactul noilor date personale`
  - `Reevalueaza clasa de risc dupa drift`
  - `Confirma noua rezidenta a datelor`
  - doua intrari de `high_risk_signal_detected`
  - `Actualizare politică de retenție date`

### Export CompliScan

- exportul a mers
- snapshot-ul exportat contine `6` drift-uri

## Ce functioneaza bine

- YAML parser real functioneaza
- baseline pe YAML functioneaza
- comparatia cu baseline-ul validat functioneaza
- drift-urile structurale ies corect pentru:
  - review uman
  - date personale
  - clasa de risc
  - rezidenta datelor
- lifecycle-ul drift-ului functioneaza cap-coada

## Ce ramane deschis

### 1. `blocksBaseline` nu este respectat de API-ul de baseline

- desi drift-urile au `blocksBaseline = true`
- un nou `POST /api/state/baseline` a mers
- baseline-ul a fost mutat pe snapshot-ul curent

Acesta este cel mai important semnal tehnic din test.

### 2. Doua drift-uri `high_risk_signal_detected` pot incarca inutil raportarea

- tehnic pot fi justificate prin findings distincte
- operational, merita verificat daca nu dubleaza zgomotul in `Control` si `Rapoarte`

### 3. Ingestia YAML depinde strict de numele documentului

- daca numele nu este exact `compliscan.yaml`, sursa intra pe alta cale
- asta trebuie tratat fie prin UX clar, fie prin detectie dupa continut

## Verdict

Da, drift-ul pe YAML functioneaza real in produs.

Mai exact:

- detectia drift-ului functioneaza
- comparatia cu baseline-ul functioneaza
- lifecycle-ul drift-ului functioneaza

Problema cea mai importanta ramasa nu este generarea drift-ului, ci disciplina de guvernare:

- `blocksBaseline` este calculat corect
- dar nu este inca aplicat cand operatorul seteaza un baseline nou

## Audit dupa rulare

### Ce inspira incredere

- motorul de comparatie intre baseline si snapshot curent este real
- drift-urile structurale importante ies corect din YAML:
  - review uman
  - date personale
  - risc
  - rezidenta datelor
- lifecycle-ul de drift are contract bun si raspunde coerent
- exportul retine drift-urile si le scoate in snapshot

### Ce ramane fragil

- disciplina dintre `policy` si `enforcement` nu este inca inchisa:
  - politica spune `blocksBaseline`
  - API-ul de baseline nu respecta asta
- ingestia YAML este prea stricta pe numele fisierului
- raportarea este inca zgomotoasa:
  - doua drift-uri de `high_risk_signal_detected`
  - multe remedieri la aceeasi greutate
- fluxul tehnic este mai matur decat felul in care este prezentat operatorului

### Evaluarea mea pentru frontul YAML drift

- detectie drift: `8/10`
- lifecycle drift: `8.5/10`
- baseline governance: `5/10`
- claritate operationala in runtime: `6/10`
- defensibilitate finala pentru audit: `6.5/10`

Verdictul meu este ca frontul `YAML drift` este deja util si real, dar nu este inca suficient de strict pentru a fi considerat impecabil in fata unui client sensibil.

## Directia recomandata

### Val 1 - hardening obligatoriu

1. aplica `blocksBaseline` si in `POST /api/state/baseline`
2. detecteaza `compliscan.yaml` si dupa continut, nu doar dupa numele fisierului
3. adauga test automat dedicat pentru:
   - YAML baseline
   - YAML drift
   - baseline blocked de drift

### Val 2 - reducere de zgomot

1. grupeaza drift-urile derivate de tip `high_risk_signal_detected`
2. separa vizual drift structural de drift derivat
3. in `Reports` si `Control`, pune sus:
   - ce s-a schimbat
   - ce blocheaza baseline-ul
   - cine trebuie sa valideze

### Val 3 - UX si explicabilitate

1. arata explicit cand parserul a tratat sursa ca `yaml`
2. afiseaza clar baseline-ul comparat si de ce
3. daca baseline-ul nu poate fi resetat, explica de ce si ce drift il blocheaza

## Imbunatatiri concrete peste ce trebuie deja fixat

- adauga un `Baseline lock card` in `Control / Drift`
- afiseaza `drift family`:
  - structural
  - derived
  - operational
- adauga `source provenance` mai explicit:
  - `compliscan.yaml`
  - `manifest`
  - `document`
- in `Audit Pack`, listeaza separat:
  - drift-uri confirmate structural
  - drift-uri derivate din findings
- pune un guard de UI si API pentru `set baseline` cand exista drift-uri `critical` cu `blocksBaseline = true`

## Decizie pentru Codex principal

Acest test spune doua lucruri foarte clare:

1. nu trebuie rescris frontul YAML drift; fundatia este buna
2. trebuie facut un lot scurt de `governance hardening + noise reduction`

Pe scurt:

- `build, don't rewrite`
- `enforce, don't just describe`
- `reduce noise before adding more explanation`
