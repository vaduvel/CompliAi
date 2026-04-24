# CLAUDE-RULES.md — Legi și reguli obligatorii pentru agent

> **Contractul meu de comportament pe proiectul CompliAI.**
> Dacă încalc orice regulă din acest document, utilizatorul are dreptul să revert imediat + să reseteze sesiunea.

**Data**: 2026-04-20
**Aplicabilitate**: orice sesiune Claude Code pe `/Users/vaduvageorge/Desktop/CompliAI`

---

## 0. DEFINIȚIA "SMART RETHINKING" (ce cere user-ul)

User **NU** vrea:
- ❌ Rescriere aplicație
- ❌ Ștergere fișiere / module / pagini / endpoints
- ❌ Refactor "while I'm at it"
- ❌ "Optimizări" neautorizate

User **VREA**:
- ✅ **REARANJARE** — cum sunt organizate paginile în sidebar (IA)
- ✅ **RELINK** — cum user-ul navighează între ele (UX flow)
- ✅ **RESKIN** — cum arată vizual (UI polish prin design system)
- ✅ **PĂSTRARE 100%** — toate 76 pagini, 194 endpoints, 86 componente rămân ACTIVE

**Cu alte cuvinte**: produsul există. Funcționează. Are features. Doar aranjarea/aspectul sunt slabe. Le îmbunătățim **fără să distrugem nimic**.

---

## 1. LEGI ABSOLUTE — NU POT FI ÎNCĂLCATE

### LEGEA 1 — ZERO DELETE
**Nu șterg niciun fișier din repo.** Niciodată.
- Fără `rm`, fără `git rm`, fără `Delete: {...}` în Edit.
- Dacă cred că un fișier e orfan / mort / obsolet → **raportez**, nu șterg.
- Singura excepție: fișiere pe care **eu însumi** le-am creat în această sesiune (și tu aprobi ștergerea).

### LEGEA 2 — ZERO REGRESIUNE DE ACCESIBILITATE
**Dacă scot un link din sidebar, pagina trebuie să primească un alt link înainte** — niciodată pagini orfane.
- Exemplu greșit: șterg "Module conformitate" (Fiscal + NIS2) din sidebar fără să le mut în altă secțiune.
- Corect: întâi adaug grupul "Monitorizare" cu sub-linkuri, apoi scot vechiul link.

### LEGEA 3 — ZERO "WHILE I'M AT IT"
**Fac exact ce s-a cerut. Nimic în plus.**
- Dacă task-ul e "refactor nav-config", refactor NAV-CONFIG. NU editez stiluri, NU scot importuri "neutilizate", NU rearanjez imports.
- Dacă văd ceva ce cred că e greșit în afara scope-ului: **raportez**, nu ating.

### LEGEA 4 — 1 EDIT = 1 APROBARE EXPLICITĂ
**Înainte de fiecare `Edit` sau `Write` pe cod al user-ului, cer aprobare.**
- Format: "Pot să modific `X.tsx` linia Y pentru a înlocui `A` cu `B`? [Y/N]"
- Fără aprobare → nu execut.
- Excepție: fișiere în `/docs/`, fișiere în `/tmp/`, fișiere `.bak`, și fișiere pe care eu le-am creat în această sesiune.

### LEGEA 5 — DIFF PREVIEW ÎNAINTE DE EDIT
**Arăt diff-ul propus înainte de a aplica.**
- Ce înlocuiesc (old_string)
- Ce devine (new_string)
- De ce
- Ce rămâne neschimbat

### LEGEA 6 — REVERT PE COMANDĂ
**Când user zice "revert" / "stop" / "nu" / "pauze" → revert imediat.**
- Fără să justific
- Fără să negociez
- Fără să explic că "asta era corect"
- `git checkout -- <file>` pe tot ce am modificat în acea sesiune.

### LEGEA 7 — INVENTORY ÎNAINTE DE TOUCH
**Înainte să modific un fișier mare (>200 linii), fac inventar obligatoriu:**
- Ce funcții/features conține (listă markdown)
- Ce dependențe are (imports, hooks, context)
- Ce edge cases are (empty state, error state, loading state)
- Post-editare: **verific fiecare punct** că e încă intact.

### LEGEA 8 — NU RESCRIU COMPONENTE MATURE
**Componentele existente cu logic complex (ex: portfolio-overview-client.tsx 992 linii) se modifică IN-PLACE.**
- Nu creez `X-v2.tsx` alternativ care pierde features.
- Dacă trebuie rescris, rescriu IN-PLACE bucată cu bucată, cu inventar la fiecare pas.

### LEGEA 9 — BUILD CLEAN OBLIGATORIU
**După orice grup de modificări: `npm run build`.** Dacă iese cu eroare → revert imediat.
- Nu merg la task-ul următor cu build spart.

### LEGEA 10 — RAPORT PER ETAPĂ, NU "VOI FACE"
**Raportez ce am făcut, nu ce VOI face.**
- Fără "acum voi refactor X". În loc: "Am editat X. Am înlocuit A cu B. Build clean. Aștept next step."
- User vede evidențe, nu promisiuni.

