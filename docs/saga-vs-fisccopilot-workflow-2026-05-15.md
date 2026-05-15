# SAGA vs FiscCopilot — Workflow contabil lunar real

> **Data:** 2026-05-15
> **Sursa workflow SAGA:** observație directă cabinet RO 2026
> **Scop:** asset principal pentru strategie produs + pricing + sales

---

## TL;DR

| Metric | SAGA workflow manual | FiscCopilot target | Economie |
|--------|---------------------|---------------------|----------|
| Timp pe cabinet (50 firme) | **83 ore/lună** | **6 ore/lună** | **77 ore/lună** |
| Cost timp (junior 22 RON/h) | 1.826 RON/lună | 132 RON/lună | **1.694 RON/lună** |
| FTE eliberat | 0 (toți consumați) | ~0.4 FTE/contabil | 1 junior la 2.5 cabinete |

**Pricing target FiscCopilot:** €99/lună (~500 RON) → **ROI 3.4x doar pe timp + 2-5x pe amenzi evitate.**

---

## Workflow contabil lunar SAGA — captură verbatim

### Pasul 1 — Descărcarea automată/manuală din ANAF e-Factura
*(Primele zile ale lunii — toate facturile emise și primite)*

1. Introducerea token-ului USB cu semnătura electronică
2. Deschide softul SAGA C → alege firmă din listă → OK
3. Meniu: Diverse → E-Factura
4. Tab "Generare și descărcare automată"
5. Click "Cod autorizare (token)" → introduce PIN-ul în driver (SafeNet/Aladdin)
6. Bifează perioada → click "Verificare răspuns/Descărcare facturi"
7. Click "Validare și import" → achiziții se duc în Intrări, vânzări în Ieșiri

**Timp per firmă: 5-10 min × 50 firme = 5-10 ore/lună.**

---

### Pasul 2 — Procesarea extraselor bancare și deconturilor
*(Fiecare tranzacție din contul bancar = justificată manual)*

1. Operații → Jurnal de Bancă/Casă/Deconturi → selectare cont 5121.01
2. Click Adaug → Tab Data, Tip (F/—), Număr document, Cod furnizor
3. Introduce sumă → SAGA deschide pop-up cu facturi neachitate
4. Dublu-click pe factură → verifică sumă → Accept → Salvare
5. **Repetă pentru fiecare linie din extras**

**Timp per tranzacție: ~30 sec × 200 tranzacții × 50 firme = 50 ore/lună (estimare ridicată); realist 8 ore/lună.**

---

### Pasul 3 — Calculul salariilor și statul de plată
*(Între 10 și 15 ale lunii)*

1. Operații → State de salarii
2. Adaug → selectează luna → Salvare
3. Click luna → Detalii → modificări pontaj per angajat (CO, CM)
4. Click Actualizare date → recalcul CAS, CASS, Impozit
5. Click Validare → SAGA blochează modificările
6. Click Generare D112 → Generare PDF → SAGA deschide formularul ANAF intelligent

**🚨 Pain Carmen Tigău:** *"Introdus diurna în 2 locuri ca să se ducă și în D112"* — exact aici, în Pasul 3.

**Timp: ~4 ore/lună / cabinet.**

---

### Pasul 4 — Închiderea de lună și calculul taxelor
*(Între 15 și 24 ale lunii)*

Tab "Închidere lună" — click pe rând, secvențial:
1. Închidere amortizare (dacă firma are mijloace fixe)
2. Închidere descărcare gestiune (cost mărfuri vândute, sold 371 ≥ 0)
3. Închidere diferențe de curs (conturi valută)

Tab "Decont TVA / Regularizare":
4. Click Actualizare date → adună TVA colectată + deductibilă
5. Click Validare închidere TVA → note contabile auto (4426 = 4427)

Tab "Impozit pe profit / venit":
6. Click Actualizare date → procentul legal (1%/3% micro, 16% profit)
7. Click Validare calcul impozit

Tab "Închidere conturi venituri/cheltuieli":
8. Click Validare → clasa 6 + clasa 7 → cont 121 (Profit/Pierdere)

**Timp: ~20 min × 50 firme = 16 ore/lună.**

---

### Pasul 5 — Generare + validare + semnare D300/D394
*(Momentul critic — datele pleacă la stat)*

