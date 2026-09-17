import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { StrictMode, useRef, useState, type ReactNode } from 'react';
import { Drawer } from './index';

function DrawerHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          // Prepare focus at activation — WebKit drops a pre-focused trigger on mousedown, before click.
          event.currentTarget.focus();
          setOpen(true);
        }}
      >
        Open
      </button>
      <button type="button">Background</button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Details"
        footer={<button type="button">Save</button>}
      >
        <input aria-label="Name" />
        <button type="button">Last</button>
      </Drawer>
    </>
  );
}

afterEach(async () => {
  await cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('Drawer — declared initial focus', () => {
  it('uses an eligible declared destination instead of a hidden first control', async () => {
    const destinationRef = { current: null as HTMLInputElement | null };
    const resolver = vi.fn(() => destinationRef.current);

    await render(
      <Drawer open initialFocusTo={resolver} title="Declared destination">
        <button type="button" hidden>
          Hidden first action
        </button>
        <input ref={destinationRef} aria-label="Task field" />
      </Drawer>,
    );

    await vi.waitFor(() => expect(document.activeElement).toBe(destinationRef.current));
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.lyra-drawer')!.getAttribute('initialFocusTo')).toBeNull();
  });
});

describe('Drawer', () => {
  it('runs its consumer before its cancellable Escape default and preserves non-Escape bubbling', async () => {
    const calls: string[] = [];
    await render(
      <div role="presentation" onKeyDown={(event) => calls.push(`parent-${event.key}`)}>
        <Drawer
          open
          onClose={() => calls.push('close')}
          onKeyDown={(event) => {
            calls.push(`consumer-${event.key}-${event.currentTarget.className}`);
            if (event.key === 'Escape') event.preventDefault();
          }}
          title="Details"
        >
          <input aria-label="Editor" />
        </Drawer>
      </div>,
    );

    const editor = document.querySelector<HTMLInputElement>('[aria-label="Editor"]')!;
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(editor);
    expect(calls).toEqual(['consumer-Tab-lyra-drawer', 'parent-Tab']);
    calls.length = 0;
    await userEvent.keyboard('{Escape}');
    expect(calls).toEqual(['consumer-Escape-lyra-drawer']);

    await userEvent.keyboard('{Enter}');
    expect(calls).toEqual([
      'consumer-Escape-lyra-drawer',
      'consumer-Enter-lyra-drawer',
      'parent-Enter',
    ]);
  });

  it('keeps Escape local when the consumer stops propagation but does not prevent default', async () => {
    const onClose = vi.fn();
    const onParentKeyDown = vi.fn();
    await render(
      <div role="presentation" onKeyDown={onParentKeyDown}>
        <Drawer
          open
          onClose={onClose}
          onKeyDown={(event) => event.stopPropagation()}
          title="Details"
        >
          <input aria-label="Editor" />
        </Drawer>
      </div>,
    );

    const editor = document.querySelector<HTMLInputElement>('[aria-label="Editor"]')!;
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(editor);
    expect(onParentKeyDown).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onParentKeyDown).not.toHaveBeenCalled();
  });

  it('keeps a descendant-canceled Escape local without closing', async () => {
    const onClose = vi.fn();
    const onParentKeyDown = vi.fn();
    await render(
      <div role="presentation" onKeyDown={onParentKeyDown}>
        <Drawer open onClose={onClose} title="Details">
          <input aria-label="Editor" onKeyDown={(event) => event.preventDefault()} />
        </Drawer>
      </div>,
    );

    const editor = document.querySelector<HTMLInputElement>('[aria-label="Editor"]')!;
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(editor);
    expect(onParentKeyDown).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
    expect(onParentKeyDown).toHaveBeenCalledTimes(1);
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`emits exact classes and is axe clean in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await render(
          <Drawer
            open
            onClose={() => {}}
            title="Details"
            footer={<button type="button">Save</button>}
          >
            Body
          </Drawer>,
        );
        await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).not.toBeNull());
        const panel = document.querySelector<HTMLElement>('.lyra-drawer')!;
        expect(document.querySelector('.lyra-drawer-overlay')!.className).toBe(
          'lyra-drawer-overlay',
        );
        expect(panel.className).toBe('lyra-drawer');
        expect(panel.querySelector('.lyra-drawer__header')!.className).toBe('lyra-drawer__header');
        expect(panel.querySelector('.lyra-drawer__title')!.className).toBe('lyra-drawer__title');
        expect(panel.querySelector('.lyra-drawer__body')!.className).toBe('lyra-drawer__body');
        expect(panel.querySelector('.lyra-drawer__footer')!.className).toBe('lyra-drawer__footer');
        expect(panel.querySelector('.lyra-drawer__close')!.className).toBe('lyra-drawer__close');
        await expectNoAxeViolations(document.body);
        expect(errorSpy).not.toHaveBeenCalled();
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('uses "Close" as the default accessible name for the close button', async () => {
    await render(
      <Drawer open onClose={() => {}} title="Details">
        Body
      </Drawer>,
    );
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer__close')).not.toBeNull());
    expect(document.querySelector('.lyra-drawer__close')!.getAttribute('aria-label')).toBe('Close');
  });

  it('uses closeLabel as the accessible name for the close button', async () => {
    await render(
      <Drawer open onClose={() => {}} closeLabel="Fechar" title="Details">
        Body
      </Drawer>,
    );
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer__close')).not.toBeNull());
    expect(document.querySelector('.lyra-drawer__close')!.getAttribute('aria-label')).toBe(
      'Fechar',
    );
  });

  it('animates out before it leaves, instead of vanishing on the same frame', async () => {
    // Regression: Drawer entered with `lyra-slide-in` and then unmounted immediately, while Dialog
    // and the command palette both hold a `--closing` class for their exit.
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <Drawer open={open} onClose={() => setOpen(false)} title="Details">
          Body
        </Drawer>
      );
    }
    await render(<Harness />);
    const panel = document.querySelector<HTMLElement>('.lyra-drawer')!;
    await userEvent.keyboard('{Escape}');

    // Still mounted, now carrying the exit animation.
    expect(panel.className).toContain('lyra-drawer--closing');
    expect(getComputedStyle(panel).animationName).toBe('lyra-slide-out');
    expect(document.querySelector('.lyra-drawer-overlay')!.className).toContain(
      'lyra-drawer-overlay--closing',
    );

    // And the page is scrollable again straight away — the lock keys on the request, not the exit.
    expect(document.body.style.overflow).not.toBe('hidden');
    await vi.waitFor(() => {
      expect(document.querySelector('.lyra-drawer')).toBeNull();
    });
  });

  it('does not request close when a press inside the panel releases on the backdrop', async () => {
    const onClose = vi.fn();
    await render(
      <Drawer open onClose={onClose} title="Details">
        Body
      </Drawer>,
    );
    const panel = document.querySelector<HTMLElement>('.lyra-drawer')!;
    const overlay = document.querySelector<HTMLElement>('.lyra-drawer-overlay')!;

    panel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onClose).toHaveBeenCalledTimes(0);
  });

  it('requests close for a backdrop gesture and the close button, but not an inside click', async () => {
    const onClose = vi.fn();
    await render(
      <Drawer open onClose={onClose} title="Details">
        Body
      </Drawer>,
    );
    const panel = document.querySelector<HTMLElement>('.lyra-drawer')!;
    const overlay = document.querySelector<HTMLElement>('.lyra-drawer-overlay')!;
    const close = panel.querySelector<HTMLButtonElement>('.lyra-drawer__close')!;

    overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);

    panel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    panel.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    panel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await userEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('traps focus, locks scroll, and restores its opener on Escape and backdrop close', async () => {
    const { container } = await render(<DrawerHarness />);
    const opener = container.querySelector<HTMLButtonElement>('button')!;
    await userEvent.click(opener);
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).not.toBeNull());
    expect(document.body.style.overflow).toBe('hidden');
    const panel = document.querySelector<HTMLElement>('.lyra-drawer')!;
    const close = panel.querySelector<HTMLButtonElement>('.lyra-drawer__close')!;
    const last = panel.querySelectorAll<HTMLButtonElement>('button')[2]!;
    last.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(close);
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).toBeNull());
    expect(document.activeElement).toBe(opener);

    await userEvent.click(opener);
    const overlay = document.querySelector<HTMLElement>('.lyra-drawer-overlay')!;
    overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).toBeNull());
    expect(document.activeElement).toBe(opener);
  });

  it.each(['escape', 'backdrop', 'button'] as const)(
    'explicit mouse returnFocusTo restores its declared target after %s dismissal',
    async (dismissal) => {
      function ExplicitMouseHarness(): ReactNode {
        const [open, setOpen] = useState(false);
        const targetRef = useRef<HTMLHeadingElement>(null);
        return (
          <>
            <button type="button" onClick={() => setOpen(true)}>
              Open without focus preparation
            </button>
            <h2 ref={targetRef} tabIndex={-1}>
              Return destination
            </h2>
            <Drawer
              open={open}
              onClose={() => setOpen(false)}
              returnFocusTo={() => targetRef.current}
              title="Explicit mouse return focus"
            >
              Body
            </Drawer>
          </>
        );
      }

      await render(<ExplicitMouseHarness />);
      await userEvent.click(document.querySelector<HTMLButtonElement>('button')!);
      await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).not.toBeNull());
      const panel = document.querySelector<HTMLElement>('.lyra-drawer')!;
      expect(panel.getAttribute('returnFocusTo')).toBeNull();

      if (dismissal === 'escape') await userEvent.keyboard('{Escape}');
      else if (dismissal === 'backdrop') {
        const originalViewport = { width: window.innerWidth, height: window.innerHeight };
        const overlay = document.querySelector<HTMLElement>('.lyra-drawer-overlay')!;
        const backdropPoint = { x: 1, y: 1 };
        const nativeClickTargets: (EventTarget | null)[] = [];
        const captureNativeClick = (event: MouseEvent) => nativeClickTargets.push(event.target);

        try {
          await page.viewport(1280, 720);
          overlay.addEventListener('click', captureNativeClick);

          const panelBounds = panel.getBoundingClientRect();
          expect(
            backdropPoint.x >= panelBounds.left &&
              backdropPoint.x <= panelBounds.right &&
              backdropPoint.y >= panelBounds.top &&
              backdropPoint.y <= panelBounds.bottom,
          ).toBe(false);
          expect(document.elementFromPoint(backdropPoint.x, backdropPoint.y)).toBe(overlay);

          await userEvent.click(overlay, { position: backdropPoint });
          expect(nativeClickTargets).toEqual([overlay]);
        } finally {
          overlay.removeEventListener('click', captureNativeClick);
          await page.viewport(originalViewport.width, originalViewport.height);
        }
      } else await userEvent.click(panel.querySelector<HTMLButtonElement>('.lyra-drawer__close')!);

      const target = document.querySelector<HTMLHeadingElement>('h2:not(.lyra-drawer__title)')!;
      await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).toBeNull());
      expect(document.activeElement).toBe(target);
    },
  );

  it('uses a successor after the trigger is removed by the accepted closing commit', async () => {
    function RemovedTriggerHarness(): ReactNode {
      const [open, setOpen] = useState(false);
      const [showTrigger, setShowTrigger] = useState(true);
      const successorRef = useRef<HTMLHeadingElement>(null);
      return (
        <>
          {showTrigger && (
            <button type="button" onClick={() => setOpen(true)}>
              Remove me on close
            </button>
          )}
          <h2 ref={successorRef} tabIndex={-1}>
            Workflow successor
          </h2>
          <Drawer
            open={open}
            onClose={() => {
              setShowTrigger(false);
              setOpen(false);
            }}
            returnFocusTo={() => successorRef.current}
            title="Removed trigger"
          >
            Body
          </Drawer>
        </>
      );
    }

    await render(<RemovedTriggerHarness />);
    await userEvent.click(document.querySelector<HTMLButtonElement>('button')!);
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    const successor = document.querySelector<HTMLHeadingElement>('h2:not(.lyra-drawer__title)')!;
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).toBeNull());
    expect(document.activeElement).toBe(successor);
  });

  it('does not resolve returnFocusTo when a parent ignores a close request', async () => {
    const resolver = vi.fn(() => document.createElement('button'));
    function IgnoredCloseHarness(): ReactNode {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open ignored close
          </button>
          <Drawer open={open} onClose={() => {}} returnFocusTo={resolver} title="Ignored close">
            Body
          </Drawer>
        </>
      );
    }

    await render(<IgnoredCloseHarness />);
    await userEvent.click(document.querySelector<HTMLButtonElement>('button')!);
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    expect(resolver).not.toHaveBeenCalled();
  });

  it('captures a fresh opener and resolves once per accepted close during a rapid reopen', async () => {
    const resolver = vi.fn(() => null);
    function ControlledRapidReopen({ open }: { open: boolean }): ReactNode {
      return (
        <>
          <button type="button">First keyboard opener</button>
          <button type="button">Second keyboard opener</button>
          <Drawer open={open} returnFocusTo={resolver} title="Rapid reopen">
            Body
          </Drawer>
        </>
      );
    }

    const { rerender } = await render(<ControlledRapidReopen open={false} />);
    const firstTrigger = document.querySelectorAll<HTMLButtonElement>('button')[0]!;
    const secondTrigger = document.querySelectorAll<HTMLButtonElement>('button')[1]!;
    firstTrigger.focus();
    await rerender(<ControlledRapidReopen open />);
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).not.toBeNull());
    const firstPanel = document.querySelector<HTMLElement>('.lyra-drawer')!;
    await vi.waitFor(() => expect(firstPanel.contains(document.activeElement)).toBe(true));

    await rerender(<ControlledRapidReopen open={false} />);
    await vi.waitFor(() =>
      expect(
        document.querySelector('.lyra-drawer')?.classList.contains('lyra-drawer--closing'),
      ).toBe(true),
    );
    await vi.waitFor(() => expect(resolver).toHaveBeenCalledTimes(1));
    expect(document.activeElement).toBe(firstTrigger);

    secondTrigger.focus();
    await rerender(<ControlledRapidReopen open />);
    await vi.waitFor(() =>
      expect(
        document.querySelector('.lyra-drawer')?.classList.contains('lyra-drawer--closing'),
      ).toBe(false),
    );
    expect(document.querySelector('.lyra-drawer')).toBe(firstPanel);
    await vi.waitFor(() => expect(firstPanel.contains(document.activeElement)).toBe(true));

    await rerender(<ControlledRapidReopen open={false} />);
    await vi.waitFor(() => expect(resolver).toHaveBeenCalledTimes(2));
    expect(document.activeElement).toBe(secondTrigger);
  });

  it('preserves the omitted-prop opener across StrictMode effect replay', async () => {
    function StrictModeHarness(): ReactNode {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open strict drawer
          </button>
          <Drawer open={open} onClose={() => setOpen(false)} title="Strict opener">
            Body
          </Drawer>
        </>
      );
    }

    await render(
      <StrictMode>
        <StrictModeHarness />
      </StrictMode>,
    );
    const trigger = document.querySelector<HTMLButtonElement>('button')!;
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });
});

describe('Drawer — logical close activity', () => {
  it('inerts its retained exit scope and cannot reuse a backdrop press after reopening', async () => {
    const onClose = vi.fn();
    function LogicalCloseHarness(): ReactNode {
      const [open, setOpen] = useState(false);
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <div data-testid="consumer-host">
          <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
            Open logical drawer
          </button>
          <button type="button">Outside</button>
          <Drawer
            open={open}
            onClose={() => {
              onClose();
              setOpen(false);
            }}
            returnFocusTo={() => triggerRef.current}
            title="Logical close"
          >
            Body
          </Drawer>
        </div>
      );
    }

    const { container } = await render(<LogicalCloseHarness />);
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    const outside = container.querySelectorAll<HTMLButtonElement>('button')[1]!;
    await userEvent.click(trigger);
    await vi.waitFor(() => expect(document.querySelector('.lyra-drawer-overlay')).not.toBeNull());
    const retainedOverlay = document.querySelector<HTMLElement>('.lyra-drawer-overlay')!;
    const retainedPanel = document.querySelector<HTMLElement>('.lyra-drawer')!;
    await vi.waitFor(() =>
      expect(retainedOverlay.querySelectorAll('[data-lyra-focus-trap-boundary]')).toHaveLength(2),
    );
    const retainedGuards = Array.from(
      retainedOverlay.querySelectorAll<HTMLElement>('[data-lyra-focus-trap-boundary]'),
    );
    expect(retainedGuards).toHaveLength(2);
    expect(retainedGuards.every((guard) => retainedOverlay.contains(guard))).toBe(true);
    await vi.waitFor(() => expect(retainedPanel.contains(document.activeElement)).toBe(true));
    retainedOverlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(retainedOverlay.hasAttribute('inert')).toBe(true));
    expect(retainedOverlay.hasAttribute('inert')).toBe(true);
    expect(retainedOverlay.isConnected).toBe(true);
    expect(retainedOverlay.contains(retainedPanel)).toBe(true);
    expect(retainedPanel.getAttribute('aria-modal')).toBeNull();
    expect(retainedGuards.every((guard) => !guard.isConnected)).toBe(true);
    expect(container.querySelector('[data-testid="consumer-host"]')!.hasAttribute('inert')).toBe(
      false,
    );
    expect(outside.closest('[inert]')).toBeNull();
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    retainedPanel.focus();
    expect(document.activeElement).not.toBe(retainedPanel);

    await userEvent.click(trigger);
    await vi.waitFor(() =>
      expect(document.querySelector('.lyra-drawer-overlay')).toBe(retainedOverlay),
    );
    expect(document.querySelector('.lyra-drawer')).toBe(retainedPanel);
    retainedOverlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
