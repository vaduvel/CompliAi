# Log Claude 1 — Handoff pentru Claude 2
> Creat de Claude Sonnet 4.6 · Sesiunea 1 · 2026-03-17
> **Scop:** Claude 2 citește acest fișier și știe exact de unde să preia, fără să repete ce s-a făcut.

---

## Stare la momentul handoff-ului

| | |
|---|---|
| **Branch activ** | `feat/applicability-engine-ui` (ahead of origin, nepushed de la Sprint 3) |
| **Ultimul commit** | `d7b0a46` — Sprint 3: PDF export real — pdfkit server-side |
| **Teste** | 422 pass · 0 fail · 1 skip (88 test files) |
| **TypeScript** | 0 erori |
| **Main branch** | `main` — merged PR #35 (Applicability Engine) |

---

## Ce s-a construit în această sesiune (sprinturi 1–3 din definitia-perfecta)

### Sprint 1 — Tests + Branch Stale ✅ (commit `0fdcf3e`)

**Fix:**
- `app/api/alerts/notify/route.test.ts` — test eșua pentru că ruta returnează `"email:console"` / `"email:resend"`, nu `"email"`. Fix: `channels.some((c: string) => c.startsWith("email"))`

**Teste noi adăugate (amânate anterior):**
- `app/api/ai-systems/route.test.ts` — R-4: 5 teste DPA alert trigger
- `lib/server/audit-pack-bundle.test.ts` — R-10: 3 teste NIS2 în ZIP bundle

**Pattern important pentru teste viitoare:**
```typescript
// vi.mock() factory: FĂRĂ referințe la variabile din scope (hoisting constraint)
vi.mock("@/lib/server/mvp-store", () => ({
  mutateState: vi.fn(async (fn: (s: unknown) => unknown) => fn(makeBaseState())),
}))

// Captură state în mutateState:
vi.mocked(mutateState).mockImplementation(async (fn) => {
  capturedState = fn(makeBaseState()) as ComplianceState
  return capturedState
})

// Cast pentru obiecte parțiale:
{} as unknown as ComplianceState
fn({} as never) as Record<string, unknown>
```

**Branch-uri stale șterse:** 15 branch-uri `codex/*` remote

---

### Sprint 2 — CUI în OrgProfile ✅ (commit `458a019`)

**Fișiere modificate:**
- `lib/compliance/applicability.ts` — `cui?: string` adăugat în `OrgProfile`:
  ```typescript
  export type OrgProfile = {
    sector: OrgSector
    employeeCount: OrgEmployeeCount
    usesAITools: boolean
    requiresEfactura: boolean
    cui?: string   // CUI fiscal opțional — ex: "RO12345678" sau "12345678"
    completedAtISO: string
  }
  ```

- `app/api/org/profile/route.ts` — validare permisivă, non-blocking:
  ```typescript
  const cuiRaw = typeof body.cui === "string" ? body.cui.trim() : undefined
  const cui = cuiRaw && /^(RO)?\d{2,10}$/i.test(cuiRaw) ? cuiRaw.toUpperCase() : undefined
  // dacă CUI invalid → se ignoră silențios, nu returnează 400
  ```

- `components/compliscan/applicability-wizard.tsx` — wizard extins de la 4 la 5 pași, pasul 1 = CUI (opțional)
  - Step order: `"cui"` → `"sector"` → `"size"` → `"ai"` → `"efactura"` → `"done"`
  - CUI trimis în fetch din pasul efactura: `...(values.cui.trim() ? { cui: values.cui.trim() } : {})`

- `app/dashboard/generator/page.tsx` — `useEffect` pre-populează `orgCui` din `orgProfile.cui`

- `app/api/org/profile/route.test.ts` (NOU) — 6 teste:
  - CUI valid cu RO prefix → salvat
  - CUI valid fără RO → salvat
  - Fără CUI → `cui: undefined`
  - CUI gol/spații → ignorat
  - Format invalid → ignorat silențios
  - Sector lipsă → 400

---

