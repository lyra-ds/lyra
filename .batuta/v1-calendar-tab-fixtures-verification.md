# Calendar native Tab fixtures — approved

OpenCode opencode/glm-5.3-flash/low, initial delivery, no retry or escalation. The two coupled picker tests now open with Enter, assert trigger focus, then send at most four native Tabs until the exact existing active-day target is reached. All original selection, reversed-range normalization and close assertions remain. No target.focus(), product DOM decoration, engine branch, delay or permissive assertion was introduced.

Criterion1 PASS: Chromium/SSR10, WebKit8, Firefox8. The current-source trace established WebKit reaches the intended day on the first Tab and overshoots on the fourth; Chromium passes with its header-button traversal. The bounded walk exercises real keyboard entry with an exact destination.

Criterion2 PASS: types, scoped ESLint, Prettier, scope/diff hygiene. Negative control changed Calendar's sole active-day tabindex0 to-1: BOTH entry tests failed BODY versus the exact day. Both passed after byte-identical source restoration (SHA256 5e49388c9c84e390d9ad5ff8c47eb2578df78ba10aa82d980b732e0b3d62afe2). The focused CLI filter excluded unrelated cases; no source skips were added. Only two test files differ; all shipped runtime is unchanged. Independent review is not required for a successful initial low-lane fixture task.

Raw main evidence: .batuta/runs/v1-calendar-tab-fixture-checks and v1-calendar-tab-fixture-mutation; original trace logs webkit-baseline-tab-trace-*.log. Wider picker/overlay/P1/packed release qualification remains separate.
