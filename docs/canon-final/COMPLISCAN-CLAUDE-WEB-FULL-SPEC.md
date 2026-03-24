# CompliScan — Full App Spec for Claude Web

Status: `context handoff snapshot`
Date: `2026-03-23`
Repo: `CompliAI`
Scope: produs, UX/IA/UI, functionalitati, arhitectura, AI, automatizari, API, model de date, limitari reale.

## 1. Ce este acest document

Acesta este un document unic, pregatit special ca sa poata fi dat unui alt model extern, cum ar fi Claude Web, ca sa inteleaga rapid si corect ce este CompliScan, ce face, cum este structurata aplicatia si unde sunt limitele reale ale implementarii curente.

Documentul este construit din:

- codul real din `app/`, `components/`, `lib/`
- canonul operational din `public/`
- canonul UX/portfolio din `docs/canon-final/`
- configurarea reala a automatizarilor din `vercel.json`

Regula importanta:

- cand exista conflict intre documente vechi si codul real, castiga codul real
- cand exista conflict intre comentarii vechi din route-uri si `vercel.json`, castiga `vercel.json`
- cand exista conflict intre UX vechi si canonul nou, castiga shell-ul nou + documentele canon finale

## 2. Ce este CompliScan, pe scurt

CompliScan este un workspace de conformitate asistata de AI pentru organizatii din Romania si pentru consultanti care gestioneaza mai multe firme.

Acopera in principal:

- GDPR
- EU AI Act
- NIS2
- e-Factura / ANAF
- semnale fiscale si operationale conexe

Promisiunea produsului este:

- afli ce ti se aplica
- scanezi sursele relevante
- intelegi ce este gresit
- transformi problemele in task-uri si dovezi
- exporti livrabile pentru audit, client sau control

Aplicatia nu este construita ca motor de verdict juridic final.

Reguli de produs care nu trebuie incalcate:

- nu spune niciodata `100% compliant`
- nu promite conformitate finala automata
- validarea umana ramane obligatorie
- produsul ofera structura, detectie, prioritizare, drafturi si dovezi
- omul confirma, publica, semneaza, transmite si decide oficial

## 3. Modelul conceptual al produsului

Fluxul canonic de baza este:

`sursa -> verdict -> remediere -> dovada -> audit`

In limbaj de produs intern, asta inseamna:

- `Scanare`
- `Control`
- `Dovada`

In IA-ul nou vizibil in shell, asta este simplificat pentru utilizator in:

- `Acasa`
- `Scaneaza`
- `De rezolvat`
- `Rapoarte`
- `Setari`

Important:

- shell-ul vizibil este simplificat
- modelul operational din spate ramane mai bogat
- de aceea exista inca rute avansate sau legacy care continua sa existe in runtime

## 4. Adevaruri tari pentru orice model care vrea sa imbunatateasca produsul

Nu trebuie schimbate fara o decizie explicita de produs:

1. Separarea dintre `portfolio` si `org workspace`.
2. Obligatia de human review.
3. Vocabularul de baza:
   - `Scaneaza`
   - `De rezolvat`
   - `Rapoarte`
   - `Setari`
4. Distinctia dintre:
   - orientare
   - executie
   - read-only
5. Faptul ca `Portofoliu` este cross-client, iar `/dashboard` este per-firma.
6. Faptul ca `components/evidence-os/*` este sistemul vizual activ.
7. Faptul ca unele route-uri vechi exista inca si nu trebuie confundate cu IA canonica.

## 5. Stale spots si conflicte detectate in repo

Acestea sunt importante pentru un model extern, ca sa nu se bazeze pe surse depasite:

- unele audituri vechi spun `111` API routes; inventarul actual din repo arata `123` fisiere `route.ts`
- unele comentarii din cron route-uri au ore/zile vechi; programarea reala este cea din `vercel.json`
- exista inca pagini/rute legacy sau bridge:
  - `/dashboard/scanari`
  - `/dashboard/sisteme`
  - `/dashboard/rapoarte`
  - `/dashboard/setari`
  - `/dashboard/partner`
- shell-ul canonic vizibil foloseste mai ales:
  - `/dashboard`
  - `/dashboard/scan`
  - `/dashboard/resolve`
  - `/dashboard/reports`
  - `/dashboard/settings`
- unele documente canon finale sunt momentan necomise in git local, dar contin directia actuala

## 6. Cine foloseste produsul

Personas prioritare:

### 6.1 Partner / Consultant / Contabil / Auditor extern operational

Profil:

- gestioneaza mai multe firme
- are nevoie de vedere agregata
- face triere cross-client
- intra per-client doar cand executa

Mod tehnic relevant:

- `userMode = partner`
- `workspaceMode = portfolio | org`
- roluri tipice:
  - `partner_manager`
  - uneori `owner` sau `compliance` pe anumite org-uri

### 6.2 Compliance intern / DPO / CISO

Profil:

- lucreaza intr-o singura organizatie
- vrea profunzime si module complete
- foloseste zonele NIS2, vendor review, audit, export, findings

Mod tehnic relevant:

- `userMode = compliance`
- `workspaceMode = org`

### 6.3 Solo / CEO / Administrator IMM

Profil:

- nu este specialist
- vrea claritate si actiune simpla
- foloseste mai ales onboarding, scanare, documente, exporturi si urmatorul pas

Mod tehnic relevant:

- `userMode = solo`
- nav simplificat

### 6.4 Reviewer / Viewer

Profil:

- rol read-only sau task-limited
- vede doar ce trebuie verificat sau incarcat

Mod tehnic relevant:

- rol `reviewer` sau `viewer`

## 7. Moduri, roluri si sesiune

### 7.1 Roluri canonice

- `owner`
- `partner_manager`
- `compliance`
- `reviewer`
- `viewer`

### 7.2 Moduri de utilizator

