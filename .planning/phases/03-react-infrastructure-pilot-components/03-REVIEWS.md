---
phase: 3
reviewers: [codex]
reviewed_at: 2026-07-19T02:50:00Z
plans_reviewed: [03-01-PLAN.md, 03-02-PLAN.md, 03-03-PLAN.md, 03-04-PLAN.md, 03-05-PLAN.md, 03-06-PLAN.md, 03-07-PLAN.md, 03-08-PLAN.md, 03-09-PLAN.md]
---

# Cross-AI Plan Review — Phase 3

## Codex Review

# Cross-AI Plan Review — Phase 3

## Summary

The phase is thoughtfully decomposed and has unusually strong packaging, CI, SSR, accessibility, and supply-chain coverage. However, source verification exposed several implementation blockers: the icon scan described in Plan 03-03 cannot produce 54 icons; `usePresence(open)` lacks any way to observe the panel’s animation events; the Input and Dialog prop interfaces conflict with inherited native attributes; and Dialog initial focus can race with the deferred Portal mount. These issues affect core phase outcomes, so the plans should be revised before execution.

## Plan 03-01 — React package scaffold

### Summary

The scaffold matches the existing monorepo conventions well and establishes the right package-quality gates. Its main weakness is intentionally introducing a broken build for several waves.

### Strengths

- Correctly replaces the current private placeholder at `packages/react/package.json:1-6`.
- Package-level Vitest config is consistent with the existing package-local Browser Mode setup at `packages/styles/vitest.config.ts:22-31`.
- Per-condition declarations, subpath exports, `sideEffects: false`, and no `./internal` export are appropriate for RCT-03/RCT-04.
- New checks fit the four frozen CI jobs documented at `.github/workflows/ci.yml:1-7`.

### Concerns

- **MEDIUM:** The plan explicitly creates five tsup entries whose component files do not exist until Wave 3 and says the build remains red. The root build already recursively runs every package build (`package.json:13`), so CI will remain predictably red after Plan 03-01. This weakens per-plan verification and complicates bisecting.
- **MEDIUM:** No plan adds a changeset, although repository policy requires one for any PR touching either published package (`CONTRIBUTING.md:37-44`).
- **LOW:** The manual legitimacy checkpoint is expensive and checks popularity/repository identity, but not package integrity, provenance, or maintainer changes in a machine-verifiable way.

### Suggestions

- Create typed placeholder entries that build successfully, or defer the `build` script/entry expansion until the pilot files exist.
- Add one phase-level changeset, preferably in Plan 03-08.
- Record registry provenance/integrity alongside the human package-name check.

### Risk Assessment

**MEDIUM** — architecture is sound, but temporary guaranteed CI failure is avoidable.

---

## Plan 03-02 — Dialog CSS extensions

### Summary

The additive-only CSS and explicit parity allowlist are a good fit for the project’s strict handoff policy. The proposed close-button CSS is incomplete for the stated keyboard and long-title contracts.

### Strengths

- The current Dialog CSS and entrance keyframes are clearly isolated at `packages/styles/components/feedback/feedback.css:66-120`.
- Appending extensions avoids disrupting the parity script’s ordered declaration comparison at `tools/parity/parity.mjs:418-454`.
- Keeping `EXPECTED_CLASSES = 248` is correct because that count describes the handoff inventory (`tools/parity/parity.mjs:472-499`).
- Exact-name allowlisting is materially safer than weakening parity globally.

### Concerns

- **HIGH:** The proposed `.lyra-dialog__close` has no `:focus-visible` styling, although the UI contract says every interactive pilot must expose a focus ring. The existing borrowed class only has hover styling (`packages/styles/components/display/display.css:76-87`), so copying it does not solve keyboard visibility.
- **MEDIUM:** `width: 28px` alone does not guarantee a 28px hit area inside the flex header. The header uses flex layout (`feedback.css:89-95`), and the button can shrink under a long title.
- **LOW:** The exit target remains ambiguous: Plan 03-02 permits the overlay to end at either opacity `0.6` or transparent. That makes fidelity and tests nondeterministic.

### Suggestions

- Add an allowlisted `.lyra-dialog__close:focus-visible` rule using `var(--shadow-focus)`.
- Add `flex: 0 0 28px` or `min-width: 28px`.
- Lock exact exit keyframes and test their computed animation names/durations.

### Risk Assessment

**MEDIUM** — parity design is strong, but the proposed CSS does not yet satisfy its own accessibility and long-title requirements.

