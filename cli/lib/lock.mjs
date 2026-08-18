// devos.lock.json — what was installed, and what it looked like when it was.
//
// Two hashes per file: `base` is the kit's bytes at the locked version, `hash` is
// what was written to disk. One hash cannot tell "you edited it" from "upstream
// changed it"; two make every update decision local and offline.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const LOCK_FILE = 'devos.lock.json';

export const lockPath = (root) => join(root, LOCK_FILE);

export const hasLock = (root) => existsSync(lockPath(root));

export function readLock(root) {
  if (!hasLock(root)) return null;
  const lock = JSON.parse(readFileSync(lockPath(root), 'utf8'));
  lock.byPath = new Map((lock.files || []).map((file) => [file.path, file]));
  return lock;
}

export function writeLock(root, lock) {
  const files = [...(lock.byPath?.values() || lock.files || [])]
    .sort((a, b) => a.path.localeCompare(b.path));
  const out = {
    lockfileVersion: 1,
    kit: lock.kit,
    config: lock.config,
    files,
  };
  writeFileSync(lockPath(root), `${JSON.stringify(out, null, 2)}\n`);
  return out;
}

export const entryFor = (lock, path) => lock?.byPath?.get(path) || null;
