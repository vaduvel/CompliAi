# CompliScan — Information Architecture per Rol (10 vederi)

**Data:** 2026-05-09
**Versiune:** 1.0
**Status:** **SOURCE OF TRUTH** pentru ce vede fiecare rol în aplicație
**Scop:** elimina problema actuală — v3-unified afișează TOATE framework-urile la toți userii. Per acest doc, fiecare rol primește **UI restrâns la modulele lui**, plus cross-sell opt-in pentru extindere.

**Folosit ca input direct pentru:**
- GAP #1 implementation (`MODULES_PER_ICP` + `filterNavByIcp`)
- Onboarding refactor (4 top-level questions + sub-rol)
- Landing pages per rol (10 URLs publice)
- Sidebar/cockpit dynamic per rol

---

## 🏗 ARHITECTURA — 1 cod × 10 vederi × 4 bundle-uri

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1 CODEBASE (CompliScan v3-unified)                                    │
│ ├─ ENGINE complet: GDPR + NIS2 + AI Act + DORA + Fiscal + HR + ...   │
│ ├─ 562 fișiere sursă, 251 test, 1294/1300 PASS                        │
│ └─ Toate modulele coexistă în cod                                      │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              │ filtrat la runtime per icpSegment + role
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 10 VEDERI (UI per rol)                                                │
│ Fiecare rol vede DOAR modulele lui + cross-sell opt-in pentru restul │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4 BUNDLE-URI COMERCIALE                                                │
│ A — DPO Cabinet | B — HR Compliance | C — Banking | D — Fiscal       │
│ Plus: Patron tier (€39 add-on) + Auditor seat (free)                  │
└────────────────────────────────────────────────────────────────────────┘
```

**Regula de aur:** rolul determină modulele vizibile. Ce e ascuns rămâne deschis în spate (engine continuă să ruleze) dar **NU apare în sidebar / dashboard / search / quick actions**. Apare DOAR la cross-sell explicit.

---

## 📋 ONBOARDING REFACTOR — flow corectat (4 top-level + sub-rol)

### Pas 1 — Top-level (4 opțiuni, NU 10)

```
┌────────────────────────────────────────────┐
│ Bun venit în CompliScan!                   │
│ Ce rol ai?                                 │
├────────────────────────────────────────────┤
│ [🏢 Cabinet consultant]                    │
│   Servesc multipli clienți (DPO/contabil/  │
│   avocat/CISO/HR consultanță)              │
│                                            │
│ [🏭 Firmă / IMM]                           │
│   Lucrez intern la firma mea (5-500 ang.)  │
│                                            │
│ [📊 Contabil CECCAR]                       │
│   Cabinet contabil cu 5-300 clienți        │
│                                            │
│ [🔍 Auditor / Viewer]                      │
│   Audit extern, acces read-only la dosare  │
└────────────────────────────────────────────┘
```

### Pas 2 — Sub-rol (depinde de pas 1)

**Dacă "Cabinet consultant"** → 4 sub-roluri:
- DPO solo (1-15 clienți) → ICP: `cabinet-dpo` tier `cabinet-solo`
- Cabinet DPO multi-tenant (15-50+) → ICP: `cabinet-dpo` tier `cabinet-pro`/`studio`
- Avocat protecția datelor → ICP: `cabinet-dpo` cu sub-flag `legal-only`
- CISO / Cybersec consultant → ICP: `enterprise` cu sub-flag `cabinet-cyber`

**Dacă "Firmă / IMM"** → 4 sub-roluri:
- Owner / Patron (1-50 ang. solo) → ICP: `solo`
- HR Director / CHRO (50-500 ang.) → ICP: `imm-hr`
- Compliance Officer intern (50-250 ang.) → ICP: `imm-internal`
- Compliance Officer Banking/IFN → ICP: `imm-internal` cu sub-flag `banking`

**Dacă "Contabil CECCAR"** → 1 sub-rol direct:
- Cabinet fiscal (5-300+ clienți) → ICP: `cabinet-fiscal`

**Dacă "Auditor / Viewer"** → 1 sub-rol direct:
- Auditor extern → token-based access mode (NU ICP separat)

### Pas 3 — Patron mode (opțional, în orice ICP)

Owner-ul org-ului poate activa "Patron mode" (read-only approval mode) pentru:
- Aprobare magic links
- Vedere dashboard executive
- Audit pack download
- NU vede sidebar tehnic detaliat

---

## 🎨 CELE 10 ROLURI — IA detaliat per rol

### ROL 1 — DPO Consultant Solo

**Persona:** DPO independent, 5-15 clienți retainer (€100-400/client/lună)
**ICP:** `cabinet-dpo` cu tier `cabinet-solo` (€499/lună)
**Landing public:** `/dpo` ✅ (există în v3-unified)

**Onboarding:** Cabinet consultant → DPO solo → Wizard: import primii clienți (CUI prefill ANAF)

**Sidebar VIZIBIL:**
```
🏠 Acasă (cockpit cross-client cu workspace banner)
🔍 Scanează (per client)
✓ De rezolvat (findings GDPR + Legea 190 + AI Act light)
📂 Dosar (audit pack ZIP)
─── per client (workspace context)
📋 RoPA (Art. 30)
🔒 DPIA (Art. 35)
📨 DSAR (cereri 30 zile)
🚨 Breach ANSPDCP (72h)
🎓 Training tracker
🔗 Magic links (aprobare patron)
📑 Cabinet templates
✓ Approvals
─── secondary
📅 Calendar (deadlines GDPR)
📊 Rapoarte
⚙ Setări
```

**Sidebar ASCUNS (cross-sell opt-in):**
- ❌ Fiscal (e-Factura/SAF-T/e-TVA)
- ❌ NIS2 technical (apare doar dacă client e flagged NIS2 entity)
- ❌ DORA (banking)
- ❌ Pay Transparency
- ❌ Whistleblowing technical (advisory only)
- ❌ HR/REGES

**Cockpit dashboard:**
```
┌──────────────────────────────────────────────────┐
│ Bun venit, Diana — 8 clienți activi              │
├──────────────────────────────────────────────────┤
│ 🚨 Alerte critice (3)                            │
│   • LogiTrans: breach 72h notificare ANSPDCP    │
│   • CafeMobil: DSAR pending 5 zile               │
│   • Imobiliare X: AI Act gap detectat            │
│                                                  │
│ ⏳ În progres (12)                               │
│   • RoPA refactor 4 clienți                      │
│   • DPIA pending review 2                        │
│   • Magic link aprobare 6                        │
│                                                  │
│ ✅ Rezolvat luna asta (47)                       │
└──────────────────────────────────────────────────┘
```

**Top 5 user stories:**
1. *Ca DPO solo, vreau să văd peste noapte ce s-a întâmplat la cei 8 clienți într-un singur dashboard* → cockpit cross-client
2. *Ca DPO solo, vreau să generez DPA în 30 secunde cu datele clientului prefilled* → AI document generator
3. *Ca DPO solo, vreau magic link la patron ca să nu mai dau email-uri* → HMAC magic link approval
4. *Ca DPO solo, vreau audit pack ZIP gata de ANSPDCP în 1 click* → SHA-256 hash chain export
5. *Ca DPO solo, vreau să import istoric DSAR de la cabinetul anterior* → migration import

**Cross-sell trigger:**
- Dacă client are CUI flagged NIS2 → "Activează NIS2 module pentru acest client (+€XX/lună)"
- Dacă client are AI deployed → "Activează AI Act detailed module"

---

### ROL 2 — Cabinet DPO Multi-tenant ⭐

**Persona:** Cabinet 5-30 oameni, 15-50+ clienți, Managing Partner = decident
**ICP:** `cabinet-dpo` cu tier `cabinet-pro` (€999) sau `cabinet-studio` (€1.999)
**Landing public:** `/dpo` ✅

**Onboarding:** Cabinet consultant → Cabinet DPO multi-tenant → Setup white-label (logo+brand+signature) → Import primii clienți

**Sidebar VIZIBIL** (peste Rol 1, plus features cabinet):
```
─── Portofoliu (Cabinet) ───
📊 Portfolio Overview (cross-client)
🚨 Portfolio Alerts (urgency queue)
✓ Portfolio Tasks (ce-i de făcut today)
🏢 Vendors cross-client
📈 Portfolio Reports (lunar batch)
─── per client ───
[același set ca Rol 1]
─── Cabinet Admin ───
🎨 Branding (logo / color / signature)
👥 Team members (permissions per user)
📋 Cabinet templates (DPA/DSAR/RoPA propagate)
⚙ Migration Hub (import istoric)
💰 Cabinet billing (MRR per client)
```

**Sidebar ASCUNS** (la fel ca Rol 1, cross-sell add-on)

**Cockpit dashboard** (extins cu portfolio metrics):
```
┌────────────────────────────────────────────────────┐
│ Cabinet [Brand-uit] — 22 clienți activi            │
│ MRR cabinet: 8.700 RON | Profit margin: 38%       │
├────────────────────────────────────────────────────┤
│ 🚨 Urgency cross-client (8)                        │
│ ⏳ Pending approval patron (12)                    │
│ ✅ Audit packs livrabile (5 client-ready)          │
│                                                    │
│ 📊 Top clienți după risk score                    │
│   1. LogiTrans  ⚠️ 67 (3 findings)                │
│   2. CafeMobil  ⚠️ 73 (DSAR overdue)              │
│   ...                                              │
└────────────────────────────────────────────────────┘
```

**Top 5 user stories:**
1. *Ca Cabinet DPO, vreau să văd pe TOȚI clienții într-un dashboard cu urgency colorată*
2. *Ca Cabinet DPO, vreau template-urile mele propagate automat la toți clienții (DPA standard)*
3. *Ca Cabinet DPO, vreau audit pack lunar batch cu logo cabinet pentru 22 clienți într-un click*
4. *Ca Cabinet DPO, vreau să import 22 clienți din Excel în 1 oră (NU 22 ore)*
5. *Ca Cabinet DPO, vreau să văd revenue cabinet (MRR per client, churn) în Settings*

**Cross-sell trigger:**
- Client cu cifra >5M RON → "Acest client poate beneficia de NIS2 — activez modul (+€XX/lună rebillable)?"

---

### ROL 3 — Avocat Protecția Datelor

**Persona:** Avocat solo / boutique cu portofoliu GDPR + retainer €500-3.000/lună/client
**ICP:** `cabinet-dpo` cu sub-flag `legal-only`
**Landing public:** `/avocat` (de creat — folosește `LandingPageShell`)

**Onboarding:** Cabinet consultant → Avocat protecția datelor → Setup signature avocat + ISO 27001 declarat

**Sidebar VIZIBIL:**
```
🏠 Acasă (cockpit legal-first per client)
✓ De rezolvat (findings GDPR + AI Act + Whistleblowing legal)
📂 Dosar (evidence chain pentru instanță/ANSPDCP)
─── per client ───
📋 RoPA (Art. 30)
🔒 DPIA (Art. 35)
📨 DSAR (cu disclaimer legal "draft assistant")
🚨 Breach ANSPDCP
─── Legal-specific ───
⚖ Citation lookup (cross-link Lege5/Indaco)
📑 Templates legal (contracte DPA, NDA, deletion)
🔗 Magic link client (aprobare)
─── Cross-link extern ───
🌐 Indaco/Lege5 research (read-only widget)
```

**Sidebar ASCUNS:**
- ❌ Fiscal (avocatul nu face contabilitate)
- ❌ NIS2 technical
- ❌ DORA
- ❌ Pay Transparency calculator (advisory only via legal lens)
- ❌ Cabinet templates standard (avocatul are templates juridice diferite)

**Cockpit:**
```
┌──────────────────────────────────────────────┐
│ Cabinet Avocatura — 12 dosare active         │
├──────────────────────────────────────────────┤
│ ⚖ Cause active (5)                           │
│ 📨 DSAR cu disclaimer legal pending (3)      │
│ 🚨 Citație ANSPDCP iminentă (1)              │
│                                              │
│ 📑 Documente urgente review (8)              │
└──────────────────────────────────────────────┘
```

**Top 5 user stories:**
1. *Ca avocat, vreau document gen cu disclaimer "draft assistant — supus revizuirii avocat" pe fiecare PDF*
2. *Ca avocat, vreau audit pack hash chain pentru evidence chain instanță*
3. *Ca avocat, vreau cross-link spre Lege5 pentru orice articol citat*
4. *Ca avocat, vreau magic link client cu aprobare (NU email back-and-forth)*
5. *Ca avocat solo, vreau să vând 3 clienți în plus fără ore în plus*

**Cross-sell trigger:** N/A — avocatul rămâne legal-focused

---

### ROL 4 — CISO / Cybersec Consultant

**Persona:** Consultant cybersec/CISO cu 5-20 clienți, focus NIS2 + DORA + ISO 27001
**ICP:** `enterprise` cu sub-flag `cabinet-cyber`
**Landing public:** `/ciso` (de creat) sau reuse `/nis2` ✅

**Onboarding:** Cabinet consultant → CISO/Cybersec → Import NIS2 entity list + assessment 20Q

**Sidebar VIZIBIL:**
```
🏠 Acasă (cockpit cyber-first)
🔍 Scanează (per client)
✓ De rezolvat (findings NIS2 + DORA + ISO 27001)
📂 Dosar (audit pack cyber)
─── NIS2 ───
📋 NIS2 Assessment (20 întrebări Art. 21)
📊 NIS2 Maturity (10 domenii OUG 155/2024)
✓ DNSC Registration Wizard
🚨 Incident management (24h/72h)
─── DORA (cabinet cyber side) ───
📋 ICT third-party register
🧪 Resilience tests (TLPT)
🚨 Major ICT incidents
─── Cyber transversal ───
🛡 Vendor risk register (integrat e-Factura signals)
📑 ISO 27001 controls mapping
─── Cabinet ───
👥 Multi-client portfolio
🎨 White-label cabinet
```

**Sidebar ASCUNS:**
- ❌ Fiscal (e-Factura/SAF-T)
- ❌ HR/Pay Transparency
- ❌ AI Act detailed (apare doar la cross-sell)
- ❌ GDPR detaliat (advisory only via security lens)

**Cockpit:**
```
┌──────────────────────────────────────────────┐
│ Cabinet Cyber — 8 entități NIS2              │
├──────────────────────────────────────────────┤
│ 🚨 Incidents 24h pending (2)                 │
│ ⏳ Maturity gaps critice (15)                │
│ 🎯 DNSC submission ready (3)                 │
│                                              │
│ 📊 Coverage cross-client:                    │
│   • Asset mgmt: 78% avg                      │
│   • Access ctrl: 64%                         │
│   • Incident resp: 52%                       │
└──────────────────────────────────────────────┘
```

**Top 5 user stories:**
1. *Ca CISO consultant, vreau 20-question assessment NIS2 cu maturity score per domeniu*
2. *Ca CISO, vreau DNSC Registration Wizard cu draft email evidenta@dnsc.ro*
3. *Ca CISO, vreau OCR import din NIS2@RO Tool oficial DNSC (interoperabilitate)*
4. *Ca CISO, vreau vendor risk integrat cu e-Factura signals (vendor problematic)*
5. *Ca CISO cabinet, vreau white-label pentru rapoarte cyber per client*

**Cross-sell:** Client cu DPO needs → "Activez modul GDPR pentru acest client?"

---

### ROL 5 — Contabil CECCAR (Fiscal Layer) ⭐⭐ WEDGE

**Persona:** Contabil expert CECCAR cu 5-300+ clienți, retainer €40-200/client/lună
**ICP:** `cabinet-fiscal`
**Landing public:** `/fiscal` ✅ + `/pentru/contabil` (variantă lead-magnet de creat)

**Onboarding:** Contabil CECCAR → Setup CUI org + ANAF SPV OAuth + import primii clienți (CUI list)

**Sidebar VIZIBIL** (NUMAI Fiscal — TOTUL ASCUNS în rest):
```
🏠 Acasă (cockpit fiscal-first cross-client)
🔍 Scanează (XML facturi drag-drop / bulk ZIP)
✓ De rezolvat (findings fiscal: rejected, xml-error, e-TVA, SAF-T)
📂 Dosar (audit pack fiscal per client)
─── e-Factura ───
✅ Validator UBL CIUS-RO (V001-V011)
🛠 Auto-Repair XML (cu disclaimer + click apply)
📊 Status Interpreter ANAF SPV
🚨 Risk Dashboard (rejected/blocked/unsubmitted)
📡 Vendor Signals
🤖 Agent Fiscal Sensor (autonom)
─── e-TVA ───
⚖ Discrepancy Workflow (D300 vs P300 + countdown 20 zile)
─── SAF-T ───
📋 SAF-T D406 Hygiene Score 0-100
🔗 Cross-check D300/D394/D390
─── Per client ───
👥 Lista clienți cu risk score
📅 Calendar fiscal (B2C, B2B 5 zile, SAF-T 25, e-TVA 20)
─── Cabinet ───
🎨 Branding cabinet (logo/signature CECCAR)
👥 Multi-user permissions
```

**Sidebar ASCUNS COMPLET** (CRITIC — contabilul NU vede):
- ❌ GDPR (RoPA, DSAR, DPIA, breach, training)
- ❌ NIS2 technical
- ❌ AI Act
- ❌ DORA
- ❌ Pay Transparency
- ❌ Whistleblowing
- ❌ HR/REGES
- ❌ Magic links DPO patron approval (cabinetul fiscal NU folosește pattern-ul ăsta)

**Cockpit dashboard:**
```
┌──────────────────────────────────────────────────┐
│ Cabinet Fiscal [Brand] — 47 clienți activi      │
├──────────────────────────────────────────────────┤
│ 🚨 Alerte critice (12)                           │
│   • 3 facturi RESPINSE ANAF (V003 InvoiceTypeCode)│
│   • 2 e-TVA notificare (D300 vs P300 gap >5K)    │
│   • 1 SAF-T D406 deadline 3 zile                 │
│   • 6 facturi blocate >48h                       │
│                                                  │
│ ✓ Auto-fix sugestii (8)                          │
│   • V002 lipsă CustomizationID — 5 facturi       │
│   • T003 encoding — 3 facturi                    │
│   [Aplicare cu disclaimer + click apply]         │
│                                                  │
│ 📊 SAF-T Hygiene Score per client (top 5):       │
│   • LogiTrans   92/100  ✅                       │
│   • CafeMobil   78/100  ⚠️                       │
│   • Imobil X    45/100  🚨                       │
│                                                  │
│ 📅 Calendar fiscal — proxim termen 5 zile        │
└──────────────────────────────────────────────────┘
```

**Top 5 user stories:**
1. *Ca contabil cu 50 clienți, vreau să văd toate facturile RESPINSE ANAF într-un dashboard cu motivul + sugestie fix*
2. *Ca contabil, vreau auto-repair XML cu disclaimer "sugestie + click apply" — NU silent silent (responsabilitate CECCAR)*
3. *Ca contabil, vreau bulk upload ZIP cu 100 facturi → toate validate în 30 secunde*
4. *Ca contabil, vreau countdown 20 zile pentru fiecare notificare e-TVA cu draft răspuns gata*
5. *Ca contabil, vreau să mă alerteze cu 3 zile înainte de deadline SAF-T D406 cu hygiene score per client*

**Cross-sell trigger:** Client cu 50+ angajați → "Acest client poate beneficia de modul HR Pay Transparency. Activez? (cabinetul tău rebill-uiește la 200 RON/lună)"

---

### ROL 6 — HR Specialist (Pay Transp + Whistleblowing)

**Persona:** HR Manager/Director firmă 50-249 ang. SAU consultant HR multi-client
**ICP:** `cabinet-hr` (consultant) / `imm-hr` (intern firmă)
**Landing public:** `/hr` (de creat — există în `feat/pay-transparency-pillar` branch)

**Onboarding:** Firmă/IMM → HR Director SAU Cabinet consultant → HR consultant → Setup CSV grilă salarială + activare portal angajați

**Sidebar VIZIBIL:**
```
🏠 Acasă (cockpit HR-first)
🔍 Scanează (CSV salary upload)
✓ De rezolvat (findings Pay Transp + Whistleblowing + HR)
📂 Dosar (audit pack ITM-shaped)
─── Pay Transparency ───
📊 Pay Gap Calculator (M/F per role/dept)
📋 Job Architecture builder
🏷 Salary Range Generator (BestJobs/LinkedIn)
📨 Employee Request Portal (token + 30 zile timer)
📑 Raport ITM PDF
─── Whistleblowing ───
🚨 Public channel (token unic per org)
📨 Sesizări inbox (7 categorii anonim)
─── HR Compliance ───
👥 REGES import/export
🎓 Training tracker GDPR (HR awareness)
─── per client (dacă cabinet HR) ───
📊 Cross-client gap heatmap
📈 Lunar reports cu logo cabinet
```

**Sidebar ASCUNS:**
- ❌ Fiscal (e-Factura/SAF-T)
- ❌ NIS2 technical
- ❌ DORA
- ❌ AI Act detailed (advisory cross-link doar)
- ❌ DPO/GDPR detailed (DSAR/RoPA — apare DOAR la cross-sell)
- ❌ Cabinet DPO templates

**Cockpit:**
```
┌──────────────────────────────────────────────┐
│ HR Director — Firmă 247 angajați             │
│ Deadline 7 iunie 2026: 36 zile rămase        │
├──────────────────────────────────────────────┤
│ 📊 Gap salarial: 4.2% ✅ (sub prag 5%)       │
│ 🏷 Anunțuri job: 12/12 cu salary range ✅    │
│ 📨 Cereri angajați: 3 pending (max 22 zile)  │
│ 📋 Raport ITM: draft → approved → publish    │
│ 🚨 Whistleblowing: 0 sesizări active         │
└──────────────────────────────────────────────┘
```

**Top 5 user stories:**
1. *Ca HR Director, vreau upload CSV grilă salarială → vezi gap M/F în 30 secunde*
2. *Ca HR Director, vreau salary range gata pentru anunțul de job în BestJobs format*
3. *Ca HR Director, vreau employee request portal cu countdown 30 zile + auto-reply*
4. *Ca HR Director, vreau raport ITM PDF gata de submit (NU Excel + Word manual)*
5. *Ca cabinet HR, vreau cross-client gap heatmap pentru 20 firme client*

**Cross-sell:** Firmă cu activitate AI → "Activez modul AI Act dacă firma folosește HR scoring?"

---

### ROL 7 — AI Governance Specialist

**Persona:** Foarte rar pur — combinație DPO senior + AI engineer + jurist (real: 500-800 hibrizi în RO)
**ICP:** `enterprise` cu sub-flag `ai-gov`
**Landing public:** `/ai-act` (de creat) sau `/ai-governance`

**Onboarding:** Cabinet consultant SAU Firmă → AI Gov specialist → Inventar sisteme AI deployed (auto-classifier 7 tipuri)

**Sidebar VIZIBIL:**
```
🏠 Acasă (cockpit AI-first)
🔍 Scanează (AI system inventory)
✓ De rezolvat (findings AI Act per sistem)
📂 Dosar (Annex IV technical documentation)
─── AI Act ───
🤖 AI System Inventory (auto-classifier 7 tipuri)
📊 Risk Classification (4 levels: prohibited/high/limited/minimal)
📋 Annex IV Lite (10 secțiuni)
🌐 EU AI Database JSON exporter
✓ Conformity assessment per sistem
📑 Evidence pack generator
─── Cross-link ───
⚖ GDPR Art. 22 (decizii automatizate)
─── Obligații sync ───
🔄 Auto-sync obligation per role (provider/deployer/distributor)
```

**Sidebar ASCUNS:**
- ❌ Fiscal
- ❌ NIS2 technical (apare DOAR dacă firma e și NIS2 entity)
- ❌ DORA
- ❌ Pay Transparency
- ❌ HR detalii
- ❌ DPO detalii (cross-link Art. 22 only)

**Cockpit:**
```
┌──────────────────────────────────────────────┐
│ Banca Transilvania — 7 sisteme AI deployed   │
│ Deadline 2 aug 2026: high-risk obligatorii   │
├──────────────────────────────────────────────┤
│ 🤖 Sisteme AI clasificate:                   │
│   • Întreb BT chatbot      LIMITED ✅        │
│   • AIvolution scoring     HIGH-RISK ⚠️      │
│   • Fraud detection        HIGH-RISK ⚠️      │
│   • HR screening           HIGH-RISK 🚨      │
│   • Marketing recommend    LIMITED ✅        │
│                                              │
│ 📋 Annex IV pending: 3 sisteme               │
│ 🌐 EU Database submit: 1 ready               │
└──────────────────────────────────────────────┘
```

**Top 5 user stories:**
1. *Ca AI Gov, vreau auto-classifier care îmi pune sistemele în 4 risk levels*
2. *Ca AI Gov, vreau Annex IV Lite cu 10 secțiuni pre-completate*
3. *Ca AI Gov, vreau obligation sync automat (provider vs deployer)*
4. *Ca AI Gov, vreau evidence pack pe sistem cu link la GDPR Art. 22*
5. *Ca AI Gov, vreau export JSON pentru EU AI Database*

**Cross-sell:** Firmă cu DPO existing → "Cross-link AI Act cu RoPA-ul tău GDPR"

---

### ROL 8 — Compliance Officer Banking/IFN ⭐ ARPU MARE

**Persona:** Angajat intern bancă/IFN/asigurări RO, salar €34-43K, profesionist cross-framework
**ICP:** `imm-internal` cu sub-flag `compliance-banking`
**Landing public:** `/banking` (de creat)

**Onboarding:** Firmă/IMM → Compliance Officer Banking → Setup framework-uri (DORA + NIS2 + GDPR + Whistleblowing) + import sisteme ICT

**Sidebar VIZIBIL** (CROSS-FRAMEWORK — vede multe, dar NU Fiscal/HR):
```
🏠 Acasă (cockpit cross-framework)
🔍 Scanează
✓ De rezolvat (findings DORA + NIS2 + GDPR)
📂 Dosar (audit pack BNR/ASF reporting)
─── DORA ───
🚨 Incidents (4h/24h/72h/1lună DEISP)
🏢 TPRM (criticality + contracts + assessments)
🧪 Resilience Tests (TLPT)
📊 ICT register
─── NIS2 ───
📋 Assessment Art. 21
📊 Maturity 10 domenii
✓ DNSC Registration
─── GDPR ───
📋 RoPA banking-specific
📨 DSAR
🚨 Breach ANSPDCP
─── Whistleblowing ───
🚨 Channel intern (Lege 361/2022)
─── Cross-mapping ───
🔗 GDPR + NIS2 + DORA register-uri
📊 Risk Dashboard cross-framework
─── Reporting ───
📑 BNR/ASF reports format compatible
```

**Sidebar ASCUNS:**
- ❌ Fiscal (banking nu face e-Factura cu CompliScan)
- ❌ Pay Transparency (HR job, nu compliance)
- ❌ AI Act detalii (cross-link DORA only)
- ❌ Cabinet templates DPO

**Cockpit:**
```
┌──────────────────────────────────────────────┐
│ TBI Bank — Compliance Officer Cockpit         │
│ DORA OUG 14/2026 active                      │
├──────────────────────────────────────────────┤
│ 🚨 Incidents pending (3)                     │
│   • Major incident DEISP 4h: ✅ submitted    │
│   • Significant 24h: ⏳ in progress          │
│                                              │
│ 🏢 TPRM critical vendors (12)                │
│   • SaaS payment processor: ⚠️ contract gap  │
│   • Cloud hosting: ✅ resilience tested      │
│                                              │
│ 📋 Cross-framework coverage:                 │
│   • DORA: 78%   NIS2: 64%   GDPR: 92%        │
└──────────────────────────────────────────────┘
```

**Top 5 user stories:**
1. *Ca Compliance Officer banking, vreau să raportez incident major DEISP în 4h cu draft auto*
2. *Ca Compliance Officer, vreau TPRM cu criticality + contracts + assessments per ICT vendor*
3. *Ca Compliance Officer, vreau cross-mapping GDPR + NIS2 + DORA (un singur registru)*
4. *Ca Compliance Officer, vreau export raport BNR/ASF format compatible*
5. *Ca Compliance Officer, vreau modular architecture care se adaptează rapid la ghidări secundare BNR*

**Cross-sell:** N/A — banking deja vede multe. Eventual AI Act dacă banca deployează AI

---

### ROL 9 — Patron / CEO IMM (Access Mode)

**Persona:** Fondator firmă 50-200 ang., decide rapid sub €5K/an, NU face muncă tehnică
**ICP:** `solo` SAU `imm-internal` cu **patron access mode** (NU ICP separat)
**Landing public:** `/patron` sau `/owner` (sau bundle pe `/imm`)

**Onboarding:** Firmă/IMM → Owner/Patron → Read-only mode + invitație consultant

**Sidebar VIZIBIL** (drastic redus, executive view):
```
🏠 Trust Profile (status global, score, alertă)
✓ Aprobare magic links (DPO/CISO/contabil cere aprobare)
📂 Dosar (read-only download)
📊 Rapoarte lunare (executive summary)
⚙ Setări (invitare consultant, billing)
```

**Sidebar ASCUNS:**
- ❌ Detaliile tehnice (RoPA fields, XML, SAF-T XML, NIS2 maturity questions)
- ❌ Generator documente (consultantul face)
- ❌ Vendor risk register
- ❌ Multi-user permissions

**Cockpit:**
```
┌──────────────────────────────────────────────┐
│ LogiTrans SRL — Status global                │
├──────────────────────────────────────────────┤
│ 🟢 GDPR: 92/100 — pregătit pentru ANSPDCP    │
│ 🟡 NIS2: 64/100 — 3 măsuri pending           │
│ 🟢 e-Factura: live — 0 erori luna asta       │
│                                              │
│ ⏳ Aprobări pending (2):                     │
│   • DPO cere aprobare DPA pentru AWS         │
│   • Contabil cere validare retransmitere     │
│   [Aprobă în 30 secunde]                     │
│                                              │
│ 📊 Trust Profile public:                     │
│   compliscan.ro/trust/logitrans              │
└──────────────────────────────────────────────┘
```

**Top 5 user stories:**
1. *Ca patron, vreau să aprob magic links în 30 secunde fără să mai pierd email-uri*
2. *Ca patron, vreau Trust Profile public pentru due diligence cu clienți*
3. *Ca patron, vreau dovadă agregată color-coded când vine ANAF/ANSPDCP*
4. *Ca patron, vreau să dorm liniștit — totul e ok pentru autorități*
5. *Ca patron, vreau invitați consultanți DPO/contabil/CISO în mod centralizat*

**Pricing:** tier add-on €39 (1 consultant) / €79 (3) / €149 (DORA/NIS2 modules)

---

### ROL 10 — Auditor Extern / Regulator (Access Mode)

**Persona:** Auditor financiar/IT/cybersec extern. Big4 NU prim target (au tools proprii). Mid-tier (BDO, Forvis Mazars, Crowe, Grant Thornton, RSM) = sweet spot referral.
**ICP:** N/A — **token-based read-only access mode** (NU ICP separat)
**Landing public:** N/A — onboarding via token primit de la cabinetul/firma audited

**Onboarding:** Click pe link token primit prin email → no signup → direct la audit pack

**Sidebar VIZIBIL** (minim, evidence-only):
```
📂 Audit Pack (read-only)
   • MANIFEST.json
   • Traceability matrix Excel
   • Hash chain SHA-256 verify
