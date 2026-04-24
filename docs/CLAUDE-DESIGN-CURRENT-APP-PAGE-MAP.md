# CLAUDE-DESIGN-CURRENT-APP-PAGE-MAP.md

Status: `design handoff source of truth`
Date: `2026-04-22`
Repo snapshot: `preview/integration-2026-04-21`
Audience: `Claude Design / orice model care trebuie sa redeseneze CompliAI fara sa piarda functionalitate`

---

## 1. Ce este acest document

Acesta este documentul care trebuie dat unui model extern de design daca vrem:

- UI nou
- IA noua / shell nou
- page-level redesign
- zero pierdere de feature parity

Nu este un simplu brief de brand sau de UX direction.

Este un **map exact al paginilor reale din aplicatie**, al suprafetelor folosite azi si al functionalitatilor care trebuie pastrate cand se redeseneaza produsul.

Acest document completeaza:

- `docs/DESTINATION.md`
- `docs/IA-TARGET-DIAGRAM.md`
- `docs/DESIGN-BRIEF.md`
- `docs/STATE-NOW.md`

Regula critica:

- daca exista conflict intre un document vechi si codul curent, **castiga codul curent pentru feature parity**
- daca exista conflict intre shell-ul actual si canonul nou, **Claude Design trebuie sa redeseneze in directia canonului nou, dar fara sa piarda flows-urile reale existente azi**

---

## 2. Cum trebuie folosit de Claude Design

Claude Design trebuie sa faca:

- redesign de UI
- redesign de shell
- reorganizare vizuala pe noua IA
- densitate mai buna pentru Diana / partner mode
- claritate mai buna pentru Mihai / solo

Claude Design NU are voie sa faca:

- sa elimine pagini sau flows doar pentru ca par “legacy”
- sa taie actiuni secundare fara sa le remapeze explicit
- sa transforme functii reale in simple carduri decorative
- sa inventeze suprafete care ignora route-urile reale si feature-urile existente

Design brief corect:

- **redeseneaza produsul pe IA noua**
- **pastreaza functionalitatea reala din aplicatie**
- **foloseste acest document ca mapa exacta a paginilor si continutului lor**

---

## 3. Snapshot rece al aplicatiei acum

Acest repo contine in acest moment:

- `68` pagini `page.tsx`
- `198` fisiere API `route.ts`
- `93` fisiere top-level in `components/compliscan/*`
- `11` primitive DS in `components/ui/ds/*`

Observatii importante:

- runtime-ul vizual real inca foloseste mult `components/evidence-os/*`
- DS-ul nou exista, dar nu este adoptat complet peste tot
- shell-ul si IA sunt in tranzitie intre live vechi si canonul nou din `DESTINATION`
- unele rute sunt canonice noi
- altele sunt inca bridge / redirect / deep-link legacy

---

## 4. Adevarul de produs pe care designul trebuie sa-l respecte

### 4.1 Mode-uri reale

Aplicatia are 4 moduri de utilizare:

- `partner`
- `compliance`
- `solo`
- `viewer`

### 4.2 Doua contexte reale

- `portfolio` = cross-client, folosit mai ales de Diana
- `org` = per-firma, folosit pentru executie

### 4.3 Cele 3 suprafete care vand produsul

Acestea trebuie tratate ca suprafete de top in redesign:

1. `Inbox cross-portfolio`
2. `Client drill-in`
3. `Cockpit / remediere / export / dovada`

### 4.4 Principiul de redesign

Redesignul nu trebuie sa faca produsul “mai simplu” prin taiere de putere.

Trebuie sa-l faca:

- mai coerent
- mai dens
- mai calm
- mai usor de operat
- mai clar in ierarhie

dar cu **aceeasi putere functionala sau mai buna**.

---

## 5. Ordinea surselor de adevar

Pentru orice decizie de redesign:

1. `Codul curent al paginii`
2. `Acest document`
3. `docs/DESTINATION.md`
4. `docs/IA-TARGET-DIAGRAM.md`
5. `docs/DESIGN-BRIEF.md`
6. `docs/STATE-NOW.md`

Cand ceva nu apare in brief dar exista in pagina reala, se considera feature de pastrat pana cand este explicit eliminat.

---

## 6. Route families si ce inseamna ele

### 6.1 Public / auth / legal

Aceste pagini sunt publice sau de acces:

