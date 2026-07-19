# Roadmap: Lyra Design System (lyra-ds)

## Overview

Convert the frozen design handoff (209 tokens, 40 components, `.d.ts` contracts) into a real, publishable design system. The build is dependency-ordered: scaffold the monorepo with correct packaging metadata and OSS governance first, ship the pure-CSS styles package with parity guards, lock React conventions on a pilot trio + Icon, batch-convert the remaining components with full a11y and SSR safety, generate prop tables and llms.txt from one parse of the TypeScript interfaces, build the bilingual docs site that dogfoods the system, and finish with a gated release pipeline that puts `@lyra-ds/styles` + `@lyra-ds/react` 0.1.0 on npm under a branded GitHub org.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Monorepo Foundation & Governance** - pnpm workspace, CI, governance files, and versioning policy that everything else builds on (completed 2026-07-17)
- [x] **Phase 2: Styles Package** - `@lyra-ds/styles` with 209/209 token parity, theming, white-label contract, and safe packaging metadata (completed 2026-07-18)
- [ ] **Phase 3: React Infrastructure & Pilot Components** - Build/test/CI machinery plus Button, Input, Dialog, and Icon to lock conventions before batch work
- [ ] **Phase 4: Component Batch Conversion & A11y** - All 40 components with class parity, APG-compliant keyboard behavior, SSR safety, and axe-clean output
- [ ] **Phase 5: Docgen & llms.txt** - One parse of the `.d.ts` contracts feeds prop tables and `llms.txt` — no hand-maintained API docs
- [ ] **Phase 6: Docs Site (Bilingual)** - EN + pt-BR site dogfooding Lyra with live previews, white-label demo, and Vercel deploys
- [ ] **Phase 7: Release Pipeline & Launch** - Dry-run-gated 0.1.0 npm publish, changesets automation, and org branding

## Phase Details

### Phase 1: Monorepo Foundation & Governance

**Goal**: The repo is a credible OSS home — workspace scaffolding, governance files, and visible CI exist before any package code, so packaging mistakes are prevented at authoring time
**Depends on**: Nothing (first phase)
**Requirements**: OSS-01, OSS-02, OSS-03, OSS-05
**Success Criteria** (what must be TRUE):

  1. A dev landing on the repo reads a README with the pitch (CSS-first, white-label in 4 tokens, adapter/registry roadmap), install instructions, and a minimal usage snippet
  2. MIT LICENSE, CONTRIBUTING.md, Code of Conduct, and issue/PR templates are present in the repo
  3. Every PR runs visible CI (lint, typecheck, test, build) via GitHub Actions, with hooks ready for publint/attw/size-limit/parity gates as packages land
  4. A written 0.x versioning policy states that 0.MINOR = breaking and that the declared API surface includes props, `.lyra-*` class names, and token names
  5. `pnpm install` and workspace-wide build/test commands succeed from a clean clone (pnpm workspaces + changesets scaffold works)

**Plans**: 5/5 plans executed

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — GitHub remote bootstrap: org (guided), repo lyra-ds/lyra, push, PR-only ruleset, GSD phase-branch flip

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — pnpm workspace scaffold, pinned toolchain, placeholder stubs, changesets lockstep config
- [x] 01-03-PLAN.md — Governance docs: LICENSE, CoC 3.0, SECURITY, CONTRIBUTING, VERSIONING, README EN + pt-BR
- [x] 01-04-PLAN.md — CI workflow (frozen lint/typecheck/test/build jobs + future-gate hooks), issue forms, PR template, CODEOWNERS

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-05-PLAN.md — Integration: clean-clone proof, scaffold PR with green CI, merge, required status checks on ruleset

### Phase 2: Styles Package

**Goal**: A dev can install `@lyra-ds/styles` alone and get the complete, pixel-faithful, themeable Lyra appearance with zero JavaScript
**Depends on**: Phase 1
**Requirements**: STY-01, STY-02, STY-03, STY-04, STY-05, STY-06, STY-07
**Success Criteria** (what must be TRUE):

  1. Dev imports a single entry (`styles.css`) and gets all 209 tokens plus the styles of all 40 components; individual token files also load via `./tokens/*` subpath exports
  2. Setting `data-theme="dark"` on `<html>` switches themes with no rebuild
  3. Defining the 4 brand tokens (`--brand`, `--brand-contrast`, `--brand-radius`, `--brand-font`) under `[data-brand]` re-brands the UI with hover/active/soft/focus-ring derived via `color-mix`, verified against saturated brand fixtures in light and dark
  4. `compat-shadcn.css` applies only when imported explicitly — it stays outside the default entry
  5. CI parity script proves 209/209 handoff tokens present with identical values, and publint passes with `"sideEffects": ["**/*.css"]` protecting CSS from consumer tree-shaking

**Plans**: 6/6 plans executed

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Token CSS layer: copy 7 handoff token files (dark theming, brand color-mix, fonts no-CDN stub)
- [x] 02-02-PLAN.md — Component CSS layer: copy 7 aggregate component files (248 `.lyra-*` classes)

