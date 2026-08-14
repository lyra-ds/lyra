import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

const groups = [
  {
    label: 'Actions',
    items: [
      { id: 'new', label: 'New file', hint: 'Create a document', shortcut: '⌘ N' },
      { id: 'settings', label: 'Settings', hint: 'Configure workspace', shortcut: '⌘ ,' },
    ],
  },
  { label: 'Navigation', items: [{ id: 'home', label: 'Go home', hint: 'Open dashboard' }] },
];

function panelMarkup(): string {
  return `
    <div class="lyra-cmdk" x-bind="panel">
      <div class="lyra-cmdk__search">
        <svg class="lyra-cmdk-trigger__icon" aria-hidden="true" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>
        </svg>
        <input x-bind="search">
        <kbd class="lyra-kbd">esc</kbd>
      </div>
      <div class="lyra-cmdk__body" x-bind="list">
        <p class="lyra-cmdk__empty" x-bind="empty" x-text="emptyText()"></p>
        <template x-for="group in visibleGroups()" :key="group.index">
          <div class="lyra-cmdk__group" role="group" :aria-labelledby="groupLabelledby(group)">
            <template x-if="group.label">
              <span class="lyra-cmdk__group-label" :id="groupLabelId(group)" x-text="group.label"></span>
            </template>
            <template x-for="entry in group.items" :key="entry.item.id">
              <button class="lyra-cmdk__item" x-bind="item(entry.index)" :id="optionId(entry.index)"
                :class="itemClass(entry.index)" :aria-selected="isActive(entry.index) ? 'true' : 'false'"
                @mouseenter="setActive(entry.index)" @click="pick(entry.item)">
                <span class="lyra-cmdk__item-icon"><!-- consumer icon template slot --></span>
                <span class="lyra-cmdk__item-label" x-text="entry.item.label"></span>
                <span class="lyra-cmdk__item-hint" x-show="entry.item.hint" x-text="entry.item.hint"></span>
                <span class="lyra-cmdk__shortcut" x-show="entry.item.shortcut">
                  <kbd class="lyra-kbd" x-text="entry.item.shortcut"></kbd>
                </span>
              </button>
            </template>
          </div>
        </template>
      </div>
      <div class="lyra-cmdk__footer">
        <span><kbd class="lyra-kbd">↑</kbd><kbd class="lyra-kbd">↓</kbd> <span x-text="hints.navigate"></span></span>
        <span><kbd class="lyra-kbd">↵</kbd> <span x-text="hints.select"></span></span>
        <span><kbd class="lyra-kbd">esc</kbd> <span x-text="hints.close"></span></span>
      </div>
    </div>
  `;
}

/** The canonical consumer template: overlay mode serves every structural element. */
function commandPaletteTemplate(
  options = JSON.stringify({ groups }),
  wrapperAttributes = '',
  componentAttributes = '',
  extraMarkup = '',
): string {
  return `
    <div ${wrapperAttributes}>
      <div class="lyra-command-palette" x-data='lyraCommandPalette(${options})' ${componentAttributes}>
        <button type="button" data-testid="opener" @click="open = true">Open</button>
        <button type="button" data-testid="background">Background</button>
        <div class="lyra-cmdk-overlay" x-bind="overlay">${panelMarkup()}</div>
        ${extraMarkup}
      </div>
    </div>
  `;
}

/** The canonical inline template deliberately has no overlay. */
function inlineCommandPaletteTemplate(options = JSON.stringify({ groups, inline: true })): string {
  return `
    <div class="lyra-command-palette" x-data='lyraCommandPalette(${options})'>
      ${panelMarkup()}
    </div>
  `;
}

function mountCommandPalette(
  options = JSON.stringify({ groups }),
  wrapperAttributes = '',
  componentAttributes = '',
  extraMarkup = '',
): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = commandPaletteTemplate(
    options,
    wrapperAttributes,
    componentAttributes,
    extraMarkup,
  );
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function mountInlineCommandPalette(
  options = JSON.stringify({ groups, inline: true }),
): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = inlineCommandPaletteTemplate(options);
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function root(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-command-palette');
  if (!element) throw new Error('Expected command palette root');
  return element;
}

function overlay(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-cmdk-overlay');
  if (!element) throw new Error('Expected command palette overlay');
  return element;
}

function panel(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-cmdk');
  if (!element) throw new Error('Expected command palette panel');
  return element;
}

function search(host: HTMLElement): HTMLInputElement {
  const element = host.querySelector<HTMLInputElement>('[role="combobox"]');
  if (!element) throw new Error('Expected command palette search input');
  return element;
}

function list(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('[role="listbox"]');
  if (!element) throw new Error('Expected command palette listbox');
  return element;
}

function options(host: HTMLElement): HTMLButtonElement[] {
  return Array.from(host.querySelectorAll<HTMLButtonElement>('[role="option"]'));
}

