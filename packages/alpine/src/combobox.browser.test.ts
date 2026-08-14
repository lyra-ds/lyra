import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

const options = [
  { value: 'br', label: 'Brazil', hint: 'South America', group: 'Americas', keywords: 'brasil' },
  { value: 'ca', label: 'Canada', group: 'Americas' },
  { value: 'jp', label: 'Japan', group: 'Asia' },
  { value: 'sao', label: 'São Paulo', group: 'South America' },
];

function comboboxTemplate(
  optionExpression = JSON.stringify({ options }),
  wrapperAttributes = '',
  componentAttributes = '',
  extraMarkup = '',
): string {
  return `
    <div ${wrapperAttributes}>
      <div class="lyra-field">
        <label class="lyra-label" for="country-combobox">Country</label>
        <div class="lyra-combobox" x-data='lyraCombobox(${optionExpression})' ${componentAttributes}>
          <button class="lyra-input lyra-combobox__trigger" x-bind="trigger">
            <span x-bind="triggerValue"></span>
          </button>
          <div class="lyra-combobox__pop" x-bind="pop">
            <div class="lyra-combobox__search">
              <input x-bind="search" aria-label="Search countries">
            </div>
            <div class="lyra-combobox__list" x-bind="list">
              <span class="lyra-combobox__empty" x-bind="empty" x-text="emptyMessage"></span>
              <template x-for="({ option, index }, filteredIndex) in filtered()" :key="option.value">
                <div>
                  <template x-if="showGroup(filteredIndex)">
                    <span class="lyra-combobox__group" role="presentation" x-text="option.group"></span>
                  </template>
                  <button class="lyra-combobox__option" :id="optionId(index)" :class="optionClass(filteredIndex)"
                    :aria-selected="optionSelected(option)" type="button" tabindex="-1" role="option"
                    @mouseenter="setActive(filteredIndex)" @click="pick(option)">
                    <span class="lyra-combobox__option-label">
                      <span x-text="option.label"></span>
                      <span class="lyra-combobox__option-hint" x-show="option.hint" x-text="option.hint"></span>
                    </span>
                    <span class="lyra-combobox__trailing" x-show="option.value === 'jp'">21:30</span>
                  </button>
                </div>
              </template>
            </div>
          </div>
          ${extraMarkup}
        </div>
      </div>
    </div>
  `;
}

function mountCombobox(
  optionExpression = JSON.stringify({ options, id: 'country-combobox' }),
  wrapperAttributes = '',
  componentAttributes = '',
  extraMarkup = '',
): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = comboboxTemplate(
    optionExpression,
    wrapperAttributes,
    componentAttributes,
    extraMarkup,
  );
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function root(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-combobox');
  if (!element) throw new Error('Expected combobox root');
  return element;
}

function trigger(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('.lyra-combobox__trigger');
  if (!element) throw new Error('Expected combobox trigger');
  return element;
}

function pop(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-combobox__pop');
  if (!element) throw new Error('Expected combobox pop');
  return element;
}

function search(host: HTMLElement): HTMLInputElement {
  const element = host.querySelector<HTMLInputElement>('[role="combobox"]');
  if (!element) throw new Error('Expected combobox search');
  return element;
}

function list(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('[role="listbox"]');
  if (!element) throw new Error('Expected combobox listbox');
  return element;
}

function visibleOptions(host: HTMLElement): HTMLButtonElement[] {
  return Array.from(list(host).querySelectorAll<HTMLButtonElement>('[role="option"]'));
}

