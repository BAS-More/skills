import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(repository, 'scripts', 'check-invariants.sh');

// Public buckets are promoted (README + manifest); private ones must be in neither.
const skills = {
  engineering: ['alpha'],
  productivity: ['beta'],
  misc: ['gamma'],
  personal: ['secret'],
  'in-progress': ['draft'],
  deprecated: []
};
const publicBuckets = ['engineering', 'productivity', 'misc'];
// Only these two carry a human-facing docs page; the docs tree mirrors them.
const documentedBuckets = ['engineering', 'productivity'];
// The fixed frame .agents/writing-docs.md says every page carries. "Common questions" and
// "It's working if" are deliberately absent: writing-docs.md says to omit them when the
// question hunt is thin or the tells are vague, so requiring them would fail a page that
// is correct by the repository's own template.
const docsPage = (name) => [
  '## What it does', '', `${name} does a thing.`, '',
  '## When to reach for it', '', 'When the thing is needed.', '',
  '## Where it fits', '', 'Alongside the others.', ''
].join('\n');
const openaiYaml = (name, userInvoked = false) => [
  'interface:',
  `  display_name: "${name}"`,
  `  short_description: "does ${name}"`,
  ...(userInvoked ? ['policy:', '  allow_implicit_invocation: false'] : []),
  ''
].join('\n');
const promoted = ['./skills/engineering/alpha', './skills/productivity/beta', './skills/misc/gamma'];
const description = 'does a thing properly.';

function write(root, file, content) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), content);
}

function writeManifest(root, entries) {
  // `repository` and `keywords` stay path-adjacent on purpose: the checker must
  // read only the `skills` array, not every quoted string in the file.
  write(root, '.claude-plugin/plugin.json', JSON.stringify({
    name: 'fixture',
    repository: 'https://github.com/example/skills',
    keywords: ['skills'],
    skills: entries
  }, null, 2) + '\n');
}

// A synthetic tree rather than a copy of the repo: fast, and independent of real skill content.
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-invariants-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const rootReadme = [];
  for (const [bucket, names] of Object.entries(skills)) {
    const bucketReadme = [`# ${bucket}`, ''];
    for (const name of names) {
      write(root, `skills/${bucket}/${name}/SKILL.md`, `# ${name}\n`);
      bucketReadme.push(`- [${name}](./${name}/SKILL.md) ${description}`);
      if (publicBuckets.includes(bucket)) rootReadme.push(`- [${name}](./skills/${bucket}/${name}/SKILL.md) ${description}`);
    }
    write(root, `skills/${bucket}/README.md`, bucketReadme.join('\n') + '\n');
  }
  write(root, 'README.md', ['# Fixture', '', ...rootReadme, ''].join('\n'));
  writeManifest(root, promoted);
  // Satisfy rules 8 to 14 so a test for one of them is never failed by another.
  for (const [bucket, names] of Object.entries(skills)) {
    for (const name of names) {
      write(root, `skills/${bucket}/${name}/agents/openai.yaml`, openaiYaml(name));
      if (documentedBuckets.includes(bucket)) write(root, `docs/${bucket}/${name}.md`, docsPage(name));
    }
  }
  // The router. Nothing in the fixture is user-invoked by default, so it starts empty of
  // names; the rule 11 test adds a user-invoked skill and expects this to fail.
  write(root, 'skills/engineering/ask-matt/SKILL.md', '# ask-matt\n\nRoutes the user-invoked skills.\n');
  write(root, 'skills/engineering/ask-matt/agents/openai.yaml', openaiYaml('ask-matt'));
  write(root, 'docs/engineering/ask-matt.md', docsPage('ask-matt'));
  write(root, 'skills/engineering/README.md', [
    '# engineering', '',
    `- [alpha](./alpha/SKILL.md) ${description}`,
    `- [ask-matt](./ask-matt/SKILL.md) ${description}`,
    ''
  ].join('\n'));
  write(root, 'README.md', ['# Fixture', '',
    ...rootReadme,
    `- [ask-matt](./skills/engineering/ask-matt/SKILL.md) ${description}`,
    ''].join('\n'));
  writeManifest(root, [...promoted, './skills/engineering/ask-matt']);
  write(root, '00-READ-FIRST.md', '# First\n\n1. [`HANDOVER.md`](HANDOVER.md)\n');
  write(root, 'AGENTS.md', '# Agents\n\n1. [`HANDOVER.md`](HANDOVER.md)\n');
  write(root, 'CLAUDE.md', '# Claude\n\n1. [`HANDOVER.md`](HANDOVER.md)\n');
  write(root, 'HANDOVER.md', '# Handover\n\n**Status:** ACTIVE\n');
  // The script derives its repo root from dirname "$0", so it cannot be aimed with cwd or an
  // env var. A symlink (not a copy) makes "$0" resolve into the fixture while still running the
  // real file, so this test cannot go stale against the script it guards.
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.symlinkSync(script, path.join(root, 'scripts', 'check-invariants.sh'));
  return root;
}

