# Phase 3: React Infrastructure & Pilot Components - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the `@lyra-ds/react` build/test/CI machinery plus four pilot components — **Button** (simple), **Input** (form/controlled), **Dialog** (overlay), and **Icon** — that lock the conversion conventions Phase 4 will repeat across all 40 components. Scope: tsup dual ESM+CJS with per-component entries, publint + attw + size-limit CI gates, packed-tarball validation in scratch Vite and Next.js apps, `internal/` utilities (focus trap, portal, controllable state, scroll lock, presence, SSR guards, `cx`), the curated Icon registry (no CDN), a conventions note (`packages/react/CONVENTIONS.md`), and the test template (smoke + keyboard + axe + `renderToString`). Requirements: RCT-03, RCT-04, RCT-05.

Out of scope: the other 36 components (Phase 4), docgen/llms.txt (Phase 5), docs site (Phase 6), publishing to npm (Phase 7).

</domain>

<decisions>
## Implementation Decisions

### Icon API & curated registry
- **D-01:** **Registry = exactly the 54 Lucide icons used in the handoff** (scan of `handoff/components/**` + `handoff/ui_kits/**`). Smallest possible surface; Phase 4 never hits a missing icon.
- **D-02:** **Registry is generated + committed + CI-guarded.** A script in `tools/` scans the handoff and generates `icon-registry.ts` (static `lucide-react` imports + name union). The generated file is committed; CI fails if it drifts from the handoff scan — same pattern as the Phase 2 parity script.
- **D-03:** **Escape hatch = `icon` prop accepting a Lucide component directly** (`<Icon icon={Rocket} />`). Consumer imports from `lucide-react`; their bundler tree-shakes it. No global registration API, no cost to our bundle.
- **D-04:** **`name` is typed as a literal union of the 54** (`IconName`), generated alongside the registry. Editor autocomplete + compile-time error for out-of-registry names. Refines (doesn't break) the handoff `name: string` contract.
- **D-05:** **Unknown `name` at runtime → `console.warn` in dev (pointing at the `icon` escape hatch) + render `null`.** Silent in production; never breaks consumer UI.
- **D-06:** **Icon renders inline `<svg>` via lucide-react** (class `.lyra-icon`, `currentColor`, size via props). The prototype's `<span>` + CSS mask was a CDN workaround — drop it, keeping visual fidelity (size/color identical).
- **D-07:** **size-limit budgets are per-minimal-import:** measure the cost of importing only `Button` and only `Icon` in a bundled app; tight limits calibrated at execution with ~20% headroom. Proves both RCT-03 (isolation) and RCT-05 (no ~1,400-icon set in bundle).

### Wrapper API conventions (the Phase 4 pattern)
- **D-08:** **`forwardRef` on every component that renders a DOM element**, ref pointing at the primary element. Only pattern safe across the `react >=18 <20` peer range.
- **D-09:** **Always merge consumer `className`/`style`:** `.lyra-*` classes always present, consumer `className` appended after; `style` shallow-merged over component inline styles. The `.lyra-*` classes are public API and can never be replaced.
- **D-10:** **Rest-spread convention:** known props extracted, `...rest` spread onto the root element (the one the `.d.ts` extends). Predictable pass-through for `aria-*`, `data-*`, handlers.
- **D-11:** **Zero runtime deps beyond `lucide-react`:** tiny internal `cx()` helper in `internal/` instead of clsx.
- **D-12:** **Named exports only** — no default exports anywhere (matches the handoff `export declare function` contracts).
- **D-13:** **Import surface = root barrel + per-component subpaths** (`@lyra-ds/react` and `@lyra-ds/react/button`). Subpaths guarantee isolation even with naive bundlers — direct proof of RCT-03. Exports map scales to 40 entries in Phase 4.
- **D-14:** **Controlled/uncontrolled contract:** `value`/`defaultValue` + `onChange` via a `useControllableState` helper in `internal/` (controlled when `value !== undefined`). Locks the RCT-09 pattern now via the Input pilot.

### Dialog behavior (overlay contract pilot)
- **D-15:** **`div` + `role="dialog"` + `aria-modal="true"`** keeping the prototype DOM (`.lyra-dialog-overlay > .lyra-dialog`), with our own focus trap in `internal/`. Native `<dialog>` rejected (fights the handoff overlay CSS; inconsistent focus behavior).
- **D-16:** **Close paths: Esc + overlay click + × button, each guarded by opt-out flags** `closeOnEsc` / `closeOnOverlayClick` (default `true`). Extends the handoff contract deliberately (user choice over the minimal-contract recommendation).
- **D-17:** **Exit animation: keep mounted while closing** via a presence helper (`usePresence`) in `internal/` that waits for the transition before unmounting. Drawer/Toast reuse this in Phase 4. (User choice over the immediate-unmount recommendation.)
- **D-18:** **Exit-animation CSS lives in `@lyra-ds/styles` as a documented additive extension** (e.g., `.lyra-dialog--closing`, reverse of the entry transform). The Phase 2 parity script must be adjusted to allow documented additive extensions (handoff ⊆ package — handoff declarations still match exactly; additions are explicitly listed). Entry-animation constraint still holds (transform only, never `opacity: 0` at frame start).
- **D-19:** **Close button gets its own additive class `.lyra-dialog__close`** (same visual as the prototype's borrowed `.lyra-tag__remove` + inline style: 28px hit area, 14px icon). No inline styles, no borrowed Tag class.
- **D-20:** **Initial focus: first focusable element in the panel, fallback to the panel itself** (`tabIndex={-1}`); title wired via `aria-labelledby` + `useId`. APG pattern.
- **D-21:** **Portal target: optional `container?: HTMLElement` prop, default `document.body`** with SSR guard. (User choice over fixed-target recommendation — flexibility for shadow DOM/iframes.)
- **D-22:** **Scroll lock while open:** `useScrollLock` in `internal/` with scrollbar-width compensation.

### Conventions note & test template
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Conversion spec & architecture (project-wide)
- `handoff/design_handoff_lyra_lib/README.md` — canonical conversion spec: locked architecture, required fixes (Icon CDN, portals, a11y)
- `.planning/research/STACK.md` — tsup 8.5.1 / TS 5.9.3 pinned, per-component entries + `sideEffects: false`, lucide-react static map, Vitest Browser Mode, size-limit/publint/attw gate guidance
- `.planning/research/ARCHITECTURE.md` — package boundaries; react = thin wrappers over styles, no CSS imports in react package
- `.planning/research/PITFALLS.md` — packaging metadata pitfalls (exports maps, dual ESM+CJS, tree-shaking)

### Pilot component contracts (the API being implemented)
- `handoff/components/buttons/Button.d.ts` + `Button.jsx` — pilot 1 (simple; extends `ButtonHTMLAttributes`, 5 variants, loading/full)
- `handoff/components/forms/Input.d.ts` + `Input.jsx` — pilot 2 (form/controlled contract)
- `handoff/components/feedback/Dialog.d.ts` + `Dialog.jsx` — pilot 3 (overlay: controlled `open`/`onClose`, title/footer; prototype DOM to preserve)
- `handoff/components/icons/Icon.d.ts` + `Icon.jsx` — pilot 4 (the CDN-mask prototype being replaced by lucide-react registry)
- `handoff/components/**/*.prompt.md` (pilots) — usage examples that double as test fixtures

### Styles package (the CSS the wrappers emit classes for)
- `packages/styles/` — Phase 2 output; `.lyra-*` classes are the shared public API
- `tools/` parity script from Phase 2 — must learn documented additive extensions (D-18/D-19) without weakening handoff parity

### Requirements & policy
- `.planning/REQUIREMENTS.md` — RCT-03, RCT-04, RCT-05 (this phase)
- `.planning/PROJECT.md` — locked constraints (CSS-first thin wrappers, no CDN, fonts peer, peerDeps react >=18)
- `.planning/phases/02-styles-package/02-CONTEXT.md` — Phase 2 decisions (parity strictness D-05/D-06, comment policy, Browser Mode patterns)
- `.planning/phases/01-monorepo-foundation-governance/01-CONTEXT.md` — Phase 1 decisions (EN governance D-04, lockstep versioning D-06, PR flow D-07/D-08)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/styles/` — complete, shipped; the react package's peer visual layer (zero CSS imports in react per RCT-03)
- Phase 2 Vitest Browser Mode harness (chromium, entry-CSS import pattern, canvas color reads) — extend with react projects instead of rebuilding
- Phase 2 packed-artifact smoke test (vite consumer build over `pnpm pack` tarball) — the pattern D-27 extends to Vite + Next.js fixtures
- Phase 2 parity script (zero-dep Node tokenizer in `tools/`) — the pattern for the icon-registry scan script (D-02) and the file that gains the additive-extensions allowlist (D-18)
- `packages/react/package.json` — placeholder (`private: true`, 0.0.0); Phase 3 fills exports/sideEffects/files and real build

### Established Patterns
- CI gates land as STEPS inside the four frozen jobs (lint/typecheck/test/build), never new jobs (Phase 2 D/Plan 02-06)
- Tools pinned via `pnpm exec` with exact versions; conventional commits; PR-from-day-one with 4 required checks
- Comment/JSDoc policy: EN canonical; pt-BR JSDoc from handoff `.d.ts` gets translated during conversion
- `save-exact=true` npmrc; engines pinned `>=24 <25`

### Integration Points
- `pnpm-workspace.yaml` already includes `packages/*` and anticipates `tools/*`
- Root `vitest.config` gains projects: react browser-mode + react node (SSR) alongside the styles project
- CI workflow hooks from Phase 1 ready for publint/attw/size-limit steps for the react package
- Changesets `fixed` group already covers `@lyra-ds/styles` + `@lyra-ds/react` (lockstep)

</code_context>

<specifics>
## Specific Ideas

- The 54-icon count comes from a live scan (`grep` of `name="..."` across `handoff/`) — the registry generator should reproduce and pin this scan
- The prototype Dialog's × button borrows `.lyra-tag__remove` with inline 28px styles — that exact visual becomes `.lyra-dialog__close` (D-19)
- Additive CSS extensions (D-18/D-19) must be explicitly documented (a visible list) so parity stays auditable: handoff declarations match exactly, additions are enumerated
- Dev-only warnings should use the standard `process.env.NODE_ENV !== "production"` guard so they strip from production bundles

</specifics>

<deferred>
## Deferred Ideas

- **Expanded curated icon set (~100–150)** — revisit if consumers frequently need icons outside the handoff 54 (the `icon` prop escape hatch covers the gap meanwhile)
- **Global icon registration API** (`registerIcons`) — rejected for v0.1.0 (global state); reconsider only with real demand
- **Placeholder glyph for unknown icon names** — rejected in favor of dev-warn + null
- **Exit animations for other overlays (Drawer, Toast, CommandPalette)** — the `usePresence` + additive-CSS pattern from D-17/D-18 is the template; actual CSS lands with each component in Phase 4

</deferred>

---

*Phase: 3-React Infrastructure & Pilot Components*
*Context gathered: 2026-07-18*
