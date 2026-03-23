# CompliScan — Document Master de Implementare

**Data:** 2026-03-23
**Versiune:** 1.1 FINAL — patch 2026-03-23
**Status:** Execuție imediată
**Înlocuiește:** COMPLISCAN-IMPLEMENTATION-GAPS-REAL.md + COMPLISCAN-58-LA-80-AUTOMATIZARE-CANON.md

---

## CE EXISTĂ DEJA ÎN APLICAȚIE (nu se reimplementează)

- `runIntakeAgent`, `runFindingsAgent`, `runDriftAgent`, `runEvidenceAgent` în `lib/compliance/agent-runner.ts`
- Scoring canonic: `computeDashboardSummary` în `lib/compliance/engine.ts`
- NIS2 assessment: 20 întrebări în `lib/compliance/nis2-rules.ts`, store separat în `lib/server/nis2-store.ts`
- DNSC Wizard: eligibilitate, prefill parțial, draft markdown prin `buildDNSCNotificationDraft`
- Finding → document: backend hook în `app/api/findings/[id]/route.ts` pentru `privacy-policy`, `cookie-policy`, `dpa`, `nis2-incident-response`, `ai-governance`
- Cron-uri: `audit-pack-monthly`, `score-snapshot`, `daily-digest`, `weekly-digest`, `vendor-sync-monthly` etc.
- Import CSV parțial: `app/api/partner/import-csv/route.ts`
- Generator documente: `app/dashboard/generator/page.tsx`
- Vault + upload dovezi: `app/api/tasks/[id]/evidence/route.ts`
- Public live: `/`, `/pricing`, `/login`, `/claim`, `/demo/*`, `/genereaza-dpa`, `/genereaza-politica-gdpr`

---

## PRINCIPIU DE BAZĂ (neschimbabil)

> Niciun finding nu poate fi marcat „Rezolvat" fără cel puțin o acțiune conștientă din partea utilizatorului care confirmă că documentul reflectă realitatea firmei sale.

> Nicio acțiune legală (raport DNSC, trimitere ANSPDCP, semnătură) nu se execută automat. Omul decide, sistemul pregătește.

---

# SPRINT 0 — Riscuri active (1 săptămână)

Acestea nu sunt features. Sunt probleme care există azi în aplicație și creează risc legal.

---

## S0.1 — Ciclul NIS2 este incomplet: există 3 rapoarte, nu unul

### Problema
Aplicația tratează incidentul NIS2 ca un singur raport de 24h. Legea română (OUG 155/2024 + Ordinul DNSC 1/2025) impune 3 rapoarte distincte. Utilizatorul actual crede că e acoperit după primul raport — nu e.

### Cele 3 etape obligatorii

| Etapă | Termen | Conținut minim |
|---|---|---|
| Early Warning | 24h de la detectare | Notificare sumară, tip incident, impact transfrontalier, măsuri imediate |
| Raport inițial detaliat | 72h de la detectare | Analiză tehnică, vector atac, sisteme compromise, utilizatori afectați |
| Raport final | 30 zile de la detectare | Cauza rădăcină, cronologie, măsuri permanente, număr înregistrare DNSC |

### Ce se construiește

**Model de date extins pentru incident:**
```typescript
interface NIS2Incident {
  id: string
  orgId: string
  detectedAt: Date
  type: 'unauthorized_access' | 'data_breach' | 'service_disruption' | 'ransomware' | 'other'

  earlyWarning: {
    status: 'pending' | 'draft' | 'submitted'
    deadline: Date        // detectedAt + 24h
    submittedAt?: Date
    dnscReference?: string
    content: EarlyWarningContent
  }

  detailedReport: {
    status: 'pending' | 'draft' | 'submitted'
    deadline: Date        // detectedAt + 72h
    submittedAt?: Date
    content: DetailedReportContent
  }

  finalReport: {
    status: 'pending' | 'draft' | 'submitted'
    deadline: Date        // detectedAt + 30 zile
    submittedAt?: Date
    content: FinalReportContent
  }

  overallStatus: 'open' | 'partially_reported' | 'fully_reported' | 'closed'
}
```

**Badge sidebar — 3 countdown-uri, nu unul:**
```
Incident activ: Acces neautorizat
├── Early Warning: ✓ Trimis (23 Mar, 14:32)
├── Raport 72h: ⏰ 47:23 rămase  [Draft] [Continuă]
└── Raport final: ○ În 28 zile
```
Badge dispare DOAR când toate 3 sunt trimise și incidentul e marcat Închis.

**Procente reale de completare automată:**
- Early Warning: ~40% (date org + timestamp + tip incident)
- Raport 72h: ~25% (date org + referință incident)
- Raport final: ~15% (date org + cronologie din datele anterioare)

**Fișiere de atins:**
- `lib/db/src/schema/incidents.ts` — schemă extinsă cu cele 3 etape
- `app/api/nis2/incident/route.ts` — CRUD incident
- `app/api/nis2/incident/[id]/report/route.ts` — generare draft per etapă
- `components/compliscan/incident/incident-timeline.tsx` — UI cu 3 etape
- `components/compliscan/sidebar/incident-badge.tsx` — badge persistent multi-etapă
- `lib/compliance/nis2-report-generator.ts` — generare draft per tip + etapă

**Efort:** 4 zile | **Impact:** Critic — risc legal pentru utilizatorii existenți

---

## S0.2 — Document generat ≠ conformitate reală (risc răspundere CompliScan)

### Problema
Când sistemul generează un document și îl marchează automat ca dovadă → finding rezolvat → scor crește, creează fals sentiment de conformitate. OpenAI a primit amendă €15M în dec 2024 exact pentru asta. Dacă un utilizator CompliScan primește amendă cu finding-ul verde în aplicație, responsabilitatea e a produsului.

### Ce se construiește

**Pasul 1 — Completare date specifice (obligatoriu, nu se poate skip):**
Înainte de orice generare, utilizatorul răspunde la întrebări specifice firmei:

```typescript
// Exemplu pentru Privacy Policy — câmpuri obligatorii
interface PrivacyPolicyRequirements {
  dataCollected: string[]           // Ce colectezi efectiv: email, telefon, CCTV, biometric
  purposesOfProcessing: string[]    // De ce: contractual, marketing, HR, securitate
  thirdPartySharing: boolean
  thirdParties?: string[]
  internationalTransfers: boolean
  childrenData: boolean
  dpoContact: string
}
// Generarea e blocată până la completarea tuturor câmpurilor
```

**Pasul 2 — Confirmare activă (obligatorie, nu se poate skip):**
```
[Preview document generat]

Înainte să marchezi ca dovadă de conformitate, confirmă că:

☐ Categoriile de date reflectă ce colectezi efectiv
☐ Terții menționați sunt furnizorii tăi reali
☐ Datele de contact DPO sunt corecte
☐ Ai citit documentul și înțelegi că publicarea lui creează
  obligații legale reale față de persoanele vizate

[Confirm și atașez ca dovadă]    [Revizuiește mai întâi]
```

Finding-ul se marchează Rezolvat DOAR după bifare explicită. Niciodată automat.

**Disclaimer permanent pe documente generate:**
```
⚠ Document generat pe baza datelor introduse de tine. Conformitatea
reală depinde de corectitudinea datelor introduse și implementarea
efectivă a măsurilor descrise. CompliScan nu oferă consultanță juridică.
```

**Fișiere de atins:**
- `components/compliscan/generator/document-questionnaire.tsx` — wizard obligatoriu pre-generare
- `components/compliscan/generator/confirmation-checklist.tsx` — confirmare în 2 pași
- `lib/compliscan/generator/generator-engine.ts` — blochează generarea până la date minime complete
- `app/api/findings/[id]/route.ts` — validare că confirmarea există înainte de resolve

**Efort:** 2 zile | **Impact:** Critic — risc de răspundere juridică CompliScan

---

## S0.3 — Pagina /trust + DPA CompliScan (blocker vânzare B2B)

