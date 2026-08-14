import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Tabs } from './index';

const themes = ['light', 'dark'] as const;
const items = [
  { id: 'one', label: 'One', count: 2 },
  { id: 'two', label: 'Two' },
  { id: 'three', label: 'Three' },
];

type RGB = readonly [number, number, number];

function parseRgb(color: string): RGB {
  const match = color.match(/^rgba?\((.*)\)$/);
  const channels = match?.[1].match(/\d+(?:\.\d+)?/g)?.map(Number);
  if (
    !channels ||
    (channels.length !== 3 && (channels.length !== 4 || channels[3] !== 1)) ||
    channels.slice(0, 3).some((channel) => !Number.isInteger(channel) || channel < 0 || channel > 255)
  ) {
    throw new Error(`Expected a resolved opaque rgb color, received ${color}`);
  }
  return [channels[0], channels[1], channels[2]];
}

function relativeLuminance([red, green, blue]: RGB): number {
  const channels = [red, green, blue].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(parseRgb(foreground));
  const backgroundLuminance = relativeLuminance(parseRgb(background));
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('Tabs', () => {
  it('renders the dark active line tab at WCAG AA contrast on a card surface at rest and hover', async () => {
    setTheme('dark');
    const { container } = await render(
      <div style={{ background: 'var(--surface-card)' }}>
        <Tabs items={items} active="one" variant="line" onChange={() => {}} />
      </div>,
    );
    const surface = container.querySelector<HTMLElement>('div')!;
    const activeTab = container.querySelector<HTMLElement>('.lyra-tab--active')!;
    const foreground = getComputedStyle(activeTab).color;
    const background = getComputedStyle(surface).backgroundColor;

    expect(foreground).toBe('rgb(165, 167, 238)');
    expect(background).toBe('rgb(18, 20, 48)');
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);

    await userEvent.hover(activeTab);
    activeTab.getAnimations().forEach((animation) => animation.finish());
    const hoverForeground = getComputedStyle(activeTab).color;

    expect(hoverForeground).toBe('rgb(165, 167, 238)');
    expect(contrastRatio(hoverForeground, background)).toBeGreaterThanOrEqual(4.5);

    await userEvent.unhover(activeTab);
    activeTab.getAnimations().forEach((animation) => animation.finish());
  });

  for (const theme of themes)
    it(`emits line and pills classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <Tabs items={items} active="one" variant="pills" onChange={() => {}} />,
        );
        expect(container.querySelector('[role=tablist]')!.className).toBe(
          'lyra-tabs lyra-tabs--pills',
        );
        expect(container.querySelector('[role=tab]')!.className).toBe('lyra-tab lyra-tab--active');
        expect(container.querySelector('.lyra-tab__count')!.className).toBe('lyra-tab__count');
        expect(spy).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
      } finally {
        spy.mockRestore();
      }
    });
  it('roves with automatic activation, wrap, Home and End', async () => {
    function Harness(): React.JSX.Element {
      const [active, setActive] = useState('one');
      return <Tabs items={items} active={active} onChange={setActive} />;
    }
    const { container } = await render(<Harness />);
    const tabs = container.querySelectorAll<HTMLButtonElement>('[role=tab]');
    tabs[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(tabs[2]);
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs[0]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(tabs[0]);
  });
});
