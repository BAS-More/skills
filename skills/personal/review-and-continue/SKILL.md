---
name: review-and-continue
description: Re-establishes a verified baseline for an existing project before more work is done. It inventories every repo, worktree, branch, stash, recent Claude Code or Codex session, doc and knowledge graph; secures uncommitted work through PRs; finds doc-vs-code drift and remediates it with the user's decisions; gets a cross-vendor adversarial review; then hands a confirmed to-do list to /goal. Use when resuming a project after a break, on a new machine or account, or when the user says "review and continue", "pick up where we left off", "where are we on <project>", or "resume <project>".
argument-hint: "[project-folder | repo-url]..."
allowed-tools: Agent, AskUserQuestion, Skill, ToolSearch, Workflow, Bash, PowerShell, Read, Write, Edit, Glob, Grep
---

# /review-and-continue

Answers one question before any building starts: **what is actually true about this project right now,
and what is the agreed path forward?** Sessions, docs and memory are *claims*. The repo, the tests and
the live services are *evidence*. The skill turns claims into a verified baseline.

## Runtime adaptation

Discover the tools exposed by this session; names below describe capabilities, not required brands.
Claude Code may use Agent/Workflow, AskUserQuestion and its session tools. Codex may use
`collaboration.spawn_agent`, available question tools, and `list_threads` / `read_thread`.
Never create user-owned chats with `create_thread` for subtasks. Inherit the current model unless the
user selects an available override; unavailable delegation means sequential work, recorded explicitly.
Use an available asynchronous question tool for preferences; if none exists, ask in chat at the next stop.
Use the runtime's supported approval mechanism for permissions. Existing explicit authorization satisfies
its matching gate: record it, present concrete scope, and ask only for authority still missing.
Tool absence never relaxes secret scanning, permissions, evidence requirements or vendor consent.

## Quick start

```
/review-and-continue C:\Dev\ComWatch C:\Dev\sentinel
/review-and-continue https://github.com/org/repo     # not on disk: asks where to clone
/review-and-continue                                 # uses the project named earlier, else confirms the cwd repo, else asks
```

Scripts (Node ≥ 18, no deps, read-only except `install-clink --apply`; JSON on stdout except `install-clink`, which prints text). `S` = this skill's `scripts/` dir.
Write their output to the session scratchpad (`$SCRATCH`), never into a repo.

| Script | What it proves |
|---|---|
| `node S/repo-state.mjs <root>... [--no-gh]` | One entry per repository (worktrees nested): dirty, untracked, stashes (by SHA), no-upstream / gone / ahead branches, detached commits, pushed-but-no-PR branches, graph staleness → `attention[]`. Branches are classified with merged-PR data (`gh`, PRs into the default branch only) and the servers' live heads (`git ls-remote`): `landed` / `on-remote` go to `landedBranches` (not attention), commits past a merged PR's head to `afterMergeTails` (with `tailCommits`), and `at-risk` (commits on no live remote, or a failed check) to `unpushedBranches`. Commits held only by local tags → `localOnlyTags`. Exit 1 = no repo found |
| `node S/sessions.mjs <root>... --days 30` | Recent local Claude Code (`~/.claude/projects`) and Codex (`$CODEX_HOME/sessions`, default `~/.codex/sessions`) transcripts for the project and all its worktrees: title, first/last human prompt, branch. Local transcripts are not a complete desktop/cloud inventory; see PHASES.md P1 |
| `node S/doc-refs.mjs <repo>...` | Paths and `npm run` targets that docs reference but do not exist, ranked high/medium/low. Exit 1 = not a git work tree |
| `node S/model-pick.mjs [--reachable <file>]` | The cheapest model in [model-pool.json](model-pool.json) for each job (digest, drift, review), with an estimated USD cost from OpenRouter list prices, its route, and a reason for every exclusion. Exit 1 = prices unavailable; exit 3 = bad arguments or input. See MODELS.md, Cheap tier |
| `node S/install-clink.mjs --pal <dir> [--add-dir <root>] [--apply]` | The one script that writes: copies the pool's read-only PAL clink clients to `~/.pal/cli_clients`. Dry run unless `--apply`; refuses on a PAL without `runner` support; never overwrites a changed file without `--force`. Exit 1 = refused, 2 = conflicts left, 3 = bad arguments |

