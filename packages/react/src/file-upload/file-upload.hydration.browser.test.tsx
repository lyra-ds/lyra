import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FILE_UPLOAD_SCENARIOS } from '../../../../tools/file-upload/scenarios';
import { FileUpload } from './index';
import type { FileUploadItem } from './file-upload.types';

let hydratedRoot: Root | null = null;
let hydrationContainer: HTMLDivElement | null = null;
const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
const previousReactActEnvironment = reactActEnvironment.IS_REACT_ACT_ENVIRONMENT;

beforeEach(() => {
  reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
});

async function runInReactAct(callback: () => void | Promise<void>): Promise<void> {
  const reactAct = (React as unknown as { act?: typeof import('react-dom/test-utils').act }).act;
  if (reactAct !== undefined) {
    await reactAct(callback);
    return;
  }

  const { act: legacyAct } = await import('react-dom/test-utils');
  await legacyAct(callback);
}

afterEach(async () => {
  if (hydratedRoot !== null) {
    await runInReactAct(async () => hydratedRoot?.unmount());
    hydratedRoot = null;
  }
  hydrationContainer?.remove();
  hydrationContainer = null;
  reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = previousReactActEnvironment;
  vi.restoreAllMocks();
});

describe('FileUpload hydration', () => {
  it(FILE_UPLOAD_SCENARIOS.hydration, async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onRecoverableError = vi.fn();
    const uploading = {
      id: 'controlled-upload',
      name: 'controlled.pdf',
      size: 1,
      type: 'application/pdf',
      status: 'uploading',
      attemptId: 'controlled-attempt-1',
      progress: { kind: 'determinate', value: 48 },
    } as const satisfies FileUploadItem;
    const onSelect = vi.fn();
    const onRetry = vi.fn();
    const onCancel = vi.fn();
    const onRemove = vi.fn();
    const renderUpload = (item: FileUploadItem) => (
      <React.StrictMode>
        <FileUpload
          name="attachments"
          items={[item]}
          onSelect={onSelect}
          onRetry={onRetry}
          onCancel={onCancel}
          onRemove={onRemove}
        />
      </React.StrictMode>
    );
    const element = renderUpload(uploading);
    hydrationContainer = document.createElement('div');
    hydrationContainer.innerHTML = renderToString(element);
    document.body.append(hydrationContainer);

    const input = hydrationContainer.querySelector('input[type="file"]') as HTMLInputElement;
    const beforeIds = Array.from(hydrationContainer.querySelectorAll('[id]'), (node) => node.id);
    const preHydrationFile = new File(['preserved'], 'preserved.pdf', {
      type: 'application/pdf',
    });
    const transfer = new DataTransfer();
    transfer.items.add(preHydrationFile);
    input.files = transfer.files;
    await runInReactAct(async () => {
      hydratedRoot = hydrateRoot(hydrationContainer!, element, { onRecoverableError });
    });

    await runInReactAct(async () => {
      hydratedRoot?.render(renderUpload({ ...uploading }));
    });

    expect(hydrationContainer.querySelector('input[type="file"]')).toBe(input);
    expect(Array.from(hydrationContainer.querySelectorAll('[id]'), (node) => node.id)).toEqual(
      beforeIds,
    );
    expect(input.files).toHaveLength(1);
    expect(input.files?.[0]).toBe(preHydrationFile);
    expect(input).toHaveAttribute('name', 'attachments');
    expect(onSelect).not.toHaveBeenCalled();
    expect(onRetry).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
    expect(hydrationContainer.querySelector('.lyra-upload__live')).toBeEmptyDOMElement();
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();

    await runInReactAct(async () => {
      (hydrationContainer!.querySelector('.lyra-upload__cancel') as HTMLButtonElement).click();
    });

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSelect).not.toHaveBeenCalled();
    expect(onRetry).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();

    await runInReactAct(async () => {
      hydratedRoot?.unmount();
    });
    hydratedRoot = null;

    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
    expect(onRecoverableError).not.toHaveBeenCalled();
  });
});
