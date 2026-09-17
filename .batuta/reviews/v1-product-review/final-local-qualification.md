# Final local qualification — 2026-09-15

Candidate: `5ac89229872cb48d0f4b26920588e9a2d515c113`, including the behavior-verified Tabs repair `1028ee48da4544d2c69fb9de9459c165778d1717`. Native macOS arm64; pinned Node 24.18.0, pnpm 11.13.1, Playwright 1.62.1 and Vite 8.2.1. **Local size qualification remains blocked; stable V1 is not yet accepted.**

## Results

| Existing check | Result |
| --- | --- |
| Workspace format, build and typecheck | PASS |
| Native installed-tarball bundle-budget gate | FAIL: React Tabs 1,567 > 1,500 bytes; no limit changed |
| publint Styles, React and Alpine | PASS |
| Packed React/Alpine type resolution and existing distribution scans | PASS; existing Alpine ESM advisory exception retained |
| Alpine Size Limit | PASS: 23,466 <= 24,200 bytes |
| Styles pack-smoke and React/Styles Vite, Next.js, ESM/CJS smoke | PASS |
| React 18.3.1 and 19.2.8 compatibility | PASS each: types, build, SSR, hydration, browser, P1 SSR and P1 browser |
| Packed Alpine public browser tests | PASS: 338 per pinned engine, 1,014 total; no-op-plugin negative fails as expected |
| Security, phase0, release policy, V1 core and V1 release consistency checks | PASS; consistency is not full acceptance |
| React/Alpine/Blade generated documentation, Blade API snapshot and icon registry drift | PASS |
| Existing FileUpload runtime producer | PASS: six operations, 100 items, 20 active attempts, 30 samples each; maximum p95 1.0ms, worst 1.300001ms, no long task in measured windows |

The initial FileUpload invocation refused untracked verification consumers. Only the 14 owned temporary consumers/scripts were moved outside the checkout during the unchanged producer, then restored in `finally`. The clean invocation passed. Both outputs and the restoration record are retained; the clean-tree guard was not disabled.

## Artifact identity and scope

- React: `f8d99e449fd5ed7e514b7e80e0b96edcd42a1d987f84d4e73fa108401fff63c9`
- Alpine: `09c6351db2f7ad35dfe44e68c91e782d4f71b3e84aa0c00fa0d02a0ed8f1c0b3`
- Styles: `e45ff57fd43e8bc0094c9c574e25ff5721128cd185e7a12979ae8892a8c33bf6`

After the verification commands, all 479 non-manifest shipped files still match the retained Tabs-repair archives. The fresh FileUpload report names the exact React/Styles hashes above. Alpine runtime binding and package checks name the same Alpine/Styles artifacts. Package manifests use pnpm normalization and are compared to archive contents in the original packing proof, not falsely equated to workspace JSON formatting. React compatibility browser phases use Chromium; the separate Alpine/Tabs records provide their own three-engine evidence.

## Size decision

The bounded React-only optimization failed at 1,560, 1,561, 1,535 and 1,535 bytes (Codex/Terra medium plus retry, high plus retry). No prototype was integrated. Raw source/diffs were preserved and the isolated worktree removed. A native nearest-container scrolling probe failed owner locality on Firefox/WebKit and was rejected. The current branch retains the verified 1,567-byte implementation.

The [proposed Tabs-only 1,600-byte cap](../../specs/2026-09-15-tabs-budget-proposal.md) is concrete but **not approved or applied**. The previous budget authorization excludes this entry. Do not resume repeated micro-optimization or change a gate silently. After a decision, re-run the existing applicable budget proof and bind the resulting manifest identities.

## Retained evidence and next point

Controller raw directory: `.batuta/runs/final-local-qualification-20260915/` — `attempt-2/`, `alpine-packed/`, `unchanged-alpine-styles/`, `policy-and-docs/`, `remaining-local/`, and `final-byte-binding.json`. Optimization evidence: `.batuta/runs/tabs-size-closure-20260915/`. Existing Tabs source/packed/negative evidence remains in [the repair record](tabs-reflow-focus.md).

The [remaining acceptance record](remaining-acceptance.md) still governs actual zoom, applicable touch/composed media evidence, native Linux/Windows integration and consolidated immutable acceptance. These are pending, not waived by package or policy PASS results. No new tests, dependencies, producers, runtime code, accepted evidence pointers, limits, versions or remote actions were introduced in this qualification round.
