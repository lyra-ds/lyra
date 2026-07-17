# Handoff: Lyra Design System → biblioteca publicável

## Visão geral

Este pacote contém tudo que o Claude Code precisa para converter o **Lyra DS** (design system criado em HTML/CSS/JSX neste projeto) em uma biblioteca open source publicável no npm. O Lyra é um design system para produtos SaaS, bilíngue (docs pt-BR, API em inglês), com tema claro/escuro, **white-label** e arquitetura **CSS-first**: toda a aparência vive em classes `.lyra-*`, e os componentes React são wrappers finos sobre essas classes — o que permite adapters futuros para Vue, Svelte e Web Components usando o mesmo CSS.

## Decisões de arquitetura (jul/2026 — ver `guidelines/architecture.html`)

- **CSS puro no core, sem Tailwind** — é o que viabiliza multi-stack; um preset Tailwind pode virar pacote satélite depois.
- **Naming Lyra é o canônico** + `tokens/compat-shadcn.css` **opt-in** mapeando `--background`/`--primary`/`--ring`… para tokens Lyra (interop com o ecossistema shadcn). Não importar no styles.css.
- **White-label**: contrato em `tokens/brand.css` — a marca define `--brand`, `--brand-contrast`, `--brand-radius`, `--brand-font` sob `[data-brand="x"]`; hover/active/soft/focus-ring/links derivados via `color-mix`, em light e dark. Prova viva: `explorations/multibrand-demo.html`.
- **Comportamento multi-framework (fase 2)**: Zag.js (state machines agnósticas, base do Ark UI) — não Radix (React-only). O core CSS não depende disso.
- **Distribuição em duas vias**: npm primeiro (`@lyra-ds/styles` + `@lyra-ds/react`); registry estilo shadcn (`npx shadcn add @lyra/button`) como fase 2, reaproveitando os mesmos fontes.
- **LLM-first**: `llms.txt` na raiz é a referência canônica para agentes (regras de geração + tokens + API dos componentes), gerado dos `.d.ts`. Na lib, vira step de build (`.d.ts` → `llms.txt` + `registry.json`); MCP server como fase 2.

## Sobre os arquivos deste bundle

Os arquivos aqui são **referências de design e implementação criadas em HTML/JSX** — protótipos de alta fidelidade que mostram aparência e comportamento. A tarefa é **recriar isso como uma biblioteca real**, não copiar os arquivos diretamente. Os `.jsx` usam React 18 via Babel standalone (sem build); os `.d.ts` são contratos de props escritos à mão; os `.prompt.md` documentam o uso de cada componente.

## Fidelidade

**Alta fidelidade.** Cores, tipografia, espaçamentos, raios, sombras e estados (hover/focus/active/disabled) são finais e devem ser preservados pixel a pixel. Os valores canônicos estão em `tokens/*.css` (209 tokens; tema escuro via `[data-theme="dark"]`, marcas via `[data-brand]`).

## Estrutura sugerida da biblioteca

Monorepo (pnpm workspaces + changesets):

```
lyra-ds/
├── packages/
│   ├── styles/          # @lyra-ds/styles — CSS puro, zero JS
│   │   ├── tokens/      # copiar de tokens/ (colors, typography, spacing, effects, fonts, base, brand, compat-shadcn)
│   │   ├── components/  # copiar os *.css de components/*/
│   │   └── styles.css   # entry — mesmos @imports do styles.css da raiz (compat-shadcn.css fica FORA do entry, é opt-in)
│   └── react/           # @lyra-ds/react — peerDeps: react >=18
│       └── src/         # um arquivo por componente, convertido de components/*/<Name>.jsx
├── apps/
│   └── docs/            # site de documentação (design pronto — ver seção Docs) + registry (fase 2)
└── assets/              # logo + favicons (inclusos neste bundle)
```

### Conversão dos componentes React

Para cada `components/<grupo>/<Name>.jsx`:

1. Converter para TypeScript (`.tsx`) usando o `<Name>.d.ts` correspondente como fonte das interfaces de props — eles já estão completos e documentados (JSDoc em pt-BR).
2. Trocar `React.useState`/`React.useEffect` por imports nomeados.
3. Manter **exatamente** as classes CSS `.lyra-*` — elas são a API pública compartilhada com futuros adapters.
4. Usar o `<Name>.prompt.md` como base do exemplo de uso na documentação.
5. Export barrel em `src/index.ts` com os 40 componentes (lista completa abaixo).

### Inventário de componentes (40)

| Grupo | Componentes |
|---|---|
| buttons | Button, IconButton |
| forms | Input, Textarea, Select, Combobox, Checkbox, Radio, Switch |
| display | Card, Badge, Tag, Avatar, AvatarGroup, Accordion |
| navigation | Tabs, Breadcrumb, Pagination, Dropdown, Stepper, CommandPalette, WorkspaceSwitcher, CreateWorkspaceDialog, SidebarGroup |
| feedback | Alert, Toast, ToastStack, Dialog, Drawer, Tooltip, Progress, Spinner, Skeleton, CookieBanner |
| data | Table, Stat, EmptyState |
| files | FileUpload, FileManager |
| icons | Icon |

