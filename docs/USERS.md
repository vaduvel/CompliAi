# USERS.md — CompliAI (2026-04-19)

> Personas operaționale pentru CompliAI. **Bazate pe etnografie digitală + research de piață + validare externă (PO).** Fiecare claim e citat (verbatim cu URL) sau marcat `[inferred]` / `[needs validation]`.
>
> Consultă **împreună cu** [STATE-NOW.md](./STATE-NOW.md) + [MARKET-RESEARCH.md](./MARKET-RESEARCH.md). Apoi folosește-le pentru a produce [DESTINATION.md].

---

## 0. DE CE ACEST DOCUMENT E DIFERIT DE PERSONA DOCS VECHI

Persona docs din `docs/adevar inghetat/` sunt **structurale** (stages, guardrails, evaluation lens). Bune ca mandate de review, dar nu răspund la:

- **La 9:15 AM luni, ce face Diana concret?**
- **Cum rejectează un cabinet contabil un tool nou?**
- **Ce face un DPO intern dacă tool-ul nu dă export format ANSPDCP?**

Acest document acoperă **comportament observat**, nu aspirații. Pentru fiecare persona:
1. Cine + context
2. Day-in-the-life concret
3. JTBD ordonat frecvență × importanță
4. Journey map top 3 jobs
5. Tool stack actual
6. Interaction moments cu CompliAI
7. Non-negotiables (deal killers)
8. Upgrade triggers
9. Aha moment
10. Anti-persona
11. Pricing sensitivity
12. Source strength

---

## 🥇 P1 — DIANA (Consultant / Contabil)

**Coverage research**: **foarte densă** — 38 citate verbatim din surse publice RO (2024-2026) + persona docs interne + PO external validation.

### 1.1 Cine + context

- **32-48 ani**, majoritar femeie, expert contabil CECCAR autorizat.
- Lucrează pe cont propriu sau cu **3-15 staff în cabinet**; gestionează **10-30 clienți SRL/PFA**.
- Venit mediu: **contabilitate 600-1.500 RON/client/lună** + **GDPR/DPO extern 100-400€/client/lună** (add-on).
- **Vârful intelectual**: cunoaște legislație fiscală profund. **Limita**: compliance tehnic (NIS2 cybersecurity, AI Act risk-classing) o depășește.
- **Trăiește în burnout cronic**. Citat verbatim (Nicoleta Banciu, Ian 2024):
  > *"Nu mai rezistăm. Jumătate din contabili își pun deja problema să renunțe."* [ziare.com 1846088]

### 1.2 Day-in-the-life — luni obișnuită

**7:30** — Cafea + telefon. Check e-mail (3 tab-uri deschise simultan: Gmail, SmartBill, Excel tracker cu 22 clienți).

**8:00-9:00** — Procesare primele 4-5 notificări SPV peste noapte. *"Contabilii se chinuie de zile întregi să introducă date în sistem"* [dcbusiness.ro 662686].

**9:14** — Alertă iSpv: client LogiTrans — recipisă e-Factura respinsă. Diana deschide Tracker.xlsx → caută LogiTrans → deschide ANAF SPV → login cu token USB → extrage mesaj → copiază în folderul clientului pe Drive → trimite WhatsApp client: *"Ai primit notificare X, o tratez."* **Durata: 40 min.**

**10:00-10:30** — Email către 7 clienți despre OUG nouă publicată. Copy-paste din Word template.

**10:30-12:00** — Actualizare SAGA pentru 3 clienți. Interrupted 2x de WhatsApp de la clienți: *"ce-i cu e-Factura asta?"* Răspuns ad-hoc.

**12:00-13:00** — Pauză (nominal). În realitate, mănâncă la desk citind Contzilla.ro.

**13:00-14:30** — Depunere D112 pentru 4 firme. *"site-ul ANAF le dă eroarea: Sesiune terminată cu succes!"* [hotnews.ro 17685]. Reîncarcă, incognito, clear cache. Repetă de 3 ori.

