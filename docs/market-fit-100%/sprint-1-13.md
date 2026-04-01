# CompliAI — Build Control Canon (Unified Edition)

**Versiune:** 1.0  
**Data:** 1 aprilie 2026  
**Status:** Document canonic unificat  
**Rol:** Sursa unică de adevăr pentru construcția produsului. Unește:
- current state
- missing state
- build order
- user persona flows
- finding / risk resolution logic
- automation rules
- release gates
- Smart Resolve Cockpit flow protejat

---

# 0. Ce este acest document

Acesta este documentul după care se construiește produsul.

Răspunde simultan la:
1. Ce avem deja real în cod
2. Ce lipsește real
3. Cum construim exact ce lipsește
4. Cum se mișcă fiecare user prin aplicație
5. Care este flow-ul suprem pe care nu avem voie să-l stricăm
6. În ce ordine construim, fără să rupem spine-ul

Acest document înlocuiește:
- improvizația
- contradicțiile între doc-uri
- optimismul fals
- roadmap-urile umflate
- flow-urile frumoase fără legătură cu runtime-ul real

---

# 1. Principiul suprem

## Nu vindem „compliance”.
Vindem:
- claritate
- rezolvare
- dovadă
- readiness
- capacitatea de a nu pierde bani, timp, clienți sau control

## Formula mare a produsului
**signal -> applicability -> finding -> resolve -> evidence -> dossier -> monitoring -> reopen when needed**

## Regula de fier
**Un finding = un cockpit = un singur loc de execuție**

Dacă același caz are nevoie de:
- încă o pagină pentru înțelegere
- încă o pagină pentru generare
- încă o pagină pentru dovadă
- încă o pagină pentru monitorizare

atunci produsul este greșit.

---

# 2. Protected Smart Resolve Flow (flow-ul pe care nu avem voie să-l stricăm)

Acesta este adevărul suprem al produsului.

## 2.1 Flow canonic
1. **Risc / finding detectat**
2. **User intră în finding**
3. **User confirmă că finding-ul este real / relevant**
4. **Sistemul deschide modulul de rezolvare potrivit**
   - dacă este documentar -> generator
   - dacă este operațional -> checklist / evidence / controlled handoff
   - dacă este extern -> handoff controlat + revenire cu dovadă
5. **Sistemul validează dovada**
   - rescanează documentul dacă este document generat
   - verifică prezența artefactului / notei / legăturii dacă este operațional
6. **User aprobă folosirea dovezii pentru închidere**
7. **Finding-ul se rezolvă**
8. **Dovada este trimisă în Dosar**
9. **Finding-ul intră în monitoring**
10. **Sistemul setează review / recheck / trigger de reopen**
11. **La drift / expirare / semnal nou, cazul revine în același cockpit**

## 2.2 Reguli non-negotiable
- Nu se închide finding fără dovadă
- Nu se folosește document generat ca dovadă finală fără validare / confirmare
- Nu se sare direct la Dosar fără close condition
- Nu se rupe cazul în 3 ecrane concurente
- Handoff-ul extern nu schimbă centrul de adevăr; cockpitul rămâne centrul
- Monitoring-ul nu este decorativ; trebuie să poată reaprinde cazul

## 2.3 Mini-stepper canonic
1. Confirmi cazul
2. Pregătești rezolvarea
3. Verifici dovada
4. Trimiți la Dosar
5. Monitorizat

Acest mini-stepper trebuie să fie vizibil și corect sincronizat cu stările reale.

---

# 3. Teza de piață și wedge-urile

## 3.1 Piața nu cumpără „conformitate” ca hobby
Cumpără când există:
- blocaj fiscal
- fricțiune comercială
- vendor due diligence
- presiune contractuală
- risc de audit
- nevoie de dovadă

## 3.2 Wedge A — SMB România / volum
- e-Factura
- SPV
- validare
- repair
- explainability
- cookies / website privacy
- documente de bază GDPR

## 3.3 Wedge B — Buyer mai bun / vendor readiness
- firme IT / software / outsourcing / BPO / MSP
- furnizori cu clienți UE
- GDPR evidence pack
- NIS2 readiness
- procurement trust pack
- vendor review
- policy / security evidence

## 3.4 Ce nu facem
Nu construim 16 tool-uri egale.  
Construim:
- câteva entry points comerciale mari
- un singur motor intern de findings / resolve / dossier / monitoring

---

# 4. Userii principali

## 4.1 Mihai — Solo / Proprietar / Manager
### Ce vrea
- să știe ce i se aplică
- să vadă ce e greșit
- să rezolve rapid
- să aibă dovadă
- să nu fie îngropat în legalese

