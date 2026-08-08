# Lot sponsors-02 — Sponsors section on the landing

## Goal

Add a bilingual "Sponsors" section to the lyra-ds.dev landing page: when
`apps/site/data/sponsors.json` is empty it renders an inviting empty state
with a "Become a sponsor" CTA to https://github.com/sponsors/lyra-ds; when it
has entries it additionally renders the self-hosted `/sponsors.svg` image
(sponsor avatars are embedded in that SVG — never hotlink remote avatars).

## Context

- Landing app: `apps/site` (Next.js static export). Landing page:
  `apps/site/app/[lang]/page.tsx` — sections are async server components in
  `apps/site/components/sections/*.tsx`, composed in order:
  hero → ComponentShowcase → Frameworks → Theming → Community → FAQ → CTA.
- Section pattern (copy it): `apps/site/components/sections/community.tsx` —
  `getTranslations` from `next-intl/server`, DS components from
  `@lyra-ds/react` (`Card`, `Icon`, `Button` with `asChild` for links),
  layout classes `.lw-section`, `.lw-container`, `.lw-h2`,
  `.lw-section__sub`, section-specific `.lw-*` classes.
- Copy lives in `apps/site/messages/en.json` and
  `apps/site/messages/pt-BR.json` (flat keys, e.g. `communityTitle`).
- Landing CSS: `apps/site/app/site.css` — `.lw-*` classes only (site-specific
  marketing chrome). NEVER inline `style={{}}`; never new CSS in packages.
- Data contract (produced by lot sponsors-01, already in this worktree):
  `apps/site/data/sponsors.json` — currently `[]`; when populated it is
  sponsorkit's JSON (array of sponsorship objects, each with `sponsor.login`,
  `sponsor.name`, `monthlyDollars`, …). `apps/site/public/sponsors.svg`
  exists ONLY when there is at least one sponsor. The section decides by
  `array.length > 0` (import the JSON statically; the site is a static
  export, so build-time read is correct).
- Tests: `apps/site/scripts/landing-sections.test.mjs` asserts bilingual
  section titles are present in the static export (`apps/site/out/en.html`,
  `out/pt-BR.html`) — extend the existing loop/table with the sponsors
  section titles the same way theming/community are asserted. The test runs
  via `pnpm --filter @lyra-ds/site run test` (its `pretest` builds the site).
- External links on the landing use `target="_blank" rel="noreferrer"`.
- GitHub icon exists in the DS registry as `github`; `heart` exists too
  (check `packages/react/src/icon/icon-registry.ts` before using any name —
  only registry names render).

## Conventions

- `.claude/CLAUDE.md` applies (CSS-first; dogfood DS components — use
  `Button asChild`, `Icon`; raw `.lw-*` only for layout/marketing chrome).
- pt-BR copy follows the project's terminology rules: keep search-jargon in
  English, translate where pt-BR has a dominant term, never invent a
  translation; "Become a sponsor" → "Apoie o projeto" or "Torne-se um
  sponsor" — prefer plain description over awkward translation ("patrocine o
  Lyra" is acceptable; do NOT use "financiador").
- One form per concept across the site.
- Do not commit.

## Deliverables

1. `apps/site/components/sections/sponsors.tsx` — async `Sponsors` server
   component per the Community pattern: `id="sponsors"`, overline/title/
   subtitle from messages, empty state (no sponsors): short invitation text +
   primary `Button asChild` CTA to https://github.com/sponsors/lyra-ds with a
   heart icon; populated state: `<img src="/sponsors.svg" …>` with localized
   alt text, followed by the same CTA. No remote images ever.
2. Section inserted in `page.tsx` between `<Community />` and the FAQ
   section.
3. Message keys (both locales) — `sponsors*` prefix, flat keys like the
   existing ones.
4. `.lw-sponsors*` styles in `apps/site/app/site.css` consistent with
   neighboring sections (spacing, centered CTA; the SVG image must be
   responsive: `max-width: 100%`, centered).
5. `landing-sections.test.mjs` extended to assert the sponsors section titles
   in both locales' static export.

## Acceptance criteria

- `pnpm --filter @lyra-ds/site run test` passes (builds the export and runs
  the extended assertions) — if the sandbox cannot run the build, say so
  explicitly; never report it green.
- With `sponsors.json` = `[]`, the rendered section contains the CTA link to
  https://github.com/sponsors/lyra-ds and does NOT reference `/sponsors.svg`.
- Both locales render translated copy (no key leaks like `sponsorsTitle`
  appearing literally).
- `pnpm --filter @lyra-ds/site run lint` and root `pnpm run lint` pass.
- No edits outside Scope.

## Boundaries

- Do NOT touch: `packages/**`, `apps/docs/**`, `tools/**`, `handoff/**`,
  `.github/**`, `apps/site/sponsorkit.config.ts`,
  `apps/site/scripts/update-sponsors.mjs`, `apps/site/data/sponsors.json`.
- No new dependencies. Do not run pnpm install.
- Test laws: test the behavior, never the mock; a failing test means fix the
  code, not the test; no test-only flags in production code.

## Scope (closed list)

- `apps/site/components/sections/sponsors.tsx` (new)
- `apps/site/app/[lang]/page.tsx`
- `apps/site/messages/en.json`
- `apps/site/messages/pt-BR.json`
- `apps/site/app/site.css`
- `apps/site/scripts/landing-sections.test.mjs`

Do not change anything outside this list; if the task requires it, stop and
report.

## Expected evidence

Report: files touched; commands run with real output; every criterion you
could not verify in the sandbox declared as such.

## Stop conditions

Stop and report when: the data contract files are missing from the worktree;
the same command fails twice; or the task would require edits beyond Scope.