🔍 Search findings + evidence
📊 Executive summary
✓ Verify integrity hash chain
```

**Sidebar ASCUNS** (TOTUL):
- ❌ Generator documente
- ❌ Toate framework-urile detailed
- ❌ Setări
- ❌ Multi-tenant

**Modelul economic:**
- **FREE** for auditor (token gratis)
- **Paid by audited firm** (cabinet/firmă plătește abonamentul, auditor vine free-seat)
- Economisește 10h/audit × €100/h = €1K/audit pentru auditor
- 30 audituri/an × €1K = €30K economisit
- Tu NU îi ceri 0 EUR — îi ceri **recomandare la clienți** (referral channel)

**Top 3 user stories:**
1. *Ca auditor, vreau să verific hash chain SHA-256 al audit pack-ului în 30 secunde*
2. *Ca auditor, vreau export Excel-compatible al traceability matrix*
3. *Ca auditor, vreau read-only access fără să creez cont (token-based)*

**Capcană:** claim "BNR/ASF acceptă export CompliScan" → scoate până la primul case study verificat. Înlocuiește cu "format compatibil RTS DORA"

---

## 🗺 MODULE ACCESS MATRIX (10 roluri × 25 module)

| Modul | DPO solo | Cabinet DPO | Avocat | CISO | Contabil ⭐⭐ | HR | AI Gov | Banking | Patron | Auditor |
|-------|---------|------------|--------|------|------------|-----|--------|---------|--------|---------|
| **GDPR core** | ✅ | ✅ | ✅ | 🔗 | ❌ | 🔗 | 🔗 | ✅ | 📊 | 📊 |
| RoPA Art. 30 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 📊 |
| DPIA Art. 35 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | 🔗 | ✅ | ❌ | 📊 |
| DSAR | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | 📊 |
| Breach ANSPDCP 72h | ✅ | ✅ | ✅ | 🔗 | ❌ | ❌ | ❌ | ✅ | 🚨 | 📊 |
| Magic link approval | ✅ | ✅ | ✅ | 🔗 | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Cabinet templates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **NIS2 Assessment 20Q** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | 📊 | 📊 |
| NIS2 Maturity 10 dom | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | 📊 | 📊 |
| DNSC Registration | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **AI Act Inventory** | 🔗 | 🔗 | 🔗 | 🔗 | ❌ | 🔗 | ✅ | 🔗 | 📊 | 📊 |
| AI Act Annex IV | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | 🔗 | ❌ | 📊 |
| **DORA incidents** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | 🚨 | 📊 |
| DORA TPRM | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 📊 |
| DORA TLPT | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **e-Factura validator** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 📊 | 📊 |
| Auto-repair XML | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| e-TVA discrepancy | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 📊 | 📊 |
| SAF-T Hygiene | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | 📊 | 📊 |
| ANAF SPV submit | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Pay Transparency** | ❌ | 🔗 | 🔗 | ❌ | ❌ | ✅ | ❌ | ❌ | 📊 | 📊 |
| Pay Gap Calculator | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | 📊 | 📊 |
| Salary Range Generator | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Employee Request Portal | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Whistleblowing** | 🔗 | 🔗 | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | 📊 | 📊 |
| **Vendor risk** | ✅ | ✅ | 🔗 | ✅ | ❌ | ❌ | ❌ | ✅ | 📊 | 📊 |
| **Audit Pack** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Trust Profile** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Multi-tenant** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **White-label** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Legenda:**
- ✅ = vede + folosește activ
- ❌ = NU vede în sidebar
- 🔗 = nu vede ca modul, dar primește cross-link din alt modul (ex: Avocat vede Pay Transparency ca legal advisory link)
- 📊 = read-only / aggregate view (Patron + Auditor — văd doar dacă orgul folosește acel modul)
- 🚨 = primește notificări critice (Patron e alertat dacă apare breach)

---

## 🗂 ICP SEGMENT MAPPING (final, cu sub-flags)

```typescript
type IcpSegment =
  | "solo"           // Patron / Owner IMM mic
  | "cabinet-dpo"    // DPO solo + Cabinet DPO multi + Avocat (sub-flag legal-only)
  | "cabinet-fiscal" // Contabil CECCAR
  | "cabinet-hr"     // Cabinet HR consultant multi-tenant
  | "imm-internal"   // Compliance Officer intern (sub-flag banking pentru ROL 8)
  | "imm-hr"         // HR Director / CHRO intern firmă
  | "enterprise"     // CISO + AI Gov (sub-flag cabinet-cyber pentru ROL 4, ai-gov pentru ROL 7)

