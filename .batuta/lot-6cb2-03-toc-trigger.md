# Lot 3/5 — `TableOfContents` + `useScrollSpy` + `CommandPalette.Trigger`

Sits on top of the shared brief `.batuta/brief-6cb2-chrome.md`. Read that first, in full.

Lot 1 created `packages/styles/components/chrome/chrome.css`, the `Chrome` docgen category
and the parity registration. Extend what exists.

## Goal

Ship the two remaining pieces of documentation chrome: an "on this page" rail with an
optional scroll-spy hook, and the canonical search trigger that opens the command palette.

## Context

### Where this CSS comes from

`apps/docs/app/site.css`, validated in production. Read it first.

- The rail: `.lw-toc`, `__title`, `__list`, `__link`, `__link--active`, and the
  `li[data-level='3']` indentation. Note the list's left border and the active link's
  `border-left-color` — the active marker is a segment of that rail, drawn by shifting the
  link one pixel left over the list's border. Keep that construction; a background pill
  would be a different design.
- The trigger: `.lw-search`, `__label`, `__kbd`, and its `@media (max-width: 720px)` block
  where the label and shortcut disappear and the control collapses to the icon.

The rail's sticky + `max-height` (`vh` **and** `dvh`) + `overscroll-behavior` block now
belongs to `Shell`'s aside slot, delivered in Lot 1. The `TableOfContents` styles the rail's
**contents**, not its scroll behavior. Check what Lot 1 left in place before duplicating
anything.

### Two duplications this lot removes

1. **`.lw-search__kbd` is a reimplementation of `.lyra-kbd`, which already exists** in the
   design system. The docs site duplicated it without noticing. The trigger uses
   `.lyra-kbd`; the duplicate class disappears.
2. The scroll-spy `IntersectionObserver` currently lives in `apps/docs/components/toc.tsx`
   and is exactly what every documentation site rewrites.

### The data-driven API is safe here — and why that is not obvious

A data-driven `items` API is dangerous for navigation components: it forces every item into
a `<button>`, which loses client-side routing, prefetch, open-in-new-tab and copy-link. That
is a known trap in this project.

It does **not** apply here. Table-of-contents links are in-page anchors (`href="#id"`), so a
plain `<a>` is complete and correct — there is no router to preserve. Use `items`.

## The API — implement exactly this

### `TableOfContents`

```tsx
<TableOfContents
  items={[{ id: 'install', text: 'Install', level: 2 }]}
  activeId={activeId}
  label="On this page"
/>
```

- `items`: array of `{ id: string; text: string; level: number }`. `level` drives
  indentation through a `data-level` attribute, as today.
- `activeId`: optional, **controlled**. The component never tracks scroll itself.
- `label`: the visible heading text **and** the accessible name of the `<nav>` landmark.
  Required, and translatable — no English literal inside the component.
- Renders a `<nav>` containing the heading and a list of anchors. The active anchor gets
  the active class and `aria-current="location"` (this is a position within a page, not a
  page — `"true"` is also acceptable; state which you chose and why).
- Extends `HTMLAttributes<HTMLElement>`, forwards its ref, merges `className`.

### `useScrollSpy`

```tsx
const activeId = useScrollSpy(ids)
```

- Takes an array of element ids, returns the id currently considered active, or `undefined`
  before anything resolves.
- Uses `IntersectionObserver`, following the behavior already proven in
  `apps/docs/components/toc.tsx`: observe the heading elements, pick the topmost intersecting
  one, with a `rootMargin` that biases toward the top of the viewport.
- **SSR-safe and cleanup-safe:** no observer during server render, disconnect on unmount,
  re-observe when the id list changes. Missing ids are skipped, not thrown on.
- Exported from the same entry as `TableOfContents`. It is a hook, not a component, so it
  has no `.d.ts` under `handoff/` and no docgen entry — verify the docgen gate does not
  trip on it, and say what you found.

### `CommandPalette.Trigger`

