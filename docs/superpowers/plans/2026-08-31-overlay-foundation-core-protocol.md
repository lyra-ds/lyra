# Overlay Foundation Core Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the dependency-free, fail-closed core that validates future
overlay candidate manifests, verifies exact artifacts, installs candidates in
owned temporary roots with lifecycle scripts disabled, preserves immutable
attempt evidence, and characterizes the incumbent Lyra packages without adding
an external candidate to the repository.

**Architecture:** Repository-owned modules under
`tools/overlay-foundation-evaluation/` expose small validation, acquisition,
isolation, evidence, and candidate-description interfaces. The first plan uses
synthetic local artifacts for executable security proofs and the current Lyra
packages for incumbent characterization; it intentionally does not add the
tracked four-candidate manifest or run vendor code. Strict scripts expose
validation and incumbent characterization while the full runner remains
unusable against external candidates until the separately approved manifest is
added by the modal-wave plan.

**Tech Stack:** Node.js 24.18.0 ESM, pnpm 11.13.1, `node:test`, built-in
`fetch`, `crypto`, and `fs`, system `tar`, existing Lyra package build/pack
commands, Prettier.

**Spec:**
[`docs/superpowers/specs/2026-08-31-overlay-foundation-evaluation-design.md`](../specs/2026-08-31-overlay-foundation-evaluation-design.md)

## Global Constraints

- Candidate IDs are exactly `incumbent`, `radix`, `base-ui`, and `zag`.
- Contract IDs are exactly `OF-MODAL`, `OF-ANCHORED`, `OF-MENU`,
  `OF-TOOLTIP`, and `OF-COMPOSED`.
- Exact external versions, registry tarball URLs, SHA-256 values, license
  identifiers, repository URLs, adapter paths, and applicable contracts are
  mandatory; ranges, tags, credentials, query strings, and fragments fail
  closed.
- The tracked production `package.json` dependencies and `pnpm-lock.yaml` must
  remain byte-identical; no real Radix, Base UI, or Zag manifest or artifact is
  added in this plan.
- Every install uses a unique child of the command-scoped `TMPDIR`, its own
  manifest, lockfile, and store, plus `--ignore-workspace` and
  `--ignore-scripts`.
- External archive lifecycle hooks `preinstall`, `install`, `postinstall`, and
  `prepare` fail preflight even though installation scripts are disabled.
- High or critical audit findings, absent or mismatched licenses, mismatched
  checksums, unsupported adapter contracts, repository mutation, and unknown
  result classifications fail closed before scenario execution.
- Scenario definitions never branch on candidate identity; vendor selectors,
  attributes, parts, events, and types are diagnostic only.
- Result is exactly `PASS`, `FAIL`, or `unavailable`; classification is exactly
  `product`, `fixture`, `infrastructure`, `security`, `packaging`,
  `measurement`, or `policy`.
- Attempt 1 is immutable and remains the effective result. A retry writes a
  separate immutable record and cannot upgrade the effective result.
- Cleanup may recursively remove only an owned, marker-verified run root
  created by the current process; evidence output is never inside that root.
- This plan does not add a browser workflow, run a remote workflow, dispatch
  CI, deploy, publish, tag, release, change production components, or mark a V1
  ledger entry `implementing` or `qualified`.
- Adding `candidates.json` with exact Radix, Base UI, and Zag artifacts is a
  separate explicit operator checkpoint after this plan is reviewed.

## File map

- `tools/overlay-foundation-evaluation/contracts/protocol.mjs` owns constants,
  scenario records, fixture-operation records, and validation.
- `tools/overlay-foundation-evaluation/runner/manifest.mjs` owns prospective
  four-candidate manifest validation and adapter-descriptor comparison.
- `tools/overlay-foundation-evaluation/runner/artifacts.mjs` owns bounded
  acquisition, SHA-256 verification, package-manifest extraction, lifecycle
  rejection, and license verification.
- `tools/overlay-foundation-evaluation/runner/isolation.mjs` owns temporary-root
  creation, candidate fixture installation, lock/list/audit capture, repository
  mutation proof, and guarded cleanup.
- `tools/overlay-foundation-evaluation/evidence/results.mjs` owns canonical
  core-result validation and immutable attempt files.
- `tools/overlay-foundation-evaluation/candidates/incumbent.mjs` owns the
  incumbent descriptor and exact packed-artifact characterization.
- `tools/overlay-foundation-evaluation/runner/core.mjs` composes preflight
  without selecting a candidate or running browser scenarios.
- `tools/overlay-foundation-evaluation/scripts/check.mjs` validates an explicit
  manifest without acquiring or installing artifacts.
- `tools/overlay-foundation-evaluation/scripts/incumbent.mjs` writes an
  incumbent characterization to an explicit output path.
- `tools/overlay-foundation-evaluation/README.md` documents the commands,
  evidence boundaries, and the external-artifact checkpoint.
- `package.json` wires focused tests into the root test gate without changing
  dependencies.

---

### Task 1: Shared protocol and prospective manifest validation

**Files:**

- Create: `tools/overlay-foundation-evaluation/contracts/protocol.mjs`
- Create: `tools/overlay-foundation-evaluation/contracts/protocol.test.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/manifest.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/manifest.test.mjs`

**Interfaces:**

- Produces:
  `CONTRACT_IDS: readonly string[]`,
  `CANDIDATE_IDS: readonly string[]`,
  `RESULTS: readonly string[]`,
  `FAILURE_CLASSIFICATIONS: readonly string[]`,
  `FIXTURE_OPERATIONS: readonly string[]`,
  `validateScenario(value: unknown): string[]`,
  `validateCandidateManifest(value: unknown, expectedToolchain: {node: string, pnpm: string}): string[]`,
  and
  `validateAdapterDescriptor(candidate: CandidateRecord, descriptor: unknown): string[]`.
- Consumed by Tasks 2-6; no module reads `process.env`, the network, or the
  filesystem.

- [ ] **Step 1: Write protocol tests that reject candidate branching and incomplete scenarios**

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CONTRACT_IDS, validateScenario } from './protocol.mjs';

const validScenario = {
  schemaVersion: 1,
  revision: 1,
  contractId: 'OF-MODAL',
  scenarioId: 'of-modal.initial-focus.v1',
  components: ['Dialog'],
  initial: { markup: '<button>Open</button>', state: { open: false } },
  operations: [{ operation: 'open', target: 'primary-trigger' }],
  expected: {
    roles: [{ role: 'dialog', name: 'Settings' }],
    relationships: [],
    states: [{ target: 'dialog', name: 'open', value: true }],
    focus: { target: 'first-focusable' },
    events: [],
    announcements: [],
    cleanup: ['body-scroll-unlocked', 'background-interactive'],
  },
  requiredCells: ['chromium', 'firefox', 'webkit'],
  capture: ['dom', 'accessibility-tree', 'events'],
};