async function flush(): Promise<void> {
  await Alpine.nextTick();
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraCombobox', () => {
  it('toggles ARIA, reveals the pop, and moves focus to the search input', async () => {
    const host = mountCombobox();

    expect(trigger(host).getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(trigger(host));
    await flush();

    expect(trigger(host).getAttribute('aria-expanded')).toBe('true');
    expect(pop(host).style.display).not.toBe('none');
    expect(document.activeElement).toBe(search(host));
  });

  it('keeps focus on search while clamped arrows, Home, and End change original-index descendants', async () => {
    const host = mountCombobox();
    await userEvent.click(trigger(host));
    await flush();
    const input = search(host);

    expect(input.getAttribute('aria-activedescendant')).toBe('country-combobox-option-0');
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-activedescendant')).toBe('country-combobox-option-1');
    expect(visibleOptions(host)[1]?.classList).toContain('lyra-combobox__option--active');
    await userEvent.keyboard('{End}{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe('country-combobox-option-3');
    await userEvent.keyboard('{Home}{ArrowUp}');
    expect(input.getAttribute('aria-activedescendant')).toBe('country-combobox-option-0');
  });

  it('filters labels and invisible keywords accent-insensitively, preserving original option ids', async () => {
    const host = mountCombobox();
    await userEvent.click(trigger(host));
    await flush();
    const input = search(host);

    await userEvent.fill(input, 'brasil');
    await flush();
    expect(visibleOptions(host).map((option) => option.id)).toEqual(['country-combobox-option-0']);
    expect(list(host).textContent).not.toContain('brasil');

    await userEvent.fill(input, 'sao');
    await flush();
    expect(visibleOptions(host).map((option) => option.id)).toEqual(['country-combobox-option-3']);
    expect(input.getAttribute('aria-activedescendant')).toBe('country-combobox-option-3');

    await userEvent.fill(input, 'a');
    await userEvent.keyboard('{End}');
    await userEvent.fill(input, 'ca');
    await flush();
    expect(input.getAttribute('aria-activedescendant')).toBe('country-combobox-option-1');

    await userEvent.fill(input, '');
    await flush();
    expect(visibleOptions(host)).toHaveLength(4);
  });

  it('shows its empty message and only renders group headings at contiguous group boundaries', async () => {
    const host = mountCombobox();
    await userEvent.click(trigger(host));
    await flush();

    expect(
      Array.from(host.querySelectorAll('.lyra-combobox__group')).map((group) => group.textContent),
    ).toEqual(['Americas', 'Asia', 'South America']);
    expect(host.querySelector('.lyra-combobox__trailing')?.textContent).toBe('21:30');

    await userEvent.fill(search(host), 'jap');
    await flush();
    expect(
      Array.from(host.querySelectorAll('.lyra-combobox__group')).map((group) => group.textContent),
    ).toEqual(['Asia']);

    await userEvent.fill(search(host), 'missing');
    await flush();
    expect(host.querySelector<HTMLElement>('.lyra-combobox__empty')?.style.display).not.toBe(
      'none',
    );
    expect(host.querySelector('.lyra-combobox__empty')?.textContent).toBe('No results.');
    expect(search(host).hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('selects by Enter and click, closes, restores focus, and emits its selected option', async () => {
    const host = mountCombobox();
    const changes: Array<{ value: string; option: (typeof options)[number] }> = [];
    root(host).addEventListener('lyra:change', (event) => {
      changes.push(
        (event as CustomEvent<{ value: string; option: (typeof options)[number] }>).detail,
      );
    });

    await userEvent.click(trigger(host));
    await flush();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await flush();
    expect((Alpine.$data(root(host)) as { value: string }).value).toBe('ca');
    expect(trigger(host).textContent).toContain('Canada');
    expect(pop(host).style.display).toBe('none');
    expect(document.activeElement).toBe(trigger(host));
    expect(changes).toEqual([{ value: 'ca', option: options[1] }]);

    await userEvent.click(trigger(host));
    await flush();
    await userEvent.click(visibleOptions(host)[2]!);
    await flush();
    expect((Alpine.$data(root(host)) as { value: string }).value).toBe('jp');
    expect(changes).toEqual([
      { value: 'ca', option: options[1] },
      { value: 'jp', option: options[2] },
    ]);
  });

  it('closes with Escape or outside mousedown without dispatching and follows aria-selected', async () => {
    const host = mountCombobox(JSON.stringify({ options, id: 'country-combobox', value: 'jp' }));
    const changes: unknown[] = [];
    root(host).addEventListener('lyra:change', (event) => changes.push(event));
    expect(
      visibleOptions(host).find((option) => option.getAttribute('aria-selected') === 'true')?.id,
    ).toBe('country-combobox-option-2');

    await userEvent.click(trigger(host));
    await flush();
    await userEvent.keyboard('{Escape}');
    await flush();
    expect(pop(host).style.display).toBe('none');
    expect(document.activeElement).toBe(trigger(host));
    expect(changes).toEqual([]);

    await userEvent.click(trigger(host));
    await flush();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await flush();
    expect(pop(host).style.display).toBe('none');
    expect(changes).toEqual([]);
  });

  it('flips the popup upward when its measured height does not fit below the trigger', async () => {
    const host = mountCombobox();
    const control = trigger(host);
    const popup = pop(host);
    Object.defineProperty(popup, 'offsetHeight', { configurable: true, value: 120 });
    vi.spyOn(control, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, window.innerHeight - 30, 100, 20),
    );

    await userEvent.click(control);
    await flush();

    expect(popup.classList).toContain('lyra-combobox__pop--up');
  });

  it('moves the active descendant on mouseenter and scrolls a long list into view', async () => {
    const longOptions = Array.from({ length: 12 }, (_, index) => ({
      value: String(index),
      label: `Option ${index}`,
    }));
    const host = mountCombobox(JSON.stringify({ options: longOptions, id: 'country-combobox' }));
    await userEvent.click(trigger(host));
    await flush();
    const items = visibleOptions(host);
    const target = items[10]!;
    Object.defineProperties(list(host), {
      scrollTop: { configurable: true, value: 0, writable: true },
    });
    vi.spyOn(list(host), 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 100, 200, 100));
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 340, 200, 24));

    target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await flush();
    expect(search(host).getAttribute('aria-activedescendant')).toBe('country-combobox-option-10');
    await vi.waitFor(() => expect(list(host).scrollTop).toBe(164), { timeout: 3000 });
  });

  it('does not scroll an already visible hovered option from nested offset coordinates', async () => {
    const host = mountCombobox();
    await userEvent.click(trigger(host));
    await flush();
    const option = visibleOptions(host)[2]!;
    const optionsList = list(host);
    Object.defineProperties(optionsList, {
      clientHeight: { configurable: true, value: 100 },
      scrollTop: { configurable: true, value: 0, writable: true },
    });
    Object.defineProperties(option, {
      offsetTop: { configurable: true, value: 140 },
      offsetHeight: { configurable: true, value: 24 },
    });
    vi.spyOn(optionsList, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 100, 200, 100));
    vi.spyOn(option, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 140, 200, 24));

    option.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await flush();

    expect(optionsList.scrollTop).toBe(0);
  });

  it('synchronizes value and open through x-modelable in both directions without external change events', async () => {
    const valueHost = mountCombobox(
      JSON.stringify({ options, id: 'country-combobox' }),
      'x-data="{ outerValue: \'br\', outerOpen: false }"',
      'x-modelable="value" x-model="outerValue"',
      '<button type="button" data-testid="set-value" @click="outerValue = \'jp\'">Set value</button><button type="button" data-testid="set-open" @click="outerOpen = true">Set open</button>',
    );
    const picker = root(valueHost);
    const changes: unknown[] = [];
    picker.addEventListener('lyra:change', (event) => changes.push(event));
    const setValue = valueHost.querySelector<HTMLButtonElement>('[data-testid="set-value"]');
    if (!setValue) throw new Error('Expected external value control');

    await userEvent.click(setValue);
    await flush();
    expect(trigger(valueHost).textContent).toContain('Japan');
    expect(
      visibleOptions(valueHost).find((option) => option.getAttribute('aria-selected') === 'true')
        ?.id,
    ).toBe('country-combobox-option-2');
    expect(changes).toEqual([]);

    await userEvent.click(trigger(valueHost));
    await flush();
    await userEvent.click(visibleOptions(valueHost)[1]!);
    await flush();
    expect(
      (Alpine.$data(valueHost.firstElementChild as HTMLElement) as { outerValue: string })
        .outerValue,
    ).toBe('ca');

    const openHost = mountCombobox(
      JSON.stringify({ options, id: 'open-combobox' }),
      'x-data="{ outerOpen: false }"',
      'x-modelable="open" x-model="outerOpen"',
      '<button type="button" data-testid="set-open" @click="outerOpen = true">Set open</button>',
    );
    const setOpen = openHost.querySelector<HTMLButtonElement>('[data-testid="set-open"]');
    if (!setOpen) throw new Error('Expected external open control');
    await userEvent.click(setOpen);
    await flush();
    expect(pop(openHost).style.display).not.toBe('none');
    await userEvent.click(trigger(openHost));
    await flush();
    expect(
      (Alpine.$data(openHost.firstElementChild as HTMLElement) as { outerOpen: boolean }).outerOpen,
    ).toBe(false);
  });

  it('is axe clean while closed and open', async () => {
    const host = mountCombobox();
    await expectNoAxeViolations(host);
    await userEvent.click(trigger(host));
    await flush();
    expect(pop(host).style.display).not.toBe('none');
    await expectNoAxeViolations(host);
  });
});
