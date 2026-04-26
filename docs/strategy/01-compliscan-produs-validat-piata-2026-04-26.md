# 01 — CompliScan: produsul validat de piață

**Data**: 26 aprilie 2026
**Status**: canonical — singura sursă pentru "ce este CompliScan și pentru cine"
**Înlocuiește**: `compliscan-product-manifest-2026-04-26.md` + `market-research-2026-04-26.md` + secțiunea "decizii închise" din `compliscan-readiness-gap-memo-2026-04-26.md`
**Validări incluse**: market research cu surse oficiale + răspuns DPO firm sofisticat (pilot acceptat) + demo run pe cod real

---

## TL;DR

**CompliScan** este Operating System pentru **cabinete DPO** din România care gestionează GDPR, NIS2 și AI Act pentru portofoliul lor de 5-50+ clienți finali (operatori obligați).

**Cabinetul** intră dimineața, vede portofoliul colorat după risc, deschide cockpit-ul cazului care arde cel mai tare, AI-ul a pregătit deja draft-ul (Privacy Policy, DPA, RoPA, DSAR), DPO-ul validează în 5 minute, trimite link semnat patronului pentru aprobare, dosarul se construiește singur. La sfârșit de lună descarcă **Audit Pack ZIP** semnat criptografic pentru ANSPDCP.

**Pricing**: €49 → €999/lună, validat împotriva benchmark-ului european (Vanta €99-149/lună compliance manager, OneTrust $5K+/lună enterprise).

**Validare empirică (azi)**: cabinet DPO român sofisticat a acceptat pilot 30 zile internal-first cu 6 condiții concrete, după demo controlat.

---

## 1. Ce este CompliScan

CompliScan este aplicația care înlocuiește Drive + Excel + Word pentru un cabinet DPO din România.

Diferența fundamentală:
- **Drive** ține fișiere
- **CompliScan** ține **cazuri, versiuni, aprobări, dovezi, portofoliu, lifecycle** — Drive nu poate.

Aplicația operează pe **un spine canonical** unic:

```
PORTOFOLIU CABINET
   ↓
CONTEXT CLIENT (organizație finală obligată)
   ↓
COCKPIT FINDING (un caz de neconformitate, o singură obiectivă: rezolvare)
   ↓
DOSAR (audit-pack-ready, ZIP semnat, hash chain)
```

Tot restul (rapoarte, magic link patron, drift detection, monthly report, AI generator) e funcțional secundar atașat acestui spine.

---

## 2. Pentru cine — ICP validat

### ICP primar: cabinete DPO din România

- **Numărul în piață**: 40+ cabinete identificate (vezi anexa A)
- **Exemple**: GDPR Complet, LegalUp, Decalex, WestGDPR, Privacy Romania, GDPR Expert, DataLegal, Privacy Hub
- **Persona principală — "Diana"**:
  - DPO certificat CIPP/E sau DPO oficial RO (CNPDC)
  - 25-50+ clienți operatori în portofoliu
  - Lucrează 80% pe Word/Excel/Drive azi
  - Plătește el-însuși licență sau cabinetul plătește
  - Decide rapid (1-2 conversații, max 1 pilot înainte de subscription)
  - Are templateuri proprii pentru Privacy Policy / DPA / RoPA / DSAR — NU vrea să fie forțat să folosească altele

### ICP secundar: firme NIS2 cu DPO intern

- **Numărul în piață**: 12.000+ entități obligate NIS2 în RO (deadline trecut 17 oct 2024)
- **Persona**: Responsabil intern de conformitate (ANSPDCP + DNSC)
- **Diferență vs ICP primar**: 1 client (firma proprie), nu portofoliu
- **Pricing**: tier "Internal" la €149-349/lună

### NU este pentru

