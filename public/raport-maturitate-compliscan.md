# CompliScan - Raport de maturitate

Data: 2026-03-13

## Verdict executiv

CompliScan este astazi un:

- produs pilot-ready in formare serioasa
- pre-beta operationala cu fundatie mult mai buna decat la inceputul sprinturilor
- Evidence OS coerent, dar inca in maturizare

CompliScan nu este inca:

- produs matur de productie
- platforma SaaS complet hardenuita
- motor de analiza compliance suficient de defensibil pentru autonomie mare fara review uman
- pachet comercial si operational complet pentru clienti mari fara ghidaj apropiat

Concluzia riguroasa este:

- maturitate ca produs pilot-ready vandabil cu ghidaj uman: `~79%`
- maturitate ca platforma software serioasa: `~64%`
- maturitate ca motor de compliance / audit defensibil: `~61%`

Ce s-a schimbat real fata de verdictul initial:

- `Sprint 4` a inchis operational auth-ul minim, rolurile, membership-urile si audit trail-ul cu actor real
- `Sprint 5` a inchis operational fundatia cloud-first:
  - `Supabase Auth` incremental
  - tenancy cloud
  - `org_state` cloud-first
  - evidence privat
  - signed access
  - `RLS` verificat live
- `Sprint 6` a ridicat defensibilitatea auditului:
  - evidence quality
  - audit quality gates
  - `auditDecision`
  - `auditGateCodes`
  - blocare a confirmarii la audit cand controlul nu este cu adevarat curat

Ce NU s-a schimbat suficient:

- motorul de analiza ramane inca prea dependent de euristici si `simulateFindings(...)`
- calitatea dovezii este acum clasificata, dar nu este inca validata pe corpus mare si nici pe fluxuri reale de productie
- readiness-ul de productie ramane sub nivelul unui produs “lasat singur” la clienti mari

## Scor pe zone

### 1. Produs si model de domeniu: `8.1 / 10`

Puncte tari:

- flow-ul principal este bun: `sursa -> verdict -> remediere -> dovada -> audit`
- modelul comun `AI Compliance Pack` este deja valoros
- `drift`, `baseline`, `Auditor Vault`, `Audit Pack` si `Annex IV lite` exista in aceeasi poveste
- triada `Scanare / Control / Dovada` este acum stabila si nu mai pare o improvizatie de MVP
- traceability-ul leaga mai bine:
  - findings
  - drift
  - task-uri
  - dovezi
  - controale
  - articole

Limitari:

- output-ul de produs este in continuare mai matur decat motorul de analiza de sub el
- exista deja mult produs real, dar unele zone raman inca dependente de discipline interne si nu numai de constrangeri tari de sistem

### 2. UX operational pe fluxul principal: `7.3 / 10`

Puncte tari:

- fluxul `Scanare / Control / Dovada` este clar
- `Scanari`, `Sisteme`, `Audit si dovezi` si `Audit si export` sunt deja lizibile
- exista next best action si task-uri derivate din findings si drift
- `Auditor Vault` si exporturile spun acum mai corect cand ceva este gata, in review sau blocat

Limitari:

- unele suprafete sunt inca dense pentru un user nou
- exista inca suprafete care se bazeaza pe intelegerea interna a produsului, nu doar pe affordance clar
- `Evidence OS UI` este inca pe fir separat si nu trebuie confundat cu cockpit-ul principal deja maturizat

### 3. Motor de analiza si acuratete: `6.2 / 10`

Puncte tari:

- OCR-ul este real prin Google Vision
- rule library si legal mapping exista
- repo sync si `compliscan.yaml` produc semnale reale si actionabile
- exista acum separare intre:
  - semnal detectat
  - inferenta
  - verdict
- finding-urile si rescan-ul au acum confidence si basis explicabile
- exista fixtures mai grele pentru cazuri high-risk si transfer de date

Limitari critice:

- analiza documentelor foloseste inca `simulateFindings(...)` si matching euristic
- nu exista inca o suita serioasa de evaluare a acuratetii pe corpuri de documente reale de productie
- nu exista inca validare externa sau revizie legala structurata a motorului
- motorul e mai explicabil, dar nu inca suficient de greu de contestat

Verdict:

motorul de scanare este util si demonstrabil, dar nu este inca un motor matur de compliance intelligence.

### 4. Persistenta, date si tenancy: `7.4 / 10`

Puncte tari:

- exista persistenta per org
- `org_state` are acum traseu cloud-first in backend `supabase`
- `organizations`, `memberships`, `profiles` si `evidence_objects` exista in Supabase si sunt verificate live
- `RLS` a fost verificat live pe tenancy si evidence
- exista snapshot history si baseline
- fallback-ul local poate fi facut explicit strict sau permisiv, nu mai este doar implicit

Limitari:

- fallback-ul pe `.data/state-<org>.json` ramane util pentru development, dar trebuie retras si mai clar din orice mediu apropiat de productie
- cache-ul in-memory per org simplifica fluxul, dar nu rezolva complet concurenta, lock-urile si scenariile multi-instance
- schema cloud este acum reala, dar operarea, migratiile si recuperarea raman inca sub nivelul unui produs matur

### 5. Auth si securitate operationala: `6.8 / 10`

Puncte tari:

- exista login/register/logout functional
- exista cookie de sesiune semnat
- exista roluri reale:
  - `owner`
  - `compliance`
  - `reviewer`
  - `viewer`
- exista membership multi-org si schimbare de organizatie activa
- actiunile sensibile au acum control de rol si actor real in audit trail
- `Supabase Auth` poate fi folosit incremental, fara sa rupa complet fluxurile locale

Limitari critice:

- modelul local legacy inca exista si nu este inca complet retras din zona de runtime
- sesiunea este inca semnata in logica aplicatiei noastre, nu este inca mutata complet pe modelul final de identitate
- nu exista inca lifecycle complet pentru invitare / recovery / administrare membri la nivel de produs matur
- lipseste inca hardening-ul de acces mai adanc:
  - rate limiting
  - semnale de abuz
  - operare incidentala

### 6. Integrari externe: `5.4 / 10`

Puncte tari:

- Google Vision este real
- Supabase REST este real
- repo sync generic + GitHub + GitLab exista
- exista keepalive, status si preflight pentru Supabase

Limitari:

- e-Factura sync este inca demo
- assistant-ul are fallback local simplu
- nu exista pipeline operational stabil pentru integrari sensibile sau pentru retries / dead-letter / health standardizat
- integrarea cu Supabase este acum mult mai buna, dar inca nu inseamna observabilitate si operare mature

### 7. Testare automata si quality gates: `7.2 / 10`

Puncte tari:

- `lint` trece
- `build` trece
- a existat QA manual si dry run
- exista acum suita minima reala:
  - unit tests
  - route tests
  - smoke flow
  - fixtures pentru documente, OCR fallback, manifests si `compliscan.yaml`
- fixtures pentru expected findings, high-risk, transfer de date si cazuri de audit blocked/review/pass
- suita curenta are `60` fisiere de test si `213` teste verzi

Limitari critice:

- nu exista inca e2e browser real
- nu exista contract tests pentru API
- nu exista inca acoperire suficienta pe scenarii de productie:
  - recovery
  - retry
  - incident
  - browser e2e
- nu exista inca corp de evaluare pe documente reale pentru acuratete

Verdict:

asta a crescut mult si a iesit din zona de risc major, dar nu este inca la nivelul unui release train matur.

### 8. Audit defensibility: `7.0 / 10`

Puncte tari:

- evidence quality exista acum explicit:
  - `strong`
  - `adequate`
  - `weak`
- `Audit Pack` are quality gates reale
- `Auditor Vault` blocheaza confirmarea pentru audit cand un control nu este cu adevarat curat
- family reuse nu mai merge lejer pe dovezi slabe sau pe controale nevalidate
- `auditDecision` si `auditGateCodes` reduc mult riscul de confirmare falsa

Limitari critice:

- calitatea dovezii este inca evaluata euristic, nu validata extern
- exista inca risc de supraincredere daca un operator citeste doar sumarul si nu contextul
- defensibilitatea juridica ramane dependenta de validarea umana si de calitatea datelor introduse

### 9. Production readiness total: `6.4 / 10`

Puncte tari:

- produsul poate fi aratat, demo-uit si pilotat controlat
- are deja output suficient de bogat pentru review intern si demo cu clienti
- fundatia cloud-first si audit trail-ul sunt semnificativ mai bune decat la inceputul sprinturilor

Limitari critice:

- observabilitatea, incident response si release discipline sunt inca sub nivelul unui produs lasat sa ruleze luni intregi fara suport apropiat
- motorul de analiza nu este suficient de defensibil
- lipsesc inca:
  - browser e2e
  - backup / restore bine documentat
  - incident runbooks complete
  - monitorizare operationala suficient de adanca

