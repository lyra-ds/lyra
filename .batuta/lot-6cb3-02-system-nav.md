# Lote 2/4 — `ThemeProvider`, `Navbar`, `Footer`, `TableOfContents`

Sits on top of `.batuta/brief-6cb3-docs.md`, which sits on top of
`.batuta/brief-phase06b-fanout.md`. **Read the 6b brief first and in full**, then the 6c-b3
brief, then this file.

## Goal

Four pages × two locales, plus the `system` sidebar group:

| page | group | documents as a section on the same page |
| --- | --- | --- |
| `ThemeProvider` | `system` (new) | — |
| `Navbar` | `navigation` | `NavLink` |
| `Footer` | `navigation` | — |
| `TableOfContents` | `navigation` | `useScrollSpy` |

## What Lot 1 already built and you inherit

`ExampleView` has a **`layout="isolated"`** mode: the example renders in an `<iframe>` with its
own document, the design system's stylesheet cloned in, the host's `data-theme` mirrored and
kept in sync, a translated frame `title`, and `ResizeObserver` auto-height. It also supports a
fixed internal layout width, scaled to fit the column, for components whose behavior is
viewport-driven.

Read `apps/docs/components/example-view.tsx` before writing examples. Use the mode; do not
rebuild it, and do not change its contract — Lot 3 depends on it too.

## Why each of these needs care

### `Navbar` and `Footer` — isolate them

`Navbar` renders `<header>` and `Footer` renders `<footer>`. The docs page already has both,
so a live inline example produces duplicate `banner` and `contentinfo` landmarks. This is the
exact wall Lot 1 hit with `Shell` and `PageHeader`. **Use `layout="isolated"`.**

`Navbar` also takes `navLabel`, and its `<nav>` would otherwise collide with the page's own
navigation landmarks — inside the iframe that collision disappears, but name it anyway,
because the example is consumer code and a reader will paste it.

`NavLink` documents as a section on the Navbar page. Its `asChild` form is the one that
matters — it is what lets a framework's `<Link>` keep client-side routing, prefetch and
open-in-new-tab. Show both forms.

### `TableOfContents` — a naming trap, not an isolation one

It renders a `<nav>`. The docs page you are writing **already has a TOC rail labelled "On this
page" / "Nesta página"**. If your example uses that same label, the page gets two navigation
landmarks with identical names and axe fires `landmark-unique` — exactly the defect the
`Navbar` lot in 6c-b2 shipped and had to fix.

Give the example's `label` a different, sensible value. It does not need isolation; it needs a
distinct name. Verify with axe, do not reason about it.

`useScrollSpy` documents as a section on the same page. It is a hook: no `props.json` entry,
no `<PropTable>`. Document its signature in prose and show it driving `activeId` in an
example. Say what it does at the boundaries — it resolves to the first item at the top of the
document and keeps the last one active at the bottom, because the observation band is empty
in both places. That behavior is the reason the hook exists rather than a bare
`IntersectionObserver`.

### `ThemeProvider` — the dangerous one, read this twice

`ThemeProvider` writes to the **document element** and to **localStorage**:

```
document.documentElement.dataset.theme = resolvedTheme
document.documentElement.dataset.brand = brand      // when brand is set
localStorage[storageKey]                             // persisted preference
```

A live inline example would therefore **hijack the theme of the whole docs site** the moment
it mounts, and overwrite the reader's saved preference. That is not a lint finding; it is the
page breaking the site around it.

Two things are required, and the second is easy to miss:

1. **Isolate it.** Inside the iframe it writes to the iframe's own document element.
2. **Give the example a distinct `storageKey`.** A same-origin iframe **shares `localStorage`
   with the parent page**, so isolation alone does not protect the reader's stored theme. With
   the default key, mounting the example would overwrite it.

There is also a conflict to resolve honestly: the isolated preview **mirrors** the host's
`data-theme` into the frame, and `ThemeProvider` **owns** that attribute inside the frame.
Two writers, one attribute. Decide how they coexist — the mirroring can seed the frame and
then yield, or this example can opt out of mirroring — implement it, and state which you chose
and why. What must be true either way:

- Toggling the theme **inside** the example changes the example, and **nothing outside it**.
- Toggling the theme **on the docs site** does not leave the example stranded in a stale theme.
- After playing with the example, the reader's own site theme and stored preference are
  unchanged. **Test this explicitly and report it** — it is the thing most likely to be
  silently wrong.

## The `system` group

Same four places as `layout` in Lot 1: the union in `ComponentGroup`, an entry in `groupOrder`
(**last**), an entry in `groupLabelKey`, and the label string in **both** message files. A
missing message key renders the raw key in the sidebar.

## Acceptance criteria

Everything from the 6b brief, plus:

1. The `system` group exists in all four places and renders a real label in `en` and `pt-BR`.
2. Four manifest entries, `name` matching `props.json` exactly.
3. Eight MDX files in the gabarito's section order.
4. `NavLink` and `useScrollSpy` are sections on their parent pages, in both locales, and are
   **not** in the manifest.
5. **axe at zero** on all four pages, at 1440px, 900px and 375px, in both locales. Report the
   sweep. `landmark-unique` and `frame-title` are the two to watch.
6. The `ThemeProvider` example passes the three theme-safety statements above, tested.
7. `pnpm typecheck`, `pnpm lint`, `pnpm build` pass, with real output reported.
8. Say explicitly which pages you could not verify visually.

## Boundaries

- `packages/` is read-only. If a component is missing something, report it.
- Do not change `ExampleView`'s existing contract — extend only if your components need
  something it cannot express, and say so plainly if you do.
- Lot 3's components (`CodeBlock`, `Brand`, `SegmentedControl`) and the prose guide are not
  yours.
- Do not commit, branch or push.
