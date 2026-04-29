// lib/server/onboarding-emails.ts
// V4.4.5 — Secvență email onboarding (4 emailuri automate via Resend).
// Fire-and-forget — nu blochează niciodată fluxul principal.
//
// Emailuri:
//   1 (imediat la register)  — Welcome + completează profilul
//   2 (ziua 2)               — Generează primul document
//   3 (ziua 5)               — Importă furnizori din e-Factura
//   4 (ziua 10)              — Scor + findings + upgrade CTA

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS =
  process.env.ALERT_EMAIL_FROM ?? "CompliScan <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.compliscan.ro"

// ── Types ─────────────────────────────────────────────────────────────────────

export type OnboardingEmailType = "welcome" | "day2-first-doc" | "day5-vendors" | "day10-upgrade"

type EmailTemplate = {
  subject: string
  html: (params: { orgName: string; appUrl: string }) => string
}

// ── Templates ─────────────────────────────────────────────────────────────────

const TEMPLATES: Record<OnboardingEmailType, EmailTemplate> = {
  welcome: {
    subject: "Bine ai venit în CompliScan — completează profilul în 2 minute",
    html: ({ orgName, appUrl }) => `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a">
  <div style="background:#1e293b;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">CompliScan</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 12px">Bine ai venit, ${orgName}!</h2>
    <p style="color:#475569">Ți-am creat contul. Primul pas: completează profilul organizației (2 minute) pentru a vedea exact ce legi ți se aplică.</p>
    <a href="${appUrl}/dashboard" style="display:inline-block;margin-top:16px;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
      Completează profilul →
    </a>
    <p style="margin-top:24px;font-size:13px;color:#94a3b8">Ai 14 zile de acces Pro gratuit. Nicio carte de credit necesară.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="font-size:11px;color:#94a3b8">Nu oferim consultanță juridică. Oferim instrumente de pregătire.</p>
  </div>
</body></html>`,
  },

  "day2-first-doc": {
    subject: "30 de secunde pentru primul tău document CompliScan",
    html: ({ orgName, appUrl }) => `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a">
  <div style="background:#1e293b;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">CompliScan</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 12px">Generează primul document, ${orgName}</h2>
    <p style="color:#475569">Ai completat profilul — excelent. Acum generează un document gata de folosit: Politică de confidențialitate, DPA sau Plan de răspuns la incidente.</p>
    <p style="color:#475569">Durează 30 de secunde. Documentul vine pre-completat cu datele organizației tale.</p>
    <a href="${appUrl}/dashboard/generator" style="display:inline-block;margin-top:16px;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
      Generează document →
    </a>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="font-size:11px;color:#94a3b8">Nu oferim consultanță juridică. Documentele generate necesită validare juridică înainte de utilizare oficială.</p>
  </div>
</body></html>`,
  },

  "day5-vendors": {
    subject: "Furnizori fără DPA = risc GDPR ascuns. Verifică în 2 minute.",
    html: ({ orgName, appUrl }) => `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a">
  <div style="background:#1e293b;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">CompliScan</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 12px">Verifică furnizorii tăi, ${orgName}</h2>
    <p style="color:#475569">Dacă ești eligibil NIS2, fiecare furnizor tehnic fără DPA semnat este un risc activ. CompliScan poate importa furnizorii din facturile ANAF automat.</p>
    <a href="${appUrl}/dashboard/nis2" style="display:inline-block;margin-top:16px;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
      Importă furnizori →
    </a>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="font-size:11px;color:#94a3b8">Nu oferim consultanță juridică.</p>
  </div>
</body></html>`,
  },

  "day10-upgrade": {
    subject: "Cum stai cu conformitatea? Scorul tău + recomandări",
    html: ({ orgName, appUrl }) => `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a">
  <div style="background:#1e293b;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">CompliScan</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 12px">10 zile cu CompliScan, ${orgName}</h2>
    <p style="color:#475569">Intră în dashboard să vezi scorul tău de conformitate și toate findings-urile deschise. Găsești acolo și Audit Pack-ul complet — gata de descărcat.</p>
    <a href="${appUrl}/dashboard" style="display:inline-block;margin-top:8px;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
      Vezi scorul tău →
    </a>
    <p style="margin-top:16px;color:#475569">Trial-ul Pro expiră în curând. Dacă CompliScan ți-a fost util, poți continua cu planul Pro — €99/lună.</p>
    <a href="${appUrl}/pricing" style="display:inline-block;margin-top:8px;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
      Continuă cu Pro →
    </a>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="font-size:11px;color:#94a3b8">Nu oferim consultanță juridică. Prețurile sunt ipoteze de validare de piață.</p>
  </div>
</body></html>`,
  },
}

// ── sendOnboardingEmail ───────────────────────────────────────────────────────

/**
 * Trimite un email din secvența de onboarding.
 * Fire-and-forget — apelează cu `void sendOnboardingEmail(...)`.
 */
export async function sendOnboardingEmail(
  type: OnboardingEmailType,
  email: string,
  orgName: string
): Promise<void> {
  if (!email || email.includes("demo")) return

  const template = TEMPLATES[type]

  if (!RESEND_API_KEY) {
    // Dev fallback — log în consolă
    console.log(
      `[onboarding-email] ${type} → ${email} | Subject: ${template.subject} (RESEND_API_KEY not set)`
    )
    return
  }

  try {
    const html = template.html({ orgName, appUrl: APP_URL })
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        subject: template.subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = (await res.json()) as { message?: string }
      console.warn(`[onboarding-email] ${type} → ${email} failed: ${err.message ?? res.status}`)
    }
  } catch (err) {
    console.warn(`[onboarding-email] ${type} → ${email} error:`, err)
    // Silent — nu blochează
  }
}