- `solo`
- `partner`
- `compliance`
- `viewer`

### 7.3 Moduri de workspace

- `org`
- `portfolio`

### 7.4 Reguli importante de sesiune

- sesiunea pastreaza intotdeauna `orgId` si `orgName`
- `workspaceMode` decide daca utilizatorul este in context per-firma sau in context portfolio
- in mod `partner`, intrarea in `portfolio` nu sterge ultimul `orgId`; il pastreaza ca ultim context valid
- `partner_manager` poate opera firma, dar nu este implicit owner

### 7.5 Ownership / claim

Modelul actual:

- o firma poate fi creata de consultant si sa aiba owner placeholder `system`
- clientul real poate revendica ownership-ul prin flow de `claim`
- dupa claim, owner-ul real poate administra membrii si elimina consultantul

Suprafete implicate:

- `Setari > Acces`
- `/claim`
- `/api/auth/claim-invite`
- `/api/auth/claim-accept`
- `/api/auth/claim-status/[orgId]`

## 8. IA si navigare

### 8.1 Shell public

Rute publice principale confirmate live pe aliasul Vercel `https://compliscanag.vercel.app`:

- `/`
- `/pricing`
- `/login`
- `/reset-password`
- `/claim`
- `/demo/[scenario]`
- `/terms`
- `/privacy`
- `/dpa`
- `/genereaza-dpa`
- `/genereaza-politica-gdpr`

Rute existente in build-ul de productie, dar care nu sunt public-generic confirmabile fara context valid:

- `/trust/[orgId]`

Rute existente, dar session-gated pe live:

- `/onboarding` -> redirect `307` spre `/login` fara sesiune
- `/dashboard` -> redirect `307` spre `/login` fara sesiune
- `/portfolio` -> redirect `307` spre `/login` fara sesiune

### 8.2 Shell canonic per-firma

Navigatie principala:

- `Acasa` -> `/dashboard`
- `Scaneaza` -> `/dashboard/scan`
- `De rezolvat` -> `/dashboard/resolve`
- `Rapoarte` -> `/dashboard/reports`
- `Setari` -> `/dashboard/settings`

### 8.3 Shell solo

Navigatie principala simplificata:

- `Acasa`
- `Scaneaza`
- `De rezolvat`
- `Documente`
- `Rapoarte`
- `Setari`

### 8.4 Shell viewer

Navigatie principala:

- `Acasa`
- `Taskurile mele`
- `Documente`
- `Setari`

### 8.5 Shell portfolio

Pentru `userMode = partner` si `workspaceMode = portfolio`:

- `/portfolio`
- `/portfolio/alerts`
- `/portfolio/tasks`
- `/portfolio/vendors`
- `/portfolio/reports`
- `/account/settings`

### 8.6 Bridge-uri si rute inca prezente

Aplicatia inca pastreaza rute istorice sau avansate:

- `/dashboard/scanari`
- `/dashboard/documente`
- `/dashboard/sisteme`
- `/dashboard/conformitate`
- `/dashboard/alerte`
- `/dashboard/nis2`
- `/dashboard/agents`
- `/dashboard/fiscal`
- `/dashboard/vendor-review`
- `/dashboard/asistent`
- `/dashboard/checklists`
- `/dashboard/politici`
- `/dashboard/generator`
- `/dashboard/rapoarte`
- `/dashboard/setari`
- `/dashboard/partner`
- `/dashboard/partner/[orgId]`

Interpretare corecta:

- nu toate aceste rute trebuie promovate in sidebarul primar
- multe sunt suprafete avansate, legacy sau puncte de intrare secundare
- shell-ul canonic ramane cel cu 5 itemi

## 9. Pagini principale si intentia lor UX

### 9.1 `Acasa` -> `/dashboard`

Rol:

- orientare
- sumar executiv
- urmatorul pas

Ce contine:

- `ApplicabilityWizard` daca profilul firmei nu este complet
- `NextBestAction`
- summary strip cu scor, actiuni active, drift, documente procesate, stare audit
- breakdown pe framework:
  - GDPR
  - NIS2
  - AI Act
  - e-Factura
- benchmark sectorial
- bannere pentru vigilenta ANAF / NIS2 / streak

Regula UX:

- pagina de orientare, nu de executie grea

### 9.2 `Scaneaza` -> `/dashboard/scan`

Rol:

- locul unic de intrare pentru surse noi

Source types:

- `document`
- `text`
- `manifest`
- `yaml`

Moduri locale:

- `flow`
- `verdicts`
- `history`

Capabilitati:

- upload document
- text manual
- analizare manifest/repo
- analizare `compliscan.yaml`
- autodiscovery AI
- agent mode

`Agent Mode`:

- deschide `AgentWorkspace`
- construieste `SourceEnvelope`
- ruleaza agentii de intake/findings/drift/evidence
- cere confirmare umana inainte de commit

### 9.3 `Scan result` -> `/dashboard/scan/results/[scanId]`

Rol:

- afiseaza verdictul pentru scanarea curenta
- pagina ancorata la rezultat, nu la executie

Handoff:

- continua in `De rezolvat`
- istoricul ramane separat

### 9.4 `Istoric documente` -> `/dashboard/scan/history` si `/dashboard/documente`

Rol:

- arhiva read-only
- consultare rezultate procesate
- nu este locul principal de repornire a analizei

### 9.5 `De rezolvat` -> `/dashboard/resolve`

Rol:

- queue unificat de finding-uri si task-uri actionabile
- separa orientarea de executie

Capabilitati:

- filtre pe framework:
  - `toate`
  - `gdpr`
  - `nis2`
  - `ai-act`
  - `furnizori`
- sortare implicita dupa severitate
- `Resolution Layer` inline
- acces catre detaliul unui finding
- task status, evidence upload, rescan, validation status

### 9.6 `Rapoarte` -> `/dashboard/reports`

