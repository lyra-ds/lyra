import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];
const originalMatchMedia = window.matchMedia;

Alpine.plugin(lyra);

function triggerMarkup(binding = ''): string {
  return `
    <button class="lyra-input lyra-datepicker__btn" ${binding} data-testid="time-trigger">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <span :class="{ 'lyra-datepicker__ph': !hasSelection() }" x-text="triggerText()"></span>
    </button>
  `;
}

function listMarkup(): string {
  return `
    <div class="lyra-timelist" x-bind="list">
      <template x-for="time in options()" :key="time">
        <button class="lyra-timelist__item" type="button" role="option"
          :class="{ 'lyra-timelist__item--selected': time === selected }"
          :aria-selected="time === selected ? 'true' : false"
          @click="pick(time)" x-text="formatTime(time)"></button>
      </template>
    </div>
  `;
}

/** The canonical thin-coordinator composition used by consumers. */
function timePickerTemplate(options = '{}', outer = '', model = '', controls = ''): string {
  return `
    <div ${outer}>
      <div class="lyra-time-picker-root" x-data="lyraTimePicker(${options})" ${model}>
        <template x-if="!mobile">
          <div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }">
            <div class="lyra-popover-anchor lyra-datepicker" x-data="lyraPopover({ ariaLabel: 'Time picker' })" x-modelable="open" x-model="pickerOpen">
              ${triggerMarkup('x-bind="trigger"')}
              <div class="lyra-popover" x-bind="panel">${listMarkup()}</div>
            </div>
          </div>
        </template>
        <template x-if="mobile">
          <div>
            <div class="lyra-datepicker">${triggerMarkup('@click="open = true"')}</div>
            <div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }">
              <div x-data="lyraBottomSheet()" x-modelable="open" x-model="pickerOpen">
                <div class="lyra-bottomsheet-overlay" x-bind="overlay">
                  <div class="lyra-bottomsheet" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="time-picker-sheet-title" x-bind="panel">
                    <div class="lyra-bottomsheet__header">
                      <h2 id="time-picker-sheet-title" class="lyra-bottomsheet__title">Select time</h2>
                      <button class="lyra-bottomsheet__close" x-bind="close">Close</button>
                    </div>
                    <div class="lyra-bottomsheet__body">${listMarkup()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
      ${controls}
    </div>
  `;
}

function mountTimePicker(options = '{}', outer = '', model = '', controls = ''): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = timePickerTemplate(options, outer, model, controls);
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function picker(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-time-picker-root');
  if (!element) throw new Error('Expected time-picker root');
  return element;
}

function trigger(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('[data-testid="time-trigger"]');
  if (!element) throw new Error('Expected time-picker trigger');
  return element;
}

function list(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-timelist');
  if (!element) throw new Error('Expected time list');
  return element;
}

function options(host: HTMLElement): HTMLButtonElement[] {
  return Array.from(host.querySelectorAll<HTMLButtonElement>('[role="option"]'));
}

function option(host: HTMLElement, time: string): HTMLButtonElement {
  const element = options(host).find((item) => item.textContent === formatTime(time));
  if (!element) throw new Error(`Expected ${time} option`);
  return element;
}

function popover(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-popover');
  if (!element) throw new Error('Expected popover');
  return element;
}

function sheet(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-bottomsheet');
  if (!element) throw new Error('Expected bottom sheet');
  return element;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(2000, 0, 1, hours, minutes));
}

