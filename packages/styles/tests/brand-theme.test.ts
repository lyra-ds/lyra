import { beforeAll, describe, expect, it } from 'vitest';
// Load the built entry CSS. Vite resolves styles.css's @import graph (tokens/colors.css,
// tokens/brand.css color-mix derivation, all component CSS) and injects it as a <style> into
// document.head. This is the fixture's stylesheet — the mechanism declared in vitest.config.ts.
import '../styles.css';
// brand.css is shipped source (the styles package has no CSS build step). Import it directly so
// this structural check can distinguish the unsupported-engine fallback from the supported path.
import brandCss from '../tokens/brand.css?raw';
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
  const oklch = parseOklch(value);
  if (oklch) return oklch;

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

function parseOklch(value: string): RGB | undefined {
  const match = value.match(
    /^oklch\(\s*(?<lightness>[\d.]+)(?<lightnessUnit>%?)\s+(?<chroma>[\d.]+)\s+(?<hue>[\d.]+)(?:\s*\/\s*(?<alpha>[\d.]+)(?<alphaUnit>%?))?\s*\)$/,
  );
  if (!match?.groups) return undefined;

  const lightness = Number(match.groups.lightness) / (match.groups.lightnessUnit === '%' ? 100 : 1);
  const chroma = Number(match.groups.chroma);
  const hue = (Number(match.groups.hue) * Math.PI) / 180;
  const alpha = match.groups.alpha
    ? Number(match.groups.alpha) / (match.groups.alphaUnit === '%' ? 100 : 1)
    : 1;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = Math.pow(lightness + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(lightness - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(lightness - 0.0894841775 * a - 1.291485548 * b, 3);
  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) => {
    const srgb = channel <= 0.0031308 ? 12.92 * channel : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
    return Math.round(255 * Math.min(1, Math.max(0, srgb)));
  });

  return { r: channels[0], g: channels[1], b: channels[2], a: alpha };
}

