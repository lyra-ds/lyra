import { beforeAll, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../styles.css';
import fixtureHtml from './fixtures/contrast-regressions.html?raw';

type RGB = { r: number; g: number; b: number; a: number };

const canvas = document.createElement('canvas');
canvas.width = canvas.height = 1;
const context = canvas.getContext('2d', { willReadFrequently: true })!;

function parseColor(value: string): RGB {
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = '#000';
  context.fillStyle = value;
  if (
    context.fillStyle === '#000000' &&
    !/^#0{3,6}$|black|rgba?\(\s*0\D+0\D+0\b|oklab|oklch/i.test(value)
  ) {
    throw new Error(`Canvas rejected color: "${value}"`);
  }
  context.clearRect(0, 0, 1, 1);
  context.fillRect(0, 0, 1, 1);
  const channels = context.getImageData(0, 0, 1, 1).data;
  return { r: channels[0], g: channels[1], b: channels[2], a: channels[3] / 255 };
}

function relativeLuminance({ r, g, b }: RGB): number {
  const linear = [r, g, b].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground: RGB, background: RGB): number {
  const fgLuminance = relativeLuminance(foreground);
  const bgLuminance = relativeLuminance(background);
  return (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
}

function composite(foreground: RGB, background: RGB): RGB {
  const alpha = foreground.a;
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
    a: 1,
  };
}

function finishAnimations(): void {
  document.getAnimations().forEach((animation) => {
    try {
      animation.finish();
    } catch {
      // Infinite animations cannot finish.
    }
  });
}

let root: HTMLElement;
const probe = (name: string): HTMLElement => {
  const element = root.querySelector<HTMLElement>(`[data-probe="${name}"]`);
  if (!element) throw new Error(`missing probe "${name}"`);
  return element;
};

function setTheme(theme: 'light' | 'dark', brand = false): void {
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  if (brand) {
    root.setAttribute('data-brand', 'acme');
    root.style.setProperty('--brand', '#0D9488');
  } else {
    root.removeAttribute('data-brand');
    root.style.removeProperty('--brand');
  }
  void root.offsetHeight;
}

function assertContrast(name: string, foreground = probe(name), background = probe(name)): void {
  const foregroundStyle = getComputedStyle(foreground);
  const backgroundStyle = getComputedStyle(background);
  const foregroundColor = parseColor(foregroundStyle.color);
  const backgroundColor = parseColor(backgroundStyle.backgroundColor);
  expect(foregroundColor.a, `${name} foreground must be opaque`).toBe(1);
  expect(backgroundColor.a, `${name} background must be opaque`).toBe(1);
  const ratio = contrast(foregroundColor, backgroundColor);
  expect(
    ratio,
    `${name} contrast (${ratio.toFixed(3)}:1; fg ${foregroundStyle.color}; bg ${backgroundStyle.backgroundColor})`,
  ).toBeGreaterThanOrEqual(4.5);
}

beforeAll(() => {
  document.body.innerHTML = fixtureHtml;
  root = document.getElementById('contrast-root')!;
  expect(root).toBeTruthy();
  root.style.background = 'var(--surface-page)';
});

describe('rendered Styles composites retain WCAG AA contrast', () => {
  it('keeps faint text readable on each light surface', () => {
    setTheme('light');
    assertContrast('faint-card');
    assertContrast('faint-page');
    assertContrast('faint-sunken');
  });

  it('keeps faint text readable on each dark surface', () => {
    setTheme('dark');
    assertContrast('faint-card');
    assertContrast('faint-page');
    assertContrast('faint-sunken');
  });

  it('keeps CalendarView session composites readable in both themes', () => {
    for (const theme of ['light', 'dark'] as const) {
      setTheme(theme);
      const surface = parseColor(getComputedStyle(root).backgroundColor);
      for (const name of ['session', 'program-session']) {
        const element = probe(name);
        const backgroundStyle = getComputedStyle(element);
        const background = parseColor(backgroundStyle.backgroundColor);
        const time = element.querySelector<HTMLElement>('.lyra-calview__evt-time')!;
        const timeStyle = getComputedStyle(time);
        const foreground = parseColor(timeStyle.color);
        expect(foreground.a, `${theme} ${name} time foreground must be opaque`).toBe(1);
        const renderedBackground = composite(background, surface);
        expect(renderedBackground.a, `${theme} ${name} rendered background must be opaque`).toBe(1);
        const renderedForeground = composite(
          { ...foreground, a: foreground.a * Number.parseFloat(timeStyle.opacity) },
          renderedBackground,
        );
        expect(renderedForeground.a, `${theme} ${name} time foreground must be opaque`).toBe(1);
        const ratio = contrast(renderedForeground, renderedBackground);
        expect(
          ratio,
          `${theme} ${name} time contrast (${ratio.toFixed(3)}:1; fg ${timeStyle.color}; bg ${backgroundStyle.backgroundColor})`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('keeps the light sunken keyboard label readable', () => {
    setTheme('light');
    assertContrast('sunken-label');
  });

  it('keeps the branded primary hover readable after its transition settles', async () => {
    setTheme('light', true);
    await userEvent.hover(probe('primary'));
    finishAnimations();
    void getComputedStyle(probe('primary')).backgroundColor;
    assertContrast('primary');
  });
});

export { contrast };
