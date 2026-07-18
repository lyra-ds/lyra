---
phase: 2
reviewers: [codex]
reviewed_at: 2026-07-18T12:11:02Z
review_round: 3
plans_reviewed: [02-01-PLAN.md, 02-02-PLAN.md, 02-03-PLAN.md, 02-04-PLAN.md, 02-05-PLAN.md, 02-06-PLAN.md]
---

# Cross-AI Plan Review — Phase 2 (Round 3)

> Reviewed by **Codex** (codex-cli 0.144.4, source-grounded). Rounds 1–2 preserved in git (`2ecb3ce`, `b75c762`). Codex's overall verdict: the Round-2 corrections genuinely hold and **no additional release-critical regression** was found; two narrow MEDIUM gaps remain. Single external reviewer (Claude skipped for independence).

## Round-2 fixes — all confirmed HOLDING (source-verified by Codex)

`stroke="black"` chevron data URIs (correct Lucide geometry) · AvatarGroup/ToastStack as real 40-barrel exports · real Vite packed-consumer build asserting class+token in emitted CSS · placement-aware parity (tokenizer + at-rule ancestry + `url(//…)` guard) · concrete Browser Mode fixture loading + ordered color-mix assertions · Browser Mode in 02-06 verify · `publint@0.3.21`/`vite@8.1.5` exact pins. Plans 02-01, 02-03, 02-04, 02-06 rated **LOW risk / execution-ready**.

## Codex Review (Round 3)

# Phase 2 Plan Review — Round 3

## 02-01 — Token layer

### Summary

The Round-2 comment-policy fix holds for token files. The plan now strips every inherited comment, leaves one English banner, and checks for additional comments and non-ASCII content.

### Strengths

- The policy is explicit and mechanically checked in [02-01-PLAN.md:71](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-01-PLAN.md:71).
- `brand.css` preserves the canonical light and dark derivations from [brand.css:16](/home/franciscpd/Projects/lyra-ds/handoff/tokens/brand.css:16).
- The no-CDN `fonts.css` divergence is deliberate and verified.
- Source recount confirms exactly 209 token declarations when comments are excluded: brand 19, colors 109, effects 20, spacing 25, typography 36.

### Concerns

None.

### Suggestions

None required.

### Risk

**LOW** — execution-ready.

---

## 02-02 — Component CSS layer

### Summary

The substantive Round-2 fixes hold against source:

- Chevron-down and chevron-right use the correct Lucide path geometry.
- The required stroke is `stroke="black"`, never an unencoded hex.
- AvatarGroup and ToastStack are explicitly preserved as real Phase-3 exports.

### Strengths

- The plan correctly follows the working keyword-color precedent at [forms.css:204](/home/franciscpd/Projects/lyra-ds/handoff/components/forms/forms.css:204).
- Chevron-down geometry `m6 9 6 6 6-6` and chevron-right geometry `m9 18 6-6-6-6` are correct.
- Both mask declarations are replaced for all three affected selectors at [02-02-PLAN.md:70](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-02-PLAN.md:70) and [02-02-PLAN.md:91](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-02-PLAN.md:91).
- AvatarGroup and ToastStack are now correctly described as public exports. Their contracts exist at [Avatar.d.ts:18](/home/franciscpd/Projects/lyra-ds/handoff/components/display/Avatar.d.ts:18) and [Toast.d.ts:14](/home/franciscpd/Projects/lyra-ds/handoff/components/feedback/Toast.d.ts:14), matching the 40-component inventory at [README.md:58](/home/franciscpd/Projects/lyra-ds/handoff/design_handoff_lyra_lib/README.md:58).
- The source still yields exactly 248 unique `.lyra-*` classes.

### Concerns

- **MEDIUM — The component comment policy remains inconsistent with the token policy.** The plan still says “keep structural grouping labels” at [02-02-PLAN.md:70](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-02-PLAN.md:70) and [02-02-PLAN.md:91](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-02-PLAN.md:91), with no comment-count or non-ASCII check. This retains content such as `/* command palette (⌘K) */` at [navigation.css:154](/home/franciscpd/Projects/lyra-ds/handoff/components/navigation/navigation.css:154), contradicting the stated shipped-CSS outcome of one English banner and no additional non-ASCII content.

