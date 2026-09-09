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

## Current priority after prepared-opener fixture correction

The six local WebKit test failures had an invalid fixture precondition: mouse
activation blurred the trigger before open-time capture. Preparing focus inside
the invoking test handler makes WebKit38/38 and Chromium/SSR43/43 pass; exact
assertions still fail when runtime restoration is disabled (two cases verified).
This does **not** repair unprepared real mouse consumers: both Drawer and Dialog
still capture/return to body in the retained trusted-input diagnostic. That is
an unresolved normative V1 gap. Next design must establish an explicit invoking
control/return target and successor responsibility, without global tracking or
an assumed replacement foundation. No particular new API is approved yet.
See v1-webkit-focus-verification.md for exact scope and remaining release gates.

## Proposed return-focus contract

The next API choice is concretely proposed in
`.batuta/specs/2026-09-08-modal-return-focus-design.md`: one optional
returnFocusTo resolver, shared internal safety/cycle ownership for Dialog and
Drawer, and explicit composition-provided successors. Two-criterion independent
technical review passed after one revision. Maintainer API approval remains
pending; current runtime and unprepared mouse behavior are unchanged. The
proposal does not waive no-body or any remaining modal/release requirement.

## Maintainer approval and Batuta ownership

On 2026-09-08 the maintainer approved returnFocusTo and required Batuta planning
and task documentation. The contract now lives in .batuta/specs/; execute
.batuta/plans/v1-modal-return-focus.md. Earlier approval-pending statements above
are historical. Implementation and release qualification remain incomplete.

## Completed return-focus slice — 2026-09-08

The approved .batuta/plans/v1-modal-return-focus.md is complete: Dialog and Drawer
share one internal return-focus owner and optional returnFocusTo API; all four
first-party examples migrated, API pages/reference and additive React changeset
updated. Source commits00d2ded (Dialog) and9f0844d (Drawer); documentation follows
in the Task3 commit. Chromium/SSR70, WebKit63 and28 actual built-package example
close paths pass, with RED-before pointer/StrictMode/mount-only regression proof.
Build, current declarations, owner-generated API, types, lint and format pass.
Independent Batuta reviews approved each task; no dependencies or Colima changes.

This supersedes the old approval-pending and mount-only Drawer observations above.
Bare unmigrated mouse consumers remain unqualified; initial-focus policy, other
modal families, nested/inert coordination, the other P1 contract gaps and exact
packed Firefox/Linux release qualification remain open. All eleven P1 ledger
entries and23acceptance cells retain their existing status; no V1 qualification
or remote/release action occurred. Next work must follow the remaining incumbent
backlog in a separately bounded Batuta task. See v1-return-focus-verification.md.

## Completed CommandPalette pointer slice — 2026-09-08

Both cross-boundary mouse gestures (panel to backdrop and reverse) were reproduced
in Chromium and WebKit and repaired within CommandPaletteRoot. Native proof12/12,
Chromium/SSR20 and WebKit16 pass; old-source regression fails; types/lint/format
pass. One narrow keyboard-opener fixture retry; independent GLM review3/3 DONE.
No public API, dependencies or other component changes. The React patch changeset
records the fix. See .batuta/v1-command-palette-pointer-verification.md.

CommandPalette unprepared mouse return focus, other modal initial-focus/nested
coordination, remaining P1 contracts and exact packed Firefox/Linux release
qualification remain open. This fix does not qualify any P1 ledger entry or
waive an acceptance cell. Continue with a separately bounded remaining task.

## Completed CommandPalette return-focus slice — 2026-09-09

CommandPalette now consumes the same optional returnFocusTo contract and unchanged
shared owner as Dialog/Drawer. Its trigger example and docs header menu declare a
stable trigger; both API pages and generated references are migrated. Native48/48,
actual built example6/6, final scoped Chromium/SSR30 and WebKit26 pass, with original
mouse and missing-successor RED evidence. Build/types/lint/docgen/format pass.
One Codex/high retry, then critical/self fixture readiness and documentation
completion; final independent GLM3/3 DONE, no findings, unchanged guard.
See .batuta/v1-command-palette-focus-verification.md for failures and proof limits.

Unmigrated bare mouse consumers remain unqualified. Modal initial-focus policy
(including Escape before input focus), nested/inert coordination, other P1
contracts and full packed Firefox/Linux qualification remain open. No P1 ledger
entry or acceptance cell was promoted, and no remote/release action occurred.

## Completed nested Dialog Escape slice — 2026-09-09

React-nested Dialog Escape no longer cascades to its parent. Child disabled-close,
ignored-close and consumer cancellation retain the parent; normal child close
restores its trigger and a second Escape closes the parent. The change remains in
Dialog's existing keyboard owner, with no API/dependency/global-layer framework.
Native Escape10/10, final Chromium/SSR64, WebKit57, types/lint/format pass. One
formatting-only Codex/medium retry; independent GLM3/3 DONE with unchanged guard.
See .batuta/v1-dialog-nested-escape-verification.md for exact proof and disposition.

Next bounded investigation: the retained original and current native fixtures show
WebKit forward Tab from the child input reaches BODY, while reverse Tab returns to
the input; Chromium passes this path. This existing focus-containment defect was
observed independently of Escape and is not qualified or repaired by this slice.
Determine its cause before proposing a focus-owner change. Global modal ordering,
nested/inert coordination, initial-focus policy, other modal owners/P1 contracts
and full packed Firefox/Linux qualification remain open. No ledger entry or
acceptance cell was promoted; no remote/release or Colima action occurred.

## Completed native modal Tab containment — 2026-09-09

The observed WebKit Tab escape is repaired in the shared hook. Local hidden
boundaries only participate during the originating Tab gesture; native intermediate
navigation is preserved, descendant-native cancellation is respected, and boundaries
are deactivated/removed with their owner. No API, dependencies or caller changes.
Native16/16, Chromium/SSR115 and focused WebKit7/7 pass, as do types/lint/format.
One Codex/high retry followed by critical/controller native-oracle fixture and
const completion; independent GLM3/3 DONE and no findings with unchanged guards
(after a formatting-only report retry). See .batuta/v1-webkit-tab-verification.md.

This completes the specific WebKit Tab escape observation in the previous section,
not global modal coordination or release qualification. The broader WebKit suite
remains100/102: the same two BottomSheet pointer-opener return-focus assertions
also fail with the original hook (baseline10/12). Tests and BottomSheet runtime
were preserved. Next bounded task: diagnose BottomSheet return-focus ownership
and determine the compatible incumbent correction, using the existing approved
shared return-focus contract as reference. Do not alter Colima or introduce
new foundation/dependency work. Remaining initial-focus, sibling/modal/inert,
other P1 and packed Firefox/Linux requirements remain open; no ledger promotion.

## Completed bounded work — 2026-09-09 continuation

BottomSheet shared return focus and actual invoking examples are verified in88c5211/899ed10; public JSDoc eligibility clarified inbda7a00. Native6 and actual examples12 pass; focused Chromium/SSR24 and WebKit21 pass. The original two BottomSheet pointer-return failures are closed.

The experimental checkout freeze was replaced by its actual dependency-isolation boundary in1b7629e, with shallow-clone maintenance/prohibited-dependency regressions. PR220 action6.1.0 adopted locally in87f7775, pnpm unchanged11.13.1. WorkspaceSwitcher light hover contrast and actual-dark fixture now repaired; full React Chromium/SSR765/765. Its create-option semantics and remaining layer/Alpine obligations remain open. These completions do not qualify all11P1 components or23acceptance cells.
