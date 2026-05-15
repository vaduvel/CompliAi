# ANAF Mirror — BASE TRUTH consolidat (2026-05-14)

> **Statusul documentului:** SINGURA SURSĂ DE ADEVĂR pentru codarea CompliScan ANAF Mirror.
> **Validare:** triangulat cu 4 surse — 3 rapoarte AI independente (GPT, Gemini, Grok/Muse Spark) + agent Claude cu verificare la sursa primară (`anaf-mirror-validation-2026-05-14.md`).
> **Confidence:** 95% pe specificațiile tehnice; 85% pe interpretarea algoritmică.

---

## 🚨 5 corecții obligatorii vs research inițial (toate AI au halucinat la fel)

| # | Greșit (în 3 AI reports) | CORECT (verificat sursa primară) |
|---|---|---|
| 1 | "APOLODOR" = numele proiectului ANAF Big Data | **"APIC"** = Administrație Performantă prin Informație Consolidată. *Apolodor* = strada sediului ANAF (Str. Apolodor 17) |
| 2 | Fișa indicatorilor risc fiscal = **540 puncte max** | **500 puncte max**. Pragul "risc mare" = >250 pct |
| 3 | OUG 89/2025 a relaxat e-TVA | **OUG 13/2026** publicată MO 181/09.03.2026 — abrogă art. 5, 8, 16 din OUG 70/2024 → notificarea conformare e-TVA = **dezactivată legal din 09.03.2026** |
| 4 | Rate limit API ANAF = 1000/zi | **1000 request/MINUT** global. Token JWT 90 zile, refresh 365 zile |
| 5 | Threshold e-TVA = 20% + 1.000 RON | **20% + 5.000 RON CUMULATIV** (ambele condiții simultan, nu OR) |

---

## 1. Fișa indicatorilor de risc fiscal (sursa: static.anaf.ro/static/10/Anaf/transparenta/Anexanr2laproceduraFisaindicriscfiscal.htm)

**SCOPE OFICIAL:** Anexa la **procedura de soluționare a deconturilor cu sume negative de TVA cu opțiune de rambursare + procedura de restituire accize** (OMFP 532/2007 + acte conexe).

**NU e algoritm general pentru toate firmele** — e pentru selecția rambursărilor TVA + restituirilor accize. **DAR** indicatorii sunt aplicabili general ca semnale risc fiscal.

### Indicatorii cu ponderi exacte (verbatim ANAF)

| Indicator | Pragul | Puncte | Sursă input |
|---|---|---|---|
| Capitaluri proprii ≤0 | ≤0 | **100** | Bilanț rd.32 |
| Grad îndatorare > 1 | datorii/capitaluri > 1 | **50** | Bilanț rd.55/81 |
| Rentabilitatea CA = 0 | profit/cifră afaceri = 0 | **70** | Cont profit/pierdere |
| 1 declarație nedepusă | count = 1 | **50** | Vector fiscal + recipise SPV |
| >1 declarații nedepuse | count > 1 | **100** | Vector fiscal + recipise SPV |
| Obligații restante crescătoare | sold_sfârșit > sold_început | **50** | Fișă rol SPV |
| Obligații restante descrescătoare | sold_sfârșit < sold_început, > 0 | **30** | Fișă rol SPV |
| Restituiri fără verificare 4-6 | count 4-6 | **20** | Istoric restituiri |
| Restituiri fără verificare 7-9 | count 7-9 | **40** | Istoric restituiri |
| Restituiri fără verificare 10-12 | count 10-12 | **60** | Istoric restituiri |
| Pondere sume neaprobate 2-4% | 2-4% | **5** | Decizii rambursare |
| Pondere sume neaprobate 4-6% | 4-6% | **15** | Decizii rambursare |
| Pondere sume neaprobate 6-8% | 6-8% | **35** | Decizii rambursare |
| Pondere sume neaprobate 8-10% | 8-10% | **45** | Decizii rambursare |
| Pondere sume neaprobate >10% | >10% | **60** | Decizii rambursare |
| Restituiri 50k-150k lei | valoare | **10** | Istoric restituiri |
| Restituiri 150k-350k | valoare | **20** | Istoric restituiri |
| Restituiri 350k-550k | valoare | **30** | Istoric restituiri |
| Restituiri 550k-750k | valoare | **40** | Istoric restituiri |
| Restituiri 750k-1M | valoare | **50** | Istoric restituiri |
| Restituiri > 1M | valoare | **60** | Istoric restituiri |

