
## Project

**Lyra Design System (lyra-ds)**

Lyra DS é um design system open source, CSS-first e white-label para produtos SaaS, criado para facilitar a vida de desenvolvedores dos mais variados frameworks. Este projeto converte o design handoff completo (protótipos de alta fidelidade em HTML/JSX, 209 tokens, 40 componentes — em `handoff/`) em uma biblioteca real publicável no npm, sob uma nova org GitHub (`lyra-ds`), com monorepo pnpm, site de documentação bilíngue e pipeline de releases.

**Core Value:** Qualquer desenvolvedor consegue instalar `@lyra-ds/styles` + `@lyra-ds/react` e ter uma UI pixel-perfect, tematizável (light/dark + white-label em 4 tokens), com o mesmo CSS core reutilizável em outros frameworks.

### Constraints

- **Arquitetura**: CSS-first — aparência 100% em classes `.lyra-*`; React é wrapper fino. É o que viabiliza multi-framework. Decisão travada (jul/2026).
- **Sem Tailwind no core** — decisão travada; preset Tailwind só como satélite futuro.
- **Fidelidade**: cores, tipografia, espaçamento, raios, sombras e estados são finais — preservar pixel a pixel a partir de `handoff/tokens/`.
- **Naming**: Lyra é canônico; `compat-shadcn.css` é opt-in e fica fora do entry.
- **Animação**: keyframes de entrada animam apenas transform (nunca `opacity: 0` no frame inicial).
- **Runtime**: nenhuma dependência de CDN em runtime (Icon deve embarcar Lucide localmente).
- **Fontes**: Plus Jakarta Sans + JetBrains Mono como peer (`@fontsource/*`), não embutidas.
- **Stack**: monorepo pnpm workspaces + changesets; tsup para o pacote React; peerDeps react >=18.
- **Licença**: MIT, com CONTRIBUTING.md e Code of Conduct desde o início.
- **Infra**: GitHub org `lyra-ds` (criação manual pelo usuário, guiada), npm org `lyra-ds`, docs na Vercel.



## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | 24 LTS | Runtime for all tooling and CI | Active LTS; ships npm ≥11.5.1, which is required for npm trusted publishing (OIDC). Pin via `engines` + `.nvmrc`. |
| pnpm | 11.13.1 | Workspace manager (locked) | Locked decision. Pin via `packageManager` field so CI (`pnpm/action-setup`) and contributors agree. |
| TypeScript | **5.9.3 (pin, do not float to latest)** | Types for `@lyra-ds/react` | npm `latest` is now **7.0.2** (the Go-native "tsgo" compiler). tsup is unmaintained and its `.d.ts` pipeline (rollup-plugin-dts / api-extractor) is not validated against TS 7. TS 5.9.x is the last battle-tested JS-based line every tool supports. Revisit TS 7 when the bundler moves to tsdown. |
| tsup | 8.5.1 | Bundler for `@lyra-ds/react` (locked) | Locked decision. **Caveat (verified in repo README):** "This project is not actively maintained anymore. Please consider using tsdown instead." 8.5.1 (Nov 2025) works fine for ESM+CJS+dts today; treat tsdown (0.22.x, Rolldown-based, near drop-in with a migration tool) as the planned escape hatch, not a v0.1.0 change. |
| React | 19.2.7 (dev/docs), peer `>=18` (published) | Component runtime | Library peerDeps stay `react >=18 <20` per locked decision; develop and test against 19.2. fumadocs-core requires React ^19.2 in the docs app — compatible. |
| Next.js | 16.2.10 | **Docs site framework (recommended — see decision below)** | React-native live previews with no island boundaries; the docs site can dogfood `@lyra-ds/react` as its own chrome; zero-config Vercel deploys with PR previews. |
| fumadocs-core + fumadocs-mdx | 16.11.5 / 15.2.0 | Headless docs engine (content source, page tree, TOC, search, i18n, llms helpers) | Headless by design — proven usable with a non-Tailwind design system (community Mantine template does exactly this). Gives MDX pipeline, per-locale page trees with `fallbackLanguage`, Orama search, and built-in `llms.txt`/`.md`-route helpers, while the entire UI is built from Lyra components. **Do NOT install fumadocs-ui** (Tailwind theme — would fight the existing `ui_kits/website` design). |
| Vitest | 4.1.10 | Test runner | The 2026 default for Vite-era libraries; first-class Browser Mode, projects config for monorepo (one config testing both packages). |
| @vitest/browser-playwright + vitest-browser-react | 4.1.10 / 2.2.0 | Real-browser component testing | Vitest docs explicitly recommend Browser Mode for component testing. Decisive for a **CSS-first** DS: jsdom applies zero CSS, so focus-visible states, focus traps, portal stacking, dark theme, and axe's color-contrast rule are untestable there. Playwright provider (chromium) gives real keyboard events for the Combobox/CommandPalette/Dropdown nav tests. |
| axe-core | 4.12.1 | Automated a11y assertions | Run directly inside Browser Mode pages (inject + `axe.run()` per rendered component, light and dark theme). Full rule set works — including color-contrast — because CSS actually renders. |
| @changesets/cli + changesets/action | 2.31.1 / v1 | Versioning + release PR flow (locked) | Locked decision. Add `@changesets/changelog-github` 0.7.0 for PR/author-linked changelogs. |
| lucide-react | 1.24.0 | Icon system for `@lyra-ds/react` | Handoff-recommended fix for the CDN dependency. Now 1.x (stable); peer range `^16.5.1 || ^17 || ^18 || ^19` fits `react >=18`. Ships per-icon ESM modules, so tree-shaking works when `Icon` maps names statically. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @fontsource/plus-jakarta-sans / @fontsource/jetbrains-mono | 5.2.8 / 5.2.8 | Self-hosted fonts | Documented as peer install for consumers (per handoff); direct dependency only in the docs app. |
| playwright | 1.61.1 | Browser provider for Vitest Browser Mode | Dev-dep at repo root; `npx playwright install chromium --with-deps` in CI. |
| @testing-library/user-event + @testing-library/react | 14.6.1 / 16.3.2 | Optional jsdom fallback layer | Only if a few pure-logic tests are cheaper in jsdom (jsdom 29.1.1). Keyboard/a11y tests belong in Browser Mode. |
| stylelint | 17.14.0 | Lint `@lyra-ds/styles` | The CSS package has no build; a linter is its only automated quality gate (plus the a11y/visual coverage from browser tests). |
| ESLint + typescript-eslint + eslint-plugin-jsx-a11y | 10.7.0 / 8.64.0 / 6.10.2 | Lint React package (flat config) | jsx-a11y catches static a11y mistakes before axe does at runtime. |
| Prettier | 3.9.5 | Formatting | Standard OSS expectation for contributors. |
| next-intl | 4.13.2 | Docs-site UI strings (nav, buttons, landing copy) i18n | fumadocs-core handles content-tree i18n; next-intl handles the non-MDX UI strings. Skip if you keep UI strings in simple per-locale dictionaries. |
| sharp + to-ico | 0.35.3 / 1.1.5 | Generate `favicon.ico` from handoff PNGs at docs build | Handoff-specified. to-ico is old but trivial and build-time only. |
| @changesets/changelog-github | 0.7.0 | GitHub-linked changelogs | Configure in `.changeset/config.json`. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| GitHub Actions | CI + release | Jobs: lint → build (styles is copy/validate, react via tsup, docs via next build) → test (Browser Mode, chromium) → changesets release job on main. Use `pnpm/action-setup` + `actions/setup-node@v4` with `cache: pnpm`, Node 24. |
| npm trusted publishing (OIDC) | Tokenless publish + provenance | GA since mid-2025. Configure trusted publisher per package on npmjs.com (org/repo/workflow file); workflow needs `permissions: id-token: write`; requires npm ≥11.5.1 (Node 24 ships it). With OIDC, **provenance is attached by default** — no `--provenance` flag, no `NPM_TOKEN` secret. See gotchas below. |
| seek-oss/changesets-snapshot | Snapshot/preview releases | Optional `workflow_dispatch` workflow for `0.0.0-snapshot-*` publishes to test packages before v0.1.0. |
| Vercel Git integration | Docs deploy | Point Vercel project at `apps/docs` with `pnpm` detected; PR preview deploys come free. Next.js needs no adapter. |

