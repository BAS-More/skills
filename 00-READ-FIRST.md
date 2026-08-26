# 00 — Mandatory first read

**This is the repository's session entry point. Read it before opening implementation files, running commands, or changing Git state.**

Read in this order:

1. [`HANDOVER-PROMPT.md`](HANDOVER-PROMPT.md) — the self-contained continuation instruction.
2. [`HANDOVER.md`](HANDOVER.md) — verified state, unfinished work, risks, and completion criteria.
3. [`AGENTS-PROJECT-RULES.md`](AGENTS-PROJECT-RULES.md), when present.
4. [`CLAUDE-PROJECT-RULES.md`](CLAUDE-PROJECT-RULES.md), when present.
5. The project documents named by the handover.

## Status rule

The `Status:` field near the top of `HANDOVER.md` controls this gate.

- **`ACTIVE`** — the handover and prompt are mandatory. Continue the listed work; do not silently start a different project.
- **`BLOCKED`** — read the blocker and preserve the repository. Do not work around access, credentials, safety, or owner-decision boundaries.
- **`COMPLETE`** — the listed handover items have been discharged. Normal repository instructions apply, but verify the completion evidence before reopening old work.
- **A newer handover exists** — it supersedes this one only when this file and the canonical `AGENTS.md` / `CLAUDE.md` pointers are updated in the same commit. A dated file sitting elsewhere does not supersede anything by itself.

## Evidence rule

A Codex thread URI is an identifier, not evidence available inside a Git checkout. Claims in the active handover are reconstructed from GitHub-visible commits, branches, pull requests, issues, and repository documents unless the handover explicitly says otherwise. Re-measure current branch, CI, runtime, and local worktree state before relying on a dated figure.

## Before ending a session

Update `HANDOVER.md` and `HANDOVER-PROMPT.md` with:

- what changed;
- exact commands and results;
- commit/PR references;
- remaining work and blockers;
- any local or production state that Git cannot represent.

Commit and push those updates with the work. If all completion criteria are met, change `Status:` to `COMPLETE` and state the evidence.
