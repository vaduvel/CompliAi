# DESIGN-BRIEF.md — CompliAI pentru Claude Design (2026-04-20)

> **Audiență**: un LLM de design care primește acest document și trebuie să producă un design system + UI kit enterprise-grade pentru CompliAI.
>
> **Regula**: dacă ceva nu e scris aici, e liber să întrebi. Nu inventa tonalitate sau entități pe care nu le confirm.

---

## 1. CE ESTE COMPLIAI — ÎN 5 PROPOZIȚII

1. **Workbench pentru consultanți români de compliance** (contabili / consultanți externi) care jonglează cu 10-30 clienți SRL pe GDPR + e-Factura + NIS2 + AI Act + DORA.
2. **Watchdog cross-client**: 16 cron-uri + 5 agenți AI monitorizează 24/7 toate firmele din portofoliu și produc un singur Inbox unde utilizatorul primar intră dimineața.
3. **Output-ul principal NU e "scor de compliance"**, ci **dovezi audit-shaped**: fiecare acțiune produce evidence în formatul cerut de ANSPDCP / DNSC / ANAF, gata de trimis când vine cererea.
4. **Piața**: Romania only, ~2.800 cabinete contabile cu 3+ clienți, sweet spot €149/lună. Competitor local: Huddle.ro (greenfield, 12-18 luni fereastră). Aspirational: Vanta / Drata pentru tonalitate enterprise, Linear pentru densitate + claritate operațională.
5. **Ce NU suntem**: ERP, CRM, e-signature, training platform, backup, chat marketing-y. Nu construim dashboard-uri vanity. Nu folosim gamification.

---

## 2. PROBLEMA UI ACTUALĂ (de ce chem un designer)

- UI-ul curent folosește primitive corecte (Tailwind + shadcn + tokens proprii sub numele `eos-*`) dar **arată copilăresc**: card-uri cu prea mult padding, iconițe lucide peste tot, umbră soft, rotunjimi mari, spacing-ul tipic "landing page SaaS 2021".
- **Densitate greșită**: Diana are 20 clienți × 5 findings/zi = **100+ rânduri de acționat zilnic**. UI-ul curent e construit pentru "5 findings = 5 card-uri generoase". Scale fail.
- **Ierarhia vizuală e plată**: severity critic și severity "info" arată aproape la fel după ce scroll-ezi 30 secunde. Ochiul nu e ghidat.
- **Tonalitate greșită**: compliance = lucru grav, dar NU panicard. UI-ul actual oscilează între "startup prietenos" și "alertă roșie peste tot". Noi vrem **calm autoritar** (gen: cockpit de avion, nu alarmă de incendiu).
- **Lipsă disciplină tipografică**: 6 mărimi de font folosite aleator, fără ritm.

**Direcția dorită**: **"Linear meets Vanta"** — densitate Linear, seriozitate Vanta, fără fețele zâmbitoare.

---

## 3. PERSONA PRIMARĂ — DIANA (€149/lună, target direct pentru design)

**Cine**: Consultant contabil CECCAR, 32-48 ani, majoritar femeie, lucrează pe cont propriu sau cu 3-15 staff. Gestionează 10-30 clienți SRL/PFA.

**Stare emoțională**: **burnout cronic**. Suprasolicitată. Citat verbatim (sursă publică RO 2024): *"Nu mai rezistăm. Jumătate din contabili își pun deja problema să renunțe."* Vrea tool-uri care **reduc click-uri, nu adaugă**.

**Literacy digitală**: **înaltă pe fiscal** (SAGA, SmartBill, SPV zilnic), **medie pe compliance tehnic** (NIS2 cybersecurity o depășește).

**Dispozitiv principal**: **desktop / laptop 1440px+**. Rareori tabletă. **Mobil = doar checking rapid**, nu pentru muncă de fond.

