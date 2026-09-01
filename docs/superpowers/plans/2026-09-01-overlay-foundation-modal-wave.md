# Overlay Foundation Modal Wave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the exact four-candidate manifest and a candidate-neutral local
evaluation for `OF-MODAL` across the 15 behavioral cells owned by the modal
wave, while preserving the production dependency graph and stopping before any
remote workflow or foundation decision.

**Architecture:** The merged core preflight remains the only authority for
manifest, artifact, installation, audit, license, repository, cleanup, and
immutable-attempt invariants. The modal layer adds repository-authored scenario
records, a copy-and-build fixture boundary, four private adapter entries, and a
Playwright runner that consumes only core-verified artifacts. All browser work
runs in the digest-pinned Playwright container; the tracked manifest binds to
the clean implementation revision immediately before the manifest commit, so
the revision is exact without trying to hash a commit that contains its own
SHA.

**Tech Stack:** Node.js 24.18.0 ESM, pnpm 11.13.1, `node:test`, React 18.3.1,
React 19.2.8, Vite 8.2.1, Playwright 1.62.1, axe-core 4.13.0, the existing
digest-pinned Playwright Noble image, and Prettier 3.9.6.

**Spec:**
[`docs/superpowers/specs/2026-08-31-overlay-foundation-evaluation-design.md`](../specs/2026-08-31-overlay-foundation-evaluation-design.md),
implementing the modal requirements in
[`docs/superpowers/specs/2026-08-30-overlay-family-design.md`](../specs/2026-08-30-overlay-family-design.md).

## Global Constraints

- Candidate IDs remain exactly `incumbent`, `radix`, `base-ui`, and `zag`, in
  that order. This plan executes only `OF-MODAL`; it does not claim the other
  four contracts.
- Modal-wave cells are exactly `chromium`, `firefox`, `webkit`, `react-18`,
  `react-19`, `ssr`, `hydration`, `keyboard-focus`, `axe-light`, `axe-dark`,
  `forced-colors`, `reduced-motion`, `ltr`, `rtl`, and `coarse-pointer`. The
  eight cells `bundle-standalone`, `bundle-composition`, `packed-esm`,
  `packed-cjs`, `packed-types`, `consumer-vite`, `consumer-next`, and
  `consumer-commonjs` remain owned by the decision-evidence plan and MUST NOT
  be written as `PASS`, `FAIL`, or `unavailable` here.
- External artifact identity is immutable:

  | Candidate | Package                     | Version      | Registry tarball                                                              | SHA-256                                                            | License | Repository                               |
  | --------- | --------------------------- | ------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------- | ---------------------------------------- |
  | Radix     | `@radix-ui/react-dialog`    | `1.1.23`     | `https://registry.npmjs.org/@radix-ui/react-dialog/-/react-dialog-1.1.23.tgz` | `fa3f7e8612eecfc7b889266c0a5f640463de7d534cd54c3aac6c644b6a8294d2` | `MIT`   | `https://github.com/radix-ui/primitives` |
  | Base UI   | `@base-ui-components/react` | `1.0.0-rc.0` | `https://registry.npmjs.org/@base-ui-components/react/-/react-1.0.0-rc.0.tgz` | `fd48911d202eb7ae13e7d56888fff503f3e9037c5e4e7991536429fafd7d9931` | `MIT`   | `https://github.com/mui/base-ui`         |
  | Zag       | `@zag-js/dialog`            | `1.43.3`     | `https://registry.npmjs.org/@zag-js/dialog/-/dialog-1.43.3.tgz`               | `637e7e8d214deddd0edc6cf183eb70480b9f862862024129e5e793225b5fc517` | `MIT`   | `https://github.com/chakra-ui/zag`       |
  | Zag       | `@zag-js/react`             | `1.43.3`     | `https://registry.npmjs.org/@zag-js/react/-/react-1.43.3.tgz`                 | `cf435e6fe4857d04aa2037e33dadaf9ec283c3159a95dca3c81023883e7f3f5c` | `MIT`   | `https://github.com/chakra-ui/zag`       |

- The four approved tarballs have already been inspected by the core archive
  reader: package identity and MIT license match, lifecycle hooks are empty,
  and sizes are respectively 14,192, 583,302, 9,015, and 8,311 bytes. Any byte
  or registry metadata change fails closed; the executor does not refresh a
  version or hash automatically.
- `candidates.json` is generated after all modal implementation commits. It
  records that clean pre-manifest commit as both `lyraRevision` and the
  incumbent revision. Local evaluation runs against that revision while the
  manifest remains outside the repository; only the already-evaluated bytes
  are then copied into the repository and committed.
- The root `package.json` dependency sections, `pnpm-lock.yaml`, production
  packages, public exports, `.github/workflows`, and V1 ledger statuses remain
  byte-identical. Candidate packages exist only in owned temporary fixtures.
- Every candidate fixture has its own owned run root, copied verified
  artifacts, package manifest, lockfile, pnpm store, source snapshot, build
  output, and evidence. Installs keep `--ignore-workspace` and
  `--ignore-scripts`; the second install is frozen and offline.
- Scenario definitions and assertions never branch on candidate identity.
  Candidate-specific selectors, attributes, events, parts, and types remain
  inside private adapter modules and diagnostic observations.
- Attempt 1 remains effective forever. A retry creates attempt 2 and cannot
  upgrade the effective result. One candidate failure does not stop independent
  candidates unless core classifies repository, ownership, evidence, or cleanup
  state as run-fatal.
- Browser execution uses
  `mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`.
  No Playwright browser is downloaded or installed on the host. The container
  receives an operator-supplied read-only Node 24.18.0 installation, an
  immutable Git bundle containing the evaluation revision, a writable owned
  work root, and runs pnpm 11.13.1. Candidate code never receives a writable
  bind mount of the host repository.
- This plan produces local diagnostic evidence only. It does not dispatch CI,
  add a remote workflow, deploy, select a winner, accept an ADR, change a
  production component, publish, tag, release, or change a V1 component from
  `specified`/`planned`.

## File map

