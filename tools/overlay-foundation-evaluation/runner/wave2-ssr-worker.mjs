import { executeWave2SsrInWorker } from './wave2-ssr.mjs';

// Private one-request IPC worker, never an external CLI or generic module runner.
if (!process.send || process.env.LYRA_WAVE2_SSR_WORKER !== '1' || process.argv.length !== 2)
  throw new Error('Wave2 SSR worker requires its owning process');

function serializeError(error, depth = 0) {
  if (depth > 8) throw new Error('SSR error nesting exceeds protocol limit');
  const scope =
    error?.scope === 'candidate' && error?.classification === 'product' ? 'candidate' : 'run';
  return {
    name: error?.name ?? 'Error',
    message: String(error?.message ?? error),
    scope,
    classification: scope === 'candidate' ? 'product' : 'policy',
    ...(error?.errors
      ? { errors: error.errors.map((value) => serializeError(value, depth + 1)) }
      : {}),
    ...(error?.cause ? { cause: serializeError(error.cause, depth + 1) } : {}),
    ...(error?.ssrDiagnostics ? { ssrDiagnostics: error.ssrDiagnostics } : {}),
  };
}
let received = false;
process.on('message', async (message) => {
  if (received) process.exit(2);
  received = true;
  let reply;
  try {
    if (
      message?.schemaVersion !== 1 ||
      message.type !== 'execute' ||
      Object.keys(message).sort().join(',') !== 'input,schemaVersion,type' ||
      Buffer.byteLength(JSON.stringify(message)) > 16 * 1024 * 1024 ||
      Object.keys(message.input ?? {}).some(
        (key) => !['fixture', 'request', 'renderTarget'].includes(key),
      ) ||
      Object.keys(message.input?.fixture ?? {}).join(',') !== 'ssrPath'
    )
      throw new Error('invalid SSR worker request');
    reply = {
      schemaVersion: 1,
      type: 'result',
      pid: process.pid,
      result: await executeWave2SsrInWorker(message.input),
    };
  } catch (error) {
    reply = { schemaVersion: 1, type: 'error', pid: process.pid, error: serializeError(error) };
  }
  if (Buffer.byteLength(JSON.stringify(reply)) > 16 * 1024 * 1024)
    reply = {
      schemaVersion: 1,
      type: 'error',
      pid: process.pid,
      error: serializeError(new Error('SSR worker response exceeded limit')),
    };
  process.send(reply, (error) => {
    if (error) process.exit(2);
  });
});
