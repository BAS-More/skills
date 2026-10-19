#!/usr/bin/env node
// Usage: node install-clink.mjs --pal <PAL install dir> [--add-dir <projects root>] [--target <dir>] [--apply] [--force]
// Copies the cheap-model clink clients (../pal/cli_clients/*.json) into PAL's user override folder,
// default ~/.pal/cli_clients. Without --apply it only prints the plan (text, not JSON).
// --add-dir appends `--add-dir <root>` to every client so its read-only tools can reach the repos under it.
// Stock PAL accepts only clients named claude, codex or gemini, and one rejected file stops the whole clink
// registry from loading, so --apply first checks that <PAL>/clink/models.py gives CLIClientConfig a `runner`
// field (the BAS-More/PAL-MCP patch). PAL reads these files at start-up: restart it after installing.
// Exit 0 = done (or dry run); 1 = refused; 2 = installed, but some files were left alone as conflicts;
// 3 = bad arguments.
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseArgs, isMain } from './lib.mjs';

// True only when the raw config model (what a JSON file is validated against) declares `runner` as a field.
// The resolved model has had `runner` all along, so a plain search of the file would give a false yes.
// The class body ends at the first non-blank line that is not indented; strings are removed first so a
// docstring or a multi-line string that mentions `runner:` does not count.
export function palSupportsRunner(palDir) {
  let src;
  try { src = readFileSync(join(palDir, 'clink', 'models.py'), 'utf8'); } catch { return false; }
  src = src.replace(/\r\n/g, '\n').replace(/("""|''')[\s\S]*?\1/g, '');
  const head = src.match(/^class CLIClientConfig\b[^\n]*\n/m);
  if (!head) return false;
  const rest = src.slice(head.index + head[0].length);
  const end = rest.search(/^\S/m);
  const body = end < 0 ? rest : rest.slice(0, end);
  const indent = body.match(/^([ \t]+)\S/m)?.[1];
  if (!indent) return false;
  return new RegExp(`^${indent}runner\\s*:`, 'm').test(body);
}

// The file content that would be written: the shipped client, plus --add-dir when a root is given.
export function renderClient(text, addDir) {
  if (!addDir) return text;
  const cfg = JSON.parse(text);
  cfg.additional_args = [...cfg.additional_args, '--add-dir', addDir];
  return `${JSON.stringify(cfg, null, 2)}\n`;
}

export function planInstall(sourceDir, targetDir, { force = false, addDir } = {}) {
  return readdirSync(sourceDir).filter((f) => f.endsWith('.json')).sort().map((file) => {
    const content = renderClient(readFileSync(join(sourceDir, file), 'utf8'), addDir);
    const dst = join(targetDir, file);
    if (!existsSync(dst)) return { file, dst, content, action: 'copy' };
    if (readFileSync(dst, 'utf8') === content) return { file, dst, content, action: 'same' };
    return { file, dst, content, action: force ? 'overwrite' : 'conflict' };
  });
}

const fail = (code, msg) => { console.error(`install-clink: ${msg}`); process.exit(code); };

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  for (const k of ['pal', 'target', 'add-dir']) if (args[k] === true) fail(3, `--${k} needs a value`);
  const source = join(dirname(fileURLToPath(import.meta.url)), '..', 'pal', 'cli_clients');
  const target = args.target ?? join(homedir(), '.pal', 'cli_clients');
  const plan = planInstall(source, target, { force: Boolean(args.force), addDir: args['add-dir'] });
  if (args.apply) {
    if (!args.pal) fail(1, '--apply needs --pal <PAL install dir> so it can check runner support first');
    if (!palSupportsRunner(args.pal)) {
      fail(1, `${args.pal} has no runner field on CLIClientConfig. Installing would make clink reject these files and stop loading every client. Merge and deploy the PAL runner patch first.`);
    }
    mkdirSync(target, { recursive: true });
    for (const p of plan) if (p.action === 'copy' || p.action === 'overwrite') writeFileSync(p.dst, p.content);
  }
  console.log(args.apply ? `install-clink: target ${target}` : `install-clink: dry run (add --apply to write), target ${target}`);
  for (const p of plan) console.log(`  ${p.action.padEnd(9)} ${p.file}`);
  const conflicts = plan.filter((p) => p.action === 'conflict');
  if (conflicts.length) console.log(`  ${conflicts.length} conflict(s) left untouched; compare them, then rerun with --force to replace`);
  if (args.apply) console.log('  Restart PAL (its hub backend) so clink loads the new clients, then probe each one (PHASES.md P0).');
  process.exit(args.apply && conflicts.length ? 2 : 0);
}