test('exports the five immutable contract IDs', () => {
  assert.deepEqual(CONTRACT_IDS, [
    'OF-MODAL',
    'OF-ANCHORED',
    'OF-MENU',
    'OF-TOOLTIP',
    'OF-COMPOSED',
  ]);
});

test('accepts a complete candidate-neutral scenario', () => {
  assert.deepEqual(validateScenario(validScenario), []);
});

for (const forbiddenKey of ['candidateId', 'vendorSelector', 'vendorAttribute']) {
  test(`rejects scenario-owned ${forbiddenKey}`, () => {
    assert.match(
      validateScenario({ ...validScenario, [forbiddenKey]: 'radix' }).join('\n'),
      /unsupported key/u,
    );
  });
}

test('rejects unknown operations and missing expected focus', () => {
  const scenario = structuredClone(validScenario);
  scenario.operations = [{ operation: 'clickVendorNode', target: 'x' }];
  delete scenario.expected.focus;
  const errors = validateScenario(scenario).join('\n');
  assert.match(errors, /operation is invalid/u);
  assert.match(errors, /expected.focus/u);
});
```

- [ ] **Step 2: Write manifest tests for the exact four IDs and discriminated artifact shapes**

```js
const sha = 'a'.repeat(64);
const revision = 'b'.repeat(40);
const external = (id, name) => ({
  id,
  adapter: `candidates/${id}.mjs`,
  contracts: ['OF-MODAL'],
  artifacts: [
    {
      source: 'registry',
      name,
      version: '1.2.3',
      tarballUrl: `https://registry.example.invalid/${id}-1.2.3.tgz`,
      sha256: sha,
      license: 'MIT',
      repositoryUrl: `https://github.com/example/${id}`,
    },
  ],
});
const validManifest = {
  schemaVersion: 1,
  lyraRevision: revision,
  toolchain: { node: '24.18.0', pnpm: '11.13.1' },
  candidates: [
    {
      id: 'incumbent',
      adapter: 'candidates/incumbent.mjs',
      contracts: ['OF-MODAL'],
      revision,
      artifacts: [
        {
          source: 'workspace-pack',
          name: '@lyra-ds/react',
          version: '0.5.0',
          sha256: sha,
        },
      ],
    },
    external('radix', '@radix-ui/react-dialog'),
    external('base-ui', '@base-ui-components/react'),
    external('zag', '@zag-js/dialog'),
  ],
};

test('accepts a complete prospective manifest', () => {
  assert.deepEqual(
    validateCandidateManifest(validManifest, { node: '24.18.0', pnpm: '11.13.1' }),
    [],
  );
});

for (const version of ['^1.2.3', '~1.2.3', 'latest', 'workspace:*']) {
  test(`rejects non-exact version ${version}`, () => {
    const manifest = structuredClone(validManifest);
    manifest.candidates[1].artifacts[0].version = version;
    assert.match(
      validateCandidateManifest(manifest, manifest.toolchain).join('\n'),
      /exact version/u,
    );
  });
}

test('rejects a missing candidate, duplicate contract, credentialed URL, and uppercase hash', () => {
  const manifest = structuredClone(validManifest);
  manifest.candidates.pop();
  manifest.candidates[1].contracts.push('OF-MODAL');
  manifest.candidates[1].artifacts[0].tarballUrl =
    'https://user:pass@registry.example.invalid/a.tgz';
  manifest.candidates[1].artifacts[0].sha256 = sha.toUpperCase();
  const errors = validateCandidateManifest(manifest, manifest.toolchain).join('\n');
  assert.match(errors, /candidate IDs must be exactly/u);
  assert.match(errors, /contracts must be unique/u);
  assert.match(errors, /credentials/u);
  assert.match(errors, /lowercase SHA-256/u);
});
```

- [ ] **Step 3: Run the two test files and observe RED**

Run:

```bash
node --test \
  tools/overlay-foundation-evaluation/contracts/protocol.test.mjs \
  tools/overlay-foundation-evaluation/runner/manifest.test.mjs
```

Expected: exit 1 with `ERR_MODULE_NOT_FOUND` for `protocol.mjs` and
`manifest.mjs`.

- [ ] **Step 4: Implement closed-shape validators and exact constants**

```js
export const CONTRACT_IDS = Object.freeze([
  'OF-MODAL',
  'OF-ANCHORED',
  'OF-MENU',
  'OF-TOOLTIP',
  'OF-COMPOSED',
]);
export const CANDIDATE_IDS = Object.freeze(['incumbent', 'radix', 'base-ui', 'zag']);
export const RESULTS = Object.freeze(['PASS', 'FAIL', 'unavailable']);
export const FAILURE_CLASSIFICATIONS = Object.freeze([
  'product',
  'fixture',
  'infrastructure',
  'security',
  'packaging',
  'measurement',
  'policy',
]);
export const FIXTURE_OPERATIONS = Object.freeze([
  'open',
  'close',
  'press',
  'point',
  'setDirection',
  'setMotionPreference',
  'updateContent',
  'destroy',
]);

export function validateScenario(value) {
  const errors = [];
  if (!isPlainRecord(value)) return ['scenario must be a plain record'];
  rejectUnknownKeys(
    value,
    [
      'schemaVersion',
      'revision',
      'contractId',
      'scenarioId',
      'components',
      'initial',
      'operations',
      'expected',
      'requiredCells',
      'capture',
    ],
    'scenario',
    errors,
  );
  requireExactInteger(value.schemaVersion, 1, 'scenario.schemaVersion', errors);
  requirePositiveInteger(value.revision, 'scenario.revision', errors);
  requireMember(value.contractId, CONTRACT_IDS, 'scenario.contractId', errors);
  requirePattern(
    value.scenarioId,
    /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9-]+)+\.v\d+$/u,
    'scenario.scenarioId',
    errors,
  );
  requireUniqueStrings(value.components, 'scenario.components', errors);
  validateInitial(value.initial, errors);
  validateOperations(value.operations, errors);
  validateExpected(value.expected, errors);
  requireUniqueStrings(value.requiredCells, 'scenario.requiredCells', errors);
  requireUniqueStrings(value.capture, 'scenario.capture', errors);
  return errors;
}
```

Implement `validateCandidateManifest` with the same closed-shape helpers,
discriminate `workspace-pack` from `registry`, compare the toolchain exactly,
require one record for each candidate ID in canonical order, and reject adapter
paths unless they match `candidates/<candidate-id>.mjs`. Implement
`validateAdapterDescriptor` to require exact candidate ID and set equality
between manifest contracts and `descriptor.supportedContractIds`.

- [ ] **Step 5: Run focused tests and mutation checks**

Run:

```bash
node --test \
  tools/overlay-foundation-evaluation/contracts/protocol.test.mjs \
  tools/overlay-foundation-evaluation/runner/manifest.test.mjs
