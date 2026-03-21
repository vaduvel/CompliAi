# CompliScan — Gap Analysis: Ce Există vs Ce Trebuie Construit
**Data:** 2026-03-20
**Metodă:** Comparare directă lista-completa-functionalitati.md
           cu documentul compliscan-automat-vs-manual.md
**Concluzie rapidă:** 65% din automatizare există deja în cod.
                      35% trebuie construit de la zero sau extins major.

---

## LEGENDA

| Simbol | Status |
|---|---|
| ✅ EXISTĂ | În cod, funcțional |
| 🔧 PARȚIAL | Baza există, necesită extindere |
| ❌ LIPSEȘTE | Trebuie construit de la zero |

---

# ZONA 1 — Onboarding & Profil Firmă

| Task | Status | Ce există | Ce lipsește |
|---|---|---|---|
| Pre-fill nume/adresă/CAEN din CUI | ❌ | Nimic | `lib/anaf-cui-client.ts` nou |
| Determinare obligații din CAEN+angajați | ✅ | ApplicabilityWizard + Engine | Nimic |
| Clasificare NIS2 automată din CAEN | 🔧 | ApplicabilityEngine există | Trigger automat la onboarding |
| Status firmă (activă/radiată) | ❌ | Nimic | Inclus în anaf-cui-client |

**Efort: 1 zi. Impact: onboarding de la 10 min la 2 min.**

---

# ZONA 2 — Scanare & Analiză

| Task | Status | Ce există | Ce lipsește |
|---|---|---|---|
| OCR din PDF/imagine | ✅ | Google Vision integrat | Nimic |
| Analiză semantică Gemini | 🔧 | `llm-scan-analysis.ts` 181 LOC există DAR keyword matching e primar | Prompts Gemini specializate per framework ca engine principal |
| Findings cu severity + referință legală | ✅ | `rule-library.ts` 367 LOC | Nimic |
| Confidence scoring cu reasoning chain | 🔧 | High/medium/low există DAR fără reasoning chain afișat | Adaugi `reasoningChain` + `sourceParagraph` per finding |
| Cross-mapare finding → multiple frameworks | 🔧 | Rule-library per framework DAR nu cross-mapează | Extins cu `affectedFrameworks[]` per finding |
| Redirect automat post-scan la Results | ❌ | Nu există pagina results | Pagină nouă + redirect (UX redesign) |
| Validare XML e-Factura | ✅ | `efactura-validator.ts` 184 LOC | Nimic |

**Efort: 4-5 zile. Impact: acuratețe findings de la ~70% la ~90%+**

---

# ZONA 3 — Import NIS2@RO Tool Oficial DNSC

| Task | Status | Ce există | Ce lipsește |
|---|---|---|---|
| Upload Excel/PDF de la DNSC | ❌ | Scan pipeline există DAR fără source type DNSC | Nou source type `nis2-official-tool` |
| OCR câmpuri din tool oficial | ❌ | Vision OCR există DAR neconfigurat pentru formatul DNSC | Prompt specializat pentru structura NIS2@RO |
| Pre-fill 85-95% din wizard | ❌ | `dnsc-wizard.ts` există DAR fără prefill | Funcție `mapOrgToNIS2Fields()` + Gemini |
| Cross-check CUI din tool vs org | ❌ | Nimic | Validare automată la import |
| Generare formular oficial DNSC | 🔧 | `dnsc-report.ts` 133 LOC există DAR format diferit | Template aliniat exact la formatul DNSC |

**Efort: 3 zile. Impact: înregistrare DNSC de la 3-6 ore la 10 minute.**

---

# ZONA 4 — Monitorizare Legislativă

