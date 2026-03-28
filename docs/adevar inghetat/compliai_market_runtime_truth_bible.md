# CompliAI — Market + Runtime Truth Bible

## Status
Document canonic de lucru.
Combină:
- adevărul de piață pentru cei 3 useri principali
- adevărul de runtime din auditul 1:1
- adevărul de produs stabilit în discuțiile anterioare
- target state-ul corect
- ordinea de corecție și maturizare

Acest document trebuie folosit de:
- Founder / Product
- UX / UI
- Engineering
- QA
- Marketing / Sales
- Customer Success

---

# 0. De ce există documentul

Aplicația există deja.
Are:
- motor
- rutare
- onboarding
- findings
- cockpit
- dosar
- monitorizare
- suite specialist

Dar până acum au existat două probleme mari:

## Problema 1
Produsul a fost construit mai întâi în jurul ideii:
- „ce trebuie să facă”
și prea puțin în jurul ideii:
- „în ce ordine trebuie să trăiască pentru fiecare user”

## Problema 2
Exista până acum două adevăruri separate:
- adevărul de piață / comportament / cumpărare
- adevărul de runtime / cod / flow real

Acest document le unește.

---

# 1. Surse de adevăr

## 1.1 Adevăr de piață
Concluziile despre cele 3 personas și despre comportamentul lor de cumpărare și utilizare.

## 1.2 Adevăr de runtime
Auditul 1:1 făcut pe aplicația actuală.
Acesta rămâne sursa de adevăr pentru:
- ce există în cod
- ce funcționează
- ce deviază
- ce minte
- ce este doar target și nu actual truth

## 1.3 Adevăr de produs
Regula de fier și spine-ul produsului.

---

# 2. Formula produsului

CompliAI nu este:
- dashboard generic
- tool de scanare
- generator de documente
- centru de rapoarte
- colecție de module specialist

CompliAI este:
## un sistem care duce userul de la semnal / risc la închidere, dovadă și monitorizare

Formula corectă:

**awareness -> intrare -> profilare firmă / context -> applicability -> findings -> resolve în cockpit -> dovadă -> dosar -> monitorizare -> redeschidere când trebuie**

---

# 3. Regula de fier

## Un finding = un cockpit = un singur loc de execuție

Asta înseamnă:

După ce userul intră într-un finding, trebuie să poată din același cockpit:
1. să înțeleagă problema
2. să confirme cazul
3. să execute rezolvarea
4. să genereze / completeze / încarce
5. să valideze dovada unde este necesar
6. să confirme
7. să trimită la Dosar
8. să lase cazul în Monitorizare

Modulele specialist pot exista, dar doar ca:
- suport
- profunzime
- flow-uri controlate
- handoff cu întoarcere clară

Nu ca:
- produse principale paralele
- loc de execuție implicit pentru userul principal

---

# 4. Cei 3 useri principali — adevăr de piață

## 4.1 Mihai — Proprietar IMM / Solo

### Cine este
- administrator / antreprenor IMM
- timp puțin
- competență juridică scăzută
- competență tehnică medie sau scăzută
- orientat pe risc practic și pe „ce am de făcut acum”

### Triggeri reali de intrare
- aude de amendă / control / obligație nouă
- îi spune contabilul că „trebuie să faci ceva”
- vede știre despre GDPR / NIS2 / e-Factura
- observă că site-ul sau procesele lui sunt neclare
- simte că „nu are nimic pus la punct”

### Frici reale
- amendă
- control
- reputație
- timp pierdut
- sentiment de a nu ști de unde să înceapă

### Obiecții reale
- „nu am timp”
- „e prea juridic”
- „sigur e pentru firme mari”
- „încă un tool care doar îmi arată probleme”
- „nu vreau să citesc legea”

### Limbaj de cumpărare
Nu cumpără:
- clasificare sofisticată
- traceability
- evidence lifecycle

Cumpără:
- „spune-mi ce mi se aplică”
- „arată-mi ce e greșit”
- „dă-mi primul pas”
- „închide cazul”
- „să am ce arăta”

### Valoare imediată
- primul snapshot util
- primul finding închis
- primul document / prima dovadă în Dosar

### Ce îl face să abandoneze
- landing confuz
- onboarding prea greu
- prea multe module
- prea multe decizii
- cazuri care îl scot din cockpit

---

## 4.2 Diana — Consultant / Partner

### Cine este
- contabil / consultant / auditor / operator pe mai mulți clienți
- orientată pe eficiență
- lucrează pe portofoliu
- vrea livrabile bune către client
- are nevoie de context switching curat