- `candidates/catalog.mjs` owns the literal external artifact records.
- `scripts/create-modal-manifest.mjs` composes an exact manifest from the
  catalog and a real incumbent characterization.
- `contracts/modal.mjs` owns the 17 candidate-neutral modal scenarios and the
  exact 15-cell coverage assertion.
- `fixtures/modal/protocol.mjs` validates fixture requests and normalized
  observations; `fixtures/modal/runtime.mjs` owns only candidate-neutral
  fixture state and markers.
- `candidates/modal/*.mjs` are private candidate translations. Main candidate
  modules export only the validated path to their modal entry.
- `runner/modal-fixture.mjs` copies source and verified tarballs into owned
  roots, installs exact React cells, and creates client and SSR builds.
- `runner/modal-cells.mjs` maps each modal cell to a pinned browser/context or
  SSR/hydration execution policy.
- `runner/modal.mjs` composes core preflight, fixture preparation, scenarios,
  immutable attempts, repository proof, and cleanup.
- `scripts/modal.mjs` is the strict local entry point. Root scripts expose
  focused unit tests and the explicit diagnostic run without adding it to the
  ordinary root `test` command.

---

### Task 1: Exact artifact catalog and revision-bound manifest generation

**Files:**

- Create: `tools/overlay-foundation-evaluation/candidates/catalog.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/catalog.test.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/create-modal-manifest.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/create-modal-manifest.test.mjs`
- Modify: `tools/overlay-foundation-evaluation/runner/core.mjs`
- Modify: `tools/overlay-foundation-evaluation/runner/core.test.mjs`

**Interfaces:**

- Produces `MODAL_EXTERNAL_ARTIFACTS`,
  `createModalManifest({ lyraRevision, incumbentCharacterization })`, and
  `writeModalManifest({ outputPath, lyraRevision, incumbentPath })`.
- Produces exported `loadValidatedAdapter(candidate, index, repositoryRoot)`
  by exposing the existing core loader without changing its validation.
- Consumed by Tasks 3, 4, 6, and 7.

- [ ] **Step 1: Write literal catalog and manifest tests**

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MODAL_EXTERNAL_ARTIFACTS } from './catalog.mjs';
import { createModalManifest } from '../scripts/create-modal-manifest.mjs';

const revision = '1'.repeat(40);
const incumbentArtifacts = [
  ['@lyra-ds/styles', '0.5.0', '2'.repeat(64)],
  ['@lyra-ds/react', '0.5.0', '3'.repeat(64)],
  ['@lyra-ds/alpine', '0.6.0', '4'.repeat(64)],
].map(([name, version, sha256]) => ({ name, version, sha256 }));

test('pins the operator-approved external artifact identities exactly', () => {
  assert.deepEqual(MODAL_EXTERNAL_ARTIFACTS, {
    radix: [
      {
        source: 'registry',
        name: '@radix-ui/react-dialog',
        version: '1.1.23',
        tarballUrl: 'https://registry.npmjs.org/@radix-ui/react-dialog/-/react-dialog-1.1.23.tgz',
        sha256: 'fa3f7e8612eecfc7b889266c0a5f640463de7d534cd54c3aac6c644b6a8294d2',
        license: 'MIT',
        repositoryUrl: 'https://github.com/radix-ui/primitives',
      },
    ],
    'base-ui': [
      {
        source: 'registry',
        name: '@base-ui-components/react',
        version: '1.0.0-rc.0',
        tarballUrl: 'https://registry.npmjs.org/@base-ui-components/react/-/react-1.0.0-rc.0.tgz',
        sha256: 'fd48911d202eb7ae13e7d56888fff503f3e9037c5e4e7991536429fafd7d9931',
        license: 'MIT',
        repositoryUrl: 'https://github.com/mui/base-ui',
      },
    ],
    zag: [
      {
        source: 'registry',
        name: '@zag-js/dialog',
        version: '1.43.3',
        tarballUrl: 'https://registry.npmjs.org/@zag-js/dialog/-/dialog-1.43.3.tgz',
        sha256: '637e7e8d214deddd0edc6cf183eb70480b9f862862024129e5e793225b5fc517',
        license: 'MIT',
        repositoryUrl: 'https://github.com/chakra-ui/zag',
      },
      {
        source: 'registry',
        name: '@zag-js/react',
        version: '1.43.3',
        tarballUrl: 'https://registry.npmjs.org/@zag-js/react/-/react-1.43.3.tgz',
        sha256: 'cf435e6fe4857d04aa2037e33dadaf9ec283c3159a95dca3c81023883e7f3f5c',
        license: 'MIT',
        repositoryUrl: 'https://github.com/chakra-ui/zag',
      },
    ],
  });
});

test('binds one manifest to the exact incumbent characterization revision', () => {
  const manifest = createModalManifest({
    lyraRevision: revision,
    incumbentCharacterization: {
      schemaVersion: 1,
      candidateId: 'incumbent',
      revision,
      artifacts: incumbentArtifacts,
    },
  });
  assert.equal(manifest.lyraRevision, revision);
  assert.equal(manifest.candidates[0].revision, revision);
  assert.deepEqual(
    manifest.candidates.map(({ id }) => id),
    ['incumbent', 'radix', 'base-ui', 'zag'],
  );
  assert.deepEqual(
    manifest.candidates.map(({ contracts }) => contracts),
    [['OF-MODAL'], ['OF-MODAL'], ['OF-MODAL'], ['OF-MODAL']],
  );
});
```

Add negative tests for a mismatched characterization revision, reordered or
missing incumbent package, invalid incumbent hash, existing output, BOM input,
unknown/duplicate CLI arguments, and a manifest failing
`validateCandidateManifest`.

- [ ] **Step 2: Run the new tests and observe RED**

Run:

```bash
node --test \
  tools/overlay-foundation-evaluation/candidates/catalog.test.mjs \
  tools/overlay-foundation-evaluation/scripts/create-modal-manifest.test.mjs
