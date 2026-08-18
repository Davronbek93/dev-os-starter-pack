#!/usr/bin/env node
// Kit-repo tooling. Not shipped to consumers; run from the kit checkout.
//
//   node scripts/release.mjs hashes            regenerate cli/known-hashes.json from tags
//   node scripts/release.mjs check             invariants a release must satisfy
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { classify, kitRoot, kitVersion, loadManifest, payload } from '../cli/lib/manifest.mjs';
import { sha256 } from '../cli/lib/hash.mjs';

const git = (...args) => {
  const result = spawnSync('git', ['-C', kitRoot, ...args], { encoding: 'buffer' });
  if (result.status !== 0) return null;
  return result.stdout;
};

const manifest = loadManifest();
const command = process.argv[2] || 'check';

if (command === 'hashes') {
  const tags = String(git('tag', '-l', 'v*') || '')
    .split('\n').map((tag) => tag.trim()).filter(Boolean).sort();
  const out = {};

  for (const tag of tags) {
    const files = String(git('ls-tree', '-r', '--name-only', tag) || '')
      .split('\n').map((path) => path.trim()).filter(Boolean)
      .filter((path) => classify(manifest, path));
    const entries = {};
    for (const path of files) {
      const blob = git('show', `${tag}:${path}`);
      if (blob) entries[path] = sha256(blob);
    }
    out[tag.replace(/^v/, '')] = entries;
    console.log(`${tag}  ${Object.keys(entries).length} files`);
  }

  // The working tree counts as the version being prepared.
  const current = kitVersion();
  out[current] = Object.fromEntries(payload().map(({ path }) =>
    [path, sha256(readFileSync(join(kitRoot, path)))]));
  console.log(`${current}  ${Object.keys(out[current]).length} files (working tree)`);

  writeFileSync(join(kitRoot, 'cli', 'known-hashes.json'), `${JSON.stringify(out, null, 1)}\n`);
  console.log('wrote cli/known-hashes.json');
} else if (command === 'check') {
  const problems = [];
  const version = kitVersion();
  if (manifest.version !== version) {
    problems.push(`devos.manifest.json says ${manifest.version}, package.json says ${version}`);
  }
  const pkg = JSON.parse(readFileSync(join(kitRoot, 'package.json'), 'utf8'));
  if (Object.keys(pkg.dependencies || {}).length) problems.push('the kit must ship zero dependencies');
  for (const hook of ['prepare', 'prepublishOnly', 'postinstall']) {
    if (pkg.scripts?.[hook]) problems.push(`package.json defines "${hook}" — it breaks npx from git`);
  }
  if (Object.keys(pkg.bin || {}).length !== 1) problems.push('package.json must define exactly one bin');
  const files = payload();
  if (files.some(({ path }) => path.endsWith('/.gitignore'))) {
    problems.push('npm renames .gitignore inside a package — ship it under another name');
  }
  console.log(`kit ${version}: ${files.length} payload files`);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
  console.log('release invariants ok');
} else {
  console.error(`unknown command: ${command}`);
  process.exit(1);
}
