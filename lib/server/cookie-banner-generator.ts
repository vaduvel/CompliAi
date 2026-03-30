/**
 * Cookie Banner Generator
 *
 * Generates a self-contained HTML/CSS/JS consent banner snippet
 * based on trackers detected via site scan. Copy-paste ready.
 */

export type BannerTrackerInput = {
  name: string
  category: "analytics" | "advertising" | "social" | "support" | "cdn" | "payment"
  requiresConsent: boolean
}

export type BannerCategory = {
  id: "necessary" | "analytics" | "advertising" | "functional"
  label: string
  description: string
  required: boolean
  trackers: string[]
}

export type CookieBannerInput = {
  orgName: string
  orgWebsite?: string | null
  dpoEmail?: string | null
  privacyPolicyUrl?: string | null
  trackers: BannerTrackerInput[]
}

export type CookieBannerResult = {
  html: string
  categories: BannerCategory[]
  trackerCount: number
  hasConsentRequired: boolean
}

// ── Category mapping ──────────────────────────────────────────────────────────

function buildCategories(trackers: BannerTrackerInput[]): BannerCategory[] {
  const consentTrackers = trackers.filter((t) => t.requiresConsent)

  const analyticsTrackers = consentTrackers
    .filter((t) => t.category === "analytics")
    .map((t) => t.name)

  const advertisingTrackers = consentTrackers
    .filter((t) => t.category === "advertising")
    .map((t) => t.name)

  const functionalTrackers = consentTrackers
    .filter((t) => t.category === "social" || t.category === "support" || t.category === "payment")
    .map((t) => t.name)

  const categories: BannerCategory[] = [
    {
      id: "necessary",
      label: "Strict necesare",
      description: "Cookie-uri esențiale pentru funcționarea site-ului. Nu pot fi dezactivate.",
      required: true,
      trackers: [],
    },
  ]

  if (analyticsTrackers.length > 0) {
    categories.push({
      id: "analytics",
      label: "Analiză și performanță",
      description: `Statistici despre modul în care vizitatorii folosesc site-ul (${analyticsTrackers.join(", ")}).`,
      required: false,
      trackers: analyticsTrackers,
    })
  }

  if (advertisingTrackers.length > 0) {
    categories.push({
      id: "advertising",
      label: "Marketing și publicitate",
      description: `Cookie-uri de remarketing și publicitate țintită (${advertisingTrackers.join(", ")}).`,
      required: false,
      trackers: advertisingTrackers,
    })
  }

  if (functionalTrackers.length > 0) {
    categories.push({
      id: "functional",
      label: "Funcționale",
      description: `Funcționalități îmbunătățite: chat live, hărți, integrări sociale (${functionalTrackers.join(", ")}).`,
      required: false,
      trackers: functionalTrackers,
    })
  }

  return categories
}

// ── HTML snippet builder ──────────────────────────────────────────────────────

