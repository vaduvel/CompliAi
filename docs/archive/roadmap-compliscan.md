# CompliScan - Product Roadmap

Acest roadmap defineste cum ducem CompliScan in fata competitiei fara sa-l transformam intr-o platforma greoaie.

Nota:

- roadmap-ul de produs ramane valabil
- sprinturile de maturizare tehnica si operationala sunt urmarite separat in `public/sprinturi-maturizare-compliscan.md`
- evaluarea riguroasa a stadiului actual este in `public/raport-maturitate-compliscan.md`
- ideile parcate sau filtrate din `feedback.md` sunt tinute separat in `public/backlog-din-feedback.md`

## North Star

CompliScan trebuie sa fie:

**platforma de compliance operational pentru documente si sisteme AI: detectezi risc, primesti pasi de remediere, pastrezi dovada**

Nu vrem sa castigam prin:

- mai multe module
- mai mult jargon enterprise
- mai multa birocratie

Vrem sa castigam prin:

- claritate
- remediere concreta
- dovada pregatita pentru audit
- onboarding simplu
- utilitate zilnica pentru SMB / mid-market

## ICP

Publicul principal:

- SMB / mid-market
- companii care au:
  - website si politici
  - contracte si documente interne
  - cateva fluxuri AI
  - nevoie de audit trail simplu
  - fara echipa legala mare

## Flux principal de produs

Tot produsul trebuie sa sustina acelasi flux:

1. Adaugi sursa
2. Primesti verdict
3. Primesti pasii de remediere
4. Exportezi dovada

Tot ce este:

- inventar AI
- drift
- baseline
- export avansat
- checklist

trebuie sa fie subordonat acestui flux.

## Avantajul strategic fata de competitie

### 1. Pre-filling, nu template gol

Competitia da un sablon si cere utilizatorului sa-l completeze.

CompliScan trebuie sa faca invers:

- scaneaza documentul sau manifestul
- extrage ce poate
- pre-completeaza campurile importante
- cere doar confirmare si corectii

Exemplu:

- detecteaza providerul, modelul, scopul probabil si riscul sugerat
- pre-completeaza un AI Compliance Pack
- utilizatorul confirma, nu porneste de la zero

### 2. Way out, nu doar detection

Fiecare problema importanta trebuie sa raspunda la:

- ce s-a detectat
- de ce e problema
- ce articol sau regula e afectata
- ce trebuie schimbat
- cine trebuie sa intervina
- ce dovada trebuie pastrata
- cand trebuie rescannat

### 3. Auditor Vault

Nu vrem doar jurnal de evenimente.

Vrem un loc unde dovezile sunt legate clar de:

- articole de lege
- snapshot-uri
- remedieri
- schimbari de configuratie

Astfel userul poate exporta o dovada reala de audit, nu doar un PDF generic.

### 4. Drift trebuie sa aduca userul inapoi in produs

Drift-ul nu este un feature secundar.

Drift-ul trebuie sa fie:

- vizibil in dashboard
- usor de inteles
- legat direct de impact
- legat direct de remediere

## Ce nu facem acum

- benchmark engine
- CLI-first
- 15 tipuri de scoring
- automatizari greu explicabile
- framework legal academic
- integrari cu tot internetul
- proces complet de CE / notified body / bureaucracy suite

## Filtru strategic din feedback

Din ultima runda de analiza a `feedback.md`, pastram clar doar aceste directii:

- `continuous governance` ca north star
- `compliscan.yaml + repo sync + drift + evidence + audit` ca diferentiere reala
- `e-Factura` ca wedge local ulterior, nu ca pivot imediat

Nu mutam in roadmap-ul activ, pana dupa sprinturile de maturizare:

- Policy Engine separat
- Event-driven core / realtime bus
- agentic loop light
- mapping multi-reg extins

## Roadmap pe sprinturi

## Sprint 1 - Claritate produs si navigatie

### Obiectiv

Simplificam produsul si il facem usor de inteles in 30 de secunde.

### Livrabile

- mesaj principal unificat in toata aplicatia
- ICP clar asumat
- dashboard care raspunde la:
  - ce vad
  - ce fac acum
  - ce urmeaza
- navigatie simplificata in jurul celor 3 piloni:
  - Scanare
  - Control
  - Dovada
- drift vizibil in dashboard, nu ascuns
- copy mai simplu, mai putin "platform language"

### Decizii de produs

- alegem pozitionarea oficiala
- alegem ce ramane in nav
- ascundem sau reducem conceptele care concureaza intre ele