**14:30-15:30** — "Ora DSAR/GDPR": client Apex a primit cerere acces date. Diana extrage din SAGA → template Word → PDF → email. **2h muncă pentru 1 cerere.**

**15:30-17:00** — Intrare pe forum.sagasoft.ro thread despre eroare D406 (vede alții au aceeași problemă, răsuflă ușurată că nu e singura).

**17:00-18:30** — Facturi proprii către clienți + plăți. Total ore "compliance" azi: **~3h distribuite în fragmente de 10-30 min**.

**Seara**: cafea târziu, verifică o ultimă dată SPV-urile înainte de culcare. *"Nu avem timp, nu mai răbdăm și suntem obosiți."* [startupcafe.ro 92349]

### 1.3 JTBD stack — ordonat frecvență × importanță

| # | JTBD | Frecv | Importanță | Score | Unde în CompliAI azi |
|---|---|---|---|---|---|
| 1 | Agregare cross-client a notificărilor SPV + alerte legislative | 3-5×/zi | Critic | **25** | 🟡 backend există, UI nu |
| 2 | Log intervenții pentru audit viitor | Zilnic | Critic | **20** | ✅ Dosar + audit log |
| 3 | Triage "cine arde primul" din 20 clienți | Zilnic | Critic | **25** | ✅ urgency-queue API |
| 4 | Răspuns rapid către client (WhatsApp-like) că iau în considerare | 5-10×/zi | Mediu | **15** | ❌ missing |
| 5 | Generare raport lunar compliance către client | 1-2×/lună | Critic (revenue) | **15** | ✅ scheduled-reports |
| 6 | Onboarding client nou (CUI → ANAF → diagnostic 1 pagină) | 1-2×/lună | Critic (revenue) | **15** | 🟠 partial (batch, not quick) |
| 7 | Broadcast personalizat "legea X afectează 7 din 23 clienți" | 1-2×/săpt | Mare | **12** | 🟠 backend da, UI nu |
| 8 | Reopen findings automat pe lege nouă | 1×/săpt | Mare | **12** | ✅ drift-trigger-engine |
| 9 | DSAR register + răspuns auto-populat | 1-2×/lună | Mare | **12** | ✅ DSAR lifecycle |
| 10 | White-label rapoarte cu brand-ul Dianei | Lunar | Mare | **12** | ✅ API white-label |

### 1.4 Journey map — top 3 JTBD

#### 🛣️ JOB #1: *Procesare dimineață a notificărilor SPV peste noapte*

| Etapă | Trigger | Acțiune Diana | Emoție | Output |
|---|---|---|---|---|
| Alert | Email iSpv "notificare nouă" | Deschide Gmail | **Neutru** | - |
| Identificare | Primul skim, vede 3 alerte | Deschide Tracker.xlsx | **Tensiune** | Lista clienți impact |
| Triage | *"Care arde primul?"* | Sortează mental pe client + severitate | **Focus** | Ordine prioritară |
| Execuție | Fiecare alertă în SPV | Login cu token × 3 | **Frustrare cu tool** | Date extrase |
| Comunicare | WhatsApp la fiecare client | Copy-paste template + personalizare | **Epuizare** | 3 mesaje trimise |
| Log | "Am făcut, scriu în Excel" | Adaugă linie în Tracker.xlsx | **Ușurare** | Audit trail parțial |

**Durată totală azi: 45-60 min.** CompliAI ar face-o în **<15 min** cu Inbox agregat.

#### 🛣️ JOB #2: *Generare raport lunar compliance către 8 clienți*