### Problema
Elena, înainte să recomande tool-ul celor 25 de clienți, caută DPA-ul CompliScan. Dacă nu există, nu poate recomanda legal. Un tool GDPR fără propriul DPA e o problemă de credibilitate imediată.

### Ce se construiește

**Pagina publică `/trust`:**
```
Hosting: [furnizor] — datacenter EU
DPA: [Descarcă DPA CompliScan ↓]
Subprocesori: ANAF (read-only), [AI provider], Supabase, Resend, Sentry
Retenție date: 90 zile după închiderea contului
Ștergere la cerere: 30 zile
Contact DPO: dpo@compliscan.ro
Ultima actualizare: [dată]
```

**Fișiere de atins:**
- `app/trust/page.tsx` — pagina publică
- `public/legal/dpa-compliscan.pdf` — DPA descărcabil, pre-semnat de CompliScan
- `public/legal/subprocessors.html` — lista subprocesorilor

**Efort:** 1 zi | **Impact:** Blocker pentru orice vânzare B2B cu consultant

---

# SPRINT 1 — Fundație și flux vizibil (2 săptămâni)

---

## S1.1 — Scoring convergent: același scor canonic peste toate suprafețele

### Stare actuală reală
`computeDashboardSummary` este sursa canonică și e folosit de cron, rapoarte, dashboard. Dar `app/api/benchmark/route.ts` folosește `state.gdprProgress` în loc de scorul global.

### Ce se face
- Păstrează `computeDashboardSummary` ca sursă principală — nu se rescrie
- Aliniază consumatorii care încă folosesc derivate parțiale

**Fișiere de atins:**
- `lib/compliance/engine.ts` — verificare că wrapper-ul e consistent
- `app/api/benchmark/route.ts` — înlocuiește `gdprProgress` cu scorul canonic
- `app/api/cron/score-snapshot/route.ts` — verificare aliniere
- `lib/score-snapshot.ts` — verificare aliniere

**Nu se face:** un al doilea sistem de scoring paralel sau mutarea formulei în fișier nou.

**Efort:** 1-2 zile | **Impact:** Mediu, fundație pentru tot ce urmează

---

## S1.2 — Findings → documente → dovadă: flow vizibil, nu doar hook backend

### Stare actuală reală
Hook-ul există în `app/api/findings/[id]/route.ts` — la confirmarea unui finding se poate genera document automat dacă există `suggestedDocumentType`. Dar utilizatorul nu primește în UI un traseu clar.

### Ce se face
- Adaugă CTA și stare vizibilă în pagina „De rezolvat"
- Leagă documentul generat de finding-ul confirmat
- Oferă shortcut explicit `Atașează ca dovadă` după generare
- Integrează confirmarea din S0.2 în acest flow

**Flow complet după implementare:**
```
Finding „Privacy Policy lipsă" → [✨ Generează acum]
→ Wizard date specifice (S0.2 obligatoriu)
→ Preview politică în 30 secunde
→ Revizuiește că datele sunt corecte
→ Bifează confirmarea (S0.2)
→ [Aprobă și atașează ca dovadă]
→ Finding rezolvat, scor crește
Total: 1 flow, 5-8 minute
```

**Fișiere de atins:**
- `components/compliscan/resolve-page.tsx` — CTA și stare vizibilă per finding
- `app/api/findings/[id]/route.ts` — validare confirmare + legătură cu dovada
- `app/dashboard/generator/page.tsx` — integrare cu flow finding
- `app/api/documents/generate/route.ts` — extindere cu wizard obligatoriu
- `app/api/tasks/[id]/evidence/route.ts` — shortcut attach după generare

**Efort:** 3 zile | **Impact:** Mare — rezolvă fragmentarea pentru toți utilizatorii

---

## S1.3 — Import Excel robust: edge cases care fac funcția inutilizabilă

### Stare actuală reală
Import CSV există parțial în `app/api/partner/import-csv/route.ts`. Fuzzy matching nu există. ANAF batch nu are rate limiting.

### Cazuri reale de eșec care trebuie acoperite

1. **Header nu e pe rândul 1** — logo sau titlu pe rândul 1-2, headers pe rândul 3
2. **Coloane fără header sau duplicate** — ignorate cu avertisment per coloană
3. **Merge cells în Excel** — detectare pattern alternativ gol/plin, avertizare specifică
4. **Diacritice inconsistente** — "Furnizor" / "Furnizór" / "furnizor" / "FURNIZOR" / "Furniz." → echivalente
5. **CUI format greșit** — "RO12345678", "12.345.678", "12345678 " → normalizare automată cu afișare ce s-a normalizat
6. **Firmă deja în portofoliu** — decizie per rând: actualizează sau ignoră

### UI preview import
```
Preview import — 25 rânduri detectate

✓ 21 firme valide — gata de import
⚠  2 firme deja în portofoliu — alege ce faci
✗  1 CUI invalid — corectează
○  1 rând ignorat (gol)

Mapping coloane detectat:
"Firmă"       → orgName        [✓ Confident]
"CUI"         → cui            [✓ Confident]
"Contact"     → contactEmail   [⚠ Nesigur — verifică]
"Status GDPR" → notes          [⚠ Nu avem câmp direct]

[Modifică mapping]   [Confirmă și importă 21 firme]
```

### ANAF prefill cu rate limiting real
```typescript
async function anafPrefillBatch(cuis: string[]) {
  const results = []
  for (const cui of cuis) {
    try {
      const data = await anafLookup(cui)
      results.push({ cui, data, status: 'success' })
    } catch (err) {
      results.push({ cui, data: null, status: 'failed', retry: true })
    }
    await sleep(1100) // ANAF: max 1 req/sec
  }
  return results
}
```

UI în timpul importului:
```
Obținere date ANAF: 14 / 25 firme procesate
████████████░░░░░░░  [Estimat: ~1 minut rămas]
3 firme nu au putut fi obținute — poți reîncerca individual
```

**Fișiere de atins:**
- `lib/compliscan/import/excel-parser.ts` — detectare header rând, merge cells, diacritice
- `lib/compliscan/import/vendor-mapper.ts` — fuzzy matching robust (nou)
- `lib/compliscan/import/anaf-batch.ts` — rate limiting + retry logic (nou)
- `components/compliscan/import/import-preview.tsx` — UI preview detaliat per rând
- `app/api/partner/import-csv/route.ts` — extindere cu validare, feedback, stream progress

**Efort:** 4 zile | **Impact:** Mare — fără asta Elena și Andrei nu migrează

---

## S1.4 — Onboarding Pasul 4 lipsă: „Iată ce am găsit deja"

### Problema
Fără Pasul 4, Cristian ajunge pe dashboard cu 0% și nu știe ce să facă. Abandonează.

### Ce se construiește
```
Pasul 4 — „Primul tău raport în 30 de secunde"

🔴 Risc imediat (fă asta azi):
   Privacy Policy — lipsă pe site
   [Generează acum — 5 minute]  ← CTA principal

🟡 Important (săptămâna asta):
   Registru activități prelucrare — necompletat
   Contract AWS — lipsă DPA

🟢 Ești ok cu:
   eFactura — obligație detectată, ghid disponibil

Scorul tău de azi: 34/100
Poți ajunge la 70 rezolvând primul risc.

[Generează Privacy Policy acum]    [Văd tot dashboard-ul]
```

**Reguli:** max 1 risc roșu, max 2 galbene, minim 1 verde (psihologic important), CTA principal legat de riscul roșu.

**Fișiere de atins:**
- `app/onboarding/step-4/page.tsx` — pagina nouă
- `lib/compliscan/onboarding/first-scan.ts` — logica quick findings
- `components/compliscan/onboarding/first-report-card.tsx` — componenta afișare

**Efort:** 2 zile | **Impact:** Mare — Cristian abandonează fără asta

---

## S1.5 — Mobile UX: onboarding și finding rezolvat de pe telefon

