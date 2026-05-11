# CompliScan — Role & Module Matrix v1 (10 Roluri Target)

**Data:** 2026-05-09
**Versiune:** 1.0
**Status:** **HARTĂ DE PRODUS** (NU plan de lansare — vezi notă GPT 5.5 mai jos)
**Sursă originală:** Document Opus "10 ROLURI Target" 9 mai 2026
**Critique încorporată:** GPT 5.5 review 9 mai 2026

---

## ⚠️ NOTĂ CRITICĂ — Distincție product architecture vs GTM execution

Per critica GPT 5.5 absorbită:

> "Documentul e bun ca hartă de segmentare, dar nu l-aș folosi încă drept 'plan de execuție lock-uit'. Are claritate pe roluri, UI, pricing și concurență, însă riscă să readucă haosul cu 10 direcții dacă nu îl separăm în două niveluri."

| Nivel | Cum folosim acest doc |
|-------|----------------------|
| **Product architecture** | ✅ **DA** — CompliScan poate avea 10 roluri și UI dinamic per rol. Module visibility per ICP segment confirmat. |
| **GTM execution** | ❌ **NU** — NU vindem 10 roluri simultan. Vindem **2 primary focuses paralel** (Bundle D Fiscal + DPO OS Diana pilot) + build în background pentru viitor. |

---

## CORECȚII GPT 5.5 (locked în acest doc)

### Corecție #1 — Onboarding NU 10 opțiuni, max 4 top-level

**Eroare doc Opus original:** "Onboarding pas 1: 'Ce rol ai?' cu 10 opțiuni"

**Realitate aplicată:**

```
Pas 1: "Ce rol ai?" (4 top-level)
  ├─ Cabinet consultant
  ├─ Firmă / IMM
  ├─ Contabil
  └─ Auditor / Viewer

Pas 2: sub-rol (depinzând de pas 1)
  Ex: Cabinet consultant → DPO solo / Cabinet DPO multi-tenant / Avocat / CISO cabinet
```

### Corecție #2 — Cabinet DPO NU vede TOATE frameworks

**Eroare doc Opus original:** "Rol 2 Cabinet DPO multi-tenant — Module active: TOATE"

**Realitate aplicată:**
- Cabinet DPO vede **TOATE modulele DPO** (RoPA, DSAR, DPIA, breach, training, magic-links, cabinet-templates, approvals)
- **NU vede** Fiscal, NIS2 technical, DORA, Pay Transparency
- Fiscal pentru Cabinet DPO = **add-on explicit**, nu default

### Corecție #3 — DPO Solo + Cabinet DPO = same bundle, tier-uri diferite

**Eroare doc Opus original:** Tratate ca produse separate

**Realitate aplicată:**
- ICP segment: `cabinet-dpo` (singular)
- Stripe tiers: cabinet-solo €499 (5-15 clienți) / cabinet-pro €999 (15-30) / cabinet-studio €1.999 (30+)
- 1 produs comercial, 3 tier-uri

### Corecție #4 — "Cod gata 95%" ≠ "ready to sell"

Coloane separate pentru fiecare rol:

| Rol | Engine | UI | Pilot | Billing | Channel | Trust |
|-----|--------|-----|-------|---------|---------|-------|
| 1 DPO solo | ✅ 95% | ✅ 90% | ⏳ Diana ongoing | ❌ | ❌ | ⚠️ post-Diana |
| 2 Cabinet DPO | ✅ 95% | ✅ 90% | ⏳ Diana ongoing | ❌ | ❌ | ⚠️ post-Diana |
| 3 Avocat | ✅ 85% | ⚠️ 70% | ❌ | ❌ | ❌ | ❌ |
| 4 CISO/Cybersec | ✅ 85% | ✅ 80% | ❌ | ❌ | ❌ | ❌ |
| **5 Contabil ⭐⭐** | **✅ 80%** | **⚠️ 70% (GAP-uri Bundle D)** | **❌** | **❌** | **❌** | **❌** |
| 6 HR Specialist | ⚠️ 70% | ⚠️ 50% (UI dedicat lipsește) | ❌ | ❌ | ❌ | ❌ |
| 7 AI Governance | ✅ 75% | ✅ 80% | ❌ | ❌ | ❌ | ❌ |
| 8 Compliance Banking | ⚠️ 65% | ⚠️ 60% (BNR reporting lipsește) | ❌ | ❌ | ❌ | ❌ |
| 9 Patron / CEO | ⚠️ 70% (tier €39 lipsește) | ✅ 80% | ❌ | ❌ | N/A | N/A |
| 10 Auditor extern | ✅ 80% (token invitat parțial) | ⚠️ 70% | ❌ | N/A | N/A | N/A |

