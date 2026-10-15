# Model allocation

The skill never picks models silently. P0 discovers what is reachable *today*, proposes a model per tier,
and the user confirms. Model names change monthly, so this file defines tiers and the selection rule,
not a fixed list. These tiers cover **this skill's phases only**; the build's worker casting belongs to /goal.

## Tiers

| Tier | Work | Phases | Needs | Default proposal |
|---|---|---|---|---|
| T1 Mechanical | Run scripts, git, PR creation | P1, P2 | Instruction-following, tool use | Smallest current Claude (Haiku-class) subagent |
| T2 Read + summarise | Session digest, run build/tests, apply decided fixes | P3, P4 (run), P7 (apply) | Long context, accuracy | Mid-tier Claude (Sonnet-class) |
| T3 Judgment | Baseline verdict, drift classification, remediation plan, to-do, alignment gate | P4 (judge), P5, P7 (plan), P8 (1–2) | Deep reasoning, low false positives | Top Claude (Opus/Fable-class) |
| T4 Cross-vendor adversary | Refute everything produced | P8 (3–4) | Strongest model from the *other* vendor | See below |
| Main session | Talking to the user, stops, orchestration | P0, P6, P9 | Current session model | Unchanged |

T1 work on a T3 model wastes spend; T3 work on a T1 model produces confident wrong drift reports, the exact
failure this skill exists to prevent.

## What each tier can actually run on

- T1 and T3 run as `Agent`/`Workflow` subagents, which accept **Claude aliases only** (e.g. `haiku`, `sonnet`,
  `opus`, `fable`). Offer only those for T1/T3, and say why.
- T2 *summarising* (P3) can also run on a non-Claude model through PAL `chat` with the files attached. Offer
  that as an option; T2 *tool work* (running builds, applying fixes) stays on a Claude subagent.
- T4 runs through PAL only.

## Discovery (P0)

1. Claude aliases available to subagents: T1–T3 candidates.
2. Other vendors: `ToolSearch select:mcp__onemcp__pal_1mcp_listmodels`, then call it. Use its scores and context
   sizes; prefer routes marked verified/live. Probe the chosen T4 model with a one-line chat (PHASES.md § PAL payloads).
   PAL down → say so and offer: retry later, skip P8 (recorded), or a same-vendor review labelled *not* cross-vendor.
3. Ask with one AskUserQuestion: one question per tier, recommended option first, rough relative cost in the
   description. "Other" answers outside what the tier can run on are explained, then re-asked.

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
