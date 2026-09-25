import { afterEach, describe, expect, it } from 'vitest';
import '../styles.css';

const slots = Array.from(
  { length: 6 },
  (_, i) => `<button class="lyra-slotpicker__slot" role="option">${9 + i}:00 AM</button>`,
).join('');
const days = Array.from(
  { length: 35 },
  (_, i) => `<button class="lyra-cal__day">${i + 1}</button>`,
).join('');

const fixture = (width: number): void => {
  document.body.innerHTML = `
    <div data-probe="container" style="width:${width}px">
      <div class="lyra-slotpicker" data-probe="picker">
        <div class="lyra-slotpicker__side" data-probe="side">
          <div class="lyra-cal" data-probe="cal"><div class="lyra-cal__grid">${days}</div></div>
          <div class="lyra-slotpicker__tz">Times shown in America/New_York</div>
        </div>
        <div class="lyra-slotpicker__main" data-probe="main">
          <span class="lyra-slotpicker__daylabel">Tuesday</span>
          <div class="lyra-slotpicker__slots" role="listbox">${slots}</div>
        </div>
      </div>
    </div>`;
};

const probe = (name: string): HTMLElement =>
  document.querySelector<HTMLElement>(`[data-probe="${name}"]`)!;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('SlotPicker narrow containers (#97)', () => {
  for (const width of [320, 375]) {
    it(`fits a ${width}px container without horizontal overflow`, () => {
      fixture(width);
      const container = probe('container').getBoundingClientRect();
      for (const name of ['picker', 'side', 'cal', 'main']) {
        const box = probe(name).getBoundingClientRect();
        expect(box.right, `${name} right edge`).toBeLessThanOrEqual(container.right + 0.5);
        expect(box.left, `${name} left edge`).toBeGreaterThanOrEqual(container.left - 0.5);
      }
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
      expect(probe('picker').scrollWidth).toBeLessThanOrEqual(width);
      // Slot column wraps under the calendar and keeps 44px targets.
      expect(probe('main').getBoundingClientRect().top).toBeGreaterThanOrEqual(
        probe('side').getBoundingClientRect().bottom,
      );
      const slot = document.querySelector<HTMLElement>('.lyra-slotpicker__slot')!;
      expect(slot.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    });
  }

  it('keeps the desktop side-by-side layout when there is room', () => {
    fixture(640);
    const side = probe('side').getBoundingClientRect();
    const main = probe('main').getBoundingClientRect();
    expect(main.left).toBeGreaterThanOrEqual(side.right);
    expect(main.top).toBeLessThan(side.bottom);
    expect(probe('cal').getBoundingClientRect().width).toBe(252);
  });
});
