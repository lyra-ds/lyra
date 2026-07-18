import { beforeAll, describe, expect, it } from 'vitest';
// Load the built entry CSS. Vite resolves styles.css's @import graph (tokens/colors.css,
// tokens/brand.css color-mix derivation, all component CSS) and injects it as a <style> into
// document.head. This is the fixture's stylesheet — the mechanism declared in vitest.config.ts.
import '../styles.css';
// The fixture DOM (probe elements) as raw markup, injected into document.body below.
import fixtureHtml from './fixtures/brand-theme.html?raw';

// --- helpers -------------------------------------------------------------------------------------

type RGB = { r: number; g: number; b: number; a: number };

// Chromium serializes color-mix() results in their mixing space (e.g. `oklab(...)`), not rgb().
// A 1x1 canvas is the universal converter: getImageData always returns straight sRGB 0-255,
// whatever the input color space (rgb/rgba/oklab/color(...)).
const _cctx = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  return c.getContext('2d', { willReadFrequently: true })!;
})();

/** Convert any browser-serialized CSS color to straight sRGB channels via canvas. */
function parseColor(value: string): RGB {
  _cctx.clearRect(0, 0, 1, 1);
  _cctx.fillStyle = '#000';
  _cctx.fillStyle = value; // if unsupported, fillStyle stays "#000" (guarded below)
  if (_cctx.fillStyle === '#000000' && !/^#0{3,6}$|black|rgba?\(\s*0\D+0\D+0\b/i.test(value)) {
    throw new Error(`Canvas rejected color: "${value}"`);
  }
  _cctx.clearRect(0, 0, 1, 1);
  _cctx.fillRect(0, 0, 1, 1);
  const d = _cctx.getImageData(0, 0, 1, 1).data;
  return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
}

/** Parse a #RRGGBB hex into channels (reference values for direct hand-off tokens). */
function parseHex(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
}

