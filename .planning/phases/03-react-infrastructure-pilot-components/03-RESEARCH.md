# Phase 3: React Infrastructure & Pilot Components - Research

**Researched:** 2026-07-18
**Domain:** React component-library packaging (tsup dual ESM+CJS), curated icon registry (lucide-react 1.x), Vitest 4 multi-project testing, npm package-quality gates (publint/attw/size-limit)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Icon API & curated registry
- **D-01:** **Registry = exactly the 54 Lucide icons used in the handoff** (scan of `handoff/components/**` + `handoff/ui_kits/**`). Smallest possible surface; Phase 4 never hits a missing icon.
- **D-02:** **Registry is generated + committed + CI-guarded.** A script in `tools/` scans the handoff and generates `icon-registry.ts` (static `lucide-react` imports + name union). The generated file is committed; CI fails if it drifts from the handoff scan — same pattern as the Phase 2 parity script.
- **D-03:** **Escape hatch = `icon` prop accepting a Lucide component directly** (`<Icon icon={Rocket} />`). Consumer imports from `lucide-react`; their bundler tree-shakes it. No global registration API, no cost to our bundle.
- **D-04:** **`name` is typed as a literal union of the 54** (`IconName`), generated alongside the registry. Editor autocomplete + compile-time error for out-of-registry names. Refines (doesn't break) the handoff `name: string` contract.
- **D-05:** **Unknown `name` at runtime → `console.warn` in dev (pointing at the `icon` escape hatch) + render `null`.** Silent in production; never breaks consumer UI.
- **D-06:** **Icon renders inline `<svg>` via lucide-react** (class `.lyra-icon`, `currentColor`, size via props). The prototype's `<span>` + CSS mask was a CDN workaround — drop it, keeping visual fidelity (size/color identical).
- **D-07:** **size-limit budgets are per-minimal-import:** measure the cost of importing only `Button` and only `Icon` in a bundled app; tight limits calibrated at execution with ~20% headroom. Proves both RCT-03 (isolation) and RCT-05 (no ~1,400-icon set in bundle).

#### Wrapper API conventions (the Phase 4 pattern)
- **D-08:** **`forwardRef` on every component that renders a DOM element**, ref pointing at the primary element. Only pattern safe across the `react >=18 <20` peer range.
- **D-09:** **Always merge consumer `className`/`style`:** `.lyra-*` classes always present, consumer `className` appended after; `style` shallow-merged over component inline styles. The `.lyra-*` classes are public API and can never be replaced.
- **D-10:** **Rest-spread convention:** known props extracted, `...rest` spread onto the root element (the one the `.d.ts` extends). Predictable pass-through for `aria-*`, `data-*`, handlers.
- **D-11:** **Zero runtime deps beyond `lucide-react`:** tiny internal `cx()` helper in `internal/` instead of clsx.
- **D-12:** **Named exports only** — no default exports anywhere (matches the handoff `export declare function` contracts).
- **D-13:** **Import surface = root barrel + per-component subpaths** (`@lyra-ds/react` and `@lyra-ds/react/button`). Subpaths guarantee isolation even with naive bundlers — direct proof of RCT-03. Exports map scales to 40 entries in Phase 4.
- **D-14:** **Controlled/uncontrolled contract:** `value`/`defaultValue` + `onChange` via a `useControllableState` helper in `internal/` (controlled when `value !== undefined`). Locks the RCT-09 pattern now via the Input pilot.

#### Dialog behavior (overlay contract pilot)
- **D-15:** **`div` + `role="dialog"` + `aria-modal="true"`** keeping the prototype DOM (`.lyra-dialog-overlay > .lyra-dialog`), with our own focus trap in `internal/`. Native `<dialog>` rejected (fights the handoff overlay CSS; inconsistent focus behavior).
- **D-16:** **Close paths: Esc + overlay click + × button, each guarded by opt-out flags** `closeOnEsc` / `closeOnOverlayClick` (default `true`). Extends the handoff contract deliberately (user choice over the minimal-contract recommendation).
- **D-17:** **Exit animation: keep mounted while closing** via a presence helper (`usePresence`) in `internal/` that waits for the transition before unmounting. Drawer/Toast reuse this in Phase 4. (User choice over the immediate-unmount recommendation.)
- **D-18:** **Exit-animation CSS lives in `@lyra-ds/styles` as a documented additive extension** (e.g., `.lyra-dialog--closing`, reverse of the entry transform). The Phase 2 parity script must be adjusted to allow documented additive extensions (handoff ⊆ package — handoff declarations still match exactly; additions are explicitly listed). Entry-animation constraint still holds (transform only, never `opacity: 0` at frame start).
- **D-19:** **Close button gets its own additive class `.lyra-dialog__close`** (same visual as the prototype's borrowed `.lyra-tag__remove` + inline style: 28px hit area, 14px icon). No inline styles, no borrowed Tag class.
- **D-20:** **Initial focus: first focusable element in the panel, fallback to the panel itself** (`tabIndex={-1}`); title wired via `aria-labelledby` + `useId`. APG pattern.
- **D-21:** **Portal target: optional `container?: HTMLElement` prop, default `document.body`** with SSR guard. (User choice over fixed-target recommendation — flexibility for shadow DOM/iframes.)
- **D-22:** **Scroll lock while open:** `useScrollLock` in `internal/` with scrollbar-width compensation.

#### Conventions note & test template
- **D-23:** **Conventions note lives at `packages/react/CONVENTIONS.md`** (EN, versioned with the code, linked from CONTRIBUTING.md).
- **D-24:** **Format: actionable conversion checklist** (read `.d.ts` → forwardRef → cx + merge → rest-spread → JSDoc EN → test matrix → gates) plus a short table of locked decisions with rationale. Phase 4 executes it as a recipe.
- **D-25:** **The four pilots' real tests ARE the template.** Button (simple), Input (form/controlled), Dialog (overlay/focus/portal), Icon (registry). CONVENTIONS.md maps component type → which pilot test to copy. No dead template file.
- **D-26:** **SSR tests run in a separate Vitest node project** (`environment: node`) exercising `renderToString` — proves no module-scope DOM access. Browser Mode stays for smoke/keyboard/axe.
- **D-27:** **Scratch-app validation via committed CI fixtures** (e.g., `tools/smoke/vite-app`, `tools/smoke/next-app`) that install the `pnpm pack` tarball and build in CI — direct extension of the Phase 2 packed-artifact smoke test. Reproducible locally.
- **D-28:** **File layout: folder per component, co-located tests** — `src/button/{button.tsx, button.browser.test.tsx, button.ssr.test.ts}`. Entries per folder match the subpath exports; scales to 40 in Phase 4.

### Claude's Discretion
- Exact size-limit numbers (calibrate at execution, ~20% headroom per D-07)
- tsup config details (entry globbing, dts strategy, target), attw config, exports-map mechanics
- Focus-trap/presence/scroll-lock implementation details (follow APG; internal API shapes)
- Registry/scan script mechanics and where the additive-extensions allowlist lives in the parity script
- axe/light+dark matrix details (follow Phase 2's Browser Mode patterns)
- Next.js scratch-app minimal shape (App Router page importing the pilots; SSR render is the point)

### Deferred Ideas (OUT OF SCOPE)
- **Expanded curated icon set (~100–150)** — revisit if consumers frequently need icons outside the handoff 54 (the `icon` prop escape hatch covers the gap meanwhile)
- **Global icon registration API** (`registerIcons`) — rejected for v0.1.0 (global state); reconsider only with real demand
- **Placeholder glyph for unknown icon names** — rejected in favor of dev-warn + null
- **Exit animations for other overlays (Drawer, Toast, CommandPalette)** — the `usePresence` + additive-CSS pattern from D-17/D-18 is the template; actual CSS lands with each component in Phase 4
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RCT-03 | Importing one component doesn't pull the others (one file per component, `sideEffects: false`, zero CSS imports in the react package — CI-verified rule) | Per-component tsup entries + subpath exports map (Pattern 1/2); `sideEffects: false` safe because CSS lives only in `@lyra-ds/styles` (Pitfall 1 of PITFALLS.md, re-verified); size-limit `import: "{ Button }"` entry proves isolation; ESLint `no-restricted-imports` + CI grep bans CSS imports |
| RCT-04 | Dual ESM+CJS build with types (tsup) validated by publint + attw and tested in scratch Vite and Next.js apps | tsup 8.5.1 config verified (Pattern 1); split-types exports map avoiding FalseCJS/FalseESM (Pattern 2); attw 0.18.5 `--pack` usage + problem kinds verified via Context7; committed fixture mechanics extend the shipped `tools/pack-smoke` pattern (Pattern 6) |
| RCT-05 | Icon renders Lucide from a local dependency via curated registry (no CDN), size-limit CI gate proves ~1,400-icon set not bundled | lucide-react 1.25.0 verified by real local install: 53/54 handoff icons exist as PascalCase named exports; **`Github` was removed in lucide 1.0** → vendor it via `createLucideIcon` with ISC path data from lucide-static 0.469.0 (Pattern 3, Pitfall 1); size-limit `{ Icon }` entry must NOT ignore `lucide-react` (Pattern 4) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

Directives extracted from `./.claude/CLAUDE.md` that bind this phase:

- **CSS-first, React is a thin wrapper** — zero visual decisions in the react package; appearance 100% via `.lyra-*` classes (locked)
- **No Tailwind anywhere in packages** (locked)
- **No runtime CDN dependency** — Icon must embed Lucide locally (locked; the entire point of RCT-05)
- **Fonts as peer `@fontsource/*`** — never bundled
- **Stack pins:** pnpm 11.13.1 (`packageManager`), TypeScript **5.9.3 pinned — do not float to TS 7/tsgo**, tsup 8.5.1 (locked; unmaintained caveat known, tsdown is the post-v0.1.0 escape hatch), peerDeps `react >=18`
- **`sideEffects: false` is safe ONLY on the react package** (CSS lives in `@lyra-ds/styles` with `"sideEffects": ["**/*.css"]`); never import CSS from react source
- **Icon maps Lucide via a static name→component map** — a dynamic `require(name)`/barrel-object pattern pulls all ~1,500 icons
- **Per-component entries + `sideEffects: false`** is the mandated tree-shaking recipe
- **Vitest Browser Mode (chromium via @vitest/browser-playwright) for component tests**; `vitest-axe` is stale — call `axe-core` directly
- **GSD workflow enforcement** — file changes ride GSD commands
- Repo conventions from Phases 1–2: engines `>=24 <25`, `save-exact=true`, tools pinned via `pnpm exec`, conventional commits, CI gates land as **steps inside the four frozen jobs** (lint/typecheck/test/build) — never new job names

## Summary

Phase 3 turns the placeholder `packages/react` into a real dual-format library with four pilot components, and proves the machinery (build, gates, scratch-app installs, test template) that Phase 4 will repeat 36 times. The stack is almost fully locked by prior decisions; research therefore focused on *verifying the exact mechanics* — and it surfaced one genuinely plan-changing fact: **lucide 1.0 (June 2026) removed all brand icons, and the handoff's 54-icon set includes `github`** (used across the ui_kits, e.g. the docs-site header). Verified against a real install of lucide-react 1.25.0: the other 53 icons all exist as PascalCase named exports; `Github` does not. The fix that preserves both the no-new-deps constraint (D-11) and pixel fidelity is to **vendor the GitHub icon node inside the generated registry via `createLucideIcon('github', ...)`**, using the ISC-licensed path data from `lucide-static@0.469.0` — the exact version the prototype pinned, so the rendered glyph is identical.

Second verified correction to older assumptions: lucide-react 1.x ships **no `exports` map** (only `main`/`module`), so the `lucide-react/icons/x` deep-import pattern mentioned in earlier project research no longer exists. The 1.x pattern is plain named barrel imports — safe because the package is pure ESM with `sideEffects: false`, and because `@lyra-ds/react` externalizes `lucide-react` (it's a `dependency`, tsup externalizes it by default), tree-shaking happens in the consumer's bundler. The size-limit gate (with `lucide-react` deliberately NOT in `ignore` for the Icon entry) is what proves this end-to-end.

Everything else is confirmation and mechanics: tsup 8.5.1 multi-entry object config with `format: ['esm','cjs']` + `dts: true` emits per-format declarations; the exports map must use per-condition `types` (`.d.ts` for import, `.d.cts` for require) or attw flags FalseESM/FalseCJS masquerading; `'use client'` needs a `banner` (belt) plus a dist-grep gate (suspenders); Vitest 4's `test.projects` cleanly hosts the browser-mode project and the node SSR project side by side; and the committed-fixture smoke pattern from Phase 2's `tools/pack-smoke` extends directly to Vite + Next.js fixtures — with the one change that the react tarball has real dependencies, so fixtures need a real `npm install` of the tarball rather than a bare tar-extract.

**Primary recommendation:** Build the icon registry generator FIRST (it must handle the vendored `github` icon and scope its scan to `<Icon name="..."` — a naive `name="..."` grep picks up `<meta name="viewport">` and form-input `name` attributes; verified: 56 raw matches vs 54 scoped), then the tsup/exports/gates skeleton, then the pilots in order Button → Icon → Input → Dialog.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Visual appearance (colors, spacing, states, animation) | `@lyra-ds/styles` (CSS package, shipped) | — | Locked CSS-first architecture; react emits class names only |
| Component behavior (focus trap, controlled state, portal, presence) | `@lyra-ds/react` runtime (client) | — | Interactive primitives; all four pilots are client components in RSC terms |
| Server rendering safety | `@lyra-ds/react` (SSR-guarded code) | Consumer framework (Next.js) | `renderToString` must not crash; portal renders `null` pre-mount; `'use client'` in dist makes Next treat components correctly |
| Build & packaging (dual format, types, entries) | tsup + package.json exports map | CI gates (publint/attw) | Library-side responsibility; consumer bundlers rely on correct metadata |
| Tree-shaking / bundle isolation | Consumer's bundler | Library metadata (`sideEffects: false`, per-entry files, ESM) | The library can only *enable* shaking; size-limit simulates the consumer side in CI |
| Icon glyph set | `lucide-react` dependency (+1 vendored icon in registry) | — | No CDN; registry statically imports 53 + vendors `github` |
| Quality gates (publint, attw, size-limit, registry drift, CSS-import ban) | GitHub Actions CI (steps in 4 frozen jobs) | Local scripts (reproducible) | Established Phase 1–2 pattern |
| Exit-animation CSS (`.lyra-dialog--closing`, `.lyra-dialog__close`) | `@lyra-ds/styles` (additive extension) | parity script allowlist | D-18/D-19: additions live in the CSS package, enumerated in the parity allowlist |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tsup | 8.5.1 (already locked) | Dual ESM+CJS build + `.d.ts`/`.d.cts` | Locked decision; verified current on npm `[VERIFIED: npm registry]` |
| typescript | 5.9.3 (already pinned, root devDep) | Types, `tsc --noEmit` typecheck | Locked pin; TS 7/tsgo not validated with tsup |
| react / react-dom | 19.2.7 devDeps; peer `>=18 <20` | Dev/test runtime; published peer range | Locked peer policy; 19.2.7 latest `[VERIFIED: npm registry]` |
| @types/react / @types/react-dom | 19.2.17 / 19.2.3 | JSX + DOM types | Latest for React 19 line `[VERIFIED: npm registry]` |
| lucide-react | 1.25.0 (runtime `dependency` of @lyra-ds/react) | Icon components | Only permitted runtime dep (D-11). 1.25.0 latest, published 2026-07-17; peer `react ^16.5.1‖^17‖^18‖^19` fits `>=18` `[VERIFIED: npm registry + local install]`. Note: UI-SPEC says 1.24.0 — pin whatever is latest at execution; both are post-brand-removal 1.x |
| vitest + @vitest/browser-playwright + playwright | 4.1.10 / 4.1.10 / 1.61.1 (already root devDeps) | Test runner, browser mode | Already shipped in Phase 2 harness |
| vitest-browser-react | 2.2.0 | `render()` + locators for React in Browser Mode | Peers: react ^18‖^19, vitest ^4 — all satisfied `[VERIFIED: npm registry]` |
| axe-core | 4.12.1 | a11y assertions in Browser Mode | Called directly (vitest-axe is stale) `[VERIFIED: npm registry]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| publint | 0.3.21 (already root devDep) | Exports-map lint | Extend existing build-job step to also cover packages/react |
| @arethetypeswrong/cli | 0.18.5 | Type-resolution validation (`attw --pack`) | New build-job step; engines node>=20 OK `[VERIFIED: npm registry]` |
| size-limit + @size-limit/preset-small-lib | 12.1.0 / 12.1.0 | Per-import bundle budgets (RCT-03/RCT-05 gate) | New build-job step; esbuild-based, size-only preset; engines OK for node 24 `[VERIFIED: npm registry]` |
| eslint + typescript-eslint + eslint-plugin-jsx-a11y + eslint-plugin-react-hooks | 10.7.0 / 8.64.0 / 6.10.2 / 7.1.1 | React-package lint: static a11y + hooks rules + **CSS-import ban** (`no-restricted-imports`) | Lint-job step for packages/react; flat config `[VERIFIED: npm registry]` |
| next | 16.2.10 | Scratch Next.js fixture (D-27) — devDep of the fixture only, never of the packages | `next build` in the smoke fixture proves SSR + `'use client'` end to end `[VERIFIED: npm registry]` |
| @vitejs/plugin-react | 6.0.3 | Scratch Vite fixture with JSX | Vite fixture build `[VERIFIED: npm registry]` |
| vite | 8.1.5 (already root devDep) | Vite fixture build | Reuse the monorepo's pinned binary like pack-smoke does |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vendored `createLucideIcon('github', …)` in the registry | `simple-icons` dependency | Breaks D-11 (zero deps beyond lucide-react); overkill for one icon |
| Vendored github icon | Drop `github` from the registry | Breaks handoff fidelity — ui_kits (docs-site header) use it; Phase 4/6 would hit a missing icon |
| ESLint flat config for the CSS-import ban | Zero-dep Node grep script in `tools/` (parity-script style) | Script is lighter, but ESLint also delivers jsx-a11y + hooks rules that Phase 4 needs anyway; recommend ESLint now, grep as CI belt-and-suspenders is optional |
| `banner: { js: '"use client";' }` on all outputs | Per-file source directives (esbuild ≥0.21.4 preserves entry directives) | Banner is deterministic across esbuild versions & chunks; per-file is finer-grained but fragile under code-splitting. Use banner + a dist-grep verification step |
| npm install of the packed tarball in fixtures | Bare tar-extract (Phase 2 pack-smoke approach) | Extract worked for styles (zero deps). The react tarball has a real dependency (lucide-react), so fixtures need a real install (`npm install <tgz>` in a temp dir) to materialize `node_modules` |
| Package-level `packages/react/vitest.config.ts` with `test.projects` | Root-level vitest.config with projects for all packages | Package-level keeps the shipped Phase 2 styles harness untouched and the root `pnpm -r --if-present run test` recursion working unchanged; CONTEXT's "root vitest.config gains projects" wording is satisfied either way — planner picks (see Open Questions) |

**Installation:**

```bash
# root devDeps (workspace tooling; save-exact is already on)
pnpm add -D -w @arethetypeswrong/cli@0.18.5 size-limit@12.1.0 @size-limit/preset-small-lib@12.1.0 \
  eslint@10.7.0 typescript-eslint@8.64.0 eslint-plugin-jsx-a11y@6.10.2 eslint-plugin-react-hooks@7.1.1 \
  vitest-browser-react@2.2.0 axe-core@4.12.1 react@19.2.7 react-dom@19.2.7 \
  @types/react@19.2.17 @types/react-dom@19.2.3 tsup@8.5.1

# packages/react runtime dep (the ONLY one, D-11)
pnpm --filter @lyra-ds/react add lucide-react@1.25.0

# fixtures (committed package.json files; installed only inside the smoke script's temp dir)
# tools/smoke/next-app: next@16.2.10 react@19.2.7 react-dom@19.2.7
# tools/smoke/vite-app: vite (pinned binary reused) + @vitejs/plugin-react@6.0.3 + typescript
```

**Version verification:** all versions above confirmed via `npm view <pkg> version` on 2026-07-18.

## Package Legitimacy Audit

Seam: `gsd-tools query package-legitimacy check --ecosystem npm …` (run 2026-07-18).

| Package | Registry | Latest publish | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| tsup | npm | 2025-11 | 6.5M/wk | github.com/egoist/tsup | OK | Approved |
| size-limit | npm | 2026-04 | 1.0M/wk | github.com/ai/size-limit | OK | Approved |
| @size-limit/preset-small-lib | npm | 2026-04 | 139K/wk | github.com/ai/size-limit | OK | Approved |
| @arethetypeswrong/cli | npm | 2026-07-09 | 440K/wk | github.com/arethetypeswrong/arethetypeswrong.github.io | SUS (too-new) | Flagged — see note |
| lucide-react | npm | 2026-07-17 | 85M/wk | github.com/lucide-icons/lucide | SUS (too-new) | Flagged — see note |
| react / react-dom | npm | 2026-06 | 145M / 137M/wk | github.com/facebook/react | OK | Approved |
| @types/react / @types/react-dom | npm | 2026-06 / 2025-11 | 128M / 104M/wk | DefinitelyTyped | OK | Approved |
| next | npm | 2026-07-01 | 42M/wk | github.com/vercel/next.js | SUS (too-new) | Flagged — see note |
| vitest-browser-react | npm | 2026-04 | 1.1M/wk | github.com/vitest-community/vitest-browser-react | OK | Approved |
| axe-core | npm | 2026-06 | 53M/wk | github.com/dequelabs/axe-core | OK | Approved |
| @vitejs/plugin-react | npm | 2026-06 | 68M/wk | github.com/vitejs/vite-plugin-react | SUS (too-new) | Flagged — see note |
| eslint | npm | 2026-07-10 | 134M/wk | github.com/eslint/eslint | SUS (too-new) | Flagged — see note |
| typescript-eslint | npm | 2026-07-13 | 74M/wk | github.com/typescript-eslint/typescript-eslint | SUS (too-new) | Flagged — see note |
| eslint-plugin-jsx-a11y | npm | 2024-10 | 37M/wk | github.com/jsx-eslint/eslint-plugin-jsx-a11y | OK | Approved |
| eslint-plugin-react-hooks | npm | 2026-04 | 83M/wk | github.com/facebook/react | OK | Approved |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** @arethetypeswrong/cli, lucide-react, next, @vitejs/plugin-react, eslint, typescript-eslint — **all six SUS verdicts are triggered solely by the "too-new" signal on the latest release date** (published within the last ~30 days). Every one has the canonical org repo URL and between 440K and 134M weekly downloads; none has a postinstall script; none is deprecated. Interpretation: these are routine fresh releases of foundational packages, not slopsquats. The planner should still honor protocol with a single grouped `checkpoint:human-verify` before the install task (verify the six names/versions against the table above), rather than six separate checkpoints.

## Architecture Patterns

### System Architecture Diagram

```
                       BUILD & GATE PIPELINE (RCT-03/04/05)
┌──────────────────────────────────────────────────────────────────────────┐
│  handoff/components/** ──scan──> tools/icon-registry/generate.mjs        │
│      (`<Icon name="…"` only)         │                                   │
│                                      ▼ (generated + committed)           │
│  packages/react/src/                 src/icon/icon-registry.ts           │
│   ├─ index.ts (barrel)               (53 lucide imports + vendored       │
│   ├─ button/  input/  dialog/         github via createLucideIcon        │
│   ├─ icon/                            + IconName union)                  │
│   └─ internal/ (cx, useControllableState, useFocusTrap,                  │
│       usePresence, useScrollLock, Portal+SSR guard)                      │
│            │                                                             │
│            ▼  tsup (entry per component, esm+cjs, dts, banner            │
│               '"use client";', external: react/react-dom;                │
│               lucide-react externalized as dependency)                   │
│            ▼                                                             │
│  dist/{index,button,input,dialog,icon}.{js,cjs,d.ts,d.cts}               │
│            │                                                             │
│    ┌───────┼──────────────┬───────────────────┬─────────────────┐        │
│    ▼       ▼              ▼                   ▼                 ▼        │
│  publint  attw --pack   size-limit         dist greps        pnpm pack   │
│  (exports (FalseCJS/    ({Button} tiny;    ('use client'        │        │
│   map)     ESM, types)   {Icon} excludes    present; no         ▼        │
│                          1,400-icon set)    unpkg/CDN)   tools/smoke:    │
│                                                          vite-app +      │
│                                                          next-app        │
│                                                          npm i <tgz>,    │
│                                                          tsc --noEmit,   │
│                                                          build (SSR)     │
└──────────────────────────────────────────────────────────────────────────┘

                       TEST PIPELINE (template for Phase 4)
┌──────────────────────────────────────────────────────────────────────────┐
│  vitest projects (packages/react):                                       │
│   • "browser" project — chromium via @vitest/browser-playwright          │
│       *.browser.test.tsx: smoke (all variants × light/dark),             │
│       keyboard (Dialog trap/Esc/restore), axe.run() per fixture          │
│       (imports @lyra-ds/styles CSS *in the test* — never in src)         │
│   • "ssr" project — environment: node                                    │
│       *.ssr.test.ts: renderToString(<Pilot/>) — no module-scope DOM      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
packages/react/
├── package.json          # exports map (root + 4 subpaths), sideEffects:false, files:["dist"]
├── tsconfig.json         # jsx: react-jsx, moduleResolution: bundler, strict
├── tsup.config.ts
├── CONVENTIONS.md        # D-23/D-24 conversion checklist (EN)
├── vitest.config.ts      # test.projects: browser + ssr (see Open Question 1)
└── src/
    ├── index.ts          # barrel: export { Button } from './button' … (named only, D-12)
    ├── internal/         # NOT exported in the exports map — private by construction
    │   ├── cx.ts
    │   ├── use-controllable-state.ts
    │   ├── use-focus-trap.ts
    │   ├── use-presence.ts
    │   ├── use-scroll-lock.ts
    │   └── portal.tsx    # SSR-guarded createPortal wrapper
    ├── button/
    │   ├── index.ts      # export { Button } + types
    │   ├── button.tsx
    │   ├── button.browser.test.tsx
    │   └── button.ssr.test.ts
    ├── input/  …         # same shape (D-28)
    ├── dialog/ …
    └── icon/
        ├── index.ts
        ├── icon.tsx
        ├── icon-registry.ts   # GENERATED + COMMITTED (D-02)
        └── …tests
tools/
├── icon-registry/generate.mjs   # scan + emit + --check drift mode (CI)
└── smoke/
    ├── vite-app/    # committed fixture: TS + @vitejs/plugin-react, imports pilots
    └── next-app/    # committed fixture: App Router page importing pilots
```

### Pattern 1: tsup config — per-component entries, dual format, directive banner

```ts
// tsup.config.ts — verified against tsup 8.5.1 docs [CITED: github.com/egoist/tsup docs/README.md]
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    button: 'src/button/index.ts',
    input: 'src/input/index.ts',
    dialog: 'src/dialog/index.ts',
    icon: 'src/icon/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,               // emits .d.ts (esm) + .d.cts (cjs) per entry
  target: 'es2022',
  sourcemap: true,
  clean: true,
  treeshake: true,         // rollup pass; belt-and-suspenders on top of per-entry files
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // lucide-react is a `dependency` → tsup externalizes it automatically; do NOT bundle it
  banner: { js: '"use client";' },
});
```

Notes (verified via Context7 `/egoist/tsup` + source):
- Object-form `entry` keys control dist filenames → `dist/button.js` / `dist/button.cjs` matches the `./button` subpath (D-13).
- With `"type": "module"` in package.json, ESM output is `.js` and CJS is `.cjs`.
- `splitting` defaults to `true` for ESM only — shared chunks for `internal/` utilities are fine (the banner is applied to every output file, and chunks contain only shared internals, never other components).
- `banner.js` puts `"use client";` at the top of every output file. Harmless in CJS and in non-RSC bundlers; required for Next.js App Router consumers (bundlers strip source directives unpredictably — the banner is deterministic). A CI grep (`head -1 dist/*.js`) verifies it survived.

### Pattern 2: exports map that passes attw (dual types, no masquerading)

attw's FalseCJS/FalseESM problems are caused by sharing one `.d.ts` between `import` and `require` [CITED: github.com/arethetypeswrong/arethetypeswrong.github.io/docs/problems/FalseCJS.md]. Split types per condition:

```jsonc
// packages/react/package.json (shape — planner fills remaining fields)
{
  "name": "@lyra-ds/react",
  "type": "module",
  "sideEffects": false,
  "files": ["dist", "README.md", "LICENSE"],
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.cts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./button": {
      "import": { "types": "./dist/button.d.ts", "default": "./dist/button.js" },
      "require": { "types": "./dist/button.d.cts", "default": "./dist/button.cjs" }
    },
    // …input, dialog, icon (Phase 4 scales this to 40 — consider generating)
    "./package.json": "./package.json"
  },
  "peerDependencies": {
    "react": ">=18 <20",
    "react-dom": ">=18 <20"
  },
  "dependencies": { "lucide-react": "1.25.0" },
  "publishConfig": { "access": "public" }
}
```

- `types` first inside each condition block (publint rule).
- Top-level `main`/`module`/`types` keep node10-resolution consumers (old `moduleResolution`) working so plain `attw --pack .` can stay on the default profile; if node10 still flags, fall back to `--profile node16` and document why.
- **No `./internal` export** — internal utilities are private by construction; deep-importing them is impossible through the exports map.
- `"sideEffects": false` is safe here iff zero CSS imports exist in src — that's exactly the CI-enforced rule (RCT-03).

### Pattern 3: Icon registry with vendored `github` (the RCT-05 core)

lucide-react 1.25.0 verified facts (local install, 2026-07-18):
- All 53 non-brand handoff icons exist as PascalCase exports (`ChevronDown`, `Trash2`, `TriangleAlert`, `House`, `Ellipsis`, `CircleCheck`, …) — the handoff already uses post-rename lucide names, no aliasing needed.
- **`Github` does not exist** (brand icons removed in lucide 1.0, June 2026).
- `createLucideIcon(name, iconNode)` is exported — the official custom-icon API.
- There is **no `exports` map** in lucide-react 1.x → no public per-icon subpath. Named barrel imports are correct; tree-shaking works because the package is ESM with `sideEffects: false` and it stays external to our bundle.
- `DynamicIcon` exists but uses async `import()` — unsuitable for an SSR-safe, statically-analyzable registry. Do not use.

```ts
// src/icon/icon-registry.ts — GENERATED by tools/icon-registry/generate.mjs; committed; CI-checked
// Source of truth: scan of `<Icon name="…"` in handoff/components/** + handoff/ui_kits/**
import {
  Archive, ArrowLeft, ArrowRight, /* …50 more… */ UserPlus, Users, X,
  createLucideIcon,
  type LucideIcon,
} from 'lucide-react';

// `github` was removed from lucide in v1.0 (brand icons). Vendored verbatim from
// lucide-static@0.469.0/icons/github.svg (ISC) — the exact version the prototype
// pinned, so the glyph is pixel-identical to the handoff.
const Github = createLucideIcon('github', [
  ['path', { d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4', key: 'gh1' }],
  ['path', { d: 'M9 18c-4.51 2-5-2-7-2', key: 'gh2' }],
]);

export const iconRegistry = {
  'archive': Archive,
  'arrow-left': ArrowLeft,
  // … kebab-case name → component, all 54 …
  'github': Github,
  'x': X,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconRegistry;  // D-04 literal union
```

**Generator rules (D-02, verified against the handoff):**
- Scan pattern must be scoped to `<Icon name="…"` / `Icon name="…"` — a bare `name="[a-z-]+"` grep returns **56** unique values including the false positives `viewport` (from `<meta name="viewport">`) and `plan` (a form-input `name` attribute). Scoped scan returns exactly **54** `[VERIFIED: repo grep]`.
- kebab→Pascal conversion: split on `-`, capitalize segments (`trash-2` → `Trash2`, `chevrons-up-down` → `ChevronsUpDown`).
- `github` is special-cased to the vendored block (keep the SVG path data inside the generator so regeneration is deterministic).
- `--check` mode re-scans and diffs against the committed file; non-zero exit on drift (same contract as `tools/parity`). Wire as a step in the `test` CI job.

```tsx
// src/icon/icon.tsx — contract per Icon.d.ts + D-03/D-04/D-05/D-06 + UI-SPEC
export interface IconProps { /* name?: IconName; icon?: LucideIcon; size?; color?; title?; className?; style? */ }

// Render: resolve component = icon ?? iconRegistry[name]
// unknown name → if (process.env.NODE_ENV !== 'production') console.warn(
//   `[lyra-ds] Icon: unknown name "${name}". It is not in the curated registry — ` +
//   `pass a lucide-react component via the \`icon\` prop instead.`); return null;
// <Comp className={cx('lyra-icon', className)} size={size ?? 20} color={color}
//       aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} aria-label={title} … />
```

(lucide components spread extra props onto the `<svg>`, so `role`/`aria-*`/`style` pass through; `color` defaults to `currentColor` natively — matching D-06.)

### Pattern 4: size-limit config (per-minimal-import budgets, D-07)

```jsonc
// in packages/react/package.json  [CITED: github.com/ai/size-limit README]
"size-limit": [
  {
    "name": "import { Button } from '@lyra-ds/react/button'",
    "path": "dist/button.js",
    "import": "{ Button }",
    "ignore": ["react", "react-dom"],
    "limit": "<calibrate at execution + ~20%>"
  },
  {
    "name": "import { Icon } (54-icon registry, lucide included)",
    "path": "dist/icon.js",
    "import": "{ Icon }",
    "ignore": ["react", "react-dom"],   // lucide-react deliberately NOT ignored
    "limit": "<calibrate at execution + ~20%>"
  }
]
```

Two load-bearing details:
1. **Do NOT put `lucide-react` in `ignore` for the Icon entry** — including it is the entire RCT-05 proof: the measured bundle contains the 54 registry icons and must be an order of magnitude below the full ~1,400-icon set.
2. The **Button entry also must not ignore `lucide-react`** — its budget being tiny proves Button pulls zero lucide code (RCT-03 isolation from the registry).

Run via `pnpm --filter @lyra-ds/react exec size-limit` as a `build`-job step (after `pnpm run build`). Preset: `@size-limit/preset-small-lib` (esbuild-based, size-only) — suits a <10 kB-per-import library.

### Pattern 5: Vitest projects — browser + SSR side by side

```ts
// packages/react/vitest.config.ts  [CITED: vitest.dev/guide/browser + /guide/projects, Vitest 4]
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.tsx'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          name: 'ssr',
          include: ['src/**/*.ssr.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
```

- Browser tests import `@lyra-ds/styles` CSS **inside the test file** (workspace dep as devDependency of packages/react, or a relative import to `packages/styles/styles.css` like Phase 2 did) — Vite injects the `@import` graph, real CSS renders, axe's color-contrast rule works. This never touches `src/`.
- SSR tests: `import { renderToString } from 'react-dom/server'` and assert each pilot renders without throwing (Dialog with `open` renders `null` on the server via the portal mount guard — assert exactly that).
- axe pattern (from Phase 2 + STACK guidance): `import axe from 'axe-core'; const results = await axe.run(container); expect(results.violations).toEqual([])` — run per fixture in light AND `[data-theme="dark"]`.
- CI already installs chromium before the root test step — no workflow change needed for the browser project.

### Pattern 6: Scratch-app fixtures (D-27) — extending pack-smoke

The shipped `tools/pack-smoke/pack-smoke.mjs` pattern (pack → verify tarball file list → install into temp fixture → real build → assert) carries over with one structural change: **the react tarball has a real dependency (`lucide-react`), so a bare tar-extract is not an install.** The smoke script must run a real package-manager install of the tarball inside the OS-temp fixture copy:

```
1. pnpm pack packages/react → react.tgz   (also pack packages/styles for the CSS import)
2. tarball allowlist check: dist/** present; src/, tests, tsup.config.ts, node_modules absent
3. copy tools/smoke/vite-app → $TMP; npm install --no-audit --no-fund ./react.tgz  (npm avoids
   pnpm workspace entanglement; fixture lives outside the workspace root at runtime)
4. tsc --noEmit in the fixture (proves "full TypeScript support" — types resolve through the
   exports map with moduleResolution: bundler)
5. vite build → assert emitted JS contains the Button class emission and does NOT contain
   a known non-imported component's marker (isolation spot-check) and no `unpkg.com` string
6. same for next-app: App Router page (server component) importing Button/Input/Icon +
   a client boundary exercising Dialog; `next build` prerenders the page — this executes
   renderToString in anger AND fails if 'use client' is missing from dist
```

Both fixtures are committed with pinned-version package.json files (reproducible locally via `node tools/smoke/…`). CI: steps inside the frozen `build` job, after publint/attw/size-limit.

### Pattern 7: internal/ utilities (APG-guided, hand-rolled by locked decision)

| Utility | Contract | Implementation guidance |
|---------|----------|------------------------|
| `cx(...args)` | `(…(string \| false \| null \| undefined)[]) => string` | `args.filter(Boolean).join(' ')` — matches the prototype's own pattern; consumer `className` always LAST (D-09) |
| `useControllableState` | `{ value?, defaultValue?, onChange? }` → `[value, setValue]`; controlled iff `value !== undefined` (D-14) | Internal `useState(defaultValue)`; setter updates internal state only when uncontrolled, always calls `onChange`. Guard: warn in dev on controlled↔uncontrolled switches |
| `useFocusTrap(panelRef, active)` | Tab/Shift+Tab wrap inside the panel; runs on the PORTAL node | Query focusables via `panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR)` on each keydown (not cached — content changes); APG Dialog (Modal) pattern. Critical: operate on the ref into the portal subtree, never on the React-tree ancestor (Pitfall 5 of PITFALLS.md) |
| Focus restore | Capture `document.activeElement` when `open` flips true; restore on unmount/close — EVERY path (Esc, overlay, ×) | Store in a ref at open time, restore in the close effect cleanup |
| `usePresence(open)` | `{ mounted, closing }`; keeps mounted while `.lyra-dialog--closing` animates (D-17) | State machine open→closing→unmounted; on close add the closing class, wait `animationend`/`transitionend` on the panel with a `setTimeout` fallback (~250 ms > 180 ms `--duration-base`) so a display-none/reduced-motion environment can't wedge it |
| `useScrollLock(active)` | Body scroll locked + scrollbar-width compensation (D-22) | `document.documentElement.clientWidth` vs `window.innerWidth` delta → `paddingRight`; save/restore prior inline styles |
| `Portal` | `{ container?: HTMLElement; children }`; default `document.body`; SSR-safe (D-21) | `mounted` state set in `useEffect`; render `null` until mounted; then `createPortal(children, container ?? document.body)` |
| SSR guard convention | No `document`/`window` at module scope anywhere | Enforced by the ssr vitest project (`renderToString`) — the machine-checkable rule |

### Anti-Patterns to Avoid

- **`import * as icons from 'lucide-react'` or a full name→component object** — bundles ~1,400 icons; the registry must enumerate exactly 54 static imports (CLAUDE.md + Pitfall 3 of PITFALLS.md).
- **`DynamicIcon` / async icon loading** — breaks SSR determinism and static analysis; registry is static.
- **CSS imports anywhere under `packages/react/src`** — with `sideEffects: false` the bundler would silently drop them, and it violates RCT-03. CI-banned.
- **Shared single `.d.ts` for both `import` and `require` conditions** — attw FalseESM/FalseCJS masquerading.
- **Focus trap querying the React-tree parent instead of the portal node** — trap silently fails; always trap on the panel ref.
- **`opacity: 0` at any ENTRY keyframe start** in the new `.lyra-dialog--closing` CSS work — the locked animation constraint applies to entries; exits may fade out.
- **Default exports** — D-12; also degrades tree-shaking clarity.
- **Renaming/“cleaning up” `.lyra-*` class emission** — classes are public API (RCT-02 lands in Phase 4, but the pilots set the precedent; smoke tests assert exact class strings).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dual-format bundling + dts | Custom esbuild/rollup pipeline | tsup 8.5.1 (locked) | Handles per-format dts, externals, banners; attw verifies output |
| Exports-map validation | Manual consumer matrix testing | publint 0.3.21 + attw 0.18.5 | These two catch essentially all resolution/masquerading bugs pre-publish |
| Bundle-isolation proof | Eyeballing bundle analyzer output | size-limit 12.1.0 `import` entries | Deterministic, CI-enforceable, per-import budgets |
| Icon artwork | Custom SVG set | lucide-react 1.25.0 (+1 vendored ISC icon) | Locked; registry pattern keeps it tree-shakable |
| Real-browser component rendering in tests | jsdom + CSS shims | Vitest Browser Mode + vitest-browser-react | jsdom applies zero CSS — focus-visible, theming, and axe color-contrast are untestable there |
| a11y rule engine | Custom ARIA assertions | axe-core 4.12.1 direct `axe.run()` | Full rule set incl. color-contrast in a real browser |
| Static a11y lint | Ad-hoc review checklist | eslint-plugin-jsx-a11y | Catches icon-button-without-label class of bugs before runtime |

**Deliberate exceptions (locked decisions — these ARE hand-rolled):** `cx()` instead of clsx (D-11), focus trap/portal/scroll lock/presence instead of Radix/Ark/focus-trap libs (D-15, PROJECT.md "What NOT to Use"), `useControllableState` instead of a state library (D-14). Keep each under ~50 lines and APG-faithful; they are the one-place-to-fix shared utilities Pitfall 5 prescribes.

## Common Pitfalls

### Pitfall 1: `github` icon does not exist in lucide-react 1.x
**What goes wrong:** The registry generator maps `github` → `Github` and the build fails with a missing export (or worse, TS resolves `Github` to `undefined` in loose setups and Icon renders null in production).
**Why it happens:** lucide 1.0 (June 2026) removed all brand icons under legal pressure; the handoff was authored against lucide-static 0.469.0 which still had them. `[VERIFIED: local install of lucide-react@1.25.0 — `Github` absent, 53/54 present]`
**How to avoid:** Vendor the icon inside the generated registry via `createLucideIcon('github', iconNode)` with the ISC path data from lucide-static@0.469.0 (embedded in the generator, see Pattern 3).
**Warning signs:** TS error `Module '"lucide-react"' has no exported member 'Github'`; registry smoke fixture rendering 53 icons instead of 54.

### Pitfall 2: Naive handoff icon scan produces 56 names, not 54
**What goes wrong:** The registry generator greps `name="([a-z0-9-]+)"` and picks up `<meta name="viewport">` and a form input `name="plan"` — two phantom "icons" that then fail against lucide.
**How to avoid:** Scope the scan to `<Icon name="…"` occurrences. `[VERIFIED: repo grep — 56 raw vs 54 scoped]`
**Warning signs:** Registry count ≠ 54; generator emitting `Viewport`/`Plan` imports.

### Pitfall 3: `'use client'` stripped from dist
**What goes wrong:** Next.js App Router consumers get "useState only works in Client Components" — the directive in source was dropped by the bundler.
**Why it happens:** Directive preservation across esbuild versions/splitting configurations is inconsistent; relying on source-file directives alone is fragile.
**How to avoid:** `banner: { js: '"use client";' }` in tsup (deterministic, applied to every output file including shared chunks) + a build-job grep asserting the first line of each `dist/*.js`. The next-app smoke fixture is the end-to-end proof.
**Warning signs:** next-app fixture build errors mentioning client-only hooks in a Server Component.

### Pitfall 4: attw flags FalseCJS/FalseESM from a shared `.d.ts`
**What goes wrong:** One `types` file serves both `import` and `require` conditions; TS under `node16` resolution sees the wrong module kind — works in your repo, breaks for Node16-resolution consumers.
**How to avoid:** Per-condition `types` (`.d.ts` / `.d.cts`) as in Pattern 2 — tsup `dts: true` already emits both; the exports map just has to reference them.
**Warning signs:** attw table showing 🥸 (masquerading) cells.

### Pitfall 5: size-limit `ignore` hides exactly what the gate must measure
**What goes wrong:** Copying a typical react-lib config and adding `lucide-react` to `ignore` makes the Icon budget meaningless — the ~1,400-icon regression would pass CI.
**How to avoid:** Only `react`/`react-dom` in `ignore`; the Icon entry's budget is calibrated to the 54-icon cost; a regression to full-barrel bundling overshoots it by >10×.
**Warning signs:** Icon and Button budgets nearly identical; budget numbers in the megabyte range "to make CI pass."

### Pitfall 6: Scratch fixtures that don't actually exercise the published artifact
**What goes wrong:** Fixture imports `packages/react/src` via workspace resolution (masking broken dist/exports), or the tarball is tar-extracted without installing `lucide-react`, so the build fails for the wrong reason.
**How to avoid:** Fixtures run from an OS temp dir (outside the workspace root, like pack-smoke); install the tarball with `npm install ./react.tgz` (real dependency resolution); `tsc --noEmit` in the fixture proves the types side of RCT-04.
**Warning signs:** Fixture passing while `attw` fails; `node_modules/@lyra-ds/react` in the fixture missing `node_modules/lucide-react`.

### Pitfall 7: Presence/exit animation wedges when animations don't run
**What goes wrong:** `usePresence` waits for `transitionend`/`animationend` that never fires (reduced-motion, display:none ancestors, JSDOM-less environments, dropped frames) — Dialog stays mounted-closing forever.
**How to avoid:** Always pair the event listener with a `setTimeout` fallback slightly above `--duration-base` (180 ms → ~250 ms); clear both on whichever fires first. Test the Esc-close path in Browser Mode asserting eventual unmount.
**Warning signs:** Flaky "element still in DOM" test failures on the close path.

### Pitfall 8: Focus trap/restore built against the React tree instead of the portal
**What goes wrong:** Tab escapes the dialog to the page behind; focus restore targets the wrong element after overlay-click close.
**How to avoid:** Trap operates on the panel ref inside the portal subtree; capture the opener (`document.activeElement`) at the `open` transition, restore it on every close path — Browser Mode keyboard tests assert all three paths (Esc, overlay, ×).
**Warning signs:** axe passes (it can't see focus bugs — static analysis) while manual Tab testing escapes.

## Code Examples

Verified patterns from official sources — beyond those embedded in Architecture Patterns above:

### Named lucide import + custom icon creation
```tsx
// Source: lucide.dev react getting-started + lucide-react.ts (Context7 /lucide-icons/lucide)
import { Camera, createLucideIcon } from 'lucide-react';
// PascalCase exports auto-derived from kebab-case names; ESM, fully tree-shakable
<Camera size={20} strokeWidth={2} className="lyra-icon" />
```

### SSR test shape (node project)
```ts
// src/dialog/dialog.ssr.test.ts — environment: node (D-26)
import { renderToString } from 'react-dom/server';
import { Dialog } from './index';

test('Dialog renders to string without touching DOM at module scope', () => {
  // open dialog on the server: portal mount-guard means the overlay renders null — no crash
  const html = renderToString(
    <Dialog open onClose={() => {}} title="T">body</Dialog>
  );
  expect(typeof html).toBe('string');
});
```

### CI step additions (inside the four FROZEN jobs — never new jobs)
```yaml
# lint job (append):
- run: pnpm --filter @lyra-ds/react run lint        # eslint flat config: ts + jsx-a11y + hooks + no-restricted-imports "*.css"
# typecheck job: root `pnpm run typecheck` now recurses into packages/react (tsc --noEmit) — no yml change
# test job (append):
- run: node tools/icon-registry/generate.mjs --check  # D-02 drift guard
# (root `pnpm run test` already recurses into the new react vitest projects; chromium already installed before it)
# build job (append after existing publint step):
- run: pnpm exec publint packages/react
- run: pnpm --filter @lyra-ds/react exec attw --pack .
- run: pnpm --filter @lyra-ds/react exec size-limit
- run: node tools/smoke/smoke.mjs                     # vite-app + next-app tarball installs + builds
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| lucide brand icons (`Github`, `Twitter`, …) | Removed entirely; Simple Icons recommended upstream | lucide 1.0, June 2026 | `github` must be vendored via `createLucideIcon` (Pattern 3) |
| `lucide-react/icons/x` per-icon deep imports (0.x guidance, cited in `.planning/research/PITFALLS.md`) | No exports map in 1.x — named barrel imports, ESM + `sideEffects: false` | lucide-react 1.0 | Registry uses named imports from the barrel; still perfectly tree-shakable by consumer bundlers |
| lucide-react UMD build | ESM + CJS only; package cut ~32% | lucide 1.0 | Nothing to do; confirms externalizing it is cheap |
| `forwardRef` required for refs | React 19 supports ref-as-prop; `forwardRef` still fully supported | React 19 (2024) | D-08 locks `forwardRef` — correct for the `>=18 <20` peer range; revisit only when peer floor moves to 19 |
| tsup as the maintained default | tsup officially unmaintained; tsdown is the sanctioned successor | Nov 2025 README notice | Locked to tsup for v0.1.0; keep configs simple to ease the planned tsdown migration |
| vitest-axe matchers | Direct `axe.run()` in Browser Mode | vitest-axe stale since Jan 2025 | Already project policy |

**Deprecated/outdated:** `main`/`module`-only packaging (exports map mandatory for subpaths); jsdom for CSS-dependent a11y tests; CDN icon loading (the exact thing this phase deletes).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `banner: { js: '"use client";' }` is sufficient and harmless across ESM+CJS outputs and shared chunks; a dist grep confirms it `[ASSUMED — mechanism verified in tsup source via Context7, end-to-end behavior proven only by the next-app fixture]` | Pattern 1, Pitfall 3 | Next.js consumers break; caught by the committed next-app smoke fixture before merge |
| A2 | Expected magnitudes: `{ Button }` import ≈ low single-digit kB min+gzip; `{ Icon }` + 54-icon registry ≈ 10–30 kB min (well under the ~500 kB+ full set) `[ASSUMED — D-07 mandates calibration at execution]` | Pattern 4 | Budgets need recalibration at execution; no design impact |
| A3 | Plain `attw --pack` (default profile incl. node10) passes given top-level `main`/`types` fallbacks; else `--profile node16` is acceptable for a 2026 library `[ASSUMED]` | Pattern 2 | One extra CLI flag + a documented rationale |
| A4 | CI runners have npm registry access inside the smoke-fixture temp dir (`npm install ./react.tgz` resolves lucide-react) `[ASSUMED — standard GitHub Actions behavior; pack-smoke avoided network only because styles has zero deps]` | Pattern 6 | Fixture install step needs a registry-populated store or pnpm fetch fallback |
| A5 | `usePresence` timeout fallback of ~250 ms (vs 180 ms `--duration-base`) is the right guard shape `[ASSUMED — standard practice]` | Pattern 7 | Tune the constant; test-observable |
| A6 | lucide-react pin at execution = 1.25.0 (UI-SPEC text says 1.24.0; both are 1.x post-brand-removal; verification ran against 1.25.0) `[ASSUMED choice — needs a one-line confirmation]` | Standard Stack | None functionally; keep save-exact pin consistent with UI-SPEC or update UI-SPEC line |

## Open Questions

1. **Where do the react vitest projects live — package-level config vs root config?**
   - What we know: CONTEXT "Integration Points" says "Root `vitest.config` gains projects… alongside the styles project," but no root config exists today; styles ships its own config and the root `test` script recurses (`pnpm -r --if-present run test`), which CI depends on.
   - What's unclear: whether that sentence is a binding decision or a sketch.
   - Recommendation: `packages/react/vitest.config.ts` with `test.projects` (browser + ssr) and a package `test` script — zero disruption to the shipped Phase 2 harness and the frozen CI step. Falls under Claude's discretion ("follow Phase 2's Browser Mode patterns").
2. **ESLint adoption now vs a zero-dep grep gate for the CSS-import ban.**
   - What we know: STACK.md recommends ESLint 10 flat config + jsx-a11y for the react package; the repo currently lints with prettier+stylelint only; the phase needs at minimum a machine-checked "zero CSS imports" rule.
   - Recommendation: adopt ESLint now (flat config scoped to packages/react) — it also delivers jsx-a11y and hooks rules the Phase 4 batch conversion will lean on; keep a one-line grep in the lint job only if the planner wants redundancy.
3. **React 18 compatibility testing.** peerDeps say `>=18 <20` but everything runs on 19.2. A CI matrix leg on React 18 is cheap insurance but grows CI time; PITFALLS.md suggests it. Recommendation: defer to Phase 4/7 (note it in CONVENTIONS.md as a pre-publish check) — the pilots use only 18-safe APIs (`forwardRef`, `useId`, `createPortal`).
4. **Does the styles-side work (`.lyra-dialog--closing`, overlay counterpart, `.lyra-dialog__close`) ship as a normal Phase 3 plan touching `packages/styles` + `tools/parity` allowlist?** Research answer: yes — D-18/D-19 place the CSS in `@lyra-ds/styles` with the parity script gaining an explicitly enumerated `ADDITIVE_EXTENSIONS` list (visible, auditable). The planner should make this its own task with the parity run as verification.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | all tooling | ✓ | v24.18.0 (in `>=24 <25` engines) | — |
| pnpm | workspace | ✓ | 11.13.1 (matches packageManager) | — |
| Playwright chromium | Browser Mode tests | ✓ | chromium-1223/1228 cached locally; CI installs via existing step | — |
| npm registry access | installs, smoke-fixture `npm install <tgz>` | ✓ (verified via npm view / local install this session) | — | — |
| tar | pack-smoke-style scripts | ✓ (used by shipped pack-smoke) | — | — |
| vite (pinned) | vite-app fixture | ✓ | 8.1.5 root devDep | — |
| next | next-app fixture | ✗ (not yet installed) | 16.2.10 to add as fixture dep | none needed — installed with this phase |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — everything absent is scheduled for install in this phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 (+ @vitest/browser-playwright 4.1.10, vitest-browser-react 2.2.0, axe-core 4.12.1) |
| Config file | `packages/react/vitest.config.ts` — **Wave 0** (see Open Question 1) |
| Quick run command | `pnpm --filter @lyra-ds/react run test` |
| Full suite command | `pnpm run test && pnpm run parity && node tools/icon-registry/generate.mjs --check` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RCT-03 | Importing one component pulls no others; no CSS imports; `sideEffects: false` | build-gate | `pnpm --filter @lyra-ds/react exec size-limit` + eslint CSS-ban + `pnpm exec publint packages/react` | ❌ Wave 0 |
| RCT-03 | Subpath imports resolve (`@lyra-ds/react/button`) | smoke fixture | `node tools/smoke/smoke.mjs` (vite fixture imports via subpath) | ❌ Wave 0 |
| RCT-04 | Dual ESM+CJS + types valid | build-gate | `pnpm --filter @lyra-ds/react exec attw --pack .` | ❌ Wave 0 |
| RCT-04 | Tarball installs & builds in scratch Vite + Next.js with full TS | smoke fixture | `node tools/smoke/smoke.mjs` (npm i tgz → tsc --noEmit → vite/next build) | ❌ Wave 0 |
| RCT-05 | Registry = handoff scan, no drift | script gate | `node tools/icon-registry/generate.mjs --check` | ❌ Wave 0 |
| RCT-05 | 54 icons render; unknown name warns+null; no CDN | unit/browser | `pnpm --filter @lyra-ds/react run test -- --project browser src/icon` + dist grep for `unpkg.com` (must be absent) | ❌ Wave 0 |
| RCT-05 | ~1,400-icon set not bundled | build-gate | size-limit Icon entry (lucide included in measurement) | ❌ Wave 0 |
| D-15/16/17/20/22 | Dialog trap/Esc/restore/scroll-lock/presence | browser (keyboard) | `pnpm --filter @lyra-ds/react run test -- --project browser src/dialog` | ❌ Wave 0 |
| D-14 | Input controlled/uncontrolled contract | browser | `… --project browser src/input` | ❌ Wave 0 |
| D-26 | All pilots `renderToString` without module-scope DOM | node | `pnpm --filter @lyra-ds/react run test -- --project ssr` | ❌ Wave 0 |
| A11y (pilot scope) | axe.run() clean, light + dark | browser | part of each `*.browser.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @lyra-ds/react run test` (+ the specific gate the task touches)
- **Per wave merge:** full suite command above + `pnpm run build` (triggers publint/attw/size-limit locally where wired)
- **Phase gate:** all four CI jobs green on the PR (lint/typecheck/test/build with all new steps) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `packages/react/vitest.config.ts` — projects (browser + ssr)
- [ ] `packages/react/tsconfig.json` + package scripts (`build`, `test`, `typecheck`, `lint`)
- [ ] `tools/icon-registry/generate.mjs` (+ `--check` mode) — covers RCT-05 drift guard
- [ ] `tools/smoke/vite-app`, `tools/smoke/next-app`, `tools/smoke/smoke.mjs` — covers RCT-04
- [ ] eslint flat config for packages/react (CSS-import ban = RCT-03 rule)
- [ ] size-limit config block in packages/react/package.json
- [ ] Per-pilot test files per D-28 layout (the tests ARE the Phase 4 template, D-25)
- [ ] Framework installs: root devDeps + `lucide-react` dep (see Installation)

## Security Domain

`security_enforcement: true`, ASVS level 1. This phase publishes no service — it builds a client-side component library — so most ASVS categories are N/A; supply-chain integrity is the dominant surface.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (narrow) | Icon `name` lookup is a `Record` key access on a frozen literal-union map — no dynamic require/import, no prototype-chain risk if lookup uses `Object.hasOwn`/`in` on the registry object; dev `console.warn` must not echo unbounded consumer strings into HTML (it doesn't — console only) |
| V6 Cryptography | no | — |
| V14 Config / Supply chain | yes | save-exact pins, lockfile-only installs (`--frozen-lockfile` in CI), package-legitimacy audit above (no postinstall scripts in any approved package), no network at runtime (CDN ban verified by dist grep), `files` allowlist + tarball inspection in smoke script |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Slopsquat/compromised dep introduced during install tasks | Tampering | Legitimacy audit table above; single human-verify checkpoint for the six too-new-flagged (all canonical) packages; exact-version pins |
| XSS via icon SVG injection | Tampering | Icons are React elements from lucide-react / `createLucideIcon` — no `dangerouslySetInnerHTML` anywhere in the pilots (rule for CONVENTIONS.md) |
| Malicious build-time script in fixtures | Elevation | Fixtures are committed, pinned, and run `npm install` with `--no-audit --no-fund` on a local tarball + registry deps only; no postinstall in the dep set |
| Dev-warning info leak in production | Info disclosure | `process.env.NODE_ENV !== 'production'` guard (D-05) — bundlers strip the branch |

## Sources

### Primary (HIGH confidence)
- npm registry via `npm view` (2026-07-18) — every version, peerDependency, and engines claim in Standard Stack
- Local install of `lucide-react@1.25.0` + Node introspection — 53/54 icon exports present, `Github` absent, `createLucideIcon` present, no exports map, `sideEffects: false` `[VERIFIED]`
- Repo greps — icon scan 56 raw vs 54 `<Icon name=` scoped; existing CI/parity/pack-smoke/vitest patterns read from source `[VERIFIED]`
- `gsd-tools query package-legitimacy check` (2026-07-18) — audit table

### Secondary (MEDIUM confidence)
- Context7 `/egoist/tsup` — entry object form, format, dts config, banner/splitting passthrough to esbuild
- Context7 `/arethetypeswrong/arethetypeswrong.github.io` — `attw --pack`, `--profile`, `--ignore-rules`, FalseCJS docs
- Context7 `/lucide-icons/lucide` — getting-started, PascalCase derivation, DynamicIcon internals
- Context7 `/vitest-dev/vitest` — `test.projects` browser + node shape (matches installed 4.1.10)
- WebSearch cross-checked (InfoQ, lucide.dev/guide/version-1, lucide migration guide) — lucide 1.0 brand-icon removal, UMD drop; cross-verified against the local install → effectively HIGH for the removal claim
- unpkg.com lucide-static@0.469.0/icons/github.svg — vendored path data (matches the prototype's pinned CDN source verbatim)

### Tertiary (LOW confidence)
- github.com/ai/size-limit README via WebFetch — `import`/`ignore`/preset semantics (single source; validated at execution when budgets are calibrated)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package version + peer/engine constraint verified against the registry this session
- Icon registry facts (the phase's riskiest area): HIGH — verified by installing and introspecting the actual dependency
- tsup/attw/size-limit mechanics: MEDIUM — official docs via Context7/WebFetch; end-to-end proof lands with the CI gates themselves
- Internal utilities (trap/presence/scroll lock): MEDIUM — APG-pattern guidance + prior PITFALLS research; behavior locked by the browser test template

**Research date:** 2026-07-18
**Valid until:** ~2026-08-18 (stable toolchain; re-check lucide-react latest and the size-limit/attw majors at execution)
