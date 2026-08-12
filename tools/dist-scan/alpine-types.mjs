#!/usr/bin/env node
/**
 * Toda `export interface Lyra*` do src do @lyra-ds/alpine precisa chegar às declarações
 * publicadas. As interfaces de opções são o contrato documentado de cada binding, e o
 * docgen as lê do dist — um tipo que nunca sai do src é invisível para o consumidor e
 * para a documentação ao mesmo tempo.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(REPO, 'packages', 'alpine', 'src');
const DTS = join(REPO, 'packages', 'alpine', 'dist', 'index.d.ts');
const INTERFACE = /^export interface (Lyra\w+)/gm;

function declaredInSource() {
  const names = new Set();

  for (const file of readdirSync(SRC).sort()) {
    if (!file.endsWith('.ts') || file.includes('.test.')) continue;
    const source = readFileSync(join(SRC, file), 'utf8');
    for (const [, name] of source.matchAll(INTERFACE)) names.add(name);
  }

  return names;
}

function main() {
  const declared = declaredInSource();
  const published = readFileSync(DTS, 'utf8');
  const missing = [...declared].filter((name) => !new RegExp(`\\b${name}\\b`).test(published));

  if (missing.length > 0) {
    throw new Error(
      `${missing.length} interface(s) ausente(s) de dist/index.d.ts:\n  ${missing.join('\n  ')}\n` +
        'Reexporte a partir de packages/alpine/src/index.ts e rode o build do pacote.',
    );
  }

  console.log(`alpine-types OK: as ${declared.size} interfaces exportadas chegam ao dist.`);
}

try {
  main();
} catch (error) {
  console.error(`alpine-types FAILED: ${error.message}`);
  process.exit(1);
}
