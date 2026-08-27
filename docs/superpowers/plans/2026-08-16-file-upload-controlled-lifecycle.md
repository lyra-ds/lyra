# FileUpload Controlled Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace React and Alpine FileUpload's synthetic timer lifecycle with the approved consumer-controlled selection, progress, retry, cancellation, success, error, and removal contract.

**Architecture:** React and Alpine keep separate runtimes but expose the same discriminated item model, proposed identities, intent names, state rendering, and acceptance scenario IDs. React receives a required controlled `items` collection; Alpine reconciles `items` through `setItems()` and `x-modelable`. Native file input, native progress, shared CSS anatomy, versioned performance evidence, and explicit Blade absence complete the public contract.

**Tech Stack:** TypeScript, React 18/19, Alpine 3, CSS, Vitest Browser Mode, Playwright Chromium/Firefox/WebKit, axe, pnpm, tsdown, Next.js docs, Changesets, Vite, Size Limit, Node test runner.

## Global Constraints

### 2026-08-26 amendment: FileUpload evidence simplification

The approved
[`2026-08-26 FileUpload Evidence Simplification Design`](../specs/2026-08-26-file-upload-evidence-simplification-design.md)
supersedes Task 10's manual M03/M04 evidence protocol.

```text
Manual: DF-FU-M01 and DF-FU-M02, actual AT environments, local media, reviewer approval.
Automated: DF-FU-17 and DF-FU-18, exact immutable deployment revision, workflow ZIP.
Completion: one PASS for each ID, one revision, one immutable deployment, successful ingestion.
```

Task 10 uses local evidence ZIPs for the two manual records and the passing
`file-upload-automation-<revision-prefix>.zip` for `DF-FU-17` and `DF-FU-18`.
It invokes `pnpm evidence:file-upload:ingest --automation <path> --bundle <path> [--bundle <path>]`.
Any remaining Task 10 references to manual `DF-FU-M03`/`DF-FU-M04` are
superseded historical plan context, not active instructions or release
conditions; they do not assert that either scenario ran.

- Follow [the approved family specification](../specs/2026-08-15-data-files-family-design.md) exactly; Table, DataTable, and FileManager runtime APIs are out of scope.
- Every shell command starts with `rtk`; use `rtk proxy` only when unfiltered output is required.
- Use test-driven development: add one failing `DF-FU-*` acceptance case, run it and observe the expected failure, implement the smallest contract slice, then rerun it.
- FileUpload never starts, completes, retries, or aborts transport and contains no timer-driven progress path.
- React remains compatible with `react >=18 <20` and `react-dom >=18 <20`; evidence covers React 18 and 19 types, build, SSR, hydration, and browser behavior.
- Browser behavior runs in Chromium, Firefox, and WebKit; no jsdom result substitutes for Browser Mode.
- Keep the existing React FileUpload `8 kB` Size Limit tripwire unless clean packed-artifact evidence and a separate approval justify a change.
- The complex-migration ceiling is `+3,000` Brotli bytes per affected consumer entry; it is not a target or permission to raise an absolute limit.
- Add no production dependency. A delta above `+3,000` bytes or a new primitive requires an approved ADR before implementation continues.
- Preserve the Phase 0 bundle baseline; create immutable comparison artifacts rather than overwriting `docs/superpowers/baselines/lyra-v1/bundles.{json,md}`.
- Coordinate controlled-breaking minor changesets for `@lyra-ds/react`, `@lyra-ds/alpine`, and `@lyra-ds/styles`.
- Blade is deferred: documentation must not claim that Blade v0.10.0 implements the new lifecycle.
- All new copy is localized. React message callbacks may be functions; Alpine option messages are serializable strings with documented interpolation tokens.
- Do not commit generated build directories, browser diagnostics, temporary tarballs, pnpm stores, or incomplete manual evidence.

---

## File map

### Shared acceptance vocabulary

- Create `tools/file-upload/scenarios.ts` — stable `DF-FU-01` through `DF-FU-16` identifiers consumed by React and Alpine tests.

### React

- Create `packages/react/src/file-upload/file-upload.types.ts` — all exported discriminated item, error, progress, message, intent, and prop types.
- Create `packages/react/src/file-upload/file-upload.utils.ts` — accept/max-size validation, state predicates, progress milestones, and message formatting with no React or browser side effects.
- Modify `packages/react/src/file-upload/file-upload.tsx` — controlled renderer, native input, identity proposals, intent locks, announcements, form synchronization, and focus recovery.
- Modify `packages/react/src/file-upload/index.ts` and `packages/react/src/index.ts` — public type exports.
- Replace `packages/react/src/file-upload/file-upload.browser.test.tsx` — `DF-FU-01` through `DF-FU-09`, `DF-FU-12`, `DF-FU-13`, and React half of `DF-FU-16`.
- Modify `packages/react/src/file-upload/file-upload.ssr.test.ts` — deterministic server anatomy and initial-state assertions.
- Create `packages/react/src/file-upload/file-upload.hydration.browser.test.tsx` — `DF-FU-10` real `hydrateRoot` coverage.

### Alpine

- Modify `packages/alpine/src/file-upload.ts` — serializable controlled model, bind helpers, exact composed intent events, reconciliation, and cleanup.
- Modify `packages/alpine/src/index.ts` — public types and registration mapping.
- Replace `packages/alpine/src/file-upload.browser.test.ts` — Alpine side of `DF-FU-01` through `DF-FU-09`, `DF-FU-11`, `DF-FU-12`, and `DF-FU-16`.

### Styles and canonical handoff

- Modify `handoff/components/files/files.css` and `packages/styles/components/files/files.css` together — native label/input/progress anatomy, action/state selectors, reflow, forced-colors, motion, and coarse-pointer targets.
- Create `packages/styles/tests/fixtures/file-upload.html` and `packages/styles/tests/file-upload.test.ts` — `DF-FU-13` computed-style and reflow evidence.
- Modify `tools/parity/baseline.json` — reviewed class inventory after the intentional handoff change.

### Compatibility, performance, docs, and release

- Create `tools/react-compat/file-upload.mjs`, `tools/react-compat/file-upload.test.mjs`, and fixed React 18/19 consumer fixtures — packed-package matrix.
- Modify `.github/workflows/ci.yml` and `package.json` — run the compatibility gate inside existing frozen `test`/`build` job names.
- Modify `tools/bundle-baseline/measure.mjs` and `tools/bundle-baseline/measure.test.mjs` — immutable `--compare`/`--accept-comparison` flow and current-reference checking.
- Create `tools/file-upload-performance/measure.mjs`, its deterministic Vite fixture, and Node tests — 100-item, 30-iteration production measurement.
- Create bundle and runtime comparison artifacts below `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/` only after implementation commits are clean.
- Replace the two FileUpload React examples and both localized component pages; update compatibility guides, component support metadata, translation messages, generated doc artifacts, and stack-section tests.
- Create `.changeset/controlled-file-upload.md`; after successful ingestion, create
  `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-accessibility.md`
  and its sibling `<revision>-accessibility/` directory.

