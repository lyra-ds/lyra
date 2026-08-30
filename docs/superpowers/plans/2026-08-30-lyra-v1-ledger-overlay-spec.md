# Lyra V1 Ledger and Overlay Specification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fail-closed, machine-checked V1 program ledger and author the technology-neutral overlay-family contract that must be approved before any foundation evaluation begins.

**Architecture:** A tracked JSON ledger is the single structured source for the eleven remaining P1 component records. A dependency-free Node validator checks the ledger, referenced documents, lifecycle transitions, CI wiring, and evidence invariants. The overlay specification defines observable Lyra behavior and acceptance cells without selecting or installing a candidate foundation; execution stops when the draft is ready for explicit approval.

**Tech Stack:** Node.js 24.18.0, pnpm 11.13.1, ECMAScript modules, `node:test`, JSON, YAML 2.9.0, Markdown, Prettier 3.9.6, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-30-lyra-v1-deliberate-release-design.md`

## Global Constraints

- Work only in the isolated `docs/v1-deliberate-release-plan` worktree until a later integration checkpoint.
- Prefix every shell command with `rtk`.
- Use a unique command-scoped `TMPDIR` below `/home/francisross/tmp-builds` for any test or build whose temporary size is unknown; remove only that exact directory.
- This plan creates no production overlay adapter, dependency, lockfile change, migration, bundle exception, remote push, workflow dispatch, PR, deployment, publication, tag, or release.
- The remaining P1 set is exactly Dialog, Drawer, BottomSheet, Popover, Dropdown, Tooltip, CommandPalette, WorkspaceSwitcher, CreateWorkspaceDialog, Tabs, and DataTable.
- Missing manual Windows/NVDA and macOS/VoiceOver evidence is `deferred-by-release-profile`, never `PASS`.
- Every applicable automated acceptance cell is blocking; an inapplicable cell requires a non-empty specification reason.
- Public props, exports, DOM attributes, `.lyra-*` classes, tokens, and documented composition remain Lyra-owned contracts.
- No candidate foundation may be selected or installed until the overlay-family specification is explicitly approved.
- Keep the required CI context names exactly `lint`, `typecheck`, `test`, and `build`; new policy checks are steps inside an existing context.

## File Structure

- `docs/superpowers/baselines/lyra-v1/program.json` — structured source of truth for V1 streams, P1 components, lifecycle state, acceptance profiles, migration pointers, compatibility ranges, and immutable evidence pointers.
- `tools/v1-release/check.mjs` — pure ledger/document/CI validator plus repository CLI.
- `tools/v1-release/check.test.mjs` — mutation tests proving the validator fails closed.
- `docs/superpowers/specs/2026-08-30-overlay-family-design.md` — technology-neutral modal, anchored, menu, tooltip, and composed-overlay contract.
- `docs/superpowers/baselines/lyra-v1/README.md` — human evidence index linking the machine ledger and recording the approval boundary.
- `package.json` — `v1-release:check` command and root unit-test inclusion.
- `.github/workflows/ci.yml` — exact policy command inside the existing `lint` job.

---

### Task 1: Add the fail-closed V1 program ledger

**Files:**

- Create: `docs/superpowers/baselines/lyra-v1/program.json`
- Create: `tools/v1-release/check.mjs`
- Create: `tools/v1-release/check.test.mjs`

**Interfaces:**

- Consumes: the approved program design path, the eleven exact P1 IDs, tracked specification text supplied by the repository reader, and optional tracked evidence documents.
- Produces: `validateV1Program({ ledger, documents }): string[]`, `validateV1Entry(entry, acceptanceProfiles): string[]`, and a CLI that exits `0` only when the real repository is internally consistent.
- Produces ledger schema version `1`, lifecycle states `planned | specified | evaluating | implementing | qualified`, and specification states `not-authored | draft | approved | implemented`.

- [ ] **Step 1: Write the missing-module RED and the valid fixture**

Create `tools/v1-release/check.test.mjs` with a complete valid fixture rather than weakening production validation for partial tests:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { validateV1Program } from './check.mjs';

const P1_IDS = [
  'dialog',
  'drawer',
  'bottom-sheet',
  'popover',
  'dropdown',
  'tooltip',
  'command-palette',
  'workspace-switcher',
  'create-workspace-dialog',
  'tabs',
  'data-table',
];

function plannedEntry(id, stream, wave) {
  return {
    id,
    stream,
    wave,
    priority: 'P1',
    governingSpecification: { path: null, status: 'not-authored' },
    currentContract: [`packages/react/src/${id}/${id}.tsx`],
    targetContracts: [`v1-${id}`],
    implementationStatus: 'planned',
    acceptanceProfile: 'v1-interactive',
    notApplicable: [],
    acceptanceEvidence: {},
    migrationGuides: { en: null, ptBR: null },
    compatibility: { styles: null, react: null, alpine: null },
    immutableEvidence: [],
    manualEvidence: 'deferred-by-release-profile',
  };
}

function validProgram() {
  return {
    ledger: {
      schemaVersion: 1,
      targetRelease: '1.0.0',
      programSpecification:
        'docs/superpowers/specs/2026-08-30-lyra-v1-deliberate-release-design.md',
      releaseStatus: 'planning',
      acceptanceProfiles: {
        'v1-interactive': [
          'chromium',
          'firefox',
          'webkit',
          'react-18',
          'react-19',
          'ssr',
          'hydration',
          'keyboard-focus',
          'axe-light',
          'axe-dark',
          'forced-colors',
          'reduced-motion',
          'ltr',
          'rtl',
          'coarse-pointer',
          'bundle-standalone',
          'bundle-composition',
          'packed-esm',
          'packed-cjs',
          'packed-types',
          'consumer-vite',
          'consumer-next',
          'consumer-commonjs',
        ],
      },
      components: P1_IDS.map((id) =>
        plannedEntry(
          id,
          ['tabs', 'data-table'].includes(id) ? id : 'overlay',
          ['dialog', 'drawer', 'bottom-sheet'].includes(id)
            ? 'modal'
            : ['popover', 'dropdown', 'tooltip'].includes(id)
              ? 'anchored'
              : ['tabs', 'data-table'].includes(id)
                ? id
                : 'composed',
        ),
      ),
    },
    documents: {
      'docs/superpowers/specs/2026-08-30-lyra-v1-deliberate-release-design.md':
        '**Status:** Approved',
    },
  };
}

test('accepts the complete planned V1 program', () => {
  assert.deepEqual(validateV1Program(validProgram()), []);
});
```

