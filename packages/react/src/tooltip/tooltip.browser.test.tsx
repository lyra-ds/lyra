import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { act as reactAct } from 'react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Tooltip } from './index';
// The browser renderer enables React's act environment only for its own render/cleanup calls.
async function act(callback: () => void | Promise<void>): Promise<void> {
  const previous = Reflect.get(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
  try {
    await reactAct(callback);
  } finally {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', previous);
  }
}
const themes = ['light', 'dark'] as const;
function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  vi.useRealTimers();
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  await cleanup();
  setTheme('light');
});
describe('Tooltip', () => {
  it('uses exact cold-open and leave-grace boundaries', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { container } = await render(
      <Tooltip tip="Timing">
        <button type="button">Target</button>
      </Tooltip>,
    );
    const root = container.querySelector<HTMLElement>('.lyra-tooltip')!;

    await act(async () => {
      root.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });
    expect(root.dataset.state).toBe('closed');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(499);
    });
    expect(root.dataset.state).toBe('closed');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(root.dataset.state).toBe('open');

    await act(async () => {
      root.dispatchEvent(
        new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }),
      );
      await vi.advanceTimersByTimeAsync(99);
    });
    expect(root.dataset.state).toBe('open');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(root.dataset.state).toBe('closed');
  });

  it('shares document warmth and expires exactly after 300ms', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { container } = await render(
      <>
        <Tooltip tip="First">
          <button type="button">First</button>
        </Tooltip>
        <Tooltip tip="Second">
          <button type="button">Second</button>
        </Tooltip>
      </>,
    );
    const [first, second] = Array.from(container.querySelectorAll<HTMLElement>('.lyra-tooltip'));
    await act(async () => {
      first!.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(first!.dataset.state).toBe('open');
    await act(async () => {
      first!.dispatchEvent(
        new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }),
      );
      await vi.advanceTimersByTimeAsync(100);
    });

    await act(async () => {
      second!.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });
    expect(second!.dataset.state).toBe('open');
    await act(async () => {
      second!.dispatchEvent(
        new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }),
      );
      await vi.advanceTimersByTimeAsync(100);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });

    await act(async () => {
      first!.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });
    expect(first!.dataset.state).toBe('open');
    await act(async () => {
      first!.dispatchEvent(
        new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }),
      );
      await vi.advanceTimersByTimeAsync(100);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await act(async () => {
      second!.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });
    expect(second!.dataset.state).toBe('closed');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(second!.dataset.state).toBe('open');
  });

  it('lets a focused owner survive pointer leave and dismisses only the newest visible owner', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const firstDismiss = vi.fn();
    const secondDismiss = vi.fn();
    const { container } = await render(
      <>
        <Tooltip tip="First" onKeyDown={firstDismiss}>
          <button type="button">First</button>
        </Tooltip>
        <Tooltip tip="Second" onKeyDown={secondDismiss}>
          <button type="button">Second</button>
        </Tooltip>
      </>,
    );
    const [first, second] = Array.from(container.querySelectorAll<HTMLElement>('.lyra-tooltip'));
    const [firstButton, secondButton] = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button'),
    );

    await act(async () => {
      firstButton!.focus();
      first!.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      first!.dispatchEvent(
        new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }),
      );
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(first!.dataset.state).toBe('open');

    await act(async () => {
      first!.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      secondButton!.focus();
    });
    expect(second!.dataset.state).toBe('open');
    await act(async () => {
      secondButton!.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }),
      );
    });
    expect(second!.dataset.state).toBe('closed');
    expect(first!.dataset.state).toBe('open');
    expect(secondDismiss).toHaveBeenCalledOnce();
    expect(firstDismiss).not.toHaveBeenCalled();
  });

  it('contains focused Escape for React ancestors only when it dismisses a Tooltip', async () => {
    let parentEscapes = 0;
    const { container } = await render(
      <dialog
        open
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !event.defaultPrevented) parentEscapes += 1;
        }}
      >
        <Tooltip tip="Help">
          <button type="button">Info</button>
        </Tooltip>
      </dialog>,
    );
    const root = container.querySelector<HTMLElement>('.lyra-tooltip')!;
    const trigger = container.querySelector<HTMLButtonElement>('button')!;

    await act(async () => {
      trigger.focus();
    });
    await userEvent.keyboard('{Escape}');
    expect(root.dataset.state).toBe('closed');
    expect(parentEscapes).toBe(0);

    await userEvent.keyboard('{Escape}');
    expect(parentEscapes).toBe(1);
  });

  it('opens a replacement trigger on fresh focus after the original is removed', async () => {
    const { container, rerender } = await render(
      <Tooltip tip="Replacement focus">
        <button type="button">Original</button>
      </Tooltip>,
    );
    const root = container.querySelector<HTMLElement>('.lyra-tooltip')!;
    const original = container.querySelector<HTMLButtonElement>('button')!;

    await act(async () => {
      original.focus();
    });
    expect(root.dataset.state).toBe('open');
    await rerender(<Tooltip tip="Replacement focus">{null}</Tooltip>);
    expect(root.dataset.state).toBe('closed');
    await rerender(
      <Tooltip tip="Replacement focus">
        <button type="button">Replacement</button>
      </Tooltip>,
    );
    const replacement = container.querySelector<HTMLButtonElement>('button')!;

    await act(async () => {
      replacement.focus();
    });
    expect(root.dataset.state).toBe('open');
  });

  it('expires warmth after a focused trigger is removed from a retained Tooltip', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const fixture = (showFirst: boolean) => (
      <>
        <Tooltip tip="First">{showFirst ? <button type="button">First</button> : null}</Tooltip>
        <Tooltip tip="Second">
          <button type="button">Second</button>
        </Tooltip>
      </>
    );
    const { container, rerender } = await render(fixture(true));
    const [first, second] = Array.from(container.querySelectorAll<HTMLElement>('.lyra-tooltip'));
    // Native reflow can leave :hover on the first root after rendering, which
    // would make the focused trigger also hovered and suppress expiry.
    await userEvent.hover(document.body);
    expect(first!.matches(':hover')).toBe(false);
    expect(second!.matches(':hover')).toBe(false);
    await act(async () => {
      container.querySelector<HTMLButtonElement>('button')!.focus();
    });
    expect(first!.dataset.state).toBe('open');

    await rerender(fixture(false));
    expect(first!.dataset.state).toBe('closed');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
      second!.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });
    expect(second!.dataset.state).toBe('closed');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(499);
    });
    expect(second!.dataset.state).toBe('closed');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(second!.dataset.state).toBe('open');
  });

  describe('focused lifecycle isolation', () => {
    it('dismisses its focused lifecycle when the trigger loses focus', async () => {
      let blurred = false;
      const { container } = await render(
        <div>
          <button type="button">Before target</button>
          <Tooltip tip="Focused lifecycle">
            <button
              type="button"
              // WebKit skips implicit native-button Tab stops, so this target
              // needs an explicit tabIndex for the real Tab gesture below to
              // reach it on every engine.
              tabIndex={0}
              onBlur={() => {
                blurred = true;
              }}
            >
              Focused target
            </button>
          </Tooltip>
          <button type="button">After target</button>
        </div>,
      );
      const root = container.querySelector<HTMLElement>('.lyra-tooltip')!;
      const [before, trigger, after] = container.querySelectorAll<HTMLButtonElement>('button');

      await userEvent.unhover(root);
      before!.focus();
      await userEvent.keyboard('{Tab}');

      expect(document.activeElement).toBe(trigger);
      expect(root.matches(':hover')).toBe(false);
      expect(root.dataset.state).toBe('open');

      after!.focus();

      expect(blurred).toBe(true);
      expect(document.activeElement).toBe(after);
      await vi.waitFor(() => expect(root.dataset.state).toBe('closed'));
    });
  });

  for (const theme of themes)
    it(`wires its target and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <Tooltip tip="More information">
            <button type="button">Info</button>
          </Tooltip>,
        );
        const root = container.querySelector('.lyra-tooltip')!;
        const trigger = container.querySelector('button')!;
        const tooltip = container.querySelector('[role=tooltip]')!;
        // The placement modifier depends on the room around the target, and a browser-mode fixture
        // renders at the top of a short viewport — so the tip legitimately flips to `--bottom` on a
        // CI runner and not on a tall local window. The exact-class contract still holds, minus
        // that one environment-dependent modifier; the dedicated placement tests below assert it.
        expect(root.className).toMatch(/^lyra-tooltip( lyra-tooltip--(bottom|left|right))?$/);
        expect(root.getAttribute('data-tip')).toBe('More information');
        expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
        expect(spy).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
      } finally {
        spy.mockRestore();
      }
    });
  it('hides the bubble on Escape, not just its state, while the pointer stays on the target', async () => {
    // Regression: the stylesheet drove visibility purely from :hover/:focus-within, so Escape
    // flipped `data-state` and the bubble stayed on screen — the opposite of WCAG 1.4.13.
    const { container } = await render(
      <Tooltip tip="Help">
        <button type="button">Info</button>
      </Tooltip>,
    );
    const root = container.querySelector<HTMLElement>('.lyra-tooltip')!;
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    trigger.focus();
    await vi.waitFor(() => {
      expect(getComputedStyle(root, '::after').opacity).toBe('1');
    });
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => {
      expect(getComputedStyle(root, '::after').opacity).toBe('0');
    });
    // Focus is still inside, so :focus-within is still true: the closed state is what hides it.
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps the requested side when it fits and flips when it would be clipped', async () => {
    const { container } = await render(
      <div style={{ position: 'fixed', top: 4, left: 200 }}>
        <Tooltip tip="Would be clipped above">
          <button type="button">Top edge</button>
        </Tooltip>
      </div>,
    );
    const root = container.querySelector<HTMLElement>('.lyra-tooltip')!;
    const trigger = container.querySelector<HTMLButtonElement>('button')!;

    expect(root.className).toBe('lyra-tooltip');
    trigger.focus();
    await vi.waitFor(() => {
      expect(root.className).toBe('lyra-tooltip lyra-tooltip--bottom');
    });

    // The bubble is a pseudo-element, so prove it really sits below the target now.
    const box = trigger.getBoundingClientRect();
    expect(box.top).toBeLessThan(parseFloat(getComputedStyle(root, '::after').height) + 6);
  });

  it('honours an explicit placement that fits', async () => {
    const { container } = await render(
      <div style={{ position: 'fixed', top: '45vh', left: '40vw' }}>
        <Tooltip tip="Side" placement="right">
          <button type="button">Middle</button>
        </Tooltip>
      </div>,
    );
    const root = container.querySelector<HTMLElement>('.lyra-tooltip')!;
    container.querySelector<HTMLButtonElement>('button')!.focus();
    await vi.waitFor(() => {
      expect(root.className).toBe('lyra-tooltip lyra-tooltip--right');
    });
  });

  it('opens on focus and closes on Escape without moving focus', async () => {
    const { container } = await render(
      <Tooltip tip="Help">
        <button type="button">Info</button>
      </Tooltip>,
    );
    const root = container.querySelector<HTMLElement>('.lyra-tooltip')!;
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    trigger.focus();
    await vi.waitFor(() => {
      expect(root.getAttribute('data-state')).toBe('open');
    });
    await userEvent.keyboard('{Escape}');
    expect(root.getAttribute('data-state')).toBe('closed');
    expect(document.activeElement).toBe(trigger);
  });
});
