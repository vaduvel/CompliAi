# CompliAI — IA / UX / UI Section Skeleton

Data: `2026-03-27`  
Status: `schelet de secțiuni derivat din cockpit bible + audit 1:1`  
Surse:
- [compliai_smart_resolve_cockpit_bible.md](/Users/vaduvageorge/Downloads/compliai_smart_resolve_cockpit_bible.md)
- [compliai-user-flow-1to1-runtime-audit.md](/Users/vaduvageorge/Desktop/CompliAI/docs/compliai-user-flow-1to1-runtime-audit.md)
- [compliai-master-blueprint.md](/Users/vaduvageorge/Desktop/CompliAI/docs/compliai-master-blueprint.md)

---

## 0. Ce răspunde documentul

Întrebarea este:

> putem fixa acum scheletul de IA / UX / UI pe secțiuni și abia după să refactorizăm motorul?

Răspunsul este:

`Da, dar nu uniform pe tot produsul.`

Bible-ul nou este suficient de precis pentru:
- cockpit
- mini-stepper
- validation
- success
- handoff controlat
- onboarding wizard observabil

Bible-ul NU este suficient singur pentru:
- landing
- home snapshot
- resolve queue
- dosar
- partner / portfolio
- settings
- modulele specialist ca produse de sine stătătoare

Pentru acestea, auditul 1:1 completează structura.

---

## 1. Regula de lucru de acum înainte

Mai întâi fixăm:
- rolul secțiunii
- intenția dominantă
- ordinea de citire
- ordinea de acțiune
- ce rămâne primar
- ce coboară secundar

Abia după aceea refactorizăm:
- motorul
- wiring-ul
- state machine-ul
- handoff-urile

---

## 2. Verdict pe precizia bible-ului

| Zonă | Bible suficient de precis? | Observație |
|---|---|---|
| Cockpit overall | `DA` | definește modelul final clar |
| Header cockpit | `DA` | intenție, conținut, anti-patterns |
| Mini-stepper | `DA` | etichete, comportament, triggeri |
| Bloc dominant `Acum faci asta` | `DA` | foarte clar |
| Modul de execuție | `DA` | pe cele 4 familii |
| Bloc de validare | `DA` | clar și obligatoriu |
| Success strip | `DA` | clar |
| Persisted vs UI states | `DA` | suficient pentru arhitectură |
| Handoff controlat | `DA` | reguli clare |
| Onboarding wizard | `DA` | clar pe pași și observabilitate |
| Landing | `NU` | bible-ul nu-l definește |
| Login/Register | `NU` | bible-ul nu intră în detaliu |
| Home snapshot | `NU` | bible-ul nu definește structura paginii |
| Resolve queue | `NU` | bible-ul nu definește structura completă |
| Dosar | `PARȚIAL` | clar ca rol, dar nu ca layout complet |
| Monitoring page-level | `PARȚIAL` | clar ca rezultat al cockpitului, nu ca secțiune largă |
| Partner / portfolio | `NU` | absent |
| Settings | `NU` | absent |

---

## 3. Scheletul canonic pe secțiuni

Fiecare secțiune de mai jos spune:
- ce este
- ce trebuie să facă userul
- ordinea UI/UX
- ce este primar vs secundar
- cât de precis este definită acum

---

## 3.1 Landing

### Intenția dominantă

Să convertească userul într-o intrare clară în produs.

### Ordinea UI / UX

1. urgență / relevanță
2. promisiune
3. traseu clar
4. CTA dominant
5. dovadă că produsul e pentru personas corecte

### IA

`public entry point`, nu pagină de produs aglomerată.

### Primar

- H1
- subtitlu
- journey
- CTA `Începe gratuit`

### Secundar

- pricing preview
- demo
- secțiuni de suport

### Precizie actuală

`NECESITĂ SPEC SUPLIMENTAR`

Bible-ul nu o definește; skeletonul vine din blueprint + audit.

---

## 3.2 Login / Register

### Intenția dominantă

Intrare rapidă, fricțiune minimă.

### Ordinea UI / UX

1. context scurt
2. modul activ clar (`register` sau `login`)
3. formular
4. submit
5. direcție clară spre onboarding

### IA

`gate` între public și app, nu pas de produs autonom.

### Primar

- formular activ
- CTA principal

### Secundar

- link switch login/register
- termeni

### Precizie actuală

`NECESITĂ SPEC SUPLIMENTAR`

Bible-ul nu o definește; auditul spune doar unde rupe flow-ul.

---

## 3.3 Onboarding wizard

### Intenția dominantă

Să construiască primul context operațional al userului, observabil și secvențial.

### Ordinea UI / UX

1. progress rail
2. pas activ clar
3. întrebările pasului
4. CTA de continuare
5. verificare automată
6. snapshot

### IA

`wizard liniar`, nu card care crește pe ascuns.

### Primar

- un singur pas activ
- titlu de pas
- progres vizibil
- CTA clar

### Secundar

- summary scurt
- badge de mod / status

### Reguli canonice din bible

