import { beforeAll, describe, expect, it } from 'vitest';
import { server } from 'vitest/browser';
import '../styles.css';

type Target = {
  name: string;
  selector: string;
  fixedHeight?: number;
};

const targets: Target[] = [
  { name: 'medium button', selector: '[data-probe="button"]', fixedHeight: 40 },
  { name: 'tab', selector: '[data-probe="tab"]' },
  { name: 'table sort button', selector: '[data-probe="sort"]' },
  { name: 'table selection checkbox', selector: '[data-probe="table-check"]', fixedHeight: 18 },
  { name: 'Drawer close button', selector: '[data-probe="drawer-close"]', fixedHeight: 28 },
  { name: 'menu item', selector: '[data-probe="menu-item"]' },
  { name: 'command item', selector: '[data-probe="command-item"]' },
  { name: 'command search input', selector: '[data-probe="command-search"]', fixedHeight: 32 },
  { name: 'input', selector: '[data-probe="input"]', fixedHeight: 40 },
  { name: 'workspace slug input', selector: '[data-probe="slug-input"]' },
];

const waitForFiniteAnimations = async (): Promise<void> => {
  const animations = document.getAnimations().filter((animation) => {
    const iterations = animation.effect?.getTiming().iterations;
    return iterations !== Infinity;
  });

  await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
};

beforeAll(async () => {
  document.body.innerHTML = `
    <main id="coarse-target-root">
      <button class="lyra-btn lyra-btn--md" data-probe="button">Go</button>
      <div class="lyra-tabs"><button class="lyra-tab" data-probe="tab">A</button></div>
      <table class="lyra-table"><thead><tr><th><button class="lyra-table__sortbtn" data-probe="sort">A</button></th><th class="lyra-table__check"><input type="checkbox" class="lyra-checkbox" data-probe="table-check" /></th></tr></thead></table>
      <button class="lyra-drawer__close" style="margin: 40px" data-probe="drawer-close" aria-label="Close">×</button>
      <div class="lyra-code"><div class="lyra-code__bar"><span class="lyra-code__lang">ts</span><button class="lyra-code__copy" data-probe="code-copy">Copy</button></div></div>
      <div class="lyra-segmented" role="radiogroup"><button class="lyra-segmented__option" data-probe="segmented-option">Production</button><button class="lyra-segmented__option" data-probe="segmented-other">Sandbox</button></div>
      <div class="lyra-menu"><button class="lyra-menu__item" data-probe="menu-item">A</button></div>
      <div class="lyra-cmdk">
        <label class="lyra-cmdk__search"><input data-probe="command-search" value="A" /></label>
        <button class="lyra-cmdk__item" data-probe="command-item">A</button>
      </div>
      <input class="lyra-input" data-probe="input" value="A" />
      <div class="lyra-wscreate__slug"><input class="lyra-wscreate__slug-input" data-probe="slug-input" value="a" /></div>
      <nav class="lyra-appsidebar lyra-appsidebar--rail">
        <div class="lyra-appsidebar__brand">
          <div class="lyra-wssw"><button class="lyra-wssw__trigger" data-probe="rail-workspace">Acme</button></div>
        </div>
      </nav>
    </main>`;

  await waitForFiniteAnimations();
});

const box = (target: Pick<Target, 'name' | 'selector'>): DOMRect => {
  const element = document.querySelector<HTMLElement>(target.selector);
  if (!element) throw new Error(`Missing ${target.name} probe`);
  return element.getBoundingClientRect();
};

const isFine = (): boolean => window.matchMedia('(pointer: fine)').matches;
const isCoarse = (): boolean => window.matchMedia('(pointer: coarse)').matches;
const hasAnyCoarse = (): boolean => window.matchMedia('(any-pointer: coarse)').matches;

type PointerProfile = 'coarse-primary' | 'fine-primary-with-coarse' | 'fine-only';

// server.config is Vitest's serialized per-project config; its name matches the browser
// instance name declared in vitest.config.ts.
const configuredPointerProfile = (): PointerProfile => {
  const name = server.config.name;
  if (name === 'chromium-coarse') return 'coarse-primary';
  if (name === 'chromium-hybrid') return 'fine-primary-with-coarse';
  if (name === 'chromium' || name === 'firefox' || name === 'webkit') return 'fine-only';
  throw new Error(
    `Unexpected pointer profile instance name: "${name}". Expected chromium, firefox, webkit, chromium-coarse or chromium-hybrid. Check the browser instance name in vitest.config.ts.`,
  );
};

describe('coarse-pointer target sizes', () => {
  it('reports the exact real pointer media profile configured for this instance', () => {
    const profile = configuredPointerProfile();

    if (profile === 'coarse-primary') {
      expect(isCoarse(), 'chromium-coarse must report pointer: coarse').toBe(true);
      expect(hasAnyCoarse(), 'chromium-coarse must report any-pointer: coarse').toBe(true);
      return;
    }

    if (profile === 'fine-primary-with-coarse') {
      expect(isFine(), 'chromium-hybrid must report pointer: fine').toBe(true);
      expect(hasAnyCoarse(), 'chromium-hybrid must report any-pointer: coarse').toBe(true);
      return;
    }

    expect(isFine(), 'ordinary contexts must report pointer: fine').toBe(true);
    expect(hasAnyCoarse(), 'ordinary contexts must not report any-pointer: coarse').toBe(false);
  });

  it('keeps compact fine-pointer geometry and expands every measured owner for any coarse pointer', () => {
    if (hasAnyCoarse()) {
      for (const target of targets) {
        const { width, height } = box(target);
        expect(width, `${target.name} width`).toBeGreaterThanOrEqual(44);
        expect(height, `${target.name} height`).toBeGreaterThanOrEqual(44);
      }
      return;
    }

    for (const { fixedHeight, ...target } of targets) {
      const { height } = box(target);
      // Content-sized controls inherit platform font metrics; only authored heights are exact.
      expect(height, `${target.name} remains visible`).toBeGreaterThan(0);
      expect(height, `${target.name} retains compact fine-pointer sizing`).toBeLessThan(44);
      if (fixedHeight !== undefined) {
        expect(height, `${target.name} fixed height`).toBe(fixedHeight);
      }
    }
  });

  it('keeps the rail WorkspaceSwitcher trigger at its usable target size for every pointer profile', () => {
    const { width, height } = box({
      name: 'rail WorkspaceSwitcher trigger',
      selector: '[data-probe="rail-workspace"]',
    });

    expect(width).toBeGreaterThanOrEqual(44);
    expect(height).toBeGreaterThanOrEqual(44);
  });

  it('keeps a 44px hit area on every pointer for the Drawer close, code copy and segmented options', () => {
    // Drawer close: visual box stays 28px on fine pointers; the ::after hit area must reach 44px.
    const close = document.querySelector<HTMLElement>('[data-probe="drawer-close"]');
    if (!close) throw new Error('Missing Drawer close probe');
    close.scrollIntoView({ block: 'center' });
    const rect = close.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (const [dx, dy] of [
      [-21, 0],
      [21, 0],
      [0, -21],
      [0, 21],
    ]) {
      expect(document.elementFromPoint(cx + dx, cy + dy), `Drawer close hit ${dx},${dy}`).toBe(
        close,
      );
    }

    for (const probe of ['code-copy', 'segmented-option', 'segmented-other']) {
      const { height } = box({ name: probe, selector: `[data-probe="${probe}"]` });
      expect(height, `${probe} height`).toBeGreaterThanOrEqual(44);
    }
  });
});
