# React Tabs standalone budget — proposed decision

Status: **proposed; not approved or applied**. Decision owner: Francis / Lyra maintainers. Scope: incumbent V1 React Tabs only.

## Concrete decision

Raise only the standalone React Tabs Size Limit from **1,500 to 1,600 bytes** (`1.5 kB` to `1.6 kB`). Retain the behavior-verified implementation in review commit 1028ee48da4544d2c69fb9de9459c165778d1717/current 5ac8922. Its measured size is 1,567 bytes, leaving 33 bytes of headroom. The threshold rises 100 bytes (6.67%); approving a threshold does not add bytes to that existing implementation.

The change would update the Tabs row in `packages/react/package.json` and add the matching 1,600-byte absolute cap for `@lyra-ds/react/tabs` to `tools/bundle-baseline/budgets.mjs`. The native gate independently enforces approved caps, so changing the manifest alone is insufficient. No other entry, migration/scenario ceiling, historical reference, artifact pointer, dependency or version changes.

## Reason and alternatives investigated

The existing focus-reveal repair preserves visible focus for narrow long pill tabs, RTL and controlled no-op consumers. It has 126 React/Alpine source executions, 84 packed public-example observations and 16 negative controls in the retained Tabs repair record. The local final producer reports 1,567 > 1,500 bytes for React Tabs.

A bounded optimization cycle produced 1,560, 1,561, 1,535 and 1,535 bytes (medium/retry/high/retry). All failed the unchanged cap. The high prototype added a shared ref hook and equivalent eligibility simplifications; it was not integrated or fully behavior-qualified. Raw diffs and measurements remain in controller `.batuta/runs/tabs-size-closure-20260915/`. The isolated worktree was removed after preservation. Continuing micro-optimization would add code-review cost without an established path below 1,500 bytes.

A native `scrollIntoView({container:'nearest'})` alternative was also rejected: the pinned Firefox and WebKit still scrolled an outer ancestor. No native-only or browser-specific replacement was introduced.

## Verification after approval

Delegate the two configuration edits through Batuta; verify exact scope and unchanged shipped runtime/CSS bytes. Run the existing native installed-tarball budget command, workspace size checks and applicable existing budget tests, with a 1,601-byte negative boundary proof. Capture new package identities because the manifest changes, and bind unchanged runtime evidence by byte comparison. Do not relabel a historical failed check as passing.

## Authority and remaining work

The September 11 standalone-budget approval explicitly excludes changes to the other 61 entries, including Tabs. The shared quality specification requires approval for a V1 gate change. This proposal therefore requests a narrow new decision; technical verification alone does not authorize it.

This is not final stable-V1 approval. Remaining media/actual-zoom/touch acceptance, native Linux/Windows integration and consolidated immutable acceptance remain as recorded in `.batuta/reviews/v1-product-review/remaining-acceptance.md`. Push, merge, workflow dispatch, versioning and publication remain separate actions.
