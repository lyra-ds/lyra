# Retry — Lote 2: dois landmarks de navegação com o mesmo nome

Your work is in the tree and is almost done. **Do not start over.** One defect.

Original brief: `.batuta/lot-6cb2-02-navbar-footer.md`, on top of
`.batuta/brief-6cb2-chrome.md`.

## What I verified independently and accepted

477 React tests (up from 465) and 59 styles tests pass. `docgen --check` at 50 components,
parity with the tripwire, `lint:css`, eslint, typecheck, build, and `size-limit` (Navbar
290 B, NavLink 470 B, Footer 266 B) all pass. At 1440px, 900px and 375px the built docs have
**no horizontal scroll** and the header reflows correctly.

**The `NavLink` focus ring works.** I first measured `box-shadow: none` and nearly reported
it as a defect — that was my error: `box-shadow` is in the component's `transition` list, so
an immediate read after `Tab` catches the interpolation start. Measured after it settles:
`rgba(91, 91, 214, 0.22) 0 0 0 3px`. Correct, and it matches `--shadow-focus`. **Leave it
alone.**

## The defect: `landmark-unique` — two navigation landmarks named "Docs"

axe reports a `landmark-unique` violation (moderate) at every viewport on the built docs:

```
header[]  nav[Docs]  nav[Docs]  main[]  aside[On this page]  nav[On this page]  footer[]  nav[Lyra DS]
           ^^^^^^^^   ^^^^^^^^
           navbar     shell sidebar
```

`apps/docs/components/site-header.tsx` passes `navLabel={t('navDocs')}`, and the Shell's
sidebar in `apps/docs/app/[lang]/layout.tsx` already passes `sidebarLabel={t('navDocs')}`.
Both resolve to "Docs" / "Documentação", so a screen-reader user gets two navigation
landmarks with identical names and no way to tell them apart.

This is new — before this lot the header's `<nav>` had no accessible name at all, so there
was nothing to collide with. The component is right to make the label explicit; the docs
wiring picked a name that was already taken.

Fix it in the docs, not in the component. The two landmarks serve different scopes: the
navbar is the **site-wide** navigation, the sidebar is the **documentation section**
navigation. Give them names that say so, in both locales, using the existing `next-intl`
message files (`apps/docs/messages/en.json` and `pt-BR.json`) — do not hardcode strings.
Follow the project's pt-BR terminology rules in `.batuta/profile.md`.

## Not yours to fix

The `button-name` violation at 375px on `.lw-search` is pre-existing and belongs to Lot 3,
which replaces that button with `CommandPalette.Trigger`. Leave it.

## Acceptance

1. The built docs report **zero** `landmark-unique` violations at 1440px, 900px and 375px.
2. Every navigation landmark on the page has a distinct, meaningful accessible name, in both
   `en` and `pt-BR`.
3. New strings live in the message files, not inline.
4. Everything already green stays green: the full test suite, parity, `docgen --check`,
   `lint:css`, eslint, typecheck, build, `size-limit`.
5. **Do not regenerate `tools/parity/baseline.json`.** I reverted your regeneration: it
   changed nothing but `$comment` and `handoffVersion`, wiping the hand-maintained record
   that the handoff is at `"v1.0 + v1.1 layout"`. The shared brief now covers this.

## Boundaries

Unchanged. Do not touch the `Navbar`/`NavLink`/`Footer` CSS or the focus ring. Do not commit,
branch or push.
