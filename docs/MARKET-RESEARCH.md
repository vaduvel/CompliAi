# MARKET-RESEARCH.md — CompliAI (2026-04-19)

> **Documentul ăsta e adevărul despre piață, concurență, pricing și canal.**
> Consolidat din 4 agenți paraleli: evidențe interne (199 docs), concurenți RO+EU, buying behavior consultant RO, market size + regulatory 2026.
> Rulat împreună cu [STATE-NOW.md](./STATE-NOW.md) pentru a produce [DESTINATION.md].

---

## 0. EXECUTIVE SUMMARY (la rece)

**Piața**: **white space real** — **niciun SaaS RO** nu acoperă azi **consultant multi-tenant + GDPR + e-Factura + NIS2 + AI Act + DORA** într-un singur produs la **€50-300/lună**. Sypher Suite e cel mai apropiat (doar GDPR, enterprise €247-529/lună). Huddle.ro are multi-tenancy + whitelabel dar FĂRĂ compliance.

**Dimensiune piață RO**:
- **~54.000 contabili CECCAR** activi (2023 oficial)
- **~18.000 adresabili** (top 1/3 cu 10+ clienți)
- **TAM conservative Y3**: **€1.5-2.2M ARR**
- **TAM optimistic Y5 + EU expansion**: **€8-12M ARR**
- **Ceiling teoretic 4-country**: **~€20M ARR**

**Fereastra de oportunitate**: **12-18 luni** până când Huddle sau SmartBill adaugă compliance. **Moatul e TEMPORAL, nu tehnologic**. Nu polish-uiești UI — cucerești canalul.

**Trigger dominant 2026**: **e-Factura B2C (Jan 2026)** — **mecanic, NU discreționar** (amendă per factură). Vinde singur.

**Pricing sweet spot**: **€149/lună Pro** pentru consultant cu 6-25 clienți. Trebuie să permită rebill de 100-300 RON/client către client — altfel consultantul absoarbe și cancel-ează.

**Threat-ul #1**: **Huddle.ro (Cassa)** — deja are whitelabel + multi-tenant + e-Factura + canal cabinete. O tab "Compliance" = 1 quarter de muncă. Dacă se mișcă, pierdem.

---

## 1. PIAȚA — DIMENSIUNE, TRIGGERI, URGENȚĂ

### 1.1 TAM Romania (solo)

| Canal | Număr | Penetrare realistă | ARR conservative |
|---|---|---|---|
| Contabili cu 10+ clienți | ~18.000 | 5% (900) × €150/lună | **€1.62M** |
| SME-uri direct (10-49 ang.) | ~47.000 | 1% (470) × €99/lună | **€558k** |
| SME medium (50-249 ang.) | ~10.000 | 2% (200) × €249/lună | **€598k** |
| Enterprise NIS2 esențiale | ~3.500 | 3% (105) × €8k/an | **€840k** |
| **TOTAL RO Y3 realistic** | | | **~€3.6M ARR** |

### 1.2 Expansion EU (Y5)

| Piață | SME-uri | Contabili | Prioritate |
|---|---|---|---|
| 🇧🇬 Bulgaria | 430k | 10k ICPA | **1** (cross-border similarity, NIS2 + e-invoicing 2026 identic, scenă compliance weak) |
| 🇵🇱 Polonia | 2.3M | 45k+26k | 2 (mare dar competiție cu tooling local) |
| 🇮🇹 Italia | 4.3M | N/A | 3 (cea mai mare densitate fine GDPR în EU >€50M/an) |
| 🇪🇸 Spania | 3.2M | N/A | 4 (AEPD cel mai agresiv DPA, >400 decisions/an) |
| 🇩🇪 Germania | 2.6M | N/A | 5 (bar înalt, sales cycle lung) |

**Ceiling EU 4 țări × 5% penetrare**: ~€20M ARR.

### 1.3 Regulatory urgency (ranking buying pressure 2026-2027)

