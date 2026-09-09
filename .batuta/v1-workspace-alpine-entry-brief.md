You are the implementation worker already delegated by Batuta. Edit directly; no further delegation/orchestration/worktrees/package managers/hooks/config/ignores/services/commits.
# Alpine WorkspaceSwitcher selected entry — low
## Goal
Prefer the consumer-served selected workspace for arrow-key opening while preserving no-selection fallback.
## Context
Guarded GLM scout and native30-case matrix reproduce current Alpine click/Enter/Space entry to selected middle Beta, but ArrowDown enters Alpha and ArrowUp enters Gamma. Existing Alpine fixture already serves selected index1, yet its arrow assertions pin this contract mismatch. OF-COMPOSED explicitly requires opening to focus selected when available. See .batuta/v1-workspace-entry-diagnosis.md. Existing openPopover(-2)/focusPendingOption resolves served aria-selected=true, falling back first. ArrowDown can use this existing path; ArrowUp must retain last-option fallback IF NO served option is selected, otherwise prefer selected. Do not add state or rewrite the focus helper broadly.
## Conventions
Current Alpine TS and consumer-served markup; existing browser userEvent/Alpine.nextTick fixture conventions. Consumer retains aria-selected and event effects. English patch changeset. No new component/CSS/public binding/dependency. Controller pinned Node24.18.0. No package managers/hooks/config/ignores/services.
## Acceptance criteria
1. ArrowDown/ArrowUp opening focus served selected workspace when present; current Enter/Space/click remain correct. Preserve ArrowDown first/ArrowUp last fallback when ALL served options aria-selected=false. Do not rewrite served selection, introduce an Alpine create event, or change lyra:change payload/ordering/cancellation in this task. Post-open arrows/Home/End, modelable open and close/focus restoration remain.
2. Update only assertions that directly contradict selected-entry contract in existing keyboard test. Add meaningful no-selection fallback coverage and a changed served selection before opening if needed to prove live consumer ownership. Use real keys and current nextTick readiness, exact option focus, no expected-option.focus, source skips/only, timing sleeps, platform branches or permissive assertions. Keep existing axe/placement/model/event/teardown tests.
3. Three scoped files only; Alpine-only patch changeset. Controller three-engine/native/original-source RED/current GREEN/types/lint-if-configured/format/build/size evidence pending. No budget/hash changes.
## Boundaries
No React/API/dependency/export/config/styles/WORK/.batuta changes, hooks/settings/ignores including .impeccable, Colima/Docker/foreign services, remote action, commits or further delegation. If unrelated tooling asks for suppression, report rather than configure it.
## Scope
packages/alpine/src/workspace-switcher.ts
packages/alpine/src/workspace-switcher.browser.test.ts
.changeset/workspace-alpine-selected-entry.md
## Expected evidence
Only read/edit the scoped files and report the exact diff. Do NOT run validation commands: controller runs all pinned checks. In the preceding task the executor ignored the package-manager boundary and used git stash; never repeat that. No git stash/pop/reset/restore/checkout or other git writes. Do not investigate unrelated lint warnings; leave unrelated work intact. Browser/static/build proof belongs to controller.
## Stop conditions
Public binding/API, new dependency/helper/state or broad focus rewrite required; same unexpected failure repeats twice; hook/config modification requested. Stop/report, preserve edits.
