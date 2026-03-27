# CompliAI — Frozen Truth Governance & Sprint Map

Data: `2026-03-27`  
Status: `working governance doc`

---

## 0. Scop

Acest document există ca să oprească o problemă simplă:

- avem documente bune
- dar nu toate spun același tip de adevăr
- și dacă le amestecăm, target state-ul ajunge să fie tratat ca runtime truth

Acest document fixează:
- ce document decide ce
- ce putem îngheța acum ca adevăr
- ce NU putem îngheța încă drept current runtime truth
- cum transformăm pachetul de documente în sprinturi de corecție

---

## 1. Pachetul de adevăr înghețat

### 1.1 Documentele din folder

1. [compliai_3_user_app_skeleton_ia_bible.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai_3_user_app_skeleton_ia_bible.md)
2. [compliai_market_runtime_truth_bible.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai_market_runtime_truth_bible.md)
3. [compliai_final_user_matrix_bible.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai_final_user_matrix_bible.md)
4. [compliai-user-flow-1to1-runtime-audit.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai-user-flow-1to1-runtime-audit.md)
5. [compliai_risk_evidence_resolve_truth_matrix.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai_risk_evidence_resolve_truth_matrix.md)

### 1.2 Document canonic suplimentar, în afara folderului

6. [compliai_smart_resolve_cockpit_bible.md](/Users/vaduvageorge/Downloads/compliai_smart_resolve_cockpit_bible.md)

Acesta nu stă în folder, dar rămâne obligatoriu pentru:
- cockpit
- generator
- validate evidence
- success
- dossier handoff
- monitoring handoff
- onboarding observabil

---

## 2. Ce rol are fiecare document

### 2.1 Product skeleton truth

[compliai_3_user_app_skeleton_ia_bible.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai_3_user_app_skeleton_ia_bible.md) fixează:
- cine sunt cei 3 useri
- care este spine-ul aplicației
- care este IA primară vs secundară
- cum trebuie să curgă produsul pe etape
- care este ordinea corectă a secțiunilor

Acesta este documentul principal pentru:
- scheletul aplicației mari
- IA
- etapizare
- ordinea secțiunilor

### 2.2 Market + migration truth

[compliai_market_runtime_truth_bible.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai_market_runtime_truth_bible.md) fixează:
- adevărul de piață
- fricile și triggerii pe user
- current vs target vs migration
- P0 / P1 / P2

Acesta este documentul principal pentru:
- prioritizare
- ordine de intervenție
- decizie de produs
- mesajul corect per persona

### 2.3 Execution matrix truth

[compliai_final_user_matrix_bible.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai_final_user_matrix_bible.md) fixează:
- pe fiecare ecran, ce vede userul
- ce citește
- ce apasă
- ce face sistemul
- next route
- failure risk dacă ecranul este greșit

Acesta este documentul principal pentru:
- UX
- UI
- engineering execution
- QA test matrix

### 2.4 Current runtime truth

[compliai-user-flow-1to1-runtime-audit.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai-user-flow-1to1-runtime-audit.md) fixează:
- ce face aplicația azi
- ce există în cod
- ce este confirmat live
- ce deviază
- ce minte
- ce este încă neconfirmat live

Acesta este singurul document care are voie să spună:
- `avem acum`
- `merge acum`
- `pică acum`

### 2.5 Risk → evidence truth

[compliai_risk_evidence_resolve_truth_matrix.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai_risk_evidence_resolve_truth_matrix.md) fixează:
- ce riscuri sunt cu adevărat documentare
- ce riscuri sunt de fapt operaționale
- ce riscuri sunt suport / handoff
- ce artefacte sunt doar recomandări, nu flow real de Smart Resolve

Acesta este documentul principal pentru:
- `risk -> evidence -> motor`
- delimitarea între document flow și operational flow
- tăierea flow-urilor false din cockpit

### 2.6 Cockpit execution truth

[compliai_smart_resolve_cockpit_bible.md](/Users/vaduvageorge/Downloads/compliai_smart_resolve_cockpit_bible.md) fixează:
- arhitectura cockpitului
- ordinea blocurilor
- validate evidence
- success
- round-trip controlat

Acesta bate orice alt document când există conflict pe:
- cockpit
- generator
- aftercare
- observable onboarding

