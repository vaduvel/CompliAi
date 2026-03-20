# CompliScan Final Guide Plan

Acest folder este locul canonic pentru `final guide plan` al aplicatiei.

Scopul lui este simplu:
- pastram integral documentul sursa care contine viziunea completa
- adaugam o structura de orientare peste el, fara sa pierdem nimic
- facem clar ce trebuie tratat ca doctrina de produs, ce este roadmap si ce ramane exemplu de implementare

Ce gasesti aici:
- `00-master-source.md` -> copie integrala, pastrata ca sursa master, a documentului `docs/documnet-final-log-sprint.md`
- `01-guide-map.md` -> harta canonica de citire si folosire a sursei master
- `02-ux-ia-blueprint.md` -> copie canonica a blueprint-ului de arhitectura UX si IA pentru forma finala a aplicatiei
- `03-ux-wireframe-prototype.jsx` -> copie canonica a prototipului vizual care traduce blueprint-ul UX in ecrane
- `compliscan-ui-prompt.md` -> companion de implementare UI pentru Design System v2.0, folosit in wave-urile de executie vizuala
- `compliscan-ia-revizuita.md` -> fisierul original, pastrat pentru provenance
- `compliscan-ux-wireframe.jsx` -> fisierul original, pastrat pentru provenance

Reguli pentru folder:
- nu stergem continut din sursa master
- nu rescriem agresiv `00-master-source.md`
- nu stergem fisierele originale `compliscan-ia-revizuita.md` si `compliscan-ux-wireframe.jsx`
- daca apar clarificari sau normalizari, le punem in fisiere companion din acest folder
- daca exista conflict intre formularea stricta din corpul vechi si clarificarile finale adaugate la coada documentului, urmam clarificarile finale explicate in `01-guide-map.md`
- pentru executie si referinta curenta, folosim numele canonice `02-*` si `03-*`, iar fisierele originale raman ca sursa de provenienta
- pentru implementarea vizuala, `compliscan-ui-prompt.md` ramane companion de lucru, iar progresul pe valuri se noteaza separat in `docs/wave0-log/` sau in logul activ al wave-ului

Intentia acestui folder:
- aici tinem forma finala dorita a aplicatiei
- de aici pornim implementarea pe valuri
- aici revenim cand vrem sa verificam daca un slice nou intareste sau deviaza de la directia finala
