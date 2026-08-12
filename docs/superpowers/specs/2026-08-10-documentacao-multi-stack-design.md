# Documentação multi-stack: React, HTML + Alpine e Blade

> Data: 2026-08-10 · Estado: aprovado, pronto para planejamento
> Repositórios envolvidos: `lyra-ds/lyra` (site e pacotes JS), `lyra-ds/blade` (pacote PHP),
> `lyra-ds/blade-demo` (matéria-prima do starter Laravel).

## 1. Problema

O site (`apps/docs`) documenta **uma** stack. São 74 páginas de componente, cada uma com
exemplos React vivos, `<PropTable>` gerado dos `.d.ts` e uma seção "Plain HTML" escrita à
mão.

Existem hoje **três** consumidores do mesmo CSS core, e dois não têm casa:

| Pacote            | Estado                | No site    |
| ----------------- | --------------------- | ---------- |
| `@lyra-ds/react`  | publicado             | 74 páginas |
| `@lyra-ds/alpine` | 0.4.0, 66 módulos     | **nada**   |
| `lyra-ds/blade`   | 0.9.0, 72 componentes | **nada**   |

O Blade é a segunda stack sem casa, não a primeira. Uma solução desenhada só para ele seria
refeita quando o Alpine entrasse. O escopo desta spec é, portanto, a **arquitetura
multi-stack**, entregue com Blade como a stack que a preenche primeiro.

Consequência já visível: o PRD do `lyra-ds/blade` aponta `lyra-ds.dev/llms.txt` como fonte de
verdade da API, e esse arquivo hoje só cobre React. A promessa está quebrada.

## 2. O eixo correto: Blade ⊃ Alpine

Documentar "React | Alpine | Blade" como três pares seria falso. Verificado na fonte:

- 29 dos 72 componentes Blade emitem `x-data="lyra*(...)"` — o Blade **serve o HTML que o
  binding Alpine anima**. `alpinejs >=3.13 <4` e `@lyra-ds/alpine` são peers declarados no
  README do pacote PHP.
- Os outros 43 são estáticos: não há Alpine para eles.

O modelo real é: **um CSS canônico; dois runtimes de comportamento** (React e Alpine); e, no
lado Alpine, **duas formas de emitir o HTML** (à mão ou via Blade).

**Decisão:** três abas com a herança declarada — `React | HTML + Alpine | Blade`. A aba Blade
mostra a tag e suas props e aponta o binding que a anima; a aba Alpine registra que o Blade
serve aquele mesmo HTML. Uma aba só aparece se a stack existe para aquele componente
(`Button` mostra `React | HTML | Blade`).

## 3. Modelo de conteúdo

Um documento por componente, três projeções de API sobre ele. A prosa — quando usar,
acessibilidade, anatomia — descreve o componente, não a stack, e não se multiplica.

Nenhuma tabela de API é escrita à mão:

| Stack  | Fonte                                                         | Gerador                              | Onde roda |
| ------ | ------------------------------------------------------------- | ------------------------------------ | --------- |
| React  | `packages/react/dist/*.d.ts`                                  | `tools/docgen/generate.mjs` (existe) | `lyra`    |
| Alpine | `packages/alpine/dist/index.d.ts` (interfaces `Lyra*Options`) | mesmo gerador, segunda entrada       | `lyra`    |
| Blade  | `@props` dos 72 `.blade.php` + snippet curado                 | `BoostGuidelinesGenerator` estendido | `blade`   |

O Alpine é quase de graça: já publica `.d.ts`, e o docgen já usa a API do compilador
TypeScript.

### Manifesto único

`apps/docs/lib/components.ts` já é a fonte única do catálogo — dele saem rota, sidebar,
índice e prop table. Ele ganha, por componente:

- disponibilidade por stack (`react`, `alpine`, `blade`);
- quando uma stack falta, **a frase que explica a ausência** (o README do Blade já tem esse
  texto: o tema vive em `@lyraThemeScript` + store Alpine; a fila de toast vive no
  `toast-stack`).

### Catálogo: união, não interseção

Medido: **70 componentes existem nos dois lados**. Órfãos:

- só no site: `calendar-view`, `create-workspace-dialog`, `theme-provider`, `toast-provider`
- só no Blade: `form-row`, `toast-stack`

