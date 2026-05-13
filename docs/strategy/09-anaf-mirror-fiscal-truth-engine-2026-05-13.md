# ANAF Mirror / Fiscal Truth Engine
## Produsul pe care contabilii nu știu încă să-l ceară, dar îl vor considera inevitabil când îl văd

**Data:** 13 mai 2026  
**Scop:** definirea produsului-bombă care mută CompliAI din „modul fiscal foarte bun” în „instrument inevitabil pentru cabinete contabile și IMM-uri din România”  
**Status:** document de direcție produs / positioning / execuție strategică

---

## 1. Teza centrală

Piața nu mai are nevoie de încă un validator fiscal.

Piața nu mai are nevoie de încă un dashboard cu alerte.

Piața nu mai are nevoie de încă un tool care doar spune că există o problemă.

**Piața are nevoie de un motor care reconstruiește adevărul fiscal al firmei înainte să îl reconstruiască ANAF.**

Asta este produsul.

Nu validator. Nu ERP. Nu soft de contabilitate. Nu simplu copilot.

**ANAF Mirror / Fiscal Truth Engine** este stratul care:
- adună toate fragmentele fiscale și operaționale din firmă,
- le corelează,
- detectează unde se rupe lanțul,
- spune ce dovadă lipsește,
- estimează riscul și impactul,
- ghidează remedierea,
- păstrează audit trail complet,
- și face totul înainte ca ANAF să lovească prin notificare, control, blocaj sau recalcul.

Produsul nu răspunde la întrebarea:
**„Este XML-ul valid?”**

Produsul răspunde la întrebarea:
**„Ce crede ANAF că este adevărat despre acest client, unde ne putem rupe, ce lipsește și ce facem azi ca să închidem gaura?”**

---

## 2. Problema reală din piață

Contabilii spun că au probleme cu:
- SPV,
- e-Factura,
- SAF-T,
- certificate,
- notificări,
- deadline-uri,
- ERP-uri,
- clienți care trimit documente târziu,
- diferențe între declarații,
- și munca de remediere.

Asta este suprafața.

### Problema reală, dedesubt

Problema reală nu este lipsa unui tool punctual.

Problema reală este că adevărul fiscal al firmei este fragmentat între:
- ERP,
- XML-uri,
- recipise SPV,
- SAF-T,
- declarații,
- extrase,
- PDF-uri,
- AGA,
- mesaje ANAF,
- emailuri,
- WhatsApp,
- memorie umană.

Rezultatul:
- fiecare piesă pare „aproape bună” separat,
- dar nimeni nu verifică dacă toate piesele se pupă între ele,
- iar ANAF este prima entitate care vede ruptura ca sistem, nu contabilul.

### Formula problemei

**Contabilitatea românească nu crapă doar din lipsă de date. Crapă din lipsă de coerență între date, documente, roluri, termene și dovezi.**

Acolo trebuie lovit produsul.

---

## 3. Insight-ul latent

Contabilii nu formulează încă limpede produsul de care au nevoie.

Ei cer:
- să meargă SPV,
- să nu mai fie respinse facturi,
- să nu le expire certificatul,
- să primească remindere,
- să aibă explicații,
- să nu mai stea în Excel și telefon.

Dar ce vor de fapt, fără să o spună direct, este:

### **un chief of staff fiscal**
Un sistem care:
- ține minte tot,
- vede tot lanțul,
- cere ce lipsește,
- știe ce e urgent și ce nu,
- separă semnalul de zgomot,
- spune ce document e greșit,
- spune ce dovadă lipsește,
- spune cine trebuie să acționeze,
- explică de ce,
- și lasă urmă defensabilă pentru CECCAR / client / ANAF / auditor.

Asta este „produsul de vis”.

---

## 4. Definiția produsului

## ANAF Mirror / Fiscal Truth Engine

### Definiție scurtă
Un motor de adevăr fiscal care stă peste ERP-urile și fluxurile existente, corelează documente și raportări, detectează inconsistențe economice și juridico-fiscale, cere dovezile lipsă și ghidează remedierea cu audit trail complet și aprobare umană.

### Definiție comercială
**Nu îți schimbăm ERP-ul. Îți arătăm unde se rupe adevărul fiscal al clientului înainte să ți-l arate ANAF.**

### Definiție tehnică
Sistem de ingestie + normalizare + corelare cross-document + scoring de risc + evidence orchestration + remediation workflow + defensibility layer.

---

## 5. Momentul „wow” care îl face inevitabil

