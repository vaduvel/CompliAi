# FiscCopilot — Product Spec V1
**Data:** 2026-05-15
**Status:** Working draft (single source of truth)
**Owner:** Vaduva Daniel

---

## 🎯 Viziune

**"Claude Code pentru fiscal RO."** Un agent AI local care:
- Cunoaște Codul Fiscal RO actualizat
- Vede portofoliul de clienți al cabinetului
- Verifică determinist eligibilități (micro, TVA încasare, ANC, etc.)
- Răspunde în română structurat cu pași concreti + bază legală
- Rulează 100% local pe PC-ul user-ului (privacy first)

**Public:** cabinete contabile RO (5-50 clienți) + contabili interni + antreprenori solo.

---

## 🏗 Arhitectură finală

```
┌─────────────────────────────────────────────────────┐
│  LAYER 5 — UI/UX (Tauri Desktop + Next.js)          │
│  Dashboard │ Alerts │ Wizard │ Forms │ Chat AI      │
├─────────────────────────────────────────────────────┤
│  LAYER 4 — AI (Gemma 3 4B prin llama.cpp embedded)  │
│  Verbalizare verdict deterministic în română        │
├─────────────────────────────────────────────────────┤
│  LAYER 3 — TEMPLATES & PROCEDURES                   │
│  D-uri pre-completate │ Monografii │ Proceduri pași │
├─────────────────────────────────────────────────────┤
│  LAYER 2 — RULES ENGINE (DETERMINISTIC)             │
│  7 Verifiers │ 6 Match Paths │ Calendar fiscal      │
├─────────────────────────────────────────────────────┤
│  LAYER 1 — DATA & CONNECTORS                        │
│  Portfolio │ SPV ANAF │ e-Factura │ ONRC public     │
│  SmartBill │ Oblio │ SAGA file import               │
└─────────────────────────────────────────────────────┘
```

**Cheie:** 75-80% deterministic + templates. AI doar pentru verbalizare + Q&A ad-hoc.

---

## 🧠 Model AI local

**DEFAULT: Gemma 3 4B Q4_K_M** (selectat după 5 modele testate)

| RAM PC | Model recomandat |
|---|---|
| 8 GB | Phi-3.5 mini 3.8B (3 GB RAM, RO mai slab) |
| **12-20 GB** | **Gemma 3 4B** ⭐ (4 GB RAM, RO excelent) |
| 20-32 GB | Gemma 3 12B (8 GB RAM, RO best) |
| 32+ GB | Gemma 4 e2b 5.1B (premium, multimodal) |

**Motiv default Gemma 3 4B:** ZERO halucinare math (cu verifier injectat) + română excelentă + fit pe 8-16 GB.

**Strategy:** verifier-ii (TypeScript pure) fac math + logica → LLM doar verbalizează → ZERO halucinație pe calcule.

---

## 📦 Stare cod existent (inventory)

### ✅ EXISTĂ COMPLET (~200K LOC, 1053 fișiere)
- Landing page (`app/page.tsx`)
- Login/Register (`/login`, `/register`)
- Onboarding (`/onboarding`, `/onboarding/setup-fiscal`, `/onboarding/finish`)
- Dashboard + 25 sub-pages
- Portfolio view (`/portfolio`, `/portfolio/client/[orgId]`)
- Calendar fiscal (`/dashboard/fiscal/calendar`)
- Fiscal copilot UI (`/fiscal-copilot`, `/demo/fiscal-copilot`)
- Pricing page
- SPV submission flow + ANAF integrations (12 files in lib/server/)
- e-Factura validator (UBL CIUS-RO)
- D100/D205/D300 parsers
- SAF-T (D406) parser + validator + hygiene
- SmartBill API client (REAL connector)
- Oblio API client (REAL connector)
- SAGA file importer (NU connector — SAGA fără API)
- Audit log + reports
- Trust center + audit pack
- Agent system (8 agents)
- Calculator amenzi ANAF
- PFA form 082 tracker
- Team management
- Billing infrastructure

