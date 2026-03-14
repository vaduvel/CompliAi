# Harta Navigare + Trasee User CompliScan

Data: 2026-03-14

## Scop

Acest document descrie:

- navigarea reala a aplicatiei, de la intrare pana la toate functionalitatile majore
- traseele concrete ale unui user cand incearca sa faca munca reala
- punctele unde UX-ul actual rupe intelegerea pentru un user nou

Scopul nu este sa descriem design-ul ideal, ci produsul asa cum este acum in cod si in runtime.

## Verdict rapid

Un user nou nu se descurca usor singur in UX-ul actual.

Motivul principal:

- exista o IA buna la nivel de piloni (`Dashboard -> Scanare -> Control -> Dovada -> Setari`)
- dar paginile reale contin prea multe rezumate, explicatii, carduri si micro-flow-uri puse simultan
- `Evidence OS` exista ca limbaj vizual si componente, dar nu controleaza inca cap-coada arhitectura fiecarei pagini

Verdict practic:

- login-ul si shell-ul de baza sunt inteligibile
- dupa intrarea in dashboard, claritatea scade repede
- un user nou intelege ca "sunt multe lucruri aici", dar nu intelege clar "care este primul pas" si "ce trebuie sa fac dupa"

## 1. Puncte de intrare in aplicatie

### 1.1 Landing public

Ruta: `/`

Rol:

- prezinta produsul
- ofera CTA unic: `Intra in Dashboard`

Observatie:

- din landing nu reiese clar structura operationala a produsului
- CTA-ul duce spre `/dashboard`, dar userul neautentificat ajunge in practica la `/login`

### 1.2 Login / Register

Ruta: `/login`

Rol:

- autentificare
- creare cont nou
- creare organizatie noua in acelasi ecran

Observatie:

- nu exista un flow separat de onboarding; `register` este doar un mod in acelasi formular
- pentru un user nou, asta este simplu si acceptabil

## 2. Shell-ul principal dupa login

Dupa autentificare, userul intra in shell-ul de dashboard.

### 2.1 Navigatie primara din sidebar

1. `Dashboard` -> `/dashboard`
2. `Scanare` -> `/dashboard/scanari`
3. `Control` -> `/dashboard/sisteme`
4. `Dovada` -> `/dashboard/checklists`
5. `Setari` -> `/dashboard/setari`

### 2.2 Navigatie secundara pe piloni

#### Scanare

- `Flux scanare` -> `/dashboard/scanari`
- `Documente` -> `/dashboard/documente`

#### Control

- `Sisteme AI` -> `/dashboard/sisteme`
- `Drift` -> `/dashboard/alerte`

#### Dovada

- `Remediere` -> `/dashboard/checklists`
- `Auditor Vault` -> `/dashboard/rapoarte/auditor-vault`
- `Audit si export` -> `/dashboard/rapoarte`

### 2.3 Utilitare care exista, dar nu sunt piloni clari in IA

- `Asistent AI` -> `/dashboard/asistent`
- asistentul mai exista si ca utilitar flotant

Impact UX:

- userul vede 5 piloni in stanga
- dar in runtime exista mai multe suprafete reale decat pare din sidebar
- asta produce drift intre "ce crede userul ca exista" si "ce exista cu adevarat"

## 3. Harta reala a functionalitatilor

| Ruta | Ce crede userul ca este | Ce este de fapt | Actiunea principala | Claritate actuala |
|---|---|---|---|---|
| `/dashboard` | home simplu | overview + drift + next action + snapshot + export + feed | orientare | slaba |
| `/dashboard/scanari` | loc de scanare | selector sursa + ghidaj + flow activ + rezultat + istoric + agent mode | pornire analiza | slaba |
| `/dashboard/documente` | documente | ultimul rezultat + lista scanari | review rezultat / istoric | medie |
| `/dashboard/sisteme` | control | discovery + inventory + baseline + drift + compliance pack + integrari | confirmare sisteme / baseline | slaba |
| `/dashboard/alerte` | alerte | drift lifecycle si actiuni pe drift | decizie umana pe drift | buna |
| `/dashboard/checklists` | checklisturi | remediation board cu dovada si rescan | executie task-uri | buna |
| `/dashboard/rapoarte` | rapoarte | readiness + snapshot + export center | livrabil / export | medie |
| `/dashboard/rapoarte/auditor-vault` | vault | vedere audit-ready cu dovezi, trasabilitate si exporturi | verificare audit | buna |
| `/dashboard/setari` | setari | workspace + integrari + acces + operational + avansat | administrare workspace | medie |
| `/dashboard/asistent` | chat | utilitar conversational pe contextul curent | clarificare / intrebari | buna |

