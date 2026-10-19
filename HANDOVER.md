# BAS-More/skills: active Codex handover

**Status:** ACTIVE
**Status note:** the routing benchmark finished 2026-09-29. What remains is the project-memory continuation. See "Session 2026-10-11".
**Updated:** 2026-10-11 (Australia/Melbourne)
**Default branch:** `main`
**Codex thread:** `codex://threads/01a03bc7-0d2a-75e2-8c3e-c9d125ded17e`
**Primary workstream:** semantic MCP/tool-routing benchmark and skills repository maintenance

## Evidence boundary

The Codex thread transcript is not available through this GitHub checkout or the connected repository API. This handover is reconstructed from the current repository, the retained benchmark handover under `docs/mcp-routing-benchmark/`, branches, commits, and PR history. Any thread-local change that was never committed is **not recovered** by this document.

## Executive state

> **2026-09-29:** the routing benchmark described below is **finished**. See
> "Session 2026-09-29" at the end of this file. The P0-P4 list is kept as the record
> of what was required.

The repository-level skill organization is established and governed by the existing project rules. The most important unfinished work is not ordinary skill curation: it is the routing evaluation documented in:

- `docs/mcp-routing-benchmark/HANDOVER.md`
- `docs/mcp-routing-benchmark/HANDOVER-PROMPT.md`
- `docs/mcp-tool-routing-layer-validation.md`

The research and lexical baselines were completed. The semantic benchmark was not completed because the cloud environment denied access to `huggingface.co`, which prevented the embedding model from being obtained. The retained handover records the measured conclusion that lexical routing does not scale to the real catalogue: on the 412-tool catalogue it reached roughly 21–23% top-1, and real descriptions did not remove that ceiling. The remaining question is whether a genuine semantic backend materially improves the result.

The repository also retains the branch `claude/mcp-tool-calling-layer-9g9q8j`. Do not assume its name means it is the current source of truth. Compare it by content against `main` before reusing or deleting it.

## Completed and preserved

- A real-catalogue routing study and lexical/control baselines exist.
- The benchmark documents record two scorer/harness defects that once produced near-zero results and were corrected:
  - missing workload-prefix normalization;
  - a parser that failed on newline-delimited JSON.
- The research records a critical diagnostic rule: when a gateway scores near zero, validate the scorer before blaming the gateway.
- A control path is specified: semantic BGE and non-semantic hash runs must be executed together so any gain is attributable to semantics rather than hybrid plumbing.
- Repository skill buckets and publication rules remain governed by `CLAUDE-PROJECT-RULES.md`.

## Unfinished work, in priority order

### P0. Recover the exact execution environment

1. From a clean clone, record:
   ```bash
   git status --short
   git branch --show-current
   git log --oneline -5
   git remote -v
   gh pr list --state open
   ```
2. Compare `claude/mcp-tool-calling-layer-9g9q8j` with `main` by content:
   ```bash
   git fetch --all --prune
   git diff --stat origin/main...origin/claude/mcp-tool-calling-layer-9g9q8j
   git log --left-right --cherry-pick --oneline origin/main...origin/claude/mcp-tool-calling-layer-9g9q8j
   ```
3. Preserve any unique work before branch cleanup. A merged PR status is not enough; verify files and commits.

### P1. Clear or accurately report the semantic-model blocker

The existing benchmark handover says the cloud egress proxy denied `huggingface.co`. At the start of a new session, test the blocker once using the documented bootstrap path. Do not repeatedly retry, tunnel around policy, change download hosts without review, or label a policy denial as a product failure.

If the denial remains, set this handover to `BLOCKED` and record the exact command, exit status, and denial message. The user must change the cloud environment policy in the UI; a running session cannot retroactively acquire that permission.

### P2. Run the semantic and control evaluations together

Once the embedding model is genuinely available, run from the benchmark directory using the retained commands:

```bash
THV=/tmp/thv EMBED_PYTHON=/tmp/embvenv/bin/python ./run-semantic.sh bge tokens
THV=/tmp/thv EMBED_PYTHON=/tmp/embvenv/bin/python ./run-semantic.sh hash tokens
```

For each run, record:

- backend and model;
- exact commit and configuration;
- top-1 and any other agreed metrics;
- empty-result rate;
- embedding request count;
- tool-surface overhead;
- errors and exclusions.

A semantic run with **zero embedding requests is invalid**, regardless of its score.

### P3. Interpret without tuning to the answer

