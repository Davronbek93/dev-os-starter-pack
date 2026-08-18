// Parsing and writing against the shapes real task corpora actually contain.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = mkdtempSync(join(tmpdir(), 'devos-board-'));
mkdirSync(join(root, 'tasks'));
cpSync(join(here, 'fixtures'), join(root, 'tasks'), { recursive: true });
process.env.DEVOS_ROOT = root;

const {
  parseTask, parseStateField, parseDependencyLine, setHeaderField, upsertSection,
  listTasks, updateTask, idTracks, nextId, splitId,
} = await import('../lib/taskfile.mjs');

const fixture = (name) => readFileSync(join(here, 'fixtures', name), 'utf8');
const task = (name) => parseTask(fixture(name), name);

test('state field keeps its leading token and its trailing prose', () => {
  const done = parseStateField('DONE (review APPROVE 2026-08-13, merged to dev)');
  assert.equal(done.state, 'DONE');
  assert.equal(done.stateNote, '(review APPROVE 2026-08-13, merged to dev)');
  assert.equal(done.ok, true);

  assert.equal(parseStateField('BACKLOG (READY when PH-2 + PH-3 merge)').state, 'BACKLOG');
  assert.equal(parseStateField('IN PROGRESS').state, 'IN_PROGRESS');
  assert.equal(parseStateField('in-progress').state, 'IN_PROGRESS');
  assert.equal(parseStateField('  REVIEW  ').state, 'REVIEW');
  assert.equal(parseStateField('').ok, true);
  assert.equal(parseStateField('BACKLOG | READY | IN_PROGRESS').state, 'BACKLOG');

  const unknown = parseStateField('WAITING ON PRODUCT');
  assert.equal(unknown.state, 'BACKLOG');
  assert.equal(unknown.ok, false);
});

test('dependency lines yield ids, ranges, and external prose', () => {
  assert.deepEqual(parseDependencyLine('- AI-5, AI-6 — the running feature.').ids, ['AI-5', 'AI-6']);
  assert.deepEqual(parseDependencyLine('- PH-2 — shared schemas merged.').ids, ['PH-2']);
  assert.deepEqual(parseDependencyLine('- P8-4..P8-17 — the phase they close.').ids.length, 14);
  assert.deepEqual(parseDependencyLine('- L2-1..L2-3 — groundwork.').ids, ['L2-1', 'L2-2', 'L2-3']);
  assert.deepEqual(parseDependencyLine('- SV-5b — the write surface.').ids, ['SV-5b']);
  assert.deepEqual(parseDependencyLine('- SV-6 + a production release').ids, ['SV-6']);

  for (const none of ['- None.', '- None (independent defect).', '- —', '- n/a']) {
    const parsed = parseDependencyLine(none);
    assert.deepEqual(parsed.ids, [], none);
    assert.equal(parsed.external, '', none);
  }

  const external = parseDependencyLine('- OQ-AI-3 — a billing-backed API key (human action).');
  assert.deepEqual(external.ids, []);
  assert.match(external.external, /billing-backed/);
});

