# Mapa do handoff Lyra v1.1 + v1.2

Análise de `/home/franciscpd/Documents/design_handoff_lyra_v1_2` feita em 2026-07-28.
Documento de leitura — nada foi portado ainda. Serve de base para planejar as fases
seguintes e para escrever os briefs dos lotes.

## O que o pacote é

**Não é uma substituição do `handoff/` atual — são dois deltas empilhados.**

- `v1_1/` (dentro do pacote) — o delta "Tier 1 de completude": layout, primitivos,
  sistema (tema/toasts), DataTable, composição de formulários e data/hora.
- raiz do pacote — o delta v1.2: grupo `scheduling` novo, `TimeInput`, extensões em
  `Calendar`/`Combobox`, 1 token novo.

O handoff que está no repo (`handoff/`) é o v1.0. Ler na ordem: `README.md` (v1.2) →
`v1_1/README.md` → `ds-readme.md` (índice consolidado) → `llms.txt` (fonte de verdade
das APIs, 54 KB).

**Sufixo `.txt`**: todo arquivo de código termina em `.txt` para não colidir com o
compilador do preview. Ao portar:
`for f in $(find . -name "*.txt" ! -name "llms.txt"); do mv "$f" "${f%.txt}"; done`

## Tamanho do delta

O sistema vai de **40 para 75 componentes** (+35, ~+88%), mais 2 hooks (`useTheme`,
`useToast`) e 1 função exportada (`describeRecurrence`).

| Grupo                          | Novos | Quais                                                                                                      |
| ------------------------------ | ----- | ---------------------------------------------------------------------------------------------------------- |
| `layout/` (categoria nova)     | 8     | Stack, Inline, Grid, Container, Separator, PageHeader, AppShell, ActionBar                                 |
| `scheduling/` (categoria nova) | 6     | CalendarView, SlotPicker, TimeZonePicker, WeeklyScheduleEditor, RecurrenceSelector, SegmentedRing          |
| `primitives/` (categoria nova) | 3     | Popover, Portal, VisuallyHidden                                                                            |
| `system/` (categoria nova)     | 2     | ThemeProvider (+useTheme), ToastProvider (+useToast)                                                       |
| `forms/`                       | 9     | Calendar, DatePicker, DateRangePicker, TimePicker, TimeInput, RadioGroup, CheckboxGroup, Fieldset, FormRow |
| `data/`                        | 3     | DataTable, PersonCell, DiffCard                                                                            |
| `navigation/`                  | 2     | AppSidebar, BottomNav                                                                                      |
| `feedback/`                    | 1     | BottomSheet                                                                                                |
| `files/`                       | 1     | Dropzone                                                                                                   |

**Modificados** (componentes que já existem no repo):

- `Combobox` — `options[].group` (cabeçalhos), `options[].trailing` (conteúdo à
  direita), `options[].keywords` (busca invisível). **Bloqueia o TimeZonePicker**, que
  usa as três.
- `SidebarGroup` — delta de duas linhas: `title?: string` em `SidebarGroupItem` e
  `title={item.title}` no botão (é o que dá tooltip nativa no rail de 64px do
  AppSidebar). Nada mais do handoff v1.1 é novidade aqui.
- `.lyra-input` — passa a usar `var(--border-input, var(--border-default))`.

## Disponibilidade de código — três níveis

Nem tudo que o `llms.txt` documenta vem com implementação.

**Com JSX + d.ts + prompt (30 componentes)** — porte direto.

**Sem JSX, mas com CSS canônico + contrato no `llms.txt` (3)** — reconstrutíveis, são
triviais: `BottomNav` (CSS completo no fim de `navigation.css`), `PersonCell` (Avatar +
duas linhas; usado pelo UI kit de dashboard), `DiffCard` (único componente do pacote
que usa container queries).

**Ausentes de verdade — código E CSS (2):**

- **`BottomSheet`** — `DatePicker.jsx` e `DateRangePicker.jsx` fazem
  `import { BottomSheet } from "../feedback/BottomSheet.jsx"`, caminho que não existe em
  lugar nenhum do pacote. O README anuncia o comportamento (≤640px os date pickers
  abrem em sheet em vez de popover) mas não entrega o componente nem a classe
  `.lyra-bottomsheet`. **É bloqueio real do caminho mobile dos pickers.** Saída provável:
  implementar como variante do `Drawer` que já existe (`placement="bottom"`) — o
  `llms.txt` o descreve como variante do Dialog.