Rol:

- output read-only
- export si livrabile

Contine:

- `ExportCenter`
- snapshot status
- AI Compliance Pack summary
- e-Factura risk card
- inspector mode panel
- generare:
  - PDF executiv
  - response pack
  - audit pack
  - audit bundle
  - annex lite
  - checklist export
  - `compliscan.json`
  - `compliscan.yaml`
  - share token

### 9.7 `Vault` -> `/dashboard/reports/vault`

Rol:

- verifica daca auditul chiar se sustine
- combina dovada, trasabilitatea, validation ledger, drift si evidence registry

### 9.8 `Audit Log` -> `/dashboard/reports/audit-log`

Rol:

- jurnal imutabil/exportabil de evenimente
- filtrabil pe task/drift/alert
- export CSV

### 9.9 `Politici interne` -> `/dashboard/reports/policies`

Rol:

- registru de politici/template-uri
- acknowledgement per organizatie

Template-uri incluse in UI:

- privacy policy
- DPA
- acceptable use
- incident response
- AI governance
- DPIA

### 9.10 `Trust Center` -> `/dashboard/reports/trust-center`

Rol:

- configureaza profilul public de conformitate
- permite control fin pe ce este vizibil public:
  - scor
  - GDPR
  - EU AI Act
  - e-Factura
  - data ultimei actualizari

Public surface aferenta:

- `/trust/[orgId]`

### 9.11 `Setari` -> `/dashboard/settings`

Rol:

- administratie operationala

Tab-uri active:

- `Workspace`
- `Integrari`
- `Acces`
- `Operational`
- `Notificari`
- `Avansat`

Ce acopera:

- context workspace
- baseline validat
- diagnostice Supabase
- repo sync status
- membership si roluri
- ownership / claim
- health check
- release readiness
- preferinte email/webhook
- operatii avansate si reset

### 9.12 `Cont` -> `/account/settings`

Rol:

- setari ale contului, nu ale firmei
- important mai ales pentru modul `partner`

Ce acopera:

- identitate cont
- plan account-level pentru partner
- Stripe checkout si portal pentru billing de portofoliu
- capacitate maxima de firme

### 9.13 `Portofoliu` -> `/portfolio/*`

Suprafete:

- `overview`
- `alerts`
- `tasks`
- `vendors`
- `reports`

Rol:

- triere cross-client
- vedere agregata
- drill-down controlat in firma activa

Regula de produs:

- portofoliul nu este loc de bulk mutation nelimitat pe toate org-urile
- portofoliul agregeaza si prioritizeaza
- executia finala sensibila ramane per-org

### 9.14 Suprafete avansate/legacy relevante

Acestea exista si fac parte din runtime-ul real:

- `/dashboard/sisteme`
  - candidate AI, inventar oficial, baseline, compliance pack, drift review
- `/dashboard/conformitate`
  - evaluare EU AI Act pe workflow dedicat
- `/dashboard/nis2`
  - tabs pentru assessment, incidente, vendors
- `/dashboard/nis2/maturitate`
  - autoevaluare de maturitate DNSC
- `/dashboard/nis2/inregistrare-dnsc`
  - wizard de inregistrare DNSC
- `/dashboard/nis2/governance`
  - training board si guvernanta
- `/dashboard/vendor-review`
  - workbench de review furnizori
- `/dashboard/fiscal`
  - discrepante e-TVA si filing discipline
- `/dashboard/agents`
  - manual run history si control pentru agentii operationali
- `/dashboard/asistent`
  - utilitar global de clarificare, nu sistem de executie
- `/dashboard/alerte`
  - drift si alerte active
- `/dashboard/checklists`
  - suprafata secundara/istorica

## 10. Reguli UX/UI si design system

Sistemul vizual activ este `Evidence OS v1`.

Primitive importante folosite in runtime:

- `PageIntro`
- `SummaryStrip`
- `ActionCluster`
- `SectionBoundary`
- `HandoffCard`
- `DenseListItem`
- `GuideCard`
- `MetricTile`
- `Badge`
- `Card`
- `Tabs`

Guardrails UX importante:

- o pagina = o intentie dominanta
- maxim 3 CTA-uri in zona primara
- `Summary -> Action -> Detail`
- detaliile grele intra sub disclosure sau in tab-uri locale
- read-only si executie nu se amesteca
- `Asistentul` explica, dar nu executa in locul produsului
- `Rapoarte` livreaza output, nu este workspace de lucru
- `Istoric` este arhiva, nu locul principal de executie

Detaliu important:

- `components/ui/*` a fost redus la strat de compatibilitate
- directia vizuala reala este in `components/evidence-os/*`

## 11. Functionalitati reale ale produsului

### 11.1 Onboarding si prefill

- register / login / reset password
- selectie `userMode`
- onboarding page dedicata
- profil organizatie cu `sector`, `employeeCount`, `usesAITools`, `requiresEfactura`
- prefill prin:
  - ANAF CUI lookup
  - website signals
  - AI compliance pack signals
  - document signals
  - vendor signals

### 11.2 Applicability engine

Calculeaza ce framework-uri sunt relevante:

- GDPR
- e-Factura
- NIS2
- AI Act

Mai genereaza:

- finding-uri initiale
- document requests
- next best action

### 11.3 Scanare si analiza

Suporta:

- text manual
- imagine
- PDF
- manifest
- `compliscan.yaml`

Pipeline:

- validare input
- OCR cu Google Vision pentru imagine/PDF cand este configurat
- review text extras
- analiza semantica Gemini ca motor principal
- fallback/complement keyword-based
- generare findings, provenance, confidence, status

### 11.4 AI inventory si control

Aplicatia mentine:

- `aiSystems`
- `detectedAISystems`

Stari importante:

- `detected`
- `reviewed`
- `confirmed`
- `rejected`

Capabilitati:

- auto-discovery din manifeste si documente
- clasificare risc
- compliance pack
- baseline
- drift review

### 11.5 Drift detection

Poate compara snapshot-uri fata de un baseline validat si genera drift records pentru:

- provider schimbat
- model schimbat
- framework nou
- date personale detectate
- human review eliminat
- scop schimbat
- data residency schimbata
- furnizor nou/eliminat
- tracking detectat
- high-risk signal detectat

Drift-ul are:

- severitate
- reason
- impact summary
- next action
- evidence required
- law reference
- escalation tier / SLA / deadline
- lifecycle status

### 11.6 Remediation si dovada

- task-uri derivate din findings
- evidence upload
- evidence quality assessment
- validation status
- rescan
- readiness pentru audit

### 11.7 Export si audit

Livrabile principale:

- executive PDF
- report PDF
- response pack
- audit pack
- audit bundle
- annex lite
- trust center public
- `compliscan.json`
- `compliscan.yaml`

### 11.8 NIS2

Capabilitati:

- assessment NIS2
- scoring si maturity label
- transformare gap-uri in findings centrale
- rescue finding pentru lipsa inregistrarii DNSC
- registru furnizori ICT
- incident log cu SLA tracking
- governance/training board
- wizard de inregistrare DNSC

### 11.9 Vendor review

Capabilitati:

- creare review din vendor registry
- categorii:
  - `ai`
  - `cloud`
  - `tech`
  - `unknown`
- review urgency
- audit trail
- revalidare periodica automata

### 11.10 e-Factura si fiscal

Capabilitati:

- validare XML UBL / CIUS-RO
- stare integrare ANAF
- sync mock/real
- semnale e-Factura
- import furnizori din semnale fiscale
- discrepante e-TVA
- filing records

### 11.11 Politici si documente generate

Document generation suportat:

- privacy policy
- cookie policy
- DPA
- NIS2 incident response
- AI governance

Important:

- generarea este asistata
- publicarea/semnarea/atasarea finala raman pasi separati

### 11.12 Chat si asistent

Exista doua straturi diferite:

- `chat` cu Gemini pentru intrebari scurte contextualizate
- `Asistent` ca suprafata de orientare UX

Acestea nu sunt sursa de adevar finala si nu inlocuiesc fluxurile reale.

### 11.13 Demo si trust/public sharing

Demo scenarios:

- `imm`
- `nis2`
- `partner`

Public trust profile:

- link public read-only pe `/trust/[orgId]`

Share token:

- token securizat cu expirare 72h pentru accountant / counsel / partner

## 12. Model de date / noduri principale

Acesta este cel mai important rezumat de entitati pentru un model extern.

| Nod | Ce reprezinta | Exemple de campuri cheie |
|---|---|---|
| `User` | utilizator autenticat | `id`, `email`, `authProvider` |
| `Organization` | firma/workspace | `id`, `name`, `createdAtISO` |
| `Membership` | relatia user-org | `membershipId`, `orgId`, `role`, `status` |
| `SessionPayload` | context activ in cookie | `userId`, `orgId`, `role`, `userMode`, `workspaceMode` |
| `ComplianceState` | starea centrala per org | toate colectiile de mai jos |
| `ScanRecord` | o sursa scanata | `id`, `documentName`, `sourceKind`, `extractionMethod`, `analysisStatus` |
| `ScanFinding` | constatare concreta | `severity`, `category`, `legalReference`, `resolution`, `provenance` |
| `PersistedTaskState` | starea unui task | `status`, `attachedEvidenceMeta`, `validationStatus` |
| `TaskEvidenceAttachment` | o dovada atasata | `kind`, `mimeType`, `storageProvider`, `quality` |
| `ComplianceDriftRecord` | abatere fata de baseline | `change`, `severity`, `lifecycleStatus`, `blocksAudit` |
| `AISystemRecord` | sistem AI confirmat | `purpose`, `vendor`, `riskLevel`, `hasHumanReview` |
| `DetectedAISystemRecord` | candidat detectat automat | `discoveryMethod`, `detectionStatus`, `confidence` |
| `GeneratedDocumentRecord` | document generat | `documentType`, `title`, `generatedAtISO`, `llmUsed` |
| `EFacturaValidationRecord` | rezultat validare XML | `valid`, `errors`, `warnings`, `invoiceNumber` |
| `ComplianceEvent` | audit/event log | `type`, `entityType`, `actorLabel`, `metadata` |
| `Notification` | notificare in-app | `type`, `title`, `message`, `readAt` |
| `CompliScanSnapshot` | snapshot exportabil | `sources`, `systems`, `findings`, `drift`, `summary` |
| `Nis2OrgState` | stare separata NIS2 | `assessment`, `incidents`, `vendors`, `governance` |
| `VendorReview` | review furnizor | `status`, `urgency`, `category`, `auditTrail` |
| `AgentOutput` | output automation agent | `agentType`, `actions`, `metrics`, `confidence` |
| `AgentProposalBundle` | output Agent OS in scan page | `intake`, `findings`, `drifts`, `evidence`, `reviewState` |

### 12.1 `ComplianceState` este nodul central

Campuri importante din cod:

- `alerts`
- `findings`
- `scans`
- `generatedDocuments`
- `chat`
- `taskState`
- `aiComplianceFieldOverrides`
- `traceabilityReviews`
- `aiSystems`
- `detectedAISystems`
- `efacturaValidations`
- `driftRecords`
- `driftSettings`
- `snapshotHistory`
- `validatedBaselineSnapshotId`
- `events`
- `orgProfile`
- `applicability`
- `orgProfilePrefill`
- `shadowAiAnswers`
- `intakeAnswers`
- `complianceStreak`

### 12.2 `CompliScanSnapshot`

Snapshot-ul exportabil are:

- `workspace`
- `sources`
- `systems`
- `findings`
- `drift`
- `summary`

