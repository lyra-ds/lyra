# BottomSheet forced-colors focus repair — verified

Maintainer authorized the separate narrow repair on2026-09-13. OpenCode/opencode/glm-5.3-flash, frontend/low, one invocation, no retry/escalation. Exactly one selector added to the existing forced-colors outline rule in packages/styles/components/feedback/feedback.css; Dialog/Drawer selectors and 2px CanvasText outline/2px offset preserved. Product JS, runners, fixtures, locks, dependencies and baselines unchanged.

## Regression evidence

Before: prior immutable BottomSheet report had16/18PASS, Chromium/Firefox forced-colors FAIL with native focus-visible true but outline none and box-shadow none. After fresh Styles pack: BottomSheet18/18, Dialog18/18, Drawer18/18, all exit0. Native focused Close measurements now show solid2px outline and2px offset in Chromium/Firefox. All54 distinct cases have expected source hashes and successful owned cleanup.

Native macOS Node24.18.0/pnpm11.13.1, frozen installation. Controller pnpm test exit0 in168.02s; Styles stylelint exit0; parity PASS (211 tokens,436 classes, placement/at-rule ancestry/no-CDN). Controller reviewed exact single-hunk scope and diff cleanliness. No new test infrastructure.

React package reused only after exact product-tree and immutable tarball SHA verification; Styles packaged fresh from repair worktree25e6c44. Styles SHA2566cdff0c46de5a06f4e25a4d0833af68242aa69d11a4085f6b41ba87b9c87117e; unchanged React SHA256658d9faf2987c5401baf2e665b92ad9b12d7b2f507d6385035006cd06c18a5da. Stage, pack log, gate log and report screenshots are durable below MAIN .batuta/runs/v1-bottom-sheet-focus-20260913/.

- bottom-sheet: `/Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-bottom-sheet-focus-20260913/controller-bottom-sheet/report.json`, report SHA256 `993120b2e76ade931b2c8e8864b6030acf9426fca353bd115e21354fd3bd416c`.
- dialog: `/Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-bottom-sheet-focus-20260913/controller-dialog/report.json`, report SHA256 `d67c1e675b6cd7d01c6fb6f45aeaa4f4c8c6d17fe9c70fafdc0b5c60e0e44c65`.
- drawer: `/Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-bottom-sheet-focus-20260913/controller-drawer/report.json`, report SHA256 `4a5b13083e6526722b117b7e263d9001fd07079d05ff52ab01bfd80466bd62f5`.

This resolves the measured BottomSheet close-focus defect for the native browser-media profile slice. OS high-contrast/manual-device, Linux/Windows, packed release qualification, remaining components, runtime/baseline acceptance and full V1 remain separate pending obligations. No push, merge to main, release or remote dispatch.
