# Lot 1/5 — `Shell` + `.lyra-prose`

Sits on top of the shared brief `.batuta/brief-6cb2-chrome.md`. Read that first, in full.

## Goal

Ship the two halves of a documentation page as design-system primitives: `Shell`, the
three-rail layout container with two scroll models, and `.lyra-prose`, a CSS-only
typographic scope. Then prove both by rebuilding the `apps/docs` page layout on top of
them, deleting the local CSS they replace.

This lot also establishes the mechanics the remaining four lots inherit: the new
`chrome.css` file, the `Chrome` docgen category, and the parity registration for a CSS file
that has no handoff counterpart.

## Context

### Where this CSS comes from

Everything here already exists and is validated in production, in
`apps/docs/app/site.css`. You are moving it into the design system, generalizing the parts
that were hardcoded to this one site. **Read that file before writing any CSS.** The rules
that matter are `.lw-docs`, `.lw-docs__side`, `.lw-docs__content` (both the layout and the
prose rules that target its child elements), `.lw-toc`'s sticky/scroll block, and the two
grid media queries near the end.

Three pieces of that CSS encode expensive, hard-won knowledge. They must survive verbatim,
not be "cleaned up":

1. **`max-height` declared twice, in `vh` then `dvh`.** Sticky alone cannot hold a rail
   taller than the viewport — it only unsticks after the body has scrolled past the
   overflow, so the rail needs its own scroll. The `dvh` repetition exists because the iOS
   toolbar collapsing cut off the last items. The duplicate declaration is the fallback
   for engines without `dvh`; do not collapse it to one.
2. **`overscroll-behavior: contain`** on both rails, so scrolling to the end of a rail does
   not start scrolling the page behind it.
3. **The collapse order: the aside disappears at 1100px, then the sidebar stacks at
   900px.** This order was found empirically. Preserve both breakpoints and their order.

Media queries cannot read custom properties, so these two breakpoints stay literal in the
CSS. Document them in a comment as the component's responsive contract.

### The `.lyra-appshell*` classes already in the package

`packages/styles/components/layout/layout.css` already contains `.lyra-appshell`,
`__sidebar`, `__main`, `__topbar`, `__content` and `__content--padded`. They arrived
verbatim from the handoff delta and they are exactly the content-scroll model. There is
deliberately **no** `AppShell` React component — it was absorbed into `Shell`.

**The decision, already taken: `Shell` emits only the `.lyra-shell*` vocabulary, in both
modes.** Rewrite the content-scroll declarations in `chrome.css` under `.lyra-shell` class
names. Do not make `Shell` emit `.lyra-appshell*` in one mode and `.lyra-shell*` in the
other; a component whose class family changes with a prop is unusable from Vue or Blade,
where the consumer writes the class names by hand.

The `.lyra-appshell*` rules stay where they are, untouched — parity forbids deleting them.
They become CSS with no wrapper. That cost was weighed and accepted; it is not a problem
for you to solve.

## The API — implement exactly this

### `Shell`

```tsx
<Shell sidebar={…} topbar={…} aside={…} scroll="page" | "content">
  {main}
</Shell>
```

- All three slots are optional `ReactNode`. A slot left empty renders **no element at all**
  — not an empty div that still occupies a grid column.
- `scroll` defaults to `"page"`. There is no `variant` prop: the two modes differ in scroll
  engine, not appearance.
  - `"page"` — the document scrolls; the sidebar and aside are sticky rails with their own
    overflow. This is the docs model.
  - `"content"` — the main region is the scroll container, sidebar full height beside it.
    This is the app model (what `.lyra-appshell` describes today).
- Children render inside a `<main class="lyra-shell__main">`. The sidebar and aside render
  in their own elements; choose the element that carries the right semantics and say why.
- Extends `HTMLAttributes<HTMLDivElement>`, forwards its ref, merges `className`.

Custom properties, **defaults declared in the CSS only**:

| Property          | Default | Meaning                                                        |
| ----------------- | ------- | -------------------------------------------------------------- |
| `--shell-sidebar` | `220px` | sidebar rail width                                             |
| `--shell-aside`   | `200px` | aside rail width                                               |
| `--shell-top`     | `0px`   | sticky offset — how far below the viewport top the rails begin |

Expose them as optional props following the `Container`/`--container-max` pattern exactly
(typed `CSSProperties &` intersection; prop `undefined` emits nothing). The docs site sets
`--shell-top` to `84px` because of its sticky header — that offset is a consumer concern,
never a hardcoded 84 in the package.

### `.lyra-prose` — CSS only, no React component

A typographic scope: one class on a container, styling the plain HTML inside it. This is
the most CSS-first item in the batch — it must work in Vue, Blade or LiveView with no
JavaScript at all.

Cover what the docs already styles (`h1`, `h2`, `h3`, `p`, `a`, `strong`, inline `code`)
**plus** what any consumer writing prose needs and the docs happens not to use yet:
`ul`/`ol`/`li`, `blockquote`, `hr`. Derive every value from existing tokens — no new token,
no magic number.

Two custom properties, defaults in the CSS:

| Property                | Default | Meaning                                                                   |
| ----------------------- | ------- | ------------------------------------------------------------------------- |
| `--prose-measure`       | `760px` | max line length of the prose column                                       |
| `--prose-scroll-offset` | `0px`   | `scroll-margin-top` on headings, for anchored links under a sticky header |

