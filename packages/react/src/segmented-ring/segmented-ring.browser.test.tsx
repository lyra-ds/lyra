import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { SegmentedRing } from './index';

const THEMES = ['light', 'dark'] as const;
const SEGMENTS = [
  { value: 3, label: 'Completed', tone: 'success' as const },
  { value: 2, label: 'Scheduled', tone: 'accent' as const },
];

function setTheme(theme: (typeof THEMES)[number]): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('SegmentedRing', () => {
  it('has one accessible textual source while the SVG and legend remain hidden', async () => {
    const { container } = await render(
      <SegmentedRing centerLabel="Sessions" centerValue="5" segments={SEGMENTS} />,
    );

    const summary = container.querySelector('.lyra-visually-hidden');
    expect(summary).not.toBeNull();
    expect(summary!.textContent).toBe('Sessions 5 — 3 Completed, 2 Scheduled');
    expect(container.querySelectorAll('.lyra-visually-hidden')).toHaveLength(1);
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('.lyra-ring__wrap')!.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('.lyra-ring__legend')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('emits the sizing and stacking classes, and appends consumer classes last', async () => {
    const { container } = await render(
      <SegmentedRing size="md" stacked className="custom-ring" segments={SEGMENTS} />,
    );
    expect(container.firstElementChild!.className).toBe(
      'lyra-ring lyra-ring--md lyra-ring--stacked custom-ring',
    );
  });

  it('can omit the visual legend without removing the accessible summary', async () => {
    const { container } = await render(<SegmentedRing segments={SEGMENTS} showLegend={false} />);
    expect(container.querySelector('.lyra-ring__legend')).toBeNull();
    expect(container.querySelector('.lyra-visually-hidden')!.textContent).toBe(
      '3 Completed, 2 Scheduled',
    );
  });

  it('bounds a segment that exceeds its total to a full ring', async () => {
    const { container } = await render(
      <SegmentedRing total={3} segments={[{ value: 5, label: 'Completed' }]} />,
    );
    const arcs = container.querySelectorAll('svg circle:not(:first-child)');
    expect(arcs).toHaveLength(1);
    const dash = arcs[0]!.getAttribute('stroke-dasharray')!.split(' ').map(Number);
    expect(dash[0]).toBeGreaterThan(0);
    expect(dash[1]).toBe(0);
  });

  it('keeps overflow-safe fractions finite when finite segments overflow their sum', async () => {
    const { container } = await render(
      <SegmentedRing
        segments={[
          { value: Number.MAX_VALUE, label: 'First' },
          { value: Number.MAX_VALUE, label: 'Second' },
        ]}
      />,
    );
    const arcs = container.querySelectorAll('svg circle:not(:first-child)');
    expect(arcs).toHaveLength(2);
    for (const arc of arcs) {
      const dash = arc.getAttribute('stroke-dasharray')!.split(' ').map(Number);
      expect(dash.every(Number.isFinite)).toBe(true);
      expect(dash[0]).toBeGreaterThan(0);
    }
  });

  for (const theme of THEMES) {
    it('is axe clean in ' + theme, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <SegmentedRing centerLabel="Sessions" centerValue="5 of 8" segments={SEGMENTS} />,
        );
        expect(errorSpy).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
      } finally {
        errorSpy.mockRestore();
      }
    });
  }
});
