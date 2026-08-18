// Executing a plan. The only rule that matters: a file you changed is never
// overwritten — the new version lands beside it instead.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { sha256 } from './hash.mjs';
import { isRendered, relink, render } from './render.mjs';

export const PROPOSAL_DIR = '.devos-update';

const write = (path, contents) => {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.devos-tmp`;
  writeFileSync(tmp, contents);
  renameSync(tmp, path);
};

const baselinePath = (root, config, path) => join(root, config.dataDir, 'baseline', path);

/** git merge-file, when a baseline exists. Returns merged text, or null if dirty. */
function merge3(ours, base, theirs) {
  const dir = mkdtempSync(join(tmpdir(), 'devos-merge-'));
  try {
    const files = ['ours', 'base', 'theirs'].map((name) => join(dir, name));
    [ours, base, theirs].forEach((contents, index) => writeFileSync(files[index], contents));
    const result = spawnSync('git', ['merge-file', '-p', ...files], { encoding: 'buffer' });
    if (result.error || result.status === null || result.status > 0) return null;
    return result.stdout;
  } catch {
    return null;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function applyActions({ actions, root, kitRoot, config, manifest, payload, lock, dryRun }) {
  const version = lock.kit.version;
  const files = lock.byPath || new Map();
  const results = [];
  const bytes = (path) => readFileSync(join(kitRoot, path));

  const record = (action, patch) => {
    files.set(action.path, {
      path: action.path,
      dest: action.dest,
      class: action.class,
      ...(action.unit ? { unit: action.unit } : {}),
      version,
      ...patch,
    });
  };

  for (const action of actions) {
    let kind = action.kind;

    if (kind === 'ADD' || kind === 'UPDATE') {
      const source = bytes(action.path);
      let contents = source;
      if (isRendered(action.path)) {
        contents = Buffer.from(render(source.toString('utf8'), { path: action.path, config, manifest, payload }));
      } else if (action.path.endsWith('.md')) {
        contents = Buffer.from(relink(source.toString('utf8'), { path: action.path, config, manifest }));
      }
      if (!dryRun) {
        write(join(root, action.dest), contents);
        if (config.baseline) write(baselinePath(root, config, action.path), source);
      }
      const written = sha256(contents);
      record(action, {
        status: 'ok',
        base: action.next,
        hash: written,
        ...(action.spec ? { spec: action.spec, specHash: sha256(bytes(action.spec)) } : {}),
      });
    } else if (kind === 'CONFLICT') {
      const theirs = bytes(action.path).toString('utf8');
      const ours = readFileSync(join(root, action.dest), 'utf8');
      const base = config.baseline && action.base
        ? tryRead(baselinePath(root, config, action.path))
        : null;
      const merged = base ? merge3(ours, base, theirs) : null;

      if (merged) {
        if (!dryRun) {
          write(join(root, action.dest), merged);
          if (config.baseline) write(baselinePath(root, config, action.path), theirs);
        }
        kind = 'MERGED';
        record(action, { status: 'ok', base: action.next, hash: sha256(merged) });
      } else {
        const proposal = join(root, PROPOSAL_DIR, action.dest);
        if (!dryRun) {
          write(proposal, theirs);
          if (base) write(`${proposal}.base`, base);
        }
        action.proposal = join(PROPOSAL_DIR, action.dest);
        action.hasBase = Boolean(base);
        record(action, { status: 'modified', base: action.base, hash: action.cur });
      }
    } else if (kind === 'TOMBSTONE') {
      record(action, { status: 'deleted', base: action.base, hash: null });
    } else if (kind === 'CONVERGE') {
      record(action, { status: 'ok', base: action.next, hash: action.next });
      if (!dryRun && config.baseline) write(baselinePath(root, config, action.path), bytes(action.path));
    } else if (kind === 'KEEP') {
      record(action, { status: 'modified', base: action.base, hash: action.cur });
    } else if (['NOOP', 'OWNED', 'STALE', 'MISSING', 'UNIT_HELD', 'SKIP'].includes(kind)) {
      const previous = lock.byPath?.get(action.path);
      if (previous) files.set(action.path, { ...previous, version: previous.version || version });
      else if (kind !== 'SKIP') {
        record(action, {
          status: action.class === 'generated-once' ? 'owned' : 'seeded',
          base: action.next,
          hash: action.cur,
          ...(action.spec ? { spec: action.spec, specHash: sha256(bytes(action.spec)) } : {}),
        });
      }
    } else if (kind === 'DROPPED') {
      files.delete(action.path);
    }

    results.push({ ...action, kind });
  }

  return { results, lock: { ...lock, byPath: files } };
}

function tryRead(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

export { baselinePath, write };