---

## 2. REGULI DE EXECUȚIE — PROTOCOL ZILNIC

### 2.1 Înainte de orice task
1. Re-citesc `CLAUDE-RULES.md` (acest document)
2. Re-citesc task-ul exact cum l-a formulat user-ul
3. Întreb: "am înțeles corect? vrei să fac X = [descriere concretă]?" — aștept Y/N

### 2.2 Per modificare
1. Identific fișierul țintă
2. Inventory (dacă >200 linii)
3. Diff preview în chat
4. Aștept Y/N
5. Edit
6. Build test
7. Raport factual

### 2.3 Per fază (batch de 3-5 modificări)
1. La sfârșit: `git status --short`
2. Raport: ce fișiere s-au schimbat, ce features adăugate, 0 features pierdute, build OK
3. Aștept green-light pentru faza următoare

### 2.4 Când ies din scope
Dacă în timpul task-ului văd:
- Alt bug
- Alt mod mai bun de rearanjat
- Altă oportunitate

→ **RAPORTEZ** în notă separată: "În timp ce făceam X, am observat Y. Nu am atins. Vrei să mă uit la Y după?"

---

## 3. CE ÎNSEAMNĂ "BETTER ARHITECTURĂ" CONCRET

User vrea **rearanjare**, nu **rescriere**. Iată diferența:

### Exemple GREȘIT (ce am făcut în trecut)
| Task user | Ce am făcut greșit |
|---|---|
| "Refactor nav-config per canon" | Am șters `MODULE_NAV_ITEMS` → Fiscal + NIS2 au devenit orfane |
| "Aplică design system" | Am creat `portfolio-v2.tsx` cu 40% features lipsă |
| "Redenumeste labelul sidebar" | Am schimbat și ordinea + stil + adăugat ce nu exista |

### Exemple CORECT
| Task user | Cum ar trebui să execut |
|---|---|
| "Refactor nav-config per canon" | Schimb label-urile conform canon. Dacă canon elimină o secțiune, MUT itemii la altă secțiune ÎNAINTE de a scoate secțiunea. Zero orfane. |
| "Aplică design system" | Edit IN-PLACE pe componenta existentă: schimb `className` + `style` la tokens DS. Nu scriu componentă alternativă. Nu scot features. |
| "Redenumeste labelul sidebar" | Doar label. Nu ating structura, ordinea, culoarea, iconul. |

---

## 4. PROCESE DE REVIZIE — CE VERIFICĂ USER-UL

Înainte să spui "ok, mergem mai departe", user-ul va verifica:
- [ ] Sidebar-ul arată toate linkurile care erau înainte (poate reagrupate, dar **toate sunt acolo**)?
- [ ] Toate paginile care erau accesibile sunt încă accesibile (prin link sau redirect)?
- [ ] Toate features-urile din componenta modificată funcționează (nu doar randare, ci interacțiuni reale)?
- [ ] Build OK + fără warning-uri noi?
- [ ] `git diff` arată doar ce am anunțat?

Dacă vreunul din aceste puncte **nu** e OK → revert automat.

---

## 5. CE FAC CÂND SUNT NESIGUR

Dacă nu știu cum să execut ceva sau task-ul e ambiguu:
- **NU ghici**
- **NU "proceed with best judgment"**
- **NU "make reasonable assumptions"**

În loc → **ÎNTREB** concret:
- "În DESTINATION §2.1 scrie X, dar în codul actual e Y. Care e varianta corectă pentru tine?"
- "Canon spune `/monitorizare/nis2`, dar acel folder nu există încă. Să-l creez? (aia e Ziua 3 în gantt). Pentru Ziua 1, păstrez link-ul la `/dashboard/nis2`?"

---

## 6. CE NU POT FACE (LIMITE EXPLICITE)

1. ❌ Nu șterg fișiere ale user-ului (nici dacă par dead code)
2. ❌ Nu creez fișiere `*-v2.tsx`, `*-new.tsx`, `*-refactored.tsx` (migrări in-place only)
3. ❌ Nu modific `next.config.ts`, `vercel.json`, `package.json`, schema DB fără aprobare explicită
4. ❌ Nu fac `git push`, nu fac `vercel deploy`
5. ❌ Nu modific API contracts (response shapes, request bodies) fără aprobare
6. ❌ Nu schimb logic de business (fetch, mutation, state) când task-ul e UI
7. ❌ Nu scriu documente lungi fără să fie cerute explicit
8. ❌ Nu creez componente "primitive" noi dacă nu s-a cerut pattern nou

---

## 7. ANGAJAMENT FINAL

> Mă angajez să respect aceste 10 legi + protocol + limite.
>
> Dacă observi că încalc oricare dintre ele — ai dreptul să revert sesiunea completă și să ștergi tot ce am produs.
>
> Nu-mi apar din greșeli. Accept revert fără discuție.

---

> **END CLAUDE-RULES.md v1.0** — 2026-04-20.
> Re-citit la începutul fiecărei sesiuni. Orice schimbare la aceste reguli necesită aprobare explicită user.
