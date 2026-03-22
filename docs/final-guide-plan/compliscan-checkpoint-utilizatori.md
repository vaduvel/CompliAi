# CompliScan — Checkpoint de Realitate: Cine Folosește Aplicația
**Data:** 2026-03-20
**Scop:** Toate scenariile reale de utilizare, de la 1 la 5000 angajați,
cu numărul de firme din România, durerea reală și cât plătesc.

---

## Datele de bază despre piața românească

În România există peste 1,1 milioane de firme active de tip SRL, plus ~8.000 SA.
IMM-urile constituie 90% din totalul firmelor existente.

Distribuția reală pe dimensiuni:

| Categorie | Angajați | Nr. firme România | % din total |
|---|---|---|---|
| Micro | 0-9 | ~950.000 | 86% |
| Mici | 10-49 | ~110.000 | 10% |
| Mijlocii | 50-249 | ~25.000 | 2.3% |
| Mari | 250-999 | ~5.000 | 0.5% |
| Corporate | 1000-5000+ | ~1.500 | 0.1% |

**Total firme active: ~1.100.000**
**Total cu obligații NIS2 sau AI Act: ~100.000-150.000**
**Total cu obligații GDPR: 1.100.000 (toate)**
**Total cu obligații e-Factura: 1.100.000 (toate)**

---

---

# SEGMENT 1 — Micro: 1-9 angajați
## ~950.000 firme în România

---

### Cine decide

**Administratorul / CEO** — face totul singur. Nu are departament juridic,
nu are contabil intern, nu are buget pentru consultant specializat.
Contabilul extern îi face bilanțul dar nu îi explică GDPR sau NIS2.

### Scenariul real — Agenție web, 3 angajați, Cluj

**Cristian, 34 ani, fondator agenție web**

Cristian are 3 angajați, lucrează cu 15-20 clienți per an, folosește
GitHub Copilot și ChatGPT în producție. Nu știe că AI Act îl obligă
să declare aceste sisteme. A semnat un contract cu un client mare care
cere dovada conformității GDPR. Nu știe ce să pună în dosar.

Durerea lui concretă:
- A primit un email de la un client că "trebuie să semneze un DPA"
  și nu știe ce e aia
- A auzit de NIS2 la o conferință dar nu știe dacă îl privește
- Folosește GitHub Copilot dar nu l-a declarat nicăieri
- Nu are timp să citească 200 de pagini de directive europene

Cum ajunge la CompliScan:
- Caută pe Google "ce e DPA și cum fac unul"
- Vede un articol sponsorizat sau un post în grupul de antreprenori
- Încearcă gratuit, generează DPA-ul în 5 minute, e convins

Ce folosește din CompliScan:
- Generator DPA (primul motiv de intrare)
- Scanare contract client → finding "lipsă clauze GDPR"
- AI Act inventory → adaugă GitHub Copilot și ChatGPT
- One-Page Report pentru clientul care a cerut dovada

**Frequența de utilizare:** Lunar sau la trigger (contract nou, cerere client)
**Dispus să plătească:** 49-99 lei/lună (freemium sau plan starter)
**Cine plătește:** El din buzunarul propriu
**Timp până la valoare:** Sub 10 minute (DPA generat)

---

### Scenariul real — Cabinet stomatologic, 2 angajați, Timișoara

**Dr. Ioana, 41 ani, medic stomatolog**

Procesează date de sănătate (date sensibile GDPR) pentru 500+ pacienți.
Are soft de gestiune cabinet care stochează istoricul medical.
Nu știe că prelucrarea datelor medicale are cerințe GDPR speciale.
A auzit că o clinică din oraș a primit o amendă ANSPDCP.

Durerea concretă:
- Pacienții semnează un formular de consimțământ dar nu știe dacă e corect
- Nu are registru de prelucrare date
- Softul de cabinet stochează date în cloud — nu știe dacă e legal

Ce folosește din CompliScan:
- ApplicabilityWizard → îi spune că prelucrează date sensibile (sănătate)
- Scanare formular consimțământ → findings cu ce lipsește
- Generator Politică GDPR pentru cabinet medical
- Registru prelucrare date auto-generat

**Frequența de utilizare:** Trimestrial + la cerere audit
**Dispus să plătească:** 99-149 lei/lună
**Cine plătește:** Cabinet (deductibil)
**Timp până la valoare:** 20-30 minute (politică GDPR generată)

---

### De ce e greu să vinzi la acest segment

- Nu caută activ un tool de conformitate
- Descoperă problema când e prea târziu (amendă sau cerere client)
- Buget mic, decizie rapidă dacă prețul e mic
- Sensibili la "gratis" și "fără card"

**Strategia:** Freemium agresiv. Intri pe ușa unui document gratuit
(DPA generator, politică GDPR) și upsell la plan plătit când văd valoarea.