| # | Regulation | Deadline | Universe | Amendă | Trigger strength |
|---|---|---|---|---|---|
| 1 | 🔴 **e-Factura B2C** | **1 Jan 2026** | Toate SRL cu vânzări B2C | 1-10k lei **per factură** | **MAXIM** — mecanic |
| 2 | 🟠 **eTVA + SAF-T D406** | Ongoing 2025 | Toate firme, micro incluse | 1-5k lei + TVA blocat | Continuă |
| 3 | 🟠 **NIS2 esențiale/importante** | Registrare noi 2025, măsuri full mijloc 2026 | ~3.500 entități esențiale | **€10M sau 2% CA** | Mare per-deal, universe mic |
| 4 | 🟡 **AI Act** | Obligații principale **2 Aug 2026** | High-risk + GPAI users | **€15-35M / 3-7% CA global** | Crescândă, awareness scăzut |
| 5 | 🟢 GDPR | Continuu | Toate firmele | €20M / 4% CA | Baseline, nu trigger |
| 6 | 🟢 DORA | Jan 2025 | Doar fintech-uri | Variabil | Niș, nu MVP |
| 7 | 🟢 CSRD | Gradual 2025-2027 | Large + listed | - | Niș |
| 8 | 🟢 Accessibility Act | 28 Jun 2025 | E-commerce, bancar | Variabil | Secundar |

### 1.4 Enforcement intensity reală (RO)
- **ANSPDCP**: 60-80 amenzi/an publicate; ~€1.2-1.5M cumulat; mediu €8-15k; vârfuri €200k-1M (UniCredit, Hora Credit, Samsung RO)
- **ANAF e-Factura**: >50.000 notificări în primul semestru 2025; >20M lei cumulat amendabil
- **DNSC NIS2**: enforcement real din Q2 2026 după grație

### 1.5 Fine visibility (cazuri concrete 2024-2025)
- UniCredit Bank RO — **€130k** (ANSPDCP, mai 2024)
- Hora Credit IFN — **~€400k** cumulate
- Samsung Electronics RO — **€60k** (2024)
- Spital București — **€20k** scurgeri date pacienți (2025)
- Platformă e-commerce targeting minori — **€150k** (2025)

---

## 2. VALIDARE UTILIZATOR — PAIN REAL

### 2.1 Citate din feedback intern (surse: PRODUCT_ROADMAP.md, feedback.md, audit-uri)

- *"Spune-mi CE trebuie să fac pentru FIRMA MEA, nu o listă generică"* (**personalizare**)
- *"Generează-mi documentele completate cu datele mele"* (**automatizare**)
- *"Decodează erorile ANAF în română cu fix concret"* (**ANAF decoder**)
- *"Alertează-mă când ceva se schimbă, nu mă pune să mă loghez"* (**proactive**)
- *"Acoperă GDPR + AI Act + e-Factura într-un singur loc"* (**unified**)

### 2.2 Misconception = conversion hook
> *"Avem cookie banner, suntem conformi."*
**NU.** Un audit care arată gap-ul real → conversie imediată. Asta e cea mai puternică demo tactic.

### 2.3 Validare profesionistă (rece, externă)
- **PO dintr-un alt produs** (feedback user): *"prinde — o paște o amendă pe o firmă veche ce are ceva ne reguli"*
- **Traducere**: validare din **afara echipei**. Un PO vede 100 produse/an, recunoaște market fit.

### 2.4 Buying triggers reali (ordonați descendent frecvență)

1. **Notificare SPV** la client (decizie impunere, somație, e-TVA discrepancy) — **3-5×/săpt pe portofoliu**
2. **Termen calendaristic** (25 luna, 30 iunie bilanț, SAF-T sfârșit lună) — **zilnic**
3. **Modificare legislativă** (OUG, ordin ANAF, ordin DNSC) — **1-2×/săpt**
4. **Client întreabă pe WhatsApp** ("mi-a scris ANSPDCP") — **5-10×/zi**
5. **Anunț inspecție ANAF** la client — **1-2×/lună pe portofoliu**
6. **Eroare e-Factura/SPV** (recipisă respinsă) — **2-5×/săpt**
7. **DSAR primit de client** — **1-2×/lună**
8. **Audit anunțat** — **1-3×/an**

### 2.5 "OMG YES" feature
> *"Un dashboard multi-client care îmi monitorizează AUTOMAT toate cele 20 SPV-uri ale clienților mei și mă alertează în timp real — notificare de conformare, decizie de impunere, recipisă cu eroare la e-Factura, schimbare de status — cu butonul «marchează rezolvat» și log per client pentru audit."*

Adică **"one inbox pentru 20 SPV-uri" + alerte legislative push + auto-mapping clienți afectați**.

Al doilea "yes finally": **generator DPA/notificări breach pre-populate cu datele clientului**.

