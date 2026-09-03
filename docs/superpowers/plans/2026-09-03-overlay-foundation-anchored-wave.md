# Overlay Foundation Anchored Interaction Wave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the repository-owned four-candidate evaluation through
`OF-ANCHORED`, `OF-MENU`, and `OF-TOOLTIP` across the same 15 behavioral cells
as `OF-MODAL`, using one automated Wave 2 command and stopping before packaging
evidence, a foundation decision, or any production change.

**Architecture:** Core preflight, immutable attempts, isolated installation,
artifact verification, and the modal observation protocol remain authoritative.
Wave 2 adds three immutable scenario catalogs, contract-specific private
adapters, one shared browser/SSR fixture, deterministic browser-clock control,
and a single runner over all contract/scenario/cell tuples. The cumulative
manifest binds all implemented behavioral contracts to one clean pre-manifest
revision while the modal-only generator remains reproducible through
manifest-contract subset validation.

**Tech Stack:** Node.js 24.18.0 ESM, pnpm 11.13.1, `node:test`, React 18.3.1,
React 19.2.8, Vite 8.2.1, Playwright 1.62.1, axe-core 4.13.0, the existing
digest-pinned Playwright Noble image, and Prettier 3.9.6.

**Spec:**
[`docs/superpowers/specs/2026-08-31-overlay-foundation-evaluation-design.md`](../specs/2026-08-31-overlay-foundation-evaluation-design.md),
implementing the anchored, menu, and tooltip requirements in
[`docs/superpowers/specs/2026-08-30-overlay-family-design.md`](../specs/2026-08-30-overlay-family-design.md).

## Global Constraints

- Candidate IDs remain exactly `incumbent`, `radix`, `base-ui`, and `zag`, in
  that order. The cumulative behavioral manifest lists contracts exactly
  `OF-MODAL`, `OF-ANCHORED`, `OF-MENU`, and `OF-TOOLTIP`, in that order.
- Wave 2 cells are exactly `chromium`, `firefox`, `webkit`, `react-18`,
  `react-19`, `ssr`, `hydration`, `keyboard-focus`, `axe-light`, `axe-dark`,
  `forced-colors`, `reduced-motion`, `ltr`, `rtl`, and `coarse-pointer`.
- The eight cells `bundle-standalone`, `bundle-composition`, `packed-esm`,
  `packed-cjs`, `packed-types`, `consumer-vite`, `consumer-next`, and
  `consumer-commonjs` remain owned by the later decision-evidence plan. Wave 2
  MUST NOT emit a result for any of them.
- External artifact identity is immutable:

  | Candidate | Package                         | Version      | SHA-256                                                            |
  | --------- | ------------------------------- | ------------ | ------------------------------------------------------------------ |
  | Radix     | `@radix-ui/react-dialog`        | `1.1.23`     | `fa3f7e8612eecfc7b889266c0a5f640463de7d534cd54c3aac6c644b6a8294d2` |
  | Radix     | `@radix-ui/react-popover`       | `1.1.23`     | `c003d54e1716f00bafc5b7ccd4f3f126ffeded2ada9ae4146c272d1cb463e639` |
  | Radix     | `@radix-ui/react-dropdown-menu` | `2.1.24`     | `611afe4ccb51032fa5bde4efeb247e466f21cbe6ea749eaa2fb698bed7e6d056` |
  | Radix     | `@radix-ui/react-tooltip`       | `1.2.16`     | `694f4194eaa0631f12335328f614163705b591e76dcb90f1dcdbe3ba9cb455e0` |
  | Base UI   | `@base-ui-components/react`     | `1.0.0-rc.0` | `fd48911d202eb7ae13e7d56888fff503f3e9037c5e4e7991536429fafd7d9931` |
  | Zag       | `@zag-js/dialog`                | `1.43.3`     | `637e7e8d214deddd0edc6cf183eb70480b9f862862024129e5e793225b5fc517` |
  | Zag       | `@zag-js/popover`               | `1.43.3`     | `b11dc92a737efa68cfe06407049fabbd6aa87563239022f84bf5cad00b6a7b48` |
  | Zag       | `@zag-js/menu`                  | `1.43.3`     | `ca13d29ed055add22c9ea31c817be9fc2003ba2e309edf18ce5ffc3838cbe432` |
  | Zag       | `@zag-js/tooltip`               | `1.43.3`     | `de95ba7649557e433362d1b11abb38e99d361234aa6336da5d5f60ce4e4e5ace` |
  | Zag       | `@zag-js/react`                 | `1.43.3`     | `cf435e6fe4857d04aa2037e33dadaf9ec283c3159a95dca3c81023883e7f3f5c` |

- Every registry artifact uses its canonical
  `https://registry.npmjs.org/<package>/-/<archive>.tgz` URL, SPDX license
  `MIT`, and repository URL already used for its candidate: Radix
  `https://github.com/radix-ui/primitives`, Base UI
  `https://github.com/mui/base-ui`, and Zag
  `https://github.com/chakra-ui/zag`.
- The six newly added tarballs were inspected through the existing archive
  reader. Package identity and license match, lifecycle hooks are empty, and
  their byte sizes are: Radix Popover 13,670; Radix Dropdown Menu 12,647;
  Radix Tooltip 29,669; Zag Popover 10,907; Zag Menu 27,733; Zag Tooltip
  13,226. A byte or metadata change fails closed; implementation does not
  refresh a version or hash automatically.
- `candidates.json` is regenerated only after all implementation commits and a
  successful harness-level local diagnostic. It binds the clean implementation
  commit immediately before the manifest commit. Candidate product failures
  remain valid diagnostic evidence, but fixture, policy, ownership, evidence,
  repository, or cleanup failures block manifest tracking.
- The root dependency sections, `pnpm-lock.yaml`, `packages/`, public exports,
  `.github/workflows`, and V1 ledger statuses remain byte-identical. Candidate
  packages exist only in owned temporary fixtures.
- Scenario records and normative assertions never branch on candidate identity.
  Candidate package names, selectors, attributes, parts, and events remain
  inside private adapter code or `diagnostics`.
- Attempt 1 remains effective forever. Retry attempts add diagnostics but never
  upgrade the effective result. Independent candidates and scenarios continue
  after candidate-local product failure while run-fatal failures stop safely.
- Browser work runs only in
  `mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`.
  No Playwright browser is downloaded or installed on the host.
