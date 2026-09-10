// OVERLAY-component test template (D-25) — the shape Phase 4 copies for every portal +
// focus-trap + presence overlay (Drawer, CommandPalette, Toast). Runs in the "browser" vitest
// project (real chromium) because none of what this proves survives jsdom: real focus movement,
// Tab/Shift+Tab trap wrapping, CSS exit animations (animationName reads), computed scroll-lock
// padding, and axe accessibility checks ALL require a real engine.
//
// The @lyra-ds/styles entry CSS is imported IN THIS TEST (never in src, RCT-03). Vite resolves
// its @import graph and injects it as a <style> — this is the fixture stylesheet, and it carries
// the .lyra-dialog--closing / lyra-overlay-out exit keyframe the presence assertions read.
//
// Dialog renders through a Portal into document.body, so the assertions query document.* (NOT
// the render container) and the shared axe helper targets document.body — the tree the portal actually lands
// in. Dark theme is toggled on document.documentElement so the body-level portal inherits it.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StrictMode, useRef, useState, type ReactNode } from 'react';
import { render, cleanup } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Dialog, type DialogProps } from './index';

const THEMES = ['light', 'dark'] as const;

// A ~120-char title (backstop): wraps within the header while the close button keeps its box.
const LONG_TITLE =
  'Permanently delete the production release candidate and every regional edge cache entry associated with this deployment';

/** Toggle the dark token cascade on <html>; the body-level portal inherits it (review fix). */
function setTheme(theme: (typeof THEMES)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  void document.documentElement.offsetHeight; // force style recalc
}

// --- DOM accessors (portal target is document.body, not the render container) ----------------
const overlay = (root: ParentNode = document): HTMLElement | null =>
  root.querySelector('.lyra-dialog-overlay');
const panel = (root: ParentNode = document): HTMLElement | null =>
  root.querySelector('.lyra-dialog');
const closeBtn = (root: ParentNode = document): HTMLButtonElement | null =>
  root.querySelector('.lyra-dialog__close');

/**
 * Fire a real backdrop dismiss: a mousedown and a click both originating on the overlay (WR-02).
 * A bare `.click()` no longer closes — the dialog now requires the pointer press to have started
 * on the backdrop, so tests must simulate the full press→release gesture.
 */
function backdropDismiss(el: HTMLElement): void {
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

/**
 * Controlled harness with a real trigger button (so focus-restore is observable) plus a
 * background focusable that the trap must never reach.
 */
interface HarnessProps extends Partial<Omit<DialogProps, 'open' | 'title' | 'children'>> {
  title?: ReactNode;
  /** Include `onClose` (and therefore the × button). Default true. */
  withClose?: boolean;
  /** When true the parent IGNORES onClose (keeps open=true) — the D-20 restore-guard case. */
  ignoreClose?: boolean;
  children?: ReactNode;
}

function DialogHarness({
  title = 'Test dialog',
  withClose = true,
  ignoreClose = false,
  children,
  ...dialogProps
}: HarnessProps): ReactNode {
  const [open, setOpen] = useState(false);
  const onClose = withClose
    ? () => {
        if (!ignoreClose) setOpen(false);
      }
    : undefined;
  return (
    <>
      <button
        type="button"
        data-testid="trigger"
        onClick={(event) => {
          // Prepare focus at activation — WebKit drops a pre-focused trigger on mousedown, before click.
          event.currentTarget.focus();
          setOpen(true);
        }}
      >
        Open
      </button>
      <button type="button" data-testid="outside">
        Background
      </button>
      <Dialog open={open} onClose={onClose} title={title} {...dialogProps}>
        {children ?? (
          <>
            <button type="button" data-testid="first">
              First
            </button>
            <input data-testid="mid" aria-label="Middle field" />
            <button type="button" data-testid="last">
              Last
            </button>
          </>
        )}
      </Dialog>
    </>
  );
}

/** Render the harness, click the trigger, wait for the panel + its initial focus. */
async function openHarness(props: HarnessProps = {}): Promise<{
  container: HTMLElement;
  trigger: HTMLButtonElement;
}> {
  const result = await render(<DialogHarness {...props} />);
  const trigger = result.container.querySelector<HTMLButtonElement>('[data-testid="trigger"]')!;
  await userEvent.click(trigger);
  await vi.waitFor(() => expect(panel()).not.toBeNull());
  // Initial focus lands inside the panel (effect runs after the portal mounts).
  await vi.waitFor(() => expect(panel()!.contains(document.activeElement)).toBe(true));
  return { container: result.container, trigger };
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
  document.body.style.paddingRight = '';
  document.body.style.overflow = '';
});

