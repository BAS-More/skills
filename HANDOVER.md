# BAS-More/skills: active Codex handover

**Status:** ACTIVE
**Status note:** the routing benchmark finished 2026-09-29. What remains here is the project-memory continuation, untouched since "Session 2026-10-11". The sessions after it did not advance it; the 2026-10-21/22 and 2026-10-27 sessions worked in `BAS-More/byahad` and changed nothing here but this handover pair. The byahad PRD verdict table was RE-JUDGED again on 2026-10-28 against the tag `prd-verdicts-2026-10-28`, and the tally is now 1 FAILS, 15 PARTIAL, 7 HOLDS, committed as `docs/phase-2-foundation/verdicts-2026-10-28.md`. Exactly one row moved, and NONE of the nine rows whose guards were repaired on 2026-10-28 moved at all: guard coverage and clause satisfaction are different things. See "Tenth stretch". Twenty fixes A to X are done (H blocked), each dry-run before the next and each mutation-proven; A, B and C are in byahad `main`, and D through X are in draft PR #249. THE FULL FIVE-GATE RUN ON THE FINAL STATE IS DONE AND ALL FIVE ARE GREEN on `3766917`, all twenty-six commits. WHAT MATTERS MOST THERE IS NOT IN THE REPOSITORY: the live Supabase project has applied migrations 0001 to 0015 while the repo holds 24, so NINE migrations including every security hardening from 0021 to 0024 have never been applied, and a private task title is currently pushed to every org member over Realtime. Applying them is an owner decision. See "Tenth stretch" first, then "Eighth stretch".
**Updated:** 2026-10-27, later (Australia/Melbourne)
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


## Session 2026-10-21/22: byahad PRD audit settled, remediation started, and this repository not advanced (Claude Code, branch `claude/repository-code-review-l65q2b`)

**Read this before continuing the skills workstream: nothing in P0 to P4 moved.** This
session's work was in a different repository, `BAS-More/byahad`. The routing benchmark,
the project-memory continuation, and the two owner decisions listed in the prompt are
exactly where 2026-10-11 left them. This section exists so a busy session is not mistaken
for progress here. The only change to this repository is this handover pair.

### Graph steps skipped, which CLAUDE.md asks to be stated

`.project-memory/` holds `config.json` and `POLICY.md` and nothing else. There is no
`graph` command on PATH and no graph engine in the checkout, so the documented
session/freshness, context and upstream-impact workflow was skipped rather than built,
which is what CLAUDE.md instructs when the tooling is absent. Installing it is
project-memory setup work and was not authorized in this session. Graph readiness still
has no acceptance evidence.

### What was done in byahad, and where the detail lives

All 23 Phase-2 PRD requirements were judged against `596f53c`, then every one of the 124
independently-failable arms was refuted: 42 contested arms by two independent model
lenses, 82 clean-HOLDS arms by one. Settled result: 9 HOLDS, 14 PARTIAL, 0 requirement
level FAILS, with 52 blocking defects and 87 open questions that collapse into seven
decisions for the owner.

The settled table, the remediation plan, and the seven decisions are a Claude doc:
`https://claude.ai/artifact/W48fj5ZCfuMpEYW1HzbNm3`. It is the source of truth for that
work, not this file.

Shipped: `byahad#236`, squash-merged as `ed71541`. Two fixes, both of which were live on
`byahad` main rather than branch artifacts.

1. Sentry was collecting credentials, cookies, request bodies and client IPs in every
   environment. `resolveDataCollectionOptions` in `@sentry/core` branches on the
   PRESENCE of `dataCollection`, not its content, so a block holding only commented-out
   lines reading "to disable sending user data, uncomment the lines below" selected the
   permissive DEFAULTS and did the opposite of what it said. This was the audit's only
   arm settled at FAILS, on two lenses, with no test able to catch it.
2. `npm audit` was exiting 1 on a high advisory (vite 8.2.0 to 8.2.2) on main itself. The
   step is in CI but deliberately outside the required check name, so it was red without
   blocking merges.

Pending: branch `claude/byahad-nfr8-and-migration-guard` carries fixes 3 to 5 (an
unauthenticated flood that consumed neither rate limiter because a missing Authorization
header returned 401 before both; the shipped rate-limit capacities being unreachable from
any test; and a down-migration pattern whose `^\s*` anchored only its first alternation,
so five mid-line reversal forms passed it). Fixes 6 to 8 are specified in the doc and not
started.

### Method worth reusing, independent of either repository

- Judging whether each requirement HOLDS finds defects. Tracing requirements to citing
  tests finds nothing: a citation is satisfied by a comment.
- Every guard was proven by mutation before being trusted. Several mutations changed a
  design rather than confirming one, which is the point of running them.
- The vacuity classes that kept recurring: `.every()` is true on an empty array; a
  cross-tenant count is 0 when the other tenant has no row; `toHaveBeenCalledWith` passes
  if any call matches; a subset assertion survives a dropped element; a duplicated test is
  green by construction; a per-file check lets one bounded call excuse an unbounded
  sibling; a floor derived from the loop it guards is not a floor; and a guard with no
  positive control proves nothing.
- Two defects in this session survived guards that already had positive controls, because
  every sample in those controls shared a shape the bug did not have. A control proves the
  harness can detect the bug it was written for, not bugs in general.

### What I got wrong, recorded because the corrections are the useful part

- I asserted that Sentry's transport exposes no per-request timeout and wrote that claim
  into four byahad files as the justification for leaving an outbound call unbounded.
  `BrowserTransportOptions.fetchOptions` exists and is spread into the fetch init. I had
  checked `BaseTransportOptions` in `@sentry/core` and never looked at the browser
  package's extension of it. Correcting it is fix 7 and is not yet done.
- I reported an agent count of 345 over 254 arms. The real figures were 178 and 124: the
  workflow journal is append-only across a dead first attempt and the live one, and I
  counted both halves, so 23 requirements read as 46.
- I said a concurrency cap of 2 was why a run was slow. The shards then visibly ran six
  agents each, so that was not the binding constraint, though re-sharding did cut
  throughput time about 3.5x.
- A workflow's final synthesis step sliced its own prompt to 90000 and 60000 characters,
  which would have fed it 34% of the judge verdicts and 6% of the votes, cut mid-JSON. I
  did not notice until the run was nearly finished. It is patched, and the fan-in is now
  per-requirement with each agent reading its own complete evidence file.

### Second half of the session: four owner decisions answered, and the work they unlocked

Avi answered four of the seven open questions on 2026-10-22. The answers and what each
turned into:

| Decision | Answer | State |
| --- | --- | --- |
| Does AC-6 privacy govern DERIVED COPIES of a private item? | gate them | implemented, migration 0024, MERGED in #244 |
| Should a private PROJECT hide its non-private tasks? | containment | implemented, same migration |
| Should an agent token be bound to its own agent? | bind to the subject | committed, `10e6905` |
| `npm audit`: ratify `high` or enforce 0? | ratify `high` | committed, `2bbc5c4` |

THOSE REMAINING QUESTIONS WERE ANSWERED LATER THE SAME DAY. See "Third stretch" below
for the answers, and for the correction that AC-12's recorded blocker was false: the
transport seam does exist. There were FOUR remaining, not three, because NFR-2 was the
fourth and was missed in this list.

### What the AC-6 implementation looks like, and the two things to know before touching it

`supabase/migrations/0024_private_subject_visibility.sql` adds
`private.subject_is_visible(org_id, subject_kind, subject_id)` and routes five policies
through it: `tasks_select` (for containment) and the four derived tables
(`events`, `activity_feed`, `notifications`, `remediation_suggestions`), none of which had
any privacy clause before. `tests/db/private-subject-visibility.test.ts` carries 49 tests.

1. THE HELPER MUST STAY `SECURITY DEFINER`, and migration 0023 went from
   defence-in-depth to load-bearing because of it. The helper reads `tasks` and
   `projects` from inside a policy on a different table; without definer rights that read
   recurses into `tasks_select`. With definer rights it must keep 0023's
   `set search_path = ''` and fully-qualified relations, or a caller can shadow those
   tables with temp tables and defeat AC-6 exactly as 0023 proved was possible for
   `memberships`.

2. AN INLINE SUBQUERY IN A POLICY IS ITSELF RLS-FILTERED, which is how the first version
   of the containment clause read as correct and did nothing. It inlined
   `not exists (select 1 from public.projects p where p.id = tasks.project_id and
   p.is_private and p.created_by <> auth.uid())`. `projects_select` already hid the
   private project from the caller, so the subquery found nothing, the `not exists` was
   trivially true, and the contained task stayed visible. The gate inverted itself: the
   better `projects_select` hid the project, the less the check could see it. It only
   surfaced because the test asserted on the task ROW separately from its derived rows.

### The Realtime leg of AC-6 is NOT verified, and cannot be from here

Narrowing `events_select` stops a private payload being READ. Whether it stops the
payload being PUSHED depends on Supabase Realtime re-evaluating RLS per subscriber, which
this repository asserts only in a migration header comment ("verified live at the gate",
`supabase/migrations/0005_realtime_publication.sql`). A PGlite harness has no Realtime
server, so the policy is proven and the push is not. Whoever ships this should subscribe
as a non-creator org member, have an admin create a private task, and confirm no envelope
arrives, with a positive control that a non-private task's envelope does.

### Method notes worth carrying, all of them learned the hard way

- A CHANGE THAT BREAKS NOTHING MAY BE GATING NOTHING. Applying 0024 left all 28 db suites
  and 283 tests green on the first run. That was the warning, not the reassurance: no
  existing test ever read a private task's derived rows.
- MUTATE EVERY CLAUSE SEPARATELY, NOT THE FEATURE. Four mutations of the obvious kind all
  killed cleanly and taught nothing. The two that looked redundant (the admin bypass and
  the creator clause) were the ones that exposed real gaps, because the admin was also the
  creator of every private item seeded, so the admin clause was unobservable.
- A MUTATION HARNESS MUST VERIFY ITS OWN EDIT APPLIED. Mine did not, for most of this
  session. One anchor matched a textually identical line in a different branch of the same
  function, so the result read "not killed" when the truth was "not applied". The two are
  indistinguishable without a hash check, and that is the same vacuity class the harness
  exists to find.