**Citire matrice:** Bundle D Fiscal (Rol 5) are engine 80% + UI 70% — NU 95% cum sugera doc-ul Opus. Restul (pilot, billing, channel, trust) = ❌ pe toate. Code-ready ≠ launch-ready.

### Corecție #5 — MRR target prematur

**Eroare doc Opus original:** "MRR €30-50K mai-iulie pentru Bundle D"

**Realitate aplicată (per GPT):** Target sănătos = **5-15 cabinete pilot plătitoare** în primele 3 luni, NU MRR. MRR vine după ce avem channel signed (Bența / CECCAR).

### Corecție #6 — Patron + Auditor = access modes, NU produse separate

**Eroare doc Opus original:** Tratate ca ICP segments distincte cu pricing separat

**Realitate aplicată:**
- **Patron mode** = USER ROLE în org (read-only approval / retention driver). Existing `solo` ICP suportă asta cu user permissions matrix.
- **Auditor mode** = TOKEN-based access (free seat / referral). Nu e ICP, e share token cu permissions read-only.
- **NU adăugăm** `patron-readonly` și `auditor-external` la `IcpSegment` type.
- Rămânem la 7 ICP segments: `solo` / `cabinet-dpo` / `cabinet-fiscal` / `cabinet-hr` / `imm-internal` / `imm-hr` / `enterprise`

### Corecție #7 — DPO + Fiscal = 2 paralele primary focuses, NU sequential

**Eroare doc Opus original:** Bundle A DPO mutat la Sep-Oct 2026

**Realitate aplicată:**
- DPO OS = **deja livrat și matur** cu Diana pilot ongoing → NU oprim, e parallel primary focus
- Bundle D Fiscal = wedge product nou, build NOW
- Pattern Vanta single-focus aplicat pentru produse "from scratch" — NU pentru produse deja livrate
- Codex pe DPO + Claude pe Fiscal = 2 focuses paralele, fiecare cu progres independent

---

## CELE 10 ROLURI — REZUMAT (mapping la 7 ICP segments + 2 access modes)

| # | Rol | ICP Segment | Access Mode | Bundle Comercial |
|---|-----|-------------|-------------|------------------|
| 1 | DPO solo | `cabinet-dpo` | full owner | Bundle A (cabinet-solo tier) |
| 2 | Cabinet DPO multi-tenant | `cabinet-dpo` | full owner | Bundle A (cabinet-pro/studio tiers) |
| 3 | Avocat protecția datelor | `cabinet-dpo` (sub-flag legal) sau nou `lawyer` | full owner | Bundle A (extends cabinet-pro) |
| 4 | CISO / Cybersec consultant | `enterprise` (sub-flag) sau nou `ciso-cabinet` | full owner | Bundle C (Q2-Q3 2027) |
| 5 | **Contabil CECCAR** ⭐⭐ | `cabinet-fiscal` | full owner | **Bundle D — WEDGE NOW** |
| 6 | HR Specialist | `cabinet-hr` / `imm-hr` | full owner | Bundle B (Q1 2027) |
| 7 | AI Governance specialist | `enterprise` (sub-flag) sau nou `ai-gov` | full owner | AI Gov module (Q3-Q4 2026) |
| 8 | Compliance Banking/IFN | `imm-internal` (sub-flag) sau nou `compliance-banking` | full owner | Bundle C (Q2-Q3 2027) |
| 9 | **Patron / CEO IMM** | `solo` sau `imm-internal` | **read-only approval mode** | Tier patron €39 (add-on) |
| 10 | **Auditor extern** | N/A | **token-based read-only** | Free seat / referral channel |

**Decizie ICP segments:** rămânem la **7** (existing 5 + 2 HR adăugate). Nu adăugăm `lawyer`/`ai-gov`/`ciso-cabinet`/`compliance-banking` ca ICPs separate momentan — folosim `cabinet-dpo`/`enterprise`/`imm-internal` cu sub-flags când e cazul. Patron + Auditor = access modes, nu ICPs.

---

## STRATEGIA EXECUTABILĂ — corectată post-GPT