### Sprint 3 — PDF Export Real ✅ (commit `d7b0a46`)

**Fișiere noi:**

`lib/server/pdf-generator.ts`:
```typescript
export async function buildPDFFromMarkdown(
  content: string,
  metadata: { orgName: string; documentType: string; generatedAt?: string }
): Promise<Buffer>
```
- Librărie: `pdfkit` (instalat, server-side, fără puppeteer, funcționează pe Vercel)
- Parsează Markdown line-by-line: H1/H2/H3, `-`/`*` list, `1.` ordered, `>` blockquote, `---` hr, paragrafe
- Header per pagină: `"Generat de CompliAI · {orgName} · {date}"`
- Footer per pagină: disclaimer + număr pagină (`x / total`)
- Folosește `bufferPages: true` + `doc.flushPages()` + `drawPageDecorations()` pentru header/footer pe toate paginile

`app/api/documents/export-pdf/route.ts`:
- `POST /api/documents/export-pdf`
- Body: `{ content: string, orgName?: string, documentType?: string }`
- Returns: `application/pdf` binary cu `Content-Disposition: attachment; filename="..."`
- Fix TS: `pdfBuffer as unknown as BodyInit` (Buffer nu e direct assignable la BodyInit în Node.js types)

`lib/server/pdf-generator.test.ts` — 3 teste: Buffer non-gol, Markdown complex, conținut gol

**Modificat:**
`app/dashboard/generator/page.tsx`:
- `downloadingPdf: boolean` state adăugat
- `handleDownloadPdf()` — fetch POST → blob → download
- Buton `PDF` (primar, fără `variant="outline"`) alăturat `.md` (outline)

---

## Fișierul central: `docs/definitia-perfecta-de-urmat.md`

Acesta e **firul roșu** — 13 sprinturi definite. Sprint 1-3 = închise. Urmează din Sprint 4.

**Status roadmap la handoff:**

| # | Sprint | Status |
|---|---|---|
| 1 | Tests + branch stale | 🟢 Închis |
| 2 | CUI în OrgProfile | 🟢 Închis |
| 3 | PDF export real | 🟢 Închis |
| **4** | **DNSC Registration Wizard** | **🟢 Închis** |
| **5** | **Mock demo mode e-Factura** | **⚪ Pending — URMEAZĂ** |
| 6 | RBAC minim | ⚪ Pending |
| 7 | UX: empty states + copy + loading | ⚪ Pending |
| 8 | ANAF live readiness | ⚪ Pending |
| 9 | Storage abstraction layer | ⚪ Pending |
| 10 | Supabase sync end-to-end | ⚪ Pending |
| 11 | Explainability layer | ⚪ Pending |
| 12 | Partner Portal full | ⚪ Pending |
| 13 | Weekly digest email | ⚪ Pending |

---

## Sprint 4 — DNSC Registration Wizard (URMEAZĂ)

**De ce:** Diferențiatorul #1. Mii de firme au ratat deadline-ul DNSC din sept 2025. Niciun tool nu ghidează pas cu pas. Demo magic instant.

### Scope complet (din definitia-perfecta):

**Pagină nouă:** `/dashboard/nis2/inregistrare-dnsc`

**Wizard 5 pași:**
1. **Verificare eligibilitate** — preia din Applicability Engine (`certain`/`probable`/`unlikely`)
2. **Date necesare** — checklist interactiv cu prefill din OrgProfile (CUI, sector)
3. **Platforma NIS2@RO DNSC** — link + ghidaj ce trebuie completat acolo
4. **Generează draft notificare** — document pre-completat pentru `evidenta@dnsc.ro`
5. **Confirmare + next steps** — marchează status

**State nou:**
- `dnscRegistrationStatus: "not-started" | "in-progress" | "submitted" | "confirmed"` în `Nis2OrgState` (în `lib/server/nis2-store.ts`)

**Dashboard NextBestAction:**
- Dacă NIS2 `certain`/`probable` ȘI `dnscRegistrationStatus !== "confirmed"` → banner/card CTA "Înregistrează-te la DNSC"

