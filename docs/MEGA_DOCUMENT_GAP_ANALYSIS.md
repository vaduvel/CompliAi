# CompliAI - Mega Document Gap Analysis
## Comparativ: Ce e în document vs Ce avem în cod

> Analiză: Martie 2026
> Document de referință: "CompliAI – Mega Document: Execuția către 100% Market Fit" v3.0 (28 martie 2026)

---

## EXECUTIVE SUMMARY

| Fază Document | Status Real | Gap Major |
|---------------|-------------|-----------|
| **Faza 0: Fundația** | ⚠️ 60% | Lipsesc: ONRC, Approval Queue, Auto-repair complet |
| **Faza 1: Spine Operațional** | ⚠️ 50% | Lipsesc: Findings tabel, Auto-link dovezi, Card "Ce am protejat" |
| **Faza 2: Partner & Scalare** | ⚠️ 40% | Lipsesc: White-label, Batch actions complete |
| **Faza 3: Completare Legislative** | ⚠️ 70% | NIS2/DORA bine, AI Act partial, Whistleblowing OK |
| **Faza 4: Automatizare Avansată** | ❌ 0% | Nu există agenți specializați |

---

## DETALIAT PE SPRINTURI

### FAZA 0: FUNDAȚIA (Sprinturile 1–2)

#### Sprint 1: ONRC Auto-Detect & Applicability Engine

| Task din Document | Status Real | Note |
|-------------------|-------------|-------|
| **Integrare ONRC API** | ❌ **NU EXISTĂ** | Nu există nicio integrare cu ONRC |
| **Creare tabel organizations** | ✅ Există | Tabela există dar câmpuri limitate |
| **Formular onboarding** | ✅ Există | User introduce CUI dar FĂRĂ auto-complete din ONRC |
| **Applicability Engine** | ✅ Există | Funcționează în `/lib/compliance/applicability.ts` |
| **Dashboard - card framework-uri aplicabile** | ✅ Există | Se afișează pe dashboard |

**GAP CRITICAL:** Fără ONRC integration, user-ul trebuie să introducă manual toate datele (CUI, sector, angajați, etc.)

---

#### Sprint 2: e-Factura Validator + Auto-Repair & Approval Queue

| Task din Document | Status Real | Note |
|-------------------|-------------|-------|
| **e-Factura validator** | ✅ Există | `/api/efactura/validate` funcționează |
| **Auto-repair engine** | ⚠️ **PARȚIAL** | Repară basic XML errors dar NU completează CUI din profil automat |
| **Creare tabel pending_actions** | ❌ **NU EXISTĂ** | Tabela NU există |
| **Approval Queue UI** | ❌ **NU EXISTĂ** | Nu există `/approvals` page |
| **e-Factura repair flow** | ⚠️ **PARȚIAL** | Exista `/api/efactura/repair` dar fără approval queue |

**GAP CRITICAL:** 
- Nu există sistem de Approval Queue
- Auto-repair nu completează automat CUI din profilul firmei

---

### FAZA 1: SPINE OPERAȚIONAL (Sprinturile 3–5)

#### Sprint 3: Findings & Dosar

| Task din Document | Status Real | Note |
|-------------------|-------------|-------|
| **Creare tabel findings** | ❌ **NU EXISTĂ** | Tabela findings NU există ca tabel separată |
| **Generare findings din scanare** | ⚠️ **PARȚIAL** | Findings sunt în ComplianceState, nu în DB |
| **Dosar (Audit Dossier)** | ✅ Există | `/dashboard/dosar` funcționează |
| **Auto-link findings - dovezi** | ❌ **NU EXISTĂ** | Nu există linking automat |

**GAP CRITICAL:** Findings sunt stocate în memory/JSON files, nu în DB. Nu pot fi query-uite eficient.

---

#### Sprint 4: RoPA Generator & Auto-Remedieri Low-Risk

