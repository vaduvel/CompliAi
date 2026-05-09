# Bundle D Fiscal — Master Execution Document

**Data:** 2026-05-09
**Versiune:** 1.0 (initial complete)
**Branch:** `feat/bundle-d-fiscal-launch`
**Status:** Source of truth pentru lansarea Bundle D Fiscal (mai-iulie 2026)
**Scop:** un singur document care leagă cercetare de piață → personas → user stories → user flow → IA → cod existent → gap-uri → sprint plan → implementation → tests → DoD

---

## 📌 SECȚIUNEA 0 — TL;DR

**Ce e Bundle D:** Layer compliance fiscal peste SmartBill/Saga/Oblio pentru contabili CECCAR cu 5-300+ clienți. **NU emit facturi** — detectăm + repară + alertăm.

**Cumpărător:** Contabil CECCAR (rol existent formal — 45.000 membri CECCAR în România).

**Wedge product:** Bundle D = primul lansat (mai 2026) per validation report 7 mai 2026 (locked decision).

**Pricing:** Solo €49-69 / Pro €199-249 / Studio €499-799 / Enterprise €999-2.999 (per validation report).

**Diferențiator unic vs SmartBill/Saga/Oblio:**
- Auto-repair XML sugestie + click apply (V001-V011 pre-submit)
- e-TVA Discrepancy Workflow (D300 vs P300 + countdown 20 zile)
- SAF-T D406 Hygiene Score 0-100
- Cross-checks ANAF cu agent autonom

**Status cod (pe v3-unified, branch `feat/bundle-d-fiscal-launch`):**
- ✅ Engine ~3.500 LOC matur (validator UBL CIUS-RO, e-TVA state machine, SAF-T hygiene, ANAF SPV OAuth, agent fiscal sensor)
- ✅ UI ~2.000 LOC (7 tabs operationale)
- ✅ ICP separation 3 layers (sidebar filter + route guard + API permission) — commits `c8c5eab`/`28ff4fc`/`7dc95a5`/`c37c419`
- ⏳ 6 GAP-uri fiscal-specific de implementat (~550 LOC nou)

**MRR target conservator 6 luni:** **€8-20K** prin parteneriat cu Adrian Bența / CECCAR. Target paid pilots: 5-15 cabinete.

---

## 📌 SECȚIUNEA 1 — Cercetare de piață

### 1.1 Sursa de validare

Document principal: `docs/strategy/compliscan-final-validare-piata-2026-05-07.md` (Opus integrat 6.000 cuvinte)

10 cercetări paralele cu surse externe verificate (LinkedIn, INS, BNR, ASF, ANSPDCP, DNSC, ANCOM, CECCAR, articole specializate, vendor pricing public).

### 1.2 TAM realist confirmat

| Segment | Volum | ARR teoretic |
|---------|-------|--------------|
| Solo (1 contabil, 5-30 clienți) | 7.000-9.000 cabinete | la €49 = €4.1-5.3M |
| Pro (50-100 clienți, 2-5 ang.) | **2.500-3.500 cabinete** ⭐ | la €199 = €5.97-8.36M |
| Studio (100-300 clienți, 6-15 ang.) | 700-1.200 cabinete | la €499 = €4.19-7.18M |
| Top 50 firme (300+ clienți) | 50-150 | enterprise custom |
| Enterprise antreprenori >5K facturi/lună | 500-1.500 firme | enterprise |
| **TOTAL adresabil** | **~10.000 cabinete + 1.500 antreprenori** | |

**Penetrare realist 18 luni:** 5-10% din Pro tier = 125-350 cabinete plătitoare = **€300-840K ARR**

### 1.3 8 citate pain validate empiric

Sursă: Republica.ro, StartupCafe, HotNews, Capital, Avocatnet, fiscalitatea.ro

1. **Petre Ciprian** (contabil): *"Ne stoarcem creierii cu sistem nefuncțional, SPV plin de erori, mii de facturi pe care nu le poți sorta."*
2. **Expert contabil 27 ani**: *"Am ajuns la capătul puterilor, nu mai pot psihic."*
3. **Nicoleta Banciu** (admin grup FB 65K Contabili): *"Peste 50% din contabili spun că vor să renunțe."*
4. **Articol StartupCafe**: *Contabili sunt 'message dispatchers' pentru fiecare refuz ANAF.*
5. **Valeriu Filip (FGO)**: *"10.000 utilizatori asistați doar de FGO."*
6. **Articol Ziare.com**: *"RO e-Factura — nu mai rezistăm. Jumătate din contabili își pun problema să renunțe."*
7. **CECCAR oficial** (evz.ro): *Solicitat abrogarea sistemului e-TVA în 2024.*
8. **Caz dubluri raportate**: *Factura de 100× → 1.000.000 lei nu 10.000 → contabilul trebuie să resolveze.*

### 1.4 7 trigger events 2025-2026

| Data | Eveniment | Impact contabil |
|------|-----------|-----------------|
| 1 ian 2025 | e-Factura B2C obligatoriu | Volum 5x |
| 1 iul 2025 | Amenzi B2C 1.000-10.000 lei active | Frica activă |
| 1 iul 2025 | e-TVA notificări răspuns 20 zile | Workflow nou |
| 1 ian 2025 | SAF-T D406 mici obligatoriu | Acoperire totală |
| 31 dec 2025 | OUG 89/2025 ("ordonanța trenuleț") | Schimbare retur 2026 |
| **1 ian 2026** | **Termen 5 zile lucrătoare + amendă B2B 15% din valoare** | **Penalitate masivă** |
| 15 ian 2026 | Persoane fizice CNP intră e-Factura | Volum nou |
| 1 iun 2026 | Fermieri obligație efectivă | Volum nou |

### 1.5 Concurența directă (mature, dar incomplete)

| Tool | Ce face | Pricing | Ce LIPSEȘTE vs CompliScan |
|------|---------|---------|---------------------------|
| **SmartBill** | Emite + 99.99% pre-validation | €5-15/lună | ❌ FĂRĂ auto-repair, FĂRĂ e-TVA workflow, FĂRĂ SAF-T hygiene |
| **Saga** | Emite, forum erori | Licență €4-12/lună amortizat | ❌ NU validare proactivă |
| **Oblio** | Emite, 150K+ utilizatori | €29 EUR/an unic | ❌ Doar emisie |
| **eConta** | €49/lună end-client | €49/lună | ❌ Doar contabilitate, fără cross-check ANAF |
| **Pagero / Tungsten** | Enterprise €1-10K/lună | Enterprise only | ✅ Win SMB |
| **ANAF SPV portal** | Gratuit, fără workflow | gratuit | ✅ Win UX + agent |

