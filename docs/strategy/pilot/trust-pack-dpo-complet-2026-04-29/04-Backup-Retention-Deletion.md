# Backup, Retention, Deletion and Offboarding — pilot DPO Complet

**Status:** client-ready production policy pentru pilot
**Scop:** reguli minime pentru backup, retenție, ștergere și ieșirea controlată din pilot.

## Principii

- Datele pilotului trebuie să poată fi exportate înainte de ștergere.
- Dovezile nu trebuie să dispară fără urmă.
- `local_fallback` nu se folosește pentru clienți reali în producție.
- Ștergerea finală se face doar după confirmarea exportului.

## Backup

Production target:

- Supabase production pentru state și evidence metadata;
- Supabase private bucket pentru fișiere evidence;
- export cabinet manual la finalul pilotului;
- backup Supabase conform planului production activ.

Pentru pilot controlat:

1. se face export inițial după configurare;
2. se face export lunar sau la finalul pilotului;
3. se păstrează hash/manifest pentru pachetele exportate.

## Retenție

Datele se păstrează pe durata contractului/pilotului.

Categorii:

- workspace metadata — pe durata pilotului;
- evidence files — pe durata pilotului sau până la cererea de ștergere;
- event ledger — pe durata necesară demonstrării acțiunilor;
- magic link tokens — până la expirare sau finalizarea documentului;
- rapoarte lunare — pe durata pilotului.

Termenele finale trebuie agreate în DPA-ul semnat.

## Soft delete evidence

Soft delete este mecanismul standard pentru greșeli operaționale.

Reguli:

- motiv obligatoriu, minim 8 caractere;
- dovada se mută în `deletedEvidenceMeta`;
- dovada activă dispare din task;
- task-ul cere revalidare;
- download-ul este blocat cu `410`;
- restore window: 30 zile;
- acțiunea intră în event ledger.

## Restore evidence

În fereastra de 30 zile:

- owner, partner_manager sau compliance poate restaura;
- dovada revine pe task;
- task-ul cere revalidare;
- restore-ul intră în event ledger.

## Hard delete evidence

Hard delete:

- este owner-only;
- cere motiv;
- se face după soft delete;
- elimină fișierul din storage privat;
- elimină metadata evidence object;
- păstrează event ledger-ul operațional al acțiunii.

## Offboarding

Pași recomandați la final de pilot:

1. Cabinetul cere offboarding/export.
2. CompliScan generează export complet cabinet.
3. Cabinetul confirmă descărcarea exportului.
4. Se generează exporturi client Audit Pack pentru clienții din pilot.
5. Se opresc magic links active.
6. Se aplică ștergerea conform DPA-ului.
7. Se păstrează raport minim de offboarding: cine, când, ce s-a exportat, ce s-a șters.

## Ce trebuie testat pe mediul real

- export complet din Supabase production;
- ștergere evidence din bucket privat;
- confirmare că `local_fallback` nu este activ;
- restore pentru soft-deleted evidence;
- offboarding complet pentru un client pseudonimizat.
