#!/usr/bin/env node
// DevOS installer. Puts the kit into a project, and updates it later without ever
// overwriting a file the project changed.
//
//   npx github:Davronbek93/dev-os-starter-pack#v0.3.0 install
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { findRoot } from '../board/lib/gitroot.mjs';
import { hashFile, sha256, walk } from './lib/hash.mjs';
import { kitRoot, kitVersion, loadManifest, payload as loadPayload, dest, specFor } from './lib/manifest.mjs';
import { DEFAULTS, hasConfig, readConfig, resolveConfig, writeConfig } from './lib/config.mjs';
import { hasLock, readLock, writeLock } from './lib/lock.mjs';
import { planActions } from './lib/plan.mjs';
import { applyActions, PROPOSAL_DIR, baselinePath, write } from './lib/apply.mjs';
import { report } from './lib/report.mjs';
import { adoptFiles, detectKitDir, detectRenames, detectVersion, knownHashes, pristine } from './lib/adopt.mjs';

const USAGE = `devos ${kitVersion()} — install and update the DevOS kit

  install [--dest DIR] [--kit-dir D] [--board-dir D] [--claude-dir D]
          [--tasks-dir D] [--roadmap P] [--conventions P] [--branch NAME]
          [--branch-pattern P] [--serialization-points a,b] [--parallelism N]
          [--adopt [--from VERSION] [--kit-repo PATH]] [--dry-run] [--yes]
  update  [--dest DIR] [--only GLOB] [--dry-run] [--verbose]
  status  [--dest DIR]
  doctor  [--dest DIR]
  restore <kit-path> [--dest DIR]
  version

install --adopt is for a project that copied the kit by hand: it writes only
devos.config.json, devos.lock.json and the baseline, so the first update knows
which files you changed.`;

const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith('--')) {
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) flags[key] = true;
    else {
      flags[key] = next;
      i += 1;
    }
  } else positional.push(argv[i]);
}

const [command, ...args] = positional;
const fail = (message) => {
  console.error(`devos: ${message}`);
  process.exit(1);
};
const say = (message) => console.log(message);

const root = resolve(flags.dest && flags.dest !== true ? flags.dest : findRoot(process.cwd()));
const manifest = loadManifest();
const payload = loadPayload();
const version = kitVersion();
const upstream = (path) => sha256(readFileSync(join(kitRoot, path)));
const onDisk = (to) => hashFile(join(root, to));

function freshLock(config) {
  return {
    kit: {
      name: manifest.kit,
      spec: `github:Davronbek93/dev-os-starter-pack`,
      version,
      installedAt: new Date().toISOString(),
      installedBy: `devos ${version}`,
    },
    config,
    byPath: new Map(),
  };
}

function run({ lock, config, dryRun, only }) {
  let actions = planActions({ payload, manifest, lock, config, onDisk, upstream });
  if (only) actions = actions.filter((action) => action.path.startsWith(only.replace(/\*+$/, '')));
  const applied = applyActions({ actions, root, kitRoot, config, manifest, payload, lock, dryRun });
  return applied;
}

/* ------------------------------------------------------------------ install */

function install() {
  if (hasLock(root) && !flags.adopt) fail(`already installed (devos.lock.json) — run "devos update"`);
  const config = resolveConfig(root, flags);

  if (flags.adopt) return adopt(config);

  if (!flags.yes && !flags['dry-run'] && existsSync(root) && readdirSync(root).length &&
      !existsSync(join(root, '.git'))) {
    fail('destination is not empty and not a git repository — re-run with --yes if that is intended');
  }

  const lock = freshLock(config);
  const { results, lock: next } = run({ lock, config, dryRun: flags['dry-run'] });
  if (!flags['dry-run']) {
    writeConfig(root, config);
    writeLock(root, { ...next, config });
  }
  say(report(results, {
    from: version, to: version, root, config,
    verbose: Boolean(flags.verbose), dryRun: Boolean(flags['dry-run']),
  }));
  if (!flags['dry-run']) {
    say(`\nwrote devos.config.json and devos.lock.json`);
    say(`next: paste what you need from ${config.kitDir}/install/CLAUDE-devos-section.md into CLAUDE.md`);
  }
}

/* -------------------------------------------------------------------- adopt */

