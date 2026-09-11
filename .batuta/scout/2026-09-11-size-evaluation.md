# Size research — corrected report

GLM first43.08s report contained stale numbers/unsupported causality; one35.81s correction. Both2003-file guards unchanged. Controller rejects unmeasured savings estimates and verifies hypotheses independently.

## Answer
Correction of the prior report against current failed rows and full reads of the two missing owners (tooltip.tsx, workspace-switcher.tsx) plus ≤6 direct deps (tooltip-coordinator.ts, use-tooltip-placement.ts, use-flip-placement.ts, avatar.tsx, icon.tsx, icon-registry via icon.tsx).

Corrections: (1) the three `isProgrammaticallyFocusable` copies are NOT byte-identical — use-focus-trap.ts:47 names its parameter `element` while use-return-focus.ts:20 and use-initial-focus.ts:18 use `target` (bodies are semantically equal); any dedupe claim is a semantic-normalization hypothesis, unmeasured. (2) TimePicker and DatePicker also import `Popover` (time-picker.tsx:7, date-picker.tsx:9), so "pure BottomSheet inheritance" is unproven; BottomSheet import is proven (line 3) but its share of the overage is unknown without build measurement. (3) FileManager imports `Dropdown` (file-manager.tsx:4) and `Icon` (line 3); that inheritance is proven, but the cause of its 308 B overage is unproven. (4) Per-entry duplication is not amplification of one standalone component; with `codeSplitting: false` (tsdown.config.ts:117) separately bundled entries may duplicate shared internals only when composed (e.g. RecurrenceSelector composing DatePicker).

No accidental retained imports, dead branches, or convenience imports were found in any read file. Whether any source-level change closes an overage is unknown — no measurement was taken.

## Files
- packages/react/src/tooltip/tooltip.tsx:1-278 — owner; contract code (coordinator wiring, timers, MutationObserver, Escape handoff). No dead code.
- packages/react/src/internal/tooltip-coordinator.ts:1-127 — per-document coordinator; all symbols used.
- packages/react/src/internal/use-tooltip-placement.ts:30-89 — `::after`/visualViewport measurement; contract code.
- packages/react/src/workspace-switcher/workspace-switcher.tsx:1-289 — owner; imports Avatar/Icon/cx/useFlipPlacement; internal roving-tabindex listbox, no external popup dep.
- packages/react/src/internal/use-flip-placement.ts:34-89 — viewport flip; contract code.
- packages/react/src/avatar/avatar.tsx:22-71, packages/react/src/icon/icon.tsx:52-85 — Icon resolves via curated registry; registry size enters every Icon-consuming entry.
- packages/react/src/time-picker/time-picker.tsx:3,7; packages/react/src/date-picker/date-picker.tsx:3,9 — both BottomSheet and Popover imports.
- packages/react/src/file-manager/file-manager.tsx:2-7 — Dropdown, Icon, useControllableState.

## Evidence
- Param names differ across the three helper copies (grep: `element` at use-focus-trap.ts:47; `target` at use-return-focus.ts:20, use-initial-focus.ts:18) — prior "byte-identical" claim false.
- TimePicker line 7 and DatePicker line 9 import Popover — prior "only modal import is BottomSheet" claim false.
- Tooltip's two internals (coordinator 127 lines, placement 90 lines) are approved-behavior code with live registrations/timers; WorkspaceSwitcher's dep set is Avatar+Icon+cx+useFlipPlacement only.

## Uncertain
Three bounded, measurable hypotheses (unmeasured):
1. Extract the focusability helper to one internal module (semantic dedupe; anchors above). Recovery unknown; may be small given 454 B Tooltip-scale gaps — measure per entry.
2. WorkspaceSwitcher pulls the full curated registry through Icon (icon.tsx:4) for 3 glyphs; direct lucide imports could shrink the 114 B overage — measure before asserting.
3. BottomSheet vs Popover share of DatePicker/TimePicker overages — quantify by building picker variants without one of the two imports; currently unknown, so inheritance causality stays unproven.