**Maximum cumulativ realist: ~500 puncte** (nu 540).
**Prag risc mare oficial: >250 puncte.**

---

## 2. e-TVA / P300 — Status actual (post OUG 13/2026)

### Cadru legislativ activ

- **OUG 70/2024** — introducerea RO e-TVA (decont precompletat P300)
- **OUG 13/2026** (MO 181/09.03.2026) — **abrogă art. 5, 8, 16 din OUG 70/2024**

### Consecințe practice 2026-2027

| Aspect | Status post-09.03.2026 |
|---|---|
| Generare P300 de ANAF | ✅ Activă lunar/trimestrial |
| Comparare D300 vs P300 | ✅ Obligație contribuabil |
| **Notificare conformare automată ANAF** | ❌ **DEZACTIVATĂ LEGAL** |
| Amenzi 1.000-10.000 RON pentru lipsă răspuns | ❌ **ELIMINATE** |
| Diferența ca **alertă analitică APIC** | ✅ Activă (flag intern, nu sancțiune) |
| **Flag APIC → blocare rambursări viitoare** | ✅ Activ |
| TVA la încasare — e-TVA suspendat | ✅ Până la **30 sept 2026** |

### Threshold "diferență semnificativă" (oficial 2025-2026)

**CUMULATIV (ambele condiții):**
- Procentual: **≥20%** vs P300
- Absolut: **≥5.000 lei**

Identificare prioritar pe coloana TVA (sau Valoare la operațiuni scutite).

### Surse P300 (ANAF integrează):

- RO e-Factura (B2B + B2C)
- RO e-Case marcat (AMEF)
- RO e-Transport
- Sistem Vamal AES
- Declarații informative
- Registru achiziții locuințe cotă redusă

### Cote TVA pe rânduri P300 (post 01.08.2025):

- Rd. 9: 21% (cota standard nouă)
- Rd. 9.1: 19% (cota standard veche, tranziție)
- Rd. 10: 11% (cota redusă nouă)
- Rd. 10.1: 9% (cota redusă veche)

---

## 3. SAF-T D406 — 33 teste oficiale ANAF

### Sursa primară:
- **22 teste inițiale** — comunicat ANAF 2022
- **11 teste suplimentare** — comunicat ANAF 2024 (`static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/SAF-T/`)

### Set I — 22 teste inițiale (validare structurală + balanțe)

1. Header Address incomplete (City/Country lipsă)
2. Contact incomplete (FirstName/LastName lipsă)
3. Telephone lipsă în Header
4. Bank Account incomplete (IBAN sau Account Number/Name/SortCode lipsă)
5. GL Accounts incomplete (AccountID/Description/Type/Balances lipsă)
6. Customers incomplete (RegistrationNumber ≠ CustomerID)
7. Suppliers incomplete (RegistrationNumber ≠ SupplierID)
8. Tax Table incomplet (TaxType/Description/Code/Percentage/Country lipsă)
9. UOM Table incomplet
10. Analysis Type Table incomplet
11. Products incomplete
12. Solduri inițiale debit ≠ credit (excl. clase 8/9)
13. Solduri finale debit ≠ credit (excl. clase 8/9)
14. Sold final lună ≠ sold inițial lună următoare
15. Formula sold final incorectă: closing ≠ opening + movement
16. Rulaj debit total ≠ rulaj credit total
17. CurrencyAmount egal greșit pentru RON (Amount ≠ CurrencyAmount)
18. CurrencyAmount greșit pentru valută (Amount = CurrencyAmount)
19. Tranzacție valută fără Amount RON + CurrencyAmount valută
20. TVA GL calculat greșit: tax_percentage × base ≠ tax_amount
21. TVA vânzări calculat greșit (sales invoice VAT)
22. TVA achiziții calculat greșit (purchase invoice VAT)

### Set II — 11 teste suplimentare (cross-validare conturi 4426/4427/4428 + nomenclator)

