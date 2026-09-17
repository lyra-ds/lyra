# Critical completion — native modal Tab containment

The single high-lane retry fixed both native matrices (8+8 pass), but WebKit new
tests incorrectly require platform-skipped radio/button stops. Chromium/SSR115
passes; WebKit98/102 has the same2 baseline BottomSheet failures plus2 new fixture
failures at use-focus-trap.browser.test.tsx:182 and259. ESLint flags prefer-const
at use-focus-trap.ts:116-117. Types and formatting pass.

Controller critical scope: correct the two test preconditions/expected native
sequence and the two immutable resource declarations in the original source/test
scope. Preserve the verified boundary mechanism and all strict containment,
count/cleanup assertions. Compare active traversal to the same real browser's
inactive-hook traversal; make external fixture buttons explicitly keyboard stops.
This does not override a browser preference or prepare a mouse opener. No test
skip, UA branch, dependency, API or other component edit. The original BottomSheet
assertions remain failing/unqualified; do not fix or weaken them in this slice.

Retain retry source/tests and logs. Run actual native control diagnosis, then
final focused Chromium/WebKit suites, types/lint/format, current-hash native
main/edge probes. Independently review full original brief plus feedback and this
completion contract. No reset of verified code or unrelated worktree state.
