import { startTransition, StrictMode, useLayoutEffect, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { CreateWorkspaceDialog, type CreateWorkspaceRequest } from './index';

afterEach(async () => {
  await cleanup();
  document.documentElement.removeAttribute('data-theme');
});

describe('CreateWorkspaceDialog', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`composes its exact classes and is axe clean in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await render(<CreateWorkspaceDialog open onClose={() => {}} />);
        await vi.waitFor(() => expect(document.querySelector('.lyra-wscreate')).not.toBeNull());
        const root = document.querySelector<HTMLElement>('.lyra-wscreate')!;
        expect(root.className).toBe('lyra-wscreate');
        expect(root.querySelector('.lyra-wscreate__preview')!.className).toBe(
          'lyra-wscreate__preview',
        );
        expect(root.querySelector('.lyra-wscreate__preview-hint')!.className).toBe(
          'lyra-wscreate__preview-hint',
        );
        expect(root.querySelector('.lyra-wscreate__slug')!.className).toBe('lyra-wscreate__slug');
        expect(root.querySelector('.lyra-wscreate__slug-prefix')!.className).toBe(
          'lyra-wscreate__slug-prefix',
        );
        expect(root.querySelector('.lyra-wscreate__slug-input')!.className).toBe(
          'lyra-wscreate__slug-input',
        );
        await expectNoAxeViolations(document.body);
        expect(errorSpy).not.toHaveBeenCalled();
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('auto-generates a slug until manually edited, then submits the trimmed workspace', async () => {
    const onCreate = vi.fn((request: CreateWorkspaceRequest) => ({
      operationId: request.operationId,
      status: 'accepted' as const,
    }));
    let phaseAtClose = '';
    const onClose = vi.fn(() => {
      phaseAtClose = document.querySelector<HTMLFormElement>('.lyra-wscreate')!.dataset.state!;
    });
    await render(<CreateWorkspaceDialog open onCreate={onCreate} onClose={onClose} />);
    await vi.waitFor(() => expect(document.querySelector('.lyra-wscreate')).not.toBeNull());
    const name = document.querySelector<HTMLInputElement>('.lyra-input')!;
    const slug = document.querySelector<HTMLInputElement>('.lyra-wscreate__slug-input')!;
    const slugLabel = document.querySelectorAll<HTMLLabelElement>('.lyra-wscreate .lyra-label')[1]!;
    expect(slugLabel.htmlFor).toBe(slug.id);
    await userEvent.fill(name, '  Açme & Co  ');
    expect(slug.value).toBe('acme-co');
    await userEvent.fill(slug, 'custom URL');
    await userEvent.fill(name, 'Different Name');
    expect(slug.value).toBe('custom-url');
    const submit = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.lyra-dialog__footer button'),
    ).find((button) => button.textContent?.includes('Create workspace'))!;
    await userEvent.click(submit);
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        operationId: expect.any(String),
        data: { name: 'Different Name', slug: 'custom-url' },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(phaseAtClose).toBe('accepted');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('names its form and keeps invalid values open with the first invalid field focused', async () => {
    const onCreate = vi.fn();
    await render(<CreateWorkspaceDialog open onCreate={onCreate} onClose={() => {}} />);
    const form = document.querySelector<HTMLFormElement>('form[aria-label="Create workspace"]')!;
    const name = document.querySelector<HTMLInputElement>('.lyra-input')!;
    const slug = document.querySelector<HTMLInputElement>('.lyra-wscreate__slug-input')!;
    const submit = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.lyra-dialog__footer button'),
    ).find((button) => button.textContent?.includes('Create workspace'))!;

    expect(form).not.toBeNull();
    await userEvent.click(submit);
    expect(onCreate).not.toHaveBeenCalled();
    expect(form.dataset.state).toBe('error');
    expect(document.activeElement).toBe(name);

    await userEvent.fill(name, 'Acme');
    await userEvent.fill(slug, '');
    await userEvent.click(submit);
    expect(onCreate).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(slug);
  });

  it('commits submitting before notifying, keeps focus in the dialog, and cancels once by Escape', async () => {
    let resolve: (result: { operationId: string; status: 'canceled' }) => void = () => {};
    let request: CreateWorkspaceRequest | undefined;
    let phaseAtNotification = '';
    const onClose = vi.fn();
    const onCreate = vi.fn((nextRequest: CreateWorkspaceRequest) => {
      request = nextRequest;
      phaseAtNotification =
        document.querySelector<HTMLFormElement>('.lyra-wscreate')!.dataset.state!;
      return new Promise<{ operationId: string; status: 'canceled' }>((nextResolve) => {
        resolve = nextResolve;
      });
    });
    await render(<CreateWorkspaceDialog open onCreate={onCreate} onClose={onClose} />);
    const name = document.querySelector<HTMLInputElement>('.lyra-input')!;
    const submit = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.lyra-dialog__footer button'),
    ).find((button) => button.textContent?.includes('Create workspace'))!;
    await userEvent.fill(name, 'Acme');
    await userEvent.click(submit);

    const form = document.querySelector<HTMLFormElement>('form[aria-label="Create workspace"]')!;
    expect(onCreate).toHaveBeenCalledOnce();
    expect(phaseAtNotification).toBe('submitting');
    expect(form.dataset.state).toBe('submitting');
    expect(form.getAttribute('aria-busy')).toBe('true');
    expect(request).toEqual(
      expect.objectContaining({
        data: { name: 'Acme', slug: 'acme' },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(document.activeElement).toBe(name);
    expect(name.readOnly).toBe(true);
    expect(submit.disabled).toBe(true);
    form.requestSubmit();
    expect(onCreate).toHaveBeenCalledOnce();

    await userEvent.keyboard('{Escape}');
    expect(request!.signal.aborted).toBe(true);
    expect(request!.signal.reason).toEqual({ operationId: request!.operationId });
    expect(form.dataset.state).toBe('canceling');
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();

    resolve({ operationId: request!.operationId, status: 'canceled' });
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it('focuses a rejected result and allows a fresh exact retry', async () => {
    const onClose = vi.fn();
    let attempts = 0;
    const onCreate = vi.fn((request: CreateWorkspaceRequest) => {
      attempts += 1;
      return attempts === 1
        ? {
            operationId: request.operationId,
            status: 'rejected' as const,
            error: 'Name is already taken.',
          }
        : { operationId: request.operationId, status: 'accepted' as const };
    });
    await render(<CreateWorkspaceDialog open onCreate={onCreate} onClose={onClose} />);
    const name = document.querySelector<HTMLInputElement>('.lyra-input')!;
    const submit = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.lyra-dialog__footer button'),
    ).find((button) => button.textContent?.includes('Create workspace'))!;
    await userEvent.fill(name, 'Acme');
    await userEvent.click(submit);

    const summary = document.querySelector<HTMLElement>('[role="alert"]')!;
    expect(summary.textContent).toContain('Name is already taken.');
    expect(document.activeElement).toBe(summary);
    await userEvent.click(submit);
    expect(onCreate).toHaveBeenCalledTimes(2);
    expect(onCreate.mock.calls[1]![0].operationId).not.toBe(onCreate.mock.calls[0]![0].operationId);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('maps a thrown creation error to a focused retryable error without closing', async () => {
    const onClose = vi.fn();
    const onCreate = vi.fn(() => {
      throw new Error('consumer failure');
    });
    await render(<CreateWorkspaceDialog open onCreate={onCreate} onClose={onClose} />);
    const name = document.querySelector<HTMLInputElement>('.lyra-input')!;
    const submit = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.lyra-dialog__footer button'),
    ).find((button) => button.textContent?.includes('Create workspace'))!;
    await userEvent.fill(name, 'Acme');
    await userEvent.click(submit);

    const summary = document.querySelector<HTMLElement>('[role="alert"]')!;
    expect(summary.textContent).toContain('Please try again.');
    expect(document.activeElement).toBe(summary);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores a mismatched terminal acknowledgement without requesting close', async () => {
    const onClose = vi.fn();
    const onCreate = vi.fn((request: CreateWorkspaceRequest) => ({
      operationId: `${request.operationId}-stale`,
      status: 'accepted' as const,
    }));
    await render(<CreateWorkspaceDialog open onCreate={onCreate} onClose={onClose} />);
    const name = document.querySelector<HTMLInputElement>('.lyra-input')!;
    const submit = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.lyra-dialog__footer button'),
    ).find((button) => button.textContent?.includes('Create workspace'))!;
    await userEvent.fill(name, 'Acme');
    await userEvent.click(submit);

    expect(
      document.querySelector<HTMLFormElement>('form[aria-label="Create workspace"]')!.dataset.state,
    ).toBe('submitting');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('accepts a native Promise created in a same-origin iframe', async () => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const onClose = vi.fn();
    const onCreate = vi.fn((request: CreateWorkspaceRequest) =>
      frame.contentWindow!.window.Promise.resolve({
        operationId: request.operationId,
        status: 'accepted' as const,
      }),
    );
    try {
      await render(<CreateWorkspaceDialog open onCreate={onCreate} onClose={onClose} />);
      const name = document.querySelector<HTMLInputElement>('.lyra-input')!;
      const submit = Array.from(
        document.querySelectorAll<HTMLButtonElement>('.lyra-dialog__footer button'),
      ).find((button) => button.textContent?.includes('Create workspace'))!;
      await userEvent.fill(name, 'Acme');
      await userEvent.click(submit);
      await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    } finally {
      frame.remove();
    }
  });

  it('invalidates a held operation before a parent layout effect can settle a forced close', async () => {
    let request: CreateWorkspaceRequest | undefined;
    let resolve: ((result: { operationId: string; status: 'accepted' }) => void) | undefined;
    let forceClose: (() => void) | undefined;
    let closeCommitted = false;
    const onClose = vi.fn();

    function CommitBoundaryHarness() {
      const [open, setOpen] = useState(true);
      useLayoutEffect(() => {
        forceClose = () => startTransition(() => setOpen(false));
        return () => {
          forceClose = undefined;
        };
      }, []);
      useLayoutEffect(() => {
        if (!open && request && resolve) {
          closeCommitted = true;
          resolve({ operationId: request.operationId, status: 'accepted' });
        }
      }, [open]);
      return (
        <CreateWorkspaceDialog
          open={open}
          onClose={onClose}
          onCreate={(nextRequest) => {
            request = nextRequest;
            return new Promise<{ operationId: string; status: 'accepted' }>((nextResolve) => {
              resolve = nextResolve;
            });
          }}
        />
      );
    }

    await render(<CommitBoundaryHarness />);
    const name = document.querySelector<HTMLInputElement>('.lyra-input')!;
    const submit = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.lyra-dialog__footer button'),
    ).find((button) => button.textContent?.includes('Create workspace'))!;
    await userEvent.fill(name, 'Acme');
    await userEvent.click(submit);
    forceClose!();
    await vi.waitFor(() => expect(closeCommitted).toBe(true));

    expect(request!.signal.aborted).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('aborts a held operation once when StrictMode unmounts', async () => {
    let request: CreateWorkspaceRequest | undefined;
    const onCreate = vi.fn((nextRequest: CreateWorkspaceRequest) => {
      request = nextRequest;
      return new Promise<never>(() => {});
    });
    const { unmount } = await render(
      <StrictMode>
        <CreateWorkspaceDialog open onClose={() => {}} onCreate={onCreate} />
      </StrictMode>,
    );
    const name = document.querySelector<HTMLInputElement>('.lyra-input')!;
    const submit = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.lyra-dialog__footer button'),
    ).find((button) => button.textContent?.includes('Create workspace'))!;
    await userEvent.fill(name, 'Acme');
    await userEvent.click(submit);
    await unmount();
    expect(onCreate).toHaveBeenCalledOnce();
    expect(request!.signal.aborted).toBe(true);
  });
});
