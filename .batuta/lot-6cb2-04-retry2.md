# Retry 2 — Lote 4: a correção está certa, o teste é que está errado

**The component fix is correct. Do not change it.** One test assertion is wrong.

Original brief: `.batuta/lot-6cb2-04-codeblock-segmented.md`, first retry
`.batuta/lot-6cb2-04-codeblock-segmented-retry.md`, shared brief
`.batuta/brief-6cb2-chrome.md`.

## What I verified on the built docs, in a real browser

```
<pre class="lyra-code__pre">  tabindex="0"   overflow: true
focus ring:                   rgba(91, 91, 214, 0.22) 0 0 0 3px
ArrowRight while focused:     scrollLeft 0 → 40
axe 1440 / 900 / 375, en + pt-BR:  clean, clean, clean, clean, clean, clean
```

The docs are **back to zero axe violations**. Your choice of native focusable `<pre>`
semantics — no synthetic role, no untranslated label — is the right call, and the reasoning
you gave for it is sound. Leave the component alone.

## The defect: one assertion depends on the runner reproducing native scrolling

`pnpm run test` is red:

```
FAIL src/code-block/code-block.browser.test.tsx > CodeBlock >
     makes a plain-text overflowed code region keyboard-scrollable with a visible focus ring
AssertionError: expected 0 to be greater than 0
  81|     expect(pre.scrollLeft).toBeGreaterThan(0);
```

Everything before that line passes — `tabIndex` is 0, the element overflows, `userEvent.tab()`
focuses it, the focus ring is present. Only the last assertion fails.

It fails because **arrow-key scrolling of a focused overflow container is a browser default
action**, and the synthetic key event the runner dispatches does not trigger it. In a real
browser the same interaction scrolls, which I measured above: `0 → 40`.

So the assertion is testing the browser, not the component. The component's guarantee is
that the region is **focusable and visibly focused**; native scrolling follows from the
browser once that is true, and is exactly what the axe rule
`scrollable-region-focusable` exists to check.

## What to fix

Rewrite that last assertion so the test proves what `CodeBlock` guarantees and nothing more:
the overflowing region is reachable by keyboard, receives focus, and shows the design
system's focus ring. Keep the plain-text fixture — proving the guarantee holds with no
highlighter is the point of that test.

If you can make a genuine arrow-scroll assertion work reliably in this runner, that is
welcome — but a test that passes only by accident of the runner's event model is worse than
one that asserts the real contract. Choose, and say which you chose.

## Acceptance

1. `pnpm run test` passes in full — both packages, zero failures.
2. The test still fails if `tabIndex` is removed from the `<pre>`. Prove it: remove, run,
   report the failure, restore, run, report the pass.
3. The test still fails if the focus-ring rule is removed. Same proof, both outputs.
4. Nothing about the component changes — `tabindex`, the focus ring rule, and the absence of
   a synthetic role stay exactly as they are.
5. Everything already green stays green: parity, `docgen --check`, `lint:css`, eslint,
   typecheck, build, `size-limit`, empty orphan sweep, `baseline.json` untouched.

## Boundaries

Unchanged. Do not touch `SegmentedControl`, earlier lots' components, or the docs migration.
Do not commit, branch or push.
