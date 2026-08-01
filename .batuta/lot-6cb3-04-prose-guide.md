# Lote 4/4 — a guia de prosa (`.lyra-prose`)

Sits on top of `.batuta/brief-6cb3-docs.md`, which sits on top of
`.batuta/brief-phase06b-fanout.md`. Read both first. This lot writes a **guide**, not a
component page, so the gabarito that applies is the guide shape, not the component one.

## Goal

One bilingual guide documenting `.lyra-prose`, the CSS-only typographic scope shipped in the
chrome layer. It closes the 6c-b3 phase: it is the last undocumented addition, and the only
one with no React component and no prop table.

## Why it is a guide and not a component page

`.lyra-prose` has no React wrapper, no props and no entry in `props.json`. A component page
would render "No generated props found" and break the premise that every component page has a
prop table. It is also the most CSS-first thing in the design system — it works in Vue, Blade,
LiveView or a static HTML file with no JavaScript at all — and a guide is where that can be
shown honestly.

## Read these first

1. `apps/docs/lib/guides.ts` — the manifest you append to. Note the doc comment: guides use
   `titleKey`, not `name`, because a guide's title has to be translated.
2. `apps/docs/content/docs/en/guides/plain-html.mdx` and its pt-BR twin — the closest sibling
   in subject and the right voice to match.
3. `packages/styles/components/chrome/chrome.css` — the `.lyra-prose` rules. Everything you
   document must be verified there.

## What the guide has to cover

- **What it is:** one class on a container; the plain HTML inside it gets the design system's
  typography. No wrapper per element, no React.
- **What it styles.** Enumerate what the rules actually cover — headings, paragraphs, links,
  strong, inline code, lists, blockquote, `hr`. Read the CSS; do not list from memory.
- **The two custom properties**, with their real defaults from the stylesheet:
  `--prose-measure` (the column width) and `--prose-scroll-offset` (the `scroll-margin-top`
  on headings, for anchored links landing under a sticky header). Say what each is for and
  when a consumer changes it. `--prose-scroll-offset` in particular exists for a concrete
  case: a site with a sticky header needs it or its anchor links hide the heading.
- **The `.lyra-btn` guard.** Prose link styling deliberately skips links styled as buttons, so
  a call-to-action inside prose keeps looking like a button. Say why the guard exists.
- **Inline code wraps with `overflow-wrap: anywhere`**, because a long package subpath or
  class name is one unbreakable token and would push a narrow page sideways. This came from a
  real measurement — a 375px viewport scrolling to 390px. Worth one sentence: it explains a
  declaration that looks arbitrary.
- **How to use it outside React.** This is the point of the guide. A plain HTML example, and a
  sentence on what it means for Vue, Blade and LiveView. Nothing about React is required to
  use it.
- **What it does not do.** It styles content you do not control the markup of — MDX, a CMS
  body, user-authored HTML. It is not a replacement for the components: a real button is
  `Button`, not a styled `<a>` inside prose.

## Voice and terminology

The 6b brief's voice section applies: explain the decision, not the obvious; prefer a concrete
consequence over an adjective; no "simply" or "just".

pt-BR is a real translation, not a gloss, and the project's terminology rule in
`.batuta/profile.md` applies — keep in English what a Brazilian developer types and says
(build, viewport, overflow, token), translate where a dominant Portuguese term exists (folha
de estilos, escopo, contraste), never invent a translation to avoid a dominant loanword, and
when both options read badly, describe instead of choosing a metaphor.

## Acceptance criteria

1. `apps/docs/lib/guides.ts` has the new entry, and the `titleKey` resolves to a real string
   in **both** `apps/docs/messages/en.json` and `pt-BR.json`. A missing key renders the raw
   key in the nav.
2. Two MDX files at `apps/docs/content/docs/{en,pt-BR}/guides/<slug>.mdx`.
3. Every class, custom property and default in the guide is verified against
   `packages/styles/components/chrome/chrome.css`. Report how you verified.
4. The plain-HTML example is copy-pasteable and uses only classes that exist — check each with
   `grep -rn '\.lyra-' packages/styles`.
5. The guide appears in the sidebar in both locales with a translated label.
6. **axe at zero** on both new pages, at 1440px, 900px and 375px.
7. `pnpm typecheck`, `pnpm lint`, `pnpm build` pass, with real output reported.
8. Say explicitly what you could not verify visually.

## Boundaries

- `packages/` is read-only. If the CSS is missing something the guide would want, report it
  instead of adding it.
- Do not touch component pages, the manifest in `lib/components.ts`, or `ExampleView`.
- Do not commit, branch or push.