**Momente de interacțiune cu CompliAI**:
- **9:15 AM luni**: deschide `/portfolio/alerte` → vede 12 itemi peste noapte → triage 5 min → dispatch. Asta e JTBD #1 și moneyshot-ul produsului.
- **Intermitent în zi**: intră drill-in pe un client specific să rezolve un finding.
- **Sfârșit de lună**: batch export 8-20 rapoarte către clienți.
- **Când sună un client**: deschide portofoliul, vede status acelui client, răspunde în 30 sec.

**Non-negociabile pentru ea**:
- UI în **română** (fără Google Translate look)
- **Densitate** — vrea să vadă 30 rânduri deodată, nu 5
- **Bulk actions** peste tot (are 20 clienți × N findings)
- **Shortcut-uri tastatură** pentru power users
- Fără "celebrare" ("Felicitări, ai rezolvat un finding! 🎉") — o irită

**Anti-pattern** (ce n-o deranjează, o enervează):
- Emoji-uri în UI
- Animații de peste 150ms
- Empty states cu ilustrații mari
- Header-e giganții cu text promoțional
- Butoane cu text de marketing ("Dezlănțuie puterea compliance-ului!")

**Persona secundară** pe care NU o designăm primar dar o serviți prin simplitate: **Radu** (DPO intern corporate, 30-55 ani) și **Mihai** (solo SME owner, interfață ultra-simplificată). Dacă designul funcționează pentru Diana, va funcționa și pentru ei.

---

## 4. ENTITĂȚI DE MODELAT (dicționar)

Acestea sunt obiectele care apar peste tot în UI. Fiecare are nevoie de o reprezentare vizuală coerentă.

| Entitate | Ce e | Atribute vizual relevante | Unde apare |
|---|---|---|---|
| **Finding** | Problemă de conformitate detectată automat | `severity: critical / high / medium / low`, `framework: GDPR / NIS2 / AI Act / E_FACTURA / DORA`, `findingStatus: open / confirmed / dismissed / resolved / under_monitoring`, `orgId` | Inbox, Conformitate, Resolve cockpit |
| **Alert** | Notificare critic/high generată cron (watchdog) | Similar cu finding + `open` (bool) + `createdAtISO` | Inbox portfolio, Alerte per-firmă |
| **Notification** | Mesaj sistem pentru user (cron digest, doc generat, etc.) | `type`, `readAt`, `linkTo` | Inbox, bell icon |
| **Task** | Pas concret atribuit pentru rezolvarea unui finding | `status: todo / in_progress / done`, `owner`, `dueDate`, `priority` | Remediere queue |
| **Evidence** | Dovadă (fișier, screenshot, log) atașată unui task/finding | `validationStatus`, tip fișier, data | Cockpit, Vault |
| **Document** | Document generat (Politică, RoPA, DPIA, raport) | `approvalStatus: draft / approved_as_evidence`, `documentType`, versioning | Politici, Vault |
| **Vendor** | Furnizor ICT / procesator de date cu DPA status | `riskLevel`, `dpaStatus`, `category` | Furnizori |
| **AI System** | Sistem AI inventariat (AI Act) | `riskLevel: prohibited / high / limited / minimal`, `purpose`, `modelType` | Sisteme AI |
| **Incident NIS2** | Incident cybersecurity cu SLA 24h/72h DNSC | `status`, `severity`, `slaDeadline` | Incidente NIS2 |
| **Org / Client** | Firmă în portofoliu (pentru partner) | `orgName`, `score`, `lastScanAt`, `openFindings` | Portofoliu overview |
| **Drift** | Schimbare detectată față de baseline | `driftStatus`, sursă, impact | Drift panel |

**Regulă importantă**: severity și framework sunt cele două axe care domină tot UI-ul. Designul trebuie să dea un **limbaj vizual consistent** pentru ele peste tot (același badge de severity pe Finding, Alert, Incident; același tag de framework).

---

## 5. TREI GOLDEN PATHS (scrise ca story, nu bullets)

### 5.1 Dimineața Dianei (JTBD #1)

Diana intră la 9:15. Deschide CompliAI pe Chrome, laptop 1440px. Ajunge direct pe `/portfolio/alerte` (e aterizarea default în mod partner).

