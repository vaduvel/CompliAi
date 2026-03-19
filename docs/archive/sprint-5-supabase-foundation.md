# CompliScan - Sprint 5 Supabase foundation

Data: 2026-03-13

## Scop

Sprint 5 nu este despre feature-uri noi.

Este despre mutarea fundatiei in:

- identitate reala
- storage privat
- tenancy reala
- acces controlat la dovezi si stare

Checklist-ul formal de inchidere pentru acest sprint este in:

- `public/sprint-5-closure-checklist.md`

## Ce vrem sa iasa din Sprint 5

1. utilizatorii sa nu mai depinda de `.data/users.json`
2. membership-urile sa existe in DB si sa fie legate de `auth.users`
3. dovezile sa nu mai stea in `public/`
4. accesul sa treaca prin:
   - RLS
   - signed URL
   - sau route controlat
5. `app_state` sa aiba source of truth clar in cloud

## Modelul tinta

### Identitate

- `auth.users`

### Tabele aplicatie

- `public.organizations`
- `public.profiles`
- `public.memberships`
- `public.org_state`
- `public.evidence_objects`

## Rolul fiecarei tabele

### `public.organizations`

- un tenant logic
- nume organizatie
- metadata minima

### `public.profiles`

- profil minim pentru utilizatorul din `auth.users`
- optional nume afisat

### `public.memberships`

- leaga `auth.users.id` de `organizations.id`
- defineste `role`
- defineste `status`

### `public.org_state`

- locul clar pentru snapshot-ul operational curent al fiecarei organizatii
- inlocuitor matur pentru `compliscan.app_state`

### `public.evidence_objects`

- registru de metadata pentru dovada
- leaga dovada de:
  - org
  - task
  - fisier
  - storage key
  - uploader

## Buckets

- `compliscan-evidence-private`
  - bucket privat
  - obiectele sunt organizate pe prefix:
    - `<org_id>/<task_id>/<file>`

## Politica de acces

### Auth

- identitatea vine din `Supabase Auth`
- rolul si tenant-ul vin din `memberships`

### RLS

- userul vede doar organizatiile unde are membership activ
- userul vede doar:
  - `org_state`
  - `evidence_objects`
  - membership-urile propriei organizatii

### Storage

- obiectele din `storage.objects` se citesc doar daca primul folder din path este un `org_id` la care userul are acces

## Plan de migrare

### Faza 1

- adaugam schema SQL
- activam RLS
- cream bucket privat
- lasam auth-ul local inca functional

### Faza 2

- introducem `Supabase Auth`
- mapam utilizatorii locali in `auth.users`
- populam `profiles`, `organizations`, `memberships`

### Faza 3

- `org_state` devine source of truth principal
- fallback local ramane doar pentru development

### Faza 4

- `evidence upload` scrie in storage privat
- `evidence download` citeste prin route controlat sau signed URL
- `public/evidence-uploads` devine legacy-only
- politicile RLS acopera si accesul direct in DB / Storage, nu doar route-urile aplicatiei

### Faza 5

- taiem auth-ul local ca sursa principala
- `.data/users.json`, `.data/orgs.json`, `.data/memberships.json` raman doar fallback de dev sau migrare

## Ce facem imediat

### Facut acum

- dovezile noi nu mai sunt gandite ca link public
- ele sunt salvate in storage privat local si servite prin:
  - `GET /api/tasks/[id]/evidence/[evidenceId]`
- pentru `supabase_private`, route-ul poate emite si redirect securizat catre URL semnat:
  - `GET /api/tasks/[id]/evidence/[evidenceId]?delivery=redirect`
- pentru descarcare explicita:
  - `GET /api/tasks/[id]/evidence/[evidenceId]?download=1`
- exporturile si UI-ul folosesc acum `accessPath` controlat, cu fallback legacy pe `publicPath`
- metadata-ul dovezilor poate fi acum sincronizat si in:
  - `public.evidence_objects`
  - cheia de upsert este `attachment_id`
- metadata-ul poate fi acum si consumat din `public.evidence_objects`:
  - route-ul de acces la dovada poate hidrata metadata din cloud inainte de stream sau redirect semnat
  - `Audit Pack` bundle foloseste acelasi registru cand copiaza dovezi
  - `DashboardPayload` hidrateaza acum `taskState.attachedEvidenceMeta` din registrul cloud, pentru UI si exporturi server-side
- backend-ul `supabase` poate seed-ui acum `organizations / profiles / memberships` din local cand cloud-ul nu este initializat, apoi revine pe citire cloud-first
- identitatea poate fi comutata incremental spre `Supabase Auth`
- backend-ul de auth suporta acum:
  - `local`
  - `supabase`
  - `hybrid`
- userii locali pot fi legati la identitatea externa dupa email, fara sa rupem inca modelul de memberships local
- tenancy-ul poate fi acum oglindit incremental in Supabase:
  - backend de date:
    - `local`
    - `supabase`
    - `hybrid`
  - `organizations`, `profiles` si `memberships` sunt sincronizabile in DB
  - in backend `supabase`, tenancy-ul este citit acum din DB ca sursa primara pentru:
    - `organizations`
    - `memberships`
    - `profiles`
  - in backend `supabase`, scrierile sensibile de tenancy sunt tratate cloud-first:
    - `register`
    - `link identity`
    - `role update`
  - daca sincronizarea cloud esueaza in backend `supabase`, operatia este blocata
- `org_state` are acum helper dedicat:
  - `lib/server/supabase-org-state.ts`
  - `public.org_state` este citit ca sursa primara in backend `supabase`
  - `public.org_state` este oglindit la scriere in backend `supabase` si `hybrid`
  - daca `public.org_state` nu are inca snapshot, starea initiala este creata direct acolo
- `mvp-store` respecta acum semantica backend-ului de date:
  - `local` -> local-first
  - `hybrid` -> local-first + mirror cloud
  - `supabase` -> cloud-first pe `public.org_state`, cu initializare directa in `public.org_state` si fallback final pe disk doar daca storage-ul cloud nu este disponibil
- `compliscan.app_state` ramane fallback legacy pentru modurile vechi, nu pentru traseul principal `supabase`
- TTL-ul pentru redirect-ul semnat este controlat prin:
  - `COMPLISCAN_EVIDENCE_SIGNED_URL_TTL_SECONDS`
- `supabase/sprint5-foundation.sql` include acum:
  - helper-e `SECURITY DEFINER` pentru membership lookup
  - politici `insert/update/delete` pe `org_state`
  - politici `insert/update/delete` pe `evidence_objects`
  - politici `insert/update/delete` pe `storage.objects` pentru bucket-ul privat
  - evitarea capcanei de recursie RLS pe `memberships`

### Urmatorii pasi tehnici

1. `org_state` ca source of truth final fara fallback operational implicit la `compliscan.app_state`
2. `Supabase Auth` pentru sesiune reala end-to-end
3. storage privat real in Supabase
4. signed URL sau stream controlat pentru dovada cloud
5. verificare reala in proiectul Supabase ca politicile RLS se aplica corect pe:
   - `organizations`
   - `memberships`
   - `profiles`
   - `org_state`
   - `evidence_objects`
   - `storage.objects`

## Fisierul SQL

Schema tinta pentru acest sprint este in:

- `supabase/sprint5-foundation.sql`
