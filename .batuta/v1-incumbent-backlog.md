# V1 incumbent backlog — source audit at9d214bf

The original inventory was source-only. Subsequent bounded verification is recorded below. All eleven P1
ledger entries remain unqualified. A source observation is a reason to write a
focused reproducer, not a new passing/failing release result. Historical
findings must be reproduced against current code before a fix is scoped.

| Priority                  | Surface                                                            | Concrete observation and narrow starting point                                                                                                                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First                     | Drawer                                                             | `packages/react/src/drawer/drawer.tsx:97` closes on a backdrop click without tracking press origin. Dialog already guards this at `packages/react/src/dialog/dialog.tsx:137`; its WR-02 regression at `dialog.browser.test.tsx:352` is the existing precedent. Reproduce only the drag-origin case first.         |
| Next                      | Drawer / CommandPalette                                            | Drawer focus-entry effect does not key on open changes; CommandPalette has its own unguarded backdrop handler. Verify these separately, not as additions to the first fix.                                                                                                                                        |
| Modal contract            | Dialog, Drawer, BottomSheet, CommandPalette, CreateWorkspaceDialog | Shared focus/portal/presence/scroll-lock owners already exist. Source audit found no family inert or topmost-layer coordination. Reproduce nested focus/dismissal and restoration failures before designing any shared correction.                                                                                |
| Anchored contract         | Popover                                                            | Existing `use-flip-placement.ts` handles flipping; popup and outside/Escape handlers do not express child-layer/topmost ownership. Prove a specific failing placement or dismissal case before expanding infrastructure.                                                                                          |
| Menu contract             | Dropdown                                                           | Existing option buttons/keyboard logic need verification against roving tab order and typeahead requirements. Do not add unclaimed submenu/check/radio variants. Start at `packages/react/src/dropdown/dropdown.tsx`.                                                                                             |
| Tooltip contract          | Tooltip                                                            | `packages/react/src/tooltip/tooltip.tsx` uses immediate show/hide handlers, while the approved contract specifies500ms initial,0ms warm,300ms warm grace and100ms pointer grace. A focused timing proof must precede a bounded design; do not change clocks or invent a new foundation.                           |
| Composition               | WorkspaceSwitcher                                                  | React create action is rendered as an option; Alpine change cancellation/ARIA relationships need contract checks. Preserve stack-specific support rather than claim equivalence. Owners: `packages/react/src/workspace-switcher/workspace-switcher.tsx`, `packages/alpine/src/workspace-switcher.ts`.             |
| Creation lifecycle        | CreateWorkspaceDialog                                              | Current `onCreate` is synchronous and submit closes immediately; approved operationId/abort/stale-result lifecycle is not implemented in `packages/react/src/create-workspace-dialog/create-workspace-dialog.tsx`. Public API/migration design must be settled before implementation. Alpine remains unsupported. |
| Selection                 | Tabs                                                               | `packages/react/src/tabs/tabs.tsx:95` renders empty tabpanels and does not own actual content. The governing selection specification is still not authored. Scope and approve that contract before changing public APIs.                                                                                          |
| Data actions              | DataTable                                                          | `packages/react/src/data-table/data-table.tsx:319` attaches row activation to a tr click. Prove keyboard accessibility and separation from selection. Amend the existing Data/Files contract; keep Table semantic and do not build an enterprise grid.                                                            |
| Reproduce before claiming | Alpine BottomSheet / axe                                           | The historical BottomSheet focus-trap failure is not established by this audit. Current axe helpers showed no filtering, despite an older allegation. Do not report those historical allegations as fresh defects or fixes.                                                                                       |

Existing browser and SSR tests cover all eleven components, with different
coverage depth. Reuse those tests and existing internal owners. This inventory
neither prescribes a rewrite nor promises every contract gap is a one-file fix.

The read-only GLM scout completed with an unchanged-tree guard. Its original
report is `.batuta/scout/2026-09-08-v1-incumbent-gaps.md`. Controller declined its
suggestion to keep the mandatory-comparison spec untouched and advance ledger
status: the maintainer explicitly superseded comparison, and no implementation
started. Controller also split its suggested Drawer pointer/focus combined fix;
only pointer-origin reproduction is the first task. Runtime claims and full
release qualification remain pending.

## Completed bounded correction — 2026-09-08

Drawer inside-origin dismissal was reproduced with trusted Chromium input and
repaired in its owning handler. The regression went RED before repair and GREEN
afterward. Chromium/SSR: 43 passing tests; trusted replay: six scenarios pass.
WebKit: the same six focus-restoration failures on original and fixed code;
the two new tests pass. Investigate those failures separately before prescribing
a focus repair. No dependency/API change or release qualification. See
v1-drawer-repair-verification.md and v1-drawer-repair-review.md.