- This plan automates the full Wave 2 local diagnostic. It does not require
  manual upload or manual browser verification and does not dispatch CI,
  deploy, publish, tag, release, select a winner, accept an ADR, alter a
  production component, or change a V1 implementation status.

## File Map

- `contracts/cells.mjs` owns the shared 15 behavioral cells.
- `contracts/anchored.mjs`, `contracts/menu.mjs`, and `contracts/tooltip.mjs`
  own immutable Wave 2 scenarios and exact coverage validation.
- `fixtures/shared/protocol.mjs` and `fixtures/shared/resource-tracker.mjs`
  extract the candidate-neutral modal schema and resource accounting without
  changing modal behavior.
- `fixtures/wave2/` owns the contract-neutral request bridge, deterministic
  operation lifecycle, browser entry, SSR entry, and HTML shell.
- `candidates/{anchored,menu,tooltip}/*.mjs` privately translate the common
  fixture boundary for each candidate.
- `runner/wave2-fixture.mjs` prepares exact isolated React client and SSR
  builds. `runner/wave2-cells.mjs` owns deterministic browser/clock execution.
- `runner/wave2.mjs` composes core preflight, all Wave 2 tuples, immutable
  evidence, factual summaries, repository proof, and cleanup.
- `scripts/create-behavioral-manifest.mjs` creates the cumulative manifest;
  `scripts/wave2.mjs` is the single strict local entry point.
- `scripts/wave2-automation.mjs` owns the host-side characterization, manifest,
  Git bundle, container invocation, and retained-output report so the operator
  runs one command rather than assembling environment variables manually.
- `compose.wave2.yml` runs the diagnostic in the existing pinned browser image.

---

### Task 1: Generalize shared cells, contract entries, and manifest subsets

**Files:**

- Create: `tools/overlay-foundation-evaluation/contracts/cells.mjs`
- Create: `tools/overlay-foundation-evaluation/contracts/cells.test.mjs`
- Modify: `tools/overlay-foundation-evaluation/contracts/protocol.mjs`
- Modify: `tools/overlay-foundation-evaluation/contracts/protocol.test.mjs`
- Modify: `tools/overlay-foundation-evaluation/contracts/modal.mjs`
- Modify: `tools/overlay-foundation-evaluation/contracts/modal.test.mjs`
- Modify: `tools/overlay-foundation-evaluation/runner/adapter-entry.mjs`
- Modify: `tools/overlay-foundation-evaluation/runner/adapter-entry.test.mjs`
- Modify: `tools/overlay-foundation-evaluation/runner/manifest.mjs`
- Modify: `tools/overlay-foundation-evaluation/runner/manifest.test.mjs`

**Interfaces:**

- Produces `BEHAVIORAL_WAVE_CELLS`; `MODAL_WAVE_CELLS` remains an exact frozen
  compatibility alias with unchanged order and values.
- Extends `FIXTURE_OPERATIONS` with `focus`, `blur`, `hover`, `advanceTime`,
  `resize`, and `scroll`, after the existing eight operation names.
- Ordinary operations retain exactly `{ operation, target }`. `advanceTime`
  alone accepts `{ operation: 'advanceTime', target: 'browser-clock',
milliseconds }`, where `milliseconds` is a non-negative safe integer;
  unknown per-operation keys remain rejected.
- `resolveContractEntry` maps `OF-MODAL`, `OF-ANCHORED`, `OF-MENU`, and
  `OF-TOOLTIP` to exact `<contract>AdapterPath` exports and strict candidate
  subdirectories.
- `validateAdapterDescriptor` requires every manifest contract to be declared
  by the adapter while permitting a descriptor to support additional contracts.
  This keeps a historical modal-only manifest executable after Wave 2.

- [ ] **Step 1: Write shared-cell and operation REDs**

Assert the exact 15-cell array, deep freezing, exact modal alias, operation
order, the closed timing-operation shape, and rejection of timing data on any
other operation. Mutations that remove `rtl`, add a decision-evidence cell,
duplicate a cell, omit `advanceTime`, or accept a negative/fractional delay
must fail. Extend candidate-neutral validation to reject every new Radix, Base
UI, and Zag package identity in normative scenario fields.

- [ ] **Step 2: Write generic entry-resolution REDs**

For every supported contract, accept only the matching export and exact path:

```js
const entries = {
  'OF-MODAL': ['modalAdapterPath', 'candidates/modal/radix.mjs'],
  'OF-ANCHORED': ['anchoredAdapterPath', 'candidates/anchored/radix.mjs'],
  'OF-MENU': ['menuAdapterPath', 'candidates/menu/radix.mjs'],
  'OF-TOOLTIP': ['tooltipAdapterPath', 'candidates/tooltip/radix.mjs'],
};
```

Reject unknown/`OF-COMPOSED` contracts, missing exports, absolute and parent
paths, mismatched directories or basenames, directories, escaping symlinks,
and a main adapter path outside the direct candidates directory. Preserve the
existing accepted internal-symlink behavior after `realpath` containment.

- [ ] **Step 3: Write descriptor-subset REDs**

Prove `['OF-MODAL']` manifest contracts pass against a descriptor declaring all
four behavioral contracts. Reject a manifest contract absent from the
descriptor, duplicate/unknown IDs, wrong candidate identity, and candidate
descriptors that omit their own manifest contract.

- [ ] **Step 4: Run RED**

```bash
rtk mise exec node@24.18.0 -- node --test \
  tools/overlay-foundation-evaluation/contracts/cells.test.mjs \
  tools/overlay-foundation-evaluation/runner/adapter-entry.test.mjs \
  tools/overlay-foundation-evaluation/runner/manifest.test.mjs
```

- [ ] **Step 5: Implement the shared boundaries**

Move the literal cell array into `contracts/cells.mjs`, import it from modal,
append the six neutral operations, replace modal-only entry resolution with an
immutable contract configuration table, and change descriptor equality to the
manifest-subset rule. Do not weaken candidate identity, contract vocabulary,
path containment, or regular-file checks.

- [ ] **Step 6: Mutation proofs and GREEN**

Temporarily make entry containment lexical and then invert the descriptor
subset. Each named negative test must fail. Restore and run Task 1 plus all
modal contract/entry/manifest regressions green.

- [ ] **Step 7: Commit the shared boundary**

```bash
rtk git add tools/overlay-foundation-evaluation/contracts \
  tools/overlay-foundation-evaluation/runner/adapter-entry.mjs \
  tools/overlay-foundation-evaluation/runner/adapter-entry.test.mjs \
  tools/overlay-foundation-evaluation/runner/manifest.mjs \
  tools/overlay-foundation-evaluation/runner/manifest.test.mjs
rtk git commit -m "refactor: share overlay behavioral boundaries"
```