```

Expected: `ERR_MODULE_NOT_FOUND` for the two new modules.

- [ ] **Step 3: Implement the closed catalog and pure generator**

```js
export const MODAL_EXTERNAL_ARTIFACTS = Object.freeze({
  radix: Object.freeze([
    Object.freeze({
      source: 'registry',
      name: '@radix-ui/react-dialog',
      version: '1.1.23',
      tarballUrl: 'https://registry.npmjs.org/@radix-ui/react-dialog/-/react-dialog-1.1.23.tgz',
      sha256: 'fa3f7e8612eecfc7b889266c0a5f640463de7d534cd54c3aac6c644b6a8294d2',
      license: 'MIT',
      repositoryUrl: 'https://github.com/radix-ui/primitives',
    }),
  ]),
  'base-ui': Object.freeze([
    Object.freeze({
      source: 'registry',
      name: '@base-ui-components/react',
      version: '1.0.0-rc.0',
      tarballUrl: 'https://registry.npmjs.org/@base-ui-components/react/-/react-1.0.0-rc.0.tgz',
      sha256: 'fd48911d202eb7ae13e7d56888fff503f3e9037c5e4e7991536429fafd7d9931',
      license: 'MIT',
      repositoryUrl: 'https://github.com/mui/base-ui',
    }),
  ]),
  zag: Object.freeze([
    Object.freeze({
      source: 'registry',
      name: '@zag-js/dialog',
      version: '1.43.3',
      tarballUrl: 'https://registry.npmjs.org/@zag-js/dialog/-/dialog-1.43.3.tgz',
      sha256: '637e7e8d214deddd0edc6cf183eb70480b9f862862024129e5e793225b5fc517',
      license: 'MIT',
      repositoryUrl: 'https://github.com/chakra-ui/zag',
    }),
    Object.freeze({
      source: 'registry',
      name: '@zag-js/react',
      version: '1.43.3',
      tarballUrl: 'https://registry.npmjs.org/@zag-js/react/-/react-1.43.3.tgz',
      sha256: 'cf435e6fe4857d04aa2037e33dadaf9ec283c3159a95dca3c81023883e7f3f5c',
      license: 'MIT',
      repositoryUrl: 'https://github.com/chakra-ui/zag',
    }),
  ]),
});

export function createModalManifest({ lyraRevision, incumbentCharacterization }) {
  requireMatchingIncumbent(lyraRevision, incumbentCharacterization);
  return {
    schemaVersion: 1,
    lyraRevision,
    toolchain: { node: '24.18.0', pnpm: '11.13.1' },
    candidates: [
      {
        id: 'incumbent',
        adapter: 'candidates/incumbent.mjs',
        contracts: ['OF-MODAL'],
        revision: lyraRevision,
        artifacts: canonicalIncumbentArtifacts(incumbentCharacterization.artifacts),
      },
      ...['radix', 'base-ui', 'zag'].map((id) => ({
        id,
        adapter: `candidates/${id}.mjs`,
        contracts: ['OF-MODAL'],
        artifacts: structuredClone(MODAL_EXTERNAL_ARTIFACTS[id]),
      })),
    ],
  };
}
```

The writer validates with the real expected toolchain, writes one canonical
JSON file with `wx`, and re-reads it before success.

- [ ] **Step 4: Export the existing safe adapter loader**

Rename the internal `loadAdapter` to
`export async function loadValidatedAdapter(...)` and update core to call that
export. Add a mutation test proving that bypassing `realpath` containment lets
an escaping symlink through and fails the test.

- [ ] **Step 5: Run focused and core regressions**

```bash
node --test \
  tools/overlay-foundation-evaluation/candidates/catalog.test.mjs \
  tools/overlay-foundation-evaluation/scripts/create-modal-manifest.test.mjs \
  tools/overlay-foundation-evaluation/runner/core.test.mjs
```

Expected: all tests pass.

- [ ] **Step 6: Commit the catalog boundary**

```bash
git add tools/overlay-foundation-evaluation/candidates/catalog.mjs \
  tools/overlay-foundation-evaluation/candidates/catalog.test.mjs \
  tools/overlay-foundation-evaluation/scripts/create-modal-manifest.mjs \
  tools/overlay-foundation-evaluation/scripts/create-modal-manifest.test.mjs \
  tools/overlay-foundation-evaluation/runner/core.mjs \
  tools/overlay-foundation-evaluation/runner/core.test.mjs
git commit -m "feat: pin modal evaluation artifacts"
```

---

### Task 2: Candidate-neutral modal scenarios and exact cell coverage

**Files:**

- Create: `tools/overlay-foundation-evaluation/contracts/modal.mjs`
- Create: `tools/overlay-foundation-evaluation/contracts/modal.test.mjs`

**Interfaces:**

- Produces `MODAL_WAVE_CELLS`, `MODAL_SCENARIOS`,
  `modalScenariosForCell(cellId)`, and `validateModalCoverage(scenarios)`.
- Consumed by Tasks 3 and 6.

The immutable scenario inventory is:

| Scenario ID                                | Required cells                                | Observable outcome                                                                                                   |
| ------------------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `of-modal.semantics-isolation.v1`          | three browsers, axe light/dark, forced colors | named active dialog, `aria-modal=true`, background inert and absent from the accessibility branch                    |
| `of-modal.declared-initial-focus.v1`       | three browsers, keyboard-focus, ltr, rtl      | safe declared target receives focus; invalid target falls through                                                    |
| `of-modal.validation-initial-focus.v1`     | three browsers, keyboard-focus                | first invalid enabled field or focusable summary wins                                                                |
| `of-modal.destructive-initial-focus.v1`    | three browsers, keyboard-focus                | least destructive action wins over destructive and declared actions                                                  |
| `of-modal.no-tabbables-panel-fallback.v1`  | three browsers, keyboard-focus                | named panel receives focus with `tabindex=-1`                                                                        |
| `of-modal.focus-wrap-dynamic.v1`           | three browsers, keyboard-focus                | Tab/Shift+Tab wrap and dynamic hidden/disabled/removed targets are excluded                                          |
| `of-modal.focused-node-removal.v1`         | three browsers, keyboard-focus                | nearest safe target, then panel, receives focus without background escape                                            |
| `of-modal.nested-topmost.v1`               | three browsers, keyboard-focus, ltr, rtl      | child owns Escape, focus, inert branch, scroll claim, then restores inside parent                                    |
| `of-modal.pointer-origin-dismiss.v1`       | three browsers, coarse-pointer                | only complete outside down/up dismisses; drag, cancel, context menu, child interaction, and prevented default do not |
| `of-modal.controlled-close-commit.v1`      | three browsers, react-18, react-19            | close request fires once and layer stays logical-open until controlled commit                                        |
| `of-modal.scroll-lock-reference-count.v1`  | three browsers, coarse-pointer                | one claim per modal, no layout/page-position shift, final release resumes page scroll                                |
| `of-modal.exit-inactive-reopen.v1`         | three browsers, reduced-motion                | committed close immediately releases semantics/resources; reopen creates exactly one owner                           |
| `of-modal.opener-restoration-successor.v1` | three browsers, keyboard-focus                | connected meaningful opener wins; otherwise documented successor/region wins, never body                             |
| `of-modal.parent-close-with-child.v1`      | three browsers, keyboard-focus                | one explicit parent operation closes/transfers child and leaves no orphan portal                                     |
| `of-modal.unmount-cleanup.v1`              | three browsers, reduced-motion                | entry/open/exit destroy releases listeners, inert, scroll, timers, guards, and portal once                           |
| `of-modal.ssr-open-semantics.v1`           | ssr                                           | open content is named and semantically available without browser globals                                             |
| `of-modal.hydration-stability.v1`          | react-18, react-19, hydration                 | identical first tree/IDs/state, no warning, recovery, lost input, duplicate event, or focus move                     |

- [ ] **Step 1: Write coverage and neutrality tests**

```js
test('owns exactly the fifteen behavioral modal cells', () => {
  assert.deepEqual(MODAL_WAVE_CELLS, [
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
  ]);
});

