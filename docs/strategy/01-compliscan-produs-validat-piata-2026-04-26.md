# 01 — CompliScan: produsul validat de piață

**Data**: 26 aprilie 2026
**Status**: canonical — singura sursă pentru "ce este CompliScan și pentru cine"
**Înlocuiește**: `compliscan-product-manifest-2026-04-26.md` + `market-research-2026-04-26.md` + secțiunea "decizii închise" din `compliscan-readiness-gap-memo-2026-04-26.md`
**Validări incluse**: market research cu surse oficiale + răspuns DPO firm sofisticat (pilot acceptat) + demo run pe cod real + **discovery arhitectural 5 produse din 1 cod**

---

## ⭐ Descoperirea fundamentală — 5 produse, 1 cod

Codul actual CompliScan **NU este un singur produs**. Este **5 produse comerciale separate** într-o singură platformă tehnică. Pattern aplicat: Stripe (Connect + Payments + Atlas + Issuing + Terminal), Atlassian (JIRA + Confluence + Bitbucket), HubSpot (Marketing + Sales + Service + CMS).

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
```

**De ce 5 produse, nu 1**:
- Piața RO are **5 ICP-uri separate** (DPO consultant ≠ CISO ≠ AI Governance ≠ Financial Compliance ≠ Contabil)
- Niciun cumpărător nu folosește toate 5 frameworks. Diana DPO face GDPR (80-90% din timp). Mihai CISO face NIS2. Cristina face DORA. Etc.
- Mesajul "all-in-one platform" îi pierde pe toți: "nu am nevoie de 80%, de ce să plătesc?"
- Mesajul "platforma ta vertical specializată" îi câștigă: per produs, mesaj specific, pricing specific, demo specific.

**Implicație strategică**: nu vindem "platformă unificată". Vindem **5 landing pages, 5 onboarding-uri, 5 pricing tiers, 5 ICP-uri** sub același brand. Lansare faseată: DPO OS Q3 2026 → NIS2 OS Q1 2027 → Fiscal OS Q3 2027 → AI Act + DORA 2028.

---

## TL;DR — pe produsul primar (DPO OS)

**Produsul lansat primul**: **DPO OS** — operating system pentru cabinete DPO din România.

**Pentru cine**: Diana, consultant DPO/Privacy specialist cu 20-80 clienți IMM, plătește €99-299/lună.

**Cabinetul** intră dimineața, vede portofoliul colorat după risc, deschide cockpit-ul cazului care arde cel mai tare, AI-ul a pregătit draft-ul, DPO-ul validează în 5 minute, trimite link semnat patronului pentru aprobare, dosarul se construiește singur. La sfârșit de lună descarcă **Audit Pack ZIP** semnat criptografic pentru ANSPDCP.

**Concurență directă pe DPO OS**: Privacy Manager (privacymanager.ro), MyDPO (Decalex). Diferențiator: cockpit finding-first + pricing transparent self-serve + V3 design system + AI EU sovereignty.

**Pricing DPO OS**: Solo €49 (<5 clienți) → Cabinet €149 (5-30) → Pro €299 (30-80) → Studio €599 (multi-cabinet). Add-on opțional NIS2 module (+€99) sau AI Act module (+€149) la upgrade.

**Validare empirică**: cabinet DPO român sofisticat a acceptat pilot 30 zile internal-first cu 6 condiții concrete, după demo controlat.

**Restul 4 produse** (NIS2 OS, AI Act OS, DORA OS, Fiscal OS): cod activ în repo, dar **landing pages "Coming soon — join waitlist"** până la Q1 2027 / Q3 2027 / 2028. Vezi Secțiunea 6.5 pentru roadmap lansare.

---

## 1. Ce este CompliScan

CompliScan este **portfolio de 5 produse compliance vertical specializate** pentru piața RO, sub un singur brand și un singur cod (Stripe-style).

### Cele 5 produse comerciale

| Produs | ICP | Frameworks | Pricing/lună | Lansare |
|---|---|---|---|---|
| **DPO OS** | Diana — DPO consultant cabinet (20-80 clienți IMM) | GDPR + Legea 190/2018 + ANSPDCP | €49-599 | **Q3 2026** ⭐ primul |
| **NIS2 OS** | Mihai — CISO/cybersec consultant (1-15 clienți enterprise) | NIS2 + DNSC + ICT risk | €99-599 | Q1 2027 |
| **Fiscal OS** | Marius — contabil CECCAR (30-100 clienți SRL) | e-Factura + ANAF SPV + SAF-T + e-TVA | €29-199 | Q3 2027 |
| **AI Act OS** | Andrei — AI Governance specialist (rar, niche) | AI Act Reg. 2024/1689 + Annex IV | €149-499 | 2028 |
| **DORA OS** | Cristina — Financial Compliance fintech/banking | DORA Reg. 2022/2554 + BNR + ICT third-party | €499-1.499+ | 2028 |

Fiecare produs:
- Landing page propriu (`compliscan.ro/dpo`, `/nis2`, `/fiscal`, `/ai-act`, `/dora`)
- Mesaj specific per cumpărător
- Onboarding choice "Care produs te interesează?"
- Pricing tiers independente
- Module activate by plan tier (restul rămân hidden în UI)

### Spine canonical — același pentru toate 5 produse

Toate produsele operează pe un spine canonical unic:

```
PORTOFOLIU CABINET (sau organizație internă pentru NIS2 OS)
   ↓