// --- Structure + class emission --------------------------------------------------------------

describe('Dialog — structure', () => {
  it('open=false renders nothing (no overlay in the DOM)', async () => {
    await render(<DialogHarness />);
    expect(overlay()).toBeNull();
  });

  it('open mounts .lyra-dialog-overlay > .lyra-dialog with header/title and role/aria', async () => {
    await openHarness();
    const p = panel()!;
    expect(overlay()).not.toBeNull();
    expect(p.getAttribute('role')).toBe('dialog');
    expect(p.getAttribute('aria-modal')).toBe('true');
    const titleEl = p.querySelector('.lyra-dialog__title')!;
    expect(p.getAttribute('aria-labelledby')).toBe(titleEl.id);
    expect(titleEl.id).not.toBe('');
    expect(p.getAttribute('tabindex')).toBe('-1');
  });

  it('consumer className is appended LAST on the panel (D-09)', async () => {
    await openHarness({ className: 'my-dialog' });
    expect(panel()!.className).toBe('lyra-dialog my-dialog');
  });

  it('footer renders .lyra-dialog__footer; omitted footer omits it entirely', async () => {
    await openHarness({ footer: <span data-testid="foot">Footer</span> });
    expect(panel()!.querySelector('.lyra-dialog__footer')).not.toBeNull();
    await cleanup();
    await openHarness();
    expect(panel()!.querySelector('.lyra-dialog__footer')).toBeNull();
  });

  it('the × close button renders ONLY when onClose is provided', async () => {
    await openHarness({ withClose: false });
    expect(closeBtn()).toBeNull();
    await cleanup();
    await openHarness();
    const btn = closeBtn()!;
    expect(btn.getAttribute('aria-label')).toBe('Close');
    expect(btn.getAttribute('type')).toBe('button');
    expect(btn.getAttribute('style')).toBeNull(); // D-19 — no inline visual styles
    expect(btn.querySelector('svg')).not.toBeNull();
  });

  it('uses "Close" as the default accessible name for the close button', async () => {
    await openHarness();
    expect(closeBtn()!.getAttribute('aria-label')).toBe('Close');
  });

  it('uses closeLabel as the accessible name for the close button', async () => {
    await openHarness({ closeLabel: 'Fechar' });
    expect(closeBtn()!.getAttribute('aria-label')).toBe('Fechar');
  });
});

// --- Focus trap: both directions, zero-candidate containment, panel routing -------------------

describe('Dialog — focus trap', () => {
  it('Tab from the last focusable wraps to the first; Shift+Tab from the first wraps to the last', async () => {
    await openHarness();
    const first = closeBtn()!; // header × is first in DOM order
    const last = panel()!.querySelector<HTMLElement>('[data-testid="last"]')!;

    last.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(first);

    first.focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(last);
  });

  it('never lets focus reach the background', async () => {
    const { container } = await openHarness();
    const background = container.querySelector<HTMLElement>('[data-testid="outside"]')!;
    const last = panel()!.querySelector<HTMLElement>('[data-testid="last"]')!;
    last.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).not.toBe(background);
    expect(panel()!.contains(document.activeElement)).toBe(true);
  });

  it('zero-focusable dialog (plain text, no onClose) keeps focus on the panel across Tab/Shift+Tab', async () => {
    const { container } = await openHarness({
      withClose: false,
      children: 'Just some plain text — nothing focusable here.',
    });
    const p = panel()!;
    const background = container.querySelector<HTMLElement>('[data-testid="outside"]')!;
    // Initial focus fell back to the panel itself (tabIndex -1).
    expect(document.activeElement).toBe(p);

    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(p);
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(p);
    expect(document.activeElement).not.toBe(background);
  });

  it('panel-focused routing: Tab → first candidate, Shift+Tab → last candidate', async () => {
    await openHarness();
    const p = panel()!;
    const first = closeBtn()!;
    const last = p.querySelector<HTMLElement>('[data-testid="last"]')!;

    p.focus();
    expect(document.activeElement).toBe(p);
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(first);

    p.focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(last);
  });
});

