# Lot 6c-c/1 — `apps/site`: the app, its chrome, and the Hero

Sits on top of `.batuta/brief-6cc-landing.md` — the honesty rules, the `.lw-*` cut criterion,
the conventions, the gates, the evidence contract and the boundaries in it apply unchanged.
Read it first, in full.

## Goal

Create `apps/site/`, a second Next.js app that will serve the marketing landing at
lyra-ds.dev, and deliver its first real screen: header, Hero, footer, working theme toggle
and working locale switch, in EN and pt-BR, building to a static export.

At the end of this lot the site is **deployable and honest** — a visitor sees a real page
that claims nothing false. The remaining sections arrive in later lots.

## The template to mirror: `apps/docs`

The docs app already solves every infrastructure problem this app has. Read it and mirror
it. Do **not** invent a different approach for anything it already answers.

| Concern             | File in `apps/docs`                   | What to do                                                                       |
| ------------------- | ------------------------------------- | -------------------------------------------------------------------------------- |
| Deps and scripts    | `package.json`                        | Mirror, **minus** `fumadocs-core` and `fumadocs-mdx` (no content pipeline here)  |
| Static export       | `next.config.ts`                      | Mirror, including `output: 'export'` in production only and `images.unoptimized` |
| Locale list         | `lib/i18n.ts`                         | Mirror `locales` / `defaultLocale` / `isLocale`, **without** the fumadocs config |
| next-intl wiring    | `i18n/request.ts` + `messages/*.json` | Mirror the pattern; your own message files                                       |
| Static params       | `app/[lang]/layout.tsx`               | Same `generateStaticParams` + `dynamicParams = false`                            |
| Root redirect       | `app/page.tsx`                        | Same client-side locale redirect (no server middleware under static export)      |
| Fonts + stylesheets | `app/layout.tsx`                      | Same imports, same order                                                         |
| `<html lang>`       | `components/html-lang.tsx`            | Same approach                                                                    |

`pnpm-workspace.yaml` already globs `apps/*` and the root `build` script is
`pnpm -r --if-present run build`, so a correctly-shaped app is picked up with no root
changes. Verify that it actually is — an app that silently builds nothing passes the gate
while delivering nothing.

## What differs from `apps/docs`, deliberately

1. **Theme storage key is `lyra-site-theme`**, not `lyra-docs-theme`. Different key, so the
   two sites do not fight over one preference. (`apps/docs` sets its key in
   `app/[lang]/layout.tsx`.)
2. **No `Shell`, no `Container` wrapper around the page.** The docs layout wraps children in
   `Container` + `Shell` because it has a sidebar and a TOC. A landing is full-bleed
   sections: each section owns its own width via `.lw-container` inside it, so the section's
   background can span the viewport while its content stays centered.
3. **The docs link is cross-domain.** The header's "Documentation" link points at the docs
   site, not at a route in this app. Put that origin in one exported constant — do not
   scatter the URL through components. Default it to `https://docs.lyra-ds.dev`.
4. **No `prebuild`.** `copy-llms.mjs` is a docs concern.

## The app-local chrome components

`apps/docs` has `components/site-header.tsx`, `site-footer.tsx`, `theme-toggle.tsx`,
`locale-switcher.tsx` and `html-lang.tsx`. This app needs the same five roles, but they are
**not** the same components — different nav items, a cross-domain docs link, and a different
set of header actions.

Copy them as a starting point and adapt. This duplication is accepted for now: they are app
chrome, not design system surface.

**Report any file that ends up byte-identical to its docs counterpart.** Those are the real
candidates for later extraction, and only measurement can tell us which they are.

All five build on `@lyra-ds/react` — `Navbar`, `NavLink`, `Footer`, `Brand`, `IconButton`,
`useTheme`, `SegmentedControl`, `Icon`, `Button`. Every one of those is exported today.
**Do not write a replacement for any of them.**

## The header

Three regions, using `Navbar`'s slots:

- **brand** — `Brand`, linking to the landing home.
- **nav** — links to the page's own sections: Components (`#components`), Frameworks
  (`#frameworks`), Theming (`#theming`), FAQ (`#faq`). The anchors must match the `id`s that
  later lots will create; agree on these names now and use them.
  **There is no "Preços" link.** The kit has one; there is no pricing.
- **actions** — locale switch, theme toggle, a GitHub link, and the "Documentation" CTA
  pointing at the docs origin.