### ⚠️ NEW BUILT (fiscal copilot pieces)
- Corpus fiscal: 2,800+ entries (Cod Fiscal 645 + Portal 1949 + legi-conexe 83 + seed + forum + SAGA Manual)
- 7 Verifiers deterministi (micro, TVA încasare, diurnă, ANC, cheltuieli sociale, plafon numerar, bonificație 3%)
- AI Expert orchestrator (RAG + Verifiers + Gemma + memory)
- Memory: episodic + semantic + procedural
- 6 Match Paths
- 9 Procedures
- Client Fiscal Extractor (bridge portfolio → verifiers)

### ❌ DE CONSTRUIT pentru BETA
- Tauri desktop shell (5 zile)
- llama.cpp sidecar + auto-download model (2-3 zile)
- First-run wizard (cu RAM detection + model selection) (1 zi)
- Wire UI cu noul auto-extract flow (2 zile)
- Polish landing + lead magnet PDF (3 zile)
- Bug fixes + testing (3 zile)

**Total muncă nouă: ~15-20 zile.**

---

## 🚀 User Flow cap-coadă

### 1. Landing page (`app.compliai-fiscal.ro`)
- Hero: "Contabilul tău AI personal. 100% local."
- Lead magnet PDF: "Ghid OUG 8/2026"
- CTA: Trial 14 zile
- Trust badges: 🔒 100% local, 🇷🇴 Cod Fiscal 2026

### 2. Signup + Onboarding 5 screens
- Cine ești? (cabinet / intern / solo)
- Câți clienți? (slider)
- Hardware check (RAM detection + model recommendation)
- Conectori (SPV ANAF / SmartBill / Oblio / Manual)
- Welcome + tour

### 3. Încărcare date

**Conectori live (sync automat):**
- 🔗 SPV ANAF (cert digital local) ← cel mai puternic
- 🔗 SmartBill (API key)
- 🔗 Oblio (API key)
- 🔗 e-Factura (prin SPV cert)

**Import fișiere (sync manual):**
- 📁 SAGA (export XML)
- 📁 SAF-T D406 (XML)
- 📁 Excel template

**Manual:**
- Form simplu: CIF → auto-completare ANAF webservices
- User completează 3 câmpuri (capital, salariați, asociați)

### 4. Analiză automată inițială
- Pentru fiecare firmă: Match Paths + Verifiers + Calendar fiscal
- Generare alerte
- 30s/firmă cu animație progres

### 5. Dashboard principal
- KPI bar (clienți / alerte urgente / deadline-uri / facturi noi)
- Alerte urgente + acțiuni rapide
- Portfolio cards (status colorat 🔴🟡🟢)
- Calendar fiscal upcoming
- Chat AI input

### 6. Client detail view
- Tabs: Overview, Profil, Financiar, Declarații, e-Factura, Calendar, Alerte, Conversații, Documente, Audit
- Acțiuni rapide: generează declarație, verifică eligibilitate, întreabă AI, trimite SPV

### 7. AI Chat (with verifier integration)
- User: "Pot face firma X în micro?"
- Auto-extract date X din portfolio
- Verifier rulează deterministic
- Gemma 3 4B verbalizează verdict în română
- Răspuns: verdict + lege + pași + acțiuni clickable

### 8. Declaration wizard (D205/D300/D101 etc.)
- Step 1: Date pre-fillate din portfolio + e-Factura
- Step 2: Validare automată
- Step 3: Submit ANAF (cu cert local) sau Download XML
- Step 4: Arhivare locală + marcat in calendar

### 9. Settings
- Profil + Cabinet + Conectori + Notificări + AI model + Backup + Export + Billing

---

## 🎨 Decizii tehnice cheie

### 1. **Tauri desktop > Web SaaS**
- Privacy 100% (date pe PC)
- RAM friendly (fără Chrome overhead)
- Zero CORS hell cu Ollama
- llama.cpp embedded → no Ollama dependency
- Single installer (.dmg/.exe/.AppImage)

### 2. **Gemma 3 4B > alte modele**
- RO excelentă (testat)
- ZERO halucinație cu verdict deterministic injectat
- 4 GB RAM (fit pe 8 GB systems)