test('covers every modal cell and only OF-MODAL with immutable v1 IDs', () => {
  assert.deepEqual(validateModalCoverage(MODAL_SCENARIOS), []);
  for (const scenario of MODAL_SCENARIOS) {
    assert.equal(scenario.contractId, 'OF-MODAL');
    assert.match(scenario.scenarioId, /^of-modal\.[a-z0-9-]+\.v1$/u);
    assert.deepEqual(validateScenario(scenario), []);
  }
  assert.deepEqual(
    new Set(MODAL_SCENARIOS.flatMap(({ requiredCells }) => requiredCells)),
    new Set(MODAL_WAVE_CELLS),
  );
});
```

For every row above, add one test that mutates the required expected focus,
role, relationship, state, event, announcement, or cleanup item and proves
`validateModalCoverage` rejects the omission. Add a mutation test that inserts
`radix`, `base-ui`, `zag`, `incumbent`, a vendor selector, or a vendor event in
each JSON-bearing scenario path and proves `validateScenario` rejects it.

- [ ] **Step 2: Run the tests and observe RED**

```bash
node --test tools/overlay-foundation-evaluation/contracts/modal.test.mjs
```

Expected: `ERR_MODULE_NOT_FOUND` for `modal.mjs`.

- [ ] **Step 3: Implement the exact scenario records**

Use a closed factory that still returns ordinary frozen scenario records:

```js
function modalScenario({ id, operations, expected, cells, state = {} }) {
  return Object.freeze({
    schemaVersion: 1,
    revision: 1,
    contractId: 'OF-MODAL',
    scenarioId: `of-modal.${id}.v1`,
    components: ['Dialog', 'Drawer', 'BottomSheet', 'CommandPalette', 'CreateWorkspaceDialog'],
    initial: {
      markup: '<button data-fixture-control="opener">Open</button>',
      state,
    },
    operations,
    expected,
    requiredCells: cells,
    capture: ['dom', 'accessibility-tree', 'events', 'focus', 'resources'],
  });
}
```

Each row's record MUST explicitly list its ordered operations and expected
roles, relationships, states, focus, events, announcements, and cleanup; do not
derive expected results from observed output. `validateModalCoverage` checks
the exact scenario ID set, exact cell set, unique IDs, all records through
`validateScenario`, and at least one scenario per cell.

- [ ] **Step 4: Run focused tests and mutation proof**

Temporarily remove `coarse-pointer` from the pointer scenario. The coverage
test must fail. Restore and rerun:

```bash
node --test \
  tools/overlay-foundation-evaluation/contracts/protocol.test.mjs \
  tools/overlay-foundation-evaluation/contracts/modal.test.mjs
```

- [ ] **Step 5: Commit scenarios**

```bash
git add tools/overlay-foundation-evaluation/contracts/modal.mjs \
  tools/overlay-foundation-evaluation/contracts/modal.test.mjs
git commit -m "feat: define modal evaluation scenarios"
```

---

### Task 3: Fixture protocol, source snapshot, and adapter entry containment

**Files:**

- Create: `tools/overlay-foundation-evaluation/fixtures/modal/protocol.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/modal/protocol.test.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/modal/runtime.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/modal/runtime.test.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/adapter-entry.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/adapter-entry.test.mjs`

**Interfaces:**

- Produces `validateModalFixtureRequest`, `validateModalObservation`,
  `createModalRuntime`, and
  `resolveContractEntry({ adapterModule, adapterPath, contractId, repositoryRoot })`.
- A fixture request is exactly `{ schemaVersion: 1, scenario, cell: { id,
reactVersion, direction, colorScheme, forcedColors, reducedMotion,
coarsePointer } }`.
- A normalized observation is exactly `{ roles, relationships, states, focus,
events, announcements, cleanup, diagnostics }` where diagnostics alone may
  contain vendor facts.

- [ ] **Step 1: Write closed-schema and lifecycle tests**

```js
test('accepts one complete neutral request and observation', () => {
  assert.deepEqual(validateModalFixtureRequest(validRequest), []);
  assert.deepEqual(validateModalObservation(validObservation), []);
});

for (const key of ['candidateId', 'vendorSelector', 'implementation']) {
  test(`rejects fixture request coupling ${key}`, () => {
    assert.match(
      validateModalFixtureRequest({ ...validRequest, [key]: 'radix' }).join('\n'),
      /unsupported|coupling/u,
    );
  });
}

