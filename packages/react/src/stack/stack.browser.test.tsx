import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Inline, Stack } from './index';

afterEach(cleanup);

function customPropertyNames(element: HTMLElement): string[] {
  return Array.from(element.style).filter((name) => name.startsWith('--lyra-stack-'));
}

describe('Stack', () => {
  it('uses stylesheet defaults without an inline style attribute', async () => {
    const { container } = await render(<Stack>Content</Stack>);
    const stack = container.querySelector<HTMLElement>('.lyra-stack')!;

    expect(stack.getAttribute('style')).toBeNull();
    expect((await axe.run(container)).violations).toEqual([]);
  });

  it.each([
    ['direction', { direction: 'row' as const }, '--lyra-stack-direction', 'row'],
    ['default gap step', { gap: 4 }, '--lyra-stack-gap', 'var(--space-4)'],
    ['gap step', { gap: 6 }, '--lyra-stack-gap', 'var(--space-6)'],
    ['gap string', { gap: '2rem' }, '--lyra-stack-gap', '2rem'],
    ['alignment', { align: 'center' as const }, '--lyra-stack-align', 'center'],
    [
      'justification',
      { justify: 'space-between' as const },
      '--lyra-stack-justify',
      'space-between',
    ],
    ['wrapping', { wrap: true }, '--lyra-stack-wrap', 'wrap'],
  ])('sets only the %s custom property', async (_name, props, property, value) => {
    const { container } = await render(<Stack {...props}>Content</Stack>);
    const stack = container.querySelector<HTMLElement>('.lyra-stack')!;

    expect(customPropertyNames(stack)).toEqual([property]);
    expect(stack.style.getPropertyValue(property)).toBe(value);
  });
});

describe('Inline', () => {
  it('is a wrapping, centered row with gap step two', async () => {
    const { container } = await render(<Inline>Content</Inline>);
    const inline = container.querySelector<HTMLElement>('.lyra-stack')!;

    expect(customPropertyNames(inline)).toEqual([
      '--lyra-stack-direction',
      '--lyra-stack-gap',
      '--lyra-stack-align',
      '--lyra-stack-wrap',
    ]);
    expect(inline.style.getPropertyValue('--lyra-stack-direction')).toBe('row');
    expect(inline.style.getPropertyValue('--lyra-stack-gap')).toBe('var(--space-2)');
    expect(inline.style.getPropertyValue('--lyra-stack-align')).toBe('center');
    expect(inline.style.getPropertyValue('--lyra-stack-wrap')).toBe('wrap');
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
