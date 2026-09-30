import { beforeAll, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../styles.css';

/**
 * `.lyra-menu__item` renders as an `<a>` when an item carries `href` (Dropdown, and any
 * framework binding sharing the class). The base link reset (`a { text-decoration: none }`)
 * covers the resting state, but `a:hover { text-decoration: underline }` outranks a bare
 * `.lyra-menu__item` on hover ("a:hover" pseudo-class beats a plain class), so the item
 * regained an underline the moment the pointer landed on it. `.lyra-wssw__item:hover` already
 * states the override; `.lyra-menu__item:hover` needs the same explicit reset.
 */

let root: HTMLElement;

beforeAll(() => {
  document.body.innerHTML = `
    <div id="dropdown-link-underline-root">
      <div class="lyra-menu" role="menu">
        <a class="lyra-menu__item" role="menuitem" href="#" data-probe="menu-link">Open in browser</a>
      </div>
    </div>`;
  root = document.getElementById('dropdown-link-underline-root')!;
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
