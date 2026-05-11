# Prompt cercetare GPT 5.5 — Killer features fiscal module CompliScan

> Copiază tot ce e mai jos (de la "---" începând) și dă-l agentului de cercetare.
> Output așteptat: 10-15 killer features specifice cu rationale + sursă/inspirație + cost build.

---

# Cercetare killer features pentru modulul fiscal CompliScan (RO, 2026)

## CINE SUNTEM

**CompliScan** — SaaS de compliance pentru cabinete fiscale CECCAR din România.
Wedge product: **modulul Fiscal** (e-Factura + RO e-TVA + SAF-T + ANAF SPV).
ICP: contabil CECCAR cu portofoliu 30-300 clienți IMM (Persoană Juridică +
PFA/CNP după 1 iunie 2026).

Pricing intenționat: Solo €49 / Pro €199 / Studio €499 / Enterprise €999/lună.

Market validation: făcută empiric prin grupuri Facebook contabili + interviuri.
Vrem să mergem pe lead-magnet + outreach + parteneriat CECCAR/Bența pentru a
intra la primii 50-100 cabinete în 6 luni.

## CE AVEM DEJA (inventar exhaustiv, mai 2026)

### Validare & repair e-Factura UBL CIUS-RO
- Validator complet V001-V011 + warnings (lib `efactura-validator.ts`)
- Auto-repair XML pentru codurile V002 (CustomizationID lipsă), V003
  (InvoiceTypeCode), V005 (IssueDate), T003 (encoding) — cu disclaimer CECCAR
  + checkbox confirmare + audit log per fix (NICIODATĂ silent)
- Bulk ZIP upload (până la 200 facturi paralel, raportare per fișier)
- Detecție B2B/B2C/CNP + termen 5 zile lucrătoare unificat (post-OUG 89/2025)
- Alert preventiv ziua 3 lucrătoare per factură pending (`efactura-pending-alert`)
- Cross-border guidance: RO→RO, RO→UE B2B/B2C, RO→non-UE, non-RO→RO
  (`efactura-cross-border-guidance`)

### SAF-T D406
- Upload XML + parser SourceDocuments (Sales/Purchase)
- Hygiene score 0-100 cu rectificări, late filings, missing flags
- Pre-flight account validator (codurile RAS/RAF lipsă)
- D300 + D394 draft assistant din SAF-T (cote 19/9/5/0/reverse-charge)
- Frequency detector (lunar vs trimestrial bazat pe cifra de afaceri)
- Cross-filing checker (SAF-T vs D300 vs D394 consistency)
- Detector facturi fără TaxAmount sau DebitAmount (date corupte)
- Performance: 1000 facturi parsare sub 500ms

### RO e-TVA (post-OUG 13/2026 — notificarea ELIMINATĂ)
- D300 vs P300 preventive comparator (încă util pentru audit prep)
- 8 templates standardizate răspuns ANAF cu placeholders auto-fill
  (etva_diff_explanation, conformare_factura_furnizor_lipsa, etc.)
- False conformance detector (verifică notificare ANAF vs evidence reală)
- State machine e-TVA discrepancy 6-status × countdown (legacy, dar disponibil)

