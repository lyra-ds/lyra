# Lot 4/5 — `CodeBlock` + `SegmentedControl`

Sits on top of the shared brief `.batuta/brief-6cb2-chrome.md`. Read that first, in full.

Lot 1 created `packages/styles/components/chrome/chrome.css`, the `Chrome` docgen category
and the parity registration. Extend what exists.

## Goal

Ship the two standalone chrome widgets: a code panel that frames already-highlighted code,
and a generic segmented single-choice control. Then rebuild the docs site's code panel and
language toggle on top of them.

## Context

### Where this CSS comes from

`apps/docs/app/site.css`, validated in production. Read it first.

- Code panel: `.lw-code`, `__bar`, `__lang`, `__copy`, `__pre`, and the line-number rules
  built on CSS counters (`counter-reset` on the `code` element, `counter-increment` in a
  `::before` on each `.line`).
- Segmented control: `.lw-locale`, `__opt`, `__opt--active` — a bordered inline group with
  `overflow: hidden`, so the children's corners are clipped by the parent's radius.

### The hard rule for `CodeBlock`

**The design system delivers the chrome only. It must never depend on Shiki**, or on any
highlighter. The frame, the language badge, the copy button, line numbers and horizontal
scrolling are ours; the already-highlighted markup arrives as `children`.

Consequences to respect:

- The copy button reads the rendered text from its own `<pre>` (`textContent`), so it works
  with any highlighter, or with no highlighter at all. Offer a `copyText` prop to override
  when the visible text is not what should be copied.
- Line numbers are drawn by a CSS counter over child elements carrying the class `line`.
  That is the de-facto convention emitted by Shiki and rehype-pretty-code. **Document it as
  the component's contract** — "wrap each line in an element with class `line`" — so a
  consumer using another highlighter knows what to produce.
- The dual-theme token colors (`--shiki-light` / `--shiki-dark` applied to the `pre` and its
  spans) are the **highlighter's** concern, not ours. They stay in `apps/docs/app/site.css`,
  retargeted at the new `.lyra-code*` class. Do not move them into the package.

### The focus model for `SegmentedControl`

A segmented control is a single-choice control, and this project already decided its focus
model. Read `.batuta/research-apg-focus-models.md` — the `RadioGroup` row: **roving
tabindex; arrows move focus AND select; Tab enters the group at the checked option.**

`packages/react/src/radio/` is the closest existing implementation in this repo — read it
before writing, and stay consistent with how it handles roving tabindex and keyboard.

The docs site's current language toggle is `role="group"` with `aria-current`. Replacing it
with radiogroup semantics is intentional: choosing a language is choosing one option from a
set, applied immediately.

## The API — implement exactly this

### `CodeBlock`

```tsx
<CodeBlock language="tsx" lineNumbers copyLabel="Copy" copiedLabel="Copied">
  {highlightedMarkup}
</CodeBlock>
```

- `language`: optional string, shown in the bar as a badge. Omitted → no badge, and the bar
  still lays out correctly.
- `lineNumbers`: optional boolean, default off (in the CSS, not in JS).
- `copyLabel` / `copiedLabel`: the button's visible text before and after copying. Required
  and translatable — no English literal inside the component. Omitting the copy affordance
  entirely must also be possible; decide how (a prop, or omitting the labels) and say which.
- `copyText`: optional override for what lands on the clipboard.
- After a successful copy the button shows `copiedLabel` and reverts after a short delay.
  The change must be announced to assistive technology, not only shown.
- Clipboard failures (denied permission, insecure context) must not throw or leave the
  button stuck in a false "copied" state.
- Extends `HTMLAttributes<HTMLDivElement>`, forwards its ref, merges `className`.

### `SegmentedControl`

```tsx
<SegmentedControl
  options={[{ value: 'en', label: 'EN' }, { value: 'pt-BR', label: 'PT' }]}
  value={value}
  onChange={setValue}
  label="Language"
/>
```

- `options`: array of `{ value: string; label: ReactNode; disabled?: boolean }`.
- `value` / `onChange`: controlled. Two or more options.
- `label`: the accessible name of the group. Required, translatable.
- Semantics: `role="radiogroup"` on the container, `role="radio"` + `aria-checked` on each
  option, roving tabindex so the group is a single Tab stop, entering at the checked option.
- Keyboard: Left/Up move to the previous option, Right/Down to the next, both wrapping;
  Home and End jump to first and last. Movement **selects** as it moves, per the APG radio
  model. Disabled options are skipped.
- Extends `HTMLAttributes<HTMLDivElement>`, forwards its ref, merges `className`.
- Options are `<button type="button">` elements, so they are keyboard- and
  screen-reader-reachable without extra work.

## Acceptance criteria

1. The `.lyra-code*` and `.lyra-segmented*` rules live in `chrome.css`; `lint:css` and
   `pnpm parity` pass, baseline regenerated and its diff reported.
2. Both components registered in all five places; `handoff/components/chrome/CodeBlock.d.ts`
   and `SegmentedControl.d.ts` exist and match the shipped types;
   `node tools/docgen/generate.mjs --check` passes with `EXPECTED_COMPONENTS` raised by 2
   (comment updated). Nothing else under `handoff/` changes.
3. `CodeBlock` has **zero** dependency on Shiki or any highlighter: no import, no
   assumption beyond the documented `.line` contract. Show the import list as evidence.
