---
phase: 2
reviewers: [codex]
reviewed_at: 2026-07-18T03:24:13Z
review_round: 2
plans_reviewed: [02-01-PLAN.md, 02-02-PLAN.md, 02-03-PLAN.md, 02-04-PLAN.md, 02-05-PLAN.md, 02-06-PLAN.md]
---

# Cross-AI Plan Review — Phase 2 (Round 2, re-review after incorporating Round 1)

> Reviewed by **Codex** (codex-cli 0.144.4, source-grounded). Round-1 review is preserved in git (commit `2ecb3ce`). This round verifies the Round-1 fixes held and hunts for regressions the revisions introduced. Single external reviewer (Claude skipped for independence).

## Prior-findings status (Round 1 → now)

| Round-1 finding | Status this round |
|---|---|
| CDN chevron masks (HIGH) | **Partially fixed** — all 3 masks rewritten to inline `data:` URIs, but the proposed `stroke="#000"` encoding is malformed (`#` truncates the SVG in a URL). |
| Missing `./styles.css` export (HIGH) | **Resolved** — 02-03 adds `"./styles.css"`; wildcard does not collide. |
| Browser Mode dependency + CI ordering (HIGH) | **Resolved** — 02-05 depends on 02-04; 02-06 installs Chromium before root `test`. |
| color-mix computed values (HIGH) | **Mechanism resolved** — probes bind vars to real longhands; formula-direction assertions still weak. |
| Weak multiset parity / stylelint pin (MED) | **Partially resolved** — placement-aware key + pinned stylelint; parser contract + at-rule ancestry still incomplete. |
| Packed-artifact smoke test (MED) | **Partially fixed** — installs a tarball but never imports CSS through a bundler. |

## Codex Review (Round 2)

# Phase 2 re-review — verdict: **not execution-ready**

The revision fixes several prior blockers, but introduces/retains a few release-relevant gaps. The biggest are the malformed proposed SVG data URIs, an incorrect resolution of the 40-component inventory, and a pack smoke test that never performs a consumer CSS import.

## Prior findings status

| Prior finding | Status |
|---|---|
| CDN chevron masks | **Partially fixed.** All six source mask declarations are accounted for, but the proposed `#000` data-URI encoding is invalid. |
| `./styles.css` export | **Resolved.** Plan 03 explicitly adds it. |
| Chromium ordering/dependency | **Resolved.** Plan 05 depends on 02-04; Plan 06 inserts browser install before root tests. |
| `color-mix()` computed values | **Mechanism resolved.** Probes bind vars to longhands; formula assertions still need tightening. |
| Placement-aware parity/stylelint/pinned executables | **Partially resolved.** Better parity design and pinned stylelint; parser coverage and publint pin remain incomplete. |
| Packed artifact smoke test | **Partially fixed.** It installs a tarball, but does not actually load CSS through a consumer bundler. |

## 02-01 — Token layer

### Summary

The dark-theme and brand copy plan is source-aligned: the canonical brand derivations are in [brand.css:16](/home/franciscpd/Projects/lyra-ds/handoff/tokens/brand.css:16), and the plan correctly removes the Google Fonts CDN import from [fonts.css:5](/home/franciscpd/Projects/lyra-ds/handoff/tokens/fonts.css:5).

### Strengths

- Preserves the required dark overrides and brand derivations.
- Correctly treats `fonts.css` as the intentional no-CDN divergence.
- The source count supports the 209-token target.

### Concerns

- **MEDIUM — Comment policy remains internally contradictory.** Plan 01 says to retain structural comments ([02-01-PLAN.md:71](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-01-PLAN.md:71)), but retained “structural” comments contain Portuguese prose, e.g. [spacing.css:20](/home/franciscpd/Projects/lyra-ds/handoff/tokens/spacing.css:20) and [effects.css:4](/home/franciscpd/Projects/lyra-ds/handoff/tokens/effects.css:4). This conflicts with the stated EN-banner-only outcome.

### Suggestions