- [ ] **Step 2: Run the focused test and record the RED**

Run:

```bash
rtk node --test tools/v1-release/check.test.mjs
```

Expected: exit `1` with `ERR_MODULE_NOT_FOUND` for `tools/v1-release/check.mjs`.

- [ ] **Step 3: Add fail-closed mutation tests**

Add table-driven tests that independently mutate the valid fixture and assert one stable error per case:

```js
for (const [name, mutate, expected] of [
  ['null root', (input) => (input.ledger = null), 'ledger must be a plain object'],
  ['wrong schema', (input) => (input.ledger.schemaVersion = 2), 'schemaVersion must equal 1'],
  [
    'wrong target',
    (input) => (input.ledger.targetRelease = '0.9.0'),
    'targetRelease must equal 1.0.0',
  ],
  ['missing component', (input) => input.ledger.components.pop(), 'P1 component set must match'],
  [
    'duplicate component',
    (input) => input.ledger.components.push(input.ledger.components[0]),
    'component IDs must be unique',
  ],
  [
    'wrong priority',
    (input) => (input.ledger.components[0].priority = 'P2'),
    'priority must equal P1',
  ],
  [
    'missing field',
    (input) => delete input.ledger.components[0].migrationGuides,
    'migrationGuides is required',
  ],
  [
    'unknown lifecycle',
    (input) => (input.ledger.components[0].implementationStatus = 'done'),
    'implementationStatus is invalid',
  ],
  [
    'missing spec path',
    (input) => {
      input.ledger.components[0].governingSpecification = { path: null, status: 'draft' };
    },
    'draft specification must name a tracked path',
  ],
  [
    'false completed claim',
    (input) => {
      input.ledger.components[0].implementationStatus = 'qualified';
    },
    'qualified component requires implemented specification, migration, compatibility, and evidence',
  ],
  [
    'unknown matrix cell',
    (input) => input.ledger.acceptanceProfiles['v1-interactive'].push('phantom'),
    'acceptance profile contains unknown cells',
  ],
  [
    'unjustified exclusion',
    (input) => {
      input.ledger.components[0].notApplicable = [{ cell: 'rtl', reason: '' }];
    },
    'notApplicable reason must be non-empty',
  ],
]) {
  test(`rejects ${name}`, () => {
    const input = structuredClone(validProgram());
    mutate(input);
    assert.ok(validateV1Program(input).some((error) => error.includes(expected)));
  });
}
```

