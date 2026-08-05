import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Brand } from './index';

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
});

describe('Brand', () => {
  it('swaps two marks with CSS while exposing its wordmark once', async () => {
    const screen = await render(
      <Brand mark="/mark.svg" markDark="/mark-light.svg" href="/">
        Lyra
      </Brand>,
    );

    await expect.element(screen.getByRole('link', { name: 'Lyra' })).toBeInTheDocument();
    const brand = screen.container.querySelector<HTMLElement>('.lyra-brand');
    expect(brand).not.toBeNull();
    if (brand == null) return;

    const marks = brand.querySelectorAll('img');
    expect(marks).toHaveLength(2);
    const [lightMark, darkMark] = Array.from(marks);
    expect(lightMark).toBeDefined();
    expect(darkMark).toBeDefined();
    if (lightMark == null || darkMark == null) return;

    expect([lightMark, darkMark].every((mark) => mark.getAttribute('alt') === '')).toBe(true);
    expect(getComputedStyle(lightMark).display).not.toBe('none');
    expect(getComputedStyle(darkMark).display).toBe('none');

    document.documentElement.dataset.theme = 'dark';
    expect(getComputedStyle(lightMark).display).toBe('none');
    expect(getComputedStyle(darkMark).display).not.toBe('none');
    await expectNoAxeViolations(screen.container);
  });

  it('renders one mark with a translated accessible name when there is no wordmark', async () => {
    const screen = await render(<Brand mark="/mark.svg" aria-label="Marca Lyra" />);

    await expect.element(screen.getByRole('img', { name: 'Marca Lyra' })).toBeInTheDocument();
    const brand = screen.container.querySelector<HTMLElement>('.lyra-brand');
    expect(brand).not.toBeNull();
    if (brand == null) return;

    expect(brand.querySelectorAll('img')).toHaveLength(1);
    await expectNoAxeViolations(screen.container);
  });

  it('renders a non-interactive span without href', async () => {
    const screen = await render(<Brand mark="/mark.svg">Lyra</Brand>);

    await expect.element(screen.getByText('Lyra')).toBeInTheDocument();
    const brand = screen.container.querySelector<HTMLElement>('.lyra-brand');
    expect(brand).not.toBeNull();
    if (brand == null) return;

    expect(brand.tagName).toBe('SPAN');
    expect(screen.container.querySelectorAll('a, button, input, select, textarea')).toHaveLength(0);
  });

  it('merges props into one asChild link', async () => {
    const screen = await render(
      <Brand asChild mark="/mark.svg" className="consumer-brand" title="Lyra home">
        <a href="/" className="child-brand">
          Lyra
        </a>
      </Brand>,
    );

    await expect.element(screen.getByRole('link', { name: 'Lyra' })).toBeInTheDocument();
    const links = screen.container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    const link = links[0];
    expect(link).toBeDefined();
    if (link == null) return;

    expect(link.className).toContain('lyra-brand');
    expect(link.className).toContain('consumer-brand');
    expect(link.className).toContain('child-brand');
    expect(link.getAttribute('title')).toBe('Lyra home');
    expect(
      screen.container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea'),
    ).toHaveLength(1);
  });

  it('uses the CSS default mark size without an inline style', async () => {
    const screen = await render(<Brand mark="/mark.svg">Lyra</Brand>);

    await expect.element(screen.getByText('Lyra')).toBeInTheDocument();
    const brand = screen.container.querySelector<HTMLElement>('.lyra-brand');
    expect(brand).not.toBeNull();
    if (brand == null) return;

    const mark = brand.querySelector<HTMLElement>('.lyra-brand__mark');
    expect(mark).not.toBeNull();
    if (mark == null) return;

    expect(brand.getAttribute('style')).toBeNull();
    expect(getComputedStyle(mark).width).toBe('24px');
  });

  it('sets the mark size custom property', async () => {
    const screen = await render(
      <Brand mark="/mark.svg" size={32}>
        Lyra
      </Brand>,
    );

    await expect.element(screen.getByText('Lyra')).toBeInTheDocument();
    const brand = screen.container.querySelector<HTMLElement>('.lyra-brand');
    expect(brand).not.toBeNull();
    if (brand == null) return;

    expect(Array.from(brand.style)).toEqual(['--brand-mark-size']);
    expect(brand.style.getPropertyValue('--brand-mark-size')).toBe('32px');
  });
});
