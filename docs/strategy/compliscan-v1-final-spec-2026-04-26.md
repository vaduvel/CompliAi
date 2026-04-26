# CompliScan v1 — Final Product Specification

**Data**: 26 aprilie 2026
**Status**: canonical reference — sursă unică de adevăr pentru ce construim, pentru cine, cât luăm
**Decizii de bază**: pivot ICP la DPO consultant, brand CompliScan, AI Claude Sonnet 4.6, 2 produse în 1 cod
**Bazat pe**: cele 25 puncte critică + research piață 4 agenți + analiza GPT-5.5 + 3 docs IA-UX + research DPO competiție + research liability/AI engine

---

## Cuprins

1. [Brand & poziționare](#1-brand--poziționare)
2. [Cele 3 personas](#2-cele-3-personas)
3. [Arhitectura "2 produse în 1 cod"](#3-arhitectura-2-produse-în-1-cod)
4. [Tour cap-coadă DPO OS](#4-tour-cap-coadă-dpo-os)
5. [Pricing FINAL](#5-pricing-final)
6. [Differentiators vs concurenți](#6-differentiators-vs-concurenți)
7. [Liability & legal positioning](#7-liability--legal-positioning)
8. [AI engine strategy](#8-ai-engine-strategy)
9. [Roadmap până la launch](#9-roadmap-până-la-launch)
10. [Definiția "v1 launched"](#10-definiția-v1-launched)
11. [Targets financiare](#11-targets-financiare)
12. [Anexe](#12-anexe)

---

## 1. Brand & poziționare

```
═════════════════════════════════════════════════════════════
                      CompliScan
   Operating System pentru cabinete de privacy compliance
═════════════════════════════════════════════════════════════
```

| Atribut | Valoare |
|---|---|
| **Nume** | CompliScan (drop CompliAI complet) |
| **Tagline** | "Gestionezi 50 de clienți DPO ca pe 1. Brand-ul tău. Munca ta. Tool-ul nostru." |
| **Categoria** | Privacy Operations Platform pentru DPO/GDPR/NIS2 |
| **Localizare** | Romania-native, EU-aligned |
| **Limbă** | Română nativă (zero translate-style) |
| **Disclaimer** | "Drafturi pregătite pentru validarea expertului tău CIPP/E" (nu "verifică cu specialist") |
| **Domain** | compliscan.ro |
| **Email** | hello@compliscan.ro / dpo@compliscan.ro |

### De ce CompliScan, nu CompliAI

- "Scan" sugerează detect risk → exact ce face un DPO
- AI e featured în spate, nu în brand (evită panică pe reglementări AI Act)
- Diferențiere clară de "GDPR consultanță tradițională"
- SEO friendly pentru "compliance scan", "GDPR audit", "NIS2 readiness"

---

## 2. Cele 3 personas

### Diana — DPO Consultant (Primary buyer v1)

```
┌───────────────────────────────────────────────────────────┐
│ DIANA — DPO Consultant                                    │
├───────────────────────────────────────────────────────────┤
│ • Cabinet boutique GDPR/privacy/cybersec                  │
│ • 20-80 clienți IMM recurenți                             │
│ • Echipă 2-10 specialiști (jurist + IT + auditor)         │
│ • Abonament la client: €100-250/lună                      │
│ • Folosește acum: Excel + Word + Google Drive + email     │
│ • Vrea: portal multi-client cu brand-ul ei                │
│ • Plătește: €249-499/lună pentru CompliScan               │
│                                                           │
│ EXEMPLE REALE RO:                                         │
│ • DPO Data Protection                                     │
│ • WestGDPR                                                │
│ • Decalex                                                 │
│ • DPO Consulting                                          │
│ • Sectio Aurea (mai mult cybersec)                        │
│ • Privacy Manager (concurent direct local)                │
└───────────────────────────────────────────────────────────┘
```

**Sweet spot ICP**: 20-80 clienți. NOT freelanceri solo (<10), NOT enterprise 300+ (au deja platforme proprii).

### Mihai — Patron SRL (User secundar, NU plătitor direct)

```
┌───────────────────────────────────────────────────────────┐
│ MIHAI — Patron SRL                                        │
├───────────────────────────────────────────────────────────┤
│ • Patron firmă mică/medie cu DPO outsourced la Diana      │
│ • NU folosește CompliScan ca aplicație                    │
│ • Primește:                                               │
│   - Trust profile public (brand cabinet)                  │
│   - Magic links pentru aprobări (brand cabinet)           │
│   - Rapoarte lunare (brand cabinet)                       │
│   - Confirmare DSAR/breach notifications                  │
│ • TOATE brand-uite cu logo-ul cabinetului Diana           │
│ • NU știe că CompliScan există                            │
│ • Plătește: nimic (Diana plătește, include în serviciu)   │
└───────────────────────────────────────────────────────────┘
```

### Radu — Compliance Officer Intern (Tertiary, niche)

```
┌───────────────────────────────────────────────────────────┐
│ RADU — Compliance Officer Intern                          │
├───────────────────────────────────────────────────────────┤
│ • Compliance officer într-o firmă (fintech/healthcare)    │
│ • Single workspace mode (nu portfolio)                    │
│ • Discipline surfaces activate:                           │
│   - Approvals queue                                       │
│   - Review cycles                                         │
│   - Audit log                                             │
│   - Agent orchestrator                                    │
│ • Plan Studio: €499-1.499/lună (companie plătește direct) │
│ • Segment: bănci RO (<10), fintech-uri (~50), healthcare  │
│   privat (~100), mari corporații (~50-100 firme cu DPO)   │
└───────────────────────────────────────────────────────────┘
```

---

## 3. Arhitectura "2 produse în 1 cod"

```
                  ┌─────────────────────────────┐
                  │   compliscan.ro (landing)   │
                  └──────────────┬──────────────┘
                                 │
                  ┌──────────────▼──────────────┐
                  │   ONBOARDING — pas 1        │
                  │   "Cine ești?"              │
                  └──────────────┬──────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│   DPO OS       │      │   Fiscal OS    │      │   Internal     │
│   (PRIMARY)    │      │   (SECONDARY)  │      │   Compliance   │
├────────────────┤      ├────────────────┤      ├────────────────┤
│ DPO firm       │      │ Cabinet        │      │ Compliance     │
│ 20-80 clienți  │      │ contabil       │      │ officer        │
│                │      │ CECCAR         │      │ intern         │
├────────────────┤      ├────────────────┤      ├────────────────┤
│ Workspace:     │      │ Workspace:     │      │ Workspace:     │
│ Portfolio mode │      │ Portfolio mode │      │ Single org     │
│                │      │                │      │                │
│ Module active: │      │ Module active: │      │ Module active: │
│ ✓ GDPR         │      │ ✓ e-Factura    │      │ ✓ GDPR         │
│ ✓ NIS2         │      │ ✓ ANAF SPV     │      │ ✓ NIS2 (opt)   │
│ ✓ AI Act       │      │ ✓ SAF-T        │      │ ✓ AI Act (opt) │
│ ✓ DSAR         │      │ ✓ Discrepancies│      │ ✓ Approvals    │
│ ✓ ROPA         │      │ ✓ Filing log   │      │ ✓ Review cycles│
│ ✓ Whistleblow  │      │ ✓ Signal log   │      │ ✓ Agents       │
│ ✓ Pay Transp.  │      │                │      │ ✓ Audit log    │
│ ✓ Vendor mgmt  │      │ ✗ GDPR (off)   │      │                │
│ ✓ DORA (fin)   │      │ ✗ NIS2 (off)   │      │                │
│                │      │ ✗ AI Act (off) │      │                │
├────────────────┤      ├────────────────┤      ├────────────────┤
│ €99-€999/lună  │      │ €49-€299/lună  │      │ €499-€1.499/lună│
└────────────────┘      └────────────────┘      └────────────────┘
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
                  ┌──────────────▼──────────────┐
                  │  KERNEL COMUN (intact)      │
                  │  • Multi-tenant per-org     │
                  │  • Finding lifecycle        │
                  │  • Evidence engine          │
                  │  • White-label arhitectural │
                  │  • Audit trail              │
                  │  • V3 design system         │
                  │  • Claude Sonnet 4.6 AI     │
                  │  • Gemini OCR/Vision        │
                  │  • Mistral EU optional      │
                  └─────────────────────────────┘
```

### Strategia de lansare

| Produs | Status v1 | Notes |
|---|---|---|
| **DPO OS** | ✅ Primary launch (Q3 2026) | Marketing focus, pricing pe site, sales motion |
| **Fiscal OS** | ⏸️ Hibernate code, decide Q4 2026 | Cod păstrat, ascuns marketing, post-launch DPO OS decizie |
| **Internal Compliance** | ✅ Sub-mode DPO OS (single workspace) | Acelasi cod, plan Studio dedicat |

---

## 4. Tour cap-coadă DPO OS

### 4.1 Landing — `compliscan.ro`

```
┌────────────────────────────────────────────────────────────┐
│ CompliScan                  [Pricing] [Login] [Demo →]     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│   Operating System pentru cabinete                         │
│   de privacy compliance.                                   │
│                                                            │
│   GDPR · NIS2 · AI Act · DSAR · DPIA — toate clienții      │
│   tăi într-un singur portal cu brand-ul cabinetului.       │
│                                                            │
│   [Cere demo cu echipa →]    [Vezi cum funcționează]       │
│                                                            │
│   ┌─── Mock dashboard cu portofoliu real ───┐             │
│   │ 47 clienți · 3 critice · 12 în lucru    │             │
│   │ [Diana DPO Complet]                     │             │
│   └─────────────────────────────────────────┘             │
│                                                            │
│   ─────────────────────────────────────────────────────    │
│   "Gestionez 50 clienți GDPR. Excel + Word ne-ar fi        │
│    omorât. CompliScan ne-a salvat business-ul."            │
│                — Cristina, DPO Data Protection             │
│   ─────────────────────────────────────────────────────    │
└────────────────────────────────────────────────────────────┘
```

**CTA primar**: "Cere demo cu echipa" (nu "Creează cont gratuit"). DPO firms cumpără pe demo, nu pe self-signup.

### 4.2 Onboarding (Diana DPO consultant)

**Pas 1/3: Cine ești?**
```
  ┌──────────────────────────────────────────┐
  │ ◉ Cabinet GDPR / privacy / cybersec      │ ← Diana selectează
  │ ◯ Cabinet contabilitate CECCAR           │
  │ ◯ Companie cu DPO intern                 │
  └──────────────────────────────────────────┘
```

**Pas 2/3: Brand cabinet**
```
  ┌──────────────────────────────────────────┐
  │ Logo:        [📤 Upload]                  │
  │ Denumire:    DPO Complet SRL              │
  │ Culoare:     [#3B82F6]                    │
  │ Email:       contact@dpocomplet.ro        │
  │ Semnătură:   Diana Popescu, DPO certificat│
  │              CIPP/E #12345                │
  └──────────────────────────────────────────┘
```

**Pas 3/3: Trial 14 zile Pro (fără card)**
→ Aterizare directă pe `/portfolio`

### 4.3 Dashboard portfolio Diana — `/portfolio`

```
┌────────────────────────────────────────────────────────────┐
│ DPO Complet · Diana Popescu          [+ Adaugă client]     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│   PORTOFOLIU TRIAJ                                         │
│   47 clienți · 3 critice · 12 în lucru · 32 OK             │
│                                                            │
│   [Toate] [Critice 3] [DSAR active 5] [Renewal 7z]        │
│                                                            │
│   ┌─ Apex Logistic SRL ───────────── 🔴 CRITIC ─────────┐ │
│   │ • DPA Stripe expirat (5z)                          │ │
│   │ • Privacy Policy lipsă                             │ │
│   │ • RoPA neactualizat (3 luni)                       │ │
│   │ Score: 47/100  [Intră în execuție →]               │ │
│   └────────────────────────────────────────────────────┘ │
│                                                            │
│   ┌─ Lumen Energy SRL ──────────── 🟡 ACTIV ─────────────┐│
│   │ • DSAR cerere primită (deadline 14z)               │ │
│   │ Score: 78/100  [Intră în execuție →]               │ │
│   └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 4.4 Workspace Banner (când Diana intră în client)

```
┌────────────────────────────────────────────────────────────┐
│ 🟦 Lucrezi pentru Apex Logistic SRL — ca DPO Complet  [↩] │
├────────────────────────────────────────────────────────────┤
│ [Acasă] [Scanează] [De rezolvat 12] [Dosar] [Setări]      │
└────────────────────────────────────────────────────────────┘
```

### 4.5 Cockpit finding — `/dashboard/resolve/gdpr-001`

```
┌────────────────────────────────────────────────────────────┐
│ Apex Logistic / De rezolvat / GDPR-001                     │
│ ● CRITIC · GDPR · documentary · SLA 47h rămas              │
│                                                            │
│ Lipsă politică de confidențialitate publică                │
│                                                            │
│ Detectat azi 07:14 · scan site apex.ro · GDPR Art. 13     │
│                                                            │
│ ━━━ STEPPER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  ✓ Analiză legală  ✓ Draft AI  ✓ Adaptare client          │
│  ④ Review Diana  ⑤ Trimite client  ⑥ Verifică publicare    │
│                                                            │
│ ┌─ Bază legală ──┐ ┌─ Draft v0.3 ──┐ ┌─ Evidențe scan ─┐  │
│ │ GDPR art. 13   │ │ "1. Cine     │ │ Screenshot       │  │
│ │ Operatorul are │ │  suntem..."  │ │ apex.ro/footer   │  │
│ │ obligația să   │ │ [editor]     │ │ Wayback 2024-09  │  │
│ │ informeze...   │ │ 23 modificări│ │ Istoric: 5 stări │  │
│ └────────────────┘ └──────────────┘ └──────────────────┘  │
│                                                            │
│ [Snooze 48h] [Deleagă la client] [Marchează rezolvat ✓]   │
└────────────────────────────────────────────────────────────┘
```

### 4.6 Dosar Apex — `/dashboard/dosar`

```
┌────────────────────────────────────────────────────────────┐
│ Apex Logistic — Dosar de conformitate                      │
│                                                            │
│ [Overview] [Dovezi 73] [Pachete 12] [Trasabilitate]       │
│                                                            │
│ TRIMISE LA CLIENT (14)                                     │
│ ✓ Privacy Policy v0.3       — aprobat de Mihai 23.04      │
│ ✓ DPA Stripe v4.1            — semnat 24.04               │
│ ✓ ROPA actualizat            — în review                  │
│                                                            │
│ [Generează raport lunar]  [Trimite pachet renewal]         │
└────────────────────────────────────────────────────────────┘
```

### 4.7 Trust Profile public — `/trust/apex-logistic`

Ce vede Mihai (patron) când Diana îi trimite linkul:

```
┌────────────────────────────────────────────────────────────┐
│ DPO Complet                       [logo cabinet Diana]     │
│                                                            │
│   APEX LOGISTIC SRL                                        │
│   Profil public de conformitate                            │
│                                                            │
│   Score 87/100   GDPR ✓   NIS2 N/A   AI Act ✓             │
│                                                            │
│   Documentație validată de Diana Popescu, CIPP/E           │
│   Ultima actualizare: 24 aprilie 2026                      │
└────────────────────────────────────────────────────────────┘
```

**Critical**: zero mențiune CompliScan. Mihai vede doar brand-ul cabinetului Diana.

---

## 5. Pricing FINAL

```
┌──────────────────────────────────────────────────────────┐
│ DPO OS pricing                                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Solo DPO              €99/lună    < 20 clienți          │
│    • 1 user                                              │
│    • Brand cabinet basic                                 │
│    • Lifecycle GDPR + DSAR                               │
│    • Magic links pentru patroni (limitate)               │
│                                                          │
│  Growth boutique       €249/lună   20-50 clienți    ⭐   │
│    • 3 users + 1 GuestAuditor                            │
│    • Full white-label                                    │
│    • + NIS2 + Pay Transparency                           │
│    • Magic links unlimited                               │
│    • Audit Pack lunar                                    │
│                                                          │
│  Pro firm              €499/lună   50-150 clienți        │
│    • 10 users                                            │
│    • + AI Act + DORA                                     │
│    • Monitoring suite                                    │
│    • Console access                                      │
│    • Priority support                                    │
│    • API access                                          │
│                                                          │
│  Studio                €999/lună   150+ clienți          │
│    • Unlimited users                                     │
│    • Custom integrations                                 │
│    • SLA 99.9%                                           │
│    • Dedicated CSM                                       │
│    • White-label complet (incl. domain custom)           │
│                                                          │
│  Enterprise            quote       enterprise/custom     │
│    • Multi-region (CEE expansion)                        │
│    • SSO/SAML                                            │
│    • Audit Q&A direct                                    │
└──────────────────────────────────────────────────────────┘

Trial:        14 zile Growth gratuit, fără card
Pricing add:  +€100/lună pentru Mistral EU sovereignty
              +€50/lună pentru fiecare 25 clienți peste limită
```

### Math validation pentru ICP sweet spot

```
Growth tier (€249/lună), DPO firm cu 30 clienți:
  Revenue cabinet: 30 × €120/lună markup = €3.600/lună
  CompliScan cost: €249/lună = 7% din revenue
  ROI: BRUTAL — un singur client salvat din churn = 50x payback
```

---

## 6. Differentiators vs concurenți

```
                    audatis    Dastra   Privacy    Excel +   CompliScan
                    (DE)       (FR)     Manager    Word RO   ⭐
                                        (RO)
─────────────────────────────────────────────────────────────────────
RO native           ❌         ❌       ⚠️         N/A       ✅
ANSPDCP forms       ❌         ❌       ✅         ❌         ✅
DNSC OUG 155        ❌         ❌       ❌         ❌         ✅
ANAF SPV            ❌         ❌       ❌         ❌         ✅
e-Factura UBL       ❌         ❌       ❌         ❌         ✅
Multi-framework     ✅         ✅       ❌         ❌         ✅
Multi-tenant DPO    ✅         ✅       ❌         ❌         ✅
White-label         ✅         ⚠️       ❌         N/A        ✅
RoPA generator      ✅         ✅       ✅         ❌         ✅
DSAR automation     ✅         ✅       ⚠️         ❌         ✅
AI Act ready        ⚠️         ⚠️       ❌         ❌         ✅
NIS2 ready          ⚠️         ❌       ❌         ❌         ✅
Pricing entry       €500+      €600+    n/a        €0         €99
Pricing enterprise  €1500+     €2000+   n/a        n/a        €999
EU sovereignty AI   ❌         ⚠️       N/A        N/A        ✅ (opt)
RO language native  ❌         ❌       ✅         ✅         ✅
```

### Strategie vs jucători EU (audatis, Dastra, DPOrganizer→DataGuard)

**Nu îi bați frontal. Bați prin:**

1. **România-native pe integrări locale** (au de unde nu pot intra)
   - ANSPDCP forms native română
   - DNSC OUG 155/2024
   - ANAF SPV OAuth
   - Monitorul Oficial monitor

2. **Pricing accesibil** (5-10x mai ieftin)
   - audatis: estimat €500-1.500/lună
   - CompliScan: €99-999/lună
   - Pentru DPO firm RO mid-market = accesibil vs prohibitiv

3. **White-label arhitectural**
   - DPO devine canal de distribuție pentru tine
   - Lock-in cu clientul prin tool brand-uit

4. **Vertical RO specific** (Q3 2027+)
   - Healthcare RO (4.000 clinici)
   - Fintech RO (BNR + DORA + GDPR combo)
   - Public sector RO (3.180 primării obligate DPO)

5. **Comunitate locală**
   - IAPP RO Chapter outreach
   - Newsletter săptămânal cu schimbări legislative
   - Slack DPO RO privat
   - Conferință anuală DPO România (model IAPP)

### Outcomes posibile în 3-5 ani

| Outcome | Probabilitate | Action |
|---|---|---|
| Achiziție de jucător EU (€5-20M) | Mediu | Exit natural |
| Expansion CEE (lider regional) | Mediu | Funding round, hire AE |
| Profitable RO standalone | Mare | Bootstrap continuu |

---

## 7. Liability & legal positioning

### Modelul legal

```
┌─────────────────────────────────────────────────┐
│ CompliScan = TOOL                               │
│   • Generează drafturi                          │
│   • Detectează signals                          │
│   • Calculează applicability                    │
│   • NU dă verdict juridic                       │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ DPO consultant = VALIDATOR                      │
│   • Are CIPP/E (training jurat)                 │
│   • Aprobă/respinge draft                       │
│   • Își asumă liability prin signatură          │
│   • Asigurarea lui PII Insurance acoperă        │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ Client patron = SEMNATAR                        │
│   • Primește document validat de DPO            │
│   • Asumă răspundere ca operator de date        │
└─────────────────────────────────────────────────┘
```

### Disclaimer reframe

| Înainte | După |
|---|---|
| ❌ "Verifică cu specialist înainte de orice raport oficial" | ✅ "Drafturi pregătite pentru validarea expertului tău CIPP/E" |
| Suna ca "tool-ul nostru nu e de încredere" | Suna ca "tu ești expertul, noi îți multiplicăm eficiența" |

### T&C critical clauses

- "No warranty on AI-generated output"
- "User responsible for professional review"
- "Limitation of liability cap = 12 luni subscription"
- "Indemnification by user for misuse"

### Insurance roadmap

- **0-50 clienți**: T&C + disclaimer = sufficient
- **50+ clienți**: Look pentru insurance partner (Lloyds, Munich Re EU SaaS)
- **Enterprise sales**: PII insurance €500K-2M obligatoriu (Fortune 500 cere)

---

## 8. AI engine strategy

### Multi-model abstraction

```typescript
// lib/ai/provider.ts

interface AIProvider {
  generate(prompt: string, opts: GenOpts): Promise<string>
  ocr(file: File): Promise<string>
  extract(text: string, schema: Schema): Promise<JSON>
}

const providers = {
  claude: new ClaudeProvider({ model: "claude-sonnet-4-6" }),
  claudeOpus: new ClaudeProvider({ model: "claude-opus-4" }),
  gemini: new GeminiProvider({ model: "gemini-2.5-pro" }),
  mistral: new MistralProvider({ model: "mistral-large-2" }),
}
```

### Per-task routing

```
┌────────────────────────────────────────────────────────────┐
│ TASK                          │ MODEL ALES                 │
├───────────────────────────────┼────────────────────────────┤
│ Document drafting (DPA, PP)   │ Claude Sonnet 4.6 ★        │
│ Complex compliance (NIS2)     │ Claude Opus 4 (premium)    │
│ Quick review/scan results     │ Claude Sonnet 4.6          │
│ OCR / PDF extraction          │ Gemini 2.5 Pro (păstrăm)   │
│ Structured forms (JSON)       │ Claude Sonnet 4.6          │
│ EU sovereignty option         │ Mistral Large 2 (toggle)   │
└────────────────────────────────────────────────────────────┘
```

### De ce Claude Sonnet 4.6 ca primary

| Capabilitate | Gemini 1.5/2.0 | Claude Sonnet 4.6 |
|---|---|---|
| Romanian fluency | OK (translate-style) | **Foarte bună** (native-like) |
| Citare lege precisă | Hallucinate articole | **Citează exact GDPR Art. + paragraf** |
| Structură document juridic | Generică | **Mimic perfect template juridic RO** |
| Reasoning multi-step | Slab pe compliance flow | **Excellent — chain of thought** |
| Refuz inteligent | Suprafață | **Refuz contextual + alternative** |
| Cost/M output | $0.30 | $15 (50x mai scump, dar 10x mai bun) |

**ROI calc**: la €499/lună per cabinet, 1000 docs generated/lună × $0.05 cost diff = $50/lună cost crescut. **DPO valida în 5 min în loc de 30 min** = retention dramatic mai bun.

### Mistral EU sovereignty option

Pentru DPO firms din banking/healthcare RO care cer:
> "Datele clienților noștri nu pleacă din UE prin AI calls."

Mistral Large 2 (France, GDPR by design) ca opțiune `+€100/lună`. Diferentiator vs audatis (US-based AI).

---

## 9. Roadmap până la launch

```
┌──── SĂPT 1-2 ────────── VALIDATION + S0 ────────────────┐
│                                                          │
│ Tu (founder):                                            │
│   • 5 telefoane DPO firms (DPO Data, WestGDPR,           │
│     Decalex, Privacy Manager, DPO Consulting)            │
│   • 1 conversație DataGuard                              │
│   • Decision gate: 5+ piloti acceptați?                  │
│                                                          │
│ Eu (Claude code):                                        │
│   • Brand sweep CompliAI → CompliScan (57 fișiere)       │
│   • Disclaimer reframe global                            │
│   • S0 Spine Integrity (10 patches bug fix)              │
│   • AI provider abstraction (pregătire Sonnet 4.6)       │
└──────────────────────────────────────────────────────────┘

┌──── SĂPT 3-6 ────────── S1 SHELL/NAV/ROUTING ───────────┐
│                                                          │
│ • V3 design foundation (DONE deja)                       │
│ • Workspace banner persistent                            │
│ • Nav multi-mode (5 moduri)                              │
│ • Onboarding pas 1 = "Cine ești?"                        │
│ • Redirect middleware (kill 22 rute legacy)              │
│ • Specialist modules out of nav primary                  │
│ • Settings consolidat                                    │
│ • Pricing rebuild la €99-999                             │
│                                                          │
│ Tu paralel: 5 piloti gratuit cu 5 firme/each             │
└──────────────────────────────────────────────────────────┘

┌──── SĂPT 7-9 ────────── S2 DOSAR/MONITORING ────────────┐
│                                                          │
│ • Dosar unified (4 tabs)                                 │
│ • Monitoring suite (alerte/approvals/agents)             │
│ • Specialist tools dual-mode                             │
│ • NIS2 suite shell comun                                 │
│ • Console index pentru Radu                              │
│ • Generator inline only (kill standalone)                │
│ • AI engine: Claude Sonnet 4.6 primary live              │
└──────────────────────────────────────────────────────────┘

┌──── SĂPT 10-11 ───────── S3 PARTNER GTM ────────────────┐
│                                                          │
│ • Brand capture complet                                  │
│ • Export pipeline brand-aware                            │
│ • Shared token page (patron-facing)                      │
│ • Guest Auditor cu watermark + manifest                  │
│ • Paywall modal contextual                               │
│ • Deep-link emails                                       │
│ • Applicability edit retroactiv                          │
│ • Mistral EU optional                                    │
└──────────────────────────────────────────────────────────┘

┌──── SĂPT 12 ──────────── S4 POLISH + LAUNCH ────────────┐
│                                                          │
│ • Reopen UX                                              │
│ • Empty states + copy cleanup                            │
│ • Viewer rol read-only                                   │
│ • Legacy code removal                                    │
│ • QA Diana/Mihai/Radu/Viewer cap-coadă                   │
│ • Public launch                                          │
└──────────────────────────────────────────────────────────┘

      ▼ SĂPT 13+: PRIMA VÂNZARE PLĂTITĂ ▼

┌──── LUNA 4-6 ──────── POST-LAUNCH AMPLIFICARE ──────────┐
│                                                          │
│ • Sandbox demo mode                                      │
│ • Public DSAR portal                                     │
│ • Templates jurat-validate library (10 docs)             │
│ • Training modules (5-10 cursuri)                        │
│ • IAPP RO Chapter outreach                               │
│ • Webinar lunar cu DPO experts                           │
│ • CRM intern DPO                                         │
│ • Cookie consent module                                  │
│ • Insurance partner Lloyds (după 50+ clienți)            │
│                                                          │
│ Target: 30 cabinete plătitoare, €15K MRR                 │
└──────────────────────────────────────────────────────────┘
```

---

## 10. Definiția "v1 launched"

CompliScan = launched v1 când:

```
✓ Landing public la compliscan.ro cu mesaj DPO clar
✓ Onboarding pas 1 funcțional (3 trasee)
✓ DPO firm poate adăuga 50 clienți și gestiona findings
✓ Cabinet brand pe toate output-urile client-facing
✓ Magic links pentru patroni funcționează
✓ Dosar unified, Monitoring suite live
✓ AI engine = Claude Sonnet 4.6 + Gemini OCR
✓ Pricing tiers active (Stripe)
✓ Free trial 14 zile
✓ 5+ DPO firms beta-tester (gratuit)
✓ 3+ DPO firms cu pilot semnat (€249-499/lună)
✓ Disclaimer "validare CIPP/E" în loc de "verifică cu specialist"
✓ Brand: CompliScan peste tot (zero CompliAI)
✓ Documentat: T&C, Privacy Policy, DPA, Trust Center
```

---

## 11. Targets financiare

### Year 1 (2026 Q3 - 2027 Q2)

| Milestone | Target | MRR cumulativ |
|---|---|---|
| Săpt 12 (launch) | 3 cabinete plătitoare | €1.5K MRR |
| Luna 6 | 15 cabinete | €5K MRR |
| Luna 9 | 30 cabinete | €10-15K MRR |
| Luna 12 | 50 cabinete | €20-30K MRR |
| **Year 1 ARR** | | **€240-360K ARR** |

### Year 2 (2027 Q3 - 2028 Q2)

| Milestone | Target | MRR cumulativ |
|---|---|---|
| Luna 18 | 100 cabinete | €50-70K MRR |
| Luna 24 | 200 cabinete | €100-150K MRR |
| **Year 2 ARR** | | **€1.2-1.8M ARR** |

### Year 3+ (2028+)

- Decision gate: continue RO standalone OR expand CEE OR exit
- Țintă: €3-5M ARR la sfârșit de Year 3
- Plafon teoretic RO standalone: €7-15M ARR
- Plafon teoretic cu CEE expansion: €40-80M ARR

---

## 12. Anexe

### 12.1 Lista 10 firme DPO RO de contactat (săpt 1)

| Firmă | Contact | Tip | Prioritate |
|---|---|---|---|
| GDPR Complet | contact@gdprcomplet.ro / 0745 258 676 | Mature, 800 clienți | Intel-only |
| LegalUp | Ana-Maria Udriste (LinkedIn) | Avocatură GDPR, 400 firme | Intel-only |
| DPO Data Protection | site form | Boutique | ⭐ Pilot target |
| WestGDPR | site form | Boutique | ⭐ Pilot target |
| DPO Consulting | site form | Boutique | ⭐ Pilot target |
| Intercris | site form | Boutique "pay-when-needed" | ⭐ Pilot target |
| Privacy Manager | privacymanager.ro | Concurent local | ⭐ Intel + partnership |
| Sectio Aurea | Mădălin Bratu (LinkedIn) | Cybersec/CISO | Cross-sell potential |
| HIFENCE | site blog | NIS2 implementation | Cross-sell potential |
| Decalex | combo GDPR + NIS2 | Boutique | ⭐ Pilot target |

### 12.2 Întrebări critice de validare (săpt 1-2)

Pentru fiecare conversație de 30 min:

1. **Câți clienți DPO activi gestionați lunar și câți sunt doar pe mentenanță?**
2. **Ce tool folosiți acum — Excel + Word + foldere, sau platformă specializată?**
3. **Care e cel mai mare blocaj operațional cu volumul ăsta?**
4. **La €299/lună pentru tool multi-client cu white-label, ați folosi?**
5. **Plătiți voi sau revindeți clientului ca serviciu?** (Path A vs B)
6. **Cum descoperiți tools noi — IAPP, LinkedIn, recomandări, conferințe?**
7. **Vreți pilot 30 zile gratuit cu 5 firme reale?**

### 12.3 Lista 22 rute legacy de eliminat

Per IA-UX-PROPUNERE Sec 5:

```
RO/EN duplicates:
  /dashboard/scanari → /dashboard/scan
  /dashboard/setari → /dashboard/settings
  /dashboard/setari/abonament → /dashboard/settings/abonament
  /dashboard/rapoarte → /dashboard/dosar
  /dashboard/documente → /dashboard/dosar

Output legacy:
  /dashboard/reports/* → /dashboard/dosar?tab=*
  /dashboard/audit-log → /dashboard/dosar?tab=trasabilitate
  /dashboard/rapoarte/auditor-vault → /dashboard/dosar?tab=pachete
  /dashboard/rapoarte/trust-profile → /dashboard/dosar?tab=pachete

Zombie execution:
  /dashboard/findings → /dashboard/resolve
  /dashboard/checklists → /dashboard/resolve
  /dashboard/generator → /dashboard/resolve (inline cockpit)
  /dashboard/ropa → /dashboard/resolve?framework=gdpr&type=ropa
  /dashboard/politici → /dashboard/dosar?tab=dovezi
  /dashboard/conformitate → /dashboard/sisteme

Monitoring legacy:
  /dashboard/approvals → /dashboard/monitoring/approvals
  /dashboard/review → /dashboard/monitoring/alerte?filter=review
  /dashboard/calendar → /dashboard/monitoring
  /dashboard/agents → /dashboard/monitoring/agents

Partner bridge:
  /dashboard/partner → /portfolio
  /dashboard/partner/[orgId] → /portfolio/client/[orgId]

Onboarding finish:
  /onboarding/finish → resolveOnboardingDestination()
```

### 12.4 Cele 15 principii IA-UX (referință rapidă)

1. **P1** — Diana e baseline, Mihai și Radu sunt cazuri degenerate
2. **P2** — Firmă activă e primitivă persistentă, nu cookie ascuns
3. **P3** — Un finding = un cockpit = un singur loc de execuție
4. **P4** — Cockpit class-aware, nu flat
5. **P5** — Triaj cross-client permis, execuție cross-client interzis
6. **P6** — Output unificat la Dosar
7. **P7** — Specialist modules sunt unelte ale cockpitului
8. **P8** — Monitorizarea e parte din spine, nu decor
9. **P9** — White-label arhitectural: brand-ul cabinetului e default
10. **P10** — Patronul e destinatar, nu user
11. **P11** — Plan gating topologic — discret hide, cuantitativ paywall
12. **P12** — Rute canonice unice
13. **P13** — Nav-ul expune spine-ul, multi-modal după rol + plan
14. **P14** — Onboarding liniar cu pași observabili, applicability editabilă retroactiv
15. **P15** — Orchestrator, nu avocat

### 12.5 Documente conexe

| Document | Status | Update needed |
|---|---|---|
| `docs/IA-UX-PROPUNERE (1).md` | Canonical | 1-2 linii update Diana persona (contabil → DPO consultant) |
| `docs/IA-UX-IMPLEMENTATION-MATRIX.md` | Canonical | Niciun update — sprint plan agnostic pe ICP |
| `docs/IA-UX-ROUTE-PARITY-ADDENDUM.md` | Canonical | Niciun update — rute agnostice pe ICP |
| `docs/strategy/market-research-2026-04-26.md` | Canonical | Update mental: ICP DPO firms (nu cabinete contabile) |
| `docs/strategy/compliscan-v1-final-spec-2026-04-26.md` | **THIS DOCUMENT** | Sursa unică de adevăr pentru produs v1 |

---

## Single line decizie

> **CompliScan v1 = Operating System pentru cabinete de privacy compliance. ICP: DPO firms boutique 20-80 clienți. Pricing: €99-999/lună. AI: Claude Sonnet 4.6. Brand: zero CompliAI. Disclaimer: validare CIPP/E. Launch: săpt 12. Year 1 target: €240-360K ARR. Year 3 target: €3-5M ARR.**

---

**Document creat**: 26 aprilie 2026
**Bazat pe**: 25 puncte critică + 4 agenți research piață + analiza GPT-5.5 + 3 docs IA-UX existente + research DPO competiție + research liability/AI engine
**Următoarea revizuire**: după 5 conversații DPO firms (decision gate săpt 2)
**Status**: canonical reference — sursa unică de adevăr pentru produs v1
