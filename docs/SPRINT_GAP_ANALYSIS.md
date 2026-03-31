# CompliAI - Sprint Tasks Gap Analysis
## Ce AVEM vs Ce SPUNE Documentul

> Martie 2026

---

## FAZA 2: Partner & Scalare

### Sprint 6: White‑label & CSV Import

| ID | Task din Document | Status Real | Note |
|----|-------------------|-------------|------|
| **6.1** | Creare tabel `partners` | ❌ **NU EXISTĂ** | Tabela nu există în DB |
| **6.2** | White‑label (branding dinamic) | ❌ **NU EXISTĂ** | Nu există suport pentru logo/culori per partener |
| **6.3** | Suport domeniu personalizat | ❌ **NU EXISTĂ** | Nu există suport custom domain |
| **6.4** | CSV import clienți | ✅ **EXISTĂ** | `/api/partner/import-csv` funcționează |
| **6.5** | UI CSV import | ✅ **EXISTĂ** | `import-wizard.tsx` există și funcționează |
| **6.6** | Testare E2E | ⚠️ **PARȚIAL** | Import funcționează, dar findings nu se generează |

**Status Sprint 6:** ~40%

---

### Sprint 7: Batch Actions & Rapoarte Programate

| ID | Task din Document | Status Real | Note |
|----|-------------------|-------------|------|
| **7.1** | Batch actions engine | ❌ **NU EXISTĂ** | Nu există sistem de batch operations |
| **7.2** | UI batch actions | ❌ **NU EXISTĂ** | Nu există UI pentru batch |
| **7.3** | Sistem rapoarte programate | ❌ **NU EXISTĂ** | Tabela `scheduled_reports` nu există |
| **7.4** | Job cron rapoarte | ❌ **NU EXISTĂ** | Nu există generare automată rapoarte |
| **7.5** | UI rapoarte programate | ❌ **NU EXISTĂ** | Nu există configurare UI |
| **7.6** | Trimitere rapoarte email | ⚠️ **PARȚIAL** | Există store pentru notifications, dar fără trimitere reală |
| **7.7** | Testare E2E | ❌ **NU EXISTĂ** | - |

**Status Sprint 7:** ~5%

---

### Sprint 8: Vendor Management & Audit Log

| ID | Task din Document | Status Real | Note |
|----|-------------------|-------------|------|
| **8.1** | Tabel `vendors` | ⚠️ **PARȚIAL** | Există store dar nu e structurat ca tabel partener |
| **8.2** | Vendor – organizație | ⚠️ **PARȚIAL** | Există în store dar nu complet |
| **8.3** | Auto‑scoring vendor | ❌ **NU EXISTĂ** | Nu există algoritm de scoring |
| **8.4** | UI Vendor Registry | ⚠️ **PARȚIAL** | Există pagina `/portfolio/vendors` dar limitată |
| **8.5** | Audit Log export | ⚠️ **PARȚIAL** | Există audit log dar export limitat |
| **8.6** | Acțiuni auto în Audit Log | ⚠️ **PARȚIAL** | Unele acțiuni sunt logate |
| **8.7** | Testare E2E | ⚠️ **PARȚIAL** | - |

**Status Sprint 8:** ~40%

---

## FAZA 3: Completarea Cadrului Legislativ

### Sprint 9: NIS2 & DORA

| ID | Task din Document | Status Real | Note |
|----|-------------------|-------------|------|
| **9.1** | NIS2 eligibility wizard | ✅ **EXISTĂ** | Complet implementat |
| **9.2** | UI NIS2 eligibility | ✅ **EXISTĂ** | Pagina funcționează |
| **9.3** | Chestionar NIS2 (backend) | ✅ **EXISTĂ** | Există și funcționează |
| **9.4** | UI NIS2 assessment | ✅ **EXISTĂ** | Pagina funcționează |
| **9.5** | Generare plan remediere NIS2 | ✅ **EXISTĂ** | Generează findings |
| **9.6** | DNSC incident reporting (draft) | ⚠️ **PARȚIAL** | Generează raport dar nu e automat |
| **9.7** | UI DNSC reporting | ⚠️ **PARȚIAL** | Există |
| **9.8** | DORA module | ✅ **EXISTĂ** | Complet implementat |

**Status Sprint 9:** ~90%

---

### Sprint 10: AI Act & Whistleblowing