## The Hero — port with the honesty rules applied

Reference: `handoff/ui_kits/website/sections.jsx` lines 30–52, plus the `.lw-hero*` rules in
the `<style>` block of `handoff/ui_kits/website/index.html`.

Port the **layout, spacing and CSS**. The content changes:

| Kit                                             | Ship                                                                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Badge "v1.0 · open source"                      | The real version, `v0.1.0`, read from `packages/react/package.json` — not typed in                                   |
| "…para React, Vue, Laravel e Phoenix LiveView"  | Must not imply four shipping packages. Say what is true: the CSS works anywhere; React is the package that exists    |
| Second CTA "npm i @lyra-ds/react"               | Keep — the landing ships after the npm release                                                                       |
| Meta row: "3.842 estrelas", "48 mil/mês", "MIT" | **Delete the two invented metrics.** Keep MIT. Fill the row with facts you can verify from the repo, or drop the row |

The `<h1>` is the Hero's title and it is the page's only `<h1>`.

## `site.css` — only the foundation

Create `apps/site/app/site.css` with the layer every later section needs, and nothing more:

- `.lw-container` — the centered max-width wrapper.
- `.lw-section`, `.lw-section--alt` — vertical rhythm and the alternating surface.
- `.lw-overline`, `.lw-h2`, `.lw-section__sub` — the section title trio.
- `.lw-hero`, `.lw-hero__inner`, `.lw-hero__title`, `.lw-hero__sub`, `.lw-hero__cta`, and
  the meta row if you keep it.

Take the rules from the handoff's `<style>` block, which is the authority for the visual.

**Before copying any name that also exists in `apps/docs/app/site.css`, compare the two rule
by rule and report what differed.** Sixteen names collide across the two files
(`.lw-brand`, `.lw-brand__word`, `.lw-header`, `.lw-header__inner`, `.lw-hero`,
`.lw-hero__sub`, `.lw-hero__title`, `.lw-mark`, `.lw-nav`, `.lw-nav__link`, `.lw-footer`,
`.lw-footer__inner`, `.lw-footer__links`, `.lw-footer__note`, `.lw-docs__content`,
`.lw-docs__side`) and the same name is not a guarantee of the same rule. This comparison is
a deliverable of this lot, not a side task.

Do not define anything for sections that do not exist yet. An unused rule is dead code that
the next lot has to guess about.

## Acceptance criteria

1. `apps/site/` exists as a pnpm workspace package with exact-pinned versions, and
   `pnpm install` at the root wires it without touching `apps/docs`.
2. `pnpm --filter @lyra-ds/site run build` produces a static export containing
   `en/index.html` and `pt-BR/index.html`, and the root `pnpm run build` builds it too —
   prove the second with the command's real output, not by inference.
3. Both locale pages render header, Hero and footer, with every visible string coming from
   the message files. No hardcoded UI copy in components.
4. The theme toggle switches the page and persists under the key `lyra-site-theme`. Prove
   the key is distinct from the docs app's — say how you checked.
5. The locale switch moves between `/en` and `/pt-BR` and keeps the reader on the same page.
6. `/` redirects by navigator language and still offers a working link with JS disabled.
7. **No false claim ships.** No star count, no download count, no package name other than
   `@lyra-ds/react`, no pricing, no Discord, no "v1.0". The version badge reads the real
   version from a file.
8. `axe.run` is clean on both locale pages in **both themes** — report the actual run, and
   say how you ran it.
9. Exactly one `<h1>` per page; the eyebrow is not a heading.
10. The `.lw-*` collision comparison is reported: for each of the 16 names, whether the docs
    rule and the handoff rule agree, and which one you took.
11. The four CI jobs' commands are run and their real output reported, with anything
    unrunnable named and explained.

## Boundaries

- **Do not touch `packages/`.** No new component, no CSS change, no changeset — this lot
  ships an app, not library surface.
- **Do not touch `apps/docs/`**, except to read it. If something there is wrong, report it.
- Do not build the Showcase, Frameworks, Theming, Community, FAQ, CTA or CookieBanner
  sections. They are later lots. Anchors in the header may point at ids that do not exist
  yet — say so in your report.
- Do not add a deploy config (Cloudflare/Vercel/wrangler). That is lot 5.
- Do not extract a shared chrome package. Measure the duplication and report it instead.
- Do not commit, branch or push.
