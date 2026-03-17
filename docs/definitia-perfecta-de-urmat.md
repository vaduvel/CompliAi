# CompliAI — Definitia Perfectă de Urmat
> Firul roșu de la 70% la 100% Sales-Ready.
> Fiecare sprint se termină complet înainte de următorul.
> Actualizat după fiecare sprint — status live.

---

## Filosofie de execuție

- **User-visible value first** — niciun sprint invizibil fără output pentru utilizator
- **Finish before move** — sprint incomplet = sprint neterminat, nu se trece mai departe
- **Report după fiecare sprint:** fișiere schimbate · outcome vizibil · teste adăugate · riscuri rămase
- **Nu adăugăm module noi** în afara acestei liste fără decizie explicită

---

## Roadmap complet — 13 sprinturi

| # | Sprint | Estimare | Status | Branch |
|---|---|---|---|---|
| 1 | Tests + branch stale | 30 min | 🟡 În progres | main |
| 2 | CUI în OrgProfile | 1 oră | ⚪ Pending | — |
| 3 | PDF export real | 4-5 ore | ⚪ Pending | — |
| 4 | DNSC Registration Wizard | 5-6 ore | ⚪ Pending | — |
| 5 | Mock demo mode e-Factura | 2 ore | ⚪ Pending | — |
| 6 | RBAC minim | 4-5 ore | ⚪ Pending | — |
| 7 | UX: empty states + copy + loading | 4 ore | ⚪ Pending | — |
| 8 | ANAF live readiness | 3 ore | ⚪ Pending | — |
| 9 | Storage abstraction layer | 3 ore | ⚪ Pending | — |
| 10 | Supabase sync end-to-end | 6-8 ore | ⚪ Pending | — |
| 11 | Explainability layer | 3-4 ore | ⚪ Pending | — |
| 12 | Partner Portal full | 4-5 ore | ⚪ Pending | — |
| 13 | Weekly digest email | 3 ore | ⚪ Pending | — |

**Legende:** ⚪ Pending · 🟡 În progres · 🟢 Închis · 🔴 Blocat

---

## Sprint 1 — Tests + Branch Stale

**De ce:** Zero teste eșuate e condiție de bază. Branch-urile stale creează confuzie.

### Scope
1. Fix test eșuat: `app/api/alerts/notify/route.test.ts` — `channels.includes("email")` dar ruta returnează `"email:console"` / `"email:resend"`
2. Adaugă testele lipsă notate explicit ca "amânate":
   - R-4: test unitar pentru DPA alert trigger la sistem AI cu vendor extern
   - R-10: test unitar pentru NIS2 data în audit-pack bundle ZIP
3. Șterge cele 4 branch-uri stale remote:
   - `codex/compliance-pack-option-b-2026-03-17`
   - `codex/fix-ts-test-debt`
   - `codex/policy-trust-audit-complete`
   - `codex/ux-sprint-8-dashboard-p0`

### Definition of Done
- [ ] 0 teste eșuate
- [ ] Teste R-4 și R-10 adăugate
- [ ] `git branch -r` — fără branch-uri `codex/*` stale
- [ ] `npx vitest run` — green

### Log
| Data | Acțiune |
|---|---|
| 2026-03-17 | Sprint deschis |

---

## Sprint 2 — CUI în OrgProfile

**De ce:** CUI-ul e identitatea fiscală a firmei. Fără el, documentele generate nu sunt credibile, ANAF prefill-ul e imposibil, un contabil nu te ia în serios.

### Scope
- `lib/compliance/applicability.ts` — adaugă `cui?: string` în `OrgProfile`
- `components/compliscan/applicability-wizard.tsx` — câmp CUI în pasul 1 (sector + CUI), label: "CUI (opțional — pentru prefill automat în documente)"
- Validare permisivă: `^(RO)?\d{2,10}$` — dacă gol, continuă
- `POST /api/org/profile` — CUI salvat în state
- `app/dashboard/generator/page.tsx` — `orgCui` pre-populat din `orgProfile.cui`
- 2 teste: CUI valid + CUI gol (ambele trec)

### Definition of Done
- [ ] Wizard are câmp CUI (opțional)
- [ ] CUI salvat în state via API
- [ ] Generator pre-populează CUI automat
- [ ] Documentele generate includ CUI-ul în antet
- [ ] 2 teste pass

### Log
| Data | Acțiune |
|---|---|
| 2026-03-17 | Sprint definit |

---

## Sprint 3 — PDF Export Real

**De ce:** Nimeni nu descarcă `.md`. Administratorul, contabilul, inspectorul DNSC — toți vor PDF. Acesta e cel mai vizibil gap față de un produs profesionist.

