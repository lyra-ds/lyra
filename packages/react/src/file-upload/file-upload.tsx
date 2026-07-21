import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Icon } from '../icon';
import { cx } from '../internal/cx';

/** An item displayed by {@link FileUpload}. */
export interface FileUploadItem {
  /** Stable item identifier. */
  id: string;
  /** File name shown to the user. */
  name: string;
  /** File size in bytes, when known. */
  size?: number;
  /** Upload progress from 0 through 100. */
  progress: number;
  /** Current simulated upload state. */
  status: 'uploading' | 'done' | 'error';
  /** Validation error shown when `status` is `"error"`. */
  error?: string;
}

/** Props for {@link FileUpload}. */
export interface FileUploadProps {
  /** Primary dropzone text. */
  label?: string;
  /** Helper text, overriding the generated accept/size description. */
  hint?: string;
  /** Accepted file types, forwarded to the hidden file input and shown in the helper text. */
  accept?: string;
  /** Files larger than this many megabytes are added as error items. */
  maxSizeMB?: number;
  /** Whether more than one file can be added. Default `true`. */
  multiple?: boolean;
  /** Simulated upload duration in milliseconds. Default `1800`. */
  uploadDuration?: number;
  /** Items used to seed the uncontrolled list. */
  defaultItems?: FileUploadItem[];
  /** Called with the real browser `File` objects whenever files are added. */
  onFiles?: (files: File[]) => void;
  /** Called whenever the internal item list changes. */
  onChange?: (items: FileUploadItem[]) => void;
  /** Class appended after the public `.lyra-upload` class. */
  className?: string;
}

function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconFor(
  name: string,
): 'image' | 'file-text' | 'file-spreadsheet' | 'file-archive' | 'film' | 'file' {
  const extension = name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension ?? '')) return 'image';
  if (extension === 'pdf') return 'file-text';
  if (['xls', 'xlsx', 'csv'].includes(extension ?? '')) return 'file-spreadsheet';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension ?? '')) return 'file-archive';
  if (['mp4', 'mov', 'webm'].includes(extension ?? '')) return 'film';
  return 'file';
}

/**
 * An uncontrolled dropzone with drag-and-drop, keyboard-operable file browsing, size validation,
 * simulated upload progress, and removable items. It never accesses browser globals at module
 * scope, so it is safe to render on the server.
 */
export const FileUpload = /*#__PURE__*/ forwardRef<HTMLDivElement, FileUploadProps>(
  function FileUpload(
    {
      label = 'Drag files here or click to select',
      hint,
      accept,
      maxSizeMB,
      multiple = true,
      uploadDuration = 1800,
      defaultItems = [],
      onFiles,
      onChange,
      className,
    },
    ref,
  ) {
    const [items, setItems] = useState<FileUploadItem[]>(defaultItems);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
    const idRef = useRef(0);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
      const timers = timersRef.current;
      return () => Object.values(timers).forEach(clearInterval);
    }, []);

    const updateItems = useCallback((updater: (previous: FileUploadItem[]) => FileUploadItem[]) => {
      setItems((previous) => {
        const next = updater(previous);
        onChangeRef.current?.(next);
        return next;
      });
    }, []);

    const remove = useCallback(
      (id: string): void => {
        const timer = timersRef.current[id];
        if (timer) {
          clearInterval(timer);
          delete timersRef.current[id];
        }
        updateItems((previous) => previous.filter((item) => item.id !== id));
      },
      [updateItems],
    );

    const addFiles = useCallback(
      (fileList: FileList | null): void => {
        const files = Array.from(fileList ?? []);
        if (files.length === 0) return;
        onFiles?.(files);
        const stamped = files.map((file) => {
          const tooLarge = maxSizeMB !== undefined && file.size > maxSizeMB * 1024 * 1024;
          idRef.current += 1;
          return {
            id: `lyra-upload-${idRef.current}-${file.name}`,
            name: file.name,
            size: file.size,
            progress: tooLarge ? 0 : 5,
            status: tooLarge ? 'error' : 'uploading',
            error: tooLarge ? `Over ${maxSizeMB} MB` : undefined,
          } satisfies FileUploadItem;
        });
        const accepted = multiple ? stamped : stamped.slice(0, 1);
        updateItems((previous) => (multiple ? [...previous, ...accepted] : accepted));

        accepted
          .filter((item) => item.status === 'uploading')
          .forEach((item) => {
            const step = 100 / Math.max(uploadDuration / 120, 1);
            timersRef.current[item.id] = setInterval(() => {
              updateItems((previous) =>
                previous.map((current) => {
                  if (current.id !== item.id) return current;
                  const progress = Math.min(current.progress + step, 100);
                  if (progress === 100) {
                    clearInterval(timersRef.current[item.id]);
                    delete timersRef.current[item.id];
                    return { ...current, progress, status: 'done' };
                  }
                  return { ...current, progress };
                }),
              );
            }, 120);
          });
      },
      [maxSizeMB, multiple, onFiles, updateItems, uploadDuration],
    );

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
      addFiles(event.target.files);
      event.target.value = '';
    };
    const handleDrop = (event: DragEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      setDragging(false);
      addFiles(event.dataTransfer.files);
    };
    const generatedHint = [accept, maxSizeMB !== undefined && `Up to ${maxSizeMB} MB per file`]
      .filter(Boolean)
      .join(' · ');

    return (
      <div ref={ref} className={cx('lyra-upload', className)}>
        <button
          type="button"
          className={cx('lyra-upload__zone', dragging && 'lyra-upload__zone--drag')}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <span className="lyra-upload__zone-icon" aria-hidden="true">
            <Icon name="cloud-upload" size={22} />
          </span>
          <span className="lyra-upload__zone-label">{label}</span>
          {(hint || generatedHint) && (
            <span className="lyra-upload__zone-hint">{hint || generatedHint}</span>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            hidden
            tabIndex={-1}
            onChange={handleInputChange}
          />
        </button>
        {items.length > 0 && (
          <ul className="lyra-upload__list">
            {items.map((item) => (
              <li
                key={item.id}
                className={cx(
                  'lyra-upload__item',
                  item.status === 'error' && 'lyra-upload__item--error',
                )}
              >
                <span className="lyra-upload__item-icon" aria-hidden="true">
                  <Icon
                    name={item.status === 'error' ? 'circle-alert' : iconFor(item.name)}
                    size={17}
                  />
                </span>
                <span className="lyra-upload__item-body">
                  <span className="lyra-upload__item-row">
                    <span className="lyra-upload__item-name">{item.name}</span>
                    <span className="lyra-upload__item-meta">
                      {item.status === 'error'
                        ? item.error
                        : item.status === 'done'
                          ? formatBytes(item.size)
                          : `${Math.round(item.progress)}%`}
                    </span>
                  </span>
                  {item.status === 'uploading' && (
                    <span className="lyra-upload__bar">
                      <span
                        className="lyra-upload__bar-fill"
                        style={{ width: `${item.progress}%` }}
                      />
                    </span>
                  )}
                </span>
                {item.status === 'done' && (
                  <span className="lyra-upload__check" role="img" aria-label="Upload complete">
                    <Icon name="circle-check" size={17} />
                  </span>
                )}
                <button
                  type="button"
                  className="lyra-upload__remove"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => remove(item.id)}
                >
                  <Icon name="x" size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