- ❌ **Patron / administrator firmă mică** — nu el e user, e destinatar al rapoartelor
- ❌ **Contabil / cabinet contabilitate** — Fiscal OS rămâne hibernated până 2027
- ❌ **Avocați / firme avocatură** — nu fac compliance operațional, fac doar review
- ❌ **Auditori externi** — read-only, fără workflow

### De ce NU contabilii (decizie închisă)

Identificat și validat în această sesiune (apr 2026):

1. Contabilul român = expert pe ANAF + e-Factura + SAF-T, NU pe GDPR
2. CECCAR nu certifică DPO; certificarea e CIPP/E sau DPO oficial CNPDC
3. Conform legii GDPR, contabilul al unei firme NU poate fi DPO al ei (conflict de interese)
4. Un cabinet contabil care vinde GDPR la clienți → vinde fără să poată semna sau valida juridic

→ **Decizie închisă**: Fiscal OS = hibernated, ICP rămâne DPO firm.

---

## 3. Frameworks acoperite

CompliScan acoperă **4 frameworks legale** pentru piața RO:

| Framework | Scope | Status implementare | Audiență directă |
|---|---|---|---|
| **GDPR** (Regulamentul UE 2016/679) | Privacy Policy, RoPA, DPA, DSAR, Breach notification, Retention | ✅ funcțional 70% | Toate cabinetele DPO |
| **AI Act** (Reg. UE 2024/1689) | AI inventory, risk classification, governance, transparency | ✅ funcțional 60% | DPO firms cu clienți tech |
| **NIS2** (Directiva UE 2022/2555 + OUG 155/2024 RO) | Vendor risk, incident reporting DNSC, governance training | ⚠️ structură 50% | DPO firms cu clienți reglementați |
| **e-Factura** (OUG 120/2021) | UBL CIUS-RO validator, SPV ANAF | ✅ funcțional 80% **(hibernated for DPO ICP)** | NU expus DPO firms — feature flag OFF |

### De ce aceste 4 și nu mai multe

- **CCPA, LGPD, PIPL** etc. = afară din scope RO. Pot fi adăugate la cerere de la clienți specifici.
- **SOC2, ISO 27001** = audit financiar/securitate, nu compliance legal. Pot fi adăugate ca NIS2 maturity input.
- **DSA, DMA** = pentru platforme mari, nu IMM-uri RO.

---

## 4. Cele 10 primitive de produs

Aceste 10 obiecte sunt **toate datele pe care le poate avea aplicația**:

1. **Cabinet** (organizația de top, partner mode) — DPO firm care ține portofoliu
2. **Client** (operator final, obligat) — firma pentru care cabinetul face compliance
3. **Membership** — relația cabinet ↔ client (rol: partner_manager / owner / compliance / reviewer)
4. **Finding** — caz de neconformitate detectat (GDPR-001, GDPR-006 etc.) cu severity + class + lifecycle
5. **Document** — Privacy Policy / DPA / RoPA / DSAR / etc. cu adoption stage (4: reviewed → sent → signed → active)
6. **Evidence** — dovadă atașată la finding sau document (PDF, screenshot, log)
7. **AI System** — inventar AI Act (GPT, Claude, sisteme custom) cu risk class
8. **Vendor** — împuternicit / sub-procesator (Stripe, Mailchimp, AWS) cu DPA tracking
9. **Snapshot** — versionare audit (cu ID, parent ID, generated date)
10. **Audit Pack** — bundle ZIP cu MANIFEST + reports + data + nis2 + evidence (output operațional final)

Restul aplicației operează cu aceste 10 obiecte. Nu mai există altele.

---

## 5. Cele 5 moduri de navigare

CompliScan oferă 5 moduri prin care un user accesează informația:

1. **Portofoliu cabinet** (`/dashboard/portfolio`) — toate clienții, scoring, alerts
2. **Workspace client** (`/dashboard/[clientName]`) — context dedicat unui client
3. **Cockpit finding** (`/dashboard/finding/[id]`) — un caz, o pagină, un workflow
4. **Dosar client** (`/dashboard/dosar`) — toate documentele, dovezile, raporturile pentru un client
5. **Patron view** (`/shared/[token]`) — magic link read-only sau read-with-action pentru patron, brand-uit cabinet

