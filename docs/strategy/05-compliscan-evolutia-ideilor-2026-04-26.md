# 05 — CompliScan: evoluția ideilor și thesis-urilor (muzeul de idei)

**Data**: 26 aprilie 2026
**Status**: canonical — singura sursă pentru "ce idei am gândit, ce am invalidat, ce mai poate fi reactivat"
**Scop**: păstrăm TOATE iterations + brainstorm-urile + alternativele considerate. Decision finală se ia citind acest doc + cele 4 docs canonice (01-04).
**Regula maintainerului**: NU șterge idei din acest doc. Le marchează ca "invalidat", "păstrat backup", sau "direcție curentă". User va decide la final ce taie.

---

## TL;DR

Acest document e **muzeul ideilor**. Conține:

- **7 iterations majore** (de la "Cabinet OS pentru contabili CECCAR" la "Compliance Loop OS")
- **3 căi alternative** considerate (GDPR-only, vinzi acum, niche specific cu 3 sub-căi)
- **Învățăminte cumulate empiric** (tools-uri DPO, pricing piață, concurenți reali, ANSPDCP enforcement)
- **Decision framework** pentru selecția finală

**Direcția curentă** (v4.0): **Compliance Loop OS** cu 4-5 ICP-uri orizontale (Solo + IMM Internal + Cabinet + Fiscal + Enterprise) — vezi Doc 01-04 pentru detalii operaționale.

**Backup options păstrate** (în caz că v4.0 eșuează în pilot):
- v3.0: 5 produse vertical specializate (Stripe pattern)
- NIS2 sector public RO (3.180 UAT-uri)
- DPO OS GDPR-only (concurență cu Privacy Manager)
- Vinzi cod ca asset (acquihire €40-80K)

---

## Iteration 1 — Cabinet OS pentru contabili CECCAR

**Source**: răspuns inițial al lui Claude la primul prompt founder. Asumată că "contabilii" sunt user principal.

**Conținut propus**:
- ICP primary: cabinet contabil CECCAR (12.800 firme RO)
- Feature primary: e-Factura validator + SPV ANAF + SAF-T + GDPR adăugat
- Pricing: €30-150/lună per client
- Distribution: Facebook groups "Contabili pe Facebook" 50K + Nicoleta Banciu 34K

**Validare empirică**: ❌ INVALIDATĂ de user.

**Citatul user (decision moment)**:
> "deci intrebare finala, comli ai doar trebuie sa schimbe de l acontabil, pentru dpo, atat si sa bage sc ii mailipsest e, fiscalul devine pentru contabili, da sau nu?"

**De ce invalidată**:
1. Contabilul român = expert pe ANAF + e-Factura + SAF-T, NU pe GDPR
2. CECCAR nu certifică DPO; certificarea e CIPP/E sau DPO oficial CNPDC
3. Conform GDPR, contabilul al unei firme NU poate fi DPO al ei (conflict de interese — Avocatnet, EDPB WP243, caz Belgia €50K amendă)
4. Cabinet contabil care vinde GDPR la clienți → vinde fără să poată semna sau valida juridic

**Status v4.0**: ❌ INVALIDATĂ ca ICP primary. Contabilul rămâne ca **segment Fiscal** (Doc 01 secțiunea 6.4) cu pricing €29-199 pentru e-Factura + GDPR lite per client.

**Lecții pentru v4.0**:
- Fiscal e segment legitim, dar SECONDAR
- Distribuție via Facebook groups CECCAR rămâne validă pentru segment Fiscal

---

## Iteration 2 — DPO OS pentru cabinet GDPR

**Source**: răspuns post-invalidare contabili. Reposition la Diana DPO consultant.

**Conținut propus**:
- ICP primary: Diana, DPO consultant cabinet (20-80 clienți IMM)
- Feature primary: GDPR + DSAR + RoPA + Privacy Policy + DPA + ANSPDCP correspondence
- Pricing: €99-249/lună
- Concurență cunoscută: Privacy Manager, MyDPO Decalex
- Pattern: vertical specialist single-framework

**Validare empirică**: ⚠️ PARȚIAL VALIDATĂ.

**DPO firm sofisticat (DPO Complet fictiv)** a acceptat pilot 30 zile internal-first cu 6 condiții:
1. Date reale vs pseudonimizate clarificate per client
2. Documente AI marcate DRAFT până la validarea consultantului
3. Cel puțin 1 flux complet cu template-ul cabinetului
4. Audit Pack descărcat local + structură verificabilă
5. AI OFF pentru clientul sensibil
6. Magic link cu workaround email pentru reject/comment

**Probleme identificate**:
- Privacy Manager (privacymanager.ro) deja face multi-client cu 14 module
- MyDPO (Decalex) deja are AI GDPR din 2023, 800+ clienți distribution
- Wolters Kluwer GDPR Soft enterprise localized
- kitgdpr.ro document store

→ NU suntem first-mover pe acest segment. Pricing transparent + cockpit finding-first sunt diferentiatori reali, dar NU breakthrough.

**Status v4.0**: ⚠️ INTEGRATĂ ca **segment Cabinet** (Doc 01 secțiunea 6.3) cu pricing €499-1999/lună. Pilot DPO Complet rămâne în acest segment.

**Backup option**: dacă v4.0 (Compliance Loop OS multi-segment) eșuează în pilot → fallback la "DPO OS GDPR-only" cu focus exclusiv pe acest segment cabinet, accepting marginal differentiation cu Privacy Manager + MyDPO.

**Lecții pentru v4.0**:
- Cabinet segment validat empiric
- Diferentiator real = cockpit finding-first + pricing transparent + white-label complet
- AI Act + NIS2 + ANAF integrations native ca multi-framework cabinet rămân atractive

---

## Iteration 3 — Multi-framework all-in-one

**Source**: discovery 5 produse în cod (DPO + NIS2 + AI Act + DORA + Fiscal).

**Conținut propus**:
- Mesaj: "CompliScan acoperă 8 framework-uri într-un singur tool"
- Pricing: modular cu add-on per framework
- Pattern: platformă unificată

**Validare empirică**: ❌ INVALIDATĂ.

**Citatul user (decision moment)**:
> "deci o singura firma se ocupa de atatea legi de compliance? daca acest dpo face toate astea cu 18 tools?"

**De ce invalidată**:
1. **DPO consultant tipic NU folosește multi-framework**. DPO face 80-90% GDPR. CISO face NIS2. Financial face DORA. Etc. Specializare segmentată.
2. Mesajul "all-in-one" cumpărătorul citește "nu am nevoie de 80%". Nu se identifică.
3. Tools real per DPO: 8-10 (NU 18 generic). DPO GDPR-only folosește 8-10 tools, CompliScan ar înlocui 6-8 din ele.
4. Industria globală vinde compliance ca **vertical specialist tools** (Vanta SOC2, OneTrust Privacy, Drata GRC), NU ca platformă universală.

**Status v4.0**: ❌ INVALIDATĂ ca pricing model. Pricing modular all-in-one a fost înlocuit cu **5 grupuri tier per ICP segment** (Doc 01 secțiunea 6).

**Lecții pentru v4.0**:
- Cumpărători diferiți NU folosesc toate frameworks
- Mesaj per landing page specific NU bundle generic
- Pattern Salesforce (1 infrastructure, configurabilă per industrie) > pattern SAP (all-in-one)

---

## Iteration 4 — GRC pentru mid-market RO

**Source**: discovery firma RO mid-market sună la 3-5 firme diferite și plătește €80K-150K/an.

**Conținut propus**:
- ICP primary: Compliance Officer intern la firmă fintech / healthcare / digital RO 50-500 angajați
- Categorie nouă: "GRC integrat pentru IMM-uri mid-market RO"
- Mesaj: "un singur tool, GDPR + NIS2 + AI Act + DORA, specific RO"
- Pricing: €299-2.999/lună

