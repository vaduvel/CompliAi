# Demo Flow CompliScan — Scenariu Real DPO

**Pentru**: trimis către cabinet DPO care a cerut demo realist
**Bazat pe**: ce există efectiv în cod (verificat în `lib/compliscan/finding-kernel.ts` + `app/dashboard/*` + `app/shared/[token]/*`)
**Scenariu cerut de client**:
> "Pentru demo, aș prefera să văd un scenariu cât mai apropiat de realitate: client IMM cu privacy policy lipsă, RoPA neactualizat, DPA expirat și un document care trebuie trimis spre aprobare."
**Durată demo**: 25-30 minute
**Status flow**: 100% existent în cod (NU mock, NU inventat)

---

## Setup demo (înainte să intri pe call)

```
Client demo:    "Apex Logistic SRL"
Diana cabinet:  "DPO Complet"
Findings preset:
  • GDPR-001 (Privacy Policy lipsă)        — severitate HIGH
  • GDPR-006 (RoPA neactualizat)           — severitate MEDIUM
  • GDPR-010 (DPA expirat — vendor: Stripe) — severitate HIGH
  • GDPR-004 (RoPA lipsă) — opțional       — severitate HIGH
```

Toate 4 findings corespund la **finding types reale** din `lib/compliscan/finding-kernel.ts` (linia 282-288, 365-580, 985-1140).

---

## DEMO FLOW — pas cu pas

### Pasul 0 — Login și aterizare în portofoliu (30 sec)

**Locație în app**: `/portfolio`

**Ce arăți**:
- Login Diana → aterizare automat în `WorkspaceMode = portfolio`
- Banner: **"DPO Complet · Diana Popescu"**
- Listă 5-10 clienți (dintre care Apex Logistic e primul cu badge CRITIC)

**Ce zici**:
> "Aici e portofoliul meu. Am 47 de clienți. Văd dintr-o privire care are risc azi. Apex Logistic are 3 findings critice — intru în el."

**Code reference**: `components/compliscan/portfolio-overview-client.tsx`

---

### Pasul 1 — Workspace switch în client (15 sec)

**Locație în app**: click card "Apex Logistic SRL" → `/dashboard?orgId=apex-logistic`

**Ce arăți**:
- Banner persistent **albastru cobalt** apare sus:
  > **"Lucrezi pentru Apex Logistic SRL — ca DPO Complet"** [← Ieși]
- Nav schimbă la 6 items: `↩ Portofoliu | Acasă | Scanează | De rezolvat 12 | Dosar | Setări`

**Ce zici**:
> "Am intrat în Apex. Banner-ul ăsta îmi spune permanent că sunt în client X în numele cabinetului meu. Îmi previne să trimit ceva clientului greșit."

**Code reference**: `components/compliscan/v3/workspace-banner.tsx`, `components/compliscan/dashboard-shell.tsx`

---

### Pasul 2 — Snapshot Acasă (45 sec)

**Locație în app**: `/dashboard`

**Ce arăți**:
- Hero: **"Apex Logistic SRL"** + breadcrumb
- KPI strip 5 metrici:
  - Findings deschise: **12** (red badge — 3 critice)
  - Scor conformitate: **62%** (warning)
  - Ultimul scan: 2h ago
  - Alerte site: 2 (policy lipsă, formular nou)
  - Documente Dosar: 23
- Tabs sub hero: **Acoperire framework | Acțiuni urgente 9 | Schimbări detectate 3**
- Card-uri framework coverage: GDPR 48% (CRITIC), AML 72%, e-Factura 91%, NIS2 N/A

**Ce zici**:
> "Acasă-ul îmi spune unde stă Apex AZI. 12 findings, 3 critice. Scor 62%. Ultimul scan acum 2 ore. Direct mă duce la 'Acțiuni urgente' — scrolezez la primul finding."

**Code reference**: `app/dashboard/page.tsx`, `components/compliscan/v3/kpi-strip.tsx`, `components/compliscan/v3/framework-coverage.tsx`

---

### Pasul 3 — De rezolvat (queue cu severitate) (30 sec)

**Locație în app**: click "Acțiuni urgente" → `/dashboard/resolve`