**Link sidebar:**
- Sub NIS2 în sidebar → "Înregistrare DNSC"

### Definition of Done:
- [ ] Wizard funcțional 5 pași la `/dashboard/nis2/inregistrare-dnsc`
- [ ] Draft notificare generabil și descărcabil (PDF via `buildPDFFromMarkdown`)
- [ ] `dnscRegistrationStatus` salvat în NIS2 state
- [ ] NextBestAction actualizat pe dashboard când status !== `confirmed`
- [ ] Funcționează cu OrgProfile gol (fallback graceful)
- [ ] Test unitar pentru draft notificare

---

## Arhitectura generală (ce trebuie știut)

### Stack
- **Next.js 15 App Router** — `async/await` headers, `getOrgContext()` e async
- **TypeScript strict** — 0 erori înainte de commit
- **Vitest** pentru teste — pattern `vi.mock()` cu factory inline (hoisting!)
- **Tailwind CSS** cu design system `eos-*` tokens
- **pdfkit** pentru PDF (instalat)

### Auth & multi-tenancy
- Session cookie: `compliscan_session` (httpOnly, HMAC-SHA256)
- `lib/server/auth.ts` — Node.js crypto
- `middleware.ts` — Edge Runtime, Web Crypto API
- `lib/server/org-context.ts` — `getOrgContext()` async, citește din headers setate de middleware
- Headers middleware: `x-compliscan-org-id`, `x-compliscan-user-email`, `x-compliscan-org-name`

### State stores
- `lib/server/mvp-store.ts` — per-org state: `.data/state-{orgId}.json`
- `lib/server/nis2-store.ts` — NIS2 state: `.data/nis2-{orgId}.json`
  - `Nis2OrgState` are: `incidents`, `vendors`, `assessment`, **`updatedAtISO`** (câmp obligatoriu!)
- Users: `.data/users.json`

### Tipuri cheie
```typescript
// lib/compliance/applicability.ts
type OrgProfile = {
  sector: OrgSector
  employeeCount: OrgEmployeeCount
  usesAITools: boolean
  requiresEfactura: boolean
  cui?: string
  completedAtISO: string
}

// lib/compliance/types.ts
type ComplianceState = { ... aiSystems, alerts, events, scans, tasks, drifts, workspace, orgProfile?, applicability? }

// lib/server/nis2-store.ts
type Nis2OrgState = { incidents, vendors, assessment, updatedAtISO }
// IMPORTANT: updatedAtISO e obligatoriu — include în orice mock!
```

### Pattern API routes
```typescript
// Standard route:
export async function POST(req: Request) {
  const { orgId, orgName } = await getOrgContext()
  const body = await req.json()
  // validare
  const newState = await mutateState((state) => ({ ...state, /* modificări */ }))
  return NextResponse.json({ ... })
}
```

### Fișiere importante
| Fișier | Rol |
|---|---|
| `middleware.ts` | Route protection `/dashboard/:path*` |
| `lib/server/auth.ts` | Auth utilities |
| `lib/server/mvp-store.ts` | Per-org compliance state |
| `lib/server/nis2-store.ts` | NIS2 state (incidents, vendors, assessment) |
| `lib/server/org-context.ts` | Citește org din request headers (async!) |
| `lib/server/pdf-generator.ts` | PDF din Markdown (pdfkit) |
| `lib/compliance/applicability.ts` | `evaluateApplicability()` + `OrgProfile` |
| `lib/compliance/types.ts` | Toate tipurile centrale |
| `components/compliscan/use-cockpit.ts` | Client state hook principal |
| `components/compliscan/dashboard-shell.tsx` | Sidebar + user card |
| `app/dashboard/nis2/page.tsx` | Pagina NIS2 (assessment, incidents, vendors) |
| `docs/definitia-perfecta-de-urmat.md` | Roadmap 13 sprinturi — FIRUL ROȘU |
| `docs/sprint-log-refinements.md` | Sprint log cu `/sprint-log` skill |

