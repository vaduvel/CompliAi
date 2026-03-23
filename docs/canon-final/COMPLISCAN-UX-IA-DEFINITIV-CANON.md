# CompliScan — UX / IA Definitiv

Data: `2026-03-22`
Versiune: `1.0`

Acest document este contractul complet de UX/IA pentru CompliScan.
Nimic nu se implementează dacă nu e descris aici.
Nimic descris aici nu se modifică fără versiune nouă a documentului.

Regulă de precedență:
- pe UX, IA, navigație, ierarhie de pagini și user story, acest document câștigă
- pe auth, sesiune, ownership, RBAC, billing și route guards, câștigă:
  - [COMPLISCAN-PORTFOLIO-TECH-SPEC-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-PORTFOLIO-TECH-SPEC-CANON.md)
  - [COMPLISCAN-PLAN-IMPLEMENTARE-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-PLAN-IMPLEMENTARE-CANON.md)

Baza de personas: `compliscan-checkpoint-utilizatori.md` (2026-03-20)
Baza vizuală: `Evidence OS v1`
Baza de motor: `Automation Layer` existent pe `main`

---

# PARTEA 1 — CINE FOLOSEȘTE PRODUSUL

## 1.1 Personas ordonate pe prioritate de business

### P1 — Consultant / Contabil / Auditor (PRIORITATEA 1)

Exemple reale:
- Elena, contabil autorizat, 35 clienți IMM, Brașov
- Radu, consultant NIS2, 12 clienți, București

Profil:
- Gestionează 5-40+ firme simultan
- Folosește aplicația zilnic, 2-4 ore
- Vrea eficiență: să vadă instant care client are urgențe
- Vrea batch operations: rapoarte, scanări, DPA-uri
- Plătește 1.000-2.500 lei/lună (plan Partner)
- Este cel care aduce alți clienți (growth engine)

Ce face în aplicație (în ordinea frecvenței):
1. Dimineața: deschide portofoliul, sortează pe urgență
2. Intră pe primul client cu probleme → rezolvă findings
3. Generează documente pentru clienți (DPA, politici)
4. Trimite rapoarte lunare clienților
5. Adaugă client nou → onboarding rapid cu prefill ANAF
6. Verifică furnizorii comuni (un furnizor poate afecta mai mulți clienți)
7. Weekly: raport agregat pe tot portofoliul

Ce NU face niciodată:
- Nu pierde timp cu dashboarduri decorative per firmă
- Nu configurează manual fiecare firmă de la zero
- Nu face org switch de 40 de ori ca să adune informații

### P2 — DPO / Compliance Officer intern (PRIORITATEA 2)

Exemple reale:
- Andrei, CTO firmă IT outsourcing, 22 angajați, București
- Roxana, Compliance Officer bancă regională, 400 angajați

Profil:
- Specialist, cunoaște legislația
- Gestionează 1 organizație
- Folosește aplicația zilnic sau săptămânal
- Vrea profunzime: assessment complet, toate modulele
- Plătește 300-1.500 lei/lună (plan Pro)

Ce face în aplicație:
1. Verifică alertele de azi
2. Lucrează prin finding-urile critice, urcă dovezi
3. Completează assessment NIS2
4. Revizuiește furnizorii cu DPA expirat
5. Declară sisteme AI noi
6. Generează raport lunar
7. Pregătește dosarul pentru audit/control

### P3 — CEO / Administrator firmă mică (PRIORITATEA 3)

Exemple reale:
- Cristian, fondator agenție web, 3 angajați, Cluj
- Dr. Ioana, medic stomatolog, 2 angajați, Timișoara

Profil:
- Nu e specialist în conformitate
- Vrea răspuns la o problemă concretă (DPA, contract, audit)
- Se loghează de 2-3 ori pe săptămână sau lunar
- Citește emailul de digest mai des decât intră în app
- Plătește 0-150 lei/lună (freemium → starter)

Ce face în aplicație:
1. Generează un DPA (motivul inițial de intrare)
2. Scanează un contract → vede ce lipsește
3. Descarcă ceva pentru auditor
4. Citește scorul și face ce îi zice butonul verde

Ce NU face niciodată:
- Assessment NIS2 de 20 întrebări
- Inventar AI manual
- Configurare agenți
- Log audit

### P4 — Membru echipă / Viewer

Profil:
- Invitat de P1, P2, sau P3
- Vede doar ce i s-a atribuit
- Uploadează dovezi pentru task-uri
- Nu configurează nimic

### P5 — Auditor extern / Destinatar link partajat

Profil:
- Primește link securizat (72h) la un dosar sau raport
- Read-only
- Nu are cont în aplicație (opțional)
- Descarcă, verifică, pleacă

---

# PARTEA 2 — ONBOARDING

## 2.1 Înregistrare

Ecranul de login/register: split screen
- Stânga: branding + propunere valoare + social proof
- Dreapta: tabs Autentificare / Înregistrare
- Google OAuth + email/password
- Disclaimer legal jos

## 2.2 Prima întrebare post-register

Imediat după crearea contului, înainte de orice altceva:

```
┌─────────────────────────────────────────────┐
│                                             │
│   Cum vei folosi CompliScan?                │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │ 🏢 Gestionez conformitatea          │   │
│   │    firmei mele                       │   │
│   │    CEO, administrator, responsabil   │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │ 📋 Sunt consultant / contabil       │   │
│   │    cu mai mulți clienți             │   │
│   │    Contabil, avocat, DPO extern     │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │ 🛡️ Sunt responsabil conformitate    │   │
│   │    într-o firmă                      │   │
│   │    DPO, compliance officer, CISO    │   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

Răspunsul se salvează ca:

```typescript
userMode: 'solo' | 'partner' | 'compliance'
```

## 2.3 Flow post-întrebare per mod

### Solo (CEO firmă)

```
Întrebare mod → Profil firmă (prefill ANAF din CUI) → ApplicabilityWizard (2-3 întrebări) → Prima scanare document → Dashboard
```

ApplicabilityWizard determină ce framework-uri sunt relevante:
- GDPR: întotdeauna da
- e-Factura: întotdeauna da
- NIS2: doar dacă sectorul e relevant (transport, sănătate, financiar, IT/digital, energie)
- AI Act: doar dacă folosesc sisteme AI

Wizard-ul adaptiv (adaptive-intake.ts) suprimă întrebările irelevante pe baza CAEN.

### Partner (Consultant)

```
Întrebare mod → Profil consultant (nume cabinet, CUI opțional) → „Adaugă primul client" (CUI → prefill ANAF) → Scanare document pentru client → Portofoliu
```

NU parcurge ApplicabilityWizard personal. Fiecare client adăugat are propriul profil și applicability.

### Compliance (DPO intern)

```
Întrebare mod → Profil firmă (prefill ANAF) → ApplicabilityWizard complet (5 pași) → Dashboard complet
```

Vede toate modulele de la început.

## 2.4 Adaugă client (doar mod Partner)

Flow separat, accesibil oricând din Portofoliu:

```
CUI client → Prefill ANAF (denumire, CAEN, adresă, angajați) → ApplicabilityWizard scurt per client → Confirmare → Client adăugat în portofoliu
```

Alternativ: Import CSV cu mai mulți clienți (există deja `/api/partner/import-csv`).

---

# PARTEA 3 — NAVIGARE

## 3.1 Principiu fundamental

Navigarea se adaptează pe baza a 3 variabile:

```
userMode × applicability × rol RBAC = nav vizibil
```

- `userMode` → determină dacă vezi Portofoliu sau nu
- `applicability` → determină ce sub-pagini apar în Monitorizare
- `rol RBAC` → determină ce poți face (owner/compliance/reviewer/viewer)

## 3.2 Sidebar — Mod Partner (Consultant cu clienți)

Aceasta este navigarea primară pentru P1 (prioritatea de business):

```
PORTOFOLIU
├── Prezentare generală          ← tabel cu toți clienții
├── Alerte                       ← cross-firmă, sortate pe urgență
├── Remediere                    ← task-uri cross-firmă
├── Furnizori                    ← agregat (un vendor = un rând)
└── Rapoarte                    ← batch export, raport portofoliu

─── separator ───

FIRMA: [Dropdown selector ▼]     ← client selectat

├── Acasă                        ← status firmă selectată
├── Scanează                     ← upload + analiză + documente
├── Monitorizare                 ← ce trebuie urmărit
│   ├── Conformitate             ← findings per framework
│   ├── Furnizori                ← vendor review + DPA
│   ├── Sisteme AI *             ← inventar + discovery (dacă applicability AI Act)
│   ├── NIS2 *                   ← assessment + incidente (dacă applicability NIS2)
│   └── Alerte                   ← drift + notificări
├── Acțiuni                      ← ce trebuie făcut
│   ├── Remediere                ← task queue + resolution
│   ├── Politici                 ← generator documente
│   └── Vault                    ← dosare sigilate
├── Rapoarte                     ← export + PDF + partajare + log audit
└── Setări                       ← org + membri (per client)

─── separator ───

⚙ Setări cont                   ← profil consultant, securitate, sesiuni, preferințe
🔔 Notificări (3)
```

`*` = apare doar dacă applicability-ul clientului selectat include acel framework.

Comportament:
- La login, consultantul aterizează pe „Portofoliu > Prezentare generală"
- Click pe un client din tabel → se selectează în dropdown, secțiunea per-firmă se încarcă
- Portofoliu rămâne mereu accesibil sus, nu dispare când intri pe o firmă

## 3.3 Sidebar — Mod Compliance (DPO intern)

```
├── Acasă                        ← status firmă
├── Scanează                     ← upload + analiză + documente
├── Monitorizare
│   ├── Conformitate             ← findings per framework
│   ├── Furnizori                ← vendor review + DPA
│   ├── Sisteme AI *             ← dacă applicability AI Act
│   ├── NIS2 *                   ← dacă applicability NIS2
│   └── Alerte                   ← drift + notificări
├── Acțiuni
│   ├── Remediere                ← task queue + resolution
│   ├── Politici                 ← generator documente
│   └── Vault                    ← dosare sigilate
├── Rapoarte                     ← export + PDF + partajare + log audit
└── Setări                       ← org + membri + integrări + automatizare

─── separator ───

🔔 Notificări (3)
👤 Cont                          ← profil, securitate, sesiuni, preferințe
```

Identic cu secțiunea per-firmă de la Partner, fără secțiunea Portofoliu.

## 3.4 Sidebar — Mod Solo (CEO firmă mică)

```
├── Acasă                        ← status simplificat
├── Scanează                     ← upload + analiză
├── De rezolvat                  ← finding-uri + task-uri (view simplificat)
├── Documente                    ← politici generate + documente scanate
├── Rapoarte                     ← export simplificat
└── Setări                       ← org + plan

─── separator ───

🔔 Notificări
👤 Cont
```

Mod Solo NU vede:
- Monitorizare ca grup expandabil (prea complex)
- Sub-pagini separate pentru NIS2, Sisteme AI, Furnizori
- Vault separat
- Log audit

În schimb, „De rezolvat" e o listă simplificată: findings + task-uri, cu badge de urgență, fără tabs complexe pe framework. Dacă userul are NIS2 sau AI Act din applicability, ele apar ca secțiuni în „De rezolvat", nu ca pagini separate.

„Documente" combină Politici + Documente scanate într-o singură suprafață.

## 3.5 Sidebar — Viewer (membru echipă invitat)

```
├── Acasă                        ← status read-only
├── Task-urile mele              ← doar ce i-a fost atribuit
├── Documente                    ← read-only
└── Setări                       ← profil personal

🔔 Notificări
```

Viewer-ul nu vede Scanează, Monitorizare, Rapoarte, Vault.

## 3.6 Auditor extern (fără cont / link partajat)

Nu are sidebar. Vede:
- Pagina Trust Center publică (`/trust/[orgId]`)
- Sau pagina de dosar partajat (link securizat 72h)
- Read-only: descarcă, verifică hash, pleacă

---

# PARTEA 4 — PORTOFOLIU (doar mod Partner)

## 4.1 Prezentare generală — pagina de landing

Elena (contabilă, 35 clienți) deschide aplicația luni dimineață. Vede:

```
PORTOFOLIU — 35 clienți