---

## 3. Ce putem îngheța acum, 100%, fără risc

Putem îngheța acum ca adevăr stabil:

### 3.1 Formula produsului

`awareness -> intrare -> onboarding -> snapshot -> findings -> cockpit -> dosar -> monitorizare -> redeschidere`

### 3.2 Regula de fier

`Un finding = un cockpit = un singur loc de execuție`

### 3.3 Cei 3 useri principali

- Mihai = claritate, primul pas, dovadă, liniște
- Diana = portofoliu, context client, execuție, livrabile
- Radu = disciplină, audit trail, control, revalidare

### 3.4 IA principală

Primară:
- Acasă
- Scanează
- De rezolvat
- Dosar
- Setări

Secundară:
- NIS2
- DSAR
- Fiscal
- Vendor Review
- DORA
- Whistleblowing
- AI systems
- alte zone de profunzime

### 3.5 Screen responsibilities

Putem îngheța fără echivoc:
- Landing vinde intrarea
- Pricing clarifică planul
- Login/Register lasă userul să intre
- Onboarding profilează și pregătește snapshotul
- Home orientează
- Scanează este intake
- De rezolvat este inbox
- Cockpit execută cazul
- Dosar arată proof + blockers + export + audit
- Monitoring ține cazul viu și îl retrimite în caz

### 3.6 System behaviors obligatorii

Putem îngheța ca non-negotiable:
- onboarding-ul se termină în flow-ul real, nu în finish duplicat
- întrebările noi trebuie să fie pași observabili
- finding-urile documentare trebuie să aibă generator + validate evidence
- pentru finding-urile documentare, generatorul de rezolvare stă inline în cockpit, imediat sub acțiunea principală, nu în side panel
- finding-urile operaționale trebuie să ceară dovadă
- finding-urile specialist trebuie să folosească handoff controlat
- cazul închis trebuie să trimită dovada în Dosar și să activeze monitoring
- drift/review/reopen trebuie să retrimită userul în același cockpit
- în snapshot, inbox și triage nu bombardăm userul cu explicații lungi per risk
- pe fiecare risk afișăm doar:
  - numele regulii / cazului
  - riscul pe care îl implică
  - acțiunea următoare, doar dacă este absolut necesară pentru triage

Formula obligatorie pentru listări:

`[Numele riscului] -> [ce risc implică pentru firmă]`

Nu:
- 3 paragrafe de context juridic în listă
- micro-eseuri explicative în Home / Resolve
- duplicarea aceleiași explicații în snapshot, queue și cockpit
- execuția documentară într-un drawer lateral care mută atenția în afara coloanei principale de rezolvare

### 3.7 Anti-patterns

Putem îngheța și ce NU avem voie să facem:
- Home tool mall
- Scan pseudo-cockpit
- Resolve care execută
- cockpit sufocat de context
- save evidence fără validate
- Dosar = reports dump
- monitoring fără reentry
- onboarding cu pași ascunși
- risk cards / finding rows care explică prea mult și ascund acțiunea reală

---

## 4. Ce NU putem îngheța încă drept current truth

Nu putem îngheța ca adevăr runtime final:

### 4.1 Orice propoziție de tip target

Din:
- current vs target vs migration
- P0 / P1 / P2
- flow ideal
- non-negotiables

Acestea sunt adevăr de direcție, nu adevăr de runtime.

### 4.2 Orice comportament care nu e confirmat live

Conform [compliai-user-flow-1to1-runtime-audit.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai-user-flow-1to1-runtime-audit.md), nu putem declara încă 100% înghețat:
- operational close end-to-end pentru toate familiile
- revalidation completă
- reopen complet după închidere reușită
- full partner intake pe cont fresh fără blocaje de plan
- specialist round-trip complet pentru toate familiile
- toate colțurile monitoring/alerts/drift

### 4.3 Cockpitul live ca adevăr final

Nu putem îngheța cockpitul actual drept final, pentru că auditul live a confirmat deja deviații:
- succesul documentar către Dosar nu este încă adevăr final confirmat pe toate ramurile
- cockpitul operațional încă suferă de expulzare în unele flow-uri
- aftercare și monitoring sunt încă sub-expuse în runtime