| Task | Status | Ce există | Ce lipsește |
|---|---|---|---|
| Monitor zilnic DNSC/ANSPDCP/ANAF/EUR-Lex | 🔧 | `agent-regulatory-radar.ts` 384 LOC DAR monitorizează doar 4 deadlines fixe, NU paginile web | Web scraping + hash comparison |
| Detectare modificări față de ziua anterioară | ❌ | Nimic | SHA-256 hash comparison per URL |
| Rezumare modificare în română | ❌ | `gemini.ts` există DAR fără prompt legislativ | Prompt "rezumă pentru IMM român" |
| Identificare utilizatori afectați | 🔧 | Notification system există DAR fără filtrare pe sector | Filtrare orgs după CAEN + framework activ |
| Trimitere alertă personalizată | ✅ | `email-alerts.ts` + Resend integrat | Adaugi event `legislation.changed` |
| Finding automat din modificare legislativă | 🔧 | Scan pipeline există DAR nu e triggerat din cron | Trigger intern din cron |

**Efort: 4-5 zile. Impact: cel mai mare diferențiator — nu îl are nimeni în România.**

---

# ZONA 5 — Remediere & Generare Documente

| Task | Status | Ce există | Ce lipsește |
|---|---|---|---|
| Identificare document necesar per finding | ✅ | Resolution Layer mapează finding → document tip | Nimic |
| Generare draft document din finding | 🔧 | `document-generator.ts` 310 LOC DAR triggerat manual | Auto-trigger la confirmarea unui finding |
| Pre-fill din org profile | ✅ | Generator folosește deja org profile | Nimic |
| Pre-fill date furnizor din ANAF CUI | ❌ | Nu există ANAF CUI integration | `anaf-cui-client.ts` (același din Zona 1) |
| Auto-complete task la confidence >90% | ❌ | `task-validation.ts` există DAR fără autoApply | Threshold `autoApply` + audit log |
| Escalare la confidence <70% | 🔧 | `requiresHumanApproval()` există DAR neconectat la confidence score | Link confidence → approval gate |
| Auto-atașare draft la finding | ❌ | Dovada se uploadează manual | Auto-attach document generat la finding |

**Efort: 3-4 zile. Impact: remediere de la 20-40 ore la 2-3 ore per ciclu.**

---

# ZONA 6 — Vendor Risk & DPA

| Task | Status | Ce există | Ce lipsește |
|---|---|---|---|
| Import automat lunar furnizori | 🔧 | `POST /api/nis2/vendors/import-efactura` DAR manual | Cron lunar care triggereaza automat |
| Detectare furnizor nou | ❌ | Importul suprascrie DAR nu compară cu anterior | Diff între import curent și cel anterior |
| Alertă furnizor nou fără DPA | 🔧 | `agent-vendor-risk.ts` verifică DPA lipsă DAR nu la import nou | Event trigger `vendor.new_detected` |
| Fetch date furnizor din ANAF CUI | ❌ | Nimic | `anaf-cui-client.ts` (același) |
| Clasificare risc din CAEN | 🔧 | Risk scoring 3 niveluri DAR fără CAEN lookup automat | Fetch CAEN din ANAF → clasificare |
| Pre-fill questionnaire 70-80% | 🔧 | `vendor-review-engine.ts` există DAR fără prefill extern | Gemini + org profile + e-Factura data |
| DPA pre-completat cu date furnizor | 🔧 | Generator DPA există DAR fără date furnizor auto | ANAF CUI fetch → populate DPA template |
| Reminder reînnoire DPA la 11 luni | 🔧 | `agent-vendor-risk.ts` verifică overdue DAR fără email | Event `vendor.dpa_expiring` + Resend |

**Efort: 3 zile după ce ai ANAF CUI. Impact: vendor management de la 2-4 ore la 5-10 min.**

---

# ZONA 7 — Monitoring e-Factura (ANAF OAuth2)