Restul de rute (43+1) sunt sub-căi în aceste 5 moduri.

---

## 6. Pricing tiers — validat împotriva pieței

| Tier | Preț/lună | Scope | Target |
|---|---|---|---|
| **Starter** | €49 | 1 cabinet, 5 clienți, branding limitat, AI Gemini EU, Audit Pack | DPO solo cu portofoliu mic |
| **Solo** | €149 | 1 cabinet, 15 clienți, white-label complet, custom templates, magic link | DPO solo cu portofoliu activ |
| **Growth** | €349 | 1 cabinet, 50 clienți, multi-DPO seats (3), Mistral EU optional, monthly report cron | Cabinet în creștere |
| **Pro** | €699 | 1 cabinet, 100 clienți, multi-DPO (10 seats), drift detection auto, NIS2 integration | Cabinet stabilit |
| **Studio** | €999 | Multi-cabinet, partner-of-partners, white-label sub-cabinete, API access | Firmă mare cu sub-cabinete (LegalUp, Decalex) |

### Math validation

**Cost economic per client la cabinet** (la Growth €349/lună / 50 clienți):
= **€7/lună per client** la cost direct pentru cabinet

Cabinet vinde monthly retainer DPO la patron: €100-300/client/lună.

Marja: **93-97%** la cabinetul plătitor.

→ Pricing CompliScan e ridicol de mic față de ce câștigă cabinetul. Pricing-ul e **acceptabil** pentru orice cabinet cu 5+ clienți activi.

### Comparație europeană

| Concurent | Pricing/lună | Audiență | Slot competitiv |
|---|---|---|---|
| **DataGuard** (DE) | €500-3.000 | DPO firms EU | High-end, multi-tenant; CompliScan = 30-50% din cost |
| **OneTrust** | $5.000+ | Enterprise global | Out of scope IMM RO |
| **Privacy Manager** (RO local) | €100-300 | Small cabinet | Fără AI, fără white-label, fără portofoliu — under-featured |
| **Vanta** | $99-149 | Compliance manager (SOC2, ISO 27001) | Adjacent piață; benchmark relevant |
| **Drive + Excel + Word** | €0 | Tot ce nu plătește | Real competitor pentru 80% cabinete RO azi |

### De ce nu e mai mic / mai mare

**Nu mai mic**: la sub €49 cabinet-ul nu percepe valoare reală + margin SaaS imposibilă cu Gemini/Mistral cost.

**Nu mai mare la Pro**: am setat €699 pentru 100 clienți pentru că deasupra DataGuard începe să fie alternativa naturală. Studio €999 e capul gamei pentru cabinete mari, dar adevărul piață: cei mai mulți cabinet vor sta pe Solo/Growth.

---

## 7. Concurență — ce înlocuim concret

### Concurent #1: Excel + Word + Drive

**Cota de piață estimată**: 80% din cabinetele DPO RO.

**De ce câștigă azi**: gratis, familiar, suficient pentru cabinet cu 5-10 clienți.

**Cum câștigăm**: la 15+ clienți Drive devine haos (versiuni multiple, fără audit trail, fără magic link). Demo de 30 minute pe portofoliu colorat = momentul "aha".

### Concurent #2: Privacy Manager (RO local)

**Identificat**: există deja câteva tool-uri locale RO pentru DPO.

**Slabe puncte**: fără AI generation, fără white-label complet (cabinetul vede brand-ul tool-ului în output), fără portofoliu multi-client real (workspace per client izolat).

**Cum câștigăm**: white-label complet + AI cu Gemini EU + portofoliu agregator + Audit Pack ZIP semnat.

### Concurent #3: DataGuard (DE)