// --- Initial focus determinism (portal-race regression) --------------------------------------

describe('Dialog — initial focus', () => {
  // A fully-controlled fixture (no onClose → no × button) so the FIRST focusable is deep in the
  // body. `open` is driven directly through rerender, avoiding Esc/click (a no-onClose dialog
  // cannot self-close, and the overlay covers any background control).
  function ControlledDeep({ open }: { open: boolean }): ReactNode {
    return (
      <>
        <button type="button" data-testid="trigger">
          Open
        </button>
        <Dialog open={open} title="Deep focus">
          <div>
            <section>
              <p>Intro copy — not focusable.</p>
              <button type="button" data-testid="deep">
                Deep action
              </button>
            </section>
          </div>
        </Dialog>
      </>
    );
  }

  it('focuses the first focusable even when it is deep in the body, across repeated cycles', async () => {
    const { rerender, container } = await render(<ControlledDeep open={false} />);
    const trigger = container.querySelector<HTMLButtonElement>('[data-testid="trigger"]')!;
    const deep = () => panel()!.querySelector<HTMLElement>('[data-testid="deep"]')!;

    for (let i = 0; i < 3; i += 1) {
      trigger.focus(); // opener at open time
      await rerender(<ControlledDeep open />);
      await vi.waitFor(() => expect(panel()).not.toBeNull());
      // Deterministically lands on the deep body button — proof the focus effect runs INSIDE
      // the portal subtree (never races a null panelRef).
      await vi.waitFor(() => expect(document.activeElement).toBe(deep()));

      await rerender(<ControlledDeep open={false} />);
      await vi.waitFor(() => expect(panel()).toBeNull(), { timeout: 500 });
    }
  });

  it('uses an eligible declared initial destination instead of a hidden first control', async () => {
    const destinationRef = { current: null as HTMLInputElement | null };
    const resolver = vi.fn(() => destinationRef.current);

    await render(
      <Dialog open initialFocusTo={resolver} title="Declared destination">
        <button type="button" hidden>
          Hidden first action
        </button>
        <input ref={destinationRef} aria-label="Task field" />
      </Dialog>,
    );

    await vi.waitFor(() => expect(document.activeElement).toBe(destinationRef.current));
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(panel()!.getAttribute('initialFocusTo')).toBeNull();
  });

  it('reopening DURING the exit window re-enters focus and keeps restore working (WR-03)', async () => {
    const { rerender, container } = await render(<ControlledDeep open={false} />);
    const trigger = container.querySelector<HTMLButtonElement>('[data-testid="trigger"]')!;
    const deep = (): HTMLElement => panel()!.querySelector<HTMLElement>('[data-testid="deep"]')!;

    trigger.focus(); // opener at open time
    await rerender(<ControlledDeep open />);
    await vi.waitFor(() => expect(panel()).not.toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(deep()));

    // Request close (panel enters its exit animation but usePresence keeps it mounted), then
    // reopen immediately — WITHIN the presence window, so it is the SAME DialogPanel instance.
    await rerender(<ControlledDeep open={false} />);
    await rerender(<ControlledDeep open />);

    // Regression (WR-03): focus must return INTO the panel. Before the fix the mount-only focus
    // effect never re-ran for the reused instance and focus stranded on the trigger.
    await vi.waitFor(() => expect(document.activeElement).toBe(deep()));

    // The opener was re-captured, so a subsequent real close still restores focus to the trigger.
    await rerender(<ControlledDeep open={false} />);
    await vi.waitFor(() => expect(panel()).toBeNull(), { timeout: 500 });
    expect(document.activeElement).toBe(trigger);
  });
});

// --- Close paths + opt-out flags + focus restore ---------------------------------------------

