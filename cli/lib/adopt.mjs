// Adopting a project that copied the kit by hand: work out what it forked from,
// so the first update can tell "only you changed it" from a real conflict.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hashFile, sha256, walk } from './hash.mjs';
import { dest, kitRoot, specFor } from './manifest.mjs';

export function knownHashes(root = kitRoot) {
  const path = join(root, 'cli', 'known-hashes.json');
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
}

/** Where the kit was copied to: the directory holding docs/01-Principles.md. */
export function detectKitDir(root) {
  const marker = 'docs/01-Principles.md';
  if (existsSync(join(root, marker))) return '';
  for (const candidate of ['devos', 'devos-kit', '.devos-kit']) {
    if (existsSync(join(root, candidate, marker))) return candidate;
  }
  for (const entry of walk(root).filter((path) => path.endsWith(marker))) {
    return entry.slice(0, -marker.length - 1);
  }
  return null;
}

/**
 * The released version that best explains this project — matches count for it, and
 * files the version shipped but the project does not have count against it.
 *
 * The penalty is what keeps a later version from winning on shared unchanged files
 * alone: a project that forked before the board exists should adopt the version
 * without the board, so the board arrives as an addition rather than as 18 files it
 * looks like the project deleted.
 */
export function detectVersion(root, payload, config, manifest, hashes) {
  const scores = Object.entries(hashes).map(([version, files]) => {
    let hits = 0;
    let absent = 0;
    let tracked = 0;
    for (const { path } of payload) {
      if (!files[path]) continue;
      tracked += 1;
      const cur = hashFile(join(root, dest(path, config, manifest)));
      if (cur === files[path]) hits += 1;
      else if (cur === null) absent += 1;
    }
    return { version, hits, absent, tracked, score: hits - absent };
  }).filter((score) => score.tracked);

  scores.sort((a, b) => b.score - a.score || a.version.localeCompare(b.version));
  return scores[0] || null;
}

/**
 * A file the project renamed still has the bytes of a released version, so its new
 * location can be found by content rather than guessed by name.
 */
export function detectRenames(root, payload, config, manifest, hashes) {
  const overrides = {};
  const extras = new Map();
  const kitDir = config.kitDir || '';
  for (const rel of walk(join(root, kitDir))) {
    const hash = hashFile(join(root, kitDir, rel));
    if (hash) extras.set(hash, kitDir ? `${kitDir}/${rel}` : rel);
  }

  for (const { path } of payload) {
    const to = dest(path, config, manifest);
    if (existsSync(join(root, to))) continue;
    for (const files of Object.values(hashes)) {
      const known = files[path];
      const found = known && extras.get(known);
      if (found && found !== to) {
        overrides[path] = found;
        break;
      }
    }
  }
  return overrides;
}

/** `git show <ref>:<path>` from a local clone of the kit, for baseline backfill. */
export function pristine(kitRepo, ref, path) {
  const result = spawnSync('git', ['-C', kitRepo, 'show', `${ref}:${path}`], { encoding: 'buffer' });
  return result.status === 0 ? result.stdout : null;
}

/**
 * Per-file provenance. `base` is the pristine hash of the detected version even for a
 * file the project modified — that is what makes the first update decidable.
 */
export function adoptFiles({ root, payload, config, manifest, hashes, version }) {
  const pristineAt = hashes[version] || {};
  const files = new Map();

  for (const { path, entry } of payload) {
    const to = dest(path, config, manifest);
    const cur = hashFile(join(root, to));
    const known = pristineAt[path] || null;
    const spec = entry.class === 'generated-once' ? specFor(path, config, manifest) : null;
    const specHash = spec ? pristineAt[spec] || null : null;

    if (cur === null) {
      if (known) {
        files.set(path, { path, dest: to, class: entry.class, version, status: 'deleted', base: known, hash: null });
      }
      continue;
    }

    const matchedVersion = Object.entries(hashes)
      .filter(([, entries]) => entries[path] === cur)
      .map(([candidate]) => candidate)
      .sort()
      .pop();

    files.set(path, {
      path,
      dest: to,
      class: entry.class,
      ...(entry.unit ? { unit: entry.unit } : {}),
      version: matchedVersion || version,
      status: entry.class === 'generated-once' ? 'owned' : (matchedVersion ? 'ok' : 'modified'),
      base: matchedVersion ? cur : known,
      hash: cur,
      ...(spec ? { spec, specHash } : {}),
    });
  }

  return files;
}

export const hashOf = (buffer) => sha256(buffer);