Self-test first on a new machine: `node S/run-tests.mjs`. Do not hand `node --test` an absolute glob: through a
path with a space (`C:\Users\First Last\...`) it matches nothing and still exits 0. The runner passes each file
by path and fails unless every file runs at least one test that is not skipped. A failure means the tooling is broken,
not the project. `repo-state` (or its manual git fallback) must work before anything is committed or pushed;
without it the run is read-only. A failing `sessions` / `doc-refs` only marks its outputs UNVERIFIED.

## Workflow

Copy this checklist into the task list. Full instructions per phase: [PHASES.md](PHASES.md).

```
- [ ] P0 Live-session check (resume) → scope roots → discover repos + remotes → STOP: scope, model per tier (MODELS.md), external-review consent
- [ ] P1 Inventory: scripts + handover docs + project memory (all tagged [CLAIM])
- [ ] P2 Secure work plan → STOP: approve → branch, scan, commit, push, draft PRs (never merge)
- [ ] P3 Digest recent sessions; verify each claim against the repo
- [ ] P4 Baseline: refresh the project's own graph engine, run safe build + tests, write BASELINE.md
- [ ] P5 Drift register: docs/specs/plans vs code, with file:line evidence
- [ ] P6 STOP: decision per drift item + PRs to merge → merge → continuity branch(es) on the post-merge SHA
- [ ] P7 Remediate (TDD) on the continuity branch; update docs, graph, memory stores, project to-do
- [ ] P8 Draft TODO.md → alignment gate → cross-vendor adversarial review of everything (max 3 rounds)
- [ ] P9 STOP: open questions + memory write-back approval → continuity PR(s) → /goal mission line
```

Artifacts: `BASELINE.md`, `DRIFT-REGISTER.md`, `REMEDIATION-PLAN.md`, `REVIEW.md`, `TODO.md`, `DECISIONS.md`,
`MEMORY-UPDATES.md`. They live in `$SCRATCH/continuity/` until P6, then in `docs/continuity/<RUN>/` on branch
`continuity/<RUN>` (own worktree, cut from the post-merge default branch). Templates: [TEMPLATES.md](TEMPLATES.md).

## Hard rules

1. **Evidence over memory.** A finding without a command output, file:line or URL is a hypothesis; label it so.
   Zero findings from a check that could not run is UNVERIFIED, never "clean".
2. **Never merge, force-push, reset, drop or pop a stash, or delete a branch/worktree** without the user's explicit
   OK naming the item. "Secure the work" means *a PR exists*, not *it is merged*.
3. **Each repo's own rules win** (CLAUDE.md / AGENTS.md: base branch, branch names, forbidden remotes, PR flow).
4. **Egress is scanned and consented.** gitleaks/trufflehog on every push range, bundle, artifact and PAL payload
   (PHASES.md § Secret scan); repo content goes to another vendor (the T4 reviewer or any cheap-pool model) only as far
   as the P0 per-repo consent for that vendor allows.
   With no scanner, egress happens only if the user explicitly accepts it, and is logged as UNSCANNED-ACCEPTED.
5. **Do not disturb anyone's working state.** Never commit inside or switch the branch of an existing checkout: dirty
   work is copied into a rescue worktree. Skip checkouts used by a session active in the last 2 hours. Re-check
   branch, HEAD, status and index.lock right before every mutation.
6. **Stops are P0, P2, P6, P9**, plus anything crucial (irreversible, money, credentials, product direction).
   Conversational memory-store write-back (avios-context, Total Recall) requires P9 approval.
   Repository Knowledge-Graph refresh follows the project workflow in P4/P7, separately.
   Every other question goes to `DECISIONS.md` and is asked at the next stop.
7. **The build belongs to /goal.** This skill ends at an aligned, reviewed baseline and a mission line; it does not
   run the non-stop TDD build, worker casting or ship gates.
