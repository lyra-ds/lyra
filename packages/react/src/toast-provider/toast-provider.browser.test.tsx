import { StrictMode, useEffect, useLayoutEffect, useState, useRef, act as reactAct } from 'react';
import type { ToastApi } from './index';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

beforeEach(async () => {
  const pointerOrigin = document.createElement('div');
  pointerOrigin.textContent = 'Pointer origin';
  document.body.append(pointerOrigin);
  await userEvent.hover(pointerOrigin);
  pointerOrigin.remove();
});

afterEach(async () => {
  await cleanup();
  vi.useRealTimers();
  setTheme('light');
});

describe('ToastProvider', () => {
  it('auto-dismisses a queued toast after its configured duration', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const screen = await render(<ToastHarness duration={300} />);
    await userEvent.click(screen.container.querySelector<HTMLButtonElement>('button')!);

    await expect.element(screen.getByText('Information saved')).toBeInTheDocument();
    await advance(300);
    expect(document.querySelector('.lyra-toast')).toBeNull();
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
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
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
    await advance(300);
    expect(document.querySelector('.lyra-toast')).toBeNull();
  });

  it('lets a notification override the provider auto-dismiss duration', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const screen = await render(<ToastHarness duration={0} />);
    await userEvent.click(screen.container.querySelectorAll<HTMLButtonElement>('button')[3]!);

    await expect.element(screen.getByText('Per-toast timeout')).toBeInTheDocument();
    await advance(300);
    expect(document.querySelector('.lyra-toast')).toBeNull();
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

  it('names coexisting notification landmarks independently', async () => {
    const view = await render(
      <>
        <ToastProvider duration={0} aria-label="Project notifications">
          <Controls />
        </ToastProvider>
        <ToastProvider duration={0} aria-label="Account notifications">
          <Controls />
        </ToastProvider>
      </>,
    );
    const buttons = view.getByRole('button', { name: 'Success', exact: true });
    await userEvent.click(buttons.nth(0));
    await userEvent.click(buttons.nth(1));
    await expectNoAxeViolations(document.body);
    await expect
      .element(view.getByRole('region', { name: 'Project notifications' }))
      .toBeInTheDocument();
    await expect
      .element(view.getByRole('region', { name: 'Account notifications' }))
      .toBeInTheDocument();
  });

  it('clears a pending timeout when the provider unmounts', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const view = await render(<ToastHarness duration={20} />);
      await userEvent.click(view.container.querySelector<HTMLButtonElement>('button')!);
      await view.unmount();
      expect(vi.getTimerCount()).toBe(0);
      await advance(40);
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});

// Browser render only enables act for its own operations.
async function act(callback: () => void | Promise<void>): Promise<void> {
  const previous = Reflect.get(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
  try {
    await reactAct(callback);
  } finally {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', previous);
  }
}

async function advance(milliseconds: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

function Capture({
  receive,
  showOpener = true,
}: {
  receive: (api: ToastApi) => void;
  showOpener?: boolean;
}) {
  const api = useToast();
  useEffect(() => receive(api), [api, receive]);
  return showOpener ? <button type="button">Outside</button> : null;
}

async function timerHarness(duration?: number) {
  let api: ToastApi | undefined;
  const receive = (value: ToastApi) => {
    api = value;
  };
  const view = await render(
    <ToastProvider duration={duration}>
      <Capture receive={receive} />
    </ToastProvider>,
  );
  if (!api) throw new Error('Expected committed toast API');
  return { view, api, receive };
}

describe('Toast lifetime contract', () => {
  it.each([
    [undefined, undefined, 'info', 8000],
    [undefined, undefined, 'success', 8000],
    [undefined, undefined, 'danger', 0],
    [8000, undefined, 'danger', 8000],
    [0, 300, 'danger', 300],
    [300, 0, 'info', 0],
    [300, 8000, 'danger', 8000],
    [8000, 300, 'success', 300],
    [undefined, 300, 'danger', 300],
    [undefined, 0, 'info', 0],
    [300, undefined, 'danger', 300],
    [0, undefined, 'success', 0],
  ] as const)(
    'resolves global %s, override %s, tone %s to %s',
    async (global, duration, tone, expected) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
      const { api, view } = await timerHarness(global);
      await act(() => {
        api.toast('Boundary', { tone, duration });
      });
      await advance(expected ? expected - 1 : 100000);
      await expect.element(view.getByText('Boundary')).toBeInTheDocument();
      if (expected) {
        await advance(1);
        expect(view.container.querySelector('.lyra-toast')).toBeNull();
      } else expect(vi.getTimerCount()).toBe(0);
    },
  );

  it('keeps both implicit danger entry points persistent', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const { api, view } = await timerHarness();
    await act(() => {
      api.error('Error');
      api.toast('Danger', { tone: 'danger' });
    });
    await advance(100000);
    expect(view.container.querySelectorAll('.lyra-toast')).toHaveLength(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('retained methods read committed configuration without changing existing lifetimes', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const { api, view, receive } = await timerHarness(300);
    await act(() => {
      api.info('Old');
    });
    await advance(100);
    await view.rerender(
      <ToastProvider duration={8000}>
        <Capture receive={receive} />
      </ToastProvider>,
    );
    await act(() => {
      api.error('New');
    });
    await advance(200);
    expect(view.container.querySelectorAll('.lyra-toast')).toHaveLength(1);
    await expect.element(view.getByText('New')).toBeInTheDocument();
    await advance(7799);
    await expect.element(view.getByText('New')).toBeInTheDocument();
    await advance(1);
    expect(view.container.querySelector('.lyra-toast')).toBeNull();
  });

  for (const first of ['pointer', 'focus'] as const) {
    it(`preserves remaining time with ${first} first and independent overlapping claims`, async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
      const { api, view } = await timerHarness(8000);
      await act(() => {
        api.toast(
          <>
            <input aria-label="Action" size={8} />
            <input aria-label="Other action" size={8} />
          </>,
        );
      });
      await advance(3000);
      const action = view.getByRole('textbox', { name: 'Action', exact: true });
      const outside = view.getByRole('button', { name: 'Outside' });
      const other = view.getByRole('textbox', { name: 'Other action' });
      outside.element().focus();
      await expect.element(outside).toHaveFocus();
      if (first === 'pointer') {
        await userEvent.hover(action);
        await expect.element(outside).toHaveFocus();
      }
      action.element().focus();
      await expect.element(action).toHaveFocus();
      await userEvent.hover(action);
      await expect.element(action).toHaveFocus();
      await advance(9000);
      await userEvent.tab();
      await expect.element(other).toHaveFocus();
      await advance(9000);
      if (first === 'pointer') await userEvent.hover(outside);
      else
        await act(() => {
          outside.element().focus();
        });
      await expect.element(first === 'pointer' ? other : outside).toHaveFocus();
      await advance(9000);
      expect(view.container.querySelectorAll('.lyra-toast')).toHaveLength(1);
      if (first === 'pointer')
        await act(() => {
          outside.element().focus();
        });
      else await userEvent.hover(outside);
      await expect.element(outside).toHaveFocus();
      await advance(4999);
      expect(view.container.querySelectorAll('.lyra-toast')).toHaveLength(1);
      await advance(1);
      expect(view.container.querySelector('.lyra-toast')).toBeNull();
    });
  }

  it('retained methods are harmless after unmount and cannot control a fresh provider', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const old = await timerHarness();
    let id = 0;
    await act(() => {
      id = old.api.info('Old');
    });
    await old.view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    const fresh = await timerHarness();
    await act(() => {
      old.api.dismiss(id);
      expect(typeof old.api.success('Retained')).toBe('number');
      fresh.api.info('Fresh');
      old.api.dismiss(1);
    });
    expect(vi.getTimerCount()).toBe(1);
    await expect.element(fresh.view.getByText('Fresh')).toBeInTheDocument();
    await advance(8000);
    expect(fresh.view.container.querySelector('.lyra-toast')).toBeNull();
  });

  for (const mutation of ['remove', 'disable'] as const) {
    for (const hovered of [false, true]) {
      it(`reconciles focus after a descendant ${mutation}, pointer=${hovered}`, async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
        const { api, view } = await timerHarness();
        let change: (() => void) | undefined;
        function Content() {
          const [changed, setChanged] = useState(false);
          useEffect(() => {
            change = () => setChanged(true);
          }, []);
          return (
            <>
              <span>Dynamic notification</span>
              {!(changed && mutation === 'remove') && (
                <input aria-label="Dynamic action" size={8} disabled={changed} />
              )}
            </>
          );
        }
        await act(() => {
          api.info(<Content />);
        });
        await advance(3000);
        const action = view.getByRole('textbox', { name: 'Dynamic action' });
        action.element().focus();
        await expect.element(action).toHaveFocus();
        const message = view.getByText('Dynamic notification');
        if (hovered)
          await userEvent.hover(view.getByRole('button', { name: 'Close notification' }));
        await advance(9000);
        await act(() => {
          if (!change) throw new Error('Expected mounted dynamic content');
          change();
        });
        const row = message.element().closest('.lyra-toast');
        if (!row) throw new Error('Expected toast row');
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        if (mutation === 'remove') expect(row.contains(document.activeElement)).toBe(false);
        else {
          await expect.element(action).toBeDisabled();
          // Native focus fixup after disabling is asynchronous in some engines.
          // Establish the resumption precondition before advancing the controlled clock.
          const outside = view.getByRole('button', { name: 'Outside' });
          await act(() => outside.element().focus());
          await expect.element(outside).toHaveFocus();
        }
        expect(row.contains(document.activeElement)).toBe(false);
        expect(row.matches(':hover')).toBe(hovered);
        if (hovered) {
          await advance(9000);
          await expect.element(message).toBeInTheDocument();
          await userEvent.hover(view.getByRole('button', { name: 'Outside' }));
        }
        await advance(4999);
        await expect.element(message).toBeInTheDocument();
        await advance(1);
        expect(view.container.querySelector('.lyra-toast')).toBeNull();
      });
    }
  }

  it('does no focus or timer work during deferred real-unmount cleanup or retained dismissal', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const { api, view } = await timerHarness();
    const opener = view.getByRole('button', { name: 'Outside' }).element();
    opener.focus();
    await expect.element(opener).toHaveFocus();
    let id = 0;
    await act(() => {
      id = api.info('Unmounted');
    });
    const close = view.getByRole('button', { name: 'Close notification' });
    close.element().focus();
    await expect.element(close).toHaveFocus();
    const focus = vi.spyOn(opener, 'focus');
    try {
      await view.unmount();
      await Promise.resolve();
      api.dismiss(id);
      api.dismiss(id);
      expect(typeof api.info('After cleanup')).toBe('number');
      await advance(100000);
      expect(vi.getTimerCount()).toBe(0);
      expect(focus).not.toHaveBeenCalled();
    } finally {
      focus.mockRestore();
    }
  });
});

