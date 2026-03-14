# CompliScan - Polish pass post Sprint 7

Scop: curatam suprafata vizibila si incongruentele ramase dupa Sprint 7, fara a reschimba fundatia.

## Principii

- nu rescriem logica de business
- nu adaugam module noi
- nu atingem rutele critice daca nu exista bug real
- rezolvam doar frictiuni vizibile, confuzii si inconsistente

## Prioritati

1. UI & microcopy
- corecturi de text in `Setari`, `Scanari`, `Auditor Vault`, `Audit si export`
- uniformizare denumiri (ex: `Release readiness`, `Health check`)
- mesaje clare pentru `blocked / review / ready`

2. Evidence OS UI
- audit final al batch-ului Codex 2
- aliniere stilistica cu cockpitul principal fara a rupe DS-ul `Evidence OS`
- verificare contraste, spacing, labels

3. Empty states si loading states
- consistenta stilurilor de empty state
- mesajele de incarcare si de eroare sa fie explicite

4. Accesibilitate minima
- focus rings consistente
- `aria-label` unde lipsesc pe butoane icon-only

5. Cleanup tehnic minor
- inlatura imports nefolosite
- documente actualizate pentru schimbari de UI

## Ce nu intra in acest polish

- schimbari in `auth`, `tenancy`, `audit-pack`, `traceability`
- schimbari in motorul de analiza
- schimbari de schema DB

## Definition of done

- checklist bifat pe fiecare pagina cheie
- `npm test`, `npm run lint`, `npm run build` verzi
- commit curat cu lista de fixuri
