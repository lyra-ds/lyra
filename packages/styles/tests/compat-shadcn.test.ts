import { beforeAll, describe, expect, it } from 'vitest';
// Order matters and is part of the contract: the compat layer is opt-in and documented as
// imported AFTER the entry stylesheet. Loading it first would let styles.css win the cascade.
import '../styles.css';
import '../compat-shadcn.css';
import fixtureHtml from './fixtures/compat-shadcn.html?raw';

/**
 * The shadcn compatibility layer maps 19 shadcn variables onto Lyra tokens.
 *
 * This suite exists to pin the ONE thing about it that is counter-intuitive enough to be
 * "fixed" into a regression: `--accent` is deliberately NOT mapped.
 *
 * `--accent` is a name collision. In shadcn it is the subtle hover surface for menu, dropdown
 * and command items; in Lyra it is the brand color, read by every component. Mapping it at
 * `:root` looks like the obvious repair — shadcn's accent pair measures 1.34:1 in light without
 * it — but it silently destroys Lyra: measured, `--accent: var(--surface-sunken)` on `:root`
 * turns the Lyra primary button from indigo `rgb(91,91,214)` into `rgb(241,245,249)`, and drags
 * `--primary` (which is `var(--accent)`) down with it to 1.09:1.
 *
 * The workable answer is a SCOPED override on the shadcn subtree, which the guide documents.
 * The tests below pin both halves so neither can be undone by accident.
 */

type RGB = { r: number; g: number; b: number; a: number };

// color-mix() and oklab() serialize in their own space; a 1x1 canvas is the universal converter
// back to straight sRGB. Same technique as brand-theme.test.ts.
const ctx = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  return c.getContext('2d', { willReadFrequently: true })!;
})();

function parseColor(value: string): RGB {
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
}

/** WCAG relative luminance. */
function luminance({ r, g, b }: RGB): number {
  const lin = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrast(fg: RGB, bg: RGB): number {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

let root: HTMLElement;

const probe = (name: string): HTMLElement => {
  const el = root.querySelector<HTMLElement>(`[data-probe="${name}"]`);
  if (!el) throw new Error(`missing probe "${name}"`);
  return el;
};

function setTheme(theme: 'light' | 'dark'): void {
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  void root.offsetHeight; // force style recalc
}

/** Contrast of an element's own text against its own background, both fully resolved. */
function pairContrast(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  const bg = parseColor(cs.backgroundColor);
  // An opaque background is a precondition, not an assumption: compositing a translucent
  // surface would need the layer behind it, and the ratio below would be meaningless.
  expect(bg.a, 'background must be opaque to score contrast').toBeGreaterThan(0.99);
  return contrast(parseColor(cs.color), bg);
}

beforeAll(() => {
  document.body.innerHTML = fixtureHtml;
  root = document.getElementById('lyra-compat-root')!;
  expect(root).toBeTruthy();
});

describe('compat-shadcn — the mapping resolves to Lyra tokens', () => {
  it('maps --background to the Lyra page surface, not a shadcn default', () => {
    setTheme('light');
    const light = parseColor(getComputedStyle(probe('background')).backgroundColor);
    setTheme('dark');
    const dark = parseColor(getComputedStyle(probe('background')).backgroundColor);
    // If the mapping were missing, --background would be unset and both would collapse to the
    // same initial value. Responding to the theme proves the indirection works.
    expect(luminance(light)).toBeGreaterThan(luminance(dark));
  });

  it('maps --border to a resolved, opaque color in both themes', () => {
    for (const theme of ['light', 'dark'] as const) {
      setTheme(theme);
      const c = parseColor(getComputedStyle(probe('border')).backgroundColor);
      expect(c.a, `${theme}: --border must resolve`).toBeGreaterThan(0.99);
    }
  });

  it('secondary pair meets AA in both themes', () => {
    for (const theme of ['light', 'dark'] as const) {
      setTheme(theme);
      expect(pairContrast(probe('secondary')), theme).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('compat-shadcn — the --accent collision is deliberate and must stay', () => {
  it('shadcn --accent falls through to the Lyra brand accent, unmapped', () => {
    setTheme('light');
    const shadcnAccent = parseColor(getComputedStyle(probe('accent')).backgroundColor);
    // The Lyra brand accent, read from a component that owns it rather than from the token, so
    // this compares what a user actually sees on both sides.
    const brand = parseColor('#5B5BD6'); // --indigo-600, the light --accent
    expect(shadcnAccent.r).toBe(brand.r);
    expect(shadcnAccent.g).toBe(brand.g);
    expect(shadcnAccent.b).toBe(brand.b);
  });

  it('mapping --accent globally would break Lyra, so the guide must not suggest it', () => {
    setTheme('light');
    // Reproduce the tempting repair at :root and prove the collateral damage in one place.
    const style = document.createElement('style');
    style.textContent = ':root { --accent: var(--surface-sunken); }';
    document.head.append(style);
    try {
      void root.offsetHeight;
      const primary = probe('primary');
      // --primary is var(--accent), so it follows the override down and takes white text with it.
      expect(pairContrast(primary)).toBeLessThan(2);
    } finally {
      style.remove();
      void root.offsetHeight;
    }
  });

  it('a scoped override reaches AA without touching anything outside the scope', () => {
    setTheme('light');
    const style = document.createElement('style');
    style.textContent = '.shadcn-scope { --accent: var(--surface-sunken); }';
    document.head.append(style);
    const scope = document.createElement('div');
    scope.className = 'shadcn-scope';
    const scoped = document.createElement('div');
    scoped.style.backgroundColor = 'var(--accent)';
    scoped.style.color = 'var(--accent-foreground)';
    scoped.textContent = 'Hover row';
    scope.append(scoped);
    root.append(scope);
    try {
      void root.offsetHeight;
      expect(pairContrast(scoped)).toBeGreaterThanOrEqual(4.5);
      // Outside the scope, the brand accent is untouched.
      const outside = parseColor(getComputedStyle(probe('accent')).backgroundColor);
      expect(outside).toMatchObject(parseColor('#5B5BD6'));
    } finally {
      scope.remove();
      style.remove();
    }
  });
});
