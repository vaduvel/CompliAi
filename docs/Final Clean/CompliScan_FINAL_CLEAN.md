# CompliScan — Document Final de Implementare
## Romania-first compliance ops, construit pe ce exista deja

**Data:** 2026-03-24
**Versiune:** FINAL CLEAN — o singura sursa de adevar
**Regula:** nu reinventam produsul. Plecam din ce exista deja si continuam inteligent.

---

# 0. Ce ramane neschimbat

CompliScan ramane:
- un compliance operations system
- intake + scan + findings + remediation + evidence + output
- human-in-the-loop
- fara verdict juridic final automat
- fara actiuni legale trimise automat la autoritati

Nu deviem spre:
- ERP
- soft de facturare
- avocat automat
- chatbot juridic generic
- company intelligence tool pur tip Termene
- GRC enterprise generic

Formula:
**Fact -> Finding -> Action -> Evidence -> Output -> Revalidation**

---

# 0-BIS. Regula universala de confirmare (neschimbabila)

> Niciun finding nu poate fi marcat „Rezolvat" fara cel putin o actiune constienta din partea utilizatorului care confirma ca documentul reflecta realitatea firmei sale.

> Nicio actiune legala (raport DNSC, trimitere ANSPDCP, semnatura) nu se executa automat. Omul decide, sistemul pregateste.

### Ce inseamna concret

Inainte de orice rezolvare de finding, userul trebuie sa:
1. Completeze datele specifice firmei (wizard obligatoriu)
2. Revizuiasca documentul generat
3. Bifeze confirmare explicita ca datele reflecta realitatea
4. Abia apoi finding-ul se marcheaza rezolvat

Acest flow se aplica UNIFORM pe toate motoarele:
- Privacy Policy, DPA, orice document generat
- eFactura finding-uri
- Vendor Review closure
- DSAR response
- NIS2 rapoarte
- AI Act clasificari

Disclaimer permanent pe orice document generat:
```
Document generat pe baza datelor introduse de tine.
Conformitatea reala depinde de corectitudinea datelor
introduse si implementarea efectiva a masurilor descrise.
CompliScan nu ofera consultanta juridica.
```

### Procente reale de automatizare (oneste)

| Document / Actiune | Fara enrichment | Cu site scan + vendor library + orgKnowledge |
|---|---|---|
| Privacy Policy draft | 60% structura, 0% continut specific | 80-85% |
| DPA furnizor (library) | 70% | 85-90% |
| DPA furnizor (necunoscut) | 30% | 50-60% |
| NIS2 Early Warning draft | 35-40% | 50-55% |
| NIS2 Raport 72h draft | 25% | 35-40% |
| Registru Art.30 din import | 50% Excel curat | 70% |
| DSAR draft raspuns | 40% | 60-70% |

### Regula de automatizare

```
AUTOMAT SIGUR:
→ Date factuale verificabile: ANAF, profil org, timestamps, SPV status
→ Structura documentului si articolele legale
→ Detectarea problemei si sugestia de actiune
→ Matching furnizori recunoscuti din library
→ SPV check si citire semnale eFactura
→ Cookie/tracker scan de pe site

CU CONFIRMARE OBLIGATORIE:
→ Orice continut generat din date partiale
→ Clasificari bazate pe inferente (AI Act risk level)
→ Orice text care intra intr-un document oficial
→ Mapping coloane la import
→ Prefill NIS2 assessment
→ Date din orgKnowledge reutilizate in alt context

NICIODATA AUTOMAT:
→ Trimitere la autoritati (DNSC, ANSPDCP, EU AI Database)
→ Semnatura electronica
→ Bulk mutation pe toate firmele simultan
→ Orice actiune ireversibila
→ Marcare finding ca Rezolvat fara confirmare umana
```

---

# 1. Ce este deja in CompliScan

- agenti de intake / findings / drift / evidence
- scoring canonic
- NIS2 assessment + DNSC wizard partial
- finding -> document hook
- generator documente
- evidence upload + Vault
- import CSV partial
- cron-uri pentru snapshots / digest / vendor sync
- Vendor Review workbench (branching, 6 intrebari, assets, revalidation, overdue, closure)
- Partner Hub / multi-client
- semnale eFactura si health / audit pack / one-page report
- IA revizuita cu Resolution Layer si pagina "De rezolvat"
- pagini publice: `/`, `/pricing`, `/login`, `/claim`, `/demo/*`, `/genereaza-dpa`, `/genereaza-politica-gdpr`