- Strip all inherited comments, leaving only the new EN header; or explicitly translate every retained comment and test for that policy.
- Document actual `@fontsource` CSS import paths/weights in the README, not only package names. The removed CDN request loads Plus Jakarta Sans 400–800 and JetBrains Mono 400–600 ([fonts.css:5](/home/franciscpd/Projects/lyra-ds/handoff/tokens/fonts.css:5)).

### Risk

**MEDIUM** — values and theme behavior are sound; shipped-source policy is not.

## 02-02 — Component CSS layer

### Summary

The CDN inventory is correctly identified: the only external component CSS URLs are the two masks each in [forms.css:73](/home/franciscpd/Projects/lyra-ds/handoff/components/forms/forms.css:73), [display.css:162](/home/franciscpd/Projects/lyra-ds/handoff/components/display/display.css:162), and [navigation.css:81](/home/franciscpd/Projects/lyra-ds/handoff/components/navigation/navigation.css:81).

### Strengths

- Replaces both `mask` and `-webkit-mask` for all three icons.
- The `url(...https...)` guard will not false-match the existing data-URI namespace at [forms.css:204](/home/franciscpd/Projects/lyra-ds/handoff/components/forms/forms.css:204).
- Correctly preserves the seven aggregate category files and 248-class target.

### Concerns

- **HIGH — The proposed `#000` SVG data URI is malformed.** Plans require raw `stroke="#000"` inside `data:image/svg+xml` ([02-02-PLAN.md:69](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-02-PLAN.md:69)). In a URL, `#` begins a fragment, truncating the SVG payload. The existing source data URI uses `stroke="white"` instead ([forms.css:204](/home/franciscpd/Projects/lyra-ds/handoff/components/forms/forms.css:204)). Encode it as `%23000` or use `stroke="black"`; add a browser assertion that the mask renders.

- **HIGH — The 38-vs-40 “resolution” is false.** The plan says AvatarGroup and ToastStack have no standalone contracts and should not become exports ([02-02-PLAN.md:88](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-02-PLAN.md:88)). They do have implementations and prop contracts: [Avatar.jsx:25](/home/franciscpd/Projects/lyra-ds/handoff/components/display/Avatar.jsx:25), [Avatar.d.ts:18](/home/franciscpd/Projects/lyra-ds/handoff/components/display/Avatar.d.ts:18), [Toast.jsx:24](/home/franciscpd/Projects/lyra-ds/handoff/components/feedback/Toast.jsx:24), and [Toast.d.ts:14](/home/franciscpd/Projects/lyra-ds/handoff/components/feedback/Toast.d.ts:14). The conversion specification also requires a barrel of all 40 components ([README.md:50](/home/franciscpd/Projects/lyra-ds/handoff/design_handoff_lyra_lib/README.md:50)). This would silently reduce the React public API to 38.

- **MEDIUM — “Never hard-coded values” contradicts the canonical CSS.** The plan asserts this at [02-02-PLAN.md:20](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-02-PLAN.md:20), while the source deliberately contains literals such as `#fff` in [buttons.css:54](/home/franciscpd/Projects/lyra-ds/handoff/components/buttons/buttons.css:54) and [forms.css:227](/home/franciscpd/Projects/lyra-ds/handoff/components/forms/forms.css:227). Its later copy instruction is correct; the must-have should be corrected.

- **MEDIUM — Animation constraint remains unresolved.** The plan copies [feedback.css:119](/home/franciscpd/Projects/lyra-ds/handoff/components/feedback/feedback.css:119), which animates opacity, while the project locks entrance keyframes to transform-only ([PROJECT.md:51](/home/franciscpd/Projects/lyra-ds/.planning/PROJECT.md:51)). The plan needs an explicit decision on whether fidelity or that animation rule wins.

### Suggestions

- Use `stroke="black"` or percent-encode `#`, then add a computed-mask/browser rendering probe.
- Restore AvatarGroup and ToastStack as separate Phase 4 exports, even if they share source files with Avatar and Toast.
- Change the token-indirection requirement to preserve existing literals and `var()` references exactly.
- Resolve the fade-keyframe contradiction before copying feedback/navigation CSS.

### Risk

**HIGH** — the data URI can make three visible controls lose their chevrons, and the stated component inventory would break the 40-export commitment.