test('runtime exposes only the eight Lyra-owned fixture operations', () => {
  const runtime = createModalRuntime(validRequest);
  assert.deepEqual(Object.keys(runtime.operations), [
    'open',
    'close',
    'press',
    'point',
    'setDirection',
    'setMotionPreference',
    'updateContent',
    'destroy',
  ]);
});
```

Test that destroy is idempotent, stale callbacks cannot append events, one
accepted action emits once, prevented actions leave every state/resource field
unchanged, and diagnostic vendor values cannot enter normative observation
fields.

- [ ] **Step 2: Write adapter-entry containment tests**

The main adapter module exports a relative string named `modalAdapterPath`.
Tests accept only `candidates/modal/<candidate-id>.mjs`, reject missing/absolute/
parent paths, reject a symlink escaping `candidates/modal`, reject a directory,
and accept an internal symlink only after `realpath` containment.

- [ ] **Step 3: Run all three files and observe RED**

```bash
node --test \
  tools/overlay-foundation-evaluation/fixtures/modal/protocol.test.mjs \
  tools/overlay-foundation-evaluation/fixtures/modal/runtime.test.mjs \
  tools/overlay-foundation-evaluation/runner/adapter-entry.test.mjs
```

- [ ] **Step 4: Implement the minimal neutral runtime and safe resolver**

```js
export function createModalRuntime(request) {
  const requestErrors = validateModalFixtureRequest(request);
  if (requestErrors.length !== 0) throw new Error(requestErrors.join('\n'));
  let destroyed = false;
  const events = [];
  const resources = new Set();
  const commit = (event) => {
    if (destroyed) return false;
    events.push(structuredClone(event));
    return true;
  };
  return Object.freeze({
    operations: Object.freeze(
      createOperations({ commit, resources, isDestroyed: () => destroyed }),
    ),
    observe: () => snapshotObservation({ events, resources, destroyed }),
    destroy: () => {
      destroyed = true;
      resources.clear();
    },
  });
}
```

`resolveContractEntry` realpaths the main adapter, candidates directory, and
modal entry; it requires a regular file strictly beneath `candidates/modal`
and exact basename `<candidate-id>.mjs`.

- [ ] **Step 5: Mutation and GREEN**

Temporarily replace the entry `realpath` containment with lexical `resolve`.
The escaping-symlink test must fail. Restore and run the three focused files
green.

- [ ] **Step 6: Commit the fixture boundary**

```bash
git add tools/overlay-foundation-evaluation/fixtures/modal \
  tools/overlay-foundation-evaluation/runner/adapter-entry.mjs \
  tools/overlay-foundation-evaluation/runner/adapter-entry.test.mjs
git commit -m "feat: add neutral modal fixture protocol"
```

---

### Task 4: Four private modal candidate adapters

**Files:**

- Modify: `tools/overlay-foundation-evaluation/candidates/incumbent.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/radix.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/base-ui.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/zag.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/modal/incumbent.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/modal/radix.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/modal/base-ui.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/modal/zag.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/modal/adapters.test.mjs`

**Interfaces:**

- Every external main module exports `adapterDescriptor` and exact
  `modalAdapterPath`. The incumbent keeps `incumbentDescriptor` unchanged and
  additionally exports the modal-only `adapterDescriptor` plus
  `modalAdapterPath`.
- Every modal module exports
  `createModalCandidate({ React, importModule }) -> Promise<{ ModalFixture }>`.
  The default importer is `(specifier) => import(specifier)`; tests inject fake
  vendor modules, so root dependencies remain unchanged.

- [ ] **Step 1: Write adapter surface tests with fake vendor modules**

```js
for (const candidate of ['incumbent', 'radix', 'base-ui', 'zag']) {
  test(`${candidate} exposes one private OF-MODAL entry`, async () => {
    const main = await import(`../${candidate}.mjs`);
    assert.equal(main.adapterDescriptor.candidateId, candidate);
    assert.deepEqual(main.adapterDescriptor.supportedContractIds, ['OF-MODAL']);
    assert.equal(main.modalAdapterPath, `candidates/modal/${candidate}.mjs`);
    if (candidate === 'incumbent') {
      assert.deepEqual(main.incumbentDescriptor.supportedContractIds, CONTRACT_IDS);
    }
  });
}
```

For each modal adapter, render with a fake React element factory and injected
fake vendor primitives. Assert the normalized trigger/panel/title/description/
initial-target/ordinary/destructive/close/backdrop markers, controlled-open
callback, nesting hook, and teardown hook. Assert vendor package names and
private props remain below `diagnostics` and never appear in roles,
relationships, states, events, or public fixture markers.

- [ ] **Step 2: Run the adapter test and observe RED**

```bash
node --test tools/overlay-foundation-evaluation/candidates/modal/adapters.test.mjs
```

- [ ] **Step 3: Implement main descriptors without eager vendor imports**

```js
export const adapterDescriptor = Object.freeze({
  candidateId: 'radix',
  supportedContractIds: Object.freeze(['OF-MODAL']),
});
export const modalAdapterPath = 'candidates/modal/radix.mjs';
```

Use corresponding exact candidate IDs for the other three. The incumbent keeps
its characterization exports and five-contract `incumbentDescriptor`
unchanged; its additional `adapterDescriptor` claims only `OF-MODAL`, matching
the tracked manifest in this wave.

- [ ] **Step 4: Implement private translations**

- Incumbent dynamically imports `@lyra-ds/react/dialog` and maps the existing
  controlled `Dialog` API.
- Radix dynamically imports `@radix-ui/react-dialog` and composes Root, Portal,
  Overlay, Content, Title, Description, and Close.
- Base UI dynamically imports `@base-ui-components/react/dialog` and composes
  Root, Portal, Backdrop, Popup, Title, Description, and Close.
- Zag dynamically imports both `@zag-js/dialog` and `@zag-js/react`, creates a
  machine with a deterministic fixture ID, connects it through `useMachine`,
  and maps trigger/backdrop/positioner/content/title/description/close props.

Each adapter delegates generic fixture state, markers, content, and event
capture to `fixtures/modal/runtime.mjs`; it contains only candidate translation.
No adapter imports another adapter.

- [ ] **Step 5: GREEN and mutation proof**

Run adapter, manifest, and core tests. Then temporarily eager-import the Radix
package at module top level. The test that imports the main adapter without a
candidate installation must fail. Restore and rerun green.

- [ ] **Step 6: Commit adapters**

```bash
git add tools/overlay-foundation-evaluation/candidates
git commit -m "feat: add modal candidate adapters"
```

---

### Task 5: Isolated React, client, SSR, and hydration fixtures

**Files:**

- Modify: `tools/overlay-foundation-evaluation/runner/isolation.mjs`
- Modify: `tools/overlay-foundation-evaluation/runner/isolation.test.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/modal-fixture.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/modal-fixture.test.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/modal/entry-client.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/modal/entry-server.mjs`
- Create: `tools/overlay-foundation-evaluation/fixtures/modal/index.html`

**Interfaces:**

- Extends `installExternalCandidate` with optional
  `fixtureDependencies: Record<string, exactVersion>`; omitted input preserves
  byte-for-byte core behavior.
- Produces `prepareModalFixture({ candidate, artifacts, adapterEntry,
reactVersion, runRoot, repositoryRoot, runCommand })` returning exact client/
  SSR paths, source hashes, lock/audit/license evidence, and owned cleanup data.

- [ ] **Step 1: Write isolation REDs for framework dependencies**

Test exact `react: 18.3.1` plus `react-dom: 18.3.1`, and separately `19.2.8`.
Reject ranges, tags, workspace/file/link protocols, duplicate direct artifact
names, and unknown dependency keys. Prove the generated lock contains the
requested React pair, the second install is frozen/offline, lifecycle scripts
remain disabled, and the repository lock/status stay byte-identical.

- [ ] **Step 2: Write modal fixture REDs**

Tests use synthetic candidate tarballs and a fake command runner to prove:

- every source file is a regular file, read once, SHA-256 recorded, copied with
  `wx`, and verified after copy;
- adapter/source symlink, replacement, missing source, or post-copy change fails
  before build;
- Vite client and SSR commands receive exact roots and deterministic defines;
- no build output, store, or source snapshot escapes the owned run root;
- client and SSR outputs are present and hashed before success; and
- primary plus cleanup failure is an `AggregateError` preserving order.

- [ ] **Step 3: Run RED**

```bash
node --test \
  tools/overlay-foundation-evaluation/runner/isolation.test.mjs \
  tools/overlay-foundation-evaluation/runner/modal-fixture.test.mjs
