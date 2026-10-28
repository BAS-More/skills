# Continuation prompt for BAS-More/skills

> **Update 2026-09-29: the routing-benchmark objective below is complete** (Run 4 in
> `docs/mcp-tool-routing-layer-validation.md`; summary in `HANDOVER.md` → "Session
> 2026-09-29"). Do not re-run it.
>
> **Update 2026-10-06:** the `claude/plugin-json-misc` PR (#14) is merged as
> `fad207d`, so the four `skills/misc/` skills are in `.claude-plugin/plugin.json`.
> The publication invariants are no longer a manual checklist. Run
> `./scripts/check-invariants.sh` before committing any skill change, and the
> `Skill invariants` workflow runs it on every PR that touches `skills/`,
> `README.md`, or the manifest. See `HANDOVER.md` → "Session 2026-10-06".
>
> **Update 2026-10-11:** items 2 and 3 below are **done**, and the invariant checker
> now enforces all fifteen rules the repository states rather than eight. PR #21 is
> merged as `5951462`. See `HANDOVER.md` -> "Session 2026-10-11" for the measurements.
> `Status:` is now the bare enum and rule 14 enforces it, so the session gate is
> machine-checkable. `shellcheck` ran clean at `-S style` on all three shell scripts:
> the egress denial that blocked it no longer applies in this environment.
>
> **Update 2026-10-22: nothing below moved.** That session's work was in
> `BAS-More/byahad`, not here. Items 1 and 4 are untouched; items 2 and 3 remain done.
> Two things it is worth knowing before you start:
>
> - Graph steps were skipped and not built. `.project-memory/` holds only `config.json`
>   and `POLICY.md`, there is no `graph` command on PATH, and CLAUDE.md says to skip
>   rather than install in that case. Graph readiness still has no acceptance evidence.
> - `scripts/check-invariants.sh` rule 12's comment says the handover pair is exempt from
>   the no-em-dash rule, but `EM_DASH_EXEMPT` lists only `CHANGELOG.md` and the two
>   routing documents plus `docs/mcp-routing-benchmark/`. The pair is therefore NOT
>   exempt. It passes today because both files contain zero em-dashes, so the exemption
>   is dead code and the rule is live on them. Write these two files without em-dashes,
>   or fix the array to match its comment. Deciding which is a small piece of work nobody
>   has done.
>
> See `HANDOVER.md` -> "Session 2026-10-21/22" for what was done in byahad, including the
> four things that session got wrong.
>
> **Update 2026-10-22, later:** Avi answered four of the seven byahad owner decisions, and
> the work they unlocked is in flight THERE, not here. Still nothing moved in this
> repository beyond this handover pair. Three byahad decisions remain open (AC-3, AC-12,
> NFR-5). If you are picking up the byahad thread rather than this one, read
> `HANDOVER.md` -> "Second half of the session" first: it records two traps that cost real
> time (a SECURITY DEFINER helper that must stay definer or AC-6 silently reopens, and an
> inline subquery in an RLS policy being RLS-filtered itself, which made a containment
> gate read as correct while doing nothing), plus the fact that the Realtime half of AC-6
> cannot be verified from a PGlite harness and needs a live check.

> **Update 2026-10-22, latest. The three-open-decisions line above is out of date, and so
> is "in flight".** Avi merged BOTH byahad PRs (#243, #244); `main` there is `3eeaa5c`.
> There were FOUR decisions left, not three (NFR-2 was missed), and all four are now
> answered but NONE is implemented: AC-3 -> catalog test; AC-12 -> mark met and supersede
> DL-4; NFR-2 -> add Zod at `app/api/notifications/act/route.ts`; NFR-5 -> ratify the
> global aggregate. Patches for all four were drafted and abandoned unverified, so treat
> them as designs. Still nothing moved in THIS repository beyond this handover pair.
>
> If you pick up byahad, read `HANDOVER.md` -> "Third stretch" before anything else. The
> two things that matter most there: (1) TWO REVIEW-BOT FINDINGS landed on #244 minutes
> before it merged and are UNVERIFIED, so they are now in `main`. One says the new token
> binding may reject the documented machine emitter / shared-token sidecar, the other says
> the Command Centre's BYPASSRLS reads never evaluate the new containment policy, and that
> second mechanism is confirmed by the repo's own comment while its CLASSIFICATION
> (regression versus pre-existing gap) is not; (2) AC-12's recorded blocker was simply
> FALSE. The transport seam exists and AC-12 was already satisfied, which is corrected in
> `HANDOVER.md` and in draft PR #245's body but is still wrong in #244's merged
> description. A full five-gate dry-run of both PRs together did pass before they merged
> (117 files / 1306 tests, build clean), and it is what exposed the integration defect
> that draft PR #245 fixes. One chore needs a human: delete the stray remote branch
> `claude/byahad-ac6-privacy-and-token-binding`, which a push recreated after GitHub had
> deleted it on merge; `git push --delete` is blocked in that environment.

> **Update 2026-10-22, final state of that session.** One of the four decisions is
> implemented: AC-3, in draft PR #246, which is STACKED on #245 (base is
> `claude/byahad-conformance-reason-guard`, not `main`), so merge #245 first. Three remain
> unimplemented (AC-12/DL-4, NFR-2, NFR-5) with designs in `HANDOVER.md`. The two
> review-bot findings are STILL UNVERIFIED after a second attempt that returned no
> verdicts, so they remain in `main` unexamined, and `HANDOVER.md` -> "Fourth stretch"
> names the one question that decides each. Three gaps are open and none is a formality:
> no full five-gate run exists against post-merge `main` (`3eeaa5c`); the 23-row PRD
> verdict table is stale against the merged tree and only re-running the judge-and-refute
> pass updates it honestly; and the Realtime leg of AC-6 cannot be observed from PGlite
> and needs a live project, which was not attempted because it means writing data to a
> live project.

> **Update 2026-10-22, read this before anything else in byahad.** BOTH review-bot
> findings are now VERIFIED, so do not re-verify them. One is a SHIPPED REGRESSION that
> breaks the primary ingestion path in `main`: #244's credential binding rejects every
> event from the documented emitter and the orca sidecar, always, because a token is
> minted once per machine while every event's agent id is a per-session or per-pane uuid.
> Nothing alerts either, since the sidecar is the sole writer of the two statuses that
> alert. Draft PR #247 proves it with a test that fails on `main` and three controls that
> pass, and deliberately does not fix it: the binding matches resolved decision CR-2
> ("per-agent" tokens) and contradicts `docs/emitter-setup.md` ("once per machine"), so
> the fix changes what the security boundary means and is Avi's call. The two coherent
> options are written out in `HANDOVER.md` -> "Fifth stretch". The second finding is real
> but narrow: `lib/dashboard/queries.ts` already mirrors RLS privacy in SQL on purpose and
> mirrors only a task's own flag, not 0024's containment, so the fix is to extend the
> existing mirror to consult the parent project.

> **Update 2026-10-22, final. ALL FOUR remaining owner decisions are IMPLEMENTED** in
> draft PR #246, stacked on #245, each dry-run before the next (AC-3 catalog test, NFR-5
> ratified to the enforced aggregate, AC-12 met with DL-4 superseded, NFR-2 Zod at the
> last hand-rolled boundary). The open-decision list is empty. Two things from
> `HANDOVER.md` -> "Sixth stretch" matter most: the NFR-2 schema must keep reusing the
> route's own regexes rather than `z.string().uuid()`, because an HTML-attribute sink
> depends on those exact charsets; and both guards built this session caught their own
> author, once by passing when it should have failed (the rules bind the literal to the
> map, not the map to reality) and once by turning #247's CI red on purpose, whose fix is
> decided (`it.fails`) and only needs pushing. Four things remain: the credential-binding
> fix awaiting Avi's choice, the 23-row verdict re-run (which was starved by running
> alongside a full suite, so give it a quiet window; its script is preserved and
> resumable), the Command Centre containment mirror, and the Realtime leg of AC-6. The
> five-gate run on `6eb86a0` PASSED and is recorded: 118 files / 1310 tests, clean build,
> coverage above every floor. #247's red CI is fixed and pushed (`a2f58e3`, `it.fails`),
> with the flip to red on a real fix verified by mutation.