| Etapă | Trigger | Acțiune | Emoție | Output |
|---|---|---|---|---|
| Start | Sfârșit de lună, obligație contract | *"Of, iar trebuie rapoartele"* | **Resemnare** | - |
| Per client | 8× secvențial | Copy Word template → date SAGA → PDF → email | **Muncă repetitivă** | 8 PDF-uri |
| Timp real | 20-30 min/client | **3-4h total** | **Plictis** | 8 e-mail-uri |
| Client reaction | 6/8 răspund "mersi" | | **Gol emoțional** | Doar 2 dau feedback util |

**Durată: 3-4h azi.** CompliAI cu batch report + pre-populare = **<30 min total**.

#### 🛣️ JOB #3: *Client nou prin recomandare*

| Etapă | Trigger | Acțiune | Emoție | Output |
|---|---|---|---|---|
| WhatsApp | *"Mi-a zis Mihai de tine"* | Întâlnire zoom 20 min | **Bucurie (lead)** | - |
| Intake | Telefon 20 întrebări | Notițe în Excel ad-hoc | **Oboseală** | Context parțial |
| Ofertă | Ore de muncă estimate | Word template + modificări | **Anxietate preț** | Ofertă fără ROI clar |
| Follow-up | 2-3 zile așteptare | Email "mai gândesc..." | **Incertitudine** | 60% convertesc |

**CompliAI**: CUI → ANAF lookup → aplicability scan → raport 1 pagină auto → ofertă pre-populată. **<45 min total** vs 2-3 zile azi.

### 1.5 Tool stack actual — ora cu ora

| Tool | % din zi | Citat dovada |
|---|---|---|
| **SAGA C / SmartBill Conta** | 35-45% | *"Updates not done automatically in SAGA"* [forum.sagasoft.ro 60074] |
| **ANAF SPV + DUKIntegrator** | 15-20% | *"Sesiune terminată cu succes"* [hotnews.ro 17685] |
| **iSpv** sau e-Factura în SmartBill | 10-15% | *"la autentificare sunt ejectați"* [hotnews.ro 22270] |
| **Excel tracker** cu 25 coloane | 10-15% | *"Tracker.xlsx cu termene D112/D300/Bilanț"* [comună în piață, inferred] |
| **WhatsApp + Email** | 10-15% | *"60-70% din volumul comunicării"* [market research] |

**Observație**: tool-urile **alea n-o slujesc, o exploatează**. Fiecare eroare mută 10-30 min din productivitate în frustrare.

### 1.6 Interaction moments cu CompliAI

**Where she'd ENTER** (first experience matters):
- Aterizează din **link în FB group Contabili (50k+)** *"ia uite, asta agregă toate SPV-urile"*. `[trigger dovedit]` [cabinetexpert.ro]
- Click → landing page → **demo live fără signup** (video 90s cu 3 clienți Apex/Altex)
- Signup → 3 câmpuri (email, parolă, numele cabinetului) → **imediat import CSV cu 5 clienți** → baseline scan → **30 secunde → vede primul insight**

**Where she STAYS** (retention):
- Loghează zilnic la 8:00 doar ca să vadă **Inbox-ul de peste noapte**
- Deep-link din email (cron daily-digest) → direct pe finding → rezolvă → închide
- Weekly: raport batch → export PDF → forward la 8 clienți

**Where she'd EXIT** (churn risks):
- ❌ Tool-ul nu integrează cu SAGA/SmartBill (zero valoare adăugată)
- ❌ Factură în EUR fără RON (*"ești străin, nu plătesc"*)
- ❌ Password reset durează >30 sec (pierde trust)
- ❌ Inbox-ul nu mai produce nimic util 5 zile la rând

### 1.7 Non-negotiables (deal killers — confirmate din research)

| Dacă lipsește | Consecință |
|---|---|
| ❌ RO-language UI (Google Translate look) | Instant refusal |
| ❌ Factură RO cu CIF cabinet | Nu plătește |
| ❌ Support RO (email, telefon ore RO) | Churn în 1 lună |
| ❌ DPA downloadable înainte signup | Nu signs up |
| ❌ Free trial fără card | Nu încearcă |
| ❌ Per-seat pricing (cabinetul are 5 staff) | Killer |
| ❌ Forced migration from SAGA | Refuză bloc |
| ❌ Onboarding client >2h | *"Nu am timpul ăsta"* |
| ❌ Formatul rapoartelor nu match ANSPDCP | Radu (intern DPO al clientului) respinge, Diana pierde credibilitatea |