```tsx
<CommandPalette.Trigger label="Search" shortcut="⌘K" onClick={open} />
```

- A `<button>` that looks like a search field: icon, label, shortcut chip.
- `label`: visible text and accessible name. Required, translatable.
- `shortcut`: optional string rendered in a `.lyra-kbd` chip. **Never detect the platform.**
  A `navigator`-based `⌘` vs `Ctrl` choice at render time is a guaranteed hydration
  mismatch; the consumer knows its audience and passes the string.
- Below 720px the label and shortcut are hidden by CSS and the button collapses to the icon
  — so the button must keep an accessible name even when its visible text is hidden.
- Attached as a **static property on the existing `CommandPalette`**, exported from the
  component's existing entry. No new tsup entry, no new exports subpath, no new
  `size-limit` target — the existing `command-palette` budget covers it, and it will grow.
  Update that budget in the same commit if it does.
- The search icon is chrome decoration: **inline SVG**, not an `Icon` import. Importing
  `Icon` pulls the whole registry and once cost 5.4 kB for a single glyph.

## Acceptance criteria

1. The rail and trigger classes live in `chrome.css`; `lint:css` and `pnpm parity` pass,
   baseline regenerated and its diff reported.
2. `TableOfContents` is registered in all five places; `handoff/components/chrome/
   TableOfContents.d.ts` exists; `node tools/docgen/generate.mjs --check` passes with
   `EXPECTED_COMPONENTS` raised by 1 (comment updated). Nothing else under `handoff/`
   changes.
3. `CommandPalette.Trigger` is reachable as a static property of `CommandPalette` from the
   existing export path, adds **no** new tsup entry and **no** new exports subpath. Prove
   it by importing it from the built `dist` in a test or a script, and report the output.
4. `useScrollSpy` is exported, returns the topmost visible heading, disconnects its observer
   on unmount, and survives an empty or partially-missing id list. Proven by browser tests.
5. `TableOfContents` renders indentation from `level`, marks the active item with both the
   class and the ARIA attribute, and names its `<nav>` landmark from `label`. Proven by
   browser tests using `await expect.element(...)`.
6. The trigger keeps an accessible name below 720px, where its visible text is hidden.
   Proven at that viewport.
7. `.lyra-kbd` is used for the shortcut chip and the duplicated `.lw-search__kbd` rule is
   **deleted** from `apps/docs/app/site.css`.
8. Both components render server-side, and `useScrollSpy` does not touch `window` during
   server render (`*.ssr.test.ts`).
9. **The docs site is rebuilt on them.** `apps/docs/components/toc.tsx` becomes a thin
   consumer of `TableOfContents` + `useScrollSpy`, and `command-menu.tsx` uses
   `CommandPalette.Trigger` instead of its hand-rolled button. The replaced rules are
   **deleted** from `apps/docs/app/site.css`; the touch-target media query keeps only the
   selectors other lots still own.
10. The docs rail still highlights the current section while scrolling, and ⌘K still opens
    the palette. Report what you verified and what you could not.
11. `size-limit` passes; if the `command-palette` budget grew, it is updated in the same
    commit with the delta stated.
12. All four CI jobs' commands run, with real output reported and anything unrunnable
    named. A changeset exists, minor for both packages, in consumer-facing voice.

## Boundaries — do not touch

- `Shell`'s aside slot behavior from Lot 1, and the `Navbar`/`Footer` from Lot 2, beyond
  composing with them.
- `CodeBlock`, `SegmentedControl`, `Brand` — later lots. `apps/docs/components/pre.tsx` and
  `locale-switcher.tsx` stay as they are.
- The `CommandPalette` component's own behavior, API and tests. You are adding a trigger
  beside it, not changing it. If the trigger cannot attach without changing the palette,
  stop and report.
- `apps/docs` MDX content and `apps/docs/lib/components.ts`.
- The shared brief's global boundaries. Do not commit, branch or push.
