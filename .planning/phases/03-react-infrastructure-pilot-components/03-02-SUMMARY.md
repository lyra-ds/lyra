---
phase: 03-react-infrastructure-pilot-components
plan: 02
subsystem: styles-parity
tags: [css, dialog, animation, parity, additive-extensions]
status: complete
requires:
  - "packages/styles feedback.css dialog block (Phase 2)"
  - "tools/parity/parity.mjs MASK_DIVERGENCE allowlist discipline (Phase 2)"
provides:
  - ".lyra-dialog__close (28px hit area, focus-ring, token-driven)"
  - ".lyra-dialog--closing + .lyra-dialog-overlay--closing exit classes"
  - "lyra-pop-out / lyra-fade-out exit keyframes (deterministic end states)"
  - "parity ADDITIVE_EXTENSIONS exact-name allowlist"
affects:
  - "plan 03-04 usePresence hook (waits on .lyra-dialog--closing animation end)"
  - "plan 03-07 Dialog pilot (applies close/exit classes, asserts lyra-pop-out)"
tech-stack:
  added: []
  patterns:
    - "additive CSS appended at EOF to keep the parity diff index-aligned"
    - "exact-name allowlist enumeration (no wildcards) for parity extensions"
key-files:
  created: []
  modified:
    - packages/styles/components/feedback/feedback.css
    - tools/parity/parity.mjs
decisions:
  - "Additive Dialog CSS appended at EOF of feedback.css (never mid-file) so the index-aligned parity diff sees extras only past handoff length"
  - "ADDITIVE_EXTENSIONS is exact-name enumeration (3 classes + 2 keyframes) wired into classCheck + diffFile; EXPECTED_CLASSES 248 / EXPECTED_TOKENS 209 untouched"
  - "Exit keyframes fade to opacity 0 (allowed on EXIT); entry keyframes lyra-fade-in/lyra-pop-in remain transform-only / start 0.6 (frozen constraint)"
metrics:
  duration: 6min
  tasks: 2
  files: 2
  completed: 2026-07-19
requirements: [RCT-04]
---

# Phase 3 Plan 2: Dialog Additive CSS Extensions + Parity Allowlist Summary

Shipped the Dialog pilot's exit-animation (D-17/D-18) and close-button (D-19) visuals into `@lyra-ds/styles` as parity-audited additive extensions, and taught the Phase 2 parity script an exact-name `ADDITIVE_EXTENSIONS` allowlist so handoff declarations still match byte-for-byte while every addition is enumerated and any un-listed one still fails.

## What Was Built

### Task 1 — Additive Dialog CSS (`feedback.css`, commit 04872b5)
- `.lyra-dialog__close`: `display: inline-flex` centered, `width/height: 28px`, `flex: 0 0 28px` (review fix — the header is `display: flex`, so a fixed basis guarantees the hit area never shrinks under a long title), `border: 0; padding: 0`, `border-radius: var(--radius-xs)`, `background: transparent`, `color: var(--text-faint)`, `cursor: pointer`. Fully token-driven, no hex literals.
- `.lyra-dialog__close:hover` → `var(--surface-sunken)` / `var(--text-primary)`.
- `.lyra-dialog__close:focus-visible` → `outline: none; box-shadow: var(--shadow-focus)` (review fix — the borrowed `.lyra-tag__remove` had hover only; this adds the keyboard focus ring the UI-SPEC pilot contract requires).
- `.lyra-dialog--closing` / `.lyra-dialog-overlay--closing`: play `lyra-pop-out` / `lyra-fade-out` at `var(--duration-base) var(--ease-out) forwards` (fill-mode holds the final exit frame until unmount; usePresence in 03-04 waits on animation end).
- New exit keyframes with EXACT end states (review fix — no either-or): `lyra-fade-out` `opacity 1 → 0`; `lyra-pop-out` `scale(1) translateY(0) opacity 1 → scale(0.97) translateY(4px) opacity 0`.
- Entry keyframes `lyra-fade-in` (starts 0.6) and `lyra-pop-in` (transform-only) untouched. Additions appended at EOF; `git diff` is 29 insertions, 0 deletions/changes.

### Task 2 — Parity `ADDITIVE_EXTENSIONS` allowlist (`parity.mjs`, commit 99af2d2)
- New `ADDITIVE_EXTENSIONS` constant (commented, citing D-18/D-19) enumerating exactly the 3 new classes and 2 new keyframes, mirroring the `MASK_DIVERGENCE` discipline.
- `isAdditiveExtension()` helper: an extra package declaration is skipped only when its outermost block is an allowlisted `@keyframes` name OR its selector's `.lyra-*` chain exact-matches an allowlisted class name — exact-match, no prefixes/wildcards.
- Wired two check sites: `classCheck()` package-class-not-in-handoff branch and `diffFile()` extra-declaration branch.
- `EXPECTED_CLASSES = 248` and `EXPECTED_TOKENS = 209` left untouched (handoff-side counts).

## Verification Evidence
- `pnpm --filter @lyra-ds/styles run lint:css` → clean (Task 1).
- `pnpm run parity` → `parity OK: 209 tokens, 248 classes, placement + at-rule ancestry + no-CDN (url() + @import) verified`.
- Negative proof: appending a throwaway `.lyra-zzz-test { color: red; }` produced `parity FAILED (2 issues)` — failing on BOTH the extra-declaration check and the class-inventory check — confirming exact-name enumeration rejects un-listed additions (T-03-03). Dummy removed; parity restored to green.
- `git diff` of `feedback.css`: additive-only (0 removed/changed existing lines).

## Threat Model
- **T-03-03 (parity allowlist scope creep, mitigate):** mitigated — exact-name enumeration only (no wildcards), allowlist visible + commented with decision IDs, negative-proof test green.
- **T-03-SC (no installs, accept):** honored — plan touched only in-repo CSS and the zero-dep node parity script; no package installs.

## Deviations from Plan
None — plan executed exactly as written.

## Notes
- The plan frontmatter declares `requirements: [RCT-04]`, which describes the tsup dual ESM+CJS build validated by publint/attw — a requirement whose substance was delivered by plan 03-01, not this CSS-only plan. Marked complete per the plan-declared mapping; the end state (RCT-04 Complete) is accurate because 03-01 satisfied it. Flagging the frontmatter mismatch for planner awareness; no action taken.

## Self-Check: PASSED
- FOUND: packages/styles/components/feedback/feedback.css (`.lyra-dialog__close`, exit keyframes present)
- FOUND: tools/parity/parity.mjs (`ADDITIVE_EXTENSIONS` present)
- FOUND commit 04872b5 (feat: additive Dialog CSS)
- FOUND commit 99af2d2 (feat: ADDITIVE_EXTENSIONS allowlist)