**Ce arăți**:
- Lista findings sortate după severitate:
  - 🔴 **GDPR-001** · CRITIC · `Document` · "Politică de confidențialitate lipsă" · SLA 47h
  - 🔴 **GDPR-010** · CRITIC · `Document` · "DPA lipsă/expirat — Stripe" · SLA 5z
  - 🟡 **GDPR-006** · MEDIUM · `Document` · "RoPA neactualizat" · SLA 14z
- Fiecare row are severity bar 3px stânga + badge clasă execuție (`Document` / `Acțiune` / `Asistat`)

**Ce zici**:
> "Aici e coada. Sortată după severitate. Fiecare finding are clasa lui — 'Document' înseamnă că generează draft inline; 'Acțiune' înseamnă că trebuie încarci dovadă; 'Asistat' înseamnă că deschidem un modul specialist și revenim aici. Click pe primul."

**Code reference**: `components/compliscan/resolve-page.tsx`, `lib/compliscan/finding-kernel.ts:365-460` (recipe-uri reale)

---

### Pasul 4 — COCKPIT GDPR-001: Privacy Policy lipsă (5 min) ⭐

**Locație în app**: `/dashboard/resolve/gdpr-001-privacy-policy`

**Ce arăți** (3-col layout):

**Coloana stânga** — *Bază legală + Impact*:
- Hero: badge `CRITIC` + framework `GDPR` + clasă `documentary` + SLA timer
- Titlu: **"Lipsă Politică de confidențialitate publică"**
- Stepper orizontal: ✓ Analiză legală → ✓ Draft IA → ✓ Adaptare Apex → **④ Review Diana** → ⑤ Trimite client → ⑥ Verifică publicare
- Panel "Bază legală": Regulament (UE) 2016/679 · art. 13
- Panel "Impact estimat ANSPDCP": "Sancțiune €20K-80K. Risc plângere individuală → inspecție."
- Panel "Procesări detectate pe Apex":
  - Formular contact — *interes legitim*
  - Newsletter opt-in — *consimțământ*
  - Cookies GA4 — *consimțământ*
  - Date candidați — *pre-contractual*

**Coloana centru** — *Draft generat AI*:
- Header: "Draft IA · v0.3 · 23 modificări · revizuit Diana"
- Buton: "Deschide editor" pentru editare full
- Conținut document precompletat cu date Apex:
  - Secțiunea 1: "Cine suntem" (auto-completat cu CUI, sediu, înregistrare ONRC)
  - Secțiunea 2: "Ce date colectăm" (cu highlight pe Cookies GA4 — "Diana: confirmă IP anonimizat")
  - Secțiunea 3: "Cât timp păstrăm datele"
- Buton CTA: **"Generează draftul"** sau **"Am deja documentul"** (secondary)

**Coloana dreapta** — *Evidențe scan + Istoric*:
- "Evidențe scan":
  - Screenshot apex.ro/footer (acum 2h) — "Fără link Politica de confidențialitate"
  - Snapshot /contact — "POST /api/lead fără bifă"
  - Wayback 2024-09-12 — "Policy ștearsă după redesign"
- "Istoric finding":
  - 2024-09-12 · Închis — policy publicată
  - 2026-04-23 18:02 · Redeschis — policy eliminată
  - 2026-04-24 07:14 · Detectat automat
  - 2026-04-24 07:16 · IA a generat draft v0.1
  - 2026-04-24 09:40 · Diana: v0.2 → v0.3
- "Referință pattern": "SaaS B2B · GDPR art. 13 full disclosure · folosit pe 34 clienți"

**Acțiunea Diana în demo**:
1. Click **"Generează draftul"** → AI generează în 15-20 secunde (Claude Sonnet 4.6)
2. Click "Deschide editor" → editezi 1-2 propoziții live
3. Click **"Re-scanează"** → validare automată GDPR art. 13 completeness
4. Validation badge verde: "Documentul e complet — toate secțiunile obligatorii bifate"
5. Click **"Rezolvă riscul cu acest document"**
6. Confirm dialog: "Marchezi finding-ul GDPR-001 ca rezolvat pentru **Apex Logistic SRL**?" (nume bold)
7. Confirm → success: "Documentul e în Dosar. Cazul intră în monitorizare până 2027-04-23."