Also prove that a `qualified` entry requires:

- specification status `implemented` and a tracked specification whose metadata is exactly `**Status:** Implemented`;
- non-null English and Brazilian Portuguese migration paths with tracked documents;
- exact non-null Styles, React, and Alpine compatibility ranges;
- one evidence object for every required acceptance cell after justified exclusions;
- every evidence record has `result: "PASS"`, a full lowercase 40-character Git revision, and a tracked immutable artifact path; and
- manual evidence may be absent only as `deferred-by-release-profile`, never as a passing automated cell.

- [ ] **Step 4: Implement the smallest pure validator**

Create `tools/v1-release/check.mjs`. Keep repository I/O outside the pure functions:

```js
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const P1_IDS = new Set([
  'dialog',
  'drawer',
  'bottom-sheet',
  'popover',
  'dropdown',
  'tooltip',
  'command-palette',
  'workspace-switcher',
  'create-workspace-dialog',
  'tabs',
  'data-table',
]);
const IMPLEMENTATION_STATES = new Set([
  'planned',
  'specified',
  'evaluating',
  'implementing',
  'qualified',
]);
const SPECIFICATION_STATES = new Set(['not-authored', 'draft', 'approved', 'implemented']);
const ACCEPTANCE_CELLS = new Set([
  'chromium',
  'firefox',
  'webkit',
  'react-18',
  'react-19',
  'ssr',
  'hydration',
  'keyboard-focus',
  'axe-light',
  'axe-dark',
  'forced-colors',
  'reduced-motion',
  'ltr',
  'rtl',
  'coarse-pointer',
  'bundle-standalone',
  'bundle-composition',
  'packed-esm',
  'packed-cjs',
  'packed-types',
  'consumer-vite',
  'consumer-next',
  'consumer-commonjs',
]);
const REQUIRED_ENTRY_KEYS = new Set([
  'id',
  'stream',
  'wave',
  'priority',
  'governingSpecification',
  'currentContract',
  'targetContracts',
  'implementationStatus',
  'acceptanceProfile',
  'notApplicable',
  'acceptanceEvidence',
  'migrationGuides',
  'compatibility',
  'immutableEvidence',
  'manualEvidence',
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateV1Entry(entry, acceptanceProfiles, documents) {
  const errors = [];
  if (!isPlainObject(entry)) return ['component entry must be a plain object'];
  const label = typeof entry.id === 'string' ? entry.id : '<unknown>';
  const keys = new Set(Object.keys(entry));
  for (const key of REQUIRED_ENTRY_KEYS) {
    if (!keys.has(key)) errors.push(`${label}: ${key} is required`);
  }
  for (const key of keys) {
    if (!REQUIRED_ENTRY_KEYS.has(key)) errors.push(`${label}: unknown field ${key}`);
  }
  if (entry.priority !== 'P1') errors.push(`${label}: priority must equal P1`);
  if (!IMPLEMENTATION_STATES.has(entry.implementationStatus)) {
    errors.push(`${label}: implementationStatus is invalid`);
  }
  if (!Array.isArray(entry.currentContract) || entry.currentContract.length === 0) {
    errors.push(`${label}: currentContract must be a non-empty string array`);
  }
  if (!Array.isArray(entry.targetContracts) || entry.targetContracts.length === 0) {
    errors.push(`${label}: targetContracts must be a non-empty string array`);
  }
  const specification = entry.governingSpecification;
  if (!isPlainObject(specification) || !SPECIFICATION_STATES.has(specification.status)) {
    errors.push(`${label}: governing specification status is invalid`);
  } else if (specification.status === 'not-authored') {
    if (specification.path !== null) {
      errors.push(`${label}: not-authored specification path must be null`);
    }
  } else if (typeof specification.path !== 'string' || !(specification.path in documents)) {
    errors.push(`${label}: ${specification.status} specification must name a tracked path`);
  }
  const profile = acceptanceProfiles?.[entry.acceptanceProfile];
  if (!Array.isArray(profile)) errors.push(`${label}: acceptanceProfile is unknown`);
  if (!Array.isArray(entry.notApplicable)) {
    errors.push(`${label}: notApplicable must be an array`);
  } else {
    const excluded = new Set();
    for (const exclusion of entry.notApplicable) {
      if (
        !isPlainObject(exclusion) ||
        !ACCEPTANCE_CELLS.has(exclusion.cell) ||
        typeof exclusion.reason !== 'string' ||
        exclusion.reason.trim() === '' ||
        excluded.has(exclusion.cell)
      ) {
        errors.push(`${label}: notApplicable reason must be non-empty and each cell unique`);
      }
      excluded.add(exclusion?.cell);
    }
  }
  if (entry.manualEvidence !== 'deferred-by-release-profile') {
    errors.push(`${label}: absent manual evidence must be deferred-by-release-profile`);
  }
  if (entry.implementationStatus === 'qualified') {
    if (specification?.status !== 'implemented') {
      errors.push(`${label}: qualified component requires an implemented specification`);
    }
    const specText = documents[specification?.path];
    if (!/^\*\*Status:\*\* Implemented$/mu.test(specText ?? '')) {
      errors.push(`${label}: implemented specification metadata is missing`);
    }
    for (const locale of ['en', 'ptBR']) {
      const path = entry.migrationGuides?.[locale];
      if (typeof path !== 'string' || !(path in documents)) {
        errors.push(`${label}: qualified component requires tracked ${locale} migration`);
      }
    }
    for (const packageName of ['styles', 'react', 'alpine']) {
      if (typeof entry.compatibility?.[packageName] !== 'string') {
        errors.push(`${label}: qualified component requires ${packageName} compatibility`);
      }
    }
    const excluded = new Set(entry.notApplicable.map(({ cell }) => cell));
    for (const cell of profile ?? []) {
      if (excluded.has(cell)) continue;
      const evidence = entry.acceptanceEvidence?.[cell];
      if (
        !isPlainObject(evidence) ||
        evidence.result !== 'PASS' ||
        !/^[0-9a-f]{40}$/u.test(evidence.revision ?? '') ||
        typeof evidence.artifact !== 'string' ||
        !(evidence.artifact in documents)
      ) {
        errors.push(`${label}: qualified component requires passing ${cell} evidence`);
      }
    }
    if (!Array.isArray(entry.immutableEvidence) || entry.immutableEvidence.length === 0) {
      errors.push(`${label}: qualified component requires immutable evidence`);
    }
  }
  return errors;
}

export function validateV1Program({ ledger, documents = {} } = {}) {
  const errors = [];
  if (!isPlainObject(ledger)) return ['ledger must be a plain object'];
  if (ledger.schemaVersion !== 1) errors.push('schemaVersion must equal 1');
  if (ledger.targetRelease !== '1.0.0') errors.push('targetRelease must equal 1.0.0');
  if (ledger.releaseStatus !== 'planning') errors.push('releaseStatus must equal planning');
  if (
    ledger.programSpecification !==
      'docs/superpowers/specs/2026-08-30-lyra-v1-deliberate-release-design.md' ||
    !/^\*\*Status:\*\* Approved$/mu.test(documents[ledger.programSpecification] ?? '')
  ) {
    errors.push('programSpecification must reference the approved deliberate V1 design');
  }
  const profile = ledger.acceptanceProfiles?.['v1-interactive'];
  if (
    !Array.isArray(profile) ||
    profile.length !== ACCEPTANCE_CELLS.size ||
    profile.some((cell) => !ACCEPTANCE_CELLS.has(cell)) ||
    new Set(profile).size !== profile.length
  ) {
    errors.push('acceptance profile contains unknown, missing, or duplicate cells');
  }
  if (!Array.isArray(ledger.components)) return [...errors, 'components must be an array'];
  const ids = ledger.components.map((entry) => entry?.id);
  if (
    ids.length !== P1_IDS.size ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !P1_IDS.has(id))
  ) {
    errors.push('P1 component set must match and component IDs must be unique');
  }
  for (const entry of ledger.components) {
    errors.push(...validateV1Entry(entry, ledger.acceptanceProfiles, documents));
  }
  return errors;
}
```

