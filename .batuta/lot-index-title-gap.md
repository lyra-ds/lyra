# Lote — respiro entre o título do grupo e o grid do índice de componentes

## Goal

In `apps/docs/app/site.css`, in the block whose selector list is
`.lw-index__grid, .lyra-prose ul.lw-index__grid` (~line 173), change the
declaration `margin: 0;` to `margin: var(--space-3) 0 0;`. One declaration,
nothing else.

## Context

The prose layer spaces elements by margin-top; the grid block zeroes its own
margin, so group headings sit flush against the cards (measured 0px live).

## Acceptance criteria

1. `git diff` shows exactly that one declaration changed.

## Boundaries

Only that declaration. Do not commit. Untracked `.batuta/` files are expected.

## Expected evidence

The `git diff` output.

## Stop conditions

Block or declaration not found → stop and report.
