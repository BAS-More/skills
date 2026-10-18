# Model allocation

P0 discovers what is reachable *today*. Inherit the session model for T1-T3 unless the user
selects supported overrides; record the allocation without repeating an already answered gate. Model names change monthly, so this file defines tiers and the selection rule,
not a fixed list. These tiers cover **this skill's phases only**; the build's worker casting belongs to /goal.

## Tiers

| Tier | Work | Phases | Needs | Default proposal |
|---|---|---|---|---|
| T1 Mechanical | Run scripts, git, PR creation | P1, P2 | Instruction-following, tool use | Inherited session model; smaller supported override if selected |
| T2 Read + summarise | Session digest, run build/tests, apply decided fixes | P3, P4 (run), P7 (apply) | Long context, accuracy | Inherited session model or selected capable override |
| T3 Judgment | Baseline verdict, drift classification, remediation plan, to-do, alignment gate | P4 (judge), P5, P7 (plan), P8 (1–2) | Deep reasoning, low false positives | Inherited session model or selected reasoning override |
| T4 Cross-vendor adversary | Refute everything produced | P8 (3–4) | Strongest model from the *other* vendor | See below |
| Main session | Talking to the user, stops, orchestration | P0, P6, P9 | Current session model | Unchanged |

## Runtime and discovery (P0)

1. Inspect the active runtime's tool schemas and model choices. Claude Code may expose Agent/Workflow
   with Claude aliases; Codex may expose collaboration.spawn_agent with its own supported model IDs.
   Never claim one runtime's constraints apply to the other. Use native subagents for independent work;
   if unavailable, run sequentially. Inherit models unless explicitly selected and supported.
2. Discover the available PAL model-list tool and call it for T4. Prefer verified/live routes; probe the
   selected other-vendor model with one line before repository payloads (PHASES.md, PAL payloads).
   PAL unavailable: report the gap; offer retry, a recorded skip, or same-vendor review explicitly
   labelled as not cross-vendor. Do not silently substitute another external service.
3. Ask only about unresolved model choices, costs or vendor consent using the runtime's available
   question mechanism. Record supported exact IDs and inherited choices in DECISIONS.md.

## Cross-vendor reviewer (T4)

- Session is an Anthropic model → the highest-scored reachable OpenAI model (a current flagship or `-pro` route).
- Session is an OpenAI model → the highest-scored reachable Anthropic model.
- `consensus`: reviewer stance `against`. Optional, with the user's OK for the spend: a third model from neither
  vendor at `neutral`.
- Same reviewer for `codereview` and `precommit`. Record the exact model ID in `REVIEW.md` and `TODO.md`.

## Hand-off to /goal

/goal runs its own consensus and casts cheap non-Anthropic/non-OpenAI workers. `TODO.md` carries a **role hint**
per task (coder / tester / reviewer / docs), not a model; pass the T4 model as /goal's final validator in the
mission line.
