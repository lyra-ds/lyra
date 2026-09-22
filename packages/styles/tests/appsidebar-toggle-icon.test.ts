import { beforeAll, describe, expect, it } from 'vitest';
import '../styles.css';

/**
 * The AppSidebar collapse toggle draws only its frame in CSS; every wrapper (React, Alpine, Blade)
 * injects a chevron `<svg>` for the mark. A CSS-only consumer that left the button empty used to see
 * a bare 28×28 bordered box with no affordance. `.lyra-appsidebar__toggle:not(:has(svg))::before`
 * ships a fallback chevron that appears ONLY when no icon was injected, so:
 *
 *   - an empty toggle renders the fallback glyph (a generated `::before` with a mask image), while
 *   - a wrapper-rendered toggle (holding an `<svg>`) draws no `::before`, so no duplicate mark.
 *
 * Before the fallback rule existed, the empty toggle's `::before` was `content: none` — this suite
 * fails there and passes once the rule ships.
 */
let root: HTMLElement;

beforeAll(() => {
  document.body.innerHTML = `
    <nav class="lyra-appsidebar" id="appsidebar-toggle-root">
      <button class="lyra-appsidebar__toggle" data-probe="empty" type="button"
              aria-label="Collapse sidebar"></button>
      <button class="lyra-appsidebar__toggle" data-probe="withicon" type="button"
              aria-label="Collapse sidebar">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
      </button>
    </nav>`;
  root = document.querySelector<HTMLElement>('#appsidebar-toggle-root')!;
});

const probe = (name: string) =>
  root.querySelector<HTMLButtonElement>(`.lyra-appsidebar__toggle[data-probe="${name}"]`)!;

const maskOf = (style: CSSStyleDeclaration) =>
  style.maskImage && style.maskImage !== 'none' ? style.maskImage : style.webkitMaskImage;

describe('AppSidebar collapse toggle — CSS-only fallback glyph', () => {
  it('draws a fallback chevron when the button is empty (no injected svg)', () => {
    const before = getComputedStyle(probe('empty'), '::before');
    expect(before.content).toBe('""');
    expect(maskOf(before)).toContain('url(');
  });

  it('draws no ::before glyph when a wrapper injected an svg (no duplicate mark)', () => {
    const before = getComputedStyle(probe('withicon'), '::before');
    expect(before.content).toBe('none');
  });

  it('flips the fallback chevron horizontally in the rail variant', () => {
    document.body.innerHTML = `
      <nav class="lyra-appsidebar lyra-appsidebar--rail" id="appsidebar-rail-root">
        <button class="lyra-appsidebar__toggle" data-probe="rail-empty" type="button"
                aria-label="Expand sidebar"></button>
      </nav>`;
    const railRoot = document.querySelector<HTMLElement>('#appsidebar-rail-root')!;
    const railEmpty = railRoot.querySelector<HTMLButtonElement>('.lyra-appsidebar__toggle')!;
    const before = getComputedStyle(railEmpty, '::before');
    // scaleX(-1) resolves to the matrix form matrix(-1, 0, 0, 1, 0, 0).
    expect(before.transform).toBe('matrix(-1, 0, 0, 1, 0, 0)');
  });
});