- **`Dropzone`** — sem código e sem CSS (o `files.css` não vem neste pacote). Precisa
  de handoff novo ou de design próprio.

Falsos alarmes: `Portal`, `Inline` e `FormRow` existem, escondidos dentro dos arquivos
dos irmãos (`Popover.jsx`, `Stack.jsx`, `Fieldset.jsx`).

## Landing — reposicionamento de open source (kit recebido 2026-07-28)

O `ui_kits/website/` atualizado chegou no pacote. Duas páginas, dois domínios:
`index.html` = landing (**lyra-ds.dev**), `docs.html` = docs (**docs.lyra-ds.dev**),
com `site.css` compartilhado.

### Ordem das seções da landing

`SiteHeader` → **Hero** → **ComponentShowcase** → **Frameworks** → **ThemingSection** →
**CommunitySection** → **FAQSection** → **CTASection** → `SiteFooter` → `CookieBanner`.

### O que saiu

- **Pricing inteiro** — planos Community/Pro, ciclo mensal/anual, dialog de checkout e a
  tabela de comparação de recursos.
- **Depoimentos** (`Testimonials`).
- **Discord** — a comunidade passa a ser só GitHub (issues + Discussions).
- O arquivo `sections-marketing.jsx` deixou de existir.

### O que entrou

`sections-community.jsx` no lugar do `sections-marketing.jsx`, com duas seções novas:

- **`ThemingSection`** — white-label. Layout de duas colunas: à esquerda "209 tokens
  semânticos controlam cor, tipo e espaçamento" + três checks (claro/escuro por
  `data-theme`, white-label por sobrescrita, camada `compat-shadcn` opt-in); à direita um
  bloco de código `brand.css` com três linhas. **Nota:** a copy diz "209 tokens" — vira
  211 com o `--border-input`, ou seja, é número que precisa sair de variável, não de
  string fixa.
- **`CommunitySection`** — três cards (contribuir no GitHub com `good-first-issue`,
  GitHub Discussions, melhorar a documentação) sob o título "Feito no aberto" e a linha
  "Sem plano pago, sem paywall: o Lyra evolui por contribuição. Todo o core é MIT".

`FAQSection` e `CTASection` permanecem, mas reescritas em torno de open source — o FAQ
agora abre com "Posso usar comercialmente sem pagar?" e o CTA final virou "Instale em um
minuto. Use para sempre."

### O que ficou

O **CookieBanner continua** (`storageKey="lyra-site-cookies"`, `policyHref`) — o README
do kit não o menciona, mas ele está no `index.html`. O showcase mantém as tabs
preview/código dentro de um `Card`. O header ficou enxuto: só link GitHub, toggle de
tema e o CTA "Documentação".

### Consequência de planejamento: a landing depende do porte novo

**A landing dogfooda a camada de layout que ainda não existe** — `Container`, `Stack`,
`Inline`, `Grid` aparecem em todas as seções, e o `ThemeProvider` embrulha o app inteiro
(`storageKey="lyra-site-theme"`). O mesmo vale para a página de docs do kit.

Isso amarra a landing à **Onda 0** (layout) e à **Onda 5** (ThemeProvider) do porte:
ela deixa de ser um item independente da Fase 6 e passa a depender do delta.

**Decisão do usuário (2026-07-28):** landing e docs devem usar componentes do Lyra
_porque eles podem ser reaproveitados por outros usuários_. Isso resolve a dúvida de
escopo — em vez de adiar o `ThemeProvider` e reimplementar o toggle no site, ele é
portado e consumido pelos dois. O mesmo raciocínio traz o `PageHeader` para dentro do
recorte: ele cobre exatamente o trio eyebrow + título + descrição que apareceria como
`.lw-overline` + `.lw-h2` + `.lw-section__sub`, e esse é um padrão que qualquer site de
produto repete.

Recorte que a Fase 6 leva, então: `Container`, `Stack`/`Inline`, `Grid`, `PageHeader`,
`ThemeProvider`. O resto do delta segue para a Fase 8.

Consequência direta na dúvida do CSS-first do `Stack`/`Grid`: se esses componentes vão
ser reaproveitados por terceiros, estilo inline os torna inúteis para Vue/Blade/
LiveView — que é o motivo de a camada CSS existir. A decisão pende para emitir custom
properties (`--lyra-stack-gap`) e estilizar por classe.

