# CompliScan - Task Breakdown Tehnic

Acest document transforma roadmap-ul de produs in task-uri tehnice concrete.

## Status real - 2026-03-12

Checkpoint-ul curent din implementare:

- [x] upload real de dovezi pe task-uri
- [x] proof types pe task-uri (`screenshot`, `policy_text`, `log_export`, `yaml_evidence`, `document_bundle`)
- [x] `Mark as fixed & rescan` cu validation logic real
- [x] `Auditor Vault` cu evidence ledger, validation ledger si timeline
- [x] `Auditor Vault` explică familiile de controale într-un limbaj executiv:
  - de ce contează
  - ce dovedește familia
  - ce surse și ce presiune curentă intră în review
- [x] `Audit Pack v2` cu sectiuni explicite:
  - executive summary
  - system register
  - controls matrix
  - evidence ledger
  - drift register
  - validation log
- [x] `Audit Pack` client-facing, printabil din browser pentru PDF
- [x] polish final pentru stakeholder non-tehnic:
  - ghid de distribuire externă
  - legendă de statusuri
  - pachete de control recomandate pe sistem
  - rezumat managerial per sistem în `Annex IV lite`
- [x] `AI Compliance Pack v2` cu:
  - prefill completeness score
  - field status (`confirmed / inferred / missing`)
  - source signals
  - draft `Annex IV lite`
- [x] `AI Compliance Pack v3` cu:
  - confidence model separat de încrederea tehnică
  - `detected / inferred / confirmed_by_user`
  - rezumat unificat în UI și audit
- [x] drift policy unificat:
  - severity reason
  - impact summary
  - next action
  - evidence required
  - law reference
- [x] drift UX unificat în Dashboard / Alerte / Scanări / Rapoarte / Auditor Vault
- [x] `drift escalation matrix` operațional:
  - lifecycle `open / acknowledged / in_progress / resolved / waived`
  - owner + SLA + deadline
  - SLA breach vizibil în UI și audit
  - auto-resolve / reopen prin task-uri
- [x] traceability matrix comun:
  - finding
  - remediation task
  - drift
  - articol / control
  - snapshot / baseline
- [x] traceability matrix rafinat cu:
  - evidence required pe control
  - coverage `covered / partial / missing`
  - fișiere legate direct de control
- [x] `compliscan.yaml` ca sursa dedicata de scanare
- [x] repo sync generic + adaptoare GitHub / GitLab
- [x] separare in UI si model intre:
  - remedieri rapide
  - remedieri structurale
- [x] sprint scurt de QA + UX cleanup pe flow-urile cele mai dense:
  - `Scanari`: separare clara intre `flux activ` si `ultimul rezultat`
  - `AIDiscoveryPanel`: drift comprimat, fara repetitie grea pe fiecare card
  - `Auditor Vault`: quick-start clar si limitare initiala a traseelor individuale
- [x] micro-copy si empty states cleanup pe paginile cheie:
  - `Scanari`
  - `Sisteme`
  - `Auditor Vault`
- [x] naming consistency pass pe suprafata vizibila:
  - `Flux scanare`
  - `Remediere`
  - `Audit si export`
  - subtitle de brand aliniat cu pozitionarea curenta
- [x] cleanup minim pe componente legacy pentru etichetele vechi ramase in cod

Observatie:

- documentul acesta a fost actualizat dupa starea reala a codului
- unde un item nu este complet, dar exista implementare serioasa, este marcat ca `partial`

## Epic 1 - Claritate produs si navigatie

### Obiectiv

Produsul trebuie sa fie usor de inteles in 30 de secunde.

### Task-uri

- [x] audit complet al navigatiei curente
- [x] definire nav primar pe 3 piloni:
  - Scanare
  - Control
  - Dovada
- [x] simplificare copy in dashboard, scanari, sisteme, rapoarte
- [x] aliniere naming intre nav, titluri de pagina si subtitle de brand
- [x] adaugare mesaje standard pe fiecare pagina:
  - ce vad
  - ce fac acum
  - ce se intampla dupa
- [x] drift surface in dashboard ca element vizibil de zi cu zi
- [ ] reducere sectiuni care par produse separate (partial)

### Livrabil tehnic

- layout si route structure curate
- componente shared pentru guide cards / action cards / status cards

## Epic 2 - Libraria de Reguli + Legal Mapping

### Obiectiv

Semnalele tehnice trebuie legate clar de reguli si de output actionabil.

### Task-uri

