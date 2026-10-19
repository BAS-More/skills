// Run: node <skill>/scripts/run-tests.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { palSupportsRunner, planInstall } from '../install-clink.mjs';

const SKILL = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPT = join(SKILL, 'scripts', 'install-clink.mjs');
const SOURCE = join(SKILL, 'pal', 'cli_clients');

function fakePal({ runner }) {
  const dir = mkdtempSync(join(tmpdir(), 'rac-pal-'));
  mkdirSync(join(dir, 'clink'));
  writeFileSync(join(dir, 'clink', 'models.py'), [
    'class CLIClientConfig(BaseModel):',
    '    name: str',
    runner ? '    runner: str | None = None' : '    command: str | None = None',
    '',
    'class ResolvedCLIClient(BaseModel):',
    '    runner: str | None = None',
    '',
  ].join('\n'));
  return dir;
}
const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });

test('palSupportsRunner reads the raw config model, not the resolved one', () => {
  assert.equal(palSupportsRunner(fakePal({ runner: true })), true);
  // Stock PAL has `runner` only on ResolvedCLIClient; a config with runner would still be rejected there.
  assert.equal(palSupportsRunner(fakePal({ runner: false })), false);
  assert.equal(palSupportsRunner(join(tmpdir(), 'rac-no-pal-here')), false);
});

test('palSupportsRunner is not fooled by a docstring, a string or a later function that mentions runner', () => {
  const pal = (body) => {
    const dir = mkdtempSync(join(tmpdir(), 'rac-pal-'));
    mkdirSync(join(dir, 'clink'));
    writeFileSync(join(dir, 'clink', 'models.py'), body);
    return dir;
  };
  assert.equal(palSupportsRunner(pal('class CLIClientConfig(BaseModel):\n    """Fields.\n    runner: not here yet\n    """\n    name: str\n')), false);
  assert.equal(palSupportsRunner(pal('class CLIClientConfig(BaseModel):\n    name: str\n\ndef helper():\n    runner: str = "x"\n')), false);
  assert.equal(palSupportsRunner(pal('class CLIClientConfig(BaseModel):\r\n    name: str\r\n    runner: str | None = Field(default=None)\r\n')), true, 'CRLF');
});

test('palSupportsRunner accepts the BAS-More/PAL-MCP runner patch when a checkout of it is present', (t) => {
  const pr = process.env.RAC_PAL_PATCHED;
  if (!pr) { t.diagnostic('RAC_PAL_PATCHED not set; checked against fixtures only'); return; }
  assert.equal(palSupportsRunner(pr), true);
});

test('every shipped client is read-only: only Read, Grep and Glob, dontAsk, no MCP servers, home and secret files denied', () => {
  const files = readdirSync(SOURCE).filter((f) => f.endsWith('.json'));
  assert.equal(files.length, 4);
  for (const f of files) {
    const cfg = JSON.parse(readFileSync(join(SOURCE, f), 'utf8'));
    const a = cfg.additional_args;
    const after = (flag) => a[a.indexOf(flag) + 1];
    assert.equal(cfg.runner, 'claude', f);
    const tools = a.slice(a.indexOf('--tools') + 1, a.findIndex((x, i) => i > a.indexOf('--tools') && x.startsWith('--')));
    assert.deepEqual(tools, ['Read', 'Grep', 'Glob'], `${f} tools`);
    assert.equal(after('--permission-mode'), 'dontAsk', f);
    assert.ok(!a.includes('bypassPermissions'), f);
    assert.ok(a.includes('--strict-mcp-config'), f);
    assert.deepEqual(JSON.parse(after('--mcp-config')), { mcpServers: {} }, f);
    for (const rule of ['Read(~/**)', 'Read(**/.env)', 'Read(**/.env.*)', 'Read(**/.git/config)']) assert.ok(a.includes(rule), `${f} ${rule}`);
    // A child started from the Claude desktop app inherits CLAUDE_CODE_ENTRYPOINT=claude-desktop, which makes
    // claude -p wait for host-supplied auth and answer 'Not logged in' without calling 9router. Reset it, nothing else.
    assert.deepEqual(cfg.env, { CLAUDE_CODE_ENTRYPOINT: 'sdk-cli' }, `${f} only resets the inherited entrypoint`);
  }
});