---

---

# SEGMENT 2 — Mici: 10-49 angajați
## ~110.000 firme în România

---

### Cine decide

**CEO + eventual un office manager sau jurist part-time.**
Au deja un contabil extern și uneori un avocat cu care lucrează ocazional.
Conformitatea e "a nimănui job" — toată lumea crede că altcineva se ocupă.

### Scenariul real — Firmă IT, 22 angajați, București

**Andrei, 38 ani, CTO la o firmă de software outsourcing**

Firma lucrează cu clienți din Germania și Olanda. Clienții cer dovada
conformității GDPR și NIS2 la fiecare contract nou. Andrei e cel care
se ocupă de "chestiile astea tehnice" pentru că CEO-ul nu înțelege.

Durerea concretă:
- Clientul german a trimis un chestionar de 47 de întrebări despre securitate
- Nu au un DPO desemnat și nu știu dacă trebuie
- Folosesc 5-6 tool-uri AI în producție (Copilot, ChatGPT, Cursor etc.)
  și niciunul nu e declarat în inventar
- NIS2 îi obligă pentru că sunt furnizor IT pentru infrastructură critică

Ce folosește din CompliScan:
- Scanare chestionar client german → finding-uri mapate la NIS2/GDPR
- AI Inventory → declară toate tool-urile AI folosite + Annex IV
- NIS2 Assessment → scor maturitate + gap analysis
- Vendor Review → verifică furnizorii lor (AWS, Google, GitHub)
- Audit Pack → răspuns la chestionarul clientului german în 1 click

**Frequența de utilizare:** Săptămânal (au activitate continuă)
**Dispus să plătească:** 299-499 lei/lună (plan Pro)
**Cine plătește:** Firma (cost de business justificat)
**Valoarea demonstrată:** Un contract câștigat datorită dovezii conformității

---

### Scenariul real — Cabinet de avocatură, 15 avocați, Cluj

**Adina, 45 ani, managing partner**

Procesează date personale ale clienților (date juridice, financiare,
uneori medicale în dosare). Au o bază de date cu 3.000+ clienți.
ANSPDCP a amendat recent un alt cabinet din Cluj — Adina a aflat
și vrea să se asigure că sunt în regulă.

Durerea concretă:
- Nu au un registru de prelucrare date actualizat
- Contractele cu clienții nu au clauze GDPR corecte
- Angajații folosesc Gmail personal pentru comunicări cu clienții
- Nu știu dacă trebuie să numească un DPO

Ce folosește din CompliScan:
- Scanare contract client → finding "lipsă clauze confidențialitate date"
- Generator Registru Prelucrare Date
- Politică internă utilizare email și device-uri
- Inspector Mode → "Pregătit pentru control ANSPDCP"

**Frequența de utilizare:** Lunar
**Dispus să plătească:** 399-599 lei/lună
**Cine plătește:** Cabinetul

---

---

# SEGMENT 3 — Mijlocii: 50-249 angajați
## ~25.000 firme în România

---

### Cine decide

**CEO + Director Juridic sau Compliance Officer intern** (dacă au).
De obicei au un jurist intern care face și conformitatea "din mers".
Buget mai mare, decizie mai lentă (2-4 săptămâni ciclu de vânzare).

### Scenariul real — Firmă de transport, 120 angajați, Constanța

**Bogdan, 52 ani, director operațional**

Transportul e sector NIS2 obligatoriu. Firma are flota de 45 camioane,
sistem GPS tracking, parteneriate cu porturi. DNSC i-a trimis o notificare
că trebuie să se înregistreze. Bogdan a dat email-ul mai departe la
"juristul firmei" care nu știe ce e NIS2.

Durerea concretă:
- Termenul de înregistrare DNSC a trecut
- Nu au un plan de răspuns la incidente cibernetice
- Sistemul GPS e conectat la internet — potențial attack surface
- Nu știu cine e "responsabilul de securitate" cerut de NIS2

Ce folosește din CompliScan:
- NIS2 Late Registration Wizard → "nu e prea târziu"
- NIS2 Assessment complet → scor maturitate pe 10 domenii
- Incident Management → creează primul plan de răspuns
- Vendor Review → evaluează furnizorul de GPS tracking
- DNSC Report generat automat → trimis la evidenta@dnsc.ro

**Frequența de utilizare:** Zilnic în prima lună, săptămânal după
**Dispus să plătească:** 799-1.499 lei/lună (plan Pro sau Enterprise Lite)
**Cine plătește:** Firma, aprobat de CEO
**Ciclu de vânzare:** 2-3 săptămâni

---

### Scenariul real — Clinică privată, 80 angajați, Iași

**Dr. Mihai, 48 ani, director medical**