describe('Dialog — close paths', () => {
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
            <Dialog
              open={open}
              onClose={() => setOpen(false)}
              returnFocusTo={() => targetRef.current}
              title="Explicit mouse return focus"
            >
              Body
            </Dialog>
          </>
        );
      }

      await render(<ExplicitMouseHarness />);
      await userEvent.click(document.querySelector<HTMLButtonElement>('button')!);
      await vi.waitFor(() => expect(panel()).not.toBeNull());
      expect(panel()!.getAttribute('returnFocusTo')).toBeNull();

      if (dismissal === 'escape') await userEvent.keyboard('{Escape}');
      else if (dismissal === 'backdrop') {
        await userEvent.click(overlay()!, { position: { x: 1, y: 1 } });
      } else await userEvent.click(closeBtn()!);

      const target = document.querySelector<HTMLHeadingElement>('h2:not(.lyra-dialog__title)')!;
      await vi.waitFor(() => expect(panel()).toBeNull(), { timeout: 500 });
      expect(document.activeElement).toBe(target);
    },
  );

  it('Esc closes and restores focus to the trigger', async () => {
    const { trigger } = await openHarness();
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(panel()).toBeNull(), { timeout: 500 });
    expect(document.activeElement).toBe(trigger);
  });

  it('StrictMode preserves the omitted-prop opener across effect replay', async () => {
    function StrictModeHarness(): ReactNode {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open strict dialog
          </button>
          <Dialog open={open} onClose={() => setOpen(false)} title="Strict opener">
            Body
          </Dialog>
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
    await vi.waitFor(() => expect(panel()).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(panel()).toBeNull(), { timeout: 500 });
    expect(document.activeElement).toBe(trigger);
  });

  it('Esc with closeOnEsc=false does NOT close', async () => {
    await openHarness({ closeOnEsc: false });
    await userEvent.keyboard('{Escape}');
    // Give any (unwanted) close a chance to start.
    await new Promise((r) => setTimeout(r, 60));
    expect(panel()).not.toBeNull();
  });

  it('overlay backdrop press+release closes and restores focus to the trigger', async () => {
    const { trigger } = await openHarness();
    backdropDismiss(overlay()!); // press AND release on the overlay (identity) → close
    await vi.waitFor(() => expect(panel()).toBeNull(), { timeout: 500 });
    expect(document.activeElement).toBe(trigger);
  });

  it('overlay dismiss with closeOnOverlayClick=false does NOT close', async () => {
    await openHarness({ closeOnOverlayClick: false });
    backdropDismiss(overlay()!);
    await new Promise((r) => setTimeout(r, 60));
    expect(panel()).not.toBeNull();
  });

  it('a click INSIDE the panel never closes', async () => {
    await openHarness();
    panel()!.click(); // target === panel !== overlay currentTarget
    await new Promise((r) => setTimeout(r, 60));
    expect(panel()).not.toBeNull();
  });

  it('a drag that STARTS on the panel and releases on the backdrop does NOT close (WR-02)', async () => {
    await openHarness();
    // Press originates inside the panel (e.g. selecting body text); the click bubbles to the
    // overlay on release. Because the press did not start on the backdrop, the dialog must stay.
    panel()!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    overlay()!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 60));
    expect(panel()).not.toBeNull();
  });

  it('the × button closes and restores focus to the trigger', async () => {
    const { trigger } = await openHarness();
    await userEvent.click(closeBtn()!);
    await vi.waitFor(() => expect(panel()).toBeNull(), { timeout: 500 });
    expect(document.activeElement).toBe(trigger);
  });

  it('with no onClose there is no × button in the DOM', async () => {
    await openHarness({ withClose: false });
    expect(closeBtn()).toBeNull();
  });

  it('restore keys on open→false: a parent that ignores onClose keeps the dialog open with focus inside', async () => {
    await openHarness({ ignoreClose: true });
    await userEvent.keyboard('{Escape}');
    await new Promise((r) => setTimeout(r, 60));
    // onClose fired but the parent kept open=true → dialog stays, focus stays inside.
    expect(panel()).not.toBeNull();
    expect(panel()!.contains(document.activeElement)).toBe(true);
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
          <Dialog open={open} onClose={() => {}} returnFocusTo={resolver} title="Ignored close">
            Body
          </Dialog>
        </>
      );
    }

    await render(<IgnoredCloseHarness />);
    await userEvent.click(document.querySelector<HTMLButtonElement>('button')!);
    await vi.waitFor(() => expect(panel()).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    expect(resolver).not.toHaveBeenCalled();
    expect(panel()!.contains(document.activeElement)).toBe(true);
  });

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
          <Dialog
            open={open}
            onClose={() => {
              setShowTrigger(false);
              setOpen(false);
            }}
            returnFocusTo={() => successorRef.current}
            title="Removed trigger"
          >
            Body
          </Dialog>
        </>
      );
    }

    await render(<RemovedTriggerHarness />);
    await userEvent.click(document.querySelector<HTMLButtonElement>('button')!);
    await vi.waitFor(() => expect(panel()).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    const successor = document.querySelector<HTMLHeadingElement>('h2:not(.lyra-dialog__title)')!;
    await vi.waitFor(() => expect(panel()).toBeNull(), { timeout: 500 });
    expect(document.activeElement).toBe(successor);
  });
});

