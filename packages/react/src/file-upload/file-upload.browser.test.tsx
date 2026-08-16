import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import '@lyra-ds/styles/styles.css';
import { FILE_UPLOAD_SCENARIOS } from '../../../../tools/file-upload/scenarios';
import { FileUpload } from './index';

afterEach(async () => {
  await cleanup();
});

describe('FileUpload', () => {
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
