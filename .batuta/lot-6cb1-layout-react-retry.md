# Retry: wrappers de layout — 1 correção

Leia `.batuta/lot-6cb1-layout-react.md` primeiro. A implementação está boa e a regra principal
foi respeitada (só custom properties, zero aparência no `style`). Uma correção, e um item que
já resolvi por você.

## 1. Os defaults do CSS não podem estar duplicados no JS

Hoje o wrapper decide se emite comparando com o valor default:

```ts
if (gap !== 4) …
if (direction !== 'column') …
if (align && align !== 'stretch') …
if (justify && justify !== 'flex-start') …
if (columns !== 2) …            // Grid
```

Isso codifica **em JS** os defaults que já vivem no CSS
(`packages/styles/components/layout/layout.css`). São duas fontes da verdade para o mesmo
valor, e elas podem divergir em silêncio: se o default de `.lyra-stack` no CSS virar
`var(--space-3)`, um `<Stack gap={4}>` passaria a renderizar space-3 — porque o JS acha que 4
é o default e não emite nada. O consumidor pediu 4 e recebeu 3, sem erro em lugar nenhum.

**Correção:** emita quando a prop foi **passada**, não quando ela difere do default. Tire os
defaults do destructure para essas props e teste `!== undefined`:

```ts
if (direction !== undefined) variableStyle['--lyra-stack-direction'] = direction;
if (gap !== undefined) variableStyle['--lyra-stack-gap'] = typeof gap === 'number' ? `var(--space-${gap})` : gap;
if (align !== undefined) …
if (justify !== undefined) …
```

Consequências, todas desejadas:

- `<Stack />` continua **sem `style`** — todas as props são `undefined`. O teste que prova isso
  segue valendo e não muda.
- `<Stack gap={4} />` passa a emitir `--lyra-stack-gap: var(--space-4)`. É redundante com o CSS
  e inofensivo — e agora é o consumidor mandando, não o JS adivinhando.
- O JS deixa de saber qualquer default de aparência. O CSS é a única fonte.

Casos que **não** mudam:

- `wrap` é booleano; `if (wrap)` está certo — ausência já significa `nowrap`, não há default
  duplicado.
- Os defaults do **`Inline`** (`direction="row"`, `wrap`, `align="center"`, `gap={2}`) são
  semântica do próprio Inline, não defaults do CSS. Ficam no JS e continuam sendo emitidos
  explicitamente.
- `minItem` vencendo `columns` no Grid fica; só o `columns !== 2` vira `columns !== undefined`.

Mantenha o JSDoc dizendo qual é o default efetivo (o docgen publica isso na tabela de props);
só deixe claro que ele vem da folha de estilos.

**Acrescente um teste** que trave a correção: `<Stack gap={4} />` deve emitir
`--lyra-stack-gap: var(--space-4)` no atributo `style`. Com o código antigo ele falha, que é o
ponto.

## 2. O docgen já está resolvido — não mexa

Você parou em `node tools/docgen/generate.mjs --check` por não haver categoria de handoff para
`Container`, e respeitou a fronteira de `tools/**`, que foi o certo.

A causa era minha: `handoff/components/layout/` tinha só o CSS, sem os `.d.ts` de onde o docgen
tira a categoria. Já copiei os `.d.ts` e adicionei `'Layout'` ao `CATEGORY_ORDER`. **Ignore o
critério 9** nesta rodada — não rode nem tente consertar o docgen; eu rodo na integração.

## Mantido

Todo o resto: Boundaries (nada em `packages/styles/**`, nada em `tools/**`, nada em
`apps/docs/**`), Conventions, test laws, e os demais critérios de aceite. Rode e reporte com
saída real: build do React, typecheck, lint e size-limit. Browser Mode segue não verificável no
seu sandbox — não relate teste como verificado.