```

Expected: all tests pass. Temporarily remove `candidate IDs must be exactly`
validation and confirm the missing-candidate test fails; restore the production
bytes and rerun green.

- [ ] **Step 6: Commit the protocol boundary**

```bash
git add tools/overlay-foundation-evaluation/contracts \
  tools/overlay-foundation-evaluation/runner/manifest.mjs \
  tools/overlay-foundation-evaluation/runner/manifest.test.mjs
git commit -m "feat: define overlay evaluation protocol"
```

---

### Task 2: Exact artifact acquisition and archive preflight

**Files:**

- Create: `tools/overlay-foundation-evaluation/runner/artifacts.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/artifacts.test.mjs`

**Interfaces:**

- Consumes: validated external artifact records from
  `runner/manifest.mjs`.
- Produces:
  `sha256(bytes: Uint8Array): string`,
  `acquireExternalArtifact({record, destinationRoot, fetchImpl, maxBytes}): Promise<AcquiredArtifact>`,
  and
  `inspectPackageArchive({artifact, runCommand}): Promise<InspectedArtifact>`.
- `AcquiredArtifact` is
  `{record, path, sha256, bytes}`. `InspectedArtifact` adds
  `{packageName, packageVersion, license, lifecycleScripts}`.

- [ ] **Step 1: Write bounded-download and checksum tests**

```js
test('writes an exact artifact only after size and SHA verification', async () => {
  const bytes = new TextEncoder().encode('verified artifact');
  const record = externalArtifact({ sha256: sha256(bytes) });
  const result = await acquireExternalArtifact({
    record,
    destinationRoot,
    fetchImpl: async () => new Response(bytes, { status: 200 }),
    maxBytes: 1024,
  });
  assert.equal(result.sha256, record.sha256);
  assert.deepEqual(await readFile(result.path), Buffer.from(bytes));
});

test('removes partial output on checksum mismatch', async () => {
  const record = externalArtifact({ sha256: '0'.repeat(64) });
  await assert.rejects(
    acquireExternalArtifact({
      record,
      destinationRoot,
      fetchImpl: async () => new Response('wrong', { status: 200 }),
      maxBytes: 1024,
    }),
    /checksum mismatch/u,
  );
  assert.deepEqual(await readdir(destinationRoot), []);
});

test('rejects redirect, non-200, declared oversize, and streamed oversize responses', async () => {
  for (const response of [
    new Response('', { status: 302, headers: { location: 'https://example.invalid/x' } }),
    new Response('', { status: 404 }),
    new Response('tiny', { status: 200, headers: { 'content-length': '2048' } }),
    new Response(new Uint8Array(2048), { status: 200 }),
  ]) {
    await assert.rejects(
      acquireExternalArtifact({
        record: externalArtifact(),
        destinationRoot,
        fetchImpl: async () => response,
        maxBytes: 1024,
      }),
    );
  }
});
```

- [ ] **Step 2: Write real tarball-inspection tests**

Create each test tarball in a unique test directory by writing
`package/package.json` and running:

```js
await execFilePromise('tar', ['-czf', archivePath, '-C', sourceRoot, 'package']);
```

Test an exact `name`, `version`, and `license`, then mutate each field. Add a
package with:

```json
{
  "scripts": {
    "preinstall": "node write-marker.mjs",
    "install": "node write-marker.mjs",
    "postinstall": "node write-marker.mjs",
    "prepare": "node write-marker.mjs"
  }
}
```

Require one error per forbidden lifecycle key. Also test duplicate
`package/package.json` members, a missing manifest, invalid JSON, and output
larger than 1 MiB from `tar -xOf`; all fail closed.

- [ ] **Step 3: Run the artifact test and observe RED**

Run:

```bash
node --test tools/overlay-foundation-evaluation/runner/artifacts.test.mjs
```

Expected: exit 1 with `ERR_MODULE_NOT_FOUND` for `artifacts.mjs`.

- [ ] **Step 4: Implement streaming acquisition and exact archive inspection**

```js
export async function acquireExternalArtifact({
  record,
  destinationRoot,
  fetchImpl = fetch,
  maxBytes = 50_000_000,
}) {
  const response = await fetchImpl(record.tarballUrl, { redirect: 'error' });
  if (response.status !== 200 || response.body === null) {
    throw new Error(`artifact request failed with HTTP ${response.status}`);
  }
  const declared = response.headers.get('content-length');
  if (declared !== null && Number(declared) > maxBytes) {
    throw new Error(`artifact exceeds ${maxBytes} bytes`);
  }
  const chunks = [];
  let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.byteLength;
    if (bytes > maxBytes) throw new Error(`artifact exceeds ${maxBytes} bytes`);
    chunks.push(Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks);
  const actual = sha256(body);
  if (actual !== record.sha256) throw new Error('artifact checksum mismatch');
  const path = join(destinationRoot, `${safeArtifactName(record.name)}-${record.version}.tgz`);
  await writeFile(path, body, { flag: 'wx', mode: 0o600 });
  return { record, path, sha256: actual, bytes };
}
```

Wrap acquisition in `try/catch` and unlink only the exact file created by that
call. Inspect archive member names first with `tar -tzf`; require exactly one
`package/package.json`; then read it with `tar -xOzf`, enforce the 1 MiB output
cap, parse a plain JSON object, compare name/version/license, and reject any of
the four lifecycle keys.

- [ ] **Step 5: Run focused tests and prove the checksum mutation is detected**

Run:

```bash
node --test tools/overlay-foundation-evaluation/runner/artifacts.test.mjs
```

Expected: all tests pass. Temporarily compare only the first 32 checksum
characters; the altered-suffix checksum test must fail. Restore the full
64-character comparison and rerun green.

- [ ] **Step 6: Commit acquisition and archive preflight**

```bash
git add tools/overlay-foundation-evaluation/runner/artifacts.mjs \
  tools/overlay-foundation-evaluation/runner/artifacts.test.mjs