> **Update 2026-10-27. Nothing below moved; the work was in byahad again. THE STANDING GOAL
> IS NOW SATISFIED on the one item that was mine to close: the full five-gate run on the
> final state is done and ALL FIVE ARE GREEN** on `b6db000` (121 files, 1341 passed plus 3
> expected-fail, coverage 95.97 / 91.48 / 96.34 / 96.52, every figure above its floor and
> every one higher than the previous recorded run). Read `HANDOVER.md` ->
> "Seventh stretch" for the detail. Five things are worth knowing before you touch either
> repository:
>
> - THE SIXTH STRETCH'S EXPLANATION OF THE STARVED VERDICT PASS IS WRONG, and so is the
>   lesson it drew. It blamed CPU contention from the test suite. The real cause is
>   `nproc: 4` giving a per-workflow concurrency cap of `min(16, nproc - 2)` = 2, with the
>   agents I/O-bound on model calls (load average 0.15 while running). THE CAP IS PER
>   WORKFLOW, so sharding into several top-level workflows multiplies the slots, and that
>   is what made the pass complete. Do not avoid running a suite alongside a workflow on
>   the strength of that older note.
> - THE 23-ROW VERDICT TABLE IS SETTLED and committed at
>   `docs/phase-2-foundation/verdicts-2026-10-22.md`: 2 FAILS, 16 PARTIAL, 5 HOLDS, from a
>   prior 0 / 14 / 9. Do not re-run it. Refutation moved three verdicts in BOTH directions,
>   including one of my own reports being retracted outright (AC-3 HOLDS; the drift
>   scenario does not compile, proved with an isolated `tsc` probe).
> - DRAFT PR #249 CARRIES FIXES D, E AND F plus a dependency commit, and it needs one
>   owner decision that is not a defect: fix D turns a cross-org `agent.registered` from
>   200 into 422. That is the intent, but it is a response code change on a public ingest
>   route, so it wants an explicit veto or acceptance.
> - `npm audit` WILL GO RED ON AN UNCHANGED LOCKFILE, because it reads `package-lock.json`
>   against the live advisory database. That is what turned #249's first CI run red, on a
>   lockfile byte-identical to `main`'s, and `main` fails that gate identically today. The
>   fix pattern is an `overrides` entry, which is what that repository already uses for
>   transitive security pins. One trap: a plain `npm install` there also strips `libc`
>   fields from optional platform packages, because the local npm predates the npm that
>   wrote the lockfile, so edit the entries surgically or regenerate under node 24.
> - THE ONE RULE THIS SESSION KEPT RE-LEARNING, five times against my own work: a guard's
>   strength cannot be assessed by READING it, only by mutating against it, and only once
>   the harness has been shown capable of reporting a PASS. One harness grepped for a count
>   that never matched even unmutated, so every mutation printed KILLED unconditionally;
>   one mutation silently never applied because shell `$` escaping mangled its anchor; and
>   one guard line was missing from the file while the test written to cover it passed
>   anyway, because its fixture never reached the code path. Assume the instrument is
>   broken until it has proved otherwise.
>
> What is open in byahad is owner decisions rather than work: the credential-binding shape
> (three sources, three answers), AC-5 and AC-6 (BYPASSRLS is ratified architecture while
> `design.md:18` promises RLS guards every human read path, and both cannot be fully true),
> the Realtime leg of AC-6 (needs live-project writes), and fix D's response code. One
> chore still needs a human: delete the stray remote branch
> `claude/byahad-ac6-privacy-and-token-binding`.

