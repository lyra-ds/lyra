# Tooltip focus fixture — approved

Low/verification, OpenCode opencode/glm-5.3-flash, initial delivery accepted with no retry or escalation. Only the focused-lifecycle fixture's target button declares tabIndex0, with a native-policy comment. All original real Tab and exact focus/hover/open/blur/close assertions remain. No runtime, API, dependency, styles or generated artifact change.

Criterion1 PASS: scoped Chromium/SSR8, WebKit7 and Firefox7. A negative control temporarily removed both child/root blur-close calls from unchanged Tooltip source: the exact lifecycle test failed open versus closed, then passed after byte-identical source restoration (SHA256 51f50e41a67dd94d9a14f63c6c159bf393a51f34890affdda4af6112efe8555a). The focused negative control excludes six unmatched tests through the CLI filter; no test skips were added.

Criterion2 PASS: types, scoped ESLint, Prettier and diff hygiene. Product diff is exactly one test file with four inserted lines. Original baseline source/library code is intact. Independent cross-review is not required for a successful initial low-lane fixture task. Controller owns these reproduced proofs; executor output was not treated as evidence.

Raw main evidence: .batuta/runs/v1-tooltip-focus-fixture-checks and v1-tooltip-focus-fixture-mutation. Executor log remains under worktree .batuta/runs/v1-tooltip-focus-fixture. Remaining Calendar/FileUpload fixture work and actual TimePicker keyboard entry are Tasks14–16; wider Tooltip timing/P1/packed Linux qualification remains open.