[Bară sumar]
  35 clienți │ Scor mediu: 71 │ 8 firme sub 60 │ 23 finding-uri critice │ 4 task-uri depășite

[Filtre]
  Toate │ Urgente │ Sub prag │ Fără scanare recentă

[Tabel]
┌─────────────────┬──────┬───────────┬─────────┬──────────────┬─────────────┬─────────┐
│ Firmă           │ Scor │ Critice   │ Task-uri│ Frameworkuri  │ Ultima scan │ Status  │
├─────────────────┼──────┼───────────┼─────────┼──────────────┼─────────────┼─────────┤
│ LogiTrans SRL   │  38  │ 5 ⚠      │ 8       │ GDPR, NIS2   │ acum 15 zile│ 🔴      │
│ MedPlus SRL     │  45  │ 3 ⚠      │ 6       │ GDPR, AI Act │ acum 7 zile │ 🔴      │
│ Firma ABC SRL   │  62  │ 1        │ 3       │ GDPR         │ ieri        │ 🟡      │
│ TechDev SRL     │  78  │ 0        │ 1       │ GDPR, NIS2   │ azi         │ 🟢      │
│ ...             │      │          │         │              │             │         │
└─────────────────┴──────┴───────────┴─────────┴──────────────┴─────────────┴─────────┘

[Acțiuni rapide]
  + Adaugă client │ 📊 Export portofoliu │ 📧 Trimite digest clienți
```

CTA principal: Rândul cu scor cel mai mic, vizibil prin sortare default pe urgență.

Click pe un rând → client selectat în dropdown din sidebar, navighezi la Acasă per firmă.

## 4.2 Alerte cross-firmă

Radu (consultant NIS2, 12 clienți) vede alertele din toți clienții:

```
ALERTE — 12 clienți │ 18 alerte active │ 6 noi azi

[Filtre]
  Toate │ Critice │ Noi │ ── Firmă: [Toate ▼] │ Framework: [Toate ▼]

┌────────┬───────────────────────────────────┬──────────────┬───────────┬──────┬──────────┐
│ Sev.   │ Alertă                            │ Firmă        │ Framework │ Timp │ Acțiune  │
├────────┼───────────────────────────────────┼──────────────┼───────────┼──────┼──────────┤
│ CRITIC │ DPA expirat — AWS Romania         │ LogiTrans    │ GDPR      │ 2h   │ Rezolvă  │
│ CRITIC │ DPA expirat — AWS Romania         │ TechDev      │ GDPR      │ 2h   │ Rezolvă  │
│ CRITIC │ Incident neraportat > 24h         │ MedPlus      │ NIS2      │ 5h   │ Rezolvă  │
│ RIDICAT│ Sistem AI nedeclarat — Midjourney │ Firma ABC    │ AI Act    │ 1zi  │ Rezolvă  │
│ MEDIU  │ Politică modificată netrimisă     │ TechDev      │ GDPR      │ 2zi  │ Rezolvă  │
└────────┴───────────────────────────────────┴──────────────┴───────────┴──────┴──────────┘
```

Observație: AWS Romania apare de 2 ori — 2 firme au aceeași problemă. Consultantul vede asta instant.

Click „Rezolvă" → navighează direct la finding-ul respectiv din firma corespunzătoare.

## 4.3 Remediere cross-firmă

Task-uri din toți clienții, sortate pe impact:

```
REMEDIERE — 34 task-uri active │ 4 depășite │ 12 de confirmat

[Filtre]
  Toate │ Depășite │ De confirmat │ ── Firmă: [Toate ▼] │ Framework: [Toate ▼]

┌──────────┬───────────────────────────────┬──────────────┬───────────┬──────────┬──────────┐
│ Impact   │ Task                          │ Firmă        │ Framework │ Deadline │ Status   │
├──────────┼───────────────────────────────┼──────────────┼───────────┼──────────┼──────────┤
│ +8 pct   │ Adaugă DPA cu AWS Romania     │ LogiTrans    │ GDPR      │ DEPĂȘIT  │ De făcut │
│ +8 pct   │ Adaugă DPA cu AWS Romania     │ TechDev      │ GDPR      │ DEPĂȘIT  │ De făcut │
│ +7 pct   │ Declară Midjourney inventar   │ Firma ABC    │ AI Act    │ 25 Mar   │ Candidat │
│ +5 pct   │ Completează assessment NIS2   │ MedPlus      │ NIS2      │ 28 Mar   │ De făcut │
│ +3 pct   │ Actualizează registru Art.30  │ TechDev      │ GDPR      │ 30 Mar   │ De făcut │
└──────────┴───────────────────────────────┴──────────────┴───────────┴──────────┴──────────┘
```

Click pe task → inline resolution (dacă e simplu) sau navighare la firma respectivă (dacă e complex).

## 4.4 Furnizori agregat

Un furnizor apare O SINGURĂ DATĂ cu firmele afectate:

```
FURNIZORI — 47 furnizori unici │ 8 cu probleme │ 3 fără DPA

[Filtre]
  Toți │ Problematici │ Fără DPA │ Review depășit

┌──────────────────┬──────┬──────────────────────┬────────────┬────────────┐
│ Furnizor         │ Risc │ Clienți afectați     │ DPA Status │ Acțiune    │
├──────────────────┼──────┼──────────────────────┼────────────┼────────────┤
│ AWS Romania SRL  │ 8.2  │ LogiTrans, TechDev,  │ Expirat    │ Revizuiește│
│                  │      │ +3 firme             │ la 2 firme │            │
│ Salesforce EMEA  │ 7.4  │ Firma ABC, MedPlus   │ Lipsă la 1 │ Revizuiește│
│ Google Cloud     │ 4.2  │ 8 firme              │ Valid      │ —          │
└──────────────────┴──────┴──────────────────────┴────────────┴────────────┘
```

Click pe furnizor → detaliu cu status DPA per firmă, pipeline review, scoring risc.

## 4.5 Rapoarte portofoliu

```
RAPOARTE PORTOFOLIU

┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│ 📊 Raport Portofoliu Lunar       │  │ 📦 Audit Pack Selectiv           │
│ PDF cu scor + trend per firmă    │  │ Alege firmele → generează pack   │
│                                  │  │ pentru fiecare                   │
│         [Generează]              │  │         [Selectează firme]       │
└──────────────────────────────────┘  └──────────────────────────────────┘

┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│ 📧 Digest Clienți               │  │ 🔗 Partajare Auditor             │
│ Trimite fiecărui client raportul │  │ Link securizat 72h per firmă    │
│ lui de status, automat           │  │ sau agregat                      │
│         [Configurează]           │  │         [Generează link]         │
└──────────────────────────────────┘  └──────────────────────────────────┘

RAPOARTE GENERATE RECENT
┌───────────────────────────────┬──────────┬────────┬──────────┐
│ Raport                        │ Firmă    │ Data   │ Acțiune  │
├───────────────────────────────┼──────────┼────────┼──────────┤
│ Audit Pack Q1 2026            │ TechDev  │ 19 Mar │ Descarcă │
│ Raport Portofoliu Martie      │ Toate    │ 15 Mar │ Descarcă │
└───────────────────────────────┴──────────┴────────┴──────────┘
```

---

# PARTEA 5 — PAGINI PER FIRMĂ

Aceste pagini sunt identice pentru toate modurile (Partner per-firmă, Compliance, Solo simplificat).
Diferența e doar ce sub-pagini sunt vizibile (pe baza applicability).

## 5.1 Acasă

### Scop: Starea firmei + ce trebuie făcut ACUM

Layout:

```
┌─────────────── ACASĂ: Firma SRL ───────────────────────────────────────────┐
│                                                                            │
│  ┌─────────────────────┐  ┌────────────────────────────────────────────┐   │
│  │  SCOR CONFORMITATE  │  │  PASUL RECOMANDAT ACUM                    │   │
│  │                     │  │                                            │   │
│  │        67           │  │  ⚡ Adaugă DPA pentru Furnizor IT SRL      │   │
│  │       /100          │  │  3 finding-uri critice blocate.            │   │
│  │                     │  │  Rezolvarea crește scorul cu ~8 puncte.    │   │
│  │  față de ieri: +3   │  │                                            │   │
│  │  64 → 67            │  │                    [Rezolvă →]             │   │
│  │                     │  └────────────────────────────────────────────┘   │
│  │  GDPR        71 ██  │                                                   │
│  │  NIS2        42 ██  │  ┌────────────────────────────────────────────┐   │
│  │  AI Act      55 ██  │  │  HEALTH CHECK                     Atenție │   │
│  │  e-Factura   88 ██  │  │                                            │   │
│  │                     │  │  🟢 Scanare activă      Ultima: acum 2h    │   │
│  │  Top 22% sector IT  │  │  🟠 DPA furnizori       2 fără DPA        │   │
│  │  23 zile streak     │  │  🟢 Politici interne    3 documente       │   │
│  └─────────────────────┘  │  🔴 NIS2 Assessment     Scor 42% < 60%   │   │
│                           │  🟠 Inventar AI         1 nedeclarat      │   │
│                           └────────────────────────────────────────────┘   │
│                                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│  │ 12       │ │  7       │ │  4       │ │  5       │                      │
│  │ Findings │ │ Task-uri │ │ Sisteme  │ │ Furnizori│                      │
│  │ active   │ │ remediere│ │ AI       │ │ revizuiți│                      │
│  │ +3 azi   │ │ 2 gata   │ │ 1 nedecl.│ │ 5 așteaptă│                     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                      │
└────────────────────────────────────────────────────────────────────────────┘
```

Reguli:
- Scor stânga, acțiune dreapta
- Un singur „Pasul recomandat" — cel cu cel mai mare impact pe scor
- Health Check: doar status dots, nu blocuri mari
- Metric cards jos: clickabile, duc la pagina respectivă
- Onboarding/intake NU stă aici — e flow separat

### Varianta Solo simplificată:

Identică dar fără NIS2 și AI Act dacă nu sunt în applicability.
Metric cards arată doar ce e relevant (ex: fără „Sisteme AI" dacă nu are).

## 5.2 Scanează

### Scop: Analizează documente și gestionează istoricul

Două tabs: `Scanare nouă` | `Documente`

**Tab Scanare nouă:**

```
┌─────────────── SCANEAZĂ ──────────────────────────────────┐
│                                                           │
│  Ce vrei să analizezi?                                    │
│                                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │ 📄      │  │ 🔗      │  │ 📋      │  │ 📁      │     │
│  │Document │  │  URL    │  │Manifest │  │ YAML   │     │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │
│                                                           │
│  ┌───────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │     Trage fișierul aici sau click pentru upload    │   │
│  │     PDF, DOCX, XLSX, TXT — max 25 MB              │   │
│  │                                                   │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│                    [Analizează →]                          │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

După analiză → redirect automat la `/scaneaza/rezultate/[scanId]`

**Tab Documente:**

Tabel cu toate documentele scanate:

```
┌────────────────────┬────────┬─────────┬───────────┬──────────┬───────────┬──────────┐
│ Document           │ Pagini │ Mărime  │ Încărcat  │ Framework│ Status    │ Findings │
├────────────────────┼────────┼─────────┼───────────┼──────────┼───────────┼──────────┤
│ Contract_AWS.pdf   │ 14p    │ 2.1 MB  │ azi 10:23 │ GDPR     │ Scanat    │ 3        │
│ Politica_conf...   │ 8p     │ 340 KB  │ ieri      │ GDPR     │ Scanat    │ 1        │
└────────────────────┴────────┴─────────┴───────────┴──────────┴───────────┴──────────┘

Filtre: [Toate] [GDPR] [NIS2] [AI Act]
```

### Rezultate scan (`/scaneaza/rezultate/[scanId]`):