Keep this validation dependency-free; do not add a JSON-schema package.

The CLI must resolve the repository from `import.meta.url`, read `program.json`, collect every non-null referenced spec/migration/evidence path, reject paths outside the repository, call `validateV1Program`, print all errors, and set exit code `1` on any error.

- [ ] **Step 5: Create the truthful initial ledger**

Create `docs/superpowers/baselines/lyra-v1/program.json` with the exact schema from `validProgram()`. Use explicit records for all eleven IDs. Initial truth is:

| IDs                                                      | Stream/wave             | Specification                                                                         | Implementation |
| -------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------- | -------------- |
| Dialog, Drawer, BottomSheet                              | `overlay/modal`         | `not-authored`, path `null`                                                           | `planned`      |
| Popover, Dropdown, Tooltip                               | `overlay/anchored`      | `not-authored`, path `null`                                                           | `planned`      |
| CommandPalette, WorkspaceSwitcher, CreateWorkspaceDialog | `overlay/composed`      | `not-authored`, path `null`                                                           | `planned`      |
| Tabs                                                     | `tabs/tabs`             | `not-authored`, path `null`                                                           | `planned`      |
| DataTable                                                | `data-table/data-table` | `docs/superpowers/specs/2026-08-15-data-files-family-design.md`, status `implemented` | `planned`      |

