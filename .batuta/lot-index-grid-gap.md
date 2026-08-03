# Lote — espaçamento do grid de cards do índice de componentes

## Goal

In `apps/docs/app/site.css`, inside the `.lw-index__grid` rule, change
`gap: var(--space-2);` to `gap: var(--space-4);`. One line, nothing else.

## Context

The rule starts at line ~173. `--space-4` = 16px in the design tokens; the
current 8px leaves interactive cards nearly touching.

## Acceptance criteria

1. `git diff` shows exactly one changed line: the `gap` declaration inside
   `.lw-index__grid` now reads `gap: var(--space-4);`.
2. No other rule, file or selector touched.

## Boundaries

Touch ONLY that one declaration in `apps/docs/app/site.css`. Do not commit.
Untracked files under `.batuta/` are expected and are not a problem.

## Expected evidence

Report the `git diff` output.

## Stop conditions

If the selector `.lw-index__grid` or the `gap: var(--space-2);` line is not
found, stop and report.
