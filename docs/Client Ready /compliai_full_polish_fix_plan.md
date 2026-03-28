# CompliAi — Full Polish & Fix Plan

## Rolul documentului

Acest document adună într-un singur loc toate observațiile și deciziile de polish / cleanup pentru:
- landing page
- pricing page
- onboarding
- first snapshot
- resolve list
- finding cockpit / smart resolve cockpit
- generator drawer
- dovadă reală, scanare și validare
- success moment
- dossier / monitoring

Scopul lui este:
- să taie zgomotul
- să facă produsul mai clar
- să facă flow-ul mai scurt
- să facă suprafața mai premium
- să închidă găurile reale din flow
- să ducă produsul la client-ready

---

# 1. Regula mare

## Un finding = un cockpit = un singur loc de execuție

După ce userul deschide un finding, trebuie să poată face din același cockpit:

1. să înțeleagă problema
2. să vadă ce face acum
3. să genereze documentul, dacă finding-ul cere document
4. să scaneze / valideze documentul sau artefactul rezultat
5. să îl atașeze ca dovadă reală
6. să confirme
7. să închidă cazul
8. să trimită rezultatul la dosar
9. să lase cazul în monitorizare

Dacă lipsește oricare dintre pașii de mai sus, cockpitul nu este încă complet.

---

# 2. Gaură critică identificată

## Lipsește etapa de scanare / validare a dovezii în cockpit

### Problema
În flow-ul actual:
- userul generează politica
- confirmă draftul
- o salvează ca dovadă în Vault / Dosar

Dar:
- nu există un pas clar de **scanare / validare a artefactului final**
- nu există un loc clar unde documentul generat este trecut printr-un control real
- nu există un step explicit în cockpit pentru:
  - verificare conformitate finală a documentului
  - re-scan / validate
  - marcarea lui ca **dovadă adevărată și validată**

### De ce e grav
Un document generat nu este automat o dovadă reală suficientă.
Dacă nu există:
- scan
- validare
- confirmare clară că este bun pentru acel risk
atunci cockpitul sare prea repede de la draft la dovadă.

### Decizia
Cockpitul trebuie să includă explicit un bloc nou:

## `Scan / Validate evidence`

### Poziție în flow
Flow-ul devine:

1. Detectat
2. Pregătești draftul
3. **Scanezi / validezi dovada**
4. Dovadă la dosar
5. Monitorizat

### Ce trebuie să facă acest bloc
- primește documentul generat sau documentul extern uploadat
- îl rulează prin controlul relevant
- arată:
  - valid / invalid
  - ce lipsește
  - ce trebuie corectat
- permite:
  - re-generate
  - edit / replace
  - re-scan
- doar după rezultat valid permite:
  - `Confirm și salvez dovada`

### Regula
**Nu se poate salva dovada finală fără un pas clar de validare / scanare acolo unde finding-ul cere document sau artefact validabil.**

---

# 3. Landing Page — ce se taie și ce rămâne

## Probleme
Landing-ul actual:
- spune prea multe povești simultan
- repetă aceeași idee de prea multe ori
- schimbă firul între:
  - problemă
  - flow
  - pentru cine e
  - pricing
- are prea multe secțiuni cu același rol

## Decizii

### KEEP
- headline-ul central
- ideea de:
  - afli ce ți se aplică
  - rezolvi ce lipsește
  - păstrezi dovada
- CTA principal
- structura în 3 pași

### CUT
- blocul generic de tip „Problema” dacă nu aduce specificitate nouă
- cardurile mari „pentru IMM / consultant / compliance intern” în forma actuală
- repetițiile dintre:
  - hero
  - 3 pași
  - „ce primești”
- textul prea vag despre avocați, consultanți, Excel etc.

### MERGE
Landing-ul trebuie să spună o singură poveste:

**Pornim din firmă -> găsim ce se aplică -> deschizi un caz -> rezolvi -> salvezi dovada -> rămâi sub watch**