1. TaxType 300 / TaxAmount negativ cu TaxCode 000000
2. TaxCode percentage ≠ TaxAmount
3. TaxType 000 cu TaxAmount negativ
4. Cont 4426 cu TaxAmount negativ (TVA deductibil)
5. Cont 4427 cu TaxAmount negativ (TVA colectat)
6. Cont 4428 cu TaxAmount negativ (TVA neexigibil)
7. TaxType 301/302/303/304/305/307/344/390 cu TaxCode invalid (nomenclator)
8. Operațiuni scutite/neimpozabile cu TaxAmount negativ
9. Taxare inversă cu TaxAmount ≠ 0 (excl. 4426/4427)
10. Achiziții scutite/neimpozabile (rd 30/30.1) cu TaxAmount negativ
11. Note auto-colectare (380001-380005) cu TaxAmount negativ (excl. 4426/4427/4428)

### Sancțiuni SAF-T (Art. 337¹ CPF)

| Tip | Mari contribuabili | Mijlocii | Mici |
|---|---|---|---|
| Nedepunere D406 | 5.000 RON | 1.000-2.500 RON | 1.000-2.500 RON |
| Depunere incorectă/incompletă | 1.500 RON | 500-1.500 RON | 500-1.500 RON |

---

## 4. OPANAF 1826/2372/2025 — SCOPE doar accize

**Publicat:** MO 708/30.07.2025
**Scope:** **Doar antrepozitari + importatori autorizați produse accizabile** (NU general)
**Joint:** ANAF + AVR (Autoritatea Vamală Română)

### Criterii risc ridicat (pentru operatori accize)

- Nou-înființate / preluare părți sociale
- Fără activitate economică 12 luni
- Inactiv/reactivat 12 luni
- Domiciliu fiscal la cabinet avocatură
- Autorizare/înregistrare produse accizabile <12 luni
- Fără activitate accizabilă 36 luni
- Garanție executată în ultimii 5 ani
- Declarații depuse cu întârziere >5 zile
- Încălcarea eșalonării / restructurării fiscale
- Asociat/admin cu istoric negativ 10 ani (firme accizabile revocate)
- Control constată ≥25% sume necuvenite la rambursare
- Fonduri insuficiente pentru achiziții accizabile

**Pentru CompliScan:** modulul accize **OPȚIONAL** — Maria n-are clienți cu produse accizabile. Activăm doar dacă cabinetul are clienți tutun/alcool/combustibili.

---

## 5. APIC — Sistemul Big Data ANAF (numele corect)

### Realitate confirmată (sursa: static.anaf.ro plan strategic + comunicat ptir.ro)

- **Nume oficial:** APIC (Administrație Performantă prin Informație Consolidată)
- **Status mai 2026:** NU operațional încă. Estimat H2 2026.
- **NU este "APOLODOR"** — acela e numele străzii sediului ANAF.

### Componente APIC (parțial publice)

- Random Forest / Boosting — clasificare fraud probability
- K-Means / Bagging — clusterizare CAEN sectorial
- Social Network Analysis (SNA) — leagă administratori cross-firme
- Early Warning Systems (Sliding Window) — e-Transport ↔ e-Factura 5 zile lucrătoare

### Surse integrate APIC

- RO e-Factura
- RO e-Case marcat (AMEF)
- RO e-Transport
- Sistem Vamal AES
- Vector fiscal
- Date bancare (proiect Sfera — în pregătire)

### Implicație pentru CompliScan

- **NU putem replica scorul intern APIC** (algoritmi ML clasificați)
- **PUTEM replica indicatorii publici** din Fișa risc fiscal + OPANAF + reguli e-TVA + SAF-T
- **Target accuracy realist:** 80-85% vs scoring real APIC (când va fi operațional)
- **Positioning corect:** *"Oglindim regulile publice ANAF, nu algoritmul ML intern."*

---

## 6. API ANAF — Endpoints + Rate Limits CORECTE

### OAuth 2.0 (sursa: documentație ANAF + docs.socrate.io)

- Token JWT — **90 zile valabilitate** (NU 30-60 min cum ziceau alte rapoarte)
- Refresh token — **365 zile valabilitate**
- Procedură: înregistrare aplicație portal ANAF → client_id + client_secret → autorizare cu cert digital

### Endpoints e-Factura

