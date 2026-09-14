#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export const VERSION = 1;
export const SOURCE = 'BAS-More/skills@313901a093244627d08c79b967f8db614aea43f5';
export const POLICY = '.project-memory/POLICY.md';
export const CONFIG = '.project-memory/config.json';
export const INPUTS = ['AGENTS.md', 'AGENTS.override.md', 'CLAUDE.md', '.claude/CLAUDE.md', POLICY, CONFIG];
export const ROOT_INSTRUCTIONS = ['AGENTS.md', 'AGENTS.override.md', 'CLAUDE.md'];
export const VIEWS = ['structural', 'dependencies', 'modules', 'database', 'processes', 'hierarchy', 'semantic', 'contracts', 'workflows'];
const BEGIN = '<!-- bas-more-project-memory:v1:start -->';
const END = '<!-- bas-more-project-memory:v1:end -->';
export const hash = text => createHash('sha256').update(text).digest('hex');

export function managedBlock(text, body) {
  const previous = text ?? '';
  const start = previous.indexOf(BEGIN), end = previous.indexOf(END);
  if ((start < 0) !== (end < 0) || (start >= 0 && (end < start || previous.indexOf(BEGIN, start + 1) >= 0 || previous.indexOf(END, end + 1) >= 0))) {
    throw new Error('Malformed or duplicate project-memory markers; preserve the file for review');
  }
  const nl = previous.includes('\r\n') ? '\r\n' : '\n';
  const block = [BEGIN, ...body.trim().split(/\r?\n/), END].join(nl);
  if (start >= 0) return previous.slice(0, start) + block + previous.slice(end + END.length);
  // Keep the compact pointer near the beginning and preserve existing frontmatter.
  const frontmatter = /^(?:\uFEFF)?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(previous);
  const offset = frontmatter?.[0].length ?? (previous.startsWith('\uFEFF') ? 1 : 0);
  return previous.slice(0, offset) + block + nl + nl + previous.slice(offset);
}
const repoBody = [
  '## Project memory',
  "After the repository's mandatory entry and handover reads, read",
  '.project-memory/config.json and .project-memory/POLICY.md from the repository root.',
  'Setup is enabled by the owner. Continue incomplete setup within this repository',
  'without asking again; preserve any working graph engine and its recorded pins.',
  'Before coding, use the documented session/freshness, context and upstream-impact',
  'workflow. After edits, refresh relevant graphs and record actual validation.',
  "Graph readiness requires the policy's acceptance evidence; installed rules alone",
  'do not establish that graphs, semantic retrieval, hooks or integrations work.'
].join('\n');

