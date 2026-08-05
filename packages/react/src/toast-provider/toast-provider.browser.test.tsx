import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { ToastProvider, useToast } from './index';

function Controls() {
  const { error, info, success, toast } = useToast();

  return (
    <>
      <button type="button" onClick={() => info('Information saved')}>
        Info
      </button>
      <button type="button" onClick={() => success('Changes saved')}>
        Success
      </button>
      <button type="button" onClick={() => error('Save failed')}>
        Error
      </button>
      <button type="button" onClick={() => toast('Per-toast timeout', { duration: 300 })}>
        Per-toast timeout
      </button>
      <button
        type="button"
        onClick={() =>
          toast('Custom notification', {
            tone: 'danger',
            icon: <span data-testid="custom-toast-icon">!</span>,
          })
        }
      >
        Custom notification
      </button>
    </>
  );
}

function ToastHarness({ duration, closeLabel }: { duration?: number; closeLabel?: string }) {
  return (
    <ToastProvider duration={duration} closeLabel={closeLabel}>
      <Controls />
    </ToastProvider>
  );
}

function setTheme(theme: 'light' | 'dark'): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('ToastProvider', () => {
  it('auto-dismisses a queued toast after its configured duration', async () => {
    // 20ms raced the presence assertion (the toast could dismiss before the
    // locator's first poll saw it) — 300ms is still fast and race-free.
    const screen = await render(<ToastHarness duration={300} />);
    await userEvent.click(screen.container.querySelector<HTMLButtonElement>('button')!);

    await expect.element(screen.getByRole('status')).toHaveTextContent('Information saved');
    await vi.waitFor(() => expect(document.querySelector('[role="status"]')).toBeNull());
  });

  it('lets a notification override the provider auto-dismiss duration', async () => {
    const screen = await render(<ToastHarness duration={0} />);
    await userEvent.click(screen.container.querySelectorAll<HTMLButtonElement>('button')[3]!);

    await expect.element(screen.getByRole('status')).toHaveTextContent('Per-toast timeout');
    await vi.waitFor(() => expect(document.querySelector('[role="status"]')).toBeNull());
  });

  it('dismisses a toast from its translated close button', async () => {
    const screen = await render(<ToastHarness duration={0} closeLabel="Fechar notificação" />);
    await userEvent.click(screen.container.querySelectorAll<HTMLButtonElement>('button')[1]!);

    const close = screen.getByRole('button', { name: 'Fechar notificação' });
    await expect.element(close).toBeInTheDocument();
    await userEvent.click(close);
    await vi.waitFor(() => expect(document.querySelector('[role="status"]')).toBeNull());
  });

  it('stacks info, success, and error notifications with their default tone icons', async () => {
    const { container } = await render(<ToastHarness duration={0} />);
    const buttons = container.querySelectorAll<HTMLButtonElement>('button');
    await userEvent.click(buttons[0]!);
    await userEvent.click(buttons[1]!);
    await userEvent.click(buttons[2]!);

    expect(document.querySelectorAll('.lyra-toast-stack [role="status"]')).toHaveLength(3);
    expect(document.querySelector('.lyra-toast__icon--info svg')).not.toBeNull();
    expect(document.querySelector('.lyra-toast__icon--success svg')).not.toBeNull();
    expect(document.querySelector('.lyra-toast__icon--danger svg')).not.toBeNull();
  });

  it('uses a per-call tone and custom icon instead of the tone default', async () => {
    const screen = await render(<ToastHarness duration={0} />);
    await userEvent.click(screen.container.querySelectorAll<HTMLButtonElement>('button')[4]!);

    await expect.element(screen.getByRole('status')).toHaveTextContent('Custom notification');
    expect(
      document.querySelector('.lyra-toast__icon--danger [data-testid="custom-toast-icon"]'),
    ).not.toBeNull();
    expect(document.querySelector('.lyra-toast__icon--danger svg')).toBeNull();
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const { container } = await render(<ToastHarness duration={0} />);
      await userEvent.click(container.querySelector<HTMLButtonElement>('button')!);

      await expectNoAxeViolations(document.body);
    });
  }

  it('clears a pending timeout when the provider unmounts', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const view = await render(<ToastHarness duration={20} />);
      await userEvent.click(view.container.querySelector<HTMLButtonElement>('button')!);
      await view.unmount();
      await new Promise((resolve) => setTimeout(resolve, 40));
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});
