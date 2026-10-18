# Phase instructions

`S` = this skill's `scripts/` dir. `$SCRATCH` = the session scratchpad (or OS temp dir).
`RUN` = `<YYYY-MM-DD>-<n>` (n = first number with no existing `continuity/<RUN>` branch locally or on the remote).
`CB` = a repo's continuity worktree, branch `continuity/<RUN>`; `D` = the artifact-host repo's `CB/docs/continuity/<RUN>/` (chosen in P0).
Until P6 creates `CB`, every artifact lives in `$SCRATCH/continuity/` and is moved into `D` then.
Each phase names its tier (see [MODELS.md](MODELS.md)); run it on the model the user chose in P0.

## Contents
P0 Scope · P1 Inventory · P2 Secure work · P3 Sessions · P4 Baseline · P5 Drift · P6 Decisions ·
P7 Remediation · P8 To-do, gate, review · P9 Hand-off · Secret scan · PAL payloads

---

## P0 Scope (main session), a STOP

0. **Is another session already continuing this run?** Always on a resume, a restart or a reopened window, before
   any other step. Use Codex `list_threads` / `read_thread`, or Claude ccd `list_sessions` /
   `search_session_transcripts`, according to their actual schemas. Find another running session whose
   cwd/project is a root, a linked worktree or this run's `$SCRATCH`; inspect matching transcript summaries
   for `$SCRATCH/continuity` and `continuity/<RUN>`. Exclude this session and its assigned subagents.
   A conflicting running session → stop and ask the user: hand the run to that
   session, or stop it before this one continues. Two sessions advancing one run push twice and open duplicate PRs.
   Tools unavailable → report the visibility gap; use an existing explicit user answer about active windows, otherwise ask. Do not infer inactivity from missing transcripts.
1. Roots: the arguments; else a project named earlier in this conversation; else the cwd **if** it is a git repo
   (confirm it); else ask for a folder or repo URL. A URL not on disk: ask where to clone, then clone.
2. `node S/repo-state.mjs <roots> > $SCRATCH/inventory.json`. If `discovered` is true (a root was a parent
   folder) or docs name sibling repos (e.g. `sentinel/...`), list every candidate repo.
3. Discover models and build the tier proposal (MODELS.md § Discovery).
4. Per repo, discover where work can go: the writable push remote (do not assume `origin`), hosting provider
   (`gh` for GitHub, `glab` for GitLab, else none), default branch, and the repo's own branch/PR rules.
   No provider → that repo's secured work is handed over as a `git bundle` + patch in `$SCRATCH`, not a PR.
5. **One available-question-tool batch (or chat)**: repos in scope, each marked *audit-only* or *may be changed* · model per tier ·
   **consent to send repository content to the T4 vendor, per repo** (full content / artifacts and summaries only /
   no external review) · **artifact host**: a *may be changed* repo whose continuity branch carries the artifacts, or
   "local only" (artifacts stay in `$SCRATCH/continuity/`, nothing committed, and `D` means that folder for the rest
   of the run) · clone location (if needed) · "any unpushed work on another machine or account?"
   Record the answers in `$SCRATCH/continuity/DECISIONS.md`.

## P1 Inventory (T1)