function opener(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('[data-testid="opener"]');
  if (!element) throw new Error('Expected command palette opener');
  return element;
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Alpine.nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function openPalette(host: HTMLElement): Promise<void> {
  const control = opener(host);
  control.focus();
  await userEvent.click(control);
  await flush();
  await vi.waitFor(() => expect(overlay(host).style.display).not.toBe('none'), { timeout: 3000 });
  await vi.waitFor(() => expect(document.activeElement).toBe(search(host)), { timeout: 3000 });
}

async function finishExit(host: HTMLElement): Promise<void> {
  panel(host).dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
  await vi.waitFor(() => expect(overlay(host).style.display).toBe('none'), { timeout: 3000 });
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('lyraCommandPalette', () => {
  it('mounts the overlay, focuses the input, resets query and active state, and restores its opener', async () => {
    const host = mountCommandPalette();
    await openPalette(host);

    expect(panel(host).getAttribute('role')).toBe('dialog');
    expect(panel(host).getAttribute('aria-modal')).toBe('true');
    expect(panel(host).getAttribute('aria-label')).toBe('Command palette');
    expect(document.body.style.overflow).toBe('hidden');
    await userEvent.fill(search(host), 'settings');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Escape}');
    await flush();
    await vi.waitFor(() => expect(document.activeElement).toBe(opener(host)), { timeout: 3000 });
    expect(document.body.style.overflow).toBe('hidden');
    await finishExit(host);
    expect(document.body.style.overflow).toBe('');

    await openPalette(host);
    expect(search(host).value).toBe('');
    expect(search(host).getAttribute('aria-activedescendant')).toBe(options(host)[0]?.id);
  });

  it('traps Tab inside the panel while open', async () => {
    const host = mountCommandPalette();
    await openPalette(host);

    const input = search(host);
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(input);
  });

  it('navigates the flat filtered index across groups, clamps both ends, and marks only it selected', async () => {
    const host = mountCommandPalette();
    await openPalette(host);
    const input = search(host);
    const items = options(host);

    expect(input.getAttribute('aria-activedescendant')).toBe(items[0]?.id);
    expect(items[0]?.getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{ArrowUp}');
    expect(input.getAttribute('aria-activedescendant')).toBe(items[0]?.id);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe(items[2]?.id);
    expect(items[2]?.classList).toContain('lyra-cmdk__item--active');
    expect(items[0]?.getAttribute('aria-selected')).toBe('false');
    expect(items[2]?.getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe(items[2]?.id);
  });

  it('filters labels and hints case-insensitively, omits empty groups, and quotes empty results', async () => {
    const host = mountCommandPalette();
    await openPalette(host);

    await userEvent.fill(search(host), 'WORKSPACE');
    await flush();
    expect(options(host)).toHaveLength(1);
    expect(options(host)[0]?.textContent).toContain('Settings');
    expect(host.querySelectorAll('.lyra-cmdk__group')).toHaveLength(1);
    expect(search(host).getAttribute('aria-activedescendant')).toBe(options(host)[0]?.id);

    await userEvent.fill(search(host), 'nothing');
    await flush();
    expect(options(host)).toHaveLength(0);
    expect(search(host).hasAttribute('aria-activedescendant')).toBe(false);
    expect(host.querySelector<HTMLElement>('.lyra-cmdk__empty')?.textContent).toBe(
      'No results for “nothing”.',
    );
  });

  it('uses configured dialog and search labels and merges partial footer hints', async () => {
    const host = mountCommandPalette(
      JSON.stringify({
        groups,
        label: 'Paleta de comandos',
        searchLabel: 'Pesquisar comandos',
        hints: { navigate: 'navegar' },
      }),
    );
    await openPalette(host);

    expect(panel(host).getAttribute('aria-label')).toBe('Paleta de comandos');
    expect(search(host).getAttribute('aria-label')).toBe('Pesquisar comandos');
    expect(panel(host).querySelector('.lyra-cmdk__footer')?.textContent).toContain('navegar');
    expect(panel(host).querySelector('.lyra-cmdk__footer')?.textContent).toContain('select');
    expect(panel(host).querySelector('.lyra-cmdk__footer')?.textContent).toContain('close');
  });

  it('scrolls the active descendant into the list viewport', async () => {
    const longGroups = [
      {
        items: Array.from({ length: 12 }, (_, index) => ({
          id: String(index),
          label: `Command ${index}`,
        })),
      },
    ];
    const host = mountCommandPalette(JSON.stringify({ groups: longGroups }));
    await openPalette(host);
    const target = options(host)[10];
    if (!target) throw new Error('Expected tenth command item');
    const commandList = list(host);
    Object.defineProperties(commandList, {
      scrollTop: { configurable: true, value: 0, writable: true },
    });
    vi.spyOn(commandList, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 100, 200, 100));
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 340, 200, 24));

    target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await flush();
    expect(search(host).getAttribute('aria-activedescendant')).toBe(target.id);
    await vi.waitFor(() => expect(commandList.scrollTop).toBe(164), { timeout: 3000 });
  });

  it('selects by Enter and click, dispatches the item, then closes in overlay mode', async () => {
    const host = mountCommandPalette();
    const selected: Array<(typeof groups)[number]['items'][number]> = [];
    root(host).addEventListener('lyra:select', (event) => {
      selected.push(
        (event as CustomEvent<{ item: (typeof groups)[number]['items'][number] }>).detail.item,
      );
    });
    await openPalette(host);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await flush();
    expect(selected).toEqual([groups[0]!.items[1]]);
    expect(overlay(host).classList).toContain('lyra-cmdk-overlay--closing');
    await finishExit(host);

    await openPalette(host);
    await userEvent.click(options(host)[2]!);
    await flush();
    expect(selected).toEqual([groups[0]!.items[1], groups[1]!.items[0]]);
    expect(overlay(host).classList).toContain('lyra-cmdk-overlay--closing');
  });

  it('closes on Escape without selecting and only dismisses overlay clicks on the overlay itself', async () => {
    const host = mountCommandPalette();
    const selected: unknown[] = [];
    root(host).addEventListener('lyra:select', (event) => selected.push(event));
    await openPalette(host);

    panel(host).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await flush();
    expect(overlay(host).classList).not.toContain('lyra-cmdk-overlay--closing');
    overlay(host).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await flush();
    expect(overlay(host).classList).toContain('lyra-cmdk-overlay--closing');
    expect(selected).toEqual([]);
    await finishExit(host);

    await openPalette(host);
    await userEvent.keyboard('{Escape}');
    await flush();
    expect(overlay(host).classList).toContain('lyra-cmdk-overlay--closing');
    expect(selected).toEqual([]);
  });

  it('toggles with the default and custom global hotkeys, and removes the listener on destroy', async () => {
    const host = mountCommandPalette();
    const defaultOpen = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      metaKey: true,
      key: 'K',
    });
    document.dispatchEvent(defaultOpen);
    await flush();
    expect(defaultOpen.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(overlay(host).style.display).not.toBe('none'), { timeout: 3000 });
    document.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ctrlKey: true, key: 'k' }),
    );
    await flush();
    expect(overlay(host).classList).toContain('lyra-cmdk-overlay--closing');
    await finishExit(host);

    const custom = mountCommandPalette(JSON.stringify({ groups, hotkey: 'p' }));
    document.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ctrlKey: true, key: 'k' }),
    );
    await flush();
    expect(overlay(custom).style.display).toBe('none');
    document.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ctrlKey: true, key: 'p' }),
    );
    await flush();
    await vi.waitFor(() => expect(overlay(custom).style.display).not.toBe('none'), {
      timeout: 3000,
    });
    const customData = Alpine.$data(root(custom)) as { open: boolean };
    Alpine.destroyTree(root(custom));
    document.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ctrlKey: true, key: 'p' }),
    );
    await flush();
    expect(customData.open).toBe(true);
  });

  it('does not render modal behavior in inline mode and selects without closing or a hotkey', async () => {
    const host = mountInlineCommandPalette();
    const selected: unknown[] = [];
    root(host).addEventListener('lyra:select', (event) => selected.push(event));
    await vi.waitFor(() => expect(document.activeElement).toBe(search(host)), { timeout: 3000 });

    expect(host.querySelector('.lyra-cmdk-overlay')).toBeNull();
    expect(panel(host).hasAttribute('role')).toBe(false);
    expect(panel(host).hasAttribute('aria-modal')).toBe(false);
    expect(document.body.style.overflow).toBe('');
    document.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ctrlKey: true, key: 'k' }),
    );
    await flush();
    expect(document.body.style.overflow).toBe('');
    await userEvent.fill(search(host), 'home');
    await userEvent.keyboard('{Enter}');
    await flush();
    expect(selected).toHaveLength(1);
    expect(panel(host).style.display).not.toBe('none');
  });

  it('synchronizes modelable open state in both directions', async () => {
    const host = mountCommandPalette(
      JSON.stringify({ groups }),
      'x-data="{ outerOpen: false }"',
      'x-modelable="open" x-model="outerOpen"',
      '<button type="button" data-testid="external-open" @click="outerOpen = true">Open externally</button>',
    );
    const external = host.querySelector<HTMLButtonElement>('[data-testid="external-open"]');
    if (!external) throw new Error('Expected external open control');

    await userEvent.click(external);
    await flush();
    await vi.waitFor(() => expect(overlay(host).style.display).not.toBe('none'), { timeout: 3000 });
    await userEvent.keyboard('{Escape}');
    await flush();
    expect(
      (Alpine.$data(host.firstElementChild as HTMLElement) as { outerOpen: boolean }).outerOpen,
    ).toBe(false);
  });

  it('is axe clean in its open overlay and inline states', async () => {
    const overlayHost = mountCommandPalette();
    await openPalette(overlayHost);
    await expectNoAxeViolations(overlayHost);

    const inlineHost = mountInlineCommandPalette();
    await expectNoAxeViolations(inlineHost);
  });
});
