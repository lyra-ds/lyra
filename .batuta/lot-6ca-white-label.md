# Task: guia white-label no site de docs (bilíngue)

## Goal

Escrever o guia de white-label do Lyra DS no site de docs, em inglês e pt-BR, com uma
**demo viva de 3 brands × tema claro/escuro**. O guia ensina a trocar a marca do sistema
inteiro sobrescrevendo 4 tokens, e diz honestamente o que o contrato NÃO faz.

## Context

Trabalhe da raiz do repositório. Não commite.

### A infra de guias já existe — use, não recrie

Um guia foi entregue antes deste (`getting-started`) e criou o caminho completo. Leia estes
arquivos antes de escrever qualquer coisa:

- `apps/docs/lib/guides.ts` — o manifesto. Adicionar um guia é **uma entrada** aqui.
- `apps/docs/components/guide-page.tsx` — como o MDX é carregado e como `<Example>` é
  resolvido.
- `apps/docs/content/docs/en/guides/getting-started.mdx` e o par em `pt-BR/` — o formato de
  prosa, frontmatter e tom a seguir.
- `apps/docs/components/examples/index.ts` — o registro de exemplos.
- `apps/docs/components/examples/dialog/basic.tsx` — o formato de um arquivo de exemplo.
- `apps/docs/messages/en.json` e `messages/pt-BR.json` — as strings de chrome.

Uma página de componente (`content/docs/en/components/button.mdx`) é boa referência de
prosa e de uso do `<Example>`, mas **não copie a estrutura dela**: um guia não tem
`PropTable` (o `GuidePage` não injeta esse componente de propósito) nem seção de props.

### O contrato white-label — a fonte da verdade

`packages/styles/tokens/brand.css`. Leia o arquivo. Resumo do que ele garante, para você
não afirmar nada além:

O consumidor põe o atributo `data-brand` num elemento e define **até 4 tokens**:

| Token              | Default se ausente                           |
| ------------------ | -------------------------------------------- |
| `--brand`          | (obrigatório — é a semente)                  |
| `--brand-contrast` | `#FFFFFF`                                    |
| `--brand-radius`   | `10px`                                       |
| `--brand-font`     | `"Plus Jakarta Sans", system-ui, sans-serif` |

E `[data-brand]` **re-deriva exatamente estes**, por `color-mix` em oklab:

- `--accent` = `var(--brand)` cru
- `--accent-hover` = brand + black 12% · `--accent-active` = brand + black 22%
- `--accent-soft` = brand 12% + `--surface-card`
- `--accent-soft-text` = brand + `--text-primary` 32%
- `--on-accent` = `var(--brand-contrast, #FFFFFF)`
- `--focus-ring` = brand 24% + transparent
- `--text-link` = `--accent` · `--border-accent` = `--accent`
- `--radius-md` = `var(--brand-radius, 10px)`
- `--font-sans` e `--font-display` = `var(--brand-font, …)`

No escuro (`[data-theme="dark"][data-brand]` **e** `[data-theme="dark"] [data-brand]`) as
misturas invertem para branco: accent white 14%, hover 26%, active 38%, `accent-soft` brand
18% + transparent, `accent-soft-text` white 45%, focus-ring 30%, `text-link` white 40%.

**O que ele NÃO faz** — e o guia precisa dizer: não re-deriva superfícies
(`--surface-*`), cores de texto, espaçamento, nem os outros raios além de `--radius-md`.
Não há sobrescrita de borda além de `--border-accent`.

O comportamento acima é provado por teste em
`packages/styles/tests/brand-theme.test.ts` — leia-o para confirmar qualquer afirmação
antes de escrevê-la. Se o teste não prova, não afirme.

### Dois fatos técnicos que você não deriva sozinho, e que definem a demo

1. **`[data-theme="dark"]` é seletor de atributo puro** em
   `packages/styles/tokens/colors.css` — **não** é escopado a `:root`. Funciona em qualquer
   elemento. O próprio teste o seta numa `div`. Ou seja: a demo pode mostrar claro e escuro
   **lado a lado na mesma página**, sem tocar no tema do site.
2. A regra escura de `brand.css` cobre `[data-theme="dark"][data-brand]` (mesmo elemento) e
   `[data-theme="dark"] [data-brand]` (descendente). Então aninhar
   `<div data-theme="dark"><div data-brand>` funciona, e pôr os dois no mesmo elemento
   também.

### Convenções do site de docs (regra travada do projeto)

- **Dogfooding**: onde existe componente em `@lyra-ds/react`, use o componente — nunca a
  classe `.lyra-*` crua. Ex.: `<Button>`, `<Card>`, `<Badge>`, `<Input>`.
- Classes `.lw-*` em `apps/docs/app/site.css` são **só** para layout do site. Se precisar de
  layout novo na demo, use uma classe `.lw-*` nova ali — **nunca `style={{}}` inline** para
  layout. Exceção legítima: definir os custom properties da marca
  (`style={{ '--brand': '#0D9488' }}`), que é valor de dado, não layout.
- Prosa em inglês no arquivo EN e pt-BR no arquivo pt-BR. Nomes de token, código e API
  sempre em inglês nos dois.
