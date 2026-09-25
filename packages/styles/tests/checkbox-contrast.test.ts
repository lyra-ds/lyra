import { beforeAll, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import '../styles.css';

type RGB = { r: number; g: number; b: number };

const canvas = document.createElement('canvas');
canvas.width = canvas.height = 1;
const context = canvas.getContext('2d', { willReadFrequently: true })!;

function parseColor(value: string): RGB {
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return { r, g, b };
}

function luminance({ r, g, b }: RGB): number {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrast(a: RGB, b: RGB): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

let root: HTMLElement;
let checkbox: HTMLInputElement;
let radio: HTMLInputElement;
let switchTrack: HTMLElement;

function setup(theme: 'light' | 'dark', brand?: string): void {
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  if (brand) {
    root.setAttribute('data-brand', 'test');
    root.style.setProperty('--brand', brand);
  } else {
    root.removeAttribute('data-brand');
    root.style.removeProperty('--brand');
  }
  void root.offsetHeight;
}

const color = (value: string): RGB => parseColor(value);

beforeAll(() => {
  document.body.innerHTML = `
    <div id="root" style="background: var(--surface-page); padding: 16px; --duration-fast: 0s; --duration-base: 0s">
      <input id="cb" type="checkbox" class="lyra-checkbox" checked />
      <input id="rd" type="radio" class="lyra-radio" checked />
      <label class="lyra-switch"><input type="checkbox" /><span id="track" class="lyra-switch__track"></span></label>
    </div>`;
  root = document.getElementById('root')!;
  checkbox = document.getElementById('cb') as HTMLInputElement;
  radio = document.getElementById('rd') as HTMLInputElement;
  switchTrack = document.getElementById('track')!;
});

describe('checkbox / radio / switch non-text contrast (WCAG 1.4.11)', () => {
  it.each(['light', 'dark'] as const)(
    'unchecked control edges reach 3:1 on raised and sunken surfaces (%s)',
    (theme) => {
      setup(theme);
      checkbox.checked = radio.checked = false;
      for (const surface of ['--surface-raised', '--surface-sunken']) {
        const bg = color(getComputedStyle(root).getPropertyValue(surface));
        expect(
          contrast(color(getComputedStyle(checkbox).borderTopColor), bg),
        ).toBeGreaterThanOrEqual(3);
        expect(contrast(color(getComputedStyle(radio).borderTopColor), bg)).toBeGreaterThanOrEqual(
          3,
        );
      }
      const track = color(getComputedStyle(switchTrack).backgroundColor);
      const page = color(getComputedStyle(root).getPropertyValue('--surface-raised'));
      expect(contrast(track, page)).toBeGreaterThanOrEqual(3);
    },
  );

  it('draws the check mark and radio ring with --on-accent, not hardcoded white', () => {
    setup('light', '#7FD8CE');
    checkbox.checked = radio.checked = true;
    const onAccent = getComputedStyle(root).getPropertyValue('--on-accent');
    const mark = getComputedStyle(checkbox, '::after').backgroundColor;
    expect(parseColor(mark)).toEqual(color(onAccent.trim()));
    expect(color(getComputedStyle(radio).boxShadow.split(' 0px')[0])).toEqual(
      color(onAccent.trim()),
    );
    // light aqua accent: mark must not be white
    expect(parseColor(mark)).not.toEqual({ r: 255, g: 255, b: 255 });
  });

  it('keeps the check mark readable against the accent for a light and a dark brand', () => {
    for (const brand of ['#7FD8CE', '#4F46E5']) {
      setup('light', brand);
      checkbox.checked = true;
      const accent = color(getComputedStyle(checkbox).backgroundColor);
      const mark = color(getComputedStyle(checkbox, '::after').backgroundColor);
      expect(contrast(mark, accent), brand).toBeGreaterThanOrEqual(3);
    }
  });

  it('paints the check mark once, with --on-accent, and no leftover background image', async () => {
    setup('light', '#7FD8CE');
    checkbox.checked = true;
    expect(getComputedStyle(checkbox).backgroundImage).toBe('none');
    const shot = await page.screenshot({ element: checkbox, save: false, base64: true });
    const b64 = typeof shot === 'string' ? shot : (shot as { base64: string }).base64;
    const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const c = document.createElement('canvas');
    c.width = bitmap.width;
    c.height = bitmap.height;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const accent = color(getComputedStyle(checkbox).backgroundColor);
    const ink = color(getComputedStyle(root).getPropertyValue('--on-accent').trim());
    let markPixels = 0;
    let whitePixels = 0;
    const margin = Math.round(c.width / 6); // skip the border and rounded corners
    for (let i = 0; i < data.length; i += 4) {
      const pixel = i / 4;
      const x = pixel % c.width;
      const y = Math.floor(pixel / c.width);
      if (x < margin || y < margin || x >= c.width - margin || y >= c.height - margin) continue;
      const px = { r: data[i], g: data[i + 1], b: data[i + 2] };
      if (contrast(px, ink) < 1.3) markPixels++;
      if (px.r > 245 && px.g > 245 && px.b > 245) whitePixels++;
    }
    expect(markPixels).toBeGreaterThan(3);
    // light aqua accent: a leftover white SVG would paint white pixels inside the box
    expect(whitePixels).toBe(0);
    expect(contrast(ink, accent)).toBeGreaterThanOrEqual(3);
  });
});