`760px` is the value validated in production — pixel fidelity is a locked project
constraint, so it is the default even though a `ch`-based measure would be more
typographically orthodox.

Two behaviors to carry over verbatim, both from real measurements:

- **`overflow-wrap: anywhere` on inline code.** Inline code in prose is often one
  unbreakable token — a package subpath, a long class name. Without this, such a token
  cannot wrap and pushes the document sideways: measured, a 375px viewport scrolled to
  390px on the plain-HTML guide. `anywhere`, not `break-word`, which still refuses to break
  inside a single long word. Block code is unaffected — it scrolls instead of wrapping,
  which is correct for code you may want to copy line by line.
- **The link guard.** Prose link styling must not capture a link that is styled as a
  button. The existing rule is `a:not(.lyra-btn)`. Keep that shape and document it.

## Acceptance criteria

Each of these is checked against the diff, independently, by the maestro.

1. `packages/styles/components/chrome/chrome.css` exists, holds the `.lyra-shell*` and
   `.lyra-prose` rules, and is `@import`ed by `packages/styles/styles.css`.
2. `pnpm --filter @lyra-ds/styles run lint:css` passes.
3. `pnpm parity` passes, with the new classes registered as **ours** (additive, enumerated)
   and never as handoff-verbatim. `tools/parity/baseline.json` is regenerated in the same
   commit and its diff is reported.
4. **The parity tripwire still bites.** Add `.lyra-zzz { color: red }` to `chrome.css`, run
   `pnpm parity`, confirm it **fails**, remove it, confirm it passes again. Report both
   outputs verbatim. A gate that accepts any new class is not a gate.
5. `Shell` is registered in all five places listed in the shared brief, and
   `node tools/docgen/generate.mjs --check` passes with `Chrome` in `CATEGORY_ORDER` and
   `EXPECTED_COMPONENTS` bumped from 46 to 47 (comment updated, not just the number).
6. `handoff/components/chrome/Shell.d.ts` exists and matches the shipped public type. No
   other file under `handoff/` is created, edited or deleted — in particular, **no
   `chrome.css` under `handoff/`**.
7. With every slot omitted, `Shell` renders no empty rail elements. Proven by a test.
8. `scroll="page"` and `scroll="content"` produce different, correct layouts; both are
   covered by browser tests, and both rails keep their own scroll with the `vh`+`dvh`
   pair and `overscroll-behavior: contain` intact.
9. Each of `--shell-sidebar`, `--shell-aside`, `--shell-top` is settable through its prop,
   emits nothing when the prop is `undefined`, and falls back to the stylesheet default.
   Proven by a test that reads the computed value.
10. `Shell` renders correctly server-side (`shell.ssr.test.ts`).
11. **The docs site is rebuilt on the new primitives.** In
    `apps/docs/app/[lang]/layout.tsx` the hand-rolled `.lw-docs` grid is replaced by
    `<Shell>` with the sidebar and TOC in their slots and `--shell-top` set to the header
    offset; the main region carries `.lyra-prose`. `apps/docs/components/docs-sidebar.tsx`
    and `apps/docs/components/toc.tsx` stop providing their own rail chrome and let the
    Shell slots own it. Whatever queries `.lw-docs__content` is updated to a selector that
    still exists.
12. **The replaced rules are deleted from `apps/docs/app/site.css`** — `.lw-docs`,
    `.lw-docs__side`, `.lw-docs__content` and its prose child rules, the sticky/scroll
    block that `.lw-toc` shares with the rails, and the grid media queries. Leaving dead
    CSS behind defeats the point of the lot. Site-specific rules that nothing replaced
    stay.
13. `.lw-container` in the docs layout is replaced by the existing `Container` component.
    **Check the gutter before you do:** `.lw-container` pads with `var(--space-6)` while
    `.lyra-container` pads with `var(--content-gutter)`. If those two resolve to different
    values, pixel fidelity wins — keep the rendered result identical and say how.
14. The docs site still renders identically at 1440px, 1100px, 900px and 375px: the aside
    drops first, then the sidebar stacks, and there is **no horizontal scroll at 375px**.
    Report what you were able to verify and what you could not.
15. `pnpm run lint`, `pnpm --filter @lyra-ds/react run lint`, `pnpm --filter @lyra-ds/react
run build` and `pnpm run typecheck` all pass, with real output reported.
16. `pnpm --filter @lyra-ds/react exec size-limit` passes, with a budget entry for `Shell`.
17. A changeset exists, minor for both packages, written for a consumer: what they can now
    build that they could not before.

## Boundaries — do not touch

- `packages/styles/components/layout/layout.css` — the `.lyra-appshell*` rules stay exactly
  as they are.
- Any component outside this lot. `Navbar`, `Footer`, `TableOfContents`, `CodeBlock`,
  `SegmentedControl`, `CommandPalette.Trigger` and `Brand` belong to later lots. In
  particular: `apps/docs/components/toc.tsx` is adapted only where the Shell slot requires
  it — do not rewrite it into the future `TableOfContents` component.
- `apps/docs` MDX content and `apps/docs/lib/components.ts`. Documentation pages for the
  new components are a separate later lot; do not add any.
- Everything in the shared brief's global boundaries.
- Do not commit, branch or push.
