# Lot 6c-c/2 — retry

Your implementation is delivered and almost entirely correct: the sections, the copy in both
locales, the honest framework statuses, the shared-source snippet, the CSS and the anchors
all check out. I verified the gates myself — lint, typecheck, 514 + 59 tests, root build,
axe clean on both locales × both themes × both tabs, the 900px breakpoint, keyboard tabs.

Two defects, both in `apps/site/components/sections/component-showcase.tsx`. Fix only these.

## 1. Line numbers all render as `1`

`CodeBlock` renders its line numbers with a CSS counter, and the counter is reset on a
`<code>` element:

```css
.lyra-code--line-numbers .lyra-code__pre code {
  counter-reset: step;
  counter-increment: step 0;
}
.lyra-code--line-numbers .lyra-code__pre .line::before {
  content: counter(step);
  counter-increment: step;
}
```

You put the `<span className="line">` elements directly inside the `<pre>`, with no `<code>`
between them. Without it the reset never applies and every line prints `1`.

The documented shape is in `apps/docs/components/examples/code-block/line-numbers.tsx`:

```tsx
<CodeBlock language="css" lineNumbers>
  <code>
    <span className="line">…</span>
    <span className="line">…</span>
  </code>
</CodeBlock>
```

Wrap your mapped lines in a single `<code>`.

**This is why it slipped:** every automated gate passed. The build, the types, the a11y scan
and the copy checks cannot see a wrong number. Verify this one by reading the rendered
numbers — they must be 1, 2, 3, … down the block.

## 2. The snippet references a class the reader cannot have

The generated code contains `<div className="lw-show__stage">`. That class is defined in
`apps/site/app/site.css` — it belongs to this website, not to the design system. Someone who
copies the snippet gets a `div` with an undefined class and a layout that does not match what
they saw.

That is the same failure as an invented number: a claim that does not survive contact with
the reader. It just fails later, on their machine.

Drop the wrapper from the **snippet** so it shows only what a consumer can actually use — the
imports and the five components. Keep the `lw-show__stage` wrapper in the **rendered
preview**, where it belongs; it is this page's layout.

The rule the brief was reaching for, stated more precisely: _the snippet must be code the
reader can paste and run, and every component in it must be one they get from the package._
It does not have to reproduce this page's layout scaffolding.

## What not to change

Everything else. The framework statuses, the copy, the `site.css` additions, the section
structure, the shared-source derivation of the snippet and the anchors are all correct — do
not restructure them.

Do not touch `packages/`. Do not commit, branch or push.

## Acceptance

1. Line numbers read 1, 2, 3, … — confirmed by looking at the rendered block, not by
   reasoning about the markup.
2. The snippet contains no `lw-` class, and the preview still does.
3. The snippet still derives from the same source object as the preview, so the two cannot
   drift.
4. `pnpm --filter @lyra-ds/site run build` and `pnpm run lint` still pass; report their real
   output.