| Task | Status | Ce există | Ce lipsește |
|---|---|---|---|
| Fetch mesaje SPV zilnic automat | ❌ | `efactura-validator.ts` validează local DAR fără fetch SPV real | ANAF OAuth2 + `lib/anaf-spv-client.ts` NOU |
| Detectare facturi respinse din SPV | ❌ | Nimic din SPV real | Parse răspuns ANAF API |
| Alertă imediată factură respinsă | 🔧 | `email-alerts.ts` + event `fiscal_alert` există | Trigger din ANAF fetch real |
| Validare XML înainte de trimitere | ✅ | `efactura-validator.ts` complet | Nimic |
| Semnale risc fiscal | 🔧 | `agent-rail-fiscal-sensor.ts` 135 LOC DAR pe date simulate | Conectat la date reale din ANAF OAuth2 |

**Efort: 5-7 zile. Cel mai complex tehnic — necesită certificat digital al userului.**

---

# ZONA 8 — NIS2 Assessment & DNSC

| Task | Status | Ce există | Ce lipsește |
|---|---|---|---|
| Pre-fill 80% din assessment | 🔧 | Assessment există DAR fără prefill din documente | Gemini analizează docs → sugerează răspunsuri |
| Scor maturitate per domeniu | ✅ | `nis2-maturity.ts` 237 LOC complet | Nimic |
| Gap analysis automat | ✅ | Auto-generare gap findings la save | Nimic |
| Raport DNSC generat | ✅ | `dnsc-report.ts` 133 LOC | Nimic |
| Reminder deadline DNSC | ✅ | `agent-regulatory-radar.ts` | Nimic |
| Timer incident alertă la 50% din termen | 🔧 | SLA timers există DAR fără alertă intermediară | Alertă la 50% (12h din 24h) |

**Efort: 2 zile. Impact: NIS2 assessment de la 3-4 ore la 30-45 minute.**

---

# ZONA 9 — Incident Management

| Task | Status | Ce există | Ce lipsește |
|---|---|---|---|
| Clasificare automată tip incident | 🔧 | `dnsc-wizard.ts` DAR manuală | Gemini clasificare la creare incident |
| Notificabil automat (24h/72h) | ✅ | Logică SLA în incident management | Nimic |
| Pre-completare formular DNSC | 🔧 | `dnsc-report.ts` DAR fără auto-populate din incident | Template cu date din incident + org |
| Checklist răspuns per tip incident | 🔧 | Resolution Layer există DAR generic | Template per tip (breach/DDoS/ransomware) |
| Alertă la 50% și 80% din termen | 🔧 | Timer există DAR o singură alertă la expirare | Alertă la 12h și 19h din 24h |
| Raport final incident | ✅ | Download raport Markdown | Nimic |

**Efort: 2 zile. Impact: incident management de la 4-12 ore la 20-30 minute.**

---

# ZONA 10 — Audit Pack & Dovezi

| Task | Status | Ce există | Ce lipsește |
|---|---|---|---|
| Centralizare dovezi | ✅ | Auditor Vault + Supabase Storage | Nimic |
| Timestamping + hash | ✅ | Audit trail + signed URLs | Nimic |
| Audit Pack ZIP la cerere | ✅ | `handleGenerateAuditPack()` complet | Nimic |
| One-Page Report PDF | ✅ | `one-page-report.ts` 384 LOC | Nimic |
| Audit Pack lunar AUTOMAT | ❌ | Generarea există DAR fără cron | Cron 1 ale lunii + email automat |
| Inspector Mode săptămânal AUTOMAT | ❌ | Inspector Mode există DAR rulat manual | Cron săptămânal + diff față de anterior |
| Alertă dosar incomplet | ✅ | `audit-quality-gates.ts` 203 LOC | Nimic |

**Efort: 1-2 zile. Doar cron-urile lipsesc — totul altceva există.**

---

# ZONA 11 — Retenție & Emailuri