**Validare empirică**: ❌ INVALIDATĂ de user.

**Citatul user (decision moment)**:
> "pai asat este o probleme ca nu avem pilot sa piloteze aplicatia, ca este un stack de mai multe legi care in prezent este condusa de 3-4 firme diferite, nu poti forta sa se reprofileze si sa devina grc"

**De ce invalidată parțial**:
1. **Compliance Officer dedicat la IMM = nu există ca rol formal în RO la scară**:
   - LinkedIn RO 2026: 81 joburi "Compliance Officer", 30 "Legal Compliance Officer"
   - Cine angajează: banking/fintech, big tech RO offices, Big 4, multinaționale, pharma — NU IMM mid-market
   - IMM (sub 250 ang) practic niciodată
   - Mid-market (250-500 ang) extrem de rar
2. **Reprofilare DPO/CISO la "GRC officer" = shift de carieră, NU schimbare de tool**. Nu se întâmplă peste noapte.
3. Categoria "GRC officer la IMM" e tendință globală cu 3-5 ani lag în RO vs US/UK.

**Status v4.0**: ⚠️ PARȚIAL PĂSTRATĂ. Categoria "GRC officer formal" nu există la IMM, dar **rolul există ne-formal** — Office Manager / HR Manager / Legal Counsel cu compliance ca 30% job. Pivotat la **segment IMM Internal** (Doc 01 secțiunea 6.2) — angajat existent existing role + tool €299-999/lună (NU rol nou angajat).

**Lecții pentru v4.0**:
- Nu vinde "compliance officer dedicate" — categoria nu există
- Vinde "tool care permite angajat existent să gestioneze compliance"
- Math vs 4 consultanți (€60-100K/an → €299-999/lună + 1 angajat existing) = lovitura de gratie

---

## Iteration 5 — 3 căi reale alternative (brainstorm extensive)

**Source**: post-invalidare GRC, brainstorm pentru alternative concrete.

### Calea A — GDPR-only DPO OS

**Conținut**:
- Activează doar GDPR + DSAR + RoPA + Vendor + Privacy Policy
- Modulele NIS2 + AI Act + DORA + Pay Transp = HIDDEN
- Concurezi direct cu Privacy Manager (12 ani avans) + MyDPO Decalex (1.000+ clienți istorici)
- Vinzi la €99-249/lună la Diana DPO consultant
- Pierzi 70% din valoarea codului
- 6-18 luni de muncă suplimentară până la 30 clienți plătitori
- Exit value: €100-300K la 12-18 luni

**Status v4.0**: ⚠️ PĂSTRATĂ ca backup option. Dacă v4.0 multi-segment eșuează → fallback la GDPR-only Cabinet pure-play.

### Calea B — Vinzi acum ca asset code + IP

**Conținut**:
- Listezi pe MicroAcquire: "Pre-revenue compliance SaaS, multi-framework, RO native, V3 design, 800 fișiere, 18K LOC compliance engine"
- Cumpărători potențiali: Decalex, Privacy Manager, Big 4 RO offices, investitor strategic local
- Cer €40-80K + earnout pe revenue
- Avantaj: cash certain + 6-12 luni libertate + lecții pentru next product
- Dezavantaj: lași bani pe masă, codul valorează mai mult în 6-12 luni cu chiar și 5 clienți, pierzi optionality

**Status v4.0**: ⚠️ PĂSTRATĂ ca exit option dacă v4.0 nu prinde piața în 6-12 luni.

### Calea C — Pivot la single-framework specializat ULTRA-NICHE

#### Sub-calea 3A — NIS2 OS pentru sector public RO

**Conținut**:
- ICP: 3.180 primării RO + autorități locale + ministere = toate obligate Art. 37 GDPR + NIS2 prin OUG 155/2024
- Cumpărător: primar / secretar UAT / responsabil IT primărie
- Buget: alocat din fonduri europene + bugete locale (achiziție publică SEAP)
- Tarif: €2K-10K/an per UAT
- Concurență RO: zero specific public sector
- Scale: 3.180 UAT × €5K mediu = €15.9M TAM
- Sales cycle public: 6-9 luni
- Trebuie certificări: ISO 27001 partner, parteneriat cu integrator IT public
- Distribuție: 1 contract cu ACoR (Asociația Comunelor) → 100+ UAT-uri în 12 luni

**Status v4.0**: ⚠️ PĂSTRATĂ ca **major backup option**. Dacă v4.0 multi-segment privat eșuează în pilot → pivot agresiv la sector public NIS2.

**De ce e atractivă**:
- Cumpărător forțat prin lege (NU opțional)
- Concurență ZERO specific public sector RO
- Bugete publice + fonduri europene (bani există)
- Codul e 80% gata pentru NIS2 + GDPR + audit pack

**Limitări**:
- Sales cycle public 6-9 luni vs private 1-2 luni
- Politica locală + procurement complex
- Trebuie partener ISO 27001

#### Sub-calea 3B — DORA OS pentru fintech RO

**Conținut**:
- ICP: ~250-300 entități financiare RO obligate DORA din 17 ian 2025
- Cumpărător: Compliance Officer / Chief Risk Officer la fintech/banking
- Buget: mare — DORA non-compliance = pierdere licență BNR
- Tarif: €10K-50K/an per entitate
- Concurență RO: Big 4 (PwC, Deloitte) + 2-3 firme specializate, dar fără tool dedicat
- Scale: 100 fintech-uri target × €20K mediu = €2M ARR posibil

**Status v4.0**: ⚠️ INTEGRATĂ ca **segment Enterprise + Cabinet Studio** (Doc 01) cu lansare 2028. Sprint MAJOR 12+ săpt necesar (DORA maturity 15% azi).

#### Sub-calea 3C — Healthcare GDPR + NIS2 RO

**Conținut**:
- ICP: 4.000+ clinici private + 500+ cabinete medicale + 150+ spitale
- Toate sub Art. 9 GDPR (categorii speciale date) + NIS2 sector sănătate
- Cumpărător: director medical / administrator / compliance officer spital
- Tarif: €100-500/lună per clinică
- Concurență RO: zero specializat healthcare
- Scale: 1.000 entități plătitoare × €200 mediu = €200K MRR posibil
- Integrări specifice: CNAS, ANSPDCP healthcare

**Status v4.0**: ⚠️ PĂSTRATĂ ca niche backup option. Dacă v4.0 prinde dar Solo + IMM nu performează → pivot la healthcare vertical.

---

## Iteration 6 — 5 produse vertical (Stripe pattern) [v3.0]

**Source**: discovery user "engine face 5 frameworks → împart în 5 produse → vând fiecare separat".

**Conținut propus** (v3.0):

```
                COMPLISCAN
       (1 brand · 1 cod · 5 produse comerciale)
                    │
    ┌───────┬──────┼──────┬──────────┐
    ▼       ▼      ▼      ▼          ▼
┌────────┐┌──────┐┌────┐┌──────┐┌────────┐
│ DPO    ││ NIS2 ││ AI ││ DORA ││ Fiscal │
│ OS     ││ OS   ││ OS ││ OS   ││ OS     │
└────────┘└──────┘└────┘└──────┘└────────┘
Diana    Mihai   Andrei Cristina Marius
DPO      CISO    AIGov  FinComp  CECCAR
GDPR     NIS2    AI Act DORA     e-Factura
€49-299  €99-599 €149+  €499+    €29-199
Q3 2026  Q1 2027 2028   2028     Q3 2027
```

**5 produse vertical specializate cu pricing tiers proprii**:

### DPO OS pricing (v3.0)
| Tier | Preț/lună | Scope |
|---|---|---|
| Solo DPO | €49 | 1 DPO, 5 clienți |
| Cabinet DPO | €149 | 1 cabinet, 30 clienți |
| Pro DPO | €299 | 1 cabinet, 80 clienți |
| Studio DPO | €599 | Multi-cabinet |