**Combo unic CompliScan în RO**: validator + auto-repair + e-TVA discrepancy + SAF-T hygiene + agent autonom + Fiscal Protocol — **niciun concurent RO complet pe acest combo**.

### 1.6 3 capcane CRITICE de evitat

1. **"Auto-repair" e cuvânt periculos legal** — contabilul e responsabil profesional CECCAR. UX OBLIGATORIU: "sugestie + un click apply, contabilul aprobă". NICIODATĂ silent. Plus disclaimer + audit log per fix.
2. **Saturație tooling** — contabilul are deja SmartBill + Saga + SPV + e-Transport + posibil Keez. Soluție obligatorie: **integrare API directă + drag-drop XML**, NU produs separat care cere date din nou.
3. **Channel direct online slab** — cabinetele cumpără pe trust comunitar, NU pe FB ads. Strategie: parteneriat semnat cu Adrian Bența SAU Universul Fiscal SAU CECCAR filiale înainte de launch.

---

## 📌 SECȚIUNEA 2 — Persona "Petre" (Contabil CECCAR)

### 2.1 Profil arhetipal

| Atribut | Detaliu |
|---------|---------|
| **Nume arhetipal** | Petre Ciprian (citat din research) |
| **Rol formal** | Expert Contabil CECCAR autorizat |
| **Vârstă** | 35-55 ani |
| **Educație** | Facultate Economică / ASE / SNSPA + curs CECCAR |
| **Experiență** | 10-30 ani în contabilitate |
| **Cabinet** | 1-15 oameni |
| **Clienți** | 5-300+ firme cliente (PFA, SRL, microîntreprinderi) |
| **Revenue cabinet** | 200-1.000 RON/lună/client = €40-200/lună/client |
| **MRR cabinet 50 clienți** | ~€5.000 |
| **Discrețional buget tooling** | Sub €500/lună fără owner approval |
| **Tools curent** | SmartBill / Saga / Oblio (75% piață), SPV ANAF, e-Transport, Excel, Word, Outlook, WhatsApp client |
| **Workflow** | 30-50% timp pe gestiune erori e-Factura, 25% pe declarații lunare, restul pe consultanță |

### 2.2 Pain points zilnice (validate empiric)

1. **5.000+ facturi/lună** procesate manual la cabinet 50 clienți × 100 facturi
2. **2-5 erori/factură × 5-15 min remediere** = 8-60h/lună **doar** pe rectificare erori e-Factura
3. **Termen 5 zile lucrătoare** pentru transmitere → presiune constantă
4. **Notificări e-TVA cu 20 zile răspuns** → workflow paralel cu activitatea normală
5. **D406 SAF-T lunar** → corectitudine + cross-check cu D300/D394/D390
6. **Mesaje SPV** ANAF pe orele/zilele variabile → necesită monitoring continuu
7. **Status SmartBill/Saga ≠ Status ANAF** → ambiguitate care e adevărul (codul RO e nedeterministic)
8. **Frica de amendă** B2B 15% din valoare factură → o singură eroare care scapă = pierdere directă
9. **Cabinet 50 clienți → 50 portaluri SPV diferite** de monitorizat manual
10. **Comunicare cu contabilul intern al clientului** → telefon + WhatsApp + email haotic

### 2.3 Buying behavior

- **Decizie rapidă sub €100/lună** fără consultare
- **Trial 14-30 zile gratuit** = standard CECCAR
- **Demo cu peer endorsement** = Bența / Vulpoi / Banciu (admin FB 65K)
- **Pricing publicat** = cere transparență
- **Plată anuală cu 15-20% discount** = preferată (cash flow cabinet)
- **Refuză rebill către clienți direct** = absorb costul, profit din rebill servicii consultanță
- **Renunță la tool dacă în 30 zile nu salvează 4-8h** = prag rentabilitate

---

## 📌 SECȚIUNEA 3 — User Stories (Top 15 pentru Bundle D)

### Cele 15 user stories prioritate maximă

1. **Ca contabil CECCAR cu 50 clienți**, vreau să văd TOATE facturile RESPINSE ANAF într-un dashboard cross-client cu motivul + sugestie fix → **scanare automată + agent fiscal sensor**

2. **Ca contabil**, vreau auto-repair XML cu disclaimer "sugestie + click apply" — NICIODATĂ silent (responsabilitate CECCAR) → **GAP #2 Layer disclaimer + audit log**

3. **Ca contabil**, vreau bulk upload ZIP cu 100 facturi → toate validate în 30 secunde cu validator V001-V011 → **GAP #6 Bulk ZIP**

4. **Ca contabil**, vreau countdown 20 zile pentru fiecare notificare e-TVA cu draft răspuns gata + reminder email automat → **e-TVA Discrepancy Workflow existent + email reminder**

5. **Ca contabil**, vreau alertă cu 3 zile înainte de deadline SAF-T D406 cu hygiene score per client → **GAP #4 D406 upload + verify**

6. **Ca contabil cu 50 clienți**, vreau să văd P300 pre-completat de ANAF vs D300-ul depus, cu diferențele evidențiate înainte ca ANAF să trimită notificare → **GAP #5 P300 vs D300 comparator**

7. **Ca contabil**, vreau cron lunar care verifică toate clienții cu ANAF SPV (NU manual) și generează findings automate pentru rejected/blocked/delayed facturi → **GAP #3 Cron SPV mock → real**

8. **Ca contabil CECCAR**, vreau audit pack export per client lunar pentru orice control ANAF pos-eveniment → **Audit Pack ZIP existent**

9. **Ca contabil**, vreau interpret automat al statusului SPV ANAF (ok / nok / xml_erori / in_prelucrare) cu acțiune sugerată → **Status Interpreter existent**

10. **Ca contabil**, vreau să import istoric facturi de la SmartBill/Saga prin drag-drop XML, fără re-introducere date → **Bulk import existent + GAP #6 ZIP**

11. **Ca contabil**, vreau să configur o singură dată credențialele ANAF SPV per client (OAuth) și apoi să fie autonom → **ANAF OAuth flow existent**

12. **Ca contabil CECCAR**, vreau evidence pack pentru fiecare client cu hash chain SHA-256 pentru a dovedi integritatea în control fiscal → **Audit Pack hash chain existent**

13. **Ca contabil**, vreau Risk Dashboard cu top 5 facturi cu risc fiscal ridicat (rejected, processing-delayed, unsubmitted) → **Risk Dashboard existent**

14. **Ca contabil cabinet**, vreau cross-client portfolio cu MRR per client + churn + alertă "client cu probleme repetate ANAF" → **Portfolio existent + GAP #4 SAF-T scoring**

