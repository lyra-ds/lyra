---
phase: 2
reviewers: [codex]
reviewed_at: 2026-07-18T02:39:02Z
plans_reviewed: [02-01-PLAN.md, 02-02-PLAN.md, 02-03-PLAN.md, 02-04-PLAN.md, 02-05-PLAN.md, 02-06-PLAN.md]
---

# Cross-AI Plan Review — Phase 2

> Reviewed by **Codex** (codex-cli 0.144.4, source-grounded). Claude was skipped for independence (this review ran inside a Claude Code session). Single external reviewer — the Consensus Summary below reflects Codex's findings, not a multi-model vote.

## Codex Review

# Phase 2 plan review

The copy-verify sequencing is strong and source-grounded: the handoff has 209 token declarations, 14 entry imports, and 248 unique `.lyra-*` classes. However, the plans are not execution-ready yet: they would ship CDN icon URLs, omit the required `./styles.css` export, run Browser Mode tests before Chromium is installed in CI, and leave the “40 components” source inventory unresolved.

## 02-01 — Token CSS layer

**Summary:** Good foundation plan. It correctly preserves token values while intentionally removing the Google Fonts CDN import.

**Strengths**

- It accurately targets the seven relevant files and preserves the dark/brand mechanisms present in [`colors.css`](/home/franciscpd/Projects/lyra-ds/handoff/tokens/colors.css:100), [`effects.css`](/home/franciscpd/Projects/lyra-ds/handoff/tokens/effects.css:27), and [`brand.css`](/home/franciscpd/Projects/lyra-ds/handoff/tokens/brand.css:16).
- The CDN-font exception is necessary: the handoff contains a Google Fonts import at [`fonts.css:5`](/home/franciscpd/Projects/lyra-ds/handoff/tokens/fonts.css:5), and the plan explicitly removes it.

**Concerns**

- **MEDIUM:** The comment-stripping rule is ambiguous. The plan says to retain “thin structural” comments, but existing structural comments still contain Portuguese prose, e.g. [`effects.css:4`](/home/franciscpd/Projects/lyra-ds/handoff/tokens/effects.css:4) and [`spacing.css:22`](/home/franciscpd/Projects/lyra-ds/handoff/tokens/spacing.css:22). This can violate the stated “EN banner only/no pt-BR prose” contract inconsistently.

**Suggestions**

- Define an explicit allowlist: retain only ASCII section labels, or strip all comments except the new header.
- Add a package-wide external-URL check here or in 02-02, not only a fonts-specific `@import` check.

**Risk Assessment:** **LOW** in isolation; the font handling is correct, but comment policy needs tightening.

## 02-02 — Component CSS layer

**Summary:** The category layout and class inventory are correct, but verbatim copying currently violates the project’s no-runtime-CDN constraint.

**Strengths**

- The source counts match the plan exactly: buttons 13, forms 29, display 34, navigation 72, feedback 40, files 44, data 16—248 total.
- Keeping seven aggregate category files aligns with the handoff entry imports at [`handoff/styles.css:8`](/home/franciscpd/Projects/lyra-ds/handoff/styles.css:8)-[`14`](/home/franciscpd/Projects/lyra-ds/handoff/styles.css:14).

**Concerns**

- **HIGH:** Copying the CSS verbatim ships external Lucide CDN requests. The source has `unpkg.com` mask URLs in [`forms.css:73`](/home/franciscpd/Projects/lyra-ds/handoff/components/forms/forms.css:73), [`display.css:162`](/home/franciscpd/Projects/lyra-ds/handoff/components/display/display.css:162), and [`navigation.css:81`](/home/franciscpd/Projects/lyra-ds/handoff/components/navigation/navigation.css:81). This directly conflicts with the no-CDN runtime constraint, while the plan only removes the font CDN.
- **HIGH:** The source guide claims 40 components, including `AvatarGroup` and `ToastStack` ([`README.md:52`](/home/franciscpd/Projects/lyra-ds/handoff/design_handoff_lyra_lib/README.md:52)-[`63`](/home/franciscpd/Projects/lyra-ds/handoff/design_handoff_lyra_lib/README.md:63)), but the handoff contains only 38 `.jsx`/`.d.ts` component contracts. The plan never resolves whether those two are standalone exports or compound features.
- **LOW:** The plan says component values are token references only, but the canonical source intentionally includes raw values such as `#fff` in [`forms.css:227`](/home/franciscpd/Projects/lyra-ds/handoff/components/forms/forms.css:227) and fixed pixel dimensions throughout. That acceptance wording is inaccurate.

