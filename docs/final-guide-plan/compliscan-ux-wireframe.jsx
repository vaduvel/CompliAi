import { useState } from "react";

// ─── Design tokens from CompliScan Evidence OS DS ───────────────────────────
const t = {
  canvas:   "#111113",
  panel:    "#18181B",
  card:     "#1F1F23",
  hover:    "#27272B",
  active:   "#2E2E33",
  border:   "#2E2E33",
  borderMd: "#3A3A40",
  muted:    "#505057",
  textTert: "#8C8C96",
  textSec:  "#B2B2BA",
  textPri:  "#F1F1F5",
  emerald:  "#34D399",
  emeraldD: "#1E8E67",
  emeraldBg:"rgba(52,211,153,0.08)",
  red:      "#F87171",
  redBg:    "rgba(248,113,113,0.10)",
  amber:    "#FBBF24",
  amberBg:  "rgba(251,191,36,0.10)",
  violet:   "#A78BFA",
  violetBg: "rgba(167,139,250,0.10)",
  blue:     "#60A5FA",
  blueBg:   "rgba(96,165,250,0.10)",
};

// ─── Shared micro-components ─────────────────────────────────────────────────
const Badge = ({ color, bg, children, size = "sm" }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: size === "sm" ? "2px 8px" : "4px 10px",
    borderRadius: 999,
    background: bg, color: color,
    fontSize: size === "sm" ? 11 : 12, fontWeight: 600,
    letterSpacing: "0.03em", whiteSpace: "nowrap",
  }}>{children}</span>
);

const Dot = ({ color }) => (
  <span style={{ width: 7, height: 7, borderRadius: 999, background: color, display: "inline-block", flexShrink: 0 }} />
);

const Btn = ({ children, variant = "primary", onClick, small }) => {
  const styles = {
    primary: { background: t.emerald, color: "#111113", border: "none" },
    secondary: { background: "transparent", color: t.textSec, border: `1px solid ${t.borderMd}` },
    ghost: { background: "transparent", color: t.textTert, border: "none" },
  };
  return (
    <button onClick={onClick} style={{
      ...styles[variant],
      padding: small ? "5px 12px" : "8px 16px",
      borderRadius: 8, fontSize: small ? 12 : 13, fontWeight: 600,
      cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
      transition: "opacity 0.15s",
    }}
    onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >{children}</button>
  );
};

const Card = ({ children, style }) => (
  <div style={{
    background: t.card, border: `1px solid ${t.border}`,
    borderRadius: 12, padding: 20, ...style,
  }}>{children}</div>
);

const Divider = () => (
  <div style={{ height: 1, background: t.border, margin: "4px 0" }} />
);

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const NAV = [
  { id: "home",    icon: "⊞", label: "Acasă",       sub: "stare & urgențe" },
  { id: "scan",    icon: "⊙", label: "Scanează",     sub: "input & analiză" },
  { id: "resolve", icon: "⚐", label: "De rezolvat",  sub: "findings & tasks", badge: 5 },
  { id: "reports", icon: "⊟", label: "Rapoarte",     sub: "dovezi & export" },
];