### Problema
Cristian lucrează din telefon pe șantier. Onboarding-ul cu 4 pași completă și generatorul de documente sunt probabil desktop-only.

### Ce se construiește

**Onboarding comprimat pentru mobile (detectat automat din UA):**
```
Pasul 1 Mobile: „CUI-ul firmei tale"
→ Input CUI + ANAF prefill + confirmare

Pasul 2 Mobile: „Care e prioritatea ta acum?"
→ [ ] Să am documente GDPR
→ [ ] Să văd ce riscuri am
→ [ ] Să fiu pregătit pentru un control

→ Dashboard cu 3 quick wins adaptate alegerii
```

**Finding rezolvat de pe telefon:** tot flow-ul din S1.2 funcționează complet pe mobil — bottom sheet în loc de modal, butoane minimum 44px touch target, „Trimite linkul pe email" pentru pașii care necesită desktop.

**Fișiere de atins:**
- `components/compliscan/onboarding/mobile-onboarding.tsx` — versiune comprimată
- `components/compliscan/findings/finding-detail-sheet.tsx` — bottom sheet mobil (nou)
- `app/dashboard/page.tsx` — detectare UA și flow mobil
- `styles/globals.css` — touch targets, scroll behavior

**Efort:** 3 zile | **Impact:** Mare — 60%+ din SMB-uri accesează de pe mobil

---

# SPRINT 2 — NIS2 + Agent OS (2 săptămâni)

---

## S2.1 — NIS2 assessment: prefill cu confidence pentru întrebările cu sursă reală

### Stare actuală reală
Assessment-ul are 20 întrebări în `lib/compliance/nis2-rules.ts`, salvat prin `app/api/nis2/assessment/route.ts`. Totul e manual azi.

### Ce se face
Strat nou de `assessment prefill` — propune răspunsuri DOAR pentru întrebările cu sursă clară din datele existente:

```typescript
interface AssessmentPrefill {
  questionId: string
  proposedAnswer: 'yes' | 'no' | 'partial'
  source: 'orgProfile' | 'vendorReviews' | 'nis2Vendors' | 'boardMembers' | 'generatedDocs'
  confidence: 'high' | 'medium' | 'low'
  explanation: string
  requiresConfirmation: true  // întotdeauna
}
```

**Întrebări care pot primi prefill parțial:**
- Supply-chain din `nis2.vendors` și `vendorReviews`
- Training management din `boardMembers`
- Dimensiune/sector din `orgProfile`
- Continuitate/incident response dacă există dovadă explicită în Vault

**Nu se face:** marcat `yes` pe o întrebare doar pentru că există activitate vag corelată. Nu se promite un procent fix fără audit punctual.

**Fișiere de atins:**
- `lib/compliance/nis2-rules.ts` — adaugă metadata sursă per întrebare
- `app/api/nis2/assessment/route.ts` — endpoint prefill
- `lib/server/nis2-store.ts` — persistare cu flag `source` și `confidence`
- `app/dashboard/nis2/page.tsx` — UI prefill cu badge „Propus automat — confirmă"

**Efort:** 3-4 zile | **Impact:** Mare pentru Andrei și pentru Elena (per client NIS2)

---

## S2.2 — Agent OS hardening: drift și evidence conectate la baseline

### Stare actuală reală
Cele 4 funcții Agent OS există în `lib/compliance/agent-runner.ts`. `runDriftAgent` face comparații față de un baseline presupus „safe", nu față de `validatedBaselineSnapshotId`. `runEvidenceAgent` returnează `EvidenceProposal` dar `app/api/agent/commit/route.ts` nu persistă zona de evidence. `lib/compliance/route.ts` are comentarii stale cu `Placeholder`.

### Ce se face
- Leagă drift-ul de `validatedBaselineSnapshotId` și `snapshotHistory` din:
  - `lib/server/compliance-drift.ts`
  - `app/api/state/baseline/route.ts`
  - `lib/server/mvp-store.ts`
- Transformă `EvidenceProposal` în sugestii de task/evidence upload vizibile în „De rezolvat"
- Curăță comentariile stale `Placeholder` din `lib/compliance/route.ts`
- Adaugă persistență minimă pentru run-uri dacă vrem review repetabil

**Nu se face:** descris Agent OS ca autonomie completă fără review uman. Nu se închid task-uri automat pe baza unui proposal.

**Fișiere de atins:**
- `lib/compliance/agent-runner.ts` — leagă drift la baseline validat
- `lib/compliance/route.ts` — curăță Placeholder-uri stale
- `app/api/agent/commit/route.ts` — persistă zona evidence
- `lib/server/compliance-drift.ts` — conectare la snapshot history
- `components/compliscan/resolve-page.tsx` — afișare sugestii evidence din Agent OS

**Efort:** 4-5 zile | **Impact:** Mare — drift defensibil real

---

## S2.3 — DSAR tracking: modulul lipsă complet

### Problema
DSAR (Data Subject Access Requests) nu există în aplicație. Andrei are 30 zile legal să răspundă. Fără tracking, uită. DataGrail e evaluat la ~$1B tocmai pentru DSAR.

### Ce se construiește

```typescript
interface DSAR {
  id: string
  orgId: string
  receivedAt: Date
  deadline: Date           // receivedAt + 30 zile
  extendedDeadline?: Date  // max 60 zile total, cu notificare
  requesterName: string
  requesterEmail: string
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'objection' | 'restriction'
  status: 'received' | 'in_progress' | 'awaiting_verification' | 'responded' | 'refused'
  identityVerified: boolean
  draftResponseGenerated: boolean
  responseReviewedByHuman: boolean
  responseSentAt?: Date
  evidenceVaultIds: string[]
}
```

**Badge sidebar:** `2 DSAR active — 1 expiră în 5 zile`

**Flow:**
```
/dashboard/dsar → [+ Cerere nouă]
→ Introduci: Nume, Email, Tip cerere, Data primirii
→ Deadline calculat automat: 30 zile
→ Draft răspuns generat pe tip cerere (structură + date org)
→ Completezi secțiunile specifice
→ Trimiți MANUAL răspunsul
→ Încarci dovada de trimitere
→ DSAR marcat Rezolvat
```

**Fișiere de atins:**
- `lib/db/src/schema/dsars.ts` — schemă nouă
- `app/api/dsar/route.ts` — CRUD DSAR
- `app/dashboard/dsar/page.tsx` — pagina de management
- `components/compliscan/dsar/dsar-response-generator.tsx` — draft per tip
- `components/compliscan/sidebar/dsar-badge.tsx` — badge cu countdown

**Efort:** 3 zile | **Impact:** Mare — obligație legală neacoperită

---

## S2.4 — Post-incident tracking: ce face Andrei după ce trimite la DNSC

### Problema
Fluxul actual se oprește la „trimite MANUAL la DNSC". DNSC poate reveni cu întrebări, Andrei trebuie să documenteze numărul de înregistrare, raportul final de 30 zile trebuie pregătit.

### Ce se construiește

**State post-trimitere Early Warning:**
```
Incident: Acces neautorizat — 23 Mar 2026

[✓] Early Warning trimis — 23 Mar 14:32
    Număr înregistrare DNSC: [câmp de completat]

[⏰] Raport 72h — deadline: 25 Mar 14:32 (47h rămase)
    [Continuă draft →]

[○] Raport final — deadline: 22 Apr 2026

[✉] Corespondență DNSC
    [+ Adaugă răspuns primit]

Status: Parțial raportat — 2 din 3 etape rămase
```

**Fișiere de atins:**
- `app/dashboard/incidents/[id]/page.tsx` — timeline complet
- `components/compliscan/incident/incident-correspondence.tsx` — secțiune corespondență (nou)
- `lib/db/src/schema/incidents.ts` — câmpuri `dnscReference`, `dnscCorrespondence[]`

**Efort:** 2 zile | **Impact:** Completează fluxul NIS2 din S0.1

