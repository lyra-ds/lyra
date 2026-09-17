# Table selection touch repair — 2026-09-17

The packed public DataTable consumer exposed16 selection checkboxes with18×18px targets and no associated native label. Selection itself worked. The shared Styles repair adds44px minimum dimensions only to `.lyra-table__check .lyra-checkbox` under `(pointer: coarse)`, preserving18px fine-pointer geometry. It extends the existing target regression fixture and parity allowlist without adding a test framework, component API or dependency.

Controller verification on commit460ba66:

- All314 Styles browser tests pass (Chromium106, Firefox104, WebKit104), including coarse and fine geometry.
- Restoring the prior data.css makes the new checkbox assertion fail at18px; exact repaired bytes were restored.
- Stylelint, parity and changed non-CSS formatting pass. Full existing native bundle budget gate passes72 standalone entries,5 scenarios and4 CSS entries with no threshold changes.
- A production packed React consumer passes in Chromium, Firefox and WebKit using trusted taps: select one, select all15, deselect one with an indeterminate header, and activate a row action without altering selection. Each engine records33 target observations with zero below44px, versus16 below before repair. All16 checkbox targets measure44×44px.
- Styles archive SHA-256: `25eb42a2ddeaebcff76caf9ea957bc35d3cbba746b59863b15e78000dce0cb91`. All23 packed files match the observed consumer; the original predecessor fixture remains unchanged.

The adjacent evidence index binds retained controller logs under `.batuta/runs/pr223-followup/`. This report covers public React selection and shared CSS geometry, not physical devices, native touch scrolling, Alpine behavior or whole-profile/candidate qualification. Locator auto-scroll is not finger-scroll evidence. Source-identical evidence remains bounded to these owners if rebased; final combined package qualification remains separate.

Executor: OpenCode/glm-5.3-flash, low lane, one implementation attempt; controller independently ran the commands and reviewed the four-file product diff.
