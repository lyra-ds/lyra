import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Card } from './index';
describe('Card SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(Card, { title: 'Title' }, 'Body'))).toContain(
      'lyra-card__header',
    ));
});
