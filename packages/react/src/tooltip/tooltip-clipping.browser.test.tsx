import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { createRef, StrictMode } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Tooltip } from './index';
import '@lyra-ds/styles/styles.css';

afterEach(async () => {
  vi.useRealTimers();
  await cleanup();
});

function expectBounded(surface: Element): void {
  const view = surface.ownerDocument.defaultView!;
  const viewport = view.visualViewport;
  const box = surface.getBoundingClientRect();
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);
  expect(box.left).toBeGreaterThanOrEqual(viewport?.offsetLeft ?? 0);
  expect(box.top).toBeGreaterThanOrEqual(viewport?.offsetTop ?? 0);
  expect(box.right).toBeLessThanOrEqual(
    (viewport?.offsetLeft ?? 0) + (viewport?.width ?? view.innerWidth),
  );
  expect(box.bottom).toBeLessThanOrEqual(
    (viewport?.offsetTop ?? 0) + (viewport?.height ?? view.innerHeight),
  );
  expect(
    surface.ownerDocument.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2),
  ).toBe(surface);
}

function expectClosedDescription(description: Element, previousBox: DOMRect): void {
  expect(description.parentElement?.getAttribute('data-state')).toBe('closed');
  expect(description.hasAttribute('hidden')).toBe(true);
  expect(description.getClientRects()).toHaveLength(0);
  expect(description.parentElement?.querySelector('.lyra-tooltip__surface')).toBeNull();
  expect(description.matches(':popover-open')).toBe(false);
  expect(
    description.ownerDocument.elementFromPoint(
      previousBox.left + previousBox.width / 2,
      previousBox.top + previousBox.height / 2,
    ),
  ).not.toBe(description);
}

