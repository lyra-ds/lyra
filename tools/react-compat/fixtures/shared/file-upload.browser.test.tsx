import { act } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FileUploadCancelIntent } from '@lyra-ds/react/file-upload';
import { CompatibilityUpload } from './entry';

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
const previousReactActEnvironment = reactActEnvironment.IS_REACT_ACT_ENVIRONMENT;
let container: HTMLDivElement;
let root: Root | null;

beforeEach(() => {
  reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.append(container);
  root = null;
});

afterEach(async () => {
  if (root !== null) await act(async () => root?.unmount());
  container.remove();
  reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = previousReactActEnvironment;
});

describe('packed FileUpload browser compatibility', () => {
  it('hydrates controlled progress without recoverable or console warnings', async () => {
    const recoverableErrors: unknown[] = [];
    const consoleErrors: unknown[][] = [];
    const consoleWarnings: unknown[][] = [];
    const previousConsoleError = console.error;
    const previousConsoleWarn = console.warn;
    console.error = (...arguments_) => consoleErrors.push(arguments_);
    console.warn = (...arguments_) => consoleWarnings.push(arguments_);

    try {
      container.innerHTML = renderToString(<CompatibilityUpload />);
      await act(async () => {
        root = hydrateRoot(container, <CompatibilityUpload />, {
          onRecoverableError: (error) => recoverableErrors.push(error),
        });
      });

      expect(container.querySelector('progress')?.value).toBe(48);
      expect(recoverableErrors).toEqual([]);
      expect(consoleErrors).toEqual([]);
      expect(consoleWarnings).toEqual([]);
    } finally {
      console.error = previousConsoleError;
      console.warn = previousConsoleWarn;
    }
  });

  it('emits a cancel intent from the controlled packed component', async () => {
    const cancelIntents: FileUploadCancelIntent[] = [];
    await act(async () => {
      root = createRoot(container);
      root.render(<CompatibilityUpload onCancelIntent={(intent) => cancelIntents.push(intent)} />);
    });

    const cancel = container.querySelector<HTMLButtonElement>('.lyra-upload__cancel');
    expect(cancel).not.toBeNull();
    await act(async () => cancel?.click());

    expect(cancelIntents).toEqual([
      { id: 'compatibility-upload', attemptId: 'compatibility-attempt-1' },
    ]);
    expect(container.querySelector('.lyra-upload__cancel')).toBeNull();
  });
});
