# DPO Live Browser Flow Report — Diana imports a new client

Data: 2026-04-30  
Branch: `v3-unified`  
Scop: testare ca Diana Popescu, consultant DPO, pornind de la un portofoliu real de cabinet si firme noi importate din Excel/CSV.

## Intrebarea testului

Poate Diana sa ia o firma noua din portofoliul ei existent, sa o importe in CompliScan si sa lucreze cap-coada pe ea?

Flow asteptat:

1. importa firmele;
2. scaneaza / construieste baseline;
3. vede prioritatile;
4. intra pe firma;
5. rezolva un finding sau deschide un caz;
6. pastreaza dovada in dosar;
7. genereaza raport lunar / export cabinet.

## Ce am testat efectiv

- Browser live pe `http://localhost:3000/portfolio`, sesiunea demo Diana / DPO Complet.
- Wizardul `Import firme` din UI.
- Import real prin endpoint-urile aplicatiei, cu acelasi user Diana, pentru un CSV natural de cabinet:
  - `Medica Plus SRL`, sector `Sanatate`, 42 angajati;
  - `TransRapid SRL`, sector `Transport si logistica`, 85 angajati;
  - `FinCore IFN SA`, sector `Servicii financiare`, 260 angajati.
- Portofoliu dupa import.
- Drilldown si dashboard pentru `Medica Plus SRL`.
- Inbox `De rezolvat` si cockpit pentru finding REGES.
- Modul DSAR pentru `Medica Plus SRL`, inclusiv creare cerere noua.
- Dosar / export surface.
- Raport lunar si export cabinet prin API.

Nota: browser automation nu a expus `setInputFiles`, deci incarcarea fizica a fisierului a fost simulata prin API real (`preview -> execute -> baseline-scan`). UI-ul wizardului a fost inspectat separat.

## Rezultate bune

### 1. Importul este valid pentru un Excel real de cabinet

Preview import:

- status `200`;
- confidence `high`;
- mapare corecta:
  - `Denumire firma` -> firma;
  - `CUI` -> CUI;
  - `Domeniu activitate` -> sector;
  - `Nr angajati` -> employee bucket;
  - `Email contact` -> email.

Detectii corecte:

- `Sanatate` -> `health`;
- `Transport si logistica` -> `transport`;
- `Servicii financiare` -> `finance`;
- `42` -> `10-49`;
- `85` -> `50-249`;
- `260` -> `250+`.

### 2. Portofoliul se actualizeaza dupa import

Dupa import:

- `6 firme active`;
- `6 firme cu date`;
- `46 taskuri active`;
- firmele noi apar in lista cu scoruri si scan date:
  - `FinCore IFN SA` — scor `36%`;
  - `Medica Plus SRL` — scor `30%`;
  - `TransRapid SRL` — scor `36%`.

Pentru Medica Plus:

- `Ultima scanare: 29 apr. 2026`;
- `7 findings critice`;
- `13 taskuri`.

### 3. Dashboardul operational pentru firma noua are continut relevant

Pentru `Medica Plus SRL`, dashboardul arata:

- readiness `30%`;
- risc ridicat;
- `14 cazuri active`;
- `15 dovezi lipsa`;
- framework-uri aplicabile: `GDPR`, `NIS2`, `Directiva CER`;
- prioritate P1: `REGES / evidenta contracte angajati`;
- lista de cazuri GDPR incluzand:
  - politica de confidentialitate lipsa;
  - RoPA Art. 30 lipsa;
  - furnizori externi fara documentatie;
  - DPA lipsa;
  - Legea 190/2018 — CNP/date sensibile fara anexa operationala;
  - proces DSAR lipsa;
  - training GDPR angajati fara evidenta.

Observatie importanta: Legea 190/2018 este detectata acum pentru client `health`, deci gap-ul semnalat anterior de Sonnet nu mai este valabil in acest build pentru Medica Plus.

