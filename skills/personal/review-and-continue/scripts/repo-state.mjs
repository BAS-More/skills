#!/usr/bin/env node
// Usage: node repo-state.mjs <root>... [--depth 3] [--no-gh]
// Emits JSON: every git repo under the roots (one entry per repository, worktrees nested), with all
// uncommitted / unpushed / stashed / detached / unreviewed work, open PRs (gh) and knowledge-graph
// freshness. Read-only. Exits 1 with {error} when no repo is found.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { git, lines, findRepos, parseArgs, isMain } from './lib.mjs';

const norm = (p) => resolve(p).replace(/\\/g, '/').replace(/\/$/, '').toLowerCase();
const redact = (url) => url.replace(/\/\/[^@/\s]+@/, '//***@');

function graphState(dir, head) {
  const meta = join(dir, '.knowledge-graph', 'meta.json');
  if (!existsSync(meta)) return { present: false };
  try {
    const m = JSON.parse(readFileSync(meta, 'utf8'));
    const behind = m.lastCommit ? git(dir, ['rev-list', '--count', `${m.lastCommit}..HEAD`]) : null;
    return {
      present: true,
      indexedCommit: m.lastCommit ?? null,
      indexedAt: m.indexedAt ?? null,
      embeddings: m.stats?.embeddings ?? null,
      stale: m.lastCommit !== head,
      commitsBehind: behind === null ? null : Number(behind),
    };
  } catch (e) {
    return { present: true, error: `unreadable meta.json: ${e.message}` };
  }
}

function openPRs(dir) {
  try {
    const out = execFileSync('gh', ['pr', 'list', '--state', 'open', '--json', 'number,title,headRefName,isDraft,url', '--limit', '100'],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 30000 });
    return JSON.parse(out);
  } catch {
    return null; // gh missing, unauthenticated, or no GitHub remote
  }
}

