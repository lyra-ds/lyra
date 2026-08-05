import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Accordion } from './index';

const themes = ['light', 'dark'] as const;
const items = [
  { id: 'a', title: 'First', content: 'One' },
  { id: 'b', title: 'Second', content: 'Two' },
];
function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});
describe('Accordion', () => {
  for (const theme of themes)
    it(`emits exact classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(<Accordion items={items} defaultOpen="a" />);
        expect(container.querySelector('.lyra-accordion')!.className).toBe('lyra-accordion');
        expect(container.querySelector('.lyra-acc__item')!.className).toBe(
          'lyra-acc__item lyra-acc__item--open',
        );
        expect(container.querySelector('.lyra-acc__trigger')!.className).toBe('lyra-acc__trigger');
        expect(spy).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
      } finally {
        spy.mockRestore();
      }
    });
  it('toggles every header with Space and supports multiple items', async () => {
    const { container } = await render(<Accordion items={items} multiple />);
    const buttons = container.querySelectorAll<HTMLButtonElement>('button');
    buttons[0].focus();
    await userEvent.keyboard(' ');
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
    buttons[1].focus();
    await userEvent.keyboard('{Enter}');
    expect(buttons[1].getAttribute('aria-expanded')).toBe('true');
    // Every panel stays mounted for the height transition, so open-ness is the item modifier.
    expect(container.querySelectorAll('.lyra-acc__item--open').length).toBe(2);
  });

  it('keeps a collapsed panel mounted but inert, hidden and out of the tab order', async () => {
    const { container } = await render(<Accordion items={items} defaultOpen="a" />);
    const wraps = container.querySelectorAll<HTMLElement>('.lyra-acc__panel-wrap');
    expect(wraps.length).toBe(2);

    const [openWrap, closedWrap] = wraps;
    expect(openWrap.hasAttribute('inert')).toBe(false);
    expect(closedWrap.hasAttribute('inert')).toBe(true);
    expect(getComputedStyle(closedWrap).visibility).toBe('hidden');
    expect(Math.round(closedWrap.getBoundingClientRect().height)).toBe(0);
    expect(openWrap.getBoundingClientRect().height).toBeGreaterThan(0);

    // A collapsed panel that is still in the DOM must not be reachable by assistive technology.
    await expectNoAxeViolations(container);
  });

  it('animates the panel height instead of snapping it open', async () => {
    const { container } = await render(<Accordion items={items} />);
    const wrap = container.querySelector<HTMLElement>('.lyra-acc__panel-wrap')!;
    expect(getComputedStyle(wrap).transitionProperty).toContain('grid-template-rows');

    const button = container.querySelector<HTMLButtonElement>('.lyra-acc__trigger')!;
    button.click();
    // Mid-transition the row is neither collapsed nor at its final height.
    await new Promise((resolve) => setTimeout(resolve, 40));
    const midHeight = wrap.getBoundingClientRect().height;
    await new Promise((resolve) => setTimeout(resolve, 400));
    const finalHeight = wrap.getBoundingClientRect().height;
    expect(finalHeight).toBeGreaterThan(0);
    expect(midHeight).toBeLessThan(finalHeight);
  });
});
