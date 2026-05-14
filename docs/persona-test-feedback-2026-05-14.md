# CompliScan Fiscal — Test brutal dual-pass (2026-05-14)

> Tester: agent in role Maria Ionescu (CECCAR, Brașov, 78 firme) + UX/UI designer senior 10+ ani.
> Mediu: `http://localhost:3000` (PRODUCT_MODE=fiscal), Ana Maria autentificată, FC4 Test Client SRL seedat.
> Durată test: ~20 min (Pass 1 ≈ 10 min, Pass 2 ≈ 7 min, Pass 3 + raport ≈ 3 min).

---

## TL;DR (3 propoziții finale)

**Conceptul (portofoliu-first cross-client cu 7 carduri triage) e bun și aliniat cu durerea Mariei**, dar layer-ul UI e plin de tech-leak ("FC-7", "Master Exception Queue", "Authority & Mandate Guardian", "Burden") care îi izbește vocabularul contabilesc în 5 secunde. **Un bug critic de theme face că modulul Certificate digitale + împuterniciri are text alb pe fundal alb-rozaliu (contrast 1.05:1, WCAG FAIL)** — Maria n-ar putea citi certificatele expirate, exact informația vitală pentru ea. **Are valoare reală sub capotă (Pre-ANAF Simulation, Bank↔SPV mismatch, audit trail Cereri documente), dar livrarea suferă din inconsistențe de date (CRITIC 2 pe AZI vs CRITIC 0 pe Sumar) și sidebar multi-active confuz** — Maria închide tabul în 5 minute dacă nu i se traduce vocabularul și nu se repară contrastul.

---

## PASS 1 — Maria contabilă (primă persoană, vocabular real)

### Scenariu 1 — "Luni dimineață la 9:00, deschid aplicația"

**Prima impresie (5 secunde):**
- Văd "CompliScan Fiscal" sus stânga — ok, asta e aplicația. "Fiscal — vedere cross-client" — bun, înțeleg că e despre toți clienții mei. "1 firme · 0 verzi · 0 galbene · 1 roșii" — **mă enervează imediat că zice "1 firme" (în loc de "1 firmă")** și că "verzi/galbene/roșii" nu sunt colorate efectiv în text (sunt toate cenușiu). De ce-mi spui despre culori dacă nu mi le arăți pe loc?
- Banner sus mare roz: "Perioada de trial a expirat. Datele tale sunt accesibile read-only încă 62 zile." Stai. **Sunt logată ca Ana Maria și apare expirat?** Nu înțeleg unde sunt — sunt în mediul dev? Banner "DEV" + banner "trial expirat" simultan = totally confusing. Astă ca contabil cu plată, m-aș panica.
- "Σ risc fiscal expus: 15.000 RON · Σ ore cabinet/lună estimate: 2h · 1 clienți cu SPV activ". **15.000 RON ar fi penalizările** dacă ANAF mă prinde? Nu e clar dacă e expunere pe TVA, pe declarații, pe ce. Iar "Σ" e simbol matematic — Maria nu folosește "Σ". Aș spune "Total risc expus: 15.000 RON".

**Confuzie:**
- "1 clienți cu SPV activ" — gramatical: "1 client cu SPV activ". Apar greșeli româneşti peste tot (1 firme, 1 clienți).
- "Risc fiscal expus" — sumă risc penalizări? Sumă suma TVA neplătită? Nu explică.

**Reacție:**
- Practic, văd că e ceva serios cu un client (1 roșu), că ar fi 15.000 RON la mijloc și 2h muncă lunar. Tipic pentru un client probematic. **Cardurile de mai jos îmi spun ce trebuie făcut?** Sper.

### Scenariu 2 — "Văd ceva alarmant pe FC4, intru"

Pe card "Declarații de depus / rectificat" văd 4 itemi FC4 Test Client SRL — primul roșu CRITIC "R6 2025-12 — D300 (TVA) nedepusă (109 zile întârziere) · 8.300 RON". **Asta-mi prinde atenția imediat: D300 nedepusă, 109 zile, 8.300 RON penalitate** — limbaj contabilesc real, plus codul "R6" pe care nu-l înțeleg dar îl ignor.

- Dau click pe ăsta. **NU SE ÎNTÂMPLĂ NIMIC.** URL-ul rămâne `/portfolio/fiscal`. Mă enervează — am crezut că mă duci pe FC4. Click again, nimic. **Acțiunea principală broken.**
- Mă mut la sidebar și văd "Execuție în firmă · Selectează" — ah, deci sunt "Mod de lucru" diferit. Click "Selectează" → dropdown cu FC4 Test Client → click. URL devine `/dashboard/fiscal`.

**Pe `/dashboard/fiscal` ca FC4:**

