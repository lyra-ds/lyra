# Hybrid pointer target verification — 2026-09-17

PR228 now includes the DataTable checkbox repair and the review follow-up for hybrid devices. A Chromium engine with primary fine and available fine+coarse pointers reproduced18px checkboxes despite touch availability. The five target-sizing queries now also match `(any-pointer: coarse)`. Fine-only controls retain compact geometry. Existing browser regressions cover10 CSS owners in five contexts; unknown configured profile names fail instead of silently becoming fine-only.

Controller proof on product0fcea80, combined source8c67e23 (includes merged PR229):

- Final focused10 tests pass across normal Chromium/Firefox/WebKit, coarse-primary Chromium and hybrid Chromium. Full Styles suite316 tests pass (108/104/104); later retry only strengthens configuration-name validation in the focused file.
- Three negative experiments fail as intended: old CSS leaves the hybrid button at40px; disabling coarse touch fails the required coarse media assertion; renaming the hybrid context and removing its flags fails the unknown-name guard. All current bytes restored; final10tests rerun PASS.
- Stylelint/parity/format and28 browser matrix/config tests pass. Complete existing native bundle gate passes72 standalone entries,5 scenarios,4 CSS entries without threshold changes.
- Public production packed React selection remains functional with trusted taps in all3engines:33 target observations per engine, zero below44px. Each of16checkboxes is44×44px. A separate hybrid engine public-package observation also verifies all16checkboxes at44×44px with primary fine + any coarse.
- Public Chromium native touch scrolling moves the DataTable viewport98px while preserving the selected row; trusted touchmove events are recorded. This covers the table, not modal page locking or anchored scrolling.
- Exact observed Styles archive `3888d2d15fb4e2c307fa41567e347a2753c34cd5871fde3663cecc97066c883d` and React archive `ae3cf0039dca3eea026de16b148a1e07572bcd15d66be90b1214cf2b7b987b54` match the fresh bundle-gate archive map. All23Styles/453React packed files bind to the new isolated consumer. Predecessor consumers remain intact.

Executor OpenCode/glm-5.3-flash (low), one bounded profile-identity retry; independent Codex/gpt-5.6-terra review closes3criteria without remaining findings. GitHub's broad parity-exception P2 redesign is deferred: existing additive-class policy remains, with no baseline regeneration. Raw review adjudication and controller logs are retained under `.batuta/runs/pr223-followup/`; adjacent index hashes them.

This is bounded verification of engine-emulated pointer profiles and packed React behavior, not physical-device, Alpine interaction, whole-profile or1.0candidate acceptance. Modal/anchored scroll, remaining composed requirements and exact versioned release qualification retain separate pending dispositions. Updated CI must pass on the pushed head before the already-authorized admin merge.