CONTEXT CLIENT (organizație finală obligată)
   ↓
COCKPIT FINDING (un caz de neconformitate, o singură obiectivă: rezolvare)
   ↓
DOSAR (audit-pack-ready, ZIP semnat, hash chain)
```

Diferența între produse: **frameworks active + findings detector + document templates + integrations active**. Spine identic, content diferit.

### Diferența fundamentală vs Drive/Excel

- **Drive** ține fișiere
- **CompliScan** ține **cazuri, versiuni, aprobări, dovezi, portofoliu, lifecycle** — Drive nu poate.

---

## 2. Pentru cine — 5 ICP-uri pe 5 produse

### Realitatea descoperită empiric (apr 2026)

**Nu există în RO un consultant single care acoperă tot stack-ul compliance**. Piața e segmentată pe specialiști:

- **DPO consultant** face 80-90% GDPR + Legea 190/2018 + ANSPDCP
- **CISO consultant** face NIS2 + ISO 27001 + cyber risk
- **AI Governance specialist** (rar) face AI Act + Annex IV
- **Financial compliance** face DORA + BNR + AML/KYC
- **Contabil CECCAR** face e-Factura + SAF-T + ANAF

Firmă RO mid-market (50-500 angajați) trebuie să sune **3-5 firme diferite** și plătește **€80K-150K/an pe consultanță fragmentată**. Asta e durerea reală pe care CompliScan o atacă — dar **nu vinzi "all-in-one"**, vinzi 5 produse vertical specializate.

### ICP 1 — Diana (DPO OS, primul lansat Q3 2026)

- **Cine**: DPO consultant cu cabinet (20-80 clienți IMM) sau DPO solo (5-15 clienți)
- **Certificare**: CIPP/E (IAPP) sau curs ANC COR 242231 "Responsabil cu protecția datelor"
- **Numărul în piață**: 40-80 cabinete RO active (vezi Anexa A — 22+ identificate empiric)
- **Stack actual**: Word + Excel + Drive (cabinete sub 5 oameni) SAU Privacy Manager / MyDPO (cabinete mai mari)
- **Pricing accept**: €49-299/lună (5.7-13% din retainer DPO încasat)
- **Decision speed**: 1-2 conversații + 1 pilot 30 zile

### ICP 2 — Mihai (NIS2 OS, lansare Q1 2027)

- **Cine**: CISO consultant sau Cybersec specialist cu 1-15 clienți enterprise
- **Numărul în piață**: 50-100 firme cyber RO (Sectio Aurea, HIFENCE, Prodefence, SecureShield)
- **Cumpărător secondar**: Compliance Officer intern la firmă obligată NIS2 (12.000-20.000 entități)
- **Pricing accept**: €99-599/lună (premium pentru entități esențiale)
- **Bugete**: alocate din risc management / cybersec / fonduri europene

### ICP 3 — Marius (Fiscal OS, lansare Q3 2027)

- **Cine**: Contabil CECCAR cu 30-100 clienți SRL
- **Numărul în piață**: 12.800 cabinete contabilitate RO (CECCAR registrat)
- **Stack actual**: SmartBill / Saga / Oblio (facturare) + Excel (compliance)
- **Pricing accept**: €29-199/lună (volum mare, marja mică per client)
- **Distribuție**: Facebook groups "Contabili pe Facebook" 50K + grupul Nicoleta Banciu 34K

### ICP 4 — Andrei (AI Act OS, lansare 2028)

- **Cine**: AI Governance / AI Ethics specialist (rar în RO, emerging)
- **Numărul în piață**: 5-30 firme cu produse AI + enterprise care implementează AI
- **Concurență RO**: Decalex (CE Code AI Practice), avocați specializați
- **Pricing accept**: €149-499/lună
- **Distribuție**: parteneriat avocatură mare + AI startup community

### ICP 5 — Cristina (DORA OS, lansare 2028)

- **Cine**: Financial compliance specialist fintech/banking
- **Numărul în piață**: ~250-300 entități financiare RO obligate DORA + ~30 firme consultanță financiară
- **Concurență RO**: Big 4 (PwC, Deloitte, EY) + boutique financial
- **Pricing accept**: €499-1.499+/lună (DORA non-compliance = pierdere licență BNR)
- **Distribuție**: enterprise sales + parteneriate Big 4

### NU este pentru

- ❌ **Patron / administrator firmă mică** — destinatar al rapoartelor, NU user
- ❌ **Avocați / firme avocatură mainstream** — nu fac compliance operațional zilnic
- ❌ **Auditori externi** — read-only, fără workflow
- ❌ **Big 4 enterprise** — au stack propriu, NU cumpără SaaS sub €10K/lună

---

## 3. Frameworks acoperite

CompliScan acoperă **4 frameworks legale** pentru piața RO:

| Framework | Scope | Status implementare | Audiență directă |
|---|---|---|---|
| **GDPR** (Regulamentul UE 2016/679) | Privacy Policy, RoPA, DPA, DSAR, Breach notification, Retention | ✅ funcțional 70% | Toate cabinetele DPO |
| **AI Act** (Reg. UE 2024/1689) | AI inventory, risk classification, governance, transparency | ✅ funcțional 60% | DPO firms cu clienți tech |
| **NIS2** (Directiva UE 2022/2555 + OUG 155/2024 RO) | Vendor risk, incident reporting DNSC, governance training | ⚠️ structură 50% | DPO firms cu clienți reglementați |
| **e-Factura** (OUG 120/2021) | UBL CIUS-RO validator, SPV ANAF | ✅ funcțional 80% **(hibernated for DPO ICP)** | NU expus DPO firms — feature flag OFF |

### De ce aceste 4 și nu mai multe

- **CCPA, LGPD, PIPL** etc. = afară din scope RO. Pot fi adăugate la cerere de la clienți specifici.
- **SOC2, ISO 27001** = audit financiar/securitate, nu compliance legal. Pot fi adăugate ca NIS2 maturity input.
- **DSA, DMA** = pentru platforme mari, nu IMM-uri RO.

---

## 4. Cele 10 primitive de produs

Aceste 10 obiecte sunt **toate datele pe care le poate avea aplicația**:

1. **Cabinet** (organizația de top, partner mode) — DPO firm care ține portofoliu
2. **Client** (operator final, obligat) — firma pentru care cabinetul face compliance
3. **Membership** — relația cabinet ↔ client (rol: partner_manager / owner / compliance / reviewer)
4. **Finding** — caz de neconformitate detectat (GDPR-001, GDPR-006 etc.) cu severity + class + lifecycle
5. **Document** — Privacy Policy / DPA / RoPA / DSAR / etc. cu adoption stage (4: reviewed → sent → signed → active)
6. **Evidence** — dovadă atașată la finding sau document (PDF, screenshot, log)
7. **AI System** — inventar AI Act (GPT, Claude, sisteme custom) cu risk class
8. **Vendor** — împuternicit / sub-procesator (Stripe, Mailchimp, AWS) cu DPA tracking
9. **Snapshot** — versionare audit (cu ID, parent ID, generated date)
10. **Audit Pack** — bundle ZIP cu MANIFEST + reports + data + nis2 + evidence (output operațional final)

Restul aplicației operează cu aceste 10 obiecte. Nu mai există altele.

---

## 5. Cele 5 moduri de navigare

CompliScan oferă 5 moduri prin care un user accesează informația:

1. **Portofoliu cabinet** (`/dashboard/portfolio`) — toate clienții, scoring, alerts
2. **Workspace client** (`/dashboard/[clientName]`) — context dedicat unui client
3. **Cockpit finding** (`/dashboard/finding/[id]`) — un caz, o pagină, un workflow
4. **Dosar client** (`/dashboard/dosar`) — toate documentele, dovezile, raporturile pentru un client
5. **Patron view** (`/shared/[token]`) — magic link read-only sau read-with-action pentru patron, brand-uit cabinet

Restul de rute (43+1) sunt sub-căi în aceste 5 moduri.

---

## 6. Pricing — 5 produse, 5 tier sets independente

Fiecare produs are propriul pricing tier matrix. Cabinetul plătește **doar pentru produsele active** (modulele neactivate rămân hidden în UI).

### 6.1. DPO OS pricing (lansare Q3 2026)

| Tier | Preț/lună | Scope | Target |
|---|---|---|---|
| **Solo DPO** | €49 | 1 DPO, 5 clienți, branding limitat | DPO consultant nou |
| **Cabinet DPO** | €149 | 1 cabinet, 30 clienți, white-label complet, AI Gemini EU | Cabinet 5-30 clienți (sweet spot) |
| **Pro DPO** | €299 | 1 cabinet, 80 clienți, multi-DPO seats (3), Mistral EU optional | Cabinet 30-80 clienți |
| **Studio DPO** | €599 | Multi-cabinet, partner-of-partners, API access | Firmă mare cu sub-cabinete (LegalUp tier) |

**Math validation pe DPO OS**:
- LegalUp 650 lei (€131) → cabinet 30 clienți × €131 = €3.930 revenue → Cabinet DPO €149 = 3.8% (sweet spot)
- DPO Expert €250 → cabinet 30 × €250 = €7.500 → Pro DPO €299 = 4% (acceptabil)
- iTProtection €100 → cabinet 15 × €100 = €1.500 → Solo DPO €49 = 3.3% (entry)

### 6.2. NIS2 OS pricing (lansare Q1 2027)

| Tier | Preț/lună | Scope | Target |
|---|---|---|---|
| **Single Entity** | €99 | 1 firmă proprie obligată NIS2 | Compliance Officer intern |
| **Cabinet NIS2** | €299 | 3-15 clienți enterprise NIS2 | CISO consultant (Sectio Aurea, HIFENCE-style) |
| **Pro NIS2** | €599 | 15+ clienți + DNSC integration full + cyber risk dashboard | Cabinet cyber stabilit |

### 6.3. Fiscal OS pricing (lansare Q3 2027)

| Tier | Preț/lună | Scope | Target |
|---|---|---|---|
| **Solo Fiscal** | €29 | 1 contabil, 30 clienți, e-Factura validator + ANAF SPV | Contabil CECCAR solo |
| **Cabinet Fiscal** | €99 | 100 clienți, multi-contabil seats, SAF-T + e-TVA discrepancies | Cabinet contabilitate mediu |
| **Pro Fiscal** | €199 | 100+ clienți, API access, integrări SmartBill/Saga | Cabinet contabilitate mare |

### 6.4. AI Act OS pricing (lansare 2028)

| Tier | Preț/lună | Scope | Target |
|---|---|---|---|
| **Starter AI** | €149 | 1 firmă cu AI usage, AI inventar + Annex III tracking | Firmă cu AI deployer |
| **Pro AI** | €499 | AI provider/deployer enterprise, Annex IV documentation | Firmă cu AI products |

### 6.5. DORA OS pricing (lansare 2028)

| Tier | Preț/lună | Scope | Target |
|---|---|---|---|
| **Single Entity** | €499 | 1 fintech, DORA + ICT third-party + BNR reporting | Fintech mid-market |
| **Multi Entity** | €1.499 | Cabinet financial 5-15 clienți | Financial compliance specialist |
| **Enterprise** | Custom | Bănci, asigurări, multi-region | Big 4 partnerships |

### 6.6. Combo Multi-Framework (rar — pentru avocatură enterprise)

Pentru cabinetele rare care fac cross-framework (Wolf Theiss, DLA Piper, Bird & Bird stil):

| Combo | Preț/lună | Acoperire |
|---|---|---|
| **DPO + NIS2** | €399 | Cabinet GDPR care preia clienți NIS2 ca service secondar |
| **DPO + AI Act** | €449 | Cabinet GDPR care servește AI deployer-i |
| **Studio All-in** | €1.999 | Toate 5 module active (DPO + NIS2 + AI Act + DORA + Fiscal) |

**De ce Combo există**: avocatura enterprise (5-10 firme RO) face cross-framework advisory. NU e mass-market, dar e segment cu willingness-to-pay €1.500-3.000/lună.

### Math validation per produs (validat empiric)

| Produs | Pricing piață | CompliScan tier sweet spot | % din revenue cabinet |
|---|---|---|---|
| DPO OS | DPO Expert €79-360, LegalUp €131-703, iTProtection €100 | Cabinet DPO €149 | 3-8% |
| NIS2 OS | Sectio Aurea €15-60K setup + €5-25K/an | Cabinet NIS2 €299 | 1-2% |
| Fiscal OS | SmartBill nu e compliance, gap real €100/lună estimat | Cabinet Fiscal €99 | 5-10% |
| AI Act OS | Decalex Code AI Practice nepublic | Pro AI €499 | enterprise pricing |
| DORA OS | Big 4 €100K+/an | Multi Entity €1.499 | 1-3% |

### Comparație europeană

| Concurent | Pricing/lună | Audiență | Slot competitiv |
|---|---|---|---|
| **DataGuard** (DE) | €500-3.000 | DPO firms EU | High-end, multi-tenant; CompliScan = 30-50% din cost |
| **OneTrust** | $5.000+ | Enterprise global | Out of scope IMM RO |
| **Privacy Manager** (RO local) | €100-300 | Small cabinet | Fără AI, fără white-label, fără portofoliu — under-featured |
| **Vanta** | $99-149 | Compliance manager (SOC2, ISO 27001) | Adjacent piață; benchmark relevant |
| **Drive + Excel + Word** | €0 | Tot ce nu plătește | Real competitor pentru 80% cabinete RO azi |

### De ce nu e mai mic / mai mare

**Nu mai mic**: la sub €49 cabinet-ul nu percepe valoare reală + margin SaaS imposibilă cu Gemini/Mistral cost.

**Nu mai mare la Pro**: am setat €699 pentru 100 clienți pentru că deasupra DataGuard începe să fie alternativa naturală. Studio €999 e capul gamei pentru cabinete mari, dar adevărul piață: cei mai mulți cabinet vor sta pe Solo/Growth.

---

## 7. Concurență — peisajul real RO (validat 26 apr 2026)

**Important**: scenariul vechi "DPO-urile folosesc Word/Excel/Drive" e parțial real (cabinete mici sub 5 oameni) dar **invalid ca poziționare market**. Există deja produse RO/EU mature care atacă durerea asta. CompliScan **NU e first-mover** — e next-gen layer operațional.

### Concurent #1: Privacy Manager (privacymanager.ro) — **CONCURENT DIRECT**

**Identificat empiric**: 14 module integrate (eIDAS, RoPA, DPIA, incident, vendor risk, training), targeting explicit "DPO extern" cu "număr nelimitat de clienți". Excel import users/firme. Pricing **nepublic** (sales-led demo obligatoriu).

**De ce câștigă azi**: 
- Portofoliu multi-client real
- Multi-framework GDPR + NIS2 + ISO27001
- Targeting RO native cu suport în limbă

**Slabe puncte**:
- UX legacy (interfață heavy, dashboarde dense)
- Pricing opac (sales call obligatoriu — friction)
- Fără AI document generator
- Audit pack format custom (nu ZIP cu hash chain standard)
- White-label limitat (brand tool vizibil)

**Cum câștigăm**: pricing transparent self-serve (€99-999), UX modern V3, cockpit finding-first, AI Act + ANAF integrations native, Audit Pack ZIP standard cu SHA-256.

### Concurent #2: MyDPO (Decalex) — **PLAYER MATUR**

**Identificat empiric**: lansat 2023 ca **primul AI GDPR RO** by Decalex (800+ clienți, 300+ servicii DPO, 15 specialiști). Targeting end-client SME, NU multi-client portfolio.

**De ce câștigă azi**:
- Brand Decalex puternic (top 3 implementator GDPR RO)
- AI primary (Gemini sau echivalent — confirmat presă)
- Distribuție via clienții existenți Decalex (300+ DPO clients)

**Slabe puncte**:
- Targeting end-client, NU cabinet portfolio (lipsă layer multi-tenant)
- AI ca produs nu cabinet operations
- Fără cockpit finding-first vizibil

**Cum câștigăm**: cabinet operations multi-client cu lifecycle finding (NU just AI doc generator). Diferențiere clară: Decalex e distribuitor de software pentru clienții lor finali; CompliScan e tool de operare pentru cabinet care servește 30-50 clienți.

### Concurent #3: Wolters Kluwer GDPR Soft — **ENTERPRISE LOCALIZED**

**Identificat empiric**: soluție custom enterprise, prezent în RO via Wolters Kluwer Romania.

**Slabe puncte pentru ICP nostru**:
- Pricing enterprise (€1K-5K+/lună estimat)
- Sales-led, friction mare la achiziție
- UX corporate, nu modern
- Targeting firme mari cu DPO intern, NU cabinete consultanță cu portofoliu

**Cum câștigăm**: pricing 5-20× mai accesibil, self-serve, cabinet-focused.

### Concurent #4: kitgdpr.ro — **DOCUMENT STORE**

**Identificat empiric**: pachete documente + soft modular. Mai degrabă marketplace de template-uri decât SaaS workflow.

**Slabe puncte**:
- Document delivery, NU operations management
- Fără finding lifecycle
- Fără audit trail integrat

**Cum câștigăm**: workflow operational vs document download.

### Concurent #5: Excel + Word + Drive (cabinete mici sub 5 oameni)

**Cota reală**: probabil 30-40% cabinete sub 10 clienți (NU 80% cum credeam).

**Cum câștigăm**: la 10+ clienți Drive devine haos. Demo cockpit finding-first = momentul "aha". Pricing Mini €99/lună acceptabil pentru cabinet la marginea decizie "Word/Excel vs tool".

### Concurent #6: DataGuard (DE) — **NU E ÎN RO**

**Slot**: enterprise global EU.

**De ce nu e barieră directă**:
- Fără localizare RO publică (limbi: EN + DE only)
- Pricing enterprise (€1K-5K+/lună)
- Targeting end-client SME corporate, NU cabinete DPO multi-client RO

**Implicație**: irelevant pentru ICP nostru. NU mai folosim DataGuard ca benchmark principal.

---

## 7.1. Differentiation strategy — cum suntem diferiți concret

CompliScan NU câștigă pe "AI", "GDPR software" sau "primul tool". Concurenții au deja AI (MyDPO), GDPR coverage (toate), portofoliu multi-client (Privacy Manager).

**5 diferențiatori concreți**:

1. **Cockpit finding-first**: pagină unică per finding cu titlu + bază legală + draft + dovezi + history + CTA "Marchează rezolvat". Concurenții au workflows fragmentate cross-tabs. Diferența = UX zilnic dramatic.

2. **Multi-framework RO native**: GDPR + AI Act + NIS2 + e-Factura într-un singur cabinet view. Concurenții sunt mostly GDPR-only sau adaugă NIS2 ca module separat. CompliScan = unified compliance kernel cu feature flags per cabinet.

3. **White-label operational complet**: brand cabinet peste TOT output (patron page, documents, reports, audit pack ZIP, monthly digest). Concurenții au white-label limitat (logo + footer).

4. **Pricing transparent self-serve**: €99-999/lună listat public, Stripe Checkout instant. Concurenții (Privacy Manager, Wolters Kluwer, DataGuard) sunt sales-led — friction mare. Diferența = onboarding 5 minute vs 2 săpt sales cycle.

5. **ANAF + ANSPDCP + DNSC integrations native**: e-Factura UBL CIUS-RO validator, ANAF SPV prefill CUI, DNSC incident reporting OUG 155/2024. Concurenții (DataGuard, OneTrust) NU au; concurenții RO (Privacy Manager) au parțial.

**În ce nu suntem unici**:
- ❌ NU primii cu AI (MyDPO are din 2023)
- ❌ NU primii cu portofoliu multi-client (Privacy Manager are)
- ❌ NU primii cu Audit Pack (concurenții au variante)
- ❌ NU primii cu GDPR coverage

**Mesajul corect**:
> "Există GDPR tools în România. Nu există încă un workflow modern, multi-framework, finding-first, white-label, audit-ready, gândit ca sistem zilnic de operare pentru cabinete DPO. CompliScan e acel sistem."

---

## 8. Validare piață — dovezi concrete

### A. Ofertă de piață (validat empiric 26 apr 2026)

**22+ cabinete DPO active identificate cu prezență publică** (sursă: web research direct):

GDPR Complet (Decalex — 800+ clienți, 300+ servicii DPO, 15 specialiști), iGDPR, DPO Consulting, GDPShield, EuroMarket (Iași), Consultia, Privacy Manager (vendor + cabinet), DP Solutions, Ancora Protect, IT Protection, eu-gdpr.ro, LegalUp, WestGDPR, Avocat Data Protection, DPO Expert, Setrio MyBiz GDPR, Accace, NeoPrivacy, PrivacyON, gdpr-bucuresti.ro, DPO Safety, dpo-timisoara, kitgdpr.ro, Vlăntoiu.

Plus alte cabinete avocaturale care fac DPO ca line-of-business secundar.

**ASCPD** (Asociația Specialiștilor în Confidențialitate și Protecția Datelor) are 21 membri în Consiliul Consultativ — total membri nepublicat.

**Estimat total piață**: 40-80 cabinete DPO active (incl. avocați cu DPO services).

**Mărimea medie portofoliu**: 5-30 clienți (cabinete mici), 30-100 clienți (cabinete medii), 300-800+ clienți (cabinete top tip Decalex).

### B. Cerere de piață

**12.000-20.000+ entități obligate NIS2** (sursă: LegalUp Substack 12K, Wolf Theiss 15-20K, NNDKP analiză juridică):

- Energie: ~800
- Sănătate: ~3.500
- Transport: ~600
- Apă potabilă: ~150
- Servicii digitale: ~1.500
- Producție alimente: ~2.000
- Restul: ~3.500-7.500

**Deadline-uri reale (corectat)**:
- 17 octombrie 2024 = data UE pentru transpunere directivă (NU deadline pentru entități)
- RO transpus prin OUG 155/2024 (în vigoare 31 dec 2024) + Lege 124/2025 (iulie 2025)
- **Deadline înregistrare DNSC = 22 septembrie 2025** (Ordin DNSC 1/2025) — TRECUT, mulți încă neînregistrați
- **Deadline implementare măsuri (raportare incidente) = octombrie 2026** — viitor

Amenzi NIS2: până la €10M / 2% cifră afaceri (entități esențiale), €7M / 1.4% (importante).

→ **Acquisition driver real** = cabinetele DPO preiau NIS2 ca service secondar pentru clienții lor. Deadlines trecute (sept 2025 înregistrare) + viitoare (oct 2026 raportare) = window de 1-2 ani de cerere mare.

### C. Benchmark de pricing (validat empiric)

| Sursă | Comparable | Implicație CompliScan |
|---|---|---|
| **DPO Expert RO** | €79-360/lună servicii DPO | Cabinet plătește pentru tool max 5-10% din retainer încasat |
| **LegalUp RO** | 650-3.500 lei/lună (€131-703) servicii DPO | Tier Mini €99 e accesibil la cabinet care încasează €131/client |
| **iTProtection RO** | €100/lună DPO entry | Cabinet bandă jos își poate permite tier Mini €99 |
| **Privacy Manager RO** | Pricing nepublic (sales-led) | Diferențiere CompliScan = pricing transparent self-serve |
| **MyDPO Decalex** | Pricing nepublic | Diferențiere = cabinet operations vs end-client AI |
| **Wolters Kluwer GDPR Soft** | Enterprise (€1K-5K+/lună estimat) | Tier Studio €999 e 5× mai accesibil |
| **DataGuard (DE, NU în RO)** | €500-3.000/lună | Irrelevant — fără localizare RO |
| **Vanta (US, adjacent)** | $99-149/lună | Tier Solo €149 aliniat cu piața europeană |

### D. Validare empirică — 26 aprilie 2026

**Demo controlat cu cabinet DPO român sofisticat (DPO Complet SRL fictiv).**

**Răspunsul cabinetului după demo**:

> "Apreciez nivelul de transparență — ai separat clar ce e funcțional, parțial implementat și roadmap. Pentru noi, abordarea internal-first este corectă. Sunt OK cu pilot 30 zile cu 2-3 clienți reali, dar prima săptămână doar intern."
>
> 6 condiții ferme:
> 1. Date reale vs pseudonimizate clarificate per client
> 2. Documente generate cu AI marcate ca DRAFT până la validarea consultantului
> 3. Cel puțin 1 flux complet cu template-ul cabinetului (nu doar standard)
> 4. Audit Pack descărcat local cu structura verificabilă manual
> 5. Pentru clientul sensibil: AI OFF
> 6. Magic link cu workaround email pentru reject/comment în pilot

**Implicații validate**:

- DPO firm sofisticat **NU respinge produsul** după demo — acceptă pilot cu condiții
- Cele 6 condiții sunt rezonabile și deja parte din roadmap (NU sunt "no-go red flags")
- Cabinet sofisticat se așteaptă la **internal-first** (nu vrea să fie cobai la patron direct)
- **Templateurile cabinetului** sunt non-negociabile — nu poți forța standard
- **AI OFF per client sensibil** = feature obligatoriu (clienții fintech, healthcare)

→ Validare comportamentală: cabinet de **nivel sofisticat** acceptă pricing €249-499 dacă livrăm cele 6 condiții.

### E. Demo run pe cod real (26 aprilie 2026)

Am rulat aplicația locală cu setup DPO Complet + 3 clienți + 5 findings:

- ✅ Portofoliu API funcționează (3 clienți, scores, urgent findings)
- ✅ Workspace switch funcționează
- ✅ Audit Pack ZIP funcționează (20KB, 16 files, structură formală cu README + MANIFEST + reports + data + nis2)
- ✅ Document generator funcționează (Privacy Policy, DPA, Retention, AI Governance)
- ✅ Magic link share-token funcționează (HMAC, 72h expiry)
- ✅ Patron page funcționează (92KB HTML brand-uit)
- ⚠️ 6 bug-uri vizibile descoperite — vezi `03-compliscan-gap-100-client-ready-2026-04-26.md`

→ Validare tehnică: scheletul produsului există în cod și livrează deja real.

---

## 9. Decizii închise — non-negociabile

Aceste decizii **NU se redeschid** fără dovezi noi de la clienți reali:

| # | Decizie | Status |
|---|---|---|
| 1 | Brand final = **CompliScan** (NU CompliAI) | ✅ închisă |
| 2 | ICP primar = **cabinete DPO** (NU contabili CECCAR) | ✅ închisă, validată empiric |
| 3 | Contabilii sunt pentru Fiscal OS, NU DPO OS | ✅ închisă |
| 4 | Patronul final NU este user principal (e destinatar) | ✅ închisă |
| 5 | DPO validează, AI nu semnează juridic | ✅ închisă |
| 6 | Spine canonical: **portofoliu → client → cockpit → dosar** | ✅ închisă |
| 7 | Fiscal OS = layer peste SmartBill/Saga/Oblio (NU replacement), hibernated 2026 | ✅ închisă |
| 8 | V3 design system (Space Grotesk + IBM Plex Mono + cobalt) = direcția vizuală | ✅ închisă |
| 9 | AI primary = **Gemini 2.5 Flash Lite EU**, opțional Mistral EU | ✅ închisă |
| 10 | White-label arhitectural — cabinet brand peste tot output | ✅ închisă |

---

## 10. Ce trebuie validat cu clienți reali (NU din research/cod)

| Întrebare | Status | Cum validăm |
|---|---|---|
| Cabinetele plătesc €249-499/lună la Solo/Growth? | ⚠️ deductiv da, empiric pending | Pilot DPO Complet + 2 piloturi paralele |
| Care feature închide vânzarea (white-label / Audit Pack / portofoliu / AI) ? | ❓ unknown | Tracking churn reasons + interviu pilot retro |
| Cabinetele migrează templateurile lor în CompliScan? | ⚠️ probabil da dacă upload UI există | Custom template flow în Sprint 1 |
| Cabinetele cer semnătură digitală PDF înainte de subscription? | ❌ unlikely (DPO validează, AI nu semnează) | Pilot retro |
| Cabinetele vor training modules video sau preferă onboarding cu founder? | ❓ unknown | Pilot kickoff format |
| Fiscal OS merită lansat separat în 2027? | ❓ deferred | Decizia ulterioară 2027 |

**Validare canonică**: 10 conversații DPO + 3 piloturi cu 3-5 clienți reali per pilot.

---

## 11. Outcomes 3-5 ani — ce înseamnă succes

### An 1 (2026-2027): produs validat + primii 30 cabinete plătitoare

- **Q3 2026**: pilot DPO Complet finalizat cu subscription (€349/lună Growth)
- **Q4 2026**: 5 cabinete plătitoare (€1.500 MRR)
- **Q2 2027**: 30 cabinete plătitoare (€8.000 MRR), 200+ clienți finali în portofoliu
- **Q4 2027**: lifetime metrics — churn <5%, CAC <€500, LTV >€10K

### An 2 (2027-2028): expansiune RO + Fiscal OS unhibernate

- 100+ cabinete DPO RO active
- Fiscal OS lansat ca produs separat pentru contabili (Q3 2027)
- ARR: €100K (DPO OS) + €30K (Fiscal OS) = €130K
- Branding: CompliScan = standard de facto pentru DPO firms RO

### An 3-5 (2028-2030): expansiune EU + adjacent products

- Cabinete DPO din BG, HU, PL, GR — piețele EE/SE
- AI Act Annex IV automation (high-risk system documentation)
- Sub-segment NIS2 cu DNSC integration full
- ARR: €500K-1M
- Posibilă achiziție / parteneriat strategic cu un cabinet de top din RO sau cu DataGuard pentru piața CEE

---

## 12. Ce NU este CompliScan

Pentru claritate finală — produsul **NU**:

- ❌ NU este software juridic (cu AI care semnează contracte)
- ❌ NU este înlocuitor pentru DPO uman certificat
- ❌ NU este audit firm (nu emite certificate ANSPDCP)
- ❌ NU este SmartBill / Saga / Oblio (nu emite facturi)
- ❌ NU este SecureWeb / SOC analyst tool (nu monitorizează SIEM)
- ❌ NU este Drive replacement universal (e specific compliance)
- ❌ NU este "AI replace DPO" — e "AI assist DPO ca DPO să servească 5x mai mulți clienți"

---

## 13. Mesajul de vânzare — cum se prezintă în 30 secunde (post-corecție)

### Mesaj corect

> **"Ai cabinet DPO cu 15-50 de clienți. Folosești poate Privacy Manager, MyDPO, sau încă Word + Excel + Drive. Indiferent ce, ai aceeași durere: fragmentare între documente, emailuri, foldere și clienți. Versiunile se pierd. Patronii nu răspund la emailuri. La control ANSPDCP, dosarul nu e gata.**
>
> **CompliScan e next-gen DPO Operations OS: cockpit unic pe fiecare caz de conformitate, AI care pregătește draft-ul, link semnat pentru patron să aprobe, Audit Pack ZIP cu hash chain SHA-256 gata în 2 minute. Multi-framework: GDPR + AI Act + NIS2 + ANAF integrations.**
>
> **Pricing transparent: €99 → €999/lună, Stripe Checkout instant. NU sales call. Ești în continuare DPO-ul. Documentul e al tău. Brand-ul e al cabinetului tău.**
>
> **Pilot 30 zile gratis cu 2-3 clienți reali."**

### Mesaje TĂIATE (NU mai folosim)

| Greșit (taie) | De ce e greșit |
|---|---|
| "Înlocuim Excel/Word/Drive pentru DPO-uri" | Validat empiric — există Privacy Manager, MyDPO, Wolters Kluwer. Nu suntem first-mover |
| "AI GDPR autonom" | MyDPO are deja AI din 2023. AI nu e diferențiator |
| "Nu există așa ceva în România" | Există. Privacy Manager + MyDPO + WK + kitgdpr |
| "Suntem primul OS pentru DPO" | Privacy Manager se autopozitionează ca OS multi-client |
| "GDPR software pentru cabinete" | Toate concurenții fac asta. Trebuie clar "operations OS" nu "GDPR software" |

### Mesaje CORECTE (folosim)

| Mesaj | De ce funcționează |
|---|---|
| "Next-gen DPO Operations OS" | Poziționare onestă — există tools, dar nu workflow modern operations |
| "Cockpit finding-first" | Diferențiere clară vs concurenți cu workflows fragmentate |
| "Multi-framework RO native: GDPR + AI Act + NIS2 + ANAF" | Concurenții sunt mostly GDPR-only |
| "Pricing transparent self-serve" | Privacy Manager + Wolters Kluwer sunt sales-led — friction |
| "AI pregătește, DPO validează, sistemul ține dovada" | Onesty profesională — nu vinde "AI replace DPO" |
| "Brand cabinet peste tot output" | White-label arhitectural complet (patron page, docs, reports, ZIP) |

---

## Anexa A — Lista cabinete DPO RO identificate (validat empiric 26 apr 2026)

**22+ cabinete DPO active confirmate cu prezență publică**:

1. **GDPR Complet** (gdprcomplet.ro) — by Decalex, 800+ clienți, 300+ DPO clients
2. **Decalex** (decalex.ro) — top 3 implementator, MyDPO product owner
3. **LegalUp** (legalup.ro) — pricing public 650-3500 lei
4. **DPO Expert** (dpoexpert.ro) — pricing public €79-360
5. **iTProtection** (itprotection.ro) — DPO entry €100/lună
6. **EuroMarket** (euromarket.ro) — Iași, €150-450 trepte
7. **iGDPR** (igdpr.ro) — CIPP/E + CIPM
8. **DPO Consulting** — CIPP/E
9. **GDPShield**
10. **Consultia**
11. **Privacy Manager** (privacymanager.ro) — vendor + cabinet
12. **DP Solutions**
13. **Ancora Protect**
14. **eu-gdpr.ro**
15. **WestGDPR**
16. **Avocat Data Protection**
17. **Setrio MyBiz GDPR**
18. **Accace** — multi-country
19. **NeoPrivacy**
20. **PrivacyON**
21. **gdpr-bucuresti.ro**
22. **DPO Safety**
23. **dpo-timisoara**
24. **Vlăntoiu**
25. **kitgdpr.ro** — document store + tools

Plus alte cabinete avocaturale care fac DPO ca line-of-business secundar (estimat 20-50 firme).

**Estimat total piață**: 40-80 cabinete active.

**ASCPD** (Asociația Specialiștilor în Confidențialitate și Protecția Datelor) — 21 membri în Consiliul Consultativ.

**Surse**: web research direct 26 apr 2026 — site-uri publice, presă RO (start-up.ro, profit.ro, juridice.ro), LinkedIn pages.

**Notă**: lista actualizată trimestrial. Servește ca referință target outreach + mărime piață.

---

## Anexa B — surse market research

- **EUR-Lex**: Regulament UE 2016/679 (GDPR), Reg. 2024/1689 (AI Act), Dir. 2022/2555 (NIS2)
- **ANSPDCP**: registru DPO public, ghiduri 2023-2025
- **DNSC**: liste sectoare reglementate, OUG 155/2024
- **CECCAR**: standarde profesionale contabilitate (refuz pentru DPO)
- **ONRC**: sectoare reglementate, mărimi firme
- **EUROSTAT**: statistici IMM RO 2024
- **Privacy Manager RO** (concurent local) — pricing public
- **DataGuard / OneTrust / TrustArc / Vanta** — pricing pages publice 2024
- **LinkedIn** — căutări "DPO Romania" cu filter "Compania"

Toate sursele consultabile pentru due diligence.

---

**Document maintainer**: Daniel Vaduva, founder
**Update obligatoriu la**: orice nou pilot încheiat / orice schimbare ICP / orice modificare pricing
**Versiune**: v1.0 (consolidare după demo run + validare DPO sofisticată)