---

### Task 2: Pin Wave 2 artifacts and generate the cumulative manifest

**Files:**

- Modify: `tools/overlay-foundation-evaluation/candidates/catalog.mjs`
- Modify: `tools/overlay-foundation-evaluation/candidates/catalog.test.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/manifest-common.mjs`
- Modify: `tools/overlay-foundation-evaluation/scripts/create-modal-manifest.mjs`
- Modify: `tools/overlay-foundation-evaluation/scripts/create-modal-manifest.test.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/create-behavioral-manifest.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/create-behavioral-manifest.test.mjs`

**Interfaces:**

- Preserves `MODAL_EXTERNAL_ARTIFACTS` byte-for-byte and adds
  `WAVE_2_EXTERNAL_ARTIFACTS` for the six new packages plus
  `BEHAVIORAL_EXTERNAL_ARTIFACTS`, the canonical de-duplicated union.
- Extracts incumbent validation, canonical writing, UTF-8/BOM rejection, and
  CLI argument validation into `manifest-common.mjs` without changing the
  modal generator output.
- Produces `createBehavioralManifest({ lyraRevision,
incumbentCharacterization })` and `writeBehavioralManifest(...)` with all
  four behavioral contracts and the ten exact external artifacts above.

- [ ] **Step 1: Write exact catalog tests**

Assert every package name, exact version, URL, SHA-256, MIT license, repository
URL, candidate order, per-candidate artifact order, and union de-duplication.
Specifically assert Base UI remains one monolithic artifact and `@zag-js/react`
appears once after the four Zag machines.

- [ ] **Step 2: Write generator REDs**

Assert candidate contracts equal:

```js
['OF-MODAL', 'OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP'];
```

Add negative tests for mismatched incumbent revision, reordered/missing
incumbent packages, invalid hash, existing output, BOM, malformed JSON,
unknown/duplicate CLI arguments, and any output rejected by
`validateCandidateManifest`. Prove the unchanged modal generator still emits
only `OF-MODAL` and the original artifact set.

- [ ] **Step 3: Run RED**

```bash
rtk mise exec node@24.18.0 -- node --test \
  tools/overlay-foundation-evaluation/candidates/catalog.test.mjs \
  tools/overlay-foundation-evaluation/scripts/create-modal-manifest.test.mjs \
  tools/overlay-foundation-evaluation/scripts/create-behavioral-manifest.test.mjs
```

- [ ] **Step 4: Implement the catalog union and shared writer**

Use frozen literal records. The union function rejects duplicate identities
whose metadata differs, preserves canonical candidate/package order, validates
before writing, writes with `wx` and mode `0600`, then re-reads and proves
canonical byte equality.

- [ ] **Step 5: GREEN and mutation proof**

Alter one new hash and then permit replacement of an existing output. Each
mutation must fail a named test. Restore and run Task 2 plus core manifest and
archive tests green.

- [ ] **Step 6: Commit artifact identity**

```bash
rtk git add tools/overlay-foundation-evaluation/candidates/catalog.mjs \
  tools/overlay-foundation-evaluation/candidates/catalog.test.mjs \
  tools/overlay-foundation-evaluation/scripts/manifest-common.mjs \
  tools/overlay-foundation-evaluation/scripts/create-modal-manifest.mjs \
  tools/overlay-foundation-evaluation/scripts/create-modal-manifest.test.mjs \
  tools/overlay-foundation-evaluation/scripts/create-behavioral-manifest.mjs \
  tools/overlay-foundation-evaluation/scripts/create-behavioral-manifest.test.mjs
rtk git commit -m "feat: pin anchored evaluation artifacts"
```

---

### Task 3: Define immutable anchored, menu, and tooltip scenarios

**Files:**

- Create: `tools/overlay-foundation-evaluation/contracts/anchored.mjs`
- Create: `tools/overlay-foundation-evaluation/contracts/anchored.test.mjs`
- Create: `tools/overlay-foundation-evaluation/contracts/menu.mjs`
- Create: `tools/overlay-foundation-evaluation/contracts/menu.test.mjs`
- Create: `tools/overlay-foundation-evaluation/contracts/tooltip.mjs`
- Create: `tools/overlay-foundation-evaluation/contracts/tooltip.test.mjs`
- Create: `tools/overlay-foundation-evaluation/contracts/wave2.mjs`
- Create: `tools/overlay-foundation-evaluation/contracts/wave2.test.mjs`

**Interfaces:**

- Each contract exports its frozen scenario array, `<contract>ScenariosForCell`,
  and `validate<Contract>Coverage`.
- `wave2.mjs` exports `WAVE_2_CONTRACT_IDS`, `WAVE_2_SCENARIOS`,
  `wave2ScenariosForCell(contractId, cellId)`, and `validateWave2Coverage`.
- Every scenario explicitly owns ordered operations, phase probes, normative
  expected roles/relationships/states/focus/events/announcements/cleanup,
  literal required cells, and artifact capture. No expected value is derived
  from an adapter observation.

The immutable `OF-ANCHORED` inventory is:

Component mapping is exact: popup relationship, nested pointer, Escape, and
trigger-restoration records map to `Popover`, `Dropdown`, and
`WorkspaceSwitcher`; placement, live update, direction, portal, teardown, SSR,
and hydration records also map to `Tooltip`. Every `OF-MENU` record maps only
to `Dropdown`, and every `OF-TOOLTIP` record maps only to `Tooltip`.