> **Update 2026-10-27, later. Nothing below moved; the work was in byahad again. THE VERDICT
> TABLE IS NO LONGER WHAT THE BLOCK ABOVE SAYS:** five rows were re-judged and AC-6 moved
> FAILS to HOLDS, so the tally is 1 FAILS, 16 PARTIAL, 6 HOLDS, recorded in
> `docs/phase-2-foundation/verdicts-2026-10-27.md` beside the 10-22 table, which keeps the
> other eighteen rows. Read `HANDOVER.md` -> "Eighth stretch" for the detail. Four things are
> worth knowing before you touch either repository, and ONE OF THEM IS URGENT: THE LIVE
> SUPABASE PROJECT IS NINE MIGRATIONS BEHIND THE REPO (applied 0001 to 0015, repo holds
> 24), so every security hardening from 0021 to 0024 is absent and a private task title is
> currently pushed to every org member over Realtime. Read `HANDOVER.md` -> "Eighth
> stretch" first; applying the migrations is an owner decision, and a green CI run is NOT
> evidence a database-level fix is in effect, because every gate builds its schema from
> the migration files. The repo-side gate is settled, ALL FIVE GREEN on `3766917` (twenty-six commits, 1414 passed plus 5 expected-fail): ALL FIVE ARE
> GREEN on `16b65a0`, all twenty-two commits, 1399 passed plus 5 expected-fail, coverage
> 97.15 / 92.46 / 97.22 / 97.76 over an 84-file denominator that GREW from 82:
>
> - ALL FIVE REFUTERS HAD TO CORRECT THEIR JUDGE'S DESCRIPTION OF THE TREE, and in two cases
>   that correction WAS the verdict. The remediation and the judging ran at the same time, so
>   each judge measured a head that had moved by the time it reported. If you run a judging
>   pass, freeze the tree or judge a tag. Do not rely on the refuters catching it again.
> - THREE OF THE SESSION'S OWN GUARDS WERE DEFECTIVE, found by refuters running mutations
>   against work that had passed its own mutation suite an hour earlier. A guard's strength
>   cannot be assessed by its author: you test the failure modes you thought of, and the ones
>   you did not think of are exactly what is left. Budget for someone else attacking it.
> - A REFINEMENT TO THE CONCURRENCY NOTE ABOVE, which is right about the workflow and wrong
>   about the suites. Agents waiting on model calls are I/O-bound, as it says. A REFUTER is
>   not: it runs mutations, and each mutation runs the suite. Three concurrent
>   vitest-plus-coverage runs on `nproc: 4` measured load average 15.99 and slowed everything
>   including the gate run. Shard the workflow for slots, then expect the suites to serialise.
> - TWICE A REFUTER REJECTED A GUARD ITS OWN JUDGE DEMANDED, and both refusals are recorded
>   with reasons in the verdict file, because writing either would have been worse than not.
>   One would have failed on a correct implementation; the other could not fail at all. If you
>   read the verdict file and think an obvious fix is missing, check that section first.