- "Monitorizezi conformitatea fiscală" — OK, e clar despre ce e ecranul, e despre client.
- Breadcrumb "Acasă > De rezolvat > Fiscal" — strange. Eu vin direct pe /dashboard/fiscal, nu sunt "De rezolvat". Fiecare e link, dar nu e logic.
- Top: "FIRMA MEA · FISCAL · ANAF · E-TVA · SAF-T" — chip-uri micuțe ca eticheta. Imediat mai jos cardul "Pre-ANAF Simulation" cu chip "KILLER FEATURE" auriu. **Stop. "KILLER FEATURE"? Asta e marketing intern.** Maria n-are nevoie să-i spui că e killer feature, vrea să știe ce face.
- Tagline cardului: *"Dacă ANAF te-ar verifica azi, unde pici prima dată?"* — **ASTA E GENIAL.** Întrebare directă, contabilesc, mă atinge la nerv. Asta poate să mă convingă să rămân.
- "Click pe buton: agregăm toate sursele (**cross-correlation R1-R7 + economic impact**) și-ți arătăm Top 5 riscuri active ordonate după magnitudine." Stop. **"cross-correlation R1-R7"** — habar n-am ce-i R1-R7. E o eroare? E o regulă? "Economic impact" — sună a power BI. **Aici începe să mă piardă.**

**Sidebar enervare:**
- Văd 2 itemi cu același bg deschis: "De rezolvat" și "Cockpit fiscal" — **ambele par active**. Care e cea curentă? Nu-mi e clar. Eu sunt pe "Cockpit fiscal", dar "De rezolvat" pare la fel de selectat.
- 12 itemi în sidebar: "Acasă, Scanează, De rezolvat, Setări, Cockpit fiscal, Validare & emitere, Transmitere & SPV, TVA & declarații, Integrări ERP, Deadline urgent, Agent fiscal AI". **Prea mult.** Plus "Validare & emitere" vs "Transmitere & SPV" — nu știu care e care. "Integrări ERP" — ce face? "Agent fiscal AI" — îmi va vorbi un chatbot? Maria nu vrea chatbot.

**Click "Simulează ACUM":**
- Apare lista cu Top 4 riscuri ordonate (R6 score 93/56/45/45). Toast verde "4 riscuri — top 4 afișate". **Bun, asta-i răspuns concret.** Răsfoiesc: "R6 2025-12 — D300 (TVA) nedepusă · 3.300–8.300 RON expunere · 1 doc lipsă · score 93". Asta-i info dens, vreau așa! Dar:
  - "Owner: cabinet" — adică eu, ok.
  - "Cross-correlation: Cod Fiscal Art. 219 + OG 92/2003 (legalitate tardiv)" — **GENIAL**, asta-i exact dovada juridică pe care o vreau pentru audit.
  - DAR badge "score 93" e prea micuț, lângă "IMINENT" în roșu — duplicate signaling.

### Scenariu 3 — "Triage 3 minute pe toate cardurile"

Înapoi pe `/portfolio/fiscal` (tab AZI). Rating brutal:

| Card | Relevant /10 | Vocabular /10 | Acțiune clară /10 | Comentariu Maria |
|------|--------------|---------------|-------------------|------------------|
| **Declarații de depus / rectificat** | 10 | 8 | 4 | "Asta e DURĂ realitatea — D300 nedepusă, exact ce-mi trebuie. Dar click nu funcționează." |
| **Termene urgente (7 zile)** | 9 | 9 | 5 | "✓ Niciun termen în următoarele 7 zile. OK, dar **e gol și lăsă un spațiu negru imens în dreapta** — pierdere de ecran." |
| **Certificate & împuterniciri** | 10 | 7 | 4 | "1 expirate · 3 expiră — informația crucială! Dar e tipic 'engineering label': Authority Guardian la dashboard nu zice nimic. Aș spune doar 'Certificate'." |
| **Cereri documente lipsă** | 10 | 9 | 7 | "ASTA-MI SALVEAZĂ TIMP. Audit trail trimis · așteaptă client — exact ce-mi trebuie. Pendente client = ok. Email template integrat = excelent." |
| **Risc Pre-ANAF iminent** | 9 | 6 | 5 | "Score 93 — habar n-am dacă e bine sau prost până nu-mi spui cum se calculează. Iminent/HIGH ar fi mai utile decât score." |
| **Excepții CRITIC Master Queue** | 7 | 2 | 4 | "**'Master Queue' = ce naiba e Queue?** Eu nu folosesc cuvântul. Aș spune 'Listă probleme prioritare'. Plus pare să arate aceleași 2 itemi ca Declarații — duplicate?" |
| **Reconciliere plăți (Bank ↔ SPV)** | 10 | 7 | 6 | "ASTA-I AUR! Plată fără factură, factură fără plată — exact ce mă întreabă ANAF la control. Vocabular ok-ish, 'PLATĂ FĂRĂ FACTURĂ' caps locks e ok." |

**Cea mai mare confuzie:** "Excepții CRITIC Master Queue" suprapus cu "Risc Pre-ANAF iminent" + cu "Declarații de depus" — toate trei conțin aceleași 2 itemi CRITIC! De ce 3 carduri pentru aceeași informație?

**Header snapshot "1 firme · 0 verzi · 0 galbene · 1 roșii":**
- "1 firme" — gramatical greșit (1 firmă)
- "verzi/galbene/roșii" — nu sunt colorate (fail de inversare semantic+vizual)
- Σ — simbol matematic, eu spun "Total"

