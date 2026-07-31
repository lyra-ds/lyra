import { beforeAll, describe, expect, it } from 'vitest';
import '../styles.css';

/**
 * `.lyra-stack` and `.lyra-grid` are the package's only additive layout extensions: the handoff's
 * React components emit both class names but the handoff stylesheet defines no rule for either,
 * putting the whole appearance in an inline `style` prop. That is the one shape a Vue, Blade or
 * LiveView adapter cannot reuse, so the declarations were moved here and the dynamic parts became
 * custom properties.
 *
 * Those custom-property NAMES are therefore public API — an adapter in another framework sets
 * them. This suite pins the default values and the override contract so a rename or a default
 * change cannot happen silently.
 */

let root: HTMLElement;

beforeAll(() => {
  document.body.innerHTML = `
    <div id="layout-root">
      <div class="lyra-stack" data-probe="stack-default"><i>a</i><i>b</i></div>
      <div class="lyra-stack" data-probe="stack-custom"
           style="--lyra-stack-direction: row; --lyra-stack-gap: var(--space-2);
                  --lyra-stack-align: center; --lyra-stack-justify: space-between;
                  --lyra-stack-wrap: wrap"><i>a</i><i>b</i></div>
      <div class="lyra-stack" data-probe="stack-broken"
           style="--lyra-stack-direction: not-a-direction; --lyra-stack-wrap: wrap"><i>a</i></div>
      <div class="lyra-grid" data-probe="grid-default"><i>a</i><i>b</i></div>
      <div class="lyra-grid" data-probe="grid-custom"
           style="--lyra-grid-columns: repeat(3, minmax(0, 1fr)); --lyra-grid-gap: var(--space-6)">
        <i>a</i><i>b</i><i>c</i>
      </div>
      <div class="lyra-container" data-probe="container">x</div>
    </div>`;
  root = document.getElementById('layout-root')!;
});

const cs = (probe: string): CSSStyleDeclaration =>
  getComputedStyle(root.querySelector<HTMLElement>(`[data-probe="${probe}"]`)!);

describe('.lyra-stack', () => {
  it('defaults mirror the handoff component defaults (column, gap 4, stretch, nowrap)', () => {
    const s = cs('stack-default');
    expect(s.display).toBe('flex');
    expect(s.flexDirection).toBe('column');
    expect(s.gap).toBe('16px'); // --space-4
    expect(s.alignItems).toBe('stretch');
    expect(s.flexWrap).toBe('nowrap');
  });

  it('every knob is overridable through its custom property', () => {
    const s = cs('stack-custom');
    expect(s.flexDirection).toBe('row');
    expect(s.gap).toBe('8px'); // --space-2
    expect(s.alignItems).toBe('center');
    expect(s.justifyContent).toBe('space-between');
    expect(s.flexWrap).toBe('wrap');
  });

  it('an invalid knob does not take the others down with it', () => {
    // This is why flex-direction and flex-wrap stay longhands instead of the `flex-flow`
    // shorthand stylelint asks for: in the shorthand form an invalid custom property makes the
    // whole declaration invalid at computed-value time and resets BOTH. Collapsing them would
    // turn this assertion red.
    expect(cs('stack-broken').flexWrap).toBe('wrap');
  });
});

describe('.lyra-grid', () => {
  it('defaults to two equal columns with gap 4', () => {
    const s = cs('grid-default');
    expect(s.display).toBe('grid');
    expect(s.gridTemplateColumns.split(' ')).toHaveLength(2);
    expect(s.gap).toBe('16px');
  });

  it('takes an arbitrary column template and gap', () => {
    const s = cs('grid-custom');
    expect(s.gridTemplateColumns.split(' ')).toHaveLength(3);
    expect(s.gap).toBe('24px'); // --space-6
  });
});

describe('.lyra-container', () => {
  it('caps at the container token and centers itself', () => {
    const s = cs('container');
    expect(s.maxWidth).toBe('1200px');
    expect(s.marginLeft).toBe(s.marginRight);
  });
});