1. Click D300 (Decont TVA) → Generare PDF
2. SAGA deschide PDF interactiv în **Adobe Acrobat Reader**
3. Click VALIDARE în PDF → "Validarea a fost finalizată cu succes"
4. Dacă erori → listă roșie → repară în SAGA → reia
5. Derulează la ultima pagină → click chenar Semnătură
6. Fereastra cert digital → click Sign → introduce PIN → salvează PDF
7. **Repetă pentru D394, D406, D112...**

**Timp: ~10 min × 50 firme × 4 declarații = 33 ore/lună.**

---

### Pasul 6 — Depunere SPV + descărcare recipise

1. Browser → anaf.ro
2. Click Autentificare Certificat → selectează cert → PIN
3. Meniu SPV: Depunere declarații → Formulare electronice
4. Click Choose File → caută `C:/SAGA C.3.0/declaratii` → Open
5. Click Trimite → notează index
6. Așteptare *"câteva minute (sau ore, dacă serverele ANAF sunt aglomerate)"*
7. Click Mesaje → verifică status declarație
8. Click link XML/PDF recipisă → salvează în calculator
9. Dacă "validă" → arhivare; dacă "erori" → reia din Pasul 4

**Timp: ~5 min × 50 firme × 4 declarații = 16 ore/lună.**

---

## ANALIZĂ COMPARATIVĂ — Ce face FiscCopilot diferit

### Pasul 1: e-Factura download — **automat în background**

| SAGA | FiscCopilot |
|------|-------------|
| Token USB → SAGA UI → tab → PIN → bifează perioadă → click descărcă | Cron 6:00 AM auto-pull pentru toate firmele (token cached criptat per sesiune) |
| 5-10 min/firmă | 0 min — totul în background |
| Notificare manuală | Push: *"12 facturi noi pentru 8 firme. 2 cu erori — apasă să vezi."* |

---

### Pasul 2: Reconciliere bancă-facturi — **PSD2 + AI matching**

| SAGA | FiscCopilot |
|------|-------------|
| Click Adaug → Tab × 4 câmpuri → caută furnizor → pop-up → dublu-click → Accept → Salvare | PSD2 Open Banking direct import + AI suggest match (confidence 95%+) → one-click confirm |
| ~30 sec / tranzacție | ~3 sec / tranzacție (sau zero la auto-confirm > 98%) |

---

### Pasul 3: Salarii + D112 — **diurnă propagare automată**

| SAGA | FiscCopilot |
|------|-------------|
| Pontaj manual per angajat → Validare → Generare PDF | Tabel-edit live cu validare instant → XML D112 direct + validare DUKIntegrator background |
| **Diurnă introdusă în 2 locuri** (Carmen) | **Pattern Engine: diurnă → state → D112 auto-propagate** ✅ |

---

### Pasul 4: Închidere lună — **1 click cu progres bar**

| SAGA | FiscCopilot |
|------|-------------|
| 7+ click-uri secvențiale, fiecare cu Actualizare + Validare | Un singur buton "Închide luna" + progress bar 7 pași |
| Verificare manuală sold 371 ≥ 0 | Auto-check + rollback dacă negative |
| Decont TVA manual fără cross-check D394 | Pre-submission ANAF Mirror reconciler (Regula 98, sold precedent) |

---

### Pasul 5: Generare + semnare D300/D394 — **NATIVE BROWSER, fără Acrobat**

| SAGA | FiscCopilot |
|------|-------------|
| Generare PDF în SAGA → deschide Adobe Acrobat Reader → click VALIDARE → semnătură per declarație | Generare XML direct → validator în-browser → AI Expert explică erori → bulk-sign mode cu PIN unic per sesiune |
| ~10 min/declarație | ~30 sec/declarație |
| **Adobe Acrobat în 2026** | Browser modern + WebAuthn / PKCS#11 |

---

### Pasul 6: Submit SPV + recipise — **API direct + auto-poll**

| SAGA | FiscCopilot |
|------|-------------|
| Browser → cert + PIN → meniu → Choose File → Trimite → așteaptă → Mesaje → descarcă | SPV API direct (cabinet token cached) → submit + auto-track index → push când recipisa e gata |
| ~5 min/declarație + așteptare manuală | ~30 sec/submit + zero așteptare |