### 4.4 Partner și compliance ca adevăr final

Nu putem spune încă:
- partner flow este definitiv
- compliance flow este definitiv

Putem spune doar:
- structura corectă este definită
- runtime-ul actual este parțial

---

## 5. Regula de conflict între documente

Dacă documentele intră în conflict, ordinea este:

1. Pentru `ce există azi`:
[compliai-user-flow-1to1-runtime-audit.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai-user-flow-1to1-runtime-audit.md)

2. Pentru `cockpit / generator / validate / success / handoff controlat`:
[compliai_smart_resolve_cockpit_bible.md](/Users/vaduvageorge/Downloads/compliai_smart_resolve_cockpit_bible.md)

3. Pentru `ce risc se poate rezolva documentar vs operațional vs suport`:
[compliai_risk_evidence_resolve_truth_matrix.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai_risk_evidence_resolve_truth_matrix.md)

4. Pentru `scheletul mare, IA, etape, spine`:
[compliai_3_user_app_skeleton_ia_bible.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai_3_user_app_skeleton_ia_bible.md)

5. Pentru `piață, prioritizare, current vs target vs migration`:
[compliai_market_runtime_truth_bible.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai_market_runtime_truth_bible.md)

6. Pentru `ce trebuie să vadă și să facă userul pe fiecare ecran`:
[compliai_final_user_matrix_bible.md](/Users/vaduvageorge/Desktop/CompliAI/docs/adevar%20inghetat/compliai_final_user_matrix_bible.md)

---

## 6. Ce putem declara acum ca „adevăr înghețat final”

Putem declara acum ca adevăr înghețat final:

### 6.1 Frozen product truth

- cine sunt userii
- spine-ul produsului
- IA primară vs secundară
- rolul fiecărei secțiuni
- regula de fier
- comportamentele obligatorii
- anti-patternurile interzise

### 6.2 Frozen target UX truth

Putem îngheța ca target final:
- ordinea secțiunilor
- ce trebuie să vadă fiecare user
- cum trebuie să curgă fiecare persona
- unde trebuie să se execute cazul
- unde trebuie să ajungă dovada
- cum trebuie să funcționeze monitoring-ul și reopen-ul

### 6.3 Frozen runtime truth

Putem îngheța ca runtime truth doar ce este în auditul 1:1 și în secțiunea de live verification.

Formulare permise:
- `confirmat live`
- `confirmat în cod`
- `parțial`
- `neconfirmat`
- `rupt`

Formulare nepermise:
- `gata`
- `final`
- `1:1`

dacă nu există confirmare explicită în audit.

---

## 7. Cum transformăm pachetul în sprinturi

Regula:
- un sprint = o intenție principală
- fiecare sprint închide o zonă mare de adevăr
- fiecare sprint se validează live, nu doar local

### Sprint 0 — Truth blockers live

Obiectiv:
închidem ce face documentele să mintă despre runtime acum.

Taskuri:
- fix document flow `cockpit -> generator inline -> validate -> attach -> Dosar -> monitoring`
- confirm success moment real în cockpit
- confirm Dosar reflectă cazul închis
- confirm `reopen` apare când trebuie după close reușit
- actualizează auditul 1:1 doar cu adevăr live

Definition of done:
- flow documentar cap-coadă confirmat live
- Dosar primește dovada
- monitoring apare clar
- auditul 1:1 nu mai are contradicții pe acest flow

### Sprint 1 — Entry / Activation truth

Obiectiv:
aliniem intrarea cu spine-ul produsului.

Taskuri:
- landing register-first
- journey complet până la monitorizare
- problem framing clar
- auth cu fricțiune minimă
- onboarding observabil
- scenă explicită de applicability
- exit persona-aware din onboarding

Definition of done:
- Mihai, Diana și Radu intră pe flow-ul potrivit
- onboarding-ul nu mai ascunde pași
- primul snapshot este clar și credibil

### Sprint 2 — Snapshot / Home / Resolve truth

Obiectiv:
stabilim orientarea și triage-ul fără zgomot.

Taskuri:
- Home cu next action dominant
- snapshot coerent
- Resolve rămâne inbox, nu pseudo-cockpit
- Scan rămâne intake, nu centru de execuție
- clarifică first snapshot vs Home vs Resolve
- arată din listă tipul real al fiecărui risc:
  - `document`
  - `operațional`
  - `suport`
