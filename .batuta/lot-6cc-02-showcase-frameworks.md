# Lot 6c-c/2 — ComponentShowcase and Frameworks

Sits on top of `.batuta/brief-6cc-landing.md` — the honesty rules, the `.lw-*` cut criterion,
the conventions, the gates, the evidence contract and the boundaries in it apply unchanged.
Read it first, in full.

## Goal

Add the landing's second and third sections to `apps/site`: the component showcase (a live
preview with a code view) and the framework status grid. Both bilingual, both anchored at the
ids the header already links to.

Lot 1 shipped the app, the chrome, the Hero and the `site.css` foundation (`.lw-container`,
`.lw-section`, `.lw-section--alt`, `.lw-overline`, `.lw-h2`, `.lw-section__sub`). Use that
foundation; do not redefine it.

## Where they go

In `apps/site/app/[lang]/page.tsx`, after the Hero, in this order:

1. **ComponentShowcase** — `<section id="components" className="lw-section lw-section--alt">`
2. **Frameworks** — `<section id="frameworks" className="lw-section">`

The header in `apps/site/components/site-header.tsx` already links `#components` and
`#frameworks`. **Those anchors must resolve after this lot** — verify by clicking them, not
by reading the markup.

Each section is its own component file under `apps/site/components/sections/`. The page
composes them; it does not inline them.

## ComponentShowcase

Reference: `handoff/ui_kits/website/sections.jsx` lines 85–118, and the `.lw-show__*` rules in
the `<style>` block of `handoff/ui_kits/website/index.html` (lines 66–76).

Structure: eyebrow + `h2` + subtitle, then a `Card` with `padded={false}` holding a
`Tabs` control ("Preview" / "Code") and, below it, the active view.

### The `Tabs` contract — read this before using it

`Tabs` is **controlled** and it does **not** render panel content:

```tsx
<Tabs
  items={[
    { id: 'preview', label: '…' },
    { id: 'code', label: '…' },
  ]}
  active={tab}
  onChange={setTab}
/>
```

It emits the `role="tablist"` **plus one empty `role="tabpanel"` per item**, each labelled by
its tab. Your content goes **after** it, rendered by you. This is the documented contract
(`apps/docs/content/docs/en/components/tabs.mdx`) and the docs examples follow it — do not
try to pass children into `Tabs` and do not build a replacement.

Because the tabs are stateful, the showcase is a client component.

### The preview view

The stage shows real Lyra components, exactly as the kit does: a primary `Button`, a
secondary `Button`, a `Badge` with `tone="success"` and `dot`, a `Tag`, and a small `Input`.
Wrap them in `.lw-show__stage`.

### The code view — use `CodeBlock`, not a `<pre>`

The kit uses `<pre className="lw-show__code">` with its own dark styling. **We have a
`CodeBlock` component now** (`language`, `lineNumbers`, `copyLabel`, `copiedLabel`,
`copyText`), and this is exactly the `.lw-*` cut criterion resolving in favour of the design
system: a code frame with a copy button is something any consumer wants.

So: **do not port `.lw-show__code`.** Render `CodeBlock` with `language="tsx"`. Its copy
labels are visible text and must come from the message files like everything else.

The design system does not depend on Shiki, so the code is plain text — no syntax
highlighting. That is the intended trade-off; do not add a highlighter.

### The code must be the truth

**The snippet must be real code that produces exactly what the preview shows.** A showcase
whose code sample does not match its preview is the same class of dishonesty as an invented
metric — it just fails later, when a reader pastes it.

Derive the snippet from the preview you actually built, imports included, and say in your
report how you checked the two agree.

## Frameworks

Reference: `handoff/ui_kits/website/sections.jsx` lines 54–83, and the `.lw-fw*` rules
(`index.html` lines 59–63, plus the 900px breakpoint at line 146).

Eyebrow + `h2` + subtitle, then a four-card grid — one `Card` per framework, `interactive`
and `padded`.

**The status column is where the kit lies, and this is the one section where the honesty
rules bite hardest.** The kit shows:

| Framework        | Kit says            | Ship                                     |
| ---------------- | ------------------- | ---------------------------------------- |
| React            | `Estável` (success) | Ready — `Badge tone="success" dot`       |
| Vue 3            | `Beta` (warning)    | **Coming soon** — `Badge tone="neutral"` |
| Laravel Blade    | `Beta` (warning)    | **Coming soon** — `Badge tone="neutral"` |
| Phoenix LiveView | `Em dev` (info)     | **Coming soon** — `Badge tone="neutral"` |

`warning` and `info` tones both signal _work in progress_, which is a maturity claim: it says
someone is building this. Nothing for those three exists in the repo. `neutral` is the tone
that says "not yet" without promising a date or an effort.

**Only React shows a package name.** `@lyra-ds/vue`, `lyra/blade` and `lyra_liveview` are not
published and are not being built; printing an install name invites a `npm i` that 404s. The
three "coming soon" cards show the framework name and the badge, and nothing else — so
`.lw-fw__pkg` renders for React only.

The section subtitle is the honest version of the kit's claim: the appearance lives in
`.lyra-*` classes, so the CSS already works in any of these stacks; what a framework card
promises is a _wrapper package_, and only React has one.

## New `.lw-*` rules

Add to `apps/site/app/site.css`, taking the values from the handoff `<style>` block:

- `.lw-show__tabs`, `.lw-show__stage`
- `.lw-fw-grid` (4 columns, 2 columns under 900px), `.lw-fw`, `.lw-fw__head`, `.lw-fw__name`,
  `.lw-fw__pkg`

**Not** `.lw-show__code` — `CodeBlock` replaces it.

## Acceptance criteria

1. Both sections render on `/en` and `/pt-BR`, with every visible string from the message
   files. No hardcoded copy in components.
2. The header's `#components` and `#frameworks` links scroll to the right sections. Verify by
   clicking, in the built artifact.
3. The showcase's tabs switch views by mouse **and** by keyboard (arrows, Home/End), and the
   `Tabs` contract is respected — content rendered outside, no attempt to fill its panels.
4. The code view renders through `CodeBlock`, its copy button copies the snippet, and the
   copy labels are translated in both locales.
5. **The snippet matches the preview**, imports included. Say how you verified it.
6. Frameworks: React is the only card with a package name and the only one with a
   non-`neutral` badge. No `warning`, no `info`, no "Beta", no "Em dev", no invented date.
7. The grid is 4 columns wide and 2 columns under 900px. Check the real breakpoint in a
   browser, not in the stylesheet.
8. `axe.run` clean on both locale pages in **both themes**, with the showcase on the Preview
   tab **and** on the Code tab — a tab you never opened is a tab you never audited.
9. Still exactly one `<h1>` per page; both new section titles are `h2`.
10. `.lw-show__code` does not exist anywhere in `apps/site`.
11. The four CI jobs' commands are run and their real output reported, with anything
    unrunnable named and explained.

## Boundaries

- **Do not touch `packages/`.** If a component fights you, report it — that is a design system
  finding and it gets its own lot, as happened in 6c-b4.
- Do not touch `apps/docs/`.
- Do not build Theming, Community, FAQ, CTA or the CookieBanner — later lots.
- Do not add a syntax highlighter, and do not add Shiki.
- Do not change the Hero, the header or the footer.
- Do not commit, branch or push.