/** Perceived luminance (Rec. 709 weights). Monotonic in lightness — enough for ordering. */
function luminance(c: RGB): number {
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

/**
 * Teal-family discriminator: green is (approximately) the dominant channel.
 * Acme teal (#0D9488, g=148 max) passes; indigo fallbacks (#5B5BD6, blue max) FAIL — so this
 * catches a silently-removed brand.css derivation that would leave the default indigo accents.
 */
function isTealFamily(c: RGB): boolean {
  return c.g >= c.b - 2 && c.g >= c.r - 2;
}

const RAW_ACME = parseHex('#0D9488'); // consumer brand seed, unmixed
const LIGHT_ACCENT = parseHex('#5B5BD6'); // indigo-600 (default light --accent)
const DARK_ACCENT = parseHex('#6E6ADE'); // indigo-500 (default dark --accent)

function eqRGB(actual: RGB, expected: RGB, tol = 2): void {
  expect(Math.abs(actual.r - expected.r)).toBeLessThanOrEqual(tol);
  expect(Math.abs(actual.g - expected.g)).toBeLessThanOrEqual(tol);
  expect(Math.abs(actual.b - expected.b)).toBeLessThanOrEqual(tol);
}

let root: HTMLElement;
const probe = (name: string): HTMLElement => {
  const el = root.querySelector<HTMLElement>(`[data-probe="${name}"]`);
  if (!el) throw new Error(`missing probe "${name}"`);
  return el;
};

/** Set/clear data-theme & data-brand on the fixture root, then force layout + read helpers. */
function setPermutation(theme: 'light' | 'dark', brand: 'none' | 'acme'): void {
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  if (brand === 'acme') root.setAttribute('data-brand', 'acme');
  else root.removeAttribute('data-brand');
  // Force style recalc.
  void root.offsetHeight;
}

const bg = (name: string): RGB => parseColor(getComputedStyle(probe(name)).backgroundColor);
const fg = (name: string): RGB => parseColor(getComputedStyle(probe(name)).color);
const border = (name: string): RGB => parseColor(getComputedStyle(probe(name)).borderTopColor);

beforeAll(() => {
  document.body.innerHTML = fixtureHtml;
  root = document.getElementById('lyra-fixture-root')!;
  expect(root).toBeTruthy();
});

// --- STY-03: dark theming switches tokens with no rebuild -----------------------------------------

describe('STY-03 — dark theming (no rebuild, read resolved longhands)', () => {
  it('default light --accent resolves to indigo-600', () => {
    setPermutation('light', 'none');
    eqRGB(bg('accent'), LIGHT_ACCENT);
  });

  it('setting data-theme=dark switches the same probe to indigo-500 (no rebuild)', () => {
    setPermutation('light', 'none');
    const light = bg('accent');
    setPermutation('dark', 'none');
    const dark = bg('accent');
    eqRGB(dark, DARK_ACCENT);
    // The switch is a real change of the resolved longhand, not the raw custom-property string.
    expect(luminance(dark)).not.toBe(luminance(light));
  });
});

// --- STY-04: white-label acme color-mix derivation, light + dark ----------------------------------

describe('STY-04 — acme brand color-mix accent group', () => {
  it('light acme: --accent equals the raw teal brand (var(--brand))', () => {
    setPermutation('light', 'acme');
    eqRGB(bg('accent'), RAW_ACME);
    expect(isTealFamily(bg('accent'))).toBe(true);
  });

  it('light acme: hover/active are ordered DARKER than accent (black 12% / 22%), teal-family', () => {
    setPermutation('light', 'acme');
    const accentL = luminance(bg('accent'));
    const hoverL = luminance(bg('accent-hover'));
    const activeL = luminance(bg('accent-active'));
    // brand.css:5-6 — black-mix darkens; active (22%) darker than hover (12%) darker than accent.
    expect(hoverL).toBeLessThan(accentL);
    expect(activeL).toBeLessThan(hoverL);
    // Still teal-family (proves it's the derived teal, not the indigo fallback).
    expect(isTealFamily(bg('accent-hover'))).toBe(true);
    expect(isTealFamily(bg('accent-active'))).toBe(true);
  });

  it('light acme: soft / soft-text / focus-ring resolve to teal-family channels', () => {
    setPermutation('light', 'acme');
    expect(isTealFamily(bg('accent-soft'))).toBe(true);
    expect(isTealFamily(fg('accent-soft-text'))).toBe(true);
    expect(isTealFamily(border('focus-ring'))).toBe(true);
  });

  it('dark acme: accent/hover/active/soft-text are ordered LIGHTER than raw acme (white mixes)', () => {
    setPermutation('dark', 'acme');
    const rawL = luminance(RAW_ACME);
    const accentL = luminance(bg('accent')); // white 14%
    const hoverL = luminance(bg('accent-hover')); // white 26%
    const activeL = luminance(bg('accent-active')); // white 38%
    const softTextL = luminance(fg('accent-soft-text')); // white 45%
    // brand.css:20-24 — each derived value is lighter than raw acme, increasing in that order.
    expect(accentL).toBeGreaterThan(rawL);
    expect(hoverL).toBeGreaterThan(accentL);
    expect(activeL).toBeGreaterThan(hoverL);
    expect(softTextL).toBeGreaterThan(activeL);
    // Lightened, but still teal (white-mix preserves hue in oklab).
    expect(isTealFamily(bg('accent'))).toBe(true);
    expect(isTealFamily(bg('accent-hover'))).toBe(true);
    expect(isTealFamily(bg('accent-active'))).toBe(true);
    expect(isTealFamily(fg('accent-soft-text'))).toBe(true);
  });

  it('dark default (no brand) --accent is indigo-500, distinct from dark-acme teal', () => {
    setPermutation('dark', 'none');
    eqRGB(bg('accent'), DARK_ACCENT);
    setPermutation('dark', 'acme');
    // Proves the brand path actually re-derives rather than falling through to the indigo token.
    expect(isTealFamily(bg('accent'))).toBe(true);
  });
});

// --- chevron mask DECODE proof --------------------------------------------------------------------

describe('chevron mask data: URI decodes (direct-mask element)', () => {
  it('computed mask-image data: URL loads into an Image and decodes with positive intrinsic size', async () => {
    setPermutation('light', 'none');
    const el = probe('chevron');
    const cs = getComputedStyle(el);
    const raw = cs.maskImage !== 'none' && cs.maskImage ? cs.maskImage : cs.webkitMaskImage;
    expect(raw).toBeTruthy();
    // Extract the data: URL from url(...) — the mask SVG has no ')' so a greedy match is safe.
    const m = raw.match(/url\((['"]?)(.*)\1\)/s);
    expect(m, `no url() in computed mask-image: ${raw}`).toBeTruthy();
    // getComputedStyle wraps the url in "..." and CSS-escapes the SVG's inner double quotes as \".
    // Undo that escaping (\" -> ", \\ -> \) or the extracted markup is malformed XML.
    const src = m![2].replace(/\\(.)/g, '$1');
    expect(src.startsWith('data:image/svg+xml')).toBe(true);

    // The mask uses the `;utf8,<raw svg>` form, which Image.decode() will not accept directly.
    // Re-encode the SVG payload into a canonical, decodable data: URI. A truncated/malformed
    // payload (e.g. a `#`-truncated stroke) still fails decode() or yields zero intrinsic size.
    const payload = src.slice(src.indexOf(',') + 1);
    expect(payload).toContain('<svg');
    const img = new Image();
    img.src = `data:image/svg+xml,${encodeURIComponent(payload)}`;
    await img.decode();
    expect(img.naturalWidth).toBeGreaterThan(0);
    expect(img.naturalHeight).toBeGreaterThan(0);
  });
});

// --- long-text backstop (single concrete probe; broader overflow deferred to Phase 3) -------------

describe('long-text robustness backstop', () => {
  it('overlong label truncates inside its fixed-width box without expanding the container', () => {
    setPermutation('light', 'none');
    const box = probe('longtext-box');
    const label = probe('longtext-label');
    // Container stays at its fixed 120px box (content did not push it wider).
    expect(box.getBoundingClientRect().width).toBeLessThanOrEqual(121);
    expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth + 1);
    // The label's text is actually clipped (truncated), not fully laid out.
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
  });
});
