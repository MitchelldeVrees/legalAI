#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${SMOKE_BASE_URL:-http://localhost:3000}"
CHECKLIST_PATH="SMOKE_TEST_CHECKLIST.md"

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required for smoke tests."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is required for smoke tests."
  exit 1
fi

line() {
  echo "------------------------------------------------------------"
}

pause() {
  local prompt="${1:-Press Enter to continue...}"
  read -r -p "$prompt" _ || true
}

check_url() {
  local url="$1"
  local expected="${2:-200}"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)"
  if [[ "$code" == "$expected" ]]; then
    echo "OK: $url -> $code"
  else
    echo "WARN: $url -> $code (expected $expected)"
  fi
}

mark() {
  local label="$1"
  read -r -p "$label [y/n]: " answer || answer="n"
  local normalized
  normalized="$(printf "%s" "$answer" | tr '[:upper:]' '[:lower:]')"
  case "$normalized" in
    y|yes) echo "PASS - $label" ;;
    *) echo "FAIL - $label" ;;
  esac
}

validate_metrics_payload() {
  local payload="$1"
  METRICS_JSON="$payload" node -e '
    const raw = process.env.METRICS_JSON || "";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("FAIL: /api/ops/metrics did not return valid JSON.");
      process.exit(1);
    }
    const required = [
      ["requests", "error_rate"],
      ["requests", "p95_latency_ms"],
      ["openai", "estimated_cost_usd"],
      ["monthly_cost_projection", "projection", "total_estimated_monthly_cost_usd"]
    ];
    for (const path of required) {
      let cur = parsed;
      for (const key of path) {
        cur = cur?.[key];
      }
      if (typeof cur === "undefined") {
        console.error(`FAIL: Missing metrics field: ${path.join(".")}`);
        process.exit(1);
      }
    }
    console.log("OK: /api/ops/metrics payload looks valid.");
  '
}

echo
line
echo "LegalAI Local Smoke Test Runner"
line
echo "Base URL: $BASE_URL"
echo "Checklist: $CHECKLIST_PATH"
echo

if [[ ! -f "$CHECKLIST_PATH" ]]; then
  echo "Warning: $CHECKLIST_PATH not found in current directory."
fi

echo "Step 1: Checking local server availability..."
check_url "$BASE_URL/login"
check_url "$BASE_URL/signup"
check_url "$BASE_URL/jurispudentie-search"
check_url "$BASE_URL/vraag-stellen"
echo
echo "If routes are not reachable, start your app first:"
echo "  npm run dev"
pause

line
echo "Step 2: Manual auth flow"
echo "Open in browser:"
echo "  $BASE_URL/signup"
echo "  $BASE_URL/login"
echo "Complete: signup -> login -> magic link -> dashboard -> logout"
echo
mark "Signup flow works"
mark "Magic link login works"
mark "Logout redirects to home and blocks /dashboard without session"
pause

line
echo "Step 3: Manual AI flow"
echo "Run these pages in browser:"
echo "  $BASE_URL/jurispudentie-search"
echo "  $BASE_URL/vraag-stellen"
echo "Use a query from EXAMPLE_QUESTIONS.md."
echo
mark "Search returns ECLI results"
mark "Generate answer works"
mark "Answer shows source ECLI chips"
pause

line
echo "Step 4: Browser matrix"
echo "Run the same checks in Chrome, Safari, Edge, and mobile viewports."
mark "Chrome desktop sanity pass"
mark "Safari desktop sanity pass"
mark "Edge desktop sanity pass"
mark "Mobile responsive sanity pass (390x844 and 360x800)"
pause

line
echo "Step 5: Ops metrics validation"
if [[ -z "${OPS_DASHBOARD_TOKEN:-}" ]]; then
  read -r -p "Enter OPS dashboard token (or leave empty to skip): " INPUT_TOKEN || INPUT_TOKEN=""
  OPS_TOKEN="$INPUT_TOKEN"
else
  OPS_TOKEN="$OPS_DASHBOARD_TOKEN"
fi

if [[ -z "$OPS_TOKEN" ]]; then
  echo "Skipped metrics validation (no token provided)."
else
  METRICS_RESPONSE="$(curl -sS -H "x-ops-token: $OPS_TOKEN" "$BASE_URL/api/ops/metrics" || true)"
  validate_metrics_payload "$METRICS_RESPONSE"
  echo "Metrics snapshot:"
  echo "$METRICS_RESPONSE" | node -e '
    const fs = require("fs");
    const raw = fs.readFileSync(0, "utf8");
    try {
      const data = JSON.parse(raw);
      const out = {
        generated_at: data.generated_at,
        request_total: data.requests?.total,
        request_error_rate: data.requests?.error_rate,
        p95_latency_ms: data.requests?.p95_latency_ms,
        openai_estimated_cost_usd: data.openai?.estimated_cost_usd,
        monthly_estimated_cost_usd:
          data.monthly_cost_projection?.projection?.total_estimated_monthly_cost_usd
      };
      console.log(JSON.stringify(out, null, 2));
    } catch {
      console.log(raw);
    }
  '
fi

line
echo "Smoke run complete."
echo "Use $CHECKLIST_PATH to store final PASS/FAIL sign-off."
line