### Pontos que exigem decisão/trabalho real na conversão

- **Icon**: hoje renderiza Lucide via CSS mask apontando para CDN (`unpkg.com/lucide-static`). Na lib, trocar por dependência local: ou `lucide-react` (recomendado para o pacote React), ou empacotar os SVGs de `lucide-static` no build mantendo a API `<Icon name="..." size={...}/>`. Não deixar dependência de CDN em runtime.
- **Fontes**: Plus Jakarta Sans e JetBrains Mono são carregadas em `tokens/fonts.css`. Na lib, documentar como peer (via `@fontsource/plus-jakarta-sans` + `@fontsource/jetbrains-mono`) em vez de embutir.
- **FileUpload**: o progresso de upload é **simulado** (prototipagem). Na lib, expor API real: `onFiles(files)` para o app fazer o upload e props controladas `items`/`onChange` para refletir progresso real. Manter a simulação apenas como modo demo opcional, se desejado.
- **CommandPalette**: registra atalho global ⌘K/Ctrl+K quando recebe `onOpen`. Adicionar cleanup correto (já feito no protótipo) e SSR-safety (guardar `document`).
- **Dialog/Drawer/CommandPalette**: hoje renderizam no lugar; considerar `createPortal` para `document.body` na lib.
- **Acessibilidade**: os protótipos têm o básico (roles, aria-expanded, aria-current, navegação por teclado em Combobox/CommandPalette). Na lib, completar: focus trap em Dialog/Drawer/CommandPalette, `aria-activedescendant` nos listboxes, restaurar foco ao fechar.
- **Select nativo**: manter — mas a documentação deve orientar: listas longas ou com busca → Combobox (popover DOM, funciona em contêineres com transform/escala; o Select nativo desloca o popup nesses casos).

## Tokens de design

Fonte canônica: `tokens/` (colors.css, typography.css, spacing.css, effects.css, base.css, fonts.css). Destaques:

- **Cor primária**: indigo `--indigo-600 #5B5BD6` (light); no dark o accent sobe um passo. Neutros slate; superfícies dark "night" tintadas de indigo (`#0E1023 → #1C1F42`).
- **Status**: pares soft + texto (`--success/-soft/-text`, `--warning…`, `--danger…`, `--info…`).
- **Tipografia**: Plus Jakarta Sans (UI 14px/1.5, display extrabold tracking -0.03em), JetBrains Mono para código. Escala 12→60.
- **Espaçamento**: grade de 4px (`--space-1..12`).
- **Raios**: padrão `--radius-md 10px`; cards 14px, modais 20px, pills full, checkbox 4px.
- **Sombras**: slate-tintadas sutis; no dark, elevação por cor de superfície + borda.
- **Animação**: 120–280ms, `--ease-out cubic-bezier(0.16,1,0.3,1)`. Importante: keyframes de entrada animam **apenas transform** (nunca `opacity: 0` no frame inicial) — o estado final visível é o estado base. Manter essa regra.
- **Z-index**: `--z-dropdown 50`, `--z-sticky 100`, `--z-overlay 200`, `--z-dialog 210`, `--z-toast 300`.

## Marca e favicon (inclusos em assets/)

