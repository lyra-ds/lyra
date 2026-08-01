# Retry — Lote 4: o `<pre>` rolável não é alcançável por teclado

Your work is in the tree and nearly everything is right. **Do not start over.** One defect.

Original brief: `.batuta/lot-6cb2-04-codeblock-segmented.md`, shared brief
`.batuta/brief-6cb2-chrome.md`.

## What I verified independently and accepted

503 React tests and 59 styles tests pass; parity with the tripwire; `docgen --check` at 53
components; `lint:css`, eslint, typecheck, build; `size-limit` (CodeBlock 468 B,
SegmentedControl 527 B); `baseline.json` untouched; **orphan sweep empty**.

**The `SegmentedControl` keyboard model works end to end**, exercised in a real browser:

```
group:  role=radiogroup  aria-label="Language"
        EN aria-checked=true  tabindex=0
        PT aria-checked=false tabindex=-1
tab:    exactly one stop inside the group
→ :     EN → PT selected, and the page navigated to /pt-BR
```

Single Tab stop, roving tabindex, arrow selects as it moves. That is the APG radio model,
correctly implemented.

## The defect: a new axe violation, and the docs were at zero

```
scrollable-region-focusable (serious) — <pre class="lyra-code__pre">
computed: overflow-x: auto, tabindex: null
```

Present at 1440px and 375px, in both `en` and `pt-BR`. Lot 3 got the docs to **zero axe
violations**; this reintroduces one.

The `<pre>` scrolls horizontally when a line is too long, but nothing can focus it, so a
keyboard user cannot scroll it at all. A mouse user drags; a keyboard user is stuck.

**Why it appeared now, and why it is genuinely yours to fix:** the MDX pipeline puts
`tabindex="0"` on the `<pre>` it emits — that is what Shiki and rehype-pretty-code do,
precisely for this rule — and the old `pre.tsx` spread those incoming props onto the
element. `CodeBlock` renders its own `<pre>` and drops them.

That is not a reason to go back to forwarding props: it is a reason for the design system to
own the guarantee. Right now every consumer's accessibility depends on their highlighter
remembering to add an attribute. `CodeBlock` owns that element and can make it true for
everyone, with or without a highlighter.

## What to fix

The scrollable `<pre>` must be reachable and scrollable by keyboard, and the stop must be
visible when it is reached — a focusable element with no focus indicator is its own defect.
Use the design system's focus treatment (`--shadow-focus`), consistent with the rest of the
chrome.

One caution: a focusable region that a screen reader announces as an unnamed mystery stop is
barely better than an unreachable one. If you give it a role that makes it a landmark, every
code block on a page becomes one — that is landmark noise on a documentation page with a
dozen examples. Weigh naming against noise, pick one, and **state what you chose and why**.

## Acceptance

1. axe on the built docs is back to **zero violations** at 1440px, 900px and 375px, in both
   `en` and `pt-BR`. Report the sweep.
2. The `<pre>` can be focused by keyboard and scrolled with the arrow keys when its content
   overflows, and shows a visible focus indicator when focused. Proven by a browser test.
3. The guarantee comes from `CodeBlock` itself, not from props forwarded by the consumer —
   a `CodeBlock` used with no highlighter at all still gets it. Proven by a test that renders
   plain text children.
4. Prove the test is not vacuous: remove the fix, watch it fail, restore, watch it pass.
   Report both outputs.
5. Everything already green stays green: full suite, parity, `docgen --check`, `lint:css`,
   eslint, typecheck, build, `size-limit`, empty orphan sweep, `baseline.json` untouched, and
   the `SegmentedControl` keyboard behavior unchanged.

## Boundaries

Unchanged. `SegmentedControl` is correct — do not touch it. Do not touch earlier lots'
components. Do not commit, branch or push.
