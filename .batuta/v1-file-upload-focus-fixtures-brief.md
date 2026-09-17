You are the implementation worker already delegated by Batuta. Edit directly; no further delegation/orchestration/worktrees/package managers/hooks/config/ignores/services/commits.
# FileUpload removal focus fixtures — low/verification
## Goal
Establish the actual focus-ownership preconditions of the two existing removal tests without changing FileUpload behavior.
## Context
At fa0c4fa, the focused-removal scenario near file-upload.browser.test.tsx:657 clicks Remove middle.pdf without owning focus first. WebKit native mouse activation of an implicit button does not focus it. FileUpload's post-commit fallback is intentionally conditioned on lastFocusedActionRef, which is set by real focus on an action button. Thus no focused-row removal was established. The second case near:707 also expects a native click to focus the fixture Outside control, before asserting it stays focused after the pending row disappears. Controller's32-case native matrix proves an explicit tabIndex0 on that fixture button establishes native pointer focus in this WebKit. Source owner/focusin logic remains unchanged; these are two related focus-ownership fixtures.
## Conventions
Follow existing test style and real DOM/event operations. Preserve ALL current strict focus/no-focus/disabled/onRemove assertions and controlled rerender ordering. Use vitest/browser userEvent.keyboard for native Enter; import it if needed through the already-installed package. No new helper outside these tests, runtime flag, timer, mocked successful focus or dependency. Brief comments may explain actual keyboard ownership/native fixture preconditions. Controller runs canonical Node24.18.0 browser/static proofs.
## Acceptance criteria
1. In FILE_UPLOAD_SCENARIOS.removal, establish focus on each removal action before activating it with real Enter. Assert the initial middle action actually has focus. Retain the existing disabled/no-early-focus assertions before controlled commit, and exact next/previous/file-input focus assertions after each committed removal. The later removal activations occur AFTER the previous fallback assertion, so preparing a later action cannot hide a failed fallback. Retain exactly3 onRemove calls. Never focus the fallback target to make an assertion pass.
2. In the existing no-steal case, establish focus on Remove report.pdf and activate it with real Enter before leaving. Keep the actual pointer click on Outside control; give that fixture button explicit tabIndex0 in BOTH renders. Preserve exact Outside focus and file-input not-focused assertions before/after removal. No programmatic Outside focus substitute, no skipped ownership precondition, no removed assertion.
3. Only the scoped test file changes. No FileUpload/runtime/styles/API/protocol/dependencies/config/generated docs/changeset changes. Controller verifies three engines, existing full file tests, types/lint/format, and a negative control against the real outside-focus ownership reset.
## Boundaries
No source or product DOM decoration, permissive assertions, sleeps/retry loops, test skips/only, mocks, new dependencies/hooks/settings/ignores, WORK/.batuta edits, Colima/Docker/foreign services/remote actions or commits.
## Scope
packages/react/src/file-upload/file-upload.browser.test.tsx
Do not change anything outside this list; stop and report if more is required.
## Expected evidence
Actual diff/checks and changed paths. Browser/native ownership and negative-control proofs remain pending for controller; do not claim them. Static tools may use pinned Node directly; no package-manager invocations.
## Stop conditions
Source/test fixtures contradict these preconditions; a runtime/config edit is needed; same unexpected check failure repeats twice. Preserve unrelated work.
