import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Tooltip } from './index';
const themes = ['light', 'dark'] as const;
function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  await cleanup();
  setTheme('light');
});
describe('Tooltip', () => {
  describe('focused lifecycle isolation', () => {
    let previousLifecycle:
      | {
          blurredBeforeNextAction: boolean;
          focused: boolean;
          hovered: boolean;
          open: boolean;
        }
      | undefined;

    it('leaves an unhovered tooltip open while its trigger retains focus', async () => {
      const { container } = await render(
        <div>
          <button type="button">Before target</button>
          <Tooltip tip="Focused lifecycle">
            <button
              type="button"
              onBlur={() => {
                if (previousLifecycle) previousLifecycle.blurredBeforeNextAction = true;
              }}
            >
              Focused target
            </button>
          </Tooltip>
        </div>,
      );
      const root = container.querySelector<HTMLElement>('.lyra-tooltip')!;
      const [before, trigger] = container.querySelectorAll<HTMLButtonElement>('button');

      await userEvent.unhover(root);
      before!.focus();
      await userEvent.keyboard('{Tab}');
      previousLifecycle = {
        blurredBeforeNextAction: false,
        focused: document.activeElement === trigger,
        hovered: root.matches(':hover'),
        open: root.dataset.state === 'open',
      };

      expect(previousLifecycle).toEqual({
        blurredBeforeNextAction: false,
        focused: true,
        hovered: false,
        open: true,
      });
    });

    it('dismisses the focused lifecycle before the next case acts', () => {
      expect(previousLifecycle).toEqual({
        blurredBeforeNextAction: true,
        focused: true,
        hovered: false,
        open: true,
      });
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