```
node S/sessions.mjs <in-scope roots> --days 30 --limit 25 > $SCRATCH/sessions.json
node S/doc-refs.mjs <repos[].path from inventory.json, all at once> > $SCRATCH/doc-refs.json
```
`sessions.mjs` reads Claude Code `~/.claude/projects` and Codex `$CODEX_HOME/sessions`
(default `~/.codex/sessions`) on this machine/account. `--home` overrides the Claude directory;
`--codex-home` overrides the Codex sessions directory. Codex turn contexts supply every cwd and
`currentCwd`; file modification time supplies `lastActive`, an activity signal, not proof of a running task.
Local files can include desktop-origin rollouts but do not establish complete desktop/cloud coverage.
Supplement with Codex `list_threads` / `read_thread`, or Claude ccd `list_sessions` /
`search_session_transcripts` when available. Preserve source, id, all known `cwds`, actual running state,
and authoritative last-activity time. Never invent missing timestamps; unknown activity blocks mutation
of the affected checkout until resolved. Mark unavailable cloud/phone/other-account coverage UNVERIFIED.
The P0 answer and remote branches/PRs supplement inventory; neither proves absent unpushed work.
Re-run repo-state if scope changed in P0. **P2 onward requires a successful repo-state run** (exit 0, every
in-scope repo present). If it fails, fall back to the commands it wraps (`git status --porcelain`,
`git worktree list --porcelain`, `git stash list`, `git for-each-ref refs/heads`); if those fail too, the rest
of the run is read-only reporting. Read, per repo, whatever exists: `CLAUDE.md`, `AGENTS.md`, `README*`,
`HANDOVER*`/`handoff*`, `.project-memory/POLICY.md` + `config.json`, docs index, newest spec/plan/ADR,
the build manifest (`package.json`, `pyproject.toml`, …) and any to-do/plan file. If memory MCPs are
reachable (total-recall, avios-context `get_project_state`, Knowledge-Graph), pull project state too. Total Recall remains conversational/session memory;
Knowledge-Graph supplies repository symbols, dependencies and local semantic code context. Verify its
freshness and provenance; do not pretend its code index contains conversational history.
Tag all of it `[CLAIM]` until P3/P4 verify it. A repo where doc-refs exits 1 is "docs UNVERIFIED".

## P2 Secure uncommitted work (T1), a STOP before acting

Build a plan table from every `attention[]` item of every *may be changed* repo. Each row shows the files
(untracked ones by name), total size, binary/large-file flags, target branch, commit range, and destination remote
with its visibility (public/private). Present the table; existing explicit permission to secure the scoped work satisfies that approval.
Ask only for rows outside that authority or requiring a new material decision (the user can strike rows).
Audit-only repos get report-only rows. Skip the skill's own outputs.

