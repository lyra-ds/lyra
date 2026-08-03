# Lot — og:image do site em URL estável `/og.png` (WhatsApp não parseia a atual)

## Goal

O preview do WhatsApp não carrega para `https://lyra-ds.dev` (GitHub/Facebook
carregam). Diagnóstico em produção: o `og:image` aponta para
`https://lyra-ds.dev/opengraph-image?<hash>` — URL sem extensão de imagem e com
query — e a resposta vem sem `Content-Length`. O parser do WhatsApp é
notoriamente frágil com URLs de imagem sem extensão. Entregar o mesmo card em
uma URL estável `https://lyra-ds.dev/og.png` (com extensão, sem query) e fazer
todas as meta tags (Open Graph e Twitter) apontarem para ela.

Somente `apps/site`. O app de docs fica fora.

## Context

- `apps/site/app/opengraph-image.tsx` — file convention do Next que gera o card
  (ImageResponse, `force-static`, 1200×630) e injeta as meta tags com a URL
  hasheada. IMPORTANTE: metadata de file convention tem PRIORIDADE sobre
  metadata de config no Next — enquanto esse arquivo existir como convention,
  um `openGraph.images` manual no layout NÃO vence. A solução precisa remover a
  convention (o arquivo pode virar outra coisa — ver Requirements).
- `apps/site/app/layout.tsx` — tem `metadataBase: new URL('https://lyra-ds.dev')`.
- `apps/site/app/[lang]/layout.tsx` — metadata por locale (title/description/
  canonical/hreflang/og/twitter). É o lugar natural do `openGraph.images` e
  `twitter.images` explícitos.
- `apps/site/scripts/_headers.template` — tem uma entrada `/opengraph-image`
  com `Content-Type: image/png` (existia porque a URL não tinha extensão).
- `apps/site/scripts/metadata-deploy.test.mjs` — asserta hoje:
  `og:image == https://lyra-ds.dev/opengraph-image` (e twitter:image), o PNG
  1200×630 em `out/opengraph-image`, e a regra `/opengraph-image` +
  `Content-Type: image/png` no `_headers`. Precisa acompanhar a URL nova.
- O export é estático (`next build` → `apps/site/out/`). Route handlers com
  `export const dynamic = 'force-static'` são suportados no export estático:
  um diretório `app/og.png/route.tsx` com `GET` retornando o `ImageResponse`
  emite o arquivo `out/og.png`. Essa é a forma recomendada aqui.

## Requirements

1. O card (mesmo JSX de hoje: navy `#121430`, LYRA / Design System / tagline,
   estrela `#5B5BD6` à direita) passa a ser servido em `/og.png`. Não mudar o
   desenho — só a URL. 1200×630, `contentType image/png`.
2. `apps/site/app/opengraph-image.tsx` deixa de existir como file convention
   (nenhuma meta tag `/opengraph-image?...` pode sobrar no HTML final).
3. Meta tags explícitas via metadata config (no `[lang]/layout.tsx`):
   `openGraph.images = [{ url: '/og.png', width: 1200, height: 630, alt: <o
alt atual>, type: 'image/png' }]` e `twitter.images` equivalente — o
   `metadataBase` resolve para a URL absoluta. O HTML exportado deve conter
   `og:image` EXATAMENTE `https://lyra-ds.dev/og.png` (sem query) e os
   `og:image:width/height/type/alt` correspondentes; idem `twitter:image*`.
4. `_headers.template`: a entrada `/opengraph-image` vira `/og.png` (mantém o
   `Content-Type: image/png` explícito — reforço de robustez de crawler).
5. `metadata-deploy.test.mjs` atualizado: URL nova nas asserções de og/twitter,
   PNG 1200×630 lido de `out/og.png`, regra do `_headers` na URL nova. As
   demais asserções (canonical, hreflang, sitemap, robots, etc.) intocadas.
6. Nada de arquivo binário commitado: o PNG continua gerado no build.

## Test laws

- Teste o comportamento, nunca o mock; teste falhando = conserte o código;
  nenhum flag só-de-teste em produção.

## Acceptance criteria

- `pnpm --filter @lyra-ds/site run build` verde (rodar com
  `NODE_OPTIONS=--max-old-space-size=4096`).
- `out/og.png` existe, PNG, 1200×630; `grep -c "opengraph-image" out/en.html`
  retorna 0; `grep -c "https://lyra-ds.dev/og.png" out/en.html` ≥ 2 (og +
  twitter).
- `node --test apps/site/scripts/metadata-deploy.test.mjs` verde (precisa do
  build feito antes — o teste lê `out/`).
- `pnpm exec prettier --check` limpo nos arquivos tocados.

## Boundaries

- Tocar somente: `apps/site/app/opengraph-image.tsx` (remover/mover),
  `apps/site/app/og.png/route.tsx` (novo), `apps/site/app/[lang]/layout.tsx`,
  `apps/site/scripts/_headers.template`,
  `apps/site/scripts/metadata-deploy.test.mjs`.
- NÃO tocar em `apps/docs`, no desenho do card, em `generate-headers.mjs`, nem
  em qualquer outro teste.
- Não commitar.

## Expected evidence

Arquivos tocados; output real do build, dos greps do aceite e do `node --test`;
incertezas declaradas como incerteza.

## Stop conditions

Pare e relate se: o export estático recusar o route handler `force-static`
(erro de build); o Next continuar emitindo meta tags da convention após a
remoção; o mesmo comando falhar duas vezes; ou o fix pedir arquivos fora dos
Boundaries.