- `/`
- `/login`
- `/register`
- `/reset-password`
- `/pricing`
- `/privacy`
- `/terms`
- `/dpa`
- `/claim`
- `/onboarding`
- `/onboarding/finish`
- `/demo/[scenario]`
- `/shared/[token]`
- `/trust`
- `/trust/[orgId]`
- `/whistleblowing/[token]`
- `/genereaza-dpa`
- `/genereaza-politica-gdpr`

### 6.2 Partner portfolio

Aceste pagini sunt suprafetele cross-client:

- `/portfolio`
- `/portfolio/alerts`
- `/portfolio/client/[orgId]`
- `/portfolio/tasks`
- `/portfolio/vendors`
- `/portfolio/reports`

### 6.3 Org workspace primary

Aceste pagini sunt nucleul per-firma:

- `/dashboard`
- `/dashboard/scan`
- `/dashboard/scan/history`
- `/dashboard/scan/results/[scanId]`
- `/dashboard/actiuni/remediere`
- `/dashboard/actiuni/remediere/[findingId]`
- `/dashboard/monitorizare/conformitate`
- `/dashboard/monitorizare/alerte`
- `/dashboard/monitorizare/sisteme-ai`
- `/dashboard/monitorizare/sisteme-ai/eu-db-wizard`
- `/dashboard/monitorizare/nis2`
- `/dashboard/monitorizare/nis2/eligibility`
- `/dashboard/monitorizare/nis2/governance`
- `/dashboard/monitorizare/nis2/inregistrare-dnsc`
- `/dashboard/monitorizare/nis2/maturitate`
- `/dashboard/reports`
- `/dashboard/reports/policies`
- `/dashboard/reports/vault`
- `/dashboard/reports/trust-center`
- `/dashboard/reports/audit-log`
- `/dashboard/documente`
- `/dashboard/setari`
- `/dashboard/setari/abonament`
- `/dashboard/setari/scheduled-reports`

### 6.4 Org workspace secondary / deep workflows

Aceste pagini nu sunt toate primare in IA noua, dar sunt reale si trebuie mapate in redesign:

- `/dashboard/approvals`
- `/dashboard/calendar`
- `/dashboard/checklists`
- `/dashboard/dora`
- `/dashboard/dosar`
- `/dashboard/dsar`
- `/dashboard/fiscal`
- `/dashboard/generator`
- `/dashboard/pay-transparency`
- `/dashboard/review`
- `/dashboard/ropa`
- `/dashboard/vendor-review`
- `/dashboard/whistleblowing`
- `/dashboard/agents`
- `/dashboard/actiuni/remediere/support`

### 6.5 Bridge / redirect / compatibility pages

Acestea exista, dar nu trebuie tratate ca suprafete independente noi:

- `/register` -> redirect spre login mode register
- `/dashboard/actiuni/politici` -> redirect spre `/dashboard/reports/policies`
- `/dashboard/findings/[id]` -> redirect spre `/dashboard/actiuni/remediere/[findingId]`
- `/dashboard/partner`
- `/dashboard/partner/[orgId]`

Aceste bridge routes trebuie considerate compatibilitate, nu centre de design.

---

## 7. Exact page map pentru Claude Design

Mai jos este mapa paginilor folosite efectiv in aplicatie, grupate pe zone. Pentru fiecare pagina, conteaza:

- ruta
- fisierul real
- continutul actual
- actiunile cheie
- ce nu ai voie sa pierzi in redesign

## 7A. Public / auth / legal