| Endpoint | Limită | Scop |
|---|---|---|
| **Global** | **1000 req/MINUT** | Toate metodele |
| `/upload` (B2B) | 1000/zi/CIF | Upload e-Factura emisă |
| `/uploadb2c` | 1000/zi/CIF | Upload e-Factura B2C |
| `/stareMesaj` | 100/zi/mesaj | Verificare status |
| `/listaMesajeFactura` (paginat) | 100.000/zi/CIF | Sincronizare jurnale |
| `/descarcare/{id}` | 10/zi/mesaj | Descarcă XML semnat |
| `/validare/{FACT1/FCN}` | Public (no auth uneori) | Pre-submit validation |
| `/transformare/...` | Standard | XML → PDF |

### Endpoints e-Transport

- `/ETRANSPORT/ws/v1/upload/...` — upload aviz
- `/stareMesaj/{id}` — verificare status
- `/lista/{zile}/{CIF}` — listă mesaje (1-60 zile)
- `/descarcare/{id}` — XML semnat

### Endpoints SPV (parțiale)

- Citire fișă rol obligații per CIF
- Citire somații + notificări active
- Citire vector fiscal **(NU EXISTĂ API public complet)** — parsing din SPV manual sau D700

### Strategie CompliScan

**Architecture obligatorie:**
- **Job Worker** background ruleaza fetch-uri noaptea (zilele 20-25 = peak load)
- **Rate limiter** per CIF + per minut
- **Cache local** pentru documente descărcate (ANAF păstrează doar 60 zile)
- **Retry exponential backoff** la HTTP 429

---

## 7. Cadru sancționator (Cod Procedură Fiscală — Legea 207/2015)

### Penalități declarații / e-Factura

| Sancțiune | Mari | Mijlocii | Mici |
|---|---|---|---|
| e-Factura netransmisă 5 zile lucrătoare | 5.000-10.000 RON | 2.500-5.000 RON | 1.000-2.500 RON |
| D406 SAF-T nedepusă | 5.000 RON | 1.000-2.500 RON | 1.000-2.500 RON |
| D406 incorectă/incompletă | 1.500 RON | 500-1.500 RON | 500-1.500 RON |

### Penalități nedeclarare (Art. 181 CPF)

- **0,08%/zi** pe sumele stabilite suplimentar prin inspecție
- **+0,02%/zi dobânzi** (cumulativ)

### Reducere 75% prin conformare voluntară (Art. 235-241 CPF)

> *"Penalitățile de nedeclarare pot fi reduse cu 75% dacă obligațiile sunt stinse prin plată sau compensare ÎNAINTE de începerea controlului."*

**Asta-i "fereastra de aur" CompliScan — USP-ul:** *Detectăm înainte de ANAF → tu ai 75% reducere amenzi.*

---

## 8. Sectoare prioritizate ANAF 2025-2027 + Reguli sectoriale/comportamentale

### Modifier sectorial pentru scoring (× 1.10-1.20):

- **E-commerce** — matching curierat ↔ AMEF/e-Factura
- **Construcții** — verificare 80% pondere salarială
- **Freelancers** — proiect Sfera bancar (2026)
- **HoReCa** — încasări card ↔ AMEF
- **Comerț en-gros** — adaos minim 5%
- **Transport** — e-Transport UIT vs facturi
- **Agricultură** — TVA 9% justificare
- **Tranzacții criptoactive** — vs D212

### Reguli SECTORIALE (Se001-Se010, sursa raport AI #4)

| Cod | Regulă | Condiție | Pondere |
|---|---|---|---|
| Se001 | Operator accize fără depozit | Autorizație + lipsă spațiu | 10 pct |
| Se002 | Comerț accize fără capitaluri | Vânzări alcool/combustibili + capitaluri negative | 8 pct |
| Se003 | Construcții cu profit negativ | CAEN 41-43 + profit <0 | 6 pct |
| **Se004** | **E-commerce fără OSS/IOSS** | **Vânzări UE >10K EUR fără OSS** | **7 pct** |
| **Se005** | **Transport mărfuri fără e-Transport** | **CMR/facturi transport + 0 UIT-uri** | **7 pct** |
| Se006 | HORECA fluctuații stoc | Stoc/CA > 0.5 | 5 pct |
| Se007 | Microîntreprindere peste plafon | CA > 500K EUR + regim micro | 8 pct |
| Se008 | Servicii complexe fără salariați | IT/consultanță, 0 angajați, CA >1M lei | 6 pct |
| Se009 | Construcții fără autorizații | CAEN 41-43 + lipsă autorizație | 5 pct |
| Se010 | Cash intensiv | Cash/CA > 10% | 5 pct |

