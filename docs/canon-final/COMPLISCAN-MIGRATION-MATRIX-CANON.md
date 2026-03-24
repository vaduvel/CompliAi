# CompliScan — Migration Matrix Canon

Data: `2026-03-22`
Status: `CANON FINAL`
Bază:
- [COMPLISCAN-UX-IA-DEFINITIV-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-UX-IA-DEFINITIV-CANON.md)
- [COMPLISCAN-UX-IA-DEFINITIV-v1.1-ADDENDUM-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-UX-IA-DEFINITIV-v1.1-ADDENDUM-CANON.md)
- [COMPLISCAN-PORTFOLIO-TECH-SPEC-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-PORTFOLIO-TECH-SPEC-CANON.md)
- [COMPLISCAN-PLAN-IMPLEMENTARE-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-PLAN-IMPLEMENTARE-CANON.md)

Acest document mapează toate rutele `page.tsx` existente din `app/dashboard/*` la destinația lor în noul model `portfolio-first`.

Inventar curent:
- `38` page routes în `app/dashboard`
- această matrice trebuie tratată ca sursă de adevăr pentru keep / redirect / refactor / hide

Reguli:
- `keep` = ruta rămâne și este parte activă din modelul final
- `refactor` = ruta rămâne, dar se rescrie parțial pe noul model
- `redirect` = ruta rămâne doar ca alias/bridge
- `hide` = ruta rămâne suport tehnic, dar nu mai este expusă în navigația principală
- `delete-later` = poate dispărea doar după ce există mapping clar și redirect sigur

---

## 1. Rute existente → destinația în noul model

| Ruta existentă | Status canon | Destinație / rol final | Acțiune |
|---|---|---|---|
| `/dashboard` | canon per-org | Acasă per firmă | `keep + refactor` |
| `/dashboard/scan` | canon per-org | Scanează per firmă | `keep + refactor` |
| `/dashboard/scan/history` | suport per-org | istoric scanări | `keep` |
| `/dashboard/scan/results/[scanId]` | suport per-org | rezultat scanare | `keep` |
| `/dashboard/resolve` | canon per-org | Acțiuni > Remediere | `keep + refactor` |
| `/dashboard/resolve/[findingId]` | suport per-org | detaliu finding | `keep` |
| `/dashboard/reports` | canon per-org | Rapoarte per firmă | `keep + refactor` |
| `/dashboard/reports/vault` | suport per-org | Vault | `keep` |
| `/dashboard/reports/audit-log` | suport per-org | Audit log | `keep` |
| `/dashboard/reports/policies` | suport per-org | Politici / documente | `keep` |
| `/dashboard/reports/trust-center` | suport per-org | Trust center | `keep` |
| `/dashboard/settings` | canon per-org | Setări firmă | `keep + refactor` |
| `/dashboard/settings/abonament` | suport per-org | billing org până la Wave 5 | `keep` |
| `/dashboard/vendor-review` | suport per-org | Monitorizare > Furnizori | `keep` |
| `/dashboard/sisteme` | suport per-org | Monitorizare > Sisteme AI | `keep` |
| `/dashboard/conformitate` | suport per-org | Monitorizare > Conformitate | `keep + refactor` |
| `/dashboard/alerte` | suport per-org | Monitorizare > Alerte | `keep` |
| `/dashboard/nis2` | suport per-org | Monitorizare > NIS2 | `keep` |
| `/dashboard/nis2/governance` | suport per-org | sub-rută NIS2 | `keep` |
| `/dashboard/nis2/maturitate` | suport per-org | sub-rută NIS2 | `keep` |
| `/dashboard/nis2/inregistrare-dnsc` | suport per-org | sub-rută NIS2 | `keep` |
| `/dashboard/fiscal` | suport per-org | e-Factura management | `keep` |
| `/dashboard/generator` | suport per-org | generator documente | `keep + hide` |
| `/dashboard/asistent` | suport per-org | asistent AI | `keep + hide` |
| `/dashboard/agents` | suport per-org | automatizare / agenți | `keep + hide` |
| `/dashboard/partner` | bază portfolio existentă | devine baza pentru `/portfolio` | `refactor + legacy redirect later` |
| `/dashboard/partner/[orgId]` | deep-link partener | selectează org și intră în drilldown | `refactor` |
| `/dashboard/documente` | azi legacy redirect | Solo-only „Documente” compus din politici + istoric scanări | `refactor` |
| `/dashboard/findings/[id]` | legacy | redirect la `/dashboard/resolve/[id]` | `redirect` |
| `/dashboard/politici` | legacy | redirect la `/dashboard/reports/policies` | `redirect` |
| `/dashboard/scanari` | legacy | redirect la `/dashboard/scan` | `redirect` |
| `/dashboard/checklists` | legacy | redirect la `/dashboard/resolve` | `redirect` |
| `/dashboard/audit-log` | legacy | redirect la `/dashboard/reports/audit-log` | `redirect` |
| `/dashboard/rapoarte` | legacy | redirect la `/dashboard/reports` | `redirect` |
| `/dashboard/rapoarte/auditor-vault` | legacy | redirect la `/dashboard/reports/vault` | `redirect` |
| `/dashboard/rapoarte/trust-profile` | legacy | redirect la `/dashboard/reports/trust-center` | `redirect` |
| `/dashboard/setari` | legacy | redirect la `/dashboard/settings` | `redirect` |
| `/dashboard/setari/abonament` | legacy | redirect la `/dashboard/settings/abonament` | `redirect` |