Produsul trebuie să producă un moment pe care utilizatorul îl ține minte și îl povestește altora.

### Momentul wow ideal
Contabilul apasă un singur buton:

## „Dacă ANAF ar verifica azi clientul ăsta, unde pic prima dată?”

Sistemul răspunde imediat:
- **Risc 1:** baza TVA din D300 nu corespunde cu vânzările reale pe luna aprilie
- **Risc 2:** există 3 facturi transmise în ERP, dar fără recipisă SPV asociată
- **Risc 3:** SAF-T pe martie are semnale de rectificare recurentă și conturi slab standardizate
- **Risc 4:** dividendele distribuite în AGA nu se pupă cu beneficiarii raportați
- **Risc 5:** lipsește dovada critică pentru susținerea unei poziții fiscale

Pentru fiecare risc, sistemul afișează:
- suma potențial afectată,
- nivelul de severitate,
- documentele sursă,
- dovada lipsă,
- următorul pas,
- owner-ul recomandat,
- și butonul de remediere.

Asta nu este „încă o alertă”.
Asta este **o oglindă fiscală operațională**.

---

## 6. Cele 5 capabilități care îl fac inevitabil

## 6.1 Cross-Document Correlation Engine
### Miezul produsului

Acesta este diferențiatorul real.

Nu doar validează documente separat.
Compară documente între ele.

### Ce face
Corelează:
- facturi ↔ D300
- facturi ↔ recipise SPV
- ERP ↔ SPV
- SAF-T ↔ D300 / D394 / D390
- AGA ↔ dividende ↔ D205 ↔ D100
- asociați ↔ beneficiari plătiți
- calendar așteptat ↔ depuneri reale
- frecvență declarativă ↔ comportament efectiv

### Ce detectează
- document valid tehnic, dar greșit economic
- declarație corect completată formal, dar nealiniată cu operațiunea
- beneficiar raportat diferit de structura societății
- depuneri existente fără suport documentar suficient
- tranzacții raportate care nu se pupă cu seria, fluxul sau perioada

### Ce produce
- finding de inconsistență cross-document
- diff vizual între surse
- impact estimat
- severitate
- remediere recomandată

### Mesaj comercial
**„SmartBill validează factura. Saga calculează declarația. Noi verificăm dacă factura, declarația și realitatea fiscală chiar se pupă între ele.”**

---

## 6.2 Missing Evidence Hunter
### Funcția pe care utilizatorii nu o cer explicit, dar o vor iubi instant

Majoritatea toolurilor detectează problema.
Puține spun ce dovadă lipsește.
Aproape niciunul nu orchestrează strângerea dovezii.

### Ce face
Pentru fiecare finding critic, sistemul spune:
- ce document lipsește,
- cui trebuie cerut,
- în ce format,
- până când,
- ce risc rămâne dacă nu este furnizat,
- și ce flux depinde de acel document.

### Exemple de dovezi lipsă
- recipisă SPV
- extras bancar pe interval
- contract / împuternicire
- AGA semnată
- declarație depusă din SPV
- document vamal
- confirmare de plată
- justificare diferență P300

### Workflow ideal
- sistemul generează cererea de document
- o trimite clientului / responsabilului
- urmărește dacă a fost primit
- verifică dacă este corect
- închide sau redeschide finding-ul
- păstrează audit trail

### Mesaj comercial
**„Nu doar îți spunem ce e greșit. Îți spunem ce lipsește ca să poți susține poziția fiscală.”**

---

## 6.3 Pre-ANAF Simulation
### Butonul care face produsul memorabil

### Ce face
Simulează punctele de ruptură pe care le-ar vedea un control sau un sistem automat ANAF, pe baza datelor disponibile.

### Output
- top 5 riscuri active
- impact estimat pe fiecare
- probabilitate de escalare
- documente suport existente / lipsă
- ordine optimă de remediere
- scor de expunere per client

### De ce contează
Contabilul nu mai lucrează reactiv după notificare.
Trece în mod preventiv din:
- „rezolv când mă lovește”
în
- **„știu ce mă poate lovi și în ce ordine închid expunerea.”**

### Mesaj comercial
**„Vezi ce ar vedea ANAF mâine, nu după ce vine mesajul.”**

---

## 6.4 Client Burden Index
### Feature-ul managerial cu lipici enorm pentru cabinete

Nu toți clienții sunt egali.
Unii produc disproporționat:
- excepții,
- muncă manuală,
- urmărit dovadă,
- retransmiteri,
- rectificări,
- stres.