---

## Plan 03-03 — Icon registry generator

### Summary

This plan contains a blocking source-analysis error. The specified regex scans only literal `<Icon name="…">` props and therefore produces 50 names, not 54, while the handoff also uses numerous dynamic icon sources.

### Strengths

- Generated-and-committed output with a read-only `--check` mode is an excellent drift-control mechanism.
- Sorted output, exact count checks, and a vendored GitHub exception are sensible.
- The zero-dependency script pattern is well grounded in `tools/parity/parity.mjs:66-98`.

### Concerns

- **HIGH:** The generator specification at `03-03-PLAN.md:73` only extracts literal `<Icon name="…">` values. Source verification finds 50 such unique values, not 54.
- **HIGH:** Dynamic uses are real handoff requirements and are excluded by that regex:

  - The icon specimen declares a static `names` array containing additional values such as `calendar`, `heart`, `eye`, `filter`, `code`, `zap`, `sun`, `moon`, and `book-open` at `handoff/components/icons/icons.card.html:21-27`.
  - FileUpload returns `image`, `file-text`, `file-spreadsheet`, `file-archive`, `film`, and `file` dynamically at `handoff/components/files/FileUpload.jsx:11-19`.
  - FileManager additionally returns `music` at `handoff/components/files/FileManager.jsx:13-22`.
  - Conditional icon props occur at `handoff/ui_kits/website/sections.jsx:19-22`.

  The union represented by these source locations is substantially larger than 54, so the claim that Phase 4 “never hits a missing icon” is not established.
- **MEDIUM:** The generator only scans `.jsx` and `.html`; later TSX handoff additions would silently be excluded.
- **MEDIUM:** Plan 03-03 does not validate generated imports against the installed Lucide exports itself; it relies on a later parallel plan’s typecheck.

### Suggestions

- Recompute and explicitly approve the canonical icon inventory. Based on the current source patterns, it is closer to 68 names than 54.
- Use a small syntax-aware scanner or an explicit source manifest that includes:

  - Literal Icon props.
  - Literal arrays used as Icon names.
  - String-returning icon resolver functions.
  - Literal branches inside dynamic expressions.

- Fail with source locations for unresolvable dynamic uses.
- Add a generator test fixture covering literal, conditional, array-driven, and resolver-driven icons.

### Risk Assessment

**HIGH** — as written, the generator fails its exact-count assertion and cannot satisfy RCT-05.

---

## Plan 03-04 — Internal utilities

### Summary

Centralizing these utilities is correct, but the presence API is internally inconsistent, and several reusable primitives need more explicit edge contracts.

### Strengths

- The private `internal/` boundary aligns with the planned absence of an exports-map entry.
- SSR guards are appropriately confined to effects/render paths.
- Live focusable queries are better than cached NodeLists for changing dialog content.
- Timeout fallback for reduced-motion or missed animation events is essential.

### Concerns

- **HIGH:** The declared API is `usePresence(open) → { mounted, closing }` (`03-04-PLAN.md:67-70`), but the implementation is required to listen for `animationend`/`transitionend` “on the panel node” (`03-04-PLAN.md:115-121`). No panel ref or completion callback is passed, so the hook cannot implement that mechanism.
- **MEDIUM:** The proposed focusable selector does not mention visibility, `hidden`, `inert`, `aria-hidden`, or elements within hidden ancestors. A disabled or visually hidden candidate can become the wrap target.
- **MEDIUM:** Scrollbar compensation uses only the scrollbar delta. If the body already has padding-right, replacing it with the delta causes a layout shift.
- **MEDIUM:** Scroll locking is not described as reference-counted. Nested Dialog/Drawer/CommandPalette instances can unlock the body while another overlay remains open.
- **LOW:** Tasks are marked TDD but create no utility-level tests; several contracts rely entirely on later integration tests.

### Suggestions

- Change presence to one concrete API, for example:

  - `usePresence(open, elementRef)`, or
  - `{ mounted, closing, onAnimationEnd }`.

- Make `onAnimationEnd` ignore bubbled child animations by checking `event.target === event.currentTarget`.
- Filter focusables by actual visibility and inert/hidden ancestry.
- Add existing computed body padding to the scrollbar width and make locks reference-counted.
- Add focused hook tests for reopen-during-close, controlledness switches, and nested locks.

### Risk Assessment

**HIGH** — the presence hook cannot be implemented from its current signature.

