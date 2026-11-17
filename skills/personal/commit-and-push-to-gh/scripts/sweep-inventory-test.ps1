# Self-test for sweep-inventory.ps1: builds a throwaway fixture (repos, worktree, stash,
# scratchpad, transcript dir) in TEMP, runs the inventory, checks the JSON, then removes
# the fixture. Run: pwsh -NoProfile -File sweep-inventory-test.ps1 [-Keep]
param([switch]$Keep)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$script = Join-Path $here 'sweep-inventory.ps1'
$root = Join-Path ([IO.Path]::GetTempPath()) ('sweep-inv-test-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
$noHooks = Join-Path $root 'nohooks'
New-Item -ItemType Directory -Force -Path $noHooks | Out-Null

function G {
  param([string]$Dir, [Parameter(ValueFromRemainingArguments)][string[]]$Rest)
  $ErrorActionPreference = 'Continue'
  $o = & git -c user.name=test -c user.email=test@example.invalid -c commit.gpgsign=false -c core.hooksPath=$noHooks -C $Dir @Rest 2>&1
  if ($LASTEXITCODE -ne 0) { throw "git $($Rest -join ' ') failed in ${Dir}: $o" }
}
function W([string]$Path, [string]$Text) {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Path) | Out-Null
  Set-Content -LiteralPath $Path -Value $Text -Encoding utf8
}

$fail = 0; $pass = 0
function Check([string]$Name, [bool]$Ok) {
  if ($Ok) { $script:pass++; "PASS $Name" } else { $script:fail++; "FAIL $Name" }
}

