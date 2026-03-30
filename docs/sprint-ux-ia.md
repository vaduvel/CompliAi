# Sprint Log — UX / IA Fixes
> Bazat pe: Audit Gemini (re-verificat în cod de Claude, 2026-03-28)
> Skill: `/sprint-log` pentru actualizări

---

## Stare curentă

| Sprint | Titlu | Status | Prioritate | Efort |
|--------|-------|--------|-----------|-------|
| UX-1 | Rapoarte — Vault primul, Export după | 🟢 Închis | 🔴 P1 | 2026-03-28 |
| UX-2 | Acasă — elimină redundanța cifre (găsit × 2) | 🟢 Închis | 🟡 P2 | 2026-03-28 |
| UX-3 | De rezolvat — comprimă header-ul PageIntro | 🟢 Închis | 🟡 P2 | 2026-03-28 |

---

## UX-1 — Rapoarte: Vault primul, Export în dropdown

**Origine:** Audit Gemini + confirmat în cod `components/compliscan/reports-page.tsx`

**Problema identificată în cod:**
- `ExportCenter` (10 callback-uri, ~9-10 butoane) apare primul
- `GeneratedDocumentsVault` (documentele reale) apare după export
- Ordinea trimite mesajul greșit: "ești aici să exporți" în loc de "ești aici să-ți vezi dosarul"

**Soluția UX:**
1. Mută `GeneratedDocumentsVault` **înaintea** `ExportCenter`
2. În `ExportCenter`: lasă 1 buton primar vizibil (`Exportă Pachet Audit`) + un dropdown `Export avansat` care ascunde celelalte 8-9 opțiuni
3. Utilizatorul obișnuit (Mihai/Diana) vede: Dosarul meu → 1 buton export
4. Utilizatorul avansat (Radu/Auditor): apasă dropdown și scoate ce are nevoie

**Fișiere afectate:**
- `components/compliscan/reports-page.tsx` — inversează ordinea secțiunilor
- `components/compliscan/export-center.tsx` — restructurează butoanele (1 primar + dropdown avansat)

**Definition of Done:**
- [ ] Vault apare primul în pagina Rapoarte
- [ ] Export are un singur buton primar vizibil
- [ ] Opțiunile avansate sunt colapsate într-un dropdown "Export avansat"
- [ ] Utilizatorul cu 0 documente generate vede empty state clar în Vault
- [ ] Build TypeScript curat

**Log:**
| Data | Autor | Notă |
|------|-------|------|
| 2026-03-28 | Claude | Sprint creat din audit Gemini (verificat în cod) |

---

## UX-2 — Acasă: elimină redundanța cifre

**Origine:** Audit Gemini + confirmat în cod `app/dashboard/page.tsx` liniile 232 + 289

**Problema identificată în cod:**
- Linia 232: strip de orientare afișează `"${activeFindings.length} cazuri active · ..."`
- Linia 289: card metric separat afișează același `activeFindings.length` + label "Cazuri active"

**Soluția UX (opțiuni):**
- **Opțiunea A (recomandată):** Păstrează strip-ul de sus (`Se aplică | Am găsit | Acum faci asta`) — e orientare contextuală. Schimbă cardul "Cazuri active" să afișeze ceva complementar (ex: `Riscuri P1` sau `Drift activ`) în loc să repete același număr.
- **Opțiunea B:** Scoate din strip secțiunea "Am găsit" și lasă doar `Se aplică | Acum faci asta`. Cardul rămâne.

**Fișiere afectate:**
- `app/dashboard/page.tsx` — modifică fie strip-ul, fie cardul metric

**Definition of Done:**
- [ ] Aceeași cifră nu mai apare de 2 ori pe pagina Acasă
- [ ] Strip-ul de orientare și cardurile de metrici afișează informații complementare, nu duplicate
- [ ] Build TypeScript curat

**Log:**
| Data | Autor | Notă |
|------|-------|------|
| 2026-03-28 | Claude | Sprint creat din audit Gemini (verificat în cod) |

---

## UX-3 — De rezolvat: comprimă header-ul PageIntro

**Origine:** Audit Gemini (parțial corect) + observație proprie

**Clarificare față de audit Gemini:**
- Gemini spune că e "exact același bloc de pe Acasă" — **INCORECT**. Conținutul e diferit (blocaj de execuție vs. overview general).
- Dar are dreptate că `PageIntro` pe De rezolvat ocupă spațiu vertical semnificativ înainte de board.
- Utilizatorul care vine din Acasă pentru a lucra în board vrea să ajungă **direct la task-uri**.

**Soluția UX:**
- Nu scoate complet `PageIntro` — conținutul e util (arată blocajul curent)
- Comprimă-l: elimină `description` (textul lung explicativ) și lasă doar `eyebrow + title + aside` (semnalul curent)
- Alternativ: transformă PageIntro într-un banner compact de 1 linie deasupra board-ului

**Fișiere afectate:**
- `app/dashboard/checklists/page.tsx` — modifică sau elimină `description` din PageIntro

**Definition of Done:**
- [ ] PageIntro pe De rezolvat nu mai ocupă mai mult de ~80px înălțime
- [ ] Board-ul de task-uri e vizibil fără scroll semnificativ
- [ ] Informația critică (blocajul curent) rămâne vizibilă
- [ ] Build TypeScript curat

**Log:**
| Data | Autor | Notă |
|------|-------|------|
| 2026-03-28 | Claude | Sprint creat — clarificat față de diagnosticul Gemini |
