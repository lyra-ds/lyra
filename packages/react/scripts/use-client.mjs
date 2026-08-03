import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const USE_CLIENT = '"use client";';
const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
const files = await readdir(distDir);

await Promise.all(
  files
    .filter((file) => file.endsWith('.js') || file.endsWith('.cjs'))
    .map(async (file) => {
      const path = join(distDir, file);
      const code = await readFile(path, 'utf8');
      if (/^\s*["']use client["']/.test(code)) return;
      await writeFile(path, `${USE_CLIENT}\n${code}`);
    }),
);
