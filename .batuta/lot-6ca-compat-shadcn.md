# Task: guia compat-shadcn no site de docs (bilíngue)

## Goal

Escrever o guia da camada de compatibilidade com shadcn/ui, em inglês e pt-BR. Ele explica
o que `@lyra-ds/styles/compat-shadcn.css` faz, como ligá-la, e — a parte mais importante —
a colisão de nome em `--accent`, que tem uma armadilha cara.

## Context

Trabalhe da raiz do repositório. Não commite.

### A infra de guias já existe

Três guias foram entregues antes deste. Leia antes de escrever:

- `apps/docs/lib/guides.ts` — o manifesto; adicionar um guia é **uma entrada**.
- `apps/docs/content/docs/en/guides/plain-html.mdx` e o par pt-BR — o guia mais próximo em
  formato e tom. Siga-o.
- `apps/docs/messages/en.json` / `pt-BR.json` — strings de nav.

**Sem `<Example>` neste guia** (mesma razão do plain-html: exemplo renderiza JSX). Use fences
`css e `html. Não crie nada em `components/examples/` nem toque no registro.

### A fonte: `packages/styles/compat-shadcn.css`

Leia o arquivo. Ele mapeia **19 variáveis** do shadcn para tokens Lyra, num único bloco
`:root, [data-theme="dark"]`, e **nunca** é importado pelo `styles.css`.

Ponto que merece explicação no guia: o bloco é o mesmo para claro e escuro **porque os
valores são `var()` apontando para tokens semânticos do Lyra, que já re-derivam por tema**.
Não é descuido, é o que torna o mapeamento de uma linha só suficiente.

Import: sempre **depois** do `styles.css`. Subpath: `@lyra-ds/styles/compat-shadcn.css`
(exposto no `exports`; confira).

### A colisão de `--accent` — o coração do guia, medido

`--accent` existe nos **dois** sistemas com significados diferentes:

- no shadcn é a **superfície sutil de hover** de item de menu, dropdown e command;
- no Lyra é a **cor de marca**, lida por todo componente.

O compat mapeia `--accent-foreground` e **não** mapeia `--accent`. Consequência medida: o par
accent do shadcn fica em **1.34:1 no claro** e **1.96:1 no escuro** — indigo sobre indigo.

**A armadilha:** o conserto óbvio, mapear `--accent` no `:root`, **destrói o Lyra**. Medido:
com `--accent: var(--surface-sunken)` no `:root`, o botão primário do próprio Lyra vira
`rgb(241,245,249)` em vez de `rgb(91,91,214)`, e o `--primary` do shadcn (que é
`var(--accent)`) desaba junto para **1.09:1**. É a mesma custom property; não dá para
reapontá-la globalmente. **A omissão no compat é correta por necessidade, não descuido** —
diga isso no guia.

**A saída que funciona, e que o guia deve ensinar:** um override **escopado** na subárvore do
shadcn. Medido funcionando — dentro do escopo o accent vira cinza e o par atinge AA; fora, o
botão Lyra segue indigo:

```css
.shadcn-scope {
  --accent: var(--surface-sunken);
}
```

O leitor envolve os componentes do shadcn nesse escopo. Explique o porquê (a colisão), não só
o como.

Tudo isso está fixado em `packages/styles/tests/compat-shadcn.test.ts` — leia o teste; ele é
a fonte autoritativa e tem os números.

### O que o compat NÃO faz

Ele mapeia **cor e raio**. Não entrega classe de componente shadcn, não mapeia espaçamento,
tipografia, sombra nem animação — os componentes do shadcn trazem as classes Tailwind deles;
esta camada só troca a pele de cor. Variáveis do shadcn fora das 19 (por exemplo `--chart-*`
e `--sidebar-*`) não são mapeadas.

### Tailwind

O consumidor tipicamente liga isso no Tailwind v4 com `@theme inline` ou usando
`bg-[var(--background)]` direto. Documente a ligação do lado do consumidor, e deixe explícito
que **isso não traz Tailwind para dentro do Lyra** — o core não tem e não terá Tailwind.

## Conventions

Do `.batuta/profile.md` e da cadeia react → generic:

- Prosa em inglês no arquivo EN, pt-BR no pt-BR. Token, classe e API em inglês nos dois.
- Tom direto, segunda pessoa, sentence case, sem emoji. Siga o `plain-html.mdx`.
- Mude só o que o brief pede; toda linha rastreia ao brief.
- Nunca reformate o que não foi pedido; nunca adicione dependência.
- Nunca silencie sinal.

## Acceptance criteria

1. Entrada nova em `apps/docs/lib/guides.ts`; chave de título nos **dois** arquivos de
   mensagem, traduzida.
2. `apps/docs/content/docs/en/guides/compat-shadcn.mdx` e o par pt-BR, com frontmatter no
   formato dos guias existentes.
3. O guia mostra o import correto e diz que ele vai **depois** do `styles.css`.
4. O guia explica por que um único bloco serve aos dois temas.
5. O guia documenta a colisão de `--accent`: o que é, o número medido, **por que o conserto
   global quebra o Lyra**, e o override escopado como saída — com o CSS.
6. O guia diz o que a camada não cobre (classes, espaçamento, tipografia, sombra, animação,
   variáveis fora das 19).
7. O guia menciona a ligação com Tailwind do lado do consumidor e deixa claro que o core não
   usa Tailwind.
8. **Nenhum** arquivo em `apps/docs/components/examples/`; o registro não é modificado.
9. `pnpm --filter @lyra-ds/docs run build` passa e lista as 2 rotas novas; `pnpm run lint`
   passa (ignore falhas em `.batuta/lot-*.md`, são meus).
10. Nenhuma afirmação contradiz `compat-shadcn.css` ou `compat-shadcn.test.ts`. Toda variável
    citada existe no arquivo — confira uma por uma.

## Boundaries

- `packages/**` — não toque em nada, nem no CSS nem no teste.
- `apps/docs/components/examples/**`, `apps/docs/lib/components.ts`,
  `apps/docs/content/docs/*/components/**`.
- Os outros três guias (`getting-started`, `white-label`, `plain-html`).
- `apps/docs/app/site.css` — não deve precisar. Se achar que precisa, **pare e relate**.
- `apps/docs/next-env.d.ts`, `.next/`, `out/`, `node_modules/`, `pnpm-lock.yaml`, `handoff/`,
  `.github/`, `.batuta/worktrees/`.
- Sem dependência nova.

## Expected evidence

Arquivos tocados; comandos rodados **com saída real**; como conferiu cada variável citada
contra o CSS e o teste; incertezas declaradas. Seu sandbox não roda navegador — não relate
como verificado nada que dependa de renderização.

## Stop conditions

A forma do código contradiz o brief; o mesmo comando falha duas vezes; a correção exigiria
editar algo em Boundaries.

## Method

Se tiver fluxo próprio de testes/TDD, use-o; senão trabalhe pelos critérios de aceite,
verificando cada um antes de declarar pronto.
