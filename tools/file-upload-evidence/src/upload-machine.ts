import type { FileUploadItem, FileUploadProgress } from '@lyra-ds/react/file-upload';

export type UploadMachineAction =
  | { type: 'selection'; proposedItems: readonly FileUploadItem[] }
  | { type: 'upload-start'; id: string; attemptId: string }
  | {
      type: 'native-progress';
      id: string;
      attemptId: string;
      lengthComputable: boolean;
      loaded: number;
      total: number;
    }
  | { type: 'cancel-requested'; id: string; attemptId: string }
  | { type: 'canceled'; id: string; attemptId: string }
  | {
      type: 'retry';
      id: string;
      previousAttemptId: string;
      proposedAttemptId: string;
    }
  | { type: 'retryable-error'; id: string; attemptId: string; message: string }
  | { type: 'succeeded'; id: string; attemptId: string }
  | { type: 'removed'; id: string }
  | { type: 'reset' };

function hasAttempt(item: FileUploadItem, id: string, attemptId: string): boolean {
  return item.id === id && 'attemptId' in item && item.attemptId === attemptId;
}

function itemBase(item: FileUploadItem) {
  return {
    id: item.id,
    name: item.name,
    size: item.size,
    type: item.type,
  };
}

function replaceItem(
  items: readonly FileUploadItem[],
  id: string,
  update: (item: FileUploadItem) => FileUploadItem | null,
): readonly FileUploadItem[] {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return items;

  const current = items[index]!;
  const replacement = update(current);
  if (replacement === null || replacement === current) return items;

  return [...items.slice(0, index), replacement, ...items.slice(index + 1)];
}

function progressFromNative(
  lengthComputable: boolean,
  loaded: number,
  total: number,
): FileUploadProgress {
  if (!lengthComputable || total <= 0) return { kind: 'indeterminate' };

  const percentage = Math.round((loaded / total) * 100);
  if (!Number.isFinite(percentage)) return { kind: 'indeterminate' };

  return { kind: 'determinate', value: Math.min(100, Math.max(0, percentage)) };
}

export function uploadReducer(
  items: readonly FileUploadItem[],
  action: UploadMachineAction,
): readonly FileUploadItem[] {
  switch (action.type) {
    case 'selection':
      return [...items, ...action.proposedItems];
    case 'upload-start':
      return replaceItem(items, action.id, (item) =>
        item.status === 'selected'
          ? {
              ...itemBase(item),
              status: 'uploading',
              attemptId: action.attemptId,
              progress: { kind: 'indeterminate' },
            }
          : null,
      );
    case 'native-progress':
      return replaceItem(items, action.id, (item) =>
        hasAttempt(item, action.id, action.attemptId) &&
        (item.status === 'uploading' || item.status === 'canceling')
          ? {
              ...item,
              progress: progressFromNative(action.lengthComputable, action.loaded, action.total),
            }
          : null,
      );
    case 'cancel-requested':
      return replaceItem(items, action.id, (item) =>
        hasAttempt(item, action.id, action.attemptId) && item.status === 'uploading'
          ? { ...item, status: 'canceling' }
          : null,
      );
    case 'canceled':
      return replaceItem(items, action.id, (item) =>
        hasAttempt(item, action.id, action.attemptId) && item.status === 'canceling'
          ? {
              ...itemBase(item),
              status: 'canceled',
              attemptId: action.attemptId,
            }
          : null,
      );
    case 'retry':
      if (action.proposedAttemptId === action.previousAttemptId) return items;
      return replaceItem(items, action.id, (item) => {
        if (!hasAttempt(item, action.id, action.previousAttemptId)) return null;
        if (
          item.status !== 'canceled' &&
          !(item.status === 'error' && item.error.kind === 'transport' && item.error.retryable)
        ) {
          return null;
        }

        return {
          ...itemBase(item),
          status: 'uploading',
          attemptId: action.proposedAttemptId,
          progress: { kind: 'indeterminate' },
        };
      });
    case 'retryable-error':
      return replaceItem(items, action.id, (item) =>
        hasAttempt(item, action.id, action.attemptId) &&
        (item.status === 'uploading' || item.status === 'canceling')
          ? {
              ...itemBase(item),
              status: 'error',
              attemptId: action.attemptId,
              error: {
                kind: 'transport',
                message: action.message,
                retryable: true,
              },
            }
          : null,
      );
    case 'succeeded':
      return replaceItem(items, action.id, (item) =>
        hasAttempt(item, action.id, action.attemptId) &&
        (item.status === 'uploading' || item.status === 'canceling')
          ? {
              ...itemBase(item),
              status: 'success',
              attemptId: action.attemptId,
            }
          : null,
      );
    case 'removed': {
      const index = items.findIndex((item) => item.id === action.id);
      return index < 0 ? items : [...items.slice(0, index), ...items.slice(index + 1)];
    }
    case 'reset':
      return items.length === 0 ? items : [];
  }
}