function run(root) {
  try {
    const stdout = execFileSync('bash', [path.join(root, 'scripts', 'check-invariants.sh')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { status: 0, stdout };
  } catch (err) {
    return { status: err.status, stdout: String(err.stdout) };
  }
}

const withEntries = (root, extra, base = promoted) => {
  writeManifest(root, [...base, ...extra]);
  return run(root);
};

test('a clean tree passes, so the array-scoped reader adds no false positives', t => {
  const result = run(fixture(t));
  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /OK/);
});

test('control: the byte-exact spelling of a private skill is rejected', t => {
  const result = withEntries(fixture(t), ['./skills/personal/secret']);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /unpromoted skills\/personal\/secret is listed/);
});

test('a trailing slash does not hide an unpromoted skill from rule 4', t => {
  const result = withEntries(fixture(t), ['./skills/in-progress/draft/']);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /unpromoted skills\/in-progress\/draft is listed/);
});

test('a missing ./ prefix does not hide an unpromoted skill from rules 4 or 6', t => {
  const result = withEntries(fixture(t), ['skills/personal/secret']);
  assert.equal(result.status, 1, result.stdout);
  // Both: rule 4 must see it, and rule 6 must flag the spelling it used to be invisible to.
  assert.match(result.stdout, /unpromoted skills\/personal\/secret is listed/);
  assert.match(result.stdout, /is not written as '\.\/skills\/<bucket>\/<skill>'/);
});

// Each of these used to exit 0 with an unpromoted skill published.
for (const [label, spell] of [
  ['an extra ./ segment', () => './skills/./personal/secret'],
  ['a doubled slash', () => './/skills/personal/secret'],
  ['a .. segment', () => './skills/in-progress/../in-progress/draft'],
  ['an absolute path', root => path.join(root, 'skills', 'personal', 'secret')]
]) {
  test(`non-canonical spelling is rejected: ${label}`, t => {
    const root = fixture(t);
    const result = withEntries(root, [spell(root)]);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stdout, /is not written as '\.\/skills\/<bucket>\/<skill>'/);
  });
}

test('an entry that resolves to no skill still fails', t => {
  const result = withEntries(fixture(t), ['./skills/engineering/does-not-exist']);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /has no SKILL\.md/);
});

test('a missing public entry still fails rule 2, so the positive direction is not loosened',  t => {
  const result = withEntries(fixture(t), [], promoted.slice(1));
  assert.equal(result.status, 1);
  assert.match(result.stdout, /skills\/engineering\/alpha is missing from/);
});


// ---------------------------------------------------------------------------
// Rules 8 to 14. Each asserts both directions: the violation fails with a
// message naming the file, and the compliant fixture passes. Three of these
// invariants were stated in prose and enforced by nothing, and had already
// drifted; the other four held by luck rather than by check.
// ---------------------------------------------------------------------------

test('rule 8: a promoted skill with no docs page fails', t => {
  const root = fixture(t);
  fs.rmSync(path.join(root, 'docs/engineering/alpha.md'));
  const result = run(root);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /skills\/engineering\/alpha has no docs page at docs\/engineering\/alpha\.md/);
});

test('rule 8: a docs page missing one of the fixed-frame sections fails, naming the section', t => {
  const root = fixture(t);
  write(root, 'docs/productivity/beta.md', '## What it does\n\nbeta does a thing.\n\n## Where it fits\n\nSomewhere.\n');
  const result = run(root);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /docs\/productivity\/beta\.md has no 'When to reach for it' section/);
});

test('rule 8: a page may omit Common questions, which writing-docs.md asks for when the hunt is thin', t => {
  // A regression guard on the CHECKER, not the tree: an earlier version of this rule
  // required all four sections and failed a page that is correct by the template.
  const root = fixture(t);
  const result = run(root);
  assert.equal(result.status, 0, result.stdout);
  assert.doesNotMatch(result.stdout, /Common questions/);
});

test('rule 8: an archived page is exempt from the section requirement', t => {
  const root = fixture(t);
  write(root, 'docs/engineering/alpha.md', '> Archived: the skill was removed.\n');
  const result = run(root);
  assert.equal(result.status, 0, result.stdout);
});

test('rule 9: a skill with no agents/openai.yaml fails', t => {
  const root = fixture(t);
  fs.rmSync(path.join(root, 'skills/personal/secret/agents/openai.yaml'));
  const result = run(root);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /skills\/personal\/secret has no agents\/openai\.yaml/);
});

test('rule 10: a skill user-invoked in one harness and model-invoked in the other fails, naming both modes', t => {
  const root = fixture(t);
  // User-invoked in SKILL.md, left model-invoked in the Codex metadata: the exact
  // desync that leaves a human-only skill reachable by the model in one harness.
  write(root, 'skills/productivity/beta/SKILL.md', '---\nname: beta\ndisable-model-invocation: true\n---\n\n# beta\n');
  const result = run(root);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /skills\/productivity\/beta is user-invoked in SKILL\.md but model-invoked in agents\/openai\.yaml/);
});