Procesează date medicale (categoria cea mai sensibilă GDPR).
Folosesc un sistem HIS (Hospital Information System) care stochează
datele pacienților. Au și un sistem AI pentru interpretare imagistică
(categorie high-risk AI Act).

Durerea concretă:
- Sistemul AI de imagistică nu e declarat nicăieri
- Datele pacienților sunt transferate la laboratorul extern — fără DPA
- Nu au DPIA (Data Protection Impact Assessment) pentru date medicale
- ANSPDCP a anunțat că va intensifica controalele în sănătate în 2026

Ce folosește din CompliScan:
- AI Act Inventory → sistemul de imagistică = high-risk, Annex IV obligatoriu
- GDPR DPIA generator pentru date medicale
- DPA cu laboratorul extern
- Health Check → "CRITIC: lipsă DPIA pentru sistem AI high-risk"

**Frequența de utilizare:** Săptămânal
**Dispus să plătească:** 999-1.499 lei/lună
**Cine plătește:** Clinica

---

---

# SEGMENT 4 — Consultanți & Cabinete (indiferent de mărime)
## ~50.000 contabili + ~15.000 avocați + ~8.000 consultanți

---

### Cine decide

**Partenerul / Proprietarul cabinetului.**
Decizie rapidă dacă văd că economisesc timp. Adoptă tooluri noi mai
ușor decât firmele corporate.

### Scenariul real — Cabinet contabil, 3 contabili, 35 clienți, Brașov

**Elena, 39 ani, contabil autorizat**

Elena gestionează conformitatea fiscală pentru 35 de clienți IMM.
Din ce în ce mai mulți clienți o întreabă de NIS2, GDPR, AI Act.
Nu e expertiza ei, dar dacă nu răspunde pierde clientul.

Durerea concretă:
- 5 clienți au primit deja cereri de conformitate GDPR de la parteneri
- 3 clienți sunt în sectoare NIS2 obligatorii și nu știu
- Ea pierde 2-3 ore per client doar pentru a explica ce trebuie făcut
- Nu poate scala — are timp limitat

Ce folosește din CompliScan (plan Partner):
- Multi-client hub → 35 clienți dintr-un singur dashboard
- Per client: scanare documente, findings, generator politici
- Raport săptămânal automat → știe care client are urgențe
- Digest per client → trimite clientului raportul de status lunar
- DPA generator → generează pentru toți clienții care au nevoie

**Frequența de utilizare:** Zilnic (e toolul ei de lucru)
**Dispus să plătească:** 999-1.499 lei/lună plan Partner
**ROI pentru ea:** Gestionează 35 clienți în 2 ore/zi în loc de 8 ore/zi
**Valoarea reală:** Poate lua 20 clienți noi fără să angajeze pe nimeni

---

### Scenariul real — Consultant NIS2, freelancer, 12 clienți, București

**Radu, 44 ani, consultant securitate cibernetică**

Radu face audituri NIS2 și consultanță de implementare. Până acum
folosea Excel + Word + email. Fiecare audit îi lua 2-3 săptămâni.
Cu CompliScan face primul audit în 2-3 zile.

Ce folosește:
- NIS2 Assessment → completează cu clientul în 1 oră (nu 3 zile)
- Gap analysis automat → raport instant în loc de Word scris manual
- Remediation plan → generat automat cu priorități
- Audit Pack → livrat clientului în 1 click

**Frequența de utilizare:** Zilnic
**Dispus să plătească:** 1.499-2.499 lei/lună
**ROI:** Preia de 3x mai mulți clienți cu același timp

---

---

# SEGMENT 5 — Mari: 250-999 angajați
## ~5.000 firme în România

---

### Cine decide

**Director Juridic + CISO + eventual un Compliance Officer dedicat.**
Ciclu de vânzare lung (1-3 luni). Necesită demo, trial, aprobare buget.
Au deja tool-uri parțiale dar fragmentate.

### Scenariul real — Bancă regională, 400 angajați, București

**Roxana, 36 ani, Compliance Officer**

Banca e obligată NIS2 (sector financiar = entitate esențială).
Au deja un tool enterprise pentru GDPR (OneTrust, 15.000€/an) dar
nu acoperă NIS2 local, nu se conectează la ANAF, nu vorbește română.

Durerea concretă:
- OneTrust nu generează rapoarte pentru DNSC în format cerut
- Echipa de conformitate pierde 3 zile/lună să traducă din OneTrust
  în formatul DNSC
- e-Factura semnalele nu sunt monitorizate de niciun tool
- ANSPDCP a cerut un registru de prelucrare în română — OneTrust
  îl generează în engleză

Ce folosește din CompliScan:
- NIS2 DNSC reporting în română și format corect
- e-Factura signal monitoring
- Rapoarte ANSPDCP în română
- Complement la OneTrust, nu înlocuitor

