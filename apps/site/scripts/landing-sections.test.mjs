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

test('renders the FAQ and CTA sections with their locale-specific copy', () => {
  const siteCss = readFileSync(resolve(siteRoot, 'app/site.css'), 'utf8');
  assert.match(siteCss, /\.lw-faq\s*\{[\s\S]*grid-template-columns: 320px 1fr/);
  assert.match(siteCss, /\.lw-cta\s*\{[\s\S]*background: var\(--indigo-950\)/);
  assert.match(siteCss, /\.lw-cta \.lw-cta__ghost\s*\{[\s\S]*border-color: var\(--night-300\)/);

  for (const [locale, faqTitle, ctaTitle, documentationLabel, githubLabel] of [
    [
      'en',
      'Questions before you adopt it',
      'Install in a minute. Use it forever.',
      'Read the documentation',
      'Star on GitHub',
    ],
    [
      'pt-BR',
      'Perguntas antes de adotar',
      'Instale em um minuto. Use para sempre.',
      'Ler a documentação',
      'Dar uma estrela no GitHub',
    ],
  ]) {
    const page = readFileSync(resolve(siteRoot, 'out', `${locale}.html`), 'utf8');
    const messages = JSON.parse(
      readFileSync(resolve(siteRoot, 'messages', `${locale}.json`), 'utf8'),
    );

    assert.match(page, /<section id="faq" class="lw-section lw-section--alt">/);
    assert.match(page, /<section class="lw-cta">/);
    assert.match(page, new RegExp(faqTitle));
    assert.match(page, new RegExp(ctaTitle));
    assert.match(page, new RegExp(documentationLabel));
    assert.match(page, new RegExp(githubLabel));
    assert.match(
      page,
      /Can I use it commercially, for free\?|Posso usar comercialmente sem pagar\?/,
    );
    assert.match(page, /aria-expanded="true"/);
    assert.match(page, /href="https:\/\/docs\.lyra-ds\.dev"/);
    assert.match(page, /href="https:\/\/github\.com\/lyra-ds\/lyra"/);
    assert.match(page, /src="\/lyra-mark-light\.svg" alt=""/);

    for (const key of [
      'faqOverline',
      'faqTitle',
      'faqLead',
      'faqCommercialTitle',
      'faqCommercialContent',
      'faqFrameworksTitle',
      'faqFrameworksContent',
      'faqThemingTitle',
      'faqThemingContent',
      'faqA11yTitle',
      'faqA11yContent',
      'faqMaturityTitle',
      'faqMaturityContent',
      'ctaTitle',
      'ctaDocumentation',
      'ctaGithub',
    ])
      assert.ok(page.includes(messages[key]), `${locale} export is missing ${key}`);
  }
});
