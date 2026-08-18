// DevOS Board UI. The board never runs an agent itself: human actions either
// edit a task file or drop a request in the queue, which a Claude Code session
// drains with /board.
const $ = (selector) => document.querySelector(selector);
const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
};

const OWNER = {
  BACKLOG: 'you', READY: 'orchestrator', IN_PROGRESS: 'engineer',
  REVIEW: 'reviewer', TESTING: 'tester', DONE: 'orchestrator', RELEASED: 'devops',
};
const COLOR = {
  BACKLOG: 'var(--backlog)', READY: 'var(--ready)', IN_PROGRESS: 'var(--progress)',
  REVIEW: 'var(--review)', TESTING: 'var(--testing)', DONE: 'var(--done)', RELEASED: 'var(--released)',
};
const AGENT_ACTIONS = [
  ['plan', 'Refine / split', 'Architect turns this into DevOS tasks with criteria, Touches, dependencies'],
  ['dispatch', 'Dispatch wave', 'Orchestrator runs the next parallel-safe wave in worktrees'],
  ['implement', 'Implement', 'One engineer takes this task to the Definition of Done'],
  ['review-task', 'Review', 'Independent reviewer verdict on the diff'],
  ['bug', 'Investigate', 'Root-cause a defect — diagnosis only, no fix'],
];

const state = { data: null, selected: null, filter: '', role: '' };

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'request failed');
  return payload;
};

const visible = (task) => {
  const needle = state.filter.toLowerCase();
  const matches = !needle ||
    `${task.id} ${task.title} ${task.milestone} ${task.branch}`.toLowerCase().includes(needle);
  return matches && (!state.role || task.role === state.role);
};

const when = (ts) => String(ts).slice(0, 16).replace('T', ' ');

/* ---------------- rendering ---------------- */

function renderFlow(data) {
  const flow = $('#flow');
  flow.replaceChildren();
  data.states.forEach((name, index) => {
    const count = data.tasks.filter((task) => task.state === name).length;
    flow.append(el('div', { className: 'flow-step' }, [
      el('span', { textContent: '●', style: `color:${COLOR[name]}` }),
      el('div', {}, [
        el('b', { textContent: name.replace('_', ' ') }),
        el('div', { className: 'who', textContent: OWNER[name] || '' }),
      ]),
      el('span', { className: 'count', textContent: count }),
    ]));
    if (index < data.states.length - 1) flow.append(el('span', { className: 'flow-arrow', textContent: '→' }));
  });
}

function renderBanner(data) {
  const banner = $('#wave-banner');
  const pending = data.pending.length;
  if (!data.suggestedWave.length && !pending) {
    banner.hidden = true;
    return;
  }
  banner.hidden = false;
  banner.replaceChildren(
    el('div', {}, [
      data.suggestedWave.length
        ? el('span', { innerHTML: `Next parallel-safe wave (cap ${data.parallelismCap}): <code>${data.suggestedWave.join('</code> <code>')}</code>` })
        : el('span', { textContent: 'No dispatchable task right now.' }),
    ]),
    el('div', { className: 'agent-actions' }, [
      data.suggestedWave.length
        ? el('button', {
          className: 'primary',
          textContent: 'Queue /dispatch',
          onclick: () => enqueue('dispatch', '', `wave: ${data.suggestedWave.join(', ')}`),
        })
        : null,
      pending ? el('button', { className: 'ghost', textContent: `${pending} request(s) waiting`, onclick: openQueue }) : null,
    ]),
  );
}

function card(task) {
  const node = el('div', {
    className: `card${task.blocker ? ' blocked' : ''}`,
    draggable: true,
    onclick: () => openTask(task.id),
  }, [
    el('h4', { textContent: task.title }),
    el('div', { className: 'card-meta' }, [
      el('span', { className: 'chip id', textContent: task.id }),
      task.role ? el('span', { className: 'chip role', textContent: task.role }) : null,
      el('span', { className: 'chip', textContent: `wave ${task.wave || task.computedWave}` }),
      task.blockedBy.length ? el('span', { className: 'chip warn', textContent: `needs ${task.blockedBy.join(', ')}` }) : null,
      task.blocker ? el('span', { className: 'chip warn', textContent: '⚑ blocked' }) : null,
      task.conflicts.length ? el('span', { className: 'chip warn', textContent: `overlaps ${task.conflicts.join(', ')}` }) : null,
      task.branch ? el('span', { className: 'chip', textContent: task.branch }) : null,
    ]),
  ]);
  if (!task.blocker) node.style.borderLeftColor = COLOR[task.state];
  if (task.progress !== null) {
    node.append(el('div', { className: 'bar' }, el('span', { style: `width:${task.progress}%` })));
  }
  node.addEventListener('dragstart', (event) => {
    node.classList.add('dragging');
    event.dataTransfer.setData('text/plain', task.id);
  });
  node.addEventListener('dragend', () => node.classList.remove('dragging'));
  return node;
}

