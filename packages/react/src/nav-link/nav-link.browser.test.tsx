import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { NavLink } from './index';

afterEach(cleanup);

describe('NavLink', () => {
  it('renders an anchor with active visual and accessible state', async () => {
    const screen = await render(
      <NavLink href="/docs" active>
        Docs
      </NavLink>,
    );
    const link = screen.container.querySelector<HTMLAnchorElement>('a')!;

    await expect.element(screen.getByRole('link', { name: 'Docs' })).toBeInTheDocument();
    expect(link.className).toContain('lyra-navlink--active');
    expect(link.getAttribute('aria-current')).toBe('page');
    await expectNoAxeViolations(screen.container);
  });

  it('merges props into the asChild anchor without creating another focusable element', async () => {
    const screen = await render(
      <NavLink asChild active className="consumer-link" title="Documentation">
        <a href="/docs" className="child-link">
          Docs
        </a>
      </NavLink>,
    );
    const links = screen.container.querySelectorAll('a');
    const link = links[0];

    expect(links).toHaveLength(1);
    expect(link.className).toContain('lyra-navlink');
    expect(link.className).toContain('lyra-navlink--active');
    expect(link.className).toContain('consumer-link');
    expect(link.className).toContain('child-link');
    expect(link.getAttribute('title')).toBe('Documentation');
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(
      screen.container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea'),
    ).toHaveLength(1);
  });

  it('uses the design-system focus shadow for keyboard focus', async () => {
    const screen = await render(<NavLink href="/docs">Docs</NavLink>);
    const link = screen.container.querySelector<HTMLAnchorElement>('a')!;

    link.focus();
    expect(getComputedStyle(link).boxShadow).not.toBe('none');
  });
});
