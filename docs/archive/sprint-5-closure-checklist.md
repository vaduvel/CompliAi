# CompliScan - Sprint 5 closure checklist

Sprint 5 inchide trecerea de la persistenta MVP/local-first la un traseu cloud-first suficient de serios pentru piloturi reale.

## Ce este deja bifat

- [x] backend de auth incremental:
  - `local`
  - `supabase`
  - `hybrid`
- [x] `org_state` are traseu cloud explicit
- [x] exista politici explicite pentru fallback local (`COMPLISCAN_ALLOW_LOCAL_FALLBACK`)
- [x] dovezile noi nu mai sunt tratate ca fisiere publice directe
- [x] access route pentru evidence suporta:
  - stream controlat
  - redirect catre URL semnat, cu TTL scurt
- [x] `public.evidence_objects` este sincronizat si consumat operational
- [x] `family-evidence` reutilizeaza metadata hidratata din registrul cloud, nu doar ce ramane in state local
- [x] exista panou vizibil de status operational Supabase in `Setari`
- [x] exista runbook manual pentru verificarea RLS / storage / tenancy

## Ce mai trebuie verificat inainte sa spunem ca Sprint 5 este inchis

- [x] proiectul Supabase real are schema de Sprint 5 aplicata fara erori
- [x] politicile RLS sunt verificate live pe proiectul real
  - script: `npm run verify:supabase:rls`
  - observatie: verificarea automata a confirmat izolarea `organizations`, `memberships`, `org_state`, `evidence_objects`
  - observatie: `viewer` nu poate modifica `org_state`; PostgREST intoarce `200` cu `[]`, nu `403`, iar scriptul trateaza acum corect cazul
- [x] bucket-ul privat pentru evidence este functional pe proiectul real
- [x] modul `supabase` merge fara fallback local tacut in mediul tinta
- [x] `organizations`, `memberships`, `profiles`, `org_state` si `evidence_objects` raspund corect prin traseul cloud
- [x] exporturile si Auditor Vault functioneaza corect cu dovezi venite din registrul cloud

## Stare live curenta

Verificarea live din `2026-03-13` arata acum:

- `public.organizations` -> `200`
- `public.memberships` -> `200`
- `public.profiles` -> `200`
- `public.org_state` -> `200`
- `public.evidence_objects` -> `200`
- `compliscan-evidence-private` -> `200`

Preflight-ul strict din mediul curent arata inca:
 
- actualizare: preflight-ul strict trece
- `COMPLISCAN_AUTH_BACKEND` -> `supabase`
- `COMPLISCAN_DATA_BACKEND` -> `supabase`
- `COMPLISCAN_ALLOW_LOCAL_FALLBACK` -> `false`

Raportul complet este in:

- `public/supabase-live-verification-2026-03-13.md`

## Regula de inchidere

Sprint 5 poate fi considerat inchis operational doar daca:

1. codul trece `test + lint + build`
2. runbook-ul RLS este rulat pe proiectul Supabase real
3. traseul `supabase` functioneaza fara dependenta ascunsa de fallback local
4. storage-ul privat pentru evidence este functional end-to-end

## Verdict

Sprint 5 poate fi considerat acum `inchis operational`.

Ce ramane dupa inchidere:

- rafinari suplimentare pe observabilitate si operatiuni cloud
- curatarea fallback-urilor legacy ramase strict pentru development
- extinderea verificarilor de tenancy si evidence in sprinturile urmatoare

## Ce NU inseamna inchiderea Sprint 5

Chiar daca Sprint 5 este inchis, asta NU inseamna inca:

- ca motorul de verdict este suficient de defensibil singur
- ca produsul este gata enterprise
- ca putem elimina complet fallback-urile locale din dezvoltare

Sprint 5 inseamna doar ca fundatia de identitate, tenancy, state si evidence a iesit din zona de improvizatie.