---

# SPRINT 3 — Consultant + Reporting (2 săptămâni)

---

## S3.1 — Portfolio batch draft actions

### Stare actuală reală
Portofoliul agregă bine alerte, task-uri, furnizori — dar acțiunea reală e în continuare „drilldown pe firmă". `components/compliscan/portfolio-alerts-page.tsx`, `portfolio-vendors-page.tsx`, `portfolio-tasks-page.tsx`, `lib/server/portfolio.ts` există.

### Ce se face
Batch actions sigure, limitate la generare drafturi și notificări:

```
Portofoliu → Alerte → [5 firme au AWS fără DPA]
→ [Generează 5 drafturi DPA]
→ Preview per firmă → Confirmă individual
→ 5 drafturi gata în 2 minute
→ [Trimite notificare clienților] (manual, per firmă)
```

**Batch-uri permise:**
- Generare drafturi (DPA, politici) pentru N firme cu aceeași problemă
- Trimitere digest email clienților afectați
- Deschidere lot de revizuiri vendor

**Nu se face niciodată în bulk:** acțiuni destructive, submit la autorități, schimbare ownership, confirmare politici (semnificație legală per firmă).

**Fișiere de atins:**
- `components/compliscan/portfolio-alerts-page.tsx` — adaugă batch CTA
- `lib/server/portfolio.ts` — logică batch generation
- `app/api/portfolio/batch/route.ts` — endpoint batch (nou)
- `components/compliscan/portfolio/batch-preview-modal.tsx` — preview per firmă înainte de confirmare (nou)

**Efort:** 4 zile | **Impact:** Mare pentru Elena (consultant)

---

## S3.2 — DNSC Wizard enrichment: mai mult prefill, nu reinventare

### Stare actuală reală
Wizard-ul există și e bun. Pasul `data-check` arată ce e disponibil. Draft markdown se generează din `lib/compliance/dnsc-wizard.ts`. Prefill există parțial pentru: denumire, CUI, sector, dimensiune.

### Ce se face
- Extinde prefill cu semnale ANAF din profil
- Adaugă copy per câmp
- Checklist mai clar pentru câmpurile obligatoriu manuale
- Semnalizare câmpuri lipsă înainte de draft (nu după)

**Câmpuri rămase manual (neschimbat):** adresă sediu, județ, persoana responsabilă securitate, email + telefon responsabil, trimiterea pe platforma DNSC.

**Fișiere de atins:**
- `app/dashboard/nis2/inregistrare-dnsc/page.tsx` — enrichment UI
- `lib/compliance/dnsc-wizard.ts` — extindere prefill
- `app/api/org/profile/prefill/route.ts` — surse suplimentare
- `lib/server/anaf-company-lookup.ts` — semnale ANAF în profil

**Efort:** 2 zile | **Impact:** Mediu

---

## S3.3 — Audit Pack Monthly: reminder → generare automată

### Stare actuală reală
`app/api/cron/audit-pack-monthly/route.ts` trimite email cu link spre Vault. `lib/server/audit-pack.ts` și exporturile dedicate există.

### Ce se face
- Pentru org-uri `pro` / `partner`, cron-ul generează automat audit pack-ul
- Salvează rezultatul în Vault / export registry
- Trimite owner-ului: pack gata de review SAU lista clară de gaps dacă pachetul e incomplet

**Regula de produs:** generare automată da, validare finală tot umană.

**Fișiere de atins:**
- `app/api/cron/audit-pack-monthly/route.ts` — logică generare pentru pro/partner
- `lib/server/audit-pack.ts` — extindere cu save în Vault
- `lib/server/audit-pack-bundle.ts` — bundling automat
- `app/api/exports/audit-pack/*` — extindere export registry

**Efort:** 2-3 zile | **Impact:** Mare pentru Elena (25 pack-uri automate) și Andrei

---

## S3.4 — Trial end + export date

### Problema
Zero specificat în aplicație despre ce se întâmplă la ziua 15 de trial. Dacă datele dispar fără avertisment, utilizatorul nu revine.

### Ce se construiește

**Stări de cont:**
```typescript
type AccountState =
  | 'trial_active'     // ziua 1-14
  | 'trial_expiring'   // ziua 11-14, avertisment progresiv
  | 'trial_expired'    // ziua 15+, fără upgrade, date accesibile read-only 90 zile
  | 'pro_active'
  | 'pro_grace'        // plată eșuată, 7 zile grace
  | 'pro_suspended'    // suspendat, date păstrate 90 zile
```

**Comportament la expirare:** vizualizare scoruri și findings (read-only), fără generare documente noi, fără import — date existente rămân 90 zile.

**Export întotdeauna disponibil** (inclusiv după expirare — obligație GDPR):
```
[Descarcă toate datele tale] → ZIP cu: documente, findings, dovezi Vault, scoruri
```

**Fișiere de atins:**
- `lib/billing/account-state.ts` — logica stărilor
- `middleware.ts` — restricții per stare
- `components/compliscan/billing/trial-banner.tsx` — banner progresiv ziua 11-14
- `app/api/export/route.ts` — export complet date utilizator
- `app/billing/page.tsx` — pagina upgrade cu comparație clară

**Efort:** 2 zile | **Impact:** Critic pentru business model și GDPR

---

## S3.5 — eFactura: SPV check + citire semnale (nu integrare de facturare)

### Decizie de produs

CompliScan NU face integrare de facturare. Nu se bate cu SmartBill, Saga sau Facturis.
CompliScan face **verificare conformitate eFactura** — verifică SPV și citește semnale de eroare, transformă în findings concrete.

### Ce face CompliScan

**Pas 1 — Verificare SPV (automat la onboarding și lunar):**
```
Din CUI + TVA activ → verifică ANAF API dacă firma e în SPV
→ DA → continuă la Pas 2
→ NU → finding „Înregistrare SPV lipsă"
        Task automat cu ghid ANAF + link direct
        Finding rămâne deschis până la confirmare manuală
```

**Pas 2 — Citire semnale (automat, din integrarea existentă):**
```
→ Facturi respinse ANAF → finding per factură cu motiv exact
→ Erori XML/UBL → finding cu eroarea specifică
→ Facturi netrimise > 5 zile → finding cu urgență
→ Discrepanțe e-TVA → finding fiscal
```

**Pas 3 — Finding concret în De rezolvat:**
```
Finding: „Factură respinsă ANAF — Amazon Web Services"
Motiv: „Eroare XML: câmp BuyerReference lipsă"
Acțiune: „Corectează în programul tău de facturare și retrimite"
→ Confirmare manuală → Finding rezolvat
```

### User story per profil

**Cristian (Solo):**
```
Onboarding → CUI → SPV check automat
→ E în SPV → 3 facturi respinse detectate → findings concrete
→ Cristian corectează în SmartBill → confirmă în CompliScan → rezolvat
→ NU e în SPV → task clar cu ghid ANAF pas cu pas
```

**Elena (Portfolio):**
```
/portfolio/alerts:
„8 firme au facturi respinse ANAF" / „3 firme nu sunt în SPV"
→ Batch task per firmă afectată
→ vendor-sync-monthly re-verifică SPV lunar pentru toate firmele
```

**Andrei (Compliance):**
```
Dashboard → Health Check:
„2 facturi respinse în ultimele 7 zile"
→ Finding cu detaliu + acțiune → Audit trail în Vault
```

### Ce NU face CompliScan
```
❌ Nu emite facturi
❌ Nu face XML UBL de la zero
❌ Nu înlocuiește SmartBill / Saga / Facturis
✅ Verifică conformitatea și spune exact ce e greșit
```

**Fișiere de atins:**
- `lib/compliance/rules/efactura-rule.ts` — SPV check + semnale (nu `coming_soon`)
- `lib/server/anaf-spv-client.ts` — client verificare SPV per CUI (nou)
- `app/api/efactura/spv-check/route.ts` — endpoint SPV check (nou)
- `app/api/efactura/signals/route.ts` — extindere cu findings concrete per semnal
- `components/compliscan/findings/efactura-finding.tsx` — UI specific per tip eroare
- `app/api/portfolio/overview/route.ts` — include semnale eFactura în agregare portfolio