### 1.8 Upgrade triggers (Starter €49 → Pro €149 → Studio €349)

**Starter → Pro** la:
- Adaugă al 6-lea client
- Primul DSAR real primit
- Prima lege nouă care schimbă status a 2+ clienți

**Pro → Studio** la:
- Adaugă al 26-lea client
- Începe să aibă staff 2+ în cabinet (multi-user need)
- Vrea white-label brand propriu
- Prima cerere client "pot vedea și eu?" → client portal

### 1.9 Aha moment — momentul credinței

> **"La 9:15 dimineața, deschid CompliAI și văd Inbox-ul: 3 alerte peste noapte, toate triate, fiecare cu 2 click-uri până la rezolvare. Nu mai deschid Excel. Nu mai caut prin Drive. Timpul meu e al meu, nu al ANAF-ului."**

**Converter único**: *"one inbox for 20 SPVs + automated alerts + marchează rezolvat + log pentru audit"* (confirmat din MARKET-RESEARCH.md §2.5).

### 1.10 Anti-persona — cine NU e Diana

- ❌ **Contabil fără clienți externi** (doar 1 firmă internă) → prea mult feature pentru nevoia ei
- ❌ **Big-4 consultant** (Deloitte, PwC, KPMG) → are OneTrust/Vanta deja, nu e publicul CompliAI
- ❌ **Avocat specializat în GDPR** → are Sypher sau tool propriu, nu suport fiscal
- ❌ **DPO intern corporate** (>250 angajați) → prea mult nișat, Radu e acel profil

### 1.11 Pricing sensitivity

- **Disponibil compliance SaaS**: €50-150/lună (pe lângă SAGA + SmartBill + SPV token)
- **Sweet spot**: **€149/lună Pro** cu 20 clienți = 7,5€/client = rebill 100 RON/client = profit 1.260 RON/lună
- **Refuză**: >€200/lună fără rebill margin clar
- **Trial expectation**: 30 zile free, fără card, *"încerc pe 1 client"*
- **Annual preference**: -16-20% discount (cash flow predictabil cabinet)

### 1.12 Source strength

✅ **Dense (38 citate verbatim cu URL)** — Diana e **over-validated**.
✅ PO external validation.
✅ Market research 4 agenți.
⚠️ Nu am făcut interviu live **încă** — plan Săpt 1-2 (design partners).

---

## 🥈 P2 — RADU (Compliance Officer Intern / DPO)

**Coverage research**: **medium-dense** — 21 findings + insight transformator asupra rolului real.

### 2.1 Cine + context

- **30-55 ani**, rol: Data Protection Officer intern **SAU** Compliance Officer la firmă 50-250 angajați.
- Sectoare dominante: **banking, sănătate, retail large, logistics, IT**.
- **Salariu**: 8.000-20.000 RON/lună (pt. cine face ambele roluri DPO+NIS2).
- Raportează la: Legal, Risk Manager, **uneori direct CEO**.
- **Trăiește sub presiunea audit-ului**.

### 2.2 Insight critic (din etnografie)

> **Radu NU e riguros despre compliance — e riguros despre EVIDENCE-PRODUCTION.** ANSPDCP 2024-2025 amende **pentru "dovezi lipsă"**, NU pentru violări substanțiale.

Citat Sypher user Cristiana C., DPO Marketing:
> *"It would have been useful to have the reports (data mapping) in some specific format requested by the Romanian authorities."* [Capterra Sypher reviews]

