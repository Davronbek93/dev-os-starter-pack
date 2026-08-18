// Content identity. Raw bytes, so markdown and UI assets behave the same.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const sha256 = (buffer) => `sha256-${createHash('sha256').update(buffer).digest('hex')}`;

export const hashFile = (path) => (existsSync(path) ? sha256(readFileSync(path)) : null);

/** Every file under `dir`, as paths relative to it, with `/` separators. */
export function walk(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, base, out);
    else out.push(relative(base, full).split(sep).join('/'));
  }
  return out;
}