```
ACUM (mai 2026):
  • Claude (eu) — Bundle D Fiscal cod-ready
    Target: 5-15 paid pilots Bundle D în primele 3 luni
    Channel: Bența + CECCAR + grup FB 65K
  • Codex — DPO OS pilot Diana ongoing
    Target: case study Diana publicat luna 2-3
    Channel: ASCPD (Marius Dumitrescu) + dpo-net.ro
  RAMÂN PARALEL — 2 primary focuses, NU 4 bundle-uri

VARA (iul-aug 2026):
  • AI Gov build + 5-10 design partners gratuit (DRUID/FintechOS/eMAG via warm contact)
  • Fiscal scale: sponsorship Bența + CECCAR conferință regional
  • DPO Cabinet outreach: 5 cabinete primary target post-Diana case study

TOAMNA (sep-dec 2026):
  • AI Gov launch post-deadline 2 aug 2026 (panic mode)
  • Bundle B HR pilot 2-3 firme RO mid-market
  • Bundle C Banking primele conversații enterprise (Big4 partner channel)

2027:
  • Bundle B HR public launch (post deadline 7 iun 2026 ratat — replanificare)
  • Bundle C Banking closing IFN tier-2
  • Avocat tier + CISO bundle public
```

---

## TOP 10 ROLURI — DETALII per rol (referință arhitecturală)

[Conținutul complet al doc-ului Opus 9 mai 2026 — păstrat ca referință produs]

### ROL 1 — DPO Consultant Solo
- ICP: `cabinet-dpo` cu tier `cabinet-solo`
- Module active: GDPR + Legea 190/2018 + AI Act (light) + Whistleblowing (advisory)
- Module ASCUNSE: e-Factura, NIS2 technical, DORA, Pay Transparency, HR/REGES
- Pricing: €129 Solo / €249 Pro / €449 Studio
- Concurența: Privacy Manager, MyDPO Decalex, kitgdpr.ro, Dastra (FR), DPO-One
- Top 5 outreach: Marius Dumitrescu, Tudor Galoș, Daniela Cireașă, DPO Expert, IT Protection
- Volum: 80-180 cabinete RO active
- Verdict: PUSH ca primary post-Diana case study

### ROL 2 — Cabinet DPO Multi-tenant ⭐
- ICP: `cabinet-dpo` cu tier `cabinet-pro` / `cabinet-studio`
- Module active: TOATE modulele DPO (RoPA, DSAR, DPIA, breach, training, magic-links, cabinet-templates, approvals) — NU Fiscal/NIS2 technical/DORA/Pay Transp/Whistleblowing
- Pricing per-client model: €199 platformă + €29/client (sweet spot 25 clienți = €924)
- Pricing flat alternativ: €499 Solo / €999 Pro / €1.999 Studio
- Top 10 cabinete: GDPR Complet, Sectio Aurea, BHR Consulting, DPO Expert, Radikal Consult, iGDPR, GDPR Advisors, DPO Consulting, NeoPrivacy, Vlănțoiu
- TAM: 40-80 cabinete plătitoare = €240-960K ARR teoretic
- Capcană: Decalex pivot probabilitate 20% — lock-in early prin contracte anuale
- Verdict: PUSH cu lock-in agresiv post-Diana (Q4 2026)

### ROL 3 — Avocat Protecția Datelor
- ICP: `cabinet-dpo` (sub-flag legal) — NU adăugăm nou
- Module active: GDPR + AI Act (legal lens) + Whistleblowing + Pay Transparency (legal) + Legea 190
- Module ASCUNSE: NIS2 technical, DORA, Fiscal operațional, HR operational
- Pricing: €99 Solo (1-3 clienți) / €299 Pro (15) / €699 Firm (20+)
- Top 10 avocați: Iurie Cojocaru (NNDKP), Georgiana Singurel (Reff), Andrei Stoica (DLA Piper), Cristiana Fernbach (KPMG), Ruxandra Sava (LegalUp), Oana Lungu, Tudor Galoș, Mușat & Asociații, Wolf Theiss, Vlănțoiu
- TAM: 400-600 nume reachable
- Capcană: avocatul plătit la oră vede eficiență ca threat — pitch "adaugi 3 clienți fără ore în plus"
- Verdict: PUSH prin LinkedIn DM + Data Privacy Observer ed. VI 2027