### NIS2 OS pricing (v3.0)
| Tier | Preț/lună | Scope |
|---|---|---|
| Single Entity | €99 | 1 firmă proprie |
| Cabinet NIS2 | €299 | 3-15 clienți |
| Pro NIS2 | €599 | 15+ clienți |

### Fiscal OS pricing (v3.0)
| Tier | Preț/lună | Scope |
|---|---|---|
| Solo Fiscal | €29 | 1 contabil, 30 clienți |
| Cabinet Fiscal | €99 | 100 clienți |
| Pro Fiscal | €199 | 100+ clienți |

### AI Act OS pricing (v3.0)
| Tier | Preț/lună | Scope |
|---|---|---|
| Starter AI | €149 | 1 firmă AI usage |
| Pro AI | €499 | AI provider/deployer |

### DORA OS pricing (v3.0)
| Tier | Preț/lună | Scope |
|---|---|---|
| Single Entity | €499 | 1 fintech |
| Multi Entity | €1.499 | Cabinet 5-15 clienți |
| Enterprise | Custom | Banks, asigurări |

### Combo Multi-Framework (v3.0 — păstrat)
| Combo | Preț/lună |
|---|---|
| DPO + NIS2 | €399 |
| DPO + AI Act | €449 |
| Studio All-in | €1.999 |

**Lansare faseată**: DPO OS Q3 2026 → NIS2 OS Q1 2027 → Fiscal OS Q3 2027 → AI Act + DORA 2028.

**Status v4.0**: ⚠️ ÎNLOCUITĂ DAR PĂSTRATĂ CA BACKUP. User a observat că v3.0 era "prea rigid" (5 produse cu code separat) și a propus v4.0 (Compliance Loop OS = 1 infrastructură pentru 4-5 ICP-uri).

**De ce v3.0 a fost înlocuită**:
- Pattern Stripe (5 produse tehnic separate Connect/Atlas/Issuing) NU se aplică la CompliScan — codul e generic, NU 5 produse separate
- Cumpărătorul (CISO consultant) NU vrea "NIS2 OS" — vrea **un tool care face NIS2 + GDPR cross-client portfolio**
- ICP-urile sunt orizontale (Solo/IMM/Cabinet/Fiscal/Enterprise), NU verticale per framework

**Backup option**: dacă v4.0 messaging "Compliance Loop OS" e prea abstract pentru piața RO → fallback la v3.0 cu mesaj "5 produse compliance vertical specializate" (mai concret per cumpărător).

**Lecții pentru v4.0**:
- Pricing tiers v3.0 (€49/€149/€299/€599 etc.) au fost **PĂSTRATE** în v4.0 ca segment-based pricing
- Combo Multi-Framework concept (€399-1.999) păstrat ca **add-on per ICP segment**
- Roadmap lansare faseată păstrată

---

## Iteration 10 — GTM Evolution în 3 faze (v4.4, validat 27 apr 2026)

**Source**: user a observat că rolul "Compliance Officer IMM" nu există încă în RO la scară. În alte țări există (banking, fintech, corporații, multinaționale), dar în RO IMM-urile **NU au om dedicat**. Întrebarea critică: putem ține modular azi, apoi împingem ca tool intern după ce categoria se formează?

**Răspuns user-validated**: DA. Formula corectă = **3 faze cu evoluție narrativă**.

### Faza 1 — Modular pe oameni existenți (azi → mar 2027)

Vinzi specialiștilor care **există deja și au buget azi**:
- DPO consultant (GDPR core)
- Contabil CECCAR (e-Factura layer)
- CISO/NIS2 consultant (governance layer)
- HR/legal consultant (whistleblowing + pay transp add-on)
- AI advisor (AI inventory + Annex IV draft)

**Mesaj-cheie**: "îți fac workflow-ul actual mai ordonat" (NU "schimbă profesia")

### Faza 2 — Bundle pentru IMM (apr 2027 → dec 2027)

După module validate separat, **împachetezi pentru IMM mid-market**:

> "Ai GDPR + NIS2 + Whistleblowing + Pay Transparency + fiscal în locuri diferite? CompliScan le pune într-un singur control tower."

**User role-flexibil**: CFO / COO / HR Manager / Legal Counsel / Office Manager. **NU presupui rol nou** "Compliance Officer".

**Math**: IMM 100 ang plătește €60-100K/an la 4-8 consultanți → CompliScan €7.2K/an + 1 angajat existing role + ad-hoc consultant €3-5K/an = €10-12K/an total = **reducere 80-90%**.

### Faza 3 — Creezi categoria "Compliance Officer IMM" (2028+)

Doar după 20-50 IMM-uri unde **un om intern chiar folosește platforma**, atunci împingi mesajul big:

> "CompliScan permite IMM-ului să aibă funcție de compliance internă fără departament enterprise."

**Direcția mare**, dar **NU primul pas comercial**.

### De ce v4.4 e mai matură decât v4.3

| Aspect | v4.3 (5 segmente secvențial) | v4.4 (3 faze evoluție narrative) |
|---|---|---|
| IMM Internal poziție | luna 6-9 (octombrie 2026 - ianuarie 2027) | Faza 2 (apr 2027+) |
| Forțare categorie | da (presupune "Compliance Officer IMM" există) | NU (creezi categoria după valididare) |
| Mesaj per fază | mesaje per segment fragmentate | mesaj evoluează: "ordonez workflow" → "control tower" → "internalizezi compliance" |
| Realitate piață RO | parțial corect | aliniat cu timing real (rol vine în 2-5 ani) |

### Realitatea pieței RO 2026 vs alte țări

**În RO**:
- Compliance Officer dedicat la IMM = **NU există** la scară
- Există la bănci, fintech, corporații, multinaționale (200-400 firme)
- Mass-market IMM (25.000 firme mid-market) = **role diluat în CFO/COO/HR/Legal**

**În alte țări (US/UK)**:
- Compliance Officer la SMB e mai răspândit (50K+ joburi)
- Vanta, Drata, Sprinto = produse construite presupunând rolul există
- LinkedIn 2.000 joburi compliance RO = mostly enterprise + banking + multinaționale

### Timeline detaliat emergența rol RO (3-5 / 5-7 / niciodată micro)

| Perioadă | Segment | Status emergent |
|---|---|---|
| **2026-2027** (azi) | IMM reglementate (fintech, healthcare, energie) | 200-400 firme angajează primul "Compliance Specialist" |
| **3-5 ani (2029-2031)** | IMM mid-market 100-500 ang în sectoare reglementate (healthcare, fintech, IT, manufacturing, logistică, energie, retail mare) | Rol vizibil ca "Responsabil Compliance / GRC Coordinator" |
| **5-7 ani (2031-2033)** | Firme mid-market 100-500 ang general | Devine **normal** ca funcție internă, nu opțional |
| **Niciodată full-time** | Micro / SRL mic (<50 ang) | Rămâne owner + contabil + consultant extern + tool |

→ **CompliScan e early. Piața vine la noi în 3-5 ani prin EU pressure**. Pentru micro segment, NU vinde niciodată "officer intern" — vinde DIY tool (Solo tier €29-49).

### De ce NU există acum în România (5 motive validate empiric)

1. **Legile au venit separat → specialiști separați**:
   - GDPR (2018) → DPO consultant
   - NIS2 (2024) → CISO/cyber consultant
   - DORA (2025) → financial compliance Big 4
   - e-Factura (2022) → contabil CECCAR
   - Whistleblowing (2022) + Pay Transp (2026) → HR/legal
   - **Niciun rol unificator** nu a apărut natural — fiecare lege a creat propriul specialist