- [x] extragere reguli din `engine.ts` intr-o librarie separata
- [x] adaugare `legalMappings` pe findings
- [x] adaugare `ownerSuggestion`
- [x] adaugare `evidenceRequired`
- [x] adaugare `rescanHint`
- [x] conectare librarie de reguli la findings generate
- [x] conectare partiala la remediation si task output
- [x] extindere rule library cu reguli noi:
  - GDPR retention
  - transparency / notice
  - AI human oversight
  - data residency
  - purpose drift
- [x] definire taxonomie de principii:
  - oversight
  - robustness
  - privacy_data_governance
  - transparency
  - fairness
  - accountability
- [x] standardizare severitate:
  - critical
  - high
  - medium
  - low

### Livrabil tehnic

- `lib/compliance/rule-library.ts`
- findings mai bogate si mai utile pentru UI / export

## Epic 3 - Remediation Engine

### Obiectiv

Fiecare finding important trebuie sa spuna ce faci concret.

### Task-uri

- [x] standardizare output remediation:
  - problema
  - de ce conteaza
  - articol afectat
  - owner
  - dovada ceruta
  - text recomandat
  - moment de rescan
- [x] UI pentru legal mapping in task card
- [x] UI pentru evidence required in task card
- [x] UI pentru rescan hint in task card
- [x] suport pentru task-uri derivate din findings si din drift
- [x] separare intre remediation rapida si remediation structurala in model, board si task cards

### Livrabil tehnic

- task cards mai actionabile
- remediation board mai clar
- workflow distinct pentru fix rapid vs schimbare structurala

## Epic 4 - compliscan.yaml

### Obiectiv

Introducem sursa de adevar pentru sistemele AI.

### Task-uri

- [x] definire schema `compliscan.yaml`
- [x] parser pentru YAML
- [x] validare structurala si erori de input
- [x] mapare la modelul intern:
  - provider
  - model
  - risk_class
  - personal_data_processed
  - human_oversight.required
  - data_residency
- [x] suport in `Scanari` pentru upload / paste `compliscan.yaml`
- [x] export compatibil in `compliscan.yaml`

### Livrabil tehnic

- sursa noua de scanare si control

## Epic 5 - Baseline si Drift Detection

### Obiectiv

Drift-ul trebuie sa arate clar ce s-a schimbat si de ce conteaza.

### Task-uri

- [x] comparatie clară intre snapshot si baseline validat
- [x] drift pe campuri-cheie:
  - provider_added
  - provider_changed
  - model_changed
  - framework_added
  - personal_data_detected
  - human_review_removed
  - risk_class_changed
  - purpose_changed
- [x] severitate configurabila pe drift
- [x] remediation derivata din drift
- [x] UI drift:
  - ce s-a schimbat
  - de ce conteaza
  - ce faci acum
  - ce dovada trebuie pastrata

### Livrabil tehnic

- drift clar, comparabil si actionabil

## Epic 6 - Pre-filling

### Obiectiv

Userul nu trebuie sa porneasca de la pagina goala.

### Task-uri

- [x] model comun `AI Compliance Pack`
- [x] pre-fill pentru AI systems din:
  - documente
  - manifests
  - compliscan.yaml
- [x] pre-fill pentru:
  - provider
  - model
  - purpose
  - risk class sugerat
  - data used
  - human oversight
- [x] UI de confirm / edit / reject
- [x] UX dedicat pentru câmpuri compuse:
  - `human_oversight`
  - `data_residency`
  - `retention_days`
  - `legal_mapping`
- [x] `AI Compliance Pack v2`:
  - completeness score
  - field status
  - source signals
  - draft `Annex IV lite`
- [x] confidence model:
  - detected
  - inferred
  - confirmed_by_user
- [x] `AI Compliance Pack v4/v5`:
  - confidence model la nivel de câmp
  - evidence bundle pe sistem
  - trace summary pe sistem
  - secțiuni `Annex IV lite` mai complete
  - coverage pe control și pe articol
  - controale sugerate mai explicite pe grupuri de sisteme
  - `ownerRoute`, `businessImpact`, `bundleHint`
- [x] pre-fill mai agresiv pentru câmpurile avansate din `Annex IV lite`:
  - deployment context
  - affected persons summary
  - monitoring summary
  - escalation path
- [x] `Annex IV lite` client-facing:
  - export HTML printabil din browser
  - legat direct de `AI Compliance Pack`
  - inclus in `Audit Pack` ZIP / dossier bundle
  - review checklist si readiness mai clare in documentul client-facing
  - table of contents și ancore pe sistem / secțiune

### Livrabil tehnic

- inventory confirm flow mai rapid si mai credibil
- baza comuna pentru `Audit Pack`
- draft de documentatie care reduce frica paginii goale
- livrabil client-facing separat pentru review operational si audit

## Epic 7 - Auditor Vault

### Obiectiv