// --- Nested Escape containment ---------------------------------------------------------------

describe('Dialog — nested Escape containment', () => {
  interface NestedDialogHarnessProps {
    childCloseOnEsc?: boolean;
    ignoreChildClose?: boolean;
    onChildClose?: () => void;
    onChildKeyDown?: DialogProps['onKeyDown'];
    onParentClose?: () => void;
    onParentKeyDown?: DialogProps['onKeyDown'];
    childContent?: ReactNode;
  }

  function NestedDialogHarness({
    childCloseOnEsc = true,
    ignoreChildClose = false,
    onChildClose,
    onChildKeyDown,
    onParentClose,
    onParentKeyDown,
    childContent,
  }: NestedDialogHarnessProps): ReactNode {
    const [parentOpen, setParentOpen] = useState(false);
    const [childOpen, setChildOpen] = useState(false);
    const childTriggerRef = useRef<HTMLButtonElement>(null);

    return (
      <>
        <button type="button" aria-label="Open parent dialog" onClick={() => setParentOpen(true)}>
          Open parent dialog
        </button>
        <Dialog
          open={parentOpen}
          onClose={() => {
            onParentClose?.();
            setParentOpen(false);
          }}
          onKeyDown={onParentKeyDown}
          title="Parent dialog"
        >
          <button
            ref={childTriggerRef}
            type="button"
            aria-label="Open child dialog"
            onClick={() => setChildOpen(true)}
          >
            Open child dialog
          </button>
          <Dialog
            open={childOpen}
            onClose={() => {
              onChildClose?.();
              if (!ignoreChildClose) setChildOpen(false);
            }}
            onKeyDown={onChildKeyDown}
            closeOnEsc={childCloseOnEsc}
            returnFocusTo={() => childTriggerRef.current}
            title="Child dialog"
          >
            {childContent ?? (
              <button type="button" aria-label="Child action">
                Child action
              </button>
            )}
          </Dialog>
        </Dialog>
      </>
    );
  }

  const dialogByTitle = (title: string): HTMLElement | undefined =>
    [...document.querySelectorAll<HTMLElement>('.lyra-dialog')].find(
      (element) => element.querySelector('.lyra-dialog__title')?.textContent === title,
    );

  async function openNestedDialogs(props: NestedDialogHarnessProps = {}): Promise<{
    childTrigger: HTMLButtonElement;
  }> {
    await render(<NestedDialogHarness {...props} />);
    const parentTrigger = document.querySelector<HTMLButtonElement>(
      '[aria-label="Open parent dialog"]',
    )!;
    await userEvent.click(parentTrigger);
    await vi.waitFor(() => expect(dialogByTitle('Parent dialog')).toBeDefined());

    const childTrigger = dialogByTitle('Parent dialog')!.querySelector<HTMLButtonElement>(
      '[aria-label="Open child dialog"]',
    )!;
    await userEvent.click(childTrigger);
    await vi.waitFor(() => expect(dialogByTitle('Child dialog')).toBeDefined());
    await vi.waitFor(() =>
      expect(dialogByTitle('Child dialog')!.contains(document.activeElement)).toBe(true),
    );
    return { childTrigger };
  }

  it('closes only the child, restores its trigger, then lets a second Escape close the parent', async () => {
    const onChildClose = vi.fn();
    const onParentClose = vi.fn();
    const { childTrigger } = await openNestedDialogs({ onChildClose, onParentClose });

    await userEvent.keyboard('{Escape}');

    expect(onChildClose).toHaveBeenCalledTimes(1);
    expect(onParentClose).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(dialogByTitle('Child dialog')).toBeUndefined(), { timeout: 500 });
    expect(dialogByTitle('Parent dialog')).toBeDefined();
    expect(document.activeElement).toBe(childTrigger);

    await userEvent.keyboard('{Escape}');
    expect(onParentClose).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(dialogByTitle('Parent dialog')).toBeUndefined(), {
      timeout: 500,
    });
  });

  const containmentCases: Array<{
    name: string;
    props: Pick<
      NestedDialogHarnessProps,
      'childCloseOnEsc' | 'ignoreChildClose' | 'onChildKeyDown' | 'childContent'
    >;
    expectedChildCloseCalls: number;
  }> = [
    {
      name: 'the child disables Escape closing',
      props: { childCloseOnEsc: false },
      expectedChildCloseCalls: 0,
    },
    {
      name: 'the child parent ignores its close request',
      props: { ignoreChildClose: true },
      expectedChildCloseCalls: 1,
    },
    {
      name: 'the child panel consumer prevents default',
      props: { onChildKeyDown: (event) => event.preventDefault() },
      expectedChildCloseCalls: 0,
    },
    {
      name: 'a child input consumer prevents default',
      props: {
        childContent: (
          <input aria-label="Child editor" onKeyDown={(event) => event.preventDefault()} />
        ),
      },
      expectedChildCloseCalls: 0,
    },
  ];

  it.each(containmentCases)(
    'keeps the parent open when $name',
    async ({ props, expectedChildCloseCalls }) => {
      const onChildClose = vi.fn();
      const onParentClose = vi.fn();
      await openNestedDialogs({ ...props, onChildClose, onParentClose });

      if ('childContent' in props) {
        dialogByTitle('Child dialog')!
          .querySelector<HTMLInputElement>('[aria-label="Child editor"]')!
          .focus();
      }
      await userEvent.keyboard('{Escape}');

      expect(onChildClose).toHaveBeenCalledTimes(expectedChildCloseCalls);
      expect(onParentClose).not.toHaveBeenCalled();
      expect(dialogByTitle('Parent dialog')).toBeDefined();
      expect(dialogByTitle('Child dialog')).toBeDefined();
    },
  );

  it('runs the child consumer before its cancellable Escape default and preserves non-Escape bubbling', async () => {
    const calls: string[] = [];
    await openNestedDialogs({
      onChildClose: () => calls.push('child-close'),
      onChildKeyDown: (event) => {
        calls.push(`child-${event.key}`);
        if (event.key === 'Escape') event.preventDefault();
      },
      onParentKeyDown: (event) => calls.push(`parent-${event.key}`),
    });

    await userEvent.keyboard('{Escape}');
    expect(calls).toEqual(['child-Escape']);

    dialogByTitle('Child dialog')!
      .querySelector<HTMLButtonElement>('[aria-label="Child action"]')!
      .focus();
    await userEvent.keyboard('{Enter}');
    expect(calls).toEqual(['child-Escape', 'child-Enter', 'parent-Enter']);
  });
});

