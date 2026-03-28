# CompliScan — Canon Implementation Sprint Map

Acesta este documentul de execuție sprint-by-sprint pentru implementarea controlată a:
- [COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md)
- [CompliScan_Finding_Contract_Schema.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Finding_Contract_Schema.md)
- [CompliScan_Finding_Type_Library.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Finding_Type_Library.md)
- [CompliScan_Resolve_Flow_Master_Table.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Resolve_Flow_Master_Table.md)
- [CompliScan_Cockpit_UI_State_Model.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Cockpit_UI_State_Model.md)
- [CompliScan_Maturity_Gap_Map.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Maturity_Gap_Map.md)

Nu este inca un document de viziune.

Este documentul dupa care trebuie sa lucram pas cu pas, fara sa pierdem directia si fara sa refacem fragmentarea.

---

## 0. Rolul fiecarui document

Ordinea corecta este:

1. [COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md)
- adevarul mare de produs

2. [CompliScan_Finding_Contract_Schema.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Finding_Contract_Schema.md)
- contractul implementabil pentru cod

3. [CompliScan_Finding_Type_Library.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Finding_Type_Library.md)
- tipologia finding-urilor

4. [CompliScan_Resolve_Flow_Master_Table.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Resolve_Flow_Master_Table.md)
- flow UX per finding type

5. [CompliScan_Cockpit_UI_State_Model.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Cockpit_UI_State_Model.md)
- transpunerea UI: card, detail panel, rail, blocuri

6. [CompliScan_Maturity_Gap_Map.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Maturity_Gap_Map.md)
- ordinea de maturizare si prioritatile de roadmap

Regula:
- nu implementam direct din toate simultan
- implementam din contractul de cod
- celelalte documente il hranesc

---

## 1. Reguli de disciplina ca sa nu ne fragmentam

1. Nu mai scriem CTA-uri sau reguli de inchidere direct in componente daca ele tin de finding logic.
2. Nu mai inventam statusuri persistate pentru UX.
3. Nu mai deschidem rute separate pentru subflow-uri care trebuie sa stea in cockpit.
4. Nu mai introducem un finding nou fara:
- `findingTypeId`
- `resolutionMode`
- `requiredEvidence`
- `closeCondition`
- `revalidationTrigger`
5. Nu mai facem polish vizual mare peste flow-uri care nu sunt inca table-driven.
6. Nu mai lansam un sprint fara smoke pe live pentru familia afectata.
7. Orice sprint inchis trebuie sa lase produsul mai coerent, nu doar mai mare.

---

## 2. Strategia mare

Nu implementam pe pagini.
Implementam pe straturi, apoi pe familii de finding-uri.

Ordinea corecta este:

1. fundatia de contract
2. pilot pe 3 archetypes
3. dosar + monitoring complet
4. first value: landing + onboarding + snapshot
5. familii functionale majore
6. continuity, partner, trust, legal safety

Adica:

`contract -> cockpit -> dossier -> monitoring -> onboarding/value -> domain maturity`

---

## 3. Sprint 0 — Freeze the Truth

### Obiectiv
Sa nu mai lucram dupa interpretari paralele.

### Scope
- fixam documentele de referinta
- stabilim precedenta dintre ele
- blocam documentele vechi ca inspiratie, nu ca adevar paralel

### Livrabile
- acest sprint map
- contract schema final
- regula clara de precedenta intre documente

### Definition of Done
- echipa stie ce document conduce ce
- nu mai exista „dar in alt doc scrie altfel” ca motiv de implementare

### Nu avem voie sa facem
- cod nou pe finding flow fara sa respecte schema de contract

---

## 4. Sprint 1 — Contract Kernel in Code

### Obiectiv
Sa mutam adevarul din documente intr-un strat unic de decizie in cod.

### Scope
- `classifyFinding`
- `getFindingTypeDefinition`
- `getResolveFlowRecipe`
- `deriveCockpitUIState`
- `buildCockpitRecipe`

### Ce implementam
- un kernel unic pentru finding logic
- separatie clara intre:
- `findingStatus` persistat
- `resolveFlowState`
- `cockpitUIState`
- `visibleBlocks`

### Domenii acoperite
- inca nu tot produsul
- doar fundatia comuna