| Task | Status | Ce există | Ce lipsește |
|---|---|---|---|
| Email zilnic condițional | 🔧 | `weekly-digest.ts` 185 LOC DAR săptămânal și necondiționat | Versiune daily + logică "trimite doar dacă e nou" |
| Alertă scor scăzut față de ieri | ❌ | Score tracking există DAR fără delta zilnic | `score-snapshot.ts` NOU + event `score.decreased` |
| Deadline tracker extins în UI | 🔧 | `ai-act-timeline.ts` doar pentru AI Act | Extins cu DPA-uri + politici + documente proprii |
| Digest săptămânal toți clienții (Partner) | 🔧 | `weekly-digest.ts` per org DAR nu per portofoliu | Versiune Partner — agregat toți clienții |
| Raport lunar per client automat | ❌ | Raportul există DAR generat manual | Cron lunar + email automat la consultant |
| Streak conformitate | ❌ | Nimic | Câmp `complianceStreak` în state + calcul zilnic |
| Benchmark sector | ❌ | Nimic | Agregare anonimizată scoruri per CAEN |

**Efort: 4-5 zile. Impact: diferența dintre one-time use și abonament plătit.**

---

---

# REZUMAT FINAL — Ordinea de construire

## Grupa A — Înainte de beta (7 zile total)

| Prioritate | Task | Efort |
|---|---|---|
| A1 | ANAF CUI Public API + pre-fill onboarding | 1.5 zile |
| A2 | Alertă scor scăzut zilnic | 1 zi |
| A3 | Email zilnic condițional | 2 zile |
| A4 | Cron Audit Pack lunar + Inspector Mode săptămânal | 1.5 zile |
| A5 | Alertă timer incident la 50% din termen | 0.5 zile |

---

## Grupa B — Luna 1-2 (22 zile total)

| Prioritate | Task | Efort |
|---|---|---|
| B1 | Gemini ca engine principal de analiză | 5 zile |
| B2 | Reasoning chain + cross-mapare frameworks | 3 zile |
| B3 | Auto-trigger document din finding + auto-attach | 3 zile |
| B4 | Cron import furnizori lunar + diff furnizori noi | 3 zile |
| B5 | Digest Partner Hub (toți clienții agregat) | 2 zile |
| B6 | Deadline tracker extins + raport lunar automat | 3 zile |
| B7 | Prefill NIS2 assessment din documente | 3 zile |

---

## Grupa C — Luna 3-4 (diferențiatorii, 21 zile total)

| Prioritate | Task | Efort |
|---|---|---|
| C1 | Radar Legislativ (scraping + Gemini rezumare) | 5 zile |
| C2 | Import NIS2@RO Tool oficial (OCR + prefill) | 3 zile |
| C3 | AutoApply tasks confidence >90% | 2 zile |
| C4 | Clasificare incident automată Gemini | 2 zile |
| C5 | Streak + benchmark sector | 2 zile |
| C6 | ANAF OAuth2 + fetch SPV automat | 7 zile |

---

## Ce NU mai construiești — există și e bun

- ✅ Google Vision OCR
- ✅ NIS2 Assessment complet
- ✅ AI Act Inventory + Conformity + Shadow AI
- ✅ Audit Pack ZIP complet
- ✅ One-Page Report + Response Pack
- ✅ Traceability Matrix + Audit Trail
- ✅ Partner Hub multi-client
- ✅ Health Check + Inspector Mode
- ✅ Notificări in-app
- ✅ Stripe + plan gating
- ✅ RBAC 4 roluri
- ✅ Resend email integration de bază

---

## Concluzia numerică

| Categorie | Zile dev |
|---|---|
| Grupa A — Înainte de beta | **7 zile** |
| Grupa B — Luna 1-2 | **22 zile** |
| Grupa C — Luna 3-4 | **21 zile** |
| **TOTAL pentru automatizare completă** | **~50 zile dev** |

**Dar după doar Grupa A (7 zile) ai deja un produs cu:**
- Onboarding în 2 minute
- Email zilnic care aduce userii înapoi
- Alertă când scorul scade
- Audit Pack lunar automat

**Ăla e minimul viabil pentru beta.**