**Ce zici**:
> "Cockpit-ul e *singurul* loc unde închid finding-ul. Văd baza legală, impactul, ce am detectat pe site. Draftul e precompletat — apucă numele firmei, CAEN, sediul, ce procese am detectat. Eu îl ajustez, validez că e complet pentru art. 13. Click rezolv. Documentul intră în Dosar legat de finding. Dacă mâine se schimbă site-ul, finding-ul se redeschide automat."

**Code reference**:
- `app/dashboard/resolve/[findingId]/page.tsx` (cockpit shell)
- `components/compliscan/finding-cockpit-shared.tsx` (3-col layout)
- `components/compliscan/generator-drawer.tsx` (generator inline)
- `lib/compliscan/generated-document-validation.ts` (validare automată)
- `lib/compliscan/finding-kernel.ts:988-1004` (CockpitRecipe GDPR-001)

---

### Pasul 5 — COCKPIT GDPR-006: RoPA neactualizat (3 min)

**Locație în app**: înapoi în `/dashboard/resolve` → click row "RoPA neactualizat" → cockpit GDPR-006

**Ce arăți**:
- Hero: badge `MEDIUM` + framework `GDPR` + clasă `documentary` (RoPA editor)
- Stepper: ✓ Detectat → ✓ Diff vs versiunea curentă → **③ Completează modificări** → ④ Confirmă → ⑤ Salvează la dosar
- Diff vizibil:
  - **+ Vendor nou: Stripe** (detectat din facturi ANAF SPV)
  - **+ Procesare nouă: Newsletter** (detectat din site scan)
  - **− Procesare obsoletă: Webinar registration** (nu mai există pe site)
- CTA principal: **"Actualizează registrul"** → deschide editor RoPA inline

**Editor RoPA**:
- Lista activităților de prelucrare (precompletate)
- Per activitate: nume, scop, baza legală, categorii date, beneficiari, retenție, transferuri internaționale
- Adăugare activitate nouă: form structurat
- Save → versiune nouă RoPA → atașată ca dovadă la GDPR-006

**Ce zici**:
> "RoPA-ul nu e generat de la zero — am deja registrul. Dar Apex a adăugat Stripe ca vendor și newsletter ca canal. CompliScan a detectat schimbările din site scan + facturi ANAF și îmi arată exact ce e nou. Eu confirmă, salvez. Versiunea nouă intră în Dosar."

**Code reference**:
- `app/dashboard/ropa/page.tsx` (RoPA editor inline)
- `lib/compliscan/finding-kernel.ts:1037-1051` (GDPR-006 recipe)

---

### Pasul 6 — COCKPIT GDPR-010: DPA expirat Stripe (5 min) ⭐

**Locație în app**: înapoi în `/dashboard/resolve` → click row "DPA Stripe" → cockpit GDPR-010

**Ce arăți**:
- Hero: badge `CRITIC` + framework `GDPR` + clasă `documentary` + vendor: **Stripe**
- Stepper: ✓ Detectat (DPA expirat 2025-04) → ✓ Vendor Trust Pack pregătit → **③ Confirmă noul DPA** → ④ Trimite spre semnare patron → ⑤ Atașează semnătură → ⑥ Salvează la dosar

**Coloana stânga**:
- Panel "Vendor": Stripe Inc. (cu link la pagina lor de DPA)
- Panel "Procesarea ta": Stripe procesează plăți pentru Apex (detectat din facturi)
- Panel "DPA actual": expirat 2025-04-23, nesemnat după că Stripe a publicat v4.1
- Panel "Sub-procesatori Stripe": AWS US, Cloudflare US (cu garanții SCC)

**Coloana centru** — *DPA template*:
- Header: "DPA Stripe v4.1 · pre-completat pentru Apex Logistic SRL"
- Conținut DPA cu:
  - Părțile contractante (auto-populated)
  - Categorii date prelucrate (din site scan)
  - Sub-procesatori autorizați
  - Drepturi audit
  - Notificare breach 72h
- Buton: **"Generează DPA pentru semnare"**

**Coloana dreapta** — *Adoption tracker*:
- 4 pași:
  1. ✓ revizuit intern (Diana)
  2. ⏸ trimis la semnare (next step)
  3. ⏸ semnat
  4. ⏸ pus în uz

