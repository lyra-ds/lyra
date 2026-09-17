# React WorkspaceSwitcher selected entry — approved

OpenCode opencode/glm-5.3-flash/low, initial scoped implementation, no product retry or escalation. All four supported opening keys now use the existing selected-focus path; no public API, placement, post-open navigation, create markup or callback effect change.

Criterion1 PASS: controller full owner Chromium/SSR9, WebKit8, Firefox8. Native built15/15 across3engines covers click/Enter/Space/ArrowDown/ArrowUp with selected middle Beta and create action present; each enters the selected workspace. Current before-build30-row baseline had6React arrow failures (plus6Alpine failures reserved for Task20). No native page errors; owned browsers/server closed.

Criterion2 PASS: final new test retains exact selected flags, Beta focus, no change/create callback during entry, Escape close/restore. Original HEAD source fails the actual ArrowDown destination; exact source restoration passes (SHA256688c28e3558955d4e0ced1b60ff321b4d7d46e21d733012d138358cea30fbf3d). Existing contrast/axe/selection/create tests preserved. CLI filtering accounts for excluded cases in negative logs; no source skips.

Criterion3 PASS: pinned Node24 controller types, scoped ESLint, formatting, build/docgen and diff/scope checks. Three scoped files only. Displayed standalone size8.14kB, previously8.17kB, within8.25kB;10unrelated existing size overages remain. No budget/hash/dependency changes. No independent cross-review is required for an initial low-lane product delivery.

Process deviation: executor disregarded its command boundary by running pnpm under Node26 and temporarily using git stash/pop for an unrelated lint warning. Those checks are not accepted as evidence. Controller audited the final tracked/untracked scope, expected managed SHA updates and unchanged protected files; only intended edits remain and no stash remains. No retained tool/configuration change. The next worker brief explicitly forbids all validation and git writes, leaving pinned checks to controller. This records the deviation without endorsing it or discarding valid independently verified code.

Raw main: runs/v1-workspace-react-entry-checks and v1-workspace-react-entry-regression. Raw worktree: runs/v1-workspace-entry-native/react-final-result.json and baseline-result.json; executor log under runs/v1-workspace-react-entry. Broader create-command/listbox, cancellation/anchored, Alpine and packed/P1 qualification remain separate.