### 2.6 Personas refinate

| Persona | Cine | ARPU | Trigger zilnic | Tools existente |
|---|---|---|---|---|
| **Mihai** (solo SME) | Owner SRL 5-10 ang. | €30-50/lună (sens) | "Am primit SMS de la ANAF" / "Contabilul mi-a zis să..." | Email, SMS, WhatsApp cu contabil |
| **Diana** (consultant, **P1**) | Contabil cu 10-30 clienți | **€49-349/lună** (payable) | Cron zilnic: "3 alerte SPV peste noapte" | SAGA/SmartBill (35-45%), ANAF SPV (15-20%), Excel (10-15%), WhatsApp (10-15%) |
| **Radu** (compliance intern) | DPO intern la 50-250 ang. | €150-500/lună per workspace | Audit anunțat, DSAR primit, incident NIS2 | OneTrust light, Excel, Outlook |

---

## 3. CONCURENȚĂ — WHITE SPACE CONFIRMAT

### 3.1 Concurenți direcți RO (multi-tenant consultant)

| Nume | URL | Scope | Target | Pricing | Strengths | Weaknesses |
|---|---|---|---|---|---|---|
| **Sypher Suite** | sypher.eu | GDPR + cookie + ISO light | DPO, consultant multi-client | **€247-529/lună** ROPA + Enterprise; cookie €0-19/site | Mature RO, Bucharest, 7+ ani, multi-user | **GDPR-only**, fără e-Factura/NIS2/AI Act/DORA; preț enterprise |
| **MyBiz GDPR** (Setrio) | setrio.ro | GDPR docs + DPO audit | SME + DPO consultants | Lunar undisclosed "accessible" | Pur RO | **Doar GDPR**, fără multi-tenant dashboard |
| **GDPR Complet** | gdprcomplet.ro | Audit + DPO extern + templates | 800 firme (mix SME + public) | Services-led, NU SaaS | Brand, public sector | **NU e software** — consultanță cu templates |
| **Kit GDPR** | kitgdpr.ro | GDPR + AML + ESG + CSRD brokers | Brokeri asigurări | Pachete e-commerce | Vertical focus | **NIȘ** (asigurări), nu multi-tenant |
| **DPO Consulting** | dpoconsulting.ro | DPO extern services | SME-uri | Min €350/pachet | 7 ani experiență | **Services**, nu SaaS |
| **IT Protection** | itprotection.ro | DPO extern + monitoring | SME-uri | DPO €100/lună, monitoring €40/lună | **Preț scăzut entry** | Fără portal advertised |
| **NeoPrivacy** | neoprivacy.ro | GDPR implementation + training | SME-uri | Custom | DPO trainer cunoscut | **Services**, nu platformă |

**VERDICT**: **Niciun concurent direct real.** Sypher e cel mai aproape dar anchored la GDPR + enterprise price. **White space real.**

### 3.2 Amenințări adiacente

| Nume | Scope | Threat level | De ce |
|---|---|---|---|
| **Wolters Kluwer GDPR Soft** | GDPR docs | **Medium-High** | **Deține canalul de legal/accountant** — iDrept subscribers. Ar putea bundla GDPR mâine. |
| **Iubenda** | Cookie + privacy policy | Low-Medium | 150k clienți internațional, default pentru web agencies RO. **Surface only** — fără ROPA/DPIA. |
| **iSPV.ro** | e-Factura automation | Low | Single-regime, nu consultant-facing |
| **Termene.ro** | Company data + tax calendar | **Medium** | Deja în workflow contabil — ar putea adăuga GDPR/NIS2 tab |
| **Copla** | NIS2 + GRC + fractional CISO | **Medium** | Targetează același NIS2 pain, nu multi-tenant consultant |

### 3.3 International top-down (Vanta, OneTrust, Drata)

| Nume | Pricing min | RO relevance |
|---|---|---|
| **OneTrust** | **$10-60k/an** | Enterprise only, fără e-Factura |
| **Vanta** | **$8k/an** entry | Popular cu RO startups tech, **fără multi-client console**, fără e-Factura |
| **Drata** | **$10k/an** | Same |
| **Secureframe** | **$7.5k entry, $20.5k avg** | Same |
| **TrustArc** | Enterprise | Same |
| **Hyperproof** | Enterprise NIS2 | Fără RO localization |

