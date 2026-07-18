# Phase 2: Styles Package - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver `@lyra-ds/styles` — a **pure-CSS, no-build** package that a dev can install alone to get the complete, pixel-faithful, themeable Lyra appearance with zero JavaScript. Scope: the 209 handoff tokens (100% parity), the CSS of all 40 components, light/dark theming via `[data-theme="dark"]`, the white-label brand contract (4 input tokens + `color-mix` derivation), `compat-shadcn.css` as an explicit opt-in subpath (outside the default entry), and safe packaging metadata (`sideEffects: ["**/*.css"]`, valid exports map, publint green). Requirements: STY-01 through STY-07.

Out of scope: any React/JS code, per-component `.lyra-*` class emission logic (Phase 3/4), font embedding (fonts stay peer via `@fontsource/*`), docs site (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Package layout & import surface
- **D-01:** **Mirror the handoff structure 1:1.** Copy `handoff/tokens/*.css` → `packages/styles/tokens/` and `handoff/components/<category>/*.css` → `packages/styles/components/<category>/` (buttons, forms, display, navigation, feedback, files, data, icons). Single entry `styles.css` re-`@import`s them in the handoff order.
- **D-02:** **Subpath exports only for `./tokens/*`** (satisfies STY-02). Do **not** expose per-component CSS subpaths in v0.1.0 — CSS is global cascade, and fine-grained tree-shaking is the React package's concern. Keeps the exports map small and publint risk low. `./compat-shadcn.css` (or `./compat/shadcn.css`) is the one extra explicit subpath, kept out of the default entry (STY-05, locked constraint).

### CSS comment language in shipped source
- **D-03:** **Strip explanatory comments** from the shipped CSS (the handoff files carry pt-BR comment blocks). Ship the readable token/class **values** without comment prose. Keep only a **minimal header banner** per file (package name + MIT license line) — standard for a published package. This aligns with the EN-governance decision (Phase 1 D-04) without shipping pt-BR prose to a global npm audience.
- **D-03a (implication):** The brand contract that currently lives as inline comments in `handoff/tokens/brand.css` moves to the **README** as the documented `[data-brand]` example (see D-04). README becomes the single source of that documentation.

### Brand re-branding validation (Success Criterion 3)
- **D-04:** **Brand fixtures live in tests + one documented example in the README.** A saturated example brand (e.g., `acme` teal) is exercised by Browser Mode tests in both light and dark, asserting the derived `hover/active/soft/focus-ring` group resolves correctly via `color-mix`. The README carries a copy-pasteable `[data-brand="acme"]` block showing how a consumer defines the 4 brand tokens. **Do not** ship an importable `./brands/*.css` subpath — avoids implying an "official" Lyra brand and keeps the API surface minimal.

### Token/class parity script (STY-06)
- **D-05:** **`handoff/tokens/` is the canonical snapshot.** The CI parity script extracts the 209 tokens from `handoff/tokens/` and compares them value-for-value against `packages/styles/tokens/` (normalize whitespace only; values must match exactly). No separate committed lockfile — compare directly against `handoff/` so drift is caught at source.
- **D-06:** **Parity also inventories the component `.lyra-*` classes** (not just tokens). Beyond the 209 tokens, the script inventories the `.lyra-*` class names present in `handoff/components/**` and asserts the package's component CSS carries the same set. (Class-level *behavior*/React emission stays Phase 3/4; this is a static class-name inventory only.)

### Claude's Discretion
- Exact parity-script location and language (plain Node script in `tools/` vs inline CI step), extraction/normalization mechanics, and how the "209" count is asserted — decide at planning/execution per research patterns (copy-verify, bespoke parity script; roadmap says skip research-phase).
- Exports-map shape details, `publishConfig`, `files` allowlist, and the exact header-banner text — standard packaging metadata per PITFALLS.md.
- Whether `styles.css` documents fonts as a peer install (comment/README) vs silent — `fonts.css` carries no tokens; fonts stay peer per constraint. Decide at authoring.
- Whether `compat-shadcn` subpath is `./compat-shadcn.css` or `./compat/shadcn.css` — pick the cleaner exports entry at planning.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Conversion spec & architecture (project-wide)
- `handoff/design_handoff_lyra_lib/README.md` — canonical conversion spec: locked architecture, monorepo layout, publication checklist
- `.planning/research/STACK.md` — tooling (no PostCSS/build at v0.1.0; ship unminified source CSS; `sideEffects` semantics)
- `.planning/research/ARCHITECTURE.md` — package boundaries; styles package has no build step
- `.planning/research/PITFALLS.md` — packaging metadata pitfalls: `sideEffects: ["**/*.css"]`, exports map, publint, `compat-shadcn` outside entry

### Handoff source (the CSS being packaged)
- `handoff/styles.css` — the entry `@import` order to mirror
- `handoff/tokens/*.css` — the 209 tokens; canonical parity source (D-05): base, brand, colors, effects, fonts, spacing, typography, compat-shadcn
- `handoff/tokens/brand.css` — the white-label contract (4 tokens + `color-mix` derivation); its comment content becomes README docs (D-03a)
- `handoff/tokens/colors.css` §`[data-theme="dark"]` — dark theming already implemented (STY-03)
- `handoff/components/<category>/*.css` — the 40 components' CSS + `.lyra-*` class inventory source (D-06)

### Requirements & policy
- `.planning/REQUIREMENTS.md` — STY-01 … STY-07 (this phase)
- `.planning/PROJECT.md` — locked constraints (CSS-first, no Tailwind, no build, fonts peer, compat opt-in)
- `.planning/phases/01-monorepo-foundation-governance/01-CONTEXT.md` — Phase 1 decisions carried forward (EN governance D-04, lockstep versioning D-06, PR-from-day-one D-07/D-08)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `handoff/tokens/*.css` + `handoff/components/**/*.css`: final, pixel-faithful CSS — copied (not transformed) into `packages/styles/`
- `handoff/styles.css`: exact `@import` order to reproduce in the package entry
- `handoff/tokens/brand.css`: complete `color-mix` derivation already written — package ships it as-is (minus comments per D-03)
- `packages/styles/package.json`: current placeholder (`private: true`, `version: 0.0.0`) — Phase 2 fills in exports/sideEffects/files and flips publishability per lockstep policy

### Established Patterns
- No build step for the styles package (locked) — copy-verify workflow, CI is the only quality gate besides Browser Mode tests
- Conventional commits; PR-from-day-one with branch protection (Phase 1 D-07/D-08) — `.planning/` docs ride the same feature-branch → PR flow
- Phase 1 CI left hooks for later gates (token/class parity, publint) — Phase 2 wires them in

### Integration Points
- `pnpm-workspace.yaml` already anticipates `packages/*`
- Browser Mode (Vitest + Playwright chromium) is the theming/brand validation vehicle — jsdom renders no CSS, so `color-mix`/dark/focus-ring must be tested in a real browser
- publint + `sideEffects: ["**/*.css"]` are CI gates this phase introduces (STY-07)

</code_context>

<specifics>
## Specific Ideas

- Example brand for fixtures + README: `acme` teal (saturated) — validate `hover/active/soft/focus-ring` in light AND dark (D-04)
- README `[data-brand="acme"]` block is the canonical "how to make your own brand" doc, replacing the stripped inline comments (D-03a)
- Parity is strict: value-for-value token match against `handoff/tokens/` + `.lyra-*` class-name inventory against `handoff/components/**` (D-05, D-06)

</specifics>

<deferred>
## Deferred Ideas

- Per-component CSS subpaths (`./components/button.css`) — not needed at v0.1.0; revisit only if a consumer use case demands granular CSS import (React package handles tree-shaking)
- Importable example brand subpath (`./brands/*.css`) — considered and rejected for v0.1.0 (avoids implying an official brand); could revisit as a "starter brands" satellite later
- Minified single-file dist (Lightning CSS) — explicitly out; add later only if a minified dist is ever needed (per STACK.md)
- Component-level behavioral/class-emission parity — Phase 3/4 (React emits `.lyra-*`); Phase 2 does static class-name inventory only

</deferred>

---

*Phase: 2-Styles Package*
*Context gathered: 2026-07-17*
