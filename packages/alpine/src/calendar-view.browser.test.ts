import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

Alpine.plugin(lyra);
const hosts: HTMLElement[] = [];

function markup(options: string): string {
  return `<div class="lyra-calview" x-data="lyraCalendarView(${options})">
    <div class="lyra-calview__toolbar">
      <button class="lyra-calview__nav" type="button" :aria-label="label('previous')" @click="navigate(-1)">‹</button>
      <button class="lyra-calview__nav" type="button" :aria-label="label('today')" :title="label('today')" @click="setDate(new Date())">●</button>
      <button class="lyra-calview__nav" type="button" :aria-label="label('next')" @click="navigate(1)">›</button>
      <span class="lyra-calview__title" x-text="title()"></span>
      <span class="lyra-calview__seg" role="group" :aria-label="label('view')">
        <button type="button" :aria-pressed="view === 'day'" @click="setView('day')" x-text="label('day')"></button>
        <button type="button" :aria-pressed="view === 'week'" @click="setView('week')" x-text="label('week')"></button>
        <button type="button" :aria-pressed="view === 'month'" @click="setView('month')" x-text="label('month')"></button>
      </span>
      <span data-testid="actions">Actions</span>
    </div>
    <div x-show="view !== 'month'">
      <div class="lyra-calview__head" :style="gridStyle()"><span></span>
        <template x-for="day in days()" :key="day.key"><span class="lyra-calview__head-cell" :class="dayClass(day)" ><span x-text="weekdayLabel(day)"></span><strong x-text="day.date.getDate()"></strong></span></template>
      </div>
      <div class="lyra-calview__scroll" tabindex="0" aria-label="Calendar hours">
        <div class="lyra-calview__grid" :style="gridStyle()">
          <div class="lyra-calview__ruler" :style="{ height: gridHeight() + 'px' }">
            <template x-for="hour in hours()" :key="hour"><span class="lyra-calview__hour" :style="hourStyle(hour)" x-text="String(hour).padStart(2, '0') + ':00'"></span></template>
          </div>
          <template x-for="day in days()" :key="day.key"><div class="lyra-calview__col" :data-day="day.key" :style="{ height: gridHeight() + 'px', backgroundSize: '100% 48px' }" @click="createSlot($event, day)">
            <template x-for="(window, index) in day.windows" :key="index"><span class="lyra-calview__avail" :style="availabilityStyle(window)"></span></template>
            <span class="lyra-calview__now" x-show="nowStyle(day)" :style="nowStyle(day) || {}"></span>
            <template x-for="item in day.events" :key="item.id"><button type="button" class="lyra-calview__evt" :class="{ ['lyra-calview__evt--' + item.kind]: true }" :style="eventStyle(item)" :aria-label="eventLabel(item)" @click="openEvent($event, item)"><span class="lyra-calview__evt-time" x-text="time(item.startDate) + '–' + time(item.endDate)"></span><span class="lyra-calview__evt-title" x-show="parseFloat(eventStyle(item).height) >= 34" x-text="item.title"></span></button></template>
          </div></template>
        </div>
        <div class="lyra-calview__pop" role="dialog" :aria-label="popover?.event.title" x-show="popover" :style="popover ? { top: popover.top + 'px', left: popover.left + 'px' } : {}"><span x-text="popover?.event.title"></span><button type="button" @click="closePopover()">Close</button></div>
      </div>
    </div>
    <div class="lyra-calview__mgrid" x-show="view === 'month'">
      <template x-for="(name, index) in weekdays()" :key="index"><span class="lyra-calview__head-cell" x-text="name"></span></template>
      <template x-for="day in days()" :key="day.key"><button class="lyra-calview__mcell" type="button" :class="monthClass(day)" @click="selectMonthDay(day)"><span class="lyra-calview__mday" x-text="day.date.getDate()"></span><template x-for="item in monthEvents(day)" :key="item.id"><span class="lyra-calview__mevt" :class="{ ['lyra-calview__evt--' + item.kind]: true }" x-text="time(item.startDate) + ' ' + item.title"></span></template><span class="lyra-calview__more" x-show="monthMore(day)" x-text="'+' + monthMore(day)"></span></button></template>
    </div>
  </div>`;
}

function mount(options: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = markup(options);
  document.body.appendChild(host);
  Alpine.initTree(host);
  hosts.push(host);
  return host;
}

