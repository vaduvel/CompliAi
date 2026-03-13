# CompliScan - Raport de maturitate

Data: 2026-03-13

## Verdict executiv

CompliScan este astazi un:

- MVP avansat
- pre-beta operationala serioasa
- Evidence OS in constructie

CompliScan nu este inca:

- produs matur de productie
- platforma SaaS hardenuita
- motor de analiza compliance suficient de defensibil pentru autonomie mare fara review uman

Concluzia riguroasa este:

- maturitate ca produs MVP vandabil cu ghidaj uman: `~68%`
- maturitate ca platforma software cu standard de produs matur: `~50%`

## Scor pe zone

### 1. Produs si model de domeniu: `7.5 / 10`

Puncte tari:

- flow-ul principal este bun: `sursa -> verdict -> remediere -> dovada -> audit`
- modelul comun `AI Compliance Pack` este deja valoros
- `drift`, `baseline`, `Auditor Vault`, `Audit Pack` si `Annex IV lite` exista in aceeasi poveste

Limitari:

- unele zone arata mature in UI, dar sunt sustinute de infrastructura inca minimala
- output-ul de produs este mai matur decat fundatia operationala de sub el

### 2. UX operational pe fluxul principal: `7 / 10`

Puncte tari:

- fluxul `Scanare / Control / Dovada` este clar
- `Scanari`, `Sisteme`, `Audit si dovezi` si `Audit si export` sunt deja lizibile
- exista next best action si task-uri derivate din findings si drift

Limitari:

- unele suprafete sunt inca dense pentru un user nou
- exista inca suprafete care se bazeaza pe intelegerea interna a produsului, nu doar pe affordance clar

### 3. Motor de analiza si acuratete: `5.5 / 10`

Puncte tari:

- OCR-ul este real prin Google Vision
- rule library si legal mapping exista
- repo sync si `compliscan.yaml` produc semnale reale si actionabile

Limitari critice:

- analiza documentelor foloseste inca `simulateFindings(...)` si matching euristic
- exista acum separare intre semnal detectat, inferenta si verdict, plus `verdictConfidence`, dar motorul ramas in jurul `simulateFindings(...)` este inca central
- nu exista suita de evaluare a acuratetii pe corpuri de documente reale

Verdict:

motorul de scanare este util si demonstrabil, dar nu este inca un motor matur de compliance intelligence.

### 4. Persistenta, date si tenancy: `5.5 / 10`

Puncte tari:

- exista persistenta per org
- exista fallback pe Supabase REST
- exista snapshot history si baseline

Limitari:

- fallback-ul pe `.data/state-<org>.json` este bun pentru MVP, nu pentru produs matur
- cache-ul in-memory per org simplifica fluxul, dar nu rezolva robust distributia, concurenta sau lock-urile
- exista doar un strat minimal de schema SQL si nu exista o poveste completa de migratii si operare

### 5. Auth si securitate operationala: `4 / 10`

Puncte tari:

- exista login/register/logout functional
- exista cookie de sesiune semnat

Limitari critice:

- userii sunt persistati in `.data/users.json`
- exista secret de dezvoltare implicit daca env-ul nu este setat
- nu exista RBAC real
- nu exista membership model serios pe org
- nu exista hardening pe permisiuni, audit de acces si separare operator / auditor / owner

### 6. Integrari externe: `4.5 / 10`

Puncte tari:

- Google Vision este real
- Supabase REST este real
- repo sync generic + GitHub + GitLab exista

Limitari:

- e-Factura sync este inca demo
- assistant-ul are fallback local simplu
- nu exista pipeline operational stabil pentru integrari sensibile sau pentru retries / dead-letter / health standardizat

### 7. Testare automata si quality gates: `5 / 10`

Puncte tari:

- `lint` trece
- `build` trece
- a existat QA manual si dry run
- exista acum suita minima reala:
  - unit tests
  - route tests
  - smoke flow
  - fixtures pentru documente, OCR fallback, manifests si `compliscan.yaml`
- suita curenta are `29` fisiere de test si `94` teste verzi

Limitari critice:

- nu exista inca e2e browser real
- nu exista contract tests pentru API
- nu exista inca acoperire suficienta pe cazurile limita de auth / RBAC / persistence
- nu exista inca corp de evaluare pe documente reale pentru acuratete