type SubFlag =
  | "legal-only"      // Avocat în cabinet-dpo
  | "cabinet-cyber"   // CISO în enterprise
  | "ai-gov"          // AI Gov în enterprise
  | "banking"         // Compliance banking în imm-internal

type AccessMode =
  | "owner"           // Default — full access la modulele ICP-ului
  | "patron"          // Read-only approval mode (peste oricare ICP)
  | "auditor-token"   // Token-based read-only (NU e ICP, e mod de acces)
```

**Map ROL → ICP + SubFlag + Access Mode:**

| Rol | ICP | SubFlag | AccessMode |
|-----|-----|---------|------------|
| 1 DPO solo | `cabinet-dpo` | — | owner |
| 2 Cabinet DPO multi | `cabinet-dpo` | — | owner |
| 3 Avocat | `cabinet-dpo` | `legal-only` | owner |
| 4 CISO/Cybersec | `enterprise` | `cabinet-cyber` | owner |
| 5 Contabil ⭐⭐ | `cabinet-fiscal` | — | owner |
| 6 HR Specialist | `cabinet-hr` / `imm-hr` | — | owner |
| 7 AI Governance | `enterprise` | `ai-gov` | owner |
| 8 Compliance Banking | `imm-internal` | `banking` | owner |
| 9 Patron | (peste oricare) | — | `patron` |
| 10 Auditor extern | (token-based) | — | `auditor-token` |

---

## 🚧 IMPLEMENTATION GAPS — ce lipsește în cod ACUM

### Code (cap-coadă pentru a livra IA per rol)

| # | Gap | Effort | Status |
|---|-----|--------|--------|
| 1 | `lib/compliscan/icp-modules.ts` cu `MODULES_PER_ICP` 7 segmente + sub-flags | 80 linii | 🔵 NEXT (GAP #1) |
| 2 | `filterNavByIcp(sections, icpSegment, subFlag)` în navigation.ts | 30 linii | 🔵 NEXT |
| 3 | Apel filter în `dashboard-shell.tsx` | 10 linii | 🔵 NEXT |
| 4 | Onboarding refactor 4 top-level → sub-rol | 200 linii | ⏳ Pending |
| 5 | 6 landing pages noi: `/avocat` `/ciso` `/ai-act` `/banking` `/patron` `/hr` (ultimul există în branch PT) | 80 linii × 6 = 480 | ⏳ Pending |
| 6 | Stripe tier-uri pentru sub-flags noi (lawyer, ciso, ai-gov, banking) | 100 linii | ⏳ Pending |
| 7 | Patron access mode flag pe user (read-only over any ICP) | 60 linii | ⏳ Pending |
| 8 | Auditor token endpoint + landing minim cu hash verify | 120 linii | ⏳ Pending |
| 9 | Cross-sell trigger UI ("Activez modul X pentru acest client?") | 100 linii | ⏳ Pending |
| 10 | Cockpit dashboard variant per rol (10 vederi) | 50-100 linii × 10 = 500-1000 | ⏳ Pending |

**Total ACUM:** **~1.500-2.000 linii** pentru IA completă cap-coadă (NU doar Bundle D fiscal).

**Ordinea atac autonom (revizuită):**
1. `icp-modules.ts` + filter sidebar (GAP #1) — 120 linii
2. 6 landing pages noi — 480 linii (lansare wide top-funnel)
3. Onboarding refactor 4 top-level + sub-rol — 200 linii
4. Stripe tier-uri sub-flags — 100 linii
5. Cockpit variants per rol — 500-1000 linii (ultimul, după ce primele sunt validate)

---

## 📐 PRINCIPII LOCKED

1. **1 cod horizontal × 10 vederi** — engine-ul rulează pentru tot, UI restrânge.
2. **Sidebar = single source of truth pentru ce vede fiecare** — dacă nu apare în sidebar, modulul e ascuns (chiar dacă engine e activ).
3. **Cross-sell ÎN APP, NU forțat** — modul ascuns apare la trigger explicit ("Vrei să activezi NIS2?")
4. **Patron + Auditor NU sunt ICPs** — sunt access modes peste oricare ICP/org.
5. **Onboarding = 4 top-level questions, NU 10** — sub-rol e pasul 2.
6. **ICP dictates pricing tier** — Stripe tier per `(icpSegment, subFlag)` combo.
7. **Mobile/responsive** — toate cele 10 vederi merg pe mobile (bottom sheet pentru sidebar).

---

## 🎯 BUSINESS GOAL

Acest doc rezolvă **3 probleme reale**:

1. ❌ Acum DPO vede Fiscal și NIS2 → confuzie, refuză produsul
2. ❌ Acum Contabil vede DPO/AI Act → "ce-i ăsta? Nu-i pentru mine"
3. ❌ Acum onboarding vrea 10 alegeri → utilizator pleacă

✅ Cu IA per rol implementată: **fiecare rol vede DOAR uneltele lui, cross-sell la trigger explicit, lansare 10 fronts inbound + 2-3 outbound focused.**

Aceasta este **infrastructura care permite pariul tău "10 fronts simultan"** — fără să dilueze experiența pentru niciun rol.

---

🔒 **LOCK:** acest doc = SOURCE OF TRUTH pentru IA. Toate modificările UI/onboarding/sidebar/landing trebuie să referențieze acest doc. Update obligatoriu la: schimbare ICP, schimbare module accessibility, lansare rol nou.
