# CLAUDE-CODE-REDESIGN-ENTRYPOINT-2026-04-23.md

Status: `entrypoint for external redesign work`
Date: `2026-04-23`
Audience: `Claude Code / Claude Design / orice model extern care primeste acces la codul CompliAI`

> Daca vrei sa dai acces larg la cod unui model extern fara sa piarda directia produsului, incepe cu acest document.
> Nu este un simplu design brief. Este contractul de lucru pentru redesign peste un produs existent, cu functionalitate reala.

---

## 1. Ce vrem de fapt

Nu vrem ca modelul sa reinventeze produsul.

Vrem ca modelul:

- sa inteleaga aplicatia cap-coada
- sa inteleaga pentru cine este facuta
- sa inteleaga cum este folosita azi
- sa identifice unde UX/IA/UI impiedica folosirea corecta
- sa propuna un runtime mai clar, mai coerent si mai usor de operat
- fara sa rescrie backend-ul si fara sa taie functionalitati reale

Pe scurt:

**codul exista deja, functionalitatile exista deja, dar experienta trebuie remapata si ridicata.**

---

## 2. Ce este CompliAI

CompliAI este un sistem operational de compliance pentru Romania.

Nu este:

- ERP
- CRM
- chat app
- simplu dashboard de scoruri
- generator de documente izolat

Este un produs care:

- colecteaza semnale compliance
- determina ce i se aplica unei firme
- genereaza findings reale
- le prioritizeaza
- ghideaza rezolvarea lor
- colecteaza dovezi
- genereaza documente si pachete audit-shaped
- mentine monitorizarea dupa rezolvare

Framework-uri si zone majore:

- GDPR
- e-Factura / fiscal / ANAF
- NIS2
- AI Act
- vendor review
- whistleblowing
- DSAR
- DORA
- Pay Transparency
- rapoarte si audit packs

---

## 3. Cine este userul principal

### Persona principala: Diana

Diana este:

- consultant / contabil / operator partener
- gestioneaza `10-30` clienti SRL
- lucreaza zilnic cross-client
- intra in firma doar cand trebuie sa execute ceva concret
- are nevoie de claritate, scanabilitate si densitate controlata
- nu are nevoie de UI spectaculos, ci de control operational

Ce face Diana in realitate:

- dimineata verifica ce a aparut peste noapte
- triaza alerte cross-client
- intra in contextul unui client doar cand are un caz real
- rezolva un finding sau genereaza un document
- la final de saptamana / luna exporta rapoarte si dovezi

Alte persona:

- `Radu` — compliance intern, are nevoie de profunzime pe framework-uri si exporturi
- `Mihai` — solo / owner, are nevoie de o varianta mai simpla si mai ghidata

---

## 4. Cele 2 contexte reale ale produsului

Aplicatia are 2 contexte reale si ele nu trebuie amestecate:

### A. `Portofoliu · triaj`

Context cross-client:

- lista firme
- alerte cross-firma
- drill-in pe firma
- task-uri / remedieri agregate
- furnizori agregati
- rapoarte batch

### B. `Execuție în firmă`

Context per-firma:

- dashboard / overview
- scanare
- monitorizare
- actiuni
- cockpit pe finding
- dosar / rapoarte
- setari

Regula mare:

**Portofoliu este pentru triage. Execuție în firmă este pentru lucru concret.**

---

## 5. Unitatea operationala centrala: finding-ul

CompliAI nu se foloseste bine daca este gandit ca un produs de pagini.

Se foloseste bine doar daca este gandit ca un produs al carui obiect operational central este:

- `finding-ul`

Un finding:

- vine dintr-un scan, monitorizare, workflow specializat sau regula de sistem
- are severitate
- are context legal / operational
- cere o rezolvare
- poate cere document, dovada, aprobare sau revalidare
- se inchide sau intra in monitorizare

Consecinta pentru redesign:

**cand finding-ul este deja cunoscut, userul nu trebuie plimbat prin 3-4 suprafete care repeta acelasi lucru.**

