# Sprint Log — EOS Design System Maturity
> Bazat pe: Analiză maturitate EOS v1.0 (2026-03-28) + feedback visual polish utilizator
> Referință: `docs/eos-maturity-analysis.md`
> Skill: `/sprint-log` pentru actualizări

---

## Stare curentă

| Sprint | Titlu | Status | Prioritate | Efort |
|--------|-------|--------|-----------|-------|
| DS-1 | Visual Polish — spațiere, icoane, aliniere, simetrie | 🔵 Planificat | 🔴 P1 | M (3-4 zile) |
| DS-2 | Form Library — Input, Select, Checkbox, Radio, Switch, Textarea | 🔵 Planificat | 🔴 P1 | L (1-2 săpt.) |
| DS-3 | Dialog / Modal component | 🔵 Planificat | 🔴 P1 | S (2-3 zile) |
| DS-4 | Skeleton / Loading states | 🔵 Planificat | 🔴 P1 | S (2-3 zile) |
| DS-5 | Table component | 🔵 Planificat | 🟡 P2 | M (1 săpt.) |
| DS-6 | Tooltip + Popover | 🔵 Planificat | 🟡 P2 | S (2 zile) |
| DS-7 | Pagination + Breadcrumb | 🔵 Planificat | 🟡 P2 | S (2 zile) |
| DS-8 | index.ts barrel export + tokens.json | 🔵 Planificat | 🟢 P3 | XS (4h) |

---

## DS-1 — Visual Polish: spațiere, icoane, aliniere, simetrie

**Origine:** Feedback utilizator (2026-03-28) — "clean, reduce waste space, simetrie, aliniere icons size, icon buttons, spațiere"

**Scor actual EOS:** Spacing 95% · Token usage 92% — dar există inconsistențe vizuale tactice în implementare.

### Probleme de rezolvat

#### 1. Icon sizes inconsistente
Sistemul trebuie să respecte 3 dimensiuni și NUMAI 3:
- `size-4` (16px) — icon în buton cu text, icon inline în text
- `size-5` (20px) — icon standalone action, navigare sidebar
- `size-6` (24px) — icon prominent, header, ilustrativ

Orice `size-3`, `size-3.5`, `size-[18px]`, `size-[14px]`, `size-[22px]` = de standardizat.

#### 2. Gap inconsistent în butoane cu icoane
- Standard: `gap-2` (8px) între icon și text în orice buton
- De verificat și corectat: `gap-1`, `gap-1.5`, `gap-3`, `gap-4` în butoane cu icon+text

#### 3. Spațiu irosit pe carduri
- Carduri cu `py-8` sau `py-10` cu conținut mic → reduce la `py-5`
- Secțiuni cu `space-y-12` sau `space-y-16` între elemente similare → reduce la `space-y-6` sau `space-y-8`
- `CardContent` cu padding inconsistent pe aceeași pagină (`px-4` lângă `px-6`) → standardizare la `px-5`

#### 4. Simetrie padding stânga-dreapta
- Elemente cu `pl-6 pr-4` (asimetrice) → `px-5` uniform
- Butoane în același rând cu înălțimi diferite (`h-8` lângă `h-10`) → standardizare pe scala `h-8/h-9/h-10`

#### 5. Aliniere verticală icon + text
- Toate containerele cu icon+text trebuie să aibă `items-center`
- Verificare pe: navigare, liste de acțiuni, card headers, badge-uri compuse

### Fișiere prioritare de auditat

- `components/compliscan/dashboard-shell.tsx` — sidebar, navigare, user card
- `components/compliscan/navigation.ts` — definițiile de nav cu icoane
- `components/evidence-os/Button.tsx` — componenta de bază
- `components/evidence-os/PageIntro.tsx` — header pagini
- `components/evidence-os/SummaryStrip.tsx` — strip de metrici
- `components/evidence-os/HandoffCard.tsx` — card handoff
- `components/evidence-os/MetricTile.tsx` — tile metric
- `app/dashboard/page.tsx` — dashboard home
- `app/dashboard/checklists/page.tsx` — De rezolvat
- `components/compliscan/reports-page.tsx` — Rapoarte

### Regulă de aplicare

```
Icon în buton cu text    → size-4 + gap-2 + items-center
Icon în navigare         → size-5 + gap-3 + items-center
Icon standalone (action) → size-5, touch target min 40×40px
Card padding standard    → px-5 py-5
Card padding compact     → px-4 py-4
Secțiune gap             → space-y-6 (normal) / space-y-4 (compact)
```

**Definition of Done:**
- [ ] Audit complet pe 10 fișiere prioritare
- [ ] Icon sizes: doar `size-4`, `size-5`, `size-6` în întreaga aplicație
- [ ] Gap în butoane cu icon+text: uniform `gap-2`
- [ ] Padding carduri: consistent `px-5 py-5` sau `px-4 py-4` pe aceeași pagină
- [ ] Nicio asimetrie padding stânga vs. dreapta neintențională
- [ ] `items-center` pe toate containerele cu icon+text
- [ ] Build TypeScript curat, zero erori vizuale noi

