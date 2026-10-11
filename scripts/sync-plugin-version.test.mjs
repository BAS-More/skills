import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// The script resolves both manifests from its own location, so it cannot be aimed with cwd
// or an env var. A fixture tree with a symlink to the real script makes its `..` resolve
// into the fixture while still running the file under test, so this suite cannot go stale
// against the script it guards.
//
// The symlink needs `--preserve-symlinks-main`, and that is not a detail to drop: Node
// resolves a module's real path before setting `import.meta.url`, where bash leaves `$0`
// as the symlink it was invoked through. Without the flag every one of these tests runs
// against the REAL repository instead of the fixture, so the first draft of this suite
// reported "already in sync" for a fixture built to disagree, and the mismatch tests
// passed for the wrong reason by failing to fail.
const scriptPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'sync-plugin-version.mjs');

function fixture(t, packageVersion, pluginVersion) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-plugin-version-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture', version: packageVersion }, null, 2) + '\n');
  fs.mkdirSync(path.join(root, '.claude-plugin'));
  // Key order and formatting matter: the script rewrites only the version line in order to
  // preserve them, so the fixture has keys on both sides of the one it edits.
  fs.writeFileSync(path.join(root, '.claude-plugin', 'plugin.json'),
    `{\n  "name": "fixture",\n  "version": "${pluginVersion}",\n  "skills": []\n}\n`);
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.symlinkSync(scriptPath, path.join(root, 'scripts', 'sync-plugin-version.mjs'));
  return root;
}

function run(root, args = []) {
  try {
    const stdout = execFileSync(process.execPath, ['--preserve-symlinks', '--preserve-symlinks-main', path.join(root, 'scripts', 'sync-plugin-version.mjs'), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    return { status: err.status, stdout: String(err.stdout), stderr: String(err.stderr) };
  }
}

const pluginVersionAt = root => JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin', 'plugin.json'), 'utf8')).version;

test('--check passes when the two manifests agree', t => {
  const result = run(fixture(t, '1.3.1', '1.3.1'), ['--check']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /already in sync/);
});

// The reason this suite exists. `--check` had no caller at all: `npm run version` writes
// the value rather than checking it, this fork guards release.yml off, and neither path
// filter on the invariants workflow named package.json. So a hand-edited version could
// ship out of step with the published plugin and no job would notice.
test('--check fails when they differ, and names both versions', t => {
  const root = fixture(t, '1.4.0', '1.3.1');
  const result = run(root, ['--check']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /plugin\.json version is 1\.3\.1, package\.json is 1\.4\.0/);
  assert.equal(pluginVersionAt(root), '1.3.1', '--check must not write');
});

test('without --check it writes the version through, keeping key order and formatting', t => {
  const root = fixture(t, '2.0.0', '1.3.1');
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(pluginVersionAt(root), '2.0.0');
  const text = fs.readFileSync(path.join(root, '.claude-plugin', 'plugin.json'), 'utf8');
  assert.equal(text, '{\n  "name": "fixture",\n  "version": "2.0.0",\n  "skills": []\n}\n');
});

test('a manifest with no version field fails rather than writing a file it could not update', t => {
  const root = fixture(t, '2.0.0', '1.3.1');
  fs.writeFileSync(path.join(root, '.claude-plugin', 'plugin.json'), '{\n  "name": "fixture",\n  "skills": []\n}\n');
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Could not find a version field to replace/);
  assert.match(fs.readFileSync(path.join(root, '.claude-plugin', 'plugin.json'), 'utf8'), /"name": "fixture"/);
});
