# Supabase SQL Editor - pasi scurti pentru Sprint 5

Scop: aplicam infrastructura lipsa din Supabase ca sa putem inchide real `Sprint 5`.

## Ce trebuie rulat

Fisierul complet este:

- `supabase/apply-sprint5-complete.sql`

## Pasi rapizi

1. Intra in dashboard-ul proiectului Supabase `kvdcphbgogyckbltpjxc`.
2. Deschide `SQL Editor`.
3. Creeaza un query nou.
4. Copiaza tot continutul din:
   - `supabase/apply-sprint5-complete.sql`
5. Ruleaza query-ul.
6. Verifica in `Table Editor` ca exista:
   - `public.organizations`
   - `public.memberships`
   - `public.profiles`
   - `public.org_state`
   - `public.evidence_objects`
7. Verifica in `Storage` ca exista bucket-ul:
   - `compliscan-evidence-private`

## Dupa aplicare

In proiect ruleaza:

```bash
npm run verify:supabase:sprint5
```

Daca totul este corect:

- tabelele nu mai raspund `404`
- bucket-ul ramane `OK`
- putem continua cu verificarea finala RLS si inchiderea reala a Sprint 5

## Daca apare eroare

Trimite-mi:

- mesajul exact din SQL Editor
- sau screenshot

si continui eu de la acel punct.