Do not tune the query set, labels, catalogue, or `hybridSearchSemanticRatio` to make semantic search look better. Report disappointing numbers plainly. The decision is whether semantics beats the measured lexical ceiling under a fixed protocol, not whether the benchmark can be optimized after observing the result.

### P4. Close the research loop in the repository

Update `docs/mcp-tool-routing-layer-validation.md` with:

- the exact two-run comparison;
- whether semantic routing materially beats lexical;
- operational costs and failure modes;
- recommendation: ship, reject, or run a named follow-up;
- reproducible commands and environment details.

Then update the benchmark handover and this root handover. If no engineering work remains, change `Status:` to `COMPLETE`.

## Validation and repository rules

Before committing skill changes, verify the repository publication invariants:

```bash
./scripts/check-invariants.sh
```

It checks all of them mechanically, and the `Skill invariants` workflow runs it on
every pull request that touches `skills/`, `README.md`, the plugin manifest, or the
checker itself. The rules it enforces, unchanged from `CLAUDE-PROJECT-RULES.md`:

- every skill in `engineering/`, `productivity/`, or `misc/` is linked from the top-level `README.md`;
- every promoted skill appears in `.claude-plugin/plugin.json`;
- `personal/`, `in-progress/`, and `deprecated/` skills do not appear in those public indexes;
- each bucket README lists each skill with a link to its `SKILL.md`.

Reading the list by hand is no longer the check; it is the documentation of what the
check does. This list was a manual checklist up to 2026-10-06, and item 5 of the
routing benchmark's definition of done was missed under it (see "Session 2026-09-29").

Run the benchmark-specific checks documented beside the scripts. Do not use a generic green exit as proof that embeddings were exercised.

## Traps already paid for

- `pkill -f <pattern>` can kill the shell running it.
- A network policy change is normally read at session start; changing policy does not repair an already-running cloud session.
- Marketing claims are not implementation evidence.
- Counts alone are weak: two configurations can expose the same number of tools while exposing different server names.
- Do not commit model caches, tokens, credentials, virtual environments, or generated benchmark bulk unless the repository explicitly tracks them.

## Definition of done

This handover may be marked `COMPLETE` only when:

1. unique branch/thread work is either merged, intentionally archived, or explicitly declared unrecoverable;
2. the semantic backend ran and made non-zero embedding requests, or the owner formally closes the experiment without it;
3. semantic and hash controls were run under the same fixed protocol;
4. results and recommendation are committed to the validation document;
5. repository indexes and plugin manifest are consistent;
6. the final commit and PR are pushed and all required checks are green or their limitations are explicitly accepted.

## Handover maintenance

On every meaningful session stop, update this file and `HANDOVER-PROMPT.md` in the same commit. Keep the detailed benchmark handover for experiment-specific commands, but make this root file the single active status index.


## Independent project-memory templates, 2026-09-14

Avi separately requests the comprehensive MAH graph workflow across existing
repositories, with an offer for future projects. This independently requested
documentation work does not replace or complete the original ACTIVE semantic
routing benchmark.

Branch: `codex/project-memory-bootstrap-20260914`, based on skills commit `f980d479e904f3e2ee74db4534d7c291b00887db`.
Deliverables: `docs/project-memory/README.md`, `AGENTS.template.md` and
`GLOBAL.template.md` in that directory. They define an agent-readable bootstrap
policy, routine graph usage, nine-view coverage, privacy, acceptance criteria and
the user-level future-project offer.

Reference MAH: `688eee19709632f1a5fb6900184ff89217dddea1`; analyzer:
`557277c88feafbfd8b232ceacfda59d64b61ef81`.
The MAH implementation is project-specific. These templates do not supply a
generic executable installer, install tools on any computer, enroll repositories
or guarantee arbitrary agents comply. Source factoring, per-stack adapters,
pilot validation, individual target PRs and client configuration remain.

Read-only preparation used GitHub API equivalents for repository HEAD, tree and
open-PR inspection; no local Git worktree or project command was available because
the execution environment failed initialization. Reviewed the templates and
their source references; no runtime/installer/application test is claimed.
Existing skill buckets/public indexes and benchmark files are unchanged.

Continuation: read docs/project-memory/README.md and preserve the independent
ACTIVE workstream. Once an authorized execution host is available, implement and
validate the shared installer before representing this as automatic setup.
Keep the target repository's existing instructions, hooks and source data intact.


## Independent project-memory installation, 2026-09-14

This section supersedes the installation TODOs in the earlier template-preparation
section. It does not complete the original ACTIVE routing benchmark.