4. Copying puts the rendered text on the clipboard; `copyText` overrides it; a rejected
   clipboard call leaves the button usable and not stuck in "copied". Proven by browser
   tests.
5. The copy state change is announced to assistive technology. State the mechanism you
   chose and why.
6. Line numbers appear only with `lineNumbers`, and the counter is driven by CSS over
   `.line` children — no numbering computed in JavaScript.
7. `SegmentedControl` exposes `role="radiogroup"` / `role="radio"` / `aria-checked`, is a
   **single Tab stop**, enters at the checked option, and Left/Right/Up/Down/Home/End
   behave as specified including wrapping and skipping disabled options. Each of these is a
   separate browser test using `await expect.element(...)`.
8. Neither component ships an English literal in its rendered output. Grep for the strings
   and report.
9. Both render server-side (`*.ssr.test.ts`), and no clipboard or `window` access happens
   during server render.
10. **The docs site is rebuilt on them.** `apps/docs/components/pre.tsx` uses `CodeBlock`
    and `locale-switcher.tsx` uses `SegmentedControl`, both keeping their current visible
    behavior and translated strings. The replaced rules are **deleted** from
    `apps/docs/app/site.css`; the Shiki dual-theme rules stay, retargeted at `.lyra-code*`;
    the touch-target media query keeps only selectors other lots still own.
11. In the docs site, code panels still highlight and copy, and the EN|PT toggle still
    switches language — now with arrow-key navigation. Report what you verified and what
    you could not.
12. `size-limit` has a budget entry per new component and passes.
13. All four CI jobs' commands run, with real output reported and anything unrunnable
    named. A changeset exists, minor for both packages, in consumer-facing voice.

## Boundaries — do not touch

- `Shell`, `.lyra-prose`, `Navbar`, `NavLink`, `Footer`, `TableOfContents`,
  `CommandPalette.Trigger` — earlier lots, beyond composing with them.
- `Brand` — Lot 5. The brand markup in the header and footer stays as it is.
- The `Radio` component itself. Read it as a reference; do not refactor it, and do not try
  to share an abstraction between it and `SegmentedControl` in this lot.
- `apps/docs` MDX content and `apps/docs/lib/components.ts`.
- The shared brief's global boundaries. Do not commit, branch or push.

---

## Addendum — o que mudou desde que este brief foi escrito

Lots 1, 2 and 3 landed. Account for all of this.

### 1. The docs currently have **zero** axe violations — do not regress that

Lot 3 closed the last one. The built docs are clean at 1440px, 900px and 375px in both
`en` and `pt-BR`. That is now the baseline your work is measured against, not an
aspiration: any new violation is a verification failure.

`.lw-locale__opt` is the last of four chrome controls that had no `:focus-visible` rule and
fell back to the browser's default outline instead of the design system's `--shadow-focus`.
`SegmentedControl` replaces it, so **give it the DS focus treatment** — `.lyra-btn:focus-visible`
is the reference — and cover it with a test.

### 2. Deleting a class requires the orphan sweep

This bit Lot 2: `.lw-nav__link` was deleted while `theme-toggle.tsx` still referenced it, and
the button silently fell back to unstyled browser chrome. Every gate was green. Lot 3 ran the
sweep and came out clean.

Run it after deleting `.lw-code*` and `.lw-locale*`, and report the output. It must be empty:

```bash
for c in $(grep -rhoE 'lw-[a-z0-9_-]+' apps/docs/components/*.tsx apps/docs/app/*.tsx "apps/docs/app/[lang]/layout.tsx" | sort -u); do
  grep -qF ".$c" apps/docs/app/site.css || echo "ORPHAN: $c"
done
```

### 3. The touch-target block, as it stands now

Lots 2 and 3 already took their selectors out. What remains:

```
.lyra-sbgroup__item, .lw-brand, .lw-example__toggle, .lw-code__copy { min-height: 44px }
.lyra-sbgroup__item                                                 { display: flex; … }
.lw-locale__opt                                                     { min-height: 44px; … }
```

**`.lw-code__copy` and `.lw-locale__opt` are yours** — carry their 44px floor into the
equivalent rules in `chrome.css`. `.lw-brand` belongs to Lot 5; `.lyra-sbgroup__item` and
`.lw-example__toggle` stay in the docs. Leave those three exactly where they are.

### 4. The Shiki dual-theme rules stay in the docs, retargeted

`apps/docs/app/site.css` currently carries:

```css
.lw-code__pre, .lw-code__pre span              { color: var(--shiki-light) }
[data-theme='dark'] .lw-code__pre, … span      { color: var(--shiki-dark) }
```

Those are the **highlighter's** concern, not the design system's. Keep them in the docs,
retargeted at your new class. Do not move `--shiki-*` into `packages/styles` — the hard rule
that `CodeBlock` ships chrome only depends on it.

### 5. `.lw-example__code` and the example machinery are not yours

`.lw-example*` is the docs' own MDX pipeline (stage, toggle, source panel). Only the code
**panel** becomes a component. Leave the example wrapper classes alone.

### 6. Verification you should expect from the maestro

Beyond the gates: an axe sweep at 1440/900/375 in both locales (which must stay at zero),
the orphan sweep, a **visual capture of the code panel and the language toggle compared
against the current state**, and keyboard exercise of the segmented control — arrows, Home,
End, wrapping, and that the group is a single Tab stop. Three lots in a row shipped a defect
that only a screenshot or a real interaction caught; a green suite is not evidence.