## 02-03 — Entry, exports, manifest, README

### Summary

The public export fix is genuine: Plan 03 specifies both `"."` and `"./styles.css"` ([02-03-PLAN.md:87](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-03-PLAN.md:87)), matching the project requirement ([PROJECT.md:19](/home/franciscpd/Projects/lyra-ds/.planning/PROJECT.md:19)). The 14 imports also match [handoff/styles.css](/home/franciscpd/Projects/lyra-ds/handoff/styles.css:1).

### Strengths

- `sideEffects: ["**/*.css"]` is specified exactly.
- Compat remains outside the entry.
- The wildcard does not collide with `./styles.css` or `./compat-shadcn.css`.

### Concerns

- **MEDIUM — The plan claims root-import coverage but only the later smoke test resolves `@lyra-ds/styles/styles.css`, not `@lyra-ds/styles`.** The root export is the main STY-01 consumer path. `publint` validates metadata, but it does not prove a real CSS tool accepts and follows the root CSS export.

- **LOW — Font docs are insufficient for a consumer to load the fonts.** The plan asks only for a peer-install note ([02-03-PLAN.md:87](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-03-PLAN.md:87)); package installation alone does not load font CSS.

### Suggestions

- Add a consumer CSS fixture that imports both `@lyra-ds/styles` and `@lyra-ds/styles/styles.css`.
- Include explicit install commands and the needed `@fontsource/*/<weight>.css` imports.

### Risk

**MEDIUM** — the manifest is correct on paper, but the main entry is not yet exercised as a consumer would use it.

## 02-04 — Parity validator and stylelint

### Summary

This is materially improved: placement-aware comparison, exact stylelint pins, and a no-CDN guard directly address prior weaknesses.

### Strengths

- The 209 declaration count is correct.
- The 248 class inventory is correct.
- `stylelint@17.14.0` and `stylelint-config-standard@40.0.0` are now explicitly pinned.
- The regex correctly avoids treating `xmlns="http://www.w3.org/2000/svg"` inside a `data:` URI as a network fetch.

### Concerns

- **MEDIUM — The proposed parity key still misses CSS structure that affects the cascade.** `file + selector + property + occurrence` ([02-04-PLAN.md:80](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-04-PLAN.md:80)) does not include at-rule ancestry or rule order. Moving a rule under `@media`/`@container`, or reordering equal-specificity rules, can change behavior while preserving that key. The source has `@media` ([feedback.css:195](/home/franciscpd/Projects/lyra-ds/handoff/components/feedback/feedback.css:195)) and `@container` ([files.css:188](/home/franciscpd/Projects/lyra-ds/handoff/components/files/files.css:188)) blocks.

- **MEDIUM — A zero-dependency parser needs an explicit parsing contract.** The CSS contains nested at-rules and quoted data URIs with semicolons ([forms.css:204](/home/franciscpd/Projects/lyra-ds/handoff/components/forms/forms.css:204)). A naïve regex/split parser will misparse them. The plan should require a tokenizer/state machine and fixtures covering those exact constructs.

- **LOW — The fonts allowlist is inconsistent with the stated comparison scope.** The placement diff excludes `fonts.css`, so its removed `@import` cannot be an exception within that diff.

- **LOW — The URL guard misses protocol-relative and escaped URLs.** `url(//cdn…)` remains a runtime fetch but does not match the stated `https?://` pattern.

### Suggestions

- Compare normalized rule order and include full at-rule ancestry in the key, or compare an AST-like serialized rule structure.
- Add parser fixtures from the actual `@container`, `@media`, keyframe, and data-URI cases.
- Disallow URL schemes except relative and `data:`, including `//`.

### Risk

**MEDIUM** — substantially better, but it overstates its ability to guarantee cascade fidelity.

## 02-05 — Browser Mode tests

### Summary