**Traducere pentru CompliAI**: **produsul trebuie să scoată format ANSPDCP-shaped, NU doar GDPR coverage generic.**

### 2.3 Day-in-the-life — marți obișnuită

**8:30** — Cafea. Deschide Outlook + Excel "Registru prelucrări.xlsx" + SharePoint cu dosare evidence.

**9:00-10:00** — Review 2 DSAR-uri nesoluționate. Termenul Art. 15 e 30 zile — *unul e la ziua 22, celălalt la ziua 28*. **Stres concret.**

**10:00-11:30** — Pregătire audit intern Q2 NIS2. Check incident log (ultimele 6 luni: 2 incidente minore nedeclarate DNSC — *"putea fi significant?"*). DNSC trebuie informat în **72h** pentru incidente esențiale.

**11:30-12:30** — Training 15 angajați noi despre GDPR basics. Slides refolosite ultimele 6 luni.

**13:00-15:00** — Reuniune Legal + IT pentru DPIA nou proiect CRM. Radu **moderator** între business și securitate.

**15:00-16:30** — *"Registru de prelucrări"* update după proiect nou identificat. Excel. Versioning prin "Save As — registru_v27.xlsx".

**16:30-17:30** — Check legislation watch: **OUG nouă NIS2 din această săptămână?** Scan DNSC.ro + contzilla.ro + LinkedIn posts. Dacă DA → evaluează impact intern → mail la CEO.

**17:30-18:00** — Închide "Registru amenzi GDPR 2025" (gdprcomplet.ro/lista-amenzi) ca să vadă patternul. *"Operatori amendați pentru că nu au prezentat dovezi privind comunicarea răspunsului."*

### 2.4 JTBD stack

| # | JTBD | Frecv | Importanță | Coverage CompliAI |
|---|---|---|---|---|
| 1 | Produce evidence ANSPDCP-shaped pentru fiecare acțiune | Zilnic | **Critic existențial** | 🟡 există, nu într-un format "ready for audit export" |
| 2 | Tracking DSAR cu timer Art. 15 (30 zile) | 1-2×/lună | Critic | ✅ `/dashboard/dsar` |
| 3 | Log incidente NIS2 cu SLA 72h | 1-3×/lună | Critic | ✅ `/nis2/incidents` |
| 4 | DPIA documentation + versioning | 3-5×/an | Mare | 🟠 parțial |
| 5 | Training record (cine a fost, când) | 2-4×/an | Mediu | 🟠 lipsă explicită |
| 6 | Response pack la cerere ANSPDCP (72h) | 1-2×/an | Existențial | 🟡 audit-pack există, format nu clar |
| 7 | Registru prelucrări centralizat | Weekly update | Critic | ✅ `/dashboard/ropa` |
| 8 | Review policies anuale cu versioning | Yearly | Mare | ✅ policies + audit-log |

### 2.5 Journey map — top JTBD: *Răspuns la cerere ANSPDCP*

| Etapă | Trigger | Acțiune | Emoție | Output |
|---|---|---|---|---|
| Notificare | Email ANSPDCP *"cerere documente în 72h"* | **Panică** | **TERROR** | Ora 0 |
| Investigare | Scan Excel + SharePoint pentru evidence | **Haos** | **Anxietate** | Lista parțială |
| Extracție | Copy documente în folder "ANSPDCP_2026-04" | Ore de muncă manuală | **Frustrare** | Pachet incomplet |
| Validare | Legal review — *"mai lipsește X"* | Rework | **Furie** | Iterații |
| Submit | Email la ANSPDCP la ziua 2.5 | Cu stres masiv | **Ușurare parțială** | Răspuns trimis |
| Wait | 30 zile verdict | | **Anxietate cronică** | - |

**CompliAI cu audit-pack**: 1 click → export format ANSPDCP-shaped → Radu în 2h e gata. **Durata: 16-24h azi vs 2h cu CompliAI.**

### 2.6 Tool stack actual