### ANAF SPV integration
- OAuth 2.0 flow (logincert.anaf.ro/anaf-oauth2)
- Retry queue cu backoff (rezolvă pain "OAuth regen failures")
- Real-time SPV monitor (cron 4x/zi: 04, 10, 14, 18)
- Status interpreter (ok / nok / xml_erori / in_prelucrare)
- SPV duplicate detector (pain #3 — bug ANAF 2022 cu factură 96+ apariții)
- XML archive local (rescue 60-day SPV expiry)
- ANAF health monitor (probe 3 endpoint-uri cu uptime 24h + incidents 7d)
- Submit-SPV cu dublă aprobare manuală obligatorie

### ERP integrations (mature)
- **SmartBill** API (token + sync facturi + email config)
- **Oblio** OAuth 2.0 + token expiry tracking
- **Saga** XML/ZIP smart-detect cu parser schema oficială
  (FurnizorNume, ClientNume, FacturaNumar, pattern F_<cif>_<num>_<date>.xml)
- ERP vs SPV reconciliere (disparities detector cu severity)

### Calendar fiscal & filing discipline
- Filing records cu deadline calculation (lunar/trimestrial)
- Cron `fiscal-reminders` zilnic 05:30 RO — termene critice (D300, D406, e-Factura, P300)
- Cron `p300-monthly-check` zilele 10-20 ale lunii
- Calculator amenzi (e-Factura, SAF-T, e-TVA, registru) pe 4 categorii contribuabili

### PFA / CNP Form 082 (deadline 26 mai 2026)
- Tracker portofoliu cu status registrare 5-state
- Cron deadline alert (14/7/3/1/0 zile trigger)
- Lead magnet landing `/pentru/pfa-form-082`

### Pending-actions watcher
- `cui_desync` retry policy: 6/12/24/48/72h backoff (companii noi 24-48h gap)
- `cert_renewal_grace` retry: 12/24/36/48h (cert ANAF lag post-renewal)

### Compliance core (mature, layer peste fiscal)
- Findings + cockpit + smart resolve flow (canonical signal → finding →
  resolve → evidence → dossier → monitoring)
- Approval queue cu autonomy policies (auto / semi / manual)
- Audit pack export ZIP cu hash-chain
- Multi-seat cabinet (5 roluri: owner, partner_manager, compliance, reviewer, viewer)
- Privacy mode AI assistant (local-only Gemma 4 on-device VS cloud-allowed Gemini fallback)
- Cron observability dashboard
- Drift detector (state vs sources)

## CU CINE NE BATEM (concurență directă)

**Niciun competitor RO nu acoperă stack-ul nostru** (auto-repair + e-TVA flow +
SAF-T scoring + cross-check ANAF + agent autonom). Toate sunt complementare:

| Competitor | Ce fac | Preț | Ce LIPSEȘTE vs CompliScan |
|---|---|---|---|
| **SmartBill** | Emite facturi + 99.99% validation rate | €5-15/lună | Fără auto-repair, fără e-TVA workflow, fără SAF-T hygiene, fără cross-check |
| **Saga** | Emite + forum erori | €4-12/lună | Fără validare proactivă, fără workflow notificări |
| **Oblio** | Emite (free 12 luni) | €29/an | Doar emisii |
| **eConta** | Contabilitate clienți finali | €49/lună | Fără cross-check ANAF, NU pentru cabinete |
| **Pagero / Tungsten** | Enterprise EU-wide | €1k-10k/lună | Inacceptabil ca preț pentru IMM/cabinet |
| **TaxDome (foreign)** | Workflow contabilitate generală | €40-80/lună | Nu acoperă specific RO fiscal (e-Factura/SAF-T/e-TVA) |
| **Universul Fiscal / Sintact (Wolters Kluwer)** | Content + spete legale | €30-100/lună | Content product, NU workflow/automatizare |
| **NIS2@RO (DNSC)** | Auto-evaluare gratuit | gratuit | Doar NIS2, nu fiscal |

## CU CINE NU NE BATEM (intenționat)

- **NU concurăm cu SmartBill/Saga/Oblio pe emisii** — ne pozitionăm ca "layer
  compliance peste", drag-drop XML import. Vrem partnerships, nu war.
- **NU concurăm cu cabinete contabile mari** (KPMG, BDO etc.) — ei au tooluri
  proprii și volume diferite.
- **NU vindem la clienții finali (IMM proprietar)** — vindem la cabinetul lor.
  IMM-ul accesează doar prin „mod patron" (read-only audit, aprobări magic-link).
- **NU concurăm cu OneTrust / Privacy Manager pe GDPR enterprise** — modulul
  DPO al nostru e scope wedge cabinet, nu enterprise.

## UNDE VREM SĂ AJUNGEM

**Pe 6 luni:**
- 50-100 cabinete plătitoare (€49-199/cabinet)
- Lead magnets pre-active: calculator-amenzi, verifica-saft-hygiene, /pentru/pfa-form-082
- Parteneriat cu unul din: Bența (Universul Fiscal), CECCAR direct, sau Adrian
  Bența personal pentru distribuție
- Outreach FB groups + LinkedIn cabinete

**Pe 18 luni:**
- 500-1000 cabinete
- Module adjacent live: DPO OS (gata, sister branch), AI Act (când ANCOM
  emite ghiduri), Pay Transparency HR (2026 deadline 7 iunie)
- Tier Studio €499 dominat pentru cabinete 100-300 clienți
- Expansion la cabinete mari + verticale (energy, retail, transport)

**Diferențiator fundamental:**
- "Layer compliance INTELLIGENT peste tooling-ul tău existent — NU înlocuire"
- Smart Resolve Cockpit canonic: signal → applicability → finding → resolve →
  evidence → dossier → monitoring → reopen
- "Sugestie + click apply" obligatoriu (CECCAR Cod Deontologic Art. 14)
- Gemma 4 on-device pentru cabinete cu secret profesional (zero cloud)

## CE NE LIPSEȘTE (potențiale gap-uri identificate de noi, dar incomplete)

- **e-Transport module** — sancțiuni LIVE din 1 ian 2026, GPS streaming, UIT
  5/15 zile lifecycle. Avem doar awareness, NU features.
- **e-Sigiliu (e-Seal)** — implementare graduală 2026, sigilare facturi emise.
- **Catalog CPV / NC8** — codurile obligatorii pe produse vândute (pain real).
- **Reconciliere bancă vs SPV** — match plăți cu facturi emise/primite automat.
- **Predictive risk scoring** — ML pe portofoliu (ce cabinete riscă audit?).

## CERERE PENTRU TINE (GPT 5.5)

Cercetează **piața RO + EU + global fiscal compliance / accounting workflow
SaaS în 2026** și descoperă **10-15 killer features** pe care NOI NU le-am
gândit dar care:

1. **Sunt buildable cu cod** (NU consultanță, NU conținut, NU servicii umane).
2. **Sunt SPECIFICE pain-ului contabilului CECCAR cu 30-300 clienți IMM** (nu
   features generic SaaS).
3. **Creează moat real** — diferențiator nereplicabil în 6 luni de SmartBill/Saga.
4. **Sunt aliniate cu 2026 reality** (post-OUG 89/2025, post-OUG 13/2026,
   post-Ordin 378/2026, e-Transport sancțiuni LIVE, etc.).
5. **Au precedent în alte piețe** sau emerging trends (poate AI-assisted audit
   din SUA, predictive compliance din UK, automated reconciliation din DE).

### Surse de cercetare sugerate
- **Forum-uri contabili RO**: contabilul.manager.ro, sagasoftware.ro forum,
  pfassist.ro, dreptclar.ro, CECCAR Business Magazine, Universul Fiscal
- **FB groups**: "Contabili — întrebări fiscale", "CECCAR profesional",
  "e-Factura — sprijin reciproc"
- **EU peers**: Pagero (SE), Tungsten Network (UK), Avalara (US), Sovos (US),
  Anrok (US — sales tax automation)
- **Emerging RO**: Smarttax.ro, FactuRO, contApp.ro, DocFlow, Smart Bill
  Cloud (modulul nou contabilitate)
- **Adjacent verticals**: TaxDome (US), Karbon (AU), Canopy (US),
  Practice Ignition (NZ) — accounting practice management
- **AI-fiscal**: Botkeeper, Vic.ai, Klippa (NL), Receipt-Bank (UK), Dext
- **Blogs analiști**: Adrian Bența, Marius Dumitrescu (Cabinet Expert),
  StartupCafe Fiscal, Avocatnet Fiscal

### Format output dorit

Pentru fiecare killer feature:

```
## Feature #N: <nume scurt>

**Pain real adresat:** <1-2 propoziții cu citat din contabil dacă găsești>
**Sursa/inspirația:** <competitor sau emerging trend cu URL>
**Cost build estimat:** <S/M/L = 1-3 zile / 1-2 săptămâni / 1-3 luni cod>
**De ce NU au SmartBill/Saga/Oblio:**  <explicație tehnică sau strategică>
**Moat duration:** <luni până la replicare>
**Acceptance criteria:** <2-4 bullet points testabili>
**Risc legal/CECCAR:** <dacă există, altfel "niciunul">
```

### Priorități pentru tine

- Caută **AI-native features** (nu doar chat, ci ML real: classification,
  anomaly detection, predictive risk).
- Caută **automatizări end-to-end** (factură primită → semnal → finding → fix
  → audit log → CECCAR-aprobat, fără click manual).
- Caută **integrări care DESPUM costuri** (bancă, ERP-uri exotice, Excel
  workflow-uri ale contabililor).
- Caută **features pentru bulk operations** la cabinete cu 100+ clienți
  (ce devine pain când scalezi de la 10 la 200 clienți).
- Caută **ce face Pagero / Sovos pentru enterprise** și e simplificabil
  pentru SMB.
- Caută **„unfair advantages"** pe care doar AI-first SaaS le poate avea
  (ex: parsing vocal note pe telefon → finding; OCR factură pe hârtie → XML
  CIUS-RO; live OCR camera cu certificate digital).

### Anti-features (NU lista astea)
- Calculatoare amenzi suplimentare (avem deja)
- Templates ANAF noi (avem 8 + drawer cu placeholders)
- Lead magnets generice
- Conținut educațional (separat de cod)
- Servicii manuale / consultanță (suntem SaaS pure)

### Răspuns așteptat
- **10-15 killer features** ranked după impact x effort
- **Top 3 picks pentru următorul sprint** cu reasoning clar
- **1 outrageous bet** (idee îndrăzneață care ar putea schimba categoria)
- **Lista surse citate** ca markdown links

Lungime totală: ~3000-5000 cuvinte. Concis. Acțional. Fără preambul.
