import { StrictMode, useEffect } from 'react';
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

    await expect.element(screen.getByText('Information saved')).toBeInTheDocument();
    await vi.waitFor(() => expect(document.querySelector('.lyra-toast')).toBeNull());
  });

  it('still renders pushed toasts under React StrictMode (effect double-invoke)', async () => {
    const screen = await render(
      <StrictMode>
        <ToastHarness duration={0} />
      </StrictMode>,
    );
    await userEvent.click(screen.container.querySelectorAll<HTMLButtonElement>('button')[1]!);

    await expect.element(screen.getByText('Changes saved')).toBeInTheDocument();
  });

  it('keeps the id from a child mount effect valid under StrictMode replay', async () => {
    const ids: number[] = [];
    function Child() {
      const { success, dismiss } = useToast();
      useEffect(() => {
        const id = success('Mounted toast', { duration: 0 });
        ids.push(id);
        return () => dismiss(id);
      }, [success, dismiss]);
      return null;
    }
    await render(
      <StrictMode>
        <ToastProvider>
          <Child />
        </ToastProvider>
      </StrictMode>,
    );

    // The replayed effect must add a toast rather than no-op against an "unmounted" provider.
    await vi.waitFor(() => expect(document.querySelectorAll('.lyra-toast')).toHaveLength(1));
    expect(ids.length).toBeGreaterThan(1);
  });

  it('still auto-dismisses a toast pushed from a child effect under StrictMode', async () => {
    function Child() {
      const { info } = useToast();
      useEffect(() => {
        info('Effect toast');
      }, [info]);
      return null;
    }
    await render(
      <StrictMode>
        <ToastProvider duration={300}>
          <Child />
        </ToastProvider>
      </StrictMode>,
    );

    await vi.waitFor(() => expect(document.querySelector('.lyra-toast')).not.toBeNull());
    await vi.waitFor(() => expect(document.querySelector('.lyra-toast')).toBeNull(), {
      timeout: 3000,
    });
  });

  it('lets a notification override the provider auto-dismiss duration', async () => {
    const screen = await render(<ToastHarness duration={0} />);
    await userEvent.click(screen.container.querySelectorAll<HTMLButtonElement>('button')[3]!);

    await expect.element(screen.getByText('Per-toast timeout')).toBeInTheDocument();
    await vi.waitFor(() => expect(document.querySelector('.lyra-toast')).toBeNull());
  });

  it('dismisses a toast from its translated close button', async () => {
    const screen = await render(<ToastHarness duration={0} closeLabel="Fechar notificação" />);
    await userEvent.click(screen.container.querySelectorAll<HTMLButtonElement>('button')[1]!);

    const close = screen.getByRole('button', { name: 'Fechar notificação' });
    await expect.element(close).toBeInTheDocument();
    await userEvent.click(close);
    await vi.waitFor(() => expect(document.querySelector('.lyra-toast')).toBeNull());
  });

  it('stacks info, success, and error notifications with their default tone icons', async () => {
    const { container } = await render(<ToastHarness duration={0} />);
    const buttons = container.querySelectorAll<HTMLButtonElement>('button');
    await userEvent.click(buttons[0]!);
    await userEvent.click(buttons[1]!);
    await userEvent.click(buttons[2]!);

    expect(document.querySelectorAll('.lyra-toast-stack .lyra-toast')).toHaveLength(3);
    expect(document.querySelector('.lyra-toast__icon--info svg')).not.toBeNull();
    expect(document.querySelector('.lyra-toast__icon--success svg')).not.toBeNull();
    expect(document.querySelector('.lyra-toast__icon--danger svg')).not.toBeNull();
  });

  it('uses a per-call tone and custom icon instead of the tone default', async () => {
    const screen = await render(<ToastHarness duration={0} />);
    await userEvent.click(screen.container.querySelectorAll<HTMLButtonElement>('button')[4]!);

    await expect.element(screen.getByText('Custom notification').last()).toBeInTheDocument();
    expect(
      document.querySelector('.lyra-toast__icon--danger [data-testid="custom-toast-icon"]'),
    ).not.toBeNull();
    expect(document.querySelector('.lyra-toast__icon--danger svg')).toBeNull();
  });

  it('mounts persistent live regions before any toast and announces text inside them', async () => {
    const { container } = await render(<ToastHarness duration={0} />);
    const polite = document.querySelector<HTMLElement>('[aria-live="polite"]')!;
    const assertive = document.querySelector<HTMLElement>('[aria-live="assertive"]')!;
    expect(polite).not.toBeNull();
    expect(assertive).not.toBeNull();
    expect(document.querySelectorAll('.lyra-toast')).toHaveLength(0);
    const buttons = container.querySelectorAll<HTMLButtonElement>('button');

    await userEvent.click(buttons[1]!);
    await expect.element(polite).toHaveTextContent('Changes saved');
    expect(document.querySelector('[aria-live="polite"]')).toBe(polite);

    await userEvent.click(buttons[2]!);
    await expect.element(assertive).toHaveTextContent('Save failed');
    expect(document.querySelector('[aria-live="assertive"]')).toBe(assertive);
    expect(polite).not.toHaveTextContent('Save failed');
    // toasts inside the regions carry no role of their own
    expect(document.querySelector('.lyra-toast[role]')).toBeNull();
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