---

## Plan 03-05 — Button and Icon pilots

### Summary

The Button conversion is close to executable and its tests form a useful template. The Icon pilot inherits the registry blocker and introduces an additive class that should be explicitly reconciled with class parity policy.

### Strengths

- Button class construction follows the handoff exactly at `handoff/components/buttons/Button.jsx:19-35`.
- Loading preserves the label and blocks interaction, matching the existing DOM.
- `forwardRef`, consumer class append order, named exports, SSR tests, and local Lucide rendering are appropriate.
- Avoiding a sibling Icon import in simple components supports isolation.

### Concerns

- **HIGH:** All Icon implementation and 54-icon tests depend on the invalid inventory from Plan 03-03.
- **MEDIUM:** The React wrapper always adds `.lyra-icon`, but the canonical Icon prototype only forwards consumer `className` (`handoff/components/icons/Icon.jsx:10-17`). This is a deliberate behavioral extension, yet it is not documented alongside the CSS additive-extension policy.
- **MEDIUM:** The plan requires production silence for unknown names but only specifies a development warning test. Browser bundlers may replace `process.env.NODE_ENV`, so production behavior needs a dedicated build/test path.
- **LOW:** The icon-only Button test demonstrates `aria-label`, but the component does not actually enforce it; the requirement is documentation/runtime-axe guidance rather than an API guarantee.

### Suggestions

- Block this plan on a corrected canonical registry.
- Record `.lyra-icon` as a deliberate class-API extension and add it to class-emission expectations.
- Add a production bundle test for the warning branch.
- Document clearly that icon-only accessibility is consumer-enforced unless a dedicated prop/API is introduced.

### Risk Assessment

**HIGH** because of the registry dependency; otherwise **MEDIUM**.

---

## Plan 03-06 — Input pilot

### Summary

This plan has two TypeScript/API blockers: inherited native prop conflicts and an incompatible interpretation of native `onChange`.

### Strengths

- Preserving the bare-input early return matches `handoff/components/forms/Input.jsx:17-31`.
- Label, hint, error, and modifier-class coverage is comprehensive.
- The real-browser controlled/uncontrolled tests are a valuable Phase 4 template.
- Ref placement on the actual input is correct.

### Concerns

- **HIGH:** `InputProps extends React.InputHTMLAttributes<HTMLInputElement>` while redefining `size` as `"sm" | "md" | "lg"` (`handoff/components/forms/Input.d.ts:5-15`). Native input attributes already define numeric `size`; the interface will fail under the repository’s strict TypeScript setting (`tsconfig.base.json:2-10`). The plan repeats the invalid shape without resolving it.
- **HIGH:** `useControllableState<T>` calls `onChange(nextValue)` (`03-04-PLAN.md:85-91`), but native Input `onChange` is a `ChangeEventHandler<HTMLInputElement>`. Plan 03-06 says to pass native `value/defaultValue/onChange` through that helper, conflating a value callback with an event callback.
- **MEDIUM:** Generated `aria-describedby` replaces rather than merges a consumer-provided `aria-describedby`.
- **MEDIUM:** Label-derived IDs can collide when two inputs share a label. The canonical prototype derives IDs this way at `handoff/components/forms/Input.jsx:6-7`, but the production wrapper should not repeat duplicate DOM IDs.
- **LOW:** The plan does not specify how `value` types such as `number` or `readonly string[]` interact with an internal string value.

### Suggestions

- Define props with explicit omission, for example:

  `Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>`

- Keep native input controlled behavior native. The component can pass `value`, `defaultValue`, and the original event to `onChange` without a generic value-state hook.
- If `useControllableState` must be piloted, expose a separate value callback such as `onValueChange`, but that changes the handoff contract and needs a decision.
- Merge generated and consumer `aria-describedby` IDs.
- Use `useId()` for uniqueness; do not treat label-derived IDs as public API unless explicitly required.

### Risk Assessment

**HIGH** — the planned interface and state helper contract do not typecheck together.

---

## Plan 03-07 — Dialog pilot

### Summary

The behavioral matrix is strong, but Portal timing, inherited props, portaled axe coverage, and close-button styling need revision.

### Strengths

- The canonical DOM is correctly grounded in `handoff/components/feedback/Dialog.jsx:9-25`.
- Target-identity checking for overlay clicks preserves inside-panel behavior.
- Keyboard, close-path opt-outs, focus restoration, scroll lock, exit presence, and SSR-null coverage are well chosen.
- Avoiding a Dialog→Icon dependency is a good tree-shaking decision.

