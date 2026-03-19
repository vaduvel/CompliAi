# CompliAI — UX Principles

> Extras din CompliAI_UX_Architecture_Final.md · Filtrat 2026-03-18
> Principii permanente de design — nu spec de implementare.

---

## 1. Modelul Mental — 4 Moduri Cognitive

Fiecare pagină din produs aparține UNUIA singur din aceste moduri:

```
ORIENTARE    "Unde sunt? Ce arde?"        → Dashboard
INVESTIGARE  "Ce trebuie să fac exact?"   → Module (NIS2, AI Act, e-Factura, Vendori)
ACȚIUNE      "Rezolv acum."              → Findings, Generator, Wizards
LIVRARE      "Dovedesc ce am făcut."     → Rapoarte, Audit Pack, Response Pack
```

Dacă o pagină servește două moduri simultan → IA-ul e greșit și trebuie spart.

---

## 2. State Machines

### Finding Lifecycle

```
DETECT → OPEN → IN_PROGRESS → AWAITING_EVIDENCE → RESOLVED → STALE → (RESOLVED sau OPEN)

În orice moment: → WAIVED (cu motiv obligatoriu)
```

| State | Badge | Culoare |
|---|---|---|
| open | DESCHIS | roșu |
| in_progress | ÎN LUCRU | amber |
| awaiting_evidence | AȘTEAPTĂ DOVADĂ | amber hollow |
| resolved | REZOLVAT | verde |
| stale | EXPIRAT | portocaliu |
| waived | EXCLUS | gri hollow |

### Vendor Review Lifecycle (V5)

```
DETECTED → NEEDS_CONTEXT → REVIEW_GENERATED → AWAITING_HUMAN_VALIDATION → AWAITING_EVIDENCE → CLOSED → OVERDUE_REVIEW
```

### Agent Execution Lifecycle (V6)

```
TRIGGER → EXECUTING → OUTPUT_READY → (auto-apply → COMPLETED) sau (PENDING_APPROVAL → approved/rejected)
```

---

## 3. 20 Reguli UX Finale

1. **Sub 90 secunde** de la register la prima valoare vizibilă (scor + urgențe)
2. **Sub 60 secunde** owner vede ce are de făcut (dashboard urgency-first)
3. **Sub 60 secunde** contabil vede cine arde (hub urgency queue)
4. **Zero pagini goale** fără empty state cu CTA activ
5. **Zero termeni tehnici** în UI — totul în română naturală
6. **Zero findings fără drum complet** — problemă → impact → acțiune → dovadă → revalidare
7. **Un singur CTA primar per suprafață** — restul secondary sau ghost
8. **Rol vizibil** pe fiecare buton disabled cu tooltip
9. **Plan gate vizibil** pe features locked cu overlay + upgrade CTA
10. **Disclaimer pe toate paginile** în footer: "instrumente de pregătire, nu consiliere juridică"
11. **LegalStatusBadge pe ORICE referință legislativă** — ✅/⚠️/📝/📊
12. **Urgențele primele** pe orice suprafață — DNSC > facturi > findings critice > stale
13. **Mesaj DNSC prudent** — "demonstrează bună-credință", nu "reduce sancțiunile"
14. **Resolution Layer complet pe FIECARE finding** — fără excepții
15. **Buton Rezolvat DISABLED fără dovadă** — fără excepții
16. **Activity trail pe fiecare finding** — cine, când, ce
17. **Revalidare automată** pe fiecare finding închis — nu se "uită"
18. **V5 nu dă verdict juridic** — "am pregătit review-ul, tu decizi"
19. **V6 agenți nu iau decizii** — "am făcut draft-ul, tu aprobi"
20. **Feedback micro** după acțiuni cheie (thumbs up/down, 1-5 scale)

---

## 4. Roluri și Permisiuni

| Rol | Cine e | Poate |
|---|---|---|
| **Owner** | Administratorul firmei | Tot: edit, delete, generate, export, invite, pay |
| **Compliance** | DPO, consultant, responsabil NIS2 | Edit findings, generate docs, export — NU delete org, NU pay |
| **Partner** | Contabilul extern cu portofoliu | Hub, drill-down clienți, export rapoarte, pornește review-uri |
| **Viewer** | Angajat, board member, auditor | Read-only total, download rapoarte existente |

### Când permisiunea lipsește:
- Pagina accesibilă, acțiune nu → buton disabled + tooltip "Necesită rol {rol}"
- Pagina inaccesibilă → redirect la Dashboard cu toast "Nu ai acces"
- Feature locked by plan → overlay blur + "Disponibil în planul Pro" + buton Upgrade

---

## 5. Empty States

Fiecare pagină goală trebuie să aibă:
- Icon relevant (48px)
- Titlu scurt
- Descriere 1 propoziție
- CTA activ (buton care rezolvă starea goală)

Excepție: stare goală = stare bună (ex: "Niciun semnal e-Factura — totul e în ordine.")

---

## 6. Loading, Error, Feedback

**Loading:** skeleton blocks pe SummaryStrip + card skeletons, spinner pe butoane cu text "Se generează..."

**Erori:**
- Gemini indisponibil → InlineAlert warning
- Session expirat → redirect `/login` + toast
- Network offline → banner persistent top

**Micro-interactions:**
- Finding închis → confetti subtle (2s) + scor se actualizează animat
- Document generat → toast + buton Descarcă în toast
- Factură respinsă → toast critical persistent (nu dispare automat)

---

## 7. Responsive

| Breakpoint | Sidebar | Content |
|---|---|---|
| Desktop (>1024px) | 240px expanded | 12-col, max 1200px |
| Tablet (768-1024px) | 64px collapsed (icons) | 8-col |
| Mobile (<768px) | Hidden, bottom nav 5 icons | Single column |

---

## 8. Dashboard — Reguli de Prioritizare

| Regulă | Detaliu |
|---|---|
| Urgențe: max 3 vizibile | Dacă sunt mai mult de 3, arată 3 + link "Vezi toate (7)" |
| Acțiunea Ta: exact 1 | DNSC > facturi > finding critic > document expirat |
| Module: doar cele aplicabile | Dacă AI Act = unlikely, cardul nu apare |
| Partner vede alt dashboard | Redirect automat la Hub |

---

*Principii UX extrase din CompliAI_UX_Architecture_Final.md · 2026-03-18*
