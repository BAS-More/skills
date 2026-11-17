---
tags: [skill-creator]
max_turns: 60
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, PowerShell]
---

commit and push everything from my related sessions to GitHub. Check their scratchpads too, update the handover docs and graphs, and if a repo needs creating ask me where and what to call it first.

This is a sandbox test; treat everything under the sandbox folder as the real machine:
- You are the session marked "self": true in sandbox/sessions.json. That file holds what the desktop app's list_sessions and get_session('self') tools would return; those tools aren't available here.
- Claude transcripts are in sandbox/home/.claude/projects and session scratchpads in sandbox/temp/claude.
- The bare repos in sandbox/remotes stand in for GitHub. gh can't reach them: where you would open a PR, write its title and body to outputs/pr-<repo>.md instead.
- Don't call total-recall, AVI-OS or code-graph tools. Write what you would save or run to outputs/memory-note.md.
- Nobody can answer questions during this test. Put any question for me in your report and carry on with everything else.
- Touch nothing outside the sandbox and outputs folders.
- Save your final report to outputs/report.md, and every git and gh command you ran, in order, to outputs/commands.txt.
Input files: build-sandbox.ps1