### Concerns

- **HIGH:** `Portal` returns null until its own `useEffect` sets mounted (`03-04-PLAN.md:92`). A Dialog initial-focus effect keyed only by `open` can run while `panelRef.current` is null and will not rerun when Portal internally mounts. Initial focus therefore races and can fail deterministically.
- **HIGH:** `DialogProps extends React.HTMLAttributes<HTMLDivElement>` while redefining `title` as `ReactNode` (`handoff/components/feedback/Dialog.d.ts:4-12`). Native `HTMLAttributes.title` is a string attribute; the production interface must omit it before redefining.
- **MEDIUM:** An `axe.run(container)`-style test will miss Dialog markup portaled to `document.body`. The test plan says to run axe but does not require scanning the portal root.
- **MEDIUM:** If dark theme is applied only to the rendered fixture wrapper—as the current styles harness does at `packages/styles/tests/brand-theme.test.ts:86-94`—the body-level portal will not inherit it. Dialog may be tested in light theme twice.
- **MEDIUM:** The proposed close-button CSS has no focus-visible state and may shrink below 28px, as noted under Plan 03-02.
- **MEDIUM:** The plan does not clearly say whether the close button is omitted when optional `onClose` is absent, as the canonical prototype does at `Dialog.jsx:16-20`.
- **LOW:** Focus restore should occur when controlled `open` actually becomes false, not merely when a close request is emitted and potentially ignored by the parent.

### Suggestions

- Move focus initialization into a component rendered inside the portal, or expose Portal mounted state/callback.
- Define `DialogProps` using `Omit<HTMLAttributes<HTMLDivElement>, 'title'>`.
- Run axe against `document.body` or the actual portal container.
- Apply theme state to `document.documentElement`, matching the production contract.
- Explicitly condition the close button on `onClose`.
- Test the case where `onClose` is called but the parent intentionally keeps `open=true`.

### Risk Assessment

**HIGH** — several core Dialog success criteria are not guaranteed by the planned mechanism.

---

## Plan 03-08 — Barrel, package gates, conventions, CI

### Summary

This is a strong consolidation plan, but its gates rely on the incorrect registry and omit release-policy and broader CDN checks.

### Strengths

- publint plus attw is the right packaging combination.
- Per-import size limits correctly avoid ignoring Lucide.
- Root-barrel plus subpath testing covers both modern tree-shaking and direct isolation.
- CI modifications respect the existing four-job contract at `.github/workflows/ci.yml:24-96`.
- The conventions note is a useful bridge into Phase 4.

### Concerns

- **HIGH:** Icon budget calibration against the incorrect 54-icon registry would bless an incomplete bundle.
- **MEDIUM:** No changeset is added despite `CONTRIBUTING.md:37-44`.
- **MEDIUM:** Checking only `unpkg.com` does not establish “no CDN host reference.” The repository policy is broader (`CONTRIBUTING.md:70-73`).
- **MEDIUM:** Assertions expect only five named files in each output format, while tsup splitting may emit shared chunks. The plan should either disable splitting or explicitly validate allowed chunks.
- **LOW:** The default-attw-or-node16 fallback in the local verification can mask a default-profile problem before the required rationale is written.

### Suggestions

- Recalibrate only after the registry inventory is corrected.
- Add a phase changeset here.
- Scan built JavaScript for all `https?://`, known CDN domains, dynamic imports, and `lucide-static`, with explicit source-map exclusions if needed.
- Decide whether `splitting: false` is required for the “one file per component” contract.

### Risk Assessment

**MEDIUM**, rising to **HIGH** until the upstream registry issue is fixed.

---

## Plan 03-09 — Packed Vite and Next.js smoke fixtures

### Summary

Real tarball installation into isolated consumers is excellent and directly addresses a common packaging blind spot. The Vite fixture dependency list and CJS coverage are incomplete.

### Strengths

- Extending the existing leak-safe temp lifecycle at `tools/pack-smoke/pack-smoke.mjs:54-67` is well grounded.
- Real install is necessary because React has a Lucide dependency; the existing extraction approach is only valid for the zero-dependency styles package (`pack-smoke.mjs:117-126`).
- Required/forbidden tarball entries extend the existing checks at `pack-smoke.mjs:70-115`.
- Nested fixtures under `tools/smoke/*` are not direct matches for the current `tools/*` workspace package glob (`pnpm-workspace.yaml:3-6`), so keeping runtime installs outside the workspace is reasonable.
- Importing both the root barrel and a subpath is good resolution coverage.

