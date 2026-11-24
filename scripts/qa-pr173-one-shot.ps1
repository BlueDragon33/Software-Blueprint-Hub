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
# Native operations are bounded and emit progress, never remain silently hung.
$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE = 'Never'
$env:COREPACK_ENABLE_NETWORK = '0'
function Invoke-Checked {
    param([string]$name, [string]$exe, [string[]]$arguments, [int]$TimeoutSeconds = 180)
    $outFile = Join-Path $logs ($name + '.stdout.txt')
    $errFile = Join-Path $logs ($name + '.stderr.txt')
    Write-Host ("[QA] START: " + $name + " (limit " + $TimeoutSeconds + "s)")
    $command = $exe
    $args = @($arguments)
    # Start-Process requires cmd.exe for .cmd wrappers in Windows PowerShell 5.1.
    if ($exe -match '\.cmd {
        $command = $env:ComSpec
        $args = @('/d', '/c', ('"' + $exe + '" ' + ($arguments -join ' ')))
    }
    $proc = Start-Process -FilePath $command -ArgumentList $args -WorkingDirectory (Get-Location).Path `
        -NoNewWindow -PassThru -RedirectStandardOutput $outFile -RedirectStandardError $errFile
    $started = Get-Date
    $timedOut = $false
    while (-not $proc.WaitForExit(10000)) {
        $elapsed = [int]((Get-Date) - $started).TotalSeconds
        Write-Host ("[QA] " + $name + " running: " + $elapsed + "s")
        if ($elapsed -ge $TimeoutSeconds) {
            $timedOut = $true
            & taskkill.exe /PID $proc.Id /T /F *> $null
            break
        }
    }
    $code = if ($timedOut) { 124 } else { $proc.ExitCode }
    $steps[$name] = [ordered]@{
        exitCode = $code; stdout = $outFile; stderr = $errFile
        timeoutSeconds = $TimeoutSeconds
    }
    if ($code -ne 0) {
        $lastError = if (Test-Path -LiteralPath $errFile) {
            (Get-Content -LiteralPath $errFile -Tail 12 -ErrorAction SilentlyContinue) -join ' | '
        } else { '' }
        throw ("{0} failed/timeout (exit {1}). {2}" -f $name, $code, $lastError)
    }
    Write-Host ("[QA] PASS: " + $name)
}

try {
    if (-not (Test-Path -LiteralPath (Join-Path $repo '.git'))) {
        throw "Expected isolated Git checkout under $repo. No clone or overwrite attempted."
    }
    $remote = (& git -C $repo remote get-url origin).Trim()
    if ($LASTEXITCODE -ne 0 -or $remote -notmatch '^(https://github\.com/|git@github\.com:)BlueDragon33/Software-Blueprint-Hub(\.git)?$') {
        throw 'Git origin does not match the authorized Blueprint Hub repository.'
    }
    # Offline-first: use a known pinned PR commit if already present locally.
    # No silent unbounded ls-remote call; network is attempted once only when necessary.
    $offlinePinnedHead = '9fb5c2b364efac4b1eee607252e56a6106932608'
    $head = $null
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & git -C $repo cat-file -e ($offlinePinnedHead + '^{commit}') 2>$null
        if ($LASTEXITCODE -eq 0) { $head = $offlinePinnedHead }
    } finally { $ErrorActionPreference = $oldPreference }
    if ($head) {
        Write-Host ('[QA] OFFLINE source available: ' + $head + ' (prior known PR revision; NOT latest remote HEAD)')
        $steps['source'] = @{ status = 'OFFLINE_PINNED_PREVIOUS_REVISION'; sha = $head }
    } else {
        Write-Host '[QA] No pinned local object, attempting one bounded TLS fetch.'
        Invoke-Checked 'fetch' 'git' @('-C', $repo, '-c', 'http.version=HTTP/1.1', '-c', 'http.sslBackend=schannel', 'fetch', '--no-tags', 'origin', "refs/heads/$branch") 55
        $head = (& git -C $repo rev-parse FETCH_HEAD).Trim()
        if ($LASTEXITCODE -ne 0 -or $head -notmatch '^[a-f0-9]{40}
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
            Invoke-Checked 'dependencies' $pm ($prefix + @('install', '--offline', '--frozen-lockfile')) 180
            Invoke-Checked 'lint' $pm ($prefix + @('lint')) 180
            Invoke-Checked 'typecheck' $pm ($prefix + @('typecheck')) 240
            Invoke-Checked 'build' $pm ($prefix + @('build')) 300
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
) { throw 'Remote branch HEAD not verified.' }
        $steps['source'] = @{ status = 'FETCHED_REMOTE_BRANCH_REVISION'; sha = $head }
    }
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
            Invoke-Checked 'dependencies' $pm ($prefix + @('install', '--offline', '--frozen-lockfile')) 180
            Invoke-Checked 'lint' $pm ($prefix + @('lint')) 180
            Invoke-Checked 'typecheck' $pm ($prefix + @('typecheck')) 240
            Invoke-Checked 'build' $pm ($prefix + @('build')) 300
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
) {
        $command = $env:ComSpec
        $args = @('/d', '/c', ('"' + $exe + '" ' + ($arguments -join ' ')))
    }
    $proc = Start-Process -FilePath $command -ArgumentList $args -WorkingDirectory (Get-Location).Path `
        -NoNewWindow -PassThru -RedirectStandardOutput $outFile -RedirectStandardError $errFile
    $started = Get-Date
    $timedOut = $false
    while (-not $proc.WaitForExit(10000)) {
        $elapsed = [int]((Get-Date) - $started).TotalSeconds
        Write-Host ("[QA] " + $name + " running: " + $elapsed + "s")
        if ($elapsed -ge $TimeoutSeconds) {
            $timedOut = $true
            & taskkill.exe /PID $proc.Id /T /F *> $null
            break
        }
    }
    $code = if ($timedOut) { 124 } else { $proc.ExitCode }
    $steps[$name] = [ordered]@{
        exitCode = $code; stdout = $outFile; stderr = $errFile
        timeoutSeconds = $TimeoutSeconds
    }
    if ($code -ne 0) {
        $lastError = if (Test-Path -LiteralPath $errFile) {
            (Get-Content -LiteralPath $errFile -Tail 12 -ErrorAction SilentlyContinue) -join ' | '
        } else { '' }
        throw ("{0} failed/timeout (exit {1}). {2}" -f $name, $code, $lastError)
    }
    Write-Host ("[QA] PASS: " + $name)
}