**Efort:** 3 zile | **Impact:** Mare — Cristian, Elena, Andrei

---

# REGULILE DE AUTOMATIZARE — versiunea corectată

## Procente reale (nu optimiste)

| Document / Acțiune | Promis anterior | Real |
|---|---|---|
| Privacy Policy draft | „structură + articole" | 60% structură, 0% conținut specific firmei |
| DPA furnizor | „template + date org" | 70% dacă furnizorul e în library, 30% altfel |
| NIS2 Early Warning draft | „70% completat" | 35-40% |
| NIS2 Raport 72h draft | nespecificat | 25% |
| NIS2 Raport final draft | nespecificat | 15% |
| Registru Art.30 din import | „mapare + detectare" | 50% Excel curat, 20% altfel |
| DSAR draft răspuns | nespecificat | 40% |

## Regula neschimbabilă

```
AUTOMAT SIGUR:
→ Date factuale verificabile: ANAF, profil org, timestamps
→ Structura documentului și articolele legale
→ Detectarea problemei și sugestia de acțiune
→ Matching furnizori recunoscuți din library

CU CONFIRMARE OBLIGATORIE:
→ Orice conținut generat din date parțiale
→ Clasificări bazate pe inferențe
→ Orice text care intră într-un document oficial
→ Mapping coloane la import
→ Prefill NIS2 assessment

NICIODATĂ AUTOMAT:
→ Trimitere la autorități (DNSC, ANSPDCP)
→ Semnătură electronică
→ Bulk mutation pe toate firmele simultan
→ Orice acțiune ireversibilă
→ Marcare finding ca Rezolvat
```

---

# ORDINEA COMPLETĂ DE IMPLEMENTARE

| Sprint | Task | Efort | Impact |
|---|---|---|---|
| **S0** | S0.1 Ciclu NIS2 complet (3 etape) | 4 zile | Critic |
| **S0** | S0.2 Confirmare document înainte de resolve | 2 zile | Critic |
| **S0** | S0.3 Pagina /trust + DPA CompliScan | 1 zi | Critic B2B |
| **S1** | S1.1 Scoring convergent | 1-2 zile | Fundație |
| **S1** | S1.2 Findings → documente → dovadă (UX-driven) | 3 zile | Mare |
| **S1** | S1.3 Import Excel robust (edge cases + ANAF batch) | 4 zile | Mare |
| **S1** | S1.4 Onboarding Pasul 4 | 2 zile | Mare |
| **S1** | S1.5 Mobile UX | 3 zile | Mare |
| **S2** | S2.1 NIS2 assessment prefill cu confidence | 3-4 zile | Mare |
| **S2** | S2.2 Agent OS hardening (drift + evidence) | 4-5 zile | Mare |
| **S2** | S2.3 DSAR tracking complet | 3 zile | Mare |
| **S2** | S2.4 Post-incident tracking DNSC | 2 zile | Completează S0.1 |
| **S3** | S3.1 Portfolio batch draft actions | 4 zile | Mare (Elena) |
| **S3** | S3.2 DNSC Wizard enrichment | 2 zile | Mediu |
| **S3** | S3.3 Audit Pack lunar auto-generare | 2-3 zile | Mare |
| **S3** | S3.4 Trial end + export date | 2 zile | Business model |
| **S3** | S3.5 eFactura: SPV check + semnale | 3 zile | Mare (toți 3) |
| **S4** | S4.1 AI Act trust disclosure + CE decision gate | 1 zi | Critic B2B |
| **S4** | S4.2 AI Act risk classification auto-detect | 2 zile | Mare |
| **S4** | S4.3 EU Database submit wizard | 3 zile | Enterprise |

**Total estimat:** ~54-65 zile pe 5 sprints (S0-S4), cu S4 tratat ca post-S3 / extensie AI Act dacă nucleul S0-S3 este stabil.

> **Notă estimare:** Cifrele de mai sus sunt intervale orientative. Nu sunt promisiuni ferme. Tratează-le ca bază de planificare, nu deadline fix.

---

# SPRINT 4 — AI Act Completeness (1 săptămână, post-S3)

---

## S4.1 — AI Act trust disclosure + CE decision gate

### Problema
Elena înainte să recomande CompliScan celor 25 de clienți caută DPA-ul și badge-ul CE. Fără ele nu poate recomanda legal. Blocker B2B imediat.

### ⚠️ Clarificare juridică necesară înainte de implementare
CompliScan folosește AI (Agent OS, scoring, generator documente). Dacă aceste sisteme influențează decizii cu impact semnificativ asupra firmelor, pot intra în categoria **high-risk AI** conform Annex III AI Act — caz în care CE marking devine obligatoriu pentru CompliScan ca produs, nu doar pentru clienți.

**Dacă sistemele sunt informative** (recomandă, nu decide) → probabil limited risk → obligații de transparență (Art. 50), nu CE marking complet.

**Dacă sistemele influențează decizii** (scoring care blochează acces la servicii, clasificare risc cu consecințe) → high-risk → CE marking obligatoriu.

**→ Verifică cu counsel înainte de a pune badge CE.**

### Ce se construiește (după validare juridică)

**Pe `/trust`:**
```
Conformitate AI Act:
├── Sisteme AI folosite: [listă]
├── Clasificare risc: [Limited Risk / High Risk ?]
├── CE Marking: [ID dacă aplicabil ?]
├── Audit trail: Da (baseline snapshots + drift history)
└── Human oversight: Da (confirmare obligatorie pentru toate acțiunile)
```

**Badge în UI pentru pro/partner:**
```
[✓ AI Act Compliant — EU]  ← doar după validare juridică
sau
[✓ AI Act Transparent — Art. 50]  ← dacă limited risk
```

**Fișiere de atins:**
- `app/trust/page.tsx` — secțiune AI Act (extinde S0.3)
- `components/compliscan/ce-badge.tsx` — badge component (nou)
- `public/legal/ai-act-disclosure.pdf` — disclosure document

**Efort:** 1 zi | **Impact:** Critic B2B — blocker pentru Elena

---

## S4.2 — AI Act risk classification auto-detect

### Ce face
Când `runIntakeAgent` detectează un sistem AI, clasifică automat riscul conform Annex III:

```typescript
type AIActRiskLevel =
  | 'prohibited'     // Art. 5 — interzis (ex: social scoring, biometric mass surveillance)
  | 'high_risk'      // Annex III — HR screening, credit scoring, sisteme critice
  | 'limited_risk'   // Art. 50 — chatbots, deepfakes → obligații transparență
  | 'minimal_risk'   // fără obligații specifice

// Clasificare automată pentru sisteme cunoscute:
const KNOWN_CLASSIFICATIONS = {
  'hr-screening': 'high_risk',       // Annex III 4(a)
  'credit-scoring': 'high_risk',     // Annex III 5(b)
  'support-chatbot': 'limited_risk', // Art. 50
  'document-assistant': 'minimal_risk',
  'biometric-identification': 'prohibited', // Art. 5(1)(e) în spații publice
}
```

**UI în inventar AI:**
```
Sistem: HR Scorer
Clasificare: ⚠️ HIGH RISK (Annex III — Art. 10)
Deadline documentație: Aug 2026
Acțiuni necesare:
  ☐ Documentație tehnică (Annex IV)
  ☐ Evaluare conformitate
  ☐ Înregistrare EU Database
  [Generează draft documentație]
```

**⚠️ Notă:** Clasificarea automată propune, userul confirmă. Nu se marchează niciodată automat ca „conform" fără confirmare umană.

