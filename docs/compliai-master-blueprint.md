# CompliAI — Master Product Blueprint
**Versiune:** 1.0 · **Data:** 2026-03-27 · **Status:** Document viu — actualizat la fiecare sprint major

> Acest document este harta completă a produsului. Răspunde la: cine sunt utilizatorii, ce vor, ce fac, pe unde merg, ce văd, ce decid, ce clickuri fac, ce primesc — de la primul contact cu produsul până la monitorizare activă. Orice decizie de UI, UX, IA sau copy trebuie verificată față de acest document.

---

## CUPRINS

1. [Contextul produsului](#1-contextul-produsului)
2. [Personas](#2-personas)
3. [Journey Maps — Awareness → Monitorizare](#3-journey-maps)
4. [User Stories complete](#4-user-stories)
5. [User Flows detaliate — click cu click](#5-user-flows)
6. [Information Architecture](#6-information-architecture)
7. [UX Principles & Patterns](#7-ux-principles)
8. [UI Language](#8-ui-language)
9. [Copy & Microcopy Principles](#9-copy--microcopy)
10. [Decision Matrix — ce afișezi cui, când, unde](#10-decision-matrix)

---

## 1. CONTEXTUL PRODUSULUI

### Ce este CompliAI

CompliAI (CompliScan) este un **compliance dashboard operațional** pentru IMM-uri românești și consultanții care le servesc. Nu este un instrument de consultanță juridică și nu generează opinii legale. Este un instrument care transformă obligațiile legale abstracte în sarcini concrete, dovezi tracabile și monitorizare continuă.

### Reglementările acoperite

| Reglementare | Descriere | Status |
|---|---|---|
| GDPR | Protecția datelor personale | Complet |
| EU AI Act | Sisteme AI cu risc | Complet |
| NIS2 | Securitate cibernetică | Complet |
| e-Factura / SPV | Facturare electronică ANAF | Complet |
| DORA | Reziliență operațională digitală (sectoare financiare) | Parțial |
| EU 2019/1937 | Whistleblowing / Canal sesizări | Parțial |

### Principiul de fier

> **Un finding = un cockpit = un singur loc de execuție**

Niciun finding nu poate fi rezolvat prin redirect arbitrar în altă pagină. Tot ce ține de un caz — confirmare, generare document, validare dovadă, închidere, monitorizare — se întâmplă în cockpitul acelui finding. Dosarul primește rezultatul, nu procesul.

### Traseul principal al produsului

```
Reclamă/recomandare
       ↓
  Landing Page
       ↓
 Înregistrare / Login
       ↓
  Onboarding wizard
  (Rol → CUI → ANAF → Website → Sector → Mărime → Legi aplicabile)
       ↓
  Primul Snapshot
  (ce reguli se aplică, ce am găsit, unde sunt golurile)
       ↓
  De rezolvat (finding queue)
       ↓
  Cockpit per finding
  (confirmare → acțiune → dovadă → validare → închidere)
       ↓
  Dosar
  (finding rezolvat + dovadă + document + urmă de audit)
       ↓
  Monitorizare continuă
  (drift, review dates, schimbări care redeschid cazul)
```

---

## 2. PERSONAS

### PERSONA A — Mihai, Proprietar IMM (Modul: Solo)

**Profil demografic**
- Vârstă: 38–52 ani
- Rol: Administrator SRL / SA, 5–50 angajați
- Sector: Comerț, servicii, producție mică
- Background tehnic: scăzut-mediu
- Background juridic: minimal (știe că există GDPR, nu știe ce înseamnă)

**Context emoțional**
- Anxios în legătură cu amenzile — a auzit că GDPR și NIS2 amendează
- Simte că „nu are timp de astea" — compliance e distragere de la business
- Nu are buget pentru avocat dedicat sau consultant permanent
- Crede că produsele de compliance sunt „pentru corporații"
- Dacă vede ceva complicat, închide tab-ul în 15 secunde

**Ce vrea Mihai (în ordinea priorității)**
1. Să știe dacă e în regulă sau nu — un răspuns clar, fără nuanțe legale
2. Să rezolve ce lipsește fără să citească lege
3. Să aibă „ceva de arătat" la control sau audit
4. Să nu mai stea cu anxietatea nerezolvată
5. Să înțeleagă ce se aplică firmei lui specific — nu generic

**Frustrările lui Mihai**
- Primește newsletter-uri cu „NIS2 e activ!" fără să înțeleagă ce înseamnă pentru el
- A fost sfătuit de contabil să facă „ceva cu GDPR" — nu știe ce
- A încercat să citească regulamentul — a renunțat la pagina 2
- Nu știe dacă site-ul lui e conform
- Nu are timp să urmărească schimbări legislative

**Dispozitivul primar:** Laptop (desktop la birou) + telefon în deplasare
**Momentul de utilizare:** Dimineața devreme, în pauze, seara târziu
**Metric de succes pentru Mihai:** „Am rezolvat toate finding-urile roșii și am dosarul pregătit"

---

### PERSONA B — Diana, Consultant / Contabil / Auditor (Modul: Partner)

**Profil demografic**
- Vârstă: 30–45 ani
- Rol: Contabil autorizat, auditor, consultant fiscal/juridic
- Portofoliu: 10–50 clienți activi
- Background tehnic: mediu
- Background juridic: bun (știe legislație fiscală, mai puțin GDPR/NIS2/AI Act)

**Context emoțional**
- Time is money — orice ineficiență o costă direct
- Responsabilitate mare față de clienți — o greșeală = risc reputațional
- Supraîncărcată — gestionează simultan mai multe urgențe
- Frustrantă că clienții nu înțeleg urgența compliance-ului
- Vrea să ofere un serviciu superior față de competitori

**Ce vrea Diana (în ordinea priorității)**
1. Vizibilitate agregată pe toți clienții — cine e în risc acum
2. Rapoarte profesionale livrabile direct clientului
3. Dovezi și audit trail pentru fiecare acțiune
4. Eficiență: să rezolve cazuri pentru mai mulți clienți rapid
5. Diferențiere față de alți contabili/consultanți

**Frustrările ei Diana**
- Fiecare client are fișiere separate, fără istoric unificat
- Nu poate vedea dintr-o privire „care client e cel mai expus"
- Rapoartele pe care le livrează arată amateur (Excel/Word)
- Clienții o sună când văd știri despre amenzi — nu știe să răspundă concret
- Nu are un tool care să facă automat ce face ea manual

**Dispozitivul primar:** Laptop (dual monitor la birou)
**Momentul de utilizare:** Dimineața (triage portofoliu), după-amiaza (lucru per client)
**Metric de succes pentru Diana:** „Toți clienții mei sunt la verde și am rapoarte gata"

---

### PERSONA C — Radu, Responsabil Conformitate Intern (Modul: Compliance)

**Profil demografic**
- Vârstă: 28–40 ani
- Rol: DPO, Compliance Officer, CISO, Responsabil juridic intern
- Companie: 50–500 angajați, sector bancar/fintech/health/tech
- Background tehnic: ridicat
- Background juridic: ridicat (expert GDPR, cunoaște NIS2, AI Act)

**Context emoțional**
- Frustrat că nu are tools la nivelul expertizei lui
- Responsabilitate maximă — el semnează documentele legale
- Trebuie să raporteze la board și la management
- Vrea audit trail complet pentru orice decizie de compliance
- Este evaluat după zero incidente și zero amenzi

**Ce vrea Radu (în ordinea priorității)**
1. Audit trail complet — fiecare acțiune, cine, când, ce
2. RBAC — să poată delega și controla accesul
3. Export pentru audit extern și board reporting
4. Automatizare — workflow-uri repetitive fără intervenție manuală
5. Customizare — override-uri și excepții documentate

**Frustrările lui Radu**
- Tool-urile existente nu au granularitate suficientă pentru audit
- Nu poate delega eficient fără să piardă controlul
- Rapoartele pentru board iau jumătate de zi să fie pregătite
- Nu are vizibilitate pe expirarea documentelor și review dates
- Sistemele separate (GDPR tool, NIS2 tool, fiscal tool) nu vorbesc între ele

**Dispozitivul primar:** Desktop profesional, uneori tablet în ședințe
**Momentul de utilizare:** Continuu — e job-ul lui full-time
**Metric de succes pentru Radu:** „Scor complet verificat, zero findings critice neadresate, audit trail gata pentru control"

---

## 3. JOURNEY MAPS

### 3.1 Journey Map — Mihai (Proprietar IMM, Solo)

```
FAZA 1: AWARENESS
─────────────────
Trigger: citește pe Facebook că „ANAF amendează pentru NIS2" sau contabilul îi spune
         „trebuie să faci ceva cu GDPR/NIS2"

Ce simte: anxietate difuză, nu știe ce e concret de făcut
Ce caută: „ce este NIS2 pentru IMM", „GDPR amendă 2025", „cum mă conformez NIS2"

Atinge produsul: reclamă Google/Meta sau recomandare directă
                 → ajunge pe landing page

FAZA 2: CONSIDERAȚIE — Landing Page (/)
────────────────────────────────────────
Citește (în ordine):
  1. Badge: „NIS2 activ · GDPR amendează · AI Act intră în vigoare" → validare anxietate
  2. H1: „Afli ce ți se aplică, rezolvi ce lipsește și rămâi acoperit" → promisiune clară
  3. Subtitlu: traseu complet (CUI → snapshot → cockpit → dovadă → monitorizare)
  4. CTA primar: „Începe gratuit — 2 minute"
  5. Journey steps (4 pași)
  6. Secțiunea „Problema": „Tu nu ai ce arăta la control" → emoție acută

Decizie: merge la înregistrare sau nu
  → Dacă DA: click pe „Începe gratuit" → /login (tab Register pre-selectat)
  → Dacă NU: citește mai mult, revine ulterior, sau caută demo

FAZA 3: ÎNREGISTRARE — /login
──────────────────────────────
Vede: formular simplu (email + parolă), toggle Login/Register
Introduce: email, parolă, confirmă parola
Click: „Creează cont"
Primește: redirect la /onboarding

FAZA 4: ONBOARDING — /onboarding
──────────────────────────────────
Pasul 1 — Rol
  Vede: 3 carduri (Proprietar/Manager, Consultant, Responsabil conformitate)
  Simte: „ăsta e pentru mine" (Proprietar/Manager)
  Click: selectează „Proprietar / Manager"
  Click: „Continuă cu profilul firmei"
  Feedback: toast „Pasul 1 salvat. Continuăm cu profilul firmei."

Pasul 2 — Profil firmă (wizard)
  Sub-pas 2a: introduce CUI
    → Compli verifică la ANAF automat
    → Pre-populează: nume firmă, sector, județ
  Sub-pas 2b: confirmă/corectează sectorul
  Sub-pas 2c: selectează mărimea (1-9, 10-49, 50-249, 250+)
  Sub-pas 2d: introduce URL website
    → Compli scanează site-ul automat (tracking-uri, cookie banner, politică GDPR)

Pasul 3 — Legi aplicabile
  Vede: ce reguli se aplică firmei lui (GDPR: Da, NIS2: Da/Nu, AI Act: Nu, e-Factura: Da)
  Citește: de ce se aplică fiecare (bazat pe sector + mărime + semnale)
  Confirmă: bifează că a înțeles
  Click: „Finalizează"
  → redirect la /dashboard/resolve (DIRECT, fără pagini intermediare)

FAZA 5: PRIMUL SNAPSHOT — /dashboard/resolve
──────────────────────────────────────────────
Prima vizualizare:
  Vede: lista de finding-uri detectate automat (din CUI + ANAF + site scan)
  Tipice pentru Mihai:
    - GDPR-001: Lipsă politică de confidențialitate [critical]
    - GDPR-005: Trackere fără consent [high]
    - NIS2-001: Neînregistrat DNSC [high]
    - EF-001: SPV ANAF neactivat [high]
    - GDPR-016: Lipsă politică de retenție date [medium]

  Primă reacție: „Sunt 5 probleme? Doamne..."
  Compli afișează: „Ai 2 critice. Începem cu ele."

  Badge-uri: 2 critice (roșu), 1 ridicate (portocaliu), 2 medii (galben)

FAZA 6: PRIMUL FINDING REZOLVAT
─────────────────────────────────
Click pe GDPR-001 (lipsă politică de confidențialitate)
→ /dashboard/resolve/gdpr-001-xxxx

  Vede Hero Action: „Generezi politica de confidențialitate și o publici pe site"
  Înțelege imediat ce trebuie să facă

  Click: „Confirmă și generează"
  → Generator Drawer se deschide (slide-in din dreapta)

  Generator Drawer:
    Step 1 — Completezi: verifică datele pre-populate (firma, DPO dacă există, date contact)
    Step 2 — Generezi: click „Generează" → spinner 3-5 secunde → draft apare
    Step 3 — Validezi: Compli rulează validare automată → 5/5 checks verzi
    Step 4 — Confirmi: bifează 2 checkboxuri de confirmare → click „Confirmă și salvează"

  → Drawer se închide
  → Finding devine „under_monitoring"
  → Card success: „[Politica de confidențialitate] a intrat în Dosar"
  → CTA: „Deschide Dosarul"

  Mihai simte: „Am rezolvat ceva concret!"

FAZA 7: UTILIZARE REGULATĂ
────────────────────────────
Reveniri periodice:
  - Primește email cu „Ai 1 finding nou detectat" sau „Review date se apropie"
  - Intră pe /dashboard → vede scorul (ex: 72/100), vede ce mai e de făcut
  - Rezolvă câte 1-2 finding-uri pe sesiune
  - Vede dosarul completându-se

Săptămânal:
  - Verifică /dashboard pentru schimbări
  - Vede „Compli streak: 14 zile consecutive fără finding critice neadresate"

FAZA 8: MONITORIZARE ACTIVĂ
─────────────────────────────
Toată lista de finding-uri e la verde
Dosar: 8 cazuri rezolvate, 4 documente generate, 2 aprobate
Scor: 89/100

Mihai e relaxat:
  - Are „ce arăta" la orice control
  - Monitorizarea rulează automat
  - Primește alerte doar când apare ceva nou
  - Nu mai citește lege — Compli îi spune ce e relevant
```

---

### 3.2 Journey Map — Diana (Consultant/Contabil, Partner)

```
FAZA 1: AWARENESS
─────────────────
Trigger: colegă din cabinet îi recomandă, sau găsește în LinkedIn un articol
         despre „NIS2 pentru clienți IMM"

Ce simte: curiozitate + pragmatism — „poate economisesc timp"
Ce caută: „tool compliance pentru contabili", „gestionez conformitate mai mulți clienți"

FAZA 2: CONSIDERAȚIE — Landing Page (/)
────────────────────────────────────────
Citește diferit față de Mihai:
  1. Secțiunea „Pentru consultant": „păstrezi urme clare pentru handoff și audit"
  2. Journey steps — evaluează dacă workflow-ul are sens pentru ea
  3. Pricing — verifică dacă e rentabil vs. tariful ei orar

Decizie: creează cont pentru a testa

FAZA 3: ÎNREGISTRARE + ONBOARDING
───────────────────────────────────
Pasul 1 — Rol: selectează „Consultant / Contabil / Auditor"
→ Compli activează modul Partner automat

Pasul 2 — Profil propriu (nu al unui client):
  - Introduce CUI-ul cabinetului / PFA-ului ei
  - ANAF verifică
  - Sector: servicii profesionale

Pasul 3 — Diana vede workspace-ul ei (portofoliu gol)
→ redirect la /portfolio (dashboard portofoliu)

FAZA 4: ADAUGĂ PRIMUL CLIENT
──────────────────────────────
Click: „Adaugă client nou"
Introduce: CUI client, email client (opțional)
→ Compli creează workspace separat pentru client
→ Rulează onboarding automat: ANAF, site scan, legi aplicabile
→ Generează findings pentru client

Diana vede portofoliul:
  - Client 1: 5 finding-uri, 2 critice [roșu]
  - (restul vor apărea când adaugă mai mulți)

FAZA 5: GESTIONARE PORTOFOLIU
───────────────────────────────
Zilnic (dimineața):
  Deschide /portfolio
  Vede agregat: X clienți, Y finding-uri critice noi, Z deadline-uri azi
  Triajează: care client are urgență azi

Pentru fiecare client urgent:
  Click pe client → intră în workspace-ul lui → /dashboard (în context client)
  Vede finding-urile lui
  Rezolvă / generează documente / atașează dovezi în numele clientului

Livrat clientului:
  Din /dashboard/dosar → Export → „Trimite raport la client" sau Export PDF

FAZA 6: RAPORTARE PENTRU CLIENȚI
───────────────────────────────────
End of month:
  /portfolio/reports → generează raport lunar per client
  Descarcă PDF personalizat: scor, finding-uri rezolvate, status
  Trimite clientului ca parte din serviciile de contabilitate

FAZA 7: MONITORIZARE PORTOFOLIU
─────────────────────────────────
/portfolio/alerts: vede schimbări detectate automat pe toți clienții
Acționează proactiv: înainte ca clientul să afle de o problemă
Diferențiere față de concurență: „Eu te contactez când apare o problemă, nu tu pe mine"
```

---

### 3.3 Journey Map — Radu (Compliance Officer Intern)

```
FAZA 1: AWARENESS
─────────────────
Trigger: director general cere „un dashboard de compliance" după o amendă sau audit
         sau Radu caută activ un tool superior față de Excel-uri

FAZA 2: EVALUARE (mai riguroasă decât Mihai)
──────────────────────────────────────────────
Radu evaluează:
  - Acoperire reglementare (GDPR + NIS2 + AI Act + e-Factura simultan?)
  - Audit trail granular
  - RBAC (poate adăuga colegi cu drepturi diferite?)
  - Export audit pack
  - Integrare cu sisteme existente

  Merge pe /pricing, citește detalii, poate contactează suport

FAZA 3: ONBOARDING COMPLET
────────────────────────────
Rol: Responsabil conformitate
CUI: al companiei + toate detaliile
Sector: specificat precis (ex: fintech → activează și DORA)
Configurare RBAC: adaugă colegi cu roluri (reviewer, viewer)

FAZA 4: SETUP INIȚIAL COMPLET
───────────────────────────────
Radu parcurge sistematic toate modulele:
  1. Scanează toate documentele companiei (GDPR, contracte, politici existente)
  2. Completează inventarul sisteme AI
  3. Rulează evaluare maturitate NIS2
  4. Configurează monitorizare DSAR
  5. Verifică SPV ANAF + e-Factura
  6. Setează review dates pentru toate documentele

FAZA 5: OPERARE ZILNICĂ
─────────────────────────
Morning triage: /dashboard → vede scorul, schimbările din noapte
Rezolvă finding-urile noi prioritar
Delega finding-uri minore la colegi (reviewer role)
Monitorizează că delegările sunt finalizate

Weekly:
  Generează One-Page Compliance Report pentru management
  Verifică /dashboard/reports/audit-log

Monthly:
  Export Audit Pack complet
  Review documente cu expirare apropiată
  Board report
```

---

## 4. USER STORIES

### 4.1 Core Stories (toate personele)

```
US-001: Ca utilizator nou, vreau să înțeleg în 10 secunde dacă produsul e pentru mine,
        fără să citesc explicații lungi.
        → Satisfăcut de: H1 + subtitlu + journey steps pe landing

US-002: Ca utilizator, vreau să mă înregistrez în maxim 2 minute,
        fără să completez formulare lungi înainte de a vedea valoarea.
        → Satisfăcut de: formular simplu + onboarding imediat după

US-003: Ca utilizator, vreau să știu IMEDIAT ce probleme am, specific firmei mele,
        nu o listă generică de reglementări.
        → Satisfăcut de: snapshot automat din CUI + ANAF + site scan

US-004: Ca utilizator, vreau să rezolv un finding fără să ies din cockpitul lui,
        fără să fiu trimis în altă pagină.
        → Satisfăcut de: generator drawer inline, evidence card inline

US-005: Ca utilizator, vreau ca dovezile mele să fie salvate automat la dosar
        după ce confirm o acțiune.
        → Satisfăcut de: PATCH finding → dosar actualizat automat

US-006: Ca utilizator, vreau să știu tot timpul unde sunt în procesul de rezolvare
        al unui finding.
        → Satisfăcut de: progress stepper în cockpit (Detectat → ... → Monitorizat)

US-007: Ca utilizator, vreau să pot exporta tot ce am rezolvat pentru un control sau audit,
        fără să mai adun informații manual.
        → Satisfăcut de: Export Audit Pack din /dashboard/dosar
```

### 4.2 Stories per Persona

```
MIHAI (Solo):
US-M01: Ca proprietar, vreau să văd „ești ok" sau „ai X probleme urgente" pe prima pagină,
        fără să procesez un dashboard complex.

US-M02: Ca proprietar, vreau să generez o politică de confidențialitate gata de publicat
        pe site-ul meu în 5 minute.

US-M03: Ca proprietar, vreau să înțeleg de ce un finding se aplică firmei mele,
        nu doar că „legea zice așa".

US-M04: Ca proprietar, vreau să văd un scor simplu (0-100) care să-mi arate
        cât de departe sunt de conformitate.

US-M05: Ca proprietar, vreau să fiu notificat când apare o problemă nouă sau
        când o dovadă expiră, fără să verific eu zilnic.

DIANA (Partner):
US-D01: Ca consultant, vreau să văd pe o singură pagină starea tuturor clienților mei,
        sortată după urgență.

US-D02: Ca consultant, vreau să generez un raport de stare per client,
        gata de trimis, cu branding consistent.

US-D03: Ca consultant, vreau să pot lucra pe workspace-ul unui client
        fără să amestedeciderile cu ale altui client.

US-D04: Ca consultant, vreau să văd cross-client: câte finding-uri critice am pe tot portofoliul.

US-D05: Ca consultant, vreau să livrez clientului dovada că am rezolvat o problemă,
        nu doar să îi spun verbal.

RADU (Compliance):
US-R01: Ca DPO, vreau un audit trail complet: cine a schimbat ce, când, cu ce justificare.

US-R02: Ca DPO, vreau să pot delega un finding unui coleg reviewer și să
        văd când e finalizat.

US-R03: Ca DPO, vreau să exportez un pachet complet de audit (PDF + JSON + manifest)
        gata pentru inspector.

US-R04: Ca DPO, vreau să văd câte documente expiră în 30 de zile și să le reînnoiesc.

US-R05: Ca DPO, vreau să gestionez cererile DSAR (acces, ștergere) cu deadline tracking.
```

### 4.3 Stories per Modul

```
FINDING COCKPIT:
US-FC01: Ca utilizator, vreau să înțeleg problema unui finding în maxim 2 propoziții.
US-FC02: Ca utilizator, vreau să văd CE FAC EU acum, deasupra tuturor celorlalte informații.
US-FC03: Ca utilizator, vreau să confirm sau resping un finding înainte de a acționa.
US-FC04: Ca utilizator, vreau să generez un document din cockpit, fără redirect.
US-FC05: Ca utilizator, vreau să atașez o dovadă operațională (text/screenshot) când
         documentul generat nu e aplicabil.
US-FC06: Ca utilizator, vreau să văd că finding-ul a intrat în monitorizare
         după ce am terminat, cu o confirmare clară.

GENERATOR DRAWER:
US-GD01: Ca utilizator, vreau ca datele firmei mele să fie pre-populate în draft,
         fără să le introduc manual.
US-GD02: Ca utilizator, vreau să verific documentul generat înainte de a-l salva,
         cu o validare automată care îmi spune ce lipsește.
US-GD03: Ca utilizator, vreau să confirm explicit că documentul e valid
         înainte de a deveni dovadă oficială.

DOSAR:
US-DS01: Ca utilizator, vreau să văd toate cazurile rezolvate cu dovada lor,
         sortate cronologic.
US-DS02: Ca utilizator, vreau să văd dacă un document generat e aprobat sau
         mai are nevoie de confirmare.
US-DS03: Ca utilizator, vreau să descarc tot dosarul ca ZIP pentru audit.

NIS2:
US-N01: Ca utilizator, vreau să știu dacă firma mea trebuie înregistrată la DNSC.
US-N02: Ca utilizator, vreau să completez evaluarea de maturitate NIS2 pe 10 domenii.
US-N03: Ca utilizator, vreau să raportez un incident cu early warning în 24h
         și raport complet în 72h.

DSAR:
US-DSAR01: Ca DPO, vreau să înregistrez o cerere de acces la date și să urmăresc
           termenul de 30 de zile.
US-DSAR02: Ca DPO, vreau să înregistrez o cerere de ștergere și să documentez
           ce sisteme au fost afectate.

E-FACTURA:
US-EF01: Ca proprietar, vreau să știu dacă SPV ANAF e activ și configurat.
US-EF02: Ca proprietar, vreau să văd facturile care au probleme în SPV și ce e de făcut.

SCAN:
US-SC01: Ca utilizator, vreau să încarc un document (PDF/DOCX) și să obțin
         finding-uri specifice din el în maxim 60 secunde.
US-SC02: Ca utilizator, vreau să scanez site-ul meu pentru trackere, cookie banner,
         politică de confidențialitate.
```

---

## 5. USER FLOWS

### Flow 1 — Înregistrare nouă → Primul finding rezolvat (Mihai)

```
START: Utilizatorul dă click pe „Începe gratuit" de pe landing

[1] Ajunge pe /login
    Vede: toggle Login | Register (Register pre-selectat pentru CTA „Începe gratuit")
    Completează: email + parolă + confirmare parolă
    Click: „Creează cont"
    → Server: creează user, creează org, setează sesiune
    → Redirect: /onboarding

[2] /onboarding — Pasul 1: Rol
    Vede: badge „Onboarding ghidat", h1 „Îți pregătim primul snapshot"
    Vede sidebar stânga: 3 pași (1. Rol — ACTIV, 2. Profil, 3. Legi)
    Vede: 3 carduri radio (Proprietar/Manager, Consultant, Responsabil conformitate)
    Click: selectează „Proprietar / Manager" (card se evidențiază cu ring albastru)
    Click: „Continuă cu profilul firmei"
    → POST /api/auth/set-user-mode {mode: "solo"}
    → Toast: „Pasul 1 salvat. Continuăm cu profilul firmei."
    → Sidebar: Pasul 1 devine bifă verde, Pasul 2 devine ACTIV

[3] /onboarding — Pasul 2: Profil (ApplicabilityWizard)
    Sub-pas A: Introduce CUI
      Vede: câmp text „CUI firmă"
      Introduce: ex. „RO12345678"
      Click: „Verifică"
      → GET ANAF → răspuns în 2-3 sec
      → Pre-populare automată: Nume firmă, CAEN, județ
      → Vede: „Am găsit: [Firma SRL] — sector comerț, Bacău"
      Click: „Continuă"

    Sub-pas B: Website
      Vede: câmp URL precompletat dacă ANAF l-a furnizat
      Opțional: poate modifica sau lăsa gol
      Click: „Analizează site-ul"
      → Site scan async (3-8 sec)
      → Rezultat: trackere găsite, cookie banner: DA/NU, politică: DA/NU

    Sub-pas C: Sector + Mărime
      Vede: dropdown sector (pre-selectat din ANAF) + radio mărime
      Ajustează dacă necesar
      Click: „Continuă"

[4] /onboarding — Pasul 3: Legi aplicabile
    Vede: card per reglementare cu motivul aplicabilității
    Ex: „GDPR se aplică: procesați date personale ale clienților (confirmat din site scan)"
    Ex: „NIS2: sectorul vostru intră sub directivă (CAEN verificat)"
    Ex: „e-Factura: firmă activă ANAF, obligatoriu din 2025"
    Bifează checkbox: „Am înțeles ce se aplică"
    Click: „Finalizează și vezi snapshot-ul"
    → POST /api/compliance/complete-onboarding
    → Redirect: /dashboard/resolve

[5] /dashboard/resolve — Primul Snapshot
    Vede: PageIntro „De rezolvat · 5 deschise"
    Vede: badge-uri 2 critice (roșu), 1 ridicate (portocaliu), 2 medii (galben)
    Vede: FindingQueue cu 5 rânduri, sortate severity DESC
    Rândul 1: [critical] „Lipsă politică de confidențialitate" — GDPR · Acum
    Rândul 2: [critical] „Trackere fără consimțământ valid" — GDPR · Acum
    Rândul 3: [high] „Neînregistrat la DNSC (NIS2)" — NIS2 · Acum
    Rândul 4: [high] „SPV ANAF neactivat" — eFactura · Acum
    Rândul 5: [medium] „Lipsă politică de retenție date" — GDPR · Acum

[6] Click pe Rândul 1 → /dashboard/resolve/gdpr-001-[id]
    Vede: ArrowLeft „Înapoi la De rezolvat"
    Vede: PageIntro — titlu finding, badge [critical], badge [confirmat/open]

    HERO ACTION (above the fold, cel mai vizibil element):
    Box albastru: „Acum faci asta"
    Text: „Generezi politica de confidențialitate specifică firmei și o publici pe site."
    Butoane: [Confirmă și generează] [Respinge]

    Click: „Confirmă și generează"
    → PATCH /api/findings/[id] {status: "confirmed"}
    → Generator Drawer se deschide (slide-in animat din dreapta, 300ms)

[7] Generator Drawer — 4 pași
    Header: „Generează Politică de confidențialitate"
    Stepper: [1: Completezi] [2: Generezi] [3: Validezi] [4: Confirmi și salvezi]

    STEP 1 — Completezi:
      Vede: formular cu date pre-populate din profil
      Câmpuri: Numele firmei (auto), email contact (auto), DPO (gol → poate completa)
      Verifică, ajustează dacă necesar
      Click: „Generează documentul"
      → STEP 2 ACTIV

    STEP 2 — Generezi:
      Vede: spinner + „Generăm documentul bazat pe datele firmei tale..."
      (3-8 secunde)
      → POST /api/documents/generate
      → Draft apare: document structurat, secțiuni, detalii specifice firmei
      Poate: scroll în preview, verifică conținutul
      Click: „Continuă la validare"
      → STEP 3 ACTIV

    STEP 3 — Validezi dovada:
      Compli rulează automat:
        ✓ Document are lungime suficientă (>700 caractere)
        ✓ Are heading (#)
        ✓ Conține „ultima actualizare"
        ✓ Conține numele firmei
        ✓ Are disclaimer AI
      Afișează: „5/5 verificări trecute" (verde)
      Sau: „3/5 — 2 lipsesc: {ce lipsește}" (roșu/galben)
      Click: „Continuă la confirmare"
      → STEP 4 ACTIV

    STEP 4 — Confirmi și salvezi:
      Vede: 2 checkboxuri:
        □ „Confirm că am citit și că reflectă procesele și specificul firmei mele față de lege"
        □ „Înțeleg că documentul trebuie publicat pe site-ul firmei"
      Bifează ambele
      Click: „Confirmă și salvează"
      → PATCH /api/findings/[id] {status: "resolved", validationChecklist: [...]}
      → Drawer se închide

[8] /dashboard/resolve/[id] — după confirmare
    Vede: card verde „[Politica de confidențialitate] a intrat în Dosar"
    Vede: finding status badge → „Monitorizat"
    Vede: CTA „Deschide Dosarul"

    Opțional: click „Deschide Dosarul" → /dashboard/dosar
    Sau: click „Înapoi la De rezolvat" → /dashboard/resolve

[9] /dashboard/resolve — după primul finding
    Vede: 4 rânduri rămase (unul e rezolvat, nu mai apare în filtrul „Deschise")
    Continuă cu următorul finding sau iese din sesiune

END FLOW: utilizatorul a rezolvat primul finding, are dovadă la dosar,
          finding-ul e în monitorizare.
```

---

### Flow 2 — Finding cu dovadă operațională (nu document)

```
START: utilizatorul e în cockpitul unui finding care nu necesită document generat
       Ex: „SPV ANAF neactivat" (EF-001)

[1] Vede Hero Action: „Activezi SPV-ul în portalul ANAF"
    Buton: „Confirmă și continuă" (merge la SPV ANAF — workflowLink)
    Click: „Confirmă și continuă"
    → PATCH finding: status = "confirmed", redirectTo = workflowLink (ANAF SPV portal)
    → Tab nou sau redirect la ANAF

[2] Utilizatorul activează SPV pe portalul ANAF (în afara CompliAI)

[3] Revine la CompliAI — /dashboard/resolve/[id]?siteScan=done sau manual
    Vede: Hero Action actualizat: „Documentează dovada activării SPV"
    Vede: Evidence Card (textarea):
      Eyebrow: „Dovadă de activare SPV"
      Body: „Atașează dovada că SPV-ul este activ și configurat corect."
      Placeholder: „Ex: SPV activat pe portal ANAF la 26.03.2026, screenshot..."
      Footer: „Cazul nu poate intra în monitorizare fără dovada că SPV-ul este activ."

    Introduce nota: „SPV activat 26.03.2026, token ANAF generat, verificare OK"

    Click: „Rezolvă și intră în monitorizare"
    → PATCH /api/findings/[id] {status: "resolved", evidenceNote: "..."}

[4] Vede: card succes „Caz închis și trecut în monitorizare"
    Finding status: „Monitorizat"
    Dovada e salvată la dosar

END FLOW
```

---

### Flow 3 — Scanare document nou → Findings noi

```
START: utilizatorul vrea să adauge un document nou pentru analiză

[1] Click nav: „Scanează" → /dashboard/scan
    Vede: PageIntro „Scanare" + un singur warning banner (dacă e cazul)
    Vede: 3 tab-uri de input: Document | Text | Website
    Tab activ: Document (default)

[2] Tab Document:
    Vede: dropzone „Trage PDF, DOCX sau imagine sau click pentru a selecta"
    Drag & drop / click → selector fișier
    Selectează: contract_gdpr_furnizori.pdf
    Vede: preview filename + dimensiune
    Click: „Analizează documentul"
    → POST /api/site-scan sau /api/scan (upload + analyze)
    → Loading state: „Analizăm documentul... (poate dura 30-60 secunde)"

[3] Rezultat scan:
    Redirect: /dashboard/scan/results/[scanId]
    Vede: summary: „Am găsit 3 finding-uri noi în contractul tău de furnizori"
    Vede: 3 rânduri cu finding-uri noi
    Vede: buton „Adaugă în De rezolvat" per finding sau „Adaugă toate"

    Click: „Adaugă toate în De rezolvat"
    → finding-urile apar în /dashboard/resolve

[4] /dashboard/resolve — finding-urile noi sunt marcate „nou" (badge albastru)
    Utilizatorul le triajează și le rezolvă ca în Flow 1

END FLOW
```

---

### Flow 4 — Monitoring alert → Revalidare

```
START: utilizatorul primește email „Review date se apropie pentru Politica de confidențialitate"
       SAU scorul din dashboard scade (drift detectat)

[1] Intră pe /dashboard
    Vede: card alert „1 finding are nevoie de revalidare"
    Click: link din alert → /dashboard/resolve/[id]

[2] Cockpit finding cu status „needs_revalidation":
    Vede: Hero Action: „Reconfirmi dovada existentă"
    Vede: card „Revalidare necesară":
      - Dovada anterioară: [textul anterior]
      - Checkbox: „Confirm că am reverificat dovada și că rămâne valabilă"
      - Input date: „Următor review" (pre-completat cu +90 zile)

    Bifează checkbox
    Ajustează data dacă necesar
    Click: „Reconfirmă și actualizează monitorizarea"
    → PATCH finding {status: "resolved", revalidationConfirmed: true, newReviewDateISO: "..."}

[3] Finding rămâne „Monitorizat"
    Dosar: intrare nouă cu data revalidării
    Următor review setat la noua dată

END FLOW
```

---

### Flow 5 — DSAR Request (acces la date)

```
START: utilizatorul primește o cerere DSAR de la o persoană

[1] /dashboard/dsar
    Vede: lista cererilor existente (sau empty state)
    Click: „Cerere nouă"
    Selectează: tip = „Acces la date"
    Completează: email solicitant, dată primire
    Click: „Creează cerere"
    → Finding GDPR-013 creat automat în De rezolvat

[2] /dashboard/resolve/[gdpr-013-id]
    Vede Hero Action: „Verifici identitatea solicitantului și pregătești răspunsul DSAR"
    Vede deadline calculat automat: 30 zile de la data primirii

    Confirmă finding

    Vede Evidence Card:
      „Leagă cazul de workflow-ul DSAR, notează cum ai verificat identitatea și
       când ai trimis răspunsul."

    Completează: „Identitate verificată via email 26.03.2026. Răspuns DSAR trimis la
                  adresa@email.com pe 15.04.2026 cu datele solicitate."

    Click: „Rezolvă"

[3] Finding rezolvat, DSAR cerere marcată completă cu urmă clară

END FLOW
```

---

### Flow 6 — NIS2 Incident

```
START: compania detectează un incident de securitate cibernetică

[1] /dashboard/nis2
    Vede tab: Incidente
    Click: „Incident nou"
    Completează: titlu, dată detectare, categorie
    Click: „Creează incident"
    → Finding NIS2-015 creat în De rezolvat cu deadline 24h (early warning) + 72h (raport)

[2] /dashboard/resolve/[nis2-015-id]
    Vede: deadline countdown „23h rămase pentru early warning DNSC"

    Hero Action: „Trimiți early warning DNSC în 24h"
    Click: „Confirmă și deschide timeline-ul"
    → Redirect la /dashboard/nis2 cu tab Incidente activ
    → Utilizatorul completează early warning în interfața NIS2
    → Revine la cockpit cu ?incidentFlow=done

    Vede: „Ai revenit din timeline-ul NIS2. Revizuiește nota..."
    Completează nota de dovadă
    Click: „Rezolvă"

END FLOW
```

---

### Flow 7 — Diana: Portofoliu Client → Raport

```
START: Diana deschide CompliAI dimineața

[1] /portfolio
    Vede: lista clienților cu scor și status rapid
    Sortare: cei mai critici primii
    Vede: Client X — scor 45/100, 3 critice [roșu intens]

    Click pe Client X → intră în workspace-ul clientului

[2] /dashboard (în context Client X)
    Vede dashboard-ul clientului
    Aceleași ecrane ca Mihai, dar Diana acționează în locul clientului

[3] Rezolvă finding-urile critice (ca în Flow 1/2)

[4] /portfolio/reports
    Click: „Generează raport lunar pentru Client X"
    → PDF: scor, finding-uri rezolvate, finding-uri rămase, dovezi
    Click: „Descarcă" → raport.pdf
    Trimite clientului via email

END FLOW
```

---

## 6. INFORMATION ARCHITECTURE

### 6.1 Sitemap complet

```
/ (Landing Page)
├── /login (Login + Register)
├── /pricing
├── /demo/imm
├── /terms
├── /privacy
├── /dpa
├── /onboarding
│   └── /onboarding/finish (→ redirect la /dashboard/resolve)
│
└── /dashboard (protejat — necesită autentificare)
    ├── /dashboard (Acasă — scor, risk overview, activitate)
    ├── /dashboard/scan (Scanare)
    │   ├── /dashboard/scan/results/[scanId]
    │   └── /dashboard/scan/history
    ├── /dashboard/resolve (De rezolvat — finding queue)
    │   ├── /dashboard/resolve/[findingId] (Cockpit finding individual)
    │   └── /dashboard/resolve/support (Task board auxiliar)
    ├── /dashboard/dosar (Dosar — dovezi + documente + export)
    │   ├── /dashboard/reports (backward compat)
    │   ├── /dashboard/reports/vault
    │   ├── /dashboard/reports/audit-log
    │   ├── /dashboard/reports/policies
    │   ├── /dashboard/reports/trust-center
    │   └── /dashboard/generator
    ├── /dashboard/settings
    │   └── /dashboard/settings/abonament
    │
    [SPECIALIST MODULES — accesibile din cockpit finding sau navigare secundară]
    ├── /dashboard/nis2
    │   ├── /dashboard/nis2/maturitate
    │   └── /dashboard/nis2/inregistrare-dnsc
    ├── /dashboard/dsar
    ├── /dashboard/fiscal
    ├── /dashboard/sisteme (AI Systems + e-Factura validator)
    ├── /dashboard/conformitate (AI Act conformity assessment)
    ├── /dashboard/vendor-review
    ├── /dashboard/alerte (Drift alerts)
    ├── /dashboard/calendar
    ├── /dashboard/whistleblowing
    ├── /dashboard/dora
    └── /dashboard/agents

[PARTNER MODE — doar pentru userMode=partner]
/portfolio
├── /portfolio/alerts
├── /portfolio/tasks
├── /portfolio/vendors
└── /portfolio/reports
```

### 6.2 Navigare per mod utilizator

**Navigare SOLO (Mihai — 5 iteme)**
```
🏠 Acasă        → /dashboard
🔍 Scanează     → /dashboard/scan
🚩 De rezolvat  → /dashboard/resolve
📂 Dosar        → /dashboard/dosar
⚙️ Setări       → /dashboard/settings
```

**Navigare COMPLIANCE (Radu — aceleași 5 + acces la toate modulele specialist)**
```
🏠 Acasă
🔍 Scanează
🚩 De rezolvat      [include: NIS2, DSAR, Fiscal, DORA, Whistleblowing ca sub-pagini]
📂 Dosar            [include: Vault, Audit Log, Policies, Trust Center]
⚙️ Setări
```

**Navigare VIEWER (citire-only — 4 iteme)**
```
🏠 Acasă (read-only)
🚩 Taskurile mele
📄 Documente (read-only)
⚙️ Setări
```

**Navigare PARTNER (Diana — portofoliu + workspace per client)**
```
[În context portofoliu]:
🏢 Portofoliu       → /portfolio
🔔 Schimbări        → /portfolio/alerts
🚩 Remediere        → /portfolio/tasks
🏭 Furnizori        → /portfolio/vendors
📊 Rapoarte         → /portfolio/reports

[În context client individual]:
[aceleași 5 iteme ca Solo/Compliance, cu banner „Lucrezi pe: Client X"]
```

### 6.3 Ierarhia modulelor

```
PRIMAR (tot userul trece prin ele):
  Landing → Register → Onboarding → De rezolvat → Cockpit → Dosar

SECUNDAR (accesate din cockpit finding, nu direct):
  Generator Drawer (din cockpit când finding.suggestedDocumentType != null)
  Evidence Card (din cockpit pentru dovadă operațională)
  Revalidation Card (din cockpit pentru needs_revalidation)

SPECIALIST (accesate din cockpit via workflowLink sau din navigare directă):
  NIS2 — eligibility, assessment, incidents, maturity, governance
  DSAR — acces, ștergere, portabilitate
  Fiscal / e-Factura — SPV, facturi problematice, explainability
  AI Systems — inventar, conformitate AI Act
  Vendor Review — review furnizori NIS2
  DORA — operational resilience (sectoare financiare)
  Whistleblowing — canal sesizări EU 2019/1937
  Drift Alerts — schimbări detectate automat

OUTPUT (nu se acționează, se consumă):
  Audit Pack — export complet
  One-Page Report — raport management
  Counsel Brief — pentru avocat
  Trust Center — pagină publică de transparență
  Audit Log — trail complet
```

### 6.4 Finding → Module mapping (ce module deschide ce finding)

```
GDPR-005 (trackere fără consent)  → /dashboard/scan (site scan pentru verificare)
GDPR-013 (DSAR acces)             → /dashboard/dsar?action=new
GDPR-014 (DSAR ștergere)          → /dashboard/dsar?action=erasure
GDPR-019 (breach notification)    → /dashboard/nis2 (ANSPDCP flow)
NIS2-001 (neînregistrat DNSC)     → /dashboard/nis2/inregistrare-dnsc
NIS2-015 (incident neraaportat)   → /dashboard/nis2 tab=incidents
NIS2-GENERIC (maturitate)         → /dashboard/nis2/maturitate
NIS2-GENERIC (governance)         → /dashboard/nis2 tab=governance
NIS2-GENERIC (furnizori)          → /dashboard/vendor-review
EF-001 (SPV ANAF neactivat)       → portal ANAF extern
EF-003/004/005/006 (e-Factura)    → /dashboard/fiscal
EU-AI-* (sisteme AI)              → /dashboard/sisteme sau /dashboard/conformitate
```

---

## 7. UX PRINCIPLES & PATTERNS

### 7.1 Principii fundamentale

**P1 — Action first, context second**
Utilizatorul vede CE FACE acum, deasupra oricărui alt element. Contextul (de ce, impact, lege) este disponibil dar nu concurează cu acțiunea primară.

Implementare: Hero Action Block (bordered albastru, deasupra fold-ului) vs. `<details>` collapsible pentru context.

**P2 — One cockpit = one execution place**
Un finding nu poate fi rezolvat pe altă pagină. Orice redirect extern (workflowLink) trebuie să returneze utilizatorul în același cockpit cu context preserved (?incidentFlow=done, ?siteScan=done).

**P3 — Progressive disclosure**
Informația grea (impact legal, proveniență, baza legală) e collapsibilă. Prima vizualizare arată: problema, acțiunea, starea.

**P4 — Dovada este obligatorie, nu opțională**
Niciun finding nu se poate „rezolva" fără urmă. Fie document generat + validat, fie notă operațională. Butonul de rezolvare e disabled până când dovada e completă.

**P5 — Starea este persistată și vizibilă**
Utilizatorul știe mereu: unde e în flow, ce a bifat deja, ce urmează. Progress stepper (5 pași: Detectat → Pregătești → Dovadă → Verificare → Monitorizat) e vizibil în orice cockpit.

**P6 — Feedback imediat pentru orice acțiune**
Toast la salvare, badge actualizat la confirmare, success card la rezolvare. Nicio acțiune nu rămâne fără răspuns vizual.

**P7 — Onboarding nu se oprește la un ecran intermediar**
Fluxul Rol → CUI → ANAF → Sector → Legi → De rezolvat este liniar. Nu există ecrane de „felicitare" sau hub-uri de decizie intermediare.

### 7.2 Patterns per tip de ecran

**Landing Page**
- Badge de urgență (reglementare activă) → anxietate → interes
- H1 în 3 linii cu accent colorat pe beneficiul final
- Subtitlu care enumeră explicit traseul (CUI → snapshot → cockpit → dovadă → monitorizare)
- Journey steps (4, numerotate) — arată că există un proces clar
- Problem section — validare emoțională
- CTA primar singur și dominant (secondary ca link simplu, nu buton competitiv)

**Onboarding**
- Layout 2 coloane: sidebar (context + progres) + main (form activ)
- Stepper sidebar cu 3 pași, fiecare cu stare vizuală (done ✓ / active ● / upcoming)
- Badge „modul selectat" rămâne vizibil în sidebar pe toată durata
- Bara de progres „Pasul X din 3" deasupra form-ului activ
- Erori inline, nu popup
- Loading state cu text explicativ (nu spinner gol)

**Dashboard (Acasă)**
- Scor principal vizibil imediat (0-100 + label de risc)
- Metricile cele mai importante above the fold
- Card-uri de alertă pentru finding-uri critice noi
- „Ce faci acum" — link direct la De rezolvat

**Finding Queue (De rezolvat)**
- Rânduri sortate severity DESC
- Per rând: severity badge + titlu + action hint (whatUserMustDo) + framework + vârstă + arrow
- Filtre: status (Deschise/Toate), framework, severitate — toate disponibile, filtrele grele în `<details>`
- Empty state util: „Nu există finding-uri. Rulează o scanare."

**Finding Cockpit**
- Back nav: „Înapoi la De rezolvat" (legătură clară cu context)
- PageIntro: titlu + badges + detected date + sursa (aside)
- Hero Action Box: prominent, colorat, deasupra fold
- Evidence Card sau Revalidation Card: apare condițional, sub hero
- Collapsible 1: „Progres, dosar și monitorizare"
- Collapsible 2: „Contextul cazului" (FindingNarrativeCard)
- Collapsible 3: „Context juridic și proveniență" (doar dacă există)

**Generator Drawer**
- Slide-in din dreapta (300ms), full-height
- Stepper orizontal cu 4 pași clar vizibili
- Pre-populare automată a datelor firmei
- Preview document în step 2
- Validare automată în step 3 (checks verzi/roșii)
- Butoane disabled până când condițiile sunt îndeplinite

**Dosar**
- Secțiunea 1: Cazuri rezolvate cu dovezi (finding + linked doc + status)
- Secțiunea 2: Documente generate (cu stare aprobare)
- Secțiunea 3: Export options
- Empty state: „Niciun caz rezolvat încă. Rezolvă primul finding."

### 7.3 State management UX

Fiecare ecran știe în ce stare se află și afișează UI corespunzător:

```
FINDING STATES → UI
open              → Hero Action [confirmare / respingere]
confirmed         → Hero Action [acțiune principală] + Evidence/Revalidation card
dismissed         → Card neutral, fără acțiuni
resolved          → Success moment card, progress: done
under_monitoring  → Card verde, progress: monitorizat

DOCUMENT STATES → UI
draft             → „Draft — necesită confirmare"
approved_as_evidence → Badge „aprobat", legat la finding

GENERATOR STEPS → UI
completezi        → Form cu date pre-populate
generezi          → Spinner → Preview
validezi          → Checks auto → pass/fail
confirmi          → Checkboxuri → „Confirmă și salvează" (disabled până bifat)
```

### 7.4 Empty states — fiecare e util, nu „no data"

```
De rezolvat, fără findings:
  „Nu există finding-uri active. Rulează o scanare pentru a detecta probleme."
  CTA: „Scanează acum"

Dosar, fără cazuri rezolvate:
  „Niciun caz rezolvat încă. Rezolvă primul finding din De rezolvat
   și dovada va apărea automat aici."
  CTA: „Mergi la De rezolvat"

Portofoliu, fără clienți:
  „Niciun client adăugat. Adaugă primul CUI pentru a crea un workspace de client."
  CTA: „Adaugă client"

DSAR, fără cereri:
  „Nicio cerere DSAR primită. Când primești o cerere, o înregistrezi aici
   și Compli urmărește automat termenul de 30 de zile."
  CTA: „Cerere nouă"
```

### 7.5 Error handling

```
Nivel 1 — Inline error (câmpuri individuale):
  Apare sub câmp, text roșu, concis
  Ex: „CUI invalid — verifică că are 8-10 cifre"

Nivel 2 — Card error (acțiune eșuată):
  Apare în locul rezultatului așteptat
  Ex: card portocaliu „Nu s-a putut actualiza statusul. Încearcă din nou."

Nivel 3 — Page error (eroare gravă):
  ErrorScreen component, cu mesaj + buton „Reîncarcă pagina"
  Ex: 404 finding sau eroare server

Nivel 4 — Toast (acțiuni async):
  Success: verde, dispare în 3 sec
  Error: roșu, rămâne până dismiss
  Warning: portocaliu, rămâne până dismiss
```

---

## 8. UI LANGUAGE

### 8.1 Design System — EOS v2

CompliAI folosește **Evidence OS (EOS) v2** — un design system intern bazat pe Tailwind CSS cu variabile CSS custom. Toate componentele vin din `/components/evidence-os/`.

**Componente principale:**
- `<PageIntro>` — header per secțiune cu eyebrow, titlu, descriere, badges, aside
- `<Card>` / `<CardContent>` / `<CardHeader>` / `<CardTitle>` — containere principale
- `<Badge>` — status tags (variants: default, success, warning, destructive, outline, secondary)
- `<Button>` — acțiuni (variants: default, outline, ghost, destructive; sizes: sm, md, lg)
- `<EmptyState>` — empty states consistente
- `<SeverityBadge>` — specific pentru severitate finding (critical/high/medium/low)

### 8.2 Semantic color usage

```
eos-primary (albastru)     → acțiuni principale, active state, informație primară
eos-success (verde)        → resolved, monitored, approved, completed
eos-warning (portocaliu)   → atenție necesară, deadline aproape, needs_revalidation
eos-error/destructive (roșu) → critical finding, eroare, deadline depășit
eos-text-muted (gri)       → context secundar, metadata, hint-uri
```

**Regula de aur:** culoarea nu transmite singură informația. Lângă orice element colorat există text care explică starea.

### 8.3 Typography hierarchy

```
h1 (3xl-5xl, bold)     → Titluri pagini principale (landing, onboarding)
h2 (xl-2xl, semibold)  → Titluri secțiuni, PageIntro titles
CardTitle (base, semibold) → Titluri card-uri
Eyebrow (11px, uppercase, tracking-wide) → Label de context deasupra titlului
Body (sm, regular)      → Text principal, descrieri
Muted (sm, text-muted)  → Context secundar, metadata
Micro (xs, text-muted)  → Hints, date, labels tehnice
```

### 8.4 Spacing & layout logic

```
Pagini dashboard: space-y-8 între secțiuni majore
Card-uri: space-y-4 intern
Grid-uri: md:grid-cols-2 sau md:grid-cols-3 (niciodată mai mult de 4)
Max width: max-w-5xl pentru conținut lat, max-w-3xl pentru conținut centrat
Padding pagini: px-6 py-4 (mobile: px-3 py-4)
```

---

## 9. COPY & MICROCOPY

### 9.1 Principii de copy

**Regula 1: Acțiunea înainte de explicație**
NU: „Conform GDPR Art. 13, ai obligația de a informa persoanele ale căror date le prelucrezi..."
DA: „Generezi politica de confidențialitate și o publici pe site."

**Regula 2: Specific, nu generic**
NU: „Există o problemă cu datele tale"
DA: „Lipsă politică de confidențialitate — site-ul tău procesează date fără a informa utilizatorii"

**Regula 3: Voce activă, persoana 2**
NU: „Documentul trebuie generat de utilizator și confirmat"
DA: „Generezi documentul, îl validezi, îl confirmi."

**Regula 4: Consecința clară, nu amenințarea**
NU: „Riști amendă de până la 20 milioane EUR"
DA: „Cazul nu poate intra în monitorizare fără această dovadă."

**Regula 5: Diacritice corecte în tot textul vizibil**
â, ă, î, ș (cu virgulă, nu cedilă), ț (cu virgulă, nu cedilă)

### 9.2 Copy per tip de ecran

**CTA-uri:**
```
Primar, acțiune clară:
  „Confirmă și generează"
  „Rezolvă și intră în monitorizare"
  „Confirmă și salvează"
  „Continuă cu profilul firmei"

Secundar, alternativă:
  „Respinge" (nu „Anulează" pentru o acțiune deliberată)
  „Înapoi la De rezolvat" (nu „Înapoi")
  „Deschide Dosarul" (nu „See more")

Loading:
  „Se salvează..." (nu „Loading...")
  „Analizăm documentul..." (nu „Please wait...")
  „Verificăm CUI-ul la ANAF..." (nu „Checking...")
```

**Toast-uri:**
```
Success: „Pasul 1 salvat. Continuăm cu profilul firmei." (acțiune + next step)
Error: „Eroare de rețea. Încearcă din nou." (ce s-a întâmplat + ce poți face)
Warning: „Ai revenit din flow-ul de breach. Revizuiește nota..." (context specific)
```

**Badge-uri de status finding:**
```
„Deschis"           → finding nou, neconfirmat
„Confirmat"         → utilizatorul a confirmat că e real
„În remediere"      → acțiune în curs
„Necesar input"     → utilizatorul trebuie să facă ceva
„Acțiune externă"   → redirect la altă suprafață necesar
„Marcat nevalid"    → finding respins
„Rezolvat"          → dovadă salvată
„Monitorizat"       → cazul e închis și sub watch
```

**Eyebrow labels (uppercase, text-muted):**
```
„Acum faci asta"     → Hero Action box
„Dovadă obligatorie" → Evidence Card
„Revalidare necesară" → Revalidation Card
„Progres"            → Progress stepper
„Contextul cazului"  → Collapsible narrative
„Caz · GDPR"         → PageIntro prefix (categoria finding-ului)
```

### 9.3 Micro-copy specifică

**Onboarding sidebar:**
- „alegi rolul și modul de lucru" (hint pentru pasul 1)
- „CUI, ANAF, website, sector și mărime" (hint pentru pasul 2)
- „ce reguli se aplică și unde trebuie confirmare" (hint pentru pasul 3)

**Finding Queue:**
- „Prioritatea de azi" (solo mode, nu „Queue de finding-uri" corporate)
- „Lucrezi pe ce e activ acum" (solo description)

**Cockpit progress stepper:**
- „Detectat" / „Pregătești draftul" / „Validezi dovada" / „Confirmi și salvezi" / „Monitorizat"

**Dosar:**
- „Cazuri rezolvate și dovezi" (secțiunea principală)
- „Dovadă: [titlu document]" (link la document)
- „Aprobat" (badge dacă approvalStatus = approved_as_evidence)
- „Închis [dată]" (când s-a rezolvat)
- „Următor review: [dată]" (pentru under_monitoring)

---

## 10. DECISION MATRIX

### Ce afișezi cui, când, unde

```
LANDING — cine ajunge, ce vede, ce acționează

Utilizator nou (necunoscut):
  → Afișezi: hero complet, journey 4 pași, problem section, pricing preview
  → CTA: „Începe gratuit — 2 minute"
  → Nu afișezi: nicio informație despre funcționalități avansate

Utilizator autentificat care revine pe /  :
  → Redirect automat la /dashboard
  → Nu mai afișezi landing page

──────────────────────────────────────────────────────

ONBOARDING — condițional per stare

Utilizator fără mod setat:
  → Afișezi: step 1 (rol selection)

Utilizator cu mod setat, fără profil:
  → Afișezi: step 2 (CUI + wizard)

Utilizator cu profil, fără confirmare legi:
  → Afișezi: step 3 (legi applicabile)

Utilizator cu onboarding complet:
  → Redirect la /dashboard/resolve

──────────────────────────────────────────────────────

DE REZOLVAT — ce afișezi în funcție de starea finding-urilor

0 findings:
  → EmptyState cu CTA „Scanează acum"

Findings active:
  → Lista sortată severity DESC
  → Badge-uri numerice: X critice, Y ridicate, Z medii

0 findings active, dar există findings închise:
  → Toggle „Toate" activ → arată closed findings
  → Mesaj: „Toate cazurile sunt rezolvate."

──────────────────────────────────────────────────────

COCKPIT FINDING — ce afișezi per status finding

status = "open":
  → Hero Action cu: [Confirmă și generează] SAU [Confirmă și continuă] SAU [Confirmă]
                    + [Respinge]
  → Collapsible: progres, context, juridic

status = "confirmed" + hasGenerator:
  → Hero Action cu: [Deschide generator] sau [Continuă validarea]
  → Collapsible: progres, context, juridic

status = "confirmed" + !hasGenerator + requiresEvidenceNote:
  → Hero Action cu: [Rezolvă] (disabled până când nota e completată)
  → Evidence Card (textarea obligatorie) visible

status = "confirmed" + needsRevalidation:
  → Hero Action cu: [Reconfirmă] (disabled până când checkbox + dată)
  → Revalidation Card visible

status = "dismissed":
  → Neutral card: „Marcat nevalid"
  → Fără hero action activ

status = "resolved" sau "under_monitoring":
  → Success card (verde): FindingDossierSuccessCard sau FindingCaseClosedCard
  → CTA: „Deschide Dosarul"

──────────────────────────────────────────────────────

GENERATOR DRAWER — ce afișezi per step

Step 1 (completezi):
  → Form cu date pre-populate, editabile
  → Buton: „Generează documentul"

Step 2 (generezi):
  → Loading spinner (dacă se generează)
  → Preview document (dacă generat)
  → Buton: „Continuă la validare"

Step 3 (validezi):
  → Lista checks cu status (✓ verde / ✗ roșu)
  → Summary: X/Y verificări trecute
  → Buton: „Continuă la confirmare" (disabled dacă există checks critice eșuate)

Step 4 (confirmi):
  → 2 checkboxuri de confirmare
  → Buton: „Confirmă și salvează" (disabled până ambele bifate + validare passed)

──────────────────────────────────────────────────────

DOSAR — ce afișezi

Fără cazuri rezolvate:
  → EmptyState: „Niciun caz rezolvat încă..."

Cu cazuri rezolvate:
  → Lista finding-uri: titlu, severity, status, linked doc (dacă există), date

Fără documente generate:
  → SecțiuneaReportsPageSurface cu EmptyState

Cu documente:
  → Lista documente cu stare aprobare + link la dosar

──────────────────────────────────────────────────────

NAVIGARE PRIMARĂ — per modul utilizator

userMode = "solo":
  → 5 iteme: Acasă, Scanează, De rezolvat, Dosar, Setări
  → Fără portofoliu, fără canale avansate în nav principal

userMode = "partner":
  → Redirect la /portfolio dacă nu e în context client
  → Când în context client: nav standard solo/compliance + banner client

userMode = "compliance":
  → 5 iteme principale + acces la modulele specialist
  → Audit log, trust center, counsel brief accesibile

role = "viewer":
  → 4 iteme: Acasă (read-only), Taskurile mele, Documente (read-only), Setări

──────────────────────────────────────────────────────

TIMING — când afișezi ce

Imediat (< 100ms): toggle-uri, checkbox-uri, hover states
Feedback rapid (100-300ms): buton loading state, badge update
Acțiuni async (1-5 sec): spinner + mesaj explicativ
Acțiuni lungi (5-30 sec): progress bar + mesaj „analizăm..."
Succes: toast 3 sec + success card persistent

──────────────────────────────────────────────────────

CONDIȚIONAL — afișezi doar dacă există

Badge „urgențe cu deadline":     dacă urgencyItems.length > 0
Success moment card:             dacă ?success=dossier || showDossierMoment
Evidence Card textarea:          dacă requiresOperationalEvidence
Revalidation Card:               dacă requiresRevalidation
Status feedback banner:          dacă statusFeedback && !successMomentVisible
Legal context collapsible:       dacă finding.legalMappings || finding.provenance
Vendor context block:            dacă recipe.vendorContext != null
Suggested document block:        dacă finding.suggestedDocumentType != null
Linked document block:           dacă linkedGeneratedDocument != null
Reopened warning:                dacă finding.reopenedFromISO && status === "open"
```

---

## ANEXE

### A. Route catalog complet

| Route | Component | Mode | Descriere |
|---|---|---|---|
| `/` | HomePage | public | Landing page |
| `/login` | LoginPage | public | Login + Register toggle |
| `/pricing` | PricingPage | public | Planuri și prețuri |
| `/demo/imm` | DemoPage | public | Demo live IMM |
| `/onboarding` | OnboardingForm | auth | Wizard rol + profil + legi |
| `/dashboard` | DashboardHome | auth | Acasă — scor + overview |
| `/dashboard/scan` | ScanPage | auth | Scanare documente/site |
| `/dashboard/scan/results/[id]` | ScanResultsPage | auth | Rezultat scan |
| `/dashboard/scan/history` | ScanHistoryPage | auth | Istoric scanări |
| `/dashboard/resolve` | ResolvePageSurface | auth | Finding queue |
| `/dashboard/resolve/[findingId]` | FindingDetailPage | auth | Cockpit finding |
| `/dashboard/resolve/support` | ResolveSupportPageSurface | auth | Task board auxiliar |
| `/dashboard/dosar` | DosarPageSurface | auth | Dosar + dovezi |
| `/dashboard/reports` | ReportsPageSurface | auth | Reports (backward compat) |
| `/dashboard/nis2` | NIS2Page | auth | Modul NIS2 |
| `/dashboard/nis2/maturitate` | NIS2MaturityPage | auth | Evaluare maturitate |
| `/dashboard/dsar` | DSARPage | auth | Cereri DSAR |
| `/dashboard/fiscal` | FiscalPage | auth | e-Factura + SPV |
| `/dashboard/sisteme` | SistemePage | auth | AI Systems + validator |
| `/dashboard/vendor-review` | VendorReviewPage | auth | Furnizori NIS2 |
| `/dashboard/alerte` | DriftAlertsPage | auth | Drift alerts |
| `/dashboard/whistleblowing` | WhistleblowingPage | auth | Canal sesizări |
| `/dashboard/dora` | DORAPage | auth | DORA resilience |
| `/dashboard/settings` | SettingsPage | auth | Setări workspace |
| `/portfolio` | PortfolioPage | partner | Portofoliu clienți |
| `/portfolio/alerts` | PortfolioAlertsPage | partner | Alerte cross-client |

### B. Finding type → Flow mapping

| Finding ID | Tip | Flow principal | Modul specialist |
|---|---|---|---|
| GDPR-001 | Lipsă politică confidențialitate | Document (generator) | — |
| GDPR-005 | Trackere fără consent | Operational + site scan | /dashboard/scan |
| GDPR-013 | DSAR acces date | Operational cu deadline | /dashboard/dsar |
| GDPR-014 | DSAR ștergere | Operational cu deadline | /dashboard/dsar |
| GDPR-016 | Lipsă politică retenție | Document (generator) | — |
| GDPR-017 | Date expirate neșterse | Operational (log ștergere) | — |
| GDPR-019 | Breach notification | Operational + ANSPDCP | /dashboard/nis2 |
| NIS2-001 | Neînregistrat DNSC | Operational + DNSC | /dashboard/nis2 |
| NIS2-015 | Incident neraportatt | Operational + timeline | /dashboard/nis2 |
| NIS2-GENERIC | Maturitate/Governance | Operational | /dashboard/nis2 |
| EF-001 | SPV neactivat | Operational extern | portal ANAF |
| EF-003-006 | e-Factura erori | Operational + SPV | /dashboard/fiscal |
| EU-AI-* | AI Act | Document / Operational | /dashboard/conformitate |

### C. Checklist de calitate per ecran

Înainte de a considera un ecran „done", verifici:

```
□ Utilizatorul nou înțelege ce face ecranul în 5 secunde?
□ Acțiunea principală este vizual dominantă?
□ Există empty state util (nu „no data found")?
□ Există loading state (skeleton sau spinner + text)?
□ Există error state specific cu next step?
□ Toate butoanele au stare disabled corect?
□ Toast-urile apar pentru acțiuni async?
□ Mobile: ecranul e utilizabil pe 375px?
□ Diacritice corecte (ș, ț cu virgulă; â, ă, î)?
□ Copy: voce activă, specific, fără jargon?
□ Link-urile de back navigation duc unde trebuie?
□ Status badges reflectă starea reală?
```

---

*Document actualizat la: 2026-03-27*
*Următor review: la orice sprint care modifică flow-ul principal*
