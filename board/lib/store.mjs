// Append-only history and agent request queue, both JSONL under config.dataDir.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './config.mjs';

const readLines = (path) => {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

const append = (path, record) => {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(record)}\n`);
  return record;
};

export const now = () => new Date().toISOString();

/**
 * Event types: created | state | dispatch | blocked | unblocked | review | note
 * Shape: { ts, task, type, from, to, actor, note, wave, branch, ref }
 */
export const readEvents = () => readLines(config.eventsFile);

export const appendEvent = (event) =>
  append(config.eventsFile, { ts: now(), actor: 'board', ...event });

export const eventsFor = (taskId) => readEvents().filter((event) => event.task === taskId);

/** Last state the history recorded for a task, or undefined if it has no history yet. */
export function lastRecordedState(events, taskId) {
  let state;
  for (const event of events) {
    if (event.task === taskId && (event.type === 'state' || event.type === 'created') && event.to) {
      state = event.to;
    }
  }
  return state;
}

export function lastRecordedBlocker(events, taskId) {
  let blocker = '';
  for (const event of events) {
    if (event.task !== taskId) continue;
    if (event.type === 'blocked') blocker = event.note || 'blocked';
    if (event.type === 'unblocked') blocker = '';
  }
  return blocker;
}

/**
 * Queue records: { id, ts, type, target, note, requestedBy, status }
 * Status changes are appended as patches and folded in on read.
 */
export function readQueue() {
  const byId = new Map();
  for (const record of readLines(config.queueFile)) {
    if (!record.id) continue;
    byId.set(record.id, { ...(byId.get(record.id) || {}), ...record });
  }
  return [...byId.values()].sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
}

export const pendingQueue = () => readQueue().filter((item) => item.status === 'pending');

export function enqueue({ type, target = '', note = '', requestedBy = 'human' }) {
  if (!type) throw new Error('queue request needs a type');
  const id = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return append(config.queueFile, { id, ts: now(), type, target, note, requestedBy, status: 'pending' });
}

export function patchQueue(id, patch) {
  if (!readQueue().some((item) => item.id === id)) throw new Error(`unknown queue item: ${id}`);
  return append(config.queueFile, { id, updatedAt: now(), ...patch });
}
