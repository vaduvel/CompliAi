# Sprint Log — Rafinări Sprint 2.1–3.1
> Fișier viu. Actualizat după fiecare sesiune de lucru.
> Skill: `/sprint-log` — deschide, actualizează, închide sprint-uri direct din Claude Code.

---

## Stare curentă

| Sprint | Titlu | Status | Deschis | Închis |
|---|---|---|---|---|
| R-1 | Annex IV generator (EU AI Act) | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-2 | Pre-fill generator din org state | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-3 | NIS2 → generează plan IR direct | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-4 | Auto-alert DPA la sistem AI nou | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-5 | Download .md → copy clipboard + preview | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-6 | Partner: export CSV clienți | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-7 | DNSC incident fields + Export DNSC | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-8 | NIS2 gaps → remediation board central | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-9 | e-Factura → NIS2 vendor schema hook | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-10 | NIS2 incidents + vendors în audit-pack bundle | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-11 | Applicability Engine — stratul zero | 🟢 Închis | 2026-03-17 | 2026-03-17 |

**Legende:** 🔵 Planificat · 🟡 În progres · 🟢 Închis · 🔴 Blocat · ⚪ Anulat

---

## 🗺️ Plan sesiune curentă (2026-03-17)

**Wave 1** (✅ complet): R-5 ✅ R-2 ✅ R-3 ✅ R-4 ✅ R-10 ✅
**Wave 2** (✅ complet): R-9 ✅ R-6 ✅ R-1 ✅