**Niciun jucător internațional** are RO-language legal bases (ANSPDCP guidance, ANAF e-Factura, DNSC NIS2 Orders, CNVM/BNR DORA). **Niciunul** targetează ceiling-ul €50-300/lună consultant.

### 3.4 Contabil adjacent (Diana's existing stack) — **threat-uri LATENTE**

| Tool | Compliance azi | Ar putea adăuga GDPR mâine? |
|---|---|---|
| **SmartBill Conta** | e-Factura ✅, **NU** compliance console | **HIGH RISK** — dacă bolt-ează "Compliance" tab = **game over** pentru e-Factura+ play |
| **SAGA** | e-Factura, SAF-T, D406 ✅ | **Medium** — desktop roots, slow to ship SaaS |
| **Keez** (Visma-owned) | Full BPO + e-Factura + SAF-T | **High** — Visma are compliance modules în Nordics, poate importa |
| **Huddle (Cassa)** | CRM + e-Factura + **whitelabel** pentru cabinete + arhivă digitală | **VERY HIGH** — **cel mai apropiat UX competitor** pentru "consultant multi-tenant". Are whitelabel + canal cabinete. Dacă adaugă GDPR/NIS2/AI Act = **ne bate pe distribuție**. |
| **Contzilla / CabinetExpert** | Content + tax calendar | Low — publisher, nu SaaS |

### 3.5 White-space — analiza brutală

**Moat real** (ranked descending strength):
1. 🟢 **Time window** — 12-18 luni până când Huddle/SmartBill mișcă
2. 🟢 **CECCAR partnership** — nu există încă software partner oficial → ușa deschisă
3. 🟢 **Community presence** (Contabili pe FB 50k+, e-Factura group 34k) — nu are nimeni prezență dedicată compliance
4. 🟢 **Data network effect** — benchmark drift-uri pe 500+ clienți RO SME = nimeni nu are
5. 🟡 **RO legal bases** (ANSPDCP, DNSC Orders, CNVM DORA) — greu de copiat în <6 luni
6. 🟡 **Consultant UX** (portfolio, drift, evidence library)
7. 🔴 **Docs generation** — anyone can do it cu Claude
8. 🔴 **Cookie consent** — commodity
9. 🔴 **e-Factura integration** — SmartBill/SAGA vor bate oricând pe ANAF plumbing

### 3.6 Top 3 threats — ranked cu mitigare

1. **🥇 Huddle.ro (Cassa) — HIGHEST**
   - Are: whitelabel + multi-tenant + cabinete + e-Factura
   - Bolt-on "Compliance" tab = 1-2 quarters engineering
   - Same ICP (cabinete contabile 10-30 clienți)
   - **Mitigare**: out-ship cu GDPR+NIS2+AI Act+DORA **în următoarele 6 luni**

2. **🥈 SmartBill — HIGH (distribution threat)**
   - Dominant brand, live în FB groups, parteneriate content (Contzilla, ASE)
   - Dacă ship-uiesc compliance add-on sau OEM-uiesc Sypher = pierd canalul
   - **Mitigare**: integrează cu SmartBill (read-only data import), poziționează *"compliance layer pe top of your invoicing"*

3. **🥉 Sypher Suite — MEDIUM (product threat)**
   - Singur competitor real platform RO
   - Mature GDPR, multi-language
   - Dacă adaugă e-Factura/NIS2 modules sau drop price consultant-tier = închide gap-ul rapid
   - **Mitigare**: own narrative-ul *"multi-regime"* și price point €50-300/lună **înainte** să reacționeze (sunt anchored la €247-529)

---

## 4. BUYING BEHAVIOR — CUM CUMPĂRĂ DIANA

### 4.1 Flow 5-step cumpărare

1. **Trigger event** — client ia SMS ANAF, deadline nou (e-Factura Jan 2026), peer menționează amendă în CECCAR regional meeting
2. **Passive scanning** — contabilul.ro, avocatnet.ro, legestart.ro + 2-3 Facebook groups
3. **Peer validation** — post în closed FB group *"ce folosiți pentru evidența GDPR?"* → 5-15 replies în 48h
4. **Shortlist 2-3 tools** — ERP vendor recommendation (SAGA/SmartBill/Nexus/WinMENTOR) + peer mention
5. **Trial + client billing decision** — test pe 1 "friendly client" → absorb costul SAU pass-through ca "compliance service" în retainer (150-400 RON/lună/client)

