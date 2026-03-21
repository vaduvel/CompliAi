# Guide Map

Acest fisier nu inlocuieste sursa master.

Rolul lui este sa transforme documentul mare intr-o harta executabila, fara sa scoata nimic din continutul original.

## 1. Doctrina de produs

Trateaza ca reguli de baza:
- identitatea produsului din `CE ESTE COMPLISCAN SI CE NU ESTE`
- principiile `P1-P7`
- limbajul de provenance si siguranta: `suggested`, `candidate`, `likely`, `confirmed`, `requires review`
- regula de auditabilitate: `source`, `confidence`, `timestamp`, `reason`, `userOverride`

Acestea definesc forma finala a produsului, nu doar o idee de sprint.

## 2. Guardrails de implementare

Trateaza ca guardrails active:
- nu reconstruim produsul si nu schimbam stack-ul fara motiv serios
- extindem incremental modulele existente
- main path-ul ramane `Dashboard -> Intake -> Scan -> Findings -> Remediere -> Evidence -> Output -> Revalidare`
- human-in-the-loop ramane obligatoriu pe zonele sensibile

## 3. Roadmap-ul de baza

Fazele `A-G` din sursa master sunt roadmap-ul mare:
- `A` -> intake si applicability
- `B` -> semantic scan engine
- `C` -> vendor review automation
- `D` -> remediation si closure automation
- `E` -> document si policy auto-update
- `F` -> continuous monitoring si agents
- `G` -> output layer maturity

Aceste faze trebuie citite ca ordine de maturizare, nu ca obligatie de a implementa totul dintr-un foc.

## 4. Ce este executabil direct si ce trebuie validat

Executabil direct:
- principiile de produs
- structura pe faze
- definition of done
- cerinta de provenance si confirmare umana

Necesita validare tehnica inainte de productie:
- exemplele de endpointuri externe
- detaliile de auth flow
- pseudo-codul si snippet-urile de implementare
- migrarile si structurile SQL sugerate
- orice integrare externa mentionata in document

Cu alte cuvinte: intentia functionala este canonica, dar detaliul tehnic trebuie verificat in runtime.

## 5. Addon-uri versus nucleu

Partea de addon-uri de la finalul sursei master ramane importanta, dar nu intra in nucleul imediat:
- `Smart Prefill din Facturi`
- `Compliance Streak`
- `Sector Benchmark`

Le tratam ca extensii dupa stabilizarea fazelor de baza, nu ca preconditie pentru nucleul produsului.

## 6. Reguli finale care rezolva conflictele interne

La coada documentului exista clarificari valoroase care trebuie tratate ca override peste formularile mai rigide de mai sus:

- `API routes existente` inseamna `fara breaking changes`, nu `nu le atingi niciodata`
- integrările externe trebuie tratate ca intentie functionala pana la validarea tehnica reala
- fisierele si fluxurile active trebuie atinse punctual, cu patch-uri mici, reversibile si auditabile

Aceste clarificari fac documentul executabil in lumea reala si trebuie pastrate in orice interpretare viitoare.

## 7. Cum folosim folderul pe viitor

Ordinea recomandata de citire:
1. `00-master-source.md`
2. `01-guide-map.md`
3. `02-ux-ia-blueprint.md`
4. `04-implementation-reference-eos-v1.md`
5. `03-ux-wireframe-prototype.jsx`
6. `compliscan-ui-prompt.md` daca wave-ul atinge stratul vizual sau Design System
7. documentele de wave active si logurile curente

Cand facem implementari noi:
- nu stergem din sursa master
- documentam override-urile sau normalizarile in acest folder
- actualizam logul de sprint astfel incat sa existe fir clar intre viziune, wave si codul livrat

## 8. Pachetul UX canonic din folder

Pentru forma finala a aplicatiei, pachetul UX canonic este:
- `02-ux-ia-blueprint.md` pentru arhitectura informationala si regulile de navigare
- `03-ux-wireframe-prototype.jsx` pentru traducerea vizuala a blueprint-ului in ecrane si prioritati de interactiune
- `compliscan-ui-prompt.md` pentru implementarea vizuala consistenta in wave-urile care ating Design System-ul
- `04-implementation-reference-eos-v1.md` pentru decizia executabila curenta: implementam blueprint-ul peste UI-ul existent `Evidence OS v1`

Fisierele:
- `compliscan-ia-revizuita.md`
- `compliscan-ux-wireframe.jsx`

raman in folder ca originale pastrate pentru provenance si comparatie, dar referinta de lucru merge pe variantele canonice numerotate.

## 9. Cum legam wave-urile de ghidul final

Cand deschidem un wave nou plecat din acest folder:
- folosim blueprint-ul si wireframe-ul ca tinta de produs
- folosim `04-implementation-reference-eos-v1.md` ca regula executabila pentru alegerea skin-ului vizual
- folosim `compliscan-ui-prompt.md` doar daca wave-ul chiar atinge stratul vizual si decizia de skin o cere
- tinem jurnalul wave-ului separat, astfel incat executia sa nu aglomereze ghidul canonic