| Finding | Proposed action |
|---|---|
| Worktree/checkout used by a session active < 2 h (any of the session's `cwds` in `sessions.json`, `lastActive`) | Report only (Hard rule 5) |
| Dirty checkout or worktree (any branch) | **Copy out, never commit in place** (someone else may own that index). `git diff --binary HEAD > $SCRATCH/<slug>.patch` plus the untracked files (listed by name in the plan), `git worktree add <path> -b rescue/<branch>-<RUN> HEAD`, apply and commit there. PR base = the original branch if it is on the remote, else the default branch. The original checkout is left as it was; tell the user it can be cleaned once the PR is verified |
| `unpushedBranches[]`: `no-upstream` / `ahead` / `upstream gone`, `at-risk` (commits on no live remote) | Scan the outgoing range, then push to the repo's discovered remote: `git push -u <remote> <branch>` |
| `unpushedBranches[]` with status `upstream … deleted on server` or `tracking ref only, branch deleted on server` | The server no longer has the branch, so its commits may exist only here. Push to a new name, never re-create the deleted one silently: `git push <remote> <ref>:refs/heads/rescue/<name>-<RUN>` → draft PR |
| `unpushedBranches[]` entry with `mergeTailAfterPr` | Unpushed merge commits follow the merged PR and at least one carries its own edits or a conflict resolution (its tree differs from a clean re-merge of its parents). Push the branch to `rescue/<branch>-<RUN>` and draft a PR; cherry-pick cannot carry a merge |
| `unpushedBranches[]` with status `tracks local branch …` | Its upstream is a local branch, not a server. Push as an ordinary at-risk branch |
| `localOnlyTags[]` | Commits held only by a local tag (on no branch, no server). `git push <remote> refs/tags/<tag>` after the scan, or a rescue branch at the tag |
| Worktree whose status could not be read but whose folder exists | Report only; inspect it by hand. Never `git worktree prune` it before the user has looked |
| Detached worktree whose orphan check failed | Treat as orphan commits (row below) |
| `unpushedBranches[]` entry with `error` | The check itself failed (corrupt or shallow repo); report it and treat the branch as unsaved. Never mark it safe |
| `unpushedBranches[]` entry with `unverifiedPr` | `git fetch <remote> pull/<n>/head` (read-only), re-run repo-state; it then classifies as landed, after-merge or at-risk |
| `unpushedBranches[]` entry with `mergedIntoOtherBase` | The PR landed in another branch, not the default; push as above and name that PR and base in the plan |
| `afterMergeTails[]`: commits after a merged PR's head (`prHead`, `tailCommits` oldest first, merges and default-branch commits already excluded) | Never push onto the merged PR's branch. `git worktree add <path> -b rescue/<branch>-tail-<RUN> <remote>/<default>`, then `git cherry-pick <tailCommits...>` there (conflict → `git cherry-pick --abort`, stop that row, report), scan, push, draft PR whose body names the merged PR |
| `landedBranches[]` (`landed` via a merged PR into the default branch, or `on-remote`) | Report only, as a count plus the list. At P6 offer deletion item by item: `kind: local` → `git branch -D <branch>`; `kind: remote` → a separate, explicit remote-branch deletion naming the remote, or, when its status says the branch is already deleted on the server, `git fetch --prune <remote>` (local tracking refs only). Never more than one item per approval |
| `merged PRs not checked` attention item (`--no-gh`, no gh, or not GitHub) | Nothing could be shown as landed, so squash-merged branches appear as `at-risk`; say so in the plan. Same for `merged PR list hit the … limit` (older branches) |
| `remote <name> unreachable` attention item | `on-remote` for that remote rests on local tracking refs that may be stale; re-run online before deleting anything |
| Detached worktree with orphan commits | `git branch rescue/<RUN>-<sha7> <sha>` → scan → push → PR |
| `pushed, not merged, no open PR` | Draft PR via the repo's provider (`gh pr create --draft …` / `glab mr create --draft …`) |
| Repo with no provider | No push or PR: `git bundle create $SCRATCH/<repo>-<RUN>.bundle <branches>` + patch, scanned, listed for the user |
| Stash | Show `git stash show -p <sha>`; if approved: new worktree on `rescue/stash-<sha7>`, `git stash apply <sha>` there, commit. Never pop or drop |
| Behind upstream / generated junk / `.knowledge-graph` rewrites | Report only |

Immediately before each commit or push, re-check `git branch --show-current`, `HEAD`, `git status` and
`.git/index.lock` (another process mid-operation) against the approved row; any difference → stop that row and
re-ask. Inspect `git diff --cached`, run the secret scan, write a message describing the actual change. Every pushed
branch gets a draft PR/MR (or a bundle, for providerless repos). Record them for `$SCRATCH/continuity/BASELINE.md`.
Merges are asked at P6, and only for PRs with green CI.

**Pushing onto a branch that already has a PR** (open or draft) changes what that PR's CI runs. Before the push,
have the outgoing diff reviewed for CI regressions (a T3 subagent, or PAL `precommit` where P0 consent allows):
give it the repo's CI definitions (`.github/workflows/*.yml`, `.gitlab-ci.yml`, …) and ask, step by step, whether
the change breaks any of them. A likely break, or one the review cannot rule out → push to
`rescue/<branch>-<RUN>` with its own draft PR instead, and say why in the plan. MAH, 2026-10-15: a push onto an
open PR branch would have broken its CI step 11.

## P3 Session digest (T2)

For each session in `sessions.json` (newest first; when the prompts are not enough, open the `.jsonl` for a CLI
session, or use Codex `read_thread` / Claude `list_events` or `search_session_transcripts` for a desktop one):
what was asked, promised, left unfinished, decided. **Summarise; never copy tool results or anything
credential-shaped** out of a transcript. Verify each "done" claim against the repo (commit, test, file).
Output: `claim · session · VERIFIED / CONTRADICTED / UNVERIFIED · evidence` → `$SCRATCH/continuity/BASELINE.md`.

## P4 Baseline (T2 runs, T3 judges)

0. Steps 1–2 run in a **disposable baseline worktree**, never in a user checkout:
   `git worktree add --detach $SCRATCH/baseline-<repo> <HEAD-sha>` (P2 already secured uncommitted work, so the
   baseline is the committed state). List these worktrees for cleanup at P9; remove only with the user's OK.
1. **Graph**: refresh only the engine the project already uses: the one named in `.project-memory/config.json`,
   or `.knowledge-graph/meta.json` → `npx --no-install knowledge-graph analyze` (add `--embeddings` when
   `stats.embeddings` > 0). No engine configured → report it, do not create one. Afterwards run
   `git diff --stat -- CLAUDE.md AGENTS.md` and restore them if analyze rewrote them.
2. **Build/tests**: read each command's script body first. Skip and report anything that deploys, migrates,
   publishes or touches remote hosts or production. Run build, lint, typecheck, tests; record counts and the
   first failure verbatim. No test command → `NO TESTS` (UNVERIFIED), and P7 code fixes must add a harness first.
3. **Live dependencies** named in docs: one cheap read-only probe each; unreachable = UNVERIFIED.
4. Write `$SCRATCH/continuity/BASELINE.md`: commit SHA per repo + these results. Nothing inferred. Provisional until P6 re-runs it on the post-merge SHA.

## P5 Drift register (T3)

Inputs: `doc-refs.json` (all `high` and `medium`; `low` may be sampled), the P3 table, and the list of **every**
tracked doc. Security, operations, runbook and deployment docs are always checked in full, never sampled.
Fan out one reviewer per doc cluster (spec/plan, README/setup, ADRs, handover): native Codex collaboration or Claude Agent/Workflow calls
as supported (see SKILL.md). If unavailable, review each cluster sequentially. Each extracts checkable claims and verifies them against
code and graph (`knowledge-graph query` / `context`). Types: `DOC-STALE` · `CODE-MISSING` · `CODE-DIVERGED` ·
`UNDOCUMENTED` · `DEAD-REF`. Every entry needs doc file:line plus code file:line or command output; drop the rest.
A cluster that could not be checked is listed as UNVERIFIED, not omitted. The register header states coverage
(docs checked / docs total, claims checked, what was sampled). Write `$SCRATCH/continuity/DRIFT-REGISTER.md`.

## P6 Decisions (main session), a STOP

Show the register by severity. Per item (≤ 4 per question batch): **fix code · fix doc · defer · accept**,
recommendation first. Also ask which P2 PRs (CI green) to merge, and any queued `DECISIONS.md` questions.
No drift found: say "no drift found among N checked claims (coverage: …)", never "zero drift"; P7 then has no fixes.

After the answers:
1. Merge exactly the PRs the user named (per the repo's merge rules) and wait for each merge commit.
2. For every *may be changed* repo that needs fixes or holds the artifacts: `git fetch <discovered-remote> <default>`,
   take `SHA = git rev-parse FETCH_HEAD`, confirm every recorded merge commit is in it
   (`git merge-base --is-ancestor <merge-sha> <SHA>`; retry the fetch if not), then
   `git worktree add <sibling-path> -b continuity/<RUN> <SHA>`. This applies to every repo with a reachable remote,
   whether or not it has a PR provider. Only a repo with no remote at all branches from local `<default>`, and its
   freshness is recorded as UNVERIFIED.
3. Re-run `repo-state` and the P4 test suite on that SHA; that SHA is the baseline. Update `BASELINE.md`, then move
   `$SCRATCH/continuity/*` into `D`.

## P7 Remediation (T3 plans, T2 applies)

0. Resuming P7 after a restart, a crash or a context reset: repeat the P0 step 0 live-session check first. P7 pushes
   commits, so a second session continuing the same run is most costly here.
1. `D/REMEDIATION-PLAN.md`: one task per decided item, acceptance check, blast radius
   (`knowledge-graph impact` upstream before touching any symbol), rollback.
2. Apply in each affected repo's `CB` (sibling repos get their own `continuity/<RUN>` branch and PR): code fixes
   test-first (RED → GREEN), doc fixes alongside. Fixes in audit-only repos become TODO items instead.
3. Refresh the graph (P4 step 1); re-run `doc-refs` and the P4 suite; nothing green may go red.
4. Update the project's own to-do/plan file if it has one (in `CB`). Conversational memory-store write-back (avios-context,
   Total Recall) is only *prepared* here: `D/MEMORY-UPDATES.md` lists store, namespace, whether it
   leaves the machine, and the **exact serialized payload**, each scanned under § Secret scan. Executed at P9 only
   as approved, byte for byte.

## P8 To-do, alignment gate, review (T3 + T4)

1. Draft `D/TODO.md` (template): remaining work in dependency order with acceptance criteria and size.
2. **Alignment gate**: re-run the P5 claim check on every `fix code` / `fix doc` item. Proceed only when each is
   resolved; the only open items allowed are ones the user chose to `defer` or `accept`.
3. **Cross-vendor review**, reviewer per MODELS.md. Review set: P2 PR diffs, the P3 claim table, `BASELINE`,
   `DRIFT-REGISTER`, `REMEDIATION-PLAN`, the continuity diffs, `TODO.md`. **Send only what the P0 consent allows**
   per repo (artifacts-only repos: no diffs or code). Secret-scan each item first; send per PAL payloads (below). Tools: `codereview` for diffs, `consensus` (reviewer stance `against`) for the
   plan and to-do, `precommit` before pushing `CB`. Ask it to refute, not approve.
4. Triage: valid → fix; invalid → reason in `D/REVIEW.md`. Re-review fixes. Stop at a clean round or after
   3 rounds; open findings after round 3 block P9 until the user rules on them.
5. PAL unreachable after the probe → report; offer retry later, a different other-vendor model, or skip
   (recorded in REVIEW.md). Never relabel a same-vendor review as cross-vendor.

## P9 Hand-off (main session), a STOP

1. Ask the open questions (≤ 4 per question batch; the rest stay in `DECISIONS.md`), including approval of
   `MEMORY-UPDATES.md` store by store. Execute only the approved memory writes.
2. Per repo with a `CB`: scan staged changes and commit (the primary repo's commit includes `D`); scan the full
   outgoing range against the remote; push to the discovered remote and open a draft PR/MR, or for providerless
   repos write a scanned bundle + patch instead. Do not merge anything.
3. Give the user the mission line (`/goal` is user-invoked only, so the build starts when they run it):
   `/goal Complete every task in <abs path>/TODO.md in order; each row's acceptance criteria is its definition of done; final cross-vendor validator: <model id>`

---

## Secret scan

Anything leaving the machine needs a real scanner, `gitleaks` (or `trufflehog`), with its exit status checked.
- Commits about to be pushed: `gitleaks detect --log-opts="<upstream-or-merge-base>..<branch>"`.
- Staged changes: `gitleaks protect --staged`.
- Artifacts and PAL payloads: `gitleaks detect --no-git --source <file-or-dir>`.
- No scanner → block pushes and PAL calls, tell the user, offer to install one. If the user explicitly accepts
  egress without one, run the anchored-pattern grep (`sk-ant-api03-[A-Za-z0-9_-]{80,}`, `gh[pousr]_[A-Za-z0-9]{36,}`,
  `AKIA[0-9A-Z]{16}`, `-----BEGIN [A-Z ]*PRIVATE KEY-----`) as a minimum and record each such payload in
  `DECISIONS.md` as **UNSCANNED-ACCEPTED**. It is never reported as scanned.
- Scanners find credentials, not proprietary code or personal data; the P0 per-repo consent covers those.
- Never print a match; print file:line only.

## PAL payloads

Large multi-file payloads at high thinking time out. First probe the reviewer with a one-line `chat`
(`thinking_mode: minimal`, `max_output_tokens: 20`). Then send one artifact or diff per call via
`absolute_file_paths`, `thinking_mode: medium`, with a `continuation_id` to keep one thread. On timeout:
halve the payload, lower thinking one step, retry once, then move to the next candidate model.
