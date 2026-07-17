# Architecture Research

**Domain:** CSS-first, white-label design system library (pnpm monorepo, npm-published)
**Researched:** 2026-07-16
**Confidence:** MEDIUM-HIGH (monorepo structure, build order, and CSS/React contract are well-established patterns cross-checked against multiple sources; docs-app internals depend on the stack decision, which is a separate research dimension)

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│  apps/                                                             │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ apps/docs — bilingual site (EN + pt-BR)                      │ │
│  │  • MDX pages per component (desc + example + props table)    │ │
│  │  • Live previews (React islands/components from @lyra-ds/*)  │ │
│  │  • Serves /llms.txt (+ registry.json, phase 2) as static     │ │
│  │  depends on: @lyra-ds/styles, @lyra-ds/react (workspace:*)   │ │
│  └───────────────▲──────────────────────────▲───────────────────┘ │
├──────────────────┼──────────────────────────┼──────────────────────┤
│  tools/          │                          │                      │
│  ┌───────────────┼──────────────────────────┼───────────────────┐ │
│  │ tools/docgen — .d.ts → llms.txt + registry.json (build step) │ │
│  │  reads @lyra-ds/react types ─── writes into apps/docs/public │ │
│  └───────────────▲──────────────────────────────────────────────┘ │
├──────────────────┼─────────────────────────────────────────────────┤
│  packages/       │                                                 │
│  ┌───────────────┴────────────┐   ┌──────────────────────────────┐ │
│  │ packages/react             │   │ packages/styles              │ │
│  │ @lyra-ds/react             │──▶│ @lyra-ds/styles              │ │
│  │ • 40 .tsx (1 per comp)     │dev│ • tokens/*.css (209 tokens)  │ │
│  │ • thin wrappers over       │   │ • components/*.css (.lyra-*) │ │
│  │   .lyra-* classes          │   │ • styles.css entry           │ │
│  │ • tsup ESM+CJS+.d.ts       │   │ • compat-shadcn.css (opt-in, │ │
│  │ • sideEffects: false       │   │   outside entry)             │ │
│  │ • tests: smoke + axe       │   │ • ZERO JS, no build step     │ │
│  │ peerDeps: react >=18       │   │   (or lint/validate only)    │ │
│  └────────────────────────────┘   └──────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  root: pnpm-workspace.yaml, tsconfig.base.json, changesets,        │
│        shared ESLint/Prettier, CI (GitHub Actions)                  │
│  handoff/ (read-only source of truth: .jsx refs, .d.ts contracts,   │
│            tokens/*.css values, .prompt.md examples)                │
└─────────────────────────────────────────────────────────────────────┘
```

Key structural fact: **`@lyra-ds/react` does NOT depend on `@lyra-ds/styles` at runtime.** The contract between them is the `.lyra-*` class names (strings), not imports. `styles` is a peer concern the consumer installs and imports once. This is what makes future Vue/Svelte/WC adapters possible — they bind to the same class-name API, not to the React package.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `packages/styles` | Owns 100% of appearance: 209 tokens, all `.lyra-*` component CSS, light/dark themes, white-label brand contract, compat-shadcn mapping | Plain `.css` files published as-is. `exports: { ".": "./styles.css", "./tokens/*": "./tokens/*" }`. No bundler. Optionally a validate step (stylelint, token-count check) |
| `packages/react` | Owns behavior only: state, keyboard nav, focus management, portals, SSR guards. Renders `.lyra-*` classes; never inline styles for appearance | One `.tsx` per component + barrel `src/index.ts`. tsup with per-component entries, `format: ['esm','cjs']`, `dts: true`, `sideEffects: false`, externalized `react`/`react-dom`/`lucide-react` |
| `packages/react` tests | Smoke render of all 40 + keyboard tests (Combobox/CommandPalette/Dropdown) + axe a11y | Vitest + React Testing Library + `vitest-axe`, jsdom environment. Colocated in the package (`src/**/*.test.tsx` or `tests/`), run against **source**, not dist |
| `tools/docgen` | `.d.ts` → `llms.txt` (+ `registry.json` phase 2) | Custom script using `ts-morph` (or `react-docgen-typescript`) reading the react package's prop interfaces + JSDoc; emits into `apps/docs/public/` |
| `apps/docs` | Bilingual docs, live previews, landing design from `ui_kits/website`, serves `/llms.txt` | Docs framework (stack decision) consuming `@lyra-ds/styles` + `@lyra-ds/react` via `workspace:*`; MDX per component sourced from `.prompt.md` + `.d.ts` |
| Root | Workspace orchestration, shared configs, release pipeline | `pnpm-workspace.yaml`, `tsconfig.base.json`, changesets, GitHub Actions CI, root-level ESLint/Prettier |

## Recommended Project Structure

```
lyra-ds/
├── pnpm-workspace.yaml          # packages: ["packages/*", "apps/*", "tools/*"]
├── package.json                 # private, root scripts, shared devDeps
├── tsconfig.base.json           # strict base; packages extend it
├── .changeset/                  # changesets config (linked: styles+react optional)
├── .github/workflows/ci.yml     # lint → build → test → docs build
├── handoff/                     # read-only reference (never published)
├── packages/
│   ├── styles/                  # @lyra-ds/styles — pure CSS, zero JS
│   │   ├── package.json         # exports: ".": "./styles.css", "./tokens/*"
│   │   ├── styles.css           # entry: @imports tokens + components (NOT compat-shadcn)
│   │   ├── tokens/              # colors, typography, spacing, effects, fonts,
│   │   │                        # base, brand, compat-shadcn (opt-in)
│   │   └── components/          # buttons.css, forms.css, ... (8 group files,
│   │                            #  mirroring handoff/components/<grupo>/<grupo>.css)
│   └── react/                   # @lyra-ds/react
│       ├── package.json         # sideEffects: false, peerDeps react >=18
│       ├── tsup.config.ts       # entry: src/index.ts + src/components/*.tsx
│       ├── tsconfig.json        # extends ../../tsconfig.base.json
│       ├── vitest.config.ts     # jsdom + vitest-axe setup
│       └── src/
│           ├── index.ts         # barrel: 40 named exports
│           ├── components/      # Button.tsx, Dialog.tsx, ... (one per component)
│           └── internal/        # shared hooks: useFocusTrap, usePortal,
│                                # useControllableState, SSR guards
├── tools/
│   └── docgen/                  # ts-morph script: .d.ts → llms.txt (+ registry.json)
│       └── src/generate.ts
└── apps/
    └── docs/                    # framework per stack decision
        ├── public/              # llms.txt lands here (generated), favicons
        └── src/content/         # en/ + pt-BR/ MDX per component
```

### Structure Rationale

- **`packages/styles` has no `src/`→`dist` split:** publish the CSS files directly. A build step adds nothing (no preprocessing needed — tokens are already final values) and creates drift risk against `handoff/tokens/`. If a minified variant is wanted later, add it without changing the exports contract.
- **`packages/react/src/internal/`:** the 40 handoff `.jsx` files each inline their behavior; in the library, focus trap, portal, and SSR-safety logic will repeat across Dialog/Drawer/CommandPalette. Extract shared hooks into `internal/` (not exported from the barrel) to fix a11y once, consistently.
- **`tools/docgen` as its own workspace package, not a docs-app script:** it reads from `packages/react` and writes into `apps/docs`. Keeping it standalone means the dependency direction stays clean (docs depends on docgen output, docgen depends on react types) and phase-2 `registry.json` reuses it unchanged.
- **8 group CSS files (not 40):** mirrors the handoff layout (`<grupo>.css`) exactly, which is the fidelity source of truth. Consumers import one `styles.css` anyway; per-component CSS splitting is a phase-2 concern for the registry, not needed for npm distribution.
- **`handoff/` stays at root, untouched:** it is the conversion spec and pixel-fidelity oracle. Tests and reviews diff against it; nothing imports from it.

## Architectural Patterns

### Pattern 1: Class-name contract (CSS package ↔ React package)

**What:** The public, cross-framework API of the design system is the set of `.lyra-*` class names plus `data-*` state attributes and CSS custom properties. The React package emits these strings; the styles package defines their appearance. Neither imports the other.
**When to use:** Always, for every component — this is the locked CSS-first decision made concrete.
**Trade-offs:** Pro: framework adapters share one CSS core; styles version can be bumped independently; zero CSS-in-JS runtime. Con: the contract is untyped strings — a typo in a class name compiles fine and renders unstyled. Mitigation: smoke tests assert key classes are present; consider a generated `classnames` constant module later.

```tsx
// packages/react/src/components/Button.tsx — thin wrapper, appearance-free
export function Button({ variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cx('lyra-button', `lyra-button--${variant}`, `lyra-button--${size}`, props.className)}
      {...rest}
    />
  );
}
// packages/styles/components/buttons.css owns what .lyra-button looks like
```

**Contract rules worth writing down (they ARE the architecture):**
1. React never sets visual inline styles; only classes, `data-*`/`aria-*` attributes, and structural CSS vars if the handoff uses them (e.g., `--progress-value`).
2. State is expressed the way the handoff CSS expects it (e.g., `aria-expanded`, `[data-state="open"]`, `.is-active` — match handoff exactly, since `.lyra-*` selectors are already written against it).
3. Theme/brand switching is attribute-driven (`[data-theme="dark"]`, `[data-brand="x"]`) on the consumer's DOM, never a React context that injects styles.

### Pattern 2: Per-component entries + `sideEffects: false` (tree-shaking without splitting the package)

**What:** tsup builds `src/index.ts` plus one entry per component file, in ESM+CJS with `.d.ts`. `sideEffects: false` is safe **because the package contains no CSS imports** — CSS lives in the separate styles package. This is exactly why the two-package split exists.
**When to use:** From the first component onward; retrofitting entries later churns the exports map.
**Trade-offs:** Pro: bundlers drop unused components even via the barrel; deep imports (`@lyra-ds/react/button`) become possible if you add subpath exports. Con: 41 entries slow dts generation somewhat (seconds, not minutes, at this scale).

```ts
// packages/react/tsup.config.ts
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts', 'src/components/*.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  external: ['react', 'react-dom', 'lucide-react'],
  clean: true,
});
```

### Pattern 3: Docs app as first consumer (dogfooding via `workspace:*`)

**What:** `apps/docs` depends on `@lyra-ds/styles` and `@lyra-ds/react` through `workspace:*`, imports `@lyra-ds/styles` once globally, and renders real components in live previews. The docs site itself is built with the DS (design already exists in `ui_kits/website`).
**When to use:** From the moment the first component exists — the docs app is the integration test that the published contract (exports map, CSS entry, SSR-safety) actually works.
**Trade-offs:** Pro: catches packaging bugs (bad exports map, missing dts, SSR crashes in Dialog/CommandPalette) before npm publish; previews are pixel-true because they use the real CSS. Con: docs build breaks when packages break — that's a feature, but it means CI must build packages before docs (see build order). Decide early whether docs consume react **source** (fast iteration, weaker packaging validation) or **dist** (slower, validates the real artifact) — recommended: dist in CI, source alias in local dev only if iteration speed hurts.

### Pattern 4: Docgen as a build-graph node, not a docs afterthought

**What:** `tools/docgen` parses the react package's prop interfaces + JSDoc (ts-morph over source `.ts`/`.tsx` or emitted `.d.ts`) and emits `llms.txt` into `apps/docs/public/` — and, phase 2, `registry.json` from the same parse. No off-the-shelf tool does `.d.ts → llms.txt`; a small custom script is the established pattern (ts-morph or react-docgen-typescript).
**When to use:** Wire it as soon as ~5 components exist so the parse conventions (JSDoc style, prop naming) harden early, while fixing them is cheap.
**Trade-offs:** Parsing **source** with ts-morph keeps docgen independent of the tsup build (can run in parallel with it); parsing **emitted `.d.ts`** guarantees the docs describe exactly what ships. At this scale, parse source but run docgen after typecheck passes — same guarantee, simpler graph. The handoff's hand-written `.d.ts` JSDoc (pt-BR) must survive conversion into the `.tsx` source, since it becomes the docgen input.

## Data Flow

### The one-directional appearance pipeline

```
handoff/tokens/*.css  (canonical values, 209 tokens)
    ↓ copied 1:1, fidelity-checked
packages/styles/tokens/*.css  ──→  CSS custom properties (--indigo-600, --space-4…)
    ↓ consumed by
packages/styles/components/*.css  ──→  .lyra-* class rules (+ [data-theme], [data-brand] variants)
    ↓ class names referenced (as strings) by
packages/react/src/components/*.tsx  ──→  props (variant/size/state) → className + aria/data attrs
    ↓ imported via workspace:* by
apps/docs  ──→  live previews (real components + real CSS) + MDX props tables
    ↓ parallel branch
packages/react types (.d.ts / source interfaces)
    ↓ tools/docgen (ts-morph)
apps/docs/public/llms.txt  (+ registry.json, phase 2)  ──→  served at /llms.txt
```

Direction never reverses: React never defines appearance; docs never define component API; docgen never hand-edits output. White-label flows the same way: consumer sets 4 `--brand*` vars under `[data-brand]` → `color-mix()` derivations in tokens → every `.lyra-*` rule picks them up → React and docs are untouched.

### Theming/state flow at runtime (consumer app)

```
<html data-theme="dark" data-brand="acme">      ← consumer-controlled attributes
    ↓ CSS cascade only (zero JS)
tokens resolve to dark/brand values → .lyra-* rules recolor
    ↓
React components unaffected (they only emit classes + aria/data state)
```

### Key Data Flows

1. **Token change:** edit `packages/styles/tokens/*` → every component and docs preview updates via cascade. No rebuild of `@lyra-ds/react` needed — the packages version independently (changesets handles the coupling only when class contracts change).
2. **Component API change:** edit `.tsx` props/JSDoc → tsup re-emits dts → docgen re-emits `llms.txt` → docs props table + previews update. One source of truth (the TS interface), three consumers (bundler, docgen, docs).
3. **A11y/behavior change:** edit `internal/` hooks → all overlay components (Dialog/Drawer/CommandPalette) inherit the fix → smoke/axe tests in `packages/react` verify before anything downstream builds.

## Build Order (dependency-driven)

This is the order that minimizes rework. Each stage is a valid stopping point with everything below it stable.

```
Stage 0  Repo scaffold: pnpm-workspace.yaml, tsconfig.base.json, changesets,
         CI skeleton, licenses/governance files
             │  (nothing depends on code yet; everything depends on this)
Stage 1  packages/styles: tokens/ first, then components/*.css, then styles.css entry
             │  (zero dependencies; pure copy+verify from handoff; unblocks
             │   visual verification of everything later)
Stage 2  packages/react infra: tsup config, vitest+vitest-axe setup, internal/ hooks
         (portal, focus trap, SSR guards), + 2-3 pilot components (Button, Input, Dialog)
             │  (pilot set spans the hard cases: simple, form, overlay —
             │   locks conventions before 40× repetition)
Stage 3  Remaining ~37 components in dependency order within the package:
         primitives (Icon first — everything uses it) → forms/display →
         composites (Combobox, Dropdown) → overlays (Drawer, CommandPalette,
         Toast) → app-level (FileManager, WorkspaceSwitcher, Table)
             │  smoke + axe tests land WITH each component, not after
Stage 4  tools/docgen: ts-morph script → llms.txt (validate against handoff/llms.txt
         format); registry.json generator stubbed but not shipped
             │  (needs stable TS interfaces from Stage 2-3)
Stage 5  apps/docs: framework setup + i18n routing → component MDX pages
         (from .prompt.md + docgen data) → live previews → landing →
         /llms.txt served from public/
             │  (needs published-shape packages + docgen output)
Stage 6  Release pipeline: changesets versioning, npm publish dry-run,
         GitHub Actions publish flow, Vercel deploy
```

**Why this order:**
- **Styles before React** — React components are unverifiable without the CSS they target; the class contract is written in the CSS first.
- **Pilot components before the batch of 40** — conventions (file layout, prop patterns, test template, JSDoc style for docgen) must be locked on 3 components; changing conventions at component #30 is the biggest rework risk in this project.
- **Icon before everything in Stage 3** — it's a dependency of most other components and carries the CDN-removal decision (lucide-react vs bundled SVGs), which affects the react package's dependency graph and bundle story.
- **Docgen before docs content** — MDX props tables and llms.txt should come from the same parse; writing docs pages first means hand-writing tables that docgen later replaces (rework).
- **Docs last among code stages** — it consumes everything; building it earlier means rebuilding pages as APIs settle. But scaffold the docs framework (Stage 5 start) as early as Stage 2 finishes if the stack decision needs de-risking.

**Where tests sit:** smoke + axe infrastructure is Stage 2 (before the component batch), individual tests land with each component in Stage 3, and CI runs them on source (`vitest`) before `tsup` build — the pipeline per PR is `lint → typecheck → test (packages/react) → build (styles noop/validate, react tsup) → docgen → docs build`. Topological ordering comes free from pnpm (`pnpm -r --workspace-concurrency` respects the graph) or Turborepo if task caching is wanted; at 3 packages + 1 tool, plain `pnpm -r run build` with correct `dependencies` is sufficient — **Turborepo is optional, not required**.

**TS project references: skip them.** Research is consistent that references pay off in large graphs and add config footguns (`references` not inherited via `extends`, must mirror `dependencies` manually) in small ones. This monorepo has one TS library package, one tool, one app — a shared `tsconfig.base.json` + per-package `tsconfig.json` + workspace linking is the right complexity level. Revisit only if adapter packages (Vue/Svelte/WC) multiply the graph in phase 2.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| v0.1.0 (2 packages + docs) | Plain pnpm scripts, no task runner, no project refs. Changesets `linked` mode for styles+react if class contract changes should version-bump together |
| Phase 2 (adapters + registry) | Add `packages/vue`, `packages/svelte` etc. binding to the same `.lyra-*` contract; `tools/docgen` grows `registry.json` output; consider Turborepo for task caching once >5 packages; consider per-component CSS files in styles for registry consumption |
| Many contributors | Promote shared configs into `packages/config-*` (eslint/tsconfig) packages; add visual regression (Chromatic/Playwright) on top of smoke+axe |

### Scaling Priorities

1. **First bottleneck: CI wall time** as component tests grow — fix with test sharding/Turborepo caching, not restructuring.
2. **Second bottleneck: class-contract drift across adapters** (phase 2) — fix by generating a machine-readable class/state inventory from the CSS (extend docgen), making the string contract testable per adapter.

## Anti-Patterns

### Anti-Pattern 1: React package imports the CSS

**What people do:** `import '@lyra-ds/styles/styles.css'` inside component files "so it works out of the box."
**Why it's wrong:** breaks `sideEffects: false` (bundlers must keep the import), couples the packages' versions, breaks RSC/SSR setups that handle CSS differently, and undermines the multi-framework story.
**Do this instead:** consumer imports CSS once at app root; docs and README make this the first install step. Keep the two packages import-free of each other.

### Anti-Pattern 2: Appearance leaking into the React layer

**What people do:** inline styles for variants, style props, CSS-in-JS for "just this one dynamic bit," or JS-computed colors for white-label.
**Why it's wrong:** every leaked pixel is invisible to future Vue/Svelte adapters and to the theming attribute cascade; it also breaks pixel-fidelity auditing against `handoff/`.
**Do this instead:** dynamic values flow through CSS custom properties set as inline `style={{ '--progress-value': … }}` only where the handoff CSS already reads a var; everything else is classes + data attributes.

### Anti-Pattern 3: Writing 40 components before locking conventions

**What people do:** batch-convert all handoff `.jsx` files immediately since "the reference code exists."
**Why it's wrong:** the mandatory conversion fixes (portals, focus trap, SSR guards, controlled/uncontrolled props for FileUpload) define patterns that all overlay/form components must share. Discovering the right pattern at component #25 forces a sweep back through 24 files.
**Do this instead:** pilot trio (Button, Input, Dialog) + `internal/` hooks first; write a short CONVENTIONS note; then batch.

### Anti-Pattern 4: Hand-maintained props docs and llms.txt

**What people do:** copy prop tables into MDX and edit llms.txt by hand "just for v0.1."
**Why it's wrong:** 40 components × 2 locales × every API change = guaranteed drift; llms.txt correctness is a headline feature of this project.
**Do this instead:** docgen (ts-morph) is the single parse; MDX embeds its output (component or data file); llms.txt is a build artifact, gitignored or generated-committed but never edited.

### Anti-Pattern 5: Deviating from handoff class/selector shapes "to modernize"

**What people do:** rename `.lyra-btn--primary`-style classes, switch state hooks from what the handoff CSS uses to a different convention (e.g., replacing `.is-open` with `[data-state]`) during conversion.
**Why it's wrong:** the handoff CSS is already written against specific selectors; renaming means rewriting verified pixel-perfect CSS and breaks the "classes are the shared public API" contract.
**Do this instead:** treat handoff selectors as frozen API. Improvements go through a deliberate contract change with both packages updated together.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| npm registry | changesets → GitHub Actions publish (`changesets/action`) | `@lyra-ds` scope; provenance + `--access public`; dry-run in CI before first real publish |
| Vercel | docs app auto-deploy + PR previews | Build command must run package builds + docgen before docs build (root-level build script or Vercel `buildCommand` with `pnpm -r`) |
| GitHub Actions | PR: lint→typecheck→test→build→docs build; main: + changesets release | Single workflow; pnpm cache; docs preview via Vercel, not Actions |
| Fonts (@fontsource) | peer/documented dependency, not bundled | tokens/fonts.css references family names; docs app installs @fontsource packages itself |
| lucide (icons) | `lucide-react` as dependency of packages/react (or build-time SVG embed) | Kills the CDN dependency; decision lands in Stage 2/3 with the Icon component |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| styles ↔ react | `.lyra-*` class names + `data-*`/`aria-*` state + CSS vars (string contract, no imports) | The load-bearing boundary of the whole system; document it explicitly; smoke tests assert class emission |
| react → docgen | TS interfaces + JSDoc parsed by ts-morph | JSDoc conventions from handoff `.d.ts` must be preserved in `.tsx`; docgen fails CI if a component lacks a doc block |
| docgen → docs | Generated files (`llms.txt`, per-component JSON) into `apps/docs/public` / data dir | One-way; docs never edits generated output |
| packages → docs | `workspace:*` deps; docs imports built dist in CI | Docs is the packaging integration test (exports map, SSR, dts) |
| handoff/ → everything | Read-only reference; humans + review diff against it | Nothing imports from handoff; fidelity checks are manual/review-time in v0.1 (no visual regression yet) |

## Sources

- pnpm workspaces — [pnpm.io/workspaces](https://pnpm.io/workspaces) (HIGH — official docs)
- Monorepo structure & build ordering — [Nx blog: pnpm workspaces](https://nx.dev/blog/setup-a-monorepo-with-pnpm-workspaces-and-speed-it-up-with-nx), [Ish Chhabra: pnpm monorepo the right way](https://www.ishchhabra.com/writing/pnpm-monorepo), [Turborepo+changesets architecture](https://dev.to/yasinatesim/monorepo-architecture-with-pnpm-workspace-turborepo-changesets-g0j) (MEDIUM — cross-checked)
- tsup entries/formats/dts — Context7 `/egoist/tsup` official docs (MEDIUM-HIGH)
- TS project references trade-offs — [colinhacks: Live types in a TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo), [Nx: Managing TS packages in monorepos](https://nx.dev/blog/managing-ts-packages-in-monorepos) (MEDIUM — consistent across sources)
- a11y test infrastructure — [vitest-axe](https://github.com/chaance/vitest-axe), [jest-axe](https://github.com/NickColley/jest-axe) (MEDIUM)
- Docgen patterns — [ts-morph TypeScript docs generation](https://souporserious.com/generate-typescript-docs-using-ts-morph/), [react-docgen-typescript](https://www.npmjs.com/package/react-docgen-typescript) (MEDIUM)
- Docs frameworks / i18n / previews landscape — [Starlight](https://starlight.astro.build/), [Starlight vs Docusaurus](https://blog.logrocket.com/starlight-vs-docusaurus-building-documentation/), [Fumadocs vs Nextra vs Starlight 2026](https://www.pkgpulse.com/guides/fumadocs-vs-nextra-v4-vs-starlight-documentation-sites-2026) (LOW-MEDIUM — final choice is a STACK decision, architecture here is framework-agnostic)
- Project constraints & contract — `handoff/design_handoff_lyra_lib/README.md`, `.planning/PROJECT.md` (HIGH — canonical project sources)

---
*Architecture research for: CSS-first white-label design system monorepo (Lyra DS)*
*Researched: 2026-07-16*
