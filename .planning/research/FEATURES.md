# Feature Research

**Domain:** Open source, CSS-first, white-label design system (npm packages + docs site)
**Researched:** 2026-07-16
**Confidence:** MEDIUM (web-sourced, cross-verified across multiple independent sources; competitor feature sets corroborated by official docs)

Scope: what OSS design systems (shadcn/ui, Radix, Chakra, Mantine, Ark UI, Park UI, Once UI) offer across three layers — the **library**, the **docs site**, and the **repo/community** — categorized as table stakes vs differentiators vs anti-features for Lyra DS v0.1.0.

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these = library reads as a prototype, not a product. Users don't give credit for having them; they leave when they're absent.

#### Layer 1: Library (`@lyra-ds/styles` + `@lyra-ds/react`)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Full TypeScript types with JSDoc | Every serious 2026 library ships `.d.ts`; autocomplete IS the docs for most devs | LOW | Handoff `.d.ts` files are the contract — convert, don't invent. JSDoc currently pt-BR; API surface stays English |
| Dark mode out of the box | First-class in Mantine/Chakra/shadcn; users test it in minute one | LOW | Already done via `[data-theme="dark"]` tokens — just don't break it in conversion |
| WAI-ARIA accessibility (roles, keyboard nav, focus trap, focus restore, `aria-activedescendant`) | Radix/Ark/React Aria set the bar; a11y gaps are the #1 credibility killer for a new DS | HIGH | Biggest real work item. Prototypes have basics; focus trap in Dialog/Drawer/CommandPalette + listbox semantics must be completed. axe-core tests back the claim |
| SSR safety (no `document`/`window` at module scope) | Next.js is the default React runtime; an SSR crash on import is an instant uninstall | MEDIUM | CommandPalette ⌘K listener, portals, localStorage usage all need guards. Test with one SSR smoke render |
| Tree-shaking (one file per component, `sideEffects: false`, ESM+CJS) | Bundle-size scrutiny is standard; users check bundlephobia before adopting | LOW | tsup handles dual format; CSS lives in separate package so `sideEffects: false` is safe |
| Portals for overlay components (Dialog, Drawer, CommandPalette, Toast) | In-place overlays break under `overflow: hidden`/`transform` ancestors — users hit this in week one | MEDIUM | `createPortal` to `document.body` with SSR guard; z-index tokens already defined |
| Controlled + uncontrolled component APIs | React ecosystem convention (value/onChange + defaultValue) | MEDIUM | Verify each of the 40 against its `.d.ts`; FileUpload needs the real `onFiles`/`items` API |
| Zero runtime CDN dependencies | Enterprises block CDNs; offline builds fail | LOW–MEDIUM | Icon must bundle Lucide locally (`lucide-react` recommended) — locked constraint |
| Semantic versioning + changelog | npm baseline; users won't depend on a package without release hygiene | LOW | Changesets already chosen — the standard for pnpm monorepos |
| Peer deps done right (react >=18, fonts as peers) | Wrong peer deps cause install warnings that scare users off | LOW | `@fontsource/*` documented as peer, not bundled |

