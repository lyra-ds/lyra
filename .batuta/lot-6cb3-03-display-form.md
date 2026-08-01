# Lote 3/4 — `CodeBlock`, `Brand`, `SegmentedControl` + a seção do `CommandPalette.Trigger`

Sits on top of `.batuta/brief-6cb3-docs.md`, which sits on top of
`.batuta/brief-phase06b-fanout.md`. **Read the 6b brief first and in full**, then the 6c-b3
brief, then this file.

## Goal

Three pages × two locales, plus one section added to an existing page:

| page               | group     |
| ------------------ | --------- |
| `CodeBlock`        | `display` |
| `Brand`            | `display` |
| `SegmentedControl` | `form`    |

and `CommandPalette.Trigger` as a section on the **existing**
`content/docs/{en,pt-BR}/components/command-palette.mdx`, following the `AvatarGroup`-inside-
Avatar precedent. It is not a manifest entry and has no page of its own.

Both groups already exist — no sidebar-group work in this lot.

## These are not page-level components

Lots 1 and 2 had to isolate their examples because `Shell`, `PageHeader`, `Navbar` and
`Footer` emit `<main>`, `<h1>`, `<header>` and `<footer>`. **None of yours do.** Use the
ordinary inline stage (`row`, `block` or `plain`, as the gabarito does) and do not reach for
`layout="isolated"` — it exists for a problem you do not have, and it costs the reader a
frame.

## What is specific to each

### `CodeBlock`

The hard rule from its own brief: **the design system ships the chrome only, and never depends
on a highlighter**. The page must say that plainly, because it is what a consumer needs to
know before using it — they bring the highlighted markup.

Three things to document that the prop table cannot show:

- **The `.line` contract.** Line numbers are a CSS counter over child elements carrying the
  class `line`. That is what Shiki and rehype-pretty-code emit. A consumer using another
  highlighter, or none, needs to know to produce it.
- **`copyText`**, and what the copy button copies when it is omitted (the rendered text of the
  `<pre>`).
- **The `<pre>` is keyboard-focusable**, so a reader can scroll an overflowing block without a
  mouse. This was a real accessibility fix; it belongs in the Accessibility section.

Note the page will contain both the docs' own code panels (every fenced block on the site
renders through `CodeBlock`) and your examples. That is fine — but write the examples so a
reader can tell which is which.

### `Brand`

Its API is a discriminated union: `href` and `asChild` are mutually exclusive, and a
mark-only `Brand` **requires** an accessible name — omitting it is a compile error, not a
runtime surprise. Show all three shapes: with a wordmark, mark-only with a name, and
`asChild` wrapping a link.

Two traps:

- **The images are the consumer's assets.** The examples will reference something under
  `apps/docs/public`, which will 404 for anyone who pastes the code into their own app. Say so
  in the page — one sentence, so the reader knows to swap the paths.
- **The theme swap is CSS, not JavaScript.** Both images render and `[data-theme]` hides one.
  That is why it works in Vue, Blade and LiveView, and why the component reads no theme at
  runtime. Worth a sentence; it is the architecture in miniature.

`--brand-mark-size` is a custom property with its default in the CSS. Document it with the
default, verified against the stylesheet.

### `SegmentedControl`

It is a **`radiogroup`**, not a row of buttons, and that is the whole point: one Tab stop,
arrows move and select, Home and End jump to the ends, disabled options are skipped. Document
the keyboard model in the Accessibility section, because a consumer who does not know it will
wire it wrong.

Say what it is for and what it is not: a single choice from a small, visible set — not a
form's radio group with labels and descriptions, and not navigation.

Controlled only: `value` + `onChange`. Examples need `'use client'`.

### `CommandPalette.Trigger` — a section, not a page

On the existing `command-palette.mdx`, in both locales. What matters:

- It is reached as a static property of `CommandPalette`, from the same import — no new
  package subpath.
- `shortcut` is a string the consumer passes. **The component never detects the platform**,
  because a `navigator`-based `⌘`-vs-`Ctrl` choice at render time is a hydration mismatch.
  Say that; it explains an API that would otherwise look lazy.
- Below 720px the label and shortcut are hidden and the button collapses to its icon — and it
  **keeps its accessible name**. That fixed a critical `button-name` violation that was live
  on this site, so it belongs in the Accessibility section.

Add an `<Example>` for it alongside the existing ones and register the example file the same
way. Do not restructure the page around it.

## Verification is done on the build, not on `next dev`

A finding from Lot 2, so you do not chase a ghost: the Next dev overlay mounts inside preview
documents and can make an interactive example look frozen. That is a dev artifact — the built
export behaves correctly. When you check interaction, check `pnpm build` output, and if you
serve it statically remember that extensionless routes need a server that maps them to
`.html`.

## Acceptance criteria

Everything from the 6b brief, plus:

1. Three manifest entries, `name` matching `props.json` exactly; `docgen --check` passes with
   the new count.
2. Six MDX files in the gabarito's section order, plus the Trigger section on both existing
   command-palette pages.
3. The `.line` contract, `copyText`, the focusable `<pre>`, `--brand-mark-size`, the asset
   caveat, the CSS theme swap, and the full `SegmentedControl` keyboard model are all
   documented.
4. `SegmentedControl` examples work: arrows move and select, one Tab stop. Verify in a browser.
5. **axe at zero** on the three new pages and on the two command-palette pages, at 1440px,
   900px and 375px, in both locales.
6. `pnpm typecheck`, `pnpm lint`, `pnpm build` pass, with real output reported.
7. Say explicitly which pages you could not verify visually.

## Boundaries

- `packages/` is read-only.
- Do not use `layout="isolated"` and do not change `ExampleView`.
- Do not restructure the command-palette pages beyond adding the section.
- The prose guide is Lot 4. Do not commit, branch or push.
