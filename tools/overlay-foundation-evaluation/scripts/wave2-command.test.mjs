import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runOwnedCommand, readProcessGroup } from './wave2-command.mjs';

test('process inspection accepts unrelated Darwin signed UIDs but selects only the captured group', async () => {
  const rows = await readProcessGroup(424242, {
    execFile: (_cmd, _args, _options, callback) =>
      callback(null, '69280 69280 -2 Ss\n424242 424242 501 S\n'),
  });
  assert.deepEqual(rows, [{ pid: 424242, pgid: 424242, uid: 501, state: 'S' }]);
});

function fake() {
  const child = new EventEmitter();
  child.pid = 424242;
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  const group = [{ pid: child.pid, pgid: child.pid, uid: process.getuid(), state: 'S' }];
  const signals = [];
  return {
    child,
    group,
    signals,
    boundaries: {
      spawn: (_cmd, _args, options) => {
        assert.equal(options.detached, true);
        return child;
      },
      readGroup: async () => [...group],
      signalGroup: (id, signal) => {
        assert.equal(id, child.pid);
        signals.push(signal);
      },
    },
  };
}
test('ordinary success and failure both prove real process disposal', async () => {
  const result = await runOwnedCommand(process.execPath, ['-e', "process.stdout.write('ok')"]);
  assert.equal(result.stdout, 'ok');
  assert.equal(result.disposalVerified, true);
  assert.equal(result.processProof.leaderClosed, true);
  await assert.rejects(
    runOwnedCommand(process.execPath, ['-e', 'process.exit(7)']),
    (error) => error.code === 7 && error.disposalVerified === true,
  );
  await assert.rejects(
    runOwnedCommand('/nonexistent-wave2-executable', []),
    (error) => error.code === 'ENOENT' && error.disposalVerified === true,
  );
});
test('already aborted commands never spawn', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    runOwnedCommand(
      'owned',
      [],
      { signal: controller.signal },
      { spawn: () => assert.fail('must not spawn') },
    ),
    (error) => error.disposalVerified === true,
  );
});
test('abort awaits delayed close and inherited group disposal', async () => {
  const f = fake(),
    controller = new AbortController();
  const pending = runOwnedCommand(
    'owned',
    [],
    { signal: controller.signal, pollMs: 2, termMs: 100 },
    f.boundaries,
  );
  controller.abort();
  setTimeout(() => f.child.emit('close', null, 'SIGTERM'), 10);
  setTimeout(() => f.group.splice(0), 30);
  const start = Date.now();
  await assert.rejects(
    pending,
    (error) => error.disposalVerified === true && /abort/i.test(error.message),
  );
  assert.ok(Date.now() - start >= 25);
  assert.deepEqual(f.signals, ['SIGTERM']);
});
test('normal leader close disposes surviving descendants before rejecting', async () => {
  const f = fake();
  f.boundaries.signalGroup = (_id, signal) => {
    f.signals.push(signal);
    f.group.splice(0);
  };
  const pending = runOwnedCommand('owned', [], { pollMs: 1, termMs: 10 }, f.boundaries);
  f.child.emit('close', 0, null);
  await assert.rejects(
    pending,
    (error) => error.disposalVerified === true && /descendant/i.test(error.message),
  );
  assert.deepEqual(f.signals, ['SIGTERM']);
});
test('TERM escalates to KILL, waits for close, and treats exited zombies as disposed', async () => {
  const f = fake(),
    controller = new AbortController();
  f.boundaries.signalGroup = (_id, signal) => {
    f.signals.push(signal);
    if (signal === 'SIGKILL') {
      f.group[0].state = 'Z';
      f.child.emit('close', null, signal);
    }
  };
  const pending = runOwnedCommand(
    'owned',
    [],
    { signal: controller.signal, pollMs: 1, termMs: 5 },
    f.boundaries,
  );
  controller.abort();
  await assert.rejects(pending, (error) => error.disposalVerified === true);
  assert.deepEqual(f.signals, ['SIGTERM', 'SIGKILL']);
});
for (const failure of ['owner', 'inspection', 'timeout', 'unclosed'])
  test(`uncertain ${failure} preserves primary failure and never claims disposal`, async () => {
    const f = fake(),
      controller = new AbortController();
    if (failure === 'owner') f.group[0].uid++;
    if (failure === 'inspection')
      f.boundaries.readGroup = async () => {
        throw new Error('inspection unavailable');
      };
    if (failure === 'unclosed') f.group.splice(0);
    const pending = runOwnedCommand(
      'owned',
      [],
      { signal: controller.signal, pollMs: 1, termMs: 3, killMs: 3 },
      f.boundaries,
    );
    controller.abort();
    await assert.rejects(
      pending,
      (error) => error.disposalVerified === false && /abort/i.test(error.errors[0].message),
    );
    if (failure !== 'timeout') assert.deepEqual(f.signals, []);
  });
test('bounded output overflow disposes group before rejecting', async () => {
  const f = fake();
  f.boundaries.signalGroup = (_id, signal) => {
    f.group.splice(0);
    f.child.emit('close', null, signal);
  };
  const pending = runOwnedCommand('owned', [], { maxBuffer: 4, pollMs: 1 }, f.boundaries);
  f.child.stdout.write('123456789');
  await assert.rejects(
    pending,
    (error) =>
      error.disposalVerified === true && error.stdout === '1234' && /buffer/i.test(error.message),
  );
});
test('real delayed host parent and inherited descendant have exited before abort returns', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'wave2-host-disposal-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const controller = new AbortController();
  const descendant = `const fs=require('node:fs');process.on('SIGTERM',()=>setTimeout(()=>{fs.writeFileSync(process.argv[1],'exited');process.exit(0)},350));setInterval(()=>{},1000);console.log('ready')`;
  const parent = `const {spawn}=require('node:child_process');const fs=require('node:fs');process.on('SIGTERM',()=>setTimeout(()=>{fs.writeFileSync(process.argv[1],'exited');process.exit(0)},200));const c=spawn(process.execPath,['-e',${JSON.stringify(descendant)},process.argv[2]],{stdio:['ignore','pipe','inherit']});c.stdout.once('data',()=>fs.writeFileSync(process.argv[3],JSON.stringify({parent:process.pid,child:c.pid})));setInterval(()=>{},1000)`;
  const pending = runOwnedCommand(
    process.execPath,
    ['-e', parent, join(root, 'parent'), join(root, 'child'), join(root, 'ready')],
    { signal: controller.signal, termMs: 2000 },
  );
  let ids;
  for (let i = 0; i < 200; i++) {
    try {
      ids = JSON.parse(await readFile(join(root, 'ready'), 'utf8'));
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 10));
    }
  }
  assert.ok(ids, 'both processes ready');
  controller.abort();
  await assert.rejects(pending, (error) => error.disposalVerified === true);
  assert.equal(await readFile(join(root, 'parent'), 'utf8'), 'exited');
  assert.equal(await readFile(join(root, 'child'), 'utf8'), 'exited');
  assert.deepEqual(
    (await readProcessGroup(ids.parent)).filter((p) => !p.state.startsWith('Z')),
    [],
  );
});
