# CompliScan — Cockpit UI State Model

**Data:** 2026-03-25  
**Scop:** model unic de stare pentru UI-ul Finding + Resolve Smart Cockpit.  
**Utilizare:** UX, UI, frontend, backend state mapping, QA.

**Acest document defineste:**
- componentele UI ale cockpit-ului
- starile principale
- ce apare in card collapsed
- ce apare in detail panel
- cum se schimba UI-ul dupa severity
- cum se schimba UI-ul dupa resolution mode
- ce blocuri sunt obligatorii si ce blocuri sunt conditionale

---

# 1. Principiul de baza

Orice finding din CompliScan trebuie sa poata fi afisat in doua niveluri:

## Nivel 1 — Collapsed Card
Raspunde in 3 secunde la:
- ce problema este
- cat de grava este
- ce trebuie facut acum

## Nivel 2 — Detail Panel / Expanded View
Raspunde complet la:
- de ce conteaza
- ce poate face CompliScan
- ce trebuie sa faca userul
- ce dovada inchide cazul
- daca trebuie actiune externa
- daca se poate reverifica
- cand reapare ca revalidation

Daca aceste doua niveluri sunt coerente, cockpit-ul pare inteligent.
Daca nu, pare doar o lista de task-uri.

---

# 2. Componentele UI standard ale cockpit-ului

## A. Finding List Item
Elementul din lista principala, collapsed by default.

## B. Finding Detail Panel
Zona expandata sau pagina dedicata findingului.

## C. Resolve Action Panel
Blocul cu CTA principal si pasii urmatori.

## D. Evidence Panel
Blocul care explica si colecteaza dovada.

## E. Status Rail
Mic timeline / status strip care arata in ce etapa este finding-ul.

## F. Recheck / Revalidation Panel
Blocul care arata daca:
- se poate reverifica automat
- a fost reverificat
- trebuie reconfirmat mai tarziu

## G. Audit Meta Panel
Bloc cu:
- data
- owner
- sursa
- confidence
- signal direct / inferat
- log

---

# 3. Modelul general al unui Finding Card collapsed

## Blocuri obligatorii

### 1. Severity Badge
Exemple:
- Critic
- Ridicat
- Mediu
- Redus

### 2. Titlu finding
Trebuie sa fie scurt si uman.
Ex:
- Politica de confidentialitate lipsa
- Factura respinsa ANAF
- Inregistrare DNSC lipsa
- Vendor fara DPA
- Sistem AI nedeclarat

### 3. Framework Tag
Ex:
- GDPR
- NIS2
- eFactura
- AI Act

### 4. Status Chip
Ex:
- Nou
- Asteapta informatia ta
- Gata de generat
- Actiune externa necesara
- Dovada incarcata
- In reverificare
- Rezolvat
- Necesita revalidare

### 5. Primary CTA
Un singur CTA vizibil in collapsed state.
Ex:
- Genereaza acum
- Completeaza acum
- Vezi ce trebuie sa faci
- Adauga dovada
- Reconfirma

### 6. Chevron / Expand affordance
Trebuie sa indice clar ca exista un nivel detaliat.

---

# 4. Ce NU se pune in collapsed card

- explicatii juridice lungi
- 5 CTA-uri simultan
- multe badge-uri egale ca importanta
- campuri si formulare
- log tehnic
- dovada completa

Collapsed card-ul trebuie sa ramana scanabil.

---

# 5. Modelul Detail Panel

Detail panel-ul are 6 blocuri, in ordinea asta:

## Bloc 1 — Problema
Contine:
- titlu
- severitate
- framework
- semnal direct / inferat
- descriere scurta
- de ce conteaza

## Bloc 2 — Ce poate face CompliScan acum
Una din formulele:
- Putem genera documentul
- Putem pregati draftul
- Putem precompleta ce stim
- Avem nevoie de confirmarea ta
- Actiunea finala se face in afara aplicatiei

## Bloc 3 — Ce trebuie sa faci tu
In max 3-4 pasi:
1. completezi / confirmi
2. generezi / executi
3. aduci dovada
4. reverificam / inchidem

## Bloc 4 — Dovada ceruta
Arata concret:
- ce dovada acceptam
- ce dovada preferam
- exemple de dovada

## Bloc 5 — Status si progres
Arata:
- unde este acum
- ce lipseste pana la inchidere
- daca urmeaza recheck
- daca va reaparea la revalidation

## Bloc 6 — Meta / audit
- owner
- updated at
- source
- confidence
- last reviewed
- next review
- audit log link

---

# 6. State model principal

## 6.1 Statusuri functionale

### detected
Problema a fost gasita, dar userul nu a inceput flow-ul.

### need_your_input
CompliScan nu poate continua fara informatii de la user.

### ready_to_generate
Sunt suficiente date pentru a genera urmatorul artefact.

### external_action_required
Ultimul pas real trebuie facut in afara aplicatiei.

### evidence_uploaded
Userul a spus ca a facut actiunea si a adus dovada.

### rechecking
Sistemul reverifica automat unde poate.

