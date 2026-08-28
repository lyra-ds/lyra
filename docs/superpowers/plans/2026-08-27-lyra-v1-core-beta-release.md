# Lyra V1 Core Beta Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a review-ready Lyra beta candidate that supports an explicit Automated Core evidence profile, publishes truthful component stability, and preserves every existing automated release gate.

**Architecture:** Extend the existing FileUpload ingestion seam with an explicit profile while leaving the Full profile and its transaction unchanged. Add lifecycle stability to the docs component manifest independently from adapter support, then guard the public and normative release claims with one focused policy checker inside the existing `lint` CI job. Remote evidence, pull-request merge, and npm publication remain separate operator checkpoints.

**Tech Stack:** Node.js 24, TypeScript 5.9, React 19 docs, Vitest 4, Node test runner, Playwright 1.62.1, pnpm 11, Changesets, GitHub Actions, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-08-27-lyra-v1-core-beta-release-design.md`

## Global Constraints

- The consolidated beta publishes `@lyra-ds/styles@0.5.0`, `@lyra-ds/react@0.5.0`, and `@lyra-ds/alpine@0.6.0`; it does not publish `1.0.0`.
- The default Full ingestion profile retains its existing CLI, validation, rendered Markdown, filesystem transaction, and idempotence behavior.
- Automated Core is selected only by `--profile automated-core`, accepts no `--bundle`, and requires passing `DF-FU-17` and `DF-FU-18` records for one exact immutable deployment revision.
- Missing manual evidence is rendered as `deferred-by-release-profile`; it is never omitted silently or represented as `PASS`.
- FileUpload is the only `Stable` component in this beta; every other catalog component is explicitly `Beta`.
- Chromium, Firefox, and WebKit remain pinned to the repository's Playwright 1.62.1 container and lockfile revisions.
- The existing CI job names `lint`, `typecheck`, `test`, and `build` must not change.
- Do not alter Tabs, DataTable, overlays, or unrelated component runtime behavior in this plan.
- Use a unique directory below `/home/francisross/tmp-builds` for every build or test command whose temporary footprint is large or unknown; set `TMPDIR` only for that command and remove only that exact directory afterward.
- Prefix every shell command with `rtk`.
- Push, workflow dispatch, PR creation, merge, production deployment, and npm publication occur only at the explicit checkpoints in Tasks 4 and 5.

---

### Task 1: Add the Automated Core ingestion profile

**Files:**

- Modify: `tools/file-upload-evidence/scripts/ingest.mjs:23-267`
- Modify: `tools/file-upload-evidence/scripts/ingest.mjs:1160-1325`
- Test: `tools/file-upload-evidence/scripts/ingest.test.mjs:587-1160`
- Test: `tools/file-upload-evidence/scripts/ingest.test.mjs:1160-2068`

**Interfaces:**

- Consumes: existing `readEvidenceArchive`, `validateManifest`, `validateAutomatedResult`, archive/member caps, identity validation, Markdown escaping, and no-clobber publication transaction.
- Produces: `parseIngestArgs(argv) -> { automationPath, bundlePaths, profile }`, where `profile` is `'full' | 'automated-core'`.
- Produces: `ingestEvidence({ automationPath, bundlePaths, profile?, repositoryRoot? }, fsOverrides?)`; omitted `profile` means `'full'`.
- Preserves: `runIngestCli`, destination naming, return shape `{ destinationDirectory, markdownPath, revision, status }`, Full-profile bytes, recovery journal format, and transaction digest rules.

- [ ] **Step 1: Write failing parser and option-topology tests**

Extend `describe('parseIngestArgs')` with these exact expectations:

```js
assert.deepEqual(parseIngestArgs(['--automation', 'automation.zip', '--bundle', 'combined.zip']), {
  automationPath: 'automation.zip',
  bundlePaths: ['combined.zip'],
  profile: 'full',
});