> **Update 2026-10-28. Nothing below moved; the work was in byahad again. BOTH PRs ARE NOW
> MERGED and two claims in the block above are WRONG.** byahad #249 merged as `59c0eea` and
> skills #35 as `1098354`, which is why this branch was restarted from `main`.
>
> - **#249 WAS SQUASHED.** None of the lettered SHAs (`D` through `AA`) are ancestors of
>   byahad `main` any more, so looking one up by its SHA fails and only the content survives.
> - **THE PUBLICATION CLAIM IS RETRACTED.** The block above says the realtime publication
>   carries `payload` "explicitly" among eleven columns, with both halves checked. Only one
>   was. `pg_publication_tables.attnames` returns every column WHETHER OR NOT a column list
>   is set, so it cannot tell an explicit list from no list; only
>   `pg_publication_rel.prattrs` can, and nothing had queried it. It is NULL: there is no
>   column list. The leak finding stands, but the mitigation this prompt recommended twice is
>   a different operation, since it would mean ADDING a list where none exists.
> - **AND THAT MITIGATION IS PROBABLY UNNECESSARY, which is the better news.** Migration 0024
>   re-creates `events_select` with `private.subject_is_visible(...)`, and RLS is evaluated at
>   READ time, so applying it closes the leak for EXISTING rows too. No application-side
>   change can do that. An ingest-time payload redaction was designed and then rejected: it
>   adds nothing over 0024 and would destroy every task.created title, including from the
>   creator and admins whom AC-6 requires to retain it. The live leak is OPERATIONAL, not
>   architectural. Applying 0021 to 0024 is still the one urgent owner action.
> - **THE SIXTEEN PARTIALs ARE TRIAGED AT LAST**, which eight sessions had reported rather
>   than worked. Nine rows were repo-fixable and all nine are closed in PR #250 (eleven
>   commits, all five gates green on `272e187`, 131 files, 1435 passed plus 5 expected-fail).
>   Eight of the nine were guards with no reachable failure state. Read `HANDOVER.md` ->
>   "Ninth stretch" for the list and the mutation evidence.
> - **`docs/phase-2-foundation/REMEDIATION-PLAN.md` NOW EXISTS in byahad.** Until this
>   stretch the lettered fixes lived only in commit messages and the open items only in THIS
>   file, in a different repository. Prefer the plan over this prompt for byahad state.
> - Two traps worth carrying: FOUR proposed killing mutations could not kill anything (one was
>   invalid SQL that reddens every db test, one left a syntax error, one rested on a false
>   premise, one would have failed on correct code), and TWO guards nearly shipped that would
>   have failed on a correct tree because their patterns matched PROSE inside comments. Both
>   were caught by running the scan over the tree BEFORE writing the assertion.
>   **CORRECTED 2026-10-28: two MORE instances of that second trap shipped, in this very
>   stretch, and catching the first two is what made it look handled. See the update below.**

