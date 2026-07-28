# Lote 09 — texto visível traduzível (CookieBanner + FileManager)

Lote autossuficiente. Leia este arquivo inteiro antes de escrever qualquer
linha. É o lote irmão do 08 (`.batuta/lot-08-accessible-names.md` — NÃO precisa
lê-lo): aquele tratou nomes acessíveis; este trata **texto visível** em inglês
fixo. A decisão de shape é a mesma e está copiada abaixo.

## Goal

Todo texto **visível** que hoje é uma string inglesa fixa dentro de
`@lyra-ds/react` passa a ser sobrescrevível pelo consumidor, mantendo o inglês
como default. Nenhum comportamento muda; nenhum default muda. São dois
componentes: `CookieBanner` e `FileManager`.

## Por que isso é um defeito

Lyra é um design system white-label. Um produto em português que renderiza o
`CookieBanner` mostra a TODO visitante os botões `"Only essentials"` e
`"Accept all"` — num banner cuja razão de existir é a LGPD, lei brasileira. O
`FileManager` mostra `Name / Size / Modified` no cabeçalho, `Open / Rename /
Download / Delete` no menu de cada arquivo e `"3 items"` em cada pasta. Nada
disso tem saída hoje (o menu tem uma meia-saída: `actions` — mas ela
**substitui** o menu inteiro, ícones e separador inclusive, só para trocar
quatro palavras).

## Inventário completo — 10 strings em 2 componentes

Localize pelo símbolo, não pelo número de linha.

### `CookieBanner` — 2 props planas novas

Arquivo: `packages/react/src/cookie-banner/cookie-banner.tsx`. Os dois botões
do rodapé:

| texto atual       | prop nova                  | default             |
| ----------------- | -------------------------- | ------------------- |
| `Only essentials` | `essentialsLabel?: string` | `'Only essentials'` |
| `Accept all`      | `acceptLabel?: string`     | `'Accept all'`      |

Prop plana com default no destructure, igual ao `closeLabel` do Toast:

```tsx
/** Visible label of the essentials-only button. Default: `"Only essentials"`. */
essentialsLabel?: string;
/** Visible label of the accept-all button. Default: `"Accept all"`. */
acceptLabel?: string;
```

**Fora de escopo no CookieBanner:** a cópia LGPD default e o link
`"Privacy policy"` — o consumidor já substitui os dois por inteiro via
`children` (prop documentada). Não crie prop para eles.

### `FileManager` — 8 chaves novas em `FileManagerLabels`

Arquivo: `packages/react/src/file-manager/file-manager.tsx`. O componente já
tem o objeto `labels` (prop `labels?: FileManagerLabels`, merge raso sobre
`DEFAULT_FM_LABELS`) criado no Lote 08 para nomes acessíveis. **Estenda o mesmo
objeto** — não crie uma segunda prop; um componente, um lugar para strings:

| onde                                  | texto atual                   | chave nova                                            | default                          |
| ------------------------------------- | ----------------------------- | ----------------------------------------------------- | -------------------------------- |
| cabeçalho da lista (`.lyra-fm__head`) | `Name`                        | `headerName?: string`                                 | `'Name'`                         |
| cabeçalho da lista                    | `Size`                        | `headerSize?: string`                                 | `'Size'`                         |
| cabeçalho da lista                    | `Modified`                    | `headerModified?: string`                             | `'Modified'`                     |
| menu default (`defaultActions`)       | `Open`                        | `menuOpen?: string`                                   | `'Open'`                         |
| menu default                          | `Rename`                      | `menuRename?: string`                                 | `'Rename'`                       |
| menu default                          | `Download`                    | `menuDownload?: string`                               | `'Download'`                     |
| menu default                          | `Delete`                      | `menuDelete?: string`                                 | `'Delete'`                       |
| contagem de pasta (lista E grid)      | `` `${items ?? '—'} items` `` | `itemsCount?: (items: number \| undefined) => string` | `` (n) => `${n ?? '—'} items` `` |

Fatos que você não deve derivar errado:

- `itemsCount` tem de ser **função**, não string com placeholder: plural e
  ordem de palavras mudam entre idiomas. Ela recebe `number | undefined`
  (pasta sem `items` mostra `—` hoje) e o default reproduz **exatamente** o
  texto atual, incluindo o em-dash. A expressão aparece **duas vezes** na
  fonte — célula da lista e meta do card do grid — e as duas passam a usar a
  função.
- `defaultActions` é função de módulo que hoje recebe só `file`. Passe o
  objeto `labels` resolvido como parâmetro (ou mova a construção para dentro
  do componente); os `id`s (`open`, `rename`, `download`, `delete`), os ícones
  e o separador **não mudam** — só os `label`s.
- A semântica de `actions` (substituir o menu default por inteiro) **não muda
  neste lote**. Nada de "estender" o menu.
- O JSDoc de `FileManagerLabels` e da prop `labels` diz "Accessible names for
  the FileManager chrome" — com as chaves novas isso vira mentira. Reescreva
  para cobrir os dois usos, ex.: "Labels for the FileManager chrome —
  accessible names and visible text. Merged over the defaults, so partial
  objects work."
- `DEFAULT_FM_LABELS` é `Required<FileManagerLabels>` — as 8 chaves novas
  entram lá com os defaults exatos da tabela.
- O `<li className="lyra-fm__head">` é `aria-hidden="true"` e o quarto
  `<span />` vazio fica como está.
- JSDoc de cada chave nova no mesmo formato das existentes, inglês, com
  ``Default: `"Name"`.``

### Fora de escopo, deliberadamente

