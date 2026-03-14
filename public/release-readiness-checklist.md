# CompliScan - Release Readiness Checklist

Data actualizarii: 2026-03-13

## Scop

Checklist-ul de mai jos decide daca putem spune onest ca un build este gata de release controlat, nu doar ca "merge local".

## Gate tehnic minim

- `npm test` trece fara skip-uri noi adaugate in graba
- `npm run lint` trece fara warning-uri noi pe runtime-ul critic
- `npm run build` trece pe mediul curent
- `npm run verify:supabase:sprint5` trece
- `npm run verify:supabase:strict` nu raporteaza blocaje daca mediul tinta ruleaza cloud-first
- `npm run verify:supabase:rls` trece pentru proiectul Supabase activ

## Gate operational

- `/api/health` raspunde si nu este `blocked`
- `/api/release-readiness` raspunde si nu este `blocked`
- `Setari` afiseaza corect:
  - statusul Supabase
  - health check-ul aplicatiei
  - rolurile si membrii organizatiei curente
- exista runbook clar pentru:
  - incident minim
  - verificare RLS
  - onboarding pilot

## Gate pe audit defensibility

- controalele cu dovada `weak` nu ies `gata pentru audit`
- controalele cu drift deschis nu ies `gata pentru audit`
- `Audit Pack` client-facing arata:
  - verdictul de audit
  - gate-urile active
  - sumarul de calitate al dovezii
- `traceability review` blocheaza confirmarea pentru controale nevalidate

## Gate pe paralelism / integrare

- batch-ul `Evidence OS UI` livrat de Codex 2 este auditat inainte de merge final
- nu exista fisiere UI ajunse accidental in `app/api/*`
- runtime-ul critic ramane separat de layer-ul de design system `Evidence OS`

## Gate comercial minim

- framing-ul produsului ramane corect:
  - aplicatia ofera suport si structura
  - omul valideaza
- nu apar claim-uri noi care sugereaza verdict legal automat final

## Verdict

Release-ul este "gata controlat" doar daca toate blocajele de mai sus sunt inchise sau marcate explicit ca exceptii acceptate.