### Triggeri reali de intrare
- vrea să adauge servicii de compliance la portofoliu
- vrea să nu mai muncească în Excel / Word / mailuri
- vrea să răspundă mai profesionist când clientul întreabă „suntem ok?”
- vrea diferențiere față de alți contabili / consultanți

### Frici reale
- context pierdut între clienți
- lucru repetitiv
- output-uri care arată slab
- lipsă de urmă
- nu poate scala fără haos

### Obiecții reale
- „îmi ia prea mult să setez fiecare client”
- „nu mă ajută dacă tot trebuie să fug între 5 ecrane”
- „dacă nu pot livra clar către client, nu-mi merită”
- „dacă partner mode e doar un dashboard, nu e suficient”

### Limbaj de cumpărare
Nu cumpără:
- doar „compliance”
- doar „scanare”
- doar „AI”

Cumpără:
- „portofoliu”
- „urgențe”
- „client context”
- „livrabile”
- „eficiență”
- „workflow cu urmă”

### Valoare imediată
- primul client adăugat
- primul finding închis pentru client
- primul pachet exportat / primul raport livrabil

### Ce o face să abandoneze
- onboarding care o trimite ca pe un user solo
- portfolio fără triage real
- execuție cross-client greșită
- reporting imatur
- lipsă de client context persistent

---

## 4.3 Radu — Compliance intern

### Cine este
- om de compliance / juridic / risk / security / governance
- cere disciplină
- cere urmă
- are nevoie de control și revalidare
- judecă produsul mai dur decât ceilalți

### Triggeri reali de intrare
- audit
- incident
- cerință internă de maturizare
- board pressure
- vendor / regulator pressure
- lipsă de sistem de urmă

### Frici reale
- lipsă de dovadă
- lipsă de audit trail
- lipsă de revalidare
- produse paralele care rup disciplina
- UI frumos care nu poate susține controlul

### Obiecții reale
- „pare consumerized”
- „nu are suficientă rigoare”
- „nu văd clar close condition și evidence truth”
- „specialist modules sunt prea separate”
- „settings și audit surfaces sunt încă haotice”

### Limbaj de cumpărare
Nu cumpără:
- doar simplitate
- doar UI
- doar „AI powered”

Cumpără:
- control
- audit trail
- evidence truth
- close gating
- monitoring
- revalidation
- export credibil

### Valoare imediată
- vede că findingurile au adevăr și gating
- poate închide un caz cu dovadă reală
- vede că Dosarul și monitoring-ul nu sunt de decor

### Ce îl face să abandoneze
- lipsă de rigoare
- prea multă magie
- prea multă fragmentare
- lipsă de truth model
- claims prea mari

---

# 5. Ce înseamnă produs bun pentru fiecare user

## Mihai
Produs bun = „înțeleg repede, închid primul caz, am dovadă, nu mai am anxietate difuză”

## Diana
Produs bun = „văd rapid unde e urgența, lucrez pe clientul corect, închid cazul, livrez pachetul”

## Radu
Produs bun = „știu exact ce s-a găsit, ce dovadă există, cum se închide, când reapare și cum demonstrez”

---

# 6. Adevărul de runtime — rezumat executiv

Auditul de runtime spune clar:

## Zone bune
- resolve queue este bun
- generatorul este bun ca motor
- nav principal este bun
- spine-ul există
- Mihai este cel mai aproape de flowul corect

## Zone parțial bune
- landing / login / onboarding
- Home
- cockpit operațional
- Dosar
- monitoring
- partner
- compliance IA

## Zone care deviază puternic
- workflowLink scoate execuția din cockpit
- output-ul este fragmentat între Dosar și alte suprafețe
- monitoring-ul este sub-exprimat
- suitele specialist se comportă ca produse paralele

---

# 7. Current truth per user

## 7.1 Mihai — current truth
### Ce merge
- poate intra
- poate face onboarding
- poate vedea findings
- poate intra în cockpit
- poate închide finding-uri documentare
- poate ajunge la Dosar
- are nav simplă

### Ce nu merge suficient
- landing-ul nu e încă optimizat register-first
- onboarding-ul nu are scena explicită de applicability
- `Ce faci acum` nu domină destul în Home
- multe finding-uri operaționale încă îl scot din cockpit
- Dosarul e încă prea fragmentat
- monitorizarea nu se simte suficient de clar

### Verdict
Este persona cel mai aproape de produsul corect.

---

## 7.2 Diana — current truth
### Ce merge
- există mod partner
- există portfolio shell
- există client context switch
- există posibilitatea de a lucra pe client
- există output logic

### Ce nu merge suficient
- onboarding-ul nu o scoate natural în portofoliu
- există execuție cross-client prea liberă
- portfolio reports nu sunt încă destul de mature
- flow-ul partenerului încă nu este la fel de coerent ca flow-ul solo

