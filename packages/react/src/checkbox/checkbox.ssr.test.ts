import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Checkbox } from './index';

describe('Checkbox SSR', () => {
  it('renders without throwing', () =>
    expect(renderToString(createElement(Checkbox, { label: 'Accept terms' }))).toContain(
      'lyra-checkbox',
    ));
});