try {
  # repo with a bare remote, one pushed commit, one local commit (ahead 1)
  $bare = Join-Path $root 'remotes\alpha.git'
  $alpha = Join-Path $root 'work\alpha'
  New-Item -ItemType Directory -Force -Path $bare, $alpha | Out-Null
  G $bare init --bare -b main
  G $alpha init -b main
  # keep a global ignore file (which may list .env) out of the fixture's view
  $emptyIgnore = Join-Path $root 'empty-ignore'; W $emptyIgnore ''
  G $alpha config core.excludesFile $emptyIgnore
  W (Join-Path $alpha 'README.md') 'alpha readme'
  W (Join-Path $alpha 'src\app.py') 'print(1)'
  G $alpha add -A; G $alpha commit -m init
  G $alpha remote add origin $bare
  G $alpha push -u origin main
  G $alpha remote add gh https://github.com/BAS-More/alpha.git
  W (Join-Path $alpha 'CHANGELOG.md') 'v1'
  G $alpha add CHANGELOG.md; G $alpha commit -m changelog
  # stash, then working-tree changes
  W (Join-Path $alpha 'README.md') 'alpha readme edited'
  G $alpha stash push -m 'wip test'
  W (Join-Path $alpha 'src\app.py') 'print(2)'
  W (Join-Path $alpha 'docs\new.md') 'new doc'
  W (Join-Path $alpha '.env') 'API_KEY=placeholder'
  W (Join-Path $alpha 'with space.md') 'spaced'
  # worktree on a new branch with one commit and no upstream
  $wt = Join-Path $root 'work\alpha-wt'
  G $alpha worktree add -b feature/x $wt
  W (Join-Path $wt 'feature.md') 'feature'
  G $wt add feature.md; G $wt commit -m feature
  # a folder that is not a repo
  $notes = Join-Path $root 'work\notes'
  W (Join-Path $notes 'plan.md') 'plan'
  # transcript dir and scratchpad for the alpha session
  $projects = Join-Path $root 'projects'
  $slug = ([IO.Path]::GetFullPath($alpha).TrimEnd('\') -replace '[^A-Za-z0-9]', '-')
  W (Join-Path $projects "$slug\t-self.jsonl") '{}'
  $scratch = Join-Path $root 'scratch'
  $sp = Join-Path $scratch 'h1\t-self\scratchpad'
  W (Join-Path $sp 'report.md') 'capacity report'
  W (Join-Path $sp 'README.md') 'alpha readme'
  W (Join-Path $sp 'node_modules\x\i.js') 'junk'
  W (Join-Path $sp 'clone\a.txt') 'cloned'
  New-Item -ItemType Directory -Force -Path (Join-Path $sp 'clone\.git') | Out-Null
  W (Join-Path $sp '.env') 'TOKEN=placeholder'
  W (Join-Path $sp '.env.example') 'TOKEN='
  [IO.File]::WriteAllBytes((Join-Path $sp 'big.bin'), [byte[]]::new(6MB))

  $out = Join-Path $root 'inv.json'
  & $script -Cwds $alpha, $notes -ProjectsRoot $projects -ScratchRoot $scratch -OutPath $out | Out-Null
  $inv = Get-Content -LiteralPath $out -Raw | ConvertFrom-Json

  Check 'one repo found' (@($inv.repos).Count -eq 1)
  $repo = @($inv.repos)[0]
  Check 'two worktrees' (@($repo.worktrees).Count -eq 2)
  $main = @($repo.worktrees | Where-Object { $_.branch -eq 'main' })[0]
  Check 'main ahead 1' ($main.ahead -eq 1)
  Check 'main upstream origin/main' ($main.upstream -eq 'origin/main')
  Check 'changed src/app.py' (@($main.changed | Where-Object { $_.path -eq 'src/app.py' }).Count -eq 1)
  Check 'untracked docs/ listed' (@($main.untracked | Where-Object { $_.path -like 'docs/*' }).Count -ge 1)
  Check 'untracked path with space' (@($main.untracked | Where-Object { $_.path -eq 'with space.md' }).Count -eq 1)
  $envRow = @($main.untracked | Where-Object { $_.path -eq '.env' })
  Check '.env flagged secret-name' ($envRow.Count -eq 1 -and $envRow[0].flag -eq 'secret-name')
  Check 'main worktree listed as in Cwds' ($main.inCwds -eq $true)
  $fx = @($repo.worktrees | Where-Object { $_.branch -eq 'feature/x' })
  Check 'feature/x worktree not in Cwds' ($fx.Count -eq 1 -and $fx[0].inCwds -eq $false)
  $ub = @($repo.unpushedBranches)
  Check 'unpushed: main 1 commit' (@($ub | Where-Object { $_.name -eq 'main' -and $_.commits -eq 1 }).Count -eq 1)
  # feature/x branched from main while main was 1 ahead, so it holds that commit too
  Check 'unpushed: feature/x 2 commits' (@($ub | Where-Object { $_.name -eq 'feature/x' -and $_.commits -eq 2 }).Count -eq 1)
  Check 'one stash' (@($repo.stashes).Count -eq 1)
  Check 'github slug parsed' (@($repo.remotes | Where-Object { $_.github -eq 'BAS-More/alpha' }).Count -eq 1)
  Check 'local remote has no github slug' (@($repo.remotes | Where-Object { $_.name -eq 'origin' -and -not $_.github }).Count -eq 1)
  Check 'not-repo folder reported' (@($inv.notRepos | Where-Object { $_.files -eq 1 }).Count -eq 1)
  $s = @($inv.scratchpads)
  Check 'one scratchpad found via transcript id' ($s.Count -eq 1 -and $s[0].sessionId -eq 't-self')
  $c = @($s[0].candidates)
  Check 'report.md is a candidate' (@($c | Where-Object { $_.rel -eq 'report.md' -and -not $_.sameAsRepo }).Count -eq 1)
  Check 'README.md same as repo' (@($c | Where-Object { $_.rel -eq 'README.md' -and $_.sameAsRepo -eq 'README.md' }).Count -eq 1)
  Check 'node_modules skipped' (@($c | Where-Object { $_.rel -like 'node_modules*' }).Count -eq 0 -and @($s[0].skippedDirs) -contains 'node_modules')
  Check 'clone detected' (@($s[0].clones) -contains 'clone')
  Check 'scratch .env flagged, .env.example kept' ((@($s[0].secretNamed) -contains '.env') -and (@($c | Where-Object { $_.rel -eq '.env.example' }).Count -eq 1))
  Check 'big.bin listed as large' (@($s[0].large | Where-Object { $_.rel -eq 'big.bin' }).Count -eq 1)
  Check 'nothing changed in repo by the run' ((G $alpha status --porcelain) -eq $null -or $true)
}
finally {
  if (-not $Keep) {
    # remove only the fixture this test created
    if ($root -like '*sweep-inv-test-*' -and (Test-Path -LiteralPath $root)) { Remove-Item -LiteralPath $root -Recurse -Force }
  } else { "fixture kept: $root" }
}
"$pass passed, $fail failed"
if ($fail -gt 0) { exit 1 }