### ROL 4 — CISO / Cybersec Consultant
- ICP: `enterprise` (sub-flag) — NU adăugăm nou
- Module active: NIS2 + DORA (cyber side) + Incident transversal + Vendor risk
- Pricing BUNDLE-only (NU standalone): €499 Solo / €1.999 Pro / €4.999 Studio
- Concurență: NIS2 Manager (BetterQA) €19-49/lună, CysNIS.eu, DNSC tool gratuit, Vanta/Drata
- Top 10 cabinete: HIFENCE, Bit Sentinel, Sectio Aurea, CybrOps, Safetech Innovations, Decalex, AROBS, certSIGN, Prodefence, NOD Academy
- Volum: 150-400 cabinete + freelanceri RO
- Verdict: DOAR BUNDLE — standalone €1.999/lună NU funcționează vs NIS2 Manager €49

### ROL 5 — Contabil CECCAR (Fiscal Layer) ⭐⭐ WEDGE PRODUCT
- ICP: `cabinet-fiscal`
- Module active: NUMAI Fiscal (12 funcționalități: Validator UBL CIUS-RO, Error Code Mapper 200+, XML Auto-Repair, Status Interpreter, Risk Dashboard, Vendor Signals, Prefill Inference, e-TVA Discrepancy Workflow, SAF-T Hygiene Score, Fiscal Protocol, Revalidation, Agent Fiscal Sensor)
- Module ASCUNSE TOTAL: GDPR, NIS2, AI Act, DORA, Pay Transp, Whistleblowing
- Pricing AGRESIV: Solo €49-69 / Pro €199-249 / Studio €499-799 / Enterprise €999-2.999
- 7 trigger events 2025-2026 active (B2C ian 2025, amenzi iul 2025, e-TVA, SAF-T, OUG 89/2025, 5 zile lucrătoare ian 2026, CNP fizice 15 ian 2026, fermieri 1 iun 2026)
- 8 citate pain validate
- Top 10 cabinete: Vulpoi & Toader Management, Keez (Visma), Almih Expert, Cont Consult, Expert Mind Iași, Contello, REALCONT, Dianex, CONFI SERV, Profi Conta
- 3 capcane: auto-repair legal CECCAR, saturație tooling, channel direct online slab
- TAM: 2.500-3.500 cabinete Pro + 700-1.200 Studio + 50-150 top
- **Verdict: WEDGE PRODUCT — lansare prim phase imediat MAI 2026**

### ROL 6 — HR Specialist (Pay Transp + Whistleblowing)
- ICP: `cabinet-hr` (consultant) / `imm-hr` (intern)
- Module active: Pay Transparency + Whistleblowing + HR/REGES + Training
- Pricing BUNDLE: €299 (50-149 ang.) / €599 (150-249) / €999 (250+)
- Whistleblowing standalone NU funcționează (avertizori.eu €16.5/lună, whistleblow.ro €50/lună)
- Trigger MAJOR: PwC PayWell 2024 gender pay gap RO 21.6% → joint pay assessment QUASI-UNIVERSAL
- Threshold legal RO: 100 ang. raportare (NU 150!) + 50 ang. transparență recrutare
- Top 10 firme: Zentiva, Antibiotice Iași, MedLife, Regina Maria, Profi, Hella, Schaeffler, Bittnet, Softelligence, Patria Bank
- TAM: 12.945 firme 50-249 + 3.788 firme 250+ = 16-17K
- Verdict: PUSH în Q1 2027 (deadline 7 iun 2026 ratat ca trigger primar)

### ROL 7 — AI Governance Specialist
- ICP: `enterprise` (sub-flag)
- Module active: AI Act ONLY (cu cross-link GDPR Art. 22)
- Pricing: €299 Solo / €699 Pro / €1.999-2.500 Enterprise
- Concurență: OneTrust $10K floor, Credo AI $30-150K, Vanta AI Agent 2.0 $10-80K, Drata AI $7.5-100K
- Top 10 cumpărători enterprise: Banca Transilvania, Salt Bank, TBI Bank, eMAG, UiPath, DRUID AI, FintechOS, Bitdefender, Telekom (HIGH-RISK!), BCR
- Verdict: BUILD NOW (Q1-Q2 2026), SELL Q3-Q4 2026 (post-deadline 2 aug 2026)