**Suggestions**

- Add a local-asset decision before copying: package local chevron SVGs or use encoded SVG data URIs, then add `rg 'https?://' packages/styles` as a hard failure. Do not create `components/icons/`; use a neutral `assets/` directory if needed.
- Reconcile the 38-vs-40 inventory before Phase 3: either add contracts for `AvatarGroup`/`ToastStack` or explicitly define them as non-exported compositions.
- Change “all values are `var()`” to “preserve all existing literals and token references exactly.”

**Risk Assessment:** **HIGH** until the CDN and component-inventory gaps are resolved.

## 02-03 — Entry, exports, manifest, README

**Summary:** The entry order and opt-in compat design are right, but the proposed exports map misses a required public path and is not validated from a packed consumer install.

**Strengths**

- The planned 14-import order matches [`handoff/styles.css:1`](/home/franciscpd/Projects/lyra-ds/handoff/styles.css:1)-[`14`](/home/franciscpd/Projects/lyra-ds/handoff/styles.css:14), and that source already excludes compat.
- The explicit `sideEffects: ["**/*.css"]` decision correctly addresses the documented production tree-shaking failure mode in [`PITFALLS.md:9`](/home/franciscpd/Projects/lyra-ds/.planning/research/PITFALLS.md:9)-[`20`](/home/franciscpd/Projects/lyra-ds/.planning/research/PITFALLS.md:20).

**Concerns**

- **HIGH:** The plan requires exactly three export keys and omits `"./styles.css"`. The project explicitly requires this public export ([`PROJECT.md:19`](/home/franciscpd/Projects/lyra-ds/.planning/PROJECT.md:19)), and the stack guidance includes it ([`STACK.md:60`](/home/franciscpd/Projects/lyra-ds/.planning/research/STACK.md:60)-[`65`](/home/franciscpd/Projects/lyra-ds/.planning/research/STACK.md:65)). A consumer importing `@lyra-ds/styles/styles.css` would fail under an exports map without it.
- **MEDIUM:** The plan validates manifest JSON but never validates the packed artifact. `files` allowlists and CSS-relative imports can look correct in the workspace yet fail after publication.

**Suggestions**

- Export both `"."` and `"./styles.css"` to `./styles.css`; retain only token and compat subpaths beyond that.
- Add a pack smoke test in 02-06: `pnpm pack`, inspect the tarball contents, then install it in a minimal temporary bundler fixture that imports both `@lyra-ds/styles/styles.css` and a token subpath.
- Make the README show the actual font import commands/weights, not only package names, so a consumer can achieve the intended typography.

**Risk Assessment:** **HIGH** because the missing `./styles.css` export breaks the declared package API.

## 02-04 — Parity validator and stylelint

**Summary:** The parity gate is valuable, but it is too weak for pixel-fidelity guarantees and the dependency approval/install story is incomplete.

**Strengths**

- The 209-token target is verified by source counts: 19 brand + 109 colors + 20 effects + 25 spacing + 36 typography.
- Comparing directly against `handoff/`, rather than a copied lockfile, is the right anti-drift mechanism.

**Concerns**

- **MEDIUM:** A token name/value multiset does not preserve selector, file, or cascade placement. Moving a dark-theme declaration into `:root` could still pass token parity while breaking `data-theme="dark"`. Likewise, a class-name set does not detect removed/changed declarations inside a class. The intended script is specified at [`02-04-PLAN.md:75`](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-04-PLAN.md:75).
- **MEDIUM:** `stylelint-config-standard` is neither version-pinned nor included in the human legitimacy checkpoint, although its installation is required by [`02-04-PLAN.md:95`](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-04-PLAN.md:95).
- **MEDIUM:** Several tasks cite `CLAUDE.md`, but that file does not exist in this repository. The available authority is [`STACK.md`](/home/franciscpd/Projects/lyra-ds/.planning/research/STACK.md) and [`PROJECT.md`](/home/franciscpd/Projects/lyra-ds/.planning/PROJECT.md).

