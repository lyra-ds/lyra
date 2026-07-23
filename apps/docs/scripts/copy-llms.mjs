import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = resolve(appRoot, '..', '..');
const target = resolve(appRoot, 'public', 'llms.txt');

await mkdir(dirname(target), { recursive: true });
await copyFile(resolve(workspaceRoot, 'tools', 'docgen', 'output', 'llms.txt'), target);