### Scenariu 4 — "Edge: tastez /dpo aiurea"

Tastez `localhost:3000/dpo` în URL bar. **Redirect tăcut la `/`** (landing). Nu îmi spune nimic — "DPO nu există pe Fiscal" sau "Asta-i secțiune doar GDPR" — nimic. Reacție: "OK, atunci ce face Compliscan ăsta? Pare că funcționează doar pe rute specifice." Aș vrea o pagină 404 care îmi explică unde sunt.

### Scenariu 5 — "Vreau să adaug client/certificat real"

Caut "Adaugă firmă" / "Import clienți":
- Pe `/dashboard/fiscal` în context portofoliu (când nu e selectată o firmă) văd un altă pagină: "**Portofoliu fiscal** · Triage e-Factura + SAF-T + RO e-TVA per client · 1 firme active." Cu butoane "Import firme" + "Exportă CSV" + "Actualizează". **Aici e adaugarea!** Dar nu se cheamă "Adaugă firmă" — se cheamă "Import firme". Pentru un singur client trebuie să fac Excel? Aș vrea "Adaugă un client manual" butoanele.
- Setări certificat cabinet propriu — sidebar "Setări" duce la /dashboard/settings → **redirect la `/`** (landing!). Maria: "Stai, de ce mă scoate?" 404 silențios. **Nu există ecran de setări cont/certificat al cabinetului.**

### Cum aș folosi luni dimineață

Realist: aș deschide /portfolio/fiscal, aș vedea "1 roșii · 15.000 RON", aș merge la cardul Declarații, aș face click pe R6... și aș înțelege că click-ul nu merge. **Aici închid tabul.** Sau aș face click pe FC4 din sidebar și aș merge mai departe. Dar primul click broken e prima impresie de "n-am încredere în tool".

### Ce LIPSEȘTE pentru cabinet:

1. **Click pe item din card → drilldown direct pe firma respectivă.** Acum e dead button.
2. **"Adaugă un client" buton clar** (nu "Import firme" cu Excel).
3. **Setări certificat cabinet** — unde-mi pun certificatul SPV propriu? Nu există.
4. **Empty state actionable** pe "Termene 7 zile" — "Niciun termen. Verifică calendarul lunii viitoare →"
5. **Notificări cu cifre roșii/galbene/verzi colorate** efectiv în header (nu doar text gri).

### Aș plăti?

- **Acum** (cu bug-urile): NU. Aș închide tabul la 5-10 min.
- **Dacă reparați**: contrast Certificate (vital), click navigation (vital), vocabularul ("Queue"/"Burden"/"FC-7"), sidebar dublu-activ — **da, aș testa 30 zile cu 300-500 RON/lună** pentru cele 4 features care lipsesc pe SAGA: Pre-ANAF Simulation, Bank↔SPV mismatch, Cereri documente cu audit trail, Cross-correlation cu Cod Fiscal references.

---

## PASS 2 — UX/UI designer

### /portfolio/fiscal (tab AZI)

**Visual hierarchy:**
- Header snapshot "1 firme · 0 verzi · 0 galbene · 1 roșii" la 28px font-semibold — OK ca size, dar **culorile verzi/galbene/roșii lipsesc din text** (toate sunt eos-text 92%). Greșeală criminală: când spui "0 verzi" trebuie să fie text verde. Pierdut signal vizual.
- "Σ risc fiscal expus: 15.000 RON" la 12.5px — **prea mic pentru număr critic**. Ar trebui să fie minim 14-16px și monospace.
- Cards toate egal de "prominent" — niciun primary CTA. Pe 7 carduri nu există un "Începe aici"; rămâne F-pattern de scanare.

**Density:**
- Cardurile sunt aerisite (p-5, gap-3 între items) — **prea sparse pentru un cabinet contabil care e obișnuit cu SAGA/Excel**. Maria ar prefera tabel cu 10 rânduri vizibile, nu cards cu 3-4 items each.
- "Termene urgente 7 zile" empty state ocupă o coloană întreagă de 460px×450px doar pentru "✓ Niciun termen" — **risipă imensă de real estate**.

**Color system:**
- Brand blue (`rgb(59,130,246)`) folosit ambiguous: text "1 roșii", buton "Reactivează cont", chip "AZI". Conflict primary CTA vs status.
- Badge "CRITIC" `bg oklch(0.936 0.032 17.717)` (red-200 light) + text `rgb(122,31,36)` (red-900) — contrast bg/text = **4.5:1, OK** dar pe dark page bg, badge-ul light arată ca un patch de bandă albă.
- Status pills "IMPORTANT" galben și "CRITIC" roșu — coduri color OK; semantica funcționează.
- **Nu există daltonism check** — pentru un user daltonist, "1 verzi vs 1 roșii" devine indistinguishable când culoarea lipsește din text (toate grey).

