// Board configuration: defaults, config files, env overrides.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

/**
 * The **main** worktree of the repo containing `start`.
 *
 * In a linked worktree `.git` is a file holding `gitdir: <repo>/.git/worktrees/<name>`,
 * and that directory's `commondir` points back at the shared `.git` — whose parent is
 * the main checkout. Resolving there keeps one board for the whole repo instead of one
 * per worktree (docs/18-Board.md).
 */
export function findRoot(start) {
  let dir = resolve(start);
  for (;;) {
    const dot = join(dir, '.git');
    if (existsSync(dot)) {
      try {
        if (statSync(dot).isDirectory()) return dir;
        const gitdir = (readFileSync(dot, 'utf8').match(/^gitdir:\s*(.+)$/m) || [])[1];
        if (gitdir) {
          const worktree = resolve(dir, gitdir.trim());
          const commondir = join(worktree, 'commondir');
          const common = existsSync(commondir)
            ? resolve(worktree, readFileSync(commondir, 'utf8').trim())
            : worktree;
          const main = dirname(common);
          if (existsSync(join(main, '.git'))) return main;
        }
      } catch {
        // Unreadable .git (submodule, permissions): this directory is the best answer.
      }
      return dir;
    }
    const up = dirname(dir);
    if (up === dir) return resolve(start);
    dir = up;
  }
}

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
