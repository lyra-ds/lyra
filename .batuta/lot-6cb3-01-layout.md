# Lote 1/4 — páginas de layout

Sits on top of `.batuta/brief-6cb3-docs.md`, which itself sits on top of
`.batuta/brief-phase06b-fanout.md`. **Read the 6b brief first and in full**, then the 6c-b3
brief, then this file.

## Goal

Document the five layout components, and create the `layout` sidebar group that the rest of
this phase depends on: `Container`, `Stack` (with `Inline` as a section), `Grid`,
`PageHeader`, `Shell`.

Five pages × two locales, plus the group mechanics.

## Why this lot goes first

It creates the `layout` group — the union member, the `groupOrder` entry, the
`groupLabelKey` entry and the label string in both message files. Lots 2 and 3 add `system`
and reuse the pattern. Get it right here and they inherit it.

## What is specific to these five

### `Container`

The simplest of the five and a good place to establish the voice for this group. Its one
decision is the max width, exposed as `--container-max`, which **cascades to nested
containers** — that is the interesting property and the reason it is a custom property
instead of a prop-only value. Say so.

### `Stack` and `Inline`

`Inline` is `Stack`'s horizontal sibling and documents as a section on the Stack page, not as
its own entry. The decision the reader makes is direction and gap; the reason both are
components rather than a utility class is that the appearance lives in CSS and is therefore
reusable outside React — that is the whole architecture in one example.

**Careful with the defaults.** These components deliberately carry **no** default in
JavaScript: an omitted prop emits no custom property and the stylesheet's value applies. That
was a real defect fixed during the layout lot (two sources of truth that drift). Document the
default as the CSS's, not the component's, and do not write "defaults to X" as if the prop
did it.

### `Grid`

Columns and gap through custom properties. The useful guidance is when a Grid beats a Stack:
two axes, or items that should share a track size.

### `PageHeader`

Eyebrow, title, description and an actions slot. The decision is what belongs in `actions`
versus in the page body.

### `Shell` — the one that needs the most care

It carries the most knowledge and the most ways to get it wrong:

- **Two scroll models, one component.** `scroll="page"` (default) means the document scrolls
  and the rails are sticky; `scroll="content"` means the main region is the scroll container.
  They are not a theme — they are two layout engines. The page should show both, and say why
  a `variant` prop would have been the wrong API.
- **The responsive contract is fixed and deliberate:** the aside disappears at 1100px, then
  the sidebar stacks at 900px, in that order. Document both breakpoints as the component's
  contract. They cannot be configured, because media queries cannot read custom properties —
  say that, it is the reason.
- **Three custom properties:** `--shell-sidebar` (220px), `--shell-aside` (200px),
  `--shell-top` (0). The last one is the sticky offset, and a consumer with a sticky header
  must set it or the rails hide under the header.
- **Rails need accessible names.** `sidebarAs`/`asideAs` pick the element and
  `sidebarLabel`/`asideLabel` name it. A docs sidebar is navigation, not complementary
  content — the docs site itself passes `sidebarAs="nav"`. Without names, a page with both
  rails has two unnamed landmarks, which is an axe violation. **Your examples must not
  introduce one.**

The docs site's own layout (`apps/docs/app/[lang]/layout.tsx`) is a real, working `Shell`
usage — read it. It is the best "how a docs site is built" reference you have, and the
component's brief called out documenting **two ready-made recipes** ("this is how you build a
docs site", "this is how you build an app") rather than only a prop list. Do that.

## Acceptance criteria

Everything from the 6b brief, plus:

1. The `layout` group exists in all four places (union, `groupOrder` first, `groupLabelKey`,
   and the label in **both** message files). The sidebar renders it with a real label in `en`
   and `pt-BR` — check, do not assume.
2. Five manifest entries, `name` matching `props.json` exactly.
3. Ten MDX files (five slugs × two locales), following the gabarito section order.
4. `Inline` is a section on the Stack page in both locales, with its own `<Example>`, and is
   **not** in the manifest.
5. Every custom property named in the 6c-b3 brief for these components is documented with its
   default, and every name and default is verified against the CSS. Report how you verified.
6. The `Shell` page documents both scroll models, both breakpoints and the reason they are
   not configurable, and shows the two recipes.
7. No example introduces an axe violation. `Shell` examples name their rails.
8. `pnpm typecheck`, `pnpm lint` and `pnpm build` pass, with real output reported.
9. Say explicitly which pages you could not verify visually.

## Boundaries

- `packages/` is read-only.
- Do not touch the other lots' components: `ThemeProvider`, `Navbar`, `Footer`,
  `TableOfContents`, `CodeBlock`, `SegmentedControl`, `Brand`, or the prose guide.
- Do not touch existing pages except where this lot requires it (none do).
- Do not commit, branch or push.