## 4. Traseele reale ale userului

## 4.1 Traseul unui user nou care vrea sa scaneze primul document

### Intentie

"Am un PDF sau un document intern. Vreau sa vad ce riscuri am."

### Traseu

1. Intra pe `/`
2. Apasa `Intra in Dashboard`
3. Daca nu este autentificat, ajunge la `/login`
4. Daca nu are cont, schimba formularul in `Creeaza cont`
5. Dupa creare cont / login, ajunge la `/dashboard`
6. Din dashboard trebuie sa inteleaga ca primul pas real este `Scanare`
7. Intra in `/dashboard/scanari`
8. Alege sursa `Document`
9. Incarca fisierul
10. Revizuieste extractia / OCR
11. Ruleaza analiza
12. Merge in rezultat curent sau in `Documente`
13. Daca exista probleme, merge in `Remediere`
14. Ataseaza dovada
15. Ruleaza rescan / validare
16. Merge in `Audit si export` sau `Auditor Vault`

### Unde se rupe acum

- `/dashboard` nu spune suficient de clar "incepe din Scanare"
- `/dashboard/scanari` are prea multe layere simultan:
  - selector sursa
  - ghidaj
  - sumar flow
  - banner de flux activ
  - workspace real
  - tabs pentru verdict / history
  - mod agent
- userul vede multe explicatii despre scanare, dar nu si un singur punct clar de start

### Verdict pe acest traseu

- userul poate termina traseul daca are rabdare
- userul nou nu il descopera natural, fara ezitare

## 4.2 Traseul unui user nou din engineering care vrea discovery din repo

### Intentie

"Vreau sa detectez sisteme AI din manifest / repo si sa le confirm."

### Traseu

1. Login
2. `Scanare` -> `/dashboard/scanari`
3. Alege `Repo / manifest` sau `compliscan.yaml`
4. Ruleaza autodiscovery
5. Revizuieste rezultatul
6. Muta sistemele curate in `Control`
7. Intra in `/dashboard/sisteme`
8. Lucreaza in `Discovery`
9. Confirma sistemele in `Sisteme AI`
10. Seteaza / valideaza `Baseline`
11. Urmareste `Drift`
12. Daca apar probleme, merge in `Remediere`
13. Dupa remediere, merge in `Audit si export` sau `Auditor Vault`

### Unde se rupe acum

- userul incepe in `Scanare`, dar "adevaratul control" se muta apoi in `Sisteme`
- pagina `Sisteme` are 6 moduri interne:
  - `Discovery`
  - `Sisteme AI`
  - `Baseline`
  - `Drift`
  - `Compliance Pack`
  - `Integrari`
- pentru un user nou, nu e evident:
  - ce trebuie facut in ce ordine
  - ce este parte din executie
  - ce este doar monitorizare sau configurare

### Verdict pe acest traseu

- puternic functional pentru user avansat
- slab descoperibil pentru user nou

## 4.3 Traseul unui user operational care vrea sa inchida task-uri

### Intentie

"Stiu ca exista probleme. Vreau sa le remediez si sa le inchid corect."

### Traseu

1. Login
2. Ajunge in `/dashboard`
3. Vede `Next best action` sau merge direct in `Dovada`
4. Intra in `/dashboard/checklists`
5. Filtreaza task-urile
6. Deschide task-ul relevant
7. Face remedierea
8. Ataseaza dovada
9. Exporta / copieaza instructiuni unde e nevoie
10. Ruleaza rescan / validare
11. Dupa inchidere, verifica `Auditor Vault` sau `Audit si export`

### Ce functioneaza bine

- `Remediere` este una dintre cele mai clare suprafete
- flow-ul "task -> dovada -> rescan" este lizibil

### Ce inca nu e clar

- pentru un user nou, nu este imediat evident de ce exista si `Remediere`, si `Audit si export`, si `Auditor Vault`
- denumirea `Dovada` ca pilon este buna, dar interiorul pilonului cere mai multa clarificare intre executie si livrabil

## 4.4 Traseul unui user de audit / stakeholder

### Intentie

"Vreau sa vad daca dosarul este audit-ready si sa scot artefactele."

### Traseu

1. Login
2. Merge in `/dashboard/rapoarte`
3. Verifica readiness, snapshot si blocaje
4. Genereaza exportul potrivit:
   - PDF
   - ZIP
   - JSON Audit Pack
   - annex
5. Daca are nevoie de trasabilitate, intra in `/dashboard/rapoarte/auditor-vault`
6. Verifica dovezile, gap-urile, maparile legale si traceability

### Observatie

