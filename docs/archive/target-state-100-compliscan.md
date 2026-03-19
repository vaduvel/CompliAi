# CompliScan - Target state 100%

Data: 2026-03-13

## Ce inseamna "100%" pentru noi

`100%` nu inseamna produs perfect.

Inseamna:

- produs suficient de matur incat sa il punem la un client real fara sa ne fie rusine de fundatie
- siguranta suficienta incat datele, dovezile si tenant-urile sa nu stea pe improvizatii
- verdict suficient de explicabil incat sa sustina munca umana, nu sa o saboteze
- operatie suficient de curata incat produsul sa ramana in picioare saptamani si luni, nu doar in demo

Pe scurt:

**CompliScan 100% = produs pilot-ready serios, cu fundatie software, audit trail si operare matura.**

Nu inseamna:

- verdict legal autonom
- platforma enterprise la nivel OneTrust
- "nu mai ai nevoie de om"

Framing-ul ramane corect:

- aplicatia ofera suport si structura
- omul valideaza

## Cum arata produsul final, vazut de utilizator

Utilizatorul vede un produs care face foarte clar 3 lucruri:

1. **Scanare**
   - incarca document, text, manifest sau `compliscan.yaml`
   - primeste verdict, surse detectate, zone de risc si lipsuri
2. **Control**
   - vede inventarul AI, baseline-ul, drift-ul si responsabilitatile active
   - intelege rapid ce s-a schimbat si cine trebuie sa reactioneze
3. **Dovada**
   - rezolva task-uri
   - ataseaza dovezi private si controlate
   - exporta Audit Pack / Annex IV lite / dossier bundle

## Cum arata produsul final, vazut de un buyer

La final, produsul trebuie sa poata fi vandut onest astfel:

- scanezi documente si sisteme AI
- primesti risc si remediere concreta
- pastrezi dovada in mod controlat
- ramai cu audit trail si pachet exportabil

Nu trebuie sa para:

- consultant legal automat
- fiscal ERP complet
- gateway runtime universal

## Ce trebuie sa existe ca sa putem spune "gata"

## 1. Fundatie de identitate si acces

- utilizatorii stau in `Supabase Auth`
- organizatiile si rolurile stau in DB
- membership-urile sunt reale, nu deduse
- exista roluri minime consistente:
  - `owner`
  - `compliance`
  - `reviewer`
  - `viewer`
- audit trail-ul stie cine a facut fiecare actiune importanta

## 2. Tenancy si date

- fiecare organizatie este izolata prin RLS, nu doar prin UI
- `app_state` are source of truth clar in cloud
- fallback-ul local ramane doar pentru development
- exista migrare si schema gestionata explicit

## 3. Dovada privata si controlata

- dovezile nu mai stau in `public/`
- accesul se face prin:
  - signed URL
  - sau route controlat server-side
- fiecare dovada are:
  - owner implicit prin org
  - tip
  - sursa
  - timestamp
  - storage key
  - access path

## 4. Motor de analiza defensibil

- semnalul este separat de inferenta si de verdict
- confidence-ul este explicabil
- exista fixtures reale pentru cazuri grele
- exista corpus minim de documente de test
- rescan-ul explica de ce a validat sau de ce a ramas neconvingator

## 5. Audit defensibility

- `Audit Pack` este coerent pentru stakeholder non-tehnic
- `Auditor Vault` poate fi folosit ca sursa interna de control
- traceability matrix leaga:
  - finding
  - drift
  - task
  - evidence
  - control
  - articol
- family-level evidence reuse este controlat, nu arbitrar

## 6. Operational readiness

- health checks reale
- logging suficient
- error handling coerent
- retry discipline la integrari
- release checklist
- backup / restore minim
- runbook de incident

## 7. Calitate software

- test harness local real
- unit + route + integration + smoke
- build, lint si teste inainte de livrare
- cazurile critice au acoperire buna:
  - auth
  - storage
  - scan
  - export
  - drift
  - evidence

## 8. Pachet comercial minim serios

- ToS
- politica de confidentialitate
- limitare de raspundere coerenta
- DPA minim
- explicatie clara ca verdictul cere validare umana

## Ce nu trebuie sa construim ca sa spunem "gata"

- 20 de module noi
- AI guardrails runtime overbuilt
- cross-border engine complet
- digital twin
- black box notarial
- marketing theatre enterprise

Produsul final nu castiga prin latime.

Castiga prin:

- claritate
- control
- dovada
- incredere operationala

## Scoruri tinta dupa inchiderea celor 7 sprinturi

- produs si model de domeniu: `8.5 / 10`
- UX operational: `7.8 - 8 / 10`
- motor de analiza: `6.8 - 7.2 / 10`
- persistence / tenancy / storage: `8 / 10`
- auth / securitate operationala: `7.5 - 8 / 10`
- testare / quality gates: `7 - 7.5 / 10`
- audit defensibility: `7.5 / 10`
- operational readiness: `7 / 10`

## Verdict final dupa cele 7 sprinturi

Daca inchidem bine sprinturile 1-7, CompliScan ajunge la:

- `~85%` maturitate ca produs pilot-ready cu valoare reala
- `~75%` maturitate ca platforma software serioasa pentru SMB / mid-market
- `~68-72%` maturitate ca motor de compliance defensibil

Nu ajunge inca la:

- standard enterprise heavyweight
- verdict legal automat suficient singur
- "gata pentru orice client, orice industrie, orice audit"

## Ce ramane deschis si dupa cele 7 sprinturi

- evaluare pe corpus mare de documente reale
- feedback loop din clienti reali
- observability de productie mai adanca
- browser e2e mai serios
- control de cost la scara
- validare externa / review legal mai puternic

## Regula de lucru

Nu urmarim "100%" ca mit de perfectiune.

Urmarim:

- produs serios
- sigur
- vandabil onest
- greu de facut praf tehnic si operational