For DataTable, `implemented` describes the governing family document's current FileUpload wave, not DataTable completion. Keep DataTable `implementationStatus: "planned"`, migration and compatibility values `null`, and evidence empty.

- [ ] **Step 6: Run focused GREEN and mutation proof**

Run:

```bash
rtk node --test tools/v1-release/check.test.mjs
rtk node tools/v1-release/check.mjs
```

Expected: all focused tests pass and the real ledger exits `0`. Temporarily change one local fixture's `qualified` evidence result to `FAIL`, observe the focused test fail, then restore it before continuing.

- [ ] **Step 7: Commit the ledger boundary**

```bash
rtk git add docs/superpowers/baselines/lyra-v1/program.json tools/v1-release/check.mjs tools/v1-release/check.test.mjs
rtk git diff --cached --check
rtk git commit -m "feat: add deliberate v1 program ledger"
```

### Task 2: Make ledger drift an existing CI gate

**Files:**

- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `tools/v1-release/check.test.mjs`
- Modify: `docs/superpowers/baselines/lyra-v1/README.md`

**Interfaces:**

- Consumes: `node tools/v1-release/check.mjs` from Task 1.
- Produces: root command `pnpm v1-release:check`, root unit-test execution of `check.test.mjs`, and one unconditional exact command in the existing `lint` job after `pnpm v1-core:check`.

- [ ] **Step 1: Write CI and package-script policy REDs**

Extend `check.test.mjs` with a YAML-aware workflow validator:

```js
import { parse } from 'yaml';

export function validateV1ReleaseWiring({ packageJson, workflow }) {
  const errors = [];
  const script = packageJson?.scripts?.['v1-release:check'];
  if (script !== 'node tools/v1-release/check.mjs') {
    errors.push('package.json must define the exact v1-release:check command');
  }
  const document = parse(workflow);
  const steps = document?.jobs?.lint?.steps;
  const commands = Array.isArray(steps)
    ? steps.filter((step) => typeof step?.run === 'string').map((step) => step.run.trim())
    : [];
  if (!commands.includes('pnpm v1-release:check')) {
    errors.push('lint must run pnpm v1-release:check unconditionally');
  }
  return errors;
}
```

Put the production function in `check.mjs`; the snippet defines its exact behavior. Add mutations for comment-only text, `echo pnpm v1-release:check`, `if: false`, `continue-on-error: true`, the wrong job, and placement before frozen install. Each must fail.

- [ ] **Step 2: Run the wiring tests and record the RED**

Run `rtk node --test tools/v1-release/check.test.mjs`.

Expected: tests against the real `package.json` and `.github/workflows/ci.yml` fail because neither command exists.

- [ ] **Step 3: Wire the exact commands**

In `package.json`:

```json
"v1-release:check": "node tools/v1-release/check.mjs"
```

Add `tools/v1-release/check.test.mjs` to the existing root `node --test` file list. In `.github/workflows/ci.yml`, add this unconditional step after `pnpm v1-core:check`:

```yaml
- run: pnpm v1-release:check
```

Do not add or rename a job.

- [ ] **Step 4: Index the ledger without overstating completion**

Add a `Deliberate V1 program` section to `docs/superpowers/baselines/lyra-v1/README.md` linking `program.json` and the approved deliberate-release design. State exactly:

```markdown
The ledger is the machine-readable completion source for the remaining P1
contracts. A `planned`, `specified`, `evaluating`, or `implementing` entry is
not complete. Only `qualified` with complete immutable evidence can satisfy the
V1 exit gate.
```

