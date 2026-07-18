---
phase: 02-styles-package
plan: 02
subsystem: ui
tags: [css, lyra-classes, components, design-tokens, data-uri, no-cdn]

# Dependency graph
requires:
  - phase: 02-styles-package (plan 02-01)
    provides: token layer (209 tokens as var(--token) declarations) the component CSS references
provides:
  - Seven aggregate component CSS files under packages/styles/components/ shipping all 248 unique .lyra-* classes for the 40-component surface
  - Local inline data: SVG chevron masks (down + right) replacing three unpkg.com runtime CDN mask URLs
  - Enforceable single-EN-banner comment policy applied identically to the token layer
affects: [02-03 (entry/cascade order), 02-04 (class-inventory parity script), 02-05 (browser render tests), phase-03-react]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Component CSS copy-verify: byte-faithful copy of handoff/components/**, comments stripped to one EN banner, tokens preserved as var(--token)"
    - "No-runtime-CDN mask icons: unpkg.com Lucide mask URLs rewritten to inline data:image/svg+xml URIs with stroke color KEYWORD (never #-hex, which truncates unencoded utf8 data URIs at the fragment delimiter)"

key-files:
  created:
    - packages/styles/components/buttons/buttons.css
    - packages/styles/components/forms/forms.css
    - packages/styles/components/display/display.css
    - packages/styles/components/data/data.css
    - packages/styles/components/navigation/navigation.css
    - packages/styles/components/feedback/feedback.css
    - packages/styles/components/files/files.css
  modified: []

key-decisions:
  - "Component comment policy is enforceable identically to plan 02-01: grep -c '/*' == 1 per file, tail -n +2 | grep -P '[^\\x00-\\x7F]' empty — the em-dash banner, command palette label, and pt-BR files label do NOT ship"
  - "Three unpkg.com chevron mask URLs rewritten to local inline data: SVG URIs using stroke=\"black\" keyword (avoids the #-hex fragment-truncation blank-glyph bug); mirrors the working handoff checkmark data URI precedent"

patterns-established:
  - "Mechanical copy-verify pipeline: strip standalone comment lines, prepend one EN banner; body diffs against handoff show ONLY the allowlisted chevron divergence"

requirements-completed: [STY-01]

coverage:
  - id: D1
    description: "Seven component category CSS files ship all 248 unique .lyra-* classes referencing tokens via var(--token); per-file counts match handoff (buttons 13, forms 29, display 34, data 16, navigation 72, feedback 40, files 44)"
    requirement: "STY-01"
    verification:
      - kind: automated_ui
        ref: "grep -roh '\\.lyra-[a-zA-Z0-9_-]*' packages/styles/components/**/*.css | sort -u | wc -l == 248; per-file counts equal handoff"
        status: pass
    human_judgment: false
  - id: D2
    description: "One EN banner per file, no non-ASCII/pt-BR prose beyond line 1 (D-03)"
    verification:
      - kind: automated_ui
        ref: "grep -c '/*' <file> == 1 and tail -n +2 <file> | grep -P '[^\\x00-\\x7F]' empty for all seven files"
        status: pass
    human_judgment: false
  - id: D3
    description: "Zero runtime url(...http...) in any shipped CSS; three unpkg chevron masks rewritten to local inline data: SVG with stroke=\"black\" keyword (no truncating #-hex)"
    requirement: "STY-01"
    verification:
      - kind: automated_ui
        ref: "grep -rnE 'url\\(\\s*[\"']?https?://' packages/styles --include='*.css' empty; grep 'stroke=\"black\"' present, grep 'stroke=\"#' empty"
        status: pass
    human_judgment: false
  - id: D4
    description: "Chevron data: URI actually decodes to a visible glyph (positive intrinsic dimensions) in a real browser"
    verification: []
    human_judgment: true
    rationale: "Actual mask-image decode/render is asserted in Browser Mode by plan 02-05; not decidable at CSS-authoring time"

# Metrics
duration: 5min
completed: 2026-07-18
status: complete
---

# Phase 2 Plan 2: Component CSS Copy-Verify Summary

