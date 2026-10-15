import { describe, expect, it } from 'vitest';
import '../styles.css';

const assertCommandPaletteTargets = async (): Promise<void> => {
  for (const modal of [false, true]) {
    for (const controlSize of [undefined, '24px', '56px']) {
      const host = document.createElement('div');
      host.style.width = '280px';
      if (controlSize) host.style.setProperty('--control-md', controlSize);
      const panel = `
        <div class="lyra-cmdk" ${modal ? 'role="dialog" aria-label="Commands"' : ''}>
          <div class="lyra-cmdk__search">
            <svg width="18" height="18" aria-hidden="true"></svg>
            <input role="combobox" aria-label="Search commands" aria-expanded="true"
              aria-controls="target-results" aria-activedescendant="target-command-0" />
            <kbd class="lyra-kbd">esc</kbd>
          </div>
          <div class="lyra-cmdk__body" role="listbox" id="target-results">
            <div class="lyra-cmdk__group" role="group" aria-label="Projects">
              ${Array.from(
                { length: 16 },
                (_, index) => `
                  <button class="lyra-cmdk__item" role="option" aria-selected="${index === 0}"
                    id="target-command-${index}" tabindex="-1">
                    <span class="lyra-cmdk__item-label">A long project command ${index}</span>
                  </button>`,
              ).join('')}
            </div>
          </div>
        </div>`;
      host.innerHTML = modal
        ? `<div class="lyra-cmdk-overlay" style="width: 280px; right: auto">${panel}</div>`
        : panel;
      document.body.append(host);

      try {
        await Promise.all(
          host.getAnimations({ subtree: true }).map((animation) => animation.finished),
        );
        const input = host.querySelector('input');
        const list = host.querySelector<HTMLElement>('[role="listbox"]');
        const palette = host.querySelector<HTMLElement>('.lyra-cmdk');
        if (!input || !list || !palette) throw new Error('Missing CommandPalette fixture');
        const minimum = controlSize === '56px' ? 56 : 44;
        const panelRect = palette.getBoundingClientRect();
        for (const target of [input, ...host.querySelectorAll<HTMLElement>('[role="option"]')]) {
          const rect = target.getBoundingClientRect();
          expect(rect.width, `${target.role} width`).toBeGreaterThanOrEqual(44);
          expect(rect.height, `${target.role} height`).toBeGreaterThanOrEqual(minimum);
          expect(parseFloat(getComputedStyle(target).minHeight)).toBeGreaterThanOrEqual(minimum);
          expect(rect.left).toBeGreaterThanOrEqual(panelRect.left);
          expect(rect.right).toBeLessThanOrEqual(panelRect.right);
        }
        expect(palette.scrollWidth).toBeLessThanOrEqual(palette.clientWidth);
        expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
        expect(panelRect.right).toBeLessThanOrEqual(window.innerWidth);
        input.focus({ preventScroll: true });
        expect(document.activeElement).toBe(input);
        const last = host.querySelector<HTMLElement>('#target-command-15');
        if (!last) throw new Error('Missing last command');
        input.setAttribute('aria-activedescendant', last.id);
        last.scrollIntoView({ block: 'nearest' });
        expect(list.scrollTop).toBeGreaterThan(0);
        const lastRect = last.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        // Independently rounded DOMRect edges can differ after scrolling; allow only 0.001 CSS px.
        const scrollEdgePrecision = 0.001;
        expect(lastRect.top).toBeGreaterThanOrEqual(listRect.top - scrollEdgePrecision);
        expect(lastRect.bottom).toBeLessThanOrEqual(listRect.bottom + scrollEdgePrecision);
        expect(document.activeElement).toBe(input);
        expect(input.getAttribute('aria-activedescendant')).toBe(last.id);
      } finally {
        host.remove();
      }
    }
  }
};

describe('CommandPalette targets', () => {
  it('sizes actual inline and modal controls with a floor, consumer overrides and narrow layout', async () => {
    await assertCommandPaletteTargets();
  });
});