**Decisão:** uma página por componente da **união** (76). A ausência vira documentação, não
buraco. Efeito colateral desejado: `calendar-view` ganha aba React e a linha de ausência do
Blade — a decisão de adiá-lo deixa de ser item de backlog e vira estado documentado; quando
ele sair, muda uma linha do manifesto.

### Preview vivo continua React nas três stacks

O site não roda PHP, e não precisa: a aparência inteira é `@lyra-ds/styles`, e a paridade de
classes React↔Blade já é provada por 72 fixtures de class-emission no repo PHP. O que muda
por aba é código e API, não pixel.

## 4. Página e navegação

- **Seletor**: um `SegmentedControl` do próprio Lyra, abaixo do título (o site já se veste
  com os próprios componentes).
- **Persistência**: `localStorage` mais `?stack=blade` na URL, para que um link colado abra
  na stack certa. Query string, não rota — compatível com o export estático atual.
- **Fallback**: quem chega com preferência gravada numa página sem aquela stack cai no React
  com a linha de ausência visível. Nunca uma aba vazia.
- **Só duas seções trocam**: API e Código. Exemplos, "quando usar" e acessibilidade ficam
  parados — o leitor não perde o lugar ao trocar de aba.
- **Linha de herança na aba Blade**: _"O comportamento vem de `lyraDropdown()` — instale
  `@lyra-ds/alpine`"_, com link para a aba irmã.

### i18n

Sem dívida nova. As três tabelas vêm de JSON e as descrições de prop já são inglês vindo do
JSDoc nas duas línguas. O que precisa de tradução segue sendo a prosa das páginas pt-BR
(incluindo as das páginas órfãs novas).

### Guias

- `getting-started` ganha o mesmo seletor: instalação por stack. A do Blade já está escrita —
  é o README do pacote PHP: `composer require`, styles por npm, plugin do Alpine,
  `@lyraThemeScript` no `<head>`, e a regra CSS pré-boot que evita menus piscando abertos.
- Página nova de **matriz de compatibilidade** (Blade ↔ `@lyra-ds/alpine` ↔ `@lyra-ds/styles`),
  que hoje só existe no README do outro repo.
- `llms.txt` passa a cobrir as três stacks, cumprindo o que o PRD do Blade já declarava.

## 5. Fronteira entre os repositórios

### No `lyra-ds/blade`

- **`bin/generate-docs-api`** — irmão de `bin/generate-boost-guidelines`, reaproveitando o
  mesmo parser de `@props`. Emite `docs/api.json` com, por componente: slug, props (tipo,
  default, obrigatoriedade, descrição), binding Alpine quando houver, snippet de uso
  canônico, HTML renderizado desse snippet e a versão do pacote.
- **`resources/docs-examples/<slug>.blade.php`** — o snippet curado, compilado e renderizado
  pela suíte Pest. Mudou a API, quebra lá, não aqui. Um snippet que não compila é pior que
  snippet nenhum — a mesma regra que o projeto já aplica às props.
- **Teste de frescor** no molde do `BoostGuidelinesTest`: componente novo sem regenerar o
  `api.json` deixa a suíte vermelha.
- O `api.json` entra na release.

### A travessia

Um PR de sync atualiza `tools/blade-api/api.json` no `lyra`, com a versão carimbada dentro do
arquivo. O site exibe essa versão na aba Blade e a página de matriz lê dali.

**Propriedade de desenho:** um snapshot atrasado fica **velho e visível**, nunca errado e
silencioso — a aba diz "0.9.0" enquanto o Packagist está em 0.10.0, e isso é auditável de
fora. Rejeitadas: buscar da release no build (deixa o preview da Vercel refém de rede) e
instalar o pacote PHP no CI do site (PHP no pipeline do Next.js).

### No `lyra`

- docgen ganha segunda entrada apontando para `packages/alpine/dist`;
- manifesto ganha disponibilidade por stack e frases de ausência;
- `PropTable` ganha a stack como parâmetro;
- **teste espelho**: o build falha se o manifesto declarar uma stack que o JSON correspondente
  não tem.

## 6. Frente Laravel: starter e demo

Diagnóstico do estado atual do `blade-demo`:

1. **Embarca Tailwind** (`@tailwindcss/vite`, `tailwindcss`), herdado do scaffold padrão do
   Laravel — a vitrine de um DS cuja restrição travada é "sem Tailwind no core".