```

- [ ] **Step 4: Implement exact dependency extension**

```js
function validateFixtureDependencies(value = {}) {
  if (!isPlainRecord(value)) throw new Error('fixtureDependencies must be a plain record');
  const allowed = new Set(['react', 'react-dom']);
  for (const [name, version] of Object.entries(value)) {
    if (!allowed.has(name)) throw new Error(`unsupported fixture dependency ${name}`);
    if (!/^\d+\.\d+\.\d+$/u.test(version)) {
      throw new Error(`fixture dependency ${name} must be an exact version`);
    }
  }
  if (value.react !== value['react-dom']) {
    throw new Error('react and react-dom fixture versions must match');
  }
  return value;
}
```

Merge the validated pair into the generated private fixture manifest after the
artifact `file:` entries. Preserve all existing install/evidence/audit/license
checks.

- [ ] **Step 5: Implement verified source snapshot and builds**

Copy only the selected private adapter plus `protocol.mjs`, `runtime.mjs`,
`entry-client.mjs`, `entry-server.mjs`, and `index.html`. Build client with Vite
8.2.1 from the repository toolchain and build SSR with `build.ssr` against the
candidate fixture root. Defines contain only canonical JSON for the validated
request; no candidate value enters scenario expectations.

- [ ] **Step 6: Mutation proofs and GREEN**

Remove `--ignore-scripts`, permit a ranged React version, and skip post-copy
SHA verification one mutation at a time. Each corresponding test must fail.
Restore and run both files green.

- [ ] **Step 7: Commit fixture preparation**

```bash
git add tools/overlay-foundation-evaluation/runner/isolation.mjs \
  tools/overlay-foundation-evaluation/runner/isolation.test.mjs \
  tools/overlay-foundation-evaluation/runner/modal-fixture.mjs \
  tools/overlay-foundation-evaluation/runner/modal-fixture.test.mjs \
  tools/overlay-foundation-evaluation/fixtures/modal