### 4.2 Trust signals matrix

| Signal | Required | Nice to have |
|---|---|---|
| **RO-language UI** (not Google-translated) | ✅ | |
| **Factură în RON cu CIF/CUI firmă** | ✅ | |
| Support RO (email/telefon, ore RO) | ✅ | |
| EU data residency (Frankfurt/Amsterdam OK) | ✅ | |
| RO data residency specific | | ✅ |
| **DPA downloadable înainte de signup** | ✅ | |
| CECCAR mention / partner badge | | ✅ (strong) |
| ANSPDCP public cases / testimonials | | ✅ |
| Founder vizibil pe LinkedIn RO background | | ✅ (strong) |
| **Free trial fără card** | ✅ | |

### 4.3 Red flags — instant refusal/churn
- ❌ Factură în EUR fără opțiune RON
- ❌ Fără suport RO sau doar chat bot
- ❌ **Migrare forțată de la SAGA/SmartBill** — trebuie integrare, nu înlocuire
- ❌ Onboarding >2h/client (contabilii nu au timp)
- ❌ Date pleacă din EU sau fără DPA vizibil
- ❌ **Pricing per seat în cabinet** (cabinete au 3-15 staff sharing logins → per-seat killer)
- ❌ Fără free trial sau trial cu sales call
- ❌ UI care "arată străin" (screenshots SV, English-only demo)

### 4.4 Rule of thumb pricing contabil
- Contabilii plătesc **maxim 100-150 RON/client/lună** pentru compliance add-on
- **DOAR DACĂ** pot rebill-ui clientul la **200-400 RON**
- Peste → **absorb** sau refuză. **Pricing + rebill margin = pâinea GTM.**
- Annual billing cu 15-20% discount = standard + preferat (cash flow cabinet)

---

## 5. CANAL — CECCAR + FB + RESELLER

### 5.1 Community venues ranked

| Venue | Dimensiune | Engagement | CompliAI prezență azi |
|---|---|---|---|
| **Contabili pe Facebook** | **50.000+ membri** | Highest | ❌ Zero |
| **e-Factura ANAF FB** | **34.000+ membri** | High, SmartBill active | ❌ Zero |
| **forum.sagasoft.ro** | Activ zilnic | High — accountants | ❌ Zero |
| contzilla.ro, avocatnet.ro, legestart.ro | Authority content + comment sections | Medium | ❌ Zero |
| **LinkedIn RO influencers** (Adrian Bența, Cornel Grama, Nicoleta Apostol) | 10-50k followers each | Drives SMB awareness | ❌ Zero |
| **CECCAR regional events** + **Tax & Finance Forum** + **PwC/Deloitte/EY conferences** | High-intent low-volume | Medium | ❌ Zero |
| Reddit r/Romania + r/antreprenoriRO | Growing | Low-Medium | ❌ Zero |

**SmartBill deja rulează** live sessions în Contabili pe Facebook cu Delia Mircea + Cristian Rapcencu. **Avantaj channel enorm pe care CompliAI NU-l are.**

### 5.2 Canal primar propus

1. **CECCAR partnership** — badge oficial *"CECCAR recomandat"* (pursuit activ, nu încă încheiat)
2. **Design partner cabinete** — 5 cabinete × 10-30 clienți = 50-150 seats gratis primele 6 luni
3. **FB group presence** — răspunsuri, nu pitch-uri, în cele 3 grupuri mari
4. **Referral program** — fiecare cabinet care aduce altul = 1 lună gratis
5. **Banca Transilvania** — potențial 800k SME access dacă se concretizează (menționat în PRODUCT_ROADMAP)
6. **PNRR digitalization** — potențial subsidy funnel

---

## 6. PRICING RECOMANDAT (revizuit pe date piață)

### 6.1 Tier-uri finale

| Tier | Preț | Target | Conținut |
|---|---|---|---|
| **Free** | €0 | Awareness / lead magnet | Cookie check, 1 privacy policy, 1 AI system — NO credit card |
| **Starter** | **€49/lună** | Contabil solo, 1-5 clienți | GDPR basics + e-Factura validator + 5 clienți + intake |
| **Pro** 🎯 | **€149/lună** | **Consultant 6-25 clienți** | + NIS2, AI Inventory, site-scan, broadcast UI, export audit pack |
| **Studio** | **€349/lună** | Consultant 25+ clienți | + partner mode, multi-branding, API, SLA, referral dashboard |
| **Direct SME (self-serve)** | €39 / €99 / €249 | Micro / small / medium | Scalare linear pe firm size |
| **Enterprise** | **quote, start €8k/an** | NIS2 esențiale, DORA fintech | Custom, SLA, dedicated success |

