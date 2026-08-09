import { beforeAll, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../styles.css';

/**
 * Across the system, an idle `:hover` rule carries more specificity than the `--active` class it
 * sits next to (`:hover:not(:disabled)` is 0-3-0, a bare `:hover` 0-2-0, `--active` only 0-1-0), so
 * without an explicit override the selected item loses its accent treatment the moment the pointer
 * lands on it — the selection appears to vanish under the cursor.
 *
 * The DS answer is the one `.lyra-page--active:hover` already used: state the hovered-active
 * treatment explicitly, as a tinted step of the active treatment, so hover still gives feedback
 * without overwriting the selection. This suite pins that precedence for every component that
 * carries the pattern.
 *
 * Every assertion polls: these components transition `background`/`color`, so reading the computed
 * style right after the pointer moves returns the interpolated start value, not the settled one.
 */

let root: HTMLElement;

beforeAll(() => {
  document.body.innerHTML = `
    <div id="active-hover-root">
      <div class="lyra-segmented" role="radiogroup">
        <button class="lyra-segmented__option lyra-segmented__option--active"
                data-probe="segmented-active" role="radio" aria-checked="true">Ativo</button>
        <button class="lyra-segmented__option" data-probe="segmented-idle" role="radio"
                aria-checked="false">Inativo</button>
      </div>

      <div class="lyra-sbgroup__items">
        <button class="lyra-sbgroup__item lyra-sbgroup__item--active"
                data-probe="sbitem-active">Ativo</button>
        <button class="lyra-sbgroup__item" data-probe="sbitem-idle">Inativo</button>
      </div>

      <div class="lyra-tabs">
        <button class="lyra-tab lyra-tab--active" data-probe="tab-active">Ativo</button>
        <button class="lyra-tab" data-probe="tab-idle">Inativo</button>
      </div>

      <i data-probe="ref-accent-soft" style="background: var(--accent-soft)"></i>
      <i data-probe="ref-accent-soft-hover"
         style="background: color-mix(in oklab, var(--accent-soft), var(--accent) 14%)"></i>
      <i data-probe="ref-sunken" style="background: var(--surface-sunken)"></i>
      <i data-probe="ref-accent" style="color: var(--accent)"></i>
      <i data-probe="ref-accent-hover" style="color: var(--accent-hover)"></i>
      <i data-probe="ref-text-primary" style="color: var(--text-primary)"></i>
      <i data-probe="ref-accent-soft-text" style="color: var(--accent-soft-text)"></i>
    </div>`;
  root = document.getElementById('active-hover-root')!;
});

const el = (probe: string): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-probe="${probe}"]`)!;
const bg = (probe: string): string => getComputedStyle(el(probe)).backgroundColor;
const fg = (probe: string): string => getComputedStyle(el(probe)).color;
const settle = (read: () => string) => expect.poll(read, { timeout: 2000 });

describe('.lyra-segmented__option--active under hover', () => {
  it('keeps an accent surface instead of falling back to the idle hover surface', async () => {
    await userEvent.hover(el('segmented-active'));

    await settle(() => bg('segmented-active')).toBe(bg('ref-accent-soft-hover'));
    expect(bg('segmented-active')).not.toBe(bg('ref-sunken'));
  });

  it('still shifts from its resting surface, so hover keeps its affordance', async () => {
    await userEvent.hover(el('segmented-active'));

    await settle(() => bg('segmented-active')).not.toBe(bg('ref-accent-soft'));
  });

  it('leaves the idle option hover untouched', async () => {
    await userEvent.hover(el('segmented-idle'));

    await settle(() => bg('segmented-idle')).toBe(bg('ref-sunken'));
  });
});

describe('.lyra-sbgroup__item--active under hover', () => {
  it('keeps an accent surface instead of falling back to the idle hover surface', async () => {
    await userEvent.hover(el('sbitem-active'));

    await settle(() => bg('sbitem-active')).toBe(bg('ref-accent-soft-hover'));
    expect(bg('sbitem-active')).not.toBe(bg('ref-sunken'));
  });

  it('still shifts from its resting surface, so hover keeps its affordance', async () => {
    await userEvent.hover(el('sbitem-active'));

    await settle(() => bg('sbitem-active')).not.toBe(bg('ref-accent-soft'));
  });

  it('leaves the idle item hover untouched', async () => {
    await userEvent.hover(el('sbitem-idle'));

    await settle(() => bg('sbitem-idle')).toBe(bg('ref-sunken'));
  });
});

/* The underline tab carries the selection in `color`, not in a surface. Dark theme already states
   the active tab's color at a higher specificity, so the pattern only ever misfired in light. */
describe('.lyra-tab--active under hover', () => {
  it('keeps an accent color instead of falling back to the idle hover color', async () => {
    await userEvent.hover(el('tab-active'));

    await settle(() => fg('tab-active')).toBe(fg('ref-accent-hover'));
    expect(fg('tab-active')).not.toBe(fg('ref-text-primary'));
  });

  it('still shifts from its resting color, so hover keeps its affordance', async () => {
    await userEvent.hover(el('tab-active'));

    await settle(() => fg('tab-active')).not.toBe(fg('ref-accent'));
  });

  it('leaves the idle tab hover untouched', async () => {
    await userEvent.hover(el('tab-idle'));

    await settle(() => fg('tab-idle')).toBe(fg('ref-text-primary'));
  });

  it('defers to the dark-theme active color, which already outranks the idle hover', async () => {
    root.setAttribute('data-theme', 'dark');
    try {
      await userEvent.hover(el('tab-active'));

      await settle(() => fg('tab-active')).toBe(fg('ref-accent-soft-text'));
      expect(fg('tab-active')).not.toBe(fg('ref-text-primary'));
    } finally {
      root.removeAttribute('data-theme');
    }
  });
});
