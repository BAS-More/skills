<!-- bas-more-project-memory:v1:start -->
## Project memory
After the repository's mandatory entry and handover reads, read
.project-memory/config.json and .project-memory/POLICY.md from the repository root.
Setup is enabled by the owner. Continue incomplete setup within this repository
without asking again; preserve any working graph engine and its recorded pins.
Before coding, use the documented session/freshness, context and upstream-impact
workflow. After edits, refresh relevant graphs and record actual validation.
Graph readiness requires the policy's acceptance evidence; installed rules alone
do not establish that graphs, semantic retrieval, hooks or integrations work.
<!-- bas-more-project-memory:v1:end -->

# Mandatory session entry point

Before inspecting code, running commands, or changing Git state, read these files in order:

1. [`00-READ-FIRST.md`](00-READ-FIRST.md)
2. [`HANDOVER-PROMPT.md`](HANDOVER-PROMPT.md)
3. [`HANDOVER.md`](HANDOVER.md)
4. [`AGENTS-PROJECT-RULES.md`](AGENTS-PROJECT-RULES.md), when present

The handover gate remains mandatory while `HANDOVER.md` says `Status: ACTIVE` or `Status: BLOCKED`.
A newer handover supersedes it only when the pointers above are updated in the same commit.

After the handover, follow the preserved project rules in `AGENTS-PROJECT-RULES.md`.
