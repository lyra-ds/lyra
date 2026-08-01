# Shared brief — 6c-c, the Lyra marketing site

Read this in full, then read your lot file (`.batuta/lot-6cc-NN-*.md`). Everything here
applies to every lot of this phase; the lot file carries only the goal, the acceptance
criteria and the boundaries specific to it.

## What the project is

Lyra DS is an open source, CSS-first, white-label design system for SaaS products, published
as `@lyra-ds/styles` (plain CSS, no build) and `@lyra-ds/react` (thin React wrappers over
those classes). The whole appearance lives in `.lyra-*` classes so the same CSS can serve
other frameworks. Read `.claude/CLAUDE.md` for the locked architectural constraints — no
Tailwind anywhere, no runtime CDN dependency, no CSS-in-JS, fonts as peer dependencies.

## What 6c-c is

A **new app**, `apps/site/`, that serves the marketing landing at **lyra-ds.dev**. It is a
sibling of the existing `apps/docs/` (which serves **docs.lyra-ds.dev**), not a route inside
it. Two apps, two deploys, two domains.

Section order on the landing, decided and fixed:

`Navbar` → **Hero** → **ComponentShowcase** → **Frameworks** → **Theming/Tokens** →
**Community** → **FAQ** → **CTA** → `Footer` → **CookieBanner (LGPD)**.

Bilingual EN + pt-BR, same locale scheme as `apps/docs`. Static export, like `apps/docs`.

### Why a separate app and not a route

The docs app is a fumadocs content pipeline: MDX collections, a page tree, generated prop
tables, search. The landing is one page of composed sections with no content source. Putting
them in one app means every landing build carries the MDX pipeline and every docs route
carries the marketing chrome. They also deploy to different domains on different cadences —
the landing ships **after** the npm release, the docs ship continuously.

**What this does NOT mean is duplicating components.** `Navbar`, `NavLink`, `Footer`,
`ThemeProvider`, `Brand`, `Container`, `Stack`, `Inline`, `Grid`, `SegmentedControl`,
`CodeBlock`, `Button`, `Card`, `Badge`, `Tabs`, `Tag`, `Input`, `Accordion`, `Icon` are all
exported by `@lyra-ds/react`. The new app **consumes the workspace package** exactly like the
docs app does. If a section needs a component that exists, import it; do not rebuild it.

## The source material, and how much of it you can trust

The handoff kit is at `handoff/ui_kits/website/` — `index.html` (a `<style>` block plus the
page assembly), `sections.jsx` (`SiteHeader`, `Hero`, `Frameworks`, `ComponentShowcase`,
`SiteFooter`), `sections-marketing.jsx` (`PricingSection`, `Testimonials`, `FAQSection`,
`CTASection`) and `docs.jsx`.

**This kit is an older version than the plan assumes.** The plan describes a revision with a
`sections-community.jsx`, a `ThemingSection`, a `CommunitySection`, a standalone `site.css`
and a `docs.html`. **None of those exist in this repo.** Do not go looking for them and do
not report their absence as a blocker — it is known and it is why two sections in this phase
are specified in prose in their lot files instead of being ported.

Treat the kit as **visual reference for layout, spacing and CSS**, never as a source of
truth for copy or claims. It was built when the product had a paid tier.

## Honesty rules — these are not style preferences

The kit contains statements that are false today. Shipping them would be lying to a visitor
deciding whether to adopt the library. Every one of these is a hard requirement.

1. **No fabricated metrics.** The Hero shows "3.842 estrelas" and "48 mil/mês". These are
   mockup filler. Never render a star count, download count, or any other number that
   claims to measure real-world adoption unless it comes from a live source. Cut them.
2. **No paid tier, anywhere.** No "Community/Pro", no pricing, no "cancel anytime", no
   checkout. Three of the five FAQ answers in the kit reference the Pro plan; they are
   rewritten in this phase, not ported.
3. **No Discord.** Community is GitHub issues + GitHub Discussions. The kit's footer and FAQ
   both link Discord; both are wrong.
4. **No package name for a package that does not exist.** `@lyra-ds/vue`, `lyra/blade` and
   `lyra_liveview` are not published and are not being built. Showing an install name is an
   invitation to run `npm i` and get a 404. Only `@lyra-ds/react` may be named.
5. **No maturity badge that overstates.** The kit labels Vue and Blade "Beta" and LiveView
   "Em dev". All three are **"Em breve" / "Coming soon"** — nothing about them exists in the
   repo. Only React carries a ready state.
6. **No hardcoded inventory numbers.** The copy fixes "209 tokens" and "55+ componentes";
   both are already wrong (211 tokens, 269 classes, 54 documented components). Any number
   describing the library's own size must be read from a real source at build time, not
   typed into a string. Your lot file names the source when it applies.
7. **Version claims match reality.** The Hero badge in the kit says "v1.0". The first
   published version is **v0.1.0**.

If a lot's copy needs a claim you cannot verify, write the claim without the number and say
so in your report. An honest vaguer sentence beats a precise invented one.

## The `.lw-*` cut criterion

The site's own CSS lives in `apps/site/app/site.css` with the `.lw-` prefix, mirroring how
`apps/docs/app/site.css` works. Before writing any new `.lw-*` rule, ask: **"would a
consumer of Lyra want this?"**

- **Yes → it belongs in the design system**, not in the site. Stop and report it; do not
  quietly build a private version of a component the DS should own. This phase does not add
  components to `packages/`.
- **No → write the `.lw-*` rule.** Page composition, hero layout, section rhythm, CTA band,
  marketing-only chrome: these are genuinely site-specific and belong here.

