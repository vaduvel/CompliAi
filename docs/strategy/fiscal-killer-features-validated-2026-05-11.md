# Killer features fiscal validated 2026-05-11

Research GPT 5.5 (13 features) → validare independentă (6 surse) → top 5 picks
reali + stack 100% free pentru MVP.

## TOP 5 KILLER FEATURES (impact × ease × wow)

### 🥇 F#2 — Bank-SPV Reconciliation + Cash-flow forecast
**Pain:** contabilii pierd ore zilnic potrivind facturi cu plăți bancare.
**Wedge:** SmartBill/Saga/Oblio NU pot face — n-au acces bancar.
**Validat:** Rillet (US) 95%+ AI match rate confirmat pe rillet.com.
**Cost MVP:** **$0** (Nordigen FREE tier OR utilizator upload MT940/CAMT.053/CSV)
**Stack free:** `mt940-js` (MIT) + Nordigen Bank Account Data PSD2 free + fuzzy matching pure TS.
**Demo wow:** live 95% auto-match factură ↔ plată.

### 🥈 F#4 — Certificate SPV manager
**Pain:** "utilizator neautorizat" e #1 plângere pe SAGA forum; cazuri 17 zile delay.
**Wedge:** SmartBill oferă ghid textual, noi oferim monitoring + automated re-auth.
**Validat:** SAGA forum + SmartBill help + factureaza.ro confirmă pain.
**Cost MVP:** **$0** (avem `anaf-pending-actions` pattern).
**Stack:** Supabase pentru metadata + cron `cert-expiry-watcher` zilnic.
**Marketing hook:** "Niciun cabinet CompliScan nu mai stă fără SPV."

### 🥉 F#1 — Predictive Audit Risk Scoring
**Pain:** frica de control ANAF e emoția primară a contabilului.
**Wedge:** IRS rulează 126 AI apps cu Discriminant Function ML. ANAF face intern. Noi
oferim VIZIBILITATE către contabil — unic în RO.
**Validat:** ERPCA, OECD, IRS GAO findings (cu bias caveat).
**Cost MVP:** **$0** (rule-based scoring pure TS). Phase 2: Transformers.js / Brain.js FREE.
**Tier upgrade lever:** Studio €499 justificat doar de asta.
**Caveat legal:** explainability mandatory per CECCAR Art. 14; "informativ, nu garanție".

### 🏅 F#8 — OCR + Voice-to-Invoice
**Pain:** bonuri pe hârtie, facturi PDF prin email, mesaje WhatsApp.
**Wedge:** Dext face $1B+ global; NIMENI nu face RO-specific cu local processing.
**Validat:** Dext 31.4M docs ian 2026, 90%+ time reduction.
**Cost MVP:** **$0** (Tesseract.js + Ollama Gemma 4 multimodal local + Whisper.cpp).
**Stack free:** Tesseract.js (Apache 2.0) + Gemma 4 vision (already running) + Web Speech API.
**Demo wow:** foto bon → XML CIUS-RO validat în 3 secunde.

### 🎖️ F#5 — Auto-CPV/NC8 classification
**Pain:** B2G CPV obligatorii din 1 ian 2025 (OUG 138/2024); NC8 e-Transport mandator.
**Wedge:** programele de facturare au câmpuri libere; noi sugerăm.
**Validat:** OUG 138/2024 confirmă, InfoTVA + SmartBill help confirmă pain.
**Cost MVP:** **$0** (CPV dictionary public + Transformers.js gte-multilingual local).
**Stack free:** EU CPV XML (ted.europa.eu) + Hugging Face Transformers.js + cosine similarity pure TS.
**Lead magnet adițional:** `/cauta-cod-cpv` ca SEO tool.

## STACK 100% FREE + LEGAL

| Tool | Licență | Uz | Cost |
|---|---|---|---|
| Nordigen Bank Account Data | Their AIS license (BNR-aprobat), noi suntem agent | F#2 PSD2 read access | $0 free tier |
| mt940-js | MIT | F#2 parser extras bancar | $0 |
| Tesseract.js | Apache 2.0 | F#8 OCR | $0 |
| Ollama + Gemma 4 vision | Google Gemma License (commercial OK) | F#8 OCR local + F#1 explain | $0 |
| whisper.cpp | MIT | F#8 Voice | $0 |
| Web Speech API | Browser native | F#8 Voice fallback | $0 |
| Transformers.js | Apache 2.0 | F#5 embeddings + F#1 NLP | $0 |
| Brain.js | MIT | F#1 ML | $0 |
| EU CPV dictionary | Public regulation 2195/2002 | F#5 | $0 |
| WCO HS / NC8 | Public WCO | F#5 | $0 |

**Total infrastructure cost MVP: $0/lună** (peste ce avem deja: Vercel + Supabase + Gemini API).

## ORDINE BUILD (sprint plan)

| Sprint | Feature | Durată | Cost |
|---|---|---|---|
| 0 (acum) | Sidebar IA restructurare (Opțiunea A) | 2 zile | $0 |
| 1 | F#4 Certificate SPV manager | 1 săpt | $0 |
| 2 | F#5 Auto-CPV/NC8 + F#11 Anomaly repair AI | 1 săpt parallel | $0 |
| 3 | F#2 Bank-SPV Reconciliation (Nordigen + MT940) | 2 săpt | $0 |
| 4 | F#8 OCR + Voice (Tesseract + Gemma 4 + Web Speech) | 2 săpt | $0 |
| 5 | F#1 Predictive Risk Scoring (rules → ML) | 2 săpt | $0 |

**Total ~10 săptămâni** pentru toate 5 killer features la zero infrastructure cost.

## SKIPPED FROM RESEARCH (anti-killers)

- F#9 Workload planner — nice-to-have, low wow
- F#10 Cross-border VAT — extension F#13, nu killer nou
- F#12 Customer portal mobile — cabinetele NU vor portal pentru clienții lor (concurență cu propriul cabinet)
- F#13 Predictive e-Transport — depinde de F#6
- F#6 e-Transport GPS — killer dar **blocker parteneriat AROBS/TrackGPS** (luni)
- Blockchain ledger (outrageous bet) — over-engineered, distraction

## VALIDATION SOURCES

1. [Traficmedia — Prima amendă e-Transport 20K Covasna (16 feb 2026)](https://traficmedia.ro/nu-mai-e-suficient-sa-ai-doar-cod-uit-prima-amenda-e-transport-pentru-transportatori-20-000-lei/)
2. [Factureaza.ro — Acces denied după reînnoire certificat](https://factureaza.ro/ajutor/efactura-acces-denied-reinnoire-certificat-digital)
3. [Portal Codul Fiscal — CPV obligatorii B2G din 1 ian 2025](https://www.portalcodulfiscal.ro/noi-obligatii-privind-ro-e-factura-coduri-cpv-obligatorii-in-relatia-b2g-si-clarificari-privind-relatia-b2c-64334.htm)
4. [Rillet.com — 95%+ AI match rate](https://www.rillet.com/product/bank-reconciliation)
5. [CapTechU — IRS 126 AI apps + Discriminant Function](https://www.captechu.edu/blog/audited-algorithm-how-irs-using-ai-2026)
6. [CPA Practice Advisor — Dext 31.4M docs](https://www.cpapracticeadvisor.com/2026/03/23/dext-launches-ai-assist-to-automate-everyday-bookkeeping-decisions/180114/)
7. [Oversight — 0.1-1.5% duplicate payment rate](https://www.oversight.com/blog/duplicate-invoice-payments-avoid-cash-leakage-accounts-payable)