```
┌────────── REZULTATE ──────────────────────────────────────────────────────┐
│                                                                          │
│  6 finding-uri — Contract furnizor hosting.pdf                           │
│  [1 critic] [2 ridicate] [4 necesită revizuire umană]                   │
│                                                                          │
│  ┌─ FINDING ─────────────────────────────────────────────────┐  SUMAR   │
│  │ [CRITIC] Lipsă clauze GDPR în contract   94% │ GDPR      │  SCANARE │
│  │                                                           │          │
│  │  LANȚ PROVENIENȚĂ                                         │  Doc:    │
│  │  Sursă: gemini-semantic  Conf: 94%  Art: 28 GDPR         │  14 pag  │
│  │                                                           │  1.8s    │
│  │  1. Problemă: Contractul nu conține clauze obligatorii... │          │
│  │  2. Impact: Amendă potențială 2% din cifra de afaceri     │  ENGINE  │
│  │  3. Acțiune: Adaugă addendum DPA cu clauze SCCs           │  gemini  │
│  │                                                           │          │
│  │           [Deschide finding complet →]                     │          │
│  └───────────────────────────────────────────────────────────┘          │
│                                                                          │
│  ┌─ FINDING ─────────────────────────────────────────────────┐          │
│  │ [RIDICAT] Perioada de retenție nespecificată  76% │ GDPR  │          │
│  │                                                    ...    │          │
└──────────────────────────────────────────────────────────────────────────┘
```

## 5.3 Monitorizare > Conformitate

### Scop: Toate finding-urile organizate pe framework

```
┌─────────────── CONFORMITATE ──────────────────────────────────────────────┐
│                                                                          │
│  Tabs: [GDPR (12)] [NIS2 (8)] [AI Act (4)] [e-Factura (2)]             │
│                                                                          │
│  ┌────────┬────────────────────────────────────────┬──────┬──────────┐   │
│  │ Sev.   │ Finding                                │ Conf.│ Status   │   │
│  ├────────┼────────────────────────────────────────┼──────┼──────────┤   │
│  │ CRITIC │ Lipsă DPA cu furnizor principal        │ 94%  │ Deschis  │   │
│  │ RIDICAT│ Registru Art.30 incomplet              │ 88%  │ Deschis  │   │
│  │ RIDICAT│ Perioada retenție nespecificată         │ 76%  │ Revizuire│   │
│  │ MEDIU  │ Formular consimțământ incomplet        │ 82%  │ Deschis  │   │
│  └────────┴────────────────────────────────────────┴──────┴──────────┘   │
│                                                                          │
│  Click pe rând → expandare inline cu:                                    │
│  - Lanț proveniență (sursă, confidence, articol legal)                   │
│  - Problemă / Impact / Acțiune recomandată                               │
│  - CTA: [Rezolvă] [Marchează ca fals pozitiv] [Atribuie]               │
└──────────────────────────────────────────────────────────────────────────┘
```

Tab-urile apar doar dacă applicability-ul include acel framework.

## 5.4 Monitorizare > Furnizori

### Scop: Vendor review + pipeline DPA

Layout master-detail (identic cu mockup-ul Replit ecranul 6):
- Stânga: listă furnizori cu scor risc + status badges
- Dreapta: detaliu furnizor selectat

Detaliu furnizor conține:
- Pipeline review (Detectat → Necesită context → Review generat → Revizuire umană → Dovadă → Închis)
- Scoring risc (tip date, volum, locație procesare, măsuri tehnice, istoric incidente, certificări)
- CTA: [Încarcă DPA] [Generează review]

## 5.5 Monitorizare > Sisteme AI

### Scop: Inventar AI Act + discovery + clasificare

Apare doar dacă: `applicability.aiAct === true`

Layout (identic cu mockup-ul Replit ecranul 5):
- Banner AI Discovery: sisteme detectate automat (din email scan, repo sync, etc.)
- Tabel inventar: sistem, vendor, scop utilizare, clasificare risc, utilizatori, status, Annex IV
- CTA: [+ Adaugă sistem AI]

## 5.6 Monitorizare > NIS2

### Scop: Assessment maturitate + incidente + guvernanță

Apare doar dacă: `applicability.nis2 === true`

Layout (identic cu mockup-ul Replit ecranul 4):
- Header: Scor NIS2 (cerc) + [Raport DNSC]
- Tabs: Assessment (N) | Incidente (N) | Maturitate
- Assessment: chestionar Da/Parțial/Nu/N/A cu progress bar + gaps critice sidebar
- Incidente: listă cu SLA DNSC (24h/72h), timeline, status
- Maturitate: scor pe 5 domenii, trend, comparație sector

## 5.7 Monitorizare > Alerte

### Scop: Drift + notificări active

Layout (identic cu mockup-ul Replit ecranul 11):
- Tabs: Alerte (N) | Reguli monitorizare
- Alerte: listă cu severity badge, framework, timestamp, CTA Recunoaște/Rezolvă
- Reguli: configurare ce declanșează alerte (DPA expiry, score drop, policy change, etc.)

## 5.8 Acțiuni > Remediere

### Scop: Task queue + resolution inline

Layout (identic cu mockup-ul Replit ecranul 8):

