---
phase: 03-react-infrastructure-pilot-components
verified: 2026-07-20T21:35:02Z
status: passed
score: 6/6 must-have truths verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  # Not applicable — initial verification
requirements:
  - id: RCT-03
    status: satisfied
  - id: RCT-04
    status: satisfied
  - id: RCT-05
    status: satisfied
advisories: # Non-blocking code-review findings (03-REVIEW.md) — recommended before Phase 4 batch conversion
  - id: WR-02
    file: packages/react/src/dialog/dialog.tsx
    issue: "Dialog closes on a drag-release that ends on the backdrop (mousedown-origin not tracked)"
    severity: warning
  - id: WR-03
    file: packages/react/src/dialog/dialog.tsx
    issue: "Reopening a Dialog during its exit animation drops initial focus and orphans the opener (mount-effect never re-runs while presence keeps panel mounted)"
    severity: warning
  - id: WR-01
    file: packages/react/src/input/input.tsx
    issue: "Input suppresses React's controlled-without-onChange warning; field silently freezes"
    severity: warning
  - id: WR-04
    file: packages/react/src/input/input.tsx
    issue: "Input writes dead internal state on every keystroke while uncontrolled (redundant re-render)"
    severity: warning
  - id: WR-05
    file: tools/dist-scan/assert-use-client.mjs
    issue: "assert-use-client passes vacuously (exit 0) when the target dir has zero JS/CJS files"
    severity: warning
---

# Phase 3: React Infrastructure & Pilot Components — Verification Report

**Phase Goal:** Conversion conventions are locked on a pilot spanning simple/form/overlay cases (Button, Input, Dialog) plus Icon, with build/test/CI machinery proven, so batch conversion becomes safe repetition.
**Verified:** 2026-07-20T21:35:02Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

Every observable truth was verified by **running the actual gate**, not by trusting SUMMARY.md. The
full cross-bundler smoke test (Vite production build + Next App Router build + CJS `require()` proof
against real packed tarballs) executed successfully in this verification, which is the strongest
end-to-end evidence for RCT-03/RCT-04/RCT-05.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | **RCT-04** — `@lyra-ds/react` builds dual ESM+CJS with per-component subpaths, `"use client"` on every chunk, validated by publint + attw, and consumable from Vite & Next | ✓ VERIFIED | `pnpm run build` emits `dist/{index,button,input,dialog,icon}.{js,cjs,d.ts,d.cts}`, **no `chunk-*.js`**; `head -1` of all 10 JS/CJS = `"use client";`; `assert-use-client` OK (10 files); `publint` clean (1 non-blocking suggestion); `attw --pack --profile node16` exit 0 (node16 CJS+ESM+bundler 🟢); smoke.mjs Vite `tsc --noEmit` clean + prod build, Next `next build`, CJS `require()` all green |
| 2 | **RCT-03** — importing one component does not pull the others; CSS imports are banned in `src` by ESLint | ✓ VERIFIED | Probe file with `import './x.css'` triggers the `no-restricted-imports` error (rule is real & enforced); `size-limit` Button entry **249 B** vs Icon **5.95 kB** (order of magnitude apart → Button pulls zero lucide); smoke.mjs Vite prod build tree-shakes to **Button+Input+Icon with Dialog runtime marker (`lyra-dialog-overlay`) EXCLUDED** from JS assets |
| 3 | **RCT-05** — Icon renders local Lucide via a curated 70-icon registry, no CDN, no ~1,400-icon pull | ✓ VERIFIED | `generate.mjs --check` exit 0: 70 icons (69 lucide-react validated + vendored `github` via `createLucideIcon`); no `import *`/dynamic `require`; `no-cdn-scan` OK; `size-limit` Icon 5.95 kB (limit 7.5 kB) with lucide NOT in ignore list |
| 4 | Four pilots (Button/Input/Dialog/Icon) converted with co-located browser + ssr tests; full suite passes | ✓ VERIFIED | `pnpm run test` → **129 tests passed, 9 files, 0 failed** (5 browser + 4 ssr projects, chromium Browser Mode + axe). Key-fact estimate was "~139"; actual all-pass count is 129 (estimate, not a contract) |
| 5 | Six internal utilities exist and are SSR-safe | ✓ VERIFIED | `cx`, `use-controllable-state`, `portal`, `use-focus-trap`, `use-presence`, `use-scroll-lock` all present; zero module-scope `document`/`window`/`localStorage`; ssr vitest project passes within the 129 |
| 6 | CONVENTIONS.md documents the Phase 4 conversion template; CI wires the phase's quality gates | ✓ VERIFIED | CONVENTIONS.md has D-24 checklist, locked-decisions table, D-25 component→pilot-test map, deviations/extensions; CONTRIBUTING.md links to it; CI has all Phase 3 gates as steps inside the four frozen jobs (lint/typecheck/test/build) |

