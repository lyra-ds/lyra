import { forwardRef, useId, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { cx } from '../internal/cx';
import type { FileUploadMessages, FileUploadProps, FileUploadSelection } from './file-upload.types';
import { validateFile } from './file-upload.utils';

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
      ...rootProps
    },
    ref,
  ) {
    void onRetry;
    void onCancel;
    void onRemove;

    const instanceId = useId();
    const counter = useRef(0);
    const inputId = `lyra-file-upload-${instanceId}-input`;
    const resolvedMessages = { ...DEFAULT_MESSAGES, ...messages };
    const resolvedLabel = label ?? resolvedMessages.label;
    const resolvedHint = hint ?? resolvedMessages.hint;

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
      const files = Array.from(event.currentTarget.files ?? []);
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
      event.currentTarget.value = '';
    };

    return (
      <div
        ref={ref}
        {...rootProps}
        className={cx('lyra-upload', className)}
        data-disabled={disabled ? 'true' : undefined}
        data-state={items.length === 0 ? 'idle' : 'active'}
      >
        <label
          className="lyra-upload__zone"
          htmlFor={inputId}
          aria-disabled={disabled || undefined}
        >
          <span className="lyra-upload__zone-label">{resolvedLabel}</span>
          {resolvedHint ? <span className="lyra-upload__zone-hint">{resolvedHint}</span> : null}
        </label>
        <input
          id={inputId}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          required={required}
          onChange={handleInputChange}
        />
      </div>
    );
  },
);