### resolved
Problema este inchisa.

### needs_revalidation
Problema a fost inchisa in trecut, dar trebuie reconfirmata.

### false_positive
Finding contestat si acceptat ca invalid.

---

# 7. UI mapping pe status

## 7.1 detected

### Ce arata collapsed card
- severity
- titlu
- framework
- status = Nou
- CTA = Vezi si incepe

### Ce arata detail panel
- explicatia problemei
- de ce conteaza
- ce poate face CompliScan
- CTA principal de intrare in flow

### Accent vizual
neutral + severity

---

## 7.2 need_your_input

### Ce arata collapsed card
- status = Asteapta informatia ta
- CTA = Completeaza acum

### Ce arata detail panel
- ce lipseste exact
- de ce nu putem continua fara asta
- campuri / intrebari minime
- optional exemple

### Accent vizual
warning / attention

---

## 7.3 ready_to_generate

### Ce arata collapsed card
- status = Gata de generat
- CTA = Genereaza acum

### Ce arata detail panel
- ce se va genera
- ce finding va inchide
- ce mai trebuie confirmat
- estimare timp

### Accent vizual
productive / positive action

---

## 7.4 external_action_required

### Ce arata collapsed card
- status = Actiune externa necesara
- CTA = Vezi ce trebuie sa faci

### Ce arata detail panel
- exact in ce sistem extern trebuie mers
- ce pas se face acolo
- ce dovada trebuie adusa inapoi
- daca exista reverificare dupa

### Accent vizual
warning, dar fara panica

---

## 7.5 evidence_uploaded

### Ce arata collapsed card
- status = Dovada incarcata
- CTA = Vezi statusul

### Ce arata detail panel
- artifactul atasat
- ce urmeaza: review / recheck / inchidere
- eventual note sau lipsuri

### Accent vizual
intermediar / review

---

## 7.6 rechecking

### Ce arata collapsed card
- status = Reverificam
- CTA = Vezi progresul

### Ce arata detail panel
- ce verificam
- cand am inceput
- ce inseamna un rezultat bun / rau

### Accent vizual
subtle active

---

## 7.7 resolved

### Ce arata collapsed card
- status = Rezolvat
- CTA = Vezi dovada

### Ce arata detail panel
- ce a inchis cazul
- dovada
- data inchiderii
- cine a confirmat
- cand trebuie revazut

### Accent vizual
success

---

## 7.8 needs_revalidation

### Ce arata collapsed card
- status = Necesita revalidare
- CTA = Reconfirma acum

### Ce arata detail panel
- ce a expirat / ce s-a invechit
- de ce reapare
- ce dovada noua trebuie
- daca se poate reverifica automat

### Accent vizual
amber / reminder

---

## 7.9 false_positive

### Ce arata collapsed card
- status = Marcat ca nevalid
- CTA = Vezi motivul

### Ce arata detail panel
- motivul contestarii
- cine a aprobat
- data
- audit log

### Accent vizual
muted / archived

---

# 8. Mapping dupa severity

Severity schimba:
- accentul vizual
- ordinea blocurilor
- tonul copy-ului
- urgenta CTA-ului
- cantitatea de context aratat imediat

---

## 8.1 Critical

### Ce trebuie sa se intample
- apare primul in lista
- card cu accent puternic
- CTA foarte clar
- detail panel-ul pune urgent in fata

### Above the fold in detail
1. problema
2. termen / risc
3. CTA principal
4. dovada minima necesara

### Copy tone
- direct
- fara jargon
- fara dramatizare inutila
- dar foarte clar ca nu trebuie amanat

### Exemple
- incident NIS2 fara Early Warning
- DSAR depasit
- bresa cu potential ANSPDCP
- factura respinsa blocant

---

## 8.2 High

### Ce trebuie sa se intample
- foarte vizibil
- apare in top 3
- CTA clar
- poate sta sub critic

### Above the fold
1. problema
2. de ce conteaza
3. ce faci acum

### Copy tone
ferm si clar

---

## 8.3 Medium

### Ce trebuie sa se intample
- vizibil, dar fara a agresa
- poate sta in zona de backlog activ

### UI
- mai mult context decat urgenta
- accent pe completare / corectare

---

## 8.4 Low

### Ce trebuie sa se intample
- sa nu concureze cu urgentele
- sa fie usor batchable sau groupable

### UI
- compacte
- mai putin accent
- pot intra in fold secundar sau quick cleanup

---

# 9. Mapping dupa resolution mode

Asta e cea mai importanta parte a cockpit-ului.

---

## 9.1 in_app_full

### Ce trebuie sa afiseze collapsed
- status
- CTA = Genereaza acum / Rezolva acum

### Ce trebuie sa afiseze detail panel
- ce genereaza
- ce inchide
- confirmarea finala
- unde se salveaza

### Blocuri obligatorii
- generator block
- confirmation block
- save to vault block

### Nu trebuie sa afiseze
- instructiuni lungi externe
- dropdown-uri inutile

---

## 9.2 in_app_guided

### Ce trebuie sa afiseze collapsed
- status = Asteapta informatia ta sau Gata de generat
- CTA = Completeaza acum