**Suggestions**

- Compare normalized CSS per source file after removing approved comments, or at least compare declarations keyed by `file + selector + property + occurrence`. Keep the 209/248 summaries for readable reporting.
- Pin and explicitly approve `stylelint-config-standard`.
- Replace all nonexistent `CLAUDE.md` references with the actual planning documents.

**Risk Assessment:** **MEDIUM-HIGH**; it meets the minimum token requirement but not the claimed full copy-fidelity assurance.

## 02-05 — Browser Mode theme/brand tests

**Summary:** Real-browser testing is the right choice, but the planned assertions do not reliably test computed `color-mix` results and this plan bypasses its own dependency-approval gate.

**Strengths**

- Browser Mode is appropriate because theme and `color-mix` behavior are real-CSS concerns; the source derivation is correctly located in [`brand.css:18`](/home/franciscpd/Projects/lyra-ds/handoff/tokens/brand.css:18)-[`23`](/home/franciscpd/Projects/lyra-ds/handoff/tokens/brand.css:23) and [`33`](/home/franciscpd/Projects/lyra-ds/handoff/tokens/brand.css:33)-[`39`](/home/franciscpd/Projects/lyra-ds/handoff/tokens/brand.css:39).

**Concerns**

- **HIGH:** Reading `getComputedStyle(...).getPropertyValue("--accent-hover")` does not reliably force a custom property’s `color-mix()` value to resolve to channels; custom properties preserve token streams. The test plan at [`02-05-PLAN.md:80`](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-05-PLAN.md:80)-[`87`](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-05-PLAN.md:87) needs probe elements that apply each token to a real longhand property.
- **HIGH:** Plan 05 depends on 01–03 but installs packages that its own text says were approved in 02-04. It must depend on 02-04, otherwise it can run before the blocking checkpoint ([`02-04-PLAN.md:53`](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-04-PLAN.md:53)-[`65`](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-04-PLAN.md:65)).
- **MEDIUM:** The plan claims overflow coverage, but implements only one long-text assertion. The handoff has distinct overflow behavior across command palette, forms, files, feedback, and data—for example [`navigation.css:200`](/home/franciscpd/Projects/lyra-ds/handoff/components/navigation/navigation.css:200) and [`files.css:61`](/home/franciscpd/Projects/lyra-ds/handoff/components/files/files.css:61).

**Suggestions**

- Add test-only probe elements with `background-color`, `color`, `border-color`, and `box-shadow` bound to the derived variables; assert computed longhand values after normalizing browser color serialization.
- Add `02-04` to `depends_on`.
- Either add specific scroll/ellipsis tests for the promised surfaces or remove the broad overflow claim.

**Risk Assessment:** **HIGH** until dependency ordering and computed-style test mechanics are corrected.

## 02-06 — CI integration

**Summary:** Preserving the four frozen job names is correct, but the proposed step order will likely fail fresh CI and the “pinned” tools are invoked as floating downloads.

**Strengths**

- The existing workflow does have exactly the four protected jobs and the planned hook locations ([`ci.yml:24`](/home/franciscpd/Projects/lyra-ds/.github/workflows/ci.yml:24)-[`83`](/home/franciscpd/Projects/lyra-ds/.github/workflows/ci.yml:83)).
- Adding gates as steps rather than jobs preserves the branch-protection contract.

**Concerns**

- **HIGH:** The current `test` job runs `pnpm run test` first ([`ci.yml:68`](/home/franciscpd/Projects/lyra-ds/.github/workflows/ci.yml:68)-[`70`](/home/franciscpd/Projects/lyra-ds/.github/workflows/ci.yml:70)). Once styles has a test script, that root command invokes Browser Mode before the plan’s later Chromium-install step. Plan 06 explicitly asks to place additions after existing job commands ([`02-06-PLAN.md:57`](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-06-PLAN.md:57)), so fresh runners can fail before setup.
- **MEDIUM:** `pnpm dlx publint` and `npx playwright` are floating resolution paths, contradicting the plan’s claim that the tools are pinned. Use the lockfile-installed binaries instead.
- **MEDIUM:** The local automated verification omits the Browser Mode test despite the task claiming all four gates are proved green ([`02-06-PLAN.md:75`](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-06-PLAN.md:75)-[`84`](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-06-PLAN.md:84)).

