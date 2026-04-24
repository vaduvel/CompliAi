# CompliAI — Propunere Unificată de Information Architecture + UX pentru v1

**Status:** decizie arhitecturală canonică pentru execuție  
**Scope:** întreaga aplicație — landing, onboarding, spine operațional, portofoliu, module specialist, output, monitoring  
**Principiu fundamental:** Diana e baseline. Spine-ul e ferm. Modulele specialist sunt unelte ale cockpitului.  
**Public:** Founder / Product / Engineering / QA / Claude Code  
**Commit:** `docs(ia): add IA-UX-PROPUNERE consolidating architecture for v1 launch`

---

## Cuprins

1. [Rezumat executiv](#rezumat-executiv)
2. [Secțiunea 1 — Ce am înțeles](#secțiunea-1--ce-am-înțeles)
3. [Secțiunea 2 — Principii IA/UX](#secțiunea-2--principii-iaux)
4. [Secțiunea 3 — Arhitectura IA propusă](#secțiunea-3--arhitectura-ia-propusă)
5. [Secțiunea 4 — User flows cap-coadă](#secțiunea-4--user-flows-cap-coadă)
6. [Secțiunea 5 — Ce trebuie să moară](#secțiunea-5--ce-trebuie-să-moară)
7. [Secțiunea 6 — Ce trebuie construit nou](#secțiunea-6--ce-trebuie-construit-nou)
8. [Secțiunea 7 — Plan de migrare](#secțiunea-7--plan-de-migrare)
9. [Anexa A — Mapping rute vechi → noi](#anexa-a--mapping-rute-vechi--noi)
10. [Anexa B — Checklist 5-întrebări pentru orice ecran nou](#anexa-b--checklist-5-întrebări-pentru-orice-ecran-nou)
11. [Anexa C — Glossary canonical terms](#anexa-c--glossary-canonical-terms)
12. [Anexa D — Quick-start pentru implementare](#anexa-d--quick-start-pentru-implementare)

---

# Rezumat executiv

## Problema

CompliAI are un motor bun și un spine real — dar suprafețele vizibile s-au multiplicat paralel cu motorul, iar informația arhitecturală reală a divergat de rute și navigație. Auditul 1:1 runtime (2026-03-27) a confirmat live că cele 3 clase de execuție documentary / operational / specialist_handoff funcționează cap-coadă, dar produsul pierde disciplină prin: (a) output fragmentat pe 6-7 suprafețe paralele între Dosar, rapoarte, documente, audit log, trust center, policies; (b) module specialist care se comportă ca produse paralele — NIS2, DSAR, Fiscal, AI Systems, DORA, Whistleblowing — fiecare cu suite proprie de tab-uri, în loc de unelte ale cockpitului; (c) dubluri RO/EN (`/dashboard/setari` vs `/dashboard/settings`, `/dashboard/rapoarte` vs `/dashboard/reports`, `/dashboard/scanari` vs `/dashboard/scan`); (d) batch execution cross-client permis în `/portfolio/tasks`, care rupe modelul „triaj în portofoliu, execuție pe firmă"; (e) onboarding cu ecran intermediar legacy, applicability invizibilă post-onboarding, plan gating ad-hoc în loc de topologic. Aplicația are ~45 de rute dashboard/portfolio active, dintre care 22 sunt redundante sau zombie.

## Principiul fundamental

**Diana (contabil CECCAR cu 5-30 clienți) e baseline-ul arhitecturii.** Mihai (patron solo) e Diana cu 1 firmă în portofoliu. Radu (compliance intern) e Diana fără portofoliu, cu discipline surfaces activate. Viewer e rol intern read-only derivat din Radu. Modelul comercial — contabilul CECCAR cumpără, încarcă clientul cu 100 RON/firmă/lună, patronul nu știe că CompliAI există — e tradus arhitectural: brand-ul cabinetului e primitive topologic pe tot outputul client-facing, patronul e destinatar (nu user), plan-ul partener e capability token care decide ce apare, nu doar ce răspunde. Peste baseline-ul Diana, regula de fier rămâne: **un finding = un cockpit = un singur loc de execuție**. Modulele specialist sunt unelte ale cockpitului cu handoff controlat și revenire automată, nu destinații paralele.

## Rezultatul

**Arhitectura propusă:** 10 obiecte primitive (Firmă, Profil firmă, Portofoliu, Scanare, Finding, Dovadă, Dosar, Livrabil, Alertă, Monitorizare), 43 rute canonice organizate în 5 moduri de navigație distincte (solo, partner portofoliu, partner context client, compliance cu discipline depth, viewer read-only), 8 module specialist recadrate ca cockpit tools cu console mode doar pentru Radu și Diana Studio, output unificat sub un singur Dosar cu 4 tab-uri, Monitorizare ca suită dedicată (overview + 3 sub-rute), Console index pentru compliance heavy users. **Ce moare:** 22 de rute (redundante + zombie) prin redirect 301 sau ștergere, 8 concepte primitive topite în cele 10 canonice, 13 patterns UI interzise, 7 categorii de copy interzise. **Ce se construiește:** 16 items netă, dintre care 5 critical (spine-ul nu stă fără), 7 important (experiență degradată), 4 polish. Niciun item nu cere rewrite de kernel, niciun item nu cere schema migration breaking.

## Planul

**4 sprint-uri, 12 săptămâni total, 37 task-uri atomice.** Sprint 0 (3 săpt) — pre-launch blocker: spine închis cap-coadă, redirect middleware activ, banner workspace, dialog destructive confirm, finding class badge, Home refactor, **și fix-ul pentru ruptura documentară confirmată live în runtime audit (attach → success → dosar → close → reopen)**. Sprint 1 (4 săpt) — IA cleanup major: Dosar unified cu 4 tab-uri, Monitoring suite cu 3 sub-rute, NIS2 shell comun, Settings consolidat, Console index, batch execute eliminat. Sprint 2 (3 săpt) — Partner GTM-ready: brand capture la onboarding + tab Brand, export pipeline brand-aware, Guest Auditor cu footer watermark, paywall contextual, deep-link emails, applicability edit retroactiv. Sprint 3 (2 săpt) — polish: reopen cu stepper repoziționat, secțiuni Acasă pentru non-Monitoring users, viewer rol disabled, empty states + copy cleanup, legacy delete final. Rollback plan per sprint cu feature flags, monitoring de producție primele 7 zile post-deploy, metrici specifice (5xx rate, finding close rate, workspace switch success, export generation, Guest Auditor session leakage).

## Cere

**Autorizez execuția Sprint 0.** Sprint-urile 1-3 se declanșează automat la închidere verde a sprint-ului anterior pe Definition of Done testabil live. La finalul Sprint 3 (săpt. 12), produsul e launch-ready pentru vânzare primilor contabili CECCAR plătitori.

---

# Secțiunea 1 — Ce am înțeles

## 1.1 Produsul

CompliAI nu este scanner, nici generator de documente, nici centru de rapoarte — deși aplicația are toate trei înăuntru. Produsul e un **orchestrator de ciclu de viață pentru findings**, construit ca o coloană vertebrală: *awareness → intrare → profilare firmă → applicability → findings → cockpit → dovadă în dosar → monitorizare → redeschidere*. Motorul real trăiește în `lib/compliscan/finding-kernel.ts`, unde orice finding e clasificat într-una din 3 clase de execuție — `documentary`, `operational`, `specialist_handoff` — și fiecare clasă are un `CockpitRecipe` propriu care dictează CTA-ul, dacă se deschide generator inline, dacă se cere evidence note, și dacă se face handoff controlat cu `workflowLink` + `returnTo`. Auditul 1:1 din 27-03-2026 confirmă live cap-coadă toate 3 clasele. Asta e spine-ul care chiar funcționează. Restul aplicației — scan, reports, dosar, portfolio, module specialist — sunt suprafețe care ori servesc spine-ul, ori îl diluează.

Modelul comercial validează alegerea de design: CompliAI se vinde prin contabil CECCAR, nu direct la patron — deci produsul trebuie să scaleze pe portofoliu, cu context client persistent și livrabile brand-uite cabinet, nu să fie un dashboard solo cosmetizat. Contabilul cumpără CompliAI la €19-99/lună, încarcă fiecare client cu ~100 RON/firmă/lună, clientul primește compliance acoperit fără să învețe legi. Patronul e destinatar — de raport lunar, de trust profile public, de magic link de aprobare, de pachet renewal — niciodată user de aplicație.

## 1.2 Userii

Codul cunoaște exact cei 3 useri descriși în brief-ul fondatorului. În `lib/server/auth.ts`, `UserMode` are 4 valori — `solo`, `partner`, `compliance`, `viewer` — cu `WorkspaceMode` separat (`org` | `portfolio`) doar pentru `partner`, care poate comuta între vederea agregată și contextul unei firme active. `resolveOnboardingDestination` împrăștie persona la ieșirea din onboarding: `solo → /dashboard/resolve`, `partner → /portfolio`, `compliance → /dashboard/resolve`, `viewer → /dashboard`.

**Diana** (partner / consultant contabil) e user primar v1 și baseline pentru întreaga arhitectură — tot ce funcționează pentru Diana cu 15 clienți trebuie să se degradeze elegant pentru Mihai cu 1 firmă și pentru Radu fără portofoliu. Diana are deja shell-ul real în cod: `PortfolioOverviewClient` cu import ANAF-prefill, plan gating (`PARTNER_PLAN_REQUIRED`), drilldown pe `/portfolio/client/[orgId]` prin `ClientContextPanel`, și workspace switch controlat prin `LegacyWorkspaceBridge`. Suprafețele secundare (portfolio alerts, tasks, reports, vendors) există dar au drift — în special batch execution pe `/portfolio/tasks` care contrazice disciplina „triaj cross-client, execuție per firmă".

**Mihai** (solo, patron SRL) e cea mai bine servită persona azi — nav 5-iteme, cockpit funcțional pentru toate 3 clasele, flow documentar închis cap-coadă confirmat live. Dar este Diana degenerată: arhitectura nu construim pornind de la el, ci pornind de la Diana cu degradare la `portfolio.length === 1`. **Radu** (compliance intern, fintech / firmă medie) e Diana fără portofoliu, cu discipline surfaces activate — approvals, review cycles, audit trail, traceability, revalidation, agent orchestrator. El lucrează într-un singur workspace ca Mihai, dar cu cerințe de disciplină peste medie. **Viewer** e rol intern permanent (ex. manager senior care supervizează fără să execute) — subset read-only din Radu, nu user primar; auditorul extern temporar este `GuestAuditor`, concept distinct cu sesiune expirabilă și scope limitat.

## 1.3 Modulele — reale, suport, moarte

Trei categorii clare. **Realmente vii în cockpit** (parte din spine): generatorul documentar pentru `GDPR-001` (privacy-policy), `GDPR-010` (DPA), `AI-005` (ai-governance) — singurele 3 cu flow închis cap-coadă (generate → validate → approve → resolve → Dosar → monitoring). Alte 7 tipuri (`GDPR-002/003/004/006/016`, `PAY-001`, `HR-001/002/003`) sunt marcate `documentary` dar au fie poarta de attach incompletă (`GDPR-016 retention-policy`), fie cer confirmare externă (`PAY-001 → /dashboard/pay-transparency`).

**Suport / handoff controlat** (specialist_handoff cu `returnTo` automat înapoi în cockpit): NIS2 (eligibility, assessment, incident, governance, maturity, înregistrare-DNSC, vendors), DSAR (access, erasure), ANSPDCP breach (`GDPR-019`), vendor-review pack, contracts-pack, HR packs (job-descriptions, proceduri, reges-correction). Acestea sunt *tool-uri de profunzime folosite din cockpit*, nu destinații primare.

**Produse paralele** — nu primesc trafic prin cockpit, stau în navigație ca destinații de sine stătătoare: `/dashboard/sisteme` (+ eu-db-wizard) pentru AI Systems, `/dashboard/dora`, `/dashboard/whistleblowing`, și tab-urile non-SPV din `/dashboard/fiscal` (Discrepancies, Filing Records, Submit SPV, e-Factura Signals) care se comportă ca o tax-ops console separată.

**Moarte / legacy zgomot:** `/dashboard/scanari` (dublură RO a `/dashboard/scan`), `/dashboard/setari` + `/dashboard/setari/abonament` (dublură RO a `/dashboard/settings`), `/dashboard/documente` (dublură a `/dashboard/scan/history`), `/dashboard/rapoarte` + `/rapoarte/auditor-vault` + `/rapoarte/trust-profile` (dublură RO a `/dashboard/reports/*`), `/dashboard/politici`, `/dashboard/checklists`, `/dashboard/findings`, `/dashboard/conformitate`, `/dashboard/generator`, `/dashboard/audit-log`, `/onboarding/finish` (redus azi la redirect pur dar rămâne ca URL), `/account/settings` (în afara arborelui principal).

## 1.4 Capacitățile acumulate

**Mihai** primește: landing live cu register-first, onboarding wizard observabil (rol → CUI → website → sector → mărime → AI/eFactura/intake → applicability), snapshot compact „Se aplică / Am găsit / Acum faci asta" la ieșire, resolve queue cu sortare pe severitate + filtre (framework, severity, status, tag), cockpit cu 3 flow-uri class-aware (generator inline pentru documentary, evidence card pentru operational, handoff cu auto-return pentru specialist), document generation + `generated-document-validation` + adopție, Dosar ce afișează cazurile rezolvate cu dovada legată, monitoring cu `nextMonitoringDateISO` + redeschidere prin drift/review-date.

**Diana** primește în plus: portofoliu agregat cu plan gating, import client CSV sau ANAF-prefill pe CUI, urgency queue cross-client, `/portfolio/alerts` (schimbări detectate), `/portfolio/tasks` (remediere cross-client — azi batch-capable, ceea ce va fi tăiat), `/portfolio/vendors` (furnizori comuni), `/portfolio/reports` (metadata livrabile), drilldown în firmă cu context persistent via workspace switch, și acces la toate exporturile (`audit-pack`, `annex-lite`, `vendor-trust-pack`, `ai-act-evidence-pack`).

**Radu** primește deasupra spine-ului: approvals, review-cycles, audit-log, traceability family-evidence, drift-trigger-engine, revalidation cu replacement de dovadă, autonomy settings, scheduled reports, cron-uri de monitoring (drift-sweep, legislation-monitor, efactura-spv-monthly, audit-pack-monthly, vendor-review-revalidation, agent-orchestrator). Toți 3 împart aceleași rute primare — diferența e nav-ul și destinația post-onboarding.

## 1.5 Tensiunea între cod și experiență

Aplicația nu minte despre motor — adevărul e că **IA declarată e mai curată decât IA reală a rutelor**, și asta vine din patru tensiuni concrete:

**Prima — output-ul e fragmentat pe 6-7 suprafețe.** `dashboardRouteGroups.dosar` absoarbe declarativ `dosar + reports + reports/vault + reports/audit-log + reports/policies + reports/trust-center + generator + ropa`, dar fiecare rută există live și poate fi țintă de redirect. Când un finding se închide, userul poate ajunge în oricare din ele, și Dosarul principal își pierde statutul de „locul unde ajunge dovada". Peste asta se suprapun duplurile RO/EN și rutele legacy (`documente`, `politici`, `checklists`, `audit-log` la nivel 1). E zgomot de rute care dublează decizia userului.

**A doua — `workflowLink` scoate execuția din cockpit pentru cazuri care ar putea rămâne înăuntru.** Pentru specialist_handoff cu auto-return (DSAR, NIS2-001/005/015, ANSPDCP breach), arhitectura e corectă: cockpit → modul specialist face pasul greu → revenire automată. Dar pentru cazuri operaționale (cookies `GDPR-005`, vendor-review, HR, contracts, retention-policy) execuția pleacă din cockpit fără motiv arhitectural, doar pentru că există o pagină specialist. Și odată ce userul e în `/dashboard/nis2` sau `/dashboard/vendor-review`, acele pagini sunt suite-uri proprii cu tab-uri și sub-flow-uri, adică se comportă ca produse paralele.

**A treia — produsele paralele ocupă spațiu navigational și mental.** `Sisteme`, `DORA`, `Whistleblowing`, și tab-urile non-SPV din `Fiscal` nu primesc trafic prin cockpit handoff. Există ca destinații standalone, contrazicând regula de fier. Roadmap-ul ANAF o spune explicit: „nu construim modul ANAF gigant separat, integrăm semnalele în `signal → finding → evidence → report`" — dar `/dashboard/fiscal` arată azi ca o consolă fiscală cu 5 tab-uri, iar `/dashboard/sisteme` are propriul wizard EU-DB.

**A patra — partner-ul are două pattern-uri care se bat cap în cap.** `/portfolio/tasks` permite batch execution cross-client pe taskuri, contrazicând modelul „triage în portofoliu, execuție în workspace client". Mai mult, `portfolio-reports` nu e încă un livrabil matur, iar brand-ul cabinetului (care ar trebui să fie arhitectural peste orice output client-facing) este azi un flag partial (`PARTNER_WHITE_LABEL`) fără propagare sistemică.

**Sub-tensiunea dominantă:** între un kernel foarte bun (`finding-kernel.ts` cu 3 clase, 3800+ linii de contract + recipe + return-mode logic, live-validat) și o IA de rute care nu exprimă acel kernel. Motorul știe că `operational ≠ specialist_handoff ≠ documentary`. UI-ul încă îi lasă pe toți în același queue cu marcare slabă, îi trimite în pagini specialist care nu sunt redesenate ca „panouri de lucru" pentru cockpit, și absoarbe output-ul în 6 suprafețe paralele în loc de Dosar unic. Nu e o problemă de refacere — e o problemă de disciplină a suprafețelor.

---

# Secțiunea 2 — Principii IA/UX

Fiecare principiu e derivat dintr-o tensiune concretă din cod sau din documente, și fiecare *taie* ceva din starea actuală. Nu sunt platitudini. Sunt reguli care decid la fiecare pas dacă o propunere rămâne sau pică. Orice propunere ulterioară din acest document trebuie să poată fi motivată prin cel puțin 1-2 principii de aici.

## P1 — Diana e baseline, Mihai și Radu sunt cazuri degenerate

Structura arhitecturii se construiește pentru Diana cu 15 firme. Mihai e Diana cu `portfolio.length === 1`. Radu e Diana fără portofoliu dar cu discipline surfaces activate (approvals, review cycles, audit trail, revalidation). Nu avem două nav-uri, două onboarding-uri, două modele mentale — avem unul, care se degradează elegant când contextul o cere. **Interdicție:** nav-ul solo și nav-ul partner nu mai sunt două arbori paraleli; sunt aceeași structură cu un singur item (Portofoliu) care devine invizibil când portofoliul are o singură firmă. **Consecință:** `soloNavItems` dispare ca noțiune separată. Există „nav personal" care e Diana lite.

## P2 — Firmă activă e primitivă persistentă, nu cookie ascuns

Orice acțiune din aplicație se întâmplă în contextul unei firme — fie e „firma mea" (Mihai), fie „un client din portofoliu" (Diana), fie „firma mea în care fac compliance intern" (Radu). Contextul trebuie să fie vizibil în shell permanent, nu ascuns în cookie `compliscan_workspace_pref`. **Ce cere:** un workspace header persistent care arată fără ambiguitate numele firmei + badge de rol contextual („firma ta" vs „lucrezi pentru Client X — ca Cabinet Popescu"), plus switcher când există portofoliu. **Ce interzice:** execuție într-un context inferat greșit — dacă Diana are portofoliu deschis și apasă Enter pe un finding din feed global, sistemul îi cere explicit confirmarea firmei. **Consecință de cod:** `WorkspaceMode = "org" | "portfolio"` rămâne, dar `orgId` activ e expus în shell și validat la fiecare mutație.

## P3 — Un finding = un cockpit = un singur loc de execuție

Regula de fier pe care kernel-ul deja o conține, pe care UI-ul o încalcă azi prin `workflowLink` exagerat. Cockpitul e singurul ecran unde userul *execută* un caz. Orice altă suprafață care pare să execute un caz e fie suport (panou lateral, drawer, accordion), fie handoff controlat cu `returnTo` automat. **Excepție explicită:** consolele de intake pentru rapoarte / incidente (whistleblowing intern, NIS2 incident intake, DORA incident log) rămân surface primary pentru Radu — ele nu închid findings, ele creează findings care ajung apoi în cockpit. Diferența e că cockpitul nu *e* consola, e consecința ei. **Ce interzice:** pagini standalone care permit rezolvarea unui caz fără să treci prin cockpit. **Ce cere:** fiecare suprafață specialist declară explicit dacă e *primary* (are propriul job independent — ex. canal public whistleblowing, intake incidente) sau *cockpit tool* (nu se intră direct, doar cu `findingId`).

## P4 — Cockpit class-aware, nu flat

Kernel-ul știe deja 3 clase de execuție (`documentary`, `operational`, `specialist_handoff`). UI-ul trebuie să le expună diferit, nu identic. Un finding documentar are generator inline + validate + approve + resolve. Unul operațional are evidence card + upload/notă + gating close. Unul specialist_handoff are hero cu „Pasul greu se face în modulul X, te aducem înapoi". **Ce interzice:** același cockpit cu CTA generic „Rezolvă" pe toate findings-urile. **Ce cere:** queue-ul `De rezolvat` afișează class-badge (`Document` / `Acțiune` / `Asistat`) la fiecare rând, ca userul să știe din listă ce fel de muncă îl așteaptă — infrastructura există (`getExecutionClassLabel` în `resolve-page.tsx`), trebuie făcută vizibilă.

## P5 — Triaj cross-client permis, execuție cross-client interzis

Diana are voie să vadă toți clienții deodată în *triaj* (scoruri, alerte, urgențe). Nu are voie să *execute* pe mai mulți clienți deodată — fiecare închidere de finding rulează în contextul firmei. **Regula operațională concretă:**
- **Creare bulk = PERMIS** cu dialog de confirmare scope: creează N findings dintr-o alertă legislativă, refresh status vendori, import N firme din CSV, trimite reminder la N patroni.
- **Execuție bulk = INTERZIS**: marchează N findings ca rezolvate, aprobă N documente, trimite pachete oficiale multi-client, închide cazuri în lot.
- **Criteriul de decizie:** dacă acțiunea schimbă state-ul de *rezolvare* sau *aprobare oficială* a unui finding → interzis bulk. Orice altă operație (creare, observare, notificare, refresh metadata) → permis bulk cu confirmare.

**Ce cere:** `/portfolio/tasks` devine „inbox cross-client agregat" care te trimite în cockpit per client, niciodată „board de execuție în lot". Helperi batch-safe (ex. bulk reminder către client, bulk refresh vendor status) sunt permiși doar dacă nu ating starea findings-urilor.

## P6 — Output unificat la Dosar

Azi avem 6+ suprafețe paralele care afișează output (`/dashboard/dosar`, `/dashboard/reports`, `/dashboard/reports/vault`, `/dashboard/reports/audit-log`, `/dashboard/reports/policies`, `/dashboard/reports/trust-center`, plus dublurile RO). Dosarul trebuie să fie singurul loc unde userul intră după închiderea unui caz. Tot ce e acum în `/reports/*` se comprimă în tab-uri/secțiuni ale Dosarului (Overview, Dovezi & Gap-uri, Pachete & Export, Trasabilitate & Audit). **Ce interzice:** redirect din cockpit către nimic altceva decât `/dashboard/resolve` (următorul caz) sau `/dashboard/dosar` (dovada). **Ce cere:** rute legacy `/dashboard/reports/*` și `/dashboard/rapoarte/*` redirectează silent către secțiunea echivalentă din `/dashboard/dosar` — nu rămân destinații independente în nav.

## P7 — Specialist modules sunt unelte ale cockpitului, nu produse paralele

`/dashboard/nis2`, `/dashboard/dsar`, `/dashboard/vendor-review`, `/dashboard/sisteme`, `/dashboard/dora`, `/dashboard/whistleblowing`, `/dashboard/fiscal`, `/dashboard/pay-transparency` — toate trebuie să aibă un singur mod de intrare pentru rezolvarea findings-urilor: **cu `findingId` din cockpit**, cu `returnTo` automat. Fără `findingId`, pagina afișează un ecran de „consolă specialist" utilă pentru Radu (read-only aggregate, intake pentru rapoarte/incidente), dar **nu e un loc unde un finding se închide**. **Ce interzice:** nav items primari care duc direct în aceste suprafețe pentru solo/partner. **Excepție explicită:** canalul public `/whistleblowing` (intake angajat/cetățean) și intake-urile de incidente rămân — sunt consola care *creează* findings.

## P8 — Monitorizarea e parte din spine, nu decor

`under_monitoring` + `nextMonitoringDateISO` + reopen logic trăiesc în kernel azi, dar UX-ul nu le exprimă. După închidere, cockpitul trebuie să afișeze clar: data următoarei revizuiri, care drift-uri pot redeschide cazul, cine e owner-ul, ce dovadă expiră și când. Redeschiderea reîntoarce userul în același cockpit cu stepper repoziționat pe pasul relevant, nu într-un ecran nou. **Ce interzice:** suprafețe de „monitoring" izolate care arată drift-uri fără CTA de reentry. **Ce cere:** pentru useri cu volum (Diana Pro/Studio, Radu compliance) — Monitorizare e nav item dedicat. Pentru useri cu volum mic (Mihai, Diana Entry/Growth) — Monitorizare se integrează în Acasă ca secțiune, degradare elegantă.

## P9 — White-label arhitectural: brand-ul contabil e default la orice output client-facing

Orice suprafață care iese din aplicație către patron — export PDF de Dosar, link public de Trust Profile, email de renewal/drift/alertă critică, diagnostic 1-page, response pack, handoff către client — e brand-uită automat cu identitatea contabilului (logo, denumire cabinet, date contact, semnătură). CompliAI e invizibil pe orice suprafață pe care o vede patronul. **Ce cere:** un workspace de setări `Setări → Brand & livrabile` care definește logo, culoare accent (aliniat tokens), antet email, semnătură, footer legal, și care propagă în toate output-urile. Captarea brandului se face la onboarding partner (opțional — Diana poate sări și completa la prima export). **Ce interzice:** export-uri cu logo CompliAI în antet când livrabilul e destinat patronului.

## P10 — Patronul e destinatar, nu user

Nu proiectăm flow-uri de navigație pentru patron. Patronul primește trei tipuri de suprafețe, fiecare reduse la minim: (a) magic link action surfaces — un ecran single-purpose pentru o acțiune precisă (aprobă document semnat de owner, confirmă renewal, răspunde la o cerere DSAR primită); (b) public read-only surfaces — `/trust/[orgId]` accesibil fără login, fără meniu, fără cross-link în aplicație; (c) email outputs — raport lunar, alertă critică, renewal. **Ce interzice:** meniuri, dashboard-uri, tool-uri noi proiectate pentru patron. **Ce cere:** fiecare surface magic-link returnează după acțiune într-un ecran de succes care NU invită patronul în aplicație — doar confirmă acțiunea.

## P11 — Plan gating topologic — discret hide, cuantitativ paywall

Entry / Growth / Pro / Studio determină ce apare în nav, ce butoane sunt active, ce exporturi sunt disponibile, câte firme încap în portofoliu. **Regula duală:**
- **Capabilități discrete (ai sau n-ai)** → se ascund complet. Un user pe Entry nu vede în nav rute la care n-are acces — vede în locul lor un hint „se deblochează pe Growth". Ex: `/dashboard/monitoring` sub-rutele nu apar pentru Entry/Growth în nav.
- **Capabilități cuantitative (N până la limită)** → se expun până la limită, apoi paywall contextual la submit. Ex: Diana poate încerca să adauge al 6-lea client pe Growth (butonul rămâne activ), iar la submit apare modal explicativ cu ce deblochează upgrade.

**Ce cere:** `PARTNER_PLAN_REQUIRED` actual devine un sistem de capability tokens (`canAddClient`, `canExportWhiteLabel`, `canRunReview`, `canAccessComplianceDepth`) care se citesc uniform în shell, nu verificări ad-hoc împrăștiate în pagini. **Ce interzice:** rute care returnează 403 pe plan insuficient — plan-ul decide ce *apare*, nu doar ce *răspunde*.

## P12 — Rute canonice unice

O singură rută canonică per concept. `/dashboard/scanari` moare, rămâne `/dashboard/scan`. `/dashboard/setari` + `/account/settings` mor, rămâne `/dashboard/settings`. `/dashboard/documente` + `/dashboard/rapoarte` + `/dashboard/reports/*` mor, totul intră sub `/dashboard/dosar`. `/dashboard/findings`, `/dashboard/checklists`, `/dashboard/politici`, `/dashboard/conformitate`, `/dashboard/generator`, `/dashboard/audit-log`, `/onboarding/finish` — mor ca destinații, devin redirect-uri silențioase sau dispar. **Regulă tabs-vs-rutes:** oriunde ai 3+ „tab-uri" într-o pagină, întreabă — sunt moduri diferite de lucru sau aceeași muncă cu filtre? Dacă sunt moduri diferite (ca NIS2: eligibility = onboarding-like, governance = setup, incidents = reactive, maturitate = periodic assessment), sunt rute separate cu shell comun. Dacă sunt aceeași muncă cu filtre (ca Fiscal: toate sub `monitorizez starea fiscală`), rămân tab-uri. **Ce cere:** orice rută care supraviețuiește are un rol unic și este referențiată din `dashboard-routes.ts` ca sursa unică de adevăr. **Un entry point per destinație:** dacă o rută e accesibilă din 2+ locuri în navigație, creezi confuzie despre „unde trăiește" conceptul — `/portfolio/vendors` e accesibil doar din card în `/portfolio` overview, nu și din Setări.

## P13 — Nav-ul expune spine-ul, multi-modal după rol + plan

Nav-ul primar e construit pentru fiecare combinație rol × plan × workspace:
- **Mihai solo, 1 firmă:** 5 iteme — Acasă, Scanează, De rezolvat, Dosar, Setări. Monitorizare ca secțiune în Acasă.
- **Viewer:** 4 iteme — Acasă, Taskurile mele, Dosar, Setări profil (read-only cu butoane disabled).
- **Diana portofoliu mode:** 5 iteme — Portofoliu, Monitorizare, Remediere, Rapoarte client, Setări.
- **Diana context client, Entry/Growth:** 6 iteme — ↩ Portofoliu, Acasă, Scanează, De rezolvat, Dosar, Setări.
- **Diana context client, Pro/Studio:** 7 iteme — adaugă Monitorizare între De rezolvat și Dosar.
- **Radu compliance, 1 firmă:** 6 iteme — Acasă, Scanează, De rezolvat, Monitorizare, Dosar, Setări. Plus item #7 „Console" dacă plan Pro+ sau rol compliance.

Modulele specialist NU apar în nav primar pentru niciun rol. Sunt accesibile: din cockpit (când se cer prin finding), din Monitorizare (când produc semnale), sau din `/dashboard/console` (index Radu + Diana Studio). Label-uri canonice RO, testate cu contabil CECCAR: **Remediere** (nu „Tasks"), **Rapoarte client** (nu „Livrabile"), **Monitorizare** (nu „Watch"), **Portofoliu** (nu „Portfolio").

## P14 — Onboarding liniar cu pași observabili, applicability editabilă retroactiv

Onboarding-ul nu ascunde întrebări prin card growth. Orice întrebare nouă e un pas nou cu progres vizibil („Pasul 3 din 5", „Mai avem 2 întrebări"). Ieșirea din onboarding exprimă compact `Se aplică / Am găsit / Acum faci asta` pe destinația corectă per persona. **Ce interzice:** `/onboarding/finish` ca ecran intermediar festiv. **Ce cere:** applicability map salvată în `org_state` și vizibilă permanent într-o secțiune „Ce mi se aplică" din Acasă — *și editabilă retroactiv*. Dacă firma începe să proceseze date sensibile, intră sub NIS2 nou, sau adaugă linie de business nouă, userul poate (din Setări → Profil firmă sau din card Acasă) reopen-ui întrebări specifice și aplicația recalculează findings-urile. Nu repornește onboarding — modifică răspunsurile incremental cu preview impact înainte de submit.

## P15 — Orchestrator, nu avocat

Produsul e orchestrator de compliance. Nu dă verdicte juridice, nu se substituie avocatului, nu promite „100% compliant". Închiderile critice cu implicații legale (aprobare document semnat de owner, trimitere oficială la ANAF/ANSPDCP/DNSC) cer confirmare umană explicită cu disclaimer scurt — nu butoane „Trimite automat". **Ce interzice:** copy de marketing pe butoane (`Începe acum!`, `Super!`), emoji în produs (exceptie landing + email), celebration states („Felicitări! Ai rezolvat!"), survey-uri după success care întrerup flow. **Ce cere:** ton calm autoritar peste tot, „tu" second person singular, dark-first cu tokens Warm Graphite v2 din `styles/tokens.css`, marketing-ul se oprește la landing și nu intră în produs.

## Sumar executiv al principiilor

Diana-first (P1) + firma activă primitivă (P2) sunt fundamentul structural. Regula de fier (P3) + class-aware cockpit (P4) + no batch execution cross-client (P5) + output unificat (P6) + specialist ca unealtă (P7) + monitoring vizibil (P8) sunt spine-ul operațional. White-label arhitectural (P9) + patron destinatar (P10) + plan topologic (P11) sunt modelul economic tradus în IA. Rute canonice (P12) + nav minim multi-modal (P13) + onboarding observabil + applicability editabilă (P14) + ton orchestrator (P15) sunt disciplina de suprafață.

**Aceste 15 principii decid tot ce urmează.** Orice propunere din secțiunile următoare trebuie să poată fi motivată prin cel puțin 1-2 principii de aici. Dacă vreodată o propunere contrazice un principiu, ori principiul e greșit, ori propunerea e greșită — nu coexistă.

---

# Secțiunea 3 — Arhitectura IA propusă

## 3.1 Obiectele de bază — 10 primitive

Task s-a topit în Finding. Drift s-a topit în Alertă. Document generat + notă + fișier + link s-au topit în Dovadă. Report + Pack + Export s-au topit în Livrabil. Approval și Review cycle s-au topit în Monitorizare ca stare. Vendor și AI system rămân entități interne ale Firmei, nu primitive top-level.

| # | Obiect | Rol în modelul userului | Relații principale |
|---|---|---|---|
| 1 | **Firmă** | entitatea protejată; are CUI, sector, mărime, profil de aplicabilitate | *are* Profil, Dosar, Findings, Scanări, Alerte; *aparține* unui Portofoliu (doar pentru Diana) |
| 2 | **Profil firmă** | răspunsurile din onboarding + applicability map; sursa care determină ce findings se aplică | *aparține* unei Firme; *produce* Findings prin applicability |
| 3 | **Portofoliu** | colecția de Firme a lui Diana; există doar dacă `userMode=partner` | *conține* Firme; *agregă* Alerte + Findings + Livrabile cross-client |
| 4 | **Scanare** | sursa de findings: document, text, site, intake onboarding, ANAF signal, vendor review, legislative change | *aparține* unei Firme; *produce* Findings |
| 5 | **Finding** | cazul de rezolvat; unitatea de muncă; singurul obiect care se închide în cockpit | *aparține* unei Firme; *vine din* Scanare; *are clasa* documentary \| operational \| specialist_handoff; *se închide cu* Dovadă; *intră în* Monitorizare după închidere |
| 6 | **Dovadă** | ce închide un Finding: document generat, notă operațională, fișier, screenshot, export, referință externă | *aparține* unui Finding; *trăiește în* Dosar |
| 7 | **Dosar** | containerul unei Firme: findings închise + dovezi + livrabile + audit trail | *aparține* unei Firme; *agregă* Findings rezolvate + Dovezi; *exportă* Livrabile |
| 8 | **Livrabil** | output extern: audit pack, annex lite, response pack, vendor trust pack, trust profile, raport lunar, diagnostic 1-page | *se generează din* Dosar; *e brand-uit* cu identitatea contabilului activ; *ajunge la* patron/autoritate via email/link/download |
| 9 | **Alertă** | semnal că ceva s-a schimbat și merită atenție: drift de dovadă, schimbare legislativă, vendor revalidation due, review cycle imminent, ANAF notification, incident raportat | *aparține* unei Firme; *poate genera* Finding; *poate redeschide* Finding închis |
| 10 | **Monitorizare** | starea post-închidere: review date, drift triggers, reopen rules, approval queue, legislative watch | *aparține* unei Firme; *acoperă* Findings închise; *produce* Alerte când se activează un trigger |

**Nu sunt obiecte primitive, ci sub-concepte care trăiesc înăuntrul celor 10:** User/Membership (infrastructură auth); Workspace mode (atribut al sesiunii); Cockpit (vedere, nu obiect); Vendor / AI system / DSAR request / Incident (entități interne ale unei Firme, accesate prin Finding sau prin tool specialist); Plan (atribut al Portofoliului sau al contului partener); GuestAuditor (tip de sesiune temporară, nu obiect primitiv al modelului de business).

## 3.2 Structura de navigație — 5 moduri

### Mod 1 — Mihai (solo, 1 firmă) — 5 items

| # | Label | Rută | Scop |
|---|---|---|---|
| 1 | Acasă | `/dashboard` | snapshot + next action + monitoring ca secțiune integrată |
| 2 | Scanează | `/dashboard/scan` | intake: document, text, site |
| 3 | De rezolvat | `/dashboard/resolve` | queue de findings active |
| 4 | Dosar | `/dashboard/dosar` | dovezi, livrabile, exports, audit trail |
| 5 | Setări | `/dashboard/settings` | profil firmă, plan, integrări |

Monitorizare integrată în Acasă ca secțiune „Ce ține de monitorizat azi" (P8 degradat elegant pentru 1 firmă).

### Mod 2 — Diana în portofoliu mode (fără firmă activă) — 5 items

| # | Label | Rută | Scop |
|---|---|---|---|
| 1 | Portofoliu | `/portfolio` | overview cross-client: firme, urgențe, scoruri, plan gating, card Vendors |
| 2 | Monitorizare | `/portfolio/alerts` | alerte cross-client: drift, legislative, vendor revalidations, review cycles |
| 3 | Remediere | `/portfolio/tasks` | queue de findings cross-client (triage, NO batch execution — click → switch workspace → cockpit) |
| 4 | Rapoarte client | `/portfolio/reports` | pachete gata de trimis per client, status exporturi, renewal |
| 5 | Setări | `/dashboard/settings` | cont partener: brand contabil, plan, team, white-label, integrări globale |

`/portfolio/vendors` nu apare în nav — accesibil dintr-un singur entry point: cardul dedicat în `/portfolio` overview.

### Mod 3 — Diana în context client activ — 6 sau 7 items

Shell afișează banner persistent: **„Lucrezi pentru Client X SRL — ca Cabinet Popescu & Asociații"**.

| # | Label | Rută | Scop | Vizibil pe plan |
|---|---|---|---|---|
| 1 | ↩ Portofoliu | `/portfolio` | escape hatch | toate |
| 2 | Acasă | `/dashboard` | snapshot al clientului X | toate |
| 3 | Scanează | `/dashboard/scan` | intake pentru clientul X | toate |
| 4 | De rezolvat | `/dashboard/resolve` | queue pentru clientul X | toate |
| 5 | **Monitorizare** | `/dashboard/monitoring` | drift register, review cycles, approvals, legislative, agents | **Pro + Studio** |
| 6 | Dosar | `/dashboard/dosar` | dosarul clientului X | toate |
| 7 | Setări | `/dashboard/settings` | profil firmă X, applicability, integrări client | toate |

Pe Entry/Growth, item 5 dispare; Monitorizare se integrează în Acasă ca secțiune.

### Mod 4 — Radu (compliance intern, 1 firmă) — 6 items + Console

| # | Label | Rută | Scop |
|---|---|---|---|
| 1 | Acasă | `/dashboard` | snapshot + triage |
| 2 | Scanează | `/dashboard/scan` | intake |
| 3 | De rezolvat | `/dashboard/resolve` | queue findings active |
| 4 | Monitorizare | `/dashboard/monitoring` | suita 4 rute: overview + alerte + approvals + agents |
| 5 | Dosar | `/dashboard/dosar` | dovezi + exports + trasabilitate + audit trail |
| 6 | Setări | `/dashboard/settings` | profil firmă, autonomie agenți, integrări, scheduled reports, team |
| 7 | Console | `/dashboard/console` | index 8 console specialist aplicabile firmei |

Item 7 apare pentru `userMode=compliance` sau (`userMode=partner` + `plan=studio`).

### Mod 5 — Viewer (read-only, derivat din Radu) — 4 items

| # | Label | Rută | Scop |
|---|---|---|---|
| 1 | Acasă | `/dashboard` | snapshot read-only |
| 2 | Taskurile mele | `/dashboard/resolve?owner=me` | findings atribuite lui, read-only |
| 3 | Dosar | `/dashboard/dosar` | read-only |
| 4 | Setări | `/dashboard/settings?tab=profile` | doar profilul personal |

Toate butoanele de acțiune prezente vizual dar disabled, cu tooltip „Rol read-only — cere acces la owner".

## 3.3 Rutele canonice — 43 total

**Legendă rol:** `core` = spine primary | `public` = awareness/magic/read-only | `tool` = handoff din cockpit sau consolă specialist pentru Radu | `portfolio` = doar Diana.

### Public / Awareness (13 rute)

| # | Path | Rol | Cine ajunge | Ce conține |
|---|---|---|---|---|
| 1 | `/` | public | toți anonim | landing register-first cu journey complet |
| 2 | `/pricing` | public | toți anonim | 3 planuri: Solo / Growth / Pro + Studio |
| 3 | `/login` | public | toți | auth minim |
| 4 | `/register` | public | toți | creare cont |
| 5 | `/reset-password` | public | toți | auth recovery |
| 6 | `/demo` | public | toți | demo guided (solo + partner) |
| 7 | `/privacy` | public | toți | legal |
| 8 | `/terms` | public | toți | legal |
| 9 | `/trust/[orgId]` | public | patron/client/auditor extern (brand contabil) | trust profile public |
| 10 | `/r/renewal/[orgId]` | public | patron (magic link) | confirmare renewal, single-purpose, brand contabil |
| 11 | `/whistleblowing` | public | angajat / cetățean (magic link per org) | formular public de sesizare |
| 12 | `/claim` | public | patron care a primit invitație de claim | owner ownership flow |
| 13 | `/shared/[token]` | public | destinatarii livrabilelor (client patron) | token-gated: un livrabil specific, brand contabil |

### Onboarding (1 rută)

| # | Path | Rol | Cine ajunge | Ce conține |
|---|---|---|---|---|
| 14 | `/onboarding` | core | toți userii noi | wizard observabil: rol → CUI → ANAF → site → întrebări → applicability scene; pentru partner, pas 4 captează brand cabinet |

### Portofoliu — Diana (5 rute)

| # | Path | Rol | Cine ajunge | Ce conține |
|---|---|---|---|---|
| 15 | `/portfolio` | portfolio | Diana după onboarding/login | overview cross-client + card Vendors |
| 16 | `/portfolio/alerts` | portfolio | Diana zilnic | alerte cross-client agregate |
| 17 | `/portfolio/tasks` | portfolio | Diana triage | queue cross-client findings active; **fără batch execute** |
| 18 | `/portfolio/vendors` | portfolio | Diana vendor hygiene | furnizori partajați cross-client, bulk refresh safe (permis, nu închide finding); accesibil doar din card în `/portfolio` overview |
| 19 | `/portfolio/reports` | portfolio | Diana livrare | livrabile per client: status pachet, renewal, exporturi programate, trust profile share |

### Dashboard core — spine operațional (8 rute)

| # | Path | Rol | Cine ajunge | Ce conține |
|---|---|---|---|---|
| 20 | `/dashboard` | core | solo/compliance după onboarding, Diana în context client | Acasă: snapshot, `Se aplică / Am găsit / Acum faci asta`, next action dominant, secțiuni condiționate (Monitorizare pentru Entry/Growth, Applicability summary) |
| 21 | `/dashboard/scan` | core | toți | intake unificat: document, text, site, tab istoric scanări |
| 22 | `/dashboard/scan/results/[scanId]` | core | după scan | rezultat scan: findings noi, CTA explicit `Mergi la De rezolvat` |
| 23 | `/dashboard/resolve` | core | toți zilnic | queue findings active cu clasă vizibilă (`Document` / `Acțiune` / `Asistat`), filtre, severitate |
| 24 | `/dashboard/resolve/[findingId]` | core | click pe finding | **cockpit unic** cu flow class-aware: documentary/operational/specialist_handoff |
| 25 | `/dashboard/dosar` | core | după închidere caz, pentru livrare | Dosar cu 4 tab-uri (query param `?tab=`): Overview / Dovezi & Gap-uri / Pachete & Export / Trasabilitate & Audit |
| 26 | `/dashboard/scan/history` | core | din Scanează | istoricul scanărilor firmei |
| 27 | `/dashboard/settings` | core | toți | setări workspace cu tab-uri context-aware: Profil / Firmă / Plan / Team / Integrări / Operațional / Brand |

### Monitoring suite (4 rute)

| # | Path | Rol | Cine ajunge | Ce conține |
|---|---|---|---|---|
| 28 | `/dashboard/monitoring` | core | Radu zilnic, Diana pe Pro/Studio | overview cu summary per zonă + badges + `Ce cere atenție azi` |
| 29 | `/dashboard/monitoring/alerte` | core | idem | drift + legislative consolidate; review-uri scadente sunt entry aici când imminent |
| 30 | `/dashboard/monitoring/approvals` | core | idem | queue approvals: aprobă/respinge cu motivare → reject generează finding |
| 31 | `/dashboard/monitoring/agents` | core | idem | agent runs cu propuneri: accept → finding, reject → dismiss |

### NIS2 suite cu shell comun (5 rute)

| # | Path | Rol | Cine ajunge | Ce conține |
|---|---|---|---|---|
| 32 | `/dashboard/nis2` | tool | cockpit sau Radu console | redirect intern la prima sub-rută aplicabilă / overview |
| 33 | `/dashboard/nis2/eligibility` | tool | cu findingId sau console | wizard eligibility NIS2 |
| 34 | `/dashboard/nis2/maturitate` | tool | idem | assessment periodic maturity |
| 35 | `/dashboard/nis2/inregistrare-dnsc` | tool | idem | flow înregistrare DNSC |
| 36 | `/dashboard/nis2/governance` | tool | idem | setup guvernanță NIS2 |

Toate 5 au shell comun cu sidebar NIS2 între sub-rute.

### Specialist tools — 7 rute cu dual mode

| # | Path | Rol | Mod fără findingId | Mod cu findingId |
|---|---|---|---|---|
| 37 | `/dashboard/dsar` | tool | Radu console (toate cererile DSAR cu status); solo/partner → redirect `/dashboard/resolve` | cockpit tool cu auto-return |
| 38 | `/dashboard/fiscal` | tool | Radu consolă semnale fiscale + SPV Check + Submit SPV (tab-uri aceeași muncă) | cockpit tool pentru SPV findings |
| 39 | `/dashboard/vendor-review` | tool | Radu console (toate vendors brief) | cockpit tool |
| 40 | `/dashboard/sisteme` | tool | Radu consolă AI inventory + discovery + EU DB wizard inline drawer | cockpit tool pentru AI findings |
| 41 | `/dashboard/pay-transparency` | tool | redirect `/dashboard/resolve` (nu are console mode) | cockpit tool |
| 42 | `/dashboard/dora` | tool | Radu consolă incident log + TPRM (doar financial sector) | cockpit tool pentru DORA findings |
| 43 | `/dashboard/whistleblowing` | tool | Radu consolă management rapoarte primite (triage → creează finding) | n/a — rapoartele primite aici creează findings; rapoartele nu se închid aici |

### Radu-specific (1 rută)

| # | Path | Rol | Cine ajunge | Ce conține |
|---|---|---|---|---|
| 44 | `/dashboard/console` | core (condiționat) | Radu compliance, Diana Studio | index 8 cards pentru consolele specialist aplicabile firmei; grey-uri pentru ne-aplicabile |

**Total: 43 rute canonice unice.** Fiecare rută are rol unic și e justificată printr-un principiu.

**Rute noi introduse:**
- `/dashboard/monitoring` + 3 sub-rute — P8 (monitoring în spine) + P12 (tabs-vs-rutes)
- `/dashboard/console` — P7 + P13 (hub specialist pentru Radu fără a contamina spine-ul)
- `/shared/[token]` — P9 + P10 (patron primește livrabil brand-uit fără cont)

Toate celelalte rute sunt existente sau redirect-uri la existente.

## 3.4 Modulele specialist — verdict pe fiecare

### 1. NIS2
- **Verdict:** cockpit tool + consolă read-only pentru Radu; suită cu 5 sub-rute și shell comun
- **Rute:** `/dashboard/nis2`, `/eligibility`, `/maturitate`, `/inregistrare-dnsc`, `/governance` + tab-uri interne pentru incidents/vendors
- **Motivare:** P3 (findings NIS2 se închid în cockpit prin specialist_handoff) + P7 + P12 (tabs-vs-rutes: eligibility vs governance vs incidents sunt moduri diferite de muncă = rute distincte cu shell comun)

### 2. DSAR
- **Verdict:** cockpit tool + consolă intake pentru Radu
- **Rută:** `/dashboard/dsar`
- **Motivare:** P3 excepție (cererile DSAR vin din exterior, intake e legitim); rezolvarea se face prin Finding în cockpit (`GDPR-012/013/014`)

### 3. Fiscal
- **Verdict:** consolă intake de semnale (tab-uri aceeași muncă) + cockpit tool pentru SPV
- **Rută:** `/dashboard/fiscal` cu 5 tab-uri (SPV Check, Submit SPV, Discrepancies, Filing Records, e-Factura Signals)
- **Motivare:** P7 + ANAF roadmap (semnal → finding → dovadă → revalidation); tab-urile sunt „monitorizez postura fiscală" = aceeași muncă cu filtre (P12 tabs-vs-rutes)

### 4. Vendor Review
- **Verdict:** cockpit tool + consolă pentru Radu + `/portfolio/vendors` pentru Diana cross-client
- **Rute:** `/dashboard/vendor-review` + `/portfolio/vendors`
- **Motivare:** P3 + P5 (bulk vendor refresh permis — nu închide findings)

### 5. AI Systems
- **Verdict:** consolă AI + cockpit tool; EU DB wizard absorbit ca drawer inline
- **Rută:** `/dashboard/sisteme`
- **Motivare:** P7 + P3 + P12 (sub-ruta wizard moare)

### 6. Pay Transparency
- **Verdict:** cockpit tool
- **Rută:** `/dashboard/pay-transparency`
- **Motivare:** P3 (kernel are `PAY-001` specialist_handoff); fără findingId, redirect la `/dashboard/resolve`

### 7. DORA
- **Verdict:** consolă intake (financial sector) + cockpit tool
- **Rută:** `/dashboard/dora`
- **Motivare:** P3 excepție (incident log e intake legitim sector financiar) + P7 + P11 (applicability + plan gating determină vizibilitatea în nav)

### 8. Whistleblowing — canal public + intern
- **Verdict:** `/whistleblowing` (public) — intake angajat/cetățean; `/dashboard/whistleblowing` (intern) — consolă intake Radu
- **Motivare:** P3 excepție (rapoartele creează findings care merg în cockpit); P10 (public channel e destinatar-facing)

### 9. Agents
- **Verdict:** tool Radu + Diana Studio prin Monitoring Agents sub-rută
- **Rută:** nu nav primary; accesibil din `/dashboard/monitoring/agents`
- **Motivare:** P11 (plan-gated Pro/Studio) + P7 (agenții produc findings/alerts)

### 10. Approvals — **moare ca rută dedicată**, absorbit în Monitoring
- **Migrare:** `/dashboard/approvals` → `/dashboard/monitoring/approvals`
- **Motivare:** P6 + P13

### 11. Review Cycles — **moare ca rută**, integrat în Monitoring Alerte (entry când imminent)
- **Migrare:** `/dashboard/review` → `/dashboard/monitoring/alerte?filter=review`
- **Motivare:** P6 + P8 + P13

### 12. Calendar — **moare ca rută**, absorbit în Monitoring overview
- **Migrare:** `/dashboard/calendar` → `/dashboard/monitoring`
- **Motivare:** P6 + P8 + P13

### 13. Audit Log — **moare ca rută**, absorbit în Dosar
- **Migrare:** `/dashboard/audit-log` + `/dashboard/reports/audit-log` → `/dashboard/dosar?tab=trasabilitate`
- **Motivare:** P6

### 14. Generator standalone — **moare complet**
- **Migrare:** `/dashboard/generator` → `/dashboard/resolve`
- **Motivare:** P3 (generatorul trăiește inline în cockpit)

### 15. RoPA — **moare ca rută dedicată**
- **Migrare:** `/dashboard/ropa` → `/dashboard/resolve?framework=gdpr&type=ropa` (filtrat); RoPA actualizat apare ca dovadă în `/dashboard/dosar?tab=dovezi`
- **Motivare:** P3 + P12

### 16. Checklists — **moare complet**
- **Migrare:** `/dashboard/checklists` → `/dashboard/resolve`
- **Motivare:** P3 (Task s-a topit în Finding ca primitivă)

## 3.5 Sumar arhitectural

**Spine-ul operațional:** 8 rute core + 1 rută onboarding + 13 rute public = 22 rute de inimă.

**Portofoliul (Diana-only):** 5 rute care trăiesc peste spine — cross-client triage, nu o aplicație paralelă.

**Monitoring suite:** 4 rute dedicate pentru useri cu volum (Pro/Studio + compliance).

**Specialist tools:** 12 rute (NIS2 suite 5 + specialist individuale 7). Niciuna nu e destinație primary în nav.

**Console index (Radu):** 1 rută.

**Moarte / redirect:** 22 rute actuale dispar sau redirectează silent (Secțiunea 5 + Anexa A).

---

# Secțiunea 4 — User flows cap-coadă

**Convenții:** Pas = acțiune atomică testabilă. Sistem = mutație backend / redirect / notificare. `→` = unde ajunge userul. Toate rutele sunt cele canonice din Secțiunea 3.3. Diana primește tratamentul detaliat (target v1); Mihai și Radu sunt flows degradate din același model.

## 4.1 Diana — Consultant / Partner (user primar v1)

Diana e contabilă CECCAR cu 15 clienți SRL existenți. Vrea portofoliu, urgențe zilnice, execuție rapidă per client, livrabile brand-uite Cabinet Popescu & Asociații.

### Flow A — Prima experiență (Diana)

| # | Rută | Ce vede | Ce apasă | Sistem | → |
|---|---|---|---|---|---|
| 1 | `/` | landing register-first: journey complet; bloc `Pentru consultanți și contabili`; testimonial CECCAR | `Începe gratuit` | track visit, set `entry=partner_cta` | `/register` |
| 2 | `/register` | formular: email, parolă, denumire cabinet | `Creează cont` | user + cabinet org + session | `/onboarding` |
| 3 | `/onboarding` pas 1 | 3 carduri rol; Partner badge evidențiat | `Continuă` | `setUserMode=partner` | pas 2 |
| 4 | `/onboarding` pas 2 | date cabinet: CUI cabinet, brand (logo opțional, culoare, antet email, semnătură) | `Continuă` (brand opțional — poate sări) | salvează `cabinet_brand` | pas 3 |
| 5 | `/onboarding` pas 3 | confirmare multi-client + plan trial Growth 14 zile | `Intră în portofoliu` | `workspaceMode=portfolio`, `plan=growth_trial` | `/portfolio` |
| 6 | `/portfolio` | empty state: „Portofoliu gol. Adaugă primul client în 30 de secunde." + CTA dominant | `Adaugă client` | deschide wizard | modal |
| 7 | wizard | 3 tab-uri: Manual / Import CSV / ANAF prefill | `ANAF prefill` + CUI `RO12345678` → `Verifică ANAF` | `/api/partner/import/anaf-prefill` | form auto-completat |
| 8 | wizard pas 2 | site client (opțional), mărime, sector | `Creează client și scanează` | creează Firmă + baseline scan async | spinner progres real |
| 9 | scan progress | „Analizăm Client X... ANAF verificat, site scanat, applicability calculată" | așteaptă | findings inițiale | auto-redirect |
| 10 | `/portfolio` cu 1 client | card Client X + scor + 5 alerte roșii + 12 findings | click card | `switch_workspace → orgId=X, mode=org` | `/dashboard` |
| 11 | `/dashboard` (context client X) | banner persistent: **„Lucrezi pentru Client X SRL — ca Cabinet Popescu"**; snapshot `Se aplică GDPR + NIS2 → 12 cazuri → Privacy policy lipsă` | `Deschide cazul` | — | `/dashboard/resolve/gdpr-001-privacy-policy` |
| 12 | cockpit | hero: `Privacy policy lipsă` + badge `Document` + CTA `Confirmă și generează` + `Nu se aplică` | `Confirmă și generează` | `findingStatus=confirmed`; generator inline | același cockpit |
| 13 | cockpit + generator | formular date client: denumire (prefilled), reprezentant, email DPO, cookie processors; brand-uite cabinet | `Generează draftul` | `/api/documents/generate` → draft cu logo Popescu, antet, semnătură | preview doc |
| 14 | cockpit + preview | document preview în drawer; validare automată pornește | `Re-scannează` | `/api/scan/extract` pe draft | `validation: passed` |
| 15 | cockpit + validation passed | badge verde; CTA `Rezolvă riscul cu acest document` | `Rezolvă riscul` | `findingStatus=resolved`, doc `approved_as_evidence` | success state |
| 16 | cockpit success | banner: „Documentul e în Dosar. Cazul monitorizat până 2027-04-23." + 2 CTA `Deschide Dosarul` / `Următorul caz` | `Deschide Dosarul` | — | `/dashboard/dosar` |
| 17 | `/dashboard/dosar` (Client X) | tab Overview: 1 caz rezolvat, 11 în lucru, pachet 8%; primul doc cu badge `aprobat` + preview PDF | click preview | deschide PDF tab nou | PDF cu logo Popescu, semnătură, footer `Pregătit de Cabinet Popescu & Asociații pentru Client X SRL` |

**Prima dovadă salvată:** pas 16. Durata ~5 minute.

### Flow B — Work Day (Diana)

Luni 09:00. 15 clienți. Săptămâna: 2 renewal-uri de livrat, 1 alertă legislativă peste noapte, 3 findings critice.

| Oră | Acțiune | Rută | Ce vede | Ce apasă | Sistem |
|---|---|---|---|---|---|
| 09:00 | login | → auto-redirect | `workspaceMode=portfolio` | — | — |
| 09:00 | orientare | `/portfolio` | 15 carduri sortate după urgență; 3 cu badge roșu; banner sus: `3 clienți necesită atenție, 2 livrabile, 1 schimbare legislativă` | click banner legislativă | — |
| 09:02 | `/portfolio/alerts` | feed: `ANSPDCP ghid DPA 2026-04-20 — impactează 8 din 15 clienți` cu `Vezi clienți afectați` | click | drawer 8 clienți |
| 09:05 | drawer alertă | fiecare client are `Revalidez DPA furnizori` + CTA `Marchează triat și creează finding per client` | click (NU `Rezolvă bulk` — nu există) | dialog scope: `Vei crea 8 findings în 8 firme. Confirmi?` Confirm → creează 8 Findings `GDPR-010 drift legislativ` |
| 09:08 | `/portfolio/alerts` update | banner: `Ai creat 8 cazuri pentru revalidare DPA` | click card Client X (top urgency) | `switch_workspace → orgId=X` |
| 09:10 | `/dashboard/resolve` (Client X) | banner context: `Lucrezi pentru Client X`; 14 findings; sortate după severitate | click row `NIS2 incident — raportare 24h depășită` | — |
| 09:12 | cockpit NIS2-015 | badge `Asistat`; hero: „Raportarea incidentului la DNSC depășește 24h."; CTA `Deschide flow-ul NIS2` | acceptă handoff | `workflowLink → /dashboard/nis2/inregistrare-dnsc?findingId=...&returnTo=...` |
| 09:14 | NIS2 DNSC | formular early warning; banner: `Te întorci automat în cockpit` | `Salvează` | salvează în `nis2_state`; auto `returnTo` cu `incidentFlow=done` |
| 09:18 | cockpit re-intrat | banner verde + evidence pre-completat | `Confirmă și închide caz` | `DestructiveConfirmDialog` cu **Client X bold**; Confirm → `resolved`, `under_monitoring`, `nextReview=+30` |
| 09:20 | `↩ Portofoliu` din nav | `switch_workspace → portfolio` | — | `/portfolio` |
| 09:25-11:00 | 2 clienți urgenți | portofoliu → client → cockpit → close → portofoliu | banner se schimbă vizibil de fiecare dată; toast `Context Client Y activ` | — |
| 11:30 | renewal Client Y | `/portfolio/reports` | listă: Client Y 87%, 3 gap-uri; Client Z 100%, gata | click `Trimite la client` pe Z |
| 11:32 | drawer livrare Z | 3 opțiuni: Email / Link public / Download PDF; preview brand cabinet | Email → completează patron + `Trimite` | `/api/exports/audit-pack/client` → email + magic link `/r/renewal/z` |
| 11:35 | Client Y (3 gap-uri) | `/portfolio/reports` | CTA `Rezolvă gap-urile (3)` | click | `switch_workspace → Y`; `/dashboard/resolve?filter=gap` |
| 11:40-13:00 | close 3 gap-uri Y | cockpit × 3 | pachet → 100% | — |
| 14:00 | vendor hygiene | `/portfolio/vendors` (din card `/portfolio`) | 34 vendori, 5 revalidation overdue | `Refresh toate` (bulk safe) |
| 14:10 | 2 vendori `FLAGGED` | `/portfolio/vendors` | 8 clienți impactați | `Creează findings vendor review` → dialog scope; Confirm → per client `GDPR-011` |
| 14:15-15:30 | triaj + cockpit per client | portofoliu → client → cockpit | — | — |
| 15:30 | monitoring preview | `/portfolio` | banner jos: `Mâine: 3 review cycles scadente pentru 2 clienți` | — |
| 16:00 | notificare patron Z a aprobat privacy policy via magic link | feed `/portfolio` | — | click → `/dashboard/dosar` Z tab `trasabilitate` |
| 16:30 | audit-pack Client W blocat | `/portfolio/reports` → W | 94% + 2 finding `GDPR-016 retention` blocate | `Vezi blocker` |
| 17:00 | cockpit GDPR-016 | hero: `Poarta de attach incompletă — re-scan`; CTA `Re-scannează și confirmă` | click | `DestructiveConfirmDialog` nume W bold; Confirm → revalidation → resolved |
| 17:05 | logout | — | — | — | — |

**Rezumat zi:** 7 cazuri închise pe 4 clienți, 2 pachete livrate patronilor, 1 alertă legislativă procesată pe 8 clienți (creare bulk legitimă), vendor hygiene făcută, 0 minute pierdute în context confuz. Toate output-urile brand-uite cabinet.

### Flow C — Edge cases (Diana)

**C1 — Reopen caz client** (drift detectat):
1. email `Privacy Policy Client X are drift (site a adăugat formular contact)` cu deep link + token → click
2. `/portfolio/alerts?highlight=drift-X-gdpr001` item evidențiat; `Reverifică acum` → `switch_workspace → X`
3. `/dashboard/resolve/gdpr-001?reopen=drift`: cockpit cu stepper pe „Re-verifică dovada"; banner galben explicativ; `Re-scannează site`
4. cockpit cu diff: propunere adaugă formular contact la Privacy Policy; `Actualizează și regenerează`
5. identic Flow A pași 13-16 re-rezolvat

**C2 — Plan upgrade** (al 6-lea client pe Growth):
1. `Adaugă client` → wizard → `Creează client`
2. **paywall modal contextual** la submit: „Growth permite 5 clienți. Pro = 30, Monitorizare dedicată, Trust profile white-label" + `Upgrade la Pro`
3. Stripe checkout → retur wizard; client creat, nav primește item Monitorizare

**C3 — Context switch 3 clienți (test critical P2):**
1. Diana pe cockpit X → banner `Lucrezi pentru X`
2. `↩ Portofoliu` → banner dispare
3. click Y → banner `Lucrezi pentru Y` + toast 1.5s
4. click finding Y, `Confirmă` → `DestructiveConfirmDialog`: „Închizi cazul `GDPR-010 DPA` pentru **Client Y SRL**. Continuă?" (nume **bold**)
5. click Z → banner `Lucrezi pentru Z`

**C4 — Patron magic link:**
1. Diana în cockpit `GDPR-001` Client X apasă `Trimite spre aprobare patron` → token + email
2. patron email: `Cabinet Popescu a pregătit Privacy Policy pentru firma ta. Aprobă aici: [link]`
3. patron click → `/shared/[token]`: logo cabinet + preview doc + `Aprob` / `Am întrebări`
4. `Aprob` → SMS/email confirm, token consumat, `documentApprovalStatus=approved_by_owner`
5. Diana primește notificare → Dosar X tab `trasabilitate`

**C5 — Handoff client complet** (pachet renewal Z):
1. `/portfolio/reports` → Z 100% → `Trimite pachet renewal`
2. drawer 3 canale: Email / Magic link / Download ZIP semnat
3. Email: patron + personal note; preview brand cabinet, subiect `Dosarul de conformitate — Client Z SRL (aprilie 2026)`
4. `Trimite` → email plecat, tracking activ; pachet în Dosar Z tab `pachete`

## 4.2 Mihai — Solo IMM

Mihai = patron SRL (IT, 8 angajați). Vrea claritate, primul pas, liniște.

### Flow A — Prima experiență

| # | Rută | Ce | Acțiune |
|---|---|---|---|
| 1 | `/` | landing + `Pentru patroni SRL` | `Începe gratuit` |
| 2 | `/register` | email + parolă + firmă | `Creează cont` |
| 3 | onboarding pas 1 | `Proprietar / Manager` | `Continuă` → `userMode=solo` |
| 4 | pas 2 | CUI + site; ANAF auto | `Verifică ANAF` → `Continuă` |
| 5 | pas 3 | 5 întrebări observabile | răspunde; applicability: GDPR + AI Act |
| 6 | pas 4 | „Compli verifică" | 15s |
| 7 | pas 5 | `GDPR + AI Act. 6 cazuri. Primul: Privacy Policy.` | `Mergi la primul caz` |
| 8 | cockpit | badge `Document`; `Confirmă și generează` | click |
| 9 | generator | 3 procesări | `Generează` |
| 10 | validate | passed | `Rezolvă riscul` → `DestructiveConfirmDialog` nume firmă bold |
| 11 | success | `Documentul e în Dosar. 5 rămase.` | `Deschide Dosarul` |
| 12 | Dosar | 1 rezolvat + dovadă; `Pachet 17%` | — |

Durata ~4 min.

### Flow B — Work Day

Miercuri 10:00, după 5 zile.
1. `/dashboard`: scor +2, 2 cazuri noi, secțiune `Ce ține de monitorizat azi` cu 2 review-uri în 7 zile
2. click `Rezolvă drift privacy policy` → `/dashboard/resolve/gdpr-001?reopen=drift`
3. cockpit reopen: stepper pe `Re-verifică dovada`; `Re-scannează` → revalidare trece
4. `Confirmă revalidarea` → resolve + next review +90 zile
5. `Următorul caz` → badge `Acțiune` cookies: upload screenshot + notă → close
6. `Acasă`: secțiunea monitoring 1 review în 7 zile → logout

Durata ~8 min.

### Flow C — Edge cases

**C1 — Applicability change retroactiv** (Mihai începe date medicale):
1. Settings → tab `Profil firmă` → secțiune `Ce mi se aplică` → `Editează`
2. schimbă „Procesez date sensibile?" `nu → da - sănătate`
3. `Salvează și recalculează` → dialog preview: `3 cazuri noi, 2 inactive`
4. Confirm → kernel re-rulează → redirect `/dashboard/resolve` cu banner

Nu repornește onboarding.

**C2 — Email → cockpit direct:** email vendor breach → deep link `/dashboard/resolve/gdpr-010-stripe?source=email_alert` cu token → cockpit direct.

**C3 — Plan upgrade NIS2:** Settings → Plan: NIS2 cere Solo+ → upgrade → NIS2 sub-rute apar.

## 4.3 Radu — Compliance intern

Radu = compliance officer fintech (75 angajați).

### Flow A — Prima experiență

| # | Rută | Ce | Acțiune |
|---|---|---|---|
| 1-2 | `/` → `/register` | — | — |
| 3 | onboarding pas 1 | `Responsabil conformitate` | `Continuă` → `userMode=compliance` |
| 4 | pas 2 | CUI + site + întrebări specifice (DPO, CISO, sector fintech) | completează |
| 5 | pas 3 | applicability: GDPR + NIS2 + DORA + AI Act | — |
| 6 | pas 5 | 23 findings, 4 critical | `Mergi la cazurile deschise` |
| 7 | `/dashboard/resolve` | NIS2-001 eligibility critical | click |
| 8 | cockpit | badge `Asistat`; `Eligibilitate NIS2 nedeclarată. ~10 min.` | `Deschide eligibility NIS2` |
| 9 | `/dashboard/nis2/eligibility?findingId=...` | wizard 4 pași; banner revenire | completează |
| 10 | cockpit re-intrat | `entitate esențială`; evidence pre-completat; `Confirmă și închide` | `DestructiveConfirmDialog` → Confirm → resolve + monitoring |
| 11 | Dosar tab `Trasabilitate` | entry precis cu user, timestamp, framework | — |

### Flow B — Work Day

Luni 09:00. 3 approvals, 1 agent run weekend, 2 review cycles, 1 drift legislativ.

1. `09:00` `/dashboard` Acasă + 4 KPI
2. `09:02` nav `Monitorizare` → `/dashboard/monitoring` overview 3 zone + badges
3. `09:05` `/dashboard/monitoring/approvals`: 3 policies; aprobă 2, reject 1 cu motivare → finding
4. `09:20` `/dashboard/monitoring/agents`: agent weekend 2 schimbări; accept 1, reject 1 cu motivare
5. `09:30` `/dashboard/monitoring/alerte`: 1 drift DPA vendor → finding automat → cockpit → handoff vendor-review → resolve
6. `10:00` `/dashboard/resolve` filtru `active` → 2 review cycles; revalidation × 2 (cockpit reconfirmă → next review → save)
7. `13:00` nav `Console` → `/dashboard/console`: 8 console (Pay grey); NIS2 console → state agregat; incident nefinalizat → cockpit
8. `14:00-16:00` audit trail review `/dashboard/dosar?tab=trasabilitate` last 7d
9. `16:00` `/dashboard/dosar?tab=pachete` → `Generează audit pack lunar` → download + trimite board

### Flow C — Edge cases

**C1 — Reopen cascade (drift NIS2 major):**
1. trigger: `NIS2 bylaw actualizat — 24h, nu 72h` → `/dashboard/monitoring/alerte` critical
2. `Investighează` → drawer: 5 findings NIS2-015 redeschise
3. `Reopen cascade` → `DestructiveConfirmDialog`: „5 cazuri se redeschid. Lista: [...]. Confirmă?"
4. per caz: cockpit pe `reconfirmă cu deadline nou` → dovadă updated

**C2 — Guest Auditor (distinct de Viewer):**
1. Radu `/dashboard/settings?tab=team` → buton `Acces audit extern (temporar)` (distinct de `Invită membru permanent`)
2. introduce email + durată 30 zile + scope 1 firmă
3. auditor primește magic link → sesiune temporară (nu cont permanent)
4. banner `Sesiune audit extern — expiră 2026-05-23`; butoane mutație disabled; download enabled
5. exporturi în sesiune guest primesc **footer pe fiecare pagină**:
   ```
   Copie pentru audit extern — [auditor_name]
   Sesiune activă: [start_date] până la [expires_at]
   Token verificare: [token_first_8]
   Acces acordat de: [inviter_name], [cabinet/firmă]
   ```
   + **pagină manifest la sfârșitul pack-ului:** lista documente + hash SHA-256 per doc + disclaimer NDA
6. Radu vede în audit log fiecare acces; sesiune expiră automat

**C3 — Agent propune, Radu decide:**
1. `/dashboard/monitoring/agents`: `Regulatory Radar propune AI Act update — scoring credit cere impact assessment Art. 29`
2. `Investighează` → drawer: sursa (link jurnal UE), relevanța, findings propuse
3. `Acceptă` → finding AI-005 sau `Respinge cu motivare`

## 4.4 Verificare persona lens

Rulez fiecare flow prin persona lens skill.

### Diana lens (portfolio triage, client context, scalable execution, clean deliverables)

| Flow | Stage | Verdict |
|---|---|---|
| A | first experience partner | **pass** — brand opțional la pas 4 |
| A | first client added | **pass** — banner persistent pas 11 |
| B | triaj vs execuție | **pass** — `Rezolvă bulk` NU există; opțiunea bulk creează findings |
| B | context switch × 4 | **pass** — toast + banner vizibil |
| C1 | reopen drift | **pass** — deep link token |
| C2 | plan upgrade | **pass** — paywall la submit, nu hide |
| C3 | confirm destructive | **pass** — nume client bold |
| C4 | patron magic link | **pass** — brand cabinet peste tot |
| C5 | pachet renewal | **pass** — 3 canale brand-uite |

**Diana: 9/9 pass.**

### Mihai lens

| Flow | Stage | Verdict |
|---|---|---|
| A | landing + register | **pass** |
| A | onboarding observabil | **pass** |
| A | cockpit prim caz | **pass** — clasa vizibilă, 2 CTA ierarhizați |
| A | success Dosar simplu | **pass** |
| B | revine 5 zile | **pass** — next action dominant |
| B | reopen pe pas relevant | **pass** |
| C1 | applicability edit retroactiv | **pass** |
| C2 | email deep link | **pass** |
| C3 | plan upgrade opțional | **pass** |

**Mihai: 9/9 pass.**

### Radu lens

| Flow | Stage | Verdict |
|---|---|---|
| A | onboarding compliance | **pass** — întrebări specifice |
| A | cockpit specialist_handoff | **pass** — return automat cu context |
| A | Dosar trasabilitate | **pass** |
| B | monitoring hub zilnic | **pass** — 3 sub-rute distincte |
| B | approvals | **pass** — reject → finding |
| B | agents human-in-loop | **pass** — surse verificabile |
| B | console specialist | **pass** — `/dashboard/console` |
| B | audit pack | **pass** — one-click |
| C1 | reopen cascade | **pass** — impact vizibil |
| C2 | Guest Auditor (nu Viewer) | **pass** — footer watermark + manifest SHA-256 |
| C3 | agent propune | **pass** — motivare obligatorie |

**Radu: 11/11 pass.**

**Total: 29/29 pass.** Flow-urile expun 6 patterns emergente integrate în Secțiunea 6: dialog confirmare cu nume bold, brand capture la onboarding, toast context switch, deep-link preservation emails, class badge persistent, paywall contextual la submit.

---

# Secțiunea 5 — Ce trebuie să moară

## 5.1 Rute redundante

Dubluri RO/EN, multiple output surfaces, sub-rute care fac aceeași treabă ca ruta părinte.

| Ce moare | De ce | Plan migrare | Risc spargere |
|---|---|---|---|
| `/dashboard/scanari` | P12 | 301 → `/dashboard/scan` | bookmarks; redirect păstrat 6 luni |
| `/dashboard/setari` + `/setari/abonament` | P12 | 301 → `/dashboard/settings[/abonament]` | bookmarks + email templates; grep sweep pre-migrare |
| `/dashboard/documente` | P12 + P6 | 301 → `/scan/history` (referer scan) sau `/dosar?tab=dovezi` | minor |
| `/dashboard/rapoarte` + `/rapoarte/auditor-vault` + `/rapoarte/trust-profile` | P12 | 301 → `/dosar` (overview / `tab=pachete`) | mare — linkuri hardcoded RO; grep obligatoriu |
| `/dashboard/reports` + `/reports/vault` + `/reports/policies` + `/reports/trust-center` | P6 | absorb în `/dosar` ca tab-uri; redirect per pagină veche | audit log bookmarks; 6 luni redirect |
| `/dashboard/reports/audit-log` + `/dashboard/audit-log` | P6 + P12 | 301 → `/dosar?tab=trasabilitate` | bookmarks Radu |
| `/account/settings` | P12 | 301 → `/dashboard/settings?tab=profil` | minor |
| `/dashboard/partner` + `/partner/[orgId]` (bridge) | P12 | ștergere după 301 în middleware | link-uri vechi email |

**Total rute redundante: 11**

## 5.2 Rute zombie

Există în cod, nu în nav; accesibile prin URL direct.

| Ce moare | De ce | Plan migrare |
|---|---|---|
| `/onboarding/finish` | P14 | delete fișier; middleware → `resolveOnboardingDestination(userMode)` |
| `/dashboard/findings` | P12 | 301 → `/dashboard/resolve` |
| `/dashboard/conformitate` | P6 + P12 | 301 → `/dosar?tab=overview` |
| `/dashboard/checklists` | P3 + P12 | 301 → `/dashboard/resolve` |
| `/dashboard/politici` | P6 + P12 | 301 → `/dosar?tab=dovezi&filter=policies` |
| `/dashboard/generator` | P3 | 301 → `/dashboard/resolve`; pagina dispare |
| `/dashboard/ropa` | P3 + P12 | 301 → `/dashboard/resolve?framework=gdpr&type=ropa` |
| `/dashboard/approvals` | P6 + P8 | 301 → `/dashboard/monitoring/approvals` |
| `/dashboard/review` | P6 + P8 | 301 → `/dashboard/monitoring/alerte?filter=review` |
| `/dashboard/calendar` | P6 + P8 + P13 | 301 → `/dashboard/monitoring` |
| `/dashboard/sisteme/eu-db-wizard` | P3 + P12 | 301 → `/dashboard/sisteme` (wizard devine drawer inline) |

**Total rute zombie: 11** (toate dispar complet; sub-rutele NIS2 pierd entry standalone, dar rămân ca interioare ale suitei — nu mor).

## 5.3 Concepte redundante care mor ca model mental

| Concept | Se topește în | De ce |
|---|---|---|
| **Task** ca primitivă separată | **Finding** | un task = finding cu clasa `operational` sau `acțiune` |
| **Drift** ca primitivă separată de **Alertă** | **Alertă** | un drift din user POV = „s-a schimbat ceva" = alertă cu `source: drift_trigger` |
| **Document generat** / **Notă** / **Fișier** / **Screenshot** (4 concepte) | **Dovadă** (1 concept, 5 kinds) | toate 4 sunt „ce am atașat ca să închid cazul"; backend tables rămân separate, UI-ul e unificat |
| **Report** ca container | **Livrabil** (+ Dosar ca container) | Report = document standalone generat e iluzie; adevărul e pachet cu metadata |
| **Pack** ≠ **Export** | **Livrabil** (unificat) | audit-pack, annex-lite, vendor-trust-pack, response-pack = livrabile cu scope diferit; template-uri ale aceluiași concept |
| **Checklist** ca pattern vizual distinct | **Resolve queue** | checklist = listă findings de rezolvat |
| **„Sandbox"** ca UI demo mode | — (moare complet) | zgomot față de spine |
| **„Home tool mall"** | **Acasă cu acțiune dominantă** | cards egale ca greutate contrazice P8 + P13 |

**Total concepte: 8**

## 5.4 UI patterns interzise

| Pattern | Principiu | Unde apare azi |
|---|---|---|
| **Execuție bulk cross-client** (close N findings, approve N docs, trimite N pachete oficiale) | P5 | `portfolio-tasks-page.tsx` — curățat; `batch-executor.ts` rămâne ca infrastructură, UI nu mai expune |
| **Creare bulk fără dialog scope** | P5 | `/portfolio/alerts` — necesită `BulkCreateConfirmDialog` |
| **Butoane dezactivate fără paywall contextual** (pt capabilități cuantitative) | P11 | `plan-gate.tsx` — refactor la modal explicit |
| **Workspace switch silent** (context fără feedback) | P2 | adaug toast + banner tranziție |
| **Action destructive fără dialog cu nume entitate bold** (close, approve, send official, export) | P2 + P5 | cockpit actual — `DestructiveConfirmDialog` obligatoriu |
| **Redirect din cockpit în afara spine-ului** (către `/reports` sau `/documente` după success) | P3 + P6 | `finding-cockpit-shared.tsx` — success doar către `/dosar` sau next case |
| **Specialist tools accesibile din nav primar pentru solo/partner** | P7 + P13 | `MODULE_NAV_ITEMS` din nav-config — scos |
| **Onboarding cu întrebări apărute prin card growth** | P14 | `applicability-wizard.tsx` — sweep |
| **Empty states cu ilustrații mari + copy marketing** | P15 | `EmptyState` component — refactor text-first |
| **Celebration states** (confetti, `Felicitări!`, check mare animat) | P15 | cockpit success — check discret, fără `Felicitări` |
| **Emoji în UI-ul produsului** | P15 | preventiv |
| **Copy marketing pe butoane** (`Începe acum!`, `Super!`) | P15 | preventiv |
| **Survey după success** (`Cum a fost experiența?`) | P15 + P3 | `feedback-prompt.tsx` — scos din cockpit success; păstrat în Settings |

## 5.5 Copy patterns interzise

| Pattern greșit | Exemplu corect | Principiu |
|---|---|---|
| Marketing: „Cu Compli îți faci GDPR în 5 minute!" | „Privacy policy lipsă. Generator pregătit." | P15 |
| Celebration: „Super! Ai rezolvat primul caz!" | „Cazul e închis. Dovada e în Dosar. Următoarea revizuire: 2026-07-23." | P15 |
| Vag: „E posibil să ai probleme cu GDPR." | „Findings GDPR-001: Privacy policy lipsă pe site." | P15 |
| Absolutism: „Ești 100% conform după acest pas." | „Cazul e rezolvat cu dovadă. Monitorizare activă." | P15 |
| Auto-decizie: „Trimitem automat la ANSPDCP." | „Pachet pregătit pentru ANSPDCP. Confirmă trimiterea." | P15 + P9 |
| Jargon: „Workflow-ul DSAR a fost orchestrat cu success." | „Răspunsul DSAR e pregătit. Verifică înainte de trimitere." | P15 |
| Disclaimer ascuns (mic gri sub buton) | Frază scurtă vizibilă lângă CTA | P15 |

## 5.6 Sumar tăieri

- **Rute eliminate:** 22 (11 redundante + 11 zombie)
- **Concepte primitive topite:** 8
- **UI patterns interzise:** 13
- **Copy patterns interzise:** 7 categorii

Zero tăieri nu ating motorul. `finding-kernel.ts`, `batch-actions.ts`, generator API, scan API, agent-orchestrator, stores, cron-uri — toate rămân. Ce taiem e *suprafața*.

---

# Secțiunea 6 — Ce trebuie construit nou

Doar ce **nu** există și nu poate fi obținut prin recombinare. Estimare: S ≤ 2 zile, M ≤ 1 săpt, L ≤ 2 săpt.

## 6.1 Critical — spine-ul nu stă fără acestea

### 6.1.1 `/dashboard/monitoring` suită (overview + 3 sub-rute)
- **Ce:** rută nouă + 3 sub-rute (`/alerte`, `/approvals`, `/agents`). Overview cu summary per zonă + badges + „Ce cere atenție azi". Sub-rute cu layout distinct.
- **De ce:** P8 + P12 (tabs-vs-rutes: zone diferite de muncă)
- **Atinge:** componente noi `MonitoringOverview`, `MonitoringAlerts`, `MonitoringApprovals`, `MonitoringAgents`; rutele `app/dashboard/monitoring/{page.tsx, alerte/page.tsx, approvals/page.tsx, agents/page.tsx}`; `dashboard-routes.ts` adaugă `monitoring*`; `nav-config.ts` adaugă item condiționat pe rol + plan
- **Reuse:** `drift-active-card`, `remediation-board`, `approval-queue.ts`, `agent-run-store.ts`, `legislation-monitor.ts`, `notifications-store.ts`
- **Estimare:** L
- **Pre-req:** absorbția `/approvals`, `/review`, `/calendar` + clarificare model Alertă unificată

### 6.1.2 `/dashboard/console` (Radu + Diana Studio)
- **Ce:** index page cu cards pentru fiecare consolă specialist aplicabilă firmei. Stare agregată + CTA rută console mode. Greyed pentru ne-applicable.
- **De ce:** P7 + P13 — Radu are nevoie de hub specialist zilnic
- **Atinge:** `app/dashboard/console/page.tsx`; `ConsoleIndex`, `ConsoleCard`; `dashboard-routes.ts`; `nav-config.ts` condiționat pe `userMode=compliance || (partner + plan=studio)`
- **Estimare:** M
- **Pre-req:** NIS2 suite refactată

### 6.1.3 `DestructiveConfirmDialog`
- **Ce:** componentă generică invocată la close caz, approve document, trimite oficial (ANSPDCP/DNSC/ANAF), export brand client, reopen cascade. Afișează: acțiune + **nume firmă bold** + dovadă + impact scope
- **De ce:** pattern emergent 1 + P2 + P5
- **Atinge:** `components/evidence-os/DestructiveConfirmDialog.tsx`; call sites în `finding-cockpit-shared.tsx`, `DocumentAdoptionCard`, portfolio tasks/vendors
- **Estimare:** S

### 6.1.4 Workspace banner + toast context switch
- **Ce:** banner vizual persistent în shell (sub top-bar) cu nume firmă + badge rol contextual. Toast 1.5s la `switch_workspace`
- **De ce:** pattern emergent 3 + P2
- **Atinge:** `dashboard-shell.tsx`; `WorkspaceContextBanner`; `workspace-mode-switcher.tsx`
- **Estimare:** S

### 6.1.5 Redirect middleware pentru toate rutele moarte
- **Ce:** `middleware.ts` extins cu tabelă redirect-uri (22 rute din 5.1 + 5.2)
- **De ce:** P12
- **Atinge:** `middleware.ts`; `middleware.test.ts`
- **Estimare:** M

## 6.2 Important — experiența e degradată fără acestea

### 6.2.1 Brand capture onboarding + tab Brand în Settings
- **Ce:** pas nou onboarding partner (logo, culoare, antet email, semnătură, footer legal — toate opționale). Tab Brand în Settings. Propagare automată la exporturi + email.
- **De ce:** pattern emergent 2 + P9
- **Atinge:** `onboarding-form.tsx`, `partner-workspace-step.tsx`, `settings/BrandTab.tsx`, `/api/org/profile` extins, `supabase/public.org_state.metadata.brand` jsonb, `lib/compliance/brand.ts` (helper `getBrandConfig`, `renderBrandedHeader`, `renderBrandedFooter`)
- **Estimare:** L

### 6.2.2 Applicability edit retroactiv
- **Ce:** Settings → Profil firmă → secțiune `Ce mi se aplică` cu buton `Editează răspuns`. Edit → preview impact → confirm → recalculare findings
- **De ce:** pattern emergent + P14
- **Atinge:** `settings/ProfileTab.tsx`, `ApplicabilityEditor`, `/api/org/profile/recalculate`, `finding-kernel.classifyFinding`
- **Estimare:** M
- **Pre-req:** 6.2.1 (tab Profile restructurat)

### 6.2.3 Guest Auditor cu sesiune temporară + footer watermark + manifest SHA-256
- **Ce:** model nou `GuestAuditor` (diferit de Viewer) cu `expiresAt`, `scopeOrgIds`, `watermarkRequired`, `activityLogRequired`. Magic link → sesiune temporară read-only. Exporturi în sesiune guest primesc footer pe fiecare pagină + pagină manifest.
- **De ce:** distincție Viewer intern permanent vs Guest Auditor extern temporar
- **Footer (per pagină):**
  ```
  Copie pentru audit extern — {auditor_name}
  Sesiune activă: {start_date} până la {expires_at}
  Token verificare: {token_first_8}
  Acces acordat de: {inviter_name}, {inviter_cabinet}
  ```
- **Pagină manifest (sfârșit ZIP):** lista documente + SHA-256 per doc + disclaimer NDA
- **Atinge:** `lib/server/auth.ts`, `lib/server/guest-auditor-store.ts`, `supabase/guest-auditor-sessions.sql`, `middleware.ts` extins, `settings/TeamTab.tsx` (2 butoane distincte), `guest-auditor-invite-modal.tsx`, `audit-pack-pdf.ts` (footer + manifest), `/api/exports/audit-pack/pdf/route.ts` (SHA-256 calc)
- **Estimare:** L

### 6.2.4 Paywall modal contextual
- **Ce:** componentă `PaywallModal` care se deschide la submit (nu la click). Listează 3-5 feature concrete. Upgrade → Stripe → retur automat la acțiunea încercată
- **De ce:** pattern emergent 6 + P11
- **Atinge:** `PaywallModal`, `plan-gate.tsx` (2 moduri: `hide` pt discrete, `paywall-on-submit` pt cuantitative), call sites în portfolio-overview-client, settings/BrandTab, `/api/stripe/checkout` cu `returnAction`
- **Estimare:** M

### 6.2.5 Creare bulk cu dialog scope
- **Ce:** `BulkCreateConfirmDialog` pentru: alertă → findings pe N clienți, creare findings vendor flag, import CSV. Fără dialog, bulk nu rulează.
- **De ce:** regula bulk create permis cu confirmare; P5
- **Atinge:** `BulkCreateConfirmDialog`, call sites portfolio-alerts-page, portfolio-vendors-page, import-wizard
- **Estimare:** S

### 6.2.6 Finding class badge persistent (queue + cockpit hero)
- **Ce:** badge `Document` / `Acțiune` / `Asistat` vizibil în fiecare rând resolve și dominant în cockpit hero
- **De ce:** pattern emergent 5 + P4
- **Atinge:** `ExecutionClassBadge`, `resolve-page.tsx`, `finding-cockpit-shared.tsx`
- **Estimare:** S

### 6.2.7 Deep-link preservation în emails cu token workspace
- **Ce:** toate email-urile (drift, review, renewal, digest) includ link cu token care setează `workspaceMode` + `orgId` automat
- **De ce:** pattern emergent 4; Flow Mihai C2 + Diana C1
- **Atinge:** `share-token-store.ts` extins, `email-alerts.ts`, toate `/api/cron/*` care emit emails, middleware care consumă tokenii
- **Estimare:** M

## 6.3 Nice-to-have — polish

### 6.3.1 Reopen cu stepper repoziționat
- **Ce:** cockpit intră pe pasul relevant bazat pe `reopenReason`
- **De ce:** Flow Mihai B + Radu C1
- **Atinge:** `ScanFinding` extins cu `reopenReason`; `finding-cockpit-shared.tsx`; kernel derivă `initialStepperState`
- **Estimare:** M

### 6.3.2 Secțiunea „Ce mi se aplică" în Acasă
- **Ce:** card compact în Acasă; click → Settings
- **De ce:** P14
- **Atinge:** `app/dashboard/page.tsx`, `ApplicabilitySummaryCard`
- **Estimare:** S
- **Pre-req:** 6.2.2

### 6.3.3 Status Monitorizare ca secțiune în Acasă (Mihai + Diana Entry/Growth)
- **Ce:** card condiționat pe `!hasMonitoringNavItem` cu 3 review + 2 drift + 1 legislativ
- **De ce:** P8 degradare elegantă
- **Atinge:** `app/dashboard/page.tsx`
- **Estimare:** S
- **Pre-req:** 6.1.1

### 6.3.4 `/portfolio/vendors` card dominant în overview
- **Ce:** card în `/portfolio` overview cu status vendors (total, overdue, FLAGGED); CTA `Vezi toți`
- **De ce:** single entry point (P12); fără card ruta devine zombie
- **Atinge:** `portfolio-overview-client.tsx`
- **Estimare:** S

## 6.4 Patterns emergente — sumar cross-reference

| # | Pattern | Item | Prioritate |
|---|---|---|---|
| 1 | Dialog confirmare destructive cu nume bold | 6.1.3 | Critical |
| 2 | Brand cabinet capture la onboarding | 6.2.1 | Important |
| 3 | Toast context switch workspace | 6.1.4 | Critical |
| 4 | Deep-link preservation în emails | 6.2.7 | Important |
| 5 | Finding class badge persistent | 6.2.6 | Important |
| 6 | Paywall modal contextual la submit | 6.2.4 | Important |

## 6.5 Ce NU se construiește (explicit)

- **Redesign complet cockpit** — cockpitul e funcțional; lipsesc compactări (FindingExecutionCard, FindingNarrativeCard nu sunt montate). Montare = refactor, nu build.
- **Nou generator de documente** — 3 tipuri funcționează; extindere la retention-policy etc = kernel work, nu IA.
- **Nou engine de monitoring** — `drift-trigger-engine`, `legislation-monitor`, `review-cycle-store` există. IA le expune mai bine, nu le reinventează.
- **Mobile app** — nu e scope v1.
- **Analytics dashboard admin Anthropic/CompliAI-side** — zero valoare pentru useri.
- **Multi-language UI** — RO-only pentru v1.
- **AI chat ca feature primary** — endpoint `/api/chat` există fără UI activ; rămâne așa.

## 6.6 Sumar

- **Critical: 5 items** (1L + 1M + 2S + 1M) ~3-4 săpt
- **Important: 7 items** (1L + 1L + 1M + 1M + 1S + 1S + 1M) ~5-6 săpt
- **Nice-to-have: 4 items** (1M + 1S + 1S + 1S) ~1.5-2 săpt

**Total: 16 items**, ~10-12 săpt 1 dev, ~5-6 săpt cu 2 dev-eri. Zero rewrite kernel, zero schema migration breaking.

---

# Secțiunea 7 — Plan de migrare

## Convenții

- **Path-uri** sunt absolute față de rădăcina repo
- **Task ID** = `S{sprint}.T{număr}`, referențiabil în PR-uri
- **Referință 6.x** = item din Secțiunea 6 pe care task-ul îl implementează
- **Estimare:** S ≤ 2 zile, M ≤ 1 săpt, L ≤ 2 săpt
- **Dep:** dependency intra-sprint
- **Priority:** P0 blocker / P1 important / P2 nice-to-have

---

## Sprint 0 — Pre-launch blocker (3 săptămâni)

**Scope goal:** spine-ul e închis cap-coadă cu 0 redirect-uri orfane. După Sprint 0, Diana, Mihai și Radu trec Flow A (prima experiență) fără rupturi live pe toate 3 clase de execuție.

**Execution order:** T1 → T2 → T3+T4 (paralel, independent) → T5 → T6 (paralel cu T5, nu dep) → T7 → T8 → T10 → T9

**Dependencies:** niciun sprint anterior.

**Risc de spargere:** medium-high — atingem `middleware.ts` + routing + shell. Mitigare: feature flag `NEXT_PUBLIC_IA_V2_ROUTING=true`, deploy dual (rutele vechi coexistă cu 301 conditional) pentru primele 72h.

### Task-uri Sprint 0

#### S0.T1 — Workspace banner + toast context switch (P0, S)
- **Ref:** 6.1.4
- **Fișiere:**
  - `components/compliscan/dashboard-shell.tsx` (slot banner între top-bar și conținut)
  - `components/compliscan/workspace-context-banner.tsx` **nou**
  - `components/compliscan/workspace-mode-switcher.tsx` (toast 1.5s la mutație reușită)
  - `components/compliscan/portfolio-shell.tsx`
- **Acceptance:**
  - banner vizibil permanent sub top-bar în `/dashboard/*` și `/portfolio/*`
  - copy: solo = `Firma ta: {orgName}`; compliance = `Firma ta: {orgName}`; partner portfolio = `Portofoliu — {cabinetName}`; partner org = `Lucrezi pentru {orgName} — ca {cabinetName}`
  - toast apare la orice `/api/auth/switch-org` 200 OK, text `Context {orgName} activ`
  - E2E Playwright: Portofoliu → Client X → banner schimbă text
- **Dep:** niciun

#### S0.T2 — DestructiveConfirmDialog component (P0, S)
- **Ref:** 6.1.3
- **Fișiere:**
  - `components/evidence-os/DestructiveConfirmDialog.tsx` **nou**
  - `components/compliscan/finding-cockpit-shared.tsx` (call sites: close, reopen, approve)
  - `app/dashboard/resolve/[findingId]/page.tsx`
- **Acceptance:**
  - dialog apare la close caz / approve doc / trimite oficial / export brand client / reopen cascade
  - conținut: titlu + **nume firmă bold** + dovadă atașată + impact scope
  - butoane: `Confirmă și [acțiune]` (primary destructive) + `Anulează`
  - keyboard: ESC închide, Enter confirmă
  - E2E: `/api/findings/:id/resolve` nu se invocă fără confirm
- **Dep:** S0.T1

#### S0.T3 — Middleware redirect pentru rute redundante și zombie (P0, M)
- **Ref:** 6.1.5
- **Fișiere:**
  - `middleware.ts` extins cu tabelă redirect-uri
  - `middleware.test.ts` extins
- **Redirect map (toate 301 permanente):**
  - `/dashboard/scanari*` → `/dashboard/scan` (păstrează query)
  - `/dashboard/setari` → `/dashboard/settings`
  - `/dashboard/setari/abonament` → `/dashboard/settings/abonament`
  - `/dashboard/documente` → referer-based: scan → `/scan/history`; else → `/dosar?tab=dovezi`
  - `/dashboard/rapoarte` → `/dashboard/dosar`
  - `/dashboard/rapoarte/auditor-vault` → `/dashboard/dosar?tab=pachete`
  - `/dashboard/rapoarte/trust-profile` → `/dashboard/dosar?tab=pachete&view=trust`
  - `/dashboard/reports` → `/dashboard/dosar?tab=overview`
  - `/dashboard/reports/vault` → `/dashboard/dosar?tab=pachete`
  - `/dashboard/reports/audit-log` → `/dashboard/dosar?tab=trasabilitate`
  - `/dashboard/reports/policies` → `/dashboard/dosar?tab=dovezi&filter=policies`
  - `/dashboard/reports/trust-center` → `/dashboard/dosar?tab=pachete&view=trust`
  - `/dashboard/audit-log` → `/dashboard/dosar?tab=trasabilitate`
  - `/dashboard/findings` → `/dashboard/resolve`
  - `/dashboard/conformitate` → `/dashboard/dosar?tab=overview`
  - `/dashboard/checklists` → `/dashboard/resolve`
  - `/dashboard/politici` → `/dashboard/dosar?tab=dovezi&filter=policies`
  - `/dashboard/generator` → `/dashboard/resolve`
  - `/dashboard/ropa` → `/dashboard/resolve?framework=gdpr&type=ropa`
  - `/dashboard/sisteme/eu-db-wizard` → `/dashboard/sisteme`
  - `/account/settings` → `/dashboard/settings?tab=profil`
  - `/onboarding/finish*` → `resolveOnboardingDestination(userMode)`
- **Acceptance:**
  - fiecare rută din map returnează 301 cu Location corect
  - query string păstrat
  - test suite acoperă toate 22 rute cu min 1 test per
  - rutele target răspund 200 după redirect (smoke test)
- **Dep:** niciun (target-ul Dosar se umple în Sprint 1; până atunci fallback la tab default)

#### S0.T4 — Delete rute zombie din filesystem (P0, S)
- **Ref:** 5.2
- **Fișiere șterse:** `app/onboarding/finish/`, `app/dashboard/findings/`, `app/dashboard/conformitate/`, `app/dashboard/checklists/`, `app/dashboard/politici/`, `app/dashboard/generator/`, `app/dashboard/ropa/`, `app/dashboard/scanari/`, `app/dashboard/setari/`, `app/dashboard/documente/`, `app/dashboard/rapoarte/`, `app/dashboard/audit-log/`, `app/dashboard/sisteme/eu-db-wizard/`, `app/account/settings/`
- **Acceptance:**
  - `grep -r "dashboard/findings" app components lib` → 0 rezultate active
  - `grep -r "dashboard/rapoarte" app components lib` similar
  - `npm run build` pass
  - nav-config nu referențiază rutele șterse
- **Dep:** S0.T3

#### S0.T5 — Nav-config refactor multi-mode (P0, M)
- **Ref:** 3.2, 6.1.1
- **Fișiere:**
  - `lib/compliscan/nav-config.ts` (refactor `getSidebarNavSections`)
  - `components/compliscan/navigation.ts` (simplifică: păstrează `coreNavItems`, `portfolioNavItems`, `viewerNavItems`; elimină `dashboardSecondaryNavSections`, `MODULE_NAV_ITEMS`)
  - `lib/compliscan/nav-config.test.ts` extins
- **Acceptance:**
  - `solo` → 5 items
  - `partner portfolio` → 5 items
  - `partner org Pro/Studio` → 7 items (cu Monitorizare)
  - `partner org Entry/Growth` → 6 items (fără Monitorizare)
  - `compliance` → 6 items + 7 cu Console
  - `viewer` → 4 items
  - `MODULE_NAV_ITEMS` dispare din sidebar primar
  - fiecare item are `matchers[]` corect
- **Dep:** S0.T4

#### S0.T6 — Finding class badge în queue și cockpit (P0, S)
- **Ref:** 6.2.6
- **Fișiere:**
  - `components/evidence-os/ExecutionClassBadge.tsx` **nou**
  - `components/compliscan/resolve-page.tsx`
  - `components/compliscan/finding-cockpit-shared.tsx`
- **Acceptance:**
  - badge: `Document` bleu / `Acțiune` portocaliu / `Asistat` violet
  - apare în `/dashboard/resolve` pe fiecare rând + cockpit hero
  - tooltip pe hover: „Clasa de execuție: [label] — [descriere]"
  - E2E: toate rândurile `/resolve` au badge
- **Dep:** niciun

#### S0.T7 — Dashboard Home refactor — next action dominant (P0, M)
- **Ref:** P8 + Flow Mihai B
- **Fișiere:**
  - `app/dashboard/page.tsx` (refactor major)
  - `components/compliscan/next-best-action.tsx` (ridică la hero)
- **Noua ierarhie:**
  1. Hero: `NextBestAction` cu CTA primary, above-fold
  2. Secțiune `Se aplică / Am găsit / Acum faci asta`
  3. Secțiune `Ce ține de monitorizat azi` (pentru solo + partner Entry/Growth + compliance fără nav Monitoring, sau critical today)
  4. Secțiune `Ce mi se aplică` compact
  5. KPI strip (max 4): Scor, Findings active, Review scadente, Pachet %
  6. Feed scurt max 3 items
- **Acceptance:**
  - primul element vizibil fără scroll = NextBestAction
  - cards egale ca greutate dispărute
  - Mihai lens pass
  - E2E: primul `h2` sub top-bar = CTA din NextBestAction
- **Dep:** S0.T1, S0.T5

#### S0.T8 — Cockpit success path trimite doar la Dosar sau next case (P0, S)
- **Ref:** 5.4 (pattern interzis redirect în afara spine-ului)
- **Fișiere:**
  - `app/dashboard/resolve/[findingId]/page.tsx`
  - `components/compliscan/finding-cockpit-shared.tsx` (`FindingDossierSuccessCard`)
- **Acceptance:**
  - după close, success state oferă EXACT 2 CTA: `Deschide Dosarul` + `Următorul caz`
  - zero link-uri către `/reports*`, `/audit-log`, `/documente`, `/generator`
  - grep în PR: `finding-cockpit-shared.tsx` conține doar `dosar` și `resolve` ca destinații în success
- **Dep:** S0.T3

#### S0.T9 — Mobile bottom nav aliniat cu mode mapping (P1, S)
- **Ref:** 3.2
- **Fișiere:** `components/compliscan/mobile-bottom-nav.tsx`
- **Acceptance:**
  - mobile nav afișează aceleași 5 items primare ca sidebar
  - adaptare pe `userMode` + `workspaceMode`
  - elimină `mobileNavItems` hard-coded
- **Dep:** S0.T5

#### S0.T10 — Fix flow documentar rupt (P0, M)
- **Ref:** runtime audit secțiunea 14.3 + 10.1 P0 #7
- **Scope:** repară ruptura live confirmată între attach document generat → success moment → cazul în Dosar → Redeschide cazul disponibil. E cel mai critic bug identificat în auditul runtime din 2026-03-27 și spine-ul documentar (clasa `documentary`) nu e complet funcțional fără el.
- **Fișiere:**
  - `components/compliscan/finding-cockpit-shared.tsx` (success state complet cu copy „Dovada este la dosar")
  - `components/compliscan/generator-drawer.tsx` (attach → trigger resolve cu state transition completă)
  - `components/compliscan/dosar/OverviewTab.tsx` (afișare caz închis sub „Cazuri rezolvate" cu dovada linked)
  - `lib/compliscan/finding-kernel.ts` (validare state transition `confirmed → resolved → under_monitoring` cu `nextMonitoringDateISO`)
  - `app/api/findings/[id]/route.ts` (mutație completă la close, zero drift între API response și UI state)
- **Acceptance:**
  - attach document generat + bifează checklist → `findingStatus` devine `resolved` AND `under_monitoring` (ambele stări consolidate vizibil)
  - success state afișează copy: „Dovada este la dosar. Documentul [X] a fost atașat și cazul intră sub monitorizare. Următoarea verificare: [data]. Dacă ceva se schimbă, te anunțăm."
  - 3 CTA: `Vezi dosarul` / `Următorul caz` / `Redeschide cazul`
  - `/dashboard/dosar?tab=overview` listează cazul sub „Cazuri rezolvate" cu dovada linked
  - `Redeschide cazul` click → cockpit cu `reopenReason=manual`, stepper poziționat pe pas relevant (stepper repoziționare completă vine în S3.T1)
  - Playwright E2E: Flow Diana A pași 12-17 trec cap-coadă; Flow Mihai A pași 8-12 trec cap-coadă
- **Dep:** S0.T2 (DestructiveConfirmDialog pentru close + reopen), S0.T8 (success redirect clean)

### Sprint 0 — Definition of Done

- **Flow Diana A** live cap-coadă pas 1→17
- **Flow Mihai A** live cap-coadă pas 1→12
- **Flow Radu A** live cap-coadă pas 1→11
- **Ruptura documentară din runtime audit** (attach → success → dosar → close → reopen) închisă; Flow Diana A pași 12-17 merg cap-coadă live
- **Redirect map:** toate 22 rute 301 + Location corect; 0 rute vechi 200
- **Banner workspace vizibil** în toate 4 moduri shell
- **DestructiveConfirmDialog** blochează close fără confirmare (3 findings distincte verificate manual)
- **Build clean:** `npm run build` + `lint` + `vitest` + Playwright smoke verzi
- **Zero erori console** pe spine (3 sesiuni Chrome DevTools)

### Sprint 0 — Post-sprint verification

| # | URL / Acțiune | Expect |
|---|---|---|
| 1 | GET `/dashboard/findings` | 301 → `/dashboard/resolve` |
| 2 | GET `/dashboard/rapoarte` | 301 → `/dashboard/dosar?tab=overview` |
| 3 | GET `/onboarding/finish` (logat solo) | 301 → `/dashboard/resolve` |
| 4 | GET `/account/settings` | 301 → `/dashboard/settings?tab=profil` |
| 5 | Login partner → `/portfolio` | nav: Portofoliu / Monitorizare / Remediere / Rapoarte client / Setări |
| 6 | Click client în `/portfolio` | banner „Lucrezi pentru X — ca Y" + toast |
| 7 | `/dashboard/resolve` | badges Document/Acțiune/Asistat pe rânduri |
| 8 | Close finding GDPR-001 | DestructiveConfirmDialog, nume firmă bold |
| 9 | După close | success state cu 2 CTA, zero link reports |
| 10 | `/dashboard` home | NextBestAction primul element vizibil |
| 11 | Close finding documentar Diana Client X → `/dashboard/dosar` | caz vizibil ca „rezolvat" + `Redeschide` disponibil |

---

## Sprint 1 — IA cleanup major (4 săptămâni)

**Scope goal:** IA nouă e completă. `/dashboard/monitoring` suita + `/dashboard/console` + `/dashboard/dosar` consolidat funcționează. Sub-rutele NIS2 au shell comun. După Sprint 1, Radu își trece ziua de lucru (Flow B) fără să atingă o rută veche.

**Execution order:** T1 → T2+T3 (paralel) → T4 → T5 → T6 → T7 → T8 → T9+T10 (paralel) → T11+T12 (paralel)

**Dependencies:** Sprint 0 închis verde.

**Risc de spargere:** medium. Mitigare: feature flag `NEXT_PUBLIC_DOSAR_V2=true`; taburile Dosar pot rula paralel cu `/reports*` timp de 2 săpt înainte de hard 301.

### Task-uri Sprint 1

#### S1.T1 — Dosar unified cu 4 tab-uri (P0, L)
- **Ref:** P6 absorbție reports
- **Fișiere:**
  - `app/dashboard/dosar/page.tsx` (tab routing via `?tab=`)
  - `components/compliscan/dosar-page.tsx` (refactor: wrapper)
  - `components/compliscan/dosar/OverviewTab.tsx` **nou**
  - `components/compliscan/dosar/EvidenceGapsTab.tsx` **nou**
  - `components/compliscan/dosar/PacksExportTab.tsx` **nou**
  - `components/compliscan/dosar/TraceabilityAuditTab.tsx` **nou**
  - Șterge: `reports-page.tsx`, `reports-audit-log-page.tsx`, `reports-policies-page.tsx`, `reports-trust-center-page.tsx`, `reports-vault-page.tsx`, `reports-tabs.tsx`, `app/dashboard/reports/*`
- **Acceptance:**
  - 4 tab-uri: Overview / Dovezi / Pachete / Trasabilitate via query `?tab=`
  - toate exporturile vechi accesibile prin tab Pachete
  - audit log vechi via Trasabilitate cu filtre echivalente
  - zero referințe la `dashboardRoutes.reports*`
- **Dep:** niciun

#### S1.T2 — /dashboard/monitoring overview + 3 sub-rute (P0, L)
- **Ref:** 6.1.1
- **Fișiere:**
  - `app/dashboard/monitoring/{page.tsx, alerte/page.tsx, approvals/page.tsx, agents/page.tsx}` **noi**
  - `components/compliscan/monitoring/{MonitoringOverview, MonitoringAlerts, MonitoringApprovals, MonitoringAgents}.tsx` **noi**
  - `lib/compliscan/dashboard-routes.ts` adaugă `monitoring*`
  - Șterge: `app/dashboard/approvals/*`, `app/dashboard/review/*`, `app/dashboard/calendar/*`, `approvals-page.tsx`, `review-cycles-page.tsx`
  - Middleware redirect: `approvals` → `monitoring/approvals`; `review` → `monitoring/alerte?filter=review`; `calendar` → `monitoring`
- **Acceptance:**
  - Overview: summary per zonă + `Ce cere atenție azi`
  - Alerte: feed cu filtre framework + source
  - Approvals: queue cu reject+motivare → finding
  - Agents: runs; accept → finding; reject → dismiss
  - Radu Flow B pas 3-6 verde live
- **Dep:** S1.T1 (pattern sub-rute)

#### S1.T3 — NIS2 suite cu shell comun + sub-rute păstrate (P0, M)
- **Fișiere:**
  - `app/dashboard/nis2/layout.tsx` **nou** (sidebar NIS2 cu 5 link-uri)
  - `app/dashboard/nis2/{page, eligibility/page, maturitate/page, inregistrare-dnsc/page, governance/page}.tsx` păstrate cu layout
  - `app/dashboard/nis2/incidents/page.tsx` **nou** (mutat din tab-uri)
  - `app/dashboard/nis2/vendors/page.tsx` **nou** (mutat din tab-uri)
  - `components/compliscan/nis2/Nis2SuiteSidebar.tsx` **nou**
  - Refactor: `AssessmentTab`, `IncidentsTab`, `VendorsTab` devin page content
- **Acceptance:**
  - `/nis2/eligibility` funcționează cu shell comun
  - sidebar NIS2 arată link-urile 5 sub-rute cu active state
  - deep-links existente (cu query `findingId`, `returnTo`, `focus`) neschimbate
  - Radu Flow A pas 8-10 trece verde live
- **Dep:** S1.T1

#### S1.T4 — /dashboard/settings consolidat cu tab-uri (P0, M)
- **Ref:** 5.1 + preparare S2.T1 (Brand tab)
- **Fișiere:**
  - `app/dashboard/settings/page.tsx` (refactor)
  - `components/compliscan/settings-page.tsx` (tab navigation)
  - `components/compliscan/settings/{ProfileTab, PlanTab, TeamTab, IntegrationsTab, OperationalTab}.tsx` **noi**
  - Șterge: `app/account/settings/*`, `account-settings-page.tsx`
- **Acceptance:**
  - tab-uri: Profil / Firmă / Plan / Team / Integrări / Operațional (Radu only) / Brand (placeholder S2)
  - `?tab=profil` funcțional; query routing
  - zero link-uri către `/account/settings` în cod
- **Dep:** S0.T3, S0.T4

#### S1.T5 — Consolidare obiect „Alertă" în UI (P0, M)
- **Ref:** 5.3 (Drift + Alert topite)
- **Fișiere:**
  - `MonitoringAlerts.tsx` (view unified)
  - `lib/compliance/types.ts` (`Alert.source: 'drift' | 'legislative' | 'vendor' | 'review_due' | 'anaf_signal'`)
  - `/api/monitoring/alerts/route.ts` **nou** (unește `/api/drifts` + `/api/alerts`, backward compat 90 zile)
- **Acceptance:**
  - UI un singur endpoint; source marcat vizual
  - filtrare pe source funcționează
  - CTA unic per alertă: `Investighează` → drawer cu `Creează finding` sau `Deschide existing`
  - backward compat păstrat
- **Dep:** S1.T2

#### S1.T6 — Consolidare obiect „Dovadă" în Dosar (P1, M)
- **Ref:** 5.3
- **Fișiere:**
  - `EvidenceGapsTab.tsx` (rendering unificat)
  - `lib/compliance/types.ts` (`Evidence.kind`)
  - `evidence-card.tsx` **nou**
- **Acceptance:**
  - orice dovadă (doc/notă/fișier/ref) = layout identic + kind badge
  - click → drawer cu conținut
  - legătură la findingul sursă clickabilă
  - tables backend rămân separate; doar UI unified
- **Dep:** S1.T1

#### S1.T7 — /dashboard/console pentru Radu + Diana Studio (P1, M)
- **Ref:** 6.1.2
- **Fișiere:**
  - `app/dashboard/console/page.tsx` **nou**
  - `ConsoleIndex`, `ConsoleCard` **noi**
  - `dashboard-routes.ts` adaugă `console`
  - `nav-config.ts` condiționat
- **Acceptance:**
  - 8 cards: NIS2, DSAR, Vendor Review, AI Systems, DORA, Fiscal, Whistleblowing, Pay Transparency
  - stare agregată reală per card (ex. „4 incidente deschise, assessment 68%")
  - greyed pentru ne-applicabile
  - click → rută console mode
  - nav item apare pentru Radu + Diana Studio
- **Dep:** S1.T3

#### S1.T8 — Console mode pentru module specialist (P1, M)
- **Ref:** 3.4, P7
- **Fișiere:** `app/dashboard/{dsar, vendor-review, sisteme, pay-transparency, dora, whistleblowing, fiscal}/page.tsx` (branch-uri dual mode)
- **Acceptance:**
  - solo + `/dsar` fără findingId → redirect 302 `/dashboard/resolve`
  - compliance + `/dsar` → console mode (listă toate DSAR cu status)
  - partner org + `/dsar?findingId=X` → cockpit tool cu auto-return
- **Dep:** S0.T5

#### S1.T9 — Bridge partner deprecated → delete (P1, S)
- **Ref:** 5.1
- **Fișiere:**
  - Șterge: `app/dashboard/partner/page.tsx`, `app/dashboard/partner/[orgId]/page.tsx`, `legacy-workspace-bridge.tsx`
  - Middleware: `/partner` → `/portfolio`, `/partner/:orgId` → `/portfolio/client/:orgId`
- **Acceptance:**
  - bridge nu mai există ca fișier
  - middleware preia traficul
  - zero referințe `LegacyWorkspaceBridge`
- **Dep:** S0.T3

#### S1.T10 — /portfolio/vendors card dominant în overview (P0, S)
- **Ref:** 6.3.4
- **Fișiere:** `portfolio-overview-client.tsx` (card Vendors above-fold)
- **Acceptance:**
  - card în `/portfolio` afișează: total vendori, overdue, FLAGGED
  - CTA `Vezi toți furnizorii și hygiene` → `/portfolio/vendors`
  - Flow Diana B 14:00 merge
- **Dep:** S0.T5

#### S1.T11 — Creare bulk cu dialog scope (P0, S)
- **Ref:** 6.2.5
- **Fișiere:**
  - `BulkCreateConfirmDialog.tsx` **nou**
  - `portfolio-alerts-page.tsx`, `portfolio-vendors-page.tsx`, `import-wizard.tsx`
- **Acceptance:**
  - înainte de create-bulk: dialog cu număr entități + primele 5 + `și încă N` + Confirm / Anulează
  - pentru <6 entități, lista completă
  - test: bulk create fără confirm nu triggerează mutația
- **Dep:** niciun

#### S1.T12 — Eliminare Batch-execute din /portfolio/tasks (P0, S)
- **Ref:** 5.4, regula creare permis / execuție interzis
- **Fișiere:**
  - `portfolio-tasks-page.tsx` (elimină bulk-close / bulk-approve / bulk-resolve)
  - `/api/portfolio/batch/route.ts` (deprecate close multi-client; păstrează create-bulk)
  - `lib/server/batch-executor.ts` (marchează deprecated close-bulk)
- **Acceptance:**
  - UI `/portfolio/tasks`: doar triaj; click → switch workspace → cockpit per client
  - 0 butoane „Rezolvă toate" / „Aprobă selectate" / „Închide în lot"
  - grep: `batch-close`, `batchResolve`, `bulkResolve` → 0 call sites vii în UI
  - E2E: API direct către `/api/portfolio/batch` cu `action=close` pe 2 findings → 400 `OPERATION_FORBIDDEN_USE_PER_CLIENT`
- **Dep:** niciun

### Sprint 1 — Definition of Done

- **Flow Radu B complet live** (09:00-17:00) fără rute vechi
- **`/dashboard/dosar`** absoarbe toate 4 output surface; fiecare tab populat echivalent cu `/reports/*`
- **`/dashboard/monitoring`** 4 rute funcționale; approvals / review / calendar mort (redirectat)
- **NIS2 suite** cu shell comun, 5+ sub-rute, deep links respectați
- **Batch execute eliminat** din UI; API blochează close multi-client cu 400
- **Nav corect** pentru toate 5 moduri
- **Console index** accesibil pentru Radu și Diana Studio
- **Vitest + Playwright** zero fail pe spine; coverage ≥ 70% pe componente noi

### Sprint 1 — Post-sprint verification

| # | URL / Acțiune | Expect |
|---|---|---|
| 1 | Login Radu → `/dashboard` | nav 6 items + Monitorizare vizibil |
| 2 | `/dashboard/monitoring` | overview 3 zone + badges |
| 3 | `/dashboard/monitoring/approvals` | reject cu motivare → finding |
| 4 | `/dashboard/monitoring/agents` | accept → finding; reject → dismiss |
| 5 | `/dashboard/console` (Radu) | 8 cards; greyed pentru ne-aplicabile |
| 6 | `/dashboard/dosar` | 4 tab-uri; fiecare populat |
| 7 | `/dashboard/reports` | 301 → `/dashboard/dosar?tab=overview` |
| 8 | `/dashboard/nis2/eligibility` | shell comun NIS2 cu sidebar |
| 9 | `/portfolio/tasks` (Diana) | queue cross-client; 0 butoane bulk close |
| 10 | `/portfolio` (Diana) | card Vendors above-fold |
| 11 | POST `/api/portfolio/batch` `action=close` multi-client | 400 |

---

## Sprint 2 — Partner GTM-ready (3 săptămâni)

**Scope goal:** Diana poate vinde la primul client plătitor. White-label complet, plan gating contextual, Guest Auditor funcțional, deep-link emails setează workspace.

**Execution order:** T1 → T2 → T3+T4 (paralel) → T5 → T6 → T7

**Dependencies:** Sprint 0 + Sprint 1 închise verde.

**Risc de spargere:** medium — atingem export pipeline + email templates. Mitigare: staging cu 2 conturi partner test + QA manual pe fiecare tip export; feature flag `NEXT_PUBLIC_WHITE_LABEL_V2=true`.

### Task-uri Sprint 2

#### S2.T1 — Brand capture la onboarding partner + tab Brand în Settings (P0, L)
- **Ref:** 6.2.1
- **Fișiere:**
  - `onboarding-form.tsx` (pas 4 condiționat pe partner)
  - `partner-workspace-step.tsx` extins
  - `settings/BrandTab.tsx` **nou**
  - `/api/org/profile` extins cu `logo_url`, `accent_color`, `email_header`, `signature`, `legal_footer`
  - `supabase/public.org_state.metadata.brand` jsonb
  - `lib/compliance/brand.ts` **nou**
- **Acceptance:**
  - pas 4 onboarding partner: form brand (logo max 1MB PNG/SVG, color picker, 3 text fields) — toate opționale
  - tab Brand în Settings pentru edit
  - preview live email + PDF header
  - fallback fără brand: `Pregătit de Cabinet [name]` text fără logo
- **Dep:** S1.T4

#### S2.T2 — Export pipeline brand-aware (P0, L)
- **Ref:** 6.2.1 propagare
- **Fișiere:**
  - `lib/server/audit-pack-pdf.ts`, `audit-pack-bundle.ts`, `audit-pack-client.ts`, `annex-lite-client.ts` (consume `getBrandConfig`)
  - `/api/exports/{audit-pack/pdf, audit-pack/client, annex-lite/client, vendor-trust-pack}/route.ts`
  - `/api/reports/{response-pack, counsel-brief}/route.ts`
  - `app/trust/[orgId]/page.tsx`, `app/r/renewal/[orgId]/page.tsx`
  - `app/shared/[token]/page.tsx` **nou sau refactor**
- **Acceptance:**
  - orice export client-facing poartă logo + culoare + footer brand
  - dacă sesiunea e guest auditor (S2.T3), footer guest override
  - preview live UI: „Așa va arăta pentru patron"
  - test: audit-pack Client X cu brand Popescu → PDF conține logo + `Cabinet Popescu & Asociații`
- **Dep:** S2.T1

#### S2.T3 — Guest Auditor cu sesiune temporară + footer watermark (P0, L)
- **Ref:** 6.2.3
- **Fișiere:**
  - `lib/server/auth.ts` (+ `GuestAuditorRecord`)
  - `lib/server/guest-auditor-store.ts` **nou**
  - `supabase/guest-auditor-sessions.sql` **nou** (tabelă cu `id, email, invitedByUserId, orgIds[], expiresAt, scope, watermarkConfig, activityLog`)
  - `middleware.ts` extensie sesiuni guest
  - `settings/TeamTab.tsx` (2 butoane distincte: `Invită membru` + `Acces audit extern`)
  - `guest-auditor-invite-modal.tsx` **nou**
  - `audit-pack-pdf.ts` (footer per pagină + pagină manifest SHA-256)
  - `/api/exports/audit-pack/pdf/route.ts` (calc SHA-256 + scrie manifest)
- **Acceptance:**
  - Radu `/settings?tab=team` invită auditor scope 1 firmă, expiry 30 zile
  - auditor primește email magic link → sesiune temporară (fără cont permanent)
  - banner persistent: `Sesiune audit extern — expiră 2026-05-23`
  - mutație disabled cu tooltip
  - export în sesiune guest: footer pe fiecare pagină + manifest la final
  - sesiune expiră automat la `expiresAt` — post-expiry login: „Sesiunea a expirat, contactează [inviter]"
  - activity log în `/dosar?tab=trasabilitate` filtrat `source=guest_auditor`
- **Dep:** S1.T4

#### S2.T4 — Paywall modal contextual (P0, M)
- **Ref:** 6.2.4
- **Fișiere:**
  - `PaywallModal.tsx` **nou**
  - `plan-gate.tsx` (refactor: 2 moduri — `hide` + `paywall-on-submit`)
  - `portfolio-overview-client.tsx` (wrap `Adaugă client`)
  - `settings/BrandTab.tsx` (wrap export white-label pt Entry)
  - `/api/stripe/checkout` primește `returnAction`
- **Acceptance:**
  - `Adaugă client` rămâne activ pentru descoperire; la submit pe Growth cu 5 clienți → modal cu explicație
  - modal listează 3-5 feature-uri concrete
  - upgrade → Stripe → retur automat la acțiune (cu `returnAction=add_client`)
  - capabilități discrete hidden în nav pentru Entry/Growth
- **Dep:** niciun

#### S2.T5 — Deep-link preservation în emails (P1, M)
- **Ref:** 6.2.7
- **Fișiere:**
  - `share-token-store.ts` extins cu tokeni de navigație (`workspaceMode`, `orgId`, `destination`, `expiresAt`)
  - `email-alerts.ts` (toate functiile emit token + link)
  - `/api/cron/{drift-sweep, legislation-monitor, renewal-reminder, daily-digest, weekly-digest, monthly-digest, partner-monthly-report}/route.ts`
  - `middleware.ts` consume token → setează cookie workspace → redirect
- **Acceptance:**
  - email drift Diana cu link `/t/abc123?redirect=/dashboard/resolve/finding-x` → click setează workspace, redirect la cockpit X
  - token expiră 7 zile; post-expiry redirect login cu flash
  - activity log: consum token loggat în `notifications_state`
- **Dep:** niciun

#### S2.T6 — Applicability edit retroactiv în Settings (P1, M)
- **Ref:** 6.2.2
- **Fișiere:**
  - `settings/ProfileTab.tsx` (+ secțiune `Ce mi se aplică`)
  - `applicability-editor.tsx` **nou**
  - `/api/org/profile/recalculate/route.ts` **nou**
  - `lib/compliscan/onboarding-steps.ts` (funcția answers → applicability exportată)
  - `finding-kernel.ts` expose `classifyFinding` apelabil
- **Acceptance:**
  - Mihai Flow C1 pas 1-6 live
  - edit single răspuns → preview impact: „3 cazuri noi, 2 inactive"
  - confirm → findings create/inactive → redirect `/resolve` cu banner
  - zero restart onboarding
- **Dep:** S1.T4

#### S2.T7 — Shared token page brand-uit (P1, S)
- **Ref:** P9 + P10 + Flow Diana C4
- **Fișiere:**
  - `app/shared/[token]/page.tsx` **nou sau refactor**
  - `/api/reports/share-token/route.ts` extins cu brand context
- **Acceptance:**
  - patron → `/shared/[token]` single-page: logo cabinet + preview + `Aprob` / `Am întrebări`
  - aprobare → `documentApprovalStatus=approved_by_owner`, token consumat
  - pagina: zero meniu, zero link produs, zero brand CompliAI
  - expirare default 30 zile
- **Dep:** S2.T2

### Sprint 2 — Definition of Done

- **Flow Diana A pas 3-17** live cu brand captat pas 4; primul PDF cu brand Popescu
- **Flow Diana B 11:00** (export pachet renewal) — toate 3 canale brand-uite
- **Flow Radu C2** — Guest Auditor invite expiry 30 zile; export cu footer pe fiecare pagină + manifest SHA-256
- **Diana C2** plan upgrade — al 6-lea client Growth → paywall la submit; upgrade → retur wizard cu Pro activ
- **Deep-link email** setează workspace automat
- **Mihai C1** applicability edit retroactiv live
- **Guest Auditor** expiră automat; post-expiry mesaj specific

### Sprint 2 — Post-sprint verification

| # | URL / Acțiune | Expect |
|---|---|---|
| 1 | Onboarding partner pas 4 | form brand cu preview live |
| 2 | Export audit-pack Client X | PDF cu logo Popescu, footer brand |
| 3 | `/shared/[token]` | single-page brand cabinet, 0 CompliAI |
| 4 | Invite guest auditor 30 zile | email → sesiune temporară read-only |
| 5 | Export sesiune guest | footer pe fiecare pagină + manifest SHA-256 |
| 6 | Al 6-lea client Growth | paywall modal cu 3-5 feature concrete |
| 7 | Click link drift email Diana | cockpit X în context corect |
| 8 | Settings → Ce mi se aplică → edit | preview impact → findings recalculate |

---

## Sprint 3 — Polish (2 săptămâni)

**Scope goal:** produsul e launch-ready. Toate patterns emergente implementate, experiențe secundare șlefuite.

**Execution order:** T1+T2+T3 (paralel, independent) → T4 → T5+T6 (paralel) → T7 → T8

**Dependencies:** Sprint 0, 1, 2 închise verde.

**Risc de spargere:** low — refactoruri minore, zero routing nou, zero schema nouă.

### Task-uri Sprint 3

#### S3.T1 — Reopen cu stepper repoziționat (P1, M)
- **Ref:** 6.3.1
- **Fișiere:**
  - `lib/compliance/types.ts` (+ `ScanFinding.reopenReason?: 'drift_dovada' | 'legislative' | 'review_due' | 'vendor_flag' | 'agent_proposal'`)
  - `finding-kernel.ts` derivă `initialStepperState` din `reopenReason`
  - `app/dashboard/resolve/[findingId]/page.tsx`
  - `finding-cockpit-shared.tsx`
- **Acceptance:**
  - finding cu `reopenReason=drift_dovada` → cockpit pe pas `Re-verifică dovada`
  - Mihai Flow B pas 3 și Radu Flow C1 merg
  - banner galben persistent: „Cazul s-a redeschis. Motiv: [reason]. Dovada anterioară poate fi învechită."
- **Dep:** niciun

#### S3.T2 — Secțiunea „Ce mi se aplică" în Acasă (P2, S)
- **Ref:** 6.3.2
- **Fișiere:** `app/dashboard/page.tsx`, `applicability-summary-card.tsx` **nou**
- **Acceptance:**
  - card compact: `Se aplică: GDPR, NIS2, AI Act. Nu se aplică: DORA, PAY.`
  - click → `/settings?tab=profil#applicability`
- **Dep:** S2.T6

#### S3.T3 — Secțiunea „Ce ține de monitorizat azi" în Acasă pentru non-Monitoring users (P2, S)
- **Ref:** 6.3.3
- **Fișiere:** `app/dashboard/page.tsx`
- **Acceptance:**
  - Mihai + Diana Entry/Growth: card cu 3 items
  - Radu + Diana Pro/Studio: card doar dacă ≥1 critical today
- **Dep:** S1.T5

#### S3.T4 — Confirm destructive cu nume firmă la toate acțiunile oficiale (P1, S)
- **Ref:** 6.1.3 extindere
- **Fișiere:**
  - `finding-cockpit-shared.tsx`
  - `/api/exports/*` UI wrap pe trimiteri oficiale ANSPDCP/DNSC/ANAF
  - `nis2/IncidentsTab.tsx` wrap la `Trimite early warning`
  - `dsar-request-card.tsx` wrap la `Trimite răspuns DSAR`
- **Acceptance:**
  - zero trimiteri oficiale fără dialog cu nume firmă bold
  - smoke test manual pe 4 acțiuni
- **Dep:** S0.T2

#### S3.T5 — Empty states + copy cleanup pass (P1, M)
- **Ref:** 5.4, 5.5
- **Fișiere:**
  - `components/evidence-os/EmptyState.tsx` (refactor text-first)
  - call sites: `resolve-page`, `dosar-page`, `portfolio-*`, `scan-page`, `scan-history-page`
  - grep copy: `Felicitări`, `Super`, `Perfect`, `Excelent`, emoji, `Începe acum`, `Cu Compli`, `în 5 minute` — eliminate
- **Acceptance:**
  - zero emoji în produs (excepție landing/email)
  - zero celebration copy după close
  - empty states ton calm
  - feedback-prompt scos de la cockpit success (păstrat în Settings manual)
- **Dep:** niciun

#### S3.T6 — Viewer rol implementat (P2, S)
- **Fișiere:**
  - `nav-config.ts` `viewerNavItems` 4 iteme
  - `dashboard-shell.tsx` când `role=viewer` toate butoanele mutație `disabled + tooltip`
  - `/api/**/*` middleware rejects mutații pentru viewer
- **Acceptance:**
  - viewer nav: Acasă / Taskurile mele / Dosar / Setări profil
  - butoane mutație disabled
  - tooltip consistent: `Rol read-only — cere acces la owner`
- **Dep:** S0.T5

#### S3.T7 — Reopen cascade UI cu impact visible (P2, S)
- **Ref:** Flow Radu C1 pas 4
- **Fișiere:** `MonitoringAlerts.tsx` (drawer cu impact preview + `DestructiveConfirmDialog` cu listă findings)
- **Acceptance:**
  - drift legislative major → `Investighează` → drawer „5 findings vor fi redeschise. Lista: [...]"
  - Confirm → toate 5 redeschise cu `reopenReason=legislative`
- **Dep:** S3.T1

#### S3.T8 — Cleanup final: remove legacy components (P2, S)
- **Ref:** 5.2, 5.3 finisare
- **Fișiere:**
  - Șterge: `components/compliscan/rapoarte/`, `scanari/`, `reports-*.tsx` legacy, `remediation-board.tsx` (dacă unused post-S1), `approvals-page.tsx` (dacă înlocuit)
  - `batch-executor.ts` — funcții close-bulk deprecated efectiv șterse
  - `app/dashboard/documente`, `app/dashboard/rapoarte` dacă mai există — șterse
- **Acceptance:**
  - grep → 0 referințe active
  - build pass
  - bundle size redus ≥ 5% față de pre-Sprint 0
- **Dep:** S1 + S2 complete

### Sprint 3 — Definition of Done

- **Toate 6 patterns emergente live**
- **Viewer rol complet** — 4 iteme, acțiuni disabled consistent
- **Empty states & copy cleanup** — zero emoji/marketing/celebration
- **Reopen** cu stepper corect și cascade UI cu impact vizibil
- **Legacy code șters** din filesystem; bundle redus
- **Toate Flow-urile** trec live end-to-end
- **Test coverage** componente spine ≥ 80%; Playwright acoperă top 15 journeys

### Sprint 3 — Post-sprint verification

| # | Acțiune | Expect |
|---|---|---|
| 1 | Reopen finding drift_dovada | cockpit intră pe `Re-verifică` |
| 2 | Acasă Mihai | card „Ce mi se aplică" + „Ce ține de monitorizat azi" |
| 3 | Trimite ANSPDCP | dialog cu nume firmă bold |
| 4 | `/dashboard/resolve` empty | text-first, zero ilustrații |
| 5 | Login viewer | 4 iteme nav, butoane disabled |
| 6 | Reopen cascade | drawer arată 5 findings impact |
| 7 | `git log --stat` Sprint 3 | > 20 fișiere deleted net |

---

## 7.2 Rollback plan per sprint

Strategie generală: **fiecare sprint are o commit SHA ancoră la închidere** pe branch main. Rollback = `git revert <sha>..HEAD` + redeploy Vercel la commit anterior. Nu folosim `git reset` pe main.

### Rollback Sprint 0
- **Trigger:** >5% login 500, sau Sentry error rate >2% pe `/resolve` primele 24h
- **Acțiune:** (1) `NEXT_PUBLIC_IA_V2_ROUTING=false` redeploy <5 min; (2) dacă persistă, `git revert` S0 commit; (3) rutele vechi coexistă cu 301 dezactivat
- **Data loss:** zero — migrări non-destructive

### Rollback Sprint 1
- **Trigger:** export audit-pack fail >10% sau findings nu se afișează în `/resolve` pentru vreun user
- **Acțiune:** (1) `NEXT_PUBLIC_DOSAR_V2=false` — `/reports/*` paralele; (2) dacă persistă >2h, revert S1
- **Data loss:** zero

### Rollback Sprint 2
- **Trigger:** export brand-uit cu brand greșit (cross-contamination) sau Guest Auditor creează persistent account
- **Acțiune:** (1) immediate disable tab Brand via flag — exporturi revin la fallback CompliAI brand; (2) disable guest auditor invite + force expire sesiuni active suspicioase; (3) revert S2 dacă eroare structurală
- **Data loss:** brand configs persistă în DB; re-activare post-fix instant

### Rollback Sprint 3
- **Trigger:** low probabilitate (sprint polish)
- **Acțiune:** `git revert` individual per task; nu rollback complet
- **Data loss:** zero

## 7.3 Feature flags recomandate

| Flag | Default la deploy | Sprint introdus | Când se elimină |
|---|---|---|---|
| `NEXT_PUBLIC_IA_V2_ROUTING` | `false`; `true` după 72h stabilitate | S0 | End S0 + 2 săpt |
| `NEXT_PUBLIC_DOSAR_V2` | `false`; `true` după 48h | S1 | End S1 + 2 săpt |
| `NEXT_PUBLIC_WHITE_LABEL_V2` | `false`; gradual per partner test (opt-in înainte de general) | S2 | End S2 + 3 săpt |
| `NEXT_PUBLIC_GUEST_AUDITOR` | `false` până la QA manual pe 3 cabinet test | S2 | End S2 + 4 săpt |
| `NEXT_PUBLIC_PAYWALL_CONTEXTUAL` | `true` imediat (nu risc) | S2 | — (permanent) |

### Procedură „Cum se activează un feature flag"

1. **Deploy cu flag OFF** (default). Codul e live pe producție dar nu are efect.
2. **Smoke test 24-72h** pe staging + un cont production test (dev-ul propriu sau 1 client pilot). Verifică Sentry error rate, logs, flow-urile care ating codul nou.
3. **Activare gradual:** 10% traffic → 50% → 100%. Între trepte, pauză minim 24h. Metricii urmăriți între trepte: 5xx rate, finding close rate, export generation success (pentru S2 flags în special).
4. **Remove flag-ul în sprint-ul următor** dacă Sentry error rate rămâne normal. Nu lăsa flag-uri moarte în cod — fiecare flag rămas neutilizat e datorie tehnică care crește cu timpul.

**Excepție:** `NEXT_PUBLIC_PAYWALL_CONTEXTUAL` poate fi `true` direct la deploy — doar adaugă modal UI, zero risc de side effect pe flow-urile existente.

## 7.4 Monitoring de producție — primele 7 zile per sprint

### Logs și metrics de urmărit

| Metric | Sursă | Alarm threshold |
|---|---|---|
| 5xx rate pe `/dashboard/*` | Vercel Analytics | > 1% per oră |
| 301 count pe rutele migrate | Vercel Logs | scade după 7 zile; dacă constante → outreach email users cu bookmark vechi |
| Sentry error rate | Sentry (sentry.edge.config.ts) | > 10 erori unice per oră |
| Finding close rate | `/api/findings/*/resolve` logs | scade < 80% din baseline → investigate |
| Time to first case closed (Mihai) | Analytics custom event | > 10 min → UX issue |
| Workspace switch success rate | `/api/auth/switch-org` 200/4xx ratio | < 95% → bug |
| Export generation success | `/api/exports/*` | < 95% → brand config sau infra |
| Guest auditor session leakage | `guest_auditor_sessions` audit log | orice acțiune ≠ read → incident P0 |
| DB write latency | Supabase dashboard | p95 > 500ms |

### Observability explicită de adăugat

- Event `workspace_switched` cu `fromOrgId`, `toOrgId`, `userMode` (Sprint 0)
- Event `finding_resolved` cu `executionClass`, `timeSinceCreated`, `userMode` (Sprint 0)
- Event `destructive_action_confirmed` cu acțiune + userMode (Sprint 0)
- Event `paywall_shown` + `paywall_upgraded` cu triggering action (Sprint 2)
- Event `guest_auditor_session_started` + `guest_auditor_action` (Sprint 2)

Toate loggate în `app/api/analytics/track/route.ts` (există).

## 7.5 Total scope cumulat

| Sprint | Durată | Task-uri | Items din Sec 6 | Estimări |
|---|---|---|---|---|
| 0 | 3 săpt | 10 | 5/16 + fix ruptură documentară | 1L + 5M + 4S |
| 1 | 4 săpt | 12 | 4/16 | 3L + 5M + 4S |
| 2 | 3 săpt | 7 | 5/16 | 3L + 3M + 1S |
| 3 | 2 săpt | 8 | 2/16 + polish | 0L + 2M + 6S |
| **Total** | **12 săpt** | **37 tasks** | **16/16 + fix P0** | **7L + 15M + 15S** |

Aliniat cu estimarea originală din 6.6 (10-12 săpt solo). Cu 2 dev-eri în paralel: Sprint 2 și 3 pot overlap 1 săpt (S3.T1-T3 independente de S2 output); total de la 12 la ~10 săpt.

---

# Anexa A — Mapping rute vechi → noi

Tabela completă pentru QA redirect verification. Folosită în teste `middleware.test.ts` (S0.T3).

## A.1 Redirect-uri 301 permanente (22 rute)

| # | Rută veche | Rută nouă | Tip | Păstrează query |
|---|---|---|---|---|
| 1 | `/dashboard/scanari` | `/dashboard/scan` | redundant RO | da |
| 2 | `/dashboard/scanari/*` | `/dashboard/scan/*` | redundant RO | da |
| 3 | `/dashboard/setari` | `/dashboard/settings` | redundant RO | da |
| 4 | `/dashboard/setari/abonament` | `/dashboard/settings/abonament` | redundant RO | da |
| 5 | `/dashboard/documente` | referer-based: scan → `/dashboard/scan/history`; else → `/dashboard/dosar?tab=dovezi` | absorbit Dosar | da |
| 6 | `/dashboard/rapoarte` | `/dashboard/dosar` | absorbit Dosar | da |
| 7 | `/dashboard/rapoarte/auditor-vault` | `/dashboard/dosar?tab=pachete` | absorbit Dosar | da |
| 8 | `/dashboard/rapoarte/trust-profile` | `/dashboard/dosar?tab=pachete&view=trust` | absorbit Dosar | da |
| 9 | `/dashboard/reports` | `/dashboard/dosar?tab=overview` | absorbit Dosar | da |
| 10 | `/dashboard/reports/vault` | `/dashboard/dosar?tab=pachete` | absorbit Dosar | da |
| 11 | `/dashboard/reports/audit-log` | `/dashboard/dosar?tab=trasabilitate` | absorbit Dosar | da |
| 12 | `/dashboard/reports/policies` | `/dashboard/dosar?tab=dovezi&filter=policies` | absorbit Dosar | da |
| 13 | `/dashboard/reports/trust-center` | `/dashboard/dosar?tab=pachete&view=trust` | absorbit Dosar | da |
| 14 | `/dashboard/audit-log` | `/dashboard/dosar?tab=trasabilitate` | zombie | da |
| 15 | `/dashboard/findings` | `/dashboard/resolve` | zombie | da |
| 16 | `/dashboard/conformitate` | `/dashboard/dosar?tab=overview` | zombie | da |
| 17 | `/dashboard/checklists` | `/dashboard/resolve` | zombie | da |
| 18 | `/dashboard/politici` | `/dashboard/dosar?tab=dovezi&filter=policies` | zombie | da |
| 19 | `/dashboard/generator` | `/dashboard/resolve` | zombie | da |
| 20 | `/dashboard/ropa` | `/dashboard/resolve?framework=gdpr&type=ropa` | zombie | da |
| 21 | `/dashboard/sisteme/eu-db-wizard` | `/dashboard/sisteme` | zombie | da |
| 22 | `/account/settings` | `/dashboard/settings?tab=profil` | redundant | da |

## A.2 Redirect-uri absorbite în Monitoring suite (3 rute)

| # | Rută veche | Rută nouă | Tip |
|---|---|---|---|
| 23 | `/dashboard/approvals` | `/dashboard/monitoring/approvals` | absorbit Monitoring |
| 24 | `/dashboard/review` | `/dashboard/monitoring/alerte?filter=review` | absorbit Monitoring |
| 25 | `/dashboard/calendar` | `/dashboard/monitoring` | absorbit Monitoring |

## A.3 Redirect-uri bridge deprecated (2 rute)

| # | Rută veche | Rută nouă | Tip |
|---|---|---|---|
| 26 | `/dashboard/partner` | `/portfolio` | bridge legacy |
| 27 | `/dashboard/partner/[orgId]` | `/portfolio/client/[orgId]` | bridge legacy |

## A.4 Redirect onboarding special

| # | Rută veche | Rută nouă | Logică |
|---|---|---|---|
| 28 | `/onboarding/finish*` | `resolveOnboardingDestination(userMode)` | solo/compliance → `/dashboard/resolve`; partner → `/portfolio`; viewer → `/dashboard` |

## A.5 Sub-rute NIS2 păstrate

Nu sunt redirect-uri — rute care **supraviețuiesc** ca sub-rute ale suitei NIS2 cu shell comun (introdus în S1.T3):

| Path | Status după Sprint 1 |
|---|---|
| `/dashboard/nis2` | păstrată — overview cu redirect intern la prima sub-rută aplicabilă |
| `/dashboard/nis2/eligibility` | păstrată cu layout comun |
| `/dashboard/nis2/maturitate` | păstrată cu layout comun |
| `/dashboard/nis2/inregistrare-dnsc` | păstrată cu layout comun |
| `/dashboard/nis2/governance` | păstrată cu layout comun |
| `/dashboard/nis2/incidents` | **nouă** (din tab în page) |
| `/dashboard/nis2/vendors` | **nouă** (din tab în page) |

## A.6 Rute canonice complete (43)

Vezi Secțiunea 3.3 pentru tabelul complet cu toate 43 rutele canonice care supraviețuiesc în v1.

---

# Anexa B — Checklist 5-întrebări pentru orice ecran nou

Regulă de control pentru PR review + QA manual înainte de merge pe main. Derivat din runtime audit (Secțiunea 12 „formula de control").

**Pentru fiecare ecran nou sau modificat, pune aceste 5 întrebări:**

### 1. Userul înțelege în 5 secunde ce face aici?

*Test:* deschide ecranul fără context (sesiune nouă, incognito, user proaspăt). Prima frază vizibilă îi spune exact unde e și ce poate face? Dacă trebuie să citească 3 paragrafe ca să priceapă scop-ul, **nu**.

*Exemplu OK:* `/dashboard/resolve` → primul h1 „De rezolvat — 12 cazuri active". Clar.

*Exemplu NU:* `/dashboard` cu 6 cards egale + tutorial stick + widget sandbox. Userul vede „prezentare de produs", nu next action.

### 2. Acțiunea principală e dominantă?

*Test:* dacă userul are o singură intenție în acel ecran, CTA-ul corespunzător e vizibil fără scroll, colorat distinct, și poziționat deasupra pliului. Nu e competitor cu 5 alte butoane egale.

*Exemplu OK:* cockpit cu `Confirmă și generează` primary + `Nu se aplică` secondary. Ierarhie clară.

*Exemplu NU:* Dosar cu 8 butoane export la același nivel, niciunul distinct.

### 3. Cazul se rezolvă în cockpit sau produsul îl împinge în afară?

*Test:* pentru orice finding, fluxul de rezolvare trece prin `/dashboard/resolve/[findingId]`. Dacă există un drum care închide cazul prin altă pagină (ex. direct din `/dashboard/dsar` fără `findingId`), principiul P3 e violat.

*Exemplu OK:* `workflowLink` deschide `/dashboard/nis2/inregistrare-dnsc?findingId=X&returnTo=...` — handoff controlat.

*Exemplu NU:* pagină specialist cu propriul buton `Rezolvă` care închide findingul direct fără a reveni în cockpit.

### 4. Dovada ajunge clar în dosar?

*Test:* după succes, userul vede explicit (a) că dovada e salvată, (b) unde poate să o vadă, (c) că monitorizarea e activă. Un mesaj vag „Salvat cu succes" nu califică.

*Exemplu OK:* cockpit success cu banner `Documentul e în Dosar. Cazul monitorizat până 2027-04-23` + 2 CTA (`Deschide Dosarul` / `Următorul caz`).

*Exemplu NU:* toast `Done!` care dispare în 2 secunde.

### 5. După închidere, monitorizarea e vizibilă și logică?

*Test:* orice finding rezolvat trebuie să aibă `nextMonitoringDateISO`, `reopenReason` triggerable, și owner. Cockpit success afișează când va fi reverificat. Dacă nu apare monitoring, userul nu știe dacă e „rezolvat și gata" sau „rezolvat dar expiră".

*Exemplu OK:* „Următoarea revizuire: 90 zile. Drift-uri monitorizate: schimbări pe site, actualizări legislative GDPR."

*Exemplu NU:* success state fără mențiune monitoring.

---

**Regulă de aprobare:** dacă răspunsul la oricare din cele 5 e **NU**, ecranul **NU e client-ready**. Întoarce la design. Aceste 5 întrebări se testează manual în review, nu automat — sunt judgment calls care cer privire umană.

---

# Anexa C — Glossary canonical terms

## C.1 Termeni user-facing (pentru UI, copy, documentație, marketing)

Termenii pe care userul îi vede în produs, pe landing, în email-uri, în suport. **Orice divergență de la această listă e bug de copy.**

| Termen RO | Sens | Unde apare |
|---|---|---|
| **Firmă** | entitatea protejată cu CUI, sector, mărime | nav context banner, Settings → Profil firmă, card portofoliu |
| **Client** | firma din portofoliul contabilului; același obiect ca Firmă dar în contextul partener | portofoliu, livrabile |
| **Patron** | proprietarul/managerul firmei protejate; destinatar, nu user | emails, magic links, trust profile |
| **Contabil** / **Cabinet** | Diana / organizația Diana în calitate de partener | brand cabinet, onboarding partner |
| **Portofoliu** | colecția de firme a contabilului | nav Diana, `/portfolio` |
| **Dosar** | containerul unei firme cu findings rezolvate, dovezi, livrabile, audit trail | nav `/dashboard/dosar`, 4 tab-uri |
| **Dovadă** | ce închide un caz (document, notă, fișier, screenshot, referință) | cockpit success, Dosar → Dovezi |
| **caz** (traducerea user-facing pentru *Finding*) | unitatea de lucru ce trebuie rezolvată | cockpit, `/resolve` „12 cazuri active" |
| **Cockpit** | ecranul unde se execută un caz; niciodată tradus ca „editor" sau „wizard" | `/resolve/[findingId]` |
| **Remediere** | navigation label pentru queue cross-client al Dianei | nav portofoliu |
| **Monitorizare** | starea post-închidere; NU „Watch" / NU „Oversight" | nav, Acasă secțiune |
| **Rapoarte client** | navigation label pentru livrabile per client (Diana) | nav portofoliu |
| **Livrabil** | output extern (audit pack, annex lite, response pack, renewal pack) | Dosar → Pachete, portfolio/reports |
| **Pachet** / **Audit Pack** | tipuri specifice de livrabil | export buttons, Dosar tab Pachete |
| **Trust Profile** | pagina publică de încredere a firmei, brand cabinet | `/trust/[orgId]`, Dosar tab Pachete |
| **Scor** | scorul de conformitate al firmei (0-100) | Acasă KPI, Portofoliu carduri |
| **Alertă** | semnal că ceva s-a schimbat; include drift + legislativ + vendor + review | Monitorizare, feed Acasă |
| **schimbare detectată** (traducerea user-facing pentru *Drift*) | sub-categorie de alertă: dovadă / site / document s-a modificat | copy alertă |
| **ce mi se aplică** (traducerea user-facing pentru *Applicability*) | ce framework-uri + obligații sunt valide pentru firmă | Acasă secțiune, Settings → Profil firmă |

**Reguli de copy:**
- Ton calm autoritar. Nu `Super!`, nu `Felicitări!`, nu emoji, nu `Cu Compli!`.
- Persoana a 2-a singular cu `tu` (nu `dvs.`).
- Disclaimers la acțiuni cu implicații legale — vizibile, scurte, nu ascunse sub fold.

## C.2 Termeni tehnici (pentru dev, Claude Code, CLAUDE.md)

Termenii din cod. **Nu apar în UI.** Apar în type definitions, API contracts, PR descriptions, ADRs.

| Termen tehnic | Sens | Definit în |
|---|---|---|
| **UserMode** | rolul fundamental: `solo` / `partner` / `compliance` / `viewer` | `lib/server/auth.ts` |
| **WorkspaceMode** | context de lucru: `org` (firmă singulară) sau `portfolio` (cross-client, doar partner) | `lib/server/auth.ts` |
| **ApplicabilityTag** | marcă pe un finding: aplicabil / ne-aplicabil / incert / aplicabil-condiționat | `lib/compliance/types.ts` |
| **ApplicabilityMap** | structura salvată post-onboarding: ce framework-uri + articole + obligații se aplică firmei | `supabase/public.org_state.metadata` |
| **SmartResolveExecutionClass** | clasa kernel a finding-ului: `documentary` / `operational` / `specialist_handoff` | `lib/compliscan/finding-kernel.ts` |
| **SpecialistHandoffContract** | structura care declară handoff: modul țintă, params, returnTo, evidenceRequired | `lib/compliscan/finding-kernel.ts` |
| **workflowLink** | URL de handoff din cockpit către modul specialist cu `findingId` + `returnTo` | Cockpit recipes |
| **returnTo** | URL de revenire după handoff, consumat de modul specialist | middleware + modul specialist |
| **GuestAuditorSession** | sesiune temporară read-only pentru auditor extern (distinct de Viewer) | `lib/server/auth.ts` + `guest-auditor-store.ts` |
| **GuestAuditorToken** | magic link single-use care inițializează sesiunea | `guest-auditor-sessions.sql` |
| **PlanGate** | component care decide vizibilitatea nav/button bazat pe plan + capability | `components/compliscan/plan-gate.tsx` |
| **PaywallScope** | `hide` (capability discretă absentă) sau `paywall-on-submit` (cuantitativă la limită) | `plan-gate.tsx` refactored |
| **ReopenReason** | motiv redeschidere: `drift_dovada` / `legislative` / `review_due` / `vendor_flag` / `agent_proposal` | `types.ts` extended S3.T1 |
| **FindingLifecycle** | stări: `pending` → `confirmed` → `in_progress` → `resolved` → `under_monitoring` → (re)opened | kernel |

## C.3 Mapping tehnic → user-facing

Tabela de bază pentru dev-ii care întreabă „cum afișez X în UI?".

| Termen tehnic | User-facing RO | Notă |
|---|---|---|
| `SmartResolveExecutionClass.documentary` | `Document` | badge bleu în cockpit + queue |
| `SmartResolveExecutionClass.operational` | `Acțiune` | badge portocaliu |
| `SmartResolveExecutionClass.specialist_handoff` | `Asistat` | badge violet |
| `Finding` | `caz` | mereu lowercase în propoziție |
| `Finding.severity: critical` | `critic` sau `urgent` | roșu |
| `Finding.severity: high` | `important` | portocaliu |
| `Finding.severity: medium` | `mediu` | galben |
| `Finding.severity: low` | `scăzut` | verde |
| `FindingStatus.pending` | `nou` | |
| `FindingStatus.confirmed` | `confirmat` | |
| `FindingStatus.in_progress` | `în lucru` | |
| `FindingStatus.resolved` | `rezolvat` | |
| `FindingStatus.under_monitoring` | `monitorizat` | |
| `UserMode.solo` | `proprietar / manager` (onboarding), nu apare explicit în UI post-login | |
| `UserMode.partner` | `consultant / contabil` (onboarding) | |
| `UserMode.compliance` | `responsabil conformitate` (onboarding) | |
| `UserMode.viewer` | `observator` (Settings → Team) | |
| `WorkspaceMode.portfolio` | `mod portofoliu` (banner text) | |
| `WorkspaceMode.org` | `context client` (banner text) | |
| `Alert.source: drift_trigger` | `schimbare detectată` | |
| `Alert.source: legislative` | `schimbare legislativă` | |
| `Alert.source: vendor` | `furnizor` | |
| `Alert.source: review_due` | `revizuire scadentă` | |
| `Alert.source: anaf_signal` | `semnal ANAF` | |
| `Evidence.kind: generated_document` | `document generat` | badge |
| `Evidence.kind: operational_note` | `notă` | badge |
| `Evidence.kind: file_upload` | `fișier` | badge |
| `Evidence.kind: external_reference` | `link extern` | badge |
| `Evidence.kind: handoff_artifact` | `rezultat handoff` | badge |
| `ReopenReason.drift_dovada` | `dovada a expirat / s-a schimbat` | copy banner reopen |
| `ReopenReason.legislative` | `schimbare legislativă` | copy banner reopen |
| `ReopenReason.review_due` | `revizuire planificată` | copy banner reopen |
| `ReopenReason.vendor_flag` | `furnizor semnalizat` | copy banner reopen |
| `ReopenReason.agent_proposal` | `propunere agent` | copy banner reopen |
| `GuestAuditorSession` | `sesiune audit extern` | banner + footer watermark |

**Regula de aur:** când scrii cod, folosește termeni C.2. Când scrii UI/email/documentație externă, folosește termeni C.1. Când faci un PR care atinge ambele, specifică explicit în descriere care termen tehnic → user-facing folosești pentru traducere.

---

# Anexa D — Quick-start pentru implementare

Pentru Claude Code sau un dev care preia Sprint 0 mâine dimineață.

## D.1 Ordinea primilor 3 task-uri din Sprint 0

### Task #1 — S0.T1 Workspace banner + toast

Primul task din Sprint 0 (Execution order). Atinge shell, nu routing.

**Fișiere de atins în ordine:**
1. `components/compliscan/workspace-context-banner.tsx` **nou** — componentă care citește `orgName`, `userMode`, `workspaceMode` din `useDashboardRuntime` și afișează banner cu copy din S0.T1 acceptance.
2. `components/compliscan/dashboard-shell.tsx` — adaugă slot pentru banner între `<TopBar />` și `<main>`. Importă `WorkspaceContextBanner`.
3. `components/compliscan/portfolio-shell.tsx` — identic, banner în shell partener.
4. `components/compliscan/workspace-mode-switcher.tsx` — adaugă `toast.success('Context {orgName} activ', { duration: 1500 })` după success `/api/auth/switch-org`.

**Verify:** `npm run dev`, login partner, navighează `/portfolio` → click client → banner schimbă text + toast 1.5s.

**E2E test:** în `tests/e2e/workspace-context.spec.ts` nou, Playwright script: login partner, navigate to `/portfolio`, click first client card, expect banner text to contain both orgName and cabinetName.

### Task #2 — S0.T2 DestructiveConfirmDialog

**Dep:** S0.T1 (banner expune `orgName` pe care dialog-ul îl citește).

**Fișiere:**
1. `components/evidence-os/DestructiveConfirmDialog.tsx` **nou** — componentă generică cu props `actionTitle`, `orgName`, `evidenceSummary`, `impactScope`, `onConfirm`, `onCancel`. Keyboard: ESC = cancel, Enter = confirm.
2. `components/compliscan/finding-cockpit-shared.tsx` — wrap 3 call sites:
   - `FindingHeroAction` close caz (nume firmă bold + evidence summary)
   - `FindingCaseClosedCard` reopen (nume firmă + reopen reason preview)
   - `DocumentAdoptionCard` approve (nume firmă + doc title)
3. `app/dashboard/resolve/[findingId]/page.tsx` — wrap `Resolve risk`, `Send to dossier`, `Trimite spre aprobare patron` cu DestructiveConfirmDialog.

**Verify:** 3 findings distincte, pe fiecare ruleaza acțiunea destructive → dialog apare cu nume firmă bold.

### Task #3 și #4 (paralel) — S0.T3 Middleware redirect + S0.T4 Delete zombie

**Paralel** (independent). Recomand la dev-ul singur: începe cu T3 (middleware), pentru că T4 (delete filesystem) validat de T3.

**S0.T3 middleware:**
1. `middleware.ts` — adaugă constante cu redirect map din Anexa A.1-A.4. Folosește `NextResponse.redirect(url, 301)`.
2. `middleware.test.ts` — 22+ teste, minim 1 per rută, verificând status 301 + Location + query preserved.

**Verify:** `npm run test middleware`; curl local: `curl -I http://localhost:3000/dashboard/findings` → 301 + Location `/dashboard/resolve`.

**S0.T4 delete:**
1. Șterge fizic directoarele listate în S0.T4 fișiere.
2. `npm run build` — trebuie să treacă.
3. `grep -rn "dashboard/findings\|dashboard/rapoarte\|dashboard/setari" app components lib` — 0 rezultate active (doar comentarii/tests marcate legacy).

## D.2 Setup mediu de lucru

**Branch strategy:**
- `main` = producție
- `sprint-0-ia-v2` = toate task-urile Sprint 0 se strâng aici
- `s0-t1-banner`, `s0-t2-confirm`, etc. = feature branches per task, PR în `sprint-0-ia-v2`
- La închiderea Sprint 0 DoD verde, `sprint-0-ia-v2` → `main` cu commit anchor SHA pentru rollback.

**Env vars la deploy Sprint 0:**
```
NEXT_PUBLIC_IA_V2_ROUTING=false
```
(activează la flip după 72h smoke test conform procedurii 7.3)

**Development checklist pentru fiecare PR:**
- [ ] Ref-uri în PR description către item din Secțiunea 6 + principii relevante
- [ ] Anexa B checklist 5-întrebări pentru ecrane noi/modificate
- [ ] Unit/E2E tests pass
- [ ] Grep check pentru cleanup (rute moarte, copy interzis, batch execute)
- [ ] Banner + context switch nu se rup (test manual 3 sesiuni)

## D.3 Cum să citești restul documentului

- **Secțiunea 1 (Ce am înțeles)** — context. Citește o dată la onboarding.
- **Secțiunea 2 (Principii)** — referință. Când ai dubii pe design, citește iar.
- **Secțiunea 3 (IA)** — singura sursă de adevăr pentru rute + nav. Copiază din tabelele 3.3 și 3.4 în cod.
- **Secțiunea 4 (Flows)** — scenarii de test. Playwright E2E le mapează 1:1.
- **Secțiunea 5 (Ce moare)** — liste negative. Verifică înainte de merge.
- **Secțiunea 6 (Ce se construiește)** — spec componente noi. Implementare.
- **Secțiunea 7 (Plan migrare)** — execuție. Task-urile S0-S3 ordinea + DoD.
- **Anexa A** — redirect truth table pentru tests.
- **Anexa B** — PR review checklist.
- **Anexa C** — termeni canonici, nu divergă.
- **Anexa D** — tu ești aici.

**După Sprint 3 DoD verde: v1 e launch-ready.**

---

*Sfârșitul documentului. Autorizez execuția Sprint 0.*