### Ce face
Calculează, per client:
- număr de excepții / lună
- timp estimat consumat
- repetitivitate probleme
- risc fiscal activ
- lipsă documente suport
- fee vs burden
- comportament de răspuns la solicitări

### Ce oferă cabinetului
- top 10 clienți toxici operațional
- top 10 clienți subtarifați
- top 10 clienți cu risc latent mare
- recomandări de repricing / disciplinare / educare / offboarding

### Mesaj comercial
**„Îți arătăm nu doar cine are probleme fiscale, ci și care client îți mănâncă viața și profitul.”**

---

## 6.5 Authority & Mandate Guardian
### Feature-ul banal la suprafață, devastator ca utilitate reală

O parte din haos nu vine din fiscalitate pură.
Vine din:
- roluri,
- împuterniciri,
- certificate,
- lipsa contractelor,
- reprezentare incompletă,
- drepturi neclare de submit.

### Ce face
Ține evidența și verifică:
- certificat digital valid / expirat
- tipul de acces per client
- existența contractului / împuternicirii
- drepturile de reprezentare
- cine poate depune
- cine poate doar vedea
- cine este owner pe remediere

### Rezultatul
Nu mai ai situații absurde de tip:
- „utilizator neautorizat”
- „nu știam că nu mai e valid certificatul”
- „noi am depus, dar nu mai aveam dreptul / mandatul corect”

### Mesaj comercial
**„Ținem în picioare infrastructura invizibilă fără de care niciun flux fiscal nu merge.”**

---

## 7. Arhitectura conceptuală a produsului

## L0 — Systems of record
- SmartBill
- Oblio
- Saga
- SPV / ANAF
- SAF-T
- XML / PDF / OCR
- extrase bancare
- AGA / stat plată / contracte
- email / attachments / upload

## L1 — Ingestion & normalization
- parsere
- OCR
- mapping semantic
- tipare documentare
- deduplicare
- versionare documente

## L2 — Fiscal truth graph
- noduri: documente, declarații, plăți, recipise, entități, persoane, roluri, perioade
- muchii: „susține”, „contrazice”, „depinde de”, „derivă din”, „acoperă”, „lipsește”

## L3 — Correlation engine
- reguli cross-document
- reguli cross-period
- reguli cross-source
- reguli de consistență juridico-fiscală

## L4 — Risk & burden engine
- severitate
- impact estimat
- probabilitate escalare
- burden per client
- trend recurent

## L5 — Evidence orchestration
- missing evidence detection
- request generation
- owner routing
- deadline
- completion tracking

## L6 — Remediation workflow
- next best action
- explainability
- remediation path
- approval flow
- retry / retransmit
- human in the loop

## L7 — Defensibility layer
- audit trail
- hash chain
- before / after
- justificare
- export audit pack
- proof bundle per client / perioadă / incident

---

## 8. Ce NU este produsul

Pentru a rămâne clar și inevitabil, produsul nu trebuie să devină:
- ERP nou
- soft de facturare generalist
- soft de contabilitate complet
- chatbot generic fiscal fără context
- bibliotecă amorfă de tooluri disparate
- generator de PDF-uri fără logică

### Anti-goal strategic
**Nu concurăm cu sistemele de origine. Concurăm cu haosul dintre ele.**

---

## 9. UX doctrine

## 9.1 Copilot, nu autopilot
AI propune.
Regulile verifică.
Omul aprobă.
Sistemul păstrează dovada.

## 9.2 Un singur queue de excepții
Nu 14 ecrane care strigă separat.
Un singur loc unde contabilul vede:
- ce e critic azi
- ce poate aștepta
- ce client produce zgomot
- ce trebuie cerut
- ce trebuie aprobat
- ce document lipsește

## 9.3 Fiecare finding are 6 răspunsuri obligatorii
1. Ce s-a rupt  
2. De ce contează  
3. Ce documente susțin problema  
4. Ce dovadă lipsește  
5. Ce fac acum  
6. Cine trebuie să acționeze  

## 9.4 Arată bani și timp, nu doar scoruri
Nu doar:
- risk score 72
- hygiene score 61

Ci:
- TVA afectat estimat: 18.240 lei
- timp consumat probabil: 1h 40m
- risc de retransmitere: ridicat
- 3 documente lipsă blochează închiderea

---

## 10. Ce trebuie împins în față comercial

### Mesaj principal
**Îți arătăm adevărul fiscal real al clientului înainte să ți-l arate ANAF.**

### Mesaj secundar
**Prindem inconsistențele fiscale pe care ERP-ul nu le vede.**