### STRUCTURĂ NOUĂ
1. Hero
2. 3 pași
3. 3 rezultate
4. Pricing simplu
5. Footer

### POLISH
- mai puțin text centrat
- mai puține blocuri repetitive
- CTA-ul să fie susținut de restul paginii
- claritate comercială mai mare
- mai puțină „poezie”, mai multă direcție

---

# 4. Pricing Page — ce se schimbă

## Probleme
Pricing-ul actual:
- e mai bun decât landing-ul
- dar încă vinde feature-uri, nu rezultate
- are prea mult text de tip intern / startup
- cardurile arată prea multe bullets
- comparația e prea rece și prea lungă

## Decizii

### KEEP
- cele 3 planuri: Gratuit / Pro / Partner
- evidențierea Pro
- tabelul comparativ

### CUT
- formulări de tip:
  - „prețurile sunt ipoteze de validare de piață”
- prea multe bullets în cardurile de sus
- listări repetitive identice și în carduri și în tabel

### MERGE
Fiecare plan trebuie vândut prin rezultat:

#### Gratuit
Vezi ce ți se aplică și ce îți lipsește.

#### Pro
Rezolvi findings, generezi documente și păstrezi dosarul.

#### Partner
Operezi pentru mai mulți clienți, cu queue, export și handoff clar.

### STRUCTURĂ NOUĂ
- hero de pricing mai clar
- carduri cu max 5–6 bullets
- tabel comparativ grupat pe:
  - diagnostic
  - operare
  - multi-client

### POLISH
- mai puțin feature dump
- mai multă claritate de decizie
- CTA-uri mai bune:
  - Începe gratuit
  - Pornește Pro — trial
  - Vorbește cu noi pentru Partner

---

# 5. Onboarding — ce se păstrează și ce se compactează

## Ce este bun
- flow-ul este liniar
- nu te plimbă prin pagini
- are progres clar
- promite first snapshot, nu doar formular
- pasul „Compli verifică” este bun
- CUI + website înainte de chestionar este corect

## Probleme
- prea mult text pe aproape fiecare ecran
- prea multe straturi vizuale pentru pași simpli
- selectorul de rol e prea egal
- cardul „mod selectat” este redundant
- chestionarul începe să pară muncă
- prea multe chips / opțiuni mici
- sub-stările pasului 2 par prea ambalate

## Decizii

### KEEP
- layout stânga + dreapta
- mesajul:
  - „Îți pregătim primul snapshot, nu te plimbăm prin pagini”
- rail-ul cu pașii
- CUI + website
- verificarea automată
- chestionarul inteligent
- first snapshot

### CUT
- 30–40% din text
- badge-uri care nu aduc valoare reală
- explicații redundante
- cardul mare „mod selectat” în forma actuală
- prea mult framing pentru sub-pași

### MERGE
Pasul 2 trebuie să pară doar:
1. Date firmă
2. Verificare automată
3. Întrebări rămase

nu 5 mini-scene diferite.

### POLISH
- rolul default trebuie să fie mai clar
- mai puține opțiuni vizuale simultane
- întrebările să pară confirmări inteligente, nu survey
- progresul rămas să fie mai vizibil
- fiecare răspuns să pară că scurtează munca ulterioară

---

# 6. First Snapshot — ce rămâne și ce moare

## Probleme
Există două momente prea apropiate:
1. snapshot-ul mare cu:
   - ce se aplică
   - ce am găsit deja
   - ce merită pregătit
   - ce faci acum
2. ecranul separat:
   - „Primul snapshot este gata”

Astea dublează aceeași funcție.

## Decizii

### CUT
- ecranul separat de tip:
  **„Primul snapshot este gata”**

### KEEP
- un singur snapshot real, detaliat

### STRUCTURA CORECTĂ
Snapshot-ul final trebuie să aibă doar 3 blocuri primare:

1. **Ce se aplică**
2. **Ce am găsit deja**
3. **Ce faci acum**

### DEMOTE
- „ce merită pregătit”
- smart prefill din facturi
- alte sugestii auxiliare