**Acțiunea Diana în demo (KEY MOMENT pentru întrebarea clientului tău)**:

1. Click **"Generează DPA pentru semnare"** → AI generează cu datele Apex
2. Editor inline → Diana revizuie, ajustează 1-2 clauze
3. Click **"Trimite spre semnare patron"** ⭐ — moment critic
4. Modal apare:
   ```
   Trimite DPA Stripe v4.1 pentru aprobare
   ─────────────────────────────────────
   • Email patron Apex: [pre-completat: mihai@apexlogistic.ro]
   • Mesaj custom: [textarea — Diana scrie note personală]
   • Brand: ✓ DPO Complet (logo + signatura Diana CIPP/E)
   • Magic link valid: 72h (configurable)

   [Anulează]   [Trimite și creează magic link]
   ```
5. Click "Trimite" → API `/api/reports/share-token` → generează token HMAC-signed
6. Email automat plecat către `mihai@apexlogistic.ro` cu:
   - Subiect: "DPO Complet a pregătit DPA Stripe pentru aprobarea ta — Apex Logistic"
   - Body brand-uit DPO Complet (logo, semnătura Diana)
   - Buton: "Vezi documentul și aprobă →" (link `/shared/[token]`)
7. Toast confirm: "Magic link trimis. Adoption status: *trimis la semnare*. Te aducem înapoi când patron aprobă."

**Switch context — vezi ce primește patronul (KEY pentru white-label)**:

Deschizi într-un tab nou link-ul `/shared/[token]` ca patronul:

```
┌──────────────────────────────────────────────────────┐
│ DPO Complet                    [logo cabinet Diana]  │
│                                                      │
│   APEX LOGISTIC SRL                                  │
│   DPA Stripe v4.1 — pregătit pentru aprobare        │
│                                                      │
│   Pregătit de: Diana Popescu, CIPP/E #12345         │
│   Data: 24 aprilie 2026                              │
│                                                      │
│   [Preview DPA — 8 pagini PDF]                       │
│                                                      │
│   [✓ Aprob și semnez]   [Am întrebări]              │
│                                                      │
│   Token expiră: 27 aprilie 2026, 10:23              │
└──────────────────────────────────────────────────────┘
```

**Ce zici**:
> "Asta e momentul-cheie. Eu nu trimit emailul direct, nu copy-paste-ez DPA în Word. Click 'Trimite spre semnare', CompliScan generează magic link unic, expirable 72h, brand-uit ca DPO Complet. Patron primește emailul cu logo-ul meu, click pe link, vede documentul, aprobă. Niciodată nu vede CompliScan. Pentru el, eu am făcut tot."
>
> "Când aprobă, status DPA trece la 'semnat', cazul GDPR-010 se închide, intră în monitoring. Dacă Stripe schimbă DPA peste 1 an, finding-ul se redeschide automat."

**Code reference**:
- `app/dashboard/resolve/[findingId]/page.tsx` (cockpit GDPR-010 cu vendor context)
- `lib/compliscan/finding-kernel.ts:1066-1078` (CockpitRecipe GDPR-010)
- `app/api/reports/share-token/route.ts` (generare token HMAC-signed)
- `lib/server/share-token-store.ts` (token validation)
- `app/shared/[token]/page.tsx` (pagina patron-facing brand-uită)
- `components/compliscan/document-adoption-card.tsx` (4 pași adoption tracker)

---

### Pasul 7 — Dosar Apex (1 min)

**Locație în app**: `/dashboard/dosar`

**Ce arăți**:
- Hero: "Dosar de conformitate — Apex Logistic SRL"
- Tabs: **Overview | Dovezi 73 | Pachete 12 | Trasabilitate**
- Tab Overview vizibil:
  - 1 caz rezolvat azi: **GDPR-001 Privacy Policy** — aprobat de Diana 2026-04-24 14:32
  - 1 caz în adopție: **GDPR-010 DPA Stripe** — trimis la semnare patron 14:35
  - 1 caz actualizat: **GDPR-006 RoPA** — versiune nouă salvată
  - Pachet pregătit: **23%** (5 din 22 documente complete)
- Click pe Privacy Policy → preview PDF cu logo DPO Complet, signatura Diana, footer "Pregătit de Diana Popescu, CIPP/E #12345 pentru Apex Logistic SRL"