The owner authorized installation across existing repositories and active coding
clients. `scripts/project-memory/install.mjs` implements reversible policy setup,
identity/choice recording and instruction pointers while preserving original text,
frontmatter, line endings, hooks and supported instruction aliases. It is a policy
installer, not a universal nine-graph engine. See `docs/project-memory/INSTALL.md`.

The original eight tests passed on AVISURFACE; all nine tests passed in Linux and
Windows CI (run 34849931323). A later local repeat timed out; the final client
configuration was installed from the CI-verified source and hash-verified. Active
Codex override and Claude user rules include the future-project offer. No fresh
interactive agent session was used to prove behavioral compliance.

Each eligible target received an isolated PR with exact content/diff verification.
Normal merges proceed only with the verified head and clean checks; required
reviews, failing/pending checks and repository workflow constraints stay blockers.
See `docs/project-memory/rollouts/2026-09-14.json` for the aggregate snapshot.
Detailed repository inventories and client receipts are kept privately by the owner.
MAH's existing graph system is preserved. No project is marked graph-complete merely
because its policy files merged. The eight MAH external-service tests remain pending.

Privacy correction: the public PR initially contained repository-name and branch/status
metadata. HEAD contains aggregate counts only. Earlier public PR commits still retain
that metadata; removing the current inventory does not erase commit history. The
inventory did not contain credentials or source-file contents. Keep all detailed
portfolio records private and squash this PR when its normal merge gates pass.

Continuation: use the private rollout record to resolve open repository gates;
bootstrap and validate graphs per project under POLICY.md. Do not recreate verified
PRs or re-upload inventories. Maintain the separate benchmark handover unchanged.

Final installer validation: 11 tests pass on Linux and Windows in run 34859254533.
Three target formatter failures caused by the new memory files were corrected with
reviewed Markdown content, preserved existing instructions and source/block hash
receipts. Repository CI remains authoritative for their remaining gates. MAH's local
session freshness check passed with all nine views and fingerprint
`03424bdb1964993a731980ad3c6424c63de74112bb4adecee92148ffeb6a26e0`.


## Session 2026-10-11: the stated invariants are enforced, and the audit gate exists (Claude Code, branch `claude/repository-code-review-l65q2b`, PR #21 merged as `5951462`)

Two commits, `023b64b` and `720dbde`, merged via PR #21. Both are on `main`.

### What was wrong

`scripts/check-invariants.sh` enforced **eight** rules while `CLAUDE-PROJECT-RULES.md`
and `.agents/invocation.md` state **fifteen**. Three of the seven unenforced ones had
already drifted, which is the argument for enforcing the other four:

| Rule | Was it holding? |
|---|---|
| 8. a docs page per promoted skill, carrying the fixed frame | yes |
| 9. an `agents/openai.yaml` beside every `SKILL.md` | **no** |
| 10. the two invocation declarations agree | yes |
| 11. `ask-matt` names every user-invoked skill | yes |
| 12. no em-dash in the repository's own prose | **no**, 66 across six files |
| 13. an entry point's pointers exist or say "when present" | **no** |
| 14. `HANDOVER.md`'s `Status` is one of the three gate values | **no** |

`AGENTS.md:29` told a reader to follow the rules in `AGENTS-PROJECT-RULES.md`, which
has never existed at any revision, five lines after qualifying the same filename with
"when present". Every Codex session entering through `AGENTS.md` therefore reached none
of the rules that govern this fork. It now uses the generic form `CLAUDE.md` already
had, and lists `CLAUDE-PROJECT-RULES.md` in its read order.

The project-memory installer carried three defects silently. `atomic()` created its
temp file at `0600` and never restored the destination's mode, so installing rewrote
`AGENTS.md` from 644 and `CLAUDE.md` from 664 to owner-only; git models only `100644`
against `100755`, so the downgrade was invisible in review while `INSTALL.md` promised
no broad permission changes. `status` answered from existence, so a tree whose
`POLICY.md` had been edited reported `policyInstalled: true` and exit 0 while `plan` on
the same tree refused. And a declined choice recorded for another repository produced
output byte-identical to a local decision.

`sync-plugin-version.mjs --check` had no caller at all: `npm run version` writes rather
than checks, this fork guards `release.yml` off, and neither path filter named
`package.json`.

There was no dependency audit and no `dependabot.yml` at any path, while `npm audit`
reported 18 advisories, 16 of them high, through the `@changesets` toolchain. Both
sibling repositories gate this and both pass.

### Commands and results