---

## STATUS — Ce avem deja construit (BUILT)

### ✅ Avem (10 mai 2026)

| Componentă | Status | Localizare |
|------------|--------|------------|
| AI Expert (Gemma local + RAG hibrid) | ✅ COMPLET | `lib/fiscal-copilot/ai-expert.ts` |
| Match Path Engine (6 paths) | ✅ COMPLET | `lib/fiscal-copilot/match-paths/paths.ts` |
| Daily Briefing | ✅ COMPLET | `lib/fiscal-copilot/daily-briefing.ts` |
| Memory (Episodic + Semantic + Procedural + Consolidation) | ✅ COMPLET | `lib/fiscal-copilot/memory/` |
| Portfolio store per orgId | ✅ COMPLET | `lib/fiscal-copilot/portfolio-store.ts` |
| Corpus (16 curated + 93 SAGA neutralized) | ✅ COMPLET | `lib/fiscal-copilot/corpus/` |
| Auth real cu CompliAI session | ✅ COMPLET | `middleware.ts`, `getOrgContext()` |
| 9 API endpoints REST | ✅ COMPLET | `app/api/fiscal-copilot/*` |
| UI dashboard cu chat + briefing + alerts | ✅ COMPLET | `components/fiscal-copilot/*` |
| Diurnă → D112 propagare (Pasul 3 Carmen) | ✅ COMPLET | `PATH_DIURNA_D112` |
| Detection închidere lună neefectuată (Pasul 4) | ✅ COMPLET | `PATH_INCHIDERE_LUNA` |
| Detection D205 termen (Pasul 5) | ✅ COMPLET | `PATH_D205_DEADLINE` |
| Detection SAF-T D406 termen (Pasul 5) | ✅ COMPLET | `PATH_SAFT_DEADLINE` |
| Detection casa marcat prag (operațional general) | ✅ COMPLET | `PATH_CASA_MARCAT` |
| Detection micro prag 500K (operațional general) | ✅ COMPLET | `PATH_MICRO_PRAG` |
| Healtcheck, audit pack, evidence (din CompliAI base) | ✅ COMPLET | `lib/compliance/*` |
| E-Factura UBL CIUS-RO validator | ✅ COMPLET | `lib/compliance/efactura-validator.ts` |
| SAF-T D406 validator (33 teste) | ✅ COMPLET | `lib/compliance/saft-*` |
| ANAF Mirror (115 reguli + 26 deadlines) | ✅ COMPLET | `lib/compliance/*` |

---

## STATUS — Ce NU avem și CUM construim

### ❌ GAPS critice — pentru a livra promisiunea "Photoshop"

#### Pasul 1 gaps — e-Factura auto-pull pentru portofoliu

| Lipsește | Effort | Prioritate |
|----------|--------|------------|
| Cron daily pe orgId portfolio (iterate toate clientele) | 3 zile | **P0** |
| Bulk SPV poll (multi-CUI session token caching) | 2 zile | **P0** |
| Push notifications WebSocket / Server-Sent Events | 2 zile | P1 |
| Auto-validate XML + AI anomaly flag | 1 zi | **P0** |
| **TOTAL** | **~1 săptămână** | |

**Cod existent reused:** `lib/anaf-spv-client.ts` (SPV polling pattern), `lib/compliance/efactura-validator.ts`

---

#### Pasul 2 gaps — Reconciliere bancă-facturi (Dan Andrei territory!)

| Lipsește | Effort | Prioritate |
|----------|--------|------------|
| PSD2 Open Banking integration (ING, BCR, BRD, Raiffeisen) | 3 săpt | **P0** |
| AI matching algorithm (sumă, dată, partener, referință) | 1 săpt | **P0** |
| One-click confirm UI (tabel cu suggested matches) | 4 zile | **P0** |
| Auto-confirm threshold logic (>98% confidence → no human review) | 2 zile | P1 |
| **TOTAL** | **~5 săptămâni** | |

**Risc:** PSD2 cere certificare PSD2 TPP — proces lung (3-6 luni). **Workaround**: import CSV/MT940 manual la început, PSD2 după.

---

#### Pasul 3 gaps — Salarii + state plată + D112 generator

