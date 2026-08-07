# Plan — `@lyra-ds/alpine` onda 1 (7 comportamentos core)

**Goal:** Criar `packages/alpine` — pacote npm `@lyra-ds/alpine`, plugin Alpine
(`Alpine.plugin(lyra)`) com um `Alpine.data()` por componente interativo —
portando a máquina de estados exata dos 7 componentes React core (Dropdown,
Dialog, Drawer, Tabs, Accordion, Tooltip, Popover), com testes vitest browser
contra o CSS real e release 0.1.0 via changesets ao fim da onda.
**Created:** 2026-08-06
**Status:** in progress (approved 2026-08-06)

> PRD executável: `~/Documents/prd-lyra-alpine.md`. Spec completa (vence em
> divergência): `~/Projects/lyra-ds/blade/docs/prd-fase-2-alpine.md` (commit
> `01d6209` do repo blade). Decisões fechadas com o usuário em 2026-08-06 —
> não rediscutir.

## Tasks

- [x] 1. **Scaffold `packages/alpine` + shell do plugin** — claude (critical:
      toca CI, release e gates de build) — ENTREGUE: PR #113, commit
      `f285352` (trail: .batuta/runs/2026-08-06-alpine-scaffold.md)
      Criar o workspace `packages/alpine`: `package.json` (`@lyra-ds/alpine`,
      `alpinejs` como peer + devDep, exact versions, `sideEffects: false`),
      tsup (ESM+CJS+dts, TS 5.9.3), exports map == entries == dist basenames
      (convenção do react), entry `src/index.ts` exportando o plugin
      (`export default function lyra(Alpine)`) que registra os `Alpine.data()`
      (vazio por ora), projeto vitest browser para o pacote no
      `vitest.config.ts` raiz, inclusão nos jobs do `.github/workflows/ci.yml`
      (lint/typecheck/test/build + publint/attw/pack-smoke conforme os
      irmãos), changesets cobrindo o pacote, README com o snippet de consumo
      do PRD. Um teste smoke: `Alpine.plugin(lyra)` registra sem erro.
      Accept: `pnpm build`, `pnpm typecheck`, `pnpm test` e a lista COMPLETA
      de comandos do `ci.yml` verdes; `publint`/`attw` limpos no novo pacote;
      teste smoke passa em Browser Mode.

- [x] 2. **`lyraDropdown`** — codex → ESCALADA claude (2 rounds codex
      falharam verificação) — ENTREGUE: PR #116 mergeado 2026-08-07,
      commit `7e69b44` (trail: .batuta/runs/2026-08-06-alpine-dropdown.md)
      Portar `packages/react/src/dropdown/dropdown.tsx`: estado `open`
      (seed `defaultOpen`), classes `lyra-menu--up|--${align}`, ARIA
      (`aria-haspopup="menu"`, `aria-expanded`, `aria-controls`), roving
      focus/teclado, outside-click (`mousedown` no document), e porte de
      `internal/use-flip-placement.ts` como utilitário compartilhado do
      pacote (`src/internal/flip-placement.ts` — Popover reusa). `open`
      exposto via `x-modelable`.
      Accept: testes browser espelhando `dropdown.browser.test.tsx`
      (teclado, classes, outside-click, axe) passam contra o CSS real;
      teste de `x-modelable` (x-model sincroniza nos 2 sentidos) passa;
      `pnpm test` verde.

- [x] 3. **`lyraDialog`** — codex (complex, worktree) — ENTREGUE: PR #117
      mergeado 2026-08-07, commit `6dc5762`, 1 round codex + fix do maestro
      (root cause x-show/mounted — ver trail
      .batuta/runs/2026-08-07-alpine-dialog.md)
      Portar `dialog/dialog.tsx`: estado `open` (no React é controlado;
      aqui o `Alpine.data` gerencia com seed por argumento e `x-modelable`),
      classes `lyra-dialog--closing`/overlay `--closing` (presence de
      saída), `role="dialog"`, `aria-modal`, `aria-labelledby`, foco
      inicial, Esc. Porte dos utilitários `focus-trap`, `scroll-lock` e
      `presence` para `src/internal/` (Drawer reusa). Decidir no brief a
      estratégia de camada (markup servido in-place; avaliar `x-teleport`
      só se o stacking exigir — registrar a escolha no run trail).
      Accept: testes espelhando `dialog.browser.test.tsx` (focus trap,
      caminhos de fechamento, scroll lock, axe, transição de saída) +
      `x-modelable` passam; `pnpm test` verde.

- [x] 4. **`lyraDrawer`** — codex (complex, worktree) — ENTREGUE: PR #118
      mergeado 2026-08-07, commit `0a848c3`, 1 round codex limpo (brief
      com lições 5–6 evitou reincidências)
      Portar `drawer/drawer.tsx` reusando focus-trap/scroll-lock/presence
      da task 3: classes `lyra-drawer--closing`/overlay, `role="dialog"`,
      `aria-modal`, Esc, `open` com `x-modelable`.
      Accept: testes espelhando `drawer.browser.test.tsx` + `x-modelable`
      passam; `pnpm test` verde.

- [x] 5. **`lyraTabs`** — codex (complex, worktree) — ENTREGUE: PR #119
      mergeado 2026-08-07, commit `5568657`, 1 round codex + fix de teste
      do maestro (fixture: capture no alvo + evento sem cancelable)
      Portar `tabs/tabs.tsx`: estado `active` (seed por argumento,
      `x-modelable`), `lyra-tab--active`, `hidden` nos painéis,
      `aria-selected`, `aria-controls`, `tabIndex` roving, setas/Home/End
      com ativação automática.
      Accept: testes espelhando `tabs.browser.test.tsx` (navegação por
      teclado, classes, axe) + `x-modelable` passam; `pnpm test` verde.

