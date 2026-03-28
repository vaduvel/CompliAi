# CompliAi — Cleanup Hit List

## Rolul acestui document

Acesta este documentul de execuție brutală pentru cleanup.

Nu explică viziunea generală.
Nu redefinește canonul.
Nu rescrie sprint map-ul.

Acest document spune direct:

- ce păstrăm
- ce tăiem
- ce comasăm
- ce coborâm în secundar
- unde facem polish
- în ce ordine atacăm zonele produsului

Acesta este documentul după care un agent de cod sau o echipă de produs poate începe curățenia reală.

---

# 0. Regula generală

Pentru fiecare suprafață folosim aceeași grilă:

- **KEEP** = păstrăm
- **CUT** = tăiem din prim-plan sau eliminăm
- **MERGE** = comasăm cu altceva
- **DEMOTE** = coborâm în contextual / secundar
- **POLISH** = merită finisat premium

---

# 1. HOME

## KEEP
- snapshot clar
- ce se aplică firmei
- ce am găsit
- next best action
- acumulare / valoare clară

## CUT
- perete de widgeturi
- prea multe module de monitorizare în primul ecran
- blocuri care nu schimbă acțiunea imediată
- zone decorative care doar „arată inteligența”

## MERGE
- semnalele auxiliare într-o singură zonă:
  **Monitoring and details**

## DEMOTE
- benchmark
- framework readiness extins
- health / ops
- agent status
- cards de tip insight secundar
- calendar mini-panels
- feed-uri tehnice

## POLISH
- headline-ul
- next best action
- acumularea / progress value
- CTA-ul principal
- starea de empty / first value

## Target
Home trebuie să răspundă instant la:
- ce se aplică
- ce s-a găsit
- ce fac acum

---

# 2. LOGIN

## KEEP
- intrare simplă
- mesaj clar despre produs
- siguranță și încredere

## CUT
- orice deviație înainte de login
- orice jargon intern
- orice distragere

## MERGE
- nimic

## DEMOTE
- explicații prea lungi
- linkuri secundare inutile

## POLISH
- ecranul de login trebuie să arate premium și calm
- copy scurt
- form clar
- feedback de eroare curat

## Target
Userul trebuie să simtă:
**intru într-un produs serios, nu într-un tool experimental**

---

# 3. ONBOARDING

## KEEP
- alegerea modului de folosire
- CUI
- website
- verificări automate
- pașii de confirmare care chiar schimbă findings sau recomandările
- first snapshot
- next best action

## CUT
- pași care nu schimbă nimic real
- întrebări decorative
- confirmări redundante
- explicații prea lungi la fiecare pas

## MERGE
- toate confirmările finale într-un singur pas clar
- orice prefill și verificare într-un singur flow continuu

## DEMOTE
- detalii tehnice despre cum se calculează applicability
- semnale interne
- reasoning prea vizibil

## POLISH
- pasul „Compli verifică”
- momentul de first snapshot
- final screen-ul
- stările de sugestie automată / prefill

## Target
Onboarding trebuie să pară:
**inteligent, rapid, inevitabil util**

Nu:
**formular lung cu multe întrebări semi-utile**

---

# 4. FIRST SNAPSHOT / ONBOARDING FINISH

## KEEP
- asta ți se aplică
- asta am găsit
- asta faci acum
- legătura spre primul cockpit / first action

## CUT
- CTA-uri care concurează între ele fără motiv
- promisiuni prea late
- context repetat

## MERGE
- un singur moment de „valoare obținută”
- un singur mesaj principal de succes

## DEMOTE
- orice detaliu de sistem
- orice mențiune care nu schimbă pasul următor

## POLISH
- final screen-ul trebuie să fie puternic
- sentiment de progres real
- sentiment de „nu mai pornești de la zero”

## Target
Userul trebuie să simtă:
**ok, sistemul chiar m-a înțeles și mi-a pregătit drumul**

---

# 5. SCAN

## KEEP
- alegere sursă
- upload / input
- extract / review
- analyze
- handoff spre Resolve

## CUT
- tabs egale pentru flow / verdict / history în aceeași față principală
- moduri avansate afișate ca și cum ar fi centrul produsului
- competiția între text / manifest / yaml / site scan / agent mode în aceeași suprafață principală

## MERGE
- toate sursele într-un model comun de intake
- toate output-urile de scan într-o direcție clară spre findings