try {
    if (-not (Test-Path -LiteralPath (Join-Path $repo '.git'))) {
        throw "Expected isolated Git checkout under $repo. No clone or overwrite attempted."
    }
    $remote = (& git -C $repo remote get-url origin).Trim()
    if ($LASTEXITCODE -ne 0 -or $remote -notmatch '^(https://github\.com/|git@github\.com:)BlueDragon33/Software-Blueprint-Hub(\.git)?$') {
        throw 'Git origin does not match the authorized Blueprint Hub repository.'
    }
    # Offline-first: use a known pinned PR commit if already present locally.
    # No silent unbounded ls-remote call; network is attempted once only when necessary.
    $offlinePinnedHead = '9fb5c2b364efac4b1eee607252e56a6106932608'
    $head = $null
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & git -C $repo cat-file -e ($offlinePinnedHead + '^{commit}') 2>$null
        if ($LASTEXITCODE -eq 0) { $head = $offlinePinnedHead }
    } finally { $ErrorActionPreference = $oldPreference }
    if ($head) {
        Write-Host ('[QA] OFFLINE source available: ' + $head + ' (prior known PR revision; NOT latest remote HEAD)')
        $steps['source'] = @{ status = 'OFFLINE_PINNED_PREVIOUS_REVISION'; sha = $head }
    } else {
        Write-Host '[QA] No pinned local object, attempting one bounded TLS fetch.'
        Invoke-Checked 'fetch' 'git' @('-C', $repo, '-c', 'http.version=HTTP/1.1', '-c', 'http.sslBackend=schannel', 'fetch', '--no-tags', 'origin', "refs/heads/$branch") 55
        $head = (& git -C $repo rev-parse FETCH_HEAD).Trim()
        if ($LASTEXITCODE -ne 0 -or $head -notmatch '^[a-f0-9]{40}
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
            Invoke-Checked 'dependencies' $pm ($prefix + @('install', '--offline', '--frozen-lockfile')) 180
            Invoke-Checked 'lint' $pm ($prefix + @('lint')) 180
            Invoke-Checked 'typecheck' $pm ($prefix + @('typecheck')) 240
            Invoke-Checked 'build' $pm ($prefix + @('build')) 300
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
) { throw 'Remote branch HEAD not verified.' }
        $steps['source'] = @{ status = 'FETCHED_REMOTE_BRANCH_REVISION'; sha = $head }
    }
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
            Invoke-Checked 'dependencies' $pm ($prefix + @('install', '--offline', '--frozen-lockfile')) 180
            Invoke-Checked 'lint' $pm ($prefix + @('lint')) 180
            Invoke-Checked 'typecheck' $pm ($prefix + @('typecheck')) 240
            Invoke-Checked 'build' $pm ($prefix + @('build')) 300
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
