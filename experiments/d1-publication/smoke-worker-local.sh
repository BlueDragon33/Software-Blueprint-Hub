#!/usr/bin/env bash
set -euo pipefail
mode="${1:-}"
if [[ $# -gt 1 || ( $# -eq 1 && "$mode" != "--anonymous-only" ) ]]; then
  echo "Usage: $0 [--anonymous-only]" >&2; exit 2
fi
root="$(git rev-parse --show-toplevel)"
cd "$root"
config="$root/apps/web/dist/server/wrangler.json"
tools="$root/experiments/d1-publication/node_modules"
schema="$root/packages/persistence/d1/migrations/0001_candidate_schema.sql"
# Repeat the safe identity guard before executing ANY local SQL.
node experiments/d1-publication/verify-worker-bundle.mjs
persist="$(mktemp -d "$RUNNER_TEMP/blueprint-d1-smoke.XXXXXXXX")"
pid=""
cleanup(){ if [ -n "$pid" ]; then kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true; fi; rm -rf -- "$persist"; }
trap cleanup EXIT
unset CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
export CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV=false
"$tools/.bin/wrangler" d1 execute BLUEPRINT_CANONICAL_DB --local --config "$config" --persist-to "$persist" --file "$schema" --yes
"$tools/.bin/wrangler" dev --local --config "$config" --persist-to "$persist" --ip 127.0.0.1 --port 8787 >"$persist/worker.log" 2>&1 &
pid=$!
ready=0
for attempt in $(seq 1 30); do
  if ! kill -0 "$pid" 2>/dev/null; then break; fi
  if ! grep -Fq "Ready on http://127.0.0.1:8787" "$persist/worker.log"; then sleep 1; continue; fi
  if status=$(curl --silent --max-time 3 --output "$persist/readiness.html" --write-out "%{http_code}" http://127.0.0.1:8787/professional-review/readiness); then
    if [ "$status" != 200 ]; then
      echo "FULL_APP_READINESS_HTTP=$status"
      if grep -Fxq "Canonical persistence unavailable" "$persist/readiness.html"; then echo "FULL_APP_HOST_GATE_DENIED"; else echo "FULL_APP_OTHER_HTTP_BODY"; fi
      sleep 1
      tail -100 "$persist/worker.log"; exit 1
    fi
    ready=1; break
  fi
  sleep 1
done
if [ "$ready" != 1 ]; then tail -100 "$persist/worker.log"; exit 1; fi
grep -Fq 'D1 accepted a readiness query.' "$persist/readiness.html" || { echo "D1 readiness response failed"; tail -100 "$persist/worker.log"; exit 1; }
grep -Fq 'Authority bootstrap and human-review decision tables are present.' "$persist/readiness.html"
curl --silent --fail --max-time 10 http://127.0.0.1:8787/constitution > "$persist/constitution.html"
grep -Fq 'System Owner authentication required' "$persist/constitution.html"
grep -Fq '1.3.0' "$persist/constitution.html"
echo "ACTUAL_FULL_APP_WORKER_D1_SMOKE_PASS $EXPECTED_CANDIDATE_REVISION"
if [[ "$mode" == "--anonymous-only" ]]; then
  echo "ANONYMOUS_LOCAL_SMOKE_ONLY; BROWSER_FIXTURE_NOT_REQUESTED"
  exit 0
fi

# The existing anonymous smoke must have passed before browser fixture writes.
# Fresh local DB only, no remote IDs or auth tokens. E2E JWTs are isolated fixtures.
kill "$pid"; wait "$pid" 2>/dev/null || true; pid=""
node experiments/d1-publication/verify-worker-bundle.mjs
"$tools/.bin/wrangler" d1 execute BLUEPRINT_CANONICAL_DB --local --config "$config" --persist-to "$persist" --file "$root/experiments/d1-publication/e2e-d1-fixture.sql" --yes
export AUTH_SECRET="p6-e2e-auth-secret-2026-blueprint-os-registry"
export BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH=true
"$tools/.bin/wrangler" dev --local --config "$config" --persist-to "$persist" --ip 127.0.0.1 --port 3000 \
 --var AUTH_SECRET:"$AUTH_SECRET" \
 --var BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH:true \
 --var BLUEPRINT_OWNER_BOOTSTRAP_PROVIDER:github \
 --var BLUEPRINT_OWNER_BOOTSTRAP_SUBJECT:p6-e2e-owner >"$persist/browser-worker.log" 2>&1 &
pid=$!
ready=0
for attempt in $(seq 1 30); do
  if ! kill -0 "$pid" 2>/dev/null; then break; fi
  if grep -Fq "Ready on http://127.0.0.1:3000" "$persist/browser-worker.log" && curl --silent --fail --max-time 3 http://127.0.0.1:3000/constitution >/dev/null; then ready=1; break; fi
  sleep 1
done
if [ "$ready" != 1 ]; then tail -80 "$persist/browser-worker.log"; exit 1; fi
mkdir -p artifacts
# Scope fixture secret to the local worker and Playwright process only.
export D1_BROWSER_REPORT="$persist/browser-results.json"
if ! pnpm exec playwright test --config experiments/d1-publication/playwright.d1.config.mts --max-failures=1; then
  # Do not dump raw requests, cookies, SQL or arbitrary server output.
  grep -Eo 'BLUEPRINT_CANONICAL_READ_FAILURE: [A-Z_]+|BLUEPRINT_WORKER_GATE: [A-Z_]+' "$persist/browser-worker.log" | sort | uniq -c || true
  exit 1
fi
node --input-type=module -e 'import assert from "node:assert/strict"; import {readFileSync} from "node:fs"; const stats=JSON.parse(readFileSync(process.env.D1_BROWSER_REPORT,"utf8")).stats; assert.equal(stats.expected,72);assert.equal(stats.unexpected,0);assert.equal(stats.skipped,0);assert.equal(stats.flaky,0);console.log("D1_BROWSER_FULL_PARITY",JSON.stringify(stats));'
