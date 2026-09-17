# Branded native workspace Promises — 2026-09-17

PR223's retained review finding is reproduced: CreateWorkspaceDialog used Object.prototype.toString to recognize a native Promise. A custom Symbol.toStringTag made a valid held Promise look like malformed synchronous data, entering error before the consumer acknowledged the request.

The repair uses the native Promise intrinsic for the actual subscription, once, independent of the display brand or originating realm. Non-Promise results retain synchronous settlement. No public PromiseLike support, operation ownership, cancellation contract, or later onClose exception handling changes.

## Verification

- The final parameterized regression uses held genuine native Promises from the current realm and a same-origin iframe, each with custom branding. Pending state and absence of error/close precede the matching accepted acknowledgment; close occurs exactly once.
- Restoring the original component makes both new cases fail with error instead of submitting. Current source bytes were restored exactly.
- Chromium, Firefox and WebKit run separately: all 12 component browser cases pass in each engine; the SSR case passes (37 distinct checks). Combined-engine attempts collided in existing trace chunks and remain retained as failed attempts, not product failures or positive evidence. Existing CI invokes engines separately.
- Full React typecheck, scoped ESLint and formatting pass. The package builds through the complete native bundle gate: all 72 standalone entries, five scenarios and four CSS entries pass. CreateWorkspaceDialog's Brotli migration delta is 5,003B against the unchanged 5,008B exception; absolute measurement 7,476B against 7,900B. No cap, dependency, API or CSS changes.
- Independent GLM review: three criteria DONE, no findings. Initial medium delivery and one retry needed a narrow high-lane fixture typing correction using the existing iframe window accessor. Initial over-budget and type/lint failures remain retained.

React archive: `ae3cf0039dca3eea026de16b148a1e07572bcd15d66be90b1214cf2b7b987b54`. This branch is based on security main aeb9fd19 and retains Styles archive `e45ff57fd43e8bc0094c9c574e25ff5721128cd185e7a12979ae8892a8c33bf6`; PR228 independently repairs coarse-pointer CSS. Final combined candidate binding remains required. These results do not constitute stable V1 qualification or publication authorization.

Raw logs and the original-source negative proof are retained in the controller checkout under `.batuta/runs/pr223-followup/workspace-promise-*`. The adjacent SHA-256 index binds the recorded local evidence; it is not the consolidated immutable candidate mechanism.
