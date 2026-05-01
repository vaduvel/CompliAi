// Pay Transparency — Auto-reply generator pentru cereri angajați
// Conform Directivei (UE) 2023/970 + GDPR (răspuns nu poate dezvălui date individuale).

import { computeSalaryRange, type JobArchitecture } from "./job-architecture"
import type { EmployeeRequestQuestion } from "@/lib/server/pay-transparency-requests-store"

export type ReplyContext = {
  orgName: string
  jobRole: string
  question: EmployeeRequestQuestion
  arch: JobArchitecture
  /** Optional gap data dacă există raport publicat. */
  gapPercent?: number | null
  /** Level dacă HR-ul îl cunoaște. */
  level?: string | null
}

const DIRECTIVE = "Conform Directivei (UE) 2023/970 transpuse în legislația națională"

export function generateAutoReply(ctx: ReplyContext): string {
  const header = [
    `Stimată/Stimate angajat/angajată,`,
    ``,
    `Mulțumim pentru solicitarea dumneavoastră privind transparența salarială pentru rolul "${ctx.jobRole}". ${DIRECTIVE}, prezentăm răspunsul după cum urmează.`,
    ``,
  ].join("\n")

  let body: string
  switch (ctx.question) {
    case "own_salary":
      body = generateOwnSalaryReply(ctx)
      break
    case "average_salary_role":
      body = generateAverageSalaryReply(ctx)
      break
    case "gender_pay_gap":
      body = generateGenderPayGapReply(ctx)
      break
    case "promotion_criteria":
      body = generatePromotionCriteriaReply(ctx)
      break
    case "other":
    default:
      body = generateGenericReply(ctx)
      break
  }

  const footer = [
    ``,
    `Pentru clarificări suplimentare sau dacă răspunsul nu satisface solicitarea, ne puteți contacta direct prin departamentul HR.`,
    ``,
    `Cu stimă,`,
    `Departamentul HR — ${ctx.orgName}`,
    ``,
    `---`,
    `Notă GDPR: răspunsul a fost agregat la nivel de rol/categorie pentru a proteja datele individuale ale colegilor.`,
  ].join("\n")

  return header + body + footer
}

function generateOwnSalaryReply(ctx: ReplyContext): string {
  return [
    `Veți primi în paralel din partea managerului direct și a HR-ului datele actualizate privind salariul dumneavoastră brut și componentele acestuia (salariu de bază, bonusuri eligibile, alte beneficii). Vă rugăm să confirmați primirea.`,
    ``,
    `Vă rugăm să țineți cont că:`,
    `- Răspunsul include doar datele dumneavoastră individuale.`,
    `- Comparațiile cu colegii sunt furnizate la nivel agregat (a se vedea răspunsurile la întrebările "salariu mediu pe rol" sau "ecart salarial gen").`,
  ].join("\n")
}

function generateAverageSalaryReply(ctx: ReplyContext): string {
  // Try to lookup band for this role across all levels
  const matchingBands = ctx.arch.bands.filter((b) => b.role === ctx.jobRole)
  if (matchingBands.length === 0) {
    return [
      `Pentru rolul "${ctx.jobRole}" nu avem încă o grilă salarială publicată. Departamentul HR este în proces de finalizare a job architecture-ului conform Directivei.`,
      ``,
      `Vă vom transmite informațiile imediat ce arhitectura este publicată — termenul intern este [DATA].`,
    ].join("\n")
  }

  const lines = [`Pentru rolul "${ctx.jobRole}" comunicăm grilele salariale (RON brut/lună):`, ``]
  for (const band of matchingBands) {
    const range = computeSalaryRange(ctx.arch, band.level, band.role)
    if (range) {
      lines.push(
        `- Nivel ${band.level}: ${range.min.toLocaleString("ro-RO")}–${range.max.toLocaleString("ro-RO")} RON (mid: ${range.mid.toLocaleString("ro-RO")} RON)`,
      )
    }
  }
  lines.push(
    ``,
    `Datele de mai sus reprezintă grilele active la data prezentei. Salariile efective ale colegilor pot diferi în funcție de senioritate, performanță și negociere individuală, dar se încadrează în intervalele comunicate.`,
  )
  return lines.join("\n")
}

function generateGenderPayGapReply(ctx: ReplyContext): string {
  if (typeof ctx.gapPercent !== "number") {
    return [
      `Pentru rolul "${ctx.jobRole}" raportul ecart salarial gen este în pregătire și va fi comunicat conform calendarului anual/triennial prevăzut de lege.`,
      ``,
      `Pentru a vă asigura un răspuns complet, ne angajăm să transmitem datele agregate (% ecart M/F) imediat ce ele sunt aprobate intern, fără a depăși termenul de 30 de zile.`,
    ].join("\n")
  }

  const interpretation =
    ctx.gapPercent <= 5
      ? "în limita de 5% prevăzută de Directiva UE 2023/970, fără obligație de evaluare comună."
      : `peste pragul de 5% prevăzut de Directivă. Conform legii, am inițiat procesul de evaluare comună cu reprezentanții salariaților pentru identificarea cauzelor și măsurilor corective.`

  return [
    `Ecartul salarial de gen pentru rolul "${ctx.jobRole}", la ultima raportare aprobată, este de **${ctx.gapPercent.toFixed(1)}%**.`,
    ``,
    `Acest procent este ${interpretation}`,
    ``,
    `Pentru detalii metodologice (cum se calculează gap-ul, ce componente sunt incluse, perioada de referință), vă invităm să consultați raportul integral disponibil intern, sau să solicitați o întâlnire cu departamentul HR.`,
  ].join("\n")
}

function generatePromotionCriteriaReply(ctx: ReplyContext): string {
  return [
    `Criteriile de promovare și evoluție salarială pentru rolul "${ctx.jobRole}" sunt:`,
    ``,
    `1. Performanță (evaluare anuală structurată).`,
    `2. Competențe verificabile (certificări, training-uri completate).`,
    `3. Senioritate în rol și experiență în domeniu.`,
    `4. Disponibilitate pentru responsabilități extinse (mentoring, lead, deliverables).`,
    `5. Buget disponibil + planificare anuală pe departament.`,
    ``,
    `Aceste criterii sunt aplicate uniform, neutru din perspectivă de gen, vârstă, etnie sau alte caracteristici protejate. Pentru detalii suplimentare specifice rolului dumneavoastră, vă invităm la o discuție individuală cu managerul direct + HR.`,
  ].join("\n")
}

function generateGenericReply(ctx: ReplyContext): string {
  return [
    `Solicitarea dumneavoastră a fost recepționată și va fi tratată în maximum 30 de zile calendaristice de la primire (conform Directivei).`,
    ``,
    `Pentru a putea răspunde precis, departamentul HR va analiza specificul întrebării și va reveni cu informațiile relevante pentru rolul "${ctx.jobRole}".`,
  ].join("\n")
}