#### Layer 2: Docs site

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Live component previews | Universal across shadcn/Mantine/Chakra/Ark docs; static screenshots read as abandoned | MEDIUM | One rendered demo per component minimum; the `.prompt.md` files are the source |
| Prop tables per component | Devs scan the prop table before reading prose | MEDIUM | Generate from `.d.ts` at build time (don't hand-write 40 tables — they will drift) |
| Code snippets with copy button | Milliseconds-level expectation | LOW | Preview/code tabs pattern already designed in `ui_kits/website` |
| Theme switcher (light/dark) on the docs site | The docs site is the proof the theming works | LOW | Docs must dogfood `@lyra-ds/styles` — the site itself is demo #1 |
| Search | 40 components without search = friction; Algolia DocSearch is free for OSS | MEDIUM | v0.1.0 can ship simple client-side search; DocSearch application after launch |
| Getting-started page (install → import CSS → first component in <5 min) | The adoption funnel entrance; every competitor optimizes this page hardest | LOW | `npm i @lyra-ds/react @lyra-ds/styles` + one CSS import + Button example |
| Grouped sidebar navigation + prev/next | Standard docs IA | LOW | Already designed in `ui_kits/website` docs page |
| Theming/white-label guide page | Users evaluating a "white-label DS" will look for this page specifically | LOW | Document the 4-token brand contract with a live example |

#### Layer 3: Repo/community

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| README: why + install + minimal snippet + preview image | First (often only) thing evaluated; drives the star/close decision | LOW | Include the CSS-first pitch, white-label 4 tokens, roadmap (Vue/Svelte/registry) |
| MIT LICENSE | De facto standard for OSS design systems; anything else needs justification | LOW | Already decided |
| CONTRIBUTING.md + Code of Conduct | GitHub surfaces CONTRIBUTING on issue creation; absence signals "not maintained" | LOW | Already committed in PROJECT.md |
| Issue + PR templates | Filters low-quality reports; signals operational maturity | LOW | Bug (repro + version), feature request, docs templates |
| CI visible on every PR (lint, typecheck, tests, build) | Green checks = trust signal for contributors and adopters | MEDIUM | GitHub Actions; include axe-core a11y suite so the a11y claim is verifiable |
| Automated releases (changesets → npm publish + GitHub Releases) | Manual releases break; users check the Releases tab for signs of life | MEDIUM | Changesets bot PR flow; provenance publishing is a nice bonus |
| Org branding (avatar, profile README, social preview) | Polish that separates "project" from "product" | LOW | Assets ready in `handoff/assets/github/` |

### Differentiators (Competitive Advantage)

Lyra should not try to out-feature Mantine (120+ components, 70 hooks) or out-distribute shadcn. Its edge is a coherent story competitors can't tell: **finished design + true CSS-first + 4-token white-label + LLM-first**.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| White-label via 4 brand tokens (`--brand`, `--brand-contrast`, `--brand-radius`, `--brand-font`) | Competitors require full theme-object config or a token pipeline (Style Dictionary); Lyra rebrands in 4 lines of CSS with hover/active/soft/focus states derived via `color-mix`, light AND dark. No other OSS DS makes multi-brand this cheap | LOW (designed) / MEDIUM (docs+demo) | The multibrand demo (3 brands × 2 themes) must be a live docs page — it's the money shot |
| CSS-first architecture: `.lyra-*` classes are the public API | Framework-agnostic appearance layer. Vue/Svelte/plain-HTML users can consume `@lyra-ds/styles` TODAY with zero JS. shadcn is React-only, Chakra/Mantine are CSS-in-JS-coupled. Also answers the shadcn "ownership" objection: appearance is plain CSS you can override or fork | MEDIUM | Docs must show a plain-HTML usage example to make the story concrete, and document `.lyra-*` classes as stable API |
| `llms.txt` generated from `.d.ts` at build, served at `/llms.txt` | AI-assisted coding is the default workflow; Nuxt UI/Ant Design/MUI ship llms.txt but few small libraries do, and fewer generate it from types (always in sync). Makes Lyra immediately usable by Cursor/Claude Code/Copilot | MEDIUM | Build step: `.d.ts` → markdown per component + tokens + generation rules. Mantine's MCP server shows the ceiling — that's fase 2 |
| Opinionated, finished visual design (209 final tokens, cohesive SaaS aesthetic) | Headless libs (Radix/Ark) give behavior without look; shadcn gives a starting point you must finish. Lyra gives a pixel-final look — closest analog is Once UI's "design-complete" pitch | LOW (already done) | Guard fidelity in conversion; the dashboard/auth/landing UI kits prove it composes into real product |
| Bilingual docs (EN + pt-BR) | No major DS ships first-class pt-BR docs; instant differentiation for the Brazilian dev community (large, underserved) while EN keeps global reach | HIGH | Doubles content surface. Mitigate: translate component pages from shared structured data (props/examples are identical), only prose differs |
| `compat-shadcn.css` opt-in token mapping | Zero-cost interop with the largest ecosystem: shadcn-styled snippets/blocks render with Lyra colors | LOW | Already designed; keep OUT of default entry. One docs page |
| SaaS-complete component set (CommandPalette, WorkspaceSwitcher, FileManager, Stepper, CookieBanner) | These are the components SaaS teams otherwise hand-build; most libraries stop at primitives | HIGH (they're the hardest 5 of the 40) | Feature them prominently on the landing page — they're the "wow" tier |
| Docs site built with the DS itself | Self-dogfooding is the strongest quality proof; the site design already exists in `ui_kits/website` | MEDIUM | Every docs bug found = library bug found before users find it |

### Anti-Features (Commonly Requested, Often Problematic)

Deliberately NOT in v0.1.0. Research on failed DS launches converges: the killer is scope, not quality.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Vue/Svelte/Web Components adapters | "Multi-framework" is the CSS-first promise | 3× behavior surface to test/maintain at launch; the #1 cited launch mistake is building too much too soon | Ship `@lyra-ds/styles` as usable-anywhere CSS now; Zag.js adapters in fase 2 (already locked) |
| shadcn-style registry (`npx shadcn add @lyra/button`) | It's the trendy distribution model | A second distribution channel doubles release/test surface before the first has users | npm-first now; registry fase 2 reusing the same sources (already locked) |
| Theme builder / playground UI on docs | Every DS eventually gets asked for one | Big interactive app; delays launch for a toy feature | The 4-token contract IS the theme builder — a live multibrand demo page with editable CSS covers 90% |
| Tailwind preset in core | Largest CSS ecosystem; constant ask | Violates the locked CSS-first constraint; couples core to Tailwind's release cycle | Satellite package later (already locked) |
| Component playground with editable live code (Sandpack/live REPL) | Mantine/Chakra docs have it | Heavy build/runtime complexity; static preview + copyable code delivers most of the value | Preview/code tabs (already designed); revisit post-launch |
| Visual regression testing at launch | "Design system needs pixel guarantees" | High setup + flake cost pre-users; smoke + axe-core gives better ROI now | Already decided: smoke + a11y tests; add VRT when external contributions start |
| Full theme-object configuration API (Mantine-style) | Power users want to retheme everything | Explodes API surface; contradicts the simple 4-token white-label story; "too many customization options" is a documented DS failure mode | Escape hatch is CSS itself: override any token or `.lyra-*` class — document this pattern |
| God-components (Table with sorting/filtering/pagination built in, etc.) | Users ask components to do everything | "A table becomes a custom application framework" — documented failure mode; base components should stay tight | Keep the 40 as designed; show composition recipes in docs (dashboard UI kit is the proof) |
| Proprietary icon set, illustrations | "Complete" design systems have them | Massive ongoing design cost; Lucide already fits the grammar | Lucide as the system (already locked) |
| MCP server | Mantine raised the AI-integration bar | Server infra + protocol maintenance; llms.txt captures most agent value at ~10% of the cost | llms.txt now, MCP fase 2 (already locked) |
| i18n of component strings (runtime locale prop) | Bilingual docs invite the ask | Only ~3 components have UI strings; a locale system is premature infrastructure | Expose string props (`labels`, `placeholder`) so apps localize themselves; document the pattern |

## Feature Dependencies

```
.d.ts contracts (converted to TS)
    ├──requires──> [nothing — first artifact]
    ├──feeds────> prop tables (docs, build-time generation)
    ├──feeds────> llms.txt (build-time generation)
    └──feeds────> TypeScript DX (autocomplete)

@lyra-ds/styles (tokens + component CSS)
    ├──requires──> token fidelity check vs handoff/tokens/
    ├──feeds────> @lyra-ds/react (classes are the API)
    ├──feeds────> docs site theme switcher + white-label demo
    └──feeds────> compat-shadcn.css page

@lyra-ds/react components
    ├──requires──> @lyra-ds/styles (class contract)
    ├──requires──> portals + SSR guards (before docs previews — docs framework will SSR)
    └──feeds────> live previews in docs

Docs site
    ├──requires──> both packages published (or workspace-linked)
    ├──requires──> SSR-safe components (previews render server-side)
    └──serves───> /llms.txt (requires llms.txt build step)

Bilingual docs (pt-BR + EN)
    └──requires──> docs content structure that separates prose from generated data
                   (decide BEFORE writing content, or translation = full rewrite)

CI (lint/test/build/axe)
    └──required-by──> changesets release automation (publish gate)

axe-core a11y tests ──verify──> a11y implementation (focus trap etc.)

[Live code playground] ──conflicts──> [launch scope]  (defer)
[Theme-object API] ──conflicts──> [4-token white-label story]  (never, by design)
```

### Dependency Notes

- **SSR safety blocks docs previews:** whatever docs framework is chosen will server-render component demos. Fix SSR guards in the library *before* building docs pages, or every preview breaks. This orders phases: packages → hardening → docs.
- **Prop tables and llms.txt share a pipeline:** both are `.d.ts` → structured data → markdown/HTML. Build one extraction step, two renderers. Doing them together is cheaper than sequentially.
- **Bilingual is an architecture decision, not a content task:** if EN/pt-BR routing and content structure aren't in the docs framework choice (STACK.md concern), retrofitting i18n is a rewrite. The generated parts (prop tables, code) are locale-independent — only prose duplicates.
- **CI precedes releases:** changesets publish workflow must gate on the test suite, so CI lands first.
- **compat-shadcn depends only on styles** and is one docs page — cheap, keep in v0.1.0.

## MVP Definition

### Launch With (v0.1.0)

PROJECT.md's "single complete launch" decision is validated by research: for a design system, docs + polish ARE the product — a component library without live docs doesn't get evaluated at all.

- [ ] All Layer-1 library table stakes (types, dark mode, a11y complete, SSR, tree-shaking, portals, no CDN) — credibility floor
- [ ] All Layer-3 repo table stakes (README, MIT, CONTRIBUTING, CoC, templates, CI, changesets) — cheap, high trust signal
- [ ] Docs: getting started, per-component pages (preview + props + copyable code), theming/white-label guide with live multibrand demo, theme switcher, basic search
- [ ] Bilingual EN + pt-BR content (structure decided up front)
- [ ] `llms.txt` generated from `.d.ts`, served at `/llms.txt`
- [ ] `compat-shadcn.css` opt-in + one docs page
- [ ] Smoke tests (40 renders, keyboard nav on Combobox/CommandPalette/Dropdown, dark theme) + axe-core

### Add After Validation (v0.x)

- [ ] Algolia DocSearch — trigger: docs live + OSS application approved
- [ ] Live editable playground (Sandpack or similar) — trigger: recurring user requests
- [ ] Visual regression tests — trigger: first external code contributions
- [ ] Component string-props localization guide — trigger: non-pt/en adopters appear
- [ ] npm provenance + OpenSSF-style hygiene badges — trigger: post-launch polish pass

### Future Consideration (v1+/fase 2 — already locked in PROJECT.md)

- [ ] Vue/Svelte/WC adapters via Zag.js — defer: 3× maintenance before demand is proven
- [ ] shadcn-style registry — defer: second distribution channel needs a working first one
- [ ] MCP server — defer: llms.txt captures most agent value now
- [ ] Tailwind preset satellite — defer: locked out of core
- [ ] Proprietary icon set — defer: Lucide is the system

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| A11y completion (focus trap, listbox, restore) | HIGH | HIGH | P1 |
| SSR safety + portals | HIGH | MEDIUM | P1 |
| TS types from `.d.ts` + tree-shakeable build | HIGH | MEDIUM | P1 |
| Docs: previews + prop tables + copy code | HIGH | MEDIUM | P1 |
| White-label guide + live multibrand demo | HIGH | LOW | P1 |
| README/CONTRIBUTING/templates/CI/changesets | HIGH | LOW | P1 |
| llms.txt build step | MEDIUM–HIGH | MEDIUM | P1 |
| Bilingual EN+pt-BR docs | MEDIUM | HIGH | P1 (locked decision; contain cost via shared generated data) |
| compat-shadcn page | MEDIUM | LOW | P2 |
| Basic docs search | MEDIUM | LOW–MEDIUM | P2 |
| DocSearch / live playground / VRT | MEDIUM | MEDIUM–HIGH | P3 |
| Adapters / registry / MCP | HIGH (later) | HIGH | P3 (fase 2) |

## Competitor Feature Analysis

| Feature | shadcn/ui | Mantine | Ark UI / Park UI | Lyra's Approach |
|---------|-----------|---------|------------------|-----------------|
| Distribution | Copy-paste registry (ownership model) | npm packages | npm packages | npm-first; registry fase 2; CSS-first mitigates the ownership objection (appearance is overridable plain CSS) |
| Theming | CSS variables, user finishes the design | Theme object, 100s of options | Park UI: Panda CSS presets | 4-token white-label contract, derived states via `color-mix`, light+dark — simplest rebrand story in the field |
| Multi-framework | React-only | React-only | Zag.js: React/Vue/Solid/Svelte | CSS core framework-free today; Zag adapters fase 2 (same bet as Ark, staged) |
| A11y | Inherited from Radix | Own implementation | Zag state machines, AT-tested | Own implementation; must be verifiably complete (axe in CI) — this is where new libraries get dismissed |
| Docs | Previews + registry blocks | Previews, prop tables, playground, DocSearch, i18n of table strings | Standard previews + props | Previews + generated prop tables + white-label live demo; playground deferred |
| AI/LLM support | De facto standard for AI codegen (v0) | llms docs + MCP server per release | — | llms.txt generated from `.d.ts` at build (always in sync); MCP fase 2 |
| Visual design | Neutral starting point, you finish it | Complete but generic | Headless (Ark) / Panda-styled (Park) | Pixel-final opinionated SaaS design, proven in 11 full screens — closest to Once UI's pitch |
| Docs language | EN | EN | EN | EN + pt-BR — unique among peers |

## Sources

Confidence tiers via `classify-confidence`: websearch alone = LOW; cross-verified across independent sources = MEDIUM. All claims below were corroborated by ≥2 sources; competitor capability claims trace to official docs/repos surfaced in search.

- Library feature landscape: [Builder.io React libraries 2026](https://www.builder.io/blog/react-component-libraries-2026), [Untitled UI comparison](https://www.untitledui.com/blog/react-component-libraries), [PkgPulse headless guide](https://www.pkgpulse.com/guides/best-react-component-libraries-2026), [Ark UI](https://ark-ui.com/), [chakra-ui/ark](https://github.com/chakra-ui/ark), [Mantine](https://mantine.dev/)
- shadcn adoption drivers: [Vercel Academy — Why shadcn/ui is Different](https://vercel.com/academy/shadcn-ui/why-shadcn-ui-is-different), [Copy vs Install](https://dev.to/bitdev_/sharing-ui-components-copy-vs-install-4mii), [shadcn as AI default](https://blog.vibecoder.me/shadcn-ui-component-library-ai-development)
- Docs site features: [The Design System Guide — documentation](https://thedesignsystem.guide/documentation), [StackBlitz — documenting components](https://blog.stackblitz.com/posts/design-system-component-documentation/), [Algolia DocSearch (free for OSS)](https://medium.com/@icflorescu/looking-forward-to-adding-algolias-docsearch-to-mantine-datatable-e9df68797e63)
- Repo/community launch hygiene: [npm-module-checklist](https://github.com/bahmutov/npm-module-checklist), [Ben Conolly — NPM OSS checklist](https://medium.com/@noviny/my-npm-open-source-checklist-cf7cdee6962), [changesets](https://github.com/changesets/changesets), [Automate npm releases with changesets](https://blog.ignacemaes.com/automate-npm-releases-on-github-using-changesets/)
- llms.txt ecosystem: [llmstxt.org](https://llmstxt.org/), [Nuxt UI llms.txt](https://ui.nuxt.com/docs/getting-started/ai/llms-txt), [Ant Design LLMs files](https://ant.design/docs/react/llms/), [Fern llms.txt guide](https://buildwithfern.com/post/optimizing-api-docs-ai-agents-llms-txt-guide), [Mintlify — real llms.txt examples](https://www.mintlify.com/blog/real-llms-txt-examples)
- DS launch failure modes: [The Dark Side of Design Systems](https://dev.to/eransakal/the-dark-side-of-design-systems-mistakes-missteps-and-lessons-learned-1onf), [Backlight — 5 things to avoid](https://backlight.dev/blog/5-things-to-avoid-when-building-a-design-system), [Onething — component library best practices](https://www.onething.design/post/component-library-best-practices)
- White-label/multi-brand patterns: [Brad Frost — Themeable Design Systems](https://bradfrost.com/blog/post/the-many-faces-of-themeable-design-systems/), [Clearleft — multi-brand tokens](https://clearleft.com/thinking/designing-with-tokens-for-a-flexible-multi-brand-design-system), [Style Dictionary multi-brand workflow](https://www.alwaystwisted.com/articles/a-design-tokens-workflow-part-9), [Frontend Masters — multi-brand systems](https://frontendmasters.com/blog/exploring-multi-brand-systems-with-tokens-and-composability/)
- Project context: `/home/franciscpd/Projects/lyra-ds/.planning/PROJECT.md`, `/home/franciscpd/Projects/lyra-ds/handoff/design_handoff_lyra_lib/README.md`

---
*Feature research for: open source CSS-first white-label design system (Lyra DS)*
*Researched: 2026-07-16*
