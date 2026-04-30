# Security and Hosting — pilot DPO Complet

**Status:** client-ready production policy pentru pilot controlat
**Scop:** descrie pe scurt cum sunt găzduite, protejate și urmărite datele în CompliScan.

Acest document nu este certificare de securitate și nu înlocuiește un audit extern. Este un brief operațional pentru decizia de pilot.

## Arhitectură production target

- Web/API runtime: Vercel, regiune server-side `fra1 — Frankfurt`.
- Persistență producție: Supabase Postgres + Supabase Storage privat.
- Regiune Supabase: `eu-central-1 — Frankfurt, Germany`.
- Evidence bucket: `compliscan-evidence-private`.
- Date reale: numai pe Supabase production.
- `local_fallback`: permis doar demo/dev/pseudonimizat.

## Control acces

Roluri disponibile:

- `owner` — control complet, membri, reset, hard delete evidence;
- `partner_manager` — portofoliu, export cabinet, template-uri, approvals;
- `compliance` — lucru operațional pe findings, evidence, validation;
- `reviewer` — review și export client;
- `viewer` — vizualizare.

Acțiunile sensibile sunt mapate în matricea RBAC exportată de aplicație.

## Audit trail

CompliScan păstrează evenimente pentru:

- document generat;
- magic link creat;
- client approval;
- client rejection;
- client comment;
- evidence upload;
- evidence soft delete;
- evidence restore;
- evidence permanent delete;
- baseline validation;
- export.

Evenimentele sunt folosite în dashboard, monthly report, Audit Pack și export cabinet.

## Magic links

Clientul final nu are nevoie de cont CompliScan.

Prin magic link poate:

- vizualiza documentul;
- aproba;
- comenta;
- respinge cu motiv.

Messy cases testate în runtime:

- token alterat afișează blocked state;
- document respins nu poate fi aprobat ulterior cu același link;
- comentariul și respingerea intră în event ledger.

## Evidence handling

Dovezile pot fi:

- PDF/document bundle;
- screenshot;
- log export;
- policy text;
- approval record.

Evidence delete hardening:

- soft delete cere motiv;
- soft-deleted evidence nu mai poate fi descărcată;
- restore window: 30 zile;
- restore cere revalidare;
- hard delete este owner-only;
- toate acțiunile intră în event ledger.

## AI governance

- AI este ON/OFF per client/workspace.
- Clienții sensibili pornesc cu AI OFF.
- Când AI este OFF, se folosește template-only mode.
- Evidence files brute nu sunt trimise către provider AI.
- Documentele generate cer validare profesională.

## Export și portabilitate

Aplicația poate exporta:

- Audit Pack per client;
- bundle ZIP cu dovezi;
- raport lunar per client;
- export complet cabinet;
- template-uri cabinet;
- RBAC matrix;
- security/contractual pack.

## Limitări declarate

CompliScan nu certifică, nu atestă conformitatea și nu înlocuiește cabinetul DPO sau auditorul.

Platforma organizează workflow-ul, dovezile și raportarea. Consultantul validează profesional.