15. **Ca contabil**, vreau să primesc notificări push email/SMS când ceva critic apare la un client (rejected, deadline iminent) — NU să verific manual → **Notification system existent + cron real**

---

## 📌 SECȚIUNEA 4 — User Flow

### 4.1 Onboarding (prima zi)

```
0. /pentru/contabil landing → click "Începe trial 30 zile gratis"
   ↓
1. /login?icp=cabinet-fiscal&mode=register
   → Email + Parolă + Nume cabinet
   → icpSegment auto-set la "cabinet-fiscal"
   ↓
2. Onboarding pas 1: "Ce rol ai?"
   → "📊 Contabil CECCAR" selectat
   → confirmare automat icpSegment
   ↓
3. Onboarding pas 2: Setup CUI + ANAF SPV OAuth
   → CUI cabinet + CUI primii clienți
   → "Conectează ANAF SPV" → redirect OAuth → token salvat
   ↓
4. Onboarding pas 3: Import primii 1-5 clienți
   → Drag-drop ZIP cu CUI list (CUI pe linie)
   → CUI prefill din ANAF API public (TVA status, denumire)
   → Demo data optional pentru testare
   ↓
5. Redirect /dashboard
   → Sidebar arată DOAR: Acasă, Scanează, Fiscal, Calendar, Settings, Portofoliu
   → DPO/NIS2/AI Act/HR ASCUNSE prin Layer 3 filter
   → Cockpit fiscal-first cu clienți + risk score
```

### 4.2 Workflow zilnic (5-10 min/factură)

```
ZIUA N — Contabilul deschide CompliScan dimineața

1. /dashboard → vede peste noapte:
   • 🚨 3 facturi RESPINSE ANAF (ieri)
   • ⚠️ 2 e-TVA notificări (D300 vs P300 gap >5K)
   • ⏰ 1 SAF-T D406 deadline 3 zile

2. Click "🚨 Facturi respinse" → vede lista:
   • Factura #FACT-2026-0042 (Client X) — V003 InvoiceTypeCode lipsă
   • Factura #FACT-2026-0043 (Client Y) — V002 CustomizationID lipsă
   • Factura #FACT-2026-0044 (Client Z) — CUI furnizor invalid

3. Click pe Factura #0042:
   • Vede XML invalid + diff color-coded
   • Citește sugestia: "Adaugă <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>"
   • Banner DISCLAIMER: "📋 SUGESTIE — vei revizui și aproba fiecare modificare conform Codului Deontologic CECCAR"
   • Checkbox "Am revizuit și aprob fiecare modificare"
   • Buton "Aplică fix → retransmite"
   • Click → audit log: "Fix V003 aplicat de [contabil] la [timestamp] cu approval CECCAR"
   • XML reparat → trimis la ANAF SPV
   • Status nou: "Retransmis → Așteaptă confirmare"

4. Verifică următoarea factură. Repetă.

5. La sfârșitul zilei: trimite notificări clienților cu probleme rezolvate.
```

### 4.3 Workflow lunar

```
LUNI 25 ALE LUNII (deadline D300)

1. /dashboard → vede card "D300 deadline 5 zile" pentru 47 clienți

2. Pentru fiecare client:
   • CompliScan automat ad-hoc verifică D300 vs P300 (ANAF pre-completat)
   • Dacă diferență >20% și ≥5K lei: finding + countdown 20 zile răspuns
   • Suggested response cu draft text formal pre-completed
   • Contabilul aprobă draft → submit ANAF prin SPV

3. Pentru SAF-T D406 (sfârșit lună):
   • Drag-drop XML SAF-T per client
   • Validator rulează cele 11 cross-checks (D300/D394/D390/e-Factura/e-Case/e-Transport/Vamal)
   • Hygiene Score 0-100 per client
   • Lista clienți cu probleme → action plan per client
   • Submit la ANAF doar dacă score >70

LUNAR — Audit Pack Export
1. Click "Export audit pack lunar pentru toți clienții"
2. CompliScan generează pentru fiecare client:
   • MANIFEST.json cu hash chain SHA-256
   • Lista findings + status resolve
   • Evidence ZIP cu XMLs + email + SPV confirmations
3. Email automat la fiecare client cu link share-able
```

### 4.4 Workflow inspecție ANAF (event-driven)

```
EVENIMENT: ANAF anunță inspecție la Client X

1. Contabilul accesează /dashboard/dosar?client=X
2. Click "Audit Pack pentru perioadă" → selectează perioadă
3. CompliScan generează:
   • Toate facturile transmise + status SPV
   • Toate e-TVA discrepancies + răspunsuri
   • Toate SAF-T hygiene scores lunare
   • Cross-check D300/D394/D390 vs e-Factura
   • Hash chain integrity proof
4. PDF audit-ready 30-50 pagini cu signature CECCAR cabinet
5. Trimite la inspector ANAF prin SPV / email / fizic

TIMP TOTAL: 30 minute (vs 2 săptămâni manual)
```

---

## 📌 SECȚIUNEA 5 — IA Bundle D (ce vede contabilul)

### 5.1 Sidebar pentru `icpSegment="cabinet-fiscal"`

```
┌─────────────────────────────────────┐
│ 🏠 Acasă                             │
│ 🔍 Scanează                          │
│ ✓ De rezolvat                        │
│ 📂 Dosar                             │
│ 📅 Calendar                          │
├─ FISCAL ────────────────────────────┤
│ 📊 Fiscal Dashboard                 │
│   ├─ e-Factura validator            │
│   ├─ Auto-Repair XML                │
│   ├─ Risk Dashboard                 │
│   ├─ Vendor Signals                 │
│   ├─ e-TVA Discrepancy              │
│   ├─ SAF-T Hygiene                  │
│   └─ Status Interpreter             │
│ 🤖 Agent Fiscal Sensor              │
├─ CABINET ───────────────────────────┤
│ 👥 Portofoliu clienți               │
│ 📈 Portfolio Reports                │
│ 📅 Scheduled Reports                │
│ ✓ Approvals                         │
│ ⚙️ Setări                            │
└─────────────────────────────────────┘
```

**ASCUNSE TOTAL** (prin Layer 3 + 4 + 5):
- ❌ GDPR (RoPA, DSAR, DPIA, breach, training, magic-links, cabinet-templates)
- ❌ NIS2 (asssessment, maturity, DNSC)
- ❌ AI Act (inventory, Annex IV)
- ❌ DORA
- ❌ Pay Transparency
- ❌ Whistleblowing technical
- ❌ HR/REGES