Retain the existing FileUpload, browser, and manual-evidence truth. Replace the final “next artifact” sentence only after Task 3 creates the overlay specification.

- [ ] **Step 5: Run focused and repository wiring GREEN**

```bash
rtk node --test tools/v1-release/check.test.mjs
rtk pnpm v1-release:check
rtk pnpm phase0:check
rtk pnpm v1-core:check
rtk pnpm exec prettier --check package.json .github/workflows/ci.yml tools/v1-release docs/superpowers/baselines/lyra-v1/README.md
```

Expected: all commands exit `0`.

- [ ] **Step 6: Commit CI enforcement**

```bash
rtk git add package.json .github/workflows/ci.yml tools/v1-release/check.mjs tools/v1-release/check.test.mjs docs/superpowers/baselines/lyra-v1/README.md
rtk git diff --cached --check
rtk git commit -m "ci: enforce deliberate v1 ledger"
```

### Task 3: Author the technology-neutral overlay-family specification

**Files:**

- Create: `docs/superpowers/specs/2026-08-30-overlay-family-design.md`
- Modify: `docs/superpowers/baselines/lyra-v1/program.json`
- Modify: `tools/v1-release/check.test.mjs`

**Interfaces:**

- Consumes: approved foundational specifications, current React and Alpine overlay public APIs/tests, the overlay ADR template, and the program ledger.
- Produces: one `**Status:** Draft — awaiting written review` family specification governing all nine overlay P1 records.
- Produces stable contract IDs `OF-MODAL`, `OF-ANCHORED`, `OF-MENU`, `OF-TOOLTIP`, and `OF-COMPOSED` for the later evaluation harness.

- [ ] **Step 1: Write specification-structure REDs**

Add tests that change the nine overlay entries from `not-authored` to:

```json
{
  "path": "docs/superpowers/specs/2026-08-30-overlay-family-design.md",
  "status": "draft"
}
```

Supply no document first and assert `validateV1Program` reports the missing tracked specification. Then supply a minimal document and require these exact level-two headings once each:

```js
const OVERLAY_SPEC_HEADINGS = [
  'Decision summary',
  'Scope and ownership',
  'Current contract inventory',
  'Shared layer contract',
  'Modal contract',
  'Anchored layer contract',
  'Menu contract',
  'Tooltip contract',
  'Composed overlay contract',
  'React and Alpine boundary',
  'SSR, hydration, and no-JavaScript contract',
  'Acceptance matrix',
  'Public API and migration policy',
  'Foundation evaluation gate',
  'Failure handling',
  'Approval checklist',
];
```

Require the draft metadata, all nine component names, all five contract IDs, Chromium/Firefox/WebKit, React 18/19, `deferred-by-release-profile`, and links to the program design plus the five foundational specifications.

- [ ] **Step 2: Run the specification tests and record the RED**

Run `rtk node --test tools/v1-release/check.test.mjs`.

Expected: failure reports the missing overlay specification and required structure.

- [ ] **Step 3: Write metadata, ownership, and current-contract inventory**

Create `docs/superpowers/specs/2026-08-30-overlay-family-design.md` with:

```markdown
# Lyra V1 Overlay Family Design

**Status:** Draft — awaiting written review

**Date:** 2026-08-30

**Owner:** Lyra maintainers

**Scope:** Dialog, Drawer, BottomSheet, Popover, Dropdown, Tooltip,
CommandPalette, WorkspaceSwitcher, and CreateWorkspaceDialog across the public
Styles, React, and claimed Alpine surfaces.
```

The inventory table must list, per component, current React props/export path, current Alpine support or explicit unsupported state, public `.lyra-*` root/parts/modifiers, roles and relationships, open/close state ownership, and known P1 gap. Do not infer Alpine parity from a React export.

- [ ] **Step 4: Define shared and modal contracts**

Write normative `MUST`/`MUST NOT` rules for `OF-MODAL`:

- layer stack order and topmost-only Escape/outside dismissal;
- portal host ownership and deterministic SSR/hydration IDs;
- inert background behavior and focus containment for the logically open period;
- explicit initial-focus policy, including large/destructive content and validation failure;
- restoration to connected opener, then the documented logical successor when the opener unmounts;
- dynamic, disabled, hidden, inert, removed, and zero-tabbable content;
- nested modal behavior and reference-counted scroll locking without layout shift;
- pointer-down origin for backdrop dismissal and cancellation rules;
- controlled state, exit presence, reduced motion, teardown, and reopen-during-exit behavior; and
- Dialog as the semantic behavior base while Drawer and BottomSheet own presentation only.