| Task din Document | Status Real | Note |
|-------------------|-------------|-------|
| **RoPA generator** | ✅ Există | `/dashboard/ropa` complet funcțional |
| **UI RoPA** | ✅ Există | Preview, edit, export PDF |
| **Auto-remediere low-risk** | ❌ **NU EXISTĂ** | Nu există sistem de auto-apply pentru low-risk |
| **Setări utilizator - nivel autonomie** | ❌ **NU EXISTĂ** | Nu există pagina de setări pentru autonomy level |

**GAP:** Nu există conceptul de "autonomy level per risk category"

---

#### Sprint 5: e-Factura Submit & Notificări

| Task din Document | Status Real | Note |
|-------------------|-------------|-------|
| **Integrare ANAF SPV (submit)** | ❌ **NU EXISTĂ** | Nu există integrare cu SPV ANAF |
| **Flow submit e-Factura** | ❌ **NU EXISTĂ** | Nu se poate trimite facturi la ANAF |
| **Sistem notificări** | ⚠️ **PARȚIAL** | Există notification store dar fără email real |
| **Card "Ce am protejat"** | ❌ **NU EXISTĂ** | Nu există card cu metrics pe dashboard |

**GAP CRITICAL:** Nu se poate trimite facturi la ANAF SPV. Card "ce am protejat" nu există.

---

### FAZA 2: PARTNER & SCALARE (Sprinturile 6–8)

#### Sprint 6: White-Label & CSV Import

| Task din Document | Status Real | Note |
|-------------------|-------------|-------|
| **White-label pentru parteneri** | ❌ **NU EXISTĂ** | Nu există sistem de branding personalizat |
| **CSV import clienți** | ✅ Există | `/api/partner/import-csv` funcționează |
| **UI import** | ⚠️ **PARȚIAL** | Există dar nu e complet |

**GAP CRITICAL:** White-label NU există - partenerii nu pot seta logo/culori/domeniu propriu

---

#### Sprint 7: Batch Actions & Rapoarte Programate

| Task din Document | Status Real | Note |
|-------------------|-------------|-------|
| **Batch actions** | ❌ **NU EXISTĂ** | Nu există sistem de batch operations |
| **Rapoarte programate** | ❌ **NU EXISTĂ** | Nu există scheduled reports |
| **Portfolio dashboard** | ✅ Există | `/portfolio` funcționează |

**GAP:** Batch actions și scheduled reports nu există

---

#### Sprint 8: Vendor Management & Audit Log

| Task din Document | Status Real | Note |
|-------------------|-------------|-------|
| **Vendor registry** | ⚠️ **PARȚIAL** | Există dar nu e complet |
| **Auto-scoring propus** | ❌ **NU EXISTĂ** | Nu există scoring automat |
| **Audit Log export** | ⚠️ **PARȚIAL** | Există audit log dar export limitat |

**GAP:** Auto-scoring pentru vendors nu există

---

### FAZA 3: COMPLETARE CADRU LEGISLATIV (Sprinturile 9–11)

#### Sprint 9: NIS2 & DORA

| Task din Document | Status Real | Note |
|-------------------|-------------|-------|
| **NIS2 eligibility wizard** | ✅ Există | Complet implementat |
| **NIS2 assessment** | ✅ Există | Complet implementat |
| **DNSC reporting** | ⚠️ **PARȚIAL** | Generează raport dar nu e automat |
| **DORA assessment** | ✅ Există | Complet implementat |

**Status: BINE** (~90%)

---

#### Sprint 10: AI Act & Whistleblowing

| Task din Document | Status Real | Note |
|-------------------|-------------|-------|
| **AI Inventory** | ✅ Există | Complet implementat |
| **AI Act conformity** | ⚠️ **PARȚIAL** | Classification există, conformity parțial |
| **Whistleblowing platform** | ✅ Există | Complet implementat |

**Status: BINE** (~80%)

---

#### Sprint 11: Pay Transparency & Monitorizare Legislativă

| Task din Document | Status Real | Note |
|-------------------|-------------|-------|
| **Pay Transparency** | ✅ Există | Finding generat automat |
| **Drift detection** | ⚠️ **PARȚIAL** | Cron job există dar NU generează auto-tasks |
| **UI drift alerts** | ❌ **NU EXISTĂ** | Nu există pagina de drift alerts |

