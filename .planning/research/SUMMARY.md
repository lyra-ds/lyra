# Project Research Summary

**Project:** Lyra DS
**Domain:** Open source, CSS-first, white-label design system (pnpm monorepo: pure-CSS package + React wrapper + bilingual docs site)
**Researched:** 2026-07-16
**Confidence:** MEDIUM-HIGH

## Executive Summary

Lyra DS is a design system whose entire appearance layer already exists as a high-fidelity handoff (209 tokens, 40 components, 11 full screens). The build is therefore a **conversion-and-hardening project, not a design project**: the handoff CSS and `.d.ts` contracts are frozen specs, and the engineering work is packaging them correctly (`@lyra-ds/styles` as zero-JS CSS, `@lyra-ds/react` as thin behavior wrappers), completing what prototypes skip (a11y focus management, SSR safety, portals, tree-shakeable builds), and shipping a docs site that dogfoods the system itself. The load-bearing architectural fact from research: **the two packages never import each other** — the `.lyra-*` class names are a string contract, which is what makes the CSS core framework-agnostic today and Vue/Svelte adapters possible in fase 2.

The recommended approach is dependency-ordered and convention-first: scaffold the monorepo with correct packaging metadata from day one (`sideEffects`, `exports` maps, `publishConfig.access: public`), copy the styles package verbatim with automated token/class parity checks, then convert a pilot trio of components (Button, Input, Dialog) plus Icon to lock conventions — shared `internal/` hooks for focus trap/portal/SSR guards, JSDoc style, test template — before batch-converting the remaining ~36. Docs come last among code stages (Next.js 16 + fumadocs-core headless, no fumadocs-ui, UI built entirely from Lyra components), fed by a `tools/docgen` step that generates prop tables and `llms.txt` from one parse of the TypeScript interfaces.

The key risks are all "silent until production": `sideEffects: false` deleting CSS in consumers' prod builds, broken dual ESM+CJS exports that only fail in specific consumer configs, an Icon API that accidentally bundles all ~1,400 Lucide icons, pixel-fidelity drift with no visual-regression net, and a11y done as a checkbox (axe-core cannot catch focus-management bugs). Every one has a cheap, known prevention — parity scripts, `publint`/`attw` in CI, curated icon registry, Vitest Browser Mode keyboard tests, `renderToString` smoke suite — and research is unanimous that these guards must exist **before** mass conversion, not after.

## Key Findings

### Recommended Stack

Full detail in `STACK.md` (confidence HIGH — versions verified against npm on 2026-07-16). Locked decisions honored: pure CSS core, pnpm + changesets, tsup, peer `react >=18`, Vercel, MIT.

