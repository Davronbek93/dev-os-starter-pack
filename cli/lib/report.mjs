// One screen that says what happened and what is left for a human to do.
import { GROUPS } from './plan.mjs';

const ORDER = [
  'UPDATE', 'ADD', 'MERGED', 'CONFLICT', 'UNIT_HELD', 'STALE', 'MISSING',
  'TOMBSTONE', 'DROPPED', 'KEEP',
];
const QUIET = new Set(['NOOP', 'OWNED', 'CONVERGE', 'SKIP']);

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function report(results, { from, to, root, config, verbose = false, dryRun = false }) {
  const lines = [];
  const grouped = new Map();
  for (const action of results) {
    if (!grouped.has(action.kind)) grouped.set(action.kind, []);
    grouped.get(action.kind).push(action);
  }

  const header = from === to ? `devos ${to}` : `devos ${from} → ${to}`;
  lines.push(`${header}${dryRun ? '  (dry run — nothing written)' : ''}`);
  lines.push(`destination ${root} (kit: ${config.kitDir}/, board: ${config.boardDir}/)`);

  for (const kind of ORDER) {
    const items = grouped.get(kind) || [];
    if (!items.length) continue;
    lines.push('', `${GROUPS[kind]} (${items.length})`);
    const shown = verbose || items.length <= 8 ? items : items.slice(0, 6);
    for (const action of shown) {
      lines.push(`  ${action.dest}${action.reason ? `   ${action.reason}` : ''}`);
      if (kind === 'CONFLICT') {
        lines.push(`      new    ${action.proposal}`);
        if (action.hasBase) {
          lines.push(`      merge  git merge-file ${action.dest} ${action.proposal}.base ${action.proposal}`);
        } else {
          lines.push('      note   no baseline for this file — diff it by hand');
        }
        if (action.entry?.couples) {
          lines.push(`      ⚠ coupled to ${action.entry.couples.join(', ')} — ${action.entry.note}`);
        }
      }
      if (kind === 'STALE') lines.push(`      spec   ${action.spec} changed`);
      if (kind === 'MISSING') lines.push(`      restore  devos restore ${action.path}`);
    }
    if (shown.length < items.length) lines.push(`  … ${items.length - shown.length} more (--verbose to list)`);
  }

  const quiet = results.filter((action) => QUIET.has(action.kind)).length;
  if (quiet) lines.push('', `unchanged (${quiet})`);

  const conflicts = (grouped.get('CONFLICT') || []).length;
  const stale = (grouped.get('STALE') || []).length;
  lines.push('');
  if (conflicts) lines.push(`next: merge ${plural(conflicts, 'file')}, then run devos status`);
  else if (stale) lines.push(`note: ${plural(stale, 'executable form')} are behind their spec — you own them`);
  else lines.push('clean.');

  return lines.join('\n');
}
