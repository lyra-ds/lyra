# Lot 2/5 — `Navbar` + `NavLink` + `Footer`

Sits on top of the shared brief `.batuta/brief-6cb2-chrome.md`. Read that first, in full.

Lot 1 already created `packages/styles/components/chrome/chrome.css`, the `Chrome` docgen
category and the parity registration for that file. Extend what exists; do not recreate it.

## Goal

Ship the top and bottom chrome of a site as design-system components: a `Navbar` with a
`NavLink`, and a `Footer`. Both are **shells with slots**, not finished bars. Then rebuild
`apps/docs`'s header and footer on top of them.

## Context

### The risk that defines this lot

A `Navbar` that only serves the Lyra site is worse than no `Navbar` at all — it is debt
wearing a component's clothes. The test to apply to every decision here: **if the API
presupposes our copy, our links or our brand, it is site chrome, not a component.**

Concretely: the brand, the navigation and the actions are `ReactNode` slots the consumer
fills. The component owns layout, spacing, borders, sticky behavior and the responsive
reflow — nothing about what goes inside.

### Where this CSS comes from

`apps/docs/app/site.css`, validated in production. Read it first. The relevant rules:
`.lw-header`, `.lw-header__inner`, `.lw-header__actions`, `.lw-nav`, `.lw-nav__link`,
`.lw-nav__link--active`, the `@media (max-width: 900px)` header block, and
`.lw-footer`/`__inner`/`__note`/`__links`.

Two behaviors that must survive:

1. **The 900px reflow.** Below 900px the header row cannot hold brand + nav + five actions:
   it overflowed the viewport and scrolled the whole page sideways. The fix was to **wrap
   the nav onto its own row**, not to hide navigation. Preserve that: `flex-wrap`, `height:
   auto`, the nav taking `order: 3` and full width. Hiding navigation on small screens is a
   regression, not a simplification.
2. **Chrome links never underline.** `base.css` underlines `a:hover` globally; the chrome
   rules opt out. Carry that opt-out for the classes this lot owns.

### The touch-target block

Near the end of `apps/docs/app/site.css` there is a `@media (pointer: coarse),
(any-pointer: coarse), (max-width: 1180px)` block enforcing a 44px minimum on several
chrome targets. It exists because an iPad in "desktop site" mode reports `pointer: fine`,
so `pointer: coarse` alone excluded the tablets that needed it most.

That block lists selectors belonging to several different lots. **Move only the selectors
this lot owns** (`.lw-nav__link`, and `.lw-brand` if the brand slot needs it) into the
equivalent rule in `chrome.css`, and leave the rest of the block intact in the docs site.
Do not delete selectors other lots still depend on.

## The API — implement exactly this

### `Navbar`

```tsx
<Navbar brand={…} nav={…} actions={…} sticky />
```

- `brand`, `nav`, `actions`: optional `ReactNode` slots. No `children`.
- `sticky`: optional boolean, **default `true`** — declared in the CSS, so the default class
  is sticky and the prop only opts out. Do not implement it as a JS default.
- Renders a `<header>` with an inner row; the `nav` slot renders inside a `<nav>` element so
  the navigation is a landmark.
- A `<nav>` landmark needs an accessible name when a page has more than one. Expose a prop
  for it and redeclare it in the interface with JSDoc (an inherited prop the component
  handles specially does not appear in the generated props table otherwise).
- Extends `HTMLAttributes<HTMLElement>`, forwards its ref, merges `className`.

### `NavLink`

```tsx
<NavLink href="/docs" active>Docs</NavLink>
<NavLink asChild active><Link href="/docs">Docs</Link></NavLink>
```

- Renders an `<a>` by default.
- **`asChild` is a requirement, not a convenience.** Without it the docs site cannot use
  this component at all: it navigates with Next's `<Link>`, and rendering a `<button>` or a
  plain `<a>` loses client-side routing, prefetch, open-in-new-tab and copy-link. Follow the
  existing `asChild` implementation in the repo (`Button`, `Card`) — same mechanism, same
  prop merging, and no extra Tab stop or nested interactive element.
- `active`: optional boolean. Applies the active class **and** sets `aria-current="page"`.
  Visual state alone is not accessible state.
- Extends the anchor attributes, forwards its ref, merges `className`.

### `Footer`

```tsx
<Footer brand={…} note={…} links={…} />
```

- Three optional `ReactNode` slots, no `children`. The `brand` slot exists because the docs
  footer carries a mark, and a footer that can only hold a note and links would force the
  consumer back to raw classes.
- Renders a `<footer>`, with the links group in a labelled `<nav>` when the slot is filled.
- Extends `HTMLAttributes<HTMLElement>`, forwards its ref, merges `className`.

### What does NOT become a component

`.lw-header__cta` — the "Get started" button that disappears below 900px. Its only
destination is a link one row below on this specific site. It stays site chrome.

## Acceptance criteria

1. `.lyra-navbar*`, `.lyra-navlink*` and `.lyra-footer*` rules live in
   `packages/styles/components/chrome/chrome.css`; `pnpm --filter @lyra-ds/styles run
   lint:css` and `pnpm parity` pass, baseline regenerated and its diff reported.
2. `Navbar`, `NavLink` and `Footer` are each registered in all five places from the shared
   brief; `node tools/docgen/generate.mjs --check` passes with `EXPECTED_COMPONENTS`
   raised by 3 (comment updated).
3. `handoff/components/chrome/Navbar.d.ts`, `NavLink.d.ts` and `Footer.d.ts` exist and
   match the shipped types. Nothing else under `handoff/` changes.
4. Every slot is optional and an empty slot renders no element. Proven by tests.
5. `NavLink asChild` renders the child element with the link's classes and props merged,
   produces **exactly one** focusable element (no nested interactive), and `active` sets
   both the class and `aria-current="page"`. Proven by browser tests.
6. `sticky` defaults to sticky via the stylesheet, and the prop can opt out. No default
   duplicated in JS.
7. At 375px the header wraps the nav onto its own row and **the page does not scroll
   horizontally**; navigation remains reachable. Proven, and reported with what you could
   and could not verify.
8. The nav landmark has an accessible name, and the accessible-name prop appears in the
   generated props table (`tools/docgen/output/props.json`).
9. Both components render server-side (`*.ssr.test.ts`).
10. **The docs site is rebuilt on them.** `apps/docs/components/site-header.tsx` and
    `site-footer.tsx` use `Navbar`/`NavLink`/`Footer` with their existing content in the
    slots; the rules those components replace are **deleted** from
    `apps/docs/app/site.css`; the site-specific `.lw-header__cta` and the brand markup stay.
11. The docs header and footer look identical before and after at 1440px, 900px and 375px.
12. `size-limit` has a budget entry per new component and passes. If `asChild` grows the
    budget on purpose, update it in the same commit and say by how much.
13. All four CI jobs' commands run, with real output reported and anything unrunnable
    named. A changeset exists, minor for both packages, in consumer-facing voice.

## Boundaries — do not touch

- `Shell`, `.lyra-prose` and anything Lot 1 delivered, beyond composing with them.
- `TableOfContents`, `CodeBlock`, `SegmentedControl`, `CommandPalette.Trigger`, `Brand` —
  later lots. In particular, do **not** turn the brand markup into a component here; it is
  Lot 5. Pass it through the `brand` slot as it stands today.
- The touch-target media query's selectors that belong to other lots.
- `apps/docs` MDX content and `apps/docs/lib/components.ts`.
- The shared brief's global boundaries. Do not commit, branch or push.