- `fmFormatBytes` (`B`, `KB`, `MB`, `GB`) — abreviações de unidade, ficam.
- `searchPlaceholder`, `emptyMessage` — já são props.
- Todos os nomes acessíveis — Lote 08, já entregue. Não toque neles.
- Qualquer outro componente. `Combobox`, `CommandPalette` etc. já tiveram seus
  textos tratados ou têm props próprias.

## Testes (obrigatórios, tests-after)

Runner: Vitest **Browser Mode** (chromium). Siga o arquivo vizinho de cada
componente (`cookie-banner.browser.test.tsx`, `file-manager.browser.test.tsx`)
— inclusive o padrão de limpar `localStorage` antes de montar o CookieBanner,
que os testes existentes já usam.

Para **cada** uma das 10 strings, dois testes:

1. **Default preservado** — sem a prop/chave, o texto visível é a string
   inglesa de hoje (asserte pelo texto renderizado: `getByRole('button',
{ name: 'Only essentials' })`, texto do cabeçalho, itens do menu aberto,
   `"3 items"` na célula).
2. **Override aplicado** — passando a prop/chave, o texto é o do consumidor
   (ex.: `essentialsLabel="Apenas essenciais"`). Para o merge do `labels`,
   pelo menos um teste passa objeto **parcial** e confirma que as demais
   chaves mantêm o default. Para `itemsCount`, confirme que o número chega à
   função (ex.: `itemsCount={(n) => \`${n} itens\`}`→`"3 itens"`).

Para os itens do menu, o teste abre o Dropdown (clique no gatilho de ações) e
asserta os `menuitem`s — os testes existentes do FileManager já fazem isso.

**Regras estruturais que já custaram uma rodada no Lote 08:** todo `it()` novo
vai **diretamente no corpo de um `describe`**, nunca dentro de outro `it()` e
nunca dentro de um `for` que gera testes — o Vitest recusa em runtime
("Calling the test function inside another test function is not allowed") e o
erro é invisível para typecheck/eslint/prettier.

**Leis de teste:** teste o comportamento, nunca o mock; teste vermelho =
conserte o código, não o teste; nenhum flag ou branch só-de-teste em código de
produção.

**Limite do seu sandbox:** você provavelmente NÃO consegue rodar o Browser
Mode (`pnpm test` precisa bindar localhost). Escreva os testes mesmo assim,
rode o que conseguir (typecheck, eslint, prettier, build) e **declare
explicitamente no relatório o que não rodou** — não reporte sucesso de teste
que não executou.

## Docs — 4 arquivos MDX

`apps/docs/content/docs/{en,pt-BR}/components/{cookie-banner,file-manager}.mdx`.

- Faça grep por prosa que afirme que esses textos são fixos/inglês sem saída e
  reescreva nas duas línguas dizendo o oposto (default inglês, prop traduz).
  Se nenhuma frase afirmar a limitação, adicione uma menção curta às props
  novas na seção mais pertinente (a de i18n/acessibilidade se existir).
- Os blocos "HTML puro" mostram `Only essentials` / `Accept all` etc. — isso
  **continua correto** (é o default) e não muda.
- **Não** mexa nas tabelas de props: são geradas do `props.json`.

## Gates — rode o que conseguir do `.github/workflows/ci.yml`

O gate real é o arquivo do CI (17 comandos em 4 jobs); leia-o inteiro. Dois
pontos específicos deste lote:

- **docgen**: props novas mudam os `.d.ts`, então rode
  `pnpm --filter @lyra-ds/react run build` e depois
  `node tools/docgen/generate.mjs` (SEM `--check`) para regenerar
  `tools/docgen/output/{props.json,llms.txt}`, e deixe a saída na árvore.
- **size-limit**: os rótulos custam bytes. Orçamento estourado → suba o limite
  **no mesmo diff**, com o motivo escrito no commit… que você não fará — anote
  no relatório.

## Changeset

Um changeset **minor** só em `@lyra-ds/react` (API nova, zero mudança em
`@lyra-ds/styles`, zero breaking — todo default preserva o texto de hoje).
Formato: veja `.changeset/command-palette.md`. Corpo em inglês, explicando o
defeito (texto visível sem saída num DS white-label) e listando as props/chaves
novas componente a componente.

## Fronteiras — não toque

- `handoff/**`, `packages/styles/**`, `pnpm-lock.yaml`, `dist/` (exceto como
  efeito do build), `node_modules/`,
  `packages/react/src/icon/icon-registry.ts` (gerado).
- Nenhum default novo: toda string default é **exatamente** a de hoje,
  caractere a caractere (inclusive `…` e `—` onde houver).
- Nenhum componente além de CookieBanner e FileManager.
- **Não comite.** Deixe a árvore suja para o maestro verificar.

## Evidência esperada (relatório final)

- Lista de arquivos tocados.
- Comandos rodados com saída real (resumida) e a lista explícita do que o
  sandbox não conseguiu rodar.
- Incertezas declaradas como incertezas.

## Condições de parada

Pare e reporte (em vez de improvisar) se: a forma do código contradisser este
brief (ex.: `labels`/`DEFAULT_FM_LABELS` não existirem como descritos), o
mesmo comando falhar duas vezes, ou o conserto exigir editar algo fora das
fronteiras.

## Convenções do projeto

- JSDoc canônico **em inglês** em toda prop nova; frase completa.
- `packages/react/CONVENTIONS.md` é a referência de conversão.
- Versões exatas, Node 24. Styling é sempre classe `.lyra-*` existente do
  pacote styles — nenhum CSS novo (este lote não toca estilo nenhum).