const Sidebar = ({ active, onChange }) => (
  <div style={{
    width: 220, background: t.panel, borderRight: `1px solid ${t.border}`,
    display: "flex", flexDirection: "column", height: "100%", flexShrink: 0,
  }}>
    {/* Logo */}
    <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${t.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: t.emeraldD,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: t.textPri,
        }}>⊛</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.textPri }}>CompliScan</div>
          <div style={{ fontSize: 10, color: t.textTert, marginTop: 1 }}>evidence operating system</div>
        </div>
      </div>
    </div>

    {/* Nav */}
    <nav style={{ padding: "12px 8px", flex: 1 }}>
      {NAV.map(item => {
        const isActive = active === item.id;
        return (
          <div key={item.id}
            onClick={() => onChange(item.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: 8, cursor: "pointer",
              background: isActive ? t.active : "transparent",
              border: isActive ? `1px solid ${t.borderMd}` : "1px solid transparent",
              marginBottom: 2, transition: "background 0.12s",
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = t.hover; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ fontSize: 15, color: isActive ? t.emerald : t.muted, width: 18, textAlign: "center" }}>
              {item.icon}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? t.textPri : t.textSec }}>
                {item.label}
              </div>
              <div style={{ fontSize: 10, color: t.textTert, marginTop: 1 }}>{item.sub}</div>
            </div>
            {item.badge && (
              <span style={{
                background: t.redBg, color: t.red, fontSize: 10, fontWeight: 700,
                padding: "1px 6px", borderRadius: 999,
              }}>{item.badge}</span>
            )}
          </div>
        );
      })}

      <div style={{ margin: "8px 0" }}><Divider /></div>

      {/* Settings */}
      <div
        onClick={() => onChange("settings")}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 10px", borderRadius: 8, cursor: "pointer",
          background: active === "settings" ? t.active : "transparent",
          transition: "background 0.12s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = t.hover}
        onMouseLeave={e => e.currentTarget.style.background = active === "settings" ? t.active : "transparent"}
      >
        <span style={{ fontSize: 15, color: t.muted, width: 18, textAlign: "center" }}>⚙</span>
        <div style={{ fontSize: 13, fontWeight: 500, color: t.textTert }}>Setări</div>
      </div>
    </nav>

    {/* User */}
    <div style={{ padding: 12, borderTop: `1px solid ${t.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 999, background: t.violet,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: t.textPri, flexShrink: 0,
        }}>DS</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.textSec, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>DORI SRL</div>
          <div style={{ fontSize: 10, color: t.textTert }}>dorisrl@yahoo.c…</div>
        </div>
        <span style={{ color: t.textTert, fontSize: 12 }}>⌄</span>
      </div>
    </div>
  </div>
);

// ─── Screen: Acasă (Dashboard) ───────────────────────────────────────────────
const ScreenHome = ({ onNavigate }) => (
  <div style={{ padding: "32px 40px", maxWidth: 860, margin: "0 auto" }}>
    {/* Page header */}
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: t.textTert, letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>
        DASHBOARD
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: t.textPri, margin: 0 }}>
            Starea conformității tale
          </h1>
          <p style={{ color: t.textSec, fontSize: 14, margin: "6px 0 0" }}>
            DORI SRL · GDPR, NIS2, AI Act, e-Factură
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Badge color={t.emerald} bg={t.emeraldBg}>● Control stabil</Badge>
          <Btn variant="secondary" small>Raport 1 pagină</Btn>
        </div>
      </div>
    </div>

    {/* PRIMARY ACTION — single, unmissable */}
    <div style={{
      background: `linear-gradient(135deg, ${t.amberBg}, transparent)`,
      border: `1px solid rgba(251,191,36,0.25)`,
      borderRadius: 12, padding: "18px 22px",
      display: "flex", alignItems: "center", gap: 16, marginBottom: 24,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: t.amberBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, flexShrink: 0,
      }}>⚠</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: t.amber, letterSpacing: "0.06em", marginBottom: 3 }}>
          ACȚIUNEA TA ACUM
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: t.textPri }}>
          5 finding-uri necesită rezolvare — 2 sunt critice
        </div>
        <div style={{ fontSize: 13, color: t.textSec, marginTop: 3 }}>
          Rezolvarea lor crește scorul cu ~14 puncte și închide 3 task-uri blocante.
        </div>
      </div>
      <Btn onClick={() => onNavigate("resolve")}>Rezolvă acum →</Btn>
    </div>

    {/* Score + Health row */}
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, marginBottom: 16 }}>
      {/* Score card */}
      <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ fontSize: 11, color: t.textTert, letterSpacing: "0.08em", marginBottom: 12 }}>SCOR GLOBAL</div>
        <div style={{ position: "relative", width: 80, height: 80 }}>
          <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="40" cy="40" r="32" fill="none" stroke={t.border} strokeWidth="6" />
            <circle cx="40" cy="40" r="32" fill="none" stroke={t.amber} strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 32 * 0.98} ${2 * Math.PI * 32}`}
              strokeLinecap="round" />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: t.textPri }}>98</span>
          </div>
        </div>
        <Badge color={t.emerald} bg={t.emeraldBg} size="sm" style={{ marginTop: 10 }}>OK</Badge>
      </Card>

      {/* Health check */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: t.textPri }}>Health Check</span>
          <Badge color={t.amber} bg={t.amberBg}>Atenție</Badge>
        </div>
        <Divider />
        {[
          { label: "Scanare activă", status: "ok", detail: "Ultima acum 2h" },
          { label: "DPA cu furnizori", status: "warn", detail: "2 furnizori fără DPA" },
          { label: "Politici interne", status: "ok", detail: "3 documente active" },
          { label: "NIS2 Assessment", status: "fail", detail: "Scor 42% — sub prag" },
          { label: "Inventar AI", status: "warn", detail: "1 sistem nedeclarat" },
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 18px",
            borderBottom: i < 4 ? `1px solid ${t.border}` : "none",
          }}>
            <Dot color={item.status === "ok" ? t.emerald : item.status === "warn" ? t.amber : t.red} />
            <span style={{ fontSize: 13, color: t.textSec, flex: 1 }}>{item.label}</span>
            <span style={{ fontSize: 12, color: t.textTert }}>{item.detail}</span>
          </div>
        ))}
      </Card>
    </div>

    {/* Framework scores */}
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px 10px" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.textPri }}>Readiness pe framework</span>
      </div>
      <Divider />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { name: "GDPR", score: 71, color: t.emerald },
          { name: "NIS2", score: 42, color: t.red },
          { name: "AI Act", score: 55, color: t.amber },
          { name: "e-Factură", score: 88, color: t.emerald },
        ].map((f, i) => (
          <div key={i} style={{
            padding: "16px 20px",
            borderRight: i < 3 ? `1px solid ${t.border}` : "none",
          }}>
            <div style={{ fontSize: 11, color: t.textTert, marginBottom: 8 }}>{f.name}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: f.color }}>{f.score}</div>
            <div style={{ marginTop: 8, height: 4, background: t.hover, borderRadius: 99 }}>
              <div style={{ height: "100%", width: `${f.score}%`, background: f.color, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

// ─── Screen: Scanează ────────────────────────────────────────────────────────
const ScreenScan = ({ onScanComplete }) => {
  const [step, setStep] = useState("select"); // select | upload | analyzing | done

  if (step === "analyzing") {
    setTimeout(() => setStep("done"), 1500);
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: t.textTert, letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>SCANARE</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: t.textPri, margin: 0 }}>Scanează un document</h1>
        <p style={{ color: t.textSec, fontSize: 14, margin: "6px 0 0" }}>
          Încarcă orice document — contract, politică, manifest tehnic.
        </p>
      </div>

      {step === "select" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.textTert, marginBottom: 10, letterSpacing: "0.04em" }}>
              CE VREI SĂ ANALIZEZI?
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { icon: "📄", label: "Document", sub: "PDF, Word, imagine", active: true },
                { icon: "✏️", label: "Text liber", sub: "Paste direct" },
                { icon: "📦", label: "Manifest tehnic", sub: "package.json, requirements.txt" },
                { icon: "⚙️", label: "YAML config", sub: "compliscan.yaml" },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                  background: s.active ? t.emeraldBg : t.card,
                  border: `1px solid ${s.active ? "rgba(52,211,153,0.3)" : t.border}`,
                  display: "flex", alignItems: "center", gap: 12,
                }}
                onClick={() => setStep("upload")}
                onMouseEnter={e => e.currentTarget.style.borderColor = t.borderMd}
                onMouseLeave={e => e.currentTarget.style.borderColor = s.active ? "rgba(52,211,153,0.3)" : t.border}
                >
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.active ? t.emerald : t.textPri }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: t.textTert }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {step === "upload" && (
        <Card style={{ marginBottom: 16 }}>
          <div
            onClick={() => setStep("analyzing")}
            style={{
              border: `2px dashed ${t.borderMd}`, borderRadius: 10,
              padding: "48px 24px", textAlign: "center", cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = t.emerald}
            onMouseLeave={e => e.currentTarget.style.borderColor = t.borderMd}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.textPri, marginBottom: 6 }}>
              Trage fișierul aici sau click pentru upload
            </div>
            <div style={{ fontSize: 12, color: t.textTert }}>PDF, DOCX, PNG, JPG · max 20MB</div>
            <div style={{ marginTop: 16 }}>
              <Btn onClick={() => setStep("analyzing")}>Simulează upload →</Btn>
            </div>
          </div>
        </Card>
      )}

      {step === "analyzing" && (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⊙</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: t.textPri, marginBottom: 8 }}>Analizez documentul…</div>
          <div style={{ fontSize: 13, color: t.textSec }}>Extrag text, detectez semnale, generez findings</div>
          <div style={{ marginTop: 20, height: 4, background: t.hover, borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", background: t.emerald, borderRadius: 99,
              animation: "progress 1.4s ease-in-out forwards",
              width: "0%",
            }} />
          </div>
          <style>{`@keyframes progress { to { width: 90%; } }`}</style>
        </Card>
      )}

      {step === "done" && (
        <div>
          {/* Success banner */}
          <div style={{
            background: t.emeraldBg, border: `1px solid rgba(52,211,153,0.25)`,
            borderRadius: 10, padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          }}>
            <span style={{ fontSize: 18, color: t.emerald }}>✓</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.textPri }}>Analiza finalizată</div>
              <div style={{ fontSize: 12, color: t.textSec }}>Contract furnizor IT · 8 findings detectate</div>
            </div>
          </div>

          {/* Findings preview */}
          <div style={{ fontSize: 12, fontWeight: 600, color: t.textTert, marginBottom: 10, letterSpacing: "0.04em" }}>
            FINDING-URI DETECTATE
          </div>
          {[
            { sev: "CRITIC", color: t.red, bg: t.redBg, title: "Lipsă DPA cu furnizor IT principal", framework: "GDPR", action: true },
            { sev: "CRITIC", color: t.red, bg: t.redBg, title: "Registru activități prelucrare neactualizat", framework: "GDPR", action: true },
            { sev: "RIDICAT", color: t.amber, bg: t.amberBg, title: "Sistem AI nedeclarat în inventar", framework: "AI Act" },
            { sev: "MEDIU", color: t.textTert, bg: t.hover, title: "Clauze de securitate insuficiente în contract", framework: "NIS2" },
            { sev: "MEDIU", color: t.textTert, bg: t.hover, title: "Lipsă mențiune obligație notificare incident", framework: "NIS2" },
          ].map((f, i) => (
            <div key={i} style={{
              background: t.card, border: `1px solid ${t.border}`,
              borderRadius: 10, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 12, marginBottom: 8,
            }}>
              <Badge color={f.color} bg={f.bg}>{f.sev}</Badge>
              <span style={{ fontSize: 13, color: t.textSec, flex: 1 }}>{f.title}</span>
              <Badge color={t.textTert} bg={t.hover}>{f.framework}</Badge>
              {f.action && <Btn variant="secondary" small onClick={onScanComplete}>Rezolvă →</Btn>}
            </div>
          ))}

          {/* CTA */}
          <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
            <Btn onClick={onScanComplete}>Adaugă toate în queue →</Btn>
            <Btn variant="secondary">Descarcă raport</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Screen: De Rezolvat ─────────────────────────────────────────────────────
