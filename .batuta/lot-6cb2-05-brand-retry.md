# Retry — Lote 5: o componente está certo, um teste é que quebra

**Do not change the component.** I verified it in a real browser and it is correct. One test
throws.

Original brief: `.batuta/lot-6cb2-05-brand.md`, answer file
`.batuta/lot-6cb2-05-brand-answer.md`, shared brief `.batuta/brief-6cb2-chrome.md`.

## What I verified on the built docs, in a real browser

```
light  →  a[href="/en"]  imgs: lyra-mark.svg visible 24px · lyra-mark-light.svg hidden
          span           imgs: lyra-mark.svg visible 24px · lyra-mark-light.svg hidden
dark   →  a[href="/en"]  imgs: lyra-mark.svg hidden      · lyra-mark-light.svg visible 24px
          span           imgs: lyra-mark.svg hidden      · lyra-mark-light.svg visible 24px
```

Header renders as a link, footer as a non-interactive `<span>`, the CSS theme swap works in
both directions, and the mark is 24px — the pre-migration value — without anyone passing
`size`. That was the regression I was watching for after three lots in a row lost a default,
and it did not happen here.

Also green: axe **clean** at 1440/900/375 in both `en` and `pt-BR`; parity with the tripwire;
`docgen --check` at 54 components; `lint:css`, eslint, typecheck, build; `size-limit` (Brand
653 B); `baseline.json` untouched; **orphan sweep empty** — including the `ld-*` prefix,
which the earlier lots' sweep would have missed.

The discriminated union is right too: a mark-only `Brand` requires the accessible name at
compile time, and there is no English literal in the rendered output.

## The defect: one test throws before it asserts anything

```
FAIL src/brand/brand.browser.test.tsx > Brand > uses the CSS default size or sets the mark size custom property
TypeError: Cannot read properties of null (reading 'querySelector')

  73|     const defaultBrand = defaultScreen.container.querySelector<HTMLElement>('.lyra-brand')!;
  74|     const defaultMark = defaultBrand.querySelector<HTMLElement>('.lyra-brand__mark')!;
```

`container.querySelector('.lyra-brand')` returned `null`, so the non-null assertion `!`
hid the problem until the next line dereferenced it.

The component is not at fault — the same query works in the first test of the same file, and
the rendered DOM on the real site carries `.lyra-brand` on all three branches. What differs
is the surrounding test state: **a previous test calls `cleanup()` in the middle of its
body** (around line 49), and this file's `afterEach` calls it again. Rendering after a
mid-test `cleanup()` is what leaves the query with nothing to find.

Two things to fix, not one:

1. **The test state.** Restructure so each test gets a clean render without mid-body
   `cleanup()` fighting the `afterEach` — separate tests, or a single render per assertion
   block. Whatever you choose, no test may depend on what a previous test left behind.
2. **The non-null assertions.** `querySelector(...)!` turns "the element is missing" into a
   `TypeError` three lines later, which is why this looked like a crash instead of a failed
   expectation. Use `await expect.element(...)` — the project already pays for this lesson
   once (twelve vacuous existence assertions), and this is the same footgun from the other
   side.

## Acceptance

1. `pnpm run test` passes in full — both packages, zero failures.
2. No test in the file calls `cleanup()` mid-body, and no test depends on ordering.
3. The size assertions still prove what they claim: the default resolves to 24px from the
   stylesheet with **no** inline style, and `size` sets the custom property. Prove they are
   not vacuous — change the CSS default to another value, watch the test fail, restore,
   watch it pass. Report both outputs.
4. Nothing about the component, the CSS, or the docs migration changes.
5. Everything already green stays green: parity, `docgen --check`, `lint:css`, eslint,
   typecheck, build, `size-limit`, empty orphan sweep, `baseline.json` untouched.

## Boundaries

Unchanged. Do not touch `brand.tsx`, `chrome.css`, `site-header.tsx`, `site-footer.tsx` or
`site.css`. Do not commit, branch or push.