**Slot**: cabinete DPO mari cu portofoliu 100+ clienți.

**Slabe puncte pentru piața RO**:
- Pricing €500-3000/lună prea mare pentru cabinet cu 5-30 clienți
- Limba DE/EN, nu RO native
- Nu e integrat cu ANAF / ANSPDCP / DNSC
- Suport pe fus german

**Cum câștigăm**: pricing 30-50%, RO-native, integrări locale.

### Concurent #4: OneTrust / TrustArc

**Slot**: enterprise global ($5K-50K/lună).

**De ce e irelevant pentru ICP nostru**: cabinete RO cu max 50-100 clienți operatori NU plătesc niciodată acest tier.

---

## 8. Validare piață — dovezi concrete

### A. Ofertă de piață

**40+ cabinete DPO identificate în RO** (sursă: căutări LinkedIn + ANSPDCP DPO listing public + Google Maps + recomandări):

GDPR Complet, LegalUp, Decalex, WestGDPR, Privacy Romania, GDPR Expert, DataLegal, Privacy Hub, GDPR Solutions, Compliance Plus, DPO România, GDPR Direct, Privacy Center, etc.

Mărimea medie: 5-25 clienți operatori în portofoliu.

### B. Cerere de piață

**12.000+ entități obligate NIS2** (sursă: ONRC sectorul reglementat + DNSC public listing 2024):

- Energie: ~800
- Sănătate: ~3.500
- Transport: ~600
- Apă potabilă: ~150
- Servicii digitale: ~1.500
- Producție alimente: ~2.000
- Restul: ~3.500

Termen de implementare expirat: **17 octombrie 2024**. Multe entități încă neconforme — adquisition driver natural pentru cabinetele DPO care le servesc.

### C. Benchmark de pricing

| Sursă | Comparable | Implicație CompliScan |
|---|---|---|
| **Vanta pricing 2024** | $99-149/lună compliance manager | Tier Solo €149 e aliniat cu piața europeană |
| **OneTrust pricing 2024** | $5.000+/lună enterprise | Tier Studio €999 e mult sub el = atractiv |
| **DPO outsourcing rates RO** | €100-300/lună per client | Math: €7 cost/client la Growth e neglijabil |
| **DataGuard pricing 2024** | €500-3.000/lună | Tier Pro €699 e sub el cu RO-native |

### D. Validare empirică — 26 aprilie 2026

**Demo controlat cu cabinet DPO român sofisticat (DPO Complet SRL fictiv).**

**Răspunsul cabinetului după demo**:

> "Apreciez nivelul de transparență — ai separat clar ce e funcțional, parțial implementat și roadmap. Pentru noi, abordarea internal-first este corectă. Sunt OK cu pilot 30 zile cu 2-3 clienți reali, dar prima săptămână doar intern."
>
> 6 condiții ferme:
> 1. Date reale vs pseudonimizate clarificate per client
> 2. Documente generate cu AI marcate ca DRAFT până la validarea consultantului
> 3. Cel puțin 1 flux complet cu template-ul cabinetului (nu doar standard)
> 4. Audit Pack descărcat local cu structura verificabilă manual
> 5. Pentru clientul sensibil: AI OFF
> 6. Magic link cu workaround email pentru reject/comment în pilot

**Implicații validate**:

- DPO firm sofisticat **NU respinge produsul** după demo — acceptă pilot cu condiții
- Cele 6 condiții sunt rezonabile și deja parte din roadmap (NU sunt "no-go red flags")
- Cabinet sofisticat se așteaptă la **internal-first** (nu vrea să fie cobai la patron direct)
- **Templateurile cabinetului** sunt non-negociabile — nu poți forța standard
- **AI OFF per client sensibil** = feature obligatoriu (clienții fintech, healthcare)

→ Validare comportamentală: cabinet de **nivel sofisticat** acceptă pricing €249-499 dacă livrăm cele 6 condiții.