**Frequența de utilizare:** Zilnic (echipă de 2-3 persoane)
**Dispus să plătească:** 2.999-4.999 lei/lună (Enterprise)
**Ciclu de vânzare:** 4-8 săptămâni
**Obs:** Nu înlocuiești OneTrust. Ești complementul lui local.

---

---

# SEGMENT 6 — Corporate: 1000-5000 angajați
## ~1.500 firme în România

---

### Realitatea

La acest segment CompliScan **nu e soluția primară** acum.
Au deja: CISO dedicat, echipă de compliance, tool-uri enterprise
(ServiceNow GRC, MetricStream, Archer etc.), bugete mari.

**Dar poți intra pe ușa din spate:**

Problema lor e că tool-urile enterprise nu acoperă specificul românesc:
- Nu generează rapoarte DNSC în formatul cerut
- Nu monitorizează semnalele ANAF/e-Factura
- Nu se integrează cu SPV-ul românesc
- Rapoartele sunt în engleză, auditorii ANSPDCP cer română

**Scenariul de vânzare:**

Nu vinzi CompliScan ca platformă principală. Vinzi un **modul complementar**
"Romanian Compliance Layer" care se conectează la tool-ul lor existent
și rezolvă doar specificul local.

**Prețul:** 4.999-9.999 lei/lună (enterprise custom)
**Ciclu vânzare:** 3-6 luni
**Recomandare:** Nu acesta e targetul tău acum. Revii la el în 2028.

---

---

# Rezumat final — Piramida reală de clienți

```
                    ┌─────────────────────┐
                    │  Corporate 1000+    │  ~1.500 firme
                    │  Nu acum, 2028      │  Preț: 5.000-10.000 lei/lună
                    └──────────┬──────────┘
                    ┌──────────┴──────────┐
                    │  Mari 250-999       │  ~5.000 firme
                    │  Complementar       │  Preț: 3.000-5.000 lei/lună
                    └──────────┬──────────┘
                    ┌──────────┴──────────┐
                    │  Consultanți/DPO    │  ~73.000 profesioniști
                    │  PRIORITATEA 1      │  Preț: 1.000-2.500 lei/lună
                    └──────────┬──────────┘
                    ┌──────────┴──────────┐
                    │  Mijlocii 50-249    │  ~25.000 firme
                    │  PRIORITATEA 2      │  Preț: 800-1.500 lei/lună
                    └──────────┬──────────┘
                    ┌──────────┴──────────┐
                    │  Mici 10-49         │  ~110.000 firme
                    │  PRIORITATEA 3      │  Preț: 300-600 lei/lună
                    └──────────┬──────────┘
               ┌───────────────┴───────────────┐
               │  Micro 1-9 angajați            │  ~950.000 firme
               │  Freemium → Starter            │  Preț: 0-150 lei/lună
               └────────────────────────────────┘
```

---

## Unde sunt banii reali

| Segment | Nr. firme targetabile | % conversie realist | Clienți potențiali | MRR potențial |
|---|---|---|---|---|
| Consultanți | 73.000 | 2% | 1.460 | 1.460 × 1.500 = **2,2M lei** |
| Mijlocii | 25.000 | 1% | 250 | 250 × 1.000 = **250k lei** |
| Mici IT/fin/sănătate | 30.000 | 1.5% | 450 | 450 × 450 = **202k lei** |
| Micro cu trigger | 100.000 | 0.5% | 500 | 500 × 100 = **50k lei** |
| **TOTAL realist an 1** | | | **~2.660** | **~2,7M lei/lună** |

**Dacă prinzi doar 10% din potențialul de mai sus:**
→ 266 clienți → ~270.000 lei/lună MRR → ~3,2M lei/an ARR

Asta e un business real și sustenabil, construit doar pe România,
fără să ai nevoie de investitori sau expansiune europeană în primul an.

---

## Concluzia checkpoint-ului

**Cine folosește aplicația — răspunsul onest:**

Oricine din lista de mai sus, DAR în ordine de prioritate:

1. **Consultanții** — revin zilnic, plătesc cel mai mult, aduc alți clienți
2. **Firmele mijlocii din IT, transport, sănătate, financiar** — NIS2/AI Act
   le bate la ușă acum, au buget, decizie relativ rapidă
3. **Firmele mici** — intră prin e-Factura sau prin cerere de la un client mare
4. **Microîntreprinderile** — intră prin freemium, convertesc greu dar sunt milioane

**Ce înseamnă asta pentru tine acum:**

Nu construi pentru toți simultan. Lansezi pentru consultanți,
crești spre mijlocii, freemium-ul aduce micro-urile singure.
Iar dacă stabilizezi aplicația în 6-8 săptămâni, ești
perfect poziționat pentru deadlines AI Act (august 2026)
și NIS2 amenzi (octombrie 2026).
