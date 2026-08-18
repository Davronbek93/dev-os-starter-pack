// Repository root resolution, shared by the board and the devos CLI.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

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
