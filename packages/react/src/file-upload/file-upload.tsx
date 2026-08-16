import { forwardRef, useId, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { cx } from '../internal/cx';
import type {
  FileUploadItem,
  FileUploadMessages,
  FileUploadProps,
  FileUploadSelection,
} from './file-upload.types';
import { canRemove, canRetry, validateFile } from './file-upload.utils';

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
    void onRetry;

    const instanceId = useId();
    const counter = useRef(0);
    const inputId = `lyra-file-upload-${instanceId}-input`;
    const resolvedMessages = { ...DEFAULT_MESSAGES, ...messages };
    const resolvedLabel = label ?? resolvedMessages.label;
    const resolvedHint = hint ?? resolvedMessages.hint;

    const handleRootChange = (event: ChangeEvent<HTMLDivElement>): void => {
      onRootChange?.(event);
      if (event.defaultPrevented) return;

      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== 'file') return;

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
              disabled={disabled}
              onClick={() => onCancel({ id: item.id, attemptId: item.attemptId })}
            >
              {resolvedMessages.cancel(item.name)}
            </button>
          ) : null}
          {canRetry(item) ? (
            <button type="button" className="lyra-upload__retry" disabled>
              {resolvedMessages.retry(item.name)}
            </button>
          ) : null}
          {canRemove(item) ? (
            <button
              type="button"
              className="lyra-upload__remove"
              disabled={disabled}
              onClick={() => onRemove({ id: item.id })}
            >
              {resolvedMessages.remove(item.name)}
            </button>
          ) : null}
        </li>
      );
    };

    return (
      <div
        ref={ref}
        {...rootProps}
        className={cx('lyra-upload', className)}
        data-disabled={disabled ? 'true' : undefined}
        data-state={items.length === 0 ? 'idle' : 'active'}
        onChange={handleRootChange}
      >
        <label
          className="lyra-upload__zone"
          htmlFor={inputId}
          aria-disabled={disabled || undefined}
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
          className="lyra-upload__input"
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          required={required}
        />
        {items.length > 0 ? <ul className="lyra-upload__list">{items.map(renderItem)}</ul> : null}
        <span
          className="lyra-upload__live lyra-visually-hidden"
          aria-live="polite"
          aria-atomic="true"
        />
      </div>
    );
  },
);
