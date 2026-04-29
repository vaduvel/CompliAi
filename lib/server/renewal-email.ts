// lib/server/renewal-email.ts
// Email de reînnoire abonament — CompliScan Etapa 1, TASK 3
//
// Subiect: [Firma ta] — 12 luni de conformitate. Ce se întâmplă dacă nu reînnoiești.
// Tonul e factual, nu urgentizant artificial — lăsăm datele să vorbească.
//
// Folosit de cron-ul /api/cron/renewal-reminder (rulează zilnic, trimite
// cu 7 zile înainte de expirare).

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS =
  process.env.ALERT_EMAIL_FROM ?? "CompliScan <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.compliscan.ro"

export type RenewalEmailData = {
  orgId: string
  orgName: string
  dovediiSalvate: number | null
  rapoarteGenerate: number
  pacheteAudit: number
}

function buildRenewalHtml(data: RenewalEmailData, appUrl: string): string {
  const renewalClickUrl = `${appUrl}/r/renewal/${encodeURIComponent(data.orgId)}`
  const hasData =
    (data.dovediiSalvate !== null && data.dovediiSalvate > 0) ||
    data.rapoarteGenerate > 0 ||
    data.pacheteAudit > 0

  const metricsRows = hasData
    ? `
    <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;margin:16px 0">
      ${data.dovediiSalvate !== null ? `
      <tr>
        <td style="padding:10px 16px;color:#475569;font-size:14px">📁 Dovezi de conformitate</td>
        <td style="padding:10px 16px;font-weight:700;font-size:14px;text-align:right">${data.dovediiSalvate}</td>
      </tr>` : ""}
      ${data.rapoarteGenerate > 0 ? `
      <tr style="border-top:1px solid #e2e8f0">
        <td style="padding:10px 16px;color:#475569;font-size:14px">📄 Rapoarte lunare generate</td>
        <td style="padding:10px 16px;font-weight:700;font-size:14px;text-align:right">${data.rapoarteGenerate}</td>
      </tr>` : ""}
      ${data.pacheteAudit > 0 ? `
      <tr style="border-top:1px solid #e2e8f0">
        <td style="padding:10px 16px;color:#475569;font-size:14px">📦 Pachete de audit</td>
        <td style="padding:10px 16px;font-weight:700;font-size:14px;text-align:right">${data.pacheteAudit}</td>
      </tr>` : ""}
      <tr style="border-top:1px solid #e2e8f0">
        <td style="padding:10px 16px;color:#475569;font-size:14px">⏱ Monitorizare continuă</td>
        <td style="padding:10px 16px;font-weight:700;font-size:14px;text-align:right">NIS2, GDPR, eFactura</td>
      </tr>
    </table>`
    : `
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0">
      <p style="margin:0;color:#475569;font-size:14px">⏱ Monitorizare continuă activă — NIS2, GDPR, eFactura</p>
    </div>`

  return `
<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a;background:#fff">
  <div style="background:#1e293b;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">CompliScan</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:28px;border-radius:0 0 8px 8px">

    <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;line-height:1.4">
      În ultimele 12 luni, CompliScan a acumulat pentru ${data.orgName}:
    </h2>

    ${metricsRows}

    <p style="color:#475569;font-size:14px;line-height:1.6;margin:20px 0 8px">
      Tot istoricul — dovezile, rapoartele, pachetele de audit — rămâne accesibil cât timp contul este activ.
    </p>

    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px">
      La expirare, datele sunt păstrate 90 de zile, după care sunt șterse definitiv conform politicii noastre.
    </p>

    <a href="${renewalClickUrl}"
       style="display:inline-block;background:#3b82f6;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
      Păstrează istoricul tău →
    </a>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px">
    <p style="font-size:11px;color:#94a3b8;margin:0">
      Nu oferim consultanță juridică. Prețurile sunt supuse modificărilor.
      <a href="${appUrl}/dashboard/settings" style="color:#6366f1">Gestionează notificările</a>
    </p>
  </div>
</body></html>`
}

/**
 * Trimite emailul de reînnoire cu datele acumulate ale organizației.
 * Fire-and-forget — apelează cu `void sendRenewalEmail(...)`.
 */
export async function sendRenewalEmail(
  to: string,
  data: RenewalEmailData
): Promise<{ ok: boolean; channel: "resend" | "console" }> {
  const subject = `${data.orgName} — 12 luni de conformitate. Ce se întâmplă dacă nu reînnoiești.`

  if (!RESEND_API_KEY) {
    console.log(
      `[renewal-email] → ${to} | Subject: ${subject} (RESEND_API_KEY not set)`
    )
    return { ok: true, channel: "console" }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject,
        html: buildRenewalHtml(data, APP_URL),
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.warn(`[renewal-email] → ${to} failed: ${err}`)
      return { ok: false, channel: "resend" }
    }

    const json = await res.json() as { id?: string }
    console.log(`[renewal-email] Trimis via Resend → ${to} (id=${json.id ?? "?"})`)
    return { ok: true, channel: "resend" }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed"
    console.warn(`[renewal-email] Exception: ${msg}`)
    return { ok: false, channel: "resend" }
  }
}