2. **IMM-ul român e reactiv, nu proactiv**:
   - Face compliance când **cere clientul mare** (B2B contracte cu cerințe)
   - Sau când **cere banca** (loan covenants compliance)
   - Sau când **cere auditorul** (financial/cyber)
   - Sau când **cere autoritatea** (control ANSPDCP/DNSC/ANAF)
   - Mentalitatea "funcție internă permanentă" NU e încă răspândită

3. **Bugetul nu permite GRC officer dedicat**:
   - Salariu GRC manager RO: €30-50K/an entry, €60-100K senior
   - IMM 100 ang preferă "consultant când am nevoie" (€10-30K/an ad-hoc) decât full-time
   - Math: angajat full-time NU e justificat până când compliance devine continuu, NU sezonier

4. **NU există tool simplu pentru omul ăla**:
   - ServiceNow GRC / OneTrust / RSA Archer = **enterprise** ($50K-500K/an), îl omori pe IMM
   - Excel = NU scalează la 5+ frameworks
   - Privacy Manager / Eramba = vertical specialist, NU multi-framework
   - **Slot-ul "tool simplu pentru GRC mid-market RO" = gol** ← aici e CompliScan

5. **Piața nu a fost forțată destul** (până acum):
   - Pre-2024: doar GDPR enforcement ANSPDCP modest (€213-472K/an)
   - 2024+: NIS2 + DORA + AI Act + Pay Transp + Whistleblowing simultan
   - Compounding pressure → mid-market trebuie să se organizeze
   - **Asta se schimbă acum**

### De ce EXISTĂ în alte țări (5 motive validate empiric)

1. **Piețe mature pe audit + vendor due diligence**:
   - SOC 2 audit standard pentru SaaS US
   - ISO 27001 cerut pentru fintech UK/EU
   - Cyber insurance cere ISO/NIST baseline
   - Risk management + board governance = funcții cu istoric

2. **B2B cere dovadă compliance înainte de cumpărare**:
   - Enterprise procurement cere DPA + ISO 27001 + SOC 2 înainte de contract
   - Firme SMB trebuie să răspundă rapid → angajează GRC pentru "audit-ready continuous"

3. **Istoric litigii + amenzi mai dur**:
   - SUA: lawsuits CCPA, HIPAA fines în milioane $
   - UK: ICO fines în milioane £ (BA, Marriott, Equifax)
   - EU: GDPR fines (€746M Amazon, €405M Meta)
   - Compliance NU e "hârtie", e **risc operațional cuantificat**

4. **Bugetele permit salarii GRC**:
   - US: GRC analyst $80-130K, GRC manager $130-200K, GRC director $180-300K
   - UK: £60-150K standardizat
   - EU enterprise: €70-150K
   - În RO: rolurile există DOAR la enterprise + financial care își permit salarii similare

5. **Tool-urile au educat piața**:
   - Vanta (2018), Drata (2020), Sprinto (2020), Hyperproof (2018) — fast-growing SMB SaaS
   - 12-30K customers fiecare = piață educată că "compliance e funcție continuă"
   - Când tool-urile există accesibile, apare **omul care le operează**

### Driveri pentru categorie nouă RO 2027-2030 (când vine valul)

- **NIS2 enforcement DNSC** (12-20K entități obligate, deadline implementare oct 2026)
- **DORA enforcement BNR** (250-300 fintech-uri, intrat în vigoare 17 ian 2025)
- **AI Act enforcement EU AI Office** (5-30 firme RO cu produse AI, timeline 2025-2027)
- **Pay Transparency** (7 iun 2026 transpunere, firme 50+ ang)
- **Whistleblowing** (Legea 361/2022 RO, firme 50+ ang)
- **Cyber insurance** require compliance baseline (creștere RO)
- **B2B procurement** la corporate care cer dovezi compliance la furnizori IMM

### Predicție realistă RO

- **2026-2027**: 200-400 firme angajează primul "Compliance Specialist"
- **2028-2029** (3 ani): 1.000-2.000 firme cu rol dedicat
- **2030+** (5-7 ani): standard pentru firme >100 angajați în sectoare reglementate

### Propoziția strategică pentru CompliScan v4.4

> **"CompliScan nu așteaptă să existe GRC officer-ul în toate IMM-urile. Îl face posibil."**

Adică:
- **Azi** îl folosește consultantul (Faza 1: DPO/CISO/contabil/HR/AI advisor)
- **Mâine** îl folosește HR/COO/CFO intern (Faza 2: bundle pentru IMM cu user role-flexibil)
- **Peste 3-5 ani**, când rolul devine normal, CompliScan e **deja sistemul pe care omul ăla îl vrea**

CompliScan e **prima generație de tool care permite categoria să se nască**, NU al doilea-generation tool care intră într-o categorie existentă (cum era Vanta/Drata în piața US care avea deja "compliance manager" formalizat).

→ Diferentiator strategic vs Vanta-style products: **CompliScan creează piața în RO, nu doar produs pentru o piață existentă**.

### Status v4.4

✅ **Direcția curentă pentru execuție** — înlocuiește v4.3 IMM positioning (era prea devreme)

✅ **Aplicat în Doc 04** — secțiune nouă "GTM Evolution v4.4" la început, înainte de v4.3 GTM Rule

✅ **Compatibil cu thesis v4.2** (Modular + Integrat) — v4.2 = ce vinde produsul, v4.4 = cum evoluează narrative pe 3 faze

### Reguli simple v4.4 pentru execuție

1. **Azi**: vinzi modular către specialiști existenți (DPO/CISO/contabil/HR/AI advisor)
2. **Mâine**: vinzi bundle către IMM cu user role-flexibil (CFO/COO/HR/Legal/Office Manager)
3. **Poimâine**: creezi categoria "Compliance Officer IMM"

**NU**:
- NU pitch azi "GRC pentru IMM officer intern" (categoria nu există)
- NU forțezi reprofilare DPO/CISO în "GRC officer"
- NU lansezi paralel toate 5 segmente Q3 2026
- NU vinzi "schimbă profesia"

---

## Iteration 9 — GTM Rule per segment (v4.3, validat 27 apr 2026)

**Source**: după audit tools/specialiști (răspuns la "ce folosesc cei 10 oameni care fac acum cele 10 frameworks?"), user a sintetizat o regulă GTM concretă cu **5 niveluri de prioritate**.

**Trigger conceptual**: pentru fiecare framework, am întrebat "pe cine putem disloca azi?" în loc de "ce framework acoperim?". Răspunsul a generat un decision matrix per segment cu rol CompliScan diferit per segment.

### Cele 5 niveluri de prioritate