| Scenario ID                                      | Required coverage                                    | Observable outcome                                                                                                                                      |
| ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `of-anchored.popup-trigger-relationships.v1`     | browsers, React 18/19, axe light/dark, forced colors | one trigger/tab stop; stable popup ID, `aria-haspopup`, `aria-expanded`, and `aria-controls` while closed/open                                          |
| `of-anchored.preferred-flip-shift-constraint.v1` | browsers, forced colors, coarse pointer              | preferred side when it fits; opposite-side flip; visual-viewport shift; bounded scroll region when neither side fits                                    |
| `of-anchored.live-placement-updates.v1`          | browsers, keyboard-focus, reduced motion             | trigger/content resize, viewport/visual-viewport resize, and ancestor scroll update placement without focus or semantic events; close stops measurement |
| `of-anchored.logical-direction.v1`               | browsers, ltr, rtl                                   | start/end alignment and horizontal side mirror logically; top/bottom remain physical; CSS values remain Lyra-owned                                      |
| `of-anchored.nested-child-pointer-origin.v1`     | browsers, coarse pointer                             | child interaction stays inside; only complete outside down/up closes; drag/cancel/context-menu/mixed origin do not                                      |
| `of-anchored.topmost-escape-restoration.v1`      | browsers, keyboard-focus, ltr, rtl                   | Escape closes only the child/topmost layer; focus returns within parent, or remains on a trigger it never left                                          |
| `of-anchored.portal-context.v1`                  | browsers, axe light/dark                             | portal movement preserves relationships, theme, brand, direction, event delivery, and restoration context                                               |
| `of-anchored.trigger-removal-successor.v1`       | browsers, keyboard-focus                             | connected trigger wins; removed trigger uses the documented successor/region and never `body`                                                           |
| `of-anchored.teardown.v1`                        | browsers, reduced motion                             | close/destroy release observer, listener, pointer record, portal, and stale callback exactly once                                                       |
| `of-anchored.ssr-semantics.v1`                   | ssr                                                  | deterministic named non-modal content/description relationships exist without browser globals                                                           |
| `of-anchored.hydration-stability.v1`             | React 18/19, hydration                               | first tree, stable IDs, relationships, state, focus, and event counts survive hydration                                                                 |

The immutable `OF-MENU` inventory is:

| Scenario ID                                   | Required coverage                                       | Observable outcome                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `of-menu.trigger-entry-keys.v1`               | browsers, React 18/19, keyboard-focus                   | Enter, Space, ArrowDown open at first enabled item; ArrowUp opens at last enabled item; pointer entry remains reachable     |
| `of-menu.arrow-wrap-roving-focus.v1`          | browsers, keyboard-focus                                | Up/Down wrap across every command and exactly one real-DOM-focus item owns `tabindex=0`                                     |
| `of-menu.home-end-structural-skip.v1`         | browsers, keyboard-focus                                | Home/End reach first/last command while labels and separators never receive focus                                           |
| `of-menu.disabled-discovery-no-activation.v1` | browsers, keyboard-focus, axe light/dark, forced colors | disabled command is discoverable and roving-focusable but never activates, emits, selects, or closes                        |
| `of-menu.typeahead-reset-wrap.v1`             | browsers, keyboard-focus, ltr, rtl                      | localized case-insensitive search starts after current, wraps once, includes disabled matches, and resets at 500 ms         |
| `of-menu.repeated-character-cycle.v1`         | browsers, keyboard-focus                                | a repeated character within 500 ms cycles matching commands instead of forming a repeated query                             |
| `of-menu.cancelable-selection.v1`             | browsers, React 18/19                                   | enabled activation emits once; consumer cancellation leaves selection and open state unchanged                              |
| `of-menu.tab-native-exit.v1`                  | browsers, keyboard-focus                                | Tab/Shift+Tab close and continue native order without trigger restoration                                                   |
| `of-menu.escape-successor-restoration.v1`     | browsers, keyboard-focus                                | Escape closes and restores connected trigger or documented successor, never `body`                                          |
| `of-menu.public-model-variant-boundary.v1`    | browsers, axe light/dark, forced colors, ltr, rtl       | current Dropdown model claims no submenu/check/radio support and emits none of those roles before an approved API migration |
| `of-menu.coarse-pointer-selection.v1`         | browsers, coarse pointer                                | pointer entry and enabled selection work once without synthesized hover or blocked touch scrolling                          |
| `of-menu.teardown.v1`                         | browsers, reduced motion                                | close/destroy release roving, typeahead timer, dismissal listeners, portal, and stale callbacks once                        |
| `of-menu.ssr-semantics.v1`                    | ssr                                                     | trigger/menu/item structure, stable IDs, and initial closed/open semantics render without browser globals                   |
| `of-menu.hydration-stability.v1`              | React 18/19, hydration                                  | IDs, active item, open state, event count, and focus remain stable through hydration                                        |

The immutable `OF-TOOLTIP` inventory is:

| Scenario ID                                 | Required coverage                                    | Observable outcome                                                                                                                             |
| ------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `of-tooltip.focus-immediate-ownership.v1`   | browsers, keyboard-focus                             | focus exposes immediately, stays on trigger, and focus leaving closes unless hover still owns the branch                                       |
| `of-tooltip.hover-initial-delay.v1`         | browsers                                             | cold hover remains closed at 499 ms and opens at exactly 500 ms                                                                                |
| `of-tooltip.warm-coordinator.v1`            | browsers                                             | another tooltip opens at 0 ms during the 300 ms warm window; retained ownership cancels expiry; a fresh close restarts it; expiry returns cold |
| `of-tooltip.pointer-transition-grace.v1`    | browsers                                             | trigger/tooltip transit retains visibility; leaving both remains open at 99 ms and closes at exactly 100 ms                                    |
| `of-tooltip.combined-focus-hover.v1`        | browsers, keyboard-focus                             | losing one input owner never closes content still owned by the other                                                                           |
| `of-tooltip.escape-no-focus-move.v1`        | browsers, keyboard-focus                             | Escape dismisses focus- or hover-opened topmost tooltip without focus movement or trigger activation                                           |
| `of-tooltip.stable-description.v1`          | browsers, React 18/19, axe light/dark, forced colors | one stable tooltip ID augments consumer `aria-describedby`; described and visible text match; no duplicate announcement                        |
| `of-tooltip.logical-placement.v1`           | browsers, ltr, rtl                                   | logical placement remains visible, mirrors horizontally, and exposes only Lyra-owned placement values                                          |
| `of-tooltip.coarse-pointer-alternative.v1`  | browsers, coarse pointer                             | tap retains native trigger action, no long press is required, and essential information has an independent operable source                     |
| `of-tooltip.trigger-removal-stale-timer.v1` | browsers, reduced motion                             | removal cancels delay/placement work and stale callbacks cannot reopen or announce                                                             |
| `of-tooltip.final-owner-teardown.v1`        | browsers, reduced motion                             | final destroy cancels all timers/listeners/observers and resets the document coordinator cold                                                  |
| `of-tooltip.ssr-description.v1`             | ssr                                                  | stable described content exists whenever the server trigger exposes the relationship                                                           |
| `of-tooltip.hydration-stability.v1`         | React 18/19, hydration                               | description ID/text, closed state, focus, timers, and event count survive hydration                                                            |