### Colisão de namespace `.lw-*` — reconciliar, não adotar cego

O handoff agora traz um `site.css` **oficial** com classes `.lw-*` — o mesmo prefixo que
o `apps/docs/app/site.css` inventou por conta própria. **16 nomes colidem**:

`.lw-brand` · `.lw-brand__word` · `.lw-docs__content` · `.lw-docs__side` · `.lw-footer` ·
`.lw-footer__inner` · `.lw-footer__links` · `.lw-footer__note` · `.lw-header` ·
`.lw-header__inner` · `.lw-hero` · `.lw-hero__sub` · `.lw-hero__title` · `.lw-mark` ·
`.lw-nav` · `.lw-nav__link`

Mesmo nome não garante mesma definição — comparar regra a regra antes de sobrescrever.

**Critério de corte**, pela decisão de dogfooding acima: `.lw-*` fica só para o que é
genuinamente específico deste site (composição de página, hero, CTA, cromo de
marketing). Tudo que outro produto reusaria vira componente do DS, com changeset e
teste. A pergunta ao portar cada seção é "um consumidor do Lyra ia querer isto?" antes
de escrever qualquer classe nova.
O handoff traz 27 classes que o repo não tem (`.lw-overline`, `.lw-section`,
`.lw-section--alt`, `.lw-h2`, `.lw-cta*`, `.lw-comm__*`, `.lw-fw__*`, `.lw-check*`,
`.lw-meta-item`, `.lw-show__*`) — são as da landing, que o repo nunca construiu. E o repo
tem 34 que o handoff não tem (`.lw-toc*`, `.lw-search*`, `.lw-code*`, `.lw-example*`,
`.lw-index__*`, `.lw-locale*`, `.lw-prop-table__optional`, `.lw-nav__link--active`).

### A página de docs do kit está ATRÁS do repo — não regredir

O `docs.jsx` do handoff é uma referência simples: sidebar de dois grupos com `<button>`,
breadcrumb, prosa, um `Alert` e navegação anterior/próxima. O `apps/docs` já entrega
muito mais — TOC "On this page", busca ⌘K via CommandPalette, Shiki com tema Lyra e
números de linha, toggle EN|PT, prop tables geradas do `props.json`, exemplos vivos com
fonte única, sidebar dogfoodando `SidebarGroup` colapsável com `<Link>` do Next.

Tratar o `docs.jsx` como **referência visual do header/rodapé/breadcrumb**, não como
alvo. Copiar a estrutura dele seria perder seis lotes de trabalho.

Dois pontos a decidir que o kit levanta:

- O card da CommunitySection e o FAQ dizem que as docs "vivem no repositório
  **lyra-ds/docs**" — repositório separado, o que contradiz o `apps/docs` do monorepo. É
  copy de marketing, mas define expectativa pública; alinhar antes de publicar.
- A landing anuncia "**55+ componentes**" e o badge do hero diz "v1.1". Os dois números
  precisam sair de fonte única quando a landing for portada (serão 75 componentes).

## Impacto no gate de parity — cinco pontos de quebra

O `pnpm parity` compara o pacote contra `handoff/` **dentro do repo**, que é v1.0.
Portar obriga a atualizar `handoff/` também.

| Constante / check (`tools/parity/parity.mjs`) | Hoje       | Depois                                     |
| --------------------------------------------- | ---------- | ------------------------------------------ |
| `EXPECTED_TOKENS` (l. 77)                     | 209        | **211**                                    |
| `EXPECTED_CLASSES` (l. 78)                    | 248        | **433** (+185)                             |
| inventário de classes do pacote               | 268        | **453**                                    |
| `STYLES_ENTRY_ORDER` (l. 802)                 | 14 imports | **17** (+layout, +primitives, +scheduling) |
| check (B), diff declaração-a-declaração       | verde      | falha em `forms.css`                       |
| `ADDITIVE_EXTENSIONS` (l. 134)                | 7 arquivos | +3 entradas quando houver extensão         |

Tokens: **`--border-input` é o único token novo** — verificado nos dois temas (light
`var(--slate-400)`, dark `#575E9B`), contraste ≥3:1 por WCAG 1.4.11. Zero valores
alterados, zero removidos.