### Scope
- Librărie: `md-to-pdf` sau `marked` + `puppeteer` (decizie la implementare)
- Endpoint `POST /api/documents/export-pdf` — primește conținut Markdown, returnează PDF buffer
- Header + footer PDF: "Generat de CompliAI · {orgName} · {date} · Document informativ, nu constituie consiliere juridică"
- UI: buton "Descarcă PDF" (primar) + "Descarcă .md" (secundar)
- Se aplică pentru: privacy-policy, cookie-policy, DPA, nis2-incident-response, ai-governance, DNSC report (R-7), Annex IV (R-1)

### Definition of Done
- [ ] Toate documentele generate se descarcă ca PDF
- [ ] Header/footer consistent CompliAI
- [ ] Fluxul `.md` existent nu e rupt
- [ ] Test de bază: generare + export PDF

### Log
| Data | Acțiune |
|---|---|
| 2026-03-17 | Sprint definit |

---

## Sprint 4 — DNSC Registration Wizard

**De ce:** Diferențiatorul #1. Mii de firme au ratat deadline-ul DNSC din septembrie 2025. Niciun alt tool nu ghidează pas cu pas înregistrarea. Demo magic instant.

### Scope
- Pagină nouă: `/dashboard/nis2/inregistrare-dnsc`
- Wizard 5 pași:
  1. **Verificare eligibilitate** — preia din Applicability Engine (`certain`/`probable`/`unlikely`)
  2. **Date necesare** — checklist interactiv cu prefill din OrgProfile (CUI, sector)
  3. **Platforma NIS2@RO DNSC** — link + ghidaj ce trebuie completat acolo
  4. **Generează draft notificare** — document pre-completat pentru `evidenta@dnsc.ro`
  5. **Confirmare + next steps** — marchează `dnscRegistrationStatus: pending | submitted | confirmed`
- `dnscRegistrationStatus` adăugat în NIS2 state
- Dashboard: dacă NIS2 `certain`/`probable` și status !== `confirmed` → NextBestAction = "Înregistrează-te la DNSC"
- Link în sidebar sub NIS2: "Înregistrare DNSC"

### Definition of Done
- [ ] Wizard funcțional 5 pași
- [ ] Draft notificare generabil și descărcabil
- [ ] Status DNSC salvat în state
- [ ] NextBestAction actualizat pe dashboard
- [ ] Funcționează cu OrgProfile gol (fallback graceful)

### Log
| Data | Acțiune |
|---|---|
| 2026-03-17 | Sprint definit |

---

## Sprint 5 — Mock Demo Mode e-Factura

**De ce:** La demo live nu ai credențialele ANAF ale clientului. Fără mock mode, nu poți demonstra funcționalitatea e-Factura → NIS2 → findings. Demo magic imposibil fără asta.

### Scope
- `lib/server/efactura-mock-data.ts` — 15 vendori realiști:
  - 4 tech vendors: Amazon Web Services EMEA, Microsoft Ireland Operations, OpenAI OpCo LLC, Google Cloud Romania
  - 6 vendori normali: Dedeman, Enel Energie Muntenia, Fan Courier, Telekom Romania, RCS&RDS, Orange Romania
  - 3 servicii: PwC Romania, Contabil Expert SRL, Noerr Finance & Tax
- Dacă `ANAF_CLIENT_ID` lipsește → butonul "Importă din e-Factura" folosește mock data
- Toast după import: "Demo mode — 15 furnizori simulați. Conectează contul ANAF pentru date reale."
- Findings automate generate corect din mock data
- Extinde `upsertVendorsFromEfactura` să detecteze `techVendor: true` pe keywords (cloud, hosting, SaaS, OpenAI, AWS, Microsoft, Google)
- Vendors tech fără DPA → finding automat: "Furnizor {name} detectat — verifică DPA"

### Definition of Done
- [ ] Mock mode funcțional când lipsesc credențiale ANAF
- [ ] 15 vendori realiști importați în demo
- [ ] Tech vendors detectați automat
- [ ] Findings generate corect
- [ ] Toast "Demo mode" vizibil

### Log
| Data | Acțiune |
|---|---|
| 2026-03-17 | Sprint definit |

---

## Sprint 6 — RBAC Minim

**De ce:** Fără roluri, orice user dintr-un org poate face orice. Dacă ai un contabil ca partner și un angajat ca viewer, trebuie să poți restricționa. Condiție de credibilitate pentru clienți reali.