- Tom: direto, segunda pessoa ("você"), sentence case, sem emoji. Siga o
  `getting-started.mdx` que já está lá.

## Conventions

Do `.batuta/profile.md` e da cadeia de templates (react → generic):

- Monorepo pnpm, Node 24, TypeScript 5.9.3. React 19 no dev.
- Componentes: PascalCase no arquivo e no export, um componente principal por arquivo,
  colocado no padrão da pasta vizinha (olhe os vizinhos antes de criar).
- Nada de `any` — tipe props e retornos explicitamente.
- Sem class components. Sem segunda biblioteca de estado ou de estilo.
- Hooks com prefixo `use`, regras dos hooks respeitadas, array de dependências completo.
- Siga o estilo dos arquivos que você tocar — naming, formatação, ordem de import.
- Mude só o que o brief pede. **Toda linha alterada tem que rastrear direto ao brief.**
- Limpe só a sua própria sujeira: remova import/variável que a SUA mudança deixou sem uso.
  Código morto pré-existente fica — mencione no relatório em vez de apagar.
- Comentário só para constraint que o código não expressa; nunca para narrar o que a linha faz.
- Nunca reformate código que não foi pedido. Nunca adicione dependência.
- Nunca silencie sinal: sem cast que cala tipo, sem catch vazio, sem sleep para consertar
  ordem. Se a causa raiz estiver fora de alcance, marque `// WORKAROUND: <razão>` e sinalize
  no relatório.

## Acceptance criteria

1. `apps/docs/lib/guides.ts` tem a entrada nova do guia; a chave de título correspondente
   existe em `messages/en.json` **e** `messages/pt-BR.json`, traduzida.
2. Existem `apps/docs/content/docs/en/guides/white-label.mdx` e o par em `pt-BR/`, com
   frontmatter (`title`, `description`) no formato do guia que já existe.
3. Existe pelo menos um exemplo vivo em `apps/docs/components/examples/white-label/`,
   registrado em `components/examples/index.ts` sob a chave `'white-label'`, e referenciado
   no MDX dos **dois** idiomas via `<Example id="…" />`.
4. A demo mostra **3 brands distintas × claro e escuro** — as 6 combinações visíveis ao
   mesmo tempo, ou alternáveis por controle na própria demo. Cada célula mostra componentes
   reais do DS reagindo à marca (no mínimo um `Button` primário, um foco visível e algo que
   use `--accent-soft`), não amostras de cor soltas.
5. O guia documenta os 4 tokens com seus defaults, mostra o CSS mínimo de uma marca, e
   explica a diferença entre pôr `data-brand` no `<html>` (app inteiro) e num contêiner
   (escopo parcial).
6. O guia tem uma seção honesta do que o contrato **não** re-deriva (superfícies, cores de
   texto, espaçamento, outros raios).
7. O guia orienta sobre contraste: `--on-accent` cai em `#FFFFFF` por default, então uma
   marca clara precisa de `--brand-contrast` explícito, senão o rótulo do botão primário
   fica ilegível.
8. `pnpm --filter @lyra-ds/docs run build` passa, e as 2 rotas novas aparecem na lista de
   páginas geradas (`/en/guides/white-label` e `/pt-BR/guides/white-label`).
9. `pnpm run lint` (prettier) passa.
10. Nenhuma afirmação do guia contradiz `brand.css` ou `brand-theme.test.ts`.

## Boundaries

Não toque em:

- `packages/styles/**` — o CSS é handoff-verbatim e travado; mexer nele quebra o gate de
  parity. O contrato de brand é dado, não negociável neste trabalho.
- `packages/react/**`.
- `apps/docs/content/docs/*/components/**` e `apps/docs/lib/components.ts` — páginas de
  componente não são deste trabalho.
- `apps/docs/content/docs/*/guides/getting-started.mdx` — guia de outro item.
- `apps/docs/next-env.d.ts` (gerado), `.next/`, `out/`, `node_modules/`, `pnpm-lock.yaml`,
  `handoff/`, `.github/`.
- Não adicione dependência nenhuma.

## Expected evidence

Relate, ao terminar:

- A lista de arquivos criados e modificados.
- Os comandos que você rodou, **com a saída real** — não o que você espera que eles diriam.
- Como você conferiu cada afirmação do guia contra `brand.css` / `brand-theme.test.ts`.
- O que ficou incerto, declarado como incerteza.

Aviso: seu sandbox não roda o navegador nem o Browser Mode do Vitest. **Não relate como
verificado nada que dependa de renderização real** — o maestro abre as páginas e confere.
Diga o que você conseguiu rodar e o que não conseguiu.

## Stop conditions

Pare e relate, em vez de improvisar, se:

- A forma do código contradisser este brief (ex.: o `GuidePage` não injetar `<Example>`).
- O mesmo comando falhar duas vezes.
- A correção exigir editar algo listado em Boundaries.

## Method

Se você tiver um fluxo de trabalho próprio de testes/TDD disponível, use-o; caso contrário,
trabalhe pelos critérios de aceite acima, verificando cada um antes de declarar pronto.
