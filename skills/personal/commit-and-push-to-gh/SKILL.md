---
name: commit-and-push-to-gh
description: Sweep the Claude sessions related to the current work (the same repo and all its worktrees, plus the linked session family) and their scratchpads for unsaved, uncommitted, unpushed or stashed work; save what is worth keeping into the right repo, commit it after a secret scan, refresh handover docs, code graphs and memory, and push to the matching GitHub repository (a PR only when main is protected). Use it whenever the user says "commit and push", "push everything", "save all my work", "make sure nothing is lost", "sync to GitHub", "wrap up and push", "is everything pushed?", or before a restart, before archiving sessions, or at the end of the day, even if they don't name this skill. It asks before creating any new repo.
---

# Commit and push to GitHub

When this finishes, no work from the related sessions exists only on this PC. Everything worth keeping is committed and on GitHub. The docs that describe it are true. Avi gets one short report of what moved and what still needs Avi.

Avi invoking this skill is the go-ahead for the ordinary pushes of the sweep: fast-forward pushes, new branches and PRs. It is not a go-ahead for anything on the stop list.

## Stop list: ask Avi, then wait

These change something Avi has not seen, or cannot be undone. For each one, ask a single clear question in the report and do nothing until Avi answers.

- **Creating a repo.** This applies to a folder with real work and no git, or a repo with no remote. Ask where (the BAS-More org or the Avi-Bendetsky account), what name, and private or public (offer private by default). Never `git init`, `gh repo create`, or add a remote before the answer.
- **Pushing `~/.claude` to GitHub.** Its `origin` is GitHub, and Avi's standing rule is never to push it there. Report its state. Commit or push it only if Avi says so in this turn.
- **Secrets.** A file that looks like a secret, or a secret scan hit. Unstage that file, keep it out of the commit, and report the file name and the rule that matched. Never print the secret.
- **Files over 100 MB.** GitHub rejects them. Files over 50 MB get a warning. Report them; never set up Git LFS unasked.
- **Unclear deletions.** A tracked file shows as deleted and you cannot tell why. Leave it unstaged: the file is still in git history, so nothing is lost.
- **Stashes.** Report them. Stash work exists only on this PC, so ask whether to keep each stash or back it up to a branch. See "Snapshot branches" below.
- **Busy worktrees.** Their uncommitted work also exists only on this PC. Offer Avi a snapshot branch for each one. See "Snapshot branches" below.

### Snapshot branches (only after Avi says yes)

A snapshot branch copies local-only work to the remote without touching the worktree's files, its staging area, its branch or the stash list. That makes it safe even beside a running session. Run these only after Avi says yes, and use the commands as written.

- **Busy worktree.** `git stash create` builds a commit object from the tracked changes and changes nothing else. It does not include untracked files; list those separately in the report.

  ```
  $c = git -C <wt> stash create
  $s = git -C <wt> commit-tree "$c^{tree}" -p HEAD -m "WIP snapshot of <branch> (sweep <date>)"
  git -C <wt> push <remote> "${s}:refs/heads/wip/<branch>-snapshot-<yyyy-mm-dd>"
  ```

- **Stash.** The parent is the commit the stash was made on.

  ```
  $s = git -C <repo> commit-tree "stash@{N}^{tree}" -p "stash@{N}^1" -m "<stash message> (snapshot, sweep <date>)"
  git -C <repo> push <remote> "${s}:refs/heads/wip/stash-<yyyy-mm-dd>-<N>"
  ```

## Never

Force-push. Run `reset --hard`, `git clean`, `checkout -- <file>`, or `stash pop`, `drop` or `clear`. Delete a branch. Amend or rebase a commit that is already pushed. Use `--no-verify`. Merge a PR. Change branch protection.

Why: the job is to save work, and each of these can destroy it or hide it from Avi.

## Step 1: find the related sessions

Related means two things: sessions that worked in the same repo as you (any of its worktrees), and your linked family (the session that started you, the sessions you started, and theirs), even when those are in other repos.

In the Claude desktop app, load the session tools with ToolSearch (`select:mcp__ccd_session_mgmt__get_session,mcp__ccd_session_mgmt__list_sessions`), then:

1. `get_session("self")` gives your cwd.
2. `list_sessions({linked: true})` gives the family.
3. `list_sessions({limit: 50})` gives everything else. Keep a session when its cwd is inside a worktree of your repo (`git -C <your cwd> worktree list --porcelain`).

For each kept session, note its cwd, title, `isRunning` and `lastActivityAt`. With no session tools (a plain CLI), use your repo and its worktrees.

**Busy rule.** A session other than you with `isRunning: true` is still working. Don't touch its worktree: committing there would capture its half-finished edits. Also treat a worktree as busy when its newest transcript was written less than 10 minutes ago by a session that isn't you (the inventory gives `minutesAgo`). You are never busy.

