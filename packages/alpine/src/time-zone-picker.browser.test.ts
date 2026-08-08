import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function timeZonePickerTemplate(
  options = '{}',
  wrapperAttributes = '',
  componentAttributes = '',
  controls = '',
): string {
  return `
    <div ${wrapperAttributes}>
      <div class="lyra-combobox lyra-tzpicker" x-data="lyraTimeZonePicker(${options})" ${componentAttributes}>
        <button class="lyra-input lyra-combobox__trigger" x-bind="trigger">
          <span x-bind="triggerValue"></span>
        </button>
        <div class="lyra-combobox__pop" x-bind="pop">
          <div class="lyra-combobox__search"><input x-bind="search" aria-label="Search time zones"></div>
          <div class="lyra-combobox__list" x-bind="list">
            <span class="lyra-combobox__empty" x-bind="empty" x-text="emptyMessage"></span>
            <template x-for="({ option, index }, filteredIndex) in filtered()" :key="option.value">
              <div>
                <template x-if="showGroup(filteredIndex)">
                  <span class="lyra-combobox__group" role="presentation" x-text="option.group"></span>
                </template>
                <button class="lyra-combobox__option" type="button" tabindex="-1" role="option"
                  :id="optionId(index)" :class="optionClass(filteredIndex)"
                  :aria-selected="optionSelected(option)" :data-time-zone-value="option.value" @mouseenter="setActive(filteredIndex)"
                  @click="pick(option)">
                  <span class="lyra-combobox__option-label"><span x-text="option.label"></span></span>
                  <span class="lyra-combobox__trailing" x-show="option.trailing" x-text="option.trailing"></span>
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
      ${controls}
    </div>
  `;
}

function mountTimeZonePicker(
  options = '{}',
  wrapperAttributes = '',
  componentAttributes = '',
  controls = '',
): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = timeZonePickerTemplate(
    options,
    wrapperAttributes,
    componentAttributes,
    controls,
  );
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function picker(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-tzpicker');
  if (!element) throw new Error('Expected time-zone picker root');
  return element;
}

function trigger(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('.lyra-combobox__trigger');
  if (!element) throw new Error('Expected time-zone picker trigger');
  return element;
}

function pop(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-combobox__pop');
  if (!element) throw new Error('Expected time-zone picker popup');
  return element;
}

function search(host: HTMLElement): HTMLInputElement {
  const element = host.querySelector<HTMLInputElement>('[role="combobox"]');
  if (!element) throw new Error('Expected time-zone picker search');
  return element;
}

function list(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('[role="listbox"]');
  if (!element) throw new Error('Expected time-zone picker list');
  return element;
}

function options(host: HTMLElement): HTMLButtonElement[] {
  return Array.from(list(host).querySelectorAll<HTMLButtonElement>('[role="option"]'));
}