| ID | Task din Document | Status Real | Note |
|----|-------------------|-------------|------|
| **10.1** | Tabel `ai_systems` | ✅ **EXISTĂ** | În ComplianceState |
| **10.2** | UI AI Inventory | ✅ **EXISTĂ** | `/dashboard/sisteme` |
| **10.3** | Clasificare risc propus | ✅ **EXISTĂ** | Funcționează |
| **10.4** | Approval Queue pentru clasificare | ❌ **NU EXISTĂ** | Nu există Approval Queue |
| **10.5** | Generare obligații AI Act | ⚠️ **PARȚIAL** | Există assessment dar nu generează auto-tasks |
| **10.6** | Draft documentație tehnică | ⚠️ **PARȚIAL** | Exista generator documente |
| **10.7** | Tabel `whistleblowing_reports` | ✅ **EXISTĂ** | Complet |
| **10.8** | Formular public whistleblowing | ✅ **EXISTĂ** | `/whistleblowing/[token]` |
| **10.9** | Dashboard admin whistleblowing | ✅ **EXISTĂ** | `/dashboard/whistleblowing` |
| **10.10** | Notificări automate | ❌ **NU EXISTĂ** | Nu există trimitere reală |
| **10.11** | Testare E2E | ⚠️ **PARȚIAL** | - |

**Status Sprint 10:** ~70%

---

### Sprint 11: Pay Transparency & Drift Detection

| ID | Task din Document | Status Real | Note |
|----|-------------------|-------------|------|
| **11.1** | Pay Transparency detectare | ✅ **EXISTĂ** | Finding generat automat |
| **11.2** | Colectare date salariale | ❌ **NU EXISTĂ** | Nu există funcționalitate |
| **11.3** | Calcul ecart salarial | ❌ **NU EXISTĂ** | Nu există |
| **11.4** | Generare draft raport PT | ❌ **NU EXISTĂ** | Nu există |
| **11.5** | UI raport PT | ❌ **NU EXISTĂ** | Nu există |
| **11.6** | Drift detection surse | ⚠️ **PARȚIAL** | Cron job există dar nu e complet |
| **11.7** | Analiză impact drift | ❌ **NU EXISTĂ** | Nu există analiză per firmă |
| **11.8** | Generare tasks din drift | ❌ **NU EXISTĂ** | Nu generează task-uri |
| **11.9** | UI drift alerts | ❌ **NU EXISTĂ** | Nu există pagina |
| **11.10** | Testare E2E | ❌ **NU EXISTĂ** | - |

**Status Sprint 11:** ~20%

---

## FAZA 4: Automatizare Avansată

### Sprint 12: Agenți Specializați

| ID | Task | Status Real | Note |
|----|------|-------------|------|
| **12.1** | Design arhitectură agenți | ❌ **NU EXISTĂ** |
| **12.2** | Agent e‑Factura | ❌ **NU EXISTĂ** |
| **12.3** | UI management agenți | ❌ **NU EXISTĂ** |
| **12.4** | Agent DSAR | ❌ **NU EXISTĂ** |
| **12.5** | Testare agenți | ❌ **NU EXISTĂ** |

**Status Sprint 12:** ~0%

---

### Sprint 13: Auto‑învățare & Predictive Risk

| ID | Task | Status Real | Note |
|----|------|-------------|------|
| **13.1** | Logging corecții utilizator | ❌ **NU EXISTĂ** |
| **13.2** | Analiză pattern‑uri | ❌ **NU EXISTĂ** |
| **13.3** | UI sugestii automatizare | ❌ **NU EXISTĂ** |
| **13.4** | Predictive risk model | ❌ **NU EXISTĂ** |
| **13.5** | UI predictive risk | ❌ **NU EXISTĂ** |
| **13.6** | Testare | ❌ **NU EXISTĂ** |

**Status Sprint 13:** ~0%

---

## SUMAR

| Fază | Status | Realizat |
|------|--------|----------|
| **Faza 2** (Sprint 6-8) | ~20% | CSV Import, Vendor parțial |
| **Faza 3** (Sprint 9-11) | ~60% | NIS2/DORA bine, AI Act parțial, Whistleblowing OK |
| **Faza 4** (Sprint 12-13) | ~0% | Nimic implementat |

---

## CE E CRITICAL SA FACEM PRIMUL

1. **Sprint 6.1-6.3 (White-label)** - Partenerii nu pot vinde fără branding propriu
2. **Sprint 11.6-11.9 (Drift Detection)** - Regulatory radar nu funcționează complet
3. **Sprint 7.1-7.4 (Batch Actions)** - Partenerii nu pot opera în masă

Vrei să generez un raport de efort pentru a prioritiza?