Verdict:

asta este una dintre cele mai mari frane in drumul spre produs matur.

### 8. Production readiness total: `5 / 10`

Puncte tari:

- produsul poate fi aratat, demo-uit si pilotat controlat
- are deja output suficient de bogat pentru review intern si demo cu clienti

Limitari critice:

- securitatea nu este hardenuita
- motorul de analiza nu este suficient de defensibil
- testarea automata lipseste
- storage-ul de dovezi si accesul la ele nu sunt inca la nivel de produs matur

## Ce este deja matur sau aproape matur

- arhitectura de produs si modelul principal de lucru
- `AI Compliance Pack` ca unificare a surselor
- `drift -> task -> evidence -> audit`
- `Auditor Vault` si `Audit Pack` ca directie de produs
- `compliscan.yaml` + repo sync ca directie de control real
- UX-ul principal de cockpit si flow-ul pe 3 piloni
- test harness-ul minim pentru fluxurile critice

## Ce este semimatur

- persistenata pe org
- integrarea cu Supabase
- auth de baza
- evidenta operationala
- exporturile si dosarul executiv
- family-level evidence bundle
- verdictul explicabil si rescan-ul explicabil

## Ce este inca MVP / demo / insuficient de hardenuit

- analiza documentelor pe baza de euristici
- validarea automata a remediilor in cazuri mai grele
- e-Factura sync real
- securitatea upload-urilor si a fisierelor de dovada
- autentificarea, autorizarea si modelul de roluri
- testarea automata
- observabilitatea si operational readiness

## Ce ne lipseste ca sa putem spune "produs matur"

### 1. Hardening de platforma

- validare stricta pe request-uri critice
- allowlist de fisiere si MIME pentru dovezi
- storage mai sigur pentru dovezi
- eliminarea fallback-urilor periculoase in productie
- erori standardizate, logging si audit tehnic mai bun

### 2. Testare automata reala

- unit tests pentru motorul de reguli
- integration tests pentru `scan`, `repo sync`, `baseline`, `drift`, `tasks`, `exports`
- e2e pentru fluxurile critice
- fixtures pentru documente, manifests si `compliscan.yaml`

### 3. Motor de analiza mai defensibil

- separare clara intre semnal detectat, inferenta si verdict
- confidence scoring mai puternic pe findings
- corp de teste pe documente reale
- validare mai buna a rescan-ului si a dovezii de inchidere

### 4. Auth, org model si acces

- users in backend real, nu doar fisier local
- membership model pe org
- roluri minime: owner / compliance / reviewer / viewer
- control pe cine poate exporta, valida, waiva, reseta sau confirma audit

### 5. Data layer si operational readiness

- schema gestionata explicit
- migatii clare
- storage operational stabil
- politici de backup / restore
- rate limiting, timeouts si retry discipline

### 6. Evidence hardening

- dovezile sa nu mai stea implicit public
- signed access sau route controlat pentru fisiere
- verificari minime de tip, dimensiune si consistenta
- jurnal clar de acces si validare a dovezii

## Ce putem sustine onest astazi

Putem sustine:

- demo serios
- pilot controlat
- valoare reala pe remediere si audit prep
- utilitate buna pentru documente, manifests si `compliscan.yaml`
- verdict mai explicabil decat la inceputul proiectului
- refactoruri mai sigure datorita suitei de test existente

Nu putem sustine inca:

- autonomie mare fara review uman
- readiness enterprise complet
- platforma production-grade hardenuita
- "certification-like" confidence

## Decizia corecta de produs

In acest moment nu trebuie sa alergam dupa si mai multe features.

Trebuie sa inchidem:

1. hardening
2. testare
3. analiza mai defensibila
4. auth / data / evidence mai mature

Abia dupa acest strat are sens sa impingem puternic partea de ambalaj comercial.

## Urmatorul prag de maturitate

Daca inchidem sprinturile de maturizare definite in `public/sprinturi-maturizare-compliscan.md`, putem muta produsul realist in zona:

- `~75%` maturitate de produs pilot-ready serios
- `~60-65%` maturitate de platforma software serioasa

Acela este primul prag pe care l-as numi "produs cu barba".