git commit -m "feat: prepare isolated modal fixtures"
```

---

### Task 6: Modal cells, immutable attempts, and strict local runner

**Files:**

- Create: `tools/overlay-foundation-evaluation/runner/modal-cells.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/modal-cells.test.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/modal.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/modal.test.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/modal.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/modal.test.mjs`
- Create: `tools/overlay-foundation-evaluation/compose.modal.yml`

**Interfaces:**

- Produces `MODAL_CELL_POLICIES`, `runModalCell`, and
  `runModalWave({ manifest, repositoryRoot, tmpdir, evidenceRoot, playwright,
fetchImpl, runCommand })`.
- The CLI accepts exactly `--manifest`, `--repository`, and `--evidence`, each
  followed by an absolute path; the repository path must resolve to the clean
  revision recorded in the manifest.
- Result is a factual summary with per-candidate PASS/FAIL/unavailable counts;
  it has no score, winner, recommendation, or automatic selection.

- [ ] **Step 1: Write exact cell policy tests**

```js
test('maps every modal cell once without owning decision-evidence cells', () => {
  assert.deepEqual(Object.keys(MODAL_CELL_POLICIES), MODAL_WAVE_CELLS);
  for (const forbidden of [
    'bundle-standalone',
    'bundle-composition',
    'packed-esm',
    'packed-cjs',
    'packed-types',
    'consumer-vite',
    'consumer-next',
    'consumer-commonjs',
  ])
    assert.equal(MODAL_CELL_POLICIES[forbidden], undefined);
});
```

Policies are exact: Chromium/Firefox/WebKit use their named engines; React 18
and 19 use Chromium with their exact fixture versions; SSR uses the SSR output
without launching a browser; hydration uses both React versions; keyboard and
axe use Chromium; forced colors uses `forcedColors: 'active'`; reduced motion
uses `reducedMotion: 'reduce'`; LTR/RTL use `dir`; coarse pointer uses a
touch-enabled Chromium context without synthesizing hover.

- [ ] **Step 2: Write runner REDs with fake Playwright and real evidence files**

Cover:

- core preflight runs before any scenario and a failed candidate becomes
  scenario `unavailable` records without blocking independent candidates;
- every required scenario/cell writes attempt 1 exactly once;
- candidate-local product failure continues later scenarios and candidates;
- unknown observation/classification, repository drift, evidence failure,
  ownership failure, or cleanup uncertainty is run-fatal;
- a retry writes attempt 2 and summary keeps attempt 1 effective;
- SSR and hydration failures are distinct records;
- browser/page/context/server/fixture cleanup all run after primary failure;
- no result exists for any of the eight decision-evidence cells; and
- summary cannot contain `winner`, `score`, `selected`, or `recommendation`.

- [ ] **Step 3: Write strict CLI and compose policy REDs**

Reject relative paths, missing/duplicate/unknown arguments, dirty or wrong
revision repositories, manifest revision mismatch, BOM/malformed JSON, and an
existing conflicting evidence attempt. Importing the CLI must not import
Playwright. The compose test requires the exact image digest, `init: true`,
`ipc: host`, UID/GID, read-only Node and input mounts, an explicit owned work
mount, and no browser install command.

- [ ] **Step 4: Run RED**

```bash
node --test \
  tools/overlay-foundation-evaluation/runner/modal-cells.test.mjs \
  tools/overlay-foundation-evaluation/runner/modal.test.mjs \
  tools/overlay-foundation-evaluation/scripts/modal.test.mjs
```

- [ ] **Step 5: Implement candidate-neutral execution**

For each candidate, read core attempt 1 from the evidence root. On preflight
PASS, use only its preserved artifact paths and hashes to prepare fixtures.
Execute `modalScenariosForCell(cellId)` and compare normalized observations to
the record's immutable `expected`; candidate identity is never an assertion
input. Write scenario attempts through existing `writeAttempt`, verify every
artifact path again after cleanup, then return the factual summary.

- [ ] **Step 6: Implement the lazy CLI and pinned compose service**

The CLI validates paths, manifest, revision, and clean status before lazily
importing `playwright`. Before compose, the operator creates the immutable
bundle with:

```bash
git bundle create "$manifest_tmp/repository.bundle" HEAD
test "$(git bundle list-heads "$manifest_tmp/repository.bundle" | awk '$2 == "HEAD" { print $1 }')" = "$evaluation_revision"
```

`compose.modal.yml` mounts that bundle and the external manifest under `/input`
read-only, evidence at `/evidence`, an owned host directory under `/work`, and
operator-provided Node 24.18.0 at `/opt/node` read-only. It runs:

```sh
export PATH="/opt/node/bin:/tmp/corepack-shims:$PATH"
corepack enable --install-directory /tmp/corepack-shims
git clone --no-hardlinks /input/repository.bundle /work/repository
git -C /work/repository checkout --detach "$OVERLAY_EVALUATION_REVISION"
test "$(git -C /work/repository rev-parse HEAD)" = "$OVERLAY_EVALUATION_REVISION"
cd /work/repository
corepack pnpm@11.13.1 install --frozen-lockfile
corepack pnpm@11.13.1 overlay:evaluate:modal \
  --manifest /input/candidates.json \
  --repository /work/repository \
  --evidence /evidence
```

The YAML contains no `playwright install`, browser download, npm publication,
write to a host repository, or network target other than package/artifact
acquisition performed by the runner.

- [ ] **Step 7: Mutation proofs and GREEN**

Mutate scenario dispatch to skip WebKit, make attempt 2 effective, branch an
assertion on `candidate.id`, and change the image to an unpinned tag. Each
mutation must fail a named test. Restore and run all Task 6 tests green.

- [ ] **Step 8: Commit local execution**

```bash
git add tools/overlay-foundation-evaluation/runner/modal-cells.mjs \
  tools/overlay-foundation-evaluation/runner/modal-cells.test.mjs \
  tools/overlay-foundation-evaluation/runner/modal.mjs \
  tools/overlay-foundation-evaluation/runner/modal.test.mjs \
  tools/overlay-foundation-evaluation/scripts/modal.mjs \
  tools/overlay-foundation-evaluation/scripts/modal.test.mjs \
  tools/overlay-foundation-evaluation/compose.modal.yml
git commit -m "feat: run local modal evaluation"
```

---

### Task 7: Root wiring, exact manifest, local diagnostic evidence, and checkpoint

**Files:**

- Create after the evaluation revision is committed:
  `tools/overlay-foundation-evaluation/candidates.json`
- Modify: `package.json`
- Modify: `tools/overlay-foundation-evaluation/README.md`
- Modify: `docs/superpowers/baselines/lyra-v1/README.md`
- Modify: `tools/overlay-foundation-evaluation/repository-policy.test.mjs`
- Verify unchanged: `pnpm-lock.yaml`, `packages/`, `.github/workflows/`, and
  `docs/superpowers/baselines/lyra-v1/program.json`

**Interfaces:**

- Produces root scripts:
  `overlay:evaluate:modal:test`, `overlay:evaluate:modal:manifest`, and
  `overlay:evaluate:modal`.
- Produces a tracked canonical manifest whose revision is the exact clean
  implementation commit preceding the manifest/wiring commit.
- Does not add the diagnostic runner to ordinary root tests or CI.

- [ ] **Step 1: Extend repository policy tests and observe RED**

Assert exact scripts:

```json
{
  "overlay:evaluate:modal:test": "node --test tools/overlay-foundation-evaluation/contracts/modal.test.mjs tools/overlay-foundation-evaluation/fixtures/modal/*.test.mjs tools/overlay-foundation-evaluation/candidates/modal/*.test.mjs tools/overlay-foundation-evaluation/runner/modal*.test.mjs tools/overlay-foundation-evaluation/scripts/create-modal-manifest.test.mjs tools/overlay-foundation-evaluation/scripts/modal.test.mjs",
  "overlay:evaluate:modal:manifest": "node tools/overlay-foundation-evaluation/scripts/create-modal-manifest.mjs",
  "overlay:evaluate:modal": "node tools/overlay-foundation-evaluation/scripts/modal.mjs"
}
```

Assert ordinary `test` still contains core tests but not the live modal command;
root dependencies/lock/workflows/packages are unchanged; the tracked manifest
contains the four exact catalog records; ledger statuses remain
`specified`/`planned`; and no output summary can name a selected foundation.

- [ ] **Step 2: Add scripts and documentation**

Document the 15 cells, exact artifact table, pre-manifest revision binding,
external manifest/evidence directories, pinned-container command, first-attempt
rule, local-diagnostic status, and later ownership of eight decision-evidence
cells. State explicitly that the manifest does not authorize production use.

- [ ] **Step 3: Commit all implementation before creating the manifest**

Run focused tests, Prettier, `node --check`, and `git diff --check`, then commit
the root scripts, README changes, and policy tests:

```bash
git add package.json tools/overlay-foundation-evaluation/README.md \
  tools/overlay-foundation-evaluation/repository-policy.test.mjs \
  docs/superpowers/baselines/lyra-v1/README.md
