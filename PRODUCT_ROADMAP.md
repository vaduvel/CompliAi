# CompliAI — Product Roadmap & Sprint Log

> Document viu. Actualizat după fiecare sprint. Conține tot ce știm despre piață, produs și priorități.

---

## AUDIT COMPLET — CONCLUZII (martie 2026)

### Ce are produsul acum (real vs. fake)

| Feature | Status | Note |
|---|---|---|
| Auth + multi-tenancy + RBAC | ✅ Real | Scrypt, HMAC session, per-org isolation |
| Document scan workflow | ✅ Real | Text + OCR, extraction completă |
| Signal detection (compliance engine) | ⚠️ Keyword-only | `String.includes()` — fals pozitive, fals negative |
| GDPR rule library | ✅ Real | ~30 reguli cu keywords |
| EU AI Act rule library | ✅ Real | ~40 reguli cu frameworks |
| AI system inventory + drift | ✅ Real | Snapshot comparison, lifecycle tracking |
| Evidence management | ✅ Real | File upload, metadata, quality check |
| Audit trail events | ✅ Real | 200 events per org |
| Repo sync (GitHub/GitLab) | ✅ Real | Manifest autodiscovery |
| Policy library | ✅ Real | Server-side, per-org persistence |
| Trust Profile + Public Page | ✅ Real | `/trust/[orgId]` Server Component |
| e-Factura XML validation | ✅ Real | UBL CIUS-RO local schema check |
| e-Factura ANAF transmission | ❌ Mocked | Setează boolean, zero ANAF real |
| LLM compliance analysis | ❌ Missing | Keyword matching nu e analiză |
| Remediation verification loop | ❌ Missing | Manual task completion only |
| State persistence production | ⚠️ JSON files | Race conditions, nu scalează |
| Evidence access control | ⚠️ Org-wide | Nicio izolare per user |
| Audit trail tamper-proof | ❌ Missing | Nesignat criptografic |
| Rate limiting pe auth | ❌ Missing | Brute-force posibil |

### Poziția competitivă

**Gap neocupat unic:**
`Română + GDPR + EU AI Act + e-Factura + <€150/lună + self-serve = NIMENI`

| Competitor | GDPR | AI Act | e-Factura | RO UI | <€150/lună |
|---|:---:|:---:|:---:|:---:|:---:|
| **CompliAI** | ✅ | ✅ | ✅ | ✅ | ✅ |
| eucompliai.com | ❌ | ✅ | ❌ | ❌ | ❓ |
| OneTrust | ✅ | ✅ | ❌ | ❌ | ❌ |
| Vanta/Drata | Parțial | ❌ | ❌ | ❌ | ❌ |
| iubenda | Cookie only | ❌ | ❌ | Parțial | ✅ |
| SmartBill | ❌ | ❌ | ✅ | ✅ | ✅ |

**Cel mai mare risc strategic:** SmartBill (150k useri, zero compliance). Dacă adaugă GDPR module → distribuție instant. Acțiune: build brand + canal contabili înainte.

### Voice of customer (sinteză Reddit/LinkedIn/G2/Facebook RO)

**Top 5 lucruri pe care le cer:**
1. "Spune-mi CE trebuie să fac pentru FIRMA MEA, nu o listă generică"
2. "Generează-mi documentele completate cu datele mele"
3. "Decodează erorile ANAF în română cu fix concret"
4. "Alertează-mă când ceva se schimbă, nu mă pune să mă loghez"
5. "Acoperă GDPR + AI Act + e-Factura într-un singur loc"

**Cel mai mare misconception = hook de achiziție:**
"Avem cookie banner, suntem conformi." Nu. Un audit care arată gap-ul real generează conversie imediată.

**Prețul maxim acceptat RO:** €30–50/lună. Peste asta comparația e cu consultantul.

**Gatekeeper-ul:** Contabilul. Dacă recomandă, se cumpără fără întrebări.

---

## OPORTUNITĂȚI PRIORITIZATE

### Top 5 după ROI