test('a task carries canonical role and wave plus their original labels', () => {
  const sv = task('state-prose-done.md');
  assert.equal(sv.id, 'SV-5b');
  assert.equal(sv.state, 'DONE');
  assert.equal(sv.role, 'backend');
  assert.equal(sv.roleLabel, 'backend (agent: backend-engineer)');
  assert.equal(sv.wave, '4');
  assert.match(sv.waveNote, /^\(the wave after/);
  assert.equal(sv.branch, 'feat/api-sv-crm-catalog-write');

  assert.equal(task('deps-messy.md').role, 'tester');
});

test('dependencies split into known ids and external prose', () => {
  const gate = task('deps-messy.md');
  assert.ok(gate.dependencies.includes('AI-5') && gate.dependencies.includes('AI-6'));
  assert.ok(gate.dependencies.includes('P8-17'));
  assert.ok(gate.dependencies.includes('SV-99'));
  assert.ok(!gate.dependencies.some((id) => /None/i.test(id)));
  assert.equal(gate.externalDeps.length, 1);
});

test('a blocker written into Notes prose is not a blocker', () => {
  assert.equal(task('blocker-notes-history.md').blocker, '');
  assert.equal(task('body-bold-keys.md').blocker, '');
});

test('non-task files are not tasks', () => {
  assert.equal(parseTask(fixture('README.md'), 'README.md').isTask, false);
  const ids = listTasks().map((entry) => entry.id);
  assert.ok(!ids.includes('README'));
  assert.equal(ids.length, 6);
});

test('header writes stay inside the header block', () => {
  const text = fixture('body-bold-keys.md');
  const written = setHeaderField(text, 'Branch', 'feat/api-def-5');
  assert.match(written, /^- \*\*Branch:\*\* feat\/api-def-5$/m);
  // the body bullet that looks like a header field must be untouched
  assert.ok(written.includes('- **Branch:** feat/api-def-5-redact was considered and rejected.'));
  assert.equal(written.match(/^- \*\*Branch:\*\*/gm).length, 2);
});

test('header writes do not run the value through $-substitution', () => {
  const written = setHeaderField(fixture('state-prose-done.md'), 'Branch', 'feat/$&-literal');
  assert.match(written, /^- \*\*Branch:\*\* feat\/\$&-literal$/m);
});

test('a section is inserted before Notes, not after trailing history', () => {
  const written = upsertSection(fixture('blocker-notes-history.md'), 'Blocker', 'waiting on the KMS decision');
  assert.ok(written.indexOf('## Blocker') < written.indexOf('## Notes'));
  assert.ok(written.indexOf('## Notes') < written.indexOf('## Review round 1'));
  assert.equal(parseTask(written, 'x.md').blocker, 'waiting on the KMS decision');
});

test('writing state changes exactly one line and nothing else', () => {
  for (const entry of listTasks()) {
    const before = readFileSync(join(root, 'tasks', entry.file), 'utf8').split('\n');
    updateTask(entry.id, { state: 'TESTING' });
    const after = readFileSync(join(root, 'tasks', entry.file), 'utf8').split('\n');
    assert.equal(before.length, after.length, entry.file);
    const changed = before.map((line, i) => (line === after[i] ? null : i)).filter((i) => i !== null);
    assert.deepEqual(changed.length, 1, `${entry.file}: ${changed.length} lines changed`);
    assert.match(after[changed[0]], /^- \*\*State:\*\* TESTING$/);
  }
});

test('re-writing the state it already has leaves the file byte-identical', () => {
  const entry = listTasks().find((candidate) => candidate.id === 'SV-5b');
  const path = join(root, 'tasks', entry.file);
  const before = readFileSync(path, 'utf8');
  updateTask(entry.id, { state: entry.state });
  assert.equal(readFileSync(path, 'utf8'), before);
});

test('an explicit wave write normalizes the field and drops its prose', () => {
  const entry = listTasks().find((candidate) => candidate.id === 'SV-5b');
  updateTask(entry.id, { wave: entry.wave, branch: entry.branch });
  const text = readFileSync(join(root, 'tasks', entry.file), 'utf8');
  assert.match(text, /^- \*\*Wave:\*\* 4$/m);
  assert.match(text, /^- \*\*Branch:\*\* feat\/api-sv-crm-catalog-write$/m);
});

test('ids are generated per track, without padding', () => {
  assert.deepEqual(splitId('SV-5b'), { track: 'SV', number: 5, suffix: 'b' });
  assert.equal(splitId('README'), null);

  const tracks = idTracks();
  assert.equal(tracks.get('SV'), 5);
  assert.equal(tracks.get('P8'), 16);
  assert.equal(nextId('SV'), 'SV-6');
  assert.equal(nextId('ph'), 'PH-5');
  assert.equal(nextId('NEW'), 'NEW-1');
  assert.throws(() => nextId('not a track'));
});
