# V1 review loop preflight — 2026-09-13

State: launch blocked before delivery creation. The 38-task plan remains approved; zero loop tasks have run. This is not a Batuta journal terminal state.

Approval committed at `9384eb38250a`. Dedicated checkout: `../lyra-v1-review-loop`, branch `review/v1-completion-loop`, based on that commit. Existing four worktrees and 969 untracked stabilization entries were preserved. No product, profile, routing or dependency changes.

Core v1.1.0-beta.21 supports loop; configured executors are available. Clean-checkout dry-run exited 0: 38 waves at parallel 1; 36 high and 2 medium tasks, all initially Codex/gpt-5.6-terra; Test remains `pnpm test`. Intended plugin skills path is pinned in the approved contract. Dry-run's printed delivery identifier is a preview, not a running delivery.

## Actual gate evidence

Pinned Node v24.18.0 and pnpm 11.13.1. Full `pnpm test` on stabilization at approval commit: exit 1 in 106.47 seconds. The failing Node suite reports 693 tests: 530 pass, 161 fail, 2 skipped. Later suites in the chained global command were not established as passing.

Initial failures include noncanonical/symlink temporary paths. To separate this from the Linux dependency, the clean review checkout ran `node --test tools/overlay-foundation-evaluation/evidence/results.test.mjs` with a fresh canonical TMPDIR below the raw evidence root. Exit 1: 32 tests, 21 pass, 11 fail; explicit error `anchored evidence traversal through /proc/self/fd is unavailable`. This focused probe does not claim all 161 failures share one cause. No frozen installation or full gate was run in the fresh checkout because the built-in-only probe already establishes the host prerequisite blocker.

Raw evidence root: `/Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-loop-preflight-2026-09-13`.

- `pnpm-test.log`: `3bcf178e4e64588619a8e3ec36eabbea05b5690117e248fcd9cfb8a43a907aa2`
- `result.json`: `d1b465bc069bd8c2b4d3390b817ca9c8854b52e8706dbf5bb21de6013df55226`
- `canonical-path-probe.log`: `9e5bd56a63e4298bc03fac1cbeba1306404801b1bb5d7729f0eaaeff25b0dbe1`

## Bounded prerequisite proposal — awaiting separate authorization

Recommended direction: a reviewed Linux gate execution bridge, preserving the actual full test command and security invariants. Do not port secure traversal to macOS or introduce a pathname fallback.

1. Interactive critical design: read the existing Linux execution scripts and CI pins; inspect only the already existing Linux/Colima surface. Specify ownership, source transfer, environment identity, failure propagation, timeout and cleanup before implementation. No VM creation/reconfiguration/restart or foreign service stop.
2. Implementation scope, after that review: one gate bridge and its targeted regression tests under `tools/v1-review/`; only the profile Test entry needed to invoke it, plus an explicit execution-contract amendment. Delegate code through Batuta. Keep `pnpm test` intact inside the Linux environment. No lockfile, dependencies, product sources or evidence-security changes.
3. Use an owned disposable Linux container on the existing running environment, with existing resource limits. Pin the CI image by verified digest and Node24.18.0/pnpm11.13.1; frozen install in its owned root. Transfer the exact task working tree including uncommitted executor edits and needed Git identity; never test only HEAD while accepting a dirty task. Do not share writable host node_modules. Preserve durable evidence outside disposable roots.
4. Acceptance: source/tree binding verified before and after; actual full `pnpm test` exit 0; deliberate failing test returns nonzero through every wrapper; bounded timeout fails visibly; cleanup removes only owned resources; independent review validates the security/environment design and implementation. Missing Linux capacity/access blocks this prerequisite without resource changes.
5. Then repeat preflight in the actual bridge configuration, verify journal/reviewer behavior as required, and launch the already approved 38 tasks sequentially. Plan approval need not be requested again.

Authorization requested is specifically permission to design and implement this reviewed bridge, amend the gate invocation contract, and run owned containers on the existing environment. It does not authorize creating/reconfiguring a VM, raising resources, weakening/omitting tests, or publication. Until authorized and verified, no loop kickoff.