>
> **Update 2026-10-28: the nine fixes were re-measured and they moved ONE row between them.**
> Read `HANDOVER.md` -> "Tenth stretch" before acting on anything above about PR #250.
>
> - **The tally is 1 FAILS, 15 PARTIAL, 7 HOLDS**, from 1 / 16 / 6, committed as
>   `docs/phase-2-foundation/verdicts-2026-10-28.md` and measured against the tag
>   `prd-verdicts-2026-10-28`. Twelve rows, each graded by a judge and then by an independent
>   refuter briefed to overturn it; the refuter's verdict is the one of record.
> - **Exactly one row moved, AC-13, and its fixes were in #249 rather than in the nine.**
>   AC-7's judge graded it HOLDS and its refuter overturned that back to PARTIAL.
> - **ALL NINE rows the triage repaired returned PARTIAL again, every one refuter-confirmed.**
>   The bullet above is right that nine guards had no reachable failure state and right that
>   it closed them. What a reader must not infer is that conformance improved. **Guard
>   coverage and clause satisfaction are different things:** a judge grades the PRD clause,
>   and most of these clauses are unmet in the IMPLEMENTATION, not merely unguarded. AC-1
>   asks for "a typed validation error" while `lib/db/ingest.ts:170` discards the `ZodError`
>   for the bare string `"invalid_event_shape"`. No test change closes that.
> - **The comment-in-prose trap shipped twice.** AC-14's guard in `49ae7ce` went red when a
>   refuter edited ONLY a comment in `lib/rules/evaluate.ts` to say it never calls `fetch()`,
>   and it was simultaneously blind to `globalThis["fetch"]`. NFR-4's `continue-on-error`
>   check in `d6ea05e` was a whole-file regex. A fifth instance was proposed and rejected
>   after a refuter ran it. Catching an instance twice is not fixing the class, and patching
>   the fourth regex individually is what produced the fifth.
> - **The remedy is one helper**, `tests/helpers/source-scan.ts`, read by all four
>   text-scanning guards. It tracks string AND REGEX literals, because
>   `lib/bridges/heartbeat-config.ts:58` holds an escaped-slash regex inside the scanned
>   directories and mistaking it for a comment would make those guards BLIND. Both shipped
>   defects are measured old-guard-beside-new in the tenth stretch.
> - **PR #250 is fifteen commits, all five gates green on `5f489b8`**: 132 files, 1451 passed
>   plus 5 expected-fail, freeze check clean. Its title and body were rewritten, because the
>   old body carried the "caught both times" claim.
> - **AC-8 is FAILS for the DEPLOYED system, not PARTIAL.** 0023 is unapplied, so the
>   `pg_temp` shadowing route on `memberships` is open live with CI green. Applying 0021 to
>   0024 remains the one urgent owner action, and no gate in that repository can detect
>   production migration drift at all, by design.