function option(host: HTMLElement, value: string): HTMLButtonElement {
  const element = options(host).find((candidate) => candidate.dataset.timeZoneValue === value);
  if (!element) throw new Error(`Expected ${value} time-zone option`);
  return element;
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
  vi.useRealTimers();
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraTimeZonePicker', () => {
  it('renders the 27 curated zones in their regional groups with reference-date offsets', async () => {
    const host = mountTimeZonePicker("{ id: 'time-zone', referenceDate: '2024-01-15' }");

    await userEvent.click(trigger(host));
    await flush();

    expect(options(host)).toHaveLength(27);
    expect(
      Array.from(host.querySelectorAll('.lyra-combobox__group')).map((group) => group.textContent),
    ).toEqual(['Americas', 'Europe', 'Africa', 'Asia', 'Oceania']);
    expect(option(host, 'America/Sao_Paulo').textContent).toContain('São Paulo / Brasília (GMT-3)');
  });

  it('pins detected and deduplicated recent zones ahead of the regional list', async () => {
    const host = mountTimeZonePicker(`{
      id: 'time-zone', referenceDate: '2024-01-15', detectedZone: 'America/Sao_Paulo',
      recentZones: ['America/Sao_Paulo', 'Asia/Tokyo', 'Asia/Tokyo']
    }`);

    await userEvent.click(trigger(host));
    await flush();

    expect(
      Array.from(host.querySelectorAll('.lyra-combobox__group')).map((group) => group.textContent),
    ).toEqual(['Detected', 'Recent', 'Americas', 'Europe', 'Africa', 'Asia', 'Oceania']);
    expect(
      options(host).filter((candidate) => candidate.textContent?.includes('São Paulo / Brasília')),
    ).toHaveLength(1);
    expect(
      options(host).filter((candidate) => candidate.textContent?.includes('Tokyo')),
    ).toHaveLength(1);
  });

  it('renders a fallback label for unknown pinned zones', async () => {
    const host = mountTimeZonePicker(`{
      id: 'time-zone', referenceDate: '2024-01-15', recentZones: ['Mars/Olympus_Mons']
    }`);

    await userEvent.click(trigger(host));
    await flush();

    expect(option(host, 'Mars/Olympus_Mons').textContent).toContain('Olympus Mons ()');
  });

  it('searches curated keywords, IANA tokens, and GMT offsets', async () => {
    const host = mountTimeZonePicker("{ id: 'time-zone', referenceDate: '2024-01-15' }");
    await userEvent.click(trigger(host));
    await flush();

    await userEvent.fill(search(host), 'brasil');
    await flush();
    expect(options(host).map((candidate) => candidate.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining('São Paulo / Brasília')]),
    );

    await userEvent.fill(search(host), 'sao paulo');
    await flush();
    expect(options(host)).toHaveLength(1);
    expect(options(host)[0]?.textContent).toContain('São Paulo / Brasília');

    await userEvent.fill(search(host), 'gmt');
    await flush();
    expect(options(host)).toHaveLength(27);
  });

  it('selects IANA values and dispatches them in lyra:change', async () => {
    const host = mountTimeZonePicker("{ id: 'time-zone', referenceDate: '2024-01-15' }");
    const changes: string[] = [];
    picker(host).addEventListener('lyra:change', (event) => {
      changes.push((event as CustomEvent<{ value: string }>).detail.value);
    });

    await userEvent.click(trigger(host));
    await flush();
    await userEvent.click(option(host, 'America/Sao_Paulo'));
    await flush();

    expect((Alpine.$data(picker(host)) as { value: string }).value).toBe('America/Sao_Paulo');
    expect(changes).toEqual(['America/Sao_Paulo']);
  });

  it('synchronizes modelable value in both directions', async () => {
    const host = mountTimeZonePicker(
      "{ id: 'time-zone', referenceDate: '2024-01-15' }",
      'x-data="{ outerValue: \'Asia/Tokyo\' }"',
      'x-modelable="value" x-model="outerValue"',
      '<button type="button" data-testid="set-value" @click="outerValue = \'America/Sao_Paulo\'">Set value</button>',
    );
    const external = host.querySelector<HTMLButtonElement>('[data-testid="set-value"]');
    if (!external) throw new Error('Expected external value control');

    await userEvent.click(external);
    await flush();
    expect(trigger(host).textContent).toContain('São Paulo / Brasília (GMT-3)');

    await userEvent.click(trigger(host));
    await flush();
    await userEvent.click(option(host, 'Asia/Tokyo'));
    await flush();
    expect(
      (Alpine.$data(host.firstElementChild as HTMLElement) as { outerValue: string }).outerValue,
    ).toBe('Asia/Tokyo');
  });

  it('re-derives trailing local times each minute and stops after destroy', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    const host = mountTimeZonePicker(
      "{ id: 'time-zone', zones: [{ value: 'UTC', label: 'UTC', region: 'World' }] }",
    );
    const state = Alpine.$data(picker(host)) as { clockTick: number };
    const before = state.clockTick;
    const beforeTrailing = option(host, 'UTC').querySelector(
      '.lyra-combobox__trailing',
    )?.textContent;

    await vi.advanceTimersByTimeAsync(60_000);
    await Alpine.nextTick();
    expect(state.clockTick).toBe(before + 1);
    expect(option(host, 'UTC').querySelector('.lyra-combobox__trailing')?.textContent).not.toBe(
      beforeTrailing,
    );

    Alpine.destroyTree(host);
    const destroyedAt = state.clockTick;
    mountedHosts.splice(mountedHosts.indexOf(host), 1);
    host.remove();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(state.clockTick).toBe(destroyedAt);
  });

  it('uses supplied zones instead of the curated list and is axe clean open', async () => {
    const host = mountTimeZonePicker(`{
      id: 'time-zone', referenceDate: '2024-01-15', labels: {
        placeholder: 'Choose a zone', searchPlaceholder: 'Find a place', emptyMessage: 'Nothing found'
      },
      zones: [{ value: 'Europe/London', label: 'London', region: 'Europe' }]
    }`);

    expect(trigger(host).textContent).toContain('Choose a zone');
    await userEvent.click(trigger(host));
    await flush();
    await expectVisible(pop(host));
    expect(search(host).placeholder).toBe('Find a place');
    expect(options(host)).toHaveLength(1);
    expect(option(host, 'Europe/London').textContent).toContain('London (GMT');
    await expectNoAxeViolations(host);
    await userEvent.fill(search(host), 'missing');
    await flush();
    expect(host.querySelector('.lyra-combobox__empty')?.textContent).toBe('Nothing found');
  });
});