### 5.2 Cockpit dashboard (cabinet 47 clienți)

```
┌──────────────────────────────────────────────────────┐
│ Cabinet Fiscal "Cabinet Petre Ciprian SRL"            │
│ 47 clienți activi · MRR cabinet €4.700               │
├──────────────────────────────────────────────────────┤
│ 🚨 ALERTE CRITICE (12) — pentru rezolvare azi        │
│   • 3 facturi RESPINSE ANAF (V003 InvoiceTypeCode)   │
│   • 2 e-TVA notificare (D300 vs P300 gap >5K)        │
│   • 1 SAF-T D406 deadline 3 zile                     │
│   • 6 facturi blocate >48h "in prelucrare"           │
├──────────────────────────────────────────────────────┤
│ 🛠️ AUTO-FIX SUGESTII (8) — disclaimer + click apply  │
│   • V002 lipsă CustomizationID — 5 facturi           │
│   • T003 encoding — 3 facturi                        │
├──────────────────────────────────────────────────────┤
│ 📊 SAF-T Hygiene Score per client (top 5):           │
│   • LogiTrans   92/100  ✅                           │
│   • CafeMobil   78/100  ⚠️                           │
│   • Imobil X    45/100  🚨                           │
│   • CafeRomâ    88/100  ✅                           │
│   • TransLog    62/100  ⚠️                           │
├──────────────────────────────────────────────────────┤
│ 📅 Calendar fiscal — proxim termen:                  │
│   • D300 luna asta — 25 ale lunii — 5 zile           │
│   • D406 SAF-T sfârșit lună — 15 zile                │
│   • E-Factura 5 zile lucrătoare permanent            │
└──────────────────────────────────────────────────────┘
```

---

## 📌 SECȚIUNEA 6 — Cod existent (ce e MATUR în v3-unified)

### 6.1 Lib compliance (engine ~3.500 LOC)

| Fișier | LOC | Ce face |
|--------|-----|---------|
| `lib/compliance/efactura-validator.ts` | 210 | UBL CIUS-RO complet — V001-V011 + warnings |
| `lib/compliance/efactura-xml-repair.ts` | ~150 | Auto-repair sugestii + diff vizual |
| `lib/compliance/efactura-error-codes.ts` | ~120 | Error code mapper (200+ coduri ANAF) |
| `lib/compliance/efactura-status-interpreter.ts` | ~140 | Interpretare status SPV → action |
| `lib/compliance/efactura-prefill-inference.ts` | ~80 | Prefill inteligent date |
| `lib/compliance/efactura-signal-hardening.ts` | ~100 | Repeated rejections detection |
| `lib/compliance/efactura-risk.ts` | 199 | Risk signals (rejected/xml-error/delayed/unsubmitted) |
| `lib/compliance/etva-discrepancy.ts` | 285 | State machine completă (6 statuses + countdown 20 zile) |
| `lib/compliance/saft-hygiene.ts` | 369 | 4 indicators + gap detection + cross-filing check |
| `lib/compliance/filing-discipline.ts` | 310 | Scor 0-100 disciplină depuneri + reminders 3 nivele |
| `lib/compliance/fiscal-protocol.ts` | 221 | Protocol per finding EF-004/EF-005 |
| `lib/compliance/fiscal-revalidation.ts` | 256 | Reopen findings + stale evidence + auto-link notifs |
| `lib/compliance/agent-fiscal-sensor.ts` | 199 | Agent autonom — clasifică respingeri + escalation |
| `lib/compliance/agent-rail-fiscal-sensor.ts` | 135 | Rail integration |
| **TOTAL ENGINE** | **~2.770 LOC** | |

### 6.2 API routes (~1.100 LOC)

| Fișier | LOC | Ce face |
|--------|-----|---------|
| `app/api/efactura/validate/route.ts` | 74 | POST validate XML → V001-V011 |
| `app/api/efactura/repair/route.ts` | 98 | POST auto-repair |
| `app/api/efactura/signals/route.ts` | 79 | GET signals + POST generate findings |
| `app/api/fiscal/d406-evidence/route.ts` | 50 | Mark D406 submitted (basic) |
| `app/api/fiscal/etva-discrepancies/route.ts` | 115 | CRUD + state transitions |
| `app/api/fiscal/filing-records/route.ts` | 135 | CRUD + score calculation |
| `app/api/fiscal/spv-check/route.ts` | 209 | **REAL ANAF SPV** check on-demand |
| `app/api/fiscal/submit-spv/route.ts` | 97 | Submit cu OAuth + JWT |
| `app/api/fiscal/protocol/route.ts` | 236 | Fiscal protocol per finding |
| `app/api/cron/efactura-spv-monthly/route.ts` | ~100 | **MOCK currently** — GAP #3 |

### 6.3 UI components (~2.000 LOC)

| Fișier | LOC | Ce face |
|--------|-----|---------|
| `app/dashboard/fiscal/page.tsx` | 344 | Orchestrator 7 tabs |
| `components/compliscan/fiscal/SubmitSpvTab.tsx` | 793 | OAuth ANAF mature flow |
| `components/compliscan/fiscal/DiscrepanciesTab.tsx` | 222 | UI e-TVA |
| `components/compliscan/fiscal/EFacturaSignalsTab.tsx` | 171 | UI signals + filters |
| `components/compliscan/fiscal/FilingRecordsTab.tsx` | 187 | UI declarații |
| `components/compliscan/fiscal/SpvCheckTab.tsx` | 151 | UI SPV check |
| `components/compliscan/efactura-validator-card.tsx` | ~250 | UI validator + repair |
| `components/compliscan/efactura-risk-card.tsx` | ~120 | Risk card |
| `components/compliscan/fiscal-execution-log-card.tsx` | ~80 | Audit log fiscal |
| `components/compliscan/fiscal-status-interpreter-card.tsx` | ~100 | Interpret card |

### 6.4 ICP Separation (deja livrat — 902 LOC)

| Fișier | LOC | Status |
|--------|-----|--------|
| `lib/compliscan/icp-modules.ts` | 300 | ✅ Layer 3 source of truth |
| `lib/compliscan/icp-modules.test.ts` | 250 | ✅ 22/22 tests PASS |
| `components/compliscan/navigation.ts` (filterNavByIcp) | 50 | ✅ Layer 3 helper |
| `lib/compliscan/nav-config.ts` (extends) | 50 | ✅ Layer 3 wire |
| `components/compliscan/dashboard-shell.tsx` (apel) | 10 | ✅ Layer 3 wire |
| `middleware.ts` (route guard) | 100 | ✅ Layer 4 |
| `lib/server/icp-permissions.ts` | 170 | ✅ Layer 5 |
| `lib/server/icp-permissions.test.ts` | 200 | ✅ 20/20 tests PASS |
| **TOTAL** | **902 LOC** | **42/42 tests PASS** |

