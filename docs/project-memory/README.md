# Reusable comprehensive project-memory policy

Prepared 2026-09-14 for Avi's request to use MAH's memory-graph workflow across
existing repositories and offer it for future projects.

**Status: reusable instruction templates, not a tested universal installer.**
No target repository or computer is enrolled merely by storing these files.

## Files to use

- [AGENTS.template.md](AGENTS.template.md): the per-project entry and bootstrap
  policy. In a repository without AGENTS.md, copy it to the repository root as
  AGENTS.md. If AGENTS.md already exists, merge the relevant sections while
  preserving the existing entry gate and project rules.
- [GLOBAL.template.md](GLOBAL.template.md): append the policy section to each
  coding client's existing user-level instructions to offer setup for new
  projects and remember the project's decision.

For Claude Code, add `@AGENTS.md` on its own line in the existing root CLAUDE.md;
preserve its other instructions. Configure and verify adapters for other clients.

The project template asks an agent to perform setup when authorized, then follow
the graph workflow. It is not executable and cannot install dependencies by
itself. A shared installer and per-stack extractor adapters still need to be
factored out, implemented and tested from the reference MAH sources.

## What is reused

The reference is MAH commit
`688eee19709632f1a5fb6900184ff89217dddea1`, with analyzer
`557277c88feafbfd8b232ceacfda59d64b61ef81`. It contains nine graph views,
local semantic retrieval, content fingerprints, portable readers, context and
impact queries, change detection, session hooks and staged/CI freshness checks.

Reference:
https://github.com/BAS-More/MAH/blob/688eee19709632f1a5fb6900184ff89217dddea1/docs/agent-context/setup.md

MAH-specific migration, hierarchy, contract and compiler extraction must be
adapted to each repository. Unsupported and not-applicable scopes must be
distinguished. Copying MAH's generated graphs would misrepresent another project.

## Remaining implementation and rollout

1. Inventory the owner's authorized repositories and existing instructions.
   Record applicable languages, package managers, databases and current graph
   coverage. Preserve active branches and concurrent changes.
2. Factor a pinned shared installer/graph runner from the MAH implementation.
   Parameterize project paths and extractors; use explicit project roots and
   repeatable setup. Package it independently from application dependencies.
3. Pilot on a separate representative repository/worktree. Exercise all target
   acceptance checks in AGENTS.template.md, including real local semantic
   retrieval, stale/partial-stage rejection and checkout isolation.
4. Add bounded, opt-in batch rollout through one reviewable branch/PR per target.
   Preserve existing hooks, approvals and branch protections. Record a coverage
   matrix, actual outcomes and blockers for each repository.
5. Install the global offer policy in the owner's actual coding clients and
   verify a new project receives the offer once, while an enabled/declined
   project is not repeatedly prompted.
6. Keep the shared toolkit pinned; deliver reviewed version updates rather than
   silently changing all repositories whenever an upstream branch moves.

No machine-wide ACL traversal, Docker Desktop installation, secret migration or
remote application deployment is required by this policy. Installation still
needs an accessible execution host, appropriate private-repository access and
permitted downloads for verified tooling/model assets.

## Evidence for this preparation

- Read the current MAH AGENTS.md, setup guide, nine-graph inventory and tool pin
  through GitHub.
- Read the skills repository entry gate, handovers and publication rules.
- Verified the official Codex and Claude user/project instruction mechanisms.
- Templates have been reviewed for relative links, scope, pin consistency,
  evidence boundaries, instruction preservation and privacy requirements.
- No installer, graph-generation, Windows/Linux/macOS or application tests were
  executed for this new template package.
- The original skills semantic-routing benchmark remains a separate ACTIVE
  workstream. MAH's eight pending external-service tests remain pending.
