# Audit pregatitor - `Checklists` next wave

Data: 2026-03-15

## 1. Intentia dominanta actuala a paginii `Checklists`

Intentia dominanta actuala este corecta si relativ clara:

- `Remediere` este pagina de executie reala
- aici inchizi task-uri
- aici atasezi dovada
- aici rulezi validarea prin rescan sau review uman

Pagina respecta deja framing-ul canonic al zonei `Dovada`:

- `Remediere` = executie
- `Audit si export` = readiness + livrabil
- `Auditor Vault` = ledger + trasabilitate

Din ce se vede in implementarea actuala, `Checklists` nu mai pare pagina gresita din punct de vedere conceptual. Problema nu este intentia, ci densitatea de prezentare in jurul board-ului si in interiorul `TaskCard`.

## 2. Unde mai exista densitate sau mixed intent

### Summary

- `PageIntro` este clar si spune corect ce faci si ce nu faci aici
- `SummaryStrip` este util, dar mai adauga un strat explicativ inainte de lucru
- combinatia `PageIntro` + `SummaryStrip` + `Flow canonic` face ca board-ul real sa coboare prea jos

Verdict pe summary:

- nu este gresit
- dar este prea lung pentru o pagina de executie

### Board

- `RemediationBoard` are intentie buna: task-uri, grupare pe rapid/structural, empty state clar
- problema este ca header-ul board-ului concureaza cu zona de sus a paginii
- pentru `ALL`, gruparea dubla `Remedieri rapide` / `Remedieri structurale` e buna semantic, dar mai adauga inca un strat vizual inainte de task-uri

Verdict pe board:

- structura este sanatoasa
- densitatea de intrare este inca mare

### Filtre

- filtrarea actuala este utila si simpla in cod
- vizual, cele 7 butoane (`Deschise`, `Rapide`, `Structurale`, `P1`, `P2`, `P3`, `Inchise`) formeaza o bara destul de zgomotoasa
- filtrele de tip, prioritate si status au aceeasi greutate vizuala, desi nu au acelasi rol mental

Verdict pe filtre:

- nu trebuie schimbata logica
- trebuie doar clarificata ierarhia si compactarea

### Handoff

- handoff-ul spre `Auditor Vault` si `Audit si export` este corect doctrinar
- problema este ca pagina explica de doua ori acelasi lucru:
  - in `PageIntro`
  - in `HandoffCard`
- pentru o pagina de executie, handoff-ul este corect, dar trebuie sa stea mai mult ca iesire din munca, nu ca bloc concurent cu inceputul board-ului

Verdict pe handoff:

- bun conceptual
- prea prezent prea devreme in pagina

### Task Card

`TaskCard` este cea mai densa piesa a paginii.

Puncte bune:

- are tot contextul necesar pentru validare umana
- separa `motivare`, `plan de remediere`, `dovada si verificare`
- face clar ce inseamna dovada atasata si validarea curenta

Puncte grele:

- prea multe badge-uri, stari si metadate sunt vizibile simultan
- cardul concureaza intre:
  - context legal
  - trigger
  - ready text
  - plan de remediere
  - pasi imediati
  - dovada
  - validare
  - actiuni
- CTA-ul principal `Valideaza si rescaneaza` este corect, dar se lupta vizual cu selectul de tip dovada, butonul de upload si `Export task`

Verdict pe task card:

- este informativ si defensibil
- dar este prea greu pentru scanare rapida si triere operationala

## 3. Ce ar fi un val scurt sanatos

Fara redesign mare si fara schimbare de logic, un val scurt sanatos ar fi:

1. Compactarea zonei de deasupra board-ului
- se pastreaza `PageIntro`
- se scurteaza `SummaryStrip`
- se reduce `Flow canonic` la un suport mai compact sau mai putin dominant

2. Simplificarea intrarii in `RemediationBoard`
- se pastreaza board-ul unic
- header-ul devine mai scurt
- gruparea `rapid / structural` ramane, dar cu mai putin preambul

3. Clarificarea ierarhiei filtrelor
- aceeasi logica
- dar cu separare vizuala intre:
  - status
  - tip de remediere
  - prioritate

4. Progressive disclosure mai bun in `TaskCard`
- sus ramane doar ce ajuta trierea rapida:
  - titlu
  - prioritate
  - severitate
  - owner
  - termen
  - urmatoarea actiune
- `context si motivare` si partea mai grea de verificare pot fi compactate vizual

5. Un cluster de actiune mai clar in `TaskCard`
- `Valideaza si rescaneaza` ramane actiunea primara
- dovada ramane actiunea secundara imediata
- `Export task` trebuie sa fie clar tertiar, nu concurent cu executia

## 4. Ce NU trebuie atins in acel val

- logica de filtrare
- wiring-ul `onMarkDone`, `onAttachEvidence`, `onExport`
- modelul de task, dovada sau validare
- routing-ul spre `Audit si export` si `Auditor Vault`
- `app/api/*`
- `lib/*`
- orice redesign mare pe `Dovada`
- mutarea de responsabilitate intre `Remediere`, `Audit si export` si `Auditor Vault`

## 5. Verdict

`Da`, merita sa fie urmatorul val, dar doar ca val scurt de densitate si ierarhie, nu ca redesign.

Motive:

- intentia dominanta este deja corecta, deci nu cerem schimbare de concept
- castigul vine din compactare si claritate, nu din rescriere
- este exact tipul de pagina unde 3-5 ajustari mici pot creste mult viteza de intelegere si executie
- ramane compatibila cu doctrina:
  - o pagina = o intentie dominanta
  - `summary / detail / action` separate
  - tabs locale, nu shortcut-uri concurente
  - omul valideaza
