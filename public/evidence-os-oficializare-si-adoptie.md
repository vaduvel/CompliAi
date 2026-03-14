# Evidence OS - oficializare si adoptie

Data: 2026-03-14

## Scop

Acest document fixeaza cum facem ca `Evidence OS` sa devina:

1. design system oficial pentru suprafetele aprobate
2. sursa canonica de UI pentru workflow-urile agentice
3. baza de extindere controlata peste cockpit-ul mare

Nu vrem doar "mai mult UI nou".

Vrem:

- un singur adevar vizual
- o singura semantica pentru status, severitate si review
- o migrare clara, fara dubla mentenanta
- o regula simpla: componentele noi nu mai apar in paralel in 2 locuri

## Ce inseamna "oficial"

`Evidence OS` devine oficial cand sunt adevarate simultan urmatoarele:

1. design-ul canonic sta in documentul oficial:
   - `public/evidence-os-design-system-v1.md`
2. token-urile canonice ale suprafetei `Evidence OS` stau in:
   - `app/evidence-os.css`
3. primitivele canonice stau in:
   - `components/evidence-os/Badge.tsx`
   - `components/evidence-os/Button.tsx`
   - `components/evidence-os/Card.tsx`
   - `components/evidence-os/Tabs.tsx`
4. componentele compuse si semantice stau in:
   - `components/evidence-os/*`
5. adaptoarele runtime nu mai au stilizare proprie, ci doar wiring subtire
6. suprafetele migrate nu mai introduc componente UI concurente in:
   - `components/compliscan/*`
   - `lib/compliance/*`
7. produsul trece:
   - `npm test`
   - `npm run lint`
   - `npm run build`

Pe scurt:

- design system oficial = sursa canonica + regula de adoptie + disciplina de runtime

## Surse de adevar

### 1. Sursa canonica de design

Documentul oficial este:

- `public/evidence-os-design-system-v1.md`

Acesta defineste:

- principii
- ton
- ierarhie
- culori
- spacing
- badge semantics
- directie Romanian-first

### 2. Sursa canonica de implementare UI

Implementarea canonica este:

- `app/evidence-os.css`
- `components/evidence-os/*`

Acestea sunt sursa de adevar pentru:

- token-uri `eos-*`
- primitive
- badge-uri semantice
- carduri
- panel-uri
- layout-uri agentice

### 3. Documente suport, nu sursa oficiala

Acestea ajuta, dar nu sunt adevarul final:

- `public/compliscan-evidence-os-ds-spec.md`
- `components/evidence-os/evidence-os-integration-map.md`
- `components/evidence-os/ui-audit-backlog.md`
- `components/evidence-os/evidence-os-worklog.md`

Rolul lor:

- clarifica
- planifica
- auditeaza

Nu au voie sa bata sursa oficiala.

### 4. Document explicit deprecated

`public/compliscan-evidence-os-ds-spec.md` este de acum:

- document deprecated
- referinta istorica / exploratorie
- nefolosit ca sursa pentru implementari noi

Decizia este deliberata:

- nu mai tinem doua directii vizuale concurente
- `v1` ramane singura baza canonica
- `v1` se maturizeaza incremental prin adoptie si audit, nu prin coexistenta cu `v2`

## Regula de ownership

### Codex principal

Detine:

- validarea canonica
- auditul de integrare
- runtime-ul critic
- paginile mari din cockpit
- documentele oficiale de control

Doar Codex principal poate spune:

- "asta devine oficial"
- "asta devine deprecated"
- "asta intra peste cockpit-ul mare"

### Codex secundar

Poate livra:

- componente noi in `components/evidence-os/*`
- convergenta vizuala
- polish pe suprafata aprobata
- adaptoare UI subtiri

Dar nu poate singur declara oficializarea.

## Regula de migrare

Orice suprafata intra in `Evidence OS` in ordinea:

1. tokens
2. primitive
3. componente semantice
4. componente compuse
5. wiring runtime
6. audit
7. validare completa

Nu in ordinea:

1. "facem repede un nou card"
2. "vedem mai tarziu daca il punem in DS"

## Ce deprecăm

Pe masura ce `Evidence OS` intra oficial, urmatoarele tipuri de implementari devin interzise pe suprafetele migrate:

1. badge-uri locale cu mapari noi de status/severity in pagini
2. carduri duplicate in `lib/compliance/*` cu stilizare proprie
3. token-uri locale introduse ad-hoc pentru aceeasi semantica
4. microcopy paralel pentru aceleasi concepte de review, drift, dovada, validare

### Stare actuala

Acum trebuie tratate ca legacy controlat:

- `lib/compliance/IntakeSystemCard.tsx`
- `lib/compliance/FindingProposalCard.tsx`
- `lib/compliance/DriftProposalCard.tsx`

Acceptate doar ca:

- re-export
- wrapper foarte subtire

Nu ca loc nou de design.

## Valurile de adoptie

## Val 0 - oficializare pe hartie si reguli

Scop:

- fixam adevarul
- fixam ownership-ul
- fixam criteriile de "gata"

Rezultat:

- nu mai discutam "care spec e adevarata"
- nu mai deschidem componente concurente

Stare:

- se inchide prin acest document

## Val 1 - suprafata agentica si shell-ul local

Suprafete:

- `components/evidence-os/*`
- `app/dashboard/asistent/page.tsx`
- `lib/compliance/agent-workspace.tsx`
- adaptoarele subtiri pentru carduri

Obiectiv:

- workspace-ul agentic sa foloseasca `Evidence OS` ca sursa implicita, nu optionala

Criterii de inchidere:

1. adaptoarele runtime sunt subtiri
2. layout-urile agentice folosesc componente canonice
3. copy Romanian-first este coerent
4. nu exista duplicate vizuale concurente in runtime-ul agentic

Stare:

- inchis

## Val 2 - cockpit operational apropiat de agent workflow

Suprafete:

- `components/compliscan/risk-header.tsx`
- `components/compliscan/route-sections.tsx`
- `components/compliscan/task-card.tsx`
- `components/compliscan/next-best-action.tsx`
- `components/compliscan/floating-assistant.tsx`
- `components/compliscan/remediation-board.tsx`
- `components/compliscan/export-center.tsx`

Obiectiv:

- cockpit-ul sa nu mai para un alt produs fata de `Evidence OS`

Criterii de inchidere:

1. ierarhia, spacing-ul si CTA-urile urmeaza aceeasi logica
2. badge semantics sunt aliniate cu `Evidence OS`
3. overflow si mobile safety sunt rezolvate
4. nu se pierde semnal operational critic in compactare

Stare:

- inchis operational
- canonizare suficienta pentru a fi tratat drept inchis, cu legacy justificat ramas doar unde nu exista inca echivalent canonic clar

## Val 3 - pagini mari din cockpit

Suprafete:

- `app/dashboard/scanari/*`
- `app/dashboard/alerte/page.tsx`
- `app/dashboard/rapoarte/*`
- `app/dashboard/setari/*`

Obiectiv:

- produsul mare sa aiba un singur limbaj vizual si operational

Criterii de inchidere:

1. empty states, loading states, badges, CTA hierarchy si status language sunt coerente
2. niciuna din pagini nu introduce din nou primitive paralele
3. exporturile, auditul si setarile par acelasi sistem, nu trei insule

Stare:

- inchis operational
- `Alerte`, `Rapoarte`, `Auditor Vault`, `Setari` si `Scanari` folosesc acum primitive canonice `Evidence OS` pe suprafetele lor proprii
- legacy-ul ramas este justificat si de suport:
  - `Alert`
  - `Progress`
  - `Avatar`
  - `ScrollArea`

## Val 4 - guvernanta permanenta

Obiectiv:

- sa nu regreseze dupa integrare

Reguli:

1. orice componenta noua user-facing verifica mai intai daca exista echivalent in `components/evidence-os/*`
2. daca nu exista, se adauga acolo intai
3. abia dupa se consuma in cockpit
4. niciun nou status badge nu se inventeaza local daca semantic exista deja

## Ce inseamna "integrat peste tot"

In sens sanatos, asta nu inseamna:

- ca fiecare pagina trebuie redesenata radical
- ca `Evidence OS` trebuie sa rescrie tot produsul

Inseamna:

1. acelasi vocabular vizual
2. aceeasi semantica de status si review
3. aceeasi ierarhie a actiunilor
4. aceeasi disciplina pe cards, badges, panels si states
5. niciun UI paralel care sa concureze cu sistemul oficial

## Checklist de oficializare

Putem spune "Evidence OS este DS oficial" cand bifam:

- [x] `public/evidence-os-design-system-v1.md` este referinta oficiala acceptata
- [x] `app/evidence-os.css` este sursa canonica pentru token-urile `Evidence OS`
- [x] `components/evidence-os/*` este biblioteca canonica pentru suprafata agentica
- [x] adaptoarele runtime sunt doar subtiri
- [x] cockpit-ul apropiat de agent workflow este aliniat vizual si semantic
- [x] backlog-ul local de UI nu mai cere restructurare de baza, doar polish pentru `Val 1` si `Val 2`
- [x] validarea completa trece
- [x] `Val 3` este inchis complet

## Ordinea corecta de lucru de acum

1. inchidem Val 1 complet
2. inchidem Val 2 pe suprafata deja atinsa
3. facem polish final Sprint 1-7 pe baza unificata
4. revalidam backlog-ul parcat intentionat
5. facem audit de arhitectura si implementare
6. abia apoi decidem daca extindem oficial `Evidence OS` pe restul cockpit-ului mare

## Decizia de produs

`Evidence OS` nu mai este doar un experiment de UI.

De acum il tratam ca:

- design system oficial pentru suprafata agentica
- sistem canonic in extindere controlata peste produs

Officializarea completa peste tot in cockpit s-a facut prin:

- valuri de adoptie
- audit
- validare
- interzicerea duplicatelor locale