- A STOPPED MUTATION RUN CAN LEAVE THE TREE MUTATED. Stopping the final run left migration
  0024 missing an admin bypass; it was restored from a backup taken before the run, and
  found only because the tree was checked before committing rather than after.
- NEVER MUTATE THE WORKING TREE WHILE A SUITE READS IT. Three background runs in this
  session were contaminated by a concurrent edit or branch switch and had to be discarded.

### Still open, and not this repository's work

Seven decisions in byahad need an owner. The largest: whether AC-6's privacy governs
derived copies of a private item. Eight of that requirement's twelve arms turn on it, and
all three candidate fixes change the schema or the authorization model. A private task's
title currently ships in `events.payload` under a policy with no privacy clause, and
`events` is on the realtime publication, so it reaches every org member live rather than
only on request.

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


### Third stretch: both PRs merged, the last four decisions answered, and a guard that caught itself

Avi merged BOTH open PRs during this stretch: #243 at 13:25 and #244 at 13:38. `main` is
now `3eeaa5c` and carries everything from the remediation pass. Neither branch survives;
GitHub deleted both on merge.

READ THIS FIRST IF YOU ARE PICKING UP: two review-bot findings landed on #244 minutes
before it merged, they are UNVERIFIED, and they are therefore now in `main`.

| Finding | Site | Status |
| --- | --- | --- |
| Token binding may reject the documented machine emitter / shared-token sidecar when its session or pane UUID differs from the token's agent ID, stopping registration, status updates and alerts | `lib/http/handle-events-post.ts:410-413` | UNVERIFIED |
| The Command Centre still shows non-private tasks inside private projects, because its BYPASSRLS reads never evaluate the new containment policy | `supabase/migrations/0024_private_subject_visibility.sql:132` | UNVERIFIED |

Adversarial verification of both was in flight when this session was asked to stop, and
produced NO completed verdicts, so nothing about either is settled. What was established
first-hand, and is worth not re-deriving:

- Each agent token resolves to exactly ONE `agentId`. Both resolvers return a single
  `{orgId, agentId}` (`lib/auth/agent-token.ts`), so a token genuinely cannot cover two
  agents.
- `lib/bridges/orca-to-byahad.ts:78-79` and `lib/bridges/orca-sidecar.ts:175-176` both
  emit `source` and `subject` as `{kind:'agent', id: event.agentId}`, and
  `lib/bridges/orca-hook-parse.ts:116` sets that `agentId` from a value called `leaf`.
  Whether `leaf` is an orca pane identifier or an operator-configured agent id is THE
  question for finding 1, and it was not run down.
- `supabase/migrations/0017_dashboard_suggestions_grant.sql:25` states that the
  `byahad_dashboard` role "holds BYPASSRLS (verified)", and `lib/dashboard/queries.ts`
  runs as that role. So finding 2's mechanism is real. What is NOT established is whether
  it is a regression or a pre-existing gap 0024 fails to close: the privacy clauses on
  `tasks_select` that predate 0024 would have been bypassed by that same role too. Settle
  that before deciding the fix, because it changes the answer from "build dashboard-side
  privacy filtering" to "correct an overclaiming migration header and report the gap".

A FULL FIVE-GATE DRY-RUN of #243 and #244 TOGETHER passed before they merged: audit (both
`--audit-level=high` and bare), typecheck, lint, 117 files / 1306 tests, and `npx next
build`, with the tree verified clean at start and end. Coverage 95.91% statements, 91.41%
branches, 96.27% functions, 96.47% lines. That run existed because neither PR had ever
been gated against the other, and it earned its cost immediately:

THE INTEGRATION DEFECT. #243's `tests/db/prd-conformance.e2e.test.ts` recorded AC-6 as
NOT_COVERED because its owner decision was open. #244 ANSWERED that decision and shipped
49 tests for it. Merged, that file asserted something false and stayed green, because the
only rule a reason had to satisfy was being longer than 30 characters. The suite written
to refuse vacuity contained it. Fixed on `claude/byahad-conformance-reason-guard`, DRAFT
PR #245: every suite an `elsewhere:` reason names must exist on disk (with a citation
floor, so stripping every path cannot satisfy the loop by iterating nothing), and the set
of open `decision:` entries is a literal, so answering one fails the file until the reason
is rewritten. 4 of 4 mutations killed.

That guard then caught a second, PRE-EXISTING defect on its first run: AC-13 was
classified `elsewhere:` while naming no suite at all. It is genuinely covered by
`tests/unit/reconnect-controller.test.ts` (drop, refocus, online, visibility, plus the
no-duplicate-subscription clause); the reason simply never said so. A guard that forces
prose to name something checkable found a hole that reading the prose had not.

THE LAST FOUR DECISIONS, ANSWERED 2026-10-22. None is implemented. Patches for all four
were drafted and then abandoned unverified when the session was asked to stop, so treat
them as designs, not code:

| Decision | Answer | Implementation note |
| --- | --- | --- |
| AC-3: how to enforce one source of truth for the event type set | catalog test, IMPLEMENTED in #246 | `EVENT_TYPES` (`lib/events/schema.ts:116`) and the `check (type in (...))` in `0001_schema.sql:118` are two hand-maintained copies of the same 12 strings. 0001 is the ONLY definition site (verified). A test must assert set equality in BOTH directions, carry a literal floor of 12, and assert exactly one definition site so a later migration redefining it cannot leave the test comparing dead DDL |
| AC-12 / DL-4: how to record the transport ordering | mark AC-12 met, supersede DL-4 | SEE THE CORRECTION BELOW |
| NFR-2: does "Zod at every trust boundary" mean Zod specifically | add Zod at that boundary | `app/api/notifications/act/route.ts:137` validates `id`, `action`, `exp`, `token` by hand. The Zod schema MUST reuse the existing `UUID_RE` / `BASE64URL_RE` / `/^\\d+$/` constants and must NOT use `z.string().uuid()`: the GET page reflects all four values into HTML attributes and the safety argument is that those exact charsets contain no quote, angle bracket or space. Zod's `.uuid()` accepts a different set. The eleven malformed-link cases in `tests/api/notifications-act.test.ts` (including two XSS breakout attempts) are the equivalence proof |
| NFR-5: patch coverage or the global aggregate | ratify the aggregate | Enforced today is the global aggregate in `vitest.config.ts:141-145` (lines/statements/functions 95, branches 90). No CI step has ever diffed a base ref, so patch coverage was never the bar. Ratify in NFR-4's form, with the date. Keep the second clause ("every AC has a citing test") unchanged; the sub-question of whether a citing AC must come from the PRD was NOT settled |

AC-12 CORRECTION, recorded because the earlier handover and #244's body both state it
wrongly. The claim was "DL-4 transport ordering is inverted in the shipped system and
there is no transport seam". The second half is FALSE: `lib/realtime/transport.ts` declares
`RealtimeTransport`, both `PollingAdapter` and `SupabaseRealtimeAdapter` declare
`implements` against it, `useLiveChannel` receives a transport by injection and names no
concrete adapter, and `tests/unit/polling-adapter.test.ts:257` pins conformance at compile
time with a `const transport: RealtimeTransport = adapter` assignment. AC-12 as the PRD
writes it was already SATISFIED and was mis-recorded as blocked. What actually remained
was DL-4, which planned polling as the launch transport against a `GET /api/events/poll`
endpoint THAT WAS NEVER BUILT, which is also why decision D-27 (the poller's cursor does
not survive a resubscribe) is blocked, since every candidate fix guesses that endpoint's
unwritten contract. Avi's answer: record Supabase Realtime as primary as shipped, keep
`PollingAdapter` as reserved infrastructure, and leave D-27 open as a precondition of ever
flipping back rather than of shipping.

TWO ERRORS OF MINE IN THIS STRETCH, both found by checking rather than assuming:

- My first full-gate script ran `npm run test:coverage`, which does not exist. The script
  printed `FAIL lines: 0` and no summary, which READ LIKE A PASS. The real command is
  `npm test` (`vitest run --coverage`). The rewritten script now takes every command from
  `ci.yml` verbatim and fails loudly when no vitest summary appears, instead of reporting
  a reassuring zero. A gate that cannot tell "nothing failed" from "nothing ran" is not a
  gate. The same class of error as the earlier mutation harness that could not tell "I
  broke nothing" from "I changed nothing".
- I claimed the act route's malformed-parameter path was untested. False: my
  `grep '^\\s*it('` missed an `it.each` block. It has eleven cases.

ONE THING NEEDS A HUMAN. I pushed the conformance fix onto
`claude/byahad-ac6-privacy-and-token-binding` before realising #244 had merged and GitHub
had deleted that branch, so the push RECREATED a merged PR's branch. The work was moved to
a fresh branch off `main` and the stray branch should be deleted, but
`git push origin --delete` is blocked in this environment. Delete
`claude/byahad-ac6-privacy-and-token-binding` on the remote; nothing depends on it.

STILL OPEN beyond the above: the Realtime leg of AC-6 needs a live check (subscribe as a
non-creator org member, have an admin create a private task, confirm no envelope arrives,
with a positive control that a non-private task's does), because PGlite has no Realtime
server.
And the 23-row verdict table (9 HOLDS / 14 PARTIAL / 0 FAILS over 124 arms) is stale
against the merged tree; only re-running the judge-and-refute pass updates it honestly.

### Fourth stretch: AC-3 implemented, and the two findings still unverified after a second attempt

ONE of the four answered decisions is now implemented. AC-3 is done in draft PR #246,
which is STACKED ON #245 (its base is `claude/byahad-conformance-reason-guard`, not
`main`), because #245's guard is what forces AC-3's reason in
`tests/db/prd-conformance.e2e.test.ts` to be rewritten when AC-3 leaves the open-decision
list. Merge #245 first or #246's diff will read oddly.