- [ ] **Step 1: Write exact inventory, coverage, and neutrality tests**

Assert literal scenario ID sets, contract/component mapping, immutable `.v1`
suffixes, every behavioral cell per contract, no decision-evidence cell, and
`validateScenario` success. For each row, remove one required expected probe
and prove coverage validation rejects it. Inject each candidate name, vendor
selector/attribute/event, or package identity into every normative JSON path
and prove neutrality validation rejects it.

- [ ] **Step 2: Run RED**

```bash
rtk mise exec node@24.18.0 -- node --test \
  tools/overlay-foundation-evaluation/contracts/anchored.test.mjs \
  tools/overlay-foundation-evaluation/contracts/menu.test.mjs \
  tools/overlay-foundation-evaluation/contracts/tooltip.test.mjs \
  tools/overlay-foundation-evaluation/contracts/wave2.test.mjs
```

- [ ] **Step 3: Implement frozen literal records**

Use the existing modal probe phases (`after-operation`, `after-cleanup`, and
`server-render`). Timing boundaries use consecutive `advanceTime` operations
and an `after-operation` probe at each boundary. Their `milliseconds` values
are only `0`, `1`, `99`, `100`, `299`, `300`, `499`, or `500` as required by
the scenario. Geometry fixtures use deterministic viewport/trigger/content
rectangles and assert side/alignment/viewport containment, not vendor pixels.

- [ ] **Step 4: Prove conditional menu semantics honestly**

The public-model boundary record must state `submenu`, `checkbox`, and `radio`
as `not-applicable-current-public-model`; it must reject a synthesized PASS for
behavior the current Dropdown item union cannot express. No documentation may
claim those capabilities.

- [ ] **Step 5: Mutation proofs and GREEN**

Remove WebKit from one contract, change tooltip 499 to 500, allow an unsupported
menu role, and derive one expected placement from an observation. Each named
test must fail. Restore and run all protocol plus Wave 2 contract tests green.

- [ ] **Step 6: Commit scenarios**

```bash
rtk git add tools/overlay-foundation-evaluation/contracts
rtk git commit -m "feat: define anchored interaction scenarios"
```

---

### Task 4: Share observation/resource protocol and build the Wave 2 runtime

**Files:**

- Create: `tools/overlay-foundation-evaluation/fixtures/shared/protocol.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/shared/protocol.test.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/shared/resource-tracker.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/shared/resource-tracker.test.mjs`
- Modify: `tools/overlay-foundation-evaluation/fixtures/modal/protocol.mjs`
- Modify: `tools/overlay-foundation-evaluation/fixtures/modal/protocol.test.mjs`
- Modify: `tools/overlay-foundation-evaluation/fixtures/modal/runtime.mjs`
- Modify: `tools/overlay-foundation-evaluation/fixtures/modal/runtime.test.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/wave2/protocol.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/wave2/protocol.test.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/wave2/runtime.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/wave2/runtime.test.mjs`

**Interfaces:**

- Shared factories validate the existing closed cell, request, snapshot,
  resource, and observation shapes. Modal exports remain source-compatible.
- The configurable resource tracker accounts for listeners, timers, observer
  claims, pointer ownership, portal ownership, acquisition/use/release phases,
  and idempotent restoration without candidate facts in normative fields.
- `createWave2Runtime(request)` exposes `beginScenario`, `runOperation`,
  `observe`, and `destroy`. It never owns expected values and rejects operation
  order drift.

- [ ] **Step 1: Capture modal behavior before extraction**

Add characterization tests over every existing modal request/observation key,
listener/timer lifecycle field, target naming rule, destroy result, and
vendor-diagnostic boundary. Run them green before moving code.

- [ ] **Step 2: Write Wave 2 protocol REDs**

Accept only `{ schemaVersion, scenario, cell }` requests for the three Wave 2
contracts. Reject candidate fields, expected values sent to the browser,
unknown cell flags, invalid timing values, non-JSON diagnostics, vendor facts
outside diagnostics, and missing cleanup/resource lifecycle evidence.

- [ ] **Step 3: Write operation-lifecycle REDs**

Prove operations execute in record order; stale callbacks cannot commit after
close/removal/destroy; destroy is idempotent; prevented selection is atomic;
placement updates never move focus or emit semantic events; and resource
counts return to zero. `advanceTime` is a runner-owned control operation and
must never call a candidate method.

- [ ] **Step 4: Extract shared code and keep modal green**

Parameterize only fixture root marker, layer boundary selector, target-name
attributes, connected-layer selector, and global tracker key. Modal passes its
existing values and retains `installModalResourceTracker`; Wave 2 uses
`data-overlay-*` markers and a separate non-enumerable bridge key.

- [ ] **Step 5: Implement the Wave 2 runtime**

Dispatch neutral `open`, `close`, `press`, `point`, `focus`, `blur`, `hover`,
`resize`, `scroll`, `setDirection`, `setMotionPreference`, `updateContent`, and
`destroy` operations to the mounted fixture. Capture probes immediately after
their declared operation. Reject `advanceTime` unless the runner provides the
clock transition between browser calls.

- [ ] **Step 6: Mutation proofs and GREEN**

Restore a timer after destroy and merge diagnostics into normative state as
separate mutations. Each must fail. Run shared, modal, and Wave 2 fixture tests
green.

- [ ] **Step 7: Commit the protocol/runtime boundary**

```bash
rtk git add tools/overlay-foundation-evaluation/fixtures/shared \
  tools/overlay-foundation-evaluation/fixtures/modal \
  tools/overlay-foundation-evaluation/fixtures/wave2
rtk git commit -m "refactor: share overlay fixture evidence"
```

---

### Task 5: Implement twelve private Wave 2 candidate adapters

**Files:**

- Modify: `tools/overlay-foundation-evaluation/candidates/incumbent.mjs`
- Modify: `tools/overlay-foundation-evaluation/candidates/radix.mjs`
- Modify: `tools/overlay-foundation-evaluation/candidates/base-ui.mjs`
- Modify: `tools/overlay-foundation-evaluation/candidates/zag.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/anchored/{incumbent,radix,base-ui,zag}.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/anchored/adapters.test.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/menu/{incumbent,radix,base-ui,zag}.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/menu/adapters.test.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/tooltip/{incumbent,radix,base-ui,zag}.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/tooltip/adapters.test.mjs`

**Interfaces:**

- Main descriptors declare all four behavioral contracts and exact
  `modalAdapterPath`, `anchoredAdapterPath`, `menuAdapterPath`, and
  `tooltipAdapterPath` values without eagerly importing a vendor.