The 16 class names that collide between the handoff's `<style>` block and
`apps/docs/app/site.css` (`.lw-brand`, `.lw-header`, `.lw-hero`, `.lw-footer`, `.lw-nav`,
`.lw-mark` and their modifiers) **are not guaranteed to mean the same thing in both**. Same
name, possibly different rules. Compare rule by rule before copying anything across.

## Conventions — non-negotiable

- **Never write CSS that styles a Lyra component.** Appearance comes from `.lyra-*` classes
  in `@lyra-ds/styles`. If a component looks wrong, that is a finding to report, not
  something to patch with a site-level override.
- **No Tailwind, no CSS modules, no CSS-in-JS, no inline `style` for anything a class can
  do.** The one accepted use of inline style is passing a custom property value.
- **No runtime CDN dependency.** Every asset is local. Icons come from the `Icon` component
  (Lucide, bundled), never from a `<script src>`.
- **Everything bilingual.** Every string a visitor can read exists in EN and pt-BR. A
  missing translation is a failing lot, not a follow-up.
- **Exact versions.** `.npmrc` sets `save-exact`; engines are `>=24 <25`.
- Conventional commits. **Never commit to `main`** — but in this phase you do not commit at
  all (see the end of this file).

## Accessibility is a gate, not a review note

This is the marketing site of a design system that advertises accessibility. A violation
here is a product claim failing on its own homepage.

- `axe.run` must be clean on the landing, in **both locales** and **both themes**.
- One `<h1>` per page. Sections use `<h2>`; the eyebrow above a title is not a heading.
- Every interactive element reachable and operable by keyboard, with a visible focus ring.
- Every image has an `alt`; decorative marks get `alt=""`.
- Contrast AA in both themes — including the dark CTA band, which sits on `--indigo-950`
  and does not follow the page theme.

## The gates — run these, and report their real output

The authoritative gate is `.github/workflows/ci.yml`, not a summary. Read that file. The
four jobs, expanded:

```bash
# lint
pnpm run lint && pnpm --filter @lyra-ds/styles run lint:css \
  && pnpm --filter @lyra-ds/react run lint
# typecheck
pnpm --filter @lyra-ds/react run build && pnpm run typecheck
# test
pnpm run test && pnpm run parity && node tools/icon-registry/generate.mjs --check
# build
pnpm run build && node tools/docgen/generate.mjs --check \
  && pnpm exec publint packages/styles && node tools/pack-smoke/pack-smoke.mjs \
  && pnpm exec publint packages/react \
  && pnpm --filter @lyra-ds/react exec attw --pack . --profile node16 \
  && pnpm --filter @lyra-ds/react exec size-limit \
  && node tools/dist-scan/assert-use-client.mjs packages/react/dist \
  && node tools/dist-scan/no-cdn-scan.mjs packages/react/dist \
  && node tools/smoke/smoke.mjs
```

A new app under `apps/` must not break any of them. `pnpm run build` now builds one more
workspace — if the new app is not wired into the root scripts, the gate passes while
building nothing, which is a silent failure, not a pass.

**Some of these cannot run in your sandbox.** `pnpm run test` needs Browser Mode, which needs
to bind localhost; `pack-smoke`, `smoke` and `publint` also tend not to survive. That is
expected and it is not a failure. What IS a failure is reporting them as passing.

**Run what you can. For anything you could not run, say so explicitly and name the reason.**
The maestro re-runs everything independently; an honest "could not run the browser tests"
costs nothing, while a false green costs a whole round.

## Verifying a page, not just a build

`next build` prerenders a broken page without failing. These lessons were each paid for:

- **Check the built artifact, not `next dev`.** The dev overlay mounts inside the document
  and makes working things look frozen.
- **A static server must map extensionless routes to `.html`.** `python -m http.server`
  serves a directory listing instead, which hides correct behavior.
- **Exercise the interaction**, do not just look at the render.

## Method

If you have a test-first or plan-first workflow available on your side, use it. Otherwise
work directly from the acceptance criteria in your lot file, implementing first and then
covering each criterion with a test, per this project's tests-after methodology.

**Test laws:** test the behavior, never the mock. A failing test means fix the code, not the
test. No test-only flags or branches in production code.

## Expected evidence — what to report back

1. Every file created, modified or deleted, by path.
2. Every command you ran, with its **actual output** — not a summary, not a claim.
3. Every command you could not run, and why.
4. Each acceptance criterion from your lot file, answered one by one.
5. Anything you were uncertain about, declared as uncertainty rather than smoothed over.
6. Any place where the specification turned out to be wrong or impossible, and what you did.
7. **Every claim or number you put on the page, and where it came from.** This is the
   honesty rule made auditable.

## Stop conditions — report instead of improvising

- The code's actual shape contradicts this brief or your lot file.
- The same command fails twice for the same reason.
- The fix would require editing something listed under Boundaries in your lot file.
- A section needs a component that does not exist in `@lyra-ds/react` (see the `.lw-*` cut
  criterion — that is a design system decision, not yours to make).
- The copy you are asked to write requires a fact you cannot verify.

In all five cases: stop, and report what you found and what you would need. A partial, honest
delivery is worth more than a complete one built on a wrong assumption.

## Global boundaries — do not touch

- `packages/` — this phase adds no components and changes no CSS in the design system.
- `apps/docs/` — except where your lot file explicitly says otherwise.
- `handoff/` — read-only reference, always.
- `node_modules/`, `dist/`, `.next/`, `out/`, `pnpm-lock.yaml`, `.planning/`.
- `tools/parity/baseline.json` — this phase cannot legitimately change it.

Do not commit. Do not create branches. Do not push.