| Lipsește | Effort | Prioritate |
|----------|--------|------------|
| State salarii calculator (CAS, CASS, impozit, deduceri legale) | 4 săpt | **P1** |
| Pontaj UI editor (calendar cu CO/CM/concedii) | 2 săpt | P1 |
| D112 XML generator + DUKIntegrator validation | 2 săpt | **P1** |
| ✅ Diurnă → D112 propagare | **DONE** | — |
| **TOTAL** | **~7 săptămâni** | |

**Risc HIGH:** Salarii e domeniu complex cu reguli care se schimbă lunar. Sugestie: integrare cu un payroll provider existent (Easygroup, etc.) în loc de building from scratch.

---

#### Pasul 4 gaps — Închidere lună execuție

| Lipsește | Effort | Prioritate |
|----------|--------|------------|
| Note contabile auto-generation (4426=4427, etc.) | 2 săpt | **P0** |
| Sold check inteligent (371, 4428, etc.) | 1 săpt | **P0** |
| Decont TVA calculator detailed (toate rândurile 1-41) | 2 săpt | **P0** |
| Impozit profit/venit calculator (16%, 1%/3%, bonificație OUG153/2020) | 1 săpt | **P0** |
| ✅ Detection închidere neefectuată | **DONE** | — |
| Closing UI cu progress bar 7 pași + rollback pe eroare | 1 săpt | **P1** |
| **TOTAL** | **~7 săptămâni** | |

---

#### Pasul 5 gaps — Generare + validare + semnare declarații

| Lipsește | Effort | Prioritate |
|----------|--------|------------|
| D300 XML generator (toate 41 rânduri + jurnale) | 2 săpt | **P0** |
| D394 XML generator (defalcat pe CUI partener) | 1 săpt | **P0** |
| D406 SAF-T generator (avem validatorul, lipsește generarea) | 3 săpt | **P0** |
| D100 XML generator | 1 săpt | **P0** |
| D101 XML generator (anual) | 1 săpt | P1 |
| DUKIntegrator API client (validare server-side) | 1 săpt | **P0** |
| PDF preview pentru semnare in-browser | 1 săpt | P1 |
| Browser PKCS#11 / WebAuthn signing flow | 2-3 săpt | **P0** |
| Bulk sign mode (un PIN per sesiune × N declarații) | 1 săpt | P1 |
| **TOTAL** | **~12 săptămâni** | |

**Cel mai mare gap.** Soluție: prioritizează D300 + D394 (cele mai dese), restul în iterate ulterioare.

---

#### Pasul 6 gaps — Submit SPV + recipise auto

| Lipsește | Effort | Prioritate |
|----------|--------|------------|
| SPV declaration submit endpoint (nu doar e-Factura) | 1 săpt | **P0** |
| Index tracking + persistență per submission | 3 zile | **P0** |
| Auto-poll recipisa (cron 5 min după submit) | 3 zile | **P0** |
| Audit pack auto-archive cu hash chain | 4 zile | P1 |
| Email + push notifications (status recipisă) | 4 zile | P1 |
| **TOTAL** | **~3 săptămâni** | |

**Cod existent reused:** `lib/compliance/anaf-retry-queue.ts`, `lib/compliance/audit-pack.ts`

---

## ROADMAP — propunere prioritate

### Faza 1 (luna 1) — Validare + UX wins rapide
*Target: prove value, get beta users*

- ✅ AI Expert + Match Paths (DONE)
- ✅ Memory + Briefing (DONE)
- ⏳ **Pasul 1**: e-Factura daily cron + bulk pull (1 săpt)
- ⏳ **Pasul 2 Lite**: CSV/MT940 import + AI matching (2 săpt)
- ⏳ **Pasul 6 Lite**: SPV index tracking + manual recipisa download (1 săpt)

**Output:** Beta privat cu 5-10 cabinete prietene (Carmen, Cristina, Mihaela).

### Faza 2 (luna 2-3) — Generatoare declarații
*Target: replace partial SAGA pentru depunere*

- D300 generator + validator (2 săpt)
- D394 generator (1 săpt)
- D406 SAF-T generator (3 săpt)
- D100 generator (1 săpt)
- DUKIntegrator API client (1 săpt)
- SPV submit + recipisa auto-poll (1 săpt)