// --- Presence: closing class + exit keyframe, then unmount within the wedge guard -------------

describe('Dialog — presence', () => {
  it('stays mounted with .lyra-dialog--closing + lyra-overlay-out, then unmounts within 500ms', async () => {
    await openHarness();
    backdropDismiss(overlay()!);

    // Immediately after close: still mounted, closing class + the 03-02 exit keyframe applied.
    await vi.waitFor(() => expect(panel()?.classList.contains('lyra-dialog--closing')).toBe(true));
    const closingPanel = panel()!;
    expect(overlay()!.classList.contains('lyra-dialog-overlay--closing')).toBe(true);
    expect(getComputedStyle(closingPanel).animationName).toBe('lyra-overlay-out');

    // Wedge guard (Pitfall 7): the panel's own animationend (or the timeout) finalizes unmount.
    await vi.waitFor(() => expect(panel()).toBeNull(), { timeout: 500 });
  });
});

// --- Body scroll lock ------------------------------------------------------------------------

describe('Dialog — scroll lock', () => {
  it('locks body overflow with additive paddingRight compensation, restored on close', async () => {
    document.body.style.paddingRight = '17px';
    const existing = parseFloat(getComputedStyle(document.body).paddingRight);

    const { trigger } = await openHarness();
    expect(document.body.style.overflow).toBe('hidden');
    const delta = window.innerWidth - document.documentElement.clientWidth;
    const locked = parseFloat(getComputedStyle(document.body).paddingRight);
    expect(locked).toBeCloseTo(existing + delta, 1);

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(panel()).toBeNull(), { timeout: 500 });
    await vi.waitFor(() => expect(document.body.style.overflow).toBe(''));
    expect(document.body.style.paddingRight).toBe('17px');
    expect(document.activeElement).toBe(trigger);
    document.body.style.paddingRight = '';
  });
});

