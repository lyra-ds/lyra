import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { deriveStats, outputPath, sourcePaths } from './derive-stats.mjs';

const repoRoot = resolve(import.meta.dirname, '../../..');
const siteRoot = resolve(repoRoot, 'apps/site');
const statsPath = outputPath;

test('derives honest inventory counts from the parity and docgen sources', () => {
  return deriveStats().then(() => {
    assert.deepEqual(JSON.parse(readFileSync(statsPath, 'utf8')), {
      tokenDeclarations: 209,
      tokenNames: 153,
      palettePrimitives: 43,
      semanticTokens: 110,
      cssClasses: 269,
      documentedComponents: 54,
      whiteLabelInputs: 4,
    });
  });
});

test('rejects a missing stats source instead of emitting invented inventory', async () => {
  await assert.rejects(
    deriveStats({
      sources: { ...sourcePaths, baseline: resolve(repoRoot, 'tools/parity/missing.json') },
    }),
    { code: 'ENOENT' },
  );
});

test('renders bilingual theming and community sections in the static export', () => {
  for (const [locale, themingTitle, communityTitle] of [
    ['en', 'White-label without starting over', 'Built in the open'],
    ['pt-BR', 'White-label sem recomeçar', 'Feito no aberto'],
  ]) {
    const page = readFileSync(resolve(siteRoot, 'out', `${locale}.html`), 'utf8');

    assert.match(page, /id="theming"/);
    assert.match(page, /id="community"/);
    assert.match(page, new RegExp(themingTitle));
    assert.match(page, new RegExp(communityTitle));
    assert.match(page, /110 semantic tokens|110 tokens semânticos/);
    assert.match(page, /html\[data-brand='harbor'\]/);
    assert.match(page, /github\.com\/lyra-ds\/lyra\/discussions/);
  }

  assert.equal(existsSync(statsPath), true);
});