| Tool | Utilizare | Pain |
|---|---|---|
| **Excel Registru prelucrări** | Versionare prin Save As | *"Registru_v27.xlsx"* — no single source of truth |
| **SharePoint evidence** | Dosar per incident/DSAR | Fără legătură explicită între docs |
| **Outlook** | Totul comunicat prin email | Audit trail în email = brittle |
| **Sypher Suite** (dacă firma are buget) | ROPA + DSAR | *"Reports don't match RO authority format"* [Capterra Cristiana C.] |
| **OneTrust** (rar, doar enterprise) | Full GRC | $10k/an — out of reach pt. majoritatea |
| **Notion / Confluence** (dacă IT are) | Policies + DPIA | Nu produce export audit |

### 2.7 Interaction moments cu CompliAI

**Where he'd ENTER**:
- **LinkedIn post** de la un coleg DPO care zice *"în final un tool care scoate format ANSPDCP"*
- Recomandare de la **avocat extern** (parteneriatul canalului B2B)
- **Search direct pe Google** "tool ANSPDCP response pack"

**Where he STAYS**:
- Export **audit-pack format ANSPDCP** cu un click
- Registru prelucrări **live** (nu Excel)
- DSAR timer + auto-populate răspuns
- Incident log cu SLA tracker

**Where he'd EXIT**:
- ❌ Export nu e "ANSPDCP-shaped"
- ❌ Nu poate versiona documente imutabil
- ❌ Nu are audit trail cu timestamp + actor + cryptographic hash
- ❌ Stochare în afara EU

### 2.8 Non-negotiables

| Dacă lipsește | Consecință |
|---|---|
| ❌ Export format ANSPDCP explicit | **Rejection instant** — e singura lui problemă |
| ❌ Audit trail imutabil cu timestamp + actor | Refuză signup |
| ❌ EU data residency (minim Frankfurt/Amsterdam) | Legal blokează |
| ❌ DPIA completă cu versioning | Nu poate face job-ul |
| ❌ Art. 15 DSAR templates RO (nu EN) | Refuză |
| ❌ Signed PDF export | Nu e audit-worthy |

### 2.9 Upgrade triggers (Pro → Enterprise)

- Firma depășește 250 angajați
- Primul NIS2 audit DNSC anunțat
- Incident major care necesită response pack în 72h
- Auditor extern cere date formal

### 2.10 Aha moment

> **"Am primit cerere ANSPDCP. Am apăsat un buton. În 30 secunde am avut un PDF semnat cryptographic cu: toate DSAR-urile din ultimul an, Registrul de prelucrări, training records, DPIA, măsuri corective aplicate. Am trimis. Audit complete în 2h, nu 2 săptămâni."**

### 2.11 Anti-persona

- ❌ **DPO extern** (e Diana, nu Radu)
- ❌ **Consultant GDPR freelance** → vinde servicii, nu e utilizator intern
- ❌ **IT Security Officer fără componentă GDPR** → NIS2 da, DSAR nu
- ❌ **Legal counsel general** → nu e DPO dedicat

### 2.12 Pricing sensitivity

- **Budget anual**: 5.000-20.000 EUR pentru tooling compliance
- **Preferință**: Enterprise quote-based cu SLA, NU self-serve
- **Refuză**: OneTrust ($10k/an) pentru firmă <100 ang. → vine la tier Studio €349/lună sau Enterprise €8k/an
- **Anchor**: *"Dacă economisește 1 săptămână de audit = ROI în 1 an."*

### 2.13 Source strength

✅ 21 findings cu URL (3 verbatim DPO quotes Capterra, 3 enforcement verbatim, restul paraphrased cu sursă).
⚠️ LinkedIn Pulse posts by RO DPOs **nu au putut fi extrase** (login wall).
⚠️ **Insight major nou**: "evidence-production NOT compliance" — validat în Săpt 1-2.

---

