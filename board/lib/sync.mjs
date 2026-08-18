// The one place where task files, history, and the queue are reconciled.
// Task files stay the source of truth; history is derived from them and never
// contradicts them.
import { config } from './config.mjs';
import { createTask, findTask, listTasks, updateTask } from './taskfile.mjs';
import {
  appendEvent, enqueue, lastRecordedBlocker, lastRecordedState, pendingQueue,
  readEvents, readQueue,
} from './store.mjs';
import { decorate, nextWave } from './graph.mjs';

/**
 * Records anything that changed on disk without going through the board — an
 * agent editing a task file directly is the normal case, not an exception.
 */
export function syncHistory() {
  let events = readEvents();
  let appended = false;

  for (const task of listTasks()) {
    const recorded = lastRecordedState(events, task.id);
    if (recorded === undefined) {
      appendEvent({ task: task.id, type: 'created', to: task.state, actor: 'file', note: task.title });
      appended = true;
    } else if (recorded !== task.state) {
      appendEvent({ task: task.id, type: 'state', from: recorded, to: task.state, actor: 'file' });
      appended = true;
    }

    const recordedBlocker = lastRecordedBlocker(events, task.id);
    if ((task.blocker || '') !== recordedBlocker) {
      appendEvent(
        task.blocker
          ? { task: task.id, type: 'blocked', note: task.blocker, actor: 'file' }
          : { task: task.id, type: 'unblocked', actor: 'file' },
      );
      appended = true;
    }

    if (appended) events = readEvents();
  }

  return events;
}

export function snapshot() {
  const events = syncHistory();
  const tasks = decorate(listTasks());
  const queue = readQueue();

  return {
    generatedAt: new Date().toISOString(),
    states: config.states,
    parallelismCap: config.parallelismCap,
    tasksDir: config.tasksDir,
    root: config.root,
    tasks,
    queue,
    pending: queue.filter((item) => item.status === 'pending'),
    suggestedWave: nextWave(tasks).map((task) => task.id),
    events: events.slice(-500),
  };
}

export function story(taskId) {
  const events = syncHistory();
  const task = findTask(taskId);
  if (!task) throw new Error(`unknown task: ${taskId}`);
  return {
    task: decorate(listTasks()).find((candidate) => candidate.id === taskId),
    events: events.filter((event) => event.task === taskId),
  };
}

export function moveTask(id, state, { actor = 'human', note = '', wave, branch } = {}) {
  const before = findTask(id);
  if (!before) throw new Error(`unknown task: ${id}`);
  const target = String(state || '').toUpperCase();
  if (!config.states.includes(target)) throw new Error(`unknown state: ${state}`);

  const after = updateTask(id, { state: target, wave, branch });
  if (before.state !== target || wave !== undefined || branch !== undefined) {
    appendEvent({
      task: id, type: 'state', from: before.state, to: after.state, actor, note,
      wave: after.wave || undefined, branch: after.branch || undefined,
    });
  }
  return after;
}

export function setBlocker(id, blocker, { actor = 'human' } = {}) {
  const task = updateTask(id, { blocker });
  appendEvent(
    blocker
      ? { task: id, type: 'blocked', note: blocker, actor }
      : { task: id, type: 'unblocked', actor },
  );
  return task;
}

export function note(id, text, { actor = 'human', type = 'note', ref } = {}) {
  if (!findTask(id)) throw new Error(`unknown task: ${id}`);
  return appendEvent({ task: id, type, note: text, actor, ref });
}

export function addTask(input, { actor = 'human' } = {}) {
  const task = createTask(input);
  appendEvent({ task: task.id, type: 'created', to: task.state, actor, note: task.title });
  return task;
}

export function request({ type, target = '', note: text = '', requestedBy = 'human' }) {
  const item = enqueue({ type, target, note: text, requestedBy });
  if (target && findTask(target)) {
    appendEvent({ task: target, type: 'queued', actor: requestedBy, note: `/${type}${text ? ` — ${text}` : ''}` });
  }
  return item;
}

export { pendingQueue };