**Log:**
| Data | Autor | Notă |
|------|-------|------|
| 2026-03-28 | Claude | Sprint creat din feedback utilizator + EOS maturity audit |

---

## DS-2 — Form Library

**Origine:** EOS Maturity Analysis — gap critic (0/27 doneness), blocat Stage 2→3

**Problema:** Toate formularele din aplicație (settings, onboarding, scan config, NIS2 wizard, GDPR wizard) folosesc Radix UI primitives sau HTML brut fără EOS tokens. Suprafața vizuală este inconsistentă cu rest sistemului.

**Componente de construit (în ordinea priorității):**
1. `Input` — text input cu label, helper text, error state, disabled
2. `Select` — dropdown cu search opțional
3. `Textarea` — multi-line input
4. `Checkbox` — cu label și stare indeterminate
5. `Radio` + `RadioGroup` — single selection
6. `Switch` — toggle binary

**Spec per componentă (minim):**
- Înălțime: `h-9` (36px) — aliniată cu Button `size="sm"`
- States: default, hover, focus (ring EOS primary), disabled, error
- Token-uri: folosesc exclusiv `--eos-*` variables
- Dark mode: verificat pe ambele teme
- Exportate din `components/evidence-os/index.ts`

**Fișiere de creat:**
- `components/evidence-os/Input.tsx`
- `components/evidence-os/Select.tsx`
- `components/evidence-os/Textarea.tsx`
- `components/evidence-os/Checkbox.tsx`
- `components/evidence-os/Radio.tsx`
- `components/evidence-os/Switch.tsx`

**Definition of Done:**
- [ ] Toate 6 componente implementate
- [ ] Fiecare are: default + hover + focus + disabled + error state
- [ ] Zero valori hardcoded — doar EOS tokens
- [ ] Dark mode verificat
- [ ] Exportate din `index.ts`
- [ ] Înlocuite în minim 2 pagini existente (settings + onboarding)
- [ ] Build TypeScript curat

**Log:**
| Data | Autor | Notă |
|------|-------|------|
| 2026-03-28 | Claude | Sprint creat din EOS maturity analysis — gap critic |

---

## DS-3 — Dialog / Modal Component

**Origine:** EOS Maturity Analysis — gap critic, confirmările critice nu au container propriu

**Problema:** Confirmările de acțiuni critice (ștergere workspace, mark-done bulk, reset) sunt gestionate prin toast sau redirect, fără dialog modal. Utilizatorul nu are un moment de confirmare clar în context.

**Spec:**
- Bazat pe Radix UI `Dialog` (deja în dependențe)
- Variante: `sm` (480px), `md` (640px), `lg` (960px)
- Padding intern: 24px
- Close button: top-right, întotdeauna vizibil
- Acțiuni: bottom-right, buton primar pe dreapta
- Overlay: `rgba(0,0,0,0.5)` cu `backdrop-blur-sm`
- Escape key închide dialogul
- Focus trap: Tab ciclează doar în interior

**Fișiere de creat:**
- `components/evidence-os/Dialog.tsx`

**Utilizări imediate după implementare:**
- Confirmare ștergere finding
- Confirmare bulk mark-done
- Confirmare reset workspace din Settings

**Definition of Done:**
- [ ] Dialog implementat cu toate variantele de dimensiune
- [ ] Focus trap funcționează
- [ ] Escape key funcționează
- [ ] Overlay corect
- [ ] Dark mode verificat
- [ ] Exportat din `index.ts`
- [ ] Folosit în minim 1 acțiune critică existentă
- [ ] Build TypeScript curat

**Log:**
| Data | Autor | Notă |
|------|-------|------|
| 2026-03-28 | Claude | Sprint creat din EOS maturity analysis |

---

## DS-4 — Skeleton / Loading States

**Origine:** EOS Maturity Analysis — gap critic (0/27 doneness), impact perceput major pe performanță

**Problema:** Toate paginile async (`LoadingScreen`) afișează text "Se încarcă..." sau ecran gol. Utilizatorul nu vede structura paginii în timp ce se încarcă datele — creierul percepe așteptarea ca mai lungă decât este.

**Componente de construit:**
1. `Skeleton` — bloc rectangular animat (pulse)
2. `SkeletonText` — linii de text placeholder (1-5 linii)
3. `SkeletonCard` — card complet placeholder
4. `SkeletonMetric` — tile metric placeholder

**Utilizare:**
```tsx
// Înlocuiește textul static cu structura reală
<Skeleton className="h-8 w-32" />           // număr mare
<SkeletonText lines={3} />                  // paragraf
<SkeletonCard />                             // card complet
```