### Ce nu vrea
- 8 module specialist în față
- explicații mai lungi decât acțiunea
- pași ascunși în onboarding
- flow-uri rupte în 3 pagini

## 4.2 Diana — Partner / Consultant / Contabil
### Ce vrea
- portofoliu clar
- onboarding clienți în masă
- triage
- batch-safe actions
- rapoarte repetabile
- dovezi livrabile

### Ce nu vrea
- să opereze client cu client manual
- să piardă contextul clientului
- branding generic dacă ea vinde soluția

## 4.3 Radu — Compliance Officer
### Ce vrea
- adevăr operațional
- close conditions
- evidență
- revalidation
- auditability
- exporturi credibile

### Ce nu vrea
- produse paralele
- „AI magic”
- fluxuri fără urmă

---

# 5. Current state — rezumat real

## 5.1 Ce este bun
- nav principal simplu
- multe module există ca suprafețe
- findings engine există
- validator e-Factura există
- repair e-Factura există
- applicability există
- NIS2 este surprinzător de avansat
- vendor management este surprinzător de avansat
- AI inventory există
- agents există ca infrastructură de început

## 5.2 Ce este fragil
- adevărul persistat încă nu este suficient de solid
- mult state este încă în JSON / in-memory
- Approval Queue reală lipsește
- auto-link evidence lipsește
- cockpitul nu este încă protejat end-to-end pe toate cazurile
- submit ANAF real este incomplet
- partner machine este incompletă
- autonomy settings lipsesc
- scheduled reports configurabile lipsesc
- monitoring și revalidation nu sunt încă suficient de puternice
- Pay Transparency este doar detectare, nu loop complet
- Sprint 13 moat automation este zero

---

# 6. Weighted readiness — adevărul util

## 6.1 Foundation truth
- persistență reală: slab
- organization truth: mediu
- findings truth: mediu
- approval truth: slab
- audit truth: mediu

**Scor estimat:** 35/100

## 6.2 Core loop
- onboarding: mediu-bun
- applicability: bun
- findings list: bun
- cockpit documentar: mediu
- cockpit operațional: mediu-slab
- Dosar: mediu
- evidence auto-link: slab

**Scor estimat:** 45/100

## 6.3 Fiscal wedge
- validator: bun
- repair: bun
- submit: slab
- status/dovadă: parțial
- reminders: mediu

**Scor estimat:** 50/100

## 6.4 Partner machine
- CSV import: bun
- client context: mediu
- batch actions: slab
- scheduled reports: slab
- white-label: foarte slab

**Scor estimat:** 35/100

## 6.5 Compliance depth
- NIS2: bun
- DORA: bun-ish
- AI Act: mediu-bun
- whistleblowing: mediu-bun
- pay transparency: slab

**Scor estimat:** 60/100

## 6.6 Automation moat
- approval-centric automation: slab
- autonomy settings: slab
- self-learning: zero
- predictive: zero

**Scor estimat:** 10/100

---

# 7. Current state -> target state pe module

## 7.1 Onboarding / Applicability
### Avem
- wizard multi-step
- lookup ANAF
- prefill
- applicability engine de bază

### Lipsește
- sursă robustă de date companie by CUI cu fallback
- observabilitate perfectă a tuturor pașilor
- pași noi mereu vizibili, fără apariții ascunse
- ieșire directă și perfectă către first real task
- source-of-truth persistat real

### Țintă
Userul:
- introduce CUI
- confirmă datele
- vede applicability explicit
- intră imediat în primul finding / flow relevant

### Relația cu cockpitul
Onboarding-ul pregătește finding-urile și cockpiturile; nu are voie să devină el însuși „produsul”.

### Nu are voie să facă
- să ascundă pași
- să ducă userul într-un finish duplicat
- să scoată userul într-un mall de module

---

## 7.2 Findings
### Avem
- findings list
- filtering
- source generation din scanări
- mai multe engine-uri de detecție

### Lipsește
- findings persistate curat
- review_state clar
- source_confidence standardizat
- pending_action path pentru findings medium/high
- resolution locus standardizat
- close condition în modelul de date

### Țintă
Fiecare finding știe:
- de unde vine
- cât de sigur este
- unde se rezolvă
- ce dovadă trebuie
- când se redeschide

### Relația cu cockpitul
Findings sunt intrarea în cockpit. Nu există findings serioase fără cockpit.

---

## 7.3 Approval Queue
### Avem
- aprobare inline în unele locuri
- approvalStatus în unele module

### Lipsește
- tabel real
- API real
- UI unificată
- approval policy model
- expirări
- audit trail coerent
- centru de control real

