You are the implementation worker already delegated by Batuta. Edit directly; no further delegation/orchestration/worktrees/package managers/hooks/config/ignores/services/commits.
# TimePicker explicit keyboard stops — react/low
## Goal
Preserve the current TimePicker option tab sequence explicitly across native browser engines and prove keyboard selection.
## Context
At ca0ba67, time-picker.tsx option buttons near line203 have implicit tabindex0. Existing keyboard-opening browser test near line60 expects native Tab into the first option but fails in WebKit (BODY instead). Controller32-case native matrix establishes implicit role=option buttons are skipped there, explicit tabIndex0 works without environment changes. Existing arrows/Home/End handler already operates on the option buttons; keep it unchanged. This is a bounded compatibility fix, not a new roving model. Existing all-option native Tab sequence in Chromium must be retained.
## Conventions
Follow current React TypeScript, colocated Vitest/browser userEvent tests and Conventional Commit patch changesets. CSS-first .lyra-* markup, no style change. Product runtime has no new dependencies. Existing trigger preparation via focus() is allowed, but NEVER focus an option to prove entry. Controller runs pinned Node24.18.0 tests. Read packages/react/CONVENTIONS.md if needed; new documentation English.
## Acceptance criteria
1. Add explicit tabIndex={0} to each existing time option button only. No new state/handler/helper/roving model, API/markup variant/dependency change. Native Tab from the keyboard-opened trigger reaches first option; next Tab reaches second option, preserving current sequential behavior.
2. Keep current pointer selection and existing tests. Add one focused regression using min09:00/max10:00/step30: Enter opens, native Tab reaches09:00, Tab reaches09:30, Home reaches09:00, ArrowDown reaches09:30, End reaches10:00, Home then ArrowUp stays09:00, ArrowDown then Enter selects09:30 exactly once, closes the listbox, updates trigger text. Exact option focus assertions after each action. No option.focus(), DOM tabindex decoration by tests, engine branches, delays, permissive assertions or new source skips. Do not assert return focus after selection: that wider Popover contract is not this task.
3. Add React-only patch changeset explaining keyboard access to time options. Only3 scoped files change; controller runs all3 engines, types/lint/format/build/docgen and affected size measurements. TimePicker already exceeds its4kB budget from shared focus work; do not change a budget or claim that overage is resolved. Controller runs original-source RED/current GREEN proof.
## Boundaries
No new dependency/lockfile/config/styles/generated docs/WORK/.batuta changes. No hook settings/ignores, Docker/Colima/foreign services, remote action, commits or further delegation. Do not introduce a custom keyboard model or change focus-return behavior.
## Scope
packages/react/src/time-picker/time-picker.tsx
packages/react/src/time-picker/time-picker.browser.test.tsx
.changeset/time-picker-keyboard-stops.md
Stop/report if more is required.
## Expected evidence
Actual diff, changed paths, checks actually run. Static commands may invoke pinned Node directly, no package manager. Native/browser/build/negative-control/size evidence remains pending for controller.
## Stop conditions
A wider public API or navigation change is needed; runtime behavior contradicts described scope; same unexpected check fails twice. Preserve unrelated work.