Classes novas: 78 em `scheduling.css`, 41 em `forms.css`, 24 em `data.css`, 21 em
`layout.css`, 14 em `navigation.css`, 7 em `primitives.css` = **185**.

As contagens 209/248 estão travadas no `CLAUDE.md` como imutáveis. Elas param de valer;
a decisão de como versionar o baseline (bump simples, baseline por versão de handoff,
ou contagem derivada com snapshot commitado) é do usuário.

### Armadilha de porte do CSS — a mais cara do pacote

Os três arquivos que o handoff novo modifica (`data.css`, `forms.css`,
`navigation.css`) fazem **append puro** — e appendam exatamente na posição onde o repo
hoje começa seus próprios blocos aditivos (`data` 102/101, `forms` 234/234,
`navigation` 480/472).

**Sobrescrever o arquivo com a versão nova apaga os blocos aditivos do repo e regride:**
8+ reparos de contraste do axe (`.lyra-table th`, `.lyra-tab__count`,
`.lyra-cmdk__group-label`, `.lyra-sbgroup__label`, `.lyra-kbd`), toda a animação de
saída (Dialog/Drawer/CookieBanner/CommandPalette), os alvos de toque de 44px e o wrap
do Stepper. O handoff novo **não incorporou nenhuma dessas correções** — ele ainda traz
`.lyra-table th { color: var(--text-muted) }`.

Porte correto: substituir a região verbatim (linhas 1..N), depois **re-anexar os blocos
aditivos do repo após as seções novas do handoff**, preservando a ordem de cascata.

### Duas reescritas in-place (as únicas do pacote)

Em `components/forms/forms.css` (v1.2 sobre v1.1):

1. `.lyra-input` — `border: 1px solid var(--border-default)` vira
   `var(--border-input, var(--border-default))`. Mudança de valor na região verbatim →
   quebra o diff declaração-a-declaração, não só a contagem.
2. Inserção de `@media (pointer: coarse) { .lyra-input { font-size: var(--text-md) } }`
   (anti-zoom do iOS).

**Colisão de doutrina no item 2:** o repo não tem nenhuma regra `pointer: coarse` ou
`hover: hover` em `packages/styles`, e o bloco de toque que ele adicionou documenta
explicitamente por quê — _"an iPad in its default 'desktop site' mode reports
`hover: hover` and `pointer: fine`, so a touch-gated rule never reaches the device that
needs it most"_. As duas regras resolvem coisas diferentes e podem conviver, mas a
justificativa do repo passa a conviver com um `pointer: coarse` no meio da região
verbatim.

**Bug na própria regra do handoff:** a media query não adiciona especificidade e vem
_antes_ de `.lyra-input--sm { font-size: var(--text-sm) }` no arquivo — então inputs
`--sm` continuam a 13px no toque e **continuam disparando o zoom do iOS**, que é
exatamente o que a regra queria evitar. Corrigir no porte.

## Conflitos de arquitetura — as quatro decisões que precisam ser tomadas

### 1. `Popover` do handoff × `useFlipPlacement` do repo

Confirmado lendo o código: **o Popover do handoff posiciona 100% por CSS, sem medição
JS** — nenhum `getBoundingClientRect`, e `side` é escolha estática do autor, não flip
automático. Ele é recortado por qualquer ancestral com `overflow: hidden/auto`
(incluindo o `.lyra-appshell__content` e o `.lyra-table-scroll` que este mesmo pacote
introduz) e nunca vira sozinho perto do rodapé.

O repo já resolveu isso melhor: `internal/use-flip-placement.ts` mede contra o
`visualViewport` (barra dinâmica do iOS, pinch-zoom, teclado virtual), re-mede em scroll
capturado/resize, e já serve Combobox, Dropdown e WorkspaceSwitcher.

**Adotar o Popover verbatim seria regressão.** Recomendação: implementar `Popover` sobre
o `useFlipPlacement` (default `side="auto"`, mantendo `top`/`bottom` como override) e
opcionalmente sobre o `Portal` interno para escapar do overflow. A migração posterior
dos três overlays existentes para ele vira aditiva, sem perda — mas não no mesmo lote.

Faltas de a11y a corrigir no porte: sem `aria-expanded`/`aria-haspopup` no trigger, sem
retorno de foco no Escape, `role="dialog"` sem nome nem focus trap (o `Dropdown` do repo
já faz melhor), e o trigger é envolvido num `<span onClick>` — não acessível por teclado
se o filho não for botão.