### Țintă
Toate acțiunile mediu/ridicat trec prin:
- pending action
- diff / explanation
- approve / reject / edit
- audit log
- execute

### Relația cu cockpitul
Cockpitul poate conține approval moments, dar Approval Queue rămâne centrul sistemic de control.

### Nu are voie să facă
- să fie o listă moartă de notificări
- să înlocuiască cockpitul
- să execute acțiuni critice fără dovadă și audit

---

## 7.4 Smart Resolve Cockpit
### Avem
- structură de bază
- findings detail
- generator în unele cazuri
- state-uri parțiale

### Lipsește
- flow protejat pe toate familiile de findings
- validate evidence unificat
- evidence upload / note logic consistent
- handoff controlat pentru extern
- success -> Dosar consistent
- monitoring entry consistent
- reopen path consistent

### Țintă
Cockpitul duce cazul de la:
confirmare -> execuție -> validare -> Dosar -> monitoring

### Relația cu Dosar
Cockpitul produce output; Dosarul îl primește.

### Nu are voie să facă
- să împingă userul în 3 locuri diferite pentru același caz
- să închidă fără dovadă
- să sară peste validate evidence

---

## 7.5 Dosar
### Avem
- pagină
- categorizare
- ceva structure

### Lipsește
- adevăr pe evidence links
- blocaje vizibile
- grupare curată pe finding -> dovadă -> artefact
- auto-link real
- export pack coerent
- monitoring visibility

### Țintă
Dosarul este:
- overview
- evidence truth
- blocker map
- export pack
- audit trail summary
- procurement / trust pack

### Relația cu cockpitul
Primește outputul cockpitului. Nu execută cazuri.

### Nu are voie să facă
- să devină cockpit 2
- să fie groapă de PDF-uri

---

## 7.6 Monitoring / Drift / Revalidation
### Avem
- alerts
- legislation monitor
- niște agent logic
- niște drift lifecycle

### Lipsește
- review_cycles clare
- reopen standardizat
- same-case reentry
- monitorizare bine exprimată în Home și Dosar
- aftercare clară pe finding

### Țintă
Un caz închis:
- are dată de review
- poate fi reverificat
- poate reapărea în același cockpit
- produce notificare relevantă

### Nu are voie să facă
- să fie doar log pasiv
- să fie alerte fără consecință

---

## 7.7 Fiscal / e-Factura
### Avem
- validator bun
- repair bun
- token storage parțial
- interpretare bună

### Lipsește
- submit real complet
- status real complet
- dovadă post-submit
- legătură curată în Dosar
- flow approval-gated până la capăt

### Țintă
Userul:
- validează
- vede repair proposal
- aprobă
- transmite
- primește status
- vede dovada
- vede cazul în Dosar / timeline

### Nu are voie să facă
- să trimită automat fără aprobare
- să pretindă că wedge-ul fiscal e „gata” fără submit

---

## 7.8 Partner machine
### Avem
- CSV import bun
- unele suprafețe portfolio
- vendor cross-org destul de bun

### Lipsește
- batch actions UI reală
- scheduled reports configurabile
- white-label real
- context client perfect
- action history batch
- batch-safe policies

### Țintă
Diana:
- importă
- triage
- intră pe client
- rulează acțiuni batch controlate
- trimite rapoarte
- vede portofoliu clar

### Nu are voie să facă
- să amestece adevărul între clienți
- să facă acțiuni batch fără aprobări unde există risc

---

## 7.9 NIS2 / DORA
### Avem
- foarte mult comparativ cu restul
- wizard
- assessment
- scoring
- remediation findings
- incident wizard

### Lipsește
- o integrare și mai bună în spine
- packaging mai bun pentru Dosar
- rollout mai clar pentru buyer
- controlled handoff explicit în locurile externe

### Țintă
NIS2 nu este modul separat cu viață proprie.
NIS2 trebuie să alimenteze:
- findings
- cockpit
- Dosar
- monitoring

---

## 7.10 AI Act
### Avem
- inventory
- clasificare
- required actions
- ceva drafts

### Lipsește
- documentație Annex-style mai serioasă
- integrare perfectă în Approval Queue
- evidence model mai bun
- intrare mai clară în Dosar

### Țintă
inventory -> confirm classification -> obligations -> resolve -> evidence -> Dosar

---

## 7.11 Pay Transparency
### Avem
- detectare aplicabilitate

### Lipsește
- upload date
- calc gap
- draft report
- workflow complet

### Țintă
Nu este doar finding decorativ; este loop complet.

---