**Sweet spot Diana = Pro €149/lună.**

### 6.2 Rationale numeric

- Contabil Diana cu 20 clienți:
  - Tool cost: **€149/lună = ~740 RON**
  - Rebill 20 × 100 RON = 2.000 RON
  - **Profit lunar: 1.260 RON = ~€250/lună extra revenue for Diana**
  - **Margin: 170%** → se vinde singur

- Anchor pentru contabil: *"O oră de consultanță GDPR/lună acoperă costul."* (~150 RON/oră piață)

### 6.3 Anuală bias
- 2 luni gratis la plată anuală (de fapt -16%)
- Bias toward annual = cash flow predictabil + retention
- Cabinete preferă annual cash (mai puțin recurring ops)

---

## 7. MESAJUL DE POZITIONARE

### 7.1 Ce NU funcționează
- ❌ *"Evită amenzi de 10.000€"* — fear mongering, compliance e deja speriat
- ❌ *"Cea mai bună soluție GDPR din RO"* — Sypher o spune deja
- ❌ *"Powered by AI"* — toate spun asta

### 7.2 Ce funcționează (GTM 2026)

**Principal (Diana)**:
> *"Un singur dashboard pentru cele 20 de firme ale tale: e-Factura, GDPR, NIS2 și AI Act — alerte în timp real, rapoarte gata de client."*

**Secundar (SME)**:
> *"Asigură-te că poți vinde în UE. Un instrument, toate regulamentele, contabilul tău te susține."*

**Anti-SmartBill** (dacă ne poziționează-înainte):
> *"Integrat cu SmartBill și SAGA. CompliAI e layer-ul de compliance. Păstrezi tool-ul de contabilitate."*

---

## 8. GO-TO-MARKET 90-DAY PLAN

### 📅 Days 0-30: Credibility + partner pipeline
- [ ] **5 design-partner cabinete** free 6 luni (case studies + quotes în exchange)
- [ ] **3 posts/săptămână LinkedIn RO** founder voice pe e-Factura/NIS2/GDPR pain
- [ ] Lead magnet: **"GDPR + NIS2 checklist PDF"** gated pe email
- [ ] Setup FB group accounts (nu post încă, observă 2 săpt)
- [ ] **CECCAR partnership conversation** — target Filiala București Ilfov + Cluj

### 📅 Days 30-60: Channel seeding
- [ ] Contribuții (RĂSPUNSURI, nu pitch) în 5 FB groups mari
- [ ] **1 "ask me anything e-Factura" session** per grup (cu admin approval)
- [ ] Parteneriate conversation: SAGA + SmartBill + Keez + Huddle (**integrare**, nu competiție)
- [ ] Apply CECCAR sponsor status pentru 1 regional event (București/Cluj/Iași/Timișoara)
- [ ] LinkedIn outreach — 10 DM/zi contabili cu 10+ followers în content compliance

### 📅 Days 60-90: Convert + price
- [ ] Launch pricing **€49 Starter / €149 Pro / €349 Studio**
- [ ] Free first 3 clienți forever pentru cabinete (remove absorption risk)
- [ ] Publicare 3 case studies pe site (cabinete reale, numere reale)
- [ ] **Referral program**: cabinet → cabinet = 1 lună free per referral
- [ ] **KPI target**: 20 cabinete paying × 12 clients = **240 seats by day 90**
- [ ] Revenue Y1 conservativ: 20 × €149/lună × 12 = **€35.760 ARR** din ADR 20 cabinete

### 📅 Single biggest leverage point
**Accountant's rebill margin.** Dacă €149 CompliAI permite cabinetului să rebill-uiască 2.000 RON/lună pe 20 clienți = profit 1.250 RON = viral organic. Dacă nu → absorb + churn.

---

## 9. STRATEGIC IMPERATIVES — CE TREBUIE ÎN 6 LUNI