git commit -m "feat: verify overlay candidate artifacts"
```

---

### Task 3: Script-disabled isolated installation and guarded cleanup

**Files:**

- Create: `tools/overlay-foundation-evaluation/runner/isolation.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/isolation.test.mjs`

**Interfaces:**

- Consumes: inspected artifacts from Task 2 and exact Node/pnpm values from
  Task 1.
- Produces:
  `createOwnedRunRoot({tmpdir, runId}): Promise<{runRoot, ownerToken}>`,
  `installExternalCandidate({candidate, artifacts, runRoot, repositoryRoot, runCommand}): Promise<InstallEvidence>`,
  `validateAuditReport(value: unknown): string[]`, and
  `cleanupOwnedRunRoot({tmpdir, runRoot, ownerToken}): Promise<void>`.
- `InstallEvidence` contains exact fixture manifest, lockfile, resolved graph,
  audit, and license-inventory paths plus their lowercase SHA-256 values.

- [ ] **Step 1: Write run-root ownership and cleanup tests**

```js
test('creates a unique owned child of TMPDIR and removes only that child', async () => {
  const owned = await createOwnedRunRoot({ tmpdir, runId: 'core-test-001' });
  assert.equal(dirname(owned.runRoot), resolve(tmpdir));
  await writeFile(join(owned.runRoot, 'owned.txt'), 'owned');
  await cleanupOwnedRunRoot({ tmpdir, ...owned });
  await assert.rejects(stat(owned.runRoot), { code: 'ENOENT' });
  assert.equal(await readFile(foreignPath, 'utf8'), 'foreign');
});

test('refuses cleanup after the owned directory is replaced', async () => {
  const owned = await createOwnedRunRoot({ tmpdir, runId: 'core-test-002' });
  await rename(owned.runRoot, `${owned.runRoot}.original`);
  await mkdir(owned.runRoot);
  await writeFile(
    join(owned.runRoot, '.lyra-overlay-evaluation-owner.json'),
    JSON.stringify({ ownerToken: 'foreign' }),
  );
  await assert.rejects(cleanupOwnedRunRoot({ tmpdir, ...owned }), /ownership mismatch/u);
  assert.equal((await stat(owned.runRoot)).isDirectory(), true);
});
```

- [ ] **Step 2: Write a real pnpm isolation test with a hostile lifecycle script**

Create a synthetic package tarball whose `postinstall` writes a marker outside
`node_modules`. Generate the fixture package and lock in the owned run root,
then call `installExternalCandidate`. Assert:

```js
assert.equal(await exists(postinstallMarker), false);
assert.equal(await exists(join(repositoryRoot, 'node_modules', syntheticName)), false);
assert.equal(await sha256File(join(repositoryRoot, 'pnpm-lock.yaml')), repositoryLockBefore);
assert.equal(await exists(result.lockfilePath), true);
assert.equal(await exists(result.resolvedGraphPath), true);
```

The hostile package is passed directly to the installer test to prove
`--ignore-scripts`; Task 2 separately proves that the composed preflight rejects
the archive before installation.

- [ ] **Step 3: Write audit and mutation tests**

```js
for (const severity of ['high', 'critical']) {
  test(`rejects a ${severity} audit advisory`, () => {
    const audit = {
      metadata: {
        vulnerabilities: {
          info: 0,
          low: 0,
          moderate: 0,
          high: severity === 'high' ? 1 : 0,
          critical: severity === 'critical' ? 1 : 0,
        },
      },
    };
    assert.match(validateAuditReport(audit).join('\n'), new RegExp(severity, 'u'));
  });
}

test('rejects missing vulnerability totals and malformed audit output', () => {
  assert.notDeepEqual(validateAuditReport({}), []);
  assert.notDeepEqual(validateAuditReport('not-json'), []);
});
```

Inject a `runCommand` that writes a tracked repository file after the frozen
install and assert `installExternalCandidate` rejects with
`repository worktree changed during candidate installation` while preserving
the foreign edit for diagnosis.

- [ ] **Step 4: Run the isolation test and observe RED**

Run with a command-scoped temporary directory:

```bash
build_tmp=$(mktemp -d -p /home/francisross/tmp-builds overlay-core-isolation.XXXXXX)
TMPDIR="$build_tmp" node --test \
  tools/overlay-foundation-evaluation/runner/isolation.test.mjs
status=$?
rm -rf "$build_tmp"
exit $status
```

Expected: exit 1 with `ERR_MODULE_NOT_FOUND` for `isolation.mjs`.

- [ ] **Step 5: Implement owned roots, exact commands, evidence capture, and cleanup**

The generated fixture manifest contains only exact `file:` tarball references.
Run these commands through `execFile` without a shell:

```js
await runCommand(
  'pnpm',
  ['install', '--ignore-workspace', '--ignore-scripts', '--store-dir', storeRoot],
  { cwd: fixtureRoot },
);
await removeOwnedNodeModules({ fixtureRoot, runRoot });
await runCommand(
  'pnpm',
  [
    'install',
    '--frozen-lockfile',
    '--offline',
    '--ignore-workspace',
    '--ignore-scripts',
    '--store-dir',
    storeRoot,
  ],
  { cwd: fixtureRoot },
);
const list = await runCommand(
  'pnpm',
  ['list', '--json', '--depth', 'Infinity', '--ignore-workspace'],
  { cwd: fixtureRoot },
);
const audit = await runCommand('pnpm', ['audit', '--json'], {
  cwd: fixtureRoot,
  allowExitCode: 1,
});
```

Record the exact stdout bytes before parsing. Hash `package.json`,
`pnpm-lock.yaml`, resolved graph, audit JSON, and license inventory. Compare
`process.versions.node` and `pnpm --version` to the manifest toolchain before
install. The first script-disabled install resolves and downloads the graph;
then remove only the verified `fixtureRoot/node_modules` child and prove the
same lock installs frozen and offline from the owned store. Capture
`git status --porcelain=v1 --untracked-files=all` before and after; any byte
difference fails. Guard cleanup by resolved-parent equality, the owner token,
and the directory identity captured at creation.

- [ ] **Step 6: Run the real isolation suite and mutation proof**

Run the Step 4 command again. Expected: all tests pass and the owned temporary
directory is removed. Temporarily remove `--ignore-scripts` from the frozen
install; the marker assertion must fail. Restore the flag and rerun green.

- [ ] **Step 7: Commit isolation**

```bash
git add tools/overlay-foundation-evaluation/runner/isolation.mjs \
  tools/overlay-foundation-evaluation/runner/isolation.test.mjs