### Mesaj demonstrativ
**Nu doar validăm XML-uri. Corelăm facturi, declarații, recipise, plăți și dovezi, apoi îți spunem unde se rupe lanțul și ce lipsește ca să îl închizi.**

### Mesaj pentru cabinete
**Mai puține excepții, mai puține rectificări, mai puține nopți pierdute pe clienții care produc haos.**

### Mesaj pentru CFO / owner
**Mai puțin risc fiscal, mai mult control asupra adevărului operațional din firmă.**

---

## 11. Roadmap care chiar mută produsul

## Faza 1 — Inevitability Core
Obiectiv: produsul să devină imposibil de ignorat

### Build obligatoriu
1. Cross-Document Correlation Engine  
2. Missing Evidence Hunter  
3. Pre-ANAF Simulation  
4. Master Exception Queue  
5. Economic Impact Layer  

### Rezultat
Produsul nu mai este „modul fiscal mare”.
Devine **Fiscal Truth Engine**.

## Faza 2 — Cabinet Intelligence
Obiectiv: să devină lipicios și managerial

### Build obligatoriu
1. Client Burden Index  
2. Portfolio heatmap  
3. Root cause clustering  
4. Team routing / workload insight  
5. Repricing recommendations  

### Rezultat
Produsul nu mai optimizează doar conformarea.
Optimizează cabinetul.

## Faza 3 — Authority & Governance Layer
Obiectiv: să reducă blocajele administrative și de acces

### Build obligatoriu
1. Authority & Mandate Guardian  
2. Contract / împuternicire tracker  
3. Role matrix  
4. Certificate lifecycle control  
5. Representation status per client  

### Rezultat
Produsul ține funcțional și infrastructura invizibilă din jurul fiscalului.

---

## 12. Ce trebuie tăiat din focus

Aceste lucruri pot exista, dar nu trebuie să conducă produsul:
- CPV tool ca vedetă
- PFA deadline microscopice ca narativ principal
- chat generic fără acțiune
- prea multe mini-carduri de dashboard
- features „drăguțe” care nu reduc risc, timp sau haos

### Regula simplă
Dacă un feature nu:
- prinde o ruptură,
- cere o dovadă,
- reduce un risc,
- accelerează remedierea,
- sau explică de ce s-a rupt,

atunci nu trebuie să stea în centrul produsului.

---

## 13. Cum se vinde fără să pară science-fiction

Nu promite:
- că AI știe tot
- că elimină contabilul
- că repară fiscalitatea singur
- că „nu mai ai nevoie de expertiză”

Promite:
- că vede lanțul complet
- că găsește rupturile dintre surse
- că cere ce lipsește
- că arată următorul pas optim
- că lasă dovadă defensabilă

### Formula corectă
**Copilot de adevăr fiscal, nu autopilot contabil.**

---

## 14. One-liner final

### Varianta dură
**ANAF Mirror este motorul care reconstruiește adevărul fiscal al clientului tău înainte să-l reconstruiască ANAF.**

### Varianta comercială
**Un layer peste ERP și SPV care corelează documente, declarații, recipise și dovezi, detectează rupturile și îți spune exact ce ai de făcut.**

### Varianta pentru cabinet contabil
**Prindem inconsistențele fiscale pe care softurile tale nu le văd și îți spunem ce dovadă lipsește ca să închizi riscul.**

---

## 15. Concluzia brutală

Produsul inevitabil nu este cel care are cele mai multe funcții.

Produsul inevitabil este cel care:
- vede ceva ce nimeni altcineva nu vede,
- explică limpede de ce contează,
- transformă haosul în ordine,
- și reduce munca manuală exact în punctul unde azi se pierd bani, timp și nervi.

### Adevărul strategic
Validatorii pot fi copiați.
Dashboard-urile pot fi copiate.
OCR-ul poate fi copiat.
Un chat fiscal poate fi copiat.

Dar un sistem care:
- reconstruiește adevărul fiscal,
- corelează documente și raportări,
- urmărește dovezi lipsă,
- prioritizează excepții,
- și lasă urmă defensabilă,

este mult mai greu de copiat și mult mai ușor de iubit.

### Decizie
Dacă vrem un produs pe care contabilii să îl descrie ca „așa ceva credeam că există doar în vis”, atunci direcția nu este încă un layer de validare.

Direcția este:

# **ANAF Mirror / Fiscal Truth Engine**
# **motorul care spune ce este adevărat fiscal, unde se rupe lanțul și ce trebuie făcut azi ca să închizi gaura.**

