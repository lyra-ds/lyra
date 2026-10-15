import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../styles.css';

let root: HTMLElement;

afterEach(() => root?.remove());

async function pressedAppearance(item: HTMLElement): Promise<string[]> {
  const samples: { active: boolean; trusted: boolean; appearance: string[] }[] = [];
  const onMove = (event: MouseEvent) => {
    if (event.buttons !== 1) return;
    const style = getComputedStyle(item);
    samples.push({
      active: item.matches(':active'),
      trusted: event.isTrusted,
      appearance: [
        style.color,
        style.backgroundColor,
        style.opacity,
        style.cursor,
        style.transform,
      ],
    });
  };
  item.addEventListener('mousemove', onMove);
  try {
    // Moving within the item samples a real held press after mousedown's default action.
    // Keyboard Space does not establish :active consistently across browser engines.
    await userEvent.dragAndDrop(item, item, {
      force: true,
      sourcePosition: { x: 8, y: 8 },
      targetPosition: { x: 9, y: 8 },
    });
  } finally {
    item.removeEventListener('mousemove', onMove);
  }
  expect(samples.length).toBeGreaterThan(0);
  for (const sample of samples) {
    expect(sample.trusted).toBe(true);
    expect(sample.active).toBe(true);
  }
  const [first] = samples;
  if (!first) throw new Error('Expected a held pointer press');
  for (const sample of samples) expect(sample.appearance).toEqual(first.appearance);
  return first.appearance;
}

describe.each(['light', 'dark'])('disabled menu items in %s theme', (theme) => {
  it('keeps native and ARIA-disabled items muted through hover, pointer press and keyboard activation', async () => {
    root = document.createElement('div');
    root.dataset.theme = theme;
    root.innerHTML = `
      <div class="lyra-menu" role="menu">
        <button class="lyra-menu__item" disabled>Native disabled</button>
        <button class="lyra-menu__item" aria-disabled="true">ARIA disabled</button>
        <a class="lyra-menu__item lyra-menu__item--danger" aria-disabled="true" href="#">Disabled link</a>
        <button class="lyra-menu__item lyra-menu__item--danger" disabled>Disabled danger</button>
        <button class="lyra-menu__item">Enabled</button>
        <button class="lyra-menu__item lyra-menu__item--danger">Enabled danger</button>
      </div>
      <i style="color: var(--text-secondary); background: var(--surface-sunken)"></i>
      <i style="color: var(--text-primary)"></i>
      <i style="color: var(--danger-text); background: var(--danger-soft)"></i>
    `;
    root.addEventListener('click', (event) => event.preventDefault());
    document.body.appendChild(root);
    const items = root.querySelectorAll<HTMLElement>('.lyra-menu__item');
    const references = root.querySelectorAll('i');
    const secondary = references[0];
    const primary = references[1];
    const danger = references[2];
    if (!secondary || !primary || !danger) throw new Error('Expected token references');
    for (const item of Array.from(items).slice(0, 4)) {
      const appearance = () => {
        const style = getComputedStyle(item);
        return [style.color, style.backgroundColor, style.opacity, style.cursor, style.transform];
      };
      const expected = [
        getComputedStyle(secondary).color,
        'rgba(0, 0, 0, 0)',
        '0.5',
        'not-allowed',
        'none',
      ];
      expect(appearance()).toEqual(expected);
      await userEvent.hover(item);
      await expect.poll(appearance).toEqual(expected);
      if (!item.matches(':disabled')) {
        expect(await pressedAppearance(item)).toEqual(expected);
      }
      if (!item.matches(':disabled') && item.tagName === 'BUTTON') {
        item.focus();
        await userEvent.keyboard('[Space>]');
        try {
          expect(appearance()).toEqual(expected);
        } finally {
          await userEvent.keyboard('[/Space]');
        }
      }
    }
    const enabled = items[4];
    const enabledDanger = items[5];
    if (!enabled || !enabledDanger) throw new Error('Expected enabled controls');
    expect(getComputedStyle(enabled).opacity).toBe('1');
    expect(getComputedStyle(enabled).color).toBe(getComputedStyle(secondary).color);
    await userEvent.hover(enabled);
    await expect
      .poll(() => getComputedStyle(enabled).backgroundColor)
      .toBe(getComputedStyle(secondary).backgroundColor);
    await expect.poll(() => getComputedStyle(enabled).color).toBe(getComputedStyle(primary).color);
    expect(await pressedAppearance(enabled)).toEqual([
      getComputedStyle(primary).color,
      getComputedStyle(secondary).backgroundColor,
      '1',
      'pointer',
      'matrix(1, 0, 0, 1, 0, 0.5)',
    ]);
    enabled.focus();
    await userEvent.keyboard(' ');
    await userEvent.hover(enabledDanger);
    await expect
      .poll(() => getComputedStyle(enabledDanger).backgroundColor)
      .toBe(getComputedStyle(danger).backgroundColor);
    await expect
      .poll(() => getComputedStyle(enabledDanger).color)
      .toBe(getComputedStyle(danger).color);
    expect(await pressedAppearance(enabledDanger)).toEqual([
      getComputedStyle(danger).color,
      getComputedStyle(danger).backgroundColor,
      '1',
      'pointer',
      'matrix(1, 0, 0, 1, 0, 0.5)',
    ]);
  });
});
