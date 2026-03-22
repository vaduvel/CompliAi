# PLAN DE EXECUTIE CLEANUP V2

Data: `2026-03-22`
Repo: `CompliAI`
Baza:

- `docs/MASTER-AUDIT-CANONIC-2026-03-22.md`
- `docs/final-guide-plan/02-ux-ia-blueprint.md`
- `docs/final-guide-plan/04-implementation-reference-eos-v1.md`

---

## Decizia

Salvam produsul prin:

- curatare structurala pe `main`
- subtracție, nu adaugare
- pastrarea `Evidence OS v1`
- pastrarea backend-ului si Automation Layer

Nu facem:

- redesign nou
- revenire la `Wave 0 / DS v2`
- rescriere de backend
- feature work UX nou pana nu curatam runtime-ul

---

## Reguli

- o pagina = o intentie dominanta
- un CTA principal per pagina
- suportul sta sub fold, in tabs sau disclosure
- nu amestecam shell nou cu corp vechi
- nu stergem branchuri sau worktree-uri inainte de clasificare

---

## Branch de lucru

Nu lucram direct pe `main`.

```bash
git checkout main
git pull origin main
git checkout -b codex/runtime-canon-cleanup
```

Tot cleanup-ul intra pe:

- `codex/runtime-canon-cleanup`

---

## Faza 0 — Audit si clasificare `codex/eos-v1-blueprint-main`

Aceasta faza este **doar audit**, nu delete.

### Obiectiv

Sa decidem ce merita extras din `codex/eos-v1-blueprint-main` in cleanup-ul canonic.

### Ce trebuie facut

1. Inspecteaza cele `5` commituri `ahead` fata de remote:

```bash
git log origin/codex/eos-v1-blueprint-main..codex/eos-v1-blueprint-main --oneline
```

2. Pentru fiecare commit, marcheaza unul din:

- `keep pentru cleanup`
- `deja in main`
- `exploratoriu / nu folosim`

3. Raporteaza pentru fiecare:

- `hash`
- `mesaj`
- `verdict`
- `motiv scurt`

4. Verifica daca exista fisiere necomise in worktree-ul lui.

5. **Nu** face inca:

- `git branch -D codex/eos-v1-blueprint-main`
- `git worktree remove /private/tmp/compliai-eos-v1-blueprint`

### Definition of done

Faza 0 este terminata doar cand exista o lista clara:

- ce cherry-pick-uim in `codex/runtime-canon-cleanup`
- ce ignoram
- ce se poate inchide dupa extractie

---

## Faza 1 — Curatenie git controlata

Curatenia git incepe abia dupa ce Faza 0 e incheiata.

### 1.1 Worktree-uri

Inventariem:

```bash
git worktree list
```

Clasificare per worktree:

- `keep`
- `archive`
- `delete`

Regula:

- worktree-urile curate si inutile se pot sterge
- worktree-urile cu modificari se inspecteaza inainte
- workspace-ul principal nu se sterge

### 1.2 Branchuri

Clasificare per branch:

- `canon activ`
- `auxiliar util`
- `istoric`
- `de sters`

Regula:

- nu stergem un branch pana nu confirmam ca nu contine nimic util neextras

### 1.3 Docs neversionate

Tinta:

- `MASTER-AUDIT-CANONIC-2026-03-22.md` = canon
- `AUDIT-COMPLET-COMPLIAI.md` = anexa tehnica
- `inventar-total-stare-proiect-2026-03-21.md` = sursa istorica importanta

Fișierele duplicate sau de tip `(1)` se inspecteaza si se sterg doar daca sunt duplicate reale.

---

## Faza 2 — Curatenie rute si navigatie

### Obiectiv

Sa ramana vizibil doar canonul nou:

- `Acasa`
- `Scaneaza`
- `De rezolvat`
- `Rapoarte`
- `Setari`

### Reguli

- rutele extra devin redirect doar daca exista suprafata canonica echivalenta
- nu folosim query params speculative daca pagina tinta nu le sustine deja
- `Control` si `Dovada` dispar din navigatia principala

### Rezultat

- 5 pagini principale vizibile
- rutele vechi functioneaza doar ca pod

---

## Faza 3 — Surgery pe pagini

Ordine stricta:

1. `De rezolvat`
2. `Acasa`
3. `Rapoarte`
4. `Setari`
5. `Scaneaza`

### 3.1 De rezolvat — P0

Tinta:

- header simplu
- filter tabs
- finding queue
- resolution inline

Se taie:

- board-uri paralele
- summary-uri concurente
- CTA-uri multiple
- trimiteri vizuale inutile spre alte suprafete

### 3.2 Acasa — P0

Tinta:

- status
- next best action
- score / health compact

Se taie:

- onboarding amestecat in dashboard
- summary-uri duplicate
- blocuri suport in prim-plan

### 3.3 Rapoarte — P1

Tinta:

- export principal
- sub-tabs pentru rest

### 3.4 Setari — P1

Tinta:

- tabs administrative
- continut scurt, operational

### 3.5 Scaneaza — P2

Tinta:

- source selector
- upload / review
- activ / istoric

---

## Faza 4 — Docs si cleanup final

### Ce devine canon

- `docs/MASTER-AUDIT-CANONIC-2026-03-22.md`
- `docs/final-guide-plan/02-ux-ia-blueprint.md`
- `docs/final-guide-plan/04-implementation-reference-eos-v1.md`

### Ce ramane anexa

- `docs/AUDIT-COMPLET-COMPLIAI.md`
- `docs/inventar-total-stare-proiect-2026-03-21.md`

### Ce se arhiveaza

- docs istorice care descriu shell-ul vechi, dupa verificare de referinte

### Componente orfane

Se sterg doar dupa confirmare reala de neutilizare.

---

## Validare

Minim dupa fiecare faza cu impact runtime:

```bash
npm run lint
```

Daca atingem routing, state, imports sau suprafete sensibile:

```bash
npm test
npm run build
```

---

## Mesaj operativ pentru Claude

Poti incepe, dar executi in ordinea asta:

1. Faza 0 = audit + clasificare, fara delete
2. Raport pe cele 5 commituri `ahead`
3. Doar dupa aprobare:
   - cherry-pick in `codex/runtime-canon-cleanup`
   - inchidere branch/worktree inutil
4. Abia apoi intri in curatarea de rute si pagini

Regula cheie:

`Nu stergi nimic pana nu clasifici daca e keep / already in main / exploratoriu.`

