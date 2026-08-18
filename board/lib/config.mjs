// Board configuration: defaults, config files, env overrides.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findRoot } from './gitroot.mjs';

const here = dirname(fileURLToPath(import.meta.url)); // board/lib
export const boardDir = resolve(here, '..');          // board

export const STATES = [
  'BACKLOG', 'READY', 'IN_PROGRESS', 'REVIEW', 'TESTING', 'DONE', 'RELEASED',
];

export const DEFAULTS = {
  tasksDir: 'tasks',
  roadmap: 'ROADMAP.md',
  taskTemplate: 'templates/task-template.md',
  dataDir: '.devos',
  port: 4317,
  parallelismCap: 3,
  idPrefix: 'T',
  idPad: 0,
};

export { findRoot };

function fileConfig(path) {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    console.warn(`board: ignoring invalid ${path} (${err.message})`);
    return {};
  }
}

const root = resolve(process.env.DEVOS_ROOT || findRoot(boardDir));

// The project's own settings live outside the kit, so a kit update never clobbers them.
// `.devos` is the literal default here — dataDir cannot configure its own lookup.
const merged = {
  ...DEFAULTS,
  ...fileConfig(join(boardDir, 'board.config.json')),
  ...fileConfig(join(root, '.devos', 'board.config.json')),
};
if (process.env.DEVOS_TASKS_DIR) merged.tasksDir = process.env.DEVOS_TASKS_DIR;
if (process.env.DEVOS_DATA_DIR) merged.dataDir = process.env.DEVOS_DATA_DIR;
if (process.env.PORT) merged.port = Number(process.env.PORT);

export const config = {
  ...merged,
  states: STATES,
  root,
  tasksPath: resolve(root, merged.tasksDir),
  dataPath: resolve(root, merged.dataDir),
  templatePath: resolve(root, merged.taskTemplate),
  roadmapPath: resolve(root, merged.roadmap),
  eventsFile: resolve(root, merged.dataDir, 'events.jsonl'),
  queueFile: resolve(root, merged.dataDir, 'queue.jsonl'),
};
