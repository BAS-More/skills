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