**Seven aggregate component CSS files copied byte-faithfully from the handoff — 248 unique `.lyra-*` classes over `var(--token)` indirection, comments stripped to one EN banner each, and three unpkg.com chevron mask URLs rewritten to local inline `data:` SVG URIs (no runtime CDN).**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-07-18T18:41:00Z
- **Completed:** 2026-07-18T18:45:45Z
- **Tasks:** 2
- **Files modified:** 7 created

## Accomplishments
- All seven category CSS files (buttons, forms, display, data, navigation, feedback, files) ship under `packages/styles/components/`, with per-file `.lyra-*` counts equal to handoff and a total of 248 unique classes (D-06 inventory target).
- Comment policy enforced identically to plan 02-01: exactly one EN banner per file, zero non-ASCII beyond line 1 (`⌘K`, em-dashes, and pt-BR `múltiplo` label all stripped).
- Three `unpkg.com/lucide-static` chevron mask URLs (forms chevron-down, display chevron-down, navigation chevron-right) rewritten to inline `data:image/svg+xml` URIs with local Lucide path data — honoring the no-runtime-CDN constraint; package-wide `url(...http...)` scan is empty.
- Body-level `diff` against handoff confirms the ONLY divergences are the allowlisted chevron lines; buttons/data/feedback/files bodies are byte-identical.
- No `components/icons/` directory created (icons are React/Lucide, Phase 3); `.lyra-avatar-group` and `.lyra-toast-stack` compound CSS present in their parent category files.

## Task Commits

Each task was committed atomically:

1. **Task 1: Copy buttons, forms, display, data component CSS** - `a2d1a61` (feat)
2. **Task 2: Copy navigation, feedback, files component CSS** - `d0bbf44` (feat)

## Files Created/Modified
- `packages/styles/components/buttons/buttons.css` - 13 `.lyra-*` classes
- `packages/styles/components/forms/forms.css` - 29 classes; chevron-down mask → local inline `data:` SVG
- `packages/styles/components/display/display.css` - 34 classes; chevron-down mask → local inline `data:` SVG; includes `.lyra-avatar-group`
- `packages/styles/components/data/data.css` - 16 classes
- `packages/styles/components/navigation/navigation.css` - 72 classes; chevron-right mask → local inline `data:` SVG
- `packages/styles/components/feedback/feedback.css` - 40 classes; includes `.lyra-toast-stack`
- `packages/styles/components/files/files.css` - 44 classes

## Decisions Made
- Applied a mechanical copy-verify pipeline (strip standalone comment lines, prepend one EN banner) so verbatim fidelity is provable via `diff`, not hand-transcription. This guarantees no `.lyra-*` name or value drift beyond the allowlisted chevron rewrites.
- Chevron `data:` URIs use the CSS color keyword `stroke="black"` rather than a `#`-hex, because in an unencoded `data:image/svg+xml;utf8,` URI the `#` starts a URL fragment and truncates the SVG (blank glyph). This mirrors the working handoff checkmark precedent (`stroke="white"`).
- Included explicit `width="24" height="24"` alongside `viewBox="0 0 24 24"` in the chevron SVGs to guarantee positive intrinsic dimensions for the mask decode asserted in plan 02-05.

## Deviations from Plan

None - plan executed exactly as written. (The three chevron CDN→`data:` rewrites are mandated by the plan and allowlisted in the 02-04 parity script; they are not deviations.)

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Component CSS surface is complete and inventory-locked at 248 `.lyra-*` classes; plan 02-03 can wire these into the `styles.css` entry in the handoff cascade order (buttons → forms → display → navigation → feedback → files → data).
- Plan 02-04 parity script should inventory the 248 classes against `handoff/components/**` and re-run the `url(...http...)` guard.
- Plan 02-05 Browser Mode should assert the chevron `data:` masks decode to non-empty intrinsic dimensions on `.lyra-acc__chevron` / `.lyra-breadcrumb__sep`.

## Self-Check: PASSED

- All 7 component CSS files present on disk.
- Both task commits (`a2d1a61`, `d0bbf44`) exist in git history.

---
*Phase: 02-styles-package*
*Completed: 2026-07-18*