The two core previous test fixes are present: the dependency now includes 02-04 ([02-05-PLAN.md:6](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-05-PLAN.md:6)), and probes apply derived values to real longhands ([02-05-PLAN.md:87](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-05-PLAN.md:87)). That is the right Browser Mode model; Vitest requires an enabled browser provider and instance. [Vitest docs](https://vitest.dev/config/browser/enabled)

### Strengths

- Correctly avoids reading unresolved custom-property token streams.
- Covers light/dark default and Acme permutations.
- Chromium is an appropriate real-CSS environment.

### Concerns

- **MEDIUM — The fixture loading mechanism is underspecified.** A standalone HTML file is not automatically loaded by a Browser Mode test. The plan needs to require either `browser.testerHtmlPath` in the config or explicit fixture/body injection; “load the fixture in the chromium page” is not an implementation mechanism.

- **MEDIUM — Assertions may not prove each formula.** “Teal family” and “expected channel direction” can pass if several derivations collapse to `var(--brand)`. Require each light derived value to differ from raw Acme in the expected darkening/mixing direction, and each dark derived value to be lighter than raw Acme according to the specified formulas at [brand.css:18](/home/franciscpd/Projects/lyra-ds/handoff/tokens/brand.css:18) and [brand.css:33](/home/franciscpd/Projects/lyra-ds/handoff/tokens/brand.css:33).

- **MEDIUM — Overflow is claimed but not tested.** The plan implements one long-text assertion ([02-05-PLAN.md:85](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-05-PLAN.md:85)); it does not test the separately claimed nav/feedback/data/files overflow cases.

### Suggestions

- Specify `testerHtmlPath` or test-side DOM setup and CSS import mechanics.
- Assert ordered brightness/channel relationships for every derived token, not only “not indigo.”
- Add defined scroll/clip checks, or remove the broader overflow success claim.

### Risk

**MEDIUM** — the longhand technique is correct, but execution details and assertion strength need tightening.

## 02-06 — CI and packed-artifact smoke test

### Summary

The CI ordering fix is real: the existing root test command is at [ci.yml:69](/home/franciscpd/Projects/lyra-ds/.github/workflows/ci.yml:69), and Plan 06 explicitly requires Chromium installation before it ([02-06-PLAN.md:63](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-06-PLAN.md:63)). `pnpm exec` also replaces floating `dlx`/`npx`.

### Strengths

- Preserves the four required job names.
- Correctly puts stylelint/parity/publint in existing jobs.
- Adds a tarball-install step, which is a meaningful improvement over workspace-only checks.

### Concerns

- **HIGH — The smoke test does not actually import or bundle CSS.** It only uses `require.resolve`/`import.meta.resolve` or a filesystem check ([02-06-PLAN.md:83](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-06-PLAN.md:83)). Node resolves a `.css` target without loading it, so this cannot prove the root CSS export, nested `@import`s, or consumer-bundler compatibility. The project research explicitly calls for verifying bundlers accept the CSS root export ([PITFALLS.md:43](/home/franciscpd/Projects/lyra-ds/.planning/research/PITFALLS.md:43)).

- **MEDIUM — The automated verify command omits Browser Mode.** The task says to run it, but the actual `<verify>` command stops after publint, parity, stylelint, and pack-smoke ([02-06-PLAN.md:85](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-06-PLAN.md:85)). It therefore cannot substantiate the following acceptance criterion requiring the Browser Mode test.

- **LOW — `publint` is not version-pinned in the plan.** The checkpoint approves “latest stable” ([02-04-PLAN.md:67](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-04-PLAN.md:67)); `save-exact` only pins whatever happens to be latest at execution time.

### Suggestions

- Make the temporary fixture a real Vite consumer build that imports:
  - `@import "@lyra-ds/styles";`
  - `@import "@lyra-ds/styles/styles.css";`
  - a token subpath.
  
  Then assert the emitted CSS contains a known class and token. This tests the packed artifact, root export, literal export, and relative imports.

- Add Chromium installation plus `pnpm --filter @lyra-ds/styles run test` to the automated verification command.
- Name an exact publint version before the approval checkpoint.

### Risk

**HIGH** — this plan claims consumer import safety without performing a consumer CSS import.

## Overall recommendation

Do not execute yet. Resolve these before proceeding:

1. Fix the chevron data URI encoding and add a render check.
2. Correct AvatarGroup/ToastStack: they are real standalone exports, not CSS-only compositions.
3. Replace comment-retention ambiguity with an enforceable EN-only policy.
4. Strengthen parity to preserve at-rule context and order.
5. Make pack smoke run an actual consumer CSS build, including the root `@lyra-ds/styles` path.
6. Specify Browser Mode fixture loading and make its formula assertions/overflow coverage real.
---

## Consensus Summary (single reviewer — Codex)

**Verdict: NOT execution-ready.** Round 1's four release-critical findings are structurally resolved, but the re-review caught three new HIGH issues — two of them regressions introduced by the Round-1 revisions — plus several MEDIUM refinements.

### Highest-Priority (HIGH — orchestrator verified against source)

1. **Malformed `#000` data URI (02-02) — REGRESSION, CONFIRMED.** The Round-1 fix specifies `stroke="#000"` inside an unencoded `data:image/svg+xml;utf8,` URI; `#` begins a URL fragment and truncates the SVG (the three chevrons would render blank). The working source precedent (`forms.css:204`) uses `stroke="white"`. **Fix:** use `stroke="black"` (keyword) or percent-encode as `%23000`, and add a browser render/computed-mask assertion so a blank glyph fails the test.
2. **AvatarGroup/ToastStack are real exports (02-02) — CONFIRMED.** `handoff/design_handoff_lyra_lib/README.md:50-63` lists 40 components incl. AvatarGroup + ToastStack and mandates a 40-export barrel. Round-1 documented them as "compound, no standalone contract needed," which risks Phase 3 shipping a 38-export API. Their CSS (`.lyra-avatar-group`, `.lyra-toast-stack`) IS covered here — only the inventory *note* is wrong. **Fix:** correct the 02-02 note to "part of the 40-component public API; CSS covered here; Phase 3 must still export both."
3. **Pack smoke test never imports CSS (02-06) — CONFIRMED.** `require.resolve`/`import.meta.resolve` resolve a `.css` path without loading or bundling it, so the test cannot prove the root `@lyra-ds/styles` CSS export, nested `@import`s, or bundler compatibility (PITFALLS.md:43 explicitly calls for this). **Fix:** make the fixture a real Vite consumer build importing `@lyra-ds/styles`, `@lyra-ds/styles/styles.css`, and a token subpath, then assert the emitted CSS contains a known class + token.

### Secondary (MEDIUM)

- **Comment policy still ambiguous (02-01):** "retain structural comments" keeps pt-BR prose (`spacing.css:20`, `effects.css:4`) — contradicts the EN-only outcome. Pick strip-all-but-banner OR translate-and-test.
- **Parity misses at-rule ancestry + rule order (02-04):** `file+selector+property+occurrence` doesn't catch a decl moved under `@media`/`@container` (source has both). Include at-rule ancestry / serialized rule structure; specify a real tokenizer (not regex/split) with fixtures for the data-URI-with-semicolons and nested at-rule cases.
- **Browser Mode fixture loading underspecified (02-05):** a standalone HTML file isn't auto-loaded — require `testerHtmlPath` or explicit DOM/CSS injection; strengthen formula assertions (ordered darkening/lightening direction per `brand.css:18`/`:33`), and either test the claimed nav/feedback/data/files overflow cases or drop the overflow claim.
- **02-06 `<verify>` omits Browser Mode** despite the acceptance criterion requiring it; **`publint` not version-pinned** (checkpoint approves "latest stable").

### New potential constraint conflict (MEDIUM — worth a decision)

- **Opacity animation vs transform-only lock (02-02):** `feedback.css:119` animates `opacity`, but PROJECT.md/CLAUDE.md lock entrance keyframes to transform-only. Copy-verify fidelity and the animation rule collide — needs an explicit decision (this is a keyframe already in the handoff source, so likely "fidelity wins / rule applies to new keyframes only," but it must be recorded).

### Net assessment
Round 1 genuinely de-risked the packaging surface (export map, tree-shaking, CI ordering). Round 2 shows the icon-CDN fix needs an encoding correction, the component inventory note is wrong, and the two "proof" gates (pack smoke, Browser Mode in CI verify) don't yet exercise what they claim. A second `--reviews` pass targeting items 1–3 (HIGH) is recommended before execution.