**Wave 2** *(blocked on Wave 1)*

- [x] 02-03-PLAN.md — Entry, compat subpath, package.json (exports/sideEffects/files), README brand+fonts docs
- [x] 02-04-PLAN.md — Parity script (209 tokens / 248 classes) + stylelint config + devDep legitimacy checkpoint

**Wave 3** *(blocked on Wave 2)*

- [x] 02-05-PLAN.md — Vitest Browser Mode harness + acme brand/theme fixture test (STY-03/STY-04, light+dark)

**Wave 4** *(blocked on Wave 3)*

- [x] 02-06-PLAN.md — CI gate integration: wire stylelint/parity/publint/vitest into the four frozen jobs; prove green

**UI hint**: yes
**Research**: Standard patterns (copy-verify, bespoke parity script) — skip research-phase

### Phase 3: React Infrastructure & Pilot Components

**Goal**: Conversion conventions are locked on a pilot spanning simple/form/overlay cases (Button, Input, Dialog) plus Icon, with build/test/CI machinery proven, so batch conversion becomes safe repetition
**Depends on**: Phase 2
**Requirements**: RCT-03, RCT-04, RCT-05
**Success Criteria** (what must be TRUE):

  1. Pilot components install from a packed tarball into scratch Vite and Next.js apps and render with full TypeScript support (dual ESM+CJS via tsup, publint + attw green)
  2. Importing one component pulls no others — one file per component, `sideEffects: false`, zero CSS imports in the react package, all enforced by CI rules
  3. Icon renders Lucide from a local dependency via a curated registry (no CDN), and a size-limit CI gate proves the ~1,400-icon set is not bundled
  4. Shared `internal/` utilities exist (focus trap, portal, controllable state, SSR guards) alongside a conventions note and test template (smoke + keyboard + axe + `renderToString`) that Phase 4 will reuse, with JSDoc language decided (EN canonical)

**Plans**: 7/9 plans executed

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — React package scaffold: legitimacy checkpoint, pinned installs, exports map, tsup/vitest/eslint configs
- [x] 03-02-PLAN.md — Styles additive dialog CSS (.lyra-dialog__close, exit animations) + parity ADDITIVE_EXTENSIONS allowlist
- [x] 03-03-PLAN.md — Icon registry generator (54-icon scoped scan, vendored github) + committed icon-registry.ts with --check drift gate

**Wave 2** *(blocked on Wave 1)*

- [x] 03-04-PLAN.md — internal/ utilities: cx, useControllableState, Portal (SSR guard), useFocusTrap, usePresence, useScrollLock

**Wave 3** *(blocked on Wave 2)*

- [x] 03-05-PLAN.md — Button + Icon pilots with browser (smoke/axe light+dark) + SSR test templates
- [x] 03-06-PLAN.md — Input pilot: controlled/uncontrolled contract + a11y wiring + tests
- [x] 03-07-PLAN.md — Dialog pilot: portal/trap/presence/scroll-lock + keyboard/focus/axe/SSR overlay suite

**Wave 4** *(blocked on Wave 3)*

- [ ] 03-08-PLAN.md — Barrel + build/publint/attw green, calibrated size-limit budgets, CONVENTIONS.md, CI gate steps

**Wave 5** *(blocked on Wave 4)*

- [ ] 03-09-PLAN.md — Scratch-app smoke: committed Vite + Next.js fixtures, tarball install/build proofs, final CI step

**UI hint**: yes

### Phase 4: Component Batch Conversion & A11y

**Goal**: All 40 components work as accessible, SSR-safe React components that emit exactly the handoff `.lyra-*` classes
**Depends on**: Phase 3
**Requirements**: RCT-01, RCT-02, RCT-06, RCT-07, RCT-08, RCT-09, RCT-10, A11Y-01, A11Y-02, A11Y-03, A11Y-04
**Success Criteria** (what must be TRUE):

  1. Dev uses all 40 components with complete TypeScript (peerDeps react/react-dom >=18), and class-parity test assertions prove each emits exactly the handoff `.lyra-*` classes
  2. Dialog, Drawer, CommandPalette, and Toast render via portal into `document.body` with SSR guards, and all 40 components pass `renderToString` without crashing
  3. Dialog, Drawer, and CommandPalette trap focus while open, close on Esc, and restore focus to the origin element on every close path; Combobox and CommandPalette implement the APG listbox pattern with `aria-activedescendant` and full keyboard navigation
  4. axe-core passes with zero violations on all 40 components in light and dark themes, and interactive components (Tabs, Dropdown, Accordion, Stepper, Pagination, Switch, etc.) have real keyboard tests in Browser Mode
  5. FileUpload exposes its real API (`onFiles(files)` + controlled `items`/`onChange`, simulation as opt-in demo mode), stateful components honor the controlled/uncontrolled contract from the `.d.ts`, and all component JSDoc is canonical English