## Step 2: run the inventory (read-only)

Run the bundled script once, passing every kept cwd:

```
pwsh -NoProfile -File "<this skill's folder>/scripts/sweep-inventory.ps1" -Cwds '<cwd1>;<cwd2>' -OutPath '<your scratchpad>/sweep-inventory.json'
```

Separate the folders with `;` inside one quoted string: `pwsh -File` does not turn `'a','b'` into a list.

It reports:
- every worktree of each repo: branch, upstream, ahead and behind counts, changed, untracked and unmerged files, with `secret-name`, `big` and `directory` flags;
- the branches with commits that are on no remote, the stashes and the remotes (with the GitHub `owner/repo`);
- the folders that are not in git;
- the session scratchpads and their candidate files. A candidate marked `sameAsRepo` is already in the repo.

Use `-ProjectsRoot` and `-ScratchRoot` when transcripts or scratchpads are somewhere other than `~/.claude/projects` and `%TEMP%\claude`.

Use this inventory instead of looping git over files yourself. Rapid bursts of short processes on this PC trigger a kernel handle leak, so keep extra git calls few and batched. Never scan outside the listed worktrees and scratchpads, and never walk a drive or ProgramData.

## Step 3: decide for each worktree

Give every worktree, and every folder that is not in git, exactly one label:

| Label | When | Action |
|---|---|---|
| busy | the busy rule applies | don't touch it; report the session |
| clean | no changes, nothing unpushed | report "nothing to do" |
| sweep | changes or unpushed commits, has a remote | Steps 4 to 9 |
| needs repo | real work with no git or no remote | stop list: ask where, name, private |
| hold | only stop-list items (secrets, stashes, unclear deletions) | report the question |

Untracked worktrees of the same repo with no listed session still count: a worktree from an old session with uncommitted edits is exactly the work this skill exists to save.

## Step 4: save scratchpad work

Scratchpads are wiped by restarts and cleanup, so finished work left there is at risk. Most scratchpad files are not finished work, though, so be selective:

- **Import** a finished deliverable that is not yet in the repo: a report, finding, plan, script or data file the session produced as a result, especially one the transcript or the repo's docs mention.
- **Skip** files marked `sameAsRepo`, and skip:
  - inputs fetched from elsewhere: downloads, clones (`clones`), dependency folders;
  - prompt payloads, tool-output captures, logs and caches;
  - throwaway test fixtures;
  - anything flagged as a secret, or over 5 MB (`large`): report these.
- **Unsure:** don't import it. List it under "left in scratchpads" so Avi can decide.

Put imported files where the repo already keeps that kind of file (for example `docs/findings/` or `scripts/<area>/`). If there is no fitting place, use `docs/session-notes/<yyyy-mm-dd>-<first 8 chars of session id>/`. Copy the file and never move it, so the scratchpad stays as it was. Import into the worktree and branch the session worked on.

## Step 5: update the docs before committing

The commit should leave the repo's own description of its state true.

- If the repo keeps a handover or status doc (`HANDOVER.md`, `STATUS.md`, a status line in `README.md`), fix the lines this sweep makes stale: "not committed", "not pushed", "waiting for push". Write "committed and pushed <date>". Don't write the commit SHA, because you can't know it before committing.
- If that doc keeps a dated log of addenda, add one short line that says what this sweep saved.
- Don't create new docs in repos that have none. Change only lines about saved, committed or pushed state.
- State only what you verified.

## Step 6: stage, scan, commit

For each worktree labelled sweep:

1. Run `git -C <wt> branch --show-current` now and again right before the commit. Parallel sessions can switch branches; if the branch changed, stop and re-inventory that worktree.
2. Run `git log -5 --oneline` to match the repo's commit message style.
3. Stage explicit paths with `git add -- <path>...`, never `git add -A` or `git add .`. Leave these out and report them:
   - files flagged `secret-name`;
   - files over 100 MB;
   - build outputs, caches, dependency folders and logs that belong in `.gitignore` (suggest the `.gitignore` line in the report; don't edit `.gitignore` unasked);
   - deletions whose reason you cannot tell.
4. Secret scan of what is staged: `gitleaks git --pre-commit --staged --no-banner --redact <wt>`. Exit code 1 means a leak was found. Decide on `$LASTEXITCODE`, not on stderr. If gitleaks is missing, search the staged diff (`git diff --cached`) for `sk-ant-api03-`, `ghp_`, `gho_`, `github_pat_`, `AKIA`, `xox[bp]-` and `-----BEGIN .*PRIVATE KEY-----`. On a hit, run `git restore --staged -- <file>`; this changes only the index. Report the file and the rule.
5. Commit, one commit per worktree for the session's own changes, plus one for scratchpad imports when there are any:
   - Message: `<area>: <what> (sweep <yyyy-mm-dd>)`.
   - Body: which session the work came from (its title) and the imported files.
   - End the message with the commit attribution the harness asks for.
   - If a pre-commit hook fails, fix it when the fix is mechanical and in scope (formatting, for example). Otherwise leave the files uncommitted and report the hook output.

## Step 7: push

Push before the graph refresh. Pushing is what secures the work, and graph indexing can take minutes or hang.

**Repo rules come first.** Before the first push to a repo, read its contribution rules where they exist: `CONTRIBUTING.md`, `AGENTS.md`, the repo's `CLAUDE.md`, and any contributing section in its README. If they say changes go through PRs ("open a PR for every change", "never push to main"), treat the default branch as protected and use the fallback below, even when a push would be accepted. Avi's push-to-main choice applies only when the repo itself does not ask for PRs. A teammate who wrote the rule expects it to hold.

For each worktree and for each branch the inventory lists as unpushed:

1. Run `git fetch <remote>`. Use the GitHub remote: usually `origin`, or the remote whose `github` value is set.
2. Then, by state:
   - **Ahead only**: `git push`.
   - **No upstream**: `git push -u <remote> <branch>`.
   - **Behind or diverged, and no uncommitted changes left**: `git pull --rebase`, then push. If the rebase conflicts, run `git rebase --abort` and use the fallback.
   - **Behind or diverged, with uncommitted files left**: use the fallback directly. Don't rebase with a dirty worktree.
   - **Rejected** (protected branch, `GH006`, pre-receive hook): use the fallback.
   - **The repo's rules require PRs**: use the fallback.
3. The fallback: `git push <remote> HEAD:refs/heads/sweep/<yyyy-mm-dd>-<branch>`. Leave out `-u`: it would make the local branch track the sweep branch instead of its own upstream. Then open a PR to the original branch with `gh pr create --base <branch> --head sweep/<yyyy-mm-dd>-<branch>`, with a title, a body that lists what it holds, and the PR attribution the harness asks for. Never merge it. If the remote is not GitHub, say a PR is needed instead.
4. Skip a branch that is checked out in a busy worktree.
5. A repo whose only remote is not GitHub (GitLab, for example): push to that remote, and mark it "not GitHub" in the report.

## Step 8: graphs and memory

Run these after the pushes, one repo at a time. Never run two indexers in parallel: a timeout mid-write can corrupt the graph database. If a step fails, report it; it never undoes a push.

- **knowledge-graph**: if `mcp__onemcp__knowledge-graph_1mcp_list_repos` lists the repo, run `npx knowledge-graph status` in its root, then `npx knowledge-graph analyze` if it is stale. A hook may already have refreshed it after the commit.
- **GitNexus**: if `<repo>/.gitnexus/` exists, run `node .gitnexus/run.cjs status`, then `node .gitnexus/run.cjs analyze` if it is stale. Run it in the background with a 10-minute limit.
- **A repo with neither index**: report "not indexed". Building a new index is setup work, not part of a sweep.
- **Tracked graph files**: if indexing changed tracked files, commit them (`chore: refresh code graph (sweep <date>)`) and push.
- **Project memory**: if `.project-memory/config.json` exists and is enabled, read `.project-memory/POLICY.md` and run the freshness and acceptance checks it names. Report pass or fail. Skip a repo whose choice is deferred or declined.
- **Memory stores**: load the hub tools with ToolSearch.
  - Save one total-recall note (`mcp__onemcp__total-recall_1mcp_remember`): date, repos, pushed SHAs, PR links, skipped items, open questions.
  - If `mcp__onemcp__avios-context-mcp_1mcp_avios_list_projects` has a matching project, call `avios_save_session` for it.
  - If the hub is down, report "memory not saved: <reason>".

## Step 9: verify, then report

Check each pushed branch directly: `git ls-remote <remote> refs/heads/<branch>` must equal `git rev-parse HEAD`, and `git status -sb` must show no "ahead". A push command's exit code is not proof. Then report, result first, in this shape:

```
**Sweep <date>: <n> pushed, <n> PRs opened, <n> skipped, <n> need you.**

| Repo / worktree | Result | Commit / PR | Notes |
|---|---|---|---|
| workstation-architecture (main) | pushed | 1a2b3c4 | 3 files + HANDOVER line fixed |
| School-Run-Promo (trusting-golick) | busy, not touched | - | "Make the review dashboard…" still running |
| notes-folder | needs repo | - | question 1 below |

**Needs you** (at most 5, most important first)
1. Create a repo for C:\...\notes-folder? Owner (BAS-More / Avi-Bendetsky), name, private?

Left in scratchpads: <n> files (paths in <inventory path>). Graphs: <refreshed / not indexed / failed>. Memory: <saved / not saved: why>.
```

Name each session by its title and each commit by its short SHA. If nothing needed saving, say so in one line.
