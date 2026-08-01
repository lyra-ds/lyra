# Shared brief — 6c-b3: documentar as adições das fases 6c-b1 e 6c-b2

**Read `.batuta/brief-phase06b-fanout.md` first, in full.** It is the base contract for this
work: the page anatomy, the example-file rules, the voice, the non-negotiables and the verify
step all come from there, unchanged. It produced 40 pages that shipped; do not re-derive it.

This file only carries what is **new** since that brief was written. Your lot file
(`.batuta/lot-6cb3-NN-*.md`) carries the components you own.

## What changed since the 6b brief

Two batches of components shipped without documentation pages, which is the gap this phase
closes:

- **6c-b1** (layout + theming): `Container`, `Stack`, `Inline`, `Grid`, `PageHeader`,
  `ThemeProvider`.
- **6c-b2** (chrome): `Shell`, `Navbar`, `NavLink`, `Footer`, `TableOfContents`,
  `useScrollSpy`, `CodeBlock`, `SegmentedControl`, `Brand`, `CommandPalette.Trigger`, and the
  CSS-only `.lyra-prose`.

`tools/docgen/output/props.json` has all of them. Read your component's entry there before
writing a single prop — the 6b rule "never invent an API" is unchanged and this batch has
many new props.

## Two new sidebar groups — decided, implement as written

The reader-facing taxonomy in `apps/docs/lib/components.ts` gains exactly two groups:

| group    | components                                          |
| -------- | --------------------------------------------------- |
| `layout` | `Container`, `Stack`, `Grid`, `PageHeader`, `Shell` |
| `system` | `ThemeProvider`                                     |

Everything else joins an existing group: `Navbar`, `Footer` and `TableOfContents` in
`navigation`; `Brand` and `CodeBlock` in `display`; `SegmentedControl` in `form`.

Adding a group means four things, not one:

1. the union in `ComponentGroup`;
2. an entry in `groupOrder` (place `layout` first — it is what a reader needs before any
   widget; `system` last);
3. an entry in `groupLabelKey`;
4. **the label string in both `apps/docs/messages/en.json` and `pt-BR.json`** — the existing
   keys are `groupAction`, `groupDisplay`, and so on. A missing key renders the raw key in
   the sidebar.

## Sub-components document as sections, not pages

The 6b precedent is `AvatarGroup` inside the Avatar page and `ToastStack` inside the Toast
page: something that only makes sense alongside its parent gets a section there, not a
sidebar entry of its own. Apply it to:

| goes as a section on               | not its own page         |
| ---------------------------------- | ------------------------ |
| `Stack`                            | `Inline`                 |
| `Navbar`                           | `NavLink`                |
| `TableOfContents`                  | `useScrollSpy`           |
| the existing `command-palette.mdx` | `CommandPalette.Trigger` |

A section is an `##` heading after `## Examples` with its own `<Example>` block, in both
locales. Do **not** add these to the manifest — they have no page and no route.

`useScrollSpy` is a hook, not a component: it has no entry in `props.json` and no
`<PropTable>`. Document its signature in prose and show it in the example.

## Custom properties are API and must be documented

Several of these components expose CSS custom properties, and the generated prop table does
**not** show them — it reads TypeScript, and the properties live in CSS. If you leave them
out, they are undiscoverable:

- `Shell` — `--shell-sidebar`, `--shell-aside`, `--shell-top`
- `Container` — `--container-max`
- `Stack` / `Grid` — the gap/direction/column properties (read
  `packages/styles/components/layout/layout.css` and `chrome/chrome.css` for the real names)
- `Brand` — `--brand-mark-size`

Give each one a short table or list in the page, saying what it sets and what its default is.
Verify every name and default against the CSS — the 6b rule "never invent a CSS class"
extends to custom properties.

## The docs site is at zero axe violations — keep it there

Phases 6c-b2 lots 3 and 4 got the built docs to **zero** axe violations at 1440px, 900px and
375px in both locales, and it is now the bar. Your example modules render on those pages. An
example that ships an unlabelled control, a duplicate landmark or an image without `alt` puts
a violation back on the page. In particular:

- `Shell` examples create landmarks. Give the rails accessible names (`sidebarLabel`,
  `asideLabel`) or the page gets duplicate unnamed landmarks.
- `Navbar` examples create a second `<nav>`. Same problem, same fix (`navLabel`).
- `Brand` without a wordmark **requires** an accessible name — the types enforce it, so a
  missing one is a compile error, not a runtime surprise.

## What the maestro will check, beyond the gates

Stated so you know how this is graded: the built docs get an axe sweep at three viewports in
both locales, every new page is opened in a browser, and each example is exercised. Five
defects in the previous phase passed green gates and were only caught by opening the page.

`pnpm build` prerendering a broken example without failing is a known property of this repo —
say plainly in your report which pages you could not verify visually.

## pt-BR terminology

`.batuta/profile.md` carries the project's rule. The short version: keep in English what a
Brazilian developer types and says out loud (build, deploy, viewport, overflow, token, hook);
translate where a dominant Portuguese term exists (folha de estilos, marca, escopo,
superfície, contraste, anel de foco); **never invent a translation to avoid a dominant
loanword**; and when both options read badly, replace the metaphor with a description. The
brand seed token is **"cor-base"**, never "semente". One form per concept across the site.

## Boundaries

`packages/` is read-only for this phase — no component changes, no CSS. If a component is
missing something, write it in your report instead of fixing it. Everything else follows the
6b brief. Do not commit, branch or push.
