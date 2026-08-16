'use client';

import { FileUpload, type FileUploadItem } from '@lyra-ds/react/file-upload';
import { useState } from 'react';

const initialItems: FileUploadItem[] = [
  { id: 'selected', name: 'brief.pdf', size: 92_000, type: 'application/pdf', status: 'selected' },
  {
    id: 'determinate',
    name: 'photos.zip',
    size: 4_800_000,
    type: 'application/zip',
    status: 'uploading',
    attemptId: 'attempt-determinate',
    progress: { kind: 'determinate', value: 48 },
  },
  {
    id: 'indeterminate',
    name: 'interview.wav',
    size: 8_200_000,
    type: 'audio/wav',
    status: 'uploading',
    attemptId: 'attempt-indeterminate',
    progress: { kind: 'indeterminate' },
  },
  {
    id: 'canceling',
    name: 'draft.mov',
    size: 9_100_000,
    type: 'video/quicktime',
    status: 'canceling',
    attemptId: 'attempt-canceling',
    progress: { kind: 'determinate', value: 67 },
  },
  {
    id: 'success',
    name: 'contract.pdf',
    size: 180_000,
    type: 'application/pdf',
    status: 'success',
    attemptId: 'attempt-success',
  },
  {
    id: 'retryable-error',
    name: 'catalog.pdf',
    size: 730_000,
    type: 'application/pdf',
    status: 'error',
    attemptId: 'attempt-error',
    error: {
      kind: 'transport',
      code: 'gateway-timeout',
      message: 'The upload timed out.',
      retryable: true,
    },
  },
  {
    id: 'validation-error',
    name: 'archive.exe',
    size: 410_000,
    type: 'application/octet-stream',
    status: 'error',
    error: {
      kind: 'validation',
      code: 'accept',
      message: 'archive.exe must match image/*,.pdf.',
      retryable: false,
    },
  },
  {
    id: 'canceled',
    name: 'research.pdf',
    size: 260_000,
    type: 'application/pdf',
    status: 'canceled',
    attemptId: 'attempt-canceled',
  },
];

export function FileUploadStates() {
  const [items, setItems] = useState(initialItems);

  return (
    <FileUpload
      label="Upload lifecycle states"
      hint="A controlled gallery; no transport runs in this example."
      items={items}
      onSelect={({ selections }) =>
        setItems((current) => [...current, ...selections.map((entry) => entry.proposedItem)])
      }
      onRetry={({ id, proposedAttemptId }) =>
        setItems((current) =>
          current.map((item) =>
            item.id === id &&
            (item.status === 'canceled' ||
              (item.status === 'error' && item.error.kind === 'transport'))
              ? {
                  id: item.id,
                  name: item.name,
                  size: item.size,
                  type: item.type,
                  status: 'uploading',
                  attemptId: proposedAttemptId,
                  progress: { kind: 'indeterminate' },
                }
              : item,
          ),
        )
      }
      onCancel={({ id, attemptId }) =>
        setItems((current) =>
          current.map((item) =>
            item.id === id && item.status === 'uploading' && item.attemptId === attemptId
              ? { ...item, status: 'canceling' }
              : item,
          ),
        )
      }
      onRemove={({ id }) => setItems((current) => current.filter((item) => item.id !== id))}
    />
  );
}
