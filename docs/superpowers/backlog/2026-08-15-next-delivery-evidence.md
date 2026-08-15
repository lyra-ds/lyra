# Next Delivery Evidence — 2026-08-15

## Baseline

- **Collected:** 2026-08-15T17:26:07-03:00
- **Product baseline:** `origin/main` at
  `ab3de31ec02bb3637bcd7a9528311a581380bb10`
- **Planning branch:** `docs/next-evidence-cycle-design` at
  `610872ad5710ef397d286f6205bf1f390533d76a`, three documentation commits
  ahead of `origin/main`
- **Worktree:** linked worktree at
  `/home/franciscpd/Projects/lyra-ds/lyra-next-evidence-cycle`; clean before
  this artifact was created
- **Runtime:** Node.js `v24.18.0`; pnpm `11.13.1`

The product baseline is `origin/main`, not the planning-branch SHA. The local
`main` checkout remains untouched with its divergent commits and unrelated
`.pnpm-store/` directory.

## Evidence Sources

### Default-branch CI

GitHub Actions run
[`31900005783`](https://github.com/lyra-ds/lyra/actions/runs/31900005783)
completed successfully for the exact product-baseline SHA. Its required jobs
all passed:

| Job         | Result  | Material gates                                                                                                                     |
| ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `lint`      | success | Prettier, Phase 0 artifacts, release policy, actionlint, Stylelint, React/docs/site ESLint                                         |
| `typecheck` | success | React build and repository typecheck                                                                                               |
| `test`      | success | root tests, Chromium/Firefox/WebKit suites, class parity, icon-registry drift                                                      |
| `build`     | success | workspace build, bundle baseline, docgen, Blade snapshot checks, publint, pack smoke, attw, size-limit, dist scans, consumer smoke |

There is no failing default-branch gate to select as a corrective delivery.

### Open GitHub work

The open-issue query returned nine issues. Six include concrete code or
consumer reproduction details that require eligibility review:

- [#185 — Shell content mode inherits page-mode layout rules](https://github.com/lyra-ds/lyra/issues/185)
- [#187 — Container keyword max emits invalid CSS](https://github.com/lyra-ds/lyra/issues/187)
- [#97 — SlotPicker overflows mobile viewports](https://github.com/lyra-ds/lyra/issues/97)
- [#96 — `.lyra-tzpicker` has no styles definition](https://github.com/lyra-ds/lyra/issues/96)
- [#95 — DateRangePicker lacks an accessible range announcement](https://github.com/lyra-ds/lyra/issues/95)
- [#28 — FileManager browser tests contain two vacuous assertions](https://github.com/lyra-ds/lyra/issues/28)

Issues [#186](https://github.com/lyra-ds/lyra/issues/186) and
[#189](https://github.com/lyra-ds/lyra/issues/189) propose a broad AppSidebar
redesign and a new OTP component rather than one demonstrated existing-contract
correction. Issue [#188](https://github.com/lyra-ds/lyra/issues/188) targets the
downstream Blade component path, which the v1 PRD explicitly keeps off the Lyra
release-critical track until the affected React contract stabilizes.

The only open pull request targeting `main` is the Changesets release pull
request [#193](https://github.com/lyra-ds/lyra/pull/193). It contains already
merged Alpine and Styles patch changes and does not describe a new candidate.

### Repository and roadmap scans

The unresolved-marker command

```text
rtk rg -n "TODO|FIXME|TBD|not implemented" packages apps tools .github --glob '!**/dist/**' --glob '!**/node_modules/**'
```

returned exit status `1` with no matches.

The targeted suppression scan found explicit ESLint suppressions in overlay
and interaction code, including Dialog, Drawer, BottomSheet, Dropdown,
Tooltip, WorkspaceSwitcher, CommandPalette, and CalendarView. These matches do
not independently prove a user-facing failure. The approved interaction spec
already records overlay divergence as a P1 family concern, so the matches
remain corroborating input for an overlay-readiness fallback rather than a
standalone defect claim.

The targeted public-contract scan confirmed that current source and public
documentation still expose all three P1 findings named by the approved
interaction spec:

- simulated FileUpload progress in React and Alpine;
- `DataTable.onRowClick` without keyboard-equivalent row activation;
- generated empty focusable React Tabs panels.

Recent path-scoped churn over the trailing 40 commits is Alpine `1,622` changed
lines, Styles `557`, and React `288`. The completed Alpine public API audit
already examined the highest-churn adapter surface and found no mismatch, so
churn alone does not reopen it as a candidate.

## Candidate Evidence

### Signal: FileUpload presents simulated progress as an upload lifecycle

- **Source:** `packages/react/src/file-upload/file-upload.tsx:71`,
  `packages/react/src/file-upload/file-upload.tsx:152`,
  `packages/alpine/src/file-upload.ts:120`, both FileUpload documentation
  pages, and `03-interaction-accessibility.md:432`
- **Observed state:** React and Alpine start timers after file selection,
  increment display progress, and mark items complete without a
  consumer-controlled upload operation. The English and Portuguese docs call
  the progress simulated.
- **Consumer or gate:** `@lyra-ds/react`, `@lyra-ds/alpine`, and the v1 P1
  requirement that file selection be separated from real progress, failure,
  retry, cancellation, and completion state.
- **Reproduction:** inspect both implementations and run their focused
  FileUpload browser tests plus the React SSR test.
- **Eligibility:** eligible; this is a current public lifecycle contract and an
  explicit v1 release criterion.

### Signal: DataTable exposes pointer-only row activation

- **Source:** `packages/react/src/data-table/data-table.tsx:88`,
  `packages/react/src/data-table/data-table.tsx:322`, both DataTable
  documentation pages, and `03-interaction-accessibility.md:433`
- **Observed state:** `onRowClick` installs an `onClick` handler on `<tr>` with
  no row `tabIndex`, semantic action, or keyboard handler. The docs explicitly
  warn that the row is not keyboard operable.
- **Consumer or gate:** `@lyra-ds/react` and the P1 prohibition on pointer-only
  primary actions.
- **Reproduction:** inspect the row rendering and run focused React DataTable
  browser and SSR tests; compare Alpine's table enhancement to determine
  whether adapter parity is applicable.
- **Eligibility:** eligible; current public behavior conflicts with an approved
  accessibility requirement.

### Signal: React Tabs owns empty focusable panels instead of real content

- **Source:** `packages/react/src/tabs/tabs.tsx:99`, both Tabs documentation
  pages, and `03-interaction-accessibility.md:431`
- **Observed state:** React renders generated `role="tabpanel"` elements with
  `tabIndex={0}` but no content, while applications render their actual view
  elsewhere. The public docs describe and demonstrate that split ownership.
  Alpine, by contrast, binds authored panels containing application content.
- **Consumer or gate:** `@lyra-ds/react`, the React/Alpine observable contract,
  and the P1 requirement for compound triggers and real named panel content.
- **Reproduction:** run focused React and Alpine Tabs browser tests plus the
  React SSR test and compare their documented anatomy.
- **Eligibility:** eligible; the current React contract conflicts with the
  approved Tabs family requirement and differs materially from Alpine.

### Signal: Shell content mode retains page-mode layout constraints

- **Source:** [issue #185](https://github.com/lyra-ds/lyra/issues/185) and
  `packages/styles/components/chrome/chrome.css:363-446`
- **Observed state:** `.lyra-shell--content` changes display, height, padding,
  and background but does not reset the base shell's `align-items: start` or
  `gap`. Its sidebar width override does not reset the base sidebar's
  `padding-right` or `align-self: start`.
- **Consumer or gate:** the shared CSS shell used by application layouts; the
  issue links a production-like starter flow where content clips and the
  footer becomes unreachable.
- **Reproduction:** render the documented content-mode shell and assert column
  stretch, zero inter-column gap, scroll reachability, and sidebar height.
- **Eligibility:** eligible; this is a bounded current supported-flow defect
  with source and external-consumer evidence.

### Signal: SlotPicker retains an intrinsic mobile overflow

- **Source:** [issue #97](https://github.com/lyra-ds/lyra/issues/97) and
  `packages/styles/components/scheduling/scheduling.css:4-14`
- **Observed state:** each `.lyra-slotpicker__main` retains `min-width: 232px`
  inside a horizontal flex layout, with no component-owned horizontal overflow
  or narrow-viewport collapse contract. Both locale docs reproduce the class
  without documenting a minimum supported width.
- **Consumer or gate:** `@lyra-ds/styles`, React/Alpine SlotPicker
  compositions, and the v1 narrow-viewport/reflow contract.
- **Reproduction:** render a three-column SlotPicker at 375 CSS pixels and
  measure page overflow and reachability.
- **Eligibility:** eligible; a public responsive-flow gap has current CSS and
  an explicit acceptance criterion, although existing automated proof is
  narrower than for the P1 findings.

### Signal: DateRangePicker lacks a translatable accessible range relation

- **Source:** [issue #95](https://github.com/lyra-ds/lyra/issues/95),
  `packages/react/src/date-range-picker/date-range-picker.tsx:117`, its browser
  tests, and both locale documentation pages
- **Observed state:** the visible range is one interpolated string using a
  visual separator. There is no `rangeAnnouncement` contract or accessible
  trigger name that expresses the relation between start and end dates.
- **Consumer or gate:** `@lyra-ds/react` DateRangePicker and the v1 localized
  date/time accessibility contract.
- **Reproduction:** render a complete range, inspect the trigger's accessible
  name, and verify that no consumer-provided relational announcement exists.
- **Eligibility:** eligible; this is a bounded, current accessibility and
  localization gap with an existing Browser Mode test location.

### Signal: TimeZonePicker publishes an undefined CSS hook

- **Source:** [issue #96](https://github.com/lyra-ds/lyra/issues/96),
  `packages/react/src/time-zone-picker/time-zone-picker.tsx:301`, and both
  locale documentation pages
- **Observed state:** React and the docs publish `.lyra-tzpicker`, while no
  definition exists in `packages/styles` and the docs do not call it an
  intentionally unstyled selection hook.
- **Consumer or gate:** React/CSS documentation parity and developer
  experience.
- **Reproduction:** compare the React root class and docs markup with the
  Styles package inventory.
- **Eligibility:** eligible as a documentation or CSS-contract mismatch, but
  it has lower priority class than confirmed release and supported-flow gaps.

### Signal: reported Container keyword failure does not match the current React contract

- **Source:** [issue #187](https://github.com/lyra-ds/lyra/issues/187),
  `packages/react/src/container/container.tsx:10-22`, and both Container docs
- **Observed state:** the current React public type accepts `max?: number`, the
  JSDoc says pixels, and both Lyra docs use numeric pixel examples. The issue's
  broken `max="sm"` copy path originates in the downstream Blade surface.
- **Consumer or gate:** Blade follow-up rather than the current React, Alpine,
  or CSS v1 contract.
- **Reproduction:** TypeScript rejects a string React `max`; Blade must be
  evaluated after the affected React/CSS contract is stable.
- **Eligibility:** excluded from this Lyra delivery cycle by the approved Blade
  sequencing boundary.

### Signal: FileManager browser assertions are vacuous but do not demonstrate product failure

- **Source:** [issue #28](https://github.com/lyra-ds/lyra/issues/28) and
  `packages/react/src/file-manager/file-manager.browser.test.tsx`
- **Observed state:** two lazy Browser Mode locators are asserted with
  `not.toBeNull()`, so those assertions cannot fail when the queried menu item
  is absent.
- **Consumer or gate:** test confidence only; no linked current public behavior
  is reported broken.
- **Reproduction:** temporarily query a nonexistent accessible name and observe
  the current assertion remain green.
- **Eligibility:** excluded because the cycle does not select internal test
  cleanup without demonstrated consumer or release impact.