### Concerns

- **HIGH:** The Vite fixture package is specified with only `@vitejs/plugin-react` and TypeScript (`03-09-PLAN.md:85`). Its TSX entry also needs exact-pinned `react`, `react-dom`, `@types/react`, and `@types/react-dom`. Relying on npm peer auto-install undermines reproducibility.
- **MEDIUM:** Vite itself should be pinned in the fixture if the plugin resolves it as a peer. Running the root binary does not necessarily make the `vite` package resolvable to a plugin loaded from the temp fixture.
- **MEDIUM:** Vite and Next both exercise ESM-oriented consumers. Neither actually executes `require('@lyra-ds/react')` or a CommonJS subpath, so the claimed dual-runtime proof still relies entirely on metadata tools.
- **MEDIUM:** The statement that Next prerender proves `renderToString` is stronger than the mechanism. Because every dist entry receives `"use client"`, Next treats the imported components as client boundaries. The dedicated node SSR tests remain the reliable direct proof.
- **LOW:** The no-CDN output assertion again appears limited to `unpkg.com`.

### Suggestions

- Pin the full React/TypeScript/Vite fixture dependency set explicitly.
- Add a tiny CommonJS consumer smoke test for the root and one subpath.
- Describe Next as an RSC/client-boundary and package-resolution proof, not a substitute for the direct `renderToString` suite.
- Preserve npm install logs on failure while still cleaning temporary directories.

### Risk Assessment

**MEDIUM** — strong approach, but the fixture as specified may not install reproducibly.

---

# Overall Risk Assessment

**HIGH**

The phase design is fundamentally good, but four blockers should be resolved before execution:

1. Replace the incorrect 54-icon regex inventory with a source-complete canonical set.
2. Give `usePresence` an element/event integration API.
3. Repair Input and Dialog prop inheritance and the native Input `onChange` contract.
4. Make Dialog focus initialization portal-aware and ensure axe/theme tests scan the actual portal.

After those changes, plus adding a changeset and pinning the smoke-fixture dependencies, the phase should drop to **MEDIUM/LOW** implementation risk.
---

## Consensus Summary

Single-reviewer run (Codex only) — no cross-reviewer consensus is possible; the findings below are Codex's verdict, source-grounded with file:line evidence against the actual repo (handoff sources, Phase 2 tooling, CI workflow).

### Agreed Strengths
(single reviewer — Codex's headline strengths)
- Phase decomposition, packaging/CI/SSR/a11y/supply-chain coverage rated "unusually strong"
- Generated-and-committed icon registry with `--check` drift mode called an excellent drift-control mechanism
- Real tarball install into isolated Vite/Next consumers directly addresses a common packaging blind spot
- Additive-only CSS + exact-name parity allowlist materially safer than weakening parity globally

### Agreed Concerns
(single reviewer — Codex's blocking findings, highest priority)
1. **HIGH (03-03, 03-05, 03-08):** The literal `<Icon name="…">` regex yields 50 unique names, not 54; dynamic icon sources (icons.card.html names array, FileUpload/FileManager resolver functions, conditional props in sections.jsx) push the true union closer to ~68. The exact-count assertion fails as written and RCT-05's "Phase 4 never hits a missing icon" claim is not established.
2. **HIGH (03-04, 03-07):** `usePresence(open) → { mounted, closing }` has no panel ref or completion callback, so it cannot listen for animationend/transitionend "on the panel node" as required. Dialog initial focus also races the deferred Portal mount.
3. **HIGH (03-06, 03-07):** Prop-interface conflicts with inherited native attributes — Input redefines `size` without `Omit`, Dialog redefines `title` without `Omit` — will fail strict TypeScript; `useControllableState`'s value-callback `onChange` conflates with the native ChangeEventHandler contract.
4. **HIGH (03-09):** Vite smoke fixture lacks pinned `react`/`react-dom`/`@types/*` deps; install is not reproducible. No CJS consumer actually executes `require()`.
Also MEDIUM: missing changeset (CONTRIBUTING.md requires one), `.lyra-dialog__close` lacks focus-visible styling and can shrink under long titles, CDN scan limited to unpkg.com, axe/theme tests may miss the body-level portal, intentionally-red build across waves 1–2.

### Divergent Views
None — single reviewer.
