import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '../../..');
const docsRoot = resolve(repoRoot, 'apps/docs');
const outRoot = resolve(docsRoot, 'out');

function readExport(path) {
  return readFileSync(resolve(outRoot, path), 'utf8');
}

test('emits localized consent copy and canonical policy links in the static export', () => {
  for (const [locale, body, policyTitle] of [
    [
      'en',
      'This site keeps your theme choice in your browser. You can also allow anonymous usage analytics, which would only ever tell us which pages help people. Neither is needed to read anything here.',
      'Privacy',
    ],
    [
      'pt-BR',
      'Este site guarda sua escolha de tema no seu navegador. Você também pode permitir métricas de uso anônimas, que serviriam apenas para saber quais páginas ajudam. Nenhuma das duas é necessária para ler nada aqui.',
      'Privacidade',
    ],
  ]) {
    const page = readExport(`${locale}.html`);

    assert.ok(page.includes(body));
    assert.ok(page.includes(policyTitle));
    assert.ok(page.includes(`https://lyra-ds.dev/${locale}/privacy`));
  }
});

test('keeps consent in one docs-specific key and reserves analytics behind the guard', () => {
  const consent = readFileSync(resolve(docsRoot, 'lib/consent.ts'), 'utf8');
  const layout = readFileSync(resolve(docsRoot, 'app/[lang]/layout.tsx'), 'utf8');

  assert.equal((consent.match(/lyra-docs-consent/g) ?? []).length, 1);
  assert.match(consent, /return readConsent\(\) === 'all';/);
  assert.match(layout, /storageKey=\{consentStorageKey\}/);
  assert.match(layout, /must be guarded by mayLoadAnalytics\(\)/);
  assert.match(layout, /PRIVACY_POLICY_ORIGIN/);
});

test('keeps docs self-contained while allowing local iframe previews and data URI images', () => {
  const headers = readFileSync(resolve(docsRoot, 'public/_headers'), 'utf8');
  const deploy = readFileSync(resolve(docsRoot, 'DEPLOY.md'), 'utf8');

  assert.match(headers, /Content-Security-Policy: default-src 'self'/);
  assert.match(headers, /script-src 'self' 'unsafe-inline'/);
  assert.match(headers, /style-src 'self' 'unsafe-inline'/);
  assert.match(headers, /font-src 'self'/);
  assert.match(headers, /img-src 'self' data:/);
  assert.match(headers, /connect-src 'self'/);
  assert.match(headers, /frame-src 'self'/);
  assert.doesNotMatch(headers, /https?:\/\//);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /Referrer-Policy: strict-origin-when-cross-origin/);
  assert.match(headers, /Permissions-Policy:/);
  assert.doesNotMatch(headers, /\/opengraph-image/);
  assert.match(deploy, /pnpm --filter @lyra-ds\/docs\.\.\. run build/);
  assert.match(deploy, /apps\/docs\/out/);
  assert.match(deploy, /must not go live before `lyra-ds\.dev`/);
  assert.match(deploy, /fails closed/);
  assert.match(deploy, /custom property values and dynamic preview sizing/);
  assert.match(deploy, /apps\/site/);
});

test('keeps localized message keys aligned and does not introduce document cookies', () => {
  const english = JSON.parse(readFileSync(resolve(docsRoot, 'messages/en.json'), 'utf8'));
  const portuguese = JSON.parse(readFileSync(resolve(docsRoot, 'messages/pt-BR.json'), 'utf8'));
  const docsSource = [
    readFileSync(resolve(docsRoot, 'app/[lang]/layout.tsx'), 'utf8'),
    readFileSync(resolve(docsRoot, 'app/layout.tsx'), 'utf8'),
    readFileSync(resolve(docsRoot, 'lib/consent.ts'), 'utf8'),
  ].join('\n');

  assert.deepEqual(Object.keys(english).sort(), Object.keys(portuguese).sort());
  assert.doesNotMatch(docsSource, /document\.cookie/);
});

test('exports representative index, component, guide, and isolated-preview routes', () => {
  for (const path of [
    'en.html',
    'en/components/navbar.html',
    'en/guides/getting-started.html',
    'en/components/shell.html',
  ]) {
    assert.ok(readExport(path).includes('<html'));
  }

  assert.match(readExport('en/components/shell.html'), /lw-example__stage--isolated/);
  assert.match(
    readFileSync(resolve(docsRoot, 'content/docs/en/components/shell.mdx'), 'utf8'),
    /<Example id="docs-site" title="A documentation site" layout="isolated">/,
  );
  assert.match(
    readFileSync(resolve(docsRoot, 'components/example-view.tsx'), 'utf8'),
    /<iframe[\s\S]*srcDoc: isolatedDocument/,
  );
});
