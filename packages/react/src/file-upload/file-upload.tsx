import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent } from 'react';
import { cx } from '../internal/cx';
import type {
  FileUploadItem,
  FileUploadMessages,
  FileUploadProps,
  FileUploadSelection,
} from './file-upload.types';
import {
  canRemove,
  canRetry,
  identityKey,
  intentKey,
  isActive,
  itemAttemptId,
  pruneAnnouncementHistory,
  progressMilestone,
  reconcileAttemptHistory,
  validateFile,
} from './file-upload.utils';
import type { FileUploadAttemptHistory, FileUploadIntentKey } from './file-upload.utils';

const DEFAULT_MESSAGES: Required<FileUploadMessages> = {
  label: 'Drag files here or click to select',
  hint: '',
  browse: 'Browse files',
  retry: (name) => `Retry ${name}`,
  cancel: (name) => `Cancel ${name}`,
  remove: (name) => `Remove ${name}`,
  selectionUnavailable: 'File replacement is unavailable while an upload is active.',
  validationAccept: (name, accept) => `${name} must match ${accept}.`,
  validationMaxSize: (name, maxSizeMB) => `${name} must not exceed ${maxSizeMB} MB.`,
  selected: (name) => `${name} selected.`,
  progress: (name, percent) => `${name} is ${percent}% uploaded.`,
  progressIndeterminate: (name) => `${name} is uploading.`,
  canceling: (name) => `Canceling ${name}.`,
  success: (name) => `${name} uploaded.`,
  error: (name, message) => `${name}: ${message}`,
  canceled: (name) => `${name} canceled.`,
  removed: (name) => `${name} removed.`,
};

function toIdSegment(value: string): string {
  return Array.from(value, (character) => character.codePointAt(0)!.toString(36)).join('-');
}

function announce(node: HTMLSpanElement | null, message: string): void {
  if (node === null) return;
  node.replaceChildren(document.createTextNode(message));
}

function firstAvailableAction(
  root: HTMLDivElement | null,
  itemId: string,
): HTMLButtonElement | null {
  if (root === null) return null;

  for (const row of root.querySelectorAll<HTMLElement>('.lyra-upload__item')) {
    if (row.dataset.uploadId !== itemId) continue;
    return row.querySelector<HTMLButtonElement>('button:not(:disabled)');
  }

  return null;
}

