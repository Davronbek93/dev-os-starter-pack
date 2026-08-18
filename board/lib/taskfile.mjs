// Task markdown files are the source of truth (templates/task-template.md).
// This module reads them, and writes back only the fields the board owns.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config, STATES } from './config.mjs';

const PLACEHOLDER = /^<.*>$/;
const EMPTY_MARK = /^([—–-]+|none|n\/a|tbd|_none_)$/i;
/** Task ids seen in the wild: T-1, P7-16, L2-3, SV-5b, DEF-5. */
export const TASK_ID = /^[A-Z][A-Z0-9]*-\d+[a-z]?$/;

const clean = (value) => {
  const v = (value || '').trim();
  return !v || PLACEHOLDER.test(v) || EMPTY_MARK.test(v) ? '' : v;
};

export const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const splitHeader = (text) => {
  const at = text.search(/^##\s/m);
  return at === -1 ? [text, ''] : [text.slice(0, at), text.slice(at)];
};

function headerFields(text) {
  const fields = {};
  for (const [, key, value] of splitHeader(text)[0].matchAll(/^-[ \t]*\*\*(.+?):\*\*[ \t]*(.*)$/gm)) {
    fields[key.trim().toLowerCase()] = value.trim();
  }
  return fields;
}

function sections(text) {
  const out = {};
  let name = null;
  let start = 0;
  for (const match of text.matchAll(/^##\s+(.+?)\s*$/gm)) {
    if (name !== null) out[name] = text.slice(start, match.index).trim();
    name = match[1].trim().toLowerCase();
    start = match.index + match[0].length;
  }
  if (name !== null) out[name] = text.slice(start).trim();
  return out;
}

const lines = (section) => (section || '').split('\n');

const bullets = (section) =>
  lines(section)
    .map((line) => line.match(/^-\s+(?!\[[ xX]\])(.*)$/))
    .filter(Boolean)
    .map((m) => clean(m[1].replace(/`/g, '')))
    .filter(Boolean);

const criteria = (section) =>
  lines(section)
    .map((line) => line.match(/^-\s+\[([ xX])\]\s*(.*)$/))
    .filter(Boolean)
    .map((m) => ({ done: m[1].toLowerCase() === 'x', text: clean(m[2]) }))
    .filter((c) => c.text);

/* ---------------------------------------------------------------- fields */

// No state is a prefix of another, so the first match is the only match.
const STATE_MATCH = STATES.map((state) =>
  [state, new RegExp(`^\\s*${state.replace(/_/g, '[ _-]')}\\b`, 'i')]);

/**
 * Real task files annotate the state: `DONE (review APPROVE 2026-08-13, merged to dev)`.
 * The token is the state; the rest is prose worth keeping.
 */
export function parseStateField(value) {
  const raw = String(value ?? '').trim();
  for (const [state, pattern] of STATE_MATCH) {
    const match = raw.match(pattern);
    if (match) return { state, stateNote: raw.slice(match[0].length).trim(), ok: true };
  }
  return { state: STATES[0], stateNote: raw, ok: !raw };
}

export const normalizeState = (value) => parseStateField(value).state;

const leadToken = (value) => (String(value || '').match(/^\s*([^\s(\[,;]+)/) || [, ''])[1];

/** `backend (agent: backend-engineer)` and `tester/reviewer (…)` are one role each. */
const canonRole = (value) =>
  String(value || '').split(/[(/+,]/)[0].trim().toLowerCase().replace(/-(engineer|architect)$/, '');

const NONE_DEP = /^(none|n\/a|tbd|_none_)\b|^[—–-]+\s*$/i;

/** One `## Dependencies` bullet → the task ids it names, or the prose it is instead. */
export function parseDependencyLine(line) {
  const text = String(line || '').replace(/^-\s+/, '').trim();
  const head = text.split(/\s+[—–]\s+|\s+--\s+/)[0];
  const ids = [];
  for (const part of head.split(/[,;]|\s+\+\s+|\s+and\s+/)) {
    const token = part.trim().replace(/^[`*]+|[`*.,;:]+$/g, '');
    if (!token) continue;
    const range = token.match(/^([A-Z][A-Z0-9]*-)(\d+)\.\.(?:[A-Z][A-Z0-9]*-)?(\d+)$/);
    if (range) {
      for (let n = Number(range[2]); n <= Number(range[3]); n += 1) ids.push(range[1] + n);
      continue;
    }
    if (TASK_ID.test(token)) ids.push(token);
  }
  const external = ids.length === 0 && !NONE_DEP.test(head.trim()) ? text : '';
  return { ids, external };
}

/* ---------------------------------------------------------------- parsing */

export function parseTask(text, file) {
  const fields = headerFields(text);
  const parts = sections(text);
  const title = clean((text.match(/^#\s*Task:\s*(.+)$/m) || [, ''])[1]) ||
    clean((text.match(/^#\s+(.+)$/m) || [, ''])[1].replace(/^Task:\s*/i, '')) ||
    file.replace(/\.md$/, '');

  const { state, stateNote, ok } = parseStateField(fields.state);
  const deps = lines(parts.dependencies)
    .filter((line) => /^-\s+/.test(line))
    .map(parseDependencyLine);

  return {
    id: clean(fields.id) || file.replace(/\.md$/, ''),
    file,
    title,
    isTask: Boolean(clean(fields.id)) || /^#\s*Task:/m.test(text),
    role: canonRole(clean(fields.role)),
    roleLabel: clean(fields.role),
    state,
    stateNote,
    stateUnknown: !ok,
    milestone: clean(fields.milestone),
    wave: leadToken(clean(fields.wave)),
    waveNote: clean(fields.wave).slice(leadToken(clean(fields.wave)).length).trim(),
    branch: clean(fields.branch).replace(/`/g, ''),
    goal: (parts.goal || '').trim(),
    context: (parts.context || '').trim(),
    criteria: criteria(parts['acceptance criteria']),
    touches: bullets(parts.touches),
    dependencies: [...new Set(deps.flatMap((dep) => dep.ids))],
    externalDeps: deps.map((dep) => dep.external).filter(Boolean),
    outOfScope: (parts['out of scope'] || '').trim(),
    notes: (parts.notes || '').trim(),
    blocker: clean(parts.blocker || '') || clean(fields.blocker),
  };
}

export function listTasks() {
  if (!existsSync(config.tasksPath)) return [];
  return readdirSync(config.tasksPath)
    .filter((file) => file.endsWith('.md') && !file.startsWith('_') && file !== 'README.md')
    .sort()
    .map((file) => {
      try {
        return parseTask(readFileSync(join(config.tasksPath, file), 'utf8'), file);
      } catch (err) {
        return {
          id: file.replace(/\.md$/, ''), file, title: file, state: STATES[0], isTask: true,
          error: err.message, criteria: [], touches: [], dependencies: [], externalDeps: [],
        };
      }
    })
    .filter((task) => task.isTask);
}

export const findTask = (id) => listTasks().find((task) => task.id === id);

/* ---------------------------------------------------------------- writing */

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Header fields are written only in the block above the first `##`: task bodies carry
 * bullets like `- **Blocker fixed:**` that must never be mistaken for a field.
 */
export function setHeaderField(text, key, value) {
  const [head, body] = splitHeader(text);
  const pattern = new RegExp(`^(-[ \\t]*\\*\\*${escapeRe(key)}:\\*\\*).*$`, 'mi');
  // A function replacer keeps `$&` and friends literal in the value.
  if (pattern.test(head)) return head.replace(pattern, (_, prefix) => `${prefix} ${value}`) + body;
  return `${head.trimEnd()}\n- **${key}:** ${value}\n${body ? `\n${body}` : ''}`;
}

/**
 * Writes a section, placing a new one before `## Notes` rather than at EOF — real task
 * files append review history after Notes, and a live blocker must not land under it.
 */
export function upsertSection(text, name, body, { before = 'Notes' } = {}) {
  const pattern = new RegExp(
    `^##\\s+${escapeRe(name)}[ \\t]*$([\\s\\S]*?)(?=^##[ \\t]|$(?![\\s\\S]))`, 'mi');
  const section = `## ${name}\n\n${body}\n\n`;
  if (pattern.test(text)) return text.replace(pattern, () => section);

  const anchor = text.search(new RegExp(`^##\\s+${escapeRe(before)}[ \\t]*$`, 'mi'));
  if (anchor !== -1) return `${text.slice(0, anchor)}${section}${text.slice(anchor)}`;
  return `${text.trimEnd()}\n\n${section.trimEnd()}\n`;
}

/** Writes the board-owned fields back into the task file, leaving prose untouched. */
export function updateTask(id, changes) {
  const task = findTask(id);
  if (!task) throw new Error(`unknown task: ${id}`);
  const path = join(config.tasksPath, task.file);
  let text = readFileSync(path, 'utf8');

  // Only a real transition rewrites the State line, so annotated states survive
  // wave and branch assignments untouched.
  if (changes.state && normalizeState(changes.state) !== task.state) {
    text = setHeaderField(text, 'State', normalizeState(changes.state));
  }
  if (changes.wave !== undefined) text = setHeaderField(text, 'Wave', changes.wave);
  if (changes.branch !== undefined) text = setHeaderField(text, 'Branch', changes.branch);
  if (changes.blocker !== undefined) {
    text = upsertSection(text, 'Blocker', changes.blocker || '_none_');
  }

  writeFileSync(path, text);
  return findTask(id);
}

/* ---------------------------------------------------------------- ids */

export const splitId = (id) => {
  const match = String(id).match(/^([A-Z][A-Z0-9]*)-(\d+)([a-z]?)$/);
  return match ? { track: match[1], number: Number(match[2]), suffix: match[3] } : null;
};

/** Highest number seen per track, discovered from the tasks themselves. */
export function idTracks(tasks = listTasks()) {
  const tracks = new Map();
  for (const task of tasks) {
    const parts = splitId(task.id);
    if (parts) tracks.set(parts.track, Math.max(tracks.get(parts.track) ?? 0, parts.number));
  }
  return tracks;
}

export function nextId(track = config.idPrefix) {
  const key = String(track || '').trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9]*$/.test(key)) throw new Error(`invalid id track: ${track}`);
  const number = (idTracks().get(key) ?? 0) + 1;
  return `${key}-${config.idPad ? String(number).padStart(config.idPad, '0') : number}`;
}

const list = (items, fallback) =>
  items && items.length ? items.map((item) => `- ${item}`).join('\n') : fallback;

/** Creates a BACKLOG task file shaped like templates/task-template.md. */
export function createTask(input) {
  const id = clean(input.id) || nextId(input.track || config.idPrefix);
  const title = (input.title || '').trim();
  if (!title) throw new Error('title is required');
  if (findTask(id)) throw new Error(`task ${id} already exists`);

  const file = `${id}-${slugify(title)}.md`;
  mkdirSync(config.tasksPath, { recursive: true });

  const text = `# Task: ${title}

- **ID:** ${id}
- **Role:** ${input.role || 'architect'}
- **State:** BACKLOG
- **Milestone:** ${input.milestone || '—'}
- **Wave:**
- **Branch:**

## Goal
${(input.goal || title).trim()}

## Context
${(input.context || 'To be filled in during refinement (/plan).').trim()}

## Acceptance criteria
${list((input.criteria || []).map((c) => `[ ] ${c}`), '- [ ] <to be filled in during refinement>')}

## Touches
${list(input.touches, '- <to be filled in during refinement>')}

## Dependencies
${list(input.dependencies, '- —')}

## Out of scope
${(input.outOfScope || '—').trim()}

## Blocker

_none_

## Notes
${(input.notes || '—').trim()}
`;

  writeFileSync(join(config.tasksPath, file), text);
  return parseTask(text, file);
}
