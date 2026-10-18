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