### Verdict
Flow-ul există, dar nu e încă suficient de solid pentru o persona partner serioasă.

---

## 7.3 Radu — current truth
### Ce merge
- are spine-ul principal
- are acces la suite specialist
- are audit / export / settings surfaces

### Ce nu merge suficient
- onboardingul nu are destinație mai bogată pentru el
- settings sunt prea infrastructurale
- multe module specialist sunt încă produse paralele
- cockpitul live nu expune destul de clar aftercare, close rule și monitoring

### Verdict
Poate folosi produsul, dar nu încă la nivelul de rigoare pe care îl cere.

---

# 8. Target truth per user

## 8.1 Mihai — target truth
### Flow ideal
Landing -> Register -> Onboarding -> Snapshot -> Home / Resolve -> Cockpit -> Dosar -> Monitoring -> Reopen

### Ce trebuie să simtă
- produsul îl înțelege
- îl duce repede la primul caz
- nu îl plimbă
- îi lasă dovada
- îl ține sub watch

### Non-negotiables
- next action dominant
- generator inline
- validate evidence unde trebuie
- Dosar simplu și clar
- reopen clar

---

## 8.2 Diana — target truth
### Flow ideal
Landing / Pricing -> Register -> Onboarding Partner -> Portfolio -> Client workspace -> Resolve -> Cockpit -> Dosar client -> Export -> Alerts -> Reentry

### Ce trebuie să simtă
- lucrează pe portofoliu, nu pe un dashboard solo mascat
- nu pierde contextul clientului
- execută pe firmă, nu cross-client chaotic
- livrează output-uri curate

### Non-negotiables
- partner-first exit din onboarding
- portfolio triage real
- context client persistent
- no batch execution care rupe disciplina
- reporting livrabil

---

## 8.3 Radu — target truth
### Flow ideal
Login / Trial -> Onboarding Compliance -> Snapshot -> Home / Resolve -> Cockpit -> Dosar -> Monitoring / Revalidation / Reopen -> Export / audit

### Ce trebuie să simtă
- produsul e disciplinat
- cazurile au adevăr
- close condition e clară
- dovada e serioasă
- monitoring-ul e real
- suitele specialist sunt suport, nu concurență

### Non-negotiables
- cockpit cu aftercare și monitoring vizibile
- evidence truth model
- revalidation clară
- audit surfaces curate
- specialist depth controlată

---

# 9. IA corectă

## Primară
- Acasă
- Scanează
- De rezolvat
- Dosar
- Setări

## Secundară / contextuală
- NIS2
- DSAR
- Fiscal
- Vendor Review
- Audit Log
- Trust / exports
- Agents
- sisteme AI
- alte suite specialist

## Regula
Cei 3 useri trebuie să-și poată duce taskurile principale fără să depindă de modulele specialist ca spine primar.

---

# 10. Mapping — ce trebuie să schimbi pentru fiecare user

## 10.1 Mihai
### P0
- CTA de landing să ducă register-first
- scenă explicită în onboarding: ce legi se aplică și de ce
- `Ce faci acum` să domine Home
- cockpit operațional să nu mai expulzeze userul
- success -> Dosar principal
- monitoring mai vizibil

### P1
- Dosar mai puțin fragmentat
- scan simplificat
- copy mai scurt

### P2
- suitele specialist ascunse mai bine
- trust / exports rafinate

---

## 10.2 Diana
### P0
- ieșire Partner din onboarding direct în portfolio
- portfolio triage clar
- context client persistent
- cockpit per client, nu execuție cross-client

### P1
- reporting per client matur
- exporturi clare
- stronger partner messaging

### P2
- batch-safe helpers controlate
- trust links / handoff assets mai mature

---

## 10.3 Radu
### P0
- cockpit live cu execuție + aftercare + monitoring clar
- validate evidence clar
- specialist modules controlate din cockpit
- settings mai puțin infrastructurale

### P1
- Dosar mai credibil pentru audit
- traceability și timeline bine stratificate
- monitoring și revalidation mai vizibile

### P2
- suită compliance mai bogată, dar fără a rupe spine-ul
- exports și trust surfaces rafinate

---

# 11. Ce spune piața despre cum trebuie să arate produsul

## Pentru Mihai
Nu trebuie să arate ca:
- suită de compliance
- centru de rapoarte
- sistem juridic greu

Trebuie să arate ca:
- produs care spune ce se aplică
- produs care găsește ce e greșit
- produs care dă primul pas
- produs care lasă dovadă

## Pentru Diana
Nu trebuie să arate ca:
- produs solo cosmetizat

Trebuie să arate ca:
- portofoliu
- urgențe
- client context
- execuție pe firmă
- output livrabil