export function generateCookieBannerSnippet(input: CookieBannerInput): CookieBannerResult {
  const categories = buildCategories(input.trackers)
  const consentRequired = input.trackers.some((t) => t.requiresConsent)
  const privacyUrl = input.privacyPolicyUrl ?? "#politica-confidentialitate"

  const optionalCategories = categories.filter((c) => !c.required)

  const categoriesJson = JSON.stringify(
    optionalCategories.map((c) => ({ id: c.id, label: c.label }))
  )

  const togglesHtml = optionalCategories
    .map(
      (c) => `
        <div class="cc-toggle-row">
          <div class="cc-toggle-info">
            <span class="cc-toggle-label">${c.label}</span>
            <span class="cc-toggle-desc">${c.description}</span>
          </div>
          <label class="cc-switch">
            <input type="checkbox" id="cc-toggle-${c.id}" data-cat="${c.id}" checked />
            <span class="cc-slider"></span>
          </label>
        </div>`
    )
    .join("")

  const html = `<!-- CompliAI Cookie Banner — generat pentru ${input.orgName} -->
<style>
  #cc-banner,#cc-prefs{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.5;color:#1a1a1a}
  #cc-banner{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#fff;border-top:1px solid #e5e7eb;box-shadow:0 -4px 24px rgba(0,0,0,.08);padding:16px 20px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;transition:transform .3s ease}
  #cc-banner.cc-hidden{transform:translateY(100%)}
  #cc-banner-text{flex:1;min-width:200px;color:#374151;font-size:13px}
  #cc-banner-text a{color:#2563eb;text-decoration:underline}
  #cc-banner-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .cc-btn{padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:500;transition:opacity .15s}
  .cc-btn:hover{opacity:.85}
  .cc-btn-primary{background:#2563eb;color:#fff}
  .cc-btn-secondary{background:#f3f4f6;color:#374151;border:1px solid #d1d5db}
  .cc-btn-link{background:none;color:#6b7280;font-size:12px;text-decoration:underline;padding:4px 8px}
  #cc-prefs{position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.5);padding:16px}
  #cc-prefs.cc-hidden{display:none}
  #cc-prefs-panel{background:#fff;border-radius:16px 16px 0 0;width:100%;max-width:520px;padding:24px;max-height:80vh;overflow-y:auto}
  #cc-prefs-panel h3{margin:0 0 4px;font-size:17px;font-weight:600}
  #cc-prefs-panel p{margin:0 0 20px;color:#6b7280;font-size:13px}
  .cc-toggle-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #f3f4f6}
  .cc-toggle-row:last-of-type{border-bottom:none}
  .cc-toggle-info{flex:1}
  .cc-toggle-label{display:block;font-weight:500;font-size:13px;color:#111}
  .cc-toggle-desc{display:block;font-size:12px;color:#9ca3af;margin-top:2px}
  .cc-switch{position:relative;width:40px;height:22px;flex-shrink:0}
  .cc-switch input{opacity:0;width:0;height:0;position:absolute}
  .cc-slider{position:absolute;inset:0;background:#d1d5db;border-radius:22px;cursor:pointer;transition:.2s}
  .cc-slider:before{content:'';position:absolute;height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s}
  .cc-switch input:checked+.cc-slider{background:#2563eb}
  .cc-switch input:checked+.cc-slider:before{transform:translateX(18px)}
  .cc-switch input:disabled+.cc-slider{background:#93c5fd;cursor:default}
  #cc-prefs-actions{display:flex;gap:8px;margin-top:20px;justify-content:flex-end}
  @media(max-width:480px){#cc-banner{flex-direction:column;align-items:stretch}#cc-banner-actions{flex-direction:column}#cc-prefs-actions{flex-direction:column}}
</style>

<div id="cc-banner" class="cc-hidden" role="dialog" aria-label="Consimțământ cookie-uri">
  <p id="cc-banner-text">
    Folosim cookie-uri pentru a îmbunătăți experiența dvs. pe <strong>${input.orgName}</strong>.
    Unele cookie-uri sunt esențiale, altele ne ajută să înțelegem cum folosiți site-ul.
    <a href="${privacyUrl}" target="_blank" rel="noopener">Politică de confidențialitate</a>
  </p>
  <div id="cc-banner-actions">
    <button class="cc-btn cc-btn-primary" onclick="compliCC.acceptAll()">Acceptă tot</button>
    <button class="cc-btn cc-btn-secondary" onclick="compliCC.acceptNecessary()">Doar necesare</button>
    ${optionalCategories.length > 0 ? '<button class="cc-btn cc-btn-link" onclick="compliCC.openPrefs()">Personalizează</button>' : ""}
  </div>
</div>

<div id="cc-prefs" class="cc-hidden" role="dialog" aria-modal="true" aria-label="Preferințe cookie-uri">
  <div id="cc-prefs-panel">
    <h3>Preferințe cookie-uri</h3>
    <p>Alegeți ce categorii de cookie-uri acceptați. Cookie-urile strict necesare nu pot fi dezactivate.</p>
    <div id="cc-toggles">
      <div class="cc-toggle-row">
        <div class="cc-toggle-info">
          <span class="cc-toggle-label">Strict necesare</span>
          <span class="cc-toggle-desc">Esențiale pentru funcționarea site-ului. Nu pot fi dezactivate.</span>
        </div>
        <label class="cc-switch"><input type="checkbox" checked disabled /><span class="cc-slider"></span></label>
      </div>
      ${togglesHtml}
    </div>
    <div id="cc-prefs-actions">
      <button class="cc-btn cc-btn-secondary" onclick="compliCC.closePrefs()">Anulează</button>
      <button class="cc-btn cc-btn-primary" onclick="compliCC.savePrefs()">Salvează preferințele</button>
    </div>
  </div>
</div>

<script>
(function(){
  var STORAGE_KEY = 'cc_consent_v1';
  var CATEGORIES = ${categoriesJson};

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch(e) { return null; }
  }

  function setConsent(accepted) {
    var data = { accepted: accepted, timestamp: new Date().toISOString(), version: 1 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    document.dispatchEvent(new CustomEvent('cc:consent', { detail: data }));
  }

  window.compliCC = {
    hasConsent: function(cat) {
      if (cat === 'necessary') return true;
      var c = getConsent();
      return c && c.accepted && c.accepted.indexOf(cat) !== -1;
    },
    acceptAll: function() {
      setConsent(CATEGORIES.map(function(c){ return c.id; }).concat(['necessary']));
      document.getElementById('cc-banner').classList.add('cc-hidden');
    },
    acceptNecessary: function() {
      setConsent(['necessary']);
      document.getElementById('cc-banner').classList.add('cc-hidden');
    },
    openPrefs: function() {
      document.getElementById('cc-prefs').classList.remove('cc-hidden');
    },
    closePrefs: function() {
      document.getElementById('cc-prefs').classList.add('cc-hidden');
    },
    savePrefs: function() {
      var accepted = ['necessary'];
      document.querySelectorAll('#cc-toggles input[data-cat]').forEach(function(el) {
        if (el.checked) accepted.push(el.getAttribute('data-cat'));
      });
      setConsent(accepted);
      document.getElementById('cc-prefs').classList.add('cc-hidden');
      document.getElementById('cc-banner').classList.add('cc-hidden');
    },
    reset: function() {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  };

  // Show banner if no consent stored
  if (!getConsent()) {
    setTimeout(function() {
      document.getElementById('cc-banner').classList.remove('cc-hidden');
    }, 300);
  }

  // Close prefs on overlay click
  document.getElementById('cc-prefs').addEventListener('click', function(e) {
    if (e.target === this) window.compliCC.closePrefs();
  });
})();
</script>
<!-- Sfârşit Cookie Banner — ${new Date().toISOString().slice(0, 10)} -->`.trim()

  return {
    html,
    categories,
    trackerCount: input.trackers.length,
    hasConsentRequired: consentRequired,
  }
}
