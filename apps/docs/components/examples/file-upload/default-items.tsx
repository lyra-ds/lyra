'use client';

import {
  FileUpload,
  type FileUploadItem,
  type FileUploadProgress,
  type FileUploadSelection,
} from '@lyra-ds/react/file-upload';
import { useEffect, useReducer, useRef } from 'react';

type UploadAction =
  | { type: 'selected'; items: FileUploadItem[] }
  | { type: 'upload-started'; id: string; attemptId: string }
  | { type: 'progressed'; id: string; attemptId: string; progress: FileUploadProgress }
  | { type: 'cancel-requested'; id: string; attemptId: string }
  | { type: 'canceled'; id: string; attemptId: string }
  | { type: 'succeeded'; id: string; attemptId: string }
  | { type: 'failed'; id: string; attemptId: string; message: string }
  | { type: 'removed'; id: string };

function hasAttempt(
  item: FileUploadItem,
  id: string,
  attemptId: string,
): item is Extract<FileUploadItem, { attemptId: string }> {
  return item.id === id && 'attemptId' in item && item.attemptId === attemptId;
}

function uploadReducer(items: FileUploadItem[], action: UploadAction): FileUploadItem[] {
  switch (action.type) {
    case 'selected':
      return [...items, ...action.items];
    case 'upload-started':
      return items.map((item) => {
        if (item.id !== action.id) return item;
        if (item.status !== 'selected' && item.status !== 'canceled' && item.status !== 'error') {
          return item;
        }
        if (item.status === 'error' && (item.error.kind !== 'transport' || !item.error.retryable)) {
          return item;
        }

        return {
          id: item.id,
          name: item.name,
          size: item.size,
          type: item.type,
          status: 'uploading',
          attemptId: action.attemptId,
          progress: { kind: 'indeterminate' },
        };
      });
    case 'progressed':
      return items.map((item) =>
        hasAttempt(item, action.id, action.attemptId) &&
        (item.status === 'uploading' || item.status === 'canceling')
          ? { ...item, progress: action.progress }
          : item,
      );
    case 'cancel-requested':
      return items.map((item) =>
        hasAttempt(item, action.id, action.attemptId) && item.status === 'uploading'
          ? { ...item, status: 'canceling' }
          : item,
      );
    case 'canceled':
      return items.map((item) =>
        hasAttempt(item, action.id, action.attemptId) && item.status === 'canceling'
          ? {
              id: item.id,
              name: item.name,
              size: item.size,
              type: item.type,
              status: 'canceled',
              attemptId: action.attemptId,
            }
          : item,
      );
    case 'succeeded':
      return items.map((item) =>
        hasAttempt(item, action.id, action.attemptId) &&
        (item.status === 'uploading' || item.status === 'canceling')
          ? {
              id: item.id,
              name: item.name,
              size: item.size,
              type: item.type,
              status: 'success',
              attemptId: action.attemptId,
            }
          : item,
      );
    case 'failed':
      return items.map((item) =>
        hasAttempt(item, action.id, action.attemptId) &&
        (item.status === 'uploading' || item.status === 'canceling')
          ? {
              id: item.id,
              name: item.name,
              size: item.size,
              type: item.type,
              status: 'error',
              attemptId: action.attemptId,
              error: {
                kind: 'transport',
                message: action.message,
                retryable: true,
              },
            }
          : item,
      );
    case 'removed':
      return items.filter((item) => item.id !== action.id);
  }
}

function isAcceptedSelection(
  selection: FileUploadSelection,
): selection is Extract<FileUploadSelection, { proposedAttemptId: string }> {
  return selection.proposedItem.status === 'selected';
}

export function FileUploadTransport() {
  const [items, dispatch] = useReducer(uploadReducer, []);
  const controllers = useRef(new Map<string, AbortController>());
  const selectedFiles = useRef(new Map<string, File>());

  useEffect(() => {
    const activeControllers = controllers.current;

    return () => {
      for (const controller of activeControllers.values()) controller.abort();
      activeControllers.clear();
    };
  }, []);

  function startUpload(file: File, id: string, attemptId: string) {
    const controller = new AbortController();
    const request = new XMLHttpRequest();
    const abortRequest = () => request.abort();

    controllers.current.set(attemptId, controller);
    dispatch({ type: 'upload-started', id, attemptId });

    controller.signal.addEventListener('abort', abortRequest, { once: true });
    request.upload.addEventListener('progress', (event) => {
      dispatch({
        type: 'progressed',
        id,
        attemptId,
        progress: event.lengthComputable
          ? { kind: 'determinate', value: Math.round((event.loaded / event.total) * 100) }
          : { kind: 'indeterminate' },
      });
    });
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        dispatch({ type: 'succeeded', id, attemptId });
      } else {
        dispatch({
          type: 'failed',
          id,
          attemptId,
          message: `The server rejected the upload (${request.status}).`,
        });
      }
    });
    request.addEventListener('error', () => {
      dispatch({
        type: 'failed',
        id,
        attemptId,
        message: 'The upload could not reach the server.',
      });
    });
    request.addEventListener('abort', () => {
      dispatch({ type: 'canceled', id, attemptId });
    });
    request.addEventListener('loadend', () => {
      controller.signal.removeEventListener('abort', abortRequest);
      if (controllers.current.get(attemptId) === controller) {
        controllers.current.delete(attemptId);
      }
    });

    request.open('POST', '/api/uploads');
    request.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    request.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
    request.send(file);
  }

  function retry(id: string, proposedAttemptId: string) {
    const file = selectedFiles.current.get(id);
    if (!file) throw new Error(`No local File is available to retry upload ${id}.`);

    startUpload(file, id, proposedAttemptId);
  }

  function cancel(id: string, attemptId: string) {
    const controller = controllers.current.get(attemptId);
    if (!controller) throw new Error(`No active transport exists for upload ${id}.`);

    dispatch({ type: 'cancel-requested', id, attemptId });
    controller.abort();
  }

  return (
    <FileUpload
      name="attachments"
      items={items}
      accept="image/*,.pdf"
      maxSizeMB={10}
      onSelect={({ selections }) => {
        dispatch({ type: 'selected', items: selections.map((entry) => entry.proposedItem) });

        for (const selection of selections) {
          if (!isAcceptedSelection(selection)) continue;

          selectedFiles.current.set(selection.id, selection.file);
          startUpload(selection.file, selection.id, selection.proposedAttemptId);
        }
      }}
      onRetry={({ id, proposedAttemptId }) => retry(id, proposedAttemptId)}
      onCancel={({ id, attemptId }) => cancel(id, attemptId)}
      onRemove={({ id }) => {
        selectedFiles.current.delete(id);
        dispatch({ type: 'removed', id });
      }}
    />
  );
}