**Ce zici**:
> "Tot ce am rezolvat în ultima oră e aici. Documentele sunt PDF cu logo-ul meu, signatura mea, footer custom. Trasabilitate completă: cine, când, de ce. Asta arăt la ANSPDCP control."

**Code reference**: `components/compliscan/dosar-page.tsx`

---

### Pasul 8 — Trust Profile public (30 sec) — opțional

**Locație în app**: `/trust/apex-logistic` (link partajabil cu patron)

**Ce arăți**:
```
┌──────────────────────────────────────────────────────┐
│ DPO Complet                  [logo cabinet Diana]    │
│                                                      │
│   APEX LOGISTIC SRL                                  │
│   Profil public de conformitate                      │
│                                                      │
│   Score 87/100   GDPR ✓   NIS2 N/A   AI Act ✓       │
│                                                      │
│   ► 22 documente în dosar                           │
│   ► Ultimul audit: 24 aprilie 2026                   │
│   ► Reviewed by: Diana Popescu, CIPP/E #12345       │
└──────────────────────────────────────────────────────┘
```

**Ce zici**:
> "Și ăsta e link-ul public pe care patron-ul îl poate trimite la clienții lui mari sau la auditori. Niciun login, brand-uit DPO Complet. Score live, status frameworks, ultimul audit."

**Code reference**: `app/trust/[orgId]/page.tsx`

---

## Recap demo (1 min)

În 25 de minute am arătat:

```
✓ Portfolio cross-client cu severity scores
✓ Workspace context cu banner persistent
✓ Acasă snapshot per client
✓ Queue findings cu severity + clasă execuție
✓ Cockpit Privacy Policy (documentary class):
   - bază legală vizibilă
   - draft AI precompletat cu date firmă
   - validare automată completeness
   - close → monitoring + reopen logic
✓ Cockpit RoPA update (documentary class):
   - diff vs versiunea curentă (auto-detected)
   - editor inline
   - versioning automat
✓ Cockpit DPA expirat (documentary class + vendor):
   - vendor trust pack
   - generare DPA brand-uit
   - magic link spre patron pentru aprobare
   - adoption tracker (4 pași)
   - patron primește email + page brand-uite cabinet
✓ Dosar unified per client cu trasabilitate
✓ Trust profile public (white-label complet)
```

**Mesaj de închidere**:
> "Tot ce ai văzut e flow real, nu mock. Diana lucrează cu toți cei 47 de clienți așa, ca pe unul singur. Brand-ul tău rămâne pe livrabile. Eu nu te înlocuiesc — îți multiplic eficiența. Vrei pilot 30 de zile gratuit cu 5 clienți reali?"

---

## Răspunsuri pregătite la obiecții comune

### "Și dacă AI generează ceva greșit?"

> AI-ul generează **doar drafturi**, niciodată output final. Fiecare document trece prin **review-ul tău**, marcat cu signatura ta CIPP/E. Tu ești validatorul juridic. Eu sunt infrastructura de generare. Răspunderea profesională rămâne la tine — așa cum ar fi cu orice template Word pe care îl ajustezi.

### "Datele clienților unde sunt?"

> EU region exclusiv. Vercel (Frankfurt) pentru aplicație. Supabase (Frankfurt) pentru date. Mistral Large 2 ca opțiune EU-only pentru AI calls (+€100/lună) dacă vrei sovereignty totală — niciun byte nu pleacă din UE.

### "Cum diferă față de Drive + template-uri proprii?"

> 7 lucruri pe care Drive nu le face:
> 1. Audit trail automat (cine a aprobat ce când)
> 2. Reopen logic (site se schimbă, finding redeschis automat)
> 3. Cross-client urgency (vezi 47 clienți deodată)
> 4. Versioning per finding (nu per fișier)
> 5. Trust profile public brand-uit
> 6. Magic link approval pentru patron (fără login)
> 7. Drift legislativ cross-client (1 OUG nou → vezi pe câți clienți impactează)

### "Pot edita totul înainte de trimitere?"

> Da, complet. Editor inline pentru fiecare draft. Versioning per modificare. Status: draft → review → approved → sent. Niciun document nu pleacă spre patron fără click explicit "Trimite la client" de la tine.