Construim o vedere reala de audit-ready evidence.

### Task-uri

- [x] model pentru dovezi atașate
- [x] relationare intre:
  - finding
  - remediation
  - drift
  - articol de lege
  - snapshot / baseline
- [x] pagină dedicata Auditor Vault
- [x] timeline cronologic
- [x] export `Audit Pack v2` JSON structurat
- [x] export `Audit Pack` client-facing HTML / PDF
- [x] traceability matrix în `Auditor Vault` și în exportul client-facing
- [x] export `Audit Pack` ZIP / dossier bundle
- [x] confirmare explicită pe control / articol în `traceability matrix`
- [x] confirmare la nivel de grup de controale / articol
- [x] confirmare la nivel de familie de controale
- [x] reuse de dovadă validată în aceeași familie de controale
- [x] note de review reflectate în `Auditor Vault` și în `Audit Pack` client-facing
- [x] linkuri directe din audit catre sectiunea relevantă din `Annex IV lite`
- [x] executive summary
- [x] system register
- [x] controls matrix
- [x] evidence ledger
- [x] drift register
- [x] validation log
- [x] agregare coverage pe articol / control în `Audit Pack`

### Livrabil tehnic

- dovada defensibila, nu doar jurnal brut
- dosar JSON coerent + versiune client-facing printabila

## Epic 8 - Repo Integrations controlate

### Obiectiv

Conectam produsul la schimbari reale din cod fara sa incarcam UX-ul.

### Task-uri

- [x] webhook GitHub pentru fisiere relevante
- [x] webhook GitLab pentru fisiere relevante
- [x] comparație automata pe:
  - manifests
  - compliscan.yaml
- [x] creare snapshot nou la schimbari relevante
- [x] drift alert automat
- [x] workflow de ownership pentru drift:
  - owner preia drift-ul
  - owner îl trece în lucru
  - owner îl rezolvă sau îl marchează waived
  - toate evenimentele intră în audit trail

### Livrabil tehnic

- monitorizare mai aproape de real-time, dar controlata

## Task-uri imediate recomandate

### Acum

- [x] roadmap produs
- [x] task breakdown tehnic
- [x] inceput Libraria de Reguli

### Ultimele 5 task-uri inchise

- [x] `Annex IV lite` client-facing cu anchors și table of contents pe sistem / secțiune
- [x] linkuri directe din `Audit Pack` client-facing către secțiunea relevantă din `Annex IV lite`
- [x] confirmare la nivel de grup de controale / articol în `Traceability Matrix`
- [x] familie de controale cu:
  - confirmare la nivel de familie
  - reuse de dovadă validată
  - summary în `Audit Pack` client-facing
- [x] pre-fill avansat pentru `AI Compliance Pack`:
  - deployment context
  - affected persons summary
  - monitoring summary
  - escalation path
- [x] framing executiv mai bun pentru `Audit Pack` client-facing
- [x] reuse policy mai fină pentru familii de controale:
  - tip de dovadă compatibil
  - grup legal compatibil
  - validare tehnică compatibilă în familiile stricte
- [x] `Audit Pack` client-facing mai clar pentru stakeholder non-tehnic:
  - ce este deja defensibil
  - ce cere atenție înainte de audit
  - ce s-a schimbat față de baseline
- [x] polish executiv pentru `Audit Pack` client-facing:
  - memo executiv de deschidere
  - decision gates pentru semnare / distribuire / baseline
  - owner action register
  - checklist rapid pentru stakeholder
- [x] controale sugerate mai fine în `AI Compliance Pack`:
  - controale derivate din task-uri
  - controale inferate per risc / date / rezidență / oversight
  - prioritate, dovadă și referință legală

### Urmatoarele 5 task-uri concrete recomandate

- [x] implementează `drift escalation matrix`:
  - owner implicit pe tip de drift
  - SLA / due date
  - blocant vs non-blocant pentru baseline / audit
  - dovadă obligatorie pentru rezolvare
- [x] rafinează escaladarea drift `critical` vs `high` în UI și în task-uri
- [x] leagă drift escalation de:
  - remediation task
  - Auditor Vault
  - Audit Pack
- [x] family-level evidence bundle mai puternic:
  - mai multe controale sub aceeași obligație
  - pachet de dovadă reutilizabil cu reguli clare
- [x] conectează fiecare articol/control și în dosarul client-facing final, nu doar în uneltele de audit
- [x] controale sugerate și mai fine pe grupuri de sisteme / familii de controale
- [x] îmbunătățește reuse bundle la nivel de familie cu policy explicită per fișier și per control
- [x] du `Audit Pack` client-facing spre format de dosar executiv extern (cover + anexă + decizii)