Acesta este nodul care alimenteaza exportul nativ `compliscan.json` / `compliscan.yaml`.

### 12.3 Storage providers pentru dovezi

Sunt modelate explicit:

- `public_local`
- `local_private`
- `supabase_private`

## 13. Arhitectura tehnica

### 13.1 Stack

- Next.js `15.5.12`
- React `19.2.3`
- TypeScript
- Tailwind CSS `v4`
- `lucide-react`
- `sonner`
- `@sentry/nextjs`
- `pdfkit`
- `archiver`

### 13.2 Statistica repo-ului la 2026-03-23

- `123` fisiere `app/api/**/route.ts`
- `38` pagini `app/dashboard/**/page.tsx`
- `73` componente/fisiere in `components/compliscan`
- `65` componente/fisiere in `components/evidence-os`
- `139` fisiere de test `*.test.ts(x)`

Nota:

- aceste numere sunt snapshot-uri de inventar si se invechesc rapid
- pentru audit operational, build output si `rg --files` sunt mai de incredere decat documentele vechi

### 13.3 Structura principala

- `app/`
  - pagini si API routes
- `components/compliscan/`
  - suprafete de produs
- `components/evidence-os/`
  - sistem vizual si primitive
- `lib/compliance/`
  - logica de domeniu, engines, scoring, agenti, findings, drift
- `lib/server/`
  - auth, state, storage, exports, integrations, cron helpers
- `supabase/`
  - SQL foundation si operatiuni runtime
- `public/`
  - canon operational si documente de lucru

### 13.4 Stare si persistenta

Modelul de persistenta este adaptiv:

- local-first / local fallback prin fisiere in `.data/`
- cloud-first optional prin Supabase
- moduri suportate:
  - `local`
  - `supabase`
  - `hybrid`

Fisiere locale observabile in repo:

- `.data/users.json`
- `.data/orgs.json`
- `.data/memberships.json`
- `.data/state-org-*.json`
- `.data/plans-global.json`
- `.data/analytics.jsonl`

### 13.5 Surse principale de stare

| Zona | Implementare reala |
|---|---|
| auth local | `.data/users.json`, `.data/orgs.json`, `.data/memberships.json` |
| org state local | `.data/state-org-*.json` |
| org state cloud | `public.org_state` in Supabase |
| evidence metadata cloud | `public.evidence_objects` |
| private evidence storage | Supabase private bucket |
| score snapshots | local/Supabase depending setup |
| legislation hashes | Supabase table dedicata |

### 13.6 Evidenta si export

Evidenta nu este servita public direct.

Accesul standard trece prin:

- `GET /api/tasks/[id]/evidence/[evidenceId]`

Optiuni importante:

- `delivery=redirect` pentru URL semnat
- `download=1` pentru descarcare explicita

## 14. AI in produs

Exista mai multe straturi de AI, nu unul singur.

### 14.1 Gemini semantic scan analysis

Rol:

- motor principal de analiza pentru documente scanate

Comportament:

- foloseste prompturi separate pe framework:
  - GDPR
  - NIS2
  - AI Act
  - e-Factura
- intoarce JSON cu:
  - title
  - description
  - article
  - severity
  - confidence
  - reasoning
  - sourceParagraph
  - recommendation
  - suggestedDocumentType

Important:

- matching-ul pe keyword exista in continuare ca fallback/complement
- findings au confidence si `requiresHumanReview`

### 14.2 Gemini chat

Route:

- `POST /api/chat`

Rol:

- raspuns scurt contextualizat pe starea curenta
- daca Gemini lipseste sau pica, exista fallback rule-based

Reguli de output impuse in prompt:

- raspuns in romana
- nu `100% compliant`
- 4 sectiuni:
  - `Ce am detectat`
  - `De ce conteaza`
  - `Ce verifici acum`
  - `Remediere concreta`

### 14.3 Document generation

Folosit pentru:

- politici
- DPA
- documente de guvernanta / proceduri

LLM:

- Gemini daca este configurat

### 14.4 Prefill intelligence

Prefill-ul profilului de organizatie este compus din mai multe surse:

- ANAF CUI lookup
- website signals
- vendor signals
- document signals
- AI signals
- AI compliance pack signals

### 14.5 Shadow AI assessment

Route:

- `GET/POST /api/shadow-ai`

Rol:

- chestionar pentru detectarea utilizarii necontrolate de AI
- calculeaza risc
- injecteaza findings specifice

### 14.6 Sector benchmark

Route:

- `GET /api/benchmark`

Rol:

- pozitioneaza organizatia fata de benchmark sectorial anonim

## 15. Automation layer

Exista doua straturi distincte:

### 15.1 Agent OS in pagina de scanare

Acesta este workspace-ul interactiv de agenti din UI.

Flux:

1. userul creeaza un `SourceEnvelope`
2. se ruleaza in paralel:
   - `runIntakeAgent`
   - `runFindingsAgent`
   - `runDriftAgent`
   - `runEvidenceAgent`
3. se construieste `AgentProposalBundle`
4. review state initial = `needs_review`
5. commit-ul cere confirmare umana explicita
6. doar bundle-urile `confirmed` / `partially_confirmed` pot fi aplicate

Important si foarte real:

- toate cele patru functii exista in `lib/compliance/agent-runner.ts`
- in `lib/compliance/route.ts` exista inca comentarii stale care spun `Placeholder` pentru `drift` si `evidence`
- `drift` este functional, dar multe comparatii sunt inca euristice si nu pornesc mereu din `validatedBaselineSnapshotId`
- `evidence` produce `auditReadiness` si lipsuri de dovada, dar `app/api/agent/commit/route.ts` nu persista aceasta zona in state/task ledger
- deci aceasta zona este functionala, dar nu trebuie descrisa ca agent autonomy completa end-to-end