| # | Oportunitate | Piață RO | Concurență | Efort tehnic | Timp la € |
|---|---|---|---|---|---|
| 1 | NIS2 module | €7M–€58M ARR | Aproape zero | 6–10 săpt | 3–4 luni |
| 2 | EU AI Act conformity (AI developers) | €15–40M CEE | Foarte scăzut | 4–6 săpt | 2–3 luni |
| 3 | Document generator (freemium funnel) | Broad horizontal | Scăzut | 4–8 săpt | 2–3 luni |
| 4 | Canal cabinete contabile | 30k firme × 20 clienți | Niciun competitor direct | 4–6 săpt | 4–6 luni |
| 5 | Bulgaria expansion | €3–8M ARR | Aproape zero | 6–8 săpt | 3–4 luni |

### Alte reglementări de adăugat (secvențiat)

| Regulament | Urgență | Acoperire RO | Verdict |
|---|---|---|---|
| NIS2 | ACUM — în vigoare | >3,000 entități obligate | **Prioritate 1** |
| EU AI Act (completare) | Urgentă — deadline aug 2026 | Toate firmele cu AI | **Prioritate 2** |
| DORA (fintech) | Ridicată | 200+ payment institutions | **Luna 5–7** |
| eIDAS 2.0 | Medie | Firme cu e-semnătură | **Luna 9–12** |
| EU Data Act | Scăzut (nu SME) | IoT manufacturers | Skip |

### Verticale

| Vertical | Verdict | Raționament |
|---|---|---|
| HR-tech companies (AI Act) | **ACUM** | Annex III high-risk, modulul AI inventory există |
| Cabinete contabile (reseller) | **ACUM** | Multi-tenant există, distribuție fără cost |
| Clinici private (NIS2+GDPR) | **Luna 5** | NIS2 = essential entity |
| Cabinete avocatură | **Luna 3** | 45k avocați, zero tool-uri, template pack mic |
| Fintech/DORA | **Luna 7** | DORA e complex, dar WTP înalt |
| B2G (instituții publice) | Skip | Cash flow trap, ciclu 18 luni |

### Canale de distribuție

| Canal | Potențial | Acțiune |
|---|---|---|
| Cabinete contabile (CECCAR) | €1.5–3M ARR | Partner portal, wholesaler 40% discount |
| PNRR digitalizare SME | Distribuție subvenționată | Aplicare MCID approved tool list |
| Banca Transilvania (800k SME) | €8.6M ARR la 5% adopt. | Conversație la 12 luni |
| AmCham/CCIR chambers | Lead gen calitativ | Sponsorizare €5–20k/an |

---

## PRICING MODEL (validat vs. piață)

| Tier | Preț | Ce include |
|---|---|---|
| **Free** | €0 | Cookie banner check, 1 privacy policy generated, 1 AI system |
| **Starter** | €49/lună | GDPR complet, e-Factura validator + error decoder, 1 admin |
| **Growth** | €129/lună | + EU AI Act (5 sisteme), multi-user, ANSPDCP reports |
| **Professional** | €249/lună | + ANAF SPV real, unlimited AI systems, API, DPO export |
| **Partner** | €80/lună/client | Cabinete contabile, multi-client dashboard, wholesale |

---

## SPRINT PLAN DETALIAT

---

### SPRINT 1 — "Produsul poate fi vândut" (săptămânile 1–6)

**Obiectiv:** Un client plătitor care testează produsul să nu găsească nimic fundamental rupt.

**1.1 LLM-based compliance analysis**
- Fișier: `lib/compliance/llm-scan-analysis.ts`
- Înlocuiește/suplimentează keyword matching cu Gemini API
- Input: document text + regulation type
- Output: `ScanFinding[]` structurat cu `{ ruleId, title, detail, severity, legalReference, confidence, excerpt }`
- Fallback: dacă Gemini unavailable → keyword matching existent
- Integrare în `simulateFindings()` din `engine.ts`
- Estimat: 1.5 săptămâni

**1.2 ANAF error decoder**
- Fișier: `lib/compliance/efactura-error-codes.ts`
- Map complet: cod eroare SPV → titlu RO + explicație → fix concret
- Acoperire: toate codurile publicate de ANAF (ERR-001 → ERR-xxx, E4xxx, E5xxx)
- Endpoint: `GET /api/efactura/errors` sau inline în validatorul existent
- Pagină publică: `/efactura-errors` (SEO funnel gratuit, zero auth)
- Estimat: 0.5 săptămâni