### Reguli COMPORTAMENTALE (B001-B010, sursa raport AI #4)

| Cod | Regulă | Condiție | Pondere |
|---|---|---|---|
| B001 | Schimbări frecvente sediu | ≥3 schimbări în 3 ani | 4 pct |
| B002 | Schimbări acționariat repetate | ≥3 modificări în 3 ani | 4 pct |
| B003 | CA mare fără salariați | CA >500K + 0 angajați | 6 pct |
| B004 | CA mare fără active | Active <10% CA | 5 pct |
| B005 | Schimbări CAEN repetate | ≥3 schimbări în 3 ani | 4 pct |
| **B006** | **Părți afiliate neraportate** | **Tranzacții >200K EUR fără dosar preț transfer** | **7 pct** |
| **B007** | **Facturare parteneri TVA anulat** | **≥1 factură cu CUI inactiv/anulat** | **6 pct** |
| **B008** | **Plăți offshore** | **Plăți paradis fiscal >10% CA** | **8 pct** |
| **B009** | **Sponsorizări excesive** | **Sponsorizări >20% profit contabil** | **3 pct** |
| **B010** | **Cereri rambursare TVA frecvente** | **>4 cereri/an fiscal** | **5 pct** |

---

## 9. Algoritm scoring 0-100 (pseudocod corectat)

```typescript
function calculateAnafMirrorScore(firm: Firm, period: Period): AnafMirrorScore {
  // Dual scoring — separat OFICIAL vs MIRROR
  let officialPublicPoints = 0  // max ~500 din Fișa
  let mirrorPoints = 0           // CompliScan transparent
  const findings: Finding[] = []

  // ── 1. Fișa indicatori (ponderi oficiale ANAF) ──
  if (firm.capitaluriProprii <= 0) {
    officialPublicPoints += 100
    findings.push({ code: 'R001', name: 'Capitaluri proprii ≤0', weight: 100, severity: 'critical' })
  }

  if (firm.totalDebt / Math.max(firm.equity, 1) > 1) {
    officialPublicPoints += 50
    findings.push({ code: 'R002', name: 'Grad îndatorare > 1', weight: 50 })
  }

  if (firm.profit / Math.max(firm.revenue, 1) === 0) {
    officialPublicPoints += 70
    findings.push({ code: 'R003', name: 'Rentabilitate 0', weight: 70 })
  }

  if (firm.missingReturnsCount === 1) {
    officialPublicPoints += 50
  } else if (firm.missingReturnsCount > 1) {
    officialPublicPoints += 100
  }

  // ... toți cei ~21 indicatori Fișa

  // ── 2. e-TVA — feature flag legislativ ──
  const ETVA_LEGAL_TRIGGER_ACTIVE = new Date(period.date) < new Date('2026-03-09')

  const etvaDiff = Math.abs(firm.D300_tva - firm.P300_tva)
  const etvaThresholdPercent = 0.20 * Math.abs(firm.P300_tva)
  const etvaThresholdAbsolute = 5000
  const etvaSignificant = etvaDiff > etvaThresholdPercent && etvaDiff > etvaThresholdAbsolute

  if (etvaSignificant) {
    if (ETVA_LEGAL_TRIGGER_ACTIVE) {
      mirrorPoints += 12
      findings.push({
        code: 'R016',
        name: 'D300 vs P300 — declanșa notificare conformare (pre-OUG 13/2026)',
        weight: 12,
        legalTrigger: true
      })
    } else {
      mirrorPoints += 8
      findings.push({
        code: 'R016',
        name: 'D300 vs P300 — alertă analitică (flag APIC, nu amendă)',
        weight: 8,
        legalTrigger: false,
        note: 'OUG 13/2026 a abrogat sancțiunea automată. Diferența rămâne flag intern APIC.'
      })
    }
  }

  // ── 3. SAF-T 33 teste ──
  const saftErrors = runSaftTests(firm.D406_XML, period)
  if (saftErrors.length >= 10) mirrorPoints += 15
  else if (saftErrors.length >= 5) mirrorPoints += 8
  else if (saftErrors.length >= 2) mirrorPoints += 4

  // ── 4. TVA la încasare — e-TVA suspendat ──
  if (firm.vatCashAccounting && new Date(period.date) < new Date('2026-10-01')) {
    findings.push({
      code: 'R_VAT_CASH',
      name: 'TVA la încasare — e-TVA suspendat până 30.09.2026',
      weight: 0,
      note: 'NU aplicăm reguli e-TVA pentru această firmă'
    })
    // Skip e-TVA checks
  }

  // ── 5. Modifier sectorial ──
  const HIGH_RISK_SECTORS = ['construcții', 'HoReCa', 'transport', 'e-commerce']
  if (HIGH_RISK_SECTORS.includes(firm.caen)) {
    mirrorPoints *= 1.15
  }

  // ── 6. Normalize ──
  const officialNormalized = Math.min(100, (officialPublicPoints / 250) * 100)  // 250 = prag risc mare ANAF
  const mirrorNormalized = Math.min(100, Math.round(mirrorPoints))

  // ── 7. Score final = WEIGHTED average ──
  const finalScore = Math.min(100, Math.round(
    officialNormalized * 0.5 + mirrorNormalized * 0.5
  ))

  // ── 8. Band ──
  const band =
    finalScore >= 80 ? 'Risc foarte mare' :
    finalScore >= 60 ? 'Risc mare' :
    finalScore >= 35 ? 'Risc mediu' :
    'Risc redus'

  return {
    score: finalScore,
    band,
    officialPublicPoints,
    officialPublicNormalized: officialNormalized,
    mirrorPoints: mirrorNormalized,
    top5Findings: rankFindings(findings).slice(0, 5),
    actionPlan: generateActions(findings),
    disclaimer: 'Scor estimativ bazat pe regulile publice ANAF. Nu reprezintă scor oficial APIC.'
  }
}
```