function setViewport(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Alpine.nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function expectVisible(element: HTMLElement): Promise<void> {
  await vi.waitFor(() => expect(element.style.display).not.toBe('none'), { timeout: 3000 });
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('lyraTimePicker', () => {
  it('applies labels.timeOptions to the listbox aria-label', () => {
    setViewport(false);
    const host = mountTimePicker("{ labels: { timeOptions: 'Opções de horário' } }");

    expect(list(host).getAttribute('aria-label')).toBe('Opções de horário');
  });

  it('keeps the English listbox aria-label by default', () => {
    setViewport(false);
    const host = mountTimePicker();

    expect(list(host).getAttribute('aria-label')).toBe('Time options');
  });

  it('generates inclusive options from min to max using step', () => {
    setViewport(false);
    const host = mountTimePicker("{ min: '09:00', max: '10:00', step: 20 }");
    const times = options(host).map((item) => item.textContent);

    expect(times).toEqual([
      formatTime('09:00'),
      formatTime('09:20'),
      formatTime('09:40'),
      formatTime('10:00'),
    ]);
  });

  it('renders no options when min is after max', () => {
    setViewport(false);
    const host = mountTimePicker("{ min: '10:00', max: '09:00' }");

    expect(options(host)).toHaveLength(0);
  });

  it('falls back to a 30-minute step when step is invalid', () => {
    setViewport(false);
    const host = mountTimePicker("{ min: '09:00', max: '10:00', step: 0 }");

    expect(options(host).map((item) => item.textContent)).toEqual([
      formatTime('09:00'),
      formatTime('09:30'),
      formatTime('10:00'),
    ]);
  });

  it('opens the desktop popover, selects a time, dispatches change, updates text, and closes', async () => {
    setViewport(false);
    const host = mountTimePicker("{ min: '09:00', max: '10:00', step: 30 }");
    const changes: string[] = [];
    picker(host).addEventListener('lyra:change', (event) => {
      changes.push((event as CustomEvent<{ value: string }>).detail.value);
    });

    await userEvent.click(trigger(host));
    await flush();
    await expectVisible(popover(host));

    await userEvent.click(option(host, '09:30'));
    await flush();

    expect((Alpine.$data(picker(host)) as { selected: string | null }).selected).toBe('09:30');
    expect(changes).toEqual(['09:30']);
    expect(trigger(host).textContent).toContain(formatTime('09:30'));
    await vi.waitFor(() => expect(popover(host).style.display).toBe('none'), { timeout: 3000 });
  });

  it('scrolls the selected option into view when opened', async () => {
    setViewport(false);
    const host = mountTimePicker("{ defaultValue: '23:00', min: '00:00', max: '23:30', step: 30 }");
    const selected = option(host, '23:00');
    Object.defineProperty(selected, 'offsetTop', { configurable: true, value: 500 });

    await userEvent.click(trigger(host));
    await flush();

    await vi.waitFor(() => expect(list(host).scrollTop).toBe(416), { timeout: 3000 });
  });

  it('clamps list arrow navigation and supports Home and End', async () => {
    setViewport(false);
    const host = mountTimePicker("{ min: '09:00', max: '10:00', step: 30 }");
    await userEvent.click(trigger(host));
    await flush();
    await expectVisible(popover(host));
    const items = options(host);

    items[0]?.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(items[0]);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(items[2]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[2]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(items[0]);
  });

  it('closes the mobile sheet after picking and finalizes the overlay exit', async () => {
    setViewport(true);
    const host = mountTimePicker("{ min: '09:00', max: '10:00', step: 30 }");

    await userEvent.click(trigger(host));
    await flush();
    await expectVisible(sheet(host));
    await userEvent.click(option(host, '09:30'));
    await flush();

    expect((Alpine.$data(picker(host)) as { open: boolean }).open).toBe(false);
    sheet(host).dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    const overlay = host.querySelector<HTMLElement>('.lyra-bottomsheet-overlay');
    if (!overlay) throw new Error('Expected bottom-sheet overlay');
    await vi.waitFor(() => expect(overlay.style.display).toBe('none'), { timeout: 3000 });
  });

  it('does not dispatch change for an external selected model write', async () => {
    setViewport(false);
    const host = mountTimePicker(
      "{ defaultValue: '09:00' }",
      'x-data="{ outerSelected: \'09:00\' }"',
      'x-modelable="selected" x-model="outerSelected"',
      '<button type="button" data-testid="external-selected" @click="outerSelected = \'10:30\'">Set time externally</button>',
    );
    const external = host.querySelector<HTMLButtonElement>('[data-testid="external-selected"]');
    if (!external) throw new Error('Expected external selected control');
    const changes: string[] = [];
    picker(host).addEventListener('lyra:change', (event) => {
      changes.push((event as CustomEvent<{ value: string }>).detail.value);
    });

    await userEvent.click(external);
    await flush();

    expect((Alpine.$data(picker(host)) as { selected: string | null }).selected).toBe('10:30');
    expect(trigger(host).textContent).toContain(formatTime('10:30'));
    expect(changes).toEqual([]);
  });

  it('synchronizes selected and open through x-modelable in both directions', async () => {
    setViewport(false);
    const selectedHost = mountTimePicker(
      "{ min: '09:00', max: '10:00', step: 30 }",
      'x-data="{ outerSelected: null }"',
      'x-modelable="selected" x-model="outerSelected"',
      '<button type="button" data-testid="set-selected" @click="outerSelected = \'09:30\'">Set selected</button>',
    );
    const setSelected = selectedHost.querySelector<HTMLButtonElement>(
      '[data-testid="set-selected"]',
    );
    if (!setSelected) throw new Error('Expected selected model control');

    await userEvent.click(setSelected);
    await flush();
    expect(trigger(selectedHost).textContent).toContain(formatTime('09:30'));
    await userEvent.click(trigger(selectedHost));
    await flush();
    await userEvent.click(option(selectedHost, '10:00'));
    await flush();
    expect(
      (
        Alpine.$data(selectedHost.firstElementChild as HTMLElement) as {
          outerSelected: string | null;
        }
      ).outerSelected,
    ).toBe('10:00');

    const openHost = mountTimePicker(
      '{}',
      'x-data="{ outerOpen: false }"',
      'x-modelable="open" x-model="outerOpen"',
      '<button type="button" data-testid="set-open" @click="outerOpen = true">Set open</button>',
    );
    const setOpen = openHost.querySelector<HTMLButtonElement>('[data-testid="set-open"]');
    if (!setOpen) throw new Error('Expected open model control');

    await userEvent.click(setOpen);
    await flush();
    await expectVisible(popover(openHost));
    await userEvent.click(trigger(openHost));
    await flush();
    expect(
      (Alpine.$data(openHost.firstElementChild as HTMLElement) as { outerOpen: boolean }).outerOpen,
    ).toBe(false);
  });

  it('is axe clean while closed and open', async () => {
    setViewport(false);
    const host = mountTimePicker("{ min: '09:00', max: '10:00', step: 30 }");

    await expectNoAxeViolations(host);
    await userEvent.click(trigger(host));
    await flush();
    await expectVisible(popover(host));
    await expectNoAxeViolations(host);
  });
});