---

# 2. Ce vindem de fapt

- risc redus continuu
- munca economisita
- dovezi si output cand ai nevoie
- urgenta clara si remediere rapida
- leverage pentru consultant / contabil
- monitorizare Romania-first

---

# 3. Segmente si shell-uri

## Segment #1 — Consultant / contabil / cabinet (BUYER PRINCIPAL)
**Ce vrea:** 20-50 firme, import rapid, urgenta cross-client, batch actions, audit packs, raport simplu
**Shell:** Portofoliu → Clienti → De rezolvat → Rapoarte → Setari
**Drill-down per firma:** Acasa → Scaneaza → De rezolvat → Rapoarte → Setari

## Segment #2 — Mid-market / DPO / compliance intern
**Ce vrea:** NIS2, vendor review, evidence, incidente, AI systems, deadlines
**Shell:** Acasa → Scaneaza → De rezolvat → Rapoarte → Setari

## Segment #3 — Solo / micro
**Ce vrea:** prima valoare in 10 minute, sa nu invete produsul, sa rezolve 1-2 lucruri reale
**Entry points:** Genereaza DPA / Genereaza politica / Verifica ce ti se aplica / Vezi primul raport

---

# 4. UX universal

## Resolution Layer — regula pentru fiecare problema
1. Problema
2. Impact
3. Actiune
4. Asset generat / document / ghid
5. Pas uman (confirmare obligatorie)
6. Dovada
7. Revalidare

## "De rezolvat" — coada unica universala
Aici ajung TOATE problemele:
- findings GDPR
- gaps NIS2
- eFactura findings
- Vendor DPA issues
- DSAR deadline issues
- AI Act high-risk actions
- site scan findings
- Pay Transparency checklist

Nu imprastii in module separate.

---

# 5. ORDINEA GOLD — singura lista de prioritati

## ETAPA 1 — Bani rapizi + risc real

### GOLD 1 — Partner Hub + Import Excel + Queue cross-client
**De ce:** buyer principal, monetizare rapida
**Exista deja:** Partner Hub, import CSV partial, portfolio pages, urgency queue partial
**Backend de construit:**
- Excel parser robust (header variabil, fuzzy mapping, normalizare CUI, duplicates, preview per row)
- ANAF batch prefill cu rate limiting (1 req/sec)
- Batch action service (select N firme cu aceeasi problema → drafturi per firma → confirmare individuala)
- Queue aggregator cross-client (group by client / framework / severity / deadline)

**UI de construit:**
- Pagina Portofoliu (top metrics, urgency widgets, top 10 firme)
- Pagina Clienti (search, filters, score/alert columns, quick actions)
- De rezolvat cross-client (firma + finding + severity + deadline + CTA)
- Import wizard (upload → preview mapping → row warnings → progress → ANAF prefill progress)
- Batch preview modal (preview per firma, skip/include, confirmare individuala)

**Done cand:**
- Elena importa 25 firme din Excel murdar fara blocaje
- Elena genereaza 5 drafturi in lot sub 3 minute
- Urgenta cross-client vizibila intr-o singura coada

---

### GOLD 2 — eFactura / SPV compliance monitor
**De ce:** durere recurenta, Romania-first, usor de vandut
**Exista deja:** validator UBL, semnale, client ANAF/mock, findings model, health logic
**Regula de produs:** CompliScan NU emite facturi. Verifica conformitatea.

**Backend de construit:**
- SPV check service per CUI
- Cron/re-check lunar SPV
- Findings generator per tip semnal (factura respinsa, XML error, unsubmitted >X zile, discrepancy)
- Mapping semnal → actiune recomandata
- Portfolio aggregation

**UI de construit:**
- Health card eFactura pe dashboard
- Finding card specializat (factura, motiv, severitate, actiune, status, dovada)
- Lista semnale per firma
- Summary pe portofoliu
- Quick filters: rejected / delayed / unresolved / resolved

**Finding types concrete:**
- SPV lipsa → ghid activare ANAF
- Factura respinsa → motiv exact + actiune in SmartBill/Saga
- Intarziere transmitere → urgenta + deadline
- Eroare XML → explicare cod + actiune

**Done cand:**
- Firma cu TVA activ primeste SPV check
- Fiecare semnal important produce finding concret cu motiv exact
- Consultantul vede semnalele cross-client

---

