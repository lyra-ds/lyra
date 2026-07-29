# Task: guia de HTML puro no site de docs (bilíngue)

## Goal

Escrever o guia que ensina a consumir o `@lyra-ds/styles` **sem React** — só as classes
`.lyra-*` — em inglês e pt-BR. É o guia que faz a promessa multi-framework do projeto ser
verificável por quem usa Vue, Blade, LiveView ou HTML estático.

## Context

Trabalhe da raiz do repositório. Não commite.

### Não é um catálogo de classes — isso já existe

**Toda página de componente já tem uma seção "Plain HTML" / "HTML puro"** com a marcação
daquele componente. Veja `apps/docs/content/docs/en/components/button.mdx` (seção
`## Plain HTML`) e o par pt-BR. **Não duplique isso.** Um guia que repete 40 blocos de
marcação nasce desatualizado e compete com a fonte.

Este guia é o **panorama**: como instalar e importar sem React, que convenção de nomes as
classes seguem, o que o CSS entrega e o que **você** tem de implementar, e para onde ir
para ver a marcação de cada componente (a página do componente).

### A infra de guias já existe — use, não recrie

Dois guias já foram entregues e criaram o caminho completo. Leia antes de escrever:

- `apps/docs/lib/guides.ts` — o manifesto. Adicionar um guia é **uma entrada** aqui.
- `apps/docs/content/docs/en/guides/getting-started.mdx` e `white-label.mdx`, e os pares em
  `pt-BR/` — formato de frontmatter, prosa e tom a seguir.
- `apps/docs/messages/en.json` / `pt-BR.json` — as strings de nav.

### Sem `<Example>` neste guia — decisão tomada, não a reabra