- comprimă explicația per risk în snapshot și Resolve:
  - o singură propoziție scurtă în română
  - numele cazului
  - riscul pe care îl implică
  - fără context juridic lung în listă
- scoate din Home / snapshot / inbox tot ce nu ajută triage-ul imediat

Definition of done:
- userul știe în 5 secunde unde e și ce face
- Home nu mai este mall
- Resolve este clar primul centru de triage
- fiecare risk poate fi înțeles dintr-o privire, fără blocuri lungi de copy

### Sprint 3 — Cockpit truth

Obiectiv:
resetăm cockpitul ca singur loc de execuție.

Taskuri:
- stack vizibil corect: confirmare -> execuție -> validate -> Dosar -> monitoring
- aliniază cockpitul la matricea `risk -> evidence -> motor`
- document findings cu validate evidence real doar dacă sunt `documentare reale`
- operational findings cu evidence gate real
- specialist findings cu handoff controlat și return state
- aftercare și close condition explicite
- scoate generatorul de pe riscurile care sunt doar `operaționale` sau `suport`
- repară orice flow documentar parțial rămas, în special unde generatorul există dar poarta de attach / Dosar nu este completă

Definition of done:
- niciun finding principal nu mai cere execuție arbitrară în afara cockpitului
- dovada este verificabilă
- success path este vizibil și credibil

### Sprint 4 — Dosar / Monitoring / Reopen truth

Obiectiv:
fixăm adevărul de proof și continuity.

Taskuri:
- Dosar overview clar: status, KPI, blockers, 2 CTA
- Dovezi & gap-uri legate de cazuri
- exports și audit trail demotate corect
- monitoring vizibil
- review date clar
- reopen și revalidation ca traseu real

Definition of done:
- Dosar nu mai este dump
- monitoring trimite înapoi în caz
- reopen și revalidation sunt clare și verificabile

### Sprint 5 — Partner truth

Obiectiv:
facem Diana reală, nu solo mascat.

Taskuri:
- partner-first exit din onboarding
- portfolio triage real
- client context persistent
- client intake clar
- cockpit client-safe
- client dossier și livrabile curate
- monitoring pe portofoliu

Definition of done:
- partner flow este coerent cap-coadă
- nu există ambiguitate de context client
- output-ul către client este credibil

### Sprint 6 — Compliance + specialist recentering

Obiectiv:
facem Radu riguros fără să rupem spine-ul.

Taskuri:
- compliance onboarding și home mai disciplinate
- audit / traceability curate
- suitele specialist recadrate ca profunzime, nu produse principale
- NIS2 / DSAR / Fiscal integrate sub cockpit-first
- DORA / Whistleblowing / AI systems recadrate în IA corectă

Definition of done:
- Radu are rigoare
- specialist modules nu mai concurează flow-ul principal
- audit trail și monitoring sunt clare

### Sprint 7 — Full live matrix QA

Obiectiv:
transformăm adevărul de target în adevăr runtime verificat.

Taskuri:
- testare live click-by-click pentru Mihai
- testare live click-by-click pentru Diana
- testare live click-by-click pentru Radu
- toate riscurile din matricea `documentar real`
- toate riscurile din matricea `operațional`
- toate riscurile marcate `suport / handoff`
- specialist controlled handoffs
- Dosar / export / monitoring / reopen / revalidation
- completare finală a auditului 1:1

Definition of done:
- matricea finală este confirmată live
- zonele `neconfirmat` dispar sau sunt izolate explicit
- putem spune 1:1 doar unde există confirmare

---

## 8. Ce NU facem

Nu:
- refacem totul de la zero
- redesenăm haotic fără spine
- împingem module noi
- confundăm polishing cu corecția de structură
- declarăm `client-ready` înainte ca auditul live să confirme

---

## 9. Formula de lucru de acum înainte

Lucrăm așa:

1. înghețăm produsul ca structură
2. corectăm runtime-ul pe zone
3. verificăm live fiecare sprint
4. actualizăm auditul 1:1
5. abia apoi declarăm `final`

Formula bună:

`frozen product truth -> sprinted correction -> live verification -> updated runtime truth`