**Fișiere de atins:**
- `lib/compliance/ai-act-classifier.ts` — clasificare per tip sistem (nou)
- `lib/compliance/agent-runner.ts` — integrare în `runIntakeAgent`
- `app/dashboard/sisteme/page.tsx` — UI clasificare + deadline + acțiuni
- `app/api/ai-systems/route.ts` — extindere cu risk level + deadline

**Efort:** 2 zile | **Impact:** Mare — diferențiator față de Vanta/Drata

---

## S4.3 — EU Database submit wizard

### Context
Sistemele AI high-risk trebuie înregistrate în EU AI Database înainte de punerea pe piață (Art. 71 AI Act). Deadline real: **2 august 2026** pentru sisteme high-risk existente.

### ⚠️ Clarificări necesare
- **FLOPs calculator**: Nu e necesar pentru CompliScan dacă folosește API-uri externe (Gemini, OpenAI) — FLOPs aparțin furnizorului, nu CompliScan. Relevant doar dacă antrenezi modele proprii.
- **Cine submitează**: CompliScan ajută **clienții** să submiteze pentru sistemele lor AI (ex: Andrei cu HR Scorer), nu submitează el însuși decât dacă e obligat ca furnizor.

### Ce se construiește

```
/dashboard/sisteme → sistem high-risk selectat
→ [Pregătește înregistrare EU Database]
→ Wizard:
  Pas 1: Verifică datele sistemului (prefill din inventar)
  Pas 2: Generează JSON conform schema EU AI Database
          → 80% completat din datele existente
          → Câmpuri lipsă marcate clar
  Pas 3: Preview + confirmare
  Pas 4: Instrucțiuni exacte pentru submit manual pe
          https://ec.europa.eu/futurium/en/ai-alliance-consultation.html
          [Copiază JSON] [Descarcă]

NICIODATĂ auto-submit — userul trimite manual.
```

**Fișiere de atins:**
- `lib/compliance/ai-act-exporter.ts` — generare JSON EU Database format (nou)
- `app/api/ai-act/prepare-submission/route.ts` — endpoint pregătire (nou)
- `app/dashboard/sisteme/eu-db-wizard/page.tsx` — wizard UI (nou)

**Efort:** 3 zile | **Impact:** Enterprise — deadline aug 2026

---

# USER STORIES CAP-COADĂ

---

## USER STORY 1 — CRISTIAN (Solo, firmă construcții, 8 angajați)

### Ziua 1 — Prima utilizare

```
1. Cristian accesează compliscanag.vercel.app
   → Vede landing page: „Ești gata de control"
   → Apasă [Începe gratuit — 2 minute]

2. Register: email + parolă
   → Redirect automat la /onboarding

3. Onboarding Pas 1: „Cum folosești CompliScan?"
   → Alege: Proprietar / Manager
   → userMode = solo setat

4. Onboarding Pas 2: „CUI-ul firmei tale"
   → Introduce CUI
   → ANAF prefill automat: denumire, adresă, CAEN, TVA ✅
   → Confirmă datele

5. Onboarding Pas 3: „Ce legi ți se aplică"
   → Sistem detectează automat: GDPR ✅, eFactura ✅
   → Cristian confirmă cu 1 click

6. Onboarding Pas 4 (NOU — S1.4): „Primul tău raport"
   → 🔴 Privacy Policy lipsă — [Generează acum — 5 min]
   → 🟡 Registru Art.30 necompletat
   → 🟡 DPA cu AWS lipsă
   → 🟢 eFactura — SPV verificat ✅
   → Scor azi: 34/100 → poți ajunge la 70 rezolvând riscul roșu

7. Cristian apasă [Generează Privacy Policy acum]
   → Flow S1.2 + S0.2:
   → Wizard date specifice: ce date colectezi, de ce, furnizori
   → Preview politică în 30 secunde
   → Confirmă că datele sunt corecte (bifare obligatorie)
   → [Aprobă și atașează ca dovadă]
   → Finding rezolvat ✅ — scor crește la 55/100

8. Cristian e satisfăcut — a rezolvat ceva real în 8 minute
   → Nu a navigat prin 4 pagini diferite
   → Nu a descărcat și re-uploadat manual
```

### Săptămâna 1 — Lucru continuu

```
9. Dashboard arată NextBestAction: „DPA cu AWS lipsă"
   → Click → Finding: „Furnizor AWS fără DPA"
   → [✨ Generează DPA acum]
   → Wizard: confirmă că AWS procesează date (hosting site)
   → DPA generat din library (70% completat automat)
   → Cristian completează câmpurile specifice
   → Confirmă → atașează ca dovadă → rezolvat ✅

10. eFactura finding:
    → SPV check automat: Cristian E în SPV ✅
    → Semnale trase: 1 factură respinsă ANAF
    → Finding: „Factură respinsă — Telekom Romania"
    → Motiv: „Eroare XML: câmp TaxTotal incorect"
    → Acțiune: „Corectează în programul de facturare"
    → Cristian corectează în SmartBill → confirmă → rezolvat ✅

11. La 30 zile: scor 74/100, stare audit „În progres"
    → Cristian are ce arăta dacă vine un control
```

### Ce face sistemul automat vs Cristian manual

```
SISTEM AUTOMAT:
✅ ANAF prefill la onboarding
✅ Detectare legi aplicabile
✅ SPV check eFactura
✅ Citire semnale facturi respinse
✅ Generare structură documente
✅ Matching furnizori în library (AWS, Microsoft etc.)
✅ Scoring actualizat după fiecare acțiune

CRISTIAN MANUAL (obligatoriu):
→ Confirmă datele specifice firmei sale în wizard
→ Bifează că a citit și înțelege documentul
→ Corectează eroarea în SmartBill
→ Confirmă că a rezolvat
→ Nicio acțiune legală nu se execută fără el
```

---

## USER STORY 2 — ELENA (Partner, consultant, 25 clienți)

### Dimineața tipică

```
1. 07:30 — Elena deschide /portfolio
   → daily-digest (cron 08:00) nu a sosit încă
   → Vede tabelul agregat: 25 firme, scoruri, status

2. Vede 3 firme roșii:
   → TechNova SRL: incident NIS2 activ — badge roșu sidebar
   → LogiTrans: factură respinsă ANAF
   → MedPlus: DPA expirat cu AWS

3. Click pe badge incident TechNova:
   → Incident: Acces neautorizat — detectat ieri 14:00
   → Early Warning: ✅ trimis (draft generat automat S0.1)
   → Raport 72h: ⏰ 38h rămase — [Continuă draft]
   → Elena deschide draft-ul: 25% completat automat
   → Completează vectorul de atac și sistemele compromise
   → Salvează draft → clientul TechNova primește notificare
   → Elena nu a scris raportul de la zero — a completat 75%

4. /portfolio/alerts:
   → „AWS fără DPA la 5 firme"
   → [Generează 5 drafturi DPA] — batch S3.1
   → Preview per firmă → confirmă individual
   → 5 drafturi gata în 2 minute
   → Trimite fiecărui client: „DPA-ul e gata, verifică și semnează"

5. LogiTrans — factură respinsă:
   → Finding specific: „Factură respinsă — factură #1234"
   → Motiv: eroare XML
   → Elena trimite task clientului: „Corectează în programul tău"

6. MedPlus — DPA expirat:
   → vendor-review-revalidation cron a detectat expirarea
   → Finding: „DPA AWS expirat — 5 zile"
   → [Reînnoiește DPA] → draft generat din library → trimis clientului
```

### Import clienți noi (S1.3)

```
7. Elena are 5 clienți noi în Excel:
   → /portfolio → [Import clienți]
   → Upload fișier Excel

8. Preview import:
   → ✓ 4 firme valide
   → ⚠ 1 CUI format greșit: „RO 12.345.678" → normalizat automat
   → Mapping detectat: „Firmă" → orgName, „CUI" → cui ✅
   → „Status GDPR" → notes ⚠ (nu avem câmp direct)
   → [Confirmă și importă]

9. ANAF batch prefill:
   → Obținere date: 4/5 firme procesate ████████░░
   → 1 firmă ANAF timeout → [Reîncearcă individual]

10. 5 firme importate → SPV check automat pentru fiecare
    → 2 firme nu sunt în SPV → finding automat per firmă
```

