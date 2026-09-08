# Drawer repair verification — 2026-09-08

Base `de551a4`. Medium/Codex gpt-5.6-terra, two planned stages in one executor
session; tests first, controller RED, then minimal runtime repair. No retries
or escalation. Original repair brief retains the three acceptance criteria.

## Controller checks

- Existing Drawer Chromium baseline: 6/6 PASS, exit 0. Existing Drawer SSR: 2/2 PASS.
- Stage 1 left production unchanged. New Chromium regression: exactly 1 failed / 7 passed, exit 1. Line 137 expected zero onClose calls, got one. RED confirmed before stage 2 was dispatched.
- Separate real-pointer acceptance replay against original source: expected 0, got 1; captured trusted events and closed browser/server. Historical diagnostic files unchanged.
- Current Drawer and Dialog Chromium plus SSR: 43/43 PASS, 4 files, exit 0. Includes both new regression/control tests and existing Escape/close/presence/WR-02 cases.
- Current trusted Chromium replay: six scenarios PASS, exit 0, no page errors. Both overlays produce 1 close for backdrop, 0 for inside click and 0 for inside-to-backdrop. Real mouse events, all isTrusted. Owned browser/server closed.
- WebKit current: 32 passed, 6 focus-restoration failures. Exact original Drawer source AND tests were temporarily restored from de551a4 and checked in the same environment, then fixed bytes restored in finally: baseline 30 passed, the exact same 6 named failures. No new WebKit failures; two added tests pass. Comparison of failure-name lists is exact. These existing failures remain open, not waived or fixed by this patch.
- React package tsc --noEmit, scoped ESLint and Prettier all exit 0. git diff --check passes. No skip/only or permissive assertion introduced.

## Acceptance boundary

Criterion 1 is proven RED/GREEN by both colocated regression and trusted input.
Criterion 2 is green in Chromium/SSR and shows unchanged existing WebKit failures.
The brief's literal all-existing-tests-pass outcome is not claimed for WebKit.
Controller accepts this isolated fix on absence of new failures, while retaining
those six baseline-confirmed failures as release debt; do not expand this patch
to focus handling or misreport full matrix success. Firefox is not installed;
no browser installation or pinned Linux matrix run occurred. V1 qualification
remains pending. This is a scoped regression verdict, not relaxed release policy.
Criterion 3: exactly two production/test paths changed; API, dependencies, styles,
Dialog, other packages, workflow and ledger unchanged. Temporary links to existing
dependencies were removed. No Colima/Docker invocation, install, remote operation
or experimental comparison. One initial temporary-link setup typo was corrected
before tests; no source or user configuration was affected.

Raw logs, runner/fixture and hashes are in .batuta/runs/v1-drawer-repair/.
The runner's successful exit validates repaired behavior; its separate historical
counterpart still records the old defect. Tested source SHA-256:
{
"packages/react/src/drawer/drawer.tsx": "b6ee36fb64195f1a24cdb032c3b20325dfabb3650b75913af3f6a987b5cbab13",
"packages/react/src/drawer/drawer.browser.test.tsx": "7ef5b51165d61c376f8ce3fe33fd68eba37375fad2f06107f7d262c3d8959feb"
}

Independent three-criterion review approved with the stated baseline limitations;
unchanged guards and normalized Batuta verifier 3/3 DONE. See v1-drawer-repair-review.md.
