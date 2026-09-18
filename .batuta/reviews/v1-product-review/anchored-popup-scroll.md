# Anchored popup scrolling — 2026-09-17

Status: local functional and official budget verification pass; CI remains pending.

A public packed Dropdown with 40 commands extended to y=2120 in a 390 × 844 viewport. A native gesture moved the page rather than the menu. The existing React and Alpine placement owners now constrain Dropdown, Popover and WorkspaceSwitcher to the available chosen-side viewport region, retaining native overflow. Explicit Popover sides are respected. Fitting authored geometry remains intact; owned inline changes and observers are cleaned up. React keyboard navigation reveals commands and the selected workspace in layout coordinates, avoiding entrance-transform errors and unwanted page movement. Combobox retains its existing behavior.

## Verification

- 93 React and 65 Alpine focused cases pass in each of Chromium, Firefox and WebKit: 474 total. Existing Combobox coverage is included. Both type checks, formatting and diff checks pass. React lint passes with one unrelated pre-existing warning.
- Six public packed native-touch, keyboard and selection cases pass across both adapters. The production fixture rejects imports from workspace product sources. Trusted gestures scroll the popup; the containing page stays fixed. A separate selected-last WorkspaceSwitcher proof confirms focus, native hit testing, popup scrolling and unchanged page offset.
- The selected-last source regression fails before the focus fix and passes after it. A proposed size isolation was rejected after a real idle-render diagnostic failed; the exact verified source was restored, and that diagnostic passes. The rejected source and logs are retained outside product code.
- Independent OpenCode/GLM review returns three DONE verdicts. Hypothetical node replacement and future direct-caller concerns do not apply to the current owners; the adjudication is retained.

Codex/Terra high implemented the initial repair and one retry; critical controller corrected focus coordinates, selected-last visibility and observer delivery. One subsequent Terra size optimization was rejected rather than expanding the implementation scope. The maintainer explicitly approved the 13 measured limits in `.batuta/specs/2026-09-17-anchored-scroll-budget-exceptions.md`; approval does not itself mean the budget gate or CI passed.

Raw controller evidence is retained in the main checkout under `.batuta/runs/pr223-followup/anchored-critical-*`, including the exact source diff and packed identities. Pre-approval archives and diagnostic measurements remain historical. The standalone diagnostic is not a formal protocol PASS. This repair does not close composed/media reconciliation or exact versioned V1 candidate acceptance; publication remains separate.

## Approved budget verification

The real `pnpm baseline:bundles --check-budgets` passes all 72 standalone entries, five scenarios and four CSS entries after exactly the 13 approved cap changes. All 40 budget unit cases pass. The React archive is now `9d07d9ddfbefc4841de0da490c085d51cf4a333f8ecdd3df88a59c3148687cc2`; comparison with the public-proof archive confirms all 452 other files are byte-identical, with only the four size-limit metadata values changed in package.json. Alpine and Styles archive hashes remain unchanged. This rebinds the existing native proof to the newly measured artifacts without claiming another runtime change or waiving the gate.

## PR #231 review follow-up

Greptile comment `4042767432` identified missing permanent Alpine focus-scroll coverage. The existing long-menu case now opens with ArrowDown, uses End to focus the last command, and asserts native popup scrolling, active focus, complete command visibility and unchanged page offset with a scrollable background. The consumer-style restoration assertions remain. OpenCode/GLM implemented this test-only update; controller ran all 20 Dropdown cases in each of Chromium, Firefox and WebKit (60 passing). A controlled mutation adding preventScroll to keyboard-command focus makes the new assertion fail with scrollTop zero; exact product source was restored. No production file or packed artifact changed. All CI checks passed on predecessor 7f1fc845; the new test revision requires its own CI before merge.
