// Task markdown files are the source of truth (templates/task-template.md).
// This module reads them, and writes back only the fields the board owns.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config, STATES } from './config.mjs';

const PLACEHOLDER = /^<.*>$/;
const EMPTY_MARK = /^([—–-]+|none|n\/a|tbd|_none_)$/i;

const clean = (value) => {
  const v = (value || '').trim();
  return !v || PLACEHOLDER.test(v) || EMPTY_MARK.test(v) ? '' : v;
};

export const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

function headerFields(text) {
  const firstSection = text.search(/^##\s/m);
  const head = firstSection === -1 ? text : text.slice(0, firstSection);
  const fields = {};
  for (const [, key, value] of head.matchAll(/^-[ \t]*\*\*(.+?):\*\*[ \t]*(.*)$/gm)) {
    fields[key.trim().toLowerCase()] = clean(value);
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

const bullets = (section) =>
  (section || '')
    .split('\n')
    .map((line) => line.match(/^-\s+(?!\[[ xX]\])(.*)$/))
    .filter(Boolean)
    .map((m) => clean(m[1].replace(/`/g, '')))
    .filter(Boolean);

const criteria = (section) =>
  (section || '')
    .split('\n')
    .map((line) => line.match(/^-\s+\[([ xX])\]\s*(.*)$/))
    .filter(Boolean)
    .map((m) => ({ done: m[1].toLowerCase() === 'x', text: clean(m[2]) }))
    .filter((c) => c.text);

const normalizeState = (value) => {
  const state = (value || '').toUpperCase().replace(/[\s-]+/g, '_');
  return STATES.includes(state) ? state : STATES[0];
};

export function parseTask(text, file) {
  const fields = headerFields(text);
  const parts = sections(text);
  const title = clean((text.match(/^#\s*Task:\s*(.+)$/m) || [, ''])[1]) ||
    clean((text.match(/^#\s+(.+)$/m) || [, ''])[1].replace(/^Task:\s*/i, '')) ||
    file.replace(/\.md$/, '');
  const blocker = clean((parts.blocker || '').trim());

  return {
    id: fields.id || file.replace(/\.md$/, ''),
    file,
    title,
    role: fields.role || '',
    state: normalizeState(fields.state),
    milestone: fields.milestone || '',
    wave: fields.wave || '',
    branch: fields.branch || '',
    goal: (parts.goal || '').trim(),
    context: (parts.context || '').trim(),
    criteria: criteria(parts['acceptance criteria']),
    touches: bullets(parts.touches),
    dependencies: bullets(parts.dependencies).map((line) => line.split(/\s+[—–-]\s+/)[0].trim()),
    outOfScope: (parts['out of scope'] || '').trim(),
    notes: (parts.notes || '').trim(),
    blocker,
  };
}

export function listTasks() {
  if (!existsSync(config.tasksPath)) return [];
  return readdirSync(config.tasksPath)
    .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
    .sort()
    .map((file) => {
      try {
        return parseTask(readFileSync(join(config.tasksPath, file), 'utf8'), file);
      } catch (err) {
        return { id: file.replace(/\.md$/, ''), file, title: file, state: 'BACKLOG', error: err.message, criteria: [], touches: [], dependencies: [] };
      }
    });
}

export const findTask = (id) => listTasks().find((task) => task.id === id);

function setHeaderField(text, key, value) {
  const pattern = new RegExp(`^(-\\s*\\*\\*${key}:\\*\\*).*$`, 'mi');
  if (pattern.test(text)) return text.replace(pattern, `$1 ${value}`);
  // Field absent: append it to the end of the header block.
  const firstSection = text.search(/^##\s/m);
  const line = `- **${key}:** ${value}\n`;
  if (firstSection === -1) return `${text.trimEnd()}\n${line}`;
  return `${text.slice(0, firstSection).trimEnd()}\n${line}\n${text.slice(firstSection)}`;
}

function setSection(text, name, body) {
  const pattern = new RegExp(`^##\\s+${name}[ \\t]*$([\\s\\S]*?)(?=^##[ \\t]|$(?![\\s\\S]))`, 'mi');
  if (pattern.test(text)) return text.replace(pattern, `## ${name}\n\n${body}\n\n`);
  return `${text.trimEnd()}\n\n## ${name}\n\n${body}\n`;
}

/** Writes the board-owned fields back into the task file, leaving prose untouched. */
export function updateTask(id, changes) {
  const task = findTask(id);
  if (!task) throw new Error(`unknown task: ${id}`);
  const path = join(config.tasksPath, task.file);
  let text = readFileSync(path, 'utf8');

  if (changes.state) text = setHeaderField(text, 'State', normalizeState(changes.state));
  if (changes.wave !== undefined) text = setHeaderField(text, 'Wave', changes.wave);
  if (changes.branch !== undefined) text = setHeaderField(text, 'Branch', changes.branch);
  if (changes.blocker !== undefined) text = setSection(text, 'Blocker', changes.blocker || '_none_');

  writeFileSync(path, text);
  return findTask(id);
}

export function nextId(prefix = config.idPrefix) {
  const numbers = listTasks()
    .map((task) => task.id.match(/(\d+)\s*$/))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

const list = (items, fallback) =>
  items && items.length ? items.map((item) => `- ${item}`).join('\n') : fallback;

/** Creates a BACKLOG task file from templates/task-template.md. */
export function createTask(input) {
  const id = clean(input.id) || nextId();
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
