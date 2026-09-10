# React modal ownership — current baseline, 2026-09-10

Task31 remains open after DataTable commita8bf1d1. Re-ran the existing controller native fixture against current compiled Dialog, Drawer, BottomSheet and CommandPalette artifacts without modifying historical evidence or product source. Exact artifact SHA identities and30native rows are in main .batuta/runs/v1-modal-ownership-current/baseline-result.json; fixture/run/index and complete log are retained beside it.

- Initial destination:9/9PASS across Dialog/Drawer/BottomSheet and Chromium/WebKit/Firefox. The Task33 safe initial-focus repair remains effective.
- Background isolation:12/12contractFAIL across all four modal owners and three engines. Background field has no inert ancestor and accepts programmatic focus while the modal is open.
- Dynamic focused-node removal:9/9contractFAIL across the three content-bearing modals and three engines. Actual native Tab reaches the removable input; application React state removes it; detached input is confirmed; activeElement becomes BODY outside the modal.
- Zero probe/page errors; all owned browsers/server closed. These are two remaining causes, not21independent defects. CommandPalette's private search input was not artificially removed.

The current shared internal/use-focus-trap.ts owns per-keystroke candidate recomputation and temporary native boundaries; it has no mutation-driven recovery. Existing safe initial, returnFocusTo, logical-close, Tab/Escape, scroll and presence contracts must remain. Next cycle point: select a bounded dynamic-focus recovery contract from the normative overlay-family spec:213–216, including nearest eligible destination, panel fallback, no focus theft from another live layer or accepted-close restoration, and exact native proof for removal/disabling/hiding/inerting/insertion. Obtain independent technical review before delegating current-owner implementation. Live background isolation and sibling/topmost/parent-child ownership remain a separate critical design; no mechanism or public API has been selected, and no broad modal qualification is claimed.

No new product change, dependency, CSS/configuration, browser preference, Colima/service/resource or remote/release action. Blade remains deferred under the core/Alpine V1 priority.

## Post-recovery baseline at6b9645c
Controller reran the same30native scenarios against final compiled artifacts: initial9PASS, focused-removal9PASS, backgroundinert12FAIL, zero probe errors. Raw main .batuta/runs/v1-modal-dynamic-focus/remaining-modal preserves fixture/results/artifact identities. Task40 closes local dynamic recovery. Task31 now proceeds to current-owner background isolation and topmost/parent-child design; no broader modality qualification claimed.