- [x] 6. **`lyraAccordion`** — codex (complex, worktree) — ENTREGUE: PR #120
      mergeado 2026-08-07, commit `7e3ff43`, 1 round codex limpo; o PR
      absorveu a saga de CI (PRs #121/#122 de teste + #123 when-visible)
      Portar `accordion/accordion.tsx`: `openItems` (Set no React; expor
      como array em `x-modelable` — Livewire/JSON não serializa Set),
      `defaultOpen`, `multiple`, `lyra-acc__item--open`, `inert` no
      panel-wrap fechado, animação de altura.
      Accept: testes espelhando `accordion.browser.test.tsx` (toggle,
      inert, animação, axe) + `x-modelable` (array) passam; `pnpm test`
      verde.

- [x] 7. **`lyraTooltip`** — codex (complex, worktree) — ENTREGUE: PR #124
      mergeado 2026-08-07, commit `4f93fe1`, 1 round codex limpo (paralelo
      ao #120)
      Portar `tooltip/tooltip.tsx`: estado `open` autogerido (paridade: o
      React não expõe controle — sem `x-modelable` aqui, registrado como
      decisão), `data-state`, classes de placement
      `lyra-tooltip--bottom|left|right`, Esc no document, porte de
      `use-tooltip-placement.ts` como `src/internal/tooltip-placement.ts`.
      Accept: testes espelhando `tooltip.browser.test.tsx` (flip de
      placement, Esc, foco, axe) passam; `pnpm test` verde.

- [x] 8. **`lyraPopover`** — codex (complex, worktree) — ENTREGUE: PR #125
      mergeado 2026-08-07, commit `42550f4`, 1 round codex limpo
      Portar `popover/popover.tsx`: `open` (seed `defaultOpen`,
      `x-modelable`), classes `lyra-popover--bottom|top` +
      `--align-start|end|center`, outside-click + Esc no document, trigger
      no padrão Alpine (bindings nomeados — sem Slot), reuso do
      flip-placement da task 2.
      Accept: testes espelhando `popover.browser.test.tsx` (fusão de
      trigger adaptada a bindings, outside-click, Esc, placement, axe) +
      `x-modelable` passam; `pnpm test` verde.

- [x] 9. **Release 0.1.0** — claude — README final PR #126 mergeado
      2026-08-07 (`4871d39`); 8 changesets minor acumulados; **Version
      Packages do bot fica com o USUÁRIO** (nunca automatizar). Onda 1
      completa: 7 componentes em 11 PRs (#113, #116–#126).
      README final (consumo, lista dos 7 `Alpine.data`, nota da matriz
      `blade 0.x ⇄ styles ^0.4 ⇄ alpine 0.x` e contra qual styles foi
      testado), conferência de changesets acumulados (um por task),
      publint/attw/pack-smoke, abrir o PR da onda restante se houver e
      deixar o Version Packages para o usuário mergear (NUNCA automatizar).
      Accept: todos os gates do `ci.yml` verdes; changeset de minor
      presente; Version Packages criado pelo bot e entregue ao usuário.

## Decisions and context

- **Decisões fechadas (2026-08-06, sessão blade + confirmação nesta sessão):**
  só README nesta onda (guia em `apps/docs` fica para ciclo futuro); release
  0.1.0 no fim da onda, sem snapshot — o blade consome o pacote publicado.
- **Fonte de verdade do comportamento:** `packages/react/src/*` e seus testes
  browser. Inventário do scout (2026-08-06, kimi-k2.7-code, verificado):
  Dialog/Drawer usam `useFocusTrap` + `useScrollLock` + `usePresence` +
  `Portal`; Dropdown/Popover usam `useFlipPlacement` (+ `Slot` no trigger);
  Tooltip usa `useTooltipPlacement`; Accordion usa `inert`; Tabs é puro.
  Utilitários são portados na PRIMEIRA task que precisa deles e reusados.
- **Paridade de API:** props que semeiam estado viram argumento do
  `x-data` (`defaultOpen`, `active`, `openItems`, `multiple`, `align`…).
  Estado controlável expõe `x-modelable` (requisito de primeira classe —
  Livewire/`wire:model` de graça). Dialog/Drawer no React são controlados
  (`open`/`onClose`); no Alpine o dado interno gerencia `open` e o
  `x-modelable` é o canal de controle. Tooltip não é controlável no React —
  paridade mantida (sem modelable). Accordion expõe `openItems` como array.
- **Ordem = ordem de valor do PRD** (Dropdown → Popover), que também resolve
  as dependências de utilitários (flip na 2, overlay na 3).
- **Branch flow:** cada task sai numa feature branch + PR (main protegida,
  4 checks + 1 approval); worktree `medium+` por task; codex com
  `< /dev/null`, brief em arquivo `.batuta/`, prompt mínimo; codex NÃO roda
  Browser Mode — o maestro sempre roda `pnpm test` e a lista completa do
  `ci.yml` (17 comandos — ler o workflow, não a lista abreviada).
- **Armadilhas conhecidas (profile):** `expect.element` para asserções de
  existência em Browser Mode (locator nunca é null); changeset por task;
  landing stats do site rastreiam inventário — verificar se a adição de um
  PACOTE (não componente React) mexe nos pins antes de assumir que não.
- **Fora de escopo:** demais 28 interativos, fallbacks sem-JS, embarcar
  Alpine, docs no site, integração Livewire (provada no repo blade).