2. **Preso em `@lyra-ds/alpine ^0.3.0`**, enquanto o 0.4.0 já traz as duas props que o Blade
   destravou.
3. **Não segue o padrão dos irmãos**: `starter-next` e `starter-vite` são templates com
   `-demo` publicado no GitHub Pages; o lado Laravel é um `demo.blade.php` de 884 linhas, uma
   rota, sem deploy. É por isso que parece menos real — os outros são ponto de partida de
   projeto, ele é um scratch.

### `starter-laravel` (novo)

Template no molde do `starter-next`: Laravel limpo com `lyra-ds/blade`, `@lyra-ds/styles`,
`alpinejs` + `@lyra-ds/alpine` em `^0.4.0`, fontes locais, `@lyraThemeScript` no `<head>`, a
regra CSS pré-boot, tema light/dark/system, white-label vivo nos 4 tokens, Pint, Pest e CI.
**Sem Tailwind** — a remoção vira uma linha do README explicando por quê.

#### Autenticação

O starter nasce **sem auth ligada** e traz `resources/views/auth/` com as sete views que o
Fortify espera — `login`, `register`, `forgot-password`, `reset-password`, `verify-email`,
`confirm-password`, `two-factor-challenge` — escritas **só com componentes do catálogo
atual**. Cobertura verificada: `input`, `checkbox`, `button`, `alert`, `card`, `brand`,
`separator`, `form-row`, `fieldset`, `spinner`, `icon`, `stack`, `container` existem todos.

O README ganha uma seção de um comando (`composer require laravel/fortify`). Quem não quer
auth não carrega migration, rota nem dependência.

As views ficam no template, não no pacote: `lyra-ds/blade` é wrapper fino de CSS e não deve
carregar opinião de aplicação.

**Valor secundário, e é o maior:** um fluxo de auth completo sem inventar componente novo é a
prova de cobertura mais dura que o DS pode dar — mais que a galeria dos 72.

**Único ponto onde o exercício pode revelar lacuna:** o `two-factor-challenge` normalmente
quer um campo de código de 6 dígitos, e não há componente dedicado. Sai como `input` comum.
Se incomodar ao escrever a tela, é um achado legítimo de catálogo.

### `starter-laravel-demo` (novo, substitui `blade-demo`)

O starter vestido de produto — rotas que são telas, não seções:

- **Dashboard** — `stat`, `data-table`
- **Agenda** — `calendar`, `slot-picker`, `time-zone-picker`
- **Arquivos** — `file-manager`, `file-upload`
- **Equipe** — `person-cell`, `data-table`
- **Configurações** — formulários, `segmented-control`
- **`/components`** — a galeria dos 72, herdada das 884 linhas atuais e quebrada em blocos.
  Continua provando cobertura; deixa de ser a porta de entrada.
- **Auth** — Fortify ligado de verdade: login, registro e 2FA reais, com o mesmo tema e
  white-label das outras telas.

**Deploy: PHP de verdade, no Docploy self-hosted do mantenedor**, via Dockerfile — imagem
única, SQLite em arquivo, sem serviço externo de banco.

Isso corrige uma contradição da primeira versão desta spec, que pedia export estático para o
GitHub Pages (paridade com `starter-next-demo` e `starter-vite-demo`) **e** Fortify ligado de
verdade. As duas coisas não coexistem: página estática não tem `POST /login`, então as telas
de auth apareceriam e o formulário não submeteria — o demo mostraria autenticação sem provar
autenticação, que é o oposto do ponto.

A assimetria com os irmãos passa a ser deliberada e tem uma razão declarada: React e Vite são
100% cliente, e Blade é server-rendered. Um demo de Blade que não roda no servidor não
demonstra a stack que ele existe para demonstrar.

O `blade-demo` é a matéria-prima e é aposentado.

### Ligações

- Cada página do site, na aba Blade, linka a tela do demo onde aquele componente aparece em
  contexto;
- o demo linka de volta para a doc de cada componente;
- o Packagist aponta para `lyra-ds.dev`, cumprindo o que o PRD do Blade já declarava.

## 7. O que esta spec não faz