git commit -m "feat: isolate overlay candidate installs"
```

---

### Task 4: Canonical core results and immutable attempts

**Files:**

- Create: `tools/overlay-foundation-evaluation/evidence/results.mjs`
- Create: `tools/overlay-foundation-evaluation/evidence/results.test.mjs`

**Interfaces:**

- Consumes: result and classification enums from Task 1.
- Produces:
  `validateAttempt(value: unknown): string[]`,
  `canonicalJson(value: unknown): string`,
  `writeAttempt({evidenceRoot, attempt}): Promise<{path, sha256}>`, and
  `summarizeAttempts(attempts: unknown[]): AttemptSummary`.
- Scenario-attempt identity is
  `{recordType: "scenario", candidateId, contractId, scenarioId, cellId, attemptNumber}`.
  Preflight-attempt identity is
  `{recordType: "preflight", candidateId, stage, attemptNumber}` where stage is
  exactly `adapter`, `artifact`, `installation`, `audit`, or `repository`.
  Attempt 1 is the effective result forever.

- [ ] **Step 1: Write exact-schema and fail-closed tests**

```js
const firstAttempt = {
  schemaVersion: 1,
  recordType: 'scenario',
  runId: '20260831T120000Z-core-001',
  candidateId: 'incumbent',
  contractId: 'OF-MODAL',
  scenarioId: 'of-modal.initial-focus.v1',
  cellId: 'chromium-react18-default',
  attemptNumber: 1,
  result: 'FAIL',
  classification: 'product',
  expected: { focus: 'first-focusable' },
  observed: { focus: 'body' },
  artifactPaths: ['raw/focus.json'],
};

test('accepts a complete attempt and rejects unknown keys', () => {
  assert.deepEqual(validateAttempt(firstAttempt), []);
  assert.match(validateAttempt({ ...firstAttempt, score: 91 }).join('\n'), /unsupported key/u);
});

for (const classification of ['unknown', 'flaky', 'vendor']) {
  test(`rejects classification ${classification}`, () => {
    assert.match(
      validateAttempt({ ...firstAttempt, classification }).join('\n'),
      /classification is invalid/u,
    );
  });
}

test('accepts preflight evidence without inventing a contract result', () => {
  assert.deepEqual(
    validateAttempt({
      schemaVersion: 1,
      recordType: 'preflight',
      runId: '20260831T120000Z-core-001',
      candidateId: 'incumbent',
      stage: 'artifact',
      attemptNumber: 1,
      result: 'PASS',
      observed: { artifacts: 3 },
      artifactPaths: ['incumbent.json'],
    }),
    [],
  );
});
```

- [ ] **Step 2: Write immutable-write and retry-summary tests**

```js
test('preserves first attempt when a retry passes', async () => {
  const first = await writeAttempt({ evidenceRoot, attempt: firstAttempt });
  const { classification: ignoredClassification, ...passingBase } = firstAttempt;
  const retry = await writeAttempt({
    evidenceRoot,
    attempt: {
      ...passingBase,
      attemptNumber: 2,
      result: 'PASS',
      observed: { focus: 'first-focusable' },
    },
  });
  assert.notEqual(first.path, retry.path);
  const summary = summarizeAttempts([
    firstAttempt,
    {
      ...passingBase,
      attemptNumber: 2,
      result: 'PASS',
      observed: { focus: 'first-focusable' },
    },
  ]);
  assert.equal(summary.effectiveResult, 'FAIL');
  assert.equal(summary.firstAttemptNumber, 1);
  assert.equal(summary.retryCount, 1);
});

test('cannot overwrite an existing attempt', async () => {
  await writeAttempt({ evidenceRoot, attempt: firstAttempt });
  await assert.rejects(writeAttempt({ evidenceRoot, attempt: firstAttempt }), /already exists/u);
});
```

Also test path traversal in IDs/artifact paths, attempt sequence gaps, duplicate
attempt numbers, missing attempt 1, and a retry whose identity differs from the
first attempt.

- [ ] **Step 3: Run the evidence test and observe RED**

Run:

```bash
node --test tools/overlay-foundation-evaluation/evidence/results.test.mjs
```

Expected: exit 1 with `ERR_MODULE_NOT_FOUND` for `results.mjs`.

- [ ] **Step 4: Implement deterministic JSON and exclusive attempt writes**

```js
export function canonicalJson(value) {
  return `${JSON.stringify(sortRecursively(value), null, 2)}\n`;
}

export async function writeAttempt({ evidenceRoot, attempt }) {
  const errors = validateAttempt(attempt);
  if (errors.length !== 0) throw new Error(errors.join('\n'));
  const directory = join(
    evidenceRoot,
    'attempts',
    attempt.candidateId,
    attempt.contractId,
    attempt.scenarioId,
    attempt.cellId,
  );
  await mkdir(directory, { recursive: true });
  const path = join(directory, `attempt-${attempt.attemptNumber}.json`);
  const bytes = Buffer.from(canonicalJson(attempt));
  await writeFile(path, bytes, { flag: 'wx', mode: 0o600 });
  return { path, sha256: sha256(bytes) };
}
```

Validate every path segment before joining. A `PASS` record must omit
`classification`; `FAIL` and `unavailable` must include an allowed
classification. Use separate `scenario/` and `preflight/` path layouts.
`summarizeAttempts` sorts by attempt number, requires contiguous numbering from
1, exact identity equality, and derives `effectiveResult`,
`effectiveClassification`, and `firstAttemptSha256` exclusively from attempt

1. It must not expose a score or winner field.

- [ ] **Step 5: Run focused tests and prove attempt 1 cannot be upgraded**

Run the Step 3 command. Expected: all tests pass. Temporarily derive
`effectiveResult` from the last attempt; the fail-then-pass test must fail.
Restore first-attempt derivation and rerun green.

- [ ] **Step 6: Commit immutable results**

```bash
git add tools/overlay-foundation-evaluation/evidence
git commit -m "feat: preserve overlay evaluation attempts"
```

---

### Task 5: Incumbent descriptor and packed-artifact characterization

**Files:**

- Create: `tools/overlay-foundation-evaluation/candidates/incumbent.mjs`
- Create: `tools/overlay-foundation-evaluation/candidates/incumbent.test.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/incumbent.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/incumbent.test.mjs`

**Interfaces:**

- Consumes: contract IDs from Task 1 and checksum/canonical JSON helpers from
  Tasks 2 and 4.
- Produces:
  `incumbentDescriptor`,
  `characterizeIncumbent({repositoryRoot, outputRoot, runCommand}): Promise<IncumbentCharacterization>`,
  and CLI
  `node tools/overlay-foundation-evaluation/scripts/incumbent.mjs --output <path>`.
- `incumbentDescriptor` contains exactly the incumbent ID, all five supported
  contract IDs, and Lyra-owned public package names. It does not claim any
  scenario result.

- [ ] **Step 1: Write descriptor and command-sequence tests**

```js
test('describes incumbent identity without a result or vendor surface', () => {
  assert.deepEqual(incumbentDescriptor, {
    id: 'incumbent',
    supportedContractIds: ['OF-MODAL', 'OF-ANCHORED', 'OF-MENU', 'OF-TOOLTIP', 'OF-COMPOSED'],
    publicPackages: ['@lyra-ds/styles', '@lyra-ds/react', '@lyra-ds/alpine'],
  });
  assert.equal('result' in incumbentDescriptor, false);
});