### Scope
- 3 roluri: `owner` · `partner` · `viewer`
- `owner`: control complet org (toate acțiunile existente)
- `partner`: acces la Partner Portal, generare documente, export — fără delete org/state
- `viewer`: read-only pe toate modulele — fără write, fără export audit pack
- Extinde `memberships.json` cu câmpul `role: OrgRole`
- Middleware / helper `requireRole(role)` în route handlers critice
- UI: ascunde/disable butoane pentru acțiuni nepermise
- Migrare: userii existenți primesc `role: "owner"` automat

### Definition of Done
- [ ] Roluri definite în model
- [ ] `requireRole()` aplicat pe acțiunile critice (delete, export, reset)
- [ ] Viewer nu poate executa acțiuni write
- [ ] Partner nu poate reseta starea sau șterge org
- [ ] UI ascunde acțiunile nepermise
- [ ] Teste pentru fiecare rol

### Log
| Data | Acțiune |
|---|---|
| 2026-03-17 | Sprint definit |

---

## Sprint 7 — UX: Empty States + Copy + Loading

**De ce:** Paginile goale cu "No data" sunt oportunitați pierdute. Copy-ul tehnic (`certainty`, `finding`, `drift`) îndepărtează utilizatorul non-tehnic.

### Scope

**Empty states critice:**
- `/dashboard/nis2/` tab Assessment → CTA "Evaluează maturitatea NIS2 în 10 minute"
- `/dashboard/nis2/` tab Incidents → CTA "Generează Plan de Răspuns la Incidente"
- `/dashboard/nis2/` tab Vendors → CTA "Importă automat din e-Factura"
- `/dashboard/sisteme/` inventar gol → CTA "Adaugă primul sistem AI (ChatGPT, Copilot etc)"
- `/dashboard/generator/` fără documente → top 3 documente recomandate din applicability
- Remediation board gol → "Niciun finding activ. Pornește o scanare sau completează evaluarea NIS2."

**Tabel înlocuire copy:**
- `certainty: certain` → "Se aplică"
- `certainty: probable` → "Probabil se aplică"
- `certainty: unlikely` → "Probabil nu se aplică"
- `finding` → "Problemă detectată"
- `severity: critical` → "Urgent"
- `severity: high` → "Important"
- `drift` → "Modificare detectată"
- `baseline` → "Stare de referință"
- `assessment` → "Evaluare"

**Loading states:**
- Toate acțiunile async: buton disabled + spinner + mesaj de stare
- Gemini timeout >15s → "Durează mai mult decât de obicei..."

### Definition of Done
- [ ] Zero pagini cu "No data" fără ghidaj
- [ ] Termenii tehnici înlocuiți în UI
- [ ] Toate acțiunile async au feedback vizibil
- [ ] Test: flow utilizator nou fără dead ends

### Log
| Data | Acțiune |
|---|---|
| 2026-03-17 | Sprint definit |

---

## Sprint 8 — ANAF Live Readiness

**De ce:** Clientul care are credențiale ANAF trebuie să poată trece în live mode fără a schimba cod.

### Scope
- Configurare clară live vs mock via env vars
- Smoke test flow: connect → fetch → parse → handoff în vendor/risk logic
- Erori understandable în UI și logs (nu silent)
- Documentare: cum activezi live mode (`ANAF_CLIENT_ID`, `ANAF_CLIENT_SECRET`, CUI)

### Definition of Done
- [ ] Live mode configurabil via env
- [ ] Mock mode funcționează în continuare
- [ ] Smoke flow documentat și testabil
- [ ] Erori ANAF vizibile în UI cu mesaj clar

### Log
| Data | Acțiune |
|---|---|
| 2026-03-17 | Sprint definit |

---

## Sprint 9 — Storage Abstraction Layer

**De ce:** `.data/` local e un risc de producție. Prerequisit pentru Supabase sync fără rewriting masiv.

### Scope
- Interfață `IStateStorage` cu metode `read(orgId)` / `write(orgId, state)`
- Implementare curentă pe fișiere wrappată în spatele interfeței
- Core read/write logic nu mai depinde de raw file paths în multiple locuri
- NIS2 store + compliance state unificate sub aceeași interfață
- Calea de migrare spre Supabase devine evidentă

### Definition of Done
- [ ] Interfață storage definită
- [ ] File storage folosește interfața
- [ ] Logica core nu mai are dependențe directe pe `fs` în locuri multiple
- [ ] Migrarea spre Supabase: schimbi implementarea, nu logica

### Log
| Data | Acțiune |
|---|---|
| 2026-03-17 | Sprint definit |

---

## Sprint 10 — Supabase Sync End-to-End