- aici flow-ul este mai logic decat in `Dashboard` sau `Scanare`
- problema este ca userul nou nu intelege repede diferenta dintre:
  - `Audit si export`
  - `Auditor Vault`
  - `Remediere`

## 4.5 Traseul unui owner / admin

### Intentie

"Vreau sa configurez workspace-ul si sa vad daca mediul este operational."

### Traseu

1. Login
2. Intra in `/dashboard/setari`
3. Foloseste tabs:
   - `Workspace`
   - `Integrari`
   - `Acces`
   - `Operational`
   - `Avansat`
4. Verifica baseline-ul
5. Verifica Supabase / repo sync
6. Gestioneaza membri si roluri
7. Verifica health check si release readiness
8. Ajusteaza politicile de drift sau face reset de workspace

### Observatie

- structura interna este mai buna decat pe alte pagini
- totusi, `Setari` concureaza vizual cu pilonii de executie, desi este zona de operare, nu flow principal

## 5. Unde se pierde un user nou

## 5.1 In `Dashboard`

Problema:

- prea multe carduri cu intentie asemanatoare
- overview, drift, snapshot, export, ghidaj si next step sunt afisate simultan

Efect:

- userul vede "multa informatie"
- nu vede clar "ce trebuie sa fac acum"

## 5.2 In `Scanare`

Problema:

- acelasi lucru este explicat de mai multe ori
- exista mai multe moduri paralele pe aceeasi suprafata

Efect:

- userul nu intelege care este workspace-ul real
- UX-ul pare mai degraba "documentatie despre scanare" decat "un flow de scanare"

## 5.3 In `Control`

Problema:

- discovery, inventory, baseline, drift, pack si integrari sunt grupate intr-o singura pagina

Efect:

- pagina devine puternica, dar greu de invatat
- ordinea muncii nu este auto-explicata

## 5.4 In pilonul `Dovada`

Problema:

- executia, readiness-ul de audit si vault-ul sunt separate corect conceptual
- dar pentru userul nou denumirile sunt inca prea apropiate

Efect:

- userul nu stie repede unde merge pentru:
  - a repara
  - a verifica
  - a exporta

## 5.5 In raport cu `Asistent`

Problema:

- exista ca utilitar si pagina separata
- dar nu este explicat suficient cum se raporteaza la flow-ul principal

Efect:

- userul poate confunda asistentul cu suprafata principala de lucru, desi el ar trebui sa fie suport, nu pilon operational

## 6. Ce trebuia sa faca Evidence OS si ce face acum in practica

### Ce trebuia sa faca

Conform documentelor interne, `Evidence OS` trebuia sa impuna:

- shell clar
- progressive disclosure
- flow principal unic
- separare clara intre sumar, detaliu si executie
- disciplina de suprafata, nu doar disciplina de stil

### Ce face acum in practica

In implementarea actuala, `Evidence OS` a reusit bine:

- primitive
- carduri
- badge-uri
- tabs
- look and feel
- componente canonice pentru workspace-ul agentic

Dar nu a preluat complet controlul asupra:

- shell-ului principal
- arhitecturii paginilor mari
- ordinii informationale in `Dashboard`
- flow-ului unificat din `Scanare`

Concluzie:

`Evidence OS` exista astazi mai mult ca design language + component layer, si doar partial ca UX architecture layer.

## 7. Poate un user nou sa se descurce?

Raspuns scurt:

- partial, dar nu fluent

### Poate face asta:

- sa intre in aplicatie
- sa se logheze sau sa-si creeze cont
- sa vada pilonii principali
- sa ajunga intr-o zona functionala daca este ghidat verbal

### Nu poate face usor asta:

- sa inteleaga repede diferenta dintre overview si executie
- sa inteleaga singur ordinea corecta a pasilor
- sa stie fara dubiu unde incepe munca reala
- sa faca distinctia instant intre `Remediere`, `Audit si export` si `Auditor Vault`

## 8. Verdict final de discoverability

### Ce este bun

- IA top-level este buna
- pilonii principali sunt corecti
- exista flow-ul de domeniu corect in spate:
  - sursa
  - verdict
  - remediere
  - dovada
  - audit

### Ce este prost acum

- paginile sunt supra-incarcate
- multe suprafete combina overview + instructiuni + executie + export
- acelasi pas este explicat de mai multe ori
- userul nou nu este dus ferm din A in B in C

### Concluzie executiva

Nu avem o problema de lipsa de functionalitate.

Avem o problema de orchestration UX:

- prea multe lucruri valide local
- prea putina ierarhie de ecran
- prea putina separare intre home, flow activ, rezultat, control si livrabil

Pe scurt:

un user nou poate folosi produsul doar cu suport sau cu mult trial-and-error; nu il poate "citi" natural din prima.
