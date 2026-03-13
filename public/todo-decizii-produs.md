# CompliScan - TODO decizii produs

Acest document este pentru deciziile de produs care trebuie luate ca sa nu transformam CompliScan intr-o platforma prea incarcata si greu de inteles.

## Directia recomandata

Pozitionare recomandata:

**CompliScan = platforma de compliance operational pentru documente si sisteme AI: detectezi risc, primesti pasi de remediere, pastrezi dovada.**

Principiul de baza:

- mai putine concepte
- mai multa claritate
- mai multa remediere
- mai putin limbaj de platforma
- mai mult "ce faci azi, concret"

## 1. Decizii de luat acum

### 1.1 Promisiunea principala

- [ ] Confirmam mesajul principal al produsului
- [ ] Renuntam la pozitionari prea largi de tip "AI governance platform", "GRC platform", "enterprise legal suite"
- [ ] Folosim consecvent mesajul:
  - `iei un document sau un sistem AI`
  - `primesti risc`
  - `primesti ce ai de facut`
  - `exporti dovada`

Recomandare:

- Da, asta trebuie adoptat ca mesaj oficial.

### 1.2 ICP clar

- [ ] Confirmam ICP principal

Recomandare:

- SMB / mid-market
- companii care au:
  - website / politici / contracte
  - cateva fluxuri AI
  - nevoie de audit trail simplu
  - fara echipa legala mare

Decizie de evitat:

- sa incercam sa fim simultan tool legal, ML, security, devops si GRC enterprise

### 1.3 Fluxul principal unic

- [ ] Confirmam fluxul principal al produsului

Flux recomandat:

1. Adaugi sursa
2. Primesti verdict
3. Primesti pasii de remediere
4. Exportezi dovada

Tot restul trebuie sa sustina acest flux, nu sa concureze cu el.

## 2. Decizii de arhitectura produs

### 2.1 Ce pastram ca piloni

- [ ] Confirmam cei 3 piloni mari ai produsului

Structura recomandata:

- `Scanare`
  - document
  - text
  - manifest / repo

- `Control`
  - inventar AI
  - baseline
  - drift
  - alerte

- `Dovada`
  - remediation
  - export
  - jurnal
  - snapshot

### 2.2 Ce scoatem din competitie vizuala

- [ ] Nu mai lasam inventar, drift, export, checklist si scanare sa para produse separate
- [ ] Le subordonam fluxului principal
- [ ] Dashboard-ul trebuie sa orienteze, nu sa execute tot

### 2.3 Ce ascundem sau amanam

- [ ] amanam benchmark engine
- [ ] amanam CLI-first
- [ ] amanam scoring foarte complex
- [ ] amanam automatizari greu explicabile
- [ ] amanam framework legal prea academic
- [ ] amanam integrari foarte multe simultan

## 3. Decizii de UI / UX

### 3.1 Regula de claritate pe fiecare pagina

- [ ] Fiecare pagina trebuie sa raspunda instant la:
  - ce vad
  - ce fac acum
  - ce se intampla dupa

### 3.2 Navigatia

- [ ] Verificam daca navigatia curenta este prea fragmentata
- [ ] Decidem ce ramane in nav principal si ce trece in view-uri secundare

Recomandare:

- nav-ul trebuie sa reflecte cei 3 piloni principali, nu toate conceptele interne

### 3.3 Output-ul trebuie sa fie actionabil

- [ ] Fiecare finding important trebuie sa spuna:
  - de ce e problema
  - ce text trebuie schimbat
  - cine trebuie sa intervina
  - ce dovada trebuie pastrata
  - ce urmeaza dupa remediere
  - cand trebuie rescannat

## 4. Unde vrem sa fim peste competitie

- [ ] UX mai clar
- [ ] output mai actionabil
- [ ] remediation mai concreta
- [ ] onboarding mai simplu
- [ ] document-first + AI-system-first in acelasi produs
- [ ] valoare mai clara pentru companii mici si medii

Important:

- nu vrem sa fim peste competitie prin mai multe module
- vrem sa fim peste competitie prin claritate si utilitate

## 5. Decizii tehnice care sustin strategia

- [ ] introducem `compliscan.yaml` / `compliscan.json` ca sursa de adevar pentru sisteme AI
- [ ] conectam drift-ul la surse reale si baseline validat
- [ ] pastram review uman pentru sistemele detectate automat
- [ ] tratam documentele, manifestele si sistemele AI ca surse diferite, nu ca acelasi lucru

## 6. TODO de executie dupa ce luam decizia

### Sprint 1 - claritate produs

- [ ] finalizam mesajul principal al produsului
- [ ] alegem ICP oficial
- [ ] simplificam navigatia in jurul celor 3 piloni
- [ ] alinăm textele din app cu noua promisiune
- [ ] verificam fiecare pagina prin regula:
  - ce vad
  - ce fac acum
  - ce se intampla dupa

### Sprint 2 - way out, nu doar detection

- [ ] standardizam output-ul de remediere
- [ ] adaugam recomandari mai concrete
- [ ] adaugam dovada ceruta pentru fiecare task
- [ ] adaugam pasul de rescan dupa remediere

### Sprint 3 - control real

- [ ] suport pentru `compliscan.yaml`
- [ ] comparatie cu baseline validat
- [ ] drift mai clar pe schimbari reale
- [ ] pregatire pentru integrari repo, fara sa incarcam UI-ul

## 7. Decizia recomandata acum

Decizia recomandata:

- pastram produsul simplu
- il organizam in jurul fluxului principal
- il pozitionam pentru SMB / mid-market
- investim mai mult in remediation si dovada decat in module noi

## 8. Rezumat executiv

Ca sa nu crestem haotic produsul, trebuie sa decidem acum:

- cine este userul principal
- ce promitem clar
- care este fluxul principal
- ce ramane vizibil in produs
- ce amanam intentionat

Scopul nu este sa facem mai mult decat ceilalti.

Scopul este sa facem mai clar, mai utilizabil si mai actionabil.