Astea merg:
- sub fold
- într-un expandable
- sau ca sugestii secundare

### POLISH
- „Ce faci acum” trebuie să fie blocul dominant
- nu încă un card egal cu restul

---

# 7. Resolve List — ce se păstrează și ce se taie

## Ce este bun
- acum arată ca inbox
- severitate, status, intrare în caz
- sidebar-ul e mult mai sănătos

## Probleme
- încă poate deveni prea descriptiv dacă nu e ținut scurt
- trebuie să rămână clar că execuția se întâmplă în cockpit

## Decizii

### KEEP
- titlu finding
- severitate
- status scurt
- scurt „ce trebuie făcut”
- CTA / intrare în caz

### CUT
- orice card mare de explicație în listă
- execuție serioasă în listă
- monitorizare sau dosar prea vizibile aici

### RULE
Resolve List = inbox + intrare în cockpit

### POLISH
- densitate bună
- scanabilitate
- CTA clar
- ritm vizual mai bun între rânduri

---

# 8. Finding Cockpit — polish și simplificare

## Ce este bun
- cazul este clar
- există CTA principal
- generatorul rămâne în același context prin drawer
- există trecere spre dosar și monitorizare
- success moment-ul cu dovadă salvată e bun

## Probleme
Sub primul CTA apar prea devreme:
- progres, dosar și monitorizare
- harta de progres mare
- cum se închide corect
- asset recomandat
- dosar
- monitoring
- contextul cazului

Asta înseamnă că încă se vede prea multă infrastructură.

## Decizii

### KEEP
- hero cu cazul
- blocul „Acum faci asta”
- generatorul
- confirmarea
- închiderea
- success state
- dosar
- monitoring

### CUT from above the fold
- context juridic lung
- provenance
- source metadata
- rail-uri mari
- explicații înainte de acțiune

### DEMOTE below the fold
- progress
- close condition
- asset recomandat
- dosar details
- monitoring details
- contextul complet al cazului

### RULE
Sus trebuie să rămână doar:
1. ce e problema
2. ce faci acum
3. acțiunea
4. scan/validate
5. confirmă și salvează

### POLISH
- hero action mai dominant
- stepper mai discret
- copy mai scurt
- mai puține blocuri egale ca greutate
- drawer mai compact

---

# 9. Generator Drawer — ce se schimbă

## Ce este bun
- contextul rămâne pe aceeași pagină
- completezi
- generezi
- vezi draftul
- confirmi
- salvezi

## Probleme
- prea mult spațiu și framing
- încă lipsește pasul de validare reală a artefactului
- e prea mult „draft -> confirm” și prea puțin „draft -> validate -> approve as evidence”

## Decizii

### KEEP
- formularul
- preview-ul
- checklist-ul de confirmare
- confirmă și salvează dovada

### ADD
- bloc de scan / validate evidence
- valid / invalid state
- re-generate
- replace / upload
- re-scan

### FLOW NOU
1. Completezi datele
2. Generezi draftul
3. Verifici draftul
4. **Scanezi / validezi artefactul**
5. Dacă trece:
   - confirmi și salvezi dovada
6. Dacă nu trece:
   - regenerezi / corectezi / înlocuiești / re-scannezi

### POLISH
- drawer mai dens și mai clar
- mai puține separatoare
- mai multă evidențiere pe pasul activ

---

# 10. Dovadă reală și scanare — implementare obligatorie

## Block nou recomandat în cockpit

### Nume propus
`Validează dovada`
sau
`Scanează și validează documentul`

### Unde apare
După generare și înainte de salvarea finală la dosar.

### Ce trebuie să afișeze
- document curent
- status validare
- verificări trecute / picate
- ce trebuie corectat
- butoane:
  - Re-scannează
  - Regenerează
  - Înlocuiește documentul
  - Confirm și salvez dovada

### Regula
Dacă finding-ul este de tip documentar sau cere artefact validabil:
- nu se poate merge direct de la draft la dovadă finală fără scan / validate

