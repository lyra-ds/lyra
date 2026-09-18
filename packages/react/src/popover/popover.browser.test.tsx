import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Popover } from './index';
import { Button } from '../button';
import { Dialog } from '../dialog';

const themes = ['light', 'dark'] as const;

function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

afterEach(async () => {
  await cleanup();
  window.scrollTo(0, 0);
  setTheme('light');
});

describe('Popover', () => {
  for (const theme of themes) {
    it(`renders the composed trigger and panel and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <Popover trigger={<Button variant="secondary">More options</Button>} defaultOpen>
            Panel content
          </Popover>,
        );
        const trigger = container.querySelector<HTMLButtonElement>('button')!;
        const panel = container.querySelector<HTMLElement>('[role="dialog"]')!;

        expect(container.querySelector('.lyra-popover-anchor')!.className).toBe(
          'lyra-popover-anchor',
        );
        expect(panel.className).toBe('lyra-popover lyra-popover--bottom lyra-popover--align-start');
        expect(trigger.querySelector('button')).toBeNull();
        expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
        await expect.element(panel).toBeInTheDocument();
        expect(errorSpy).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('closes on a document mousedown outside the anchor', async () => {
    const { container } = await render(
      <>
        <Popover trigger={<button type="button">Options</button>}>Panel content</Popover>
        <button type="button" tabIndex={0}>
          Outside
        </button>
      </>,
    );
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    await userEvent.click(trigger);
    await expect
      .element(container.querySelector<HTMLElement>('[role="dialog"]')!)
      .toBeInTheDocument();

    const outside = container.querySelectorAll<HTMLButtonElement>('button')[1]!;
    await userEvent.click(outside);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it('closes on Escape and restores focus to the fused trigger', async () => {
    const { container } = await render(
      <Popover
        trigger={
          <button type="button" tabIndex={0}>
            Options
          </button>
        }
      >
        Panel content
      </Popover>,
    );
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    await userEvent.click(trigger);
    const focusSpy = vi.spyOn(trigger, 'focus');
    await userEvent.keyboard('{Escape}');

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(focusSpy).not.toHaveBeenCalled();
    focusSpy.mockRestore();
  });

  it.each([
    { name: 'inherited LTR start', direction: 'ltr', align: 'start', edge: 'left' },
    { name: 'inherited LTR end', direction: 'ltr', align: 'end', edge: 'right' },
    { name: 'inherited RTL start', direction: 'rtl', align: 'start', edge: 'right' },
    { name: 'inherited RTL end', direction: 'rtl', align: 'end', edge: 'left' },
    {
      name: 'nested LTR start within RTL',
      direction: 'rtl',
      nestedDirection: 'ltr',
      align: 'start',
      edge: 'left',
    },
    {
      name: 'nested LTR end within RTL',
      direction: 'rtl',
      nestedDirection: 'ltr',
      align: 'end',
      edge: 'right',
    },
    { name: 'inherited LTR center', direction: 'ltr', align: 'center', edge: 'center' },
    { name: 'inherited RTL center', direction: 'rtl', align: 'center', edge: 'center' },
  ] as const)(
    'aligns explicit logical values for $name',
    async ({ direction, nestedDirection, align, edge }) => {
      const { container } = await render(
        <div dir={direction}>
          <div dir={nestedDirection}>
            <Popover
              defaultOpen
              align={align}
              side="bottom"
              width={280}
              style={{ left: 300, position: 'fixed', top: 160 }}
              trigger={
                <button type="button" style={{ height: 32, width: 120 }}>
                  Options
                </button>
              }
            >
              Panel content
            </Popover>
          </div>
        </div>,
      );
      const anchor = container.querySelector<HTMLElement>('.lyra-popover-anchor')!;
      const panel = container.querySelector<HTMLElement>('[role="dialog"]')!;
      await vi.waitFor(() => {
        const anchorBounds = anchor.getBoundingClientRect();
        const panelBounds = panel.getBoundingClientRect();

        if (edge === 'center') {
          expect((panelBounds.left + panelBounds.right) / 2).toBeCloseTo(
            (anchorBounds.left + anchorBounds.right) / 2,
          );
        } else {
          expect(panelBounds[edge]).toBeCloseTo(anchorBounds[edge]);
        }
      });
    },
  );

  it.each([
    { direction: 'ltr', edge: 'left' },
    { direction: 'ltr', edge: 'right' },
    { direction: 'rtl', edge: 'left' },
    { direction: 'rtl', edge: 'right' },
  ] as const)(
    'keeps automatic placement in the viewport at the $direction $edge edge',
    async ({ direction, edge }) => {
      const { container } = await render(
        <div dir={direction}>
          <Popover
            defaultOpen
            width={280}
            style={{ [edge]: 0, position: 'fixed', top: 160 }}
            trigger={
              <button type="button" style={{ height: 32, width: 120 }}>
                Options
              </button>
            }
          >
            Panel content
          </Popover>
        </div>,
      );
      const panel = container.querySelector<HTMLElement>('[role="dialog"]')!;
      await vi.waitFor(() => {
        const panelBounds = panel.getBoundingClientRect();

        expect(panelBounds.left).toBeGreaterThanOrEqual(0);
        expect(panelBounds.right).toBeLessThanOrEqual(window.innerWidth);
      });
    },
  );

  it('restores the current trigger once after an accepted Escape from the panel', async () => {
    const { container } = await render(
      <Popover defaultOpen trigger={<button type="button">Options</button>}>
        <button type="button">Panel action</button>
      </Popover>,
    );
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    const action = container.querySelector<HTMLButtonElement>('[role="dialog"] button')!;
    action.focus();
    const focusSpy = vi.spyOn(trigger, 'focus');

    await userEvent.keyboard('{Escape}');

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(focusSpy).toHaveBeenCalledOnce();
    expect(focusSpy).toHaveBeenLastCalledWith({ preventScroll: true });
    focusSpy.mockRestore();
  });

  it('does not invent return focus for a controlled programmatic close', async () => {
    const fixture = (open: boolean) => (
      <Popover open={open} onOpenChange={() => {}} trigger={<button type="button">Options</button>}>
        <button type="button">Panel action</button>
      </Popover>
    );
    const { container, rerender } = await render(fixture(true));
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    const action = container.querySelector<HTMLButtonElement>('[role="dialog"] button')!;
    const focusSpy = vi.spyOn(trigger, 'focus');
    action.focus();

    await rerender(fixture(false));

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(focusSpy).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(trigger);
    focusSpy.mockRestore();
  });

  it('lets the root cancel Escape before its default and retains the panel focus', async () => {
    const onOpenChange = vi.fn();
    const onKeyDown = vi.fn((event: ReactKeyboardEvent<HTMLSpanElement>) => event.preventDefault());
    const { container } = await render(
      <Popover
        defaultOpen
        trigger={<button type="button">Options</button>}
        onOpenChange={onOpenChange}
        onKeyDown={onKeyDown}
      >
        <button type="button">Panel action</button>
      </Popover>,
    );
    const panel = container.querySelector<HTMLElement>('[role="dialog"]')!;
    const action = panel.querySelector<HTMLButtonElement>('button')!;
    action.focus();

    await userEvent.keyboard('{Escape}');

    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(onOpenChange).not.toHaveBeenCalled();
    await expect.element(panel).toBeInTheDocument();
    expect(document.activeElement).toBe(action);
  });

  it('keeps its Escape default when the root stops propagation', async () => {
    const onAncestorKeyDown = vi.fn();
    const onOpenChange = vi.fn();
    const { container } = await render(
      <div role="presentation" onKeyDown={onAncestorKeyDown}>
        <Popover
          defaultOpen
          trigger={<button type="button">Options</button>}
          onOpenChange={onOpenChange}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <button type="button">Panel action</button>
        </Popover>
      </div>,
    );
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    const action = container.querySelector<HTMLElement>('[role="dialog"] button')!;
    action.focus();

    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onAncestorKeyDown).not.toHaveBeenCalled();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it.each([false, true])(
    'keeps the parent open when a nested Popover %s its Escape close request',
    async (ignoreChildClose) => {
      const onParentChange = vi.fn();
      const onChildChange = vi.fn();

      function NestedPopovers(): React.JSX.Element {
        const [parentOpen, setParentOpen] = useState(true);
        const [childOpen, setChildOpen] = useState(true);
        return (
          <Popover
            open={parentOpen}
            onOpenChange={(next) => {
              onParentChange(next);
              setParentOpen(next);
            }}
            trigger={<button type="button">Parent trigger</button>}
          >
            <Popover
              open={childOpen}
              onOpenChange={(next) => {
                onChildChange(next);
                if (!ignoreChildClose) setChildOpen(next);
              }}
              trigger={<button type="button">Child trigger</button>}
            >
              <button type="button">Child action</button>
            </Popover>
          </Popover>
        );
      }

      const { container } = await render(<NestedPopovers />);
      const childAction = container.querySelector<HTMLButtonElement>(
        '[role="dialog"] [role="dialog"] button',
      )!;
      childAction.focus();

      await userEvent.keyboard('{Escape}');

      expect(onChildChange).toHaveBeenCalledExactlyOnceWith(false);
      expect(onParentChange).not.toHaveBeenCalled();
      const panels = container.querySelectorAll<HTMLElement>('[role="dialog"]');
      expect(panels).toHaveLength(ignoreChildClose ? 2 : 1);
      await expect.element(panels[0]!).toBeInTheDocument();
      if (!ignoreChildClose) {
        expect(document.activeElement).toBe(
          container.querySelector<HTMLButtonElement>(
            '[role="dialog"] > .lyra-popover-anchor > button',
          ),
        );
      } else {
        expect(document.activeElement).toBe(childAction);
      }
    },
  );

  it('owns Escape before a parent Dialog panel can close', async () => {
    const onDialogClose = vi.fn();
    await render(
      <Dialog open onClose={onDialogClose} title="Parent dialog">
        <Popover defaultOpen trigger={<button type="button">Popover trigger</button>}>
          <button type="button">Popover action</button>
        </Popover>
      </Dialog>,
    );
    const action = document.querySelector<HTMLButtonElement>('.lyra-popover button')!;
    action.focus();

    await userEvent.keyboard('{Escape}');

    expect(onDialogClose).not.toHaveBeenCalled();
    expect(document.querySelector('.lyra-popover')).toBeNull();
    await expect.element(document.querySelector<HTMLElement>('.lyra-dialog')!).toBeInTheDocument();
  });

  it('keeps a Popover open for mousedown and Escape owned by a portalled Dialog child', async () => {
    const onDialogClose = vi.fn();

    function PopoverWithDialog(): React.JSX.Element {
      const [popoverOpen, setPopoverOpen] = useState(true);
      const [dialogOpen, setDialogOpen] = useState(true);
      const triggerRef = useRef<HTMLButtonElement | null>(null);
      return (
        <Popover
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          trigger={
            <button ref={triggerRef} type="button">
              Popover trigger
            </button>
          }
        >
          <Dialog
            open={dialogOpen}
            onClose={() => {
              onDialogClose();
              setDialogOpen(false);
            }}
            title="Child dialog"
            returnFocusTo={() => triggerRef.current}
          >
            <button type="button">Dialog action</button>
          </Dialog>
        </Popover>
      );
    }

    await render(<PopoverWithDialog />);
    const dialogAction = document.querySelector<HTMLButtonElement>(
      '.lyra-dialog button:not([aria-label])',
    )!;
    await userEvent.click(dialogAction);
    await expect.element(document.querySelector<HTMLElement>('.lyra-popover')!).toBeInTheDocument();

    dialogAction.focus();
    await userEvent.keyboard('{Escape}');

    expect(onDialogClose).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(document.querySelector('.lyra-dialog')).toBeNull());
    await expect.element(document.querySelector<HTMLElement>('.lyra-popover')!).toBeInTheDocument();
  });

  it('keeps an ordinary React portal action and its Popover parent open', async () => {
    const onAction = vi.fn();
    function PopoverWithPortalAction(): React.JSX.Element {
      const [open, setOpen] = useState(true);
      return (
        <Popover
          open={open}
          onOpenChange={setOpen}
          trigger={<button type="button">Popover trigger</button>}
        >
          {createPortal(
            <button
              type="button"
              aria-label="Portal action"
              style={{ position: 'fixed', bottom: 16, right: 16 }}
              onClick={onAction}
            >
              Portal action
            </button>,
            document.body,
          )}
        </Popover>
      );
    }

    await render(<PopoverWithPortalAction />);
    const panel = document.querySelector<HTMLElement>('.lyra-popover')!;
    const action = document.querySelector<HTMLButtonElement>('[aria-label="Portal action"]')!;
    const panelBounds = panel.getBoundingClientRect();
    const actionBounds = action.getBoundingClientRect();

    expect(actionBounds.top).toBeGreaterThan(panelBounds.bottom);
    expect(actionBounds.left).toBeGreaterThanOrEqual(0);
    expect(actionBounds.right).toBeLessThanOrEqual(window.innerWidth);
    expect(actionBounds.bottom).toBeLessThanOrEqual(window.innerHeight);
    expect(
      document.elementFromPoint(
        actionBounds.left + actionBounds.width / 2,
        actionBounds.top + actionBounds.height / 2,
      ),
    ).toBe(action);
    await userEvent.click(action);

    expect(onAction).toHaveBeenCalledOnce();
    await expect.element(document.querySelector<HTMLElement>('.lyra-popover')!).toBeInTheDocument();
  });

  it('does not restore an ignored Escape after focus moves outside before controlled acceptance', async () => {
    const fixture = (open: boolean) => (
      <>
        <Popover
          open={open}
          onOpenChange={() => {}}
          trigger={<button type="button">Options</button>}
        >
          <button type="button">Panel action</button>
        </Popover>
        <button type="button">Later control</button>
      </>
    );

    const { container, rerender } = await render(fixture(true));
    const action = container.querySelector<HTMLButtonElement>('[role="dialog"] button')!;
    const accept = container.querySelectorAll<HTMLButtonElement>('button')[2]!;
    action.focus();
    await userEvent.keyboard('{Escape}');
    await expect
      .element(container.querySelector<HTMLElement>('[role="dialog"]')!)
      .toBeInTheDocument();

    accept.focus();
    await rerender(fixture(false));

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(accept);
  });

  it('restores the current replacement trigger after an accepted Escape', async () => {
    function ReplacementTriggerPopover(): React.JSX.Element {
      const [open, setOpen] = useState(true);
      const [replaced, setReplaced] = useState(false);
      return (
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setReplaced(true);
          }}
          trigger={
            <button key={replaced ? 'replacement' : 'original'} type="button">
              {replaced ? 'Replacement trigger' : 'Original trigger'}
            </button>
          }
        >
          <button type="button">Panel action</button>
        </Popover>
      );
    }

    const { container } = await render(<ReplacementTriggerPopover />);
    const original = container.querySelector<HTMLButtonElement>('button')!;
    const action = container.querySelector<HTMLButtonElement>('[role="dialog"] button')!;
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
    action.focus();
    focusSpy.mockClear();

    await userEvent.keyboard('{Escape}');

    const replacement = container.querySelector<HTMLButtonElement>('button')!;
    expect(original.isConnected).toBe(false);
    expect(replacement).not.toBe(original);
    expect(replacement.textContent).toBe('Replacement trigger');
    expect(document.activeElement).toBe(replacement);
    expect(focusSpy).toHaveBeenCalledOnce();
    focusSpy.mockRestore();
  });

  it('uses an explicit top side as the bounded scroll region', async () => {
    const { container } = await render(
      <Popover
        defaultOpen
        side="top"
        trigger={<button type="button">Options</button>}
        style={{ left: 32, position: 'fixed', top: '40vh' }}
      >
        <div style={{ height: '200vh' }}>Long panel</div>
      </Popover>,
    );
    const anchor = container.querySelector<HTMLElement>('.lyra-popover-anchor')!;
    const panel = container.querySelector<HTMLElement>('[role="dialog"]')!;

    await vi.waitFor(() => {
      expect(panel.classList).toContain('lyra-popover--top');
      expect(panel.style.overflowY).toBe('auto');
      expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
      expect(panel.getBoundingClientRect().height).toBeLessThanOrEqual(
        anchor.getBoundingClientRect().top - 7,
      );
    });
  });

  it.each(['disabled', 'hidden', 'inert'] as const)(
    'does not focus a current %s trigger after the original disconnects',
    async (state) => {
      function IneligibleTriggerPopover(): React.JSX.Element {
        const [open, setOpen] = useState(true);
        const [closing, setClosing] = useState(false);
        const replacement =
          state === 'disabled' ? (
            <button key="replacement" type="button" disabled>
              Disabled trigger
            </button>
          ) : state === 'hidden' ? (
            <button key="replacement" type="button" hidden>
              Hidden trigger
            </button>
          ) : (
            <button key="replacement" type="button" inert>
              Inert trigger
            </button>
          );

        return (
          <Popover
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) setClosing(true);
            }}
            trigger={
              closing ? (
                replacement
              ) : (
                <button key="original" type="button">
                  Original trigger
                </button>
              )
            }
          >
            <button type="button">Panel action</button>
          </Popover>
        );
      }

      const { container } = await render(<IneligibleTriggerPopover />);
      const original = container.querySelector<HTMLButtonElement>('button')!;
      const action = container.querySelector<HTMLButtonElement>('[role="dialog"] button')!;
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
      action.focus();
      focusSpy.mockClear();

      await userEvent.keyboard('{Escape}');

      expect(original.isConnected).toBe(false);
      expect(container.querySelector('button')).not.toBe(original);
      expect(focusSpy).not.toHaveBeenCalled();
      focusSpy.mockRestore();
    },
  );

  it('does not attempt focus on a trigger removed while its panel remains open', async () => {
    const { container } = await render(
      <Popover defaultOpen trigger={<button type="button">Options</button>}>
        <button type="button">Panel action</button>
      </Popover>,
    );
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    const action = container.querySelector<HTMLButtonElement>('[role="dialog"] button')!;
    const focusSpy = vi.spyOn(trigger, 'focus');
    trigger.remove();
    action.focus();
    try {
      await userEvent.keyboard('{Escape}');
      expect(trigger.isConnected).toBe(false);
      expect(container.querySelector('[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(document.body);
      expect(focusSpy).not.toHaveBeenCalled();
    } finally {
      focusSpy.mockRestore();
    }
  });

  it('clears a prior accepted Escape intent before a fresh open cycle closes programmatically', async () => {
    const onOpenChange = vi.fn();
    const fixture = (open: boolean) => (
      <Popover
        open={open}
        onOpenChange={onOpenChange}
        trigger={<button type="button">Options</button>}
      >
        <button type="button">Panel action</button>
      </Popover>
    );
    const { container, rerender } = await render(fixture(true));
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    const focusSpy = vi.spyOn(trigger, 'focus');
    const firstAction = container.querySelector<HTMLButtonElement>('[role="dialog"] button')!;
    firstAction.focus();

    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    await rerender(fixture(false));
    expect(focusSpy).toHaveBeenCalledOnce();

    await rerender(fixture(true));
    const nextAction = container.querySelector<HTMLButtonElement>('[role="dialog"] button')!;
    nextAction.focus();
    await rerender(fixture(false));

    expect(focusSpy).toHaveBeenCalledOnce();
    focusSpy.mockRestore();
  });

  it('clears an ignored Escape intent on unmount without restoring focus', async () => {
    const { container, unmount } = await render(
      <Popover open onOpenChange={() => {}} trigger={<button type="button">Options</button>}>
        <button type="button">Panel action</button>
      </Popover>,
    );
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    const action = container.querySelector<HTMLButtonElement>('[role="dialog"] button')!;
    const focusSpy = vi.spyOn(trigger, 'focus');
    action.focus();

    await userEvent.keyboard('{Escape}');
    await unmount();

    expect(focusSpy).not.toHaveBeenCalled();
    focusSpy.mockRestore();
  });

  it('does not retain an inside mousedown that stops before the document listener', async () => {
    const { container } = await render(
      <>
        <Popover
          defaultOpen
          trigger={<button type="button">Options</button>}
          onMouseDownCapture={(event) => event.stopPropagation()}
        >
          <button type="button">Panel action</button>
        </Popover>
        <button type="button" tabIndex={0}>
          Outside
        </button>
      </>,
    );
    const panelAction = container.querySelector<HTMLButtonElement>('[role="dialog"] button')!;
    const outside = container.querySelectorAll<HTMLButtonElement>('button')[2]!;

    await userEvent.click(panelAction);
    await expect
      .element(container.querySelector<HTMLElement>('[role="dialog"]')!)
      .toBeInTheDocument();
    await userEvent.click(outside);

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it('re-measures from above to below when scrolling gives an anchor room below', async () => {
    const { container } = await render(
      <>
        <div style={{ height: 'calc(100vh - 80px)' }} />
        <Popover trigger={<button type="button">Options</button>}>Panel content</Popover>
        <div style={{ height: '150vh' }} />
      </>,
    );
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    await userEvent.click(trigger);

    expect(container.querySelector('[role="dialog"]')!.className).toContain('lyra-popover--top');
    window.scrollTo(0, 160);
    await vi.waitFor(() => {
      expect(container.querySelector('[role="dialog"]')!.className).toContain(
        'lyra-popover--bottom',
      );
    });
  });
});
