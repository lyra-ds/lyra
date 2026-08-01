# Retry — Lote 1: preview isolado para os componentes de nível de página

Your work is in the tree and most of it is good. **Do not start over.** One structural problem
with two symptoms, and it needs a new capability in the docs machinery.

Original brief: `.batuta/lot-6cb3-01-layout.md`, on top of `.batuta/brief-6cb3-docs.md` and
`.batuta/brief-phase06b-fanout.md`.

## What I verified independently and accepted

Ten pages build and serve in both locales; every one has its generated prop table (no "No
generated props found"); `Container`, `Stack` and `Grid` are **axe-clean** in both locales,
with no console errors and no horizontal overflow. `pnpm typecheck` and `pnpm lint` pass and
the `layout` group is wired in all four places with real labels in `en` and `pt-BR`.

## The defect: two pages ship axe violations

```
page-header  en/pt-BR   heading-order (moderate, 1)
shell        en/pt-BR   landmark-main-is-top-level (2) · landmark-no-duplicate-main (1) · landmark-unique (3)
```

The docs site was at **zero** violations before this lot. That is the bar, and the 6c-b3
brief said so.

### The cause is structural, not a slip

These components are **page-level**: they emit the elements a documentation page already has.

| component | emits | inside a docs page |
| --- | --- | --- |
| `PageHeader` | `<h1>` | a second `h1`, under an `h2` — heading order breaks |
| `Shell` | `<main>` | `<main>` inside `<main>` — **invalid HTML**, not just an axe opinion |

`Navbar` (`<header>`) and `Footer` (`<footer>`) hit the same wall in Lot 2. So this is not a
per-example fix; the docs need a way to preview a page-level component.

**You should have reported this instead of shipping the violations** — the 6b brief's rule is
to write findings in the report rather than work around them, and the 6c-b3 brief named the
zero-violation bar explicitly. Flagging it would have been the right move.

## The decision (already taken — implement it)

`ExampleView` gains an **isolated preview mode**: the example renders inside an `<iframe>` with
its own document, so its `<main>`, `<header>` and `<h1>` never meet the host page's.

`apps/docs/components/example-view.tsx` already has a `layout` axis (`row` | `block` |
`plain`). Extend that machinery — an `isolated` layout, or a separate flag, your call; say
which and why.

Requirements, each of which will be checked:

1. **The DS stylesheet must reach the iframe document.** Injected or linked into its head —
   an unstyled preview is worse than none.
2. **The theme must follow the host.** Mirror `data-theme` from the parent `<html>` onto the
   iframe's, and keep it in sync when the reader toggles. A light demo on a dark page is a
   visible bug.
3. **The iframe needs a `title`.** Without one axe fires `frame-title`, and you would trade
   one violation for another. It must be translatable — no English literal.
4. **Auto-height.** The frame sizes to its content; a fixed height that clips the demo is not
   acceptable. A `ResizeObserver` on the inner body is the usual way.
5. **The printed source stays consumer code.** The iframe belongs to the stage, not the
   example — the code panel must keep showing exactly what a consumer would paste, with no
   wrapper. This is the single-source-of-truth property the 6b phase bought; do not break it.
6. **SSR.** The isolated preview only exists after mount. Say plainly in your report what the
   prerendered HTML contains for those examples, so the trade-off is on the record.

Apply it to the `Shell` and `PageHeader` examples in this lot. Lot 2 will reuse it for
`Navbar` and `Footer`, so leave it general, not Shell-specific.

## Acceptance

1. **axe is back to zero** on all ten pages of this lot, at 1440px, 900px and 375px, in both
   locales. Report the sweep. `frame-title` counts — check for it specifically.
2. The isolated previews render styled, follow the host theme in both directions, and size to
   their content.
3. The code panel for an isolated example prints the same consumer code it would have printed
   inline — no iframe, no wrapper. Show one before/after in your report.
4. The other three pages stay axe-clean and unchanged in behavior.
5. `pnpm typecheck`, `pnpm lint`, `pnpm build` pass with real output.
6. Say which pages you could not verify visually.

## Boundaries

- `packages/` stays read-only. `PageHeader`'s hardcoded `<h1>` and `Shell`'s hardcoded
  `<main>` are **not** yours to change — I am recording them as component findings; the
  isolation is the docs-side answer.
- Do not touch Lot 2's or Lot 3's components.
- Do not commit, branch or push.
