import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import '../styles.css';

let host: HTMLElement | undefined;
afterEach(async () => {
  host?.remove();
  document.documentElement.removeAttribute('data-theme');
  await page.viewport(1024, 768);
});

describe('owned toast focus fallback', () => {
  for (const theme of ['light', 'dark']) {
    for (const populated of [false, true]) {
      it.each([320, 1280])(
        `is perceivable and bounded in ${theme}, populated=${populated}, width=%s`,
        async (width) => {
          await page.viewport(width, 720);
          document.documentElement.setAttribute('data-theme', theme);
          host = document.createElement('div');
          host.innerHTML = `<div class="lyra-toast-stack" role="region" tabindex="-1" aria-label="Notifications">
          <div aria-live="polite" aria-relevant="additions" style="display: contents">${populated ? '<div class="lyra-toast">Saved</div>' : ''}</div>
          <div aria-live="assertive" aria-relevant="additions" style="display: contents"></div>
        </div>`;
          document.body.append(host);
          const group = page.getByRole('region', { name: 'Notifications' });
          await expect.element(group).toBeInTheDocument();
          group.element().focus();
          await expect.element(group).toHaveFocus();
          const rect = group.element().getBoundingClientRect();
          const style = getComputedStyle(group.element());
          expect(rect.width).toBeGreaterThanOrEqual(44);
          expect(rect.height).toBeGreaterThanOrEqual(44);
          expect(rect.left).toBeGreaterThanOrEqual(0);
          expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
          expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
          expect(style.outlineStyle).toBe('solid');
          expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
          expect(style.outlineColor).not.toBe(style.backgroundColor);
          expect(group.element().hasAttribute('aria-live')).toBe(false);
        },
      );
    }
  }
});