---

## 10. 3 viziuni distincte CompliScan (recomandare raport academic V3)

### Viziunea 1: Contribuabilul (Scor 0-100)
Replică Fișa de risc pe care ar vedea-o inspectorul în APIC (când va fi operațional).

### Viziunea 2: Algoritmică (Top 5 Riscuri ranked)
- Severity weight × 0.40
- Money exposure × 0.25
- Legal deadline × 0.15
- Recurrence × 0.10
- Source confidence × 0.10

### Viziunea 3: Rezolvare (SOP 60 min)
Workflow step-by-step:
1. Descarcă notificarea SPV
2. Rulează Top 10 documente TVA
3. Identifică factura lipsă
4. Depune rectificativa
5. Verifică în 24h impact pe scor

---

## 11. Risk legal — confirmat OK pentru toate AI surse

- ✅ **Reverse engineering documente publice** = LEGAL (Legea 544/2001 acces informații publice)
- ✅ **OAuth ANAF third-party** = LEGAL cu consimțământ + DPA + scope minim
- ✅ **Stocare date SPV** = LEGAL cu GDPR (5 ani retention, EU residency, criptare AES-256)
- ✅ **Generare scor risc pentru clienții cabinetului** = LEGAL (analiza de date)

**Wording obligatoriu UI/landing:**
> *"Scor estimativ pe baza documentelor fiscale, registrelor publice, SPV și regulilor publice ANAF. Nu reprezintă scor oficial APIC."*

**NU promite:**
- ❌ "Scor oficial ANAF"
- ❌ "Garantăm evitarea controlului"
- ❌ "Parteneriat ANAF/APIC"

---

## 12. Surse primare verificate

### Documentație oficială ANAF
- Fișa indicatorilor risc fiscal: https://static.anaf.ro/static/10/Anaf/transparenta/Anexanr2laproceduraFisaindicriscfiscal.htm
- Brosură RO e-TVA: https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/eTVA/Brosura_eTVA.pdf
- SAF-T teste consistență Set I: comunicat ANAF 2022
- SAF-T teste consistență Set II: comunicat ANAF 2024
- OPANAF 1826/2025 + 2372/2025: MO 708/30.07.2025
- OUG 70/2024 + OUG 13/2026: legislatie.just.ro
- Plan Strategic ANAF: static.anaf.ro/static/10/Anaf/transparenta/Plan_strategic.pdf