| Route | File | Ce este | Ce contine azi | Ce trebuie pastrat |
|---|---|---|---|---|
| `/` | `app/page.tsx` | landing page | hero, explicarea fluxului “snapshot -> rezolvi -> dosar”, CTA-uri de produs | narativul de produs si CTA spre trial / login / pricing |
| `/login` | `app/login/page.tsx` | login + register mode | form auth, erori, handoff spre register/reset | auth clar, feedback erori |
| `/register` | `app/register/page.tsx` | redirect de compatibilitate | redirect la `/login?mode=register` | compatibilitate link-uri vechi |
| `/reset-password` | `app/reset-password/page.tsx` | reset parola | formular reset, state de eroare/succes | flow complet reset |
| `/pricing` | `app/pricing/page.tsx` | pricing page | planuri, mesaje pe personas | planurile si CTA-urile comerciale |
| `/privacy` | `app/privacy/page.tsx` | legal public | politica de confidentialitate | continut legal |
| `/terms` | `app/terms/page.tsx` | legal public | termeni si conditii | continut legal |
| `/dpa` | `app/dpa/page.tsx` | legal public | acord de prelucrare a datelor | continut legal |
| `/claim` | `app/claim/page.tsx` | ownership claim flow | acceptare / revendicare ownership firma | flow de claim intact |
| `/onboarding` | `app/onboarding/page.tsx` | onboarding principal | redirect inteligent dupa user mode si completare org setup | modul de intrare in produs |
| `/onboarding/finish` | `app/onboarding/finish/page.tsx` | final onboarding | redirect spre destinatia corecta dupa user mode | inchidere onboarding |
| `/demo/[scenario]` | `app/demo/[scenario]/page.tsx` | demo loader | scenarii demonstrative | demo flows |
| `/shared/[token]` | `app/shared/[token]/page.tsx` | dosar partajat public | view read-only pe dosar / documente / pachet | share flow extern |
| `/trust` | `app/trust/page.tsx` | trust landing | trust center general, subprocesori, DPA, AI disclosure | suprafata de incredere publica |
| `/trust/[orgId]` | `app/trust/[orgId]/page.tsx` | trust center per org | trust profile public pe firma | share public per client |
| `/whistleblowing/[token]` | `app/whistleblowing/[token]/page.tsx` | public whistleblowing submit | formular public cu categorii, anonimitate, contact info | submit public complet |
| `/genereaza-dpa` | `app/genereaza-dpa/page.tsx` | lead magnet / free generator | generator DPA public | flow complet generator |
| `/genereaza-politica-gdpr` | `app/genereaza-politica-gdpr/page.tsx` | lead magnet / free generator | generator politica GDPR public | flow complet generator |

## 7B. Partner portfolio pages

| Route | File / Surface | Ce contine azi | Actiuni cheie | Ce trebuie pastrat obligatoriu |
|---|---|---|---|---|
| `/portfolio` | `app/portfolio/page.tsx` -> `components/compliscan/portfolio-overview-client.tsx` | overview cross-client, KPI-uri, lista firme, search, sort, bulk selection, quick add, CSV import, diagnostic export, trust link, delete client, plan gate | adauga client, import CSV, bulk actions, export diagnostic, open trust profile, intra in client | view agregat pe clienti, quick-add, import wizard, bulk select, actions per client |
| `/portfolio/alerts` | `app/portfolio/alerts/page.tsx` -> `components/compliscan/portfolio-alerts-page.tsx` | inbox cross-client, top priorities rail, grouped by day, select multiple, sticky bulk bar, filtre | batch confirm / dismiss / generate, open client drill-in, triage rapid | feed unic cross-client, top 3 prioritati, bulk actions, grouping, selection |
| `/portfolio/client/[orgId]` | `app/portfolio/client/[orgId]/page.tsx` -> `components/compliscan/client-context-panel.tsx` | context client, score, findings list, focused finding from inbox, NIS2 snapshot, vendor review snapshot, quick actions, export diagnostic, trust profile, enter workspace | intra in workspace org, deschide finding in cockpit, quick portfolio actions, export | context preservation din portfolio, focused finding, bridge clar catre org workspace |
| `/portfolio/tasks` | `app/portfolio/tasks/page.tsx` -> `components/compliscan/portfolio-tasks-page.tsx` | task-uri cross-client, grupare, selectie, batch action modal | batch draft / batch generation / filtrare | vedere task-uri agregate si actiuni bulk |
| `/portfolio/vendors` | `app/portfolio/vendors/page.tsx` -> `components/compliscan/portfolio-vendors-page.tsx` | registru furnizori agregat, dedupat | browse si analiza furnizori comuni | vendor registry cross-client |
| `/portfolio/reports` | `app/portfolio/reports/page.tsx` -> `components/compliscan/portfolio-reports-page.tsx` | rapoarte portofoliu, scheduled reports, white-label config | gestioneaza branding, rapoarte programate, export batch | white-label + scheduled reports + portfolio reports |

## 7C. Org primary pages

