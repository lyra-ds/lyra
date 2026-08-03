import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Popover } from './index';
import { Button } from '../button';

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
        expect(
          (await axe.run(container)).violations.filter((item) => item.id !== 'color-contrast'),
        ).toEqual([]);
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('closes on a document mousedown outside the anchor', async () => {
    const { container } = await render(
      <>
        <Popover trigger={<button type="button">Options</button>}>Panel content</Popover>
        <button type="button">Outside</button>
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
  });

  it('closes on Escape and restores focus to the fused trigger', async () => {
    const { container } = await render(
      <Popover trigger={<button type="button">Options</button>}>Panel content</Popover>,
    );
    const trigger = container.querySelector<HTMLButtonElement>('button')!;
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
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