Este guia usa **apenas fences ```html**, que o pipeline de Shiki já destaca com o tema Lyra.

Motivo: um `<Example>` renderiza um módulo `.tsx` e mostra **JSX** no painel de código.
Num guia cujo argumento é "você não precisa de React", exibir JSX contradiz o texto. Não
crie exemplo em `components/examples/`, não registre nada em `components/examples/index.ts`.

### Fatos verificados que o guia deve afirmar (e que você não deriva sozinho)

**1. Só existem três pontos de entrada.** O `exports` do `packages/styles/package.json` é:

```json
{
  ".": "./styles.css",
  "./styles.css": "./styles.css",
  "./tokens/*": "./tokens/*",
  "./compat-shadcn.css": "./compat-shadcn.css"
}
```

Eu testei a resolução: `@lyra-ds/styles/components/buttons/buttons.css` falha com
**`ERR_PACKAGE_PATH_NOT_EXPORTED`**. Ou seja: **não existe import de CSS por componente** —
você importa a folha inteira. Diga isso honestamente; não invente um caminho parcial.
`tokens/*` e `compat-shadcn.css` resolvem.

**2. O prefixo de classe NÃO é derivável do nome do componente.** Esta é a armadilha número
um de quem escreve a marcação na mão. Os blocos abreviam:

| Componente            | Prefixo de classe |
| --------------------- | ----------------- |
| Button                | `.lyra-btn`       |
| Accordion             | `.lyra-acc`       |
| CommandPalette        | `.lyra-cmdk`      |
| SidebarGroup          | `.lyra-sbgroup`   |
| FileManager           | `.lyra-fm`        |
| FileUpload            | `.lyra-upload`    |
| WorkspaceSwitcher     | `.lyra-wssw`      |
| CreateWorkspaceDialog | `.lyra-wscreate`  |
| EmptyState            | `.lyra-empty`     |
| CookieBanner          | `.lyra-cookies`   |

Confirme cada linha contra `packages/styles/components/` antes de publicar a tabela, e
inclua as que você achar além dessas se forem igualmente não-óbvias. Os demais componentes
usam o nome direto (`.lyra-card`, `.lyra-badge`, `.lyra-input`, `.lyra-table`…).

**3. A convenção é BEM.** `.lyra-<bloco>`, `__elemento`, `--modificador` — por exemplo
`.lyra-acc__item--open`. Confirme lendo o CSS.

**4. O CSS entrega aparência; comportamento é seu.** Esse é o núcleo honesto do guia. Para
componentes interativos, o CSS tem a regra de cada estado, mas **alguém precisa alternar a
classe e o atributo ARIA**. Levante exemplos concretos lendo o CSS e as seções
`## Accessibility` das páginas de componente — por exemplo o que o Accordion espera
(`--open` mais `aria-expanded`), e o que um diálogo exige que o CSS não faz (foco preso,
travar o scroll, Escape). Separe de forma útil: quais componentes são **puramente CSS**
(Button, Badge, Card, Alert, Tag, Skeleton, Stat, Table…) e quais **exigem JS seu**
(Dialog, Drawer, Combobox, Dropdown, Tabs, Accordion, CommandPalette, Tooltip…). Essa
triagem é o conteúdo mais útil do guia — quem vai portar para Blade precisa saber onde vai
ter trabalho.

**5. Tema e marca funcionam por atributo, sem JS:** `data-theme="dark"` e `data-brand`.
Aponte para o guia de white-label em vez de reexplicar (`/en/guides/white-label` e
`/pt-BR/guides/white-label`).

**6. As fontes são peer dependencies** (`@fontsource/plus-jakarta-sans`,
`@fontsource/jetbrains-mono`) — o CSS não as embute. Sem elas o sistema cai no fallback de
`system-ui`.

## Conventions

Do `.batuta/profile.md` e da cadeia de templates (react → generic):

- Monorepo pnpm, Node 24, TypeScript 5.9.3.
- Prosa em inglês no arquivo EN, pt-BR no arquivo pt-BR. Nome de token, classe e API sempre
  em inglês nos dois.
- Tom: direto, segunda pessoa ("você"), sentence case, sem emoji. Siga os dois guias que já
  estão lá.
- Mude só o que o brief pede. **Toda linha alterada tem que rastrear direto ao brief.**
- Nunca reformate o que não foi pedido. Nunca adicione dependência.
- Comentário só para constraint que o código não expressa.
- Nunca silencie sinal. Causa raiz fora de alcance → `// WORKAROUND: <razão>` e sinalize.

## Acceptance criteria

1. `apps/docs/lib/guides.ts` tem a entrada nova; a chave de título existe em
   `messages/en.json` **e** `messages/pt-BR.json`, traduzida.
2. Existem `apps/docs/content/docs/en/guides/plain-html.mdx` e o par em `pt-BR/`, com
   frontmatter (`title`, `description`) no formato dos guias existentes.
3. O guia mostra como instalar e importar **sem** o pacote React, e afirma corretamente os
   três pontos de entrada — incluindo que **não** há import por componente.
4. O guia traz a tabela de prefixo de classe por componente, cada linha conferida contra
   `packages/styles/components/`.
5. O guia explica a convenção BEM com um exemplo real tirado do CSS.
6. O guia separa componentes puramente CSS dos que exigem JS do consumidor, e para pelo
   menos dois interativos diz **o que** precisa ser implementado (classe/atributo/foco).
7. O guia aponta para `data-theme`/`data-brand` e para o guia de white-label, sem reexplicá-lo.
8. O guia menciona as fontes como peer dependency.
9. **Nenhum** arquivo novo em `apps/docs/components/examples/`, e
   `components/examples/index.ts` **não** é modificado.
10. `pnpm --filter @lyra-ds/docs run build` passa e lista `/en/guides/plain-html` e
    `/pt-BR/guides/plain-html`; `pnpm run lint` passa.
11. Todo bloco de marcação do guia usa classes que **existem** em
    `packages/styles/components/` — zero classe inventada. Confira uma por uma.

## Boundaries

Não toque em:

- `packages/**` — nada. O CSS é handoff-verbatim e travado.
- `apps/docs/components/examples/**` e `apps/docs/components/examples/index.ts` (ver critério 9).
- `apps/docs/content/docs/*/components/**` e `apps/docs/lib/components.ts`.
- `apps/docs/content/docs/*/guides/getting-started.mdx` e `white-label.mdx` — de outros itens.
- `apps/docs/app/site.css` — este guia é prosa e fences, não precisa de layout novo. Se
  achar que precisa, **pare e relate** em vez de inventar classe.
- `apps/docs/next-env.d.ts`, `.next/`, `out/`, `node_modules/`, `pnpm-lock.yaml`, `handoff/`,
  `.github/`, `.batuta/worktrees/`.
- Não adicione dependência nenhuma.

## Expected evidence

Ao terminar, relate:

- Arquivos criados e modificados.
- Os comandos que rodou, **com a saída real**.
- Como conferiu a tabela de prefixos e cada classe citada contra `packages/styles/`.
- O que ficou incerto, declarado como incerteza.

Seu sandbox não roda navegador. Não relate como verificado nada que dependa de
renderização — o maestro abre as páginas.

## Stop conditions

Pare e relate, em vez de improvisar, se:

- A forma do código contradisser este brief.
- O mesmo comando falhar duas vezes.
- A correção exigir editar algo em Boundaries.

## Method

Se tiver um fluxo próprio de testes/TDD disponível, use-o; caso contrário trabalhe pelos
critérios de aceite, verificando cada um antes de declarar pronto.