| Route | File / Surface | Ce contine azi | Actiuni cheie | Ce trebuie pastrat obligatoriu |
|---|---|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | home per-firma, cockpit summary, score/readiness, next actions, activity, key modules | open scan, open remediere, continue workflows | dashboard home per org cu next-best-action |
| `/dashboard/scan` | `app/dashboard/scan/page.tsx` -> `components/compliscan/scan-page.tsx` | scan workspace, upload document/text/yaml/manifest, site scan, autodiscovery, active findings nudge, link to history | run extraction, site scan, continue to remediere | toate sursele de scanare si continuation spre findings |
| `/dashboard/scan/history` | `app/dashboard/scan/history/page.tsx` -> `components/compliscan/scan-history-page.tsx` | istoric scanari | reopen / inspect results | scan history |
| `/dashboard/scan/results/[scanId]` | `app/dashboard/scan/results/[scanId]/page.tsx` | rezultate scan, findings pe severitate, resolution steps, recent scans | inspect findings, jump to resolve | rezultat scan complet, nu doar summary |
| `/dashboard/actiuni/remediere` | `app/dashboard/actiuni/remediere/page.tsx` -> `components/compliscan/resolve-page.tsx` | finding queue, urgency queue, status tabs, framework tabs, severity filters, search, orphan feature quick-nav | choose finding, filter by framework/status, open cockpit | lista operationala de remediere cu filtrare serioasa |
| `/dashboard/actiuni/remediere/[findingId]` | `app/dashboard/actiuni/remediere/[findingId]/page.tsx` | Smart Resolve Cockpit actual: context, guidance, evidence, generator hooks, review cycles, finding state transitions, many return flows | mark resolved / false positive / validated, attach evidence, generate docs, program review, return from related workflows | cockpitul complet; este o pagina critica si nu are voie sa piarda nicio sub-actiune |
| `/dashboard/monitorizare/conformitate` | `app/dashboard/monitorizare/conformitate/page.tsx` | framework hub: AI Act inline assessment, handoff clar spre GDPR / e-Factura / DORA / Pay Transparency flows mature | switch framework, run inline AI actions, handoff to mature pages | hub per framework cu rail si handoff clar |
| `/dashboard/monitorizare/alerte` | `app/dashboard/monitorizare/alerte/page.tsx` | drifts, alerts list, pillar tabs, links to remediere/reports | inspect alerts, jump to resolve, review drifts | monitoring / drift page |
| `/dashboard/monitorizare/sisteme-ai` | `app/dashboard/monitorizare/sisteme-ai/page.tsx` | AI systems workspace: overview, inventory, discovery, drift, review, shadow AI section | add/confirm systems, review shadow AI, baseline/drift/review switching | discovery + inventory + drift + review trebuie sa ramana impreuna |
| `/dashboard/monitorizare/sisteme-ai/eu-db-wizard` | `app/dashboard/monitorizare/sisteme-ai/eu-db-wizard/page.tsx` | EU database submission prep wizard, system details, provider/deployment, generated payload | prepare submission draft | wizard dedicat pentru EU DB |
| `/dashboard/monitorizare/nis2` | `app/dashboard/monitorizare/nis2/page.tsx` | NIS2 workspace: intro, DNSC linkouts, rescue banner, maturity card, assessment tab, incidents tab, vendors tab | complete assessment, log incidents, manage vendors, open eligibility | NIS2 ramane workspace complet, nu simplu card |
| `/dashboard/monitorizare/nis2/eligibility` | `app/dashboard/monitorizare/nis2/eligibility/page.tsx` | eligibility wizard cu returnTo/sourceFinding | save eligibility, return to finding or NIS2 | wizard dedicat |
| `/dashboard/monitorizare/nis2/governance` | `app/dashboard/monitorizare/nis2/governance/page.tsx` | governance members, inline training/certification, create/delete members | manage governance record | subflow dedicat NIS2 governance |
| `/dashboard/monitorizare/nis2/inregistrare-dnsc` | `app/dashboard/monitorizare/nis2/inregistrare-dnsc/page.tsx` | DNSC registration status, number, correspondence log, export PDF | save status, save number, add/delete correspondence, export | registration workflow si jurnalul DNSC |
| `/dashboard/monitorizare/nis2/maturitate` | `app/dashboard/monitorizare/nis2/maturitate/page.tsx` | maturity scores pe domenii, link back to NIS2 | inspect maturity breakdown | maturity detail |
| `/dashboard/reports` | `app/dashboard/reports/page.tsx` -> `components/compliscan/reports-page.tsx` | export center, response pack, counsel brief, share token, generated docs, snapshot status, trust center / audit log links | generate / download reports, create share token | export center real, nu simpla pagina de PDF-uri |
| `/dashboard/reports/policies` | `app/dashboard/reports/policies/page.tsx` -> `components/compliscan/reports-policies-page.tsx` | policies workspace | browse / generate / review policies | politica/document workspace |
| `/dashboard/reports/vault` | `app/dashboard/reports/vault/page.tsx` -> `components/compliscan/reports-vault-page.tsx` | audit pack readiness, traceability, compliance pack, audit pack, ANSPDCP export, bundle export | download packs / inspect blockers | vault/export readiness este critic si trebuie pastrat complet |
| `/dashboard/reports/trust-center` | `app/dashboard/reports/trust-center/page.tsx` -> `components/compliscan/reports-trust-center-page.tsx` | trust-center management | configure/share trust outputs | trust center intern |
| `/dashboard/reports/audit-log` | `app/dashboard/reports/audit-log/page.tsx` -> `components/compliscan/reports-audit-log-page.tsx` | audit log/report trail | inspect audit events | audit trail vizibil |
| `/dashboard/documente` | `app/dashboard/documente/page.tsx` -> `components/compliscan/documents-page.tsx` | generated docs + scanned archive, prepared packs HR/contracts, return-to-cockpit flow | generate/download packs, return into cockpit | document hub, especially for solo |
| `/dashboard/setari` | `app/dashboard/setari/page.tsx` -> `components/compliscan/settings-page.tsx` | settings summary, visible tabs by role/mode, members, white-label, autonomy, alerts prefs, health/readiness, repo sync, billing summary | manage members, claim invite, white-label, autonomy, alerts prefs | settings e foarte dens si nu trebuie simplificat excesiv |
| `/dashboard/setari/abonament` | `app/dashboard/setari/abonament/page.tsx` -> `components/compliscan/settings-billing-page.tsx` | billing page | billing management | billing subpage |
| `/dashboard/setari/scheduled-reports` | `app/dashboard/setari/scheduled-reports/page.tsx` -> `components/compliscan/scheduled-reports-manager.tsx` | scheduled reports manager | CRUD scheduled reports | scheduled reports |