// --- Custom container ------------------------------------------------------------------------

describe('Dialog — custom container', () => {
  it('mounts inside the container (not directly under body), focuses, passes axe, empties on unmount', async () => {
    const host = document.createElement('div');
    host.setAttribute('data-testid', 'host');
    document.body.appendChild(host);
    try {
      const { trigger } = await openHarness({ container: host });
      // The overlay is inside the host, and NOT a direct child of document.body.
      const scoped = overlay(host)!;
      expect(scoped).not.toBeNull();
      expect(scoped.parentElement).toBe(host);
      expect([...document.body.children]).not.toContain(scoped);
      // Initial focus still landed inside the panel.
      expect(panel(host)!.contains(document.activeElement)).toBe(true);
      // axe scoped to the container.
      await expectNoAxeViolations(host);

      await userEvent.keyboard('{Escape}');
      await vi.waitFor(() => expect(panel(host)).toBeNull(), { timeout: 500 });
      expect(host.querySelector('.lyra-dialog-overlay')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    } finally {
      host.remove();
    }
  });
});

// --- Layout backstops ------------------------------------------------------------------------

describe('Dialog — layout backstops', () => {
  it('a body taller than the viewport keeps the panel within 440px and the page scroll-locked', async () => {
    await openHarness({
      children: (
        <div data-testid="tall" style={{ height: 3000 }}>
          Tall content
        </div>
      ),
    });
    await vi.waitFor(() => {
      expect(panel()!.getBoundingClientRect().width).toBeLessThanOrEqual(440);
    });
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('a long title wraps in the header while the × keeps its 44px touch target', async () => {
    await openHarness({ title: LONG_TITLE });
    // The additive a11y extension reserves a WCAG-sized target without letting the long title
    // collapse it. Measure inside waitFor so the entrance transform (scale) has settled — a
    // mid-animation rect reports the scaled-down box.
    await vi.waitFor(() => {
      const rect = closeBtn()!.getBoundingClientRect();
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });
    expect(panel()!.querySelector('.lyra-dialog__title')!.textContent).toBe(LONG_TITLE);
  });
});

// --- axe: light + dark, scanned at document.body (where the portal renders) ------------------

describe('Dialog — axe (light + dark)', () => {
  for (const theme of THEMES) {
    it(`zero axe violations in ${theme}`, async () => {
      setTheme(theme);
      await openHarness({
        footer: (
          <button type="button" data-testid="ok">
            Confirm
          </button>
        ),
      });
      await expectNoAxeViolations(document.body);
    });
  }
});

// --- ref forwarding (D-08) -------------------------------------------------------------------

describe('Dialog — ref', () => {
  it('forwards the ref to the panel div (role=dialog)', async () => {
    let node: HTMLDivElement | null = null;
    function RefHarness(): ReactNode {
      return (
        <Dialog
          open
          title="Ref"
          ref={(el) => {
            node = el;
          }}
        >
          Body
        </Dialog>
      );
    }
    await render(<RefHarness />);
    await vi.waitFor(() => expect(node).not.toBeNull());
    expect(node!.getAttribute('role')).toBe('dialog');
    expect(node!.classList.contains('lyra-dialog')).toBe(true);
  });
});