## Key Configurations (prescriptive)

### `@lyra-ds/styles` — CSS package (no build step)

- **`sideEffects` must mark CSS as side-effectful** (or be omitted entirely). `"sideEffects": false` on a CSS package makes webpack/Rspack silently drop `import '@lyra-ds/styles'` in production builds — the classic broken-CSS-package bug.
- Ship **unminified source CSS**. Consumers' bundlers minify; readable tokens are a feature for a white-label DS. No PostCSS/Lightning CSS pipeline needed at v0.1.0 (the handoff CSS is plain modern CSS — `color-mix` etc. is Baseline). Lightning CSS (1.32.0) is the tool to add later only if you ever need a minified single-file dist.
- `compat-shadcn.css` is exposed as an explicit subpath, never imported by `styles.css` (locked).

### `@lyra-ds/react` — tsup config

- **Per-component entries + `sideEffects: false`** is the handoff-mandated tree-shaking recipe; a single-file bundle defeats module-level dead-code elimination. CSS lives in the separate package, so `false` is safe here.
- `Icon` must map Lucide icons via a **static name→component map** (generated at build if needed) — a fully dynamic `require(name)` pattern would pull all ~1500 icons into every consumer bundle.

### Testing layout

- Root `vitest.config.ts` with `test.projects`: one browser-mode project for `packages/react` (chromium via `@vitest/browser-playwright`, `vitest-browser-react` render + locators), optionally one jsdom project for pure logic.
- Smoke tests: render all 40 components (light + `[data-theme="dark"]`), assert no console errors. Keyboard suites for Combobox/CommandPalette/Dropdown/Dialog focus trap. `axe.run()` on each rendered story-fixture.
- `vitest-axe` is **stale** (0.1.0, last publish Jan 2025) — don't use it. In Browser Mode call `axe-core` directly; if a jsdom project needs axe matchers, `jest-axe` 10.0.0 works with Vitest (but color-contrast is disabled there).

### Release flow (CI)

### llms.txt

- Generate from the hand-written `.d.ts` contracts with a **plain Node script** (TS compiler API — already a devDep) run as a docs `prebuild` step, emitting `apps/docs/public/llms.txt`. Framework-agnostic, zero new dependencies, matches the handoff ("gerado dos `.d.ts`").
- Optional enhancement (post-v0.1.0): fumadocs' `llms(source).index()` route + `remark-llms` per-page `.md` routes for full-content `llms-full.txt`.

## Docs Framework Decision (was deferred to research)

| Requirement | Next.js + fumadocs-core (recommended) | Astro Starlight | Vite SPA (custom) |
|---|---|---|---|
| Live React previews | Native — MDX body is a React component; previews and site share one React runtime | Works via islands, but every interactive demo is a separate `client:load` hydration boundary | Native but everything else is DIY |
| Site chrome built from Lyra components (the design in `ui_kits/website` **is** the docs design) | Natural — CommandPalette ⌘K, Dropdown, Accordion, theme toggle are just app components | Awkward — Starlight is a theme you'd be fighting/overriding wholesale; cross-island state for shell components | Natural but no docs infrastructure |
| EN + pt-BR i18n | fumadocs-core `I18nConfig` (per-locale page trees, `fallbackLanguage`) + next-intl for UI strings | Best-in-class built-in i18n — but tied to the theme you're discarding | DIY |
| MDX | fumadocs-mdx (type-safe collections, TOC, frontmatter schema) | Built-in | DIY |
| Build-generated llms.txt | prebuild script → `public/llms.txt`; optional fumadocs `.md` routes | prebuild script or `starlight-llms-txt` 0.11.0 plugin | prebuild script |
| Vercel | First-class, zero config, PR previews | Fine via `@astrojs/vercel` adapter | Static, fine |
| Search | Orama via fumadocs-core (headless) | Pagefind built-in | DIY |

