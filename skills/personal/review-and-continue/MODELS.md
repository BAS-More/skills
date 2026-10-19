# Model allocation

P0 discovers what is reachable *today*. Digest, drift first pass and the neutral review go to the cheapest
reachable model in the user's pool (tier C); Claude does everything else and checks the pool's output. Inherit the session model for T1-T3 unless the user
selects supported overrides; record the allocation without repeating an already answered gate. Model names change monthly, so this file defines tiers and the selection rule,
not a fixed list. These tiers cover **this skill's phases only**; the build's worker casting belongs to /goal.

## Tiers

| Tier | Work | Phases | Needs | Default proposal |
|---|---|---|---|---|
| C Cheap pool | Session digest and neutral reviewer (text, PAL chat); drift first pass (read-only tools, PAL clink) | P3 (digest), P5 (first pass), P8 (neutral reviewer) | Lowest cost that does the job | Cheapest reachable pool model per job (see Cheap tier) |
| T1 Mechanical | Run scripts, git, PR creation | P1, P2 | Instruction-following, tool use | Inherited session model; smaller supported override if selected |
| T2 Read + summarise | Session digest when no pool model is reachable, run build/tests, apply decided fixes | P3, P4 (run), P7 (apply) | Long context, accuracy | Inherited session model or selected capable override |
| T3 Judgment | Check pool claims, baseline verdict, drift classification, remediation plan, to-do, alignment gate | P3 (claim check), P4 (judge), P5, P7 (plan), P8 (1–2) | Deep reasoning, low false positives | Inherited session model or selected reasoning override |
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
3. Rank the cheap pool: `node S/model-pick.mjs > $SCRATCH/model-pick.json` (see Cheap tier). For each job,
   probe down its ranking on that job's channel until one model answers: PAL `chat` with the `palModel` for
   text jobs, PAL `clink` with the client for `drift`. Then rerun with `--reachable $SCRATCH/reachable.json`,
   holding `{"chat": [palModels that answered], "clink": [clients that answered]}`. A model never probed is
   left out of that file and so drops out; that is why the probe walks the ranking.
4. Ask only about unresolved model choices, costs or vendor consent using the runtime's available
   question mechanism. Record supported exact IDs and inherited choices in DECISIONS.md.

## Cheap tier (C)

The pool is [model-pool.json](model-pool.json): models the user chose as good enough for routine work
(GLM 5.3, Kimi K3, MiMo V2.6 Pro, Qwen3.8 Max). The pool is the quality floor; within it the cheapest wins.
The script never adds a model the pool does not list, so a newer model joins by editing that file.

- **Pick:** `scripts/model-pick.mjs` estimates USD per job from OpenRouter's public list prices (a comparable
  yardstick, not the bill; a pool entry with `flatRate: true` is a subscription route and ranks at zero). It
  excludes, with a reason, any model with no published price, too little context, no tool support for a tool
  job, or no answer to the probe on that job's channel. Exit 1 = prices unavailable and exit 3 = bad
  arguments or input; on either, say so and run the pool's jobs on Claude (T2 for P3, T3 alone for P5).
- **Two ways to run:**
  - *Text jobs* (`digest`, `review`): PAL `chat` with `model: <palModel>`, payload rules as in PHASES.md
    (PAL payloads).
  - *Tool job* (`drift`): PAL `clink` with `cli_name: <clink>`. Each client runs the `claude` CLI on that model
    through 9router with **read-only tools only** (`--tools Read Grep Glob`, so no shell, no edits, no web),
    `dontAsk` permissions, no MCP servers, and reads of the home folder, `.env`, `.git/config` and key files
    denied. Clients come from `pal/cli_clients/`; install them with
    `node S/install-clink.mjs --pal <PAL dir> --add-dir <projects root> --apply`, which refuses unless that PAL
    accepts the `runner` field (BAS-More/PAL-MCP). Restart PAL afterwards. No clients → P5 runs on T3 alone.
- **Never on the pool:** running scripts or builds (P1, P4), git of any kind, PR creation or merges (P2, P6,
  P9), applying fixes (P7), any verdict (P4 judge, P5 classification, P8 alignment gate) and talking to the
  user. The clients cannot do the first four: they have no shell and no write tools. The rest is enforced by
  this skill, not by the clients. Pool output is a `[CLAIM]`: a Claude T3 checks every drift candidate and
  every "done" a digest reports before it reaches an artifact.
- **Egress:** the P0 consent is asked per repo and per *recipient*, which is every party in the pool entry's
  `route` (9router's upstream provider, OpenRouter or TokenRouter, then the model vendor), not just the vendor.
  Session transcripts are a separate consent item from repository content. A clink job can read any file its
  deny rules do not block under the `--add-dir` root, so it needs *full content* consent for every repo there
  and a clean `gitleaks detect --source <checkout>` (history included) first; otherwise P5 runs on T3 alone.
- **Residual risk, stated plainly:** deny rules are pattern-based and the clients still load the user's own
  settings and hooks (they supply the 9router address and login), so hook output can reach the pool vendor.
  Nothing here has been run end to end against a live 9router; treat the first P0 probe as the test.
- **Record** the pick, its estimate and every exclusion reason in DECISIONS.md, and the model ID next to each
  artifact it touched.

## Cross-vendor reviewer (T4)

- Session is an Anthropic model → the highest-scored reachable OpenAI model (a current flagship or `-pro` route).
- Session is an OpenAI model → the highest-scored reachable Anthropic model.
- `consensus`: reviewer stance `against`. A third model from neither vendor at `neutral`: by default the cheap
  pool's `review` pick (its cost estimate shown at P0), or none if the user declines.
- Same reviewer for `codereview` and `precommit`. Record the exact model ID in `REVIEW.md` and `TODO.md`.

## Hand-off to /goal

/goal runs its own consensus and casts cheap non-Anthropic/non-OpenAI workers. `TODO.md` carries a **role hint**
per task (coder / tester / reviewer / docs), not a model; pass the T4 model as /goal's final validator in the
mission line.