**TOTAL EXISTING pe Bundle D fiscal-launch branch: ~5.870 LOC**

---

## 📌 SECȚIUNEA 7 — GAP Analysis (cele 6 gap-uri rămase ~550 LOC)

### GAP #1 — ICP Module Visibility (Layer 3+4+5) ✅ DONE

Status: completat cu commit-uri `c8c5eab`/`28ff4fc`/`7dc95a5`/`c37c419`. Cu 902 LOC + 42 tests.

### GAP #2 — Auto-repair UX disclaimer + audit log

**Problema:** `components/compliscan/efactura-validator-card.tsx` are buton auto-repair fără disclaimer. Contabilul e responsabil profesional CECCAR — fără "sugestie + click apply" + audit log per fix, primul caz de malpraxis închide produsul.

**Soluție:**
- Modific UI în `efactura-validator-card.tsx` (NU lib/, doar componenta)
- Banner disclaimer + checkbox "Am revizuit și aprob fiecare modificare conform Codului Deontologic CECCAR"
- Audit log per `applyFix` apel la `appendComplianceEvents` (există deja)
- Engine-ul `lib/compliance/efactura-xml-repair.ts` rămâne neatins

**Effort:** ~70 linii (50 UI + 20 audit log).

**LEGAL CRITICAL** — fără asta NU lansăm.

### GAP #3 — Cron SPV mock → real

**Problema:** `app/api/cron/efactura-spv-monthly/route.ts:42` folosește `buildMockEFacturaSignals()`. Comentariu zice: *"In production: fetch real signals from ANAF SPV per org CUI. For now: use mock signals as demo baseline"*. Contabilul TREBUIE să apese manual "Verifică SPV" pentru fiecare client.

**Soluție:**
- Modific `app/api/cron/efactura-spv-monthly/route.ts`
- Înlocuiesc mock cu loop pe orgs cu token ANAF + apel `fetchSpvMessages(token, cui, 30)` (există deja în `/api/fiscal/spv-check/route.ts:105`)
- Reutilizez `spvMessageToFinding()` deja existent
- Fallback la mock signals dacă orgul NU are token ANAF connected (graceful)

**Effort:** ~80 linii backend.

### GAP #4 — D406 SAF-T upload + verify

**Problema:** `/api/fiscal/d406-evidence` doar bifează "depus". Engine-ul `lib/compliance/saft-hygiene.ts` (369 linii, deja există) nu poate fi folosit — nu există endpoint upload.

**Soluție:**
- Creez `app/api/fiscal/d406-upload/route.ts` (~150 linii)
- Parser XML SAF-T (multipart/form-data sau JSON cu xml string)
- Apel engine `computeSAFTHygieneScore()` existent
- Generate findings pentru rectificări multiple, gap-uri perioadă, missing data
- UI: nou tab "SAF-T Hygiene" în `/dashboard/fiscal` (modific `app/dashboard/fiscal/page.tsx` + adaug `components/compliscan/fiscal/SaftHygieneTab.tsx`)

**Effort:** ~200 linii (150 backend + 50 UI).

### GAP #5 — P300 vs D300 calculator

**Problema:** `lib/compliance/etva-discrepancy.ts` are state machine pentru notificări **primite** de la ANAF. Nu calculează preventiv diferența D300 ↔ P300 pre-completat. Contabilul reacționează când vine notificarea — nu poate PREVENI.

**Soluție:**
- Creez `lib/compliance/d300-p300-comparator.ts` (~80 linii)
- Endpoint `app/api/fiscal/p300-check/route.ts` (~50 linii) — apel ANAF SPV pentru pre-completata
- Generate finding cu countdown 20 zile dacă diferența >20% și ≥5K lei (per OUG 70/2024 modif. 89/2025)

**Effort:** ~150 linii.

### GAP #6 — Bulk import facturi ZIP (quick win UX)

**Problema:** contabilul cu 50 clienți × 100 facturi/lună = 5.000 drag-drops/lună inacceptabil.

**Soluție:**
- Endpoint `app/api/efactura/bulk-upload/route.ts` (~30 linii)
- Parse ZIP cu multiple XML-uri (folosesc `jszip` sau native browser unzip)
- Rulare validator V001-V011 pe fiecare în paralel (batch processing)
- UI: drag-drop area pentru ZIP în `efactura-validator-card.tsx`

**Effort:** ~50 linii.

### Total GAP-uri 2-6 fiscal-specific

**~550 linii cod nou** peste cele 5.870 deja livrate = 6.420 total Bundle D.

---

## 📌 SECȚIUNEA 8 — Sprint Plan (5 sprint-uri × 1 săptămână)

### Sprint 1 (Săpt 1) — GAP #2 Auto-repair Disclaimer LEGAL

**Goal:** Block legal CECCAR rezolvat. Fără asta, NU lansăm.

**Tasks:**
- Task 1.1: Banner disclaimer în `efactura-validator-card.tsx` (~30 linii UI)
- Task 1.2: Checkbox confirmare "Am revizuit și aprob conform CECCAR" (~10 linii)
- Task 1.3: Audit log apel `appendComplianceEvents` per fix (~20 linii)
- Task 1.4: Tests vitest pentru UI disclaimer (~30 linii test)

**DoD Sprint 1:**
- [ ] Banner disclaimer apare deasupra butonului auto-repair
- [ ] Checkbox required înainte de click "Apply fix"
- [ ] Audit log salvează: timestamp + user + fix code + XML before/after
- [ ] Test: imposibil de aplica fix fără checkbox marcat
- [ ] Commit: `feat(fiscal): GAP #2 auto-repair disclaimer + audit log`

### Sprint 2 (Săpt 2) — GAP #3 Cron SPV mock → real

**Goal:** Produsul devine autonom (cron real, nu trebuie click manual per client).

**Tasks:**
- Task 2.1: Modify `app/api/cron/efactura-spv-monthly/route.ts` să iterate orgs cu token ANAF (~30 linii)
- Task 2.2: Apel real `fetchSpvMessages(token, cui, 30)` per org (~20 linii)
- Task 2.3: Reuse `spvMessageToFinding()` din spv-check route (~10 linii)
- Task 2.4: Fallback graceful la mock dacă org NU are token (~20 linii)
- Task 2.5: Tests cron handler (~50 linii)