### KPI

- userul intelege fluxul principal fara explicatii
- dashboard-ul se citeste in 5 secunde

## Sprint 2 - Remediation engine + legal mapping

### Obiectiv

CompliScan devine util prin "ce faci concret", nu doar prin "ce ai detectat".

### Livrabile

- findings standardizate
- remediation standardizata
- legal mapping pentru problemele principale
- output care arata:
  - articol afectat
  - problema
  - text recomandat
  - owner recomandat
  - dovada ceruta
  - momentul de rescan

### Exemple de output dorit

- "Schimba acest text pentru a respecta Art. 13 GDPR"
- "Pastreaza screenshot-ul bannerului nou ca dovada"
- "Rescaneaza dupa publicarea noii politici"

### KPI

- userul poate actiona fara sa intrebe un consultant pentru fiecare finding

## Sprint 3 - Control real: compliscan.yaml + baseline + drift

### Obiectiv

Introducem o sursa clara de adevar pentru sistemele AI si conectam drift-ul la schimbari reale.

### Livrabile

- suport pentru `compliscan.yaml`
- parser si validare pentru `compliscan.yaml`
- comparatie cu baseline validat
- drift pe campuri-cheie:
  - provider
  - model
  - risk_class
  - personal_data_processed
  - human_oversight.required
  - data_residency
- UI clar pentru:
  - ce s-a schimbat
  - de ce conteaza
  - ce faci acum

### KPI

- drift-ul este usor de inteles
- userul vede imediat daca schimbarea are impact real

## Sprint 4 - Pre-filling si AI Compliance Pack

### Obiectiv

Eliminam frica paginii goale si automatizam partea obositoare.

### Livrabile

- pre-filling pentru sisteme AI pe baza documentelor si manifestelor
- AI Compliance Pack generat automat cu:
  - sistem
  - scop
  - provider / model
  - date folosite
  - risk class sugerat
  - human oversight
  - findings
  - dovezi
- userul confirma si editeaza, nu scrie de la zero

### KPI

- scade timpul de completare manuala
- creste rata de confirmare a inventarului

## Sprint 5 - Auditor Vault

### Obiectiv

Transformam jurnalul si dovezile intr-un output defensibil la audit.

### Livrabile

- pagina dedicata de audit-ready evidence
- timeline cu:
  - scanari
  - snapshot-uri
  - drift
  - remedieri
  - dovezi incarcate
- legare evidenta intre:
  - finding
  - articol de lege
  - task
  - dovada
  - export

### KPI

- userul poate genera un audit pack coerent, nu doar un export brut

## Sprint 6 - Integrari controlate, nu haotice

### Obiectiv

Adaugam integrari doar acolo unde aduc control real.

### Livrabile

- GitHub / GitLab webhook pentru fisiere relevante
- upload simplu si clar pentru manifest
- comparatie automata intre snapshot nou si baseline

### Regula

Nu adaugam integrari care cresc complexitatea UI fara sa creasca valoarea.

## Structura finala recomandata a produsului

### 1. Scanare

- document
- text
- manifest / repo

### 2. Control

- inventar AI
- baseline
- drift
- alerte

### 3. Dovada

- remediation
- export
- jurnal
- snapshot
- auditor vault

## Ordinea corecta de executie

1. Claritate produs
2. Remediation + legal mapping
3. compliscan.yaml + baseline + drift
4. Pre-filling
5. Auditor Vault
6. Repo integrations controlate

## Ordinea corecta de consolidare acum

1. `AI Compliance Pack` și mai fin pe controale / familii
2. `Audit Pack` dus spre dosar executiv extern

Nota: `drift escalation` și `family-level evidence bundle` sunt deja implementate operațional și legate de task-uri, dashboard și audit. `Drift escalation` include acum și lifecycle complet (`open / acknowledged / in_progress / resolved / waived`), SLA breach și audit trail.

## Criteriul de succes

CompliScan este peste competitie daca:

- userul intelege imediat ce poate face
- nu porneste de la zero
- primeste pasi de remediere concreti
- are dovada pregatita pentru audit
- revine in produs cand apare drift, nu doar cand vine controlul

## Rezumat executiv

Ca sa fim un pas in fata:

- nu adaugam mai multe module
- nu copiem enterprise complexity
- facem produsul mai clar, mai actionabil si mai util

Cheia este:

**pre-filling + remediation + drift clar + audit-ready evidence**