### 2. Keyframes que violam constraint travada

`@keyframes lyra-actionbar-in` e `@keyframes lyra-popover-in` começam em `opacity: 0`.
O `CLAUDE.md` trava: _"keyframes de entrada animam apenas transform (nunca `opacity: 0`
no frame inicial)"_. Corrigir antes de entrarem.

### 3. `Stack`/`Grid` violam o CSS-first

São os únicos componentes do pacote cuja aparência vive em `style` inline — a classe
`.lyra-stack` sequer existe no CSS. O gap é dinâmico (`gap={3}` → `var(--space-3)`), o
que dificulta virar classe. Decisão: manter inline, ou emitir custom properties e
estilizar por classe. O `as` polimórfico também exige generics no TS.

### 4. `ThemeProvider` × o anti-flash do docs

O `ThemeProvider` do handoff **não é SSR-safe** (`useState(() => localStorage.getItem())`
roda no servidor) e aplica `data-theme` só num `useEffect` — ou seja, **flash garantido**
sem o script inline. Ele resolve o _toggle_, não o _anti-flash_. Também não tem
`system`/`prefers-color-scheme` (default fixo `"light"`), que o docs já tem, e usa
`storageKey` `"lyra-theme"` ≠ `"lyra-docs-theme"` do docs.

Portar com correção de SSR e documentar que o script anti-flash continua sendo do
consumidor (fornecendo-o como snippet copiável). Convivência, não substituição.

## Outros atritos anotados

- **`ToastProvider`** é camada por cima — não substitui `Toast`/`ToastStack`, que
  continuam apresentacionais. Mas importa `Icon` (puxa o registry inteiro para qualquer
  app que use o provider, contra a decisão de bundle já tomada em SidebarGroup/Drawer/
  Stepper — inlinar os 3 SVGs), usa `let toastSeq = 0` de módulo (colide com SSR) e não
  faz `clearTimeout` no unmount. `closeLabel` do Lote 09 precisa ser exposto no provider.
- **`DataTable`** convive com `Table` e **não o usa por dentro** — renderiza `<table>`
  próprio, compartilhando só as classes. Divergência a conciliar: o `Table` do repo põe
  `.lyra-table__primary` na primeira célula, o DataTable não. Introduz o wrapper novo
  `.lyra-table-scroll` (necessário para `maxHeight` + sticky).
- **`AppSidebar`** tipa `heading` e `item.label` como `ReactNode`; o `SidebarGroup` do
  repo usa `string` (e tem teste assertando). Conflito real: decidir se alarga o repo ou
  estreita o AppSidebar (esta é mais coerente — o rail já precisa de
  `typeof label === "string"` para a tooltip).
- **i18n**: praticamente todo componente novo tem pt-BR hardcoded (`DataTable`
  "Selecionar tudo"/"Nenhum registro.", `ActionBar` "selecionados", `Calendar` dias da
  semana e `toLocaleDateString("pt-BR")`, `RecurrenceSelector` inteiro,
  `WeeklyScheduleEditor` inteiro, `TimeInput` `aria-valuetext`). Os Lotes 08 e 09
  estabeleceram a convenção de props traduzíveis — **aplicar desde o primeiro lote**, e
  não repetir o retrabalho.
- **`RecurrenceSelector`**: `describeRecurrence(rule, startDate)` monta a frase inteira
  por regra, deliberadamente. O `.prompt.md` **proíbe** montar por concatenação de
  fragmentos (não sobrevive a i18n). É a armadilha número 1 desse componente.
- **`SlotPicker`**: slots chegam em **UTC** e o agrupamento por dia usa
  `Intl.DateTimeFormat("en-CA", { timeZone })` para obter `YYYY-MM-DD` — o truque `en-CA`
  é o que produz ISO. Trocar por `toISOString().slice(0,10)` quebra o fuso (bug óbvio que
  um executor introduz). Contrasta com o `CalendarView`, que é **hora local** o tempo
  todo. Nunca misturar os dois.