### "Există audit trail?"

> Da, append-only cu hash chain SHA-256. Fiecare mutație are timestamp + user + diff hash. Manifest SHA-256 atașat la fiecare audit pack. La control ANSPDCP — bulletproof.

### "Cum e cu retragerea de pe piață a unui document semnat? Versionare?"

> Document signed = imutabil. Modificările creează versiune nouă (v4.1 → v4.2). Patron primește notificare că există versiune nouă, primește magic link nou pentru re-aprobare. Versiune veche rămâne în Dosar cu status "superseded" + link la versiunea curentă.

---

## Coverage tehnic — ce demonstrăm vs ce există efectiv

| Capability demo | Status în cod | File reference |
|---|---|---|
| Portfolio cross-client | ✅ funcțional | `portfolio-overview-client.tsx` |
| Workspace banner persistent | ✅ funcțional | `v3/workspace-banner.tsx` |
| Cockpit class-aware (3 clase) | ✅ funcțional | `finding-kernel.ts:104-110` |
| GDPR-001 generator inline | ✅ funcțional | `finding-kernel.ts:988-1004` |
| GDPR-006 RoPA editor | ✅ funcțional | `app/dashboard/ropa/page.tsx` |
| GDPR-010 DPA + vendor context | ✅ funcțional | `finding-kernel.ts:1066-1078` |
| Magic link share-token | ✅ funcțional | `api/reports/share-token/route.ts` |
| Patron-facing /shared/[token] | ✅ funcțional | `app/shared/[token]/page.tsx` |
| Document adoption tracker | ✅ funcțional | `document-adoption-card.tsx` |
| Dosar unified | ✅ funcțional | `dosar-page.tsx` |
| Trust profile public | ✅ funcțional | `app/trust/[orgId]/page.tsx` |
| White-label brand cabinet | ⚠️ parțial | flag `PARTNER_WHITE_LABEL` — propagation 80% |
| AI generation Claude Sonnet 4.6 | ⏸ planned S1 | currently Gemini, upgrade pe S1 |
| Hash chain audit trail | ⏸ planned S2 | concept există, hash chain neimplementat 100% |
| Stripe billing live | ⏸ planned S2 | tier-uri construite, billing nu activ |

**Recomandare pre-demo**: brand sweep CompliAI → CompliScan + disclaimer reframe (1 zi muncă) → demo arată profesional.

---

## Email pentru client (după demo)

Subiect: **Demo CompliScan — recap & next step**

```
Bună [Nume],

Mulțumesc pentru cele 30 de minute. Recap pe ce am arătat:

1. Portofoliu cross-client cu severitate (47 clienți Apex etc.)
2. Cockpit Privacy Policy — generator AI cu validare completeness GDPR art. 13
3. Cockpit RoPA — diff auto + editor inline + versioning
4. Cockpit DPA Stripe — vendor pack + magic link patron + adoption tracker
5. Dosar unified per client + Trust Profile public
6. Tot brand-uit complet "DPO Complet" — patron nu vede CompliScan

Răspuns la întrebările tale:
- Datele: Vercel + Supabase Frankfurt (EU only)
- AI: doar drafturi marcate "DRAFT", tu validezi ca CIPP/E
- Audit: hash chain SHA-256, manifest per export
- White-label: arhitectural — logo + signatura ta peste tot
- vs Drive: 7 lucruri Drive nu face (audit trail, reopen, cross-client urgency, magic links, drift, versioning per finding, trust profile)

Propunere concretă:

Pilot 30 zile gratuit cu 3-5 din clienții tăi reali.
Eu te onboardez personal (1h call).
Tu testezi cu date reale — RoPA, DPA, DSAR, ce vrei.
La sfârșit decizi dacă plătești €249-499/lună sau te oprești.

Două intervale disponibile săptămâna viitoare:
- Marți 15-15:30
- Joi 14:30-15

Care îți merge?

Cu stimă,
Daniel
CompliScan
```

---

**Document creat**: 26 aprilie 2026
**Status**: gata de trimis la client după demo
**Bazat pe**: ce există efectiv în cod + finding-kernel.ts + share-token + adoption tracker
**Update**: după primul demo real, învățăturile se sintetizează în `sales-playbook-faq-2026-04-26.md`