assert.deepEqual(
  parseIngestArgs(['--profile', 'automated-core', '--automation', 'automation.zip']),
  {
    automationPath: 'automation.zip',
    bundlePaths: [],
    profile: 'automated-core',
  },
);
```

Add rejection cases for duplicate `--profile`, unknown profile, missing profile value, Automated Core with any `--bundle`, Full profile without a bundle, and a bare automation archive without `--profile automated-core`.

- [ ] **Step 2: Run the focused parser test and record the RED**

Run:

```bash
rtk zsh -c 'run_tmp=$(mktemp -d -p /home/francisross/tmp-builds lyra-v1-core-ingest-red.XXXXXX); trap '\''rm -rf -- "$run_tmp"'\'' EXIT; TMPDIR="$run_tmp" node --test --test-name-pattern="parseIngestArgs" tools/file-upload-evidence/scripts/ingest.test.mjs'
```

Expected: FAIL because `--profile` is unsupported and Full results do not contain `profile: 'full'`.

- [ ] **Step 3: Implement strict profile parsing and option validation**

Add the profile constants near the required scenario arrays:

```js
const INGEST_PROFILE = Object.freeze({
  AUTOMATED_CORE: 'automated-core',
  FULL: 'full',
});
```

Update `parseIngestArgs` to accept only `--automation`, `--bundle`, and `--profile`. It must parse option/value pairs in any order, reject duplicates, default to `INGEST_PROFILE.FULL`, and enforce this topology after parsing:

```js
if (automationPath === undefined) {
  throw argumentError('--automation is required');
}
if (profile === INGEST_PROFILE.AUTOMATED_CORE && bundlePaths.length !== 0) {
  throw argumentError('--profile automated-core does not accept --bundle');
}
if (profile === INGEST_PROFILE.FULL && bundlePaths.length < 1) {
  throw argumentError('the full profile requires one or two --bundle options');
}
return { automationPath, bundlePaths, profile };
```

Extract one `normalizedIngestOptions(options)` helper used by both the programmatic and CLI paths. It must default an omitted programmatic profile to `full`, require zero bundles for Automated Core, require one or two bundles for Full, and keep the current `TypeError` boundary for malformed programmatic input.

- [ ] **Step 4: Run the parser tests and confirm GREEN**

Run the Step 2 command again.

Expected: PASS for all `parseIngestArgs` tests.

- [ ] **Step 5: Write failing end-to-end Automated Core tests**

Add an `it('publishes deterministic Automated Core evidence without manual claims', ...)` test that calls:

```js
const outcome = await ingestEvidence({
  automationPath: inputs.automationPath,
  bundlePaths: [],
  profile: 'automated-core',
  repositoryRoot: repository.repositoryRoot,
});
```

Assert:

```js
assert.deepEqual([...outputFiles.keys()].sort(), [
  ...AUTOMATED_ARTIFACTS,
  'automation/DF-FU-17.json',
  'automation/DF-FU-18.json',
]);
assert.match(markdown, /Release profile: \*\*Automated Core\*\*/u);
assert.match(markdown, /Overall automated result: \*\*PASS\*\*/u);
assert.match(markdown, /Manual assistive-technology evidence: `deferred-by-release-profile`/u);
assert.doesNotMatch(markdown, /DF-FU-M01|DF-FU-M02|Reviewer:|NVDA|VoiceOver/u);
```

Add separate cases proving:

- a failed, partial, duplicate, malformed, or identity-mismatched automation archive creates no destination;
- Automated Core reruns are byte-identical and return `status: 'idempotent'`;
- a conflicting destination is preserved without overwrite;
- the existing combined and separate Full-profile tests still produce their previous exact file lists and manual Markdown sections.

- [ ] **Step 6: Run the Automated Core tests and record the RED**

Run:

```bash
rtk zsh -c 'run_tmp=$(mktemp -d -p /home/francisross/tmp-builds lyra-v1-core-ingest-e2e-red.XXXXXX); trap '\''rm -rf -- "$run_tmp"'\'' EXIT; TMPDIR="$run_tmp" node --test --test-name-pattern="Automated Core|automated-core" tools/file-upload-evidence/scripts/ingest.test.mjs'
```

Expected: FAIL because `ingestEvidence` still requires manual bundles and `renderMarkdown` always renders manual records.

- [ ] **Step 7: Implement conditional collection, output, and rendering**

Normalize the options at the start of `ingestEvidence`. Read manual archives and call `collectManualRecords` only for the Full profile. Pass `profile` into `buildOutputFiles` and `renderMarkdown`.

Keep the current manual loops byte-for-byte under `profile === 'full'`. For Automated Core, build records from `REQUIRED_AUTOMATED` only and add these Markdown lines before the scenario table:

```js
'- Release profile: **Automated Core**',
'- Overall automated result: **PASS**',
'- Manual assistive-technology evidence: `deferred-by-release-profile`',
```

The scenario table must contain only `DF-FU-17` and `DF-FU-18`. Do not emit the `## Manual assistive-technology evidence` section in Automated Core. Use `[automationManifest]` and the automated records as the complete identity input when no manual archives exist.

- [ ] **Step 8: Run the complete ingestion suite**

Run:

```bash
rtk zsh -c 'run_tmp=$(mktemp -d -p /home/francisross/tmp-builds lyra-v1-core-ingest-green.XXXXXX); trap '\''rm -rf -- "$run_tmp"'\'' EXIT; TMPDIR="$run_tmp" node --test tools/file-upload-evidence/scripts/archive.test.mjs tools/file-upload-evidence/scripts/ingest.test.mjs'
```

Expected: PASS with zero skipped or failed tests; all pre-existing transaction, race, recovery, archive-hostility, and Full-profile tests remain green.

- [ ] **Step 9: Run formatting and syntax checks**

Run:

```bash
rtk pnpm exec prettier --check tools/file-upload-evidence/scripts/ingest.mjs tools/file-upload-evidence/scripts/ingest.test.mjs
rtk node --check tools/file-upload-evidence/scripts/ingest.mjs
rtk git diff --check
```

Expected: all exit 0.

- [ ] **Step 10: Commit the ingestion profile**

```bash
rtk git add tools/file-upload-evidence/scripts/ingest.mjs tools/file-upload-evidence/scripts/ingest.test.mjs
rtk git commit -m "feat: add automated core evidence profile"
```

---

### Task 2: Publish explicit component stability

**Files:**

- Modify: `apps/docs/lib/components.ts:16-364`
- Modify: `apps/docs/lib/support-matrix.ts:12-103`
- Modify: `apps/docs/lib/support-matrix.test.ts:1-158`
- Modify: `apps/docs/components/support-matrix.tsx:28-91`
- Modify: `apps/docs/messages/en.json:96-122`
- Modify: `apps/docs/messages/pt-BR.json:96-122`
- Modify: `apps/docs/content/docs/en/guides/support.mdx:6-34`
- Modify: `apps/docs/content/docs/pt-BR/guides/support.mdx:6-34`

**Interfaces:**

- Produces: `componentStabilities = ['experimental', 'beta', 'stable', 'deprecated'] as const`.
- Produces: `ComponentStability` and required `ComponentEntry.stability`.
- Produces: `SupportMatrixRow.stability`, independent of `SupportMatrixRow.stacks`.
- Preserves: `supportLevels`, stack availability, Blade snapshot logic, component ordering, routes, and page tabs.

- [ ] **Step 1: Write failing stability-model tests**

Import `componentStabilities` from `components.ts` and add:

```ts
it('publishes an explicit lifecycle for every component', () => {
  expect(components.every((entry) => componentStabilities.includes(entry.stability))).toBe(true);
  expect(getSupportMatrixRows().map(({ slug, stability }) => [slug, stability])).toEqual(
    components.map(({ slug, stability }) => [slug, stability]),
  );
});

it('stabilizes only FileUpload in the consolidated beta', () => {
  expect(
    components.filter((entry) => entry.stability === 'stable').map((entry) => entry.slug),
  ).toEqual(['file-upload']);
  expect(components.filter((entry) => entry.stability === 'beta')).toHaveLength(
    components.length - 1,
  );
});
```

Read both message files in the test and assert they contain labels for all four lifecycle values plus the Stability column heading.

- [ ] **Step 2: Run the docs matrix test and record the RED**

Run:

```bash
rtk zsh -c 'run_tmp=$(mktemp -d -p /home/francisross/tmp-builds lyra-v1-core-stability-red.XXXXXX); trap '\''rm -rf -- "$run_tmp"'\'' EXIT; TMPDIR="$run_tmp" pnpm --filter @lyra-ds/docs exec vitest run lib/support-matrix.test.ts'
```

Expected: FAIL because no lifecycle field or labels exist.

- [ ] **Step 3: Add the exhaustive lifecycle type and manifest values**

Add near `supportLevels`:

```ts
export const componentStabilities = ['experimental', 'beta', 'stable', 'deprecated'] as const;
export type ComponentStability = (typeof componentStabilities)[number];
```

Add this required field to `ComponentEntry`:

```ts
/** Public lifecycle, independent from which adapters implement the component. */
stability: ComponentStability;
```

Add `stability: 'stable'` to the FileUpload manifest entry. Add `stability: 'beta'` explicitly to every other manifest entry. Do not introduce a default, post-map fallback, slug set, or inferred group rule; TypeScript must reject every future entry that omits lifecycle review.

- [ ] **Step 4: Carry stability through the pure support-matrix model**

Extend the row type and mapping:

```ts
export type SupportMatrixRow = {
  slug: string;
  name: string;
  stability: ComponentStability;
  stacks: Record<DocStack, SupportCell>;
};

return components.map((entry) => ({
  slug: entry.slug,
  name: entry.name,
  stability: entry.stability,
  stacks: {
    react: supportCell('react', entry.stacks, entry.absence),
    html: supportCell('html', entry.stacks, entry.absence),
    alpine: supportCell('alpine', entry.stacks, entry.absence),
    blade: bladeSupportCell(entry.slug, entry.stacks, bladeComponents, entry.absence),
  },
}));
```

- [ ] **Step 5: Render and localize the separate Stability column**

Add these keys to both locale files:

```json
"componentStability": "Stability",
"componentStabilityExperimental": "Experimental",
"componentStabilityBeta": "Beta",
"componentStabilityStable": "Stable",
"componentStabilityDeprecated": "Deprecated"
```

Use `"Estabilidade"`, `"Experimental"`, `"Beta"`, `"Estável"`, and `"Descontinuado"` in `pt-BR.json`.