Record which current DOM/classes remain public and which portal/focus/presence/scroll details are internal and replaceable.

- [ ] **Step 5: Define anchored, menu, and tooltip contracts**

Write normative rules for:

- `OF-ANCHORED`: one semantic trigger, stable `aria-controls`, collision/flip behavior, viewport/scroll/resize updates, outside-interaction origin, Escape, focus restoration, LTR/RTL placement, and portal ownership;
- `OF-MENU`: trigger keys, one roving focus model, Arrow/Home/End behavior, disabled-item discovery and non-activation, character typeahead with repeated-character cycling, selection, Tab exit, Escape restoration, submenu direction, and check/radio item semantics when supported;
- `OF-TOOLTIP`: focus and hover entry, coordinated delay, Escape dismissal without moving focus, hoverable-content requirements, touch behavior, no essential tooltip-only information, stable description relationship, and teardown; and
- explicit reasons when a behavior is inapplicable to Popover versus Dropdown versus Tooltip.

- [ ] **Step 6: Define composed overlays and adapter boundaries**

For `OF-COMPOSED`, state that CommandPalette reuses modal layering while retaining its combobox/listbox model; WorkspaceSwitcher reuses anchored selection behavior; CreateWorkspaceDialog composes the modal contract without forking it. Specify callback/state ownership and prohibit duplicate focus, portal, presence, scroll-lock, or dismiss foundations after migration.

Define equivalent observable React/Alpine contracts without requiring a shared runtime. Mark unsupported Alpine component surfaces explicitly. Require vendor adapters to remain below non-exported Lyra interfaces and prohibit vendor types, parts, selectors, and `data-*` attributes from generated public declarations or docs.

- [ ] **Step 7: Define the exact automated acceptance matrix**

For every contract ID, map each `v1-interactive` cell to `required` or to `not applicable` with a reason. At minimum, require:

- Chromium, Firefox, and WebKit browser behavior;
- React 18 and 19 for React surfaces;
- SSR and hydration without module-scope DOM access or first-render mismatch;
- keyboard/focus scenarios, axe light/dark, forced colors, reduced motion, LTR/RTL, and coarse pointer;
- standalone and modal/anchored/composed bundle scenarios;
- packed ESM, CJS, declarations, Vite, Next.js, and CommonJS consumers; and
- manual evidence rendered only as `deferred-by-release-profile` when absent.

Define evidence record fields now: contract ID, scenario ID, expected result, observed result, `PASS | FAIL | unavailable`, full candidate revision, exact dependency versions, artifact SHA-256, environment versions, and immutable artifact path.

- [ ] **Step 8: Define the later foundation-evaluation gate**

The spec must require the incumbent, Radix, Base UI, and Zag direction to run the same accepted fixtures. It must not choose a winner. State that a later ADR cannot be accepted when any applicable WCAG/SSR/hydration cell fails, vendor types leak, bundle limits fail without approval, evidence is mutable/incomplete, or equivalent production responsibilities would remain duplicated.

Retain the `1.5 kB` Brotli simple and `3 kB` Brotli complex/composition limits from the approved program design. Require removed-code/dependency accounting and migration impact in the ADR.

- [ ] **Step 9: Update the nine ledger records truthfully**

Set all nine overlay records to `governingSpecification.path` equal to the new file, `status: "draft"`, and `implementationStatus: "specified"`. Set their target contracts by wave:

- Dialog, Drawer, BottomSheet → `OF-MODAL`;
- Popover → `OF-ANCHORED`;
- Dropdown → `OF-ANCHORED` plus `OF-MENU`;
- Tooltip → `OF-ANCHORED` plus `OF-TOOLTIP`;
- CommandPalette, WorkspaceSwitcher, CreateWorkspaceDialog → `OF-COMPOSED` plus the reused lower-level contract named in the specification.

Do not add acceptance evidence, migration paths, compatibility ranges, or `qualified` claims.

- [ ] **Step 10: Run focused GREEN and content checks**

```bash
rtk node --test tools/v1-release/check.test.mjs
rtk pnpm v1-release:check
rtk rg -n "T[B]D|T[O]DO|place[h]older|implement la[t]er|fill i[n]" docs/superpowers/specs/2026-08-30-overlay-family-design.md
rtk pnpm exec prettier --check docs/superpowers/specs/2026-08-30-overlay-family-design.md docs/superpowers/baselines/lyra-v1/program.json
```