**Core technologies:**
- **Node 24 LTS + pnpm 11.13.1**: runtime/workspace — Node 24 ships npm ≥11.5.1, required for OIDC trusted publishing
- **TypeScript 5.9.3 (pinned, do NOT float)**: npm `latest` is now TS 7 (tsgo); tsup's dts pipeline isn't validated against it
- **tsup 8.5.1**: React package bundler (locked) — officially unmaintained; tsdown 0.22.x is the sanctioned post-v0.1.0 escape hatch
- **Next.js 16 + fumadocs-core/fumadocs-mdx (headless)**: docs site — the deferred docs-framework decision, now made; native React previews, site chrome built from Lyra components, per-locale page trees with fallback. **Do not install fumadocs-ui** (Tailwind theme)
- **Vitest 4 Browser Mode (Playwright/chromium) + axe-core 4.12**: decisive for a CSS-first DS — jsdom applies zero CSS, so focus-visible, focus traps, dark theme, and color-contrast are untestable there. Avoid stale `vitest-axe`; call axe-core directly
- **lucide-react 1.24**: kills the CDN icon dependency; requires a static/curated name map (see Pitfalls)
- **changesets 2.31 + npm trusted publishing (OIDC)**: release flow — with a known E404 bug (npm/cli#8976) for scoped monorepo publishes; granular `NPM_TOKEN` + `publishConfig.provenance` is the working fallback

### Expected Features

Full detail in `FEATURES.md` (confidence MEDIUM, cross-verified). Research validates PROJECT.md's "single complete launch": for a design system, docs + polish ARE the product.

**Must have (table stakes):**
- Complete WAI-ARIA a11y (focus trap, restore, `aria-activedescendant`) — the #1 credibility killer for new libraries; the biggest real work item
- SSR safety + portals for overlays — Next.js is the default runtime; an import-time crash is an instant uninstall
- TS types from the handoff `.d.ts`, tree-shakeable dual-format build, zero CDN deps, dark mode preserved
- Docs: live previews, generated prop tables, copy-code, theme switcher, getting-started, white-label guide
- Repo hygiene: README, MIT, CONTRIBUTING, CoC, templates, visible CI, changesets releases

**Should have (competitive):**
- **4-token white-label contract** with live multibrand demo (3 brands × 2 themes) — the money shot; no competitor rebrands in 4 lines of CSS
- **CSS-first `.lyra-*` classes as public API** — usable from Vue/Svelte/plain HTML today; docs must show a plain-HTML example
- **`llms.txt` generated from `.d.ts` at build** — always in sync; few small libraries do this
- Bilingual EN + pt-BR docs (locked; unique among peers; contain cost via shared generated data)
- `compat-shadcn.css` opt-in page; SaaS-complete components (CommandPalette, FileManager, WorkspaceSwitcher) featured prominently

**Defer (v2+/fase 2, mostly already locked):**
- Vue/Svelte adapters (Zag.js), shadcn-style registry, MCP server, Tailwind preset satellite, live editable playground, visual regression testing, theme-object API (never — contradicts the 4-token story)

### Architecture Approach

Full detail in `ARCHITECTURE.md` (confidence MEDIUM-HIGH). Structure: `packages/styles` (pure CSS, no build step, published as-is), `packages/react` (one `.tsx` per component + `internal/` shared hooks, tsup per-component entries), `tools/docgen` (ts-morph: interfaces → llms.txt + prop data), `apps/docs` (workspace-linked first consumer). Data flows one direction only: handoff tokens → styles → class names referenced by React → docs; theming is attribute-driven (`[data-theme]`, `[data-brand]`) via CSS cascade with zero JS. Handoff selectors are frozen API — never "modernized" during conversion.

**Major components:**
1. `@lyra-ds/styles` — owns 100% of appearance; `"sideEffects": ["**/*.css"]`; `./tokens/*` subpath exports; compat-shadcn outside the entry
2. `@lyra-ds/react` — owns behavior only (state, keyboard, focus, portals, SSR guards); `sideEffects: false` is safe precisely because it contains no CSS
3. `tools/docgen` — standalone workspace package; single parse feeds prop tables AND llms.txt (build one extraction, two renderers)
4. `apps/docs` — dogfoods both packages via `workspace:*`; consumes built dist in CI so it doubles as the packaging integration test

### Critical Pitfalls

Top 5 of 11 from `PITFALLS.md` (confidence MEDIUM, cross-checked against official docs and documented post-mortems):

1. **`sideEffects: false` silently deletes CSS in consumers' prod builds** — keep all CSS in styles (marked side-effectful), CI grep forbidding CSS imports in react src
2. **Broken exports map / dual ESM+CJS that type-checks but crashes** — `publint` + `attw --pack` in CI on every PR; test the packed tarball in scratch Vite AND Next.js apps before first publish
3. **String-name `<Icon name>` API bundles all ~1,400 Lucide icons** — curated per-icon-import registry + component-prop escape hatch + size-limit CI gate; decide early, 39 components consume Icon
4. **Pixel-fidelity drift with no baseline** — token parity script (209/209 vs handoff) and class-name parity assertions in smoke tests, written BEFORE mass conversion starts
5. **A11y as a checkbox** — axe passes dialogs that never trap focus; implement against named WAI-ARIA APG patterns, one shared `useFocusTrap`/restore utility, real keyboard tests in Browser Mode (`aria-activedescendant` on the input, focus restore on all close paths)

Also critical: SSR breakage (`renderToString` all 40 + preserve `'use client'` in tsup output), `color-mix()` contrast failures for arbitrary brands (document constraints, test dark/light brand fixtures), cascade strategy (`@layer` guidance), release pipeline dry-run, 0.x versioning policy (0.MINOR = breaking, declared API surface includes class and token names), bilingual drift (EN canonical, generated content shared).

## Implications for Roadmap

Based on research, suggested phase structure (follows ARCHITECTURE.md's dependency-driven build order; each phase is a stable stopping point):

### Phase 1: Monorepo Foundation & Governance
**Rationale:** Everything depends on workspace scaffolding; packaging metadata mistakes (Pitfalls #1, #2, #8) are cheapest to prevent at authoring time; governance files are required at launch anyway and shape contribution policy.
**Delivers:** pnpm workspace, tsconfig.base, changesets config (decide fixed vs independent versioning — research leans fixed/lockstep), CI skeleton (lint → build → test), README/LICENSE/CONTRIBUTING/CoC/templates, versioning + API-surface policy written down.
**Addresses:** All Layer-3 repo table stakes.
**Avoids:** Pitfalls #8 (publishConfig/files from day one), #9 (0.x policy, locked-decisions doc).

### Phase 2: `@lyra-ds/styles` Package
**Rationale:** Zero dependencies; the class contract is written in the CSS first — React components are unverifiable without it. Parity tooling must exist before anything consumes the tokens.
**Delivers:** tokens/ + components/ copied verbatim from handoff, styles.css entry, compat-shadcn as opt-in subpath, `"sideEffects": ["**/*.css"]`, exports map, stylelint, **token parity script (209/209)**, cascade posture decided and documented (`@layer` guidance), color-mix brand-fixture verification.
**Addresses:** Dark mode, white-label contract, compat-shadcn (features).
**Avoids:** Pitfalls #1, #4 (token half), #7, #10.

### Phase 3: React Package Infrastructure + Pilot Components
**Rationale:** The single biggest rework risk is discovering the right conventions at component #25. Pilot trio (Button, Input, Dialog) + Icon spans simple/form/overlay cases and locks file layout, `internal/` hooks (useFocusTrap, usePortal, useControllableState, SSR guards), JSDoc style (decide JSDoc language here — it feeds bilingual docs), and the test template.
**Delivers:** tsup config (per-component entries, `'use client'` preserved), Vitest Browser Mode + axe setup, publint/attw/size-limit CI gates, Icon with curated Lucide registry, 4 pilot components with smoke + keyboard + axe + `renderToString` tests, short CONVENTIONS note.
**Uses:** tsup 8.5.1, Vitest 4 Browser Mode, lucide-react, TS 5.9.3 (from STACK.md).
**Implements:** The class-name contract and internal hooks architecture.
**Avoids:** Pitfalls #2, #3, #5 (utility built once), #6.

### Phase 4: Component Batch Conversion (~36 components)
**Rationale:** Conventions are locked; now repetition is safe. Order within phase: primitives → forms/display → composites (Combobox, Dropdown) → overlays (Drawer, CommandPalette, Toast) → app-level (FileManager, WorkspaceSwitcher, Table). Tests land WITH each component, not after.
**Delivers:** All 40 components with class-parity smoke tests, APG-compliant keyboard behavior, axe passes light + dark, SSR smoke suite green, FileUpload real API (`onFiles`/`items`) with simulation opt-in only.
**Addresses:** A11y completion, controlled/uncontrolled APIs, SaaS-complete component tier (features P1).
**Avoids:** Pitfalls #4 (class half), #5, #6 at scale.

### Phase 5: Docgen + llms.txt
**Rationale:** Needs stable TS interfaces (Stage 4 output); must precede docs content because prop tables and llms.txt come from the same parse — writing docs pages first means hand-writing tables docgen later replaces.
**Delivers:** `tools/docgen` (ts-morph over source, run after typecheck): per-component prop data + `llms.txt` emitted into `apps/docs/public/`, validated against the handoff format; registry.json generator stubbed, not shipped.
**Avoids:** Anti-pattern "hand-maintained props docs"; bilingual drift (generated content is locale-independent).

### Phase 6: Docs Site (bilingual)
**Rationale:** Consumes everything — packages, docgen output, and the `ui_kits/website` design. i18n structure is an architecture decision made at framework setup, not a retrofit.
**Delivers:** Next.js 16 + fumadocs-core headless app styled entirely with Lyra; EN (default) + pt-BR with locale fallback; getting-started, per-component MDX pages (preview + generated props + copy code), white-label guide with live multibrand demo, plain-HTML usage page, compat-shadcn page, theme switcher, basic search, `/llms.txt` served as text/plain, landing page from `ui_kits/website`.
**Uses:** fumadocs-core 16 / fumadocs-mdx 15, React 19.2 in docs app (peer pins), next-intl or plain dictionaries.
**Avoids:** Pitfall #11 (EN canonical, fallback routing), UX pitfalls (contrast guidance, per-bundler quickstarts).

### Phase 7: Release Pipeline & Launch
**Rationale:** First publish exercises every untested path at once; do it as its own gated phase with dry-runs.
**Delivers:** `pnpm pack` + tarball inspection + scratch Vite/Next install tests, manual first publish 0.1.0 (packages must exist before OIDC trusted-publisher config), then OIDC + changesets automation end-to-end tested (Version Packages PR opens and merges under branch protection), Vercel production deploy, org branding, launch checklist ("Looks Done But Isn't" list from PITFALLS.md as UAT gate).
**Avoids:** Pitfall #8 fully; OIDC E404 fallback path pre-decided.

### Phase Ordering Rationale

- **Styles before React:** the class contract is defined in CSS; React targets it as strings.
- **Pilot before batch:** convention changes at component #30 are the project's biggest rework risk (unanimous across ARCHITECTURE and PITFALLS research).
- **Icon inside the pilot phase:** ~39 components depend on it, and it carries the bundle-size and CDN-removal decisions.
- **Docgen before docs content:** one parse, two renderers; prevents hand-written tables and locale drift.
- **Docs late, release last:** docs is the integration test of published-shape packages; release dry-runs need everything real.
- **Parity/CI guards front-loaded:** every critical pitfall is cheapest to prevent before mass conversion and impossible to detect after without them.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (a11y in batch conversion):** WAI-ARIA APG per-pattern specifics (Combobox with listbox popup, Dialog Modal, Menu button keyboard tables) — explicitly flagged in PITFALLS.md; wrong pattern choice (real focus vs `aria-activedescendant`) is silent and expensive.
- **Phase 6 (docs site):** fumadocs-core headless with a fully custom design system is proven by only one community example (LOW-confidence source); i18n routing + next-intl integration details worth validating at planning time.
- **Phase 7 (release):** npm/cli#8976 (OIDC + scoped monorepo E404) status should be re-checked at planning time; the fallback is documented but the primary path may have been fixed.

Phases with standard patterns (skip research-phase):
- **Phase 1 (scaffold/governance):** pnpm workspaces + changesets is thoroughly documented; STACK.md includes prescriptive configs.
- **Phase 2 (styles package):** copy-verify with no build step; the parity script is a small bespoke tool, not a research problem.
- **Phase 5 (docgen):** ts-morph extraction is a well-established pattern with clear references.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions/peerDeps verified against npm registry on research date; docs-framework choice MEDIUM (judgment call over verified capabilities) |
| Features | MEDIUM | Web-sourced but cross-verified ≥2 sources; competitor claims trace to official docs |
| Architecture | MEDIUM-HIGH | Monorepo/build-order/class-contract patterns well-established and cross-checked; docs-app internals depend on stack choice |
| Pitfalls | MEDIUM | Cross-checked against official docs (webpack, MDN, lucide, changesets) + documented issue reports and post-mortems |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **fumadocs-core headless without Tailwind at this fidelity:** single demonstrative community example. Handle: scaffold the docs framework early (as soon as Phase 3 finishes) to de-risk before content investment; Astro Starlight is the documented fallback if docs scope shrinks.
- **OIDC + changesets scoped-monorepo publish (npm/cli#8976):** open at research time. Handle: re-verify during Phase 7 planning; `NPM_TOKEN` + `publishConfig.provenance` fallback is pre-approved.
- **JSDoc language decision (pt-BR handoff vs EN canonical):** constrains the bilingual docs pipeline. Handle: decide in Phase 3 (conversion conventions), before docgen and docs phases consume it.
- **`color-mix()` color space in handoff formulas:** fidelity says keep formulas verbatim, but srgb mixing can grey out saturated brands. Handle: verify with dark/light/saturated brand fixtures in Phase 2; document behavior rather than silently changing formulas.
- **tsup unmaintained:** works today; if it breaks against future TS/React during the project, migrate to tsdown via its compatibility tool (sanctioned path).

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view`, 2026-07-16) — all versions and peerDependencies in STACK.md
- webpack Tree Shaking guide, MDN (`aria-activedescendant`), lucide.dev official docs, pnpm.io/workspaces — sideEffects semantics, a11y patterns, icon tree-shaking, workspace structure
- Project-internal: `handoff/design_handoff_lyra_lib/README.md`, `.planning/PROJECT.md` — canonical constraints and contracts

### Secondary (MEDIUM confidence)
- Context7: `/egoist/tsup` (verified unmaintained notice), `/fuma-nama/fumadocs`, `/withastro/starlight`, Vitest Browser Mode docs
- GitHub Blog + docs.npmjs.com — OIDC trusted publishing GA, npm ≥11.5.1, default provenance; npm/cli#8976 (open E404)
- changesets repo/action/discussions, publint/attw practitioner guides, dual-package publishing articles (cross-checked)
- Competitor official docs/repos: shadcn/ui, Mantine, Ark UI, Chakra; llmstxt.org + Nuxt UI/Ant Design llms.txt implementations
- Design-system failure post-mortems (convergent themes across ≥3 sources)

### Tertiary (LOW confidence)
- `next-app-fumadocs-template` (Mantine + fumadocs-core headless) — single example, directly demonstrative; validate in Phase 6 planning
- Framework-comparison blog posts (PkgPulse, docsio) — context only

---
*Research completed: 2026-07-16*
*Ready for roadmap: yes*
