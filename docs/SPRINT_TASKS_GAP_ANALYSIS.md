# CompliAI - Sprint Tasks Gap Analysis (Faza 0 + Faza 1)
## Ce AVEM vs Ce SPUNE Documentul

> Martie 2026

---

## FAZA 0: FUNDAȚIA

### Sprint 1: ONRC Auto‑Detect & Applicability Engine

| ID | Task din Document | Status Real | Note |
|----|-------------------|-------------|------|
| **1.1** | Cercetare și integrare ONRC API | ❌ **NU EXISTĂ** | Nu există integrare ONRC |
| **1.2** | Creare tabel `organizations` | ⚠️ **PARȚIAL** | Există în ComplianceState dar nu ca tabel separată |
| **1.3** | Formular onboarding cu auto‑completare | ⚠️ **PARȚIAL** | User introduce CUI dar FĂRĂ auto-complete din ONRC |
| **1.4** | Implementare Applicability Engine | ✅ **EXISTĂ** | Complet în `/lib/compliance/applicability.ts` |
| **1.5** | Dashboard – card „Framework‑uri aplicabile" | ✅ **EXISTĂ** | Se afișează pe dashboard |
| **1.6** | Testare E2E | ⚠️ **PARȚIAL** | - |

**Status Sprint 1:** ~35%

---

### Sprint 2: e‑Factura Validator + Auto‑Repair & Approval Queue

| ID | Task din Document | Status Real | Note |
|----|-------------------|-------------|------|
| **2.1** | Refactor e‑Factura validator | ✅ **EXISTĂ** | Funcționează |
| **2.2** | Auto‑repair engine | ⚠️ **PARȚIAL** | Repara basic XML, dar NU completează CUI din profil |
| **2.3** | Creare tabel `pending_actions` | ❌ **NU EXISTĂ** | Tabela nu există |
| **2.4** | Approval Queue UI | ❌ **NU EXISTĂ** | Nu există pagina `/approvals` |
| **2.5** | Integrare e‑Factura repair cu Approval Queue | ❌ **NU EXISTĂ** | Nu există flow de approval |
| **2.6** | Testare E2E | ❌ **NU EXISTĂ** | - |

**Status Sprint 2:** ~25%

---

## FAZA 1: SPINE‑UL OPERAȚIONAL

### Sprint 3: Findings & Dosar

| ID | Task din Document | Status Real | Note |
|----|-------------------|-------------|------|
| **3.1** | Creare tabel `findings` | ❌ **NU EXISTĂ** | Findings sunt în memory/JSON, nu în DB |
| **3.2** | Integrare findings cu scanare | ⚠️ **PARȚIAL** | Exista dar fără Approval Queue |
| **3.3** | UI Findings (pagina `/resolve`) | ✅ **EXISTĂ** | Funcționează |
| **3.4** | Creare tabel `documents` | ⚠️ **PARȚIAL** | Există dar nu ca tabel separată |
| **3.5** | Dosar (Audit Dossier) | ✅ **EXISTĂ** | `/dashboard/dosar` funcționează |
| **3.6** | Auto‑link findings – dovezi | ❌ **NU EXISTĂ** | Nu există linking automat |
| **3.7** | Testare E2E | ⚠️ **PARȚIAL** | - |

**Status Sprint 3:** ~50%

---

### Sprint 4: RoPA Generator & Auto‑Remedieri Low‑Risk

| ID | Task din Document | Status Real | Note |
|----|-------------------|-------------|------|
| **4.1** | RoPA generator (backend) | ✅ **EXISTĂ** | Complet |
| **4.2** | UI RoPA generator | ✅ **EXISTĂ** | Funcționează |
| **4.3** | Configurare niveluri autonomie | ❌ **NU EXISTĂ** | Tabela `user_settings` nu există |
| **4.4** | UI setări autonomie | ❌ **NU EXISTĂ** | Nu există |
| **4.5** | Auto‑remediere low‑risk | ❌ **NU EXISTĂ** | Nu există sistem de auto-apply |
| **4.6** | Testare E2E | ⚠️ **PARȚIAL** | RoPA funcționează |

**Status Sprint 4:** ~60%

---

### Sprint 5: e‑Factura Submit & Notificări Proactive

| ID | Task din Document | Status Real | Note |
|----|-------------------|-------------|------|
| **5.1** | Integrare ANAF SPV pentru submit | ❌ **NU EXISTĂ** | Nu există |
| **5.2** | Stocare token SPV | ❌ **NU EXISTĂ** | Nu există |
| **5.3** | Flow submit e‑Factura | ❌ **NU EXISTĂ** | Nu se poate trimite la ANAF |
| **5.4** | Sistem notificări | ⚠️ **PARȚIAL** | Există store dar fără trimitere reală |
| **5.5** | Definire evenimente notificabile | ⚠️ **PARȚIAL** | Parțial |
| **5.6** | Card „Ce am protejat" | ❌ **NU EXISTĂ** | Nu există |
| **5.7** | Testare E2E | ❌ **NU EXISTĂ** | - |

**Status Sprint 5:** ~10%

---

## SUMAR FAZE 0 + 1

| Fază | Sprint | Status | Realizat |
|------|--------|--------|----------|
| **F0** | Sprint 1 | ~35% | Applicability Engine ✅, ONRC ❌ |
| **F0** | Sprint 2 | ~25% | Validator ✅, Auto-repair ⚠️, Approval Queue ❌ |
| **F1** | Sprint 3 | ~50% | UI Findings ✅, Dosar ✅, Findings DB ❌ |
| **F1** | Sprint 4 | ~60% | RoPA ✅, Autonomy ❌ |
| **F1** | Sprint 5 | ~10% | Submit ❌, Notificări ⚠️, Card ❌ |

**Status TOTAL Faze 0-1:** ~35%

---

## GAPS PRIORITARE

### 🔴 CRITICAL (Trebuie rezolvate acum):

1. **Approval Queue (Sprint 2.3-2.5)** - Fără asta nu ai human-in-the-loop
2. **Card "Ce am protejat" (Sprint 5.6)** - Arată valoarea adăugată
3. **Findings în DB (Sprint 3.1)** - Nu pot fi query-uite eficient
4. **Autonomy settings (Sprint 4.3-4.5)** - Userul nu poate configura auto-remediere

### 🟠 HIGH (Pentru vânzare reală):

5. **White-label (Sprint 6)** - Partenerii nu pot vinde sub brand propriu
6. **Batch actions (Sprint 7)** - Nu pot opera în masă
7. **Drift detection auto-tasks (Sprint 11)** - Nu generează task-uri

---

## EFORT TOTAL PENTRU A COMPLETA FAZELE 0-1

| Task | Ore necesare | Status |
|------|--------------|--------|
| Approval Queue | 24h | ~0% |
| Card "Ce am protejat" | 8h | ~0% |
| Findings în DB | 16h | ~0% |
| Autonomy settings | 12h | ~0% |
| Auto-repair complet | 8h | ~50% |
| ONRC Integration | 16h | ~0% |
| ANAF SPV Submit | 24h | ~0% |
| **Total** | **~108h** | ~15% implementat |

Dacă lucrez 8h/zi, durează ~14 zile să acoperim gap-urile CRITICAL din Faze 0-1.