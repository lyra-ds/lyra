# Lote — o grid do índice de componentes perde a cascata para a prosa

## Goal

In `apps/docs/app/site.css`, the rule block that starts with the selector
`.lw-index__grid {` (around line 173) must have its selector line replaced by
this two-selector list (two lines):

```
.lw-index__grid,
.lyra-prose ul.lw-index__grid {
```

Nothing else changes — the declarations inside the block stay identical.

## Context

`.lyra-prose :is(ul, ol)` in the styles package has specificity 0,1,1 and
overrides the current 0,1,0 selector (`display: flex; gap: 4px` win over the
grid). The prefixed selector (0,2,1) wins decisively; the bare selector stays
for any future use outside `.lyra-prose`.

## Acceptance criteria

1. `git diff` shows exactly one changed selector line becoming two lines; zero
   declaration changes.

## Boundaries

Touch ONLY that selector in `apps/docs/app/site.css`. Do not commit. Untracked
files under `.batuta/` are expected and fine.

## Expected evidence

The `git diff` output.

## Stop conditions

Selector `.lw-index__grid {` not found → stop and report.
