import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Container } from './index';

afterEach(cleanup);

describe('Container', () => {
  it('uses the inherited container maximum when max is omitted', async () => {
    const { container } = await render(<Container>Content</Container>);
    const content = container.querySelector<HTMLElement>('.lyra-container')!;

    expect(content.getAttribute('style')).toBeNull();
    await expectNoAxeViolations(container);
  });

  it('sets max as the cascading container custom property', async () => {
    const { container } = await render(<Container max={960}>Content</Container>);
    const content = container.querySelector<HTMLElement>('.lyra-container')!;

    expect(Array.from(content.style)).toEqual(['--container-max']);
    expect(content.style.getPropertyValue('--container-max')).toBe('960px');
  });

  it('maps size keywords to a valid pixel width', async () => {
    const { container } = await render(<Container max="lg">Content</Container>);
    const content = container.querySelector<HTMLElement>('.lyra-container')!;

    expect(content.style.getPropertyValue('--container-max')).toBe('1024px');
    expect(getComputedStyle(content).maxWidth).toBe('1024px');
  });
});