const ScreenResolve = () => {
  const [expanded, setExpanded] = useState(null);

  const findings = [
    {
      id: 1, sev: "CRITIC", color: t.red, bg: t.redBg,
      title: "Lipsă DPA cu furnizor IT principal",
      framework: "GDPR", art: "Art. 28",
      status: "pendingReview", statusColor: t.violet, statusBg: t.violetBg, statusLabel: "De revizuit",
      age: "acum 2h",
      steps: [
        { n: 1, label: "Problemă", done: true, text: "Nu există acord de prelucrare date (DPA) semnat cu furnizorul IT principal." },
        { n: 2, label: "Impact", done: true, text: "Risc amendă GDPR Art. 28 — până la 10M € sau 2% cifră de afaceri." },
        { n: 3, label: "Acțiune", done: false, text: "Generează DPA și trimite spre semnare furnizorului." },
        { n: 4, label: "Document generat", done: false, text: "DPA template pre-completat — necesită revizie manuală." },
        { n: 5, label: "Pas uman", done: false, text: "Verifică datele furnizorului și semnează." },
        { n: 6, label: "Dovadă", done: false, text: "Încarcă DPA-ul semnat scanat." },
        { n: 7, label: "Revalidare", done: false, text: "La expirare (12 luni)." },
      ],
    },
    {
      id: 2, sev: "CRITIC", color: t.red, bg: t.redBg,
      title: "Registru activități prelucrare neactualizat",
      framework: "GDPR", art: "Art. 30",
      status: "detected", statusColor: t.amber, statusBg: t.amberBg, statusLabel: "Detectat",
      age: "acum 3h",
    },
    {
      id: 3, sev: "RIDICAT", color: t.amber, bg: t.amberBg,
      title: "Sistem AI nedeclarat în inventar (GitHub Copilot)",
      framework: "AI Act", art: "Art. 52",
      status: "detected", statusColor: t.amber, statusBg: t.amberBg, statusLabel: "Detectat",
      age: "acum 3h",
    },
    {
      id: 4, sev: "MEDIU", color: t.textTert, bg: t.hover,
      title: "Maturitate NIS2 insuficientă — Criptografie (25%)",
      framework: "NIS2", art: "Art. 21(2)(h)",
      status: "pendingReview", statusColor: t.violet, statusBg: t.violetBg, statusLabel: "De revizuit",
      age: "acum 1z",
    },
    {
      id: 5, sev: "MEDIU", color: t.textTert, bg: t.hover,
      title: "Înregistrare DNSC obligatorie neefectuată",
      framework: "NIS2", art: "—",
      status: "escalated", statusColor: t.violet, statusBg: "rgba(167,139,250,0.20)", statusLabel: "Escaladat",
      age: "expirat sept. 2025",
    },
  ];

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: t.textTert, letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>
          QUEUE DE REZOLVARE
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: t.textPri, margin: 0 }}>De rezolvat</h1>
            <p style={{ color: t.textSec, fontSize: 14, margin: "6px 0 0" }}>
              Toate finding-urile, task-urile și drift-urile — într-un singur loc, prioritizate.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Badge color={t.red} bg={t.redBg}>2 critice</Badge>
            <Badge color={t.amber} bg={t.amberBg}>2 ridicate</Badge>
            <Badge color={t.textTert} bg={t.hover}>1 medie</Badge>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {["Toate (5)", "GDPR (2)", "NIS2 (2)", "AI Act (1)"].map((tab, i) => (
          <div key={i} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: "pointer",
            background: i === 0 ? t.active : "transparent",
            color: i === 0 ? t.textPri : t.textTert,
            border: `1px solid ${i === 0 ? t.borderMd : "transparent"}`,
          }}>{tab}</div>
        ))}
      </div>

      {/* Findings */}
      {findings.map((f) => {
        const isOpen = expanded === f.id;
        return (
          <div key={f.id} style={{
            background: t.card, border: `1px solid ${isOpen ? t.borderMd : t.border}`,
            borderRadius: 12, marginBottom: 8, overflow: "hidden",
            transition: "border-color 0.15s",
          }}>
            {/* Row */}
            <div
              onClick={() => setExpanded(isOpen ? null : f.id)}
              style={{
                padding: "14px 18px", display: "flex", alignItems: "center",
                gap: 12, cursor: "pointer",
              }}
              onMouseEnter={e => e.currentTarget.style.background = t.hover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Badge color={f.color} bg={f.bg}>{f.sev}</Badge>
              <span style={{ fontSize: 13, fontWeight: 500, color: t.textPri, flex: 1 }}>{f.title}</span>
              <Badge color={t.textTert} bg={t.hover}>{f.framework}</Badge>
              <span style={{ fontSize: 11, color: t.textTert, minWidth: 80, textAlign: "right" }}>{f.age}</span>
              <Badge color={f.statusColor} bg={f.statusBg}>{f.statusLabel}</Badge>
              <span style={{ color: t.textTert, fontSize: 12, marginLeft: 4 }}>{isOpen ? "▲" : "▼"}</span>
            </div>

            {/* Resolution Layer */}
            {isOpen && f.steps && (
              <div style={{ borderTop: `1px solid ${t.border}`, padding: "20px 20px 20px 18px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textTert, letterSpacing: "0.06em", marginBottom: 16 }}>
                  RESOLUTION LAYER · {f.art}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {f.steps.map((step, si) => (
                    <div key={si} style={{ display: "flex", gap: 14, paddingBottom: si < f.steps.length - 1 ? 16 : 0 }}>
                      {/* Stepper indicator */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 999,
                          background: step.done ? t.emeraldBg : t.hover,
                          border: `1px solid ${step.done ? "rgba(52,211,153,0.4)" : t.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700,
                          color: step.done ? t.emerald : t.textTert,
                          flexShrink: 0,
                        }}>{step.done ? "✓" : step.n}</div>
                        {si < f.steps.length - 1 && (
                          <div style={{ flex: 1, width: 1, background: t.border, minHeight: 12, marginTop: 4 }} />
                        )}
                      </div>
                      <div style={{ paddingTop: 2, flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: step.done ? t.emerald : t.textTert, marginBottom: 3 }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: 13, color: step.done ? t.textTert : t.textSec }}>{step.text}</div>
                        {!step.done && si === 2 && (
                          <div style={{ marginTop: 10 }}>
                            <Btn small>Generează DPA →</Btn>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expanded — no steps (simple) */}
            {isOpen && !f.steps && (
              <div style={{ borderTop: `1px solid ${t.border}`, padding: "16px 18px" }}>
                <div style={{ fontSize: 13, color: t.textSec, marginBottom: 12 }}>
                  Finding detectat automat. Revizuiește și confirmă sau respinge.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn small>Pornește remediere →</Btn>
                  <Btn variant="secondary" small>Respinge</Btn>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Screen: Rapoarte ────────────────────────────────────────────────────────
const ScreenReports = () => (
  <div style={{ padding: "32px 40px", maxWidth: 800, margin: "0 auto" }}>
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: t.textTert, letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>RAPOARTE</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: t.textPri, margin: 0 }}>Dovezi & Export</h1>
      <p style={{ color: t.textSec, fontSize: 14, margin: "6px 0 0" }}>Auditor Vault, rapoarte executive, log audit.</p>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {[
        { icon: "📦", title: "Audit Pack ZIP", sub: "Toate dovezile + mappings legale", cta: "Generează", color: t.emerald },
        { icon: "📋", title: "Raport 1 pagină", sub: "Rezumat executiv pentru management", cta: "Descarcă PDF", color: t.blue },
        { icon: "🔒", title: "Auditor Vault", sub: "Acces securizat pentru auditor extern", cta: "Configurează", color: t.violet },
        { icon: "📝", title: "Log Audit", sub: "Istoric complet al acțiunilor", cta: "Vezi log", color: t.textTert },
      ].map((r, i) => (
        <Card key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>{r.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.textPri, marginBottom: 3 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: t.textTert }}>{r.sub}</div>
          </div>
          <Btn small>{r.cta}</Btn>
        </Card>
      ))}
    </div>
  </div>
);

// ─── Screen: placeholder ─────────────────────────────────────────────────────
const ScreenPlaceholder = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: t.textTert, fontSize: 14 }}>
    {label} — în construcție
  </div>
);

// ─── Annotation overlay ──────────────────────────────────────────────────────
const ANNOTATIONS = {
  home: [
    { pos: { top: 72, left: 240 }, text: "1 singur CTA primar — nu se poate rata" },
    { pos: { top: 200, left: 240 }, text: "Score + Health pe același rând" },
    { pos: { top: 320, left: 240 }, text: "Framework scores — informativ, nu acționabil" },
  ],
  scan: [
    { pos: { top: 120, left: 240 }, text: "Source type selectat vizual, nu dropdown ascuns" },
    { pos: { top: 340, left: 240 }, text: "Post-scan → findings imediate cu 'Rezolvă →' inline" },
    { pos: { top: 440, left: 240 }, text: "CTA principal: adaugă tot în queue (nu naviga manual)" },
  ],
  resolve: [
    { pos: { top: 72, left: 240 }, text: "Toate finding-urile indiferent de framework" },
    { pos: { top: 160, left: 240 }, text: "Filter tabs — nu nav items separate" },
    { pos: { top: 280, left: 240 }, text: "Resolution Layer in-line, nu pagină separată" },
    { pos: { top: 440, left: 240 }, text: "Stepper arată exact unde ești și ce urmează" },
  ],
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [showAnnotations, setShowAnnotations] = useState(true);

  const renderScreen = () => {
    switch (screen) {
      case "home":    return <ScreenHome onNavigate={setScreen} />;
      case "scan":    return <ScreenScan onScanComplete={() => setScreen("resolve")} />;
      case "resolve": return <ScreenResolve />;
      case "reports": return <ScreenReports />;
      default:        return <ScreenPlaceholder label={screen} />;
    }
  };

  return (
    <div style={{
      fontFamily: "'Inter', 'ui-sans-serif', system-ui, sans-serif",
      background: t.canvas, minHeight: "100vh", color: t.textPri,
    }}>
      {/* Top meta bar */}
      <div style={{
        background: t.panel, borderBottom: `1px solid ${t.border}`,
        padding: "8px 16px", display: "flex", alignItems: "center", gap: 12,
        fontSize: 11, color: t.textTert,
      }}>
        <span style={{ fontWeight: 700, color: t.textSec }}>CompliScan — UX Wireframe Redesign</span>
        <span>·</span>
        <span>Navighează între ecrane din sidebar</span>
        <span style={{ flex: 1 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={showAnnotations} onChange={e => setShowAnnotations(e.target.checked)} />
          <span>Arată adnotări UX</span>
        </label>
        <span>·</span>
        <span style={{ color: t.emerald }}>● Flux: Acasă → Scanează → De rezolvat</span>
      </div>

      {/* Layout */}
      <div style={{ display: "flex", height: "calc(100vh - 37px)" }}>
        <Sidebar active={screen} onChange={setScreen} />

        {/* Main content */}
        <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          {renderScreen()}

          {/* Annotations */}
          {showAnnotations && ANNOTATIONS[screen] && (
            <div style={{ pointerEvents: "none" }}>
              {ANNOTATIONS[screen].map((a, i) => (
                <div key={i} style={{
                  position: "absolute", top: a.pos.top, left: a.pos.left,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 999,
                    background: t.violet, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{
                    background: "rgba(167,139,250,0.15)",
                    border: `1px solid rgba(167,139,250,0.35)`,
                    borderRadius: 6, padding: "4px 10px",
                    fontSize: 11, color: t.violet, whiteSpace: "nowrap",
                  }}>{a.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
