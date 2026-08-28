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

Implement the public type block verbatim from specification section 5.1 in `file-upload.types.ts`. Keep `FileUploadProps` controlled-only and omit `children`, `defaultValue`, `onSelect`, and `onCancel` from inherited root attributes so the controlled intent callbacks do not collide with native handlers.

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
