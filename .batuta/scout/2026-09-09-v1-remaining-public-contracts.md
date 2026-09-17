<<<REPORT

## Answer

**1) CreateWorkspaceDialog — synchronous creation vs operationId/AbortSignal/results lifecycle**

Current behavior: creation is fully synchronous and fire-and-forget. `handleSubmit` invokes `onCreate?.({ name, slug })` then immediately `onClose?.()` (create-workspace-dialog.tsx:55-60); the submit button has only a validity-based `disabled` (line 72), no pending/success/error state. `CreateWorkspaceDialogProps.onCreate` is typed `(data: { name: string; slug: string }) => void` (line 14) — no promise, no operation identity, no AbortSignal, no results channel. Gap vs normative contract: 04-component-architecture.md:273-275 "Async completion MUST report the operation identity so late results, retries, and cancellation cannot commit or announce the wrong attempt"; 04:290-297 requires exposed `idle/loading/success/error/canceled` outcomes with a defined owner of cancellation/retry; 04:305-308 "A callback that returns a promise MUST have an explicit rejection and unmount/cancellation policy… MUST NOT commit after an operation is obsolete"; 03-interaction-accessibility.md:250-261 requires the initiating control to expose state, cancellation and recovery and forbids simulating success. Smallest responsible layer: the component's own props + `handleSubmit` in `create-workspace-dialog.tsx` (Dialog composition itself untouched). Exact public surfaces affected: `CreateWorkspaceDialogProps` (`onCreate`, `onClose`, possibly new state props), the component function, root export src/index.ts:82-83 and subpath export create-workspace-dialog/index.ts:1-2 (any type change is public; per 04:91-94 and 04:562-581 a source/type surface change follows the 0.x minor controlled-breaking path). Test coverage today: browser test asserts only slug behavior + `onCreate`/`onClose` sync calls (browser.test.tsx:44-64); SSR test asserts portal-guard emptiness (ssr.test.ts:6-11); no async, failure, or double-submit case exists. Must-preserve: slug auto-generation-until-touched semantics (ts:90-91), reset-on-reopen via adjusted-state pattern (ts:44-53), SSR portal guard, exact `lyra-wscreate*` class set asserted in tests. Unresolved design choices: whether `onCreate` becomes promise-returning with an operationId/AbortSignal/results contract or the component stays a synchronous composer with consumer-owned async surfaced through new state props; who owns cancellation and retry; whether the footer Button gains a public pending state or the dialog exposes it.

**2) Tabs — panel-content ownership and API compatibility**

Current behavior: data-driven, controlled-only API (`items: TabItem[]`, required `active`, `onChange`; no `defaultValue` variant — tabs.tsx:18-27) with roving tabindex + automatic activation (lines 49-62, 83). Panel content is NOT owned by Tabs: it renders one empty, focusable `div[role=tabpanel tabIndex=0 hidden]` per item (lines 95-104) — the exact P1 finding at 03:444 "`Tabs` renders empty focusable panels while application content is owned elsewhere", with obligation at 03:426 (real panel ownership, panel naming, activation mode, focus fallback MUST be defined) and 03:521 (finding MUST NOT be preserved). Gap: consumers must associate their content with generated ids; no compound trigger/content contract. Compatibility: `Tabs`/`TabsProps`/`TabItem` are public at src/index.ts:142-143 and tabs/index.ts:1-2; per 04:91-94 changing/rename of public surface is a package breaking change, but 04:613-616 explicitly routes "empty tab panels" down the unsafe-contract path — source/type/export removal still waits for a major unless the surface necessarily preserves the unsafe outcome. Normative pseudocode vs final API: the `Tabs.Root/List/Trigger/Content` before/after snippets at 04:634-650 (and the Alpine example 04:656-737) are explicitly illustrative — 04:747-750: "These examples define the required migration shape, not the final Tabs names; the selection-family spec MUST approve the exact signatures, attributes, classes, and removal version before implementation." So the final chosen compound API is NOT decided in these documents. Must-preserve: controlled state semantics per 04:178-200 (callback receives next value, not event; no internal mutation — current `onChange` matches), roving focus + automatic activation keyboard model (browser.test.tsx:106-123), `lyra-tabs`/`lyra-tab` classes and SSR wiring. Smallest responsible layer: tabs.tsx as a whole (single file owns tabs + auto-panels). Unresolved: final part names/signatures, controlled triad shape (`active`→`defaultValue` variant?), focus fallback, panel naming, activation-mode choice, removal version.

**3) DataTable — row selection vs native command keyboard activation, row-action API**