### 3. **Verifiers deterministi > AI pentru calcul**
- Math + logica în TypeScript pur
- AI doar verbalizează
- Zero halucinație pe cifre / plafoane / praguri

### 4. **NU pivot la software contabilitate complet (v1)**
- Început ca Copilot Companion (alături de SAGA/WizCount)
- Extindere graduală spre features SAGA-like (luna 3-6)
- Replace SAGA = v3+ după validare beta

### 5. **SAGA = file import, NU connector**
- SAGA fără API → user exportă manual XML
- SmartBill + Oblio = REAL connectors cu API

### 6. **SPV = sursă primară date**
- 95% din ce contează vine din SPV
- ONRC scrape = nice-to-have v2 (capital social + asociați pentru cazuri specifice)

---

## 🚧 Roadmap concret (5 săpt la beta)

| Săpt | Focus | Output |
|---|---|---|
| **1** (curent) | Wire portfolio → verifiers ✅ + Gemma 3 4B ✅ + spec ✅ | E2E working pe local |
| **2** | UI polish chat + onboarding fiscal copilot focus | Beta UI ready |
| **3** | Tauri shell + llama.cpp embedded + auto-download | Desktop app working |
| **4** | SPV cert integration native + first-run wizard | App distributabil |
| **5** | Beta privat 5-10 contabili + bug fixes | Validare produs |

**Lansare publică: luna 2-3** (după iterare pe feedback).

---

## 📊 Conectori — ce DATE iau de unde

| Dată | SPV | e-Factura | SmartBill | Oblio | SAGA file | ONRC public |
|---|---|---|---|---|---|---|
| CUI / Denumire | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vector fiscal (micro/profit/TVA) | ✅ | — | — | — | — | — |
| Declarații depuse | ✅ | — | — | — | — | — |
| Datorii ANAF | ✅ | — | — | — | — | — |
| Notificări ANAF | ✅ | — | — | — | — | — |
| Facturi emise/primite | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Sume CA | calculat din facturi | calculat | ✅ | ✅ | ✅ | — |
| Status TVA | ✅ | — | — | — | — | ✅ |
| Asociați + cote | — | — | — | — | — | ✅ |
| Capital social | — | — | — | — | — | ✅ |

**Necesar pentru MVP:** SPV + ANAF Webservices public + Manual (suficient).
**Nice-to-have:** SmartBill + Oblio + SAGA + ONRC scrape.

---

## 💰 Pricing (după validare beta)

- **Starter:** 5 clienți — 79 RON/lună
- **Cabinet:** 25 clienți — 199 RON/lună
- **Pro:** 100 clienți — 499 RON/lună
- **Enterprise:** 100+ — custom
- **Trial:** 14 zile gratis, no credit card upfront

---

## 🌐 Deployment

### Web preview (acum)
- Project Vercel: `compliai-fiscal` (separat de main CompliAI)
- URL: https://compliai-fiscal.vercel.app
- Branch: `feat/fiscal-copilot-2026-05-14`
- Deploy: `vercel --prod` din worktree

**NOTE:** Pe Vercel, Gemma local NU rulează. Preview e pentru UI/flow testing. AI funcționează doar local.

### Production (Tauri)
- Distribuit ca installer per OS
- Auto-download model on first run
- 100% local execution

---

## 🔥 Ce am scăpat / TODO post-beta

- Multi-user (cabinete cu 3+ contabili) — v2
- Audit log pentru control fiscal — v2
- Backup encryption strategy — v2
- Mobile companion app — v3
- Pricing localization (TVA inclus, factură) — pre-launch
- ToS + Privacy policy (legal review) — pre-launch
- Support docs + FAQ — pre-launch
- Video demo 60s — pre-launch
- Brevo drip email campaign — pre-launch

---

## 📝 Decision Log

**2026-05-15:**
- Tauri desktop > Web SaaS (privacy + RAM friendly)
- Gemma 3 4B = default model (testat empiric)
- Verifiers deterministi + AI verbalize-only (zero halucinare math)
- SAGA = file import, NU API connector
- ONRC = v2 (nu MVP)
- Copilot Companion mode (NU replace SAGA în v1)
- Project Vercel `compliai-fiscal` separat de main = curat