## Installation

# Repo root (dev tooling)

# packages/react

# apps/docs

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js + fumadocs-core headless | Astro Starlight 0.41 | Docs de-scoped to mostly-static content and you accept Starlight's theme; you'd gain built-in i18n/search/perf for less setup. |
| Next.js + fumadocs-core headless | Nextra v4 | Only if you want a theme-centric Next.js docs site; less composable than fumadocs for a fully custom design. |
| tsup 8.5.1 (locked) | tsdown 0.22.x | Post-v0.1.0 migration target: tsup repo itself recommends it; 3–10x faster, migration tool exists. Adopt once it hits 1.0 or when tsup breaks against newer TS. |
| Vitest Browser Mode | jsdom + RTL + jest-axe | Fine for pure-logic unit tests; cheaper CI. Never for keyboard/focus/axe suites of a CSS-first DS (no CSS rendering, no color-contrast rule). |
| OIDC trusted publishing | Granular `NPM_TOKEN` + `publishConfig.provenance: true` | If the changesets+OIDC scoped-package E404 (npm/cli#8976) bites; still yields provenance badges. |
| TypeScript 5.9.3 pinned | TypeScript 7.0.2 (tsgo) | After migrating to tsdown/actively-maintained dts tooling that certifies TS 7 support. |
| next-intl | Hand-rolled locale dictionaries | Two locales and few UI strings — hand-rolled is acceptable if you want one less dependency. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Tailwind (anywhere in packages) | Locked out; core value is pure-CSS multi-stack portability | Plain CSS with `.lyra-*` classes + tokens |
| fumadocs-ui | Tailwind-based theme; would visually fight the existing Lyra docs design and add Tailwind to the repo | fumadocs-core headless + Lyra components |
| Radix UI / Ark UI in the React package | React-only (Radix) or premature (Ark); behavior layer is Zag.js in phase 2 by locked decision; wrappers stay thin over Lyra CSS | Hand-written thin wrappers per handoff `.d.ts` contracts |
| Runtime CSS-in-JS (styled-components, Emotion) | Runtime cost, RSC-incompatible, ecosystem in decline; contradicts CSS-first architecture | `@lyra-ds/styles` |
| `vitest-axe` | Stale (0.1.0, last publish Jan 2025), pre-Vitest-4 | Direct `axe-core` in Browser Mode; `jest-axe` 10 if a jsdom project needs matchers |
| `lucide-static` via CDN (current prototype approach) | Runtime CDN dependency forbidden by constraints; unpkg outages become your outages | `lucide-react` with a static name map |
| Storybook as the docs site | Component workbench, not a product docs site; can't carry the landing/i18n/llms.txt requirements; heavy second build system | Docs app previews; consider Storybook later for isolated dev only if wanted |
| Lerna / semantic-release | Legacy (Lerna) or single-package-oriented commit-message releases (semantic-release); changesets is locked and better for monorepo intent-based versioning | changesets |
| `"sideEffects": false` on `@lyra-ds/styles` | Bundlers will silently drop the CSS import in production | `"sideEffects": ["**/*.css"]` |
| VitePress / Docusaurus | VitePress is Vue-native (React previews are second-class); Docusaurus ships an opinionated theme + Infima CSS that clashes with a custom-designed, Lyra-styled site | Next.js + fumadocs-core |

## Stack Patterns by Variant

- Use a granular automation token (`NPM_TOKEN`) + `"provenance": true` in each `publishConfig`
- Because it's the documented, working path that still produces provenance attestations; swap to OIDC later without code changes.
- Use Astro Starlight + `starlight-llms-txt`
- Because its built-in i18n/search/perf then beats hand-assembling the same in Next.js.
- Migrate to tsdown with its `migrate-from-tsup` tool (config is intentionally compatible)
- Because tsup is officially unmaintained; this is the sanctioned successor path.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| fumadocs-core 16.11.5 | next 16.x, react ^19.2.0 | Hard peer pins — docs app must be React 19.2+/Next 16; verified via npm peerDeps. |
| lucide-react 1.24.0 | react ^16.5.1–^19 | Fits library peer `react >=18`; verified via npm peerDeps. |
| tsup 8.5.1 | typescript >=4.5.0 (peer) | Peer range is permissive but TS 7 (tsgo) is a new compiler — pin TS 5.9.3 for safety. |
| Vitest 4.1.10 | @vitest/browser-playwright 4.1.10 (same minor), vitest-browser-react 2.2.0 | Browser provider packages version-lock to Vitest 4. |
| npm trusted publishing | npm CLI ≥11.5.1 | Node 24 LTS runners satisfy this; older Node 20 images may not. |
| next 16.2.10 | react ^18.2 or ^19 (peer) | Use React 19.2 in docs to satisfy fumadocs. |

## Sources

- npm registry (`npm view`, 2026-07-16) — all version numbers and peerDependencies above. **HIGH**
- `/withastro/starlight` (Context7) — React-in-MDX via islands, root-locale i18n, pt-BR sidebar translations. **MEDIUM**
- `/fuma-nama/fumadocs` (Context7) — headless loader, I18nConfig, `llms()` route helpers, remark-llms. **MEDIUM**
- `/egoist/tsup` (Context7) + https://github.com/egoist/tsup (direct fetch) — config options; **verified README notice: "not actively maintained… consider tsdown"**. **MEDIUM (verified)**
- https://vitest.dev/guide/browser + /guide/browser/component-testing (Context7) — Browser Mode recommended for component testing; Playwright provider guidance. **MEDIUM**
- https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/ + https://docs.npmjs.com/trusted-publishers/ + https://philna.sh/blog/2026/01/28/trusted-publishing-npm/ — OIDC GA, npm ≥11.5.1, default provenance. **MEDIUM (verified across sources)**
- https://github.com/npm/cli/issues/8976 (direct fetch) — open E404 for scoped monorepo publishes via changesets+OIDC. **MEDIUM**
- https://github.com/changesets/action, https://pnpm.io/using-changesets, https://github.com/seek-oss/changesets-snapshot — release flow patterns. **MEDIUM**
- webpack tree-shaking guide + tsup tree-shakable-library articles — `sideEffects` CSS semantics, per-module entries. **MEDIUM (cross-checked)**
- https://github.com/gfazioli/next-app-fumadocs-template — proof of fumadocs-core headless with a non-Tailwind design system (Mantine). **LOW (single community source, but directly demonstrative)**
- https://www.pkgpulse.com/guides/fumadocs-vs-nextra-v4-vs-starlight-documentation-sites-2026, https://docsio.co/blog/fumadocs, https://docsio.co/blog/starlight-docs — framework comparison context. **LOW (blog tier)**



## Conventions

Conventions not yet established. Will populate as patterns emerge during development.


## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.

## Workflow

Este projeto é conduzido pelo Batuta (`/batuta`): roteamento de tarefas em `.batuta/routing.md`, perfil e mapa do projeto em `.batuta/profile.md`, planos das fases restantes em `.batuta/plan-*.md`, log de trabalho em `WORK.md`. O diretório `.planning/` é arquivo histórico do antigo fluxo GSD (requisitos, research e decision-logs das fases 1–3) — somente leitura.