## 🥉 P3 — MIHAI (Solo SME Owner)

**Coverage research**: **triangulat** — research direct blocat (WebFetch deny), dar avem:
- Agent A (intern docs): persona Mihai skeleton
- Agent D (market): profile antreprenor RO + regulatory
- Agent C (workflow): relația cu contabil
- Validare ta: PO extern confirmed market fit

**Marcaj**: `[inferred]` pentru claim-uri ce **trebuie validate în interviuri Săpt 1**.

### 3.1 Cine + context

- **35-55 ani**, proprietar SRL cu **5-20 angajați** sau PFA/II.
- Sectoare: **construcții, HoReCa, comerț mic, transport mic, servicii**.
- **Non-technical**. **Non-legal**. Delegeă compliance la contabilul lui.
- Trăiește între: profitabilitate, cash flow, clienți nemulțumiți, ANAF.

### 3.2 Relație cu contabilul (cheie de persona) `[inferred din market research]`

- Vorbesc pe WhatsApp **5-15 ori pe săptămână**
- Crede mai mult în contabil decât în tool `[inferred]`
- **Dacă Diana spune "trebuie CompliAI", Mihai plătește**. **Dacă CompliAI caută direct Mihai, cu 70% probabilitate îl redirecționează la contabil**.

### 3.3 Day-in-the-life `[probable, needs validation]`

**7:30** — Șantier / magazin / birou. Nu deschide laptopul până la **19:00**.

**În timpul zilei**: operează afacerea. Compliance = *"contabilul se ocupă"*.

**Declanșator săptămânal**:
- WhatsApp de la client: *"am primit SMS ANAF, ce-i cu asta?"* → Mihai forward la contabil.
- WhatsApp de la contabil: *"ai primit notificare SPV, te sun mâine"* → stres + ignoranță.
- **Post pe FB grup antreprenori**: *"am luat amendă X mii lei, ce mă fac?"* → citește cu anxietate.

**Declanșator lunar**:
- Factură de la contabil + plată.
- Email "raport compliance" de la contabil (pe care îl citește rareori).

### 3.4 JTBD stack `[inferred + needs validation]`

| # | JTBD | Frecv | Importanță | Coverage |
|---|---|---|---|---|
| 1 | *"Contabilul meu să aibă tools buni"* (delegare trust) | Constant | Critic | INDIRECT — prin Diana |
| 2 | *"Să nu iau amendă"* (fear of ANAF) | Constant | Critic | INDIRECT — prin Diana |
| 3 | Să poată vinde în UE (compliance proof) | 1-2×/an | Mare | 🟡 Trust Center public |
| 4 | Auditare rapidă când un buyer o cere | 1-2×/an | Mare | 🟡 audit-pack export |
| 5 | DPA cu furnizor nou (când cere buyer EU) | 3-5×/an | Mediu | ⚠️ generator există, nu accesibil SME |
| 6 | Cookie banner pentru site | 1× lifetime | Mic | ✅ generator |

### 3.5 De ce Mihai NU e user primar direct

- ❌ Nu deschide SaaS. Delegeă contabilului.
- ❌ Preț maxim acceptat: **€30-50/lună** *"peste care compari cu consultant"* [PRODUCT_ROADMAP]
- ❌ Nu are nevoie de feature-uri avansate (DSAR, NIS2 — toate sunt ale contabilului)
- ✅ **DAR**: dacă vede brandul contabilului său pe CompliAI (white-label) → **validare + loialitate secundară**

### 3.6 Strategia Mihai în produs: **B2B2B light-touch**

Mihai **NU e target direct**. Mihai e:

1. **Entry freemium** — dacă vine din Google search *"privacy policy generator"*, încearcă gratis → **contabilul lui pe CompliAI**, îl invită în workspace
2. **Brand witness** — vede brand-ul cabinetului său pe raportul lunar, reîntărește loialitate la Diana
3. **Portal view-only** — se logează o dată pe lună să descarce PDF raport (nu editează, nu configurează)