## 7D. Org secondary and specialist pages

| Route | File / Surface | Ce contine azi | Ce trebuie pastrat |
|---|---|---|---|
| `/dashboard/approvals` | `app/dashboard/approvals/page.tsx` -> `components/compliscan/approvals-page.tsx` | approval queue, detail panel, approve/reject, filters | approval workflow end-to-end |
| `/dashboard/calendar` | `app/dashboard/calendar/page.tsx` | grouped calendar events, links to review cycles, reports, scan, resolve | event grouping + route handoff |
| `/dashboard/checklists` | `app/dashboard/checklists/page.tsx` | remediation board, pillar tabs, summary strip, handoff to vault/reports/scan | checklist board ca suprafata reala |
| `/dashboard/dora` | `app/dashboard/dora/page.tsx` | DORA intro, incident log, TPRM list/forms | DORA incident + vendor risk flows |
| `/dashboard/dosar` | `app/dashboard/dosar/page.tsx` -> `components/compliscan/dosar-page.tsx` | audit dossier surface | dosar / dossier workflow |
| `/dashboard/dsar` | `app/dashboard/dsar/page.tsx` | DSAR list, create/edit/delete, draft response, org prefill, calendar handoff | DSAR full CRUD + draft flow |
| `/dashboard/fiscal` | `app/dashboard/fiscal/page.tsx` | e-Factura validator, repair, signals, discrepancies, filing records, SPV check, submit SPV | fiscal workspace complet |
| `/dashboard/generator` | `app/dashboard/generator/page.tsx` | long-form document generator, context forms, finding confirmation items, copy/download/attach evidence | generator complex, nu doar drawer minimal |
| `/dashboard/pay-transparency` | `app/dashboard/pay-transparency/page.tsx` -> `components/compliscan/pay-transparency-page.tsx` | pay transparency workspace cu intro | pay transparency flow |
| `/dashboard/review` | `app/dashboard/review/page.tsx` -> `components/compliscan/review-cycles-page.tsx` | review cycles page | scheduled reviews |
| `/dashboard/ropa` | `app/dashboard/ropa/page.tsx` | ROPA generator/editor cu categorii, legal basis, retention, security, cockpit context | ROPA full workflow |
| `/dashboard/vendor-review` | `app/dashboard/vendor-review/page.tsx` | vendor assessment, DPA URL, vendor evidence/review | vendor review complet |
| `/dashboard/whistleblowing` | `app/dashboard/whistleblowing/page.tsx` | whistleblowing admin, public token/public URL, internal notes, case updates | public channel + internal case admin |
| `/dashboard/agents` | `app/dashboard/agents/page.tsx` | AI agents / automations / explanatory cards | agent workspace existent |
| `/dashboard/actiuni/remediere/support` | `app/dashboard/actiuni/remediere/support/page.tsx` -> `components/compliscan/resolve-page.tsx` | support view asociat remediere | parity cu resolve support mode |