>
> **Update 2026-10-28 (later): PRODUCTION IS CAUGHT UP.** Read `HANDOVER.md` -> "Eleventh
> stretch" before acting on anything above about migrations.
>
> - **Migrations 0016 to 0024 are APPLIED** to the live project, with the owner's explicit
>   authorization. It went from 15 to 24. The AC-6 privacy leak and the AC-8 pg_temp
>   shadowing hole are CLOSED LIVE, and because RLS is evaluated at READ time, 0024 covered
>   rows that already existed.
> - **CORRECTION to every earlier mention: it was NINE migrations, not four.** 0021 cannot be
>   applied without 0016 to 0020. The four named were only the security-relevant ones.
> - The deployed system was re-graded from the catalogues as
>   `production-conformance-2026-10-28.md`. All four BROKEN LIVE rows are FIXED LIVE.
> - **AC-7 moved to HOLDS; the tally is 1 FAILS / 14 PARTIAL / 8 HOLDS.** All three of its
>   surfaces are pinned by test now, not by a judge's reading. It is NOT corroborated by an
>   adversarial model pass and the record says so.
> - **The method changed.** Judging and refuting with the same model is correlated error, so
>   the confirmations were never corroboration; both documents are corrected. The part that
>   worked was adversarial RE-MEASUREMENT, so it was rebuilt as tests: a shared
>   comment-stripper, a rule that no guard may assert absence over raw source, a committed
>   secret scan, an AC-7 server-action pin, and a pg_policy enumeration of every write
>   surface. Writing the first found two LATENT instances of the defect five agent runs had
>   been hunting one at a time.
> - **AC-5 is the single FAILS**, with the measurement behind it: three loginable,
>   password-bearing BYPASSRLS roles. Revoking is an outage, not a fix.
> - Still the owner's: AC-1's typed error (a public HTTP code), AC-10's semantics,
>   AGENT_TOKENS_JSON's boot behaviour, AC-5's architecture, NFR-6's production weakness (an
>   APP deploy, not a migration), and merging byahad #250 and skills #36.

> What remains:
> 1. The project-memory continuation sections at the end of this prompt. Untouched.
> 2. ~~Normalise the `Status:` field in `HANDOVER.md`~~ done, and now enforced.
> 3. ~~Run `shellcheck` over `scripts/check-invariants.sh`~~ done, zero findings.
> 4. Two owner decisions, neither of which is more work:
>    `CLAUDE-PROJECT-RULES.md` and `.agents/writing-docs.md` disagree about whether a
>    docs page must carry four sections or may omit two when thin (rule 8 enforces only
>    the fixed frame, and a test pins the omission as legitimate, so nothing is blocked
>    on this); and the `braces` advisory needs a major bump read rather than a lockfile
>    edit. Dependabot now raises both.

You are continuing Codex thread `01a03bc7-0d2a-75e2-8c3e-c9d125ded17e` in `https://github.com/BAS-More/skills`.

Before doing anything:

1. Read `00-READ-FIRST.md`, `HANDOVER.md`, `AGENTS-PROJECT-RULES.md` if present, and `CLAUDE-PROJECT-RULES.md`.
2. Read `docs/mcp-routing-benchmark/HANDOVER.md`, its prompt, and `docs/mcp-tool-routing-layer-validation.md`.
3. Run `git status --short`, `git branch --show-current`, `git log --oneline -5`, `git remote -v`, and `gh pr list --state open`.
4. Compare `origin/main` with `origin/claude/mcp-tool-calling-layer-9g9q8j` by content. Preserve unique commits before cleanup.
5. Do not assume the private Codex transcript is available or that uncommitted thread work exists on GitHub.

Primary objective: finish the semantic MCP/tool-routing evaluation without tuning the benchmark to the desired outcome.

- Check the documented `huggingface.co` blocker once.
- If policy still denies access, record exact evidence, set the handover to `BLOCKED`, and stop rather than working around policy.
- When clear, run both BGE semantic and hash control commands under the same configuration.
- Reject any semantic result with zero embedding requests.
- Record top-1, empty-result rate, embedding calls, overhead, exclusions, commit, and configuration.
- Update `docs/mcp-tool-routing-layer-validation.md` with a reproducible conclusion.
- Maintain the skill bucket, README, and plugin-manifest invariants. Verify with
  `./scripts/check-invariants.sh`, not by reading the rules by hand. Since 2026-10-11
  it also checks the docs-page frame, `agents/openai.yaml` presence and invocation-mode
  agreement, `ask-matt`'s coverage of user-invoked skills, the no-em-dash rule, every
  entry point's pointers, and `HANDOVER.md`'s `Status` field. If a rule here reads as
  convention, check whether the script already enforces it before trusting your memory.

Do not kill processes with broad `pkill -f`, commit caches/secrets, or report a score before validating the scorer.

Before stopping, update `HANDOVER.md` and this prompt, run the relevant checks, commit, push, and open/merge a PR according to repository protections. Mark the handover `COMPLETE` only when its definition of done is fully evidenced.


## Independent project-memory template continuation, 2026-09-14

Avi also requests comprehensive MAH-style memory graphs across repositories and
an offer for future projects. The separate branch `codex/project-memory-bootstrap-20260914`
adds docs/project-memory/README.md plus project/global instruction templates.
Read those files and the matching HANDOVER.md section when continuing this task.
They are bootstrap instructions, not a verified universal installer. Factor and
test the shared toolkit, adapt extractors per repository, then perform the
authorized rollout and configure the actual clients. Preserve the original
ACTIVE routing benchmark and do not claim it or MAH's external-service tests
were completed by this documentation work.


## Project-memory installation continuation, 2026-09-14

The approved templates now have a tested policy installer; start with
`docs/project-memory/INSTALL.md`, then the latest installation section in HANDOVER.md.
Codex and Claude user instructions were installed and hash-verified on AVISURFACE.
The repository rollout has isolated, verified PRs and merges subject to normal gates.
Read the aggregate snapshot and the owner's private detailed record before doing
further work; do not repeat already verified installation or publish private inventory.

The next substantive memory task is per-project graph bootstrap and acceptance,
plus resolving the recorded repository gates. Policy installation is not proof of
nine-graph readiness or actual agent compliance. Preserve the existing MAH setup,
the separate eight pending external-service cases and the original ACTIVE benchmark.
Earlier public PR history contains portfolio metadata; HEAD is aggregate-only.

The final installer has 11 passing Linux/Windows tests, including formatter receipts.
MAH's nine-view session freshness check passed. Use the private final record for
per-repository merge outcomes; the public JSON records scope only.


## Review-and-continue portability continuation - 2026-10-18

Review the isolated codex/review-and-continue-portable diff. The skill now supports Claude Code
and Codex tools/transcripts; Total Recall remains enabled, Knowledge-Graph provides code context.
Check the latest validation entry in HANDOVER.md. Keep the existing project-memory workstream
unchanged. Scan any outgoing range and obtain parent review before publishing this branch.