test('builds, packs, verifies, and hashes the three incumbent packages', async () => {
  const calls = [];
  const result = await characterizeIncumbent({
    repositoryRoot,
    outputRoot,
    runCommand: fakeCommandSequence(calls, { revision, cleanStatus: '', tarballs }),
  });
  assert.deepEqual(
    calls.map(({ command, args }) => [command, ...args]),
    [
      ['git', 'rev-parse', 'HEAD'],
      ['git', 'status', '--porcelain=v1', '--untracked-files=all'],
      ['pnpm', '--filter', '@lyra-ds/react', 'run', 'build'],
      ['pnpm', '--filter', '@lyra-ds/alpine', 'run', 'build'],
      ['pnpm', '--dir', 'packages/styles', 'pack', '--pack-destination', outputRoot],
      ['pnpm', '--dir', 'packages/react', 'pack', '--pack-destination', outputRoot],
      ['pnpm', '--dir', 'packages/alpine', 'pack', '--pack-destination', outputRoot],
      ['git', 'status', '--porcelain=v1', '--untracked-files=all'],
    ],
  );
  assert.equal(result.revision, revision);
  assert.deepEqual(
    result.artifacts.map(({ name }) => name),
    incumbentDescriptor.publicPackages,
  );
});
```

Add negatives for dirty initial worktree, worktree drift after packing, short
revision, missing/extra tarball, tarball package-name mismatch, and version
mismatch against the source package manifest.

- [ ] **Step 2: Write strict CLI parser tests**

Test exactly one `--output <path>` pair. Missing, duplicate, empty, and unknown
arguments exit nonzero before `characterizeIncumbent` is called. The output
path must not exist, must be outside the temporary run root, and is written
with `wx`.

- [ ] **Step 3: Run incumbent tests and observe RED**

Run:

```bash
node --test \
  tools/overlay-foundation-evaluation/candidates/incumbent.test.mjs \
  tools/overlay-foundation-evaluation/scripts/incumbent.test.mjs
```

Expected: exit 1 with missing incumbent modules.

- [ ] **Step 4: Implement incumbent characterization**

```js
export const incumbentDescriptor = Object.freeze({
  id: 'incumbent',
  supportedContractIds: CONTRACT_IDS,
  publicPackages: Object.freeze(['@lyra-ds/styles', '@lyra-ds/react', '@lyra-ds/alpine']),
});