## 7E. Bridge / redirect / compatibility pages

| Route | File | Ce face | Cum trebuie tratata in redesign |
|---|---|---|---|
| `/dashboard/actiuni/politici` | `app/dashboard/actiuni/politici/page.tsx` | redirect la `/dashboard/reports/policies` | compatibilitate, nu pagina noua |
| `/dashboard/findings/[id]` | `app/dashboard/findings/[id]/page.tsx` | redirect la cockpit | compatibilitate deep-link |
| `/dashboard/partner` | `app/dashboard/partner/page.tsx` | bridge spre workspace legacy | poate ramane bridge |
| `/dashboard/partner/[orgId]` | `app/dashboard/partner/[orgId]/page.tsx` | bridge spre workspace legacy | poate ramane bridge |

---

## 8. Exact current navigation reality

Claude Design trebuie sa stie diferenta dintre:

- **pagini existente**
- **pagini in nav**
- **pagini secundare / deep links**

### 8.1 Ce trebuie tratat ca primary navigation

Pentru partner:

- `Portfolio`
- `Alerts`
- `Tasks`
- `Vendors`
- `Reports`
- apoi per-org:
  - `Acasa`
  - `Scaneaza`
  - `Monitorizare`
  - `Actiuni`
  - `Rapoarte`
  - `Setari`

Pentru compliance:

- `Acasa`
- `Scaneaza`
- `Monitorizare`
- `Actiuni`
- `Rapoarte`
- `Setari`

Pentru solo:

- `Acasa`
- `Scaneaza`
- `De rezolvat`
- `Documente`
- `Rapoarte`
- `Setari`

### 8.2 Ce NU trebuie tratat ca top-level primary nav

Acestea sunt pagini reale, dar nu trebuie sa devina toate top-level:

- `calendar`
- `review`
- `approvals`
- `generator`
- `vendor-review`
- `dsar`
- `dora`
- `ropa`
- `fiscal`
- `whistleblowing`
- `agents`
- `scan/history`
- `scan/results/[scanId]`
- `eu-db-wizard`
- `nis2/governance`
- `nis2/inregistrare-dnsc`
- `nis2/maturitate`

Acestea sunt **subflows sau specialist workspaces**, nu prima informatie din shell.

---

## 9. API families care sustin paginile

Designul nu trebuie sa inventeze UI care cere API-uri inexistente sau care ascunde API-uri deja foarte puternice.

Snapshot pe familii:

| API family | Count |
|---|---:|
| `cron` | 16 |
| `auth` | 16 |
| `nis2` | 14 |
| `partner` | 12 |
| `exports` | 10 |
| `portfolio` | 8 |
| `integrations` | 8 |
| `fiscal` | 8 |
| `reports` | 7 |
| `dashboard` | 5 |

Familiile relevante direct pentru design parity:

- `auth/*`
- `portfolio/*`
- `partner/*`
- `dashboard/*`
- `findings/*`
- `reports/*`
- `exports/*`
- `documents/*`
- `nis2/*`
- `ai-systems/*`
- `ai-conformity`
- `efactura/*`
- `vendor-review/*`
- `dsar/*`
- `whistleblowing/*`
- `settings/*`
- `review-cycles/*`
- `approvals/*`

---

## 10. Cross-page patterns care trebuie pastrate

Acestea sunt pattern-uri de produs, nu doar componente:

### 10.1 Workspace switching

- partner poate intra din portfolio in org
- org context trebuie pastrat
- client drill-in trebuie sa poata deschide cockpit-ul corect

### 10.2 Bulk actions

Exista deja in:

- `/portfolio`
- `/portfolio/alerts`
- `/portfolio/tasks`

Designul nou trebuie sa le faca mai clare, nu sa le ascunda.

### 10.3 Evidence / document attachment

Cockpitul si generatorul sunt legate de:

- `findings`
- `documents`
- `reports/vault`
- `review cycles`

### 10.4 Empty / loading / error states

Multe pagini folosesc deja:

- `LoadingScreen`
- `ErrorScreen`
- `EmptyState`
- `PageIntro`

Claude Design trebuie sa unifice aceste stari, nu sa le elimine.

### 10.5 Generated outputs

Produsul genereaza sau exporta deja:

- diagnostic PDF
- audit pack
- audit pack bundle
- ANSPDCP pack
- vendor trust pack
- response pack
- annex lite
- trust center outputs
- share token
- counsel brief
- compliance exports

Acestea trebuie sa ramana vizibile si actionabile.

### 10.6 Mature specialist workspaces

Acestea exista deja si nu trebuie reduse la “links laterale”:

- fiscal
- vendor review
- NIS2
- DSAR
- ROPA
- whistleblowing
- DORA

---

## 11. Ce trebuie sa livreze Claude Design

### 11.1 Output dorit

Claude Design trebuie sa produca:

- noul shell complet
- noua ierarhie vizuala
- redesign pentru toate paginile primare
- design direction pentru paginile secundare
- state design pentru loading / empty / error / bulk / filters / details
- grid / spacing / typography / badge / severity system

### 11.2 Regula de fidelitate

Claude Design trebuie sa poata spune pentru fiecare pagina:

- ce pastreaza 1:1
- ce reorganizeaza
- ce muta in alta pagina
- ce devine subflow
- ce ramane deep-link / page dedicated

### 11.3 Nu are voie sa omita aceste pagini critice

Acestea trebuie desenate explicit:

- `/portfolio`
- `/portfolio/alerts`
- `/portfolio/client/[orgId]`
- `/dashboard`
- `/dashboard/scan`
- `/dashboard/actiuni/remediere`
- `/dashboard/actiuni/remediere/[findingId]`
- `/dashboard/monitorizare/conformitate`
- `/dashboard/monitorizare/sisteme-ai`
- `/dashboard/monitorizare/nis2`
- `/dashboard/reports`
- `/dashboard/reports/vault`
- `/dashboard/documente`
- `/dashboard/setari`

### 11.4 Pagini secundare care trebuie macar mapate

Acestea nu pot fi ignorate:

- `/dashboard/fiscal`
- `/dashboard/vendor-review`
- `/dashboard/dsar`
- `/dashboard/ropa`
- `/dashboard/whistleblowing`
- `/dashboard/dora`
- `/dashboard/calendar`
- `/dashboard/review`
- `/dashboard/approvals`
- `/dashboard/scan/results/[scanId]`
- `/dashboard/monitorizare/nis2/eligibility`
- `/dashboard/monitorizare/nis2/governance`
- `/dashboard/monitorizare/nis2/inregistrare-dnsc`
- `/dashboard/monitorizare/nis2/maturitate`
- `/dashboard/monitorizare/sisteme-ai/eu-db-wizard`

---

## 12. Prompt guidance pentru Claude Design

Daca acest document este dat direct la Claude Design, instructiunea buna este:

> Redesign CompliAI pe noua IA si pe noul shell, dar pastreaza exact functionalitatea reala existenta in repo-ul actual. Foloseste `docs/DESTINATION.md` si `docs/IA-TARGET-DIAGRAM.md` pentru directia canonica, dar foloseste `docs/CLAUDE-DESIGN-CURRENT-APP-PAGE-MAP.md` ca mapa exacta a paginilor reale, a continutului lor si a flow-urilor care trebuie pastrate. Nu elimina pagini sau actiuni doar pentru ca par legacy; remapeaza-le explicit. Prioritizeaza suprafetele P1, dar acopera si paginile secundare si specialist workflows.

---

## 13. Concluzie

Acesta nu este doar un redesign brief.

Este mapa completa a aplicatiei asa cum exista acum, suficient de exacta incat un model de design sa poata:

- redesena shell-ul
- redesena paginile
- pastra toate functionalitatile importante
- nu rata paginile ascunse sau dense
- nu confunda canonul de destinatie cu starea actuala a produsului

Pentru orice redesign serios, acest document trebuie folosit impreuna cu:

- `docs/DESTINATION.md`
- `docs/IA-TARGET-DIAGRAM.md`
- `docs/DESIGN-BRIEF.md`

Dar pentru **feature parity real**, acesta este documentul care conteaza.