**Locații de înlocuit `LoadingScreen`:**
- `app/dashboard/page.tsx` → skeleton pentru score ring + metrici
- `app/dashboard/checklists/page.tsx` → skeleton pentru board
- `components/compliscan/scan-history-page.tsx` → skeleton pentru liste

**Fișiere de creat:**
- `components/evidence-os/Skeleton.tsx`

**Definition of Done:**
- [ ] `Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonMetric` implementate
- [ ] Animație: `animate-pulse` cu opacitate EOS-aware
- [ ] Dark mode verificat (skeleton mai luminos decât suprafața)
- [ ] Exportat din `index.ts`
- [ ] Înlocuit în minim 3 pagini: Dashboard, De rezolvat, Scanare
- [ ] Build TypeScript curat

**Log:**
| Data | Autor | Notă |
|------|-------|------|
| 2026-03-28 | Claude | Sprint creat din EOS maturity analysis |

---

## DS-5 — Table Component

**Origine:** EOS Maturity Analysis — gap P2, date compliance necesită tabelar

**Problema:** Findings, tasks, scan history, vendor list sunt afișate ca liste de carduri. Nu există sort, nu există filter per coloană, nu există densitate variabilă. Utilizatorul cu 20+ findings nu poate prioritiza eficient.

**Spec:**
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableHead`
- Densitate: compact (32px/row), default (40px/row), comfortable (48px/row)
- Sort: header clickabil cu indicator direcțional
- Sticky header pe scroll
- Row hover state pentru scanabilitate
- Coloane numerice: right-aligned + `font-variant-numeric: tabular-nums`
- Empty state integrat

**Definition of Done:**
- [ ] Componente Table implementate
- [ ] Sort funcționează pe coloane
- [ ] Sticky header funcționează
- [ ] 3 densități disponibile
- [ ] Empty state funcționează
- [ ] Dark mode verificat
- [ ] Exportat din `index.ts`
- [ ] Folosit în minim 1 pagină (ex: Findings list sau Tasks)
- [ ] Build TypeScript curat

**Log:**
| Data | Autor | Notă |
|------|-------|------|
| 2026-03-28 | Claude | Sprint creat din EOS maturity analysis |

---

## DS-6 — Tooltip + Popover

**Origine:** EOS Maturity Analysis — termeni compliance fără explicații hover

**Problema:** Termeni ca "EU AI Act Art. 9", "NIS2 Art. 23", "DORA RTS", "e-Factura CIUS-RO" nu au explicații hover. Utilizatorul fără background juridic este blocat.

**Definition of Done:**
- [ ] `Tooltip` implementat (hover, 150ms delay, keyboard-accessible)
- [ ] `Popover` implementat (click, dismiss on outside click + Escape)
- [ ] Dark mode verificat
- [ ] Exportate din `index.ts`
- [ ] Folosite în minim 3 termeni compliance existenți
- [ ] Build TypeScript curat

**Log:**
| Data | Autor | Notă |
|------|-------|------|
| 2026-03-28 | Claude | Sprint creat din EOS maturity analysis |

---

## DS-7 — Pagination + Breadcrumb

**Origine:** EOS Maturity Analysis — navigare incompletă

**Breadcrumb:**
- Pentru pagini la ≥3 niveluri adâncime (`/dashboard/reports/vault`)
- Format: `Rapoarte > Vault` cu separator `/` sau `›`
- Ultimul element: non-link, bold

**Pagination:**
- Pentru liste cu >10 elemente (findings, tasks, vendor list)
- Format: `← Prev · 1 2 3 ... 8 · Urm →`
- Keyboard-accessible

**Definition of Done:**
- [ ] `Breadcrumb` implementat și folosit pe paginile adânci
- [ ] `Pagination` implementat
- [ ] Dark mode verificat
- [ ] Exportate din `index.ts`
- [ ] Build TypeScript curat

**Log:**
| Data | Autor | Notă |
|------|-------|------|
| 2026-03-28 | Claude | Sprint creat din EOS maturity analysis |

---

## DS-8 — index.ts barrel export + tokens.json

**Origine:** EOS Maturity Analysis — developer experience, lipsă total

**Problema:** Nu există `components/evidence-os/index.ts`. Import-urile sunt făcute direct pe cale (`from "@/components/evidence-os/Button"`). La 57+ componente, asta devine ingestibil.

**tokens.json:** Export al token-urilor în format W3C DTCG pentru sincronizare Figma/Style Dictionary.

**Definition of Done:**
- [ ] `components/evidence-os/index.ts` creat cu toate exporturile
- [ ] `docs/eos-tokens.json` generat din `app/evidence-os.css`
- [ ] Nicio importare directă pe cale nu e broken
- [ ] Build TypeScript curat

**Log:**
| Data | Autor | Notă |
|------|-------|------|
| 2026-03-28 | Claude | Sprint creat din EOS maturity analysis |
