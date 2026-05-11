# Fiscal Module Sprint Plan — Decizia finală 2026-05-11

**Status:** APROBAT pentru execuție.
**Total durată:** ~9 săptămâni (Sprint 0 → Sprint 7).
**Cost operațional nou:** $1-2/cabinet/lună (Gemini Vision OCR).
**Infrastructure cost:** $0/lună (toate restul free + locale).

## Context

După cercetarea GPT 5.5 (13 killer features propuse) + validare independentă pe 6+ surse 2026 (e-Transport Covasna fine, certificate SPV pain forum SAGA, CPV OUG 138/2024, Rillet 95% AI match, IRS Discriminant Function, Dext 31M docs), am decis 8 schimbări concrete:
- **5 features NOI** (BUILD)
- **3 EXTENSIONS** la cod existent
- **1 sidebar restructurare IA** (sprint 0, deja aprobat anterior)
- **6 features EXCLUSE** definitiv cu motiv

## ✅ DECIZII

### Sprint 0 — Sidebar IA fiscal restructurare
**Durată:** 2 zile
**Cost:** $0
**Status:** Aprobat anterior (Opțiunea A din UX discussion 2026-05-11).
**Conținut:** 10 tab-uri orizontale în `/dashboard/fiscal` → 5 secțiuni grupate în sidebar:

```
INSTRUMENTE FISCAL
├── 📊 Cockpit fiscal (overview KPI)
├── 🔍 Validare & emitere (Validator XML + Bulk ZIP + Semnale)
├── 📤 Transmitere & monitorizare (SPV + ANAF + Protocol)
├── 💰 TVA & declarații (Discrepanțe + P300 + Depuneri + SAF-T)
├── 🔌 Integrări (SmartBill / Oblio / Saga / ERP-SPV reconciler)
└── ⚠️ Deadline urgent (PFA Form 082 + Calendar)
```

### 🟢 Sprint 1 — F#4 Certificate SPV manager (BUILD)
**Durată:** 1 săpt
**Cost:** $0
**Pain validat:** SAGA forum, SmartBill help, factureaza.ro — "utilizator neautorizat" #1 plângere; cazuri 17 zile delay.
**Stack:** Supabase metadata + cron `cert-expiry-watcher` zilnic + pattern `anaf-pending-actions` existent.
**Acceptance criteria:**
- [ ] Dashboard cu starea certificatului per client (serie, expirare, ultima reînnoire)
- [ ] Alerts 30/14/7/3/1 zile înainte de expirare
- [ ] Detector eroare "utilizator neautorizat" + sugestii fix (verifică token, reautorizează SPV)
- [ ] Audit log completă cu acțiuni + răspuns ANAF
- [ ] Multi-tenant: status per client în portofoliu cabinet

### 🟢 Sprint 2 — F#5 Auto-CPV/NC8 + F#11 Anomaly repair AI (PARALLEL)

#### F#5 Auto-CPV/NC8 classifier (BUILD)
**Durată:** 1 săpt
**Cost:** $0
**Bază legală:** OUG 138/2024 (CPV obligatoriu B2G din 1 ian 2025) + NC8 e-Transport.
**Stack:** EU CPV dictionary public (ted.europa.eu XML) + Transformers.js `gte-multilingual-base` (Apache 2.0, ~100MB model) + cosine similarity pure TS.
**Bonus:** Lead magnet `/cauta-cod-cpv` ca SEO + outreach tool.
**Acceptance criteria:**
- [ ] Input: descriere articol → output: top 3 CPV codes cu score similarity
- [ ] Acceptă feedback (utilizatorul confirmă/respinge sugestii pentru learning)
- [ ] Wire în Validator XML + Bulk ZIP upload — pre-fill XML CIUS-RO cu CPV propus
- [ ] Update automat al dicționarului CPV via cron (lunar)
- [ ] Page publică `/cauta-cod-cpv` cu rate limit (lead magnet)

#### F#11 Anomaly repair AI explain (EXTEND)
**Durată:** 5 zile (parallel)
**Cost:** $0 (Gemini API existent, free tier 15RPM)
**Stack:** Extindem `efactura-xml-repair.ts` existent + Gemini API pentru explanation NL.
**Acceptance criteria:**
- [ ] Pentru fiecare cod eroare V001-V011 / T001-T0xx, AI generează explanation
  în română: "Codul X înseamnă Y, repară prin Z, conform OUG nnn art. m"
- [ ] Buton "Aplică fix automat" doar pentru erori safe-auto-fixable
- [ ] Memory: dacă utilizatorul a aprobat un fix la o eroare similară anterior,
  AI sugerează același fix proactiv (Dext AI Assist pattern)
- [ ] Audit log per intervenție AI

