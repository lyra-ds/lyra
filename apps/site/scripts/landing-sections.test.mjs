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
      tokenDeclarations: 211,
      tokenNames: 154,
      palettePrimitives: 43,
      semanticTokens: 111,
      cssClasses: 433,
      documentedComponents: 74,
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
    assert.match(page, /111 semantic tokens|111 tokens semânticos/);
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

test('exports bilingual privacy pages with one heading and the complete privacy copy', () => {
  for (const [
    locale,
    title,
    updated,
    who,
    storage,
    noTracking,
    host,
    analytics,
    change,
    rights,
  ] of [
    [
      'en',
      'Privacy',
      'Last updated: 1 August 2026',
      'Lyra DS is maintained by Francisross Soares de Oliveira. For anything on this page, write to security@francisross.com.br, or open a thread in GitHub Discussions if your question does not need to be private.',
      "Both lyra-ds.dev and docs.lyra-ds.dev keep two values in your own browser: your light or dark theme choice, and the answer you gave the consent banner. Each domain has its own browser storage, so a choice on one does not carry to the other. Neither value is a cookie or sent anywhere, and clearing a site's browser storage removes its two values.",
      'Before you allow analytics, it loads no analytics script, no advertising, no social widgets and no fonts from anyone else\'s server. Choosing "only essentials" keeps it that way. It does not build a profile of you.',
      "Both lyra-ds.dev and docs.lyra-ds.dev are served by hosting providers. Like every web server on the internet, their providers record the requests they answer: your IP address, the time, the page and your browser's user agent. We do not control those logs and do not use them to identify anyone.",
      'Only after you allow it on the banner, OpenPanel runs from infrastructure self-hosted by the maintainer, so these measurements do not go to a third-party company. It counts page views and events, does not record sessions and does not build a profile of you. Choosing "only essentials" keeps it off.',
      'Clear this site\'s data in your browser settings and the banner will ask again on your next visit. Choosing "only essentials" has the same effect as never accepting.',
      'Brazilian law (LGPD) gives you the right to confirm whether your data is processed, to access it, to correct it, to have it deleted, to take it elsewhere, and to withdraw consent. In practice, almost all of it is already in your hands: the two values above are yours to delete, and the analytics do not identify you or build a profile. For the hosting log, or for anything else, use the contact above.',
    ],
    [
      'pt-BR',
      'Privacidade',
      'Última atualização: 1 de agosto de 2026',
      'O Lyra DS é mantido por Francisross Soares de Oliveira. Para qualquer coisa desta página, escreva para security@francisross.com.br, ou abra um tópico no GitHub Discussions se a sua pergunta não precisar ser privada.',
      'Tanto lyra-ds.dev quanto docs.lyra-ds.dev guardam dois valores no seu próprio navegador: sua escolha de tema claro ou escuro, e a resposta que você deu ao banner de consentimento. Cada domínio tem seu próprio armazenamento no navegador, então uma escolha em um não passa para o outro. Nenhum valor é cookie ou é enviado a lugar nenhum, e limpar o armazenamento de um site remove os dois valores dele.',
      'Antes de você permitir métricas, não carrega script de métricas, publicidade, widget de rede social nem fonte do servidor de ninguém. Escolher "apenas o essencial" mantém assim. Não monta um perfil sobre você.',
      'Tanto lyra-ds.dev quanto docs.lyra-ds.dev são servidos por provedores de hospedagem. Como todo servidor web da internet, os provedores registram as requisições que respondem: seu endereço IP, o horário, a página e o agente do seu navegador. Não controlamos esses registros e não os usamos para identificar ninguém.',
      'Somente depois de você permitir no banner, o OpenPanel roda em infraestrutura hospedada pelo mantenedor, então essas medições não vão para uma empresa terceira. Ele conta visualizações de página e eventos, não grava sessões e não monta um perfil sobre você. Escolher "apenas o essencial" mantém tudo desligado.',
      'Limpe os dados deste site nas configurações do navegador e o banner pergunta de novo na próxima visita. Escolher "apenas o essencial" tem o mesmo efeito de nunca ter aceitado.',
      'A LGPD garante a você confirmar se há tratamento dos seus dados, acessá-los, corrigi-los, pedir a eliminação, levá-los a outro lugar e revogar o consentimento. Na prática, quase tudo já está na sua mão: os dois valores acima são seus para apagar, e as métricas não identificam você nem montam um perfil. Para o registro da hospedagem, ou para qualquer outra coisa, use o contato acima.',
    ],
  ]) {
    const page = readFileSync(resolve(siteRoot, 'out', locale, 'privacy.html'), 'utf8');
    const text = page.replaceAll('&quot;', '"').replaceAll('&#x27;', "'");

    assert.equal((page.match(/<h1/g) ?? []).length, 1);
    for (const copy of [
      title,
      updated,
      who,
      storage,
      noTracking,
      host,
      analytics,
      change,
      rights,
    ]) {
      assert.ok(text.includes(copy), `${locale} privacy export is missing: ${copy}`);
    }
    assert.match(page, new RegExp(`href=\"/${locale}/privacy\"`));
  }
});
