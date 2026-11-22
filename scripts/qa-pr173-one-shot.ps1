# Blueprint OS PR #173: one bounded Windows QA batch, read-only to the original worktree.
# Run as the current user. Does not merge, push, deploy, change law or approve gates.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$env:COREPACK_ENABLE_DOWNLOAD_PROMPT = '0'
$root = 'E:\BaumanWeb'
$repo = Join-Path $root 'Software-Blueprint-Hub'
$branch = 'proposal/constitutional-graph-integration-20261122'
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$qa = Join-Path $root ('_atlas_pr173_qa_' + $runId)
$logs = Join-Path $root ('_atlas_pr173_logs_' + $runId)
$steps = [ordered]@{}
$head = $null
$status = 'BLOCKED'
if (-not (Test-Path -LiteralPath $root -PathType Container)) { throw "Expected E:\BaumanWeb, not C:." }
New-Item -ItemType Directory -Path $logs -ErrorAction Stop | Out-Null
function Invoke-Checked([string]$name, [string]$exe, [string[]]$arguments) {
    $file = Join-Path $logs ($name + '.txt')
    & $exe @arguments *>&1 | Out-File -LiteralPath $file -Encoding utf8
    $exitCode = $LASTEXITCODE
    $steps[$name] = [ordered]@{ exitCode = $exitCode; log = $file }
    if ($exitCode -ne 0) { throw "$name failed (exit $exitCode); inspect $file" }
}
try {
    if (-not (Test-Path -LiteralPath (Join-Path $repo '.git'))) {
        throw "Expected isolated Git checkout under $repo. No clone or overwrite attempted."
    }
    $remote = (& git -C $repo remote get-url origin).Trim()
    if ($LASTEXITCODE -ne 0 -or $remote -notmatch '^(https://github\.com/|git@github\.com:)BlueDragon33/Software-Blueprint-Hub(\.git)?$') {
        throw 'Git origin does not match the authorized Blueprint Hub repository.'
    }
    $remoteLine = & git -C $repo ls-remote --heads origin "refs/heads/$branch"
    if ($LASTEXITCODE -ne 0 -or -not $remoteLine) { throw 'Cannot verify PR #173 remote branch HEAD.' }
    $expected = (($remoteLine | Select-Object -First 1) -split '\s+')[0]
    if ($expected -notmatch '^[0-9a-f]{40}$') { throw 'Malformed remote HEAD SHA.' }
    Invoke-Checked 'fetch' 'git' @('-C', $repo, 'fetch', '--no-tags', 'origin', "refs/heads/$branch")
    $head = (& git -C $repo rev-parse FETCH_HEAD).Trim()
    if ($LASTEXITCODE -ne 0 -or $head -ne $expected) { throw 'Remote branch changed during fetch; stop before tests.' }
    if (Test-Path -LiteralPath $qa) { throw 'QA directory unexpectedly exists; will not overwrite.' }
    Invoke-Checked 'worktree' 'git' @('-C', $repo, 'worktree', 'add', '--detach', $qa, $head)
    $tests = @(
        'tests/application/atlas-graph.candidate.test.mjs',
        'tests/application/atlas-live-events.candidate.test.mjs',
        'tests/application/atlas-next-action-adapter.candidate.test.mjs',
        'tests/application/universal-next-action-frontier.candidate.test.mjs',
        'tests/application/universal-next-action-intervention.candidate.test.mjs'
    )
    foreach ($testFile in $tests) {
        if (-not (Test-Path -LiteralPath (Join-Path $qa $testFile))) { throw "Missing expected test: $testFile" }
    }
    Push-Location $qa
    try {
        Invoke-Checked 'node-version' 'node' @('--version')
        Invoke-Checked 'candidate-node-tests' 'node' (@('--test') + $tests)
        $pm = $null; $prefix = @()
        if (Get-Command pnpm -ErrorAction SilentlyContinue) { $pm = 'pnpm' }
        elseif (Get-Command corepack -ErrorAction SilentlyContinue) { $pm = 'corepack'; $prefix = @('pnpm') }
        if ($pm) {
            Invoke-Checked 'dependencies' $pm ($prefix + @('install', '--frozen-lockfile'))
            Invoke-Checked 'lint' $pm ($prefix + @('lint'))
            Invoke-Checked 'typecheck' $pm ($prefix + @('typecheck'))
            Invoke-Checked 'build' $pm ($prefix + @('build'))
        } else {
            $steps['packageManager'] = @{ status = 'SKIPPED'; reason = 'No pnpm or corepack; not a PASS' }
        }
    } finally { Pop-Location }
    $status = 'LOCAL_QA_BATCH_COMPLETED'
} catch {
    $steps['blocker'] = @{ message = $_.Exception.Message }
} finally {
    $summary = [ordered]@{
        status = $status
        repository = 'BlueDragon33/Software-Blueprint-Hub'
        pr = 173
        branch = $branch
        exactHead = $head
        qaWorktree = $qa
        evidenceDirectory = $logs
        steps = $steps
        note = 'Local QA only; no browser, PostgreSQL, runtime agent, independent reviewer, ratification or Production PASS.'
    }
    $summaryFile = Join-Path $logs 'summary.json'
    $summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $summaryFile -Encoding utf8
    Write-Host '=== ATLAS PR173 ONE-SHOT QA RESULT ==='
    Get-Content -LiteralPath $summaryFile -Raw
}