### Output final
Doar după validare:
- dovada este „adevărată”
- finding-ul se poate închide corect
- intră la dosar
- intră în monitoring

---

# 11. Success Moment — ce se păstrează și ce se curăță

## Ce este bun
Ecranul / blocul:
- „Dovadă salvată la dosar”
- artifact
- finding sursă
- salvat
- următor control
- buton Vault
- buton audit log
este foarte bun ca direcție.

## Probleme
- încă poate fi puțin prea mare
- trebuie să fie clar că e final de buclă, nu alt hub de explorat
- butonul principal trebuie să fie foarte clar

## Decizii

### KEEP
- artifact
- sursă
- saved time
- next control
- buton către Vault / Dosar

### CUT
- prea mult context redundant
- prea multe mesaje paralele

### POLISH
- sentiment clar de „ai închis cazul”
- liniște vizuală
- un CTA principal
- un CTA secundar maxim

---

# 12. Dosar / Vault / Monitoring — ce se schimbă

## Ce este bun
- există legătură între finding, dovadă și monitoring
- next control este clar

## Probleme
- dacă sunt afișate prea sus în cockpit, concurează cu execuția
- trebuie să fie simțite ca output / aftercare, nu ca parte dominantă a rezolvării

## Decizii

### KEEP
- dosar
- Vault
- next control
- monitoring status
- reopen logic

### DEMOTE in cockpit
- detaliile complete despre dosar și monitoring

### POLISH
- Dosar trebuie să fie:
  - clar
  - asset center
  - output center
- Monitoring trebuie să fie:
  - protector
  - clar
  - uman

---

# 13. Copy / visual polish cross-flow

## Copy
### KEEP
- ton clar
- ton calm
- ton competent

### CUT
- jargon intern
- explicații inutile
- text care doar umple

### RULE
Fiecare ecran trebuie să răspundă rapid la:
- ce este asta
- ce fac acum
- ce urmează

## Visual
### KEEP
- dark aesthetic
- structură modulară
- side rail pe onboarding
- CTA-urile albastre

### CUT
- prea multe straturi egale
- prea multe carduri grele
- prea mult spațiu mort
- prea multe micro-badges

### POLISH
- spacing
- ierarhie
- densitate controlată
- blocurile primare să domine
- blocurile secundare să tacă

---

# 14. Ordinea recomandată de implementare

## Phase 1
- tai ecranul „Primul snapshot este gata”
- simplifici snapshot-ul mare
- faci „Ce faci acum” dominant

## Phase 2
- cureți finding cockpit above the fold
- cobori progress / dossier / monitoring
- faci CTA-ul principal și execuția centrale

## Phase 3
- adaugi blocul:
  **Scan / Validate evidence**
- legi salvarea finală de validarea reală

## Phase 4
- compactezi drawer-ul
- faci success moment-ul mai curat
- polish vizual și de copy pe întreg flow-ul

---

# 15. Testul final de validare

Flow-ul este bun doar dacă userul poate:

1. intra în onboarding
2. primi un snapshot clar
3. vedea ce se aplică
4. vedea ce s-a găsit
5. vedea clar ce face acum
6. intra pe un finding
7. genera documentul necesar
8. **scana / valida documentul**
9. salva documentul ca dovadă reală
10. închide cazul
11. vedea că a intrat la dosar
12. ști că rămâne sub monitorizare

Dacă lipsește pasul 8, flow-ul nu este încă suficient de robust.

---

# 16. Rezumat brutal

Ce este bun acum:
- ai flow real
- ai coloană vertebrală
- onboarding -> snapshot -> resolve -> cockpit -> dosar -> monitoring există

Ce nu este încă suficient:
- încă sunt prea multe straturi vizibile
- snapshot-ul dublează un ecran
- finding cockpit arată prea multă infrastructură
- lipsește validarea reală a dovezii

Ce trebuie făcut:
- mai tai
- mai cobori
- faci next action dominant
- introduci scan / validate evidence
- apoi faci polish mare

Asta este forma corectă pentru a duce produsul la client-ready.