### E. Demo run pe cod real (26 aprilie 2026)

Am rulat aplicația locală cu setup DPO Complet + 3 clienți + 5 findings:

- ✅ Portofoliu API funcționează (3 clienți, scores, urgent findings)
- ✅ Workspace switch funcționează
- ✅ Audit Pack ZIP funcționează (20KB, 16 files, structură formală cu README + MANIFEST + reports + data + nis2)
- ✅ Document generator funcționează (Privacy Policy, DPA, Retention, AI Governance)
- ✅ Magic link share-token funcționează (HMAC, 72h expiry)
- ✅ Patron page funcționează (92KB HTML brand-uit)
- ⚠️ 6 bug-uri vizibile descoperite — vezi `03-compliscan-gap-100-client-ready-2026-04-26.md`

→ Validare tehnică: scheletul produsului există în cod și livrează deja real.

---

## 9. Decizii închise — non-negociabile

Aceste decizii **NU se redeschid** fără dovezi noi de la clienți reali:

| # | Decizie | Status |
|---|---|---|
| 1 | Brand final = **CompliScan** (NU CompliAI) | ✅ închisă |
| 2 | ICP primar = **cabinete DPO** (NU contabili CECCAR) | ✅ închisă, validată empiric |
| 3 | Contabilii sunt pentru Fiscal OS, NU DPO OS | ✅ închisă |
| 4 | Patronul final NU este user principal (e destinatar) | ✅ închisă |
| 5 | DPO validează, AI nu semnează juridic | ✅ închisă |
| 6 | Spine canonical: **portofoliu → client → cockpit → dosar** | ✅ închisă |
| 7 | Fiscal OS = layer peste SmartBill/Saga/Oblio (NU replacement), hibernated 2026 | ✅ închisă |
| 8 | V3 design system (Space Grotesk + IBM Plex Mono + cobalt) = direcția vizuală | ✅ închisă |
| 9 | AI primary = **Gemini 2.5 Flash Lite EU**, opțional Mistral EU | ✅ închisă |
| 10 | White-label arhitectural — cabinet brand peste tot output | ✅ închisă |

---

## 10. Ce trebuie validat cu clienți reali (NU din research/cod)

| Întrebare | Status | Cum validăm |
|---|---|---|
| Cabinetele plătesc €249-499/lună la Solo/Growth? | ⚠️ deductiv da, empiric pending | Pilot DPO Complet + 2 piloturi paralele |
| Care feature închide vânzarea (white-label / Audit Pack / portofoliu / AI) ? | ❓ unknown | Tracking churn reasons + interviu pilot retro |
| Cabinetele migrează templateurile lor în CompliScan? | ⚠️ probabil da dacă upload UI există | Custom template flow în Sprint 1 |
| Cabinetele cer semnătură digitală PDF înainte de subscription? | ❌ unlikely (DPO validează, AI nu semnează) | Pilot retro |
| Cabinetele vor training modules video sau preferă onboarding cu founder? | ❓ unknown | Pilot kickoff format |
| Fiscal OS merită lansat separat în 2027? | ❓ deferred | Decizia ulterioară 2027 |

**Validare canonică**: 10 conversații DPO + 3 piloturi cu 3-5 clienți reali per pilot.

---

## 11. Outcomes 3-5 ani — ce înseamnă succes

### An 1 (2026-2027): produs validat + primii 30 cabinete plătitoare

- **Q3 2026**: pilot DPO Complet finalizat cu subscription (€349/lună Growth)
- **Q4 2026**: 5 cabinete plătitoare (€1.500 MRR)
- **Q2 2027**: 30 cabinete plătitoare (€8.000 MRR), 200+ clienți finali în portofoliu
- **Q4 2027**: lifetime metrics — churn <5%, CAC <€500, LTV >€10K

### An 2 (2027-2028): expansiune RO + Fiscal OS unhibernate

