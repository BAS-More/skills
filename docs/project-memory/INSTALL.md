# Install the approved memory policies

Run with Node.js 20 or newer from a checkout of this repository:

    node scripts/project-memory/install.mjs plan --root C:\path\to\repo --repository OWNER/REPO
    node scripts/project-memory/install.mjs install --root C:\path\to\repo --repository OWNER/REPO
    node scripts/project-memory/install.mjs status --root C:\path\to\repo

The installer copies the approved policy into .project-memory/POLICY.md,
records the repository identity and enabled choice in .project-memory/config.json,
and adds compact pointers to AGENTS.md and CLAUDE.md. Existing root
AGENTS.override.md and .claude/CLAUDE.md receive pointers too. Original text,
frontmatter and line endings remain intact outside the managed block. Existing
hooks, application manifests, MCP registrations and graph engines are preserved.

This installs instructions and records setup authorization. It does not implement
MAH's project-specific graph extractors for every language or generate nine graphs.
Each project must finish the bootstrap and acceptance checks in POLICY.md before
its graph readiness is reported as complete. A PR proposes repository changes; the default branch changes only after that PR is merged.

For the active local coding clients:

    node scripts/project-memory/install.mjs clients
    node scripts/project-memory/install.mjs clients --apply

The client command appends the future-project offer to Claude's user CLAUDE.md and
Codex's active AGENTS.override.md, or AGENTS.md when no override exists.
CODEX_HOME is honored; --profile and --codex-home allow explicit paths. Open a new
session so the client loads the changed instructions. These are model instructions,
not a background GitHub watcher or a mechanical proof of graph use. Other machines
and cloud clients require their own instruction configuration.

A rerun with unchanged policy is a no-op. Edited policies, conflicting identities,
malformed blocks and unsafe symbolic links fail visibly. Root instruction aliases
between AGENTS.md, AGENTS.override.md and CLAUDE.md preserve their existing link
and update the regular target. Git's Windows symlink emulation is handled too. Deferred and declined choices
are preserved. The protected claude-home-backup repository is excluded.

Local changes have recovery journals. The command prints their exact locations:

    node scripts/project-memory/install.mjs rollback C:\path\to\journal.json

Rollback verifies current hashes and preserves concurrent edits. No broad
permission changes, dependency installation or Docker Desktop are required.

Validation:

    node --test scripts/project-memory/install.test.mjs

These tests cover policy installation and recovery. They do not count as graph
runtime acceptance or MAH external-service integration tests.

Keep detailed repository inventories private. The shared repository publishes only
aggregate rollout counts. Client rules look for the private owner registry under
~/.project-memory/rollouts/2026-09-14.json, not a public list of private projects.