### 🟢 Sprint 3-4 — F#2 Bank-SPV Reconciliation (BUILD)
**Durată:** 2 săpt
**Cost:** $0 (Nordigen FREE tier + MT940 manual upload fallback)
**Pain validat:** Rillet 95% match rate confirmă piața există + work-load contabil cuantificat.
**Stack:**
- **Tier 1 (default)**: utilizator uploadează **MT940** (SWIFT standard) sau **CAMT.053** (ISO 20022) sau **CSV** — parser open source (`mt940-js` MIT, `camt-parser`)
- **Tier 2 (premium)**: integrare Nordigen Bank Account Data PSD2 — FREE tier, conectare directă la bancă (BCR, BRD, ING, Raiffeisen, BT)
- Motor matching: fuzzy match (CUI + sumă ± 0.01 + dată ± 3 zile + nume furnizor cosine similarity)
**Acceptance criteria:**
- [ ] Upload MT940/CAMT.053/CSV — parser robust
- [ ] Cumulează tranzacții bancare în Supabase (per client)
- [ ] Auto-match cu facturi din SPV — target 90%+ accuracy
- [ ] UI side-by-side: facturi neîncasate / plăți neassociate
- [ ] Cash-flow forecast 30/60/90 zile (regresie liniară pe istoric)
- [ ] Phase 2: Nordigen integration directă (opt-in)

### 🟡 Sprint 5 — F#3 Duplicate fraud + F#10 Cross-border (PARALLEL EXTENSIONS)

#### F#3 Duplicate fraud detector EXTEND
**Durată:** 3 zile
**Bază:** `spv-duplicate-detector` existent + fuzzy matching.
**Acceptance criteria:**
- [ ] Detectează duplicate prin (invoiceNumber + cif + date) — deja existent
- [ ] **EXTEND**: fuzzy matching pe variații (factura "F123" vs "F-123" vs "F 123") via Levenshtein
- [ ] Detectează plăți duplicate (același CUI + sumă + dată în extras bancar) ← NOU
- [ ] Raport "Furnizori cu risc duplicate" cu pattern recognition
- [ ] Audit trail per fiecare detection cu approve/reject button

#### F#10 Cross-border VAT advisor EXTEND
**Durată:** 5 zile (parallel)
**Bază:** `efactura-cross-border-guidance` existent.
**Acceptance criteria:**
- [ ] Wizard UI: client nou non-RO → întreabă țară, VAT status, tip tranzacție
- [ ] Output: verdict + bază legală + acțiune (D390, OSS, e-Factura post-1 ian 2026)
- [ ] Update OUG 89/2025 reflect (e-Factura extins la non-rezidenți)
- [ ] Documentație inline cu citate (lege5.ro links)

### 🟢 Sprint 6-7 — F#8 OCR Vision (BUILD)
**Durată:** 2 săpt
**Cost:** ~$1-2/cabinet/lună (Gemini Vision API existent)
**Wow factor:** demo cel mai bun (foto bon → factură instant).
**Stack hybrid layered:**
- **Default**: Gemini Vision API (cheie GEMINI_API_KEY deja configurată) — structured output în 1 apel
- **Privacy mode**: Ollama + Gemma 4 multimodal local (aliniat AIPrivacyMode existent)
- **Fallback**: Tesseract.js (Apache 2.0, zero cost, slabă pe layouts complexe)
**Acceptance criteria:**
- [ ] Endpoint `/api/efactura/ocr-extract` care primește image (PNG/JPG/PDF)
- [ ] Output: JSON cu { supplierCif, supplierName, invoiceNumber, issueDate, totalAmount, vatAmount, lines: [{description, amount, vatRate}] }
- [ ] Wire în Bulk ZIP upload — accept image folder, nu doar XML
- [ ] PWA mobile endpoint pentru cabinet/patron să facă foto direct din telefon
- [ ] Web Speech API pentru voice input ("am cumpărat consumabile 500 lei de la SC X")
- [ ] Privacy toggle: cabinetele cu secret profesional folosesc Gemma 4 local

### 🟢 Sprint 8-9 — F#1 Predictive Audit Risk Scoring (BUILD)
**Durată:** 2 săpt
**Cost:** $0 (rule-based MVP, ML phase 2 cu Transformers.js)
**Tier upgrade lever:** justifică tier Studio €499/lună.
**Stack:**
- **MVP rule-based**: scor weighted din 8 factori (findings.severity + saft.hygieneScore + filing.lateCount + integration.errorRate + duplicate.count + crossFiling.discrepancies + etva.gap + cui.desync). Pure TS, transparent, explainable.
- **Phase 2 ML** (după primii 30 cabinete): Transformers.js cu xgboost-js pe historical data anonimă.
**Acceptance criteria:**
- [ ] Scor 0-100 per client + verde/galben/roșu classification
- [ ] **EXPLAIN field obligatoriu** per CECCAR Art. 14: "scorul e X pentru că Y" — niciodată black-box
- [ ] Disclaimer "informativ, nu garanție control ANAF"
- [ ] Trigger alert > prag custom (ex: 70/100)
- [ ] Dashboard portfolio aggregate: distribuție scor pe portofoliu cabinet
- [ ] Bias mitigation: model NU folosește variabile demografice (doar comportament fiscal)
- [ ] Audit log: ce a generat scorul, când, ce factori au contat