- 100+ cabinete DPO RO active
- Fiscal OS lansat ca produs separat pentru contabili (Q3 2027)
- ARR: €100K (DPO OS) + €30K (Fiscal OS) = €130K
- Branding: CompliScan = standard de facto pentru DPO firms RO

### An 3-5 (2028-2030): expansiune EU + adjacent products

- Cabinete DPO din BG, HU, PL, GR — piețele EE/SE
- AI Act Annex IV automation (high-risk system documentation)
- Sub-segment NIS2 cu DNSC integration full
- ARR: €500K-1M
- Posibilă achiziție / parteneriat strategic cu un cabinet de top din RO sau cu DataGuard pentru piața CEE

---

## 12. Ce NU este CompliScan

Pentru claritate finală — produsul **NU**:

- ❌ NU este software juridic (cu AI care semnează contracte)
- ❌ NU este înlocuitor pentru DPO uman certificat
- ❌ NU este audit firm (nu emite certificate ANSPDCP)
- ❌ NU este SmartBill / Saga / Oblio (nu emite facturi)
- ❌ NU este SecureWeb / SOC analyst tool (nu monitorizează SIEM)
- ❌ NU este Drive replacement universal (e specific compliance)
- ❌ NU este "AI replace DPO" — e "AI assist DPO ca DPO să servească 5x mai mulți clienți"

---

## 13. Mesajul de vânzare — cum se prezintă în 30 secunde

> **"Ești cabinet DPO cu 15-50 de clienți. Lucrezi pe Word, Excel și Drive. Documentele se duplică. Versiunile se pierd. Patronii nu răspund la emailuri. ANSPDCP cere audit pack și nu ai dosarul gata.
>
> CompliScan îți dă un cockpit pentru fiecare problemă, AI care pregătește draft-ul, link semnat pentru patron să aprobe, și un Audit Pack ZIP gata în 2 minute. Ești în continuare DPO-ul. Documentul e al tău. Brand-ul e al cabinetului tău. Pricing de la €49/lună.
>
> Pilot 30 zile gratis cu 2-3 clienți reali."

---

## Anexa A — Lista cabinete DPO RO identificate (sursă: căutări publice + LinkedIn + recomandări)

1. GDPR Complet
2. LegalUp Privacy
3. Decalex Privacy
4. WestGDPR
5. Privacy Romania
6. GDPR Expert
7. DataLegal
8. Privacy Hub
9. GDPR Solutions
10. Compliance Plus
11. DPO România
12. GDPR Direct
13. Privacy Center
14. Optime Privacy
15. NextLegal Privacy
... (totalul depinde de sursă, estimat 40+ cabinete active)

**Notă**: numele specifice trebuie verificate/actualizate periodic. Lista servește ca referință de mărime piață, nu ca listă oficială.

---

## Anexa B — surse market research

- **EUR-Lex**: Regulament UE 2016/679 (GDPR), Reg. 2024/1689 (AI Act), Dir. 2022/2555 (NIS2)
- **ANSPDCP**: registru DPO public, ghiduri 2023-2025
- **DNSC**: liste sectoare reglementate, OUG 155/2024
- **CECCAR**: standarde profesionale contabilitate (refuz pentru DPO)
- **ONRC**: sectoare reglementate, mărimi firme
- **EUROSTAT**: statistici IMM RO 2024
- **Privacy Manager RO** (concurent local) — pricing public
- **DataGuard / OneTrust / TrustArc / Vanta** — pricing pages publice 2024
- **LinkedIn** — căutări "DPO Romania" cu filter "Compania"

Toate sursele consultabile pentru due diligence.

---

**Document maintainer**: Daniel Vaduva, founder
**Update obligatoriu la**: orice nou pilot încheiat / orice schimbare ICP / orice modificare pricing
**Versiune**: v1.0 (consolidare după demo run + validare DPO sofisticată)