describe('Tooltip clipping escape', () => {
  for (const placement of ['top', 'bottom', 'left', 'right'] as const) {
    it(`escapes a real scroll clip with ${placement} preference and stays reachable`, async () => {
      const ref = createRef<HTMLSpanElement>();
      const screen = await render(
        <div
          style={{
            position: 'fixed',
            left: '40vw',
            top: '40vh',
            width: 80,
            height: 30,
            overflow: 'auto',
            transform: 'translateZ(0)',
          }}
        >
          <Tooltip ref={ref} escapeClipping tip="Workspace settings" placement={placement}>
            <button type="button" aria-describedby="existing">
              Settings
            </button>
          </Tooltip>
          <div style={{ height: 300 }} />
        </div>,
      );
      const trigger = screen.getByRole('button', { name: 'Settings' });
      trigger.element().focus();
      await expect.element(screen.getByRole('tooltip')).toBeVisible();
      const surface = screen.getByRole('tooltip').element();
      await vi.waitFor(() => {
        expect(surface.matches(':popover-open')).toBe(true);
        expectBounded(surface);
      });
      expect(ref.current?.tagName).toBe('SPAN');
      expect(ref.current?.firstElementChild).toBe(trigger.element());
      expect(trigger.element().getAttribute('aria-describedby')).toBe(`existing ${surface.id}`);
      const clip = ref.current!.parentElement!.getBoundingClientRect();
      const box = surface.getBoundingClientRect();
      expect(
        box.left < clip.left ||
          box.right > clip.right ||
          box.top < clip.top ||
          box.bottom > clip.bottom,
      ).toBe(true);
      expect(getComputedStyle(ref.current!, '::after').content).toBe('none');
      ref.current!.parentElement!.scrollTop = 10;
      await vi.waitFor(() => {
        expect(surface.getBoundingClientRect().top).toBeCloseTo(box.top - 10, 0);
        expectBounded(surface);
      });
      await userEvent.keyboard('{Escape}');
      expect(document.activeElement).toBe(trigger.element());
      expect(surface.matches(':popover-open')).toBe(false);
      const description = screen.getByRole('tooltip', { includeHidden: true });
      await expect.element(description).not.toBeVisible();
      expectClosedDescription(description.element(), box);
    });
  }

  for (const [placement, opposite, edge] of [
    ['top', 'bottom', { top: 0, left: '45vw' }],
    ['bottom', 'top', { bottom: 0, left: '45vw' }],
    ['left', 'right', { left: 0, top: '45vh' }],
    ['right', 'left', { right: 0, top: '45vh' }],
  ] satisfies ['top' | 'bottom' | 'left' | 'right', string, CSSProperties][]) {
    it(`flips ${placement} away from the viewport edge`, async () => {
      const screen = await render(
        <Tooltip
          escapeClipping
          tip="Bounded edge hint"
          placement={placement}
          style={{ position: 'fixed', ...edge }}
        >
          <button type="button">Edge</button>
        </Tooltip>,
      );
      const trigger = screen.getByRole('button').element();
      trigger.focus();
      await expect.element(screen.getByRole('tooltip')).toBeVisible();
      await vi.waitFor(() => {
        expect(trigger.parentElement?.className).toBe(
          `lyra-tooltip lyra-tooltip--escape${opposite === 'top' ? '' : ` lyra-tooltip--${opposite}`}`,
        );
        expectBounded(screen.getByRole('tooltip').element());
      });
    });
  }

  it('wraps long text, flips at an edge, and follows live scoped theme, font, direction and geometry', async () => {
    const screen = await render(
      <div
        data-theme="light"
        style={{ position: 'fixed', top: 0, right: 0, width: 80, height: 30, overflow: 'hidden' }}
      >
        <Tooltip escapeClipping tip={'A long workspace label '.repeat(20)}>
          <button type="button">Details</button>
        </Tooltip>
      </div>,
    );
    const trigger = screen.getByRole('button', { name: 'Details' }).element();
    trigger.focus();
    await expect.element(screen.getByRole('tooltip')).toBeVisible();
    const surface = screen.getByRole('tooltip').element();
    const root = trigger.parentElement!;
    const scope = root.parentElement!;
    await vi.waitFor(() => {
      expectBounded(surface);
      expect(root.classList.contains('lyra-tooltip--bottom')).toBe(true);
    });
    const initial = getComputedStyle(surface).backgroundColor;
    screen.container.dataset.theme = 'dark';
    expect(getComputedStyle(surface).backgroundColor).toBe(initial);
    scope.dataset.theme = 'dark';
    scope.dir = 'rtl';
    scope.style.setProperty('--night-700', 'rgb(32, 48, 64)');
    scope.dataset.brand = 'workspace';
    scope.style.setProperty('--brand', 'rgb(20, 100, 80)');
    scope.style.setProperty('--border-strong', 'var(--brand)');
    scope.style.setProperty('--brand-font', 'monospace');
    scope.style.setProperty('--text-xs', '18px');
    scope.style.top = '50vh';
    await vi.waitFor(() => {
      const computed = getComputedStyle(surface);
      expect(computed.backgroundColor).not.toBe(initial);
      expect(computed.backgroundColor).toBe('rgb(32, 48, 64)');
      expect(computed.fontFamily).toBe('monospace');
      expect(computed.borderTopColor).toBe('rgb(20, 100, 80)');
      expect(computed.fontSize).toBe('18px');
      expect(computed.direction).toBe('rtl');
      expectBounded(surface);
      expect(surface.getBoundingClientRect().bottom).toBeGreaterThan(100);
    });
    scope.style.setProperty('--brand', 'rgb(90, 40, 130)');
    await vi.waitFor(() =>
      expect(getComputedStyle(surface).borderTopColor).toBe('rgb(90, 40, 130)'),
    );
    scope.dataset.theme = 'light';
    await vi.waitFor(() => expect(getComputedStyle(surface).backgroundColor).toBe(initial));
  });

  it('retains actual pointer transit and lets Escape release the surface', async () => {
    const screen = await render(
      <div
        style={{
          position: 'fixed',
          left: '30vw',
          top: '40vh',
          width: 80,
          height: 30,
          overflow: 'hidden',
        }}
      >
        <Tooltip escapeClipping placement="right" tip="Pointer destination">
          <button type="button">Hover</button>
        </Tooltip>
      </div>,
    );
    await screen.getByRole('button', { name: 'Hover' }).hover();
    await expect.element(screen.getByRole('tooltip')).toBeVisible();
    const surface = screen.getByRole('tooltip').element();
    await screen.getByRole('tooltip').hover();
    // Advance only the existing leave grace while the real pointer is over the hint.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await vi.advanceTimersByTimeAsync(101);
    expect(surface.matches(':popover-open')).toBe(true);
    vi.useRealTimers();
    await userEvent.keyboard('{Escape}');
    expect(surface.matches(':popover-open')).toBe(false);
    expect(document.activeElement).not.toBe(surface);
  });

  it.each(['button', 'link'] as const)(
    'preserves real %s activation when a wide preferred-side hint needs another side',
    async (kind) => {
      const originalViewport = { width: window.innerWidth, height: window.innerHeight };
      const activate = vi.fn();
      try {
        await page.viewport(390, 844);
        const screen = await render(
          <div
            style={{
              position: 'fixed',
              left: 60,
              top: 80,
              width: 80,
              height: 80,
              overflow: 'auto',
            }}
          >
            <Tooltip
              escapeClipping
              placement="right"
              tip="Open projects for everyone in the current workspace"
            >
              {kind === 'button' ? (
                <button type="button" tabIndex={0} onClick={activate}>
                  Projects
                </button>
              ) : (
                <a
                  href="/projects"
                  onClick={(event) => {
                    event.preventDefault();
                    activate();
                  }}
                >
                  Projects
                </a>
              )}
            </Tooltip>
          </div>,
        );
        const target = screen.getByRole(kind, { name: 'Projects' });
        await target.click();
        expect(activate).toHaveBeenCalledOnce();
        target.element().focus();
        await expect.element(screen.getByRole('tooltip')).toBeVisible();
        await vi.waitFor(() => {
          const surface = screen.getByRole('tooltip').element();
          expectBounded(surface);
          const box = target.element().getBoundingClientRect();
          const hint = surface.getBoundingClientRect();
          expect(
            hint.right <= box.left ||
              hint.left >= box.right ||
              hint.bottom <= box.top ||
              hint.top >= box.bottom,
          ).toBe(true);
          expect(
            target
              .element()
              .contains(
                document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2),
              ),
          ).toBe(true);
        });
        await target.click();
        expect(activate).toHaveBeenCalledTimes(2);
      } finally {
        await page.viewport(originalViewport.width, originalViewport.height);
      }
    },
  );

  it.each(['right', 'left'] as const)(
    'keeps adjacent navigation reachable while a wide %s-preferred hint is open',
    async (placement) => {
      const originalViewport = { width: window.innerWidth, height: window.innerHeight };
      const activate = vi.fn();
      try {
        await page.viewport(390, 844);
        const screen = await render(
          <div
            style={{
              position: 'fixed',
              [placement === 'right' ? 'left' : 'right']: 83,
              top: 80,
              display: 'flex',
              flexDirection: 'column',
              width: 44,
              height: 88,
              overflow: 'hidden',
            }}
          >
            <Tooltip
              escapeClipping
              placement={placement}
              tip="Open overview for everyone in the current workspace"
            >
              <button type="button" style={{ width: 44, height: 44 }}>
                Overview
              </button>
            </Tooltip>
            <button type="button" style={{ width: 44, height: 44 }} onClick={activate}>
              Projects
            </button>
          </div>,
        );
        screen.getByRole('button', { name: 'Overview' }).element().focus();
        await expect.element(screen.getByRole('tooltip')).toBeVisible();
        const next = screen.getByRole('button', { name: 'Projects' });
        await vi.waitFor(() => {
          expectBounded(screen.getByRole('tooltip').element());
          const box = next.element().getBoundingClientRect();
          expect(
            document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2),
          ).toBe(next.element());
        });
        await next.click();
        expect(activate).toHaveBeenCalledOnce();
      } finally {
        await page.viewport(originalViewport.width, originalViewport.height);
      }
    },
  );

  it('keeps an actually overflowing hint out of Tab order and preserves focus on Escape', async () => {
    const originalViewport = { width: window.innerWidth, height: window.innerHeight };
    try {
      const screen = await render(
        <div style={{ position: 'fixed', top: 0, left: 0 }}>
          <Tooltip escapeClipping tip={'Open overview for everyone in this workspace. '.repeat(8)}>
            <button type="button" tabIndex={0}>
              Overview
            </button>
          </Tooltip>
          <button type="button" tabIndex={0}>
            Next control
          </button>
        </div>,
      );
      const trigger = screen.getByRole('button', { name: 'Overview' }).element();
      const next = screen.getByRole('button', { name: 'Next control' }).element();
      trigger.focus();
      await expect.element(screen.getByRole('tooltip')).toBeVisible();
      await page.viewport(160, 70);
      const surface = screen.getByRole('tooltip').element();
      await vi.waitFor(() => {
        expectBounded(surface);
        expect(surface.scrollHeight).toBeGreaterThan(surface.clientHeight);
        expect(surface.getBoundingClientRect().bottom).toBe(62);
        expect(surface.getBoundingClientRect().top).toBeGreaterThan(
          trigger.getBoundingClientRect().bottom,
        );
        expect(getComputedStyle(surface).overflowY).toBe('auto');
      });
      expect(document.activeElement).toBe(trigger);
      surface.scrollTop = surface.scrollHeight;
      expect(surface.scrollTop).toBeGreaterThan(0);
      const box = surface.getBoundingClientRect();
      await userEvent.tab();
      expect(document.activeElement).toBe(next);
      const description = screen.getByRole('tooltip', { includeHidden: true });
      await expect.element(description).not.toBeVisible();
      expectClosedDescription(description.element(), box);
      await userEvent.keyboard('{Escape}');
      expect(document.activeElement).toBe(next);

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(trigger);
      await expect.element(screen.getByRole('tooltip')).toBeVisible();
      await vi.waitFor(() => {
        const reopened = screen.getByRole('tooltip').element();
        expectBounded(reopened);
        expect(reopened.scrollHeight).toBeGreaterThan(reopened.clientHeight);
      });
      await userEvent.keyboard('{Escape}');
      expect(document.activeElement).toBe(trigger);
      await expect.element(description).not.toBeVisible();
      expectClosedDescription(description.element(), box);
      await userEvent.tab();
      expect(document.activeElement).toBe(next);
    } finally {
      await page.viewport(originalViewport.width, originalViewport.height);
    }
  });

  it('keeps clipping escape and Escape ownership inside each owner document', async () => {
    const screen = await render(
      <>
        <Tooltip escapeClipping tip="Outer hint">
          <button type="button">Outer</button>
        </Tooltip>
        <iframe title="Other document" style={{ display: 'block', width: 280, height: 180 }} />
      </>,
    );
    const frame = screen.container.querySelector('iframe')!;
    const frameDocument = frame.contentDocument!;
    for (const style of document.querySelectorAll('style, link[rel="stylesheet"]')) {
      frameDocument.head.append(style.cloneNode(true));
    }
    const innerRef = createRef<HTMLSpanElement>();
    const inner = await render(
      createPortal(
        <Tooltip
          ref={innerRef}
          escapeClipping
          tip="A hint bounded by the smaller document"
          placement="right"
          style={{ position: 'fixed', right: 0, top: 0 }}
        >
          <button type="button">Inner</button>
        </Tooltip>,
        frameDocument.body,
      ),
    );
    const outerTarget = screen.getByRole('button', { name: 'Outer' });
    await outerTarget.hover();
    const outerTop = outerTarget.element().getBoundingClientRect().top;
    await expect.element(screen.getByRole('tooltip')).toBeVisible();
    frameDocument.querySelector('button')!.focus();
    await vi.waitFor(() => {
      const surface = frameDocument.querySelector('[role="tooltip"]')!;
      expect(surface.matches(':popover-open')).toBe(true);
      expectBounded(surface);
      expect(surface.ownerDocument).toBe(frameDocument);
    });
    frame.style.width = '160px';
    frame.style.height = '100px';
    await vi.waitFor(() => {
      const surface = frameDocument.querySelector('[role="tooltip"]')!;
      expectBounded(surface);
      expect(surface.getBoundingClientRect().width).toBeLessThanOrEqual(144);
      expect(outerTarget.element().getBoundingClientRect().top).toBe(outerTop);
      expect(outerTarget.element().matches(':hover')).toBe(true);
    });
    frameDocument.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await vi.waitFor(() => expect(innerRef.current?.dataset.state).toBe('closed'));
    await expect.element(screen.getByRole('tooltip')).toBeVisible();
    const outerBox = screen.getByRole('tooltip').element().getBoundingClientRect();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    const description = screen.getByRole('tooltip', { includeHidden: true });
    await expect.element(description).not.toBeVisible();
    expectClosedDescription(description.element(), outerBox);
    await inner.unmount();
    expect(frameDocument.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('preserves child handlers and cancellation, and cancels a stale pending tip', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const childFocus = vi.fn();
    const click = vi.fn((event: ReactMouseEvent<HTMLAnchorElement>) => event.preventDefault());
    const fixture = (tip: string, cancel = false) => (
      <Tooltip
        escapeClipping
        tip={tip}
        onFocus={(event) => {
          if (cancel) event.preventDefault();
        }}
      >
        <a href="/settings" onClick={click} onFocus={childFocus} aria-describedby="existing">
          Settings
        </a>
      </Tooltip>
    );
    const screen = await render(fixture('First', true));
    const link = screen.getByRole('link').element();
    link.focus();
    expect(childFocus).toHaveBeenCalledOnce();
    expect(link.parentElement?.dataset.state).toBe('closed');
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(click).toHaveBeenCalledOnce();
    link.blur();
    await screen.rerender(fixture('First'));
    link.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(499);
    expect(link.parentElement?.dataset.state).toBe('closed');
    await screen.rerender(fixture('Replacement'));
    await vi.advanceTimersByTimeAsync(1);
    expect(link.parentElement?.dataset.state).toBe('closed');
    await screen.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cleans up StrictMode, changing tips, removed targets and unmount without replacing the ref target', async () => {
    const ref = createRef<HTMLSpanElement>();
    const fixture = (tip: string, show = true) => (
      <StrictMode>
        <Tooltip ref={ref} escapeClipping tip={tip}>
          {show ? <button type="button">Target</button> : null}
        </Tooltip>
      </StrictMode>
    );
    const screen = await render(fixture('First'));
    // This fixture exercises focus ownership; a pointer left by another test can reopen a warm tip.
    await userEvent.unhover(ref.current!);
    expect(ref.current!.matches(':hover')).toBe(false);
    screen.getByRole('button').element().focus();
    await expect.element(screen.getByRole('tooltip')).toBeVisible();
    const first = screen.getByRole('tooltip').element();
    const firstBox = first.getBoundingClientRect();
    await screen.rerender(fixture('Second'));
    expect(first.matches(':popover-open')).toBe(false);
    const description = screen.getByRole('tooltip', { includeHidden: true });
    await expect.element(description).not.toBeVisible();
    expectClosedDescription(description.element(), firstBox);
    screen.getByRole('button').element().blur();
    screen.getByRole('button').element().focus();
    await expect.element(screen.getByRole('tooltip')).toBeVisible();
    const second = screen.getByRole('tooltip').element();
    await screen.rerender(fixture('Second', false));
    expect(second.matches(':popover-open')).toBe(false);
    await screen.rerender(fixture('Third'));
    screen.getByRole('button').element().focus();
    await expect.element(screen.getByRole('tooltip')).toBeVisible();
    const third = screen.getByRole('tooltip').element();
    await screen.unmount();
    expect(third.isConnected).toBe(false);
    expect(third.matches(':popover-open')).toBe(false);
    expect(ref.current).toBeNull();
  });
});