function adopt(base) {
  const hashes = knownHashes();
  if (!Object.keys(hashes).length) fail('no cli/known-hashes.json in this kit — cannot detect a base version');

  const detectedKit = flags['kit-dir'] && flags['kit-dir'] !== true ? flags['kit-dir'] : detectKitDir(root);
  if (detectedKit === null) fail(`no DevOS kit found under ${root} (looked for docs/01-Principles.md)`);
  const config = { ...base, kitDir: detectedKit };

  const detected = detectVersion(root, payload, config, manifest, hashes);
  const from = flags.from && flags.from !== true ? flags.from : detected?.version;
  if (!from) fail('could not detect a base version — pass --from X.Y.Z');
  if (!hashes[from]) fail(`unknown base version ${from} (known: ${Object.keys(hashes).join(', ')})`);

  config.pathOverrides = { ...config.pathOverrides, ...detectRenames(root, payload, config, manifest, hashes) };
  const files = adoptFiles({ root, payload, config, manifest, hashes, version: from });

  // Baseline backfill: a modified file has no pristine copy in this payload, so take it
  // from a local clone of the kit at the version we adopted.
  const kitRepo = flags['kit-repo'] && flags['kit-repo'] !== true ? resolve(flags['kit-repo']) : null;
  let backfilled = 0;
  let missingBaseline = 0;
  for (const file of files.values()) {
    if (file.status !== 'modified') continue;
    const contents = kitRepo ? pristine(kitRepo, `v${from}`, file.path) : null;
    if (contents) {
      if (!flags['dry-run']) write(baselinePath(root, config, file.path), contents);
      backfilled += 1;
    } else missingBaseline += 1;
  }
  for (const file of files.values()) {
    if (file.status === 'ok' && !flags['dry-run'] && config.baseline) {
      write(baselinePath(root, config, file.path), readFileSync(join(root, file.dest)));
    }
  }

  const tally = [...files.values()].reduce((acc, file) => ({ ...acc, [file.status]: (acc[file.status] || 0) + 1 }), {});
  const extras = payload.filter(({ path }) => !files.has(path)).length;

  say(`devos adopt — ${manifest.kit} ${from} detected in ${root}`);
  say(`  kit dir     ${config.kitDir || '.'}`);
  if (detected) {
    say(`  match       ${detected.hits} of ${detected.tracked} files identical at ${detected.version}` +
      `${detected.absent ? `, ${detected.absent} it shipped are absent here` : ''}`);
  }
  say(`  files       ${JSON.stringify(tally)}`);
  if (extras) say(`  new upstream ${extras} file(s) the kit ships and you do not — "devos update" adds them`);
  if (Object.keys(config.pathOverrides).length) {
    say(`  renames     ${Object.entries(config.pathOverrides).map(([a, b]) => `${a} → ${b}`).join(', ')}`);
  }
  const hint = kitRepo ? '' : ' — pass --kit-repo <clone> so the first update can merge instead of propose';
  say(`  baseline    ${backfilled} backfilled${missingBaseline ? `, ${missingBaseline} without a pristine copy${hint}` : ''}`);

  if (flags['dry-run']) return say('\n(dry run — nothing written)');
  writeConfig(root, config);
  writeLock(root, {
    kit: {
      name: manifest.kit, spec: 'github:Davronbek93/dev-os-starter-pack', version: from,
      installedAt: new Date().toISOString(), installedBy: `devos ${version}`, adopted: true,
    },
    config,
    byPath: files,
  });
  say('\nwrote devos.config.json, devos.lock.json and the baseline — nothing else was touched');
  say('next: devos update --dry-run');
}

/* ------------------------------------------------------------------- update */

function update() {
  const lock = readLock(root);
  if (!lock) fail('not installed here — run "devos install"');
  const config = readConfig(root) || DEFAULTS;
  const { results, lock: next } = run({
    lock, config, dryRun: flags['dry-run'],
    only: flags.only && flags.only !== true ? flags.only : null,
  });
  if (!flags['dry-run']) {
    writeLock(root, { ...next, kit: { ...lock.kit, version, updatedAt: new Date().toISOString() }, config });
  }
  say(report(results, {
    from: lock.kit.version, to: version, root, config,
    verbose: Boolean(flags.verbose), dryRun: Boolean(flags['dry-run']),
  }));
  const conflicts = results.filter((action) => action.kind === 'CONFLICT').length;
  if (conflicts && !flags['dry-run']) say(`proposals under ${PROPOSAL_DIR}/`);
}