test('rule 10: the reverse desync also fails', t => {
  const root = fixture(t);
  write(root, 'skills/productivity/beta/agents/openai.yaml', openaiYaml('beta', true));
  const result = run(root);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /is model-invoked in SKILL\.md but user-invoked in agents\/openai\.yaml/);
});

test('rule 11: a user-invoked skill the router never names fails', t => {
  const root = fixture(t);
  write(root, 'skills/engineering/alpha/SKILL.md', '---\nname: alpha\ndisable-model-invocation: true\n---\n\n# alpha\n');
  write(root, 'skills/engineering/alpha/agents/openai.yaml', openaiYaml('alpha', true));
  const result = run(root);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /user-invoked skills\/engineering\/alpha is named nowhere in skills\/engineering\/ask-matt\/SKILL\.md/);
});

test('rule 11: the same skill passes once the router names it', t => {
  const root = fixture(t);
  write(root, 'skills/engineering/alpha/SKILL.md', '---\nname: alpha\ndisable-model-invocation: true\n---\n\n# alpha\n');
  write(root, 'skills/engineering/alpha/agents/openai.yaml', openaiYaml('alpha', true));
  write(root, 'skills/engineering/ask-matt/SKILL.md', '# ask-matt\n\nRun `/alpha` when you need alpha.\n');
  const result = run(root);
  assert.equal(result.status, 0, result.stdout);
});

test('rule 11: a model-invoked skill the router omits is fine, since the router covers what a human types', t => {
  const root = fixture(t);
  const result = run(root);
  assert.equal(result.status, 0, result.stdout);
  assert.doesNotMatch(result.stdout, /named nowhere/);
});

test('rule 12: an em-dash in a SKILL.md fails, naming the file and line', t => {
  const root = fixture(t);
  write(root, 'skills/engineering/alpha/SKILL.md', `# alpha\n\nIt does a thing \u2014 and another.\n`);
  const result = run(root);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /skills\/engineering\/alpha\/SKILL\.md:3 uses an em-dash/);
});

test('rule 12: an em-dash in a shell comment fails, but one in code does not', t => {
  const root = fixture(t);
  write(root, 'scripts/helper.sh', `#!/usr/bin/env bash\n# a comment \u2014 with an em-dash\n`);
  let result = run(root);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /scripts\/helper\.sh:2 uses an em-dash in a comment/);

  // The checker's own description-stripping sed carries a literal em-dash as DATA. An
  // earlier version of this rule used a glob that matched any line with an asterisk and
  // flagged exactly that line, which would push a reader to break working code.
  const clean = fixture(t);
  write(clean, 'scripts/helper.sh', `#!/usr/bin/env bash\nsed -E 's/^[*\u2014-]+//' <<< "x"\n`);
  result = run(clean);
  assert.equal(result.status, 0, result.stdout);
});

test('rule 12: it fails loudly rather than passing when it can find no files to scan', t => {
  // The rule reads `git ls-files` in a checkout. Outside one it used to return nothing
  // and the rule passed having read nothing at all, which is the silent-no-op shape
  // rule 1's floor exists to prevent.
  const root = fixture(t);
  const result = run(root);
  assert.equal(result.status, 0, result.stdout);
  assert.doesNotMatch(result.stdout, /found no files to scan/);
});

test('rule 13: an entry point pointing at a file that does not exist fails', t => {
  const root = fixture(t);
  write(root, 'AGENTS.md', '# Agents\n\nFollow [`AGENTS-PROJECT-RULES.md`](AGENTS-PROJECT-RULES.md).\n');
  const result = run(root);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /AGENTS\.md:3 points at 'AGENTS-PROJECT-RULES\.md', which does not exist/);
});

test("rule 13: the same pointer is fine when it is marked 'when present'", t => {
  const root = fixture(t);
  write(root, 'AGENTS.md', '# Agents\n\n1. [`AGENTS-PROJECT-RULES.md`](AGENTS-PROJECT-RULES.md), when present\n');
  const result = run(root);
  assert.equal(result.status, 0, result.stdout);
});

test('rule 14: a Status the gate cannot parse fails, quoting what it found', t => {
  const root = fixture(t);
  write(root, 'HANDOVER.md', '# Handover\n\n**Status:** ACTIVE (but see the note below)\n');
  const result = run(root);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /Status is 'ACTIVE \(but see the note below\)'/);
});

test('rule 14: each of the three gate values passes', t => {
  for (const value of ['ACTIVE', 'BLOCKED', 'COMPLETE']) {
    const root = fixture(t);
    write(root, 'HANDOVER.md', `# Handover\n\n**Status:** ${value}\n`);
    const result = run(root);
    assert.equal(result.status, 0, `${value}: ${result.stdout}`);
  }
});

test('rule 14: a missing Status line fails, since the gate reads that field', t => {
  const root = fixture(t);
  write(root, 'HANDOVER.md', '# Handover\n\nNo status here.\n');
  const result = run(root);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /HANDOVER\.md has no Status line/);
});
