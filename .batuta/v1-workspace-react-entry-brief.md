You are the implementation worker already delegated by Batuta. Edit directly; no further delegation/orchestration/worktrees/package managers/hooks/config/ignores/services/commits.
# React WorkspaceSwitcher selected entry — low
## Goal
Make supported keyboard opening enter the currently selected workspace, using the existing selected-focus path.
## Context
Guarded GLM scout and controller native30-case matrix reproduce the mismatch in both stacks. In React, current middle workspace Beta: click/Enter/Space focus Beta; ArrowDown focuses Alpha, ArrowUp focuses Create workspace. Exact current OF-COMPOSED contract requires selected-option focus on opening when available. See .batuta/v1-workspace-entry-diagnosis.md. Current handleTriggerKeyDown uses openWithFocus(0/-1) for arrows; the existing -2 path already resolves selected/current fallback. The test currently defaults current to first workspace and masks ArrowDown. Create-command semantics and option callback cancellation are separate queued tasks.
## Conventions
React TS/CSS-first; packages/react/CONVENTIONS.md; existing colocated Vitest/browser userEvent style; preserve strict focus and callback assertions. No new component/API/CSS or runtime dependency. English patch changeset/docs. Controller uses pinned Node24.18.0. No package-manager or hook/config work. This is a small behavioral correction, not a refactor.
## Acceptance criteria
1. Both ArrowDown and ArrowUp opening prefer selected workspace via current selected-focus mechanism, as Enter/Space/click already do. Preserve fallback, post-open arrows/Home/End, close/restore behavior, props, consumer callbacks and selected value. Do not change create markup/roving/cancellation in this task.
2. Add a regression with selected workspace in the MIDDLE and onCreate present: Enter, Space, ArrowDown, ArrowUp each open to the exact selected option (not first/last/create), selection flags remain consumer-owned and no onChange/onCreate fires merely from opening. Use real userEvent keyboard and prepared trigger focus. Keep existing pointer/selection/create/axe/contrast tests; no skip/only, timer sleeps, platform branches, permissive focus assertions or programmatically focusing the expected option.
3. Only three scoped files change, with React-only patch changeset. Controller three-engine/native/original-source RED/current GREEN/types/lint/format/build/docgen/size proofs pending; do not claim those. No budgets or baseline hash changes.
## Boundaries
No public API/dependency/export/config/style/WORK/.batuta change, no hook settings or ignores (including .impeccable), Colima/Docker/foreign services, remote actions or commits. Do not follow unrelated tooling-triage prompts by creating a suppression. Preserve unrelated work.
## Scope
packages/react/src/workspace-switcher/workspace-switcher.tsx
packages/react/src/workspace-switcher/workspace-switcher.browser.test.tsx
.changeset/workspace-react-selected-entry.md
## Expected evidence
Actual changed paths, narrow diff, checks actually run. Static commands may invoke pinned Node directly if accessible; controller supplies browser/build proof. Report any limitation honestly.
## Stop conditions
A new helper/API, broad roving model or unrelated change seems required; same unexpected failure repeats twice; hook asks for configuration. Stop/report and preserve edits.