---

## 6. Problema mare de UX de rezolvat

Azi exista cazuri in care userul vede acelasi finding in mai multe suprafete:

1. `Portofoliu / Alerte`
2. `Context firmă`
3. `Dashboard firmă`
4. `De rezolvat`
5. `Cockpit`

Aceasta este una dintre rupturile mari ale produsului.

Redesignul bun trebuie sa rezolve exact asta:

- sa reduca ping-pong-ul
- sa evite dashboarduri intermediare inutile
- sa faca traseul spre cazul concret mai scurt
- sa pastreze overview-ul acolo unde chiar are sens

Tinta:

- daca finding-ul este cunoscut, traseul trebuie sa fie cat mai direct spre cockpit
- listele si dashboardurile intermediare trebuie sa ramana doar cand sunt cu adevarat utile

---

## 7. Ce trebuie sa inteleaga modelul despre cod

Repo-ul contine deja foarte multa functionalitate reala.

Deci task-ul NU este:

- sa inventeze un produs nou
- sa simplifice prin stergere
- sa transforme totul in mockup decorativ

Task-ul este:

- sa citeasca codul
- sa identifice adevarul runtime
- sa inteleaga care feature-uri sunt reale
- sa remapeze experienta peste ele

Important:

- `origin/main` reprezinta cel mai apropiat adevar de live
- branch-ul `preview/integration-2026-04-21` contine si redesign candidates si modificari in lucru
- daca exista conflict intre idei de redesign si functionalitate existenta, **feature parity castiga**

---

## 8. Ordinea surselor de adevar

Modelul extern trebuie sa consume contextul in aceasta ordine:

1. **Codul runtime al paginii si al flow-ului analizat**
2. **`docs/DESTINATION.md`**
3. **`docs/CLAUDE-FULL-SPEC-APP.md`**
4. **Acest document**
5. **`docs/CLAUDE-DESIGN-FASTSTART-2026-04-22.md`**
6. **Documentele de page map / parity contract, doar daca e nevoie de confirmare**

Reguli:

- codul castiga pentru feature parity
- `DESTINATION` castiga pentru directia de produs
- `CLAUDE-FULL-SPEC-APP` castiga pentru harta totala a capabilitatilor
- acest document castiga pentru intentia redesignului

---

## 9. Ce NU are voie sa faca modelul

Nu are voie:

- sa propuna rescriere de backend ca raspuns implicit
- sa scoata functionalitati doar pentru ca par multe
- sa trateze produsul ca simplu dashboard enterprise generic
- sa faca toate paginile sa arate ca niste card grids egale
- sa mute userul prin mai multe dashboarduri daca cazul concret e deja cunoscut
- sa piarda bulk actions, filtre, deep-links, states, exporturi, dovezi sau review flows
- sa traduca arbitrar termenii canonici in engleza
- sa inventeze concepte top-level noi care nu exista in produs

---

## 10. Ce VREM sa faca modelul

Vrem ca modelul:

- sa mapeze aplicatia ca sistem, nu doar ca pagini
- sa identifice unde exista suprafete duplicate sau redundante
- sa propuna ierarhie mai buna intre:
  - triage
  - context
  - overview
  - execution
  - audit output
- sa simplifice traseele fara sa slabeasca produsul
- sa dea o forma vizuala mai coerenta si mai calma
- sa ridice nivelul UX/IA/UI la standard enterprise bun, nu “startup pretty”

---

## 11. Cele 3 documente pe care i le dai

Acesta este pachetul recomandat.

### Document 1 — directia produsului

- `docs/DESTINATION.md`

Rol:

- spune pentru cine este produsul
- spune cele 2 contexte reale
- spune care sunt suprafetele care vand produsul
- spune unde trebuie sa ajunga IA

### Document 2 — specificatia completa a aplicatiei

- `docs/CLAUDE-FULL-SPEC-APP.md`

Rol:

- spune ce capabilitati are produsul
- spune ce pagini si API-uri exista
- spune ce module specializate exista
- spune ce poate si ce nu poate fi ignorat