### Ce face sistemul vs Elena manual

```
SISTEM AUTOMAT:
✅ Draft NIS2 incident 25% completat
✅ Agregare cross-firmă în /portfolio
✅ Detectare DPA expirate (cron zilnic)
✅ SPV check la import
✅ Batch DPA drafturi pentru N firme
✅ vendor-sync-monthly revalidare lunară

ELENA MANUAL (obligatoriu):
→ Completează 75% din raportul NIS2
→ Confirmă fiecare draft per firmă în batch
→ Trimite clienților pentru semnătură
→ Verifică mapping coloane la import
→ Nimic nu se trimite automat la autorități
```

---

## USER STORY 3 — ANDREI (Compliance intern, DPO, 80 angajați)

### Incident NIS2 real-time

```
1. Luni 14:00 — coleg raportează acces neautorizat la server
   → Andrei creează incident în /dashboard/nis2
   → Tip: unauthorized_access
   → Data detectare: acum

2. Sistem generează automat (S0.1):
   → Early Warning draft: 40% completat
     - Date org ✅
     - Timestamp ✅
     - Tip incident ✅
     - Impact transfrontalier: ? (Andrei completează)
     - Măsuri imediate: ? (Andrei completează)
   → Deadline: Luni 14:00 + 24h = Marți 14:00
   → Badge sidebar: „⏰ Early Warning — 23h45m rămase"

3. Andrei completează câmpurile lipsă (60%):
   → Impact transfrontalier: Da/Nu
   → Sisteme afectate: [selectează din inventarul AI]
   → Măsuri imediate luate
   → [Salvează draft]

4. Marți 10:00 — review final:
   → Andrei verifică tot documentul
   → Disclaimer: „Verificat și aprobat de [Andrei] la [timestamp]"
   → [Marchează ca gata de trimis]
   → Instrucțiuni exacte: „Accesează nis2.dnsc.ro și uploadează"
   → Andrei trimite MANUAL pe platforma DNSC
   → Introduce numărul de înregistrare în CompliScan

5. Marți 14:30 — badge actualizat:
   → ✅ Early Warning trimis (ref: DNSC-2026-1234)
   → ⏰ Raport 72h — 47h30m rămase [Continuă draft]
   → ○ Raport final — 28 zile
```

### NIS2 Assessment

```
6. Andrei deschide assessment NIS2:
   → Vede: „7 răspunsuri propuse automat — confirmă"
   → Supply-chain: DA (din nis2.vendors — AWS, Microsoft cu DPA) ✅
   → Dimensiune: DA (80 angajați din orgProfile) ✅
   → Training: DA (din boardMembers — 3 persoane cu training NIS2) ✅
   → Backup policy: ? (nu există dovadă în Vault — Andrei completează)
   → MFA: ? (Andrei verifică și confirmă)

7. Andrei completează 13 întrebări rămase manual
   → Timp total: 20 minute în loc de 60+
```

### AI Act (S4.2)

```
8. Andrei are HR Scorer în inventar:
   → Sistem clasificat automat: ⚠️ HIGH RISK (Annex III)
   → Deadline: 2 august 2026
   → Acțiuni: documentație tehnică (Annex IV) lipsă
   → [Generează draft documentație]
   → Draft 60% completat din datele sistemului
   → Andrei completează specificațiile tehnice
   → [Pregătește înregistrare EU Database] → wizard S4.3
```

---

# USER STORIES — TABEL REZUMAT

| Acțiune | Cristian (Solo) | Elena (Partner) | Andrei (DPO) | Automat | Manual |
|---|---|---|---|---|---|
| Onboarding + ANAF prefill | ✅ | ✅ per client | ✅ | 90% | 10% confirmare |
| Privacy Policy | ✅ | ✅ batch | ✅ | 60% structură | Date specifice + confirmare |
| DPA furnizor | ✅ | ✅ batch 5 firme | ✅ | 70% library | Câmpuri specifice + confirmare |
| eFactura SPV check | ✅ automat | ✅ cross-firmă | ✅ | 100% detectare | Corectare în SmartBill |
| NIS2 Assessment | N/A | ✅ per client | ✅ | Prefill parțial | 13+ întrebări manuale |
| NIS2 Incident draft | N/A | ✅ pentru clienți | ✅ | 25-40% per etapă | 60-75% completare |
| DSAR răspuns | Rar | ✅ per client | ✅ frecvent | 40% structură | Conținut specific + trimitere |
| Import clienți | N/A | ✅ Excel | ✅ Excel | 80% mapare | Confirmare + ANAF retry |
| AI Act clasificare | N/A | ✅ per client | ✅ | Auto-detect | Confirmare + documentație |

---

# REGULILE DE AUTOMATIZARE — versiunea finală

## Procente reale (nu optimiste)

| Document / Acțiune | Real |
|---|---|
| Privacy Policy draft | 60% structură, 0% conținut specific firmei |
| DPA furnizor (library) | 70% dacă furnizorul e în library, 30% altfel |
| NIS2 Early Warning draft | 35-40% |
| NIS2 Raport 72h draft | 25% |
| NIS2 Raport final draft | 15% |
| Registru Art.30 din import | 50% Excel curat, 20% altfel |
| DSAR draft răspuns | 40% |
| EU Database JSON (AI Act) | 80% din date existente |
| eFactura SPV check | 100% automat |
| eFactura semnale → findings | 100% automat |

## Regula neschimbabilă

```
AUTOMAT SIGUR:
→ Date factuale verificabile: ANAF, profil org, timestamps, SPV status
→ Structura documentului și articolele legale
→ Detectarea problemei și sugestia de acțiune
→ Matching furnizori recunoscuți din library
→ SPV check și citire semnale eFactura

CU CONFIRMARE OBLIGATORIE:
→ Orice conținut generat din date parțiale
→ Clasificări bazate pe inferențe (AI Act risk level)
→ Orice text care intră într-un document oficial
→ Mapping coloane la import
→ Prefill NIS2 assessment

NICIODATĂ AUTOMAT:
→ Trimitere la autorități (DNSC, ANSPDCP, EU AI Database)
→ Semnătură electronică
→ Bulk mutation pe toate firmele simultan
→ Orice acțiune ireversibilă
→ Marcare finding ca Rezolvat fără confirmare umană
→ CE marking fără validare juridică prealabilă
```

---

# OWNERS PER TASK

| Task | Product | Backend | Frontend | Legal Review | Ops |
|---|---|---|---|---|---|
| S0.1 Ciclu NIS2 | ✓ | ✓ | ✓ | ✓ obligatoriu | - |
| S0.2 Confirmare document | ✓ | ✓ | ✓ | ✓ obligatoriu | - |
| S0.3 Trust + DPA | ✓ | - | ✓ | ✓ obligatoriu | - |
| S1.1 Scoring convergent | - | ✓ | - | - | - |
| S1.2 Findings → dovadă | ✓ | ✓ | ✓ | - | - |
| S1.3 Import Excel | ✓ | ✓ | ✓ | - | - |
| S1.4 Onboarding Pas 4 | ✓ | ✓ | ✓ | - | - |
| S1.5 Mobile UX | ✓ | - | ✓ | - | - |
| S2.1 NIS2 prefill | ✓ | ✓ | ✓ | ✓ review prefill text | - |
| S2.2 Agent OS hardening | - | ✓ | - | - | - |
| S2.3 DSAR tracking | ✓ | ✓ | ✓ | ✓ obligatoriu | - |
| S2.4 Post-incident tracking | ✓ | ✓ | ✓ | - | - |
| S3.1 Portfolio batch | ✓ | ✓ | ✓ | - | - |
| S3.2 DNSC Wizard enrichment | ✓ | ✓ | ✓ | ✓ review câmpuri | - |
| S3.3 Audit Pack lunar | - | ✓ | - | - | ✓ cron |
| S3.4 Trial end + export | ✓ | ✓ | ✓ | ✓ GDPR portability | ✓ billing |
| S3.5 eFactura SPV | ✓ | ✓ | ✓ | - | ✓ ANAF rate limit |
| S4.1 AI Act disclosure | ✓ | - | ✓ | ✓ obligatoriu | - |
| S4.2 AI Act clasificare | ✓ | ✓ | ✓ | ✓ obligatoriu | - |
| S4.3 EU DB wizard | ✓ | ✓ | ✓ | ✓ obligatoriu | - |