- **`CalendarView`**: os 5 tipos de chip se distinguem por **forma + cor** (sólido,
  tracejado, hachura, contorno) — requisito de a11y, não estética; perder a hachura é
  regressão. Tem duas fontes de cor duplicadas (mapa JS `KIND_M` na visão mês, classes
  CSS na grade de horas) que precisam ficar em sincronia. Mede DOM real
  (`getBoundingClientRect` + `scrollTop`) → **testes exigem Browser Mode**, jsdom
  devolve zeros. Drag e roving-tabindex da grade estão **declarados como não
  implementados** e deixados para o app.
- **`TimeInput`**: o `parse()` tem três retornos semanticamente distintos — `null`
  (vazio, commita), `undefined` (inválido, **não commita e preserva o texto errado**),
  string (ok). Um executor que escreva `if (!p)` quebra o requisito explícito de nunca
  limpar o valor digitado.
- **`SegmentedRing`**: o `<svg>` e a legenda são ambos `aria-hidden`; a fonte de a11y é
  um span visualmente oculto. "Consertar" removendo o `aria-hidden` gera leitura
  duplicada.
- **`TimeZonePicker`**: o `.jsx` chama `onChange(v, opt)` e o `.d.ts` declara
  `(zone: string)` — divergência real, decidir no porte. Valores são sempre IANA, nunca
  offset fixo; o `(GMT±X)` é derivado da `referenceDate` para acertar horário de verão.

## Ordem de porte sugerida

Ondas por dependência, não por grupo do handoff.

**Onda 0 — base sem dependências** (paralelizável, tudo de complexidade baixa):
VisuallyHidden, Container, Separator, Stack/Inline, Grid, PageHeader, Fieldset/FormRow.
Junto: criar `layout.css` e `primitives.css`, registrar no `styles.css`, resolver a
política de estilo inline do Stack/Grid, corrigir os dois keyframes com `opacity: 0`.

**Onda 1 — depende só do que já existe:** RadioGroup, CheckboxGroup (usam Radio/Checkbox),
DataTable + PersonCell, ActionBar, e o delta de duas linhas do SidebarGroup.

**Onda 2 — o primitivo de overlay (decisão de arquitetura):** Popover sobre
`useFlipPlacement`. Bloqueia a onda 3 inteira.

**Onda 3 — depende de Popover:** Calendar (pode ir em paralelo à onda 2), TimePicker,
**BottomSheet** (pré-requisito faltante), DatePicker, DateRangePicker.

**Onda 4 — casca de app:** AppSidebar, AppShell, BottomNav.

**Onda 5 — camada de sistema:** ThemeProvider (com correção SSR), ToastProvider.

**Onda 6 — scheduling**, na ordem: SegmentedRing e TimeInput (folhas) → extensão do
Combobox (`group`/`keywords`/`trailing`) → TimeZonePicker → RecurrenceSelector →
WeeklyScheduleEditor → SlotPicker → CalendarView (o mais caro, sozinho).

**Fora de escopo até haver design:** Dropzone. **Não bloqueia ninguém:** DiffCard.

## Estimativa

Aproximadamente **12–16 lotes** de 1–4 componentes, mais o trabalho de infraestrutura
(atualizar `handoff/`, rebaselinar o parity, 3 arquivos CSS novos). É comparável em
tamanho a tudo que a Fase 4 fez — e vem antes do site de docs conseguir documentar
qualquer um deles, o que reabre a Fase 6b em ~35 páginas novas.

## Inventário do cromo — o que vira componente do DS e o que fica do site

Classificação das **76 classes `.lw-*` distintas** dos dois arquivos (42 no `site.css`
do handoff v1.2, 50 no `apps/docs/app/site.css`, 16 em comum), pelo critério da decisão
de dogfooding: _um consumidor do Lyra ia querer isto?_

Contexto que motiva a seção: o delta v1.1+v1.2 **não traz nenhum componente de cromo de
site** — `grep` por Navbar/SiteHeader/SiteFooter/CodeBlock/TOC no `llms.txt` novo devolve
zero, e a resposta do próprio handoff para essa necessidade é um `site.css` com 42
classes. O `packages/styles` também não tem nada de `code`, `prose`, `toc`, `header`,
`footer`, `hero` ou `section` — só o `.lyra-kbd`. Ou seja: a camada existe em todo site
feito com Lyra e hoje cada um a reescreve.

### A — Vira componente do DS (8 adições)

