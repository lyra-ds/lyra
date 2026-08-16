import { afterEach, describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import type { ChangeEvent } from 'react';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import '@lyra-ds/styles/styles.css';
import { FILE_UPLOAD_SCENARIOS } from '../../../../tools/file-upload/scenarios';
import { expectNoAxeViolations } from '../internal/test-axe';
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

  it(FILE_UPLOAD_SCENARIOS.lifecycle, async () => {
    const onCancel = vi.fn();
    const onRemove = vi.fn();
    const screen = await render(
      <FileUpload
        items={[
          {
            id: 'selected',
            name: 'selected.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'selected',
          },
          {
            id: 'uploading',
            name: 'uploading.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'uploading',
            attemptId: 'uploading-1',
            progress: { kind: 'determinate', value: 100 },
          },
          {
            id: 'canceling',
            name: 'canceling.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'canceling',
            attemptId: 'canceling-1',
            progress: { kind: 'indeterminate' },
          },
          {
            id: 'transport-error',
            name: 'transport-error.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'error',
            attemptId: 'transport-error-1',
            error: { kind: 'transport', message: 'Offline', retryable: true },
          },
          {
            id: 'validation-error',
            name: 'validation-error.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'error',
            error: { kind: 'validation', code: 'accept', message: 'Not a PDF', retryable: false },
          },
          {
            id: 'canceled',
            name: 'canceled.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'canceled',
            attemptId: 'canceled-1',
          },
          {
            id: 'success',
            name: 'success.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'success',
            attemptId: 'success-1',
          },
        ]}
        onSelect={vi.fn()}
        onRetry={vi.fn()}
        onCancel={onCancel}
        onRemove={onRemove}
      />,
    );

    expect(screen.container.querySelector('.lyra-upload')).toHaveAttribute('data-state', 'active');
    expect(screen.container.querySelectorAll('.lyra-upload__item')).toHaveLength(7);
    expect(screen.container.querySelector('[data-state="uploading"]')).toHaveAttribute(
      'data-state',
      'uploading',
    );
    expect(screen.container.querySelector('[data-state="canceling"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Cancel uploading.pdf' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Remove selected.pdf' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Retry transport-error.pdf' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Retry canceled.pdf' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Remove canceling.pdf' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel uploading.pdf' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove selected.pdf' }));
    expect(onCancel).toHaveBeenCalledWith({ id: 'uploading', attemptId: 'uploading-1' });
    expect(onRemove).toHaveBeenCalledWith({ id: 'selected' });
  });

  it(FILE_UPLOAD_SCENARIOS.retry, async () => {
    const onRetry = vi.fn();
    const errorItem = {
      id: 'report',
      name: 'report.pdf',
      size: 1,
      type: 'application/pdf',
      status: 'error',
      attemptId: 'attempt-1',
      error: { kind: 'transport', message: 'Network failed', retryable: true },
    } as const satisfies FileUploadItem;
    const screen = await render(
      <FileUpload
        items={[errorItem]}
        onSelect={vi.fn()}
        onRetry={onRetry}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    const retry = screen.getByRole('button', { name: 'Retry report.pdf' });
    await retry.click();
    (retry.element() as HTMLButtonElement).click();

    expect(onRetry).toHaveBeenCalledOnce();
    expect(onRetry).toHaveBeenCalledWith({
      id: 'report',
      previousAttemptId: 'attempt-1',
      proposedAttemptId: expect.any(String),
    });
    expect(retry).toBeDisabled();

    const proposedAttemptId = onRetry.mock.calls[0][0].proposedAttemptId as string;
    expect(proposedAttemptId).toMatch(/^lyra-file-upload-.+-attempt-1$/);
    await screen.rerender(
      <FileUpload
        items={[
          {
            ...errorItem,
            status: 'uploading',
            attemptId: proposedAttemptId,
            progress: { kind: 'determinate', value: 25 },
          },
        ]}
        onSelect={vi.fn()}
        onRetry={onRetry}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    await vi.waitFor(() =>
      expect(screen.container.querySelector('.lyra-upload__live')).toHaveTextContent(
        'report.pdf is 25% uploaded.',
      ),
    );

    await screen.rerender(
      <FileUpload
        items={[errorItem]}
        onSelect={vi.fn()}
        onRetry={onRetry}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.container.querySelector('.lyra-upload__item')).toHaveAttribute(
      'data-state',
      'uploading',
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '25');
    expect(screen.container.querySelector('.lyra-upload__live')).toHaveTextContent(
      'report.pdf is 25% uploaded.',
    );
  });

  it('DF-FU-04 keeps StrictMode replay finite and does not resurrect a removed stale attempt', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const sharedProps = {
      onSelect: vi.fn(),
      onRetry: vi.fn(),
      onCancel: vi.fn(),
      onRemove: vi.fn(),
    };
    const item = (attemptId: string) =>
      ({
        id: 'report',
        name: 'report.pdf',
        size: 1,
        type: 'application/pdf',
        status: 'uploading',
        attemptId,
        progress: { kind: 'determinate', value: 25 },
      }) as const satisfies FileUploadItem;

    try {
      const screen = await render(
        <StrictMode>
          <FileUpload items={[item('attempt-1')]} {...sharedProps} />
        </StrictMode>,
      );
      await screen.rerender(
        <StrictMode>
          <FileUpload items={[item('attempt-2')]} {...sharedProps} />
        </StrictMode>,
      );
      await screen.rerender(
        <StrictMode>
          <FileUpload items={[]} {...sharedProps} />
        </StrictMode>,
      );
      await screen.rerender(
        <StrictMode>
          <FileUpload items={[item('attempt-1')]} {...sharedProps} />
        </StrictMode>,
      );

      expect(screen.container.querySelector('.lyra-upload__item')).toBeNull();
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it(FILE_UPLOAD_SCENARIOS.cancellation, async () => {
    const onCancel = vi.fn();
    const uploadingItem = {
      id: 'video',
      name: 'video.mp4',
      size: 1,
      type: 'video/mp4',
      status: 'uploading',
      attemptId: 'attempt-1',
      progress: { kind: 'indeterminate' },
    } as const satisfies FileUploadItem;
    const screen = await render(
      <FileUpload
        items={[uploadingItem]}
        onSelect={vi.fn()}
        onRetry={vi.fn()}
        onCancel={onCancel}
        onRemove={vi.fn()}
      />,
    );

    const cancel = screen.getByRole('button', { name: 'Cancel video.mp4' });
    await cancel.click();
    (cancel.element() as HTMLButtonElement).click();

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledWith({ id: 'video', attemptId: 'attempt-1' });
    expect(cancel).toBeDisabled();

    await screen.rerender(
      <FileUpload
        items={[{ ...uploadingItem, status: 'canceling' }]}
        onSelect={vi.fn()}
        onRetry={vi.fn()}
        onCancel={onCancel}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancel video.mp4' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove video.mp4' })).not.toBeInTheDocument();
    await vi.waitFor(() =>
      expect(screen.container.querySelector('.lyra-upload__live')).toHaveTextContent(
        'Canceling video.mp4.',
      ),
    );
    await cleanup();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it(FILE_UPLOAD_SCENARIOS.removal, async () => {
    const onRemove = vi.fn();
    const makeItem = (id: string) =>
      ({
        id,
        name: `${id}.pdf`,
        size: 1,
        type: 'application/pdf',
        status: 'success',
        attemptId: `${id}-attempt`,
      }) as const satisfies FileUploadItem;
    const first = makeItem('first');
    const middle = makeItem('middle');
    const last = makeItem('last');
    const sharedProps = {
      onSelect: vi.fn(),
      onRetry: vi.fn(),
      onCancel: vi.fn(),
      onRemove,
    };
    const screen = await render(<FileUpload items={[first, middle, last]} {...sharedProps} />);

    const removeMiddle = screen.getByRole('button', { name: 'Remove middle.pdf' });
    await removeMiddle.click();
    expect(removeMiddle).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove last.pdf' })).not.toHaveFocus();
    expect(screen.getByLabelText('Drag files here or click to select')).not.toHaveFocus();

    await screen.rerender(<FileUpload items={[first, middle, last]} {...sharedProps} />);
    expect(screen.getByRole('button', { name: 'Remove last.pdf' })).not.toHaveFocus();
    expect(screen.getByLabelText('Drag files here or click to select')).not.toHaveFocus();

    await screen.rerender(<FileUpload items={[first, last]} {...sharedProps} />);
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Remove last.pdf' })).toHaveFocus(),
    );

    await screen.getByRole('button', { name: 'Remove last.pdf' }).click();
    await screen.rerender(<FileUpload items={[first]} {...sharedProps} />);
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Remove first.pdf' })).toHaveFocus(),
    );

    await screen.getByRole('button', { name: 'Remove first.pdf' }).click();
    await screen.rerender(<FileUpload items={[]} {...sharedProps} />);
    await vi.waitFor(() =>
      expect(screen.getByLabelText('Drag files here or click to select')).toHaveFocus(),
    );
    expect(onRemove).toHaveBeenCalledTimes(3);
  });

  it('DF-FU-06 does not steal focus after the user leaves a pending removed row', async () => {
    const item = {
      id: 'report',
      name: 'report.pdf',
      size: 1,
      type: 'application/pdf',
      status: 'success',
      attemptId: 'report-1',
    } as const satisfies FileUploadItem;
    const sharedProps = {
      onSelect: vi.fn(),
      onRetry: vi.fn(),
      onCancel: vi.fn(),
      onRemove: vi.fn(),
    };
    const screen = await render(
      <>
        <FileUpload items={[item]} {...sharedProps} />
        <button type="button">Outside control</button>
      </>,
    );

    await screen.getByRole('button', { name: 'Remove report.pdf' }).click();
    await screen.getByRole('button', { name: 'Outside control' }).click();
    expect(screen.getByRole('button', { name: 'Outside control' })).toHaveFocus();

    await screen.rerender(
      <>
        <FileUpload items={[]} {...sharedProps} />
        <button type="button">Outside control</button>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Outside control' })).toHaveFocus();
    expect(screen.getByLabelText('Drag files here or click to select')).not.toHaveFocus();
  });

  it(FILE_UPLOAD_SCENARIOS.single, async () => {
    const onSelect = vi.fn();
    const screen = await render(
      <FileUpload
        multiple={false}
        messages={{ selectionUnavailable: 'Substituição indisponível durante o envio.' }}
        items={[
          {
            id: 'active',
            name: 'active.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'uploading',
            attemptId: 'active-1',
            progress: { kind: 'indeterminate' },
          },
        ]}
        onSelect={onSelect}
        onRetry={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const input = screen.getByLabelText('Drag files here or click to select');
    const inputElement = input.element() as HTMLInputElement;
    const files = new DataTransfer();
    files.items.add(new File(['new'], 'new.pdf', { type: 'application/pdf' }));

    expect(input).toBeEnabled();
    expect(screen.container.querySelector('.lyra-upload__zone')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    Object.defineProperty(inputElement, 'files', { configurable: true, value: files.files });
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.waitFor(() =>
      expect(screen.container.querySelector('.lyra-upload__live')).toHaveTextContent(
        'Substituição indisponível durante o envio.',
      ),
    );
    expect(onSelect).not.toHaveBeenCalled();

    const drop = new DragEvent('drop', { bubbles: true, cancelable: true });
    expect(screen.container.querySelector('.lyra-upload__zone')!.dispatchEvent(drop)).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('DF-FU-07 lets the inherited root click prevent active-selection feedback first', async () => {
    let clickCurrentTarget: EventTarget | null = null;
    const onClick = vi.fn((event: React.MouseEvent<HTMLDivElement>) => {
      clickCurrentTarget = event.currentTarget;
      event.preventDefault();
    });
    const screen = await render(
      <FileUpload
        multiple={false}
        items={[
          {
            id: 'active',
            name: 'active.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'uploading',
            attemptId: 'active-1',
            progress: { kind: 'indeterminate' },
          },
        ]}
        onClick={onClick}
        onSelect={vi.fn()}
        onRetry={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const root = screen.container.querySelector('.lyra-upload');
    const input = screen.getByLabelText('Drag files here or click to select').element();

    input.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(clickCurrentTarget).toBe(root);
    expect(screen.container.querySelector('.lyra-upload__live')).toBeEmptyDOMElement();
  });

  it('DF-FU-07 lets the inherited root drop prevent active-selection feedback first', async () => {
    let dropCurrentTarget: EventTarget | null = null;
    const onDrop = vi.fn((event: React.DragEvent<HTMLDivElement>) => {
      dropCurrentTarget = event.currentTarget;
      event.preventDefault();
    });
    const screen = await render(
      <FileUpload
        multiple={false}
        items={[
          {
            id: 'active',
            name: 'active.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'uploading',
            attemptId: 'active-1',
            progress: { kind: 'indeterminate' },
          },
        ]}
        onDrop={onDrop}
        onSelect={vi.fn()}
        onRetry={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const root = screen.container.querySelector('.lyra-upload');
    const zone = screen.container.querySelector('.lyra-upload__zone');

    zone!.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true }));

    expect(onDrop).toHaveBeenCalledOnce();
    expect(dropCurrentTarget).toBe(root);
    expect(screen.container.querySelector('.lyra-upload__live')).toBeEmptyDOMElement();
  });

  it(FILE_UPLOAD_SCENARIOS.idempotence, async () => {
    const onRetry = vi.fn();
    const onCancel = vi.fn();
    const onRemove = vi.fn();
    const screen = await render(
      <FileUpload
        items={[
          {
            id: 'failed',
            name: 'failed.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'error',
            attemptId: 'failed-1',
            error: { kind: 'transport', message: 'Offline', retryable: true },
          },
          {
            id: 'active',
            name: 'active.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'uploading',
            attemptId: 'active-1',
            progress: { kind: 'determinate', value: 10 },
          },
          {
            id: 'done',
            name: 'done.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'success',
            attemptId: 'done-1',
          },
        ]}
        onSelect={vi.fn()}
        onRetry={onRetry}
        onCancel={onCancel}
        onRemove={onRemove}
      />,
    );

    const retry = screen.getByRole('button', { name: 'Retry failed.pdf' });
    const cancel = screen.getByRole('button', { name: 'Cancel active.pdf' });
    const remove = screen.getByRole('button', { name: 'Remove done.pdf' });
    await retry.click();
    (retry.element() as HTMLButtonElement).click();
    await cancel.click();
    (cancel.element() as HTMLButtonElement).click();
    await remove.click();
    (remove.element() as HTMLButtonElement).click();

    expect(onRetry).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledOnce();
    expect(retry).toBeDisabled();
    expect(cancel).toBeDisabled();
    expect(remove).toBeDisabled();
  });

  it('DF-FU-08 keeps adversarial intent identities independently lockable', async () => {
    const onRetry = vi.fn();
    const failed = (id: string, attemptId: string, name: string) =>
      ({
        id,
        name,
        size: 1,
        type: 'application/pdf',
        status: 'error',
        attemptId,
        error: { kind: 'transport', message: 'Offline', retryable: true },
      }) as const satisfies FileUploadItem;
    const screen = await render(
      <FileUpload
        items={[failed('a:error', 'x', 'first.pdf'), failed('a', 'error:x', 'second.pdf')]}
        onSelect={vi.fn()}
        onRetry={onRetry}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    await screen.getByRole('button', { name: 'Retry first.pdf' }).click();

    expect(screen.getByRole('button', { name: 'Retry first.pdf' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Retry second.pdf' })).toBeEnabled();
    await screen.getByRole('button', { name: 'Retry second.pdf' }).click();
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it(FILE_UPLOAD_SCENARIOS.announcements, async () => {
    const selected = {
      id: 'report',
      name: 'report.pdf',
      size: 1,
      type: 'application/pdf',
      status: 'selected',
    } as const satisfies FileUploadItem;
    const messages = {
      selected: (name: string) => `${name} selecionado.`,
      progress: (name: string, percent: number) => `${name}: envio em ${percent}%.`,
      success: (name: string) => `${name} enviado.`,
      removed: (name: string) => `${name} removido.`,
    };
    const sharedProps = {
      messages,
      onSelect: vi.fn(),
      onRetry: vi.fn(),
      onCancel: vi.fn(),
      onRemove: vi.fn(),
    };
    const screen = await render(<FileUpload items={[selected]} {...sharedProps} />);
    const live = () => screen.container.querySelector('.lyra-upload__live');

    await vi.waitFor(() => expect(live()).toHaveTextContent('report.pdf selecionado.'));

    const uploading = (value: number) =>
      [
        {
          ...selected,
          status: 'uploading',
          attemptId: 'attempt-1',
          progress: { kind: 'determinate', value },
        },
      ] as const satisfies readonly FileUploadItem[];

    await screen.rerender(<FileUpload items={uploading(24)} {...sharedProps} />);
    expect(live()).toHaveTextContent('report.pdf selecionado.');
    await screen.rerender(<FileUpload items={uploading(25)} {...sharedProps} />);
    await vi.waitFor(() => expect(live()).toHaveTextContent('report.pdf: envio em 25%.'));
    await screen.rerender(<FileUpload items={uploading(49)} {...sharedProps} />);
    expect(live()).toHaveTextContent('report.pdf: envio em 25%.');
    await screen.rerender(<FileUpload items={uploading(50)} {...sharedProps} />);
    await vi.waitFor(() => expect(live()).toHaveTextContent('report.pdf: envio em 50%.'));
    await screen.rerender(<FileUpload items={uploading(75)} {...sharedProps} />);
    await vi.waitFor(() => expect(live()).toHaveTextContent('report.pdf: envio em 75%.'));
    await screen.rerender(<FileUpload items={uploading(100)} {...sharedProps} />);
    await vi.waitFor(() => expect(live()).toHaveTextContent('report.pdf: envio em 100%.'));
    expect(live()).not.toHaveTextContent('report.pdf enviado.');

    await screen.rerender(
      <FileUpload
        items={[{ ...selected, status: 'success', attemptId: 'attempt-1' }]}
        {...sharedProps}
      />,
    );
    await vi.waitFor(() => expect(live()).toHaveTextContent('report.pdf enviado.'));
    await screen.rerender(<FileUpload items={[]} {...sharedProps} />);
    await vi.waitFor(() => expect(live()).toHaveTextContent('report.pdf removido.'));
  });

  it('DF-FU-12 includes every deterministic announcement candidate from one commit', async () => {
    const selected = (id: string) =>
      ({
        id,
        name: `${id}.pdf`,
        size: 1,
        type: 'application/pdf',
        status: 'selected',
      }) as const satisfies FileUploadItem;
    const first = selected('first');
    const second = selected('second');
    const sharedProps = {
      onSelect: vi.fn(),
      onRetry: vi.fn(),
      onCancel: vi.fn(),
      onRemove: vi.fn(),
    };
    const screen = await render(<FileUpload items={[first, second]} {...sharedProps} />);
    const live = () => screen.container.querySelector('.lyra-upload__live');

    await vi.waitFor(() =>
      expect(live()).toHaveTextContent('first.pdf selected. second.pdf selected.'),
    );

    const uploading = (item: typeof first) =>
      ({
        ...item,
        status: 'uploading',
        attemptId: `${item.id}-attempt`,
        progress: { kind: 'determinate', value: 25 },
      }) as const satisfies FileUploadItem;
    await screen.rerender(
      <FileUpload items={[uploading(first), uploading(second)]} {...sharedProps} />,
    );
    await vi.waitFor(() =>
      expect(live()).toHaveTextContent('first.pdf is 25% uploaded. second.pdf is 25% uploaded.'),
    );

    const failed = (item: typeof first) =>
      ({
        ...item,
        status: 'error',
        attemptId: `${item.id}-attempt`,
        error: { kind: 'transport', message: `${item.id} offline`, retryable: true },
      }) as const satisfies FileUploadItem;
    await screen.rerender(<FileUpload items={[failed(first), failed(second)]} {...sharedProps} />);
    await vi.waitFor(() =>
      expect(live()).toHaveTextContent('first.pdf: first offline second.pdf: second offline'),
    );

    await screen.rerender(
      <FileUpload
        items={[
          {
            ...first,
            status: 'success',
            attemptId: 'first-attempt',
          },
        ]}
        {...sharedProps}
      />,
    );
    await vi.waitFor(() =>
      expect(live()).toHaveTextContent('first.pdf uploaded. second.pdf removed.'),
    );
  });

  it('DF-FU-12 does not suppress an adversarial announcement identity collision', async () => {
    const failed = (id: string, attemptId: string, name: string) =>
      ({
        id,
        name,
        size: 1,
        type: 'application/pdf',
        status: 'error',
        attemptId,
        error: { kind: 'transport', message: 'Offline', retryable: true },
      }) as const satisfies FileUploadItem;
    const first = failed('a:x', 'y', 'first.pdf');
    const second = failed('a', 'x:y', 'second.pdf');
    const sharedProps = {
      onSelect: vi.fn(),
      onRetry: vi.fn(),
      onCancel: vi.fn(),
      onRemove: vi.fn(),
    };
    const screen = await render(<FileUpload items={[first]} {...sharedProps} />);
    const live = () => screen.container.querySelector('.lyra-upload__live');
    await vi.waitFor(() => expect(live()).toHaveTextContent('first.pdf: Offline'));

    await screen.rerender(<FileUpload items={[first, second]} {...sharedProps} />);

    await vi.waitFor(() => expect(live()).toHaveTextContent('second.pdf: Offline'));
  });

  it('DF-FU-12 releases announcement records after an item is removed', async () => {
    const selected = {
      id: 'report',
      name: 'report.pdf',
      size: 1,
      type: 'application/pdf',
      status: 'selected',
    } as const satisfies FileUploadItem;
    const sharedProps = {
      onSelect: vi.fn(),
      onRetry: vi.fn(),
      onCancel: vi.fn(),
      onRemove: vi.fn(),
    };
    const screen = await render(<FileUpload items={[selected]} {...sharedProps} />);
    const live = () => screen.container.querySelector('.lyra-upload__live');
    await vi.waitFor(() => expect(live()).toHaveTextContent('report.pdf selected.'));

    await screen.rerender(<FileUpload items={[]} {...sharedProps} />);
    await vi.waitFor(() => expect(live()).toHaveTextContent('report.pdf removed.'));

    await screen.rerender(<FileUpload items={[selected]} {...sharedProps} />);

    await vi.waitFor(() => expect(live()).toHaveTextContent('report.pdf selected.'));
  });

  it('DF-FU-12 announces localized validation, transport, and canceled states once', async () => {
    const validationItem = {
      id: 'report',
      name: 'report.txt',
      size: 1,
      type: 'text/plain',
      status: 'error',
      error: { kind: 'validation', code: 'accept', message: 'Formato inválido', retryable: false },
    } as const satisfies FileUploadItem;
    const messages = {
      error: (name: string, message: string) => `Falha em ${name}: ${message}.`,
      canceled: (name: string) => `${name} cancelado.`,
    };
    const sharedProps = {
      messages,
      onSelect: vi.fn(),
      onRetry: vi.fn(),
      onCancel: vi.fn(),
      onRemove: vi.fn(),
    };
    const screen = await render(<FileUpload items={[validationItem]} {...sharedProps} />);
    const live = () => screen.container.querySelector('.lyra-upload__live');

    await vi.waitFor(() =>
      expect(live()).toHaveTextContent('Falha em report.txt: Formato inválido.'),
    );
    await screen.rerender(
      <FileUpload
        items={[
          {
            ...validationItem,
            error: { ...validationItem.error, message: 'Outra mensagem' },
          },
        ]}
        {...sharedProps}
      />,
    );
    expect(live()).toHaveTextContent('Falha em report.txt: Formato inválido.');

    await screen.rerender(
      <FileUpload
        items={[
          {
            ...validationItem,
            status: 'error',
            attemptId: 'attempt-1',
            error: { kind: 'transport', message: 'Sem rede', retryable: true },
          },
        ]}
        {...sharedProps}
      />,
    );
    await vi.waitFor(() => expect(live()).toHaveTextContent('Falha em report.txt: Sem rede.'));

    await screen.rerender(
      <FileUpload
        items={[
          {
            ...validationItem,
            status: 'canceled',
            attemptId: 'attempt-1',
          },
        ]}
        {...sharedProps}
      />,
    );
    await vi.waitFor(() => expect(live()).toHaveTextContent('report.txt cancelado.'));
  });

  it(FILE_UPLOAD_SCENARIOS.progress, async () => {
    const screen = await render(
      <FileUpload
        items={[
          {
            id: 'a',
            name: 'a.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'uploading',
            attemptId: 'a-1',
            progress: { kind: 'determinate', value: 48 },
          },
          {
            id: 'b',
            name: 'b.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'canceling',
            attemptId: 'b-1',
            progress: { kind: 'indeterminate' },
          },
        ]}
        onSelect={vi.fn()}
        onRetry={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    const progress = screen.container.querySelectorAll('progress.lyra-upload__bar');
    expect(progress[0]).toHaveAttribute('value', '48');
    expect(progress[1]).not.toHaveAttribute('value');
    expect(screen.container.querySelector('[data-state="uploading"]')).not.toBeNull();
    expect(screen.container.querySelector('[data-state="canceling"]')).not.toBeNull();
    await expectNoAxeViolations(screen.container);
  });

  it('names controlled progress when the consumer item ID contains whitespace', async () => {
    const screen = await render(
      <FileUpload
        items={[
          {
            id: 'upload 1',
            name: 'upload.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'uploading',
            attemptId: 'upload-1',
            progress: { kind: 'determinate', value: 48 },
          },
        ]}
        onSelect={vi.fn()}
        onRetry={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    await expect(
      screen.getByRole('progressbar', { name: 'upload.pdf is 48% uploaded.' }),
    ).toBeVisible();
  });

  it('keeps controlled content readable while disabled and required', async () => {
    const screen = await render(
      <FileUpload
        disabled
        required
        items={[
          {
            id: 'selected',
            name: 'selected.pdf',
            size: 1,
            type: 'application/pdf',
            status: 'selected',
          },
        ]}
        onSelect={vi.fn()}
        onRetry={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.container.querySelector('.lyra-upload')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByLabelText('Drag files here or click to select')).toBeDisabled();
    expect(screen.getByLabelText('Drag files here or click to select')).toBeRequired();
    expect(screen.container.querySelector('.lyra-upload__item-name')).toHaveTextContent(
      'selected.pdf',
    );
    expect(screen.getByRole('button', { name: 'Remove selected.pdf' })).toBeDisabled();
  });

  it('runs the inherited change handler before checking whether selection was prevented', async () => {
    const onSelect = vi.fn();
    const onChange = vi.fn((event: ChangeEvent<HTMLDivElement>) => event.preventDefault());
    const screen = await render(
      <FileUpload
        items={[]}
        onChange={onChange}
        onSelect={onSelect}
        onRetry={vi.fn()}
        onCancel={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const input = screen
      .getByLabelText('Drag files here or click to select')
      .element() as HTMLInputElement;
    const files = new DataTransfer();
    files.items.add(new File(['pdf'], 'report.pdf', { type: 'application/pdf' }));
    Object.defineProperty(input, 'files', { configurable: true, value: files.files });

    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledOnce());
    expect(onSelect).not.toHaveBeenCalled();
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