git commit -m "test: gate modal evaluation locally"
```

Record `evaluation_revision=$(git rev-parse HEAD)` and require a clean status.

- [ ] **Step 4: Generate the manifest outside the repository**

Create the external roots, capture the clean revision, run the incumbent
characterizer against it, and create a clonable bundle whose advertised `HEAD`
is exactly that revision:

```bash
modal_run_root=$(mktemp -d -p /home/francisross/tmp-builds lyra-modal-wave.XXXXXX)
manifest_tmp="$modal_run_root/input"
work_tmp="$modal_run_root/work"
evidence_tmp="$modal_run_root/evidence"
mkdir -m 0700 "$manifest_tmp" "$work_tmp" "$evidence_tmp"
evaluation_revision=$(git rev-parse HEAD)
test -z "$(git status --porcelain=v1)"
git bundle create "$manifest_tmp/repository.bundle" HEAD
test "$(git bundle list-heads "$manifest_tmp/repository.bundle" | awk '$2 == "HEAD" { print $1 }')" = "$evaluation_revision"
pnpm overlay:evaluate:modal:manifest \
  --revision "$evaluation_revision" \
  --incumbent "$manifest_tmp/incumbent.json" \
  --output "$manifest_tmp/candidates.json"
pnpm overlay:evaluate:check \
  --manifest "$manifest_tmp/candidates.json"
```

Verify the manifest full SHA, all four candidate IDs, exact external hashes,
exact three incumbent artifact records, and that a clone from the bundle checks
out the same full SHA. The repository remains clean.

- [ ] **Step 5: Run the local pinned-container diagnostic**

Run the service with the exact host Node installation and the owned paths from
Step 4:

```bash
NODE_24_18_0_ROOT=/home/francisross/.local/share/mise/installs/node/24.18.0 \
OVERLAY_EVALUATION_REVISION="$evaluation_revision" \
OVERLAY_INPUT_ROOT="$manifest_tmp" \
OVERLAY_WORK_ROOT="$work_tmp" \
OVERLAY_EVIDENCE_ROOT="$evidence_tmp" \
HOST_UID="$(id -u)" \
HOST_GID="$(id -g)" \
docker compose \
  -f tools/overlay-foundation-evaluation/compose.modal.yml \
  run --rm modal
```

Do not download a host browser. Preserve this command, its exit code,
per-candidate result counts, attempt hashes, and any candidate failures in the
task report. Candidate failures are legitimate evaluation output; harness,
policy, ownership, evidence, or cleanup failures must be fixed before
continuing. After evidence verification, remove only the owned `work_tmp`;
preserve the manifest, bundle, and evidence through the decision-evidence
plan.

- [ ] **Step 6: Track only the already-evaluated manifest bytes**

Copy `$manifest_tmp/candidates.json` to
`tools/overlay-foundation-evaluation/candidates.json`, verify byte equality and
its SHA-256, then commit:

```bash
git add tools/overlay-foundation-evaluation/candidates.json
git commit -m "docs: pin modal evaluation manifest"
```

The new HEAD differs from `evaluation_revision` by design; the manifest and
evidence continue to name the evaluated pre-manifest revision.

- [ ] **Step 7: Run final repository gates**

Under exact Node 24.18.0 and pnpm 11.13.1:

```bash
pnpm overlay:evaluate:core:test
pnpm overlay:evaluate:modal:test
pnpm overlay:evaluate:check \
  --manifest tools/overlay-foundation-evaluation/candidates.json
pnpm v1-release:check
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
pnpm pack-smoke
git diff --check origin/main...HEAD
```

Use a unique per-command `TMPDIR` under `/home/francisross/tmp-builds` for
heavy commands. Playwright executes only through Docker.

- [ ] **Step 8: Prove scope and immutability**

```bash
git diff --exit-code origin/main...HEAD -- pnpm-lock.yaml packages .github/workflows
node -e "const p=require('./docs/superpowers/baselines/lyra-v1/program.json'); const ids=new Set(['dialog','drawer','bottom-sheet','popover','dropdown','tooltip','command-palette','workspace-switcher','create-workspace-dialog']); if(p.components.filter(c=>ids.has(c.id)).some(c=>!['specified','planned'].includes(c.implementationStatus))) process.exit(1)"
git status --short
```

Expected: immutable paths have no diff and the tracked worktree is clean.

- [ ] **Step 9: Self-review and stop**

Confirm: all 17 scenarios and 15 cells are represented; all four candidates use
the same records/assertions; no early winner or score exists; all external and
incumbent bytes are exact; attempt 1 remains effective; production/runtime/
lock/workflows/ledger are unchanged; container browsers are pinned; and local
evidence is explicitly non-authoritative.

Request separate approval before pushing the implementation branch, opening or
merging its PR, adding a remote evaluation workflow, starting the anchored
wave, accepting an ADR, selecting a foundation, or changing production.