---

### Task 1: Establish the shared public model and pure selection rules

**Files:**

- Create: `tools/file-upload/scenarios.ts`
- Create: `packages/react/src/file-upload/file-upload.types.ts`
- Create: `packages/react/src/file-upload/file-upload.utils.ts`
- Modify: `packages/react/src/file-upload/index.ts`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/file-upload/file-upload.browser.test.tsx`

**Interfaces:**

- Produces the exact `FileUploadProgress`, `FileUploadError`, six item states, `FileUploadSelection`, four intent types, `FileUploadMessages`, and `FileUploadProps` approved in specification section 5.1.
- Produces `validateFile(file, constraints): Extract<FileUploadError, { kind: 'validation' }> | null`, `isActive(item): boolean`, `canRetry(item): boolean`, `canRemove(item): boolean`, and `progressMilestone(previous, next): 25 | 50 | 75 | 100 | null`.
- Produces `FILE_UPLOAD_SCENARIOS`, an immutable object whose values begin with their stable `DF-FU-*` IDs.

- [ ] **Step 1: Replace legacy-prop tests with a failing controlled contract test**

```tsx
it(FILE_UPLOAD_SCENARIOS.selection, async () => {
  const onSelect = vi.fn();
  const file = new File(['pdf'], 'report.pdf', { type: 'application/pdf' });
  const screen = await render(
    <FileUpload
      accept=".pdf"
      items={[]}
      onSelect={onSelect}
      onRetry={vi.fn()}
      onCancel={vi.fn()}
      onRemove={vi.fn()}
    />,
  );

  await userEvent.upload(screen.getByLabelText('Drag files here or click to select'), file);

  expect(onSelect).toHaveBeenCalledOnce();
  expect(onSelect.mock.calls[0][0].selections[0]).toMatchObject({
    file,
    name: 'report.pdf',
    size: 3,
    type: 'application/pdf',
    proposedItem: { status: 'selected' },
  });
  expect(onSelect.mock.calls[0][0].selections[0].id).toBe(
    onSelect.mock.calls[0][0].selections[0].proposedItem.id,
  );
  expect(onSelect.mock.calls[0][0].selections[0].proposedAttemptId).toEqual(expect.any(String));
  expect(screen.container.querySelector('.lyra-upload__item')).toBeNull();
});
```

- [ ] **Step 2: Run the focused test and confirm the legacy API fails**

Run: `rtk pnpm --filter @lyra-ds/react exec vitest run --project browser --browser.name chromium src/file-upload/file-upload.browser.test.tsx -t "DF-FU-01"`

Expected: FAIL because `items`, the four intent callbacks, native label semantics, and proposed IDs do not exist.

- [ ] **Step 3: Add the exact types, scenario names, and pure helpers**

```ts
export const FILE_UPLOAD_SCENARIOS = {
  selection: 'DF-FU-01 native selection and validation proposals',
  lifecycle: 'DF-FU-02 controlled state graph and no synthetic progress',
  progress: 'DF-FU-03 determinate and indeterminate native progress',
  retry: 'DF-FU-04 retry creates a new attempt and rejects stale results',
  cancellation: 'DF-FU-05 cancel, canceling race, canceled, and teardown',
  removal: 'DF-FU-06 confirmed removal and post-commit focus fallback',
  single: 'DF-FU-07 single-file atomic replacement and active rejection',
  idempotence: 'DF-FU-08 pending-intent idempotence',
  form: 'DF-FU-09 native form synchronization and same-file reselection',
  hydration: 'DF-FU-10 SSR, hydration, and pre-hydration input preservation',
  alpine: 'DF-FU-11 Alpine delayed init, reconnect, no-JS, and cleanup',
  announcements: 'DF-FU-12 announcements and 25 percent milestones',
  presentation: 'DF-FU-13 themes, RTL, long names, zoom, reflow, forced colors, motion',
  packaging: 'DF-FU-14 public types, exports, packaging, and consumer installs',
  performance: 'DF-FU-15 standalone, CSS, scenario bundle, and runtime budgets',
  conformance: 'DF-FU-16 React/Alpine classes, data states, operations, and outcomes',
} as const;
```

Implement the public type block verbatim from specification section 5.1 in `file-upload.types.ts`. Keep `FileUploadProps` controlled-only and omit `children` and `defaultValue` from inherited root attributes.

```ts
export function validateFile(
  file: Pick<File, 'name' | 'size' | 'type'>,
  { accept, maxSizeMB }: { accept?: string; maxSizeMB?: number },
  messages: Pick<Required<FileUploadMessages>, 'validationAccept' | 'validationMaxSize'>,
): Extract<FileUploadError, { kind: 'validation' }> | null {
  if (accept && !matchesAccept(file, accept)) {
    return {
      kind: 'validation',
      code: 'accept',
      message: messages.validationAccept(file.name, accept),
      retryable: false,
    };
  }
  if (maxSizeMB !== undefined && file.size > maxSizeMB * 1_000_000) {
    return {
      kind: 'validation',
      code: 'max-size',
      message: messages.validationMaxSize(file.name, maxSizeMB),
      retryable: false,
    };
  }
  return null;
}