- Private modules export `createAnchoredCandidate`, `createMenuCandidate`, or
  `createTooltipCandidate`; each returns one React fixture component using the
  common runtime markers and callbacks.

- [ ] **Step 1: Write main descriptor and lazy-import REDs**

Import every main module without candidate packages installed. Assert exact
contract/path exports and no vendor module resolution. Retain the incumbent's
five-contract `incumbentDescriptor` used for package characterization.

- [ ] **Step 2: Write adapter translation REDs with fake modules**

For all twelve adapters, inject fake React and vendor primitives, render the
neutral fixture, and assert only common trigger/content/item/description/
portal/resource markers and callbacks. Candidate names and private props may
appear only below diagnostics.

- [ ] **Step 3: Implement exact private imports**

- Incumbent imports `@lyra-ds/react/popover`, `@lyra-ds/react/dropdown`, and
  `@lyra-ds/react/tooltip` in their respective adapters.
- Radix imports `@radix-ui/react-popover`,
  `@radix-ui/react-dropdown-menu`, and `@radix-ui/react-tooltip`.
- Base UI imports the `popover`, `menu`, and `tooltip` subpaths from
  `@base-ui-components/react`.
- Zag imports the matching `@zag-js/popover`, `@zag-js/menu`, or
  `@zag-js/tooltip` machine plus the shared `@zag-js/react` connector.

Map controlled state, refs, IDs, direction, positioning inputs, consumer event
cancellation, focus/hover ownership, and teardown into the common boundary.
Adapters do not repair a candidate failure inside expected assertions and do
not import one another.

- [ ] **Step 4: Represent current menu limits without fabrication**

All adapters expose the same current Dropdown command/separator/label model.
They report submenu/check/radio as not applicable and do not use vendor-only
variants to manufacture support absent from Lyra's public model.

- [ ] **Step 5: Browser-targeted import and cleanup tests**

Bundle each adapter against exact synthetic package entry points. Prove all
imports resolve only inside the isolated fixture and that close/destroy remove
their portal tree, observers, timers, listeners, and stale callbacks.

- [ ] **Step 6: Mutation proofs and GREEN**

Eager-import one Radix module, leak one Base UI private part into a normative
marker, and retain one Zag timer after destroy. Each named test must fail.
Restore and run all adapter plus modal adapter regressions green.

- [ ] **Step 7: Commit adapters**

```bash
rtk git add tools/overlay-foundation-evaluation/candidates
rtk git commit -m "feat: add anchored candidate adapters"
```

---

### Task 6: Prepare isolated Wave 2 client, SSR, and hydration fixtures

**Files:**

- Create: `tools/overlay-foundation-evaluation/runner/wave2-fixture.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/wave2-fixture.test.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/wave2/entry-client.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/wave2/entry-server.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/wave2/index.html`
- Modify: `tools/overlay-foundation-evaluation/runner/modal-fixture.mjs`
- Modify: `tools/overlay-foundation-evaluation/runner/modal-fixture.test.mjs`

**Interfaces:**

- Extracts source-copy/build helpers only where needed and preserves
  `prepareModalFixture` behavior.
- Produces `prepareWave2Fixture({ candidate, artifacts, adapterEntry,
contractId, reactVersion, runRoot, repositoryRoot, runCommand })` returning
  verified client/SSR paths, hashes, lock/audit/license evidence, source
  snapshot, and owned cleanup data.

- [ ] **Step 1: Add modal characterization coverage**

Before extraction, assert current source list, Vite commands, environment
defines, output paths/hashes, error precedence, and cleanup ordering. Run the
modal fixture suite green.

- [ ] **Step 2: Write Wave 2 preparation REDs**

Use synthetic candidate archives and a fake command runner to prove exact
React 18.3.1/19.2.8 pairs; `--ignore-workspace`, `--ignore-scripts`, and offline
frozen second install; exact artifact `file:` entries; contract-specific
adapter selection; regular-file single reads; `wx` copies; post-copy hashes;
client/SSR output hashes; and confinement beneath the owned run root.

- [ ] **Step 3: Run RED**

```bash
rtk mise exec node@24.18.0 -- node --test \
  tools/overlay-foundation-evaluation/runner/modal-fixture.test.mjs \
  tools/overlay-foundation-evaluation/runner/wave2-fixture.test.mjs
```

- [ ] **Step 4: Implement verified source snapshot and builds**

Copy only the chosen private adapter plus Wave 2 protocol, runtime, client
entry, server entry, and HTML. The build define contains only canonical JSON
for the validated request and contract ID; candidate identity never enters a
scenario expectation. Build client and SSR with repository Vite 8.2.1 against
the fixture root.

- [ ] **Step 5: Prove isolation failures**

Reject adapter/source symlinks, identity replacement, post-copy changes,
ranged framework versions, duplicate artifact names, build output escape,
missing output, and repository lock/status drift. Primary and cleanup errors
form an `AggregateError` in original order.

- [ ] **Step 6: Mutation proofs and GREEN**

Remove `--ignore-scripts`, skip a source hash recheck, and let one output escape
the owned root. Each named test must fail. Restore and run isolation, modal
fixture, and Wave 2 fixture tests green.

- [ ] **Step 7: Commit fixture preparation**

```bash
rtk git add tools/overlay-foundation-evaluation/runner/modal-fixture.mjs \
  tools/overlay-foundation-evaluation/runner/modal-fixture.test.mjs \
  tools/overlay-foundation-evaluation/runner/wave2-fixture.mjs \
  tools/overlay-foundation-evaluation/runner/wave2-fixture.test.mjs \
  tools/overlay-foundation-evaluation/fixtures/wave2
rtk git commit -m "feat: prepare isolated anchored fixtures"
```

---

### Task 7: Execute all Wave 2 cells with deterministic time and evidence

**Files:**

- Create: `tools/overlay-foundation-evaluation/runner/wave2-cells.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/wave2-cells.test.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/wave2.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/wave2.test.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/wave2.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/wave2.test.mjs`
- Create: `tools/overlay-foundation-evaluation/compose.wave2.yml`

**Interfaces:**

- Produces `WAVE_2_CELL_POLICIES`, `runWave2Cell`, and
  `runWave2({ manifest, repositoryRoot, tmpdir, evidenceRoot, playwright,
fetchImpl, runCommand })`.
- CLI accepts exactly absolute `--manifest`, `--repository`, and `--evidence`
  paths. Result contains factual counts per candidate and contract only; no
  score, winner, selection, or recommendation.
