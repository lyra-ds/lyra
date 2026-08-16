import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import '@lyra-ds/styles/styles.css';
import { FILE_UPLOAD_SCENARIOS } from '../../../../tools/file-upload/scenarios';
import { FileUpload } from './index';
import type { FileUploadItem } from './file-upload.types';
import {
  canRemove,
  canRetry,
  isActive,
  progressMilestone,
  validateFile,
} from './file-upload.utils';

const VALIDATION_MESSAGES = {
  validationAccept: (name: string, accept: string) => `${name} must match ${accept}.`,
  validationMaxSize: (name: string, maxSizeMB: number) =>
    `${name} must not exceed ${maxSizeMB} MB.`,
};

afterEach(async () => {
  await cleanup();
});

describe('FileUpload', () => {
  it('ignores unsupported MIME wildcards', () => {
    expect(
      validateFile(
        { name: 'notes.txt', size: 1, type: 'text/plain' },
        { accept: 'application/*, text/*, */*' },
        VALIDATION_MESSAGES,
      ),
    ).toBeNull();
  });

  it('enforces supported accept tokens while ignoring invalid tokens', () => {
    const rejected = validateFile(
      { name: 'notes.txt', size: 1, type: 'text/plain' },
      { accept: 'application/*, .pdf, text/*' },
      VALIDATION_MESSAGES,
    );

    expect(rejected).toMatchObject({ kind: 'validation', code: 'accept', retryable: false });
  });

  it('accepts exact MIME types, native media wildcards, and case-insensitive extensions', () => {
    const acceptedFiles = [
      { file: { name: 'report.bin', size: 1, type: 'application/pdf' }, accept: 'application/pdf' },
      { file: { name: 'track.bin', size: 1, type: 'audio/mpeg' }, accept: 'audio/*' },
      { file: { name: 'movie.bin', size: 1, type: 'video/mp4' }, accept: 'video/*' },
      { file: { name: 'photo.bin', size: 1, type: 'image/png' }, accept: 'image/*' },
      { file: { name: 'REPORT.PDF', size: 1, type: 'application/octet-stream' }, accept: '.pdf' },
    ] as const;

    for (const { file, accept } of acceptedFiles) {
      expect(validateFile(file, { accept }, VALIDATION_MESSAGES)).toBeNull();
    }
  });

  it('allows the decimal size limit exactly and rejects the next byte', () => {
    expect(
      validateFile(
        { name: 'at-limit.pdf', size: 1_000_000, type: 'application/pdf' },
        { maxSizeMB: 1 },
        VALIDATION_MESSAGES,
      ),
    ).toBeNull();
    expect(
      validateFile(
        { name: 'over-limit.pdf', size: 1_000_001, type: 'application/pdf' },
        { maxSizeMB: 1 },
        VALIDATION_MESSAGES,
      ),
    ).toMatchObject({ kind: 'validation', code: 'max-size', retryable: false });
  });

  it('proposes only the first single-file selection and does not spend identities on discards', async () => {
    const onSelect = vi.fn();
    const screen = await render(
      <FileUpload
        items={[]}
        multiple={false}
        onSelect={onSelect}
        onRetry={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const input = screen.getByLabelText('Drag files here or click to select');
    const inputElement = input.element() as HTMLInputElement;
    const initialFiles = new DataTransfer();
    initialFiles.items.add(new File(['first'], 'first.pdf', { type: 'application/pdf' }));
    initialFiles.items.add(new File(['discarded'], 'discarded.pdf', { type: 'application/pdf' }));
    Object.defineProperty(inputElement, 'files', { configurable: true, value: initialFiles.files });
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.waitFor(() => expect(onSelect).toHaveBeenCalledOnce());
    const firstSelection = onSelect.mock.calls[0][0].selections;
    expect(firstSelection).toHaveLength(1);
    expect(firstSelection[0]).toMatchObject({ name: 'first.pdf' });
    expect(firstSelection[0].id).toMatch(/-1$/);
    expect(firstSelection[0].proposedAttemptId).toMatch(/-attempt-1$/);

    const nextFile = new DataTransfer();
    nextFile.items.add(new File(['next'], 'next.pdf', { type: 'application/pdf' }));
    Object.defineProperty(inputElement, 'files', { configurable: true, value: nextFile.files });
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.waitFor(() => expect(onSelect).toHaveBeenCalledTimes(2));
    const nextSelection = onSelect.mock.calls[1][0].selections[0];
    expect(nextSelection).toMatchObject({ name: 'next.pdf' });
    expect(nextSelection.id).toMatch(/-2$/);
    expect(nextSelection.proposedAttemptId).toMatch(/-attempt-2$/);
  });

  it('derives item actions and progress milestones from the controlled state', () => {
    const selected = {
      id: 'selected',
      name: 'selected.pdf',
      size: 1,
      type: 'application/pdf',
      status: 'selected',
    } as const satisfies FileUploadItem;
    const uploading = {
      id: 'uploading',
      name: 'uploading.pdf',
      size: 1,
      type: 'application/pdf',
      status: 'uploading',
      attemptId: 'attempt-uploading',
      progress: { kind: 'determinate', value: 50 },
    } as const satisfies FileUploadItem;
    const canceling = {
      id: 'canceling',
      name: 'canceling.pdf',
      size: 1,
      type: 'application/pdf',
      status: 'canceling',
      attemptId: 'attempt-canceling',
      progress: { kind: 'indeterminate' },
    } as const satisfies FileUploadItem;
    const retryableTransportError = {
      id: 'retryable',
      name: 'retryable.pdf',
      size: 1,
      type: 'application/pdf',
      status: 'error',
      attemptId: 'attempt-error',
      error: { kind: 'transport', message: 'Offline', retryable: true },
    } as const satisfies FileUploadItem;
    const validationError = {
      id: 'validation',
      name: 'validation.txt',
      size: 1,
      type: 'text/plain',
      status: 'error',
      error: { kind: 'validation', code: 'accept', message: 'Not a PDF', retryable: false },
    } as const satisfies FileUploadItem;
    const canceled = {
      id: 'canceled',
      name: 'canceled.pdf',
      size: 1,
      type: 'application/pdf',
      status: 'canceled',
      attemptId: 'attempt-canceled',
    } as const satisfies FileUploadItem;

    expect(isActive(selected)).toBe(false);
    expect(isActive(uploading)).toBe(true);
    expect(isActive(canceling)).toBe(true);
    expect(canRetry(retryableTransportError)).toBe(true);
    expect(canRetry(validationError)).toBe(false);
    expect(canRetry(canceled)).toBe(true);
    expect(canRemove(selected)).toBe(true);
    expect(canRemove(uploading)).toBe(false);
    expect(canRemove(canceling)).toBe(false);
    expect(canRemove(validationError)).toBe(true);
    expect(progressMilestone(24, 25)).toBe(25);
    expect(progressMilestone(49, 51)).toBe(50);
    expect(progressMilestone(74, 76)).toBe(75);
    expect(progressMilestone(75, 100)).toBe(100);
    expect(progressMilestone(50, 50)).toBeNull();
  });

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

  it('proposes validation errors without attempts for rejected files', async () => {
    const onSelect = vi.fn();
    const screen = await render(
      <FileUpload
        accept=".pdf"
        maxSizeMB={1}
        items={[]}
        onSelect={onSelect}
        onRetry={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    await userEvent.upload(
      screen.getByLabelText('Drag files here or click to select'),
      new File(['text'], 'report.txt', { type: 'text/plain' }),
    );

    expect(onSelect.mock.calls[0][0].selections[0]).toMatchObject({
      proposedItem: {
        status: 'error',
        error: { kind: 'validation', code: 'accept', retryable: false },
      },
    });
    expect(onSelect.mock.calls[0][0].selections[0].proposedAttemptId).toBeUndefined();

    await userEvent.upload(
      screen.getByLabelText('Drag files here or click to select'),
      new File([new Uint8Array(1_000_001)], 'large.pdf', { type: 'application/pdf' }),
    );

    expect(onSelect.mock.calls[1][0].selections[0]).toMatchObject({
      proposedItem: {
        status: 'error',
        error: { kind: 'validation', code: 'max-size', retryable: false },
      },
    });
    expect(onSelect.mock.calls[1][0].selections[0].proposedAttemptId).toBeUndefined();
  });
});
