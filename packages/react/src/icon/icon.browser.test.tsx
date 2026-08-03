// REGISTRY-component test template (D-25) — the shape Phase 4 copies for data-driven wrappers.
// Runs in the "browser" vitest project (real chromium). The @lyra-ds/styles entry CSS is imported
// IN THIS TEST (never in src, RCT-03); Vite resolves its @import graph into a <style>.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, cleanup } from 'vitest-browser-react';
import axe from 'axe-core';
import { Camera } from 'lucide-react';
import '@lyra-ds/styles/styles.css';
import { Icon } from './index';
import { iconRegistry, type IconName } from './icon-registry';

// Never hardcode the name list — iterate the registry so a recount can't silently desync the test.
const NAMES = Object.keys(iconRegistry) as IconName[];
const THEMES = ['light', 'dark'] as const;

function setTheme(theme: (typeof THEMES)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  void document.documentElement.offsetHeight;
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

// --- Registry smoke: all 79 icons render, light + dark, zero axe violations ------------------

describe('Icon — registry smoke (light + dark)', () => {
  it('the curated registry holds exactly 79 icons', () => {
    expect(NAMES.length).toBe(79);
  });

  for (const theme of THEMES) {
    it(`renders every registry icon at default 20px in ${theme} with zero axe violations`, async () => {
      setTheme(theme);
      const { container } = await render(
        <div>
          {NAMES.map((name) => (
            <Icon key={name} name={name} />
          ))}
        </div>,
      );
      const svgs = container.querySelectorAll('svg.lyra-icon');
      expect(svgs.length).toBe(NAMES.length);
      // default size 20 → lucide writes width/height="20"; decorative (aria-hidden).
      svgs.forEach((svg) => {
        expect(svg.getAttribute('width')).toBe('20');
        expect(svg.getAttribute('height')).toBe('20');
        expect(svg.getAttribute('aria-hidden')).toBe('true');
      });
      const results = await axe.run(container as HTMLElement);
      expect(results.violations).toEqual([]);
    });
  }
});

// --- Resolution: name lookup, escape hatch, defaults ----------------------------------------

describe('Icon — resolution', () => {
  it('<Icon name="check" /> renders an svg.lyra-icon at 20px', async () => {
    const { container } = await render(<Icon name="check" />);
    const svg = container.querySelector('svg.lyra-icon')!;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('width')).toBe('20');
  });

  it('icon prop (escape hatch) wins over name when both are provided (D-03)', async () => {
    const { container } = await render(<Icon icon={Camera} name="check" />);
    // Camera has a distinct path; assert the escape-hatch component rendered (single svg present).
    const svg = container.querySelector('svg.lyra-icon')!;
    expect(svg).not.toBeNull();
    // Camera's markup differs from Check — it contains a <circle>, Check does not.
    expect(svg.querySelector('circle')).not.toBeNull();
  });

  it('size + color pass through to the svg (lucide maps color → stroke)', async () => {
    const { container } = await render(<Icon name="check" size={32} color="rgb(255, 0, 0)" />);
    const svg = container.querySelector('svg.lyra-icon')! as SVGSVGElement;
    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.getAttribute('stroke')).toBe('rgb(255, 0, 0)');
  });

  it('default color inherits currentColor (D-06) — no explicit stroke override', async () => {
    const { container } = await render(<Icon name="check" />);
    const svg = container.querySelector('svg.lyra-icon')!;
    expect(svg.getAttribute('stroke')).toBe('currentColor');
  });

  it('consumer className appends after .lyra-icon (D-09)', async () => {
    const { container } = await render(<Icon name="check" className="my-glyph" />);
    const svg = container.querySelector('svg')!;
    expect(svg.classList.contains('lyra-icon')).toBe(true);
    expect(svg.classList.contains('my-glyph')).toBe(true);
  });
});

// --- Unknown-name + empty-input contract ----------------------------------------------------

describe('Icon — unknown name / empty input', () => {
  it('unknown name: dev-warns once with the icon-prop hint and renders null', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { container } = await render(<Icon name={'not-a-real-icon' as IconName} />);
      expect(container.querySelector('svg')).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      const msg = warn.mock.calls[0][0] as string;
      expect(msg).toContain('[lyra-ds] Icon: unknown name');
      expect(msg).toContain('not-a-real-icon');
      expect(msg).toContain('`icon`');
    } finally {
      warn.mockRestore();
    }
  });

  it('no name and no icon: renders null without crashing (and does not warn)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { container } = await render(<Icon />);
      expect(container.querySelector('svg')).toBeNull();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('prototype-chain keys (e.g. "constructor") are not resolved — Object.hasOwn guard (V5)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { container } = await render(<Icon name={'constructor' as IconName} />);
      expect(container.querySelector('svg')).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });
});

// --- Accessibility wiring: title → role=img + aria-label; none → aria-hidden ------------------

describe('Icon — a11y', () => {
  for (const theme of THEMES) {
    it(`title yields role=img + aria-label; absent title yields aria-hidden in ${theme}`, async () => {
      setTheme(theme);
      const labelled = await render(<Icon name="settings" title="Settings" />);
      const named = labelled.container.querySelector('svg.lyra-icon')!;
      expect(named.getAttribute('role')).toBe('img');
      expect(named.getAttribute('aria-label')).toBe('Settings');
      expect(named.hasAttribute('aria-hidden')).toBe(false);
      let results = await axe.run(labelled.container as HTMLElement);
      expect(results.violations).toEqual([]);
      await cleanup();

      const decorative = await render(<Icon name="settings" />);
      const deco = decorative.container.querySelector('svg.lyra-icon')!;
      expect(deco.getAttribute('aria-hidden')).toBe('true');
      expect(deco.hasAttribute('role')).toBe(false);
      expect(deco.hasAttribute('aria-label')).toBe(false);
      results = await axe.run(decorative.container as HTMLElement);
      expect(results.violations).toEqual([]);
    });
  }
});