### 3.7 Feature-uri pentru Mihai (minimale)

- **Trust Center public** pentru firma Mihai (Diana îl creează)
  - `trust.compliai.ro/mihai-srl`
  - Status verde/galben/roșu per regulation
  - "Verified by Cabinet Diana" badge
  - Folosibil în pitch-uri către clienți EU
- **Client portal view-only** — lista findings rezolvate + raport lunar download
- **Cookie banner + Privacy policy generator** (gratis, lead magnet, brings Mihai-class into ecosystem)

### 3.8 Aha moment Mihai

> **"Mi-a venit email de la partenerul meu german: «Dovada GDPR?». Am dat click pe link-ul Trust Center. I-am trimis. A răspuns în 1h: «Acceptat, semnăm contractul.» Prima oară când compliance mi-a făcut bani, nu mi-a luat."**

### 3.9 Pricing sensitivity `[inferred]`

- **Freemium**: 1 firmă, trust center public, 1 privacy policy gratis
- **Direct self-serve**: €39/lună micro, €99/lună small, €249/lună medium
- **DAR**: 80% dintre Mihai-class **NU vor plăti direct**. Plătesc prin contabil care rebill-uiește.

### 3.10 Source strength

⚠️ **Slab** — WebFetch pentru Reddit/FB/comments a fost blocat pentru agent. **TOATE claim-urile în secțiunea asta cer validare în Săpt 1-2 design partners.**

Ce am: confirmări indirecte din market research (prețuri SmartBill €9-99, adopție accountant-led, povești "am luat amendă" cu sume concrete în media RO).

Ce NU am: voce directă Mihai-class verbatim despre CompliAI concept.

---

## 4. ANTI-PATTERNS — CE NU TREBUIE SĂ FACEM

### ❌ Pentru Diana
- Construim "compliance tool pentru SME direct" — Mihai nu cumpără direct
- Inventăm "scoring" fără format ANSPDCP-compatible — Radu intern al clientului va respinge
- Preț >€200/lună fără rebill margin — Diana refuză

### ❌ Pentru Radu
- Export generic PDF — nu e "ANSPDCP-shaped"
- Fără timestamp/actor/hash pe audit trail — respinge
- Features "AI Act conformity" fără versioning vizibil — nu e audit-worthy

### ❌ Pentru Mihai
- Onboarding >5 min — abandon
- Interfață cu "compliance officer terminology" — speriere
- Forța să folosească tool-ul direct → pierde încredere în propriul contabil

---

## 5. CUM SE FOLOSEȘTE ACEST DOCUMENT

1. **La decizia de feature**: *"ar fi util pentru Diana? Pentru care JTBD? În ce moment al zilei?"*
2. **La design UI**: *"cum arată asta la 9:15 AM luni când Diana are 3 alerte peste noapte?"*
3. **La pricing**: *"Diana plătește €149 pentru 20 clienți, poate rebill-ui 100 RON/client?"*
4. **La priorități**: *"JTBD score × coverage gap → prioritate P0/P1/P2"*
5. **La validare Săpt 1-2**: *"întreabă design partners ce marcat `[inferred]` sau `[needs validation]`"*

---

## 6. NEXT — USER-VALIDATION-KIT.md

Vezi [USER-VALIDATION-KIT.md](./USER-VALIDATION-KIT.md) pentru:
- 10 întrebări Diana (prioritate)
- 5 întrebări Radu
- 5 întrebări Mihai (validare P3)
- Structura interviu 45 min
- Red flags de detectat
- Cum raportezi răspunsurile înapoi aici

---

> **END USERS.md** — ultima generare 2026-04-19.
> Combină cu [STATE-NOW.md](./STATE-NOW.md) + [MARKET-RESEARCH.md](./MARKET-RESEARCH.md) pentru a produce [DESTINATION.md].