Current behavior: selection is fully native and keyboard-operable — header `<input type="checkbox">` with `aria-label="Select all"` (data-table.tsx:244-251) and per-row checkbox with `aria-label` (326-339), `indeterminate` via effect (196-198), `onClick` stopPropagation to avoid row-click conflict (331), controlled/uncontrolled via `useControllableState` (176-180). That selection side complies with the native-semantics owner at 03:431. Gap is solely the row action: `onRowClick` is wired to `<tr onClick>` (319-323) with no `tabIndex`, no `onKeyDown`, no focusable/semantic action element — the P1 finding at 03:446 "`DataTable.onRowClick` exposes a pointer-only row action", reinforced by 03:79-82 (primary action MUST NOT be pointer-only) and 03:431 ("row actions… keyboard equivalence for every pointer action MUST be defined"). Hover is auto-enabled from `onRowClick` (235). Test coverage: no browser or SSR test references `onRowClick` (0 grep matches in the folder's tests); covered instead are sort cycling, controlled/uncontrolled selection, label functions, and the sort-stable selection-identity regression (browser.test.tsx:166-201). Must-preserve: native checkbox selection semantics + `aria-sort` (261-263) + sortable header buttons (266-276) + original-order fallback ids (183-192) + `lyra-table*` classes. Exact public surfaces affected: `DataTableProps.onRowClick` and `hover` (85-88), the row render block, `DataTable` exports (src/index.ts:191-196, data-table/index.ts). Unresolved design choices: replace `onRowClick` vs supplement it with "semantic focusable actions" (03:446 allows either); what those actions are (e.g., actions inside the primary cell vs a row-action API) — no concrete API is named in the read documents; whether `onRowClick` takes the unsafe-contract removal path (04:613-616 includes "pointer-only row actions").

## Files

- packages/react/src/create-workspace-dialog/create-workspace-dialog.tsx — component + props (sync `onCreate`/`onClose`).
- packages/react/src/create-workspace-dialog/create-workspace-dialog.browser.test.tsx — only colocated browser test (classes, slug, sync callbacks).
- packages/react/src/create-workspace-dialog/create-workspace-dialog.ssr.test.ts — only colocated SSR test (portal guard).
- packages/react/src/create-workspace-dialog/index.ts — subpath export surface.
- packages/react/src/tabs/tabs.tsx — data-driven Tabs + auto-rendered empty panels.
- packages/react/src/tabs/tabs.browser.test.tsx — contrast/classes/roving keyboard tests.
- packages/react/src/tabs/tabs.ssr.test.ts — minimal SSR wiring test.
- packages/react/src/tabs/index.ts — subpath export surface.
- packages/react/src/data-table/data-table.tsx — selection/sort/row-action implementation.
- packages/react/src/data-table/data-table.browser.test.tsx — sort/selection/labels/identity tests; no row-click keyboard test.
- packages/react/src/data-table/data-table.ssr.test.ts — minimal SSR test.
- packages/react/src/data-table/index.ts — subpath export surface.
- packages/react/src/index.ts — root public re-exports (lines 82-83, 142-143, 191-196).
- docs/superpowers/specs/lyra-v1/03-interaction-accessibility.md — normative interaction contract + P1 findings table.
- docs/superpowers/specs/lyra-v1/04-component-architecture.md — normative React API contract + illustrative Tabs migration pseudocode.

## Evidence

- create-workspace-dialog.tsx:14 `onCreate?: (data: { name: string; slug: string }) => void;` — synchronous, no promise/abort/identity.
- create-workspace-dialog.tsx:55-60
  ```tsx
  const handleSubmit = (): void => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onCreate?.({ name: trimmedName, slug });
    onClose?.();
  };
  ```
  Close fires unconditionally in the same tick as create; no result wait, no stale-completion guard.
- create-workspace-dialog.browser.test.tsx:62-63 `expect(onCreate).toHaveBeenCalledWith({ name: 'Different Name', slug: 'custom-url' }); expect(onClose).toHaveBeenCalledOnce();` — only behavior asserted on create path.
- 04-component-architecture.md:273-275 "Async completion MUST report the operation identity so late results, retries, and cancellation cannot commit or announce the wrong attempt."
- 04-component-architecture.md:292-297 "MUST expose the applicable `idle`, `loading`, `success`, `error`, and `canceled` outcomes as Lyra-owned public state… Lyra MUST NOT simulate progress or success for work owned by the consumer."
- 04-component-architecture.md:305-308 "A callback that returns a promise MUST have an explicit rejection and unmount/cancellation policy. The implementation MUST NOT swallow a rejection, commit after an operation is obsolete…"
- 03-interaction-accessibility.md:250-261 async feedback: "An asynchronous operation MUST expose its initiating control or region, current state, available cancellation, and recovery path… On success, the interface MUST update the affected content…"
- tabs.tsx:32-34 doc comment "Each tab owns an empty labelled panel because the handoff contract supplies tab labels only, not panel content." — self-documented current gap.
- tabs.tsx:95-104
  ```tsx
  {items.map((item, index) => (
    <div key={`${item.id}-panel`} id={panelId(index)} role="tabpanel" aria-labelledby={tabId(index)} tabIndex={0} hidden={index !== activeIndex} />
  ))}
  ```
  Empty focusable panels.
- 03-interaction-accessibility.md:444 "`Tabs` renders empty focusable panels while application content is owned elsewhere. | `P1`: the Tabs family MUST provide a compound trigger-and-content contract with real, correctly named panel content…"
- 03-interaction-accessibility.md:426 Tabs pattern row: "…panel naming, real panel ownership, deletion if supported, and focus fallback MUST be defined."
- 04-component-architecture.md:647-650 (After snippet) `<Tabs.Root defaultValue="details"> … <Tabs.Trigger value="details">Details</Tabs.Trigger> … <Tabs.Content value="details"><Details /></Tabs.Content>` — illustrative shape only.
- 04-component-architecture.md:747-750 "These examples define the required migration shape, not the final Tabs names; the selection-family spec MUST approve the exact signatures, attributes, classes, and removal version before implementation."
- 04-component-architecture.md:613-616 "Empty tab panels, simulated uploads, and pointer-only row actions MUST follow this unsafe-contract path rather than receive compatibility shims that preserve their failures."
- 04-component-architecture.md:91-94 "Removing or renaming a public subpath is a package breaking change."
- tabs.browser.test.tsx:106-123 test name "roves with automatic activation, wrap, Home and End" — current keyboard model under test (automatic activation; no manual mode, no focus fallback test).
- tabs.ssr.test.ts:10-11 `expect(html).toContain('lyra-tabs'); expect(html).toContain('role="tabpanel"');` — SSR asserts the current empty-panel wiring.
- data-table.tsx:88 `onRowClick?: (row: RowShape) => void;` and data-table.tsx:319-323
  ```tsx
  <tr key={id} className={isSelected ? 'lyra-table__row--selected' : undefined} onClick={onRowClick ? () => onRowClick(row) : undefined}>
  ```
  `<tr>` has no `tabIndex`, no keyboard handler, no semantic action role.
- 03-interaction-accessibility.md:446 "`DataTable.onRowClick` exposes a pointer-only row action. | `P1`: the data-and-files family MUST replace or supplement row activation with semantic focusable actions that offer keyboard and assistive-technology equivalence."
- 03-interaction-accessibility.md:79-82 "Every primary action MUST be reachable and operable without a pointer… A primary action MUST NOT be pointer-only."
- 03-interaction-accessibility.md:431 Tables row: "…row actions, focus order, responsive overflow, empty content, and keyboard equivalence for every pointer action MUST be defined."
- data-table.tsx:244-251 / 326-339 native checkboxes with `aria-label` (`Select all` / per-row name) — selection already natively keyboard-operable; only the row ACTION is pointer-only.
- data-table.browser.test.tsx:166-201 test "keeps selection attached to the same row after sorting when rows have no id" — must-preserve selection-identity behavior; no `onRowClick` reference anywhere in the folder's tests (grep: 0 matches in *.test.*).

## Uncertain

- Final Tabs compound API (part names, controlled/uncontrolled triad shape, activation mode, panel naming) is not decided in the two read documents — 04:747-750 defers it to the "selection-family spec", which was out of inspection scope. Whether that family spec exists and what it names is unverified here.
- Final DataTable row-action design ("replace or supplement" — 03:446) is likewise left open to the data-and-files family spec; no read document names the concrete focusable action mechanism or `onRowClick`'s deprecation/removal version.
- CreateWorkspaceDialog's target async contract (promise-returning `onCreate` vs new state/props split, owner of AbortSignal, operationId shape) is unresolved in the read documents; a dialog-family or composed-domain-spec decision may exist outside the inspected scope.
- Whether `CreateWorkspaceDialog` is classified React-only (04:416-423 path) or must map to Alpine is undetermined from the read docs; its docs pages (apps/docs/content/docs/…) were outside the requested scope and unread.
- Root-export removal risk: whether `Tabs`' current data-driven props must remain alongside a compound API ("Two forms that expose the same capability MUST share state" — 04:226-229) or be removed via the unsafe-contract path is an open SemVer decision (04:562-581, 04:605-616), not settled by the read paragraphs.

REPORT>>>
