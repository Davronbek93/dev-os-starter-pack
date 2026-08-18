// devos.config.json — the project's own facts. Written by `install`, read by
// everything else, never rewritten by `update`.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const CONFIG_FILE = 'devos.config.json';

export const DEFAULTS = {
  kitDir: 'devos',
  claudeDir: '.claude',
  boardDir: 'board',
  tasksDir: 'tasks',
  roadmap: 'ROADMAP.md',
  conventionsDoc: '',
  dataDir: '.devos',
  integrationBranch: 'main',
  branchPattern: 'feature/<task-slug>',
  serializationPoints: [],
  parallelismCap: 3,
  baseline: true,
  pathOverrides: {},
  generatedFrom: {},
};

const FLAGS = {
  'kit-dir': 'kitDir',
  'claude-dir': 'claudeDir',
  'board-dir': 'boardDir',
  'tasks-dir': 'tasksDir',
  roadmap: 'roadmap',
  conventions: 'conventionsDoc',
  'data-dir': 'dataDir',
  branch: 'integrationBranch',
  'branch-pattern': 'branchPattern',
  parallelism: 'parallelismCap',
};

export const configPath = (root) => join(root, CONFIG_FILE);

export const hasConfig = (root) => existsSync(configPath(root));

export function readConfig(root) {
  if (!hasConfig(root)) return null;
  return { ...DEFAULTS, ...JSON.parse(readFileSync(configPath(root), 'utf8')) };
}

/** Flags win over the file, the file wins over defaults. */
export function resolveConfig(root, flags = {}) {
  const config = { ...DEFAULTS, ...(readConfig(root) || {}) };
  for (const [flag, key] of Object.entries(FLAGS)) {
    if (flags[flag] !== undefined && flags[flag] !== true) config[key] = flags[flag];
  }
  if (flags['serialization-points'] && flags['serialization-points'] !== true) {
    config.serializationPoints = String(flags['serialization-points'])
      .split(',').map((point) => point.trim()).filter(Boolean);
  }
  if (flags['no-baseline']) config.baseline = false;
  config.parallelismCap = Number(config.parallelismCap) || DEFAULTS.parallelismCap;
  return config;
}

export function writeConfig(root, config) {
  const ordered = Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, config[key]]));
  writeFileSync(configPath(root), `${JSON.stringify(ordered, null, 2)}\n`);
  return ordered;
}