export async function characterizeIncumbent({ repositoryRoot, outputRoot, runCommand }) {
  const revision = (
    await runCommand('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot })
  ).stdout.trim();
  requireFullSha(revision);
  const before = await readStatus(runCommand, repositoryRoot);
  if (before !== '') throw new Error('incumbent characterization requires a clean worktree');
  await runCommand('pnpm', ['--filter', '@lyra-ds/react', 'run', 'build'], { cwd: repositoryRoot });
  await runCommand('pnpm', ['--filter', '@lyra-ds/alpine', 'run', 'build'], {
    cwd: repositoryRoot,
  });
  const artifacts = [];
  for (const packageDirectory of ['packages/styles', 'packages/react', 'packages/alpine']) {
    artifacts.push(
      await packAndInspect({
        repositoryRoot,
        packageDirectory,
        outputRoot,
        runCommand,
      }),
    );
  }
  const after = await readStatus(runCommand, repositoryRoot);
  if (after !== before)
    throw new Error('repository worktree changed during incumbent characterization');
  return { schemaVersion: 1, candidateId: 'incumbent', revision, artifacts };
}
```

`packAndInspect` snapshots the output directory before and after each command,
requires exactly one new `.tgz`, reads `package/package.json` through the Task 2
archive inspector, and hashes the exact tarball bytes.

- [ ] **Step 5: Run focused tests and an actual disposable characterization**

Focused command: repeat Step 3 and expect all tests to pass.

Actual command:

```bash
build_tmp=$(mktemp -d -p /home/francisross/tmp-builds overlay-incumbent.XXXXXX)
TMPDIR="$build_tmp" node \
  tools/overlay-foundation-evaluation/scripts/incumbent.mjs \
  --output "$build_tmp/incumbent.json"
node -e "const x=require(process.argv[1]); if (x.artifacts.length !== 3) process.exit(1)" \
  "$build_tmp/incumbent.json"
status=$?
rm -rf "$build_tmp"
exit $status
```

Expected: exit 0, full revision, three exact artifacts, clean tracked worktree.

- [ ] **Step 6: Commit incumbent characterization**

```bash
git add tools/overlay-foundation-evaluation/candidates/incumbent.mjs \
  tools/overlay-foundation-evaluation/candidates/incumbent.test.mjs \
  tools/overlay-foundation-evaluation/scripts/incumbent.mjs \
  tools/overlay-foundation-evaluation/scripts/incumbent.test.mjs
git commit -m "feat: characterize incumbent overlay artifacts"
```

---

### Task 6: Core preflight composition and strict manifest checker

**Files:**

- Create: `tools/overlay-foundation-evaluation/runner/core.mjs`
- Create: `tools/overlay-foundation-evaluation/runner/core.test.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/check.mjs`
- Create: `tools/overlay-foundation-evaluation/scripts/check.test.mjs`

**Interfaces:**

- Consumes all interfaces from Tasks 1-5.
- Produces:
  `runCorePreflight({manifest, repositoryRoot, tmpdir, evidenceRoot, fetchImpl, runCommand}): Promise<CorePreflightSummary>`
  and CLI
  `node tools/overlay-foundation-evaluation/scripts/check.mjs --manifest <path>`.
- The checker validates only. `runCorePreflight` performs acquisition and
  installation when called programmatically, but no tracked real manifest or
  root command invokes it in this plan.

- [ ] **Step 1: Write adapter-loading and preflight-order tests**

Create temporary `candidates/<id>.mjs` descriptors for the four prospective
records. Assert the call order is:

```js
assert.deepEqual(events, [
  'validate-manifest',
  'verify-repository-clean',
  'load-adapter:incumbent',
  'load-adapter:radix',
  'load-adapter:base-ui',
  'load-adapter:zag',
  'characterize:incumbent',
  'write-preflight:incumbent',
  'acquire:radix',
  'inspect:radix',
  'install:radix',
  'write-preflight:radix',
  'acquire:base-ui',
  'inspect:base-ui',
  'install:base-ui',
  'write-preflight:base-ui',
  'acquire:zag',
  'inspect:zag',
  'install:zag',
  'write-preflight:zag',
  'verify-repository-unchanged',
  'cleanup-owned-root',
]);
```

Inject checksum failure for `base-ui`; require the rest of Base UI preflight to
stop, a `base-ui` failure attempt classified `security` to be written, Zag to
continue independently, the owned run root to be cleaned, all evidence outside
the run root to remain, and the summary to fail closed. Inject a repository
mutation or evidence-write failure and require Zag not to start because those
failures make the shared run state untrustworthy. An adapter mismatch is a
candidate-local `policy` failure: record it and continue the other candidates.

- [ ] **Step 2: Write strict checker CLI tests**

Test `--manifest <path>` only. The manifest must be UTF-8 JSON with no BOM,
must pass Task 1 validation against `.nvmrc` and `package.json#packageManager`,
and must resolve adapter paths beneath
`tools/overlay-foundation-evaluation/candidates/`. Unknown/missing/duplicate
arguments, malformed JSON, symlink escape, and missing adapter fail nonzero.
Assert the checker never calls `fetch`, `pnpm install`, or an adapter runtime
function.

- [ ] **Step 3: Run core and checker tests and observe RED**

Run:

```bash
node --test \
  tools/overlay-foundation-evaluation/runner/core.test.mjs \
  tools/overlay-foundation-evaluation/scripts/check.test.mjs
```

Expected: exit 1 with missing core/check modules.

- [ ] **Step 4: Implement fail-closed composition**

```js
export async function runCorePreflight({
  manifest,
  repositoryRoot,
  tmpdir,
  evidenceRoot,
  fetchImpl,
  runCommand,
}) {
  assertValidManifest(manifest, await readExpectedToolchain(repositoryRoot));
  const repositoryBefore = await readRepositoryStatus(repositoryRoot, runCommand);
  if (repositoryBefore !== '') throw new Error('core preflight requires a clean worktree');
  const adapters = await loadAndValidateAdapters(manifest, repositoryRoot);
  const owned = await createOwnedRunRoot({ tmpdir, runId: createRunId(manifest) });
  const attempts = [];
  let primaryError;
  try {
    const incumbent = await characterizeIncumbent({
      repositoryRoot,
      outputRoot: join(owned.runRoot, 'incumbent'),
      runCommand,
    });
    const incumbentAttempt = corePreflightPass(manifest.candidates[0], 'artifact', incumbent);
    await writeAttempt({ evidenceRoot, attempt: incumbentAttempt });
    attempts.push(incumbentAttempt);
    for (const candidate of manifest.candidates.filter(({ id }) => id !== 'incumbent')) {
      try {
        const artifacts = [];
        for (const record of candidate.artifacts) {
          const acquired = await acquireExternalArtifact({
            record,
            destinationRoot: join(owned.runRoot, 'artifacts'),
            fetchImpl,
          });
          artifacts.push(await inspectPackageArchive({ artifact: acquired, runCommand }));
        }
        const installed = await installExternalCandidate({
          candidate,
          artifacts,
          runRoot: owned.runRoot,
          repositoryRoot,
          runCommand,
        });
        const attempt = corePreflightPass(candidate, 'installation', installed);
        await writeAttempt({ evidenceRoot, attempt });
        attempts.push(attempt);
      } catch (error) {
        const attempt = corePreflightFailure(candidate, error);
        await writeAttempt({ evidenceRoot, attempt });
        attempts.push(attempt);
        if (isRunFatal(error)) throw error;
      }
    }
    await assertRepositoryUnchanged(repositoryRoot, repositoryBefore, runCommand);
    return summarizeCorePreflight(manifest, attempts);
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    try {
      await cleanupOwnedRunRoot({ tmpdir, ...owned });
    } catch (cleanupError) {
      if (primaryError !== undefined) {
        throw new AggregateError(
          [primaryError, cleanupError],
          'core preflight and cleanup both failed',
        );
      }
      throw cleanupError;
    }
  }
}
```

The `finally` path preserves the original error if cleanup also fails by
throwing an `AggregateError` containing both errors. Adapter imports use real
paths and reject symlinks whose `realpath` leaves the candidate directory.
Preflight attempts use `recordType: "preflight"` and never claim an overlay
contract, scenario, or cell PASS. Module errors carry an allowed classification
and scope (`candidate` or `run`) at their responsible boundary; missing or
unknown values are converted to a fail-closed, run-fatal `policy` record.
Checksum, license, lifecycle, audit, and adapter failures stop only the affected
candidate. Repository mutation, corrupted ownership, evidence-write failure,
and cleanup failure stop the entire run.

- [ ] **Step 5: Implement the validation-only checker**

```js
export async function checkManifestFile({ manifestPath, repositoryRoot }) {
  const text = await readFile(manifestPath, 'utf8');
  if (text.startsWith('\uFEFF')) throw new Error('candidate manifest must not contain a BOM');
  const manifest = JSON.parse(text);
  const errors = validateCandidateManifest(manifest, await readExpectedToolchain(repositoryRoot));
  errors.push(...(await validateManifestAdapterPaths(manifest, repositoryRoot)));
  if (errors.length !== 0) throw new Error(errors.join('\n'));
  return manifest;
}
```

The main function prints exactly
`Overlay candidate manifest passed core validation.` on success and a
line-oriented error list on failure.

- [ ] **Step 6: Run focused tests and mutation proofs**

Repeat Step 3 and expect all tests to pass. Temporarily move cleanup outside
`finally`; the checksum-failure cleanup test must fail. Restore. Temporarily
throw the candidate-local Base UI checksum error from the outer run; the
continue-to-Zag test must fail. Restore. Temporarily permit adapter paths
outside `candidates/`; the symlink-escape test must fail. Restore and rerun
green.

- [ ] **Step 7: Commit core composition**

```bash
git add tools/overlay-foundation-evaluation/runner/core.mjs \
  tools/overlay-foundation-evaluation/runner/core.test.mjs \
  tools/overlay-foundation-evaluation/scripts/check.mjs \
  tools/overlay-foundation-evaluation/scripts/check.test.mjs
git commit -m "feat: compose overlay evaluation preflight"
```

---

### Task 7: Repository wiring, documentation, full verification, and checkpoint

**Files:**

- Create: `tools/overlay-foundation-evaluation/README.md`
- Modify: `package.json`
- Modify: `docs/superpowers/baselines/lyra-v1/README.md`
- Verify unchanged: `pnpm-lock.yaml`
- Verify unchanged: `docs/superpowers/baselines/lyra-v1/program.json`

**Interfaces:**

- Consumes all focused test files from Tasks 1-6.
- Produces root commands `overlay:evaluate:core:test`,
  `overlay:evaluate:check`, and `overlay:evaluate:incumbent`.
- No root command runs `runCorePreflight`; external execution remains behind
  the candidate-manifest approval checkpoint.

- [ ] **Step 1: Write a root-script policy test before changing `package.json`**

Create `tools/overlay-foundation-evaluation/repository-policy.test.mjs` with:

```js
test('wires core tests without a production dependency or external manifest', async () => {
  const rootPackage = JSON.parse(await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'));
  assert.equal(
    rootPackage.scripts['overlay:evaluate:core:test'],
    'node --test tools/overlay-foundation-evaluation/*.test.mjs tools/overlay-foundation-evaluation/*/*.test.mjs',
  );
  assert.equal(
    rootPackage.scripts['overlay:evaluate:check'],
    'node tools/overlay-foundation-evaluation/scripts/check.mjs',
  );
  assert.equal(
    rootPackage.scripts['overlay:evaluate:incumbent'],
    'node tools/overlay-foundation-evaluation/scripts/incumbent.mjs',
  );
  assert.match(rootPackage.scripts.test, /pnpm overlay:evaluate:core:test/u);
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    for (const name of Object.keys(rootPackage[section] ?? {})) {
      assert.doesNotMatch(name, /radix|base-ui|zag/u);
    }
  }
  await assert.rejects(
    stat(resolve(repositoryRoot, 'tools/overlay-foundation-evaluation/candidates.json')),
    { code: 'ENOENT' },
  );
});
```

Also hash `pnpm-lock.yaml` and the V1 ledger at test start/end and assert they
are byte-identical.

- [ ] **Step 2: Run the policy test and observe RED**

Run:

```bash
node --test tools/overlay-foundation-evaluation/repository-policy.test.mjs
```

Expected: failure because the three root scripts are absent.

- [ ] **Step 3: Add exact root scripts and root test wiring**

Add:

```json
{
  "scripts": {
    "overlay:evaluate:core:test": "node --test tools/overlay-foundation-evaluation/*.test.mjs tools/overlay-foundation-evaluation/*/*.test.mjs",
    "overlay:evaluate:check": "node tools/overlay-foundation-evaluation/scripts/check.mjs",
    "overlay:evaluate:incumbent": "node tools/overlay-foundation-evaluation/scripts/incumbent.mjs"
  }
}
```

Insert `pnpm overlay:evaluate:core:test &&` in the root `test` command after
`pnpm security:check &&` and before package builds. Do not add a dependency,
workspace package, lockfile entry, or workflow.

- [ ] **Step 4: Document the exact boundaries and operator checkpoint**

The tool README must state:

```markdown
# Overlay foundation evaluation

This directory contains the approved repository-owned evaluation harness.
The core plan validates prospective manifests, verifies synthetic artifact and
installation behavior, and characterizes the incumbent Lyra packages.

No tracked `candidates.json` exists yet. Radix, Base UI, and Zag artifacts may
be added only after a separate operator approval that names every exact package,
version, registry tarball URL, SHA-256, license, and repository URL.

`pnpm overlay:evaluate:core:test` runs the core protocol tests.
`pnpm overlay:evaluate:check --manifest <path>` validates an explicit
prospective manifest without network access or installation.
`pnpm overlay:evaluate:incumbent --output <path>` builds and characterizes
the current clean Lyra revision into an explicit disposable output path.

These commands do not select a foundation or authorize production changes.
```

Update the V1 baseline README to link this implementation plan and retain the
statement that no candidate has been selected or installed.

- [ ] **Step 5: Run focused gates**

```bash
pnpm overlay:evaluate:core:test
pnpm v1-release:check
pnpm exec prettier --check \
  tools/overlay-foundation-evaluation \
  docs/superpowers/plans/2026-08-31-overlay-foundation-core-protocol.md \
  docs/superpowers/baselines/lyra-v1/README.md \
  package.json
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 6: Prove production dependency and ledger immutability**

```bash
git diff --exit-code origin/main -- pnpm-lock.yaml
git diff --exit-code origin/main -- packages
git diff --exit-code origin/main -- .github/workflows
node -e "const p=require('./docs/superpowers/baselines/lyra-v1/program.json'); const x=p.components.filter(c=>['Dialog','Drawer','BottomSheet','Popover','Dropdown','Tooltip','CommandPalette','WorkspaceSwitcher','CreateWorkspaceDialog'].includes(c.component)); if(x.some(c=>!['specified','planned'].includes(c.implementationStatus))) process.exit(1)"
```

Expected: all commands exit 0. The ledger check permits the pre-existing
`planned` support boundary while forbidding `evaluating`, `implementing`, and
`qualified` changes in this core plan.

- [ ] **Step 7: Run fresh root verification with owned temporary storage**

```bash
build_tmp=$(mktemp -d -p /home/francisross/tmp-builds overlay-core-final.XXXXXX)
TMPDIR="$build_tmp" pnpm run lint && \
TMPDIR="$build_tmp" pnpm run typecheck && \
TMPDIR="$build_tmp" pnpm test && \
TMPDIR="$build_tmp" pnpm run build && \
TMPDIR="$build_tmp" pnpm pack-smoke
status=$?
rm -rf "$build_tmp"
exit $status
```

Expected: every gate exits 0. Browser and React-compat matrices are not part of
this protocol-only plan because it changes no browser fixture or production
component.

- [ ] **Step 8: Self-review against the approved design**

Confirm all of the following from the staged diff:

- all production dependency and lockfile bytes are unchanged;
- no `candidates.json`, real vendor URL, real vendor checksum, workflow, or
  browser scenario was added;
- every filesystem deletion is limited to a token-verified owned run root;
- lifecycle scripts are both rejected during composed preflight and disabled
  by the actual install command;
- the checker performs validation only;
- evidence preserves attempt 1 and cannot emit a score or winner;
- the incumbent characterization emits identity and artifact facts, not
  behavioral PASS claims; and
- all new functions are exercised by at least one real filesystem or command
  integration test in addition to pure validation tests.

- [ ] **Step 9: Commit repository wiring and documentation**

```bash
git add package.json \
  tools/overlay-foundation-evaluation/README.md \
  tools/overlay-foundation-evaluation/repository-policy.test.mjs \
  docs/superpowers/baselines/lyra-v1/README.md
git commit -m "test: gate overlay evaluation core"
```

- [ ] **Step 10: Stop at the external-artifact checkpoint**

Report the commit range, focused/root gate results, incumbent characterization
hashes, and clean worktree. Request separate approval before creating the real
four-candidate `candidates.json`, downloading Radix/Base UI/Zag, pushing the
branch, opening or merging a PR, or dispatching any remote workflow.
