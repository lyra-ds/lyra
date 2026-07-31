# Lot 1/5 retry — `Shell` + `.lyra-prose`

Your previous round is still in the working tree. **Do not start over** — most of it is
right. Fix the six items below and nothing else.

The original brief is `.batuta/lot-6cb2-01-shell-prose.md`, on top of the shared brief
`.batuta/brief-6cb2-chrome.md`. Both still apply in full.

## What was verified independently and passed

`pnpm parity` (including the tripwire proof — `.lyra-zzz` fails, removal restores green),
`lint:css`, `pnpm typecheck`, the React build, and the `Container` gutter substitution. The
shape of the CSS is good and the expensive knowledge survived: the `vh`+`dvh` pair, the
`overscroll-behavior`, and the 1100/900 collapse order are all intact.

Your report was accurate about what you could not run. That is the right behavior — the
items below are what running it revealed.

## 1. The test suite is red

```
FAIL  src/shell/shell.browser.test.tsx > Shell > uses sticky, independently scrollable rails in page-scroll mode
AssertionError: expected 'static' to be 'sticky'
  53|     expect(getComputedStyle(shell).display).toBe('grid');
  54|     for (const rail of [sidebar, aside]) {
  55|       expect(getComputedStyle(rail).position).toBe('sticky');
```

Diagnosis, so you do not have to guess: the browser runner has no viewport pinned
(`packages/react/vitest.config.ts` sets only `headless` and the chromium instance), so the
fixture renders **below the 900px breakpoint** — exactly where your CSS deliberately makes
the rails `position: static`. The CSS is right; the test asserts a wide-viewport behavior at
a narrow viewport.

Fix the test so it asserts each behavior at a width where that behavior is defined. And
since the breakpoints are this component's responsive contract, **cover them on purpose**:
the aside disappearing at 1100px and the sidebar going static at 900px deserve their own
assertions rather than being something a test trips over by accident.

## 2. Pixel fidelity drift in `.lyra-prose` inline code

Preserving the handoff's rendering pixel by pixel is a locked project constraint. Two
declarations changed value in the move:

| | before (`.lw-docs__content :not(pre) > code`) | now (`.lyra-prose :not(pre) > code`) |
| --- | --- | --- |
| `font-size` | `0.9em` | `var(--text-sm)` → `13px` |
| `padding` | `1px 5px` | `var(--space-0) var(--space-1)` → `0 4px` |

`0.9em` of the `16px` prose paragraph is `14.4px`, so inline code shrank by 1.4px — and
worse, `0.9em` **scaled with its context** (code inside an `h2` grew with the heading) while
a fixed `13px` no longer does. The padding lost 1px vertically and 1px horizontally.

Restore both original values. Tokenizing is not an improvement when it changes the rendering
— when no token matches the handoff's value, the literal is correct and deserves a comment
saying why.

## 3. The docs page now has two unnamed `<aside>` landmarks

`Shell` hardcodes `<aside>` for both rails and offers no way to name either. In the docs
that is a regression: before, the page had one unnamed `<aside>` (the nav rail) plus a
`<nav aria-label="On this page">`; now it has **two complementary landmarks with no
accessible name**, which is what `landmark-unique` in axe exists to catch.

There is also a semantics question you were asked to answer and did not: a documentation
sidebar is *navigation*, not complementary content. `<aside>` is defensible for the
"on this page" rail; it is a weaker fit for the primary nav rail.

Requirements:

- Each rail can be given an accessible name by the consumer.
- Each rail can carry the semantics its content actually has.
- The docs site passes axe with no landmark violations, and its nav rail is a navigation
  landmark with a name.

How to express that in the API is yours to decide — state what you chose and why.

## 4. The 1100px collapse only fires when both rails are present

```css
@media (max-width: 1100px) {
  .lyra-shell--page.lyra-shell--has-sidebar.lyra-shell--has-aside { … 2 columns … }
  .lyra-shell--page .lyra-shell__aside { display: none; }
}
```

An aside-only `Shell` (no sidebar) hides its aside at 1100px but keeps
`grid-template-columns: minmax(0, 1fr) var(--shell-aside)` — leaving a dead 200px track next
to the content. The docs site does not hit this because it always has both rails; a consumer
with only an aside does. Make the column collapse follow the hiding in every combination,
and cover it with a test.

## 5. `tools/docgen/output/` — the gate is red and the boundary misled you

```
docgen FAILED: Generated output drift: tools/docgen/output/llms.txt differs from a
fresh generation. Run `pnpm run docgen` and commit the result.
```

You were right not to hand-edit those files, and right to flag it. The boundary in the
shared brief was written badly — it meant "never edit generated files by hand", not "never
regenerate them". These two files are committed artifacts, and the gate's own message says
what to do.

**Run `pnpm run docgen` and leave the regenerated output in the tree.** Confirm
`node tools/docgen/generate.mjs --check` then passes, and report what the regeneration
changed (it should be `Shell` appearing under a new `Chrome` category, and nothing else — if
anything else moved, say so).

## 6. `topbar` in `scroll="page"` renders an unstyled element

`.lyra-shell__topbar` is only styled under `.lyra-shell--content`, so a page-scroll `Shell`
with a `topbar` emits a bare `<div>` with no rules behind it. Either give it page-mode
styling or make the prop's contract explicit — the JSDoc and the type should not offer a
slot that silently does nothing. Decide, implement, and say which you chose.

## Acceptance for this retry

1. `pnpm run test` passes in full — all 461 tests, zero failures.
2. The 1100px and 900px collapse behaviors each have their own assertion at the right
   viewport.
3. Inline code in `.lyra-prose` renders at `0.9em` with `1px 5px` padding, as before.
4. No axe landmark violation on the docs page; the nav rail is a named navigation landmark.
5. An aside-only `Shell` collapses cleanly at 1100px, covered by a test.
6. `node tools/docgen/generate.mjs --check` passes with the regenerated output committed to
   the tree; the diff is reported.
7. `pnpm parity` still passes, and the tripwire still bites (re-run the `.lyra-zzz` proof if
   you touched `chrome.css` — report both outputs again).
8. `topbar`'s behavior in page mode is either styled or explicitly documented as
   content-mode only, and the types match the decision.
9. `lint:css`, both eslint runs, `typecheck`, `build` and `size-limit` still pass, with real
   output reported.

## Boundaries

Unchanged from the original brief, with one correction: `tools/docgen/output/*` may be
**regenerated by its generator** — never hand-edited.

Do not expand the scope. `Navbar`, `Footer`, `TableOfContents`, `CodeBlock`,
`SegmentedControl`, `CommandPalette.Trigger` and `Brand` remain later lots. Do not commit,
branch or push.