## DEMOTE
- history
- verdict center
- agent lab
- advanced specialist modes
- context blocks despre scan care nu schimbă pasul curent

## POLISH
- input states
- upload states
- extracting / analyzing states
- success handoff to Resolve

## Target
Scan trebuie să însemne doar:
**adaugi sursa -> sistemul analizează -> mergi la ce trebuie rezolvat**

Nu:
**încă un mini-produs în interiorul produsului**

---

# 6. FINDINGS LIST / RESOLVE LIST

## KEEP
- listă clară de cazuri active
- prioritizare
- severitate
- scurt „ce trebuie făcut”
- CTA clar către cockpit

## CUT
- carduri mari de explicație în listă
- execuție detaliată în listă
- monitoring, dosar și context greu deasupra CTA-ului
- expandări care fac lista să pară al doilea cockpit

## MERGE
- toate acțiunile serioase în cockpitul detail
- lista rămâne inbox + intrare

## DEMOTE
- detalii juridice
- proveniență
- monitoring
- close condition explicat lung
- rail-uri secundare

## POLISH
- row design
- severity hierarchy
- CTA clarity
- scanability
- density optimizată

## Target
Lista trebuie să răspundă la:
**ce este urgent și unde intru să rezolv**

---

# 7. FINDING COCKPIT

## KEEP
- problema
- impactul
- dovada cerută
- CTA-ul principal
- generator / input / upload
- confirmare
- închidere
- succes către dosar
- monitorizare după închidere

## CUT
- orice element care mută userul în alt centru de execuție pentru același finding
- explainability înaintea acțiunii
- CTA-uri concurente pentru aceeași stare
- blocuri lungi și pasive de context înainte de pasul util

## MERGE
- generarea
- dovada
- confirmarea
- închiderea
în același cockpit

## DEMOTE
- context juridic
- reasoning
- provenance
- rail-uri auxiliare
- explicațiile lungi

## POLISH
- hero action
- status transitions
- generator drawer
- success states
- closed / under monitoring state
- revalidation state
- reopened state

## Target
Aici trebuie să fie cel mai bun ecran din produs.

Acesta este:
**centrul de execuție al aplicației**

---

# 8. SUPPORT TASK BOARD

## KEEP
- task-uri auxiliare reale
- filtre utile pentru operatori
- legătura cu finding-ul părinte

## CUT
- orice pretenție de a fi centrul principal de rezolvare
- grouping excesiv care concurează cu findings list
- logică prea grea pentru userul standard

## MERGE
- task board-ul ca strat suport, nu centru operațional principal

## DEMOTE
- bulk actions avansate
- filtre specialist
- clustering sofisticat
- expert validation levels ca primă experiență

## POLISH
- task anchor către finding
- task cards doar dacă rămân vizibile după demotare

## Target
Task board-ul trebuie să pară:
**instrument auxiliar pentru echipa internă**
nu:
**inima produsului**

---

# 9. DOSSIER

## KEEP
- dovezi
- documente generate
- exporturi
- audit trail
- legătura cu cazurile rezolvate

## CUT
- comportament de centru operațional
- flow-uri de acțiune primară
- suprafețe duplicate pentru aceeași ieșire

## MERGE
- Documents
- Reports
- Vault
- Policies outputs
- Generator outputs
într-un singur Dossier

## DEMOTE
- tool-uri avansate de export
- share tools specialist
- inspector / audit detail prea sus

## POLISH
- evidence list
- generated docs list
- export center
- dossier success confirmation
- empty states

## Target
Dossier trebuie să răspundă la:
**ce am, ce pot arăta, ce pot exporta**

Nu:
**unde mai trebuie să intru ca să fac ceva**

---

# 10. MONITORING / FEED / UPDATES

## KEEP
- ce s-a verificat
- ce s-a schimbat
- ce s-a reaprins
- ce trebuie reverificat
- legătura clară înapoi la caz

## CUT
- feed tehnic
- wording robotic
- notificări fără valoare
- evenimente care nu conduc la acțiune clară

## MERGE
- drift
- revalidation
- reminders
- periodic checks
într-un limbaj comun și uman

## DEMOTE
- detaliile tehnice despre cum s-a detectat
- logging brut

## POLISH
- event wording
- urgency hierarchy
- CTA per event
- monitorizare „umană”, nu tehnică

## Target
Userul trebuie să simtă:
**produsul mă ține la curent și mă protejează**
nu:
**produsul îmi aruncă events în față**