---

# DEPENDENCIES ȘI BLOCKERS

| Task | Depinde de | Blocat dacă |
|---|---|---|
| S0.2 | S1.2 (flow finding) | Se implementează separat — trebuie integrate în același flow |
| S1.2 | S0.2 | Wizard de confirmare trebuie să existe înainte de flow finding |
| S1.3 | - | Independent, dar necesită template standard descărcabil ca fallback |
| S1.4 | S1.2 | CTA din Pas 4 trebuie să ducă în flow-ul finding complet |
| S2.1 | S1.1 | Scoring convergent trebuie să fie stabil înainte de prefill NIS2 |
| S2.2 | S1.1 | Baseline validat trebuie să existe pentru drift defensibil |
| S2.4 | S0.1 | Tracking post-incident completează modelul de date din S0.1 |
| S3.1 | S1.3 + portfolio stabil | Import bun + API portfolio stabile din Wave 2 |
| S3.3 | Vault consistency | Export registry și audit-pack trebuie să fie stabile |
| S3.4 | Stripe + billing state | Logica stărilor de cont depinde de webhook Stripe stabil |
| S4.1 | Validare juridică externă | NU se livrează fără counsel — nu e blocker tehnic, e blocker legal |
| S4.2 | S2.2 (Agent OS) | runIntakeAgent trebuie să fie stabil înainte de clasificare |
| S4.3 | S4.2 | Clasificarea trebuie să existe înainte de wizard EU Database |

---

# RELEASE GATES

Acestea sunt condiții minime înainte de release public per task critic.

| Task | Gate — nu se livrează public fără |
|---|---|
| S0.1 | Test manual pe toate 3 etapele (Early Warning → 72h → Final) cu incident real sau seed complet; zero incidente cu status „Raportat" care nu au toate 3 etapele |
| S0.2 | Confirmare reală testată în flow — finding nu poate fi marcat Rezolvat fără bifare explicită; verificat că disclaimer apare pe toate documentele generate |
| S0.3 | DPA CompliScan semnat și descărcabil; pagina /trust live cu toate câmpurile completate; validat de counsel |
| S1.3 | Testat cu minim 5 fișiere Excel reale de la utilizatori (nu mock-uri); template standard descărcabil funcțional; ANAF batch cu retry testat |
| S2.3 | Zero DSAR-uri fără deadline vizibil; draft răspuns generat corect per tip cerere; validat de counsel pentru termene și motive refuz |
| S3.4 | Export complet validat — ZIP cu toate datele; testat că datele rămân accesibile 90 zile după expirare; banner trial afișat corect din ziua 11 |
| S4.1 | NU se pune badge CE fără aviz juridic explicit; pagina /trust poate fi livrată cu „AI Act Transparent — Art. 50" fără aviz dacă sistemele sunt limited risk confirmat |
| S4.2 | Clasificare high-risk validată de counsel pentru tipurile de sisteme AI din CompliScan; nicio clasificare automată nu se marchează fără confirmare umană |

---

# RECOMANDĂRI OPERATIVE FINALE

**1. Notificare 2h înainte de deadline NIS2 (S0.1)**
În momente de criză, Andrei sau Elena pot uita să verifice dashboard-ul.
Sistemul trimite Email + Push cu 2 ore înainte de fiecare deadline (24h, 72h):
```
„⚠️ Raport 72h NIS2 — TechNova SRL — 2 ore rămase. Deschide draft →"
```
Fișier: `lib/server/nis2-deadline-notifier.ts` — verificare la fiecare cron `score-snapshot` (07:50)

**2. Template standard descărcabil la import Excel (S1.3)**
Contabilii sunt creativi cu Excel-ul. Oricât de bun e parserul, va eșua pe unele fișiere.
Pune un buton mare [⬇ Descarcă template standard] vizibil înainte de upload.
Dacă importul eșuează → afișează același buton ca cale de salvare imediată.
```
„Importul a eșuat pe 3 rânduri. Descarcă template-ul nostru standard
și completează direct — durează 5 minute."
```

**3. AI Act CE marking — folosește „AI Act Transparent — Art. 50" până la aviz (S4.1)**
Procesul de marcare CE pentru software AI high-risk este birocratic și costisitor.
Până la certificarea finală și avizul de counsel, formularea sigură juridic este:
```
[✓ AI Act Transparent — Art. 50]
```
Nu pune badge CE complet fără aviz. Risc de răspundere dacă sistemele sunt clasificate altfel.

---

# METRICI DE SUCCES

| Task | Metrica |
|---|---|
| S0.1 Ciclu NIS2 | Zero incidente cu status „Raportat" fără cele 3 etape completate |
| S0.2 Confirmare document | Zero findings marcate „Rezolvat" fără bifare confirmare |
| S0.3 Trust page | DPA descărcabil disponibil înainte de prima vânzare B2B |
| S1.1 Scoring | Același scor pe dashboard, benchmark, rapoarte, email |
| S1.2 Flow findings | Cristian rezolvă primul finding în <8 minute, 1 flow, fără redirect |
| S1.3 Import | >90% din fișierele testate cu utilizatori reali importate fără eroare critică |
| S1.4 Onboarding | Pasul 4 afișat pentru 100% din utilizatorii noi |
| S1.5 Mobile | Onboarding completat pe mobil în <5 minute |
| S2.1 NIS2 prefill | Cel puțin 5 întrebări propuse automat cu sursă clară per org completă |
| S2.3 DSAR | Zero DSAR-uri fără deadline vizibil în UI |
| S3.1 Batch | Elena poate genera 5 DPA-uri în <3 minute fără drilldown per firmă |
| S3.4 Trial | Zero utilizatori care pierd date fără avertisment cu 3+ zile înainte |
| S3.5 eFactura | SPV check funcțional pentru 100% din firmele testabile, cu fallback și retry controlat pentru erori serviciu extern |
| S4.1 AI Act disclosure | Pagina /trust actualizată cu secțiune AI Act; CE decision gate documentat și așteptând validare juridică |
| S4.2 AI Act | 100% sisteme high-risk cu clasificare și deadline vizibil |
| S4.3 EU Database | Draft JSON generat în <5 minute per sistem high-risk |

---

# CONCLUZIE

**Cele 3 priorități absolute, în ordine:**

1. **Nu crea fals sentiment de conformitate** (S0.2) — risc legal pentru CompliScan și utilizatori
2. **Completează ciclul NIS2 la 3 etape** (S0.1) — utilizatorii existenți sunt expuși acum
3. **Fă importul să funcționeze cu Excel-uri murdare** (S1.3) — fără asta Elena și Andrei nu adoptă

Orice altă funcție este secundară față de aceste trei.

**Diferențiatorii față de competiție:**
- Incident NIS2 cu 3 etape reale + tracking post-raportare — niciun alt tool RO nu face asta
- eFactura conformitate nativă pentru piața românească
- AI Act risk classification cu deadline aug 2026

---

> **Notă legal review:** Textele NIS2 (termene, conținut minim per raport), DSAR (termene, motive de refuz), disclaimer-ul documentelor generate, CE marking și clasificarea AI Act trebuie verificate cu un specialist/counsel înainte de release public. Documentul este corect ca orientare de produs — formulările exacte din UI au nevoie de validare juridică finală.
