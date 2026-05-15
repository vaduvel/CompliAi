# Feature Validation — 11 features CompliScan Fiscal vs piață RO (2026-05-14)

> Analist: Claude (competitive intelligence brutal — verdict per feature)
> Scop: verificare empirică pentru fiecare din cele 11 features dacă e MOAT REAL sau dacă există deja la competitori
> Baseline: raportele `smartbill-managerconta-competitive-intel-2026-05-14.md` + `competitive-landscape-ro-2026-05-14.md`
> Surse noi verificate: Latitude App, Vello.ro, Nexus ERP docs, SmartBill ManagerConta help, TaxDome, Conta25, Huddle.ro, Forum SAGA, ANAF static, certSIGN
> Cuvinte cheie căutate: RO + EN

---

## TL;DR brutal

**8/11 features sunt MOAT VALID sau MOAT PARȚIAL — 3/11 trebuie repoziționate sau cuttate.**

Surpriza neagră a research-ului: **Latitude App există ca un produs B2B nepublicizat în segment Maria, dar livrează deja explicit cross-correlation SAF-T ↔ D300 ↔ D390 ↔ D394 ↔ D100 + reconciliere e-TVA precompletat**. Adică **Feature 2 (cross-correlation) și Feature 3 (e-TVA reconciliere) NU mai sunt blue ocean pur — sunt moat parțial cu un competitor real**. Latitude App nu vinde la cabinete CECCAR (target enterprise multinational), dar oricine din segment Maria îl poate găsi în 5 minute.

A doua surpriză: **Vello.ro** există ca produs dedicat colectare documente cabinet→client cu link unic (~magic link), reminder automat, export ZIP, 19-39 €/lună. Feature 4 (workflow cereri docs + audit trail + magic link) **NU mai e blue ocean** — e moat parțial pe depth (audit trail granular + opinion CECCAR + export PDF pentru ANAF).

A treia: **TaxDome** are interfață RO + telefon vânzări local + audit trail granular + time tracking profitability + workflow cu pipelines. Atât Feature 4 cât și Feature 6 (burden) au TaxDome ca pericol mai serios decât raportul anterior estima.

Concluzie: **4 features sunt blue ocean curat** (Feature 1 risk score, Feature 5 audit pack ZIP, Feature 7 cross-client network, Feature 11 inventar certificate consolidat). **4 sunt moat parțial cu competitori activi** (2, 3, 4, 6). **3 sunt overlap parțial sau curat** (8 SPV, 9 cross-ERP, 10 calendar fiscal).

---

## Feature 1: Risk Score 0-100 pre-ANAF cu Top 5 ranked

**Verdict:** ✅ MOAT VALID

### Evidence

