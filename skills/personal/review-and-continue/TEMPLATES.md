# Artifact templates

They live in `$SCRATCH/continuity/` until P6, then in `docs/continuity/<RUN>/` on branch `continuity/<RUN>`. Every claim cites evidence.
Status vocabulary: `VERIFIED` (command/file proves it) · `CONTRADICTED` · `UNVERIFIED` (could not check, say why).

## BASELINE.md
```markdown
# Baseline: <project>, <YYYY-MM-DD>
Established by: <session model> · tiers: T1 <m> · T2 <m> · T3 <m> · T4 <m>

## Repos
| Repo | Branch | HEAD | Upstream state | Open PRs |
|---|---|---|---|---|

## Build and test
| Repo | Command | Result | First failure (verbatim) |

## Code graph
| Repo | Indexed commit | = HEAD? | Embeddings |

## Live dependencies
| Service | Probe | Result |

## Session claims checked
| Claim | Session | Status | Evidence |

## Secured work
| Repo | Item | Branch | Draft PR | CI | Merged? |

## Unknowns
- <what could not be verified>: <why>. Resolved by: <check or source>
```

## DRIFT-REGISTER.md
```markdown
# Drift register: <YYYY-MM-DD>
Coverage: <n>/<n> docs checked · <n> claims checked · sampled: <what> · UNVERIFIED clusters: <list>
Drift items: <n> (high <n> · medium <n> · low <n>). "None found" means none among the claims checked.

| ID | Severity | Type | Doc (file:line) | Code / evidence | Summary | Decision |
|---|---|---|---|---|---|---|
| D1 | high | CODE-MISSING | docs/plan.md:69 | `desktop-app/actions/` absent | Classifier promised, not built | fix code |
```
Severity: high = misleads someone building next · medium = wrong but harmless · low = cosmetic.
Decision column is filled in P6: `fix code` · `fix doc` · `defer` · `accept`.

## REMEDIATION-PLAN.md
```markdown
# Remediation plan: <YYYY-MM-DD>
Branch: continuity/<RUN> (one per changed repo) · PRs: <urls>

| Task | Drift IDs | Change | Acceptance check | Blast radius (impact) | Rollback |
|---|---|---|---|---|---|
```

## REVIEW.md
```markdown
# Cross-vendor review: <YYYY-MM-DD>
Reviewer: <exact model id via PAL> · tools: consensus / codereview / precommit · rounds: <n>

| Round | Finding | Severity | Verdict (valid / invalid) | Action or reason rejected |
```

## TODO.md
```markdown
# To-do: <project>, from the <YYYY-MM-DD> baseline
Mission line for /goal: `/goal Complete every task in <abs path>/TODO.md in order; ...`
Open items allowed: only those the user chose to defer or accept (IDs: ...)
Cross-vendor validator: <model id>

| # | Task | Depends on | Acceptance criteria | Size (S <1h · M <1d · L >1d) | Role hint |
|---|---|---|---|---|---|
```

## MEMORY-UPDATES.md
```markdown
| Store | Namespace / project | Operation | Payload summary | Approved (P9)? |
|---|---|---|---|---|
| avios-context | <project> | update_project_state | baseline SHA, open drift IDs | |
```

## DECISIONS.md
```markdown
| Date | Question | Options | Decision | Decided by | Crucial? |
```
