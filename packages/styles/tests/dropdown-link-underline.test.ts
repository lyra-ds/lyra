import { beforeAll, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../styles.css';

/**
 * `.lyra-menu__item` renders as an `<a>` when an item carries `href` (Dropdown, and any
 * framework binding sharing the class). The base link reset (`a { text-decoration: none }`,
 * specificity 0-0-1) used to be outranked on hover by `a:hover { text-decoration: underline }`
 * (0-1-1), which also beats a plain component/app class (0-1-0) — forcing every component to add
 * its own `:hover { text-decoration: none }` escape hatch. The root rule now reads
 * `a:where(:hover) { text-decoration: underline }`: `:where()` zeroes out `:hover`'s own
 * contribution, so the rule's specificity is `a`'s alone (0-0-1) — a source-order tie with the
 * plain `a` reset it sits right after (so it still wins on hover for a bare link), while any real
 * class selector (0-1-0 or higher) still outranks it and wins without needing a `:hover` override.
 * `.lyra-wssw__item:hover` and `.lyra-menu__item:hover` keep their explicit resets for
 * defense-in-depth, but the tests below prove the root cause is gone: a consumer class with no
 * `:hover` rule at all (the starter-laravel-demo shape) now stays underline-free.
 */

let root: HTMLElement;
let appStyle: HTMLStyleElement;

beforeAll(() => {
  document.body.innerHTML = `
    <div id="dropdown-link-underline-root">
      <div class="lyra-menu" role="menu">
        <a class="lyra-menu__item" role="menuitem" href="#" data-probe="menu-link">Open in browser</a>
      </div>
      <a href="#" data-probe="bare-link">Bare link</a>
      <a class="app-menu-item" href="#" data-probe="app-link">App link</a>
      <p class="lyra-prose">
        <a href="#" data-probe="prose-link">Prose link</a>
      </p>
    </div>`;
  root = document.getElementById('dropdown-link-underline-root')!;

  // Simulates an app-level rule with NO :hover override — e.g. starter-laravel-demo's
  // `.user-menu__item { text-decoration: none }` before 204e8ac added the hover reset.
  appStyle = document.createElement('style');
  appStyle.textContent = '.app-menu-item { text-decoration: none; }';
  document.head.appendChild(appStyle);
});

const el = (probe: string): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-probe="${probe}"]`)!;
const decoration = (probe: string): string => getComputedStyle(el(probe)).textDecorationLine;
const settle = (read: () => string) => expect.poll(read, { timeout: 2000 });

describe('.lyra-menu__item link', () => {
  it('has no underline at rest', () => {
    expect(decoration('menu-link')).toBe('none');
  });

  it('stays underline-free on hover', async () => {
    await userEvent.hover(el('menu-link'));

    await settle(() => decoration('menu-link')).toBe('none');
  });
});

describe('bare <a> with no class', () => {
  it('underlines on hover', async () => {
    expect(decoration('bare-link')).toBe('none');

    await userEvent.hover(el('bare-link'));

    await settle(() => decoration('bare-link')).toBe('underline');
  });
});

describe('app class with text-decoration:none and no :hover rule', () => {
  it('stays underline-free on hover (starter-laravel-demo shape)', async () => {
    expect(decoration('app-link')).toBe('none');

    await userEvent.hover(el('app-link'));

    await settle(() => decoration('app-link')).toBe('none');
  });
});

describe('.lyra-prose a', () => {
  it('stays underlined on hover', async () => {
    await userEvent.hover(el('prose-link'));

    await settle(() => decoration('prose-link')).toBe('underline');
  });
});
