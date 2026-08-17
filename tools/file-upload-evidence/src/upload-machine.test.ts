import type { FileUploadItem, FileUploadSelectedItem } from '@lyra-ds/react/file-upload';
import { describe, expect, it } from 'vitest';
import { uploadReducer } from './upload-machine';

const selected: FileUploadSelectedItem = {
  id: 'item-a',
  name: 'evidence.pdf',
  size: 128,
  type: 'application/pdf',
  status: 'selected',
};

const uploading: FileUploadItem = {
  ...selected,
  status: 'uploading',
  attemptId: 'attempt-1',
  progress: { kind: 'indeterminate' },
};

describe('uploadReducer', () => {
  it('echoes the component proposal before an upload can start', () => {
    const proposedItem = { ...selected };
    const selectionState = uploadReducer([], {
      type: 'selection',
      proposedItems: [proposedItem],
    });

    expect(selectionState).toEqual([proposedItem]);
    expect(selectionState[0]).toBe(proposedItem);

    expect(
      uploadReducer(selectionState, {
        type: 'upload-start',
        id: selected.id,
        attemptId: 'attempt-1',
      }),
    ).toEqual([uploading]);
  });

  it.each([
    {
      event: { lengthComputable: true, loaded: 25, total: 100 },
      progress: { kind: 'determinate', value: 25 },
    },
    {
      event: { lengthComputable: true, loaded: 150, total: 100 },
      progress: { kind: 'determinate', value: 100 },
    },
    {
      event: { lengthComputable: true, loaded: -20, total: 100 },
      progress: { kind: 'determinate', value: 0 },
    },
    {
      event: { lengthComputable: false, loaded: 25, total: 100 },
      progress: { kind: 'indeterminate' },
    },
    {
      event: { lengthComputable: true, loaded: 25, total: 0 },
      progress: { kind: 'indeterminate' },
    },
    {
      event: { lengthComputable: true, loaded: Number.POSITIVE_INFINITY, total: 100 },
      progress: { kind: 'indeterminate' },
    },
  ])('maps native progress $event to finite controlled progress', ({ event, progress }) => {
    const next = uploadReducer([uploading], {
      type: 'native-progress',
      id: selected.id,
      attemptId: 'attempt-1',
      ...event,
    });

    expect(next[0]).toMatchObject({ progress });
  });

  it('changes only the matching uploading attempt to canceling', () => {
    const other: FileUploadItem = {
      ...uploading,
      id: 'item-b',
      attemptId: 'attempt-2',
    };
    const state = [uploading, other];

    expect(
      uploadReducer(state, {
        type: 'cancel-requested',
        id: selected.id,
        attemptId: 'attempt-2',
      }),
    ).toBe(state);

    const next = uploadReducer(state, {
      type: 'cancel-requested',
      id: selected.id,
      attemptId: 'attempt-1',
    });
    expect(next).toEqual([{ ...uploading, status: 'canceling' }, other]);
    expect(next[1]).toBe(other);
  });

  it('retries with the component proposal and never reuses the previous attempt', () => {
    const failed: FileUploadItem = {
      ...selected,
      status: 'error',
      attemptId: 'attempt-1',
      error: {
        kind: 'transport',
        message: 'The upload request is invalid.',
        retryable: true,
      },
    };

    expect(
      uploadReducer([failed], {
        type: 'retry',
        id: selected.id,
        previousAttemptId: 'attempt-1',
        proposedAttemptId: 'attempt-1',
      }),
    ).toEqual([failed]);

    expect(
      uploadReducer([failed], {
        type: 'retry',
        id: selected.id,
        previousAttemptId: 'attempt-1',
        proposedAttemptId: 'attempt-2',
      }),
    ).toEqual([
      {
        ...selected,
        status: 'uploading',
        attemptId: 'attempt-2',
        progress: { kind: 'indeterminate' },
      },
    ]);
  });

  it('confirms cancellation only for the canceling attempt', () => {
    const canceling: FileUploadItem = { ...uploading, status: 'canceling' };

    expect(
      uploadReducer([canceling], {
        type: 'canceled',
        id: selected.id,
        attemptId: 'attempt-1',
      }),
    ).toEqual([
      {
        ...selected,
        status: 'canceled',
        attemptId: 'attempt-1',
      },
    ]);
  });

  it('turns the active attempt into a retryable transport error', () => {
    expect(
      uploadReducer([uploading], {
        type: 'retryable-error',
        id: selected.id,
        attemptId: 'attempt-1',
        message: 'The upload request is invalid.',
      }),
    ).toEqual([
      {
        ...selected,
        status: 'error',
        attemptId: 'attempt-1',
        error: {
          kind: 'transport',
          message: 'The upload request is invalid.',
          retryable: true,
        },
      },
    ]);
  });

  it('succeeds only the active attempt', () => {
    expect(
      uploadReducer([uploading], {
        type: 'succeeded',
        id: selected.id,
        attemptId: 'attempt-1',
      }),
    ).toEqual([
      {
        ...selected,
        status: 'success',
        attemptId: 'attempt-1',
      },
    ]);
  });

  it.each([
    {
      type: 'native-progress' as const,
      lengthComputable: true,
      loaded: 50,
      total: 100,
    },
    { type: 'succeeded' as const },
    { type: 'retryable-error' as const, message: 'old failure' },
    { type: 'canceled' as const },
  ])('returns the same state for stale $type from an older attempt', (event) => {
    const state: readonly FileUploadItem[] = [{ ...uploading, attemptId: 'attempt-2' }];

    expect(
      uploadReducer(state, {
        ...event,
        id: selected.id,
        attemptId: 'attempt-1',
      }),
    ).toBe(state);
  });

  it('removes only the selected ID and resets the lifecycle', () => {
    const other: FileUploadItem = { ...selected, id: 'item-b' };
    const state = [selected, other];

    const removed = uploadReducer(state, { type: 'removed', id: selected.id });
    expect(removed).toEqual([other]);
    expect(removed[0]).toBe(other);
    expect(uploadReducer(removed, { type: 'reset' })).toEqual([]);
  });
});
