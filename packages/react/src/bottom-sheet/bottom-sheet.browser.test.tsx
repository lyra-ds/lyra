import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { StrictMode, useRef, useState } from 'react';
import { BottomSheet } from './index';

function backdropDismiss(overlay: HTMLElement): void {
  overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function BottomSheetHarness() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Open sheet
      </button>
      <button type="button">Background</button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        returnFocusTo={() => triggerRef.current}
        title="Sheet details"
      >
        <input aria-label="Name" />
        <button type="button">Last</button>
      </BottomSheet>
    </>
  );
}

afterEach(async () => {
  await cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('BottomSheet — declared initial focus', () => {
  it('uses an eligible declared destination instead of a hidden first control', async () => {
    const destinationRef = { current: null as HTMLInputElement | null };
    const resolver = vi.fn(() => destinationRef.current);

    await render(
      <BottomSheet open initialFocusTo={resolver} title="Declared destination">
        <button type="button" hidden>
          Hidden first action
        </button>
        <input ref={destinationRef} aria-label="Task field" />
      </BottomSheet>,
    );

    await vi.waitFor(() => expect(document.activeElement).toBe(destinationRef.current));
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.lyra-bottomsheet')!.getAttribute('initialFocusTo')).toBeNull();
  });
});

describe('BottomSheet', () => {
  it('runs its consumer before its cancellable Escape default and preserves non-Escape bubbling', async () => {
    const calls: string[] = [];
    await render(
      <div role="presentation" onKeyDown={(event) => calls.push(`parent-${event.key}`)}>
        <BottomSheet
          open
          onClose={() => calls.push('close')}
          onKeyDown={(event) => {
            calls.push(`consumer-${event.key}-${event.currentTarget.className}`);
            if (event.key === 'Escape') event.preventDefault();
          }}
          title="Sheet details"
        >
          <input aria-label="Editor" />
        </BottomSheet>
      </div>,
    );

    const editor = document.querySelector<HTMLInputElement>('[aria-label="Editor"]')!;
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(editor);
    expect(calls).toEqual(['consumer-Tab-lyra-bottomsheet', 'parent-Tab']);
    calls.length = 0;
    await userEvent.keyboard('{Escape}');
    expect(calls).toEqual(['consumer-Escape-lyra-bottomsheet']);

    await userEvent.keyboard('{Enter}');
    expect(calls).toEqual([
      'consumer-Escape-lyra-bottomsheet',
      'consumer-Enter-lyra-bottomsheet',
      'parent-Enter',
    ]);
  });

  it('keeps Escape local when the consumer stops propagation but does not prevent default', async () => {
    const onClose = vi.fn();
    const onParentKeyDown = vi.fn();
    await render(
      <div role="presentation" onKeyDown={onParentKeyDown}>
        <BottomSheet
          open
          onClose={onClose}
          onKeyDown={(event) => event.stopPropagation()}
          title="Sheet details"
        >
          <input aria-label="Editor" />
        </BottomSheet>
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
        <BottomSheet open onClose={onClose} title="Sheet details">
          <input aria-label="Editor" onKeyDown={(event) => event.preventDefault()} />
        </BottomSheet>
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
    it(`emits its complete class contract and is axe clean in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const screen = await render(
          <BottomSheet open onClose={() => {}} title="Sheet details">
            Body
          </BottomSheet>,
        );

        await expect
          .element(screen.getByRole('dialog', { name: 'Sheet details' }))
          .toBeInTheDocument();
        const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
        expect(document.querySelector('.lyra-bottomsheet-overlay')!.className).toBe(
          'lyra-bottomsheet-overlay',
        );
        expect(panel.className).toBe('lyra-bottomsheet');
        expect(panel.getAttribute('role')).toBe('dialog');
        expect(panel.getAttribute('aria-modal')).toBe('true');
        const title = panel.querySelector<HTMLElement>('.lyra-bottomsheet__title')!;
        expect(panel.getAttribute('aria-labelledby')).toBe(title.id);
        expect(title.id).not.toBe('');
        expect(panel.querySelector('.lyra-bottomsheet__header')!.className).toBe(
          'lyra-bottomsheet__header',
        );
        expect(panel.querySelector('.lyra-bottomsheet__title')!.className).toBe(
          'lyra-bottomsheet__title',
        );
        expect(panel.querySelector('.lyra-bottomsheet__body')!.className).toBe(
          'lyra-bottomsheet__body',
        );
        expect(panel.querySelector('.lyra-bottomsheet__close')!.className).toBe(
          'lyra-bottomsheet__close',
        );
        await expectNoAxeViolations(document.body);
        expect(errorSpy).not.toHaveBeenCalled();
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('uses the title as its accessible name, or the translated aria-label when title is absent', async () => {
    const screen = await render(
      <BottomSheet open onClose={() => {}} aria-label="Choose a date">
        Calendar
      </BottomSheet>,
    );

    await expect.element(screen.getByRole('dialog', { name: 'Choose a date' })).toBeInTheDocument();
    const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
    expect(panel.getAttribute('aria-labelledby')).toBeNull();
    expect(panel.getAttribute('aria-label')).toBe('Choose a date');
    expect(panel.querySelector('.lyra-bottomsheet__title')).toBeNull();
  });

  it('uses a translated close-button label', async () => {
    const screen = await render(
      <BottomSheet open onClose={() => {}} closeLabel="Fechar" title="Sheet details">
        Body
      </BottomSheet>,
    );

    await expect.element(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });

  it('forwards a consumer animation-end handler while maintaining presence bookkeeping', async () => {
    const onAnimationEnd = vi.fn();
    await render(
      <BottomSheet open onAnimationEnd={onAnimationEnd} title="Sheet details">
        Body
      </BottomSheet>,
    );

    const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
    panel.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    expect(onAnimationEnd).toHaveBeenCalledTimes(1);
  });

  it('stays mounted with slide-out motion until its exit animation completes', async () => {
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Sheet details">
          Body
        </BottomSheet>
      );
    }

    await render(<Harness />);
    const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
    await userEvent.keyboard('{Escape}');

    expect(panel.className).toContain('lyra-bottomsheet--closing');
    expect(getComputedStyle(panel).animationName).toBe('lyra-bottomsheet-out');
    expect(document.querySelector('.lyra-bottomsheet-overlay')!.className).toContain(
      'lyra-bottomsheet-overlay--closing',
    );
    expect(document.body.style.overflow).not.toBe('hidden');
    panel.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).toBeNull());
  });

  it('traps focus and restores it after Escape and overlay close', async () => {
    const screen = await render(<BottomSheetHarness />);
    const opener = screen.getByRole('button', { name: 'Open sheet' }).element();

    await userEvent.click(opener);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).not.toBeNull());
    expect(document.body.style.overflow).toBe('hidden');
    const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
    const close = panel.querySelector<HTMLButtonElement>('.lyra-bottomsheet__close')!;
    const last = panel.querySelectorAll<HTMLButtonElement>('button')[1]!;
    last.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(close);

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).toBeNull());
    expect(document.activeElement).toBe(opener);

    await userEvent.click(opener);
    const overlay = document.querySelector<HTMLElement>('.lyra-bottomsheet-overlay')!;
    backdropDismiss(overlay);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).toBeNull());
    expect(document.activeElement).toBe(opener);
  });

  it.each(['escape', 'backdrop', 'button'] as const)(
    'explicit mouse returnFocusTo restores its declared target after %s dismissal',
    async (dismissal) => {
      function ExplicitMouseHarness() {
        const [open, setOpen] = useState(false);
        const targetRef = useRef<HTMLButtonElement>(null);
        return (
          <>
            <button type="button" onClick={() => setOpen(true)}>
              Open without focus preparation
            </button>
            <button ref={targetRef} type="button">
              Return destination
            </button>
            <BottomSheet
              open={open}
              onClose={() => setOpen(false)}
              returnFocusTo={() => targetRef.current}
              title="Explicit mouse return focus"
            >
              Body
            </BottomSheet>
          </>
        );
      }

      await render(<ExplicitMouseHarness />);
      await userEvent.click(document.querySelector<HTMLButtonElement>('button')!);
      await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).not.toBeNull());
      const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
      expect(panel.getAttribute('returnFocusTo')).toBeNull();

      if (dismissal === 'escape') await userEvent.keyboard('{Escape}');
      else if (dismissal === 'backdrop') {
        await userEvent.click(document.querySelector<HTMLElement>('.lyra-bottomsheet-overlay')!, {
          position: { x: 1, y: 1 },
        });
      } else
        await userEvent.click(panel.querySelector<HTMLButtonElement>('.lyra-bottomsheet__close')!);

      const target = document.querySelectorAll<HTMLButtonElement>('button')[1]!;
      await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).toBeNull());
      expect(document.activeElement).toBe(target);
    },
  );

  it('does not resolve returnFocusTo when a parent ignores a close request', async () => {
    const resolver = vi.fn(() => document.createElement('button'));
    function IgnoredCloseHarness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open ignored close
          </button>
          <BottomSheet
            open={open}
            onClose={() => {}}
            returnFocusTo={resolver}
            title="Ignored close"
          >
            Body
          </BottomSheet>
        </>
      );
    }

    await render(<IgnoredCloseHarness />);
    await userEvent.click(document.querySelector<HTMLButtonElement>('button')!);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    expect(resolver).not.toHaveBeenCalled();
  });

  it('captures a fresh opener and resolves once per accepted close during a rapid reopen', async () => {
    const resolver = vi.fn(() => null);
    function ControlledRapidReopen({ open }: { open: boolean }) {
      return (
        <>
          <button type="button">First keyboard opener</button>
          <button type="button">Second keyboard opener</button>
          <BottomSheet open={open} returnFocusTo={resolver} title="Rapid reopen">
            Body
          </BottomSheet>
        </>
      );
    }

    const { rerender } = await render(<ControlledRapidReopen open={false} />);
    const firstTrigger = document.querySelectorAll<HTMLButtonElement>('button')[0]!;
    const secondTrigger = document.querySelectorAll<HTMLButtonElement>('button')[1]!;
    firstTrigger.focus();
    await rerender(<ControlledRapidReopen open />);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).not.toBeNull());
    const firstPanel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
    await vi.waitFor(() => expect(firstPanel.contains(document.activeElement)).toBe(true));

    await rerender(<ControlledRapidReopen open={false} />);
    await vi.waitFor(() => expect(resolver).toHaveBeenCalledTimes(1));
    expect(document.activeElement).toBe(firstTrigger);

    secondTrigger.focus();
    await rerender(<ControlledRapidReopen open />);
    await vi.waitFor(() => expect(firstPanel.contains(document.activeElement)).toBe(true));

    await rerender(<ControlledRapidReopen open={false} />);
    await vi.waitFor(() => expect(resolver).toHaveBeenCalledTimes(2));
    expect(document.activeElement).toBe(secondTrigger);
  });

  it('resolves an explicit return target once under StrictMode', async () => {
    const resolver = vi.fn(() => document.querySelector<HTMLButtonElement>('[data-return-target]'));
    function StrictModeHarness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open strict sheet
          </button>
          <button type="button" data-return-target>
            Strict return destination
          </button>
          <BottomSheet
            open={open}
            onClose={() => setOpen(false)}
            returnFocusTo={resolver}
            title="Strict sheet"
          >
            Body
          </BottomSheet>
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
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    const target = document.querySelector<HTMLButtonElement>('[data-return-target]')!;
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).toBeNull());
    expect(document.activeElement).toBe(target);
    expect(resolver).toHaveBeenCalledTimes(1);
  });

  it('uses only the latest committed returnFocusTo resolver for an accepted close', async () => {
    const firstResolver = vi.fn(() => document.querySelector<HTMLElement>('[data-return-first]'));
    const latestResolver = vi.fn(() => document.querySelector<HTMLElement>('[data-return-latest]'));
    function LatestResolverHarness({
      open,
      returnFocusTo,
    }: {
      open: boolean;
      returnFocusTo: () => HTMLElement | null;
    }) {
      return (
        <>
          <button type="button" data-return-first>
            First return destination
          </button>
          <button type="button" data-return-latest>
            Latest return destination
          </button>
          <BottomSheet open={open} returnFocusTo={returnFocusTo} title="Latest resolver">
            Body
          </BottomSheet>
        </>
      );
    }

    const { rerender } = await render(
      <LatestResolverHarness open={false} returnFocusTo={firstResolver} />,
    );
    await rerender(<LatestResolverHarness open={false} returnFocusTo={latestResolver} />);
    expect(firstResolver).not.toHaveBeenCalled();
    expect(latestResolver).not.toHaveBeenCalled();

    const opener = document.querySelector<HTMLButtonElement>('[data-return-first]')!;
    opener.focus();
    await rerender(<LatestResolverHarness open returnFocusTo={latestResolver} />);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).not.toBeNull());

    await rerender(<LatestResolverHarness open={false} returnFocusTo={latestResolver} />);
    await vi.waitFor(() => expect(latestResolver).toHaveBeenCalledTimes(1));
    expect(firstResolver).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      document.querySelector<HTMLButtonElement>('[data-return-latest]'),
    );
  });

  it.each(['panel', 'overlay'] as const)(
    'falls back to the prepared opener when returnFocusTo targets the closing %s',
    async (invalidTarget) => {
      function InvalidTargetHarness() {
        const [open, setOpen] = useState(false);
        const panelRef = useRef<HTMLDivElement>(null);
        return (
          <>
            <button type="button" onClick={() => setOpen(true)}>
              Prepared opener
            </button>
            <BottomSheet
              ref={panelRef}
              open={open}
              onClose={() => setOpen(false)}
              returnFocusTo={() =>
                invalidTarget === 'panel'
                  ? panelRef.current
                  : document.querySelector<HTMLElement>('.lyra-bottomsheet-overlay')
              }
              title="Invalid return target"
            >
              Body
            </BottomSheet>
          </>
        );
      }

      const { container } = await render(<InvalidTargetHarness />);
      const opener = container.querySelector<HTMLButtonElement>('button')!;
      opener.focus();
      await userEvent.keyboard('{Enter}');
      await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).not.toBeNull());
      await userEvent.keyboard('{Escape}');
      await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).toBeNull());
      expect(document.activeElement).toBe(opener);
    },
  );

  it('does not dismiss when a panel/backdrop drag starts or ends inside the sheet', async () => {
    const onClose = vi.fn();
    await render(
      <BottomSheet open onClose={onClose} title="Sheet details">
        Body
      </BottomSheet>,
    );

    const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
    const overlay = document.querySelector<HTMLElement>('.lyra-bottomsheet-overlay')!;

    panel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();

    overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    panel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('re-captures focus when reopened during exit and keeps Tab trapped', async () => {
    function ControlledSheet({ open }: { open: boolean }) {
      return (
        <>
          <button type="button" data-testid="trigger">
            Open
          </button>
          <button type="button" data-testid="outside">
            Background
          </button>
          <BottomSheet open={open} title="Sheet details">
            <button type="button" data-testid="last">
              Last
            </button>
          </BottomSheet>
        </>
      );
    }

    const { container, rerender } = await render(<ControlledSheet open={false} />);
    const trigger = container.querySelector<HTMLButtonElement>('[data-testid="trigger"]')!;
    trigger.focus();
    await rerender(<ControlledSheet open />);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).not.toBeNull());

    await rerender(<ControlledSheet open={false} />);
    await rerender(<ControlledSheet open />);

    const panel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
    const last = panel.querySelector<HTMLButtonElement>('[data-testid="last"]')!;
    await vi.waitFor(() => expect(panel.contains(document.activeElement)).toBe(true));
    last.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(last);
    expect(document.activeElement).not.toBe(
      container.querySelector<HTMLButtonElement>('[data-testid="outside"]'),
    );
  });

  it('keeps focus on the panel when it has no focusable children', async () => {
    const screen = await render(
      <BottomSheet open title="Sheet details">
        Plain text only
      </BottomSheet>,
    );

    const panel = screen.getByRole('dialog', { name: 'Sheet details' }).element();
    await vi.waitFor(() => expect(document.activeElement).toBe(panel));
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(panel);
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(panel);
  });

  it('restores focus to the opener when the × button closes the sheet', async () => {
    const screen = await render(<BottomSheetHarness />);
    const opener = screen.getByRole('button', { name: 'Open sheet' }).element();
    await userEvent.click(opener);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).not.toBeNull());

    await userEvent.click(document.querySelector<HTMLButtonElement>('.lyra-bottomsheet__close')!);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).toBeNull());
    expect(document.activeElement).toBe(opener);
  });

  it('does not focus a detached opener after close', async () => {
    function RemovableOpenerHarness() {
      const [open, setOpen] = useState(false);
      const [showOpener, setShowOpener] = useState(true);
      return (
        <>
          {showOpener && (
            <button type="button" data-testid="trigger" onClick={() => setOpen(true)}>
              Open
            </button>
          )}
          <BottomSheet open={open} onClose={() => setOpen(false)} title="Sheet details">
            <button type="button" data-testid="remove" onClick={() => setShowOpener(false)}>
              Remove opener
            </button>
          </BottomSheet>
        </>
      );
    }

    const screen = await render(<RemovableOpenerHarness />);
    const opener = screen.getByRole('button', { name: 'Open', exact: true }).element();
    await userEvent.click(opener);
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).not.toBeNull());

    const focusSpy = vi.spyOn(opener, 'focus');
    // The remove control lives INSIDE the sheet: the page copy would sit under
    // the modal overlay, unreachable by a real click.
    await userEvent.click(screen.getByRole('button', { name: 'Remove opener' }).element());
    document.querySelector<HTMLElement>('.lyra-bottomsheet')!.focus();
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.querySelector('.lyra-bottomsheet')).toBeNull());
    expect(focusSpy).not.toHaveBeenCalled();
    focusSpy.mockRestore();
  });
});

describe('BottomSheet — logical close activity', () => {
  it('inerts its retained exit scope and cannot reuse a backdrop press after reopening', async () => {
    const onClose = vi.fn();
    function LogicalCloseHarness() {
      const [open, setOpen] = useState(false);
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <div data-testid="consumer-host">
          <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
            Open logical sheet
          </button>
          <button type="button">Outside</button>
          <BottomSheet
            open={open}
            onClose={() => {
              onClose();
              setOpen(false);
            }}
            returnFocusTo={() => triggerRef.current}
            title="Logical close"
          >
            Body
          </BottomSheet>
        </div>
      );
    }

    const { container } = await render(<LogicalCloseHarness />);
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    const outside = container.querySelectorAll<HTMLButtonElement>('button')[1]!;
    await userEvent.click(trigger);
    await vi.waitFor(() =>
      expect(document.querySelector('.lyra-bottomsheet-overlay')).not.toBeNull(),
    );
    const retainedOverlay = document.querySelector<HTMLElement>('.lyra-bottomsheet-overlay')!;
    const retainedPanel = document.querySelector<HTMLElement>('.lyra-bottomsheet')!;
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
      expect(document.querySelector('.lyra-bottomsheet-overlay')).toBe(retainedOverlay),
    );
    expect(document.querySelector('.lyra-bottomsheet')).toBe(retainedPanel);
    retainedOverlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