- **Não cria um site de documentação em PHP.** A parte cara da doc é a prosa — 70 páginas de
  "quando usar" e acessibilidade, idênticas nas três stacks porque descrevem o componente, não
  a linguagem. Duplicar significa escrever duas vezes ou divergir, e divergência em orientação
  de acessibilidade é a pior categoria de erro possível aqui. O ganho real de um site PHP
  (preview renderizado de verdade) é comprado pelo HTML renderizado dentro do `api.json`; o
  outro ganho (ser nativo ao ecossistema) é comprado pelo demo publicado.
- **Não substitui o Flux no starter kit Livewire oficial.** Outro tamanho de trabalho, e o
  ganho seria para quem já escolheu Livewire. O Lyra atende o Blade puro — justamente o kit
  que a Laravel deixou de oferecer.
- **Não documenta o Alpine e o Blade página a página no mesmo lote.** Ver faseamento.

## 8. Faseamento

Três frentes, que só se encontram no fim.

**Frente A — `lyra-ds/blade`** (pode começar agora; o `WORK.md` de lá diz "nada em voo")

1. `bin/generate-docs-api` e o formato do `api.json`
2. `resources/docs-examples/*.blade.php` para os 72, compilados sob teste
3. Teste de frescor
4. `api.json` publicado na release

**Frente B — `lyra`** (paralela, não depende de A)

1. Segunda entrada do docgen → `props.json` do Alpine
2. Manifesto com disponibilidade por stack e frases de ausência; páginas dos órfãos
3. `StackSwitcher` + blocos de API/código por stack, entregues já com React e Alpine

**Junção** 4. Snapshot do Blade em `tools/blade-api/`, terceira aba acesa, teste espelho 5. Guias por stack, matriz de compatibilidade, `llms.txt` dos três

**Frente C — Laravel** (independente das outras duas)

1. `starter-laravel` sem Tailwind, com Alpine `^0.4.0`
2. Views de auth do Fortify no starter
3. `starter-laravel-demo`: telas de produto + `/components` + Fortify ligado
4. Dockerfile e publicação no Docploy self-hosted (auth funcional no ar)
5. Ligações cruzadas site ↔ demo ↔ Packagist

**Depois:** prosa pt-BR das páginas órfãs novas.

## 9. Critérios de aceite

- Uma página de componente mostra as três abas, e trocar de aba não move exemplos nem prosa.
- `?stack=blade` abre a página na aba Blade; a preferência persiste entre páginas.
- Uma página sem uma stack não mostra aquela aba, e explica a ausência em uma frase.
- Nenhuma tabela de props é escrita à mão nas três stacks.
- Adicionar um componente no `lyra-ds/blade` sem regenerar o `api.json` deixa a suíte de lá
  vermelha.
- Declarar no manifesto uma stack ausente do JSON correspondente quebra o build do site.
- `llms.txt` cobre React, Alpine e Blade.
- O `starter-laravel` roda `pnpm build` sem Tailwind instalado.
- Fluxo de auth do Fortify renderizado sem nenhum componente fora do catálogo publicado.
- `starter-laravel-demo` publicado e navegável, com a galeria dos 72 preservada em
  `/components`.

## 10. Riscos

| Risco                                                                          | Mitigação                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Snapshot do Blade envelhece sem ninguém notar                                  | Versão carimbada e exibida na aba e na matriz; fica velho e visível, não errado e silencioso                                                                                                                               |
| Snippets Blade divergem da tag real                                            | Snippet é fonte compilada e renderizada pela suíte Pest, não texto em MDX                                                                                                                                                  |
| Preview React esconder uma divergência real de Blade                           | As 72 fixtures de class-emission do repo PHP são a prova; se elas passarem a falhar, o preview é o menor problema                                                                                                          |
| Escopo da frente C crescer para "clone dos starter kits oficiais"              | Fronteira declarada na seção 7 e no README do starter                                                                                                                                                                      |
| Campo de código de 6 dígitos faltar no catálogo                                | Tratado como achado, não como bloqueio: sai como `input` até haver decisão                                                                                                                                                 |
| O demo hospedado cair sem ninguém notar, e o site linkar para uma página morta | Imagem única e sem dependência externa (SQLite em arquivo), então a superfície de falha é pequena; o link do site aponta para o domínio, não para uma rota interna, e a galeria `/components` serve de healthcheck legível |