### GOLD 3 — Vendor Review + DPA + evidence + Vendor Library
**De ce:** motor central recurent, abonament justificat
**Exista deja:** Vendor Review workbench complet (branching, evidence, overdue, revalidation, closure, partner mode)

**Backend de construit:**
- Vendor Fingerprinting Library (50-100 furnizori: AWS, Google, Microsoft, Stripe, SmartBill, Saga, FAN Courier, SameDay, Cargus, eMAG, Shopify, WooCommerce, Mailchimp, SendGrid, Cloudflare, Hetzner, Vercel, Netlify, Supabase, Sentry etc.)
- Fiecare furnizor: nume canonical, alias-uri, categorie, tipuri date, DPA public link, transfer clues, certificari
- Fingerprint matcher (exact + alias + fuzzy)
- Auto-seeding mai bun din facturi / scanari / AI systems / vendor registry
- Stale evidence detector
- DPA expiry tracking
- Counsel-ready brief exporter

**UI de construit:**
- Vendor queue simplificata (detected → needs context → awaiting evidence → overdue)
- Badge `Recunoscut din library` + `DPA public disponibil`
- DPA missing/expired badges foarte clare
- CTA: `Genereaza draft DPA` / `Trimite catre client`
- Batch mode pentru Elena (5 firme cu AWS → genereaza draft review/DPA pack)

**Done cand:**
- Top 50-100 furnizori comuni sunt recunoscuti automat
- Review-ul vine pre-umplut unde exista match
- DPA missing/expired apare clar in queue
- Elena poate actiona cross-client

---

### GOLD 4 — Rights requests / DSAR minim viabil
**De ce:** risc real, motiv frecvent de sanctiune ANSPDCP, bani salvati direct
**Exista deja:** fundatie findings/tasks/evidence/vault

**Backend de construit:**
- DSAR schema (id, orgId, receivedAt, deadline 30 zile, requesterName/Email, requestType, status, identityVerified, draftGenerated, reviewedByHuman, responseSentAt, evidenceVaultIds)
- CRUD
- Deadline calculator (30 zile + extensie posibila la 60)
- Response draft generator light per tip cerere

**UI de construit:**
- Pagina DSAR
- Badge countdown in sidebar/dashboard
- Form cerere noua
- Response draft view
- Evidence attach
- Portfolio aggregate (Elena: "3 DSAR active cross-client")

**Done cand:**
- Zero DSAR fara deadline vizibil
- Zero inchidere fara dovada minima
- Draft raspuns generat per tip cerere

---

### GOLD 5 — /trust + Response Pack + B2B readiness
**De ce:** credibilitate, vanzare B2B
**Exista deja:** generator, one-page report, response pack, audit pack, vault, pagini publice

**Backend de construit:**
- Trust content source unificat
- Export presets (one-page, response pack, audit pack, counsel brief)
- Sharing links sigure/expirabile

**UI de construit:**
- `/trust` (DPA descarcabil, subprocesori, hosting/retentie/stergere, AI trust disclosure)
- Rapoarte: 4 carduri (Audit Pack, Raport 1 pagina, Response Pack, Log Audit/Vault)
- Butoane share/export vizibile

**Done cand:**
- DPA CompliScan public si descarcabil
- Pachete usor de generat si trimis
- Produsul pare vandabil B2B

---

## ETAPA 2 — Diferentiere puternica

### GOLD 6 — NIS2 applicability + incident 3 etape + ANSPDCP breach
**De ce:** diferentiator local real, risc mare daca e facut gresit
**Exista deja:** assessment, wizard DNSC, incidente, maturity, vendors, stores/routes

**Backend de construit:**
- Applicability rules layer (wizard eligibilitate mai sus in flow)
- Incident model pe 3 etape (Early Warning 24h → Raport 72h → Raport final 30 zile)
- Draft per etapa cu procente reale
- Post-submit tracking (numar inregistrare DNSC, corespondenta)
- Prefill assessment cu confidence + source per raspuns propus
- **NOU: ANSPDCP breach notification parallel** — daca incidentul implica date personale, finding suplimentar „Notifica si ANSPDCP in 72h" cu deadline separat, formular separat, tracking separat

**UI de construit:**
- Applicability gate in onboarding/dashboard
- Incident timeline cu 3 etape + countdown badges
- Assessment UI cu "Propus automat — confirma" + sursa
- Correspondence panel DNSC
- Status partial vs fully reported clar
- Badge ANSPDCP notification daca se aplica