---

## 🔴 EXCLUSE definitiv (cu motiv)

| Feature | De ce SKIP |
|---|---|
| **F#6 e-Transport GPS** | Blocker parteneriat AROBS/TrackGPS — negociere luni. Codul real 2-3 luni. Reluăm când avem 20+ cabinete plătitoare. |
| **F#7 Cross-recon Bank-SPV-SAF-T** | Depinde de F#2. După F#2 e ready, devine extension naturală, nu killer separat — re-evaluăm. |
| **F#9 Workload planner** | Nice-to-have. Cabinetele au Excel + experiență. Low wow. |
| **F#12 Customer portal mobile** | **Anti-feature**: cabinetele NU VOR portal pentru clienții lor — e concurență cu serviciul propriu. (Insight strategic) |
| **F#13 Predictive e-Transport** | Depinde F#6 = skip. |
| **Outrageous bet — Blockchain ledger** | Over-engineered. Cabinetele vor să nu plătească amendă, nu să demonstreze integritate criptografică. Audit log în Supabase = suficient. |

---

## STACK 100% FREE + LEGAL (totalizator)

| Tool | Licență | Folosit pentru |
|---|---|---|
| Nordigen Bank Account Data | AIS license (BNR-aprobat, ei) | F#2 PSD2 read access |
| mt940-js + camt-parser | MIT | F#2 parser extras bancar |
| Tesseract.js | Apache 2.0 | F#8 OCR fallback |
| Ollama + Gemma 4 multimodal | Google Gemma License | F#8 privacy mode + F#1 explain |
| whisper.cpp | MIT | F#8 voice fallback |
| Web Speech API | Browser native | F#8 voice primary |
| Transformers.js + gte-multilingual | Apache 2.0 | F#5 embeddings + F#1 ML |
| Brain.js / xgboost-js | MIT | F#1 ML phase 2 |
| EU CPV dictionary | Public regulation 2195/2002 | F#5 |
| WCO HS / NC8 | Public WCO | F#5 |
| Gemini Vision API | Existent (GEMINI_API_KEY) | F#8 OCR default + F#11 explain + F#1 phase 2 |

---

## TIMELINE EFECTIV

```
Săpt 0:          Sidebar restructure (Opțiunea A)              ✅ 2 zile, $0
Săpt 1:          F#4 Certificate SPV manager                     🟢 KILLER, $0
Săpt 2:          F#5 Auto-CPV/NC8 + F#11 extend (parallel)       🟢 KILLER + ext, $0
Săpt 3-4:        F#2 Bank-SPV Reconciliation                     🟢 KILLER, $0
Săpt 5:          F#3 + F#10 extensions (parallel)                🟡 extensions, $0
Săpt 6-7:        F#8 OCR Vision (Gemini default + Gemma local)   🟢 KILLER, ~$1-2/cabinet
Săpt 8-9:        F#1 Predictive Risk Scoring (rules → ML)        🟢 KILLER, $0 MVP
```

## CE OBȚIN CABINETELE post-sprint

- **IA fiscal curat** workflow-driven (sidebar 5 secțiuni)
- **Certificate SPV niciodată ratat** (F#4)
- **Sugestii CPV/NC8 automate** pentru B2G (F#5)
- **AI explică erori + sugerează fix** (F#11)
- **95% facturi auto-matched cu plățile bancare** (F#2)
- **Duplicate fraud detected** (F#3-ext)
- **Cross-border VAT advisor** (F#10-ext)
- **Foto bon → factură validată în 3s** (F#8)
- **Scor risc ANAF real-time per client** (F#1)

**Diferențiator competitiv:** SmartBill/Saga/Oblio FIZIC nu pot face niciun set
din astea — n-au acces bancar, n-au AI/ML, n-au cross-system reconciliation,
n-au portfolio analytics.

## RISK MITIGATION

- **F#1 bias risk**: model NU folosește variabile demografice; explainability mandatory; CECCAR Art. 14 disclaimer.
- **F#2 PSD2 legal**: folosim Nordigen ca agent (licența lor BNR-aprobată); upload manual = utilizatorul controlează datele lui.
- **F#3 false positive fraud**: nu acuzăm pe nimeni, doar semnalăm pentru REVIEW manual.
- **F#8 privacy GDPR**: facturile pot conține date personale; default Gemma 4 local pentru cabinete sensibile.

## DOD per feature

Fiecare feature livrat trebuie să aibă:
- [ ] Lib pure-functions cu unit tests
- [ ] API route cu auth + validation
- [ ] UI component integrat în sidebar nou
- [ ] Documentație în code comments (cu citate legale unde aplicabil)
- [ ] Browser E2E verification pe demo cabinet
- [ ] Production TS clean, vitest pass
- [ ] Commit + push pe `feat/bundle-d-fiscal-launch`

---

**Status:** APROBAT 2026-05-11. Pornesc cu Sprint 0 (Sidebar IA restructure) imediat.