- orice grup nou de întrebări devine pas sau sub-pas observabil
- `Pas 3 din 5` trebuie să fie explicit
- stânga: brand + progress rail + starea curentă
- dreapta: un singur obiectiv per ecran

### Precizie actuală

`SUFICIENT DE PRECIS`

Se poate fixa structura onboarding-ului înainte de refactorul de logică.

---

## 3.4 Snapshot / Home

### Intenția dominantă

Să orienteze userul: ce se aplică, ce am găsit, ce face acum.

### Ordinea UI / UX

1. acțiunea dominantă
2. contextul de aplicabilitate
3. ce am detectat deja
4. scor / KPI / activitate

### IA

`orientare`, nu încă loc de execuție.

### Primar

- `Ce faci acum`

### Secundar

- `Ce ți se aplică`
- `Ce am găsit deja`
- KPI
- feed

### Precizie actuală

`PARȚIAL PRECIS`

Bible-ul nu definește Home, dar auditul spune clar că acțiunea trebuie să domine. Se poate fixa scheletul, dar nu vine din bible.

---

## 3.5 De rezolvat

### Intenția dominantă

Să permită intrarea rapidă în caz, în ordinea priorității.

### Ordinea UI / UX

1. count + severitate
2. search / filtre ușoare
3. listă de findings
4. click în cockpit

### IA

`queue centrală`, nu dashboard secundar.

### Primar

- lista
- severitatea
- acțiunea de intrare în caz

### Secundar

- filtre grele
- meta

### Precizie actuală

`PARȚIAL PRECIS`

Bible-ul nu o definește explicit, dar auditul arată că structura actuală este bună. Putem fixa skeletonul fără refactor de motor.

---

## 3.6 Cockpit — header compact

### Intenția dominantă

Să spună instant ce caz este și de ce contează.

### Ordinea UI / UX

1. titlul finding-ului
2. severitatea
3. statusul
4. propoziția `de ce contează`

### IA

`header compact`, nu perete de context.

### Primar

- titlu
- severitate
- status
- one-line significance

### Secundar

- detected date
- source

### Precizie actuală

`SUFICIENT DE PRECIS`

Bible-ul este direct executabil aici.

---

## 3.7 Cockpit — mini-stepper sticky

### Intenția dominantă

Să spună unde e userul în proces, fără să concureze cu CTA-ul.

### Ordinea UI / UX

1. stepper mic, sus
2. pas activ vizibil
3. pași trecuți verzi
4. pași viitori neutri

### IA

`indicator de progres`, nu componentă dominantă.

### Etichete canonice

1. `Confirmi cazul`
2. `Pregătești rezolvarea`
3. `Verifici dovada`
4. `Trimiți la Dosar`
5. `Monitorizat`

### Precizie actuală

`SUFICIENT DE PRECIS`

Bible-ul definește inclusiv triggerii de actualizare.

---

## 3.8 Cockpit — blocul dominant `Acum faci asta`

### Intenția dominantă

Să dea o singură direcție clară de acțiune.

### Ordinea UI / UX

1. label mic
2. propoziție clară
3. CTA principal
4. opțional un secundar

### IA

`centrul de greutate al cockpitului`

### Primar

- propoziția de acțiune
- CTA principal

### Secundar

- CTA secundar
- helper text

### Precizie actuală

`SUFICIENT DE PRECIS`

Bible-ul este foarte bun aici.

---

## 3.9 Cockpit — modul de execuție

### Intenția dominantă

Să găzduiască lucrul real, adaptat pe tip de finding.

### Ordinea UI / UX

După blocul dominant, apare modulul corect:

- `documentar`
- `operațional`
- `specialist / extern`
- `revalidation`

### IA

`locul de lucru`, nu doar locul de descriere.

### Structură pe familii

#### Documentar
- generator
- preview
- regenerate / replace
- continue to validation

#### Operațional
- instrucțiuni scurte
- note field
- upload
- checklist dacă e necesar

#### Specialist / extern
- mini-wizard inline
sau
- drawer
sau
- side sheet
sau
- handoff controlat

#### Revalidation
- dovada anterioară
- ce trebuie reverificat
- reconfirmare
- next review date

### Precizie actuală

`SUFICIENT DE PRECIS`

Bible-ul permite definirea exactă a structurii fără a rescrie motorul întâi.

---

## 3.10 Cockpit — blocul de validare

### Intenția dominantă

Să oprească saltul fals `draft -> dovadă finală`.

### Ordinea UI / UX

1. status de verificare
2. checks
3. ce a picat
4. acțiuni de corecție
5. `Confirmă și salvează`

### IA

`gate obligatoriu` pentru artefactele validabile.

### Verdict-uri permise

- `Acceptabil pentru acest finding`
- `Incomplet — necesită corecții`
- `Necesită revalidare manuală`
- `Necesită dovadă suplimentară`

### Precizie actuală

`SUFICIENT DE PRECIS`

---

## 3.11 Cockpit — success strip

### Intenția dominantă

Să închidă cazul calm și clar.

### Ordinea UI / UX