- Browser scenarios execute operation-by-operation. `page.clock.install()` is
  called before fixture navigation; only `advanceTime` invokes
  `page.clock.runFor(milliseconds)`. Candidate timers therefore use the same
  controlled browser clock without a fixture-owned timing shortcut.

- [ ] **Step 1: Write exact cell policy REDs**

Mirror the modal policies exactly: named Chromium/Firefox/WebKit engines;
React versions; SSR without browser; hydration in both React versions;
Chromium keyboard/axe; forced colors active; reduced motion reduce; literal
LTR/RTL direction; and touch-enabled coarse pointer with no synthesized hover.
Assert no policy exists for the eight decision-evidence cells.

- [ ] **Step 2: Write deterministic clock REDs**

With fake Playwright, prove clock installation occurs before navigation,
operation order is preserved across `page.evaluate` calls, only timing records
advance the clock, exact 499/1, 299/1, and 99/1 boundaries are observable, and
clock/page/context/browser/server/fixture cleanup all run after failure.

- [ ] **Step 3: Write runner REDs with real evidence files**

Cover core preflight before scenarios; all contract/scenario/cell attempt-1
records; candidate-local continuation; run-fatal policy/ownership/repository/
evidence/cleanup behavior; retry as attempt 2 with attempt 1 effective; exact
manifest and core-artifact binding; SSR/hydration separation; resume-tree
validation; no decision-evidence results; and summary forbidden keys.

- [ ] **Step 4: Write CLI and compose REDs**

Reject relative, missing, duplicate, and unknown arguments; dirty or wrong
revision repository; BOM/malformed manifest; missing four behavioral contracts;
and conflicting evidence. Importing the CLI must not import Playwright. Compose
must pin the exact image digest, run with `init: true`, `ipc: host`, UID/GID,
read-only Node/input mounts, one owned work mount, and no browser install.

- [ ] **Step 5: Run RED**

```bash
rtk mise exec node@24.18.0 -- node --test \
  tools/overlay-foundation-evaluation/runner/wave2-cells.test.mjs \
  tools/overlay-foundation-evaluation/runner/wave2.test.mjs \
  tools/overlay-foundation-evaluation/scripts/wave2.test.mjs
```

- [ ] **Step 6: Implement candidate-neutral execution**

Run IDs are `wave2-<first-12-revision-characters>`. For each candidate, reuse
only core attempt-1 artifact paths and hashes, resolve the current contract
entry, prepare the React fixture versions required by the cell, execute every
literal scenario, validate the normalized observation, compare it only with
the scenario's expected record, write immutable evidence, verify artifacts and
repository state after cleanup, then continue or fail according to scope.

- [ ] **Step 7: Implement the pinned compose service**

Clone an immutable repository bundle into the owned container work root,
checkout the manifest revision detached, install with pnpm 11.13.1, and invoke:

```sh
corepack pnpm@11.13.1 overlay:evaluate:wave2 \
  --manifest /input/candidates.json \
  --repository /work/repository \
  --evidence /evidence
```

No host checkout is writable in the container. Network access is limited to
the same package/artifact acquisition performed by core preflight.

- [ ] **Step 8: Mutation proofs and GREEN**

Skip WebKit, skip one contract, make attempt 2 effective, branch an assertion
on candidate ID, bypass the controlled clock, and unpin the image as separate
mutations. Every named test must fail. Restore and run all Task 7 tests green.

- [ ] **Step 9: Commit execution**

```bash
rtk git add tools/overlay-foundation-evaluation/runner/wave2-cells.mjs \
  tools/overlay-foundation-evaluation/runner/wave2-cells.test.mjs \
  tools/overlay-foundation-evaluation/runner/wave2.mjs \
  tools/overlay-foundation-evaluation/runner/wave2.test.mjs \
  tools/overlay-foundation-evaluation/scripts/wave2.mjs \
  tools/overlay-foundation-evaluation/scripts/wave2.test.mjs \
  tools/overlay-foundation-evaluation/compose.wave2.yml
rtk git commit -m "feat: run anchored interaction evaluation"
```

---

### Task 8: Wire automation, run the diagnostic, and track exact manifest bytes

**Files:**

- Modify: `package.json`
- Modify: `tools/overlay-foundation-evaluation/README.md`
- Modify: `docs/superpowers/baselines/lyra-v1/README.md`
- Modify: `tools/overlay-foundation-evaluation/repository-policy.test.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/wave2-automation.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/wave2-automation.test.mjs`
- Regenerate after diagnostic: `tools/overlay-foundation-evaluation/candidates.json`
- Verify unchanged: `pnpm-lock.yaml`, `packages/`, `.github/workflows/`, and
  `docs/superpowers/baselines/lyra-v1/program.json`

**Interfaces:**

- Adds `overlay:evaluate:wave2:test`,
  `overlay:evaluate:behavioral:manifest`, `overlay:evaluate:wave2`, and the
  operator-facing `overlay:evaluate:wave2:auto`.
- Ordinary `pnpm test` may execute unit tests through existing globs but never
  executes the live diagnostic or Docker.
- Documents one automated setup/run path, local-diagnostic status, exact
  artifacts, first-attempt rule, and the later eight-cell ownership.

- [ ] **Step 1: Extend policy tests and observe RED**

Assert exact scripts:

```json
{
  "overlay:evaluate:wave2:test": "node --test tools/overlay-foundation-evaluation/contracts/anchored.test.mjs tools/overlay-foundation-evaluation/contracts/menu.test.mjs tools/overlay-foundation-evaluation/contracts/tooltip.test.mjs tools/overlay-foundation-evaluation/contracts/wave2.test.mjs tools/overlay-foundation-evaluation/fixtures/shared/*.test.mjs tools/overlay-foundation-evaluation/fixtures/wave2/*.test.mjs tools/overlay-foundation-evaluation/candidates/anchored/*.test.mjs tools/overlay-foundation-evaluation/candidates/menu/*.test.mjs tools/overlay-foundation-evaluation/candidates/tooltip/*.test.mjs tools/overlay-foundation-evaluation/runner/wave2*.test.mjs tools/overlay-foundation-evaluation/scripts/create-behavioral-manifest.test.mjs tools/overlay-foundation-evaluation/scripts/wave2.test.mjs tools/overlay-foundation-evaluation/scripts/wave2-automation.test.mjs",
  "overlay:evaluate:behavioral:manifest": "node tools/overlay-foundation-evaluation/scripts/create-behavioral-manifest.mjs",
  "overlay:evaluate:wave2": "node tools/overlay-foundation-evaluation/scripts/wave2.mjs",
  "overlay:evaluate:wave2:auto": "node tools/overlay-foundation-evaluation/scripts/wave2-automation.mjs"
}
```

