import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packageDir = fileURLToPath(new URL('..', import.meta.url));
const config = (await import('../tsdown.config.ts')).default;
const names = config.map(({ name }) => name);

if (names.some((name) => typeof name !== 'string' || name.length === 0)) {
  throw new Error('Every tsdown config must have a name.');
}

const tsdownPackage = require.resolve('tsdown/package.json');
const { bin } = JSON.parse(await readFile(tsdownPackage, 'utf8'));
const tsdown = resolve(dirname(tsdownPackage), bin.tsdown);

function run(args) {
  return new Promise((resolveRun, rejectRun) => {
    let child;

    try {
      child = spawn(process.execPath, ['--max-old-space-size=512', ...args], {
        cwd: packageDir,
        env: process.env,
        stdio: 'inherit',
      });
    } catch (error) {
      rejectRun(error);
      return;
    }

    child.once('error', rejectRun);
    child.once('exit', (code, signal) => {
      if (code === 0 && signal === null) {
        resolveRun();
        return;
      }

      rejectRun(new Error(`Build child failed (code: ${code}, signal: ${signal}).`));
    });
  });
}

for (const name of names) {
  await run([tsdown, '--filter', name, '--concurrency', '1']);
}

await run([fileURLToPath(new URL('./use-client.mjs', import.meta.url))]);