### Definition of Done
- exista un singur strat care decide CTA, dovezi, close condition si monitoring signals
- paginile nu mai au if-uri imprastiate pentru aceleasi decizii
- exista teste unitare pentru contract builder

### Validare
- unit tests pentru clasificare si recipes
- build verde

### Anti-fragmentare
- nu cream 5 surse de adevar in 5 componente

---

## 5. Sprint 2 — Pilot Cockpit pe 3 archetypes

### Obiectiv
Sa probam modelul complet pe cele 3 moduri principale de rezolvare.

### Archetypes canonice
1. `GDPR-001`
- document / `in_app_guided`

2. `EF-003`
- operational / `external_action`

3. `SYS-002`
- revalidation / `needs_revalidation`

### Scope
- collapsed card
- detail panel
- hero CTA
- evidence block
- dossier save
- monitoring handoff

### Ce invatam aici
- daca modelul chiar poate duce un finding cap-coada
- daca UI state model este suficient
- daca CTA-ul unic tine cockpit-ul clar

### Definition of Done
- cele 3 archetypes trec end-to-end prin acelasi kernel
- generatorul ramane in cockpit pentru finding-urile documentare
- external action nu afiseaza generator unde nu are sens
- revalidation nu foloseste copy de remediere initiala

### Validare
- browser smoke local
- browser smoke live
- dovada intrata in dosar
- `under_monitoring` sau revalidation functionala

---

## 6. Sprint 3 — Dossier, Evidence, Closing, Monitoring

### Obiectiv
Sa inchidem corect ciclul:

`finding -> dovada -> dosar -> monitoring`

### Scope
- evidence acceptance model
- close gating universal
- success moment unitar
- dossier linkage unitar
- monitoring / reopen logic

### Ce cere documentatia
- din canon: rezolvarea nu moare la toast
- din flow table: fiecare finding are close condition
- din UI state model: evidence si recheck nu mai sunt decorative
- din maturity map: vault / artifact / timeline trebuie maturizate

### Definition of Done
- nu mai exista `resolved` fara dovada sau justificare valida
- dosarul stie sursa finding-ului
- monitoring-ul are trigger clar per finding type
- redeschiderea foloseste istoricul anterior

### Validare
- tests pentru close condition
- tests pentru reopen logic
- smoke pe flow de dovada si success moment

---

## 7. Sprint 4 — Landing, Onboarding, First Snapshot, First Value

### Obiectiv
Sa facem produsul sa para inteligent si util din primele minute.

### Scope
- landing promise
- onboarding in 3 pasi
- `Compli verifica`
- finish screen
- primul snapshot
- primul quick win

### Ce cere documentatia
- din canon: `Landing -> Onboarding -> Primul Snapshot -> Resolve`
- din maturity map: first value este inca prea fragmentata

### Definition of Done
- landing vinde traseul complet, nu doar scanarea
- onboarding demonstreaza inteligenta, nu doar cere date
- dupa onboarding userul vede:
- ce se aplica
- ce am gasit
- ce faci acum
- exista primul moment clar de valoare

### Validare
- browser smoke nou user
- verificare pe live cu CUI / website / prefill

---

## 8. Sprint 5 — GDPR Production Maturity

### Obiectiv
Sa ducem GDPR docs + DPA + rights + evidence la maturitate aproape completa.

### Scope
- privacy docs
- cookies
- DPA
- vendor transparency
- DSAR
- breach / ANSPDCP path
- retention / deletion

### Ce cere documentatia
- finding library
- resolve flow table
- maturity map sectiunea GDPR

### Definition of Done
- fiecare finding GDPR important are:
- type definition
- flow recipe
- cockpit state
- accepted evidence
- revalidation logic
- DSAR si breach nu mai sunt doar direction, ci flow operational

### Validare
- tests pe rights / breach
- smoke pe document finding + rights finding

---

## 9. Sprint 6 — eFactura / SPV / ANAF Maturity

### Obiectiv
Sa facem nucleul Romania-first puternic si clar explicat.

### Scope
- SPV state model
- error library
- explainability pe semnale
- evidence model pe finding-urile fiscale
- buyer-side risk
- recheck vizibil