```
npm test                          61 passed, 0 failed   (was 35)
./scripts/check-invariants.sh     exit 0, 15 rules      (was 8)
npm run check-plugin-version      exit 0, now a CI step (was reachable from no job)
shellcheck -S style x3 scripts    exit 0, zero findings
npm audit                         3 vulnerable packages -> 2
```

CI on the merged head: `invariants`, `installer (ubuntu-latest)`,
`installer (windows-latest)` and both Socket Security checks, all green. The Windows
run matters: the permission test is POSIX-only and skips there, so a green Windows job
is what shows the `fchmod` change did not break the platform with no such modes.

Every new rule was mutated and the suite re-run. Each mutation killed exactly its own
test and nothing else, so none of the new tests is vacuous.

### Two handover items closed

- **`Status:` normalised** to the enum `00-READ-FIRST.md` gates on. The sentence it
  held moved to a `Status note:` line, and rule 14 now enforces the field, so the gate
  is machine-checkable for the first time.
- **`shellcheck` run.** The previous session recorded it as blocked by egress policy.
  `apt-get install shellcheck` succeeded here, and all three shell scripts are clean at
  `-S style`, which is stricter than the default. With `-o all` it emits style
  preferences (`${VAR}` braces, `[[ ]]` over `[ ]`); those are opt-in pedantry and no
  rule in this repository asks for them.

### Two things that need an owner decision, not more work

1. **`CLAUDE-PROJECT-RULES.md` and `.agents/writing-docs.md` contradict each other.**
   The first says a finished docs page carries four sections. The second, which the
   first defers to for the template, says to omit "Common questions" where the question
   hunt is thin and warns that padding a thin page out fills the section with questions
   nobody has. `docs/productivity/wait-what.md` omits it correctly. An earlier pass of
   this review called that page non-compliant and was wrong, and the first version of
   rule 8 duly failed it. Rule 8 now enforces only the fixed frame (`What it does`,
   `When to reach for it`, `Where it fits`), which all 28 pages carry, and a test pins
   that a page may omit "Common questions" so the rule cannot be tightened back into a
   false positive. Choosing which document yields is not a decision this session should
   make.
2. **`braces` (high, GHSA-vfj7-8cjw-p6xm)** reports its fix only via
   `npm audit fix --force`, meaning a major bump of what pulls it in. That is a
   changelog to read, not a lockfile edit. `sprintf-js` (moderate,
   GHSA-hp3w-g68c-fv3c) claims an in-range fix that this refresh did not reach.
   Dependabot will now raise both.

### One incidental finding worth keeping

`package-lock.json`'s own root version read `0.0.0` while `package.json` and
`.claude-plugin/plugin.json` both said `1.3.1`. All three agree now. The version check
compares the first two; the lockfile is a third copy it does not cover.

### Still open

The project-memory continuation, unchanged and untouched by this session. See the
sections dated 2026-09-14 below.

## Session 2026-09-29: routing benchmark finished (Claude Code, branch `claude/go-bd9ae8`)

**P0-P4 of the routing benchmark are done.** The semantic run happened.

