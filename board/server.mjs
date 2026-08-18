#!/usr/bin/env node
// DevOS Board — a local, zero-dependency Kanban view over the task files.
// Run: node board/server.mjs   (binds to 127.0.0.1 only)
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { config, boardDir } from './lib/config.mjs';
import { addTask, moveTask, request, setBlocker, snapshot, story, note } from './lib/sync.mjs';
import { patchQueue } from './lib/store.mjs';

const uiDir = join(boardDir, 'ui');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const clients = new Set();

const send = (res, status, body, headers = {}) => {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(payload);
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) reject(new Error('body too large'));
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('invalid JSON body'));
      }
    });
    req.on('error', reject);
  });

function serveStatic(res, pathname) {
  const file = join(uiDir, normalize(pathname === '/' ? '/index.html' : pathname).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(uiDir) || !existsSync(file)) return send(res, 404, { error: 'not found' });
  res.writeHead(200, { 'content-type': `${MIME[extname(file)] || 'application/octet-stream'}; charset=utf-8`, 'cache-control': 'no-store' });
  res.end(readFileSync(file));
}

let lastSignature = '';
function broadcast(force = false) {
  const data = snapshot();
  const signature = JSON.stringify([
    data.tasks.map((t) => [t.id, t.state, t.wave, t.branch, t.blocker, t.progress]),
    data.queue.map((q) => [q.id, q.status]),
  ]);
  if (!force && signature === lastSignature) return;
  lastSignature = signature;
  const frame = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) client.write(frame);
}

const routes = [
  ['GET', /^\/api\/board$/, () => snapshot()],
  ['GET', /^\/api\/tasks\/([^/]+)$/, (_body, [id]) => story(decodeURIComponent(id))],
  ['POST', /^\/api\/tasks$/, (body) => addTask(body, { actor: body.actor || 'human' })],
  ['POST', /^\/api\/tasks\/([^/]+)\/state$/, (body, [id]) =>
    moveTask(decodeURIComponent(id), body.state, body)],
  ['POST', /^\/api\/tasks\/([^/]+)\/blocker$/, (body, [id]) =>
    setBlocker(decodeURIComponent(id), body.blocker || '', body)],
  ['POST', /^\/api\/tasks\/([^/]+)\/note$/, (body, [id]) =>
    note(decodeURIComponent(id), body.note || '', body)],
  ['POST', /^\/api\/queue$/, (body) => request(body)],
  ['POST', /^\/api\/queue\/([^/]+)$/, (body, [id]) => patchQueue(decodeURIComponent(id), body)],
];

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const { pathname } = url;

  if (pathname === '/api/stream') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
    res.write(`data: ${JSON.stringify(snapshot())}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  const route = routes.find(([method, pattern]) => method === req.method && pattern.test(pathname));
  if (route) {
    try {
      const params = pathname.match(route[1]).slice(1);
      const body = req.method === 'POST' ? await readBody(req) : {};
      const result = await route[2](body, params);
      if (req.method === 'POST') broadcast(true);
      return send(res, 200, result ?? { ok: true });
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
  }

  if (req.method === 'GET' && !pathname.startsWith('/api/')) return serveStatic(res, pathname);
  return send(res, 404, { error: 'not found' });
});

const poll = setInterval(() => {
  try {
    broadcast();
  } catch (err) {
    console.error(`board: poll failed — ${err.message}`);
  }
}, 1500);
poll.unref?.();

server.listen(config.port, '127.0.0.1', () => {
  console.log(`DevOS Board  →  http://127.0.0.1:${config.port}`);
  console.log(`  root       ${config.root}`);
  console.log(`  tasks      ${config.tasksDir}/`);
  console.log(`  history    ${config.dataDir}/events.jsonl`);
  console.log(`  queue      ${config.dataDir}/queue.jsonl  (drain it with /board in Claude Code)`);
});
