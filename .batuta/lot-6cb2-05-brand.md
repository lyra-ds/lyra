# Lot 5/5 — `Brand`

Sits on top of the shared brief `.batuta/brief-6cb2-chrome.md`. Read that first, in full.

Lot 1 created `packages/styles/components/chrome/chrome.css`, the `Chrome` docgen category
and the parity registration. Extend what exists.

## Goal

Ship `Brand`: a product mark plus wordmark that swaps its image between light and dark
theme. Then delete the duplicated implementation from the docs site's header and footer.

## Context

### The duplication this removes

`apps/docs/components/site-header.tsx` and `apps/docs/components/site-footer.tsx` each carry
the same 14 lines: two `<img>` elements, one for each theme, each with its own
`eslint-disable` comment, plus the `.lw-brand`/`.lw-mark`/`.lw-brand__word` classes and the
`.ld-mark-light`/`.ld-mark-dark` pair that hides one of them per `[data-theme]`.

Read both files and `apps/docs/app/site.css` (the `.lw-brand`, `.lw-mark`,
`.ld-mark-light`, `.ld-mark-dark`, `.lw-brand__word` rules) before writing.

### Why the theme swap is a CSS concern

The mark swap is four CSS rules keyed on `[data-theme]`. Doing it in JavaScript would mean
reading the theme at render time, which is a hydration mismatch waiting to happen, and it
would not work at all in Vue, Blade or LiveView. **Both images render; CSS hides one.**
Keep that.

The images themselves stay assets of the consumer — the design system never ships or
hardcodes a mark file.

## The API — implement exactly this

```tsx
<Brand mark="/lyra-mark.svg" markDark="/lyra-mark-light.svg" href="/">Lyra</Brand>
<Brand mark="/lyra-mark.svg" markDark="/lyra-mark-light.svg">Lyra</Brand>
<Brand asChild mark="…" markDark="…"><Link href="/">Lyra</Link></Brand>
```

- `mark`: image source used in light theme. Required.
- `markDark`: optional image source for dark theme. Omitted → `mark` is used in both, with
  no second image rendered.
- `children`: the wordmark. Optional — a mark-only brand must work.
- `size`: optional mark edge in pixels, as a custom property with its default in the CSS
  (24px, the value in production). Follow the `Container`/`--container-max` pattern.
- `href`: optional. Present → renders an `<a>`; absent → renders a non-interactive `<span>`.
  The footer's brand is not a link today and must not become one.
- `asChild`: renders the consumer's own element (a framework `<Link>`) with the brand's
  classes and props merged. Same mechanism as `Button`/`Card`/`NavLink` in this repo.
  Mutually exclusive with `href` — decide how to express that in the types and say how.
- The mark images are decorative when a wordmark is present (`alt=""`); with no wordmark,
  the brand needs an accessible name. Expose a prop for it, redeclare it in the interface
  with JSDoc, and default the behavior sensibly. State the rule you implemented.
- Extends the appropriate HTML attributes, forwards its ref, merges `className`.

The `<img>` elements are plain HTML. The design system cannot import a framework's image
component, and a consumer who wants one uses `asChild` on their own wrapper or passes their
own markup — if that turns out to be impossible with this API, stop and report rather than
inventing a slot.

## Acceptance criteria

1. `.lyra-brand*` rules live in `chrome.css`, including the `[data-theme]` pair that hides
   one mark; `lint:css` and `pnpm parity` pass, baseline regenerated and its diff reported.
2. `Brand` registered in all five places; `handoff/components/chrome/Brand.d.ts` exists and
   matches the shipped type; `node tools/docgen/generate.mjs --check` passes with
   `EXPECTED_COMPONENTS` raised by 1 (comment updated). Nothing else under `handoff/`
   changes.
3. With `markDark`, both images render and CSS hides exactly one per theme — verified in
   **both** light and `[data-theme="dark"]`. Without `markDark`, only one image renders.
   Proven by browser tests in both themes.
4. No theme is read in JavaScript. Show the absence as evidence (no `useTheme`, no
   `matchMedia`, no `data-theme` read in the component).
5. `href` renders an `<a>`; its absence renders a non-interactive element; `asChild` renders
   the child with props merged and produces exactly one focusable element. Proven by tests.
6. A mark-only `Brand` (no children) has an accessible name; a `Brand` with a wordmark does
   not repeat that name to a screen reader. Proven by tests.
7. `size` sets the custom property, emits nothing when `undefined`, and falls back to the
   stylesheet default. Proven by a test reading the computed value.
8. Renders server-side (`brand.ssr.test.ts`).
9. **The docs site is rebuilt on it.** `site-header.tsx` uses `<Brand asChild>` with the
   Next `<Link>`, `site-footer.tsx` uses the non-interactive form, and **both
   `eslint-disable` comments and all duplicated `<img>` markup are gone**. The replaced
   rules are **deleted** from `apps/docs/app/site.css`, including `.ld-mark-light` /
   `.ld-mark-dark`; the touch-target media query keeps only selectors other lots still own.
10. The docs header and footer look identical before and after, in both themes.
11. `size-limit` has a budget entry for `Brand` and passes.
12. All four CI jobs' commands run, with real output reported and anything unrunnable
    named. A changeset exists, minor for both packages, in consumer-facing voice.

## Boundaries — do not touch

- Everything delivered by Lots 1–4, beyond composing with it. In particular `Navbar` and
  `Footer` keep their slot APIs unchanged — `Brand` goes **into** the `brand` slot; it does
  not become a built-in part of either component.
- `apps/docs/public/*` — the mark assets stay exactly as they are.
- `apps/docs` MDX content and `apps/docs/lib/components.ts`.
- The shared brief's global boundaries. Do not commit, branch or push.
