# WebKit source baseline — diagnosis in progress

The Dropdown task is committed as d25f433. Its final Chromium/SSR suite passed779 tests; focused Dropdown tests passed23/22/22 and compiled27 plus the consumer-reorder proof. No source is being changed in this diagnosis.

The preceding broad browser baseline passed679/679 Firefox tests and673/679 WebKit tests. The six WebKit failures are:

| Owner | Exact failed behavior | Observed result |
| --- | --- | --- |
| DatePicker | Enter plus four Tabs reaches the selected Calendar day | BODY instead of selected button |
| DateRangePicker | Enter plus four Tabs reaches the range Calendar | BODY instead of day button |
| TimePicker | Opening plus Tab reaches the first listbox option | BODY instead of option button |
| Tooltip | Tab reaches the trigger in the focused lifecycle fixture | BODY instead of trigger button |
| FileUpload | Confirmed removal restores focus after controlled commit | Focus assertion fails |
| FileUpload | Outside control retains focus after leaving pending removal | Native pointer click did not focus Outside control |

Raw evidence: main .batuta/runs/v1-dropdown-keyboard-browser-baselines/full-webkit.log and full-firefox.log. These are current failures, not automatically product defects. The component and test sources for these five owners plus Popover and Calendar are byte-identical between main and the stabilization checkout. A guarded read-only Batuta scout runs in main, outside the implementation worktree, to locate owners and propose exact control experiments.

Known platform controls: the Dropdown standalone experiment proved that macOS WebKit skips implicit button stops even without menu closure; explicit fixture tabIndex0 establishes a native keyboard destination. Earlier mouse experiments proved that button pointer activation does not necessarily focus buttons on WebKit. Each failing test still requires its own traced precondition; do not use either fact to waive a real public keyboard or restoration defect. Preserve exact focus assertions and current dependency/Colima boundaries.

Next: validate scout anchors against the exact current files; reproduce the smallest suggested case with its platform control; scope a correction only after the cause is established. No broader Tooltip timing or overlay architecture work is part of this diagnosis.

## Confirmed controls and disposition
Guarded GLM scout passed with unchanged main HEAD/status/diff and14 source/test hashes. All12 cited paths, including the extra tools/file-upload/scenarios.ts, were validated byte-identical in the active worktree. Report preserved verbatim in .batuta/scout/2026-09-09-v1-webkit-baseline.md. Its source anchors are valid; its categorical statement that none of the six is a product bug is not adopted. Programmatically focusing TimePicker's first option would bypass the failing keyboard-entry contract and is explicitly declined.

Controller32-case native control matrix: plain/role=option buttons, implicit/explicit tabindex, Tab/Alt+Tab/click/prepared Enter, Chromium/WebKit. This WebKit skips implicit button/option stops on Tab, reaches them on Alt+Tab, and does not focus an implicit button on pointer activation; explicit tabindex0 establishes the stop. Current-source traced Calendar tests confirm WebKit Tab1 reaches May1/May15 active day, Tab2 BODY, Tab3 active day, Tab4 BODY; the original four-Tab tests pass in Chromium. Actual TimePicker Tab1 reaches BODY. Trace instrumentation was restored byte-for-byte; no product/test instrumentation remains.

Separate correction scopes are Tasks13–16. Tooltip fixture owns its semantic button; Calendar fixtures must retain bounded native traversal and exact target assertions; FileUpload cases require actual focus ownership before removal and actual departure to the Outside control. FileUpload diagnosis will be completed by focused runtime-preserving proofs. TimePicker's existing option buttons need explicit author-defined tab stops to preserve their current Chromium entry sequence in WebKit; no new roving model, focus shortcut or public API is proposed in this slice. Wider selection contracts remain separate.