test('--add-dir is written into every client, and planInstall compares the rendered file', () => {
  const target = mkdtempSync(join(tmpdir(), 'rac-target-'));
  const plan = planInstall(SOURCE, target, { addDir: 'C:\\Dev' });
  for (const p of plan) {
    const a = JSON.parse(p.content).additional_args;
    assert.deepEqual(a.slice(-2), ['--add-dir', 'C:\\Dev']);
    writeFileSync(p.dst, p.content);
  }
  assert.ok(planInstall(SOURCE, target, { addDir: 'C:\\Dev' }).every((p) => p.action === 'same'));
  assert.ok(planInstall(SOURCE, target).every((p) => p.action === 'conflict'));
});

test('a flag given without its value is an error, never a silent default', () => {
  for (const args of [['--apply', '--target'], ['--target', '--apply', '--pal', 'x'], ['--pal'], ['--add-dir']]) {
    const r = run(...args);
    assert.equal(r.status, 3, args.join(' '));
    assert.match(r.stderr, /needs a value/);
  }
});

test('planInstall copies new files, skips identical ones and refuses to overwrite different ones', () => {
  const target = mkdtempSync(join(tmpdir(), 'rac-target-'));
  const names = readdirSync(SOURCE).filter((f) => f.endsWith('.json'));
  writeFileSync(join(target, names[0]), readFileSync(join(SOURCE, names[0])));
  writeFileSync(join(target, names[1]), '{"name":"edited by hand"}');
  const plan = planInstall(SOURCE, target);
  const by = Object.fromEntries(plan.map((p) => [p.file, p.action]));
  assert.equal(by[names[0]], 'same');
  assert.equal(by[names[1]], 'conflict');
  assert.equal(by[names[2]], 'copy');
  assert.equal(planInstall(SOURCE, target, { force: true }).find((p) => p.file === names[1]).action, 'overwrite');
});

test('default run is a dry run and writes nothing', () => {
  const target = join(mkdtempSync(join(tmpdir(), 'rac-target-')), 'cli_clients');
  const r = run('--target', target, '--pal', fakePal({ runner: true }));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /dry run/);
  assert.equal(existsSync(target), false);
});

test('--apply refuses when PAL does not support the runner field, because it would break every clink call', () => {
  const target = join(mkdtempSync(join(tmpdir(), 'rac-target-')), 'cli_clients');
  const r = run('--apply', '--target', target, '--pal', fakePal({ runner: false }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /runner/);
  assert.equal(existsSync(target), false);
});

test('--apply without --pal refuses rather than guessing which PAL is live', () => {
  const target = join(mkdtempSync(join(tmpdir(), 'rac-target-')), 'cli_clients');
  const r = run('--apply', '--target', target);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--pal/);
});

test('--apply on a patched PAL copies every client and leaves conflicts alone', () => {
  const target = join(mkdtempSync(join(tmpdir(), 'rac-target-')), 'cli_clients');
  mkdirSync(target);
  writeFileSync(join(target, 'claude-glm.json'), '{"name":"claude-glm","mine":true}');
  const r = run('--apply', '--target', target, '--pal', fakePal({ runner: true }));
  assert.equal(r.status, 2, 'a skipped conflict is reported with exit 2');
  assert.match(r.stdout, /conflict.*claude-glm/);
  assert.deepEqual(JSON.parse(readFileSync(join(target, 'claude-glm.json'), 'utf8')), { name: 'claude-glm', mine: true });
  for (const f of ['claude-kimi.json', 'claude-mimo.json', 'claude-qwen.json']) assert.ok(existsSync(join(target, f)), f);
  assert.match(r.stdout, /restart/i);
});