`tests/unit/event-type-catalog.test.ts` asserts that `EVENT_TYPES`
(`lib/events/schema.ts:116`) and the `check (type in (...))` on `events.type`
(`0001_schema.sql:118`) are the same SET, in both directions, with a literal floor of 12
on each side, and that exactly ONE live migration defines that constraint. The
single-site rule matters more than it looks: without it a later migration could drop and
recreate the constraint and leave the test comparing dead DDL while still passing.
Comment lines are stripped before the scan, because 0009 and 0012 both carry a
commented-out example of this constraint shape for `notifications` and a commented
example must not count as a definition site. 5 of 5 mutations killed, including the two
that matter most: a type added to one side only (each direction tested separately) and a
type RENAMED on one side so the counts still match while the sets differ. Gate: 4/4
tests, `tsc` 0, `biome` 0.

THE TWO REVIEW-BOT FINDINGS ARE STILL UNVERIFIED after a second attempt. The adversarial
verification workflow was launched again and stopped again before any agent returned, so
its journal holds two `started` records and zero verdicts. Nothing in the finding table
under "Third stretch" has changed, and the facts recorded there are still the full extent
of what is established. If you pick this up, the single most valuable thing you can do is
answer the two questions named there, because each one decides its finding:

1. Is `leaf` at `lib/bridges/orca-hook-parse.ts:116` an orca pane identifier, or an agent
   id an operator configures to match their token? Trace it to the raw hook input. If it
   is a pane id, the token binding shipped in #244 breaks that emitter in production.
2. Were the pre-0024 privacy clauses on `tasks_select` bypassed by `byahad_dashboard`
   too? If yes, the Command Centre finding is a pre-existing gap 0024 does not close
   rather than a regression it introduces, and the right response is to correct the
   migration header's overclaim and report the gap, not to build dashboard-side
   filtering.

STILL NOT DONE, and each is a real gap rather than a formality:

- THREE DECISIONS REMAIN UNIMPLEMENTED: AC-12/DL-4, NFR-2, NFR-5. Their designs are in
  the "Third stretch" table. The NFR-2 constraint is the one that is easy to get wrong
  and expensive to get wrong: reuse the route's existing regexes, never
  `z.string().uuid()`.
- NO FULL FIVE-GATE RUN EXISTS AGAINST POST-MERGE `main` (`3eeaa5c`). The passing
  117-file / 1306-test run was on the pre-merge integrated tree, which differs from
  `3eeaa5c` only in being the squash of the same two changes, but "should be identical"
  is not a gate result.
- THE 23-ROW PRD VERDICT TABLE (9 HOLDS / 14 PARTIAL / 0 FAILS over 124 arms) IS STALE
  against the merged tree. Only re-running the judge-and-refute pass updates it honestly;
  editing the table by hand would be the circular move the conformance suite's header
  warns about.
- THE REALTIME LEG OF AC-6 IS UNVERIFIED. Narrowing `events_select` stops a private
  payload being read; whether it stops the payload being PUSHED depends on Supabase
  Realtime re-evaluating RLS per subscriber, which this repo asserts only in a migration
  header comment. PGlite has no Realtime server, so it cannot be observed here. The check
  needs a live project: subscribe as a non-creator org member, have an admin create a
  private task, confirm no envelope arrives, with a positive control that a non-private
  task's envelope does. It was not attempted, because doing it means writing data to a
  live project and prod work needs Avi's explicit go-ahead.

### Fifth stretch: BOTH findings verified, and one of them breaks the ingestion path in main

The two review-bot findings are no longer unverified. They were settled by reading the
code and the operator docs directly, after two attempts to run an adversarial workflow
were both stopped before any agent returned. Do not re-verify these; act on them.

FINDING 1 IS A SHIPPED REGRESSION, AND IT IS THE MOST IMPORTANT THING IN THIS HANDOVER.
#244's credential binding rejects EVERY event from the documented emitter and from the
orca sidecar. Not intermittently. Always, by construction:

| Source | What it establishes |
| --- | --- |
| `docs/emitter-setup.md:5` | mint a token ONCE PER MACHINE, `--agent <machine-name>` |
| `docs/emitter-setup.md:34` | each Claude session becomes one agent, id = the session uuid |
| `lib/bridges/orca-hook-parse.ts:98` | the orca agent id is the paneKey's trailing uuid, per pane |
| `lib/auth/agent-token.ts` | both resolvers return a single `{orgId, agentId}` |

The credential's `agentId` is a machine name chosen once; every event's `source.id` is a
per-session or per-pane uuid minted later. `credentialSubjectRejection` requires them to
be identical, so every such event is refused with `source_not_credential_owner`. And
`docs/emitter-setup.md:35` records that the sidecar is the SOLE writer of `agents.status`
for `waiting` and `blocked`, the only two states that alert, so nothing pages a human
either.

The existing suite cannot see this: every test that exercises the binding builds the
envelope and the credential FROM THE SAME ID, which is the one configuration the
documentation rules out. That is the same vacuity class this whole remediation pass has
been clearing.

Draft PR #247 proves it with `tests/unit/credential-binding-vs-documented-emitter.test.ts`:
three cases driving the documented shapes, which FAIL on main, and three controls which
pass, so a failure reads as strictness rather than a broken import. One control pins the
attribution forgery that #244 set out to close, so whatever replaces the binding has to
keep it closed. #247 deliberately does NOT fix the binding.

WHY IT WAS NOT FIXED, AND THE DECISION IT NEEDS. The binding is consistent with a
RESOLVED decision and inconsistent with the operator documentation:

- `docs/phase-2-foundation/decisions-log.md:44` records "CR-2 RESOLVED by Avi: production
  agent-auth = DB-backed hashed tokens, `agent_tokens` table (store sha256 hash, never
  plaintext; PER-AGENT; revocable)".
- `docs/emitter-setup.md:5` then documents one token PER MACHINE.

So per-agent tokens were settled, and the emitter was documented per-machine afterwards.
#244 implemented the CR-2 reading and broke the documented deployment. Two coherent
resolutions, and choosing between them changes what the security boundary means, which is
why it was escalated rather than decided:

1. Treat the credential as a machine credential: relax the binding so a token may speak
   for agents in its org, and close the escalation another way, for example only for
   agents that token itself registered. Keeps the documented deployment and reinterprets
   CR-2's "per-agent".
2. Make the deployment per-agent: mint a token per session or pane so the binding holds as
   written. Consistent with CR-2 as recorded, but sessions and panes are created
   dynamically, so it needs runtime token minting that does not exist today.

FINDING 2 IS REAL BUT RESOLVES DIFFERENTLY, and both of my earlier readings of it were
wrong. It is not "the dashboard has no privacy filtering" and it is not "a pre-existing
gap with nothing to do". `lib/dashboard/queries.ts` ALREADY mirrors RLS privacy in its own
SQL, deliberately, with comments at lines 125, 132 and 164 citing the BYPASSRLS bypass as
the reason it must. It carries twelve `is_private` references and filters `and not
is_private` in several queries. What it mirrors is only a task's OWN flag, not 0024's
CONTAINMENT, so a non-private task inside a private project is still returned to the
Command Centre. The mirror exists and is now incomplete, which makes the fix a narrow,
well-precedented one: extend the existing SQL mirror to consult the parent project, in the
same places that already consult the task's own flag. The audit had already flagged this
exact drift class at `lib/dashboard/queries.ts:122-128`, where a port "kept the org filter
and silently lost the privacy clause".

STILL NOT DONE, carried forward unchanged from the fourth stretch:

- THREE DECISIONS UNIMPLEMENTED: AC-12/DL-4, NFR-2, NFR-5. Designs are in the "Third
  stretch" table. All three are small; NFR-2 is the one that is easy and expensive to get
  wrong, because its Zod schema must reuse the route's existing regexes and never
  `z.string().uuid()`.
- NO FULL FIVE-GATE RUN AGAINST POST-MERGE `main` (`3eeaa5c` at the time, now moved).
- THE 23-ROW PRD VERDICT TABLE IS STALE against the merged tree, and finding 1 means AC-7
  and NFR-8 in particular would now verdict differently.
- THE REALTIME LEG OF AC-6 IS UNVERIFIED and needs a live project.

### Sixth stretch: all four decisions implemented, and two guards that caught their own author

THE OPEN-DECISION LIST IS NOW EMPTY. All four remaining decisions are implemented in draft
PR #246 (stacked on #245: its base is `claude/byahad-conformance-reason-guard`, so merge
#245 first), each dry-run before the next as the goal requires:

| Decision | Answer | Dry-run |
| --- | --- | --- |
| AC-3 | catalog test | 4/4 tests, 5/5 mutations killed |
| NFR-5 | ratify the global aggregate | 41/41 across every suite reading requirements.md |
| AC-12 / DL-4 | AC-12 met, DL-4 superseded | 51/51 across the three realtime suites |
| NFR-2 | add Zod at that boundary | 34/34 including 11 malformed cases, 5/5 mutations killed |

THE ONE DETAIL NOT TO UNDO IN NFR-2. The Zod schema in
`app/api/notifications/act/route.ts` REUSES the route's existing `UUID_RE`,
`BASE64URL_RE` and digits regexes and deliberately does NOT use `z.string().uuid()`. The
GET page reflects all four validated values into HTML attributes, and the reason that is
safe is that those exact charsets contain no quote, angle bracket or space. Zod's own
`uuid()` constrains version and variant nibbles that `UUID_RE` does not, so substituting
it changes what is accepted at a sink whose safety depends on the charset. The eleven
malformed-link cases already in `tests/api/notifications-act.test.ts`, two of them XSS
breakout attempts, are the equivalence proof.

AC-3's catalog test has one rule worth more than it looks: it asserts exactly ONE live
migration defines the `events.type` CHECK. Without that, a later migration could drop and
recreate the constraint and leave the test comparing dead DDL while still passing green.
Comment lines are stripped before the scan, because 0009 and 0012 each carry a
commented-out example of that constraint shape for `notifications`.

TWO GUARDS CAUGHT THEIR OWN AUTHOR IN THIS STRETCH, which is the most useful thing to
carry forward:

1. #245's guard PASSED when it should have failed. When the four decisions were answered,
   `prd-conformance.e2e.test.ts` still listed all four as open `decision:` entries and the
   boundary test stayed green, because the rules bind the LITERAL to the MAP and nothing
   in the tree says an owner has decided something. The rules catch a reason drifting from
   the code it cites; they cannot notice the world moved. That limitation is now written
   into the suite header rather than patched away: reading a `decision:` entry tells you
   what the file was last told, not what is still open.
2. #247's CI went RED, and correctly so, because its tests fail by design to prove the
   credential-binding regression. A permanently red PR cannot merge, and "red on purpose"
   is indistinguishable from "red because broken" in a checks list. FIXED AND PUSHED as
   `a2f58e3`: the three break-proving cases are now Vitest `it.fails`, so CI is green, the
   defect stays an executable claim rather than a comment, and the file FLIPS TO RED the
   moment someone fixes the binding, forcing whoever fixes it to convert these to ordinary
   assertions. A known-defect test that silently keeps passing after the defect is gone
   would be precisely the vacuity this whole pass has been removing. The three controls
   stay ordinary assertions, since they must pass before and after any fix.
   THAT FLIP IS VERIFIED, AND THE FIRST ATTEMPT TO VERIFY IT FAILED, which is the useful
   part. Relaxing only the `source` equality clause does NOT turn the file red, because the
   `subject` clause still rejects the same envelope: the emitter is still broken and a
   half-fix must not read as done. Relaxing BOTH clauses to org scope, which is what
   admitting the documented emitter requires, does turn it red (3 failed). So the signal
   fires when the documented envelope is ADMITTED, not when either clause is merely
   touched. Had the mutation not been run, the docblock would have claimed a property the
   test did not have.

THE FULL FIVE-GATE RUN AGAINST POST-MERGE `main` PLUS ALL FOUR DECISIONS PASSED, on
`6eb86a0`, tree verified clean at both ends: audit at both `--audit-level=high` and bare,
typecheck, lint, 118 files / 1310 tests, and `npx next build`. Coverage 95.91% statements,
91.34% branches, 96.27% functions, 96.47% lines, all above the `vitest.config.ts` floors
that NFR-5 was ratified to in the same PR. This is a RECORDED RESULT, not an expectation
inherited from a neighbouring commit, and it closes the gap the standing goal kept naming.
One figure worth knowing before someone investigates it: branches moved 91.41% to 91.34%
against the pre-merge tree. That is the NFR-2 refactor replacing a four-way compound `if`
with a Zod schema, which REMOVES branch points rather than adding uncovered ones: fewer
total branches, same uncovered set.

THE 23-ROW VERDICT RE-RUN WAS ATTEMPTED AND STARVED. It was launched as a workflow with
one judge and one adversarial refuter per requirement, every agent writing its verdict to
disk the moment it had one so partial results would survive an interruption (the lesson
from two earlier workflows that returned nothing). After eight minutes it had 2 agents
started and 0 results, because the full test suite was saturating the CPU alongside it, so
it was stopped rather than left to degrade the gate. THE LESSON FOR NEXT TIME: do not run
the verdict pass and a full suite at once. Give the verdict pass a window with no suite
running. Its script is preserved and resumable at
`.claude/projects/-home-user-skills/<session>/workflows/scripts/prd-verdict-rerun-2026-10-22-wf_47b76d58-d31.js`,
and its brief already carries both known defects so the agents do not rediscover them.

STILL OPEN after this stretch:

- THE CREDENTIAL-BINDING FIX, which needs Avi's choice between the two options written out
  in "Fifth stretch". The regression is in `main` now.
- The Command Centre containment mirror: extend `lib/dashboard/queries.ts` to consult the
  parent project where it already consults a task's own `is_private`.
- The 23-row verdict table, still stale. Note that finding 1 means AC-7 and NFR-8 would
  verdict differently, so the table cannot be hand-edited.
- The Realtime leg of AC-6, needing a live project.

### Seventh stretch: all five PRs merged, the verdict table settled, and three more fixes in #249

