// The decision table, as a pure function. Everything that makes update safe or
// dangerous is here, and nothing here touches the filesystem.
import { dest, specFor } from './manifest.mjs';

/**
 * @param onDisk    (destPath) => hash | null
 * @param upstream  (kitPath) => hash
 * Returns one action per payload path, plus tombstone actions for lock entries
 * whose file the project deleted.
 */
export function planActions({ payload, manifest, lock, config, onDisk, upstream }) {
  const actions = [];
  const seen = new Set();

  for (const { path, entry } of payload) {
    seen.add(path);
    const to = dest(path, config, manifest);
    const locked = lock?.byPath?.get(path) || null;
    const cur = onDisk(to);
    const next = upstream(path);
    const base = locked?.base ?? null;
    const recorded = locked?.hash ?? null;
    const common = {
      path, dest: to, class: entry.class, unit: entry.unit, entry, cur, next, base,
      spec: entry.class === 'generated-once' ? specFor(path, config, manifest) : null,
    };

    if (locked?.status === 'deleted') {
      actions.push({ ...common, kind: 'SKIP', reason: 'removed by you in an earlier run' });
      continue;
    }

    if (entry.class === 'generated-once') {
      if (cur === null) {
        actions.push({ ...common, kind: locked ? 'MISSING' : 'ADD' });
      } else if (common.spec && locked?.specHash && locked.specHash !== upstream(common.spec)) {
        actions.push({ ...common, kind: 'STALE' });
      } else {
        actions.push({ ...common, kind: 'OWNED' });
      }
      continue;
    }

    if (entry.class === 'template') {
      actions.push({ ...common, kind: cur === null ? 'ADD' : 'OWNED' });
      continue;
    }

    // managed and code
    if (!locked) {
      if (cur === null) actions.push({ ...common, kind: 'ADD' });
      else if (cur === next) actions.push({ ...common, kind: 'CONVERGE' });
      else actions.push({ ...common, kind: 'CONFLICT', reason: 'present but never installed by devos' });
      continue;
    }
    if (cur === null) {
      actions.push({ ...common, kind: 'TOMBSTONE', reason: 'removed by you' });
      continue;
    }
    if (cur === next) actions.push({ ...common, kind: 'CONVERGE' });
    else if (cur === recorded && next === base) actions.push({ ...common, kind: 'NOOP' });
    else if (cur === recorded) actions.push({ ...common, kind: 'UPDATE' });
    else if (next === base) actions.push({ ...common, kind: 'KEEP', reason: 'your edits, upstream unchanged' });
    else actions.push({ ...common, kind: 'CONFLICT', reason: 'changed on both sides' });
  }

  for (const file of lock?.files || []) {
    if (!seen.has(file.path) && file.status !== 'deleted') {
      actions.push({
        path: file.path, dest: file.dest, class: file.class, kind: 'DROPPED',
        reason: 'no longer shipped by the kit',
      });
    }
  }

  return withUnitAtomicity(actions);
}

/**
 * A code unit updates all-or-nothing: a half-updated `board/` imports functions that
 * no longer exist. If any member is held back, the whole unit is.
 */
function withUnitAtomicity(actions) {
  const blocked = new Set();
  for (const action of actions) {
    if (action.unit && ['CONFLICT', 'KEEP', 'TOMBSTONE'].includes(action.kind)) {
      blocked.add(action.unit);
    }
  }
  if (!blocked.size) return actions;
  return actions.map((action) => (
    action.unit && blocked.has(action.unit) && ['UPDATE', 'ADD', 'CONVERGE', 'NOOP'].includes(action.kind)
      ? { ...action, kind: 'UNIT_HELD', reason: `another file in ${action.unit}/ is modified` }
      : action));
}

export const GROUPS = {
  ADD: 'added',
  UPDATE: 'updated in place',
  MERGED: 'merged automatically',
  CONFLICT: 'needs manual merge',
  UNIT_HELD: 'held back — the unit is not atomic right now',
  KEEP: 'yours, upstream unchanged',
  STALE: 'executable forms now stale',
  MISSING: 'missing — you own these, restore if you want them back',
  TOMBSTONE: 'removed by you — recorded, will not be restored',
  DROPPED: 'no longer shipped by the kit',
  CONVERGE: 'already identical',
  NOOP: 'unchanged',
  OWNED: 'yours',
  SKIP: 'skipped',
};
