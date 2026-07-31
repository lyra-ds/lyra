import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Footer } from './index';

afterEach(cleanup);

describe('Footer', () => {
  it('omits every optional slot wrapper when slots are absent', async () => {
    const { container } = await render(<Footer />);

    await expect.element(container.querySelector('footer')!).toBeInTheDocument();
    expect(container.querySelector('.lyra-footer__brand')).toBeNull();
    expect(container.querySelector('.lyra-footer__note')).toBeNull();
    expect(container.querySelector('.lyra-footer__links')).toBeNull();
    expect((await axe.run(container)).violations).toEqual([]);
  });

  it('renders supplied links in a labelled navigation landmark', async () => {
    const screen = await render(
      <Footer linksLabel="Footer links" links={<a href="/license">License</a>} />,
    );

    await expect
      .element(screen.getByRole('navigation', { name: 'Footer links' }))
      .toBeInTheDocument();
  });
});