## Pentru Radu
Nu trebuie să arate ca:
- UI frumos fără disciplină

Trebuie să arate ca:
- sistem cu adevăr operațional
- cazuri, dovezi, revalidare, audit trail, monitoring

---

# 12. Ce facem cu specialist modules

## NIS2
Rămâne suită, dar trebuie să fie:
- suport contextual
- integrată mai bine cu cockpitul
- nu primul loc unde userul principal „muncește” fără context

## DSAR
Trebuie să devină mai mult:
- flow controlat din finding
și mai puțin:
- produs paralel de sine stătător pentru userul principal

## Fiscal
SPV și cazurile apropiate de spine trebuie trase mai aproape de cockpit.
Restul poate rămâne mai adânc.

## Sisteme / DORA / Whistleblowing
Trebuie recadrate clar:
- specialist depth
- nu primă casă pentru userul principal

---

# 13. Ce avem deja și nu atingem inutil

1. nav principal cu 5 itemi
2. resolve queue bună
3. generator drawer bun ca motor
4. multe piese de kernel și monitoring
5. spine-ul de bază

Nu rescriem motorul fără motiv.
Corectăm:
- ierarhia
- routing-ul
- expunerea live
- relationarea între suprafețe
- adevărul pe fiecare pas

---

# 14. Current vs Target vs Migration

## Landing
### Current
bun, dar parțial
### Target
clar, register-first, spune traseul complet până la monitorizare
### Migration
rescriere CTA, journey, problem framing

## Login/Register
### Current
funcțional
### Target
minimă fricțiune, register-first pentru CTA
### Migration
preselect register și redu ciobul de fricțiune inutilă

## Onboarding
### Current
liniar, dar incomplet ca scenă de applicability și ca ieșire pe persona
### Target
wizard observabil, applicability clară, ieșire diferențiată
### Migration
adaugi pas explicit și routing pe persona

## Home
### Current
bun, dar cu next action prea puțin dominant
### Target
orientare + stare + next action autoritar
### Migration
ierarhie mai dură pe `Ce faci acum`

## Resolve
### Current
bun
### Target
rămâne inbox clar
### Migration
polish minor și menținere

## Cockpit generator
### Current
bun ca motor, slab ca expunere live
### Target
smart resolve complet, cu aftercare și monitoring vizibile
### Migration
montezi corect blocurile, clarifici success path

## Cockpit operațional
### Current
parțial, prea mult workflowLink
### Target
execuție în cockpit sau handoff controlat
### Migration
reduci redirect-driven execution

## Dosar
### Current
parțial aliniat, fragmentat
### Target
proof + blockers + exports + audit trail
### Migration
comprimare și unificare a output surfaces

## Monitoring
### Current
în logică, sub-exprimat
### Target
vizibil, util, legat de reentry
### Migration
exprimi clar next review, reopen, signals

---

# 15. P0 / P1 / P2 final

## P0 — fără acestea produsul minte
1. register-first CTA
2. applicability scene explicită în onboarding
3. persona-aware exit din onboarding
4. next action dominant pe Home
5. cockpit operațional fără expulzare arbitrară
6. success către Dosar principal
7. monitoring vizibil în experiență

## P1 — fără acestea produsul rămâne obositor
1. Dosar unificat și clar
2. portfolio partner maturizat
3. settings mai curate
4. scan simplificat
5. partner reporting mai bun
6. cockpit live cu aftercare clar

## P2 — fără acestea produsul nu e încă pe deplin matur
1. specialist modules recadrate complet
2. trust / exports avansate
3. batch-safe partner helpers
4. stratificare mai bună pentru compliance depth

---

# 16. Ce înseamnă „document final bun” după acest pas

Documentul este bun dacă:
- spune adevărul despre piață
- spune adevărul despre runtime
- nu confundă target state cu current state
- spune clar ce se schimbă și de ce
- dă direcții diferite pentru Mihai, Diana și Radu
- fixează spine-ul
- fixează IA
- spune ce e P0, P1, P2

---

# 17. Formula finală

## Pentru piață
Mihai cumpără claritate și primul pas.  
Diana cumpără portofoliu, execuție și livrare.  
Radu cumpără adevăr operațional, urmă și control.

## Pentru runtime
Produsul are deja coloană vertebrală, dar încă pierde din claritate prin:
- handoff-uri prea multe
- ierarhie slabă în unele suprafețe
- output fragmentat
- specialist modules prea autonome

## Pentru direcție
Nu reconstruim produsul de la zero.
Îl aducem la adevărul corect:

**spine clar -> cockpit real -> dovadă reală -> Dosar clar -> Monitorizare vie**