## Ce este deja matur sau aproape matur

- arhitectura de produs si modelul principal de lucru
- `AI Compliance Pack` ca unificare a surselor
- `drift -> task -> evidence -> audit`
- `Auditor Vault` si `Audit Pack` ca directie de produs
- `compliscan.yaml` + repo sync ca directie de control real
- UX-ul principal de cockpit si flow-ul pe 3 piloni
- test harness-ul minim pentru fluxurile critice
- fundatia cloud-first pentru:
  - tenancy
  - `org_state`
  - evidence privat
  - `RLS`
- controlul de rol si actorul real in audit trail
- traseul de audit care separa acum:
  - `validated`
  - `review`
  - `blocked`

## Ce este semimatur

- motorul de analiza
- integrarea cu Supabase Auth in regim final
- observabilitatea operationala
- exporturile si dosarul executiv
- family-level evidence bundle
- verdictul explicabil si rescan-ul explicabil
- evaluarea calitatii dovezii
- traseul Agent OS, care exista, dar nu trebuie confundat cu runtime-ul principal deja stabil

## Ce este inca MVP / demo / insuficient de hardenuit

- analiza documentelor pe baza de euristici
- validarea automata a remediilor in cazuri mai grele
- e-Factura sync real
- observabilitatea si operational readiness de productie
- migrarea finala completa de la fallback-urile locale
- pachetul comercial / juridic minim de productie

## Ce ne lipseste ca sa putem spune "produs matur"

### 1. Hardening de platforma

- validare stricta pe request-uri critice
- allowlist de fisiere si MIME pentru dovezi
- storage mai sigur pentru dovezi
- eliminarea fallback-urilor periculoase in productie
- erori standardizate, logging si audit tehnic mai bun
- monitorizare operationala si incident handling mai serioase

### 2. Testare automata reala

- browser e2e pentru fluxurile critice
- contract tests pentru API
- mai multa acoperire pe recovery / retries / incident paths
- corpus mai bun de documente reale pentru acuratete

### 3. Motor de analiza mai defensibil

- separare clara intre semnal detectat, inferenta si verdict
- confidence scoring mai puternic pe findings
- corp de teste pe documente reale
- validare mai buna a rescan-ului si a dovezii de inchidere
- mai putina dependenta operationala de `simulateFindings(...)`

### 4. Auth, org model si acces

- finalizarea mutarii identitatii in backend-ul final
- retragerea mai clara a modelelor locale legacy din runtime-ul serios
- lifecycle complet pentru membership:
  - invitare
  - recovery
  - administrare
  - dezactivare

### 5. Data layer si operational readiness

- schema gestionata explicit
- migratii clare
- storage operational stabil
- politici de backup / restore
- rate limiting, timeouts si retry discipline
- release / incident / rollback runbooks

### 6. Evidence hardening

- validarea mai buna a calitatii dovezii
- legaturi si mai tari intre:
  - dovada
  - control
  - audit decision
  - export
- migratia completa a dovezilor vechi care mai au model legacy

## Ce putem sustine onest astazi

Putem sustine:

- demo serios
- pilot controlat
- valoare reala pe remediere si audit prep
- utilitate buna pentru documente, manifests si `compliscan.yaml`
- verdict mai explicabil decat la inceputul proiectului
- fundatie cloud-first suficient de serioasa pentru pilot
- refactoruri mai sigure datorita suitei de test existente

Nu putem sustine inca:

- autonomie mare fara review uman
- readiness enterprise complet
- platforma production-grade hardenuita
- "certification-like" confidence
- motor juridic greu de contestat fara validare externa
- produs lasat singur in productie fara disciplina operationala apropiata

## Decizia corecta de produs

In acest moment nu trebuie sa alergam dupa si mai multe features.

Trebuie sa inchidem:

1. hardening
2. testare
3. analiza mai defensibila
4. operational readiness si pachet comercial/juridic minim serios

Abia dupa acest strat are sens sa impingem puternic partea de ambalaj comercial.

## Urmatorul prag de maturitate

Daca inchidem sprinturile de maturizare definite in `public/sprinturi-maturizare-compliscan.md`, putem muta produsul realist in zona:

- `~84-86%` maturitate de produs pilot-ready serios
- `~72-75%` maturitate de platforma software serioasa
- `~68-72%` maturitate de motor de compliance / audit defensibil

Acela este primul prag pe care l-as numi "produs cu barba".