| Novo                                                      | Absorve                                                                                                           | Por que passa no teste                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Navbar`** (+ `NavLink`, slots `brand`/`nav`/`actions`) | `.lw-header`, `__inner`, `__actions`, `.lw-nav`, `.lw-nav__link`, `--active`, e o wrap responsivo de 900px        | Barra superior fixa com marca, navegação e ações é o cromo nº 1 de qualquer produto ou site de docs. O nosso já carrega a lição do overflow em 375px.                                                                                                                                                                                                                                                       |
| **`Footer`** (slots `note`/`links`)                       | `.lw-footer`, `__inner`, `__note`, `__links`                                                                      | Mesmo argumento; são 4 classes e uma decisão de layout que todo mundo repete.                                                                                                                                                                                                                                                                                                                               |
| **`DocsShell`**                                           | `.lw-docs` (grade de 3 colunas), `.lw-docs__side`, `.lw-docs__content`, e as duas media queries de colapso        | Carrega conhecimento caro: `max-height` + `dvh` + `overscroll-behavior` na trilha (sticky sozinho não segura trilha mais alta que a viewport), e a ordem de colapso — some o TOC em 1100px, depois a sidebar em 900px. **Decisão de design:** virar componente próprio ou uma terceira trilha no `AppShell` do delta? O `AppShell` é sidebar + topbar + conteúdo; docs precisa de sidebar + conteúdo + TOC. |
| **`TableOfContents`**                                     | `.lw-toc`, `__title`, `__list`, `__link`, `--active`, indentação por `data-level`                                 | Todo site de documentação tem. Recebe os headings como dados; o observador de scroll é do consumidor ou vem junto como hook.                                                                                                                                                                                                                                                                                |
| **`CodeBlock`**                                           | `.lw-code`, `__bar`, `__lang`, `__copy`, `__pre`, numeração de linha, e o `.lw-show__code` do handoff             | A ausência mais gritante: o handoff usa bloco de código na landing **e** nas docs, dois contextos. **Regra dura:** o DS entrega só o cromo (moldura, badge de linguagem, botão de copiar, numeração, scroll horizontal); o HTML já destacado entra como `children`. O DS **não** pode depender de Shiki.                                                                                                    |
| **`SegmentedControl`**                                    | `.lw-locale`, `__opt`, `--active`                                                                                 | O toggle EN\|PT não tem nada de idioma — é um segmentado genérico de 2+ opções. Generalizar é o que o torna útil (densidade, período de gráfico, visão lista/grade).                                                                                                                                                                                                                                        |
| **`CommandPalette.Trigger`**                              | `.lw-search`, `__label`, `__kbd`                                                                                  | Botão que parece campo de busca e abre a paleta. Já temos o `CommandPalette`; falta o gatilho canônico, que hoje cada um refaz. O `__kbd` some: **`.lyra-kbd` já existe** e o `apps/docs` duplicou sem perceber.                                                                                                                                                                                            |
| **`.lyra-prose`** (camada CSS, sem React)                 | `.lw-docs__content h1/h2/h3/p/a/strong/code`, `scroll-margin-top`, e os `.lw-docs__title`/`__h2`/`__p` do handoff | O item mais CSS-first da lista: escopo tipográfico dirigido por tokens que funciona em Vue/Blade/LiveView **sem uma linha de JS**. É exatamente o tipo de coisa que justifica a arquitetura do Lyra.                                                                                                                                                                                                        |

Menores, valor médio, decidir caso a caso: **`IconTile`** (`.lw-comm__icon` — quadrado
40px com `accent-soft`, padrão recorrente em card de feature), **`CheckList`**
(`.lw-checks`/`.lw-check`, com o ícone tomando `--success`) e **`Brand`/`ThemedMark`**
(a troca de marca light/dark por `[data-theme]`, 4 linhas que todo site refaz — pode ser
só um slot do `Navbar`).

### B — Já resolvido, é só parar de reimplementar

- Itens da sidebar de docs → **`SidebarGroup`** (o `apps/docs` já dogfooda; as
  `.lw-docs__item*` e `.lw-docs__group-title` do handoff são a versão não-dogfoodada,
  descartar).
- Grade do índice de componentes, cards de framework e de comunidade → **`Card`** +
  **`Grid`** (delta) + **`Badge`**/**`Icon`**/**`Button`**.
- Trio overline + título + descrição → **`PageHeader`** (delta), com uma variante
  centralizada a acrescentar para o uso de marketing.
- Chip de tecla → **`.lyra-kbd`**, que já existe.

### C — Fica cromo do site (não virar componente)

`.lw-hero*` e `.lw-cta*` (composição e copy de uma página específica — um `Hero` do DS
seria sobreajuste e pioraria a biblioteca para quem tem outra landing), `.lw-section`,
`--alt` e `.lw-section__sub` (ritmo vertical da página), `.lw-example*` (máquina do nosso
pipeline de MDX + leitura de fonte), `.lw-prop-table__optional`, `.lw-index__*`,
`.lw-container` (o `Container` do delta substitui), e as tipografias internas de card
(`.lw-fw__name`, `.lw-fw__pkg`, `.lw-comm__title`, `.lw-comm__desc`, `.lw-meta-item`).

### Saldo

Das 76 classes, **~30 colapsam nas 8 adições**, ~10 já têm componente e ~35 seguem sendo
cromo legítimo. Depois disso, "site 100% construído com o DS" passa a ser verdade no
sentido que importa: nada reaproveitável mora no `apps/docs`.

### O risco a evitar

`Navbar` e `Footer` só valem se nascerem **shells com slots** (`brand`, `nav`, `actions`;
`note`, `links`), não layouts fechados. Um `Navbar` que só serve para a barra do Lyra é
pior do que não ter — vira dívida com cara de componente. Mesmo teste do `Hero`: se a
API pressupõe a nossa copy, é cromo.

### Efeito no planejamento

Isto expande o **6c-b**, que deixa de ser "portar a camada de layout" e passa a ser
"portar a camada de layout **+ construir a camada de cromo**". As 8 adições são trabalho
novo (não têm handoff — precisam de design nosso a partir do CSS existente, que já está
validado em produção no `apps/docs`), com changeset, teste e página de documentação cada.
Estimativa: 3–4 lotes além do porte do layout.

### Onde o CSS do cromo mora (regra do usuário, 2026-07-28)

**Os tokens e o CSS ficam na lib `styles`.** As 8 adições não são exceção: cada uma
entrega classes `.lyra-*` em `packages/styles`, consumindo a camada semântica existente;
token novo, se houver, vai em `packages/styles/tokens/`. Nada de aparência nova no
`apps/docs` — ele passa a importar, não a definir.

Consequência prática: nasce um arquivo novo de componentes (`components/site/site.css`
ou equivalente), que entra no `styles.css` e **empurra o baseline do parity de novo**,
além das 433 classes já previstas pelo delta. Fazer o rebaseline uma vez só, depois de
decidir as 8 adições, em vez de duas vezes.

É também o que torna o cromo consumível por Vue/Blade/LiveView — um `Navbar` cuja
aparência morasse no `apps/docs` não serviria a ninguém fora do React, e a camada CSS
perderia o sentido.

### Sidebar: temos o grupo, falta a casca

Estado real, conferido no repo:

- **Temos `SidebarGroup`** — a _seção_: rótulo (opcionalmente colapsável, com chevron) e
  lista de itens, com 11 classes `.lyra-sbgroup*` no styles.
- **Não temos a casca da barra.** O que envolve os grupos hoje é `.lw-docs__side` no
  `apps/docs` (sticky + `max-height`/`dvh` + scroll próprio), ou seja: cromo do site.

E são **duas cascas diferentes**, não uma:

1. **`AppSidebar`** — casca de _aplicação_, vem no delta v1.1: `brand` no topo, `groups`,
   `footer`, `width` (260 padrão) e modo **rail** de 64px só-ícones com tooltip nativa.
   Compõe `SidebarGroup` por baixo. É a barra de um produto SaaS.
2. **Trilha de _documentação_** — não existe em handoff nenhum. É a que o `apps/docs` já
   construiu, e ela entra no `DocsShell` da lista de adições.

**Armadilha a pinar quando o `AppSidebar` for portado:** a API dele é dirigida por dados
(`groups[].items[]`), e cada item vira `<button>`. O nosso site de docs **deliberadamente
não usa `items`** — ele passa `<Link>` do Next como `children` do `SidebarGroup`,
justamente para preservar navegação client-side, prefetch, abrir em nova aba e copiar
link, que `<button>` não dá. Se o `AppSidebar` só aceitar `items`, ele é inutilizável
para navegação real e o docs não vai poder dogfoodá-lo. Requisito: aceitar `children`
com o mesmo contrato do `SidebarGroup`.
