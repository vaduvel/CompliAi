# CompliScan - Performance Wave Closure

Data: 2026-03-14

## Scop

Acest document inchide valul de performanta urmarit in:

- `public/audit-performanta-nextjs-2026-03-14.md`
- `public/log-sprinturi-maturizare.md`

Nu rescrie auditul initial.

Confirma:

- ce s-a inchis real
- ce a fost verificat
- ce ramane hotspot clar dupa valurile `A`, `B` si `C`

## Ce s-a inchis

### Val A

- `A1`: loading local in loc de loading full-screen repetat
- `A2`: sumar agregat pentru `Setari`
- `A3`: sumar agregat pentru shell auth

### Val B

- `B1`: split controlat pentru `useCockpitData()` si `useCockpitMutations()`
- `B2`: `/api/dashboard/core` + lazy load pentru payload-ul heavy
- `B3`: lazy load pentru zone grele:
  - `Audit si export`
  - `Scanari`
  - `Auditor Vault`

### Val C

- `C1`: bootstrap server-first in `app/dashboard/layout.tsx`
- `C2`: `loading.tsx` pe segmentele grele din dashboard
- `C3`: refresh mai precis, fara `router.refresh()` inutil dupa commit in `Scanari`

## Ce am verificat

Pe build-ul curent:

- `npm run lint` trece
- `npm test` trece
- `npm run build` trece
- `npm run preflight:release` trece
- `npm run verify:supabase:sprint5` trece
- `npm run verify:supabase:strict` trece
- `npm run verify:supabase:rls` trece

Observatie operationala:

- serverul local porneste cu `npm start`
- `/api/health` si `/api/release-readiness` raspund, dar fara sesiune valida intorc `Unauthorized`
- asta confirma runtime activ si control de acces activ, dar nu inlocuieste o verificare manuala in context autentificat

## Semnale bune dupa cleanup

- dashboard-ul foloseste acum bootstrap server-first pentru datele initiale comune
- shell-ul nu mai face fetch initial pentru user si memberships dupa mount
- exista acum `5` fisiere `loading.tsx` sub `app/dashboard`
- `Auditor Vault`, `Scanari` si `Audit si export` nu mai trag tot costul greu in primul paint
- `router.refresh()` a ramas doar unde chiar e justificat: schimbarea organizatiei

## Hotspot-uri ramase

Valul de performanta este inchis cu succes, dar nu inseamna ca produsul a ramas mic.

Hotspot-uri actuale:

- `components/compliscan/use-cockpit.tsx` are `1893` linii
- `components/compliscan/use-cockpit.tsx` are `25` apeluri `fetch(...)`
- `app/dashboard/setari/page.tsx` are `1240` linii
- `app/dashboard/rapoarte/auditor-vault/page.tsx` are `1080` linii
- `app/dashboard/scanari/page.tsx` are `830` linii
- exista `67` fisiere cu `"use client"` in `app`, `components`, `lib`

Concluzie:

- am redus perceptia de blocaj si am folosit mai bine App Router
- dar adaptorul central si cateva pagini mari raman puncte de greutate arhitecturala

## Verdict

Valul `A/B/C` este inchis operational.

Nu mai suntem in zona in care dashboard-ul se comporta ca un SPA greu fara garduri.

Suntem acum intr-o zona mai matura:

- bootstrap server-first
- loading segmentat
- payload mai precis
- refresh global redus

## Pasul urmator recomandat

Nu recomand inca un val generic de performanta.

Urmatorul pas sanatos este unul dintre acestea:

1. decompozitie controlata pentru hotspot-urile ramase:
   - `Setari`
   - `Scanari`
   - `Auditor Vault`
2. polish UX/IA pe baza `public/ux-ui-flow-arhitectura.md`

Ordinea recomandata:

1. audit final pe firul UX
2. decompozitie controlata pe paginile mari
3. doar apoi alt cleanup de performanta