**Score:** 6/6 truths verified (0 present-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/react/package.json` | dual-format exports map, sideEffects false, lucide-only dep | ✓ VERIFIED | name `@lyra-ds/react`, `type: module`, `sideEffects: false`, peer react/react-dom `>=18 <20`, dep `lucide-react` only; exports `.`/`./button`/`./input`/`./dialog`/`./icon` with per-condition types; no `./internal` |
| `packages/react/tsup.config.ts` | 5 entries, splitting off, use-client banner | ✓ VERIFIED | build produced 5 files/format, no chunks, banner on all |
| `packages/react/src/index.ts` | named-only barrel | ✓ VERIFIED | named re-exports of Button/Input/Dialog/Icon + Props types + IconName; no default export anywhere in shipped src |
| `packages/react/src/{button,input,dialog,icon}/*.{tsx,ts}` | 4 pilots + browser/ssr tests | ✓ VERIFIED | all present; Dialog imports no sibling component (inline `<svg>` close glyph) |
| `packages/react/src/internal/*` | 6 SSR-safe utilities + hook tests | ✓ VERIFIED | 6 utilities + `internal.browser.test.tsx` present |
| `packages/react/src/icon/icon-registry.ts` | generated + committed, 70 icons | ✓ VERIFIED | `--check` byte-matches; `IconName = keyof typeof iconRegistry` |
| `tools/icon-registry/generate.mjs` + fixtures | drift guard + self-test | ✓ VERIFIED | `--check` exit 0 |
| `tools/dist-scan/{assert-use-client,no-cdn-scan}.mjs` | dist guards | ✓ VERIFIED | both exit 0 (see WR-05 caveat) |
| `tools/smoke/{smoke.mjs,vite-app,next-app}` | packed cross-bundler proof | ✓ VERIFIED | smoke.mjs ran fully green (Vite + Next + CJS) |
| `packages/react/CONVENTIONS.md` | Phase 4 recipe | ✓ VERIFIED | all required sections present |
| `.changeset/phase-03-react-pilots.md` | lockstep-pair minor bump | ✓ VERIFIED | bumps `@lyra-ds/react: minor`; `.changeset/config.json` `fixed: [["@lyra-ds/styles","@lyra-ds/react"]]` auto-bumps styles in lockstep |
| `packages/styles/.../feedback.css` | additive Dialog close/exit CSS | ✓ VERIFIED | `.lyra-dialog__close` (+ `:focus-visible`), `--closing`, overlay `--closing` present; `parity` OK (209 tokens, 248 classes) |
| `.github/workflows/ci.yml` | gates in 4 frozen jobs | ✓ VERIFIED | steps land in lint/typecheck/test/build, no new jobs |

### Key Link Verification

| From | To | Via | Status |
|------|----|----|--------|
| exports map subpaths | dist filenames | `./button` → `dist/button.js`/`.cjs` | ✓ WIRED (build output matches exactly, no chunks) |
| icon.tsx | icon-registry.ts | registry key lookup + IconName typing | ✓ WIRED (129 tests incl. 70-icon render matrix pass) |
| dialog.tsx | internal/{portal,focus-trap,presence,scroll-lock} | overlay behavior stack | ✓ WIRED (dialog browser tests pass; see WR-03 edge case) |
| dialog closing state | `.lyra-dialog--closing` CSS (03-02) | usePresence onAnimationEnd | ✓ WIRED (class present in styles, applied by Dialog) |
| fixtures | packed tarball (not workspace src) | real npm install of `.tgz` | ✓ WIRED (smoke.mjs installs tarball, tree-shake + CJS proofs green) |
| CI steps | 4 frozen job names | steps inside lint/typecheck/test/build | ✓ WIRED |

### Behavioral Spot-Checks (executed in this verification)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Dual-format build | `pnpm --filter @lyra-ds/react run build` | 5 files/format, no chunks, use-client banners | ✓ PASS |
| Typecheck | `pnpm --filter @lyra-ds/react run typecheck` | exit 0 | ✓ PASS |
| Lint | `pnpm --filter @lyra-ds/react run lint` | exit 0 | ✓ PASS |
| CSS-import ban enforced | eslint on probe `import './x.css'` | error emitted | ✓ PASS |
| Full test suite | `pnpm --filter @lyra-ds/react run test` | 129 passed / 0 failed | ✓ PASS |
| Icon registry drift | `node tools/icon-registry/generate.mjs --check` | 70 icons, exit 0 | ✓ PASS |
| CSS parity | `pnpm run parity` | 209 tokens, 248 classes, exit 0 | ✓ PASS |
| publint | `publint packages/react` | 1 suggestion, no error | ✓ PASS |
| attw | `attw --pack . --profile node16` | exit 0 | ✓ PASS |
| size-limit | `size-limit` | Button 249 B / Icon 5.95 kB, within budgets | ✓ PASS |
| dist use-client scan | `assert-use-client packages/react/dist` | 10 files OK | ✓ PASS |
| dist CDN scan | `no-cdn-scan packages/react/dist` | clean | ✓ PASS |
| Cross-bundler smoke | `node tools/smoke/smoke.mjs` | Vite (Dialog excluded) + Next (use-client) + CJS require all green | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| RCT-03 | 03-01, 03-05, 03-08 | Importing one component doesn't pull others; sideEffects false; zero CSS imports (CI-enforced) | ✓ SATISFIED | eslint ban (probe), size-limit Button 249 B, smoke Dialog-exclusion |
| RCT-04 | 03-01, 03-08, 03-09 | Dual ESM+CJS with types, publint + attw, Vite & Next scratch apps | ✓ SATISFIED | build, publint, attw node16, smoke Vite+Next+CJS |
| RCT-05 | 03-03, 03-05, 03-08 | Icon local Lucide, curated registry, no ~1,400 icons (size-limit gate) | ✓ SATISFIED | registry --check (70), no-cdn-scan, size-limit Icon 5.95 kB |

All three requirement IDs declared across the phase plans are accounted for and satisfied. No orphaned requirements — REQUIREMENTS.md maps only RCT-03/04/05 to Phase 3.

### Prohibitions (all mechanically verified from the codebase)

| Prohibition | Status | Evidence |
|-------------|--------|----------|
| No CSS imports in `packages/react/src` | ✓ HELD | eslint `no-restricted-imports` fires on probe |
| No Tailwind anywhere in packages | ✓ HELD | grep for `tailwind`/`@apply` → none |
| Named exports only, no default exports | ✓ HELD | `grep "export default"` in shipped src → none |
| No namespace/dynamic lucide import | ✓ HELD | registry: single named-import block, no `import *`/`require()` |
| No CDN fetch of icon data | ✓ HELD | no-cdn-scan clean; github path-data embedded in generator |
| No module-scope DOM in internal | ✓ HELD | no top-level `document`/`window`/`localStorage` |
| Dialog imports no sibling component | ✓ HELD | inline `<svg>` glyph; no icon/button/input import |
| lucide-react not in size-limit ignore | ✓ HELD | ignore = `["react","react-dom"]` only |

The plan frontmatter carried these as `flagged-unverified` (judgment-tier). Each was resolved with direct
mechanical evidence during this verification, so none require human adjudication.

### Anti-Patterns / Code-Review Advisories

No BLOCKERs. The gsd code review (03-REVIEW.md) found 5 warnings + 3 info, all real edge-case robustness
gaps that do **not** fail any must-have or block the phase goal. They are surfaced here because the pilot
is the **template Phase 4 repeats**, so fixing the Dialog focus/close edge cases before batch conversion is
recommended so latent bugs do not propagate:

| ID | File | Issue | Severity |
|----|------|-------|----------|
| WR-02 | dialog.tsx | Closes on a drag-release ending on the backdrop (no mousedown-origin tracking) | ⚠️ Warning |
| WR-03 | dialog.tsx | Reopen during exit animation drops initial focus & orphans opener (mount effect never re-runs) | ⚠️ Warning |
| WR-01 | input.tsx | Suppresses React's controlled-without-onChange warning; field silently freezes | ⚠️ Warning |
| WR-04 | input.tsx | Dead internal state written per keystroke while uncontrolled | ⚠️ Warning |
| WR-05 | assert-use-client.mjs | Passes vacuously (exit 0) on an empty dir — false confidence if build emits nothing | ⚠️ Warning |
| IN-01..03 | smoke.mjs / generate.mjs / button.tsx | Dead var, over-broad ternary matcher, empty-string label span | ℹ️ Info |

These are recorded as `advisories` in the frontmatter (not `gaps`) — the phase goal is achieved regardless.
Note: WR-03's normal close→restore path IS covered by passing tests; the flagged bug is the narrower
reopen-during-exit-window edge case that no current test exercises.

### Gaps Summary

No gaps block the phase goal. Every must-have truth, artifact, and key link was verified by executing the
real gate in this verification session — culminating in a full green cross-bundler smoke run (Vite prod build
with Dialog tree-shaken out, Next App Router build honoring `"use client"`, and a CJS `require()` runtime
proof) against freshly packed tarballs. RCT-03, RCT-04, and RCT-05 are all satisfied with behavioral evidence.

The five code-review warnings are non-blocking edge-case robustness items. Because the Button/Input/Dialog/Icon
pilots are the conversion template for Phase 4, the developer should consciously decide whether to fix WR-02/WR-03
(Dialog overlay focus/close edge cases) before batch conversion begins — but this is a quality decision, not a
goal-blocking gap.

---

_Verified: 2026-07-20T21:35:02Z_
_Verifier: Claude (gsd-verifier)_
