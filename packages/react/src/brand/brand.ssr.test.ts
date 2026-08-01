import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Brand } from './index';

describe('Brand SSR', () => {
  it('renders a themed linked wordmark without throwing', () =>
    expect(
      renderToString(
        createElement(Brand, {
          mark: '/mark.svg',
          markDark: '/mark-light.svg',
          href: '/',
          children: 'Lyra',
        }),
      ),
    ).toContain('lyra-brand'));
});