# 8. Persona flows — versiunea canonică

## 8.1 Mihai — flow principal canonic

### F1. Onboarding -> applicability -> first task
1. intră în onboarding
2. introduce CUI
3. sistemul face enrichment
4. confirmă datele
5. vede applicability
6. intră direct în primul finding relevant

### F2. Document / policy resolve flow
1. deschide finding
2. confirmă findingul
3. sistemul deschide generatorul
4. documentul este generat
5. documentul este rescannat / validat
6. Mihai îl aprobă ca dovadă
7. findingul se rezolvă
8. dovada intră în Dosar
9. cazul intră în monitoring
10. primește review / drift / reopen când trebuie

### F3. Fiscal repair flow
1. încarcă XML
2. validator detectează problemă
3. sistemul generează propunere de repair
4. Approval Queue / inline approval control
5. Mihai aprobă
6. transmite în SPV
7. primește răspuns / status
8. dovada intră în Dosar

### F4. NIS2 assessment
1. deschide NIS2
2. vede dacă i se aplică
3. completează assessment
4. sistemul generează remediation findings
5. aprobă / pornește cazurile relevante
6. continuă prin cockpit

### F5. AI Inventory
1. adaugă sistem AI
2. sistemul propune clasificare
3. confirmă / contestă
4. sistemul generează obligații
5. acestea devin findings / tasks
6. intră în cockpit

### F6. Monitoring loop
1. primește notificare de review / drift
2. intră în findingul reaprins
3. reconfirmă / actualizează dovada
4. cazul revine în monitoring

---

## 8.2 Diana — flow principal canonic

### F1. Partner onboarding
1. selectează modul Partner
2. intră în portfolio
3. configurează branding minim

### F2. CSV import
1. încarcă CSV
2. vede preview
3. confirmă importul
4. organizațiile apar în portofoliu

### F3. Client workspace
1. intră pe client
2. contextul clientului este persistent și clar
3. lucrează fără să piardă cine este clientul activ

### F4. Batch actions
1. selectează mai mulți clienți
2. alege acțiune
3. sistemul creează / execută acțiuni conform politicii
4. Diana vede rezultatul și aprobările necesare

### F5. Scheduled reports
1. configurează tip, frecvență, clienți
2. sistemul generează rapoarte
3. trimite automat sau cere aprobare

### F6. Vendor cross-client
1. vede vendorii agregați
2. unifică duplicatele cu aprobare
3. vede risc și evidență pe vendor
4. poate folosi asta în trust pack / client delivery

---

## 8.3 Radu — flow principal canonic

### F1. Audit readiness
1. intră în dashboard extins
2. vede scor / gaps / documente lipsă
3. deschide Dosar și pack-uri
4. exportă audit pack

### F2. NIS2 / DORA controls
1. completează / actualizează assessment
2. generează findings de remediere
3. le aprobă și le urmărește
4. dovada intră în Dosar

### F3. Whistleblowing
1. primește raport
2. intră în dashboard admin
3. schimbă status
4. investighează
5. păstrează urme

### F4. Audit log / export
1. filtrează
2. exportă
3. programează dacă este permis

---

# 9. Finding / risk resolution contract

Fiecare finding trebuie să aibă:
- `finding_type_id`
- `resolution_locus`
- `resolution_mode`
- `required_evidence`
- `close_condition`
- `revalidation_trigger`
- `source_confidence`
- `review_state`

## Locus
- `IN_APP`
- `HYBRID`
- `EXTERNAL_CONTROLLED`

## Regula
Dacă este `EXTERNAL_CONTROLLED`, cockpitul nu moare.
Doar face:
- handoff
- capture
- reentry
- close in cockpit

---

# 10. Automation Layer — unificată

## Keep
- auto-refresh vizual
- proactive alerts
- tagging
- prefill
- reminders
- scheduled reports cu policy
- auto-link unde e sigur
- scoring propus

## Guardrail
- auto-repair
- findings auto-generate pentru unele cazuri
- draft DSAR / NIS2 / AI docs
- batch actions
- vendor merge
- trust publish
- partner sends

## Reject
- auto-delete by silence
- auto-close critical by law change
- reprioritizare din comportament
- submit oficial fără aprobare
- autonomie nelimitată

---

# 11. Build order — exact ce construim

## P0 — Blockers reali
1. persistență reală
2. Approval Queue reală
3. findings truth model
4. cockpit evidence truth
5. auto-link evidence
6. submit ANAF real

## P1 — Spine complet
7. Dosar truth
8. monitoring / review cycles
9. autonomy settings
10. notifications bine conectate

