# TimePicker explicit keyboard stops — approved

OpenCode opencode/glm-5.3-flash/low, initial scoped implementation, no retry or escalation. Executor editing completed; its subsequent external Node inspection was auto-rejected by its tool permissions, so no executor validation claim is accepted. The controller independently performed all checks below. No environment/configuration workaround was used.

Criterion1 PASS: the only runtime addition is tabIndex0 on existing option buttons. Full TimePicker Chromium/SSR7, WebKit6, Firefox6 pass. The new exact regression enters via native Tab, continues with a second Tab, exercises Home/End/arrows/clamping and selects09:30 exactly once with Enter. Existing pointer-selection coverage remains.

Criterion2 PASS: removing the single explicit tabindex makes the new WebKit test fail at its first native Tab, BODY versus09:00. Restoring exact source bytes passes (SHA25622202587b8b1aede40147113834ed9bd7aafb5e4f74152ee6f855eb4abfea4c2). No option focus preparation, platform branch, skipped source test or weakened assertion. CLI test filtering only excludes unrelated tests during the negative control.

Criterion3 PASS: controller build, types, scoped ESLint, Prettier, docgen and scope/diff review. Three product files only, including React patch changeset; no API, dependency, style or budget change. Same-tool standalone TimePicker Brotli size is4522B before and after (0B delta). The4kB budget still fails by522B from earlier shared focus work; the full size command retains9 known overages. Dropdown remains within2kB. This is a bounded correction approval, not a passing overall size or release gate. Exact raw ESM/CJS deltas are in size-delta.json; no raw-build identity claim is made. Initial low-lane success does not require independent cross-review.

Raw main evidence: .batuta/runs/v1-time-picker-keyboard-stops-checks and v1-time-picker-keyboard-stops-mutation; prior same-tool size log v1-dropdown-keyboard-selection-checks/size.log. Complete source-browser matrix follows this tranche. Packed/Linux/P1 qualification and wider TimePicker selection/focus contracts remain separate.