1. dovada a intrat la dosar
2. cazul a intrat în monitorizare
3. următoarea verificare
4. CTA principal: `Următorul caz`
5. CTA secundar: `Deschide Dosarul`

### IA

`rezultat al cazului`, nu hub nou.

### Precizie actuală

`SUFICIENT DE PRECIS`

Bible-ul este clar și aici.

---

## 3.12 Cockpit — context și aftercare

### Intenția dominantă

Să păstreze contextul disponibil, dar tăcut.

### Ordinea UI / UX

Sub fold:
- impact
- context legal
- provenance
- close condition
- detalii Dosar
- detalii Monitoring

### IA

`secundar / collapsed / lower sections`

### Precizie actuală

`SUFICIENT DE PRECIS CA PRINCIPIU`

Bible-ul spune clar că aceste lucruri trebuie să existe și să nu domine. Nu definește layout milimetric, dar este suficient pentru skeleton.

---

## 3.13 Dosar

### Intenția dominantă

Să arate rezultatul muncii:
- cazuri rezolvate
- dovezi
- documente
- exporturi

### Ordinea UI / UX

1. cazuri rezolvate + dovezi
2. documente generate
3. exporturi
4. audit depth

### IA

`rezultat`, nu proces.

### Precizie actuală

`PARȚIAL PRECIS`

Bible-ul spune clar că Dosar este rezultat, nu proces. Auditul completează ordinea practică. Putem fixa structura, dar nu vine integral din bible.

---

## 3.14 Monitoring

### Intenția dominantă

Să continue cazul închis fără să-l transforme iar în workflow principal.

### Ordinea UI / UX

1. next review
2. status monitorizat
3. semnal de redeschidere dacă apare schimbare

### IA

`rezultat persistent`, nu ecran de lucru primar.

### Precizie actuală

`PARȚIAL PRECIS`

Bible-ul îl definește ca rezultat al cockpitului, nu ca secțiune mare de produs.

---

## 3.15 Handoff controlat

### Intenția dominantă

Să permită execuție secundară fără pierdere de context.

### Ordinea UI / UX

1. explici de ce pleacă userul
2. păstrezi `findingId`
3. păstrezi contextul
4. explici unde revine
5. la întoarcere, cockpitul știe ce s-a făcut și ce lipsește

### IA

`suport`, nu ruptură de flow.

### Reguli canonice

1. păstrezi `findingId`
2. păstrezi source context
3. explici de ce pleacă
4. explici unde revine
5. cockpitul știe exact:
   - ce s-a făcut
   - ce lipsește
   - ce dovadă trebuie

### Precizie actuală

`SUFICIENT DE PRECIS`

---

## 3.16 Specialist modules

### Intenția dominantă

Să fie unelte secundare, nu centre egale de execuție pentru cazul principal.

### Ordinea UI / UX

Nu există un singur layout universal definit de bible.

### IA

`secondary tools after core flow`

### Precizie actuală

`INSUFICIENT DEFINITĂ ÎN BIBLE`

Aici auditul rămâne sursa principală:
- `Scan` poate rămâne aproape de spine
- `DSAR`, `NIS2`, `Fiscal` trebuie recadrate
- `Sisteme`, `DORA`, `Whistleblowing` sunt prea autonome

---

## 3.17 Partner / Portfolio

### Intenția dominantă

Triage cross-client și intrare controlată în workspace client.

### Precizie actuală

`ABSENTĂ ÎN BIBLE`

Skeletonul vine din audit, nu din acest document.

---

## 3.18 Settings

### Intenția dominantă

Configurare, nu centru de produs.

### Precizie actuală

`ABSENTĂ ÎN BIBLE`

Trebuie definită separat.

---

## 4. Concluzie executabilă

### Ce putem fixa acum, înainte de motor

Fără presupuneri suplimentare, putem fixa acum:

1. `Onboarding wizard skeleton`
2. `Cockpit skeleton`
3. `Mini-stepper`
4. `Dominant action block`
5. `Execution module shells pe 4 familii`
6. `Validation block`
7. `Success strip`
8. `Handoff contract`
9. `Dosar ca rezultat, nu proces`
10. `Home cu acțiunea dominantă deasupra contextului`

### Ce NU este încă suficient definit doar din bible

1. landing exact
2. login/register exact
3. partner / portfolio exact
4. settings exact
5. layout complet pentru fiecare modul specialist

### Decizia corectă

`Da, putem lua de aici scheletul de IA / UX / UI.`

Dar corect este să-l luăm în două straturi:

#### Strat 1 — din bible

- cockpit
- onboarding
- mini-stepper
- validation
- success
- handoff

#### Strat 2 — din auditul 1:1

- landing
- login/register
- home
- resolve queue
- dosar
- monitoring expression
- partner / portfolio
- specialist modules recadrate

---

## 5. Formula de execuție

Ordinea sănătoasă de acum înainte este:

1. fixăm skeletonul pe secțiuni
2. fixăm ierarhia vizuală și IA
3. eliminăm rupturile de flow
4. abia după refactorizăm motorul să servească structura, nu invers

Acesta este punctul în care structura trebuie să conducă motorul, nu motorul să decidă structura.