**1.3 ANAF SPV client structure**
- Fișier: `lib/server/efactura-anaf-client.ts`
- Mode `mock`: comportamentul actual (flag boolean) — pentru dev/staging
- Mode `real`: OAuth2 ANAF + transmisie XML + retrieve receipt + store PED
- Activare: `ANAF_CLIENT_ID` + `ANAF_CLIENT_SECRET` env vars
- Fără credentials → UI arată "Configurează ANAF" cu instrucțiuni clare
- Estimat: 2 săptămâni

**1.4 Supabase primary store**
- Activare `SUPABASE_ORG_STATE_REQUIRED=true` ca default în producție
- JSON files rămân ca fallback local dev
- Verificare că toate mutateState calls funcționează corect
- Estimat: 0.5 săptămâni

**KPIs Sprint 1:**
- Zero false positives pe documente de test standard
- ANAF error decoder acoperă >80% din erorile raportate în grupuri FB
- ANAF client structurat, activabil cu credentials
- State persistent pe Supabase fără pierdere de date la restart

---

### SPRINT 2 — "Primii clienți plătitori" (săptămânile 7–14)

**Obiectiv:** MRR €0 → €5,000 (50 clienți × €100 avg). Funnel de achiziție live.

**2.1 Document generator (freemium funnel)**
- Generează: Privacy Policy, Cookie Policy, DPA, NIS2 Incident Response Plan
- Din datele deja colectate în onboarding (org name, sector, data flows)
- LLM-powered (Gemini), template-completat, download PDF/DOCX
- Free: Privacy Policy basic. Paid: toate documentele + branded
- Pagini publice SEO: `/genereaza-politica-gdpr`, `/genereaza-dpa`
- Estimat: 3 săptămâni

**2.2 EU AI Act Conformity module**
- Conformity assessment workflow (10 întrebări → gap analysis)
- Annex IV technical documentation generator
- EU AI Act database registration tracker
- Post-market monitoring log
- Target vertical: HR-tech companies (eJobs, BestJobs, SmartHR)
- Estimat: 2 săptămâni

**2.3 Partner portal pentru cabinete contabile**
- Multi-client dashboard (un contabil vede toți clienții)
- Bulk client onboarding (CSV import)
- Billing: wholesaler la 40% discount față de list price
- Raport lunar per client (PDF auto-generat)
- Target: eveniment CECCAR, 50 parteneri în primul an
- Estimat: 2 săptămâni

**2.4 Proactive alerting (nu dashboard-first)**
- Email/webhook la: scandal nou ANSPDCP, drift detectat, task overdue
- "Ai adăugat un nou tool SaaS → trebuie DPA cu ei"
- Configurabil în Setări: ce alerte, pe ce canal
- Estimat: 1 săptămână

**KPIs Sprint 2:**
- 50 trial signups în prima lună după lansare
- Conversie trial → paid ≥3%
- 5 cabinete contabile partenere
- ≥10 documente generate/zi (indicator funnel)

---

### SPRINT 3 — "Diferențierea reală" (săptămânile 15–24)

**Obiectiv:** MRR €5k → €25k. Moat care nu se copiază ușor.

**3.1 NIS2 module**
- Incident log cu SLA tracking (24h early warning / 72h full report)
- Supply chain vendor risk register (contracte cu ICT vendors)
- NIS2 assessment questionnaire (mapată pe ghidul DNSC)
- Evidence packs specifice NIS2
- Sector detection: energy, transport, banking, health, digital infra
- Estimat: 6–8 săptămâni

**3.2 DPO bundle (parteneriat)**
- Parteneriat cu 3–5 DPO consultanți care folosesc platforma
- Bundle: software + ore DPO = €150–400/lună
- DPO dashboard: vede toți clienții săi, primește alertele lor
- Estimat: 2 săptămâni (tech) + 4 săptămâni (parteneriate)

**3.3 Regulatory intelligence feed**
- Monitorizare: ANSPDCP fine database, ANAF bulletins, EU AI Office guidance
- Auto-update reguli compliance când apare ghid nou
- "Știre de conformitate" weekly digest (email)
- Estimat: 3 săptămâni

**3.4 Bulgaria localization**
- Traducere UI + documente în bulgară
- KZLD (Bulgarian DPA) specifics în rule library
- Bulgarian e-invoicing (NRA system — similar cu ANAF)
- GTM: partener local cu o asociație de contabili bulgari
- Estimat: 6–8 săptămâni

