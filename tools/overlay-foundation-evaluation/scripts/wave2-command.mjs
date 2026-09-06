import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';

// ps lists IDs and state only: no arguments or environment from unrelated processes.
export async function readProcessGroup(pgid, { execFile: inspect = execFile } = {}) {
  const stdout = await new Promise((resolve, reject) => {
    inspect(
      '/bin/ps',
      ['-axo', 'pid=,pgid=,uid=,stat='],
      {
        encoding: 'utf8',
        timeout: 2000,
        maxBuffer: 4_000_000,
      },
      (error, output) => (error ? reject(error) : resolve(output)),
    );
  });
  return stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const match = /^\s*(\d+)\s+(\d+)\s+(-?\d+)\s+(\S+)\s*$/.exec(line);
      assert.ok(match, 'unreadable process ownership/state');
      return {
        pid: Number(match[1]),
        pgid: Number(match[2]),
        uid: Number(match[3]),
        state: match[4],
      };
    })
    .filter((row) => row.pgid === pgid);
}

// Trusted host commands and their inherited descendants stay in this detached POSIX
// group. A command deliberately starting a new session is outside this contract.
export async function runOwnedCommand(
  cmd,
  args,
  { signal, maxBuffer = 100_000_000, pollMs = 20, termMs = 5000, killMs = 5000, ...options } = {},
  {
    spawn: start = spawn,
    readGroup = readProcessGroup,
    signalGroup = (pgid, signalName) => process.kill(-pgid, signalName),
  } = {},
) {
  assert.ok(['darwin', 'linux'].includes(process.platform), 'POSIX host required');
  const uid = process.getuid();
  const pause = () => new Promise((resolve) => setTimeout(resolve, pollMs));
  if (signal?.aborted)
    throw Object.assign(new Error('host command aborted before spawn'), { disposalVerified: true });
  const child = start(cmd, args, { ...options, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const pgid = child.pid;
  let closed = false,
    exited = false,
    primary,
    exitCode,
    exitSignal;
  let retired = false;
  const chunks = { stdout: [], stderr: [] },
    sizes = { stdout: 0, stderr: 0 };
  const fail = (error) => {
    primary ??= error;
  };
  const abort = () => fail(new Error('host command aborted'));
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  child.on('error', fail);
  child.on('exit', (code, name) => {
    exited = true;
    exitCode = code;
    exitSignal = name;
  });
  child.on('close', (code, name) => {
    closed = exited = true;
    exitCode = code;
    exitSignal = name;
  });
  for (const stream of ['stdout', 'stderr'])
    child[stream].on('data', (data) => {
      const bytes = Buffer.from(data),
        remaining = maxBuffer - sizes[stream];
      if (remaining > 0) chunks[stream].push(bytes.subarray(0, remaining));
      sizes[stream] += Math.min(bytes.length, Math.max(remaining, 0));
      if (bytes.length > remaining) fail(new Error(`host command ${stream} buffer exceeded`));
    });
  const members = async () => {
    if (!Number.isSafeInteger(pgid) || pgid <= 1) {
      assert.ok(closed, 'spawn shutdown not confirmed');
      return [];
    }
    const rows = await readGroup(pgid);
    for (const row of rows) {
      assert.ok(
        Number.isSafeInteger(row.pid) &&
          row.pid > 1 &&
          row.pgid === pgid &&
          row.uid === uid &&
          typeof row.state === 'string' &&
          row.state.length,
        'owned process group identity/owner changed',
      );
    }
    // Linux may retain already-exited orphan zombies until PID 1 reaps them.
    const live = rows.filter((row) => !row.state.startsWith('Z'));
    if (retired) assert.equal(live.length, 0, 'retired process group identity reappeared');
    if (!live.length) retired = true;
    return live;
  };
  const send = async (name) => {
    if (!(await members()).length) return;
    try {
      signalGroup(pgid, name);
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
      assert.equal((await members()).length, 0, 'process group disappeared without proof');
    }
  };
  const waitDisposed = async (duration) => {
    const deadline = Date.now() + duration;
    do {
      if ((await members()).length === 0 && closed) return true;
      await pause();
    } while (Date.now() < deadline);
    return false;
  };
  let disposalError,
    disposalVerified = false;
  try {
    while (!exited && !primary) await pause();
    if (exited && exitCode !== 0)
      fail(
        Object.assign(new Error(`host command exited ${exitCode ?? exitSignal}`), {
          code: exitCode,
          signal: exitSignal,
        }),
      );
    if (!primary) {
      if (await waitDisposed(pollMs * 2)) disposalVerified = true;
      else fail(new Error('host command left live descendants or unclosed streams'));
    }
    if (!disposalVerified) {
      await send('SIGTERM');
      disposalVerified = await waitDisposed(termMs);
      if (!disposalVerified) {
        await send('SIGKILL');
        disposalVerified = await waitDisposed(killMs);
      }
      assert.ok(disposalVerified, 'host command shutdown uncertain after TERM/KILL');
    }
  } catch (error) {
    disposalError = error;
  } finally {
    signal?.removeEventListener('abort', abort);
  }
  const result = {
    stdout: Buffer.concat(chunks.stdout).toString(),
    stderr: Buffer.concat(chunks.stderr).toString(),
    disposalVerified,
    processProof: {
      leaderPid: pgid ?? null,
      processGroupId: pgid ?? null,
      uid,
      leaderClosed: closed,
      noLiveGroupMembers: disposalVerified,
    },
  };
  if (primary || disposalError) {
    const error = disposalError
      ? new AggregateError(
          [primary, disposalError].filter(Boolean),
          [primary?.message, disposalError.message].filter(Boolean).join('; '),
        )
      : primary;
    throw Object.assign(error, result);
  }
  return result;
}