export function planRepository({ repository, files, policy, aliases = {} }) {
  for (const [file, target] of Object.entries(aliases)) {
    if (!ROOT_INSTRUCTIONS.includes(file) || !ROOT_INSTRUCTIONS.includes(target) || file === target || aliases[target] || files[target] == null) throw new Error('Unsupported instruction alias; preserve it for review');
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('Explicit owner/repository identity required');
  if (repository.toLowerCase() === 'bas-more/claude-home-backup') return { repository, outcome: 'excluded-protected-backup', changes: [] };
  if (!policy?.startsWith('# Comprehensive project memory')) throw new Error('Approved policy is missing');
  let config;
  if (files[CONFIG] != null) {
    config = JSON.parse(files[CONFIG]);
    if (['declined', 'deferred'].includes(config.choice)) return { repository, outcome: 'preserved-' + config.choice, changes: [] };
    if (config.managedBy !== 'bas-more-project-memory' || config.repository !== repository) throw new Error('Existing memory configuration has a different owner or identity');
    if (files[POLICY] == null || hash(files[POLICY]) !== config.policySha256) throw new Error('Existing policy was edited; review it before updating');
  } else if (files[POLICY] != null) throw new Error('Unmanaged policy already exists; preserve it for review');
  const nextConfig = {
    ...(config ?? {}),
    ...(Object.keys(aliases).length ? { instructionAliases: aliases } : {}),
    schemaVersion: VERSION, managedBy: 'bas-more-project-memory',
    repository, choice: 'enabled', authorization: 'owner-approved-existing-repository-rollout',
    policySource: SOURCE, policySha256: hash(policy), requiredViews: VIEWS,
    graphReadiness: config?.graphReadiness ?? 'requires-repository-validation',
    privacy: 'local-embeddings-only',
    instructions: 'Follow POLICY.md; preserve existing tooling; record per-view evidence before marking graph setup complete.'
  };
  if (!Object.keys(aliases).length) delete nextConfig.instructionAliases;
  const desired = { [POLICY]: policy, [CONFIG]: JSON.stringify(nextConfig, null, 2) + '\n' };
  const instructions = ['AGENTS.md', 'CLAUDE.md', ...['AGENTS.override.md', '.claude/CLAUDE.md'].filter(file => files[file] != null || aliases[file])];
  for (const file of instructions) {
    const target = aliases[file] ?? file;
    desired[target] = managedBlock(files[target], repoBody);
  }
  const changes = Object.entries(desired).flatMap(([file, after]) => {
    const before = files[file] ?? null;
    return before === after ? [] : [{ file, before, after, beforeHash: before == null ? null : hash(before), afterHash: hash(after) }];
  });
  return { repository, outcome: changes.length ? 'policy-ready-to-install' : 'policy-already-installed', graphReadiness: nextConfig.graphReadiness, changes };
}
export function containedPath(root, relative) {
  if (!relative || path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(part => ['..', '.', ''].includes(part))) throw new Error('Invalid relative path');
  const actualRoot = fs.realpathSync(root);
  const full = path.join(actualRoot, ...relative.split('/'));
  let current = actualRoot;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    try { if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Refusing symbolic link: ' + relative); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return full;
}
export function readText(root, relative) {
  const file = containedPath(root, relative);
  if (!fs.existsSync(file)) return null;
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024) throw new Error('Expected a bounded regular instruction file: ' + relative);
  const value = fs.readFileSync(file, 'utf8');
  if (value.includes('\0')) throw new Error('Binary instruction file: ' + relative);
  return value;
}
export function readRepository(root) {
  root = fs.realpathSync(root);
  let trackedLinks = [];
  try {
    const entries = execFileSync('git', ['ls-files', '--stage', '-z', '--', ...ROOT_INSTRUCTIONS], { cwd: root, encoding: 'utf8', timeout: 15000 });
    trackedLinks = entries.split('\0').filter(row => row.startsWith('120000 ')).map(row => row.slice(row.indexOf('\t') + 1));
  } catch (error) {
    if (!String(error.stderr).includes('not a git repository')) throw error;
  }
  const aliases = {}, files = {};
  for (const file of INPUTS) {
    let link = false;
    const absolute = path.join(root, file);
    try { link = fs.lstatSync(absolute).isSymbolicLink(); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (ROOT_INSTRUCTIONS.includes(file) && (link || trackedLinks.includes(file))) {
      const target = (link ? fs.readlinkSync(absolute) : readText(root, file)).replace(/^\.\//, '');
      if (!ROOT_INSTRUCTIONS.includes(target) || target === file || trackedLinks.includes(target)) throw new Error('Unsupported instruction alias: ' + file);
      const content = readText(root, target);
      if (content == null) throw new Error('Instruction alias target is missing: ' + file);
      aliases[file] = target;
      files[target] = content;
    } else files[file] = readText(root, file);
  }
  return { files, aliases };
}
function atomic(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.' + randomUUID() + '.tmp';
  let descriptor;
  try {
    descriptor = fs.openSync(tmp, 'wx', 0o600);
    fs.writeFileSync(descriptor, content);
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor); descriptor = undefined;
    fs.renameSync(tmp, file);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    if (fs.existsSync(tmp)) fs.rmSync(tmp);
  }
}
export function applyPlan(root, plan, backupDirectory, { afterWrite } = {}) {
  root = fs.realpathSync(root);
  if (!plan.changes.length) return { ...plan, changes: [], applied: 0 };
  for (const change of plan.changes) if (readText(root, change.file) !== change.before) throw new Error('Concurrent edit before installation: ' + change.file);
  fs.mkdirSync(backupDirectory, { recursive: true });
  const journalPath = path.join(backupDirectory, 'project-memory-' + randomUUID() + '.json');
  const journal = { schemaVersion: 1, root, repository: plan.repository, state: 'applying', changes: plan.changes };
  atomic(journalPath, JSON.stringify(journal, null, 2) + '\n');
  try {
    for (const change of plan.changes) {
      if (readText(root, change.file) !== change.before) throw new Error('Concurrent edit during installation: ' + change.file);
      atomic(containedPath(root, change.file), change.after);
      afterWrite?.(change);
    }
    for (const change of plan.changes) if (readText(root, change.file) !== change.after) throw new Error('Readback failed: ' + change.file);
    journal.state = 'applied';
    atomic(journalPath, JSON.stringify(journal, null, 2) + '\n');
    return { repository: plan.repository, outcome: 'policy-installed', graphReadiness: plan.graphReadiness, applied: plan.changes.length, journalPath };
  } catch (error) {
    try { rollback(journalPath); } catch (recoveryError) { error.message += '; recovery requires review: ' + recoveryError.message; }
    throw error;
  }
}
export function rollback(journalPath) {
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  if (journal.schemaVersion !== 1 || !Array.isArray(journal.changes)) throw new Error('Invalid installer journal');
  for (const change of journal.changes) {
    const value = readText(journal.root, change.file);
    if (value !== change.before && (value == null || hash(value) !== change.afterHash)) throw new Error('Rollback preserves a concurrent edit: ' + change.file);
  }
  for (const change of [...journal.changes].reverse()) {
    if (readText(journal.root, change.file) === change.before) continue;
    const file = containedPath(journal.root, change.file);
    if (change.before == null) fs.rmSync(file); else atomic(file, change.before);
  }
  journal.state = 'rolled-back';
  atomic(journalPath, JSON.stringify(journal, null, 2) + '\n');
  return { outcome: 'rolled-back', repository: journal.repository };
}
export function clientPlan(profile, codexHome = path.join(profile, '.codex')) {
  profile = fs.realpathSync(profile);
  codexHome = fs.realpathSync(codexHome);
  const body = [
    '## Project memory on every project',
    "After mandatory project entry and handover reads, inspect the repository's",
    '.project-memory/config.json, .project-memory/POLICY.md, and existing graph setup.',
    'Honor an enabled, deferred or declined choice. For enabled projects, read the',
    'policy on every start/resume; use fresh graph context and upstream impact before',
    'edits, then change detection, refresh, relevant checks and a factual handover.',
    'Private local rollout record: ' + path.join(profile, '.project-memory', 'rollouts', '2026-09-14.json'),
    'Local installer: ' + fileURLToPath(import.meta.url),
    'The owner authorized eligible existing repositories recorded in that private registry.',
    'Honor archived, read-only and protected exclusions. Public aggregate counts are not an enrollment list.',
    'An eligible matching repository needs no new approval. Preserve recorded deferred/declined choices.',
    'When its policy is missing, obtain the approved policy/installer from BAS-More/skills',
    'and install it with an explicit repository root, preserving existing rules and work.',
    'For a new project outside that rollout with no setup or recorded choice, offer once:',
    '"Would you like MAH-style comprehensive project memory, adapted to this project,',
    'with local semantic memory and graph freshness checks?" Record the answer in',
    'project setup notes and do not repeat the offer after enabled/deferred/declined.',
    "Preserve a verified existing graph engine. Finish missing setup using the project's",
    'stack and the policy acceptance checks. Report unavailable tools or failed checks',
    'explicitly; continue useful permitted work. Keep private source and embeddings local.',
    'Installed rules do not prove graph generation, hook execution or integration tests passed.'
  ].join('\n');
  const specs = [
    { root: profile, file: '.claude/CLAUDE.md' },
    { root: codexHome, file: fs.existsSync(path.join(codexHome, 'AGENTS.override.md')) ? 'AGENTS.override.md' : 'AGENTS.md' }
  ];
  return specs.map(({ root, file }) => {
    const before = readText(root, file);
    // Append global rules outside existing locked sections; preserve all original bytes.
    const after = before?.includes(BEGIN) ? managedBlock(before, body) : (before ?? '') + ((before ?? '').endsWith('\n') ? '\n' : '\n\n') + [BEGIN, body, END, ''].join('\n');
    return { root, repository: 'local-client-rules', changes: before === after ? [] : [{ file, before, after, beforeHash: before == null ? null : hash(before), afterHash: hash(after) }] };
  });
}
async function main() {
  const [command = 'plan', ...rest] = process.argv.slice(2);
  const option = name => { const i = rest.indexOf(name); return i < 0 ? undefined : rest[i + 1]; };
  if (command === 'rollback') return rollback(rest[0]);
  if (command === 'clients') {
    const profile = option('--profile') ?? os.homedir();
    const plans = clientPlan(profile, option('--codex-home') ?? process.env.CODEX_HOME ?? path.join(profile, '.codex'));
    if (!rest.includes('--apply')) return plans.map(p => ({ root: p.root, files: p.changes.map(c => c.file) }));
    return plans.map(p => applyPlan(p.root, p, path.join(profile, '.project-memory', 'backups')));
  }
  const root = fs.realpathSync(option('--root') ?? process.cwd());
  const repository = option('--repository');
  const { files, aliases } = readRepository(root);
  if (command === 'status') return { repository: files[CONFIG] ? JSON.parse(files[CONFIG]).repository : null, policyInstalled: files[POLICY] != null && files[CONFIG] != null, graphReadiness: files[CONFIG] ? JSON.parse(files[CONFIG]).graphReadiness : 'unknown' };
  const policy = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/project-memory/AGENTS.template.md'), 'utf8');
  const plan = planRepository({ repository, files, policy, aliases });
  if (command === 'plan') return { ...plan, changes: plan.changes.map(({ file, beforeHash, afterHash }) => ({ file, beforeHash, afterHash })) };
  if (command !== 'install') throw new Error('Commands: plan, install, status, clients [--apply], rollback <journal>');
  const gitDir = execFileSync('git', ['rev-parse', '--absolute-git-dir'], { cwd: root, encoding: 'utf8', timeout: 15000 }).trim();
  return applyPlan(root, plan, path.join(gitDir, 'project-memory-backups'));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(value => console.log(JSON.stringify(value, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