### Definition of Done
- un finding fiscal spune clar:
- ce s-a intamplat
- unde trebuie mers
- ce dovada inchide cazul
- daca si cand reverificam

### Validare
- smoke pe EF-003 si rudele lui
- notificari si feed pe semnale fiscale

---

## 10. Sprint 7 — NIS2 Maturity

### Obiectiv
Sa ducem NIS2 din directie buna in flow operational matur.

### Scope
- wizard de eligibilitate
- DNSC registration path
- incident timeline 24h / 72h / 30 zile
- evidence per control
- supply-chain / vendor linkage
- maturity explainability

### Definition of Done
- eligibilitatea vine inainte de complexitate
- incidentele au timeline complet si artifacte
- supply-chain finding-urile se leaga de vendor review si dovezi

### Validare
- route tests pe timeline
- smoke pe eligibility + DNSC + incident path

---

## 11. Sprint 8 — Activity Feed si Continuity Layer

### Obiectiv
Sa facem produsul sa para viu si protector dupa rezolvare.

### Scope
- activity feed uman
- notificari relevante
- monthly digest
- drift / revalidation / reminders
- explicatia `ce am verificat pentru tine`

### Ce spune maturity map
- aici suntem inca sub celelalte, deci nu trebuie amanat prea mult dupa cockpit

### Definition of Done
- exista feed real, nu tehnic
- fiecare eveniment important are 1 CTA clar
- se vede legatura intre eveniment extern si workspace-ul userului

### Validare
- smoke pe feed si notificari live
- verificare wording uman

---

## 12. Sprint 9 — Partner, Trust, Shareability

### Obiectiv
Sa ducem produsul din tool bun pentru un user in infrastructura buna pentru operatori si output extern.

### Scope
- partner / consultant mode
- portfolio urgency
- batch-safe work
- trust center promovat
- share links
- audit pack ca asset extern

### Definition of Done
- operatorul multi-client nu pierde contextul
- trust si export nu mai sunt ascunse
- outputurile sunt gandite si pentru cine le primeste, nu doar pentru cel care le genereaza

---

## 13. Sprint 10 — AI Act si Legal Safety Layer

### Obiectiv
Sa inchidem maturitatea pe AI Act si pe granita sanatoasa dintre software si consultanta.

### Scope
- detectie multi-sursa AI
- classification explainability
- Annex IV / documentation pack
- EU DB readiness
- boundary clarity
- false confidence prevention
- conflict resolution logic

### Definition of Done
- AI Act nu mai este doar inventar si directie
- legal safety rules sunt uniforme in toate domeniile
- produsul ramane ambitios, dar nu promite peste limita lui

---

## 14. Cum lucram sprint dupa sprint

Fiecare sprint trebuie sa aiba aceeasi structura:

1. alegem domeniul sau archetype-ul
2. mapam finding types afectate
3. mapam flow recipes afectate
4. mapam cockpit UI states afectate
5. implementam contract layer
6. apoi UI
7. apoi smoke pe live
8. abia apoi urmatorul sprint

Regula:
- nu sarim direct la UI daca nu exista recipe
- nu sarim direct la polish daca nu exista close condition si evidence logic

---

## 15. Ce inseamna ca pastram directia buna

Pastram directia buna daca, dupa fiecare sprint:

1. sunt mai putine if-uri locale si mai mult contract comun
2. exista mai putine rute paralele si mai mult cockpit unificat
3. exista mai multa dovada in dosar si mai putina „rezolvare” doar vizuala
4. exista mai mult monitoring dupa rezolvare
5. exista mai putin jargon si mai multa claritate pentru user

Daca dupa un sprint avem:
- mai multe pagini
- mai multe stari brute amestecate
- mai multe CTA-uri concurente
- mai multe exceptii hardcodate

inseamna ca am deviat.

---

## 16. Criteriul final de succes

La finalul acestui plan, CompliScan trebuie sa para:

- inteligent la intrare
- clar la rezolvare
- credibil la dovada
- viu in monitorizare
- sigur pentru operatorii maturi

Formula finala:

`gaseste -> explica -> pregateste -> inchide -> salveaza -> monitorizeaza -> reaprinde cand trebuie`

Acesta este planul care duce documentele canonice in runtime fara sa ne rupa iar in bucati.