Add a `stability` column immediately after `component` in `SupportMatrix`. Render it from `row.stability` with the corresponding message key; do not derive it from React/Alpine/Blade support cells.

- [ ] **Step 6: Update the public support explanation**

In both support guides, add a `Component stability` / `Estabilidade dos componentes` section that says:

```md
Lifecycle stability is separate from adapter availability. FileUpload is Stable under the Automated Core profile. Every other catalog entry remains Beta in this release; Tabs, DataTable, and the overlay family are the named P1 migration boundary for the later 1.0.0 release.
```

Use equivalent natural Brazilian Portuguese, explicitly retaining the tokens `FileUpload`, `Automated Core`, `Beta`, `P1`, and `1.0.0`.

- [ ] **Step 7: Run focused docs tests and typecheck**

Run:

```bash
rtk zsh -c 'run_tmp=$(mktemp -d -p /home/francisross/tmp-builds lyra-v1-core-stability-green.XXXXXX); trap '\''rm -rf -- "$run_tmp"'\'' EXIT; TMPDIR="$run_tmp" pnpm --filter @lyra-ds/docs exec vitest run lib/support-matrix.test.ts'
rtk pnpm --filter @lyra-ds/docs run typecheck
rtk pnpm exec prettier --check apps/docs/lib/components.ts apps/docs/lib/support-matrix.ts apps/docs/lib/support-matrix.test.ts apps/docs/components/support-matrix.tsx apps/docs/messages/en.json apps/docs/messages/pt-BR.json apps/docs/content/docs/en/guides/support.mdx apps/docs/content/docs/pt-BR/guides/support.mdx
rtk git diff --check
```

Expected: all exit 0.

- [ ] **Step 8: Commit the public stability model**

```bash
rtk git add apps/docs/lib/components.ts apps/docs/lib/support-matrix.ts apps/docs/lib/support-matrix.test.ts apps/docs/components/support-matrix.tsx apps/docs/messages/en.json apps/docs/messages/pt-BR.json apps/docs/content/docs/en/guides/support.mdx apps/docs/content/docs/pt-BR/guides/support.mdx
rtk git commit -m "docs: publish v1 core stability"
```

---

### Task 3: Reconcile release policy and guard it in CI

**Files:**

- Create: `tools/v1-core/check.mjs`
- Create: `tools/v1-core/check.test.mjs`
- Modify: `package.json:7-36`
- Modify: `.github/workflows/ci.yml:15-54`
- Modify: `docs/superpowers/specs/lyra-v1/README.md:1-170`
- Modify: `docs/superpowers/specs/lyra-v1/03-interaction-accessibility.md:19-48`
- Modify: `docs/superpowers/specs/lyra-v1/04-component-architecture.md:17-40`
- Modify: `docs/superpowers/specs/lyra-v1/05-quality-performance.md:19-48`
- Modify: `docs/superpowers/specs/2026-08-13-lyra-v1-phase-1-system-accessibility-design.md:1-62`
- Modify: `docs/superpowers/specs/2026-08-15-data-files-family-design.md:1-31`
- Modify: `docs/superpowers/plans/2026-08-16-file-upload-controlled-lifecycle.md:1-31`
- Modify: `docs/superpowers/plans/2026-08-16-file-upload-controlled-lifecycle.md:1009-1121`
- Modify: `docs/superpowers/plans/2026-08-18-file-upload-evidence-resume.md:1-33`
- Modify: `docs/superpowers/baselines/lyra-v1/README.md:1-88`
- Modify: `apps/docs/content/docs/en/guides/support.mdx:12-27`
- Modify: `apps/docs/content/docs/pt-BR/guides/support.mdx:12-27`

**Interfaces:**

- Produces: `validateV1CorePolicy(inputs) -> string[]`, a pure validator used by tests and the CLI.
- Produces: root command `pnpm v1-core:check`.
- Preserves: Full-profile manual instructions as an optional stricter workflow; Automated Core becomes the active beta release path.
- Preserves: the four CI job names and every existing job step.

- [ ] **Step 1: Write failing policy-validator tests**

Create `tools/v1-core/check.test.mjs` with fixture-based Node tests for:

```js
assert.deepEqual(
  validateV1CorePolicy({
    ci: '- run: pnpm v1-core:check\n- run: pnpm run test:browsers\n',
    design: 'Automated Core',
    documents: {
      supportEn:
        'CI runs Chromium, Firefox, and WebKit. Manual evidence: deferred-by-release-profile.',
      supportPt:
        'O CI executa Chromium, Firefox e WebKit. Evidência manual: deferred-by-release-profile.',
      phase0: 'CI runs Chromium, Firefox, and WebKit under Automated Core.',
      family: 'Implemented under Automated Core',
      resume: '--profile automated-core --automation',
    },
  }),
  [],
);
```

Add mutations that must each return one targeted error:

- CI omits `pnpm v1-core:check`;
- CI omits `pnpm run test:browsers`;
- either support guide says the current CI is Chromium-only;
- either guide omits the Automated Core deferral disclosure;
- Phase 0 omits the implemented three-engine matrix;
- the family spec omits the Automated Core amendment; and
- the active resume runbook still requires a manual bundle in its Automated Core command.

- [ ] **Step 2: Run the validator test and record the RED**

Run:

```bash
rtk node --test tools/v1-core/check.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `tools/v1-core/check.mjs`.

- [ ] **Step 3: Implement the focused policy checker**

Create `tools/v1-core/check.mjs`. Export `validateV1CorePolicy`, read the real files only in `main()`, and return precise errors instead of throwing from the pure validator. Use literal or narrow regular-expression checks for the approved design link, `Automated Core`, `deferred-by-release-profile`, the three browser names, the active ingestion command, and the existing CI steps.

The CLI must print this only on success:

```text
Lyra V1 Core policy is internally consistent.
```

On failure, print a heading followed by one error per line and set exit code 1.

- [ ] **Step 4: Add the normative Automated Core amendment**

Add a canonical `Automated Core release profile` section to `docs/superpowers/specs/lyra-v1/README.md` with this rule:

```md
A release explicitly using Automated Core requires every applicable automated layer and treats manual assistive-technology evidence as non-blocking post-release evidence. Missing manual evidence MUST be labeled `deferred-by-release-profile` and MUST NOT be represented as a pass. The Full profile retains the original manual requirements.
```

Add a short dated amendment linking to the canonical section and the approved design near the decision summary of Interaction, Component Architecture, Quality and Performance, and the Phase 1 design. Do not delete their manual-test definitions; scope their `MUST` release effects to Full-profile releases and preserve them as optional post-release procedures under Automated Core.

- [ ] **Step 5: Make the FileUpload runbooks profile-aware**

At the top of the Data and Files family spec, record Automated Core as the active beta gate and Full as the optional stricter path. Keep the header status `Approved` until Task 4 ingests exact candidate evidence.

Rewrite active Task 10 and the resume runbook so their Automated Core path is exactly:

```text
1. Produce a passing revision-bound automation archive.
2. Run `pnpm evidence:file-upload:ingest --profile automated-core --automation "$automation_archive"`, where `automation_archive` is the exact validated workflow download.
3. Review the explicit manual deferral, run every automated release gate, and commit the generated evidence.
```

Retain M01/M02 collection instructions under a clearly labeled `Optional Full profile` subsection. They must not appear in the Automated Core completion criteria.

- [ ] **Step 6: Correct the public and Phase 0 browser evidence claims**

Replace current-CI Chromium-only claims in both public support guides and the Phase 0 index with the exact implemented fact: CI runs the pinned Playwright 1.62.1 Chromium, Firefox, and WebKit matrix inside the existing `test` job. State that manual NVDA/VoiceOver evidence is deferred and non-blocking under Automated Core, not completed.

Do not claim Safari equals WebKit or claim that any assistive-technology review ran.

- [ ] **Step 7: Wire the checker into the existing lint context**

Add to root scripts:

```json
"v1-core:check": "node tools/v1-core/check.mjs"
```

Add this step after `pnpm release-policy:check` in `.github/workflows/ci.yml`:

```yaml
- run: pnpm v1-core:check
```

Do not add or rename a job.

- [ ] **Step 8: Run policy, docs, and repository-focused tests**

Run:

```bash
rtk node --test tools/v1-core/check.test.mjs
rtk pnpm v1-core:check
rtk zsh -c 'run_tmp=$(mktemp -d -p /home/francisross/tmp-builds lyra-v1-core-docs-green.XXXXXX); trap '\''rm -rf -- "$run_tmp"'\'' EXIT; TMPDIR="$run_tmp" pnpm --filter @lyra-ds/docs run test'
rtk pnpm run phase0:check
rtk pnpm run release-policy:check
rtk pnpm exec prettier --check tools/v1-core package.json .github/workflows/ci.yml docs/superpowers/specs/lyra-v1 docs/superpowers/specs/2026-08-13-lyra-v1-phase-1-system-accessibility-design.md docs/superpowers/specs/2026-08-15-data-files-family-design.md docs/superpowers/plans/2026-08-16-file-upload-controlled-lifecycle.md docs/superpowers/plans/2026-08-18-file-upload-evidence-resume.md docs/superpowers/baselines/lyra-v1/README.md apps/docs/content/docs/en/guides/support.mdx apps/docs/content/docs/pt-BR/guides/support.mdx
rtk git diff --check
```

Expected: all exit 0.

- [ ] **Step 9: Commit the release-policy reconciliation**

```bash
rtk git add tools/v1-core package.json .github/workflows/ci.yml docs/superpowers/specs/lyra-v1 docs/superpowers/specs/2026-08-13-lyra-v1-phase-1-system-accessibility-design.md docs/superpowers/specs/2026-08-15-data-files-family-design.md docs/superpowers/plans/2026-08-16-file-upload-controlled-lifecycle.md docs/superpowers/plans/2026-08-18-file-upload-evidence-resume.md docs/superpowers/baselines/lyra-v1/README.md apps/docs/content/docs/en/guides/support.mdx apps/docs/content/docs/pt-BR/guides/support.mdx
rtk git commit -m "docs: adopt automated core release policy"
```

---

### Task 4: Prove the beta candidate and ingest exact automated evidence

**Files:**

- Generated: `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/${candidate_sha}-accessibility.md`, where `candidate_sha` is read from the validated archive
- Generated: `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/${candidate_sha}-accessibility/`
- Modify after successful ingestion: `docs/superpowers/specs/2026-08-15-data-files-family-design.md:1-31`
- Modify after successful ingestion: `docs/superpowers/specs/2026-08-27-lyra-v1-core-beta-release-design.md:1-315`

**Interfaces:**

- Consumes: the committed implementation from Tasks 1-3 and the guarded `Deploy` evidence-preview workflow.
- Produces: one validated automation-only evidence pair for the exact pushed candidate SHA.
- Produces: Data and Files status `Implemented under Automated Core — FileUpload wave`; Table, DataTable, and FileManager remain boundary-only.
- Produces: a locally and remotely reviewable beta candidate; no production merge or npm publication.

- [ ] **Step 1: Run the complete local non-browser release matrix**

Run the small read-only checks directly. Run every compilation, test, build, package, archive, performance, or size command through the subshell helper below; each invocation creates and removes its own unique `TMPDIR`:

```bash
rtk pnpm run lint
rtk pnpm run parity
rtk pnpm changeset status
rtk git diff --check
rtk git status --short --branch
rtk zsh -c 'set -e; run_with_tmp() ( run_tmp=$(mktemp -d -p /home/francisross/tmp-builds lyra-v1-core-gate.XXXXXX); trap '\''rm -rf -- "$run_tmp"'\'' EXIT; TMPDIR="$run_tmp" "$@" ); run_with_tmp pnpm run typecheck; run_with_tmp pnpm run test; run_with_tmp pnpm run build; run_with_tmp pnpm run pack-smoke; run_with_tmp pnpm run smoke; run_with_tmp pnpm baseline:bundles --check; run_with_tmp pnpm performance:file-upload --check; run_with_tmp pnpm --filter @lyra-ds/react exec attw --pack . --profile node16; run_with_tmp pnpm --filter @lyra-ds/alpine exec attw --pack . --profile node16 --ignore-rules cjs-resolves-to-esm; run_with_tmp pnpm --filter @lyra-ds/react exec size-limit; run_with_tmp pnpm --filter @lyra-ds/alpine exec size-limit'
```

Expected: all code gates exit 0, the Changesets status includes minor releases for Styles, React, and Alpine, and the tracked worktree is clean. If local browsers are unavailable, report `UNAVAILABLE`; do not install or substitute browser revisions. The beta remains blocked until the later exact CI matrix passes.

- [ ] **Step 2: Attempt the pinned local browser and React-compat gates**

Run:

```bash
rtk docker compose -f compose.playwright.yml run --rm browser-tests
rtk zsh -c 'run_tmp=$(mktemp -d -p /home/francisross/tmp-builds lyra-v1-core-react-compat.XXXXXX); trap '\''rm -rf -- "$run_tmp"'\'' EXIT; TMPDIR="$run_tmp" pnpm run test:react-compat'
```

Expected: Chromium, Firefox, and WebKit suites plus React 18/19 types, SSR, and hydration pass. A missing image, browser executable, or network payload is `UNAVAILABLE`, not PASS; continue only to prepare the remote CI proof, not to release.

- [ ] **Step 3: Stop for authorization to push and dispatch evidence**

Report the exact candidate SHA, worktree status, local gate table, and any local browser unavailability. Request permission for these two external writes:

1. push `HEAD` to `origin/evidence/v1-core-beta`;
2. dispatch `deploy.yml` on that evidence ref.

Do not execute Step 4 until the user explicitly authorizes both actions.

- [ ] **Step 4: Push the candidate and run revision-bound automation**

After authorization:

```bash
rtk git push origin HEAD:refs/heads/evidence/v1-core-beta
rtk gh workflow run deploy.yml --repo lyra-ds/lyra --ref evidence/v1-core-beta
rtk gh run list --repo lyra-ds/lyra --workflow Deploy --branch evidence/v1-core-beta --limit 1
```

Resolve the run by exact head SHA and watch it:

```bash
rtk zsh -c 'candidate_sha=$(git rev-parse HEAD); run_id=$(gh run list --repo lyra-ds/lyra --workflow Deploy --branch evidence/v1-core-beta --event workflow_dispatch --limit 10 --json databaseId,headSha --jq "map(select(.headSha == \"$candidate_sha\"))[0].databaseId"); test -n "$run_id"; gh run watch "$run_id" --repo lyra-ds/lyra --exit-status'
```

Expected: `evidence-preview` succeeds, production `deploy` is skipped, and DF-FU-17/18 are both PASS.

- [ ] **Step 5: Download and ingest the exact workflow artifact**

Resolve the workflow by exact head SHA, create a unique run directory, download the exact artifact, require exactly one matching ZIP, and ingest it before removing the download directory:

```bash
rtk zsh -c 'candidate_sha=$(git rev-parse HEAD); revision_prefix=${candidate_sha:0:12}; run_id=$(gh run list --repo lyra-ds/lyra --workflow Deploy --branch evidence/v1-core-beta --event workflow_dispatch --limit 10 --json databaseId,headSha --jq "map(select(.headSha == \"$candidate_sha\"))[0].databaseId"); run_tmp=$(mktemp -d -p /home/francisross/tmp-builds lyra-v1-core-download.XXXXXX); trap '\''rm -rf -- "$run_tmp"'\'' EXIT; gh run download "$run_id" --repo lyra-ds/lyra --name "file-upload-automation-$revision_prefix.zip" --dir "$run_tmp"; automation_archive=$(find "$run_tmp" -type f -name "file-upload-automation-$revision_prefix.zip" -print); test "$(printf "%s\n" "$automation_archive" | sed '/^$/d' | wc -l)" -eq 1; pnpm evidence:file-upload:ingest --profile automated-core --automation "$automation_archive"'
```

Expected: one Markdown file and one sibling artifact directory are created for the archive's exact 40-character revision. Review both; the trap removes only the unique download directory.

- [ ] **Step 6: Promote the evidenced FileUpload lifecycle**

Change the Data and Files family header to:

```md
**Status:** Implemented under Automated Core — FileUpload wave
```

Keep `Table`, `DataTable`, and `FileManager` marked boundary-only. In the beta design, mark acceptance items complete only when their corresponding implementation, evidence, and gate actually passed; leave remote PR, merge, and publication items unchecked.

- [ ] **Step 7: Re-run focused evidence and documentation gates**

Run:

```bash
rtk zsh -c 'run_tmp=$(mktemp -d -p /home/francisross/tmp-builds lyra-v1-core-evidence-final.XXXXXX); trap '\''rm -rf -- "$run_tmp"'\'' EXIT; TMPDIR="$run_tmp" node --test tools/file-upload-evidence/scripts/archive.test.mjs tools/file-upload-evidence/scripts/automation.test.mjs tools/file-upload-evidence/scripts/ingest.test.mjs'
rtk pnpm v1-core:check
rtk pnpm run lint
rtk pnpm run typecheck
rtk git diff --check
```

Expected: all exit 0 and the generated report contains only Automated Core scenarios plus the explicit manual deferral.

- [ ] **Step 8: Commit exact automated evidence**

Stage only the generated revision-named pair, the family status, and the checked design:

```bash
rtk git add docs/superpowers/baselines/lyra-v1/comparisons/file-upload docs/superpowers/specs/2026-08-15-data-files-family-design.md docs/superpowers/specs/2026-08-27-lyra-v1-core-beta-release-design.md
rtk git commit -m "docs: record automated core evidence"
rtk git status --short --branch
```

Expected: clean tracked worktree. The evidence-only commit may be newer than the evidenced implementation SHA; it must not alter package, harness, workflow, lockfile, or fixture bytes.

---

### Task 5: Open, validate, merge, and publish the consolidated beta

**Files:**

- Remote pull request from `evidence/v1-core-beta` to `main`
- Changesets-generated version pull request after the beta implementation merges
- npm and GitHub releases for Styles `0.5.0`, React `0.5.0`, and Alpine `0.6.0`

**Interfaces:**

- Consumes: the clean evidenced branch from Task 4.
- Produces: a merged beta implementation only after exact PR CI passes.
- Produces: published beta package versions only after a second explicit authorization.
- Preserves: production deploy and npm OIDC workflows as the only deployment/publication owners.

- [ ] **Step 1: Stop for authorization to update the remote branch and open the PR**

Report the final branch SHA, evidence run URL, generated evidence paths, local gate results, and commit list. Request explicit permission to push the evidence commit and create the pull request. Do not merge anything in this step.

- [ ] **Step 2: Push and open the beta pull request**

After authorization:

```bash
rtk git push origin HEAD:refs/heads/evidence/v1-core-beta
rtk zsh -c 'candidate_sha=$(git rev-parse HEAD); evidence_url=$(gh run list --repo lyra-ds/lyra --workflow Deploy --branch evidence/v1-core-beta --event workflow_dispatch --limit 1 --json url --jq ".[0].url"); gh pr create --repo lyra-ds/lyra --base main --head evidence/v1-core-beta --title "feat: ship the Lyra V1 Core beta" --body "## Summary