## P2 — Partner machine
11. batch actions
12. scheduled reports
13. client context
14. white-label basics

## P3 — Depth wedges
15. NIS2 packaging
16. vendor readiness pack
17. AI Act evidence pack
18. Pay Transparency full
19. drift maturation

## P4 — Moat later
20. self-learning
21. predictive risk
22. advanced agents
23. heavy intelligence

---

# 12. Exact ce lipsește și cum construim

## 12.1 Persistență reală
### Lipsește
Adevărul stă prea mult în JSON / in-memory.

### Construim
- organizations
- findings
- pending_actions
- documents
- dossier_entries
- alerts
- review_cycles
- user_settings
- partners / partner_clients
- vendors

### De ce e critic
Fără asta, produsul nu este produs real multi-instance.

---

## 12.2 Approval Queue reală
### Lipsește
- tabel
- API
- UI
- policies
- expirări
- diff previews

### Construim
- `pending_actions`
- list / approve / reject / edit
- audit trail
- risk levels
- approval policies pe categorie

### De ce e critic
Fără asta, human-in-the-loop este doar fragmentat.

---

## 12.3 Auto-link evidence
### Lipsește
Dovada nu se leagă singură suficient de bine de finding.

### Construim
- evidence matcher
- sourceFindingId standardizat
- document_finding linkage
- dossier entry creation

### De ce e critic
Fără asta, userul face muncă manuală inutilă și pierde încrederea.

---

## 12.4 Validate evidence
### Lipsește
Documentul generat nu este tratat consistent ca dovadă validată.

### Construim
- validation service
- checklist de structură / conținut
- status `validated_for_evidence`
- bloc de confirmare în cockpit

### De ce e critic
Fără asta, generatorul produce text, nu adevăr de rezolvare.

---

## 12.5 Submit ANAF real
### Lipsește
Flow complet până la transmitere, status și dovadă.

### Construim
- service wrapper SPV
- token secure handling
- approval-gated submit
- status retrieval
- dossier linkage

### De ce e critic
Wedge-ul fiscal nu este complet până la submit.

---

## 12.6 Autonomy settings
### Lipsește
Userul nu controlează nivelul de automatizare.

### Construim
- `user_settings`
- per-category autonomy policy
- UI de configurare
- runtime resolver pentru policies

### De ce e critic
Fără asta, automation layer e doar teorie.

---

## 12.7 Batch actions și reports
### Lipsește
Partnerul nu are încă puterea operațională promisă.

### Construim
- batch engine
- batch UI
- scheduled reports
- approval policy for sends

### De ce e critic
Fără asta, Diana nu câștigă eficiență reală.

---

# 13. Release gates

## Gate A — Applicability truth
Userul nou ajunge la applicability și next step clar.

## Gate B — First resolved finding
Userul poate închide primul finding și îl vede în Dosar.

## Gate C — Approval truth
Nicio acțiune critică nu ocolește Approval Queue.

## Gate D — Fiscal truth
Userul poate repair -> approve -> submit -> status -> Dosar.

## Gate E — Monitoring truth
Cazurile au review / recheck / reopen real.

## Gate F — Partner truth
Import, context client, batch actions și reports sunt reale, nu doar mock.

---

# 14. Ce nu avem voie să spunem

Nu spunem:
- „100% market fit”
- „100% compliant”
- „rezolvăm fără dovadă”
- „NIS2 = ISO 27001”
- „ONRC API public sigur” dacă nu avem dovadă
- „DNSC API submit” dacă avem doar support + handoff

---

# 15. Ce nu avem voie să facem

- să rupem Smart Resolve Cockpit
- să adăugăm suprafețe specialist care concurează cu spine-ul
- să introducem auto-delete by silence
- să auto-close critical findings la schimbare legislativă
- să facem submit oficial fără approval
- să coborâm prioritatea reală doar pentru că userul ignoră

---

# 16. Ce documente secundare alimentează acest canon

Acest document este documentul suprem.  
Documentele secundare rămân suport:

1. **Sprint Tasks**  
2. **User Persona Flows**  
3. **Finding / Risk Resolution Map**  
4. **Automation Layer**  
5. **Reality Gap Audit**

Dar dacă există contradicție:
## acest document câștigă

---

# 17. Final

CompliAI nu trebuie să devină:
- un mall de tool-uri
- un AI opac
- o pădure de pagini
- un demo impresionant și gol

CompliAI trebuie să devină:
## un sistem clar care știe cine e userul, ce i se aplică, ce a găsit, îl ajută să închidă cazul în cockpit, îi pune dovada în Dosar și rămâne cu ochii pe situație

Asta este forma corectă.