**Typography:**
- Inter peste tot — sans-serif OK. Body 16px (default).
- **PROBLEMA GRAVĂ: nu există tabular-nums sau monospace pentru sume RON**. "8.300 RON" e Inter regular — sumele nu se aliniază în tabele/cards. Pentru accounting tool, asta e amateurish.
- H1 30px font-display, line-height 45px (1.5) — comfortable.
- Tabs 12.5px, badge CRITIC 9.5px, buton "Reactivează cont" 12px — **scale sub-14px = nelizibil pentru body content peste 50% timp**.
- Diacritics ro corect peste tot (depusă, întârziere, ștergere) — bun.

**Spacing & rhythm:**
- Card padding 16px (`p-5` în Tailwind, dar randat 16) — OK pe 8pt grid.
- Border radius 14px pe carduri — nu standard (8/12/16). Mic detaliu nepăsător.
- Gap vertical inter-cards 16px, gap horizontal 16px — consistent.
- **Layout 2 coloane cu cards de înălțime diferită → asymmetric găuri negre verticale** între "Declarații" (4 itemi, 470px) și "Termene 7 zile" (1 item empty, 100px). Spațiu mort 370px vertical pe dreapta — UX UR-fail.

**Microcopy:**
- "1 firme" — **greșeală gramaticală RO**, ar fi "1 firmă".
- "1 clienți" — ar fi "1 client".
- "Σ risc fiscal expus" — simbol matematic + "expus" (jargon). Înlocuim cu "Total risc estimat".
- Empty state "✓ Niciun termen în următoarele 7 zile." — pasiv. Maria vrea acțiune: "✓ Liber săptămâna asta. → Vezi termenele lunii viitoare".
- Buton "Refresh" — englezism, Maria spune "Reîncarcă" sau "Actualizează" (care apare prin alte locuri — inconsistență).
- "KILLER FEATURE" chip auriu — marketing intern, nu UI public.

**Iconography:**
- Lucide React peste tot — consistent în general.
- **DAR**: `🏠 AZI` mixează emoji cu Lucide icons în tab bar. Plus heading h1 `🏠` în portfolio. Emoji folosit ca decorativ pentru "AZI" — inconsistent cu rest.

**Navigation:**
- **Multi-active sidebar bug**: pe `/dashboard/fiscal` ambele "De rezolvat" și "Cockpit fiscal" au `bg-eos-surface-elevated` (același bg highlight). Maria nu poate distinge curentul.
- **Aria-current lipsește pe TOATE link-urile sidebar** — screen reader nu știe unde e user-ul. Fail a11y.
- Breadcrumb prezent dar inconsistent (pe `/dashboard/fiscal` apare "Acasă > De rezolvat > Fiscal" — confuz, eu am intrat direct pe Fiscal).
- 12 itemi sidebar — depășește 7-9 magic limit, vine nevoia de grouping clar.

**CTAs:**
- "Reactivează cont" 24px height + 12px font + bg blue 59,130,246 — **sub 44px tap target = WCAG fail mobile**.
- "Export date" alături — 24px tot, mai degrabă subtle button. OK pentru secondary.
- "Import firme" 34px height — sub 44px.
- "Simulează ACUM" mare auriu — bun ca primary CTA. **dar peste un bg gradient auriu Pre-ANAF + dotted-dashed border = overdesign**.
- Mai mult de 1 primary CTA per ecran (Refresh + Simulează ACUM + Reactivează cont concurând).

**Cards:**
- Toate cards `bg-eos-surface` (`rgb(11,13,18)`) — **același bg ca aside-ul**, fail de diferențiere card vs canvas.
- Border `rgb(29,35,45)` — foarte subtilă, mai degrabă invizibilă pe bg 11/13/18.
- Border radius 14px — non-standard.
- Hover state nu testat, dar `transition-all 100ms` setat — OK.
- Click target = întregul card sau item? Item-ul e button dar nu navighează.

