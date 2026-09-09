You are the implementation worker already delegated by Batuta. Edit directly; no further delegation/orchestration/worktrees/package managers/hooks/config/ignores/services/commits.
# Calendar native Tab fixtures — low/verification
## Goal
Make the two existing picker keyboard-entry tests follow the browser's native Tab sequence while retaining the exact Calendar destination and selection behavior.
## Context
Source baseline1884796. Current tests date-picker.browser.test.tsx:71 and date-range-picker.browser.test.tsx:74 send Enter plus exactly4Tabs. Current-source controller traces prove WebKit reaches the intended active day on Tab1, BODY on Tab2, day on Tab3 and BODY on Tab4. The original4Tab walk passes Chromium, whose Tab sequence includes three native Calendar header buttons. The active grid day already has explicit tabindex0; no Calendar or picker runtime change is needed. Popover correctly retains trigger focus on Enter opening. This is one coupled fixture task for the shared Calendar cause.
## Conventions
Preserve existing React/TypeScript test style, all exact role/name/focus/onChange/normalization/close assertions and real userEvent keyboard delivery. No shared helper or framework is needed for two short test-local walks. A bounded sequence of native Tab gestures is not an assertion retry/poll: do not add sleeps, expect retries or programmatic target focus. One concise comment may explain native header-button participation. Controller owns browser and mutation proofs.
## Acceptance criteria
1. In each existing keyboard-entry test, open with real Enter first and assert focus still on the real trigger. Resolve the SAME expected active-day button used by the original assertion. Send real Tab gestures until that exact element owns document.activeElement, with a strict maximum of4 gestures. Then retain the original exact target assertion and all following selection/normalization/close assertions. No target.focus(), injected tabIndex on product elements, engine-name branch, unconditional4Tabs, timeouts, skips or weaker assertions. The pre-loop trigger-focus assertion ensures actual Tab entry is required.
2. Change only the two scoped tests. Calendar/Popover/picker runtime, public API, styles, dependencies, config and generated files unchanged; no changeset. Controller verifies Chromium/SSR, WebKit, Firefox and that removing the active Calendar day's sole native tab stop still makes both entry tests fail, with exact source restoration afterward.
## Boundaries
No product DOM decoration, fake focus/mocks, disabled checks, new dependencies/hooks/settings, WORK/.batuta edits, Colima/Docker/foreign services/remote actions or commits.
## Scope
packages/react/src/date-picker/date-picker.browser.test.tsx
packages/react/src/date-range-picker/date-range-picker.browser.test.tsx
Do not change anything outside this list; stop and report if more is required.
## Expected evidence
Exact paths/diff and actual diff-check/format results if run. Browsers and source-mutation proof stay pending for controller. Direct pinned Node24.18.0 static tools allowed; no package managers.
## Stop conditions
Source fixtures or expected targets contradict this description; any runtime/config change is needed; same unexpected check failure repeats twice. Preserve all unrelated work.