Assert that exact space-separated command in the policy test. Also assert
immutable dependency/lock/package/workflow/ledger snapshots, all exact catalog
facts, four manifest contracts, forbidden summary keys, and absence of live
Wave 2 execution from ordinary tests. Write automation CLI REDs for exactly
`--output <absolute-new-directory>`, existing/symlinked output rejection, dirty
repository rejection, and injected command/filesystem boundaries that never
start Docker in unit tests.

- [ ] **Step 2: Implement host automation, scripts, and documentation**

`wave2-automation.mjs` resolves the exact Node installation, creates
mode-`0700` `input`, `work`, and `evidence` descendants, characterizes the
incumbent, writes and validates the manifest, creates and verifies the Git
bundle, supplies the compose environment, runs the service, reads the factual
summary, removes only the verified owned `work` descendant, and prints the
preserved manifest/bundle/evidence paths and hashes. Any incomplete step exits
non-zero without deleting evidence.

The driver uses the clean full HEAD for characterization, manifest, and bundle;
verifies the bundle's advertised HEAD; invokes only the pinned compose service;
and returns a closed JSON report with revision, manifest SHA-256, bundle
SHA-256, evidence root, result counts, and preserved paths. Unit tests inject
commands and prove exact order, arguments, environment, failure propagation,
non-overwrite, and work-only cleanup.

Document the three contracts, scenario counts (11 anchored, 14 menu, 13
tooltip), exact 15 cells, exact ten artifacts, the one-command automated run,
pre-manifest revision binding, retained external evidence root, attempt 1,
local diagnostic boundary, and later ownership of the eight packaging/bundle
cells. State that the manifest does not authorize production use.

- [ ] **Step 3: Commit implementation before manifest creation**

Format changed files, run focused tests, `node --check`, and `git diff --check`,
then commit scripts/docs/policy:

```bash
rtk git add package.json tools/overlay-foundation-evaluation/README.md \
  tools/overlay-foundation-evaluation/repository-policy.test.mjs \
  docs/superpowers/baselines/lyra-v1/README.md \
  tools/overlay-foundation-evaluation/scripts/wave2-automation.mjs \
  tools/overlay-foundation-evaluation/scripts/wave2-automation.test.mjs
rtk git commit -m "test: gate anchored evaluation locally"
```

Require a clean status and record the full `evaluation_revision`.

The driver internally performs the equivalent exact commands before starting
the container:

```bash
rtk mise exec node@24.18.0 -- pnpm overlay:evaluate:incumbent \
  --output "$manifest_tmp/incumbent.json"
rtk mise exec node@24.18.0 -- pnpm overlay:evaluate:behavioral:manifest \
  --revision "$evaluation_revision" \
  --incumbent "$manifest_tmp/incumbent.json" \
  --output "$manifest_tmp/candidates.json"
rtk mise exec node@24.18.0 -- pnpm overlay:evaluate:check \
  --manifest "$manifest_tmp/candidates.json"
rtk git bundle create "$manifest_tmp/repository.bundle" HEAD
```

Machine checks must prove the advertised bundle HEAD, all candidate/contract
orders, all hashes, exact incumbent artifacts, and clean repository state.

- [ ] **Step 4: Run the one-command pinned-container diagnostic**

```bash
rtk mise exec node@24.18.0 -- pnpm overlay:evaluate:wave2:auto \
  --output /home/francisross/tmp-builds/lyra-wave2-diagnostic-"$(rtk git rev-parse HEAD)"
```

Preserve exit code, counts by candidate/contract, attempt checksums, and factual
candidate failures in the task report. Fix and rerun only harness/policy/
ownership/evidence/repository/cleanup failures. Do not ask the operator to
perform browser steps or upload evidence manually.

- [ ] **Step 5: Track only already-evaluated manifest bytes**

Copy the external manifest to `candidates.json`, prove byte equality and
SHA-256, then commit only that file:

```bash
rtk git add tools/overlay-foundation-evaluation/candidates.json
rtk git commit -m "docs: pin anchored evaluation manifest"
```

The manifest intentionally names the evaluated parent revision, not its own
commit. Preserve manifest, bundle, and evidence for later decision evidence;
remove only the verified owned work directory created by this run.

- [ ] **Step 6: Run final gates with exact toolchain**

Use unique command-scoped scratch directories under
`/home/francisross/tmp-builds` for heavy gates:

```bash
rtk mise exec node@24.18.0 -- pnpm overlay:evaluate:core:test
rtk mise exec node@24.18.0 -- pnpm overlay:evaluate:modal:test
rtk mise exec node@24.18.0 -- pnpm overlay:evaluate:wave2:test
rtk mise exec node@24.18.0 -- pnpm overlay:evaluate:check \
  --manifest tools/overlay-foundation-evaluation/candidates.json
rtk mise exec node@24.18.0 -- pnpm v1-release:check
rtk mise exec node@24.18.0 -- pnpm run lint
rtk mise exec node@24.18.0 -- pnpm run typecheck
rtk mise exec node@24.18.0 -- pnpm test
rtk mise exec node@24.18.0 -- pnpm run build
rtk mise exec node@24.18.0 -- pnpm pack-smoke
rtk git diff --check origin/main...HEAD
```

- [ ] **Step 7: Prove scope and immutability**

```bash
rtk git diff --exit-code origin/main...HEAD -- \
  pnpm-lock.yaml packages .github/workflows \
  docs/superpowers/baselines/lyra-v1/program.json
rtk git status --short
```

Expected: no diff in immutable paths and a clean tracked worktree.

- [ ] **Step 8: Self-review and stop at the PR checkpoint**

Confirm all 38 scenario IDs and all 15 cells per contract are represented; all
four candidates consume identical scenario/expected records; exact timing uses
the controlled browser clock; menu unsupported variants are not fabricated;
attempt 1 remains effective; no packaging cell, winner, score, or production
change exists; modal regressions remain green; and container browsers remain
pinned. Push the implementation branch and open its PR only at the operator's
approved repository checkpoint. Merge, remote workflow creation, Wave 3,
decision evidence, foundation selection, and production migration each remain
separate approvals.