### 15.2 Agentic Engine operational

Acesta este stratul de agenti operationali per org.

Agenti implementati:

- `compliance_monitor`
- `fiscal_sensor`
- `document`
- `vendor_risk`
- `regulatory_radar`

Ce fac:

- scaneaza starea curenta
- genereaza actiuni/notificari
- logheaza rularea
- aplica doar auto-actiuni nivel 1

Niveluri de approval:

- `1` = auto-execute
- `2` = auto-draft, human approve
- `3` = human only

Persistenta:

- agent run history per org in `agent-run-store`

## 16. Automatizari cron reale

Programarea reala este cea din `vercel.json`, nu comentariile vechi din unele route-uri.

| Path | Schedule din `vercel.json` | Ce face in realitate |
|---|---|---|
| `/api/cron/agent-orchestrator` | `0 6 * * *` | ruleaza agentii operationali zilnici pentru org-uri active |
| `/api/cron/vendor-review-revalidation` | `0 7 * * *` | marcheaza review-urile vendor expirate ca overdue-review |
| `/api/cron/legislation-monitor` | `0 7 * * *` | verifica surse legislative oficiale si trimite notificari pe framework relevant |
| `/api/cron/score-snapshot` | `50 7 * * *` | salveaza snapshot-ul scorului si trimite alerta la scadere semnificativa |
| `/api/cron/daily-digest` | `0 8 * * *` | email digest zilnic doar cand s-a schimbat ceva relevant |
| `/api/cron/inspector-weekly` | `0 8 * * 1` | ruleaza simularea de control si trimite email doar daca verdictul nu este `ready` |
| `/api/cron/weekly-digest` | `30 8 * * 1` | trimite digest saptamanal per organizatie |
| `/api/cron/audit-pack-monthly` | `0 9 1 * *` | reminder lunar pentru audit pack |
| `/api/cron/vendor-sync-monthly` | `0 10 1 * *` | detecteaza furnizori noi din semnale e-Factura si creeaza finding candidates |
| `/api/cron/partner-monthly-report` | `0 9 2 * *` | trimite raport lunar agregat pentru consultanti/contabili cu portofoliu |

Exemple concrete de comentarii stale in cod:

- `score-snapshot` comenteaza `07:30 UTC`, dar `vercel.json` are `07:50`
- `inspector-weekly` comenteaza `Wednesday 09:00 UTC`, dar `vercel.json` are `Monday 08:00`
- `weekly-digest` comenteaza `08:00 UTC`, dar `vercel.json` are `08:30`
- `vendor-sync-monthly` comenteaza `15th of month, 09:00 UTC`, dar `vercel.json` are `1st of month, 10:00`

### 16.1 Surse legislative monitorizate

Din codul actual:

- ANSPDCP
- DNSC
- ANAF noutati legislative

Metoda:

- hash comparison
- sumarizare Gemini
- stocare hash in Supabase

### 16.2 Canale de notificare

- in-app notifications
- email prin Resend
- fallback pe `console.log` daca `RESEND_API_KEY` lipseste

## 17. Integrari externe

### 17.1 ANAF CUI lookup

Rol:

- prefill organizatie dupa CUI
- denumire
- adresa
- CAEN
- status TVA
- sugestie sector
- semnal e-Factura

### 17.2 ANAF e-Factura / SPV

Moduri reale in cod:

- `mock`
- `real`

Capabilitati:

- status integrare
- sync semnalat in state
- client OAuth2 + upload/status endpoints implementate
- validare XML structurala separata

Observatie importanta:

- ruta de sync actualizeaza starea si mesajul in functie de mod
- clientul live ANAF exista in cod
- produsul trebuie descris ca `real+mock capable`, nu ca integrare ANAF full automatizata pe toate fluxurile

### 17.3 Google Vision

Folosit pentru:

- OCR imagini
- OCR PDF

### 17.4 Supabase

Folosit pentru:

- auth optional
- tenancy graph
- `public.org_state`
- `public.evidence_objects`
- private bucket pentru dovezi
- legislation hashes
- score snapshots
- operational status / RLS verification

### 17.5 Stripe

Folosit pentru:

- checkout
- billing portal
- webhook subscription state
- atat per-org, cat si partner account billing

### 17.6 Resend

Folosit pentru:

- alerte
- digesturi
- audit pack reminder
- inspector weekly
- partner monthly report
- forgot password / account deletion requests

### 17.7 Sentry

Folosit pentru:

- operational logging
- cron telemetry
- route errors

### 17.8 URL defaults si productie

In cod exista doua familii de URL-uri implicite:

- `NEXT_PUBLIC_URL` cu fallback frecvent spre `https://compliai.ro`
- `NEXT_PUBLIC_APP_URL` folosit mai ales pentru auth / Stripe / onboarding, cu comment sau fallback spre `https://app.compliscan.ro`

Verificare Vercel confirmata la `2026-03-23`:

- proiectul Vercel activ este `compliscanag`
- aliasul public de productie confirmat din audit este `https://compliscanag.vercel.app`
- ultimul deployment de productie inspectat a fost creat la `2026-03-23 07:58:49 EET`
- acel deployment este din branch-ul `main`, commit `878274882220e8647853383057923fed7254f977`
- mesajul commit-ului live este `Fix onboarding continuation via session user mode fallback`
- URL-ul brut de deployment este platform-protected pe Vercel si poate raspunde `401`, in timp ce aliasul `compliscanag.vercel.app` este public
- in acest scope Vercel nu exista domenii custom atasate la momentul auditului

Concluzie corecta:

- repo-ul suporta aceasta dualitate istorica / configurabila
- domeniul live confirmat operational din acest audit este aliasul Vercel `https://compliscanag.vercel.app`
- domeniile brand din fallback-uri si comentarii raman configurabile/istorice si nu trebuie descrise ca productie verificata fara audit separat de DNS/domain