export const FileUpload = /*#__PURE__*/ forwardRef<HTMLDivElement, FileUploadProps>(
  function FileUpload(
    {
      items = [],
      onSelect,
      onRetry,
      onCancel,
      onRemove,
      name,
      accept,
      maxSizeMB,
      multiple = true,
      disabled = false,
      required = false,
      label,
      hint,
      messages,
      className,
      onChange: onRootChange,
      ...rootProps
    },
    ref,
  ) {
    const instanceId = useId();
    const counter = useRef(0);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const zoneRef = useRef<HTMLLabelElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const liveRegionRef = useRef<HTMLSpanElement | null>(null);
    const pendingIntentKeysRef = useRef<Set<FileUploadIntentKey>>(new Set());
    const announcedKeysRef = useRef<Map<string, Set<string>>>(new Map());
    const previousProgressRef = useRef<Map<string, number>>(new Map());
    const previousItemsRef = useRef<
      readonly { id: string; name: string; attemptId: string | null }[]
    >([]);
    const lastFocusedActionRef = useRef<string | null>(null);
    const [attemptHistory, setAttemptHistory] = useState<FileUploadAttemptHistory>(
      () => reconcileAttemptHistory(items, new Map()).history,
    );
    const [pendingIntentKeys, setPendingIntentKeys] = useState<ReadonlySet<FileUploadIntentKey>>(
      () => new Set(),
    );
    const inputId = `lyra-file-upload-${instanceId}-input`;
    const resolvedMessages = useMemo(() => ({ ...DEFAULT_MESSAGES, ...messages }), [messages]);
    const resolvedLabel = label ?? resolvedMessages.label;
    const resolvedHint = hint ?? resolvedMessages.hint;
    const reconciledAttempts = useMemo(
      () => reconcileAttemptHistory(items, attemptHistory),
      [attemptHistory, items],
    );
    if (reconciledAttempts.history !== attemptHistory) {
      setAttemptHistory(reconciledAttempts.history);
    }
    const visibleItems = reconciledAttempts.visibleItems;
    const visibleIntentKeys = useMemo(() => new Set(visibleItems.map(intentKey)), [visibleItems]);
    const visiblePendingIntentKeys = useMemo(
      () => new Set([...pendingIntentKeys].filter((key) => visibleIntentKeys.has(key))),
      [pendingIntentKeys, visibleIntentKeys],
    );
    const selectionBlocked = !multiple && visibleItems.some(isActive);

    const setRootRef = useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref !== null) ref.current = node;
      },
      [ref],
    );

    useEffect(() => {
      const handleDocumentFocusIn = (event: globalThis.FocusEvent): void => {
        const focusedNode = event.target;
        const root = rootRef.current;
        if (!(focusedNode instanceof Node) || root === null) return;

        if (!root.contains(focusedNode)) {
          lastFocusedActionRef.current = null;
          return;
        }

        if (
          !(focusedNode instanceof HTMLButtonElement) ||
          focusedNode.closest('.lyra-upload__item') === null
        ) {
          lastFocusedActionRef.current = null;
        }
      };

      document.addEventListener('focusin', handleDocumentFocusIn);
      return () => document.removeEventListener('focusin', handleDocumentFocusIn);
    }, []);

    useEffect(() => {
      if (!selectionBlocked) return;

      const isSelectionEvent = (event: Event): boolean => {
        const target = event.target;
        return (
          target === inputRef.current ||
          (target instanceof Node && zoneRef.current?.contains(target) === true)
        );
      };
      const preventSelection = (event: Event): void => {
        if (event.defaultPrevented || !isSelectionEvent(event)) return;
        event.preventDefault();
      };
      const rejectSelection = (event: Event): void => {
        if (event.defaultPrevented || !isSelectionEvent(event)) return;
        event.preventDefault();
        announce(liveRegionRef.current, resolvedMessages.selectionUnavailable);
      };

      document.addEventListener('click', rejectSelection);
      document.addEventListener('dragover', preventSelection);
      document.addEventListener('drop', rejectSelection);
      return () => {
        document.removeEventListener('click', rejectSelection);
        document.removeEventListener('dragover', preventSelection);
        document.removeEventListener('drop', rejectSelection);
      };
    }, [resolvedMessages.selectionUnavailable, selectionBlocked]);

    useEffect(() => {
      for (const key of pendingIntentKeysRef.current) {
        if (!visibleIntentKeys.has(key)) pendingIntentKeysRef.current.delete(key);
      }

      const previousItems = previousItemsRef.current;
      const currentIds = new Set(visibleItems.map((item) => item.id));
      const controlledIds = new Set(items.map((item) => item.id));
      const retainedProgressKeys = new Set<string>();
      const announcementCandidates: { itemId: string; key: string; message: string }[] = [];
      const wasAnnounced = (itemId: string, key: string): boolean =>
        announcedKeysRef.current.get(itemId)?.has(key) === true;

      for (const item of visibleItems) {
        const attemptId = itemAttemptId(item);
        const stateKey = identityKey(item.id, attemptId, item.status);
        if (attemptId !== null) retainedProgressKeys.add(identityKey(item.id, attemptId));

        if (item.status === 'uploading' && item.progress.kind === 'determinate') {
          const progressKey = identityKey(item.id, attemptId);
          const previousProgress = previousProgressRef.current.get(progressKey) ?? 0;
          const milestone = progressMilestone(previousProgress, item.progress.value);
          previousProgressRef.current.set(
            progressKey,
            Math.max(previousProgress, item.progress.value),
          );
          if (milestone !== null) {
            const milestoneKey = identityKey(item.id, attemptId, item.status, milestone);
            if (!wasAnnounced(item.id, milestoneKey)) {
              announcementCandidates.push({
                itemId: item.id,
                key: milestoneKey,
                message: resolvedMessages.progress(item.name, milestone),
              });
            }
          }
          continue;
        }

        if (wasAnnounced(item.id, stateKey)) continue;

        const stateAnnouncement =
          item.status === 'selected'
            ? resolvedMessages.selected(item.name)
            : item.status === 'canceling'
              ? resolvedMessages.canceling(item.name)
              : item.status === 'success'
                ? resolvedMessages.success(item.name)
                : item.status === 'error'
                  ? resolvedMessages.error(item.name, item.error.message)
                  : item.status === 'canceled'
                    ? resolvedMessages.canceled(item.name)
                    : null;

        if (stateAnnouncement !== null) {
          announcementCandidates.push({
            itemId: item.id,
            key: stateKey,
            message: stateAnnouncement,
          });
        }
      }

      for (const key of previousProgressRef.current.keys()) {
        if (!retainedProgressKeys.has(key)) previousProgressRef.current.delete(key);
      }

      for (const previousItem of previousItems) {
        if (controlledIds.has(previousItem.id)) continue;
        const removalKey = identityKey(previousItem.id, previousItem.attemptId, 'removed');
        if (!wasAnnounced(previousItem.id, removalKey)) {
          announcementCandidates.push({
            itemId: previousItem.id,
            key: removalKey,
            message: resolvedMessages.removed(previousItem.name),
          });
        }
      }

      if (announcementCandidates.length > 0) {
        for (const candidate of announcementCandidates) {
          const itemKeys = announcedKeysRef.current.get(candidate.itemId) ?? new Set<string>();
          itemKeys.add(candidate.key);
          announcedKeysRef.current.set(candidate.itemId, itemKeys);
        }
        announce(
          liveRegionRef.current,
          announcementCandidates.map((candidate) => candidate.message).join(' '),
        );
      }
      announcedKeysRef.current = pruneAnnouncementHistory(announcedKeysRef.current, visibleItems);

      const focusedItemId = lastFocusedActionRef.current;
      const removedFocusedIndex =
        focusedItemId === null
          ? -1
          : previousItems.findIndex(
              (previousItem) =>
                previousItem.id === focusedItemId && !controlledIds.has(focusedItemId),
            );
      if (removedFocusedIndex >= 0) {
        const followingIds = previousItems.slice(removedFocusedIndex + 1).map((item) => item.id);
        const precedingIds = previousItems
          .slice(0, removedFocusedIndex)
          .map((item) => item.id)
          .reverse();
        let focusTarget: HTMLButtonElement | null = null;

        for (const itemId of [...followingIds, ...precedingIds]) {
          if (!currentIds.has(itemId)) continue;
          focusTarget = firstAvailableAction(rootRef.current, itemId);
          if (focusTarget !== null) break;
        }

        lastFocusedActionRef.current = null;
        (focusTarget ?? inputRef.current)?.focus();
      }

      previousItemsRef.current = visibleItems.map((item) => ({
        id: item.id,
        name: item.name,
        attemptId: itemAttemptId(item),
      }));
    }, [items, resolvedMessages, visibleIntentKeys, visibleItems]);

    const lockIntent = (item: FileUploadItem): boolean => {
      const key = intentKey(item);
      if (pendingIntentKeysRef.current.has(key)) return false;

      pendingIntentKeysRef.current.add(key);
      setPendingIntentKeys((currentKeys) => {
        const nextKeys = new Set(
          [...currentKeys].filter((currentKey) => visibleIntentKeys.has(currentKey)),
        );
        nextKeys.add(key);
        return nextKeys;
      });
      return true;
    };

    const announceSelectionUnavailable = (): void => {
      announce(liveRegionRef.current, resolvedMessages.selectionUnavailable);
    };

    const handleRootChange = (event: ChangeEvent<HTMLDivElement>): void => {
      onRootChange?.(event);
      if (event.defaultPrevented) return;

      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== 'file') return;

      if (selectionBlocked) {
        announceSelectionUnavailable();
        input.value = '';
        return;
      }

      const files = Array.from(input.files ?? []);
      const proposedFiles = multiple ? files : files.slice(0, 1);
      const selections = proposedFiles.map((file) => {
        counter.current += 1;
        const id = `lyra-file-upload-${instanceId}-${counter.current}`;
        const error = validateFile(file, { accept, maxSizeMB }, resolvedMessages);

        if (error) {
          return {
            id,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            proposedItem: {
              id,
              name: file.name,
              size: file.size,
              type: file.type,
              status: 'error',
              error,
            },
          } satisfies FileUploadSelection;
        }

        const proposedAttemptId = `lyra-file-upload-${instanceId}-attempt-${counter.current}`;

        return {
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          proposedItem: {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'selected',
          },
          proposedAttemptId,
        } satisfies FileUploadSelection;
      });

      if (selections.length > 0) onSelect({ selections });
      input.value = '';
    };

    const handleActionFocus = (itemId: string, event: FocusEvent<HTMLButtonElement>): void => {
      if (event.currentTarget === event.target) lastFocusedActionRef.current = itemId;
    };

    const renderItem = (item: FileUploadItem) => {
      const statusId = `lyra-file-upload-${instanceId}-status-${toIdSegment(item.id)}`;
      const status =
        item.status === 'selected'
          ? resolvedMessages.selected(item.name)
          : item.status === 'uploading'
            ? item.progress.kind === 'determinate'
              ? resolvedMessages.progress(item.name, item.progress.value)
              : resolvedMessages.progressIndeterminate(item.name)
            : item.status === 'canceling'
              ? resolvedMessages.canceling(item.name)
              : item.status === 'success'
                ? resolvedMessages.success(item.name)
                : item.status === 'error'
                  ? resolvedMessages.error(item.name, item.error.message)
                  : resolvedMessages.canceled(item.name);

      return (
        <li
          key={item.id}
          className={cx('lyra-upload__item', item.status === 'error' && 'lyra-upload__item--error')}
          data-state={item.status}
          data-upload-id={item.id}
        >
          <span className="lyra-upload__item-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor">
              <path d="M6 2h9l4 4v16H6zM15 2v5h4" />
            </svg>
          </span>
          <div className="lyra-upload__item-body">
            <div className="lyra-upload__item-row">
              <span className="lyra-upload__item-name">{item.name}</span>
              <span id={statusId} className="lyra-upload__item-meta">
                {status}
              </span>
            </div>
            {item.status === 'uploading' || item.status === 'canceling' ? (
              <progress
                className="lyra-upload__bar"
                aria-labelledby={statusId}
                max={100}
                value={item.progress.kind === 'determinate' ? item.progress.value : undefined}
              />
            ) : null}
          </div>
          {item.status === 'uploading' ? (
            <button
              type="button"
              className="lyra-upload__cancel"
              disabled={disabled || visiblePendingIntentKeys.has(intentKey(item))}
              onFocus={(event) => handleActionFocus(item.id, event)}
              onClick={() => {
                if (lockIntent(item)) onCancel({ id: item.id, attemptId: item.attemptId });
              }}
            >
              {resolvedMessages.cancel(item.name)}
            </button>
          ) : null}
          {canRetry(item) ? (
            <button
              type="button"
              className="lyra-upload__retry"
              disabled={disabled || visiblePendingIntentKeys.has(intentKey(item))}
              onFocus={(event) => handleActionFocus(item.id, event)}
              onClick={() => {
                if (!lockIntent(item)) return;
                const previousAttemptId = itemAttemptId(item);
                if (previousAttemptId === null) return;
                counter.current += 1;
                onRetry({
                  id: item.id,
                  previousAttemptId,
                  proposedAttemptId: `lyra-file-upload-${instanceId}-attempt-${counter.current}`,
                });
              }}
            >
              {resolvedMessages.retry(item.name)}
            </button>
          ) : null}
          {canRemove(item) ? (
            <button
              type="button"
              className="lyra-upload__remove"
              disabled={disabled || visiblePendingIntentKeys.has(intentKey(item))}
              onFocus={(event) => handleActionFocus(item.id, event)}
              onClick={() => {
                if (lockIntent(item)) onRemove({ id: item.id });
              }}
            >
              {resolvedMessages.remove(item.name)}
            </button>
          ) : null}
        </li>
      );
    };

    return (
      <div
        ref={setRootRef}
        {...rootProps}
        className={cx('lyra-upload', className)}
        data-disabled={disabled ? 'true' : undefined}
        data-state={visibleItems.length === 0 ? 'idle' : 'active'}
        onChange={handleRootChange}
      >
        <label
          ref={zoneRef}
          className="lyra-upload__zone"
          htmlFor={inputId}
          aria-disabled={disabled || selectionBlocked || undefined}
        >
          <span className="lyra-upload__zone-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor">
              <path d="M12 21v-9m0 0-4 4m4-4 4 4M5 16a4 4 0 0 1 .4-8A7 7 0 0 1 19 9a3.5 3.5 0 0 1 0 7" />
            </svg>
          </span>
          <span className="lyra-upload__zone-label">{resolvedLabel}</span>
          {resolvedHint ? <span className="lyra-upload__zone-hint">{resolvedHint}</span> : null}
        </label>
        <input
          id={inputId}
          ref={inputRef}
          className="lyra-upload__input"
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          required={required}
        />
        {visibleItems.length > 0 ? (
          <ul className="lyra-upload__list">{visibleItems.map(renderItem)}</ul>
        ) : null}
        <span
          ref={liveRegionRef}
          className="lyra-upload__live lyra-visually-hidden"
          aria-live="polite"
          aria-atomic="true"
        />
      </div>
    );
  },
);