**Plans**: TBD
**UI hint**: yes
**Research**: FLAGGED — WAI-ARIA APG per-pattern specifics (Combobox with listbox popup, Dialog Modal, Menu button keyboard tables); wrong pattern choice (real focus vs `aria-activedescendant`) is silent and expensive

### Phase 5: Docgen & llms.txt

**Goal**: A single parse of the TypeScript interfaces feeds both prop tables and llms.txt, so API docs can never drift from source
**Depends on**: Phase 4
**Requirements**: GEN-01, GEN-02
**Success Criteria** (what must be TRUE):

  1. The build generates `llms.txt` from the `.d.ts` contracts (generation rules + tokens + API of all 40 components) into the docs app's public dir, validated against the handoff format
  2. Per-component prop data is emitted from the same extraction, ready for docs pages to consume — no prop table is ever maintained by hand
  3. Docgen runs in CI after typecheck, so interface changes regenerate output automatically instead of drifting

**Plans**: TBD
**Research**: Standard patterns (ts-morph extraction is well-established) — skip research-phase

### Phase 6: Docs Site (Bilingual)

**Goal**: Devs learn, evaluate, and adopt Lyra from a bilingual site that dogfoods the system itself
**Depends on**: Phase 5
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, DOC-07, DOC-08, DOC-09, DOC-10
**Success Criteria** (what must be TRUE):

  1. Dev completes getting-started (install → CSS import → first component) in under 5 minutes, in EN or pt-BR
  2. Each of the 40 components has a page with live preview, generated prop table, and copyable code, in both locales
  3. The white-label guide shows a live multibrand demo (3 brands × light/dark), a plain-HTML page shows `.lyra-*` classes working without React, and a compat-shadcn page documents the opt-in token mapping
  4. The site is styled entirely with `@lyra-ds/styles` + `@lyra-ds/react`, has a light/dark theme switcher, client-side search, and a landing page adapted from `ui_kits/website` (no fictional pricing/testimonials)
  5. The site routes EN (default) + pt-BR with locale fallback, serves `/llms.txt` as plain text, and deploys to Vercel with per-PR preview deployments

**Plans**: TBD
**UI hint**: yes
**Research**: FLAGGED — fumadocs-core headless with a fully custom design system is proven by only one community example (LOW confidence); validate i18n routing + next-intl integration at planning time (Astro Starlight is the documented fallback)

### Phase 7: Release Pipeline & Launch

**Goal**: `@lyra-ds/styles` and `@lyra-ds/react` 0.1.0 are live on npm under a branded `lyra-ds` GitHub org, with automated releases proven end-to-end
**Depends on**: Phase 6
**Requirements**: REL-01, REL-02, OSS-04
**Success Criteria** (what must be TRUE):

  1. Dev installs both 0.1.0 packages from public npm into fresh projects and renders working UI — publish happens only after the dry-run gate (pnpm pack → tarball inspection → install in scratch Vite and Next.js apps)
  2. Merging a changeset opens a Version Packages PR that, on merge, publishes to npm (OIDC trusted publishing or the documented `NPM_TOKEN` + provenance fallback) and creates a GitHub Release with changelog
  3. The `lyra-ds` GitHub org shows the avatar, profile README, and social preview from `handoff/assets/github/`
  4. The launch checklist (the "Looks Done But Isn't" list from PITFALLS.md) passes as the final UAT gate

**Plans**: TBD
**Research**: FLAGGED — re-check npm/cli#8976 (OIDC + scoped monorepo E404) status at planning time; primary path may have been fixed, fallback is pre-approved

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Monorepo Foundation & Governance | 5/5 | Complete    | 2026-07-17 |
| 2. Styles Package | 6/6 | Complete    | 2026-07-18 |
| 3. React Infrastructure & Pilot Components | 7/9 | In Progress|  |
| 4. Component Batch Conversion & A11y | 0/TBD | Not started | - |
| 5. Docgen & llms.txt | 0/TBD | Not started | - |
| 6. Docs Site (Bilingual) | 0/TBD | Not started | - |
| 7. Release Pipeline & Launch | 0/TBD | Not started | - |

## Coverage

All 40 v1 requirements mapped to exactly one phase:

| Category | Requirements | Phase |
|----------|--------------|-------|
| OSS | OSS-01, OSS-02, OSS-03, OSS-05 | Phase 1 |
| OSS | OSS-04 | Phase 7 |
| STY | STY-01 … STY-07 (7) | Phase 2 |
| RCT | RCT-03, RCT-04, RCT-05 | Phase 3 |
| RCT | RCT-01, RCT-02, RCT-06, RCT-07, RCT-08, RCT-09, RCT-10 | Phase 4 |
| A11Y | A11Y-01 … A11Y-04 (4) | Phase 4 |
| GEN | GEN-01, GEN-02 | Phase 5 |
| DOC | DOC-01 … DOC-10 (10) | Phase 6 |
| REL | REL-01, REL-02 | Phase 7 |

---
*Roadmap created: 2026-07-16*
