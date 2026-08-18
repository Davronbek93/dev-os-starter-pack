import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decorate, nextWave, touchesOverlap } from '../lib/graph.mjs';

const task = (id, state, dependencies = [], touches = ['src/' + id]) =>
  ({ id, state, dependencies, touches, criteria: [], blocker: '' });

test('overlapping touches are detected through directories', () => {
  assert.equal(touchesOverlap({ touches: ['apps/api'] }, { touches: ['apps/api/src/users'] }), true);
  assert.equal(touchesOverlap({ touches: ['apps/api'] }, { touches: ['apps/crm'] }), false);
});

test('a task without Touches is not dispatchable', () => {
  const [withTouches, without] = decorate([task('A', 'READY'), task('B', 'READY', [], [])]);
  assert.equal(withTouches.needsTouches, false);
  assert.equal(withTouches.dispatchable, true);
  assert.equal(without.needsTouches, true);
  assert.equal(without.dispatchable, false, 'an empty Touches set is not a disjointness proof');
  assert.deepEqual(nextWave([withTouches, without]).map((t) => t.id), ['A']);
});

test('waves are topological levels and siblings must be disjoint', () => {
  const tasks = decorate([
    task('T1', 'DONE'), task('T2', 'READY', ['T1'], ['b/x']),
    task('T3', 'READY', ['T1'], ['b']), task('T4', 'READY', ['T2', 'T3']),
  ]);
  assert.deepEqual(tasks.map((t) => t.computedWave), [0, 1, 1, 2]);
  assert.deepEqual(tasks.find((t) => t.id === 'T4').blockedBy, ['T2', 'T3']);
  assert.deepEqual(nextWave(tasks).map((t) => t.id), ['T2'], 'T3 overlaps T2');
});

test('an unknown dependency keeps a task blocked', () => {
  const [only] = decorate([task('T1', 'READY', ['GONE-9'])]);
  assert.deepEqual(only.unknownDeps, ['GONE-9']);
  assert.deepEqual(only.blockedBy, ['GONE-9']);
  assert.equal(only.dispatchable, false);
});

test('a dependency cycle does not hang', () => {
  const tasks = decorate([task('A', 'READY', ['B']), task('B', 'READY', ['A'])]);
  assert.ok(tasks.every((t) => t.computedWave === -1 || Number.isFinite(t.computedWave)));
});

test('a blocked task is never dispatchable', () => {
  const [blocked] = decorate([{ ...task('A', 'READY'), blocker: 'waiting on a decision' }]);
  assert.equal(blocked.dispatchable, false);
});
