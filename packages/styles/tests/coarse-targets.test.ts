import { beforeAll, describe, expect, it } from 'vitest';
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
      <button class="lyra-drawer__close" data-probe="drawer-close" aria-label="Close">×</button>
      <div class="lyra-menu"><button class="lyra-menu__item" data-probe="menu-item">A</button></div>
      <div class="lyra-cmdk">
        <label class="lyra-cmdk__search"><input data-probe="command-search" value="A" /></label>
        <button class="lyra-cmdk__item" data-probe="command-item">A</button>
      </div>
      <input class="lyra-input" data-probe="input" value="A" />
      <div class="lyra-wscreate__slug"><input class="lyra-wscreate__slug-input" data-probe="slug-input" value="a" /></div>
    </main>`;

  await waitForFiniteAnimations();
});

const box = (target: Pick<Target, 'name' | 'selector'>): DOMRect => {
  const element = document.querySelector<HTMLElement>(target.selector);
  if (!element) throw new Error(`Missing ${target.name} probe`);
  return element.getBoundingClientRect();
};

const isCoarse = (): boolean => window.matchMedia('(pointer: coarse)').matches;

describe('coarse-pointer target sizes', () => {
  it('uses a real configured fine or coarse pointer context', () => {
    expect(isCoarse() || window.matchMedia('(pointer: fine)').matches).toBe(true);
  });

  it('keeps compact fine-pointer geometry and expands every measured owner for a coarse pointer', () => {
    if (isCoarse()) {
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
});
