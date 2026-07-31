# Task: wrappers React da camada de layout (Container, Stack/Inline, Grid, PageHeader)

## Goal

Portar quatro wrappers React sobre o CSS de layout que **já está no pacote**:
`Container`, `Stack` (+ `Inline`), `Grid` e `PageHeader`. Com testes, registro no build e
changeset.

## Context

Trabalhe da raiz do repositório. Não commite.

### O CSS já existe — os wrappers só ligam props a ele

`packages/styles/components/layout/layout.css` já está no `styles.css` e traz as classes.
**Leia esse arquivo antes de tudo.** Os wrappers não inventam aparência; eles traduzem props
para classe e custom property.

### A regra número um deste lote

`.lyra-stack` e `.lyra-grid` foram escritas com **custom properties e defaults**:

```css
.lyra-stack {
  display: flex;
  flex-direction: var(--lyra-stack-direction, column);
  gap: var(--lyra-stack-gap, var(--space-4));
  align-items: var(--lyra-stack-align, stretch);
  justify-content: var(--lyra-stack-justify, flex-start);
  flex-wrap: var(--lyra-stack-wrap, nowrap);
}
.lyra-grid {
  display: grid;
  grid-template-columns: var(--lyra-grid-columns, repeat(2, minmax(0, 1fr)));
  gap: var(--lyra-grid-gap, var(--space-4));
}
```

**O wrapper define APENAS as custom properties que diferem do default.** Ele **nunca** emite
`display`, `flexDirection`, `gap`, `gridTemplateColumns` nem qualquer declaração de aparência
no `style`. Um `<Stack>` sem props deve renderizar **sem nenhum style inline**.

Esse é o ponto inteiro do item anterior: os componentes do handoff punham a aparência num
`style` inline, o que nenhum adapter Vue, Blade ou LiveView consegue reaproveitar. Se você
recolocar as declarações no `style`, o trabalho foi desfeito.

Os nomes dessas custom properties são **API pública** (outro framework vai defini-las) e estão
fixados por `packages/styles/tests/layout.test.ts` — leia o teste.

### As fontes do handoff

Os componentes de referência estão em
`/home/franciscpd/Documents/design_handoff_lyra_v1_2/v1_1/components/layout/` — `Stack.jsx`,
`Grid.jsx`, `Container.jsx`, `PageHeader.jsx` e os `.d.ts`. Use-os para **API e
comportamento**, não para a técnica de estilo (que é justamente o que muda).

Regras de conversão que você não deriva sozinho:

- **`gap`**: número é passo da escala (`4` → `var(--space-4)`); string vai verbatim. Vale para
  Stack e Grid. Se o valor for igual ao default (4), **não emita a custom property**.
- **`wrap`**: booleano. `true` → `--lyra-stack-wrap: wrap`; `false` → não emite nada.
- **`Grid.columns`**: número → `repeat(N, minmax(0, 1fr))`; string → verbatim.
- **`Grid.minItem`**: número em px → `repeat(auto-fit, minmax(min(${minItem}px, 100%), 1fr))`.
  **`minItem` vence `columns`** quando os dois vêm (é o que o handoff faz).
- **`Inline`** é `Stack` com `direction="row"`, `wrap`, `align="center"` e `gap` default 2. Mora
  no **mesmo arquivo/subpath** do Stack, não num próprio.
- **`Container.max`**: define **`--container-max`** no elemento (não `max-width` inline como o
  handoff). É a mesma razão do resto: um adapter em outro framework define a mesma variável.
  Documente no JSDoc que isso cascateia para containers aninhados.
- **`Stack.as`**: polimórfico, default `div`. Tipar sem `any`.
- **`PageHeader`**: `eyebrow`/`title`/`description`/`actions` + `children` abaixo da linha
  principal (slot de tabs). Estrutura exata no `PageHeader.jsx` do handoff. Renderiza
  `<header>`, título em `<h1>`.

### Convenções do pacote React

- Um diretório por componente em `packages/react/src/<slug>/`, com `<slug>.tsx` e `index.ts`.
  Veja `packages/react/src/card/` como molde (arquivo, barrel, testes).
- `forwardRef`, `/*#__PURE__*/`, `cx` de `../internal/cx`.
- **JSDoc em inglês em toda prop** — o docgen lê isso e gera a tabela de props do site. Prop
  sem JSDoc vira linha vazia na documentação.
- **NÃO escreva `'use client'`.** O `onSuccess` do tsup prepende a diretiva em todo chunk
  emitido, e há gate (`tools/dist-scan/assert-use-client.mjs`) conferindo. Escrever à mão é
  ruído.
- Nada de `any`. Nada de classe. Nada de CSS novo — o CSS está pronto.

### Registro no build (cada um é um gate do CI)

Para cada componente novo:

1. `packages/react/src/index.ts` — exportar componente e tipo (siga o padrão do Card).
2. `packages/react/package.json` → `exports`: subpath novo no formato dos 40 existentes.
3. `packages/react/tsup.config.ts` → `entry`: a **chave** é o basename do dist e tem de casar
   com o subpath do exports. Contrato 1:1 verificado por publint/attw.
4. `packages/react/package.json` → `size-limit`: entrada nova. **Meça** com
   `pnpm --filter @lyra-ds/react exec size-limit` e ponha o limite com folga pequena; não
   chute.
5. Changeset (`.changeset/*.md`), minor em `@lyra-ds/react`.

## Conventions

Do `.batuta/profile.md` e da cadeia react → generic:

- Monorepo pnpm, Node 24, TypeScript 5.9.3, React 19 no dev / peer >=18.
- Siga o estilo dos arquivos vizinhos — naming, formatação, ordem de import.
- Mude só o que o brief pede; toda linha rastreia ao brief.
- Limpe só a sua própria sujeira; código morto pré-existente fica, mencione no relatório.
- Comentário só para constraint que o código não expressa.
- Nunca reformate o que não foi pedido; nunca adicione dependência.
- Nunca silencie sinal: sem cast que cala tipo, sem catch vazio. Causa raiz fora de alcance →
  `// WORKAROUND: <razão>` e sinalize no relatório.

## Test laws

- Teste o comportamento, nunca o mock.
- Teste vermelho significa consertar o código, não o teste.
- Sem flag ou branch só-para-teste no código de produção.
- **Asserção de existência no Browser Mode exige `await expect.element(...).toBeInTheDocument()`.**
  `expect(screen.getByRole(...)).not.toBeNull()` **nunca falha** — o locator é lazy e é objeto
  sempre. Isso já custou uma rodada inteira neste projeto.

Cada componente precisa de `<slug>.browser.test.tsx` e `<slug>.ssr.test.ts`, no formato dos
vizinhos. Cobertura mínima:

- Um `<Stack>` sem props renderiza **sem atributo `style`** (é a prova da regra número um).
- Cada prop do Stack emite só a sua custom property, com o valor esperado.
- `gap` numérico vira `var(--space-N)`; `gap` string vai verbatim.
- `Inline` produz row + wrap + center.
- `Grid` com `columns` numérico, com `columns` string, e `minItem` vencendo `columns`.
- `Container` com e sem `max`.
- `PageHeader` com e sem cada slot; título é `<h1>`; `children` aparece depois da linha.

## Acceptance criteria

1. Os 4 diretórios existem em `packages/react/src/` no molde do `card/`.
2. Um `<Stack>` com props default renderiza **sem `style`**; idem `<Grid>`.
3. Nenhum wrapper emite declaração de aparência no `style` — só custom property.
4. Barrel, exports map, entry do tsup e size-limit atualizados para os 4.
5. Changeset minor em `@lyra-ds/react`.
6. `pnpm --filter @lyra-ds/react run build` passa e o dist tem os 4 arquivos novos.
7. `pnpm run typecheck`, `pnpm run lint`, `pnpm --filter @lyra-ds/react run lint` passam
   (ignore falhas em `.batuta/lot-*.md`, são meus).
8. `pnpm --filter @lyra-ds/react exec size-limit` passa com os limites que você mediu.
9. `node tools/docgen/generate.mjs --check` — se acusar drift, rode sem `--check` e commite a
   saída regenerada junto (é gerada do dist).
10. Zero `any`; zero `'use client'` escrito à mão; zero CSS novo.

## Boundaries

- `packages/styles/**` — **nada**. O CSS está pronto e é travado.
- `tools/**`, exceto rodar o docgen conforme o critério 9.
- `apps/docs/**` — a documentação destes componentes é outro item.
- Os 40 componentes existentes em `packages/react/src/` — não toque.
- `handoff/**`, `.github/**`, `pnpm-lock.yaml`, `.batuta/worktrees/**`.
- Sem dependência nova.

## Expected evidence

- Arquivos criados e modificados.
- Comandos rodados **com a saída real** — incluindo os números do size-limit.
- Como conferiu que o Stack default não emite `style`.
- Incertezas declaradas.

Seu sandbox **não roda o Browser Mode do Vitest** (não consegue bindar localhost), então
**não relate teste como verificado** — escreva os testes com cuidado e diga que não pôde
rodá-los. Rodar `pnpm run test` é do maestro.

## Stop conditions

A forma do código contradiz o brief; o mesmo comando falha duas vezes; a correção exigiria
editar algo em Boundaries.

## Method

Se tiver fluxo próprio de testes/TDD, use-o; senão trabalhe pelos critérios de aceite,
verificando cada um antes de declarar pronto.