Vede sus un **header liniștit**: "Inbox — 14 itemi, 3 critice, 2 firme afectate din 23". Fără zgomot vizual. Nu există "Bună dimineața, Diana!" nicăieri.

Feed-ul grupat pe zile ("Azi", "Ieri", "Săptămâna asta") arată 14 rânduri compact. Fiecare rând: checkbox stâng, icon severity, badge framework (GDPR/NIS2/EF), numele firmei, titlul finding-ului, meta (timestamp + sursă). O singură linie majoră + o linie subtilă sub ea cu detaliu. Densitate: **4 rânduri / 100px vertical**.

Scanează cu ochiul în 20 secunde. Vede că 3 alerte sunt "intake GDPR incomplet" — irelevante acum, le **bifează pe toate 3 + click Respinge**. Dispar. Apoi vede o alertă critic NIS2 pe "Apex SRL": click pe titlu → se deschide `/dashboard/resolve/{findingId}` în context Apex. Rezolvă în 3 click-uri. Închide tab. Revine în inbox.

Total timp: **8 minute**. Înainte de CompliAI: 45-60 min prin Excel + 3 SPV-uri.

**Ce trebuie să livreze designul pe această suprafață**:
- O suprafață de triaj densă, fără distracții
- Bulk actions vizibile doar când ai selecție
- Hierarchy severity evidentă în 3 secunde
- Click pe rând = intră în context firmă fără a pierde starea inbox-ului

### 5.2 Smart Resolve Cockpit (pattern central)

Diana a intrat pe un finding. Pagina `/dashboard/resolve/{findingId}` este **un singur workspace** (nu sub-pagini). Structură verticală:

1. **Context** — ce e finding-ul, sursă, severity, framework (compact, sus)
2. **Impact** — ce se întâmplă dacă nu rezolvi (1-2 propoziții)
3. **Pași** — secvență concretă (auto-generată)
4. **Evidence** — zonă de upload + listă dovezi atașate
5. **Decide** — 3 butoane clare: "Confirmă & închide" / "Generează document" / "Marchează fals pozitiv"

Principiu: **1 finding = 1 cockpit = 1 rezultat = 1 dosar**. Userul rezolvă tot aici, nu sare între pagini.

### 5.3 Sfârșit de lună — export rapoarte batch

Diana intră pe `/portfolio/rapoarte`, selectează 12 firme, click "Generează rapoarte lunare". 30 secunde mai târziu are 12 PDF-uri semnate cu brand-ul cabinetului ei. Le trimite la clienți. Factură 100 RON/client rebill = €240 în 30 minute.

Aici designul trebuie: **tabel cu checkbox-uri, bulk action bar sticky, progress states clare per rând, feedback corect la eroare**.

---

## 6. INFORMATION ARCHITECTURE (pe scurt)

Utilizatorul are **3 moduri** care determină navigarea:

**Mod Partner** (Diana):
```
PORTOFOLIU (cross-org, default landing)
 ├── Prezentare
 ├── Alerte ← JTBD #1
 ├── Remediere
 ├── Furnizori
 └── Rapoarte
───
FIRMA: [dropdown selector]
 ├── Acasă
 ├── Scanează
 ├── Monitorizare (Conformitate / Furnizori / AI / NIS2 / Alerte)
 ├── Acțiuni (Remediere / Politici / Vault)
 ├── Rapoarte
 └── Setări
```

**Mod Solo** (Mihai, SME owner): nav simplificat doar pe firma proprie.
**Mod Compliance** (Radu, DPO intern): ca Partner dar fără secțiunea portofoliu.