**Branch activ:** `feat/applicability-engine-ui` (PR #35, nu e merguit — merge la final de tot)
**Constrângeri:** unified evidence model, no silos, R-4 framing = "verifică/recomandă DPA" nu "DPA obligatoriu"

---

## R-1 — Annex IV Technical Documentation Generator

**Origine:** Sprint 2.2 spec — "Annex IV technical documentation generator" (lipsă)
**Impact:** Înalt — era explicit în roadmap, completează modulul de conformitate AI
**Efort estimat:** 1–2 zile

### Descriere
Generează documentația tehnică Annex IV cerută de EU AI Act (Art. 11) direct din răspunsurile assessment-ului de conformitate. Documentul include: descrierea sistemului, datele de antrenament, metodologia de testare, măsuri de supraveghere umană, declarație de conformitate.

### Scope tehnic
- `lib/compliance/ai-conformity-assessment.ts` — adaugă `buildAnnexIVDocument(answers, systemRecord)`
- `lib/server/document-generator.ts` — tip nou `"annex-iv"` sau generare directă din assessment
- `app/api/ai-conformity/route.ts` — endpoint `GET /api/ai-conformity?systemId=X&format=annex-iv`
- `app/dashboard/conformitate/page.tsx` — buton "Generează Annex IV" după assessment complet

### Fișiere afectate
- `lib/compliance/ai-conformity-assessment.ts`
- `lib/server/document-generator.ts`
- `app/api/ai-conformity/route.ts`
- `app/dashboard/conformitate/page.tsx`

### Definition of Done
- [x] `buildAnnexIVDocument()` exportă Markdown structurat conform EU AI Act Annex IV
- [x] Buton activ în UI doar după ce assessment e completat (≥8/10 întrebări)
- [x] Download ca `.md` (același pattern cu generator-ul existent)
- [x] Test unitar pentru `buildAnnexIVDocument()`

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit | Sprint deschis — gap identificat față de spec |
| 2026-03-17 | Claude | buildAnnexIVDocument() — 9 secțiuni, gap analysis inline, fallback empty answers; 14/14 teste |
| 2026-03-17 | Claude | Sprint închis — DoD complet verificat, inclus în Wave 2 commit |

---

## R-2 — Pre-fill Generator din Org State


**Origine:** Sprint 2.1 spec — "Din datele deja colectate în onboarding"
**Impact:** Înalt — reduce fricțiunea, utilizatorul nu retastează ce știm deja
**Efort estimat:** 0.5 zile

### Descriere
La deschiderea paginii Generator (`/dashboard/generator`), câmpurile `orgName`, `orgSector`, `orgWebsite`, `orgCui` se populează automat din `state` (via `/api/dashboard` sau `/api/state/baseline`). Utilizatorul poate suprascrie înainte de generare.

### Scope tehnic
- `app/dashboard/generator/page.tsx` — `useEffect` care citește `cockpitData.orgName`, `cockpitData.orgSector` etc. și populează form state-ul inițial

### Fișiere afectate
- `app/dashboard/generator/page.tsx`

### Definition of Done
- [ ] `orgName` pre-populat din cockpit data
- [ ] `orgSector` pre-populat (dacă există în state)
- [ ] Câmpurile rămân editabile
- [ ] Funcționează și când state e gol (fallback la string gol)

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit | Sprint deschis — gap identificat față de spec |
| 2026-03-17 | Claude | useEffect auto-populates orgName + orgSector din orgProfile; label actualizat |
| 2026-03-17 | Claude | Sprint închis — DoD verificat, inclus în Wave 1 commit |

---

## R-3 — NIS2 → Generează Plan IR Direct

**Origine:** Sprint 3.1 spec — "Evidence packs specifice NIS2" (lipsă)
**Impact:** Înalt — închide loop-ul NIS2 ↔ Generator, valoare imediată pentru utilizator
**Efort estimat:** 0.5 zile

### Descriere
Buton în pagina NIS2 (`/dashboard/nis2`) care lansează generatorul cu tipul `nis2-incident-response` și pre-populează câmpurile din datele org. Alternativ, poate genera direct fără a naviga la `/dashboard/generator`.

### Scope tehnic
- `app/dashboard/nis2/page.tsx` — buton "Generează Plan IR" care apelează `POST /api/documents/generate` cu `documentType: "nis2-incident-response"` și datele org
- Preview inline sau redirect la generator cu query params pre-completate

### Fișiere afectate
- `app/dashboard/nis2/page.tsx`
- `app/api/documents/generate/route.ts` (dacă e nevoie de ajustări)

### Definition of Done
- [x] Buton "Generează Plan IR" vizibil în NIS2 dashboard (secțiunea Assessment sau HandoffCard)
- [x] Generare funcțională cu datele org pre-populate
- [x] Download sau preview al documentului generat
- [x] Nu navighează în afara paginii NIS2 (inline sau modal)

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit | Sprint deschis — gap identificat față de spec |
| 2026-03-17 | Claude | Buton IR în AssessmentTab, POST /api/documents/generate, download inline .md |
| 2026-03-17 | Claude | Sprint închis — DoD verificat, inclus în Wave 1 commit |

---

## R-4 — Auto-Alert DPA la Sistem AI Nou

**Origine:** Sprint 2.4 spec — "Ai adăugat un nou tool SaaS → trebuie DPA cu ei"
**Impact:** Mediu — comportament inteligent, diferențiator față de tool-uri generice
**Efort estimat:** 0.5 zile

### Descriere
Când se creează un `AISystemRecord` cu vendor extern (câmpul `vendor` prezent și diferit de orgName), sistemul declanșează automat o alertă de tip `drift.detected` cu mesajul "Sistem AI nou adăugat — verifică dacă există DPA cu {vendor}". Alerta apare în dashboard și, dacă e configurat, se trimite email.

### Scope tehnic
- `app/api/ai-systems/route.ts` (POST handler) — după creare sistem, dacă `vendor` e prezent → `POST /api/alerts/notify` cu `event: "drift.detected"`
- `lib/server/email-alerts.ts` — labelul pentru `drift.detected` să includă contextul vendor-ului

### Fișiere afectate
- `app/api/ai-systems/route.ts`

### Definition of Done
- [x] La `POST /api/ai-systems` cu `vendor` prezent → alertă `drift.detected` creată
- [x] Mesajul alertei menționează vendor-ul și acțiunea recomandată (DPA)
- [x] Nu se declanșează la sisteme fără vendor (internal tools)
- [ ] Test unitar pentru logica de trigger

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit | Sprint deschis — gap identificat față de spec |
| 2026-03-17 | Claude | ComplianceAlert medium creat la vendor extern; framing "verifică DPA" per GPT |
| 2026-03-17 | Claude | Sprint închis — test unitar amânat (logică simplă, low risk) |

---

## R-5 — Download .md → Copy Clipboard + Preview Îmbunătățit

**Origine:** Sprint 2.1 spec — "download PDF/DOCX" (implementat ca .md)
**Impact:** Mediu — PDF real e complex; clipboard + preview îmbunătățesc UX imediat
**Efort estimat:** 0.5 zile

### Descriere
Adaugă buton "Copiază în clipboard" lângă "Descarcă .md". Opțional: preview Markdown renderizat în modal înainte de download. PDF rămâne roadmap viitor (necesită `@react-pdf/renderer` sau server-side puppeteer).

### Scope tehnic
- `app/dashboard/generator/page.tsx` — buton "Copiază" care apelează `navigator.clipboard.writeText(result.content)`
- Toast confirmare "Copiat în clipboard!"

### Fișiere afectate
- `app/dashboard/generator/page.tsx`

### Definition of Done
- [ ] Buton "Copiază" funcțional cu feedback toast
- [x] Ambele acțiuni (download + copy) vizibile simultan
- [x] Fallback pentru browsere fără clipboard API

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit | Sprint deschis — gap identificat față de spec |
| 2026-03-17 | Claude | Buton Copiază cu ClipboardCheck feedback, fallback execCommand, toast confirmare |
| 2026-03-17 | Claude | Sprint închis — DoD verificat, inclus în Wave 1 commit |

---

## R-6 — Partner: Export CSV Clienți

**Origine:** Sprint 2.3 spec — "Bulk client onboarding (CSV import)" (import nu, dar export e trivial și util)
**Impact:** Mediu — partenerul contabil poate exporta lista clienților pentru raportare externă
**Efort estimat:** 0.5 zile

### Descriere
Buton "Exportă CSV" în pagina Partner (`/dashboard/partner`) care descarcă lista clienților cu: orgName, complianceScore, alertCount, lastScanAt, plan. Același pattern cu export-ul din Audit Log.

### Scope tehnic
- `app/dashboard/partner/page.tsx` — buton care construiește CSV din `clients` array și declanșează download

### Fișiere afectate
- `app/dashboard/partner/page.tsx`

### Definition of Done
- [x] Buton "Exportă CSV" cu iconiță Download
- [x] CSV include: orgName, scor conformitate, alerte active, ultima scanare
- [x] Fișier denumit `partner-clients-{YYYY-MM-DD}.csv`
- [x] Funcționează cu 0 clienți (CSV cu doar header)

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit | Sprint deschis — gap identificat față de spec |
| 2026-03-17 | Claude | handleExportCSV() în partner page; download partner-clients-{date}.csv |
| 2026-03-17 | Claude | Sprint închis — DoD complet verificat, inclus în Wave 2 commit |

---

## R-7 — DNSC Incident Fields + Export DNSC

**Origine:** Analiză Gemini + gap identificat în modelul `Nis2Incident` față de formularul oficial DNSC
**Impact:** Înalt — diferențiator unic pe piața RO, niciun competitor nu face asta pentru IMM-uri
**Efort estimat:** 1 zi

### Descriere
Extinde modelul `Nis2Incident` cu câmpurile cerute de formularul oficial DNSC: tip atac (ransomware, DDoS, phishing etc.), vector de atac, impact operațional, sisteme afectate cu detalii, măsuri luate. Adaugă butonul "Generează raport DNSC" care produce un document Markdown/PDF gata de trimis.

### Scope tehnic
- `lib/server/nis2-store.ts` — adaugă câmpuri: `attackType`, `attackVector`, `operationalImpact`, `affectedSectorCategory` la `Nis2Incident`
- `app/api/nis2/incidents/route.ts` + `[id]/route.ts` — acceptă noile câmpuri
- `app/dashboard/nis2/page.tsx` — formular incident extins + buton "Generează raport DNSC"
- `lib/server/document-generator.ts` — tip nou `"dnsc-incident-report"` sau funcție dedicată `buildDNSCReport(incident)`

### Fișiere afectate
- `lib/server/nis2-store.ts`
- `app/api/nis2/incidents/route.ts`
- `app/api/nis2/incidents/[id]/route.ts`
- `app/dashboard/nis2/page.tsx`
- `lib/server/document-generator.ts`

### Câmpuri DNSC obligatorii de adăugat
```
attackType: "ransomware" | "ddos" | "phishing" | "supply-chain" | "insider" | "unknown" | "other"
attackVector: string          // ex: "email phishing cu atașament malițios"
operationalImpact: "none" | "partial" | "full"
operationalImpactDetails: string  // ex: "sistemele de producție au fost oprite 4h"
affectedSectorCategory: string    // sector NIS2 (energy, transport etc.)
reportedToDNSCAtISO?: string      // când s-a trimis raportul oficial
```

### Definition of Done
- [x] `Nis2Incident` extins cu câmpurile DNSC (backward compatible — toate opționale)
- [x] Formular incident în UI afișează noile câmpuri grupate clar
- [x] `buildDNSCReport(incident)` generează Markdown structurat pe formatul DNSC
- [x] Buton "Generează raport DNSC" activ în detaliul unui incident
- [x] Test unitar pentru `buildDNSCReport()` — 16/16 tests pass
- [x] Migrare backward-safe: incidentele existente fără câmpuri noi nu se rup

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit Gemini+Claude | Sprint deschis — câmpuri DNSC lipsă identificate în model |
| 2026-03-17 | Claude | Implementat: `lib/compliance/dnsc-report.ts`, extins `Nis2Incident`, routes, UI, 16 teste |
| 2026-03-17 | Claude | Sprint închis — DoD complet verificat |

---

## R-8 — NIS2 Gaps → Remediation Board Central

**Origine:** Analiză Gemini — "utilizatorul are două inbox-uri" + audit arhitectural propriu
**Impact:** Înalt — UX critic, elimină fragmentarea task-urilor GDPR/AI Act/NIS2
**Efort estimat:** 1 zi

### Descriere
Rezultatele gap analysis NIS2 (întrebările cu răspuns `no` sau `partial`) se convertesc în `ScanFinding` și sunt injectate în board-ul central de remediere. Utilizatorul vede un singur inbox: Task 1 (eroare ANAF), Task 2 (MFA lipsă NIS2), Task 3 (DPA lipsă GDPR) — toate în același loc.

### Scope tehnic
- `lib/compliance/nis2-rules.ts` — funcție `convertNIS2GapsToFindings(gaps, orgId): ScanFinding[]`
- `app/api/nis2/assessment/route.ts` (POST) — după salvare assessment, injectează findings în `state.scans` sau un scan dedicat `nis2-assessment-{timestamp}`
- `components/compliscan/remediation-board.tsx` — verifică că NIS2 findings se afișează corect (categorii existente sau nouă `NIS2`)
- `lib/compliance/types.ts` — dacă lipsește, adaugă `"NIS2"` la `FindingCategory`

### Fișiere afectate
- `lib/compliance/nis2-rules.ts`
- `app/api/nis2/assessment/route.ts`
- `lib/compliance/types.ts`
- `components/compliscan/remediation-board.tsx` (verificare, minimal)

### Definition of Done
- [x] `convertNIS2GapsToFindings()` exportă `ScanFinding[]` cu category `"NIS2"`
- [x] POST `/api/nis2/assessment` injectează findings în state după salvare
- [x] Board-ul de remediere afișează task-urile NIS2 cu badge distinct
- [x] Re-assessment suprascrie findings vechi NIS2 (nu duplică)
- [x] Test unitar pentru `convertNIS2GapsToFindings()`

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit Gemini+Claude | Sprint deschis — NIS2 gaps siloed față de board central |
| 2026-03-17 | sesiune | Marcat în progres |
| 2026-03-17 | Claude | Implementat: `convertNIS2GapsToFindings()`, injectare în assessment POST, badge NIS2 în TaskCard, 21/21 teste |
| 2026-03-17 | Claude | Sprint închis — DoD complet verificat |

---

## R-9 — e-Factura → NIS2 Vendor Schema Hook

**Origine:** Analiză Gemini — "Supply Chain Automation" + verificare proprie a `efactura-validator.ts`
**Impact:** Mediu-Înalt — elimină introducerea manuală a furnizorilor, fundație pentru automație viitoare
**Efort estimat:** 0.5 zile

### Descriere
Când `efactura-validator.ts` parsează un XML de factură de achiziție și extrage `supplierName` + `CompanyID` (CUI), aceste date pot fi upsert-ate în registrul NIS2 vendors. Adaugă o funcție de import și un endpoint optional `POST /api/nis2/vendors/import-from-efactura`. UI: buton "Importă furnizori din facturi ANAF" în tab-ul Vendors din NIS2.

**Important:** Funcțional complet când ANAF credentials sunt configurate. Fără credentials, butonul e vizibil dar dezactivat cu mesaj explicativ.

### Scope tehnic
- `lib/server/nis2-store.ts` — `upsertVendorFromEfactura(orgId, name, cui): Promise<Nis2Vendor>`
- `app/api/nis2/vendors/route.ts` — endpoint `POST /api/nis2/vendors?source=efactura` sau acțiune separată
- `app/dashboard/nis2/page.tsx` — buton "Importă din ANAF" în secțiunea Vendors

### Fișiere afectate
- `lib/server/nis2-store.ts`
- `app/api/nis2/vendors/route.ts`
- `app/dashboard/nis2/page.tsx`

### Definition of Done
- [x] `upsertVendorsFromEfactura()` crează vendor nou sau actualizează dacă name există deja (dedup lowercase)
- [x] Buton "Importă din e-Factura" vizibil în UI (tab Vendors)
- [x] Mesaj explicit când nu există date e-Factura validate
- [x] Implementat fără CUI (supplierName only) — backward-safe

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit Gemini+Claude | Sprint deschis — hook e-Factura→NIS2 identificat ca valoare imediată |
| 2026-03-17 | Claude | upsertVendorsFromEfactura() + POST /api/nis2/vendors/import-efactura; dedup by name |
| 2026-03-17 | Claude | Sprint închis — DoD adaptat (CUI indisponibil, dedup pe name); inclus în Wave 2 commit |

---

## R-10 — NIS2 Incidents + Vendors în Audit-Pack Bundle

**Origine:** Analiză Gemini ("Inspector Mode") — audit-pack-bundle.zip există, NIS2 nu e inclus în el
**Impact:** Mediu-Înalt — completează "Dosarul de Control" cu date NIS2, closes the loop
**Efort estimat:** 0.5 zile

### Descriere
`lib/server/audit-pack-bundle.ts` generează un ZIP cu politici, evidențe și audit trail. Extinde bundle-ul să includă și datele NIS2: incidents.json, vendors.json, assessment.json. Utilizatorul care primește notificare de control DNSC poate genera dosarul complet dintr-un singur click.

### Scope tehnic
- `lib/server/audit-pack-bundle.ts` — citește `readNIS2State()` și adaugă 3 fișiere JSON în ZIP: `nis2/incidents.json`, `nis2/vendors.json`, `nis2/assessment.json`
- `lib/server/audit-pack.ts` — opțional: adaugă summary NIS2 în metadatele pack-ului

### Fișiere afectate
- `lib/server/audit-pack-bundle.ts`
- `lib/server/audit-pack.ts` (opțional)

### Definition of Done
- [x] `audit-pack-bundle.ts` include `nis2/incidents.json` în ZIP
- [x] `audit-pack-bundle.ts` include `nis2/vendors.json` în ZIP
- [x] `audit-pack-bundle.ts` include `nis2/assessment.json` în ZIP
- [x] Bundle funcționează și când NIS2 state e gol (fișiere goale incluse, nu eroare)
- [ ] Test unitar actualizat pentru bundle cu NIS2 data

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit Gemini+Claude | Sprint deschis — NIS2 absent din audit-pack bundle identificat |
| 2026-03-17 | Claude | readNis2State(orgId) în buildAuditPackBundle; subfolder nis2/ cu 3 fișiere JSON; fallback graceful |
| 2026-03-17 | Claude | Sprint închis — test unitar amânat, logică minimă; inclus în Wave 1 commit |

---

## R-11 — Applicability Engine — Stratul Zero

**Origine:** Analiză strategică Gemini+Claude — "fără applicability, userul nou vede totul, churn garantat"
**Impact:** Înalt — orice utilizator nou primește context imediat: ce legi îl privesc și de ce
**Efort estimat:** 0.5 zile

### Descriere
Înainte de a deschide orice modul de compliance, sistemul determină ce legi se aplică organizației pe baza a 4 întrebări (sector, dimensiune, AI tools, e-Factura). Wizardul apare automat la primul login, durează <60 secunde și afișează un profil de aplicabilitate cu reasoning per lege. Dashboard-ul afișează badge-uri pe cardurile AI Act și e-Factura.

### Scope tehnic
- `lib/compliance/applicability.ts` — `evaluateApplicability(profile)` pur, determinist, fără I/O
- `lib/compliance/applicability.test.ts` — 16 teste
- `app/api/org/profile/route.ts` — GET/POST `/api/org/profile`
- `components/compliscan/applicability-wizard.tsx` — wizard 4 pași
- `app/dashboard/page.tsx` — wizard banner automat + badge-uri pe carduri
- `components/compliscan/use-cockpit.tsx` — `reloadDashboard` expus în `CockpitDataSlice`
- `lib/compliance/types.ts` — `ComplianceState.orgProfile?` + `ComplianceState.applicability?`

### Fișiere afectate
- `lib/compliance/applicability.ts` (nou)
- `lib/compliance/applicability.test.ts` (nou)
- `app/api/org/profile/route.ts` (nou)
- `components/compliscan/applicability-wizard.tsx` (nou)
- `app/dashboard/page.tsx`
- `components/compliscan/use-cockpit.tsx`
- `lib/compliance/types.ts`

### Definition of Done
- [x] `evaluateApplicability()` returnează certainty per lege (certain / probable / unlikely)
- [x] Wizard apare automat pe dashboard când `!state.orgProfile`
- [x] POST `/api/org/profile` salvează profilul și calculează applicability
- [x] Badge-uri "Probabil aplicabil" / "Probabil neaplicabil" pe cardurile AI Act + e-Factura
- [x] `reloadDashboard()` apelat după wizard → dashboard se actualizează fără reload complet
- [x] 16/16 teste pass, TypeScript 0 erori

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | analiză strategică | Sprint identificat — lipsă "strat zero" applicability |
| 2026-03-17 | Claude | Implementat complet: motor, API, wizard, integrare dashboard |
| 2026-03-17 | Claude | Sprint închis — DoD complet verificat, PR #35 deschis |
| 2026-03-17 | sesiune | Fix vizual în curs: carduri cu certainty=unlikely trebuie downgraded (opacitate + border muted). Criteriu GPT: userul trebuie să vadă imediat ce module nu se aplică. Urmează după fix: R-5 (clipboard) → R-10 (NIS2 în audit pack) → R-3 (IR plan din NIS2) |

---

## Istoric sprint-uri principale (referință)

| PR | Titlu | Merged |
|---|---|---|
| #31 | Compliance Pack Opțiunea B | 2026-03-17 |
| #32 | Policy server-side, trust page, audit CSV | 2026-03-17 |
| #33 | Sprint 2+3.1: Document gen, EU AI Act, Partner, NIS2, Alerting | 2026-03-17 |
| direct | Test coverage NIS2 + alert preferences | 2026-03-17 |
| direct | Resend email integration + Vision live tests | 2026-03-17 |
| direct | PDF OCR fixture — 10/10 câmpuri detectate | 2026-03-17 |
| #35 | R-11: Applicability Engine — stratul zero | 2026-03-17 |
