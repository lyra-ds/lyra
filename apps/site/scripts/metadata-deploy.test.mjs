import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const repoRoot = resolve(import.meta.dirname, '../../..');
const siteRoot = resolve(repoRoot, 'apps/site');
const outRoot = resolve(siteRoot, 'out');
const origin = 'https://lyra-ds.dev';
const imageUrl = `${origin}/og.png`;
const imageAlt = 'Lyra DS — CSS-first design system for SaaS products';

function readExport(path) {
  return readFileSync(resolve(outRoot, path), 'utf8');
}

function headOf(path) {
  return readExport(path).match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
}

test('exports localized canonical, hreflang, Open Graph, and Twitter metadata', () => {
  for (const [locale, title, description, openGraphLocale] of [
    [
      'en',
      'Lyra DS — CSS-first design system for SaaS products',
      'An open source, CSS-first design system for SaaS products. Semantic tokens, white-label theming in four tokens, and thin React wrappers over a CSS core that works in any framework.',
      'en_US',
    ],
    [
      'pt-BR',
      'Lyra DS — design system CSS-first para produtos SaaS',
      'Um design system open source e CSS-first para produtos SaaS. Tokens semânticos, white-label em quatro tokens e wrappers React finos sobre um núcleo CSS que funciona em qualquer framework.',
      'pt_BR',
    ],
  ]) {
    const head = headOf(`${locale}.html`);
    assert.ok(head.includes(`<title>${title}</title>`));
    assert.ok(head.includes(`<meta name="description" content="${description}"/>`));
    assert.ok(head.includes(`<link rel="canonical" href="${origin}/${locale}"/>`));
    assert.ok(head.includes(`<link rel="alternate" hrefLang="en" href="${origin}/en"/>`));
    assert.ok(head.includes(`<link rel="alternate" hrefLang="pt-BR" href="${origin}/pt-BR"/>`));
    assert.ok(head.includes(`<link rel="alternate" hrefLang="x-default" href="${origin}/en"/>`));
    assert.ok(head.includes('<meta property="og:type" content="website"/>'));
    assert.ok(head.includes('<meta property="og:site_name" content="Lyra DS"/>'));
    assert.ok(head.includes(`<meta property="og:title" content="${title}"/>`));
    assert.ok(head.includes(`<meta property="og:description" content="${description}"/>`));
    assert.ok(head.includes(`<meta property="og:url" content="${origin}/${locale}"/>`));
    assert.ok(head.includes(`<meta property="og:locale" content="${openGraphLocale}"/>`));
    assert.ok(head.includes(`<meta property="og:image" content="${imageUrl}"/>`));
    assert.ok(head.includes('<meta property="og:image:width" content="1200"/>'));
    assert.ok(head.includes('<meta property="og:image:height" content="630"/>'));
    assert.ok(head.includes('<meta property="og:image:type" content="image/png"/>'));
    assert.ok(head.includes(`<meta property="og:image:alt" content="${imageAlt}"/>`));
    assert.ok(head.includes('<meta name="twitter:card" content="summary_large_image"/>'));
    assert.ok(head.includes(`<meta name="twitter:title" content="${title}"/>`));
    assert.ok(head.includes(`<meta name="twitter:description" content="${description}"/>`));
    assert.ok(head.includes(`<meta name="twitter:image" content="${imageUrl}"/>`));
    assert.ok(head.includes('<meta name="twitter:image:width" content="1200"/>'));
    assert.ok(head.includes('<meta name="twitter:image:height" content="630"/>'));
    assert.ok(head.includes('<meta name="twitter:image:type" content="image/png"/>'));
    assert.ok(head.includes(`<meta name="twitter:image:alt" content="${imageAlt}"/>`));
  }
});

test('exports metadata unique to each localized privacy route', () => {
  for (const [locale, title, description] of [
    [
      'en',
      'Privacy | Lyra DS',
      'How the Lyra DS site handles local preferences, hosting logs, and consent-based analytics.',
    ],
    [
      'pt-BR',
      'Privacidade | Lyra DS',
      'Como o site do Lyra DS lida com preferências locais, logs de hospedagem e métricas com consentimento.',
    ],
  ]) {
    const head = headOf(`${locale}/privacy.html`);
    assert.ok(head.includes(`<title>${title}</title>`));
    assert.ok(head.includes(`<meta name="description" content="${description}"/>`));
    assert.ok(head.includes(`<link rel="canonical" href="${origin}/${locale}/privacy"/>`));
    assert.ok(head.includes(`<link rel="alternate" hrefLang="en" href="${origin}/en/privacy"/>`));
    assert.ok(
      head.includes(`<link rel="alternate" hrefLang="pt-BR" href="${origin}/pt-BR/privacy"/>`),
    );
    assert.ok(
      head.includes(`<link rel="alternate" hrefLang="x-default" href="${origin}/en/privacy"/>`),
    );
  }
});