describe('Toast dismissal focus', () => {
  it('captures the opener when a child queues during its layout effect', async () => {
    const opener = document.createElement('button');
    opener.textContent = 'Open notifications';
    document.body.append(opener);
    function InitialNotification() {
      const { info } = useToast();
      useLayoutEffect(() => {
        opener.focus();
        info('Initial notification', { duration: 0 });
      }, [info]);
      return null;
    }
    try {
      const view = await render(
        <ToastProvider>
          <InitialNotification />
        </ToastProvider>,
      );
      const close = view.getByRole('button', { name: 'Close notification' });
      close.element().focus();
      await expect.element(close).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect.element(opener).toHaveFocus();
    } finally {
      opener.remove();
    }
  });

  for (const invalid of ['none', 'removed', 'disabled', 'inert'] as const) {
    it(`restores the opener or persistent region when opener is ${invalid}`, async () => {
      const { api, view, receive } = await timerHarness(0);
      const opener = view.getByRole('button', { name: 'Outside' });
      opener.element().focus();
      await expect.element(opener).toHaveFocus();
      await act(() => {
        api.success('Focus notification');
      });
      const close = view.getByRole('button', { name: 'Close notification' });
      await expect.element(close).toBeInTheDocument();
      if (invalid === 'removed')
        await view.rerender(
          <ToastProvider duration={0}>
            <Capture receive={receive} showOpener={false} />
          </ToastProvider>,
        );
      if (invalid === 'disabled') opener.element().setAttribute('disabled', '');
      if (invalid === 'inert') opener.element().setAttribute('inert', '');
      close.element().focus();
      await expect.element(close).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      const group = view.getByRole('region', { name: 'Notifications' });
      await expect.element(group).toBeInTheDocument();
      await expect.element(invalid === 'none' ? opener : group).toHaveFocus();
      expect(group.element().hasAttribute('aria-live')).toBe(false);
      expect(view.container.querySelectorAll('[aria-live]')).toHaveLength(2);
    });
  }

  it('handles an action removing its opener in the dismissal commit', async () => {
    function Consumer() {
      const { toast, dismiss } = useToast();
      const [visible, setVisible] = useState(true);
      return visible ? (
        <button
          type="button"
          onClick={() => {
            const id = toast(
              <button
                type="button"
                onClick={() => {
                  dismiss(id);
                  setVisible(false);
                }}
              >
                Remove opener
              </button>,
              { duration: 0 },
            );
          }}
        >
          Open
        </button>
      ) : null;
    }
    const view = await render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    const opener = view.getByRole('button', { name: 'Open' });
    opener.element().focus();
    await expect.element(opener).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const action = view.getByRole('button', { name: 'Remove opener' });
    await expect.element(action).toBeInTheDocument();
    action.element().focus();
    await expect.element(action).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect.element(view.getByRole('region', { name: 'Notifications' })).toHaveFocus();
  });

  it('preserves deliberate action focus and unfocused dismissals', async () => {
    const { api, view } = await timerHarness(0);
    const outside = view.getByRole('button', { name: 'Outside' });
    let id = 0;
    await act(() => {
      id = api.toast(
        <button
          type="button"
          onClick={() => {
            api.dismiss(id);
            outside.element().focus();
          }}
        >
          Move focus
        </button>,
      );
    });
    const action = view.getByRole('button', { name: 'Move focus' });
    action.element().focus();
    await expect.element(action).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect.element(outside).toHaveFocus();
    await act(() => {
      id = api.error('Unfocused');
    });
    await act(() => {
      api.dismiss(id);
    });
    await expect.element(outside).toHaveFocus();
  });
});