**A11y:**
- Focus rings: nu testat manual cu Tab; Sidebar are `aria-current` lipsă.
- Contrast text-eos-text 92% pe bg 13/15/20 = **14.15:1, PASS AAA**.
- Contrast text-eos-text-muted (178,182,191 @ 0.78) = **6.09:1** — PASS AA pe body, marginal pe 11.5px tabs.
- Contrast badge CRITIC (red-200 bg + red-900 text) ≈ 4.5:1 — PASS AA.
- **Contrast text-92 (alb 240,239,242) pe `bg-red-50` (#fef2f2) = 1.05:1 — FAIL CATASTROFAL WCAG**. (vezi mai jos pe `/dashboard/fiscal`).

**Top 3 issue-uri UX/UI critice pe /portfolio/fiscal:**

1. **Asymmetric card grid creează 370px găuri negre verticale** când două carduri vecine au înălțimi foarte diferite (Declarații 4 items vs Termene empty). Fix: grid auto-rows-fr + min-height egal SAU restructurare 3 coloane SAU masonry layout.
2. **Sume RON fără tabular-nums/monospace** — sub-standard pentru accounting tool. Fix: `font-variant-numeric: tabular-nums` pe orice element care conține "RON" sau folosi `font-mono`.
3. **Empty state "Termene 7 zile" pasiv + ocupând coloană întreagă** = waste of attention. Fix: empty state cu CTA secundar ("Vezi luna viitoare") + colaps automat al cardului dacă e gol >24h.

**Top 3 lucruri bune:**

1. **Vocabular "Cereri documente lipsă" + audit trail status (Email trimis / Așteaptă client / Verificat)** — exact mental model Maria. Email template + Print + Anulează = workflow real.
2. **5 tab-uri (AZI / Calendar agregat / Sumar per client / Cross-correlation / Client Burden)** — diferențiere clară a vederilor. URL `?tab=` permite share/bookmarks.
3. **Trust signal disclaimer footer** "CompliScan organizează dovezi și pregătește dosare. Nu constituie opinie juridică..." — exact ce-i trebuie un CECCAR pentru limită responsabilitate. Apare consistent în multiple pagini.

---

### /dashboard/fiscal (context FC4 firma activă)

**Visual hierarchy:**
- Pre-ANAF Simulation card cu **gradient auriu + dotted-dashed border + chip "KILLER FEATURE"** — domină ecranul. Dar dominanță pură "marketing chip" nu funcțional.
- KPIs Master Exception Queue (TOTAL 4 / CRITICE 2 / IMPORTANTE 2 / OVERDUE 0 / ÎN 7 ZILE 0 / IMPACT TOTAL 15.000 RON) — bună densitate, color coding parțial corect.
- Numerele 24/100, 8.300 RON, score 93 mixează scale-uri fără ierarhie.

**Density:**
- Acest ecran e dens spre OK pentru accountant — 8+ secțiuni pe pagina, fiecare cu sub-info. Maria ar prefera-o așa, dar fără chip-uri marketing.
- 6 quick links la final ("Validare & emitere", "Transmitere & SPV", etc) — redundant cu sidebar.

**Color:**
- **BUG GRAV**: Sectorul "Certificate digitale + împuterniciri" folosește `bg-red-50` + `bg-amber-50` (Tailwind utility light-mode) pentru alerte certificat, dar inherit text color = `text-eos-text` (#efeff2 92% alfa). **Contrast = 1.05:1 — invizibil pe dark mode.** Asta-i un classic dark/light mode breakage.
- Aceeași problemă pentru bg-white card "Score 24/100 Risc scăzut" — text alb pe bg alb. **Vital information ilegibilă.**
- Master Exception Queue colorat OK (red/amber/green KPI tiles).

**Typography:**
- Pre-ANAF tagline 22px italic — OK pentru hero question.
- "Score 93" 24px font-bold — OK.
- Findings table cu coloane DECL/SAF-T/E-FACTURA + sub-coloane scor — text 11px, prea mic.
- **Lipsa monospace** pe "8.300 RON" / "1.700 RON" / "15.000 RON" = ne-aliniate vertical.

**Spacing:**
- Pre-ANAF card 32px padding interior, gap 24px între sections — OK aerisit pentru hero.
- Findings list compact (8-10px between rows) — bun.
- Per total layout 8pt grid respectat.

**Microcopy:**
- "FC-7", "FC-9", "FC-10" tag-uri vizibile peste tot pe headers de carduri — **engineering code în UI public**. Fix: înlocui cu numere ordine sau labels semantice ("Probleme prioritare", "Cereri client", "Certificate").
- "Authority & Mandate Guardian" — vocabular fantastic literally. Fix: "Certificate și împuterniciri".
- "Master Exception Queue" — fix: "Probleme prioritare".
- "Smart Pattern Engine" — fix: "Tipare repetitive detectate".
- "Snapshot-uri ONRC", "OCR-ate", "Cross-Correlation" tehnic — pentru un contabil = chinezește.

**Iconography:**
- Lucide icons standard (Calendar, FileText, Shield) — OK.
- "💡 RECOMANDARE PRIORITATE" la lightbulb emoji peste Lucide — inconsistent.
- Eye icon pentru "Apasă Simulează ACUM" — OK.

**Navigation:**
- Sidebar 12 itemi pe dashboard (Acasă / Scanează / De rezolvat / Setări / Cockpit fiscal / Validare & emitere / Transmitere & SPV / TVA & declarații / Integrări ERP / Deadline urgent / Agent fiscal AI) — **overload**.
- `aria-current` lipsește.
- **Două items pot fi simultan active vizual** (bg highlight): "De rezolvat" + "Cockpit fiscal" — bug.

**CTAs:**
- "Simulează ACUM" (după rerun → "Re-simulează") — buton auriu mare = primary clear. 
- "Reîmprospățează" pe Master Exception Queue — secondary.
- "+ Cerere nouă", "+ Cert", "+ Mandat" — secondary.
- 3-4 primary-looking CTAs vizibile odată (Simulează auriu + Reactivează cont blue + ASISTENT AI floating). **Prea multe atrageri simultane.**

**Cards:**
- Pattern inconsistent: unele cu border-eos-border, altele cu border colorat per severity (red-300/60).
- Pre-ANAF dotted-dashed border = unique pattern, NU repetat alteva.
- ASISTENT AI floating button bottom-right blue cu + Cerere nouă deasupra — pe mobile va overlap content.

**A11y:**
- Contrast Certificate cards = **1.05:1, FAIL absolut**.
- Contrast text-92 pe bg-amber-50 = ~1.3:1 — FAIL.
- Tap target pentru "Print" / "Marchează trimis" / "Anulează" mici (~28-32px) — sub 44px.
- `aria-current` lipsește în sidebar.
- Focus indicator nu testat dar `:focus` styles probabil OK.

**Top 3 issue-uri critice pe /dashboard/fiscal:**

1. **Light-mode Tailwind utilities pe dark theme**: `bg-red-50` / `bg-amber-50` / `bg-white` cards cu text-eos-text inherit = contrast 1.05:1 — informație CRITICĂ (certificate expirate, risk score) ilegibilă. **BLOCKER.** Fix: înlocui cu `bg-red-500/10` `text-red-200` patterns dark-mode safe.
2. **Sidebar multi-active**: 2 items cu `bg-eos-surface-elevated` simultan pe aceeași sesiune. Fix: căutare unic match `pathname === href` și folosire `aria-current="page"`.
3. **"KILLER FEATURE" chip + engineering code-uri (FC-7/9/10) peste tot în UI** = brand voice rupt. Fix: labels semantice + audit copy pass pentru a elimina toate ID-urile interne.

**Top 3 lucruri bune:**

1. **Pre-ANAF Simulation tagline "Dacă ANAF te-ar verifica azi, unde pici prima dată?"** — copy genial care prinde fix pain point Maria. Plus output structurat (Top 5 riscuri cu score + sum + acțiune + Cod Fiscal Art.) = real value.
2. **Cereri documente lipsă cu workflow complet**: Email trimis / Solicitat / Așteaptă client + Email template + Print + Marchează trimis + Timeline cu istorice = audit trail real, exact ce vrea Maria pentru control ANAF.
3. **24/100 Risc audit ANAF scoring cu breakdown 9 factori + recomandări per factor + bara color 0/25/50/75/100** — explicat suficient pentru Maria să decidă, nu doar număr nud.

---

### /login (split-screen)

**Visual hierarchy:**
- Left: form login centrat — OK.
- Right: KPI cards (47/47 sincronizați, 12 discrepanțe, 3 risc iminent, 2 plăți fără factură) + testimonial.
- H1 dreapta "Cockpit cross-client. Vezi ce arde la TOATE firmele tale într-un singur ecran." — 36-40px clar, accentu vizual potrivit.

**Density:**
- Balanced — login form compact, value prop dreapta cu evidence concretă.

**Color:**
- Bg gradient subtle dreapta — bun pentru contrast hero.
- KPI tiles cu coduri color (ANAF SPV verde, Cross-corr roșu, Pre-ANAF orange, Bank↔SPV galben) — coerent semantic.

**Typography:**
- "Bun venit înapoi." h2 mare — primitor.
- KPI numere mari (47/47, 12, 3, 2) bold și dominante — bun.

**Spacing:**
- Form labels above inputs — OK.
- Spațiu adecvat între email + parolă + CTA.

**Microcopy:**
- "Conectare securizată · 2FA disponibil · Date stocate în UE" — trust signals concrete sub CTA. Excellent.
- "Continuă pe firma ta sau pe portofoliul cabinetului." — clar.
- Tab "Cont nou [14Z PRO]" — chip "14Z PRO" ambiguous, însemnând "14 zile pro trial"?
- Testimonial Ramona Ilie EXPERT CONTABIL 22 CLIENȚI — peer evidence credibilă.

**Iconography:**
- Logo CompliScan Fiscal sus stânga + chips ANAF SPV / E-FACTURA / SAF-T D406 / CECCAR — OK.
- Eye icon pentru reveal parolă — standard.

**CTAs:**
- "Intră în CompliScan →" blue primary — clar.
- "Cont nou 14Z PRO" tab secondary — OK.
- "Am uitat parola" link — OK.

**A11y:**
- Form labels "EMAIL" / "PAROLĂ" deasupra inputs — corect a11y.
- Required fields nu sunt marcate vizual (* lipsă) — minor.
- Tab order nu testat.

**Top 3 issue-uri:**

1. "14Z PRO" chip — ambiguous, mai bine "14 zile gratis Pro" sau "Pro · 14 zile gratis".
2. Testimonial doar 1 (Ramona Ilie) — credibilitate scăzută; mai bine 3-4 testimoniale rotative sau static grid.
3. Lipsa "Login cu Google/Microsoft" — pentru un contabil cu 78 firme, parolele sunt fricțiune.

**Top 3 bune:**

1. Split layout 50/50 cu KPI live preview dreapta = onboarding clar (vezi value înainte să te înregistrezi).
2. Trust signals concrete jos: "2FA · UE · securizat".
3. Tagline H1 right rezolvă problema "ce face tool-ul" în 12 cuvinte.

---

### / (landing logged-in)

**Visual hierarchy:**
- H1 "Cockpit pentru cabinet contabil. Toate firmele într-un singur ecran." — primul rând bold, al doilea blue accent. Bun.
- Chips "ANAF SPV · E-FACTURA · SAF-T D406 · CECCAR · OPANAF" — trust signals imediat sub.
- CTA primary "Programează demo pentru cabinetul tău" + secondary "Vezi ce face".

**Density:**
- Aerisită ca landing — corect.

**Color:**
- Brand blue (eos-blue) folosit consistent.
- Cards demo (problema/soluția) cu border subtilă pe bg-eos-bg — clean.

**Typography:**
- H1 enorm (~64-72px presupun) — punchy. 
- Body 16px line-height confortabil.

**Spacing:**
- Section gaps mari (~80-120px) — standard landing.

**Microcopy:**
- "În căutare de 4 cabinete pilot — gratuit 3 luni în schimbul feedback-ului real." — exact ce trebuie, transparent.
- "30 de clienți. 8 tool-uri diferite. Niciun tablou general." — punch tagline.
- Numere concrete (5 min × 30 clienți = 7.5 ore/lună doar pe triage).

**Iconography:**
- Chips OK, dar emoji `🎯` pe "În căutare 4 cabinete pilot" — emoji vs Lucide inconsistent.

**Navigation:**
- Header doar Login + Programează demo — minimalist OK.
- Lipsă footer link Termeni/Confidențialitate sus (apare jos).

**CTAs:**
- 1 primary "Programează demo pentru cabinetul tău" + 1 secondary "Vezi ce face" — corect.

**A11y:**
- H1-H2-H3 hierarchy logică.
- Nu testat focus ring.

**Top 3 issue:**

1. Landing apare și pentru user **logged in** (ana_maria) — ar trebui redirect automat la `/portfolio/fiscal`. Pe `/dpo` redirect la `/` (landing) e ciudat când ești deja logat.
2. CTA dual "Programează demo" + "Vezi ce face" — al doilea CTA "Vezi ce face" e mai onest dar mai puțin engaging.
3. Chip "🎯 În căutare de 4 cabinete pilot" cu emoji + heading — mix inconsistent cu rest.

**Top 3 bune:**

1. Tagline + sub-tagline = clear value prop în <10 secunde.
2. "NU înlocuim SAGA. Suntem stratul de analytics deasupra." — defuse direct fricționare cabinet (Maria n-ar lăsa SAGA).
3. "Lista pilot 4 cabinete" + concrete acceptance criteria — transparent SaaS marketing.

---

## PASS 3 — Cross-cutting issues (văzute de AMBELE lentile)

### 1. Sidebar dublu-activ (Maria: confuz · Designer: principiu broken)

**Maria**: "Care e ecranul curent? Nu îmi e clar dacă sunt pe Cockpit sau De rezolvat." Trei items vizibili cu același bg.
**Designer**: `bg-eos-surface-elevated` aplicat la multiple link-uri simultan. `aria-current` lipsește. Pattern "active = unique current page" rupt.
**Fix**: Audit `usePathname()` în sidebar; folosire `aria-current="page"` strict pe pathname exact match.

### 2. Engineering codes în UI public (Maria: nu înțeleg · Designer: brand voice rupt)

**Maria**: "FC-7? FC-9? FC-10? Ce sunt astea? Cross-correlation R1-R7? Habar n-am."
**Designer**: Internal feature/regression code-uri ar trebui complet ascunse de UI. Sub-headerile cardurilor au eticheta engineering ca prefix.
**Fix**: Refactor componenta `<FeatureLabel feature="FC-7">` ca să afișeze doar `title` semantic ("Probleme prioritare"); `data-feature-id` pentru telemetry.

### 3. Click pe item în card → dead button (Maria: pierd încrederea · Designer: broken UX core flow)

**Maria**: "Click pe R6 critical → nu se întâmplă nimic. Asta-i parolă, ar trebui să meargă DIRECT pe firma respectivă."
**Designer**: Card item este `<button>` fără handler de navigare. F-pattern interaction broken — utilizatorul așteaptă drilldown.
**Fix**: Adăugare onClick → `router.push('/dashboard/fiscal?org={orgId}&finding={id}')` cu org auto-switch.

### 4. Bg-light Tailwind utilities pe dark theme (Maria: nu citesc · Designer: WCAG fail catastrofal)

**Maria**: "Citesc 'Certificat expirat de 6 zile' DAR text-ul e literally invizibil. Doar background-ul îmi spune că e roșu = problem."
**Designer**: Contrast 1.05:1 — chiar sub 3:1 minimal pentru non-text indicators. Bug clasic de dark mode unde dev folosește utility classes light fără override.
**Fix**: Replace `bg-red-50` → `bg-red-500/10`, `bg-amber-50` → `bg-amber-500/10`, `bg-white` cards → `bg-eos-surface`. Audit toate `bg-{color}-50` / `bg-white` în codebase.

### 5. Sume RON fără tabular-nums (Maria: nu se aliniază · Designer: amateurish pentru accounting)

**Maria**: "Văd 15.000 RON și 8.300 RON și 1.700 RON. La SAGA toate sumele sunt aliniate vertical. Aici parcă-s aruncate."
**Designer**: Inter sans-serif default, fără tabular-nums sau monospace = sumele nu aliniază în tabele/cards. Standard pentru fintech.
**Fix**: Adăugare `font-variant-numeric: tabular-nums` pe orice container cu currency, sau utility class `.tabular-nums` global.

### 6. Empty state pasiv + asymmetric grid (Maria: gol = inutil · Designer: waste of real estate)

**Maria**: "Termene 7 zile: 0 termene. OK. Și? Ar fi în dreapta o coloană imensă neagră — gol total."
**Designer**: Card empty state ocupă 460x450px doar cu "✓ Niciun termen". Grid `lg:grid-cols-2` cu carduri height-different = layout shifts + găuri negre.
**Fix**: `grid-auto-rows: min-content` + masonry SAU empty state colapsabil SAU CTA secundar ("Vezi luna viitoare →").

### 7. Trial expired banner pentru user logat fresh (Maria: panic · Designer: messaging confuz)

**Maria**: "Banner roșu mare: 'Trial expirat 62 zile read-only'. Stai, eu sunt logată ca Ana Maria. E expirat? Mă opresc."
**Designer**: Banner global la top, pe DEV mode + trial expired — două state-uri overlap. Severity color (red) ocupa real estate enorm.
**Fix**: Banner conditional pe membership state. DEV banner separat, mai puțin alarming. Trial banner doar la account/billing scope, nu global.

### 8. Multi-data inconsistency (Maria: care-i adevărul? · Designer: state mismatch)

**Maria**: "AZI tab spune 2 CRITICE, 13.400 RON. Sumar per client spune RISC CRITIC 0. Care-i bun?"
**Designer**: Aceeași sursă de date, două proiecții diferite — bug de business logic sau caching.
**Fix**: Audit folder `lib/portfolio/...` — `criticCount` vs `riscCritic` definitions need single source of truth.

---

## PRIORITY MATRIX final

| Issue | Severity Maria | Severity Designer | Fix effort | Priority |
|-------|----------------|-------------------|------------|----------|
| Light-bg utilities pe dark theme (Certificate text invizibil) | CRITICAL | CRITICAL | Medium (2-4h audit + grep) | **P0** |
| Click pe item card = dead button (no drilldown) | CRITICAL | HIGH | Medium (router.push + finding focus) | **P0** |
| Sidebar multi-active (`aria-current` lipsă) | HIGH | HIGH | Low (1-2h fix usePathname strict) | **P0** |
| Multi-data inconsistency (CRITIC 2 vs CRITIC 0) | HIGH | HIGH | Medium (debug data layer) | **P0** |
| Engineering codes in UI (FC-7, FC-9, R1-R7, Master Queue, Burden, Authority Guardian) | HIGH | HIGH | Medium-High (copy audit + design tokens) | **P1** |
| Sume RON fără tabular-nums | MEDIUM | MEDIUM | Low (utility class) | **P1** |
| Asymmetric grid → 370px găuri negre verticale | MEDIUM | MEDIUM | Medium (grid restructure) | **P1** |
| Empty state pasive (Termene 7 zile) | MEDIUM | LOW | Low (copy + collapse) | **P1** |
| Trial banner confuz pe DEV | MEDIUM | MEDIUM | Low (conditional banner) | **P1** |
| Greșeli gramaticale RO (1 firme, 1 clienți) | LOW | MEDIUM | Low (pluralization helper) | **P2** |
| Header snapshot fără culoare semantic (verzi/galbene/roșii grey) | MEDIUM | MEDIUM | Low (span color per token) | **P2** |
| "KILLER FEATURE" chip marketing | LOW | HIGH | Low (remove chip) | **P2** |
| Emoji 🏠 mixat cu Lucide icons | LOW | MEDIUM | Low (replace emoji) | **P2** |
| Tap targets sub 44x44px (Reactivează 24px, Import firme 34px) | LOW | HIGH | Low (Tailwind size up) | **P2** |
| Setări certificat cabinet → redirect / | HIGH | HIGH | High (build settings page) | **P1** |
| "Adaugă client manual" lipsește (doar Import Excel) | MEDIUM | MEDIUM | Medium (form add client) | **P2** |
| 12 itemi sidebar overload | MEDIUM | HIGH | Medium (group nav + collapse) | **P2** |

---

## Verdict final

CompliScan Fiscal are **conceptul corect** pentru durerea reală a Mariei: portofoliu-first cross-client triage, Pre-ANAF Simulation cu Cod Fiscal references, Bank↔SPV reconciliere, audit trail pentru cereri documente. **Sub capotă, value-ul există.** Dar livrarea în acest moment ar pierde Maria în primele 8-10 minute din 3 motive cumulative: (1) **un blocker WCAG** (text alb pe alb pe Certificate digitale) care face informația vitală complet ilegibilă, (2) **un blocker funcțional** (click pe item card nu navighează nicăieri) care rupe încrederea în interactivitate, (3) **un strat de vocabular ENG/internal-engineering** ("Master Exception Queue", "Authority & Mandate Guardian", "FC-7", "Burden Index", "KILLER FEATURE") care îi izbește mental model contabilesc. **Fix-uirea P0-urilor (4 issues, ~2-3 zile dev) deschide deja calea spre testare pilot. Restul P1/P2 e iterație normală. Are valoare reală de 300-700 RON/lună pentru un cabinet de 30+ clienți, dar nu astăzi.**