export function progressMilestone(previous: number, next: number): 25 | 50 | 75 | 100 | null {
  return ([100, 75, 50, 25] as const).find((value) => previous < value && next >= value) ?? null;
}
```

`matchesAccept` must split comma tokens, trim them, ignore invalid tokens, compare dot extensions case-insensitively, compare exact MIME values, and support only the native `audio/*`, `video/*`, and `image/*` wildcards.
When `multiple={false}`, selection proposes only the first file in the native list and does not dispatch identities for discarded entries.

- [ ] **Step 4: Add the minimal controlled root and rerun types plus selection**

Replace the internal `useState`, timers, `defaultItems`, and legacy callbacks with required controlled props. Render an empty `idle` root and dispatch selection proposals without rendering them locally.

Run:

```text
rtk pnpm --filter @lyra-ds/react run typecheck
rtk pnpm --filter @lyra-ds/react exec vitest run --project browser --browser.name chromium src/file-upload/file-upload.browser.test.tsx -t "DF-FU-01"
```

Expected: PASS; invalid accept and strict decimal max-size cases also return validation proposals without an `attemptId`.

- [ ] **Step 5: Commit the public model**

```text
rtk git add tools/file-upload/scenarios.ts packages/react/src/file-upload
rtk git add packages/react/src/index.ts
rtk git commit -m "feat(react): define controlled file upload contract"
```

---

### Task 2: Render the controlled React lifecycle with native semantics

**Files:**

- Modify: `packages/react/src/file-upload/file-upload.tsx`
- Modify: `packages/react/src/file-upload/file-upload.browser.test.tsx`
- Modify: `packages/react/src/file-upload/file-upload.ssr.test.ts`

**Interfaces:**

- Consumes `FileUploadItem`, state predicates, validation, and `FILE_UPLOAD_SCENARIOS` from Task 1.
- Produces `.lyra-upload` with `data-state="idle|active"`, `data-disabled`, one native labeled input, item rows with exact `data-state`, native progress, persistent live region, and state-appropriate buttons.

- [ ] **Step 1: Add failing lifecycle, progress, SSR, and axe assertions**

```tsx
it(FILE_UPLOAD_SCENARIOS.progress, async () => {
  const screen = await render(
    <FileUpload
      items={[
        {
          id: 'a',
          name: 'a.pdf',
          size: 1,
          type: 'application/pdf',
          status: 'uploading',
          attemptId: 'a-1',
          progress: { kind: 'determinate', value: 48 },
        },
        {
          id: 'b',
          name: 'b.pdf',
          size: 1,
          type: 'application/pdf',
          status: 'canceling',
          attemptId: 'b-1',
          progress: { kind: 'indeterminate' },
        },
      ]}
      onSelect={vi.fn()}
      onRetry={vi.fn()}
      onCancel={vi.fn()}
      onRemove={vi.fn()}
    />,
  );

  const progress = screen.container.querySelectorAll('progress.lyra-upload__bar');
  expect(progress[0]).toHaveAttribute('value', '48');
  expect(progress[1]).not.toHaveAttribute('value');
  expect(screen.container.querySelector('[data-state="uploading"]')).not.toBeNull();
  expect(screen.container.querySelector('[data-state="canceling"]')).not.toBeNull();
  await expectNoAxeViolations(screen.container);
});
```

Add SSR assertions for `<label`, `type="file"`, `aria-live="polite"`, `data-state="active"`, and `<progress` from controlled initial items.
Add disabled/required cases and a forwarded root-handler case proving the consumer native handler runs before Lyra checks `defaultPrevented`.

- [ ] **Step 2: Run the focused browser and SSR tests and observe missing anatomy**

```text
rtk pnpm --filter @lyra-ds/react exec vitest run --project browser --browser.name chromium src/file-upload/file-upload.browser.test.tsx -t "DF-FU-02|DF-FU-03"
rtk pnpm --filter @lyra-ds/react exec vitest run --project ssr src/file-upload/file-upload.ssr.test.ts
```

Expected: FAIL on native progress, controlled states, label/input relation, or server live region.

- [ ] **Step 3: Implement the data-driven renderer**

Use `useId()` for the input/live-region relationships and forward the public ref to the root. The server and first client tree must be deterministic.

```tsx
<div
  ref={ref}
  className={cx('lyra-upload', className)}
  data-state={items.length ? 'active' : 'idle'}
>
  <label
    className={cx('lyra-upload__zone', dragging && 'lyra-upload__zone--drag')}
    htmlFor={inputId}
  >
    <span className="lyra-upload__zone-icon" aria-hidden="true">
      <Icon name="cloud-upload" size={22} />
    </span>
    <span className="lyra-upload__zone-label">{label}</span>
    {resolvedHint && <span className="lyra-upload__zone-hint">{resolvedHint}</span>}
  </label>
  <input id={inputId} className="lyra-upload__input" type="file" />
  {items.length > 0 && <ul className="lyra-upload__list">{items.map(renderItem)}</ul>}
  <span className="lyra-upload__live lyra-visually-hidden" aria-live="polite" aria-atomic="true">
    {announcement}
  </span>
</div>
```

`renderItem` must use one stable `<li key={item.id} data-state={item.status}>`; render `progress` only for uploading/canceling; render cancel only for uploading, retry only for canceled/retryable transport errors, and remove only for selected/success/error/canceled. Keep pending actions present and disabled.

- [ ] **Step 4: Verify the state matrix in Chromium and SSR**

Run:

```text
rtk pnpm --filter @lyra-ds/react run typecheck
rtk pnpm --filter @lyra-ds/react exec vitest run --project browser --browser.name chromium src/file-upload/file-upload.browser.test.tsx -t "DF-FU-02|DF-FU-03"
rtk pnpm --filter @lyra-ds/react exec vitest run --project ssr src/file-upload/file-upload.ssr.test.ts
```

Expected: PASS with zero timer calls, no inferred success at 100 percent, and no initial announcement.

- [ ] **Step 5: Commit native controlled rendering**

```text
rtk git add packages/react/src/file-upload
rtk git commit -m "feat(react): render controlled upload lifecycle"
```

---

### Task 3: Add React retry, cancellation, idempotence, announcements, and focus recovery

**Files:**

- Modify: `packages/react/src/file-upload/file-upload.tsx`
- Modify: `packages/react/src/file-upload/file-upload.utils.ts`
- Modify: `packages/react/src/file-upload/file-upload.browser.test.tsx`

**Interfaces:**

- Produces proposed retry attempt IDs, locks keyed by `id/status/attemptId`, accepted-attempt history, announcement keys, and post-commit focus fallback.
- Emits `onRetry`, `onCancel`, and `onRemove` at most once until controlled state changes.

- [ ] **Step 1: Write failing race, lock, announcement, and focus tests**

```tsx
it(FILE_UPLOAD_SCENARIOS.retry, async () => {
  const onRetry = vi.fn();
  const screen = await render(
    <FileUpload
      items={[
        {
          id: 'report',
          name: 'report.pdf',
          size: 1,
          type: 'application/pdf',
          status: 'error',
          attemptId: 'attempt-1',
          error: { kind: 'transport', message: 'Network failed', retryable: true },
        },
      ]}
      onSelect={vi.fn()}
      onRetry={onRetry}
      onCancel={vi.fn()}
      onRemove={vi.fn()}
    />,
  );

  await screen.getByRole('button', { name: 'Retry report.pdf' }).click();
  await screen.getByRole('button', { name: 'Retry report.pdf' }).click();

  expect(onRetry).toHaveBeenCalledOnce();
  expect(onRetry).toHaveBeenCalledWith({
    id: 'report',
    previousAttemptId: 'attempt-1',
    proposedAttemptId: expect.any(String),
  });
  expect(screen.getByRole('button', { name: 'Retry report.pdf' })).toBeDisabled();
});
```

Add cases that commit the proposed attempt, then rerender an old attempt and assert the new attempt stays rendered; announce only 25/50/75/100 crossings; exercise localized message callbacks; emit no teardown intent; move focus only after the controlled array actually removes the focused row.

- [ ] **Step 2: Run `DF-FU-04` through `DF-FU-08` and `DF-FU-12` to confirm failure**

Run: `rtk pnpm --filter @lyra-ds/react exec vitest run --project browser --browser.name chromium src/file-upload/file-upload.browser.test.tsx -t "DF-FU-04|DF-FU-05|DF-FU-06|DF-FU-07|DF-FU-08|DF-FU-12"`

Expected: FAIL because the legacy component has no intents, locks, stale-attempt guard, milestone announcements, or post-commit focus behavior.

- [ ] **Step 3: Implement intent and reconciliation records**

```ts
type PendingIntentKey = `${string}:${FileUploadItem['status']}:${string}`;
type AnnouncementKey = `${string}:${string}:${FileUploadItem['status']}`;

function intentKey(item: FileUploadItem): PendingIntentKey {
  return `${item.id}:${item.status}:${'attemptId' in item ? item.attemptId : 'none'}`;
}
```

Keep pending keys, latest accepted attempt IDs, previous determinate percentages, prior committed item order, and the last focused action in refs. Reconcile them in a post-commit effect from `items`; never mirror the controlled collection in state. Reject an old known `attemptId`, release a pending key only after the corresponding item changes/removes, and compute the one live-region message for that commit.

For `multiple={false}` with an uploading/canceling item, prevent picker click and drop, set `aria-disabled="true"`, retain native form participation, and announce `selectionUnavailable` once per attempted operation.

- [ ] **Step 4: Run the focused action and announcement suite**

Run: `rtk pnpm --filter @lyra-ds/react exec vitest run --project browser --browser.name chromium src/file-upload/file-upload.browser.test.tsx -t "DF-FU-04|DF-FU-05|DF-FU-06|DF-FU-07|DF-FU-08|DF-FU-12"`

Expected: PASS, including canceled retry, canceling race, no active removal, no duplicate intent, stale-result suppression, milestone de-duplication, and exact focus fallback.

- [ ] **Step 5: Commit lifecycle operations**

```text
rtk git add packages/react/src/file-upload
rtk git commit -m "feat(react): add upload recovery and announcements"
```

---

### Task 4: Preserve native forms and prove real React hydration

**Files:**

- Modify: `packages/react/src/file-upload/file-upload.tsx`
- Modify: `packages/react/src/file-upload/file-upload.browser.test.tsx`
- Modify: `packages/react/src/file-upload/file-upload.ssr.test.ts`
- Create: `packages/react/src/file-upload/file-upload.hydration.browser.test.tsx`

**Interfaces:**

- Retains local `File` references only when controlled items echo their proposed IDs as non-validation items.
- With `name`, reconstructs `input.files` through `DataTransfer`; without `name`, resets after dispatch for same-file reselection.
- Hydrates server markup through `hydrateRoot` and reports console and `onRecoverableError` evidence.

- [ ] **Step 1: Add failing form and hydration tests**

```tsx
it(FILE_UPLOAD_SCENARIOS.form, async () => {
  function ControlledFormUpload() {
    const [items, setItems] = useState<FileUploadItem[]>([]);
    return (
      <form>
        <FileUpload
          name="attachments"
          items={items}
          onSelect={({ selections }) =>
            setItems(selections.map(({ proposedItem }) => proposedItem))
          }
          onRetry={vi.fn()}
          onCancel={vi.fn()}
          onRemove={({ id }) => setItems((current) => current.filter((item) => item.id !== id))}
        />
      </form>
    );
  }

  const screen = await render(<ControlledFormUpload />);
  const file = new File(['one'], 'one.pdf', { type: 'application/pdf' });
  await userEvent.upload(screen.getByLabelText('Drag files here or click to select'), file);

  const form = screen.container.querySelector('form')!;
  expect(new FormData(form).getAll('attachments')).toEqual([file]);
  await screen.getByRole('button', { name: 'Remove one.pdf' }).click();
  expect(new FormData(form).getAll('attachments')).toEqual([]);
});
```

The hydration test must server-render controlled uploading markup, set a real file on the input before hydration, call `hydrateRoot`, and assert stable IDs, no console/recoverable errors, preserved file, zero intent calls, empty live region, and exactly one callback after a post-hydration user action.
Add a required-without-name case proving native constraint validation still blocks an empty form but produces no `FormData` entry.

- [ ] **Step 2: Run form, SSR, and hydration tests and confirm failure**

```text
rtk pnpm --filter @lyra-ds/react exec vitest run --project browser --browser.name chromium src/file-upload/file-upload.browser.test.tsx -t "DF-FU-09"
rtk pnpm --filter @lyra-ds/react exec vitest run --project browser --browser.name chromium src/file-upload/file-upload.hydration.browser.test.tsx
rtk pnpm --filter @lyra-ds/react exec vitest run --project ssr src/file-upload/file-upload.ssr.test.ts
```

Expected: FAIL before local-file reconciliation and the hydration fixture exist.

- [ ] **Step 3: Implement post-selection form synchronization**

```ts
function replaceInputFiles(input: HTMLInputElement, files: readonly File[]): void {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
}
```

Keep `Map<itemId, File>` private to the mounted instance. Add a file only after a controlled commit contains its proposed ID in a non-validation state; drop it on confirmed removal. Never create `File` or `DataTransfer` during render or SSR. Preserve pre-hydration `input.files` and reconcile after hydration without firing selection.

- [ ] **Step 4: Run all React FileUpload evidence in three engines**

```text
rtk pnpm --filter @lyra-ds/react run typecheck
rtk pnpm --filter @lyra-ds/react run test:ssr
rtk pnpm --filter @lyra-ds/react run test:browser
```

Expected: PASS in Chromium, Firefox, and WebKit with actual hydration, no warnings, same-file reselection, and accurate `FormData`.

- [ ] **Step 5: Commit form and hydration behavior**

```text
rtk git add packages/react/src/file-upload
rtk git commit -m "feat(react): preserve file forms through hydration"
```

---

### Task 5: Replace the Alpine timer machine with the controlled adapter

**Files:**

- Modify: `packages/alpine/src/file-upload.ts`
- Modify: `packages/alpine/src/index.ts`
- Replace: `packages/alpine/src/file-upload.browser.test.ts`
- Consume: `tools/file-upload/scenarios.ts`

**Interfaces:**

- Produces the exact `LyraFileUpload*` types from specification section 13.1.
- Public state: `items`, `dragging`, pending intent keys.
- Public methods: `setItems`, `select`, `retry`, `cancel`, `remove`.
- Bindings: `zone`, `input`, `liveRegion`, `itemBindings`, `progressBindings`, `actionBindings`.
- Events: exactly `lyra:file-upload:select|retry|cancel|remove`, bubbling and composed.

- [ ] **Step 1: Replace legacy timer tests with failing controlled-event tests**

```ts
function mountControlledFileUpload(items: LyraFileUploadItem[]): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div id="test-upload" class="lyra-upload" x-data="lyraFileUpload()" x-modelable="items">
      <label class="lyra-upload__zone" for="test-upload-input" x-bind="zone">Select files</label>
      <input id="test-upload-input" class="lyra-upload__input" type="file" x-bind="input">
      <ul class="lyra-upload__list"><template x-for="item in items" :key="item.id"><li x-bind="itemBindings(item)"><span x-text="item.name"></span></li></template></ul>
      <span class="lyra-upload__live" aria-live="polite" aria-atomic="true" x-bind="liveRegion"></span>
    </div>`;
  document.body.appendChild(host);
  Alpine.initTree(host);
  (Alpine.$data(root(host)) as LyraFileUploadData).setItems(items);
  return host;
}

it(FILE_UPLOAD_SCENARIOS.conformance, async () => {
  const host = mountControlledFileUpload([]);
  const select = vi.fn();
  root(host).addEventListener('lyra:file-upload:select', select);
  selectFiles(input(host), new File(['one'], 'one.pdf', { type: 'application/pdf' }));
  await flush();

  expect(select).toHaveBeenCalledOnce();
  const event = select.mock.calls[0][0] as CustomEvent<LyraFileUploadSelectDetail>;
  expect(event.bubbles).toBe(true);
  expect(event.composed).toBe(true);
  expect(event.detail.selections[0].proposedItem.status).toBe('selected');
  expect(root(host).querySelector('.lyra-upload__item')).toBeNull();
});
```

Add shared-ID cases for validation, controlled state replacement, retry/cancel/remove locks, active single-file rejection, progress milestones, named native-form synchronization, same-file reselection without a name, delayed initialization, destroy/re-init, and no emitted teardown event. Assert the old `lyra:files`, `lyra:change`, timers, `updateItems`, and `x-modelable="dragging"` contract is absent.
Also assert a missing server root `id` produces a development diagnostic and that an unknown message interpolation token stays literal without executing code.

- [ ] **Step 2: Run the focused Alpine file and observe legacy failures**

Run: `rtk pnpm --filter @lyra-ds/alpine exec vitest run --browser.name chromium src/file-upload.browser.test.ts`

Expected: FAIL on controlled reconciliation, event names/payloads, bindings, native progress attributes, and cleanup.

- [ ] **Step 3: Implement one replace-only Alpine state path**

```ts
setItems(items) {
  const previous = this.items;
  this.items = items;
  this.reconcile(previous, items);
}

dispatchIntent(name, detail) {
  return this.root?.dispatchEvent(
    new CustomEvent(name, { detail, bubbles: true, composed: true }),
  ) ?? false;
}
```

`x-modelable="items"` and explicit `setItems()` must call the same reconciliation logic. Use the required root `id` plus counters for item and attempt proposals. Keep selection files private; when `name` is present, rebuild `input.files` with `DataTransfer` only after a valid proposal is echoed, and otherwise reset after dispatch for same-file reselection. Interpolate only documented message tokens, preserve server-authored rows, and clear root/listener/file/announcement/lock references in `destroy()` without dispatching.

- [ ] **Step 4: Run Alpine in all browsers plus type/build checks**

```text
rtk pnpm --filter @lyra-ds/alpine run typecheck
rtk pnpm --filter @lyra-ds/alpine run build
rtk pnpm --filter @lyra-ds/alpine run test:browser
```

Expected: PASS in Chromium, Firefox, and WebKit, with the same `DF-FU-*` IDs used by React for shared outcomes.

- [ ] **Step 5: Commit the Alpine adapter**

```text
rtk git add packages/alpine/src/file-upload.ts packages/alpine/src/file-upload.browser.test.ts packages/alpine/src/index.ts
rtk git commit -m "feat(alpine): control the file upload lifecycle"
```

---

### Task 6: Migrate the canonical FileUpload CSS and visual evidence

**Files:**

- Modify: `handoff/components/files/files.css`
- Modify: `packages/styles/components/files/files.css`
- Create: `packages/styles/tests/fixtures/file-upload.html`
- Create: `packages/styles/tests/file-upload.test.ts`
- Modify: `tools/parity/baseline.json`

**Interfaces:**

- Preserves approved existing anatomy except `.lyra-upload__bar-fill`.
- Adds `.lyra-upload__input`, `.lyra-upload__retry`, `.lyra-upload__cancel`, and `.lyra-upload__live`.
- Styles native `progress`, input focus on the associated label, item `data-state`, forced colors, reduced motion, reflow, and coarse-pointer targets.

- [ ] **Step 1: Add a failing three-engine Styles fixture**

```ts
it(FILE_UPLOAD_SCENARIOS.presentation, async () => {
  await page.viewport(320, 640);
  await page.getByTestId('file-upload-input').focus();
  await expect.element(page.getByTestId('file-upload-zone')).toHaveStyle({ outlineStyle: 'solid' });
  expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
  await expect.element(page.getByTestId('file-upload-progress')).toHaveAttribute('value', '50');
});
```

The fixture includes light/dark roots, LTR/RTL, a long unbroken filename, validation and transport errors, determinate/indeterminate progress, disabled actions, and a 320-pixel container. Add forced-colors and reduced-motion assertions using the existing Browser Mode context/emulation pattern; use computed styles and geometry rather than image-only assertions.

- [ ] **Step 2: Run Styles Browser Mode and parity to record the expected red state**

```text
rtk pnpm --filter @lyra-ds/styles exec vitest run --browser.name chromium tests/file-upload.test.ts
rtk pnpm run parity
```

Expected: the new fixture fails on missing classes/selectors. Parity still passes before the canonical and packaged CSS are edited; after Step 3 it must fail only on the intentional class-inventory baseline drift until Step 4 updates that baseline.

- [ ] **Step 3: Update handoff and packaged CSS identically**

```css
.lyra-upload__input {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

.lyra-upload__zone:has(+ .lyra-upload__input:focus-visible) {
  outline: 2px solid transparent;
  box-shadow: var(--shadow-focus);
}

.lyra-upload__bar {
  inline-size: 100%;
  block-size: 5px;
  accent-color: var(--accent);
}

@media (prefers-reduced-motion: reduce) {
  .lyra-upload__zone,
  .lyra-upload__bar {
    transition: none;
  }
}
```

Use repository token names that already exist; verify them with `rg` before editing. Provide 44-pixel coarse-pointer action sizes and 24-pixel minimum default targets. Use logical properties, wrap action groups before overflow, and include a `@media (forced-colors: active)` block for focus, boundary, progress, and disabled states.

- [ ] **Step 4: Update the intentional parity baseline and run all Styles gates**

```text
rtk pnpm run parity --update-baseline
rtk pnpm run parity
rtk pnpm --filter @lyra-ds/styles run lint:css
rtk pnpm --filter @lyra-ds/styles run test:browser
```

Expected: PASS in three engines; the baseline diff removes only `.lyra-upload__bar-fill` and adds only the four approved public classes.

- [ ] **Step 5: Commit CSS and visual evidence**

```text
rtk git add handoff/components/files/files.css packages/styles/components/files/files.css
rtk git add packages/styles/tests/file-upload.test.ts packages/styles/tests/fixtures/file-upload.html tools/parity/baseline.json
rtk git commit -m "feat(styles): style native file upload states"
```

---

### Task 7: Add packed React 18 and React 19 compatibility evidence

**Files:**

- Create: `tools/react-compat/file-upload.mjs`
- Create: `tools/react-compat/file-upload.test.mjs`
- Create: `tools/react-compat/fixtures/shared/file-upload.browser.test.tsx`
- Create: `tools/react-compat/fixtures/shared/file-upload.ssr.test.tsx`
- Create: `tools/react-compat/fixtures/shared/entry.tsx`
- Create: `tools/react-compat/fixtures/react18/package.json`
- Create: `tools/react-compat/fixtures/react18/pnpm-lock.yaml`
- Create: `tools/react-compat/fixtures/react19/package.json`
- Create: `tools/react-compat/fixtures/react19/pnpm-lock.yaml`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**

- `runFileUploadCompatibility()` packs current React and Styles artifacts, installs each into isolated frozen React 18.3.x and React 19.2.x fixtures, then runs typecheck, production Vite build, SSR, hydration, and Chromium Browser Mode.
- The existing frozen CI job names remain unchanged.

- [ ] **Step 1: Write failing runner tests for both fixed matrices**

```js
test('compatibility matrix names React 18 and 19 and every required layer', () => {
  assert.deepEqual(
    REACT_COMPATIBILITY_MATRIX.map(({ react, checks }) => ({ react, checks })),
    [
      { react: '18.3.1', checks: ['types', 'build', 'ssr', 'hydration', 'browser'] },
      { react: '19.2.8', checks: ['types', 'build', 'ssr', 'hydration', 'browser'] },
    ],
  );
});
```

Also test that tarballs are installed after the frozen external graph, temporary stores are unique, failed child commands include stdout/stderr, and fixture cleanup runs on failure.

- [ ] **Step 2: Run the Node test and confirm the harness is absent**

Run: `rtk node --test tools/react-compat/file-upload.test.mjs`

Expected: FAIL because the runner and fixtures do not exist.

- [ ] **Step 3: Implement isolated packed consumers**

Each fixture pins its own React, React DOM, type packages, Vite, TypeScript, Vitest Browser Mode, and Playwright provider in a committed frozen lockfile. The shared test must import `@lyra-ds/react/file-upload`, use `hydrateRoot`, render controlled progress, trigger one cancel intent, and assert no hydration warning.

```js
const REQUIRED_CHECKS = ['types', 'build', 'ssr', 'hydration', 'browser'];

export const REACT_COMPATIBILITY_MATRIX = [
  { directory: 'react18', react: '18.3.1', checks: REQUIRED_CHECKS },
  { directory: 'react19', react: '19.2.8', checks: REQUIRED_CHECKS },
];

export async function runFileUploadCompatibility({ matrix = REACT_COMPATIBILITY_MATRIX } = {}) {
  for (const candidate of matrix) await runCandidate(candidate);
}
```

The runner builds and packs once, copies each fixture and shared source to a fresh temporary directory, performs frozen dependency installation with a unique store, installs exact local tarballs without workspace resolution, and runs all five layers.

- [ ] **Step 4: Wire and run the gate without renaming CI jobs**

Add `"test:react-compat": "node tools/react-compat/file-upload.mjs"` to root scripts. In `ci.yml`, add `pnpm run test:react-compat` inside `test` after Browser Mode and add its type/build consumer checks inside the same script; do not create or rename jobs.

Run:

```text
rtk node --test tools/react-compat/file-upload.test.mjs
rtk pnpm run test:react-compat
rtk pnpm exec prettier --check .github/workflows/ci.yml
```

Expected: both pinned React versions pass all layers; the Node runner test confirms the existing `lint`, `typecheck`, `test`, and `build` job names are unchanged and CI's existing actionlint step remains present.

- [ ] **Step 5: Commit compatibility infrastructure**

```text
rtk git add tools/react-compat package.json .github/workflows/ci.yml
rtk git commit -m "test: verify file upload on React 18 and 19"
```

---

### Task 8: Publish accurate examples, support boundaries, generated APIs, and changesets

**Files:**

- Replace: `apps/docs/components/examples/file-upload/default-items.tsx`
- Replace: `apps/docs/components/examples/file-upload/on-files.tsx`
- Modify: `apps/docs/components/examples/index.ts`
- Replace: `apps/docs/content/docs/en/components/file-upload.mdx`
- Replace: `apps/docs/content/docs/pt-BR/components/file-upload.mdx`
- Modify: `apps/docs/content/docs/en/guides/compatibility.mdx`
- Modify: `apps/docs/content/docs/pt-BR/guides/compatibility.mdx`
- Modify: `apps/docs/lib/components.ts`
- Modify: `apps/docs/lib/support-matrix.test.ts`
- Modify: `apps/docs/messages/en.json`
- Modify: `apps/docs/messages/pt-BR.json`
- Modify generated files: `tools/docgen/output/props.json`, `tools/docgen/output/llms.txt`, `tools/docgen/output/alpine-props.json`, `tools/docgen/output/alpine-llms.txt`
- Create: `.changeset/controlled-file-upload.md`

**Interfaces:**

- Provides one complete React reducer/AbortController example and one state-gallery example.
- Documents working Alpine server markup with the four exact events.
- Removes Blade from FileUpload's claimed stacks and adds `absenceBladeFileUploadLifecycle` in both locales.

- [ ] **Step 1: Add failing docs/support assertions**

```ts
it('defers Blade for the controlled FileUpload lifecycle', () => {
  const fileUpload = getSupportMatrixRows().find((row) => row.slug === 'file-upload');
  expect(fileUpload?.stacks.blade).toMatchObject({
    level: 'unsupported',
    gap: { reasonKey: 'absenceBladeFileUploadLifecycle' },
  });
});
```

Extend `scripts/check-stack-sections.test.mjs` expectations so the FileUpload MDX pages contain React and Alpine panels, no Blade panel, and an absence reason supplied by component metadata.

- [ ] **Step 2: Run docs tests and confirm old claims fail**

```text
rtk pnpm --filter @lyra-ds/docs exec vitest run lib/support-matrix.test.ts
rtk node --test apps/docs/scripts/check-stack-sections.test.mjs
```

Expected: FAIL while FileUpload still claims Blade and documents synthetic `defaultItems`/`onFiles` behavior.

- [ ] **Step 3: Replace examples and localized guidance**

The primary example must contain a real reducer, `Map<string, AbortController>`, `XMLHttpRequest.upload` progress handling, new attempt IDs supplied by Lyra, stale-attempt checks in the reducer, cancel confirmation, retry, error, success, and removal. It must not use a timer to imitate production transport.

```tsx
<FileUpload
  name="attachments"
  items={items}
  accept="image/*,.pdf"
  maxSizeMB={10}
  onSelect={({ selections }) => dispatchSelection(selections)}
  onRetry={({ id, proposedAttemptId }) => retry(id, proposedAttemptId)}
  onCancel={({ id, attemptId }) => cancel(id, attemptId)}
  onRemove={({ id }) => dispatch({ type: 'removed', id })}
/>
```

Both MDX pages explain controlled ownership, validation echo, native form limitations for externally seeded files, canceling races, stale results, 25-percent announcements, no-JS behavior, exact Alpine events, and Blade deferral. At the current package baseline, the coordinated minor line is Styles `=0.5.0`, React `=0.5.0`, and Alpine `=0.6.0`; before editing the guides, run `rtk pnpm changeset status` and use its exact computed releases if an intervening release changed those numbers.

- [ ] **Step 4: Generate public API artifacts and add coordinated changesets**

```yaml
---
'@lyra-ds/react': minor
'@lyra-ds/alpine': minor
'@lyra-ds/styles': minor
---
Replace FileUpload's simulated progress with a consumer-controlled upload lifecycle across React, Alpine, and shared Styles. Add real progress, retry, cancellation, stale-attempt protection, native form semantics, and migration examples.
```

Run:

```text
rtk pnpm --filter @lyra-ds/react run build
rtk pnpm --filter @lyra-ds/alpine run build
rtk node tools/docgen/generate.mjs
rtk node tools/docgen/alpine.mjs
rtk pnpm --filter @lyra-ds/docs run typecheck
rtk pnpm --filter @lyra-ds/docs run test
```

Expected: docs, generated APIs, examples, and support matrix all describe only the new contract.

- [ ] **Step 5: Commit docs and release metadata**

```text
rtk git add apps/docs tools/docgen/output .changeset/controlled-file-upload.md
rtk git commit -m "docs: migrate file upload consumers"
```

---

### Task 9: Create immutable bundle comparisons and runtime responsiveness evidence

**Files:**

- Modify: `tools/bundle-baseline/measure.mjs`
- Modify: `tools/bundle-baseline/measure.test.mjs`
- Create: `tools/file-upload-performance/evidence.mjs`
- Create: `tools/file-upload-performance/measure.mjs`
- Create: `tools/file-upload-performance/measure.test.mjs`
- Create: `tools/file-upload-performance/fixture/index.html`
- Create: `tools/file-upload-performance/fixture/main.tsx`
- Modify: `package.json`
- Create after clean measurement: `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>.json`
- Create after clean measurement: `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>.md`
- Create after clean measurement: `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-runtime.json`
- Create after clean measurement: `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-runtime.md`
- Create after approval: `docs/superpowers/baselines/lyra-v1/current.json`

**Interfaces:**

- `pnpm evidence:file-upload` starts from a clean worktree, collects bundle plus runtime results for the same `HEAD`, writes four immutable artifacts named by that revision, and never changes the Phase 0 pair.
- `pnpm baseline:bundles --accept-comparison file-upload` allows only those four generated artifacts as dirty paths, requires their revision to equal `HEAD`, and updates only `current.json` after validating all budgets and canonical JSON/Markdown peers.
- `pnpm baseline:bundles --check` resolves `current.json` when present, otherwise the Phase 0 pair, then exactly compares a fresh collection.
- `pnpm performance:file-upload` measures the six approved operations with 100 items, 20 active, at least 30 iterations, p95 at most 100 ms, worst below 250 ms, and no long task above 50 ms.

- [ ] **Step 1: Write failing comparison and performance-tool tests**

```js
test('comparison keeps the original baseline and reports approved deltas', async () => {
  const before = baselineFixture({ revision: 'before', fileUploadBrotli: 7_992 });
  const after = baselineFixture({ revision: 'after', fileUploadBrotli: 8_500 });
  const comparison = createComparison('file-upload', before, after);

  assert.equal(comparison.deltas.reactFileUploadBrotli, 508);
  assert.equal(comparison.budgets.reactFileUploadAbsolute.passed, false);
  assert.equal(comparison.budgets.complexDelta.passed, true);
  assert.equal(comparison.before.revision, 'before');
  assert.equal(comparison.after.revision, 'after');
});
```

Test immutable write refusal, canonical Markdown, pointer validation, missing report rejection, rejection of unrelated dirty paths during acceptance, absolute `8 kB` failure, `+3,000` failure, separate CSS/files-data deltas, and current-reference `--check`. Performance tests use injected samples to prove median/p95/worst/long-task calculations and threshold failure.

- [ ] **Step 2: Run Node tests and observe unsupported modes**

```text
rtk node --test tools/bundle-baseline/measure.test.mjs
rtk node --test tools/file-upload-performance/measure.test.mjs
```

Expected: FAIL on missing comparison APIs, current pointer, runtime statistics, and CLI modes.

- [ ] **Step 3: Implement comparison and production performance runners**

```js
export function percentile(samples, percentileValue) {
  const sorted = [...samples].sort((left, right) => left - right);
  return sorted[Math.ceil((percentileValue / 100) * sorted.length) - 1];
}

export function operationResult(samples, longTasks) {
  return {
    iterations: samples.length,
    medianMs: percentile(samples, 50),
    p95Ms: percentile(samples, 95),
    worstMs: Math.max(...samples),
    longestTaskMs: Math.max(0, ...longTasks),
  };
}
```

The production fixture imports the packed public FileUpload entry, preloads 100 items with 20 active attempts, and exposes semantic completion markers for selection dispatch, controlled progress commit, cancel, retry, confirmed removal/focus, and teardown. Use the repository-pinned Chromium with fixed viewport/device profile, warm-up, controlled data, `PerformanceObserver` long tasks, and 30 recorded samples. Do not use arbitrary sleeps as readiness. `evidence.mjs` invokes both collectors, verifies that both results name the same revision, and writes the four canonical peers only after every threshold passes.

Add root scripts `"evidence:file-upload": "node tools/file-upload-performance/evidence.mjs"` and `"performance:file-upload": "node tools/file-upload-performance/measure.mjs"`; `--check` on the latter validates the runtime pair selected by `current.json` without rewriting it.

- [ ] **Step 4: Commit tooling, then measure from a clean revision**

First verify and commit only tooling:

```text
rtk node --test tools/bundle-baseline/measure.test.mjs tools/file-upload-performance/measure.test.mjs
rtk git add tools/bundle-baseline tools/file-upload-performance package.json
rtk git commit -m "test: compare file upload performance evidence"
```

With a clean worktree, run:

```text
rtk pnpm evidence:file-upload
```

Expected: the four immutable JSON/Markdown peers report standalone React, Alpine, CSS, Files and Data scenario, module contributions, runtime operations, thresholds, and pass/fail for the same revision. If the React entry exceeds `8 kB`, stop for an explicit budget decision; do not run acceptance.

- [ ] **Step 5: Review, accept, and commit the evidence pointer**

Review the four generated files while they are the only dirty paths. Accept the unique FileUpload evidence for `HEAD`, then commit the artifacts and pointer together:

```text
rtk pnpm baseline:bundles --accept-comparison file-upload
rtk git add docs/superpowers/baselines/lyra-v1/comparisons/file-upload docs/superpowers/baselines/lyra-v1/current.json
rtk git commit -m "docs: accept file upload performance evidence"
```

The acceptance command must fail unless exactly one canonical bundle/runtime set has a revision equal to `HEAD`; it must not select by modification time. Finally run `rtk pnpm baseline:bundles --check` and expect an exact PASS against the accepted revision.

---

### Task 10: Record manual accessibility evidence and run the full release gate

**Files:**

- Create: `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-accessibility.md`
- Create: `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-accessibility/`
- Modify only if verification finds a defect: the smallest owning source/test/docs file from Tasks 1–9

**Interfaces:**

- Produces approved `DF-FU-M01` and `DF-FU-M02` records from actual assistive-
  technology environments with local media in local evidence ZIPs.
- Produces `PASS` results for `DF-FU-17` and `DF-FU-18` in a workflow ZIP for
  the exact immutable deployment revision.
- Produces successful `evidence:file-upload:ingest` output from those ZIPs for
  one revision and one immutable deployment.

- [ ] **Step 1: Collect the two manual critical workflows before creating a pass record**

Exercise:

```text
DF-FU-M01 — Windows, current NVDA, current Firefox or Chromium
DF-FU-M02 — macOS, current VoiceOver, current Safari
```

For each, perform selection, validation, determinate/indeterminate progress,
cancel/canceling, retry with new attempt, stale-result rejection, success,
confirmed removal, and focus recovery. Attach local media, obtain reviewer
approval, and export the local evidence ZIP. Missing access to a required
environment is a blocked merge gate, not a pass.

- [ ] **Step 2: Download the revision-bound automated evidence ZIP**

Dispatch the evidence preview workflow for the reviewed evidence ref. Download
`file-upload-automation-<revision-prefix>.zip` from its passing run. It must
contain `PASS` results for `DF-FU-17` and `DF-FU-18` for the same exact
immutable deployment revision as both local evidence ZIPs.

- [ ] **Step 3: Ingest and review complete evidence**

Run:

```text
rtk pnpm evidence:file-upload:ingest --automation <path> --bundle <path> [--bundle <path>]
```

The command must succeed only with one approved `DF-FU-M01`, one approved
`DF-FU-M02`, `PASS` results for `DF-FU-17` and `DF-FU-18`, one revision, and one
immutable deployment. Review the generated diff; do not commit empty cells,
“not tested”, or aspirational passes. Any failure returns to the owning TDD
task and requires a fresh full scenario run.

- [ ] **Step 4: Run focused package and conformance gates**

```text
rtk pnpm --filter @lyra-ds/styles run lint:css
rtk pnpm --filter @lyra-ds/styles run test:browser
rtk pnpm --filter @lyra-ds/react run lint
rtk pnpm --filter @lyra-ds/react run typecheck
rtk pnpm --filter @lyra-ds/react run test:ssr
rtk pnpm --filter @lyra-ds/react run test:browser
rtk pnpm --filter @lyra-ds/alpine run typecheck
rtk pnpm --filter @lyra-ds/alpine run test:browser
rtk pnpm run test:react-compat
rtk pnpm run parity
rtk pnpm baseline:bundles --check
rtk pnpm performance:file-upload --check
```

Expected: every command exits 0 with three-engine behavior, React 18/19 coverage, parity, accepted bundle evidence, and runtime thresholds passing.

- [ ] **Step 5: Run packaging, documentation, and repository gates**

```text
rtk pnpm run lint
rtk pnpm run typecheck
rtk pnpm run test
rtk pnpm run test:browsers
rtk pnpm run build
rtk pnpm --filter @lyra-ds/react exec attw --pack . --profile node16
rtk pnpm --filter @lyra-ds/alpine exec attw --pack . --profile node16 --ignore-rules cjs-resolves-to-esm
rtk pnpm --filter @lyra-ds/react exec size-limit
rtk pnpm --filter @lyra-ds/alpine exec size-limit
rtk node tools/docgen/generate.mjs --check
rtk node tools/docgen/alpine.mjs --check
rtk node tools/pack-smoke/pack-smoke.mjs
rtk node tools/smoke/smoke.mjs
rtk git diff --check
```

Expected: all commands exit 0; generated docs and packed declarations are current; no absolute or delta budget is widened; no legacy upload prop/event/timer remains in public source or docs.

- [ ] **Step 6: Commit ingested evidence and prepare review**

```text
rtk git add docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-accessibility.md \
  docs/superpowers/baselines/lyra-v1/comparisons/file-upload/<revision>-accessibility/
rtk git commit -m "docs: record file upload accessibility evidence"
rtk git status --short --branch
```

Expected: the final status is clean. Request code review against the approved specification, attach comparison/manual artifacts, and do not merge until required CI, review findings, and the accessibility-reviewer gate are resolved.

---

## Execution checkpoints

1. After Task 4, review the React public API, browser states, and hydration behavior before implementing Alpine.
2. After Task 6, review React/Alpine/CSS conformance and the intentional parity baseline diff.
3. After Task 8, review the breaking migration, localized docs, Blade absence, and three changesets.
4. After Task 9, review measured bundle/runtime results before accepting `current.json`; any failed absolute or delta gate stops the implementation.
5. After Task 10, review manual evidence and complete CI before opening or merging the PR.