**De ce:** `.data/` local = date pierdute la orice reinstalare. Clienți reali au nevoie de persistență cloud.

### Scope
- Core compliance state persistat în Supabase
- NIS2 data (incidents, vendors, assessment) persistat în Supabase
- Org isolation intactă (row-level security)
- UI citește/scrie prin noul path
- Script de migrare `.data/` → Supabase pentru date existente
- Fallback local păstrat pentru development

### Definition of Done
- [ ] Core data citit/scris din Supabase în producție
- [ ] NIS2 data persistat în Supabase
- [ ] Flowul principal funcțional end-to-end
- [ ] Strategie migrare documentată

### Log
| Data | Acțiune |
|---|---|
| 2026-03-17 | Sprint definit |

---

## Sprint 11 — Explainability Layer

**De ce:** Sugestiile automate trebuie să fie trustworthy. Un admin trebuie să înțeleagă DE CE sistemul a spus ceva, nu să primească magie neagră.

### Scope
- Fiecare sugestie cheie afișează: sursă legală + explicație scurtă + nivel certitudine
- Se aplică pentru: applicability suggestions, AI-assisted prefills, vendor/privacy review, findings NIS2
- Sursele legale per modul:
  - GDPR: "Regulament UE 2016/679"
  - NIS2: "OUG 155/2024, Legea 124/2025"
  - AI Act: "Regulament UE 2024/1689 — aplicare completă august 2026"
  - e-Factura: "OUG 89/2025"
- Tooltip / info icon pe cardurile dashboard cu sursa oficială
- UI compact — nu un audit console complet

### Definition of Done
- [ ] Utilizatorul poate vedea DE CE sistemul a sugerat ceva
- [ ] Surse legale vizibile per modul
- [ ] Sugestiile critice nu sunt "magie" — au reasoning explicit

### Log
| Data | Acțiune |
|---|---|
| 2026-03-17 | Sprint definit |

---

## Sprint 12 — Partner Portal Full

**De ce:** Contabilul cu 20 de clienți e canalul de distribuție. Dacă nu poate tria și acționa rapid, nu adoptă tool-ul.

### Scope
- Filtre pe lista clienți: scor (sub 50% / 50-75% / peste 75%), stare NIS2, alerte active
- Sortare pe click header: orgName, complianceScore, alertCount
- Search box instant pe orgName
- Drill-down per client: `/dashboard/partner/[orgId]` — scor detaliat, findings deschise, stare DNSC
- Buton "Descarcă dosar control" din drill-down (audit pack pentru acel orgId)
- Import clienți bulk CSV: `orgName,cui,sector,employeeCount,email`
  - Parse → creează org + membership → rulează applicability engine automat
  - Feedback: "18 din 20 clienți importați. 2 erori: linia 5 — CUI invalid"

### Definition of Done
- [ ] Filtre + sortare + search funcționale
- [ ] Drill-down per client funcțional
- [ ] Audit pack descărcabil din drill-down
- [ ] Import bulk CSV cu feedback clar

### Log
| Data | Acțiune |
|---|---|
| 2026-03-17 | Sprint definit |

---

## Sprint 13 — Weekly Digest Email

**De ce:** Retenția. Utilizatorul care nu se loghează zilnic trebuie să primească un motiv să revină.

### Scope
- `lib/server/weekly-digest.ts` — `buildDigestEmail(digest: WeeklyDigest): string`
- Conținut digest: scor curent + schimbare față de săptămâna trecută, findings deschise, items rezolvate, deadline-uri iminente, NextBestAction
- Endpoint `POST /api/cron/weekly-digest` — iterează org-urile, trimite via Resend
- Preferință în alert preferences: "Primesc digest săptămânal: Da/Nu"
- Cron: Vercel Cron sau extern, luni 8:00

### Definition of Done
- [ ] Digest generat cu date reale
- [ ] Email trimis via Resend funcțional
- [ ] Preferință toggle în setări
- [ ] Cron configurat și documentat

### Log
| Data | Acțiune |
|---|---|
| 2026-03-17 | Sprint definit |

---

## Reguli de execuție

1. **Finish before move** — sprint incomplet rămâne deschis, nu se trece la următorul
2. **Report după fiecare sprint** — fișiere schimbate · outcome vizibil · teste · riscuri rămase
3. **Nu adăugăm features noi** în afara acestei liste fără decizie explicită
4. **Commit atomic per task** — dacă un task > 2 ore, se sparge
5. **Testează ca utilizator** — după fiecare sprint, flow manual în incognito

---

*Fir declarat. Data start: 2026-03-17*