### Suggestions

Apply the same enforceable rule as 02-01 to all seven component files:

- Strip all inherited comments.
- Require exactly one banner comment per file.
- Run the same `tail -n +2 … grep -P '[^\x00-\x7F]'` check.

### Risk

**MEDIUM** — functional CSS and the 40-component contract are sound; the documented source policy is not consistently executable.

---

## 02-03 — Entry, exports, manifest, README

### Summary

The export and documentation fixes hold.

### Strengths

- Both `.` and `./styles.css` resolve to `./styles.css`.
- `./tokens/*` and `./compat-shadcn.css` are explicit; no component subpaths are introduced.
- Compat remains outside the 14-import entry.
- `sideEffects: ["**/*.css"]` is specified exactly.
- Font documentation now includes the packages and explicit weight imports.
- The 14-entry order matches [handoff/styles.css:1](/home/franciscpd/Projects/lyra-ds/handoff/styles.css:1).

### Concerns

None.

### Suggestions

None required.

### Risk

**LOW** — execution-ready.

---

## 02-04 — Parity validator and stylelint

### Summary

The Round-2 parity fixes are now adequately specified.

### Strengths

- The parser must be a character-level tokenizer/state machine rather than regex or `split(';')`.
- At-rule ancestry, selector placement, property occurrence, and rule order are included at [02-04-PLAN.md:84](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-04-PLAN.md:84).
- Fixtures cover `@media`, `@container`, keyframes, and a quoted data URI containing a semicolon.
- The URL policy rejects protocol-relative and non-HTTP absolute schemes while allowing `data:` and relative paths.
- Exact source counts—209 declarations and 248 unique classes—are correct.
- Tool versions are exact, including `publint@0.3.21` and `vite@8.1.5`; registry queries confirmed the proposed versions exist.

### Concerns

None blocking.

The fonts `@import` allowlist entry is redundant because the declaration comparison excludes `fonts.css`, but it is harmless.

### Suggestions

Implement mask divergence entries as exact expected source→candidate replacements rather than broad property exemptions. This is defensive hardening, not a readiness blocker.

### Risk

**LOW** — execution-ready.

---

## 02-05 — Browser Mode tests

### Summary

Fixture loading and ordered color-mix assertions are now concrete, but the proposed chevron “render” assertion does not prove that the SVG decoded or produced visible mask pixels.

### Strengths

- The fixture must use either `testerHtmlPath` or explicit DOM/CSS injection at [02-05-PLAN.md:64](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-05-PLAN.md:64).
- Tests bind custom properties to real longhands, avoiding unresolved `color-mix()` token streams.
- Ordered darkening/lightening assertions correspond to the formulas at [brand.css:18](/home/franciscpd/Projects/lyra-ds/handoff/tokens/brand.css:18) and [brand.css:33](/home/franciscpd/Projects/lyra-ds/handoff/tokens/brand.css:33).
- Broader overflow claims are honestly deferred.

### Concerns

- **MEDIUM — The chevron assertion cannot guarantee that a blank or malformed SVG fails.** At [02-05-PLAN.md:92](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-05-PLAN.md:92), the test only checks that computed `mask-image` is non-empty and the element has a non-zero box. Browsers can preserve a syntactically present `url(...)` in computed style even when the referenced SVG fails to decode. The box size comes from CSS and is independent of whether the mask contains visible pixels. Therefore the claim at [02-05-PLAN.md:103](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-05-PLAN.md:103) that a malformed/truncated URI necessarily fails is not established.

### Suggestions

After extracting the computed data URL, create an `Image`, await `image.decode()`, and assert positive intrinsic dimensions. For true rendered-pixel coverage, add a screenshot/pixel assertion for the masked probe.

Also select a direct-mask element such as `.lyra-breadcrumb__sep` or `.lyra-acc__chevron`; the forms mask lives on `.lyra-select-wrap::after`, not `.lyra-select`.

### Risk

**MEDIUM** — theme and brand verification are strong, but the promised regression test for blank chevrons is not yet real.

