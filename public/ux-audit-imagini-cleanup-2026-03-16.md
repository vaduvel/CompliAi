# UX audit vizual + backlog cleanup (imagini)

Data: 2026-03-16

## Context

Sursa de adevar pentru compozitia paginilor:

- Progressive Disclosure
- Trust Through Transparency
- Role-Aware Surfaces
- Tab-based sub-navigation
- Separare sumar / detaliu / actiune
- O pagina = o intentie dominanta

## Capturi (de inserat in repo)

Nota: capturile sunt in `public/audit-screenshots/`; urmeaza maparea lor pe sectiunile de mai jos.

### Dashboard - overview

Fisier sugerat: `public/audit-screenshots/dashboard-overview-2026-03-16.png`

Observatii rapide:

- zona de orientare e mai clara, dar inca apar trei blocuri care spun practic acelasi lucru (`Ce cere actiune acum`, `Ce faci acum`, `Stare curenta`).
- exista doua locuri care promit "urmatorul pas"; trebuie unul singur, restul sub disclosure.

### Scanare - overview

Fisier sugerat: `public/audit-screenshots/scanare-overview-2026-03-16.png`

Observatii rapide:

- sunt trei panouri sus care repeta handoff-ul (`Flux scanare`, `Verdicts`, `Istoric`) + un sumar separat care spune acelasi lucru.
- `Mod Agent` concureaza cu actiunea principala, dar este un layer optional.

### Scanare - flux activ

Fisier sugerat: `public/audit-screenshots/scanare-flux-activ-2026-03-16.png`

Observatii rapide:

- fluxul de incarcare are doua zone paralele de context (`Pasul 2` + `Pasul 3`) si trei carduri de rezumat dedesubt.
- `Lucrezi acum in` + `Ultimul rezultat` + `Continui dupa analiza` pot fi unite intr-un singur handoff compact.

### Control - overview

Fisier sugerat: `public/audit-screenshots/control-overview-2026-03-16.png`

Observatii rapide:

- `Ce ceri sa confirmi acum` + `Continu confirmarea` + `Confirmare umana` spun aceeasi poveste in trei locuri.
- tab-urile `Discovery / Baseline / Sisteme` sunt ok, dar ghidajul este redundant.

### Setari

Fisier sugerat: `public/audit-screenshots/setari-overview-2026-03-16.png`

Observatii rapide:

- doua mesaje consecutive spun acelasi lucru (`Configurezi aici, lucrezi in produs` si `Setari nu inlocuieste fluxul principal`).
- e nevoie de o singura zona de handoff + CTA-uri clare.

### Dovada - Remediere

Fisier sugerat: `public/audit-screenshots/dovada-remediere-2026-03-16.png`

Observatii rapide:

- cand nu exista task-uri, board-ul gol + filtrele ocupa prea mult spatiu.
- un empty state dominant cu CTA ar reduce haosul vizual.

## Backlog cleanup (derivat din capturi)

### P0 (claritate dominanta)

- Dashboard: unifica `Ce cere actiune acum` + `Ce faci acum` + `Stare curenta` intr-un singur bloc dominant; restul sub disclosure.
- Scanare: lasa doar actiunea principala sus, iar `Ultimul rezultat` + `Continui dupa analiza` intra intr-un singur Handoff compact.
- Control: consolideaza `Confirmare` intr-un singur ActionCluster; ghidajul complet apare doar la cerere.

### P1 (reducere densitate)

- Setari: comprima handoff-ul in 1 card + 2 CTA-uri (Dashboard, Dovada); scoate duplicarea de mesaj.
- Remediere: daca nu exista task-uri, ascunde filtrele si afiseaza un empty state cu CTA clar.
- Scanare (flux activ): reduce blocurile de context paralele la o singura zona; restul sub disclosure.

### P2 (coerenta UI)

- Standardizeaza mesajele read-only vs executie (o singura afirmatie per pagina).
- Limiteaza la max 3 CTA-uri simultan vizibile in sectiunea primara.
- Pastreaza doar un singur card de handoff per pagina; restul devine detaliu.

## Backloguri existente (referinta)

- `public/polish-backlog-post-sprint7.md`
- `public/backlog-din-feedback.md`
- `public/audit-md-backlog-sprint-ready-2026-03-14.md`
- `components/evidence-os/ui-audit-backlog.md`