describe('CSS Color 4 serialization', () => {
  it('converts Firefox’s neutral oklch serialization to sRGB', () => {
    expect(parseColor('oklch(0 0 184.704)')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    expect(parseColor('oklch(1 0 184.704)')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });
});

/** Parse a #RRGGBB hex into channels (reference values for direct hand-off tokens). */
function parseHex(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
}

/** Perceived luminance (Rec. 709 weights). Monotonic in lightness — enough for ordering. */
function luminance(c: RGB): number {
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

/** WCAG relative luminance for the resolved sRGB channels. */
function relativeLuminance({ r, g, b }: RGB): number {
  const linear = [r, g, b].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** WCAG contrast ratio for two resolved token colors. */
function contrast(foreground: RGB, background: RGB): number {
  const fgLuminance = relativeLuminance(foreground);
  const bgLuminance = relativeLuminance(background);
  return (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
}

/**
 * Teal-family discriminator: green is (approximately) the dominant channel.
 * Acme teal (#0D9488, g=148 max) passes; indigo fallbacks (#5B5BD6, blue max) FAIL — so this
 * catches a silently-removed brand.css derivation that would leave the default indigo accents.
 *
 * The alpha + near-black floors are load-bearing (WR-02): without them the predicate returns
 * true for {0,0,0} and transparent-black — exactly what the accent-soft, accent-soft-text and
 * focus-ring longhands compute to when their custom properties fail to resolve (unset ->
 * initial -> transparent, or an invalid `border-color` -> currentColor -> black). Those floors
 * make an unresolved value FAIL, so the soft/focus-ring assertions can no longer pass vacuously.
 * The green-dominance test itself stays loose (`g + 2 >= max`) on purpose: the real derived
 * teals include heavily white-mixed, near-desaturated values (e.g. light accent-soft
 * {231,242,240}, dark accent-active {127,188,180}) where g exceeds b by only ~2, and those are
 * legitimate — only the black/transparent unresolved case must be rejected.
 */
function isTealFamily(c: RGB): boolean {
  if (c.a < 0.02) return false; // unresolved var -> transparent
  const max = Math.max(c.r, c.g, c.b);
  if (max < 20) return false; // unset longhand -> near-black
  return c.g + 2 >= max; // green (co-)dominant; indigo (blue-dominant) fails
}

const RAW_ACME = parseHex('#0D9488'); // consumer brand seed, unmixed
const LIGHT_ACCENT = parseHex('#5B5BD6'); // indigo-600 (default light --accent)
const DARK_ACCENT = parseHex('#5B5BD6'); // indigo-600 (default dark --accent)
const DARK_DANGER = parseHex('#DC2626'); // red-600 (default dark --danger)
const LIGHT_SURFACE_PAGE = parseHex('#F8FAFC'); // slate-50
const DARK_SURFACE_PAGE = parseHex('#0E1023'); // night-950

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

const BRAND_SEEDS = [
  '#0D9488', // teal
  '#FACC15', // yellow
  '#2563EB', // blue
  '#84CC16', // lime
  '#EC4899', // pink
  '#1E3A8A', // navy
  '#22D3EE', // cyan
  '#DC2626',
  '#7C3AED',
  '#059669',
  '#F97316',
  '#0EA5E9',
  '#A16207',
  '#BE185D',
  '#111827',
  '#E11D48',
  '#65A30D',
] as const;

type BrandTheme = 'light' | 'dark';
type BrandSeed = (typeof BRAND_SEEDS)[number];

// A crossover seed has no black-or-white choice that reaches normal-text AA in light mode.
// This list is intentionally narrow: every listed case must still stay above 4.4:1.
const KNOWN_BELOW_AA = new Set<`${BrandSeed}:${BrandTheme}`>(['#E11D48:light']);
const ON_ACCENT_FALLBACK = 'var(--brand-contrast, #FFFFFF)';
const ON_ACCENT_DERIVATION =
  'var(--brand-contrast, oklch(from var(--accent) clamp(0, (l / 0.58 - 1) * -infinity, 1) 0 h))';

function setBrandSeed(theme: BrandTheme, seed: BrandSeed, brandContrast?: string): void {
  root.setAttribute('data-brand', 'contrast-test');
  root.style.setProperty('--brand', seed);
  if (brandContrast) root.style.setProperty('--brand-contrast', brandContrast);
  else root.style.removeProperty('--brand-contrast');
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  void root.offsetHeight;
}

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

  it('setting data-theme=dark re-derives --surface-page without rebuilding', () => {
    setPermutation('light', 'none');
    const light = bg('surface-page');
    setPermutation('dark', 'none');
    const dark = bg('surface-page');
    eqRGB(light, LIGHT_SURFACE_PAGE);
    eqRGB(dark, DARK_SURFACE_PAGE);
    // The switch is a real change of the resolved longhand, not the raw custom-property string.
    expect(luminance(dark)).not.toBe(luminance(light));
  });

  it('dark solid accent and danger fills keep --on-accent at WCAG AA', () => {
    setPermutation('dark', 'none');
    const onAccent = fg('on-accent');
    eqRGB(bg('accent'), DARK_ACCENT);
    eqRGB(bg('danger'), DARK_DANGER);
    expect(onAccent.a, '--on-accent must resolve to an opaque text color').toBeGreaterThan(0.99);
    expect(contrast(onAccent, bg('accent'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(onAccent, bg('danger'))).toBeGreaterThanOrEqual(4.5);
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

  it('dark default (no brand) --accent is indigo-600, distinct from dark-acme teal', () => {
    setPermutation('dark', 'none');
    eqRGB(bg('accent'), DARK_ACCENT);
    setPermutation('dark', 'acme');
    // Proves the brand path actually re-derives rather than falling through to the indigo token.
    expect(isTealFamily(bg('accent'))).toBe(true);
  });
});

// --- white-label primary-fill contrast -----------------------------------------------------------

describe('white-label --on-accent contrast guarantee', () => {
  it('ships a valid fallback outside the relative-color @supports derivation', () => {
    const baseRule = brandCss.match(/^\[data-brand\]\s*\{(?<declarations>[^{}]*)\}/m)?.groups
      ?.declarations;
    const supportedRule = brandCss.match(
      /@supports\s*\(color:\s*oklch\(from red l c h\)\)\s*\{\s*\[data-brand\]\s*\{(?<declarations>[^{}]*)\}/s,
    )?.groups?.declarations;

    expect(baseRule).toContain(`--on-accent:        ${ON_ACCENT_FALLBACK};`);
    expect(supportedRule).toContain(`--on-accent: ${ON_ACCENT_DERIVATION};`);
  });

  for (const theme of ['light', 'dark'] as const) {
    for (const seed of BRAND_SEEDS) {
      const key: `${BrandSeed}:${BrandTheme}` = `${seed}:${theme}`;
      const isKnownBelowAA = KNOWN_BELOW_AA.has(key);
      it(`${theme} ${seed}: primary ink is AA-large${isKnownBelowAA ? ' (known AA crossover)' : ''}`, () => {
        setBrandSeed(theme, seed);
        const ratio = contrast(fg('on-accent'), bg('accent'));
        expect(ratio, `${theme} ${seed} must meet AA-large`).toBeGreaterThanOrEqual(3);
        if (isKnownBelowAA) {
          expect(ratio, `${theme} ${seed} must remain below normal-text AA`).toBeLessThan(4.5);
          expect(ratio, `${theme} ${seed} must remain near AA`).toBeGreaterThanOrEqual(4.4);
        } else
          expect(ratio, `${theme} ${seed} must meet normal-text AA`).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('--brand-contrast overrides the automatic ink derivation', () => {
    setBrandSeed('light', '#FACC15', '#123456');
    eqRGB(fg('on-accent'), parseHex('#123456'));
  });
});

// --- chevron mask DECODE proof --------------------------------------------------------------------

// All three rewritten unpkg->data: chevron masks resolve to one of two distinct SVG payloads:
// the DOWN chevron (forms + display, path `m6 9 6 6 6-6`) and the RIGHT chevron (navigation,
// path `m9 18 6-6-6-6`). Both are decode-proven here via a direct-mask element (WR-03): the
// down chevron off .lyra-acc__chevron (display.css) and the right chevron off
// .lyra-breadcrumb__sep (navigation.css). Each asserts the payload decodes into a real image
// AND carries the expected path, so a truncated, malformed, or SWAPPED mask fails.
const CHEVRON_MASKS = [
  { probe: 'chevron', label: 'down (.lyra-acc__chevron)', path: 'm6 9 6 6 6-6' },
  { probe: 'chevron-nav', label: 'right (.lyra-breadcrumb__sep)', path: 'm9 18 6-6-6-6' },
] as const;

describe('chevron mask data: URI decodes (direct-mask element)', () => {
  for (const { probe: probeName, label, path } of CHEVRON_MASKS) {
    it(`${label}: computed mask-image data: URL decodes with positive intrinsic size`, async () => {
      setPermutation('light', 'none');
      const el = probe(probeName);
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
      // Assert the EXPECTED chevron direction — catches a forms/navigation mask swap.
      expect(payload, `wrong chevron path for ${label}`).toContain(path);
      const img = new Image();
      img.src = `data:image/svg+xml,${encodeURIComponent(payload)}`;
      await img.decode();
      expect(img.naturalWidth).toBeGreaterThan(0);
      expect(img.naturalHeight).toBeGreaterThan(0);
    });
  }
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