function column(name, tasks) {
  const cards = el('div', { className: 'col-cards' },
    tasks.length ? tasks.map(card) : el('p', { className: 'empty', textContent: '—' }));
  const node = el('div', { className: 'column' }, [
    el('div', { className: 'col-head' }, [
      el('h3', { textContent: name.replace('_', ' '), style: `color:${COLOR[name]}` }),
      el('span', { className: 'count', textContent: tasks.length }),
    ]),
    cards,
  ]);
  node.addEventListener('dragover', (event) => {
    event.preventDefault();
    node.classList.add('drop');
  });
  node.addEventListener('dragleave', () => node.classList.remove('drop'));
  node.addEventListener('drop', async (event) => {
    event.preventDefault();
    node.classList.remove('drop');
    const id = event.dataTransfer.getData('text/plain');
    if (id) await move(id, name);
  });
  return node;
}

function render() {
  const data = state.data;
  if (!data) return;
  $('#root').textContent = `${data.root}  ·  ${data.tasksDir}/`;
  $('#queue-count').textContent = data.pending.length;
  $('#queue-count').classList.toggle('zero', data.pending.length === 0);

  const roles = [...new Set(data.tasks.map((task) => task.role).filter(Boolean))].sort();
  const select = $('#role-filter');
  if (select.dataset.roles !== roles.join()) {
    select.dataset.roles = roles.join();
    select.replaceChildren(el('option', { value: '', textContent: 'All roles' }),
      ...roles.map((role) => el('option', { value: role, textContent: role })));
    select.value = state.role;
  }

  renderFlow(data);
  renderBanner(data);

  const tasks = data.tasks.filter(visible);
  $('#board').replaceChildren(...data.states.map((name) =>
    column(name, tasks.filter((task) => task.state === name))));

  if (!tasks.length) {
    $('#board').replaceChildren(el('div', { className: 'empty' }, [
      el('p', { textContent: data.tasks.length ? 'No task matches the filter.' : 'No tasks yet.' }),
      el('p', { innerHTML: 'Add one with <b>+ New task</b> — you describe it, the agents do the rest.' }),
    ]));
  }
  if (state.selected) openTask(state.selected, true);
}

/* ---------------- task drawer ---------------- */

function storyLine(event) {
  const kind = event.type === 'state'
    ? (event.to === 'DONE' || event.to === 'RELEASED' ? 'done' : 'state')
    : (event.type === 'blocked' ? 'blocked' : '');
  const what = event.type === 'state'
    ? `${event.from || '—'} → ${event.to}`
    : `${event.type}${event.note ? `: ${event.note}` : ''}`;
  return el('li', { className: kind }, [
    el('div', { className: 'when', textContent: when(event.ts) }),
    el('div', { className: 'what', textContent: what }),
    el('div', { className: 'who', textContent: [event.actor, event.branch, event.ref].filter(Boolean).join(' · ') }),
  ]);
}

