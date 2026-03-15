# Task Codex 2 - `Rapoarte` wave 1

Data: 2026-03-15

## Context

Valul scurt pe `Scanare` a fost inchis cu separare mai clara intre:

- `flow`
- `Verdicts`
- `Istoric documente`

Auditul urmatorului pas scurt a ales:

- `/dashboard/rapoarte`

Motivul este simplu:

- pagina ramane inca la claritate `medie`
- este urmatorul handoff natural dupa `Remediere`
- are impact real in lantul canonic:
  - `sursa -> verdict -> remediere -> dovada -> audit`

## Obiectiv

Clarifici `Audit si export` ca pagina de:

- snapshot
- readiness
- export

Nu o tratezi ca:

- board de remediere
- workspace de executie
- ledger complet de audit

## Suprafata permisa

Poti intra doar in:

- `app/dashboard/rapoarte/page.tsx`
- `components/evidence-os/*` doar daca lipseste o primitiva mica necesara pentru compozitie
- `app/evidence-os.css` doar daca este nevoie de un utilitar local mic
- `components/evidence-os/ui-audit-backlog.md`
- `components/evidence-os/evidence-os-worklog.md`

Nu atingi:

- `app/dashboard/checklists/*`
- `app/dashboard/rapoarte/auditor-vault/*`
- `app/dashboard/scanari/*`
- `app/dashboard/setari/*`
- `navigation`
- `route-sections`
- `use-cockpit`
- `app/api/*`
- `lib/*`

## Ce trebuie sa faci

### 1. Clarifici intentia dominanta a paginii

Pagina trebuie sa raspunda imediat la:

- ce verific aici
- ce export aici
- ce NU fac aici

`PageIntro` trebuie sa spuna explicit:

- aici verifici snapshot-ul si readiness-ul
- aici pregatesti exportul
- remedierea ramane in `Remediere`
- ledger-ul complet ramane in `Auditor Vault`

### 2. Separi strict `summary / detail / action`

Tinta de compozitie:

- `summary`
  - readiness
  - snapshot curent
  - stare scurta de livrabil
- `detail`
  - breakdown-uri necesare pentru verificare
  - fara ton de executie operationala
- `action`
  - un singur cluster clar pentru export
  - handoff explicit spre `Remediere` sau `Auditor Vault` daca lipseste ceva

### 3. Elimini orice rest de limbaj de remediere din pagina

Nu trebuie sa mai para ca:

- inchizi task-uri aici
- atasezi dovezi aici
- validezi baseline aici

Daca exista handoff-uri, ele raman doar:

- spre `Remediere`
- spre `Auditor Vault`

### 4. Pastrezi valul scurt

Nu faci:

- redesign mare
- split de ruta
- mutari de business logic
- schimbari de flow operational

Valul este de convergenta si clarificare, nu de rescriere.

## Review focus

- pagina se simte `Audit si export`, nu pagina hibrida
- exporturile sunt vizibile, dar nu sufoca snapshot-ul
- handoff-ul catre `Remediere` si `Auditor Vault` este explicit
- componentele `Evidence OS` sunt folosite ca `page system`, nu doar ca skin

## Validare

Rulezi:

- `npm run lint`
- `npm run build`

## Predare

La final predai:

- lista exacta de fisiere atinse
- ce ai clarificat in `Rapoarte`
- ce a ramas intentionat in afara valului
- confirmarea ca nu ai atins `Checklists`, `Auditor Vault`, `app/api/*` sau `lib/*`