Expected: tests and checks pass; `rg` returns no matches.

- [ ] **Step 11: Commit the reviewable specification**

```bash
rtk git add docs/superpowers/specs/2026-08-30-overlay-family-design.md docs/superpowers/baselines/lyra-v1/program.json tools/v1-release/check.test.mjs
rtk git diff --cached --check
rtk git commit -m "docs: define v1 overlay contracts"
```

### Task 4: Close the specification-review checkpoint

**Files:**

- Modify: `tools/v1-release/check.mjs`
- Modify: `tools/v1-release/check.test.mjs`
- Modify: `docs/superpowers/baselines/lyra-v1/README.md`

**Interfaces:**

- Consumes: the draft overlay specification and updated ledger from Task 3.
- Produces: fail-closed structural drift protection, a truthful evidence index, and a clean handoff for human approval.
- Does not produce: an `Approved` status, candidate dependencies, evaluation evidence, an ADR decision, or production code.

- [ ] **Step 1: Prove status/path/contract drift is rejected**

Add mutations for:

- ledger says `draft` while document says `Approved` or omits status;
- one overlay entry points to another path;
- one modal entry omits `OF-MODAL`;
- Dropdown omits `OF-MENU`;
- Tooltip omits `OF-TOOLTIP`;
- one composed component omits `OF-COMPOSED`;
- the document omits a required heading, browser, React version, manual deferral, component, or foundation candidate; and
- any overlay entry claims `evaluating`, `implementing`, or `qualified` while the spec remains draft.

Expected errors must identify the component or missing document contract, not merely return a generic invalid-ledger message.

- [ ] **Step 2: Implement the structural/status checks**

Add exact heading and overlay contract validation to `check.mjs`. Status transitions are:

```text
not-authored + planned
draft        + specified
approved     + specified
approved     + evaluating
approved     + implementing
implemented  + qualified
```

Reject every other pair. The validator must not change document content or promote status automatically.

- [ ] **Step 3: Update the Phase 0 handoff sentence**

Replace the final paragraph of `docs/superpowers/baselines/lyra-v1/README.md` with:

```markdown
The overlay-family specification now exists as a draft. Foundation evaluation,
candidate dependency installation, and an overlay implementation plan remain
blocked until the specification reaches `Approved` through an explicit
maintainer checkpoint.
```

- [ ] **Step 4: Run the bounded final verification**

Use a unique temporary directory for the root test:

```bash
rtk node --test tools/v1-release/check.test.mjs tools/phase0/check-artifacts.test.mjs tools/v1-core/check.test.mjs
rtk pnpm v1-release:check
rtk pnpm phase0:check
rtk pnpm v1-core:check
rtk pnpm run lint
rtk zsh -c 'run_tmp=$(mktemp -d -p /home/francisross/tmp-builds lyra-v1-ledger-test.XXXXXX) || exit 1; trap '\''rm -rf -- "$run_tmp"'\'' EXIT INT TERM; TMPDIR="$run_tmp" pnpm test'
rtk git diff --check
```

Expected: every command exits `0`; the root test retains the existing security, React/Alpine build, workspace, and FileUpload suites.

- [ ] **Step 5: Self-review against the approved program design**

Verify and record in the task report:

- all eleven and only eleven P1 IDs are present;
- the nine overlay entries point to the one draft family spec;
- Tabs and DataTable remain planned and are not accidentally promoted;
- no candidate package, lockfile, React/Alpine runtime, or component source changed;
- no missing manual evidence is labeled `PASS`;
- CI context names are unchanged; and
- the worktree contains only the intended commits and no generated artifacts.

- [ ] **Step 6: Commit the final governance hardening**

```bash
rtk git add tools/v1-release/check.mjs tools/v1-release/check.test.mjs docs/superpowers/baselines/lyra-v1/README.md
rtk git diff --cached --check
rtk git commit -m "test: guard v1 overlay specification"
rtk git status --short
```

- [ ] **Step 7: Stop for explicit overlay-spec approval**

Present the draft specification, ledger, validator results, commit list, and exact worktree status. Ask the maintainer to approve or request changes to `docs/superpowers/specs/2026-08-30-overlay-family-design.md`.

Do not write the candidate-evaluation plan, install Radix/Base UI/Zag, push, create a PR, or modify production overlays at this checkpoint.