async function openTask(id, quiet = false) {
  state.selected = id;
  const { task, events } = await api(`/api/tasks/${encodeURIComponent(id)}`);
  $('#drawer').hidden = false;
  $('#d-id').textContent = task.id;
  $('#d-title').textContent = task.title;

  const body = $('#d-body');
  const parts = [
    el('div', { className: 'kv' }, [
      el('span', { className: 'chip', textContent: task.state }),
      task.role ? el('span', { className: 'chip role', textContent: task.role }) : null,
      el('span', { className: 'chip', textContent: `wave ${task.wave || task.computedWave}` }),
      task.milestone ? el('span', { className: 'chip', textContent: task.milestone }) : null,
      task.branch ? el('span', { className: 'chip', textContent: task.branch }) : null,
      el('span', { className: 'chip', textContent: task.file }),
    ]),
    task.blocker ? el('div', {}, [
      el('h3', { textContent: 'Blocker' }),
      el('p', { className: 'chip warn', textContent: task.blocker }),
    ]) : null,
    el('h3', { textContent: 'Goal' }),
    el('p', { textContent: task.goal || '—' }),
    el('h3', { textContent: `Acceptance criteria${task.progress !== null ? ` · ${task.progress}%` : ''}` }),
    task.criteria.length
      ? el('ul', {}, task.criteria.map((c) => el('li', { textContent: `${c.done ? '✔' : '☐'} ${c.text}` })))
      : el('p', { className: 'hint', textContent: 'Not refined yet — queue /plan below.' }),
    el('h3', { textContent: 'Touches' }),
    task.touches.length
      ? el('ul', {}, task.touches.map((path) => el('li', {}, el('code', { textContent: path }))))
      : el('p', { className: 'hint', textContent: '— (needed before this task can share a wave)' }),
    el('h3', { textContent: 'Dependencies' }),
    task.dependencies.length
      ? el('ul', {}, task.dependencies.map((dep) => el('li', { textContent: dep + (task.blockedBy.includes(dep) ? ' (not done)' : ' ✔') })))
      : el('p', { className: 'hint', textContent: '—' }),
    el('h3', { textContent: 'Ask an agent' }),
    el('div', { className: 'agent-actions' }, AGENT_ACTIONS.map(([type, label, title]) =>
      el('button', { className: 'ghost', textContent: label, title, onclick: () => enqueue(type, task.id) }))),
    el('h3', { textContent: 'Story' }),
    el('ul', { className: 'story' }, events.length
      ? events.map(storyLine)
      : el('li', { className: 'hint', textContent: 'Nothing has happened yet.' })),
  ];
  body.replaceChildren(...parts.filter(Boolean));
  if (!quiet) body.scrollTop = 0;
}

/* ---------------- actions ---------------- */

async function move(id, to) {
  try {
    await api(`/api/tasks/${encodeURIComponent(id)}/state`, {
      method: 'POST',
      body: { state: to, actor: 'human', note: 'moved on the board' },
    });
  } catch (err) {
    alert(err.message);
  }
}

async function enqueue(type, target = '', note = '', { showQueue = true } = {}) {
  await api('/api/queue', { method: 'POST', body: { type, target, note } });
  state.data = await api('/api/board'); // the SSE frame may not have landed yet
  render();
  if (showQueue) openQueue();
}

function openQueue() {
  const data = state.data;
  $('#queue-list').replaceChildren(...(data.pending.length
    ? data.pending.map((item) => el('div', { className: 'queue-item' }, [
      el('span', { innerHTML: `<code>/${item.type}</code> ${item.target || ''} ${item.note ? `— ${item.note}` : ''}` }),
      el('span', { className: 'hint', textContent: when(item.ts) }),
    ]))
    : [el('p', { className: 'hint', textContent: 'Queue is empty.' })]));
  $('#queue-modal').hidden = false;
}

/* ---------------- wiring ---------------- */

$('#search').addEventListener('input', (event) => {
  state.filter = event.target.value;
  render();
});
$('#role-filter').addEventListener('change', (event) => {
  state.role = event.target.value;
  render();
});
$('#new-btn').addEventListener('click', () => {
  $('#modal').hidden = false;
  $('#new-form').reset();
  $('#new-form').elements.title.focus();
});
$('#cancel-new').addEventListener('click', () => { $('#modal').hidden = true; });
$('#queue-btn').addEventListener('click', openQueue);
$('#queue-close').addEventListener('click', () => { $('#queue-modal').hidden = true; });
$('#d-close').addEventListener('click', () => {
  $('#drawer').hidden = true;
  state.selected = null;
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  $('#modal').hidden = true;
  $('#queue-modal').hidden = true;
  $('#drawer').hidden = true;
  state.selected = null;
});

$('#new-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  try {
    const task = await api('/api/tasks', {
      method: 'POST',
      body: {
        title: form.get('title'),
        goal: form.get('goal'),
        role: form.get('role'),
        milestone: form.get('milestone'),
      },
    });
    if (form.get('refine')) await enqueue('plan', task.id, 'refine this new task into DevOS shape', { showQueue: false });
    $('#modal').hidden = true;
    openTask(task.id);
  } catch (err) {
    alert(err.message);
  }
});

const stream = new EventSource('/api/stream');
stream.onmessage = (event) => {
  state.data = JSON.parse(event.data);
  $('#live').classList.remove('stale');
  render();
};
stream.onerror = () => $('#live').classList.add('stale');
