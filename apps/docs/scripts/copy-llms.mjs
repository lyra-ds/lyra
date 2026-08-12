import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = resolve(appRoot, '..', '..');
const output = resolve(workspaceRoot, 'tools', 'docgen', 'output');
const target = resolve(appRoot, 'public', 'llms.txt');

// O arquivo publicado é a junção dos blocos gerados de cada pacote: o do React já traz as
// regras e os tokens no topo, e o do Alpine entra depois dele. Concatenar aqui, em vez de
// gerar um arquivo só, mantém cada gerador dono do seu pacote e verificável por --check.
const parts = await Promise.all(
  ['llms.txt', 'alpine-llms.txt', 'blade-llms.txt'].map((file) =>
    readFile(resolve(output, file), 'utf8'),
  ),
);

await mkdir(dirname(target), { recursive: true });
await writeFile(target, parts.map((part) => part.trimEnd()).join('\n\n') + '\n', 'utf8');
