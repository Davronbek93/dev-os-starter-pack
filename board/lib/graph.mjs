// Dependency graph helpers: waves, readiness, and the Touches disjointness rule
// of docs/16-Concurrency-Model.md. Display only — dispatch decisions stay with
// the orchestrator.
import { config } from './config.mjs';

const SETTLED = new Set(['DONE', 'RELEASED']);
const IN_FLIGHT = new Set(['IN_PROGRESS', 'REVIEW', 'TESTING']);

const normalizePath = (path) => path.replace(/^\.\//, '').replace(/\/+$/, '');

const pathsOverlap = (a, b) => {
  const x = normalizePath(a);
  const y = normalizePath(b);
  return x === y || x.startsWith(`${y}/`) || y.startsWith(`${x}/`);
};

export const touchesOverlap = (a, b) =>
  a.touches.some((left) => b.touches.some((right) => pathsOverlap(left, right)));

/** Topological level: 0 for a task with no dependencies. Cycles report level -1. */
export function computeWaves(tasks) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const levels = new Map();
  const visiting = new Set();

  const level = (id) => {
    if (levels.has(id)) return levels.get(id);
    const task = byId.get(id);
    if (!task) return -Infinity; // unknown dependency: ignore in the max
    if (visiting.has(id)) {
      levels.set(id, -1);
      return -1;
    }
    visiting.add(id);
    const deps = task.dependencies.map(level).filter((value) => Number.isFinite(value));
    visiting.delete(id);
    const result = deps.length ? Math.max(...deps) + 1 : 0;
    levels.set(id, result);
    return result;
  };

  for (const task of tasks) level(task.id);
  return levels;
}

/** Annotates tasks with derived, board-only fields. Never written back to disk. */
export function decorate(tasks) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const waves = computeWaves(tasks);
  const inFlight = tasks.filter((task) => IN_FLIGHT.has(task.state));

  return tasks.map((task) => {
    const blockedBy = task.dependencies.filter((id) => {
      const dep = byId.get(id);
      return !dep || !SETTLED.has(dep.state);
    });
    const conflicts = inFlight
      .filter((other) => other.id !== task.id && touchesOverlap(task, other))
      .map((other) => other.id);

    return {
      ...task,
      computedWave: waves.get(task.id) ?? 0,
      blockedBy,
      dispatchable: task.state === 'READY' && blockedBy.length === 0 && !task.blocker,
      conflicts,
      progress: task.criteria.length
        ? Math.round((task.criteria.filter((c) => c.done).length / task.criteria.length) * 100)
        : null,
    };
  });
}

/**
 * The next safe wave: dispatchable tasks at the lowest wave level, filtered to a
 * pairwise-disjoint subset and capped at the parallelism limit. Advisory — the
 * orchestrator re-derives and owns the real decision.
 */
export function nextWave(decorated, cap = config.parallelismCap) {
  const candidates = decorated
    .filter((task) => task.dispatchable && task.conflicts.length === 0)
    .sort((a, b) => a.computedWave - b.computedWave || a.id.localeCompare(b.id));

  const wave = [];
  for (const task of candidates) {
    if (wave.length >= cap) break;
    if (wave.every((picked) => !touchesOverlap(picked, task))) wave.push(task);
  }
  return wave;
}