## 18. API map pe familii

Numar de route files pe familie, dupa inventarul actual al repo-ului:

| Familie | Count |
|---|---:|
| `auth` | 16 |
| `nis2` | 11 |
| `cron` | 10 |
| `integrations` | 8 |
| `exports` | 5 |
| `portfolio` | 5 |
| `reports` | 5 |
| `ai-systems` | 3 |
| `account` | 3 |
| `alerts` | 3 |
| `partner` | 3 |
| `scan` | 3 |
| `state` | 3 |
| `stripe` | 3 |
| `tasks` | 3 |
| restul | 1-2 fiecare |

### 18.1 Auth si tenancy

- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/auth/members`
- `/api/auth/members/[membershipId]`
- `/api/auth/memberships`
- `/api/auth/switch-org`
- `/api/auth/select-workspace`
- `/api/auth/set-user-mode`
- `/api/auth/summary`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`
- `/api/auth/claim-invite`
- `/api/auth/claim-accept`
- `/api/auth/claim-status/[orgId]`

### 18.2 Dashboard si org profile

- `/api/dashboard`
- `/api/dashboard/core`
- `/api/org/profile`
- `/api/org/profile/prefill`
- `/api/settings/summary`
- `/api/plan`

### 18.3 Scanare si analiza

- `/api/scan`
- `/api/scan/extract`
- `/api/scan/[id]/analyze`
- `/api/findings/[id]`
- `/api/tasks/[id]`
- `/api/tasks/[id]/evidence`
- `/api/tasks/[id]/evidence/[evidenceId]`
- `/api/alerts/[id]/resolve`

### 18.4 AI si agenti

- `/api/ai-systems`
- `/api/ai-systems/discover`
- `/api/ai-systems/detected/[id]`
- `/api/ai-conformity`
- `/api/agent/run`
- `/api/agent/commit`
- `/api/agents`
- `/api/shadow-ai`
- `/api/chat`
- `/api/compliance-pack/fields`

### 18.5 Rapoarte si export

- `/api/reports`
- `/api/reports/pdf`
- `/api/reports/response-pack`
- `/api/reports/counsel-brief`
- `/api/reports/share-token`
- `/api/exports/audit-pack`
- `/api/exports/audit-pack/bundle`
- `/api/exports/audit-pack/client`
- `/api/exports/annex-lite/client`
- `/api/exports/compliscan`
- `/api/documents/generate`
- `/api/documents/export-pdf`

### 18.6 NIS2 si vendor risk

- `/api/nis2/assessment`
- `/api/nis2/maturity`
- `/api/nis2/dnsc-status`
- `/api/nis2/vendors`
- `/api/nis2/vendors/[id]`
- `/api/nis2/vendors/import-efactura`
- `/api/nis2/incidents`
- `/api/nis2/incidents/[id]`
- `/api/nis2/incidents/checklist`
- `/api/nis2/governance`
- `/api/nis2/governance/[id]`
- `/api/vendor-review`
- `/api/vendor-review/[id]`

### 18.7 Fiscal si e-Factura

- `/api/efactura/validate`
- `/api/efactura/signals`
- `/api/integrations/efactura/status`
- `/api/integrations/efactura/sync`
- `/api/fiscal/etva-discrepancies`
- `/api/fiscal/filing-records`
- `/api/prefill/invoice`

### 18.8 Portfolio si partner

- `/api/portfolio/overview`
- `/api/portfolio/alerts`
- `/api/portfolio/tasks`
- `/api/portfolio/vendors`
- `/api/portfolio/reports`
- `/api/partner/clients`
- `/api/partner/clients/[orgId]`
- `/api/partner/import-csv`

### 18.9 Operational, health si integrari

- `/api/health`
- `/api/health-check`
- `/api/release-readiness`
- `/api/inspector`
- `/api/integrations/repo-sync`
- `/api/integrations/repo-sync/github`
- `/api/integrations/repo-sync/gitlab`
- `/api/integrations/repo-sync/status`
- `/api/integrations/supabase/status`
- `/api/integrations/supabase/keepalive`
- `/api/state/baseline`
- `/api/state/drift-settings`
- `/api/state/reset`

### 18.10 Notificari, analytics, feedback, account

- `/api/alerts/notify`
- `/api/alerts/preferences`
- `/api/notifications`
- `/api/notifications/[id]`
- `/api/analytics/track`
- `/api/feedback`
- `/api/account/export-data`
- `/api/account/request-deletion`
- `/api/account/delete-data`

## 19. Planuri si gating

Planuri principale:

- `free`
- `pro`
- `partner`

Planuri account-level pentru partner:

- `partner_10`
- `partner_25`
- `partner_50`

Gating important:

- `pro` deblocheaza:
  - audit pack complet
  - findings resolution complet
  - all documents
  - health check
  - inspector mode
  - weekly digest
  - NIS2 full
  - AI Act full
- `partner` deblocheaza:
  - multi-client hub
  - CSV import
  - client drilldown

Billing scopes:

- `org`
- `partner_account`

## 20. Demo, share si public exposure

### 20.1 Demo

Scenarii demo existente:

- `/demo/imm`
- `/demo/nis2`
- `/demo/partner`

Scop:

- seed complet cu date fictive
- setare cookie de sesiune demo

### 20.2 Trust profile public

Public:

- `/trust/[orgId]`

Expune read-only:

- scor
- GDPR status
- EU AI Act status
- e-Factura status
- data ultimei actualizari

### 20.3 Share tokens

Token securizat cu expirare de `72h` pentru:

- `accountant`
- `counsel`
- `partner`

## 21. Testing si disciplina de validare

Repo-ul are `139` fisiere de test `*.test.ts(x)` la snapshot-ul acestui audit.

Exista si:

- `tests/fixtures/`
- `tests/canonical-runtime-audit.test.ts`
- `tests/flow-test-kit-user-nou.test.ts`
- teste live separate pentru Vision

Scripturi importante:

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run preflight:release`
- `npm run verify:supabase:sprint5`
- `npm run verify:supabase:strict`
- `npm run verify:supabase:rls`

Snapshot validare 2026-03-23:

- `npm run build` -> trece
- `npm run lint` -> trece cu warnings de `unused vars`
- `npm test` -> nu este complet verde in acest mediu:
  - pica testele live Google Vision din lipsa accesului DNS/retea catre `eu-vision.googleapis.com`
  - runner-ul include si duplicate din `.claude/worktrees/...`
- `vitest run --exclude 'tests/live/**' --exclude '.claude/**'` -> trece complet pe nucleul repo-ului local

## 22. Limitari reale si zone de prudenta

1. Aplicatia este serioasa si mare, dar nu este un motor de decizie juridica finala.
2. Unele suprafete sunt canonice, altele sunt inca avansate/legacy/bridge.
3. Unele comentarii din cod sunt depasite fata de configul real.
4. Unele audit docs vechi au inventare invechite.
5. `Agent OS` din scanare nu trebuie descris ca autonomie completa fara review.
6. Integrarea ANAF are mod `mock` si mod `real`; nu presupune live behavior daca env-urile lipsesc.
7. Drift-ul este valoros doar cand exista baseline validat.
8. Portfolio este agregare si triere, nu bulk execution nelimitat.
9. Exporturile si evidenta sunt sensibile si trebuie respectate role/plan guards.
10. In productie, traseele cloud si fallback policy depind mult de env si de configurarea Supabase.

## 23. Daca Claude Web trebuie sa imbunatateasca produsul, ce sa faca si ce sa nu faca

### 23.1 Ce sa faca

- sa trateze `Acasa / Scaneaza / De rezolvat / Rapoarte / Setari` ca shell-ul canonic
- sa trateze `Portofoliu` ca suprafata distincta pentru `partner`
- sa simplifice page authority, handoff-ul si densitatea informationala
- sa pastreze `Evidence OS v1` ca baza vizuala
- sa respecte human review si plan gating
- sa imbunatateasca runtime-ul real, nu sa reinventeze un produs paralel
- sa trateze codul din `app/`, `components/compliscan/`, `lib/compliance/`, `lib/server/` ca sursa principala

### 23.2 Ce sa nu faca

- sa nu inventeze alte produse top-level in sidebar
- sa nu mute executia in pagini read-only
- sa nu descrie produsul ca `fully autonomous compliance agent`
- sa nu spuna ca NIS2/GDPR/AI Act sunt `automatically solved`
- sa nu distruga separarea dintre portfolio si dashboard per-org
- sa nu ignore rolurile, membership-urile si ownership-ul
- sa nu trateze toate cron comment-urile ca adevar daca `vercel.json` spune altceva

## 24. Fisierele cele mai importante daca se lucreaza direct in repo

### Shell, IA, navigatie

- `components/compliscan/navigation.ts`
- `lib/compliscan/dashboard-routes.ts`
- `lib/compliscan/nav-config.ts`
- `components/compliscan/dashboard-shell.tsx`

### Suprafete principale

- `app/dashboard/page.tsx`
- `components/compliscan/scan-page.tsx`
- `components/compliscan/resolve-page.tsx`
- `components/compliscan/reports-page.tsx`
- `components/compliscan/settings-page.tsx`
- `components/compliscan/portfolio-overview-client.tsx`
- `components/compliscan/account-settings-page.tsx`

### Model de date si snapshot

- `lib/compliance/types.ts`
- `lib/compliscan/schema.ts`
- `lib/compliscan/yaml-schema.ts`

### State, auth, storage

- `lib/server/mvp-store.ts`
- `lib/server/auth.ts`
- `lib/server/rbac.ts`
- `lib/server/storage-adapter.ts`
- `lib/server/portfolio.ts`

### AI si automatizare

- `lib/compliance/llm-scan-analysis.ts`
- `lib/server/gemini.ts`
- `lib/compliance/agentic-engine.ts`
- `lib/server/agent-orchestrator.ts`
- `lib/compliance/route.ts`
- `lib/compliance/agent-runner.ts`

### Exporturi si audit

- `lib/server/dashboard-response.ts`
- `lib/server/compliscan-export.ts`
- `lib/server/audit-pack.ts`
- `lib/server/pdf-generator.ts`

### Canon docs utile

- `public/sprinturi-maturizare-compliscan.md`
- `public/status-arhitectura.md`
- `public/log-sprinturi-maturizare.md`
- `public/task-breakdown-tehnic.md`
- `docs/canon-final/COMPLISCAN-UX-IA-DEFINITIV-CANON.md`
- `docs/canon-final/COMPLISCAN-UX-IA-DEFINITIV-v1.1-ADDENDUM-CANON.md`
- `docs/canon-final/COMPLISCAN-PORTFOLIO-TECH-SPEC-CANON.md`

## 25. Rezumat ultra-scurt

CompliScan este o platforma de conformitate operationala pentru Romania, cu doua moduri majore de lucru:

- per-firma (`/dashboard`)
- cross-client (`/portfolio`)

Produsul face 5 lucruri mari:

1. afla ce obligatii se aplica firmei
2. scaneaza documente, manifeste si configuratii
3. transforma semnalele in findings, task-uri, baseline si drift
4. cere dovada si validare umana
5. exporta pachete de audit, rapoarte si profiluri publice controlate

Nu este un simplu dashboard si nici un chatbot. Este un workspace operational cu:

- state per organizatie
- RBAC si ownership
- portfolio mode
- AI-assisted analysis
- cron automation
- exporturi si audit defensibility

Orice imbunatatire buna trebuie sa porneasca de aici, nu de la o redesenare abstracta.