---

## 2. Mapping special — `/dashboard/partner` → `/portfolio`

Nu rescriem de la zero ce există deja în [partner/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/partner/page.tsx).

Se reutilizează:
- tabelul de clienți
- filtrele și sortarea
- sumarul de portofoliu
- importul CSV
- exporturile de bază
- [API-ul existent de clienți](/Users/vaduvageorge/Desktop/CompliAI/app/api/partner/clients/route.ts)

Plan:
1. `Wave 1`
   - `/dashboard/partner` rămâne funcțional ca suport
   - nav nouă pointează conceptual spre `Portofoliu`
2. `Wave 2`
   - extragem componentele utile din `/dashboard/partner`
   - construim `/portfolio/*` peste ele
3. După stabilizare
   - `/dashboard/partner` devine redirect către `/portfolio`

Regulă:
- `partner/page.tsx` este bază de refactor, nu candidat de ștergere timpurie

---

## 3. Clarificare Solo

Nu creăm un mini-produs separat pentru Solo.

Canon:
- Solo refolosește rutele existente
- diferența este de:
  - navigație
  - layout
  - compoziție
  - densitate informațională

Reutilizare canonică:
- `/dashboard` → Acasă simplificată
- `/dashboard/scan` → Scanează simplificat
- `/dashboard/resolve` → `De rezolvat` simplificat
- `/dashboard/documente` → devine suprafață Solo compusă
- `/dashboard/reports` → Rapoarte simplificate
- `/dashboard/settings` → Setări simplificate

Nu facem:
- rute noi de tip `/dashboard/de-rezolvat`
- dublare de logică
- pagini paralele doar pentru Solo

---

## 4. Delete-later policy

Rutele `legacy redirect` nu se șterg imediat.

Ordine corectă:
1. noul model funcționează în runtime
2. redirect-urile sunt confirmate în producție
3. links/documentație/analytics sunt actualizate
4. abia apoi evaluăm ștergerea fișierelor legacy

---

## 5. Implementare obligatorie

Acest document trebuie folosit împreună cu:
- [COMPLISCAN-PLAN-IMPLEMENTARE-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-PLAN-IMPLEMENTARE-CANON.md)

Regulă:
- orice wave care atinge rute sau navigație trebuie să actualizeze matricea dacă apare deviere nouă.
