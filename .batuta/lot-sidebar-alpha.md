# Lote — componentes em ordem alfabética na sidebar, índice e ⌘K

## Goal

In `apps/docs/lib/components.ts`, make the exported `components` array
alphabetically sorted by `name` while keeping the authored list as-is:
rename the array literal binding to `const manifest: ComponentEntry[] = [...]`
(the existing literal, untouched) and export
`export const components: ComponentEntry[] = [...manifest].sort((a, b) => a.name.localeCompare(b.name));`
immediately after it. Update the doc comment line "append one entry here" to
note the export is name-sorted, so authored position does not matter.

## Acceptance criteria

1. `git diff` shows only: the binding rename, the new sorted export, and the
   one comment line adjusted. Zero entry lines touched.
2. `pnpm --filter @lyra-ds/docs run typecheck` passes (run it; report output).

## Boundaries

Only `apps/docs/lib/components.ts`. Do not commit. Untracked `.batuta/` files
are expected.

## Expected evidence

The `git diff` and the typecheck output.

## Stop conditions

The file's shape differing from the description → stop and report.