**3.5 Whistleblowing module (EU Directive)**
- Obligatoriu pentru companii cu >50 angajați din dec 2023
- Canal securizat de raportare + tracking + deadlines
- Piață: orice companie RO cu >50 angajați nu are asta implementat corect
- Estimat: 3 săptămâni

**KPIs Sprint 3:**
- NIS2 module live pentru 3 sectoare pilot
- Bulgaria: 20 trial signups în prima lună
- DPO bundle: 10 clienți bundled
- Regulatory feed: 200 subscribers la newsletter

---

### SPRINT 4 — "CEE + Scalare" (lunile 7–18)

**4.1 Poland market entry**
- Localizare completă în poloneză
- UODO (Polish DPA) specifics
- GTM: parteneri cu asociații contabile poloneze (SKwP)
- Obiectiv: 100 clienți polonezi în primele 3 luni

**4.2 DORA module (fintech vertical)**
- ICT risk management framework
- Third-party ICT contract clause checker (20 clauze obligatorii DORA)
- Incident classification DORA (major incident vs. significant cyber threat)
- Resilience testing schedule tracker
- Target: ~200 payment institutions cu NBR + ~150 fintechs RO

**4.3 Czech Republic + Slovakia**
- Bundle natural (limbi similare)
- UOOU specifics + Czech Cybersecurity Act (NIS2 transpunere)

**4.4 ISO 27001 Lite (CompliAI Enterprise)**
- 93 controale Annex A cu evidence mapping
- Gap assessment față de certificare
- Tier: €499/lună — primul tier enterprise
- Opens door pentru Banca Transilvania partnership

**4.5 Banca Transilvania / BCR partnership**
- Compliance ca add-on la pachetul de banking IMM
- Economic: €10–30/lună per SME la volum mare
- Banca Transilvania: 800k SME × 5% adopt × €15/lună = €8.6M ARR

**KPIs Sprint 4:**
- Polonia: 200 clienți
- DORA: 30 fintechs
- ISO 27001 Lite: 20 enterprise clienți
- Total MRR: €100k+

---

## DECIZII TEHNICE CRITICE (log de arhitectură)

| Decizie | Aleasă | De ce | Reversibilă? |
|---|---|---|---|
| State persistence | Supabase primary + JSON fallback | Scale + existentă | Da |
| LLM provider | Gemini (configurat) → Claude API opțional | Cost + calitate | Da |
| Auth | Local scrypt + Supabase optional | Funcționează deja | Da |
| ANAF integration | Real mode cu credentials / mock fără | Testabilitate | Da |
| Multi-tenancy | Per-org JSON → per-org Supabase row | RLS existent | Da |

---

## RISCURI MAJORE

| Risc | Probabilitate | Impact | Mitigare |
|---|---|---|---|
| SmartBill adaugă GDPR module | Medie | Ridicat | Build brand + canal contabili rapid |
| Educarea pieței costă mult | Ridicată | Mediu | Lead with e-Factura (durere imediată), GDPR secondar |
| ANSPDCP enforcement rămâne slab | Medie | Mediu | NIS2 + EU AI Act ca reglementări alternative |
| SME churn înalt (25–35%/an) | Ridicată | Mediu | Annual contracts, evidence history ca stickiness |
| EU AI Act enforcement slab | Medie | Scăzut | GDPR + e-Factura sunt baseline solide |

---

## METRICI DE SUCCES (targets)

| Metric | Luna 6 | Luna 12 | Luna 24 | Luna 36 |
|---|---|---|---|---|
| MRR | €5k | €20k | €60k | €100k+ |
| Clienți plătitori | 50 | 200 | 600 | 900+ |
| ACV mediu | €1,200 | €1,400 | €1,600 | €1,800 |
| ARR | €60k | €240k | €720k | €1.26M |
| NPS | — | >40 | >50 | >55 |
| Churn MRR/lună | — | <5% | <4% | <3% |
| Cabinete contabile partenere | 5 | 30 | 100 | 200 |
| Țări active | 1 (RO) | 2 (RO+BG) | 4 (RO+BG+PL+CZ) | 5+ |

---

*Ultima actualizare: 17 martie 2026*
*Autor: CompliAI product team*
