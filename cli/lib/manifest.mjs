// What the kit ships, how each file is treated, and where it lands in a project.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { matches } from './glob.mjs';
import { walk } from './hash.mjs';

export const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const kitVersion = () =>
  JSON.parse(readFileSync(join(kitRoot, 'package.json'), 'utf8')).version;

export function loadManifest(root = kitRoot) {
  const path = join(root, 'devos.manifest.json');
  if (!existsSync(path)) throw new Error(`no devos.manifest.json in ${root}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Last matching entry wins, so a specific path can override the glob above it. */
export function classify(manifest, path) {
  let hit = null;
  for (const entry of manifest.entries) {
    if (entry.path ? entry.path === path : matches(path, entry.glob)) hit = entry;
  }
  return hit && hit.class !== 'excluded' ? hit : null;
}

/** Every kit file the manifest covers, with the entry that governs it. */
export function payload(root = kitRoot, manifest = loadManifest(root)) {
  const roots = new Set(manifest.entries
    .map((entry) => (entry.path || entry.glob).split('/')[0])
    .filter((top) => !top.includes('*')));
  const files = [...roots].flatMap((top) =>
    walk(join(root, top)).map((rel) => `${top}/${rel}`));

  return files
    .map((path) => ({ path, entry: classify(manifest, path) }))
    .filter((item) => item.entry)
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** Where a kit-relative path lands in the consumer, as a consumer-relative path. */
export function dest(path, config, manifest) {
  const override = config.pathOverrides?.[path];
  if (override) return override;

  const entry = classify(manifest, path);
  const to = entry?.to || 'kit';
  if (to === 'claude') return path.replace(/^\.claude/, config.claudeDir);
  if (to === 'board') return path.replace(/^board/, config.boardDir);
  if (to === 'root') return path;
  return config.kitDir ? `${config.kitDir}/${path}` : path;
}

/** The spec a generated executable form derives from, kit-relative. */
export function specFor(path, config, manifest) {
  return config.generatedFrom?.[path] || manifest.specMap?.[path] || null;
}
