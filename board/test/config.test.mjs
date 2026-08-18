import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { findRoot } from '../lib/config.mjs';

/** A main checkout with one linked worktree, laid out exactly as git does it. */
function fakeRepo() {
  const base = mkdtempSync(join(tmpdir(), 'devos-wt-'));
  const main = join(base, 'project');
  const linked = join(base, 'project-sv10');
  mkdirSync(join(main, '.git', 'worktrees', 'project-sv10'), { recursive: true });
  mkdirSync(join(linked, 'apps', 'api'), { recursive: true });
  writeFileSync(join(main, '.git', 'HEAD'), 'ref: refs/heads/dev\n');
  writeFileSync(join(main, '.git', 'worktrees', 'project-sv10', 'commondir'), '../..\n');
  writeFileSync(join(linked, '.git'), `gitdir: ${join(main, '.git', 'worktrees', 'project-sv10')}\n`);
  return { main, linked };
}

test('the main worktree is the root, from anywhere', () => {
  const { main, linked } = fakeRepo();
  assert.equal(findRoot(main), main);
  assert.equal(findRoot(linked), main, 'a linked worktree resolves to the main checkout');
  assert.equal(findRoot(join(linked, 'apps', 'api')), main);
});

test('a directory outside any repo resolves to itself', () => {
  const loose = mkdtempSync(join(tmpdir(), 'devos-loose-'));
  assert.equal(findRoot(loose), loose);
});
