# Fix candidato — styles: hover sobrepõe o active no SegmentedControl

> Para: sessão Batuta do monorepo `lyra`, `packages/styles`.
> De: sessão Batuta do `lyra-ds/blade`, 2026-08-09. Confirmado pelo usuário
> como erro de CSS que reflete no React também.

## Sintoma

No SegmentedControl, o option recém-selecionado sob o cursor mostra o
background de hover (`--surface-sunken`) em vez do de active
(`--accent-soft`) — o estado ativo "some" enquanto o mouse está em cima.
Reproduzido e medido no browser (computed styles) via blade-demo; o React
tem o mesmo comportamento porque o CSS é o mesmo.

## Causa

`packages/styles/components/chrome/chrome.css`:

- linha ~326: `.lyra-segmented__option:hover:not(:disabled)` — specificity 0-3-0
- linha ~330: `.lyra-segmented__option--active` — specificity 0-1-0

O hover vence o active em qualquer option, inclusive o selecionado.

## Fix sugerido (escolher um)

1. Excluir o ativo do hover:
   `.lyra-segmented__option:hover:not(:disabled):not(.lyra-segmented__option--active)`
2. Ou regra de override após a do active:
   `.lyra-segmented__option--active:hover { color: var(--accent-soft-text); background: var(--accent-soft); }`

O anel de `:focus-visible` NÃO é parte do fix — é a11y intencional e fica.

## Verificação

Screenshot/browser test: option ativo sob hover mantém `--accent-soft`;
options inativos mantêm o hover atual. Conferir se outros componentes do
styles repetem o padrão hover-vence-active (tabs? bottom-nav?) e alinhar
na mesma passada se fizer sentido.