```
┌─────────────── REMEDIERE ─────────────────────────────────────────────────┐
│                                                                          │
│  Progres remediere: ████████░░ 1/6     +7 puncte potențiale             │
│  Candidat: 1 │ De făcut: 4 │ Depășite: 1 │ Complete: 1                  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ 🤖 1 task generat automat — necesită confirmare                  │    │
│  │                                                                  │    │
│  │ ❓ Declară Midjourney în inventar AI Act          [CANDIDAT]     │    │
│  │    confidence 94%  │  AI Act  │  15min  │  +5 pct               │    │
│  │                              [Respinge] [✨ Confirmă task]       │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ Adaugă DPA cu AWS Romania SRL            [CRITIC] GDPR          │    │
│  │ Sursă: auto-generated │ Confidence: 94%                         │    │
│  │                                                                  │    │
│  │ Pași de remediere:                                               │    │
│  │  1. Solicită draft DPA de la AWS Romania                         │    │
│  │  2. Revizuiește cu consilier juridic                             │    │
│  │  3. Semnează și arhivează documentul                             │    │
│  │  4. Încarcă dovada în sistem                                     │    │
│  │                                                                  │    │
│  │          [✓ Marchează complet]  [📎 Încarcă dovadă]             │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

Fiecare task arată: sursă (auto/manual), finding legat, confidence, framework, timp estimat, impact pe scor, pași de remediere, CTA-uri.

## 5.9 Acțiuni > Politici

### Scop: Generator documente conformitate

Layout (identic cu mockup-ul Replit ecranul 14):
- Grid șabloane disponibile, filtrate pe applicability:
  - GDPR: Registru Activități Prelucrare, DPA, Notă Informare, Politică GDPR
  - NIS2: Politică Securitate, Plan Răspuns Incidente
  - AI Act: Documentație Annex IV
- Selectezi → configurezi (prefill din org profile) → generezi
- Generate recente: listă cu download/edit

## 5.10 Acțiuni > Vault

### Scop: Dosare sigilate pentru audit

Layout (identic cu mockup-ul Replit ecranul 12):
- Banner: „Dosarele sunt semnate digital cu SHA-256, imuabile, acces auditor 30 zile"
- Tabs: Dosare sigilate | Dovezi
- Dosare: cards cu conținut, hash, dată sigilare, expirare
- CTA per dosar: [Descarcă] [Partajează]
- CTA global: [+ Dosar nou]

## 5.11 Rapoarte

### Scop: Export + partajare + log audit

Tabs: Rapoarte | Log audit

**Tab Rapoarte:**

```
┌──────────────────────────┐  ┌──────────────────────────┐
│ 📊 Inspector Mode        │  │ 📦 Export Audit Pack      │
│ Simulare control extern  │  │ Pachet complet pentru     │
│ Scor + gaps + pregătire  │  │ auditor sau ANSPDCP       │
│        [Simulează]       │  │        [Generează]        │
└──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│ 📄 Raport PDF            │  │ 🔗 Partajare Securizată  │
│ Raport executiv cu scor  │  │ Link 72h pentru contabil  │
│ și finding-uri           │  │ sau consilier juridic     │
│        [Generează]       │  │        [Creează link]     │
└──────────────────────────┘  └──────────────────────────┘
```

**Tab Log audit:**

Tabel complet cu: dată/oră, utilizator, acțiune, severitate, detaliu, IP.
Filtre: Toate | Scan | Login | Export | Setări.
CTA: [Export CSV]

## 5.12 Setări

### Scop: Administrare organizație

Tabs verticale:
- **Profil utilizator** — nume, email, parolă
- **Organizație** — denumire, CUI, CAEN, adresă, contact DPO, angajați
- **Membri** — tabel cu membri + roluri (owner/compliance/reviewer/viewer) + [Invită]
- **Notificări** — ce alerte primesc și pe ce canal
- **Securitate** — 2FA, sesiuni active
- **Integrări** — ANAF/e-Factura, GitHub/GitLab repo sync, Supabase status
- **Automatizare** — configurare agenți (mutat din /agents)
- **Plan & Facturare** — plan activ, upgrade, portal Stripe

Mod Solo vede doar: Organizație, Membri, Notificări, Plan & Facturare.

---

# PARTEA 6 — FLUXURI COMPLETE

## 6.1 Elena (consultant, 35 clienți) — Zi normală

```
08:00  Login → aterizează pe Portofoliu > Prezentare generală
08:02  Sortează pe urgență → LogiTrans SRL are scor 38, 5 critice
08:03  Click LogiTrans → intră pe Acasă per firmă
08:04  Vede „Pasul recomandat: Adaugă DPA cu AWS" → click Rezolvă
08:05  Ajunge pe Remediere → deschide task-ul → generează DPA draft
08:15  Încarcă DPA semnat → marchează task complet → scor crește
08:16  Revine la Portofoliu (click în sidebar sus)
08:17  MedPlus SRL — 3 critice → click → Monitorizare > NIS2
08:18  Vede incident neraportat > 24h → completează raportul DNSC
08:30  Revine la Portofoliu → Firma ABC: 1 finding
08:31  Click → Monitorizare > Conformitate > AI Act tab
08:32  Finding: Midjourney nedeclarat → click Rezolvă → Remediere
08:33  Confirmă task auto-generat → adaugă Midjourney în inventar
08:40  Portofoliu > Rapoarte > Export Portofoliu Lunar → PDF descărcat
08:45  Gata. 45 minute, 3 clienți rezolvați, un raport generat.
```

## 6.2 Andrei (CTO, 22 angajați) — Client german cere conformitate

```
09:00  Login → Dashboard (mod Compliance)
09:01  Upload chestionar client german (47 întrebări PDF) → Scanează
09:03  Rezultate: 12 finding-uri mapate la NIS2 + GDPR
09:04  Monitorizare > Conformitate → tabs GDPR (7) + NIS2 (5)
09:10  Lucrează prin findings GDPR, rezolvă 3 inline
09:20  Monitorizare > NIS2 → completează assessment (3/8 făcute)
09:40  Monitorizare > Sisteme AI → declară Copilot, ChatGPT, Cursor
09:50  Monitorizare > Furnizori → verifică AWS, Google, GitHub
10:00  Rapoarte > Export Audit Pack → trimite clientului german
```

## 6.3 Cristian (CEO agenție web, 3 angajați) — DPA urgent

```
14:00  Login → Dashboard (mod Solo, simplificat)
14:01  Vede „Pasul recomandat: Generează DPA pentru Furnizor IT SRL"
14:02  Click Rezolvă → ajunge pe De rezolvat (simplificat)
14:03  Task: Generează DPA → click → Documente > Politici
14:04  Selectează șablon DPA → prefill cu date furnizor → generează
14:06  Descarcă DPA → îl trimite clientului pe email
14:07  Revine pe De rezolvat → marchează complet
14:08  Gata. 8 minute.
```

## 6.4 Dr. Ioana (stomatolog) — Pregătire audit ANSPDCP

```
10:00  Login → Dashboard (mod Solo)
10:01  Vede scor 54 → Health Check: 🔴 Lipsă DPIA, 🟠 Registru incomplet
10:02  Click „Rezolvă" pe Pasul recomandat
10:03  De rezolvat → task: Completează DPIA pentru date medicale
10:05  Generează DPIA din șablon → completează → salvează
10:15  De rezolvat → task: Actualizează Registru Art.30
10:17  Registrul se auto-completează din datele existente → confirmă
10:20  Rapoarte → Inspector Mode → „Pregătit cu observații"
10:22  Export Audit Pack → PDF cu tot dosarul → descarcă
10:25  Gata. 25 minute, pregătită pentru control.
```

## 6.5 Auditor extern — Verificare dosar

```
Primește email cu link securizat de la Elena (consultant)
Click link → pagina Trust Center / Dosar partajat
Vede: dosar sigilat, hash SHA-256, conținut, data sigilării
Descarcă ZIP cu toate documentele
Verifică hash-ul → match
Închide pagina. Nu are nevoie de cont.
```

---

# PARTEA 7 — EDGE CASES

## 7.1 Consultant care își gestionează și propria firmă

Elena are și cabinet contabil propriu (SRL-ul ei) pe lângă cei 35 de clienți.
Firma ei apare în lista de clienți din Portofoliu, la fel ca oricare alt client.
Nu există tratament special — propria firmă e un client ca oricare altul.

## 7.2 User care schimbă modul

Cristian (CEO solo) angajează un compliance officer și devine firmă medie.
Din Setări > Plan & Facturare poate face upgrade la Pro.
La upgrade, `userMode` se poate schimba manual din Setări > Profil.
Sidebar-ul se reconfigurează automat.

## 7.3 Consultant care pierde toți clienții

Radu pierde ultimul client. `memberships.length === 0` (doar contul lui).
Portofoliu arată empty state: „Adaugă primul client" CTA.
Sidebar-ul per-firmă nu apare (nu are firmă selectată).

## 7.4 Firmă fără niciun framework relevant

Imposibil în practică — toate firmele românești au GDPR + e-Factura obligatoriu.
Dar dacă applicability-ul e complet gol (bug):
- Monitorizare arată doar „Conformitate" cu tab GDPR
- Nu apar sub-pagini NIS2, Sisteme AI

## 7.5 Viewer care primește task

Maria (viewer la Firma SRL) primește task „Încarcă contract semnat cu AWS".
Intră pe „Task-urile mele" → vede task-ul → încarcă documentul → gata.
Nu vede nimic altceva din aplicație.

## 7.6 Trial expirat

Userul vede banner persistent: „Trial-ul a expirat. Upgrade pentru a continua."
Poate vedea dashboard-ul read-only. Nu poate scana, genera, exporta.
CTA: [Upgrade] → portal Stripe.

## 7.7 Client adăugat de consultant dar clientul vrea și el acces

Elena adaugă „LogiTrans SRL" ca client.
Bogdan (CEO LogiTrans) vrea și el cont propriu pe CompliScan.
Elena îl invită ca „owner" pe organizația LogiTrans.
Bogdan se loghează → vede LogiTrans în mod Firmă Singură.
Elena continuă să vadă LogiTrans în Portofoliu.
Ambii lucrează pe aceleași date, aceeași organizație.

## 7.8 Furnizor comun la mai mulți clienți — rezolvare batch

Elena vede în Portofoliu > Furnizori: AWS Romania SRL apare cu DPA expirat la 5 firme.
Click pe AWS → vede lista celor 5 firme → generează DPA template o singură dată.
Apoi per firmă: personalizează, semnează, uploadează.
NU trebuie să intre în fiecare firmă separat ca să descopere problema.

## 7.9 Incident NIS2 la un client al consultantului

Radu primește alertă: „MedPlus SRL — incident securitate neraportat > 24h".
Din Portofoliu > Alerte → click Rezolvă → navighează la MedPlus > Monitorizare > NIS2 > Incidente.
Completează raportul DNSC (formular pre-completat) → trimite.
Revine la Portofoliu.

## 7.10 Scanare batch pentru consultant

Elena vrea să scaneze contracte pentru 8 clienți.
Din Portofoliu NU există batch scan (prea complex, error-prone).
Flow: selectează clientul → Scanează → upload → next client.
Dar Portofoliu > Prezentare generală arată „Fără scanare recentă" → Elena știe la cine trebuie.

---

# PARTEA 8 — RUTE CANONICE

## Publice

```
/                               Landing page
/login                          Login / Register
/pricing                        Prețuri
/privacy                        Privacy Policy
/terms                          Terms of Service
/dpa                            DPA
/reset-password                 Reset parolă
/trust/[orgId]                  Trust Center public
/demo/[scenario]                Demo loader
```

## Portofoliu (userMode === 'partner')

```
/portfolio                      Prezentare generală
/portfolio/alerte               Alerte cross-firmă
/portfolio/remediere            Task-uri cross-firmă
/portfolio/furnizori            Furnizori agregat
/portfolio/rapoarte             Rapoarte batch
```

## Per firmă (toate modurile)

```
/dashboard                      Acasă
/dashboard/scaneaza             Scanare nouă + Documente
/dashboard/scaneaza/rezultate/[scanId]   Rezultate scan
/dashboard/monitorizare/conformitate     Findings per framework
/dashboard/monitorizare/furnizori        Vendor review
/dashboard/monitorizare/sisteme-ai       Inventar AI (dacă applicability)
/dashboard/monitorizare/nis2             NIS2 complet (dacă applicability)
/dashboard/monitorizare/alerte           Drift & alerte
/dashboard/actiuni/remediere             Task queue + resolution
/dashboard/actiuni/remediere/[findingId] Detaliu finding/task
/dashboard/actiuni/politici              Generator documente
/dashboard/actiuni/vault                 Dosare sigilate
/dashboard/rapoarte                      Rapoarte + Log audit
/dashboard/setari                        Setări org
```

## Mod Solo (simplificat — rutele vizibile)

```
/dashboard                      Acasă simplificat
/dashboard/scaneaza             Scanare
/dashboard/de-rezolvat          Findings + Tasks (view unificat)
/dashboard/documente            Politici + Documente scanate
/dashboard/rapoarte             Export simplificat
/dashboard/setari               Setări
```

## Redirecturi legacy

```
/dashboard/scan                 → /dashboard/scaneaza
/dashboard/resolve              → /dashboard/actiuni/remediere
/dashboard/resolve/[id]         → /dashboard/actiuni/remediere/[id]
/dashboard/reports              → /dashboard/rapoarte
/dashboard/reports/vault        → /dashboard/actiuni/vault
/dashboard/reports/audit-log    → /dashboard/rapoarte?tab=log
/dashboard/reports/policies     → /dashboard/actiuni/politici
/dashboard/reports/trust-center → /trust/[orgId]
/dashboard/settings             → /dashboard/setari
/dashboard/sisteme              → /dashboard/monitorizare/sisteme-ai
/dashboard/alerte               → /dashboard/monitorizare/alerte
/dashboard/nis2                 → /dashboard/monitorizare/nis2
/dashboard/vendor-review        → /dashboard/monitorizare/furnizori
/dashboard/fiscal               → /dashboard/monitorizare/conformitate?tab=efactura
/dashboard/agents               → /dashboard/setari?tab=automatizare
/dashboard/generator            → /dashboard/actiuni/politici
/dashboard/conformitate         → /dashboard/monitorizare/conformitate
/dashboard/findings/[id]        → /dashboard/actiuni/remediere/[id]
/dashboard/partner              → /portfolio
/dashboard/scanari              → /dashboard/scaneaza
/dashboard/documente            → /dashboard/documente
/dashboard/politici             → /dashboard/actiuni/politici
/dashboard/audit-log            → /dashboard/rapoarte?tab=log
/dashboard/checklists           → /dashboard/actiuni/remediere
/dashboard/rapoarte/*           → /dashboard/rapoarte
/dashboard/setari/*             → /dashboard/setari
```

---

# PARTEA 9 — REGULI DE COMPOZIȚIE

Aceste reguli se aplică pe FIECARE pagină, fără excepție:

1. **O pagină = o intenție dominantă.** Dacă o pagină face două lucruri, e greșită.

2. **Un CTA principal per pagină.** Verde, vizibil, deasupra fold-ului. Tot restul e secundar.

3. **Informația suport stă lateral sau sub fold.** Nu concurează cu acțiunea principală.

4. **Master-detail unde se aplică.** Furnizori, findings, alerte: listă stânga, detaliu dreapta.

5. **Tabelele au filtre, nu sub-meniuri.** Framework-urile sunt tabs/filtre, nu pagini separate de conformitate.

6. **Badge-urile comunică urgența, nu textul.** Roșu = acționează acum. Verde = ok. Fără paragraf explicativ.

7. **Fiecare componentă trebuie să funcționeze standalone și ca rând într-o vedere agregată.** Un finding row funcționează identic în Conformitate per firmă și în Alerte cross-firmă.

8. **Navigarea se adaptează la context.** userMode + applicability + RBAC = ce vezi. Nu există nav universal.

9. **Onboarding-ul nu stă pe dashboard.** Este flow separat. Dashboard-ul e pentru utilizatori activi, nu pentru useri noi.

10. **Zero text explicativ fără acțiune.** Dacă un bloc de text nu duce la un buton, nu are ce căuta pe pagină.

---

# PARTEA 10 — DESIGN SYSTEM

## 10.1 Ce se folosește

**Evidence OS v1** — neschimbat.

- Dark mode, blue-tinted grays
- Tokeni `--eos-*`
- Accent primar: blue-purple
- Fonturi: Inter (UI), Manrope (display), JetBrains Mono (code)
- Componente: `components/evidence-os/*`
- Stil: `app/evidence-os.css` + `app/globals.css`

## 10.2 Ce NU se folosește

- Wave 0 / DS v2 — nu
- Warm graphite palette — nu
- Emerald accent — nu
- Tokeni fără prefix — nu

## 10.3 Ce se repară

Bug existent: `--emerald-500` pointează la blue-purple, nu la emerald.
Fix: redenumim tokenul corect sau îl eliminăm. Nu schimbăm culoarea.

---

# PARTEA 11 — CE NU FACE APLICAȚIA

Acestea sunt limitele produsului. Nu se implementează:

1. **Chat / mesagerie între consultant și client.** CompliScan nu e tool de comunicare.
2. **Facturare / contabilitate.** CompliScan nu e ERP.
3. **CRM.** Portofoliul este pe conformitate, nu pe relația comercială.
4. **Semnătură electronică.** Documentele se generează, se descarcă, se semnează extern.
5. **Training / e-learning.** Nu construim platformă de cursuri.
6. **Backup / disaster recovery.** Nu suntem furnizor de infrastructură.
7. **Integrare cu OneTrust / ServiceNow.** Nu acum. Poate 2028.

---

# PARTEA 12 — VERIFICARE FINALĂ

Acest document acoperă:

- [x] Toate personas reale din piața românească
- [x] Prioritizarea pe valoare de business (consultant > DPO > CEO > viewer > auditor)
- [x] Onboarding diferențiat pe o singură întrebare
- [x] Navigare adaptivă pe 4 moduri (partner, compliance, solo, viewer)
- [x] Portfolio layer complet pentru consultant cu N firme
- [x] Pagini per firmă cu compoziție curată (un scop, un CTA)
- [x] Fiecare pagină definită cu layout, conținut, CTA-uri
- [x] Fluxuri complete per persona (zi normală, scenariu specific)
- [x] 10 edge cases documentate
- [x] Rute canonice + redirecturi legacy complete
- [x] 10 reguli de compoziție
- [x] Design system confirmat (EOS v1)
- [x] Limite explicite (ce NU face aplicația)
- [x] Applicability filtering (nav se adaptează la framework-uri relevante)

Ce NU acoperă (deliberat):
- Implementare tehnică (nu e scope-ul documentului)
- Timeline / estimări (document separat)
- Pricing detaliat (document separat)
- API contracts (documentate în auditul tehnic)