---

# 11. NAVIGATION

## KEEP
- Home
- Scan
- Resolve
- Dossier
- Settings

## CUT
- nav principal prea lat
- prea multe destinații „aproape la fel de importante”

## MERGE
- outputs și audit assets sub Dossier
- tool-uri de domeniu sub contextual / specialist

## DEMOTE
- Calendar
- DSAR
- NIS2
- Fiscal
- Agents
- Vendor Review
- DORA
- Whistleblowing
- Policies
- Generator
- Vault
- Audit Log
- Trust Center
- Documents

## POLISH
- sidebar
- mobile nav
- active state clarity
- badge logic
- visual hierarchy

## Target
Userul trebuie să înțeleagă produsul din nav în sub 5 secunde.

---

# 12. COPY / WORDING

## KEEP
- limbaj uman
- limbaj operațional
- propoziții clare
- ce este problema / ce faci acum / ce rămâne

## CUT
- jargon intern
- explainability tehnică
- text care doar umple spațiu
- formulări abstracte

## MERGE
- toate pattern-urile de copy în același stil:
  - problemă
  - acțiune
  - dovadă
  - următor control

## DEMOTE
- legalese lung
- meta despre sistem
- descrieri decorative

## POLISH
- empty states
- success states
- CTA labels
- helper text
- warning text
- final screen wording

## Target
Produsul trebuie să sune:
**clar, calm, sigur, competent**
nu:
**tehnic, umflat, internist**

---

# 13. VISUAL POLISH

## KEEP
- component library coerent
- spațiere bună
- ierarhie bună
- stări vizuale curate
- badges utile

## CUT
- zgomot vizual
- prea multe densități diferite
- carduri fără scop
- multe contururi și box-uri doar ca să „pară enterprise”

## MERGE
- pattern-urile repetitive
- same visual grammar for:
  - list rows
  - cockpit cards
  - dossier cards
  - onboarding steps

## DEMOTE
- ornamentele care nu cresc claritatea
- culori de accent folosite prea des
- chip-uri decorative

## POLISH
- spacing system
- typography
- CTA prominence
- empty / success / warning states
- rail / card rhythm
- premium, mature visual finish

## Target
Produsul trebuie să pară:
**scump, sigur, controlat**
nu:
**aglomerat și foarte „feature-rich”**

---

# 14. HIT ORDER — unde dăm cu toporul întâi

## Wave 1 — obligatoriu
1. Navigation
2. Home
3. Scan
4. Resolve list
5. Finding cockpit alignment
6. Dossier merge

## Wave 2 — obligatoriu pentru client-ready premium
7. Monitoring / feed wording
8. Copy cleanup
9. Visual polish across core flow
10. Empty / success / loading states

## Wave 3 — doar după ce primele două sunt curate
11. Specialist modules
12. Partner / portfolio niceties
13. Advanced exports / inspector tools
14. Secondary domain panels

---

# 15. Ce verificăm după fiecare cleanup

După fiecare schimbare trebuie să fie mai adevărate lucrurile astea:

1. produsul pare mai mic la suprafață
2. flow-ul principal este mai clar
3. userul ajunge mai repede la pasul util
4. finding-ul se rezolvă mai mult în cockpit, mai puțin în alte locuri
5. dosarul pare mai mult un output center, mai puțin un hub paralel
6. scan-ul pare mai mult intake, mai puțin mini-produs
7. home-ul pare mai mult orientare, mai puțin dashboard wall

Dacă schimbarea face opusul, a fost o greșeală.

---

# 16. Testul final

Întrebarea care decide tot:

## Poate userul să intre, să înțeleagă, să rezolve un caz, să lase dovada și să fie ținut la curent fără să se piardă între 3 centre diferite?

Dacă nu, cleanup-ul nu este terminat.

## Al doilea test:
Produsul arată acum ca ceva ce poți pune în fața unui client fără să explici 5 minute „cum să te orientezi”?

Dacă nu, mai tăiem.

---

# 17. Rezumat brutal

Nu ne mai trebuie:
- mai multe suprafețe
- mai multe intrări
- mai multe explicații
- mai multe hub-uri

Ne trebuie:
- un traseu
- un cockpit real
- un dosar clar
- monitorizare vie
- UI premium
- flow fără ping-pong

Asta este hit list-ul.

Asta este curățenia reală.