- `lyra-mark.svg` — estrela Vega de 4 pontas, indigo, para fundos claros
- `lyra-mark-light.svg` — variante para fundos escuros
- `favicon.svg` — estrela branca sobre quadrado arredondado indigo (fonte do favicon)
- `favicon-32.png`, `favicon-180.png` (apple-touch-icon), `favicon-512.png` (PWA/manifest)
- No build do site/docs, gerar `favicon.ico` (16+32) a partir de `favicon-32.png` (ex.: `sharp` + `to-ico`)
- Wordmark "Lyra": texto em Plus Jakarta Sans extrabold, tracking -0.02em (ver `guidelines/brand-logo.html` no projeto)

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180.png">
```

## Design da documentação

O design do site de docs **já existe**: página "Docs" em `ui_kits/website/` (detalhada na seção Páginas acima). Estrutura de conteúdo por componente: descrição de uma linha + exemplo de código (fonte: `<Name>.prompt.md`) + tabela de props (fonte: `<Name>.d.ts`) + preview ao vivo.

## Páginas e telas incluídas

Todas em alta fidelidade, interativas, compostas exclusivamente com os primitivos do DS (nenhum componente re-implementado nas telas).

### Dashboard (`ui_kits/dashboard/`) — app SaaS completo, 6 telas

- **Visão geral** — 4 Stats com variação, gráfico de barras (divs + tokens, sem lib), tabela de atividade, card de metas com Progress.
- **Projetos** — toolbar (busca + filtro), grid de cards de projeto (nome mono, badges de status, AvatarGroup), dialog de novo projeto, empty state.
- **Arquivos** — FileManager (busca, lista/grade, breadcrumb com navegação em pastas, ações por item via Dropdown) + card lateral com FileUpload (drag & drop, progresso por arquivo). Grid 2fr/1fr.
- **Membros** — tabela (papel, status, visto por último, menu de ações), drawer "Convidar membros" com Textarea de e-mails + **Combobox** de papel (não usar select nativo aqui — popup desloca sob transform) + Alert.
- **Cobrança** — 3 PlanCards selecionáveis com Radio, método de pagamento, histórico.
- **Configurações** — formulários de perfil/workspace, switches de preferências, zona de perigo.

**Shell**: sidebar de 260px com marca + WorkspaceSwitcher (popover de workspaces + "Criar workspace" → CreateWorkspaceDialog, que adiciona e seleciona o novo workspace) + nav agrupada via SidebarGroup ("Geral" / "Administração", item ativo em accent-soft) + rodapé de usuário. Topbar com título da tela, busca readOnly que abre a **CommandPalette ⌘K** (ações + "Ir para" cada tela), alternador de tema, notificações e avatar com **Dropdown** (e-mail, Perfil, Configurações, tema, Sair em danger). Tema e tela ativa persistem em localStorage.

### Website (`ui_kits/website/`) — landing + docs

- **Landing** — hero, showcase de componentes com tabs preview/código, frameworks, pricing Community/Pro (ciclo mensal/anual + dialog de checkout), comparação de recursos, depoimentos, FAQ em Accordion, CTA final, banner de cookies LGPD.
- **Docs** — **este é o design de referência do site de documentação da lib**: sidebar com grupos (Introdução / Componentes), conteúdo com breadcrumb, título, parágrafos, blocos de código, alerts e navegação anterior/próximo.

### Auth (`ui_kits/auth/`) — 4 telas em layout split

Painel de marca night-indigo (logo, quote de comunidade) + formulário: **Login** (GitHub + e-mail/senha), **Cadastro** em 3 etapas com Stepper (conta → workspace → código), **Recuperar senha** (form → confirmação), **Sucesso**. Medidor de força de senha com Progress.

### Guidelines (`guidelines/`) — 14 specimens

Cards de fundamentos: cores (primária, neutros, semânticas, dark), tipografia (display, body, mono, escala), espaçamento (escala, raios, sombras), marca (logo, voz/copywriting, favicon).

Cada componente também tem seu próprio demo `*.card.html` em `components/<grupo>/` (referem `_ds_bundle.js` do projeto original — abra-os a partir do projeto, não do zip).

## Conteúdo & copywriting

- Docs e copy de UI em **pt-BR**; nomes de API em inglês. Sentence case em tudo; botões = verbo imperativo + objeto; erros dizem como resolver; sem emoji (ícones Lucide).
- Números em formato brasileiro nos exemplos; datas relativas curtas ("há 2h").

## Checklist de publicação

1. `@lyra-ds/styles` 0.1.0 — CSS puro, `"exports": { ".": "./styles.css", "./tokens/*": … }`
2. `@lyra-ds/react` 0.1.0 — ESM + CJS via tsup, types gerados, peerDeps react/react-dom >=18
3. Tree-shaking: um arquivo por componente + sideEffects false (CSS é pacote separado)
4. Docs app com o design de `ui_kits/website` + favicon/logo deste bundle
5. Testes de fumaça: render de cada componente, navegação por teclado de Combobox/CommandPalette/Dropdown, tema escuro
6. README do repositório: instalação (`npm i @lyra-ds/react` + import único do CSS), filosofia CSS-first, white-label em 4 tokens, roadmap de adapters (Vue/Svelte/WC via Zag.js) e registry
7. Gerar `llms.txt` no build a partir dos `.d.ts` e servi-lo na raiz do site de docs (`/llms.txt`)

## Arquivos do bundle

Entregue ao Claude Code o **zip do projeto completo** (este folder `design_handoff_lyra_lib/` vem dentro dele). Mapa do que usar:

- `design_handoff_lyra_lib/README.md` — este guia (começar por aqui)
- `design_handoff_lyra_lib/assets/` — logo (claro/escuro) + favicon (SVG e PNG 32/180/512)
- `readme.md` (raiz) — fundamentos de conteúdo, visual e iconografia
- `llms.txt` (raiz) — referência canônica p/ agentes: regras de geração + tokens + API dos 40 componentes
- `styles.css` + `tokens/` — entry CSS e os 209 tokens (incl. `brand.css` white-label e `compat-shadcn.css` opt-in)
- `components/<grupo>/` — `<Name>.jsx` (implementação), `<Name>.d.ts` (contrato de props), `<Name>.prompt.md` (uso), `<grupo>.css` (estilos), `*.card.html` (demos)
- `ui_kits/` — dashboard (6 telas), website (landing + docs), auth (4 telas)
- `guidelines/` — 14 specimens de cor, tipo, espaçamento e marca + `architecture.html` (decisões)
- `explorations/multibrand-demo.html` — prova white-label (3 marcas × light/dark)
- Ignorar: `_ds_bundle.js`, `_ds_manifest.json`, `_adherence.oxlintrc.json` (artefatos do ambiente de design), demais `explorations/`, `screenshots/`
