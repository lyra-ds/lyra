# Plan: Fase 4 — Component Batch Conversion & A11y

Importado do roadmap GSD (`.planning/ROADMAP.md`) em 2026-07-20. Próxima fase
do projeto. Depende da Fase 3 (completa).

**Goal**: os 40 componentes funcionam como React acessível e SSR-safe,
emitindo exatamente as classes `.lyra-*` do handoff.

**Requirements**: RCT-01, RCT-02, RCT-06..RCT-10, A11Y-01..A11Y-04

## Critérios de sucesso

1. 40 componentes com TypeScript completo (peerDeps react/react-dom >=18);
   testes de class-parity provam que cada um emite exatamente as classes
   `.lyra-*` do handoff.
2. Dialog, Drawer, CommandPalette e Toast renderizam via portal em
   `document.body` com guards SSR; os 40 passam `renderToString` sem crash.
3. Dialog/Drawer/CommandPalette: focus trap, Esc fecha, foco restaurado à
   origem em todo caminho de close. Combobox e CommandPalette: padrão APG
   listbox com `aria-activedescendant` e navegação completa por teclado.
4. axe-core zero violations nos 40, light e dark; componentes interativos
   (Tabs, Dropdown, Accordion, Stepper, Pagination, Switch…) com testes reais
   de teclado em Browser Mode.
5. FileUpload com API real (`onFiles(files)` + `items`/`onChange` controlado,
   simulação como demo opt-in); contrato controlled/uncontrolled honrado
   conforme `.d.ts`; JSDoc canônico em inglês.

## Contexto herdado da Fase 3 (reusar, não reinventar)

- Receitas de conversão travadas: SIMPLE (Button), REGISTRY (Icon), FORM
  (Input), OVERLAY (Dialog) — ver `packages/react/CONVENTIONS.md` e os dois
  templates de teste (smoke light/dark + axe por fixture; SSR renderToString).
- `src/internal/`: cx, useControllableState, Portal (useSyncExternalStore
  para SSR guard), useFocusTrap, usePresence, useScrollLock — privados, fora
  do exports map, importados por caminho relativo.
- CSS extra de componente: append no FIM do arquivo agregado + entrada exata
  em ADDITIVE_EXTENSIONS do parity (classes e keyframes, sem wildcard).
- Testes importam `@lyra-ds/styles` só em `*.test.*` (carve-out do eslint);
  código shipped nunca importa CSS.
- Contraste dark primary/danger 4.39:1 é finding axe PERMITIDO (tokens
  travados da Fase 2) — só esse; ver deferred-items do GSD.
- Novos componentes: entrada no exports map == entry do tsup == basename do
  dist; budget size-limit por componente; `sideEffects: false`.

## Pesquisa pendente (flag herdada)

WAI-ARIA APG por padrão (Combobox com listbox popup, Dialog Modal, tabelas de
teclado de Menu button) ANTES de planejar o lote — a escolha errada entre foco
real vs `aria-activedescendant` é silenciosa e cara de reverter.