**Done cand:**
- Userul stie daca i se aplica NIS2
- Niciun incident nu poate parea "gata" dupa primul raport
- Daca sunt implicate date personale, notificarea ANSPDCP e vizibila separat
- Assessment se completeaza mult mai repede cu prefill

---

### GOLD 7 — Audit pack / Response pack / One-page polish
- Generare automata audit pack lunar pentru pro/partner
- Salvare in Vault/export registry
- Polish pe toate cele 4 output-uri
- CTA de share/export vizibile

---

### GOLD 8 — AI Act selective
- Risk classification propusa (nu verdict final)
- Deadline visibility (aug 2026)
- EU DB preparation wizard
- Trust disclosure AI Act
- NU il transformam in produs principal

---

## ETAPA 3 — Multiplicatori de platforma

### MULTIPLICATOR A — Site Intelligence Layer (cookie / tracker / form / embed scan)

Asta NU e motor comercial separat. E o componenta de onboarding care alimenteaza 3 motoare existente.

**Backend de construit:**
- Website crawl service (Puppeteer, input URL, crawl home + 2-3 pagini)
- Detector rules (GA/GA4, Meta Pixel, Hotjar, Clarity, YouTube/Maps embeds, Stripe, formulare)
- Findings generator (tracker fara consent → finding, vendor detectat → review candidate, data category clues)
- Persistare rezultate (last scan, detected trackers/vendors/forms, confidence, page URL)

**UI de construit:**
- Onboarding card: `Scaneaza site-ul tau in 10 secunde` → progress → rezultat imediat
- Dashboard card: Site scan (nr trackere, nr formulare, nr vendor candidates)
- Findings page: findings de site cu CTA spre policy/vendor/queue
- Vendor Review: badge `detectat din site`
- Privacy Policy wizard: trackere + terti detectati pre-completati

**User flow:**
Cristian introduce URL → scan 10 sec → vede "4 trackere detectate, 2 terti identificati" → CTA: Genereaza Privacy Policy / Deschide Vendor Review

**Done cand:**
- Scanare functionala din onboarding
- Trackere majore detectate
- Rezultatele alimenteaza Privacy Policy si Vendor Review automat

---

### MULTIPLICATOR B — Progressive Data Enrichment / orgKnowledge

Daca userul confirma ceva o data, nu mai trebuie intrebat de 5 ori.

**Ce stocheaza:**
- Categorii de date confirmate
- Scopuri de prelucrare confirmate
- Furnizori confirmati
- Tool-uri confirmate
- Transferuri internationale
- Date HR / cookies / forms / AI usage
- Sursa + data + confidence + lastReviewedAt

**Ce alimenteaza:**
- Privacy Policy, Registru Art.30, DSAR draft response, Vendor Review, NIS2 assessment, AI Act inventory

**Regula anti-stale:**
Finding automat daca `lastReviewedAt` > 6 luni: „Datele din profilul operational nu au fost reconfirmate recent — revizuieste."

**Backend de construit:**
- Schema `orgKnowledge`
- Write adapters din: Privacy Policy wizard, Vendor Review, website scan, onboarding, AI systems
- Read adapters catre: generator documente, DSAR, Art.30, findings
- Review/refresh markers cu expiry

**UI de construit:**
- Mini-panou `Confirmat anterior` in wizard-uri
- Campuri pre-completate cu eticheta `Preluat din confirmare anterioara`
- Istoric sursa: `Confirmat in Privacy Policy la 24 Mar 2026`
- Buton: Actualizeaza / Pastreaza

**Done cand:**
- Al doilea document e clar mai rapid decat primul
- Userul vede de unde vin datele
- Date vechi >6 luni genereaza finding de reconfirmare

---

### MULTIPLICATOR C — Compliance Calendar

**Backend de construit:**
- Unified deadline aggregator (DSAR, NIS2, DPA revalidation, trial expiry, vendor overdue, policy expiry, Pay Transparency milestones, ANSPDCP breach notification)
- Calendar/event model

**UI de construit:**
- Pagina/tab Calendar (sau widget in Acasa/Portofoliu)
- Views: Azi / Saptamana asta / Luna asta / Overdue
- Event cards: tip + firma + deadline + severitate + CTA Deschide
- Dashboard widgets: `Ce expira saptamana asta` + `Urgente azi`

**Done cand:**
- Toate deadline-urile importante intr-un singur loc
- Elena si Andrei stiu ce fac azi fara sa vaneze prin pagini

---

### RULE PACK — Pay Transparency 2026