describe('toast timer isolation', () => {
  it('preserves elapsed time through StrictMode replay with one live timer', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    function Child() {
      const { info } = useToast();
      const queued = useRef(false);
      useEffect(() => {
        if (!queued.current) {
          queued.current = true;
          info('Replay');
        }
        vi.advanceTimersByTime(3000);
      }, [info]);
      return null;
    }
    const view = await render(
      <StrictMode>
        <ToastProvider>
          <Child />
        </ToastProvider>
      </StrictMode>,
    );
    expect(vi.getTimerCount()).toBe(1);
    await advance(1999);
    await expect.element(view.getByText('Replay')).toBeInTheDocument();
    await advance(1);
    expect(view.container.querySelector('.lyra-toast')).toBeNull();
  });

  it('keeps independent rows and providers running and ignores stale row events', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const first = await timerHarness();
    const second = await timerHarness();
    let id = 0;
    await act(() => {
      id = first.api.info('Paused');
      first.api.info('Running');
      second.api.info('Other provider');
    });
    const close = first.view.getByRole('button', { name: 'Close notification' }).nth(0);
    await userEvent.hover(close);
    await advance(8000);
    await expect.element(first.view.getByText('Paused')).toBeInTheDocument();
    expect(first.view.container.querySelectorAll('.lyra-toast')).toHaveLength(1);
    expect(second.view.container.querySelector('.lyra-toast')).toBeNull();
    const stale = close.element();
    await act(() => {
      first.api.dismiss(id);
    });
    await act(() => {
      stale.dispatchEvent(new PointerEvent('pointerout', { bubbles: true }));
      stale.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      first.api.dismiss(id);
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps persistent rows timer-free through pointer and descendant focus changes', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const { api, view } = await timerHarness();
    await act(() => {
      api.error(
        <>
          <input aria-label="Action" size={8} />
          <input aria-label="Next action" size={8} />
        </>,
      );
    });
    const action = view.getByRole('textbox', { name: 'Action', exact: true });
    await userEvent.hover(action);
    action.element().focus();
    await expect.element(action).toHaveFocus();
    await userEvent.tab();
    await expect.element(view.getByRole('textbox', { name: 'Next action' })).toHaveFocus();
    await userEvent.hover(view.getByRole('button', { name: 'Outside' }));
    view.getByRole('button', { name: 'Outside' }).element().focus();
    await advance(100000);
    expect(vi.getTimerCount()).toBe(0);
    await expect.element(action).toBeInTheDocument();
  });

  it('restores focus for programmatic dismissal without choosing a neighboring toast', async () => {
    const { api, view } = await timerHarness(0);
    const opener = view.getByRole('button', { name: 'Outside' });
    opener.element().focus();
    await expect.element(opener).toHaveFocus();
    let first = 0;
    await act(() => {
      first = api.info('First');
    });
    const firstClose = view.getByRole('button', { name: 'Close notification' }).nth(0);
    firstClose.element().focus();
    await expect.element(firstClose).toHaveFocus();
    let second = 0;
    await act(() => {
      second = api.error('Second');
    });
    const secondClose = view.getByRole('button', { name: 'Close notification' }).nth(1);
    secondClose.element().focus();
    await expect.element(secondClose).toHaveFocus();
    await act(() => {
      api.dismiss(second);
    });
    await expect.element(view.getByRole('region', { name: 'Notifications' })).toHaveFocus();
    firstClose.element().focus();
    await expect.element(firstClose).toHaveFocus();
    await act(() => {
      api.dismiss(first);
    });
    await expect.element(opener).toHaveFocus();
  });
});