### Document 3 — acest entrypoint

- `docs/CLAUDE-CODE-REDESIGN-ENTRYPOINT-2026-04-23.md`

Rol:

- spune cum sa consume contextul
- spune care este misiunea reala
- spune ce nu are voie sa strice
- spune ca scopul este redesign peste functionalitate existenta, nu reinventare

---

## 12. Ce acces la cod trebuie sa primeasca

Ideal:

- acces la repo local
- acces la GitHub repo
- acces la branch-ul de lucru relevant

Dar instructiunea trebuie sa fie clara:

- foloseste repo-ul pentru adevar runtime
- foloseste documentele pentru produs si redesign intent
- nu amesteca arbitrar live vechi, preview si idei speculative

---

## 13. Ce livrabil vrem de la Claude Code / Claude Design

Nu vrem doar mockup-uri frumoase.

Vrem:

1. **mapare a aplicatiei ca sistem**
2. **identificarea suprafetelor duplicate / redundante**
3. **propunere de flow-uri mai scurte si mai clare**
4. **propunere de shell si page hierarchy mai buna**
5. **redesign pentru suprafetele critice**
6. **raport clar de parity**

Format minim bun:

- `Kept`
- `Changed`
- `Collapsed`
- `Remapped`
- `Not included yet`
- `Needs confirmation`

---

## 14. Promptul bun pentru Claude Code / Claude Design

```text
You have access to the CompliAI source code and 3 guiding documents:

1. docs/DESTINATION.md
2. docs/CLAUDE-FULL-SPEC-APP.md
3. docs/CLAUDE-CODE-REDESIGN-ENTRYPOINT-2026-04-23.md

Your job is NOT to reinvent the product and NOT to remove functionality.

Your job is to:
- understand the full application from code
- understand who the product is really for
- understand how the main users actually use it
- identify where the current IA/UX/UI creates duplication, friction, and unnecessary navigation
- redesign the runtime experience so it becomes clearer, shorter, calmer, and more operational
- preserve feature parity with the existing code unless a feature is explicitly marked for removal

CompliAI is a Romanian compliance operating system with 2 real contexts:
- Portofoliu · triaj
- Execuție în firmă

The primary user is Diana, a Romanian partner consultant managing 10-30 client companies.
She needs cross-client triage first, and enters a company only when she must execute something concrete.

The product already has real functionality:
- findings
- remediation
- cockpit
- evidence
- document generation
- exports
- monitoring
- specialist modules like NIS2, fiscal, DSAR, vendor review, whistleblowing, AI conformity, and reports

Do not simplify by removing power.
Do not redesign from screenshots alone.
Do not create decorative enterprise dashboards that hide real work.

Think in terms of:
- system map
- user flows
- finding lifecycle
- operational hierarchy
- duplicate surfaces that should be collapsed

Important current issue:
the same known finding can currently appear across multiple surfaces:
- portfolio alerts
- client context
- company dashboard
- generic remediation queue
- cockpit

This creates a navigation labyrinth.
One of your main goals is to reduce this duplication and shorten the path to the concrete case.

Use the runtime code as the source of truth for real functionality.
Use DESTINATION as the source of truth for product direction.
Use the entrypoint document as the redesign contract.

Deliver:
1. a high-level map of the product and its operational layers
2. the duplicated or redundant surfaces you found
3. the shortest correct target flows
4. redesign proposals for the most important surfaces
5. a parity report with:
   - Kept
   - Changed
   - Collapsed
   - Remapped
   - Not included yet
   - Needs confirmation
```

---

## 15. Verdict

Daca alegi intre:

- a da unui model extern 40 de documente fara ierarhie
- sau a-i da repo access + 3 documente puternice + un prompt clar

alegi a doua varianta.

Nu pentru ca ii dam mai putin.

Ci pentru ca ii dam:

- contextul corect
- in ordinea corecta
- cu misiunea corecta
- si cu limitele corecte