### 🔴 Must-do (pierdem dacă nu)
1. **Ship Inbox agregat cross-client** în 4 săptămâni — este **the one thing** (Diana research confirmat)
2. **CECCAR partnership conversație încheiată** în 8 săptămâni (fie *recomandat* fie sponsor)
3. **Community presence în 3 FB groups** activă în 12 săptămâni
4. **5 case studies publicate** cu cabinete reale până luna 5
5. **Integrare read-only cu SmartBill + SAGA** în 10 săptămâni (block defensive)

### 🟠 Should-do (crește velocity)
6. Lead magnet + 20 LinkedIn posts founder voice
7. Blog content RO pe e-Factura 2026 + NIS2 (SEO long-tail)
8. ROI calculator pe site (*"câte ore economisești cu 20 clienți"*)
9. White-label UI polish (Diana's brand vizibil)
10. Landing page per regulație (/e-factura, /nis2, /ai-act, /gdpr)

### 🟢 Nice-to-have (nu blochează)
11. Banca Transilvania partnership conversation (long shot)
12. PNRR application
13. Expansion BG pilot (1 consultant bulgar design partner)

---

## 10. CE SE SCHIMBĂ VS PRIMUL SKETCH NOSTRU

Din discuțiile anterioare cu tine, refinez:

| Elemente care se confirmă | Elemente care se revizuiesc |
|---|---|
| ✅ Diana = P1 primary | ⚠️ Pricing revizuit (€149 Pro, nu €80 per client) |
| ✅ B2B2B channel model | ⚠️ Diana plătește tool-ul; NU cabinet-ul taxează pe client direct pentru CompliAI |
| ✅ White-label + Diana-brand-first | ⚠️ Rebill margin e dominant — build pricing around that |
| ✅ Inbox agregat cross-client = killer feature | ⚠️ Threat-ul #1 e Huddle, NU OneTrust/Vanta |
| ✅ EU market access = value prop | ⚠️ Trigger imediat 2026 = **e-Factura B2C**, nu "EU expansion" |
| ✅ Moatul = canal + time window | ⚠️ Tech moat slab — nu perde timp cu polish UI, cucerește CECCAR |

---

## APENDICE: SURSE CITATE

**Interne** (citate din docs propriu): PRODUCT_ROADMAP.md, COMPETITIVE_ANALYSIS_SCAN.md, APLICATIA.md, FEEDBACK_SCAN_REPORT.md, compliai_final_user_matrix_bible.md, compliai_market_runtime_truth_bible.md, COMPLISCAN-MASTER-FINAL-v3.md.

**Externe** (concurenți):
- [Sypher Suite](https://www.sypher.eu/pricing)
- [Wolters Kluwer GDPR RO](https://www.wolterskluwer.com/ro-ro/solutions/gdpr-software)
- [MyBiz GDPR / Setrio](https://setrio.ro/en/mybiz-gdpr/)
- [Iubenda pricing](https://www.iubenda.com/en/pricing/)
- [SmartBill](https://www.smartbill.ro/)
- [SAGA Software](https://www.sagasoftware.ro/)
- [Keez (Visma-owned)](https://www.keez.ro/)
- [Huddle (Cassa)](https://huddle.ro/)
- [OneTrust pricing](https://www.onetrust.com/pricing/)
- [Vanta](https://www.vanta.com/)
- [NIS2 Romania — ISMS.online](https://www.isms.online/nis-2/country/romania/)
- [CMS NIS2 RO Orders](https://cms-lawnow.com/en/ealerts/2025/09/romania-launches-orders-to-implement-the-nis2-framework-30-day-registration-deadline-in-effect)
- [Copla NIS2](https://copla.com/blog/compliance-regulations/nis2-directive-regulations-and-implementation-in-romania/)
- [CECCAR](https://ceccar.org/en/)
- [Contabili pe Facebook 50k — CabinetExpert](https://www.cabinetexpert.ro/2024-02-28/grupul-contabili-pe-facebook-a-depasit-azi-pragul-de-50-000-de-membri.html)

**Regulatory**:
- [AI Act compliance checker](https://artificialintelligenceact.eu/assessment/eu-ai-act-compliance-checker/)
- Legea 124/2025 NIS2 transpunere RO
- OUG 69/2024, OUG 138/2024 e-Factura B2C
- OUG 70/2024 eTVA notificare

---

> **END MARKET-RESEARCH.md** — ultima generare 2026-04-19.
> Combină cu [STATE-NOW.md](./STATE-NOW.md) pentru a produce [DESTINATION.md].
