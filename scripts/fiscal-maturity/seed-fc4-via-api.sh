#!/bin/bash
# Seed FC-4 via API (flush cache + write filingRecords + orgProfile).
# Necesită dev server pe localhost:3000 + COMPLISCAN_SESSION_SECRET în env.

set -euo pipefail

if [ -z "${COMPLISCAN_SESSION_SECRET:-}" ]; then
  echo "ERROR: export COMPLISCAN_SESSION_SECRET first"
  exit 1
fi

cd "$(dirname "$0")/../.."

SESSION=$(npx tsx scripts/fiscal-maturity/make-session.ts | tail -1)
echo "Generated session for vaduvadaniel10@yahoo.com (org-96d5827110b0fb7f)"

# JSON payload cu filingRecords + orgProfile.vatFrequency
PATCH_JSON=$(cat <<'EOF'
{
  "patch": {
    "filingRecords": [
      { "id": "filing-d300-2026-01", "type": "d300_tva", "period": "2026-01", "status": "on_time",  "dueISO": "2026-02-25T00:00:00.000Z", "filedAtISO": "2026-02-24T00:00:00.000Z", "note": "Depunere normală." },
      { "id": "filing-d300-2026-02", "type": "d300_tva", "period": "2026-02", "status": "late",     "dueISO": "2026-03-25T00:00:00.000Z", "filedAtISO": "2026-04-02T00:00:00.000Z", "rectificationCount": 0, "note": "Întârziere 8 zile." },
      { "id": "filing-d300-2026-03", "type": "d300_tva", "period": "2026-03", "status": "late",     "dueISO": "2026-04-25T00:00:00.000Z", "filedAtISO": "2026-05-15T00:00:00.000Z", "rectificationCount": 1, "note": "Întârziere 20 zile + rectificare." },
      { "id": "filing-d300-2025-12", "type": "d300_tva", "period": "2025-12", "status": "missing",  "dueISO": "2026-01-25T00:00:00.000Z", "note": "NEDEPUSĂ — urgent." },
      { "id": "filing-saft-2026-Q1", "type": "saft",     "period": "2026-Q1", "status": "late",    "dueISO": "2026-04-25T00:00:00.000Z", "filedAtISO": "2026-04-27T00:00:00.000Z", "note": "SAF-T cu 2 zile întârziere." },
      { "id": "filing-d390-2026-01", "type": "d390_recap","period": "2026-01", "status": "on_time", "dueISO": "2026-02-25T00:00:00.000Z", "filedAtISO": "2026-02-25T00:00:00.000Z" },
      { "id": "filing-d300-2026-05", "type": "d300_tva", "period": "2026-05", "status": "upcoming","dueISO": "2026-06-25T00:00:00.000Z" }
    ],
    "orgProfile": {
      "vatFrequency": "monthly"
    }
  }
}
EOF
)

echo "POSTing seed patch..."
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: compliscan_session=$SESSION" \
  -d "$PATCH_JSON" \
  http://localhost:3000/api/dev/seed-state)

echo "$RESPONSE" | python3 -m json.tool
echo ""
echo "✓ Seed applied. Now POSTing cross-correlation..."

XCORR=$(curl -s -X POST \
  -H "Cookie: compliscan_session=$SESSION" \
  http://localhost:3000/api/fiscal/cross-correlation)

echo "$XCORR" | python3 -c "
import json, sys
data = json.load(sys.stdin)
report = data['report']
print('Total checks:', report['summary']['totalChecks'])
print('Errors:', report['summary']['errors'])
print('Warnings:', report['summary']['warnings'])
print('OK:', report['summary']['ok'])
print()
print('By rule:')
for rule, counts in report['summary']['byRule'].items():
    print(f'  {rule}: ok={counts[\"ok\"]}, warn={counts[\"warning\"]}, err={counts[\"error\"]}, info={counts[\"info\"]}')
print()
print('R6+R7 findings:')
for f in report['findings']:
    if f['rule'] in ('R6', 'R7'):
        imp = f.get('economicImpact', {})
        max_ron = imp.get('totalCostMaxRON', 0)
        print(f'  [{f[\"rule\"]}/{f[\"severity\"]}] {f[\"title\"]}')
        if max_ron:
            print(f'      → max impact: {max_ron} RON')
"