Avi merged ALL FIVE open PRs (byahad #245, #246, #247, #248 and skills #32). byahad `main`
is `f921246`.

FIRST, A CORRECTION TO THE SIXTH STRETCH ABOVE. Its diagnosis of why the verdict pass
starved is WRONG, and its "lesson for next time" is therefore the wrong lesson. The cause
was not CPU contention from the test suite. The cause is that this container reports
`nproc: 4`, and a workflow's concurrency cap is `min(16, nproc - 2)`, which is 2. Two agent
slots, 23 requirements, each needing a judge and a refuter. The agents are I/O-bound on
model calls, not CPU-bound: load average sat at 0.15 while they ran. The real lesson is
that THE CAP IS PER WORKFLOW, so sharding the pass into several top-level workflows
multiplies the slots, and that is what finally made it complete. Running a suite alongside
it was never the problem. Worth noting how this one went wrong: the per-workflow-cap fact
had already been recorded earlier in the same session, and the sixth stretch was written
mis-diagnosing against that own note.

THE 23-ROW VERDICT TABLE IS SETTLED against the remediated tree: 2 FAILS, 16 PARTIAL, 5
HOLDS, against a prior 0 FAILS, 14 PARTIAL, 9 HOLDS. It is committed as
`docs/phase-2-foundation/verdicts-2026-10-22.md` (merged in #248). Refutation moved three
verdicts, and in BOTH directions, which is the point of running a refuter at all:

- AC-3 was reported as "pinning a shadow" and that report was RETRACTED. The refuter proved
  the drift scenario does not compile, because `NOTIFY_ON: ReadonlySet<EventType>` cannot be
  called with an unnarrowed `event.type`. Verified with an isolated `tsc` probe (TS2345).
  AC-3 HOLDS.
- The cron dead-man's switch was reported twice as silently never firing. Wrong direction
  in both reports: it is fail-open, so a bad URL produces a loud false DOWN alert rather
  than silence.
- Two Vercel findings resolved differently from the earlier readings: finding 1 is confirmed
  and WORSE than first stated (the emitter breaks always, by its own documentation), and
  finding 2 resolved differently from both earlier readings (the mirror exists deliberately
  but is incomplete).

SIX FIXES, A to F, each dry-run before the next was started and each mutation-proven. A, B
and C are in `main` and were verified there BY CONTENT rather than by trusting the merge
notices, which matters because D turned out to be absent: it had never been pushed.

| Fix | What | Where |
| --- | --- | --- |
| A | Sentry edge transport send timeout, with the false "could not be established" comment replaced by the verified resolution chain | merged |
| B | Eight env fields tightened off the unfalsifiable `min(1).optional()` shape, plus a test forbidding that idiom anywhere in both env modules | merged |
| C | `updateTaskFields`, one UPDATE with `coalesce`, replacing the silent-no-op branch | merged |
| D | `agent.registered` refused across tenants instead of rebinding the agent | #249 |
| E | Task and project privacy applied to all five dashboard reads, not just `getTasks` | #249 |
| F | `useLiveChannel` un-excluded from the coverage gate, its DOM wiring pinned | #249 |

Draft PR #249 carries D, E and F plus a fourth commit for the dependency audit, described
below. ITS ONE API-VISIBLE CHANGE NEEDS AVI'S VETO OR ACCEPTANCE: fix D turns a cross-org
`agent.registered` from 200 into 422. That is the intent of the fix, but it is a response
code change on a public ingest route, so it is flagged in the commit message and in the PR
body rather than buried.

THE FULL FIVE-GATE RUN ON THE FINAL STATE IS DONE, which is what the standing goal kept
asking for, and it took two passes because the first found a real red:

- On `cf7a449` (D, E, F): four of five green, with `npm audit --audit-level=high` RED.
- On `b6db000` (plus the dependency fix): ALL FIVE GREEN. 121 files, 1341 passed and 3
  expected-fail, 1344 total. Coverage 95.97 statements, 91.48 branches, 96.34 functions,
  96.52 lines, every figure above the `vitest.config.ts` floors and every one HIGHER than
  the run recorded in the sixth stretch (95.91, 91.34, 96.27, 96.47). Un-excluding
  `useLiveChannel` raised coverage rather than denting it.

THE AUDIT RED IS WORTH UNDERSTANDING because it will happen again to whoever reads this.
`npm audit` reads `package-lock.json` against the LIVE advisory database, so an unchanged
lockfile flips red the moment an advisory is published. The branch's lockfile was
byte-identical to `main`'s, three high advisories against `undici` landed between
2026-10-22 and 2026-10-27, and `main` fails that gate identically today. The fix is an
`overrides` entry for `undici` at `^7.30.1` and a bump of the stale `fast-uri` override to
`^3.1.9`; both are patch bumps inside the major their parent already accepts, and both
packages are transitive, which is why dependabot does not reach them. One trap: the first
`npm install` also stripped 22 `libc` fields from optional platform packages, because the
local npm (10.9.4 on node 22) predates the npm that wrote the lockfile (node 24). That
churn was reverted and the two entries edited surgically, so the diff is exactly six lines
per side.

THE LESSON THIS STRETCH KEPT RE-LEARNING, now applied to my own work five separate times:
A GUARD'S STRENGTH CANNOT BE ASSESSED BY READING IT. Only by mutating against it, and only
once the harness itself has been shown capable of reporting a PASS. Fix E's code was
essentially right from its first draft, and it still took four rounds, every one of which
found a defect in the apparatus rather than in the query:

1. The mock dispatched on loose substring matching, so the new privacy subqueries misrouted
   the activity read to the tasks branch.
2. The mutation harness grepped for a test count that never matched even on unmutated code,
   so every mutation printed KILLED unconditionally. Those results were retracted. The
   harness now asserts it can report a PASS before any mutation is applied.
3. One mutation silently never applied, because shell `$` escaping mangled its anchor.
4. The uuid-shape guard line was MISSING from the written file and the test written to
   cover it PASSED ANYWAY, because its fixture seeded no private task, so the `::uuid` cast
   was never reached. Probing directly produced `invalid input syntax for type uuid:
   "not-a-uuid"`, which in production is the whole activity feed down rather than one
   hidden row.

Fix D had the same shape: three of six mutations initially survived, all because of the
tests rather than the code. One asserted against the column default, so "untouched" was
unobservable. One used an existing task, where the guard present and the guard absent are
identical. Nothing exercised the notification tail. Fix F's first version was vacuous
because `notify*` is a no-op while subscribed, so nothing was observable until the fake
transport could force backoff, and its listener-leak mutation then survived because
`notify*` is a no-op when idle too, which needed a registration-balance test instead.

STILL OPEN after this stretch, and all but the last are owner decisions rather than
defects:

- THE CREDENTIAL-BINDING SHAPE. Three sources, three answers: the PRD requires no binding,
  CR-2 says per-agent, `docs/emitter-setup.md` says per-machine. #247 pins the
  contradiction with `it.fails` cases so it cannot drift silently, and those are the three
  expected-fails in the suite count above.
- AC-5 AND AC-6. BYPASSRLS is ratified architecture, pinned by
  `restore-drill.test.ts:293-307`, while `design.md:18` separately promises that "RLS still
  guards every human read path". Both cannot be fully true at once.
- THE REALTIME LEG OF AC-6, which needs live-project writes.
- FIX D's 200 to 422 change, needing a veto or an acceptance.
- One chore still needs a human: delete the stray remote branch
  `claude/byahad-ac6-privacy-and-token-binding`. A push recreated it after GitHub had
  deleted it on merge, and the delete is blocked in this environment.

### Eighth stretch: the verdict table re-judged, AC-6 moved FAILS to HOLDS, and production found nine migrations behind

READ THIS FIRST, BEFORE ANY OF THE REST. THE LIVE SUPABASE PROJECT IS NINE MIGRATIONS BEHIND
THE REPOSITORY. It has applied 0001 to 0015; the repo holds 24. Missing are 0016 to 0024,
which includes every security hardening from 0021 onward. Established read-only, by four
independent mechanisms rather than one:

  the applied-migration table        stops at 0015_notification_sent_ok_at
  pg_policy                          all four derived-table SELECT policies carry the
                                     pre-0024 `private.is_member(org_id)` body, and
                                     `private.subject_is_visible` does not exist
  pg_trigger                         ZERO non-internal triggers on public tables, while
                                     0021 and 0022 create four between them
  pg_proc.proconfig                  the private.* helpers run `search_path=public`, which
                                     is 0004's value, not 0023's `search_path = ''`

A PRIVATE TASK'S VERBATIM TITLE IS CURRENTLY PUSHED TO EVERY ORG MEMBER'S BROWSER, and the
chain is four links, each checked rather than assumed: `events` is the ONLY table on the
`supabase_realtime` publication, the client subscribes to INSERT on it filtered by org_id,
`events_select` without 0024 gates on membership alone with no privacy clause, and
`TaskCreatedPayloadSchema` REQUIRES `title`. Migration 0024's own header calls this the severe
form of AC-6.9, and that fix has been merged and proven by test since 2026-10-22. It has
simply never been in effect. The same gap leaves 0023's temp-table shadowing route open and
0021/0022's declassification and attribution triggers absent.

WHY NO GATE COULD HAVE CAUGHT IT, which is the transferable part. Every gate builds its schema
from `supabase/migrations/` through the PGlite harness, so the schema under test is current BY
CONSTRUCTION. The suite is green on a privacy fix the database has never seen, and it is not
wrong to be: it answers a question about the code. Nobody was asking whether the database
agreed. A GREEN FIVE-GATE RUN IS NOT EVIDENCE THAT A DATABASE-LEVEL BEHAVIOUR IS IN EFFECT,
and that sentence is the single most useful thing in this stretch.

It also means the AC-6 HOLDS below is a statement about the tree and not about the running
system. It is not withdrawn, because it was measured against the tree and is correct about the
tree, and the verdict file now opens by saying exactly that.

NOT DONE, deliberately: the nine migrations are NOT applied. That is production DDL and an
owner decision. What was added is the check whose absence let this run,
`scripts/check-migration-drift.mjs` (read-only, one SELECT, exit 3 for "could not look" so it
can never read as either answer), pinned by `tests/unit/migration-drift-check.test.ts` against
the exact names production returned, plus `docs/ship/OPERATOR-RUNBOOK.md` section 4b.

One related finding, recorded not fixed: `byahad_dashboard` and `byahad_ingest` exist in the
live project with `rolbypassrls` set WHILE 0018, the migration that creates them, is
unapplied. They were made out of band and are not reproducible from the repository, which
bears on AC-5, whose verdict rests on those roles' attributes.

I had been calling AC-6's Realtime leg "unverified, needs live-project writes" for two
sessions. It needed a read-only look at production, and no writes at all. The lesson is to
check what the running system is before concluding that checking it is hard.


The seventh stretch left five things open and called four of them owner decisions. This
stretch attacked the fifth, re-judged the rows that had been graded against a tree that no
longer existed, and found that one of the two FAILS was no longer true.

THE RE-JUDGEMENT. Five requirements had their evidence touched by this branch, so each was
re-judged the way the 2026-10-22 table was built: one judge, then one adversarial refuter
attacking the verdict on three fronts. Results are committed as
`docs/phase-2-foundation/verdicts-2026-10-27.md`.

| Requirement | Was | Now | What moved it |
| --- | --- | --- | --- |
| AC-5 | FAILS | FAILS | stands, with the judge's read-path reasoning corrected |
| AC-6 | FAILS | HOLDS | three commits the judge never saw closed its three residuals |
| AC-7 | PARTIAL | PARTIAL | grade-bearing gap closed, two proof weaknesses left |
| AC-13 | PARTIAL | PARTIAL | the stop() breach reproduced and measured worse |
| NFR-5 | PARTIAL | PARTIAL | label stands, every stated reason replaced |

So the tally is 1 FAILS, 16 PARTIAL, 6 HOLDS, against 2 / 16 / 5 a week ago.

THE FINDING THAT MATTERS MORE THAN THE TALLY: FOUR OF THE FIVE REFUTERS HAD TO CORRECT THEIR
JUDGE'S DESCRIPTION OF THE TREE, and in two cases that correction WAS the verdict. The
remediation and the judging ran at the same time, so every judge measured a head that had
moved by the time it reported, and a judge has no way to notice. AC-6's judge assessed four
commits past `main` when there were eight; AC-7's grade rested entirely on a gap that a
commit closed by name fourteen minutes after the judge measured. Next time: freeze the tree
for the pass, or judge a tag rather than a branch. The verdicts here are sound only because
every refuter re-ran the mutations instead of reading the reports, and that should not be
load-bearing.

TWICE, A REFUTER REJECTED A GUARD ITS OWN JUDGE DEMANDED, and both times it was right.

- AC-6's judge named "no parity test between the TypeScript privacy mirror and
  `private.subject_is_visible`" as the structural residual. A strict parity test WOULD FAIL
  ON A CORRECT IMPLEMENTATION: the mirror is deliberately the no-viewer form of the policy,
  so it hides unconditionally where the policy exempts the creator and admins. Agreement is
  not the property wanted. And none of the six historical misses was drift in the fragment;
  every one was a site not applying it at all, which a parity test cannot see.
- AC-5's refuter demonstrated a cross-org UPDATE succeeding through
  `app/api/notifications/act/route.ts`, and the obvious fix (bind `org_id` into the action
  token, add `and org_id = $2` to the statement) WOULD BE VACUOUS BY CONSTRUCTION.
  `notifications.id` is a uuid primary key, so the id already names one row in one org and
  the token already binds the id under a secret the caller does not hold. The predicate would
  match on every reachable input, read as a tenancy guard, pass review and guard nothing. It
  was deliberately not written, and the reason is recorded in the verdict file so the next
  reader does not "fix" it.

TWENTY FIXES, D to X with H blocked, each dry-run before the next and each mutation-proven.
D, E and F were in #249 at the end of the seventh stretch; G to X are new here.

| Fix | What |
| --- | --- |
| G | cross-org INSERT arms got positive controls, so a missing grant can no longer pass for an RLS denial |
| H | BLOCKED, see below |
| I | an end-to-end dry-run of the deployment `docs/emitter-setup.md` documents |
| J | `getKpis`' activity tile counted rows the feed hides |
| K | a contained task's real title was emailed outside the org |
| L | which dashboard reads must apply containment is now enumerated and enforced |
| M | the console's only write gate had untested wiring, and two false reasons why |
| N | `lib/data/viewer.ts` brought back inside the coverage gate |
| O | `scripts/local-gate.sh`, a local gate runner that cannot drift from `ci.yml` |
| P | the coverage thresholds were the enforcement and nothing asserted them |
| Q | a barrel-file coverage exclusion was sheltering a real factory |
| R | the PRD traceability guard could not fail, and now can |
| S | that gate runner's freeze check was blind to untracked files |
| T | `stop()` could leave two live subscriptions, closing AC-13's only PARTIAL-holding gap |
| U | AC-7's INSERT deny arms passed under a missing grant, plus a dead citation |
| V | the bulk-literal discount's premise check was one-directional, so a decoy restored the bypass |
| W | the thresholds were pinned but the denominator was not, and an exclusion can only raise it |
| X | the exemption claiming NFR-5 cannot be a test outlived the test that proves it |

THREE OF THOSE ARE DEFECTS IN GUARDS WRITTEN EARLIER IN THE SAME SESSION, which is the single
most useful thing in this stretch. V and X are defects in R; W is a gap in P. Each was found
by an adversarial refuter running mutations against my work an hour after I had convinced
myself it was sound, and each had passed its own mutation suite at the time. The lesson is not
"write better guards". It is that a guard's strength cannot be assessed by its author, because
the author tests the failure modes they thought of, and the ones they did not think of are
exactly what is left.

FIX I IS THE ONE THAT ANSWERED THE STANDING GOAL'S "full dry-run to make sure the whole
system works as planned", and it found something no unit test could. It drives the documented
deployment end to end: one token per machine (`emitter-setup.md:5`), a per-session uuid as
`source.id` (`:34`), through the real `DbAgentTokenResolver`, the real `handleEventsPost` and
a real Postgres. THE WHOLE CREDENTIALED END-TO-END TIER IS BLIND TO THE CREDENTIAL BREAK, by
two independent mechanisms: of the six suites that drive `handleEventsPost`, only three pass
a real credential, and all three mint the token for the very agent their events are about,
which is the one configuration `emitter-setup.md` excludes. So every existing test agrees the
path works and every real deployment is refused.

FIX I ALSO WENT VACUOUS TWICE BEFORE IT WORKED, and both failures are worth knowing because
neither is visible by reading the test. Its known-defect cases reused the control's
already-registered agent id, so AC-10's idempotency made them fail regardless of the defect;
and `documentedRegisterEnvelope` hardcoded one envelope `id`, which is the `events` primary
key, so no later insert in the file could happen at all. Both were caught only by checking
that the `it.fails` cases FLIP when the defect is removed. An `it.fails` that passes for the
wrong reason is indistinguishable from one that works.

FIX H IS BLOCKED AND THE BINDING IS UNTOUCHED ON DISK. Changing the credential-binding shape
was refused by the auto-mode classifier as "Security Weaken". That is a defensible refusal on
its face: the change relaxes a check. It needs Avi, and it needs the three-way contradiction
resolved first (the PRD requires no binding, CR-2 says per-agent, `emitter-setup.md` says
per-machine). Nothing was worked around.

THE FULL FIVE-GATE RUN. The run on `0946f29`, which is sixteen of the twenty-two commits,
was ALL FIVE GREEN: 128 test files, 1394 passed plus 5 expected-fail (1399), coverage 97.15
statements, 92.46 branches, 97.22 functions, 97.75 lines, every figure above its
`vitest.config.ts` floor and every one higher than the 95.97 / 91.48 / 96.34 / 96.52 recorded
in the seventh stretch. The denominator also GREW, from 82 files to 84, because fixes N and Q
brought two sheltered files back into the gate, so the rise is not an artefact of measuring
less.

THE FINAL RUN, OVER ALL TWENTY-SIX COMMITS, IS ALL FIVE GREEN on `3766917`: audit 0,
typecheck 0, lint 0, suite 0 in 406s, `next build` 0, and the post-run freeze check confirms
the tree did not move mid-run. 130 test files, 1414 passed plus 5 expected-fail (1419).
Coverage 97.15 statements, 92.46 branches, 97.22 functions, 97.76 lines over an 84-file
denominator, read from `coverage-summary.json` rather than the terminal table, which omits
files. The test-count difference from the previous run is exactly the fifteen cases the last
three fixes added, which is the cheapest available check that the suite ran what was
committed rather than a stale tree.

THREE EARLIER GREEN RUNS ARE NOT CARRIED FORWARD, deliberately. Each measured a tree that had
since moved, and a green run on a tree you no longer have is not evidence about the tree you
do. One of those runs I invalidated myself by committing while it was in flight, which is
precisely the wire the post-run freeze check exists to trip; it would have reported 97
INVALID, and the right response was to stop it and re-run rather than wait for a void
result.

One note on reading that result, because it caught me once in this session. The wrapper I ran
the gate through exited 1 while the gate itself exited 0: its trailing `grep` for the coverage
table found nothing, because the gate keeps per-gate logs in a `mktemp` directory and echoes
only the vitest summary lines to stdout. The gate's own exit code, recorded separately, is the
one to read. That is the third variant of the same pipeline-exit-code mistake this session,
and the reason the runner writes its code to a file rather than relying on `$?` surviving a
pipe.

The gate runner is `scripts/local-gate.sh` in byahad. Exit 97 means INVALID, the tree moved
mid-run, which is a re-run rather than evidence about the code; 98 means the tree was already
dirty. Both distinctions exist because this session hit each of them.

WHAT KEPT GOING WRONG, now at six instances in two stretches: A GUARD IS WEAKER THAN THE
INCIDENT THAT PROMPTED IT, and reading it will not tell you.

- Fix S exists because fix O's freeze check passed `--untracked-files=no`, and the incident
  it was written for was a temporary migration, which is a NEW FILE. The check written to
  catch that event could not have seen that event. Caught by Vercel's reviewer on the PR, not
  by me.
- `tests/helpers/pglite-harness.ts:55` builds its schema with `readdirSync` over
  `supabase/migrations/`, so ANY file there is applied, tracked or not, and vitest's include
  glob collects any new test file. Those two mechanisms are why untracked files are
  load-bearing here, and both were in the repository the whole time.
- Fix R's predecessor cited every requirement id from one bulk literal, so the traceability
  guard could not fail. Fix Q's exclusion list carved out `lib/**/index.ts` as "barrels",
  which sheltered a file that was not one.
- A gate script that invents its own commands produces NUMBERS, which is worse than having
  no gate script: an early version ran `npm run test:coverage`, which does not exist in
  `package.json`, printed "FAIL lines: 0" while nothing had run, and was briefly believed.

AND THE REPORTING MISTAKES, recorded because they are the same class. Three times I piped a
gate script through `tee` or `tail` and read the pipeline's exit code instead of the script's,
so a failing gate reported success. Twice I claimed "tsc 0" from a run polluted by a
concurrent agent's mutation of an unrelated file. Once I wrote "SIX suites drive
`handleEventsPost` with a real credential" when three do. Each was corrected in place and the
commit messages now state exactly what was measured rather than what was expected.

A REFINEMENT TO THE SEVENTH STRETCH'S CONCURRENCY NOTE, which is right about the workflow and
wrong about the suites. That note says the agents are I/O-bound on model calls, with load
average 0.15 while they ran, and concludes "running a suite alongside it was never the
problem". The first half still holds. But a REFUTER is not an agent waiting on a model: it
runs mutations, and each mutation runs the suite. With three full vitest-plus-coverage runs in
flight at once on `nproc: 4`, load average measured 15.99 and every one of them slowed to a
crawl, including the five-gate run this stretch needed. So: shard the workflow to get the
slots, and then expect the SUITES to serialise anyway. Plan one coverage run at a time, not
three.

STILL OPEN, and all but the last two are owner decisions rather than defects:

- THE CREDENTIAL-BINDING SHAPE, as above. Blocked on both the contradiction and the
  classifier.
- AC-5's BYPASSRLS ARCHITECTURE. Either the dashboard and ingest roles stop being BYPASSRLS
  and the human paths run under policies, or `design.md:18`'s promise that "RLS still guards
  every human read path" is retracted. `restore-drill.test.ts:293-307` pins
  `rolbypassrls = true` as mirroring production, so both cannot be true. Production role DDL.
- THE REALTIME LEG OF AC-6, which needs live-project writes.
- FIX D's 200 to 422 change on a public ingest route, needing a veto or an acceptance.
- `lib/notifications/deliver-queries.ts` is still coverage-excluded at a measured 26%. Its
  privacy predicate is now fixed and tested, but un-excluding it needs tests for five more
  exports or the aggregate drops.
- AC-13's remaining gap (1): `reconnect-controller.ts:148` returns early whenever state is
  "subscribed", so a silently dead socket is recovered only when the SDK reports it. The
  refuter argued, convincingly, that resubscribing on every focus would manufacture the
  duplicates the same AC forbids, so this is a named narrowing rather than a defect.
- One chore still needs a human: delete the stray remote branch
  `claude/byahad-ac6-privacy-and-token-binding`.

### Ninth stretch: both PRs merged, the sixteen PARTIALs triaged at last, and a claim retracted

OWNER ACTIONS SINCE THE EIGHTH STRETCH. byahad #249 is MERGED, and it was a SQUASH, as
`59c0eea`. That matters more than it sounds: none of the lettered SHAs (`D` through `AA`) are
ancestors of `main` any more, so `git log f921246..main` does not carry them and a reader
looking for fix `U` by its SHA will not find it. Only the content survives. skills #35 is also
merged, as `1098354`, which is why this branch was restarted from `main` rather than continued.

THE SIXTEEN PARTIAL VERDICTS HAD NEVER BEEN TRIAGED, and that was the real gap. Eight sessions
reported the tally (1 FAILS, 16 PARTIAL, 6 HOLDS) rather than working it. Triage separated
repo-fixable from owner-decision from production-blocked. Nine rows were repo-fixable, and in
EIGHT of them the guard that already existed had no reachable failure state.

All nine are closed on branch `claude/byahad-partial-triage`, PR #250, eleven commits, with all
five gates green on `272e187`: 131 test files, 1435 passed plus 5 expected-fail, coverage
97.15 / 92.46 / 97.22 / 97.76. The suite count moved 1414 to 1435, exactly the 21 cases added,
and the file count 130 to 131, exactly the one new inventory file. That arithmetic is the
cheapest check that the suite ran what was committed.

  AC-10   the test NAMED for AC-10 re-sent the same event id, so the PRIMARY KEY produced the
          "duplicate" and the idempotency index could be deleted with the test still green
  AC-4    five of getKpis' SEVEN org predicates were unasserted, on the one path where
          byahad_dashboard holds BYPASSRLS and the bound parameter is the only tenant boundary
  AC-1    "returning a typed validation error" was proven by nothing: all seven AC-1 cases
          assert only `success === false`
  AC-8    no test anywhere had attempted a client-role INSERT or UPDATE on `memberships`, and
          two comments in the file claimed it was "covered separately below"
  NFR-7   the inventory's regex needs `(` straight after `fetch`, so it could not match
          `fetcher(`, which is how ALL SIX originating outbound calls are written
  AC-14   "with no LLM call" existed only as a header comment
  NFR-4   ci.yml could lose a gate step entirely, or soften it with continue-on-error, and
          nothing noticed, because the parity check only iterates steps that exist
  NFR-3   no env inventory existed, so a new unvalidated process.env read could appear anywhere
  NFR-6   a pg DatabaseError's `detail` quotes the conflicting key VALUES and arrives under
          `err`, so events.payload could reach a log line with every caller behaving correctly

NFR-6 IS THE ONLY ONE THAT CHANGED BEHAVIOUR. The other eight are guards. Three of those eight
(NFR-7, NFR-3, and AC-14's clause) sit over code that was ALREADY CORRECT, which each commit
says plainly, because a guard written over correct code looks exactly like a fix and proves
nothing until it is mutated.

A CLAIM FROM THE EIGHTH STRETCH IS RETRACTED, and it was load-bearing. That stretch said the
realtime publication carries `payload` "explicitly" among eleven columns, and that both halves
of the chain had been checked. Only one had. The observation came from
`pg_publication_tables.attnames`, and that view returns every column of the table WHETHER OR
NOT a column list is set, so it cannot tell an explicit list from no list. Only
`pg_publication_rel.prattrs` separates them, and nothing had queried it. Queried now,
read-only: `prattrs` is NULL, so there is no column list at all.

The leak conclusion is unchanged and in fact simpler. What changes is the mitigation this
handover recommended twice: restricting the publication would mean ADDING a column list where
none exists, not dropping one entry from an existing one, and once a list exists any column
added to `events` later is silently not published.

AND THE CHEAPER MITIGATION IS PROBABLY UNNECESSARY, which is the better finding. Migration
0024 re-creates `events_select` with `private.subject_is_visible(...)`, and RLS is evaluated at
READ time, so applying it closes the leak for EXISTING ROWS as well as new ones. No
application-side change can do that. An ingest-time payload redaction was designed, costed and
then REJECTED: it adds nothing over 0024, cannot touch existing rows, and would permanently
destroy every task.created title including from the creator and org admins whom AC-6
explicitly requires to retain it. It would have been an AC-6 violation presented as an AC-6
fix. So the live leak is OPERATIONAL, not architectural: apply 0021 to 0024.

FOUR PROPOSED KILLING MUTATIONS COULD NOT KILL ANYTHING, and catching that was worth more than
the proposals. The triage was itself adversarially refuted, and the refuters found:

  AC-8's    `create policy ... for insert using (true)` is not valid Postgres (42601, "only
            WITH CHECK expression allowed for INSERT"). It fails at schema build and reddens
            EVERY db test, which is the reddens-everything class rather than a kill.
  AC-14's   deleting evaluate.ts:61-62 leaves an unmatched `else if`, a syntax error that
            reddens every importer.
  NFR-8's   premise was simply false: handle-events-post.ts:328 IS
            `deps.ipRateLimiter ?? DEFAULT_IP_RATE_LIMITER`.
  fix D's   proposed end-to-end test would return 400, not 422, because
            credentialSubjectRejection short-circuits before the 422 arm. It would have failed
            on correct code.

TWO GUARDS NEARLY SHIPPED THAT WOULD HAVE FAILED ON A CORRECT TREE, both caught the same way,
by running the scan over the tree BEFORE writing the assertion rather than after. NFR-7's
obvious pattern `/fetcher\s*\(/` matches polling-adapter.ts's own JSDoc, which contains
"fetcher (no jsdom, * no real network)"; the paren-walker captures that as an argument list
with no signal. NFR-3's naive scan reports NEXT_PUBLIC_ and X as undeclared variables, because
lib/supabase/client.ts quotes `process.env.NEXT_PUBLIC_*` while explaining that it STOPPED
reading them inline, and lib/bridges/sidecar-server.ts quotes `Number(process.env.X ?? "8787")`
as an example of a bug. Neither variable exists. That is now five guards this campaign has
declined or corrected for failing on correct code, and every refusal is written down where the
guard would have gone.

THE ARTIFACT THE WHOLE EFFORT HAD BEEN MISSING now exists:
`docs/phase-2-foundation/REMEDIATION-PLAN.md` in byahad. Until this stretch the lettered fixes
lived only in commit messages, and the open items only in THIS FILE, in a different
repository. A byahad reader could not see what was found, fixed, proven or outstanding without
reconstructing it from git log, and the squash merge removed even that. The plan states the
dry-run protocol as four checkable steps, and names everything dropped with its reason so it is
not rediscovered as an oversight.

TWO MISTAKES OF MINE, recorded because both are repeats of lessons this campaign had already
written down.

I ran lint and committed in the same command without reading its output, and shipped a
`noUnsafeOptionalChaining` correctness error that would have turned the Lint gate red in CI. A
green vitest run says nothing about tsc or biome, which this handover already said twice. It
was caught on the next check and fixed before the commit was pushed, so no commit on the branch
is red for a bisect.

And I ran a mutation batch against supabase/migrations while adversarial refuters were reading
the same working tree. Two of them reported that `0001_schema.sql` carried an unreverted
`-- MUTATION M1` when they began. I had checked the workflow journal, seen every agent marked
done, and called it safe; that snapshot was taken AFTER the overlap had already happened. They
flagged it themselves instead of being misled, which was their diligence and not my
sequencing. Never mutate a shared tree while anything else is reading it.

STILL OPEN AFTER THIS STRETCH. Deferred with reasons rather than open: NFR-3's "no secrets in
code" clause needs a secret-scanning CI step, which changes the build contract rather than
adding a guard; NFR-6's sidecar sink is deliberately not pino, because lib/log imports ./env
and that is wrong for a separate process; NFR-7's Sentry transports need a custom transport
because NodeTransportOptions exposes neither a signal nor a timeout.

Needing the owner, unchanged in substance: apply migrations 0021 to 0024 (the only urgent one);
keep or revert fix D's 200 to 422, which is now live in `main`; the credential-binding shape
for fix H, still untouched on disk, where the PRD is silent, decisions-log.md:89 and
0003_agent_tokens.sql:29 say per-agent, emitter-setup.md:5 disagrees, and each of the three
possible resolutions changes either the product or the security boundary; AC-5's BYPASSRLS
architecture, where revoking BYPASSRLS is an outage rather than a fix because no INSERT policy
exists on five tables and auth.uid() is NULL on a server connection; and deleting the stray
remote branch `claude/byahad-ac6-privacy-and-token-binding`.

### Tenth stretch: the nine fixes re-measured, and they moved one row between them

THE RESULT FIRST, BECAUSE IT IS NOT THE ONE THE NINTH STRETCH POINTED AT. The twelve rows
that the triage touched or left open were re-judged against the tag `prd-verdicts-2026-10-28`
(`272e187`), twenty four agents, each row graded by a judge and then by an independent refuter
briefed to overturn it. Where a refuter reported, its verdict is the verdict of record.

The tally moves 1 FAILS, 16 PARTIAL, 6 HOLDS to **1 FAILS, 15 PARTIAL, 7 HOLDS**. Exactly ONE
row moved, AC-13, and its fixes were in #249 rather than in the nine. AC-7's judge graded it
HOLDS and its refuter overturned that back to PARTIAL. Committed as
`docs/phase-2-foundation/verdicts-2026-10-28.md`.

**All nine rows the triage repaired returned PARTIAL again, every one confirmed by its
refuter.** The ninth stretch was right that nine guards had no reachable failure state and
right that it closed them. It was the inference that a reader would draw next that was wrong,
and this stretch exists to block it: **guard coverage and clause satisfaction are different
things.** A judge grades the PRD clause. Most of these clauses are unmet in the
IMPLEMENTATION, not merely unguarded, so repairing the guard cannot move the row. AC-1 is the
clearest case: the clause asks for "a typed validation error", and `lib/db/ingest.ts:170`
discards the `ZodError` for the bare string `"invalid_event_shape"`, which the route discards
again at `:416-419`, answering `400 invalid_event` for both a schema failure and an
authorization refusal. No improvement to any test closes that.

So nine vacuous guards became nine load-bearing ones, which is worth having because a vacuous
guard is a place a regression ships green. It is not progress against the PRD and the tally
must not be read as though it were.

THE SECOND FINDING IS A DEFECT IN MY OWN WORK, AND IT IS THE SAME ONE TWICE OVER. A guard that
greps source text also matches the file's own comments, so a comment DENYING what the rule
forbids reddens a correct tree. Five instances of that one mistake now exist in this campaign,
and TWO OF THEM SHIPPED while the other three were being fixed:

  NFR-7 rule 4 and NFR-3's env scan   caught before commit, by running the scan over the tree
                                      before writing the assertion rather than after
  AC-14 `tests/unit/rules.test.ts`    SHIPPED in `49ae7ce`. A refuter edited ONLY the header
                                      comment of `lib/rules/evaluate.ts`, to say it never
                                      calls `fetch()`, and the suite went red, 1 failed of 20
  NFR-4 `continue-on-error`           SHIPPED in `d6ea05e`, a whole-file regex over `ci.yml`
  a proposed NFR-7 rule-1 widening    rejected after a refuter ran it: 1 failed of 18, on the
                                      JSDoc prose at `scripts/check-migration-drift.mjs:80`

The ninth stretch recorded the first two and called them caught. That record now reads as a
boast that the next two falsified, so note the lesson properly: catching an instance of a
defect class twice is not the same as fixing the class, and the fifth instance was produced by
patching the fourth regex individually.

THE FIX IS ONE HELPER, NOT FIVE REGEXES. `tests/helpers/source-scan.ts` strips comments while
preserving length, line breaks and therefore line numbers, and all four text-scanning guards
now read through it. It tracks string AND REGEX literals, because
`lib/bridges/heartbeat-config.ts:58` holds `/^https?:\/\//` inside the directories NFR-3 and
NFR-7 scan: mistaking that for a comment would blank the rest of a real line and make those
guards BLIND, which is worse than the false positive being fixed. Three mutations on the
helper, each discriminating; the naive form reddens exactly the three string and regex cases
including that real file's line.

Then both shipped defects measured against real source, old guard beside new:

  AC-14  Z9  a comment denying fetch() and node:http    old 1 failed of 20   new 22 passed
  AC-14  Z4  `const _leak = globalThis["fetch"]`        old 20 passed        new 1 failed of 22
  NFR-4  W3  `if:` on the audit step                    old 10 passed        new 1 failed of 14
  NFR-4  W4  step moved to a non-required job           old 10 passed        new 1 failed of 14
  NFR-4  W5  a comment naming `continue-on-error`       old 1 failed of 10   new 14 passed

AC-14's rule now also catches computed and aliased access through a global object, and states
in the file that a source scan CANNOT prove reachability: the type-only-import rule carries
that clause, the token scan is a backstop.

ONE MORE VACUOUS GUARD, FOUND BY THE REFUTATION RATHER THAN BY ME. A test named
"NFR-2: malformed event body -> 400, never touches the database" asserted the status and the
error body and stopped, so the database half of its own name was guarded by nothing. It now
counts every base table from `information_schema`, with two floors so an empty catalogue or an
empty database cannot satisfy it vacuously, and it reddens when the rejection path is mutated
to write an `activity_feed` row. The refuter found it by noticing the judge had cited the
test's TITLE as its content, which is the vacuity shape this project has been cataloguing.

TWO ITEMS RESOLVED AS RECORDS RATHER THAN AS CODE, each because it is not mine to decide:

`scripts/check-migration-drift.mjs` is in no gate BY DESIGN. It needs read access to the
production migration table, and a production credential in CI is a security decision with an
owner rather than a wiring task. The consequence is now stated plainly instead of left
implied: NO AUTOMATED CHECK IN THAT REPOSITORY CAN DETECT PRODUCTION MIGRATION DRIFT, because
every gate builds its schema from `supabase/migrations/` with `readdirSync`. Until 0021 to
0024 are applied, a human running that command is the only detector.

`AGENT_TOKENS_JSON` is credential-bearing and absent from both env schemas, and an earlier
record implied that gap was closed. It was not, and that is corrected: `27bdd2c` added a
declared EXCEPTION for it, which is the opposite of closing it. But two mutations show its own
validation is load-bearing (a permissive map on malformed JSON gives 1 failed of 13, the shape
schema bypassed gives 2 failed of 13), so the whole remaining delta is fail-fast at boot
versus fail-closed at use. `lib/env.ts:165-171` already records that repository trying the
change for two analogous variables, reverting it, and concluding it should be made "for both
variables at once or neither". Doing it for one would contradict that and turn a
misconfiguration that currently 401s every agent into one that refuses to boot.

STATE. byahad PR #250, fifteen commits, all five gates green on `5f489b8`: 132 test files,
1451 passed plus 5 expected-fail, and the post-run freeze check confirms HEAD and the tree
were unmoved for the whole run. The PR title and body were rewritten, because the old body
carried the claim that the comment-regex defect had been "caught both times".

WHERE PRODUCTION STILL DIFFERS, and this is unchanged and still the thing that matters most.
It has applied 0001 to 0015. **AC-8 is FAILS for the deployed system, not PARTIAL**: 0023's
SECURITY DEFINER hardening is unapplied, so the `pg_temp` shadowing route on `memberships` is
open live with CI green. AC-6's leak is open live, and 0024 closes it for EXISTING rows
because RLS is evaluated at read time, which no application-side change can do.

METHOD NOTES. The eighth stretch's lesson was to freeze the tree or judge a tag, and judging a
tag worked: no refuter had to correct its judge's description of a moving tree this time,
against five of five last time. The new note is that the refutation stage paid for itself
again in a way a cheaper check would not have: one refuter OVERTURNED its judge outright
(AC-7), three kept the label while refuting every stated reason for it, and eleven of twelve
needed a factual correction. A judge agreeing with itself is not evidence.

STILL THE OWNER'S, never unilateral: apply 0021 to 0024, the only item with ongoing cost; keep
or revert fix `D`'s 200 to 422; AC-1's typed-error fix, which changes an HTTP response code and
rewrites tests other rows assert against; fix `H`'s credential-binding shape; AC-10's
convergence semantics, which `lib/db/ingest.ts:255-258` documents as a deliberate deferral;
AC-5's BYPASSRLS architecture; whether a secret scanner belongs in the required job; deleting
the stray branch `claude/byahad-ac6-privacy-and-token-binding`; and merging #250 and #36.


### Eleventh stretch: production caught up, the refutation turned into code, and a row finally moved

THE ONE THAT MATTERS. **Migrations 0016 to 0024 are APPLIED to the live project.** It went
from 15 to 24, with the owner's explicit authorization, in order. Nine sessions had recorded
the gap and none had closed it, because production DDL was never ours to take unilaterally;
this time it was asked for directly and granted.

A CORRECTION TO EVERY EARLIER STRETCH THAT SAID "apply 0021 to 0024": it was NINE migrations,
not four. 0021 cannot be applied without 0016 to 0020, which were also missing, because
migrations are sequential. The four named were the security-relevant ones. Anyone acting on
the old phrasing would have tried to skip five.

Measured against the catalogue before and after, not inferred:

  events_select            private.is_member(org_id)
                        -> private.is_member(org_id) AND private.subject_is_visible(...)
  private.* definer        search_path=public on 3 fns -> search_path="" on 5 fns
  projects/tasks triggers  none -> 4 present
  client write policies    4 -> 4, UNCHANGED

The first line IS the AC-6 leak and its before-value is what proves the finding was real
rather than inferred: org membership ALONE gated the read. The second is the AC-8 pg_temp
shadowing hole. Both closed live, and because RLS is evaluated at READ time, 0024 covered rows
that already existed, which no application change could do.

The deployed system was then graded AGAIN from the catalogues, as
`docs/phase-2-foundation/production-conformance-2026-10-28.md`. Applying a fix without
re-measuring would have left a fix nobody checked, which is the defect this whole effort is
about. All four BROKEN LIVE rows are FIXED LIVE; RLS is on all ten public tables; zero write
policies lack the role gate; `events` is still the only publication table with prattrs NULL,
the third independent confirmation of that retraction.

AC-5 REMAINS THE SINGLE FAILS, now with the measurement rather than an assertion behind it:
three roles (byahad_backup, byahad_dashboard, byahad_ingest) are loginable, password-bearing
and BYPASSRLS, so on the dashboard read path the bound org_id is the only tenant boundary.
Revoking it is an outage, not a fix.

A LIMIT ON MY OWN CLAIM, recorded because applying migrations was my action: the
before-snapshot captured policies, functions, triggers and columns but NOT roles, so I cannot
say from measurement whether byahad_backup predated the apply. It almost certainly did, since
0016 creates it only `if not exists` and sets NO password while the role has one. That is an
inference from the migration's content and is written down as one.

THE METHOD CHANGED, BECAUSE THE OWNER WAS RIGHT TO CHALLENGE IT. The objection: judging and
refuting with the SAME model is correlated error, so it is largely a waste of money. Partly
right, and it forced a correction to this campaign's own headline. The pass-1 confirmations had
been presented as corroboration; they are not, because agreement between two runs of one model
is one opinion stated twice. Both documents now say "no refuter dislodged it", which is the
thinner and truer claim.

But the data also showed WHY the refutation had worked when it worked: almost every win was a
MEASUREMENT, not a judgement. A refuter ran the mutation a prior pass had only described. One
queried prattrs. One ran a proposed regex and found it red on a correct tree. Model diversity
was not the mechanism; adversarial RE-MEASUREMENT was. So the running refuter fleet was
stopped mid-flight, saving roughly 750k tokens, and the valuable part was rebuilt as tests:

  tests/helpers/source-scan.ts            the shared comment-stripper
  tests/unit/text-scanning-guards.test.ts no guard may assert absence over RAW source
  tests/unit/no-secrets-in-code.test.ts   NFR-3 clause 1, 344 committed files, 8 patterns
  tests/unit/human-console-write-surfaces.test.ts  AC-7's server-action premise
  plus a pg_policy enumeration of every write surface, in rls.adversarial

Writing the first of those immediately found two LATENT instances of the very defect five
separate agent runs had been hunting one at a time. That is the argument for code over a
second provider, and no cross-provider model was available in the session anyway.

AC-7 MOVED TO HOLDS. Tally 1 FAILS / 14 PARTIAL / 8 HOLDS, from 1 / 15 / 7. This reversed a
position held firmly for several turns, and the justification is new evidence rather than
pressure: the clause has three surfaces and all three are now pinned by test. It is NOT
corroborated by an adversarial model pass and the record does not pretend otherwise.

TWO MIS-SCOPINGS FOUND BY RE-READING MY OWN "OWNER DECISION" LIST, which is the lesson worth
carrying. Twice, something filed as the owner's turned out to be mine:
  * NFR-3's "no secrets in code" was filed as needing a CI step. A test in the gating job
    closes it with no tool, no credential and no workflow change.
  * AC-7's write-surface enumeration was filed as a judge's reading. pg_policy makes it finite.
Both were found by asking which items were justified by a TOOL or a CONTRACT rather than by a
failure mode. That question is the one to ask next time.

AND THE MOST INSTRUCTIVE MISTAKE OF THE WHOLE CAMPAIGN, mine, made by hand. Checking AC-7's
server-action premise I grepped for a "use server" directive, got TWO files, and told the owner
a judge had mis-enumerated. The second hit was the phrase inside a COMMENT in app/page.tsx. The
judge was right; my grep was wrong, in exactly the way five guards here were wrong, ONE COMMIT
after shipping the helper that prevents it. Corrected in the same message. The test now reads
through that helper and its guard-the-guard case is that exact file.

Also recorded: `git checkout <file>` reverts to HEAD and so DISCARDS an uncommitted fix on that
file. It silently lost the NFR-7 client binding and a rule widening, both reapplied. Commit
before mutating, or back up and md5-check on restore.

STATE. byahad PR #250, 28 commits, all five gates green on 98567bf: 135 files, 1482 passed plus
5 expected-fail. skills PR #36 green. Still the owner's: AC-1's typed error (changes a public
HTTP code), AC-10's convergence semantics (its own code comment defers them), AGENT_TOKENS_JSON
(fail-fast at boot versus fail-closed at use), AC-5's BYPASSRLS architecture, NFR-6's remaining
production weakness (an APP deploy, not a migration), and merging both PRs.


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

Follow-up 2026-10-20 (branch fix/rac-pool-route-recipients): all four pool routes answered
HTTP 200 through 9router with its existing OpenRouter key (no new key minted; the vault holds
none). OpenRouter served GLM via Morph, Kimi via InferenceNet and MiMo via Novita, not the model
vendors, so model-pool.json `route` and the MODELS.md egress text now name "OpenRouter and the
hosts it routes to" as the consent recipient. claude-qwen answers through clink (PR #28).