**DoD Sprint 2:**
- [ ] Cron rulează real pe toate orgs cu ANAF SPV token
- [ ] Findings generate automat per factură rejected/blocked/delayed
- [ ] Mock fallback pentru orgs fără token
- [ ] Tests: cron pe 5 orgs (3 cu token, 2 fără) → comportament corect
- [ ] Commit: `feat(fiscal): GAP #3 cron SPV mock → real`

### Sprint 3 (Săpt 3) — GAP #4 D406 SAF-T Upload

**Goal:** Engine-ul SAF-T hygiene deja există dar nu se poate folosi — adăugăm upload + verify.

**Tasks:**
- Task 3.1: Endpoint `app/api/fiscal/d406-upload/route.ts` (~150 linii)
  - Parser XML SAF-T multipart
  - Apel `computeSAFTHygieneScore()` existent
  - Generate findings
- Task 3.2: UI `components/compliscan/fiscal/SaftHygieneTab.tsx` (~80 linii)
- Task 3.3: Adăugare tab în `app/dashboard/fiscal/page.tsx` (~10 linii)
- Task 3.4: Tests upload + parser (~70 linii)

**DoD Sprint 3:**
- [ ] Drag-drop SAF-T XML → score 0-100 + findings
- [ ] Cross-check D300/D394/D390 evidențiat
- [ ] Hygiene history per client
- [ ] Tests: 5 SAF-T XML samples (clean / cu rectificări / cu missing data)
- [ ] Commit: `feat(fiscal): GAP #4 D406 SAF-T upload + hygiene UI`

### Sprint 4 (Săpt 4) — GAP #5 P300 vs D300 Comparator

**Goal:** Diferențiator unic — preventiv, NU reactiv.

**Tasks:**
- Task 4.1: Lib `lib/compliance/d300-p300-comparator.ts` (~80 linii)
  - Compare D300 declarat vs P300 pre-completat
  - Threshold detection (>20% și ≥5K lei)
  - Finding cu countdown 20 zile
- Task 4.2: Endpoint `app/api/fiscal/p300-check/route.ts` (~50 linii)
  - Pull P300 din ANAF SPV (când disponibil per CUI/perioadă)
- Task 4.3: UI integration cu DiscrepanciesTab existing (~20 linii)
- Task 4.4: Tests comparator + endpoint (~80 linii)

**DoD Sprint 4:**
- [ ] P300 pull din ANAF (real cu OAuth)
- [ ] Comparator detect diferențe peste threshold
- [ ] Finding generat preventiv (înainte de notificare ANAF)
- [ ] Countdown 20 zile + draft răspuns
- [ ] Tests: 4 scenarii (zero diff / sub threshold / la threshold / peste)
- [ ] Commit: `feat(fiscal): GAP #5 P300 vs D300 preventive comparator`

### Sprint 5 (Săpt 5) — GAP #6 Bulk ZIP Upload + Smoke Test

**Goal:** Quick win UX + acceptance test cap-coadă.

**Tasks:**
- Task 5.1: Endpoint `app/api/efactura/bulk-upload/route.ts` (~30 linii)
- Task 5.2: ZIP parser + parallel validation (~30 linii)
- Task 5.3: UI drag-drop ZIP în validator card (~20 linii)
- Task 5.4: Tests cu ZIP de 5/50 facturi (~30 linii)
- Task 5.5: Smoke test cap-coadă cu 3 personas (Diana DPO / Petre Contabil / Mihai Patron)
- Task 5.6: Build verde + push final
- Task 5.7: Open PR draft pentru review

**DoD Sprint 5 + LAUNCH READY:**
- [ ] Drag-drop ZIP → 50 facturi validate în 30 secunde
- [ ] Smoke test 3 personas:
  - Diana (cabinet-dpo): vede DOAR DPO modules, NU fiscal
  - Petre (cabinet-fiscal): vede DOAR fiscal modules, NU DPO
  - Mihai (patron): vede DOAR Trust Profile + Approvals + Dosar
- [ ] Cross-sell banner apare la URL direct restricted
- [ ] API 403 pentru tampering
- [ ] Build verde `npm run build` exit 0
- [ ] PR draft deschis cu descriere completă
- [ ] Commit: `feat(fiscal): GAP #6 bulk ZIP upload + Bundle D launch ready`

---

## 📌 SECȚIUNEA 9 — Implementation Order task by task

```
SPRINT 1 (Săpt 1) — Auto-repair Disclaimer
  Task 1.1 (~30 LOC): Banner disclaimer UI
  Task 1.2 (~10 LOC): Checkbox confirmare
  Task 1.3 (~20 LOC): Audit log integration
  Task 1.4 (~30 LOC): Tests
  Total: ~90 LOC + commit

SPRINT 2 (Săpt 2) — Cron SPV Real
  Task 2.1 (~30 LOC): Loop orgs cu token
  Task 2.2 (~20 LOC): fetchSpvMessages
  Task 2.3 (~10 LOC): Reuse spvMessageToFinding
  Task 2.4 (~20 LOC): Fallback mock
  Task 2.5 (~50 LOC): Tests
  Total: ~130 LOC + commit

SPRINT 3 (Săpt 3) — D406 Upload
  Task 3.1 (~150 LOC): Endpoint upload
  Task 3.2 (~80 LOC): SaftHygieneTab UI
  Task 3.3 (~10 LOC): Tab integration
  Task 3.4 (~70 LOC): Tests
  Total: ~310 LOC + commit

SPRINT 4 (Săpt 4) — P300 Comparator
  Task 4.1 (~80 LOC): Lib comparator
  Task 4.2 (~50 LOC): Endpoint
  Task 4.3 (~20 LOC): UI integration
  Task 4.4 (~80 LOC): Tests
  Total: ~230 LOC + commit

SPRINT 5 (Săpt 5) — Bulk ZIP + Launch
  Task 5.1 (~30 LOC): Endpoint
  Task 5.2 (~30 LOC): Parser
  Task 5.3 (~20 LOC): UI
  Task 5.4 (~30 LOC): Tests
  Task 5.5: Smoke test 3 personas (manual)
  Task 5.6: Build verde
  Task 5.7: PR draft deschis
  Total: ~110 LOC + smoke + PR

GRAND TOTAL Sprint 1-5:
  ~870 LOC nou (revizuit în sus de la ~550 estimate inițial — testele cresc)
  + 5 commit-uri majore
  + smoke test + PR
  ETA: 5 săptămâni (1 dev) sau 3 săpt (2 devs paralel)
```

---

## 📌 SECȚIUNEA 10 — Definition of Done pentru launch

### Functional