test('emits a 1200 by 630 PNG Open Graph image', () => {
  const imagePath = resolve(outRoot, 'og.png');
  const image = readFileSync(imagePath);

  assert.equal(existsSync(imagePath), true);
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});

test('emits crawler discovery files and a self-only hosting policy', () => {
  assert.equal(
    readExport('robots.txt'),
    'User-Agent: *\nAllow: /\n\nSitemap: https://lyra-ds.dev/sitemap.xml\n',
  );

  const sitemap = readExport('sitemap.xml');
  for (const path of ['/en', '/pt-BR', '/en/privacy', '/pt-BR/privacy']) {
    assert.ok(sitemap.includes(`<loc>${origin}${path}</loc>`));
  }
  assert.equal((sitemap.match(/hreflang="en"/g) ?? []).length, 4);
  assert.equal((sitemap.match(/hreflang="pt-BR"/g) ?? []).length, 4);
  assert.equal((sitemap.match(/hreflang="x-default"/g) ?? []).length, 4);
  assert.equal(sitemap.includes('<lastmod>'), false);

  const headers = readFileSync(resolve(siteRoot, 'public/_headers'), 'utf8');
  assert.match(headers, /Content-Security-Policy: default-src 'self'/);
  assert.match(headers, /script-src 'self' 'unsafe-inline'/);
  assert.match(headers, /style-src 'self'/);
  assert.match(headers, /font-src 'self'/);
  assert.match(headers, /img-src 'self' data:/);
  assert.match(headers, /frame-src 'none'/);
  assert.match(headers, /connect-src 'self'/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /Referrer-Policy: strict-origin-when-cross-origin/);
  assert.match(headers, /Permissions-Policy:/);
  assert.match(headers, /\/og\.png\n  Content-Type: image\/png/);
});

test('keeps the site layout contained and its chrome touch-safe on narrow viewports', () => {
  const css = readFileSync(resolve(siteRoot, 'app/site.css'), 'utf8');
  const deploy = readFileSync(resolve(siteRoot, 'DEPLOY.md'), 'utf8');

  assert.match(css, /\.lw-theming > \*\s*\{\s*min-width: 0;/);
  assert.match(
    css,
    /@media \(max-width: 428px\)\s*\{[\s\S]*?\.lw-fw-grid\s*\{\s*grid-template-columns: 1fr;/,
  );
  assert.match(
    css,
    /@media \(max-width: 428px\)\s*\{[\s\S]*?\.lw-site-header \.lyra-navbar__nav\s*\{\s*flex-wrap: wrap;/,
  );
  assert.match(
    css,
    /@media \(pointer: coarse\), \(any-pointer: coarse\), \(max-width: 1180px\)[\s\S]*?\.lw-site-footer \.lw-footer__link[\s\S]*?min-height: 44px;/,
  );
  assert.match(css, /\.lw-show__stage \.lw-show__input/);

  // Assert the RATIONALE survives, not the sentence that carries it. A regex on prose makes
  // documentation immutable: rewording it breaks CI while the guard's real purpose — that
  // nobody strips the explanation and later "hardens" the directive away — is untouched.
  assert.match(deploy, /`img-src`/);
  assert.match(deploy, /`data:`/);
  assert.match(deploy, /`script-src`/);
  assert.match(deploy, /'unsafe-inline'/);
});

test('keeps the English and Brazilian Portuguese message key sets identical', () => {
  const english = JSON.parse(readFileSync(resolve(siteRoot, 'messages/en.json'), 'utf8'));
  const portuguese = JSON.parse(readFileSync(resolve(siteRoot, 'messages/pt-BR.json'), 'utf8'));

  assert.deepEqual(Object.keys(english).sort(), Object.keys(portuguese).sort());
});