**Pagini cheie** (pe care le vom designa prioritar):
1. `/portfolio/alerte` — Inbox (JTBD #1, **cel mai important**)
2. `/dashboard/resolve/[findingId]` — Smart Resolve Cockpit
3. `/portfolio` — Prezentare portofoliu cu bulk actions pe firme
4. `/dashboard/monitorizare/conformitate` — Findings per framework cu filtre
5. `/dashboard/actiuni/politici` — Generator documente
6. `/dashboard/setari` — Setări org (multi-tab, dens)

---

## 7. REGULI DE COMPOZIȚIE (non-negociabile)

1. **O pagină = o intenție dominantă.** Dacă face două lucruri, e greșită.
2. **Un CTA principal per pagină.** Vizibil deasupra fold. Restul = secundar.
3. **Master-detail** unde se aplică (Furnizori, Findings, Alerte): listă stânga, detaliu dreapta.
4. **Tabele cu filtre, NU sub-meniuri.** Framework-urile sunt tabs/filtre, nu pagini separate.
5. **Badge-uri comunică urgența, nu textul marketing.** Critic = vizual evident în <1 sec.
6. **Componente standalone + agregate.** Un `FindingRow` funcționează identic în inbox cross-firmă și în conformitate per-firmă.
7. **Zero text fără acțiune.** Dacă un bloc text nu duce la un buton, nu are loc.
8. **Bulk actions peste tot unde apare listă de >3 items.**
9. **Progressive disclosure**: 12 findings deodată = copleșitor. Arată 3 critice + "Vezi toate (12)".
10. **Keyboard shortcuts** pentru power users (cel puțin: j/k navigate, x select, e enter).

---

## 8. VOICE & TONE (română)

**Scris**: calm, ferm, impersonal-dar-nu-rece. Fraze scurte. Indicativ prezent.

**Da**: *"3 firme au findings critice peste noapte."* · *"Finding confirmat. Continuă execuția din cockpit."* · *"Documentul este atașat la dosar."*

**Nu**: *"Hei Diana, uite ce am descoperit pentru tine! 🎉"* · *"Oh no, ceva nu a mers..."* · *"Felicitări, ești cu un pas mai aproape de conformitate!"*

**Erori**: explică fapt, nu vinovăție. *"Nu am putut citi starea organizației. Reîncearcă în 10 secunde."* — nu *"Ups, s-a întâmplat o problemă! Ne pare rău :("*.

**Succes**: confirmă discret. *"Salvat."* — nu *"Acțiune finalizată cu succes! 🎉"*.

**Gol**: fără ilustrații mari. Text scurt descriptiv + CTA dacă e cazul. *"Inbox curat."*

---

## 9. REFERINȚE (ce ne inspiră, ce respingem)

### 9.1 Aspirațional — ne uităm la

- **Linear** — densitate, keyboard-first, tipografie disciplinată, zero gimmick
- **Vanta / Drata** — tonalitate compliance enterprise, fără panică
- **Height** — structurare operațională cu multe items
- **Superhuman** — viteză + shortcut-uri la inbox
- **Stripe Dashboard** — detalii financiare cu claritate tabulară

### 9.2 Anti-referințe — NU ne uităm la

- Zapier, ClickUp, Monday (prea colorate, prea marketing)
- Orice SaaS cu ilustrații isometrice sau mascote
- Dashboard-uri cu 8 cartonașe de "metric" neprioritizate
- Bitdefender / alte compliance tools RO (panic red peste tot)

### 9.3 Principii de "feel"

- **Cockpit, nu bulevard**: UI-ul seamănă cu o consolă operațională, nu cu o pagină de marketing
- **Calm autoritar**: tools-ul știe ce face, utilizatorul are încredere că nu uită nimic
- **Densitate respectabilă**: mult info vizibil deodată, dar nu sufocat — spațiere regulată
- **Pronunțare severity**: critic trebuie să sară în ochi în <1 sec, medium în <3 sec, low e ambient

---

## 10. CONSTRÂNGERI TEHNICE (ce poate / nu poate folosi designul)

- **Stack**: Next.js 15 App Router + React 19 + Tailwind 4 + shadcn/ui (Radix primitives) + lucide-react icons.
- **Fonturi disponibile acum**: Inter (sans), Manrope (display), JetBrains Mono (mono). Poți recomanda altele, dar notează că e schimbare.
- **Modul preferat**: **dark primary**. Există și light, dar 80% din utilizare va fi dark. Designul trebuie să arate impecabil în dark prima dată.
- **Bilingual**: 99% română, câteva label-uri EN tehnice (GDPR, NIS2, DORA rămân în EN — acronime legale).
- **Tokens existente**: `--eos-*` (surface, text, border, primary, warning, error, success) + `--spacing-*` în `/styles/tokens.css`. Designerul poate propune schimbări, dar e preferabil să lucreze PESTE tokens existente decât să inventeze de la zero.
- **Primitive existente** în `components/evidence-os/`: Badge, Button, Card, Checkbox, Dialog, Input, Label, Popover, Radio, Select, Switch, Table, Tabs, Textarea, Tooltip, Toaster, SummaryStrip, SectionBoundary, PageIntro, EmptyState, DenseListItem, Progress, Skeleton, Sheet, Separator, Breadcrumb, Pagination, ScrollArea. **Acestea sunt contractul UI actual.** Designul poate reboti look-ul lor, dar structura API ar trebui păstrată dacă e posibil (ca să nu rescriem 86 componente).
- **Responsive**: desktop-first 1440px+ e cazul principal. Tablet 768-1024px secundar. Mobile 375-768px **doar pentru Inbox view + notificări** (Diana nu rezolvă findings pe telefon).
- **Accesibilitate**: WCAG AA minim. Keyboard navigation peste tot. Focus states clare (actualmente slabe).

---

## 11. CE VREAU SĂ LIVREZI (output specific de la Claude Design)

1. **Design system tokens** — paleta dark + light (dacă are sens), scale tipografic, spacing, radius, umbre.
2. **UI primitives reboot** — rework la: Button, Badge, Card, Checkbox, Input, Select, Tabs, Table row, Dialog. Stilul nou, API-ul **compatibil** cu actualul (props-urile să rămână).
3. **Kit specific pentru 2 tipare dominante**:
   - `FindingRow` (densitate, severity visual, bulk select, hover affordances)
   - `CockpitLayout` (context top + stack vertical de 5 secțiuni)
4. **3 macheta de pagini** în ordinea priorității:
   - `/portfolio/alerte` — Inbox cu bulk bar
   - `/dashboard/resolve/[findingId]` — Smart Resolve Cockpit
   - `/portfolio` — Overview portofoliu cu tabel firme + bulk
5. **Ghid de utilizare**: când folosesc `primary` vs `secondary` vs `ghost`; când badge vs chip; când card vs dense list.
6. **Do / Don't** vizual: 6 exemple scurte care arată cum NU trebuie folosit (anti-pattern concrete, nu abstract).

**NU vreau**: mood-board Pinterest-style, texte de brand strategy, landing page. Avem deja brand, avem deja piață — vreau design system **operațional**.

---

## 12. CONTEXT DE CONCURENȚĂ — cine ne mănâncă dacă ratăm designul

- **Huddle.ro** (RO, recent, ~€100/lună, compliance general pentru SME) — e cea mai concretă amenințare. Dacă ei fac design enterprise mai repede decât noi, Diana îi alege.
- **Sypher Suite** (RO/EU, €8-15k/an, full GRC) — dar e enterprise-only, out of reach pentru Diana. Tonalitatea lor însă e cea pe care o aspirăm.
- **Vanta / Drata / Secureframe** (US, $7-20k/an) — nu servesc piața RO direct, dar sunt **oglinda de calitate**. Designul nostru trebuie să se simtă în aceeași categorie chiar dacă prețul e 1/10.

---

## 13. CE RĂMÂNE DE CLARIFICAT (întreabă-mă dacă ajungi aici)

- Branding: logotip / wordmark — **avem?** Dacă nu, folosește placeholder neutru.
- Dark vs light primary: confirm că **dark** e default, dar ai libertate să argumentezi altceva.
- Densitate țintă: "Linear-level" sau ceva mai aerisit? (eu zic Linear-level)
- Nivelul de shadcn re-skin: doar theme tokens sau overrides complete?
- Iconografie: lucide-react e OK, sau preferăm un set custom/Phosphor?

---

> **END DESIGN-BRIEF.md** — 2026-04-20. Documentul acesta intră la Claude Design.
> Citește în ordinea: §1 → §3 → §5 → §11. Restul e suport.
