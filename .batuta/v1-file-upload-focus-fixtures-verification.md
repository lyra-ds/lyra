# FileUpload removal focus fixtures — approved

OpenCode opencode/glm-5.3-flash/low, initial delivery, no retry or escalation. The removal scenario establishes and asserts initial action focus before native Enter; subsequent Enter activations follow the exact committed fallback assertions. The no-steal fixture retains a real pointer click on an explicit-tab-stop Outside control. All disabled, no-early-focus, next/previous/input, controlled-commit and onRemove assertions remain intact.

Criterion1 PASS: full FileUpload Chromium/SSR40, WebKit39 and Firefox39. Exact fallback destinations are asserted only after controlled removal commits; the fixture never focuses those destinations to satisfy its assertions.

Criterion2 PASS: removing only the real outside-focus ownership reset makes the no-steal test fail: file input steals focus from Outside control. The test passes after byte-identical source restoration, SHA256 cef6fb2ccc520ae08b75e0ef4d08fc38545104bbfea2e96475d05bd921323a56. The focused CLI filter excludes unrelated cases; no source skips were added.

Criterion3 PASS: controller types, scoped ESLint, Prettier and scope/diff review. Only one test file changes; shipped runtime is unchanged. Initial low-lane success needs no independent cross-review. Raw main evidence: .batuta/runs/v1-file-upload-focus-fixture-checks and v1-file-upload-focus-fixture-mutation. Broader upload/P1/packed release qualification remains separate.
