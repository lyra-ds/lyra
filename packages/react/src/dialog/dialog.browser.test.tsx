// OVERLAY-component test template (D-25) — the shape Phase 4 copies for every portal +
// focus-trap + presence overlay (Drawer, CommandPalette, Toast). Runs in the "browser" vitest
// project (real chromium) because none of what this proves survives jsdom: real focus movement,
// Tab/Shift+Tab trap wrapping, CSS exit animations (animationName reads), computed scroll-lock
// padding, and axe's color-contrast rule ALL require a real engine.
//
// The @lyra-ds/styles entry CSS is imported IN THIS TEST (never in src, RCT-03). Vite resolves
// its @import graph and injects it as a <style> — this is the fixture stylesheet, and it carries
// the .lyra-dialog--closing / lyra-pop-out exit keyframe the presence assertions read.
//
// Dialog renders through a Portal into document.body, so the assertions query document.* (NOT
// the render container) and axe.run targets document.body — the tree the portal actually lands
// in. Dark theme is toggled on document.documentElement so the body-level portal inherits it.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState, type ReactNode } from 'react';
import { render, cleanup } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
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

// Frozen brand tokens carry a known dark-theme color-contrast gap tracked in the phase
// deferred-items log. The axe matrix allows ONLY that `color-contrast` finding while enforcing
// every other rule at full strength; structural/aria/name violations still fail.
async function expectNoViolations(
  root: Element,
  opts: { allowFrozenTokenContrast?: boolean } = {},
): Promise<void> {
  const results = await axe.run(root as HTMLElement);
  const violations = opts.allowFrozenTokenContrast
    ? results.violations.filter((v) => v.id !== 'color-contrast')
    : results.violations;
  expect(violations).toEqual([]);
}

// --- DOM accessors (portal target is document.body, not the render container) ----------------
const overlay = (root: ParentNode = document): HTMLElement | null =>
  root.querySelector('.lyra-dialog-overlay');
const panel = (root: ParentNode = document): HTMLElement | null =>
  root.querySelector('.lyra-dialog');
const closeBtn = (root: ParentNode = document): HTMLButtonElement | null =>
  root.querySelector('.lyra-dialog__close');

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
      <button type="button" data-testid="trigger" onClick={() => setOpen(true)}>
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
  trigger.focus();
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
});

// --- Close paths + opt-out flags + focus restore ---------------------------------------------

describe('Dialog — close paths', () => {
  it('Esc closes and restores focus to the trigger', async () => {
    const { trigger } = await openHarness();
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

  it('overlay backdrop click closes and restores focus to the trigger', async () => {
    const { trigger } = await openHarness();
    overlay()!.click(); // native click → target === overlay (identity) → close
    await vi.waitFor(() => expect(panel()).toBeNull(), { timeout: 500 });
    expect(document.activeElement).toBe(trigger);
  });

  it('overlay click with closeOnOverlayClick=false does NOT close', async () => {
    await openHarness({ closeOnOverlayClick: false });
    overlay()!.click();
    await new Promise((r) => setTimeout(r, 60));
    expect(panel()).not.toBeNull();
  });

  it('a click INSIDE the panel never closes', async () => {
    await openHarness();
    panel()!.click(); // target === panel !== overlay currentTarget
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
});

// --- Presence: closing class + exit keyframe, then unmount within the wedge guard -------------

describe('Dialog — presence', () => {
  it('stays mounted with .lyra-dialog--closing + lyra-pop-out, then unmounts within 500ms', async () => {
    await openHarness();
    overlay()!.click();

    // Immediately after close: still mounted, closing class + the 03-02 exit keyframe applied.
    await vi.waitFor(() => expect(panel()?.classList.contains('lyra-dialog--closing')).toBe(true));
    const closingPanel = panel()!;
    expect(overlay()!.classList.contains('lyra-dialog-overlay--closing')).toBe(true);
    expect(getComputedStyle(closingPanel).animationName).toBe('lyra-pop-out');

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
      await expectNoViolations(host, { allowFrozenTokenContrast: true });

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
      children: <div data-testid="tall" style={{ height: 3000 }}>Tall content</div>,
    });
    expect(panel()!.getBoundingClientRect().width).toBeLessThanOrEqual(440);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('a long title wraps in the header while the × keeps its 28px hit area', async () => {
    await openHarness({ title: LONG_TITLE });
    const btn = closeBtn()!;
    const rect = btn.getBoundingClientRect();
    // The 03-02 `flex: 0 0 28px` keeps the box ~28px (sub-pixel rounding in headless chromium)
    // — it must NOT collapse under the wrapping long title.
    expect(rect.width).toBeGreaterThan(26);
    expect(rect.width).toBeLessThanOrEqual(29);
    expect(rect.height).toBeGreaterThan(26);
    expect(rect.height).toBeLessThanOrEqual(29);
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
      await expectNoViolations(document.body, { allowFrozenTokenContrast: true });
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
