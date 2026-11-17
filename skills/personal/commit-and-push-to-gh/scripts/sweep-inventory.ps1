<#
.SYNOPSIS
  Read-only inventory for the commit-and-push-to-gh skill.
.DESCRIPTION
  For each session working folder in -Cwds: the git state of its repo and of every worktree
  of that repo (changes, untracked files, unpushed branches, stashes, remotes), folders that
  are not repos, and the scratchpads of the sessions that worked there, with the files worth
  saving. It changes nothing.
  It runs in one process, makes about 8 git calls per repo with a short pause between repos
  (rapid process bursts on Avi's PC trigger a kernel handle leak), and only walks the
  scratchpads it finds, skipping dependency folders and clones. It never walks a drive.
.EXAMPLE
  pwsh -NoProfile -File sweep-inventory.ps1 -Cwds 'C:\Dev\repo;C:\Dev\repo\.claude\worktrees\x' -OutPath "$env:TEMP\inv.json"
#>
[CmdletBinding(PositionalBinding = $false)]
param(
  # Folders separated by ';' (pwsh -File passes 'a','b' as separate strings, not a list).
  [Parameter(Mandatory)][string[]]$Cwds,
  [int]$Days = 14,
  [string]$OutPath,
  [string]$ProjectsRoot = (Join-Path $HOME '.claude\projects'),
  [string]$ScratchRoot = (Join-Path ([IO.Path]::GetTempPath()) 'claude'),
  [int]$MaxScratchFiles = 4000,
  [int]$MaxDepth = 6,
  [int]$BigFileMB = 50
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$Cwds = @($Cwds | ForEach-Object { $_ -split ';' } | ForEach-Object { $_.Trim().Trim("'", '"') } | Where-Object { $_ })

$SkipDirNames = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($n in 'node_modules', '.venv', 'venv', '__pycache__', 'dist', 'build', 'out', '.next', '.nuxt', 'target',
  '.cache', 'coverage', 'site-packages', '.pytest_cache', '.mypy_cache', '.turbo', '.gradle', 'obj') { [void]$SkipDirNames.Add($n) }
$KeepExt = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($e in '.md', '.txt', '.ps1', '.psm1', '.psd1', '.py', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json',
  '.csv', '.tsv', '.html', '.css', '.yaml', '.yml', '.toml', '.sql', '.sh', '.cmd', '.bat', '.xml', '.ipynb', '.example') { [void]$KeepExt.Add($e) }
# File names that usually hold secrets; .env.example/.sample/.template are templates and are kept.
$SecretPattern = '(?i)^(\.env(?!\.(example|sample|template)$)(\..+)?|.+\.(pem|key|pfx|p12|jks)|id_(rsa|dsa|ecdsa|ed25519)(\.pub)?|credentials.*\.json|secrets?([._-].*)?\.(json|ya?ml|txt))$'
$BigBytes = [int64]$BigFileMB * 1MB

function Invoke-Git {
  param([string]$Dir, [string[]]$GitArgs)
  # Native stderr must not become a terminating error; decide on the exit code.
  $ErrorActionPreference = 'Continue'
  $out = & git -c core.quotePath=false -C $Dir @GitArgs 2>$null
  [pscustomobject]@{ Code = $LASTEXITCODE; Lines = @($out | ForEach-Object { [string]$_ }) }
}

function ConvertTo-FullPath([string]$Path) {
  [IO.Path]::GetFullPath(($Path -replace '/', '\')).TrimEnd('\')
}

function Get-GitHubSlug([string]$Url) {
  if ($Url -match '(?i)github\.com[:/]+([^/\s]+)/([^/\s]+?)(\.git)?/?$') { return "$($Matches[1])/$($Matches[2])" }
  $null
}

function Get-ProjectDirs([string]$Path) {
  # Claude Code names a project's transcript folder after its working folder; two schemes are in use.
  $full = ConvertTo-FullPath $Path
  $names = @(($full -replace '[^A-Za-z0-9]', '-'), ('-' + ($full -replace '[:\\/]', '-'))) | Select-Object -Unique
  @($names | ForEach-Object { Join-Path $ProjectsRoot $_ } | Where-Object { Test-Path -LiteralPath $_ -PathType Container })
}

function New-Entry([string]$Root, [string]$Xy, [string]$Rel) {
  $flag = $null; $bytes = $null
  $name = Split-Path -Leaf ($Rel.TrimEnd('/'))
  if ($name -match $SecretPattern) { $flag = 'secret-name' }
  $full = Join-Path $Root ($Rel -replace '/', '\')
  if ($Rel.EndsWith('/')) { if (-not $flag) { $flag = 'directory' } }
  elseif (Test-Path -LiteralPath $full -PathType Leaf) {
    $bytes = (Get-Item -LiteralPath $full -Force).Length
    if (-not $flag -and $bytes -gt $BigBytes) { $flag = 'big' }
  }
  [pscustomobject]@{ xy = $Xy; path = $Rel; bytes = $bytes; flag = $flag }
}

function Get-WorktreeState([string]$Path, [string[]]$CwdList) {
  $r = Invoke-Git $Path @('status', '--porcelain=v2', '--branch', '--untracked-files=normal')
  $changed = [Collections.Generic.List[object]]::new()
  $untracked = [Collections.Generic.List[object]]::new()
  $unmerged = [Collections.Generic.List[object]]::new()
  $st = [ordered]@{ path = $Path; ok = ($r.Code -eq 0); branch = $null; detached = $false; upstream = $null
    ahead = 0; behind = 0; changed = $changed; untracked = $untracked; unmerged = $unmerged; lastCommit = $null; inCwds = $false }
  foreach ($l in $r.Lines) {
    if ($l.StartsWith('# branch.head ')) { $h = $l.Substring(14); if ($h -eq '(detached)') { $st.detached = $true } else { $st.branch = $h } }
    elseif ($l.StartsWith('# branch.upstream ')) { $st.upstream = $l.Substring(18) }
    elseif ($l -match '^# branch\.ab \+(\d+) -(\d+)') { $st.ahead = [int]$Matches[1]; $st.behind = [int]$Matches[2] }
    elseif ($l.StartsWith('1 ')) { $changed.Add((New-Entry $Path $l.Substring(2, 2) ($l -split ' ', 9)[8])) }
    elseif ($l.StartsWith('2 ')) { $rest = ($l -split ' ', 10)[9]; $changed.Add((New-Entry $Path $l.Substring(2, 2) ($rest -split "`t", 2)[0])) }
    elseif ($l.StartsWith('u ')) { $unmerged.Add((New-Entry $Path 'UU' ($l -split ' ', 11)[10])) }
    elseif ($l.StartsWith('? ')) { $untracked.Add((New-Entry $Path '??' $l.Substring(2))) }
  }
  $lc = Invoke-Git $Path @('log', '-1', '--format=%h%x09%cr%x09%s')
  if ($lc.Code -eq 0 -and $lc.Lines.Count) { $st.lastCommit = $lc.Lines[0] }
  $norm = ConvertTo-FullPath $Path
  foreach ($c in $CwdList) {
    $cn = ConvertTo-FullPath $c
    if ($cn -ieq $norm -or $cn.StartsWith($norm + '\', [StringComparison]::OrdinalIgnoreCase)) { $st.inCwds = $true }
  }
  [pscustomobject]$st
}

function Get-RepoState([string]$Top, [string]$Common, [string[]]$CwdList) {
  $wts = [Collections.Generic.List[object]]::new()
  $wl = Invoke-Git $Top @('worktree', 'list', '--porcelain')
  $paths = [Collections.Generic.List[string]]::new(); $prunable = [Collections.Generic.List[string]]::new(); $cur = $null
  foreach ($l in $wl.Lines) {
    if ($l.StartsWith('worktree ')) { $cur = ConvertTo-FullPath $l.Substring(9); $paths.Add($cur) }
    elseif ($l.StartsWith('prunable') -and $cur) { $prunable.Add($cur) }
  }
  if (-not $paths.Count) { $paths.Add((ConvertTo-FullPath $Top)) }
  foreach ($p in $paths) {
    if ($prunable.Contains($p) -or -not (Test-Path -LiteralPath $p -PathType Container)) { continue }
    $wts.Add((Get-WorktreeState $p $CwdList))
  }
  $remotes = [Collections.Generic.List[object]]::new()
  foreach ($l in (Invoke-Git $Top @('remote', '-v')).Lines) {
    # URLs can be local paths with spaces, so take everything up to " (push)".
    if ($l -match '^(\S+)\s+(.+?)\s+\(push\)$') { $remotes.Add([pscustomobject]@{ name = $Matches[1]; url = $Matches[2]; github = (Get-GitHubSlug $Matches[2]) }) }
  }
  $def = Invoke-Git $Top @('symbolic-ref', '--short', 'refs/remotes/origin/HEAD')
  $stashes = @((Invoke-Git $Top @('stash', 'list', '--format=%gd%x09%cr%x09%s')).Lines | Where-Object { $_ })
  # Branch tips not reachable from any remote ref = local work that exists only here.
  $tips = (Invoke-Git $Top @('log', '--branches', '--not', '--remotes', '--simplify-by-decoration', '--decorate-refs=refs/heads/', '--format=%D')).Lines
  $names = [Collections.Generic.List[string]]::new()
  foreach ($l in $tips) {
    foreach ($d in ($l -split ', ')) {
      $n = $d.Trim() -replace '^HEAD -> ', ''
      if ($n -and $n -ne 'HEAD' -and -not $n.StartsWith('tag: ') -and -not $names.Contains($n)) { $names.Add($n) }
    }
  }
  $unpushed = [Collections.Generic.List[object]]::new()
  foreach ($n in ($names | Select-Object -First 20)) {
    $cnt = Invoke-Git $Top @('rev-list', '--count', $n, '--not', '--remotes')
    $unpushed.Add([pscustomobject]@{ name = $n; commits = $(if ($cnt.Code -eq 0 -and $cnt.Lines.Count) { [int]$cnt.Lines[0] } else { $null }) })
  }
  [pscustomobject]@{
    commonDir = (ConvertTo-FullPath $Common); remotes = $remotes
    defaultBranch = $(if ($def.Code -eq 0 -and $def.Lines.Count) { $def.Lines[0] } else { $null })
    stashes = $stashes; unpushedBranches = $unpushed; unpushedBranchesTruncated = ($names.Count -gt 20); worktrees = $wts
  }
}

function Get-ScratchInventory([string]$Root) {
  $cand = [Collections.Generic.List[object]]::new(); $secret = [Collections.Generic.List[string]]::new()
  $large = [Collections.Generic.List[object]]::new(); $clones = [Collections.Generic.List[string]]::new()
  $skipped = [Collections.Generic.List[string]]::new()
  $seen = 0; $other = 0; $truncated = $false
  $stack = [Collections.Generic.Stack[object]]::new()
  $stack.Push([pscustomobject]@{ dir = $Root; depth = 0 })
  while ($stack.Count -and -not $truncated) {
    $item = $stack.Pop()
    try {
      foreach ($f in [IO.Directory]::EnumerateFiles($item.dir)) {
        if (++$seen -gt $MaxScratchFiles) { $truncated = $true; break }
        $fi = [IO.FileInfo]::new($f); $rel = [IO.Path]::GetRelativePath($Root, $f)
        if ($fi.Name -match $SecretPattern) { $secret.Add($rel); continue }
        if ($fi.Length -gt 5MB) { $large.Add([pscustomobject]@{ rel = $rel; bytes = $fi.Length }); continue }
        if ($KeepExt.Contains($fi.Extension)) {
          $cand.Add([pscustomobject]@{ rel = $rel; full = $f; bytes = $fi.Length; lastWrite = $fi.LastWriteTime.ToString('s'); sameAsRepo = $null; nameInRepo = $null })
        } else { $other++ }
      }
      if ($truncated) { break }
      foreach ($sub in [IO.Directory]::EnumerateDirectories($item.dir)) {
        $name = [IO.Path]::GetFileName($sub); $rel = [IO.Path]::GetRelativePath($Root, $sub)
        if ($name -eq '.git') { continue }
        if ($SkipDirNames.Contains($name)) { $skipped.Add($rel); continue }
        if (([IO.File]::GetAttributes($sub) -band [IO.FileAttributes]::ReparsePoint) -ne 0) { $skipped.Add("$rel (link)"); continue }
        if (Test-Path -LiteralPath (Join-Path $sub '.git')) { $clones.Add($rel); continue }
        if ($item.depth + 1 -gt $MaxDepth) { $skipped.Add("$rel (depth)"); continue }
        $stack.Push([pscustomobject]@{ dir = $sub; depth = $item.depth + 1 })
      }
    } catch { $skipped.Add(([IO.Path]::GetRelativePath($Root, $item.dir)) + ' (error: ' + $_.Exception.GetType().Name + ')') }
  }
  [pscustomobject]@{ candidates = $cand; secretNamed = $secret; large = $large; clones = $clones; skippedDirs = $skipped
    filesSeen = [Math]::Min($seen, $MaxScratchFiles); otherFiles = $other; truncated = $truncated }
}

$cutoff = (Get-Date).AddDays(-$Days)
$hashDirs = @(if (Test-Path -LiteralPath $ScratchRoot -PathType Container) { Get-ChildItem -LiteralPath $ScratchRoot -Directory })
$repos = [ordered]@{}
$cwdRows = [Collections.Generic.List[object]]::new()
$notRepos = [Collections.Generic.List[object]]::new()
$scratchpads = [Collections.Generic.List[object]]::new()
$lsCache = @{}
$uniqueCwds = @($Cwds | Where-Object { $_ } | ForEach-Object { ConvertTo-FullPath $_ } | Select-Object -Unique)

foreach ($cwd in $uniqueCwds) {
  $exists = Test-Path -LiteralPath $cwd -PathType Container
  $top = $null; $common = $null
  if ($exists) {
    $rp = Invoke-Git $cwd @('rev-parse', '--path-format=absolute', '--show-toplevel', '--git-common-dir')
    if ($rp.Code -eq 0 -and $rp.Lines.Count -ge 2) { $top = ConvertTo-FullPath $rp.Lines[0]; $common = ConvertTo-FullPath $rp.Lines[1] }
  }
  $transcripts = [Collections.Generic.List[object]]::new()
  foreach ($pd in (Get-ProjectDirs $cwd)) {
    foreach ($t in (Get-ChildItem -LiteralPath $pd -Filter '*.jsonl' -File | Where-Object { $_.LastWriteTime -ge $cutoff })) {
      $transcripts.Add([pscustomobject]@{ id = $t.BaseName; lastWrite = $t.LastWriteTime.ToString('s'); minutesAgo = [int]((Get-Date) - $t.LastWriteTime).TotalMinutes })
    }
  }
  $cwdRows.Add([pscustomobject]@{ cwd = $cwd; exists = $exists; worktree = $top; commonDir = $common; transcripts = $transcripts })
  if ($exists -and -not $top) {
    $files = @(Get-ChildItem -LiteralPath $cwd -File -Force -ErrorAction SilentlyContinue)
    $dirs = @(Get-ChildItem -LiteralPath $cwd -Directory -Force -ErrorAction SilentlyContinue)
    $newest = ($files | Sort-Object LastWriteTime -Descending | Select-Object -First 1)
    $notRepos.Add([pscustomobject]@{ cwd = $cwd; files = $files.Count; dirs = $dirs.Count; newest = $(if ($newest) { $newest.LastWriteTime.ToString('s') } else { $null }) })
  }
  if ($common -and -not $repos.Contains($common)) {
    $repos[$common] = Get-RepoState $top $common $uniqueCwds
    Start-Sleep -Milliseconds 150
  }
  foreach ($t in $transcripts) {
    foreach ($h in $hashDirs) {
      $sp = Join-Path $h.FullName (Join-Path $t.id 'scratchpad')
      if (-not (Test-Path -LiteralPath $sp -PathType Container)) { continue }
      $si = Get-ScratchInventory $sp
      if ($top -and $si.candidates.Count) {
        if (-not $lsCache.ContainsKey($top)) {
          $byName = @{}
          foreach ($f in (Invoke-Git $top @('ls-files')).Lines) {
            $n = Split-Path -Leaf $f
            if (-not $byName.ContainsKey($n)) { $byName[$n] = [Collections.Generic.List[string]]::new() }
            $byName[$n].Add($f)
          }
          $lsCache[$top] = $byName
        }
        $byName = $lsCache[$top]
        foreach ($c in $si.candidates) {
          $n = Split-Path -Leaf $c.full
          if (-not $byName.ContainsKey($n)) { continue }
          $h1 = (Get-FileHash -LiteralPath $c.full -Algorithm SHA256).Hash
          foreach ($m in ($byName[$n] | Select-Object -First 3)) {
            $mf = Join-Path $top ($m -replace '/', '\')
            if ((Test-Path -LiteralPath $mf -PathType Leaf) -and (Get-FileHash -LiteralPath $mf -Algorithm SHA256).Hash -eq $h1) { $c.sameAsRepo = $m; break }
          }
          if (-not $c.sameAsRepo) { $c.nameInRepo = $byName[$n][0] }
        }
      }
      $scratchpads.Add([pscustomobject]@{ path = $sp; sessionId = $t.id; cwd = $cwd; worktree = $top
        candidates = $si.candidates; secretNamed = $si.secretNamed; large = $si.large; clones = $si.clones
        skippedDirs = $si.skippedDirs; filesSeen = $si.filesSeen; otherFiles = $si.otherFiles; truncated = $si.truncated })
    }
  }
}

$result = [pscustomobject]@{
  generatedAt = (Get-Date).ToString('s'); days = $Days; projectsRoot = $ProjectsRoot; scratchRoot = $ScratchRoot
  cwds = $cwdRows; repos = @($repos.Values); notRepos = $notRepos; scratchpads = $scratchpads
}
$json = $result | ConvertTo-Json -Depth 8
if ($OutPath) {
  Set-Content -LiteralPath $OutPath -Value $json -Encoding utf8
  $wtAll = @($result.repos | ForEach-Object { $_.worktrees })
  $dirty = @($wtAll | Where-Object { $_.changed.Count -or $_.untracked.Count -or $_.unmerged.Count }).Count
  $ub = @($result.repos | ForEach-Object { $_.unpushedBranches }).Count
  $st = @($result.repos | ForEach-Object { $_.stashes }).Count
  $cc = @($scratchpads | ForEach-Object { $_.candidates }).Count
  "wrote $OutPath"
  "repos $($result.repos.Count); worktrees $($wtAll.Count) ($dirty with changes); unpushed branches $ub; stashes $st; folders not in git $($notRepos.Count); scratchpads $($scratchpads.Count) ($cc candidate files)"
} else { $json }
