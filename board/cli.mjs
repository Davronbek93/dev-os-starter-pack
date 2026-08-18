#!/usr/bin/env node
// Agent-facing board CLI. Agents record what they did here; humans use the UI.
//   node board/cli.mjs <command> [args] [--flag value]
import { config } from './lib/config.mjs';
import { addTask, moveTask, note, request, setBlocker, snapshot, story } from './lib/sync.mjs';
import { patchQueue, readQueue } from './lib/store.mjs';

const USAGE = `DevOS Board CLI

  list [--state STATE] [--json]        Tasks, optionally filtered by state
  show <id>                            One task with its full story
  wave                                 The next parallel-safe wave (advisory)
  add "<title>" [--role R] [--goal G]  Create a BACKLOG task
  state <id> <STATE> [--note N] [--wave W] [--branch B] [--actor A]
  block <id> "<reason>" | unblock <id>
  note <id> "<text>" [--type review|dispatch|note] [--ref REF] [--actor A]
  queue [--json]                       Pending agent requests
  queue next [--json]                  Oldest pending request
  queue claim|done|cancel <queue-id> [--note N]
  request <type> [target] [--note N]   Enqueue a request (as a human would)

STATE: ${config.states.join(' | ')}
Actors are free text; use agent:<role> from an agent (e.g. agent:backend-engineer).`;

const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith('--')) {
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) flags[key] = true;
    else {
      flags[key] = next;
      i += 1;
    }
  } else positional.push(argv[i]);
}

const [command, ...args] = positional;
const out = (value) => console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
const fail = (message) => {
  console.error(`board: ${message}`);
  process.exit(1);
};
const required = (value, name) => (value === undefined ? fail(`missing ${name}`) : value);

const stateIcon = { BACKLOG: '·', READY: '○', IN_PROGRESS: '◐', REVIEW: '◑', TESTING: '◕', DONE: '●', RELEASED: '★' };
const line = (task) =>
  `${stateIcon[task.state] || '?'} ${task.id.padEnd(10)} ${task.state.padEnd(12)} ${task.blocker ? '⚑ ' : '  '}${task.title}`;

try {
  switch (command) {
    case undefined:
    case 'help':
    case '--help':
      out(USAGE);
      break;

    case 'list': {
      const data = snapshot();
      const tasks = flags.state
        ? data.tasks.filter((task) => task.state === String(flags.state).toUpperCase())
        : data.tasks;
      out(flags.json ? tasks : tasks.map(line).join('\n') || '(no tasks)');
      break;
    }

    case 'show': {
      const data = story(required(args[0], 'task id'));
      if (flags.json) {
        out(data);
        break;
      }
      const { task } = data;
      out([
        `${task.id} — ${task.title}`,
        `state: ${task.state}   role: ${task.role || '—'}   wave: ${task.wave || task.computedWave}   branch: ${task.branch || '—'}`,
        task.blocker ? `blocker: ${task.blocker}` : null,
        task.blockedBy.length ? `blocked by: ${task.blockedBy.join(', ')}` : null,
        '',
        'story:',
        ...data.events.map((event) =>
          `  ${event.ts.slice(0, 19).replace('T', ' ')}  ${event.type.padEnd(10)} ${
            event.type === 'state' ? `${event.from || '—'} → ${event.to}` : event.note || ''
          }  [${event.actor}]`),
      ].filter((value) => value !== null).join('\n'));
      break;
    }

    case 'wave': {
      const data = snapshot();
      out(flags.json
        ? data.suggestedWave
        : data.suggestedWave.length
          ? `next parallel-safe wave (cap ${data.parallelismCap}): ${data.suggestedWave.join(', ')}`
          : 'no dispatchable task — refine a BACKLOG task or finish what is in flight');
      break;
    }

    case 'add':
      out(addTask({
        title: required(args[0], 'title'),
        role: flags.role,
        goal: flags.goal,
        milestone: flags.milestone,
      }, { actor: flags.actor || 'human' }));
      break;

    case 'state':
      out(moveTask(required(args[0], 'task id'), required(args[1], 'state'), {
        actor: flags.actor || 'agent',
        note: flags.note === true ? '' : flags.note || '',
        wave: flags.wave === true ? undefined : flags.wave,
        branch: flags.branch === true ? undefined : flags.branch,
      }));
      break;

    case 'block':
      out(setBlocker(required(args[0], 'task id'), required(args[1], 'reason'), { actor: flags.actor || 'agent' }));
      break;

    case 'unblock':
      out(setBlocker(required(args[0], 'task id'), '', { actor: flags.actor || 'agent' }));
      break;

    case 'note':
      out(note(required(args[0], 'task id'), required(args[1], 'text'), {
        actor: flags.actor || 'agent',
        type: flags.type === true ? 'note' : flags.type || 'note',
        ref: flags.ref === true ? undefined : flags.ref,
      }));
      break;

    case 'request':
      out(request({
        type: required(args[0], 'request type'),
        target: args[1] || '',
        note: flags.note === true ? '' : flags.note || '',
        requestedBy: flags.actor || 'human',
      }));
      break;

    case 'queue': {
      const [sub, id] = args;
      const pending = readQueue().filter((item) => item.status === 'pending');
      if (!sub) {
        out(flags.json ? pending : pending.map((item) =>
          `${item.id}  /${item.type}${item.target ? ` ${item.target}` : ''}  ${item.note || ''}`).join('\n') || '(queue empty)');
      } else if (sub === 'next') {
        const next = pending[0] || null;
        out(flags.json ? next : next
          ? `${next.id}  /${next.type}${next.target ? ` ${next.target}` : ''}  ${next.note || ''}`
          : '(queue empty)');
      } else if (['claim', 'done', 'cancel'].includes(sub)) {
        const status = { claim: 'claimed', done: 'done', cancel: 'cancelled' }[sub];
        out(patchQueue(required(id, 'queue id'), { status, note: flags.note === true ? undefined : flags.note }));
      } else fail(`unknown queue subcommand: ${sub}`);
      break;
    }

    default:
      fail(`unknown command: ${command}\n\n${USAGE}`);
  }
} catch (err) {
  fail(err.message);
}