- **P0 (environment).** `main` was `83d2b74` at session start (now `27cf1e4`, after
  PR #12). `claude/mcp-tool-calling-layer-9g9q8j`
  no longer exists on the remote; its last PR head (#8, `9d77188`) is an ancestor of
  `main`, so nothing on it was lost. The Codex thread transcript remains unrecoverable
  and is declared so. The one unique commit found elsewhere, `eb3aa72` on
  `docs/drop-deprecated-qa-reference`, landed in `main` as `8e24f26` via PR #12.
- **P1 (blocker).** From the owner's PC, `huggingface.co` returned 307 → 200. The
  denial applied only to the Claude Code cloud environments. No mirror or substitute
  model was used.
- **P2 (runs).** The protocol was pre-registered and pushed before any score
  (`c378438`, `ab3199a`). All rows ran in a Linux container (`golang:1.24-bookworm`,
  Python 3.11.2, Go 1.26.0 via `GOTOOLCHAIN`) on the owner's remote Docker context
  `neko`, capped at 1.5 CPU / 1.2 GB because that host also runs staging services.
  ToolHive was pinned to `8343851e`. The model was `fastembed` 0.8.1 →
  `Qdrant/bge-small-en-v1.5-onnx-Q@aa8f8b06`.
- **Results.** The build reproduced both published baselines exactly (lexical
  21/44/49%, 1/43 empty; hash control 21/33/44%, 0/43). bge at the protocol ratio
  0.6 scored **44% top-1, 56% top-3, 60% top-5, 0/43 empty**, with 44 embedding
  requests. Repeats were identical. McNemar: vs hash control p = 0.006 (top-1 and
  top-3); vs pure lexical top-1 p = 0.021, top-3 p = 0.18. "change the schema
  safely" is still missed.
- **Finding.** ToolHive's hybrid search is semantic-first slot splitting, not score
  fusion (`hybridSearchLimits` / `mergeResults` in
  `pkg/vmcp/optimizer/internal/toolstore/sqlite_store.go`).
- **P3/P4.** The pre-registered verdict is "semantic materially beats lexical". It
  clears the 10-point bar against pure lexical by one query, and its significance
  test was met only against the non-semantic control. The recommendation is
  unchanged (the top-3 bar of 65% was not met). Written up as "Run 4" in
  `docs/mcp-tool-routing-layer-validation.md`. Per-row outputs, raw probe
  transcripts and `environment.txt` (build info, model hashes, container limits)
  are in `docs/mcp-routing-benchmark/results/run4/`.
- **Review.** An adversarial pass (4 independent reviewers: evidence, source
  mechanism, protocol compliance, statistics) raised 39 findings before commit. A
  second pass (2 reviewers) checked the fixes and raised 17 more, all low or
  medium. All were corrected or disclosed. The most serious was that the first
  draft had drifted from the pre-registered recommendation. Only per-row Wilson
  intervals are reported, not intervals on the paired differences; the write-up
  says so. The harness version line, which printed a banner, was fixed after the
  runs; the fix does not affect scoring.

Definition of done for the routing benchmark: items 1-6 are met.

- Item 5 was not met at first: `.claude-plugin/plugin.json` listed none of the four
  `skills/misc/` skills (`git-guardrails-claude-code`, `migrate-to-shoehorn`,
  `scaffold-exercises`, `setup-pre-commit`), although `CLAUDE-PROJECT-RULES.md`
  requires it. This predated the session. On the owner's decision (2026-09-29) the
  four entries were added on branch `claude/plugin-json-misc`, in README order.
- Item 6: the Run 4 PR #13 was merged by the owner on 2026-09-29 (merge `578950f`).
  Both Socket Security checks passed; CodeRabbit was still pending at merge.

Also this session: PR #12 (`project-memory-v2`: task-scoped project-memory wording
plus `eb3aa72`) was applied and tested here, then pushed, opened and merged by the
owner on 2026-09-29 (merge `27cf1e4`). Its installer tests passed 14/14 locally
before the push. The greyrok
transfer branch it came from is deleted.

Project memory: this repository has no `graph:*` commands or graph tooling, so the
graph steps were skipped. No graph was built or claimed.

State Git cannot show: the benchmark container `routing-bench-bd9ae8` and the two
images pulled for it (`golang:1.24-bookworm`, `alpine:3`) were removed from the
`neko` Docker host after the evidence was copied into `results/run4/`. Verified
with `docker ps -a` and `docker images`; the host's pre-existing `alpine:latest`
was left alone.

Remaining work, in order:

1. Owner review and merge of the `claude/plugin-json-misc` PR (the four `misc`
   entries in `plugin.json`).
2. The independent project-memory continuation above (per-project graph bootstrap
   and acceptance) is unchanged by this session.
3. Optional routing follow-ups (rank fusion, larger model, current ToolHive HEAD)
   are listed under "Status" in the validation doc. None is required.

## Session 2026-10-06: publication invariants automated (Claude Code, branch `claude/repository-code-review-l65q2b`)

`main` was `0741c29` at session start and is unchanged by this session apart from this
branch. The previous session's remaining item 1 (merge of `claude/plugin-json-misc`)
is **done**: PR #14 landed as `fad207d`, so all four `skills/misc/` entries are in
`.claude-plugin/plugin.json`. Items 2 and 3 are untouched.

**What changed.** The publication invariants in `CLAUDE-PROJECT-RULES.md` were
convention-only: nothing checked them, and the only thing between an unpromoted
draft and the public plugin index was whoever remembered to edit three files at once.
They are now enforced:

- `scripts/check-invariants.sh`, six checks: every skill directory has a `SKILL.md`;
  every public skill has a manifest entry; every public skill is linked **by name**
  from `README.md`; no `personal/`/`in-progress/`/`deprecated/` skill appears in
  either public index; every bucket README lists each of its skills with a link and a
  one-line description; every manifest entry resolves to a real skill.
- `.github/workflows/skill-invariants.yml`, which runs it on pull requests and pushes to
  `main` that touch `skills/**`, `README.md`, `.claude-plugin/plugin.json`, the
  checker, or the workflow. Those five paths are exactly the checker's inputs, so the
  path filter cannot skip a run that would change the outcome.

**Deliberately dependency-free** (bash + coreutils + grep; no node, no jq) so the
same command runs in CI, in a pre-commit hook, and on a laptop with nothing
installed. The manifest is a flat list of path strings, so a fixed-string grep reads
it correctly regardless of key order, and a skill name is never reinterpreted as a
regex.

**Verification.** `./scripts/check-invariants.sh` exits 0 on `0741c29`. Each of the
six checks was then confirmed to actually fire, against mutated copies in a scratch
directory (the repository was never dirtied):

| Mutation | Result |
| --- | --- |
| skill directory with no `SKILL.md` | fires (4 checks) |
| the four `misc/` entries removed from the manifest, replaying the `fad207d` bug | fires, naming all four |
| README link target changed away from `SKILL.md` | fires |
| README link target correct but text does not name the skill | fires |
| private skill added to the manifest | fires |
| private skill referenced in `README.md` | fires |
| bucket README entry deleted | fires |
| bucket README entry left with no description | fires |
| bucket README "description" that is only an em-dash | fires |
| manifest entry pointing at a nonexistent skill | fires |

Two of those cases were found by this testing rather than by review: the description
check first passed a bare `**[name](./name/SKILL.md)**` line, because the house
format's trailing `**` satisfied a naive "any character after the link" test. It now
cuts the line at the link with a literal match and requires at least
`MIN_DESCRIPTION_CHARS` (10) of prose. A checker that only ever passes is worth
nothing, so the negative cases are the evidence, not the clean run.

`bash -n` is clean. `shellcheck` could **not** be run: this cloud session's egress
policy returned 403 for its binary download, so the script is behaviour-tested but
not statically linted, so worth running once in an environment that has it.

**Not changed, deliberately.** The `Status:` field at the top of this file now holds
a prose sentence, while `00-READ-FIRST.md` defines it as the enum
`ACTIVE | BLOCKED | COMPLETE` and keys the mandatory session gate on it. A careless
or automated reader cannot parse the current value. Left alone because it changes
gate semantics and was outside what this session was asked to do; it is a one-line
fix for whoever owns that decision.

Remaining work, in order:

1. The independent project-memory continuation (per-project graph bootstrap and
   acceptance) is unchanged by this session.
2. Optional routing follow-ups (rank fusion, larger model, current ToolHive HEAD)
   are listed under "Status" in the validation doc. None is required.
3. Normalise the `Status:` field above to the documented enum, and run `shellcheck`
   over `scripts/check-invariants.sh` where the binary is available.

## Session 2026-10-06: upstream sync (supersedes PR #15)

PR #15 (`mattpocock/skills:main` into `main`) could not be fixed in place: its head is the
upstream repo, which BAS-More cannot push to. Instead, branch `sync/upstream-2026-10-06`
merges `upstream/main` (4588b32, 409 commits) into `main` (0741c29) with conflicts resolved:

- Kept the fork's `CLAUDE.md` / `AGENTS.md` handover entry points (`AGENTS.md` stays a regular
  file, not upstream's symlink). `CLAUDE-PROJECT-RULES.md` now carries upstream's new rules plus
  a "BAS-More fork deviations" section.
- Kept the four `misc/` skills in `plugin.json` and the README (PR #14), and the `personal/`
  bucket with `phone-backup-before-reset`. Upstream removed `write-a-skill`, `edit-article`,
  `obsidian-vault`, and `CONTEXT.md` (now `GLOSSARY.md`); those removals were taken.
- Took upstream for the in-progress README and `setup-matt-pocock-skills`.

Checks: no conflict markers; every `plugin.json` path has a `SKILL.md`; README and plugin lists
match; every engineering/productivity skill has a docs page; `claude plugin validate . --strict`
passes. Upstream's `skills/in-progress/README.md` did not list `chief-of-staff`; a one-line entry
was added so `scripts/check-invariants.sh` passes.

Re-synced 2026-10-07 before pushing: merged `main` 7de6cc4 (PR #16, invariant check; only
`HANDOVER.md` conflicted, both entries kept) and `upstream/main` dd400c3 (26 more commits;
only `CLAUDE.md` conflicted, fork entry point kept and upstream's new "Agent skills / Triage
labels" section moved into `CLAUDE-PROJECT-RULES.md`). Upstream's `release.yml`,
`triage-label.yml` and `needs-info.yml` jobs are guarded with
`if: github.repository == 'mattpocock/skills'` (owner decision, option B) so they stay inert
on this fork; recorded under "BAS-More fork deviations". `scripts/check-invariants.sh` and
`claude plugin validate . --strict` pass.

Remaining: owner review and merge of the sync PR, then close PR #15.

## Session 2026-10-15: `review-and-continue` added to `personal/` (Claude Code, branch `feat/review-and-continue-skill`)

Added `skills/personal/review-and-continue/`, a model-invoked skill for resuming a project: it
inventories repos, worktrees, stashes, recent sessions, docs and the code graph, secures
uncommitted work as draft PRs, records doc-vs-code drift, applies the user's remediation
decisions, gets a cross-vendor review, and hands a to-do list to `/goal`.

- Bucket `personal/`, because it depends on the BAS-More setup (PAL, avios-context, total-recall,
  `/goal`). It is therefore absent from `.claude-plugin/plugin.json` and the top-level README and
  has no docs page, per the fork deviations in `CLAUDE-PROJECT-RULES.md`.
- Three zero-dependency Node scripts (`repo-state`, `sessions`, `doc-refs`) with 20 tests under
  `scripts/test/`. They run under the root `npm test`.
- Reviewed before commit by a 10-agent Claude review and three rounds with `openai/gpt-5.6-sol`
  through PAL. Every confirmed finding was fixed; the last round's four fixes were not re-reviewed.

Checks: `./scripts/check-invariants.sh` reports all invariants hold; `npm test` result is in the PR.
Remaining: owner review and merge of the PR. This does not change the project-memory work above.

## Session 2026-10-15: `review-and-continue` first-run defects fixed (Claude Code, branch `fix/review-and-continue-first-run-defects`)

The skill's first live run (BAS-More/MAH) surfaced six defects; all are addressed in this branch.

- Self-test: `node --test "<abs path>/*.test.mjs"` through a path with a space matched 0 files and
  exited 0. New `scripts/run-tests.mjs` passes each file by path and fails on 0 tests; SKILL.md
  now documents it.
- `repo-state`: `origin/HEAD` (short name `origin`) was reported as a pushed branch with no PR.
  Symrefs are skipped, and pushed branches are compared against the remote's default branch, so a
  local default that is behind no longer flags merged work.
- `repo-state`: squash-merged branches were reported as unsaved work (100 of 110 refs on MAH).
  Branches are now classified with merged-PR data (`gh pr list --state merged`): `landed`,
  `after-merge` (tail commits past the merged PR head, reported in `afterMergeTails`), `on-remote`,
  or `at-risk` (commits on no remote, the only case left in `unpushedBranches`). Without PR data
  nothing is called landed.
- PHASES.md: desktop-app sessions are read through the ccd session tools (P1, P3); cloud and phone
  sessions are recorded as not readable locally. P2 requires a CI-regression review before pushing
  onto a branch that already has a PR. P0 step 0 and P7 step 0 check for another live session
  continuing the same run.

- A 3-lens adversarial review of the first version (18 agents) confirmed 15 findings, all fixed with
  tests: failed git counts now mean at-risk (never safe); "on a remote" is checked against live
  server heads (`git ls-remote`), not possibly stale tracking refs; only PRs merged into the default
  branch count; tails exclude merge and default-branch commits and are emitted as `tailCommits`;
  `ahead` branches are classified too; the base remote is not assumed to be `origin`; the runner
  counts executed tests per file (a file registering none, or only skipped tests, fails).

- Round 2 (11 agents) confirmed 9 more, all fixed with tests: every local branch is now classified
  (a branch whose server copy was deleted but not pruned looked "in sync" and was omitted); stale
  tracking refs are never reported as pushed; detached-worktree orphan counts use live heads and
  fail closed; a merge-only tail after a merged PR is landed only if nothing past the PR head is off
  the live remotes; describe() suites do not count as tests; sessions record every `cwd` (`cwds`).

- Round 3 (12 agents, the last round the skill's own 3-round cap allows) confirmed 10; 9 fixed with
  tests: unpushed merge commits after a merged PR are checked (a merge whose tree differs from a
  clean re-merge of its parents makes the branch at-risk); a clone that has not fetched no longer
  gets false at-risk branches (tracking refs of branches still live on the server count); in-sync
  branches are skipped (100-branch repo: 3.4 s, was 16-33 s; main 1.6 s); `ls-remote` runs
  non-interactive with a 15 s timeout; local-branch upstreams and remote names with a slash are
  handled; unreadable worktrees and local-only tags are reported.
- Not fixed, pre-existing: unpushed commits inside submodules are not inventoried (findRepos stops
  at the superproject). Proposed as a follow-up.

Checks: 35 new tests in `scripts/test/first-run.test.mjs` (55 in the skill); results are in the PR.
Remaining: owner review and merge of the PR.


## Session 2026-10-18: review-and-continue runtime portability

Scope: skills/personal/review-and-continue; isolated branch codex/review-and-continue-portable.
Supports native Claude Code and Codex capabilities, inherited models and already granted scoped
authorization. Total Recall remains session memory; Knowledge-Graph replaces Graphiti references
for fresh repository context. No external vendor payloads sent by this change.

Local transcript inventory now reads both Claude projects and Codex sessions, including linked
worktree turn-context cwds, current cwd and activity times. It filters injected instructions and
duplicate Codex event records. Desktop/cloud completeness still requires native tools and is
explicitly unverified when unavailable. Windows short/long path aliases resolve before matching.

Source impact: listSessions callers are the CLI and existing session tests; readSession and
humanText are private to that module. No graph tooling configured in this checkout; graph
checks skipped under project policy. No dependency, bucket or plugin-registration changes.

Validation: node skills/personal/review-and-continue/scripts/run-tests.mjs passed 56/56
(182765 ms); focused Codex regression passed; git diff --check passed. The first full run
passed the original 55 tests but exposed a Windows path-alias defect in the new regression;
realpath normalization corrected it before the successful full rerun.
Parent review clarified that only conversational memory write-back requires P9; repository
graph refresh remains under the project workflow. Existing session fixtures and CLI checks
now use isolated Claude/Codex roots, never the account transcript store. The six affected
session/CLI tests passed after these changes. Publication invariants, plugin-version check
and git diff --check passed; repo-state completed successfully (--no-gh, PR classification
unverified). Skill gitleaks scan passed. Publication remains for parent review; no push or PR
created by this worker.


## Session 2026-10-20: review-and-continue cheap-model tier

Scope: skills/personal/review-and-continue; branch feat/review-and-continue-cheap-models.
Owner request: pick the cheapest suitable model per job from GLM 5.3, Kimi K3, MiMo V2.6 Pro and
Qwen3.8 Max. Owner decisions: rule plus pool (not a fixed list); per-repo P0 consent per vendor; tool
use through PAL clink; two PRs, nothing installed until the PAL patch is merged.

Added: model-pool.json (with each route's recipients); scripts/model-pick.mjs (ranks the pool
per job by estimated USD from OpenRouter's public list prices, reachability checked per channel,
a reason for every exclusion; exit 1 prices unavailable, 3 bad input); scripts/install-clink.mjs
(dry run by default; refuses on a PAL whose CLIClientConfig has no runner field); four read-only
clink clients in pal/cli_clients/ (Read, Grep and Glob only, dontAsk, no MCP servers, home and
secret-file reads denied); MODELS.md tier C and the matching PHASES.md and SKILL.md changes.
Pool jobs: P3 digest and P8 neutral review via PAL chat, P5 drift first pass via clink. Pool
models never run scripts or builds, touch git, apply fixes, give verdicts or talk to the user;
Claude checks their output. P0 consent is per repo and per recipient, transcripts separately.

Review: a three-lens adversarial workflow (scripts, security, docs; each finding independently
re-verified) confirmed 23 findings, rejected none. All were fixed. The main one changed the design:
the first draft gave the clients a shell under bypassPermissions with a git deny list, which the
security lens showed was bypassable (PowerShell tool, inherited PAL environment keys, vault CLI).

Dependency: stock PAL clink rejects any client not named claude, codex or gemini, and one
rejected file stops the whole registry loading. The runner-field patch is BAS-More/PAL-MCP#7
(commit 72ecb2c, open). install-clink refuses on the live PAL and accepts a checkout of #7.

Validation: run-tests.mjs passed 83/83 (27 new; the PR #7 runner check ran with RAC_PAL_PATCHED
pointing at a checkout of #7, and is a no-op without it); check-invariants.sh passed; no em-dash;
git diff --check clean.
model-pick against live OpenRouter prices on 2026-10-20 ranked GLM 5.3 cheapest for every job.
Not verified end to end: 9router on 127.0.0.1:20128 accepted connections but answered nothing
within 10 s, and PAL chat probes to all four pool models timed out, so no pool model or clink
client has been exercised live. MiMo's route uses OpenRouter, whose vault key is expired.