**GAP CRITICAL:** Drift detection detectează schimbări dar NU generează task-uri automate

---

### FAZA 4: AUTOMATIZARE AVANSATĂ

| Task din Document | Status Real |
|-------------------|-------------|
| **Agenți specializați (e-Factura, DSAR)** | ❌ **NU EXISTĂ** |
| **Auto-învățare din corecții** | ❌ **NU EXISTĂ** |
| **Predictive risk** | ❌ **NU EXISTĂ** |
| **Integrare Slack/Teams** | ❌ **NU EXISTĂ** |

**Status: 0%**

---

## TABELE DE DATE - COMPARATIV

| Tabel din Document | Status Real |
|-------------------|-------------|
| `organizations` (extins) | ⚠️ Există dar fără câmpuri complete |
| `pending_actions` | ❌ **NU EXISTĂ** |
| `findings` | ❌ **NU EXISTĂ** ca tabel separată |
| `user_settings` (autonomie) | ❌ **NU EXISTĂ** |
| `partners` | ⚠️ Există dar fără branding fields |

---

## INTEGRĂRI EXTERNE - STATUS

| Integrare | Status Document | Status Real |
|-----------|----------------|-------------|
| ONRC API | Faza 0 | ❌ **NU EXISTĂ** |
| ANAF SPV API | Faza 1 | ❌ **NU EXISTĂ** |
| SendGrid/Resend | Faza 1 | ⚠️ **PARȚIAL** (doar store, fără trimitere) |
| Stripe/PayU | Există | ✅ Există |
| Google Calendar | Faza 2 | ❌ **NU EXISTĂ** |
| DNSC API | Faza 3 | ❌ **NU EXISTĂ** |

---

## PRINCIPII DE AUTOMATIZARE - COMPARATIV

| Principiu din Document | Status Real |
|------------------------|-------------|
| Automatizăm doar munca de jos | ⚠️ Parțial |
| Decizii critice necesită aprobare | ❌ **NU EXISTĂ** (Approval Queue lipsește) |
| Toate acțiunile automate sunt logate | ⚠️ Parțial |
| Notificări agregate și configurabile | ⚠️ Parțial |
| Vizibilitatea acumulării obligatorie | ❌ **NU EXISTĂ** (card "Ce am protejat" lipsește) |
| Nivel autonomie per categorie de risc | ❌ **NU EXISTĂ** |

---

## CONCLUZIE - GAP-URI PRIORITARE

### 🔴 CRITICAL (Trebuie în Faza 0):
1. **Approval Queue** - Tabel `pending_actions` + UI `/approvals`
2. **ONRC Integration** - Auto-completare date firmă din CUI
3. **e-Factura Auto-repair complet** - Completează CUI din profil automat

### 🟠 HIGH (Faza 1-2):
4. **Card "Ce am protejat"** - Metrics pe dashboard
5. **White-label pentru parteneri** - Branding personalizat
6. **Findings în DB** - Tabel separată pentru query efficient
7. **Autonomy settings** - Nivel de automatizare per risk category

### 🟡 MEDIUM (Faza 2-3):
8. **Batch actions** - Multi-client operations
9. **Scheduled reports** - Rapoarte automate
10. **Drift detection auto-tasks** - Generează task-uri din schimbări legislative
11. **ANAF SPV Submit** - Trimitere facturi automat

### 🟢 LOW (Faza 4):
12. Agenți specializați
13. Auto-învățare din corecții
14. Predictive risk
15. Integrare Slack/Teams

---

## URGENȚĂ

**Pentru a fi "Market Killer":**
1. White-label (contabilii nu pot vinde fără brand propriu)
2. ONRC integration (user experience e praf fără auto-complete)
3. Approval Queue (fără asta nu ai human-in-the-loop)
4. Card "Ce am protejat" (arată valoarea adăugată)

**Fără 1+2+3+4, aplicatia e bună pentru demo dar NU pentru vânzare reală.**