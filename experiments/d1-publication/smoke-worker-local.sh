#!/usr/bin/env bash
set -euo pipefail
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
  if status=$(curl --silent --max-time 3 --output "$persist/readiness.html" --write-out "%{http_code}" http://127.0.0.1:8787/professional-review/readiness); then
    if [ "$status" != 200 ]; then echo "FULL_APP_READINESS_HTTP=$status"; tail -100 "$persist/worker.log"; exit 1; fi
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