function defaultBranch(dir) {
  const ref = git(dir, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
  if (ref) return ref.replace(/^origin\//, '');
  for (const b of ['main', 'master']) if (git(dir, ['rev-parse', '--verify', '-q', `refs/heads/${b}`])) return b;
  return null;
}

// prs: pass an array to inject PR data (tests); otherwise fetched via gh when gh=true.
export function repoState(dir, { gh = true, prs } = {}) {
  dir = resolve(dir);
  const top = git(dir, ['rev-parse', '--show-toplevel']) ?? dir;
  const head = git(dir, ['rev-parse', 'HEAD']);
  const branch = git(dir, ['branch', '--show-current']) || '(detached)';
  const status = lines(git(dir, ['status', '--porcelain=v1']));
  const dirty = status.filter((l) => !l.startsWith('??'));
  const untrackedFiles = status.filter((l) => l.startsWith('??')).map((l) => l.slice(3));
  const upstream = git(dir, ['rev-parse', '--abbrev-ref', '@{upstream}']);
  let ahead = null, behind = null;
  if (upstream) {
    const lr = git(dir, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`]);
    if (lr) [behind, ahead] = lr.split(/\s+/).map(Number);
  }
  // SHA is the stable handle: the stash stack is shared by every worktree and session, indexes shift.
  const stashes = lines(git(dir, ['stash', 'list', '--format=%H|%gd|%cr|%gs'])).map((l) => {
    const [sha, ref, age, ...msg] = l.split('|');
    return { sha, ref, age, message: msg.join('|') };
  });

  const unpushedBranches = [];
  for (const l of lines(git(dir, ['for-each-ref', '--format=%(refname:short)|%(upstream:short)|%(upstream:track)', 'refs/heads']))) {
    const [b, up, track] = l.split('|');
    if (!up) unpushedBranches.push({ branch: b, status: 'no-upstream' });
    else if (track === '[gone]') {
      const unique = Number(git(dir, ['rev-list', '--count', b, '--not', '--remotes']) ?? 0);
      if (unique > 0) unpushedBranches.push({ branch: b, status: 'upstream gone', unique });
    } else if (/ahead/.test(track)) unpushedBranches.push({ branch: b, status: track.replace(/[[\]]/g, '') });
  }

  const worktrees = [];
  let cur = null;
  for (const l of lines(git(dir, ['worktree', 'list', '--porcelain']))) {
    if (l.startsWith('worktree ')) { cur = { path: l.slice(9), branch: null, head: null, detached: false }; worktrees.push(cur); }
    else if (!cur) continue;
    else if (l.startsWith('HEAD ')) cur.head = l.slice(5);
    else if (l.startsWith('branch ')) cur.branch = l.slice(7).replace('refs/heads/', '');
    else if (l === 'detached') cur.detached = true;
    else if (l.startsWith('prunable')) cur.prunable = true;
  }
  for (const w of worktrees) {
    w.current = norm(w.path) === norm(top);
    const st = existsSync(w.path) ? git(w.path, ['status', '--porcelain=v1']) : null;
    w.dirtyCount = st === null ? null : lines(st).length;
    if (w.detached && w.head) w.orphanCommits = Number(git(dir, ['rev-list', '--count', w.head, '--not', '--branches', '--remotes']) ?? 0);
  }

  const remotes = lines(git(dir, ['remote', '-v'])).filter((l) => l.endsWith('(push)')).map((l) => redact(l.split(/\s+/).slice(0, 2).join(' ')));
  const pr = prs !== undefined ? prs : gh ? openPRs(dir) : null;

  // Pushed branches that are neither merged into the default branch nor under an open PR. Needs PR data.
  const pushedNoPR = [];
  const def = defaultBranch(dir);
  if (pr && def) {
    const prHeads = new Set(pr.map((p) => p.headRefName));
    for (const r of lines(git(dir, ['branch', '-r', '--no-merged', def, '--format=%(refname:short)']))) {
      const name = r.replace(/^[^/]+\//, '');
      if (name !== 'HEAD' && name !== def && !r.endsWith('/HEAD') && !prHeads.has(name)) pushedNoPR.push(r);
    }
  }

  const graph = graphState(top, head);
  let projectMemory = null;
  try { projectMemory = JSON.parse(readFileSync(join(top, '.project-memory', 'config.json'), 'utf8')).choice ?? 'unknown'; } catch { /* absent */ }

  const attention = [];
  if (dirty.length) attention.push(`${dirty.length} modified/staged file(s) on ${branch}`);
  if (untrackedFiles.length) attention.push(`${untrackedFiles.length} untracked file(s) on ${branch}`);
  if (ahead) attention.push(`${branch} is ${ahead} commit(s) ahead of ${upstream}`);
  if (behind) attention.push(`${branch} is ${behind} commit(s) behind ${upstream}`);
  if (stashes.length) attention.push(`${stashes.length} stash entr(y/ies)`);
  for (const b of unpushedBranches) attention.push(`branch ${b.branch}: ${b.status}${b.unique ? ` (${b.unique} commit(s) on no remote)` : ''}`);
  for (const r of pushedNoPR) attention.push(`branch ${r}: pushed, not merged into ${def}, no open PR`);
  for (const w of worktrees) {
    if (!w.current && w.dirtyCount) attention.push(`worktree ${w.path} (${w.branch ?? 'detached'}) has ${w.dirtyCount} uncommitted change(s)`);
    if (w.orphanCommits) attention.push(`worktree ${w.path} is detached with ${w.orphanCommits} commit(s) on no branch`);
  }
  if (graph.stale) attention.push(`knowledge-graph index is ${graph.commitsBehind ?? '?'} commit(s) behind HEAD`);
  if (!remotes.length) attention.push('no push remote configured');
  if (pr === null && gh) attention.push('open PRs unknown (gh unavailable or not a GitHub remote)');

  return { path: top, branch, head, defaultBranch: def, upstream, ahead, behind, dirty, untracked: untrackedFiles.length, untrackedFiles, stashes, unpushedBranches, pushedNoPR, worktrees, remotes, openPRs: pr, graph, projectMemory, attention };
}

export function scanRoots(roots, { depth = 3, gh = true } = {}) {
  const seen = new Map();
  const rootsWithoutRepos = [];
  let discovered = false;
  for (const root of roots) {
    const found = findRepos([root], depth);
    if (!found.length) { rootsWithoutRepos.push(root); continue; }
    if (!found.some((f) => norm(f) === norm(root))) discovered = true; // root is a parent folder, repos were found by walking
    for (const f of found) {
      const common = git(f, ['rev-parse', '--path-format=absolute', '--git-common-dir']);
      const key = common ? norm(common) : norm(f);
      if (!seen.has(key)) seen.set(key, f); // one entry per repository; its worktrees are nested in the entry
    }
  }
  const repos = [...seen.values()].map((d) => repoState(d, { gh }));
  return { roots, discovered, rootsWithoutRepos, repoCount: repos.length, needsAttention: repos.filter((r) => r.attention.length).length, repos };
}

if (isMain(import.meta.url)) {
  const a = parseArgs(process.argv.slice(2), { depth: '3', gh: true });
  if (!a._.length) { console.error('usage: repo-state.mjs <root>... [--depth N] [--no-gh]'); process.exit(2); }
  const missing = a._.filter((r) => !existsSync(r));
  const out = scanRoots(a._.filter((r) => existsSync(r)), { depth: Number(a.depth), gh: a.gh });
  if (missing.length) out.missingRoots = missing;
  if (!out.repoCount) out.error = 'no git repository found under the given roots';
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.repoCount ? 0 : 1);
}
