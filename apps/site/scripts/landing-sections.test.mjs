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
      'Two values, both in your own browser, both readable only by this site: your light or dark theme choice, and the answer you gave the consent banner. Neither is a cookie, neither is sent anywhere, and clearing your browser storage removes both.',
      "It runs no analytics today. It loads no third-party scripts, no advertising, no social widgets and no fonts from anyone else's server. It builds no profile of you and sends nothing about you to us, because there is no server of ours to send it to — every page here is a static file.",
      "This site is served by a hosting provider, and like every web server on the internet, theirs records the requests it answers: your IP address, the time, the page and your browser's user agent. We do not control that log and do not use it to identify anyone. It is the one place where data about your visit exists at all, and saying otherwise would be untrue.",
      'It would only run after you allow it on the banner, and this page would name the provider and what it measures before it collects anything. Choosing "only essentials" keeps it off.',
      'Clear this site\'s data in your browser settings and the banner will ask again on your next visit. Choosing "only essentials" has the same effect as never accepting.',
      'Brazilian law (LGPD) gives you the right to confirm whether your data is processed, to access it, to correct it, to have it deleted, to take it elsewhere, and to withdraw consent. In practice, almost all of it is already in your hands: the two values above are yours to delete, and there is nothing on our side to request. For the hosting log, or for anything else, use the contact above.',
    ],
    [
      'pt-BR',
      'Privacidade',
      'Última atualização: 1 de agosto de 2026',
      'O Lyra DS é mantido por Francisross Soares de Oliveira. Para qualquer coisa desta página, escreva para security@francisross.com.br, ou abra um tópico no GitHub Discussions se a sua pergunta não precisar ser privada.',
      'Dois valores, os dois no seu próprio navegador, os dois legíveis apenas por este site: sua escolha de tema claro ou escuro, e a resposta que você deu ao banner de consentimento. Nenhum é cookie, nenhum é enviado a lugar nenhum, e limpar o armazenamento do navegador remove os dois.',
      'Não roda métricas hoje. Não carrega script de terceiro, nem publicidade, nem widget de rede social, nem fonte do servidor de ninguém. Não monta perfil sobre você e não nos envia nada a seu respeito, porque não existe servidor nosso para onde enviar — cada página aqui é um arquivo estático.',
      'Este site é servido por um provedor de hospedagem e, como todo servidor web da internet, o dele registra as requisições que responde: seu endereço IP, o horário, a página e o agente do seu navegador. Não controlamos esse registro e não o usamos para identificar ninguém. É o único lugar onde existe algum dado sobre a sua visita, e dizer o contrário seria mentira.',
      'Elas só rodariam depois de você permitir no banner, e esta página nomearia o provedor e o que ele mede antes de qualquer coleta. Escolher "apenas o essencial" mantém tudo desligado.',
      'Limpe os dados deste site nas configurações do navegador e o banner pergunta de novo na próxima visita. Escolher "apenas o essencial" tem o mesmo efeito de nunca ter aceitado.',
      'A LGPD garante a você confirmar se há tratamento dos seus dados, acessá-los, corrigi-los, pedir a eliminação, levá-los a outro lugar e revogar o consentimento. Na prática, quase tudo já está na sua mão: os dois valores acima são seus para apagar, e não há nada do nosso lado para requisitar. Para o registro da hospedagem, ou para qualquer outra coisa, use o contato acima.',
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