### 4. Inboxul `De rezolvat` este aproape de munca reala a Dianei

Pagina `De rezolvat` arata:

- 14 cazuri deschise;
- 7 ridicate;
- 7 medii;
- filtre pe framework si severitate;
- CTA `Deschide cockpit` per caz.

Pentru un DPO real, asta raspunde la intrebarea: "ce fac azi pentru clientul asta?"

### 5. DSAR functioneaza pentru firma noua

Pentru `Medica Plus SRL`, Diana poate:

- deschide modulul DSAR;
- vedea procedura DSAR generata pentru firma;
- vedea registrul DSAR model;
- crea o cerere noua;
- completa solicitant, email, tip cerere si note;
- primi deadline automat de 30 zile.

Test creat:

- solicitant: `Maria Ionescu`;
- email: `maria.ionescu@example.ro`;
- tip: acces date Art. 15 GDPR;
- deadline calculat: `29.05.2026`;
- draft raspuns generat automat;
- checklist de actiuni inainte de trimitere.

Acesta este un flow DPO real si vandabil.

### 6. Raport lunar exista si agrega portofoliul

Endpoint raport lunar:

- status `200`;
- luna: `aprilie 2026`;
- `6` clienti;
- `6` rapoarte client-facing;
- HTML generat: `17627` caractere.

Activitati:

- Apex: 4 activitati;
- Cobalt: 2 activitati;
- Lumen: 1 activitate;
- firmele noi: 0 activitati, dar 3 next actions fiecare.

Pentru firme noi fara lucru efectiv, raportul nu inventeaza activitati, ceea ce este corect.

### 7. Export cabinet exista

Endpoint export cabinet:

- status `200`;
- `6` clienti;
- white-label: `DPO Complet`;
- `3` template-uri;
- include `securityContractualPack` si `securityContractualPackMarkdown`.

## Blocante / probleme reale

### P0 — Close-loop finding nu este cap-coada

In cockpitul REGES:

- `Confirmă constatarea` functioneaza;
- statusul trece in `CONFIRMAT`;
- apare pasul urmator: `Deschide brief-ul REGES`;
- dar `Deschide brief-ul REGES (tab nou)` nu deschide nimic vizibil;
- `Marchează brief-ul REGES pregătit` ramane disabled.

Impact:

Diana poate confirma ca problema exista, dar nu poate inchide natural cazul si nu il poate trimite in dosar. Pentru full workflow "gaseste -> rezolva -> baga la dosar", acesta este blocant.

### P0 — Inconsistenta intre portofoliu, drilldown si dashboard client

Pentru `Medica Plus SRL`:

- portofoliul arata `7 findings critice` si `13 taskuri`;
- dashboardul operational arata `14 cazuri active`;
- drilldown-ul `/portfolio/client/...` arata `Findings deschise: 0`.

Impact:

Un DPO nu poate avea trei adevaruri despre acelasi client. Pentru compliance, aceasta incoerenta este risc de incredere.

### P1 — Duplicate guard avertizeaza, dar nu blocheaza importul

Preview import a detectat:

- `CUI deja existent in portofoliu` pentru `Medica Plus SRL`.

Totusi execute a importat firma.

Impact:

Diana poate importa accidental acelasi client de doua ori. Pentru pilot trebuie cel putin confirmare explicita sau skip implicit pentru duplicate.

### P1 — Revenirea din context client in portofoliu este slaba

Dupa ce Diana intra in `Medica Plus SRL`, navigarea la `/portfolio/reports` a dus inapoi la dashboard client. UI-ul de workspace are lista de organizatii, dar nu exista un CTA evident "Inapoi la portofoliu".

Impact:

Diana se poate simti blocata in firma curenta si nu ajunge natural la raportul lunar de portofoliu.

### P1 — DSAR contine disclaimer AI care trebuie legat de setarea AI

Pachetul DSAR afiseaza:

`Acest pachet a fost generat cu ajutorul AI...`

Impact:

Daca pentru cabinet / client sensibil AI este OFF, textul trebuie sa fie determinist si aliniat cu setarea. Daca AI este ON, mesajul este acceptabil, dar trebuie sa fie consecvent in tot flow-ul.

### P1 — Dosarul are exporturi, dar cazul nou nu poate ajunge acolo fara close-loop

Pagina Dosar este buna ca suprafata:

- export PDF;
- audit PDF;
- audit ZIP;
- snapshot JSON/YAML;
- link securizat.

Dar pentru Medica Plus arata `0 cazuri rezolvate`, iar cazul REGES nu poate fi inchis din cockpit.

Impact:

Dosarul exista, dar nu este alimentat natural din workflow pentru firma noua.

### P2 — Limbaj si scoruri pot confuza

Pentru Medica:

- readiness global `30%`;
- in jurnal apare `conformitatea GDPR — 100%`;
- frameworks arata `GDPR 14 findings`.

Impact:

Diana intelege ca exista scoruri diferite, dar clientul nu. Trebuie separata clar:

- scor general readiness;
- coverage framework;
- numar findings deschise.

## Raspuns la intrebarea principala

### Poate Diana sa isi importe firmele?

Da, pentru lista de clienti: nume firma, CUI, sector, angajati, email, website. Importul este unul dintre cele mai bune flow-uri.

### Poate Diana sa importe "tot ce are"?

Partial, nu complet.

Poate importa azi:

- portofoliu clienti;
- template-uri cabinet;
- dovezi / documente punctual prin dosar;
- date de baza pentru baseline.

Nu este inca dovedit ca poate importa structurat:

- istoric DSAR din Excel;
- RoPA existent pe procese;
- vendor register complet;
- training tracker istoric;
- emailuri de aprobare;
- rapoarte lunare vechi;
- documente semnate cu versiuni.

### Poate Diana sa faca full workflow pentru firma noua?

Partial.

Merge:

- import client;
- baseline scan;
- prioritizare;
- dashboard client;
- inbox de rezolvare;
- confirmare finding;
- DSAR nou;
- raport lunar;
- export cabinet.

Nu merge complet:

- inchiderea finding-ului pana in dosar;
- transformarea remediarii in dovada validata;
- navigarea fluida inapoi la portofoliu;
- coerenta 100% intre portofoliu / drilldown / dashboard;
- protectia anti-duplicate la import.

## Verdict Diana

Diana ar intelege produsul si ar intra intr-un pilot controlat, pentru ca importul, baseline-ul, DSAR-ul si raportul lunar arata valoare reala.

Diana nu ar muta inca un client real end-to-end fara asistenta, pentru ca flow-ul critic "finding rezolvat -> dovada -> dosar" se blocheaza in cockpitul REGES, iar acelasi client are stari diferite in portofoliu, drilldown si dashboard.

## Decizie

Pilot controlat: DA, dupa fixurile P0.  
Productie DPO cabinet: NU inca.  
Urmatorul sprint sanatos: `DPO Full Workflow Closure`.

Fixuri minime pentru a spune "Diana poate lucra cap-coada pe firma noua":

1. Fix close-loop cockpit: `confirmat -> brief/document -> dovada -> rezolvat -> dosar`.
2. Sincronizare state client: portfolio, drilldown, dashboard, dosar.
3. Duplicate import guard: duplicate CUI = skip sau confirmare explicita.
4. CTA vizibil `Inapoi la portofoliu` / `Raport lunar portofoliu`.
5. DSAR disclaimer legat de AI mode.
6. Clarificare scoruri: readiness vs framework coverage vs findings.

---

## Update post-fix — DPO Full Workflow Closure (30 apr 2026)

Status dupa patch si retest live browser:

- `Portofoliu -> Execuție firma` este vizibil pentru demo partner sessions. Diana vede switcherul `Portofoliu · triaj` / `Execuție · client`.
- `Medica Plus SRL` nu mai apare cu `Ultima scanare: fara scanare`; portofoliul arata `Ultima scanare: 29 apr. 2026`.
- Drilldown `/portfolio/client/[orgId]` arata finding-urile active reale; pentru Medica apare `Findings deschise: 10`, nu `0`.
- Importul duplicat este blocat la execute: `Medica Plus SRL` reimportata returneaza `imported: 0`, `failed: 1`, mesaj `Firma cu acelasi nume exista deja in portofoliu.`
- REGES close-loop merge cap-coada in browser:
  - cockpit REGES;
  - `Deschide brief-ul REGES`;
  - pachet REGES pe `/dashboard/documente?focus=reges-correction`;
  - completare reconciliere snapshot intern + checklist REGES;
  - `Foloseste materialele si revino in cockpit`;
  - dovada operationala precompletata;
  - `Marcheaza brief-ul REGES pregatit`;
  - cazul trece in monitorizare;
  - apare in Dosar cu nota de evidenta.
- DSAR nu mai foloseste textul generic `generat cu ajutorul AI`; disclaimerul este acum determinist: `Document de lucru pregatit de CompliScan. Necesita revizie si validare profesionala...`

Validari rulate:

- `vitest` targeted: 6 fisiere, 186 teste trecute.
- `next lint`: trece, doar warning-uri vechi neatinse.
- `npm run build`: trece curat dupa oprirea dev serverului si rebuild `.next` din zero.

Verdict post-fix:

- Pilot DPO controlat: DA.
- Diana poate lucra cap-coada pe firma noua pentru flow-ul testat: import -> baseline -> prioritate -> REGES finding -> pachet de lucru -> dovada -> monitorizare -> Dosar.
- Inca nu inseamna full production pe tot cabinetul; inseamna ca wedge-ul DPO este demonstrabil live.

## Backlog parcat din auditul Sonnet — rest framework-uri

Acestea NU sunt blocante pentru wedge-ul DPO testat mai sus. Le pastram ca backlog pentru cand intram pe fiecare ICP/framework, ca sa nu contaminam pilotul DPO cu promisiuni multi-framework prea devreme.

### NIS2 / incident response

- Audit Sonnet a raportat 500/timeout pe suprafete NIS2/incidente in anumite sesiuni.
- Exista cod valoros pentru `ANSPDCP Breach Notification Rescue`, dar trebuie retestat si legat clar in UI inainte de pitch NIS2.
- Pentru DPO, expunem doar ce ajuta direct: breach ANSPDCP / termen 72h / evidenta incident, nu vindem NIS2 complet in pilot.

### DORA / fintech

- DORA ramane `avoid 2026-2027` conform Doc 06/strategy lock.
- Nu se prezinta ca matur in DPO pilot; Cobalt poate ramane exemplu de client fintech, dar fara promisiune DORA full.

### Pay Transparency / HR

- Modul existent trebuie tratat ca backlog HR consultant / IMM internal, nu ca cerinta DPO core.
- DPO poate vedea semnale HR doar unde afecteaza privacy: training GDPR, REGES, date angajati, roluri si acces.

### Whistleblowing

- Modulul exista, dar nu este wedge-ul de vanzare DPO.
- Cand intram pe HR/IMM internal, se testeaza separat: submit sesizare, investigare, evidence, raportare.

### RoPA / Vendor / Training

- Pentru DPO ramane relevant si trebuie hardening separat:
  - RoPA editabil/importabil;
  - vendor register complet;
  - training tracker istoric.
- In flow-ul Medica, RoPA/training apar ca finding-uri si sunt descoperibile, dar nu au fost validate cap-coada ca import istoric.

### Regula de executie

Nu deschidem toate framework-urile public in acelasi timp. Motorul poate impinge mai multe masini, dar pentru vanzare pilotam pe o masina intreaga:

`DPO Delivery & Evidence Layer` -> apoi extindem la urmatorul ICP cu propriul browser test cap-coada.