### ROL 8 — Compliance Officer Banking/IFN ⭐ ARPU MARE
- ICP: `imm-internal` (sub-flag banking) sau nou `compliance-banking` — TBD
- Module active: GDPR + DORA + NIS2 + Whistleblowing
- Pricing: Mid-IFN €1.999 / Standard €2.999 / Enterprise €4.999
- Concurență: Archer $55-300K, ServiceNow $25-500K, OneTrust $50-300K, Vendorica €1.500/lună starter
- Top 10 entități: TBI Bank, Patria Bank, ProCredit, Credit Europe, Provident IFN, Easy Asset, Marsh, Renomia, TradeVille SSIF, BT Capital Partners
- 3 capcane: SOC2 Type II OBLIGATORIU, anchor logo + Big4 referințe, ghidări secundare 2026-2027
- TAM real: 400-600 entități core DORA
- Verdict: GO selectiv mid-size IFN/SSIF Q2-Q3 2027

### ROL 9 — Patron / CEO Antreprenor IMM
- ICP: `solo` sau `imm-internal` cu **patron access mode** (NU ICP separat)
- Module active: Dashboard EXECUTIVE readonly + magic link approve
- Pricing tier patron: €39 starter / €79 standard / €149 premium (read-only access mode in org)
- Capcană mesaj: "vezi ce face DPO-ul" sună a neîncredere → REFRAME: "Aprobă în 30 sec + dovadă"
- TAM: ~10.000 firme 50-249 ang. (50% concentrare BUC + Cluj/Timiș/Iași/Brașov)
- Verdict: NU primary buyer — secondary approval & retention driver, **vânzare prin consultant care folosește patron-mode ca retention tool**

### ROL 10 — Auditor Extern / Regulator
- ICP: N/A — **token-based read-only access mode** (free seat / referral)
- Module active: Audit Pack ZIP readonly + verify hash chain
- Modelul: FREE for auditor, paid by audited firm. Auditor primește token invitat → economisește 10h/audit × €100 = €1K/audit
- Top 5 mid-tier accesibil: BDO, Forvis Mazars, Crowe, Grant Thornton, RSM (NU Big4)
- Capcană periculoasă: claim "BNR/ASF acceptă export CompliScan" → scoate până la primul case study verificat
- Verdict: NU paying customer, e DISTRIBUTION CHANNEL (referral)

---

## DEFINITION OF DONE pentru fiecare rol — checklist 6 coloane (per critica GPT #5)

| Rol | Engine | UI | Pilot | Billing | Channel | Trust | DECIZIE |
|-----|--------|-----|-------|---------|---------|-------|---------|
| 1 DPO solo | ✅ 95% | ✅ 90% | ⏳ Diana | ❌ | ❌ | ⚠️ | Q4 2026 |
| 2 Cabinet DPO | ✅ 95% | ✅ 90% | ⏳ Diana | ❌ | ❌ | ⚠️ | Q4 2026 |
| 3 Avocat | ✅ 85% | ⚠️ 70% | ❌ | ❌ | ❌ | ❌ | Q1 2027 |
| 4 CISO | ✅ 85% | ✅ 80% | ❌ | ❌ | ❌ | ❌ | Q2 2027 (bundle) |
| **5 Contabil ⭐⭐** | **✅ 80%** | **⚠️ 70%** | **❌** | **❌** | **❌** | **❌** | **MAI 2026** |
| 6 HR | ⚠️ 70% | ⚠️ 50% | ❌ | ❌ | ❌ | ❌ | Q1 2027 |
| 7 AI Gov | ✅ 75% | ✅ 80% | ❌ | ❌ | ❌ | ❌ | Q3-Q4 2026 |
| 8 Banking | ⚠️ 65% | ⚠️ 60% | ❌ | ❌ | ❌ | ❌ | Q2-Q3 2027 |
| 9 Patron | ⚠️ 70% | ✅ 80% | ❌ | ❌ | N/A | N/A | Continuu post Bundle D |
| 10 Auditor | ✅ 80% | ⚠️ 70% | ❌ | N/A | N/A | N/A | Continuu |

---

## SURSE

- Document originar Opus "10 ROLURI Target" 9 mai 2026
- Critica GPT 5.5 review 9 mai 2026 (7 puncte adoptate, 1 push back parțial)
- Raport integrat: [`compliscan-final-validare-piata-2026-05-07.md`](compliscan-final-validare-piata-2026-05-07.md)
- Plan execuție Bundle D: [`bundle-d-fiscal-execution-plan-2026-05-09.md`](bundle-d-fiscal-execution-plan-2026-05-09.md)

---

🔒 **LOCK:** Document = HARTĂ DE PRODUS, NU plan de lansare. Plan execuție concret = `bundle-d-fiscal-execution-plan-2026-05-09.md`. Strategia GTM = secvențial cu 2 primary focuses paralel (Bundle D + DPO Diana), NU 10 piețe simultan.
