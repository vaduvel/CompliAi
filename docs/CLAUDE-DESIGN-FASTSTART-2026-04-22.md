# CLAUDE-DESIGN-FASTSTART-2026-04-22

## Ce este
Acesta este documentul scurt pe care il dai lui Claude Design la inceputul unei conversatii noi.

Nu ii mai da documentele lungi ca sursa principala. Claude web tinde sa citeasca doar primele ~250 linii. Documentele lungi raman arhiva si referinta de backup.

Acest fisier este sursa principala pentru:
- directia de produs
- regulile fixe de design
- ordinea surselor de adevar
- metoda de lucru pe pagini

## Adevarul de produs, pe scurt
CompliAI este un produs operational de compliance pentru:
- partner consultants
- compliance teams
- solo operators

Persona principala pentru redesign este Diana:
- consultant partener
- triage cross-client dimineata
- intra in firma doar cand trebuie sa execute
- are nevoie de claritate, densitate controlata, zero fluff

## Modelul produsului
Exista 2 contexte reale:

1. Portofoliu
- cross-client
- triage
- alerte
- drill-in pe firma
- rapoarte batch

2. Executie in firma
- lucru in contextul unei firme selectate
- monitorizare
- actiuni
- cockpit
- setari

Nu amesteca aceste doua contexte.

## Cele 3 suprafete care vand produsul
1. `/portfolio`
2. `/portfolio/alerts`
3. `/portfolio/client/[orgId]`

Cockpit-ul `/dashboard/actiuni/remediere/[findingId]` este suprafata critica de executie, nu landing surface.

## Directie vizuala aprobata
- dark operational SaaS
- calm authority
- densitate controlata
- fara glossy
- fara gradient decorativ
- fara startup fluff
- list surfaces in loc de card grids ca default
- scanabilitate inainte de decor

## Tipografie si ton
- limba UI: romana
- ton: persoana a II-a singular, clar, operational
- termeni canonici:
  - Portofoliu
  - Alerte
  - Remediere
  - Furnizori
  - Rapoarte
  - Setari
  - Monitorizare
  - Actiuni
  - Firma
  - Scor
  - finding

## Reguli fixe
1. Codul real castiga pentru feature parity.
2. Contractul de parity castiga pentru non-negotiables.
3. Handoff-ul castiga pentru directia de produs si design.
4. Nu simplifica prin eliminare de flows.
5. Nu schimba IA canonica implicit.
6. Daca ai o idee alternativa, o marchezi explicit A/B.

## Ce nu ai voie sa faci
- sa transformi pagini dense in dashboard-uri decorative
- sa ascunzi bulk actions
- sa elimini stari empty/loading/error
- sa muti userul prematur din Portofoliu in workspace-ul firmei
- sa inventezi campuri sau actiuni care nu exista in cod
- sa folosesti card grid ca default pe suprafete de triage

## Regula de complexitate
Design pentru operatiuni normale, supravietuire la varf de complexitate.

Asta inseamna:
- default calm si clar
- top 3 / prioritizare explicita
- progressive disclosure
- rezistenta la multe item-uri
- dar fara a face fiecare pagina sa arate permanent ca worst-case mode

## Cum lucrezi corect cu noi
Nu incerca sa redesenezi tot produsul intr-o singura conversatie.

Lucram per pagina, in valuri.

Pentru fiecare pagina primesti:
- screenshot before
- fisierul `page.tsx`
- componenta principala a paginii
- API route sau shape-ul real al datelor
- acest document
- contractul scurt pe pagina / faza

## Ce trebuie sa livrezi pe fiecare pagina
1. HTML standalone
2. raport de parity cu:
   - Kept
   - Changed
   - Remapped
   - Not included yet
   - Needs confirmation

## Ordinea surselor de adevar
1. codul atasat pentru pagina curenta
2. contractul scurt de parity
3. acest faststart
4. capturile before
5. documentele lungi, doar daca ai nevoie de backup context

## Cum folosesti documentele lungi
Nu le consuma cap-coada.

Le folosesti doar ca index sau backup:
- `docs/CLAUDE-DESIGN-MASTER-HANDOFF-2026-04-22.md`
- `docs/CLAUDE-DESIGN-CURRENT-APP-PAGE-MAP.md`
- `docs/CLAUDE-DESIGN-FEATURE-PARITY-CONTRACT-2026-04-22.md`

## Faze recomandate
FAZA 1:
- `/portfolio`
- `/portfolio/alerts`
- `/portfolio/client/[orgId]`
- `/dashboard/actiuni/remediere/[findingId]`

FAZA 2:
- `dosar`
- `fiscal`
- `nis2`
- `vendor-review`
- `monitorizare/conformitate`
- `setari`

## Verdict
Acest document este entrypoint-ul scurt.

Daca trebuie sa alegi intre:
- a citi 900 linii de handoff
- sau a respecta acest faststart + fisierele reale ale paginii

alegi a doua varianta.
