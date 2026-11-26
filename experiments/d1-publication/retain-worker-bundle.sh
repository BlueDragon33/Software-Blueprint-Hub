#!/usr/bin/env bash
set -euo pipefail
# P3 build only; run from outside an isolated exact P1 checkout on Linux.
# No deploy, no SQL, no browser QA, no production secrets.
[[ $# == 1 ]] || { echo 'Usage: retain-worker-bundle.sh <exact P1 checkout>' >&2; exit 2; }
root=$(cd "$1" && pwd -P)
cd "$root"
export EXPECTED_CANDIDATE_REVISION=0c2243342f0bb787fd93d3351c1a1a1d7f30e4f0
[[ $(git rev-parse HEAD) == "$EXPECTED_CANDIDATE_REVISION" ]]
[[ -z $(git status --porcelain=v1 --untracked-files=all) ]]
[[ $(node -p 'process.versions.node.split(".")[0]') == 24 ]]
[[ $(pnpm --version) == 12.4.0 ]]
[[ ! -e apps/web/dist ]] || { echo 'Existing dist; use fresh isolated checkout' >&2; exit 1; }
unset CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID CLOUDFLARE_API_KEY AUTH_SECRET GITHUB_ID GITHUB_SECRET DATABASE_URL BLUEPRINT_OWNER_BOOTSTRAP_PROVIDER BLUEPRINT_OWNER_BOOTSTRAP_SUBJECT BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH
export CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV=false
export BLUEPRINT_LOCAL_PUBLICATION=true WRANGLER_WRITE_LOGS=false CLOUDFLARE_TELEMETRY_DISABLED=1
scratch=$(mktemp -d)
trap 'rm -rf -- "$scratch"' EXIT
export RUNNER_TEMP="$scratch" WRANGLER_LOG_PATH="$scratch/wrangler.log" MINIFLARE_REGISTRY_PATH="$scratch/miniflare"
pnpm install --frozen-lockfile
npm ci --prefix experiments/d1-publication --no-audit --no-fund
pnpm prisma:generate
[[ -z $(git status --porcelain=v1 --untracked-files=all) ]]
tools="$root/experiments/d1-publication/node_modules"
web="$root/apps/web"
for p in vinext vite @vitejs/plugin-react @vitejs/plugin-rsc react-server-dom-webpack @cloudflare/vite-plugin; do
  [[ -d "$tools/$p" ]]
  mkdir -p "$(dirname "$web/node_modules/$p")"
  [[ ! -e "$web/node_modules/$p" && ! -L "$web/node_modules/$p" ]] || { echo "Build tool collision: $p" >&2; exit 1; }
  ln -s "$tools/$p" "$web/node_modules/$p"
done
node -e 'const {createRequire}=require("node:module");const req=createRequire(process.argv[1]+"/package.json");console.log("HUB_REACT",req("react/package.json").version,"HUB_REACT_DOM",req("react-dom/package.json").version,"VINEXT_RSC",req("react-server-dom-webpack/package.json").version)' "$web"
cd "$web"
"$tools/.bin/vite" build --config "$root/experiments/d1-publication/vite.worker.config.mts"
cd "$root"
node experiments/d1-publication/verify-worker-bundle.mjs
[[ -z $(git status --porcelain=v1 --untracked-files=all) ]]
printf 'RETAINED_LOCAL_BUNDLE_ONLY %s %s\n' "$EXPECTED_CANDIDATE_REVISION" "$web/dist"