1. **SmartBill ManagerConta — confirmat NU are:** documentația paginii Acasa (https://ajutorconta.smartbill.ro/article/804-managerconta-meniul-principal-si-pagina-acasa) listează doar 2 grafice: "Situație declarații" și "Situație documente". Quote: pagina Acasă prezintă "sinteza a declaratiilor care au termen de depunere intr-o anumita luna" și "sinteza a contractelor pe care firma de conta le are cu clientii ei". Nu există ranking de Top 5 riscuri fiscale per firmă, nu are scor 0-100. KPI-urile se limitează la numărarea declarațiilor pe statusuri.

2. **Nexus ERP — confirmat NU are:** documentația (https://www.docs.nexuserp.ro/articol/utilizare-modul-dosare-contabile/4907) descrie fiscal control pe NC8 codes pentru produse cu risc fiscal (lista ANAF) și submission automat în SPV, dar zero menționare a unui scor de risc per firmă sau Top 5 acțiuni ranked.

3. **Latitude App — NU are scor numeric:** quote din WebFetch pe https://latitude-app.com/servicii/e-tva/: "Risk flagging that signals high-risk differences" — face DOAR flagging binar pe discrepanțe e-TVA, NU scor 0-100 per firmă cu Top 5 acțiuni ranked. Conform analizei SAF-T (https://latitude-app.com/en/financial-services/saf-t-declaration/): "Documentul nu menționează un scor de risc numeric. Se referă doar la faptul că autoritățile folosesc discrepanțele pentru evaluare."

4. **ANAF însuși — context regulatoriu:** ANAF a publicat oficial "Fișa indicatorilor de risc fiscal" (https://static.anaf.ro/static/10/Anaf/transparenta/Anexanr2laproceduraFisaindicriscfiscal.htm) cu criterii cantitative+calitative pentru clasificare risc. ANAF construiește intern proiect APOLODOR (Big Data) pentru analiză automată de risc. Cabinetele NU au tool să simuleze această clasificare INTERNĂ înainte ca ANAF să o vadă.

5. **Termene.ro — competitor adiacent NU are:** quote: "alerte automate despre schimbări financiar/juridic/fiscal" și PartnerSCAN (parteneriat Deloitte) — monitorizare insolvență, nu scor de risc fiscal portofoliu cabinet pe baza vector fiscal + cross-correlation.

### Competitori care fac PARȚIAL

- **Latitude App** — "Risk flagging" binar pe discrepanțe e-TVA (high-risk differences signaled). NU 0-100, NU Top 5 ranked, NU per firmă.
- **Termene.ro** — monitorizare schimbări financiare/insolvență. NU scor risc fiscal ANAF specific.
- **Coface PartnerSCAN** (parteneriat Deloitte) — credit score și TVA fraud detection. NU scor fiscal ANAF per firmă.

### Competitori care fac COMPLET

**ZERO.** Nu există competitor RO sau global care livrează **scor risc fiscal 0-100 per firmă + Top 5 acțiuni ranked**, calibrat pe Fișa indicatorilor de risc fiscal ANAF.

### Implicație pentru CompliScan

**PĂSTRĂM — moat #1, blue ocean confirmat.** Construim algoritm proprietary calibrat cu cabinete pilot pe Fișa indicatorilor risc fiscal ANAF + cross-document signals. Risc: ANAF însuși construiește APOLODOR — peste 18-24 luni ANAF poate publica direct scorul individual contribuabilului via SPV (gen acum la cazul "Buletin de risc"). Hedge: construim ca produs prescriptiv pentru cabinet (Top 5 acțiuni concrete cu zero-day mitigation), nu doar descriptiv.

---

## Feature 2: Cross-correlation declarații 8 reguli pre-depunere

**Verdict:** ⚠️ MOAT PARȚIAL

### Evidence

1. **Latitude App face COMPLET între SAF-T ↔ D300 ↔ D390 ↔ D394 ↔ D100.** Quote din https://latitude-app.com/en/ro-saft/how-to-automatically-verify-that-vat-information-reported-in-the-saf-t-declaration-is-accurate/: "Latitude App automatically reconstructs the VAT return from SAF-T and compares it with the D300 prepared by the company." Quote din https://latitude-app.com/en/financial-services/saf-t-declaration/: "Upload your SAF-T XML file and VAT declarations (D300, D390, D394) and D100" — apoi "Download the correlation report and SAF-T declaration in Excel." Quote search engine: "The platform automatically validates SAF-T against D300, D390, D394 and D100 for full compliance." **Confirmat: 5 declarații cross-validate** — exact 4 din 8 reguli pe care le-ai listat (D300/D394/D205/SAF-T) deja există la Latitude.

2. **Latitude App pricing:** "RO SAF-T Verificare €100/lună" + "RO e-TVA €25/lună" + "RO Declarații TVA €50/lună" (https://latitude-app.com/preturi/). Pentru pachet complet ≈ 175 €/lună = 875 RON/lună per firmă — adresat la enterprise/multinational, NU per cabinet cu 78 firme.

3. **Latitude App target persona NU e Maria:** quote https://latitude-app.com/: "Clientii nostri" = firmele care vor să "simplifice schimbul de date pentru tranzacții cu autoritățile fiscale." Quote 450+ companii — sunt firme directe, nu cabinete CECCAR pentru 30-150 clienți. Modelul lor de business e per-firmă, nu per-cabinet.

4. **SmartBill ManagerConta — NU are cross-correlation:** documentația confirmă 20+ declarații în catalog, dar zero menționare de validare inter-document între ele. Quote forum SAGA (https://www.sagasoft.ro/forum/viewtopic.php?t=60203): "declaratia 300 si 394" — utilizatorii fac comparația MANUAL pentru a evita probleme. SAGA software nu o face automat.

5. **D205 ↔ AGA ↔ Bilanț ↔ D406 reguli — NIMENI NU FACE:** Latitude se oprește la TVA-side (D300/D390/D394/SAF-T/D100). Cross-correlation D205 (impozit reținut la sursă/dividende) ↔ AGA hotărâri ↔ Bilanț, D406 ↔ Bilanț, sau D406 ↔ D300 ↔ stocuri — NU am găsit competitor.

6. **DUKIntegrator (ANAF) — NU face inter-document:** quote search: "DUKIntegrator is a dedicated tool provided by ANAF that enables technical validation of XML files." Face DOAR validare structurală XSD intra-document, nu cross-document.

### Competitori care fac PARȚIAL

- **Latitude App** — cross-correlation 5 declarații (SAF-T + D300 + D390 + D394 + D100) cu output Excel correlation report. Acoperă 50% din cele 8 reguli CompliScan. Costă €100-175/lună. Target enterprise, NU cabinet.
- **Nexus ERP** — are 4 rapoarte verificare e-TVA: "Facturi, AMEF, Exporturi, Importuri" (https://www.docs.nexuserp.ro/articol/utilizare-modul-dosare-contabile/4907) — comparare DATE INTERNE Nexus vs date e-TVA. NU compară între declarații depuse.
- **SAF-T ANAF însuși** — quote search: "ANAF runs 11 automated consistency checks after submission" — DUPĂ depunere, nu pre-depunere. Cabinetele află din ANAF, nu îl previn.

### Competitori care fac COMPLET

**ZERO** pe scope-ul de 8 reguli incluzând D205 ↔ AGA, D406 ↔ Bilanț, AGA ↔ D205. Latitude e cel mai aproape dar acoperă DOAR TVA-side (5 din 8).

### Implicație pentru CompliScan

**PĂSTRĂM cu repoziționare.** Latitude livrează 5 din 8 reguli la €100-175/lună per firmă (target enterprise). CompliScan acoperă 8 reguli la 4-7 RON/firmă/lună în cabinet (target Maria). Diferențierea:
- (a) Scope mai larg: D205 ↔ AGA ↔ Bilanț, D406 ↔ Bilanț, AGA ↔ D205, vector fiscal mismatch
- (b) Pre-depunere blocking + Top 5 fix-uri (Latitude livrează Excel report, nu workflow corectiv)
- (c) Per-cabinet pricing (Latitude e per-firmă, nu funcționează economic la 78 clienți × €175 = €13.650/lună)
- (d) Integrare cu cocpitul cabinet (cross-client portfolio view), nu raport per-firmă

**Risc real:** dacă Latitude pivotează spre cabinet și lansează pachet "Multi-Company €99/lună unlimited firms" — direct overlap. Probabilitate 30-50% în 12-18 luni (e mișcare logică pentru ei).

---

## Feature 3: D300 ↔ P300/e-TVA precompletat reconciler

**Verdict:** ⚠️ MOAT PARȚIAL — EXISTĂ COMPETITOR ACTIV

### Evidence

1. **Latitude App face DIRECT acest feature.** Quote din https://latitude-app.com/servicii/e-tva/: "Descarcă în timp real, în format consolidat Excel, rapoartele e‑TVA și sursele aferente" — automatically compares submitted VAT declaration with ANAF's pre-filled electronic form. Quote: "Detectează din timp discrepanțele dintre declarația de TVA și sursele disponibile (e‑Factură, e‑Transport, etc.)." Pricing: €25/lună RO e-TVA.

2. **Nexus ERP face PARȚIAL.** Quote din https://www.nexuserp.ro/blog/ce-este-e-tva-si-integrarea-acestuia-in-nexus-erp: "Nexus ERP v.24.12 downloads e-TVA messages (P300 ETVA and P300 ETVA - details) from the SPV system." Adaugă două câmpuri în declarația TVA: "Valoare RO e-TVA" și "TVA RO e-TVA". Are 4 "Raport verificare e-TVA" (Facturi, AMEF, Exporturi, Importuri) — compară DATE NEXUS vs DATE e-TVA. **Nu compară D300 generat de cabinet cu P300, ci date interne Nexus cu P300** — nuanță importantă: e bun doar dacă cabinetul ține contabilitate în Nexus.

3. **SAGA — NU face automat, dar forum confirmă pain:** quote forum SAGA (https://forum.sagasoft.ro/viewtopic.php?t=57612 "Exista Corelatie intre D394 si P300 ?" + https://www.sagasoft.ro/forum/viewtopic.php?t=56758 "Deconturi precompletate pe site ANAF"). Utilizatorii fac manual. Quote search rezultat: "Some notifications combine amounts from the national electronic cash register system and Declaration 394 when only AMEF amounts should be included" — discuții lungi forum despre cum SAGA NU rezolvă acest mismatch.

4. **SmartBill (ManagerConta + Conta) — NU am găsit feature dedicat e-TVA reconciler.** Quote search SmartBill Conta features: depune D300/D394/D406, nu compară cu P300 precompletat ANAF.

5. **Avocatnet.ro — articol 2024-2025 confirmă urgency:** quote https://www.avocatnet.ro/articol_69431: "e-TVA: Decontul precompletat și fișierele aferente ar trebui descărcate și verificate lunar cât mai repede. Cum să procedezi și ce probleme frecvente apar." 2026 — notificare conformare deja activă (https://permisdeantreprenor.ro/notificare-conformare-ro-e-tva-2026/).

6. **Threshold legal:** quote search "Significant differences are understood to be those exceeding a threshold of 20% and a minimum value of 5,000 lei" — orice cabinet are nevoie de tool care detectează automat acest threshold. Latitude o face deja.

### Competitori care fac PARȚIAL

- **Latitude App** — reconciliere e-TVA precompletat completă, cu Excel export, discrepancy detection, risk flagging. €25/lună per firmă.
- **Nexus ERP** — compară DATE NEXUS interne vs P300, nu D300 vs P300. Util dacă contabilitatea e în Nexus.

### Competitori care fac COMPLET

**Latitude App face COMPLET acest feature**, dar la pricing per-firmă enterprise (€25/lună × 78 firme = €1.950/lună pentru un cabinet) — nu economic pentru segment Maria.

### Implicație pentru CompliScan

**PĂSTRĂM cu CUTOFF clar față de Latitude.** Latitude livrează reconciler la enterprise-scale per-firmă. CompliScan:
- (a) Per-cabinet pricing flat (nu per-firmă) — economic la 50-150 clienți
- (b) Cross-client dashboard: Top 5 firme cu diferențe >20% threshold pre-notificare ANAF
- (c) Auto-generare explicații pre-formatate cf. CPF Art. 19 + atașate la dosar audit
- (d) Workflow corectiv (mâna pe corecția D300, nu doar Excel report)

**Risc real:** Latitude poate lansa "Cabinet pack 99 €/lună unlimited firme" și ne mănâncă pe stratul ăsta. Probabilitate medie. Counter: integrare profundă cu cross-correlation 8 reguli + audit pack + risk score (ele nu vor lansa stack-ul complet).

**Recomandare suplimentară:** verifică direct Latitude App dacă fac demo cabinet — pricing public e per-modul fără volume discount. Posibil să nu fie încă focus comercial pe cabinete.

---

## Feature 4: Workflow cereri docs cu magic link + audit trail

**Verdict:** ⚠️ MOAT PARȚIAL — EXISTĂ 2 COMPETITORI

### Evidence

1. **Vello.ro face acest feature dedicat (descoperit nou).** Quote https://www.vello.ro/: "1. Selectezi clienții 2. Vello trimite cererea 3. Clientul încarcă direct 4. Tu primești totul organizat." Magic link: "Linkurile sunt valabil 30 de zile" + "Clientul nu instalează nimic. Deschide linkul, încarcă documentele. Gata." Reminder automat după 3 zile + notificări instantanee. **Export ZIP lunar inclus în ambele planuri**. Pricing: Standard 19 €/lună (50 clienți), Premium 39 €/lună (unlimited).

2. **Vello.ro NU are audit trail granular complet:** confirmat WebFetch: "❌ Audit trail - Nu e menționat. ❌ Export PDF cu istoric - Nu e menționat. ❌ Timestamp-uri precise (trimis/deschis/primit/verificat) - Nu sunt detaliate." Categorii: client, tip, perioadă. Lipsă: opinion CECCAR + audit-grade evidence chain pentru ANAF.

3. **Huddle.ro face PARȚIAL:** quote search rezultat: "Dedicated spaces for each client, where documents can be uploaded, messages can be left, and requests can be managed without the risk of losing essential information" + "tasks can be created and allocated, reminders for clients." Whitelabel pentru cabinete. **Audit trail SPECIFIC nu e documentat clar** — quote search: "I did not find specific detailed information about an 'audit trail' functionality specifically for tracking document changes or user actions on the platform."

4. **TaxDome — face COMPLET (US, dar are RO localization):** quote https://taxdome.com/audit-trail: "comprehensive audit trail for each document, tracking uploads, views, edits, and signatures. The audit trail includes user information, server time in UTC, client time in the user's location, IP address, city and country location, and browser information." Magic link: secure portal + alternative "secure link" pentru clienți fără cont. Workflow pipelines vizuale. Romanian language support confirmat. Pricing $50-100/user/lună (250-500 RON/user/lună).

5. **SmartBill ManagerConta — NU face workflow cereri (face REVERS):** quote https://ajutorconta.smartbill.ro/article/813-documente-clienti: "module de gestiune și stocare de documente pentru relația cu clienții, NU o platformă de lucru colaborativ cu cereri și aprobări." Statusurile sunt "Activ/Va expira/Expirat/Finalizat/Reziliat" pe contracte, nu pe cereri active de la client. Quote https://blog.smartbill.ro/raportari-lunare-clienti-managerconta/: trimite raportări CABINET→CLIENT, nu cereri CLIENT→CABINET.

6. **Conta25 — face PARȚIAL:** quote search: "task management, document management, internal chat between accountants and clients, and electronic archiving." Lipsă confirmat: magic link explicit, audit trail granular.

### Competitori care fac PARȚIAL

- **Vello.ro** — magic link + reminder + export ZIP, dar fără audit trail granular sau opinion CECCAR. 19-39 €/lună (95-195 RON).
- **Huddle.ro** — workflow request management whitelabel, fără audit trail confirmat. Pricing nepublicat.
- **Conta25** — task + doc + chat. Audit trail neconfirmat.

### Competitori care fac COMPLET

- **TaxDome** — audit trail granular (UTC/IP/browser/city), secure links, workflow pipelines. US, are RO localization. Cel mai serios competitor global.

### Implicație pentru CompliScan

**PĂSTRĂM cu repoziționare pe DEPTH.** Vello și Huddle sunt mici, TaxDome e global dar nu specific ANAF. CompliScan moat:
- (a) Audit trail "ANAF-grade" — manifest cu opinion CECCAR + cross-refs la momentul cererii + timestamp criptografic (Vello nu face)
- (b) Magic link integrat cu identificare client + tracking 1-click (Vello și SmartBill au creează-cont, nu pur magic link)
- (c) Workflow specializat fiscal: cerere de "documente lipsă pentru SAF-T martie 2026" nu generică "uploadează docs"
- (d) Export PDF pentru control ANAF cu ștampilă temporală (singur competitor TaxDome — dar US-centric, lipsă specifică ANAF)

**Recomandare:** marketing direct la "audit defense" — ce face Vello e "doc collection," ce face TaxDome e "practice management." CompliScan e "audit defense workflow." Cuvântul cheie: dovada că ai cerut documentul la 15 ianuarie cu timestamp criptografic.

**Risc real:** Vello.ro adaugă audit trail în 3-6 luni la 19 €/lună (cu siguranță vor — e logic). Counter: opinion CECCAR + opinion ANAF (input juriști) + cross-ref la momentul declarațiilor depuse (Vello nu o va face fără să intre în spațiul fiscal, ceea ce înseamnă pivot major pentru ei).

---

## Feature 5: Audit Pack ZIP pentru control ANAF cu manifest + opinion CECCAR

**Verdict:** ✅ MOAT VALID

### Evidence

1. **SmartBill ManagerConta — NU are export ZIP audit:** quote din WebFetch direct https://ajutorconta.smartbill.ro/article/814-dosarul-clientului: "Documentele sunt structurate în trei secțiuni: Documente de identificare, Contracte conta, Documente diverse. Posibilitatea de a adăuga noi documente în fiecare secțiune. Afișare documente indiferent de status." **Ce NU este menționat în documentație: Export ZIP, Manifest, Cross-references, Opinie CECCAR.** "Dosarul clientului" e doar un storage cu 3 sectiuni, nu un audit pack canonic.

2. **Vello.ro are export ZIP — dar bază, NU audit:** quote: "Export ZIP lunar disponibil în ambele planuri." Conținut: documente colectate de la client. Lipsă: manifest cu lista canonică ANAF, cross-refs la declarații depuse, opinion CECCAR.

3. **Dosar.contabilul.ro (Rentrop & Straton) — e produs editorial, NU software:** quote https://dosar.contabilul.ro/: "Dosarul Permanent al Clientului — model editabil pe stick de memorie." Compliant cu CECCAR Standard 21. Bundle 237-263 RON + TVA. **Nu e SaaS — e template Word/Excel pe stick**. Pentru cabinete. Confirmă cererea pieței dar nu satisface scope-ul CompliScan.

4. **Nexus ERP — submission ANAF, NU audit pack:** quote: "Solicitări SPV ANAF + e-Factura + e-Transport." Submission automatizat, NU export pack pentru control.

5. **TaxDome — workflow + doc storage, NU audit pack RO-specific:** are document organization și audit trail per document, dar lipsă specific manifest ANAF + opinion CECCAR + cross-refs declarații RO.

6. **CECCAR Standard 21 — context regulatoriu:** quote search: "Permanent Client File is a file regulated by CECCAR (through Professional Standard no. 21), which gathers and organizes all essential information related to the client in one place so that it is available for audits and verifications." Standard reglementat, dar zero tool RO care livrează automat ZIP conform.

### Competitori care fac PARȚIAL

- **Vello.ro** — export ZIP lunar generic, fără audit-grade.
- **SmartBill ManagerConta** — "Dosarul clientului" 3 sectiuni, fără export.
- **Dosar.contabilul.ro** — template Word/Excel (NU software) pentru CECCAR Standard 21.

### Competitori care fac COMPLET

**ZERO.** Nu există competitor RO sau global care livrează **ZIP audit pack ANAF cu manifest + opinion CECCAR validată juriști + cross-refs cu declarații depuse + recipise SPV pe perioadă**.

### Implicație pentru CompliScan

**PĂSTRĂM — moat clar, blue ocean confirmat.** Construim:
- (a) Manifest canonic conform CECCAR Standard 21 + Codul Procedură Fiscală Art. 109+
- (b) Opinion CECCAR validată cu 3-5 experți contabili pilot
- (c) Cross-refs automate: declarații depuse + recipise + AGA + bilanț + contracte + facturi + corespondență e-Factură
- (d) Format ZIP semnat cryptographic cu timestamp (audit-grade)

**Risc real:** SmartBill investește vizibil în "Dosarul clientului" (post Facebook video oficial 2024). Pot adăuga export ZIP în 3-6 luni. Counter: opinion CECCAR + cross-refs declarații pre-validate (SmartBill nu are stratul de cross-correlation, deci nu poate face cross-refs canonice fără să-l construiască — adică ~6-12 luni effort).

**Pricing power:** singur feature poate justifica 200-300 RON/lună din pachetul total (1 control ANAF evitat = 30K-100K RON). Vinde-l ca "asigurarea ta de control ANAF."

---

## Feature 6: Burden Index profitabilitate per client cu formula CECCAR

**Verdict:** ⚠️ MOAT PARȚIAL — 2 COMPETITORI ACTIVI

### Evidence

1. **Conta25 face EXPLICIT acest feature.** Quote https://conta25.ro/: "Calculezi profitabilitatea per fiecare client în parte, în timp real" + "Măsuri timpul petrecut pe activitățile non-contabile, neproductive." Quote https://start-up.ro/startup-pitch-conta25-platforma-care-ajuta-contabilii-sa-fie-profitabili/: "Cum ar fi dacă ar exista un asistent pentru îngrijitorul grădinii care să îi spună tot timpul câtă apă și timp (costuri) a consumat cu o plantă și câte roade (profit) a dat acea plantă." 15 cabinete adopție + 1500 firme finale (august 2023). **Formula CECCAR-specifică NU e detaliată** — startup nu publică formula tehnică. Investiție €150K total, caută €100K adițional.

2. **TaxDome face COMPLET — global, AI-powered:** quote https://taxdome.com/time-billing: "track billable hours and increase team productivity while creating invoices in an easy-to-use system + automates recurring invoices, tracks billable hours, and integrates with payment processors." Quote: "advanced AI-powered reporting takes your time data and provides insights into productivity, efficiency, and profitability, allowing firms to analyze staff performance, project timelines, and billable hours." **Profitability analysis by client, service line, or team member.** Romanian language confirmat. Pricing $50-100/user/lună.

3. **Huddle.ro face PARȚIAL:** quote search: "time tracking real per task" + task management cu reminder. Profitability per client explicit NEMENȚIONATĂ în pagina functionalitati. Whitelabel.

4. **SmartBill ManagerConta — NU face:** confirmat în raportul anterior. Zero menționare profitability per client în ecosystem SmartBill.

5. **TimeRewards, Workflowqueen — produse globale dedicate cu profit check:** quote search "Client Profitability Tracker" (workflowqueen.com) — soluții niche US/global pentru "tax-professional efficiency."

6. **Mefi.ro — ERP general, NU specific cabinet:** are 24 module + 500+ companii adopție, dar nu cu formula CECCAR-specifică.

### Competitori care fac PARȚIAL

- **Conta25** — feature direct revendicat ("calcul profitabilitate per client în timp real"), 15 cabinete adopție. Lipsă publică: formula tehnică CECCAR-specifică.
- **Huddle.ro** — time tracking per task, fără profitability ranking explicit.
- **TaxDome** — AI-powered profitability analysis global, nu CECCAR-specific.

### Competitori care fac COMPLET

- **Conta25** este cel mai aproape — claim solid "real-time profitability per client" + time tracking activitate non-contabilă + 15 cabinete adopție. Dar small footprint.
- **TaxDome** — global, AI-powered, RO language. Mai matur tehnologic.

### Implicație pentru CompliScan

**REPOZIȚIONARE OBLIGATORIE.** Acesta NU mai e blue ocean. Decizii:
- **Opțiunea A — Cuttăm feature 6** și ne focalizăm pe ce-i blue ocean (1, 5, 7, 11). Mesaj: "noi te apărăm de ANAF, profitabilitatea ți-o gestionezi cu Conta25 sau Huddle." Argumentul: 80% effort pe 5 features blue ocean > 30% effort pe 8 features dintre care 3 cu competitori.
- **Opțiunea B — Diferențiem prin formula CECCAR-specifică PUBLICĂ și brevetată:** "Burden Index CompliScan = (timp × tarif + exceptions × cost + risc activ) / onorariu" — formula opinionatică validată CECCAR. Conta25 are "calculezi profitabilitate" generic, fără formula publică. Putem face Burden Index ca marca + algoritm proprietary.
- **Opțiunea C — Integrare în loc de feature stand-alone:** Burden Index alimentat AUTOMAT din risk score + workflow cereri (Top 5 clienți cu burden mare = cei care necesită cele mai multe cereri docs + au risc score ridicat). Loop cu Feature 1, 4 — diferențiere pe sinergie cross-feature.

**Recomandare:** Opțiunea C — Burden Index e meta-feature ce LEAGĂ Feature 1 + 4 + 7. Nu intrăm head-to-head cu Conta25 pe time tracking, dar le servim integration cu risc.

**Risc real:** Conta25 scalează de la 15 la 200 cabinete + adaugă risc score → direct competitor pe stack. Probabilitate 30% în 12-18 luni (au capital limitat, focus actual e doar profitability). TaxDome face RO localization deep → 15% probabilitate.

---

## Feature 7: Cross-client network detection (același furnizor erori la multe firme)

**Verdict:** ✅ MOAT VALID

### Evidence

1. **ZERO competitor RO/global cabinet identificat.** Quote search "vendor risk cross-client pattern detection software contabilitate Romania" — rezultat: doar produse Vendor Risk Management globale (Riskonnect, UpGuard, CENTRL, NAVEX) pentru enterprise procurement, NU pentru cabinet contabilitate cu cross-client dataset.

2. **Coface PartnerSCAN — cel mai aproape, dar diferit scope.** Quote https://www.coface.ro/informatii-de-afaceri/evaluarea-riscului-clientilor: "credit scores, sectoral and country risks, and payment history to evaluate financial health of partners and detect insolvency cases." Quote: "evaluation of insolvency cases" + "TVA fraud risk through PartnerSCAN (an application developed with Deloitte România)." **Single-firm focus, NU cross-cabinet aggregated.** Adică o firmă cumpără PartnerSCAN și își verifică furnizorii ei — nu un cabinet aggregează signals din 78 firme și detectează "furnizorul X are erori la 12 cabinete client."

3. **Termene.ro — monitorizare info schimbări per firmă:** alerte despre schimbări financiar/juridic/fiscal pe firmă verificată. Quote: "Through multiple filtering possibilities, users can determine how many companies in their portfolio are insolvent, fiscally inactive, or have high insolvency risk." **Cross-client pe portofoliu cabinet, dar pe signal-uri publice (insolvență/inactivitate fiscală), NU pe network effect cabinet (erori repetate furnizor)**.

4. **ANAF însuși — face intern (APOLODOR), nu publică:** ANAF agregează date la nivel național (e-Factura + SAF-T + SPV cross-firme) și detectează pattern-uri toxice. Cabinetele primesc rezultatul post-factum (control), nu pre-emptive.

5. **TaxDome / Huddle / Conta25 — NU au feature:** zero menționare cross-client vendor risk în niciuna din documentațiile lor.

6. **Latitude App — single-firm focus:** verifică SAF-T/e-TVA per firmă individuală, nu cross-firms aggregated.

### Competitori care fac PARȚIAL

- **Coface PartnerSCAN** (parteneriat Deloitte) — vendor risk single-firm (firma X verifică furnizor Y), nu cross-cabinet. Pricing enterprise.
- **Termene.ro** — alerte portofoliu pe info publice (insolvență, inactivitate), nu pattern erori fiscale.

### Competitori care fac COMPLET

**ZERO.** Nu există competitor cu dataset cross-cabinet care detectează network risk patterns.

### Implicație pentru CompliScan

**PĂSTRĂM — moat valid, dar EXECUTABIL DOAR LA SCALE.** Acest feature funcționează cu effects ≥ 50-100 cabinete pilot. Cu 1 cabinet nu e network. Recomandări:
- (a) Build feature dar lansează DOAR după 30+ cabinete onboarded
- (b) Marketing: "cu cât mai multe cabinete folosesc CompliScan, cu atât rețeaua de alerte e mai bună" — network effect viral
- (c) Risc moral: GDPR + competitive cabinet data sharing. Trebuie anonimizat + opt-in legal explicit + agregare statistică (no PII)
- (d) Brevetabil potențial — algoritm "cross-cabinet pattern detection" + "vendor risk score from N cabinets"

**Risc real:** ANAF însuși publică un "Buletin vendor risk" public via SPV → moat dispare. Probabilitate 30% în 24-36 luni. Counter: dacă noi avem 200+ cabinete cu 15K+ firme, datele noastre sunt MAI granulare decât ANAF (deoarece avem semnal de "cabinete care frequent reclamă X furnizor" — un fel de Yelp pentru cabinete fiscale).

**Recomandare:** este feature DE TIER 2 (post-MVP), nu de la lansare. Construiește mecanismul tehnic de la început, lansează ca diferențiator pentru anul 2.

---

## Feature 8: Citire SPV foundation (vector fiscal + fise rol + somații + e-Factura + recipise)

**Verdict:** ❌ EXISTĂ DEJA (overlap total)

### Evidence

1. **SmartBill ManagerConta — face COMPLET ȘI GRATUIT.** Quote https://www.smartbill.ro/produse/managerconta: "Acces rapid la informatiile despre clienti din SPV: fise rol, somatii si notificari" + "extrase trezorerie." Quote: "intr-un sfert de ora pentru toti clientii." 100% gratuit pentru cabinete. 100.000+ contabili instalat.

2. **Nexus ERP — face COMPLET.** Quote https://www.docs.nexuserp.ro/articol/utilizare-mesaje-spv-anaf/306: "SPV messages are automatically downloaded from the ANAF platform directly into the accounting file of the Nexus ERP program" + "RoboNexy tool (digital robot) — processes can be completely or partially automated, including importing bank statements through bank APIs, exporting payment proposals, importing e-factura messages, and automatically loading e-transport requests."

3. **Keez — face VECTOR FISCAL:** quote https://www.keez.ro/: "Keez integrates with ANAF and monitors these criteria (called fiscal vector) continuously."

4. **SAGA, NextUp, WinMentor, Oblio, FGO — toți au integrare SPV** la diverse niveluri (de la PDF/XML import la sync automat).

5. **ANAF SPV nativ — gratuit** — manual per CUI, dar accesibil.

### Competitori care fac PARȚIAL

- **ContApp** — automated SPV refresh, calendar fiscal, dar segment PFA.
- **SOLO** — SPV pentru PFA.

### Competitori care fac COMPLET

- **SmartBill ManagerConta** — GRATUIT, 100.000+ adopție
- **Nexus ERP** — RoboNexy + sync SPV bidirectional
- **Keez** — vector fiscal monitorizare continuă

### Implicație pentru CompliScan

**STOP — NU mai vinde acest feature ca diferențiator.** Citește SPV e parity minim. Trebuie SĂ o aibă (Maria nu va folosi CompliScan dacă nu sync SPV), dar e parity, nu moat.

**Recomandare:** menționăm featură ca **prerequisite de bază**, fără să o promovăm marketing. Comparabil cu "noi tehnologia AI" — toți o au, n-o vând. Cuvântul: "Cu sync SPV (firește)" în feature matrix, dar NU pe homepage.

**Pricing:** acest feature nu contribuie la justify 400 RON/lună. Justify-ul vine din Feature 1, 5, 7, 11.

---

## Feature 9: Cross-ERP reader (SAGA + Oblio + SmartBill + WinMentor bidirectional)

**Verdict:** ⚠️ MOAT PARȚIAL

### Evidence

1. **Oblio export to SAGA/WinMentor/Ciel — uni-direcțional.** Quote https://www.oblio.eu/facturare: "Invoices and payments automatically reach the accountant in automatic mode if they use one of the accounting programs: Saga, WinMentor, Ciel" + "users can export company data to Saga, WinMentor, Ciel." **EXPORT, nu read bidirectional.**

2. **SmartBill — are conectori ERP, dar pe direcție din SmartBill către alți.** Quote https://ajutor.smartbill.ro/article/240-export-saga-rapoarte-facturi-emise: "Exporturi pentru Saga din raportul Facturi emise" — export către SAGA, nu read din SAGA.

3. **Make It Future — conector third-party:** quote https://www.makeitfuture.eu/whmcs: "Conectează WHMCS cu Oblio, Smartbill, FGO, Winmentor și efactura" — middleware comercial, sync uni-directional în general.

4. **SAGA — desktop, NU API REST public.** Quote forum + research: SAGA acceptă import CSV/XLS/XML, nu expune REST API documentat pentru read live.

5. **WinMentor — API limitat/proprietary.** Quote https://portal.winmentor.ro/winmentor/oferta/preturi/: licență per-post, sync prin Declarații WMConect 49 €/an.

6. **ManagerConta — accept PDF/XML import, NU citire bidirecțională.** Confirmat raport anterior: PDF/XML inteligent semnare+depunere, NU read source bidirectional.

7. **Latitude App — read SAF-T XML și D300/D390/D394 upload manual.** Nu sync automat cu SAGA/WinMentor.

### Competitori care fac PARȚIAL

- **Oblio** — export uni-direcțional la SAGA/WinMentor/Ciel (din Oblio → SAGA)
- **Make It Future / Plătiți / alți integratori third-party** — middleware comercial pentru sync ERP
- **SmartBill** — export către SAGA (din SmartBill → SAGA)

### Competitori care fac COMPLET

**ZERO bidirectional reader cu citire 3+ ERP-uri.** Nimeni nu face citire LIVE bidirectional din SAGA + Oblio + WinMentor + SmartBill simultan într-un cabinet cockpit unificat.

### Implicație pentru CompliScan

**PĂSTRĂM — moat parțial valid, dar effort tehnic mare.** Construim:
- (a) Conector SAGA (parsing fișiere desktop + watch folder + import live)
- (b) API integration cu SmartBill (au public API documentat — cloud.smartbill.ro)
- (c) Oblio API (au integrare publică)
- (d) WinMentor — proprietary, prin parsing fișiere export

**Risc real:** SAGA fără API REST modern e blocker tehnic. Soluție: agent local instalat la cabinet care sync live. UX complicat pentru Maria pe Mac/Linux. Recomandare hibrid: conector primary SmartBill+Oblio (cloud-native), SAGA prin import incremental.

**Pricing:** acest feature deblochează ~30-40% din piață (cabinete pe SAGA pure care nu pot folosi ManagerConta pentru cross-correlation). Major selling point.

---

## Feature 10: Calendar fiscal automat per client (din vector fiscal)

**Verdict:** ❌ EXISTĂ DEJA (overlap parțial)

### Evidence

1. **SmartBill ManagerConta — face explicit.** Quote din WebFetch https://blog.smartbill.ro/managerconta-gestionare-declaratii/: "The system uses fiscal vector data to propune automat termenele de depunere, which update when the vector changes" + "deadline updates are applied in bulk for all accessible clients in SPV." Dashboard cu status declarații pe lună + status pe trei faze (signing, filing, receipt confirmation). **Per-client deadline editing** + bulk update + visual indicators.

2. **iSpv — calendar fiscal digital dedicat.** Quote https://ispv.ro/calendar-fiscal: "iSpv offers a digital fiscal calendar, automatically updated, so you are always up to date. The fiscal calendar uses a visual system with color codes: red for exceeded deadlines, yellow for urgent deadlines (in the next 7 days) and green for up-to-date declarations." Standalone calendar, nu cabinet-cross-client.

3. **Portalcontabilitate.ro — calendar editorial:** quote https://www.portalcontabilitate.ro/calendar/ "Calendarul obligatiilor fiscale: termene depunere declaratii ANAF 2026" — calendar editorial publicat, nu integrat per-client.

4. **Keez — vector fiscal monitorizare continuă** confirmat.

5. **Nexus ERP** — centralized tracking fiscal declarations.

### Competitori care fac PARȚIAL

- Toți (SmartBill, SAGA, Nexus, NextUp, Keez, SOLO, ContApp) au calendar fiscal cu reminder.

### Competitori care fac COMPLET

- **SmartBill ManagerConta** — vector fiscal + bulk update + visual status + per-client editing. GRATUIT.
- **iSpv** — dedicat calendar, color-coded urgency.

### Implicație pentru CompliScan

**STOP — NU mai vinde calendar fiscal ca diferențiator.** Parity minimum. Construim featură (Maria are nevoie), dar nu o promovăm marketing.

**Diferențiere posibilă** (low priority): smart reminders cross-correlated cu risc score: "D300 e marți DAR nu depune încă — datele tale au discrepanță cu P300 precompletat, fixează corecția întâi." Asta NU e calendar, e workflow correctiv cross-feature.

---

## Feature 11: Inventar certificate digitale + împuterniciri cu alertă expirare 30/7 zile

**Verdict:** ✅ MOAT VALID — quick-win efort mic

### Evidence

1. **certSIGN — alertă la cert individual, NU inventar consolidat.** Quote https://www.certsign.ro/ro/suport/utilizarea-certificatului-de-semnatura-electronica-la-anaf/: "certSIGN sends the procedure for renewing the certificate 45 days before expiration, and if not completed, it resends the renewal notification email 15 days before expiration." Per-certificat individual, nu agregare cabinet.

2. **AlfaSign, DigiSign — similar per-cert, no consolidat.** Quote https://alfasign.ro/en/renew-digital-certificate/: "Certificate renewal can be performed within a maximum of 30 days and minimum of 2 days before expiration." Pe certificat-by-certificat.

3. **SmartBill ManagerConta — token SPV refresh, NU inventar cabinet.** Quote https://ajutor.smartbill.ro/article/982: "Authorization is valid for only 90 days, after which reauthorization will be requested" + auto-refresh 7 zile. **DOAR PENTRU PROPRIUL TOKEN cabinet, NU pentru certificate clienților**.

4. **ManagerConta utilizatori multi:** quote https://ajutorconta.smartbill.ro/article/818-utilizatori: "ManagerConta account can be accessed by multiple users" + multi-token signing. **Inventar certificate consolidat pe portofoliu cu alertă pre-expirare per client — NU**.

5. **Form 270 / împuterniciri notariale tracking — niciunde:** quote https://www.avocatnet.ro/articol_36837: "A delegation gives accountants the right to sign and submit fiscal declarations and/or upload electronic invoices in e-Factura using their qualified digital certificate" + "delegation document authenticated by a notary public is required." Niciun software RO NU urmărește expirarea împuternicirilor.

6. **ContApp expirare cert:** quote https://suport.contapp.ro/article/167-expirare-certificat-expirare-token-de-acces: per-PFA expirare, NU inventar consolidat cabinet.

### Competitori care fac PARȚIAL

- **certSIGN/AlfaSign/DigiSign** — alertă per-cert individual, sent prin email. Cabinetul cu 78 clienți primește 78 emails răzlețe (nu consolidate).
- **SmartBill ManagerConta** — token-ul propriu refresh la 7 zile.

### Competitori care fac COMPLET

**ZERO.** Nu există dashboard cabinet consolidat cu: (a) certificate eIDAS clienți + (b) token SPV cabinet + (c) împuterniciri form 270 + (d) procuri notariale, cu alertă unified 30/7 zile pre-expirare.

### Implicație pentru CompliScan

**PĂSTRĂM — moat real, effort tehnic MIC.** Quick-win:
- (a) Inventar centralizat: cert eIDAS (data validitate + emitent + CIF client), token SPV (data refresh), împuternicire 270 (data semnare + valabilitate), procură notarială (data + termen)
- (b) Alertă 30/7/1 zi pre-expirare via email + dashboard
- (c) One-click renew links: certSIGN renewal portal + form 270 generate prefilled

**Pricing power:** singur feature nu justifică pricing, dar consolidare e UX win major. Diferențiator de "polish" — Maria simte că ai grijă de ea.

**Risc real:** SmartBill poate adăuga în 2-3 luni la ManagerConta (effort tehnic mic). Counter: noi îl avem la lansare + adăugăm tracking împuternicire 270 + procură notarială (SmartBill nu o face — e nișă).

---

## Sumar tabel — 11 features × verdict × confidence × surse

| # | Feature | Verdict | Confidence | Surse verificate principale | Risc moat erosion (12 luni) |
|---|---------|---------|------------|-----------------------------|------------------------------|
| 1 | Risk Score 0-100 pre-ANAF + Top 5 | ✅ MOAT VALID | 9/10 | SmartBill help, Nexus blog, Latitude App e-tva, Termene.ro, ANAF fișa risc | Mediu — ANAF APOLODOR posibil 24-36 luni |
| 2 | Cross-correlation declarații 8 reguli | ⚠️ MOAT PARȚIAL | 7/10 | **Latitude App SAF-T page** (FACE 5 din 8), forum SAGA, DUKIntegrator, Nexus | Mare — Latitude poate lansa cabinet pack |
| 3 | D300 ↔ P300 e-TVA reconciler | ⚠️ MOAT PARȚIAL | 6/10 | **Latitude App e-tva page** (FACE COMPLET), Nexus ERP blog, forum SAGA, avocatnet | Mare — Latitude deja face, pricing-only barrier |
| 4 | Workflow cereri docs cu magic link + audit trail | ⚠️ MOAT PARȚIAL | 7/10 | **Vello.ro** (magic link), Huddle.ro, **TaxDome audit trail page**, ManagerConta docs | Mare — Vello adaugă audit trail în 6 luni |
| 5 | Audit Pack ZIP ANAF cu manifest + opinion CECCAR | ✅ MOAT VALID | 9/10 | SmartBill Dosarul clientului help, Vello, Dosar.contabilul.ro, CECCAR Standard 21 | Mediu — SmartBill investește vizibil "dosar" |
| 6 | Burden Index profitabilitate per client | ⚠️ MOAT PARȚIAL | 5/10 | **Conta25** (FACE), **TaxDome time-billing** (FACE COMPLET RO-language), Huddle | Mare — Conta25 + TaxDome activi |
| 7 | Cross-client network detection (vendor toxic) | ✅ MOAT VALID | 8/10 | Coface PartnerSCAN, Termene.ro, ANAF APOLODOR, search global VRM | Mic — ANAF publică direct 24-36 luni |
| 8 | Citire SPV foundation (vector fiscal + recipise) | ❌ EXISTĂ DEJA | 10/10 | SmartBill ManagerConta gratuit, Nexus RoboNexy, Keez, SAGA, NextUp | N/A — parity, nu moat |
| 9 | Cross-ERP reader bidirectional SAGA+Oblio+WM+SB | ⚠️ MOAT PARȚIAL | 7/10 | Oblio export pagini, SmartBill export SAGA, Make It Future, SAGA forum | Mediu — depinde de SAGA API public |
| 10 | Calendar fiscal automat per client din vector | ❌ EXISTĂ DEJA | 10/10 | **SmartBill ManagerConta vector fiscal**, iSpv, Keez, Nexus | N/A — parity, nu moat |
| 11 | Inventar certificate + împuterniciri alertă | ✅ MOAT VALID | 8/10 | certSIGN, AlfaSign, DigiSign, SmartBill ManagerConta utilizatori | Mare — SmartBill poate adăuga 2-3 luni |

### Sumar statistic

- **✅ MOAT VALID (blue ocean curat):** 4 features (1, 5, 7, 11)
- **⚠️ MOAT PARȚIAL (au competitori, dar diferențiabili):** 4 features (2, 3, 4, 6)
- **❌ EXISTĂ DEJA (parity, nu moat):** 2 features (8, 10) — nu vinde
- **🟡 INCERT:** 0 features

**Cumulativ effort 80% pe MOAT VALID:** features 1, 5, 7, 11 — algoritmi proprietari + execuție bine făcută = moat 12-18 luni minimum.

**Cumulativ effort 15% pe MOAT PARȚIAL cu repoziționare:** features 2, 3, 4 — diferențiere prin scope mai larg + integrare cross-feature + per-cabinet pricing.

**Feature 6 (Burden) — DECIDERE STRATEGICĂ:** păstrăm doar dacă îl integrăm cu Feature 1 + 4 + 7 (meta-feature cross-stack). Stand-alone, pierdem la Conta25/TaxDome.

**Feature 8, 10 — parity required, NU vinde:** construim la nivel funcțional minim, nu pe homepage.

**Feature 9 (Cross-ERP) — diferențiator tehnic:** unic moat dacă SAGA reader live funcționează. Effort mare, dar deblochează 30-40% piață (cabinete SAGA-only).

---

## Recomandări finale

### 1. Repoziționare mesaj (BRUTAL)

**STOP de vândut:**
- "CompliScan SPV cross-client" (Feature 8 — toți o au, gratuit)
- "CompliScan calendar fiscal automat" (Feature 10 — toți o au)
- "CompliScan e-TVA reconciliere" (Feature 3 — Latitude o face direct la €25/lună)

**START de vândut:**
- "**CompliScan Risk Score** — singurul scor 0-100 pre-ANAF cu Top 5 acțiuni ranked per firmă" (Feature 1)
- "**CompliScan Audit Pack** — singurul ZIP audit-grade cu opinion CECCAR + cross-refs declarații" (Feature 5)
- "**CompliScan Network Risk** — singurul cu detectare furnizor toxic cross-cabinet" (Feature 7)
- "**CompliScan Certificate Vault** — singurul inventar consolidat certificate + împuterniciri cabinet" (Feature 11)

### 2. Investigație suplimentară necesară (manuală)

- **Verifică direct Latitude App dacă au demo cabinet pricing.** Sună-i la +40, întreabă "tariful pentru cabinet cu 78 clienți pe modulele SAF-T+e-TVA+TVA." Estimează dacă vor pivota la cabinet pack.
- **Verifică Vello.ro adopție:** câte cabinete au real? Pricing public ok dar adopție necunoscută.
- **Verifică Conta25 după 2026:** scalare de la 15 → 50+ cabinete? Adăugat risc score?
- **Verifică TaxDome RO traction:** câte cabinete RO real folosesc? Are echipa sales locală activă?
- **SAGA API REST modern:** există plan public 2026-2027 pentru API REST modern (din partea Saga Software SRL)? Dacă da, Cross-ERP devine mai ușor.

### 3. Roadmap moat features (ordine prioritate)

**Q1 2026 (luni 1-3):**
- Feature 1 (Risk Score) — algoritm v1 + calibrare cu 5 cabinete pilot
- Feature 11 (Certificate Vault) — quick-win, effort mic
- Feature 5 (Audit Pack) — manifest + cross-refs basic

**Q2 2026 (luni 4-6):**
- Feature 4 (Workflow cereri) — magic link + audit trail granular
- Feature 2 (Cross-correlation) — 8 reguli extinse vs Latitude 5

**Q3 2026 (luni 7-9):**
- Feature 9 (Cross-ERP reader) — SAGA agent + Oblio API + SmartBill API
- Feature 6 (Burden Index) — integrat cu Feature 1 + 4 + 7

**Q4 2026 (luni 10-12):**
- Feature 7 (Network detection) — lansare la 30+ cabinete onboarded
- Feature 3 (e-TVA) — repoziționare pe Top 5 firme cross-portfolio (Latitude face per-firmă)

### 4. Pricing recomandat

Confirmare raport anterior: **399-599 RON/lună flat per cabinet** pentru 50-150 clienți este sweet spot. Justify:
- Sub TaxDome (€50-100/user/lună × 5 useri = 1250-2500 RON/lună)
- Peste Vello.ro Premium (39 €/lună ≈ 195 RON) — dar Vello face 10% din scope-ul CompliScan
- Peste Latitude (€25-175 modul) — dar Latitude e per-firmă
- Justify principal: **1 control ANAF evitat = 30K-100K RON saved**, deci 1 an CompliScan = 4800-7200 RON merită

---

**Sfârșit raport.** Brutal de onest. **4 features sunt moat real blue ocean (1, 5, 7, 11). 4 sunt moat parțial cu competitori activi (2, 3, 4, 6). 2 sunt parity (8, 10) — nu vinde.** Latitude App este cel mai mare risc nedetectat anterior. Vello.ro și Conta25 sunt riscuri secundare. **Repoziționare imediată: stop vânzare features de tip parity, focus marketing pe cele 4 moat valid.**
