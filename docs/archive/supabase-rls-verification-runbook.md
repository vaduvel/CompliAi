# CompliScan - Runbook verificare RLS si storage Supabase

Data: 2026-03-13

## Scop

Acest runbook verifica daca traseul cloud din Sprint 5 este pregatit operational in proiectul Supabase real:

- `auth.users`
- `public.organizations`
- `public.memberships`
- `public.profiles`
- `public.org_state`
- `public.evidence_objects`
- bucket privat pentru dovezi

Aplicatia continua sa ofere suport si structura. Omul valideaza.

## 1. Preconditii

Asigura-te ca ai rulat:

- `supabase/init.sql`
- `supabase/sprint5-foundation.sql`

Si ca ai configurat:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `COMPLISCAN_AUTH_BACKEND=supabase` sau `hybrid`
- `COMPLISCAN_DATA_BACKEND=supabase` sau `hybrid`
- `COMPLISCAN_ALLOW_LOCAL_FALLBACK=false` pentru verificarea stricta a traseului cloud

## 2. Verificare rapida din aplicatie

1. Intra in `Setari`
2. Deschide cardul `Status operational Supabase`
3. Verifica:
   - `Auth backend`
   - `Data backend`
   - `Supabase REST`
   - `Storage privat`
4. Confirma ca tabelele critice raspund:
   - `organizations`
   - `memberships`
   - `profiles`
   - `org_state`
   - `evidence_objects`

Indicatorul bun:

- `Operational ready`

Indicatorul de review:

- `Needs review`

## 3. Verificare RLS pe date

### 3.1. Organizatii si membership

Trebuie sa fie adevarat:

- un utilizator vede doar organizatiile unde are membership activ
- un utilizator nu poate vedea membership-urile unei alte organizatii
- un `viewer` nu poate modifica roluri
- ultimul `owner` nu poate fi retrogradat

### 3.2. State operational

Trebuie sa fie adevarat:

- `public.org_state` este lizibil doar pentru membrii organizatiei
- modificarile in `org_state` sunt permise doar actorilor autorizati

### 3.3. Dovezi

Trebuie sa fie adevarat:

- `public.evidence_objects` este lizibil doar pentru membrii organizatiei
- bucket-ul privat nu expune fisiere direct
- accesul trece prin:
  - route controlat
  - URL semnat scurt

## 4. Verificare storage privat

1. Incarca o dovada noua in `Remediere`
2. Confirma ca in UI apare atasamentul
3. Deschide dovada prin:
   - acces standard
   - `download=1`
4. Pentru backend `supabase`, verifica si:
   - `delivery=redirect`

Trebuie sa fie adevarat:

- fisierul nu este disponibil prin link public brut
- metadata exista in `public.evidence_objects`
- `attachment_id` este populat
- `storage_provider` reflecta traseul real

## 5. Verificare audit si bundle

1. Genereaza `Audit Pack`
2. Deschide `Auditor Vault`
3. Verifica:
   - evidence ledger
   - validation ledger
   - timeline cu actor

Trebuie sa fie adevarat:

- metadata dovezii vine din registrul operational, nu doar din stare locala
- bundle-ul poate copia dovada din storage-ul real

## 6. Comportament asteptat pe backend-uri

### `local`

- auth local
- date locale
- storage local

### `hybrid`

- auth si date pot coexista local + cloud
- `org_state` si tenancy se oglindesc in cloud
- evidence metadata se sincronizeaza best-effort

### `supabase`

- auth extern
- tenancy cloud-first
- `org_state` cloud-first
- upload evidence esueaza explicit daca metadata cloud nu poate fi sincronizata
- daca `COMPLISCAN_ALLOW_LOCAL_FALLBACK=false`, aplicatia nu mai cade tacut pe local cand cloud-ul nu este disponibil

## 7. Semnale rosii

Daca apare oricare dintre acestea, Sprint 5 nu este inca inchis:

- `memberships` nu raspunde in status
- `evidence_objects` raspunde cu eroare
- upload-ul de dovada merge, dar nu apare metadata in DB
- un utilizator dintr-o org poate vedea date din alta org
- fisierele pot fi accesate direct fara route controlat sau URL semnat
- `supabase` backend cade frecvent pe fallback local fara motiv explicit

## 8. Verdict de inchidere Sprint 5

Sprint 5 poate fi considerat inchis operational doar daca:

- statusul Supabase este verde pe tabelele critice
- RLS a fost verificat in proiectul real
- traseul principal pentru auth, tenancy, state si evidence functioneaza fara ambiguitate
- fallback-ul local ramane doar pentru development sau recuperare controlata
