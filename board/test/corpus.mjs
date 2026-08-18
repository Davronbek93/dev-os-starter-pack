#!/usr/bin/env node
// Parses a real task directory and asserts what must hold for any corpus — invariants,
// not fixed counts. Read-only: it never writes a task file.
//
//   node board/test/corpus.mjs ~/Projects/some-project/docs/tasks
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const dir = resolve(process.argv[2] || 'tasks');
if (!existsSync(dir)) {
  console.error(`corpus: no such directory: ${dir}`);
  process.exit(1);
}
process.env.DEVOS_TASKS_DIR = dir;

const { listTasks, splitId } = await import('../lib/taskfile.mjs');
const { decorate } = await import('../lib/graph.mjs');

const tasks = decorate(listTasks());
const tally = (values) => values.reduce((acc, v) => ({ ...acc, [v]: (acc[v] || 0) + 1 }), {});
const problems = [];

const unknownState = tasks.filter((task) => task.stateUnknown);
const unknownDeps = tasks.filter((task) => task.unknownDeps.length);
const untracked = tasks.filter((task) => !splitId(task.id));
const parseErrors = tasks.filter((task) => task.error);

if (parseErrors.length) problems.push(`${parseErrors.length} file(s) failed to parse`);
if (unknownState.length) {
  problems.push(`${unknownState.length} unrecognized State value(s): ` +
    unknownState.slice(0, 5).map((t) => `${t.id}="${t.stateNote}"`).join(', '));
}
if (unknownDeps.length) {
  problems.push(`${unknownDeps.length} task(s) depend on ids with no file: ` +
    unknownDeps.slice(0, 5).map((t) => `${t.id}→${t.unknownDeps.join('/')}`).join(', '));
}

console.log(`corpus  ${dir}`);
console.log(`tasks   ${tasks.length}`);
console.log(`states  ${JSON.stringify(tally(tasks.map((t) => t.state)))}`);
console.log(`roles   ${JSON.stringify(tally(tasks.map((t) => t.role || '—')))}`);
console.log(`tracks  ${JSON.stringify(tally(tasks.map((t) => splitId(t.id)?.track || '—')))}`);
console.log(`touches ${tasks.filter((t) => !t.needsTouches).length} of ${tasks.length} declare a Touches set`);
console.log(`deps    ${tasks.reduce((n, t) => n + t.dependencies.length, 0)} resolved, ` +
  `${tasks.reduce((n, t) => n + t.externalDeps.length, 0)} external, ` +
  `${unknownDeps.reduce((n, t) => n + t.unknownDeps.length, 0)} unknown`);
console.log(`chips   ${tasks.filter((t) => t.needsTouches && ['BACKLOG', 'READY'].includes(t.state)).length} "needs Touches"`);
console.log(`wave    ${tasks.filter((t) => t.dispatchable).length} dispatchable`);
if (untracked.length) console.log(`note    ${untracked.length} id(s) outside the TRACK-N scheme: ${untracked.slice(0, 5).map((t) => t.id).join(', ')}`);

if (problems.length) {
  console.error(`\nproblems:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('\nok — every state token recognized, every dependency resolvable');