1. **DA — vindem acum** (replacement / control tower):
   - DPO pe Word/Excel/Drive (#1 prioritate)
   - IMM Internal cu HR/Office Manager existing role (control tower)

2. **DA, cu grijă** (challenger):
   - DPO frustrat de Privacy Manager (#2 prioritate)
   - Mesaj: "modern, finding-first, AI, pricing clar" — NU "batem Privacy Manager"

3. **DA, după DPO** (layer peste tool):
   - Contabil pe SmartBill/Saga/Oblio (#3 prioritate)
   - Mesaj: "păstrezi facturarea, adăugăm validator + e-TVA + GDPR lite"

4. **DA, selectiv** (governance layer):
   - CISO consultant NIS2 (#5 prioritate)
   - NU înlocuim Wireshark/Nessus/SIEM — adăugăm governance layer

5. **NU standalone** (add-on doar):
   - HR consultant Pay Transp + Whistleblowing — în pachet IMM Internal
   - AI Governance — în pachet Cabinet Studio

6. **NU acum** (out of segment 2026-2027):
   - DORA (Sprint MAJOR 2028)
   - Auditor ISO 27001 (NU certificăm, never)
   - Enterprise GRC (ServiceNow GRC teritoriu)

### De ce v4.3 e mai bună decât v4.0 paralel

v4.0 zicea: "lansează 3 segmente paralel Q3 2026 (Solo + IMM + Cabinet)".

v4.3 zice: "lansează SECVENȚIAL în ordine de prioritate, validează #1 înainte de a trece la #2".

**Solo founder = disciplină operațională, nu ambitie strategică**. Lansare paralelă 3 segmente = 3× efort marketing simultan + risc total dacă #1 eșuează.

### Întrebarea critică pre-pilot DPO Complet

Înainte de Joi 7 mai, trebuie întrebat:

> "Ce folosiți la cabinet pentru gestionarea clienților DPO? Word + Excel + Drive? Privacy Manager? MyDPO Decalex? Custom in-house?"

Răspunsul determină **rolul CompliScan în pitch**:
- Excel/Word → Replacement
- Privacy Manager → Challenger cu grijă
- MyDPO Decalex → WARNING (pitch complementar, NU replacement)
- Custom → Layer + integrare

### Status v4.3

✅ **Direcția curentă pentru execuție** — înlocuiește roadmap v4.0 lansare paralelă

✅ **Aplicat în Doc 04** — secțiune nouă "GTM Rule v4.3" la început

✅ **Compatibil cu thesis v4.2** (Modular + Integrat) — v4.2 = ce vinde produsul, v4.3 = cum și cui vindem

### Order temporal final pentru execuție

```
Săpt 1-4 (mai 2026):       Pilot DPO Complet (#1 sau #2 dependent răspuns)
Săpt 4-8 (iunie):          Outreach #1 DPO Word/Excel (replacement)
Luna 3-4 (iulie-aug):      Outreach #2 DPO Privacy Manager (challenger)
Luna 4-6 (sept-oct):       Outreach #3 Contabil SmartBill (layer)
Luna 6-9 (nov-jan 2027):   Outreach #4 IMM Internal (control tower)
Luna 9-12 (feb-mar 2027):  Outreach #5 CISO NIS2 (governance layer)
```

### Lecții pentru execuție

1. **Per segment = mesaj specific**. NU folosi același mesaj pentru DPO Word/Excel și DPO Privacy Manager.
2. **Întrebă pre-pilot ce folosesc**. Răspunsul determină rolul CompliScan.
3. **NU concura cu MyDPO Decalex pe brand**. Pitch complementar dacă răspunsul e "MyDPO".
4. **NU concura cu Drata/Vanta pe automated evidence**. Pierdem connect AWS/GitHub.
5. **Layer/governance, NU replacement** pentru CISO + Contabil. Vinde complementaritate, NU înlocuire.

---

## Iteration 8 — Titan Modular (versiune finală user-validated 27 apr 2026)

**Source**: distillare finală user după 48h de iterații + question critic "există cineva care le face pe toate? IMM la câte părți merge?".

**Răspuns validat empiric**: NU există în RO un consultant single boutique care să acopere tot stack-ul compliance. IMM mid-market merge la 5-8 firme diferite (€60-150K/an consultanță fragmentată).

**Thesis-ul în 1 propoziție**:

> CompliScan funcționează SEPARAT per framework pentru specialiști single-domain (DPO/CISO/contabil/HR/avocat) și INTEGRAT pentru IMM mid-market care vrea 1 angajat existent peste 10 frameworks. Același cod, 4 ICP-uri, 16 SKU-uri, pricing scalat.

**De ce e corectă această formulare** vs v4.0 "Compliance Loop OS":

| Aspect | v4.0 "Compliance Loop OS" | v4.2 "Titan Modular" |
|---|---|---|
| Mesaj | Abstract (loop universal) | Concret (modular + integrat) |
| Cumpărător înțelege în 5 sec | ⚠️ Necesită explicații | ✅ "Cumpăr ce am nevoie sau cumpăr tot" |
| Pattern recognizable | Salesforce (rar utilizat ca analogie) | "Funcționează separat ȘI împreună" — clear |
| Compatibil cu landing pages segmentate | ✅ | ✅ |

→ **v4.2 e formulare verbală mai bună** decât v4.0. Conținut identic (4-5 ICP, 16 SKU, 10 frameworks), dar mesaj mai concret.

### Claims validate empiric (intră în docs canonice)

1. ✅ **10 frameworks în cod** (verificat în Doc 03 + audit cod):
   - GDPR (90%), NIS2 (85%), e-Factura (80%), AI Act (60%), Pay Transparency (50%), Whistleblowing (40%), DORA (15%), CER (10%), SAF-T (40%), ISO 27001 (referințe)
2. ✅ **4 ICP-uri active simultan** în architecture (Solo + IMM Internal + Cabinet + Fiscal + Enterprise)
3. ✅ **16 SKU-uri pricing** distribuite pe 5 grupuri segment
4. ✅ **NU există în RO concurent direct cu această combinație** breadth + RO native + accesibilitate
5. ✅ **IMM mid-market plătește €60-150K/an** la 5-8 specialiști fragmentați (math validat empiric)
6. ✅ **Privacy Manager GDPR-only**, MyDPO single-SME, Big 4 enterprise-only — slot-ul intermediate gol

### Claims SPECULATIVE (NU intră în docs canonice — păstrate aici cu disclaimer)

1. ⚠️ **"Code base titan" — comparație LOC cu Vanta/Drata**:
   - Sinteza zice: 34K+ LOC vs Vanta 25K, Drata 30K, Privacy Manager 15K
   - **Realitate**: LOC ≠ valoare. Vanta MVP 25K LOC + PMF + 1.000+ customers la lansare. CompliScan 34K LOC + 0 paying customers.
   - **Mai mult cod = mai multă maintenance burden**, NU advantage automat
   - 6 bug-uri vizibile + 8 limitări announced = cod mare dar nu polished
   - **NU intră în docs ca punct de mândrie comparativă**

2. ⚠️ **"Maturity coverage" inflată**:
   - Sinteza: DORA 25%, CER 30%, SAF-T 50%
   - Doc 03 conservator: DORA 15%, CER 5-10%, SAF-T 35-40%
   - **Doc 03 are matricea corectă** — sinteza inflație 5-10pp pe fiecare

3. ⚠️ **"Acquisition value €15-30M la 36 luni"**:
   - Sinteza: pre-revenue €60-150K → cu 5-10 piloți €150-400K → cu 20-30 paying €500K-1.5M → cu PMF la 18 luni €2-5M → lider RO la 36 luni €15-30M
   - **Realiste pentru RO** (post-validare empirică):
     - Pre-revenue: €40-80K acquihire (Decalex / Privacy Manager / Big 4 RO)
     - Cu 5-10 piloți: €100-300K
     - Cu 20-30 paying: €500K-1.5M ✅
     - Cu PMF la 18 luni (€500K-1M ARR): €2-5M ✅
     - **€15-30M la 36 luni** → necesită €3-5M ARR confirmat → **improbabil pentru solo founder RO fără echipă + funding**
   - **NU baza decision pe €15-30M**. Bazează pe €500K-1.5M la 18 luni.

4. ⚠️ **"Tot ce ai nevoie e închis. Doar execuție"**:
   - **PERICULOS pentru founder mindset**
   - NU e închis până NU avem 1 paying customer real
   - DPO Complet pilot e validare proxy (cabinet fictiv), NU validare reală
   - Stack-ul docs e închis. Piața NU e.
   - Risk-uri rămase: Privacy Manager / MyDPO copy features în 12 luni; DPO Complet poate refuza la final pilot; IMM Internal segment nepilotat; solo founder focus issue; cash runway 6-12 luni

5. ⚠️ **"Greu de copiat în 12-18 luni"**:
   - Tehnic: da (34K LOC, 5 framework rules)
   - Comercial: NU
   - Privacy Manager are 12 ani brand recognition + clienți captivi
   - Decalex are 800+ clienți distribution power
   - Big 4 au resources nelimitate
   - CompliScan advantage doar dacă PMF în 12 luni **înainte** ca competitor să identifice segment

### Status v4.2

✅ **Thesis "modular + integrat" → DIRECȚIA CURENTĂ** (înlocuiește formularea v4.0 "Compliance Loop OS abstract")

✅ **Photoshop analogy → hero pe homepage** (post-validare DPO Complet pilot)

⚠️ **Hype claims (titan, exit values, "totul închis") → NU intră în docs canonice** — păstrate doar aici pentru context istoric

### Mesaj public corectat (post-disclaimer hype)

**Hero homepage** (compliscan.ro/):
> "CompliScan — operating system de readiness compliance pentru România.
>
> Funcționează modular per lege pentru specialiști. Integrat pentru IMM care vrea 1 angajat intern peste 10 frameworks. €29-1.999/lună.
>
> Photoshop-ul compliance-ului românesc."

**NU folosi**:
- "Titan modular" (intern doar)
- "Greu de copiat" (claim nevalidat)
- "€15-30M exit" (speculation)
- "Tot e închis" (periculos pentru execuție)

### Ce intră concret în docs canonice (prin acest update)

1. **Doc 01 hero**: thesis "modular + integrat" + Photoshop analogy
2. **Doc 05 (acest doc)**: Iteration 8 cu disclaimer separat (validate vs speculative)
3. **README v4.2**: actualizat cu thesis-ul nou

### Răspuns final pentru founder

Thesis-ul **modular + integrat** e corect și solid. Restul (titan, comparații LOC, exit values €15-30M, "totul închis") sunt **hype încurajator**, NU strategic. 

**Ce contează pentru execuție**:
- 7 mai 2026: pilot kickoff DPO Complet (Cabinet segment)
- 5 iunie 2026: retro pilot + decision point
- Q3 2026: lansare 3 segmente paralel SAU pivot la NIS2 sector public SAU exit
- Rest e specculation până avem 1 paying customer real

---

## Iteration 7 — Compliance Loop OS (Salesforce pattern) [v4.0 — înlocuit de v4.2]

**Source**: discovery user "engine-ul face bine toate 5 → împart per ICP segment orizontal, NU per produs vertical. Pattern universal: găsire → rezolvare → dosariat → monitorizat → dovedit".

**Conținut propus** (v4.0 — DIRECȚIA CURENTĂ):

```
                    COMPLISCAN
            (Compliance Loop OS · 1 cod · 4-5 ICP-uri)
                        │
        ┌───────────────┼───────────────┬─────────────┐
        ▼               ▼               ▼             ▼
   ┌─────────┐    ┌──────────┐    ┌──────────┐  ┌──────────┐
   │ SOLO    │    │ INTERNAL │    │CONSULTANT│  │CONTABIL  │
   │ MICRO   │    │ OFFICER  │    │ CABINET  │  │ CECCAR   │
   ├─────────┤    ├──────────┤    ├──────────┤  ├──────────┤
   │ €29-49  │    │€299-999  │    │€499-1999 │  │€29-199   │
   └─────────┘    └──────────┘    └──────────┘  └──────────┘
                                          
                 + ENTERPRISE custom (€5K-20K)
```

**Pattern universal validat across 7 frameworks**:

| Pas | GDPR | NIS2 | AI Act | DORA | e-Factura | Pay Transp | Whistleblowing |
|---|---|---|---|---|---|---|---|
| 1. Găsire | DSAR primit, breach | Incident, vulnerability | AI sistem nou | ICT incident | Factură respinsă | Gap salarial | Sesizare primită |
| 2. Rezolvare | Privacy Policy update | Incident response | Annex IV doc | ICT recovery | Re-issue factură | Salary equity | Investigation |
| 3. Dosariat | RoPA, DPIA, audit log | Incident registry | AI governance docs | ICT third-party log | Submission record | Pay equity reports | Case file |
| 4. Monitorizat | Site drift, vendor reviews | DNSC reporting | AI usage monitoring | ICT continuous | ANAF signals | Quarterly reviews | Channel monitoring |
| 5. Dovedit | ANSPDCP audit | DNSC audit | EU AI Office | BNR/ECB inspection | ANAF inspection | Authority audit | Court |

**Architecture 3 layers**:

1. **Infrastructure primitive layer** (87% maturity, generic compliance loop universal)
2. **Framework rules layer** (per legislație: GDPR 90% / NIS2 85% / AI Act 60% / DORA 15% / e-Factura 80%)
3. **ICP segment configuration** (cum se prezintă produsul per cumpărător)

**TAM RO 5 ani**: €30-80M ARR realist atingibil.

**Status**: ✅ **DIRECȚIA CURENTĂ**. Vezi Doc 01-04 pentru detalii operaționale.

**De ce e mai potrivită decât v3.0**:
- Aliniat cu codul real (1 infrastructură generică, NU 5 produse separate)
- Mesaj universal valabil ("loop-ul" se aplică oricărui framework)
- Pattern Salesforce (1 infrastructură pentru orice industrie) > pattern Stripe (5 produse tehnic separate)
- ICP-urile orizontale (Solo/IMM/Cabinet/Fiscal/Enterprise) reflectă mai bine cumpărătorii reali

**Riscuri** (de monitorizat în pilot):
- Mesajul "Compliance Loop OS" e abstract — poate fi prea filozofic pentru cabinete RO obișnuite cu mesaje concrete
- 4-5 ICP-uri orizontale = mesaj fragmentat (4-5 landing pages, 4-5 onboarding flows)
- Solo founder pe 4-5 ICP-uri simultan = focus issue (lansare paralelă Q3 2026 e ambitioasă)

**Backup dacă v4.0 eșuează**:
1. Fallback la v3.0 (5 produse vertical) — mesaj mai concret per cumpărător
2. Fallback la Iteration 5.A (DPO OS GDPR-only) — focus singular
3. Fallback la Iteration 5.C.3A (NIS2 sector public) — ICP forțat prin lege
4. Fallback la Iteration 5.B (vinzi cod ca asset €40-80K) — exit option

---

## Învățăminte cumulate empiric — toate iterations

### Tools-uri folosite per ICP (validat empiric)

| ICP | Tools tipice | CompliScan înlocuiește | Rămâne cu |
|---|---|---|---|
| **Diana DPO GDPR-only (30 clienți)** | 8-10 tools | 6-8 din ele | 3-4 (email, calendar, Lege5, ANSPDCP portal) |
| **Mihai cybersecurity NIS2 (10 clienți enterprise)** | 12-15 tools tehnice (Wireshark, OWASP ZAP, vulnerability scanners) | 3-4 (governance/audit) | 8-10 tools tehnice + CompliScan |
| **Cristina avocat firma legală** | 6-8 tools (focus juridic) | 4-5 | 2-3 |
| **IMM Internal Officer existing role** | 3-5 consultanți externi simultan | replace 4 consultanți cu 1 angajat existing + tool | email + calendar + 1 consultant ad-hoc DPIA + Lege5 |

### Math pentru fiecare ICP (validat empiric)

#### IMM mid-market (lovitura de gratie ROI 2-5×)

```
Costuri actuale IMM 50-100 angajați:
- DPO outsourced:           €200/lună × 12 = €2.400/an
- NIS2 consultant (ad-hoc): €5.000-15.000/an
- Avocat consultanță GDPR:  €3.000/an
- HR/whistleblowing setup:  €2.000/an
─────────────────────────────────────────────────
Total externalizat:         €12.400-22.400/an

Cu CompliScan Internal Starter €299:
- CompliScan:               €299 × 12 = €3.588/an
- Consultant ad-hoc DPIA:   €1.500/an
- Avocat verificare:        €1.500/an
─────────────────────────────────────────────────
Total cu CompliScan:        €6.588/an

Economie: €5.812-15.812/an = ROI 2-5×
```

#### Pricing piață DPO RO (validat empiric)

- DPO Expert: €79.4 basic / €250 dedicat / €360 premium
- LegalUp: 650 lei (~€131) firme <10 ang. / 1.250 lei (€251) 10-50 ang. / 3.500 lei (€703) 50+ ang.
- iTProtection: €100 entry / €40 monitoring
- EuroMarket: €150-450 trepte sisteme
- DPO Complet (Decalex): nepublic, estimat €250-500/lună per client

#### Cabinet 30-50 clienți math

- LegalUp 650 lei (€131)/client × 30 = €3.930/lună revenue → Cabinet Pro €999 = 25%
- DPO Expert €250 × 50 = €12.500/lună → Cabinet Pro €999 = 8% (sweet spot)
- iTProtection €100 × 15 = €1.500/lună → Cabinet Solo €499 = 33% (limita superioară)

### Concurenți reali identificați (validat empiric)

#### DPO/GDPR RO (Iteration 2 + Cabinet segment v4.0)
- **Privacy Manager** (privacymanager.ro) — multi-client mature, 14 module, sales-led, pricing nepublic
- **MyDPO (Decalex)** — primul AI GDPR RO 2023, 800+ clienți distribution power
- **Wolters Kluwer GDPR Soft** — enterprise localized RO, €1K-5K+/lună estimate
- **kitgdpr.ro** — document store + tools

#### Cabinete DPO RO (22+ identificate empiric)
GDPR Complet, iGDPR, DPO Consulting, Decalex, GDPShield, EuroMarket, Consultia, Privacy Manager (vendor + cabinet), DP Solutions, Ancora Protect, IT Protection, eu-gdpr.ro, LegalUp, WestGDPR, Avocat Data Protection, DPO Expert, Setrio MyBiz GDPR, Accace, NeoPrivacy, PrivacyON, gdpr-bucuresti.ro, DPO Safety, dpo-timisoara, kitgdpr.ro, Vlăntoiu.

Plus alte cabinete avocaturale care fac DPO ca line-of-business secundar. Estimat total piață: 40-80 cabinete active.

ASCPD (Asociația Specialiștilor în Confidențialitate și Protecția Datelor) — 21 membri în Consiliul Consultativ.

#### Cybersecurity / NIS2 RO (Iteration 5 + IMM Internal segment v4.0)
- **Sectio Aurea** — services-led
- **HIFENCE** — services-led
- **Prodefence** — services-led
- **SecureShield**
- **iSoft Consulting**
- Tariff: €15K-60K setup + €5K-25K/an (Iteration 5)

#### Financial DORA (Iteration 5.B + Enterprise v4.0)
- Big 4 (PwC, Deloitte, EY, KPMG) — €100K+/an
- Boutique financial compliance firms RO

#### Avocați cross-framework
- **Wolf Theiss**, **DLA Piper RO**, **Bird & Bird RO**, **PrivacyON** (clients Ferrero, Netopia)
- Tariff: €200-500/oră

#### Global GRC (NU în RO)
- TeamMate (Wolters Kluwer) — vine prin avocatură
- Diligent — enterprise boards
- Cyberday (Finlanda) — multi-framework
- Hyperproof — multi-framework SaaS
- Diamatix — Shield SIEM/XDR
- Enactia — unified GRC dashboard
- OneTrust — privacy + GRC
- Vanta, Drata, Sprinto, Secureframe — fast-growing SMB segment US/UK

Toate enterprise-priced ($50K-500K/an), nu RO-localizate.

### ANSPDCP enforcement (validat empiric)

| An | Amenzi GDPR | Total RON | Total EUR |
|---|---|---|---|
| 2022 | 52 | 1.058.863 lei | ~€213.000 |
| 2023 | 31 GDPR (73 total) | 2.348.265 lei | ~€472.000 |
| 2024 | 51 GDPR (83 total) | 1.855.807 lei | ~€237.600 |
| 2025 | 96 GDPR (105 total) | 2.565.020 lei | ~€511.400 |

**Trigger-uri principale**: plângeri (5.354 în 2024, 3.048 în Q1 2025), notificări incidente, sesizări auto, investigații coordonate UE.

**Mărimi tipice IMM**: 4.977-49.770 lei (€1.000-10.000).

### NIS2 deadline-uri reale

- 17 octombrie 2024 = data UE pentru transpunere directivă (NU deadline pentru entități)
- RO transpus prin OUG 155/2024 (în vigoare 31 dec 2024) + Lege 124/2025 (iulie 2025)
- **Deadline înregistrare DNSC = 22 septembrie 2025** (Ordin DNSC 1/2025) — TRECUT
- **Deadline implementare măsuri (raportare incidente) = octombrie 2026** — viitor
- 12.000-20.000 entități obligate (LegalUp + Wolf Theiss + NNDKP estimări)

Amenzi NIS2: până la €10M / 2% cifră afaceri (esențiale), €7M / 1.4% (importante).

### Compliance Officer la IMM RO (validat empiric)

- LinkedIn RO 2026: 81 joburi "Compliance Officer", 30 "Legal Compliance Officer", 2.000 total compliance
- Glassdoor: 2.345-2.484 joburi compliance, 56-66 "compliance officer"
- **Cine angajează**: banking/fintech (ING Hubs, BCR, Raiffeisen, Revolut), big tech RO offices (Microsoft, Oracle, IBM, Salesforce), Big 4, multinaționale (Bosch, Continental, Schaeffler, eMAG), pharma (Sanofi, GSK, Pfizer)
- **Cine NU angajează**: IMM (sub 250 ang) practic niciodată, mid-market (250-500 ang) extrem de rar
- Trend RO 2026 → 2030: 200-400 firme RO IMM mid-market vor angaja primul Compliance Specialist; 2028-2029 numărul crește la 1.000-2.000

→ Pattern: rolul există la enterprise + financial services + tech mid-large. La IMM mid-market e diluat în roluri existing (HR/Legal/Office Manager).

### Digital Omnibus EU (2026-2027)

**Bird & Bird (2026)**: "EU Digital Omnibus package proposes to streamline incident reporting through a 'report once, share many' approach. Single incident covering NIS2 + GDPR + eIDAS + DORA + CER Directive."

→ EU recunoaște complexitatea cross-framework și pregătește simplificare. Window de oportunitate pentru CompliScan până când Digital Omnibus aplicabil (2027+).

### Tools usage stats

- US/UK 2025-2026: Vanta 12.000 customers mid-market, Drata 7.000, Sprinto fast-growing SMB
- RO 2026: <100 firme folosesc Vanta/Drata, Privacy Manager <500 cabinete estimate, MyDPO Decalex 50-100 clienți confirmat
- Diferența: US/UK e cu 3-5 ani înaintea RO pe adoption GRC SaaS

---

## Decision framework — cum se ia decizia finală

User va citi acest document + Doc 01-04 + va decide pe baza:

### Criterii decizie

| Criteriu | v4.0 Compliance Loop OS | v3.0 5 produse vertical | DPO OS GDPR-only | NIS2 sector public | Vinzi acum |
|---|---|---|---|---|---|
| Aliniat cu codul real | ✅ Da (1 infrastructură) | ⚠️ Parțial (forțează separation) | ✅ Da (subset) | ✅ Da (subset) | ✅ N/A |
| Validat empiric (DPO Complet pilot) | ⚠️ În curs (Cabinet segment) | ⚠️ Parțial (DPO OS subset) | ✅ Da (cabinet) | ❌ Nu | ✅ N/A |
| TAM RO realist | €30-80M ARR | €15-50M ARR | €5-15M ARR | €15.9M ARR | €40-80K cash |
| Sales cycle | 1-3 luni privat | 1-3 luni privat | 1-2 luni | 6-9 luni public | imediat |
| Concurență | red ocean cu under-tooling | red ocean per produs | red ocean (Privacy Manager + MyDPO) | zero specific | N/A |
| Solo founder feasibility | ⚠️ Ambitios (4-5 ICP) | ⚠️ Ambitios (5 produse) | ✅ Focus singular | ⚠️ Procurement complex | ✅ Cash certain |
| Exit value 18 luni | €500K-1.5M | €100-300K | €100-200K | €200-500K | €40-80K imediat |

### Recomandare ordine de încercare

1. **Q3 2026 — Lansează v4.0** (Compliance Loop OS cu 3 segmente paralel: Solo + IMM + Cabinet)
2. **Pilot DPO Complet** (Cabinet segment) Joi 7 mai = first validation
3. **30 zile retro pilot**: dacă DPO Complet semnează → continuă v4.0 + outreach IMM Internal paralel
4. **Q4 2026 — Decision point**: dacă v4.0 are <10 cabinete plătitoare → fallback la v3.0 sau Iteration 5.A (DPO OS GDPR-only focus singular)
5. **Q1 2027 — Decision point**: dacă privat eșuează complet → pivot la Iteration 5.C.3A (NIS2 sector public RO) cu sales cycle public 6-9 luni
6. **Last resort (mid 2027)**: Iteration 5.B (vinzi cod ca asset) dacă niciun pivot privat sau public nu prinde

### Triggers pentru decision

**Continuă v4.0** dacă:
- DPO Complet semnează subscription Growth/Pro post-pilot
- Q3 2026 lansare ajunge la 30+ plătitori distribuiți across 3 segmente
- Outreach IMM Internal generează 5+ piloturi în 60 zile
- ROI math (4 consultanți → CompliScan) reasonance cu cumpărători

**Fallback la v3.0 (5 produse vertical)** dacă:
- Mesajul "Compliance Loop OS" e prea abstract pentru cabinetele RO
- Cumpărători cer mesaj concret per framework
- 4-5 landing pages mesaj fragmentat eșuează

**Fallback la Iteration 5.A (DPO OS GDPR-only)** dacă:
- Solo + IMM Internal nu prind în 6 luni
- Cabinet segment singular performează (DPO Complet renews, alți 2-3 cabinete)
- Focus singular preferabil decât multi-segment

**Pivot la Iteration 5.C.3A (NIS2 sector public)** dacă:
- Privat (Solo + IMM + Cabinet) sub 10 plătitori în 12 luni
- ACoR (Asociația Comunelor) sau alt partener public deschide canal
- Procurement public SEAP confirmă fezabilitate

**Vinzi (Iteration 5.B)** dacă:
- Toate fallback-urile eșuează în 18 luni
- Decalex / Privacy Manager / Big 4 oferă €40-100K + earnout
- Founder bandă energie scade

---

## Pattern-uri arhitecturale considerate (toate cu pro/contra)

### Pattern Stripe (5 produse tehnic separate)

**Pro**:
- Mesaj concret per produs
- ICP cumpărător clar per produs
- Pricing transparent per produs

**Contra**:
- Forțează code separation care nu există în CompliScan real
- Marketing 5× efort
- Sales 5× efort

**Status**: invalidat (v3.0 → v4.0).

### Pattern Salesforce (1 infrastructură pentru orice industrie)

**Pro**:
- Aliniat cu codul real (1 infrastructure layer)
- Categorie nouă "Compliance Loop OS"
- Multi-segment serving prin same code

**Contra**:
- Mesaj abstract ("loop universal")
- 4-5 landing pages = mesaj fragmentat
- Solo founder pe 4-5 ICP-uri = focus issue

**Status**: ✅ **DIRECȚIA CURENTĂ (v4.0)**.

### Pattern Notion (Solo → Team → Enterprise growth path)

**Pro**:
- 1 brand, 1 produs, scaling natural
- User crește din Solo în Team în Enterprise organic
- Cross-sell built-in

**Contra**:
- Necesită produs care literalmente face același lucru la toate scale-urile
- CompliScan are workflows diferite per ICP (Solo single-org vs Cabinet multi-tenant)

**Status**: ⚠️ Parțial integrat în v4.0 (pricing tier scaling Solo → Internal → Cabinet → Enterprise).

### Pattern Atlassian (1 stack, 4 produse)

**Pro**:
- Cross-sell între produse
- Brand umbrella

**Contra**:
- Necesită produse tehnic similare dar cu use case diferit
- CompliScan use cases sunt aceleași (compliance loop) — nu sunt produse diferite

**Status**: invalidat (similar cu Stripe).

### Pattern HubSpot (multi-hub portfolio)

**Pro**:
- Free tier + paid tiers + enterprise
- Self-serve + sales-led
- Multi-hub serving multiple ICP

**Contra**:
- Necesită investiție mare în onboarding self-serve
- Long sales cycle pentru enterprise

**Status**: ⚠️ Parțial integrat în v4.0 (Stripe Checkout self-serve + Enterprise sales-led).

### Pattern Vanta (vertical specialist single-framework)

**Pro**:
- Focus singular = mesaj clar
- Concurență cunoscută

**Contra**:
- Pierdem 70-80% din valoarea codului
- Marginal differentiation cu Privacy Manager + MyDPO

**Status**: ⚠️ Backup option (Iteration 5.A).

---

## Ce NU am încercat încă (idei pentru viitor)

### Idei amânate (nu eliminate)

1. **CompliScan as marketplace** — connect IMM-uri cu consultanți DPO/CISO certificați
2. **Training modules video** — explainer 2-min per framework, certificate intern
3. **Compliance score public** — ratings IMM-uri (gen Glassdoor pentru compliance)
4. **API pentru consultanți** — Big 4 / avocatură integrate CompliScan în propriile workflows
5. **Mobile app** — patron approval magic link pe mobile native (PWA suficient acum)
6. **Slack integration** — alerts în canal cabinet
7. **Zapier integration** — connect CompliScan cu HR systems / CRM existing
8. **Audit log retention configurabil** — 1 an / 5 ani / 10 ani per plan
9. **Multi-currency** — RON + EUR + USD pentru clienți EU adjacent
10. **Compliance certificare CompliScan** — partener cu auditor ISO 27001 pentru CompliScan ca tool certificat (lift trust pentru enterprise)

### Decision rule pentru aceste idei

**NU implementa** până când:
- v4.0 are 30+ plătitori (validare ICP confirmat)
- Cumpărători reali cer feature respectiv (NU speculație founder)
- Bandwidth disponibil (post-Sprint 4 launch)

---

## Cum se folosește acest document

### Pentru founder (Daniel)

- Re-citește acest doc la fiecare retrospectivă major (post-pilot DPO Complet, end of Q3 2026, decision points)
- Verifică triggers înainte de decision pivot
- NU șterge idei — adaugă status update (validate / invalidate / păstrat backup)

### Pentru advisor / mentor

- Început rapid cu această secțiune Decision framework
- Citește Iteration 7 (v4.0 — direcția curentă) pentru context current
- Citește Iterations invalidate doar pentru a înțelege ce am exclus și de ce

### Pentru AI agent / hire nou

- Citește în ordine: Iteration 1 → Iteration 7 (cronologic)
- Apoi Învățăminte cumulate (datele empirice)
- Apoi Decision framework (criteria pentru noi pivots)
- NU începe să scrii cod fără să citești Doc 01-04 (direcția curentă)

### Pentru investitor / acquirer (due diligence)

- Citește Decision framework (TAM + multiplu evaluare)
- Citește Iteration 7 (thesis curent)
- Citește Învățăminte cumulate (validare empirică)
- Verifică triggers de pivot (risk factors)

---

**Document maintainer**: Daniel Vaduva, founder
**Update obligatoriu la**: orice nouă iteration major / orice decision point / orice trigger pivot
**Versiune**: v1.0 (creat 26 apr 2026 ca răspuns la "păstrăm toate ideile pentru decision finală")
**Regulă**: NU șterge — marchează status. Decision la final.
