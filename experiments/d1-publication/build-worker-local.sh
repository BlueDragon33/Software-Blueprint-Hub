#!/usr/bin/env bash
set -euo pipefail
# Run only from the isolated exact candidate worktree. No remote deploy.
root="$(git rev-parse --show-toplevel)"
cd "$root"
test "$(git rev-parse HEAD)" = "$EXPECTED_CANDIDATE_REVISION"
git status --porcelain=v1 --untracked-files=all
test -z "$(git status --porcelain=v1 --untracked-files=all)"
tools="$root/experiments/d1-publication/node_modules"
web="$root/apps/web"
for p in vinext vite @vitejs/plugin-react @vitejs/plugin-rsc react-server-dom-webpack @cloudflare/vite-plugin; do
  test -d "$tools/$p"
  mkdir -p "$(dirname "$web/node_modules/$p")"
  test ! -e "$web/node_modules/$p" || { echo "Build tool collision: $p" >&2; exit 1; }
  ln -s "$tools/$p" "$web/node_modules/$p"
done
# Do not replace Hub React/ReactDOM or Next links to make the build pass.
node -e 'const {createRequire}=require("node:module");const req=createRequire(process.argv[1]+"/package.json");console.log("HUB_REACT",req("react/package.json").version,"HUB_REACT_DOM",req("react-dom/package.json").version,"VINEXT_RSC",req("react-server-dom-webpack/package.json").version)' "$web"
export WRANGLER_WRITE_LOGS=false
export WRANGLER_LOG_PATH="$RUNNER_TEMP/blueprint-d1-wrangler.log"
export MINIFLARE_REGISTRY_PATH="$RUNNER_TEMP/blueprint-d1-miniflare-registry"
export CLOUDFLARE_TELEMETRY_DISABLED=1
cd "$web"
"$tools/.bin/vite" build --config "$root/experiments/d1-publication/vite.worker.config.mts"
cd "$root"
node "$root/experiments/d1-publication/verify-worker-bundle.mjs"
bash "$root/experiments/d1-publication/smoke-worker-local.sh"