- [ ] Onboarding "Ce rol ai?" cu Contabil CECCAR primary option
- [ ] icpSegment="cabinet-fiscal" auto-set după selecție
- [ ] Sidebar arată DOAR fiscal modules (verified prin Layer 3 filter)
- [ ] Direct URL `/dashboard/dpia` → redirect cu cross-sell banner (Layer 4)
- [ ] API `/api/dpia POST` → 403 dacă cabinet-fiscal (Layer 5)
- [ ] Validator UBL CIUS-RO live (V001-V011 + warnings)
- [ ] Auto-repair cu disclaimer + checkbox + audit log (GAP #2)
- [ ] Cron SPV rulează lunar pe orgs cu token ANAF (GAP #3)
- [ ] D406 SAF-T upload + hygiene score 0-100 (GAP #4)
- [ ] P300 vs D300 cross-check preventiv (GAP #5)
- [ ] Bulk ZIP upload (GAP #6)
- [ ] e-TVA Discrepancy state machine (existent)
- [ ] ANAF SPV submit cu OAuth (existent)
- [ ] Audit Pack export per client (existent)

### Non-functional

- [ ] All existing tests still pass: `npx vitest run`
- [ ] Typecheck clean: `npx tsc --noEmit`
- [ ] No regression on `/dashboard/fiscal` core flow
- [ ] Build production verde: `npm run build` exit 0
- [ ] Smoke test 3 personas pass (Diana / Petre / Mihai)
- [ ] PR draft deschis cu descriere completă

### Business

- [ ] Stripe SKU-uri Bundle D: Solo €49 / Pro €199 / Studio €499 / Enterprise / Patron €39
- [ ] Landing `/pentru/contabil` (variantă lead-magnet)
- [ ] Calculator amenzi e-Factura B2C (lead magnet)
- [ ] SAF-T Hygiene Calculator (lead magnet, gratuit)
- [ ] Demo video Loom 5 min cu workflow complete
- [ ] Outreach plan pentru 10 cabinete prim target
- [ ] Parteneriat cu Adrian Bența / Universul Fiscal / CECCAR (înainte de scale)

---

## 📌 SECȚIUNEA 11 — Test Strategy

### 11.1 Vitest unit tests (deja: 1294/1300 PASS pe v3-unified)

Adăugăm:
- 30 LOC pentru GAP #2 (disclaimer UI)
- 50 LOC pentru GAP #3 (cron handler)
- 70 LOC pentru GAP #4 (D406 upload + parser)
- 80 LOC pentru GAP #5 (P300 comparator)
- 30 LOC pentru GAP #6 (ZIP upload)
- = ~260 LOC tests noi

### 11.2 Smoke test cap-coadă (manual cu 3 personas)

**Persona 1 — Diana (DPO)**
- Login cu icpSegment="cabinet-dpo"
- Sidebar arată: Acasă, Scanează, Resolve, Dosar, RoPA, DSAR, DPIA, Breach, Training, Magic-links, Cabinet Templates, Approvals, Settings
- Sidebar **NU arată**: Fiscal, e-Factura, SAF-T, Pay Transparency
- Direct URL `/dashboard/fiscal` → redirect /dashboard cu toast "Modulul Fiscal nu e disponibil"
- API call POST `/api/fiscal/spv-check` → 403 forbidden

**Persona 2 — Petre (Contabil CECCAR)**
- Login cu icpSegment="cabinet-fiscal"
- Sidebar arată: Acasă, Scanează, Resolve, Dosar, **Fiscal**, Calendar, Approvals, Scheduled Reports, Agent fiscal, Settings, Portfolio
- Sidebar **NU arată**: RoPA, DSAR, DPIA, NIS2, AI Act, DORA, Pay Transparency
- Workflow complet:
  1. Upload XML factură invalidă → vede V003 InvoiceTypeCode lipsă
  2. Click "Sugestie + Apply fix" cu disclaimer + checkbox CECCAR
  3. Audit log salvează fix
  4. XML reparat → submit ANAF SPV
  5. Cron SPV detectează factură respinsă → finding generat (mock pentru smoke)
  6. Resolve flow + retransmit
  7. Upload D406 SAF-T → vezi hygiene score
  8. Compară D300 vs P300 → vezi gap
  9. Bulk upload ZIP cu 5 facturi → toate validate

**Persona 3 — Mihai (Patron LogiTrans SRL)**
- Login cu accessMode="patron" peste icpSegment="solo"
- Sidebar arată DOAR: Acasă (Trust Profile), Approvals, Dosar (read-only download), Settings
- Sidebar **NU arată**: Scanează, Resolve, RoPA, etc. (tehnice)
- Click "Aprobă magic link" → 30 sec → done
- Click "Detalii tehnice" → blocked + banner

### 11.3 Build verification

```bash
npm run build
# Expected: exit code 0, doar warnings (zero errors)
```

---

## 📌 SECȚIUNEA 12 — Risks + Capcane

| Risc | Probabilitate | Impact | Mitigare |
|------|---------------|--------|----------|
| **Auto-repair fără disclaimer = malpraxis CECCAR** | High dacă launch fără GAP #2 | Critical (close product) | GAP #2 BLOCKER — fără el, nu lansăm |
| **Cron SPV mock în production** | Live now | High (produsul nu funcționează autonom) | GAP #3 prim sprint |
| **SmartBill copiază feature-ul** | Medium 12-18 luni | Medium | Diferențiere prin e-TVA + SAF-T workflow + agent autonom |
| **Channel direct online slab** (cabinetele cumpără pe trust) | Validated empirically | Medium | Parteneriat semnat cu Bența / Universul Fiscal / CECCAR ÎNAINTE de scale |
| **ANAF schimbă API SPV** | Low-Medium | Medium | Modular architecture pentru adapt <30 zile |
| **Saturație tooling** (contabilul are deja SmartBill+Saga+SPV) | High în piață | Medium | Pozitionare "layer compliance peste, NU înlocuire" + drag-drop XML |
| **Codex face conflict pe shared files** | Low (additive only) | Low | Protocol sync pe navigation.ts/dashboard-shell.tsx (deja documentat) |

### 3 capcane CRITICE evitate prin design

1. ✅ **"Auto-repair" silent NU permis** — UX disclaimer + click apply OBLIGATORIU
2. ✅ **NU concurăm cu SmartBill pe emisie** — pozitionare "layer compliance peste"
3. ✅ **NU lansăm fără parteneriat channel** — pre-launch step obligatoriu (Bența / CECCAR)

---

## 📌 SECȚIUNEA 13 — Pricing tier-uri Bundle D

| Tier | Preț/lună | Tier ID Stripe | Target | Limite |
|------|-----------|----------------|--------|--------|
| **Solo** | **€49-69** | `fiscal-solo` (revizuiesc) | Contabil 1, 5-30 clienți | 30 clienți, 500 facturi/lună |
| **Pro** ⭐ | **€199-249** | `fiscal-pro` (revizuiesc) | Contabil 50-100 clienți | 100 clienți, 5K facturi/lună |
| **Studio** | **€499-799** | `fiscal-studio` (NEW) | Cabinet 100-300 clienți | Nelimitat |
| **Enterprise** | **€999-2.999** | `fiscal-enterprise` (NEW) | Top 50 firme, 300+ clienți | Custom + SLA + dedicat |
| **Patron** | €39 | `fiscal-patron` (NEW) | Read-only owner pentru audit | 1 firmă, read-only |

**Anual cu 15-20% discount** (cash flow cabinet).

**Stripe SKU-uri lipsă în registry actual**:
- Trebuie ajustare `fiscal-solo` €299 → €49-69
- Trebuie ajustare `fiscal-pro` €699 → €199-249
- Adăugare `fiscal-studio` €499-799
- Adăugare `fiscal-enterprise` €999-2.999
- Adăugare `fiscal-patron` €39 (access mode tier)

**LOC Stripe registry update:** ~100 LOC.

---

## 📌 SECȚIUNEA 14 — Top 10 cabinete prim outreach NAMED

(Sursă: `docs/strategy/compliscan-10-roluri-spec-2026-05-09.md`)

1. **Vulpoi & Toader Management** (vtm.ro) — 38.8M RON cifră 2024, 134 angajați, Marcel Vulpoi thought-leader ZF
2. **Keez** (Visma group din 2023) — 7.000+ clienți, 100+ contabili parteneri
3. **Almih Expert** — premiu CECCAR locul 1 Dâmbovița 2024
4. **Cont Consult** — 200+ clienți, 15 ani CECCAR
5. **Expert Mind Iași** — locul 1 regional 10 ani consecutiv (influencer Moldova)
6. **Contello** (din 2007 București)
7. **REALCONT București** (din 2004)
8. **Dianex Ploiești**
9. **CONFI SERV Alexandria** (premiu CECCAR Teleorman)
10. **Profi Conta + ContabilulBun.ro**

### Channel partners de cucerit ÎNAINTE de scale

1. **Adrian Bența** — lector consacrat 15 ani, audiență Republica.ro + Universul Fiscal — split 30/70 sau €1.500-3.500/eveniment
2. **Nicoleta Banciu** (admin grup FB 65K Contabili) — webinar gratuit pentru audiență
3. **Universul Fiscal** — sponsorship newsletter + advertorial
4. **CECCAR Business Magazine** — €500-2.500/inserție
5. **CECCAR conferințe regionale** (41 filiale) — sponsorship local €500-3.000, național €5-15K
6. **CabinetExpert.ro** — sponsored content €200-800/articol

---

## 📌 SECȚIUNEA 15 — Trigger Events Calendar 2026

| Data | Eveniment | Lead magnet pre-eveniment | Pitch post-eveniment |
|------|-----------|---------------------------|---------------------|
| **1 ian 2026 (acum)** | Termen 5 zile lucrătoare + amendă B2B 15% | Calculator amenzi B2C/B2B | "Salvezi 15% × valoarea facturii cu auto-repair" |
| 15 ian 2026 | Persoane fizice CNP intră e-Factura | Ghid CNP e-Factura | "Volum nou +200K facturi pe contabil mediu" |
| 25 ale lunii | D300 deadline lunar | "D300 vs P300 calculator" | "Preventiv detectează diferențe înainte ANAF" |
| Sfârșit lună | D406 SAF-T deadline | "SAF-T Hygiene Calculator" | "Score 0-100 înainte de submit" |
| Mar 2026 | Conferința Națională CECCAR (regional) | Sponsorship local | "Live demo cu 3 cabinete pilot" |
| 1 iun 2026 | Fermieri obligație efectivă | Ghid agricultură e-Factura | "Vertical nou — fermieri" |
| 1 iul 2026 | Anniversar 1 an OUG 89/2025 | Retrospectiva impactului | Case studies cabinete pilot |

---

## 📌 SECȚIUNEA 16 — Surse + Cross-References

### Documente strategie (toate pe branch fiscal-launch)

- `docs/strategy/compliscan-final-validare-piata-2026-05-07.md` — Opus integrat 6.000 cuvinte
- `docs/strategy/compliscan-10-roluri-spec-2026-05-09.md` — 10 roluri + GPT corrections
- `docs/strategy/compliscan-IA-per-rol-2026-05-09.md` — IA per rol (10 vederi)
- `docs/strategy/bundle-d-fiscal-execution-plan-2026-05-09.md` — coordonare Codex + execution
- `docs/strategy/bundle-d-fiscal-master-execution-2026-05-09.md` — **acest document**

### Documente specs (în `docs/superpowers/specs/`)

- `2026-04-30-audit-fiscal-phase-1-market-validation.md`
- `2026-04-30-audit-fiscal-phase-2-workflow-validation.md`
- `2026-04-30-audit-fiscal-phase-3-framework-validation.md`
- `2026-05-01-buyer-validation-dpo-os.md` (transferat pe pay-transparency branch)
- `2026-05-01-buyer-validation-all-pillars-FINAL.md` (transferat)

### Commits relevante pe `feat/bundle-d-fiscal-launch`

- `c2201f7` docs(bundle-d): execution plan + Codex coordination
- `2d461bd` docs(strategy): 10-roluri spec
- `97b3127` docs(IA): Information Architecture per Rol
- `c8c5eab` feat(icp): module visibility filter (Layer 3)
- `28ff4fc` feat(icp): wire ICP filter chain
- `7dc95a5` feat(icp): Layer 4 route guard + cross-sell
- `c37c419` feat(icp): Layer 5 API permission helper

### Branch-uri în joc

- `main` — production stable (neatins)
- `v3-unified` — motor mature (neatins ca branch, dar worktree folosit)
- `feat/bundle-d-fiscal-launch` — branch-ul meu (pe origin)
- `dpo-os-claude-polish` — branch-ul Codex (DPO polish)

---

## 🔒 LOCK final

**Acest document = Master Execution pentru Bundle D Fiscal.**

Toate decizii produs/cod/strategie pentru fiscal sunt centrate aici.
Update obligatoriu la fiecare modificare majoră de scope sau strategie.

Următorul pas: Sprint 1 — GAP #2 Auto-repair Disclaimer (BLOCKER LEGAL).

---

🎯 **Bundle D = wedge product. Lansare mai-iulie 2026. Target: 5-15 paid pilots.**