Finding pack mic, diferentiator de marketing, nu modul.

**Backend:** Rule: employeeCount/size → candidate finding + checklist template + mini procedura
**UI:** Finding card `Pregatire Pay Transparency` + action pack + portfolio aggregate (`12 firme trebuie revizuite`)
**Done cand:** Feature-ul apare in demo fara sa devina modul imens

---

# 6. User flows naturale

## Cristian — solo/micro
1. Register → CUI → ANAF prefill → site scan
2. "Iata ce am gasit deja" (findings automate din ANAF + site)
3. CTA principal: rezolva primul risc
4. Document / task / confirmare obligatorie
5. Dovada → scor nou → urmatorul pas
Nu intra in 10 pagini.

## Elena — consultant/portfolio
1. Intra in Portofoliu
2. Vede urgentele cross-client (eFactura, DPA, DSAR, NIS2)
3. Click pe cluster → De rezolvat filtrat
4. Batch draft / review per client
5. Trimite sau exporta
6. Trece la urmatorul cluster

## Andrei — DPO/compliance
1. Intra in Acasa / Calendar
2. Vede incident / assessment / vendor / DSAR due
3. Click direct in itemul critic → Resolution Layer
4. Lucreaza → ataseaza dovada
5. Genereaza raport / pack
6. Sistemul urmareste termenele ulterior

---

# 7. Ce amanam explicit

Nu punem in fata acum:
- AML-first product
- Whistleblowing ca motor principal (finding simplu da, modul nu)
- ESG scoring generic
- Supply-chain law expansion EU
- ITM / legislatia muncii completa (nu e ADN-ul CompliScan)
- Corporate governance (capital social, mandate — e treaba notarului)

Le putem trata mai tarziu ca extensii / module separate.

---

# 8. Definition of Done final

Documentul este implementat corect daca:
- Elena poate lucra natural pe 20-50 firme
- Cristian obtine prima valoare in 10 minute (site scan + findings automate)
- Andrei nu rateaza termenele NIS2 / DSAR / ANSPDCP
- eFactura produce findings concrete cu motiv exact
- Vendor Review devine motor central cu library pre-umplut
- /trust si output-urile fac produsul vandabil B2B
- Niciun finding nu se inchide fara confirmare umana explicita
- Al doilea document e mai rapid decat primul (orgKnowledge)
- Calendarul arata ce arde azi fara sa vanezi prin pagini
- Userul nu invata module, ci urmeaza queue + action + evidence + output

---

# 9. Prompt final pentru Claude / Codex (SINGURA VERSIUNE)

Use this document as the single implementation source of truth for CompliScan.

Important:
- Do not rebuild CompliScan from scratch
- Build on top of existing modules
- Keep the core idea: Romania-first compliance operations with human-in-the-loop
- ALWAYS enforce the universal confirmation rule from section 0-BIS

Priority order (implement in this exact sequence):
1. Partner Hub + Import Excel robust (GOLD 1)
2. eFactura / SPV compliance monitor (GOLD 2)
3. Vendor Review + DPA + evidence + Vendor Library (GOLD 3)
4. Rights requests / DSAR minimum viable (GOLD 4)
5. /trust + B2B readiness (GOLD 5)
6. NIS2 applicability + 3-stage incident + ANSPDCP breach (GOLD 6)
7. Audit pack / response pack polish (GOLD 7)
8. AI Act selective (GOLD 8)
9. Site Intelligence Layer (MULTIPLICATOR A — parte din onboarding)
10. orgKnowledge / Progressive Data Enrichment (MULTIPLICATOR B)
11. Compliance Calendar (MULTIPLICATOR C)
12. Pay Transparency rule pack

Mandatory rules:
- Every feature must specify: what exists, backend to build, UI to build, user flow, done criteria
- Never ship backend-only features without visible UI
- Always reuse: findings, evidence, output packs, Resolution Layer, De rezolvat as universal queue
- Universal confirmation (0-BIS) applies to EVERY motor without exception
- orgKnowledge must have lastReviewedAt + stale data finding (>6 luni)
- NIS2 incidents with personal data must trigger ANSPDCP notification finding parallel

UX simplified:
- Single-org: Acasa → Scaneaza → De rezolvat → Rapoarte → Setari
- Partner: Portofoliu → Clienti → De rezolvat → Rapoarte → Setari

Treat AML, whistleblowing, ESG, broader EU supply-chain as secondary until core is commercially strong.