### Ce trebuie sa afiseze detail panel
- ce stim deja
- ce nu stim
- de ce lipseste
- campuri minime necesare
- confirmare finala

### Blocuri obligatorii
- known vs unknown block
- input block
- confirmation block
- save block

### UI important
Trebuie sa se vada foarte clar:
**Asta stim deja. Asta trebuie sa ne spui tu.**

---

## 9.3 external_action

### Ce trebuie sa afiseze collapsed
- status = Actiune externa necesara
- CTA = Vezi ce trebuie sa faci

### Ce trebuie sa afiseze detail panel
- sistem extern
- pasii exacti
- dovada acceptata
- ce se intampla dupa ce revii

### Blocuri obligatorii
- external system block
- action checklist
- evidence return block
- optional recheck block

### UI important
Trebuie spus explicit:
**Actiunea reala se face in afara CompliScan.**

---

## 9.4 user_attestation

### Ce trebuie sa afiseze collapsed
- status = Asteapta confirmarea ta
- CTA = Confirma acum

### Ce trebuie sa afiseze detail panel
- ce nu putem verifica noi
- de ce conteaza
- ce atesti
- cine isi asuma

### Blocuri obligatorii
- attestation explanation
- confirmation checkbox
- name / owner
- optional proof

### UI important
Trebuie spus explicit:
**Doar tu poti confirma aceasta informatie.**

---

# 10. Blocurile UI obligatorii dupa resolution mode

| Resolution mode | Generator block | Input block | External action block | Evidence block | Confirmation block | Recheck block | Revalidation block |
|---|---:|---:|---:|---:|---:|---:|---:|
| in_app_full | da | optional | nu | da | da | optional | optional |
| in_app_guided | optional | da | nu | da | da | optional | optional |
| external_action | nu | optional | da | da | da | da / optional | optional |
| user_attestation | nu | da | nu | optional | da | nu | optional |

---

# 11. CTA rules

## Un singur CTA principal per finding
Nu punem 3 actiuni egale.

### Exemple bune
- Genereaza acum
- Completeaza acum
- Vezi ce trebuie sa faci
- Adauga dovada
- Reconfirma

## CTA secundar
Doar unul, contextual.
Ex:
- Am deja documentul
- Vezi de ce conteaza
- Vezi ce lipseste
- Nu folosim acest vendor

## CTA-uri interzise
- text vag de tip „Mergi in Generator”
- butoane paralele care nu au ierarhie
- 4 actiuni concurente

---

# 12. Evidence block model

Evidence block trebuie sa raspunda la 4 intrebari:

1. **Ce dovada acceptam?**
2. **Ce dovada preferam?**
3. **Exista dovada deja?**
4. **Mai trebuie reverificata?**

## Formate posibile
- document generat
- pdf
- screenshot
- xml
- public link
- email trimis
- vendor doc
- official reference
- manual attestation

## Sub-state-uri
- missing
- uploaded
- insufficient
- accepted
- stale

---

# 13. Recheck block model

Apare doar unde `can_auto_recheck = yes` sau `partial`.

## Ce afiseaza
- ce putem reverifica
- cand a fost ultima reverificare
- ce rezultat asteptam
- ce se intampla daca pica

## Exemple
- rescan website
- status nou factura
- artefact in link public
- vendor state schimbat
- spv status refresh

---

# 14. Revalidation block model

Apare pe finding-uri care pot reveni.

## Ce afiseaza
- last reviewed
- next review due
- de ce reapare
- ce trebuie reconfirmat

## Exemple
- politica veche
- DPA expirat
- vendor recheck
- trust center neactualizat
- assessment invechit

---

# 15. Meta block model

Trebuie sa existe in detail panel, dar nu neaparat sus.

## Contine
- owner
- assignee
- detected at
- updated at
- source
- confidence
- signal type
- framework
- audit log link

## Rule
Nu concureaza cu actiunea principala.

---

# 16. Layout logic al detail panel-ului

## Above the fold
1. Titlu + severity + framework
2. De ce conteaza
3. Ce poate face CompliScan acum
4. CTA principal
5. Dovada minima ceruta

## Below the fold
6. Pasii detaliati
7. Evidence block complet
8. Recheck / revalidation
9. Meta / audit

---

# 17. Mobile logic

Pe mobil, detail panel-ul devine:
- bottom sheet sau full screen sheet

## Above the fold pe mobil
- titlu
- severity
- status
- CTA principal
- 1 fraza: ce faci acum

## Restul
- accordion-uri:
  - De ce conteaza
  - Ce trebuie sa faci
  - Dovada
  - Detalii

---

# 18. Concluzie

Cockpit-ul matur nu inseamna doar multe finding-uri.
Inseamna ca fiecare finding are:
- o stare clara
- un CTA clar
- o dovada clara
- un mod clar de inchidere
- un mod clar de revenire la revalidation

Daca acest model este respectat, CompliScan nu mai pare un simplu to-do list.
Pare un sistem de rezolvare, dovada si continuitate.