**Suggestions**

- Install Chromium with `pnpm exec playwright install chromium --with-deps` before any root/package test command; then run root tests once, plus parity.
- Use `pnpm exec publint packages/styles` and `pnpm exec playwright …`, backed by exact root devDependencies.
- Add `pnpm --filter @lyra-ds/styles run test` to the automated verification and include the packed-artifact smoke test from 02-03.

**Risk Assessment:** **HIGH**; the proposed CI ordering can fail deterministically on a clean runner.

## Overall risk: HIGH

The plans have a solid structure and accurately reflect most source counts, but four release-critical issues must be fixed before execution: remove all CSS CDN URLs, expose `./styles.css`, order Browser setup before tests, and reconcile the 38 source contracts with the 40-component public commitment.
---

## Consensus Summary

Only one external reviewer (Codex) ran, so this is a single-model verdict rather than a cross-model consensus. Codex read the real `handoff/` sources and surfaced four release-critical issues plus several fidelity/ordering gaps. Overall verdict: **HIGH risk — not execution-ready as written.**

### Highest-Priority Concerns (release-critical, HIGH)

1. **Runtime CDN leak in component CSS (02-02).** Verbatim copy ships Lucide `unpkg.com` mask URLs (`forms.css:73`, `display.css:162`, `navigation.css:81`) — directly violates the no-runtime-CDN constraint. The plans strip only the *font* CDN. Needs a package-wide `rg 'https?://' packages/styles` hard-fail + a local-asset/data-URI decision.
2. **Missing `./styles.css` export (02-03).** The exports map has 3 keys and omits `./styles.css`, which PROJECT.md requires as a public path — `import '@lyra-ds/styles/styles.css'` would fail under the exports map.
3. **Browser Mode dependency-ordering bug (02-05 + 02-06).** (a) Plan 05 installs deps gated by 02-04's blocking checkpoint but `depends_on` omits 02-04, so it can run before approval. (b) CI runs root `pnpm run test` (Browser Mode) *before* the Chromium-install step → deterministic fresh-runner failure.
4. **color-mix test won't actually resolve (02-05).** `getComputedStyle().getPropertyValue('--accent-hover')` returns the unresolved token stream, not channels. Needs probe elements binding each derived var to a real longhand (background-color/color/border-color/box-shadow).

### Secondary Concerns (MEDIUM)

- **Parity script is too weak for pixel-fidelity (02-04).** A token/class *multiset* doesn't preserve selector/file/cascade placement — a dark declaration moved into `:root` still passes. Compare declarations keyed by `file+selector+property+occurrence`.
- **38-vs-40 component inventory unresolved (02-02).** Handoff README claims 40 (incl. AvatarGroup, ToastStack); only 38 `.jsx`/`.d.ts` contracts exist. Reconcile before Phase 3.
- **Floating tool resolution in CI (02-06).** `pnpm dlx publint` / `npx playwright` contradict the "pinned" claim — use lockfile-installed `pnpm exec` binaries.
- **`stylelint-config-standard` not pinned / not in the legitimacy checkpoint (02-04).**
- **No packed-artifact smoke test (02-03/02-06).** `files` allowlist + relative CSS imports can pass in-workspace yet break post-publish — add `pnpm pack` + install-in-fixture.

### Divergent / Needs-Verification (do NOT auto-incorporate)

- **Codex reports "CLAUDE.md does not exist" (02-04 MEDIUM).** This is only half right: the project instructions live at **`.claude/CLAUDE.md`**, not repo-root `CLAUDE.md` — Codex looked at the root and missed it. If plan `read_first` fields cite a bare `CLAUDE.md` path, correct them to `.claude/CLAUDE.md` (a real stale-path fix); but Codex's implication that the constraints are ungoverned is wrong — the constraints are authoritative in `.claude/CLAUDE.md`.