/* ------------------------------------------------------------ status/doctor */

function summary() {
  const lock = readLock(root);
  if (!lock) fail('not installed here — run "devos install"');
  const config = readConfig(root) || DEFAULTS;
  const actions = planActions({ payload, manifest, lock, config, onDisk, upstream });
  return { lock, config, actions };
}

function status() {
  const { lock, config, actions } = summary();
  const tally = actions.reduce((acc, action) => ({ ...acc, [action.kind]: (acc[action.kind] || 0) + 1 }), {});
  say(`devos ${lock.kit.version} installed, kit here is ${version}`);
  say(`  ${root} (kit: ${config.kitDir}/, board: ${config.boardDir}/, tasks: ${config.tasksDir}/)`);
  for (const [kind, count] of Object.entries(tally).sort()) say(`  ${kind.toLowerCase().padEnd(12)} ${count}`);
  const pending = actions.filter((a) => ['UPDATE', 'ADD', 'CONFLICT', 'STALE', 'MISSING'].includes(a.kind));
  if (pending.length) {
    say(`\n${pending.length} file(s) need attention — devos update --dry-run`);
    process.exit(2);
  }
  say('\nclean.');
}

function doctor() {
  const { lock, config, actions } = summary();
  const problems = [];

  for (const dir of [config.tasksDir, config.kitDir, config.boardDir]) {
    if (dir && !existsSync(join(root, dir))) problems.push(`missing directory: ${dir}/`);
  }
  if (config.roadmap && !existsSync(join(root, config.roadmap))) {
    problems.push(`roadmap not found: ${config.roadmap}`);
  }

  // Rename rot: these documents cross-reference each other constantly.
  const broken = [];
  for (const { path } of payload.filter(({ path }) => path.endsWith('.md'))) {
    const file = join(root, dest(path, config, manifest));
    if (!existsSync(file)) continue;
    const dir = join(file, '..');
    for (const match of readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^(https?:|mailto:)/.test(target) || target.includes('<')) continue;
      if (!existsSync(resolve(dir, target))) broken.push(`${relative(root, file)} → ${target}`);
    }
  }

  const stale = actions.filter((action) => action.kind === 'STALE');
  const missing = actions.filter((action) => action.kind === 'MISSING');
  const orphans = (lock.files || []).filter((file) => !payload.some(({ path }) => path === file.path));

  say(`devos doctor — ${root}`);
  say(`  installed ${lock.kit.version}, kit here ${version}`);
  say(`  payload   ${payload.length} files, ${lock.files?.length || 0} tracked`);
  if (broken.length) {
    say(`\nbroken links (${broken.length}) — usually a renamed doc:`);
    for (const line of broken.slice(0, 10)) say(`  ${line}`);
  }
  if (stale.length) say(`\nexecutable forms behind their spec (${stale.length}): ${stale.map((a) => a.dest).join(', ')}`);
  if (missing.length) say(`\ntracked but absent (${missing.length}): ${missing.map((a) => a.dest).join(', ')}`);
  if (orphans.length) say(`\norphan lock entries (${orphans.length}): ${orphans.map((f) => f.path).join(', ')}`);
  if (problems.length) say(`\nconfiguration:\n  ${problems.join('\n  ')}`);

  const total = broken.length + problems.length;
  say(total ? `\n${total} problem(s) found.` : '\nno problems found.');
  if (total) process.exit(2);
}

function restore() {
  const path = args[0];
  if (!path) fail('restore needs a kit-relative path');
  const lock = readLock(root);
  if (!lock) fail('not installed here');
  const config = readConfig(root) || DEFAULTS;
  const item = payload.find((entry) => entry.path === path);
  if (!item) fail(`not part of the kit: ${path}`);
  lock.byPath.delete(path);
  const { results, lock: next } = run({ lock, config, dryRun: false });
  writeLock(root, { ...next, config });
  const done = results.find((action) => action.path === path);
  say(`restored ${done?.dest || path} (${done?.kind.toLowerCase()})`);
}

try {
  switch (command) {
    case undefined: case 'help': case '--help': say(USAGE); break;
    case 'version': say(version); break;
    case 'install': install(); break;
    case 'update': update(); break;
    case 'status': status(); break;
    case 'doctor': doctor(); break;
    case 'restore': restore(); break;
    default: fail(`unknown command: ${command}\n\n${USAGE}`);
  }
} catch (err) {
  fail(err.message);
}