---

## Reguli importante (feedback de la user)

1. **Nu șterge branch-uri după merge** fără să fii cerut explicit
2. **Nu face amend la commit-uri publicate** — creează commit nou
3. **Commituri clare** după fiecare sprint cu format: `Sprint N: <titlu scurt>`
4. **Actualizează sprint log** (`/sprint-log close RX`) după fiecare sprint închis
5. **TypeScript 0 erori** înainte de orice commit
6. **Teste înainte de commit** — `npx vitest run` green

---

## Sprint 4 — DNSC Registration Wizard ✅ (commit `4728dba`)

**Fișiere noi:**
- `lib/compliance/dnsc-wizard.ts` — `buildDNSCNotificationDraft(meta)` → Markdown, funcție pură
- `lib/compliance/dnsc-wizard.test.ts` — 6 teste (orgName, CUI, sector label, esențial/important, null profile, disclaimer)
- `app/api/nis2/dnsc-status/route.ts` — `GET` + `PUT /api/nis2/dnsc-status`
- `app/dashboard/nis2/inregistrare-dnsc/page.tsx` — wizard 5 pași complet

**Modificate:**
- `lib/server/nis2-store.ts` — `DnscRegistrationStatus` type + `saveDnscRegistrationStatus()` + `getDnscRegistrationStatus()`
- `app/dashboard/page.tsx` — `DnscRegistrationBanner` (inline component) afișat când NIS2 e în applicability tags

**⚠️ Notă log:** Link în sidebar sub NIS2 **skipped** — sidebar-ul (`dashboard-shell.tsx`) nu suportă sub-link-uri (render flat din `dashboardPrimaryNavItems`). Înlocuit cu banner pe dashboard + wizard accesibil din URL direct. De rafinat în Sprint 7 (UX).

---

## Cum pornești Sprint 4

```bash
# 1. Verifică starea curentă
git status
npx vitest run  # should be 422 pass

# 2. Citește spec-ul complet
# docs/definitia-perfecta-de-urmat.md → Sprint 4

# 3. Fișiere de citit înainte de implementare
# app/dashboard/nis2/page.tsx           — pagina NIS2 existentă
# lib/server/nis2-store.ts              — structura Nis2OrgState
# lib/compliance/applicability.ts      — ApplicabilityResult pentru eligibilitate
# components/compliscan/dashboard-shell.tsx  — cum adaugi link în sidebar

# 4. Implementează în ordinea:
#    a) Extinde Nis2OrgState cu dnscRegistrationStatus
#    b) Pagina nouă /dashboard/nis2/inregistrare-dnsc cu wizard 5 pași
#    c) API pentru salvare status (PUT /api/nis2/dnsc-status sau în vendors route)
#    d) Dashboard NextBestAction banner
#    e) Link în sidebar
#    f) Test pentru draft notificare

# 5. La final
git add <fișiere specifice>
git commit -m "Sprint 4: DNSC Registration Wizard"
# /sprint-log close R-13 (sau adaugă R-13 nou în sprint log)
```

---

## Alte contexte utile

### Design tokens folosiți
- `eos-primary`, `eos-surface`, `eos-bg-inset`, `eos-border`, `eos-text`, `eos-text-muted`
- `rounded-eos-md`, `eos-success`, `eos-warning`
- Clasa `ring-focus` pentru input focus

### Wizard pattern existent (model pentru Sprint 4)
`components/compliscan/applicability-wizard.tsx` — wizard 5 pași cu:
- `useState<WizardStep>` pentru step curent
- `useState<WizardState>` pentru valori
- Submit async cu `setSaving(true)` + fetch + error handling
- Render condiționat pe `step === "..."` blocks

### PDF pattern existent (Sprint 4 va folosi asta)
```typescript
// Generează draft notificare DNSC ca PDF:
const res = await fetch("/api/documents/export-pdf", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    content: markdownContent,
    orgName: orgName,
    documentType: "dnsc-notification",
  }),
})
const blob = await res.blob()
// → trigger download
```