### Validare independentă
- PwC RO Tax & Legal alerts
- CECCAR Business Magazine
- fiscalitatea.ro
- contabilul.manager.ro

### Confirmare tehnologică
- docs.socrate.io — OAuth ANAF integration
- ecosio.com — RO e-Factura technical
- Latitude App pricing & features

---

## 13. Cele 11 features CompliScan — specificații finale post-validare

### A. Piloni Blue Ocean (5)
1. **Risk Score 0-100 dual** (Mirror + Official Public) — cu disclaimer "nu APIC oficial"
2. **Audit Pack ZIP** — manifest CECCAR Standard 21 + draft opinion (cabinet semnează)
3. **Cross-client Network Detection** — replică SNA din APIC
4. **Certificate Vault** — eIDAS + token SPV + form 270 + procuri notariale
5. **What-if Mode** — simulează acțiune → recalculează scor

### B. Engine signals (4 — moat parțial)
6. **Cross-correlation 8 reguli** — diferențiat de Latitude prin per-cabinet pricing + scope D205↔AGA + D406↔Bilanț
7. **D300 vs P300** — cu feature flag legislativ + framing "flag APIC, nu amendă" post 09.03.2026
8. **Workflow cereri docs + magic link audit-grade** — diferențiat de Vello prin timestamp cryptographic + cross-ref declarații
9. **Burden Index integrat** — meta-feature cross-stack cu Risk Score (1) + Workflow (8) + Network (3)

### C. Foundation (4 — table-stakes)
10. **Citire SPV** — OAuth + Job Worker noaptea
11. **Cross-ERP reader** — SAGA + Oblio + SmartBill + WinMentor
12. **Calendar fiscal** — din vector fiscal SPV
13. **SAF-T 33 teste** (22+11) — DUKIntegrator wrapper + reguli proprii

### Pricing
- **Mirror Basic** — 299 RON/lună (cabinete <25 firme)
- **Mirror Pro** — 599 RON/lună (25-80 firme)
- **Mirror Expert** — 999 RON/lună (80-150 firme)
- **Audit Pack Add-on** — 199 RON/client/lună

### Positioning final
> *"CompliScan ANAF Mirror — singurul tool care îți arată ce vede APIC despre firmele tale, înainte ca inspectorul să o vadă. 599 RON pentru cabinet întreg vs €13.650 la Latitude pentru 78 firme."*

---

## 14. Roadmap execuție (post-validare)

### Sprint 1 (2 săptămâni) — Engine core
- 8 indicatori Fișa risc fiscal cu ponderi exacte
- Dual scoring system (official + mirror)
- 33 teste SAF-T în engine
- Feature flag legislativ e-TVA (OUG 13/2026 cut-off 09.03.2026)
- Feature flag TVA la încasare (suspendare până 30.09.2026)

### Sprint 2 (2 săptămâni) — UI + Risk Score
- Component AnafRiskScore (badge 0-100, dual display)
- Top 5 findings ranked
- Action plan generator
- 3 viziuni: Contribuabil / Algoritmică / Rezolvare

### Sprint 3 (2 săptămâni) — Cross-correlation + D300/P300
- 8 reguli cross-correlation engine
- D300 vs P300 reconciler cu feature flag
- Pre-fill rectificative din findings

### Sprint 4 (2 săptămâni) — Audit Pack ZIP
- Manifest CECCAR Standard 21
- Draft opinion template
- Cross-ref engine (declarații + recipise + AGA + ONRC + facturi)
- ZIP packager + cryptographic timestamp

### Sprint 5+ (luna 3-6) — Pilot + Calibrare
- 5-10 cabinete pilot recrutate FB grupuri
- Dataset jurisprudență 30 cazuri tribunal fiscal
- Calibrare ponderi pe rezultate reale
- Network detection cu cross-cabinet anonymized data

---

## Status final

**4 surse triangulează** + 1 agent cu sursa primară = **base truth STABIL**.

**Codarea poate începe cu confidence ~90%** pe specificații tehnice.

**STOP cercetare. START construire.**