---

## 02-06 — CI and packed artifact

### Summary

The Round-2 packaging and CI fixes hold.

### Strengths

- The packed-artifact test now requires an actual Vite consumer build at [02-06-PLAN.md:85](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-06-PLAN.md:85).
- It imports all three required surfaces: root package, literal `./styles.css`, and a token subpath.
- It inspects emitted CSS for both a `.lyra-*` class and a token.
- Chromium installation precedes the recursive root test at [02-06-PLAN.md:65](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-06-PLAN.md:65), matching the current CI position of the test command at [ci.yml:69](/home/franciscpd/Projects/lyra-ds/.github/workflows/ci.yml:69).
- The automated verification now includes Browser Mode at [02-06-PLAN.md:87](/home/franciscpd/Projects/lyra-ds/.planning/phases/02-styles-package/02-06-PLAN.md:87).
- Publint and Vite are exact pins.
- All gates remain steps within the four frozen jobs.

### Concerns

None.

### Suggestions

Ensure the fixture’s Vite config explicitly sets `build.rollupOptions.input` to `entry.css`; otherwise bare `vite build` defaults to looking for an HTML entry. The current action implies this through the “minimal Vite config,” so this is implementation clarification rather than a plan blocker.

### Risk

**LOW** — execution-ready.

---

# Overall verdict: **NOT EXECUTION-READY**

The major Round-2 corrections genuinely hold: valid `stroke="black"` data URIs, correct 40-export treatment, real Vite packed-consumer build, placement-aware parity, concrete Browser Mode loading, Browser Mode in verification, and exact tool pins.

Two actionable gaps remain:

1. The component CSS still lacks the enforceable strip-all-but-banner policy already applied to tokens.
2. The chevron test claims to detect blank/malformed SVGs but only checks computed URL presence and element dimensions, neither of which proves successful decoding or visible mask output.

These are narrow fixes. Once the component comment checks are aligned with 02-01 and the mask test verifies decode/render output, the plans should be execution-ready; I found no additional release-critical regression.
---

## Consensus Summary (single reviewer — Codex)

**Verdict: two narrow MEDIUM gaps remain; no release-critical regressions.** The three review rounds have converged — Codex explicitly confirms all Round-1 and Round-2 fixes hold against source and found nothing release-critical new.

### Remaining actionable gaps (both MEDIUM, both orchestrator-verified against source)

1. **Component comment policy not enforceable like the token policy (02-02).** 02-01 strips all inherited comments (one EN banner, non-ASCII check); 02-02 still says "keep thin structural grouping labels" with no comment-count/non-ASCII check. VERIFIED: 8 component comment lines carry non-ASCII — `navigation.css:154` `/* command palette (⌘K) */`, plus em-dashes and pt-BR prose (`files.css:1` "upload múltiplo"). As written, these ship in the English-only component CSS. **Fix:** apply the identical strip-all-but-EN-banner rule + `tail -n +2 … grep -P '[^\x00-\x7F]'` check to all 7 component files in 02-02.

2. **Chevron render assertion doesn't prove the SVG decoded (02-05).** Checking computed `mask-image` is non-empty + a non-zero box does NOT prove the data URI decoded to visible pixels (the box size is pure CSS; a broken `url(...)` can still appear in computed style). **Fix:** extract the computed data URL, `new Image()` + `await image.decode()`, assert positive intrinsic dimensions (optionally a screenshot/pixel assertion). ALSO a factual correction VERIFIED against source: the forms chevron mask lives on **`.lyra-select-wrap::after`** (`forms.css:66`), NOT `.lyra-select` — the test must target the pseudo-element (or use a direct-mask element like `.lyra-breadcrumb__sep` / `.lyra-acc__chevron`).

### Assessment
Convergence reached. Both remaining items are refinements, not blockers: (1) is a genuine shipped-CSS consistency bug (non-ASCII/pt-BR leaking into component CSS) that's trivially fixed by extending the token rule; (2) hardens a regression test so a blank chevron actually fails, plus a real selector correction. One final `--reviews` pass closing these two makes the phase fully execution-ready — a Round 4 is not expected to surface anything further.
