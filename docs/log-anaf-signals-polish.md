# Log: ANAF Signals — UI Polish

Data: 2026-03-19
Branch: feat/anaf-signals-phase-a
Context: Post-implementare ANAF Signals Phase A-D (engine-uri complete, zero UI)

## Decizie

Dupa analiza documentului `CompliScan_ANAF_Signals_Roadmap.md` si cercetare pe
cum procedeaza platformele de compliance (Drata, Vanta, Sprinto), am decis:

- **NU construim pagini/inbox-uri separate** per semnal fiscal
- Engine-urile deja alimenteaza Health Check + Response Pack + Partner Hub
- Pattern-ul "single pane of glass" e standard in industrie pentru SMB-uri
- Target-ul nostru (micro-SMB sub 20 angajati) nu are compliance officer dedicat

## Ce am adaugat (polish minimal)

### 1. Vigilance Strip pe Dashboard
- Fisier: `app/dashboard/page.tsx`
- Ce face: banda vizuala sub DNSC banner cand sectorul e ANAF-targeted
- Consuma: `getVigilanceStrip()` din `lib/compliance/sector-risk.ts`
- Nivel "high" = rosu, "elevated" = amber, "normal" = invizibil

### 2. Fiscal Section expandabila in Health Check Card
- Fisier: `components/compliscan/health-check-card.tsx`
- Ce face: grupeaza itemii fiscali (e-Factura, e-TVA, filing, SAF-T) intr-o
  sectiune colapsabila cu badge-uri (critic/warning/OK)
- Itemii non-fiscali se afiseaza ca inainte
- Un click pe "Semnale fiscale" expandeaza detaliile

### 3. Badge count ANAF pe NotificationBell
- Fisier: `components/compliscan/notification-bell.tsx`
- Ce face: punct amber pe clopocel cand exista notificari ANAF necitite
- Strip amber in dropdown cu numar de semnale ANAF nerezolvate
- Iconuri specifice: anaf_signal, anaf_deadline, fiscal_alert

## De ce doar polish, nu pagini noi

Documentul ANAF Signals spune explicit (linia 7):
> "nu construim 5 module noi. Integram semnalele in arhitectura existenta"

Cercetare web confirma:
- Drata/Vanta/Sprinto folosesc dashboard agregat + drill-down
- "For lean teams without full-time compliance hires, the priority should be
  automation, simple UX, and real-time alerts" (sursa: industry best practices)
- Inbox-uri separate = pagini pe care nimeni nu le deschide la micro-SMB

## TypeScript

Zero erori din cod sursa. 6 erori din `.next/types/` cache (V6 agent routes) — preexistente.