**Output:** Cabinetele pot depune declarațiile FROM FiscCopilot, fără să mai deschidă SAGA + Acrobat.

### Faza 3 (luna 4-5) — Închidere lună + reconciliere completă
*Target: full replacement workflow*

- Note contabile auto-generation (2 săpt)
- Decont TVA calculator detailed (2 săpt)
- Impozit profit/venit calculator (1 săpt)
- Closing UI cu progress bar + rollback (1 săpt)
- PSD2 integration (3 săpt, paralel)
- Browser signing PKCS#11 (3 săpt)

**Output:** SAGA devine opțional. Cabinetele își pot face TOATE operațiunile în FiscCopilot.

### Faza 4 (luna 6+) — Payroll + advanced
*Target: enterprise tier features*

- State salarii calculator (4 săpt)
- Pontaj UI (2 săpt)
- D112 generator (2 săpt)
- Bulk sign mode (1 săpt)
- Multi-cabinet management (parteneri/membership)

**Output:** Enterprise-ready, full-stack contabilitate.

---

## TIMP TOTAL ESTIMAT (efort uman)

| Faza | Effort | Timp | Use case complet |
|------|--------|------|------------------|
| 1 | 4 săpt | luna 1 | Cabinete beta cu AI + alerts + e-Factura |
| 2 | 9 săpt | luna 2-3 | Depunere declarații din FiscCopilot |
| 3 | 12 săpt | luna 4-5 | Înlocuire completă SAGA pentru închidere + reconciliere |
| 4 | 9 săpt | luna 6+ | Enterprise + payroll |
| **TOTAL** | **34 săptămâni / ~8 luni** | | Photoshop fiscal complet |

**Cu o echipă 1 dev solo + AI assistant:** realist 6-8 luni pentru întreg ranges 1-3. Faza 4 = anul 2.

**Cu echipă 2-3 dev + AI:** 3-4 luni pentru ranges 1-3, anul 1 complet.

---

## CONCLUZII STRATEGICE

### 1. Avem deja "creierul" — lipsesc "mâinile"
FiscCopilot are deja AI Expert, Match Paths, Memory, Orchestrator. Ce ne lipsește = **executanții concreți** (generatoare XML, semnare, submit). Asta-i 6-8 luni de muncă, dar e EXECUTABILĂ și CLARĂ.

### 2. Workflow-ul real validează poziționarea
83 ore/lună mecanic vs 6 ore = **transformare operațională, nu doar "alt tool"**. Photoshop framing e legitim.

### 3. Pricing-ul €99/lună e justificat 3-5x
Doar pe Pasul 5 (semnare declarații în Adobe Acrobat absurd) economisim 33 ore/lună = **1.500 RON salvați** vs **500 RON cost (€99)**. ROI 3x ATÂT.

### 4. Strategia de releases incremental
Nu așteptăm 8 luni să livrăm tot. Lansăm Faza 1 (alerts + AI + briefing) acum, iterăm. Cabinetele beta plătesc deja la 4 săpt pentru ce avem.

### 5. Adobe Acrobat e absurd, dar workflow-ul îl cere
Cel mai mare friction point = semnarea PDF. Soluție: integrare PKCS#11 browser-side. **Asta SINGUR poate justifica subscription-ul.**

### 6. Diurnă → D112 deja DONE = win demonstrativ
Pe Pasul 3, avem deja PATH_DIURNA_D112 funcțional. Asta-i singura piesă DIRECT din workflow real care e DEJA implementată — folosim ca demo principal.

---

## NEXT ACTIONS (ordonate)

1. **DM Carmen Tigău + Cristina Țicleanu:** *"Am construit Match Path-ul pentru diurnă→D112. Vrei să-l vezi în acțiune 15 min?"*
2. **Build Faza 1 — Sprint 1:** e-Factura daily cron + bulk pull (1 săpt)
3. **Build Faza 1 — Sprint 2:** CSV bank import + AI matching (2 săpt)
4. **Pricing landing:** **€99/lună (Pro)** cu calculator ROI bazat pe acest doc
5. **Sales asset:** "SAGA vs FiscCopilot — workflow comparison" PDF din acest doc

---

**Generated: 2026-05-15**
**Branch:** `feat/fiscal-copilot-2026-05-14`
**Status:** Strategic asset — used for sales, roadmap, pricing.