async function flush(): Promise<void> {
  await Alpine.nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

afterEach(() => {
  for (const host of hosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraCalendarView', () => {
  it('accepts externally controlled date and view through x-modelable scopes', async () => {
    const host = document.createElement('div');
    const controlled = markup("{ defaultDate: '2026-08-12' }")
      .replace(
        'class="lyra-calview" x-data=',
        'class="lyra-calview" x-modelable="date" x-model="externalDate" x-data=',
      )
      .replace(
        'class="lyra-calview__seg" role=',
        'class="lyra-calview__seg" x-data="{ get viewModel() { return view }, set viewModel(v) { view = v } }" x-modelable="viewModel" x-model="externalView" role=',
      );
    host.innerHTML = `<div x-data="{ externalDate: '2026-08-15', externalView: 'month' }">${controlled}<button id="set-models" @click="externalDate = '2026-08-21'; externalView = 'day'">Set models</button></div>`;
    document.body.appendChild(host);
    Alpine.initTree(host);
    hosts.push(host);
    await flush();
    expect(host.querySelector('.lyra-calview__title')?.textContent).toContain('August 2026');
    expect(host.querySelector('[aria-pressed="true"]')?.textContent).toBe('Month');
    (host.querySelector('#set-models') as HTMLButtonElement).click();
    await flush();
    expect(host.querySelector('[aria-pressed="true"]')?.textContent).toBe('Day');
    expect(host.querySelector('.lyra-calview__title')?.textContent).toContain('21');
  });

  it('navigates day/week/month, emits local model values and translates labels', async () => {
    const host = mount(
      "{ defaultDate: '2026-08-12', locale: 'pt-BR', labels: { next: 'Próximo', view: 'Visão', day: 'Dia', week: 'Semana', month: 'Mês' } }",
    );
    const changes: unknown[] = [];
    host.addEventListener('lyra:view-change', (event) =>
      changes.push((event as CustomEvent).detail),
    );
    host.addEventListener('lyra:change', (event) => changes.push((event as CustomEvent).detail));
    await flush();
    expect(host.querySelector('[aria-label="Visão"]')).not.toBeNull();
    expect(host.querySelector('[aria-label="Próximo"]')).not.toBeNull();
    (host.querySelector('[aria-label="Próximo"]') as HTMLButtonElement).click();
    await flush();
    expect(changes).toContain('2026-08-19');
    (host.querySelectorAll('.lyra-calview__seg button')[2] as HTMLButtonElement).click();
    await flush();
    expect(changes).toContain('month');
    expect(host.querySelectorAll('.lyra-calview__mcell')).toHaveLength(42);
    (host.querySelector('.lyra-calview__mcell') as HTMLButtonElement).click();
    await flush();
    expect(changes).toContain('day');
    expect(host.querySelector('[aria-pressed="true"]')?.textContent).toBe('Dia');
  });

  it('places events by minute, availability, snapped slots and anchored popovers', async () => {
    const host =
      mount(`{ defaultDate: '2026-08-12', defaultView: 'day', startHour: 7, endHour: 10, slotStep: 15,
      events: [{ id: 1, title: 'Visit', start: '2026-08-12T08:30:00', end: '2026-08-12T09:00:00' }],
      availability: { 3: [{ start: '08:00', end: '09:00' }] } }`);
    const opened: unknown[] = [];
    const slots: Date[] = [];
    host.addEventListener('lyra:event-open', (event) => opened.push((event as CustomEvent).detail));
    host.addEventListener('lyra:slot-create', (event) => slots.push((event as CustomEvent).detail));
    await flush();
    const chip = host.querySelector<HTMLElement>('.lyra-calview__evt')!;
    expect(chip.style.top).toBe('73px');
    expect(chip.style.height).toBe('22px');
    expect(host.querySelector<HTMLElement>('.lyra-calview__avail')?.style.top).toBe('48px');
    expect(chip.getAttribute('aria-label')).toContain('08:30 — Visit');
    const col = host.querySelector<HTMLElement>('.lyra-calview__col')!;
    col.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientY: col.getBoundingClientRect().top + 80 }),
    );
    expect(slots[0]?.getHours()).toBe(8);
    expect(slots[0]?.getMinutes()).toBe(30);
    const scroll = host.querySelector<HTMLElement>('.lyra-calview__scroll')!;
    const chipRect = chip.getBoundingClientRect();
    const scrollRect = scroll.getBoundingClientRect();
    chip.click();
    await flush();
    expect(opened).toHaveLength(1);
    const pop = host.querySelector<HTMLElement>('.lyra-calview__pop')!;
    expect(pop.style.display).not.toBe('none');
    expect(pop.getAttribute('role')).toBe('dialog');
    expect(parseFloat(pop.style.top)).toBeCloseTo(
      chipRect.top - scrollRect.top + scroll.scrollTop + Math.min(chipRect.height, 32),
    );
    expect(parseFloat(pop.style.left)).toBeCloseTo(
      Math.max(0, Math.min(chipRect.left - scrollRect.left + 8, scrollRect.width - 240)),
    );
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await flush();
    expect(pop.style.display).toBe('none');
    chip.click();
    await flush();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await flush();
    expect(pop.style.display).toBe('none');
    chip.click();
    await flush();
    window.dispatchEvent(new Event('resize'));
    await flush();
    expect(pop.style.display).toBe('none');
  });

  it('keeps toolbar and event controls accessible', async () => {
    const host = mount("{ defaultDate: '2026-08-12', defaultView: 'day' }");
    await flush();
    await expectNoAxeViolations(host);
  });
});
