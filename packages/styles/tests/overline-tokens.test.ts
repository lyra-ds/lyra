import { beforeAll, describe, expect, it } from 'vitest';
import '../styles.css';

const labels = [
  { selector: '.lyra-table th', tracking: 'var(--tracking-caps)' },
  { selector: '.lyra-diff__overline', tracking: 'var(--tracking-caps)' },
  { selector: '.lyra-menu__label', tracking: 'var(--tracking-caps)' },
  { selector: '.lyra-cmdk__group-label', tracking: 'var(--tracking-caps)' },
  { selector: '.lyra-wssw__pop-label', tracking: 'var(--tracking-caps)' },
  { selector: '.lyra-sbgroup__label', tracking: 'var(--tracking-caps)' },
  { selector: '.lyra-fm__head', tracking: 'var(--tracking-caps)' },
  { selector: '.lyra-toc__title', tracking: 'var(--tracking-caps)' },
  { selector: '.lyra-code__lang', tracking: 'var(--tracking-caps)' },
  { selector: '.lyra-pageheader__eyebrow', tracking: 'var(--tracking-caps)' },
  { selector: '.lyra-combobox__group', tracking: '0.06em' },
  { selector: '.lyra-cal__wd', tracking: '0.04em' },
  { selector: '.lyra-sched__copy-title', tracking: '0.04em' },
  { selector: '.lyra-calview__head-cell', tracking: '0.04em' },
] as const;

const markup = () => `
  <table class="lyra-table"><thead><tr><th>Event <button class="lyra-table__sortbtn">Sort</button></th></tr></thead></table>
  ${labels
    .slice(1)
    .map(({ selector }) => `<span class="${selector.slice(1)}">Delivery status</span>`)
    .join('')}
`;

let defaultScope: HTMLElement;
let overrideScope: HTMLElement;

beforeAll(() => {
  defaultScope = document.createElement('section');
  defaultScope.innerHTML = markup();
  overrideScope = document.createElement('section');
  overrideScope.style.setProperty('--overline-transform', 'none');
  overrideScope.style.setProperty('--overline-tracking', 'normal');
  overrideScope.innerHTML = markup();
  document.body.append(defaultScope, overrideScope);
});

describe('overline typography tokens', () => {
  it('preserves every label’s uppercase transform and original tracking by default', () => {
    for (const { selector, tracking } of labels) {
      const label = defaultScope.querySelector<HTMLElement>(selector)!;
      const style = getComputedStyle(label);
      const reference = document.createElement('span');
      reference.style.fontSize = style.fontSize;
      reference.style.letterSpacing = tracking;
      defaultScope.append(reference);

      expect(style.textTransform, selector).toBe('uppercase');
      expect(style.letterSpacing, selector).toBe(getComputedStyle(reference).letterSpacing);
      reference.remove();
    }
    const header = defaultScope.querySelector('th')!;
    const sortButton = defaultScope.querySelector('.lyra-table__sortbtn')!;
    expect(getComputedStyle(sortButton).textTransform).toBe(getComputedStyle(header).textTransform);
    expect(getComputedStyle(sortButton).letterSpacing).toBe(getComputedStyle(header).letterSpacing);
  });

  it('uses sentence case and normal tracking for every label in an overridden scope', () => {
    for (const { selector } of labels) {
      const style = getComputedStyle(overrideScope.querySelector(selector)!);
      expect(style.textTransform, selector).toBe('none');
      expect(style.letterSpacing, selector).toBe('normal');
    }
    const sortButton = overrideScope.querySelector('.lyra-table__sortbtn')!;
    expect(getComputedStyle(sortButton).textTransform).toBe('none');
    expect(getComputedStyle(sortButton).letterSpacing).toBe('normal');
  });
});