- publish the controlled FileUpload contract and Automated Core evidence profile
- expose FileUpload as Stable while the remaining catalog stays Beta
- target Styles/React 0.5.0 and Alpine 0.6.0

## Evidence

- candidate: $candidate_sha
- revision-bound run: $evidence_url
- manual NVDA/VoiceOver status: deferred-by-release-profile

## Remaining 1.0 boundary

Tabs, DataTable, and overlays remain Beta/P1 migration work. See the committed V1 Core design and generated accessibility evidence for the exact contracts and gates."'
```

Expected: the PR body identifies the beta versions, Automated Core manual deferral, exact evidence run, and remaining Beta/P1 families. Add the verified command table as a PR comment if it does not fit the body; do not create a persistent temporary body file.

- [ ] **Step 3: Monitor required CI and resolve only evidenced failures**

Run:

```bash
rtk zsh -c 'pr_number=$(gh pr list --repo lyra-ds/lyra --state open --head evidence/v1-core-beta --json number --jq ".[0].number"); test -n "$pr_number"; gh pr checks "$pr_number" --repo lyra-ds/lyra --watch --fail-fast'
```

Expected: `lint`, `typecheck`, `test`, and `build` all pass on the exact PR head. The `test` job must visibly execute Chromium, Firefox, WebKit, and React compatibility inside the pinned container. Classify any failure before editing; do not retry away a product or contract failure.

- [ ] **Step 4: Stop for merge authorization**

When CI and review are green, report the exact merge candidate SHA, checks, review findings, deployment effect, and the fact that merging to `main` will update production docs and the Changesets version PR. Request explicit merge authorization.

- [ ] **Step 5: Merge the beta implementation and verify downstream workflows**

After authorization, merge with the repository's normal merge strategy and then verify:

```bash
rtk zsh -c 'pr_number=$(gh pr list --repo lyra-ds/lyra --state open --head evidence/v1-core-beta --json number --jq ".[0].number"); test -n "$pr_number"; gh pr merge "$pr_number" --repo lyra-ds/lyra --merge'
rtk gh run list --repo lyra-ds/lyra --branch main --limit 10
rtk gh pr list --repo lyra-ds/lyra --state open --head changeset-release/main --json number,state,headRefOid,mergeStateStatus,statusCheckRollup,url
```

Expected: main CI and production Deploy succeed; the Changesets release PR is updated or replaced with a current version PR whose package files resolve to Styles `0.5.0`, React `0.5.0`, and Alpine `0.6.0`.

- [ ] **Step 6: Stop for npm publication authorization**

Report the exact version PR number and SHA, package versions, changelog sections, CI results, production documentation URL, and publication side effects. Request explicit permission to merge the version PR. Do not merge it without that response.

- [ ] **Step 7: Publish and verify the beta packages**

After authorization, merge the current version PR and monitor the Release workflow. Verify registry and release state without substituting local artifacts:

```bash
rtk zsh -c 'version_pr_number=$(gh pr list --repo lyra-ds/lyra --state open --head changeset-release/main --json number --jq ".[0].number"); test -n "$version_pr_number"; gh pr merge "$version_pr_number" --repo lyra-ds/lyra --merge'
rtk gh run list --repo lyra-ds/lyra --workflow Release --branch main --limit 3
rtk zsh -c 'release_run_id=$(gh run list --repo lyra-ds/lyra --workflow Release --branch main --limit 1 --json databaseId --jq ".[0].databaseId"); test -n "$release_run_id"; gh run watch "$release_run_id" --repo lyra-ds/lyra --exit-status'
rtk npm view @lyra-ds/styles@0.5.0 version dist.integrity dist.tarball
rtk npm view @lyra-ds/react@0.5.0 version dist.integrity dist.tarball
rtk npm view @lyra-ds/alpine@0.6.0 version dist.integrity dist.tarball
rtk gh release view @lyra-ds/styles@0.5.0 --repo lyra-ds/lyra
rtk gh release view @lyra-ds/react@0.5.0 --repo lyra-ds/lyra
rtk gh release view @lyra-ds/alpine@0.6.0 --repo lyra-ds/lyra
```

Expected: all three registry versions, provenance-bearing tarballs, tags, and GitHub releases exist and match the version PR. Run a fresh packed-consumer smoke against the registry versions if the release workflow does not already record an equivalent post-publication resolution check.

- [ ] **Step 8: Record the beta outcome and stop**

Report the merged implementation PR, published package versions, release run, production docs deployment, evidence run, known Beta/P1 families, and the deferred manual evidence status. Do not begin Tabs, DataTable, or overlay migrations in this plan; each requires its own approved family design and implementation plan before the deliberate `1.0.0` milestone.
