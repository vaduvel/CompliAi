// Sprint 4 — DNSC Registration Wizard
// Generează un draft de notificare NIS2 pentru trimitere la DNSC (evidenta@dnsc.ro).
// Funcție pură, fără I/O.

import type { OrgProfile } from "@/lib/compliance/applicability"
import { ORG_SECTOR_LABELS, ORG_EMPLOYEE_COUNT_LABELS } from "@/lib/compliance/applicability"

export type DnscDraftMetadata = {
  orgName: string
  orgProfile: Partial<OrgProfile> | null
  generatedAt?: string
}

/**
 * Construiește un draft Markdown de notificare NIS2 pentru DNSC.
 * Pre-completează datele disponibile din OrgProfile; câmpurile lipsă
 * sunt marcate cu `[DE COMPLETAT]`.
 */
export function buildDNSCNotificationDraft(meta: DnscDraftMetadata): string {
  const { orgName, orgProfile } = meta
  const date = meta.generatedAt ?? new Date().toISOString().split("T")[0]

  const cui = orgProfile?.cui ?? "[DE COMPLETAT — CUI fiscal]"
  const sectorLabel = orgProfile?.sector
    ? ORG_SECTOR_LABELS[orgProfile.sector]
    : "[DE COMPLETAT — sector de activitate]"
  const sizeLabel = orgProfile?.employeeCount
    ? ORG_EMPLOYEE_COUNT_LABELS[orgProfile.employeeCount]
    : "[DE COMPLETAT — dimensiune organizație]"

  const isEssential =
    orgProfile?.sector &&
    ["energy", "transport", "banking", "health", "digital-infrastructure", "public-admin"].includes(
      orgProfile.sector
    )

  const entityType = isEssential ? "entitate esențială" : "entitate importantă"

  return `# Notificare de Înregistrare NIS2
**Destinatar:** Directoratul Național de Securitate Cibernetică (DNSC)
**Email:** evidenta@dnsc.ro
**Platformă oficială:** https://nis2.dnsc.ro
**Data:** ${date}

---

## 1. Identificarea organizației

| Câmp | Valoare |
|---|---|
| **Denumire completă** | ${orgName || "[DE COMPLETAT]"} |
| **CUI / CIF** | ${cui} |
| **Sector de activitate NIS2** | ${sectorLabel} |
| **Dimensiune** | ${sizeLabel} |
| **Adresă sediu social** | [DE COMPLETAT] |
| **Județ** | [DE COMPLETAT] |
| **Cod CAEN principal** | [DE COMPLETAT] |

---

## 2. Clasificare conform NIS2

Organizația se încadrează ca **${entityType}** conform Directivei (UE) 2022/2555 (NIS2),
transpusă în legislația națională prin Legea nr. 58/2023.

**Motivul clasificării:**
${
  orgProfile?.sector
    ? `Activitatea principală în sectorul "${sectorLabel}" se încadrează în Anexa ${isEssential ? "I" : "II"} a Directivei NIS2.`
    : "[DE COMPLETAT — explicați de ce organizația intră sub incidența NIS2]"
}

---

## 3. Contact persoană responsabilă securitate cibernetică

| Câmp | Valoare |
|---|---|
| **Nume și prenume** | [DE COMPLETAT] |
| **Funcție** | [DE COMPLETAT — ex: CISO, IT Manager, Director General] |
| **Email** | [DE COMPLETAT] |
| **Telefon** | [DE COMPLETAT] |

---

## 4. Sisteme și servicii în scopul NIS2

Vă rugăm să descrieți pe scurt serviciile/infrastructura care intră în scope NIS2:

- [DE COMPLETAT — ex: platformă online, infrastructură cloud, sisteme de producție]
- [DE COMPLETAT — ex: servicii oferite clienților / altor entități]

---

## 5. Declarație de conformare

Prin prezenta notificare, **${orgName || "[DENUMIRE ORGANIZAȚIE]"}** confirmă că:

1. Este conștientă de obligațiile impuse de Directiva NIS2 și legislația națională;
2. Va implementa măsurile tehnice și organizatorice de securitate cibernetică adecvate;
3. Va raporta incidentele semnificative la DNSC în termenele legale (24h — avertizare timpurie, 72h — raport complet);
4. Va coopera cu DNSC în activitățile de supraveghere și audit.

---

## 6. Documente anexate (opțional)

- [ ] Organigramă / structura organizației
- [ ] Politica de securitate cibernetică (dacă există)
- [ ] Lista principalelor sisteme IT în scope

---

*Document generat de CompliAI · ${date} · Document informativ, nu constituie consiliere juridică*
*Verificați cerințele complete pe https://nis2.dnsc.ro înainte de trimitere*
`
}
